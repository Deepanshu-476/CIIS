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

  if (error.response?.status === 401) {
    const authMessage = String(error.response?.data?.message || "").toLowerCase();
    const sessionIsInvalid = [
      "token expired",
      "invalid token",
      "user not found",
      "account is deactivated",
      "user account is deactivated",
      "company account is deactivated",
      "recently changed password",
    ].some((reason) => authMessage.includes(reason));

    // A single page API may reject the current role. It must not destroy the
    // user's valid session; only a genuinely invalid session triggers logout.
    if (sessionIsInvalid) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const companyCode =
        localStorage.getItem("companyCode") ||
        localStorage.getItem("companyIdentifier");
      const loginPath = companyCode ? `/company/${companyCode}/login` : "/";

      if (window.location.pathname !== loginPath) {
        window.location.replace(loginPath);
      }
    }
  }

  return Promise.reject(error);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  responseErrorHandler,
);

export default axiosInstance;
