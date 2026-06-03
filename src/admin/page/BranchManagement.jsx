import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosConfig";
import Swal from "sweetalert2";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Paper,
  InputBase,
  CircularProgress,
  Zoom,
  Fade,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BranchIcon,
  Phone as PhoneIcon,
  LocationOn as AddressIcon,
  Star as DefaultIcon,
  ToggleOn as ActiveIcon,
  ToggleOff as InactiveIcon,
} from "@mui/icons-material";

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyId, setCompanyId] = useState("");
  
  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    branchCode: "",
    address: "",
    phone: "",
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch company ID from localstorage
    try {
      const companyStr = localStorage.getItem("company");
      if (companyStr) {
        const companyObj = JSON.parse(companyStr);
        if (companyObj && companyObj._id) {
          setCompanyId(companyObj._id);
          fetchBranches(companyObj._id);
        }
      }
    } catch (err) {
      console.error("Error reading company from storage:", err);
      setLoading(false);
    }
  }, []);

  const fetchBranches = async (cId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/branches/company/${cId}`);
      if (response.data && response.data.success) {
        setBranches(response.data.branches || []);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toastAlert("error", "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

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

  // Auto-generate short branch code
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => {
      const updates = { ...prev, name };
      
      // Auto generate code only if in add mode and code hasn't been manually typed yet
      if (!isEditMode && (!prev.branchCode || prev.branchCode === prev.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase())) {
        updates.branchCode = name
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 3)
          .toUpperCase();
      }
      return updates;
    });
  };

  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setSelectedBranchId(null);
    setFormData({
      name: "",
      branchCode: "",
      address: "",
      phone: "",
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (branch) => {
    setIsEditMode(true);
    setSelectedBranchId(branch._id);
    setFormData({
      name: branch.name,
      branchCode: branch.branchCode,
      address: branch.address || "",
      phone: branch.phone || "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: "",
      branchCode: "",
      address: "",
      phone: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.branchCode.trim()) {
      toastAlert("warning", "Name and Branch Code are required");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode) {
        // Update Branch
        const response = await axiosInstance.put(`/branches/${selectedBranchId}`, {
          name: formData.name,
          branchCode: formData.branchCode,
          address: formData.address,
          phone: formData.phone,
        });

        if (response.data && response.data.success) {
          toastAlert("success", "Branch updated successfully 🎉");
          handleCloseDialog();
          fetchBranches(companyId);
        }
      } else {
        // Create Branch
        const response = await axiosInstance.post("/branches", {
          name: formData.name,
          branchCode: formData.branchCode,
          companyId,
          address: formData.address,
          phone: formData.phone,
        });

        if (response.data && response.data.success) {
          toastAlert("success", "Branch added successfully 🎉");
          handleCloseDialog();
          fetchBranches(companyId);
        }
      }
    } catch (error) {
      console.error("Submit branch error:", error);
      const msg = error.response?.data?.message || "Failed to save branch";
      Swal.fire("Error", msg, "error");
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

      if (response.data && response.data.success) {
        toastAlert(
          "success",
          `Branch ${nextActiveState ? "activated" : "deactivated"} successfully`
        );
        fetchBranches(companyId);
      }
    } catch (error) {
      console.error("Toggle branch error:", error);
      const msg = error.response?.data?.message || "Failed to update status";
      toastAlert("error", msg);
    }
  };

  const handleDeleteBranch = (branch) => {
    if (branch.isDefault) {
      Swal.fire("Restricted", "Default branch (Head Office) cannot be deleted.", "warning");
      return;
    }

    Swal.fire({
      title: `Delete Branch: ${branch.name}?`,
      text: "You won't be able to revert this! Users and departments associated with this branch will prevent deletion.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axiosInstance.delete(`/branches/${branch._id}`);
          if (response.data && response.data.success) {
            Swal.fire("Deleted!", "Branch has been deleted.", "success");
            fetchBranches(companyId);
          }
        } catch (error) {
          console.error("Delete branch error:", error);
          const msg = error.response?.data?.message || "Failed to delete branch";
          Swal.fire("Restriction", msg, "error");
        }
      }
    });
  };

  // Filter list by search query
  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* 🚀 Header section with Premium design */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: "16px",
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          color: "white",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BranchIcon fontSize="large" /> Manage Branches
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            Create and manage company branches. Add branch codes to customize login urls and separate departments.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{
            bgcolor: "white",
            color: "#1e3c72",
            fontWeight: "bold",
            borderRadius: "8px",
            textTransform: "none",
            boxShadow: "0 4px 15px rgba(255,255,255,0.2)",
            "&:hover": {
              bgcolor: "#f1f1f1",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(255,255,255,0.3)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          Add New Branch
        </Button>
      </Box>

      {/* 🔍 Search bar with Glassmorphic design */}
      <Paper
        elevation={0}
        sx={{
          p: "4px 8px",
          display: "flex",
          alignItems: "center",
          width: { xs: "100%", sm: 400 },
          mb: 4,
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <IconButton sx={{ p: "10px" }} aria-label="search">
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1, fontSize: "0.95rem" }}
          placeholder="Search by branch name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Paper>

      {/* ⏳ Loader */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
          <CircularProgress size={50} sx={{ color: "#1e3c72" }} />
        </Box>
      ) : filteredBranches.length === 0 ? (
        // Empty State
        <Fade in={true}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              textAlign: "center",
              bgcolor: "rgba(0,0,0,0.02)",
              borderRadius: "16px",
              p: 4,
            }}
          >
            <BranchIcon sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" color="text.secondary">
              No Branches Found
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1, maxWidth: 300 }}>
              {searchQuery ? "Try refining your search query." : "Click 'Add New Branch' to create your first company branch."}
            </Typography>
          </Box>
        </Fade>
      ) : (
        // 🗂️ Branch Cards Grid
        <Grid container spacing={3}>
          {filteredBranches.map((branch, index) => (
            <Grid item xs={12} sm={6} md={4} key={branch._id}>
              <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                <Card
                  sx={{
                    borderRadius: "16px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    position: "relative",
                    overflow: "visible",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                      "& .settings-overlay": { opacity: 1 },
                    },
                    bgcolor: branch.isActive ? "white" : "rgba(0,0,0,0.02)",
                  }}
                >
                  {/* Default (Head Office) Badge */}
                  {branch.isDefault && (
                    <Chip
                      icon={<DefaultIcon sx={{ color: "#ffd700 !important" }} />}
                      label="Head Office"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: -12,
                        left: 20,
                        zIndex: 2,
                        bgcolor: "#1e3c72",
                        color: "white",
                        fontWeight: "bold",
                        boxShadow: "0 4px 10px rgba(30,60,114,0.3)",
                        "& .MuiChip-icon": { color: "#ffd700" },
                      }}
                    />
                  )}

                  <CardContent sx={{ pt: branch.isDefault ? 3 : 2, pb: "16px !important" }}>
                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: branch.isActive ? "#1e3c72" : "text.secondary" }}>
                          {branch.name}
                        </Typography>
                        <Chip
                          label={branch.branchCode}
                          size="small"
                          sx={{
                            mt: 0.5,
                            fontWeight: "700",
                            bgcolor: "rgba(30, 60, 114, 0.1)",
                            color: "#1e3c72",
                          }}
                        />
                      </Box>
                      
                      {/* Active Status Toggle */}
                      <Tooltip title={branch.isDefault ? "HQ is always Active" : branch.isActive ? "Deactivate Branch" : "Activate Branch"}>
                        <IconButton
                          onClick={() => handleToggleStatus(branch)}
                          disabled={branch.isDefault}
                          sx={{
                            color: branch.isActive ? "#2e7d32" : "#d32f2f",
                          }}
                        >
                          {branch.isActive ? <ActiveIcon fontSize="large" /> : <InactiveIcon fontSize="large" />}
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Stats & Info */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, my: 2 }}>
                      {branch.phone && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                          <PhoneIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">{branch.phone}</Typography>
                        </Box>
                      )}
                      
                      {branch.address && (
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, color: "text.secondary" }}>
                          <AddressIcon sx={{ fontSize: 18, mt: 0.2 }} />
                          <Typography variant="body2" sx={{ lineBreak: "anywhere" }}>
                            {branch.address}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Footer Actions */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                        pt: 1.5,
                        mt: 2,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: "600", color: "#1e3c72" }}>
                        👤 {branch.totalUsers || 0} Active Users
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Edit Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(branch)}
                            sx={{
                              bgcolor: "rgba(0,0,0,0.03)",
                              color: "#1976d2",
                              "&:hover": { bgcolor: "rgba(25, 118, 210, 0.1)" },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {!branch.isDefault && (
                          <Tooltip title="Delete Branch">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteBranch(branch)}
                              sx={{
                                bgcolor: "rgba(0,0,0,0.03)",
                                color: "#d32f2f",
                                "&:hover": { bgcolor: "rgba(211, 47, 47, 0.1)" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 📝 Dialog Modal for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth borderRadius="16px">
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {isEditMode ? "Edit Branch Details" : "Create New Branch"}
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  placeholder="e.g. Noida Branch"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Branch Login Code"
                  placeholder="e.g. NOIDA"
                  value={formData.branchCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, branchCode: e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() }))
                  }
                  required
                  disabled={isEditMode && formData.branchCode === `${branches.find(b => b._id === selectedBranchId)?.companyCode}-HQ`}
                  helperText="Appended to company code for login (e.g. TCS-NOIDA)"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  placeholder="Branch address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  multiline
                  rows={3}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
            <Button onClick={handleCloseDialog} sx={{ color: "text.secondary", textTransform: "none", fontWeight: "bold" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                bgcolor: "#1e3c72",
                textTransform: "none",
                fontWeight: "bold",
                "&:hover": { bgcolor: "#2a5298" },
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : isEditMode ? "Save Changes" : "Create Branch"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default BranchManagement;
