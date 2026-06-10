"use server";

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Brand from '@/lib/models/Brand';
import Category from '@/lib/models/Category';
import HomepageSection from '@/lib/models/HomepageSection';
import HeroSlide from '@/lib/models/HeroSlide';
import Coupon from '@/lib/models/Coupon';
import NavLink from '@/lib/models/NavLink';
import VisibleChange from '@/lib/models/VisibleChange';
import SiteSetting from '@/lib/models/SiteSetting';
import AboutContent from '@/lib/models/AboutContent';
import ProductCoupon from '@/lib/models/ProductCoupon';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminProduct {
    id: string;
    name: string;
    slug: string;
    subtitle: string | null;
    short_description: string | null;
    description: string | null;
    how_to_use: string | null;
    ingredients: string | null;
    base_price: number;
    compare_at_price: number | null;
    discount_percent: number;
    cost_price: number | null;
    sku: string | null;
    barcode: string | null;
    weight_grams: number | null;
    is_active: boolean;
    is_featured: boolean;
    in_stock: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    rating_avg: number;
    review_count: number;
    meta_title: string | null;
    meta_description: string | null;
    tags: string[] | null;
    concerns: string[] | null;
    brand_id: string | null;
    category_id: string | null;
    created_at: string;
    updated_at: string;
    brand_name?: string | null;
    category_name?: string | null;
    primary_image_url?: string | null;
}

export interface AdminProductFull extends AdminProduct {
    images: { id?: string; url: string; alt_text: string | null; is_primary: boolean; sort_order: number }[];
    sizes: { id?: string; label: string; ml_value: string | null; price: number; sku_suffix: string | null; stock_quantity: number; is_default: boolean; is_active: boolean; sort_order: number }[];
    key_benefits: { id?: string; icon_name: string; title: string; description: string; sort_order: number }[];
    highlights: { id?: string; highlight: string; sort_order: number }[];
    badges: { id?: string; badge: string; custom_label: string | null; badge_color: string | null; is_primary: boolean }[];
    section_ids: string[];
}

export interface ProductFormData {
    name: string;
    slug: string;
    subtitle: string;
    short_description: string;
    description: string;
    how_to_use: string;
    ingredients: string;
    base_price: number;
    discount_percent: number;
    cost_price: number | null;
    sku: string;
    barcode: string;
    weight_grams: number | null;
    is_active: boolean;
    is_featured: boolean;
    in_stock: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    meta_title: string;
    meta_description: string;
    tags: string[];
    concerns: string[];
    brand_id: string | null;
    category_id: string | null;
    images: { url: string; alt_text: string; is_primary: boolean; sort_order: number }[];
    sizes: { label: string; ml_value: string; price: number; sku_suffix: string; stock_quantity: number; is_default: boolean; is_active: boolean; sort_order: number }[];
    key_benefits: { icon_name: string; title: string; description: string; sort_order: number }[];
    highlights: { highlight: string; sort_order: number }[];
    badges: { badge: string; custom_label: string; badge_color: string; is_primary: boolean }[];
    section_ids: string[];
}

export interface BrandOption { id: string; name: string; slug: string; }
export interface CategoryOption { id: string; name: string; slug: string; parent_id: string | null; }
export interface SectionOption { id: string; title: string; section_type: string; }

export interface AdminBrand {
    id: string; name: string; slug: string; tagline: string | null; description: string | null;
    logo_url: string | null; accent_color: string | null; text_color: string | null;
    is_active: boolean; sort_order: number; created_at: string; updated_at: string;
}

export interface BrandFormData {
    name: string; slug: string; tagline: string; description: string; logo_url: string;
    accent_color: string; text_color: string; is_active: boolean; sort_order: number;
}

export interface AdminSection {
    id: string; section_type: string; title: string; subtitle: string | null; badge_text: string | null;
    cta_text: string | null; cta_link: string | null; background_color: string | null;
    is_active: boolean; sort_order: number; created_at: string; updated_at: string; product_count?: number;
}

export interface SectionFormData {
    section_type: string; title: string; subtitle: string; badge_text: string; cta_text: string;
    cta_link: string; background_color: string; is_active: boolean; sort_order: number;
}

export interface AdminHeroSlide {
    id: string; title: string; subtitle: string | null; cta_text: string | null; cta_link: string | null;
    image_url: string; mobile_image_url: string | null; image_alt: string | null;
    background_color: string | null; text_color: string | null; is_active: boolean; sort_order: number;
    starts_at: string | null; expires_at: string | null; created_at: string; updated_at: string;
}

