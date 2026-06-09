'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
    Plus, Search, Edit2, Trash2, SplitSquareVertical, TrendingUp,
    EyeOff, X, Loader2, Upload,
} from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import {
    getAdminVisibleChanges, createVisibleChange, updateVisibleChange, deleteVisibleChange,
    getActiveProductsSimple,
} from '@/lib/db/adminQueries';
import type { AdminVisibleChange, VisibleChangeFormData } from '@/lib/db/adminQueries';

const emptyForm: VisibleChangeFormData = {
    product_id: null, before_image: '', after_image: '',
    before_label: 'Day 1', after_label: 'Day 30', is_active: true, sort_order: 0,
};

interface ProductOption { id: string; name: string; slug: string; }

export default function AdminVisibleChangesPage() {
    const [items, setItems] = useState<AdminVisibleChange[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<ProductOption[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<VisibleChangeFormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [uploadingBeforeImage, setUploadingBeforeImage] = useState(false);
    const [uploadingAfterImage, setUploadingAfterImage] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<AdminVisibleChange | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [data, prodRes] = await Promise.all([
                getAdminVisibleChanges(),
                getActiveProductsSimple(),
            ]);
            setItems(data);
            setProducts(prodRes);
        } catch (err) {
            console.error("Failed to load visible changes data", err);
        }
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        const q = search.toLowerCase();
        return items.filter(i =>
            i.product_name?.toLowerCase().includes(q) ||
            i.product_slug?.toLowerCase().includes(q)
        );
    }, [items, search]);

    const stats = useMemo(() => ({
        total: items.length,
        active: items.filter(i => i.is_active).length,
        inactive: items.filter(i => !i.is_active).length,
    }), [items]);

    function openCreate() {
        setEditId(null); setForm({ ...emptyForm }); setFormError(''); setModalOpen(true);
    }

    function openEdit(item: AdminVisibleChange) {
        setEditId(item.id);
        setForm({
            product_id: item.product_id, before_image: item.before_image,
            after_image: item.after_image, before_label: item.before_label,
            after_label: item.after_label, is_active: item.is_active, sort_order: item.sort_order,
        });
        setFormError(''); setModalOpen(true);
    }

    async function handleSave() {
        if (!form.product_id) { setFormError('Please select a linked product'); return; }
        if (!form.before_image.trim()) { setFormError('Before image URL is required'); return; }
        if (!form.after_image.trim()) { setFormError('After image URL is required'); return; }
        setSaving(true);
        setFormError('');

        try {
            if (editId) {
                const { error } = await updateVisibleChange(editId, form);
                if (error) { setFormError(error); return; }
            } else {
                const { error } = await createVisibleChange(form);
                if (error) { setFormError(error); return; }
            }
            setModalOpen(false);
            await loadData();
        } catch (err: any) {
            setFormError(err.message || 'An error occurred while saving');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await deleteVisibleChange(deleteTarget.id);
        if (error) { alert('Error: ' + error); }
        else { setItems(prev => prev.filter(i => i.id !== deleteTarget.id)); }
        setDeleting(false); setDeleteTarget(null);
    }

    function setField<K extends keyof VisibleChangeFormData>(key: K, value: VisibleChangeFormData[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '9px 12px',
        background: 'var(--color-bg-tertiary, #1a1a1d)',
        border: '1px solid var(--color-border, #2a2a2d)',
        borderRadius: 'var(--radius-md, 8px)',
        color: 'var(--color-text-primary, #e4e4e7)', fontSize: 14, outline: 'none',
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: 12, fontWeight: 600,
        color: 'var(--color-text-muted, #71717a)',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Visible Changes</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Manage before/after transformation cards</p>
                </div>
                <button onClick={openCreate} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'var(--gradient-accent)', color: '#0a0a0b', borderRadius: 'var(--radius-md)',
                    fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                }}>
                    <Plus size={16} /> Add Visible Change
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total', value: stats.total, icon: SplitSquareVertical, color: 'var(--color-accent)' },
                    { label: 'Active', value: stats.active, icon: TrendingUp, color: 'var(--color-success)' },
                    { label: 'Inactive', value: stats.inactive, icon: EyeOff, color: 'var(--color-text-muted)' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', padding: '16px 20px',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <s.icon size={18} style={{ color: s.color }} />
                        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{loading ? '—' : s.value}</span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input type="text" placeholder="Search by product name..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px 10px 40px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 14, outline: 'none' }} />
            </div>

            {/* Table */}
            <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['Before', 'After', 'Product', 'Labels', 'Status', 'Order', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} style={{ padding: 16 }}>
                                                <div style={{ height: 16, background: 'var(--color-bg-tertiary)', borderRadius: 4, width: j < 2 ? 48 : 80 }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        <SplitSquareVertical size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No visible changes found</div>
                                        <div style={{ fontSize: 13 }}>{search ? 'Try adjusting your search' : 'Create your first visible change'}</div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background var(--transition-fast)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        {/* Before */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-bg-tertiary)', position: 'relative' }}>
                                                <Image src={item.before_image} alt="Before" fill style={{ objectFit: 'cover' }} sizes="48px" />
                                            </div>
                                        </td>
                                        {/* After */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-bg-tertiary)', position: 'relative' }}>
                                                <Image src={item.after_image} alt="After" fill style={{ objectFit: 'cover' }} sizes="48px" />
                                            </div>
                                        </td>
                                        {/* Product */}
                                        <td style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.product_name || <span style={{ color: 'var(--color-text-muted)' }}>No product linked</span>}
                                        </td>
                                        {/* Labels */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                                            {item.before_label} → {item.after_label}
                                        </td>
                                        {/* Status */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: item.is_active ? 'var(--color-success)' : 'var(--color-text-muted)', marginRight: 6 }} />
                                            <span style={{ fontSize: 13, color: item.is_active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        {/* Order */}
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', textAlign: 'center' }}>{item.sort_order}</td>
                                        {/* Actions */}
                                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => openEdit(item)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'pointer' }} title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(item)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-error)', cursor: 'pointer' }} title="Delete">
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

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
                    <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                                {editId ? 'Edit Visible Change' : 'New Visible Change'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-error)', fontSize: 13 }}>
                                {formError}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {/* Product */}
                            <div>
                                <label style={labelStyle}>Linked Product</label>
                                <select value={form.product_id || ''} onChange={e => setField('product_id', e.target.value || null)}
                                    style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="">— Select a product —</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                    Product name, price, rating and thumbnail will be pulled from this product.
                                </p>
                            </div>

                            {/* Before Image */}
                            <div>
                                <label style={labelStyle}>Before Image URL *</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        value={form.before_image}
                                        onChange={e => setField('before_image', e.target.value)}
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
                                        cursor: uploadingBeforeImage ? 'not-allowed' : 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        transition: 'all var(--transition-fast)',
                                        opacity: uploadingBeforeImage ? 0.7 : 1,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <Upload size={14} />
                                        {uploadingBeforeImage ? '...' : 'Upload'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingBeforeImage}
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploadingBeforeImage(true);
                                                try {
                                                    const url = await uploadFile(file);
                                                    setField('before_image', url);
                                                } catch (err: any) {
                                                    alert(err.message || 'Upload failed');
                                                } finally {
                                                    setUploadingBeforeImage(false);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {form.before_image && (
                                    <div style={{ marginTop: 8, width: 80, height: 60, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-bg-tertiary)', position: 'relative' }}>
                                        <img src={form.before_image} alt="Before preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>

                            {/* After Image */}
                            <div>
                                <label style={labelStyle}>After Image URL *</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        value={form.after_image}
                                        onChange={e => setField('after_image', e.target.value)}
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
                                        cursor: uploadingAfterImage ? 'not-allowed' : 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        transition: 'all var(--transition-fast)',
                                        opacity: uploadingAfterImage ? 0.7 : 1,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <Upload size={14} />
                                        {uploadingAfterImage ? '...' : 'Upload'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingAfterImage}
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploadingAfterImage(true);
                                                try {
                                                    const url = await uploadFile(file);
                                                    setField('after_image', url);
                                                } catch (err: any) {
                                                    alert(err.message || 'Upload failed');
                                                } finally {
                                                    setUploadingAfterImage(false);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {form.after_image && (
                                    <div style={{ marginTop: 8, width: 80, height: 60, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-bg-tertiary)', position: 'relative' }}>
                                        <img src={form.after_image} alt="After preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>

                            {/* Labels */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Before Label</label>
                                    <input value={form.before_label} onChange={e => setField('before_label', e.target.value)} placeholder="Day 1" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>After Label</label>
                                    <input value={form.after_label} onChange={e => setField('after_label', e.target.value)} placeholder="Day 30" style={inputStyle} />
                                </div>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label style={labelStyle}>Sort Order</label>
                                <input type="number" value={form.sort_order} onChange={e => setField('sort_order', parseInt(e.target.value) || 0)} style={inputStyle} />
                            </div>

                            {/* Active toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button type="button" onClick={() => setField('is_active', !form.is_active)} style={{
                                    width: 44, height: 24, borderRadius: 12, border: 'none',
                                    background: form.is_active ? 'var(--color-success, #22c55e)' : 'var(--color-bg-tertiary, #2a2a2d)',
                                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                                </button>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>{form.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
                            <button onClick={() => setModalOpen(false)} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} style={{
                                padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none',
                                background: 'var(--gradient-accent)', color: '#0a0a0b', fontSize: 14, fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                            }}>
                                {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                                {editId ? 'Save Changes' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
                    <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 420, width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: 'var(--color-error)' }}>Delete Visible Change</h3>
                            <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 8 }}>
                            Are you sure you want to delete this visible change entry?
                        </p>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 24, padding: '10px 14px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                            {deleteTarget.product_name || 'Unlinked entry'}
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-error)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
