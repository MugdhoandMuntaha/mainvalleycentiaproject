'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    User, Mail, Package, ShoppingBag, Heart, LogOut, MapPin, Loader2,
    Check, Edit3, Shield, Phone, Save, Calendar, UserCircle, Lock,
    Plus, Trash2, Star, X, Home, Briefcase, ChevronRight, Eye, EyeOff, Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { ProfilePageSkeleton } from '@/components/Skeletons';
import { useWishlist } from '@/lib/WishlistContext';
import {
    getUserAddresses, createAddress, updateAddress, deleteAddress,
    getUserOrders, getUserOrderCount, getWishlistProducts,
} from '@/lib/db/queries';
import type { UserAddress, AddressFormData, UserOrder, ProductCard } from '@/lib/db/queries';

/* ===== Tab types ===== */
type Tab = 'profile' | 'orders' | 'wishlist' | 'addresses' | 'security';

/* ===== Empty address form ===== */
const emptyAddress: AddressFormData = {
    label: 'Home', full_name: '', phone: '', address_line_1: '',
    address_line_2: '', city: '', state: '', postal_code: '', country: 'India',
    landmark: '', is_default: false,
};

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function ProfilePage() {
    const { user, role, profile, loading, signOut, updateProfile } = useAuth();
    const { totalItems, addToCart } = useCart();
    const { wishlistCount, toggleWishlist } = useWishlist();
    const router = useRouter();

    /* ===== Tab ===== */
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    /* ===== Profile fields ===== */
    const [fullName, setFullName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [profileEditing, setProfileEditing] = useState(false);

    /* ===== Addresses ===== */
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [addrLoading, setAddrLoading] = useState(false);
    const [addrModalOpen, setAddrModalOpen] = useState(false);
    const [addrEditId, setAddrEditId] = useState<string | null>(null);
    const [addrForm, setAddrForm] = useState<AddressFormData>(emptyAddress);
    const [addrSaving, setAddrSaving] = useState(false);
    const [addrError, setAddrError] = useState('');
    const [addrDeleteId, setAddrDeleteId] = useState<string | null>(null);

    /* ===== Orders ===== */
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [orderCount, setOrderCount] = useState(0);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    /* ===== Wishlist ===== */
    const [wishlistProducts, setWishlistProducts] = useState<ProductCard[]>([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    /* ===== Password ===== */
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState('');

    /* ===== Redirect if not logged in ===== */
    useEffect(() => {
        if (!loading && !user) router.push('/auth');
    }, [user, loading, router]);

    /* ===== Populate profile fields ===== */
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || user?.fullName || user?.name || '');
            setDisplayName(profile.display_name || profile.full_name || user?.displayName || user?.fullName || user?.name || user?.email?.split('@')[0] || '');
            setPhone(profile.phone || '');
            setDob(profile.date_of_birth || '');
            setGender(profile.gender || '');
            setAvatarUrl(profile.avatar_url || '');
        } else if (user) {
            setFullName(user.fullName || user.name || '');
            setDisplayName(user.displayName || user.fullName || user.name || user.email?.split('@')[0] || '');
        }
    }, [profile, user]);

    /* ===== Load order count for stats ===== */
    useEffect(() => {
        if (user) {
            getUserOrderCount(user.id).then(setOrderCount);
        }
    }, [user]);

    /* ===== Load addresses ===== */
    const loadAddresses = useCallback(async () => {
        if (!user) return;
        setAddrLoading(true);
        const data = await getUserAddresses(user.id);
        setAddresses(data);
        setAddrLoading(false);
    }, [user]);

    useEffect(() => {
        if (user && activeTab === 'addresses') loadAddresses();
    }, [user, activeTab, loadAddresses]);

    /* ===== Profile save ===== */
    const handleProfileSave = async () => {
        setProfileSaving(true);
        setProfileMsg('');
        const { error } = await updateProfile({
            full_name: fullName || null,
            display_name: displayName || null,
            phone: phone || null,
            date_of_birth: dob || null,
            gender: gender || null,
            avatar_url: avatarUrl || null,
        });
        setProfileSaving(false);
        setProfileEditing(false);
        setProfileMsg(error ? 'Failed to save' : 'Profile updated!');
        setTimeout(() => setProfileMsg(''), 3000);
    };

    /* ===== Address CRUD ===== */
    const openAddrCreate = () => {
        setAddrEditId(null);
        setAddrForm(emptyAddress);
        setAddrError('');
        setAddrModalOpen(true);
    };

    const openAddrEdit = (addr: UserAddress) => {
        setAddrEditId(addr.id);
        setAddrForm({
            label: addr.label, full_name: addr.full_name, phone: addr.phone,
            address_line_1: addr.address_line_1, address_line_2: addr.address_line_2 || '',
            city: addr.city, state: addr.state, postal_code: addr.postal_code,
            country: addr.country, landmark: addr.landmark || '', is_default: addr.is_default,
        });
        setAddrError('');
        setAddrModalOpen(true);
    };

    const handleAddrSave = async () => {
        if (!user) return;
        if (!addrForm.full_name.trim() || !addrForm.phone.trim() || !addrForm.address_line_1.trim() || !addrForm.city.trim() || !addrForm.state.trim() || !addrForm.postal_code.trim()) {
            setAddrError('Please fill in all required fields');
            return;
        }
        setAddrSaving(true);
        setAddrError('');
        const res = addrEditId
            ? await updateAddress(addrEditId, user.id, addrForm)
            : await createAddress(user.id, addrForm);
        if ('error' in res && res.error) {
            setAddrError(res.error);
            setAddrSaving(false);
            return;
        }
        setAddrSaving(false);
        setAddrModalOpen(false);
        await loadAddresses();
    };

    const handleAddrDelete = async () => {
        if (!addrDeleteId) return;
        await deleteAddress(addrDeleteId);
        setAddrDeleteId(null);
        await loadAddresses();
    };

    /* ===== Password change ===== */
    const handlePasswordChange = async () => {
        if (newPassword.length < 6) { setPwMsg('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { setPwMsg('Passwords do not match'); return; }
        setPwSaving(true);
        setPwMsg('');
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });
            const data = await res.json();
            setPwSaving(false);
            if (!res.ok) {
                setPwMsg(data.error || 'Failed to update password');
            } else {
                setPwMsg('Password updated!');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setPwSaving(false);
            setPwMsg('Failed to update password');
        }
        setTimeout(() => setPwMsg(''), 4000);
    };

    const handleSignOut = async () => { await signOut(); router.push('/'); };

    /* ===== Load orders when tab is active ===== */
    useEffect(() => {
        if (activeTab === 'orders' && user && orders.length === 0 && !ordersLoading) {
            setOrdersLoading(true);
            getUserOrders(user.id).then(data => {
                setOrders(data);
                setOrdersLoading(false);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, user]);

    /* ===== Load wishlist products when tab is active ===== */
    useEffect(() => {
        if (activeTab === 'wishlist' && user) {
            setWishlistLoading(true);
            getWishlistProducts(user.id).then(data => {
                setWishlistProducts(data);
                setWishlistLoading(false);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, user, wishlistCount]);

    if (loading || !user) {
        return <ProfilePageSkeleton />;
    }

    const initials = (displayName || user.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

    const stats = [
        { icon: Package, label: 'Orders', value: orderCount, color: '#1976d2', tab: 'orders' as Tab },
        { icon: ShoppingBag, label: 'In Cart', value: totalItems, color: '#e67e22', href: '/cart' },
        { icon: Heart, label: 'Wishlist', value: wishlistCount, color: '#ef4444', tab: 'wishlist' as Tab },
    ];

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: 'profile', label: 'Personal Info', icon: User },
        { key: 'orders', label: 'Orders', icon: Package },
        { key: 'wishlist', label: 'Wishlist', icon: Heart },
        { key: 'addresses', label: 'Addresses', icon: MapPin },
        { key: 'security', label: 'Security', icon: Lock },
    ];

    return (
        <div style={{ minHeight: '80vh', background: '#f8f8f5', fontFamily: "'Inter', sans-serif" }}>
            {/* Hero Banner */}
            <div className="profile-hero" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '48px 24px 80px' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            width: 90, height: 90, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f5c518, #e6b800)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: 28, fontWeight: 800,
                            color: '#1a1a1a', fontFamily: "'Outfit', sans-serif",
                            boxShadow: '0 4px 20px rgba(245,197,24,0.3)',
                        }}
                    >
                        {initials}
                    </motion.div>
                    <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                        {displayName}
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{user.email}</p>
                    {role === 'admin' && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 600, color: '#f5c518',
                            background: 'rgba(245,197,24,0.1)', padding: '3px 10px',
                            borderRadius: 20, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1,
                        }}>
                            <Shield size={10} /> Admin
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="profile-content" style={{ maxWidth: 900, margin: '-40px auto 0', padding: '0 24px 64px' }}>
                {/* Stats */}
                <div className="profile-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {stats.map((stat) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            onClick={() => {
                                if ('tab' in stat && stat.tab) setActiveTab(stat.tab);
                                else if ('href' in stat && stat.href) router.push(stat.href);
                            }}
                            style={{
                                background: '#fff', borderRadius: 14, padding: 20,
                                border: '1px solid #f0f0f0', textAlign: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            whileHover={{ y: -3, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
                        >
                            <stat.icon size={22} color={stat.color} style={{ marginBottom: 8 }} />
                            <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>{stat.value}</div>
                            <div style={{ fontSize: 13, color: '#999', marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="profile-tabs" style={{
                    display: 'flex', gap: 4, background: '#fff', borderRadius: 12,
                    padding: 4, border: '1px solid #f0f0f0', marginBottom: 20,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="profile-tab-btn"
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '12px 16px', borderRadius: 10, border: 'none',
                                    background: active ? '#1a1a1a' : 'transparent',
                                    color: active ? '#f5c518' : '#888',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                <Icon size={16} />
                                <span className="profile-tab-label">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ═══════════════ ORDERS TAB ═══════════════ */}
                {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div style={{
                            background: '#fff', borderRadius: 16, padding: '24px 28px',
                            border: '1px solid #f0f0f0', marginBottom: 20,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        }}>
                            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>
                                Order History
                            </h2>

                            {ordersLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                                    <Loader2 size={24} color="#f5c518" style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : orders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <Package size={40} style={{ color: '#ddd', marginBottom: 12 }} />
                                    <p style={{ fontSize: 15, fontWeight: 600, color: '#888', marginBottom: 4 }}>No orders yet</p>
                                    <p style={{ fontSize: 13, color: '#bbb', marginBottom: 16 }}>Your order history will appear here</p>
                                    <Link href="/shop" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '10px 24px', background: '#1a1a1a', color: '#f5c518',
                                        borderRadius: 10, fontSize: 13, fontWeight: 700,
                                        textDecoration: 'none', fontFamily: "'Inter', sans-serif",
                                    }}>
                                        <ShoppingBag size={14} /> Start Shopping
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {orders.map(order => {
                                        const isExpanded = expandedOrder === order.id;
                                        const statusColor = {
                                            pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
                                            shipped: '#06b6d4', delivered: '#22c55e', cancelled: '#ef4444',
                                            returned: '#f97316', refunded: '#64748b',
                                        }[order.status] || '#888';
                                        const payColor = {
                                            pending: '#f59e0b', captured: '#22c55e', failed: '#ef4444',
                                            refunded: '#64748b',
                                        }[order.payment_status] || '#888';
                                        return (
                                            <div key={order.id} style={{
                                                border: isExpanded ? '1.5px solid #f5c518' : '1px solid #f0f0f0',
                                                borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s',
                                                background: isExpanded ? 'rgba(245,197,24,0.01)' : '#fafafa',
                                            }}>
                                                {/* Order Header — clickable */}
                                                <div
                                                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                        padding: '16px 18px', cursor: 'pointer',
                                                    }}
                                                >
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{order.order_number}</span>
                                                            <span style={{
                                                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                                                padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5,
                                                                background: `${statusColor}15`, color: statusColor,
                                                            }}>
                                                                {order.status}
                                                            </span>
                                                            <span style={{
                                                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                                                padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5,
                                                                background: `${payColor}15`, color: payColor,
                                                            }}>
                                                                Pay: {order.payment_status}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#999' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <Clock size={12} /> {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </span>
                                                            <span>{order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>৳{Number(order.total).toLocaleString()}</div>
                                                    </div>
                                                    <ChevronRight size={16} color="#bbb" style={{
                                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s',
                                                    }} />
                                                </div>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f0f0f0' }}>
                                                        {/* Items */}
                                                        <div style={{ marginTop: 14 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Items</div>
                                                            {order.order_items?.map(item => (
                                                                <div key={item.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f8f8f8' }}>
                                                                    {item.product_image && (
                                                                        <Link href={`/product/${item.product_slug}`} style={{ flexShrink: 0 }}>
                                                                            <div style={{
                                                                                width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
                                                                                background: '#f5f5f0', border: '1px solid #f0f0f0',
                                                                            }}>
                                                                                <img src={item.product_image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                            </div>
                                                                        </Link>
                                                                    )}
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <Link href={`/product/${item.product_slug}`} style={{ textDecoration: 'none' }}>
                                                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{item.product_name}</div>
                                                                        </Link>
                                                                        <div style={{ fontSize: 11, color: '#999' }}>
                                                                            {item.size && <span>Size: {item.size} · </span>}
                                                                            Qty: {item.quantity} × ৳{Number(item.unit_price).toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>৳{Number(item.total_price).toLocaleString()}</div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Summary */}
                                                        <div style={{ marginTop: 14, padding: '12px 14px', background: '#fafafa', borderRadius: 10 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                                                                <span style={{ color: '#888' }}>Subtotal</span>
                                                                <span style={{ fontWeight: 600, color: '#444' }}>৳{Number(order.subtotal).toLocaleString()}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                                                                <span style={{ color: '#888' }}>Shipping</span>
                                                                <span style={{ fontWeight: 600, color: Number(order.shipping_cost) === 0 ? '#16a34a' : '#444' }}>
                                                                    {Number(order.shipping_cost) === 0 ? 'FREE' : `৳${Number(order.shipping_cost).toLocaleString()}`}
                                                                </span>
                                                            </div>

                                                            <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                                                <span style={{ fontWeight: 700, color: '#1a1a1a' }}>Total</span>
                                                                <span style={{ fontWeight: 800, color: '#1a1a1a' }}>৳{Number(order.total).toLocaleString()}</span>
                                                            </div>
                                                        </div>

                                                        {/* Shipping Info */}
                                                        <div style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
                                                            <span style={{ fontWeight: 600, color: '#666' }}>Ship to:</span> {order.shipping_name}, {order.shipping_city}, {order.shipping_state}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════ WISHLIST TAB ═══════════════ */}
                {activeTab === 'wishlist' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div style={{
                            background: '#fff', borderRadius: 16, padding: '24px 28px',
                            border: '1px solid #f0f0f0', marginBottom: 20,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        }}>
                            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>
                                My Wishlist ({wishlistCount})
                            </h2>

                            {wishlistLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                                    <Loader2 size={24} color="#f5c518" style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : wishlistProducts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <Heart size={40} style={{ color: '#ddd', marginBottom: 12 }} />
                                    <p style={{ fontSize: 15, fontWeight: 600, color: '#888', marginBottom: 4 }}>Your wishlist is empty</p>
                                    <p style={{ fontSize: 13, color: '#bbb', marginBottom: 16 }}>Items you love will appear here</p>
                                    <Link href="/shop" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '10px 24px', background: '#1a1a1a', color: '#f5c518',
                                        borderRadius: 10, fontSize: 13, fontWeight: 700,
                                        textDecoration: 'none', fontFamily: "'Inter', sans-serif",
                                    }}>
                                        <ShoppingBag size={14} /> Browse Products
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                                    {wishlistProducts.map(product => (
                                        <div key={product.id} style={{
                                            borderRadius: 14, border: '1px solid #f0f0f0',
                                            overflow: 'hidden', background: '#fafafa',
                                            transition: 'all 0.2s',
                                        }}>
                                            {/* Product Image */}
                                            <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                                                <div style={{ position: 'relative', height: 180, background: '#f5f5f0' }}>
                                                    {product.primary_image_url ? (
                                                        <Image
                                                            src={product.primary_image_url}
                                                            alt={product.name}
                                                            fill
                                                            sizes="200px"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                                            <Package size={32} />
                                                        </div>
                                                    )}
                                                    {product.discount_percent > 0 && (
                                                        <span style={{
                                                            position: 'absolute', top: 8, left: 8,
                                                            fontSize: 10, fontWeight: 700, color: '#fff',
                                                            background: '#ef4444', padding: '2px 7px',
                                                            borderRadius: 5,
                                                        }}>
                                                            {Math.ceil(product.discount_percent)}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Product Info */}
                                            <div style={{ padding: '12px 14px' }}>
                                                <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                                                    <p style={{
                                                        fontSize: 13, fontWeight: 600, color: '#1a1a1a',
                                                        margin: '0 0 4px', lineHeight: 1.3,
                                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                    }}>
                                                        {product.name}
                                                    </p>
                                                </Link>

                                                {/* Rating */}
                                                {product.rating_avg > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                                        <Star size={11} fill="#e67e22" stroke="#e67e22" />
                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#e67e22' }}>{product.rating_avg}</span>
                                                        <span style={{ fontSize: 10, color: '#bbb' }}>({product.review_count})</span>
                                                    </div>
                                                )}

                                                {/* Price */}
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                                                    <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
                                                        ৳{product.base_price.toLocaleString()}
                                                    </span>
                                                    {product.compare_at_price && product.compare_at_price > product.base_price && (
                                                        <span style={{ fontSize: 12, color: '#bbb', textDecoration: 'line-through' }}>
                                                            ৳{product.compare_at_price.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        onClick={() => {
                                                            addToCart({
                                                                id: product.id,
                                                                slug: product.slug,
                                                                name: product.name,
                                                                image: product.primary_image_url || '',
                                                                price: Math.ceil(product.base_price),
                                                                originalPrice: product.compare_at_price ? Math.ceil(product.compare_at_price) : undefined,
                                                            });
                                                        }}
                                                        style={{
                                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                                            padding: '8px 0', background: '#1a1a1a', color: '#f5c518',
                                                            border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                                            textTransform: 'uppercase', letterSpacing: 0.3,
                                                        }}
                                                    >
                                                        <ShoppingBag size={12} /> Add to Cart
                                                    </button>
                                                    <button
                                                        onClick={() => toggleWishlist(product.id)}
                                                        style={{
                                                            width: 36, height: 36, display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', background: '#fff',
                                                            border: '1px solid #f0f0f0', borderRadius: 8,
                                                            cursor: 'pointer',
                                                        }}
                                                        title="Remove from wishlist"
                                                    >
                                                        <Trash2 size={14} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════ PERSONAL INFO TAB ═══════════════ */}
                {activeTab === 'profile' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div style={{
                            background: '#fff', borderRadius: 16, padding: '24px 28px',
                            border: '1px solid #f0f0f0', marginBottom: 20,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                                    Personal Information
                                </h2>
                                {!profileEditing ? (
                                    <button
                                        onClick={() => setProfileEditing(true)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '8px 16px', background: '#f8f8f5', border: '1px solid #e8e8e8',
                                            borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#666',
                                            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        <Edit3 size={13} /> Edit
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => setProfileEditing(false)}
                                            style={{
                                                padding: '8px 16px', background: '#f8f8f5', border: '1px solid #e8e8e8',
                                                borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#666',
                                                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleProfileSave}
                                            disabled={profileSaving}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '8px 16px', background: '#1a1a1a', border: 'none',
                                                borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#f5c518',
                                                cursor: profileSaving ? 'wait' : 'pointer', fontFamily: "'Inter', sans-serif",
                                            }}
                                        >
                                            {profileSaving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>

                            {profileMsg && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
                                    background: profileMsg.includes('Failed') ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                    color: profileMsg.includes('Failed') ? '#ef4444' : '#16a34a',
                                    border: `1px solid ${profileMsg.includes('Failed') ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                }}>
                                    <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{profileMsg}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* Full Name */}
                                <FieldRow icon={User} label="Full Name">
                                    {profileEditing ? (
                                        <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inlineInput} />
                                    ) : (
                                        <span style={fieldValue}>{fullName || 'Not set'}</span>
                                    )}
                                </FieldRow>

                                {/* Display Name */}
                                <FieldRow icon={UserCircle} label="Display Name">
                                    {profileEditing ? (
                                        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" style={inlineInput} />
                                    ) : (
                                        <span style={fieldValue}>{displayName || 'Not set'}</span>
                                    )}
                                </FieldRow>

                                {/* Email (read-only) */}
                                <FieldRow icon={Mail} label="Email">
                                    <span style={fieldValue}>{user.email}</span>
                                </FieldRow>

                                {/* Phone */}
                                <FieldRow icon={Phone} label="Phone">
                                    {profileEditing ? (
                                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" style={inlineInput} />
                                    ) : (
                                        <span style={{ ...fieldValue, color: phone ? '#1a1a1a' : '#bbb' }}>{phone || 'Not set'}</span>
                                    )}
                                </FieldRow>

                                {/* Date of Birth */}
                                <FieldRow icon={Calendar} label="Date of Birth">
                                    {profileEditing ? (
                                        <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inlineInput} />
                                    ) : (
                                        <span style={{ ...fieldValue, color: dob ? '#1a1a1a' : '#bbb' }}>
                                            {dob ? new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                                        </span>
                                    )}
                                </FieldRow>

                                {/* Gender */}
                                <FieldRow icon={User} label="Gender">
                                    {profileEditing ? (
                                        <select value={gender} onChange={e => setGender(e.target.value)} style={{ ...inlineInput, cursor: 'pointer' }}>
                                            <option value="">Select gender</option>
                                            {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    ) : (
                                        <span style={{ ...fieldValue, color: gender ? '#1a1a1a' : '#bbb' }}>{gender || 'Not set'}</span>
                                    )}
                                </FieldRow>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="profile-quick-actions" style={{ display: 'grid', gridTemplateColumns: role === 'admin' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
                            {role === 'admin' && (
                                <Link href="/admin" style={quickActionStyle}>
                                    <Shield size={16} color="#f5c518" />
                                    <span>Admin Dashboard</span>
                                    <ChevronRight size={14} color="#ccc" style={{ marginLeft: 'auto' }} />
                                </Link>
                            )}
                            <Link href="/cart" style={quickActionStyle}>
                                <ShoppingBag size={16} color="#e67e22" />
                                <span>View Cart</span>
                                <ChevronRight size={14} color="#ccc" style={{ marginLeft: 'auto' }} />
                            </Link>
                            <Link href="/shop" style={quickActionStyle}>
                                <Star size={16} color="#1976d2" />
                                <span>Browse Shop</span>
                                <ChevronRight size={14} color="#ccc" style={{ marginLeft: 'auto' }} />
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════ ADDRESSES TAB ═══════════════ */}
                {activeTab === 'addresses' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div style={{
                            background: '#fff', borderRadius: 16, padding: '24px 28px',
                            border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                                    Saved Addresses
                                </h2>
                                <button onClick={openAddrCreate} style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', background: '#1a1a1a', border: 'none',
                                    borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#f5c518',
                                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                }}>
                                    <Plus size={13} /> Add Address
                                </button>
                            </div>

                            {addrLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                                    <Loader2 size={24} color="#f5c518" style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : addresses.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#999' }}>
                                    <MapPin size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#666', margin: '0 0 4px' }}>No saved addresses</p>
                                    <p style={{ fontSize: 12, margin: 0 }}>Add your first delivery address</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {addresses.map(addr => (
                                        <div key={addr.id} style={{
                                            padding: '16px 18px', background: '#fafafa', borderRadius: 12,
                                            border: addr.is_default ? '1.5px solid #f5c518' : '1px solid #f0f0f0',
                                            position: 'relative',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 8,
                                                    background: addr.label === 'Office' ? 'rgba(66,133,244,0.08)' : 'rgba(245,197,24,0.08)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>
                                                    {addr.label === 'Office' ? <Briefcase size={16} color="#4285f4" /> : <Home size={16} color="#f5c518" />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{addr.label}</span>
                                                        {addr.is_default && (
                                                            <span style={{
                                                                fontSize: 10, fontWeight: 700, color: '#f5c518',
                                                                background: 'rgba(245,197,24,0.1)', padding: '2px 8px',
                                                                borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5,
                                                            }}>
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 2 }}>{addr.full_name}</div>
                                                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                                                        {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}<br />
                                                        {addr.city}, {addr.state} {addr.postal_code}<br />
                                                        {addr.phone}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                    <button onClick={() => openAddrEdit(addr)} style={iconBtnStyle} title="Edit">
                                                        <Edit3 size={14} color="#888" />
                                                    </button>
                                                    <button onClick={() => setAddrDeleteId(addr.id)} style={iconBtnStyle} title="Delete">
                                                        <Trash2 size={14} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════ SECURITY TAB ═══════════════ */}
                {activeTab === 'security' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        {/* Change Password */}
                        <div style={{
                            background: '#fff', borderRadius: 16, padding: '24px 28px',
                            border: '1px solid #f0f0f0', marginBottom: 20,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        }}>
                            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>
                                Change Password
                            </h2>

                            {pwMsg && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
                                    background: pwMsg.includes('updated') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                    color: pwMsg.includes('updated') ? '#16a34a' : '#ef4444',
                                    border: `1px solid ${pwMsg.includes('updated') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                }}>
                                    {pwMsg}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
                                <div>
                                    <label style={formLabel}>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            style={{ ...formInput, paddingRight: 40 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                                        >
                                            {showPassword ? <EyeOff size={16} color="#aaa" /> : <Eye size={16} color="#aaa" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={formLabel}>Confirm Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        style={formInput}
                                    />
                                </div>
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={pwSaving || !newPassword}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        padding: '12px 0', background: '#1a1a1a', border: 'none',
                                        borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#f5c518',
                                        cursor: pwSaving ? 'wait' : 'pointer', fontFamily: "'Inter', sans-serif",
                                        opacity: pwSaving || !newPassword ? 0.5 : 1,
                                    }}
                                >
                                    {pwSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={14} />}
                                    Update Password
                                </button>
                            </div>
                        </div>

                        {/* Sign Out + Account Info */}
                        <div style={{
                            background: '#fff', borderRadius: 16, padding: '24px 28px',
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        }}>
                            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
                                Account
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafafa', borderRadius: 10 }}>
                                    <Mail size={16} color="#aaa" />
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginTop: 1 }}>{user.email}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafafa', borderRadius: 10 }}>
                                    <Calendar size={16} color="#aaa" />
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>Member Since</div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginTop: 1 }}>
                                            {new Date(user.createdAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSignOut}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    width: '100%', marginTop: 20, padding: 14, background: '#fff',
                                    border: '1.5px solid #fecaca', borderRadius: 12, fontSize: 14,
                                    fontWeight: 600, color: '#ef4444', cursor: 'pointer',
                                    transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ═══════════════ ADDRESS MODAL ═══════════════ */}
            {addrModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, padding: 24,
                }} onClick={() => setAddrModalOpen(false)}>
                    <div style={{
                        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
                        maxHeight: '90vh', overflowY: 'auto', padding: 28,
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>
                                {addrEditId ? 'Edit Address' : 'Add New Address'}
                            </h3>
                            <button onClick={() => setAddrModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <X size={18} color="#999" />
                            </button>
                        </div>

                        {addrError && (
                            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                {addrError}
                            </div>
                        )}

                        {/* Label */}
                        <div className="profile-addr-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={formLabel}>Label</label>
                                <select value={addrForm.label} onChange={e => setAddrForm(prev => ({ ...prev, label: e.target.value }))} style={{ ...formInput, cursor: 'pointer' }}>
                                    {['Home', 'Office', 'Other'].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={formLabel}>Full Name *</label>
                                <input value={addrForm.full_name} onChange={e => setAddrForm(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Recipient name" style={formInput} />
                            </div>
                        </div>

                        {/* Phone */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={formLabel}>Phone *</label>
                            <input value={addrForm.phone} onChange={e => setAddrForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" style={formInput} />
                        </div>

                        {/* Address lines */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={formLabel}>Address Line 1 *</label>
                            <input value={addrForm.address_line_1} onChange={e => setAddrForm(prev => ({ ...prev, address_line_1: e.target.value }))} placeholder="House no, Building, Street" style={formInput} />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={formLabel}>Address Line 2</label>
                            <input value={addrForm.address_line_2} onChange={e => setAddrForm(prev => ({ ...prev, address_line_2: e.target.value }))} placeholder="Apartment, Area (optional)" style={formInput} />
                        </div>

                        {/* City, State */}
                        <div className="profile-addr-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={formLabel}>City *</label>
                                <input value={addrForm.city} onChange={e => setAddrForm(prev => ({ ...prev, city: e.target.value }))} placeholder="City" style={formInput} />
                            </div>
                            <div>
                                <label style={formLabel}>State *</label>
                                <input value={addrForm.state} onChange={e => setAddrForm(prev => ({ ...prev, state: e.target.value }))} placeholder="State" style={formInput} />
                            </div>
                        </div>

                        {/* Postal, Country */}
                        <div className="profile-addr-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div>
                                <label style={formLabel}>Postal Code *</label>
                                <input value={addrForm.postal_code} onChange={e => setAddrForm(prev => ({ ...prev, postal_code: e.target.value }))} placeholder="110001" style={formInput} />
                            </div>
                            <div>
                                <label style={formLabel}>Country</label>
                                <input value={addrForm.country} onChange={e => setAddrForm(prev => ({ ...prev, country: e.target.value }))} style={formInput} />
                            </div>
                        </div>

                        {/* Landmark */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={formLabel}>Landmark</label>
                            <input value={addrForm.landmark} onChange={e => setAddrForm(prev => ({ ...prev, landmark: e.target.value }))} placeholder="Near..." style={formInput} />
                        </div>

                        {/* Default toggle */}
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                            background: '#fafafa', borderRadius: 10, marginBottom: 20, cursor: 'pointer',
                        }}>
                            <input
                                type="checkbox"
                                checked={addrForm.is_default}
                                onChange={e => setAddrForm(prev => ({ ...prev, is_default: e.target.checked }))}
                                style={{ width: 16, height: 16, accentColor: '#f5c518' }}
                            />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>Set as default address</span>
                        </label>

                        <button
                            onClick={handleAddrSave}
                            disabled={addrSaving}
                            style={{
                                width: '100%', padding: '12px 0', background: '#1a1a1a', border: 'none',
                                borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#f5c518',
                                cursor: addrSaving ? 'wait' : 'pointer', fontFamily: "'Inter', sans-serif",
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                opacity: addrSaving ? 0.6 : 1,
                            }}
                        >
                            {addrSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                            {addrEditId ? 'Update Address' : 'Save Address'}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════════ ADDRESS DELETE CONFIRM ═══════════════ */}
            {addrDeleteId && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                }} onClick={() => setAddrDeleteId(null)}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center',
                    }} onClick={e => e.stopPropagation()}>
                        <Trash2 size={32} style={{ color: '#ef4444', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Delete Address?</h3>
                        <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setAddrDeleteId(null)} style={{
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

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ═══════════════ HELPER COMPONENTS ═══════════════ */

function FieldRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 16px', background: '#fafafa', borderRadius: 10,
        }}>
            <Icon size={18} color="#aaa" />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ marginTop: 2 }}>{children}</div>
            </div>
        </div>
    );
}

/* ═══════════════ STYLES ═══════════════ */

const fieldValue: React.CSSProperties = {
    fontSize: 14, fontWeight: 500, color: '#1a1a1a',
};

const inlineInput: React.CSSProperties = {
    width: '100%', padding: '6px 10px', background: '#fff',
    border: '1px solid #e0e0e0', borderRadius: 6, color: '#1a1a1a',
    fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: "'Inter', sans-serif",
};

const formLabel: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
};

const formInput: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: '#fafafa',
    border: '1px solid #e8e8e8', borderRadius: 8, color: '#1a1a1a',
    fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none',
};

const quickActionStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 12,
    padding: 14, fontSize: 14, fontWeight: 600, color: '#1a1a1a',
    textDecoration: 'none', transition: 'all 0.2s',
};

const iconBtnStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8,
    padding: 8, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.2s',
};
