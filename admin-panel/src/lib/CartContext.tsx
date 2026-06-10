'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingBag, Trash2, X } from 'lucide-react';

/* ===== Toast Types ===== */
interface Toast {
    id: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'cart';
    icon?: React.ReactNode;
}

/* ===== Cart Types ===== */
export interface CartItem {
    id: string;
    slug: string;
    name: string;
    image: string;
    price: number;
    originalPrice?: number;
    size?: string;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeFromCart: (id: string, size?: string) => void;
    updateQuantity: (id: string, quantity: number, size?: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    cartBounce: boolean;
    showToast: (message: string, type?: Toast['type']) => void;
    isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ===== Toast Component ===== */
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 99999,
            display: 'flex', flexDirection: 'column', gap: 8,
            pointerEvents: 'none',
        }}>
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 80, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 80, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 18px', borderRadius: 12,
                            background: toast.type === 'error' ? '#1a1a1a' :
                                toast.type === 'cart' ? '#1a1a1a' : '#1a1a1a',
                            color: '#fff',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 13, fontWeight: 600,
                            pointerEvents: 'auto',
                            minWidth: 240, maxWidth: 360,
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            background: toast.type === 'success' || toast.type === 'cart'
                                ? 'rgba(34,197,94,0.15)'
                                : toast.type === 'error'
                                    ? 'rgba(239,68,68,0.15)'
                                    : 'rgba(245,197,24,0.15)',
                        }}>
                            {toast.type === 'cart' ? (
                                <ShoppingBag size={14} color="#22c55e" />
                            ) : toast.type === 'success' ? (
                                <Check size={14} color="#22c55e" />
                            ) : toast.type === 'error' ? (
                                <X size={14} color="#ef4444" />
                            ) : (
                                <Check size={14} color="#f5c518" />
                            )}
                        </div>
                        <span style={{ flex: 1 }}>{toast.message}</span>
                        <button
                            onClick={() => onDismiss(toast.id)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.4)', padding: 2,
                                display: 'flex', alignItems: 'center',
                            }}
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ===== Provider ===== */
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);
    const [cartBounce, setCartBounce] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastCounter = useRef(0);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('valleycentia-cart');
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch {
            // ignore parse errors
        }
        setIsHydrated(true);
    }, []);

    // Persist to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem('valleycentia-cart', JSON.stringify(items));
        }
    }, [items, isHydrated]);

    const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
        const id = `toast-${++toastCounter.current}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
        const roundedItem = {
            ...item,
            price: Math.ceil(item.price),
            originalPrice: item.originalPrice ? Math.ceil(item.originalPrice) : undefined,
        };
        setItems((prev) => {
            const key = roundedItem.size ? `${roundedItem.id}-${roundedItem.size}` : roundedItem.id;
            const existing = prev.find(
                (i) => (i.size ? `${i.id}-${i.size}` : i.id) === key
            );
            if (existing) {
                return prev.map((i) =>
                    (i.size ? `${i.id}-${i.size}` : i.id) === key
                        ? { ...i, quantity: Math.min(i.quantity + quantity, 10) }
                        : i
                );
            }
            return [...prev, { ...roundedItem, quantity }];
        });
        // Trigger bounce animation
        setCartBounce(true);
        setTimeout(() => setCartBounce(false), 700);
        // Show toast
        showToast(`${item.name.length > 30 ? item.name.substring(0, 30) + '…' : item.name} added to cart`, 'cart');
    }, [showToast]);

    const removeFromCart = useCallback((id: string, size?: string) => {
        setItems((prev) => {
            const key = size ? `${id}-${size}` : id;
            const item = prev.find((i) => (i.size ? `${i.id}-${i.size}` : i.id) === key);
            if (item) {
                showToast(`${item.name.length > 30 ? item.name.substring(0, 30) + '…' : item.name} removed from cart`, 'info');
            }
            return prev.filter((i) => (i.size ? `${i.id}-${i.size}` : i.id) !== key);
        });
    }, [showToast]);

    const updateQuantity = useCallback((id: string, quantity: number, size?: string) => {
        if (quantity < 1) return;
        setItems((prev) => {
            const key = size ? `${id}-${size}` : id;
            return prev.map((i) =>
                (i.size ? `${i.id}-${i.size}` : i.id) === key
                    ? { ...i, quantity: Math.min(quantity, 10) }
                    : i
            );
        });
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, cartBounce, showToast, isHydrated }}
        >
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </CartContext.Provider>
    );
}

/* ===== Hook ===== */
export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
