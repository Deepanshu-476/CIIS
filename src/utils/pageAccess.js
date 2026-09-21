import axios from "./axiosConfig";
import { CRM_PAGES, resolveCrmPermissionPath } from "../config/crmPages";
import { TELECALLER_PAGES } from "../crm/telecaller/telecallerPages";

const pagePermissionCache = globalThis.__CIIS_PAGE_PERMISSION_CACHE__ || (globalThis.__CIIS_PAGE_PERMISSION_CACHE__ = new Map());
const pagePermissionCatalogCache = globalThis.__CIIS_PAGE_PERMISSION_CATALOG_CACHE__ || (globalThis.__CIIS_PAGE_PERMISSION_CATALOG_CACHE__ = { createdAt: 0, value: null });
const PAGE_PERMISSION_TTL_MS = 5 * 60 * 1000;
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

const normalizePagePath = path => {
  const value = String(path || '').trim();
  if (!value) return '';
  return `/${value.replace(/^\/+/, '')}`.replace(/\/+$/, '');
};

const normalizeComparablePath = path => normalizePagePath(path).toLowerCase();

const CRM_PERMISSION_PATHS = new Set(CRM_PAGES.map(page => normalizeComparablePath(`/ciisUser/${page.path}`)));
const TELECALLER_PERMISSION_PATHS = new Set(TELECALLER_PAGES.map(page => normalizeComparablePath(page.path)));

export const isCrmPage = path => {
  const normalizedPath = normalizeComparablePath(resolveCrmPermissionPath(normalizePagePath(path)));
  return normalizedPath.startsWith('/ciisuser/crm/') || CRM_PERMISSION_PATHS.has(normalizedPath);
};

export const requiresPageAccess = path => {
  const normalizedPath = normalizeComparablePath(resolveCrmPermissionPath(normalizePagePath(path)));
  return isCrmPage(normalizedPath) || TELECALLER_PERMISSION_PATHS.has(normalizedPath);
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
  const type = String(accessType || 'view').trim().toLowerCase();
  if (type === 'view') {
    return [
      'view',
      'edit',
      'delete',
      'approve',
      'generate',
      'lock',
      'unlock'
    ].some(action => getPageAccessUserIds(page, action).includes(normalizedUserId));
  }
  return getPageAccessUserIds(page, type).includes(normalizedUserId);
};

export const loadPagePermission = async (path, options = {}) => {
  const permissionPath = resolveCrmPermissionPath(normalizePagePath(path)) || path;
  const cacheKey = String(permissionPath || "").trim().toLowerCase();
  const cached = pagePermissionCache.get(cacheKey);
  if (!options?.force && cached && (Date.now() - cached.createdAt) < PAGE_PERMISSION_TTL_MS) {
    return cached.value;
  }
  const response = await withPermissionRetry(() => axios.get("/page-permissions/by-path", {
    params: { path: permissionPath }, noCache: true, _skipErrorNotify: true
  }));

  const value = response.data?.page || {
    path: permissionPath,
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

export const loadPagePermissionCatalog = async (options = {}) => {
  if (!options?.force && pagePermissionCatalogCache.value && (Date.now() - pagePermissionCatalogCache.createdAt) < PAGE_PERMISSION_TTL_MS) {
    return pagePermissionCatalogCache.value;
  }

  const response = await withPermissionRetry(() => axios.get("/page-permissions/pages", {
    noCache: true,
    _skipErrorNotify: true
  }));
  const pages = Array.isArray(response.data?.pages) ? response.data.pages : [];
  const accessPages = Array.isArray(response.data?.accessPages) ? response.data.accessPages : undefined;
  const value = {
    ...response.data,
    pages,
    ...(accessPages ? { accessPages } : {})
  };

  pagePermissionCatalogCache.createdAt = Date.now();
  pagePermissionCatalogCache.value = value;
  return value;
};

export const invalidatePagePermissionCache = (path) => {
  if (!path) {
    pagePermissionCache.clear();
    pagePermissionCatalogCache.createdAt = 0;
    pagePermissionCatalogCache.value = null;
    return;
  }
  pagePermissionCache.delete(String(resolveCrmPermissionPath(normalizePagePath(path)) || path).trim().toLowerCase());
};

export const getUserPageScope = (page, userId, accessType = '') => {
  const normalizedUserId = normalizeUserId(userId);
  if (!page || !normalizedUserId) return null;
  const scopes = Array.isArray(page?.userAccessScopes) ? page.userAccessScopes : [];
  const normalizedAccessType = String(accessType || '').trim().toLowerCase();
  const matchingScopes = scopes.filter(s => {
    const userMatches = normalizeUserId(s?.user) === normalizedUserId;
    if (!userMatches) return false;
    return !normalizedAccessType || String(s?.accessType || '').trim().toLowerCase() === normalizedAccessType;
  });
  if (!matchingScopes.length) return null;

  let branchIds = [];
  let departmentIds = [];
  let hasAllBranches = false;
  let hasAllDepartments = false;

  matchingScopes.forEach(s => {
    const bIds = (Array.isArray(s.branchIds) ? s.branchIds : []).map(b => String(b).trim());
    const dIds = (Array.isArray(s.departmentIds) ? s.departmentIds : []).map(d => String(d).trim());
    if (bIds.includes('all') || bIds.length === 0) hasAllBranches = true;
    else branchIds.push(...bIds);
    if (dIds.includes('all') || dIds.length === 0) hasAllDepartments = true;
    else departmentIds.push(...dIds);
  });

  return {
    branchIds: hasAllBranches ? ['all'] : [...new Set(branchIds.filter(Boolean))],
    departmentIds: hasAllDepartments ? ['all'] : [...new Set(departmentIds.filter(Boolean))]
  };
};

