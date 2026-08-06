"""Product module unit tests.

Run with:
    pytest tests/test_products.py -v
"""

from __future__ import annotations

import pytest


def test_create_product_signature():
    """Test that create_product endpoint has correct signature.
    
    This verifies the fix for the bug where create_product returned
    a nested async function instead of handling the request directly.
    """
    from app.routes.products import create_product
    import inspect
    
    sig = inspect.signature(create_product)
    params = list(sig.parameters.keys())
    
    # Should have request and admin parameters, NOT return a function
    assert 'request' in params, "create_product should have 'request' parameter"
    assert 'admin' in params, "create_product should have 'admin' parameter"
    assert len(params) == 2, f"create_product should have exactly 2 params, got: {params}"
    
    # Verify it's not returning a coroutine
    source = inspect.getsource(create_product)
    assert "return _create" not in source, "create_product should NOT return a nested function"


def test_update_product_signature():
    """Test that update_product endpoint has correct signature.
    
    This verifies the fix for the bug where update_product returned
    a nested async function instead of handling the request directly.
    """
    from app.routes.products import update_product
    import inspect
    
    sig = inspect.signature(update_product)
    params = list(sig.parameters.keys())
    
    # Should have product_id, request, and admin parameters
    assert 'product_id' in params, "update_product should have 'product_id' parameter"
    assert 'request' in params, "update_product should have 'request' parameter"
    assert 'admin' in params, "update_product should have 'admin' parameter"
    
    # Verify it's not returning a coroutine
    source = inspect.getsource(update_product)
    assert "return _update" not in source, "update_product should NOT return a nested function"


def test_product_service_seed_if_empty_method():
    """Test that ProductService has seed_if_empty method."""
    from app.services.product_service import product_service
    
    assert hasattr(product_service, 'seed_if_empty'), \
        "ProductService should have 'seed_if_empty' method"
    assert callable(product_service.seed_if_empty), \
        "seed_if_empty should be a method"


def test_product_service_default_products():
    """Test that ProductService has default products for seeding."""
    from app.services.product_service import ProductService
    
    assert hasattr(ProductService, 'DEFAULT_PRODUCTS'), \
        "ProductService should have DEFAULT_PRODUCTS"
    defaults = ProductService.DEFAULT_PRODUCTS
    assert len(defaults) > 0, "DEFAULT_PRODUCTS should not be empty"
    
    # Verify expected products exist
    slugs = [p['slug'] for p in defaults]
    assert 'silk-harmony-saree' in slugs, "Should have silk-harmony-saree"
    assert 'rose-glow-serum' in slugs, "Should have rose-glow-serum"


def test_main_imports_product_service():
    """Test that main.py imports and uses product_service."""
    from app import main
    
    # Check that product_service is imported
    assert hasattr(main, 'product_service'), \
        "main module should import product_service"


def test_lifespan_calls_seed():
    """Test that lifespan function includes product seeding."""
    from app.main import lifespan
    import inspect
    
    source = inspect.getsource(lifespan)
    assert 'seed_if_empty' in source, "lifespan should call seed_if_empty"


def test_image_upload_uses_root_dir():
    """Test that image upload uses ROOT_DIR from config."""
    from app.routes.products import upload_product_image
    import inspect
    
    source = inspect.getsource(upload_product_image)
    assert "ROOT_DIR" in source, \
        "upload_product_image should use ROOT_DIR from config"
    assert 'uploads' in source, \
        "upload should reference uploads directory"


def test_upload_path_matches_static_files_mount():
    """Test that upload path matches StaticFiles mount in main.py."""
    from app.main import create_app
    import inspect
    
    # Get main.py source
    main_source = inspect.getsource(inspect.getmodule(create_app))
    
    # The StaticFiles should mount at /uploads
    assert '"/uploads"' in main_source or "'/uploads'" in main_source, \
        "StaticFiles should be mounted at /uploads"


def test_product_model_categories():
    """Test that product model has correct category validation."""
    from app.models.product import ProductCreate
    
    # Valid categories should work
    valid = ProductCreate(
        name="Test",
        slug="test",
        category="saree",
        price=1000
    )
    assert valid.category == "saree"
    
    valid2 = ProductCreate(
        name="Test2",
        slug="test2", 
        category="skincare",
        price=500
    )
    assert valid2.category == "skincare"
    
    # Invalid category should fail
    try:
        ProductCreate(
            name="Invalid",
            slug="invalid",
            category="invalid_category",
            price=100
        )
        assert False, "Should have raised validation error"
    except Exception:
        pass  # Expected


def test_seeded_products_have_valid_image_paths():
    """Test that seeded products have image paths that match the uploads directory."""
    from app.services.product_service import ProductService
    
    for product in ProductService.DEFAULT_PRODUCTS:
        assert "images" in product, f"Product {product['name']} should have images field"
        images = product["images"]
        assert isinstance(images, list), "Images should be a list"
        for img in images:
            # Images should use /uploads/products/ path to match StaticFiles mount
            assert img.startswith("/uploads/products/"), \
                f"Image path '{img}' should start with /uploads/products/"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
