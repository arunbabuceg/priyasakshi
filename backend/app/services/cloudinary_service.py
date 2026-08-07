"""Cloudinary upload service.

Wraps the synchronous Cloudinary Python SDK in asyncio-friendly helpers by
running uploads in a thread-pool executor so the event loop is never blocked.
"""

from __future__ import annotations

import asyncio
import io
import logging
from typing import Optional

import cloudinary
import cloudinary.uploader

from ..config import settings

logger = logging.getLogger("priya_sakshi.cloudinary")


def _configure() -> bool:
    """Configure Cloudinary from settings. Returns True if configured."""
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        return False
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    return True


_configured: Optional[bool] = None


def _is_configured() -> bool:
    global _configured
    if _configured is None:
        _configured = _configure()
    return _configured


def _upload_image_sync(file_bytes: bytes, public_id: Optional[str] = None) -> str:
    """Synchronous upload of an image to Cloudinary. Returns secure URL."""
    if not _is_configured():
        raise RuntimeError("Cloudinary is not configured")
    kwargs: dict = {
        "folder": "priya_sakshi/products",
        "resource_type": "image",
        "overwrite": True,
    }
    if public_id:
        kwargs["public_id"] = public_id
    result = cloudinary.uploader.upload(io.BytesIO(file_bytes), **kwargs)
    url: str = result["secure_url"]
    return url


def _upload_pdf_sync(pdf_bytes: bytes, public_id: str) -> str:
    """Synchronous upload of a PDF to Cloudinary. Returns secure URL."""
    if not _is_configured():
        raise RuntimeError("Cloudinary is not configured")
    result = cloudinary.uploader.upload(
        io.BytesIO(pdf_bytes),
        folder="priya_sakshi/invoices",
        public_id=public_id,
        resource_type="raw",
        overwrite=True,
    )
    url: str = result["secure_url"]
    return url


async def upload_image(file_bytes: bytes, public_id: Optional[str] = None) -> str:
    """Upload image bytes to Cloudinary asynchronously. Returns secure URL."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _upload_image_sync, file_bytes, public_id)


async def upload_pdf(pdf_bytes: bytes, public_id: str) -> str:
    """Upload PDF bytes to Cloudinary asynchronously. Returns secure URL."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _upload_pdf_sync, pdf_bytes, public_id)


def is_configured() -> bool:
    """Returns True if Cloudinary is configured and ready."""
    return _is_configured()
