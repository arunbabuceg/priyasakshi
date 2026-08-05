"""Saved address request/response schemas."""
from typing import Optional

from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=40, description="e.g. Home, Office")
    line1: str = Field(..., min_length=1, max_length=200)
    line2: Optional[str] = Field(None, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)
    country: str = Field("India", max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)


class AddressCreate(AddressBase):
    pass


class AddressUpdate(AddressBase):
    pass


class AddressResponse(AddressBase):
    id: str