export interface HeroSlideFormData {
    title: string; subtitle: string; cta_text: string; cta_link: string; image_url: string;
    mobile_image_url: string; image_alt: string; background_color: string; text_color: string;
    is_active: boolean; sort_order: number;
}

export interface AboutContentMap { [key: string]: unknown; }

export interface AdminNavLink {
    id: string; parent_id: string | null; label: string; href: string; highlight: boolean;
    is_active: boolean; sort_order: number; linked_category_id: string | null;
    linked_category_name?: string | null; created_at: string; updated_at: string;
    children?: AdminNavLink[];
}

export interface NavLinkFormData {
    parent_id: string | null; label: string; href: string; highlight: boolean;
    is_active: boolean; sort_order: number; linked_category_id: string | null;
}

export interface SiteSettingRow {
    key: string; value: Record<string, unknown>; description: string | null; updated_at: string;
}

export interface AdminCoupon {
    id: string; code: string; description: string | null; discount_type: 'percentage' | 'fixed_amount';
    discount_value: number; minimum_order_value: number; max_discount_amount: number | null;
    usage_limit: number | null; usage_count: number; per_user_limit: number; is_active: boolean;
    starts_at: string; expires_at: string | null; created_at: string; updated_at: string;
}

export interface CouponFormData {
    code: string; description: string; discount_type: 'percentage' | 'fixed_amount';
    discount_value: number; minimum_order_value: number; max_discount_amount: number | null;
    usage_limit: number | null; per_user_limit: number; is_active: boolean; expires_at: string;
}

export interface AdminVisibleChange {
    id: string; product_id: string | null; before_image: string; after_image: string;
    before_label: string; after_label: string; is_active: boolean; sort_order: number;
    created_at: string; updated_at: string;
    product_name?: string | null; product_slug?: string | null; product_image?: string | null;
    product_price?: number | null; product_original_price?: number | null;
    product_discount_percent?: number | null; product_rating?: number | null;
    product_review_count?: number | null;
}

export interface VisibleChangeFormData {
    product_id: string | null; before_image: string; after_image: string;
    before_label: string; after_label: string; is_active: boolean; sort_order: number;
}

// ============================================================================
// PRODUCTS
// ============================================================================

export async function getAdminProducts(): Promise<AdminProduct[]> {
    await connectToDatabase();
    const products = await Product.find()
        .populate('brandId', 'name')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .lean();

    return products.map(p => {
        const brand = p.brandId as Record<string, unknown> | null;
        const category = p.categoryId as Record<string, unknown> | null;
        const primaryImage = p.images?.find(i => i.isPrimary) || p.images?.[0];

        return {
            id: String(p._id), name: p.name, slug: p.slug, subtitle: p.subtitle,
            short_description: p.shortDescription, description: p.description,
            how_to_use: p.howToUse, ingredients: p.ingredients,
            base_price: p.basePrice, compare_at_price: p.compareAtPrice,
            discount_percent: p.discountPercent, cost_price: p.costPrice,
            sku: p.sku, barcode: p.barcode, weight_grams: p.weightGrams,
            is_active: p.isActive, is_featured: p.isFeatured, in_stock: p.inStock,
            stock_quantity: p.stockQuantity, low_stock_threshold: p.lowStockThreshold,
            rating_avg: p.ratingAvg, review_count: p.reviewCount,
            meta_title: p.metaTitle, meta_description: p.metaDescription,
            tags: p.tags?.length ? p.tags : null, concerns: p.concerns?.length ? p.concerns : null,
            brand_id: p.brandId ? String((brand as Record<string, unknown>)?._id || p.brandId) : null,
            category_id: p.categoryId ? String((category as Record<string, unknown>)?._id || p.categoryId) : null,
            created_at: p.createdAt.toISOString(), updated_at: p.updatedAt.toISOString(),
            brand_name: brand ? (brand.name as string) : null,
            category_name: category ? (category.name as string) : null,
            primary_image_url: primaryImage ? primaryImage.url : null,
        };
    });
}

