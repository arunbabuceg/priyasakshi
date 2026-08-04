import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatINR } from '@/lib/format';
import ProductGallery from './ProductGallery';

export default function ProductDialog({ product, open, onOpenChange }) {
  const { items, add, updateQty } = useCart();
  useScrollLock(open && !!product);

  if (!product) return null;

  const existing = items.find((i) => i.product.id === product.id);
  const qty = existing?.quantity || 0;

  const handleAdd = () => {
    add(product, 1);
    toast.success(`Added another ${product.name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl border-0 p-0 bg-transparent shadow-none"
        data-testid="product-dialog"
      >
        <VisuallyHidden.Root asChild>
          <DialogTitle>{product.name}</DialogTitle>
        </VisuallyHidden.Root>
        <div className="clay-card overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="aspect-square md:aspect-auto p-6" style={{ background: '#F3EBDC' }}>
              <ProductGallery images={product.images} alt={product.name} testId="product-dialog-gallery" />
            </div>
            <div className="p-8 flex flex-col">
              {product.tag && <span className="clay-pill self-start mb-4">{product.tag}</span>}
              <h2 className="font-serif-display text-4xl text-[#2E2825] leading-tight">{product.name}</h2>
              <p className="text-sm text-[#2E2825]/70 mt-4 leading-relaxed whitespace-pre-line">
                {product.longDescription}
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif-display text-4xl font-semibold text-[#8B2956]">
                  {formatINR(product.price)}
                </span>
                <span className="text-xs uppercase tracking-widest text-[#2E2825]/50">INR</span>
              </div>

              <div className="mt-auto pt-8 flex flex-col sm:flex-row gap-3">
                {qty > 0 ? (
                  <div
                    className="clay-btn-ghost flex items-center justify-between h-14 px-3 gap-3 flex-1"
                    data-testid="dialog-qty-controls"
                  >
                    <button
                      className="w-10 h-10 rounded-full clay-btn-ochre flex items-center justify-center"
                      onClick={() => updateQty(product.id, qty - 1)}
                      data-testid="dialog-qty-decrement"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-serif-display text-2xl" data-testid="dialog-qty-value">
                      {qty}
                    </span>
                    <button
                      className="w-10 h-10 rounded-full clay-btn-ochre flex items-center justify-center"
                      onClick={handleAdd}
                      data-testid="dialog-qty-increment"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAdd}
                    className="clay-btn-primary flex-1 h-14 px-6 flex items-center justify-center gap-2"
                    data-testid="dialog-add-to-cart"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Add to Basket
                  </button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  className="clay-btn-ghost h-14 px-6"
                  data-testid="dialog-close-btn"
                >
                  Keep Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
