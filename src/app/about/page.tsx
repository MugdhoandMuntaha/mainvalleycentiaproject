'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, Lock, Sparkles, Star } from 'lucide-react';
import { getAboutContent } from '@/lib/db/queries';

export default function AboutPage() {
    const [hero, setHero] = useState({
        title: "Science Meets Clean Beauty",
        subtitle: "ValleyCentia unites premium, science-backed personal care under one roof, driven by absolute honesty, community feedback, and environmental care.",
        bgImage: ""
    });
    const [aboutUs, setAboutUs] = useState({
        badge: "About Us",
        description: "ValleyCentia was founded to make clean, research-backed beauty accessible. We house three distinct brands—Bare Anatomy (personalized hair science), Chemist at Play (clinical active skincare), and Sun Scoop (lightweight sun protection)—all formulated with absolute transparency and community feedback."
    });
    const [founder1, setFounder1] = useState({
        name: "Muntaha Shah",
        title: "Co-Founder & CEO",
        bio: "Muntaha co-founded ValleyCentia with a vision to build a clean beauty powerhouse. Believing that science and natural goodness should go hand in hand, she spearheaded the product formulation and brand identity of Bare Anatomy, Chemist at Play, and Sun Scoop. With over a decade of experience in cosmetic science and brand incubation, Muntaha leads the overall corporate strategy, formulation R&D, and brand growth.",
        image: "/founder_1.png"
    });
    const [founder2, setFounder2] = useState({
        name: "Shah Md Al Junaid",
        title: "Co-Founder & COO",
        bio: "Junaid is the operational brain behind ValleyCentia. With a background in operations and supply chain management, Junaid built our direct-to-consumer infrastructure, ensuring that freshness and premium quality reach customers with absolute speed and safety. Under Junaid's leadership, ValleyCentia has built custom state-of-the-art warehouses, automated inventory intelligence, and sustainable manufacturing practices.",
        image: "/founder_2.png"
    });
    const [weAccept, setWeAccept] = useState({
        image: "",
        verificationImage: ""
    });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const map = await getAboutContent();
                if (map) {
                    if (map.hero) setHero(prev => ({ ...prev, ...(map.hero as any) }));
                    if (map.aboutUs) setAboutUs(prev => ({ ...prev, ...(map.aboutUs as any) }));
                    if (map.founder1) setFounder1(prev => ({ ...prev, ...(map.founder1 as any) }));
                    if (map.founder2) setFounder2(prev => ({ ...prev, ...(map.founder2 as any) }));
                    if (map.weAccept) setWeAccept(prev => ({ ...prev, ...(map.weAccept as any) }));
                }
            } catch (e) {
                console.error("Failed to load about content", e);
            }
            setLoaded(false);
            setTimeout(() => setLoaded(true), 400);
        }
        load();
    }, []);

    if (!loaded) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <div style={{
                    width: '40px', height: '40px', border: '3px solid #f0f0f0',
                    borderTopColor: '#c9a96e', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', color: '#1a1a1a', fontFamily: "'Inter', sans-serif", paddingBottom: '80px' }}>
            
            {/* 1. Hero Section */}
            <section className="about-hero" style={{
                background: hero.bgImage 
                    ? `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.65)), url(${hero.bgImage})` 
                    : 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #1f1a12 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '72px 0 80px', position: 'relative', overflow: 'hidden', textAlign: 'center',
            }}>
                <div style={{
                    position: 'absolute', top: '-45%', right: '-10%', width: 550, height: 550,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
                    <Link href="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, color: '#ccc',
                        fontFamily: "'Inter', sans-serif", fontSize: 13, textDecoration: 'none',
                        marginBottom: 24, transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#ccc'; }}
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(32px, 5vw, 44px)',
                        fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: 16,
                        wordBreak: 'break-word', overflowWrap: 'break-word',
                    }}>
                        {hero.title}
                    </h1>
                    <p style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#ddd',
                        lineHeight: 1.6, maxWidth: 650, margin: '0 auto',
                        wordBreak: 'break-word', overflowWrap: 'break-word',
                    }}>
                        {hero.subtitle}
                    </p>
                </div>
            </section>

            {/* Main Content Area */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>

                {/* 2. Badge */}
                <div style={{ textAlign: 'center', marginTop: '48px', marginBottom: '24px' }}>
                    <div style={{
                        display: 'inline-block',
                        border: '2px solid #c9a96e',
                        color: '#c9a96e',
                        padding: '8px 28px',
                        borderRadius: '30px',
                        fontWeight: 700,
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontFamily: "'Outfit', sans-serif",
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    }}>
                        {aboutUs.badge}
                    </div>
                </div>

                {/* 3. About Us Description Container */}
                <div className="about-desc-card" style={{
                    background: '#ffffff',
                    border: '1px solid #f0f0f0',
                    borderRadius: '20px',
                    padding: '40px 48px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                    marginBottom: '64px',
                    textAlign: 'center',
                }}>
                    
                    <p style={{
                        fontSize: '16px',
                        color: '#555',
                        lineHeight: '1.75',
                        maxWidth: '800px',
                        margin: '0 auto',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    }}>
                        {aboutUs.description}
                    </p>
                </div>

                {/* 4. Founder 1 Row */}
                <div className="founder-row" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '48px',
                    marginBottom: '64px',
                }}>
                    {/* Founder 1 Image */}
                    <div className="founder-image-wrapper" style={{
                        width: '260px',
                        height: '320px',
                        position: 'relative',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: '1px solid #e6e6e2',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                        flexShrink: 0,
                        background: '#fcfcfc',
                        maxWidth: '100%',
                    }}>
                        <Image
                            src={founder1.image || "/founder_1.png"}
                            alt={founder1.name}
                            fill
                            sizes="260px"
                            style={{ objectFit: 'cover' }}
                            priority
                        />
                    </div>
                    {/* Founder 1 Bio */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                {founder1.name}
                            </h3>
                            <Sparkles size={18} color="#c9a96e" style={{ flexShrink: 0 }} />
                        </div>
                        <p style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#c9a96e',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '14px',
                            fontFamily: "'Outfit', sans-serif",
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                        }}>
                            {founder1.title}
                        </p>
                        <p style={{
                            fontSize: '15px',
                            color: '#555',
                            lineHeight: '1.7',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                        }}>
                            {founder1.bio}
                        </p>
                    </div>
                </div>

                {/* 5. Founder 2 Row */}
                <div className="founder-row founder-row-reverse" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '48px',
                    marginBottom: '72px',
                }}>
                    {/* Founder 2 Bio */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                {founder2.name}
                            </h3>
                            <Star size={18} color="#c9a96e" fill="#c9a96e" style={{ flexShrink: 0 }} />
                        </div>
                        <p style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#c9a96e',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '14px',
                            fontFamily: "'Outfit', sans-serif",
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                        }}>
                            {founder2.title}
                        </p>
                        <p style={{
                            fontSize: '15px',
                            color: '#555',
                            lineHeight: '1.7',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                        }}>
                            {founder2.bio}
                        </p>
                    </div>
                    {/* Founder 2 Image */}
                    <div className="founder-image-wrapper" style={{
                        width: '260px',
                        height: '320px',
                        position: 'relative',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: '1px solid #e6e6e2',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                        flexShrink: 0,
                        background: '#fcfcfc',
                        maxWidth: '100%',
                    }}>
                        <Image
                            src={founder2.image || "/founder_2.png"}
                            alt={founder2.name}
                            fill
                            sizes="260px"
                            style={{ objectFit: 'cover' }}
                            priority
                        />
                    </div>
                </div>

                {/* 6. We Accept Section */}
                <div className="we-accept-row" style={{
                    display: 'flex',
                    gap: '24px',
                    marginBottom: '48px',
                    alignItems: 'stretch',
                }}>
                    {/* Left Card: 70% width */}
                    <div style={{
                        flex: '7',
                        background: '#ffffff',
                        border: '1px solid #f0f0f0',
                        borderRadius: '20px',
                        padding: '32px 24px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: 0,
                    }}>
                        <h3 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '17px',
                            fontWeight: 700,
                            color: '#1a1a1a',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                        }}>
                            <Lock size={16} color="#c9a96e" /> We Accept
                        </h3>

                        {weAccept.image ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px', maxWidth: '100%' }}>
                                <img 
                                    src={weAccept.image} 
                                    alt="Accepted Payments" 
                                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '110px', borderRadius: '12px', objectFit: 'contain' }} 
                                />
                            </div>
                        ) : (
                            <div className="payment-badges-row" style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                            }}>
                                <span className="pay-badge" style={{ background: '#d81b60', color: '#fff' }}>bKash</span>
                                <span className="pay-badge" style={{ background: '#f4511e', color: '#fff' }}>Nagad</span>
                                <span className="pay-badge" style={{ background: '#5e35b1', color: '#fff' }}>Rocket</span>
                                <span className="pay-badge" style={{ background: '#1a1f71', color: '#fff' }}>Visa</span>
                                <span className="pay-badge" style={{ background: '#ff5f00', color: '#fff' }}>MasterCard</span>
                            </div>
                        )}
                    </div>

                    {/* Right Card: 30% width */}
                    <div style={{
                        flex: '3',
                        background: '#ffffff',
                        border: '1px solid #f0f0f0',
                        borderRadius: '20px',
                        padding: '32px 24px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: 0,
                    }}>
                        {weAccept.verificationImage ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px', maxWidth: '100%' }}>
                                <img 
                                    src={weAccept.verificationImage} 
                                    alt="Verification Badge" 
                                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '110px', borderRadius: '12px', objectFit: 'contain' }} 
                                />
                            </div>
                        ) : (
                            <div style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px',
                                background: '#f8fafc',
                                padding: '16px 20px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                width: '100%',
                                textAlign: 'center',
                            }}>
                                <ShieldCheck size={28} color="#22c55e" />
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#334155',
                                    letterSpacing: '0.5px',
                                    fontFamily: "'Outfit', sans-serif",
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                }}>
                                    Verified By SSL Commerz
                                </span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <style>{`
                .pay-badge {
                    display: inline-block;
                    padding: 6px 16px;
                    border-radius: 8px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
                    transition: transform 0.2s;
                }
                .pay-badge:hover {
                    transform: translateY(-1px);
                }
                @media (max-width: 768px) {
                    .founder-row {
                        flex-direction: column !important;
                        gap: 24px !important;
                        text-align: center !important;
                    }
                    .founder-row-reverse {
                        flex-direction: column-reverse !important;
                    }
                    .about-desc-card {
                        padding: 30px 24px !important;
                    }
                    .we-accept-row {
                        flex-direction: column !important;
                        gap: 20px !important;
                    }
                }
            `}</style>
        </div>
    );
}
