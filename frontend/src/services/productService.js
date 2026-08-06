/**
 * Product data-access layer.
 *
 * Fetches products from MongoDB via the backend API.
 * Maintains the same interface as the original static implementation
 * so all components continue working without changes.
 */
import { apiClient } from '@/lib/apiClient';

/** Return all products, optionally filtered by category. */
export const getProducts = async ({ category } = {}) => {
  try {
    const params = {};
    if (category) params.category = category;
    const { data } = await apiClient.get('/products', { params });
    return data.products || [];
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return [];
  }
};

/** Return a single product by id/slug, or null if not found. */
export const getProductById = async (id) => {
  try {
    // Try fetching by slug directly
    const { data } = await apiClient.get(`/products/${encodeURIComponent(id)}`);
    return data.product || null;
  } catch {
    // Fallback: search in products list
    try {
      const { data } = await apiClient.get('/products');
      const products = data.products || [];
      return products.find((p) => p.id === id || p.slug === id) || null;
    } catch {
      return null;
    }
  }
};

/** Return all product ids — handy for cart validation / sitemap generation. */
export const getProductIds = async () => {
  try {
    const { data } = await apiClient.get('/products');
    return (data.products || []).map((p) => p.id);
  } catch (err) {
    console.error('Failed to fetch product IDs:', err);
    return [];
  }
};
