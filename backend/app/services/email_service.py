"""Email service — Resend integration.

Sends transactional email (newsletter welcome, contact notifications, order
confirmations, email verification, password reset) via the Resend API.
The API key comes from the environment variable RESEND_API_KEY and is never
hard-coded.

If Resend is not configured (no RESEND_API_KEY), calls are logged and
become no-ops so the rest of the app keeps working during local development.

IMPORTANT: resend.Emails.send() is a synchronous call. To avoid blocking
the asyncio event loop we dispatch it via run_in_executor so FastAPI's
async handlers remain responsive.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import resend

from ..config import settings

logger = logging.getLogger("priya_sakshi.email")


class EmailService:
    def __init__(self) -> None:
        self._enabled = bool(settings.resend_api_key)

        if self._enabled:
            resend.api_key = settings.resend_api_key
            logger.info("Resend email service initialised")
        else:
            logger.info("Email service disabled (RESEND_API_KEY missing)")

    def _send_sync(self, params: dict) -> None:
        """Synchronous Resend send — run this in an executor to avoid
        blocking the event loop."""
        response = resend.Emails.send(params)
        logger.info(
            "Email sent successfully to=%s response=%s",
            params.get("to"),
            response,
        )

    async def _send(
        self,
        to: str | list[str],
        subject: str,
        html: str,
        attachments: list | None = None,
    ) -> None:
        if not self._enabled:
            logger.info("[email disabled] to=%s subject=%s", to, subject)
            return

        recipients = [to] if isinstance(to, str) else to

        params: resend.Emails.SendParams = {
            "from": f"{settings.brand_name} <{settings.brand_from_email}>",
            "to": recipients,
            "subject": subject,
            "html": html,
        }

        if attachments:
            params["attachments"] = attachments

        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._send_sync, params)
        except Exception as exc:
            logger.exception("Failed to send email to=%s subject=%s: %s", to, subject, exc)

    # -------- public API --------
    async def send_newsletter_welcome(self, email: str, name: Optional[str]) -> None:
        greeting = f"Hello {name}" if name else "Hello"
        html = (
            f"<div style='font-family:Outfit,Arial,sans-serif;max-width:560px;margin:auto'>"
            f"<p>{greeting},</p>"
            f"<p>Welcome to <strong>{settings.brand_name}</strong>. We'll send you slow "
            f"letters about new arrivals, herbal rituals and stories from our looms.</p>"
            f"<p>— Priya Sakshi</p></div>"
        )
        await self._send(email, f"Welcome to {settings.brand_name}", html)

    async def send_contact_notification(self, name: str, email: str, message: str) -> None:
        from datetime import datetime, timezone

        when = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        html = (
            f"<div style='font-family:Outfit,Arial,sans-serif;max-width:560px;margin:auto'>"
            f"<h2>New contact message</h2>"
            f"<p><strong>Name:</strong> {name}</p>"
            f"<p><strong>Email:</strong> {email}</p>"
            f"<p><strong>Date &amp; Time:</strong> {when}</p>"
            f"<pre style='white-space:pre-wrap;border-left:3px solid #8B2956;padding-left:12px'>{message}</pre>"
            f"</div>"
        )
        await self._send(
            settings.contact_to_email,
            f"[{settings.brand_name}] Contact — {name}",
            html,
        )

    async def send_owner_order_notification(self, order: dict) -> None:
        from .templates import owner_order_html

        html = owner_order_html(settings.brand_name, order)
        await self._send(
            settings.contact_to_email,
            f"[{settings.brand_name}] New order {order.get('id', '')[:8]}",
            html,
        )

    async def send_order_confirmation(self, order: dict) -> None:
        from .templates import customer_order_html

        html = customer_order_html(
            settings.brand_name,
            order,
            settings.contact_to_email,
        )
        await self._send(
            order["customer_email"],
            f"Order received — {settings.brand_name}",
            html,
        )

    async def send_invoice_email(
        self,
        order: dict,
        invoice_path: str,
        invoice_number: str,
    ) -> None:
        """Send order confirmation email with invoice PDF attachment.

        ``invoice_path`` can be either a local filesystem path or a Cloudinary
        (HTTPS) URL.  When it is a URL we download the PDF bytes; when it is a
        local path we read the file directly.
        """
        from datetime import datetime, timezone

        customer_name = order.get("customer_name", "Customer")
        order_id = str(order.get("id", ""))[:8]
        total = order.get("total", 0)

        try:
            total_formatted = f"₹{total:,.2f}"
        except (TypeError, ValueError):
            total_formatted = f"₹{total}"

        when = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        html = (
            f"<div style='font-family:Outfit,Arial,sans-serif;max-width:560px;margin:auto'>"
            f"<h2 style='color:#8B2956;margin-top:0'>Thank you for your order!</h2>"
            f"<p>Dear {customer_name},</p>"
            f"<p>Thank you for shopping with <strong>{settings.brand_name}</strong>. "
            f"Your payment has been successfully processed.</p>"
            f"<p>We're preparing your order with care and it will be shipped soon. "
            f"You'll receive a shipping notification once it's on its way.</p>"
            f"<div style='background:#F5E6ED;padding:16px;border-radius:12px;margin:20px 0'>"
            f"<h3 style='color:#8B2956;margin-top:0'>Order Details</h3>"
            f"<p style='margin:4px 0'><strong>Order Number:</strong> {order_id}</p>"
            f"<p style='margin:4px 0'><strong>Invoice Number:</strong> {invoice_number}</p>"
            f"<p style='margin:4px 0'><strong>Order Date:</strong> {when}</p>"
            f"<p style='margin:4px 0'><strong>Total Amount:</strong> {total_formatted}</p>"
            f"</div>"
            f"<p>Please find your invoice attached to this email for your records.</p>"
            f"<p style='margin-top:24px'>If you have any questions, please don't hesitate to contact us at "
            f"<a href='mailto:{settings.contact_to_email}'>{settings.contact_to_email}</a>.</p>"
            f"<p style='margin-top:24px'>Warm regards,<br><strong>{settings.brand_name} Team</strong></p>"
            f"</div>"
        )

        attachments = []
        try:
            import base64

            if invoice_path.startswith("http://") or invoice_path.startswith("https://"):
                # Cloudinary URL — download the PDF bytes
                import httpx

                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.get(invoice_path)
                    resp.raise_for_status()
                    pdf_data = base64.b64encode(resp.content).decode("utf-8")
            else:
                # Local filesystem path
                with open(invoice_path, "rb") as f:
                    pdf_data = base64.b64encode(f.read()).decode("utf-8")

            attachments.append({
                "filename": f"{invoice_number}.pdf",
                "data": pdf_data,
                "type": "application/pdf",
            })
        except Exception as exc:
            logger.warning("Could not attach invoice PDF for order %s: %s", order_id, exc)

        await self._send(
            order["customer_email"],
            f"Your Priya Sakshi Order Confirmation & Invoice",
            html,
            attachments if attachments else None,
        )

    async def send_email_verification(self, to_email: str, token: str) -> None:
        from .templates import email_verification_html

        verify_url = f"{settings.frontend_url}/verify-email?token={token}"
        html = email_verification_html(settings.brand_name, verify_url)
        await self._send(
            to_email,
            f"Verify your email — {settings.brand_name}",
            html,
        )

    async def send_password_reset(self, to_email: str, token: str) -> None:
        from .templates import password_reset_html

        reset_url = f"{settings.frontend_url}/reset-password?token={token}"
        html = password_reset_html(settings.brand_name, reset_url)
        await self._send(
            to_email,
            f"Reset your password — {settings.brand_name}",
            html,
        )

    async def send_order_status_update(self, order: dict) -> None:
        from .templates import order_status_update_html
        from .status import normalize_shipment_status

        html = order_status_update_html(settings.brand_name, order, settings.frontend_url)
        shipment = normalize_shipment_status(
            order.get("shipment_status") or order.get("status")
        )
        subject_map = {
            "order_received": f"We've received your order — {settings.brand_name}",
            "preparing": f"Your order is being prepared — {settings.brand_name}",
            "packed": f"Your order is packed — {settings.brand_name}",
            "shipped": f"Your order has shipped — {settings.brand_name}",
            "out_for_delivery": f"Your order is out for delivery — {settings.brand_name}",
            "delivered": f"Your order has been delivered — {settings.brand_name}",
            "cancelled": f"Your order has been cancelled — {settings.brand_name}",
            "returned": f"Your order has been returned — {settings.brand_name}",
        }
        subject = subject_map.get(shipment, f"Order update — {settings.brand_name}")
        await self._send(order.get("customer_email", ""), subject, html)


email_service = EmailService()
