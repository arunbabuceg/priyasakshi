from fastapi import APIRouter

from ..config import settings

router = APIRouter(tags=["health"])


@router.get("/")
async def root():
    return {"message": f"{settings.brand_name} API is running"}


@router.get("/health")
async def health():
    return {"status": "ok", "service": settings.brand_name}
