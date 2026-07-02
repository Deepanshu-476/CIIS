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

  // A failed page request must never destroy the active login session.
  // Session storage is cleared only by an explicit Logout action.
  return Promise.reject(error);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  responseErrorHandler,
);

export default axiosInstance;
