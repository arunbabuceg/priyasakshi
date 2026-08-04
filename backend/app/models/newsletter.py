from typing import Optional

from pydantic import BaseModel, EmailStr


class NewsletterSubscribe(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class NewsletterResponse(BaseModel):
    ok: bool
    message: str
