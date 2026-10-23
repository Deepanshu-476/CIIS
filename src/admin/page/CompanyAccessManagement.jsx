import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  FormControlLabel,
  Grid,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Apps as AppsIcon,
  Bolt as BoltIcon,
  FactCheck as FactCheckIcon,
  LockOpen as LockOpenIcon,
  ManageAccounts as ManageAccountsIcon,
  Search as SearchIcon,
  Tune as TuneIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import axiosInstance from "../../utils/axiosConfig";
import { CRM_PAGES } from "../../config/crmPages";
import { TELECALLER_PAGES } from "../../crm/telecaller/telecallerPages";
import "./JobRoleManagement.css";

const APP_ROUTES = [
  { id: "user-dashboard", path: "user-dashboard", name: "Dashboard", category: "main" },
  { id: "dashboard-1", path: "dashboard-1", name: "Dashboard 1", category: "main" },
  { id: "dashboard-overview", path: "dashboard-overview", name: "Dynamic Dashboard Overview", category: "main" },
  { id: "attendance", path: "attendance", name: "My Attendance", category: "main" },
  { id: "my-leaves", path: "my-leaves", name: "My Leaves", category: "main" },
  { id: "my-assets", path: "my-assets", name: "My Assets", category: "main" },
  { id: "profile", path: "profile", name: "My Details", category: "main" },
  { id: "change-password", path: "change-password", name: "Change Password", category: "main" },
  { id: "emp-details", path: "emp-details", name: "Employee Details", category: "administration" },
  { id: "emp-leaves", path: "emp-leaves", name: "Employee Leaves", category: "administration" },
  { id: "leave-policy", path: "leave-policy", name: "Leave Policy", category: "administration" },
  { id: "emp-assets", path: "emp-assets", name: "Employee Assets", category: "administration" },
  { id: "company-assets", path: "company-assets", name: "Asset Management", category: "administration" },
  { id: "emp-attendance", path: "emp-attendance", name: "Employee Attendance", category: "administration" },
  { id: "department", path: "department", name: "Department Management", category: "administration" },
  { id: "JobRoleManagement", path: "JobRoleManagement", name: "Job Role Management", category: "administration" },
  { id: "create-user", path: "create-user", name: "Create User", category: "administration" },
  { id: "register-request", path: "register-request", name: "Register Request", category: "administration" },
  { id: "SidebarManagement", path: "SidebarManagement", name: "Sidebar Management", category: "administration" },
  { id: "manage-groups", path: "manage-groups", name: "Manage Groups", category: "administration" },
  { id: "task-management", path: "task-management", name: "Create Task", category: "tasks" },
  { id: "admin-task-create", path: "admin-task-create", name: "Admin Create Task", category: "tasks" },
  { id: "company-all-task", path: "company-all-task", name: "Company All Tasks", category: "tasks" },
  { id: "project", path: "project", name: "My Projects", category: "projects" },
  { id: "adminproject", path: "adminproject", name: "Manage Projects", category: "projects" },
  { id: "employee-meeting", path: "employee-meeting", name: "Employee Meeting", category: "meetings" },
  { id: "client-meeting", path: "client-meeting", name: "Client Meeting", category: "meetings" },
  { id: "admin-meeting", path: "admin-meeting", name: "Create Employee Meeting", category: "meetings" },
  { id: "emp-client", path: "emp-client", name: "Client Management", category: "clients" },
  { id: "client-plans", path: "client-plans", name: "Client Plans", category: "clients" },
  { id: "active-clients", path: "active-clients", name: "Active Clients", category: "clients" },
  { id: "client-dashboard", path: "client-dashboard", name: "Client Dashboard", category: "clients" },
  { id: "client-my-services", path: "client-my-services", name: "My Services", category: "clients" },
  { id: "client-tasks-updates", path: "client-tasks-updates", name: "Tasks & Updates", category: "clients" },
  { id: "client-marketplace", path: "client-marketplace", name: "Explore Services", category: "clients" },
  { id: "client-support-tickets", path: "client-support-tickets", name: "Meetings", category: "clients" },
  { id: "client-documents", path: "client-documents", name: "Documents", category: "clients" },
  { id: "client-payments", path: "client-payments", name: "Payments", category: "clients" },
  { id: "alert", path: "alert", name: "Alerts", category: "communication" },
  { id: "create-alert", path: "create-alert", name: "Create Alert", category: "communication" },
  { id: "chat", path: "chat", name: "Chat", category: "communication" },
  { id: "support-desk", path: "support-desk", name: "Support Desk", category: "communication" },
  { id: "support-operations", path: "support-operations", name: "Support Operations", category: "administration" },
  { id: "salary-component", path: "salary-component", name: "Salary Component", category: "payroll" },
  { id: "salary-structure", path: "salary-structure", name: "Salary Structure", category: "payroll" },
  { id: "salary-assignment", path: "salary-assignment", name: "Employee Salary", category: "payroll" },
  { id: "assign-salary", path: "assign-salary", name: "Assign Salary", category: "payroll" },
  { id: "payroll-process", path: "payroll-process", name: "Payroll Process", category: "payroll" },
  { id: "payslip", path: "payslip", name: "Payslip", category: "payroll" },
  { id: "payroll-reports", path: "payroll-reports", name: "Payroll Reports", category: "payroll" },
  ...CRM_PAGES,
  ...TELECALLER_PAGES.map(page => ({
    ...page,
    path: page.path.replace(/^\/ciisUser\//, ""),
  })),
];

const SUPER_ADMIN_ROUTES = [
  { id: "company-details", path: "company-details", name: "Company Details", category: "management" },
  { id: "all-company", path: "all-company", name: "All Company", category: "owner" },
  { id: "CompanyAccessManagement", path: "CompanyAccessManagement", name: "Company Access", category: "owner" },
  { id: "department", path: "department", name: "Department", category: "management" },
  { id: "branch", path: "branch", name: "Manage Branches", category: "management" },
  { id: "JobRoleManagement", path: "JobRoleManagement", name: "Job Roles", category: "management" },
  { id: "create-user", path: "create-user", name: "Create User", category: "management" },
  { id: "company-assets", path: "company-assets", name: "Assets Management", category: "management" },
  { id: "SidebarManagement", path: "SidebarManagement", name: "Sidebar Management", category: "management" },
  { id: "page-management", path: "page-management", name: "Page Management", category: "management" },
  { id: "plans", path: "plans", name: "Plans", category: "owner" },
  { id: "email-settings", path: "email-settings", name: "Email Settings", category: "owner" },
  { id: "app-version-control", path: "app-version-control", name: "App Version", category: "owner" },
  { id: "support-operations", path: "support-operations", name: "Support Operations", category: "management" },
  { id: "leave-policy", path: "leave-policy", name: "Leave Policy", category: "management" },
  { id: "demo-requests", path: "demo-requests", name: "Demo Requests", category: "owner" },
  { id: "holiday", path: "holiday", name: "Holiday", category: "management" },
  { id: "settings", path: "settings", name: "Settings", category: "management" },
];

const categoryNames = {
  main: "Main",
  administration: "Administration",
  tasks: "Tasks",
  projects: "Projects",
  meetings: "Meetings",
  clients: "Clients",
  communication: "Communication",
  payroll: "Payroll",
  "admin-crm": "Admin CRM",
  "admin-telecaller": "Telecaller CRM",
  management: "Super Admin Management",
  owner: "Owner Only",
};

const categoryColors = {
  main: "#2563eb",
  administration: "#7c3aed",
  tasks: "#f97316",
  projects: "#16a34a",
  meetings: "#0891b2",
  clients: "#db2777",
  communication: "#475569",
  payroll: "#4f46e5",
  management: "#2563eb",
  owner: "#7c3aed",
};

const getRouteAccessKeys = route => {
  const cleanPath = String(route.path || "").replace(/^\/+/, "");
  const keys = new Set([route.id, route.path, cleanPath, `/ciisUser/${cleanPath}`, `ciisUser/${cleanPath}`].filter(Boolean));

  if (cleanPath.startsWith("client-")) {
    const clientPath = cleanPath.substring(7);
    keys.add(`/client/${clientPath}`);
    keys.add(`client/${clientPath}`);
    keys.add(clientPath);
  }

  return keys;
};

const normalizeAccessKey = value => String(value || "")
  .trim()
  .replace(/^\/+/, "")
  .replace(/\/+$/, "")
  .toLowerCase();

const normalizeAllowedPages = pages => {
  if (!Array.isArray(pages)) return [];

  const routeByAccessKey = new Map();
  APP_ROUTES.forEach(route => {
    getRouteAccessKeys(route).forEach(key => {
      routeByAccessKey.set(normalizeAccessKey(key), route.id);
    });
  });

  return [...new Set(
    pages
      .map(page => {
        const cleanPage = normalizeAccessKey(page);
        return routeByAccessKey.get(cleanPage) || String(page || "").trim();
      })
      .filter(Boolean)
  )];
};

const getStoredAdminId = () => {
  try {
    const raw = localStorage.getItem("superAdmin") || localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?._id || parsed?.id || parsed?.user?._id || parsed?.user?.id || null;
  } catch {
    return null;
  }
};

const getStoredActiveCompanyId = () => {
  try {
    const raw = localStorage.getItem("company") || localStorage.getItem("companyDetails");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?._id || parsed?.id || null;
  } catch {
    return null;
  }
};

const formatDate = value => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


const DASHBOARD_OVERVIEW_SECTIONS = [
  // A. PEOPLE
  {
    key: "employeesOverview",
    group: "people",
    groupLabel: "PEOPLE",
    title: "Employees Overview",
    desc: "Total, active, inactive staff, department and role distributions.",
  },
  {
    key: "attendanceOverview",
    group: "people",
    groupLabel: "PEOPLE",
    title: "Attendance Overview",
    desc: "Daily present, absent, late check-ins, half-days, and punch logs.",
  },
  {
    key: "leavesOverview",
    group: "people",
    groupLabel: "PEOPLE",
    title: "Leaves Overview",
    desc: "Pending approvals, approved, rejected leaves, and staff on leave today.",
  },
  {
    key: "payrollOverview",
    group: "people",
    groupLabel: "PEOPLE",
    title: "Payroll Overview",
    desc: "Total payroll cost, processed runs, pending processing, and salary stats.",
    isSensitive: true,
  },
  {
    key: "assetsOverview",
    group: "people",
    groupLabel: "PEOPLE",
    title: "Assets Overview",
    desc: "Assigned assets, inventory, maintenance, and pending employee requests.",
  },

  // B. WORK
  {
    key: "tasksOverview",
    group: "work",
    groupLabel: "WORK",
    title: "Tasks Overview",
    desc: "Company tasks breakdown: pending, in-progress, completed, overdue rate.",
  },
  {
    key: "projectsOverview",
    group: "work",
    groupLabel: "WORK",
    title: "Projects Overview",
    desc: "Active projects, planning, completed, delayed, and milestone deadlines.",
  },
  {
    key: "meetingsOverview",
    group: "work",
    groupLabel: "WORK",
    title: "Meetings Overview",
    desc: "Upcoming internal & client meetings, today's schedule, and attendees.",
  },
  {
    key: "chatOverview",
    group: "work",
    groupLabel: "WORK",
    title: "Chat Overview",
    desc: "Active communication channels, team groups, and discussion hubs.",
  },
  {
    key: "alertsOverview",
    group: "work",
    groupLabel: "WORK",
    title: "Alerts Overview",
    desc: "System alerts, notices, unread company announcements, urgency types.",
  },

  // C. CLIENTS
  {
    key: "clientManagementOverview",
    group: "clients",
    groupLabel: "CLIENTS",
    title: "Client Management Overview",
    desc: "Active and inactive client accounts, new onboarding, and status distributions.",
  },
  {
    key: "clientServicesOverview",
    group: "clients",
    groupLabel: "CLIENTS",
    title: "Client Services Overview",
    desc: "Active services, delivered milestones, task completion, and pending tasks.",
  },
  {
    key: "clientPortalOverview",
    group: "clients",
    groupLabel: "CLIENTS",
    title: "Client Portal Overview",
    desc: "Shared client documents, pending review files, and compliance docs.",
  },
  {
    key: "supportOverview",
    group: "clients",
    groupLabel: "CLIENTS",
    title: "Support Overview",
    desc: "Client support tickets: open, in-progress, resolved, and urgent escalations.",
  },

  // D. INSIGHTS
  {
    key: "employeeActivityOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    title: "Employee Activity Overview",
    desc: "Audit logs, user actions, system modifications, and real-time user events.",
  },
  {
    key: "attendanceAnalyticsOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    title: "Attendance Analytics Overview",
    desc: "7-day attendance trend curves, daily consistency, and absenteeism patterns.",
  },
  {
    key: "taskAnalyticsOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    title: "Task Analytics Overview",
    desc: "Priority breakdown, task velocity, completion curves, and overdue ratios.",
  },
  {
    key: "teamVisibilityOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    title: "Team Visibility Overview",
    desc: "Department capacity, branch breakdown, staff allocations, and workload.",
  },
  {
    key: "payrollReportsOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    title: "Payroll Reports Overview",
    desc: "Historical salary summaries, run audit trends, deductions, and periods.",
    isSensitive: true,
  },
];

export default function CompanyAccessManagement() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedPages, setSelectedPages] = useState([]);
  const [selectedSuperAdminPages, setSelectedSuperAdminPages] = useState([]);
  const [activeDays, setActiveDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [dashboardOverviewConfig, setDashboardOverviewConfig] = useState(() => {
    const init = {};
    DASHBOARD_OVERVIEW_SECTIONS.forEach((s) => {
      init[s.key] = true;
    });
    return init;
  });

  const selectedCompany = useMemo(
    () => companies.find(company => company._id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  const activeCompanyCount = useMemo(
    () => companies.filter(company => company.isActive).length,
    [companies]
  );

  const selectedPercent = APP_ROUTES.length
    ? Math.round((selectedPages.length / APP_ROUTES.length) * 100)
    : 0;
  
  const isDashboardSelected = useMemo(() => {
    return selectedPages.includes("dashboard-overview");
  }, [selectedPages]);

  const enabledOverviewCount = useMemo(() => {
    return Object.values(dashboardOverviewConfig).filter(Boolean).length;
  }, [dashboardOverviewConfig]);

  const toggleOverviewSection = (key) => {
    setDashboardOverviewConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllOverviewSections = (enableAll) => {
    const next = {};
    DASHBOARD_OVERVIEW_SECTIONS.forEach((s) => {
      next[s.key] = Boolean(enableAll);
    });
    setDashboardOverviewConfig(next);
  };

  const toggleGroupOverviewSections = (groupKey) => {
    const groupItems = DASHBOARD_OVERVIEW_SECTIONS.filter((s) => s.group === groupKey);
    const allEnabled = groupItems.every((s) => Boolean(dashboardOverviewConfig[s.key]));
    setDashboardOverviewConfig((prev) => {
      const next = { ...prev };
      groupItems.forEach((s) => {
        next[s.key] = !allEnabled;
      });
      return next;
    });
  };

  const applyOverviewPreset = (preset) => {
    const next = {};
    DASHBOARD_OVERVIEW_SECTIONS.forEach((s) => {
      if (preset === "all") {
        next[s.key] = true;
      } else if (preset === "core") {
        next[s.key] = ["employeesOverview", "attendanceOverview", "leavesOverview", "payrollOverview", "tasksOverview", "projectsOverview", "alertsOverview"].includes(s.key);
      } else if (preset === "workforce") {
        next[s.key] = s.group === "people" || s.group === "insights";
      } else if (preset === "operations") {
        next[s.key] = s.group === "work" || s.group === "clients";
      } else {
        next[s.key] = false;
      }
    });
    setDashboardOverviewConfig(next);
  };

  const selectedSuperAdminPercent = SUPER_ADMIN_ROUTES.length
    ? Math.round((selectedSuperAdminPages.length / SUPER_ADMIN_ROUTES.length) * 100)
    : 0;

  const groupedRoutes = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();
    return APP_ROUTES.filter(route => {
      if (!cleanSearch) return true;
      return `${route.name} ${route.path} ${route.category}`.toLowerCase().includes(cleanSearch);
    }).reduce((groups, route) => {
      if (!groups[route.category]) groups[route.category] = [];
      groups[route.category].push(route);
      return groups;
    }, {});
  }, [search]);

  const groupedSuperAdminRoutes = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();
    return SUPER_ADMIN_ROUTES.filter(route => {
      if (!cleanSearch) return true;
      return `${route.name} ${route.path} ${route.category}`.toLowerCase().includes(cleanSearch);
    }).reduce((groups, route) => {
      if (!groups[route.category]) groups[route.category] = [];
      groups[route.category].push(route);
      return groups;
    }, {});
  }, [search]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/company");
      const fetchedCompanies = response.data?.companies || response.data?.data || [];
      setCompanies(fetchedCompanies);
    } catch (error) {
      showAccessNotice("error", error.response?.data?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const showAccessNotice = (severity, message) => {
    setNotice({ severity, message });
    setToast({ open: true, severity, message });
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!companyId || companies.length === 0) return;
    const company = companies.find(item => item._id === companyId);
    if (company) {
      selectCompany(company);
    }
  }, [companyId, companies]);

  const selectCompany = company => {
    setSelectedCompanyId(company._id);
    setSelectedPages(normalizeAllowedPages(company.allowedPages));
    setSelectedSuperAdminPages(Array.isArray(company.allowedSuperAdminPages) ? company.allowedSuperAdminPages : []);
    setIsActive(Boolean(company.isActive));
    setActiveDays(30);
    setNotice(null);

    if (company.moduleDashboardConfig && typeof company.moduleDashboardConfig === "object") {
      const init = {};
      DASHBOARD_OVERVIEW_SECTIONS.forEach((s) => {
        const item = company.moduleDashboardConfig[s.key];
        init[s.key] = item ? Boolean(item.enabled) : true;
      });
      setDashboardOverviewConfig(init);
    } else {
      const init = {};
      DASHBOARD_OVERVIEW_SECTIONS.forEach((s) => {
        init[s.key] = true;
      });
      setDashboardOverviewConfig(init);
    }
  };

  const openCompanyAccess = company => {
    navigate(`/Ciis-network/CompanyAccessManagement/${company._id}`);
  };

  const goBackToCompanies = () => {
    setSelectedCompanyId("");
    setSelectedPages([]);
    setSelectedSuperAdminPages([]);
    setSearch("");
    setNotice(null);
    navigate("/Ciis-network/CompanyAccessManagement");
  };

  const togglePage = (pageId) => {
    setSelectedPages((prev) => {
      const willBeSelected = !prev.includes(pageId);
      if (pageId === "dashboard-overview" && willBeSelected) {
        setShowOverviewModal(true);
      }
      return willBeSelected
        ? [...prev, pageId]
        : prev.filter((id) => id !== pageId);
    });
  };

  const toggleCategory = routes => {
    const ids = routes.map(route => route.id);
    const allSelected = ids.every(id => selectedPages.includes(id));
    setSelectedPages(prev => {
      if (allSelected) return prev.filter(id => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  };

  const toggleSuperAdminPage = pageId => {
    setSelectedSuperAdminPages(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const toggleSuperAdminCategory = routes => {
    const ids = routes.map(route => route.id);
    const allSelected = ids.every(id => selectedSuperAdminPages.includes(id));
    setSelectedSuperAdminPages(prev => {
      if (allSelected) return prev.filter(id => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  };

  const saveAccess = async () => {
    if (!selectedCompany) return;
    if (selectedPages.length === 0) {
      showAccessNotice("warning", "Select at least one page before activating access.");
      return;
    }
    if (selectedSuperAdminPages.length === 0) {
      showAccessNotice("warning", "Select at least one super admin page before activating access.");
      return;
    }

    setSaving(true);
    try {
      const moduleDashboardConfigPayload = {};
      DASHBOARD_OVERVIEW_SECTIONS.forEach((s) => {
        moduleDashboardConfigPayload[s.key] = { enabled: Boolean(dashboardOverviewConfig[s.key]) };
      });

      const response = await axiosInstance.patch(`/company/${selectedCompany._id}/access`, {
        allowedPages: selectedPages,
        allowedSuperAdminPages: selectedSuperAdminPages,
        activeDays,
        isActive,
        updatedBy: getStoredAdminId(),
        moduleDashboardConfig: moduleDashboardConfigPayload,
      });

      try {
        await axiosInstance.put(`/dashboard-overview/config/${selectedCompany._id}`, {
          config: moduleDashboardConfigPayload,
        });
      } catch (syncErr) {
        console.warn("Dashboard overview config sync note:", syncErr.message);
      }

      const updatedCompany = response.data.company;
      setCompanies(prev => prev.map(company => (
        company._id === updatedCompany._id ? updatedCompany : company
      )));

      // Only update local storage if the company being edited is the currently logged-in active company
      const activeCompanyId = getStoredActiveCompanyId();
      if (activeCompanyId && activeCompanyId === updatedCompany._id) {
        localStorage.setItem("company", JSON.stringify(updatedCompany));
        localStorage.setItem("companyDetails", JSON.stringify(updatedCompany));
      }

      showAccessNotice("success", response.data.message || "Save successful. Company access has been updated.");
    } catch (error) {
      showAccessNotice("error", error.response?.data?.message || "Failed to save company access");
    } finally {
      setSaving(false);
    }
  };

  
  const renderOverviewControlsContent = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top Presets & Counter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          padding: "12px 16px",
          background: "#f0f7ff",
          borderRadius: "12px",
          border: "1px solid #bfdbfe",
        }}
      >
        <div>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#1e3a8a", display: "inline-block", marginRight: "8px" }}>
            Active Sections:
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              background: "#2563eb",
              color: "#ffffff",
              padding: "3px 10px",
              borderRadius: "12px",
            }}
          >
            {enabledOverviewCount} of 19 Enabled
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="JobRoleManagement-btn-outline"
            onClick={() => toggleAllOverviewSections(true)}
            style={{ padding: "4px 10px", fontSize: "11.5px", borderColor: "#3b82f6", color: "#2563eb", background: "#ffffff" }}
          >
            Select All 19
          </button>
          <button
            type="button"
            className="JobRoleManagement-btn-secondary"
            onClick={() => toggleAllOverviewSections(false)}
            style={{ padding: "4px 10px", fontSize: "11.5px" }}
          >
            Clear All
          </button>
          <button
            type="button"
            className="JobRoleManagement-btn-outline"
            onClick={() => applyOverviewPreset("core")}
            style={{ padding: "4px 10px", fontSize: "11.5px" }}
          >
            Core HR
          </button>
          <button
            type="button"
            className="JobRoleManagement-btn-outline"
            onClick={() => applyOverviewPreset("workforce")}
            style={{ padding: "4px 10px", fontSize: "11.5px" }}
          >
            Workforce
          </button>
          <button
            type="button"
            className="JobRoleManagement-btn-outline"
            onClick={() => applyOverviewPreset("operations")}
            style={{ padding: "4px 10px", fontSize: "11.5px" }}
          >
            Operations
          </button>
        </div>
      </div>

      {/* 4 Groups of Sections: PEOPLE, WORK, CLIENTS, INSIGHTS */}
      {[
        { id: "people", label: "PEOPLE — Workforce Overview", color: "#2563eb" },
        { id: "work", label: "WORK — Tasks and Teams", color: "#16a34a" },
        { id: "clients", label: "CLIENTS — Accounts and Delivery", color: "#7c3aed" },
        { id: "insights", label: "INSIGHTS — Analytics & Visibility", color: "#d97706" },
      ].map((grp) => {
        const groupSections = DASHBOARD_OVERVIEW_SECTIONS.filter((s) => s.group === grp.id);
        const groupActiveCount = groupSections.filter((s) => Boolean(dashboardOverviewConfig[s.key])).length;
        return (
          <div key={grp.id} style={{ background: "#ffffff", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                paddingBottom: "6px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <span style={{ fontSize: "12.5px", fontWeight: "800", color: grp.color, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {grp.label} ({groupActiveCount}/{groupSections.length})
              </span>
              <button
                type="button"
                className="JobRoleManagement-btn-outline"
                style={{ padding: "2px 8px", fontSize: "11px" }}
                onClick={() => toggleGroupOverviewSections(grp.id)}
              >
                {groupActiveCount === groupSections.length ? "Deselect Group" : "Select Group"}
              </button>
            </div>

            <Grid container spacing={1.2}>
              {groupSections.map((sec) => {
                const isEnabled = Boolean(dashboardOverviewConfig[sec.key]);
                return (
                  <Grid item xs={12} sm={6} md={4} key={sec.key}>
                    <div
                      onClick={() => toggleOverviewSection(sec.key)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: `1.5px solid ${isEnabled ? "#3b82f6" : "#e2e8f0"}`,
                        background: isEnabled ? "#f0f7ff" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => {}}
                        style={{ marginTop: "3px", cursor: "pointer", accentColor: "#2563eb", width: "16px", height: "16px" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: isEnabled ? "#1e293b" : "#64748b" }}>
                            {sec.title}
                          </span>
                          {sec.isSensitive && (
                            <span style={{ fontSize: "10px", background: "#fef3c7", color: "#b45309", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>
                              Protected
                            </span>
                          )}
                          <span style={{ fontSize: "10px", background: isEnabled ? "#dcfce7" : "#f1f5f9", color: isEnabled ? "#15803d" : "#94a3b8", padding: "1px 6px", borderRadius: "10px", fontWeight: 700, marginLeft: "auto" }}>
                            {isEnabled ? "ON" : "OFF"}
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0", lineHeight: 1.3 }}>
                          {sec.desc}
                        </p>
                      </div>
                    </div>
                  </Grid>
                );
              })}
            </Grid>
          </div>
        );
      })}
    </div>
  );

  const renderAccessPanel = () => {
    if (!selectedCompany) return null;

    return (
      <div className="CompanyAccessManagement-access-panel">
        <div className="JobRoleManagement-super-admin-panel">
          <div className="JobRoleManagement-super-admin-content">
            <div className="JobRoleManagement-super-admin-left">
              <div className="JobRoleManagement-super-admin-avatar">
                <CheckCircleIcon />
              </div>
              <div>
                <div className="JobRoleManagement-super-admin-title">{selectedCompany.companyName}</div>
                <div className="JobRoleManagement-super-admin-subtitle">
                  {selectedCompany.companyEmail} / {selectedCompany.companyCode}
                </div>
              </div>
            </div>
            <div className="JobRoleManagement-super-admin-toggle">
              <label className="JobRoleManagement-switch">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={event => setIsActive(event.target.checked)}
                />
                <span className="JobRoleManagement-slider"></span>
              </label>
              <span className="JobRoleManagement-toggle-label">
                {isActive ? "Access Active" : "Access Inactive"}
              </span>
            </div>
          </div>
        </div>

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={4}>
            <div className="JobRoleManagement-form-group">
              <label className="JobRoleManagement-form-label">Active days</label>
              <div className="JobRoleManagement-input-wrapper">
                <CalendarIcon className="JobRoleManagement-input-icon" />
                <input
                  type="number"
                  min="1"
                  className="JobRoleManagement-form-input"
                  value={activeDays}
                  onChange={event => setActiveDays(event.target.value)}
                />
              </div>
            </div>
          </Grid>
          <Grid item xs={12} sm={4}>
            <div className="JobRoleManagement-info-banner" style={{ marginBottom: 0 }}>
              <LockOpenIcon className="JobRoleManagement-info-icon" />
              <div style={{ width: "100%" }}>
                <div className="JobRoleManagement-info-title">
                  {selectedPages.length} user pages / {selectedPercent}% enabled
                </div>
                <LinearProgress
                  variant="determinate"
                  value={selectedPercent}
                  sx={{ height: 7, mt: 1, borderRadius: 99, bgcolor: "#d7e9fb" }}
                />
              </div>
            </div>
          </Grid>
          <Grid item xs={12} sm={4}>
            <div className="JobRoleManagement-info-banner" style={{ marginBottom: 0 }}>
              <LockOpenIcon className="JobRoleManagement-info-icon" />
              <div style={{ width: "100%" }}>
                <div className="JobRoleManagement-info-title">
                  {selectedSuperAdminPages.length} super admin pages / {selectedSuperAdminPercent}% enabled
                </div>
                <LinearProgress
                  variant="determinate"
                  value={selectedSuperAdminPercent}
                  sx={{ height: 7, mt: 1, borderRadius: 99, bgcolor: "#d7e9fb" }}
                />
              </div>
            </div>
          </Grid>
        </Grid>

        <div className="JobRoleManagement-header CompanyAccessManagement-access-header">
          <div className="JobRoleManagement-user-info">
            <button className="JobRoleManagement-btn-outline" onClick={goBackToCompanies}>
              Back to Companies
            </button>
            <span className="JobRoleManagement-user-chip JobRoleManagement-chip-primary">
              Page Access
            </span>
            <span className="JobRoleManagement-user-chip">
              Changes will be available in Sidebar Management
            </span>
          </div>
          <div className="JobRoleManagement-header-actions">
            <button
              className="JobRoleManagement-btn-outline"
              onClick={() => setSelectedPages(APP_ROUTES.map(route => route.id))}
            >
              Select All
            </button>
            <button className="JobRoleManagement-btn-secondary" onClick={() => setSelectedPages([])}>
              Clear
            </button>
          </div>
        </div>

        <Stack spacing={2.5}>
          {Object.entries(groupedRoutes).map(([category, routes]) => {
            const selectedCount = routes.filter(route => selectedPages.includes(route.id)).length;
            const categoryColor = categoryColors[category] || "#1976d2";
            return (
              <div className="JobRoleManagement-mobile-card" key={category}>
                <div className="JobRoleManagement-mobile-card-content">
                  <div className="JobRoleManagement-mobile-card-header">
                    <div className="JobRoleManagement-mobile-card-avatar" style={{ color: categoryColor }}>
                      <AppsIcon className="JobRoleManagement-mobile-card-avatar-icon" />
                    </div>
                    <div className="JobRoleManagement-mobile-card-title-section">
                      <div className="JobRoleManagement-mobile-card-title">
                        {categoryNames[category] || category}
                      </div>
                      <div className="JobRoleManagement-mobile-card-badges">
                        <span className="JobRoleManagement-mobile-card-badge JobRoleManagement-badge-primary">
                          {selectedCount}/{routes.length} selected
                        </span>
                      </div>
                    </div>
                    <button className="JobRoleManagement-btn-outline" onClick={() => toggleCategory(routes)}>
                      {selectedCount === routes.length ? "Deselect" : "Select"}
                    </button>
                  </div>

                  <Grid container spacing={1.2}>
                    {routes.map(route => {
                      const selected = selectedPages.includes(route.id);
                      const isDynamicDashboardOverview = route.id === "dashboard-overview";
                      return (
                        <Grid item xs={12} sm={6} lg={4} key={route.id}>
                          <div
                            style={{
                              border: `1.5px solid ${selected ? (isDynamicDashboardOverview ? "#2563eb" : categoryColor) : "#e0e0e0"}`,
                              background: selected ? (isDynamicDashboardOverview ? "#eff6ff" : alpha(categoryColor, 0.08)) : "#fff",
                              borderRadius: "12px",
                              padding: "10px 12px",
                              boxShadow: isDynamicDashboardOverview && selected ? "0 4px 14px rgba(37,99,235,0.18)" : "none",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div
                              onClick={() => togglePage(route.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                              }}
                            >
                              <span className="JobRoleManagement-menu-icon" style={{ color: selected ? (isDynamicDashboardOverview ? "#2563eb" : categoryColor) : "#94a3b8" }}>
                                {selected ? <CheckCircleIcon fontSize="small" /> : <AppsIcon fontSize="small" />}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "13px", color: selected ? "#0f172a" : "#475569" }}>
                                  {route.name}
                                </div>
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                  /{route.path}
                                </div>
                              </div>
                              {isDynamicDashboardOverview && selected && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    background: "#dbeafe",
                                    color: "#1d4ed8",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                  }}
                                >
                                  {enabledOverviewCount}/19
                                </span>
                              )}
                            </div>

                            {isDynamicDashboardOverview && selected && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowOverviewModal(true);
                                }}
                                style={{
                                  marginTop: "8px",
                                  width: "100%",
                                  padding: "6px 10px",
                                  background: "#2563eb",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                              >
                                <TuneIcon style={{ fontSize: 14 }} />
                                ⚙ Overview Controls ({enabledOverviewCount}/19)
                              </button>
                            )}
                          </div>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {category === "main" && isDashboardSelected && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: "14px 16px",
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>📊</span>
                        <div>
                          <strong style={{ color: "#166534", fontSize: "13px" }}>
                            Dynamic Dashboard Overview Controls Active
                          </strong>
                          <p style={{ margin: 0, fontSize: "12px", color: "#15803d" }}>
                            {enabledOverviewCount} of 19 sections enabled for {selectedCompany?.companyName || "this company"}.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOverviewModal(true)}
                        style={{
                          padding: "6px 14px",
                          background: "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <TuneIcon style={{ fontSize: 15 }} />
                        Configure Overview Sections
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Stack>

        <div className="JobRoleManagement-header CompanyAccessManagement-access-header" style={{ marginTop: 24 }}>
          <div className="JobRoleManagement-user-info">
            <span className="JobRoleManagement-user-chip JobRoleManagement-chip-primary">
              Super Admin Page Access
            </span>
            <span className="JobRoleManagement-user-chip">
              Demo Requests stays available only for ashutoshrai130@gmail.com
            </span>
          </div>
          <div className="JobRoleManagement-header-actions">
            <button
              className="JobRoleManagement-btn-outline"
              onClick={() => setSelectedSuperAdminPages(SUPER_ADMIN_ROUTES.map(route => route.id))}
            >
              Select All
            </button>
            <button className="JobRoleManagement-btn-secondary" onClick={() => setSelectedSuperAdminPages([])}>
              Clear
            </button>
          </div>
        </div>

        <Stack spacing={2.5}>
          {Object.entries(groupedSuperAdminRoutes).map(([category, routes]) => {
            const selectedCount = routes.filter(route => selectedSuperAdminPages.includes(route.id)).length;
            const categoryColor = categoryColors[category] || "#1976d2";
            return (
              <div className="JobRoleManagement-mobile-card" key={`super-${category}`}>
                <div className="JobRoleManagement-mobile-card-content">
                  <div className="JobRoleManagement-mobile-card-header">
                    <div className="JobRoleManagement-mobile-card-avatar" style={{ color: categoryColor }}>
                      <AppsIcon className="JobRoleManagement-mobile-card-avatar-icon" />
                    </div>
                    <div className="JobRoleManagement-mobile-card-title-section">
                      <div className="JobRoleManagement-mobile-card-title">
                        {categoryNames[category] || category}
                      </div>
                      <div className="JobRoleManagement-mobile-card-badges">
                        <span className="JobRoleManagement-mobile-card-badge JobRoleManagement-badge-primary">
                          {selectedCount}/{routes.length} selected
                        </span>
                      </div>
                    </div>
                    <button className="JobRoleManagement-btn-outline" onClick={() => toggleSuperAdminCategory(routes)}>
                      {selectedCount === routes.length ? "Deselect" : "Select"}
                    </button>
                  </div>

                  <Grid container spacing={1.2}>
                    {routes.map(route => {
                      const selected = selectedSuperAdminPages.includes(route.id);
                      return (
                        <Grid item xs={12} sm={6} lg={4} key={route.id}>
                          <button
                            className="JobRoleManagement-menu-item"
                            onClick={() => toggleSuperAdminPage(route.id)}
                            style={{
                              border: `1px solid ${selected ? categoryColor : "#e0e0e0"}`,
                              background: selected ? alpha(categoryColor, 0.08) : "#fff",
                            }}
                          >
                            <span className="JobRoleManagement-menu-icon">
                              {selected ? <CheckCircleIcon fontSize="small" /> : <AppsIcon fontSize="small" />}
                            </span>
                            <span className="JobRoleManagement-menu-text">
                              <span className="JobRoleManagement-menu-title">{route.name}</span>
                              <span className="JobRoleManagement-menu-subtitle">/Ciis-network/{route.path}</span>
                            </span>
                          </button>
                        </Grid>
                      );
                    })}
                  </Grid>
                </div>
              </div>
            );
          })}
        </Stack>

        {/* Focused Dialog Modal for Overview Controls */}
        <Dialog
          open={showOverviewModal}
          onClose={() => setShowOverviewModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              m: 0,
              p: 2,
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: "#3b82f6",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TuneIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", m: 0 }}>
                  Dashboard Overview Controls
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  {selectedCompany?.companyName || "Company"} — Configure enabled overview sections & graphs
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setShowOverviewModal(false)} sx={{ color: "#94a3b8", "&:hover": { color: "#ffffff" } }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 2.5, background: "#f8fafc" }}>
            {renderOverviewControlsContent()}
          </DialogContent>

          <DialogActions sx={{ p: 2, background: "#ffffff", borderTop: "1px solid #e2e8f0", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {enabledOverviewCount} of 19 sections currently selected.
            </span>
            <Button
              variant="contained"
              onClick={() => setShowOverviewModal(false)}
              sx={{ textTransform: "none", fontWeight: 700, background: "#2563eb", px: 3 }}
            >
              Done / Apply
            </Button>
          </DialogActions>
        </Dialog>

        <div className="JobRoleManagement-modal-footer" style={{ marginTop: 24, borderRadius: 24 }}>
          <button className="JobRoleManagement-btn-primary" onClick={saveAccess} disabled={saving}>
            {saving ? (
              <>
                <span className="JobRoleManagement-spinner"></span>
                <span>Saving...</span>
              </>
            ) : (
              "Save Access"
            )}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="JobRoleManagement-container">
        <div className="JobRoleManagement-loading-overlay">
          <div className="JobRoleManagement-progress-bar">
            <div className="JobRoleManagement-progress-fill"></div>
          </div>
        </div>
        <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      </div>
    );
  }

  return (
    <div className="JobRoleManagement-container">
      {saving && (
        <div className="JobRoleManagement-loading-overlay">
          <div className="JobRoleManagement-progress-bar">
            <div className="JobRoleManagement-progress-fill"></div>
          </div>
        </div>
      )}

      <div className="JobRoleManagement-stats-grid">
        {[
          { label: "Companies", value: companies.length, chip: "Total", icon: <BusinessIcon />, color: "JobRoleManagement-stat-blue" },
          { label: "Active", value: activeCompanyCount, chip: `${companies.length ? Math.round((activeCompanyCount / companies.length) * 100) : 0}%`, icon: <BoltIcon />, color: "JobRoleManagement-stat-green" },
          { label: "Selected Pages", value: selectedPages.length, chip: `${selectedPercent}%`, icon: <FactCheckIcon />, color: "JobRoleManagement-stat-blue" },
          { label: "Super Admin Pages", value: selectedSuperAdminPages.length, chip: `${selectedSuperAdminPercent}%`, icon: <AppsIcon />, color: "JobRoleManagement-stat-red" },
        ].map(card => (
          <div className={`JobRoleManagement-stat-card ${card.color}`} key={card.label}>
            <div className="JobRoleManagement-stat-content">
              <div className="JobRoleManagement-stat-icon-box">
                <span className="JobRoleManagement-stat-icon">{card.icon}</span>
              </div>
              <div className="JobRoleManagement-stat-info">
                <span className="JobRoleManagement-stat-label">{card.label}</span>
                <div className="JobRoleManagement-stat-value-wrapper">
                  <span className="JobRoleManagement-stat-value">{card.value}</span>
                  <span className="JobRoleManagement-stat-chip">{card.chip}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          sx={{ width: "100%", boxShadow: "0 16px 40px rgba(15, 23, 42, 0.22)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      <div className="JobRoleManagement-paper">
        <div className="JobRoleManagement-header">
          <div className="JobRoleManagement-header-left">
            <div className="JobRoleManagement-header-icon-box">
              <ManageAccountsIcon className="JobRoleManagement-header-icon" />
            </div>
            <div>
              <h2 className="JobRoleManagement-header-title">Company Access</h2>
              <div className="JobRoleManagement-user-info">
                <span className="JobRoleManagement-user-chip JobRoleManagement-chip-primary">
                  {companyId ? "Select pages for this company" : "Select company first"}
                </span>
                {selectedCompany && (
                  <span className="JobRoleManagement-user-chip">
                    {selectedCompany.companyCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="JobRoleManagement-header-actions">
            {companyId && (
              <button
                className="JobRoleManagement-btn-outline CompanyAccessManagement-back-btn"
                onClick={goBackToCompanies}
              >
                <ArrowBackIcon fontSize="small" />
                <span>Back to Companies</span>
              </button>
            )}
            {companyId && (
            <div className="JobRoleManagement-search-container">
              <SearchIcon className="JobRoleManagement-search-icon" />
              <input
                type="text"
                className="JobRoleManagement-search-input"
                placeholder="Search pages..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
              {search && (
                <button className="JobRoleManagement-clear-search" onClick={() => setSearch("")}>
                  <span className="JobRoleManagement-clear-icon">x</span>
                </button>
              )}
            </div>
            )}
            <button className="JobRoleManagement-btn-outline" onClick={fetchCompanies}>
              Refresh
            </button>
          </div>
        </div>

        {!companyId && (
          <>
            <div className="JobRoleManagement-info-banner">
              <BusinessIcon className="JobRoleManagement-info-icon" />
              <div>
                <div className="JobRoleManagement-info-title">Companies</div>
                <div className="JobRoleManagement-info-subtitle">Click a company to open page access on the next page</div>
              </div>
            </div>

            <div className="CompanyAccessManagement-company-list">
              {companies.length > 0 ? (
                companies.map(company => {
                  const companyPercent = Math.min(100, Math.round(((company.allowedPages?.length || 0) / APP_ROUTES.length) * 100));
                  const superAdminCount = company.allowedSuperAdminPages?.length || 0;
                  return (
                    <div className="CompanyAccessManagement-company-row" key={company._id}>
                      <div
                        className="JobRoleManagement-mobile-card"
                        onClick={() => openCompanyAccess(company)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={event => {
                          if (event.key === "Enter" || event.key === " ") openCompanyAccess(company);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className="JobRoleManagement-mobile-card-status"
                          style={{ backgroundColor: company.isActive ? "#4caf50" : "#f44336" }}
                        ></div>
                        <div className="JobRoleManagement-mobile-card-content">
                          <div className="JobRoleManagement-mobile-card-header">
                            <div className="JobRoleManagement-mobile-card-avatar">
                              <BusinessIcon className="JobRoleManagement-mobile-card-avatar-icon" />
                            </div>
                            <div className="JobRoleManagement-mobile-card-title-section">
                              <div className="JobRoleManagement-mobile-card-title">{company.companyName}</div>
                              <div className="JobRoleManagement-mobile-card-badges">
                                <span className="JobRoleManagement-mobile-card-badge JobRoleManagement-badge-primary">
                                  {company.companyCode || "Company"}
                                </span>
                                <span className={`JobRoleManagement-mobile-card-badge JobRoleManagement-badge-${company.isActive ? "success" : "error"}`}>
                                  {company.isActive ? "Active" : "Inactive"}
                                </span>
                                <span className="JobRoleManagement-mobile-card-badge">
                                  {company.allowedPages?.length || 0}/{APP_ROUTES.length} pages
                                </span>
                                <span className="JobRoleManagement-mobile-card-badge">
                                  {superAdminCount}/{SUPER_ADMIN_ROUTES.length} super admin
                                </span>
                              </div>
                            </div>
                            <Chip size="small" label="Open Pages" color="primary" variant="outlined" />
                          </div>
                          <div className="JobRoleManagement-mobile-card-description">
                            <CalendarIcon className="JobRoleManagement-description-icon" />
                            <span className="JobRoleManagement-description-text">
                              Expiry: {formatDate(company.subscriptionExpiry)}
                            </span>
                          </div>
                          <LinearProgress
                            variant="determinate"
                            value={companyPercent}
                            sx={{ height: 6, borderRadius: 99, bgcolor: "#edf2f7" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="JobRoleManagement-empty-state">
                  <AppsIcon className="JobRoleManagement-empty-icon" />
                  <h3 className="JobRoleManagement-empty-title">No Companies Found</h3>
                  <p className="JobRoleManagement-empty-text">Companies will appear here once they are available.</p>
                </div>
              )}
            </div>
          </>
        )}

        {companyId && selectedCompany ? (
          renderAccessPanel()
        ) : companyId && companies.length > 0 && (
          <div className="JobRoleManagement-empty-state CompanyAccessManagement-select-empty">
            <AppsIcon className="JobRoleManagement-empty-icon" />
            <h3 className="JobRoleManagement-empty-title">Company Not Found</h3>
            <p className="JobRoleManagement-empty-text">Go back and select a company again.</p>
            <button className="JobRoleManagement-btn-primary" onClick={goBackToCompanies}>Back to Companies</button>
          </div>
        )}
      </div>
    </div>
  );
}
