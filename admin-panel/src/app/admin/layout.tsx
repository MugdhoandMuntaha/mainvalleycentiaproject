'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Crown,
    Layers,
    ArrowLeft,
    Menu,
    X,
    LogOut,
    Loader2,
    Shield,
    Image as ImageIcon,
    FileText,
    Settings,
    Tag,
    SplitSquareVertical,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Brands', href: '/admin/brands', icon: Crown },
    { label: 'Visible Changes', href: '/admin/visible-changes', icon: SplitSquareVertical },
    { label: 'Hero Slides', href: '/admin/hero-slides', icon: ImageIcon },
    { label: 'Sections', href: '/admin/sections', icon: Layers },
    { label: 'Navigation', href: '/admin/navigation', icon: Menu },
    { label: 'About Page', href: '/admin/about', icon: FileText },
    { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const { user, role, loading, signOut } = useAuth();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                window.location.href = '/auth?redirect=/admin';
            } else if (role !== 'admin') {
                window.location.href = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') + '/?error=unauthorized';
            } else {
                setChecking(false);
            }
        }
    }, [user, role, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        window.location.href = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    };

    // Show loading state while checking auth
    if (loading || checking) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg, #0a0a0b)',
                gap: '16px',
            }}>
                <Loader2 size={32} style={{ color: 'var(--color-accent, #f5c518)', animation: 'spin 1s linear infinite' }} />
                <p style={{
                    color: 'var(--color-text-muted, #888)',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                }}>
                    Verifying admin access...
                </p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Admin';
    const displayEmail = user?.email || '';
    const initials = displayName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Sidebar Overlay (mobile) */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 40,
                    }}
                />
            )}

            {/* Sidebar */}
            <aside
                style={{
                    width: 260,
                    background: 'var(--color-bg-secondary)',
                    borderRight: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0,
                    left: sidebarOpen ? 0 : -260,
                    bottom: 0,
                    zIndex: 50,
                    transition: 'left var(--transition-base)',
                }}
                className="admin-sidebar"
            >
                {/* Logo */}
                <div style={{
                    padding: '24px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <h1 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            background: 'var(--gradient-accent)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            ValleyCentia
                        </h1>
                        <span style={{
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <Shield size={10} />
                            Admin Panel
                        </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="admin-sidebar-close"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: 4,
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav Items */}
                <nav style={{ padding: '16px 12px', flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 14px',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 4,
                                    fontSize: 14,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    background: isActive ? 'var(--color-accent-glow)' : 'transparent',
                                    transition: 'all var(--transition-fast)',
                                    textDecoration: 'none',
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin User Info + Actions */}
                <div style={{
                    borderTop: '1px solid var(--color-border)',
                    padding: '16px 12px',
                }}>
                    {/* Admin user info */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        marginBottom: 8,
                    }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f5c518, #e6b800)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                            color: '#0a0a0b',
                            fontFamily: "'Inter', sans-serif",
                            flexShrink: 0,
                        }}>
                            {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {displayName}
                            </div>
                            <div style={{
                                fontSize: 11,
                                color: 'var(--color-text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {displayEmail}
                            </div>
                        </div>
                    </div>

                    {/* Back to Store */}
                    <a
                        href={process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 13,
                            color: 'var(--color-text-muted)',
                            textDecoration: 'none',
                            transition: 'color var(--transition-fast)',
                            marginBottom: 4,
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Store
                    </a>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 13,
                            color: '#ef4444',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'background var(--transition-fast)',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar */}
                <header style={{
                    height: 56,
                    background: 'var(--color-bg-secondary)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    gap: 16,
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                }}>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="admin-menu-btn"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            padding: 4,
                        }}
                    >
                        <Menu size={20} />
                    </button>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Admin badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#f5c518',
                            background: 'rgba(245,197,24,0.1)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-md)',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                        }}>
                            <Shield size={12} />
                            Admin
                        </span>
                        <a
                            href={process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}
                            style={{
                                fontSize: 13,
                                color: 'var(--color-text-muted)',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <ArrowLeft size={14} />
                            Store
                        </a>
                    </div>
                </header>

                {/* Page Content */}
                <main style={{ flex: 1, padding: 24 }}>
                    {children}
                </main>
            </div>

            {/* Responsive styles */}
            <style>{`
                @media (min-width: 769px) {
                    .admin-sidebar {
                        left: 0 !important;
                        position: fixed !important;
                    }
                    .admin-sidebar-close {
                        display: none !important;
                    }
                    .admin-menu-btn {
                        display: none !important;
                    }
                    /* Main content offset for sidebar */
                    .admin-sidebar ~ div {
                        margin-left: 260px;
                    }
                }
                @media (max-width: 768px) {
                    .admin-sidebar ~ div {
                        margin-left: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
