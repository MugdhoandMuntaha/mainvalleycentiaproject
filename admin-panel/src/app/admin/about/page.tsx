'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
    Save, Loader2, Check, AlertCircle, ChevronDown, ChevronUp, Upload, Trash2, Image as ImageIcon
} from 'lucide-react';
import { getAboutContent, updateAboutSection } from '@/lib/db/adminQueries';
import { uploadFile } from '@/lib/upload';

/* ===== Defaults (matching storefront) ===== */
const defaultHero = {
    title: "Science Meets Clean Beauty",
    subtitle: "ValleyCentia unites premium, science-backed personal care under one roof, driven by absolute honesty, community feedback, and environmental care.",
    bgImage: ""
};
const defaultAboutUs = {
    badge: "About Us",
    description: "ValleyCentia was founded to make clean, research-backed beauty accessible. We house three distinct brands—Bare Anatomy (personalized hair science), Chemist at Play (clinical active skincare), and Sun Scoop (lightweight sun protection)—all formulated with absolute transparency and community feedback."
};
const defaultFounder1 = {
    name: "Muntaha Shah",
    title: "Co-Founder & CEO",
    bio: "Muntaha co-founded ValleyCentia with a vision to build a clean beauty powerhouse. Believing that science and natural goodness should go hand in hand, she spearheaded the product formulation and brand identity of Bare Anatomy, Chemist at Play, and Sun Scoop. With over a decade of experience in cosmetic science and brand incubation, Muntaha leads the overall corporate strategy, formulation R&D, and brand growth.",
    image: "/founder_1.png"
};
const defaultFounder2 = {
    name: "Shah Md Al Junaid",
    title: "Co-Founder & COO",
    bio: "Junaid is the operational brain behind ValleyCentia. With a background in operations and supply chain management, Junaid built our direct-to-consumer infrastructure, ensuring that freshness and premium quality reach customers with absolute speed and safety. Under Junaid's leadership, ValleyCentia has built custom state-of-the-art warehouses, automated inventory intelligence, and sustainable manufacturing practices.",
    image: "/founder_2.png"
};
const defaultWeAccept = {
    image: "",
    verificationImage: ""
};

