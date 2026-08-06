"""Invoice routes.

- GET  /api/invoices/{order_id}       → download invoice PDF (authenticated user or admin)
- POST /api/invoices/{order_id}/resend → resend invoice email with PDF attachment (admin only)
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from ..dependencies import get_current_user, get_admin_user
from ..services.email_service import email_service
from ..services.invoice_service import invoice_service
from ..services.order_service import order_service

router = APIRouter(prefix="/invoices", tags=["invoices"])
logger = logging.getLogger("priya_sakshi.invoices")


@router.get("/{order_id}")
async def download_invoice(order_id: str, user=Depends(get_current_user)):
    """Download invoice PDF for a specific order.

    Accessible by the order owner (via customer account) or admin.
    """
    order = await order_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if user owns this order
    is_owner = order.get("user_id") == user["id"] if user else False
    is_admin = user.get("is_admin", False)

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="You do not have access to this order")

    # Check if order is paid (only paid orders get invoices)
    if order.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Invoice is only available for paid orders")

    # Check if invoice exists
    invoice_path = invoice_service.get_invoice_path(order)
    if not invoice_path:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice_number, full_path = invoice_path

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Invoice file not found")

    filename = f"{invoice_number}.pdf"
    logger.info("Invoice download requested for order %s by user %s", order_id, user.get("id"))

    return FileResponse(
        path=full_path,
        filename=filename,
        media_type="application/pdf",
    )


@router.post("/{order_id}/resend")
async def resend_invoice_email(order_id: str, admin=Depends(get_admin_user)):
    """Resend the invoice email with PDF attachment to the customer.

    Admin only endpoint.
    """
    order = await order_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order is paid
    if order.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Invoice is only available for paid orders")

    # Check if invoice exists
    invoice_path = invoice_service.get_invoice_path(order)
    if not invoice_path:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice_number, full_path = invoice_path

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Invoice file not found")

    # Send email with attachment
    await email_service.send_invoice_email(order, full_path, invoice_number)

    logger.info("Invoice %s resent for order %s by admin %s", invoice_number, order_id, admin.get("id"))

    return {"ok": True, "message": "Invoice email sent successfully"}
