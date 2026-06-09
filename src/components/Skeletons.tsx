'use client';

import React from 'react';

/**
 * 1. Shop Grid Skeleton
 */
export function ShopGridSkeleton() {
    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'Inter', sans-serif" }}>
            {/* Header Banner */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    padding: '48px 0 40px',
                }}
            >
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
                    <div className="shimmer-dark" style={{ width: '120px', height: '14px', borderRadius: '4px', marginBottom: '16px', background: '#2d2d2d' }} />
                    <div className="shimmer-dark" style={{ width: '320px', height: '36px', borderRadius: '6px', marginBottom: '8px', background: '#2d2d2d' }} />
                    <div className="shimmer-dark" style={{ width: '220px', height: '16px', borderRadius: '4px', background: '#2d2d2d' }} />
                </div>
            </div>

            {/* Content Area */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 48px 64px' }}>
                {/* Filters Row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="shimmer" style={{ width: '120px', height: '36px', borderRadius: '20px', background: '#e0e0e0' }} />
                    ))}
                </div>

                {/* Subtitle / Count */}
                <div className="shimmer" style={{ width: '140px', height: '16px', borderRadius: '4px', marginBottom: '20px', background: '#e0e0e0' }} />

                {/* Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px',
                    }}
                >
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                height: '532px',
                                background: '#ffffff',
                                borderRadius: '12px',
                                border: '1px solid #f0f0f0',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            <div className="shimmer" style={{ width: '100%', height: '50%', borderRadius: '8px', background: '#f5f5f0' }} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <div className="shimmer" style={{ width: '40px', height: '18px', borderRadius: '4px', background: '#e0e0e0' }} />
                                <div className="shimmer" style={{ width: '80px', height: '18px', borderRadius: '4px', background: '#e0e0e0' }} />
                            </div>
                            <div className="shimmer" style={{ width: '90%', height: '20px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '60%', height: '20px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div style={{ flex: 1 }} />
                            <div className="shimmer" style={{ width: '80px', height: '24px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '100%', height: '40px', borderRadius: '8px', marginTop: '8px', background: '#e0e0e0' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * 2. Product Detail Skeleton
 */
export function ProductDetailSkeleton() {
    return (
        <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {/* Breadcrumb */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
                <div className="shimmer" style={{ width: '220px', height: '14px', borderRadius: '4px', background: '#e0e0e0' }} />
            </div>

            {/* Main Product Layout */}
            <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
                    {/* Left: Gallery */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                        {/* Thumbnails */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="shimmer" style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#f5f5f0' }} />
                            ))}
                        </div>
                        {/* Big Image */}
                        <div className="shimmer" style={{ flex: 1, height: '450px', borderRadius: '16px', background: '#f5f5f0' }} />
                    </div>

                    {/* Right: Info */}
                    <div>
                        <div className="shimmer" style={{ width: '80px', height: '12px', borderRadius: '4px', marginBottom: '8px', background: '#e0e0e0' }} />
                        <div className="shimmer" style={{ width: '90%', height: '32px', borderRadius: '6px', marginBottom: '12px', background: '#e0e0e0' }} />
                        <div className="shimmer" style={{ width: '50%', height: '16px', borderRadius: '4px', marginBottom: '16px', background: '#e0e0e0' }} />
                        
                        {/* Rating block */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                            <div className="shimmer" style={{ width: '60px', height: '20px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '80px', height: '20px', borderRadius: '4px', background: '#e0e0e0' }} />
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '24px' }} />

                        {/* Price */}
                        <div className="shimmer" style={{ width: '150px', height: '36px', borderRadius: '6px', marginBottom: '24px', background: '#e0e0e0' }} />

                        {/* Sizes */}
                        <div style={{ marginBottom: '24px' }}>
                            <div className="shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px', marginBottom: '8px', background: '#e0e0e0' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div className="shimmer" style={{ width: '100px', height: '36px', borderRadius: '8px', background: '#e0e0e0' }} />
                                <div className="shimmer" style={{ width: '100px', height: '36px', borderRadius: '8px', background: '#e0e0e0' }} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                            <div className="shimmer" style={{ width: '100px', height: '44px', borderRadius: '10px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ flex: 1, height: '44px', borderRadius: '10px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0e0e0' }} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

/**
 * 3. Cart Page Skeleton
 */
export function CartPageSkeleton() {
    return (
        <div style={{ background: '#f8f8f5', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {/* Breadcrumb */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 48px' }}>
                <div className="shimmer" style={{ width: '180px', height: '14px', borderRadius: '4px', background: '#e0e0e0' }} />
            </div>

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px 72px' }}>
                {/* Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div className="shimmer" style={{ width: '220px', height: '28px', borderRadius: '6px', background: '#e0e0e0' }} />
                    <div className="shimmer" style={{ width: '80px', height: '16px', borderRadius: '4px', background: '#e0e0e0' }} />
                </div>

                {/* Free Shipping Bar */}
                <div className="shimmer" style={{ width: '100%', height: '54px', borderRadius: '12px', marginBottom: '24px', background: '#e0e0e0' }} />

                {/* Layout Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
                    {/* Left: Cart Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    display: 'flex',
                                    gap: '20px',
                                    border: '1px solid #f0f0f0',
                                }}
                            >
                                <div className="shimmer" style={{ width: '120px', height: '120px', borderRadius: '12px', background: '#f5f5f0' }} />
                                <div style={{ flex: 1 }}>
                                    <div className="shimmer" style={{ width: '85%', height: '16px', borderRadius: '4px', marginBottom: '8px', background: '#e0e0e0' }} />
                                    <div className="shimmer" style={{ width: '40%', height: '12px', borderRadius: '4px', marginBottom: '16px', background: '#e0e0e0' }} />
                                    <div className="shimmer" style={{ width: '80px', height: '20px', borderRadius: '4px', background: '#e0e0e0' }} />
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="shimmer" style={{ width: '80px', height: '20px', borderRadius: '4px', background: '#e0e0e0' }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Summary */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #f0f0f0' }}>
                        <div className="shimmer" style={{ width: '140px', height: '20px', borderRadius: '4px', marginBottom: '24px', background: '#e0e0e0' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div className="shimmer" style={{ width: '60px', height: '14px', borderRadius: '4px', background: '#e0e0e0' }} />
                                <div className="shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px', background: '#e0e0e0' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div className="shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px', background: '#e0e0e0' }} />
                                <div className="shimmer" style={{ width: '50px', height: '14px', borderRadius: '4px', background: '#e0e0e0' }} />
                            </div>
                        </div>
                        <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div className="shimmer" style={{ width: '80px', height: '18px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '100px', height: '28px', borderRadius: '6px', background: '#e0e0e0' }} />
                        </div>
                        <div className="shimmer" style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#e0e0e0' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * 4. Checkout Page Skeleton
 */
export function CheckoutPageSkeleton() {
    return (
        <div style={{ minHeight: '100vh', background: '#f4f4f0', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%)', padding: '24px 0' }}>
                <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px' }}>
                    <div className="shimmer-dark" style={{ width: '100px', height: '12px', borderRadius: '4px', marginBottom: '10px', background: '#2e2e2e' }} />
                    <div className="shimmer-dark" style={{ width: '150px', height: '26px', borderRadius: '6px', marginBottom: '3px', background: '#2e2e2e' }} />
                    <div className="shimmer-dark" style={{ width: '200px', height: '12px', borderRadius: '4px', background: '#2e2e2e' }} />
                </div>
            </div>

            {/* Layout */}
            <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '28px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
                {/* Left Column: Form Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Step 1: Address Card */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '22px 24px', border: '1px solid #ebebeb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            <div className="shimmer" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '150px', height: '18px', borderRadius: '4px', background: '#e0e0e0' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="shimmer" style={{ width: '100%', height: '80px', borderRadius: '12px', background: '#fafafa' }} />
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Payment */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '22px 24px', border: '1px solid #ebebeb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            <div className="shimmer" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '150px', height: '18px', borderRadius: '4px', background: '#e0e0e0' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="shimmer" style={{ width: '100%', height: '54px', borderRadius: '10px', background: '#fafafa' }} />
                            <div className="shimmer" style={{ width: '100%', height: '54px', borderRadius: '10px', background: '#fafafa' }} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '22px 24px', border: '1px solid #ebebeb' }}>
                    <div className="shimmer" style={{ width: '120px', height: '18px', borderRadius: '4px', marginBottom: '18px', background: '#e0e0e0' }} />
                    
                    {/* Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div className="shimmer" style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f5f5f0' }} />
                            <div style={{ flex: 1 }}>
                                <div className="shimmer" style={{ width: '80%', height: '12px', borderRadius: '4px', marginBottom: '6px', background: '#e0e0e0' }} />
                                <div className="shimmer" style={{ width: '40%', height: '10px', borderRadius: '4px', background: '#e0e0e0' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '18px' }} />

                    {/* Subtotals */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="shimmer" style={{ width: '60px', height: '13px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '50px', height: '13px', borderRadius: '4px', background: '#e0e0e0' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="shimmer" style={{ width: '80px', height: '13px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '40px', height: '13px', borderRadius: '4px', background: '#e0e0e0' }} />
                        </div>
                    </div>

                    <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div className="shimmer" style={{ width: '50px', height: '15px', borderRadius: '4px', background: '#e0e0e0' }} />
                        <div className="shimmer" style={{ width: '90px', height: '22px', borderRadius: '4px', background: '#e0e0e0' }} />
                    </div>

                    <div className="shimmer" style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#e0e0e0' }} />
                </div>
            </div>
        </div>
    );
}

/**
 * 5. Profile Page Skeleton
 */
export function ProfilePageSkeleton() {
    return (
        <div style={{ minHeight: '80vh', background: '#f8f8f5', fontFamily: "'Inter', sans-serif" }}>
            {/* Hero Banner */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '48px 24px 80px' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="shimmer-dark" style={{ width: '90px', height: '90px', borderRadius: '50%', marginBottom: '16px', background: '#2d2d2d' }} />
                    <div className="shimmer-dark" style={{ width: '180px', height: '24px', borderRadius: '6px', marginBottom: '6px', background: '#2d2d2d' }} />
                    <div className="shimmer-dark" style={{ width: '140px', height: '14px', borderRadius: '4px', background: '#2d2d2d' }} />
                </div>
            </div>

            {/* Content Container */}
            <div style={{ maxWidth: 900, margin: '-40px auto 0', padding: '0 24px 64px' }}>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                background: '#fff',
                                borderRadius: '14px',
                                padding: '20px',
                                border: '1px solid #f0f0f0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <div className="shimmer" style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '40px', height: '26px', borderRadius: '4px', background: '#e0e0e0' }} />
                            <div className="shimmer" style={{ width: '60px', height: '13px', borderRadius: '4px', background: '#e0e0e0' }} />
                        </div>
                    ))}
                </div>

                {/* Tabs Panel */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '4px', border: '1px solid #f0f0f0', marginBottom: '20px', display: 'flex', gap: '4px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="shimmer" style={{ flex: 1, height: '40px', borderRadius: '10px', background: '#e0e0e0' }} />
                    ))}
                </div>

                {/* Content Panel Block */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '24px 28px', border: '1px solid #f0f0f0' }}>
                    <div className="shimmer" style={{ width: '150px', height: '18px', borderRadius: '4px', marginBottom: '20px', background: '#e0e0e0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="shimmer" style={{ width: '100%', height: '36px', borderRadius: '8px', background: '#fafafa' }} />
                        <div className="shimmer" style={{ width: '100%', height: '36px', borderRadius: '8px', background: '#fafafa' }} />
                        <div className="shimmer" style={{ width: '100%', height: '36px', borderRadius: '8px', background: '#fafafa' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
