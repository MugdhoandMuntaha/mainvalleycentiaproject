'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Minus,
    Plus,
    Trash2,
    ShoppingBag,
    ArrowLeft,
    ShieldCheck,
    Truck,
    Tag,
    ChevronRight,
    Star,
    ChevronDown,
    X,
    Check,
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { CartPageSkeleton } from '@/components/Skeletons';
import { getProductCards, getSiteSetting, getActiveCoupons, type ProductCard as ProductCardType, type Coupon } from '@/lib/db/queries';

export default function CartPage() {
    const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, addToCart, isHydrated } = useCart();
    const [recommended, setRecommended] = useState<ProductCardType[]>([]);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(499);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [couponDropdownOpen, setCouponDropdownOpen] = useState(false);
    const [shippingFeeMin, setShippingFeeMin] = useState<number | null>(null);

    useEffect(() => {
        getProductCards().then((data) => {
            // Shuffle and pick 6 random products that aren't already in cart
            const cartIds = new Set(items.map(i => i.id));
            const filtered = data.filter(p => !cartIds.has(p.id));
            const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 6);
            setRecommended(shuffled);
        }).catch(() => { });

        getSiteSetting('free_shipping_threshold').then((val) => {
            const v = val as { amount?: number } | null;
            if (v?.amount) setFreeShippingThreshold(v.amount);
        }).catch(() => { });

        getSiteSetting('shipping_fee').then((val) => {
            const v = val as { dhaka?: number; outside_dhaka?: number; amount?: number } | null;
            if (v?.dhaka && v?.outside_dhaka) {
                setShippingFeeMin(Math.min(v.dhaka, v.outside_dhaka));
            } else if (v?.amount) {
                setShippingFeeMin(v.amount);
            }
        }).catch(() => { });

        getActiveCoupons().then(setCoupons).catch(() => { });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Calculate coupon discount
    const couponDiscount = selectedCoupon ? (() => {
        if (totalPrice < selectedCoupon.minimum_order_value) return 0;
        if (selectedCoupon.discount_type === 'percentage') {
            let disc = Math.ceil(totalPrice * selectedCoupon.discount_value / 100);
            if (selectedCoupon.max_discount_amount) disc = Math.min(disc, selectedCoupon.max_discount_amount);
            return disc;
        }
        return selectedCoupon.discount_value;
    })() : 0;

    const savings = items.reduce((sum, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
            return sum + (item.originalPrice - item.price) * item.quantity;
        }
        return sum;
    }, 0);

    const shippingFree = totalPrice >= freeShippingThreshold;
    const amountToFreeShipping = Math.ceil(Math.max(0, freeShippingThreshold - totalPrice));

    // Prevent rendering before hydration to avoid flashing the empty state
    if (!isHydrated) {
        return <CartPageSkeleton />;
    }

    /* ===== Empty Cart ===== */
    if (items.length === 0) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '65vh', background: '#ffffff', fontFamily: "'Inter', sans-serif",
                padding: '48px 24px',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center' }}
                >
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: '#f8f8f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}>
                        <ShoppingBag size={40} color="#ccc" />
                    </div>
                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: '28px', fontWeight: 700,
                        color: '#1a1a1a', marginBottom: '8px',
                    }}>
                        Your cart is empty
                    </h1>
                    <p style={{ fontSize: '15px', color: '#888', marginBottom: '28px', maxWidth: '400px' }}>
                        Looks like you haven&apos;t added anything to your cart yet. Explore our products and find something you love!
                    </p>
                    <Link href="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '14px 36px', background: '#f5c518', color: '#1a1a1a', borderRadius: '12px',
                        fontWeight: 700, fontSize: '14px', textDecoration: 'none', textTransform: 'uppercase',
                        letterSpacing: '0.5px', transition: 'all 0.2s',
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e6b800'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f5c518'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <ArrowLeft size={16} />
                        Continue Shopping
                    </Link>
                </motion.div>
            </div>
        );
    }

    /* ===== Cart with Items ===== */
    return (
        <div style={{ background: '#f8f8f5', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {/* Breadcrumb */}
            <nav className="cart-breadcrumb" style={{
                maxWidth: '1400px', margin: '0 auto', padding: '20px 48px',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#999',
            }}>
                <Link href="/" style={{ color: '#999', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1a1a1a'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#999'}>
                    Home
                </Link>
                <ChevronRight size={14} style={{ color: '#ccc' }} />
                <span style={{ color: '#1a1a1a', fontWeight: 500 }}>Shopping Cart</span>
            </nav>

            <div className="cart-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px 72px' }}>
                {/* Title */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '28px',
                }}>
                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: '28px', fontWeight: 700,
                        color: '#1a1a1a',
                    }}>
                        Shopping Cart <span style={{ fontSize: '16px', fontWeight: 400, color: '#888' }}>
                            ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                        </span>
                    </h1>
                    <button
                        onClick={clearCart}
                        style={{
                            background: 'none', border: 'none', color: '#ef4444', fontSize: '13px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        Clear Cart
                    </button>
                </div>

                {/* Free Shipping Bar */}
                {!shippingFree && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: '#fff8e1', borderRadius: '12px', padding: '14px 20px',
                            marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
                            border: '1px solid #ffd54f',
                        }}
                    >
                        <Truck size={20} color="#f59e0b" />
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                                Add ৳{amountToFreeShipping.toFixed(0)} more for <strong>FREE shipping!</strong>
                            </p>
                            <div style={{
                                width: '100%', height: '4px', background: '#fde68a', borderRadius: '2px',
                                marginTop: '6px', overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${Math.min((totalPrice / freeShippingThreshold) * 100, 100)}%`,
                                    height: '100%', background: '#f59e0b', borderRadius: '2px',
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>
                    </motion.div>
                )}
                {shippingFree && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: '#e8f5e9', borderRadius: '12px', padding: '14px 20px',
                            marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
                            border: '1px solid #a5d6a7',
                        }}
                    >
                        <Truck size={20} color="#2e7d32" />
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#2e7d32', margin: 0 }}>
                            🎉 You&apos;ve unlocked <strong>FREE shipping!</strong>
                        </p>
                    </motion.div>
                )}

                {/* Cart Grid */}
                <div className="cart-grid" style={{
                    display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start',
                }}>
                    {/* Left — Cart Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <AnimatePresence>
                            {items.map((item) => (
                                    <motion.div
                                        key={`${item.id}-${item.size || ''}`}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="cart-item-card"
                                        style={{
                                            background: '#ffffff', borderRadius: '16px', padding: '20px',
                                            display: 'flex', gap: '20px', border: '1px solid #f0f0f0',
                                            transition: 'box-shadow 0.2s',
                                        }}
                                    onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'}
                                    onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
                                >
                                    {/* Image */}
                                    <Link href={`/product/${item.slug}`} className="cart-item-image" style={{
                                        position: 'relative', width: '120px', height: '120px',
                                        borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                                        background: '#f8f6f3',
                                    }}>
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            sizes="120px"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </Link>

                                    {/* Details */}
                                    <div className="cart-item-details" style={{ flex: 1, minWidth: 0 }}>
                                        <Link href={`/product/${item.slug}`} style={{ textDecoration: 'none' }}>
                                            <h3 style={{
                                                fontSize: '14px', fontWeight: 600, color: '#1a1a1a',
                                                lineHeight: 1.4, marginBottom: '4px',
                                                display: '-webkit-box', WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                            }}>
                                                {item.name}
                                            </h3>
                                        </Link>
                                        {item.size && (
                                            <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                                Size: {item.size}
                                            </p>
                                        )}

                                        {/* Price */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                            <span style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a' }}>
                                                ৳{item.price}
                                            </span>
                                            {item.originalPrice && item.originalPrice > item.price && (
                                                <>
                                                    <span style={{ fontSize: '13px', color: '#bbb', textDecoration: 'line-through' }}>
                                                        ৳{item.originalPrice}
                                                    </span>
                                                    {(() => {
                                                        const discountPct = Math.ceil(((item.originalPrice - item.price) / item.originalPrice) * 100);
                                                        return discountPct > 0 ? (
                                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0d6b3d' }}>
                                                                {discountPct}% OFF
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </>
                                            )}
                                        </div>

                                        {/* Quantity + Remove */}
                                        <div className="cart-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                border: '1.5px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden',
                                            }}>
                                                <button
                                                    onClick={() => {
                                                        if (item.quantity <= 1) {
                                                            removeFromCart(item.id, item.size);
                                                        } else {
                                                            updateQuantity(item.id, item.quantity - 1, item.size);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '36px', height: '36px', border: 'none', background: '#fafafa',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = '#fafafa'}
                                                >
                                                    <Minus size={14} color="#555" />
                                                </button>
                                                <span style={{
                                                    width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '14px', fontWeight: 700, color: '#1a1a1a', background: '#fff',
                                                }}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                                                    style={{
                                                        width: '36px', height: '36px', border: 'none', background: '#fafafa',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = '#fafafa'}
                                                >
                                                    <Plus size={14} color="#555" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeFromCart(item.id, item.size)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    background: 'none', border: 'none', color: '#ef4444', fontSize: '13px',
                                                    fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                                    transition: 'opacity 0.2s', padding: '4px 0',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <Trash2 size={14} />
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Item Total */}
                                    <div className="cart-item-total" style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{
                                            fontSize: '18px', fontWeight: 800, color: '#1a1a1a', marginBottom: '4px',
                                        }}>
                                            ৳{(item.price * item.quantity).toLocaleString('en-IN')}
                                        </p>
                                        {item.quantity > 1 && (
                                            <p style={{ fontSize: '12px', color: '#999' }}>
                                                ৳{item.price} × {item.quantity}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Continue Shopping Link */}
                        <Link href="/" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            color: '#555', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                            marginTop: '8px', transition: 'color 0.2s',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#1a1a1a'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#555'}
                        >
                            <ArrowLeft size={16} />
                            Continue Shopping
                        </Link>
                    </div>

                    {/* Right — Order Summary */}
                    <div className="cart-summary" style={{
                        background: '#ffffff', borderRadius: '16px', padding: '28px',
                        border: '1px solid #f0f0f0', position: 'sticky', top: '100px',
                    }}>
                        <h2 style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: 700,
                            color: '#1a1a1a', marginBottom: '20px',
                        }}>
                            Order Summary
                        </h2>

                        {/* Coupon Selector */}
                        <div style={{ marginBottom: '20px', position: 'relative' }}>
                            {selectedCoupon ? (
                                /* Applied coupon display */
                                <div style={{
                                    border: '1.5px solid #2e7d32', borderRadius: '10px',
                                    padding: '12px 14px', background: 'rgba(46,125,50,0.04)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Check size={16} color="#2e7d32" />
                                            <span style={{
                                                fontWeight: 700, fontSize: '14px', color: '#2e7d32',
                                                fontFamily: "'Outfit', sans-serif", letterSpacing: '0.5px',
                                            }}>
                                                {selectedCoupon.code}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCoupon(null)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: '#999', padding: '2px',
                                                display: 'flex', alignItems: 'center',
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px', fontWeight: 500 }}>
                                        {selectedCoupon.discount_type === 'percentage'
                                            ? `${selectedCoupon.discount_value}% off`
                                            : `৳${selectedCoupon.discount_value} off`
                                        }
                                        {selectedCoupon.minimum_order_value > 0 && ` on orders above ৳${selectedCoupon.minimum_order_value}`}
                                        {couponDiscount > 0 && ` — You save ৳${couponDiscount}`}
                                    </div>
                                    {couponDiscount === 0 && totalPrice < selectedCoupon.minimum_order_value && (
                                        <div style={{ fontSize: '11px', color: '#d32f2f', marginTop: '4px', fontWeight: 500 }}>
                                            Add ৳{selectedCoupon.minimum_order_value - totalPrice} more to use this coupon
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Dropdown selector */
                                <div>
                                    <button
                                        onClick={() => setCouponDropdownOpen(!couponDropdownOpen)}
                                        style={{
                                            display: 'flex', alignItems: 'center', width: '100%',
                                            gap: '0', border: '1.5px solid #e0e0e0', borderRadius: '10px',
                                            overflow: 'hidden', background: '#fff', cursor: 'pointer',
                                            padding: 0, textAlign: 'left',
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '0 14px', background: '#fafafa',
                                            borderRight: '1px solid #e0e0e0', alignSelf: 'stretch',
                                        }}>
                                            <Tag size={16} color="#888" />
                                        </div>
                                        <span style={{
                                            flex: 1, padding: '12px 14px', fontSize: '13px',
                                            fontFamily: "'Inter', sans-serif",
                                            color: '#888',
                                        }}>
                                            {coupons.length > 0 ? `${coupons.length} coupons available` : 'No coupons available'}
                                        </span>
                                        <div style={{ padding: '0 14px' }}>
                                            <ChevronDown
                                                size={16}
                                                color="#888"
                                                style={{
                                                    transition: 'transform 0.2s',
                                                    transform: couponDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                                                }}
                                            />
                                        </div>
                                    </button>

                                    {/* Dropdown List */}
                                    {couponDropdownOpen && coupons.length > 0 && (
                                        <div style={{
                                            position: 'absolute', left: 0, right: 0, top: '100%',
                                            marginTop: '4px', background: '#fff',
                                            border: '1.5px solid #e0e0e0', borderRadius: '10px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                            zIndex: 20, maxHeight: '240px', overflowY: 'auto',
                                        }}>
                                            {coupons.map((coupon) => {
                                                const meetsMin = totalPrice >= coupon.minimum_order_value;
                                                return (
                                                    <button
                                                        key={coupon.id}
                                                        onClick={() => {
                                                            setSelectedCoupon(coupon);
                                                            setCouponDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '12px',
                                                            width: '100%', padding: '12px 16px',
                                                            border: 'none', background: 'transparent',
                                                            cursor: 'pointer', textAlign: 'left',
                                                            borderBottom: '1px solid #f5f5f5',
                                                            transition: 'background 0.15s',
                                                            opacity: meetsMin ? 1 : 0.55,
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <div style={{
                                                            width: '40px', height: '40px', borderRadius: '8px',
                                                            background: 'linear-gradient(135deg, #f5c518, #e6b800)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0,
                                                        }}>
                                                            <Tag size={16} color="#1a1a1a" />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontWeight: 700, fontSize: '13px', color: '#1a1a1a',
                                                                fontFamily: "'Outfit', sans-serif",
                                                                letterSpacing: '0.5px',
                                                            }}>
                                                                {coupon.code}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '11px', color: '#888', marginTop: '2px',
                                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                            }}>
                                                                {coupon.description || (
                                                                    coupon.discount_type === 'percentage'
                                                                        ? `${coupon.discount_value}% off`
                                                                        : `৳${coupon.discount_value} off`
                                                                )}
                                                                {coupon.minimum_order_value > 0 && ` • Min ৳${coupon.minimum_order_value}`}
                                                            </div>
                                                            {!meetsMin && (
                                                                <div style={{ fontSize: '10px', color: '#d32f2f', marginTop: '2px', fontWeight: 500 }}>
                                                                    Need ৳{coupon.minimum_order_value - totalPrice} more
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            fontWeight: 800, fontSize: '14px',
                                                            color: meetsMin ? '#2e7d32' : '#999',
                                                            fontFamily: "'Outfit', sans-serif",
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {coupon.discount_type === 'percentage'
                                                                ? `${coupon.discount_value}%`
                                                                : `৳${coupon.discount_value}`
                                                            }
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Price Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#666' }}>Subtotal ({totalItems} items)</span>
                                <span style={{ fontWeight: 600, color: '#1a1a1a' }}>৳{totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                            {savings > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#2e7d32' }}>You Save</span>
                                    <span style={{ fontWeight: 600, color: '#2e7d32' }}>-৳{savings.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {couponDiscount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Tag size={13} /> Coupon ({selectedCoupon?.code})
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#2e7d32' }}>-৳{couponDiscount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: '#666' }}>Shipping</span>
                                <span style={{ fontWeight: 600, color: shippingFree ? '#2e7d32' : '#1a1a1a' }}>
                                    {shippingFree ? 'FREE' : (shippingFeeMin ? `From ৳${shippingFeeMin}` : 'Calculated at checkout')}
                                </span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '16px' }} />

                        {/* Total */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                            marginBottom: '24px',
                        }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>Total</span>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a' }}>
                                ৳{(totalPrice - couponDiscount).toLocaleString('en-IN')}
                            </span>
                        </div>

                        {/* Checkout Button */}
                        <Link href="/checkout" style={{
                            display: 'block', width: '100%', padding: '16px', background: '#f5c518', color: '#1a1a1a',
                            border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                            letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s ease',
                            textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", marginBottom: '12px',
                            textDecoration: 'none', textAlign: 'center',
                        }}
                            onClick={() => {
                                // Save coupon info for checkout page
                                if (selectedCoupon && couponDiscount > 0) {
                                    sessionStorage.setItem('checkout_coupon', JSON.stringify({
                                        code: selectedCoupon.code,
                                        discount: couponDiscount,
                                    }));
                                } else {
                                    sessionStorage.removeItem('checkout_coupon');
                                }
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#e6b800'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#f5c518'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            Proceed to Checkout
                        </Link>

                        {/* Trust Icons */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px',
                            paddingTop: '16px', borderTop: '1px solid #f0f0f0',
                        }}>
                            {[
                                { icon: ShieldCheck, label: '100% Genuine' },
                                { icon: Truck, label: 'Free Shipping' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <item.icon size={16} color="#2e7d32" />
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ===== Recommended For You ===== */}
                {recommended.length > 0 && (
                    <div style={{ marginTop: '48px' }}>
                        <h2 style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: 700,
                            color: '#1a1a1a', marginBottom: '20px',
                        }}>
                            You May Also Like
                        </h2>
                        <div className="cart-recommended-grid" style={{
                            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px',
                        }}>
                            {recommended.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08, duration: 0.4 }}
                                    style={{
                                        background: '#ffffff', borderRadius: '14px',
                                        border: '1px solid #f0f0f0', overflow: 'hidden',
                                        transition: 'box-shadow 0.2s, transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.07)';
                                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Image */}
                                    <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            position: 'relative', width: '100%', height: '160px',
                                            background: '#f8f6f3', overflow: 'hidden',
                                        }}>
                                            <Image
                                                src={product.primary_image_url || '/no-image.svg'}
                                                alt={product.name}
                                                fill
                                                sizes="16vw"
                                                style={{ objectFit: 'cover' }}
                                            />
                                            {product.discount_percent > 0 && (
                                                <span style={{
                                                    position: 'absolute', top: '8px', left: '8px',
                                                    background: '#ef4444', color: '#fff', fontSize: '10px',
                                                    fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                                                    fontFamily: "'Inter', sans-serif",
                                                }}>
                                                    {Math.ceil(product.discount_percent)}% OFF
                                                </span>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div style={{ padding: '12px' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px',
                                        }}>
                                            <Star size={11} fill="#e67e22" stroke="#e67e22" />
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#e67e22', fontFamily: "'Inter', sans-serif" }}>
                                                {product.rating_avg || 0}
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#999', fontFamily: "'Inter', sans-serif" }}>
                                                ({product.review_count || 0})
                                            </span>
                                        </div>

                                        <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                                            <h3 style={{
                                                fontSize: '12px', fontWeight: 600, color: '#1a1a1a',
                                                fontFamily: "'Inter', sans-serif", lineHeight: 1.4,
                                                marginBottom: '6px',
                                                display: '-webkit-box', WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                            }}>
                                                {product.name}
                                            </h3>
                                        </Link>

                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}>
                                                ৳{product.base_price}
                                            </span>
                                            {product.compare_at_price && product.compare_at_price > product.base_price && (
                                                <span style={{ fontSize: '11px', color: '#bbb', textDecoration: 'line-through', fontFamily: "'Inter', sans-serif" }}>
                                                    ৳{product.compare_at_price}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => addToCart({
                                                id: product.id,
                                                slug: product.slug,
                                                name: product.name,
                                                image: product.primary_image_url || '',
                                                price: Math.ceil(product.base_price),
                                                originalPrice: product.compare_at_price ? Math.ceil(product.compare_at_price) : undefined,
                                                size: 'Default',
                                            }, 1)}
                                            style={{
                                                width: '100%', padding: '8px', background: '#f5c518', color: '#1a1a1a',
                                                border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                                textTransform: 'uppercase', letterSpacing: '0.3px',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#e6b800'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#f5c518'; }}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
