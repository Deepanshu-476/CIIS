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
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
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
} from "@mui/icons-material";
import axiosInstance from "../../utils/axiosConfig";
import "./JobRoleManagement.css";

const APP_ROUTES = [
  { id: "user-dashboard", path: "user-dashboard", name: "Dashboard", category: "main" },
  { id: "attendance", path: "attendance", name: "My Attendance", category: "main" },
  { id: "my-leaves", path: "my-leaves", name: "My Leaves", category: "main" },
  { id: "my-assets", path: "my-assets", name: "My Assets", category: "main" },
  { id: "profile", path: "profile", name: "My Details", category: "main" },
  { id: "change-password", path: "change-password", name: "Change Password", category: "main" },
  { id: "emp-details", path: "emp-details", name: "Employee Details", category: "administration" },
  { id: "emp-leaves", path: "emp-leaves", name: "Employee Leaves", category: "administration" },
  { id: "emp-assets", path: "emp-assets", name: "Employee Assets", category: "administration" },
  { id: "emp-attendance", path: "emp-attendance", name: "Employee Attendance", category: "administration" },
  { id: "department", path: "department", name: "Department Management", category: "administration" },
  { id: "JobRoleManagement", path: "JobRoleManagement", name: "Job Role Management", category: "administration" },
  { id: "create-user", path: "create-user", name: "Create User", category: "administration" },
  { id: "SidebarManagement", path: "SidebarManagement", name: "Sidebar Management", category: "administration" },
  { id: "manage-groups", path: "manage-groups", name: "Manage Groups", category: "administration" },
  { id: "task-management", path: "task-management", name: "Create Task", category: "tasks" },
  { id: "admin-task-create", path: "admin-task-create", name: "Admin Create Task", category: "tasks" },
  { id: "company-all-task", path: "company-all-task", name: "Company All Tasks", category: "tasks" },
  { id: "project", path: "project", name: "Projects", category: "projects" },
  { id: "adminproject", path: "adminproject", name: "Admin Projects", category: "projects" },
  { id: "employee-meeting", path: "employee-meeting", name: "Employee Meeting", category: "meetings" },
  { id: "client-meeting", path: "client-meeting", name: "Client Meeting", category: "meetings" },
  { id: "admin-meeting", path: "admin-meeting", name: "Create Employee Meeting", category: "meetings" },
  { id: "emp-client", path: "emp-client", name: "Client Management", category: "clients" },
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
];

const categoryNames = {
  main: "Main",
  administration: "Administration",
  tasks: "Tasks",
  projects: "Projects",
  meetings: "Meetings",
  clients: "Clients",
  communication: "Communication",
};

const categoryColors = {
  main: "#2563eb",
  administration: "#7c3aed",
  tasks: "#f97316",
  projects: "#16a34a",
  meetings: "#0891b2",
  clients: "#db2777",
  communication: "#475569",
};

const getStoredAdminId = () => {
  try {
    const raw = localStorage.getItem("superAdmin") || localStorage.getItem("user");
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

export default function CompanyAccessManagement() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedPages, setSelectedPages] = useState([]);
  const [activeDays, setActiveDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

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

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/company");
      const fetchedCompanies = response.data?.companies || response.data?.data || [];
      setCompanies(fetchedCompanies);
    } catch (error) {
      setNotice({
        severity: "error",
        message: error.response?.data?.message || "Failed to load companies",
      });
    } finally {
      setLoading(false);
    }
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
    setSelectedPages(Array.isArray(company.allowedPages) ? company.allowedPages : []);
    setIsActive(Boolean(company.isActive));
    setActiveDays(30);
    setNotice(null);
  };

  const openCompanyAccess = company => {
    navigate(`/Ciis-network/CompanyAccessManagement/${company._id}`);
  };

  const goBackToCompanies = () => {
    setSelectedCompanyId("");
    setSelectedPages([]);
    setSearch("");
    setNotice(null);
    navigate("/Ciis-network/CompanyAccessManagement");
  };

  const togglePage = pageId => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const toggleCategory = routes => {
    const ids = routes.map(route => route.id);
    const allSelected = ids.every(id => selectedPages.includes(id));
    setSelectedPages(prev => {
      if (allSelected) return prev.filter(id => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  };

  const saveAccess = async () => {
    if (!selectedCompany) return;
    if (selectedPages.length === 0) {
      setNotice({ severity: "warning", message: "Select at least one page before activating access." });
      return;
    }

    setSaving(true);
    try {
      const response = await axiosInstance.patch(`/company/${selectedCompany._id}/access`, {
        allowedPages: selectedPages,
        activeDays,
        isActive,
        updatedBy: getStoredAdminId(),
      });

      const updatedCompany = response.data.company;
      setCompanies(prev => prev.map(company => (
        company._id === updatedCompany._id ? updatedCompany : company
      )));
      localStorage.setItem("company", JSON.stringify(updatedCompany));
      localStorage.setItem("companyDetails", JSON.stringify(updatedCompany));
      setNotice({
        severity: "success",
        message: response.data.message || "Company access saved successfully. Opening Sidebar Management...",
      });
      setTimeout(() => navigate("/Ciis-network/SidebarManagement"), 700);
    } catch (error) {
      setNotice({
        severity: "error",
        message: error.response?.data?.message || "Failed to save company access",
      });
    } finally {
      setSaving(false);
    }
  };

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
          <Grid item xs={12} sm={8}>
            <div className="JobRoleManagement-info-banner" style={{ marginBottom: 0 }}>
              <LockOpenIcon className="JobRoleManagement-info-icon" />
              <div style={{ width: "100%" }}>
                <div className="JobRoleManagement-info-title">
                  {selectedPages.length} pages selected / {selectedPercent}% enabled
                </div>
                <LinearProgress
                  variant="determinate"
                  value={selectedPercent}
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
                      return (
                        <Grid item xs={12} sm={6} lg={4} key={route.id}>
                          <button
                            className="JobRoleManagement-menu-item"
                            onClick={() => togglePage(route.id)}
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
                              <span className="JobRoleManagement-menu-subtitle">/{route.path}</span>
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
          { label: "Available Pages", value: APP_ROUTES.length, chip: "Routes", icon: <AppsIcon />, color: "JobRoleManagement-stat-red" },
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
