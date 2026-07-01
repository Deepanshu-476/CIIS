import axios from "axios";
import API_URL from "../config";

const axiosInstance = axios.create({
  
  
  baseURL: import.meta.env.DEV ? "/api" : API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const responseErrorHandler = (error) => {
  
  if (axios.isCancel(error) || error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
    return Promise.reject(error);
  }

  
  if (error.config?._skipErrorNotify) {
    return Promise.reject(error);
  }

  
  
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

    
    if (data?.suggestion) {
      message += `\n\n💡 Suggestion: ${data.suggestion}`;
    }

    
    if (error.response.status === 401) {
      title = "🔒 Session Expired";
      message = "Your session has expired. Please log in again.";
      
      
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
    } else if (error.response.status === 403) {
      title = "🚫 Access Denied";
      message = rawMessage || "You do not have permission to perform this action.";
    } else if (error.response.status === 404) {
      title = "🔍 Not Found";
      message = rawMessage || "The requested resource could not be found.";
    }
  } else if (error.request) {
    
    return Promise.reject(error);
  } else {
    
    title = "⚙️ App Error";
    message = error.message || "Something went wrong while sending the request.";
  }

  return Promise.reject(error);
};


axios.interceptors.response.use((response) => response, responseErrorHandler);
axiosInstance.interceptors.response.use((response) => response, responseErrorHandler);

export default axiosInstance;
