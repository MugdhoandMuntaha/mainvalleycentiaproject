'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, MapPin, CreditCard, Loader2, Plus, Shield, Truck, Package,
    ChevronRight, Home, Briefcase, Check, X, Lock, Wallet, Edit3, Trash2, Save, Tag,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { getUserAddresses, createAddress, updateAddress, deleteAddress, getSiteSetting } from '@/lib/supabase/queries';
import type { UserAddress, AddressFormData } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';

const emptyAddress: AddressFormData = {
    label: 'Home', full_name: '', phone: '', address_line_1: '',
    address_line_2: '', city: '', state: '', postal_code: '', country: 'Bangladesh',
    landmark: '', is_default: false,
};

export default function CheckoutPage() {
    const { user, loading: authLoading } = useAuth();
    const { items, totalPrice, clearCart, isHydrated } = useCart();
    const router = useRouter();

    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
    const [addrLoading, setAddrLoading] = useState(true);
    const [showAddrForm, setShowAddrForm] = useState(false);
    const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
    const [addrForm, setAddrForm] = useState<AddressFormData>(emptyAddress);
    const [addrSaving, setAddrSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
    const navigatingAway = useRef(false);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);
    const [shippingFeeDhaka, setShippingFeeDhaka] = useState(80);
    const [shippingFeeOutside, setShippingFeeOutside] = useState(150);
    const [promoCode, setPromoCode] = useState<string | null>(null);
    const [promoDiscount, setPromoDiscount] = useState(0);

    // Determine shipping fee based on selected address region
    const selectedAddress = addresses.find(a => a.id === selectedAddr);
    const isDhaka = selectedAddress?.city?.toLowerCase().includes('dhaka') ?? false;
    const shippingFee = isDhaka ? shippingFeeDhaka : shippingFeeOutside;
    const shipping = totalPrice >= freeShippingThreshold ? 0 : shippingFee;
    const grandTotal = Math.ceil(totalPrice - promoDiscount + shipping);

    useEffect(() => {
        if (!authLoading && !user) router.push('/auth');
    }, [user, authLoading, router]);

    useEffect(() => {
        Promise.all([
            getSiteSetting('free_shipping_threshold'),
            getSiteSetting('shipping_fee'),
        ]).then(([threshold, fee]) => {
            const t = threshold as { amount?: number } | null;
            const f = fee as { dhaka?: number; outside_dhaka?: number; amount?: number } | null;
            if (t?.amount) setFreeShippingThreshold(t.amount);
            // New two-tier format
            if (f?.dhaka) setShippingFeeDhaka(f.dhaka);
            if (f?.outside_dhaka) setShippingFeeOutside(f.outside_dhaka);
            // Fallback for old single-value format
            if (!f?.dhaka && f?.amount) { setShippingFeeDhaka(f.amount); setShippingFeeOutside(f.amount); }
        }).catch(() => { });
    }, []);

    // Load coupon from sessionStorage (set by cart page)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('checkout_coupon');
            if (raw) {
                const couponData = JSON.parse(raw);
                if (couponData.code && couponData.discount > 0) {
                    setPromoCode(couponData.code);
                    setPromoDiscount(couponData.discount);
                }
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        // Only redirect if hydration is complete and cart is empty
        if (isHydrated && !authLoading && items.length === 0 && !navigatingAway.current) {
            router.push('/cart');
        }
    }, [items, authLoading, router, isHydrated]);

    const loadAddresses = useCallback(async () => {
        if (!user) return;
        setAddrLoading(true);
        const data = await getUserAddresses(user.id);
        setAddresses(data);
        // Don't auto-select — user must explicitly choose an address
        setAddrLoading(false);
    }, [user]);

    useEffect(() => { if (user) loadAddresses(); }, [user, loadAddresses]);

    const openAddrCreate = () => {
        setEditingAddrId(null);
        setAddrForm(emptyAddress);
        setError('');
        setShowAddrForm(true);
    };

    const openAddrEdit = (addr: UserAddress) => {
        setEditingAddrId(addr.id);
        setAddrForm({
            label: addr.label, full_name: addr.full_name, phone: addr.phone,
            address_line_1: addr.address_line_1, address_line_2: addr.address_line_2 || '',
            city: addr.city, state: addr.state, postal_code: addr.postal_code,
            country: addr.country, landmark: addr.landmark || '', is_default: addr.is_default,
        });
        setError('');
        setShowAddrForm(true);
    };

    const handleAddrSave = async () => {
        if (!user) return;
        if (!addrForm.full_name || !addrForm.phone || !addrForm.address_line_1 || !addrForm.city || !addrForm.state || !addrForm.postal_code) {
            setError('Please fill all required fields'); return;
        }
        setAddrSaving(true);
        setError('');
        if (editingAddrId) {
            const res = await updateAddress(editingAddrId, user.id, addrForm);
            setAddrSaving(false);
            if (res.error) { setError(res.error); return; }
        } else {
            const res = await createAddress(user.id, addrForm);
            setAddrSaving(false);
            if (res.error) { setError(res.error); return; }
            if (res.id) setSelectedAddr(res.id);
        }
        setShowAddrForm(false);
        setAddrForm(emptyAddress);
        setEditingAddrId(null);
        await loadAddresses();
    };

    const handleAddrDelete = async () => {
        if (!deleteConfirmId) return;
        await deleteAddress(deleteConfirmId);
        if (selectedAddr === deleteConfirmId) setSelectedAddr(null);
        setDeleteConfirmId(null);
        await loadAddresses();
    };

    const handlePay = async () => {
        if (!user || !selectedAddr) { setError('Please select a delivery address'); return; }
        const addr = addresses.find(a => a.id === selectedAddr);
        if (!addr) return;

        setPaying(true);
        setError('');

        try {
            // Get user's access token for RLS
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            const orderPayload = {
                userId: user.id,
                email: user.email,
                accessToken,
                items: items.map(i => ({ id: i.id, name: i.name, image: i.image, slug: i.slug, size: i.size, quantity: i.quantity, price: i.price })),
                address: {
                    full_name: addr.full_name,
                    phone: addr.phone,
                    address_line_1: addr.address_line_1,
                    address_line_2: addr.address_line_2,
                    city: addr.city,
                    state: addr.state,
                    postal_code: addr.postal_code,
                    country: addr.country,
                },
                subtotal: totalPrice,
                shipping,
                tax: 0,
                total: grandTotal,
            };

            if (paymentMethod === 'cod') {
                // COD flow — create order directly, no payment gateway
                const res = await fetch('/api/payment/cod', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload),
                });

                const data = await res.json();
                if (data.success) {
                    // Store order data for the confirmation page FIRST
                    sessionStorage.setItem('cod_order', JSON.stringify({
                        orderNumber: data.orderNumber,
                        items: data.items,
                        address: orderPayload.address,
                        subtotal: totalPrice,
                        shipping,
                        total: grandTotal,
                        promoCode: promoCode || undefined,
                        promoDiscount: promoDiscount > 0 ? promoDiscount : undefined,
                    }));
                    navigatingAway.current = true;
                    clearCart();
                    // Use hard navigation to avoid useEffect redirect race condition
                    window.location.href = '/checkout/cod-confirmed';
                } else {
                    setError(data.error || 'Failed to place order');
                    setPaying(false);
                }
            } else {
                // Online payment flow — SSLCommerz
                const res = await fetch('/api/payment/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload),
                });

                const data = await res.json();
                if (data.url) {
                    // Don't clear cart here — if user backs out of payment gateway,
                    // cart items should be preserved. Cart is cleared on the success page.
                    window.location.href = data.url;
                } else {
                    setError(data.error || 'Payment initiation failed');
                    setPaying(false);
                }
            }
        } catch {
            setError('Network error. Please try again.');
            setPaying(false);
        }

    };

    if (authLoading || !user || !isHydrated) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f5' }}>
                <Loader2 size={28} color="#f5c518" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f5', fontFamily: "'Inter', sans-serif", overflowX: 'hidden', width: '100%' }}>
            {/* Header */}
            <div className="checkout-header-outer" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '28px 0' }}>
                <div className="checkout-header-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>
                    <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#999', fontSize: 13, textDecoration: 'none', marginBottom: 12 }}>
                        <ArrowLeft size={16} /> Back to Cart
                    </Link>
                    <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>Checkout</h1>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Complete your order securely</p>
                </div>
            </div>

            {/* Main */}
            <div className="checkout-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Step 1: Address */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div className="checkout-card" style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', color: '#f5c518', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>1</div>
                                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Delivery Address</h2>
                            </div>

                            {addrLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
                                    <Loader2 size={20} color="#f5c518" style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : addresses.length === 0 && !showAddrForm ? (
                                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                    <MapPin size={32} style={{ color: '#ccc', marginBottom: 8 }} />
                                    <p style={{ color: '#888', fontSize: 14, fontWeight: 600 }}>No saved addresses</p>
                                    <button onClick={openAddrCreate} style={accentBtn}>
                                        <Plus size={14} /> Add Address
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {addresses.map(addr => (
                                            <div key={addr.id} style={{
                                                display: 'flex', alignItems: 'flex-start', gap: 14,
                                                padding: '14px 16px', borderRadius: 12,
                                                border: selectedAddr === addr.id ? '1.5px solid #f5c518' : '1px solid #f0f0f0',
                                                background: selectedAddr === addr.id ? 'rgba(245,197,24,0.03)' : '#fafafa',
                                                transition: 'all 0.2s',
                                            }}>
                                                <div
                                                    onClick={() => setSelectedAddr(selectedAddr === addr.id ? null : addr.id)}
                                                    style={{
                                                        width: 18, height: 18, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                                                        border: selectedAddr === addr.id ? '5px solid #f5c518' : '2px solid #ccc',
                                                        background: '#fff', transition: 'all 0.2s', cursor: 'pointer',
                                                    }}
                                                />
                                                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelectedAddr(selectedAddr === addr.id ? null : addr.id)}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                        {addr.label === 'Office' ? <Briefcase size={14} color="#4285f4" /> : <Home size={14} color="#f5c518" />}
                                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{addr.label}</span>
                                                        {addr.is_default && <span style={{ fontSize: 10, fontWeight: 700, color: '#f5c518', background: 'rgba(245,197,24,0.1)', padding: '1px 6px', borderRadius: 10 }}>Default</span>}
                                                    </div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>{addr.full_name}</div>
                                                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginTop: 2 }}>
                                                        {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}, {addr.city}, {addr.state} {addr.postal_code}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{addr.phone}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginTop: 2 }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openAddrEdit(addr); }}
                                                        style={addrActionBtn}
                                                        title="Edit address"
                                                    >
                                                        <Edit3 size={13} color="#888" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(addr.id); }}
                                                        style={addrActionBtn}
                                                        title="Delete address"
                                                    >
                                                        <Trash2 size={13} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {!showAddrForm && (
                                        <button onClick={openAddrCreate} style={{ ...accentBtn, marginTop: 12, fontSize: 12 }}>
                                            <Plus size={13} /> Add New Address
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Address Form (Add / Edit) */}
                            {showAddrForm && (
                                <div style={{ marginTop: 16, padding: 20, background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                                            {editingAddrId ? 'Edit Address' : 'New Address'}
                                        </h3>
                                        <button onClick={() => { setShowAddrForm(false); setEditingAddrId(null); setAddrForm(emptyAddress); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <X size={16} color="#999" />
                                        </button>
                                    </div>
                                    <div className="checkout-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                        <div>
                                            <label style={formLabel}>Label</label>
                                            <select value={addrForm.label} onChange={e => setAddrForm(p => ({ ...p, label: e.target.value }))} style={{ ...formInput, cursor: 'pointer' }}>
                                                {['Home', 'Office', 'Other'].map(l => <option key={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={formLabel}>Full Name *</label>
                                            <input value={addrForm.full_name} onChange={e => setAddrForm(p => ({ ...p, full_name: e.target.value }))} style={formInput} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={formLabel}>Phone *</label>
                                        <input value={addrForm.phone} onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))} style={formInput} />
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={formLabel}>Address *</label>
                                        <input value={addrForm.address_line_1} onChange={e => setAddrForm(p => ({ ...p, address_line_1: e.target.value }))} style={formInput} />
                                    </div>
                                    <div className="checkout-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                        <div><label style={formLabel}>City *</label><input value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} style={formInput} /></div>
                                        <div><label style={formLabel}>State *</label><input value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))} style={formInput} /></div>
                                    </div>
                                    <div className="checkout-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                        <div><label style={formLabel}>Postal Code *</label><input value={addrForm.postal_code} onChange={e => setAddrForm(p => ({ ...p, postal_code: e.target.value }))} style={formInput} /></div>
                                        <div><label style={formLabel}>Country</label><input value={addrForm.country} onChange={e => setAddrForm(p => ({ ...p, country: e.target.value }))} style={formInput} /></div>
                                    </div>
                                    <button onClick={handleAddrSave} disabled={addrSaving} style={{
                                        padding: '10px 20px', background: '#1a1a1a', color: '#f5c518', border: 'none', borderRadius: 8,
                                        fontSize: 13, fontWeight: 700, cursor: addrSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        {addrSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : editingAddrId ? <Save size={14} /> : <Check size={14} />}
                                        {editingAddrId ? 'Update Address' : 'Save & Use'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Step 2: Items */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                        <div className="checkout-card" style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', color: '#f5c518', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>2</div>
                                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Order Items ({items.length})</h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {items.map((item, i) => {
                                    const key = item.size ? `${item.id}-${item.size}` : item.id;
                                    return (
                                        <div key={key} className="checkout-item-row" style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                            <div style={{
                                                width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                                                background: '#f5f5f0', border: '1px solid #f0f0f0',
                                            }}>
                                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="checkout-item-name" style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                                {item.size && <span style={{ fontSize: 11, color: '#888', background: '#f5f5f0', padding: '1px 6px', borderRadius: 4 }}>Size: {item.size}</span>}
                                                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Qty: {item.quantity}</div>
                                            </div>
                                            <div className="checkout-item-price" style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                ৳{(item.price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Summary */}
                <motion.div className="checkout-summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
                    style={{ position: 'sticky', top: 24 }}>
                    <div className="checkout-card" style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>Order Summary</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                            <SummaryRow label="Subtotal" value={`৳${totalPrice.toLocaleString()}`} />
                            {promoCode && promoDiscount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span style={{ color: '#2e7d32', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Tag size={13} /> Coupon ({promoCode})
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#2e7d32' }}>-৳{promoDiscount.toLocaleString()}</span>
                                </div>
                            )}
                            <SummaryRow label="Shipping" value={shipping === 0 ? 'FREE' : `৳${shipping}`} accent={shipping === 0} />
                        </div>

                        <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: 14, marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>Total</span>
                                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#1a1a1a' }}>৳{grandTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        {shipping === 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                                <Truck size={14} /> Free shipping on orders ৳{freeShippingThreshold}+
                            </div>
                        )}

                        {/* Payment Method Selection */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Payment Method</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                                    border: paymentMethod === 'online' ? '1.5px solid #f5c518' : '1px solid #f0f0f0',
                                    background: paymentMethod === 'online' ? 'rgba(245,197,24,0.04)' : '#fafafa',
                                    transition: 'all 0.2s',
                                }}>
                                    <input type="radio" name="paymentMethod" checked={paymentMethod === 'online'}
                                        onChange={() => setPaymentMethod('online')}
                                        style={{ accentColor: '#f5c518' }} />
                                    <CreditCard size={18} color={paymentMethod === 'online' ? '#f5c518' : '#999'} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Online Payment</div>
                                        <div style={{ fontSize: 11, color: '#999' }}>Pay via SSLCommerz (Cards, bKash, Nagad)</div>
                                    </div>
                                </label>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                                    border: paymentMethod === 'cod' ? '1.5px solid #f5c518' : '1px solid #f0f0f0',
                                    background: paymentMethod === 'cod' ? 'rgba(245,197,24,0.04)' : '#fafafa',
                                    transition: 'all 0.2s',
                                }}>
                                    <input type="radio" name="paymentMethod" checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                        style={{ accentColor: '#f5c518' }} />
                                    <Wallet size={18} color={paymentMethod === 'cod' ? '#f5c518' : '#999'} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Cash on Delivery</div>
                                        <div style={{ fontSize: 11, color: '#999' }}>Pay when you receive your order</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 12, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                                {error}
                            </div>
                        )}

                        {!selectedAddr && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                                fontSize: 12, fontWeight: 600,
                                background: 'rgba(245,197,24,0.08)',
                                color: '#b8960a',
                                border: '1px solid rgba(245,197,24,0.2)',
                            }}>
                                <MapPin size={14} style={{ flexShrink: 0 }} />
                                Please select a delivery address to continue
                            </div>
                        )}

                        <button
                            onClick={handlePay}
                            disabled={paying || !selectedAddr}
                            style={{
                                width: '100%', padding: '14px 0', background: !selectedAddr ? '#e0e0e0' : 'linear-gradient(135deg, #f5c518, #e6b800)',
                                border: 'none', borderRadius: 12, cursor: paying ? 'wait' : !selectedAddr ? 'not-allowed' : 'pointer',
                                fontSize: 15, fontWeight: 700, color: !selectedAddr ? '#999' : '#1a1a1a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                                boxShadow: selectedAddr ? '0 4px 16px rgba(245,197,24,0.3)' : 'none',
                            }}
                        >
                            {paying ? (
                                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                            ) : paymentMethod === 'cod' ? (
                                <><Wallet size={18} /> Place Order (Cash on Delivery)</>
                            ) : (
                                <><CreditCard size={18} /> Pay ৳{grandTotal.toLocaleString()}</>
                            )}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 11, color: '#bbb', fontWeight: 500 }}>
                            <Lock size={12} /> Secured by SSLCommerz
                        </div>

                        {/* Trust badges */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, padding: '14px 0', borderTop: '1px solid #f5f5f5' }}>
                            <div style={{ textAlign: 'center' }}>
                                <Shield size={18} color="#22c55e" style={{ marginBottom: 4 }} />
                                <div style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>Secure Payment</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <Package size={18} color="#3b82f6" style={{ marginBottom: 4 }} />
                                <div style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>Easy Returns</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <Truck size={18} color="#f5c518" style={{ marginBottom: 4 }} />
                                <div style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>Fast Delivery</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
            {/* Delete Address Confirmation */}
            {deleteConfirmId && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                }} onClick={() => setDeleteConfirmId(null)}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center',
                    }} onClick={e => e.stopPropagation()}>
                        <Trash2 size={32} style={{ color: '#ef4444', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Delete Address?</h3>
                        <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setDeleteConfirmId(null)} style={{
                                flex: 1, padding: '10px 0', background: '#f5f5f5', color: '#666',
                                border: '1px solid #e8e8e8', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            }}>Cancel</button>
                            <button onClick={handleAddrDelete} style={{
                                flex: 1, padding: '10px 0', background: '#ef4444', color: '#fff',
                                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                /* Base: ensure checkout wrapper never overflows */
                .checkout-page-root {
                    overflow-x: hidden;
                    width: 100%;
                    max-width: 100vw;
                }

                /* Desktop grid */
                .checkout-grid {
                    box-sizing: border-box;
                }

                /* ---- Tablet (≤1100px) ---- */
                @media (max-width: 1100px) {
                    .checkout-grid {
                        grid-template-columns: 1fr 340px !important;
                        padding: 24px 24px 80px !important;
                        gap: 20px !important;
                    }
                }

                /* ---- Mobile (≤768px) ---- */
                @media (max-width: 768px) {
                    .checkout-header-outer {
                        padding: 20px 0 !important;
                    }
                    .checkout-header-inner {
                        padding: 0 16px !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .checkout-header-inner h1 {
                        font-size: 22px !important;
                    }
                    .checkout-header-inner p {
                        font-size: 12px !important;
                    }
                    .checkout-grid {
                        grid-template-columns: 1fr !important;
                        padding: 16px 16px 60px !important;
                        gap: 16px !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        margin: 0 !important;
                    }
                    .checkout-card {
                        padding: 18px 14px !important;
                        border-radius: 12px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                    }
                    .checkout-summary {
                        position: static !important;
                    }
                    .checkout-form-row {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                    }
                    .checkout-item-row {
                        gap: 10px !important;
                    }
                    .checkout-item-name {
                        font-size: 13px !important;
                    }
                    .checkout-item-price {
                        font-size: 13px !important;
                        min-width: 0 !important;
                    }
                }

                /* ---- Small Mobile (≤480px) ---- */
                @media (max-width: 480px) {
                    .checkout-grid {
                        padding: 12px 12px 60px !important;
                    }
                    .checkout-card {
                        padding: 16px 12px !important;
                        border-radius: 10px !important;
                    }
                    .checkout-header-inner h1 {
                        font-size: 20px !important;
                    }
                }
            `}</style>
        </div>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: '#888', fontWeight: 500 }}>{label}</span>
            <span style={{ fontWeight: 600, color: accent ? '#16a34a' : '#1a1a1a' }}>{value}</span>
        </div>
    );
}

const accentBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    background: '#1a1a1a', color: '#f5c518', border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
};

const formLabel: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
};

const formInput: React.CSSProperties = {
    width: '100%', padding: '8px 12px', background: '#fff',
    border: '1px solid #e8e8e8', borderRadius: 6, fontSize: 13,
    fontFamily: "'Inter', sans-serif", outline: 'none', color: '#1a1a1a',
};

const addrActionBtn: React.CSSProperties = {
    background: '#fff', border: '1px solid #f0f0f0', borderRadius: 6,
    padding: 6, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.2s',
};
