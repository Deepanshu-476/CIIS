import axios from "../utils/axiosConfig";
import { API_URL_IMG } from "../config";

// Promotions API (backend: /api/promos). Manage calls pass ?scope= so the server can
// check permission before it accepts any upload.
export const promoMediaUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${String(API_URL_IMG || "").replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const fetchPublicPromos = () => axios.get("/promos/public", { _skipErrorNotify: true, skipAuthRedirect: true })
    .then((res) => res.data?.promos || []);
export const fetchPromoFeed = () => axios.get("/promos/feed", { _skipErrorNotify: true })
    .then((res) => res.data?.promos || []);
export const fetchPromoAccess = () => axios.get("/promos/access", { _skipErrorNotify: true }).then((res) => res.data || {});
export const fetchPromoCompanies = () => axios.get("/promos/companies", { _skipErrorNotify: true })
    .then((res) => res.data?.companies || []);
export const fetchManagedPromos = (scope) => axios.get("/promos/manage", { params: { scope }, _skipErrorNotify: true })
    .then((res) => res.data?.promos || []);

export const savePromo = (scope, formData, { id, onUploadProgress } = {}) => {
    const url = id ? `/promos/manage/${id}` : "/promos/manage";
    return axios({
        method: id ? "put" : "post",
        url,
        params: { scope },
        data: formData,
        timeout: 0,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress,
        _skipErrorNotify: true,
    }).then((res) => res.data);
};

export const setPromoActive = (scope, id, isActive) => {
    const form = new FormData();
    form.append("isActive", String(isActive));
    return savePromo(scope, form, { id });
};
export const deletePromo = (scope, id) => axios.delete(`/promos/manage/${id}`, { params: { scope }, _skipErrorNotify: true });
export const notifyPromo = (scope, id) => axios.post(`/promos/manage/${id}/notify`, {}, { params: { scope }, _skipErrorNotify: true })
    .then((res) => res.data);
export const sendStandaloneNotification = (scope, payload) => axios.post("/promos/notify", payload, { params: { scope }, _skipErrorNotify: true })
    .then((res) => res.data);

export const errorMessage = (error, fallback) => error?.response?.data?.message || (!error?.response ? "Network problem — check your connection" : fallback);
