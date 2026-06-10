'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Plus, Search, Edit2, Trash2, Package, TrendingUp,
    AlertTriangle, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getAdminProducts, deleteProduct } from '@/lib/db/adminQueries';
import type { AdminProduct } from '@/lib/db/adminQueries';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 12;

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        setLoading(true);
        const data = await getAdminProducts();
        setProducts(data);
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return products;
        const q = search.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.brand_name?.toLowerCase().includes(q) ||
            p.category_name?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q)
        );
    }, [products, search]);

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    const stats = useMemo(() => ({
        total: products.length,
        active: products.filter(p => p.is_active).length,
        outOfStock: products.filter(p => !p.in_stock || p.stock_quantity === 0).length,
    }), [products]);

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await deleteProduct(deleteTarget.id);
        if (error) {
            alert('Error deleting product: ' + error);
        } else {
            setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
        }
        setDeleting(false);
        setDeleteTarget(null);
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16,
            }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        Products
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                        Manage your product catalog
                    </p>
                </div>
                <Link
                    href="/admin/products/new"
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
                    }}
                >
                    <Plus size={16} />
                    Add Product
                </Link>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 24,
            }}>
                {[
                    { label: 'Total', value: stats.total, icon: Package, color: 'var(--color-accent)' },
                    { label: 'Active', value: stats.active, icon: TrendingUp, color: 'var(--color-success)' },
                    { label: 'Out of Stock', value: stats.outOfStock, icon: AlertTriangle, color: 'var(--color-error)' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <s.icon size={18} style={{ color: s.color }} />
                        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                            {loading ? '—' : s.value}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{
                position: 'relative',
                marginBottom: 20,
                maxWidth: 400,
            }}>
                <Search size={16} style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                }} />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{
                        width: '100%',
                        padding: '10px 14px 10px 40px',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)',
                        fontSize: 14,
                        outline: 'none',
                    }}
                />
            </div>

            {/* Table */}
            <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 14,
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['Image', 'Product', 'Brand', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: 'var(--color-text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} style={{ padding: '16px' }}>
                                                <div style={{
                                                    height: 16,
                                                    background: 'var(--color-bg-tertiary)',
                                                    borderRadius: 4,
                                                    width: j === 1 ? 180 : 60,
                                                }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{
                                        padding: 48,
                                        textAlign: 'center',
                                        color: 'var(--color-text-muted)',
                                    }}>
                                        <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                            No products found
                                        </div>
                                        <div style={{ fontSize: 13 }}>
                                            {search ? 'Try adjusting your search' : 'Create your first product to get started'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map(product => (
                                    <tr
                                        key={product.id}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background var(--transition-fast)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {/* Image */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 'var(--radius-sm)',
                                                overflow: 'hidden',
                                                background: 'var(--color-bg-tertiary)',
                                                position: 'relative',
                                            }}>
                                                {product.primary_image_url ? (
                                                    <Image
                                                        src={product.primary_image_url}
                                                        alt={product.name}
                                                        fill
                                                        style={{ objectFit: 'cover' }}
                                                        sizes="44px"
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <Package size={18} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Name */}
                                        <td style={{ padding: '12px 16px', maxWidth: 250 }}>
                                            <div style={{
                                                fontWeight: 500,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {product.name}
                                            </div>
                                            {product.sku && (
                                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                    SKU: {product.sku}
                                                </div>
                                            )}
                                        </td>

                                        {/* Brand */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                            {product.brand_name || '—'}
                                        </td>

                                        {/* Category */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                            {product.category_name || '—'}
                                        </td>

                                        {/* Price */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 600 }}>৳{product.base_price}</span>
                                            {product.compare_at_price && (
                                                <span style={{
                                                    fontSize: 12,
                                                    color: 'var(--color-text-muted)',
                                                    textDecoration: 'line-through',
                                                    marginLeft: 6,
                                                }}>
                                                    ৳{product.compare_at_price}
                                                </span>
                                            )}
                                            {product.compare_at_price && product.discount_percent > 0 && (
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: 'var(--color-success)',
                                                    marginLeft: 6,
                                                    background: 'rgba(34, 197, 94, 0.1)',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                }}>
                                                    {product.discount_percent}% OFF
                                                </span>
                                            )}
                                        </td>

                                        {/* Stock */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '3px 10px',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: product.in_stock && product.stock_quantity > 0
                                                    ? 'rgba(34, 197, 94, 0.1)'
                                                    : 'rgba(239, 68, 68, 0.1)',
                                                color: product.in_stock && product.stock_quantity > 0
                                                    ? 'var(--color-success)'
                                                    : 'var(--color-error)',
                                            }}>
                                                {product.in_stock && product.stock_quantity > 0
                                                    ? `${product.stock_quantity} in stock`
                                                    : 'Out of stock'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: product.is_active ? 'var(--color-success)' : 'var(--color-text-muted)',
                                                marginRight: 6,
                                            }} />
                                            <span style={{
                                                fontSize: 13,
                                                color: product.is_active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            }}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <Link
                                                    href={`/admin/products/${product.id}/edit`}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: 'var(--color-bg-elevated)',
                                                        border: '1px solid var(--color-border)',
                                                        color: 'var(--color-text-secondary)',
                                                        textDecoration: 'none',
                                                        transition: 'all var(--transition-fast)',
                                                    }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteTarget(product)}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        color: 'var(--color-error)',
                                                        cursor: 'pointer',
                                                        transition: 'all var(--transition-fast)',
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderTop: '1px solid var(--color-border)',
                        fontSize: 13,
                        color: 'var(--color-text-muted)',
                    }}>
                        <span>
                            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-tertiary)',
                                    color: page === 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                                    opacity: page === 1 ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-tertiary)',
                                    color: page === totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                    opacity: page === totalPages ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteTarget && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: 24,
                }}>
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 32,
                        maxWidth: 420,
                        width: '100%',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}>
                            <h3 style={{
                                fontSize: 18,
                                fontWeight: 700,
                                fontFamily: "'Outfit', sans-serif",
                                color: 'var(--color-error)',
                            }}>
                                Delete Product
                            </h3>
                            <button
                                onClick={() => setDeleteTarget(null)}
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
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 8 }}>
                            Are you sure you want to delete this product? This action cannot be undone.
                        </p>
                        <p style={{
                            fontWeight: 600,
                            fontSize: 14,
                            marginBottom: 24,
                            padding: '10px 14px',
                            background: 'var(--color-bg-tertiary)',
                            borderRadius: 'var(--radius-sm)',
                        }}>
                            {deleteTarget.name}
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: 14,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    background: 'var(--color-error)',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    opacity: deleting ? 0.7 : 1,
                                }}
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
