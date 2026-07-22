import axios from "axios";
import API_URL from "../config";

const resolvedApiUrl = import.meta.env.VITE_API_URL || API_URL;
const productionApiUrl = import.meta.env.VITE_FALLBACK_API_URL || "https://backendcds.ciisnetwork.in/api";
const isLocalApiUrl = /^https?:\/\/(127\.0\.0\.1|localhost):3000\/api/i.test(resolvedApiUrl);

const axiosInstance = axios.create({
  baseURL: resolvedApiUrl,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const responseErrorHandler = (error) => {
  if (
    axios.isCancel(error) ||
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError"
  ) {
    return Promise.reject(error);
  }

  if (error.config?._skipErrorNotify) {
    return Promise.reject(error);
  }

  if (
    !error.response &&
    isLocalApiUrl &&
    !error.config?._productionFallbackRetried &&
    String(error.config?.url || "").startsWith("/email-settings")
  ) {
    return axiosInstance.request({
      ...error.config,
      baseURL: productionApiUrl,
      _productionFallbackRetried: true,
    });
  }

  // A failed page request must never destroy the active login session.
  // Session storage is cleared only by an explicit Logout action.
  return Promise.reject(error);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  responseErrorHandler,
);

export default axiosInstance;
