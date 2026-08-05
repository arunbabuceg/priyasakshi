"""Saved addresses CRUD routes — all scoped to the authenticated user."""

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import get_current_user
from ..models.address import AddressCreate, AddressResponse, AddressUpdate
from ..services.address_service import address_service

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("", response_model=list[AddressResponse])
async def list_addresses(user=Depends(get_current_user)):
    return await address_service.list_addresses(user["id"])


@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(payload: AddressCreate, user=Depends(get_current_user)):
    return await address_service.create_address(user["id"], payload)


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(address_id: str, payload: AddressUpdate, user=Depends(get_current_user)):
    updated = await address_service.update_address(user["id"], address_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Address not found")
    return updated


@router.delete("/{address_id}")
async def delete_address(address_id: str, user=Depends(get_current_user)):
    ok = await address_service.delete_address(user["id"], address_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"ok": True, "message": "Address deleted"}
