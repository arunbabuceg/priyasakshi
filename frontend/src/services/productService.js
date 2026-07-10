/**
 * Product data-access layer.
 *
 * Right now this simply reads from the static ./data/products.js file. Every
 * component consumes products through these functions \u2014 so when we're ready
 * to move the catalog into MongoDB, we only need to change this file:
 *
 *   import { apiClient } from '@/lib/apiClient';
 *   export const getProducts = async (filters) => {
 *     const { data } = await apiClient.get('/products', { params: filters });
 *     return data;
 *   };
 *
 * Everything else keeps working.
 */
import { products as staticProducts } from '@/data/products';

/** Return all products, optionally filtered by category. */
export const getProducts = async ({ category } = {}) => {
  await Promise.resolve(); // preserve async contract for future migration
  if (!category) return staticProducts;
  return staticProducts.filter((p) => p.category === category);
};

/** Return a single product by id, or null if not found. */
export const getProductById = async (id) => {
  await Promise.resolve();
  return staticProducts.find((p) => p.id === id) || null;
};

/** Return all product ids \u2014 handy for cart validation / sitemap generation. */
export const getProductIds = async () => {
  await Promise.resolve();
  return staticProducts.map((p) => p.id);
};
