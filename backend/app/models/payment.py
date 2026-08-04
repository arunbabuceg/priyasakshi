"""Razorpay request/response schemas.

These are separate from ``models/order.py`` on purpose — the existing
``OrderCreate`` / ``OrderResponse`` models and the order document shape in
Mongo are left untouched. Payment status is written into the ``payment``
field that ``OrderService.record_order`` already reserves on every order.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class CreateRazorpayOrderRequest(BaseModel):
    order_id: str = Field(..., description="Internal order id returned by POST /api/orders")
    amount: float = Field(..., gt=0, description="Order amount in INR rupees (e.g. cart total)")
    currency: str = Field("INR")


class CreateRazorpayOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str


class VerifyPaymentRequest(BaseModel):
    order_id: str = Field(..., description="Internal order id from POST /api/orders")
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    order_id: str
    message: str
