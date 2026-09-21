import axios from "./axiosConfig";

const pagePermissionCache = globalThis.__CIIS_PAGE_PERMISSION_CACHE__ || (globalThis.__CIIS_PAGE_PERMISSION_CACHE__ = new Map());
const PAGE_PERMISSION_TTL_MS = 5 * 60 * 1000;
const PAGE_PERMISSION_SESSION_PREFIX = 'ciis-page-permission-catalog:';
const permissionRequests = new Map();
const normalizePermissionPath = path => String(path || '').trim().toLowerCase().replace(/\/+$/, '');
const PERMISSION_RETRY_DELAYS_MS = [400, 800, 1600, 3000];

const isRetryablePermissionError = error => {
  const status = Number(error?.response?.status || 0);
  return !error?.response || status >= 500 || status === 408 || status === 429;
};

const withPermissionRetry = async load => {
  let lastError;
  for (let attempt = 0; attempt <= PERMISSION_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await load();
    } catch (error) {
      lastError = error;
      if (!isRetryablePermissionError(error) || attempt === PERMISSION_RETRY_DELAYS_MS.length) throw error;
      await new Promise(resolve => setTimeout(resolve, PERMISSION_RETRY_DELAYS_MS[attempt]));
    }
  }
  throw lastError;
};
const permissionScope = () => {
  const user = getStoredUser();
  return JSON.stringify([user?._id || user?.id, user?.company || user?.companyId,
    localStorage.getItem('companyDetails'), localStorage.getItem('token')]);
};

const permissionSessionKey = () => {
  const user = getStoredUser();
  const userId = String(user?._id || user?.id || '').trim();
  const company = user?.company || user?.companyId || user?.companyDetails;
  const companyId = String(
    (typeof company === 'object' ? company?._id || company?.id : company) || ''
  ).trim();
  return userId ? `${PAGE_PERMISSION_SESSION_PREFIX}${userId}:${companyId}` : '';
};

export const getCachedPagePermissionCatalog = () => {
  const key = permissionSessionKey();
  if (!key) return null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
    return cached?.value || null;
  } catch {
    return null;
  }
};

const cachePagePermissionCatalogForSession = value => {
  const key = permissionSessionKey();
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ createdAt: Date.now(), value }));
  } catch {
    // Continue with the in-memory cache when storage is unavailable or full.
  }
};

const loadPermissionResource = (key, load) => {
  const cached = pagePermissionCache.get(key);
  if (cached && Date.now() - cached.createdAt < PAGE_PERMISSION_TTL_MS) return Promise.resolve(cached.value);
  if (permissionRequests.has(key)) return permissionRequests.get(key);
  const request = load().then(value => {
    if (permissionRequests.get(key) === request) {
      pagePermissionCache.set(key, { createdAt: Date.now(), value });
    }
    return value;
  }).finally(() => {
    if (permissionRequests.get(key) === request) permissionRequests.delete(key);
  });
  permissionRequests.set(key, request);
  return request;
};

export const loadPagePermissionCatalog = () => {
  const scope = permissionScope();
  return loadPermissionResource(`${scope}|catalog`, async () => {
    const response = await withPermissionRetry(() => axios.get('/page-permissions/pages', {
      params: { includeAccess: true }, noCache: true, _skipErrorNotify: true
    }));
    cachePagePermissionCatalogForSession(response.data);
    return response.data;
  });
};

const STRICT_PAGE_PATHS = new Set([
  '/ciisuser/salary-component',
  '/ciisuser/salary-structure',
  '/ciisuser/salary-assignment',
  '/ciisuser/assign-salary',
  '/ciisuser/payroll-process',
  '/ciisuser/release-payroll',
  '/ciisuser/payslip',
  '/ciisuser/payroll-reports',
]);

export const isTelecallerPage = path => /^\/ciisuser\/telecaller(\/|$)/i.test(String(path || '').trim());
export const isCrmPage = path => /^\/ciisuser\/(crm|telecaller)(\/|$)/i.test(String(path || '').trim());

