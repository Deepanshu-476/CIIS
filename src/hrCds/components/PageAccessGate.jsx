import { CRM_PAGES, resolveCrmPermissionPath } from '../../config/crmPages';
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  "user-dashboard",
  "dashboard",
  "dashboard-1",
  "profile",
  "user-profile",
  "change-password",
  "client/account-settings",
  "client/change-password",
]);

const VALID_CIIS_USER_SINGLE_SLUGS = new Set([
  "change-password",
  "emp-details",
  "emp-leaves",
  "emp-assets",
  "company-assets",
  "asset-management",
  "emp-attendance",
  "emp-task-details",
  "admin-task-create",
  "manage-groups",
  "admin-meeting",
  "adminproject",
  "company-all-task",
  "department-all-task",
  "emp-client",
  "client-plans",
  "active-clients",
  "alert",
  "attendance",
  "my-assets",
  "my-leaves",
  "profile",
  "user-dashboard",
  "dashboard-1",
  "clientdashboard",
  "client-dashboard",
  "client-my-services",
  "client-payments",
  "client-documents",
  "client-support-tickets",
  "client-marketplace",
  "client-tasks-updates",
  "project",
  "project-details",
  "task-management",
  "employee-meeting",
  "client-meeting",
  "create-user",
  "register-request",
  "department",
  "jobrolemanagement",
  "job-role-management",
  "sidebarmanagement",
  "create-alert",
  "user-profile",
  "chat",
  "dashboard",
  "contact-support",
  "support-desk",
  "support-operations",
  "feedback-questionnaire",
  "leave-policy-master",
  "leave-policy",
  "salary-component",
  "salary-structure",
  "salary-assignment",
  "assign-salary",
  "payroll-process",
  "payslip",
  "payroll-reports",
  "call-logs",
  "todays-calls",
  "scheduled-calls",
  "telecaller",
  "crm",
]);

const VALID_TELECALLER_SLUGS = new Set([
  "dashboard",
  "call-dashboard",
  "assigned-calls",
  "todays-calls",
  "pending-calls",
  "scheduled-calls",
  "completed-calls",
  "call-history",
  "follow-ups",
  "converted-leads",
  "call-workspace",
  "lead-detail",
  "call-logs",
]);

const VALID_CRM_PATHS = new Set([
  ...CRM_PAGES.map(page => String(page.path || "").toLowerCase().replace(/^\/+|\/+$/g, "")),
  "crm",
  "crm/admin",
  "crm/leads",
  "crm/marketing",
  "crm/followups",
  "crm/leads/all",
  "crm/all-leads",
  "crm/lead-overview",
  "crm/leads/overview",
  "crm/leads/import",
  "crm/import-leads",
  "crm/leads/export",
  "crm/leads/sources",
  "crm/lead-sources",
  "crm/leads/add",
  "crm/add-lead",
  "crm/call-overview",
  "crm/calls/overview",
  "crm/calls/assigned",
  "crm/todays-calls",
  "crm/calls/today",
  "crm/pending-calls",
  "crm/calls/pending",
  "crm/scheduled-calls",
  "crm/calls/scheduled",
  "crm/completed-calls",
  "crm/calls/completed",
  "crm/converted-calls",
  "crm/calls/converted",
  "crm/transferred-calls",
  "crm/calls/transferred",
  "crm/call-history",
  "crm/calls/history",
  "crm/follow-ups",
  "crm/assignments",
  "crm/assignment-bulk",
  "crm/assignment-history",
  "crm/workload",
  "crm/calls",
  "crm/reports",
  "crm/reports/overview",
  "crm/reports/leads",
  "crm/reports/calls",
  "crm/reports/visits",
  "crm/reports/follow-ups",
  "crm/reports/team-performance",
  "crm/reports/team",
  "crm/reports/conversion-funnel",
  "crm/reports/funnel",
  "crm/reports/user-activity",
]);

const VALID_CLIENT_SLUGS = new Set([
  "dashboard",
  "tasks-updates",
  "task-management",
  "admin-task-create",
  "my-services",
  "services-tasks",
  "account-settings",
  "marketplace",
  "payment",
  "support-tickets",
  "documents",
  "payments",
  "change-password",
]);

