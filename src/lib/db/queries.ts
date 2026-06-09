"use server";

import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Brand from '@/lib/models/Brand';
import Category from '@/lib/models/Category';
import HeroSlide from '@/lib/models/HeroSlide';
import HomepageSection from '@/lib/models/HomepageSection';
import NavLink from '@/lib/models/NavLink';
import WishlistItem from '@/lib/models/WishlistItem';
import Review from '@/lib/models/Review';
import Address from '@/lib/models/Address';
import Order from '@/lib/models/Order';
import SiteSetting from '@/lib/models/SiteSetting';
import Coupon from '@/lib/models/Coupon';
import ProductCoupon from '@/lib/models/ProductCoupon';
import VisibleChange from '@/lib/models/VisibleChange';
import User from '@/lib/models/User';
import AboutContent from '@/lib/models/AboutContent';

// ============================================================================
// TYPES (kept compatible with existing frontend)
// ============================================================================

export interface HeroSlideData {
    id: string;
    title: string;
    subtitle: string | null;
    cta_text: string | null;
    cta_link: string | null;
    image_url: string;
    mobile_image_url: string | null;
    image_alt: string | null;
    background_color: string | null;
    text_color: string | null;
}

export interface ProductCard {
    id: string;
    slug: string;
    name: string;
    subtitle: string | null;
    short_description: string | null;
    base_price: number;
    compare_at_price: number | null;
    discount_percent: number;
    rating_avg: number;
    review_count: number;
    in_stock: boolean;
    is_featured: boolean;
    concerns: string[] | null;
    tags: string[] | null;
    brand_name: string | null;
    brand_slug: string | null;
    category_name: string | null;
    category_slug: string | null;
    primary_image_url: string | null;
    badges: { badge: string; label: string | null; color: string | null }[] | null;
}

export interface BrandData {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    logo_url: string | null;
    accent_color: string | null;
    text_color: string | null;
}

export interface HomepageSectionData {
    id: string;
    section_type: string;
    title: string;
    subtitle: string | null;
    badge_text: string | null;
    cta_text: string | null;
    cta_link: string | null;
    background_color: string | null;
    sort_order: number;
    products: SectionProductCard[];
}

export interface SectionProductCard extends ProductCard {
    custom_badge_text: string | null;
    custom_badge_color: string | null;
    section_sort_order: number;
    coupon_price: number | null;
    coupon_code: string | null;
}

export interface ProductDetail {
    id: string;
    slug: string;
    name: string;
    subtitle: string | null;
    short_description: string | null;
    description: string | null;
    how_to_use: string | null;
    ingredients: string | null;
    base_price: number;
    compare_at_price: number | null;
    discount_percent: number;
    rating_avg: number;
    review_count: number;
    in_stock: boolean;
    stock_quantity: number;
    concerns: string[] | null;
    tags: string[] | null;
    brand_name: string | null;
    brand_slug: string | null;
    category_name: string | null;
    category_slug: string | null;
    images: { url: string; alt: string | null }[] | null;
    sizes: { id: string; label: string; ml: string | null; price: number; is_default: boolean }[] | null;
    key_benefits: { icon: string; title: string; desc: string }[] | null;
    highlights: string[] | null;
    badges: { badge: string; label: string | null; color: string | null }[] | null;
    coupon_price: number | null;
    coupon_code: string | null;
}

export interface NavLinkItem {
    id: string;
    label: string;
    href: string;
    highlight: boolean;
    children: { label: string; href: string }[];
}

export interface ReviewData {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    title: string | null;
    body: string | null;
    is_verified: boolean;
    helpful_count: number;
    created_at: string;
    user_name?: string;
    images?: { url: string; altText: string | null; sortOrder: number }[];
}

