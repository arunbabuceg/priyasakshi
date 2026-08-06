"""FastAPI application factory + entrypoint.

Keep this file small: register middleware, mount routers, wire startup /
shutdown hooks. Business logic belongs in ``services``, request/response
shapes in ``models``, HTTP handlers in ``routes``.
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .config import settings, ROOT_DIR
from .db import close_db, get_db
from .routes import addresses, admin, auth, contact, health, newsletter, orders, payments, profile, products
from .services.order_service import order_service
from .services.product_service import product_service

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


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup: touch the DB so misconfiguration surfaces immediately.
    try:
        await get_db().command("ping")
        logger.info("Connected to MongoDB (db=%s)", settings.db_name)
    except Exception as exc:  # pragma: no cover - infra failure path
        logger.warning("MongoDB ping failed at startup: %s", exc)

    # Seed products if collection is empty
    try:
        seeded = await product_service.seed_if_empty()
        if seeded > 0:
            logger.info("Seeded %d default products", seeded)
    except Exception as exc:  # pragma: no cover - infra failure path
        logger.warning("Product seeding failed at startup: %s", exc)

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
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / "products").mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

    return app


app = create_app()
