import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Sub-schemas (embedded documents) ──────────────────────────────────────

const ProductImageSchema = new Schema(
    {
        url: { type: String, required: true },
        altText: { type: String, default: null },
        isPrimary: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
    },
    { _id: true }
);

const ProductSizeSchema = new Schema(
    {
        label: { type: String, required: true },
        mlValue: { type: String, default: null },
        price: { type: Number, required: true },
        skuSuffix: { type: String, default: null },
        stockQuantity: { type: Number, default: 0 },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { _id: true }
);

const KeyBenefitSchema = new Schema(
    {
        iconName: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        sortOrder: { type: Number, default: 0 },
    },
    { _id: true }
);

const HighlightSchema = new Schema(
    {
        highlight: { type: String, required: true },
        sortOrder: { type: Number, default: 0 },
    },
    { _id: true }
);

const ProductBadgeSchema = new Schema(
    {
        badge: {
            type: String,
            enum: ['best_seller', 'new_launch', 'trending', 'selling_fast', 'premium', 'sale', 'limited_edition'],
            required: true,
        },
        customLabel: { type: String, default: null },
        badgeColor: { type: String, default: null },
        isPrimary: { type: Boolean, default: true },
        startsAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
    },
    { _id: true }
);

export interface IProductImage {
    _id: mongoose.Types.ObjectId;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
}

export interface IProductSize {
    _id: mongoose.Types.ObjectId;
    label: string;
    mlValue: string | null;
    price: number;
    skuSuffix: string | null;
    stockQuantity: number;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
}

export interface IKeyBenefit {
    _id: mongoose.Types.ObjectId;
    iconName: string;
    title: string;
    description: string;
    sortOrder: number;
}

export interface IHighlight {
    _id: mongoose.Types.ObjectId;
    highlight: string;
    sortOrder: number;
}

export interface IProductBadge {
    _id: mongoose.Types.ObjectId;
    badge: 'best_seller' | 'new_launch' | 'trending' | 'selling_fast' | 'premium' | 'sale' | 'limited_edition';
    customLabel: string | null;
    badgeColor: string | null;
    isPrimary: boolean;
    startsAt: Date | null;
    expiresAt: Date | null;
}

export interface IProduct extends Document {
    _id: mongoose.Types.ObjectId;
    brandId: mongoose.Types.ObjectId | null;
    categoryId: mongoose.Types.ObjectId | null;
    name: string;
    slug: string;
    subtitle: string | null;
    shortDescription: string | null;
    description: string | null;
    howToUse: string | null;
    ingredients: string | null;
    basePrice: number;
    compareAtPrice: number | null;
    discountPercent: number;
    costPrice: number | null;
    sku: string | null;
    barcode: string | null;
    weightGrams: number | null;
    isActive: boolean;
    isFeatured: boolean;
    inStock: boolean;
    stockQuantity: number;
    lowStockThreshold: number;
    ratingAvg: number;
    reviewCount: number;
    metaTitle: string | null;
    metaDescription: string | null;
    tags: string[];
    concerns: string[];
    images: IProductImage[];
    sizes: IProductSize[];
    keyBenefits: IKeyBenefit[];
    highlights: IHighlight[];
    badges: IProductBadge[];
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        brandId: { type: Schema.Types.ObjectId, ref: 'Brand', default: null },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        subtitle: { type: String, default: null },
        shortDescription: { type: String, default: null },
        description: { type: String, default: null },
        howToUse: { type: String, default: null },
        ingredients: { type: String, default: null },
        basePrice: { type: Number, required: true, min: 0 },
        compareAtPrice: { type: Number, default: null },
        discountPercent: { type: Number, default: 0 },
        costPrice: { type: Number, default: null },
        sku: { type: String, default: null, sparse: true },
        barcode: { type: String, default: null },
        weightGrams: { type: Number, default: null },
        isActive: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        inStock: { type: Boolean, default: true },
        stockQuantity: { type: Number, default: 0 },
        lowStockThreshold: { type: Number, default: 5 },
        ratingAvg: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        metaTitle: { type: String, default: null },
        metaDescription: { type: String, default: null },
        tags: [{ type: String }],
        concerns: [{ type: String }],
        images: [ProductImageSchema],
        sizes: [ProductSizeSchema],
        keyBenefits: [KeyBenefitSchema],
        highlights: [HighlightSchema],
        badges: [ProductBadgeSchema],
    },
    { timestamps: true }
);

// Indexes

ProductSchema.index({ brandId: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ concerns: 1 });
ProductSchema.index({ name: 'text', shortDescription: 'text', subtitle: 'text' });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
