import React, { useState, useEffect, useMemo } from "react";
import axios from "../../utils/axiosConfig";
import "../Css/CreateAlerts.css";
import CIISLoader from '../../Loader/CIISLoader';


const FiAlertCircle = () => <span className="CreateAlert-icon">⚠️</span>;
const FiAlertTriangle = () => <span className="CreateAlert-icon">⚠️</span>;
const FiInfo = () => <span className="CreateAlert-icon">ℹ️</span>;
const FiUsers = () => <span className="CreateAlert-icon">👥</span>;
const FiUser = () => <span className="CreateAlert-icon">👤</span>;
const FiSearch = () => <span className="CreateAlert-icon">🔍</span>;
const FiCheck = () => <span className="CreateAlert-icon">✓</span>;
const FiX = () => <span className="CreateAlert-icon">✕</span>;
const FiSend = () => <span className="CreateAlert-icon">📤</span>;
const FiRefreshCw = () => <span className="CreateAlert-icon">🔄</span>;
const FiBell = () => <span className="CreateAlert-icon">🔔</span>;
const FiEye = () => <span className="CreateAlert-icon">👁️</span>;
const FiUserCheck = () => <span className="CreateAlert-icon">✅👤</span>;
const FiFilter = () => <span className="CreateAlert-icon">🔧</span>;
const FiPlus = () => <span className="CreateAlert-icon">➕</span>;
const FiClock = () => <span className="CreateAlert-icon">⏰</span>;
const FiCalendar = () => <span className="CreateAlert-icon">📅</span>;


const Badge = ({ children, badgeContent, color = "error", size = "small" }) => (
  <div className="CreateAlert-badge">
    {children}
    {badgeContent > 0 && (
      <span className={`CreateAlert-badge-content CreateAlert-badge-${color}`}>
        {badgeContent > 99 ? "99+" : badgeContent}
      </span>
    )}
  </div>
);

const Chip = ({ label, color, icon, onDelete, size = "medium", variant = "default", onClick }) => (
  <span 
    className={`CreateAlert-chip CreateAlert-chip-${size} CreateAlert-chip-${variant}`}
    style={{ 
      backgroundColor: variant === "outlined" ? "transparent" : color ? `${color}20` : '#667eea20',
      color: color || '#667eea',
      borderColor: color ? `${color}30` : '#667eea30'
    }}
    onClick={onClick}
  >
    {icon && <span className="CreateAlert-chip-icon">{icon}</span>}
    {label}
    {onDelete && (
      <button className="CreateAlert-chip-delete" onClick={onDelete}>
        ×
      </button>
    )}
  </span>
);

const Avatar = ({ children, color, size = "medium" }) => (
  <div 
    className={`CreateAlert-avatar CreateAlert-avatar-${size}`}
    style={{ 
      backgroundColor: color ? `${color}20` : '#667eea20',
      color: color || '#667eea'
    }}
  >
    {children}
  </div>
);

const Tooltip = ({ title, children }) => (
  <div className="CreateAlert-tooltip">
    {children}
    <span className="CreateAlert-tooltip-text">{title}</span>
  </div>
);

const Checkbox = ({ checked, onChange }) => (
  <label className="CreateAlert-checkbox">
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={onChange} 
      className="CreateAlert-checkbox-input"
    />
    <span className="CreateAlert-checkbox-checkmark" />
  </label>
);

