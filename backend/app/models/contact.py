from pydantic import BaseModel, EmailStr, Field


class ContactMessage(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    message: str = Field(..., min_length=1, max_length=4000)


class ContactResponse(BaseModel):
    ok: bool
    message: str = "Received"
