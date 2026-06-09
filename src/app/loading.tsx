import React from 'react';

export default function RootLoading() {
    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', paddingBottom: '64px', fontFamily: "'Inter', sans-serif" }}>
            {/* Shimmering Banner */}
            <div 
                className="shimmer-dark" 
                style={{ 
                    width: '100%', 
                    height: '45vh', 
                    minHeight: '350px',
                    background: '#1a1a1d',
                    marginBottom: '40px' 
                }} 
            />

            {/* Sections Skeleton */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
                {/* Title Skeleton */}
                <div 
                    className="shimmer" 
                    style={{ 
                        width: '280px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        marginBottom: '10px' 
                    }} 
                />
                <div 
                    className="shimmer" 
                    style={{ 
                        width: '180px', 
                        height: '16px', 
                        borderRadius: '4px', 
                        marginBottom: '28px' 
                    }} 
                />

                {/* Cards Row Skeleton */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '20px' 
                }}>
                    {Array.from({ length: 4 }).map((_, i) => (
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
                                gap: '12px' 
                            }}
                        >
                            {/* Image Placeholder */}
                            <div 
                                className="shimmer" 
                                style={{ 
                                    width: '100%', 
                                    height: '50%', 
                                    borderRadius: '8px', 
                                    background: '#f5f5f0' 
                                }} 
                            />
                            {/* Rating Block Placeholder */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <div className="shimmer" style={{ width: '40px', height: '18px', borderRadius: '4px' }} />
                                <div className="shimmer" style={{ width: '80px', height: '18px', borderRadius: '4px' }} />
                            </div>
                            {/* Title Placeholder */}
                            <div className="shimmer" style={{ width: '90%', height: '20px', borderRadius: '4px' }} />
                            <div className="shimmer" style={{ width: '60%', height: '20px', borderRadius: '4px' }} />
                            
                            <div style={{ flex: 1 }} />
                            
                            {/* Price Placeholder */}
                            <div className="shimmer" style={{ width: '80px', height: '24px', borderRadius: '4px' }} />
                            
                            {/* Button Placeholder */}
                            <div 
                                className="shimmer" 
                                style={{ 
                                    width: '100%', 
                                    height: '40px', 
                                    borderRadius: '8px', 
                                    marginTop: '8px' 
                                }} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
