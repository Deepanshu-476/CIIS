import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "../../utils/axiosConfig";
import { useSocket } from '../../context/SocketContext';
import { useNotification } from '../../context/NotificationContext';
import {
  FiCalendar,
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiUser,
  FiList,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiX,
  FiBriefcase,
  FiUsers,
  FiAlertTriangle,
  FiBell,
  FiWifi,
  FiWifiOff
} from "react-icons/fi";
import '../Css/MyLeaves.css';
import CIISLoader from '../../Loader/CIISLoader';
import { margin } from "@mui/system";

const MyLeaves = () => {
  const [tab, setTab] = useState(0);
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notification, setNotification] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState(null);
  const [expandedReasonId, setExpandedReasonId] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  
  let socketContext = {};
  let notificationContext = {};
  
  try {
    socketContext = useSocket() || {};
    notificationContext = useNotification() || {};
  } catch (error) {
    console.warn('Socket/Notification context not available:', error);
  }
  
  const { 
    onLeaveStatusChanged = () => () => {},
    isConnected = false,
    joinLeaveRoom = () => {},
    leaveLeaveRoom = () => {},
    unreadCount = 0 
  } = socketContext;
  
  const { showToast = (msg) => void 0 } = notificationContext;
  

  const toggleReason = (id) => {
  setExpandedReasonId(prev => (prev === id ? null : id));
};

const openDetailModal = (leave) => {
  setSelectedLeave(leave);
  setIsDetailModalOpen(true);
};

