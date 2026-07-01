import axios from "axios";
import API_URL from "../config";
import { toast } from "react-toastify";

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

// A set to keep track of active toast messages to prevent flooding the screen with identical popups
const activeToasts = new Set();
let lastToastTime = 0;

const showToastError = (message) => {
  if (activeToasts.has(message)) return;

  // Prevent toast storms (allow at most 1 toast every 2 seconds)
  const now = Date.now();
  if (now - lastToastTime < 2000) {
    console.log("Suppressed duplicate toast error: ", message);
    return;
  }

  activeToasts.add(message);
  lastToastTime = now;
  
  toast.error(message, {
    position: "top-right",
    autoClose: 6000, // Show for 6 seconds so user has enough time to read clearly
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    onClose: () => activeToasts.delete(message),
  });
};

const responseErrorHandler = (error) => {
  // If the request was cancelled (e.g. via AbortController/CancelToken), do not show error toast
  if (axios.isCancel(error) || error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
    return Promise.reject(error);
  }

  // If the request was configured to skip global error notification, ignore it
  if (error.config?._skipErrorNotify) {
    return Promise.reject(error);
  }

  let title = "⚠️ Request Failed";
  let message = "An unexpected error occurred. Please try again.";

  if (error.response) {
    // The server responded with a status code out of the 2xx range
    const data = error.response.data;
    
    // Extract base message
    const rawMessage = data?.message || data?.error;
    if (rawMessage) {
      message = rawMessage;
    } else {
      message = `Request failed with status code ${error.response.status}`;
    }

    // Capture validation errors beautifully if they exist, detailing the exact field/section
    if (data?.errors) {
      let formattedList = [];
      if (Array.isArray(data.errors)) {
        formattedList = data.errors.map(item => {
          if (!item) return "";
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            const field = item.path || item.field || (Array.isArray(item.path) ? item.path.join('.') : "");
            const msg = item.msg || item.message || JSON.stringify(item);
            return field ? `[Field: ${field}] ${msg}` : msg;
          }
          return String(item);
        }).filter(Boolean);
      } else if (typeof data.errors === 'object') {
        formattedList = Object.entries(data.errors).map(([key, val]) => {
          if (!val) return "";
          if (typeof val === 'string') return `[Field: ${key}] ${val}`;
          if (typeof val === 'object') {
            const msg = val.message || val.msg || JSON.stringify(val);
            return `[Field: ${key}] ${msg}`;
          }
          return `[Field: ${key}] ${val}`;
        }).filter(Boolean);
      }

      if (formattedList.length > 0) {
        message += `\n\nValidation Errors:\n• ${formattedList.join('\n• ')}`;
      }
    }

    // Append actionable suggestion if provided by backend
    if (data?.suggestion) {
      message += `\n\n💡 Suggestion: ${data.suggestion}`;
    }

    // Special status code messages
    if (error.response.status === 401) {
      title = "🔒 Session Expired";
      message = "Your session has expired. Please log in again.";
      
      // Clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect if not already on a login page
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
    } else if (error.response.status === 403) {
      title = "🚫 Access Denied";
      message = rawMessage || "You do not have permission to perform this action.";
    } else if (error.response.status === 404) {
      title = "🔍 Not Found";
      message = rawMessage || "The requested resource could not be found.";
    }
  } else if (error.request) {
    // The request was made but no response was received. Skip showing toast.
    return Promise.reject(error);
  } else {
    // Something happened in setting up the request that triggered an Error
    title = "⚙️ App Error";
    message = error.message || "Something went wrong while sending the request.";
  }

  const finalToastText = `[${title}]\n${message}`;
  showToastError(finalToastText);
  return Promise.reject(error);
};

// Bind interceptors to both standard default axios and custom axiosInstance
axios.interceptors.response.use((response) => response, responseErrorHandler);
axiosInstance.interceptors.response.use((response) => response, responseErrorHandler);

export default axiosInstance;
