const OWNER_ROLES = new Set(['owner', 'company_owner', 'companyowner']);
const SUPER_ADMIN_ROLES = new Set(['super_admin', 'superadmin']);
const DIRECTORY_ROLES = new Set(['admin', 'hr', 'manager']);

const normalizeRole = role => String(
  typeof role === 'object' ? role?.name || role?.roleName || '' : role || ''
).trim().toLowerCase().replace(/[\s-]+/g, '_');

export const getDirectoryRoleAccess = user => {
  const assignedRoles = [user?.companyRole, user?.role].map(normalizeRole);
  const jobRole = normalizeRole(user?.jobRole);
  const isSuperAdmin = Boolean(user?.isSuperAdmin || user?.superAdmin) ||
    [...assignedRoles, jobRole].some(role => SUPER_ADMIN_ROLES.has(role));
  const isOwner = user?.isCompanyOwner === true || assignedRoles.some(role => OWNER_ROLES.has(role));
  return {
    isSuperAdmin,
    isMasterRole: isOwner || isSuperAdmin,
    fallbackAllowed: isOwner || isSuperAdmin || [...assignedRoles, jobRole].some(role => DIRECTORY_ROLES.has(role))
  };
};

export const readEmployeeDirectoryResponse = (body) => {
  const users = [
    body,
    body?.message?.users,
    body?.data?.users,
    body?.users,
    body?.message,
    body?.data
  ].find(Array.isArray);

  if (body?.success === false || !users) {
    throw new Error('The server did not return a valid employee list.');
  }

  return {
    users,
    pagination: body?.message?.pagination || body?.data?.pagination || body?.pagination
  };
};
