import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import Swal from "sweetalert2";
import {
  Add as AddIcon,
  Apartment as ApartmentIcon,
  Business as BranchIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
  Groups as GroupsIcon,
  Inventory as AssetIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  ShieldOutlined as ActiveBranchesIcon,
  AccountTree as DepartmentIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputBase,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

const getBranchUsers = (branch) => Number(branch.totalUsers || branch.employeeCount || branch.usersCount || 0);
const getRecordId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return value;
};

const getBranchLabel = (branch) => {
  if (!branch) return "";
  const name = branch.name || branch.branchName || "Branch";
  return branch.branchCode ? `${name} (${branch.branchCode})` : name;
};

const getUserAssignedBranchIds = (user = {}) => {
  const rawValues = [
    user.branch,
    user.branchId,
    user.branchDetails,
    ...(Array.isArray(user.assignedBranches) ? user.assignedBranches : []),
    ...(Array.isArray(user.branchIds) ? user.branchIds : []),
  ];

  const seen = new Set();
  return rawValues.reduce((ids, value) => {
    const id = getRecordId(value);
    if (!id || seen.has(id)) return ids;
    seen.add(id);
    ids.push(id);
    return ids;
  }, []);
};

const getUserPrimaryBranchId = (user = {}) => getRecordId(
  user.branch || user.branchId || user.branchDetails || getUserAssignedBranchIds(user)[0]
);

const readStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getStoredCompanyContext = () => {
  const company = readStoredJson("company");
  const companyDetails = readStoredJson("companyDetails");
  const user = readStoredJson("user") || readStoredJson("superAdmin");
  const record = company || companyDetails || user?.companyDetails ||
    (typeof user?.company === "object" ? user.company : null);
  const id = (
    getRecordId(record) ||
    getRecordId(user?.companyId) ||
    getRecordId(user?.company)
  );
  const companyCode = (
    record?.companyCode ||
    record?.code ||
    user?.companyCode ||
    localStorage.getItem("companyCode") ||
    ""
  );

  return { id, companyCode, record };
};

