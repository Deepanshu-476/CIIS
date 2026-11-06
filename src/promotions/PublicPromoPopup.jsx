import React, { useEffect, useState } from "react";
import PromoLightbox from "./PromoLightbox";
import { slidesFromPromos } from "./PromoCarousel";
import { fetchPublicPromos } from "./promoApi";

// Before login (home page and login pages): platform promotions for everyone, as a
// full-screen popup. Once closed it stays closed in this browser until a promotion is
// added or changed.
const SEEN_KEY = "ciis_public_promo_seen";
const signatureOf = (promos) => promos.map((promo) => `${promo._id}:${promo.updatedAt}`).sort().join("|");

const PublicPromoPopup = () => {
    const [promos, setPromos] = useState([]);

    useEffect(() => {
        let alive = true;
        fetchPublicPromos()
            .then((list) => {
                if (!alive || !list.length) return;
                let seen = "";
                try { seen = localStorage.getItem(SEEN_KEY) || ""; } catch { /* storage blocked: show it */ }
                if (seen !== signatureOf(list)) setPromos(list);
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    if (!promos.length) return null;
    const close = () => {
        try { localStorage.setItem(SEEN_KEY, signatureOf(promos)); } catch { /* ignore */ }
        setPromos([]);
    };
    return <PromoLightbox slides={slidesFromPromos(promos)} onClose={close} />;
};

export default PublicPromoPopup;