export async function getAdminProductById(id: string): Promise<AdminProductFull | null> {
    await connectToDatabase();
    const product = await Product.findById(id)
        .populate('brandId', 'name')
        .populate('categoryId', 'name')
        .lean();

    if (!product) return null;

    const brand = product.brandId as Record<string, unknown> | null;
    const category = product.categoryId as Record<string, unknown> | null;
    const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0];

    // Get section assignments
    const sections = await HomepageSection.find({ 'products.productId': product._id }).select('_id').lean();

    return {
        id: String(product._id), name: product.name, slug: product.slug, subtitle: product.subtitle,
        short_description: product.shortDescription, description: product.description,
        how_to_use: product.howToUse, ingredients: product.ingredients,
        base_price: product.basePrice, compare_at_price: product.compareAtPrice,
        discount_percent: product.discountPercent, cost_price: product.costPrice,
        sku: product.sku, barcode: product.barcode, weight_grams: product.weightGrams,
        is_active: product.isActive, is_featured: product.isFeatured, in_stock: product.inStock,
        stock_quantity: product.stockQuantity, low_stock_threshold: product.lowStockThreshold,
        rating_avg: product.ratingAvg, review_count: product.reviewCount,
        meta_title: product.metaTitle, meta_description: product.metaDescription,
        tags: product.tags?.length ? product.tags : null, concerns: product.concerns?.length ? product.concerns : null,
        brand_id: product.brandId ? String((brand as Record<string, unknown>)?._id || product.brandId) : null,
        category_id: product.categoryId ? String((category as Record<string, unknown>)?._id || product.categoryId) : null,
        created_at: product.createdAt.toISOString(), updated_at: product.updatedAt.toISOString(),
        brand_name: brand ? (brand.name as string) : null,
        category_name: category ? (category.name as string) : null,
        primary_image_url: primaryImage ? primaryImage.url : null,
        images: (product.images || []).map(i => ({ id: String(i._id), url: i.url, alt_text: i.altText || null, is_primary: i.isPrimary, sort_order: i.sortOrder })),
        sizes: (product.sizes || []).map(s => ({ id: String(s._id), label: s.label, ml_value: s.mlValue || null, price: s.price, sku_suffix: s.skuSuffix || null, stock_quantity: s.stockQuantity, is_default: s.isDefault, is_active: s.isActive, sort_order: s.sortOrder })),
        key_benefits: (product.keyBenefits || []).map(kb => ({ id: String(kb._id), icon_name: kb.iconName, title: kb.title, description: kb.description, sort_order: kb.sortOrder })),
        highlights: (product.highlights || []).map(h => ({ id: String(h._id), highlight: h.highlight, sort_order: h.sortOrder })),
        badges: (product.badges || []).map(b => ({ id: String(b._id), badge: b.badge, custom_label: b.customLabel || null, badge_color: b.badgeColor || null, is_primary: b.isPrimary })),
        section_ids: sections.map(s => String(s._id)),
    };
}

export async function createProduct(data: ProductFormData): Promise<{ id: string | null; error: string | null }> {
    await connectToDatabase();
    try {
        const discountedPrice = data.discount_percent > 0 
            ? Math.round(data.base_price * (1 - data.discount_percent / 100) * 100) / 100
            : data.base_price;

        const product = await Product.create({
            name: data.name, slug: data.slug, subtitle: data.subtitle || null,
            shortDescription: data.short_description || null, description: data.description || null,
            howToUse: data.how_to_use || null, ingredients: data.ingredients || null,
            basePrice: discountedPrice,
            compareAtPrice: data.discount_percent > 0 ? data.base_price : null,
            discountPercent: data.discount_percent || 0, costPrice: discountedPrice,
            sku: data.sku || null, barcode: data.barcode || null, weightGrams: data.weight_grams,
            isActive: data.is_active, isFeatured: data.is_featured, inStock: data.in_stock,
            stockQuantity: data.stock_quantity || 0, lowStockThreshold: data.low_stock_threshold || 5,
            metaTitle: data.meta_title || null, metaDescription: data.meta_description || null,
            tags: data.tags.length > 0 ? data.tags : [], concerns: data.concerns.length > 0 ? data.concerns : [],
            brandId: data.brand_id || null, categoryId: data.category_id || null,
            images: data.images.map(i => ({ url: i.url, altText: i.alt_text, isPrimary: i.is_primary, sortOrder: i.sort_order })),
            sizes: data.sizes.map(s => ({ label: s.label, mlValue: s.ml_value, price: s.price, skuSuffix: s.sku_suffix, stockQuantity: s.stock_quantity, isDefault: s.is_default, isActive: s.is_active, sortOrder: s.sort_order })),
            keyBenefits: data.key_benefits.map(b => ({ iconName: b.icon_name, title: b.title, description: b.description, sortOrder: b.sort_order })),
            highlights: data.highlights.map(h => ({ highlight: h.highlight, sortOrder: h.sort_order })),
            badges: data.badges.map(b => ({ badge: b.badge, customLabel: b.custom_label, badgeColor: b.badge_color, isPrimary: b.is_primary })),
        });

        // Add to homepage sections
        if (data.section_ids?.length > 0) {
            for (const sectionId of data.section_ids) {
                await HomepageSection.findByIdAndUpdate(sectionId, {
                    $push: { products: { productId: product._id, sortOrder: 0 } },
                });
            }
        }

        return { id: String(product._id), error: null };
    } catch (err) {
        console.error('Product creation error:', err);
        return { id: null, error: err instanceof Error ? err.message : 'Failed to create product' };
    }
}

