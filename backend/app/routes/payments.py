"""Razorpay payment routes.

- POST /api/create-order    → creates a Razorpay order for an existing
  internal order (from POST /api/orders) and returns what the frontend
  needs to open Razorpay Standard Checkout.
- POST /api/verify-payment  → verifies the HMAC-SHA256 signature Razorpay
  returns after a successful checkout and marks the order as paid.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..models.payment import (
    CreateRazorpayOrderRequest,
    CreateRazorpayOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)
from ..services.order_service import order_service
from ..services.payment_service import payment_service

router = APIRouter(tags=["payments"])
logger = logging.getLogger("priya_sakshi.payments")


@router.post("/create-order", response_model=CreateRazorpayOrderResponse)
async def create_order(payload: CreateRazorpayOrderRequest):
    order = await order_service.get_order(payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        razorpay_order = payment_service.create_order(
            amount_rupees=payload.amount,
            currency=payload.currency,
            receipt=payload.order_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - network/SDK failure path
        logger.exception("Razorpay order creation failed for order_id=%s", payload.order_id)
        raise HTTPException(status_code=502, detail="Could not create payment order") from exc

    await order_service.mark_payment_initiated(payload.order_id, razorpay_order["id"])

    return CreateRazorpayOrderResponse(
        order_id=razorpay_order["id"],
        amount=razorpay_order["amount"],
        currency=razorpay_order["currency"],
    )


@router.post("/verify-payment", response_model=VerifyPaymentResponse)
async def verify_payment(payload: VerifyPaymentRequest):
    order = await order_service.get_order(payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_valid = payment_service.verify_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
    )
    if not is_valid:
        logger.warning(
            "Razorpay signature verification failed for order_id=%s razorpay_order_id=%s",
            payload.order_id, payload.razorpay_order_id,
        )
        raise HTTPException(status_code=400, detail="Payment verification failed")

    await order_service.mark_payment_verified(
        order_id=payload.order_id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
    )

    return VerifyPaymentResponse(
        success=True, order_id=payload.order_id, message="Payment verified successfully"
    )
