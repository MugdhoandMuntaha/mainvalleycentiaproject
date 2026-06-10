'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import Image from 'next/image';
import { getSiteSettings } from '@/lib/db/queries';

const DEFAULT_FOOTER_LINKS = {
    shop: [
        { name: 'New Arrivals', href: '/shop?sort=new' },
        { name: 'Best Sellers', href: '/shop?sort=popular' },
        { name: 'Sale', href: '/shop?sale=true' },
        { name: 'All Products', href: '/shop' },
    ],
    company: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press', href: '/press' },
        { name: 'Blog', href: '/blog' },
    ],
    support: [
        { name: 'Help Center', href: '/help' },
        { name: 'Delivery Policy', href: '/shipping' },
        { name: 'Return & Refund Policy', href: '/returns' },
        { name: 'Order Tracking', href: '/tracking' },
    ],
    legal: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms & Conditions', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
    ],
};

export default function Footer() {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        getSiteSettings().then(data => {
            setSettings(data);
        }).catch(err => {
            console.error('Failed to fetch footer settings:', err);
        });
    }, []);

    // Extract dynamic footer parameters with safe fallbacks
    const aboutText = settings?.footer_about_text?.text || 
        'Curating premium fashion and accessories for the modern lifestyle. Quality craftsmanship meets contemporary design.';

    const contactEmail = settings?.footer_contact_info?.email || 'hello@valleycentia.com';
    const contactPhone = settings?.footer_contact_info?.phone || '+1 (234) 567-890';
    const contactAddress = settings?.footer_contact_info?.address || 'New York, NY 10001';

    const facebookUrl = settings?.footer_social_links?.facebook || '#';
    const instagramUrl = settings?.footer_social_links?.instagram || '#';
    const twitterUrl = settings?.footer_social_links?.twitter || '#';
    const youtubeUrl = settings?.footer_social_links?.youtube || '#';

    const socialLinks = [
        { icon: Facebook, href: facebookUrl, label: 'Facebook' },
        { icon: Instagram, href: instagramUrl, label: 'Instagram' },
        { icon: Twitter, href: twitterUrl, label: 'Twitter' },
        { icon: Youtube, href: youtubeUrl, label: 'Youtube' },
    ];

    let footerLinks = DEFAULT_FOOTER_LINKS;
    if (settings?.footer_links?.links_json) {
        try {
            footerLinks = JSON.parse(settings.footer_links.links_json);
        } catch (e) {
            console.error('Failed to parse footer_links JSON from settings', e);
        }
    }

    return (
        <footer
            style={{
                background: '#000000',
                borderTop: '1px solid var(--color-border)',
            }}
        >
            {/* Main Footer */}
            <div
                style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '64px 40px 48px',
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                    gap: '48px',
                }}
                className="footer-grid"
            >
                {/* Brand Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Image
                            src="/logo69.png"
                            alt="ValleyCentia Logo"
                            width={180}
                            height={45}
                            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                        />
                    </Link>
                    <p
                        style={{
                            fontSize: '14px',
                            lineHeight: '1.7',
                            color: 'var(--color-text-muted)',
                            maxWidth: '280px',
                        }}
                    >
                        {aboutText}
                    </p>

                    {/* Contact Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <a
                            href={`mailto:${contactEmail}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '13px',
                                color: 'var(--color-text-muted)',
                                transition: 'color var(--transition-fast)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        >
                            <Mail size={15} />
                            {contactEmail}
                        </a>
                        <a
                            href={`tel:${contactPhone}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '13px',
                                color: 'var(--color-text-muted)',
                                transition: 'color var(--transition-fast)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        >
                            <Phone size={15} />
                            {contactPhone}
                        </a>
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '13px',
                                color: 'var(--color-text-muted)',
                            }}
                        >
                            <MapPin size={15} />
                            {contactAddress}
                        </span>
                    </div>
                </div>

                {/* Link Columns */}
                {Object.entries(footerLinks).map(([title, links]) => (
                    <div key={title}>
                        <h4
                            style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '1.2px',
                                marginBottom: '20px',
                            }}
                        >
                            {title}
                        </h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none' }}>
                            {Array.isArray(links) && links.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        style={{
                                            fontSize: '14px',
                                            color: 'var(--color-text-muted)',
                                            transition: 'color var(--transition-fast)',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom Bar */}
            <div
                className="footer-bottom-bar"
                style={{
                    borderTop: '1px solid var(--color-border)',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '24px 40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                }}
            >
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    © {new Date().getFullYear()} Valleycentia. All rights reserved.
                </p>

                {/* Social Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {socialLinks.map((social) => (
                        <a
                            key={social.label}
                            href={social.href}
                            aria-label={social.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-text-muted)',
                                transition: 'all var(--transition-fast)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-accent)';
                                e.currentTarget.style.background = 'rgba(201,169,110,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                                e.currentTarget.style.background = 'none';
                            }}
                        >
                            <social.icon size={18} />
                        </a>
                    ))}
                </div>

                {/* Payment Methods */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((method) => (
                        <span
                            key={method}
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--color-text-muted)',
                                background: 'var(--color-bg-tertiary)',
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            {method}
                        </span>
                    ))}
                </div>
            </div>
        </footer>
    );
}
