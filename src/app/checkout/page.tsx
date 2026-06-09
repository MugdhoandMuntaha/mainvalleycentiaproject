'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, MapPin, CreditCard, Loader2, Plus, Shield, Truck, Package,
    Home, Briefcase, Check, X, Lock, Wallet, Edit3, Trash2, Save, Tag,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { CheckoutPageSkeleton } from '@/components/Skeletons';
import { getUserAddresses, createAddress, updateAddress, deleteAddress, getSiteSetting } from '@/lib/db/queries';
import type { UserAddress, AddressFormData } from '@/lib/db/queries';

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
    const addressSectionRef = useRef<HTMLDivElement>(null);
    const [shakeWarning, setShakeWarning] = useState(false);
    const [blinkAddresses, setBlinkAddresses] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);
    const [shippingFeeDhaka, setShippingFeeDhaka] = useState(80);
    const [shippingFeeOutside, setShippingFeeOutside] = useState(150);
    const [promoCode, setPromoCode] = useState<string | null>(null);
    const [promoDiscount, setPromoDiscount] = useState(0);

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
            if (f?.dhaka) setShippingFeeDhaka(f.dhaka);
            if (f?.outside_dhaka) setShippingFeeOutside(f.outside_dhaka);
            if (!f?.dhaka && f?.amount) { setShippingFeeDhaka(f.amount); setShippingFeeOutside(f.amount); }
        }).catch(() => { });
    }, []);

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
        if (isHydrated && !authLoading && items.length === 0 && !navigatingAway.current) {
            router.push('/cart');
        }
    }, [items, authLoading, router, isHydrated]);

    const loadAddresses = useCallback(async () => {
        if (!user) return;
        setAddrLoading(true);
        const data = await getUserAddresses(user.id);
        setAddresses(data);
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
        if (!user) return;
        if (!selectedAddr) {
            setShowWarning(true);
            setShakeWarning(true);
            setBlinkAddresses(true);
            addressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                setShakeWarning(false);
                setBlinkAddresses(false);
            }, 800);
            setError('Please select a delivery address');
            return;
        }
        const addr = addresses.find(a => a.id === selectedAddr);
        if (!addr) return;

        setPaying(true);
        setError('');

        try {
            const orderPayload = {
                userId: user.id,
                email: user.email,
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
                const res = await fetch('/api/payment/cod', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload),
                });
                const data = await res.json();
                if (data.success) {
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
                    window.location.href = '/checkout/cod-confirmed';
                } else {
                    setError(data.error || 'Failed to place order');
                    setPaying(false);
                }
            } else {
                const res = await fetch('/api/payment/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload),
                });
                const data = await res.json();
                if (data.url) {
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
        return <CheckoutPageSkeleton />;
    }

    return (
        <div className="co-root">
            {/* ── Header ── */}
            <div className="co-header">
                <div className="co-header-inner">
                    <Link href="/cart" className="co-back-link">
                        <ArrowLeft size={15} /> Back to Cart
                    </Link>
                    <h1 className="co-title">Checkout</h1>
                    <p className="co-subtitle">Complete your order securely</p>
                </div>
            </div>

            {/* ── Main Layout ── */}
            <div className="co-layout">

                {/* ── Left Column ── */}
                <div className="co-left">

                    {/* Step 1: Address */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div ref={addressSectionRef} className="co-card">
                            <div className="co-step-header">
                                <div className="co-step-num">1</div>
                                <h2 className="co-step-title">Delivery Address</h2>
                            </div>

                            {addrLoading ? (
                                <div className="co-center-pad">
                                    <Loader2 size={20} color="#f5c518" className="co-spinner" />
                                </div>
                            ) : addresses.length === 0 && !showAddrForm ? (
                                <div className="co-empty-addr">
                                    <MapPin size={32} color="#ccc" />
                                    <p>No saved addresses</p>
                                    <button onClick={openAddrCreate} className="co-accent-btn">
                                        <Plus size={14} /> Add Address
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="co-addr-list">
                                        {addresses.map(addr => (
                                            <div
                                                key={addr.id}
                                                className={`co-addr-card${selectedAddr === addr.id ? ' co-addr-card--selected' : ''}${blinkAddresses ? ' co-addr-card--blink' : ''}`}
                                                onClick={() => setSelectedAddr(selectedAddr === addr.id ? null : addr.id)}
                                            >
                                                <div className={`co-radio${selectedAddr === addr.id ? ' co-radio--on' : ''}`} />
                                                <div className="co-addr-body">
                                                    <div className="co-addr-top">
                                                        {addr.label === 'Office'
                                                            ? <Briefcase size={13} color="#4285f4" />
                                                            : <Home size={13} color="#f5c518" />}
                                                        <span className="co-addr-label">{addr.label}</span>
                                                        {addr.is_default && <span className="co-default-badge">Default</span>}
                                                    </div>
                                                    <div className="co-addr-name">{addr.full_name}</div>
                                                    <div className="co-addr-text">
                                                        {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}, {addr.city}, {addr.state} {addr.postal_code}
                                                    </div>
                                                    <div className="co-addr-phone">{addr.phone}</div>
                                                </div>
                                                <div className="co-addr-actions" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => openAddrEdit(addr)} className="co-icon-btn" title="Edit">
                                                        <Edit3 size={13} color="#888" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirmId(addr.id)} className="co-icon-btn" title="Delete">
                                                        <Trash2 size={13} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {!showAddrForm && (
                                        <button onClick={openAddrCreate} className="co-accent-btn co-add-btn">
                                            <Plus size={13} /> Add New Address
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Address Form */}
                            {showAddrForm && (
                                <div className="co-form-wrap">
                                    <div className="co-form-header">
                                        <h3>{editingAddrId ? 'Edit Address' : 'New Address'}</h3>
                                        <button onClick={() => { setShowAddrForm(false); setEditingAddrId(null); setAddrForm(emptyAddress); }} className="co-close-btn">
                                            <X size={16} color="#999" />
                                        </button>
                                    </div>
                                    <div className="co-form-grid">
                                        <div>
                                            <label className="co-label">Label</label>
                                            <select value={addrForm.label} onChange={e => setAddrForm(p => ({ ...p, label: e.target.value }))} className="co-input">
                                                {['Home', 'Office', 'Other'].map(l => <option key={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="co-label">Full Name *</label>
                                            <input value={addrForm.full_name} onChange={e => setAddrForm(p => ({ ...p, full_name: e.target.value }))} className="co-input" />
                                        </div>
                                    </div>
                                    <div className="co-form-field">
                                        <label className="co-label">Phone *</label>
                                        <input value={addrForm.phone} onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))} className="co-input" />
                                    </div>
                                    <div className="co-form-field">
                                        <label className="co-label">Address Line 1 *</label>
                                        <input value={addrForm.address_line_1} onChange={e => setAddrForm(p => ({ ...p, address_line_1: e.target.value }))} className="co-input" />
                                    </div>
                                    <div className="co-form-grid">
                                        <div>
                                            <label className="co-label">City *</label>
                                            <input value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} className="co-input" />
                                        </div>
                                        <div>
                                            <label className="co-label">State *</label>
                                            <input value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))} className="co-input" />
                                        </div>
                                    </div>
                                    <div className="co-form-grid">
                                        <div>
                                            <label className="co-label">Postal Code *</label>
                                            <input value={addrForm.postal_code} onChange={e => setAddrForm(p => ({ ...p, postal_code: e.target.value }))} className="co-input" />
                                        </div>
                                        <div>
                                            <label className="co-label">Country</label>
                                            <input value={addrForm.country} onChange={e => setAddrForm(p => ({ ...p, country: e.target.value }))} className="co-input" />
                                        </div>
                                    </div>
                                    {error && <div className="co-error">{error}</div>}
                                    <button onClick={handleAddrSave} disabled={addrSaving} className="co-save-btn">
                                        {addrSaving ? <Loader2 size={14} className="co-spinner" /> : editingAddrId ? <Save size={14} /> : <Check size={14} />}
                                        {editingAddrId ? 'Update Address' : 'Save & Use'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Step 2: Order Items */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                        <div className="co-card">
                            <div className="co-step-header">
                                <div className="co-step-num">2</div>
                                <h2 className="co-step-title">Order Items ({items.length})</h2>
                            </div>
                            <div className="co-items">
                                {items.map((item, i) => {
                                    const key = item.size ? `${item.id}-${item.size}` : item.id;
                                    return (
                                        <div key={key} className={`co-item${i < items.length - 1 ? ' co-item--border' : ''}`}>
                                            <div className="co-item-img">
                                                <img src={item.image} alt={item.name} />
                                            </div>
                                            <div className="co-item-info">
                                                <div className="co-item-top-row">
                                                    <div className="co-item-name">{item.name}</div>
                                                    <div className="co-item-price">৳{(item.price * item.quantity).toLocaleString()}</div>
                                                </div>
                                                <div className="co-item-meta">
                                                    {item.size && <span className="co-item-size">Size: {item.size}</span>}
                                                    <span className="co-item-qty">Qty: {item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Right Column: Summary ── */}
                <motion.div
                    className="co-summary-wrap"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <div className="co-card">
                        <h3 className="co-summary-title">Order Summary</h3>

                        <div className="co-summary-rows">
                            <div className="co-summary-row">
                                <span className="co-summary-label">Subtotal</span>
                                <span className="co-summary-val">৳{totalPrice.toLocaleString()}</span>
                            </div>
                            {promoCode && promoDiscount > 0 && (
                                <div className="co-summary-row">
                                    <span className="co-summary-label co-summary-label--green">
                                        <Tag size={12} /> Coupon ({promoCode})
                                    </span>
                                    <span className="co-summary-val co-summary-val--green">-৳{promoDiscount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="co-summary-row">
                                <span className="co-summary-label">Shipping</span>
                                <span className={`co-summary-val${shipping === 0 ? ' co-summary-val--green' : ''}`}>
                                    {shipping === 0 ? 'FREE' : `৳${shipping}`}
                                </span>
                            </div>
                        </div>

                        <div className="co-total-row">
                            <span className="co-total-label">Total</span>
                            <span className="co-total-val">৳{grandTotal.toLocaleString()}</span>
                        </div>

                        {shipping === 0 && (
                            <div className="co-free-ship">
                                <Truck size={13} /> Free shipping on orders ৳{freeShippingThreshold}+
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="co-pay-section">
                            <div className="co-pay-title">Payment Method</div>
                            <label className={`co-pay-option${paymentMethod === 'online' ? ' co-pay-option--on' : ''}`}>
                                <input type="radio" name="paymentMethod" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                                <CreditCard size={17} color={paymentMethod === 'online' ? '#f5c518' : '#999'} />
                                <div>
                                    <div className="co-pay-name">Online Payment</div>
                                    <div className="co-pay-desc">Cards, bKash, Nagad via SSLCommerz</div>
                                </div>
                            </label>
                            <label className={`co-pay-option${paymentMethod === 'cod' ? ' co-pay-option--on' : ''}`}>
                                <input type="radio" name="paymentMethod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                <Wallet size={17} color={paymentMethod === 'cod' ? '#f5c518' : '#999'} />
                                <div>
                                    <div className="co-pay-name">Cash on Delivery</div>
                                    <div className="co-pay-desc">Pay when you receive your order</div>
                                </div>
                            </label>
                        </div>

                        {error && (
                            <motion.div
                                className="co-error"
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{
                                    opacity: 1,
                                    height: 'auto',
                                    marginBottom: 12,
                                    x: (shakeWarning && error.includes('address')) ? [0, -10, 10, -10, 10, -5, 5, 0] : 0,
                                    scale: (shakeWarning && error.includes('address')) ? [1, 1.03, 1.03, 1] : 1,
                                }}
                                transition={{ duration: 0.3 }}
                                style={{ overflow: 'hidden' }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            onClick={handlePay}
                            disabled={paying}
                            className="co-pay-btn"
                        >
                            {paying ? (
                                <><Loader2 size={17} className="co-spinner" /> Processing...</>
                            ) : paymentMethod === 'cod' ? (
                                <><Wallet size={17} /> Place Order (COD)</>
                            ) : (
                                <><CreditCard size={17} /> Pay ৳{grandTotal.toLocaleString()}</>
                            )}
                        </button>

                        <div className="co-secure">
                            <Lock size={11} /> Secured by SSLCommerz
                        </div>

                        <div className="co-trust">
                            <div className="co-trust-item">
                                <Shield size={17} color="#22c55e" />
                                <span>Secure</span>
                            </div>
                            <div className="co-trust-item">
                                <Package size={17} color="#3b82f6" />
                                <span>Returns</span>
                            </div>
                            <div className="co-trust-item">
                                <Truck size={17} color="#f5c518" />
                                <span>Fast Delivery</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Delete Confirm Modal */}
            {deleteConfirmId && (
                <div className="co-modal-bg" onClick={() => setDeleteConfirmId(null)}>
                    <div className="co-modal" onClick={e => e.stopPropagation()}>
                        <Trash2 size={30} color="#ef4444" />
                        <h3>Delete Address?</h3>
                        <p>This action cannot be undone.</p>
                        <div className="co-modal-btns">
                            <button onClick={() => setDeleteConfirmId(null)} className="co-modal-cancel">Cancel</button>
                            <button onClick={handleAddrDelete} className="co-modal-delete">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* ────── Base ────── */
                .co-root {
                    min-height: 100vh;
                    background: #f4f4f0;
                    font-family: 'Inter', sans-serif;
                    overflow-x: hidden;
                    width: 100%;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .co-spinner { animation: spin 0.9s linear infinite; }
                .co-loading {
                    min-height: 60vh; display: flex;
                    align-items: center; justify-content: center; background: #f4f4f0;
                }

                /* ────── Header ────── */
                .co-header {
                    background: linear-gradient(135deg,#1a1a1a 0%,#2e2e2e 100%);
                    padding: 24px 0;
                }
                .co-header-inner {
                    max-width: 1140px;
                    margin: 0 auto;
                    padding: 0 24px;
                }
                .co-back-link {
                    display: inline-flex; align-items: center; gap: 6px;
                    color: #888; font-size: 12px; text-decoration: none;
                    margin-bottom: 10px;
                }
                .co-back-link:hover { color: #ccc; }
                .co-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 26px; font-weight: 800; color: #fff; margin: 0;
                }
                .co-subtitle { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 3px; }

                /* ────── Layout ────── */
                .co-layout {
                    max-width: 1140px;
                    margin: 0 auto;
                    padding: 28px 24px 80px;
                    display: grid;
                    grid-template-columns: 1fr 360px;
                    gap: 24px;
                    align-items: start;
                    box-sizing: border-box;
                }
                .co-left { display: flex; flex-direction: column; gap: 18px; }
                .co-summary-wrap { position: sticky; top: 20px; }

                /* ────── Card ────── */
                .co-card {
                    background: #fff;
                    border-radius: 16px;
                    padding: 22px 24px;
                    border: 1px solid #ebebeb;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
                    box-sizing: border-box;
                    width: 100%;
                }

                /* ────── Step header ────── */
                .co-step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
                .co-step-num {
                    width: 30px; height: 30px; border-radius: 50%;
                    background: #1a1a1a; color: #f5c518;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 13px; font-weight: 800; flex-shrink: 0;
                }
                .co-step-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 17px; font-weight: 700; color: #1a1a1a; margin: 0;
                }

                /* ────── Address ────── */
                .co-center-pad { display: flex; justify-content: center; padding: 28px 0; }
                .co-empty-addr {
                    text-align: center; padding: 28px 0;
                    display: flex; flex-direction: column; align-items: center; gap: 10px;
                }
                .co-empty-addr p { color: #888; font-size: 14px; font-weight: 600; margin: 0; }
                .co-addr-list { display: flex; flex-direction: column; gap: 10px; }
                .co-addr-card {
                    display: flex; align-items: flex-start; gap: 12px;
                    padding: 12px 14px; border-radius: 12px; cursor: pointer;
                    border: 1px solid #ebebeb; background: #fafafa;
                    transition: border-color 0.2s, background 0.2s;
                }
                 .co-addr-card--selected {
                    border: 1.5px solid #f5c518;
                    background: rgba(245,197,24,0.03);
                }
                @keyframes blink-addr {
                    0%, 100% { border-color: #ebebeb; background: #fafafa; }
                    50% { border-color: #f5c518; background: rgba(245,197,24,0.15); box-shadow: 0 0 8px rgba(245,197,24,0.3); }
                }
                .co-addr-card--blink {
                    animation: blink-addr 0.4s ease-in-out 2;
                }
                .co-radio {
                    width: 17px; height: 17px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
                    border: 2px solid #ccc; background: #fff; transition: border 0.2s;
                }
                .co-radio--on { border: 5px solid #f5c518; }
                .co-addr-body { flex: 1; min-width: 0; }
                .co-addr-top { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap; }
                .co-addr-label { font-size: 13px; font-weight: 700; color: #1a1a1a; }
                .co-default-badge {
                    font-size: 9px; font-weight: 700; color: #f5c518;
                    background: rgba(245,197,24,0.12); padding: 1px 6px; border-radius: 10px;
                }
                .co-addr-name { font-size: 13px; font-weight: 600; color: #333; }
                .co-addr-text { font-size: 11px; color: #888; line-height: 1.5; margin-top: 2px; }
                .co-addr-phone { font-size: 11px; color: #aaa; margin-top: 2px; }
                .co-addr-actions { display: flex; gap: 4px; flex-shrink: 0; margin-top: 2px; }
                .co-icon-btn {
                    background: #fff; border: 1px solid #ebebeb; border-radius: 6px;
                    padding: 6px; cursor: pointer; display: flex; align-items: center;
                    transition: border-color 0.2s;
                }
                .co-icon-btn:hover { border-color: #ddd; }
                .co-accent-btn {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 9px 18px; background: #1a1a1a; color: #f5c518;
                    border: none; border-radius: 8px; font-size: 12px; font-weight: 700;
                    cursor: pointer; font-family: 'Inter', sans-serif;
                }
                .co-add-btn { margin-top: 12px; }

                /* ────── Address Form ────── */
                .co-form-wrap {
                    margin-top: 16px; padding: 18px 16px;
                    background: #fafafa; border-radius: 12px; border: 1px solid #ebebeb;
                }
                .co-form-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 14px;
                }
                .co-form-header h3 { font-size: 14px; font-weight: 700; margin: 0; color: #1a1a1a; }
                .co-close-btn { background: none; border: none; cursor: pointer; padding: 2px; }
                .co-form-grid {
                    display: grid; grid-template-columns: 1fr 1fr;
                    gap: 10px; margin-bottom: 10px;
                }
                .co-form-field { margin-bottom: 10px; }
                .co-label {
                    display: block; font-size: 10px; font-weight: 600; color: #999;
                    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
                }
                .co-input {
                    width: 100%; padding: 9px 11px;
                    background: #fff; border: 1px solid #e0e0e0; border-radius: 7px;
                    font-size: 13px; font-family: 'Inter', sans-serif; outline: none;
                    color: #1a1a1a; box-sizing: border-box;
                }
                .co-input:focus { border-color: #f5c518; }
                .co-save-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 10px 18px; background: #1a1a1a; color: #f5c518;
                    border: none; border-radius: 8px; font-size: 13px; font-weight: 700;
                    cursor: pointer; font-family: 'Inter', sans-serif; margin-top: 4px;
                }
                .co-error {
                    background: rgba(239,68,68,0.07); color: #ef4444;
                    border: 1px solid rgba(239,68,68,0.15); border-radius: 8px;
                    padding: 9px 12px; font-size: 12px; font-weight: 600;
                    margin-bottom: 12px;
                }

                /* ────── Order Items ────── */
                .co-items { display: flex; flex-direction: column; }
                .co-item {
                    display: flex; align-items: flex-start; gap: 12px;
                    padding: 12px 0;
                }
                .co-item--border { border-bottom: 1px solid #f0f0f0; }
                .co-item-img {
                    width: 52px; height: 52px; border-radius: 10px;
                    overflow: hidden; flex-shrink: 0;
                    background: #f5f5f0; border: 1px solid #ebebeb;
                }
                .co-item-img img { width: 100%; height: 100%; object-fit: cover; }
                .co-item-info { flex: 1; min-width: 0; }
                .co-item-top-row {
                    display: flex; align-items: flex-start;
                    justify-content: space-between; gap: 8px;
                    margin-bottom: 4px;
                }
                .co-item-name {
                    font-size: 13px; font-weight: 600; color: #1a1a1a;
                    overflow: hidden; text-overflow: ellipsis;
                    display: -webkit-box; -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical; flex: 1; min-width: 0;
                    line-height: 1.35;
                }
                .co-item-price {
                    font-size: 13px; font-weight: 700; color: #1a1a1a;
                    white-space: nowrap; flex-shrink: 0; padding-top: 1px;
                }
                .co-item-meta {
                    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
                    margin-top: 4px;
                }
                .co-item-size {
                    font-size: 10px; color: #888; background: #f0f0eb;
                    padding: 1px 6px; border-radius: 4px;
                }
                .co-item-qty { font-size: 11px; color: #aaa; }

                /* ────── Summary ────── */
                .co-summary-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 17px; font-weight: 700; color: #1a1a1a; margin: 0 0 18px;
                }
                .co-summary-rows { display: flex; flex-direction: column; gap: 11px; margin-bottom: 14px; }
                .co-summary-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
                .co-summary-label { color: #888; font-weight: 500; display: flex; align-items: center; gap: 4px; }
                .co-summary-label--green { color: #16a34a; }
                .co-summary-val { font-weight: 600; color: #1a1a1a; }
                .co-summary-val--green { color: #16a34a; }
                .co-total-row {
                    border-top: 2px solid #1a1a1a; padding-top: 13px; margin-bottom: 16px;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .co-total-label { font-size: 15px; font-weight: 800; color: #1a1a1a; }
                .co-total-val {
                    font-size: 22px; font-weight: 800; color: #1a1a1a;
                    font-family: 'Outfit', sans-serif;
                }
                .co-free-ship {
                    display: flex; align-items: center; gap: 7px;
                    padding: 9px 11px; background: rgba(34,197,94,0.07);
                    border-radius: 8px; margin-bottom: 14px;
                    font-size: 12px; color: #16a34a; font-weight: 600;
                }

                /* Payment Method */
                .co-pay-section { margin-bottom: 14px; }
                .co-pay-title { font-size: 12px; font-weight: 700; color: #1a1a1a; margin-bottom: 9px; text-transform: uppercase; letter-spacing: 0.4px; }
                .co-pay-option {
                    display: flex; align-items: center; gap: 10px;
                    padding: 11px 12px; border-radius: 10px; cursor: pointer;
                    border: 1px solid #ebebeb; background: #fafafa;
                    transition: all 0.18s; margin-bottom: 8px;
                }
                .co-pay-option input[type=radio] { accent-color: #f5c518; flex-shrink: 0; }
                .co-pay-option--on { border: 1.5px solid #f5c518; background: rgba(245,197,24,0.04); }
                .co-pay-name { font-size: 13px; font-weight: 600; color: #1a1a1a; }
                .co-pay-desc { font-size: 10px; color: #aaa; margin-top: 1px; }

                /* Addr warning */
                .co-addr-warn {
                    display: flex; align-items: center; gap: 7px;
                    padding: 9px 12px; border-radius: 9px; margin-bottom: 12px;
                    font-size: 12px; font-weight: 600; color: #b8960a;
                    background: rgba(245,197,24,0.09); border: 1px solid rgba(245,197,24,0.22);
                }

                /* Pay button */
                .co-pay-btn {
                    width: 100%; padding: 14px; border: none; border-radius: 12px;
                    font-size: 15px; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 9px;
                    font-family: 'Inter', sans-serif; transition: all 0.18s;
                    background: linear-gradient(135deg, #f5c518, #e6b800);
                    color: #1a1a1a;
                    box-shadow: 0 4px 18px rgba(245,197,24,0.3);
                }
                .co-pay-btn--disabled {
                    background: #e0e0e0 !important; color: #aaa !important;
                    box-shadow: none !important; cursor: not-allowed !important;
                }
                .co-pay-btn:not(.co-pay-btn--disabled):hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(245,197,24,0.4);
                }

                .co-secure {
                    display: flex; align-items: center; justify-content: center; gap: 5px;
                    margin-top: 12px; font-size: 10px; color: #bbb; font-weight: 500;
                }
                .co-trust {
                    display: flex; justify-content: center; gap: 24px;
                    margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0f0f0;
                }
                .co-trust-item {
                    display: flex; flex-direction: column; align-items: center; gap: 4px;
                }
                .co-trust-item span { font-size: 9px; color: #aaa; font-weight: 600; }

                /* ────── Modal ────── */
                .co-modal-bg {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 200; padding: 20px;
                }
                .co-modal {
                    background: #fff; border-radius: 16px; padding: 28px 24px;
                    max-width: 360px; width: 100%; text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                    display: flex; flex-direction: column; align-items: center; gap: 8px;
                }
                .co-modal h3 { font-size: 17px; font-weight: 700; color: #1a1a1a; margin: 4px 0 0; }
                .co-modal p { color: #888; font-size: 13px; margin: 0 0 12px; }
                .co-modal-btns { display: flex; gap: 10px; width: 100%; }
                .co-modal-cancel {
                    flex: 1; padding: 10px; background: #f5f5f5; color: #555;
                    border: 1px solid #e0e0e0; border-radius: 8px;
                    font-size: 13px; font-weight: 600; cursor: pointer;
                }
                .co-modal-delete {
                    flex: 1; padding: 10px; background: #ef4444; color: #fff;
                    border: none; border-radius: 8px;
                    font-size: 13px; font-weight: 600; cursor: pointer;
                }

                /* ────── Tablet (≤1024px) ────── */
                @media (max-width: 1024px) {
                    .co-layout {
                        grid-template-columns: 1fr 320px;
                        padding: 20px 20px 80px;
                        gap: 18px;
                    }
                }

                /* ────── Mobile (≤768px) ────── */
                @media (max-width: 768px) {
                    .co-header { padding: 18px 0; }
                    .co-header-inner { padding: 0 16px; }
                    .co-title { font-size: 22px; }
                    .co-layout {
                        grid-template-columns: 1fr;
                        padding: 16px 16px 72px;
                        gap: 14px;
                    }
                    .co-summary-wrap { position: static; }
                    .co-card { padding: 18px 16px; border-radius: 14px; }
                    .co-form-grid { grid-template-columns: 1fr; }
                    .co-total-val { font-size: 20px; }
                    .co-trust { gap: 16px; }
                }

                /* ────── Small Mobile (≤480px) ────── */
                @media (max-width: 480px) {
                    .co-header-inner { padding: 0 14px; }
                    .co-title { font-size: 20px; }
                    .co-layout { padding: 12px 12px 72px; gap: 12px; }
                    .co-card { padding: 16px 14px; border-radius: 12px; }
                    .co-item-img { width: 46px; height: 46px; border-radius: 8px; }
                    .co-item-name { font-size: 12px; }
                    .co-item-price { font-size: 12px; }
                    .co-pay-btn { padding: 13px; font-size: 14px; }
                    .co-total-val { font-size: 19px; }
                    .co-item { gap: 10px; }
                    .co-summary-title { font-size: 15px; }
                    .co-pay-name { font-size: 12px; }
                    .co-pay-desc { font-size: 10px; }
                    .co-addr-card { padding: 10px 12px; }
                    .co-addr-label { font-size: 12px; }
                    .co-addr-name { font-size: 12px; }
                    .co-addr-text { font-size: 11px; }
                }
            `}</style>
        </div>
    );
}