export interface UserAddress {
    id: string;
    user_id: string;
    label: string;
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    landmark: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface AddressFormData {
    label: string;
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    landmark: string;
    is_default: boolean;
}

export interface OrderItem {
    id: string;
    product_id: string;
    product_name: string;
    product_image: string | null;
    product_slug: string | null;
    size: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface UserOrder {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: number;
    shipping_cost: number;
    tax: number;
    total: number;
    shipping_name: string;
    shipping_city: string;
    shipping_state: string;
    created_at: string;
    order_items: OrderItem[];
}

export interface CouponData {
    id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    minimum_order_value: number;
    max_discount_amount: number | null;
    is_active: boolean;
}

export interface VisibleChangeItem {
    id: string;
    slug: string;
    beforeImage: string;
    afterImage: string;
    beforeLabel: string;
    afterLabel: string;
    productThumb: string;
    productName: string;
    rating: number;
    reviewCount: string;
    price: number;
    originalPrice: number;
    discountPercent: number;
}

export interface ProductFilters {
    category?: string;
    brand?: string;
    concern?: string;
    type?: string;
    sort?: string;
    search?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function toProductCard(p: Record<string, unknown>, brand?: Record<string, unknown> | null, category?: Record<string, unknown> | null): ProductCard {
    const badges = (p.badges as Array<Record<string, unknown>>) || [];
    const images = (p.images as Array<Record<string, unknown>>) || [];
    const primaryImage = images.find(i => i.isPrimary) || images[0];

    return {
        id: String(p._id),
        slug: p.slug as string,
        name: p.name as string,
        subtitle: (p.subtitle as string) || null,
        short_description: (p.shortDescription as string) || null,
        base_price: p.basePrice as number,
        compare_at_price: (p.compareAtPrice as number) || null,
        discount_percent: (p.discountPercent as number) || 0,
        rating_avg: (p.ratingAvg as number) || 0,
        review_count: (p.reviewCount as number) || 0,
        in_stock: p.inStock as boolean,
        is_featured: p.isFeatured as boolean,
        concerns: (p.concerns as string[]) || null,
        tags: (p.tags as string[]) || null,
        brand_name: brand ? (brand.name as string) : null,
        brand_slug: brand ? (brand.slug as string) : null,
        category_name: category ? (category.name as string) : null,
        category_slug: category ? (category.slug as string) : null,
        primary_image_url: primaryImage ? (primaryImage.url as string) : null,
        badges: badges.length > 0
            ? badges.map(b => ({ badge: b.badge as string, label: (b.customLabel as string) || null, color: (b.badgeColor as string) || null }))
            : null,
    };
}

// ============================================================================
// NAV LINKS
// ============================================================================

export async function getNavLinks(): Promise<NavLinkItem[]> {
    await connectToDatabase();

    const all = await NavLink.find({ isActive: true }).sort('sortOrder').lean();

    const topLevel = all.filter(n => !n.parentId);
    const manualChildren = all.filter(n => n.parentId);

    // Get linked category children
    const linkedCategoryIds = topLevel.map(n => n.linkedCategoryId).filter(Boolean);

    let categoryChildrenMap: Record<string, { name: string; slug: string }[]> = {};
    if (linkedCategoryIds.length > 0) {
        const catChildren = await Category.find({
            parentId: { $in: linkedCategoryIds },
            isActive: true,
        }).sort('name').lean();

        for (const child of catChildren) {
            const parentKey = String(child.parentId);
            if (!categoryChildrenMap[parentKey]) categoryChildrenMap[parentKey] = [];
            categoryChildrenMap[parentKey].push({ name: child.name, slug: child.slug });
        }
    }

    return topLevel.map(item => {
        let children: { label: string; href: string }[] = [];

        if (item.linkedCategoryId && categoryChildrenMap[String(item.linkedCategoryId)]) {
            children = categoryChildrenMap[String(item.linkedCategoryId)].map(c => ({
                label: c.name,
                href: `/shop?type=${c.slug}`,
            }));
        }

        const manual = manualChildren
            .filter(c => String(c.parentId) === String(item._id))
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(c => ({ label: c.label, href: c.href }));

        children = [...children, ...manual];

        return {
            id: String(item._id),
            label: item.label,
            href: item.href,
            highlight: item.highlight,
            children,
        };
    });
}

// ============================================================================
// HERO SLIDES
// ============================================================================

export async function getHeroSlides(): Promise<HeroSlideData[]> {
    await connectToDatabase();
    const slides = await HeroSlide.find({ isActive: true }).sort('sortOrder').lean();

    return slides.map(s => ({
        id: String(s._id),
        title: s.title,
        subtitle: s.subtitle,
        cta_text: s.ctaText,
        cta_link: s.ctaLink,
        image_url: s.imageUrl,
        mobile_image_url: s.mobileImageUrl || null,
        image_alt: s.imageAlt,
        background_color: s.backgroundColor,
        text_color: s.textColor,
    }));
}

// ============================================================================
// BRANDS
// ============================================================================

export async function getBrands(): Promise<BrandData[]> {
    await connectToDatabase();
    const brands = await Brand.find({ isActive: true }).sort('sortOrder').lean();

    return brands.map(b => ({
        id: String(b._id),
        name: b.name,
        slug: b.slug,
        tagline: b.tagline,
        description: b.description,
        logo_url: b.logoUrl,
        accent_color: b.accentColor,
        text_color: b.textColor || null,
    }));
}

// ============================================================================
// HOMEPAGE SECTIONS
// ============================================================================

export async function getHomepageSections(): Promise<HomepageSectionData[]> {
    await connectToDatabase();

    const sections = await HomepageSection.find({ isActive: true }).sort('sortOrder').lean();
    const NON_PRODUCT_SECTIONS = ['hero_carousel', 'brands_that_lead'];

    const result: HomepageSectionData[] = [];

    for (const section of sections) {
        const sectionData: HomepageSectionData = {
            id: String(section._id),
            section_type: section.sectionType,
            title: section.title,
            subtitle: section.subtitle,
            badge_text: section.badgeText,
            cta_text: section.ctaText,
            cta_link: section.ctaLink,
            background_color: section.backgroundColor,
            sort_order: section.sortOrder,
            products: [],
        };

        if (NON_PRODUCT_SECTIONS.includes(section.sectionType) || !section.products?.length) {
            result.push(sectionData);
            continue;
        }

        const productIds = section.products.map((sp: Record<string, unknown>) => sp.productId);

        const products = await Product.find({ _id: { $in: productIds }, isActive: true })
            .populate('brandId', 'name slug')
            .populate('categoryId', 'name slug')
            .lean();

        // Get coupon info
        const coupons = await ProductCoupon.find({ productId: { $in: productIds } })
            .populate('couponId', 'code')
            .lean();

        const couponMap: Record<string, { price: number; code: string }> = {};
        for (const c of coupons) {
            const pid = String(c.productId);
            const couponDoc = c.couponId as unknown as Record<string, unknown> | null;
            const code = couponDoc ? (couponDoc.code as string) : '';
            if (!couponMap[pid] || (c.couponPrice !== null && c.couponPrice! < couponMap[pid].price)) {
                couponMap[pid] = { price: c.couponPrice || 0, code };
            }
        }

        const sectionProducts: SectionProductCard[] = products.map(p => {
            const sp = section.products.find((s: Record<string, unknown>) => String(s.productId) === String(p._id));
            const brand = p.brandId as Record<string, unknown> | null;
            const category = p.categoryId as Record<string, unknown> | null;
            const card = toProductCard(p as unknown as Record<string, unknown>, brand, category);
            const coupon = couponMap[String(p._id)];

            return {
                ...card,
                custom_badge_text: (sp?.customBadgeText as string) || null,
                custom_badge_color: (sp?.customBadgeColor as string) || null,
                section_sort_order: (sp?.sortOrder as number) || 0,
                coupon_price: coupon?.price || null,
                coupon_code: coupon?.code || null,
            };
        }).sort((a, b) => a.section_sort_order - b.section_sort_order);

        sectionData.products = sectionProducts;
        result.push(sectionData);
    }

    return result;
}

// ============================================================================
// PRODUCT CARDS (shop page)
// ============================================================================

export async function getProductCards(filters?: ProductFilters): Promise<ProductCard[]> {
    await connectToDatabase();

    const query: Record<string, unknown> = { isActive: true };

    // We need to look up brand/category by slug if filtered
    if (filters?.brand) {
        const brand = await Brand.findOne({ slug: filters.brand }).lean();
        if (brand) query.brandId = brand._id;
        else return [];
    }

    if (filters?.category || filters?.type) {
        const slug = filters.category || filters.type;
        const cat = await Category.findOne({ slug }).lean();
        if (cat) query.categoryId = cat._id;
        else return [];
    }

    if (filters?.concern) {
        query.concerns = filters.concern;
    }

    if (filters?.search) {
        query.name = { $regex: filters.search, $options: 'i' };
    }

    // Sort
    let sortObj: Record<string, 1 | -1> = { isFeatured: -1, ratingAvg: -1 };
    if (filters?.sort === 'price-low') sortObj = { basePrice: 1 };
    else if (filters?.sort === 'price-high') sortObj = { basePrice: -1 };
    else if (filters?.sort === 'top-rated') sortObj = { ratingAvg: -1 };
    else if (filters?.sort === 'newest') sortObj = { createdAt: -1 };

    const products = await Product.find(query)
        .populate('brandId', 'name slug')
        .populate('categoryId', 'name slug')
        .sort(sortObj)
        .lean();

    return products.map(p => {
        const brand = p.brandId as Record<string, unknown> | null;
        const category = p.categoryId as Record<string, unknown> | null;
        return toProductCard(p as unknown as Record<string, unknown>, brand, category);
    });
}

// ============================================================================
// PRODUCT DETAIL (PDP)
// ============================================================================

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
    await connectToDatabase();

