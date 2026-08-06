import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/format';
import { imageUrl } from '@/lib/imageUrl';
import CheckoutForm from './CheckoutForm';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    setIsOpen,
    updateQty,
    remove,
    subtotal,
    shipping,
    total,
    count,
  } = useCart();
  const [checkoutMode, setCheckoutMode] = useState(false);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) setCheckoutMode(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] border-0 p-0 bg-[#FAF5F8]"
        data-testid="cart-drawer"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-8 pb-4 flex-row items-center justify-between space-y-0">
            <SheetTitle className="font-serif-display text-3xl text-[#8B2956] text-left">
              {checkoutMode ? 'Checkout' : 'Your Basket'}
            </SheetTitle>
            <span className="clay-pill" data-testid="cart-item-count">
              {count} item{count !== 1 ? 's' : ''}
            </span>
          </SheetHeader>

          {checkoutMode ? (
            <CheckoutForm onBack={() => setCheckoutMode(false)} />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 pb-6" data-testid="cart-items-list">
                {items.length === 0 ? (
                  <EmptyState onClose={() => setIsOpen(false)} />
                ) : (
                  <ul className="space-y-4 mt-2">
                    <AnimatePresence>
                      {items.map((it) => (
                        <motion.li
                          key={it.product.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 50 }}
                          className="clay-card p-4 flex gap-4 items-center"
                          data-testid={`cart-item-${it.product.id}`}
                        >
                          <div
                            className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden"
                            style={{
                              background: '#F5EBF0',
                              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.08)',
                            }}
                          >
                            <img
                              src={imageUrl(it.product.images?.[0])}
                              alt={it.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-serif-display text-base leading-tight text-[#2E2825] line-clamp-2">
                              {it.product.name}
                            </div>
                            <div className="text-sm font-semibold text-[#8B2956] mt-1">
                              {formatINR(it.product.price * it.quantity)}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => updateQty(it.product.id, it.quantity - 1)}
                                className="w-7 h-7 rounded-full clay-btn-ghost flex items-center justify-center"
                                data-testid={`cart-decrement-${it.product.id}`}
                                aria-label="Decrease"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className="w-8 text-center text-sm font-semibold"
                                data-testid={`cart-qty-${it.product.id}`}
                              >
                                {it.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(it.product.id, it.quantity + 1)}
                                className="w-7 h-7 rounded-full clay-btn-ghost flex items-center justify-center"
                                data-testid={`cart-increment-${it.product.id}`}
                                aria-label="Increase"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => remove(it.product.id)}
                            className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center text-[#8B2956]"
                            data-testid={`cart-remove-${it.product.id}`}
                            aria-label="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-[#EADFE5] px-6 py-6 bg-[#FAF5F8]" data-testid="cart-summary">
                  <div className="space-y-2 text-sm">
                    <Row
                      label="Subtotal"
                      value={formatINR(subtotal)}
                      testId="cart-subtotal"
                    />
                    <Row
                      label={shipping === 0 ? 'Shipping (free over \u20b95,000)' : 'Shipping'}
                      value={shipping === 0 ? 'FREE' : formatINR(shipping)}
                      testId="cart-shipping"
                    />
                    <div className="pt-2 mt-2 border-t border-[#EADFE5] flex items-baseline justify-between">
                      <span className="font-serif-display text-2xl text-[#2E2825]">Total</span>
                      <span
                        className="font-serif-display text-3xl font-semibold text-[#8B2956]"
                        data-testid="cart-total"
                      >
                        {formatINR(total)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutMode(true)}
                    className="w-full mt-5 clay-btn-primary h-14 text-base flex items-center justify-center gap-2"
                    data-testid="proceed-to-checkout-btn"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const Row = ({ label, value, testId }) => (
  <div className="flex items-center justify-between">
    <span className="text-[#2E2825]/70">{label}</span>
    <span className="font-semibold text-[#2E2825]" data-testid={testId}>
      {value}
    </span>
  </div>
);

const EmptyState = ({ onClose }) => (
  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
    <div
      className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
      style={{
        background: 'linear-gradient(180deg, #E8C4D0 0%, #D9B5C0 100%)',
        boxShadow: '0 20px 30px rgba(180,140,160,0.3), inset 0 -6px 12px rgba(100,60,80,0.25), inset 0 6px 12px rgba(255,255,255,0.5)',
      }}
    >
      <ShoppingBag className="w-10 h-10 text-white" />
    </div>
    <h3 className="font-serif-display text-2xl text-[#2E2825]">Your basket is empty</h3>
    <p className="text-sm text-[#2E2825]/60 mt-2 max-w-[280px]">
      Browse our sarees and Garden Glow herbs to begin your ritual.
    </p>
    <button
      onClick={onClose}
      className="mt-6 clay-btn-olive h-12 px-6"
      data-testid="cart-empty-continue-btn"
    >
      Continue Shopping
    </button>
  </div>
);
