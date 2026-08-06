"""Admin service — order management, dashboard stats, customers, messages.

All methods are admin-only by virtue of the route dependency; this service
focuses on data access and side effects (email notifications on status
change).
"""

from __future__ import annotations

import logging
from typing import Optional

from pymongo import ReturnDocument

from ..db import get_db, serialize_doc, serialize_docs
from ..models.admin import AdminOrderUpdate
from .email_service import email_service
from .status import (
    normalize_order,
    normalize_orders,
    normalize_payment_status,
    normalize_shipment_status,
    PAID_ONLY_SHIPMENT_STATUSES,
    SHIPMENT_LABELS,
    SHIPMENT_STATUSES,
)


class ShipmentStatusError(ValueError):
    """Raised when a shipment status transition breaks a business rule."""

logger = logging.getLogger("priya_sakshi.admin")

# Shipment statuses that trigger a customer-facing email when an admin
# transitions to them. Maps canonical shipment status -> timeline note.
STATUS_TRANSITIONS = {
    "order_received": "We have received your order.",
    "preparing": "Your order is being prepared.",
    "packed": "Your order has been packed.",
    "shipped": "Your order is on its way.",
    "out_for_delivery": "Your order is out for delivery.",
    "delivered": "Your order has been delivered.",
    "cancelled": "Your order has been cancelled.",
    "returned": "Your order has been returned.",
}


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


