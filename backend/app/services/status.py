"""Order & payment status normalization.

Keeps the two concerns separate:
  - payment_status (read-only, set by the payment flow): awaiting_payment,
    paid, failed, refunded.
  - status (order lifecycle, admin-editable): order_received, preparing,
    packed, shipped, out_for_delivery, delivered, cancelled.

Old orders stored legacy values in both fields. `normalize_order()` maps
them to the new vocabulary on read so existing orders render correctly
without a data migration. New orders are written with the new vocabulary
directly.
"""

from __future__ import annotations

from typing import Any

# ---- Canonical vocabularies ----
PAYMENT_STATUSES = ("awaiting_payment", "paid", "failed", "refunded")
ORDER_STATUSES = (
    "order_received",
    "preparing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
)

# ---- Legacy -> canonical maps (backward compatibility) ----
_LEGACY_PAYMENT = {
    "unpaid": "awaiting_payment",
    "pending": "awaiting_payment",
    "awaiting": "awaiting_payment",
    "awaiting_payment": "awaiting_payment",
    "paid": "paid",
    "failed": "failed",
    "refunded": "refunded",
}

_LEGACY_ORDER = {
    "received": "order_received",
    "order_received": "order_received",
    "pending_payment": "order_received",
    "paid": "preparing",
    "confirmed": "preparing",
    "processing": "preparing",
    "preparing": "preparing",
    "packed": "packed",
    "shipped": "shipped",
    "out_for_delivery": "out_for_delivery",
    "delivered": "delivered",
    "cancelled": "cancelled",
}


def normalize_payment_status(value: Any) -> str:
    if not value:
        return "awaiting_payment"
    return _LEGACY_PAYMENT.get(str(value).lower(), "awaiting_payment")


def normalize_order_status(value: Any) -> str:
    if not value:
        return "order_received"
    return _LEGACY_ORDER.get(str(value).lower(), "order_received")


def normalize_order(order: dict | None) -> dict | None:
    """Return a copy of *order* with normalized status / payment_status."""
    if not order:
        return order
    out = dict(order)
    out["status"] = normalize_order_status(out.get("status"))
    out["payment_status"] = normalize_payment_status(out.get("payment_status"))
    return out


def normalize_orders(orders: list[dict]) -> list[dict]:
    return [normalize_order(o) for o in orders]
