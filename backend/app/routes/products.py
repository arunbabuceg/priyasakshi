"""Product management routes.

Public endpoints (no auth required):
  GET    /api/products           - List all active products
  GET    /api/products/{slug}    - Get product by slug

Admin endpoints (admin auth required):
  GET    /api/admin/products           - List all products with filters
  GET    /api/admin/products/{id}     - Get product by ID
  POST   /api/admin/products           - Create a new product
  PATCH  /api/admin/products/{id}      - Update a product
  DELETE /api/admin/products/{id}      - Soft-delete a product
  POST   /api/admin/products/{id}/duplicate - Duplicate a product
  POST   /api/admin/products/{id}/toggle   - Toggle active status
  POST   /api/admin/products/upload-image   - Upload product image
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request
from fastapi.responses import JSONResponse
import json
import re
import os
import uuid
import base64
from typing import Optional

from ..dependencies import get_admin_user, get_current_user
from ..models.product import ProductCreate, ProductUpdate, ProductResponse
from ..services.product_service import product_service
from ..config import ROOT_DIR

router = APIRouter()

import logging
logger = logging.getLogger("priya_sakshi.products")

# ---------- Public endpoints ----------

@router.get("/products")
async def list_public_products(
    category: Optional[str] = Query(default=None, description="Filter by category"),
):
    """List all active products for the storefront."""
    products, total = await product_service.list(
        category=category,
        active=True,
        limit=500,
    )
    return {"ok": True, "products": products, "total": total}


@router.get("/products/{slug}")
async def get_public_product(slug: str):
    """Get a single active product by slug."""
    product = await product_service.get_by_slug(slug, include_deleted=False)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True, "product": product}


# ---------- Admin endpoints ----------

admin_router = APIRouter(prefix="/admin/products", tags=["admin-products"])


@admin_router.get("")
async def list_products(
    category: Optional[str] = Query(default=None),
    active: Optional[bool] = Query(default=None),
    featured: Optional[bool] = Query(default=None),
    search: Optional[str] = Query(default=None),
    include_deleted: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    admin=Depends(get_admin_user),
):
    """List all products with optional filters (admin only)."""
    products, total = await product_service.list(
        category=category,
        active=active,
        featured=featured,
        search=search,
        include_deleted=include_deleted,
        limit=limit,
        skip=skip,
    )
    return {"ok": True, "products": products, "total": total}


@admin_router.get("/{product_id}")
async def get_product(product_id: str, admin=Depends(get_admin_user)):
    """Get a single product by ID (admin only)."""
    product = await product_service.get_by_id(product_id, include_deleted=True)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True, "product": product}


@admin_router.post("")
async def create_product(request: Request, admin=Depends(get_admin_user)):
    """Create a new product (admin only).
    
    Accepts JSON body with product data.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    
    # Parse specifications if provided
    specifications = []
    if "specifications" in body:
        from ..models.product import Specification
        specs_data = body.pop("specifications")
        if isinstance(specs_data, list):
            for s in specs_data:
                if isinstance(s, dict) and "label" in s and "value" in s:
                    specifications.append(Specification(label=s["label"], value=s["value"]))
    
    try:
        payload = ProductCreate(
            name=body.get("name", ""),
            slug=body.get("slug", ""),
            category=body.get("category", ""),
            short_description=body.get("shortDescription", ""),
            long_description=body.get("longDescription", ""),
            price=body.get("price", 0),
            compare_price=body.get("comparePrice"),
            images=body.get("images", []),
            tag=body.get("tag"),
            stock=body.get("stock", 0),
            specifications=specifications,
            shipping_info=body.get("shippingInfo", []),
            featured=body.get("featured", False),
            active=body.get("active", True),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    try:
        product = await product_service.create(payload)
        return {"ok": True, "product": product}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@admin_router.patch("/{product_id}")
async def update_product(product_id: str, request: Request, admin=Depends(get_admin_user)):
    """Update an existing product (admin only)."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    
    # Check if product exists
    existing = await product_service.get_by_id(product_id, include_deleted=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Parse specifications if provided
    specifications = None
    if "specifications" in body:
        from ..models.product import Specification
        specs_data = body.pop("specifications")
        if isinstance(specs_data, list):
            specifications = []
            for s in specs_data:
                if isinstance(s, dict) and "label" in s and "value" in s:
                    specifications.append(Specification(label=s["label"], value=s["value"]))
    
    # Build update payload with camelCase field names
    update_data = {}
    field_mapping = {
        "name": "name",
        "slug": "slug",
        "category": "category",
        "shortDescription": "short_description",
        "longDescription": "long_description",
        "price": "price",
        "comparePrice": "compare_price",
        "images": "images",
        "tag": "tag",
        "stock": "stock",
        "specifications": "specifications",
        "shippingInfo": "shipping_info",
        "featured": "featured",
        "active": "active",
    }
    
    for camel, value in body.items():
        if camel in field_mapping:
            update_data[field_mapping[camel]] = value
    
    if specifications is not None:
        update_data["specifications"] = specifications
    
    try:
        payload = ProductUpdate(**update_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    try:
        product = await product_service.update(product_id, payload)
        return {"ok": True, "product": product}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@admin_router.delete("/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_admin_user)):
    """Soft-delete a product (admin only).
    
    Products referenced in orders are soft-deleted to preserve historical records.
    """
    existing = await product_service.get_by_id(product_id, include_deleted=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await product_service.soft_delete(product_id)
    return {"ok": True, "product": product, "message": "Product deleted (soft)"}


@admin_router.post("/{product_id}/duplicate")
async def duplicate_product(product_id: str, admin=Depends(get_admin_user)):
    """Create a duplicate of an existing product (admin only)."""
    product = await product_service.duplicate(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True, "product": product}


@admin_router.post("/{product_id}/toggle")
async def toggle_product_status(product_id: str, admin=Depends(get_admin_user)):
    """Toggle the active status of a product (admin only)."""
    product = await product_service.toggle_active(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True, "product": product}


@admin_router.post("/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    admin=Depends(get_admin_user),
):
    """Upload a product image (admin only).

    Accepts image files (jpg, jpeg, png, webp, gif).
    Uploads to Cloudinary for persistent storage that survives redeploys.
    Falls back to the local uploads folder when Cloudinary is not configured.
    """
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(sorted(allowed_types))}",
        )

    # Max 5 MB
    max_size = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    from ..services import cloudinary_service

    if cloudinary_service.is_configured():
        # Upload to Cloudinary — URL survives redeploys.
        # When Cloudinary is configured we NEVER fall back to local storage;
        # a failure must surface as an error, not a silently-broken image.
        try:
            image_url = await cloudinary_service.upload_image(content)
            logger.info("Uploaded image to Cloudinary")
            filename = image_url.rsplit("/", 1)[-1]
            return {"ok": True, "url": image_url, "filename": filename}
        except Exception:
            logger.exception("Cloudinary image upload failed")
            raise HTTPException(
                status_code=500,
                detail="Image upload failed. Please try again.",
            )

    # Fallback: local filesystem (development only — Cloudinary not configured)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    upload_dir = ROOT_DIR / "uploads" / "products"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    image_url = f"/uploads/products/{filename}"

    return {"ok": True, "url": image_url, "filename": filename}
