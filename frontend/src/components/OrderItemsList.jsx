import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { getOrderItemImage } from '@/lib/orderItemImage';

const THUMB = 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 overflow-hidden';
const THUMB_SHADOW = {
  background: '#F5EBF0',
  boxShadow: 'inset 0 -3px 6px rgba(138,115,130,0.15), inset 0 3px 6px rgba(255,255,255,0.9)',
};

function ItemThumb({ item }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : getOrderItemImage(item);

  return (
    <div className={THUMB} style={THUMB_SHADOW}>
      {src ? (
        <img
          src={src}
          alt={item.name || 'Product'}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package className="w-5 h-5 text-[#8B2956]" />
        </div>
      )}
    </div>
  );
}

/** Compact order line items with storefront thumbnails. */
export default function OrderItemsList({ items = [], testId }) {
  return (
    <ul className="space-y-3" data-testid={testId}>
      {items.map((it, i) => (
        <li
          key={`${it.product_id || it.name || 'item'}-${i}`}
          className="flex items-center justify-between gap-3 pb-3 border-b border-[#EADFE5] last:border-0 last:pb-0"
          data-testid="order-item-row"
        >
          <div className="flex items-center gap-3 min-w-0">
            <ItemThumb item={it} />
            <div className="min-w-0">
              <div className="font-medium text-[#2E2825] text-sm sm:text-base truncate">
                {it.name || it.product_id}
              </div>
              <div className="text-xs text-[#2E2825]/60 mt-0.5">
                Qty: {it.quantity}
                {it.price ? ` · ${formatINR(it.price)} each` : ''}
              </div>
            </div>
          </div>
          <div className="font-serif-display text-lg text-[#8B2956] flex-shrink-0">
            {formatINR((it.price || 0) * it.quantity)}
          </div>
        </li>
      ))}
    </ul>
  );
}
