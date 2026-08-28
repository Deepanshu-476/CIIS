import axios from "./axiosConfig";

const pagePermissionCache = globalThis.__CIIS_PAGE_PERMISSION_CACHE__ || (globalThis.__CIIS_PAGE_PERMISSION_CACHE__ = new Map());
const PAGE_PERMISSION_TTL_MS = 5 * 60 * 1000;

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
  const cacheKey = String(path || "").trim().toLowerCase();
  const cached = pagePermissionCache.get(cacheKey);
  if (cached && (Date.now() - cached.createdAt) < PAGE_PERMISSION_TTL_MS) {
    return cached.value;
  }

  const response = await axios.get("/page-permissions/by-path", {
    params: { path }
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

  pagePermissionCache.set(cacheKey, {
    createdAt: Date.now(),
    value
  });

  return value;
};

export const invalidatePagePermissionCache = (path) => {
  if (!path) {
    pagePermissionCache.clear();
    return;
  }
  pagePermissionCache.delete(String(path).trim().toLowerCase());
};
