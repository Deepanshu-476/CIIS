import React, { useEffect, useState } from "react";
import PromoLightbox from "./PromoLightbox";
import { slidesFromPromos } from "./PromoCarousel";
import { fetchPromoFeed } from "./promoApi";

// After login: the promotions for this user's company, as a full-screen popup. Once
// closed it stays closed until a promotion is added or changed (remembered per user).
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

    useEffect(() => {
        if (!enabled || !userId) return undefined;
        let alive = true;
        fetchPromoFeed()
            .then((list) => {
                if (alive && list.length && readSeen(userId) !== signatureOf(list)) setPromos(list);
            })
            .catch(() => {});
        return () => { alive = false; };
    }, [enabled, userId]);

    if (!promos.length) return null;
    const close = () => {
        writeSeen(userId, signatureOf(promos));
        setPromos([]);
    };
    return <PromoLightbox slides={slidesFromPromos(promos)} onClose={close} />;
};

export default PromoPopup;
