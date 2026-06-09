'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Plus, Search, Edit2, Trash2, Layers, TrendingUp,
    EyeOff, X, Loader2, Package,
} from 'lucide-react';
import {
    getAdminSections, createSection, updateSection, deleteSection,
} from '@/lib/db/adminQueries';
import type { AdminSection, SectionFormData } from '@/lib/db/adminQueries';

const SECTION_TYPES = [
    { value: 'best_sellers', label: 'Best Sellers' },
    { value: 'new_launches', label: 'New Launches' },
    { value: 'power_care_duos', label: 'Power Care Duos' },
    { value: 'hero_carousel', label: 'Hero Carousel' },
    { value: 'brands_that_lead', label: 'Brands That Lead' },
    { value: 'visible_change', label: 'Visible Change' },
    { value: 'custom', label: 'Custom' },
];

const emptyForm: SectionFormData = {
    section_type: 'best_sellers', title: '', subtitle: '', badge_text: '',
    cta_text: '', cta_link: '', background_color: '', is_active: true, sort_order: 0,
};

export default function AdminSectionsPage() {
    const [sections, setSections] = useState<AdminSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<SectionFormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<AdminSection | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadSections(); }, []);

    async function loadSections() {
        setLoading(true);
        const data = await getAdminSections();
        setSections(data);
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return sections;
        const q = search.toLowerCase();
        return sections.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.section_type.toLowerCase().includes(q) ||
            s.badge_text?.toLowerCase().includes(q)
        );
    }, [sections, search]);

    const stats = useMemo(() => ({
        total: sections.length,
        active: sections.filter(s => s.is_active).length,
        inactive: sections.filter(s => !s.is_active).length,
    }), [sections]);

    function openCreate() {
        setEditId(null);
        setForm({ ...emptyForm });
        setFormError('');
        setModalOpen(true);
    }

    function openEdit(sec: AdminSection) {
        setEditId(sec.id);
        setForm({
            section_type: sec.section_type,
            title: sec.title,
            subtitle: sec.subtitle || '',
            badge_text: sec.badge_text || '',
            cta_text: sec.cta_text || '',
            cta_link: sec.cta_link || '',
            background_color: sec.background_color || '',
            is_active: sec.is_active,
            sort_order: sec.sort_order,
        });
        setFormError('');
        setModalOpen(true);
    }

    async function handleSave() {
        if (!form.title.trim()) { setFormError('Title is required'); return; }
        setSaving(true);
        setFormError('');

        try {
            if (editId) {
                const { error } = await updateSection(editId, form);
                if (error) { setFormError(error); return; }
            } else {
                const { error } = await createSection(form);
                if (error) { setFormError(error); return; }
            }

            setModalOpen(false);
            await loadSections();
        } catch (err: any) {
            setFormError(err.message || 'An error occurred while saving');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await deleteSection(deleteTarget.id);
        if (error) { alert('Error deleting section: ' + error); }
        else { setSections(prev => prev.filter(s => s.id !== deleteTarget.id)); }
        setDeleting(false);
        setDeleteTarget(null);
    }

    async function toggleActive(sec: AdminSection) {
        const nextActive = !sec.is_active;
        // Optimistic update
        setSections(prev => prev.map(s => s.id === sec.id ? { ...s, is_active: nextActive } : s));

        const { error } = await updateSection(sec.id, {
            section_type: sec.section_type,
            title: sec.title,
            subtitle: sec.subtitle || '',
            badge_text: sec.badge_text || '',
            cta_text: sec.cta_text || '',
            cta_link: sec.cta_link || '',
            background_color: sec.background_color || '',
            is_active: nextActive,
            sort_order: sec.sort_order,
        });

        if (error) {
            alert('Error updating status: ' + error);
            await loadSections(); // Revert on error
        }
    }

    async function toggleAll(active: boolean) {
        if (!confirm(`Are you sure you want to ${active ? 'enable' : 'disable'} ALL homepage sections?`)) return;
        
        setSaving(true);
        try {
            const results = await Promise.all(sections.map(sec => updateSection(sec.id, {
                section_type: sec.section_type,
                title: sec.title,
                subtitle: sec.subtitle || '',
                badge_text: sec.badge_text || '',
                cta_text: sec.cta_text || '',
                cta_link: sec.cta_link || '',
                background_color: sec.background_color || '',
                is_active: active,
                sort_order: sec.sort_order,
            })));
            
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                alert(`Updated with ${errors.length} errors.`);
            }

            await loadSections();
        } catch (err: any) {
            alert('An error occurred: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    function setField<K extends keyof SectionFormData>(key: K, value: SectionFormData[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    function formatType(type: string) {
        return SECTION_TYPES.find(t => t.value === type)?.label || type.replace(/_/g, ' ');
    }

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
                        Homepage Sections
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                        Manage homepage content sections
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                        display: 'flex', background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                    }}>
                        <button
                            onClick={() => toggleAll(true)}
                            disabled={loading || saving}
                            style={{
                                padding: '8px 14px', background: 'transparent', border: 'none',
                                color: 'var(--color-success)', fontSize: 12, fontWeight: 700,
                                cursor: 'pointer', borderRight: '1px solid var(--color-border)',
                                opacity: loading || saving ? 0.5 : 1,
                            }}
                        >
                            ENABLE ALL
                        </button>
                        <button
                            onClick={() => toggleAll(false)}
                            disabled={loading || saving}
                            style={{
                                padding: '8px 14px', background: 'transparent', border: 'none',
                                color: 'var(--color-error)', fontSize: 12, fontWeight: 700,
                                cursor: 'pointer',
                                opacity: loading || saving ? 0.5 : 1,
                            }}
                        >
                            DISABLE ALL
                        </button>
                    </div>
                    <button onClick={openCreate} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', background: 'var(--gradient-accent)',
                        color: '#0a0a0b', borderRadius: 'var(--radius-md)',
                        fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                    }}>
                        <Plus size={16} /> Add Section
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12, marginBottom: 24,
            }}>
                {[
                    { label: 'Total', value: stats.total, icon: Layers, color: 'var(--color-accent)' },
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
                <input type="text" placeholder="Search sections..."
                    value={search} onChange={e => setSearch(e.target.value)}
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
                                {['Title', 'Type', 'Badge', 'Products', 'Status', 'Order', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '12px 16px', textAlign: 'left', fontSize: 12,
                                        fontWeight: 600, color: 'var(--color-text-muted)',
                                        textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} style={{ padding: 16 }}>
                                                <div style={{ height: 16, background: 'var(--color-bg-tertiary)', borderRadius: 4, width: j === 0 ? 140 : 60 }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        <Layers size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No sections found</div>
                                        <div style={{ fontSize: 13 }}>
                                            {search ? 'Try adjusting your search' : 'Create your first section to get started'}
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map(sec => (
                                <tr key={sec.id}
                                    style={{ borderBottom: '1px solid var(--color-border)', transition: 'background var(--transition-fast)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <td style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>{sec.title}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            fontSize: 12, padding: '3px 10px', borderRadius: 'var(--radius-full)',
                                            background: 'var(--color-accent-glow)', color: 'var(--color-accent)',
                                            fontWeight: 600, whiteSpace: 'nowrap',
                                        }}>
                                            {formatType(sec.section_type)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                                        {sec.badge_text || '—'}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Package size={14} style={{ color: 'var(--color-text-muted)' }} />
                                            <span style={{ fontSize: 13 }}>{sec.product_count ?? 0}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(sec)}
                                                style={{
                                                    width: 36, height: 20, borderRadius: 10, border: 'none',
                                                    background: sec.is_active ? 'var(--color-success, #22c55e)' : 'var(--color-bg-tertiary, #2a2a2d)',
                                                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                                    padding: 0,
                                                }}
                                            >
                                                <div style={{
                                                    width: 14, height: 14, borderRadius: '50%', background: '#fff',
                                                    position: 'absolute', top: 3,
                                                    left: sec.is_active ? 19 : 3, transition: 'left 0.2s',
                                                }} />
                                            </button>
                                            <span style={{
                                                fontSize: 13, fontWeight: 500,
                                                color: sec.is_active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                            }}>
                                                {sec.is_active ? 'Active' : 'Hidden'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                        {sec.sort_order}
                                    </td>
                                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => openEdit(sec)} style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                                                color: 'var(--color-text-secondary)', cursor: 'pointer',
                                            }} title="Edit"><Edit2 size={14} /></button>
                                            <button onClick={() => setDeleteTarget(sec)} style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                                color: 'var(--color-error)', cursor: 'pointer',
                                            }} title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 24,
                }}>
                    <div style={{
                        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)', padding: 32,
                        maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                                {editId ? 'Edit Section' : 'New Section'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} style={{
                                background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4,
                            }}><X size={18} /></button>
                        </div>

                        {formError && (
                            <div style={{
                                padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                color: 'var(--color-error)', fontSize: 13,
                            }}>{formError}</div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {/* Type */}
                            <div>
                                <label style={labelStyle}>Section Type *</label>
                                <select value={form.section_type}
                                    onChange={e => setField('section_type', e.target.value)}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    {SECTION_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label style={labelStyle}>Title *</label>
                                <input value={form.title} onChange={e => setField('title', e.target.value)}
                                    placeholder="e.g. Best Sellers Across Brands" style={inputStyle} />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label style={labelStyle}>Subtitle</label>
                                <input value={form.subtitle} onChange={e => setField('subtitle', e.target.value)}
                                    placeholder="Section subtitle" style={inputStyle} />
                            </div>

                            {/* Badge Text */}
                            <div>
                                <label style={labelStyle}>Badge Text</label>
                                <input value={form.badge_text} onChange={e => setField('badge_text', e.target.value)}
                                    placeholder="🔥 Most Loved" style={inputStyle} />
                            </div>

                            {/* CTA row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>CTA Text</label>
                                    <input value={form.cta_text} onChange={e => setField('cta_text', e.target.value)}
                                        placeholder="View All" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>CTA Link</label>
                                    <input value={form.cta_link} onChange={e => setField('cta_link', e.target.value)}
                                        placeholder="/shop?category=best-sellers" style={inputStyle} />
                                </div>
                            </div>

                            {/* Sort order + bg color */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Sort Order</label>
                                    <input type="number" value={form.sort_order}
                                        onChange={e => setField('sort_order', parseInt(e.target.value) || 0)}
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Background Color</label>
                                    <input value={form.background_color}
                                        onChange={e => setField('background_color', e.target.value)}
                                        placeholder="#1a1a1d" style={inputStyle} />
                                </div>
                            </div>

                            {/* Active toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button type="button" onClick={() => setField('is_active', !form.is_active)}
                                    style={{
                                        width: 44, height: 24, borderRadius: 12, border: 'none',
                                        background: form.is_active ? 'var(--color-success, #22c55e)' : 'var(--color-bg-tertiary, #2a2a2d)',
                                        cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                    }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                        position: 'absolute', top: 3,
                                        left: form.is_active ? 23 : 3, transition: 'left 0.2s',
                                    }} />
                                </button>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>
                                    {form.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
                            <button onClick={() => setModalOpen(false)} style={{
                                padding: '9px 18px', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)', background: 'transparent',
                                color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving} style={{
                                padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none',
                                background: 'var(--gradient-accent)', color: '#0a0a0b',
                                fontSize: 14, fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                            }}>
                                {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                                {editId ? 'Save Changes' : 'Create Section'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 24,
                }}>
                    <div style={{
                        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 420, width: '100%',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: 'var(--color-error)' }}>
                                Delete Section
                            </h3>
                            <button onClick={() => setDeleteTarget(null)} style={{
                                background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4,
                            }}><X size={18} /></button>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 8 }}>
                            Are you sure? This will also remove all product assignments for this section.
                        </p>
                        <p style={{
                            fontWeight: 600, fontSize: 14, marginBottom: 24,
                            padding: '10px 14px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)',
                        }}>{deleteTarget.title}</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{
                                padding: '9px 18px', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)', background: 'transparent',
                                color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} style={{
                                padding: '9px 18px', borderRadius: 'var(--radius-md)',
                                border: 'none', background: 'var(--color-error)', color: '#fff',
                                fontSize: 14, fontWeight: 600,
                                cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1,
                            }}>{deleting ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
