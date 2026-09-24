import axios from "axios";
import API_URL from "../config";

const resolvedApiUrl = import.meta.env.VITE_API_URL || API_URL;
const productionApiUrl = import.meta.env.VITE_FALLBACK_API_URL || "https://backendcds.ciisnetwork.in/api";
const isLocalApiUrl = /^https?:\/\/(127\.0\.0\.1|localhost):3000\/api/i.test(resolvedApiUrl);
const defaultRequestCacheTtlMs = 3000;
const highTrafficRequestCacheTtlMs = 300000;
const persistentRequestCacheMaxAgeMs = 6 * 60 * 60 * 1000;
const persistentCachePrefix = "ciis-api-cache:";
const cacheState = globalThis.__CIIS_AXIOS_GET_CACHE__ || (globalThis.__CIIS_AXIOS_GET_CACHE__ = {
  inFlightGetRequests: new Map(),
  completedGetRequests: new Map(),
});
const inFlightGetRequests = cacheState.inFlightGetRequests;
const completedGetRequests = cacheState.completedGetRequests;

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

const hashString = (value) => {
  let hash = 5381;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(index);
    hash &= 0xffffffff;
  }
  return Math.abs(hash).toString(36);
};

const getPersistentCacheStorageKey = (cacheKey) => `${persistentCachePrefix}${hashString(cacheKey)}`;

const isCacheableResponseData = (data) => {
  if (!data) return true;
  if (typeof Blob !== "undefined" && data instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) return false;
  return typeof data !== "function";
};

const shouldUsePersistentCache = (url, config = {}) => {
  if (config.cache === false || config.noCache === true || config._skipPersistentCache === true) return false;
  if (config.responseType === "blob" || config.responseType === "arraybuffer" || config.responseType === "stream") return false;
  const normalizedUrl = normalizeGetUrl(url).toLowerCase();
  return !["/auth", "/login", "/logout", "/download"].some(pattern => normalizedUrl.includes(pattern));
};

const serializeCacheableResponse = (response) => ({
  data: response.data,
  status: response.status,
  statusText: response.statusText,
  headers: response.headers,
});

const reviveCachedResponse = (entry, config = {}) => ({
  data: entry.response?.data,
  status: entry.response?.status || 200,
  statusText: entry.response?.statusText || "OK",
  headers: entry.response?.headers || {},
  config,
  request: null,
  __fromPersistentCache: true,
});

const readPersistentGetCache = (cacheKey, config = {}) => {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(getPersistentCacheStorageKey(cacheKey));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry?.response || Date.now() - Number(entry.createdAt || 0) > persistentRequestCacheMaxAgeMs) {
      localStorage.removeItem(getPersistentCacheStorageKey(cacheKey));
      return null;
    }
    return reviveCachedResponse(entry, config);
  } catch {
    return null;
  }
};

const writePersistentGetCache = (cacheKey, response) => {
  if (typeof localStorage === "undefined" || !isCacheableResponseData(response?.data)) return;
  try {
    localStorage.setItem(getPersistentCacheStorageKey(cacheKey), JSON.stringify({
      createdAt: Date.now(),
      response: serializeCacheableResponse(response),
    }));
  } catch {
    // Persistent cache is best-effort. Memory cache still protects hot requests.
  }
};

const clearPersistentGetCache = () => {
  if (typeof localStorage === "undefined") return;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(persistentCachePrefix)) localStorage.removeItem(key);
  });
};

const emitPersistentCacheUpdate = (url, cacheKey, response) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ciis-api-cache-updated", {
    detail: {
      url: normalizeGetUrl(url),
      cacheKey,
      status: response?.status,
      updatedAt: Date.now(),
    },
  }));
};

