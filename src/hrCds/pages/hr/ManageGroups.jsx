import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/useAuth";
import {
  Box,
  Button,
  Checkbox,
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
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUsers,
  FiSearch,
  FiUserCheck,
  FiLayers,
} from "react-icons/fi";
import axiosInstance from "../../../utils/axiosConfig";
import "./ManageGroups.css";

const ManageGroups = () => {
  const { user } = useAuth();
  const companyId = user?.company?._id || user?.company;

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const apiCall = async (method, url, data = null, config = {}) => {
    try {
      const token = localStorage.getItem("token");

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

      return response;
    } catch (error) {
      console.error(
        `API Error [${method.toUpperCase()} ${url}]:`,
        error.response?.data || error.message
      );
      throw error;
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await apiCall("get", "/groups");
      setGroups(response.data.groups || response.data || []);
    } catch (error) {
      console.error("Failed to fetch groups:", error.message);
      showSnackbar("Failed to fetch groups", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = companyId
        ? `/users/company-users?companyId=${companyId}`
        : "/users/company-users";
      const response = await apiCall("get", url);

      let usersList = [];
      if (response.data) {
        usersList =
          response.data.users ||
          response.data.data ||
          response.data.message?.users ||
          response.data ||
          [];
      }

      if (companyId && Array.isArray(usersList)) {
        usersList = usersList.filter((item) => {
          const itemCompany = item.company?._id || item.company;
          return itemCompany?.toString() === companyId?.toString();
        });
      }

      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (error) {
      console.error("Failed to fetch users:", error.message);
      showSnackbar("Failed to fetch users", "error");
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const getEntityId = (entity) => {
    if (!entity) return "";
    return entity._id || entity.id || entity;
  };

  const handleOpenDialog = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name || "",
        description: group.description || "",
        members: Array.isArray(group.members)
          ? group.members.map((member) => getEntityId(member)).filter(Boolean)
          : [],
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGroup(null);
    setFormData({
      name: "",
      description: "",
      members: [],
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleMember = (userId) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  const handleSaveGroup = async () => {
    if (!formData.name.trim()) {
      showSnackbar("Group name is required", "error");
      return;
    }

    try {
      if (editingGroup) {
        await apiCall("put", `/groups/${editingGroup._id}`, formData);
        showSnackbar("Group updated successfully", "success");
      } else {
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

  const totalAssignedMembers = groups.reduce((total, group) => {
    return total + (Array.isArray(group.members) ? group.members.length : 0);
  }, 0);

  const groupsWithMembers = groups.filter((group) => {
    return Array.isArray(group.members) && group.members.length > 0;
  }).length;

  const filteredGroups = groups.filter((group) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return [group.name, group.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  if (loading) {
    return (
      <Box className="manage-groups-loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="manage-groups-container">
      <Box className="manage-groups-hero">
        <Box className="manage-groups-hero-copy">
          <Box className="manage-groups-hero-icon">
            <FiUsers />
          </Box>
          <Box>
            <Typography className="manage-groups-title" variant="h5">
              Manage Groups
            </Typography>
            <Typography className="manage-groups-subtitle" variant="body2">
              Create teams, assign users, and keep access organized.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FiPlus />}
          onClick={() => handleOpenDialog()}
          className="manage-groups-create-btn"
        >
          Create Group
        </Button>
      </Box>

      <Box className="manage-groups-stats">
        <Box className="manage-groups-stat-card">
          <Box className="manage-groups-stat-icon groups">
            <FiLayers />
          </Box>
          <Box>
            <Typography className="manage-groups-stat-value">
              {groups.length}
            </Typography>
            <Typography className="manage-groups-stat-label">
              Total Groups
            </Typography>
          </Box>
        </Box>
        <Box className="manage-groups-stat-card">
          <Box className="manage-groups-stat-icon members">
            <FiUserCheck />
          </Box>
          <Box>
            <Typography className="manage-groups-stat-value">
              {totalAssignedMembers}
            </Typography>
            <Typography className="manage-groups-stat-label">
              Assigned Members
            </Typography>
          </Box>
        </Box>
        <Box className="manage-groups-stat-card">
          <Box className="manage-groups-stat-icon users">
            <FiUsers />
          </Box>
          <Box>
            <Typography className="manage-groups-stat-value">
              {users.length}
            </Typography>
            <Typography className="manage-groups-stat-label">
              Available Users
            </Typography>
          </Box>
        </Box>
        <Box className="manage-groups-stat-card">
          <Box className="manage-groups-stat-icon active">
            <FiUserCheck />
          </Box>
          <Box>
            <Typography className="manage-groups-stat-value">
              {groupsWithMembers}
            </Typography>
            <Typography className="manage-groups-stat-label">
              Active Groups
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="manage-groups-toolbar">
        <Box className="manage-groups-search">
          <FiSearch />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search groups"
          />
        </Box>
        <Typography className="manage-groups-result-count">
          {filteredGroups.length} of {groups.length} groups
        </Typography>
      </Box>

      <TableContainer component={Paper} className="manage-groups-table">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Group Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Members</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box className="manage-groups-empty">
                    <FiUsers />
                    <Typography className="manage-groups-empty-title">
                      No groups found
                    </Typography>
                    <Typography className="manage-groups-empty-text">
                      Create a group to organize users by team or department.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box className="manage-groups-empty">
                    <FiSearch />
                    <Typography className="manage-groups-empty-title">
                      No matching groups
                    </Typography>
                    <Typography className="manage-groups-empty-text">
                      Try searching by a different group name or description.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => {
                const memberCount = Array.isArray(group.members)
                  ? group.members.length
                  : 0;

                return (
                  <TableRow key={group._id} hover>
                    <TableCell>
                      <Box className="manage-groups-name-cell">
                        <Box className="manage-groups-avatar">
                          <FiUsers />
                        </Box>
                        <Typography className="manage-groups-name">
                          {group.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography className="manage-groups-description">
                        {group.description || "No description"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="manage-groups-member-pill">
                        {memberCount} member{memberCount === 1 ? "" : "s"}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box className="manage-groups-actions">
                        <Tooltip title="Edit group">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(group)}
                            className="manage-groups-action-btn manage-groups-edit-btn"
                          >
                            <FiEdit2 />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete group">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteGroup(group._id)}
                            className="manage-groups-action-btn manage-groups-delete-btn"
                          >
                            <FiTrash2 />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: "manage-groups-dialog" }}
      >
        <DialogTitle className="manage-groups-dialog-title">
          {editingGroup ? "Edit Group" : "Create New Group"}
        </DialogTitle>
        <DialogContent className="manage-groups-dialog-content">
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

          <Box className="manage-groups-members-section">
            <Typography className="manage-groups-members-title">
              Select Members
            </Typography>
            <Box className="manage-groups-members-list">
              {users.length === 0 ? (
                <Typography className="manage-groups-no-users">
                  No users available
                </Typography>
              ) : (
                users.map((user) => {
                  const userId = user._id || user.id;
                  const isSelected = formData.members.includes(userId);

                  return (
                    <Box
                      key={userId}
                      className={`manage-groups-member-row${
                        isSelected ? " selected" : ""
                      }`}
                      onClick={() => toggleMember(userId)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggleMember(userId)}
                        size="small"
                      />
                      <Box className="manage-groups-user-copy">
                        <Typography className="manage-groups-user-name">
                          {user.name}
                        </Typography>
                        <Typography className="manage-groups-user-role">
                          {user.companyRole || user.role || "User"}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="manage-groups-dialog-actions">
          <Button onClick={handleCloseDialog} className="manage-groups-cancel-btn">
            Cancel
          </Button>
          <Button
            onClick={handleSaveGroup}
            variant="contained"
            color="primary"
            className="manage-groups-save-btn"
          >
            {editingGroup ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

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