export const requiresPageAccess = path => {
  const normalized = String(path || '').trim().toLowerCase().replace(/\/+$/, '');
  return isCrmPage(normalized) || STRICT_PAGE_PATHS.has(normalized);
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user")
      || localStorage.getItem("currentUser")
      || localStorage.getItem("superAdmin")
      || sessionStorage.getItem("superAdmin");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user || parsed;
  } catch {
    return null;
  }
};

export const getCurrentUserId = () => {
  const user = getStoredUser();
  return String(user?._id || user?.id || "");
};

export const normalizeUserId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return normalizeUserId(value._id || value.id || value.user || value.value);
  }
  return String(value).trim();
};

export const getUserIds = (items = []) => {
  const list = Array.isArray(items) ? items : [];
  return [...new Set(list.map(normalizeUserId).filter(Boolean))];
};

const ACCESS_FIELD_BY_TYPE = {
  view: 'viewUsers',
  edit: 'editUsers',
  delete: 'deleteUsers',
  approve: 'approvers',
  generate: 'generateUsers',
  lock: 'lockUsers',
  unlock: 'unlockUsers'
};

export const getPageAccessUserIds = (page, accessType = 'view') => {
  const type = String(accessType || 'view').trim().toLowerCase();
  const field = ACCESS_FIELD_BY_TYPE[type] || ACCESS_FIELD_BY_TYPE.view;
  const directIds = getUserIds(page?.[field]);
  const scopedIds = (Array.isArray(page?.userAccessScopes) ? page.userAccessScopes : [])
    .filter(scope => String(scope?.accessType || '').trim().toLowerCase() === type)
    .map(scope => scope?.user);

  return getUserIds([...directIds, ...scopedIds]);
};

export const hasConfiguredPageAccess = (page) => [
  'view',
  'edit',
  'delete',
  'approve',
  'generate',
  'lock',
  'unlock'
].some(accessType => getPageAccessUserIds(page, accessType).length > 0);

export const hasPageAccess = (page, userId, accessType = 'view') => {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) return false;
  if (String(accessType || 'view').toLowerCase() === 'view') {
    return ['view', 'edit', 'delete', 'approve', 'generate', 'lock', 'unlock']
      .some(type => getPageAccessUserIds(page, type).includes(normalizedUserId));
  }
  return getPageAccessUserIds(page, accessType).includes(normalizedUserId);
};

export const loadPagePermission = async (path) => {
  const normalizedPath = normalizePermissionPath(path);
  const cacheKey = `${permissionScope()}|${normalizedPath}`;
  return loadPermissionResource(cacheKey, async () => {
  if (requiresPageAccess(path)) {
    try {
      const catalog = await loadPagePermissionCatalog();
      const page = catalog.accessPages?.find(item => normalizePermissionPath(item.path) === normalizedPath);
      if (page) return page;
    } catch { /* Fall back to the existing endpoint if the batch is unavailable. */ }
  }
  const response = await withPermissionRetry(() => axios.get("/page-permissions/by-path", {
    params: { path }, noCache: true, _skipErrorNotify: true
  }));

  const value = response.data?.page || {
    path,
    approvers: [],
    viewUsers: [],
    editUsers: [],
    deleteUsers: [],
    generateUsers: [],
    lockUsers: [],
    unlockUsers: []
  };

  return value;
  });
};

export const invalidatePagePermissionCache = (path) => {
  if (!path) {
    pagePermissionCache.clear();
    permissionRequests.clear();
    const sessionKey = permissionSessionKey();
    try {
      if (sessionKey) sessionStorage.removeItem(sessionKey);
    } catch { /* Storage can be unavailable in restricted browser modes. */ }
    return;
  }
  const suffix = `|${normalizePermissionPath(path)}`;
  for (const cache of [pagePermissionCache, permissionRequests]) {
    for (const key of cache.keys()) {
      if (key.endsWith(suffix) || key.endsWith('|catalog')) cache.delete(key);
    }
  }
  const sessionKey = permissionSessionKey();
  try {
    if (sessionKey) sessionStorage.removeItem(sessionKey);
  } catch { /* Storage can be unavailable in restricted browser modes. */ }
};
