'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Tag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/types';
import { useWishlist } from '@/lib/WishlistContext';

interface ProductCardProps {
    product: Product;
    index?: number;
}

function formatReviewCount(count: number): string {
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
    const { isWishlisted, toggleWishlist } = useWishlist();
    const wishlisted = isWishlisted(product.id);
    const discount = product.originalPrice
        ? Math.ceil(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#ffffff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #e8e8e8',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    height: '532px',
                }}
                className="product-card"
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                {/* Image Section */}
                <Link
                    href={`/product/${product.slug}`}
                    style={{
                        display: 'block',
                        position: 'relative',
                        height: '50%',
                        overflow: 'hidden',
                        background: '#f0f4f0',
                    }}
                >
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{
                            objectFit: 'cover',
                            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        className="product-image"
                    />

                    {/* Top-left Badge */}
                    {product.badge && (() => {
                        const bg = product.badgeColor || '#f0c14b';
                        const ch = bg.replace('#', '');
                        const isLight = ch.length >= 6 && (0.299 * parseInt(ch.substring(0, 2), 16) + 0.587 * parseInt(ch.substring(2, 4), 16) + 0.114 * parseInt(ch.substring(4, 6), 16)) / 255 > 0.55;
                        return (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    left: '12px',
                                    background: bg,
                                    color: isLight ? '#1a1a1a' : '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    letterSpacing: '0.5px',
                                    lineHeight: '1',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {product.badge.replace(/_/g, ' ')}
                            </span>
                        );
                    })()}

                    {/* Top-right Feature Badge (circle) */}
                    {product.featureBadge && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.92)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                                padding: '4px',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    color: '#666',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                    lineHeight: 1,
                                }}
                            >
                                Upto
                            </span>
                            <span
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 800,
                                    color: '#0d6b3d',
                                    lineHeight: 1.1,
                                }}
                            >
                                100%
                            </span>
                            <span
                                style={{
                                    fontSize: '8px',
                                    fontWeight: 600,
                                    color: '#666',
                                    textAlign: 'center',
                                    lineHeight: 1.1,
                                }}
                            >
                                {product.featureBadge}
                            </span>
                        </div>
                    )}

                    {/* Wishlist Heart */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(product.id);
                        }}
                        style={{
                            position: 'absolute',
                            top: product.featureBadge ? '84px' : '12px',
                            right: '12px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: wishlisted ? '#fef2f2' : 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(4px)',
                            border: wishlisted ? '1.5px solid #ef4444' : '1px solid #e0e0e0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            zIndex: 2,
                            boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                        }}
                    >
                        <Heart
                            size={16}
                            fill={wishlisted ? '#ef4444' : 'none'}
                            color={wishlisted ? '#ef4444' : '#888'}
                            strokeWidth={2}
                        />
                    </button>
                </Link>

                {/* Card Content */}
                <div
                    style={{
                        padding: '14px 16px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        flex: 1,
                    }}
                >

                    {/* Product Name */}
                    <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                        <h3
                            style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#1a1a1a',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                margin: 0,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {product.name}
                        </h3>
                    </Link>

                    {/* Description */}
                    {product.description && (
                        <p
                            style={{
                                fontSize: '16px',
                                color: '#888',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                margin: 0,
                            }}
                        >
                            {product.description}
                        </p>
                    )}

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Price Row */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            marginTop: '4px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '20px',
                                fontWeight: 800,
                                color: '#1a1a1a',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            ৳{Math.ceil(product.price)}
                        </span>
                        {(product.originalPrice || discount > 0) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {product.originalPrice && (
                                    <span
                                        style={{
                                            fontSize: '14px',
                                            color: '#aaa',
                                            textDecoration: 'line-through',
                                            fontWeight: 400,
                                        }}
                                    >
                                        ৳{Math.ceil(product.originalPrice)}
                                    </span>
                                )}
                                {discount > 0 && (
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: '#0d6b3d',
                                        }}
                                    >
                                        {Math.ceil(discount)}% OFF
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Offer Tag */}
                    {product.offerTag && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '2px',
                            }}
                        >
                            <Tag size={13} style={{ color: '#0d6b3d', flexShrink: 0 }} />
                            <span
                                style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#0d6b3d',
                                }}
                            >
                                {product.offerTag}
                            </span>
                        </div>
                    )}

                    {/* Add to Cart Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '12px 20px',
                            marginTop: '8px',
                            background: '#ffc817',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e6b200';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffc817';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <ShoppingCart size={16} strokeWidth={2.5} />
                        ADD TO CART
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