const BranchManagement = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [companyId, setCompanyId] = useState("");
  const [companyUsers, setCompanyUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserBranches, setSelectedUserBranches] = useState([]);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    branchCode: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    let cancelled = false;

    const initializeCompany = async () => {
      try {
        const context = getStoredCompanyContext();
        let resolvedCompanyId = context.id;

        if (!resolvedCompanyId && context.companyCode) {
          const response = await axiosInstance.get(
            `/company/code/${encodeURIComponent(context.companyCode)}`
          );
          const resolvedCompany = response.data?.company || response.data?.data || response.data;
          resolvedCompanyId = getRecordId(resolvedCompany);

          if (resolvedCompanyId) {
            localStorage.setItem("company", JSON.stringify(resolvedCompany));
            localStorage.setItem("companyDetails", JSON.stringify(resolvedCompany));
          }
        }

        if (cancelled) return;

        if (!resolvedCompanyId) {
          setLoading(false);
          toastAlert("error", "Active company not found. Please select or login to the company again.");
          return;
        }

        setCompanyId(resolvedCompanyId);
        await Promise.all([
          fetchBranches(resolvedCompanyId),
          fetchCompanyUsers(resolvedCompanyId),
        ]);
      } catch (err) {
        if (cancelled) return;
        console.error("Error resolving active company:", err);
        setLoading(false);
        toastAlert("error", err.response?.data?.message || "Failed to resolve active company");
      }
    };

    initializeCompany();
    return () => {
      cancelled = true;
    };
  }, []);

  const toastAlert = (icon, title) => {
    Swal.fire({
      icon,
      title,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const fetchBranches = async (cId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/branches/company/${cId}`);
      if (response.data?.success) {
        const branchData = response.data?.branches || response.data?.data || [];
        setBranches(Array.isArray(branchData) ? branchData : []);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toastAlert("error", "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyUsers = async (cId) => {
    try {
      setUsersLoading(true);
      const response = await axiosInstance.get("/users/company-users", {
        params: {
          companyId: cId,
          limit: 200,
        },
      });

      const userData = response.data?.users || response.data?.data || response.data?.message?.users || [];
      const users = Array.isArray(userData) ? userData : [];
      setCompanyUsers(users);

    } catch (error) {
      console.error("Error fetching company users:", error);
      toastAlert("error", "Failed to load company users");
      setCompanyUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.isActive !== false).length,
    [branches]
  );
  const defaultBranches = useMemo(
    () => branches.filter((branch) => branch.isDefault).length,
    [branches]
  );
  const totalEmployees = useMemo(
    () => branches.reduce((sum, branch) => sum + getBranchUsers(branch), 0),
    [branches]
  );

  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [getRecordId(branch), branch])),
    [branches]
  );

  const selectedUser = useMemo(
    () => companyUsers.find((user) => getRecordId(user) === selectedUserId) || null,
    [companyUsers, selectedUserId]
  );

  const multiBranchUsers = useMemo(
    () => companyUsers.filter((user) => getUserAssignedBranchIds(user).length > 1),
    [companyUsers]
  );

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserBranches([]);
      return;
    }

    setSelectedUserBranches(getUserAssignedBranchIds(selectedUser));
  }, [selectedUser]);

  const filteredBranches = useMemo(() => {
    return branches
      .filter((branch) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          branch.name?.toLowerCase().includes(query) ||
          branch.branchCode?.toLowerCase().includes(query) ||
          branch.address?.toLowerCase().includes(query) ||
          branch.phone?.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && branch.isActive !== false) ||
          (statusFilter === "inactive" && branch.isActive === false);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name-desc") return (b.name || "").localeCompare(a.name || "");
        if (sortBy === "employees-desc") return getBranchUsers(b) - getBranchUsers(a);
        if (sortBy === "employees-asc") return getBranchUsers(a) - getBranchUsers(b);
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [branches, searchQuery, sortBy, statusFilter]);

  const stats = [
    {
      label: "Total Branches",
      value: branches.length,
      chip: "All locations",
      icon: <BranchIcon />,
      className: "total",
    },
    {
      label: "Active Branches",
      value: activeBranches,
      chip: `${branches.length ? Math.round((activeBranches / branches.length) * 100) : 0}%`,
      icon: <ActiveBranchesIcon />,
      className: "active",
    },
    {
      label: "Default Branch",
      value: defaultBranches,
      chip: "Head office",
      icon: <ApartmentIcon />,
      className: "warning",
    },
    {
      label: "Total Employees",
      value: totalEmployees,
      chip: "All branches",
      icon: <GroupsIcon />,
      className: "people",
    },
  ];

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => {
      const previousAutoCode = prev.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 5).toUpperCase();
      const updates = { ...prev, name };
      if (!isEditMode && (!prev.branchCode || prev.branchCode === previousAutoCode)) {
        updates.branchCode = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 5).toUpperCase();
      }
      return updates;
    });
  };

  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setSelectedBranchId(null);
    setFormData({ name: "", branchCode: "", address: "", phone: "" });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (branch) => {
    setIsEditMode(true);
    setSelectedBranchId(branch._id);
    setFormData({
      name: branch.name || "",
      branchCode: branch.branchCode || "",
      address: branch.address || "",
      phone: branch.phone || "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: "", branchCode: "", address: "", phone: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.branchCode.trim()) {
      toastAlert("warning", "Name and Branch Code are required");
      return;
    }
    if (formData.branchCode.trim().length < 5 || formData.branchCode.trim().length > 20) {
      toastAlert("warning", "Branch Code must be between 5 and 20 characters");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        branchCode: formData.branchCode.trim(),
        address: formData.address,
        phone: formData.phone,
      };

      const response = isEditMode
        ? await axiosInstance.put(`/branches/${selectedBranchId}`, payload)
        : await axiosInstance.post("/branches", { ...payload, companyId });

      if (response.data?.success) {
        toastAlert("success", isEditMode ? "Branch updated successfully" : "Branch added successfully");
        handleCloseDialog();
        fetchBranches(companyId);
      }
    } catch (error) {
      console.error("Submit branch error:", error);
      Swal.fire("Error", error.response?.data?.message || "Failed to save branch", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch) => {
    if (branch.isDefault) {
      toastAlert("warning", "Default branch cannot be deactivated");
      return;
    }

    try {
      const nextActiveState = !branch.isActive;
      const response = await axiosInstance.put(`/branches/${branch._id}`, {
        isActive: nextActiveState,
      });

      if (response.data?.success) {
        toastAlert("success", `Branch ${nextActiveState ? "activated" : "deactivated"} successfully`);
        fetchBranches(companyId);
      }
    } catch (error) {
      console.error("Toggle branch error:", error);
      toastAlert("error", error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteBranch = (branch) => {
    if (branch.isDefault) {
      Swal.fire("Restricted", "Default branch (Head Office) cannot be deleted.", "warning");
      return;
    }

    Swal.fire({
      title: `Delete Branch: ${branch.name}?`,
      text: "You won't be able to revert this. Users and departments associated with this branch will prevent deletion.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const response = await axiosInstance.delete(`/branches/${branch._id}`);
        if (response.data?.success) {
          Swal.fire("Deleted", "Branch has been deleted.", "success");
          fetchBranches(companyId);
        }
      } catch (error) {
        console.error("Delete branch error:", error);
        Swal.fire("Restriction", error.response?.data?.message || "Failed to delete branch", "error");
      }
    });
  };

  const handleUserChange = (event) => {
    setSelectedUserId(event.target.value);
  };

  const handleEditMultiBranchUser = (user) => {
    const userId = getRecordId(user);
    const assignedBranchIds = getUserAssignedBranchIds(user);
    setSelectedUserId(userId);
    setSelectedUserBranches(assignedBranchIds);
    toastAlert("info", `Editing branch access for ${user.name || "selected user"}`);
  };

  const handleBranchAssignmentsChange = (event) => {
    const { value } = event.target;
    setSelectedUserBranches(typeof value === "string" ? value.split(",") : value);
  };

  const handleSaveBranchAssignments = async () => {
    if (!selectedUser) {
      toastAlert("warning", "Please select a user first");
      return;
    }

    if (!selectedUserBranches.length) {
      toastAlert("warning", "Please select at least one branch");
      return;
    }

    try {
      setAssignmentSaving(true);
      const primaryBranchId = selectedUserBranches[0];
      const primaryBranch = branchMap.get(primaryBranchId);

      const response = await axiosInstance.put(`/users/admin-update/${selectedUserId}`, {
        branch: primaryBranchId,
        branchCode: primaryBranch?.branchCode || "",
        assignedBranches: selectedUserBranches,
      });

      if (response.data?.success) {
        toastAlert("success", "Branch assignment updated successfully");
        await fetchCompanyUsers(companyId);
      } else {
        throw new Error(response.data?.message || "Failed to update branch assignment");
      }
    } catch (error) {
      console.error("Error saving branch assignments:", error);
      toastAlert("error", error.response?.data?.message || "Failed to update branch assignment");
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleExportBranches = () => {
    const headers = ["Branch", "Branch Code", "Phone", "Address", "Employees", "Status"];
    const rows = filteredBranches.map((branch) => [
      branch.name || "",
      branch.branchCode || "",
      branch.phone || "",
      branch.address || "",
      getBranchUsers(branch),
      branch.isActive !== false ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "branches.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={styles.page}>
      <Box sx={styles.statsGrid}>
        {stats.map((stat) => (
          <Paper key={stat.label} elevation={0} sx={{ ...styles.statCard, ...styles[`stat_${stat.className}`] }}>
            <Box className="branch-stat-icon" sx={styles.statIcon}>{stat.icon}</Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={styles.statLabel}>{stat.label}</Typography>
              <Box sx={styles.statValueRow}>
                <Typography sx={styles.statValue}>{stat.value}</Typography>
                <Chip label={stat.chip} size="small" sx={styles.statChip} />
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={styles.paper}>
        <Box sx={styles.header}>
          <Box sx={styles.titleSection}>
            <Box sx={styles.titleIcon}>
              <BranchIcon />
            </Box>
            <Box>
              <Typography sx={styles.title}>Manage Branches</Typography>
              <Typography sx={styles.subtitle}>Create, edit and manage all company branches</Typography>
            </Box>
          </Box>

          <Box sx={styles.headerActions}>
            <Box sx={styles.searchBox}>
              <SearchIcon sx={{ fontSize: 20, color: "#64748b" }} />
              <InputBase
                sx={styles.searchInput}
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Box>
            <Box component="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={styles.select}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Box>
            <Box component="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={styles.select}>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="employees-desc">Employees (High)</option>
              <option value="employees-asc">Employees (Low)</option>
            </Box>
            <Tooltip title="Export branches">
              <IconButton sx={styles.toolButton} onClick={handleExportBranches}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filters">
              <IconButton sx={styles.toolButton}>
                <FilterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={styles.primaryButton}>
              Add Branch
            </Button>
          </Box>
        </Box>

        <Box sx={styles.assignmentWrap}>
          <Paper elevation={0} sx={styles.assignmentCard}>
            <Box sx={styles.assignmentHeader}>
              <Box>
                <Typography sx={styles.assignmentTitle}>Branch Assignment</Typography>
                <Typography sx={styles.assignmentSubtitle}>
                  Select a company user and assign one or more branches.
                </Typography>
              </Box>
              <Chip
                label={usersLoading ? "Loading users" : `${companyUsers.length} users`}
                size="small"
                sx={styles.assignmentChip}
              />
            </Box>

            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="branch-user-select-label">Company User</InputLabel>
                  <Select
                    labelId="branch-user-select-label"
                    value={selectedUserId}
                    label="Company User"
                    onChange={handleUserChange}
                    disabled={usersLoading || companyUsers.length === 0}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ color: "#94a3b8" }}>Select</span>;
                      }
                      const user = companyUsers.find((item) => getRecordId(item) === selected);
                      return user ? `${user.name || "Unnamed User"}` : "Select";
                    }}
                    input={<OutlinedInput label="Company User" />}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {companyUsers.map((user) => {
                      const userId = getRecordId(user);
                      return (
                        <MenuItem key={userId} value={userId}>
                          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <Typography sx={styles.userOptionName}>{user.name || "Unnamed User"}</Typography>
                            <Typography sx={styles.userOptionMeta}>
                              {user.email || "No email"}{user.employeeId ? ` - ${user.employeeId}` : ""}
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                {selectedUser && (
                  <Typography sx={styles.selectedUserMeta}>
                    Current access: {getUserAssignedBranchIds(selectedUser).length} branch{getUserAssignedBranchIds(selectedUser).length === 1 ? "" : "es"}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={8}>
                <FormControl fullWidth size="small">
                  <InputLabel id="branch-multi-select-label">Assign Branches</InputLabel>
                  <Select
                    labelId="branch-multi-select-label"
                    multiple
                    value={selectedUserBranches}
                    onChange={handleBranchAssignmentsChange}
                    disabled={!selectedUser || branches.length === 0}
                    input={<OutlinedInput label="Assign Branches" />}
                    renderValue={(selected) => {
                      const labels = selected
                        .map((branchId) => getBranchLabel(branchMap.get(branchId)))
                        .filter(Boolean);
                      return labels.length ? labels.join(", ") : "Select branches";
                    }}
                  >
                    {branches.map((branch) => {
                      const branchId = getRecordId(branch);
                      return (
                        <MenuItem key={branchId} value={branchId}>
                          <Checkbox checked={selectedUserBranches.includes(branchId)} />
                          <ListItemText primary={getBranchLabel(branch)} secondary={branch.isDefault ? "Default branch" : ""} />
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                {selectedUserBranches.length > 0 && (
                  <Box sx={styles.branchChipRow}>
                    {selectedUserBranches.map((branchId) => {
                      const branch = branchMap.get(branchId);
                      return (
                        <Chip
                          key={branchId}
                          label={getBranchLabel(branch) || branchId}
                          size="small"
                          sx={styles.branchChip}
                        />
                      );
                    })}
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={12}>
                <Box sx={styles.assignmentActions}>
                  <Typography sx={styles.assignmentHint}>
                    Users with a single branch will not see the branch dropdown on page screens. Multi-branch users and company owners will.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleSaveBranchAssignments}
                    disabled={!selectedUser || assignmentSaving}
                    sx={styles.primaryButton}
                  >
                    {assignmentSaving ? <CircularProgress size={20} color="inherit" /> : "Save Branch Access"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Box sx={styles.assignmentWrap}>
          <Paper elevation={0} sx={styles.assignmentCard}>
            <Box sx={styles.assignmentHeader}>
              <Box>
                <Typography sx={styles.assignmentTitle}>Multi-Branch Users</Typography>
                <Typography sx={styles.assignmentSubtitle}>
                  Users with more than one branch assigned are listed here for quick editing.
                </Typography>
              </Box>
              <Chip
                label={`${multiBranchUsers.length} users`}
                size="small"
                sx={styles.assignmentChip}
              />
            </Box>

            {multiBranchUsers.length === 0 ? (
              <Box sx={styles.emptyMultiBranchState}>
                <Typography sx={styles.emptyMultiBranchTitle}>No multi-branch users found</Typography>
                <Typography sx={styles.emptyMultiBranchSubtitle}>
                  Assign more than one branch to a user and they will appear here.
                </Typography>
              </Box>
            ) : (
              <Box sx={styles.multiBranchList}>
                {multiBranchUsers.map((user) => {
                  const assignedBranchIds = getUserAssignedBranchIds(user);
                  return (
                    <Box key={getRecordId(user)} sx={styles.multiBranchRow}>
                      <Box sx={styles.multiBranchUserInfo}>
                        <Typography sx={styles.multiBranchName}>{user.name || "Unnamed User"}</Typography>
                        <Typography sx={styles.multiBranchMeta}>
                          {user.email || "No email"}{user.employeeId ? ` - ${user.employeeId}` : ""}
                        </Typography>
                      </Box>

                      <Box sx={styles.multiBranchChips}>
                        {assignedBranchIds.map((branchId) => {
                          const branch = branchMap.get(branchId);
                          return (
                            <Chip
                              key={branchId}
                              label={getBranchLabel(branch) || branchId}
                              size="small"
                              sx={styles.branchChip}
                            />
                          );
                        })}
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEditMultiBranchUser(user)}
                        sx={styles.editAccessButton}
                      >
                        Edit
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Box>

        {loading ? (
          <Box sx={styles.loadingState}>
            <CircularProgress size={34} sx={{ color: "#1976d2" }} />
          </Box>
        ) : (
          <Box sx={styles.tableWrap}>
            <Box component="table" sx={styles.table}>
              <Box component="thead">
                <Box component="tr">
                  {["Branch", "Code", "Contact", "Employees", "Status", "Actions"].map((heading) => (
                    <Box component="th" key={heading} sx={styles.th}>
                      {heading}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {filteredBranches.length === 0 ? (
                  <Box component="tr">
                    <Box component="td" colSpan={6} sx={styles.emptyCell}>
                      <BranchIcon sx={{ fontSize: 54, color: "#cbd5e1", mb: 1 }} />
                      <Typography sx={{ fontWeight: 800, color: "#334155" }}>No Branches Found</Typography>
                      <Typography sx={{ color: "#64748b", fontSize: 13, mt: 0.5 }}>
                        {searchQuery ? "No branches match your search." : "Create your first branch to get started."}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  filteredBranches.map((branch) => {
                    const active = branch.isActive !== false;
                    return (
                      <Box component="tr" key={branch._id} sx={styles.tr}>
                        <Box component="td" sx={styles.td}>
                          <Box sx={styles.branchCell}>
                            <Box sx={{ ...styles.branchIcon, ...(branch.isDefault ? styles.branchIconDefault : active ? styles.branchIconActive : styles.branchIconInactive) }}>
                              <BranchIcon fontSize="small" />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Box sx={styles.branchNameRow}>
                                <Typography sx={styles.branchName}>{branch.name}</Typography>
                                {branch.isDefault && <Chip label="Default" size="small" sx={styles.defaultChip} />}
                              </Box>
                              <Typography sx={styles.branchAddress}>{branch.address || "Address not available"}</Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box component="td" sx={styles.td}>
                          <Chip label={branch.branchCode || "N/A"} size="small" sx={styles.codeChip} />
                        </Box>
                        <Box component="td" sx={styles.td}>
                          <Box sx={styles.contactStack}>
                            <Box sx={styles.contactLine}>
                              <PhoneIcon sx={styles.contactIcon} />
                              {branch.phone || "Not set"}
                            </Box>
                            <Box sx={styles.contactLine}>
                              <EmailIcon sx={styles.contactIcon} />
                              {branch.email || branch.contactEmail || "Not set"}
                            </Box>
                          </Box>
                        </Box>
                        <Box component="td" sx={styles.td}>
                          <Box sx={styles.employeeCell}>
                            <GroupsIcon sx={{ fontSize: 16 }} />
                            {getBranchUsers(branch)}
                          </Box>
                        </Box>
                        <Box component="td" sx={styles.td}>
                          <Chip
                            label={active ? "Active" : "Inactive"}
                            size="small"
                            onClick={() => handleToggleStatus(branch)}
                            sx={active ? styles.activeChip : styles.inactiveChip}
                          />
                        </Box>
                        <Box component="td" sx={styles.td}>
                          <Box sx={styles.actions}>
                            <Tooltip title="Edit branch">
                              <IconButton size="small" sx={styles.actionButton} onClick={() => handleOpenEditDialog(branch)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Manage departments">
                              <IconButton
                                size="small"
                                sx={styles.actionButton}
                                onClick={() => navigate(`/Ciis-network/department?branch=${branch._id}`)}
                              >
                                <DepartmentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Manage assets">
                              <IconButton
                                size="small"
                                sx={styles.actionButton}
                                onClick={() => navigate(`/Ciis-network/company-assets?branch=${branch._id}`)}
                              >
                                <AssetIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!branch.isDefault && (
                              <Tooltip title="Delete branch">
                                <IconButton size="small" sx={styles.deleteButton} onClick={() => handleDeleteBranch(branch)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth PaperProps={{ sx: styles.dialogPaper }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={styles.dialogTitle}>{isEditMode ? "Edit Branch" : "Create Branch"}</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="Branch Name" value={formData.name} onChange={handleNameChange} required />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Branch Login Code"
                  value={formData.branchCode}
                  inputProps={{ minLength: 5, maxLength: 20 }}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      branchCode: e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
                    }))
                  }
                  required
                  helperText="Use 5-20 characters; appended to company code for login (e.g. TCS-NOIDA)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Phone Number" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
            <Button onClick={handleCloseDialog} sx={{ color: "text.secondary", textTransform: "none", fontWeight: 700 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={styles.primaryButton}>
              {submitting ? <CircularProgress size={22} color="inherit" /> : isEditMode ? "Update Branch" : "Create Branch"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

const styles = {
  page: {
    p: { xs: 1.5, sm: 2, md: 3 },
    minHeight: "100vh",
    bgcolor: "#f8fafc",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
    gap: 2,
    mb: 3,
  },
  statCard: {
    p: 2.5,
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    bgcolor: "#fff",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
    display: "flex",
    gap: 2,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 4,
      bgcolor: "#2196f3",
    },
  },
  stat_total: { "&::before": { bgcolor: "#2196f3" }, "& .branch-stat-icon": { bgcolor: "#e3f2fd", color: "#1976d2" } },
  stat_active: { "&::before": { bgcolor: "#4caf50" }, "& .branch-stat-icon": { bgcolor: "#e8f5e9", color: "#2e7d32" } },
  stat_warning: { "&::before": { bgcolor: "#ff9800" }, "& .branch-stat-icon": { bgcolor: "#fff3e0", color: "#ef6c00" } },
  stat_people: { "&::before": { bgcolor: "#7c3aed" }, "& .branch-stat-icon": { bgcolor: "#f3e8ff", color: "#7c3aed" } },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": { fontSize: 28 },
  },
  statLabel: { fontSize: 12, fontWeight: 700, color: "#546e7a", textTransform: "uppercase", letterSpacing: 0.5 },
  statValueRow: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    mt: 0.6,
    bgcolor: "transparent",
    minWidth: 0,
  },
  statValue: { fontSize: 28, fontWeight: 800, color: "#263238", lineHeight: 1 },
  statChip: {
    height: 24,
    borderRadius: "999px",
    bgcolor: "rgba(241, 245, 249, 0.78)",
    color: "#475569",
    border: "1px solid #e2e8f0",
    fontSize: 11,
    fontWeight: 700,
    "& .MuiChip-label": { px: 1.1 },
  },
  paper: {
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  assignmentWrap: {
    px: 2.5,
    py: 2.5,
    borderBottom: "1px solid #e2e8f0",
    bgcolor: "#f8fbff",
  },
  assignmentCard: {
    p: 2.5,
    borderRadius: "16px",
    border: "1px solid #dbe5f5",
    bgcolor: "#fff",
    boxShadow: "0 8px 24px rgba(37, 99, 235, 0.06)",
  },
  assignmentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 2,
    mb: 2,
    flexWrap: "wrap",
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e293b",
  },
  assignmentSubtitle: {
    fontSize: 13,
    color: "#64748b",
    mt: 0.5,
  },
  assignmentChip: {
    height: 24,
    borderRadius: "999px",
    bgcolor: "#eff6ff",
    color: "#2563eb",
    fontWeight: 800,
  },
  userOptionName: {
    fontSize: 13,
    fontWeight: 800,
    color: "#1e293b",
    lineHeight: 1.2,
  },
  userOptionMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  selectedUserMeta: {
    mt: 0.75,
    fontSize: 12,
    color: "#475569",
  },
  branchChipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
    mt: 1.25,
  },
  branchChip: {
    height: 24,
    bgcolor: "#eef2ff",
    color: "#4338ca",
    fontWeight: 700,
  },
  multiBranchList: {
    display: "flex",
    flexDirection: "column",
    gap: 1.25,
  },
  multiBranchRow: {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", lg: "minmax(220px, 280px) 1fr auto" },
    gap: 1.5,
    alignItems: { xs: "stretch", lg: "center" },
    p: 1.5,
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    bgcolor: "#f8fafc",
  },
  multiBranchUserInfo: {
    minWidth: 0,
  },
  multiBranchName: {
    fontSize: 14,
    fontWeight: 800,
    color: "#1e293b",
    lineHeight: 1.25,
  },
  multiBranchMeta: {
    fontSize: 12,
    color: "#64748b",
    mt: 0.35,
  },
  multiBranchChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
    alignItems: "center",
  },
  editAccessButton: {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 800,
    px: 2,
    minWidth: 92,
    alignSelf: { xs: "flex-start", lg: "center" },
  },
  emptyMultiBranchState: {
    p: 2,
    borderRadius: "14px",
    border: "1px dashed #cbd5e1",
    bgcolor: "#f8fafc",
  },
  emptyMultiBranchTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#334155",
  },
  emptyMultiBranchSubtitle: {
    fontSize: 12,
    color: "#64748b",
    mt: 0.5,
  },
  assignmentActions: {
    display: "flex",
    alignItems: { xs: "stretch", sm: "center" },
    justifyContent: "space-between",
    gap: 2,
    mt: 0.5,
    flexDirection: { xs: "column", sm: "row" },
  },
  assignmentHint: {
    fontSize: 12,
    color: "#64748b",
    maxWidth: 680,
  },
  header: {
    p: 2.5,
    display: "flex",
    justifyContent: "space-between",
    alignItems: { xs: "stretch", lg: "center" },
    gap: 2,
    flexDirection: { xs: "column", lg: "row" },
    borderBottom: "1px solid #e2e8f0",
  },
  titleSection: { display: "flex", alignItems: "center", gap: 1.5 },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: "12px",
    bgcolor: "linear-gradient(135deg, #1976d2, #42a5f5)",
    background: "linear-gradient(135deg, #1976d2, #42a5f5)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: 800, color: "#263238", lineHeight: 1.1 },
  subtitle: { fontSize: 13, color: "#607d8b", mt: 0.5 },
  headerActions: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 },
  searchBox: {
    height: 42,
    minWidth: { xs: "100%", sm: 260 },
    px: 1.5,
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: 1,
    bgcolor: "#fff",
  },
  searchInput: { flex: 1, fontSize: 14 },
  select: {
    height: 42,
    minWidth: 140,
    px: 1.5,
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    bgcolor: "#fff",
    color: "#334155",
    fontWeight: 700,
  },
  primaryButton: {
    borderRadius: "12px",
    textTransform: "none",
    fontWeight: 800,
    bgcolor: "#1976d2",
    "&:hover": { bgcolor: "#1565c0" },
  },
  toolButton: { width: 42, height: 42, border: "2px solid #e2e8f0", borderRadius: "12px", color: "#475569" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", minWidth: 940, borderCollapse: "collapse" },
  th: { px: 2, py: 1.75, bgcolor: "#f8fafc", color: "#546e7a", fontSize: 12, fontWeight: 800, textAlign: "left", textTransform: "uppercase" },
  tr: { "&:hover": { bgcolor: "#f8fafc" } },
  td: { px: 2, py: 1.8, borderTop: "1px solid #f1f5f9", color: "#334155", fontSize: 14 },
  branchCell: { display: "flex", alignItems: "center", gap: 1.5 },
  branchIcon: { width: 42, height: 42, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  branchIconDefault: { bgcolor: "#e3f2fd", color: "#1976d2" },
  branchIconActive: { bgcolor: "#e8f5e9", color: "#2e7d32" },
  branchIconInactive: { bgcolor: "#ffebee", color: "#c62828" },
  branchNameRow: { display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" },
  branchName: { color: "#263238", fontSize: 14, fontWeight: 800 },
  branchAddress: { color: "#64748b", fontSize: 12, mt: 0.25, maxWidth: 360 },
  defaultChip: { height: 20, bgcolor: "#e3f2fd", color: "#1976d2", fontSize: 11, fontWeight: 800 },
  codeChip: { height: 24, bgcolor: "#eef2ff", color: "#2563eb", fontWeight: 800 },
  contactStack: { display: "flex", flexDirection: "column", gap: 0.75 },
  contactLine: { display: "flex", alignItems: "center", gap: 0.75, color: "#334155", fontSize: 13 },
  contactIcon: { fontSize: 15, color: "#1976d2" },
  employeeCell: { display: "flex", alignItems: "center", gap: 0.75, color: "#7c3aed", fontSize: 13, fontWeight: 800 },
  activeChip: { height: 24, bgcolor: "#dcfce7", color: "#15803d", fontWeight: 800, cursor: "pointer" },
  inactiveChip: { height: 24, bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 800, cursor: "pointer" },
  actions: { display: "flex", gap: 0.75 },
  actionButton: { border: "1px solid #e2e8f0", borderRadius: "10px", color: "#334155" },
  deleteButton: { border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626" },
  emptyCell: { py: 8, textAlign: "center", borderTop: "1px solid #f1f5f9" },
  loadingState: { display: "flex", justifyContent: "center", alignItems: "center", py: 8 },
  dialogPaper: { borderRadius: "16px" },
  dialogTitle: { bgcolor: "#1976d2", color: "#fff", fontWeight: 800 },
};

export default BranchManagement;
