"""Email service — Resend integration, feature-flagged.

Usage::

    await email_service.send_newsletter_welcome(email, name)

Behaviour:
* If ``EMAIL_ENABLED=false`` or ``RESEND_API_KEY`` is empty, calls are logged
  and become no-ops (they never raise). This lets the rest of the app work
  even before the user has signed up for Resend.
* When enabled, uses the ``resend`` Python SDK.

Add new message types here — never call Resend directly from a route.
"""

from __future__ import annotations

import logging
from typing import Optional

from ..config import settings

logger = logging.getLogger("priya_sakshi.email")


class EmailService:
    def __init__(self) -> None:
        self._enabled = bool(settings.email_enabled and settings.resend_api_key)
        if self._enabled:
            try:
                import resend  # type: ignore

                resend.api_key = settings.resend_api_key
                self._resend = resend
                logger.info("Resend email service initialised")
            except Exception as exc:  # pragma: no cover
                logger.warning("Resend init failed, disabling emails: %s", exc)
                self._enabled = False
                self._resend = None
        else:
            self._resend = None
            logger.info("Email service is disabled (set EMAIL_ENABLED=true and RESEND_API_KEY to enable)")

    async def _send(self, to: str | list[str], subject: str, html: str) -> None:
        if not self._enabled:
            logger.info("[email disabled] to=%s subject=%s", to, subject)
            return
        try:
            self._resend.Emails.send(  # type: ignore[union-attr]
                {
                    "from": f"{settings.brand_name} <{settings.brand_from_email}>",
                    "to": [to] if isinstance(to, str) else to,
                    "subject": subject,
                    "html": html,
                }
            )
            logger.info("Email sent to=%s subject=%s", to, subject)
        except Exception as exc:  # pragma: no cover
            logger.exception("Failed to send email: %s", exc)

    # -------- public API --------
    async def send_newsletter_welcome(self, email: str, name: Optional[str]) -> None:
        greeting = f"Hello {name}" if name else "Hello"
        html = (
            f"<p>{greeting},</p>"
            f"<p>Welcome to <strong>{settings.brand_name}</strong>. We'll send you slow "
            f"letters about new arrivals, herbal rituals and stories from our looms.</p>"
            f"<p>— Priyasakshi</p>"
        )
        await self._send(email, f"Welcome to {settings.brand_name}", html)

    async def send_contact_notification(self, name: str, email: str, message: str) -> None:
        html = (
            f"<h2>New contact message</h2>"
            f"<p><strong>Name:</strong> {name}</p>"
            f"<p><strong>Email:</strong> {email}</p>"
            f"<pre style='white-space:pre-wrap'>{message}</pre>"
        )
        await self._send(settings.brand_from_email, f"[{settings.brand_name}] Contact — {name}", html)

    async def send_order_confirmation(self, order: dict) -> None:  # future use
        html = (
            f"<p>Hello {order.get('customer_name', 'there')},</p>"
            f"<p>We've received your order <code>{order.get('id')}</code>. "
            f"Online payments are coming soon — we'll be in touch with next steps.</p>"
        )
        await self._send(order["customer_email"], f"Order received — {settings.brand_name}", html)


email_service = EmailService()
