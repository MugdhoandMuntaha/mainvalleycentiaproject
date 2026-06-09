'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroSlide {
    image: string;
    mobileImage?: string;
    alt: string;
    background: string;
    link?: string;
}

interface HeroCarouselProps {
    slides?: HeroSlide[];
}

export default function HeroCarousel({ slides = [] }: HeroCarouselProps) {
    const [current, setCurrent] = useState(0);
    const [imgError, setImgError] = useState<Set<number>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragDelta, setDragDelta] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const goTo = useCallback((index: number) => {
        setCurrent(index);
        setDragDelta(0);
    }, []);

    const handleImgError = (index: number) => {
        setImgError((prev) => new Set(prev).add(index));
    };

    const goNext = useCallback(() => {
        if (slides.length === 0) return;
        setCurrent((prev) => (prev + 1) % slides.length);
        setDragDelta(0);
    }, [slides.length]);

    const goPrev = useCallback(() => {
        if (slides.length === 0) return;
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
        setDragDelta(0);
    }, [slides.length]);

    // Auto-advance
    const resetAutoPlay = useCallback(() => {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        if (slides.length > 1) {
            autoPlayRef.current = setInterval(goNext, 5000);
        }
    }, [goNext, slides.length]);

    useEffect(() => {
        resetAutoPlay();
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [resetAutoPlay]);

    // Pointer handlers for drag/swipe
    const handlePointerDown = (e: React.PointerEvent) => {
        if (slides.length <= 1) return;
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragDelta(0);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setDragDelta(e.clientX - dragStartX);
    };

    const handlePointerUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const threshold = 80;
        if (dragDelta < -threshold) {
            goNext();
        } else if (dragDelta > threshold) {
            goPrev();
        } else {
            setDragDelta(0);
        }
        resetAutoPlay();
    };

    // Only navigate if it was a click (not a drag)
    const wasClick = useRef(true);
    const handleClickDown = () => { wasClick.current = true; };
    const handleClickMove = () => { if (Math.abs(dragDelta) > 5) wasClick.current = false; };
    const handleClick = (e: React.MouseEvent) => {
        if (!wasClick.current) e.preventDefault();
    };

    if (!slides || slides.length === 0) {
        return null;
    }

    const slide = slides[current];

    return (
        <section
            ref={containerRef}
            className="hero-section"
            style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                background: slide.background,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'pan-y',
                transition: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Slide Content */}
            <div
                className="hero-slide-content"
                style={{
                    width: '100%',
                    lineHeight: 0,
                    transition: 'none',
                }}
            >
                {imgError.has(current) ? (
                    <div
                        style={{
                            width: '100%',
                            aspectRatio: '1920/600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: '32px',
                                fontWeight: 700,
                                color: '#4a3f35',
                                textAlign: 'center',
                                lineHeight: 1.3,
                            }}
                        >
                            {slide.alt}
                        </span>
                    </div>
                ) : (
                    <>
                        {/* Desktop Image */}
                        <div className="desktop-hero-image">
                            <Image
                                src={slide.image}
                                alt={slide.alt}
                                width={1920}
                                height={600}
                                priority
                                sizes="100vw"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                }}
                                draggable={false}
                                onError={() => handleImgError(current)}
                            />
                        </div>

                        {/* Mobile Image */}
                        <div className="mobile-hero-image">
                            <Image
                                src={slide.mobileImage || slide.image}
                                alt={slide.alt}
                                width={800}
                                height={800}
                                priority
                                sizes="100vw"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                                draggable={false}
                                onError={() => handleImgError(current)}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Click Overlay Link — makes the entire slide clickable */}
            {slide.link && (
                <Link
                    href={slide.link}
                    onMouseDown={handleClickDown}
                    onMouseMove={handleClickMove}
                    onClick={handleClick}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 5,
                        cursor: 'pointer',
                    }}
                    draggable={false}
                    aria-label={slide.alt}
                />
            )}

            {/* Carousel Dots */}
            <div
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0px',
                    position: 'absolute',
                    bottom: '16px',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    pointerEvents: 'none',
                }}
            >
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            goTo(idx);
                            resetAutoPlay();
                        }}
                        style={{
                            width: '20px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            pointerEvents: 'auto',
                        }}
                        aria-label={`Slide ${idx + 1}`}
                    >
                        <span
                            style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: idx === current ? '#1a1a1a' : 'transparent',
                                border: `1.5px solid ${idx === current ? '#1a1a1a' : 'rgba(26, 26, 26, 0.4)'}`,
                                display: 'block',
                                transition: 'all 0.3s ease',
                                transform: idx === current ? 'scale(1.1)' : 'scale(1)',
                            }}
                        />
                    </button>
                ))}
            </div>
        </section>
    );
}
