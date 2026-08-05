"""Profile routes — view/edit name & phone, change password.

Email is intentionally not editable here.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import get_current_user
from ..models.profile import ChangePasswordRequest, ProfileResponse, ProfileUpdate
from ..services.auth_service import auth_service

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile(user=Depends(get_current_user)):
    return ProfileResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        email_verified=user.get("email_verified", False),
    )


@router.patch("", response_model=ProfileResponse)
async def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    updated = await auth_service.update_profile(user["id"], name=payload.name, phone=payload.phone)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return ProfileResponse(
        id=updated["id"],
        name=updated["name"],
        email=updated["email"],
        phone=updated.get("phone"),
        email_verified=updated.get("email_verified", False),
    )


@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest, user=Depends(get_current_user)):
    try:
        await auth_service.change_password(user["id"], payload.current_password, payload.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"ok": True, "message": "Password changed"}
