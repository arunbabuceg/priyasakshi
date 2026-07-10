"""Application configuration loaded from environment variables.

Uses pydantic-settings for typed, validated config with `.env` file support.
Keep this file the *only* place that reads `os.environ` — everything else
should depend on the `settings` object.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Typed settings container."""

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Database ----
    mongo_url: str = Field(..., alias="MONGO_URL")
    db_name: str = Field("priya_sakshi", alias="DB_NAME")

    # ---- CORS ----
    cors_origins: str = Field("*", alias="CORS_ORIGINS")

    # ---- Branding ----
    brand_name: str = Field("Priya Sakshi", alias="BRAND_NAME")
    brand_from_email: str = Field("hello@priyasakshi.com", alias="BRAND_FROM_EMAIL")

    # ---- Email (Resend) ----
    email_enabled: bool = Field(False, alias="EMAIL_ENABLED")
    resend_api_key: str = Field("", alias="RESEND_API_KEY")

    @property
    def cors_origins_list(self) -> List[str]:
        raw = (self.cors_origins or "").strip()
        if not raw or raw == "*":
            return ["*"]
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

    @property
    def allow_credentials(self) -> bool:
        return self.cors_origins_list != ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
