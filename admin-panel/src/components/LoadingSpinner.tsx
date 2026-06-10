'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    fullPage?: boolean;
}

export default function LoadingSpinner({
    message = 'Loading...',
    size = 'md',
    fullPage = true,
}: LoadingSpinnerProps) {
    const spinnerSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64;
    const dotSize = size === 'sm' ? 6 : size === 'md' ? 8 : 10;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: fullPage ? '60vh' : '200px',
                width: '100%',
                gap: '24px',
                padding: '40px 20px',
            }}
        >
            {/* Spinner ring */}
            <div style={{ position: 'relative', width: spinnerSize, height: spinnerSize }}>
                {/* Outer ring (faded) */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: `${size === 'sm' ? 3 : 4}px solid #e8e8e8`,
                    }}
                />
                {/* Animated spinning arc */}
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: `${size === 'sm' ? 3 : 4}px solid transparent`,
                        borderTopColor: '#0d6b3d',
                        borderRightColor: '#0d6b3d',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
                {/* Inner pulsing dot */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: dotSize,
                        height: dotSize,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0d6b3d, #15a05e)',
                        transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            {/* Loading text */}
            {message && (
                <motion.p
                    style={{
                        fontSize: size === 'sm' ? '13px' : '15px',
                        fontWeight: 500,
                        color: '#888',
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '0.3px',
                        margin: 0,
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
}
