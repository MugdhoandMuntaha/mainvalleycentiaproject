'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
    Plus, Search, Edit2, Trash2, Image as ImageIcon, Eye,
    EyeOff, X, Loader2, ExternalLink, Upload,
} from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import {
    getAdminHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide,
} from '@/lib/db/adminQueries';
import type { AdminHeroSlide, HeroSlideFormData } from '@/lib/db/adminQueries';

/* ===== Default form state ===== */
const emptyForm: HeroSlideFormData = {
    title: '', subtitle: '', cta_text: '', cta_link: '',
    image_url: '', mobile_image_url: '', image_alt: '', background_color: '',
    text_color: '#ffffff', is_active: true, sort_order: 0,
};

export default function AdminHeroSlidesPage() {
    const [slides, setSlides] = useState<AdminHeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<HeroSlideFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingMobileImage, setUploadingMobileImage] = useState(false);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadSlides(); }, []);

    async function loadSlides() {
        setLoading(true);
        const data = await getAdminHeroSlides();
        setSlides(data);
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!query) return slides;
        const q = query.toLowerCase();
        return slides.filter(s =>
            s.title.toLowerCase().includes(q) ||
            (s.subtitle || '').toLowerCase().includes(q)
        );
    }, [slides, query]);

    // ===== Open modal =====
    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setError('');
        setModalOpen(true);
    }

    function openEdit(slide: AdminHeroSlide) {
        setEditingId(slide.id);
        setForm({
            title: slide.title,
            subtitle: slide.subtitle || '',
            cta_text: slide.cta_text || '',
            cta_link: slide.cta_link || '',
            image_url: slide.image_url,
            mobile_image_url: slide.mobile_image_url || '',
            image_alt: slide.image_alt || '',
            background_color: slide.background_color || '',
            text_color: slide.text_color || '#ffffff',
            is_active: slide.is_active,
            sort_order: slide.sort_order,
        });
        setError('');
        setModalOpen(true);
    }

    // ===== Save (create / update) =====
    async function handleSave() {
        if (!form.title.trim()) { setError('Title is required'); return; }
        if (!form.image_url.trim()) { setError('Image URL is required'); return; }

        setSaving(true);
        setError('');
        try {
            if (editingId) {
                const res = await updateHeroSlide(editingId, form);
                if (res.error) { setError(res.error); return; }
            } else {
                const res = await createHeroSlide(form);
                if (res.error) { setError(res.error); return; }
            }
            setModalOpen(false);
            await loadSlides();
        } catch (err: any) {
            setError(err.message || 'An error occurred while saving');
        } finally {
            setSaving(false);
        }
    }

    // ===== Delete =====
    async function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        const res = await deleteHeroSlide(deleteId);
        if (res.error) { setError(res.error); }
        setDeleting(false);
        setDeleteId(null);
        await loadSlides();
    }

    // ===== Form field updater =====
    function setField<K extends keyof HeroSlideFormData>(key: K, value: HeroSlideFormData[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    // ═══════════════════════════════════════════════════════════ RENDER
    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28,
                flexWrap: 'wrap', gap: 16,
            }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>
                        Hero Slides
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                        Manage hero carousel banners on the homepage
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', background: 'var(--gradient-accent)',
                        color: '#0a0a0b', borderRadius: 'var(--radius-md)',
                        fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                        transition: 'opacity var(--transition-fast)',
                    }}
                >
                    <Plus size={16} /> Add Slide
                </button>
            </div>

            {/* Search */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '8px 14px',
                marginBottom: 24, maxWidth: 400,
            }}>
                <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="Search slides..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        color: 'var(--color-text-primary)', fontSize: 14,
                        fontFamily: "'Inter', sans-serif",
                    }}
                />
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                    <Loader2 size={28} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: 80, color: 'var(--color-text-muted)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                }}>
                    <ImageIcon size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ fontSize: 16, fontWeight: 600 }}>No hero slides found</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Create your first slide to get started</p>
                </div>
            ) : (
                /* ===== Slides Grid ===== */
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 20,
                }}>
                    {filtered.map((slide) => (
                        <div key={slide.id} style={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            transition: 'border-color var(--transition-fast)',
                        }}>
                            {/* Image Preview */}
                            <div style={{
                                position: 'relative', width: '100%', height: 160,
                                background: slide.background_color || '#1a1a2e',
                            }}>
                                <Image
                                    src={slide.image_url}
                                    alt={slide.image_alt || slide.title}
                                    fill
                                    sizes="400px"
                                    style={{ objectFit: 'cover' }}
                                />
                                {/* Active badge */}
                                <span style={{
                                    position: 'absolute', top: 10, right: 10,
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 10px', borderRadius: 20,
                                    fontSize: 11, fontWeight: 600,
                                    background: slide.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: slide.is_active ? '#22c55e' : '#ef4444',
                                    backdropFilter: 'blur(6px)',
                                }}>
                                    {slide.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                                    {slide.is_active ? 'Active' : 'Hidden'}
                                </span>
                            </div>

                            {/* Info */}
                            <div style={{ padding: '14px 16px' }}>
                                <h3 style={{
                                    fontSize: 15, fontWeight: 700, marginBottom: 4,
                                    color: 'var(--color-text-primary)',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {slide.title}
                                </h3>
                                {slide.subtitle && (
                                    <p style={{
                                        fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {slide.subtitle}
                                    </p>
                                )}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                                    color: 'var(--color-text-muted)', marginBottom: 12,
                                }}>
                                    {slide.cta_text && (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            background: 'var(--color-accent-glow)', color: 'var(--color-accent)',
                                            padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                                        }}>
                                            <ExternalLink size={10} /> {slide.cta_text}
                                        </span>
                                    )}
                                    <span>Order: {slide.sort_order}</span>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => openEdit(slide)}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '8px 0', background: 'var(--color-accent-glow)',
                                            color: 'var(--color-accent)', border: 'none', borderRadius: 'var(--radius-md)',
                                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            transition: 'opacity var(--transition-fast)',
                                        }}
                                    >
                                        <Edit2 size={13} /> Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(slide.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '8px 14px', background: 'rgba(239,68,68,0.1)',
                                            color: '#ef4444', border: 'none', borderRadius: 'var(--radius-md)',
                                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            transition: 'opacity var(--transition-fast)',
                                        }}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════ CREATE / EDIT MODAL ═══════════════ */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)', padding: 24,
                }}
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        style={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
                            padding: 28,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                                {editingId ? 'Edit Slide' : 'Create Slide'}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20,
                                color: '#ef4444', fontSize: 13, fontWeight: 500,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Image URL + Preview */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>Desktop Image URL *</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={form.image_url}
                                        onChange={(e) => setField('image_url', e.target.value)}
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
                                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        transition: 'all var(--transition-fast)',
                                        opacity: uploadingImage ? 0.7 : 1,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <Upload size={14} />
                                        {uploadingImage ? '...' : 'Upload'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingImage}
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploadingImage(true);
                                                try {
                                                    const url = await uploadFile(file);
                                                    setField('image_url', url);
                                                } catch (err: any) {
                                                    alert(err.message || 'Upload failed');
                                                } finally {
                                                    setUploadingImage(false);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {form.image_url && (
                                    <div style={{
                                        position: 'relative', width: '100%', height: 100, marginTop: 8,
                                        borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)',
                                    }}>
                                        <Image src={form.image_url} alt="Preview" fill sizes="300px" style={{ objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>Mobile Image URL (Square)</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={form.mobile_image_url}
                                        onChange={(e) => setField('mobile_image_url', e.target.value)}
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
                                        cursor: uploadingMobileImage ? 'not-allowed' : 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        transition: 'all var(--transition-fast)',
                                        opacity: uploadingMobileImage ? 0.7 : 1,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <Upload size={14} />
                                        {uploadingMobileImage ? '...' : 'Upload'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingMobileImage}
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploadingMobileImage(true);
                                                try {
                                                    const url = await uploadFile(file);
                                                    setField('mobile_image_url', url);
                                                } catch (err: any) {
                                                    alert(err.message || 'Upload failed');
                                                } finally {
                                                    setUploadingMobileImage(false);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {form.mobile_image_url && (
                                    <div style={{
                                        position: 'relative', width: '100%', height: 100, marginTop: 8,
                                        borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)',
                                    }}>
                                        <Image src={form.mobile_image_url} alt="Mobile Preview" fill sizes="300px" style={{ objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Title *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setField('title', e.target.value)}
                                placeholder="Banner headline"
                                style={inputStyle}
                            />
                        </div>

                        {/* Subtitle */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Subtitle</label>
                            <textarea
                                value={form.subtitle}
                                onChange={(e) => setField('subtitle', e.target.value)}
                                placeholder="Short description"
                                rows={2}
                                style={{ ...inputStyle, resize: 'vertical' }}
                            />
                        </div>

                        {/* Image Alt */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Image Alt Text</label>
                            <input
                                type="text"
                                value={form.image_alt}
                                onChange={(e) => setField('image_alt', e.target.value)}
                                placeholder="Accessibility description"
                                style={inputStyle}
                            />
                        </div>

                        {/* CTA Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>CTA Text</label>
                                <input
                                    type="text"
                                    value={form.cta_text}
                                    onChange={(e) => setField('cta_text', e.target.value)}
                                    placeholder="Shop Now"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>CTA Link</label>
                                <input
                                    type="text"
                                    value={form.cta_link}
                                    onChange={(e) => setField('cta_link', e.target.value)}
                                    placeholder="/shop"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Colors Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>Background Color</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="color"
                                        value={form.background_color || '#1a1a2e'}
                                        onChange={(e) => setField('background_color', e.target.value)}
                                        style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                                    />
                                    <input
                                        type="text"
                                        value={form.background_color}
                                        onChange={(e) => setField('background_color', e.target.value)}
                                        placeholder="#1a1a2e"
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Text Color</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="color"
                                        value={form.text_color || '#ffffff'}
                                        onChange={(e) => setField('text_color', e.target.value)}
                                        style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                                    />
                                    <input
                                        type="text"
                                        value={form.text_color}
                                        onChange={(e) => setField('text_color', e.target.value)}
                                        placeholder="#ffffff"
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sort Order + Active */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                            <div>
                                <label style={labelStyle}>Sort Order</label>
                                <input
                                    type="number"
                                    value={form.sort_order}
                                    onChange={(e) => setField('sort_order', parseInt(e.target.value) || 0)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Status</label>
                                <button
                                    type="button"
                                    onClick={() => setField('is_active', !form.is_active)}
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: form.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: form.is_active ? '#22c55e' : '#ef4444',
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    {form.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                    {form.is_active ? 'Active' : 'Hidden'}
                                </button>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                width: '100%', padding: '12px 0', background: 'var(--gradient-accent)',
                                color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius-md)',
                                fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                opacity: saving ? 0.7 : 1,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {editingId ? 'Update Slide' : 'Create Slide'}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════════ DELETE CONFIRMATION ═══════════════ */}
            {deleteId && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)',
                }}
                    onClick={() => setDeleteId(null)}
                >
                    <div
                        style={{
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 28, maxWidth: 400, width: '100%', textAlign: 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Trash2 size={32} style={{ color: '#ef4444', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                            Delete Slide?
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 24 }}>
                            This action cannot be undone. The slide will be permanently removed from the hero carousel.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setDeleteId(null)}
                                style={{
                                    flex: 1, padding: '10px 0', background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{
                                    flex: 1, padding: '10px 0', background: '#ef4444',
                                    color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                                    fontSize: 13, fontWeight: 600, cursor: deleting ? 'wait' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    opacity: deleting ? 0.7 : 1,
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ===== Shared styles ===== */
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: 'var(--color-text-secondary)', marginBottom: 6,
    fontFamily: "'Inter', sans-serif", textTransform: 'uppercase',
    letterSpacing: 0.5,
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--color-bg-tertiary, #1a1a1d)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: 14, fontFamily: "'Inter', sans-serif",
    outline: 'none',
};
