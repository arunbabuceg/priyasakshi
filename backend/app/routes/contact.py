import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..db import get_db
from ..models.contact import ContactMessage, ContactResponse
from ..services.email_service import email_service

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactResponse)
async def submit_contact(payload: ContactMessage):
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "name": payload.name,
            "email": payload.email,
            "message": payload.message,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await get_db().contact_messages.insert_one(doc)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save message") from exc

    await email_service.send_contact_notification(payload.name, payload.email, payload.message)
    return ContactResponse(ok=True)
