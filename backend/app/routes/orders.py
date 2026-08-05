"""Order intake + user order history routes.

- POST /api/orders         → records an order (associates with logged-in user
  when present so it shows up in "My Orders").
- GET  /api/orders/my      → list the authenticated user's orders, newest first.
- GET  /api/orders/{id}    → fetch a single order; only the owner may read it.

Payment capture happens via POST /api/create-order + POST /api/verify-payment
in routes/payments.py, which update this same order's `status`/`payment`
fields once Razorpay confirms the transaction.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_current_user, get_optional_user
from ..models.order import OrderCreate, OrderResponse
from ..services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["orders"])
logger = logging.getLogger("priya_sakshi.orders")


@router.post("", response_model=OrderResponse)
async def create_order(payload: OrderCreate, user=Depends(get_optional_user)):
    try:
        logger.info("PHONE RECEIVED = %s", payload.phone)
        logger.info("FULL PAYLOAD = %s", payload.model_dump())

        order = await order_service.record_order(payload, user_id=user["id"] if user else None)

    except Exception as exc:
        logger.exception("Order recording failed")
        raise HTTPException(status_code=500, detail="Could not record order") from exc

    return OrderResponse(
        ok=True,
        order_id=order["id"],
        status="received",
        message="Order received. Complete payment to confirm your order.",
    )


@router.get("/my")
async def my_orders(user=Depends(get_current_user)):
    orders = await order_service.list_orders_for_user(user["id"])
    return {"ok": True, "orders": orders}


@router.get("/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    order = await order_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="You do not have access to this order")
    return {"ok": True, "order": order}