    const product = await Product.findOne({ slug })
        .populate('brandId', 'name slug')
        .populate('categoryId', 'name slug')
        .lean();

    if (!product) return null;

    const brand = product.brandId as Record<string, unknown> | null;
    const category = product.categoryId as Record<string, unknown> | null;

    // Get coupon info
    let coupon_price: number | null = null;
    let coupon_code: string | null = null;

    const productCoupons = await ProductCoupon.find({ productId: product._id })
        .populate('couponId', 'code')
        .lean();

    if (productCoupons.length > 0) {
        const best = productCoupons.reduce((a, b) =>
            (a.couponPrice || Infinity) < (b.couponPrice || Infinity) ? a : b
        );
        coupon_price = best.couponPrice || null;
        const couponDoc = best.couponId as unknown as Record<string, unknown> | null;
        coupon_code = couponDoc ? (couponDoc.code as string) : null;
    }

    return {
        id: String(product._id),
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        short_description: product.shortDescription,
        description: product.description,
        how_to_use: product.howToUse,
        ingredients: product.ingredients,
        base_price: product.basePrice,
        compare_at_price: product.compareAtPrice,
        discount_percent: product.discountPercent,
        rating_avg: product.ratingAvg,
        review_count: product.reviewCount,
        in_stock: product.inStock,
        stock_quantity: product.stockQuantity,
        concerns: product.concerns?.length ? product.concerns : null,
        tags: product.tags?.length ? product.tags : null,
        brand_name: brand ? (brand.name as string) : null,
        brand_slug: brand ? (brand.slug as string) : null,
        category_name: category ? (category.name as string) : null,
        category_slug: category ? (category.slug as string) : null,
        images: product.images?.map(i => ({ url: i.url, alt: i.altText || null })) || null,
        sizes: product.sizes?.filter(s => s.isActive).map(s => ({
            id: String(s._id),
            label: s.label,
            ml: s.mlValue || null,
            price: s.price,
            is_default: s.isDefault,
        })) || null,
        key_benefits: product.keyBenefits?.map(kb => ({
            icon: kb.iconName,
            title: kb.title,
            desc: kb.description,
        })) || null,
        highlights: product.highlights?.map(h => h.highlight) || null,
        badges: product.badges?.map(b => ({
            badge: b.badge,
            label: b.customLabel || null,
            color: b.badgeColor || null,
        })) || null,
        coupon_price,
        coupon_code,
    };
}

// ============================================================================
// RELATED PRODUCTS
// ============================================================================

export async function getRelatedProducts(slug: string, limit: number = 4): Promise<ProductCard[]> {
    await connectToDatabase();
    const products = await Product.find({ slug: { $ne: slug }, isActive: true })
        .populate('brandId', 'name slug')
        .populate('categoryId', 'name slug')
        .sort({ ratingAvg: -1 })
        .limit(limit)
        .lean();

    return products.map(p => {
        const brand = p.brandId as Record<string, unknown> | null;
        const category = p.categoryId as Record<string, unknown> | null;
        return toProductCard(p as unknown as Record<string, unknown>, brand, category);
    });
}

export async function getRelatedProductsSimple(currentSlug: string, limit: number = 4): Promise<ProductCard[]> {
    return getRelatedProducts(currentSlug, limit);
}

// ============================================================================
// SEARCH PRODUCTS
// ============================================================================

export async function searchProducts(query: string): Promise<ProductCard[]> {
    if (!query.trim()) return [];
    await connectToDatabase();

    const products = await Product.find({
        isActive: true,
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { shortDescription: { $regex: query, $options: 'i' } },
        ],
    })
        .populate('brandId', 'name slug')
        .populate('categoryId', 'name slug')
        .sort({ ratingAvg: -1 })
        .limit(10)
        .lean();

