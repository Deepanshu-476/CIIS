import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import RouteBoundaryLoader from "../../components/RouteBoundaryLoader";
import { getCurrentUserId, getStoredUser, hasConfiguredPageAccess, hasPageAccess, loadPagePermission } from "../../utils/pageAccess";

const PRIVILEGED_ROLES = new Set([
  "owner",
  "company_owner",
  "companyowner",
  "admin",
  "super_admin",
  "superadmin",
]);

const STRICT_ACCESS_PATHS = new Set([
  "/ciisUser/salary-component",
  "/ciisUser/salary-structure",
  "/ciisUser/salary-assignment",
  "/ciisUser/assign-salary",
  "/ciisUser/payroll-process",
  "/ciisUser/payslip",
  "/ciisUser/payroll-reports",
].map(path => path.toLowerCase()));

const normalizeRole = value => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[\s-]+/g, "_");

const getPagePath = pathname => {
  const parts = String(pathname || "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);

  return parts.length >= 2 ? `/${parts[0]}/${parts[1]}` : pathname;
};

const PageAccessGate = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, allowed: true });
  const pagePath = useMemo(() => getPagePath(location.pathname), [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    const currentUser = getStoredUser();
    const userId = getCurrentUserId();
    const roleValues = [currentUser?.companyRole, currentUser?.jobRole, currentUser?.role];
    const isPrivileged = roleValues.some(role => PRIVILEGED_ROLES.has(normalizeRole(role?.name || role)));
    const requiresExplicitAccess = STRICT_ACCESS_PATHS.has(String(pagePath || "").toLowerCase());

    const checkAccess = async () => {
      if (!pagePath || (isPrivileged && !requiresExplicitAccess)) {
        if (!cancelled) setState({ loading: false, allowed: true });
        return;
      }

      try {
        const page = await loadPagePermission(pagePath);
        const allowed = requiresExplicitAccess
          ? hasConfiguredPageAccess(page) && hasPageAccess(page, userId, "view")
          : !hasConfiguredPageAccess(page) || hasPageAccess(page, userId, "view");
        if (!cancelled) setState({ loading: false, allowed });
      } catch {
        // Strict pages stay closed if their permission cannot be verified.
        if (!cancelled) setState({ loading: false, allowed: !requiresExplicitAccess });
      }
    };

    setState({ loading: requiresExplicitAccess || !isPrivileged, allowed: !requiresExplicitAccess });
    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [pagePath]);

  if (state.loading) return <RouteBoundaryLoader label="Checking page access..." />;
  if (!state.allowed) {
    return <Navigate to="/ciisUser/user-dashboard" replace state={{ accessDeniedPath: location.pathname }} />;
  }

  return children;
};

export default PageAccessGate;
