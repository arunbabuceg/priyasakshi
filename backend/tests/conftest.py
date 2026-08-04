"""Pytest fixtures for backend tests.

Motor's AsyncIOMotorClient binds to the running asyncio loop at creation
time. pytest-asyncio creates a fresh event loop per test, so a module-level
singleton client will hit ``RuntimeError: Event loop is closed`` on the
second test. Resetting the app-level cache between tests keeps things
deterministic without changing production behaviour.
"""

from __future__ import annotations

import pytest

from app import db as db_module


@pytest.fixture(autouse=True)
def _reset_motor_client():
    """Force a fresh Motor client for every test."""
    db_module._client = None
    db_module._db = None
    yield
    db_module._client = None
    db_module._db = None
