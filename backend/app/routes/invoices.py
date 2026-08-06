"""Invoice routes.

- GET  /api/invoices/{order_id}        → download invoice PDF (authenticated user or admin)
- POST /api/invoices/{order_id}/resend → resend invoice email with PDF attachment (admin only)

When the stored ``invoice_file_path`` is a Cloudinary URL the download
endpoint returns a redirect so the browser fetches the PDF directly from
Cloudinary without passing it through the backend.  Local-filesystem paths
are served as before using FileResponse.
"""

from __future__ import annotations

import logging
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, RedirectResponse

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
    Returns a redirect when the invoice is stored on Cloudinary, or a
    FileResponse for locally stored PDFs.
    """
    order = await order_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_owner = order.get("user_id") == user["id"] if user else False
    is_admin = user.get("is_admin", False)

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="You do not have access to this order")

    if order.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Invoice is only available for paid orders")

    invoice_path = invoice_service.get_invoice_path(order)
    if not invoice_path:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice_number, path_or_url = invoice_path

    logger.info(
        "Invoice download requested for order %s by user %s", order_id, user.get("id")
    )

    # Cloudinary URL — redirect the browser there directly
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        return RedirectResponse(url=path_or_url, status_code=302)

    # Local file
    if not os.path.exists(path_or_url):
        raise HTTPException(status_code=404, detail="Invoice file not found")

    filename = f"{invoice_number}.pdf"
    return FileResponse(
        path=path_or_url,
        filename=filename,
        media_type="application/pdf",
    )


@router.post("/{order_id}/resend")
async def resend_invoice_email(order_id: str, admin=Depends(get_admin_user)):
    """Resend the invoice email with PDF attachment to the customer (admin only)."""
    order = await order_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Invoice is only available for paid orders")

    # If invoice doesn't exist yet, generate it now
    invoice_path = invoice_service.get_invoice_path(order)
    if not invoice_path:
        try:
            invoice_number, invoice_file_path = await invoice_service.generate_invoice(order)
            # Persist the new invoice details
            from ..db import get_db
            from datetime import datetime, timezone
            await get_db().orders.update_one(
                {"id": order_id},
                {"$set": {
                    "invoice_number": invoice_number,
                    "invoice_file_path": invoice_file_path,
                    "invoice_generated_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
            order["invoice_number"] = invoice_number
            order["invoice_file_path"] = invoice_file_path
            invoice_path = (invoice_number, invoice_file_path)
        except Exception as exc:
            logger.exception("Failed to generate invoice for order %s: %s", order_id, exc)
            raise HTTPException(status_code=500, detail="Could not generate invoice") from exc

    invoice_number, path_or_url = invoice_path

    # For local files, verify they exist
    if not (path_or_url.startswith("http://") or path_or_url.startswith("https://")):
        if not os.path.exists(path_or_url):
            raise HTTPException(status_code=404, detail="Invoice file not found")

    await email_service.send_invoice_email(order, path_or_url, invoice_number)

    logger.info(
        "Invoice %s resent for order %s by admin %s",
        invoice_number,
        order_id,
        admin.get("id"),
    )

    return {"ok": True, "message": "Invoice email sent successfully"}
