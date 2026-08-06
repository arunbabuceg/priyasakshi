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


async def _auto_seed_products() -> None:
    """Automatically seed products if the collection is empty."""
    try:
        db = get_db()
        count = await db.products.count_documents({})
        if count > 0:
            logger.info("Products collection already has %d products, skipping seed", count)
            return
        
        logger.info("Products collection is empty, seeding default products...")
        
        default_products = [
            # Sarees
            {
                "name": "Magenta & Olive Heritage Silk",
                "slug": "saree-magenta-olive",
                "category": "saree",
                "price": 15999,
                "short_description": "Hand-woven pure silk saree with traditional kolam motifs and contrast olive pallu.",
                "long_description": "A regal heritage silk from our Kanchipuram artisans — deep magenta body, olive-green temple border and antique gold zari kolam motifs. Woven on traditional pit looms over 18 days by a single weaver family. Comes with a matching unstitched blouse piece.",
                "images": ["https://images.pexels.com/photos/5447529/pexels-photo-5447529.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Bestseller",
                "stock": 8,
                "specifications": [
                    {"label": "Material", "value": "Pure Kanchipuram silk"},
                    {"label": "Zari", "value": "Antique gold (silver dipped in gold)"},
                    {"label": "Weave", "value": "Pit loom, 18 days"},
                    {"label": "Length", "value": "5.5m + 0.8m blouse"},
                    {"label": "Care", "value": "Dry clean only"},
                ],
                "shipping_info": [
                    "Dispatched within 3–5 business days from Kanchipuram",
                    "Free shipping across India on orders above ₹5,000",
                    "International delivery in 10–14 business days",
                    "Unworn sarees returnable within 7 days of delivery",
                ],
                "featured": True,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Indigo & Marigold Handloom",
                "slug": "saree-blue-yellow",
                "category": "saree",
                "price": 13999,
                "short_description": "Soft handloom silk cotton with marigold pallu and delicate zari stripes.",
                "long_description": "Lightweight indigo silk-cotton handloom, perfect for daytime festivities. The marigold pallu is offset with fine gold zari lines and a temple-border finish.",
                "images": ["https://images.pexels.com/photos/6167463/pexels-photo-6167463.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Handloom",
                "stock": 6,
                "specifications": [
                    {"label": "Material", "value": "Silk-cotton blend"},
                    {"label": "Zari", "value": "Fine gold lines"},
                    {"label": "Weave", "value": "Handloom, 12 days"},
                    {"label": "Length", "value": "5.5m + 0.8m blouse"},
                    {"label": "Care", "value": "Dry clean recommended"},
                ],
                "shipping_info": [
                    "Dispatched within 3–5 business days from Kanchipuram",
                    "Free shipping across India on orders above ₹5,000",
                    "International delivery in 10–14 business days",
                    "Unworn sarees returnable within 7 days of delivery",
                ],
                "featured": False,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Sunlit Kanchipuram Silk",
                "slug": "saree-yellow-red",
                "category": "saree",
                "price": 18999,
                "short_description": "Pure Kanchipuram silk in golden yellow with a vermillion red border.",
                "long_description": "A bridal-worthy Kanchipuram silk in sun-kissed yellow with vermillion red korvai border. Woven with pure zari (silver dipped in gold) using a triple-shuttle technique — one of our most prized pieces.",
                "images": ["https://images.pexels.com/photos/28943531/pexels-photo-28943531.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Premium",
                "stock": 4,
                "specifications": [
                    {"label": "Material", "value": "Pure Kanchipuram silk"},
                    {"label": "Zari", "value": "Pure zari (silver dipped in gold)"},
                    {"label": "Weave", "value": "Triple-shuttle korvai, 20 days"},
                    {"label": "Length", "value": "5.5m + 0.8m blouse"},
                    {"label": "Care", "value": "Dry clean only"},
                ],
                "shipping_info": [
                    "Dispatched within 3–5 business days from Kanchipuram",
                    "Free shipping across India on orders above ₹5,000",
                    "International delivery in 10–14 business days",
                    "Unworn sarees returnable within 7 days of delivery",
                ],
                "featured": True,
                "active": True,
                "currency": "INR",
            },
            # Skincare
            {
                "name": "Tamarai 100-Herb Hair Oil",
                "slug": "skin-tamarai-oil",
                "category": "skincare",
                "price": 1999,
                "short_description": "Our signature hair oil infused with 100+ herbs — for deep root nourishment.",
                "long_description": "Our flagship formula: 103 sun-dried herbs cold-infused for 40 days into virgin coconut and sesame base oils. Strengthens roots, soothes the scalp, adds gloss and helps prevent hair fall. 100ml. Weekly ritual: warm gently, massage into scalp, leave overnight, wash with our reetha-shikakai rinse.",
                "images": ["https://images.pexels.com/photos/31401742/pexels-photo-31401742.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Signature",
                "stock": 30,
                "specifications": [
                    {"label": "Volume", "value": "100ml"},
                    {"label": "Base oils", "value": "Virgin coconut & sesame"},
                    {"label": "Infusion", "value": "103 herbs, 40 days cold-infused"},
                    {"label": "Use", "value": "Weekly, overnight"},
                    {"label": "Shelf life", "value": "18 months"},
                ],
                "shipping_info": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": True,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Orithal Tamarai Face Powder",
                "slug": "skin-orithal-powder",
                "category": "skincare",
                "price": 1499,
                "short_description": "A gentle exfoliating herbal powder for radiant, blemish-free skin.",
                "long_description": "Stone-ground orithal tamarai leaves blended with turmeric, sandalwood and rose petals. Mix with milk or rose water for a weekly ritual that brightens complexion and calms inflammation. 60g.",
                "images": ["https://images.pexels.com/photos/13014206/pexels-photo-13014206.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "20% Off",
                "stock": 45,
                "specifications": [
                    {"label": "Weight", "value": "60g"},
                    {"label": "Key herbs", "value": "Orithal tamarai, turmeric, sandalwood"},
                    {"label": "Use", "value": "Weekly face mask / scrub"},
                    {"label": "Skin type", "value": "All types"},
                    {"label": "Shelf life", "value": "12 months"},
                ],
                "shipping_info": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Ganga Tulasi Face Serum",
                "slug": "skin-ganga-tulasi",
                "category": "skincare",
                "price": 2499,
                "short_description": "Hydrating serum with holy basil, ganga tulasi and squalane for a dewy finish.",
                "long_description": "A featherweight herbal serum that pairs holy basil and ganga tulasi extracts with plant squalane and vitamin E. Locks in moisture, protects the skin barrier and leaves a natural dewy finish. 30ml.",
                "images": ["https://images.pexels.com/photos/8101534/pexels-photo-8101534.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "New",
                "stock": 25,
                "specifications": [
                    {"label": "Volume", "value": "30ml"},
                    {"label": "Key actives", "value": "Holy basil, ganga tulasi, squalane, vitamin E"},
                    {"label": "Use", "value": "Daily, morning & night"},
                    {"label": "Skin type", "value": "All types"},
                    {"label": "Shelf life", "value": "12 months"},
                ],
                "shipping_info": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Krishna Kranthi Facial Oil",
                "slug": "skin-krishna-kranthi",
                "category": "skincare",
                "price": 2299,
                "short_description": "Hydrating facial oil for a rejuvenated, glowing complexion.",
                "long_description": "Cold-infused krishna kranthi (blue clitoria) petals in a base of jojoba and rosehip oils. Anti-ageing, brightening and deeply calming — a nightly ritual for radiant skin. 30ml.",
                "images": ["https://images.pexels.com/photos/7796984/pexels-photo-7796984.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Anti-ageing",
                "stock": 20,
                "specifications": [
                    {"label": "Volume", "value": "30ml"},
                    {"label": "Base oils", "value": "Jojoba & rosehip"},
                    {"label": "Key herb", "value": "Krishna kranthi (blue clitoria)"},
                    {"label": "Use", "value": "Nightly"},
                    {"label": "Shelf life", "value": "15 months"},
                ],
                "shipping_info": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Tribal Poduthalai Hair Oil",
                "slug": "skin-tribal-poduthalai",
                "category": "skincare",
                "price": 2199,
                "short_description": "A tribal recipe that visibly softens, strengthens and reduces dandruff in 25 days.",
                "long_description": "A rare tribal formulation of poduthalai (Phyla Nodiflora) infused into cold-pressed base oils. Day 2 — hair feels softer and shinier, dandruff visibly reduces. Day 12 — regular application makes hair more manageable. Day 25 — noticeable strengthening and reduced hair fall. 100ml.",
                "images": ["https://images.pexels.com/photos/8490090/pexels-photo-8490090.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Tribal Recipe",
                "stock": 20,
                "specifications": [
                    {"label": "Volume", "value": "100ml"},
                    {"label": "Key herb", "value": "Poduthalai (Phyla Nodiflora)"},
                    {"label": "Use", "value": "2–3 times weekly"},
                    {"label": "Shelf life", "value": "18 months"},
                ],
                "shipping_info": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Neeli Mahabringaraj Hair Oil",
                "slug": "skin-neeli-mahabringaraj",
                "category": "skincare",
                "price": 2399,
                "short_description": "Strengthens hair, promotes growth and prevents hair fall — a classical ayurvedic blend.",
                "long_description": "A classical ayurvedic blend of neeli (indigofera) and mahabringaraj (eclipta) slow-cooked into a nourishing base of sesame and coconut oils. Strengthens the hair shaft, promotes healthy new growth and prevents fall. 100ml.",
                "images": ["https://images.pexels.com/photos/4408447/pexels-photo-4408447.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Ayurvedic",
                "stock": 25,
                "specifications": [
                    {"label": "Volume", "value": "100ml"},
                    {"label": "Base oils", "value": "Sesame & coconut"},
                    {"label": "Key herbs", "value": "Neeli (indigofera), Mahabringaraj (eclipta)"},
                    {"label": "Use", "value": "Weekly, overnight"},
                    {"label": "Shelf life", "value": "18 months"},
                ],
                "shipping_info": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Kuppaimeni Herbal Mix Powder",
                "slug": "skin-kuppaimeni-powder",
                "category": "skincare",
                "price": 1299,
                "short_description": "Traditional herbal powder for skin problems, unwanted facial hair and daily face care.",
                "long_description": "A traditional medicine powder built on generations of knowledge and skills. Kuppaimeni (Acalypha Indica) is stone-ground with complementary herbs to help with skin problems, improve skin health, gently remove facial hair and support daily face care. 80g.",
                "images": ["https://images.pexels.com/photos/6634681/pexels-photo-6634681.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Traditional",
                "stock": 30,
                "specifications": [
                    {"label": "Weight", "value": "80g"},
                    {"label": "Key herb", "value": "Kuppaimeni (Acalypha Indica)"},
                    {"label": "Use", "value": "Face pack 2–3 times weekly"},
                    {"label": "Skin type", "value": "All types"},
                    {"label": "Shelf life", "value": "12 months"},
                ],
                "shipping_info": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
                "currency": "INR",
            },
            {
                "name": "Garden Glow Herbal Blend",
                "slug": "skin-garden-glow-blend",
                "category": "skincare",
                "price": 1799,
                "short_description": "A ready-to-brew herbal wellness tea for glow from within.",
                "long_description": "Sun-dried tulasi, moringa, hibiscus and licorice root — steep for 5 minutes for a daily glow ritual that supports skin and digestion. 80g loose leaf.",
                "images": ["https://images.pexels.com/photos/11213970/pexels-photo-11213970.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Wellness",
                "stock": 35,
                "specifications": [
                    {"label": "Weight", "value": "80g loose leaf"},
                    {"label": "Ingredients", "value": "Tulasi, moringa, hibiscus, licorice root"},
                    {"label": "Use", "value": "1 cup daily"},
                    {"label": "Servings", "value": "~40 cups"},
                    {"label": "Shelf life", "value": "12 months"},
                ],
                "shipping_info": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
                "currency": "INR",
            },
        ]
        
        now = _now()
        for product_data in default_products:
            product_id = str(uuid.uuid4())
            product = {
                "_id": product_id,
                "id": product_id,
                "created_at": now,
                "updated_at": now,
                "deleted_at": None,
                **product_data,
            }
            await db.products.insert_one(product)
            logger.info("Seeded product: %s", product_data["name"])
        
        logger.info("Successfully seeded %d products", len(default_products))
    except Exception as e:
        logger.error("Failed to auto-seed products: %s", e)
