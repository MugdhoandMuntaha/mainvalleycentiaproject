/* ===== Shared Product types ===== */

export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    rating: number;
    reviewCount: number;
    badge?: string;
    badgeColor?: string;
    featureBadge?: string;
    offerTag?: string;
    inStock: boolean;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    image: string;
    productCount: number;
}
