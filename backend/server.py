"""Backend entrypoint.

Supervisor / Render / local uvicorn all invoke `uvicorn server:app`, so we keep this
tiny module as a stable import path. The actual application factory lives in
``app.main`` — see that file for routes, middleware and startup logic.
"""

from app.main import app  # noqa: F401  (re-exported)

__all__ = ["app"]
