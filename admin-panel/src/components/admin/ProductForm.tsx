'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Save, ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp,
    ImageIcon, Tag, Star, Sparkles, Settings, FileText,
    DollarSign, Package as PackageIcon, Search, Layers, Ticket, Upload,
} from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import {
    createProduct, updateProduct, getAdminProductById, getBrandsAndCategories,
    getAvailableCouponsSimple, getProductCoupon, assignProductCoupon,
} from '@/lib/db/adminQueries';
import type { ProductFormData, BrandOption, CategoryOption, SectionOption } from '@/lib/db/adminQueries';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
    productId?: string; // If provided, we are in edit mode
}

// Reusable section collapse state
function useSection(defaultOpen = true) {
    const [open, setOpen] = useState(defaultOpen);
    return { open, toggle: () => setOpen(o => !o) };
}

// ============================================================================
// FORM COMPONENT
// ============================================================================

export default function ProductForm({ productId }: Props) {
    const router = useRouter();
    const isEdit = !!productId;

    // Form state
    const [form, setForm] = useState<ProductFormData>({
        name: '',
        slug: '',
        subtitle: '',
        short_description: '',
        description: '',
        how_to_use: '',
        ingredients: '',
        base_price: 0,
        discount_percent: 0,
        cost_price: null,
        sku: '',
        barcode: '',
        weight_grams: null,
        is_active: true,
        is_featured: false,
        in_stock: true,
        stock_quantity: 0,
        low_stock_threshold: 5,
        meta_title: '',
        meta_description: '',
        tags: [],
        concerns: [],
        brand_id: null,
        category_id: null,
        images: [],
        sizes: [],
        key_benefits: [],
        highlights: [],
        badges: [],
        section_ids: [],
    });

    const [brands, setBrands] = useState<BrandOption[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [sections, setSections] = useState<SectionOption[]>([]);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [uploadingIndices, setUploadingIndices] = useState<{ [key: number]: boolean }>({});
    const [tagsInput, setTagsInput] = useState('');
    const [concernsInput, setConcernsInput] = useState('');

    // Coupon assignment state
    const [availableCoupons, setAvailableCoupons] = useState<{ id: string; code: string }[]>([]);
    const [assignedCouponId, setAssignedCouponId] = useState<string | null>(null);
    const [couponPrice, setCouponPrice] = useState<number | null>(null);

    // Sections
    const basicSection = useSection(true);
    const pricingSection = useSection(true);
    const descSection = useSection(false);
    const inventorySection = useSection(true);
    const imagesSection = useSection(false);
    const sizesSection = useSection(false);
    const benefitsSection = useSection(false);
    const highlightsSection = useSection(false);
    const badgesSection = useSection(false);
    const seoSection = useSection(false);
    const [sectionsDropdownOpen, setSectionsDropdownOpen] = useState(false);

    // Load brands/categories + product data (if editing)
    useEffect(() => {
        async function init() {
            try {
                const { brands: b, categories: c, sections: s } = await getBrandsAndCategories();
                setBrands(b || []);
                setCategories(c || []);
                setSections(s || []);

                // Fetch all active coupons for the dropdown using the MongoDB helper
                const allCoupons = await getAvailableCouponsSimple();
                setAvailableCoupons(allCoupons || []);

                if (productId) {
                    const product = await getAdminProductById(productId);
                    if (product) {
                        setForm({
                            name: product.name,
                            slug: product.slug,
                            subtitle: product.subtitle || '',
                            short_description: product.short_description || '',
                            description: product.description || '',
                            how_to_use: product.how_to_use || '',
                            ingredients: product.ingredients || '',
                            base_price: product.compare_at_price || product.base_price,
                            discount_percent: product.discount_percent,
                            cost_price: product.cost_price,
                            sku: product.sku || '',
                            barcode: product.barcode || '',
                            weight_grams: product.weight_grams,
                            is_active: product.is_active,
                            is_featured: product.is_featured,
                            in_stock: product.in_stock,
                            stock_quantity: product.stock_quantity,
                            low_stock_threshold: product.low_stock_threshold,
                            meta_title: product.meta_title || '',
                            meta_description: product.meta_description || '',
                            tags: product.tags || [],
                            concerns: product.concerns || [],
                            brand_id: product.brand_id,
                            category_id: product.category_id,
                            images: product.images.map(i => ({
                                url: i.url,
                                alt_text: i.alt_text || '',
                                is_primary: i.is_primary,
                                sort_order: i.sort_order,
                            })),
                            sizes: product.sizes.map(s => ({
                                label: s.label,
                                ml_value: s.ml_value || '',
                                price: s.price,
                                sku_suffix: s.sku_suffix || '',
                                stock_quantity: s.stock_quantity,
                                is_default: s.is_default,
                                is_active: s.is_active,
                                sort_order: s.sort_order,
                            })),
                            key_benefits: product.key_benefits.map(b => ({
                                icon_name: b.icon_name,
                                title: b.title,
                                description: b.description,
                                sort_order: b.sort_order,
                            })),
                            highlights: product.highlights.map(h => ({
                                highlight: h.highlight,
                                sort_order: h.sort_order,
                            })),
                            badges: product.badges.map(b => ({
                                badge: b.badge,
                                custom_label: b.custom_label || '',
                                badge_color: b.badge_color || '',
                                is_primary: b.is_primary,
                            })),
                            section_ids: product.section_ids || [],
                        });
                        setTagsInput((product.tags || []).join(', '));
                        setConcernsInput((product.concerns || []).join(', '));

                        // Load assigned coupon for this product using the MongoDB helper
                        const pcRow = await getProductCoupon(productId);
                        if (pcRow) {
                            setAssignedCouponId(pcRow.couponId);
                            setCouponPrice(pcRow.couponPrice);
                        }
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to initialize ProductForm", err);
            }
        }
        init();
    }, [productId]);
 
    // Auto-calculate cost price (selling price) when base price or discount percentage changes
    useEffect(() => {
        const base = form.base_price || 0;
        const discount = form.discount_percent || 0;
        const calculated = Math.round((base * (1 - discount / 100)) * 100) / 100;
        if (form.cost_price !== calculated) {
            setForm(f => ({ ...f, cost_price: calculated }));
        }
    }, [form.base_price, form.discount_percent, form.cost_price]);

    // Auto-slug from name
    function handleNameChange(name: string) {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        setForm(f => ({ ...f, name, slug }));
    }

    // Save
    async function handleSave() {
        if (!form.name.trim()) {
            alert('Product name is required');
            return;
        }
        if (!form.slug.trim()) {
            alert('Product slug is required');
            return;
        }
        if (form.base_price <= 0) {
            alert('Base price must be greater than 0');
            return;
        }

        // Parse tags and concerns
        const finalForm: ProductFormData = {
            ...form,
            tags: tagsInput
                .split(',')
                .map(t => t.trim())
                .filter(Boolean),
            concerns: concernsInput
                .split(',')
                .map(c => c.trim())
                .filter(Boolean),
        };

        setSaving(true);

        try {
            let savedProductId = productId || null;
            if (isEdit && productId) {
                const { error } = await updateProduct(productId, finalForm);
                if (error) {
                    alert('Error: ' + error);
                    setSaving(false);
                    return;
                }
            } else {
                const { id, error } = await createProduct(finalForm);
                if (error || !id) {
                    alert('Error: ' + (error || 'Failed to create product'));
                    setSaving(false);
                    return;
                }
                savedProductId = id;
            }

            // Save coupon assignment using Mongoose helper
            if (savedProductId) {
                await assignProductCoupon(savedProductId, assignedCouponId || null, couponPrice || null);
            }

            router.push('/admin/products');
        } catch (err: any) {
            console.error('Save error:', err);
            alert('An unexpected error occurred: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    }

    // ========================================================================
    // STYLING HELPERS
    // ========================================================================

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-text-primary)',
        fontSize: 14,
        outline: 'none',
        transition: 'border-color var(--transition-fast)',
    };

    const textareaStyle: React.CSSProperties = {
        ...inputStyle,
        minHeight: 100,
        resize: 'vertical' as const,
        fontFamily: 'inherit',
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        appearance: 'none' as const,
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a1a1aa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 10px center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '20px',
        paddingRight: 36,
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        marginBottom: 6,
    };

    const sectionHeaderStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        cursor: 'pointer',
        userSelect: 'none',
    };

    const sectionBodyStyle: React.CSSProperties = {
        padding: '0 20px 20px',
    };

    const cardStyle: React.CSSProperties = {
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 16,
    };

    const gridTwoCol: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
    };

    const addBtnStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 'var(--radius-sm)',
        border: '1px dashed var(--color-border)',
        background: 'transparent',
        color: 'var(--color-accent)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        marginTop: 12,
    };

    const removeBtnStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: 'rgba(239, 68, 68, 0.1)',
        color: 'var(--color-error)',
        cursor: 'pointer',
        flexShrink: 0,
    };

    const toggleStyle = (active: boolean): React.CSSProperties => ({
        width: 44,
        height: 24,
        borderRadius: 12,
        background: active ? 'var(--color-success)' : 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        position: 'relative' as const,
        transition: 'background var(--transition-fast)',
        flexShrink: 0,
    });

    const toggleDotStyle = (active: boolean): React.CSSProperties => ({
        position: 'absolute' as const,
        top: 2,
        left: active ? 21 : 2,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left var(--transition-fast)',
    });

    // ========================================================================
    // SECTION HEADER RENDERER
    // ========================================================================

    function SectionHeader({ icon: Icon, title, section }: { icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>; title: string; section: ReturnType<typeof useSection> }) {
        return (
            <div style={sectionHeaderStyle} onClick={section.toggle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={18} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{title}</span>
                </div>
                {section.open ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
            </div>
        );
    }

    // ========================================================================
    // LOADING STATE
    // ========================================================================

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid var(--color-border)',
                        borderTopColor: 'var(--color-accent)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading product...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 28,
                flexWrap: 'wrap',
                gap: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => router.push('/admin/products')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 800,
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        {isEdit ? 'Edit Product' : 'New Product'}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 24px',
                        background: 'var(--gradient-accent)',
                        color: '#0a0a0b',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 14,
                        fontWeight: 600,
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                    }}
                >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Product'}
                </button>
            </div>

            {/* ─── BASIC INFO ─── */}
            <div style={{ ...cardStyle, overflow: 'visible' }}>
                <SectionHeader icon={PackageIcon} title="Basic Information" section={basicSection} />
                {basicSection.open && (
                    <div style={sectionBodyStyle}>
                        <div style={{ ...gridTwoCol, marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>Product Name *</label>
                                <input
                                    style={inputStyle}
                                    value={form.name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    placeholder="e.g. Anti Dandruff Shampoo"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Slug *</label>
                                <input
                                    style={inputStyle}
                                    value={form.slug}
                                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                    placeholder="auto-generated-from-name"
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Subtitle</label>
                            <input
                                style={inputStyle}
                                value={form.subtitle}
                                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                                placeholder="e.g. 250 ml | For All Hair Types"
                            />
                        </div>
                        <div style={gridTwoCol}>
                            <div>
                                <label style={labelStyle}>Brand</label>
                                <select
                                    style={selectStyle}
                                    value={form.brand_id || ''}
                                    onChange={e => setForm(f => ({ ...f, brand_id: e.target.value || null }))}
                                >
                                    <option value="">Select brand...</option>
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Category</label>
                                <select
                                    style={selectStyle}
                                    value={form.category_id || ''}
                                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value || null }))}
                                >
                                    <option value="">Select category...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.parent_id ? '  └ ' : ''}{c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <label style={labelStyle}>Homepage Sections</label>
                            <div style={{ position: 'relative' }}>
                                <div
                                    onClick={() => setSectionsDropdownOpen(o => !o)}
                                    style={{
                                        ...selectStyle,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        minHeight: 42,
                                    }}
                                >
                                    <span style={{ color: form.section_ids.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                                        {form.section_ids.length > 0
                                            ? `${form.section_ids.length} section${form.section_ids.length > 1 ? 's' : ''} selected`
                                            : 'Select sections...'}
                                    </span>
                                    <ChevronDown size={14} style={{ color: 'var(--color-text-muted)', transform: sectionsDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </div>
                                {sectionsDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 50,
                                        background: 'var(--color-bg-elevated)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        marginTop: 4,
                                        maxHeight: 240,
                                        overflowY: 'auto',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                    }}>
                                        {sections.length === 0 ? (
                                            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No active sections found.</div>
                                        ) : (
                                            sections.map(section => {
                                                const isChecked = form.section_ids.includes(section.id);
                                                return (
                                                    <label
                                                        key={section.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 10,
                                                            padding: '9px 14px',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid var(--color-border)',
                                                            background: isChecked ? 'var(--color-accent-glow)' : 'transparent',
                                                            transition: 'background 0.15s',
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => {
                                                                setForm(f => ({
                                                                    ...f,
                                                                    section_ids: isChecked
                                                                        ? f.section_ids.filter(id => id !== section.id)
                                                                        : [...f.section_ids, section.id],
                                                                }));
                                                            }}
                                                            style={{ width: 15, height: 15, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                                                        />
                                                        <span style={{ fontSize: 13, fontWeight: isChecked ? 600 : 400, color: isChecked ? 'var(--color-accent)' : 'var(--color-text-primary)', flex: 1 }}>
                                                            {section.title}
                                                        </span>
                                                        <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', textTransform: 'capitalize' }}>
                                                            {section.section_type.replace(/_/g, ' ')}
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── PRICING ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={DollarSign} title="Pricing" section={pricingSection} />
                {pricingSection.open && (
                    <div style={sectionBodyStyle}>
                        <div style={gridTwoCol}>
                            <div>
                                <label style={labelStyle}>Base Price (৳) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    style={inputStyle}
                                    value={form.base_price || ''}
                                    onChange={e => setForm(f => ({ ...f, base_price: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Discount %</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    style={inputStyle}
                                    value={form.discount_percent || ''}
                                    onChange={e => setForm(f => ({ ...f, discount_percent: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>
                        <div style={gridTwoCol}>
                            <div>
                                <label style={labelStyle}>Cost Price (৳) (Calculated Selling Price)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
                                    value={form.cost_price ?? ''}
                                    readOnly
                                    placeholder="Auto-calculated"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>SKU</label>
                                <input
                                    style={inputStyle}
                                    value={form.sku}
                                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                                    placeholder="e.g. BA-SHM-001"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── DESCRIPTION ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={FileText} title="Description" section={descSection} />
                {descSection.open && (
                    <div style={sectionBodyStyle}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Short Description</label>
                            <input
                                style={inputStyle}
                                value={form.short_description}
                                onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                                placeholder="One-liner for product cards"
                            />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Full Description</label>
                            <textarea
                                style={textareaStyle}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Detailed product description..."
                            />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>How to Use</label>
                            <textarea
                                style={{ ...textareaStyle, minHeight: 80 }}
                                value={form.how_to_use}
                                onChange={e => setForm(f => ({ ...f, how_to_use: e.target.value }))}
                                placeholder="Usage instructions..."
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Ingredients</label>
                            <textarea
                                style={{ ...textareaStyle, minHeight: 80 }}
                                value={form.ingredients}
                                onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                                placeholder="List of ingredients..."
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ─── INVENTORY ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={Settings} title="Inventory & Status" section={inventorySection} />
                {inventorySection.open && (
                    <div style={sectionBodyStyle}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                            <div>
                                <label style={labelStyle}>Stock Quantity</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={form.stock_quantity}
                                    onChange={e => setForm(f => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Low Stock Threshold</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={form.low_stock_threshold}
                                    onChange={e => setForm(f => ({ ...f, low_stock_threshold: parseInt(e.target.value) || 5 }))}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Weight (grams)</label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    value={form.weight_grams ?? ''}
                                    onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value ? parseInt(e.target.value) : null }))}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                            {/* Toggle: In Stock */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, in_stock: !f.in_stock }))}
                                    style={toggleStyle(form.in_stock)}
                                >
                                    <div style={toggleDotStyle(form.in_stock)} />
                                </button>
                                <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>In Stock</span>
                            </div>
                            {/* Toggle: Active */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                    style={toggleStyle(form.is_active)}
                                >
                                    <div style={toggleDotStyle(form.is_active)} />
                                </button>
                                <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Active</span>
                            </div>
                            {/* Toggle: Featured */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                                    style={toggleStyle(form.is_featured)}
                                >
                                    <div style={toggleDotStyle(form.is_featured)} />
                                </button>
                                <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Featured</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── IMAGES ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={ImageIcon} title={`Images (${form.images.length})`} section={imagesSection} />
                {imagesSection.open && (
                    <div style={sectionBodyStyle}>
                        {form.images.map((img, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center',
                                marginBottom: 12,
                                padding: 12,
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                            }}>
                                <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 300px' }}>
                                        <input
                                            style={{ ...inputStyle, flex: 1 }}
                                            value={img.url}
                                            onChange={e => {
                                                const updated = [...form.images];
                                                updated[i] = { ...updated[i], url: e.target.value };
                                                setForm(f => ({ ...f, images: updated }));
                                            }}
                                            placeholder="Image URL"
                                        />
                                        <label style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '10px 14px',
                                            background: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'var(--color-text-secondary)',
                                            cursor: uploadingIndices[i] ? 'not-allowed' : 'pointer',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            transition: 'all var(--transition-fast)',
                                            opacity: uploadingIndices[i] ? 0.7 : 1,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            <Upload size={14} />
                                            {uploadingIndices[i] ? 'Uploading...' : 'Upload'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={uploadingIndices[i]}
                                                style={{ display: 'none' }}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setUploadingIndices(prev => ({ ...prev, [i]: true }));
                                                    try {
                                                        const url = await uploadFile(file);
                                                        const updated = [...form.images];
                                                        updated[i] = { ...updated[i], url };
                                                        setForm(f => ({ ...f, images: updated }));
                                                    } catch (err: any) {
                                                        alert(err.message || 'Upload failed');
                                                    } finally {
                                                        setUploadingIndices(prev => ({ ...prev, [i]: false }));
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <input
                                        style={{ ...inputStyle, flex: '1 1 150px' }}
                                        value={img.alt_text}
                                        onChange={e => {
                                            const updated = [...form.images];
                                            updated[i] = { ...updated[i], alt_text: e.target.value };
                                            setForm(f => ({ ...f, images: updated }));
                                        }}
                                        placeholder="Alt text"
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = form.images.map((im, idx) => ({
                                                ...im,
                                                is_primary: idx === i,
                                            }));
                                            setForm(f => ({ ...f, images: updated }));
                                        }}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid',
                                            borderColor: img.is_primary ? 'var(--color-accent)' : 'var(--color-border)',
                                            background: img.is_primary ? 'var(--color-accent-glow)' : 'transparent',
                                            color: img.is_primary ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {img.is_primary ? '★ Primary' : 'Set Primary'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                                        style={removeBtnStyle}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setForm(f => ({
                                ...f,
                                images: [...f.images, { url: '', alt_text: '', is_primary: f.images.length === 0, sort_order: f.images.length }],
                            }))}
                            style={addBtnStyle}
                        >
                            <Plus size={14} /> Add Image
                        </button>
                    </div>
                )}
            </div>

            {/* ─── SIZES ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={Tag} title={`Sizes / Variants (${form.sizes.length})`} section={sizesSection} />
                {sizesSection.open && (
                    <div style={sectionBodyStyle}>
                        {form.sizes.map((size, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                                marginBottom: 12,
                                padding: 12,
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                flexWrap: 'wrap',
                            }}>
                                <input
                                    style={{ ...inputStyle, flex: '0 0 100px' }}
                                    value={size.label}
                                    onChange={e => {
                                        const updated = [...form.sizes];
                                        updated[i] = { ...updated[i], label: e.target.value };
                                        setForm(f => ({ ...f, sizes: updated }));
                                    }}
                                    placeholder="Label"
                                />
                                <input
                                    style={{ ...inputStyle, flex: '0 0 80px' }}
                                    value={size.ml_value}
                                    onChange={e => {
                                        const updated = [...form.sizes];
                                        updated[i] = { ...updated[i], ml_value: e.target.value };
                                        setForm(f => ({ ...f, sizes: updated }));
                                    }}
                                    placeholder="ml value"
                                />
                                <input
                                    type="number"
                                    style={{ ...inputStyle, flex: '0 0 90px' }}
                                    value={size.price || ''}
                                    onChange={e => {
                                        const updated = [...form.sizes];
                                        updated[i] = { ...updated[i], price: parseFloat(e.target.value) || 0 };
                                        setForm(f => ({ ...f, sizes: updated }));
                                    }}
                                    placeholder="Price"
                                />
                                <input
                                    type="number"
                                    style={{ ...inputStyle, flex: '0 0 80px' }}
                                    value={size.stock_quantity || ''}
                                    onChange={e => {
                                        const updated = [...form.sizes];
                                        updated[i] = { ...updated[i], stock_quantity: parseInt(e.target.value) || 0 };
                                        setForm(f => ({ ...f, sizes: updated }));
                                    }}
                                    placeholder="Stock"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = form.sizes.map((s, idx) => ({ ...s, is_default: idx === i }));
                                        setForm(f => ({ ...f, sizes: updated }));
                                    }}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid',
                                        borderColor: size.is_default ? 'var(--color-accent)' : 'var(--color-border)',
                                        background: size.is_default ? 'var(--color-accent-glow)' : 'transparent',
                                        color: size.is_default ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {size.is_default ? '★ Default' : 'Default'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }))}
                                    style={removeBtnStyle}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setForm(f => ({
                                ...f,
                                sizes: [...f.sizes, { label: '', ml_value: '', price: 0, sku_suffix: '', stock_quantity: 0, is_default: f.sizes.length === 0, is_active: true, sort_order: f.sizes.length }],
                            }))}
                            style={addBtnStyle}
                        >
                            <Plus size={14} /> Add Size
                        </button>
                    </div>
                )}
            </div>

            {/* ─── KEY BENEFITS ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={Star} title={`Key Benefits (${form.key_benefits.length})`} section={benefitsSection} />
                {benefitsSection.open && (
                    <div style={sectionBodyStyle}>
                        {form.key_benefits.map((b, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                                marginBottom: 12,
                                padding: 12,
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                flexWrap: 'wrap',
                            }}>
                                <input
                                    style={{ ...inputStyle, flex: '0 0 100px' }}
                                    value={b.icon_name}
                                    onChange={e => {
                                        const updated = [...form.key_benefits];
                                        updated[i] = { ...updated[i], icon_name: e.target.value };
                                        setForm(f => ({ ...f, key_benefits: updated }));
                                    }}
                                    placeholder="Icon name"
                                />
                                <input
                                    style={{ ...inputStyle, flex: '1 1 150px' }}
                                    value={b.title}
                                    onChange={e => {
                                        const updated = [...form.key_benefits];
                                        updated[i] = { ...updated[i], title: e.target.value };
                                        setForm(f => ({ ...f, key_benefits: updated }));
                                    }}
                                    placeholder="Title"
                                />
                                <input
                                    style={{ ...inputStyle, flex: '2 1 200px' }}
                                    value={b.description}
                                    onChange={e => {
                                        const updated = [...form.key_benefits];
                                        updated[i] = { ...updated[i], description: e.target.value };
                                        setForm(f => ({ ...f, key_benefits: updated }));
                                    }}
                                    placeholder="Description"
                                />
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, key_benefits: f.key_benefits.filter((_, idx) => idx !== i) }))}
                                    style={removeBtnStyle}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setForm(f => ({
                                ...f,
                                key_benefits: [...f.key_benefits, { icon_name: '', title: '', description: '', sort_order: f.key_benefits.length }],
                            }))}
                            style={addBtnStyle}
                        >
                            <Plus size={14} /> Add Benefit
                        </button>
                    </div>
                )}
            </div>

            {/* ─── HIGHLIGHTS ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={Sparkles} title={`Highlights (${form.highlights.length})`} section={highlightsSection} />
                {highlightsSection.open && (
                    <div style={sectionBodyStyle}>
                        {form.highlights.map((h, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                                marginBottom: 8,
                            }}>
                                <input
                                    style={{ ...inputStyle, flex: 1 }}
                                    value={h.highlight}
                                    onChange={e => {
                                        const updated = [...form.highlights];
                                        updated[i] = { ...updated[i], highlight: e.target.value };
                                        setForm(f => ({ ...f, highlights: updated }));
                                    }}
                                    placeholder="e.g. Reduces Dandruff Up To 100%"
                                />
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, highlights: f.highlights.filter((_, idx) => idx !== i) }))}
                                    style={removeBtnStyle}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setForm(f => ({
                                ...f,
                                highlights: [...f.highlights, { highlight: '', sort_order: f.highlights.length }],
                            }))}
                            style={addBtnStyle}
                        >
                            <Plus size={14} /> Add Highlight
                        </button>
                    </div>
                )}
            </div>

            {/* ─── BADGES ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={Tag} title={`Badges (${form.badges.length})`} section={badgesSection} />
                {badgesSection.open && (
                    <div style={sectionBodyStyle}>
                        {form.badges.map((b, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                                marginBottom: 12,
                                padding: 12,
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                flexWrap: 'wrap',
                            }}>
                                <select
                                    style={{ ...selectStyle, flex: '0 0 140px' }}
                                    value={b.badge}
                                    onChange={e => {
                                        const updated = [...form.badges];
                                        updated[i] = { ...updated[i], badge: e.target.value };
                                        setForm(f => ({ ...f, badges: updated }));
                                    }}
                                >
                                    <option value="">Select type...</option>
                                    {['BEST SELLER', 'NEW LAUNCH', 'TRENDING', 'SELLING FAST', 'PREMIUM', 'SALE', 'LIMITED EDITION'].map(bt => (
                                        <option key={bt} value={bt}>{bt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                    ))}
                                </select>
                                <input
                                    style={{ ...inputStyle, flex: '1 1 120px' }}
                                    value={b.custom_label}
                                    onChange={e => {
                                        const updated = [...form.badges];
                                        updated[i] = { ...updated[i], custom_label: e.target.value };
                                        setForm(f => ({ ...f, badges: updated }));
                                    }}
                                    placeholder="Custom label"
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 150px' }}>
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 'var(--radius-sm)',
                                            border: '2px solid var(--color-border)',
                                            background: b.badge_color && /^#([0-9A-Fa-f]{3}){1,2}$/.test(b.badge_color) ? b.badge_color : '#f0c14b',
                                            flexShrink: 0,
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        title="Click to pick color"
                                    >
                                        <input
                                            type="color"
                                            value={b.badge_color && /^#([0-9A-Fa-f]{3}){1,2}$/.test(b.badge_color) ? b.badge_color : '#f0c14b'}
                                            onChange={e => {
                                                const updated = [...form.badges];
                                                updated[i] = { ...updated[i], badge_color: e.target.value };
                                                setForm(f => ({ ...f, badges: updated }));
                                            }}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                cursor: 'pointer',
                                                border: 'none',
                                                padding: 0,
                                            }}
                                        />
                                    </div>
                                    <input
                                        style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                                        value={b.badge_color}
                                        onChange={e => {
                                            const updated = [...form.badges];
                                            updated[i] = { ...updated[i], badge_color: e.target.value };
                                            setForm(f => ({ ...f, badges: updated }));
                                        }}
                                        placeholder="#hex color"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, badges: f.badges.filter((_, idx) => idx !== i) }))}
                                    style={removeBtnStyle}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setForm(f => ({
                                ...f,
                                badges: [...f.badges, { badge: '', custom_label: '', badge_color: '', is_primary: true }],
                            }))}
                            style={addBtnStyle}
                        >
                            <Plus size={14} /> Add Badge
                        </button>
                    </div>
                )}
            </div>


            {/* ─── COUPON ASSIGNMENT ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={Ticket} title={`Promo Coupon${assignedCouponId ? ' ✓' : ''}`} section={{ open: true, toggle: () => { } }} />
                <div style={sectionBodyStyle}>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                        Assign a coupon to show on the product detail page. Leave empty for no coupon display.
                    </p>
                    <div style={gridTwoCol}>
                        <div>
                            <label style={labelStyle}>Coupon Code</label>
                            <select
                                style={selectStyle}
                                value={assignedCouponId || ''}
                                onChange={e => {
                                    const id = e.target.value || null;
                                    setAssignedCouponId(id);
                                    if (!id) setCouponPrice(null);
                                }}
                            >
                                <option value="">None (no coupon)</option>
                                {availableCoupons.map(c => (
                                    <option key={c.id} value={c.id}>{c.code}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Coupon Price (৳)</label>
                            <input
                                type="number"
                                step="0.01"
                                style={inputStyle}
                                value={couponPrice ?? ''}
                                onChange={e => setCouponPrice(e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="Price after coupon"
                                disabled={!assignedCouponId}
                            />
                        </div>
                    </div>
                </div>
            </div>


            {/* ─── TAGS & CONCERNS ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={Tag} title="Tags & Concerns" section={{ open: true, toggle: () => { } }} />
                <div style={sectionBodyStyle}>
                    <div style={gridTwoCol}>
                        <div>
                            <label style={labelStyle}>Tags (comma-separated)</label>
                            <input
                                style={inputStyle}
                                value={tagsInput}
                                onChange={e => setTagsInput(e.target.value)}
                                placeholder="e.g. hair-care, dandruff, shampoo"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Concerns (comma-separated)</label>
                            <input
                                style={inputStyle}
                                value={concernsInput}
                                onChange={e => setConcernsInput(e.target.value)}
                                placeholder="e.g. dandruff, hair-fall, acne"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── SEO ─── */}
            <div style={cardStyle}>
                <SectionHeader icon={Search} title="SEO" section={seoSection} />
                {seoSection.open && (
                    <div style={sectionBodyStyle}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Meta Title</label>
                            <input
                                style={inputStyle}
                                value={form.meta_title}
                                onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                                placeholder="Page title for search engines"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Meta Description</label>
                            <textarea
                                style={{ ...textareaStyle, minHeight: 70 }}
                                value={form.meta_description}
                                onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                                placeholder="Page description for search engines"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Save */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                paddingTop: 16,
                paddingBottom: 32,
            }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 32px',
                        background: 'var(--gradient-accent)',
                        color: '#0a0a0b',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 15,
                        fontWeight: 600,
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                    }}
                >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Product'}
                </button>
            </div>
        </div>
    );
}