const closeDetailModal = () => {
  setSelectedLeave(null);
  setIsDetailModalOpen(false);
};
  
  const [jobRoles, setJobRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [userJobRoleName, setUserJobRoleName] = useState("Employee");
  const [userDepartmentName, setUserDepartmentName] = useState("General");
  const [jobRolesLoading, setJobRolesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [form, setForm] = useState({
    type: "Casual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [historyDialog, setHistoryDialog] = useState({
    open: false,
    title: "",
    items: [],
  });
  const [isMobile, setIsMobile] = useState(false);
  const [socketError, setSocketError] = useState(false);

  
  let user = null;
  let token = null;
  let companyDetails = null;
  
  try {
    user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    token = localStorage.getItem('token');
    companyDetails = localStorage.getItem('companyDetails') ? JSON.parse(localStorage.getItem('companyDetails')) : null;
  } catch (error) {
    console.error('Error parsing localStorage data:', error);
  }

  
  
  
  useEffect(() => {
    if (!user?._id) return;

    void 0;

    let unsubscribeStatusChange;

    try {
      unsubscribeStatusChange = onLeaveStatusChanged?.((data) => {
        void 0;
        
        const { leaveId, newStatus, oldStatus, remarks } = data.data || data;
        
        
        setLeaves(prev => {
          const updatedLeaves = prev.map(leave => {
            if (leave._id === leaveId) {
              return { ...leave, status: newStatus, remarks };
            }
            return leave;
          });
          
          
          calculateStats(updatedLeaves);
          
          
          const affectedLeave = prev.find(l => l._id === leaveId);
          
          if (affectedLeave) {
            
            setRecentlyUpdatedId(leaveId);
            setTimeout(() => setRecentlyUpdatedId(null), 3000);
            
            
            const message = `Your ${affectedLeave.type} leave has been ${newStatus.toLowerCase()}`;
            
            try {
              if (newStatus === 'Approved') {
                showToast(message, 'success', 5000);
              } else if (newStatus === 'Rejected') {
                showToast(message, 'error', 5000);
              } else {
                showToast(message, 'info', 4000);
              }
            } catch (toastError) {
              console.warn('Toast error:', toastError);
            }
            
            
            setNotification({
              message: `Leave ${newStatus.toLowerCase()}: ${affectedLeave.type} leave from ${formatDate(affectedLeave.startDate)} to ${formatDate(affectedLeave.endDate)}`,
              severity: newStatus === 'Approved' ? 'success' : newStatus === 'Rejected' ? 'error' : 'info',
              autoHide: true
            });
          }
          
          return updatedLeaves;
        });
      });
    } catch (error) {
      console.warn('Error setting up socket listener:', error);
      setSocketError(true);
    }

    
    try {
      leaves.forEach(leave => {
        joinLeaveRoom?.(leave._id);
      });
    } catch (error) {
      console.warn('Error joining leave rooms:', error);
    }

    return () => {
      try {
        if (unsubscribeStatusChange && typeof unsubscribeStatusChange === 'function') {
          unsubscribeStatusChange();
        }
        
        leaves.forEach(leave => {
          leaveLeaveRoom?.(leave._id);
        });
      } catch (error) {
        console.warn('Error cleaning up socket:', error);
      }
    };
  }, [user?._id, onLeaveStatusChanged, showToast, leaves.length]);

  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  
  const getCompanyId = () => {
    if (!user && !companyDetails) {
      return null;
    }
    
    const sources = [
      { source: 'companyDetails._id', value: companyDetails?._id },
      { source: 'companyDetails.id', value: companyDetails?.id },
      { source: 'user.company', value: user?.company },
      { source: 'user.companyId', value: user?.companyId },
      { source: 'user.companyDetails._id', value: user?.companyDetails?._id },
      { source: 'companyDetails.companyId', value: companyDetails?.companyId },
    ];
    
    const foundSource = sources.find(s => s.value);
    
    if (foundSource) {
      return foundSource.value;
    }
    
    return null;
  };

  
  const resolveUserJobRole = (roles) => {
    if (!roles || roles.length === 0) {
      if (!user) return "Employee";
      if (user?.roleName) return user.roleName;
      if (user?.jobRoleName) return user.jobRoleName;
      if (user?.role) return user.role;
      return "Employee";
    }
    
    if (!user) return "Employee";
    if (!user?.jobRole && !user?.role && !user?.roleId) {
      if (user?.roleName) return user.roleName;
      if (user?.jobRoleName) return user.jobRoleName;
      return "Employee";
    }
    
    const roleId = user.jobRole || user.role || user.roleId;
    
    const role = roles.find(
      r => {
        const match = String(r._id) === String(roleId) || 
                     String(r.id) === String(roleId) ||
                     String(r.roleId) === String(roleId) ||
                     String(r.roleNumber) === String(roleId) ||
                     r.roleName?.toLowerCase() === String(roleId).toLowerCase();
        return match;
      }
    );

    if (role) return role.roleName || "Employee";
    if (user?.roleName) return user.roleName;
    return "Employee";
  };

  
  const resolveUserDepartment = (depts) => {
    if (!depts || depts.length === 0) {
      if (!user) return "General";
      if (user?.departmentName) return user.departmentName;
      if (user?.dept) return user.dept;
      return "General";
    }
    
    if (!user) return "General";
    if (!user?.department && !user?.dept && !user?.departmentId) {
      if (user?.departmentName) return user.departmentName;
      return "General";
    }
    
    const deptId = user.department || user.dept || user.departmentId;
    
    const dept = depts.find(
      d => {
        const match = String(d._id) === String(deptId) || 
                     String(d.id) === String(deptId) ||
                     String(d.departmentId) === String(deptId) ||
                     String(d.departmentCode) === String(deptId) ||
                     d.departmentName?.toLowerCase() === String(deptId).toLowerCase();
        return match;
      }
    );

    if (dept) return dept.departmentName || "General";
    if (user?.departmentName) return user.departmentName;
    return "General";
  };

  
  const fetchJobRoles = async () => {
    const companyId = getCompanyId();
    
    if (!companyId) {
      setUserJobRoleName("Employee");
      return [];
    }
    
    setJobRolesLoading(true);
    
    try {
      const res = await axios.get(`/job-roles?company=${companyId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let roles = [];
      if (Array.isArray(res.data)) {
        roles = res.data;
      } else if (Array.isArray(res.data?.data)) {
        roles = res.data.data;
      } else if (Array.isArray(res.data?.jobRoles)) {
        roles = res.data.jobRoles;
      } else if (Array.isArray(res.data?.roles)) {
        roles = res.data.roles;
      }
      
      if (!Array.isArray(roles)) roles = [];
      
      setJobRoles(roles);
      const roleName = resolveUserJobRole(roles);
      setUserJobRoleName(roleName);
      
      return roles;
      
    } catch (err) {
      console.error('Error fetching job roles:', err);
      const roleName = resolveUserJobRole([]);
      setUserJobRoleName(roleName);
      
      setNotification({
        message: "Could not load job roles",
        severity: "warning",
      });
      
      return [];
    } finally {
      setJobRolesLoading(false);
    }
  };

  
  const fetchDepartments = async () => {
    const companyId = getCompanyId();
    
    if (!companyId) {
      setUserDepartmentName("General");
      return [];
    }
    
    setDepartmentsLoading(true);
    
    try {
      const res = await axios.get(`/departments?company=${companyId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let depts = [];
      if (Array.isArray(res.data)) {
        depts = res.data;
      } else if (Array.isArray(res.data?.data)) {
        depts = res.data.data;
      } else if (Array.isArray(res.data?.departments)) {
        depts = res.data.departments;
      } else if (Array.isArray(res.data?.departmentList)) {
        depts = res.data.departmentList;
      }
      
      if (!Array.isArray(depts)) depts = [];
      
      setDepartments(depts);
      const deptName = resolveUserDepartment(depts);
      setUserDepartmentName(deptName);
      
      return depts;
      
    } catch (err) {
      console.error('Error fetching departments:', err);
      const deptName = resolveUserDepartment([]);
      setUserDepartmentName(deptName);
      
      setNotification({
        message: "Could not load departments",
        severity: "warning",
      });
      
      return [];
    } finally {
      setDepartmentsLoading(false);
    }
  };

  
  const loadUserInfo = async () => {
    try {
      await Promise.all([
        fetchJobRoles(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error loading user info:', error);
      setNotification({
        message: "Failed to load user information",
        severity: "error",
      });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return dateStr;
    }
  };

  const getHistoryLabel = (h) => {
    if (!h) return "";

    try {
      const dateText = h.at
        ? ` on ${new Date(h.at).toLocaleString()}`
        : "";

      const remarksText = h.remarks ? ` — "${h.remarks}"` : "";

      const approvedBy =
        typeof h.by === "object" ? h.by.name : h.by || "Unknown";

      if (h.action === "approved")
        return `✅ Approved by ${approvedBy}${dateText}${remarksText}`;

      if (h.action === "rejected")
        return `❌ Rejected by ${approvedBy}${dateText}${remarksText}`;

      if (h.action === "applied")
        return `📝 Applied${dateText}`;

      return `⏳ Pending`;
    } catch (error) {
      return "History entry";
    }
  };

  const fetchLeaves = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get("/leaves/status");
      const list = res.data.leaves || [];
      setLeaves(list);
      calculateStats(list);
      
      
      try {
        list.forEach(leave => {
          joinLeaveRoom?.(leave._id);
        });
      } catch (roomError) {
        console.warn('Error joining rooms:', roomError);
      }
      
      if (showRefresh) {
        setNotification({
          message: "Leaves data refreshed!",
          severity: "success",
          autoHide: true
        });
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setNotification({
        message: error?.response?.data?.message || "Failed to fetch leaves",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [joinLeaveRoom]);

  const calculateStats = (data) => {
    const statusCounts = data.reduce(
      (counts, leave) => {
        const status = String(leave?.status || "").toLowerCase();
        if (status === "approved") counts.approved += 1;
        if (status === "pending") counts.pending += 1;
        if (status === "rejected") counts.rejected += 1;
        return counts;
      },
      { approved: 0, pending: 0, rejected: 0 }
    );

    const { approved, pending, rejected } = statusCounts;
    setStats({ total: data.length, approved, pending, rejected });
  };

  
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        await loadUserInfo();
        await fetchLeaves();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []);

  const filteredLeaves = leaves.filter((l) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : l.status === statusFilter;
    const matchesSearch =
      l.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.status?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const hasApprovalWorkflow = (leave) => Array.isArray(leave?.approvalSteps) && leave.approvalSteps.length > 0;

  const ApprovalWorkflow = ({ leave }) => {
    if (!hasApprovalWorkflow(leave)) {
      return <span className="MyLeaves-approval-empty">Default approval</span>;
    }

    return (
      <div className="MyLeaves-approval-flow">
        {leave.approvalSteps.map((step, index) => {
          const user = step?.user || {};
          const status = step?.status || "Pending";
          return (
            <div className={`MyLeaves-approval-step MyLeaves-approval-step-${status.toLowerCase()}`} key={user?._id || user?.id || index}>
              <span>{user?.name || "User"}</span>
              <strong>{status}</strong>
            </div>
          );
        })}
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      const diff = e - s;
      if (diff < 0) return 0;
      return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    } catch (error) {
      return 0;
    }
  };

  const applyLeave = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setNotification({
        message: "Please fill all fields",
        severity: "error",
      });
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setNotification({
        message: "End date cannot be before start date",
        severity: "error",
      });
      return;
    }

    const payload = {
      type: form.type,
      startDate: new Date(form.startDate).toISOString().split("T")[0],
      endDate: new Date(form.endDate).toISOString().split("T")[0],
      reason: form.reason,
      days: calculateDays(form.startDate, form.endDate),
    };

    try {
      setLoading(true);
      const response = await axios.post("/leaves/apply", payload);
      
      try {
        showToast("Leave applied successfully!", "success");
      } catch (toastError) {
        console.warn('Toast error:', toastError);
      }
      
      setNotification({
        message: "Leave applied successfully",
        severity: "success",
        autoHide: true
      });
      
      await fetchLeaves();
      setForm({ type: "Casual", startDate: "", endDate: "", reason: "" });
      setTab(0);
    } catch (err) {
      console.error('Error applying leave:', err);
      console.error('Apply leave response:', err?.response?.data);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to apply leave";
      
      try {
        showToast(errorMsg, "error");
      } catch (toastError) {
        console.warn('Toast error:', toastError);
      }
      
      setNotification({
        message: errorMsg,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const openHistoryModal = (leave) => {
    const items = Array.isArray(leave.history) ? leave.history : [];
    setHistoryDialog({
      open: true,
      title: `${leave.type} Leave — ${leave.user?.name || "Employee"}`,
      items,
    });
  };

  const closeHistoryModal = () => {
    setHistoryDialog({ open: false, title: "", items: [] });
  };

  
  const forceRefreshUserInfo = async () => {
    setRefreshing(true);
    await loadUserInfo();
    await fetchLeaves(true);
    setRefreshing(false);
  };

  
  useEffect(() => {
    if (notification?.autoHide) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="MyLeaves-container">
      
      <div className="MyLeaves-header">
        <div className="MyLeaves-header-content">
          <div className="MyLeaves-header-text">
            <h1 className="MyLeaves-title">Leave Management</h1>
            <p className="MyLeaves-subtitle">
              Manage and track all your leave requests
            </p>
            
            
            

            
            <div className="MyLeaves-user-info">
              <div className="MyLeaves-user-info-tags">
                
                <span className="MyLeaves-user-tag">
                  <FiBriefcase size={12} />
                  {companyDetails?.companyName || 'Company'}
                </span>
              </div>
            </div>
          </div>

          <div className="MyLeaves-header-actions">
            <div className="MyLeaves-search-container">
              <FiSearch className="MyLeaves-search-icon" />
              <input
                type="text"
                placeholder="Search leaves..."
                className="MyLeaves-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              className="MyLeaves-icon-button"
              onClick={forceRefreshUserInfo}
              disabled={refreshing || jobRolesLoading || departmentsLoading}
              title="Refresh all data"
            >
              <FiRefreshCw className={refreshing ? "MyLeaves-spin" : ""} />
            </button>
          </div>
        </div>

        
        {(statusFilter !== "ALL" || searchTerm) && (
          <div className="MyLeaves-active-filters">
            <span className="MyLeaves-active-filters-label">Active filters:</span>
            <div className="MyLeaves-filter-chips">
              {statusFilter !== "ALL" && (
                <div className="MyLeaves-filter-chip MyLeaves-primary">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter("ALL")}>×</button>
                </div>
              )}
              {searchTerm && (
                <div className="MyLeaves-filter-chip MyLeaves-secondary">
                  <span>Search: "{searchTerm}"</span>
                  <button onClick={() => setSearchTerm("")}>×</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      
     
<div className="MyLeaves-stats-container">
  <div className="MyLeaves-stats-grid">
    
    {stats.total > 0 && (
      <div className="MyLeaves-stat-card MyLeaves-stat-total">
        <div className="MyLeaves-stat-header">
          <FiCalendar className="MyLeaves-stat-icon" />
          <h3>Total Leaves</h3>
          <div className="MyLeaves-stat-value">{stats.total}</div>
        </div>
        
        
      </div>
    )}
    
    
    {stats.approved > 0 && (
      <div className="MyLeaves-stat-card MyLeaves-stat-approved">
        <div className="MyLeaves-stat-header">
          <FiCheckCircle className="MyLeaves-stat-icon" />
          <h3>Approved</h3>
           <div className="MyLeaves-stat-value">{stats.approved}</div>
        </div>
       
        
      </div>
    )}
    
    
    {stats.pending > 0 && (
      <div className="MyLeaves-stat-card MyLeaves-stat-pending">
        <div className="MyLeaves-stat-header">
          <FiClock className="MyLeaves-stat-icon" />
          <h3>Pending</h3>
        </div>
        <div className="MyLeaves-stat-value" style={{ marginTop: "14px" , gap: "5px" }}>
          {stats.pending}
        </div>
        
      </div>
    )}
    
    
    {stats.rejected > 0 && (
      <div className="MyLeaves-stat-card MyLeaves-stat-rejected">
        <div className="MyLeaves-stat-header">
          <FiXCircle className="MyLeaves-stat-icon" />
          <h3>Rejected</h3>
        </div>
        <div className="MyLeaves-stat-value"
        style={{ marginTop: "13px" , gap: "5px" }}
        >{stats.rejected}</div>
        
      </div>
    )}
  </div>
</div>

      
      <div className="MyLeaves-tabs-container">
        <div className="MyLeaves-tabs-header">
          <button
            className={`MyLeaves-tab ${tab === 0 ? "MyLeaves-active-tab" : ""}`}
            onClick={() => setTab(0)}
          >
            <FiCalendar />
            <span>Leave Requests</span>
            {stats.total > 0 && (
              <span className="MyLeaves-tab-badge">{stats.total}</span>
            )}
          </button>
          <button
            className={`MyLeaves-tab ${tab === 1 ? "MyLeaves-active-tab" : ""}`}
            onClick={() => setTab(1)}
          >
            <FiPlus />
            <span>Apply Leave</span>
          </button>
        </div>

        
        {tab === 0 && (
          <div className="MyLeaves-requests-tab">
            
            <div className="MyLeaves-status-filters">
              <button
                className={`MyLeaves-status-filter ${statusFilter === "ALL" ? "active" : ""}`}
                onClick={() => setStatusFilter("ALL")}
              >
                <span>All</span>
                <span className="MyLeaves-status-filter-count">{stats.total}</span>
              </button>
              <button
                className={`MyLeaves-status-filter ${statusFilter === "Approved" ? "active" : ""}`}
                onClick={() => setStatusFilter("Approved")}
              >
                <span>Approved</span>
                <span className="MyLeaves-status-filter-count">{stats.approved}</span>
              </button>
              <button
                className={`MyLeaves-status-filter ${statusFilter === "Pending" ? "active" : ""}`}
                onClick={() => setStatusFilter("Pending")}
              >
                <span>Pending</span>
                <span className="MyLeaves-status-filter-count">{stats.pending}</span>
              </button>
              <button
                className={`MyLeaves-status-filter ${statusFilter === "Rejected" ? "active" : ""}`}
                onClick={() => setStatusFilter("Rejected")}
              >
                <span>Rejected</span>
                <span className="MyLeaves-status-filter-count">{stats.rejected}</span>
              </button>
            </div>

            
            

            
            <div className="MyLeaves-requests-content">
              {filteredLeaves.length === 0 ? (
                <div className="MyLeaves-empty-state">
                  <FiAlertCircle className="MyLeaves-empty-icon" />
                  <h3>No leaves found</h3>
                  <p>
                    {searchTerm || statusFilter !== "ALL" 
                      ? "Try adjusting your search or filter criteria" 
                      : "You haven't applied for any leaves yet"}
                  </p>
                </div>
              ) : (
                <>
                  
                  {!isMobile && (
                    <div className="MyLeaves-table-container">
                      <table className="MyLeaves-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Period</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Approvers</th>
                            <th>Applied On</th>
                            <th>History</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeaves.map((leave) => {
                            const isNewlyUpdated = leave._id === recentlyUpdatedId;
                            
                            return (
                              <tr 
                                key={leave._id || leave.id}
                                className={isNewlyUpdated ? 'highlight-row' : ''}
                              >
                                <td>
                                  <span className={`MyLeaves-leave-type MyLeaves-type-${leave.type?.toLowerCase()}`}>
                                    {leave.type}
                                  </span>
                                </td>
                                <td>
                                  <div className="MyLeaves-date-range">
                                    <FiCalendar size={12} />
                                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                  </div>
                                </td>
                                <td>
                                  <span className="MyLeaves-days-badge">
                                    {leave.days || calculateDays(leave.startDate, leave.endDate)} day(s)
                                  </span>
                                </td>
<td className="MyLeaves-reason-cell">
  <div>
    {leave.reason?.length > 30
      ? `${leave.reason.substring(0, 30)}...`
      : leave.reason}
  </div>

  {leave.reason?.length > 30 && (
    <button
      className="view-more-btn"
      onClick={() => openDetailModal(leave)}
    >
      View Full Details
    </button>
  )}
</td>
                                <td>
                                  <span className={`MyLeaves-status-badge MyLeaves-status-${leave.status?.toLowerCase()}`}>
                                    {leave.status === "Approved" && <FiCheckCircle size={12} />}
                                    {leave.status === "Pending" && <FiClock size={12} />}
                                    {leave.status === "Rejected" && <FiXCircle size={12} />}
                                    {leave.status}
                                  </span>
                                </td>
                                <td>
                                  <ApprovalWorkflow leave={leave} />
                                </td>
                                <td>
                                  {formatDate(leave.createdAt || leave.appliedOn)}
                                </td>
                                <td>
                                  <button
                                    className="MyLeaves-history-button"
                                    onClick={() => openHistoryModal(leave)}
                                    disabled={!leave.history || leave.history.length === 0}
                                  >
                                    <FiList size={14} />
                                    View History
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  
                  {isMobile && (
                    <div className="MyLeaves-mobile-cards">
                      {filteredLeaves.map((leave) => {
                        const isNewlyUpdated = leave._id === recentlyUpdatedId;
                        
                        return (
                          <div 
                            key={leave._id || leave.id} 
                            className={`MyLeaves-mobile-card ${isNewlyUpdated ? 'highlight-card' : ''}`}
                          >
                            <div className="MyLeaves-mobile-card-header">
                              <div className="MyLeaves-mobile-card-title">
                                <span className={`MyLeaves-leave-type MyLeaves-type-${leave.type?.toLowerCase()}`}>
                                  {leave.type}
                                </span>
                                <span className={`MyLeaves-status-badge MyLeaves-status-${leave.status?.toLowerCase()}`}>
                                  {leave.status}
                                </span>
                              </div>
                              <div className="MyLeaves-mobile-card-dates">
                                <FiCalendar size={12} />
                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                              </div>
                            </div>
                            
                            <div className="MyLeaves-mobile-card-content">
<div className="MyLeaves-mobile-card-row">
  <span className="MyLeaves-mobile-label">Reason:</span>

  <span className="MyLeaves-mobile-value">
    {leave.reason?.length > 30
      ? `${leave.reason.substring(0, 30)}...`
      : leave.reason}
  </span>

  {leave.reason?.length > 30 && (
    <button
      className="view-more-btn"
      onClick={() => openDetailModal(leave)}
    >
      View Full Details
    </button>
  )}
</div>
                              <div className="MyLeaves-mobile-card-row">
                                <span className="MyLeaves-mobile-label">Days:</span>
                                <span className="MyLeaves-mobile-value">
                                  {leave.days || calculateDays(leave.startDate, leave.endDate)} day(s)
                                </span>
                              </div>
                              <div className="MyLeaves-mobile-card-row">
                                <span className="MyLeaves-mobile-label">Applied:</span>
                                <span className="MyLeaves-mobile-value">
                                  {formatDate(leave.createdAt || leave.appliedOn)}
                                </span>
                              </div>
                              <div className="MyLeaves-mobile-card-row MyLeaves-mobile-card-row-stack">
                                <span className="MyLeaves-mobile-label">Approvers:</span>
                                <ApprovalWorkflow leave={leave} />
                              </div>
                            </div>
                            
                            <div className="MyLeaves-mobile-card-actions">
                              <button
                                className="MyLeaves-history-button"
                                onClick={() => openHistoryModal(leave)}
                                disabled={!leave.history || leave.history.length === 0}
                              >
                                <FiList size={14} />
                                History
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}


{isDetailModalOpen && selectedLeave && (
  <div className="modal-overlay">
    <div className="modal-container">

      
      <div className="modal-header">
        <h2>Leave Details</h2>
        <button className="close-btn" onClick={closeDetailModal}>✖</button>
      </div>

      
      <div className="modal-body">

        <div className="detail-grid">

          <div className="detail-card">
            <span className="label">Type</span>
            <span className="value type">{selectedLeave.type}</span>
          </div>

          <div className="detail-card">
            <span className="label">Status</span>
            <span className={`value status status-${selectedLeave.status?.toLowerCase()}`}>
              {selectedLeave.status}
            </span>
          </div>

          <div className="detail-card">
            <span className="label">Period</span>
            <span className="value">
              {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
            </span>
          </div>

          <div className="detail-card">
            <span className="label">Days</span>
            <span className="value">
              {selectedLeave.days || calculateDays(selectedLeave.startDate, selectedLeave.endDate)}
            </span>
          </div>

          <div className="detail-card">
            <span className="label">Applied On</span>
            <span className="value">
              {formatDate(selectedLeave.createdAt || selectedLeave.appliedOn)}
            </span>
          </div>

        </div>

        <div className="reason-section">
          <h4>Approval Flow</h4>
          <ApprovalWorkflow leave={selectedLeave} />
        </div>

        
        <div className="reason-section">
          <h4>Reason</h4>
          <p>{selectedLeave.reason}</p>
        </div>

      </div>

    </div>
  </div>
)}

        
        {tab === 1 && (
          <div className="MyLeaves-apply-tab">
            <div className="MyLeaves-apply-form-container">
              <h2 className="MyLeaves-form-title">Apply for New Leave</h2>
              <p className="MyLeaves-form-subtitle">
                Fill in the details to submit a leave request
              </p>

              
              <div className="MyLeaves-form">
                <div className="MyLeaves-form-group">
                  <label htmlFor="type">
                    <FiBriefcase className="MyLeaves-form-icon" />
                    Leave Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="MyLeaves-form-select"
                  >
                    <option value="Casual">Casual</option>
                    <option value="Sick">Sick</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="MyLeaves-form-row">
                  <div className="MyLeaves-form-group">
                    <label htmlFor="startDate">
                      <FiCalendar className="MyLeaves-form-icon" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="MyLeaves-form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="MyLeaves-form-group">
                    <label htmlFor="endDate">
                      <FiCalendar className="MyLeaves-form-icon" />
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="MyLeaves-form-input"
                      min={form.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="MyLeaves-form-group">
                  <label htmlFor="days">
                    <FiClock className="MyLeaves-form-icon" />
                    Total Days
                  </label>
                  <div className="MyLeaves-days-display">
                    {calculateDays(form.startDate, form.endDate)} day(s)
                  </div>
                </div>

                <div className="MyLeaves-form-group">
                  <label htmlFor="reason">
                    <FiInfo className="MyLeaves-form-icon" />
                    Reason for Leave
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    className="MyLeaves-form-textarea"
                    placeholder="Please provide a reason for your leave request..."
                    rows={4}
                  />
                </div>

                <div className="MyLeaves-form-actions">
                  <button
                    type="button"
                    className="MyLeaves-form-cancel"
                    onClick={() => setTab(0)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="MyLeaves-form-submit"
                    onClick={applyLeave}
                    disabled={!form.startDate || !form.endDate || !form.reason.trim() || loading}
                  >
                    {loading ? 'Applying...' : (
                      <>
                        <FiPlus size={16} />
                        Apply for Leave
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      
      {historyDialog.open && (
        <div className="MyLeaves-modal-overlay">
          <div className="MyLeaves-modal">
            <div className="MyLeaves-modal-header">
              <div className="MyLeaves-history-modal-title">
                <span className="MyLeaves-history-modal-eyebrow">Leave history</span>
                <h2>{historyDialog.title}</h2>
              </div>
              <span className="MyLeaves-history-count">
                {historyDialog.items.length} update{historyDialog.items.length === 1 ? "" : "s"}
              </span>
              <button className="MyLeaves-modal-close" onClick={closeHistoryModal}>
                <FiX />
              </button>
            </div>
            <div className="MyLeaves-modal-content">
              {historyDialog.items.length === 0 ? (
                <div className="MyLeaves-empty-history">
                  <FiAlertCircle className="MyLeaves-empty-history-icon" />
                  <h3>No history available</h3>
                  <p>This leave request doesn't have any history records yet.</p>
                </div>
              ) : (
                <div className="MyLeaves-history-list">
                  {historyDialog.items.map((item, index) => {
                    const action = String(item.action || "pending").toLowerCase();
                    const actor = typeof item.by === "object" ? item.by?.name : item.by;
                    const historyText =
                      action === "approved"
                        ? `Approved by ${actor || "Unknown"}`
                        : action === "rejected"
                          ? `Rejected by ${actor || "Unknown"}`
                          : action === "applied"
                            ? "Leave request applied"
                            : "Pending update";

                    return (
                    <div key={index} className={`MyLeaves-history-item MyLeaves-history-${action}`}>
                      <div className="MyLeaves-history-icon" aria-hidden="true">
                        {action === "approved" && <FiCheckCircle />}
                        {action === "rejected" && <FiXCircle />}
                        {action !== "approved" && action !== "rejected" && <FiClock />}
                      </div>
                      <div className="MyLeaves-history-content">
                        <div className="MyLeaves-history-row-top">
                          <p className="MyLeaves-history-text">
                            {historyText}
                          </p>
                          <span className="MyLeaves-history-action-pill">
                            {action}
                          </span>
                        </div>
                        <p className="MyLeaves-history-time">
                          {item.at ? new Date(item.at).toLocaleString() : 'Unknown date'}
                        </p>
                        {item.remarks && (
                          <p className="MyLeaves-history-remarks">
                            <strong>Remarks:</strong> {item.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="MyLeaves-modal-footer">
              <button className="MyLeaves-modal-close-btn" onClick={closeHistoryModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Snackbar */}
      {notification?.message && (
        <div className={`MyLeaves-notification MyLeaves-notification-${notification.severity}`}>
          <div className="MyLeaves-notification-content">
            {notification.severity === "error" ? (
              <FiXCircle className="MyLeaves-notification-icon" />
            ) : notification.severity === "warning" ? (
              <FiAlertTriangle className="MyLeaves-notification-icon" />
            ) : (
              <FiCheckCircle className="MyLeaves-notification-icon" />
            )}
            <span className="MyLeaves-notification-message">
              {notification.message}
            </span>
          </div>
          <button
            className="MyLeaves-notification-close"
            onClick={() => setNotification(null)}
          >
            <FiX />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;
