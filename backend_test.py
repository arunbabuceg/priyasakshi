"""
Backend API Integration Tests for Priya Sakshi
Tests all endpoints against the production URL
"""

import requests
import uuid
import json

# Base URL from frontend/.env VITE_BACKEND_URL
BASE_URL = "https://priya-production.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_root_endpoint():
    """Test GET /api/ - should return 200 with message"""
    print("\n=== Testing GET /api/ ===")
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data, "Response missing 'message' field"
        assert "priya sakshi" in data["message"].lower(), f"Message doesn't contain 'Priya Sakshi': {data['message']}"
        assert "running" in data["message"].lower(), f"Message doesn't contain 'running': {data['message']}"
        
        print("✅ PASSED: Root endpoint working correctly")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_health_endpoint():
    """Test GET /api/health - should return 200 with status and service"""
    print("\n=== Testing GET /api/health ===")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected status='ok', got {data.get('status')}"
        assert "priya sakshi" in data.get("service", "").lower(), f"Service field doesn't contain 'Priya Sakshi': {data.get('service')}"
        
        print("✅ PASSED: Health endpoint working correctly")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_newsletter_subscribe_valid():
    """Test POST /api/newsletter/subscribe with valid email"""
    print("\n=== Testing POST /api/newsletter/subscribe (valid email) ===")
    try:
        # Use a unique email for testing
        test_email = f"reviewer_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": test_email,
            "name": "Reviewer"
        }
        
        response = requests.post(f"{API_BASE}/newsletter/subscribe", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("ok") is True, f"Expected ok=True, got {data.get('ok')}"
        assert "message" in data, "Response missing 'message' field"
        
        print("✅ PASSED: Newsletter subscribe with valid email working")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_newsletter_subscribe_idempotent():
    """Test POST /api/newsletter/subscribe idempotency (repeat call)"""
    print("\n=== Testing POST /api/newsletter/subscribe (idempotency) ===")
    try:
        test_email = f"idempotent_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": test_email,
            "name": "Idempotent Test"
        }
        
        # First call
        response1 = requests.post(f"{API_BASE}/newsletter/subscribe", json=payload, timeout=10)
        print(f"First call - Status Code: {response1.status_code}")
        
        # Second call with same email
        response2 = requests.post(f"{API_BASE}/newsletter/subscribe", json=payload, timeout=10)
        print(f"Second call - Status Code: {response2.status_code}")
        print(f"Response: {response2.json()}")
        
        assert response2.status_code == 200, f"Expected 200 on repeat, got {response2.status_code}"
        data = response2.json()
        assert data.get("ok") is True, f"Expected ok=True on repeat, got {data.get('ok')}"
        
        print("✅ PASSED: Newsletter subscribe is idempotent")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_newsletter_subscribe_invalid_email():
    """Test POST /api/newsletter/subscribe with invalid email"""
    print("\n=== Testing POST /api/newsletter/subscribe (invalid email) ===")
    try:
        payload = {"email": "not-an-email"}
        
        response = requests.post(f"{API_BASE}/newsletter/subscribe", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        
        print("✅ PASSED: Invalid email correctly rejected with 422")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_newsletter_subscribe_missing_email():
    """Test POST /api/newsletter/subscribe with missing email"""
    print("\n=== Testing POST /api/newsletter/subscribe (missing email) ===")
    try:
        payload = {}
        
        response = requests.post(f"{API_BASE}/newsletter/subscribe", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        
        print("✅ PASSED: Missing email correctly rejected with 422")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_contact_form_valid():
    """Test POST /api/contact with valid data"""
    print("\n=== Testing POST /api/contact (valid data) ===")
    try:
        payload = {
            "name": "Ananya",
            "email": "ananya@example.com",
            "message": "Loved the site!"
        }
        
        response = requests.post(f"{API_BASE}/contact", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("ok") is True, f"Expected ok=True, got {data.get('ok')}"
        
        print("✅ PASSED: Contact form with valid data working")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_contact_form_empty_name():
    """Test POST /api/contact with empty name"""
    print("\n=== Testing POST /api/contact (empty name) ===")
    try:
        payload = {
            "name": "",
            "email": "test@example.com",
            "message": "Test message"
        }
        
        response = requests.post(f"{API_BASE}/contact", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        
        print("✅ PASSED: Empty name correctly rejected with 422")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_contact_form_empty_message():
    """Test POST /api/contact with empty message"""
    print("\n=== Testing POST /api/contact (empty message) ===")
    try:
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "message": ""
        }
        
        response = requests.post(f"{API_BASE}/contact", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        
        print("✅ PASSED: Empty message correctly rejected with 422")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_orders_endpoint_valid():
    """Test POST /api/orders with realistic cart payload"""
    print("\n=== Testing POST /api/orders (valid cart) ===")
    try:
        payload = {
            "customer_name": "Meera",
            "customer_email": "meera@example.com",
            "phone": "+919999999999",
            "items": [
                {
                    "product_id": "saree-magenta-olive",
                    "name": "Magenta & Olive Heritage Silk",
                    "quantity": 1,
                    "price": 15999.0
                }
            ],
            "shipping": {
                "line1": "12 Weavers St",
                "city": "Kanchipuram",
                "state": "TN",
                "postal_code": "631502",
                "country": "India"
            },
            "currency": "INR",
            "subtotal": 15999.0,
            "shipping_fee": 0.0,
            "total": 15999.0
        }
        
        response = requests.post(f"{API_BASE}/orders", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("ok") is True, f"Expected ok=True, got {data.get('ok')}"
        assert data.get("status") == "received", f"Expected status='received', got {data.get('status')}"
        assert "order_id" in data, "Response missing 'order_id' field"
        
        # Verify order_id is a valid UUID
        order_id = data["order_id"]
        try:
            uuid.UUID(order_id)
            print(f"Order ID is valid UUID: {order_id}")
        except ValueError:
            raise AssertionError(f"order_id is not a valid UUID: {order_id}")
        
        # Check message contains "Online payments will be available soon"
        message = data.get("message", "")
        assert "online payments will be available soon" in message.lower(), \
            f"Message doesn't contain 'Online payments will be available soon': {message}"
        
        print("✅ PASSED: Orders endpoint working correctly")
        return True, order_id
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False, None

def test_orders_endpoint_empty_items():
    """Test POST /api/orders with empty items list"""
    print("\n=== Testing POST /api/orders (empty items) ===")
    try:
        payload = {
            "customer_name": "Test User",
            "customer_email": "test@example.com",
            "items": [],
            "total": 0.0
        }
        
        response = requests.post(f"{API_BASE}/orders", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        # Note: Empty array is allowed by schema, so we just record the behavior
        print(f"ℹ️  INFO: Empty items list returned status {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_orders_endpoint_missing_email():
    """Test POST /api/orders with missing customer_email"""
    print("\n=== Testing POST /api/orders (missing email) ===")
    try:
        payload = {
            "customer_name": "Test User",
            "items": [
                {
                    "product_id": "test-product",
                    "quantity": 1,
                    "price": 100.0
                }
            ],
            "total": 100.0
        }
        
        response = requests.post(f"{API_BASE}/orders", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        
        print("✅ PASSED: Missing email correctly rejected with 422")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_cors_preflight():
    """Test CORS - OPTIONS preflight request"""
    print("\n=== Testing CORS (OPTIONS preflight) ===")
    try:
        headers = {
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
        
        response = requests.options(f"{API_BASE}/newsletter/subscribe", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        # Check for CORS headers
        assert "access-control-allow-origin" in response.headers, "Missing Access-Control-Allow-Origin header"
        
        print("✅ PASSED: CORS preflight working correctly")
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

def test_old_endpoints_removed():
    """Test that old endpoints return 404"""
    print("\n=== Testing old endpoints removed ===")
    
    old_endpoints = [
        "/api/products",
        "/api/ingredients",
        "/api/checkout/session"
    ]
    
    all_passed = True
    for endpoint in old_endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            print(f"\nTesting {endpoint}...")
            
            if endpoint == "/api/checkout/session":
                response = requests.post(url, json={}, timeout=10)
            else:
                response = requests.get(url, timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            assert response.status_code == 404, f"Expected 404 for {endpoint}, got {response.status_code}"
            print(f"✅ PASSED: {endpoint} correctly returns 404")
        except Exception as e:
            print(f"❌ FAILED: {endpoint} - {str(e)}")
            all_passed = False
    
    return all_passed

def verify_mongodb_persistence(order_id):
    """Verify MongoDB persistence by checking if order exists in database"""
    print("\n=== Verifying MongoDB Persistence ===")
    try:
        import pymongo
        import os
        
        # Read MONGO_URL from backend/.env
        mongo_url = None
        try:
            with open("/app/backend/.env", "r") as f:
                for line in f:
                    if line.startswith("MONGO_URL="):
                        mongo_url = line.split("=", 1)[1].strip().strip('"')
                        break
        except Exception as e:
            print(f"⚠️  WARNING: Could not read MONGO_URL from .env: {e}")
            return False
        
        if not mongo_url:
            print("⚠️  WARNING: MONGO_URL not found in .env")
            return False
        
        print(f"Connecting to MongoDB...")
        client = pymongo.MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client["priya_sakshi"]
        
        # Check if order exists
        order = db.orders.find_one({"id": order_id})
        
        if order:
            print(f"✅ PASSED: Order {order_id} found in MongoDB")
            print(f"Order details: customer={order.get('customer_name')}, total={order.get('total')}, status={order.get('status')}")
            client.close()
            return True
        else:
            print(f"❌ FAILED: Order {order_id} not found in MongoDB")
            client.close()
            return False
            
    except Exception as e:
        print(f"❌ FAILED: MongoDB verification error - {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 80)
    print("PRIYA SAKSHI BACKEND API TESTS")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    
    results = {}
    
    # Test all endpoints
    results["root_endpoint"] = test_root_endpoint()
    results["health_endpoint"] = test_health_endpoint()
    results["newsletter_valid"] = test_newsletter_subscribe_valid()
    results["newsletter_idempotent"] = test_newsletter_subscribe_idempotent()
    results["newsletter_invalid_email"] = test_newsletter_subscribe_invalid_email()
    results["newsletter_missing_email"] = test_newsletter_subscribe_missing_email()
    results["contact_valid"] = test_contact_form_valid()
    results["contact_empty_name"] = test_contact_form_empty_name()
    results["contact_empty_message"] = test_contact_form_empty_message()
    
    # Test orders endpoint and get order_id for MongoDB verification
    order_result = test_orders_endpoint_valid()
    if isinstance(order_result, tuple):
        results["orders_valid"], order_id = order_result
    else:
        results["orders_valid"] = order_result
        order_id = None
    
    results["orders_empty_items"] = test_orders_endpoint_empty_items()
    results["orders_missing_email"] = test_orders_endpoint_missing_email()
    results["cors_preflight"] = test_cors_preflight()
    results["old_endpoints_removed"] = test_old_endpoints_removed()
    
    # Verify MongoDB persistence if we have an order_id
    if order_id:
        results["mongodb_persistence"] = verify_mongodb_persistence(order_id)
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for v in results.values() if v is True)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit(main())
