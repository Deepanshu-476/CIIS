import { useEffect, useState } from 'react';
import { loadPagePermission, hasPageAccess, getCurrentUserId, getStoredUser, isCompanyPageOwner } from '../utils/pageAccess';

const FULL = { canView: true, canEdit: true, canDelete: true, loaded: true };
const NONE = { canView: false, canEdit: false, canDelete: false, loaded: true };

export default function usePageActionAccess(path, { enabled = true, fullAccess = false } = {}) {
  const [access, setAccess] = useState({ ...NONE, loaded: false });

  useEffect(() => {
    if (!enabled) return undefined;
    const user = getStoredUser();
    if (fullAccess && (user?.isSuperAdmin || user?.superAdmin)) {
      setAccess(FULL);
      return undefined;
    }
    let active = true;
    loadPagePermission(path)
      .then(page => {
        if (!active) return;
        if (page?.entitled === false || isCompanyPageOwner(user)) {
          setAccess(page?.entitled === false ? NONE : FULL);
          return;
        }
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
