'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    CheckCircle, Package, ArrowRight, Home, MapPin,
    Phone, Wallet, Printer, ShoppingBag, Tag,
    Download, ImageIcon, FileText, Loader2,
} from 'lucide-react';

interface CODOrderData {
    orderNumber: string;
    items: { name: string; quantity: number; price: number; size?: string }[];
    address: {
        full_name: string;
        phone: string;
        address_line_1: string;
        address_line_2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    subtotal: number;
    shipping: number;
    total: number;
    promoCode?: string;
    promoDiscount?: number;
}

export default function CODConfirmedPage() {
    const [order, setOrder] = useState<CODOrderData | null>(null);
    const [downloading, setDownloading] = useState<'pdf' | 'png' | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem('cod_order');
        if (raw) {
            try { setOrder(JSON.parse(raw)); } catch { /* ignore */ }
            sessionStorage.removeItem('cod_order');
        }
    }, []);

    const handleDownloadPNG = async () => {
        if (!invoiceRef.current) return;
        setDownloading('png');
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(invoiceRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `invoice-${order?.orderNumber || 'order'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('PNG export failed:', err);
        } finally {
            setDownloading(null);
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;
        setDownloading('pdf');
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(invoiceRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20; // 10mm margin each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // If content fits on one page
            if (imgHeight <= pageHeight - 20) {
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            } else {
                // Multi-page support
                let yOffset = 0;
                const pageContentHeight = pageHeight - 20;
                let pageNum = 0;
                while (yOffset < imgHeight) {
                    if (pageNum > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 10, 10 - yOffset, imgWidth, imgHeight);
                    yOffset += pageContentHeight;
                    pageNum++;
                }
            }

            pdf.save(`invoice-${order?.orderNumber || 'order'}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
        } finally {
            setDownloading(null);
        }
    };

    if (!order) {
        return (
            <div style={{ minHeight: '80vh', background: '#f8f8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                    <Package size={40} color="#ccc" style={{ marginBottom: 16 }} />
                    <p style={{ color: '#888', fontSize: 15 }}>No order data found.</p>
                    <Link href="/" style={{ color: '#f5c518', fontWeight: 600, fontSize: 14, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>
                        Go Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    const orderDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f5', fontFamily: "'Inter', sans-serif" }}>
            {/* Success Banner */}
            <div className="no-print" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '40px 0 48px', textAlign: 'center' }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'rgba(34,197,94,0.15)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}
                >
                    <CheckCircle size={36} color="#22c55e" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}
                >
                    Order Confirmed!
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}
                >
                    Cash on Delivery — Pay when you receive your order
                </motion.p>
            </div>

            {/* Invoice Card */}
            <div style={{ maxWidth: 680, margin: '-24px auto 0', padding: '0 16px 60px' }}>
                <motion.div
                    ref={invoiceRef}
                    id="printable-invoice"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    style={{
                        background: '#ffffff',
                        borderRadius: 18,
                        border: '2px solid transparent',
                        backgroundClip: 'padding-box',
                        boxShadow: '0 0 0 1px rgba(245,197,24,0.25), 0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(245,197,24,0.08)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Invoice Header */}
                    <div style={{
                        padding: '24px 28px',
                        borderBottom: '1px solid #f5f5f5',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    }}>
                        <div>
                            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: '#1a1a1a', letterSpacing: -0.5 }}>
                                VALLEY<span style={{ color: '#f5c518' }}>CENTIA</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>Invoice</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Order No.</div>
                            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginTop: 2 }}>
                                {order.orderNumber}
                            </div>
                            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{orderDate}</div>
                        </div>
                    </div>

                    {/* Payment Method Badge */}
                    <div style={{
                        margin: '20px 28px 0', padding: '10px 14px',
                        background: 'rgba(245,197,24,0.06)', borderRadius: 10,
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Wallet size={16} color="#e6b800" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#b8960a' }}>Cash on Delivery</span>
                        <span style={{ fontSize: 11, color: '#999', marginLeft: 'auto' }}>Payment due on delivery</span>
                    </div>

                    {/* Shipping Address */}
                    <div style={{ padding: '20px 28px', borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <MapPin size={14} color="#f5c518" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Address</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>
                            {order.address.full_name}
                        </div>
                        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                            {order.address.address_line_1}
                            {order.address.address_line_2 ? `, ${order.address.address_line_2}` : ''}
                            <br />
                            {order.address.city}, {order.address.state} {order.address.postal_code}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, color: '#999' }}>
                            <Phone size={12} /> {order.address.phone}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div style={{ padding: '20px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                            <ShoppingBag size={14} color="#f5c518" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Order Items</span>
                        </div>

                        {/* Table Header */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 60px 80px 90px',
                            padding: '8px 0', borderBottom: '2px solid #1a1a1a',
                            fontSize: 10, fontWeight: 700, color: '#999',
                            textTransform: 'uppercase', letterSpacing: 0.8,
                        }}>
                            <span>Item</span>
                            <span style={{ textAlign: 'center' }}>Qty</span>
                            <span style={{ textAlign: 'right' }}>Price</span>
                            <span style={{ textAlign: 'right' }}>Total</span>
                        </div>

                        {/* Table Rows */}
                        {order.items.map((item, idx) => (
                            <div key={idx} style={{
                                display: 'grid', gridTemplateColumns: '1fr 60px 80px 90px',
                                padding: '12px 0', borderBottom: idx < order.items.length - 1 ? '1px solid #f5f5f5' : 'none',
                                alignItems: 'center',
                            }}>
                                <div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{item.name}</span>
                                    {item.size && (
                                        <span style={{ fontSize: 10, color: '#999', marginLeft: 6, background: '#f5f5f0', padding: '1px 6px', borderRadius: 3 }}>
                                            {item.size}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>{item.quantity}</span>
                                <span style={{ fontSize: 13, color: '#666', textAlign: 'right' }}>৳{item.price.toLocaleString()}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', textAlign: 'right' }}>
                                    ৳{(item.price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Promo Details */}
                    {order.promoCode && order.promoDiscount && order.promoDiscount > 0 && (
                        <div style={{
                            margin: '0 28px 0', padding: '10px 14px',
                            background: 'rgba(46,125,50,0.05)', borderRadius: 10,
                            display: 'flex', alignItems: 'center', gap: 8,
                            border: '1px dashed rgba(46,125,50,0.25)',
                            marginTop: 4,
                        }}>
                            <Tag size={15} color="#2e7d32" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#2e7d32', letterSpacing: 0.3 }}>
                                    Promo Applied: {order.promoCode}
                                </div>
                                <div style={{ fontSize: 11, color: '#4caf50', marginTop: 1 }}>
                                    You saved ৳{order.promoDiscount.toLocaleString()} on this order
                                </div>
                            </div>
                            <span style={{
                                fontSize: 14, fontWeight: 800, color: '#2e7d32',
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                -৳{order.promoDiscount.toLocaleString()}
                            </span>
                        </div>
                    )}

                    {/* Totals */}
                    <div style={{ padding: '20px 28px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: '#888' }}>Subtotal</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>৳{order.subtotal.toLocaleString()}</span>
                        </div>
                        {order.promoCode && order.promoDiscount && order.promoDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Tag size={12} /> Coupon ({order.promoCode})
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32' }}>-৳{order.promoDiscount.toLocaleString()}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span style={{ fontSize: 13, color: '#888' }}>Shipping</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: order.shipping === 0 ? '#16a34a' : '#444' }}>
                                {order.shipping === 0 ? 'FREE' : `৳${order.shipping}`}
                            </span>
                        </div>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            borderTop: '2px solid #1a1a1a', paddingTop: 14,
                        }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>Total Due</span>
                            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#1a1a1a' }}>
                                ৳{order.total.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div style={{
                        padding: '16px 28px',
                        borderTop: '1px solid #f0f0f0',
                        fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.6,
                    }}>
                        Please keep the exact amount ready at the time of delivery. Our delivery partner will collect ৳{order.total.toLocaleString()} upon arrival.
                    </div>
                </motion.div>

                {/* ── Action Buttons ── */}
                <motion.div
                    className="no-print"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{ marginTop: 24 }}
                >
                    {/* Download buttons row */}
                    <div style={{
                        display: 'flex', gap: 10, marginBottom: 12,
                        flexWrap: 'wrap',
                    }}>
                        {/* Download PDF */}
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading !== null}
                            style={{
                                flex: 1, minWidth: 140,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '13px 20px',
                                background: downloading === 'pdf' ? '#2a2a2a' : '#1a1a1a',
                                color: '#f5c518', borderRadius: 14, fontSize: 13, fontWeight: 700,
                                border: '1.5px solid rgba(245,197,24,0.25)', cursor: downloading ? 'wait' : 'pointer',
                                fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                                opacity: downloading !== null && downloading !== 'pdf' ? 0.5 : 1,
                            }}
                        >
                            {downloading === 'pdf' ? (
                                <><Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> Generating...</>
                            ) : (
                                <><FileText size={15} /> Download PDF</>
                            )}
                        </button>

                        {/* Download PNG */}
                        <button
                            onClick={handleDownloadPNG}
                            disabled={downloading !== null}
                            style={{
                                flex: 1, minWidth: 140,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '13px 20px',
                                background: downloading === 'png' ? 'rgba(245,197,24,0.12)' : 'rgba(245,197,24,0.08)',
                                color: '#b8960a', borderRadius: 14, fontSize: 13, fontWeight: 700,
                                border: '1.5px solid rgba(245,197,24,0.3)', cursor: downloading ? 'wait' : 'pointer',
                                fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                                opacity: downloading !== null && downloading !== 'png' ? 0.5 : 1,
                            }}
                        >
                            {downloading === 'png' ? (
                                <><Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> Generating...</>
                            ) : (
                                <><ImageIcon size={15} /> Download PNG</>
                            )}
                        </button>

                        {/* Print */}
                        <button
                            onClick={() => window.print()}
                            disabled={downloading !== null}
                            style={{
                                flex: 1, minWidth: 140,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '13px 20px',
                                background: '#fff', color: '#555', borderRadius: 14, fontSize: 13, fontWeight: 700,
                                border: '1.5px solid #e0e0e0', cursor: 'pointer',
                                fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                                opacity: downloading !== null ? 0.5 : 1,
                            }}
                        >
                            <Printer size={15} /> Print
                        </button>
                    </div>

                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <Link href="/shop" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '14px 32px', background: 'linear-gradient(135deg, #f5c518, #e6b800)',
                            color: '#1a1a1a', borderRadius: 14, fontSize: 14, fontWeight: 700,
                            textDecoration: 'none', fontFamily: "'Inter', sans-serif",
                            justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(245,197,24,0.3)',
                        }}>
                            <Package size={16} /> Continue Shopping <ArrowRight size={14} />
                        </Link>
                        <Link href="/" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: '#999', fontSize: 13, textDecoration: 'none', fontWeight: 500,
                            padding: '8px 0',
                        }}>
                            <Home size={14} /> Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 480px) {
                    #printable-invoice { border-radius: 14px !important; }
                    #printable-invoice > div { padding-left: 16px !important; padding-right: 16px !important; }
                    #printable-invoice [style*="gridTemplateColumns: '1fr 60px 80px 90px'"] {
                        grid-template-columns: 1fr 40px 60px 70px !important;
                    }
                }
            `}</style>
        </div>
    );
}