const normalizeGetUrl = (url) => {
  const rawUrl = String(url || "");

  if (!rawUrl) return rawUrl;

  try {
    const parsed = new URL(rawUrl, resolvedApiUrl);
    const resolvedBase = new URL(resolvedApiUrl);
    const fallbackBase = new URL(productionApiUrl);

    const isSameApiOrigin =
      parsed.origin === resolvedBase.origin ||
      parsed.origin === fallbackBase.origin;

    if (rawUrl.startsWith("/") || isSameApiOrigin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return `${parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return rawUrl;
  }
};

const getAuthIdentity = (config = {}) => {
  try {
    const authHeader = config.headers?.Authorization || config.headers?.authorization;
    if (authHeader) {
      return String(authHeader).slice(-20);
    }
    const token = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || "";
    let userId = "";
    if (typeof localStorage !== "undefined") {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        userId = parsed?._id || parsed?.id || "";
      }
    }
    return `${userId}:${token ? token.slice(-16) : "anon"}`;
  } catch {
    return "anon";
  }
};

const makeGetCacheKey = (url, config = {}) => {
  const authIdentity = getAuthIdentity(config);
  const cacheUrl = normalizeGetUrl(url);
  const cacheParams = stableStringify(config.params || null);
  const cacheHeaders = stableStringify(config.headers || null);
  const cacheData = stableStringify(config.data || null);

  return [
    authIdentity,
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
    if (!entry || (now - entry.createdAt) >= entry.ttlMs) {
      completedGetRequests.delete(key);
    }
  }
};

const sensitiveEndpointPatterns = [
  '/attendance',
  '/overtime',
  '/leaves',
  '/tasks',
  '/task',
  '/notifications',
  '/alerts',
  '/payroll',
  '/salary',
  '/chat',
  '/messages',
  '/asset-requests',
  '/users/me',
  '/user/profile',
  '/auth',
];

const staticConfigPatterns = [
  '/departments',
  '/job-roles',
  '/branches/company',
  '/menu-access',
  '/menu-items',
  '/page-permissions',
  '/sidebar',
];

const getRequestCacheTtlMs = (url) => {
  const normalizedUrl = normalizeGetUrl(url).toLowerCase();

  // Sensitive endpoints must never have a long cache.
  // We use 1000ms maximum exclusively for deduplicating immediate simultaneous component mounts.
  if (sensitiveEndpointPatterns.some(pattern => normalizedUrl.includes(pattern))) {
    return 1000;
  }

  // Pure static/configuration data
  if (staticConfigPatterns.some(pattern => normalizedUrl.includes(pattern))) {
    return highTrafficRequestCacheTtlMs;
  }

  return defaultRequestCacheTtlMs;
};

const axiosInstance = axios.create({
  baseURL: resolvedApiUrl,
  withCredentials: true,
});

const originalDefaultGet = axios.get.bind(axios);
const originalInstanceGet = axiosInstance.get.bind(axiosInstance);

export const clearAllCaches = () => {
  completedGetRequests.clear();
  inFlightGetRequests.clear();
  clearPersistentGetCache();
  try {
    if (typeof globalThis.__CIIS_PAGE_PERMISSION_CACHE__?.clear === "function") {
      globalThis.__CIIS_PAGE_PERMISSION_CACHE__.clear();
    }
  } catch {}
};

export const invalidateGetCache = (match) => {
  if (!match) {
    clearAllCaches();
    return;
  }
  const matcher =
    typeof match === "function"
      ? match
      : (key) => String(key || "").includes(String(match || ""));

  for (const key of [...completedGetRequests.keys()]) {
    if (matcher(key)) {
      completedGetRequests.delete(key);
    }
  }

  for (const key of [...inFlightGetRequests.keys()]) {
    if (matcher(key)) {
      inFlightGetRequests.delete(key);
    }
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key || ["token", "user", "authToken", "currentUser", "superAdmin"].includes(e.key)) {
      clearAllCaches();
    }
  });
  window.addEventListener("ciis-auth-changed", () => {
    clearAllCaches();
  });
}

const cachedGet = async (requester, url, config = {}) => {
  pruneExpiredGetCacheEntries();
  const useCache = config.cache !== false && config.noCache !== true && config._skipRequestCache !== true;
  const cacheKey = useCache ? makeGetCacheKey(url, config) : null;
  const usePersistentCache = useCache && shouldUsePersistentCache(url, config);

  if (useCache) {
    const cached = completedGetRequests.get(cacheKey);
    if (cached && (Date.now() - cached.createdAt) < cached.ttlMs) {
      return cloneResponse(cached.response);
    }

    const inFlight = inFlightGetRequests.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const persistentCached = usePersistentCache ? readPersistentGetCache(cacheKey, config) : null;
    if (persistentCached) {
      const refreshPromise = requester(url, {
        ...config,
        _skipPersistentCache: true,
        _skipRequestCache: true,
        _skipErrorNotify: true,
      }).then((response) => {
        completedGetRequests.set(cacheKey, {
          createdAt: Date.now(),
          ttlMs: getRequestCacheTtlMs(url),
          response: cloneResponse(response),
        });
        writePersistentGetCache(cacheKey, response);
        emitPersistentCacheUpdate(url, cacheKey, response);
        return response;
      }).catch(() => persistentCached).finally(() => {
        inFlightGetRequests.delete(cacheKey);
      });
      inFlightGetRequests.set(cacheKey, refreshPromise);
      return cloneResponse(persistentCached);
    }
  }

  const requestPromise = requester(url, config)
    .then((response) => {
      if (useCache) {
        completedGetRequests.set(cacheKey, {
          createdAt: Date.now(),
          ttlMs: getRequestCacheTtlMs(url),
          response: cloneResponse(response),
        });
        if (usePersistentCache) {
          writePersistentGetCache(cacheKey, response);
        }
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

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

const handleMutationResponse = (response) => {
  if (String(response.config?.method || "get").toLowerCase() !== "get") {
    clearAllCaches();
  }
  return response;
};

axios.interceptors.response.use(handleMutationResponse, responseErrorHandler);
axiosInstance.interceptors.response.use(handleMutationResponse, responseErrorHandler);

export default axiosInstance;
