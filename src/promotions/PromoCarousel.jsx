import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { promoMediaUrl } from "./promoApi";
import "./promotions.css";

const IMAGE_SECONDS = 5;
const prefersReducedMotion = () => typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Slides = every media item of every promotion, with that promotion's title/message.
export const slidesFromPromos = (promos = []) => promos.flatMap((promo) => (promo.media || []).map((item, index) => ({
    key: `${promo._id}-${item._id || index}`,
    url: promoMediaUrl(item.url),
    type: item.type,
    name: item.name,
    title: promo.title,
    message: promo.message,
})));

// Image/video carousel: images advance every 5 s, a video plays to its end and then
// moves on. Arrows, dots, keyboard arrows and swipe all change slides.
const PromoCarousel = ({ slides = [], variant = "default", autoPlay = true, showCaption = true, className = "" }) => {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStart = useRef(null);
    const videoRefs = useRef({});
    const count = slides.length;
    const current = slides[Math.min(index, Math.max(0, count - 1))];

    useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);

    const go = useCallback((delta) => setIndex((value) => (count ? (value + delta + count) % count : 0)), [count]);

    // Auto-advance images; videos advance on "ended".
    useEffect(() => {
        if (!autoPlay || paused || count < 2 || !current || current.type === "video" || prefersReducedMotion()) return undefined;
        const timer = setTimeout(() => go(1), IMAGE_SECONDS * 1000);
        return () => clearTimeout(timer);
    }, [autoPlay, paused, count, current, go, index]);

    // Only the visible video plays.
    useEffect(() => {
        Object.entries(videoRefs.current).forEach(([key, video]) => {
            if (!video) return;
            if (key === current?.key) {
                if (autoPlay) video.play?.().catch(() => {});
            } else {
                video.pause?.();
            }
        });
    }, [current, autoPlay]);

    if (!count) return null;

    const onKeyDown = (event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    };
    const onTouchStart = (event) => { touchStart.current = event.touches[0]?.clientX ?? null; };
    const onTouchEnd = (event) => {
        if (touchStart.current === null) return;
        const dx = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchStart.current = null;
    };

    return (
        <div
            className={`promo-carousel promo-carousel--${variant} ${className}`}
            role="region"
            aria-roledescription="carousel"
            aria-label="Announcements"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <div className="promo-carousel-stage">
                {slides.map((slide, slideIndex) => (
                    <div
                        key={slide.key}
                        className={`promo-slide ${slideIndex === index ? "is-active" : ""}`}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${slideIndex + 1} of ${count}`}
                        aria-hidden={slideIndex !== index}
                    >
                        {slide.type === "video" ? (
                            <video
                                ref={(node) => { videoRefs.current[slide.key] = node; }}
                                src={slide.url}
                                muted
                                playsInline
                                controls={slideIndex === index}
                                preload={slideIndex === index ? "auto" : "metadata"}
                                onEnded={() => count > 1 && go(1)}
                            />
                        ) : (
                            <>
                                {/* The same picture, blurred, fills the sides when its shape differs from the frame. */}
                                <div className="promo-slide-bg" style={{ backgroundImage: `url("${slide.url}")` }} aria-hidden="true" />
                                <img src={slide.url} alt={slide.title || slide.name || "Announcement"} loading={slideIndex === index ? "eager" : "lazy"} />
                            </>
                        )}
                    </div>
                ))}
                {count > 1 && (
                    <>
                        <button type="button" className="promo-nav promo-nav--prev" onClick={() => go(-1)} aria-label="Previous slide">
                            <ChevronLeft size={20} />
                        </button>
                        <button type="button" className="promo-nav promo-nav--next" onClick={() => go(1)} aria-label="Next slide">
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}
            </div>
            {showCaption && (current.title || current.message) && (
                <div className="promo-caption">
                    {current.title && <strong>{current.title}</strong>}
                    {current.message && <p>{current.message}</p>}
                </div>
            )}
            {count > 1 && (
                <div className="promo-dots" role="tablist" aria-label="Choose slide">
                    {slides.map((slide, slideIndex) => (
                        <button
                            key={slide.key}
                            type="button"
                            role="tab"
                            aria-selected={slideIndex === index}
                            aria-label={`Slide ${slideIndex + 1}`}
                            className={`promo-dot ${slideIndex === index ? "is-active" : ""}`}
                            onClick={() => setIndex(slideIndex)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromoCarousel;
