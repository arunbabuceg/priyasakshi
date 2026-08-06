/**
 * Resolve a product image URL for the browser.
 *
 * MongoDB stores paths like /uploads/products/silk-harmony-1.jpg.
 * When the frontend and backend are on different origins, relative
 * paths resolve against the frontend origin (www.priyasakshi.com)
 * instead of the backend (lakshmi-sakshi-api.onrender.com).
 *
 * This helper:
 * - Returns absolute URLs (http:// or https://) unchanged.
 * - Prepends VITE_BACKEND_URL for /uploads/* paths.
 * - Returns all other values unchanged.
 */
const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const backendUrl = RAW_BACKEND_URL.replace(/\/$/, '');

export function imageUrl(value) {
  if (!value) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('/uploads/')) {
    return `${backendUrl}${value}`;
  }
  return value;
}
