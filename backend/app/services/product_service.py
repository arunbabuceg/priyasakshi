"""Product persistence service.

Handles all MongoDB operations for products including CRUD,
soft-delete (for preserving historical order references), and
slug uniqueness validation.
"""

from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from pymongo import ReturnDocument

from ..db import get_db, serialize_doc, serialize_docs
from ..models.product import ProductCreate, ProductUpdate

logger = logging.getLogger("priya_sakshi.products")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _generate_slug(name: str, existing_id: Optional[str] = None) -> str:
    """Generate a URL-friendly slug from a product name."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[-\s]+", "-", slug)
    slug = slug.strip("-")
    return slug


class ProductService:
    # Default products for seeding
    DEFAULT_PRODUCTS = [
        {
            "name": "Silk Harmony Saree",
            "slug": "silk-harmony-saree",
            "category": "saree",
            "short_description": "A beautiful handwoven silk saree with intricate zari work",
            "long_description": "This exquisite silk saree is crafted by master artisans using traditional techniques passed down through generations. The rich silk fabric features intricate zari work that catches the light beautifully, making it perfect for weddings and special occasions.",
            "price": 15999,
            "compare_price": 19999,
            "images": ["/uploads/products/silk-harmony-1.jpg"],
            "tag": "Bestseller",
            "stock": 25,
            "specifications": [
                {"label": "Fabric", "value": "Pure Silk"},
                {"label": "Length", "value": "6.3 meters"},
                {"label": "Blouse", "value": "Unstitched blouse piece included"},
                {"label": "Work", "value": "Zari work"},
            ],
            "shipping_info": ["Free shipping on orders above ₹999", "Delivery within 5-7 business days"],
            "featured": True,
            "active": True,
            "currency": "INR",
        },
        {
            "name": "Rose Glow Serum",
            "slug": "rose-glow-serum",
            "category": "skincare",
            "short_description": "Brightening serum with vitamin C and rose extracts",
            "long_description": "Our Rose Glow Serum combines the power of stabilized vitamin C with organic rose extracts to deliver visible brightening and anti-aging benefits. The lightweight formula absorbs quickly and is suitable for all skin types.",
            "price": 1299,
            "compare_price": 1599,
            "images": ["/uploads/products/rose-glow-1.jpg"],
            "tag": "New",
            "stock": 100,
            "specifications": [
                {"label": "Volume", "value": "30ml"},
                {"label": "Skin Type", "value": "All skin types"},
                {"label": "Key Ingredients", "value": "Vitamin C, Rose Extract, Hyaluronic Acid"},
                {"label": "Cruelty Free", "value": "Yes"},
            ],
            "shipping_info": ["Free shipping on orders above ₹999", "Delivery within 3-5 business days"],
            "featured": True,
            "active": True,
            "currency": "INR",
        },
        {
            "name": "Cotton Breeze Saree",
            "slug": "cotton-breeze-saree",
            "category": "saree",
            "short_description": "Lightweight cotton saree perfect for everyday wear",
            "long_description": "Stay comfortable all day with our Cotton Breeze Saree. Made from premium quality cotton, this saree is perfect for both office and casual wear. The breathable fabric keeps you cool in warm weather.",
            "price": 3499,
            "compare_price": None,
            "images": ["/uploads/products/cotton-breeze-1.jpg"],
            "tag": None,
            "stock": 50,
            "specifications": [
                {"label": "Fabric", "value": "Premium Cotton"},
                {"label": "Length", "value": "6 meters"},
                {"label": "Blouse", "value": "Unstitched blouse piece included"},
                {"label": "Occasion", "value": "Daily wear, Office"},
            ],
            "shipping_info": ["Free shipping on orders above ₹999", "Delivery within 5-7 business days"],
            "featured": False,
            "active": True,
            "currency": "INR",
        },
        {
            "name": "Kumkumadi Facial Oil",
            "slug": "kumkumadi-facial-oil",
            "category": "skincare",
            "short_description": "Traditional Ayurvedic facial oil for radiant skin",
            "long_description": "Experience the ancient wisdom of Ayurveda with our Kumkumadi Facial Oil. This luxurious oil is formulated with 16 precious herbs including saffron, sandalwood, and turmeric to give you naturally radiant and glowing skin.",
            "price": 1899,
            "compare_price": 2299,
            "images": ["/uploads/products/kumkumadi-1.jpg"],
            "tag": "Premium",
            "stock": 75,
            "specifications": [
                {"label": "Volume", "value": "50ml"},
                {"label": "Skin Type", "value": "All skin types"},
                {"label": "Key Ingredients", "value": "Saffron, Sandalwood, Turmeric, Sesame Oil"},
                {"label": "Ayurvedic", "value": "100% Ayurvedic"},
            ],
            "shipping_info": ["Free shipping on orders above ₹999", "Delivery within 3-5 business days"],
            "featured": True,
            "active": True,
            "currency": "INR",
        },
    ]

    async def seed_if_empty(self) -> int:
        """Seed products if the collection is empty. Returns number of products seeded."""
        count = await get_db().products.count_documents({})
        if count > 0:
            # Fix old image paths: /images/products/ -> /uploads/products/
            await self._fix_old_image_paths()
            logger.info("Products collection already has %d documents, skipping seed", count)
            return 0
        
        now = _now()
        for product_data in self.DEFAULT_PRODUCTS:
            product = {
                "_id": str(uuid.uuid4()),
                "id": str(uuid.uuid4()),
                **product_data,
                "created_at": now,
                "updated_at": now,
                "deleted_at": None,
            }
            await get_db().products.insert_one(product)
        
        logger.info("Seeded %d default products", len(self.DEFAULT_PRODUCTS))
        return len(self.DEFAULT_PRODUCTS)

    async def _fix_old_image_paths(self) -> int:
        """Fix image paths for products that have old /images/products/ paths.
        
        Old path: /images/products/filename.jpg
        Correct path: /uploads/products/filename.jpg
        """
        db = get_db()
        # Find products with old image paths
        old_path_prefix = "/images/products/"
        updated_count = 0
        
        async for product in db.products.find({"images": {"$regex": "^" + old_path_prefix}}):
            new_images = [
                img.replace("/images/products/", "/uploads/products/")
                for img in product.get("images", [])
            ]
            if new_images != product.get("images"):
                await db.products.update_one(
                    {"_id": product["_id"]},
                    {"$set": {"images": new_images, "updated_at": _now()}}
                )
                updated_count += 1
                logger.info("Fixed image paths for product: %s", product.get("name"))
        
        if updated_count > 0:
            logger.info("Fixed image paths for %d products", updated_count)
        return updated_count

    async def create(self, payload: ProductCreate) -> dict:
        """Create a new product."""
        now = _now()
        product_id = str(uuid.uuid4())
        slug = payload.slug or _generate_slug(payload.name)

        # Check for duplicate slug
        existing = await get_db().products.find_one({"slug": slug, "deleted_at": None})
        if existing:
            raise ValueError(f"A product with slug '{slug}' already exists")

        product = {
            "_id": product_id,
            "id": product_id,
            "name": payload.name,
            "slug": slug,
            "category": payload.category,
            "short_description": payload.short_description,
            "long_description": payload.long_description,
            "price": payload.price,
            "compare_price": payload.compare_price,
            "images": payload.images or [],
            "tag": payload.tag,
            "stock": payload.stock,
            "specifications": [s.model_dump() for s in payload.specifications],
            "shipping_info": payload.shipping_info,
            "featured": payload.featured,
            "active": payload.active,
            "currency": payload.currency,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None,
        }

        await get_db().products.insert_one(product)
        logger.info("Product created id=%s name=%s slug=%s", product_id, payload.name, slug)
        return serialize_doc(product)

    async def get_by_id(self, product_id: str, include_deleted: bool = False) -> Optional[dict]:
        """Get a product by its ID."""
        query = {"id": product_id}
        if not include_deleted:
            query["deleted_at"] = None
        return serialize_doc(await get_db().products.find_one(query))

    async def get_by_slug(self, slug: str, include_deleted: bool = False) -> Optional[dict]:
        """Get a product by its slug."""
        query = {"slug": slug}
        if not include_deleted:
            query["deleted_at"] = None
        return serialize_doc(await get_db().products.find_one(query))

    async def list(
        self,
        category: Optional[str] = None,
        active: Optional[bool] = None,
        featured: Optional[bool] = None,
        search: Optional[str] = None,
        include_deleted: bool = False,
        limit: int = 100,
        skip: int = 0,
    ) -> tuple[list[dict], int]:
        """List products with optional filters."""
        query = {}
        if not include_deleted:
            query["deleted_at"] = None
        if category:
            query["category"] = category
        if active is not None:
            query["active"] = active
        if featured is not None:
            query["featured"] = featured
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"short_description": {"$regex": search, "$options": "i"}},
            ]

        cursor = get_db().products.find(query).sort("created_at", -1).skip(skip).limit(limit)
        products = serialize_docs(await cursor.to_list(length=limit))

        total = await get_db().products.count_documents(query)
        return products, total

    async def update(self, product_id: str, payload: ProductUpdate) -> Optional[dict]:
        """Update an existing product."""
        # Build update dict with only provided fields
        update_fields = {}
        for field_name, value in payload.model_dump(exclude_unset=True).items():
            if value is not None:
                # Map camelCase to snake_case for MongoDB
                snake_name = re.sub(r"(?<!^)(?=[A-Z])", "_", field_name).lower()
                if field_name == "shortDescription":
                    snake_name = "short_description"
                elif field_name == "longDescription":
                    snake_name = "long_description"
                elif field_name == "comparePrice":
                    snake_name = "compare_price"
                elif field_name == "shippingInfo":
                    snake_name = "shipping_info"
                update_fields[snake_name] = value

        if not update_fields:
            return await self.get_by_id(product_id)

        # Validate slug uniqueness if slug is being changed
        if "slug" in update_fields:
            existing = await get_db().products.find_one({
                "slug": update_fields["slug"],
                "id": {"$ne": product_id},
                "deleted_at": None,
            })
            if existing:
                raise ValueError(f"A product with slug '{update_fields['slug']}' already exists")

        update_fields["updated_at"] = _now()

        updated = await get_db().products.find_one_and_update(
            {"id": product_id, "deleted_at": None},
            {"$set": update_fields},
            return_document=ReturnDocument.AFTER,
        )
        if updated:
            logger.info("Product updated id=%s fields=%s", product_id, list(update_fields.keys()))
        return serialize_doc(updated)

    async def toggle_active(self, product_id: str) -> Optional[dict]:
        """Toggle the active status of a product."""
        product = await get_db().products.find_one_and_update(
            {"id": product_id, "deleted_at": None},
            [
                {"$set": {"active": {"$not": "$active"}, "updated_at": {"$literal": _now()}}}
            ],
            return_document=ReturnDocument.AFTER,
        )
        if product:
            logger.info("Product toggled active=%s id=%s", product.get("active"), product_id)
        return serialize_doc(product)

    async def soft_delete(self, product_id: str) -> Optional[dict]:
        """Soft delete a product (set deleted_at) to preserve historical orders."""
        now = _now()
        updated = await get_db().products.find_one_and_update(
            {"id": product_id},
            {"$set": {"deleted_at": now, "active": False, "updated_at": now}},
            return_document=ReturnDocument.AFTER,
        )
        if updated:
            logger.info("Product soft-deleted id=%s", product_id)
        return serialize_doc(updated)

    async def hard_delete(self, product_id: str) -> bool:
        """Permanently delete a product. Use only if not referenced in orders."""
        result = await get_db().products.delete_one({"id": product_id})
        if result.deleted_count:
            logger.info("Product hard-deleted id=%s", product_id)
            return True
        return False

    async def duplicate(self, product_id: str) -> Optional[dict]:
        """Create a duplicate of an existing product with a new ID."""
        original = await self.get_by_id(product_id, include_deleted=True)
        if not original:
            return None

        now = _now()
        new_id = str(uuid.uuid4())
        base_slug = _generate_slug(original["name"])
        slug = f"{base_slug}-copy"

        # Ensure unique slug
        counter = 1
        while await get_db().products.find_one({"slug": slug, "deleted_at": None}):
            slug = f"{base_slug}-copy-{counter}"
            counter += 1

        duplicate = original.copy()
        duplicate["_id"] = new_id
        duplicate["id"] = new_id
        duplicate["slug"] = slug
        duplicate["name"] = f"{original['name']} (Copy)"
        duplicate["featured"] = False
        duplicate["active"] = True
        duplicate["created_at"] = now
        duplicate["updated_at"] = now
        duplicate["deleted_at"] = None

        await get_db().products.insert_one(duplicate)
        logger.info("Product duplicated from=%s to=%s", product_id, new_id)
        return serialize_doc(duplicate)

    async def slug_exists(self, slug: str, exclude_id: Optional[str] = None) -> bool:
        """Check if a slug already exists (for validation)."""
        query = {"slug": slug, "deleted_at": None}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        return await get_db().products.find_one(query) is not None


product_service = ProductService()
