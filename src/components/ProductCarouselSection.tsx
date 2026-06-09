'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ChevronLeft, ChevronRight, Star, Check } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import type { SectionProduct } from '@/data/homeSections';

/* ─── Props ─── */
interface ProductCarouselSectionProps {
    title: string;
    subtitle: string;
    products: SectionProduct[];
    background?: string;
    showViewAll?: boolean;
    viewAllHref?: string;
}

/* ─── Component ─── */
export default function ProductCarouselSection({
    title,
    subtitle,
    products,
    background = '#ffffff',
    showViewAll = true,
    viewAllHref = '/shop',
}: ProductCarouselSectionProps) {
    const { addToCart } = useCart();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [addedIds, setAddedIds] = useState<Set<string | number>>(new Set());

    /* guards */
    if (!products || products.length === 0) return null;

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    };

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = scrollRef.current.clientWidth;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
        setTimeout(checkScroll, 350);
    };

    return (
        <section
            className="homepage-section"
            style={{
                background,
                padding: '32px 0 36px',
                position: 'relative',
            }}
        >
            {/* ── Header Row ── */}
            <div
                className="section-header-row"
                style={{
                    maxWidth: '1540px',
                    margin: '0 auto',
                    padding: '0 80px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '28px',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '28px',
                            fontWeight: 700,
                            color: '#1a1a1a',
                            marginBottom: '6px',
                            lineHeight: 1.2,
                        }}
                    >
                        {title}
                    </h2>
                    <p
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '15px',
                            color: '#888',
                            fontWeight: 400,
                        }}
                    >
                        {subtitle}
                    </p>
                </div>
                {showViewAll && (
                    <Link
                        href={viewAllHref}
                        className="view-all-btn"
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#ffffff',
                            background: '#1a1a1a',
                            border: 'none',
                            borderRadius: '24px',
                            padding: '10px 24px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none',
                            display: 'inline-block',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#333';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#1a1a1a';
                        }}
                    >
                        View All
                    </Link>
                )}
            </div>

            {/* ── Scrollable Cards Row ── */}
            <div style={{ position: 'relative', maxWidth: '1540px', margin: '0 auto' }}>
                {/* Left Arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="carousel-arrow"
                        style={{
                            position: 'absolute',
                            left: '24px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 5,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                    >
                        <ChevronLeft size={22} color="#ffffff" />
                    </button>
                )}

                {/* Right Arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="carousel-arrow"
                        style={{
                            position: 'absolute',
                            right: '24px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 5,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                    >
                        <ChevronRight size={22} color="#ffffff" />
                    </button>
                )}

                {/* Cards Container */}
                <div className="carousel-cards-container" style={{ padding: '0 80px', overflow: 'hidden' }}>
                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        style={{
                            display: 'flex',
                            gap: '20px',
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            padding: '8px 0',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                        className="hide-scrollbar carousel-scroll-track"
                    >
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                className="carousel-card"
                                style={{
                                    minWidth: 'calc((100% - 60px) / 4)',
                                    maxWidth: 'calc((100% - 60px) / 4)',
                                    height: '532px',
                                    background: '#ffffff',
                                    borderRadius: '12px',
                                    border: '1px solid #f0f0f0',
                                    overflow: 'hidden',
                                    scrollSnapAlign: 'start',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'box-shadow 0.2s ease',
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    position: 'relative',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* ── Badges (top-left of card) ── */}
                                {product.badge && (() => {
                                    const bg = product.badgeColor || '#f0c14b';
                                    const c = bg.replace('#', '');
                                    const isLight = c.length >= 6 && (0.299 * parseInt(c.substring(0, 2), 16) + 0.587 * parseInt(c.substring(2, 4), 16) + 0.114 * parseInt(c.substring(4, 6), 16)) / 255 > 0.55;
                                    return (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                background: bg,
                                                color: isLight ? '#1a1a1a' : '#ffffff',
                                                fontFamily: "'Inter', sans-serif",
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '5px 14px',
                                                borderRadius: '0 0 6px 0',
                                                zIndex: 3,
                                                letterSpacing: '0.3px',
                                            }}
                                        >
                                            {product.badge}
                                        </span>
                                    );
                                })()}
                                {product.extraBadge && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            background: product.badgeColor === '#2e7d32'
                                                ? '#e91e63'
                                                : 'rgba(46,125,50,0.9)',
                                            color: '#ffffff',
                                            fontFamily: "'Outfit', sans-serif",
                                            fontSize: product.badgeColor ? '11px' : '9px',
                                            fontWeight: product.badgeColor ? 800 : 700,
                                            padding: '6px',
                                            borderRadius: '50%',
                                            width: product.badgeColor ? '52px' : '56px',
                                            height: product.badgeColor ? '52px' : '56px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            lineHeight: 1.15,
                                            zIndex: 3,
                                            whiteSpace: 'pre-line',
                                        }}
                                    >
                                        {product.extraBadge}
                                    </span>
                                )}

                                {/* ── Image Area ── */}
                                <div
                                    className="card-image-area"
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '50%',
                                        background: '#f8f6f3',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Image
                                        src={product.image}
                                        alt={product.title}
                                        fill
                                        sizes="25vw"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>

                                {/* ── Card Content ── */}
                                <div className="card-content" style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                                    {/* Title */}
                                    <h3
                                        className="card-title"
                                        style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            color: '#1a1a1a',
                                            lineHeight: 1.4,
                                            marginBottom: '4px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {product.title}
                                    </h3>

                                    {/* Description */}
                                    <p
                                        className="card-desc"
                                        style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '13px',
                                            color: '#888',
                                            lineHeight: 1.4,
                                            marginBottom: '12px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {product.description}
                                    </p>

                                    {/* Price Row */}
                                    <div style={{ marginTop: 'auto' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            <span
                                                className="card-price"
                                                style={{
                                                    fontFamily: "'Inter', sans-serif",
                                                    fontSize: '20px',
                                                    fontWeight: 700,
                                                    color: '#1a1a1a',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                ৳{product.price}
                                            </span>
                                            {(product.originalPrice != null && product.originalPrice > 0 || (product.discountPercent != null && product.discountPercent > 0)) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {product.originalPrice != null && product.originalPrice > 0 && (
                                                        <span
                                                            className="card-original-price"
                                                            style={{
                                                                fontFamily: "'Inter', sans-serif",
                                                                fontSize: '14px',
                                                                color: '#bbb',
                                                                textDecoration: 'line-through',
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            ৳{product.originalPrice}
                                                        </span>
                                                    )}
                                                    {product.discountPercent != null && product.discountPercent > 0 && (
                                                        <span
                                                            style={{
                                                                fontFamily: "'Inter', sans-serif",
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                color: '#e67e22',
                                                            }}
                                                        >
                                                            {Math.ceil(product.discountPercent)}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Coupon */}
                                        {product.couponPrice != null && product.couponCode && (
                                            <p
                                                style={{
                                                    fontFamily: "'Inter', sans-serif",
                                                    fontSize: '11px',
                                                    color: '#2e7d32',
                                                    fontWeight: 600,
                                                    marginBottom: '12px',
                                                }}
                                            >
                                                ⭐ Get it for ৳{product.couponPrice} with {product.couponCode}
                                            </p>
                                        )}

                                        {/* Add to Cart */}
                                        <button
                                            className="card-add-btn"
                                            disabled={product.inStock === false}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (product.inStock === false) return;
                                                addToCart({
                                                    id: String(product.id),
                                                    slug: product.slug,
                                                    name: product.title,
                                                    image: product.image,
                                                    price: product.price,
                                                    originalPrice: product.originalPrice,
                                                });
                                                setAddedIds((prev) => new Set(prev).add(product.id));
                                                setTimeout(() => {
                                                    setAddedIds((prev) => {
                                                        const next = new Set(prev);
                                                        next.delete(product.id);
                                                        return next;
                                                    });
                                                }, 1500);
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                background: product.inStock === false ? '#e0e0e0' : (addedIds.has(product.id) ? '#1a1a1a' : '#f5c518'),
                                                color: product.inStock === false ? '#888' : (addedIds.has(product.id) ? '#ffffff' : '#1a1a1a'),
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '11px 0',
                                                fontFamily: "'Inter', sans-serif",
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                letterSpacing: '0.5px',
                                                cursor: product.inStock === false ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                textTransform: 'uppercase',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (product.inStock === false) return;
                                                if (!addedIds.has(product.id)) {
                                                    e.currentTarget.style.background = '#e6b800';
                                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 197, 24, 0.4)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (product.inStock === false) return;
                                                if (!addedIds.has(product.id)) {
                                                    e.currentTarget.style.background = '#f5c518';
                                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            {product.inStock === false ? (
                                                'OUT OF STOCK'
                                            ) : addedIds.has(product.id) ? (
                                                <><Check size={15} className="cart-added-check" /> ADDED!</>
                                            ) : (
                                                <><ShoppingBag size={15} /> ADD TO CART</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