const CreateAlert = () => {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState(new Map()); 
  const [groups, setGroups] = useState([]);
  const [role, setRole] = useState("");
  const [alerts, setAlerts] = useState([]);
  
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  
  const [form, setForm] = useState({
    type: "info",
    message: "",
    assignedUsers: [],
  });
  
  
  const [userSearch, setUserSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("all");
  
  
  const [stats, setStats] = useState({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
    unread: 0,
  });
  
  
  const [notification, setNotification] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const token = localStorage.getItem("token");
  
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  
  const getHeaders = () => {
    const token = localStorage.getItem("token");
    void 0;
    
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  
  const createUsersMap = (usersArray) => {
    const map = new Map();
    usersArray.forEach(user => {
      const userId = user._id || user.id;
      if (userId) {
        map.set(userId, user);
      }
    });
    setUsersMap(map);
  };

  
  const fetchUsers = async () => {
    try {
      void 0;
      void 0;
      
      const response = await axios.get("/users/company-users", getHeaders());
      
      void 0;
      
      let fetchedUsers = [];
      
      if (response.data) {
        if (response.data.message) {
          if (Array.isArray(response.data.message)) {
            fetchedUsers = response.data.message;
          } else if (response.data.message.users && Array.isArray(response.data.message.users)) {
            fetchedUsers = response.data.message.users;
          } else if (response.data.message.data && Array.isArray(response.data.message.data)) {
            fetchedUsers = response.data.message.data;
          } else if (response.data.message.employees && Array.isArray(response.data.message.employees)) {
            fetchedUsers = response.data.message.employees;
          }
        } else if (Array.isArray(response.data)) {
          fetchedUsers = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          fetchedUsers = response.data.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          fetchedUsers = response.data.data;
        }
      }
      
      void 0;
      setUsers(fetchedUsers);
      createUsersMap(fetchedUsers); 
      
    } catch (error) {
      console.error("❌ ERROR FETCHING USERS:", error);
      if (error.response?.status === 403) {
        setNotification({
          message: "Permission denied. Please check your access rights.",
          type: "error"
        });
      }
      setUsers([]);
      setUsersMap(new Map());
    }
  };

  
  const fetchGroups = async () => {
    try {
      void 0;
      const response = await axios.get("/groups", getHeaders());
      
      let fetchedGroups = [];
      if (response.data?.groups && Array.isArray(response.data.groups)) {
        fetchedGroups = response.data.groups;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        fetchedGroups = response.data.data;
      } else if (Array.isArray(response.data)) {
        fetchedGroups = response.data;
      } else if (response.data?.message) {
        if (Array.isArray(response.data.message)) {
          fetchedGroups = response.data.message;
        } else if (response.data.message.groups && Array.isArray(response.data.message.groups)) {
          fetchedGroups = response.data.message.groups;
        }
      }
      
      void 0;
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    }
  };

  
  const fetchAlerts = async () => {
    try {
      const response = await axios.get("/alerts", getHeaders());
      
      let fetchedAlerts = [];
      if (response.data?.alerts && Array.isArray(response.data.alerts)) {
        fetchedAlerts = response.data.alerts;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        fetchedAlerts = response.data.data;
      } else if (Array.isArray(response.data)) {
        fetchedAlerts = response.data;
      } else if (response.data?.message && Array.isArray(response.data.message)) {
        fetchedAlerts = response.data.message;
      }
      
      setAlerts(fetchedAlerts);
      calculateStats(fetchedAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
    }
  };

  const calculateStats = (data) => {
    const info = data.filter((a) => a.type === "info").length;
    const warning = data.filter((a) => a.type === "warning").length;
    const error = data.filter((a) => a.type === "error").length;
    const unread = data.filter((a) => !a.readBy?.includes(localStorage.getItem("userId"))).length;
    
    setStats({
      total: data.length,
      info,
      warning,
      error,
      unread,
    });
  };

  
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        setNotification({
          message: "No authentication token found. Please login again.",
          type: "error"
        });
        setPageLoading(false);
        return;
      }
      
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          void 0;
          
          const userRole = parsed.role || 
                          parsed.user?.role || 
                          parsed.userRole || 
                          parsed.user?.userRole || 
                          "";
          
          setRole(userRole.toLowerCase());
          
          const userId = parsed._id || 
                        parsed.id || 
                        parsed.user?._id || 
                        parsed.user?.id || 
                        "";
                        
          if (userId) {
            localStorage.setItem("userId", userId);
          }
        } catch (error) {
          console.error("Error parsing user:", error);
        }
      }
      
      await Promise.all([fetchUsers(), fetchGroups(), fetchAlerts()]);
      setPageLoading(false);
    };
    
    loadData();
  }, []);

  
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchGroups(), fetchAlerts()]);
    setRefreshing(false);
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

  const handleSelectAllUsers = () => {
    if (!Array.isArray(filteredUsers) || filteredUsers.length === 0) return;
    
    if (form.assignedUsers.length === filteredUsers.length) {
      setForm(prev => ({ ...prev, assignedUsers: [] }));
    } else {
      setForm(prev => ({ ...prev, assignedUsers: filteredUsers.map(u => u._id || u.id) }));
    }
  };

  
  const handleSubmit = async () => {
    if (!form.message.trim()) {
      return setNotification({ 
        message: "Please enter an alert message", 
        type: "error" 
      });
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return setNotification({
        message: "You are not logged in. Please login again.",
        type: "error"
      });
    }

    setLoading(true);
    try {
      const payload = {
        type: form.type,
        message: form.message.trim(),
        assignedUsers: form.assignedUsers,
      };

      void 0;
      
      let response;
      try {
        response = await axios.post("/alerts", payload, getHeaders());
      } catch (error) {
        if (error.response?.status === 403) {
          void 0;
          response = await axios.post("/api/alerts", payload, getHeaders());
        } else {
          throw error;
        }
      }
      
      void 0;
      
      setNotification({ 
        message: "Alert created successfully!", 
        type: "success" 
      });

      await fetchAlerts();

      
      setIsModalOpen(false);
      setForm({
        type: "info",
        message: "",
        assignedUsers: [],
      });
      setUserSearch("");
      
      setTimeout(() => setNotification(null), 3000);
      
    } catch (error) {
      console.error("Error creating alert:", error);
      
      let errorMessage = "Failed to create alert";
      if (error.response) {
        switch(error.response.status) {
          case 401:
            errorMessage = "Authentication failed. Please login again.";
            break;
          case 403:
            errorMessage = "You don't have permission to create alerts. Please check your user role.";
            break;
          case 400:
            errorMessage = error.response.data?.message || "Invalid alert data";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = error.response.data?.message || `Error ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      setNotification({ 
        message: errorMessage, 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      type: "info",
      message: "",
      assignedUsers: [],
    });
    setUserSearch("");
  };

  
  const openModal = () => {
    setIsModalOpen(true);
  };

  
  const closeModal = () => {
    setIsModalOpen(false);
    handleReset();
  };

  
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) {
      return [];
    }
    
    if (!userSearch) {
      return users;
    }
    
    const query = userSearch.toLowerCase();
    return users.filter(user => {
      const name = (user.name || user.username || user.fullName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const role = (user.role || user.userRole || '').toLowerCase();
      const department = (user.department || user.departmentName || '').toLowerCase();
      const employeeId = (user.employeeId || user.empId || '').toLowerCase();
      
      return name.includes(query) || 
             email.includes(query) || 
             role.includes(query) || 
             department.includes(query) ||
             employeeId.includes(query);
    });
  }, [users, userSearch]);

  
  const filteredAlerts = useMemo(() => {
    if (!Array.isArray(alerts) || alerts.length === 0) return [];
    
    let filtered = [...alerts];
    
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.message?.toLowerCase().includes(query) ||
        alert.type?.toLowerCase().includes(query)
      );
    }
    
    
    if (filterType !== "all") {
      filtered = filtered.filter(alert => alert.type === filterType);
    }
    
    
    if (viewMode === "assigned") {
      const userId = localStorage.getItem("userId");
      filtered = filtered.filter(alert => 
        alert.assignedUsers?.includes(userId)
      );
    } else if (viewMode === "unread") {
      const userId = localStorage.getItem("userId");
      filtered = filtered.filter(alert => !alert.readBy?.includes(userId));
    }
    
    return filtered;
  }, [alerts, searchQuery, filterType, viewMode]);

  
  const getUserById = (userId) => {
    if (!userId) return { name: "Unknown User", email: "", username: "Unknown" };
    
    
    if (usersMap && usersMap.size > 0) {
      const user = usersMap.get(userId);
      if (user) {
        return user;
      }
    }
    
    
    if (Array.isArray(users) && users.length > 0) {
      const user = users.find(u => u._id === userId || u.id === userId);
      if (user) {
        return user;
      }
    }
    
    
    return { 
      name: "Unknown User", 
      email: "", 
      username: "Unknown",
      _id: userId 
    };
  };

  
  const getUserDisplayName = (user) => {
    if (!user) return "Unknown User";
    return user.name || user.username || user.fullName || user.email || "Unknown User";
  };

  
  const getGroupById = (groupId) => {
    if (!groupId) return { name: "Unknown Group" };
    if (!Array.isArray(groups) || groups.length === 0) return { name: "Unknown Group" };
    return groups.find(g => g._id === groupId || g.id === groupId) || { name: "Unknown Group" };
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case "error": return "#EF5350";
      case "warning": return "#FFA726";
      case "success": return "#66BB6A";
      case "info": return "#29B6F6";
      default: return "#667eea";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="CreateAlert-container">
      
      <div className="CreateAlert-gradient-header">
        <div className="CreateAlert-header-content">
          <div className="CreateAlert-header-text">
            <h1 className="CreateAlert-title">Alerts Management</h1>
            <p className="CreateAlert-subtitle">View and manage all alerts</p>
          </div>
          <div className="CreateAlert-header-actions">
            <Tooltip title="Create New Alert">
              <button 
                className="CreateAlert-create-button"
                onClick={openModal}
              >
                <FiPlus />
                <span>Create Alert</span>
              </button>
            </Tooltip>
            {!isMobile && (
              <Tooltip title="Refresh">
                <button 
                  className={`CreateAlert-icon-button CreateAlert-refresh-button ${refreshing ? 'CreateAlert-refreshing' : ''}`}
                  onClick={handleRefresh} 
                  disabled={refreshing}
                >
                  <FiRefreshCw />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      
      <div className="CreateAlert-stats-filters">
        
        <div className="CreateAlert-search-container">
          <div className="CreateAlert-search-field">
            <FiSearch />
            <input
              type="text"
              placeholder={isMobile ? "Search alerts..." : "Search alerts by message or type..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="CreateAlert-search-input"
            />
            {searchQuery && (
              <button className="CreateAlert-search-clear" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>
        </div>

        
        <div className="CreateAlert-view-mode-container">
          <div className="CreateAlert-view-mode-card">
            <span className="CreateAlert-view-mode-label">View:</span>
            <div className="CreateAlert-toggle-button-group">
              <button 
                className={`CreateAlert-toggle-button ${viewMode === 'all' ? 'CreateAlert-toggle-button-active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                <FiEye />
                <span>{isMobile ? 'All' : 'All Alerts'}</span>
              </button>
              <button 
                className={`CreateAlert-toggle-button ${viewMode === 'assigned' ? 'CreateAlert-toggle-button-active' : ''}`}
                onClick={() => setViewMode('assigned')}
              >
                <FiUserCheck />
                <span>{isMobile ? 'Mine' : 'Assigned to Me'}</span>
              </button>
              <button 
                className={`CreateAlert-toggle-button ${viewMode === 'unread' ? 'CreateAlert-toggle-button-active' : ''}`}
                onClick={() => setViewMode('unread')}
              >
                <Badge badgeContent={stats.unread}>
                  <FiBell />
                </Badge>
                <span>{isMobile ? 'New' : 'Unread'}</span>
              </button>
            </div>
          </div>
        </div>

        
        <div className="CreateAlert-stats-grid">
          {[
            { 
              key: "total", 
              label: isMobile ? "Total" : "Total Alerts", 
              color: "#667eea", 
              icon: <FiBell />,
              value: stats.total,
              active: filterType === "all" && viewMode === "all"
            },
            { 
              key: "info", 
              label: isMobile ? "Info" : "Information", 
              color: "#29B6F6", 
              icon: <FiInfo />,
              value: stats.info,
              active: filterType === "info"
            },
            { 
              key: "warning", 
              label: isMobile ? "Warn" : "Warnings", 
              color: "#FFA726", 
              icon: <FiAlertTriangle />,
              value: stats.warning,
              active: filterType === "warning"
            },
            { 
              key: "error", 
              label: isMobile ? "Error" : "Errors", 
              color: "#EF5350", 
              icon: <FiAlertCircle />,
              value: stats.error,
              active: filterType === "error"
            },
          ]
          .map((s) => (
            <div 
              key={s.key} 
              className={`CreateAlert-stat-card ${s.active ? 'CreateAlert-stat-card-active' : ''}`}
              style={{ borderTopColor: s.color }}
              onClick={() => {
                setFilterType(s.key === "total" ? "all" : s.key);
                setViewMode("all");
              }}
            >
              <div className="CreateAlert-stat-content">
                <div className="CreateAlert-stat-text">
                  <span className="CreateAlert-stat-label">{s.label}</span>
                  <h3 className="CreateAlert-stat-value">{s.value}</h3>
                </div>
                <Avatar color={s.color}>
                  {s.icon}
                </Avatar>
              </div>
            </div>
          ))}
        </div>

        
        <div className="CreateAlert-filter-chip-container">
          <Chip
            icon={<FiFilter />}
            label={`${isMobile ? '' : 'Filter: '}${filterType === 'all' ? 'All' : filterType}`}
            onClick={() => setFilterType('all')}
            variant="outlined"
            size={isMobile ? "small" : "medium"}
          />
        </div>
      </div>

      
      <div className="CreateAlert-alerts-container">
        {filteredAlerts.length === 0 ? (
          <div className="CreateAlert-empty-state">
            <FiBell />
            <h3>No Alerts Found</h3>
            <p>There are no alerts matching your criteria.</p>
            <button className="CreateAlert-create-button" onClick={openModal}>
              <FiPlus />
              Create Your First Alert
            </button>
          </div>
        ) : (
          <div className="CreateAlert-alerts-grid">
            {filteredAlerts.map((alert) => {
              
              const assignedUsersList = alert.assignedUsers?.map(userId => {
                const user = getUserById(userId);
                return getUserDisplayName(user);
              }).join(', ') || 'No users assigned';
              
              return (
                <div 
                  key={alert._id || alert.id} 
                  className="CreateAlert-alert-card"
                  style={{ borderLeftColor: getSeverityColor(alert.type) }}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="CreateAlert-alert-header">
                    <div className="CreateAlert-alert-type">
                      {alert.type === "info" && <FiInfo />}
                      {alert.type === "warning" && <FiAlertTriangle />}
                      {alert.type === "error" && <FiAlertCircle />}
                      <span style={{ 
                        color: getSeverityColor(alert.type),
                        textTransform: 'capitalize'
                      }}>
                        {alert.type}
                      </span>
                    </div>
                    <span className="CreateAlert-alert-date">
                      <FiCalendar />
                      {isMobile ? formatDate(alert.createdAt).split(',')[0] : formatDate(alert.createdAt)}
                    </span>
                  </div>
                  
                  <p className="CreateAlert-alert-message">{alert.message}</p>
                  
                  <div className="CreateAlert-alert-footer">
                    <div className="CreateAlert-alert-assignments">
                      {alert.assignedUsers?.length > 0 && (
                        <Tooltip title={assignedUsersList}>
                          <span className="CreateAlert-alert-badge">
                            <FiUser /> {alert.assignedUsers.length}
                          </span>
                        </Tooltip>
                      )}
                      {alert.assignedGroups?.length > 0 && (
                        <Tooltip title={`Assigned to ${alert.assignedGroups.length} groups`}>
                          <span className="CreateAlert-alert-badge">
                            <FiUsers /> {alert.assignedGroups.length}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    
                    {!alert.readBy?.includes(localStorage.getItem("userId")) && (
                      <span className="CreateAlert-unread-badge">New</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
      {isModalOpen && (
        <div className="CreateAlert-modal-overlay" onClick={closeModal}>
          <div className="CreateAlert-modal" onClick={e => e.stopPropagation()}>
            <div className="CreateAlert-modal-header">
              <h2>Create New Alert</h2>
              <button className="CreateAlert-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            
            <div className="CreateAlert-modal-content">
              
              <div className="CreateAlert-form-section">
                <h3 className="CreateAlert-section-title">Alert Type</h3>
                <div className="CreateAlert-type-grid">
                  {[
                    { value: "info", label: isMobile ? "Info" : "Information", color: "#29B6F6", icon: <FiInfo /> },
                    { value: "warning", label: "Warning", color: "#FFA726", icon: <FiAlertTriangle /> },
                    { value: "error", label: isMobile ? "Error" : "Error / Critical", color: "#EF5350", icon: <FiAlertCircle /> }
                  ].map(type => (
                    <div
                      key={type.value}
                      className={`CreateAlert-type-card ${form.type === type.value ? 'CreateAlert-type-selected' : ''}`}
                      style={{ borderColor: form.type === type.value ? type.color : 'var(--gray-300)' }}
                      onClick={() => setForm(prev => ({ ...prev, type: type.value }))}
                    >
                      <div className="CreateAlert-type-icon" style={{ color: type.color }}>
                        {type.icon}
                      </div>
                      <div className="CreateAlert-type-info">
                        <h4 style={{ color: type.color }}>{type.label}</h4>
                        {!isMobile && (
                          <p className="CreateAlert-type-desc">
                            {type.value === "info" && "General updates"}
                            {type.value === "warning" && "Important notices"}
                            {type.value === "error" && "Urgent issues"}
                          </p>
                        )}
                      </div>
                      {form.type === type.value && (
                        <span className="CreateAlert-type-check">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              
              <div className="CreateAlert-form-section">
                <h3 className="CreateAlert-section-title">
                  Alert Message <span className="CreateAlert-required">*</span>
                </h3>
                <textarea
                  className="CreateAlert-textarea"
                  rows={isMobile ? "3" : "4"}
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your alert message here..."
                  maxLength="500"
                />
                <div className="CreateAlert-message-counter">
                  {form.message.length} / 500
                </div>
              </div>

              
              <div className="CreateAlert-form-section">
                <div className="CreateAlert-section-header">
                  <h3 className="CreateAlert-section-title">Assign to Users</h3>
                  <div className="CreateAlert-user-actions">
                    <span className="CreateAlert-user-count">
                      {users.length}
                    </span>
                    {Array.isArray(filteredUsers) && filteredUsers.length > 0 && (
                      <button 
                        className="CreateAlert-select-all"
                        onClick={handleSelectAllUsers}
                      >
                        {form.assignedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                </div>
                
                
                {Array.isArray(form.assignedUsers) && form.assignedUsers.length > 0 && (
                  <div className="CreateAlert-selected-items">
                    <span className="CreateAlert-selected-label">
                      Selected ({form.assignedUsers.length}):
                    </span>
                    <div className="CreateAlert-selected-chips">
                      {form.assignedUsers.map(userId => {
                        const user = getUserById(userId);
                        return (
                          <Chip
                            key={userId}
                            label={getUserDisplayName(user)}
                            onDelete={() => handleUserSelect(userId)}
                            color="#667eea"
                            size="small"
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                
                <div className="CreateAlert-search-field">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search users by name, email, role..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="CreateAlert-search-input"
                  />
                </div>

                
                <div className="CreateAlert-users-list">
                  {!Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
                    <div className="CreateAlert-empty-list">
                      {users.length === 0 ? (
                        <>
                          <p>No users found.</p>
                          <button 
                            className="CreateAlert-retry-button"
                            onClick={fetchUsers}
                          >
                            Retry
                          </button>
                        </>
                      ) : (
                        'No users match your search'
                      )}
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const userId = user._id || user.id;
                      if (!userId) return null;
                      
                      return (
                        <div
                          key={userId}
                          className={`CreateAlert-user-item ${Array.isArray(form.assignedUsers) && form.assignedUsers.includes(userId) ? 'CreateAlert-user-item-selected' : ''}`}
                          onClick={() => handleUserSelect(userId)}
                        >
                          <Checkbox
                            checked={Array.isArray(form.assignedUsers) && form.assignedUsers.includes(userId)}
                            onChange={() => handleUserSelect(userId)}
                          />
                          <Avatar size="small" color="#667eea">
                            {getUserDisplayName(user).charAt(0).toUpperCase()}
                          </Avatar>
                          <div className="CreateAlert-user-info">
                            <p className="CreateAlert-user-name">
                              {getUserDisplayName(user)}
                            </p>
                            {!isMobile && (
                              <p className="CreateAlert-user-details">
                                {user.email || 'No Email'} 
                                {user.role && ` • ${user.role}`}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              
              <div className="CreateAlert-actions">
                <button
                  className="CreateAlert-button CreateAlert-button-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
                <button
                  className="CreateAlert-button CreateAlert-button-primary"
                  onClick={handleSubmit}
                  disabled={loading || !form.message.trim()}
                >
                  {loading ? (
                    <>
                      <span className="CreateAlert-spinner" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      {isMobile ? 'Create' : 'Create Alert'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {selectedAlert && (
        <div className="CreateAlert-modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="CreateAlert-modal CreateAlert-modal-small" onClick={e => e.stopPropagation()}>
            <div className="CreateAlert-modal-header">
              <h2>Alert Details</h2>
              <button className="CreateAlert-modal-close" onClick={() => setSelectedAlert(null)}>
                <FiX />
              </button>
            </div>
            
            <div className="CreateAlert-modal-content">
              <div className="CreateAlert-detail-item">
                <span className="CreateAlert-detail-label">Type:</span>
                <Chip
                  label={selectedAlert.type}
                  color={getSeverityColor(selectedAlert.type)}
                  icon={
                    selectedAlert.type === "info" ? <FiInfo /> :
                    selectedAlert.type === "warning" ? <FiAlertTriangle /> :
                    <FiAlertCircle />
                  }
                  size={isMobile ? "small" : "medium"}
                />
              </div>
              
              <div className="CreateAlert-detail-item">
                <span className="CreateAlert-detail-label">Message:</span>
                <p className="CreateAlert-detail-message">{selectedAlert.message}</p>
              </div>
              
              <div className="CreateAlert-detail-item">
                <span className="CreateAlert-detail-label">Created:</span>
                <span>{formatDate(selectedAlert.createdAt)}</span>
              </div>
              
              {selectedAlert.assignedUsers?.length > 0 && (
                <div className="CreateAlert-detail-item">
                  <span className="CreateAlert-detail-label">Assigned Users:</span>
                  <div className="CreateAlert-detail-chips">
                    {selectedAlert.assignedUsers.slice(0, isMobile ? 3 : 5).map(userId => {
                      const user = getUserById(userId);
                      return (
                        <Chip
                          key={userId}
                          label={getUserDisplayName(user)}
                          size="small"
                          color="#667eea"
                        />
                      );
                    })}
                    {selectedAlert.assignedUsers.length > (isMobile ? 3 : 5) && (
                      <Chip
                        label={`+${selectedAlert.assignedUsers.length - (isMobile ? 3 : 5)}`}
                        size="small"
                        color="#667eea"
                        variant="outlined"
                      />
                    )}
                  </div>
                </div>
              )}
              
              {selectedAlert.assignedGroups?.length > 0 && (
                <div className="CreateAlert-detail-item">
                  <span className="CreateAlert-detail-label">Assigned Groups:</span>
                  <div className="CreateAlert-detail-chips">
                    {selectedAlert.assignedGroups.slice(0, isMobile ? 3 : 5).map(groupId => {
                      const group = getGroupById(groupId);
                      return (
                        <Chip
                          key={groupId}
                          label={group.name || groupId}
                          size="small"
                          color="#764ba2"
                        />
                      );
                    })}
                    {selectedAlert.assignedGroups.length > (isMobile ? 3 : 5) && (
                      <Chip
                        label={`+${selectedAlert.assignedGroups.length - (isMobile ? 3 : 5)}`}
                        size="small"
                        color="#764ba2"
                        variant="outlined"
                      />
                    )}
                  </div>
                </div>
              )}
              
              <div className="CreateAlert-detail-item">
                <span className="CreateAlert-detail-label">Read by:</span>
                <span>{selectedAlert.readBy?.length || 0} users</span>
              </div>
            </div>
            
            <div className="CreateAlert-actions">
              <button
                className="CreateAlert-button CreateAlert-button-primary"
                onClick={() => setSelectedAlert(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
      {notification && (
        <div className="CreateAlert-notification">
          <div 
            className={`CreateAlert-notification-card CreateAlert-notification-${notification.type}`}
            style={{ 
              background: `linear-gradient(135deg, ${getSeverityColor(notification.type)} 0%, ${getSeverityColor(notification.type)}80 100%)`
            }}
          >
            <div className="CreateAlert-notification-content">
              {notification.type === "success" ? <FiCheck /> : <FiAlertCircle />}
              <div>
                <p className="CreateAlert-notification-title">
                  {notification.type === "error" ? "Error" : "Success"}
                </p>
                <p className="CreateAlert-notification-message">{notification.message}</p>
              </div>
              <button 
                className="CreateAlert-notification-close"
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

export default CreateAlert;