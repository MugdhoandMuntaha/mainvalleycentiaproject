'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Plus, Search, Edit2, Trash2, X, Loader2,
    ChevronDown, ChevronRight, ExternalLink,
    Navigation2, Star, Tag, Link2,
} from 'lucide-react';
import {
    getAdminNavLinks, createNavLink, updateNavLink, deleteNavLink,
    getBrandsAndCategories,
} from '@/lib/db/adminQueries';
import type { AdminNavLink, NavLinkFormData, CategoryOption } from '@/lib/db/adminQueries';

const emptyForm: NavLinkFormData = {
    parent_id: null, label: '', href: '#',
    highlight: false, is_active: true, sort_order: 0,
    linked_category_id: null,
};

type LinkMode = 'manual' | 'category';

export default function AdminNavigationPage() {
    const [links, setLinks] = useState<AdminNavLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<NavLinkFormData>({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [linkMode, setLinkMode] = useState<LinkMode>('manual');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [categories, setCategories] = useState<CategoryOption[]>([]);

    const [deleteTarget, setDeleteTarget] = useState<AdminNavLink | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadLinks();
        getBrandsAndCategories().then(({ categories: cats }) => {
            setCategories(cats);
        });
    }, []);

    async function loadLinks() {
        setLoading(true);
        const data = await getAdminNavLinks();
        setLinks(data);
        setExpandedParents(new Set(data.map(l => l.id)));
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return links;
        const q = search.toLowerCase();
        return links.filter(l =>
            l.label.toLowerCase().includes(q) ||
            l.href.toLowerCase().includes(q) ||
            l.children?.some(c => c.label.toLowerCase().includes(q) || c.href.toLowerCase().includes(q))
        );
    }, [links, search]);

    const stats = useMemo(() => {
        const total = links.reduce((sum, l) => sum + 1 + (l.children?.length || 0), 0);
        const topLevel = links.length;
        const withCategory = links.filter(l => l.linked_category_id).length;
        return { total, topLevel, withCategory };
    }, [links]);

    // Build category tree (parents with their children)
    const categoryTree = useMemo(() => {
        const parents = categories.filter(c => !c.parent_id);
        const children = categories.filter(c => c.parent_id);
        return parents.map(p => ({
            ...p,
            children: children.filter(c => c.parent_id === p.id),
        }));
    }, [categories]);

    function openCreate(parentId: string | null = null) {
        setEditId(null);
        setForm({ ...emptyForm, parent_id: parentId });
        setLinkMode('manual');
        setSelectedCategoryId('');
        setFormError('');
        setModalOpen(true);
    }

    function openEdit(link: AdminNavLink) {
        setEditId(link.id);
        setForm({
            parent_id: link.parent_id,
            label: link.label,
            href: link.href,
            highlight: link.highlight,
            is_active: link.is_active,
            sort_order: link.sort_order,
            linked_category_id: link.linked_category_id,
        });
        setLinkMode('manual');
        setSelectedCategoryId('');
        setFormError('');
        setModalOpen(true);
    }

    function handleCategorySelect(catId: string) {
        setSelectedCategoryId(catId);
        const cat = categories.find(c => c.id === catId);
        if (cat) {
            setForm(prev => ({
                ...prev,
                label: cat.name,
                href: `/shop?category=${cat.slug}`,
            }));
        }
    }

    function handleLinkedCategoryChange(catId: string) {
        setForm(prev => ({
            ...prev,
            linked_category_id: catId || null,
        }));
    }

    async function handleSave() {
        if (!form.label.trim()) { setFormError('Label is required'); return; }
        if (!form.href.trim()) { setFormError('Link URL is required'); return; }
        setSaving(true);
        setFormError('');

        try {
            if (editId) {
                const { error } = await updateNavLink(editId, form);
                if (error) { setFormError(error); return; }
            } else {
                const { error } = await createNavLink(form);
                if (error) { setFormError(error); return; }
            }

            setModalOpen(false);
            await loadLinks();
        } catch (err: any) {
            setFormError(err.message || 'An error occurred while saving');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await deleteNavLink(deleteTarget.id);
        if (error) { alert('Error deleting: ' + error); }
        setDeleting(false);
        setDeleteTarget(null);
        await loadLinks();
    }

    async function toggleActive(link: AdminNavLink) {
        const nextActive = !link.is_active;
        // Optimistic update
        setLinks(prev => {
            const updateItem = (item: AdminNavLink): AdminNavLink => {
                if (item.id === link.id) return { ...item, is_active: nextActive };
                if (item.children) return { ...item, children: item.children.map(updateItem) };
                return item;
            };
            return prev.map(updateItem);
        });

        const { error } = await updateNavLink(link.id, {
            parent_id: link.parent_id,
            label: link.label,
            href: link.href,
            highlight: link.highlight,
            is_active: nextActive,
            sort_order: link.sort_order,
            linked_category_id: link.linked_category_id,
        });

        if (error) {
            alert('Error updating status: ' + error);
            await loadLinks(); // Revert on error
        }
    }

    async function toggleAll(active: boolean) {
        if (!confirm(`Are you sure you want to ${active ? 'enable' : 'disable'} ALL navigation links?`)) return;
        
        setSaving(true);
        // We need to flat map all links to update them
        const allLinks: { id: string, data: NavLinkFormData }[] = [];
        const process = (l: AdminNavLink) => {
            allLinks.push({
                id: l.id,
                data: {
                    parent_id: l.parent_id,
                    label: l.label,
                    href: l.href,
                    highlight: l.highlight,
                    is_active: active,
                    sort_order: l.sort_order,
                    linked_category_id: l.linked_category_id,
                }
            });
            l.children?.forEach(process);
        };
        links.forEach(process);

        // Run updates in parallel
        const results = await Promise.all(allLinks.map(l => updateNavLink(l.id, l.data)));
        const errors = results.filter(r => r.error);
        
        if (errors.length > 0) {
            alert(`Updated with ${errors.length} errors.`);
        }

        await loadLinks();
        setSaving(false);
    }

    function setField<K extends keyof NavLinkFormData>(key: K, value: NavLinkFormData[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    function toggleExpand(id: string) {
        setExpandedParents(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const parentOptions = links.map(l => ({ id: l.id, label: l.label }));

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

    function renderLinkRow(link: AdminNavLink, isChild = false) {
        const hasChildren = (link.children?.length || 0) > 0;
        const isExpanded = expandedParents.has(link.id);

        return (
            <React.Fragment key={link.id}>
                <tr
                    style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    {/* Label */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: isChild ? 32 : 0 }}>
                            {!isChild && hasChildren && (
                                <button
                                    onClick={() => toggleExpand(link.id)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-text-muted)', padding: 2,
                                        display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            )}
                            {isChild && (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>└</span>
                            )}
                            <span style={{ fontWeight: isChild ? 400 : 600, fontSize: isChild ? 13 : 14 }}>
                                {link.label}
                            </span>
                            {link.highlight && (
                                <Star size={12} fill="var(--color-accent)" stroke="var(--color-accent)" />
                            )}
                        </div>
                    </td>

                    {/* URL */}
                    <td style={{ padding: '12px 16px' }}>
                        <span style={{
                            fontSize: 12, color: 'var(--color-text-muted)',
                            fontFamily: 'monospace', background: 'var(--color-bg-tertiary)',
                            padding: '2px 8px', borderRadius: 4,
                        }}>
                            {link.href}
                        </span>
                    </td>

                    {/* Linked Category */}
                    <td style={{ padding: '12px 16px' }}>
                        {!isChild && link.linked_category_id ? (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 12, fontWeight: 500, color: '#22c55e',
                                background: 'rgba(34, 197, 94, 0.1)',
                                padding: '3px 10px', borderRadius: 12,
                            }}>
                                <Link2 size={11} />
                                {link.linked_category_name || 'Linked'}
                            </span>
                        ) : !isChild ? (
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>
                        ) : null}
                    </td>

                    {/* Items count */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {!isChild && hasChildren ? (
                            <span style={{ fontSize: 13 }}>{link.children!.length} items</span>
                        ) : !isChild ? (
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>
                        ) : null}
                    </td>

                    {/* Status Toggle */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                                type="button"
                                onClick={() => toggleActive(link)}
                                style={{
                                    width: 36, height: 20, borderRadius: 10, border: 'none',
                                    background: link.is_active ? 'var(--color-success, #22c55e)' : 'var(--color-bg-tertiary, #2a2a2d)',
                                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                    padding: 0,
                                }}
                            >
                                <div style={{
                                    width: 14, height: 14, borderRadius: '50%', background: '#fff',
                                    position: 'absolute', top: 3,
                                    left: link.is_active ? 19 : 3, transition: 'left 0.2s',
                                }} />
                            </button>
                            <span style={{
                                fontSize: 13, fontWeight: 500,
                                color: link.is_active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                            }}>
                                {link.is_active ? 'Active' : 'Hidden'}
                            </span>
                        </div>
                    </td>

                    {/* Order */}
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        {link.sort_order}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {!isChild && (
                                <button onClick={() => openCreate(link.id)} title="Add dropdown item" style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                                    color: 'var(--color-accent)', cursor: 'pointer',
                                }}><Plus size={14} /></button>
                            )}
                            <button onClick={() => openEdit(link)} title="Edit" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)', cursor: 'pointer',
                            }}><Edit2 size={14} /></button>
                            <button onClick={() => setDeleteTarget(link)} title="Delete" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: 'var(--color-error)', cursor: 'pointer',
                            }}><Trash2 size={14} /></button>
                        </div>
                    </td>
                </tr>

                {/* Children rows */}
                {!isChild && isExpanded && link.children?.map(child => renderLinkRow(child, true))}
            </React.Fragment>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 24, flexWrap: 'wrap', gap: 16,
            }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        Navigation Links
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                        Manage header navigation items and dropdown menus
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
                    <button onClick={() => openCreate(null)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', background: 'var(--gradient-accent)',
                        color: '#0a0a0b', borderRadius: 'var(--radius-md)',
                        fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                    }}>
                        <Plus size={16} /> Add Link
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12, marginBottom: 24,
            }}>
                {[
                    { label: 'Total Items', value: stats.total, icon: Navigation2, color: 'var(--color-accent)' },
                    { label: 'Top Level', value: stats.topLevel, icon: ExternalLink, color: 'var(--color-success)' },
                    { label: 'Linked to Category', value: stats.withCategory, icon: Link2, color: '#818cf8' },
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
                <input type="text" placeholder="Search links..."
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
                                {['Label', 'URL', 'Category', 'Dropdown', 'Status', 'Order', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '12px 16px', textAlign: h === 'Dropdown' || h === 'Order' ? 'center' : 'left',
                                        fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)',
                                        textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} style={{ padding: 16 }}>
                                                <div style={{ height: 16, background: 'var(--color-bg-tertiary)', borderRadius: 4, width: j === 0 ? 140 : 80 }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        <Navigation2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No links found</div>
                                        <div style={{ fontSize: 13 }}>
                                            {search ? 'Try adjusting your search' : 'Add your first navigation link'}
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map(link => renderLinkRow(link))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ──────────── Create / Edit Modal ──────────── */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 24,
                }}>
                    <div style={{
                        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)', padding: 32,
                        maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                                {editId ? 'Edit Link' : form.parent_id ? 'Add Dropdown Item' : 'New Link'}
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
                            {/* Parent selector */}
                            <div>
                                <label style={labelStyle}>Parent (leave empty for top-level)</label>
                                <select
                                    value={form.parent_id || ''}
                                    onChange={e => setField('parent_id', e.target.value || null)}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    <option value="">— Top Level —</option>
                                    {parentOptions.map(p => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ── Link Mode Toggle: Manual vs Category ── */}
                            <div>
                                <label style={labelStyle}>Fill From</label>
                                <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius-md, 8px)', overflow: 'hidden', border: '1px solid var(--color-border, #2a2a2d)' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setLinkMode('manual'); setSelectedCategoryId(''); }}
                                        style={{
                                            flex: 1, padding: '9px 14px', border: 'none', cursor: 'pointer',
                                            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            background: linkMode === 'manual' ? 'var(--color-accent, #f5c518)' : 'var(--color-bg-tertiary, #1a1a1d)',
                                            color: linkMode === 'manual' ? '#0a0a0b' : 'var(--color-text-muted, #71717a)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <Edit2 size={13} /> Manual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLinkMode('category')}
                                        style={{
                                            flex: 1, padding: '9px 14px', border: 'none', cursor: 'pointer',
                                            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            borderLeft: '1px solid var(--color-border, #2a2a2d)',
                                            background: linkMode === 'category' ? 'var(--color-accent, #f5c518)' : 'var(--color-bg-tertiary, #1a1a1d)',
                                            color: linkMode === 'category' ? '#0a0a0b' : 'var(--color-text-muted, #71717a)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <Tag size={13} /> From Category
                                    </button>
                                </div>
                            </div>

                            {/* ── Category Picker (fill label/href from category) ── */}
                            {linkMode === 'category' && (
                                <div>
                                    <label style={labelStyle}>Pick Category (fills Label &amp; URL)</label>
                                    <select
                                        value={selectedCategoryId}
                                        onChange={e => handleCategorySelect(e.target.value)}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        <option value="">— Pick a category —</option>
                                        {categoryTree.map(parent => (
                                            <React.Fragment key={parent.id}>
                                                <option value={parent.id} style={{ fontWeight: 'bold' }}>
                                                    {parent.name}
                                                </option>
                                                {parent.children.map(child => (
                                                    <option key={child.id} value={child.id}>
                                                        &nbsp;&nbsp;└ {child.name}
                                                    </option>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </select>
                                    {selectedCategoryId && (
                                        <div style={{
                                            marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm, 6px)',
                                            background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)',
                                            fontSize: 12, color: 'var(--color-success, #22c55e)',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            <Tag size={12} />
                                            Auto-filled: <strong>{form.label}</strong> → <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 3 }}>{form.href}</code>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Label */}
                            <div>
                                <label style={labelStyle}>Label *</label>
                                <input value={form.label} onChange={e => setField('label', e.target.value)}
                                    placeholder="e.g. Best Sellers" style={inputStyle} />
                            </div>

                            {/* URL */}
                            <div>
                                <label style={labelStyle}>URL *</label>
                                <input value={form.href} onChange={e => setField('href', e.target.value)}
                                    placeholder="/shop?category=best-sellers" style={inputStyle} />
                            </div>

                            {/* ── Link to Category (for dropdown auto-population) ── */}
                            {!form.parent_id && (
                                <div>
                                    <label style={labelStyle}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Link2 size={12} /> Link to Category (auto-populate dropdown)
                                        </span>
                                    </label>
                                    <select
                                        value={form.linked_category_id || ''}
                                        onChange={e => handleLinkedCategoryChange(e.target.value)}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        <option value="">— None (manual dropdown items) —</option>
                                        {categoryTree.map(parent => (
                                            <option key={parent.id} value={parent.id}>
                                                {parent.name} ({parent.children.length} sub-categories)
                                            </option>
                                        ))}
                                    </select>
                                    <p style={{
                                        fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6,
                                        lineHeight: 1.5,
                                    }}>
                                        When linked to a parent category, the dropdown items will automatically show all
                                        sub-categories. Adding a new sub-category will instantly update the nav.
                                    </p>
                                    {form.linked_category_id && (
                                        <div style={{
                                            marginTop: 8, padding: '10px 14px', borderRadius: 'var(--radius-sm, 6px)',
                                            background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.2)',
                                            fontSize: 12, color: '#818cf8',
                                        }}>
                                            <strong>Linked!</strong> Dropdown items for this nav link will be auto-populated from
                                            the sub-categories of <strong>{categories.find(c => c.id === form.linked_category_id)?.name}</strong>.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sort order + highlight */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Sort Order</label>
                                    <input type="number" value={form.sort_order}
                                        onChange={e => setField('sort_order', parseInt(e.target.value) || 0)}
                                        style={inputStyle} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 2 }}>
                                        <button type="button" onClick={() => setField('highlight', !form.highlight)}
                                            style={{
                                                width: 44, height: 24, borderRadius: 12, border: 'none',
                                                background: form.highlight ? '#f5c518' : 'var(--color-bg-tertiary, #2a2a2d)',
                                                cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                            }}>
                                            <div style={{
                                                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                                position: 'absolute', top: 3,
                                                left: form.highlight ? 23 : 3, transition: 'left 0.2s',
                                            }} />
                                        </button>
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>Highlight</span>
                                    </div>
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
                                {editId ? 'Save Changes' : 'Create Link'}
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
                                Delete Link
                            </h3>
                            <button onClick={() => setDeleteTarget(null)} style={{
                                background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4,
                            }}><X size={18} /></button>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 8 }}>
                            Are you sure? {!deleteTarget.parent_id && (deleteTarget.children?.length || 0) > 0
                                ? 'This will also delete all dropdown items under it.'
                                : 'This action cannot be undone.'}
                        </p>
                        <p style={{
                            fontWeight: 600, fontSize: 14, marginBottom: 24,
                            padding: '10px 14px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)',
                        }}>{deleteTarget.label}</p>
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
