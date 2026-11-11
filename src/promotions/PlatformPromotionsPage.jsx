import React from "react";
import PromoManager from "./PromoManager";

// Super Admin → Promotions: before-login carousel for everyone, after-login popups and
// push notifications for chosen companies.
const PlatformPromotionsPage = () => <PromoManager scope="platform" />;

export default PlatformPromotionsPage;
