import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import PromoCarousel, { slidesFromPromos } from "./PromoCarousel";
import { fetchPromoFeed } from "./promoApi";

// After login: a popup with the promotions for this user's company. Once closed it
// stays closed until a promotion is added or changed (remembered per user).
const seenKey = (userId) => `ciis_promo_seen_${userId || "user"}`;
const signatureOf = (promos) => promos.map((promo) => `${promo._id}:${promo.updatedAt}`).sort().join("|");
const readSeen = (userId) => {
    try { return localStorage.getItem(seenKey(userId)) || ""; } catch { return ""; }
};
const writeSeen = (userId, value) => {
    try { localStorage.setItem(seenKey(userId), value); } catch { /* private mode: show again next time */ }
};

const PromoPopup = ({ userId, enabled = true }) => {
    const [promos, setPromos] = useState([]);
    const [open, setOpen] = useState(false);
    const closeRef = useRef(null);

    useEffect(() => {
        if (!enabled || !userId) return undefined;
        let alive = true;
        fetchPromoFeed()
            .then((list) => {
                if (!alive || !list.length) return;
                if (readSeen(userId) === signatureOf(list)) return;
                setPromos(list);
                setOpen(true);
            })
            .catch(() => {});
        return () => { alive = false; };
    }, [enabled, userId]);

    const close = () => {
        writeSeen(userId, signatureOf(promos));
        setOpen(false);
    };

    useEffect(() => {
        if (!open) return undefined;
        closeRef.current?.focus();
        const onKey = (event) => { if (event.key === "Escape") close(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    if (!open || !promos.length) return null;
    return (
        <div className="promo-popup-backdrop" onClick={close}>
            <div className="promo-popup" role="dialog" aria-modal="true" aria-label="Announcements" onClick={(event) => event.stopPropagation()}>
                <button ref={closeRef} type="button" className="promo-popup-close" onClick={close} aria-label="Close announcements">
                    <X size={20} />
                </button>
                <PromoCarousel slides={slidesFromPromos(promos)} variant="popup" />
            </div>
        </div>
    );
};

export default PromoPopup;
