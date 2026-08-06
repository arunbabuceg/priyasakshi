"""Payment & shipment status vocabulary, normalization and business rules.

Two independent concerns:

  - ``payment_status`` — read-only, driven by the payment flow:
    ``awaiting_payment``, ``paid``, ``failed``, ``refunded``, ``cancelled``.
    An order left at ``awaiting_payment`` for more than
    ``PAYMENT_EXPIRY_HOURS`` hours becomes ``cancelled``.

  - ``shipment_status`` — admin controlled fulfillment progress:
    ``waiting_for_payment``, ``order_received``, ``preparing``, ``packed``,
    ``shipped``, ``out_for_delivery``, ``delivered``, ``cancelled``,
    ``returned``. It can only progress past ``waiting_for_payment`` once the
    payment is ``paid``.

Older documents stored a single ``status`` field mixing both concerns.
``normalize_order()`` maps legacy values onto the new vocabulary on read and
enforces the invariants above, so existing MongoDB data renders correctly
without a migration. ``status`` is still mirrored onto the response for
backward compatibility with older clients.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from .couriers import courier_name, tracking_url

# ---- Canonical vocabularies ----
PAYMENT_STATUSES = ("awaiting_payment", "paid", "failed", "refunded", "cancelled")

SHIPMENT_STATUSES = (
    "waiting_for_payment",
    "order_received",
    "preparing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
)

# Shipment stages that require a completed payment.
PAID_ONLY_SHIPMENT_STATUSES = (
    "order_received",
    "preparing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "returned",
)

SHIPMENT_LABELS = {
    "waiting_for_payment": "Waiting for Payment",
    "order_received": "Order Received",
    "preparing": "Preparing",
    "packed": "Packed",
    "shipped": "Shipped",
    "out_for_delivery": "Out for Delivery",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
    "returned": "Returned",
}

# Customer-facing labels. Customers never see the internal "Order Received"
# stage — pre-fulfillment shows as "Order Placed" instead. The stored values
# are unchanged.
CUSTOMER_SHIPMENT_LABELS = {
    **SHIPMENT_LABELS,
    "waiting_for_payment": "Order Placed",
    "order_received": "Order Placed",
}

PAYMENT_LABELS = {
    "awaiting_payment": "Awaiting Payment",
    "paid": "Paid",
    "failed": "Failed",
    "refunded": "Refunded",
    "cancelled": "Cancelled",
}

# An unpaid order is cancelled automatically after this many hours.
PAYMENT_EXPIRY_HOURS = 12

# ---- Legacy -> canonical maps (backward compatibility) ----
_LEGACY_PAYMENT = {
    "unpaid": "awaiting_payment",
    "pending": "awaiting_payment",
    "awaiting": "awaiting_payment",
    "pending_payment": "awaiting_payment",
    "awaiting_payment": "awaiting_payment",
    "paid": "paid",
    "verified": "paid",
    "failed": "failed",
    "refunded": "refunded",
    "cancelled": "cancelled",
    "canceled": "cancelled",
}

_LEGACY_SHIPMENT = {
    "waiting_for_payment": "waiting_for_payment",
    "pending_payment": "waiting_for_payment",
    "awaiting_payment": "waiting_for_payment",
    "received": "order_received",
    "order_received": "order_received",
    "paid": "order_received",
    "confirmed": "preparing",
    "processing": "preparing",
    "preparing": "preparing",
    "packed": "packed",
    "shipped": "shipped",
    "out_for_delivery": "out_for_delivery",
    "delivered": "delivered",
    "cancelled": "cancelled",
    "canceled": "cancelled",
    "returned": "returned",
}


def normalize_payment_status(value: Any) -> str:
    if not value:
        return "awaiting_payment"
    return _LEGACY_PAYMENT.get(str(value).lower(), "awaiting_payment")


def normalize_shipment_status(value: Any) -> str:
    if not value:
        return "waiting_for_payment"
    return _LEGACY_SHIPMENT.get(str(value).lower(), "waiting_for_payment")


def payment_status_label(value: Any) -> str:
    return PAYMENT_LABELS.get(normalize_payment_status(value), "Awaiting Payment")


def shipment_status_label(value: Any) -> str:
    return SHIPMENT_LABELS.get(normalize_shipment_status(value), "Waiting for Payment")


def customer_shipment_status_label(value: Any) -> str:
    return CUSTOMER_SHIPMENT_LABELS.get(normalize_shipment_status(value), "Order Placed")


def _parse_dt(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def payment_expiry_cutoff(now: datetime | None = None) -> datetime:
    """Orders created before this instant have an expired payment window."""
    return (now or datetime.now(timezone.utc)) - timedelta(hours=PAYMENT_EXPIRY_HOURS)


def is_payment_window_expired(created_at: Any, now: datetime | None = None) -> bool:
    created = _parse_dt(created_at)
    if created is None:
        return False
    return created < payment_expiry_cutoff(now)


def resolve_statuses(order: dict) -> tuple[str, str]:
    """Return the (payment_status, shipment_status) pair for *order*.

    Applies the auto-cancellation window and the "shipment cannot progress
    without payment" invariant.
    """
    payment = normalize_payment_status(order.get("payment_status"))
    shipment = normalize_shipment_status(
        order.get("shipment_status") or order.get("status")
    )

    if payment == "awaiting_payment" and is_payment_window_expired(order.get("created_at")):
        payment = "cancelled"

    if payment == "paid":
        # A paid order is at least at the "Order Received" stage.
        if shipment == "waiting_for_payment":
            shipment = "order_received"
    elif payment == "cancelled":
        shipment = "cancelled"
    else:
        # awaiting_payment / failed / refunded: never show fulfillment progress.
        if shipment not in ("cancelled", "returned"):
            shipment = "waiting_for_payment"

    return payment, shipment


def normalize_order(order: dict | None) -> dict | None:
    """Return a copy of *order* with canonical payment / shipment statuses."""
    if not order:
        return order
    out = dict(order)
    payment, shipment = resolve_statuses(out)
    out["payment_status"] = payment
    out["shipment_status"] = shipment
    # Mirrored for backward compatibility with older clients reading `status`.
    out["status"] = shipment
    out["payment_status_label"] = PAYMENT_LABELS[payment]
    out["shipment_status_label"] = SHIPMENT_LABELS[shipment]
    out["customer_shipment_status_label"] = CUSTOMER_SHIPMENT_LABELS[shipment]
    if out.get("courier"):
        out["courier_name"] = courier_name(out["courier"])
        out["tracking_url"] = tracking_url(out["courier"], out.get("tracking_number"))
    return out


def normalize_orders(orders: list[dict]) -> list[dict]:
    return [normalize_order(o) for o in orders]
