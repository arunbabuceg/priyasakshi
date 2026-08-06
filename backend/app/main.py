"""FastAPI application factory + entrypoint.

Keep this file small: register middleware, mount routers, wire startup /
shutdown hooks. Business logic belongs in ``services``, request/response
shapes in ``models``, HTTP handlers in ``routes``.
"""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings, ROOT_DIR
from .db import close_db, get_db
from .routes import addresses, admin, auth, contact, health, newsletter, orders, payments, profile, products
from .services.order_service import order_service

# How often the unpaid-order sweeper runs.
PAYMENT_SWEEP_INTERVAL_SECONDS = 15 * 60

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("priya_sakshi")


async def _payment_expiry_sweeper() -> None:
    """Cancel orders whose 12-hour payment window has elapsed."""
    while True:
        try:
            await order_service.cancel_expired_unpaid_orders()
        except asyncio.CancelledError:
            raise
        except Exception:  # pragma: no cover - infra failure path
            logger.exception("Unpaid-order sweep failed")
        await asyncio.sleep(PAYMENT_SWEEP_INTERVAL_SECONDS)


async def _seed_products_once() -> None:
    """Seed products if the collection is empty. Runs only once."""
    try:
        db = get_db()
        existing_count = await db.products.count_documents({})

        if existing_count > 0:
            logger.info("Products collection already has %d products, skipping seed", existing_count)
            return

        # Import here to avoid circular imports
        from app.services.product_service import product_service
        from app.models.product import ProductCreate, Specification

        # Static product data from frontend/src/data/products.js
        PRODUCTS = [
            # ---------- Sarees ----------
            {
                "name": "Magenta & Olive Heritage Silk",
                "slug": "saree-magenta-olive",
                "category": "saree",
                "price": 15999,
                "shortDescription": "Hand-woven pure silk saree with traditional kolam motifs and contrast olive pallu.",
                "longDescription": "A regal heritage silk from our Kanchipuram artisans — deep magenta body, olive-green temple border and antique gold zari kolam motifs. Woven on traditional pit looms over 18 days by a single weaver family. Comes with a matching unstitched blouse piece.",
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
                "shippingInfo": [
                    "Dispatched within 3–5 business days from Kanchipuram",
                    "Free shipping across India on orders above ₹5,000",
                    "International delivery in 10–14 business days",
                    "Unworn sarees returnable within 7 days of delivery",
                ],
                "featured": True,
                "active": True,
            },
            {
                "name": "Indigo & Marigold Handloom",
                "slug": "saree-blue-yellow",
                "category": "saree",
                "price": 13999,
                "shortDescription": "Soft handloom silk cotton with marigold pallu and delicate zari stripes.",
                "longDescription": "Lightweight indigo silk-cotton handloom, perfect for daytime festivities. The marigold pallu is offset with fine gold zari lines and a temple-border finish.",
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
                "shippingInfo": [
                    "Dispatched within 3–5 business days from Kanchipuram",
                    "Free shipping across India on orders above ₹5,000",
                    "International delivery in 10–14 business days",
                    "Unworn sarees returnable within 7 days of delivery",
                ],
                "featured": False,
                "active": True,
            },
            {
                "name": "Sunlit Kanchipuram Silk",
                "slug": "saree-yellow-red",
                "category": "saree",
                "price": 18999,
                "shortDescription": "Pure Kanchipuram silk in golden yellow with a vermillion red border.",
                "longDescription": "A bridal-worthy Kanchipuram silk in sun-kissed yellow with vermillion red korvai border. Woven with pure zari (silver dipped in gold) using a triple-shuttle technique — one of our most prized pieces.",
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
                "shippingInfo": [
                    "Dispatched within 3–5 business days from Kanchipuram",
                    "Free shipping across India on orders above ₹5,000",
                    "International delivery in 10–14 business days",
                    "Unworn sarees returnable within 7 days of delivery",
                ],
                "featured": True,
                "active": True,
            },
            # ---------- Skincare ----------
            {
                "name": "Tamarai 100-Herb Hair Oil",
                "slug": "skin-tamarai-oil",
                "category": "skincare",
                "price": 1999,
                "shortDescription": "Our signature hair oil infused with 100+ herbs — for deep root nourishment.",
                "longDescription": "Our flagship formula: 103 sun-dried herbs cold-infused for 40 days into virgin coconut and sesame base oils. Strengthens roots, soothes the scalp, adds gloss and helps prevent hair fall. 100ml. Weekly ritual: warm gently, massage into scalp, leave overnight, wash with our reetha-shikakai rinse.",
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
                "shippingInfo": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": True,
                "active": True,
            },
            {
                "name": "Orithal Tamarai Face Powder",
                "slug": "skin-orithal-powder",
                "category": "skincare",
                "price": 1499,
                "shortDescription": "A gentle exfoliating herbal powder for radiant, blemish-free skin.",
                "longDescription": "Stone-ground orithal tamarai leaves blended with turmeric, sandalwood and rose petals. Mix with milk or rose water for a weekly ritual that brightens complexion and calms inflammation. 60g.",
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
                "shippingInfo": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
            },
            {
                "name": "Ganga Tulasi Face Serum",
                "slug": "skin-ganga-tulasi",
                "category": "skincare",
                "price": 2499,
                "shortDescription": "Hydrating serum with holy basil, ganga tulasi and squalane for a dewy finish.",
                "longDescription": "A featherweight herbal serum that pairs holy basil and ganga tulasi extracts with plant squalane and vitamin E. Reduces redness, locks in moisture and preps skin for the day ahead. 30ml.",
                "images": ["https://images.pexels.com/photos/3738088/pexels-photo-3738088.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "New",
                "stock": 25,
                "specifications": [
                    {"label": "Volume", "value": "30ml"},
                    {"label": "Key actives", "value": "Plant squalane, vitamin E, holy basil & rosehip"},
                    {"label": "Use", "value": "Daily, AM & PM"},
                    {"label": "Skin type", "value": "All types"},
                    {"label": "Shelf life", "value": "12 months"},
                ],
                "shippingInfo": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": True,
                "active": True,
            },
            {
                "name": "Tribal Poduthalai Hair Oil",
                "slug": "skin-tribal-poduthalai",
                "category": "skincare",
                "price": 2199,
                "shortDescription": "A tribal recipe that visibly softens, strengthens and reduces dandruff in 25 days.",
                "longDescription": "A rare tribal formulation of poduthalai (Phyla Nodiflora) infused into cold-pressed base oils. Day 2 — hair feels softer and shinier, dandruff visibly reduces. Day 12 — regular application makes hair more manageable. Day 25 — noticeable strengthening and reduced hair fall. 100ml.",
                "images": ["https://images.pexels.com/photos/8490090/pexels-photo-8490090.jpeg?auto=compress&cs=tinysrgb&h=900&w=720"],
                "tag": "Tribal Recipe",
                "stock": 20,
                "specifications": [
                    {"label": "Volume", "value": "100ml"},
                    {"label": "Key herb", "value": "Poduthalai (Phyla Nodiflora)"},
                    {"label": "Use", "value": "2–3 times weekly"},
                    {"label": "Shelf life", "value": "18 months"},
                ],
                "shippingInfo": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
            },
            {
                "name": "Neeli Mahabringaraj Hair Oil",
                "slug": "skin-neeli-mahabringaraj",
                "category": "skincare",
                "price": 2399,
                "shortDescription": "Strengthens hair, promotes growth and prevents hair fall — a classical ayurvedic blend.",
                "longDescription": "A classical ayurvedic blend of neeli (indigofera) and mahabringaraj (eclipta) slow-cooked into a nourishing base of sesame and coconut oils. Strengthens the hair shaft, promotes healthy new growth and prevents fall. 100ml.",
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
                "shippingInfo": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
            },
            {
                "name": "Kuppaimeni Herbal Mix Powder",
                "slug": "skin-kuppaimeni-powder",
                "category": "skincare",
                "price": 1299,
                "shortDescription": "Traditional herbal powder for skin problems, unwanted facial hair and daily face care.",
                "longDescription": "A traditional medicine powder built on generations of knowledge and skills. Kuppaimeni (Acalypha Indica) is stone-ground with complementary herbs to help with skin problems, improve skin health, gently remove facial hair and support daily face care. 80g.",
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
                "shippingInfo": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
            },
            {
                "name": "Garden Glow Herbal Blend",
                "slug": "skin-garden-glow-blend",
                "category": "skincare",
                "price": 1799,
                "shortDescription": "A ready-to-brew herbal wellness tea for glow from within.",
                "longDescription": "Sun-dried tulasi, moringa, hibiscus and licorice root — steep for 5 minutes for a daily glow ritual that supports skin and digestion. 80g loose leaf.",
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
                "shippingInfo": [
                    "Dispatched within 2–3 business days",
                    "Free shipping across India on orders above ₹5,000",
                    "Non-returnable for hygiene reasons; exchange if damaged in transit",
                ],
                "featured": False,
                "active": True,
            },
        ]

        logger.info("Seeding %d products...", len(PRODUCTS))
        for i, product_data in enumerate(PRODUCTS, 1):
            try:
                specifications = [
                    Specification(label=s["label"], value=s["value"])
                    for s in product_data.get("specifications", [])
                ]

                payload = ProductCreate(
                    name=product_data["name"],
                    slug=product_data["slug"],
                    category=product_data["category"],
                    short_description=product_data.get("shortDescription", ""),
                    long_description=product_data.get("longDescription", ""),
                    price=product_data["price"],
                    compare_price=product_data.get("compare_price"),
                    images=product_data.get("images", []),
                    tag=product_data.get("tag"),
                    stock=product_data.get("stock", 0),
                    specifications=specifications,
                    shipping_info=product_data.get("shippingInfo", []),
                    featured=product_data.get("featured", False),
                    active=product_data.get("active", True),
                    currency="INR",
                )

                await product_service.create(payload)
                logger.info("  [%d/%d] Seeded: %s", i, len(PRODUCTS), product_data["name"])
            except Exception as e:
                logger.error("  [%d/%d] Failed to seed %s: %s", i, len(PRODUCTS), product_data["name"], e)

        logger.info("Product seeding complete")
    except Exception as exc:
        logger.warning("Product seeding failed: %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup: touch the DB so misconfiguration surfaces immediately.
    try:
        await get_db().command("ping")
        logger.info("Connected to MongoDB (db=%s)", settings.db_name)
    except Exception as exc:  # pragma: no cover - infra failure path
        logger.warning("MongoDB ping failed at startup: %s", exc)

    # Seed products if collection is empty
    await _seed_products_once()

    sweeper = asyncio.create_task(_payment_expiry_sweeper())
    yield
    # Shutdown
    sweeper.cancel()
    try:
        await sweeper
    except asyncio.CancelledError:
        pass
    await close_db()
    logger.info("MongoDB connection closed")


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.brand_name} API",
        version="1.0.0",
        lifespan=lifespan,
    )

    # ---- CORS ----
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://www.priyasakshi.com",
            "https://priyasakshi.com",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Routers (all prefixed with /api via ingress rules) ----
    app.include_router(health.router, prefix="/api")
    app.include_router(auth.router, prefix="/api")
    app.include_router(newsletter.router, prefix="/api")
    app.include_router(contact.router, prefix="/api")
    app.include_router(orders.router, prefix="/api")
    app.include_router(payments.router, prefix="/api")
    app.include_router(profile.router, prefix="/api")
    app.include_router(addresses.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")
    # Products - public endpoints
    app.include_router(products.router, prefix="/api")
    # Products - admin endpoints
    app.include_router(products.admin_router, prefix="/api")

    # ---- Static files (uploads) ----
    upload_dir = ROOT_DIR / "uploads"
    if upload_dir.exists():
        app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

    return app


app = create_app()
