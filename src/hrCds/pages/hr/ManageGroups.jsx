import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
} from "@mui/material";
import { FiEdit2, FiTrash2, FiPlus, FiUsers } from "react-icons/fi";
import axiosInstance from "../../../utils/axiosConfig";
import "./ManageGroups.css";

const ManageGroups = () => {
  const navigate = useNavigate();

  // States
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    members: [],
  });

  // API call helper
  const apiCall = async (method, url, data = null, config = {}) => {
    try {
      const token = localStorage.getItem("token");
      console.log(`API Call: [${method.toUpperCase()}] ${url}`);
      
      const response = await axiosInstance({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          ...config.headers,
        },
        ...config,
      });
      
      console.log(`API Response: [${method.toUpperCase()}] ${url}`, response.data);
      return response;
    } catch (error) {
      console.error(`API Error [${method.toUpperCase()} ${url}]:`, error.response?.data || error.message);
      throw error;
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      console.log("Fetching groups...");
      const response = await apiCall("get", "/groups");
      console.log("Groups fetched successfully:", response.data);
      setGroups(response.data.groups || response.data || []);
    } catch (error) {
      console.error("Failed to fetch groups:", error.message);
      // Don't redirect on API errors, just show snackbar
      showSnackbar("Failed to fetch groups", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from company
  const fetchUsers = async () => {
    try {
      console.log("Fetching users...");
      const response = await apiCall("get", "/users/company");
      console.log("Users fetched successfully:", response.data);
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error.message);
      // Don't redirect on API errors, just show snackbar
      showSnackbar("Failed to fetch users", "error");
    }
  };

  // Initialize data
  useEffect(() => {
    console.log("ManageGroups page mounted");
    
    // ProtectedRoute already checks authentication, just fetch data
    console.log("Fetching groups and users");
    fetchGroups();
    fetchUsers();
  }, []);

  // Show snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Open dialog for create/edit
  const handleOpenDialog = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name || "",
        description: group.description || "",
        members: group.members || [],
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: "",
        description: "",
        members: [],
      });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGroup(null);
    setFormData({
      name: "",
      description: "",
      members: [],
    });
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle member selection
  const toggleMember = (userId) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  // Save group
  const handleSaveGroup = async () => {
    if (!formData.name.trim()) {
      showSnackbar("Group name is required", "error");
      return;
    }

    try {
      if (editingGroup) {
        // Update group
        await apiCall("put", `/groups/${editingGroup._id}`, formData);
        showSnackbar("Group updated successfully", "success");
      } else {
        // Create group
        await apiCall("post", "/groups", formData);
        showSnackbar("Group created successfully", "success");
      }
      handleCloseDialog();
      fetchGroups();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Failed to save group",
        "error"
      );
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        await apiCall("delete", `/groups/${groupId}`);
        showSnackbar("Group deleted successfully", "success");
        fetchGroups();
      } catch (error) {
        showSnackbar("Failed to delete group", "error");
      }
    }
  };

  // Get user name by ID
  const getUserName = (userId) => {
    const user = users.find((u) => u._id === userId || u.id === userId);
    return user ? user.name : "Unknown";
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="manage-groups-container">
      <Box className="manage-groups-header">
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Manage Groups
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FiPlus />}
          onClick={() => handleOpenDialog()}
        >
          Create Group
        </Button>
      </Box>

      {/* Groups Table */}
      <TableContainer component={Paper} className="manage-groups-table">
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 600 }}>Group Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Members</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: "center", py: 3 }}>
                  <Typography color="textSecondary">
                    No groups found. Create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{group.name}</TableCell>
                  <TableCell>{group.description || "—"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {group.members && group.members.length > 0 ? (
                        group.members.slice(0, 2).map((memberId) => (
                          <Chip
                            key={memberId}
                            label={getUserName(memberId)}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No members
                        </Typography>
                      )}
                      {group.members && group.members.length > 2 && (
                        <Chip
                          label={`+${group.members.length - 2} more`}
                          size="small"
                          variant="filled"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(group)}
                        color="primary"
                      >
                        <FiEdit2 />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteGroup(group._id)}
                        color="error"
                      >
                        <FiTrash2 />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGroup ? "Edit Group" : "Create New Group"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Group Name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            margin="normal"
            multiline
            rows={3}
          />

          {/* Members Selection */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Select Members
            </Typography>
            <Box
              sx={{
                border: "1px solid #ddd",
                borderRadius: 1,
                p: 2,
                maxHeight: 250,
                overflowY: "auto",
              }}
            >
              {users.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No users available
                </Typography>
              ) : (
                users.map((user) => (
                  <Box
                    key={user._id || user.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 1,
                      mb: 1,
                      backgroundColor: formData.members.includes(
                        user._id || user.id
                      )
                        ? "#e3f2fd"
                        : "transparent",
                      borderRadius: 1,
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                    onClick={() => toggleMember(user._id || user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.members.includes(
                        user._id || user.id
                      )}
                      onChange={() => toggleMember(user._id || user.id)}
                      style={{ marginRight: 10, cursor: "pointer" }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.companyRole || user.role}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveGroup}
            variant="contained"
            color="primary"
          >
            {editingGroup ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageGroups;
