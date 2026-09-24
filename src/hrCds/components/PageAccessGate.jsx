import { CRM_PAGES, resolveCrmPermissionPath } from '../../config/crmPages';
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import RouteBoundaryLoader from "../../components/RouteBoundaryLoader";
import { TELECALLER_PAGES, hasTelecallerCompanyAccess } from "../../crm/telecaller/telecallerPages";
import { getCurrentUserId, getStoredUser, isCrmPage, requiresPageAccess, hasPageAccess, hasConfiguredPageAccess, loadPagePermission } from "../../utils/pageAccess";
import api from '../../utils/axiosConfig';

const PRIVILEGED_ROLES = new Set([
  "owner",
  "company_owner",
  "companyowner",
  "admin",
  "super_admin",
  "superadmin",
]);

const normalizeRole = value => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[\s-]+/g, "_");

const normalizePlanKey = value => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/^\/+/, "")
  .replace(/^ciisuser\//, "");

const PLAN_FREE_PATHS = new Set([
  "client/account-settings",
  "client/change-password",
]);

const hasCompanyPlanAccess = pagePath => {
  try {
    const company = JSON.parse(localStorage.getItem('companyDetails') || '{}');
    const allowed = company?.allowedPages || [];
    if (!allowed.length) return true;

    const normalizedPath = normalizePlanKey(pagePath);
    if (PLAN_FREE_PATHS.has(normalizedPath)) return true;

    const keys = new Set(allowed.map(normalizePlanKey));
    if (/^crm\/(admin|marketing|reports)\//i.test(normalizedPath)) {
      if (keys.has('crm') || keys.has('admin-crm')) return true;
      const page = CRM_PAGES.find(item => normalizePlanKey(item.path) === normalizedPath);
      return Boolean(page && [page.id, page.path].some(key => keys.has(normalizePlanKey(key))));
    }

    if (normalizedPath.startsWith("client/")) {
      const clientPage = normalizedPath.substring("client/".length).split("/")[0];
      if (clientPage === "services-tasks") return keys.has("client-my-services");
      return keys.has(`client-${clientPage}`);
    }

    const routeKey = normalizedPath.split("/")[0];
    if (routeKey === "emp-task-details") {
      return ["task-management", "admin-task-create", "company-all-task"].some(key => keys.has(key));
    }
    return keys.has(routeKey) || keys.has(normalizedPath);
  } catch { return true; }
};

const getPagePath = pathname => {
  const parts = String(pathname || "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);

  if (String(parts[1] || "").toLowerCase() === "telecaller") {
    return `/${parts.slice(0, 3).join("/")}`;
  }
  if (String(parts[1] || "").toLowerCase() === "crm") {
    return `/${parts.slice(0, 4).join("/")}`;
  }
  return parts.length >= 2 ? `/${parts[0]}/${parts[1]}` : pathname;
};

const PageAccessGate = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, allowed: true });
  const pagePath = useMemo(() => resolveCrmPermissionPath(getPagePath(location.pathname)), [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    const currentUser = getStoredUser();
    const userId = getCurrentUserId();
    const roleValues = [currentUser?.companyRole, currentUser?.jobRole, currentUser?.role];
    const isPrivileged = roleValues.some(role => PRIVILEGED_ROLES.has(normalizeRole(role?.name || role)));
    const telecallerPage = TELECALLER_PAGES.find(page => page.path.toLowerCase() === pagePath.toLowerCase());
    const requiresExplicitAccess = requiresPageAccess(pagePath);

    const checkAccess = async () => {
      if (telecallerPage) {
        let company;
        try { company = JSON.parse(localStorage.getItem('companyDetails') || '{}'); } catch { company = {}; }
        if (!hasTelecallerCompanyAccess(telecallerPage, company)) {
          const companyRef = currentUser?.companyId || currentUser?.company;
          const companyId = company?._id || company?.id || currentUser?.companyDetails?._id
            || (typeof companyRef === 'object' ? companyRef?._id || companyRef?.id : companyRef);
          if (companyId) {
            try {
              const { data } = await api.get(`/company/${encodeURIComponent(companyId)}`);
              const latest = data?.company || data?.data || data;
              if (Array.isArray(latest?.allowedPages)) {
                company = { ...company, ...latest };
                if (!cancelled) localStorage.setItem('companyDetails', JSON.stringify(company));
              }
            } catch { /* An unavailable company lookup must not grant access. */ }
          }
        }
        if (!hasTelecallerCompanyAccess(telecallerPage, company)) {
          if (!cancelled) setState({ path: pagePath, loading: false, allowed: false });
          return;
        }
        try {
          const page = await loadPagePermission(pagePath);
          if (!cancelled) setState({ path: pagePath, loading: false, allowed: hasPageAccess(page, userId, "view") });
        } catch {
          if (!cancelled) setState({ path: pagePath, loading: false, allowed: false });
        }
        return;
      }
      if (!hasCompanyPlanAccess(pagePath)) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: false });
        return;
      }
      if (isPrivileged) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: true });
        return;
      }
      if (!pagePath || !requiresExplicitAccess) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: true });
        return;
      }
      try {
        const page = await loadPagePermission(pagePath);
        // CRM is fail-closed and page-specific, matching the backend
        // middleware. Company plan access alone must not grant an employee
        // access to an unassigned CRM page.
        const allowed = isCrmPage(pagePath) || requiresExplicitAccess
          ? hasPageAccess(page, userId, "view")
          : hasPageAccess(page, userId, "view") || (!hasConfiguredPageAccess(page) && hasCompanyPlanAccess(pagePath));
        if (!cancelled) setState({ path: pagePath, loading: false, allowed });
      } catch {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: false });
      }
    };

    setState({ path: pagePath, loading: requiresExplicitAccess || !isPrivileged || Boolean(telecallerPage), allowed: !requiresExplicitAccess && !telecallerPage });
    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [pagePath]);

  if (state.path !== pagePath || state.loading) return <RouteBoundaryLoader label="Checking page access..." />;
  if (!state.allowed) {
    return <Navigate to="/ciisUser/user-dashboard" replace state={{ accessDeniedPath: location.pathname }} />;
  }

  return children;
};

export default PageAccessGate;
