"""Product request/response schemas.

Defines the schema for products stored in MongoDB, including support for
soft-delete (deleted_at) to preserve historical order references.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Specification(BaseModel):
    label: str
    value: str


class ShippingInfo(BaseModel):
    line: str


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=50)
    short_description: str = Field("", max_length=500)
    long_description: str = Field("", max_length=5000)
    price: int = Field(..., ge=0)
    compare_price: Optional[int] = Field(None, ge=0)
    images: List[str] = Field(default_factory=list)
    tag: Optional[str] = Field(None, max_length=50)
    stock: int = Field(default=0, ge=0)
    specifications: List[Specification] = Field(default_factory=list)
    shipping_info: List[str] = Field(default_factory=list)
    featured: bool = Field(default=False)
    active: bool = Field(default=True)
    currency: str = Field(default="INR")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError(
                "Slug must be lowercase alphanumeric with hyphens only"
            )
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        allowed = {"saree", "skincare"}
        if v not in allowed:
            raise ValueError(f"Category must be one of: {', '.join(sorted(allowed))}")
        return v


class ProductCreate(ProductBase):
    """Schema for creating a new product."""

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Price must be non-negative")
        return v


class ProductUpdate(BaseModel):
    """Schema for updating an existing product — all fields optional."""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    short_description: Optional[str] = Field(None, max_length=500)
    long_description: Optional[str] = Field(None, max_length=5000)
    price: Optional[int] = Field(None, ge=0)
    compare_price: Optional[int] = Field(None, ge=0)
    images: Optional[List[str]] = None
    tag: Optional[str] = Field(None, max_length=50)
    stock: Optional[int] = Field(None, ge=0)
    specifications: Optional[List[Specification]] = None
    shipping_info: Optional[List[str]] = None
    featured: Optional[bool] = None
    active: Optional[bool] = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError(
                "Slug must be lowercase alphanumeric with hyphens only"
            )
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"saree", "skincare"}
        if v not in allowed:
            raise ValueError(f"Category must be one of: {', '.join(sorted(allowed))}")
        return v


class ProductResponse(ProductBase):
    """Schema for product responses."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    deleted_at: Optional[str] = None


class ProductListResponse(BaseModel):
    """Paginated list of products."""

    ok: bool = True
    products: List[ProductResponse]
    total: int


class ProductFilters(BaseModel):
    """Filters for querying products."""

    category: Optional[str] = None
    active: Optional[bool] = None
    featured: Optional[bool] = None
    search: Optional[str] = None
