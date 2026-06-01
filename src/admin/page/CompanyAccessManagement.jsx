import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  ManageAccounts as ManageAccountsIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import axiosInstance from "../../utils/axiosConfig";

const APP_ROUTES = [
  { id: "user-dashboard", path: "user-dashboard", name: "Dashboard", category: "main" },
  { id: "attendance", path: "attendance", name: "My Attendance", category: "main" },
  { id: "my-leaves", path: "my-leaves", name: "My Leaves", category: "main" },
  { id: "my-assets", path: "my-assets", name: "My Assets", category: "main" },
  { id: "change-password", path: "change-password", name: "Change Password", category: "main" },
  { id: "emp-details", path: "emp-details", name: "Employee Details", category: "administration" },
  { id: "emp-leaves", path: "emp-leaves", name: "Employee Leaves", category: "administration" },
  { id: "emp-assets", path: "emp-assets", name: "Employee Assets", category: "administration" },
  { id: "emp-attendance", path: "emp-attendance", name: "Employee Attendance", category: "administration" },
  { id: "create-user", path: "create-user", name: "Create User", category: "administration" },
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
  { id: "alert", path: "alert", name: "Alerts", category: "communication" },
  { id: "create-alert", path: "create-alert", name: "Create Alert", category: "communication" },
  { id: "chat", path: "chat", name: "Chat", category: "communication" },
  { id: "contact-support", path: "contact-support", name: "Contact Support", category: "communication" },
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

      const firstCompany = fetchedCompanies[0];
      if (firstCompany && !selectedCompanyId) {
        selectCompany(firstCompany);
      }
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

  const selectCompany = company => {
    setSelectedCompanyId(company._id);
    setSelectedPages(Array.isArray(company.allowedPages) ? company.allowedPages : []);
    setIsActive(Boolean(company.isActive));
    setActiveDays(30);
    setNotice(null);
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
      setNotice({
        severity: "success",
        message: response.data.message || "Company access saved successfully",
      });
    } catch (error) {
      setNotice({
        severity: "error",
        message: error.response?.data?.message || "Failed to save company access",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ManageAccountsIcon color="primary" />
            <Typography variant="h4" fontWeight={700}>Company Access</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Activate new companies, set validity days, and choose the pages their owner can distribute to users.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={fetchCompanies}>Refresh</Button>
      </Stack>

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice.message}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Companies</Typography>
              <Stack spacing={1.2}>
                {companies.map(company => {
                  const selected = company._id === selectedCompanyId;
                  return (
                    <Button
                      key={company._id}
                      onClick={() => selectCompany(company)}
                      variant={selected ? "contained" : "outlined"}
                      sx={{ justifyContent: "flex-start", textAlign: "left", p: 1.5 }}
                    >
                      <Stack spacing={0.5} sx={{ width: "100%" }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <BusinessIcon fontSize="small" />
                          <Typography fontWeight={700} noWrap>{company.companyName}</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {company.companyCode} | {company.isActive ? "Active" : "Inactive"} | Exp: {formatDate(company.subscriptionExpiry)}
                        </Typography>
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              {selectedCompany ? (
                <>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>{selectedCompany.companyName}</Typography>
                      <Typography color="text.secondary">
                        {selectedCompany.companyEmail} | {selectedCompany.companyCode}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={selectedCompany.isActive ? <CheckCircleIcon /> : undefined}
                        color={selectedCompany.isActive ? "success" : "default"}
                        label={selectedCompany.isActive ? "Active" : "Inactive"}
                      />
                      <Chip icon={<CalendarIcon />} label={`Expiry: ${formatDate(selectedCompany.subscriptionExpiry)}`} />
                    </Stack>
                  </Stack>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Active days"
                        value={activeDays}
                        onChange={event => setActiveDays(event.target.value)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControlLabel
                        control={<Switch checked={isActive} onChange={event => setIsActive(event.target.checked)} />}
                        label={isActive ? "Activate login" : "Keep inactive"}
                        sx={{ height: "100%", alignItems: "center" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Search pages"
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Chip color="primary" label={`${selectedPages.length} selected`} />
                    <Button size="small" onClick={() => setSelectedPages(APP_ROUTES.map(route => route.id))}>Select All</Button>
                    <Button size="small" onClick={() => setSelectedPages([])}>Clear</Button>
                  </Stack>

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    {Object.entries(groupedRoutes).map(([category, routes]) => {
                      const selectedCount = routes.filter(route => selectedPages.includes(route.id)).length;
                      return (
                        <Box key={category}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography fontWeight={700}>{categoryNames[category] || category}</Typography>
                            <Button size="small" onClick={() => toggleCategory(routes)}>
                              {selectedCount === routes.length ? "Deselect" : "Select"} ({selectedCount}/{routes.length})
                            </Button>
                          </Stack>
                          <Stack direction="row" flexWrap="wrap" gap={1}>
                            {routes.map(route => {
                              const selected = selectedPages.includes(route.id);
                              return (
                                <Chip
                                  key={route.id}
                                  clickable
                                  color={selected ? "primary" : "default"}
                                  variant={selected ? "filled" : "outlined"}
                                  label={route.name}
                                  onClick={() => togglePage(route.id)}
                                />
                              );
                            })}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>

                  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                    <Button variant="contained" onClick={saveAccess} disabled={saving}>
                      {saving ? "Saving..." : "Save Access"}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Alert severity="info">No company selected.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
