"""Order intake route.

Today we simply persist the order and log it — no payment is captured. The
response shape is compatible with a future payment-provider handoff so the
frontend can start calling this endpoint whenever we're ready to switch on
Razorpay / Stripe / etc.
"""

import logging

from fastapi import APIRouter, HTTPException

from ..models.order import OrderCreate, OrderResponse
from ..services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["orders"])
logger = logging.getLogger("priya_sakshi.orders")


@router.post("", response_model=OrderResponse)
async def create_order(payload: OrderCreate):
    try:
        order = await order_service.record_order(payload)
    except Exception as exc:
        logger.exception("Order recording failed")
        raise HTTPException(status_code=500, detail="Could not record order") from exc

    return OrderResponse(
        ok=True,
        order_id=order["id"],
        status="received",
        message=(
            "Order received. Online payments will be available soon — we'll email you "
            "with next steps."
        ),
    )
