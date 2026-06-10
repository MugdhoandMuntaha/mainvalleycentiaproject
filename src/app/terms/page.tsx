import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { getSiteSetting } from '@/lib/db/queries';

export default async function TermsPage() {
    const policy = await getSiteSetting('policy_terms') as { content: string } | null;
    const content = policy?.content || 'Welcome to ValleyCentia. Terms and Conditions content is currently empty.';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f8f5',
            color: '#1a1a1a',
            fontFamily: "'Inter', sans-serif",
            paddingBottom: '80px',
        }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #1f1a12 100%)',
                padding: '60px 0',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-40%', right: '-10%', width: 400, height: 400,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
                    <Link href="/" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#bbb',
                        fontSize: '13px',
                        textDecoration: 'none',
                        marginBottom: '20px',
                        transition: 'color 0.2s',
                    }}
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'clamp(28px, 4vw, 38px)',
                        fontWeight: 800,
                        color: '#ffffff',
                        marginBottom: '12px',
                    }}>
                        Terms of Service
                    </h1>
                </div>
            </section>

            {/* Document Content */}
            <div style={{
                maxWidth: '800px',
                margin: '40px auto 0',
                padding: '0 24px',
            }}>
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #f0f0f0',
                    borderRadius: '20px',
                    padding: '40px 48px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{
                            background: 'rgba(245,197,24,0.1)',
                            padding: '10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <FileText size={24} color="#d4a300" />
                        </div>
                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: 700, margin: 0 }}>
                            ValleyCentia Agreement
                        </h2>
                    </div>

                    <div style={{
                        fontSize: '15px',
                        color: '#444',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-line',
                    }}>
                        {content}
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '36px 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2e7d32', fontSize: '14px', fontWeight: 600 }}>
                        <CheckCircle2 size={16} />
                        <span>ValleyCentia Safety and Quality Guaranteed</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
