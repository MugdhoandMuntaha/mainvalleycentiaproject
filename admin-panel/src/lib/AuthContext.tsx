'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

/* ===== Types ===== */
export type UserRole = 'customer' | 'admin';

export interface UserProfile {
    full_name: string | null;
    display_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    date_of_birth: string | null;
    gender: string | null;
    role: UserRole;
}

// Extend session user type
interface SessionUser {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole;
    fullName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string | null;
}

interface AuthContextType {
    user: SessionUser | null;
    role: UserRole;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: { message: string } | null }>;
    signInWithGoogle: () => Promise<{ error: { message: string } | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Omit<UserProfile, 'role'>>) => Promise<{ error: string | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ===== Provider ===== */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status, update } = useSession();
    const [profileOverrides, setProfileOverrides] = useState<Partial<UserProfile>>({});

    const loading = status === 'loading';

    const user: SessionUser | null = useMemo(() => {
        if (!session?.user) return null;
        const u = session.user as Record<string, unknown>;
        return {
            id: (u.id as string) || '',
            email: (u.email as string) || '',
            name: (u.name as string) || null,
            image: (u.image as string) || null,
            role: ((u.role as UserRole) || 'customer'),
            fullName: (u.fullName as string) || null,
            displayName: (u.displayName as string) || null,
            avatarUrl: (u.avatarUrl as string) || (u.image as string) || null,
            createdAt: (u.createdAt as string) || null,
        };
    }, [session]);

    const role: UserRole = user?.role || 'customer';

    const profile: UserProfile | null = useMemo(() => {
        if (!user) return null;
        return {
            full_name: profileOverrides.full_name ?? user.fullName,
            display_name: profileOverrides.display_name ?? user.displayName,
            phone: profileOverrides.phone ?? null,
            avatar_url: profileOverrides.avatar_url ?? user.avatarUrl,
            date_of_birth: profileOverrides.date_of_birth ?? null,
            gender: profileOverrides.gender ?? null,
            role: user.role,
        };
    }, [user, profileOverrides]);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const result = await nextAuthSignIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                return { error: { message: result.error } };
            }
            return { error: null };
        } catch (err) {
            return { error: { message: err instanceof Error ? err.message : 'Sign in failed' } };
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string, name: string) => {
        try {
            // Call custom register endpoint
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { error: { message: data.error || 'Registration failed' } };
            }

            // Auto sign-in after registration
            const signInResult = await nextAuthSignIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (signInResult?.error) {
                // Registration succeeded but auto-login failed — still a success
                return { error: null };
            }

            return { error: null };
        } catch (err) {
            return { error: { message: err instanceof Error ? err.message : 'Registration failed' } };
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            await nextAuthSignIn('google', { callbackUrl: '/profile' });
            return { error: null };
        } catch (err) {
            return { error: { message: err instanceof Error ? err.message : 'Google sign in failed' } };
        }
    }, []);

    const signOutFn = useCallback(async () => {
        setProfileOverrides({});
        await nextAuthSignOut({ callbackUrl: '/' });
    }, []);

    const updateProfile = useCallback(async (updates: Partial<Omit<UserProfile, 'role'>>) => {
        if (!user) return { error: 'Not authenticated' };

        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            const data = await res.json();

            if (!res.ok) {
                return { error: data.error || 'Failed to update profile' };
            }

            // Update local state
            setProfileOverrides(prev => ({ ...prev, ...updates }));

            // Trigger NextAuth session update to refresh JWT
            await update();

            return { error: null };
        } catch (err) {
            return { error: err instanceof Error ? err.message : 'Failed to update profile' };
        }
    }, [user, update]);

    const refreshProfile = useCallback(async () => {
        if (user) {
            await update();
        }
    }, [user, update]);

    return (
        <AuthContext.Provider value={{
            user, role, profile, loading,
            signIn, signUp, signInWithGoogle, signOut: signOutFn,
            updateProfile, refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

/* ===== Hook ===== */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
