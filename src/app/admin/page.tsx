'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, TrendingUp, AlertTriangle, Plus, Image as ImageIcon, FileText } from 'lucide-react';
import { getAdminProducts } from '@/lib/db/adminQueries';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const products = await getAdminProducts();
            setStats({
                total: products.length,
                active: products.filter(p => p.is_active).length,
                outOfStock: products.filter(p => !p.in_stock || p.stock_quantity === 0).length,
            });
            setLoading(false);
        }
        load();
    }, []);

    const statCards = [
        {
            label: 'Total Products',
            value: stats.total,
            icon: Package,
            color: 'var(--color-accent)',
            bg: 'var(--color-accent-glow)',
        },
        {
            label: 'Active Products',
            value: stats.active,
            icon: TrendingUp,
            color: 'var(--color-success)',
            bg: 'rgba(34, 197, 94, 0.1)',
        },
        {
            label: 'Out of Stock',
            value: stats.outOfStock,
            icon: AlertTriangle,
            color: 'var(--color-error)',
            bg: 'rgba(239, 68, 68, 0.1)',
        },
    ];

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 32,
            }}>
                <div>
                    <h1 style={{
                        fontSize: 28,
                        fontWeight: 800,
                        fontFamily: "'Outfit', sans-serif",
                        marginBottom: 4,
                    }}>
                        Dashboard
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                        Welcome to the ValleyCentia admin panel
                    </p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="admin-btn-primary"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 20px',
                        background: 'var(--gradient-accent)',
                        color: '#0a0a0b',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'opacity var(--transition-fast)',
                    }}
                >
                    <Plus size={16} />
                    Add Product
                </Link>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 20,
                marginBottom: 40,
            }}>
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            style={{
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 24,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                            }}
                        >
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 'var(--radius-md)',
                                background: stat.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Icon size={22} style={{ color: stat.color }} />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: 28,
                                    fontWeight: 800,
                                    fontFamily: "'Outfit', sans-serif",
                                    lineHeight: 1,
                                }}>
                                    {loading ? '—' : stat.value}
                                </div>
                                <div style={{
                                    fontSize: 13,
                                    color: 'var(--color-text-muted)',
                                    marginTop: 2,
                                }}>
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Links */}
            <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                marginBottom: 16,
            }}>
                Quick Actions
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
            }}>
                <Link
                    href="/admin/products"
                    style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'border-color var(--transition-fast)',
                    }}
                >
                    <Package size={24} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Manage Products</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        View, create, edit, and delete products
                    </span>
                </Link>
                <Link
                    href="/admin/products/new"
                    style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'border-color var(--transition-fast)',
                    }}
                >
                    <Plus size={24} style={{ color: 'var(--color-success)' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Add New Product</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        Create a new product with all details
                    </span>
                </Link>
                <Link
                    href="/admin/hero-slides"
                    style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'border-color var(--transition-fast)',
                    }}
                >
                    <ImageIcon size={24} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Manage Hero Slides</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        Add, edit, and remove hero carousel banners
                    </span>
                </Link>
                <Link
                    href="/admin/about"
                    style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'border-color var(--transition-fast)',
                    }}
                >
                    <FileText size={24} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Edit About Page</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        Customize about page content and sections
                    </span>
                </Link>
            </div>
        </div>
    );
}
