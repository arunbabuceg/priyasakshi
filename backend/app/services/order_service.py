"""Order persistence service.

Separated from the route so that payment providers, inventory checks, and
coupon logic can be layered on later without touching the HTTP layer.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from ..db import get_db
from ..models.order import OrderCreate
from .email_service import email_service

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
            order["id"], order["customer_email"], len(order["items"]), order["total"],
        )

        # Best-effort confirmation email — will no-op if email is disabled.
        await email_service.send_order_confirmation(order)
        return order


order_service = OrderService()
