import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Grid, LinearProgress, Stack } from "@mui/material";
import {
  Apps as AppsIcon,
  CheckCircle as CheckCircleIcon,
  EventAvailable as EventAvailableIcon,
  Payments as PaymentsIcon,
  Search as SearchIcon,
  WorkspacePremium as PlanIcon,
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

const emptyForm = {
  name: "",
  price: "",
  durationDays: 30,
  description: "",
  featuresText: "",
  allowedPages: [],
  isActive: true,
};

const getStoredAdminId = () => {
  try {
    const raw = localStorage.getItem("superAdmin") || localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?._id || parsed?.id || null;
  } catch {
    return null;
  }
};

export default function PlanManagement() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedPercent = APP_ROUTES.length
    ? Math.round((form.allowedPages.length / APP_ROUTES.length) * 100)
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

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/plans?includeInactive=true");
      setPlans(response.data?.plans || []);
    } catch (error) {
      setNotice({ severity: "error", message: error.response?.data?.message || "Failed to load plans" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const togglePage = pageId => {
    setForm(prev => ({
      ...prev,
      allowedPages: prev.allowedPages.includes(pageId)
        ? prev.allowedPages.filter(id => id !== pageId)
        : [...prev.allowedPages, pageId],
    }));
  };

  const toggleCategory = routes => {
    const ids = routes.map(route => route.id);
    const allSelected = ids.every(id => form.allowedPages.includes(id));
    setForm(prev => ({
      ...prev,
      allowedPages: allSelected
        ? prev.allowedPages.filter(id => !ids.includes(id))
        : [...new Set([...prev.allowedPages, ...ids])],
    }));
  };

  const editPlan = plan => {
    setEditingId(plan._id);
    setForm({
      name: plan.name || "",
      price: plan.price ?? "",
      durationDays: plan.durationDays || 30,
      description: plan.description || "",
      featuresText: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      allowedPages: Array.isArray(plan.allowedPages) ? plan.allowedPages : [],
      isActive: plan.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm);
  };

  const savePlan = async event => {
    event.preventDefault();
    if (!form.name.trim()) {
      setNotice({ severity: "warning", message: "Plan name is required." });
      return;
    }
    if (!form.allowedPages.length) {
      setNotice({ severity: "warning", message: "Select at least one page for this plan." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price || 0),
        durationDays: Number(form.durationDays || 1),
        description: form.description.trim(),
        features: form.featuresText.split("\n").map(item => item.trim()).filter(Boolean),
        allowedPages: form.allowedPages,
        isActive: form.isActive,
        createdBy: getStoredAdminId(),
        updatedBy: getStoredAdminId(),
      };

      const response = editingId
        ? await axiosInstance.put(`/plans/${editingId}`, payload)
        : await axiosInstance.post("/plans", payload);

      setNotice({ severity: "success", message: response.data?.message || "Plan saved successfully." });
      resetForm();
      fetchPlans();
    } catch (error) {
      setNotice({ severity: "error", message: error.response?.data?.message || "Failed to save plan" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="JobRoleManagement-container">
        <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      </div>
    );
  }

  return (
    <div className="JobRoleManagement-container">
      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      <div className="JobRoleManagement-stats-grid">
        {[
          { label: "Plans", value: plans.length, chip: "Total", icon: <PlanIcon />, color: "JobRoleManagement-stat-blue" },
          { label: "Active Plans", value: plans.filter(plan => plan.isActive).length, chip: "Live", icon: <CheckCircleIcon />, color: "JobRoleManagement-stat-green" },
          { label: "Selected Pages", value: form.allowedPages.length, chip: `${selectedPercent}%`, icon: <AppsIcon />, color: "JobRoleManagement-stat-red" },
          { label: "Available Pages", value: APP_ROUTES.length, chip: "Routes", icon: <EventAvailableIcon />, color: "JobRoleManagement-stat-blue" },
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

      <div className="JobRoleManagement-paper">
        <div className="JobRoleManagement-header">
          <div className="JobRoleManagement-header-left">
            <div className="JobRoleManagement-header-icon-box">
              <PlanIcon className="JobRoleManagement-header-icon" />
            </div>
            <div>
              <h2 className="JobRoleManagement-header-title">Plans</h2>
              <div className="JobRoleManagement-user-info">
                <span className="JobRoleManagement-user-chip JobRoleManagement-chip-primary">
                  Price, days, features and page access
                </span>
              </div>
            </div>
          </div>
          <button className="JobRoleManagement-btn-outline" onClick={resetForm}>
            New Plan
          </button>
        </div>

        <form onSubmit={savePlan}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Plan name</label>
                <input className="JobRoleManagement-form-input" value={form.name} onChange={event => updateForm("name", event.target.value)} />
              </div>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Price</label>
                <input type="number" min="0" className="JobRoleManagement-form-input" value={form.price} onChange={event => updateForm("price", event.target.value)} />
              </div>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Days</label>
                <input type="number" min="1" className="JobRoleManagement-form-input" value={form.durationDays} onChange={event => updateForm("durationDays", event.target.value)} />
              </div>
            </Grid>
            <Grid item xs={12} md={4}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Description</label>
                <input className="JobRoleManagement-form-input" value={form.description} onChange={event => updateForm("description", event.target.value)} />
              </div>
            </Grid>
            <Grid item xs={12}>
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">What will company get?</label>
                <textarea
                  className="JobRoleManagement-form-input"
                  rows={3}
                  placeholder="One feature per line"
                  value={form.featuresText}
                  onChange={event => updateForm("featuresText", event.target.value)}
                />
              </div>
            </Grid>
          </Grid>

          <div className="JobRoleManagement-info-banner">
            <AppsIcon className="JobRoleManagement-info-icon" />
            <div style={{ width: "100%" }}>
              <div className="JobRoleManagement-info-title">
                {form.allowedPages.length} pages selected. Company will see only these pages after choosing this plan.
              </div>
              <LinearProgress variant="determinate" value={selectedPercent} sx={{ height: 7, mt: 1, borderRadius: 99, bgcolor: "#d7e9fb" }} />
            </div>
          </div>

          <div className="JobRoleManagement-header" style={{ paddingInline: 0 }}>
            <div className="JobRoleManagement-search-container">
              <SearchIcon className="JobRoleManagement-search-icon" />
              <input className="JobRoleManagement-search-input" placeholder="Search pages..." value={search} onChange={event => setSearch(event.target.value)} />
            </div>
            <div className="JobRoleManagement-header-actions">
              <button type="button" className="JobRoleManagement-btn-outline" onClick={() => updateForm("allowedPages", APP_ROUTES.map(route => route.id))}>Select All</button>
              <button type="button" className="JobRoleManagement-btn-secondary" onClick={() => updateForm("allowedPages", [])}>Clear</button>
            </div>
          </div>

          <Stack spacing={2}>
            {Object.entries(groupedRoutes).map(([category, routes]) => {
              const selectedCount = routes.filter(route => form.allowedPages.includes(route.id)).length;
              return (
                <div className="JobRoleManagement-mobile-card" key={category}>
                  <div className="JobRoleManagement-mobile-card-content">
                    <div className="JobRoleManagement-mobile-card-header">
                      <div className="JobRoleManagement-mobile-card-title-section">
                        <div className="JobRoleManagement-mobile-card-title">{categoryNames[category] || category}</div>
                        <div className="JobRoleManagement-mobile-card-badges">
                          <span className="JobRoleManagement-mobile-card-badge JobRoleManagement-badge-primary">{selectedCount}/{routes.length} selected</span>
                        </div>
                      </div>
                      <button type="button" className="JobRoleManagement-btn-outline" onClick={() => toggleCategory(routes)}>
                        {selectedCount === routes.length ? "Deselect" : "Select"}
                      </button>
                    </div>
                    <Grid container spacing={1.2}>
                      {routes.map(route => {
                        const selected = form.allowedPages.includes(route.id);
                        return (
                          <Grid item xs={12} sm={6} lg={4} key={route.id}>
                            <button type="button" className="JobRoleManagement-menu-item" onClick={() => togglePage(route.id)}>
                              <span className="JobRoleManagement-menu-icon">{selected ? <CheckCircleIcon fontSize="small" /> : <AppsIcon fontSize="small" />}</span>
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
            <label className="JobRoleManagement-switch">
              <input type="checkbox" checked={form.isActive} onChange={event => updateForm("isActive", event.target.checked)} />
              <span className="JobRoleManagement-slider"></span>
            </label>
            <span className="JobRoleManagement-toggle-label">{form.isActive ? "Active" : "Inactive"}</span>
            <button className="JobRoleManagement-btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
            </button>
          </div>
        </form>
      </div>

      <div className="JobRoleManagement-paper" style={{ marginTop: 20 }}>
        <div className="JobRoleManagement-header">
          <h2 className="JobRoleManagement-header-title">Created Plans</h2>
        </div>
        <Grid container spacing={2}>
          {plans.map(plan => (
            <Grid item xs={12} md={6} lg={4} key={plan._id}>
              <div className="JobRoleManagement-mobile-card">
                <div className="JobRoleManagement-mobile-card-content">
                  <div className="JobRoleManagement-mobile-card-header">
                    <div className="JobRoleManagement-mobile-card-title-section">
                      <div className="JobRoleManagement-mobile-card-title">{plan.name}</div>
                      <div className="JobRoleManagement-mobile-card-badges">
                        <span className="JobRoleManagement-mobile-card-badge JobRoleManagement-badge-primary">₹{Number(plan.price || 0).toLocaleString("en-IN")}</span>
                        <span className="JobRoleManagement-mobile-card-badge">{plan.durationDays} days</span>
                      </div>
                    </div>
                    <Chip size="small" label={plan.isActive ? "Active" : "Inactive"} color={plan.isActive ? "success" : "default"} />
                  </div>
                  <div className="JobRoleManagement-mobile-card-description">
                    <PaymentsIcon className="JobRoleManagement-description-icon" />
                    <span className="JobRoleManagement-description-text">{plan.allowedPages?.length || 0} pages, {plan.features?.length || 0} features</span>
                  </div>
                  <button className="JobRoleManagement-btn-outline" onClick={() => editPlan(plan)}>Edit</button>
                </div>
              </div>
            </Grid>
          ))}
        </Grid>
      </div>
    </div>
  );
}