export const isKnownAppRoute = (pathname = "") => {
  const parts = String(pathname || "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean)
    .map(part => part.toLowerCase());

  if (parts.length === 0) return true;

  if (parts[0] === "client") {
    if (parts.length === 1) return true;
    return parts.length === 2 && VALID_CLIENT_SLUGS.has(parts[1]);
  }

  if (parts[0] !== "ciisuser") return true;
  if (parts.length === 1) return false;

  const slug = parts[1];
  if (parts.length === 2) {
    return VALID_CIIS_USER_SINGLE_SLUGS.has(slug);
  }

  if (slug === "telecaller") {
    if (parts.length === 3) return VALID_TELECALLER_SLUGS.has(parts[2]);
    if (parts.length === 4 && ["call-workspace", "lead-detail"].includes(parts[2])) return true;
    return false;
  }

  if (slug === "crm") {
    const crmSubPath = parts.slice(1).join("/");
    return VALID_CRM_PATHS.has(crmSubPath);
  }

  if (["company-assets", "asset-management", "department"].includes(slug)) {
    return parts.length === 4 && parts[2] === "branch";
  }

  if (slug === "company-all-task") {
    if (parts.length === 3 && parts[2] === "tasks") return true;
    if (parts.length === 4 && (parts[2] === "tasks" || parts[3] === "tasks")) return true;
    return false;
  }

  if (slug === "emp-client") {
    return parts.length === 3;
  }

  if (["project", "project-details"].includes(slug)) {
    return parts.length === 3;
  }

  return false;
};

export const hasCompanyPlanAccess = pagePath => {
  try {
    const company = JSON.parse(localStorage.getItem('companyDetails') || '{}');
    const allowed = company?.allowedPages || [];
    if (!allowed.length) return true;

    const normalizedPath = normalizePlanKey(pagePath);
    if (PLAN_FREE_PATHS.has(normalizedPath)) return true;

    const currentUser = getStoredUser();
    if (String(currentUser?.companyRole || '').toLowerCase() === 'client' && normalizedPath.startsWith('client/')) {
      return true;
    }

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
    if (routeKey === "client-plans") {
      return ["client-plans", "emp-client", "client-management"].some(key => keys.has(key));
    }
    if (routeKey === "emp-task-details") {
      return ["task-management", "admin-task-create", "company-all-task"].some(key => keys.has(key));
    }
    if (routeKey === "project-details") {
      return ["project", "project-details", "projects"].some(key => keys.has(key));
    }
    if (routeKey === "jobrolemanagement" || routeKey === "job-role-management") {
      return ["jobrolemanagement", "job-role-management", "job-roles"].some(key => keys.has(key));
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

export const PageStatusCard = ({ status = 404, reason = "not_found", pathname = "" }) => {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isClient = String(currentUser?.companyRole || "").toLowerCase() === "client" || String(pathname).startsWith("/client");
  const dashboardPath = isClient ? "/client/dashboard" : "/ciisUser/user-dashboard";

  const is404 = status === 404 || reason === "not_found";
  const isPlanRestricted = reason === "plan";

  const badgeText = is404 ? "404 • Page Not Found" : isPlanRestricted ? "403 • Feature Not Available" : "403 • Access Restricted";
  const title = is404
    ? "Page Not Found"
    : isPlanRestricted
      ? "Feature Not Enabled in Company Plan"
      : "You Don't Have Permission to View This Page";
  const description = is404
    ? `The page "${pathname || window.location.pathname}" does not exist or may have been moved.`
    : isPlanRestricted
      ? "This module is not currently enabled in your organization's subscription plan. Please contact your company administrator to enable this feature."
      : "Your account does not have view access for this page. Please contact your administrator to request access in Page Management.";

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 160px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 12px",
            borderRadius: "999px",
            background: is404 ? "#eff6ff" : "#fef2f2",
            color: is404 ? "#1d4ed8" : "#dc2626",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          {badgeText}
        </div>
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            color: "#475569",
          }}
        >
          {description}
        </p>
        <button
          type="button"
          onClick={() => navigate(dashboardPath, { replace: true })}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.24)",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

const PageAccessGate = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, allowed: true, reason: null });
  const isValidRoute = useMemo(() => isKnownAppRoute(location.pathname), [location.pathname]);
  const pagePath = useMemo(() => resolveCrmPermissionPath(getPagePath(location.pathname)), [location.pathname]);

  useEffect(() => {
    if (!isValidRoute) {
      setState({ path: pagePath, loading: false, allowed: false, reason: "not_found" });
      return undefined;
    }

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
          if (!cancelled) setState({ path: pagePath, loading: false, allowed: false, reason: "plan" });
          return;
        }
        try {
          const page = await loadPagePermission(pagePath);
          const allowed = hasPageAccess(page, userId, "view");
          if (!cancelled) setState({ path: pagePath, loading: false, allowed, reason: allowed ? null : "permission" });
        } catch {
          if (!cancelled) setState({ path: pagePath, loading: false, allowed: false, reason: "permission" });
        }
        return;
      }
      if (!hasCompanyPlanAccess(pagePath)) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: false, reason: "plan" });
        return;
      }
      if (isPrivileged && !isCrmPage(pagePath)) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: true, reason: null });
        return;
      }
      if (!pagePath || !requiresExplicitAccess) {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: true, reason: null });
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
        if (!cancelled) setState({ path: pagePath, loading: false, allowed, reason: allowed ? null : "permission" });
      } catch {
        if (!cancelled) setState({ path: pagePath, loading: false, allowed: false, reason: "permission" });
      }
    };

    setState({ path: pagePath, loading: requiresExplicitAccess || !isPrivileged || Boolean(telecallerPage), allowed: !requiresExplicitAccess && !telecallerPage, reason: null });
    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [pagePath, isValidRoute]);

  if (!isValidRoute) {
    return <PageStatusCard status={404} reason="not_found" pathname={location.pathname} />;
  }
  if (state.path !== pagePath || state.loading) return <RouteBoundaryLoader label="Checking page access..." />;
  if (!state.allowed) {
    return <PageStatusCard status={403} reason={state.reason || "permission"} pathname={location.pathname} />;
  }

  return children;
};

export default PageAccessGate;
