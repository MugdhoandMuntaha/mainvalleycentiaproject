'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Truck,
    Package,
    Mail,
    Briefcase,
    Save,
    Loader2,
    Check,
    AlertTriangle,
    Megaphone,
    FileText,
    Shield,
    RotateCcw,
} from 'lucide-react';
import { getAdminSiteSettings, updateSiteSetting, type SiteSettingRow } from '@/lib/db/adminQueries';

// Human-readable configs for each setting key
const SETTING_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; fields: { key: string; label: string; type: 'number' | 'text' | 'boolean' | 'textarea'; suffix?: string }[] }> = {
    header_settings: {
        label: 'Header & Announcement',
        icon: Megaphone,
        fields: [
            { key: 'show_announcement', label: 'Show Announcement Bar', type: 'boolean' },
            { key: 'announcement_text', label: 'Announcement Text', type: 'text' },
        ],
    },
    free_shipping_threshold: {
        label: 'Free Shipping Threshold',
        icon: Truck,
        fields: [
            { key: 'amount', label: 'Minimum Order Amount', type: 'number', suffix: '৳' },
        ],
    },
    shipping_fee: {
        label: 'Shipping Fee by Region',
        icon: Package,
        fields: [
            { key: 'dhaka', label: 'Inside Dhaka', type: 'number', suffix: '৳' },
            { key: 'outside_dhaka', label: 'Outside Dhaka', type: 'number', suffix: '৳' },
        ],
    },
    max_cart_quantity: {
        label: 'Max Cart Quantity',
        icon: Package,
        fields: [
            { key: 'value', label: 'Max Items Per Product', type: 'number' },
        ],
    },
    contact_email: {
        label: 'Contact Email',
        icon: Mail,
        fields: [
            { key: 'value', label: 'Support Email', type: 'text' },
        ],
    },
    careers_email: {
        label: 'Careers Email',
        icon: Briefcase,
        fields: [
            { key: 'value', label: 'Careers Email', type: 'text' },
        ],
    },
    policy_terms: {
        label: 'Terms & Conditions',
        icon: FileText,
        fields: [
            { key: 'content', label: 'Policy Content', type: 'textarea' },
        ],
    },
    policy_privacy: {
        label: 'Privacy Policy',
        icon: Shield,
        fields: [
            { key: 'content', label: 'Policy Content', type: 'textarea' },
        ],
    },
    policy_returns: {
        label: 'Return & Refund Policy',
        icon: RotateCcw,
        fields: [
            { key: 'content', label: 'Policy Content', type: 'textarea' },
        ],
    },
    policy_delivery: {
        label: 'Delivery Policy',
        icon: Truck,
        fields: [
            { key: 'content', label: 'Policy Content', type: 'textarea' },
        ],
    },
    footer_about_text: {
        label: 'Footer About Text',
        icon: Megaphone,
        fields: [
            { key: 'text', label: 'About Text Description', type: 'textarea' },
        ],
    },
    footer_contact_info: {
        label: 'Footer Contact Info',
        icon: Mail,
        fields: [
            { key: 'email', label: 'Support Email', type: 'text' },
            { key: 'phone', label: 'Phone Number', type: 'text' },
            { key: 'address', label: 'Physical Address', type: 'text' },
        ],
    },
    footer_social_links: {
        label: 'Footer Social Links',
        icon: Settings,
        fields: [
            { key: 'facebook', label: 'Facebook URL', type: 'text' },
            { key: 'instagram', label: 'Instagram URL', type: 'text' },
            { key: 'twitter', label: 'Twitter URL', type: 'text' },
            { key: 'youtube', label: 'YouTube URL', type: 'text' },
        ],
    },
    footer_links: {
        label: 'Footer Columns & Links (JSON)',
        icon: FileText,
        fields: [
            { key: 'links_json', label: 'Footer Links JSON structure', type: 'textarea' },
        ],
    },
};

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SiteSettingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editValues, setEditValues] = useState<Record<string, Record<string, unknown>>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const data = await getAdminSiteSettings();
        setSettings(data);
        const values: Record<string, Record<string, unknown>> = {};
        data.forEach(s => { values[s.key] = { ...s.value }; });
        setEditValues(values);
        setLoading(false);
    };

    const handleFieldChange = (settingKey: string, fieldKey: string, value: string | number | boolean) => {
        setEditValues(prev => ({
            ...prev,
            [settingKey]: {
                ...prev[settingKey],
                [fieldKey]: value,
            },
        }));
    };

    const handleSave = async (settingKey: string) => {
        setSaving(settingKey);
        setError(null);
        if (settingKey === 'footer_links') {
            try {
                const jsonStr = editValues[settingKey]?.links_json as string;
                JSON.parse(jsonStr);
            } catch (e: any) {
                setError('Invalid JSON format in Footer Links: ' + e.message);
                setSaving(null);
                return;
            }
        }
        try {
            const result = await updateSiteSetting(settingKey, editValues[settingKey]);
            if (result.error) {
                setError(result.error);
            } else {
                setSaved(settingKey);
                setTimeout(() => setSaved(null), 2000);
                await loadSettings();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while saving');
        } finally {
            setSaving(null);
        }
    };

    const hasChanges = (settingKey: string) => {
        const original = settings.find(s => s.key === settingKey)?.value;
        const current = editValues[settingKey];
        if (!original || !current) return false;
        return JSON.stringify(original) !== JSON.stringify(current);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '50vh',
            }}>
                <Loader2 size={28} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'var(--color-accent-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Settings size={20} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                        <h1 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 24, fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            margin: 0,
                        }}>
                            Site Settings
                        </h1>
                        <p style={{
                            fontSize: 13, color: 'var(--color-text-muted)',
                            margin: 0,
                        }}>
                            Manage shipping, cart limits, and contact info
                        </p>
                    </div>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444', fontSize: 13, fontWeight: 600,
                }}>
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {/* Settings Grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: 16,
            }}>
                {settings.map((setting, index) => {
                    const meta = SETTING_META[setting.key];
                    if (!meta) return null;

                    const Icon = meta.icon;
                    const changed = hasChanges(setting.key);
                    const isSaving = saving === setting.key;
                    const isSaved = saved === setting.key;

                    return (
                        <motion.div
                            key={setting.key}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            style={{
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 14,
                                border: '1px solid var(--color-border)',
                                padding: '22px 24px',
                                transition: 'box-shadow 0.2s',
                            }}
                        >
                            {/* Setting Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                marginBottom: 16,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'var(--color-accent-glow)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={18} style={{ color: 'var(--color-accent)' }} />
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: 14, fontWeight: 700,
                                        color: 'var(--color-text-primary)',
                                    }}>
                                        {meta.label}
                                    </div>
                                    <div style={{
                                        fontSize: 11, color: 'var(--color-text-muted)',
                                    }}>
                                        {setting.description || setting.key}
                                    </div>
                                </div>
                            </div>

                            {/* Fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {meta.fields.map(field => {
                                    const currentValue = editValues[setting.key]?.[field.key] ?? '';
                                    return (
                                        <div key={field.key}>
                                            <label style={{
                                                display: 'block', fontSize: 11, fontWeight: 600,
                                                color: 'var(--color-text-muted)',
                                                textTransform: 'uppercase', letterSpacing: 0.5,
                                                marginBottom: 5,
                                            }}>
                                                {field.label}
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {field.suffix && (
                                                    <span style={{
                                                        fontSize: 16, fontWeight: 700,
                                                        color: 'var(--color-accent)',
                                                    }}>
                                                        {field.suffix}
                                                    </span>
                                                )}
                                                {field.type === 'boolean' ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFieldChange(setting.key, field.key, !currentValue)}
                                                            style={{
                                                                width: 44, height: 24, borderRadius: 12, border: 'none',
                                                                background: currentValue ? 'var(--color-success, #22c55e)' : 'var(--color-bg-tertiary, #2a2a2d)',
                                                                cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                                                position: 'absolute', top: 3,
                                                                left: currentValue ? 23 : 3, transition: 'left 0.2s',
                                                            }} />
                                                        </button>
                                                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                                            {currentValue ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                ) : field.type === 'textarea' ? (
                                                    <textarea
                                                        value={String(currentValue)}
                                                        onChange={e => handleFieldChange(setting.key, field.key, e.target.value)}
                                                        rows={10}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 14px',
                                                            background: 'var(--color-bg)',
                                                            border: '1.5px solid var(--color-border)',
                                                            borderRadius: 8,
                                                            fontSize: 14,
                                                            fontWeight: 500,
                                                            color: 'var(--color-text-primary)',
                                                            fontFamily: "'Inter', sans-serif",
                                                            outline: 'none',
                                                            transition: 'border-color 0.2s',
                                                            resize: 'vertical',
                                                            minHeight: '150px',
                                                        }}
                                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={String(currentValue)}
                                                        onChange={e => {
                                                            const val = field.type === 'number'
                                                                ? (e.target.value === '' ? '' : Number(e.target.value))
                                                                : e.target.value;
                                                            handleFieldChange(setting.key, field.key, val as string | number);
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 14px',
                                                            background: 'var(--color-bg)',
                                                            border: '1.5px solid var(--color-border)',
                                                            borderRadius: 8,
                                                            fontSize: 15,
                                                            fontWeight: 600,
                                                            color: 'var(--color-text-primary)',
                                                            fontFamily: "'Inter', sans-serif",
                                                            outline: 'none',
                                                            transition: 'border-color 0.2s',
                                                        }}
                                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Save Button */}
                            <div style={{
                                display: 'flex', justifyContent: 'flex-end',
                                marginTop: 16, paddingTop: 14,
                                borderTop: '1px solid var(--color-border)',
                            }}>
                                <button
                                    onClick={() => handleSave(setting.key)}
                                    disabled={!changed && !isSaved}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '8px 18px',
                                        background: isSaved ? '#16a34a' : changed ? 'var(--color-accent)' : 'var(--color-border)',
                                        color: isSaved ? '#fff' : changed ? '#0a0a0b' : 'var(--color-text-muted)',
                                        border: 'none', borderRadius: 8,
                                        fontSize: 12, fontWeight: 700,
                                        cursor: changed ? 'pointer' : 'default',
                                        fontFamily: "'Inter', sans-serif",
                                        transition: 'all 0.2s',
                                        opacity: changed || isSaved ? 1 : 0.5,
                                    }}
                                >
                                    {isSaving ? (
                                        <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                                    ) : isSaved ? (
                                        <><Check size={14} /> Saved!</>
                                    ) : (
                                        <><Save size={14} /> Save</>
                                    )}
                                </button>
                            </div>

                            {/* Last Updated */}
                            <div style={{
                                fontSize: 10, color: 'var(--color-text-muted)',
                                marginTop: 8, textAlign: 'right',
                            }}>
                                Updated: {new Date(setting.updated_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
