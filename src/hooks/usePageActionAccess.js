import { useEffect, useState } from 'react';
import { loadPagePermission, hasPageAccess, getCurrentUserId, getStoredUser } from '../utils/pageAccess';

// Which actions the current user may use on a page that Page Management controls
// (e.g. Holiday, Client Services). Owner and company admin may do everything;
// anyone else gets what Page Management gives them. Mirrors the backend check in
// CIISBackend/middleware/pageAccess.js (alwaysRoles: admin).
const FULL_ACCESS_ROLES = new Set(['owner', 'company_owner', 'companyowner', 'super_admin', 'superadmin', 'admin']);
const normalizeRole = value => String((value && typeof value === 'object' ? value.name : value) || '')
  .trim().toLowerCase().replace(/[\s-]+/g, '_');

const hasFullAccess = () => {
  const user = getStoredUser() || {};
  return [user.companyRole, user.role, user.jobRole, user.jobRoleName].map(normalizeRole).some(role => FULL_ACCESS_ROLES.has(role));
};

const FULL = { canView: true, canEdit: true, canDelete: true, loaded: true };
const NONE = { canView: false, canEdit: false, canDelete: false, loaded: true };

export default function usePageActionAccess(path, { enabled = true, fullAccess = false } = {}) {
  const [access, setAccess] = useState(() => (fullAccess || hasFullAccess() ? FULL : { ...NONE, loaded: false }));

  useEffect(() => {
    if (!enabled || fullAccess || hasFullAccess()) {
      if (fullAccess || hasFullAccess()) setAccess(FULL);
      return undefined;
    }
    let active = true;
    loadPagePermission(path)
      .then(page => {
        if (!active) return;
        const userId = getCurrentUserId();
        setAccess({
          canView: hasPageAccess(page, userId, 'view'),
          canEdit: hasPageAccess(page, userId, 'edit'),
          canDelete: hasPageAccess(page, userId, 'delete'),
          loaded: true,
        });
      })
      .catch(() => active && setAccess(NONE));
    return () => { active = false; };
  }, [path, enabled, fullAccess]);

  return access;
}
