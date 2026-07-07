import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "ls_cart_v1";

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });
    const [isOpen, setIsOpen] = useState(false);
    const [bounce, setBounce] = useState(0);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const add = (product, qty = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product.id === product.id
                        ? { ...i, quantity: i.quantity + qty }
                        : i,
                );
            }
            return [...prev, { product, quantity: qty }];
        });
        setBounce((b) => b + 1);
    };

    const updateQty = (productId, qty) => {
        setItems((prev) =>
            prev
                .map((i) =>
                    i.product.id === productId
                        ? { ...i, quantity: Math.max(0, qty) }
                        : i,
                )
                .filter((i) => i.quantity > 0),
        );
    };

    const remove = (productId) => {
        setItems((prev) => prev.filter((i) => i.product.id !== productId));
    };

    const clear = () => setItems([]);

    const { count, subtotal, shipping, total } = useMemo(() => {
        const count = items.reduce((s, i) => s + i.quantity, 0);
        const subtotal = items.reduce(
            (s, i) => s + i.product.price * i.quantity,
            0,
        );
        const shipping = subtotal === 0 || subtotal >= 5000 ? 0 : 99;
        const total = subtotal + shipping;
        return {
            count,
            subtotal: Math.round(subtotal * 100) / 100,
            shipping,
            total: Math.round(total * 100) / 100,
        };
    }, [items]);

    return (
        <CartContext.Provider
            value={{
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
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
};
