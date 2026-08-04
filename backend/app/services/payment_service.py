"""Razorpay integration service.

Wraps the Razorpay Python SDK for order creation and wraps the standard
HMAC-SHA256 signature check Razorpay documents for verifying a completed
Standard Checkout payment:

    expected_signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)

The order is considered genuinely paid only if ``expected_signature``
matches the ``razorpay_signature`` returned by Checkout.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Optional

import razorpay

from ..config import settings

logger = logging.getLogger("priya_sakshi.payments")

# Razorpay's own minimum order amount is 100 paise (₹1).
MIN_AMOUNT_PAISE = 100


class PaymentService:
    def __init__(self) -> None:
        self._client: Optional[razorpay.Client] = None

    @property
    def client(self) -> razorpay.Client:
        if self._client is None:
            self._client = razorpay.Client(
                auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
            )
        return self._client

    @staticmethod
    def to_paise(amount_rupees: float) -> int:
        return int(round(amount_rupees * 100))

    def create_order(self, *, amount_rupees: float, currency: str, receipt: str) -> dict:
        amount_paise = self.to_paise(amount_rupees)
        if amount_paise < MIN_AMOUNT_PAISE:
            raise ValueError("Amount must be at least \u20b91 (100 paise)")

        order = self.client.order.create(
            {
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt,
                "payment_capture": 1,
            }
        )
        logger.info(
            "Razorpay order created razorpay_order_id=%s amount=%s receipt=%s",
            order.get("id"), amount_paise, receipt,
        )
        return order

    def verify_signature(
        self, *, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
    ) -> bool:
        payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        expected = hmac.new(
            settings.razorpay_key_secret.encode("utf-8"), payload, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, razorpay_signature)


payment_service = PaymentService()
