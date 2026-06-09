'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/lib/CartContext';
import { AuthProvider } from '@/lib/AuthContext';
import { WishlistProvider } from '@/lib/WishlistContext';

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith('/admin');

    if (isAdmin) {
        return (
            <SessionProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </SessionProvider>
        );
    }

    return (
        <SessionProvider>
            <AuthProvider>
                <CartProvider>
                    <WishlistProvider>
                        <Header />
                        <main style={{ minHeight: '100vh' }}>{children}</main>
                        <Footer />
                    </WishlistProvider>
                </CartProvider>
            </AuthProvider>
        </SessionProvider>
    );
}

