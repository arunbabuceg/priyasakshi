from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..db import get_db
from ..models.newsletter import NewsletterResponse, NewsletterSubscribe
from ..services.email_service import email_service

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.post("/subscribe", response_model=NewsletterResponse)
async def subscribe(payload: NewsletterSubscribe):
    try:
        doc = {
            "email": payload.email,
            "name": payload.name,
            "subscribed_at": datetime.now(timezone.utc).isoformat(),
        }
        await get_db().newsletter.update_one(
            {"email": payload.email},
            {"$set": doc},
            upsert=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save subscription") from exc

    # Fire-and-forget welcome email (no-op unless Resend is configured)
    await email_service.send_newsletter_welcome(payload.email, payload.name)

    return NewsletterResponse(ok=True, message="Subscribed")
