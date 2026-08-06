"""Order persistence service.

Separated from the route so that payment providers, inventory checks, and
coupon logic can be layered on later without touching the HTTP layer.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from pymongo import ReturnDocument

from ..db import get_db, serialize_doc, serialize_docs
from ..models.order import OrderCreate
from .status import (
    normalize_order,
    normalize_orders,
    normalize_payment_status,
    normalize_shipment_status,
    payment_expiry_cutoff,
)

logger = logging.getLogger("priya_sakshi.orders")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class OrderService:
    async def record_order(self, payload: OrderCreate, user_id: Optional[str] = None) -> dict:
        now = _now()
        order = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "created_at": now,
            "shipment_status": "waiting_for_payment",
            # Mirrored for backward compatibility with clients reading `status`.
            "status": "waiting_for_payment",
            "payment_status": "awaiting_payment",
            "tracking_number": None,
            "courier": None,
            "estimated_delivery": None,
            "timeline": [
                {
                    "status": "waiting_for_payment",
                    "label": "Order Placed",
                    "at": now,
                    "note": "Your order has been placed. Awaiting payment.",
                }
            ],
            "customer_name": payload.customer_name,
            "customer_email": str(payload.customer_email),
            "phone": payload.phone,
            "items": [i.model_dump() for i in payload.items],
            "shipping": payload.shipping.model_dump() if payload.shipping else None,
            "currency": payload.currency,
            "subtotal": payload.subtotal,
            "shipping_fee": payload.shipping_fee,
            "total": payload.total,
            "notes": payload.notes,
            "payment": None,  # populated by payment provider integration
        }

        await get_db().orders.insert_one(order)

        logger.info(
            "Order recorded id=%s user=%s email=%s items=%d total=%s",
            order["id"],
            user_id,
            order["customer_email"],
            len(order["items"]),
            order["total"],
        )

        return normalize_order(serialize_doc(order))

    async def get_order(self, order_id: str) -> dict | None:
        return normalize_order(serialize_doc(await get_db().orders.find_one({"id": order_id})))

    async def list_orders_for_user(self, user_id: str, email: str | None = None) -> list[dict]:
        query: dict = {"user_id": user_id}
        if email:
            query = {"$or": [{"user_id": user_id}, {"customer_email": email.lower()}]}
        cursor = get_db().orders.find(query).sort("created_at", -1)
        return normalize_orders(serialize_docs(await cursor.to_list(length=None)))

    async def mark_payment_initiated(
        self,
        order_id: str,
        razorpay_order_id: str,
    ) -> None:
        """Called right after a Razorpay order is created for this order."""
        now = _now()
        await get_db().orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "payment_status": "awaiting_payment",
                    "payment": {
                        "provider": "razorpay",
                        "razorpay_order_id": razorpay_order_id,
                        "status": "created",
                    },
                },
                "$push": {
                    "timeline": {
                        "status": "awaiting_payment",
                        "label": "Payment Pending",
                        "at": now,
                        "note": "Awaiting payment confirmation.",
                    }
                },
            },
        )

    async def mark_payment_verified(
        self,
        *,
        order_id: str,
        razorpay_order_id: str,
        razorpay_payment_id: str,
    ) -> dict | None:
        """Called once the Razorpay signature has been verified.

        Payment status becomes 'paid'. Shipment status automatically becomes
        'Order Received', unless an admin has already moved it further along.
        """
        now = _now()
        current = serialize_doc(await get_db().orders.find_one({"id": order_id})) or {}
        set_fields: dict = {
            "payment_status": "paid",
            "payment": {
                "provider": "razorpay",
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "status": "verified",
                "verified_at": now,
            },
        }
        # Advance shipment only out of the pre-payment stage; never overwrite a
        # later stage an admin may have set.
        current_shipment = normalize_shipment_status(
            current.get("shipment_status") or current.get("status")
        )
        if current_shipment == "waiting_for_payment":
            set_fields["shipment_status"] = "order_received"
            set_fields["status"] = "order_received"

        updated = await get_db().orders.find_one_and_update(
            {"id": order_id},
            {
                "$set": set_fields,
                "$push": {
                    "timeline": {
                        "status": "paid",
                        "label": "Payment Confirmed",
                        "at": now,
                        "note": "Payment verified successfully.",
                    }
                },
            },
            return_document=ReturnDocument.AFTER,
        )
        return normalize_order(serialize_doc(updated))

    async def mark_payment_failed(self, order_id: str) -> dict | None:
        """Record a failed payment attempt; shipment stays pre-payment."""
        now = _now()
        updated = await get_db().orders.find_one_and_update(
            {"id": order_id},
            {
                "$set": {"payment_status": "failed"},
                "$push": {
                    "timeline": {
                        "status": "failed",
                        "label": "Payment Failed",
                        "at": now,
                        "note": "Payment could not be verified.",
                    }
                },
            },
            return_document=ReturnDocument.AFTER,
        )
        return normalize_order(serialize_doc(updated))

    async def cancel_expired_unpaid_orders(self) -> int:
        """Cancel orders still awaiting payment past the 12-hour window.

        Runs periodically from the app lifespan. Reads also apply the same rule
        on the fly (see ``status.resolve_statuses``), so this only persists what
        the API already reports.
        """
        cutoff = payment_expiry_cutoff().isoformat()
        now = _now()
        cursor = get_db().orders.find(
            {
                "created_at": {"$lt": cutoff},
                "payment_status": {"$nin": ["paid", "refunded", "cancelled"]},
            },
            {"id": 1, "payment_status": 1},
        )
        cancelled = 0
        for doc in await cursor.to_list(length=None):
            if normalize_payment_status(doc.get("payment_status")) != "awaiting_payment":
                continue
            await get_db().orders.update_one(
                {"id": doc["id"]},
                {
                    "$set": {
                        "payment_status": "cancelled",
                        "shipment_status": "cancelled",
                        "status": "cancelled",
                    },
                    "$push": {
                        "timeline": {
                            "status": "cancelled",
                            "label": "Cancelled",
                            "at": now,
                            "note": "Cancelled automatically — payment was not completed within 12 hours.",
                        }
                    },
                },
            )
            cancelled += 1
        if cancelled:
            logger.info("Auto-cancelled %d unpaid order(s) past the payment window", cancelled)
        return cancelled


order_service = OrderService()
