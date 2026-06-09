'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getWishlist, addToWishlist, removeFromWishlist } from './db/queries';
import { useCart } from './CartContext';

interface WishlistContextType {
    wishlist: string[];
    wishlistCount: number;
    isWishlisted: (productId: string) => boolean;
    toggleWishlist: (productId: string) => Promise<void>;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
    wishlist: [],
    wishlistCount: 0,
    isWishlisted: () => false,
    toggleWishlist: async () => { },
    loading: false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { showToast } = useCart();
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Load wishlist when user logs in
    useEffect(() => {
        if (user?.id) {
            setLoading(true);
            getWishlist(user.id).then(ids => {
                setWishlist(ids);
                setLoading(false);
            });
        } else {
            setWishlist([]);
        }
    }, [user?.id]);

    const isWishlisted = useCallback((productId: string) => {
        return wishlist.includes(productId);
    }, [wishlist]);

    const toggleWishlist = useCallback(async (productId: string) => {
        if (!user?.id) {
            showToast('Please sign in to add to wishlist', 'info');
            return;
        }

        if (wishlist.includes(productId)) {
            setWishlist(prev => prev.filter(id => id !== productId));
            await removeFromWishlist(user.id, productId);
            showToast('Removed from wishlist', 'info');
        } else {
            setWishlist(prev => [...prev, productId]);
            await addToWishlist(user.id, productId);
            showToast('Added to wishlist ♥', 'success');
        }
    }, [user?.id, wishlist, showToast]);

    return (
        <WishlistContext.Provider value={{
            wishlist,
            wishlistCount: wishlist.length,
            isWishlisted,
            toggleWishlist,
            loading,
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    return useContext(WishlistContext);
}
