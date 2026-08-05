"""MongoDB connection helpers.

A single AsyncIOMotorClient is created for the app lifetime and exposed as
`db`. Routes receive collections via helper functions to keep the interface
small and easy to swap for tests.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_url)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        _db = get_client()[settings.db_name]
    return _db


async def close_db() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None


def serialize_doc(doc: dict | None) -> dict | None:
    """Strip MongoDB's non-serializable ``_id`` from a document.

    FastAPI's JSON encoder cannot serialize ``ObjectId``; every endpoint that
    returns a raw Mongo document must pass it through this helper first.
    """
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc


def serialize_docs(docs: list[dict]) -> list[dict]:
    """Strip ``_id`` from every document in a list."""
    for d in docs:
        d.pop("_id", None)
    return docs
