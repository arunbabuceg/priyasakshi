"""Backend API smoke tests.

Run with::

    pytest

These tests hit the FastAPI app in-process using httpx.AsyncClient, so no
live server is needed.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def test_health_root(client: AsyncClient):
    r = await client.get("/api/")
    assert r.status_code == 200
    assert "running" in r.json()["message"].lower()


async def test_health_endpoint(client: AsyncClient):
    r = await client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


async def test_newsletter_subscribe(client: AsyncClient):
    r = await client.post("/api/newsletter/subscribe", json={"email": "test@example.com"})
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True


async def test_newsletter_invalid_email(client: AsyncClient):
    r = await client.post("/api/newsletter/subscribe", json={"email": "not-an-email"})
    assert r.status_code == 422


async def test_contact_submit(client: AsyncClient):
    payload = {
        "name": "Ananya",
        "email": "ananya@example.com",
        "message": "Loved the site!",
    }
    r = await client.post("/api/contact", json=payload)
    assert r.status_code == 200
    assert r.json()["ok"] is True


async def test_order_accepts_silently(client: AsyncClient):
    payload = {
        "customer_name": "Meera",
        "customer_email": "meera@example.com",
        "items": [{"product_id": "saree-magenta-olive", "quantity": 1, "price": 15999.0}],
        "total": 15999.0,
    }
    r = await client.post("/api/orders", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["status"] == "received"
    assert "order_id" in body
