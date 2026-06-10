'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
    Plus, Search, Edit2, Trash2, Crown, TrendingUp,
    EyeOff, X, Loader2, Upload,
} from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import {
    getAdminBrands, createBrand, updateBrand, deleteBrand,
} from '@/lib/db/adminQueries';
import type { AdminBrand, BrandFormData } from '@/lib/db/adminQueries';

/* ===== Slug helper ===== */
function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ===== Default form state ===== */
const emptyForm: BrandFormData = {
    name: '', slug: '', tagline: '', description: '',
    logo_url: '', accent_color: '', text_color: '', is_active: true, sort_order: 0,
};

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<AdminBrand[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    /* ===== Modal state ===== */
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<BrandFormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [autoSlug, setAutoSlug] = useState(true);

    /* ===== Delete state ===== */
    const [deleteTarget, setDeleteTarget] = useState<AdminBrand | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadBrands(); }, []);

    async function loadBrands() {
        setLoading(true);
        const data = await getAdminBrands();
        setBrands(data);
        setLoading(false);
    }

    /* ===== Filtered list ===== */
    const filtered = useMemo(() => {
        if (!search.trim()) return brands;
        const q = search.toLowerCase();
        return brands.filter(b =>
            b.name.toLowerCase().includes(q) ||
            b.slug.toLowerCase().includes(q) ||
            b.tagline?.toLowerCase().includes(q)
        );
    }, [brands, search]);

    /* ===== Stats ===== */
    const stats = useMemo(() => ({
        total: brands.length,
        active: brands.filter(b => b.is_active).length,
        inactive: brands.filter(b => !b.is_active).length,
    }), [brands]);

    /* ===== Open modal ===== */
    function openCreate() {
        setEditId(null);
        setForm({ ...emptyForm });
        setAutoSlug(true);
        setFormError('');
        setModalOpen(true);
    }

    function openEdit(brand: AdminBrand) {
        setEditId(brand.id);
        setForm({
            name: brand.name,
            slug: brand.slug,
            tagline: brand.tagline || '',
            description: brand.description || '',
            logo_url: brand.logo_url || '',
            accent_color: brand.accent_color || '',
            text_color: brand.text_color || '',
            is_active: brand.is_active,
            sort_order: brand.sort_order,
        });
        setAutoSlug(false);
        setFormError('');
        setModalOpen(true);
    }

    /* ===== Save (create / update) ===== */
    async function handleSave() {
        if (!form.name.trim()) { setFormError('Name is required'); return; }
        if (!form.slug.trim()) { setFormError('Slug is required'); return; }

        setSaving(true);
        setFormError('');

        try {
            if (editId) {
                const { error } = await updateBrand(editId, form);
                if (error) { setFormError(error); return; }
            } else {
                const { error } = await createBrand(form);
                if (error) { setFormError(error); return; }
            }

            setModalOpen(false);
            await loadBrands();
        } catch (err: any) {
            setFormError(err.message || 'An error occurred while saving');
        } finally {
            setSaving(false);
        }
    }

    /* ===== Delete ===== */
    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await deleteBrand(deleteTarget.id);
        if (error) {
            alert('Error deleting brand: ' + error);
        } else {
            setBrands(prev => prev.filter(b => b.id !== deleteTarget.id));
        }
        setDeleting(false);
        setDeleteTarget(null);
    }

    /* ===== Form field updater ===== */
    function setField<K extends keyof BrandFormData>(key: K, value: BrandFormData[K]) {
        setForm(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'name' && autoSlug) {
                next.slug = toSlug(value as string);
            }
            return next;
        });
    }

    /* ===== Shared styles ===== */
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '9px 12px',
        background: 'var(--color-bg-tertiary, #1a1a1d)',
        border: '1px solid var(--color-border, #2a2a2d)',
        borderRadius: 'var(--radius-md, 8px)',
        color: 'var(--color-text-primary, #e4e4e7)',
        fontSize: 14, outline: 'none',
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
                        Brands
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                        Manage your brand catalog
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
                    <Plus size={16} /> Add Brand
                </button>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12, marginBottom: 24,
            }}>
                {[
                    { label: 'Total', value: stats.total, icon: Crown, color: 'var(--color-accent)' },
                    { label: 'Active', value: stats.active, icon: TrendingUp, color: 'var(--color-success)' },
                    { label: 'Inactive', value: stats.inactive, icon: EyeOff, color: 'var(--color-text-muted)' },
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
                    placeholder="Search brands..."
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
                                {['Logo', 'Name', 'Slug', 'Tagline', 'Color', 'Status', 'Order', 'Actions'].map(h => (
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
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} style={{ padding: 16 }}>
                                                <div style={{
                                                    height: 16, background: 'var(--color-bg-tertiary)',
                                                    borderRadius: 4, width: j === 1 ? 140 : 60,
                                                }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{
                                        padding: 48, textAlign: 'center',
                                        color: 'var(--color-text-muted)',
                                    }}>
                                        <Crown size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                            No brands found
                                        </div>
                                        <div style={{ fontSize: 13 }}>
                                            {search ? 'Try adjusting your search' : 'Create your first brand to get started'}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(brand => (
                                    <tr
                                        key={brand.id}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background var(--transition-fast)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {/* Logo */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                                                overflow: 'hidden', background: 'var(--color-bg-tertiary)',
                                                position: 'relative',
                                            }}>
                                                {brand.logo_url ? (
                                                    <Image
                                                        src={brand.logo_url}
                                                        alt={brand.name}
                                                        fill
                                                        style={{ objectFit: 'contain' }}
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '100%', height: '100%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Crown size={16} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Name */}
                                        <td style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {brand.name}
                                        </td>

                                        {/* Slug */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                                            {brand.slug}
                                        </td>

                                        {/* Tagline */}
                                        <td style={{
                                            padding: '12px 16px', color: 'var(--color-text-secondary)',
                                            maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {brand.tagline || '—'}
                                        </td>

                                        {/* Accent Color */}
                                        <td style={{ padding: '12px 16px' }}>
                                            {brand.accent_color ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{
                                                        width: 16, height: 16, borderRadius: 4,
                                                        background: brand.accent_color,
                                                        border: '1px solid var(--color-border)',
                                                    }} />
                                                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                        {brand.accent_color}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                                background: brand.is_active ? 'var(--color-success)' : 'var(--color-text-muted)',
                                                marginRight: 6,
                                            }} />
                                            <span style={{
                                                fontSize: 13,
                                                color: brand.is_active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            }}>
                                                {brand.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* Sort Order */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                            {brand.sort_order}
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => openEdit(brand)}
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
                                                    onClick={() => setDeleteTarget(brand)}
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
                        maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                    }}>
                        {/* Modal header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 24,
                        }}>
                            <h3 style={{
                                fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                            }}>
                                {editId ? 'Edit Brand' : 'New Brand'}
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
                            {/* Name */}
                            <div>
                                <label style={labelStyle}>Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setField('name', e.target.value)}
                                    placeholder="e.g. Bare Anatomy"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Slug */}
                            <div>
                                <label style={labelStyle}>Slug *</label>
                                <input
                                    value={form.slug}
                                    onChange={e => { setAutoSlug(false); setField('slug', e.target.value); }}
                                    placeholder="auto-generated-from-name"
                                    style={{ ...inputStyle, color: autoSlug ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
                                />
                            </div>

                            {/* Tagline */}
                            <div>
                                <label style={labelStyle}>Tagline</label>
                                <input
                                    value={form.tagline}
                                    onChange={e => setField('tagline', e.target.value)}
                                    placeholder="Short brand tagline"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setField('description', e.target.value)}
                                    placeholder="Brand description..."
                                    rows={3}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>

                            {/* Logo URL */}
                            <div>
                                <label style={labelStyle}>Logo URL</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        value={form.logo_url}
                                        onChange={e => setField('logo_url', e.target.value)}
                                        placeholder="https://..."
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                    <label style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '10px 14px',
                                        background: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-text-secondary)',
                                        cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        transition: 'all var(--transition-fast)',
                                        opacity: uploadingLogo ? 0.7 : 1,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <Upload size={14} />
                                        {uploadingLogo ? '...' : 'Upload'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingLogo}
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploadingLogo(true);
                                                try {
                                                    const url = await uploadFile(file);
                                                    setField('logo_url', url);
                                                } catch (err: any) {
                                                    alert(err.message || 'Upload failed');
                                                } finally {
                                                    setUploadingLogo(false);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {form.logo_url && (
                                    <div style={{
                                        marginTop: 8, width: 48, height: 48, borderRadius: 'var(--radius-sm)',
                                        overflow: 'hidden', background: 'var(--color-bg-tertiary)',
                                        position: 'relative',
                                    }}>
                                        <Image src={form.logo_url} alt="Logo preview" fill style={{ objectFit: 'contain' }} sizes="48px" />
                                    </div>
                                )}
                            </div>

                            {/* Card Background Color + Brand Name Text Color row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {/* Background Color */}
                                <div>
                                    <label style={labelStyle}>Card Background Color</label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <input
                                                type="color"
                                                value={form.accent_color || '#c4a882'}
                                                onChange={e => setField('accent_color', e.target.value)}
                                                title="Pick a background color"
                                                style={{
                                                    width: 36, height: 36,
                                                    padding: 2,
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    background: 'transparent',
                                                }}
                                            />
                                        </div>
                                        <input
                                            value={form.accent_color}
                                            onChange={e => setField('accent_color', e.target.value)}
                                            placeholder="#c4a882"
                                            style={{ ...inputStyle, flex: 1 }}
                                        />
                                    </div>
                                    <p style={{
                                        fontSize: 11, color: 'var(--color-text-muted)',
                                        marginTop: 5, lineHeight: 1.4,
                                    }}>
                                        Sets the brand card gradient on the homepage
                                    </p>
                                    {form.accent_color && (
                                        <div style={{
                                            marginTop: 6, height: 28, borderRadius: 6,
                                            background: `linear-gradient(135deg, ${form.accent_color}cc 0%, ${form.accent_color} 50%, ${form.accent_color}dd 100%)`,
                                            border: '1px solid var(--color-border)',
                                        }} />
                                    )}
                                </div>

                                {/* Brand Name Text Color */}
                                <div>
                                    <label style={labelStyle}>Brand Name Text Color</label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <input
                                                type="color"
                                                value={form.text_color || '#1a1512'}
                                                onChange={e => setField('text_color', e.target.value)}
                                                title="Pick a text color"
                                                style={{
                                                    width: 36, height: 36,
                                                    padding: 2,
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    background: 'transparent',
                                                }}
                                            />
                                        </div>
                                        <input
                                            value={form.text_color}
                                            onChange={e => setField('text_color', e.target.value)}
                                            placeholder="#1a1512"
                                            style={{ ...inputStyle, flex: 1 }}
                                        />
                                    </div>
                                    <p style={{
                                        fontSize: 11, color: 'var(--color-text-muted)',
                                        marginTop: 5, lineHeight: 1.4,
                                    }}>
                                        Color of the brand name on the card
                                    </p>
                                    {/* Live preview */}
                                    {form.accent_color && (
                                        <div style={{
                                            marginTop: 6, height: 28, borderRadius: 6,
                                            background: `linear-gradient(135deg, ${form.accent_color}cc 0%, ${form.accent_color} 50%, ${form.accent_color}dd 100%)`,
                                            border: '1px solid var(--color-border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span style={{
                                                fontSize: 12, fontWeight: 700,
                                                color: form.text_color || '#1a1512',
                                                fontFamily: "'Inter', sans-serif",
                                                letterSpacing: 0.5,
                                            }}>
                                                {form.name || 'Brand Name'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label style={labelStyle}>Sort Order</label>
                                <input
                                    type="number"
                                    value={form.sort_order}
                                    onChange={e => setField('sort_order', parseInt(e.target.value) || 0)}
                                    style={inputStyle}
                                />
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
                                {editId ? 'Save Changes' : 'Create Brand'}
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
                                Delete Brand
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
                            Are you sure you want to delete this brand? Products linked to it will be unlinked.
                        </p>
                        <p style={{
                            fontWeight: 600, fontSize: 14, marginBottom: 24,
                            padding: '10px 14px', background: 'var(--color-bg-tertiary)',
                            borderRadius: 'var(--radius-sm)',
                        }}>
                            {deleteTarget.name}
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
        </div>
    );
}
