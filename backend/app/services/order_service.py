"""Order persistence service.

Separated from the route so that payment providers, inventory checks, and
coupon logic can be layered on later without touching the HTTP layer.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from pymongo import ReturnDocument

from ..db import get_db
from ..models.order import OrderCreate

logger = logging.getLogger("priya_sakshi.orders")


class OrderService:
    async def record_order(self, payload: OrderCreate) -> dict:
        order = {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "received",
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
            "payment": None,  # populated by future payment provider integration
        }

        await get_db().orders.insert_one(order)

        logger.info(
            "Order recorded id=%s email=%s items=%d total=%s",
            order["id"],
            order["customer_email"],
            len(order["items"]),
            order["total"],
        )

        return order

    async def get_order(self, order_id: str) -> dict | None:
        return await get_db().orders.find_one({"id": order_id})

    async def mark_payment_initiated(
        self,
        order_id: str,
        razorpay_order_id: str,
    ) -> None:
        """Called right after a Razorpay order is created for this order."""
        await get_db().orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "status": "pending_payment",
                    "payment": {
                        "provider": "razorpay",
                        "razorpay_order_id": razorpay_order_id,
                        "status": "created",
                    },
                }
            },
        )

    async def mark_payment_verified(
        self,
        *,
        order_id: str,
        razorpay_order_id: str,
        razorpay_payment_id: str,
    ) -> dict | None:
        """Called once the Razorpay signature has been verified."""
        return await get_db().orders.find_one_and_update(
            {"id": order_id},
            {
                "$set": {
                    "status": "paid",
                    "payment": {
                        "provider": "razorpay",
                        "razorpay_order_id": razorpay_order_id,
                        "razorpay_payment_id": razorpay_payment_id,
                        "status": "verified",
                        "verified_at": datetime.now(timezone.utc).isoformat(),
                    },
                }
            },
            return_document=ReturnDocument.AFTER,
        )


order_service = OrderService()
