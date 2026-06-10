'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/AuthContext';

export function LayoutShell({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthProvider>
                <main style={{ minHeight: '100vh' }}>{children}</main>
            </AuthProvider>
        </SessionProvider>
    );
}
