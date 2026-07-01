import axios from "axios";
import API_URL from "../config";

const axiosInstance = axios.create({
  // Never let a local Vite session call or mutate production data. Vite
  // proxies /api to the backend running on localhost:3000.
  baseURL: import.meta.env.DEV ? "/api" : API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const responseErrorHandler = (error) => {
  // If the request was cancelled (e.g. via AbortController/CancelToken), do not show error toast
  if (axios.isCancel(error) || error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
    return Promise.reject(error);
  }

  // If the request was configured to skip global error notification, ignore it
  if (error.config?._skipErrorNotify) {
    return Promise.reject(error);
  }

  // Keep global axios errors silent. Pages can still handle errors locally,
  // while auth expiry keeps its redirect behavior without showing a toast.
  if (error.response?.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (!window.location.pathname.includes("/login")) {
      const companyCode = localStorage.getItem("companyCode") || localStorage.getItem("companyIdentifier");
      setTimeout(() => {
        if (companyCode) {
          window.location.href = `/company/${companyCode}/login`;
        } else {
          window.location.href = `/login`;
        }
      }, 1500);
    }
  }

  return Promise.reject(error);
};

// Bind interceptors to both standard default axios and custom axiosInstance.
axios.interceptors.response.use((response) => response, responseErrorHandler);
axiosInstance.interceptors.response.use((response) => response, responseErrorHandler);

export default axiosInstance;
