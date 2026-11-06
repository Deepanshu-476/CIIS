import React, { useEffect, useState } from "react";
import PromoCarousel, { slidesFromPromos } from "./PromoCarousel";
import { fetchPublicPromos } from "./promoApi";

// Login screens: platform promotions meant for everyone before login.
// Renders nothing (and keeps the old layout) when there are none.
const PublicPromoCarousel = ({ variant = "login", className = "", onHasSlides }) => {
    const [slides, setSlides] = useState([]);

    useEffect(() => {
        let alive = true;
        fetchPublicPromos()
            .then((promos) => { if (alive) setSlides(slidesFromPromos(promos)); })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    useEffect(() => { onHasSlides?.(slides.length > 0); }, [slides.length, onHasSlides]);

    if (!slides.length) return null;
    return <PromoCarousel slides={slides} variant={variant} className={className} />;
};

export default PublicPromoCarousel;
