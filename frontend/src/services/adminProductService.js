/**
 * Admin Product service — talks to /api/admin/products/* endpoints.
 * All calls rely on the authenticated HTTP-only cookie; the backend enforces
 * admin access (403 for non-admins).
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const getAdminProducts = async ({
  category,
  active,
  featured,
  search,
  includeDeleted = false,
  limit = 100,
  skip = 0,
} = {}) => {
  try {
    const params = { limit, skip, include_deleted: includeDeleted };
    if (category) params.category = category;
    if (active !== undefined && active !== null) params.active = active;
    if (featured !== undefined && featured !== null) params.featured = featured;
    if (search) params.search = search;
    const { data } = await apiClient.get('/admin/products', { params });
    return { ok: true, products: data.products || [], total: data.total || 0 };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load products'), products: [], total: 0 };
  }
};

export const getAdminProduct = async (productId) => {
  try {
    const { data } = await apiClient.get(`/admin/products/${productId}`);
    return { ok: true, product: data.product };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load product') };
  }
};

export const createProduct = async (productData) => {
  try {
    const { data } = await apiClient.post('/admin/products', productData);
    return { ok: true, product: data.product };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not create product') };
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const { data } = await apiClient.patch(`/admin/products/${productId}`, productData);
    return { ok: true, product: data.product };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not update product') };
  }
};

export const deleteProduct = async (productId) => {
  try {
    await apiClient.delete(`/admin/products/${productId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not delete product') };
  }
};

export const duplicateProduct = async (productId) => {
  try {
    const { data } = await apiClient.post(`/admin/products/${productId}/duplicate`);
    return { ok: true, product: data.product };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not duplicate product') };
  }
};

export const toggleProductStatus = async (productId) => {
  try {
    const { data } = await apiClient.post(`/admin/products/${productId}/toggle`);
    return { ok: true, product: data.product };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not toggle product status') };
  }
};

export const uploadProductImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/admin/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { ok: true, url: data.url, filename: data.filename };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not upload image') };
  }
};
