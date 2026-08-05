"""Order intake route.

Persists the order first (status "received"); payment capture then happens
via POST /api/create-order + POST /api/verify-payment in routes/payments.py,
which update this same order's `status`/`payment` fields once Razorpay
confirms the transaction.
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
        # DEBUG LOGS
        logger.info("PHONE RECEIVED = %s", payload.phone)
        logger.info("FULL PAYLOAD = %s", payload.model_dump())

        order = await order_service.record_order(payload)

    except Exception as exc:
        logger.exception("Order recording failed")
        raise HTTPException(status_code=500, detail="Could not record order") from exc

    return OrderResponse(
        ok=True,
        order_id=order["id"],
        status="received",
        message="Order received. Complete payment to confirm your order.",
    )
