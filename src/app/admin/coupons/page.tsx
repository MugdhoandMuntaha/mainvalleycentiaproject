'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Plus, Search, Edit2, Trash2, Tag, Percent,
    EyeOff, X, Loader2, DollarSign, TrendingUp,
} from 'lucide-react';
import {
    getAdminCoupons, createCoupon, updateCoupon, deleteCoupon,
} from '@/lib/db/adminQueries';
import type { AdminCoupon, CouponFormData } from '@/lib/db/adminQueries';

/* ===== Default form state ===== */
const emptyForm: CouponFormData = {
    code: '', description: '', discount_type: 'percentage',
    discount_value: 0, minimum_order_value: 0,
    max_discount_amount: null, usage_limit: null,
    per_user_limit: 1, is_active: true, expires_at: '',
};

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    /* Modal state */
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<CouponFormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    /* Delete state */
    const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadCoupons(); }, []);

    async function loadCoupons() {
        setLoading(true);
        const data = await getAdminCoupons();
        setCoupons(data);
        setLoading(false);
    }

    /* Filtered list */
    const filtered = useMemo(() => {
        if (!search.trim()) return coupons;
        const q = search.toLowerCase();
        return coupons.filter(c =>
            c.code.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        );
    }, [coupons, search]);

    /* Stats */
    const stats = useMemo(() => ({
        total: coupons.length,
        active: coupons.filter(c => c.is_active).length,
        percentage: coupons.filter(c => c.discount_type === 'percentage').length,
        fixed: coupons.filter(c => c.discount_type === 'fixed_amount').length,
    }), [coupons]);

    /* Open modal */
    function openCreate() {
        setEditId(null);
        setForm({ ...emptyForm });
        setFormError('');
        setModalOpen(true);
    }

    function openEdit(coupon: AdminCoupon) {
        setEditId(coupon.id);
        setForm({
            code: coupon.code,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            minimum_order_value: coupon.minimum_order_value,
            max_discount_amount: coupon.max_discount_amount,
            usage_limit: coupon.usage_limit,
            per_user_limit: coupon.per_user_limit,
            is_active: coupon.is_active,
            expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
        });
        setFormError('');
        setModalOpen(true);
    }

    /* Save */
    async function handleSave() {
        if (!form.code.trim()) { setFormError('Code is required'); return; }
        if (form.discount_value <= 0) { setFormError('Discount value must be greater than 0'); return; }

        setSaving(true);
        setFormError('');

        if (editId) {
            const { error } = await updateCoupon(editId, form);
            if (error) { setFormError(error); setSaving(false); return; }
        } else {
            const { error } = await createCoupon(form);
            if (error) { setFormError(error); setSaving(false); return; }
        }

        setSaving(false);
        setModalOpen(false);
        await loadCoupons();
    }

    /* Delete */
    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await deleteCoupon(deleteTarget.id);
        if (error) {
            alert('Error deleting coupon: ' + error);
        } else {
            setCoupons(prev => prev.filter(c => c.id !== deleteTarget.id));
        }
        setDeleting(false);
        setDeleteTarget(null);
    }

    /* Field updater */
    function setField<K extends keyof CouponFormData>(key: K, value: CouponFormData[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    /* Shared styles */
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '9px 12px',
        background: 'var(--color-bg-tertiary, #1a1a1d)',
        border: '1px solid var(--color-border, #2a2a2d)',
        borderRadius: 'var(--radius-md, 8px)',
        color: 'var(--color-text-primary, #e4e4e7)',
        fontSize: 14, outline: 'none',
        fontFamily: "'Inter', sans-serif",
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: 12, fontWeight: 600,
        color: 'var(--color-text-muted, #71717a)',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
    };

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 24, flexWrap: 'wrap', gap: 16,
            }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        Coupons
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                        Manage promo codes and discounts
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', background: 'var(--gradient-accent)',
                        color: '#0a0a0b', borderRadius: 'var(--radius-md)',
                        fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                    }}
                >
                    <Plus size={16} /> Add Coupon
                </button>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12, marginBottom: 24,
            }}>
                {[
                    { label: 'Total', value: stats.total, icon: Tag, color: 'var(--color-accent)' },
                    { label: 'Active', value: stats.active, icon: TrendingUp, color: 'var(--color-success)' },
                    { label: 'Percentage', value: stats.percentage, icon: Percent, color: '#a78bfa' },
                    { label: 'Fixed Amount', value: stats.fixed, icon: DollarSign, color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', padding: '16px 20px',
                        display: 'flex', alignItems: 'center', gap: 12,
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
            <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
                <Search size={16} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                }} />
                <input
                    type="text"
                    placeholder="Search coupons..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        width: '100%', padding: '10px 14px 10px 40px',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)', fontSize: 14, outline: 'none',
                    }}
                />
            </div>

            {/* Table */}
            <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['Code', 'Description', 'Type', 'Value', 'Min Order', 'Usage', 'Status', 'Expires', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '12px 16px', textAlign: 'left', fontSize: 12,
                                        fontWeight: 600, color: 'var(--color-text-muted)',
                                        textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <td key={j} style={{ padding: 16 }}>
                                                <div style={{
                                                    height: 16, background: 'var(--color-bg-tertiary)',
                                                    borderRadius: 4, width: j === 0 ? 100 : 60,
                                                }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{
                                        padding: 48, textAlign: 'center',
                                        color: 'var(--color-text-muted)',
                                    }}>
                                        <Tag size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                            No coupons found
                                        </div>
                                        <div style={{ fontSize: 13 }}>
                                            {search ? 'Try adjusting your search' : 'Create your first coupon to get started'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(coupon => (
                                    <tr
                                        key={coupon.id}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background var(--transition-fast)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {/* Code */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '4px 10px',
                                                background: 'var(--color-accent-glow)',
                                                color: 'var(--color-accent)',
                                                borderRadius: 6, fontWeight: 700, fontSize: 13,
                                                fontFamily: "'Outfit', sans-serif",
                                                letterSpacing: 1,
                                            }}>
                                                {coupon.code}
                                            </span>
                                        </td>

                                        {/* Description */}
                                        <td style={{
                                            padding: '12px 16px', color: 'var(--color-text-secondary)',
                                            maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {coupon.description || '—'}
                                        </td>

                                        {/* Type */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                fontSize: 12, padding: '3px 8px', borderRadius: 4,
                                                background: coupon.discount_type === 'percentage' ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.1)',
                                                color: coupon.discount_type === 'percentage' ? '#a78bfa' : '#f59e0b',
                                                fontWeight: 600,
                                            }}>
                                                {coupon.discount_type === 'percentage' ? <Percent size={12} /> : <DollarSign size={12} />}
                                                {coupon.discount_type === 'percentage' ? 'Percent' : 'Fixed'}
                                            </span>
                                        </td>

                                        {/* Value */}
                                        <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                                            {coupon.discount_type === 'percentage'
                                                ? `${coupon.discount_value}%`
                                                : `৳${coupon.discount_value}`
                                            }
                                        </td>

                                        {/* Min Order */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                                            {coupon.minimum_order_value > 0 ? `৳${coupon.minimum_order_value}` : '—'}
                                        </td>

                                        {/* Usage */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                                            {coupon.usage_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' / ∞'}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                                background: coupon.is_active ? 'var(--color-success)' : 'var(--color-text-muted)',
                                                marginRight: 6,
                                            }} />
                                            <span style={{
                                                fontSize: 13,
                                                color: coupon.is_active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            }}>
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* Expires */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                                            {coupon.expires_at
                                                ? new Date(coupon.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : 'Never'
                                            }
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => openEdit(coupon)}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                                        background: 'var(--color-bg-elevated)',
                                                        border: '1px solid var(--color-border)',
                                                        color: 'var(--color-text-secondary)',
                                                        cursor: 'pointer', transition: 'all var(--transition-fast)',
                                                    }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(coupon)}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        color: 'var(--color-error)', cursor: 'pointer',
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
            </div>

            {/* ===== Create / Edit Modal ===== */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 24,
                }}>
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)', padding: 32,
                        maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                    }}>
                        {/* Modal header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 24,
                        }}>
                            <h3 style={{
                                fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                            }}>
                                {editId ? 'Edit Coupon' : 'New Coupon'}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                style={{
                                    background: 'none', border: 'none',
                                    color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4,
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div style={{
                                padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                color: 'var(--color-error)', fontSize: 13,
                            }}>
                                {formError}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {/* Code */}
                            <div>
                                <label style={labelStyle}>Coupon Code *</label>
                                <input
                                    value={form.code}
                                    onChange={e => setField('code', e.target.value.toUpperCase())}
                                    placeholder="e.g. FLAT20"
                                    style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={labelStyle}>Description</label>
                                <input
                                    value={form.description}
                                    onChange={e => setField('description', e.target.value)}
                                    placeholder="e.g. 20% off on your order"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Type + Value row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Discount Type</label>
                                    <select
                                        value={form.discount_type}
                                        onChange={e => setField('discount_type', e.target.value as 'percentage' | 'fixed_amount')}
                                        style={inputStyle}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed_amount">Fixed Amount (৳)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>
                                        Discount Value {form.discount_type === 'percentage' ? '(%)' : '(৳)'} *
                                    </label>
                                    <input
                                        type="number"
                                        value={form.discount_value || ''}
                                        onChange={e => setField('discount_value', Number(e.target.value))}
                                        placeholder="20"
                                        style={inputStyle}
                                        min={0}
                                    />
                                </div>
                            </div>

                            {/* Min Order + Max Discount row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Minimum Order (৳)</label>
                                    <input
                                        type="number"
                                        value={form.minimum_order_value || ''}
                                        onChange={e => setField('minimum_order_value', Number(e.target.value))}
                                        placeholder="0"
                                        style={inputStyle}
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Max Discount Cap (৳)</label>
                                    <input
                                        type="number"
                                        value={form.max_discount_amount || ''}
                                        onChange={e => setField('max_discount_amount', e.target.value ? Number(e.target.value) : null)}
                                        placeholder="No cap"
                                        style={inputStyle}
                                        min={0}
                                    />
                                </div>
                            </div>

                            {/* Usage Limit + Per User row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Total Usage Limit</label>
                                    <input
                                        type="number"
                                        value={form.usage_limit || ''}
                                        onChange={e => setField('usage_limit', e.target.value ? Number(e.target.value) : null)}
                                        placeholder="Unlimited"
                                        style={inputStyle}
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Per User Limit</label>
                                    <input
                                        type="number"
                                        value={form.per_user_limit || ''}
                                        onChange={e => setField('per_user_limit', Number(e.target.value) || 1)}
                                        placeholder="1"
                                        style={inputStyle}
                                        min={1}
                                    />
                                </div>
                            </div>

                            {/* Expires At */}
                            <div>
                                <label style={labelStyle}>Expiry Date</label>
                                <input
                                    type="date"
                                    value={form.expires_at}
                                    onChange={e => setField('expires_at', e.target.value)}
                                    style={inputStyle}
                                />
                                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                    Leave blank for no expiry
                                </p>
                            </div>

                            {/* Active toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setField('is_active', !form.is_active)}
                                    style={{
                                        width: 44, height: 24, borderRadius: 12, border: 'none',
                                        background: form.is_active ? 'var(--color-success, #22c55e)' : 'var(--color-bg-tertiary, #2a2a2d)',
                                        cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                        position: 'absolute', top: 3,
                                        left: form.is_active ? 23 : 3,
                                        transition: 'left 0.2s',
                                    }} />
                                </button>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>
                                    {form.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
                            <button
                                onClick={() => setModalOpen(false)}
                                style={{
                                    padding: '9px 18px', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)', background: 'transparent',
                                    color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none',
                                    background: 'var(--gradient-accent)', color: '#0a0a0b',
                                    fontSize: 14, fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.7 : 1,
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                }}
                            >
                                {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                                {editId ? 'Save Changes' : 'Create Coupon'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Delete Confirmation Modal ===== */}
            {deleteTarget && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 24,
                }}>
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)', padding: 32,
                        maxWidth: 420, width: '100%',
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 16,
                        }}>
                            <h3 style={{
                                fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                color: 'var(--color-error)',
                            }}>
                                Delete Coupon
                            </h3>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    background: 'none', border: 'none',
                                    color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4,
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 8 }}>
                            Are you sure you want to delete this coupon?
                        </p>
                        <p style={{
                            fontWeight: 700, fontSize: 16, marginBottom: 24,
                            padding: '10px 14px', background: 'var(--color-bg-tertiary)',
                            borderRadius: 'var(--radius-sm)',
                            letterSpacing: 1, fontFamily: "'Outfit', sans-serif",
                        }}>
                            {deleteTarget.code}
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    padding: '9px 18px', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)', background: 'transparent',
                                    color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{
                                    padding: '9px 18px', borderRadius: 'var(--radius-md)',
                                    border: 'none', background: 'var(--color-error)', color: '#fff',
                                    fontSize: 14, fontWeight: 600,
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

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