export default function AdminAboutPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [uploading, setUploading] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // Section states
    const [hero, setHero] = useState(defaultHero);
    const [aboutUs, setAboutUs] = useState(defaultAboutUs);
    const [founder1, setFounder1] = useState(defaultFounder1);
    const [founder2, setFounder2] = useState(defaultFounder2);
    const [weAccept, setWeAccept] = useState(defaultWeAccept);

    // Accordion expand states
    const [expanded, setExpanded] = useState<string>('hero');

    useEffect(() => {
        loadContent();
    }, []);

    async function loadContent() {
        setLoading(true);
        try {
            console.log('Loading about content from database...');
            const data = await getAboutContent();
            console.log('Loaded about content data:', data);
            if (data.hero) setHero(prev => ({ ...prev, ...(data.hero as any) }));
            if (data.aboutUs) setAboutUs(prev => ({ ...prev, ...(data.aboutUs as any) }));
            if (data.founder1) setFounder1(prev => ({ ...prev, ...(data.founder1 as any) }));
            if (data.founder2) setFounder2(prev => ({ ...prev, ...(data.founder2 as any) }));
            if (data.weAccept) setWeAccept(prev => ({ ...prev, ...(data.weAccept as any) }));
        } catch (err) {
            console.error('Error loading about content:', err);
            flash('err', 'Failed to load content from database');
        }
        setLoading(false);
    }

    async function saveSection(key: string, content: unknown) {
        setSaving(key);
        console.log(`Attempting to save section "${key}":`, content);
        try {
            const res = await updateAboutSection(key, content);
            setSaving(null);
            if (res.error) {
                console.error(`Error returned when saving section "${key}":`, res.error);
                flash('err', `Save failed: ${res.error}`);
            } else {
                console.log(`Successfully saved section "${key}"`);
                flash('ok', `${key.toUpperCase()} section saved successfully!`);
            }
        } catch (err) {
            console.error(`Exception thrown when saving section "${key}":`, err);
            setSaving(null);
            flash('err', `Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    function flash(type: 'ok' | 'err', text: string) {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 3000);
    }

    function toggle(key: string) {
        setExpanded(prev => prev === key ? '' : key);
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, uploadKey: string, onUrlReceived: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(uploadKey);
        try {
            const url = await uploadFile(file);
            onUrlReceived(url);
            flash('ok', 'Image uploaded successfully!');
        } catch (err) {
            flash('err', err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                <Loader2 size={28} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>About Page Management</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Edit all sections of the user-facing About Us page</p>
                </div>
            </div>

            {msg && (
                <div style={{
                    padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: msg.type === 'ok' ? '#22c55e' : '#ef4444',
                    border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                    {msg.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />} {msg.text}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* 1. HERO SECTION */}
                <Panel title="1. Hero Section" sectionKey="hero" expanded={expanded} onToggle={toggle} saving={saving} onSave={() => saveSection('hero', hero)}>
                    <Field label="Hero Title" value={hero.title} onChange={v => setHero(p => ({ ...p, title: v }))} />
                    <Field label="Hero Subtitle" value={hero.subtitle} onChange={v => setHero(p => ({ ...p, subtitle: v }))} multiline />
                    
                    {/* Background Image Upload */}
                    <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Hero Background Image (Optional - falls back to premium gradient if empty)</label>
                        <ImageUploader 
                            uploadKey="hero-bg"
                            url={hero.bgImage} 
                            uploading={uploading === 'hero-bg'}
                            onUpload={e => handleFileUpload(e, 'hero-bg', url => setHero(p => ({ ...p, bgImage: url })))}
                            onClear={() => setHero(p => ({ ...p, bgImage: '' }))}
                        />
                    </div>
                </Panel>

                {/* 2. CENTRED BADGE & DESCRIPTION */}
                <Panel title="2. Centered Badge & Description" sectionKey="aboutUs" expanded={expanded} onToggle={toggle} saving={saving} onSave={() => saveSection('aboutUs', aboutUs)}>
                    <Field label="Pill Badge Label" value={aboutUs.badge} onChange={v => setAboutUs(p => ({ ...p, badge: v }))} />
                    <Field label="Company Description" value={aboutUs.description} onChange={v => setAboutUs(p => ({ ...p, description: v }))} multiline />
                </Panel>

                {/* 3. FOUNDER 1 (Muntaha Shah) */}
                <Panel title="3. Founder 1 (Left Portrait Row)" sectionKey="founder1" expanded={expanded} onToggle={toggle} saving={saving} onSave={() => saveSection('founder1', founder1)}>
                    <Field label="Founder 1 Name" value={founder1.name} onChange={v => setFounder1(p => ({ ...p, name: v }))} />
                    <Field label="Founder 1 Title" value={founder1.title} onChange={v => setFounder1(p => ({ ...p, title: v }))} />
                    <Field label="Founder 1 Biography" value={founder1.bio} onChange={v => setFounder1(p => ({ ...p, bio: v }))} multiline />
                    
                    {/* Portrait Image Upload */}
                    <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Founder 1 Portrait Image (falls back to default asset if empty)</label>
                        <ImageUploader 
                            uploadKey="founder1-img"
                            url={founder1.image} 
                            uploading={uploading === 'founder1-img'}
                            onUpload={e => handleFileUpload(e, 'founder1-img', url => setFounder1(p => ({ ...p, image: url })))}
                            onClear={() => setFounder1(p => ({ ...p, image: '' }))}
                            portrait
                        />
                    </div>
                </Panel>

                {/* 4. FOUNDER 2 (Shah Md Al Junaid) */}
                <Panel title="4. Founder 2 (Right Portrait Row)" sectionKey="founder2" expanded={expanded} onToggle={toggle} saving={saving} onSave={() => saveSection('founder2', founder2)}>
                    <Field label="Founder 2 Name" value={founder2.name} onChange={v => setFounder2(p => ({ ...p, name: v }))} />
                    <Field label="Founder 2 Title" value={founder2.title} onChange={v => setFounder2(p => ({ ...p, title: v }))} />
                    <Field label="Founder 2 Biography" value={founder2.bio} onChange={v => setFounder2(p => ({ ...p, bio: v }))} multiline />
                    
                    {/* Portrait Image Upload */}
                    <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Founder 2 Portrait Image (falls back to default asset if empty)</label>
                        <ImageUploader 
                            uploadKey="founder2-img"
                            url={founder2.image} 
                            uploading={uploading === 'founder2-img'}
                            onUpload={e => handleFileUpload(e, 'founder2-img', url => setFounder2(p => ({ ...p, image: url })))}
                            onClear={() => setFounder2(p => ({ ...p, image: '' }))}
                            portrait
                        />
                    </div>
                </Panel>

                {/* 5. WE ACCEPT PAYMENT BANNER */}
                <Panel title="5. Payment Methods (We Accept)" sectionKey="weAccept" expanded={expanded} onToggle={toggle} saving={saving} onSave={() => saveSection('weAccept', weAccept)}>
                    <div style={{ marginTop: 6 }}>
                        <label style={labelStyle}>Payment Methods Banner Image (Left side - Optional, falls back to colored chips if empty)</label>
                        <ImageUploader 
                            uploadKey="weaccept-img"
                            url={weAccept.image} 
                            uploading={uploading === 'weaccept-img'}
                            onUpload={e => handleFileUpload(e, 'weaccept-img', url => setWeAccept(p => ({ ...p, image: url })))}
                            onClear={() => setWeAccept(p => ({ ...p, image: '' }))}
                        />
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <label style={labelStyle}>Verification Badge Image (Right side - Optional, falls back to default SSL Commerz verification chip if empty)</label>
                        <ImageUploader 
                            uploadKey="weaccept-verify-img"
                            url={weAccept.verificationImage || ''} 
                            uploading={uploading === 'weaccept-verify-img'}
                            onUpload={e => handleFileUpload(e, 'weaccept-verify-img', url => setWeAccept(p => ({ ...p, verificationImage: url })))}
                            onClear={() => setWeAccept(p => ({ ...p, verificationImage: '' }))}
                        />
                    </div>
                </Panel>

            </div>
            
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ═══════════════ SUB-COMPONENTS ═══════════════ */

function Panel({ title, sectionKey, expanded, onToggle, saving, onSave, children }: {
    title: string; sectionKey: string; expanded: string; onToggle: (k: string) => void;
    saving: string | null; onSave: () => void; children: React.ReactNode;
}) {
    const isOpen = expanded === sectionKey;
    return (
        <div style={{
            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
            <button onClick={() => onToggle(sectionKey)} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-primary)', fontSize: 15, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif", justifyContent: 'space-between'
            }}>
                {title}
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && (
                <div style={{ padding: '0 20px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {children}
                    </div>
                    <button onClick={onSave} disabled={saving === sectionKey} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginTop: 20, padding: '10px 24px', background: 'var(--gradient-accent)',
                        color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius-md)',
                        fontSize: 13, fontWeight: 700, cursor: saving === sectionKey ? 'wait' : 'pointer',
                        opacity: saving === sectionKey ? 0.6 : 1, fontFamily: "'Inter', sans-serif",
                    }}>
                        {saving === sectionKey ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, multiline }: {
    label?: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
    const Tag = multiline ? 'textarea' : 'input';
    return (
        <div>
            {label && <label style={labelStyle}>{label}</label>}
            <Tag value={value} onChange={(e: any) => onChange(e.target.value)}
                rows={multiline ? 4 : undefined}
                style={{
                    ...inputStyle,
                    ...(multiline ? { resize: 'vertical' as const, minHeight: 80 } : {}),
                }} />
        </div>
    );
}

interface ImageUploaderProps {
    uploadKey: string;
    url: string;
    uploading: boolean;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    portrait?: boolean;
}

function ImageUploader({ uploadKey, url, uploading, onUpload, onClear, portrait }: ImageUploaderProps) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'var(--color-bg-tertiary)', padding: 16,
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)'
        }}>
            {/* Preview Area */}
            <div style={{
                width: portrait ? 72 : 110, height: 90, borderRadius: 8, overflow: 'hidden',
                background: 'rgba(0,0,0,0.2)', border: '1.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0
            }}>
                {url ? (
                    <img src={url} alt="Uploaded preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <ImageIcon size={24} color="var(--color-text-muted)" />
                )}
            </div>

            {/* Upload Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', background: 'var(--color-bg-elevated)',
                        color: 'var(--color-text-primary)', border: '1px solid var(--color-border)',
                        borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: uploading ? 'wait' : 'pointer',
                        fontFamily: "'Inter', sans-serif"
                    }}>
                        {uploading ? (
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Upload size={13} />
                        )}
                        {uploading ? 'Uploading...' : 'Choose Image'}
                        <input 
                            type="file" 
                            accept="image/*" 
                            disabled={uploading}
                            onChange={onUpload} 
                            style={{ display: 'none' }} 
                        />
                    </label>

                    {url && (
                        <button 
                            type="button" 
                            onClick={onClear}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '8px 12px', background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444', border: 'none', borderRadius: 6,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            <Trash2 size={13} /> Clear
                        </button>
                    )}
                </div>
                {url ? (
                    <span style={{ fontSize: 11, color: 'var(--color-success)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px', whiteSpace: 'nowrap' }}>
                        ✓ {url}
                    </span>
                ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No image uploaded</span>
                )}
            </div>
        </div>
    );
}

/* ═══════════════ STYLES ═══════════════ */

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'var(--color-text-secondary)', marginBottom: 6,
    fontFamily: "'Inter', sans-serif", textTransform: 'uppercase',
    letterSpacing: 0.5,
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'var(--color-bg-tertiary, #1a1a1d)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none',
    boxSizing: 'border-box'
};
