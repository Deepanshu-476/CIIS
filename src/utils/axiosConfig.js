import axios from "axios";
import API_URL from "../config";

const resolvedApiUrl = import.meta.env.VITE_API_URL || API_URL;
const productionApiUrl = import.meta.env.VITE_FALLBACK_API_URL || "https://backendcds.ciisnetwork.in/api";
const isLocalApiUrl = /^https?:\/\/(127\.0\.0\.1|localhost):3000\/api/i.test(resolvedApiUrl);
const requestCacheTtlMs = 3000;
const inFlightGetRequests = new Map();
const completedGetRequests = new Map();

const stableStringify = (value) => {
  const seen = new WeakSet();

  const normalize = (input) => {
    if (input === null || typeof input !== "object") return input;
    if (seen.has(input)) return "[Circular]";
    seen.add(input);

    if (Array.isArray(input)) {
      return input.map(normalize);
    }

    return Object.keys(input)
      .sort()
      .reduce((acc, key) => {
        const nextValue = input[key];
        if (typeof nextValue === "function" || typeof nextValue === "undefined") {
          return acc;
        }
        acc[key] = normalize(nextValue);
        return acc;
      }, {});
  };

  try {
    return JSON.stringify(normalize(value));
  } catch {
    return String(value);
  }
};

const cloneResponse = (response) => ({
  ...response,
  data: typeof structuredClone === "function"
    ? structuredClone(response.data)
    : response.data,
});

const makeGetCacheKey = (url, config = {}) => {
  const cacheUrl = String(url || "");
  const cacheParams = stableStringify(config.params || null);
  const cacheHeaders = stableStringify(config.headers || null);
  const cacheData = stableStringify(config.data || null);

  return [
    "GET",
    cacheUrl,
    cacheParams,
    cacheHeaders,
    cacheData,
  ].join("|");
};

const pruneExpiredGetCacheEntries = () => {
  const now = Date.now();
  for (const [key, entry] of completedGetRequests.entries()) {
    if (!entry || (now - entry.createdAt) >= requestCacheTtlMs) {
      completedGetRequests.delete(key);
    }
  }
};

const axiosInstance = axios.create({
  baseURL: resolvedApiUrl,
  withCredentials: true,
});

const originalDefaultGet = axios.get.bind(axios);
const originalInstanceGet = axiosInstance.get.bind(axiosInstance);

const cachedGet = async (requester, url, config = {}) => {
  pruneExpiredGetCacheEntries();
  const useCache = config.cache !== false && config.noCache !== true && config._skipRequestCache !== true;
  const cacheKey = useCache ? makeGetCacheKey(url, config) : null;

  if (useCache) {
    const cached = completedGetRequests.get(cacheKey);
    if (cached && (Date.now() - cached.createdAt) < requestCacheTtlMs) {
      return cloneResponse(cached.response);
    }

    const inFlight = inFlightGetRequests.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
  }

  const requestPromise = requester(url, config)
    .then((response) => {
      if (useCache) {
        completedGetRequests.set(cacheKey, {
          createdAt: Date.now(),
          response: cloneResponse(response),
        });
      }
      return response;
    })
    .finally(() => {
      if (useCache) {
        inFlightGetRequests.delete(cacheKey);
      }
    });

  if (useCache) {
    inFlightGetRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
};

axios.get = (url, config = {}) => cachedGet(originalDefaultGet, url, config);
axiosInstance.get = (url, config = {}) => cachedGet(originalInstanceGet, url, config);

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
