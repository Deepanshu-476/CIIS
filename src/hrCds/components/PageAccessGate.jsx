import { CRM_PAGES, resolveCrmPermissionPath } from '../../config/crmPages';
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import RouteBoundaryLoader from "../../components/RouteBoundaryLoader";
import { TELECALLER_PAGES, hasTelecallerCompanyAccess } from "../../crm/telecaller/telecallerPages";
import { getCurrentUserId, getStoredUser, isCrmPage, requiresPageAccess, hasPageAccess, loadPagePermission } from "../../utils/pageAccess";
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

const hasCrmPlanAccess = (pagePath, isPrivileged = false) => {
  if (!/^\/ciisuser\/crm\/(admin|marketing|reports)\//i.test(pagePath)) return true;
  try {
    const company = JSON.parse(localStorage.getItem('companyDetails') || '{}');
    const allowed = company?.allowedPages || [];
    if (!allowed.length) return true;
    const normalize = value => String(value).trim().toLowerCase().replace(/^\/+/, '').replace(/^ciisuser\//, '');
    const keys = new Set(allowed.map(normalize));
    const hasAnyCrmKey = keys.has('crm') || keys.has('admin-crm');
    if (hasAnyCrmKey) return true;
    const page = CRM_PAGES.find(page => ('/ciisUser/' + page.path).toLowerCase() === pagePath.toLowerCase());
    return Boolean(!page || [page.id, page.path].some(key => keys.has(normalize(key))));
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
      if (isPrivileged && !isCrmPage(pagePath)) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: true });
        return;
      }
      if (telecallerPage) {
        let company;
        try { company = JSON.parse(localStorage.getItem('companyDetails') || '{}'); } catch { company = {}; }
        // Login can store only company branding; the sidebar loads enabled pages later.
        // Resolve that data before treating an incomplete cache as an access denial.
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
          const allowed = hasPageAccess(page, userId, "view");
          if (!cancelled) setState({ path: pagePath, loading: false, allowed });
          return;
        } catch {
          if (!cancelled) setState({ path: pagePath, loading: false, allowed: false });
          return;
        }
      }
      if (!hasCrmPlanAccess(pagePath, isPrivileged)) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: false });
        return;
      }
      if (!pagePath || !requiresExplicitAccess) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: true });
        return;
      }
      try {
        const page = await loadPagePermission(pagePath);
        const allowed = hasPageAccess(page, userId, "view");
        if (!cancelled) setState({ path: pagePath, loading: false, allowed });
      } catch {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: !requiresExplicitAccess });
      }
    };

    setState({
      path: pagePath,
      loading: requiresExplicitAccess || !isPrivileged || Boolean(telecallerPage),
      allowed: !requiresExplicitAccess && !telecallerPage
    });
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
