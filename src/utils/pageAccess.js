import { accountStorage } from './authSession';
import axios from "./axiosConfig";
import { CRM_PAGES, resolveCrmPermissionPath } from "../config/crmPages";
import { TELECALLER_PAGES } from "../crm/telecaller/telecallerPages";

const pagePermissionCache = new Map();
const PAGE_PERMISSION_TTL_MS = 5 * 60 * 1000;
const permissionRequests = new Map();
let activeScope;
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
export const getPagePermissionScope = () => {
  const user = getStoredUser();
  const companyId = normalizeUserId(user?.company || user?.companyId || user?.companyDetails);
  const scope = JSON.stringify([normalizeUserId(user?._id || user?.id), companyId, accountStorage?.getItem('token')]);
  if (scope !== activeScope) {
    pagePermissionCache.clear();
    permissionRequests.clear();
    activeScope = scope;
  }
  return scope;
};

const readPermissionResource = key => {
  const cached = pagePermissionCache.get(key);
  return cached && Date.now() - cached.createdAt < PAGE_PERMISSION_TTL_MS ? cached.value : null;
};

const loadPermissionResource = (key, load, force = false) => {
  const cached = readPermissionResource(key);
  if (!force && cached !== null) return Promise.resolve(cached);
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

const STRICT_PAGE_PATHS = new Set([
  ...['emp-details', 'emp-leaves', 'emp-assets', 'emp-attendance', 'department',
    'jobrolemanagement', 'manage-groups', 'company-all-task',
    'company-assets', 'asset-management', 'sidebarmanagement', 'emp-client',
    'leave-policy', 'admin-task-create', 'task-management', 'user-activity'
  ].map(page => `/ciisuser/${page}`),
  '/ciisuser/active-clients',
  '/ciisuser/client-plans',
  '/ciisuser/holiday',
  '/ciisuser/client-services',
  '/ciisuser/salary-component',
  '/ciisuser/salary-structure',
  '/ciisuser/salary-assignment',
  '/ciisuser/assign-salary',
  '/ciisuser/payroll-process',
  '/ciisuser/payslip',
  '/ciisuser/payroll-reports',
]);

export const isTelecallerPage = path => /^\/ciisuser\/telecaller(\/|$)/i.test(String(path || '').trim());

export const getStoredUser = () => {
  try {
    const raw = accountStorage.getItem("user")
      || accountStorage.getItem("currentUser")
      || accountStorage.getItem("superAdmin");
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
  return isCrmPage(normalizedPath)
    || TELECALLER_PERMISSION_PATHS.has(normalizedPath)
    || STRICT_PAGE_PATHS.has(normalizedPath);
};

export const isCompanyPageOwner = user => Boolean(user?.isCompanyOwner || user?.isSuperAdmin || user?.superAdmin) ||
  [user?.companyRole, user?.role].some(role => ['owner', 'company_owner', 'companyowner', 'super_admin', 'superadmin']
    .includes(String(role?.name || role || '').trim().toLowerCase().replace(/[\s-]+/g, '_')));

export const getManagedPermissionPath = path => {
  const normalized = normalizePermissionPath(path);
  const aliases = {
    '/ciisuser/asset-management': '/ciisuser/company-assets',
    '/ciisuser/job-role-management': '/ciisuser/jobrolemanagement',
    '/ciisuser/employee-details': '/ciisuser/emp-details',
    '/ciisuser/employee-leaves': '/ciisuser/emp-leaves',
    '/ciisuser/employee-assets': '/ciisuser/emp-assets',
    '/ciisuser/employee-attendance': '/ciisuser/emp-attendance',
    '/ciisuser/create-task': '/ciisuser/task-management',
    '/ciisuser/admin-create-task': '/ciisuser/admin-task-create',
    '/ciisuser/company-all-tasks': '/ciisuser/company-all-task',
    '/ciisuser/department-all-tasks': '/ciisuser/department-all-task',
    '/ciisuser/client-management': '/ciisuser/emp-client',
    '/ciisuser/admin-projects': '/ciisuser/adminproject',
    '/ciisuser/projects': '/ciisuser/project',
    '/ciisuser/create-employee-meeting': '/ciisuser/admin-meeting',
    '/ciisuser/alerts': '/ciisuser/alert',
    '/ciisuser/dashboard': '/ciisuser/user-dashboard',
  };
  return aliases[normalized] || normalized;
};

export const getCatalogAccessPages = catalog => {
  const accessPages = Array.isArray(catalog?.accessPages) ? catalog.accessPages : [];
  if (!Array.isArray(catalog?.managedPages)) return accessPages;
  const details = new Map(accessPages.map(page => [getManagedPermissionPath(page.path), page]));
  return catalog.managedPages.map(page => ({
    ...details.get(getManagedPermissionPath(page.path)),
    ...page,
  }));
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

const AUTO_FULL_ACCESS_PATHS = new Set([
  '/ciisuser/register-request',
  '/ciisuser/company-all-task/tasks',
  '/ciisuser/user-dashboard',
  '/ciisuser/attendance',
  '/ciisuser/my-leaves',
  '/ciisuser/my-assets',
  '/ciisuser/profile',
  '/ciisuser/change-password',
  '/ciisuser/create-user',
  '/ciisuser/alert',
  '/ciisuser/chat',
]);

export const isAutoFullAccessPath = (pagePath) =>
  AUTO_FULL_ACCESS_PATHS.has(getManagedPermissionPath(pagePath));

export const hasPageAccess = (page, userId, accessType = 'view') => {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId || page?.entitled === false) return false;
  if (page?.hasAutoFullAccess === true) return true;
  const allActions = [
    'view',
    'edit',
    'delete',
    'approve',
    'generate',
    'lock',
    'unlock'
  ];
  const hasAnyExplicitGrant = allActions.some(action =>
    getPageAccessUserIds(page, action).includes(normalizedUserId)
  );
  if ((page?.autoFullAccess === true || isAutoFullAccessPath(page?.path)) && hasAnyExplicitGrant) {
    return true;
  }
  const type = String(accessType || 'view').trim().toLowerCase();
  if (type === 'view') {
    return hasAnyExplicitGrant;
  }
  return getPageAccessUserIds(page, type).includes(normalizedUserId);
};

const pagePermissionKey = path => `${getPagePermissionScope()}|${getManagedPermissionPath(resolveCrmPermissionPath(normalizePagePath(path)) || path)}`;
const catalogKey = () => `${getPagePermissionScope()}|catalog`;

export const getCachedPagePermissionCatalog = () => readPermissionResource(catalogKey());
const findCatalogPage = (catalog, path) => getCatalogAccessPages(catalog).find(page =>
  getManagedPermissionPath(page.path) === getManagedPermissionPath(path));
export const getCachedPagePermission = path => {
  const permissionPath = resolveCrmPermissionPath(normalizePagePath(path)) || path;
  return findCatalogPage(getCachedPagePermissionCatalog(), permissionPath) || readPermissionResource(pagePermissionKey(path));
};

export const loadPagePermission = async (path, options = {}) => {
  const permissionPath = resolveCrmPermissionPath(normalizePagePath(path)) || path;
  const catalog = getCachedPagePermissionCatalog();
  const catalogPage = findCatalogPage(catalog, permissionPath);
  if (catalogPage) return catalogPage;
  const cacheKey = pagePermissionKey(path);

  return loadPermissionResource(cacheKey, async () => {
    if (requiresPageAccess(permissionPath)) {
      try {
        const page = findCatalogPage(await loadPagePermissionCatalog(), permissionPath);
        if (page) return page;
      } catch { /* Fall back to the by-path endpoint when the batch is unavailable. */ }
    }
    const response = await withPermissionRetry(() => axios.get("/page-permissions/by-path", {
      params: { path: permissionPath }, noCache: true, _skipErrorNotify: true
    }));

    return response.data?.page || {
      path: permissionPath,
      approvers: [],
      viewUsers: [],
      editUsers: [],
      deleteUsers: [],
      generateUsers: [],
      lockUsers: [],
      unlockUsers: []
    };
  }, options.force);
};

export const loadPagePermissionCatalog = (options = {}) =>
  loadPermissionResource(catalogKey(), async () => {
    const response = await withPermissionRetry(() => axios.get("/page-permissions/pages", {
      params: { includeAccess: true },
      noCache: true,
      _skipErrorNotify: true
    }));
    const pages = Array.isArray(response.data?.pages) ? response.data.pages : [];
    const accessPages = Array.isArray(response.data?.accessPages) ? response.data.accessPages : undefined;
    return {
      ...response.data,
      pages,
      ...(accessPages ? { accessPages } : {})
    };

  }, options.force);

const SPECIAL_PAGE_PATHS = ['/ciisuser/register-request', '/ciisuser/company-ai-settings'];
const specialPermissionKey = path => `${getPagePermissionScope()}|special|${getManagedPermissionPath(path)}`;
export const getCachedSpecialPageAccess = path => readPermissionResource(specialPermissionKey(path));

export const loadSpecialPageAccess = (path, options = {}) => loadPermissionResource(specialPermissionKey(path), async () => {
  const user = getStoredUser();
  const companyId = normalizeUserId(user?.company || user?.companyId);
  const isRegisterRequest = getManagedPermissionPath(path) === SPECIAL_PAGE_PATHS[0];
  if (!isRegisterRequest && !companyId) return false;
  const endpoint = isRegisterRequest
    ? '/users/register-requests/access'
    : `/company/${encodeURIComponent(companyId)}/ai-settings/access`;
  try {
    await axios.get(endpoint, { noCache: true, _skipRequestCache: true, _skipErrorNotify: true });
    return true;
  } catch (error) {
    if ([403, 404].includes(error?.response?.status)) return false;
    throw error;
  }
}, options.force);

export const preloadPagePermissions = async (options = {}) => {
  const scope = getPagePermissionScope();
  const catalog = await loadPagePermissionCatalog(options);
  if (scope !== getPagePermissionScope()) return;
  const pages = Array.isArray(catalog.managedPages) ? catalog.managedPages : [];
  await Promise.allSettled(SPECIAL_PAGE_PATHS.filter(path => pages.some(page =>
    page.entitled && getManagedPermissionPath(page.path) === path)).map(path => loadSpecialPageAccess(path, options)));
};

export const invalidatePagePermissionCache = (path) => {
  if (!path) {
    pagePermissionCache.clear();
    permissionRequests.clear();
    return;
  }
  const suffix = `|${getManagedPermissionPath(path)}`;
  for (const cache of [pagePermissionCache, permissionRequests]) {
    for (const key of cache.keys()) {
      if (key.endsWith(suffix) || key.endsWith('|catalog')) cache.delete(key);
    }
  }
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


// Page Management saves one scope row per access type (view / edit / delete ...).
// A user who is ticked in several tabs ends up with "All Branches" rows next to the
// branch the admin actually picked, so merging everything would silently widen the
// access back to the whole company. This helper keeps only the branches and
// departments that were explicitly selected for the user on that page, and returns
// null for a dimension when every row was left on "all".
export const getUserPageRestrictedScope = (page, userId) => {
  const normalizedUserId = normalizeUserId(userId);
  if (!page || !normalizedUserId) return null;

  const scopes = (Array.isArray(page?.userAccessScopes) ? page.userAccessScopes : [])
    .filter(scope => normalizeUserId(scope?.user) === normalizedUserId);
  if (!scopes.length) return null;

  const collectExplicitIds = (field) => {
    const ids = new Set();
    scopes.forEach(scope => {
      (Array.isArray(scope?.[field]) ? scope[field] : [])
        .map(value => normalizeUserId(value))
        .filter(value => value && value.toLowerCase() !== 'all')
        .forEach(value => ids.add(value));
    });
    return ids.size > 0 ? [...ids] : null;
  };

  return {
    branchIds: collectExplicitIds('branchIds'),
    departmentIds: collectExplicitIds('departmentIds')
  };
};