export async function updateProduct(id: string, data: ProductFormData): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        const discountedPrice = data.discount_percent > 0 
            ? Math.round(data.base_price * (1 - data.discount_percent / 100) * 100) / 100
            : data.base_price;

        await Product.findByIdAndUpdate(id, {
            name: data.name, slug: data.slug, subtitle: data.subtitle || null,
            shortDescription: data.short_description || null, description: data.description || null,
            howToUse: data.how_to_use || null, ingredients: data.ingredients || null,
            basePrice: discountedPrice,
            compareAtPrice: data.discount_percent > 0 ? data.base_price : null,
            discountPercent: data.discount_percent || 0, costPrice: discountedPrice,
            sku: data.sku || null, barcode: data.barcode || null, weightGrams: data.weight_grams,
            isActive: data.is_active, isFeatured: data.is_featured, inStock: data.in_stock,
            stockQuantity: data.stock_quantity || 0, lowStockThreshold: data.low_stock_threshold || 5,
            metaTitle: data.meta_title || null, metaDescription: data.meta_description || null,
            tags: data.tags.length > 0 ? data.tags : [], concerns: data.concerns.length > 0 ? data.concerns : [],
            brandId: data.brand_id || null, categoryId: data.category_id || null,
            images: data.images.map(i => ({ url: i.url, altText: i.alt_text, isPrimary: i.is_primary, sortOrder: i.sort_order })),
            sizes: data.sizes.map(s => ({ label: s.label, mlValue: s.ml_value, price: s.price, skuSuffix: s.sku_suffix, stockQuantity: s.stock_quantity, isDefault: s.is_default, isActive: s.is_active, sortOrder: s.sort_order })),
            keyBenefits: data.key_benefits.map(b => ({ iconName: b.icon_name, title: b.title, description: b.description, sortOrder: b.sort_order })),
            highlights: data.highlights.map(h => ({ highlight: h.highlight, sortOrder: h.sort_order })),
            badges: data.badges.map(b => ({ badge: b.badge, customLabel: b.custom_label, badgeColor: b.badge_color, isPrimary: b.is_primary })),
        });

        // Update section assignments
        await HomepageSection.updateMany({}, { $pull: { products: { productId: id } } });
        if (data.section_ids?.length > 0) {
            for (const sectionId of data.section_ids) {
                await HomepageSection.findByIdAndUpdate(sectionId, {
                    $push: { products: { productId: id, sortOrder: 0 } },
                });
            }
        }

        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await Product.findByIdAndDelete(id);
        await HomepageSection.updateMany({}, { $pull: { products: { productId: id } } });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

// ============================================================================
// BRANDS & CATEGORIES (dropdowns)
// ============================================================================

export async function getBrandsAndCategories(): Promise<{ brands: BrandOption[]; categories: CategoryOption[]; sections: SectionOption[] }> {
    await connectToDatabase();
    const [brands, categories, sections] = await Promise.all([
        Brand.find({ isActive: true }).sort('name').lean(),
        Category.find({ isActive: true }).sort('name').lean(),
        HomepageSection.find({ isActive: true }).sort('sortOrder').lean(),
    ]);

    return {
        brands: brands.map(b => ({ id: String(b._id), name: b.name, slug: b.slug })),
        categories: categories.map(c => ({ id: String(c._id), name: c.name, slug: c.slug, parent_id: c.parentId ? String(c.parentId) : null })),
        sections: sections.map(s => ({ id: String(s._id), title: s.title, section_type: s.sectionType })),
    };
}

// ============================================================================
// BRANDS CRUD
// ============================================================================

export async function getAdminBrands(): Promise<AdminBrand[]> {
    await connectToDatabase();
    const brands = await Brand.find().sort({ sortOrder: 1, name: 1 }).lean();
    return brands.map(b => ({
        id: String(b._id), name: b.name, slug: b.slug, tagline: b.tagline, description: b.description,
        logo_url: b.logoUrl, accent_color: b.accentColor, text_color: b.textColor || null,
        is_active: b.isActive, sort_order: b.sortOrder,
        created_at: b.createdAt.toISOString(), updated_at: b.updatedAt.toISOString(),
    }));
}