class AdminService:
    # ---------- Dashboard ----------
    async def dashboard(self) -> dict:
        db = get_db()
        orders = db.orders

        total_orders = await orders.count_documents({})
        # Count by normalized order status; legacy values map into these buckets.
        def status_query(values: list[str]) -> dict:
            return {"$or": [{"shipment_status": {"$in": values}}, {"shipment_status": {"$exists": False}, "status": {"$in": values}}]}

        pending = await orders.count_documents(
            status_query(["waiting_for_payment", "pending_payment", "received", "order_received", "paid"])
        )
        processing = await orders.count_documents(
            status_query(["preparing", "confirmed", "processing", "packed"])
        )
        shipped = await orders.count_documents(status_query(["shipped", "out_for_delivery"]))
        delivered = await orders.count_documents(status_query(["delivered"]))

        # Revenue = sum of totals for paid orders.
        revenue_pipeline = [
            {"$match": {"payment_status": "paid"}},
            {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$total", 0]}}}},
        ]
        revenue_cursor = await orders.aggregate(revenue_pipeline).to_list(length=1)
        revenue = revenue_cursor[0]["total"] if revenue_cursor else 0.0

        total_customers = await db.users.count_documents({})

        recent_cursor = orders.find({}).sort("created_at", -1).limit(8)
        recent = normalize_orders(serialize_docs(await recent_cursor.to_list(length=8)))

        return {
            "total_orders": total_orders,
            "pending_orders": pending,
            "processing_orders": processing,
            "shipped_orders": shipped,
            "delivered_orders": delivered,
            "revenue": float(revenue),
            "total_customers": total_customers,
            "recent_orders": recent,
        }

    # ---------- Orders ----------
    async def list_orders(
        self,
        *,
        search: Optional[str] = None,
        shipment_status: Optional[str] = None,
        payment_status: Optional[str] = None,
        limit: int = 100,
        skip: int = 0,
    ) -> list[dict]:
        query: dict = {}
        if search:
            s = search.strip()
            if s:
                query["$or"] = [
                    {"customer_name": {"$regex": s, "$options": "i"}},
                    {"customer_email": {"$regex": s, "$options": "i"}},
                    {"phone": {"$regex": s, "$options": "i"}},
                    {"id": {"$regex": s, "$options": "i"}},
                ]
        cursor = get_db().orders.find(query).sort("created_at", -1)
        orders = normalize_orders(serialize_docs(await cursor.to_list(length=None)))

        # Status filters run on normalized values so legacy documents (which
        # stored a single mixed `status`) are matched correctly.
        if shipment_status and shipment_status != "all":
            wanted = normalize_shipment_status(shipment_status)
            orders = [o for o in orders if o["shipment_status"] == wanted]
        if payment_status and payment_status != "all":
            wanted = normalize_payment_status(payment_status)
            orders = [o for o in orders if o["payment_status"] == wanted]

        return orders[skip : skip + limit]

    async def get_order(self, order_id: str) -> dict | None:
        return normalize_order(serialize_doc(await get_db().orders.find_one({"id": order_id})))

    async def update_order(self, order_id: str, payload: AdminOrderUpdate) -> dict | None:
        """Admin update. Only shipment status and fulfillment fields are
        editable — payment status is read-only and owned by the payment flow.
        """
        existing = await get_db().orders.find_one({"id": order_id})
        if not existing:
            return None
        current = normalize_order(serialize_doc(existing))

        requested = payload.shipment_status or payload.status
        new_shipment: str | None = None
        if requested is not None:
            if requested not in SHIPMENT_STATUSES:
                raise ShipmentStatusError(f"Unknown shipment status '{requested}'")
            if (
                requested in PAID_ONLY_SHIPMENT_STATUSES
                and current["payment_status"] != "paid"
            ):
                raise ShipmentStatusError(
                    f"Shipment status cannot be set to '{SHIPMENT_LABELS[requested]}' "
                    "until the payment is Paid."
                )
            if requested != current["shipment_status"]:
                new_shipment = requested

        update_fields: dict = {}
        if new_shipment:
            update_fields["shipment_status"] = new_shipment
            # Mirrored so older clients reading `status` stay correct.
            update_fields["status"] = new_shipment
        if payload.courier is not None:
            update_fields["courier"] = payload.courier
        if payload.tracking_number is not None:
            update_fields["tracking_number"] = payload.tracking_number
        if payload.estimated_delivery is not None:
            update_fields["estimated_delivery"] = payload.estimated_delivery
        if payload.internal_notes is not None:
            update_fields["internal_notes"] = payload.internal_notes

        timeline_entry = None
        if new_shipment:
            note_text = STATUS_TRANSITIONS.get(new_shipment)
            if note_text:
                if payload.tracking_number:
                    note_text = f"{note_text} Tracking: {payload.tracking_number}"
                timeline_entry = {
                    "status": new_shipment,
                    "label": SHIPMENT_LABELS[new_shipment],
                    "at": _now(),
                    "note": note_text,
                }

        if not update_fields and not timeline_entry:
            return current

        update_doc: dict = {"$set": update_fields}
        if timeline_entry:
            update_doc["$push"] = {"timeline": timeline_entry}

        updated = await get_db().orders.find_one_and_update(
            {"id": order_id},
            update_doc,
            return_document=ReturnDocument.AFTER,
        )
        if updated and timeline_entry:
            # Fire-and-forget customer notification email.
            try:
                await email_service.send_order_status_update(normalize_order(serialize_doc(updated)))
            except Exception:
                logger.exception("Failed to send status update email for order %s", order_id)
        return normalize_order(serialize_doc(updated))

    # ---------- Customers ----------
    async def list_customers(self, search: Optional[str] = None) -> dict:
        db = get_db()
        match: dict = {}
        if search:
            s = search.strip()
            if s:
                match["$or"] = [
                    {"name": {"$regex": s, "$options": "i"}},
                    {"email": {"$regex": s, "$options": "i"}},
                    {"phone": {"$regex": s, "$options": "i"}},
                ]

        pipeline = [
            {"$match": match},
            {
                "$lookup": {
                    "from": "orders",
                    "let": {"uid": "$id", "uemail": "$email"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$or": [
                                        {"$eq": ["$user_id", "$$uid"]},
                                        {"$eq": ["$customer_email", "$$uemail"]},
                                    ]
                                }
                            }
                        },
                        {"$project": {"total": 1, "payment_status": 1}},
                    ],
                    "as": "user_orders",
                }
            },
            {
                "$addFields": {
                    "total_orders": {"$size": "$user_orders"},
                    "lifetime_spend": {
                        "$sum": {
                            "$map": {
                                "input": {
                                    "$filter": {
                                        "input": "$user_orders",
                                        "as": "o",
                                        "cond": {"$eq": ["$$o.payment_status", "paid"]},
                                    }
                                },
                                "as": "o",
                                "in": {"$ifNull": ["$$o.total", 0]},
                            }
                        }
                    },
                }
            },
            {"$project": {"user_orders": 0, "password_hash": 0}},
            {"$sort": {"created_at": -1}},
        ]

        customers = await db.users.aggregate(pipeline).to_list(length=None)
        # Normalize field names for the response.
        result = []
        for c in customers:
            result.append({
                "id": c.get("id", ""),
                "name": c.get("name", ""),
                "email": c.get("email", ""),
                "phone": c.get("phone"),
                "total_orders": c.get("total_orders", 0),
                "lifetime_spend": float(c.get("lifetime_spend", 0) or 0),
            })
        return {"customers": result, "total": len(result)}

    # ---------- Messages ----------
    async def list_messages(self, search: Optional[str] = None) -> dict:
        query: dict = {}
        if search:
            s = search.strip()
            if s:
                query["$or"] = [
                    {"name": {"$regex": s, "$options": "i"}},
                    {"email": {"$regex": s, "$options": "i"}},
                    {"message": {"$regex": s, "$options": "i"}},
                ]
        cursor = get_db().contact_messages.find(query).sort("created_at", -1)
        messages = serialize_docs(await cursor.to_list(length=None))
        for m in messages:
            m.setdefault("read", False)
        return {"messages": messages, "total": len(messages)}

    async def mark_message_read(self, message_id: str, read: bool) -> dict | None:
        return serialize_doc(
            await get_db().contact_messages.find_one_and_update(
                {"id": message_id},
                {"$set": {"read": read}},
                return_document=ReturnDocument.AFTER,
            )
        )

    async def delete_message(self, message_id: str) -> bool:
        res = await get_db().contact_messages.delete_one({"id": message_id})
        return res.deleted_count > 0


admin_service = AdminService()
