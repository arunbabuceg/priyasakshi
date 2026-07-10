"""Order request/response schemas.

Today we only *record* orders (no payment). The schema is intentionally
generic enough that any future payment provider (Stripe, Razorpay, PayPal,
COD) can attach a `payment` block without breaking existing clients.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class OrderItem(BaseModel):
    product_id: str
    name: Optional[str] = None
    quantity: int = Field(..., gt=0)
    price: Optional[float] = Field(None, ge=0)  # unit price at time of order


class ShippingAddress(BaseModel):
    line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "India"


class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    phone: Optional[str] = None
    items: List[OrderItem]
    shipping: Optional[ShippingAddress] = None
    currency: str = "INR"
    subtotal: Optional[float] = Field(None, ge=0)
    shipping_fee: Optional[float] = Field(None, ge=0)
    total: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    ok: bool = True
    order_id: str
    status: Literal["received", "pending_payment", "paid", "shipped", "cancelled"] = "received"
    message: str = "Order received. We will follow up over email shortly."
