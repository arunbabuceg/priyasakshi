"""Email service — Titan SMTP integration.

Sends transactional email (newsletter welcome, contact notifications, order
confirmations) via Titan's SMTP server using aiosmtplib. Credentials come from
environment variables (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS) and are
never hard-coded.

If SMTP is not configured (no SMTP_USER / SMTP_PASS), calls are logged and
become no-ops so the rest of the app keeps working during local development.
"""

from __future__ import annotations

import logging
from email.message import EmailMessage
from typing import Optional

import aiosmtplib

from ..config import settings

logger = logging.getLogger("priya_sakshi.email")


class EmailService:
    def __init__(self) -> None:
        self._enabled = bool(settings.smtp_user and settings.smtp_pass)
        if self._enabled:
            logger.info("Titan SMTP email service initialised (user=%s)", settings.smtp_user)
        else:
            logger.info(
                "Email service is disabled (set SMTP_USER and SMTP_PASS to enable)"
            )

    async def _send(self, to: str | list[str], subject: str, html: str) -> None:
        if not self._enabled:
            logger.info("[email disabled] to=%s subject=%s", to, subject)
            return

        recipients = [to] if isinstance(to, str) else to

        message = EmailMessage()
        message["From"] = f"{settings.brand_name} <{settings.smtp_user}>"
        message["To"] = ", ".join(recipients)
        message["Subject"] = subject
        message.set_content("This email requires an HTML client.")
        message.add_alternative(html, subtype="html")

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                use_tls=True,
                username=settings.smtp_user,
                password=settings.smtp_pass,
                timeout=30,
            )
            logger.info("Email sent to=%s subject=%s", recipients, subject)

        except Exception as exc:
            logger.exception("Failed to send email: %s", exc)

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


email_service = EmailService()