export async function createBrand(data: BrandFormData): Promise<{ id: string | null; error: string | null }> {
    await connectToDatabase();
    try {
        const brand = await Brand.create({
            name: data.name, slug: data.slug, tagline: data.tagline || null,
            description: data.description || null, logoUrl: data.logo_url || null,
            accentColor: data.accent_color || null, textColor: data.text_color || null,
            isActive: data.is_active, sortOrder: data.sort_order,
        });
        return { id: String(brand._id), error: null };
    } catch (err) {
        return { id: null, error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function updateBrand(id: string, data: BrandFormData): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await Brand.findByIdAndUpdate(id, {
            name: data.name, slug: data.slug, tagline: data.tagline || null,
            description: data.description || null, logoUrl: data.logo_url || null,
            accentColor: data.accent_color || null, textColor: data.text_color || null,
            isActive: data.is_active, sortOrder: data.sort_order,
        });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function deleteBrand(id: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try { await Brand.findByIdAndDelete(id); return { error: null }; }
    catch (err) { return { error: err instanceof Error ? err.message : 'Failed' }; }
}

// ============================================================================
// SECTIONS CRUD
// ============================================================================

export async function getAdminSections(): Promise<AdminSection[]> {
    await connectToDatabase();
    const sections = await HomepageSection.find().sort({ sortOrder: 1 }).lean();
    return sections.map(s => ({
        id: String(s._id), section_type: s.sectionType, title: s.title, subtitle: s.subtitle,
        badge_text: s.badgeText, cta_text: s.ctaText, cta_link: s.ctaLink,
        background_color: s.backgroundColor, is_active: s.isActive, sort_order: s.sortOrder,
        created_at: s.createdAt.toISOString(), updated_at: s.updatedAt.toISOString(),
        product_count: s.products?.length || 0,
    }));
}

export async function createSection(data: SectionFormData): Promise<{ id: string | null; error: string | null }> {
    await connectToDatabase();
    try {
        const section = await HomepageSection.create({
            sectionType: data.section_type, title: data.title, subtitle: data.subtitle || null,
            badgeText: data.badge_text || null, ctaText: data.cta_text || null, ctaLink: data.cta_link || null,
            backgroundColor: data.background_color || null, isActive: data.is_active, sortOrder: data.sort_order,
        });
        return { id: String(section._id), error: null };
    } catch (err) {
        return { id: null, error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function updateSection(id: string, data: SectionFormData): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await HomepageSection.findByIdAndUpdate(id, {
            sectionType: data.section_type, title: data.title, subtitle: data.subtitle || null,
            badgeText: data.badge_text || null, ctaText: data.cta_text || null, ctaLink: data.cta_link || null,
            backgroundColor: data.background_color || null, isActive: data.is_active, sortOrder: data.sort_order,
        });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function deleteSection(id: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try { await HomepageSection.findByIdAndDelete(id); return { error: null }; }
    catch (err) { return { error: err instanceof Error ? err.message : 'Failed' }; }
}

// ============================================================================
// HERO SLIDES CRUD
// ============================================================================

export async function getAdminHeroSlides(): Promise<AdminHeroSlide[]> {
    await connectToDatabase();
    const slides = await HeroSlide.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    return slides.map(s => ({
        id: String(s._id), title: s.title, subtitle: s.subtitle, cta_text: s.ctaText,
        cta_link: s.ctaLink, image_url: s.imageUrl, mobile_image_url: s.mobileImageUrl || null,
        image_alt: s.imageAlt, background_color: s.backgroundColor, text_color: s.textColor,
        is_active: s.isActive, sort_order: s.sortOrder,
        starts_at: s.startsAt?.toISOString() || null, expires_at: s.expiresAt?.toISOString() || null,
        created_at: s.createdAt.toISOString(), updated_at: s.updatedAt.toISOString(),
    }));
}

export async function createHeroSlide(data: HeroSlideFormData): Promise<{ id: string | null; error: string | null }> {
    await connectToDatabase();
    try {
        const slide = await HeroSlide.create({
            title: data.title, subtitle: data.subtitle || null, ctaText: data.cta_text || null,
            ctaLink: data.cta_link || null, imageUrl: data.image_url,
            mobileImageUrl: data.mobile_image_url || null, imageAlt: data.image_alt || null,
            backgroundColor: data.background_color || null, textColor: data.text_color || '#ffffff',
            isActive: data.is_active, sortOrder: data.sort_order,
        });
        return { id: String(slide._id), error: null };
    } catch (err) {
        return { id: null, error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function updateHeroSlide(id: string, data: HeroSlideFormData): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await HeroSlide.findByIdAndUpdate(id, {
            title: data.title, subtitle: data.subtitle || null, ctaText: data.cta_text || null,
            ctaLink: data.cta_link || null, imageUrl: data.image_url,
            mobileImageUrl: data.mobile_image_url || null, imageAlt: data.image_alt || null,
            backgroundColor: data.background_color || null, textColor: data.text_color || '#ffffff',
            isActive: data.is_active, sortOrder: data.sort_order,
        });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function deleteHeroSlide(id: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try { await HeroSlide.findByIdAndDelete(id); return { error: null }; }
    catch (err) { return { error: err instanceof Error ? err.message : 'Failed' }; }
}

// ============================================================================
// ABOUT CONTENT
// ============================================================================

export async function getAboutContent(): Promise<AboutContentMap> {
    await connectToDatabase();
    const data = await AboutContent.find().lean();
    const map: AboutContentMap = {};
    data.forEach(row => { map[row.sectionKey] = row.content; });
    return map;
}

export async function updateAboutSection(sectionKey: string, content: unknown): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await AboutContent.findOneAndUpdate(
            { sectionKey },
            { sectionKey, content, updatedAt: new Date() },
            { upsert: true }
        );
        revalidatePath('/about');
        revalidatePath('/about-us');
        revalidatePath('/admin/about');
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

// ============================================================================
// NAV LINKS CRUD
// ============================================================================

export async function getAdminNavLinks(): Promise<AdminNavLink[]> {
    await connectToDatabase();
    const all = await NavLink.find().populate('linkedCategoryId', 'name').sort({ sortOrder: 1 }).lean();

    const mapped: AdminNavLink[] = all.map(n => {
        const linkedCat = n.linkedCategoryId as unknown as Record<string, unknown> | null;
        return {
            id: String(n._id), parent_id: n.parentId ? String(n.parentId) : null,
            label: n.label, href: n.href, highlight: n.highlight, is_active: n.isActive,
            sort_order: n.sortOrder,
            linked_category_id: n.linkedCategoryId ? String((linkedCat as Record<string, unknown>)?._id || n.linkedCategoryId) : null,
            linked_category_name: linkedCat ? (linkedCat.name as string) : null,
            created_at: n.createdAt.toISOString(), updated_at: n.updatedAt.toISOString(),
        };
    });

    const topLevel = mapped.filter(n => !n.parent_id);
    const children = mapped.filter(n => n.parent_id);
    for (const parent of topLevel) {
        parent.children = children.filter(c => c.parent_id === parent.id).sort((a, b) => a.sort_order - b.sort_order);
    }
    return topLevel;
}

export async function createNavLink(data: NavLinkFormData): Promise<{ id: string | null; error: string | null }> {
    await connectToDatabase();
    try {
        const link = await NavLink.create({
            parentId: data.parent_id || null, label: data.label, href: data.href,
            highlight: data.highlight, isActive: data.is_active, sortOrder: data.sort_order,
            linkedCategoryId: data.linked_category_id || null,
        });
        return { id: String(link._id), error: null };
    } catch (err) {
        return { id: null, error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function updateNavLink(id: string, data: NavLinkFormData): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await NavLink.findByIdAndUpdate(id, {
            parentId: data.parent_id || null, label: data.label, href: data.href,
            highlight: data.highlight, isActive: data.is_active, sortOrder: data.sort_order,
            linkedCategoryId: data.linked_category_id || null,
        });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function deleteNavLink(id: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try { await NavLink.findByIdAndDelete(id); return { error: null }; }
    catch (err) { return { error: err instanceof Error ? err.message : 'Failed' }; }
}

// ============================================================================
// SITE SETTINGS (ADMIN)
// ============================================================================

export async function getAdminSiteSettings(): Promise<SiteSettingRow[]> {
    await connectToDatabase();
    
    const DEFAULT_POLICIES = [
        {
            key: 'policy_terms',
            value: { content: 'Welcome to ValleyCentia. Please read these Terms of Service carefully before using our website or registering for an account.\n\n1. Account Creation & Verification\nWhen creating an account, you must provide accurate, complete, and current information.\n\n2. Intellectual Property\nThe website and its original content, features, and functionality are and will remain the exclusive property of ValleyCentia.' },
            description: 'Terms and Conditions Policy content'
        },
        {
            key: 'policy_privacy',
            value: { content: 'ValleyCentia values your privacy. This Privacy Policy details how we collect, use, and safeguard your personal information.\n\n1. Information We Collect\nWe collect name, email, shipping/billing address, and payment info.\n\n2. Sharing & Disclosures\nWe do not sell your personal data. We only share details with trusted third-party providers involved in fulfillment and delivery.' },
            description: 'Privacy Policy content'
        },
        {
            key: 'policy_returns',
            value: { content: 'Return & Refund Policy:\n\n1. Returns\nYou can return any product within 30 days of delivery if it is unused and in its original packaging.\n\n2. Refunds\nOnce we receive and inspect your item, we will process your refund within 7-10 business days.' },
            description: 'Return and Refund Policy content'
        },
        {
            key: 'policy_delivery',
            value: { content: 'Delivery Policy:\n\n1. Shipping Rates\nWe offer free shipping on orders over ৳499. For other orders, standard shipping fees apply based on region.\n\n2. Delivery Times\nOrders inside Dhaka are delivered in 2-3 business days. Orders outside Dhaka take 3-5 business days.' },
            description: 'Delivery Policy content'
        },
        {
            key: 'footer_about_text',
            value: { text: 'Curating premium fashion and accessories for the modern lifestyle. Quality craftsmanship meets contemporary design.' },
            description: 'Footer about text / description'
        },
        {
            key: 'footer_contact_info',
            value: { email: 'hello@valleycentia.com', phone: '+1 (234) 567-890', address: 'New York, NY 10001' },
            description: 'Footer contact info (email, phone, address)'
        },
        {
            key: 'footer_social_links',
            value: { facebook: '#', instagram: '#', twitter: '#', youtube: '#' },
            description: 'Footer social media links'
        },
        {
            key: 'footer_links',
            value: {
                links_json: JSON.stringify({
                    shop: [
                        { name: 'New Arrivals', href: '/shop?sort=new' },
                        { name: 'Best Sellers', href: '/shop?sort=popular' },
                        { name: 'Sale', href: '/shop?sale=true' },
                        { name: 'All Products', href: '/shop' }
                    ],
                    company: [
                        { name: 'About Us', href: '/about' },
                        { name: 'Careers', href: '/careers' },
                        { name: 'Press', href: '/press' },
                        { name: 'Blog', href: '/blog' }
                    ],
                    support: [
                        { name: 'Help Center', href: '/help' },
                        { name: 'Delivery Policy', href: '/shipping' },
                        { name: 'Return & Refund Policy', href: '/returns' },
                        { name: 'Order Tracking', href: '/tracking' }
                    ],
                    legal: [
                        { name: 'Privacy Policy', href: '/privacy' },
                        { name: 'Terms & Conditions', href: '/terms' },
                        { name: 'Cookie Policy', href: '/cookies' }
                    ]
                }, null, 4)
            },
            description: 'Footer columns links configuration (JSON)'
        }
    ];

    for (const p of DEFAULT_POLICIES) {
        const exists = await SiteSetting.findOne({ key: p.key });
        if (!exists) {
            await SiteSetting.create({
                key: p.key,
                value: p.value,
                description: p.description,
                updatedAt: new Date()
            });
        }
    }

    const settings = await SiteSetting.find().sort({ key: 1 }).lean();
    return settings.map(s => ({
        key: s.key, value: s.value as Record<string, unknown>,
        description: s.description, updated_at: s.updatedAt.toISOString(),
    }));
}

export async function updateSiteSetting(key: string, value: Record<string, unknown>): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await SiteSetting.findOneAndUpdate({ key }, { value, updatedAt: new Date() });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

// ============================================================================
// COUPONS CRUD (ADMIN)
// ============================================================================

export async function getAdminCoupons(): Promise<AdminCoupon[]> {
    await connectToDatabase();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return coupons.map(c => ({
        id: String(c._id), code: c.code, description: c.description,
        discount_type: c.discountType as 'percentage' | 'fixed_amount',
        discount_value: c.discountValue, minimum_order_value: c.minimumOrderValue,
        max_discount_amount: c.maxDiscountAmount, usage_limit: c.usageLimit,
        usage_count: c.usageCount, per_user_limit: c.perUserLimit, is_active: c.isActive,
        starts_at: c.startsAt.toISOString(), expires_at: c.expiresAt?.toISOString() || null,
        created_at: c.createdAt.toISOString(), updated_at: c.updatedAt.toISOString(),
    }));
}

export async function createCoupon(data: CouponFormData): Promise<{ id: string | null; error: string | null }> {
    await connectToDatabase();
    try {
        const coupon = await Coupon.create({
            code: data.code.toUpperCase().trim(), description: data.description || null,
            discountType: data.discount_type, discountValue: data.discount_value,
            minimumOrderValue: data.minimum_order_value || 0, maxDiscountAmount: data.max_discount_amount || null,
            usageLimit: data.usage_limit || null, perUserLimit: data.per_user_limit || 1,
            isActive: data.is_active, expiresAt: data.expires_at || null,
        });
        return { id: String(coupon._id), error: null };
    } catch (err) {
        return { id: null, error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function updateCoupon(id: string, data: CouponFormData): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await Coupon.findByIdAndUpdate(id, {
            code: data.code.toUpperCase().trim(), description: data.description || null,
            discountType: data.discount_type, discountValue: data.discount_value,
            minimumOrderValue: data.minimum_order_value || 0, maxDiscountAmount: data.max_discount_amount || null,
            usageLimit: data.usage_limit || null, perUserLimit: data.per_user_limit || 1,
            isActive: data.is_active, expiresAt: data.expires_at || null,
        });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function deleteCoupon(id: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try { await Coupon.findByIdAndDelete(id); return { error: null }; }
    catch (err) { return { error: err instanceof Error ? err.message : 'Failed' }; }
}

// ============================================================================
// VISIBLE CHANGES CRUD
// ============================================================================

export async function getAdminVisibleChanges(): Promise<AdminVisibleChange[]> {
    await connectToDatabase();
    const changes = await VisibleChange.find()
        .populate('productId', 'name slug basePrice compareAtPrice discountPercent ratingAvg reviewCount images')
        .sort({ sortOrder: 1, createdAt: -1 }).lean();

    return changes.map(vc => {
        const product = vc.productId as unknown as Record<string, unknown> | null;
        const images = product ? (product.images as Array<Record<string, unknown>>) || [] : [];
        const primaryImage = images.find(i => i.isPrimary) || images[0];

        return {
            id: String(vc._id), product_id: vc.productId ? String((product as Record<string, unknown>)?._id || vc.productId) : null,
            before_image: vc.beforeImage, after_image: vc.afterImage,
            before_label: vc.beforeLabel, after_label: vc.afterLabel,
            is_active: vc.isActive, sort_order: vc.sortOrder,
            created_at: vc.createdAt.toISOString(), updated_at: vc.updatedAt.toISOString(),
            product_name: product ? (product.name as string) : null,
            product_slug: product ? (product.slug as string) : null,
            product_image: primaryImage ? (primaryImage.url as string) : null,
            product_price: product ? (product.basePrice as number) : null,
            product_original_price: product ? (product.compareAtPrice as number) : null,
            product_discount_percent: product ? (product.discountPercent as number) : null,
            product_rating: product ? (product.ratingAvg as number) : null,
            product_review_count: product ? (product.reviewCount as number) : null,
        };
    });
}

export async function createVisibleChange(data: VisibleChangeFormData): Promise<{ id: string | null; error: string | null }> {
    await connectToDatabase();
    try {
        const vc = await VisibleChange.create({
            productId: data.product_id || null, beforeImage: data.before_image,
            afterImage: data.after_image, beforeLabel: data.before_label || 'Day 1',
            afterLabel: data.after_label || 'Day 30', isActive: data.is_active, sortOrder: data.sort_order,
        });
        return { id: String(vc._id), error: null };
    } catch (err) {
        return { id: null, error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function updateVisibleChange(id: string, data: VisibleChangeFormData): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await VisibleChange.findByIdAndUpdate(id, {
            productId: data.product_id || null, beforeImage: data.before_image,
            afterImage: data.after_image, beforeLabel: data.before_label || 'Day 1',
            afterLabel: data.after_label || 'Day 30', isActive: data.is_active, sortOrder: data.sort_order,
        });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function deleteVisibleChange(id: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try { await VisibleChange.findByIdAndDelete(id); return { error: null }; }
    catch (err) { return { error: err instanceof Error ? err.message : 'Failed' }; }
}

export async function getActiveProductsSimple(): Promise<{ id: string; name: string; slug: string }[]> {
    await connectToDatabase();
    const list = await Product.find({ isActive: true }).select('name slug').sort('name').lean();
    return list.map(p => ({ id: String(p._id), name: p.name, slug: p.slug }));
}

export async function getAvailableCouponsSimple(): Promise<{ id: string; code: string }[]> {
    await connectToDatabase();
    const list = await Coupon.find({ isActive: true }).sort('code').lean();
    return list.map(c => ({ id: String(c._id), code: c.code }));
}

export async function getProductCoupon(productId: string): Promise<{ couponId: string; couponPrice: number | null } | null> {
    await connectToDatabase();
    const pc = await ProductCoupon.findOne({ productId }).lean();
    if (!pc) return null;
    return { couponId: String(pc.couponId), couponPrice: pc.couponPrice };
}

export async function assignProductCoupon(productId: string, couponId: string | null, couponPrice: number | null): Promise<void> {
    await connectToDatabase();
    // Delete existing assignment
    await ProductCoupon.deleteMany({ productId });
    // Insert new one if selected
    if (couponId) {
        await ProductCoupon.create({
            productId,
            couponId,
            couponPrice,
        });
    }
}
