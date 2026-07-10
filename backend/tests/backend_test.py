"""Backend API tests for Lakshmi Sakshi e-commerce app."""
import os
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://priya-production.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


@pytest.fixture(scope="session")
def mongo_db():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


# ---------- Root / health ----------
def test_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json() == {"message": "Lakshmi Sakshi API is running"}


# ---------- Products ----------
def test_products_list_shape():
    r = requests.get(f"{API}/products", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list), f"Expected list, got {type(data)}"
    assert len(data) == 11, f"Expected 11 products, got {len(data)}"
    for p in data:
        for key in ("id", "name", "category", "price", "currency", "short_description", "long_description", "image", "stock"):
            assert key in p, f"missing {key} in {p.get('id')}"
        assert p["currency"] == "inr"
        assert isinstance(p["price"], (int, float))


def test_products_filter_saree():
    r = requests.get(f"{API}/products", params={"category": "saree"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 3
    assert all(p["category"] == "saree" for p in data)


def test_products_filter_skincare():
    r = requests.get(f"{API}/products", params={"category": "skincare"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 8
    assert all(p["category"] == "skincare" for p in data)


def test_product_detail_tamarai():
    r = requests.get(f"{API}/products/skin-tamarai-oil", timeout=15)
    assert r.status_code == 200
    p = r.json()
    assert p["id"] == "skin-tamarai-oil"
    assert "Tamarai" in p["name"]
    assert p["category"] == "skincare"


def test_product_detail_404():
    r = requests.get(f"{API}/products/does-not-exist", timeout=15)
    assert r.status_code == 404


# ---------- Ingredients ----------
def test_ingredients():
    r = requests.get(f"{API}/ingredients", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "count" in data and "ingredients" in data
    assert isinstance(data["ingredients"], list)
    assert data["count"] == len(data["ingredients"])
    assert data["count"] == 103


# ---------- Checkout ----------
def _valid_checkout_payload(items=None):
    return {
        "items": items if items is not None else [{"product_id": "skin-tamarai-oil", "quantity": 2}],
        "origin_url": "https://example.com",
        "customer_name": "TEST User",
        "customer_email": "test_user@example.com",
        "shipping_address": "1 Test Street",
        "shipping_city": "Chennai",
        "shipping_state": "TN",
        "shipping_postal_code": "600001",
        "shipping_country": "IN",
        "phone": "+911234567890",
    }


def test_checkout_session_success(mongo_db):
    payload = _valid_checkout_payload()
    r = requests.post(f"{API}/checkout/session", json=payload, timeout=45)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("url") and data.get("session_id")
    assert "checkout.stripe.com" in data["url"] or data["url"].startswith("http")
    session_id = data["session_id"]
    # verify DB records
    txn = mongo_db.payment_transactions.find_one({"session_id": session_id})
    assert txn is not None
    assert txn["payment_status"] == "initiated"
    order = mongo_db.orders.find_one({"session_id": session_id})
    assert order is not None
    assert order["payment_status"] == "initiated"


def test_checkout_invalid_product():
    payload = _valid_checkout_payload(items=[{"product_id": "nope-xxx", "quantity": 1}])
    r = requests.post(f"{API}/checkout/session", json=payload, timeout=30)
    assert r.status_code == 400
    assert "Invalid product" in r.json().get("detail", "")


def test_checkout_empty_cart():
    payload = _valid_checkout_payload(items=[])
    r = requests.post(f"{API}/checkout/session", json=payload, timeout=30)
    assert r.status_code == 400
    assert r.json().get("detail") == "Cart is empty"


def test_checkout_status_unknown():
    r = requests.get(f"{API}/checkout/status/unknown-session-xyz-123", timeout=30)
    assert r.status_code == 404
    assert r.json().get("detail") == "Session not found"


# ---------- Newsletter ----------
def test_newsletter_subscribe_idempotent(mongo_db):
    email = "test_newsletter@example.com"
    mongo_db.newsletter.delete_many({"email": email})
    for _ in range(2):
        r = requests.post(f"{API}/newsletter/subscribe", json={"email": email, "name": "TEST"}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body == {"ok": True, "message": "Subscribed"}
    count = mongo_db.newsletter.count_documents({"email": email})
    assert count == 1, f"Expected 1 doc after dedupe, got {count}"
    mongo_db.newsletter.delete_many({"email": email})


# ---------- Contact ----------
def test_contact_message(mongo_db):
    payload = {"name": "TEST Sender", "email": "test_contact@example.com", "message": "TEST hello"}
    r = requests.post(f"{API}/contact", json=payload, timeout=15)
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    doc = mongo_db.contact_messages.find_one({"email": payload["email"], "message": "TEST hello"})
    assert doc is not None
    mongo_db.contact_messages.delete_many({"email": payload["email"]})


# ---------- CORS ----------
def test_cors_options_products():
    r = requests.options(
        f"{API}/products",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "GET",
        },
        timeout=15,
    )
    # Preflight should succeed and reflect an allow-origin header
    assert r.status_code in (200, 204)
    allow = r.headers.get("access-control-allow-origin", "")
    assert allow in ("*", "https://example.com"), f"Got: {allow!r}"
