/**
 * Resolve the storefront thumbnail for an ordered item.
 *
 * New orders store the image alongside the line item. Older documents only
 * carry `product_id` / `name`, so we fall back to the catalog — and to null
 * when the product is no longer sold, letting the UI render its placeholder.
 */
import { products } from '@/data/products';
import { imageUrl } from '@/lib/imageUrl';

const byId = new Map(products.map((p) => [p.id, p]));
const byName = new Map(products.map((p) => [p.name.toLowerCase(), p]));

export function getOrderItemImage(item) {
  if (!item) return null;
  if (item.image) return imageUrl(item.image);
  const product = byId.get(item.product_id) || byName.get(String(item.name || '').toLowerCase());
  return product?.images?.[0] || null;
}
