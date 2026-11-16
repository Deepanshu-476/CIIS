import React, { useEffect, useState } from "react";
import PromoManager from "./PromoManager";
import { fetchPromoAccess } from "./promoApi";

// Company → Promotions: popups and push notifications for the user's own company.
// The server decides access (owner, or the page given in Sidebar Management).
const CompanyPromotionsPage = () => {
    const [access, setAccess] = useState(null);
    useEffect(() => {
        fetchPromoAccess().then((data) => setAccess(Boolean(data.company))).catch(() => setAccess(false));
    }, []);
    if (access === null) return <div className="pm-page"><p className="pm-muted">Loading…</p></div>;
    if (!access) {
        return (
            <div className="pm-page">
                <div className="pm-card pm-empty">
                <h2>Promotions</h2>
                <p>You do not have access to this page. Ask your company owner to give you “Promotions” in Sidebar Management.</p>
                </div>
            </div>
        );
    }
    return <PromoManager scope="company" />;
};

export default CompanyPromotionsPage;
