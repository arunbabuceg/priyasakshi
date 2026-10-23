import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { site } from '@/data/site';

const CartContext = createContext(null);
const STORAGE_KEY_PREFIX = 'ps_cart_v1';

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  // Keep carts isolated per account on shared browsers. Guests share only the
  // guest cart; a signed-in account gets a separate key.
  const ownerKey = user?.id || user?.email?.toLowerCase() || 'guest';
  const storageKey = `${STORAGE_KEY_PREFIX}:${ownerKey}`;
  const [items, setItems] = useState([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
    setLoadedStorageKey(storageKey);
  }, [authLoading, storageKey]);

  useEffect(() => {
    // Never write the previous account's cart under the next account's key.
    if (authLoading || loadedStorageKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Storage can be unavailable or full; the in-memory cart still works.
    }
  }, [items, authLoading, loadedStorageKey, storageKey]);
  const [isOpen, setIsOpen] = useState(false);
  const [bounce, setBounce] = useState(0);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    setBounce((b) => b + 1);
  };

  const updateQty = (productId, qty) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: Math.max(0, qty) } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const remove = (productId) => setItems((prev) => prev.filter((i) => i.product.id !== productId));
  const clear = () => setItems([]);

  const { count, subtotal, shipping, total } = useMemo(() => {
    const c = items.reduce((s, i) => s + i.quantity, 0);
    const st = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const sh = st === 0 || st >= site.shipping.freeShippingThreshold ? 0 : site.shipping.flatFee;
    return {
      count: c,
      subtotal: Math.round(st * 100) / 100,
      shipping: sh,
      total: Math.round((st + sh) * 100) / 100,
    };
  }, [items]);

  const value = {
    items,
    add,
    updateQty,
    remove,
    clear,
    count,
    subtotal,
    shipping,
    total,
    isOpen,
    setIsOpen,
    bounce,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
