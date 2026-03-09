import React, { useEffect, useState, useMemo } from "react";
import axios from "../../utils/axiosConfig";
import "../Css/Alerts.css";
import CIISLoader from '../../Loader/CIISLoader'; // ✅ Import CIISLoader

// Icons as React components
const FiAlertCircle = () => <span className="Alerts-icon">⚠️</span>;
const FiAlertTriangle = () => <span className="Alerts-icon">⚠️</span>;
const FiInfo = () => <span className="Alerts-icon">ℹ️</span>;
const FiPlus = () => <span className="Alerts-icon">➕</span>;
const FiEdit = () => <span className="Alerts-icon">✏️</span>;
const FiTrash2 = () => <span className="Alerts-icon">🗑️</span>;
const FiBell = () => <span className="Alerts-icon">🔔</span>;
const FiClock = () => <span className="Alerts-icon">⏰</span>;
const FiTrendingUp = () => <span className="Alerts-icon">📈</span>;
const FiUsers = () => <span className="Alerts-icon">👥</span>;
const FiUser = () => <span className="Alerts-icon">👤</span>;
const FiSearch = () => <span className="Alerts-icon">🔍</span>;
const FiEye = () => <span className="Alerts-icon">👁️</span>;
const FiEyeOff = () => <span className="Alerts-icon">🚫</span>;
const FiFilter = () => <span className="Alerts-icon">🔧</span>;
const FiGlobe = () => <span className="Alerts-icon">🌍</span>;
const FiUserCheck = () => <span className="Alerts-icon">✅👤</span>;
const FiChevronDown = () => <span className="Alerts-icon">⌄</span>;
const FiChevronUp = () => <span className="Alerts-icon">⌃</span>;
const FiRefreshCw = () => <span className="Alerts-icon">🔄</span>;

// Custom Components
const Badge = ({ children, badgeContent, color = "error", size = "small" }) => (
  <div className="Alerts-badge">
    {children}
    {badgeContent > 0 && (
      <span className={`Alerts-badge-content Alerts-badge-${color}`}>
        {badgeContent > 99 ? "99+" : badgeContent}
      </span>
    )}
  </div>
);

const Chip = ({ label, color, icon, size = "medium", variant = "default", onClick, onDelete }) => (
  <span 
    className={`Alerts-chip Alerts-chip-${size} Alerts-chip-${variant}`}
    style={{ 
      backgroundColor: variant === "outlined" ? "transparent" : color ? `${color}20` : undefined,
      color: color || undefined,
      borderColor: color ? `${color}30` : undefined
    }}
    onClick={onClick}
  >
    {icon && <span className="Alerts-chip-icon">{icon}</span>}
    {label}
    {onDelete && (
      <button className="Alerts-chip-delete" onClick={onDelete}>
        ×
      </button>
    )}
  </span>
);

const Avatar = ({ children, color, size = "medium" }) => (
  <div 
    className={`Alerts-avatar Alerts-avatar-${size}`}
    style={{ 
      backgroundColor: color ? `${color}20` : undefined,
      color: color || undefined
    }}
  >
    {children}
  </div>
);

const Tooltip = ({ title, children }) => (
  <div className="Alerts-tooltip">
    {children}
    <span className="Alerts-tooltip-text">{title}</span>
  </div>
);

const CircularProgress = ({ size = 40 }) => (
  <div className="Alerts-circular-progress" style={{ width: size, height: size }}>
    <div className="Alerts-circular-progress-inner" />
  </div>
);

const LinearProgress = ({ value }) => (
  <div className="Alerts-linear-progress">
    <div 
      className="Alerts-linear-progress-bar" 
      style={{ width: `${value}%` }}
    />
  </div>
);

const Checkbox = ({ checked, onChange }) => (
  <label className="Alerts-checkbox">
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={onChange} 
      className="Alerts-checkbox-input"
    />
    <span className="Alerts-checkbox-checkmark" />
  </label>
);