    return products.map(p => {
        const brand = p.brandId as Record<string, unknown> | null;
        const category = p.categoryId as Record<string, unknown> | null;
        return toProductCard(p as unknown as Record<string, unknown>, brand, category);
    });
}

// ============================================================================
// WISHLIST
// ============================================================================

export async function getWishlist(userId: string): Promise<string[]> {
    await connectToDatabase();
    const items = await WishlistItem.find({ userId }).lean();
    return items.map(item => String(item.productId));
}

export async function addToWishlist(userId: string, productId: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await WishlistItem.findOneAndUpdate(
            { userId, productId },
            { userId, productId },
            { upsert: true }
        );
        return { error: null };
    } catch (err) {
        console.error('Error adding to wishlist:', err);
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await WishlistItem.deleteOne({ userId, productId });
        return { error: null };
    } catch (err) {
        console.error('Error removing from wishlist:', err);
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function getWishlistProducts(userId: string): Promise<ProductCard[]> {
    await connectToDatabase();
    const wishlistItems = await WishlistItem.find({ userId }).lean();
    if (!wishlistItems.length) return [];

    const productIds = wishlistItems.map(w => w.productId);
    const products = await Product.find({ _id: { $in: productIds } })
        .populate('brandId', 'name slug')
        .populate('categoryId', 'name slug')
        .lean();

    return products.map(p => {
        const brand = p.brandId as Record<string, unknown> | null;
        const category = p.categoryId as Record<string, unknown> | null;
        return toProductCard(p as unknown as Record<string, unknown>, brand, category);
    });
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function getProductReviews(productId: string): Promise<ReviewData[]> {
    await connectToDatabase();
    const reviews = await Review.find({ productId, isApproved: true })
        .sort({ createdAt: -1 })
        .lean();

    const result: ReviewData[] = [];
    for (const review of reviews) {
        const user = await User.findById(review.userId).select('displayName fullName').lean();
        result.push({
            id: String(review._id),
            product_id: String(review.productId),
            user_id: String(review.userId),
            rating: review.rating,
            title: review.title,
            body: review.body,
            is_verified: review.isVerified,
            helpful_count: review.helpfulCount,
            created_at: review.createdAt.toISOString(),
            user_name: user?.displayName || user?.fullName || 'Anonymous',
            images: review.images ? review.images.map((img: any) => ({
                url: img.url,
                altText: img.altText || null,
                sortOrder: img.sortOrder || 0,
            })) : [],
        });
    }
    return result;
}

export async function submitReview(data: {
    product_id: string;
    user_id: string;
    rating: number;
    title: string;
    body: string;
    images?: { url: string; altText?: string | null; sortOrder?: number }[];
}): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await Review.create({
            productId: data.product_id,
            userId: data.user_id,
            rating: data.rating,
            title: data.title || null,
            body: data.body || null,
            isVerified: false,
            isApproved: true,
            images: data.images || [],
        });
        return { error: null };
    } catch (err) {
        console.error('Error submitting review:', err);
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

// ============================================================================
// USER ADDRESSES
// ============================================================================

export async function getUserAddresses(userId: string): Promise<UserAddress[]> {
    await connectToDatabase();
    const addresses = await Address.find({ userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean();

    return addresses.map(a => ({
        id: String(a._id),
        user_id: String(a.userId),
        label: a.label,
        full_name: a.fullName,
        phone: a.phone,
        address_line_1: a.addressLine1,
        address_line_2: a.addressLine2,
        city: a.city,
        state: a.state,
        postal_code: a.postalCode,
        country: a.country,
        landmark: a.landmark,
        is_default: a.isDefault,
        created_at: a.createdAt.toISOString(),
        updated_at: a.updatedAt.toISOString(),
    }));
}

export async function createAddress(userId: string, data: AddressFormData): Promise<{ id: string | null; error: string | null }> {
    await connectToDatabase();
    try {
        if (data.is_default) {
            await Address.updateMany({ userId }, { isDefault: false });
        }

        const addr = await Address.create({
            userId,
            label: data.label || 'Home',
            fullName: data.full_name,
            phone: data.phone,
            addressLine1: data.address_line_1,
            addressLine2: data.address_line_2 || null,
            city: data.city,
            state: data.state,
            postalCode: data.postal_code,
            country: data.country || 'Bangladesh',
            landmark: data.landmark || null,
            isDefault: data.is_default,
        });

        return { id: String(addr._id), error: null };
    } catch (err) {
        console.error('Error creating address:', err);
        return { id: null, error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function updateAddress(id: string, userId: string, data: AddressFormData): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        if (data.is_default) {
            await Address.updateMany({ userId }, { isDefault: false });
        }

        await Address.findByIdAndUpdate(id, {
            label: data.label || 'Home',
            fullName: data.full_name,
            phone: data.phone,
            addressLine1: data.address_line_1,
            addressLine2: data.address_line_2 || null,
            city: data.city,
            state: data.state,
            postalCode: data.postal_code,
            country: data.country || 'Bangladesh',
            landmark: data.landmark || null,
            isDefault: data.is_default,
        });

        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function deleteAddress(id: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await Address.findByIdAndDelete(id);
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<{ error: string | null }> {
    await connectToDatabase();
    try {
        await Address.updateMany({ userId }, { isDefault: false });
        await Address.findByIdAndUpdate(addressId, { isDefault: true });
        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed' };
    }
}

// ============================================================================
// ORDERS
// ============================================================================

export async function getUserOrders(userId: string): Promise<UserOrder[]> {
    await connectToDatabase();
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

    return orders.map(o => ({
        id: String(o._id),
        order_number: o.orderNumber,
        status: o.status,
        payment_status: o.paymentStatus,
        subtotal: o.subtotal,
        shipping_cost: o.shippingCost,
        tax: o.tax,
        total: o.total,
        shipping_name: o.shippingName || '',
        shipping_city: o.shippingCity || '',
        shipping_state: o.shippingState || '',
        created_at: o.createdAt.toISOString(),
        order_items: (o.orderItems || []).map(item => ({
            id: String(item._id),
            product_id: String(item.productId),
            product_name: item.productName,
            product_image: item.productImage || null,
            product_slug: item.productSlug || null,
            size: item.sizeLabel || null,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
        })),
    }));
}

export async function getUserOrderCount(userId: string): Promise<number> {
    await connectToDatabase();
    return Order.countDocuments({ userId });
}

// ============================================================================
// SITE SETTINGS
// ============================================================================

export async function getSiteSettings(): Promise<Record<string, unknown>> {
    await connectToDatabase();
    const settings = await SiteSetting.find().lean();
    const result: Record<string, unknown> = {};
    settings.forEach(row => { result[row.key] = row.value; });
    return result;
}

export async function getSiteSetting(key: string): Promise<unknown> {
    await connectToDatabase();
    const setting = await SiteSetting.findOne({ key }).lean();
    return setting?.value || null;
}

// ============================================================================
// COUPONS
// ============================================================================

export async function getActiveCoupons(): Promise<CouponData[]> {
    await connectToDatabase();
    const now = new Date();
    const coupons = await Coupon.find({
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort('code').lean();

    return coupons.map(c => ({
        id: String(c._id),
        code: c.code,
        description: c.description,
        discount_type: c.discountType as 'percentage' | 'fixed_amount',
        discount_value: c.discountValue,
        minimum_order_value: c.minimumOrderValue,
        max_discount_amount: c.maxDiscountAmount,
        is_active: c.isActive,
    }));
}

// ============================================================================
// VISIBLE CHANGES
// ============================================================================

export async function getVisibleChanges(): Promise<VisibleChangeItem[]> {
    await connectToDatabase();

    const changes = await VisibleChange.find({ isActive: true })
        .populate('productId', 'name slug basePrice compareAtPrice discountPercent ratingAvg reviewCount images')
        .sort('sortOrder')
        .lean();

    return changes
        .filter(vc => vc.productId)
        .map(vc => {
            const product = vc.productId as unknown as Record<string, unknown>;
            const images = (product.images as Array<Record<string, unknown>>) || [];
            const primaryImage = images.find(i => i.isPrimary) || images[0];
            const reviewCount = Number(product.reviewCount) || 0;

            return {
                id: String(vc._id),
                slug: (product.slug as string) || '',
                beforeImage: vc.beforeImage,
                afterImage: vc.afterImage,
                beforeLabel: vc.beforeLabel,
                afterLabel: vc.afterLabel,
                productThumb: primaryImage ? (primaryImage.url as string) : '/no-image.svg',
                productName: (product.name as string) || 'Product',
                rating: Number(product.ratingAvg) || 0,
                reviewCount: reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1)}K` : String(reviewCount),
                price: Math.ceil(Number(product.basePrice) || 0),
                originalPrice: Math.ceil(Number(product.compareAtPrice) || 0),
                discountPercent: Number(product.discountPercent) || 0,
            };
        });
}

// ============================================================================
// ABOUT CONTENT
// ============================================================================

export async function getAboutContent(): Promise<Record<string, any>> {
    await connectToDatabase();
    const data = await AboutContent.find().lean();
    const map: Record<string, any> = {};
    data.forEach(row => { map[row.sectionKey] = row.content; });
    return map;
}

export type Coupon = CouponData;
export type Review = ReviewData;

export async function updateStockForOrder(orderItems: { productId: mongoose.Types.ObjectId | string; sizeLabel: string | null; quantity: number }[]): Promise<void> {
    await connectToDatabase();
    for (const item of orderItems) {
        const productId = item.productId;
        const quantity = item.quantity;
        const sizeLabel = item.sizeLabel;

        if (sizeLabel) {
            await Product.updateOne(
                { _id: productId, "sizes.label": sizeLabel },
                {
                    $inc: {
                        stockQuantity: -quantity,
                        "sizes.$.stockQuantity": -quantity
                    }
                }
            );
        } else {
            await Product.updateOne(
                { _id: productId },
                {
                    $inc: { stockQuantity: -quantity }
                }
            );
        }

        // Set inStock to false if global stock falls to 0 or below
        await Product.updateOne(
            { _id: productId, stockQuantity: { $lte: 0 } },
            { $set: { inStock: false } }
        );
    }
}

export async function getProductPageData(slug: string) {
    await connectToDatabase();
    const [product, related, threshold] = await Promise.all([
        getProductBySlug(slug),
        getRelatedProducts(slug, 4),
        getSiteSetting('free_shipping_threshold'),
    ]);
    return {
        product,
        related,
        threshold,
    };
}
