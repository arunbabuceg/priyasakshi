"""Razorpay Standard Checkout integration.

Two endpoints:
  POST /payments/create-order  — creates a Razorpay order, returns order_id
  POST /payments/verify        — verifies the HMAC-SHA256 payment signature

The KEY_SECRET never leaves the backend. The frontend only receives the
order_id and the public KEY_ID (via VITE_RAZORPAY_KEY_ID).
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Optional

import razorpay
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..config import settings

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger("priya_sakshi.payments")


class CreateOrderRequest(BaseModel):
    amount: float = Field(..., description="Amount in rupees (will be converted to paise)")
    currency: str = "INR"
    receipt: Optional[str] = None


class CreateOrderResponse(BaseModel):
    ok: bool = True
    order_id: str
    amount: int  # paise
    currency: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifyPaymentResponse(BaseModel):
    ok: bool
    message: str


def _client() -> razorpay.Client:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Razorpay keys not configured")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(payload: CreateOrderRequest):
    amount_paise = int(round(payload.amount * 100))
    if amount_paise < 100:
        raise HTTPException(status_code=400, detail="Amount must be at least ₹1.00 (100 paise)")

    client = _client()
    try:
        order = client.order.create(
            {
                "amount": amount_paise,
                "currency": payload.currency,
                "receipt": payload.receipt or f"ps_{amount_paise}",
                "payment_capture": 1,
            }
        )
    except razorpay.errors.BadRequestError as exc:
        logger.warning("Razorpay create-order bad request: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except razorpay.errors.AuthError as exc:
        logger.error("Razorpay auth failed: %s", exc)
        raise HTTPException(status_code=401, detail="Payment gateway authentication failed") from exc
    except Exception as exc:
        logger.exception("Razorpay create-order failed")
        raise HTTPException(status_code=500, detail="Could not create payment order") from exc

    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
    )


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(payload: VerifyPaymentRequest):
    if not settings.razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Razorpay keys not configured")

    expected = hmac.new(
        settings.razorpay_key_secret.encode("utf-8"),
        f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, payload.razorpay_signature):
        logger.warning("Signature mismatch for order %s", payload.razorpay_order_id)
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    logger.info("Payment verified for order %s", payload.razorpay_order_id)
    return VerifyPaymentResponse(ok=True, message="Payment verified successfully")