/* -----------------------------------
 🔹 Component
------------------------------------ */
const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "info",
    message: "",
    assignedUsers: [],
    assignedGroups: [],
  });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
    unread: 0,
  });
  const [filterType, setFilterType] = useState("all");
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const token = localStorage.getItem("token");
  const canManage = ["admin", "hr", "manager"].includes(role?.toLowerCase());
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  /* -----------------------------------
    🔹 Helper Functions
  ------------------------------------ */
  const getUserGroups = async (userId) => {
    try {
      const response = await axios.get(`/users/${userId}/groups`, headers);
      if (response.data) {
        const groups = response.data.groups || response.data.data || response.data || [];
        setUserGroups(groups);
        localStorage.setItem("userGroups", JSON.stringify(groups));
        return groups;
      }
    } catch (error) {
      console.error("Error fetching user groups:", error);
      // Try to get from localStorage as fallback
      const storedGroups = localStorage.getItem("userGroups");
      if (storedGroups) {
        try {
          const parsed = JSON.parse(storedGroups);
          setUserGroups(parsed);
          return parsed;
        } catch (e) {
          console.error("Error parsing stored groups:", e);
        }
      }
    }
    return [];
  };

  /* -----------------------------------
    🔹 Fetch Data
  ------------------------------------ */
  const fetchData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const [alertsRes, usersRes, groupsRes] = await Promise.all([
        axios.get("/alerts", headers),
        axios.get("/task/assignable-users", headers).catch(() => ({ data: [] })),
        axios.get("/groups", headers).catch(() => ({ data: [] })),
      ]);
      
      const fetchedAlerts = alertsRes.data?.alerts || alertsRes.data?.data || alertsRes.data || [];
      const fetchedUsers = usersRes.data?.users || usersRes.data?.data || usersRes.data || [];
      const fetchedGroups = groupsRes.data?.groups || groupsRes.data?.data || groupsRes.data || [];

      setAlerts(fetchedAlerts);
      setUsers(fetchedUsers);
      setGroups(fetchedGroups);
      calculateStats(fetchedAlerts);
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({
        message: error.response?.data?.message || "Failed to load alerts",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPageLoading(false);
    }
  };

  const calculateStats = (data) => {
    const currentUserId = localStorage.getItem("userId");
    
    // Only count alerts that are visible to the current user
    const visibleAlerts = data.filter(alert => {
      const hasAssignments = alert.assignedUsers?.length > 0 || alert.assignedGroups?.length > 0;
      if (!hasAssignments) return true;
      
      const isDirectlyAssigned = alert.assignedUsers?.some(
        user => (user._id || user) === currentUserId
      );
      
      const isInAssignedGroup = alert.assignedGroups?.some(group => {
        const groupId = group._id || group;
        return userGroups.includes(groupId);
      });
      
      return isDirectlyAssigned || isInAssignedGroup;
    });

    const info = visibleAlerts.filter((a) => a.type === "info").length;
    const warning = visibleAlerts.filter((a) => a.type === "warning").length;
    const error = visibleAlerts.filter((a) => a.type === "error").length;
    const unread = visibleAlerts.filter((a) => !a.readBy?.includes(currentUserId)).length;
    
    setStats({
      total: visibleAlerts.length,
      info,
      warning,
      error,
      unread,
    });
  };

  // Load data with page loader
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
          const userRole = parsed.role || parsed.user?.role || "";
          setRole(userRole.toLowerCase());
          const userId = parsed._id || parsed.user?._id || "";
          if (userId) {
            localStorage.setItem("userId", userId);
            // Fetch user's groups
            await getUserGroups(userId);
          }
        } catch (error) {
          console.error("Error parsing user:", error);
        }
      }
      await fetchData();
    };
    
    loadData();
  }, []);

  // Recalculate stats when userGroups change
  useEffect(() => {
    if (alerts.length > 0) {
      calculateStats(alerts);
    }
  }, [userGroups, alerts]);

  /* -----------------------------------
    🔹 Handlers
  ------------------------------------ */
  const handleOpen = (alert = null) => {
    if (alert) {
      setEditId(alert._id);
      setForm({
        type: alert.type,
        message: alert.message,
        assignedUsers: alert.assignedUsers?.map(u => u._id || u) || [],
        assignedGroups: alert.assignedGroups?.map(g => g._id || g) || [],
      });
    } else {
      setEditId(null);
      setForm({
        type: "info",
        message: "",
        assignedUsers: [],
        assignedGroups: [],
      });
    }
    setUserSearch("");
    setGroupSearch("");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUserSelect = (userId) => {
    setForm(prev => {
      const isSelected = prev.assignedUsers.includes(userId);
      if (isSelected) {
        return { ...prev, assignedUsers: prev.assignedUsers.filter(id => id !== userId) };
      } else {
        return { ...prev, assignedUsers: [...prev.assignedUsers, userId] };
      }
    });
  };

  const handleGroupSelect = (groupId) => {
    setForm(prev => {
      const isSelected = prev.assignedGroups.includes(groupId);
      if (isSelected) {
        return { ...prev, assignedGroups: prev.assignedGroups.filter(id => id !== groupId) };
      } else {
        return { ...prev, assignedGroups: [...prev.assignedGroups, groupId] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!canManage)
      return setNotification({ message: "Unauthorized", type: "error" });
    if (!form.message.trim())
      return setNotification({ message: "Message required", type: "error" });

    try {
      const payload = {
        ...form,
        message: form.message.trim(),
      };

      if (editId) {
        const res = await axios.put(`/alerts/${editId}`, payload, headers);
        setAlerts((prev) =>
          prev.map((a) => (a._id === editId ? res.data.alert : a))
        );
        setNotification({ message: "Alert updated successfully", type: "success" });
      } else {
        const res = await axios.post("/alerts", payload, headers);
        setAlerts((prev) => [res.data.alert, ...prev]);
        setNotification({ message: "Alert created successfully", type: "success" });
      }
      calculateStats(alerts);
      setOpen(false);
      setTimeout(() => fetchData(), 500);
    } catch (error) {
      console.error("Error saving alert:", error);
      setNotification({ 
        message: error.response?.data?.message || "Error saving alert", 
        type: "error" 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!canManage)
      return setNotification({ message: "Unauthorized", type: "error" });
    
    if (!window.confirm("Are you sure you want to delete this alert?")) return;
    
    try {
      await axios.delete(`/alerts/${id}`, headers);
      const updated = alerts.filter((a) => a._id !== id);
      setAlerts(updated);
      calculateStats(updated);
      setNotification({ message: "Alert deleted successfully", type: "success" });
    } catch (error) {
      setNotification({ 
        message: error.response?.data?.message || "Delete failed", 
        type: "error" 
      });
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      
      await axios.patch(`/alerts/${alertId}/read`, {}, headers);
      
      setAlerts(prev => prev.map(alert => {
        if (alert._id === alertId) {
          return {
            ...alert,
            readBy: [...(alert.readBy || []), { _id: userId }]
          };
        }
        return alert;
      }));
      
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      
      setNotification({ 
        message: "Marked as read", 
        type: "success" 
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  /* -----------------------------------
    🔹 Filtered Data
  ------------------------------------- */
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;
    const currentUserId = localStorage.getItem("userId");
    
    // First, filter by assigned to current user
    filtered = filtered.filter(alert => {
      // Check if alert has any assignments
      const hasAssignments = alert.assignedUsers?.length > 0 || alert.assignedGroups?.length > 0;
      
      // If no assignments, alert is for all users (show it)
      if (!hasAssignments) return true;
      
      // Check if user is directly assigned
      const isDirectlyAssigned = alert.assignedUsers?.some(
        user => (user._id || user) === currentUserId
      );
      
      // Check if user belongs to any assigned groups
      const isInAssignedGroup = alert.assignedGroups?.some(group => {
        const groupId = group._id || group;
        return userGroups.includes(groupId);
      });
      
      return isDirectlyAssigned || isInAssignedGroup;
    });
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.message?.toLowerCase().includes(query) ||
        alert.type?.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.type === filterType);
    }
    
    // Apply view mode filter
    if (viewMode === "unread") {
      filtered = filtered.filter(alert => 
        !alert.readBy?.some(user => (user._id || user) === currentUserId)
      );
    }
    
    return filtered;
  }, [alerts, searchQuery, filterType, viewMode, userGroups]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const query = userSearch.toLowerCase();
    return users.filter(user => 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  }, [users, userSearch]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch) return groups;
    const query = groupSearch.toLowerCase();
    return groups.filter(group => 
      group.name?.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    );
  }, [groups, groupSearch]);

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getUserNameById = (userId) => {
    if (!userId) return "System";
    if (typeof userId === 'object' && userId._id) {
      return userId.name || userId.email || "Unknown User";
    }
    const user = users.find(u => u._id === userId);
    return user ? user.name || user.email : "Unknown User";
  };

  const getGroupNameById = (groupId) => {
    if (typeof groupId === 'object' && groupId._id) {
      return groupId.name || "Unknown Group";
    }
    const group = groups.find(g => g._id === groupId);
    return group ? group.name : "Unknown Group";
  };

  const getCreatorName = (alert) => {
    // Try different possible field names for the creator
    const creator = alert.createdBy || alert.assignedBy || alert.author || alert.creator;
    
    if (!creator) return "System";
    
    if (typeof creator === 'object') {
      return creator.name || creator.email || "Unknown User";
    }
    
    // If it's an ID, try to find the user
    const user = users.find(u => u._id === creator);
    return user ? user.name || user.email : "Unknown User";
  };

  const isAlertUnread = (alert) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return false;
    return !alert.readBy?.some(user => (user._id || user) === userId);
  };

  const toggleAlertExpansion = (alertId) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  const getTypeColor = (type) => {
    switch(type) {
      case "info": return "#29B6F6";
      case "warning": return "#FFA726";
      case "error": return "#EF5350";
      default: return "#667eea";
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case "error": return "#EF5350";
      case "warning": return "#FFA726";
      case "success": return "#66BB6A";
      default: return "#667eea";
    }
  };

  // Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="Alerts-container">
      {/* Enhanced Header with Gradient */}
      <div className="Alerts-gradient-header">
        <div className="Alerts-header-content">
          <div className="Alerts-header-text">
            <h1 className="Alerts-title">System Alerts</h1>
            <p className="Alerts-subtitle">Real-time notifications & announcements</p>
          </div>
          <div className="Alerts-header-actions">
            <Tooltip title="Refresh">
              <button 
                className={`Alerts-icon-button Alerts-refresh-button ${refreshing ? 'Alerts-refreshing' : ''}`}
                onClick={fetchData} 
                disabled={refreshing}
              >
                <FiRefreshCw />
              </button>
            </Tooltip>
            {canManage && (
              <button
                className="Alerts-button Alerts-button-primary Alerts-new-alert-button"
                onClick={() => handleOpen()}
              >
                <FiPlus />
                New Alert
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats & Filters Section */}
      <div className="Alerts-stats-filters">
        {/* Search Bar */}
        <div className="Alerts-search-container">
          <div className="Alerts-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder="Search alerts by message or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="Alerts-search-input"
            />
            {searchQuery && (
              <button className="Alerts-search-clear" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="Alerts-view-mode-container">
          <div className="Alerts-view-mode-card">
            <span className="Alerts-view-mode-label">View:</span>
            <div className="Alerts-toggle-button-group">
              <button 
                className={`Alerts-toggle-button ${viewMode === 'all' ? 'Alerts-toggle-button-active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                <FiEye />
                <span>All</span>
              </button>
              <button 
                className={`Alerts-toggle-button ${viewMode === 'unread' ? 'Alerts-toggle-button-active' : ''}`}
                onClick={() => setViewMode('unread')}
              >
                <Badge badgeContent={stats.unread}>
                  <FiBell />
                </Badge>
                <span>Unread</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="Alerts-stats-grid">
          {[
            { 
              key: "total", 
              label: "My Alerts", 
              color: "#667eea", 
              icon: <FiBell />,
              value: stats.total,
              active: filterType === "all" && viewMode === "all"
            },
            { 
              key: "info", 
              label: "Information", 
              color: "#29B6F6", 
              icon: <FiInfo />,
              value: stats.info,
              active: filterType === "info"
            },
            { 
              key: "warning", 
              label: "Warnings", 
              color: "#FFA726", 
              icon: <FiAlertTriangle />,
              value: stats.warning,
              active: filterType === "warning"
            },
            { 
              key: "error", 
              label: "Errors", 
              color: "#EF5350", 
              icon: <FiAlertCircle />,
              value: stats.error,
              active: filterType === "error"
            },
          ]
          .map((s) => (
            <div 
              key={s.key} 
              className={`Alerts-stat-card ${s.active ? 'Alerts-stat-card-active' : ''}`}
              style={{ borderTopColor: s.color }}
              onClick={() => {
                setFilterType(s.key === "total" ? "all" : s.key);
                setViewMode("all");
              }}
            >
              <div className="Alerts-stat-content">
                <div className="Alerts-stat-text">
                  <span className="Alerts-stat-label">{s.label}</span>
                  <h3 className="Alerts-stat-value">{s.value}</h3>
                </div>
                <Avatar color={s.color}>
                  {s.icon}
                </Avatar>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="Alerts-list-container">
        <div className="Alerts-list-header">
          <div>
            <h2 className="Alerts-list-title">My Alerts ({filteredAlerts.length})</h2>
            <p className="Alerts-list-subtitle">
              {viewMode === 'unread' ? 'Showing unread alerts' : 'Showing all my alerts'}
            </p>
          </div>
          <Chip
            icon={<FiFilter />}
            label={`Filter: ${filterType === 'all' ? 'All Types' : filterType}`}
            onClick={() => setFilterType('all')}
            variant="outlined"
          />
        </div>

        <div className="Alerts-list">
          {filteredAlerts.length === 0 ? (
            <div className="Alerts-empty-state">
              <FiBell />
              <h3>No Alerts Found</h3>
              <p>
                {searchQuery ? 'Try a different search term' : 
                 viewMode === 'unread' ? 'You have no unread alerts' : 
                 'No alerts are assigned to you'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const assignedUsers = alert.assignedUsers || [];
              const assignedGroups = alert.assignedGroups || [];
              const unread = isAlertUnread(alert);
              const expanded = expandedAlert === alert._id;
              const typeColor = getTypeColor(alert.type);
              const creatorName = getCreatorName(alert);
              
              return (
                <div 
                  key={alert._id} 
                  className={`Alerts-alert-card ${unread ? 'Alerts-alert-unread' : ''}`}
                  style={{ borderLeftColor: typeColor }}
                >
                  <div className="Alerts-alert-content">
                    <div className="Alerts-alert-header">
                      <div className="Alerts-alert-meta">
                        <Chip
                          label={alert.type}
                          size="small"
                          style={{ 
                            backgroundColor: typeColor,
                            color: 'white'
                          }}
                        />
                        {unread && (
                          <Chip
                            size="small"
                            label="NEW"
                            color="#EF5350"
                          />
                        )}
                        <span className="Alerts-alert-date">
                          <FiClock />
                          {formatDate(alert.createdAt)}
                        </span>
                      </div>
                      
                      <div className="Alerts-alert-actions">
                        {unread && (
                          <Tooltip title="Mark as read">
                            <button
                              className="Alerts-icon-button Alerts-read-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(alert._id);
                              }}
                            >
                              <FiEye />
                            </button>
                          </Tooltip>
                        )}
                        {canManage && (
                          <>
                           
                            
                          </>
                        )}
                        
                      </div>
                    </div>

                    {/* Creator/Assigner Information */}
                    <div className="Alerts-creator-info">
                        <FiUserCheck />
                      <span className="Alerts-creator-name">
                        <strong>Created by:</strong> {creatorName}
                      </span>
                    </div>

                    <p className={`Alerts-alert-message ${unread ? 'Alerts-alert-message-unread' : ''}`}>
                      {alert.message}
                    </p>

                    {/* {(expanded || assignedUsers.length > 0 || assignedGroups.length > 0) && (
                      <div className="Alerts-alert-details">
                        <div className="Alerts-divider" />
                        <div className="Alerts-assignments">
                          <span className="Alerts-assignments-label">ASSIGNED TO:</span>
                          <div className="Alerts-assignments-list">
                            {assignedUsers.length > 0 ? (
                              assignedUsers.map((user, index) => (
                                <Chip
                                  key={index}
                                  icon={<FiUser />}
                                  label={getUserNameById(user)}
                                  size="small"
                                  style={{ 
                                    backgroundColor: '#667eea20',
                                    color: '#667eea',
                                    borderColor: '#667eea30'
                                  }}
                                />
                              ))
                            ) : (
                              <Chip
                                icon={<FiGlobe />}
                                label="All Users"
                                size="small"
                                style={{ 
                                  backgroundColor: '#667eea20',
                                  color: '#667eea',
                                  borderColor: '#667eea30'
                                }}
                              />
                            )}
                            
                            {assignedGroups.length > 0 && (
                              assignedGroups.map((group, index) => (
                                <Chip
                                  key={index}
                                  icon={<FiUsers />}
                                  label={getGroupNameById(group)}
                                  size="small"
                                  style={{ 
                                    backgroundColor: '#764ba220',
                                    color: '#764ba2',
                                    borderColor: '#764ba230'
                                  }}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )} */}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enhanced Dialog */}
      {open && (
        <div className="Alerts-modal">
          <div className="Alerts-modal-backdrop" onClick={handleClose} />
          <div className="Alerts-modal-content Alerts-modal-md">
            <div className="Alerts-modal-header Alerts-modal-header-primary">
              <div className="Alerts-modal-title">
                <h2>{editId ? "✏️ Edit Alert" : "🆕 Create New Alert"}</h2>
                <p>{editId ? "Update your alert details" : "Create a new system alert"}</p>
              </div>
            </div>
            
            <div className="Alerts-modal-body">
              <div className="Alerts-form">
                {/* Alert Type Selection */}
                <div className="Alerts-form-group">
                  <label>Alert Type *</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="Alerts-select"
                  >
                    <option value="info">
                      Information - General updates and announcements
                    </option>
                    <option value="warning">
                      Warning - Important notices requiring attention
                    </option>
                    <option value="error">
                      Error / Critical - Urgent issues requiring immediate action
                    </option>
                  </select>
                </div>
                
                {/* Message */}
                <div className="Alerts-form-group">
                  <label>Alert Message *</label>
                  <textarea
                    name="message"
                    rows="4"
                    value={form.message}
                    onChange={handleChange}
                    className="Alerts-textarea"
                    placeholder="Enter your alert message here..."
                    required
                  />
                </div>

                {/* Assign Users Section */}
                <div className="Alerts-assign-section">
                  <h3 className="Alerts-assign-title">📋 Assign Users</h3>
                  <p className="Alerts-assign-subtitle">
                    Select specific users or leave empty for all users
                  </p>
                  
                  {/* User Search */}
                  <div className="Alerts-search-field">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or role..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="Alerts-search-input"
                    />
                  </div>
                  
                  {/* Selected Users Chips */}
                  {form.assignedUsers.length > 0 && (
                    <div className="Alerts-selected-chips">
                      {form.assignedUsers.map(userId => {
                        const user = users.find(u => u._id === userId);
                        return user ? (
                          <Chip
                            key={userId}
                            label={user.name || user.email}
                            onDelete={() => handleUserSelect(userId)}
                            size="small"
                            style={{ backgroundColor: '#667eea20' }}
                          />
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  {/* Users List */}
                  <div className="Alerts-users-list">
                    {filteredUsers.length === 0 ? (
                      <div className="Alerts-empty-list">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className={`Alerts-user-item ${form.assignedUsers.includes(user._id) ? 'Alerts-user-item-selected' : ''}`}
                          onClick={() => handleUserSelect(user._id)}
                        >
                          <Checkbox
                            checked={form.assignedUsers.includes(user._id)}
                            onChange={() => handleUserSelect(user._id)}
                          />
                          <Avatar size="small" color="#667eea">
                            {user.name?.charAt(0) || user.email?.charAt(0)}
                          </Avatar>
                          <div className="Alerts-user-info">
                            <p className="Alerts-user-name">{user.name || user.email}</p>
                            <p className="Alerts-user-details">
                              {user.email} • {user.role || 'User'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Assign Groups Section */}
                <div className="Alerts-assign-section">
                  <h3 className="Alerts-assign-title">👥 Assign Groups</h3>
                  <p className="Alerts-assign-subtitle">
                    Select specific groups or leave empty for all groups
                  </p>
                  
                  {/* Group Search */}
                  <div className="Alerts-search-field">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search groups by name..."
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      className="Alerts-search-input"
                    />
                  </div>
                  
                  {/* Selected Groups Chips */}
                  {form.assignedGroups.length > 0 && (
                    <div className="Alerts-selected-chips">
                      {form.assignedGroups.map(groupId => {
                        const group = groups.find(g => g._id === groupId);
                        return group ? (
                          <Chip
                            key={groupId}
                            label={group.name}
                            onDelete={() => handleGroupSelect(groupId)}
                            size="small"
                            style={{ backgroundColor: '#764ba220' }}
                          />
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  {/* Groups List */}
                  <div className="Alerts-groups-list">
                    {filteredGroups.length === 0 ? (
                      <div className="Alerts-empty-list">
                        No groups found
                      </div>
                    ) : (
                      filteredGroups.map((group) => (
                        <div
                          key={group._id}
                          className={`Alerts-group-item ${form.assignedGroups.includes(group._id) ? 'Alerts-group-item-selected' : ''}`}
                          onClick={() => handleGroupSelect(group._id)}
                        >
                          <Checkbox
                            checked={form.assignedGroups.includes(group._id)}
                            onChange={() => handleGroupSelect(group._id)}
                          />
                          <Avatar size="small" color="#764ba2">
                            <FiUsers />
                          </Avatar>
                          <div className="Alerts-group-info">
                            <p className="Alerts-group-name">{group.name}</p>
                            {group.description && (
                              <p className="Alerts-group-description">{group.description}</p>
                            )}
                          </div>
                          {group.members && (
                            <Chip
                              size="small"
                              label={`${group.members.length} members`}
                              variant="outlined"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="Alerts-modal-footer">
              <button 
                className="Alerts-button Alerts-button-outline"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button 
                className="Alerts-button Alerts-button-primary"
                onClick={handleSubmit}
                disabled={!form.message.trim()}
              >
                {editId ? "Update Alert" : "Create Alert"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Notification */}
      {notification && (
        <div className="Alerts-notification">
          <div 
            className={`Alerts-notification-card Alerts-notification-${notification.type}`}
            style={{ 
              background: `linear-gradient(135deg, ${getSeverityColor(notification.type)} 0%, ${getSeverityColor(notification.type)}80 100%)`
            }}
          >
            <div className="Alerts-notification-content">
              {notification.type === "error" ? (
                <FiAlertCircle />
              ) : notification.type === "warning" ? (
                <FiAlertTriangle />
              ) : (
                <FiTrendingUp />
              )}
              <div>
                <p className="Alerts-notification-title">
                  {notification.type === "error" ? "Error" : 
                   notification.type === "warning" ? "Warning" : "Success"}
                </p>
                <p className="Alerts-notification-message">{notification.message}</p>
              </div>
              <button 
                className="Alerts-notification-close"
                onClick={() => setNotification(null)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;