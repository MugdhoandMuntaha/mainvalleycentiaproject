'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        }>
            <AuthPageContent />
        </Suspense>
    );
}

function AuthPageContent() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [acceptMarketing, setAcceptMarketing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { user, signIn, signUp, signInWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/admin';

    // Redirect if already logged in
    useEffect(() => {
        if (user) router.push(redirectTo);
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        if (mode === 'login') {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error.message);
            } else {
                router.push(redirectTo);
            }
        } else {
            if (!fullName.trim()) {
                setError('Please enter your full name.');
                setSubmitting(false);
                return;
            }
            if (!agreedToTerms) {
                setError('You must agree to the Terms of Service and Privacy Policy to register.');
                setSubmitting(false);
                return;
            }
            const { error } = await signUp(email, password, fullName);
            if (error) {
                setError(error.message);
            } else {
                setSuccess('Account created successfully!');
            }
        }
        setSubmitting(false);
    };

    const handleGoogle = async () => {
        setError('');
        const { error } = await signInWithGoogle();
        if (error) setError(error.message);
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setError('');
        setSuccess('');
    };

    return (
        <div style={{
            minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f8f8f5', fontFamily: "'Inter', sans-serif", padding: '48px 24px',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '100%', maxWidth: '440px', background: '#ffffff',
                    borderRadius: '20px', padding: '40px 36px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
                }}
            >
                {/* Back Link */}
                <a href={process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    color: '#888', fontSize: '13px', fontWeight: 500, textDecoration: 'none',
                    marginBottom: '28px', transition: 'color 0.2s',
                }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1a1a1a'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                >
                    <ArrowLeft size={14} />
                    Back to store
                </a>

                {/* Header */}
                <h1 style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: '28px', fontWeight: 700,
                    color: '#1a1a1a', marginBottom: '6px',
                }}>
                    {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p style={{ fontSize: '14px', color: '#888', marginBottom: '28px' }}>
                    {mode === 'login'
                        ? 'Sign in to access your account and orders.'
                        : 'Join Valleycentia for exclusive offers and easy checkout.'}
                </p>

                {/* Google Button */}
                <button
                    onClick={handleGoogle}
                    style={{
                        width: '100%', padding: '13px', borderRadius: '12px',
                        border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        fontSize: '14px', fontWeight: 600, color: '#1a1a1a',
                        fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                        marginBottom: '20px',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#ccc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px',
                }}>
                    <div style={{ flex: 1, height: '1px', background: '#eee' }} />
                    <span style={{ fontSize: '12px', color: '#bbb', fontWeight: 500 }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#eee' }} />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Full Name (Signup only) */}
                    {mode === 'signup' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px', display: 'block' }}>
                                Full Name
                            </label>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                border: '1.5px solid #e0e0e0', borderRadius: '10px', padding: '0 14px',
                                transition: 'border-color 0.2s', background: '#fafafa',
                            }}>
                                <User size={16} color="#aaa" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    style={{
                                        flex: 1, border: 'none', outline: 'none', padding: '13px 0',
                                        fontSize: '14px', fontFamily: "'Inter', sans-serif",
                                        background: 'transparent', color: '#1a1a1a',
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Email */}
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px', display: 'block' }}>
                            Email Address
                        </label>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            border: '1.5px solid #e0e0e0', borderRadius: '10px', padding: '0 14px',
                            transition: 'border-color 0.2s', background: '#fafafa',
                        }}>
                            <Mail size={16} color="#aaa" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                style={{
                                    flex: 1, border: 'none', outline: 'none', padding: '13px 0',
                                    fontSize: '14px', fontFamily: "'Inter', sans-serif",
                                    background: 'transparent', color: '#1a1a1a',
                                }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '6px', display: 'block' }}>
                            Password
                        </label>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            border: '1.5px solid #e0e0e0', borderRadius: '10px', padding: '0 14px',
                            transition: 'border-color 0.2s', background: '#fafafa',
                        }}>
                            <Lock size={16} color="#aaa" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                style={{
                                    flex: 1, border: 'none', outline: 'none', padding: '13px 0',
                                    fontSize: '14px', fontFamily: "'Inter', sans-serif",
                                    background: 'transparent', color: '#1a1a1a',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '4px', display: 'flex', color: '#aaa',
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Terms & Privacy / Marketing Checkboxes (Signup only) */}
                    {mode === 'signup' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', marginBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#555', userSelect: 'none' }}>
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    style={{ marginTop: '3px', cursor: 'pointer' }}
                                />
                                <span>
                                    I agree to the{' '}
                                    <Link href="/terms" target="_blank" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'underline' }}>
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" target="_blank" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'underline' }}>
                                        Privacy Policy
                                    </Link>
                                    .
                                </span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#555', userSelect: 'none' }}>
                                <input
                                    type="checkbox"
                                    checked={acceptMarketing}
                                    onChange={(e) => setAcceptMarketing(e.target.checked)}
                                    style={{ marginTop: '3px', cursor: 'pointer' }}
                                />
                                <span>
                                    Keep me updated on exclusive offers, news, and promotions.
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Error / Success */}
                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                            fontSize: '13px', color: '#ef4444', fontWeight: 500, margin: 0,
                            background: '#fef2f2', padding: '10px 14px', borderRadius: '8px',
                        }}>
                            {error}
                        </motion.p>
                    )}
                    {success && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                            fontSize: '13px', color: '#2e7d32', fontWeight: 500, margin: 0,
                            background: '#e8f5e9', padding: '10px 14px', borderRadius: '8px',
                        }}>
                            {success}
                        </motion.p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%', padding: '14px', background: '#f5c518', color: '#1a1a1a',
                            border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                            letterSpacing: '0.5px', cursor: submitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease', textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif", marginTop: '4px',
                            opacity: submitting ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}
                        onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#e6b800'; }}
                        onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#f5c518'; }}
                    >
                        {submitting && <Loader2 size={16} className="spin" />}
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                {/* Toggle Mode */}
                <p style={{
                    textAlign: 'center', fontSize: '14px', color: '#888', marginTop: '24px',
                }}>
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                        onClick={switchMode}
                        style={{
                            background: 'none', border: 'none', color: '#1a1a1a',
                            fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                            fontFamily: "'Inter', sans-serif", textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                        }}
                    >
                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
