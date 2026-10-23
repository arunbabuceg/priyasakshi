
"""Razorpay payment routes.

- POST /api/create-order creates a Razorpay order for an existing
  internal order.
- POST /api/verify-payment verifies the Razorpay signature and marks
  the internal order as paid.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..models.payment import (
    CreateRazorpayOrderRequest,
    CreateRazorpayOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)
from ..services.email_service import email_service
from ..services.invoice_service import invoice_service
from ..services.order_service import order_service
from ..services.payment_service import payment_service

router = APIRouter(tags=["payments"])
logger = logging.getLogger("priya_sakshi.payments")


async def send_payment_emails(order: dict, order_id: str) -> None:
    """Send notifications after the payment response can be returned."""

    try:
        await email_service.send_owner_order_notification(order)
        logger.info("Owner email sent for order_id=%s", order_id)
    except Exception:
        logger.exception(
            "Failed to send owner notification for order_id=%s",
            order_id,
        )

    try:
        await email_service.send_order_confirmation(order)
        logger.info("Customer confirmation email sent for order_id=%s", order_id)
    except Exception:
        logger.exception(
            "Failed to send customer confirmation for order_id=%s",
            order_id,
        )

    if not order.get("invoice_number"):
        return

    try:
        invoice_path = invoice_service.get_invoice_path(order)

        if not invoice_path:
            logger.warning(
                "Invoice path unavailable for order_id=%s",
                order_id,
            )
            return

        _, full_path = invoice_path

        if not full_path:
            logger.warning(
                "Invoice file unavailable for order_id=%s",
                order_id,
            )
            return

        await email_service.send_invoice_email(
            order,
            full_path,
            order["invoice_number"],
        )
        logger.info("Invoice email sent for order_id=%s", order_id)

    except Exception:
        logger.exception(
            "Failed to send invoice email for order_id=%s",
            order_id,
        )


@router.post(
    "/create-order",
    response_model=CreateRazorpayOrderResponse,
)
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
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception(
            "Razorpay order creation failed for order_id=%s",
            payload.order_id,
        )
        raise HTTPException(
            status_code=502,
            detail="Unable to create payment order",
        ) from exc

    await order_service.mark_payment_initiated(
        payload.order_id,
        razorpay_order["id"],
    )

    return CreateRazorpayOrderResponse(
        order_id=razorpay_order["id"],
        amount=razorpay_order["amount"],
        currency=razorpay_order["currency"],
    )


@router.post(
    "/verify-payment",
    response_model=VerifyPaymentResponse,
)
async def verify_payment(
    payload: VerifyPaymentRequest,
    background_tasks: BackgroundTasks,
):
    order = await order_service.get_order(payload.order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_valid = payment_service.verify_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
    )

    if not is_valid:
        await order_service.mark_payment_failed(payload.order_id)

        logger.warning(
            "Razorpay signature verification failed for order_id=%s "
            "razorpay_order_id=%s",
            payload.order_id,
            payload.razorpay_order_id,
        )

        raise HTTPException(
            status_code=400,
            detail="Payment verification failed",
        )

    order = await order_service.mark_payment_verified(
        order_id=payload.order_id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
    )

    logger.info(
        "Payment verified for order_id=%s",
        payload.order_id,
    )

    # Schedule notifications after the response is prepared.
    # Email errors must not turn a verified payment into an HTTP 500.
    background_tasks.add_task(
        send_payment_emails,
        order,
        payload.order_id,
    )

    return VerifyPaymentResponse(
        success=True,
        order_id=payload.order_id,
        message="Payment verified and order confirmed successfully",
    )
