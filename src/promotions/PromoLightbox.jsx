import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import "./promotions.css";

const IMAGE_SECONDS = 6;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Full-screen popup for promotions: each image or video shows at its own shape and size
// (scaled to fit the screen), with arrows/dots/swipe for several, and Esc/✕/backdrop to close.
// Used before login, after login, and for the admin's preview.
const PromoLightbox = ({ slides = [], onClose, label = "Announcements" }) => {
    const [index, setIndex] = useState(0);
    const closeRef = useRef(null);
    const touchStart = useRef(null);
    const count = slides.length;
    const slide = slides[Math.min(index, Math.max(0, count - 1))];

    const go = useCallback((delta) => setIndex((value) => (count ? (value + delta + count) % count : 0)), [count]);

    useEffect(() => { closeRef.current?.focus(); }, []);
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape") onClose?.();
            if (event.key === "ArrowRight") go(1);
            if (event.key === "ArrowLeft") go(-1);
        };
        document.addEventListener("keydown", onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [go, onClose]);

    // Images move on by themselves; a video moves on when it ends.
    useEffect(() => {
        if (count < 2 || !slide || slide.type === "video" || reducedMotion()) return undefined;
        const timer = setTimeout(() => go(1), IMAGE_SECONDS * 1000);
        return () => clearTimeout(timer);
    }, [count, slide, index, go]);

    if (!count) return null;

    return (
        <div
            className="pl-backdrop"
            onClick={onClose}
            onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? null; }}
            onTouchEnd={(e) => {
                if (touchStart.current === null) return;
                const dx = (e.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
                touchStart.current = null;
            }}
        >
            <div className="pl-dialog" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
                <button ref={closeRef} type="button" className="pl-close" onClick={onClose} aria-label="Close">
                    <X size={20} />
                </button>
                <div className="pl-media" aria-live="polite">
                    {slide.type === "video" ? (
                        <video key={slide.key} src={slide.url} autoPlay muted playsInline controls onEnded={() => count > 1 && go(1)} />
                    ) : (
                        <img key={slide.key} src={slide.url} alt={slide.title || slide.name || "Announcement"} />
                    )}
                    {count > 1 && (
                        <>
                            <button type="button" className="pl-nav pl-prev" onClick={() => go(-1)} aria-label="Previous"><ChevronLeft size={22} /></button>
                            <button type="button" className="pl-nav pl-next" onClick={() => go(1)} aria-label="Next"><ChevronRight size={22} /></button>
                        </>
                    )}
                </div>
                {(slide.title || slide.message) && (
                    <div className="pl-caption">
                        {slide.title && <strong>{slide.title}</strong>}
                        {slide.message && <p>{slide.message}</p>}
                    </div>
                )}
                {count > 1 && (
                    <div className="pl-dots" role="tablist" aria-label="Choose slide">
                        {slides.map((item, i) => (
                            <button
                                key={item.key}
                                type="button"
                                role="tab"
                                aria-selected={i === index}
                                aria-label={`Slide ${i + 1} of ${count}`}
                                className={i === index ? "is-on" : ""}
                                onClick={() => setIndex(i)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromoLightbox;
