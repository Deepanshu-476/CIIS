// The sidebar config is requested at login (to pick the landing page), by the sidebar and by
// the user dashboard. They share the copy saved in localStorage: one saved in the last minute
// for the same user, company, department, role and branch is used without another request.

const SIDEBAR_CONFIG_KEY = 'sidebarConfig';
const SIDEBAR_CONFIG_FRESH_MS = 60 * 1000;

const getRecordId = value => {
  if (!value) return '';
  if (typeof value === 'object') return value._id || value.id || value.value || '';
  return value;
};

const getRecordName = value => {
  if (!value || typeof value !== 'object') return '';
  return value.name || value.roleName || value.title || '';
};

// Same values the sidebar sends; the API answers 400 without company and role.
export const getSidebarConfigParams = (user, company) => {
  const companyId = String(
    getRecordId(user?.company || user?.companyId || company?._id || company?.id) || ''
  ).trim();
  const departmentId = String(getRecordId(user?.department || user?.departmentId) || '').trim();
  const branchId = String(getRecordId(user?.branch || user?.branchId || user?.branchDetails) || '').trim();
  const role = String(
    getRecordId(user?.jobRole || user?.role || user?.roleId) ||
    user?.jobRoleName ||
    user?.roleName ||
    getRecordName(user?.jobRole) ||
    getRecordName(user?.role) ||
    ''
  ).trim();
  if (!companyId || !role) return null;
  return {
    companyId,
    role,
    ...(departmentId ? { departmentId } : {}),
    ...(branchId ? { branchId } : {}),
  };
};

const paramsKey = (userId, params) => [
  userId, params?.companyId, params?.departmentId, params?.role, params?.branchId,
].map(value => String(value || '')).join('|');

export const saveSidebarConfig = (config, userId, params) => {
  const record = {
    ...config,
    _cacheContext: { userId: String(userId || ''), companyId: params?.companyId || '' },
    _paramsKey: paramsKey(userId, params),
    _savedAt: Date.now(),
  };
  try {
    localStorage.setItem(SIDEBAR_CONFIG_KEY, JSON.stringify(record));
  } catch {
    // Storage full or blocked: the in-memory config still works.
  }
  return record;
};

export const readFreshSidebarConfig = (userId, params) => {
  try {
    const record = JSON.parse(localStorage.getItem(SIDEBAR_CONFIG_KEY) || 'null');
    if (!record || record._paramsKey !== paramsKey(userId, params)) return null;
    return Date.now() - Number(record._savedAt || 0) < SIDEBAR_CONFIG_FRESH_MS ? record : null;
  } catch {
    return null;
  }
};
