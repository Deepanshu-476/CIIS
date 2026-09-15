import axios from "./axiosConfig";

const pagePermissionCache = globalThis.__CIIS_PAGE_PERMISSION_CACHE__ || (globalThis.__CIIS_PAGE_PERMISSION_CACHE__ = new Map());
const PAGE_PERMISSION_TTL_MS = 5 * 60 * 1000;
const permissionRequests = new Map();
const normalizePermissionPath = path => String(path || '').trim().toLowerCase().replace(/\/+$/, '');
const permissionScope = () => {
  const user = getStoredUser();
  return JSON.stringify([user?._id || user?.id, user?.company || user?.companyId,
    localStorage.getItem('companyDetails'), localStorage.getItem('token')]);
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
    const response = await axios.get('/page-permissions/pages', {
      params: { includeAccess: true }, noCache: true, _skipErrorNotify: true
    });
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
  const response = await axios.get("/page-permissions/by-path", {
    params: { path }, noCache: true
  });

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
    return;
  }
  const suffix = `|${normalizePermissionPath(path)}`;
  for (const cache of [pagePermissionCache, permissionRequests]) {
    for (const key of cache.keys()) {
      if (key.endsWith(suffix) || key.endsWith('|catalog')) cache.delete(key);
    }
  }
};
