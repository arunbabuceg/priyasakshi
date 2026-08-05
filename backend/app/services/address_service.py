"""Saved addresses persistence service.

Addresses live in the `addresses` collection, each scoped to a user via
`user_id`. CRUD is fully user-scoped — a caller can never read or mutate
another user's addresses.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from ..db import get_db
from ..models.address import AddressCreate, AddressUpdate

logger = logging.getLogger("priya_sakshi.addresses")


class AddressService:
    async def list_addresses(self, user_id: str) -> list[dict]:
        cursor = get_db().addresses.find({"user_id": user_id}).sort("created_at", 1)
        return await cursor.to_list(length=None)

    async def create_address(self, user_id: str, payload: AddressCreate) -> dict:
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **payload.model_dump(),
        }
        await get_db().addresses.insert_one(doc)
        return doc

    async def update_address(self, user_id: str, address_id: str, payload: AddressUpdate) -> dict | None:
        return await get_db().addresses.find_one_and_update(
            {"id": address_id, "user_id": user_id},
            {"$set": payload.model_dump()},
            return_document=True,
        )

    async def delete_address(self, user_id: str, address_id: str) -> bool:
        res = await get_db().addresses.delete_one({"id": address_id, "user_id": user_id})
        return res.deleted_count > 0


address_service = AddressService()
