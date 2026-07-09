import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "../../../utils/axiosConfig";
import './employee-leaves.css';
import CIISLoader from '../../../Loader/CIISLoader';


import { useSocket } from '../../../context/SocketContext';
import { useNotification } from '../../../context/NotificationContext';


import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiTrash2,
  FiList,
  FiX,
  FiSave,
  FiMail,
  FiPhone,
  FiLock,
  FiBriefcase,
  FiUser,
  FiShield,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiFileText,
  FiUserCheck,
  FiCalendar as FiCalendarIcon,
  FiMapPin,
  FiTag,
  FiMessageSquare,
  FiCheckSquare,
  FiClock as FiClockIcon,
  FiArrowRight,
  FiHome,
  FiUsers as FiUsersIcon,
  FiBriefcase as FiBriefcaseIcon,
  FiBell,
  FiMoreVertical
} from "react-icons/fi";




const StatusFilter = ({ selected, onChange }) => {
  const options = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  return (
    <select
      className="EmppLeaves-filter-select"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const LeaveTypeFilter = ({ selected, onChange }) => {
  const options = [
    { value: 'all', label: 'All Types' },
    { value: 'Casual', label: 'Casual' },
    { value: 'Sick', label: 'Sick' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
  ];

  return (
    <select
      className="EmppLeaves-filter-select"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const DepartmentFilter = ({ selected, onChange, departments = [] }) => {
  return (
    <select
      className="EmppLeaves-filter-select"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="all">All Departments</option>
      {departments.map((dept) => (
        <option key={dept._id || dept.id} value={dept._id || dept.id}>
          {dept.name || dept.departmentName || dept.title || 'Department'}
        </option>
      ))}
    </select>
  );
};




const EmployeeLeaves = () => {
  
  
  
  const [leaves, setLeaves] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [selectedStat, setSelectedStat] = useState("All");
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    leaveId: null,
    newStatus: null,
    remarks: "",
    userEmail: "",
    userName: "",
    userPhone: "",
    userId: null,
    currentStatus: ""
  });
  const [historyDialog, setHistoryDialog] = useState({
    open: false,
    title: "",
    items: [],
  });
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    leave: null
  });
  
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserDepartment, setCurrentUserDepartment] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [deletePermissionUserIds, setDeletePermissionUserIds] = useState([]);
  
  
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  
  
  const [companyName, setCompanyName] = useState("");
  
  
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [permissions, setPermissions] = useState({
    canViewAllLeaves: false,
    canApproveLeaves: false,
    canDeleteLeaves: false,
    canExportData: false,
    canViewHistory: true
  });

  
  
  
  let socketContext = { isConnected: false, onNewLeave: () => {}, onLeaveStatusChanged: () => {}, onLeaveDeleted: () => {}, joinLeaveRoom: () => {}, leaveLeaveRoom: () => {} };
  let notificationContext = { showToast: () => {} };
  
  try {
    socketContext = useSocket() || socketContext;
    notificationContext = useNotification() || notificationContext;
  } catch (error) {
    console.warn("Socket or Notification context not available:", error);
  }
  
  const { 
    onNewLeave, 
    onLeaveStatusChanged, 
    onLeaveDeleted,
    joinLeaveRoom,
    leaveLeaveRoom,
    isConnected 
  } = socketContext;
  
  const { showToast } = notificationContext;

  
  
  
  const showSnackbar = useCallback((message, type = "success") => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 4000);
  }, []);

  const updateStats = useCallback((leavesData) => {
    const pending = leavesData.filter(l => l?.status === 'Pending').length;
    const approved = leavesData.filter(l => l?.status === 'Approved').length;
    const rejected = leavesData.filter(l => l?.status === 'Rejected').length;
    
    setStats({
      total: leavesData.length,
      pending,
      approved,
      rejected,
    });
  }, []);

  const getDepartmentName = useCallback((dept) => {
    if (!dept) return null;
    
    if (typeof dept === 'object') {
      if (dept.name) return dept.name;
      if (dept.departmentName) return dept.departmentName;
      if (dept._id && departmentMap[dept._id]) return departmentMap[dept._id];
    }
    
    if (typeof dept === 'string') {
      if (departmentMap[dept]) {
        return departmentMap[dept];
      }
      
      const foundDept = departments.find(d => (d._id || d.id) === dept);
      if (foundDept) {
        return foundDept.name || foundDept.departmentName || foundDept.title;
      }
      
      if (!dept.match(/^[0-9a-f]{24}$/i)) {
        return dept;
      }
    }
    
    return null;
  }, [departmentMap, departments]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Invalid Date";
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch {
      return 0;
    }
  };

  const getLeaveTypeClass = (type) => {
    if (!type) return "";
    const typeLower = type.toLowerCase();
    if (typeLower === 'casual') return 'EmppLeaves-leave-type-casual';
    if (typeLower === 'sick') return 'EmppLeaves-leave-type-sick';
    if (typeLower === 'paid') return 'EmppLeaves-leave-type-paid';
    if (typeLower === 'unpaid') return 'EmppLeaves-leave-type-unpaid';
    return "";
  };

  const getStatusClass = (status) => {
    if (!status) return "";
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'EmppLeaves-status-pending';
    if (statusLower === 'approved') return 'EmppLeaves-status-approved';
    if (statusLower === 'rejected') return 'EmppLeaves-status-rejected';
    return "";
  };

  const getRowClass = (status) => {
    if (!status) return "";
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'EmppLeaves-row-pending';
    if (statusLower === 'approved') return 'EmppLeaves-row-approved';
    if (statusLower === 'rejected') return 'EmppLeaves-row-rejected';
    return "";
  };

  const getWhatsAppLink = (phoneNumber, userName, status, remarks) => {
    if (!phoneNumber) return "#";
    const message = `Hello ${userName},\n\nYour leave request has been ${status?.toLowerCase() || 'updated'}.\n${remarks ? `Remarks: ${remarks}\n` : ''}\nThank you.`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
  };

  const normalizeRole = (role) => {
    if (!role) return 'Employee';
    const r = role.toLowerCase();
    if (r === 'hr') return 'HR Manager';
    if (r === 'admin') return 'Administrator';
    if (r === 'superadmin') return 'Super Admin';
    if (r === 'manager') return 'Team Manager';
    if (r === 'owner') return 'Company Owner';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  
  const getUserName = (userId) => {
    if (!userId) return "System";
    
    
    if (typeof userId === 'string' && !userId.match(/^[0-9a-f]{24}$/i)) {
      return userId;
    }
    
    
    if (typeof userId === 'object' && userId?.name) {
      return userId.name;
    }
    
    
    const id = typeof userId === 'object' ? userId?._id || userId?.id : userId;
    
    
    if (usersMap[id]) {
      return usersMap[id].name || usersMap[id].username || 'User';
    }
    
    
    if (id === currentUserId) {
      return currentUserName;
    }
    
    return "System";
  };

  const getApprovalUser = (step) => step?.user || {};

  const getApprovalUserId = (step) => {
    const user = getApprovalUser(step);
    return String(user?._id || user?.id || user || "");
  };

  const hasApprovalWorkflow = (leave) => Array.isArray(leave?.approvalSteps) && leave.approvalSteps.length > 0;

  const isCurrentUserPendingApprover = (leave) => {
    if (!hasApprovalWorkflow(leave)) return false;
    return leave.approvalSteps.some((step) =>
      getApprovalUserId(step) === String(currentUserId) && (step.status || "Pending") === "Pending"
    );
  };

  const ApprovalWorkflow = ({ leave }) => {
    if (!hasApprovalWorkflow(leave)) {
      const approvedByName = getUserName(leave?.approvedBy);
      return (
        <div className="EmppLeaves-approved-by">
          {approvedByName}
          {leave?.approvedBy?.role && approvedByName !== 'System' && (
            <span className="EmppLeaves-approver-role">
              ({normalizeRole(leave.approvedBy.role)})
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="EmppLeaves-approval-flow">
        {leave.approvalSteps.map((step, index) => {
          const user = getApprovalUser(step);
          const status = step.status || "Pending";
          return (
            <div className={`EmppLeaves-approval-step EmppLeaves-approval-step-${status.toLowerCase()}`} key={getApprovalUserId(step) || index}>
              <span className="EmppLeaves-approval-name">{user?.name || "User"}</span>
              <span className="EmppLeaves-approval-status">{status}</span>
            </div>
          );
        })}
      </div>
    );
  };

  
  
  
  const canModifyLeave = useCallback(() => {
    return isOwner || isAdmin || isHR || isManager;
  }, [isOwner, isAdmin, isHR, isManager]);

  const canDeleteLeave = useCallback(() => {
    if (deletePermissionUserIds.length > 0) {
      return deletePermissionUserIds.includes(String(currentUserId));
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return isOwner || isAdmin || isHR || isManager || user.jobRole === "superadmin";
  }, [deletePermissionUserIds, currentUserId, isOwner, isAdmin, isHR, isManager]);

  const canApproveLeave = useCallback((leave = null) => {
    if (leave && hasApprovalWorkflow(leave)) {
      return isCurrentUserPendingApprover(leave);
    }

    return isOwner || isAdmin || isHR || isManager;
  }, [isOwner, isAdmin, isHR, isManager, currentUserId]);

  
  
  
  const fetchCurrentUserAndCompany = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        void 0;
        return;
      }

      const user = JSON.parse(userStr);
      
      const userId = user._id || user.id || '';
      const companyId = user.company || user.companyId || '';
      const department = user.department || '';
      const name = user.name || user.username || 'User';
      let role = '';
      
      if (user.companyRole) {
        role = user.companyRole;
      } else if (user.role) {
        role = user.role;
      }
      
      setCurrentUser(user);
      setCurrentUserId(userId);
      setCurrentUserCompanyId(companyId);
      setCurrentUserDepartment(department);
      setCurrentUserName(name);
      setCurrentUserRole(role);
      
      const isOwnerRole = role === 'Owner' || role === 'owner' || role === 'OWNER';
      const isAdminRole = role === 'Admin' || role === 'admin' || role === 'ADMIN';
      const isHRRole = role === 'HR' || role === 'hr' || role === 'Hr';
      const isManagerRole = role === 'Manager' || role === 'manager' || role === 'MANAGER';
      
      setIsOwner(isOwnerRole);
      setIsAdmin(isAdminRole);
      setIsHR(isHRRole);
      setIsManager(isManagerRole);
      
      setPermissions({
        canViewAllLeaves: isOwnerRole || isAdminRole || isHRRole,
        canApproveLeaves: isOwnerRole || isAdminRole || isHRRole || isManagerRole,
        canDeleteLeaves: isOwnerRole || isAdminRole || isHRRole || isManagerRole,
        canExportData: isOwnerRole || isAdminRole || isHRRole,
        canViewHistory: true
      });
      
    } catch (error) {
      console.error("Error parsing user data:", error);
      showSnackbar("Error loading user data", "error");
    }
  }, [showSnackbar]);

  const fetchCompanyDetails = useCallback(async () => {
    if (!currentUserCompanyId) return;
    
    try {
      let response;
      
      {
        try {
          response = await axios.get(`/company/${currentUserCompanyId}`);
        } catch (err2) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          setCompanyName(user.companyName || 'Company');
          return;
        }
      }
      
      if (response.data) {
        if (response.data.success && response.data.data) {
          setCompanyName(response.data.data.name || response.data.data.companyName);
        } else if (response.data.name) {
          setCompanyName(response.data.name);
        } else if (response.data.companyName) {
          setCompanyName(response.data.companyName);
        }
      }
    } catch (error) {
      console.error("Failed to fetch company details:", error);
      setCompanyName('Company');
    }
  }, [currentUserCompanyId]);

  const fetchDepartments = useCallback(async () => {
    if (!currentUserCompanyId) return;
    
    setLoadingDepartments(true);
    try {
      const response = await axios.get(`/departments?company=${currentUserCompanyId}`);
      
      let departmentsData = [];
      let departmentMapping = {};
      
      if (response.data?.success && response.data.data) {
        departmentsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        departmentsData = response.data;
      } else if (response.data?.departments) {
        departmentsData = response.data.departments;
      }
      
      departmentsData.forEach(dept => {
        const deptId = dept._id || dept.id;
        const deptName = dept.name || dept.departmentName || dept.title || 'Unknown';
        if (deptId) {
          departmentMapping[deptId] = deptName;
        }
      });
      
      setDepartmentMap(departmentMapping);
      setDepartments(departmentsData);
      
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      showSnackbar("Error loading departments", "error");
    } finally {
      setLoadingDepartments(false);
    }
  }, [currentUserCompanyId, showSnackbar]);

  const fetchCompanyUsers = useCallback(async () => {
    if (!currentUserCompanyId) return;
    
    try {
      let endpoint = '';
      
      if (isOwner) {
        endpoint = `/users/company-users?companyId=${currentUserCompanyId}`;
      } else {
        endpoint = `/users/department-users?department=${currentUserDepartment}`;
      }
      
      const res = await axios.get(endpoint);
      
      let usersData = [];
      
      if (res.data?.success) {
        if (res.data.message?.users && Array.isArray(res.data.message.users)) {
          usersData = res.data.message.users;
        } else if (res.data.users && Array.isArray(res.data.users)) {
          usersData = res.data.users;
        } else if (res.data.message && Array.isArray(res.data.message)) {
          usersData = res.data.message;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          usersData = res.data.data;
        } else if (Array.isArray(res.data)) {
          usersData = res.data;
        }
      }
      
      setAllUsers(usersData);
      
      
      const map = {};
      usersData.forEach(user => {
        const id = user._id || user.id;
        if (id) {
          map[id] = user;
        }
      });
      setUsersMap(map);
      
      const deptFromUsers = {};
      usersData.forEach(user => {
        if (user.department && typeof user.department === 'object') {
          if (user.department._id && user.department.name) {
            deptFromUsers[user.department._id] = user.department.name;
          }
        } else if (user.departmentId && user.departmentName) {
          deptFromUsers[user.departmentId] = user.departmentName;
        }
      });
      
      setDepartmentMap(prev => ({ ...prev, ...deptFromUsers }));
      
    } catch (err) {
      console.error("Failed to load users", err);
      showSnackbar("Error loading users data", "error");
    }
  }, [currentUserCompanyId, currentUserDepartment, isOwner, showSnackbar]);

  const fetchLeavePagePermissions = useCallback(async () => {
    try {
      const res = await axios.get("/page-permissions/by-path", {
        params: { path: "/ciisUser/emp-leaves" }
      });
      const ids = (res.data?.page?.deleteUsers || [])
        .map(user => String(user?._id || user?.id || user))
        .filter(Boolean);
      setDeletePermissionUserIds(ids);
    } catch (error) {
      console.error("Failed to load leave page permissions:", error);
      setDeletePermissionUserIds([]);
    }
  }, []);

  const fetchLeaves = useCallback(async () => {
    if (!currentUserCompanyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('company', currentUserCompanyId);
      
      if (!isOwner) {
        if (currentUserDepartment) {
          params.append('department', currentUserDepartment);
        }
      } else {
        if (departmentFilter && departmentFilter !== 'all') {
          params.append('department', departmentFilter);
        }
      }
      
      if (filterDate) params.append('date', filterDate);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (leaveTypeFilter !== 'all') params.append('type', leaveTypeFilter);
      
      const queryString = params.toString();
      const endpoint = `/leaves/all${queryString ? `?${queryString}` : ''}`;
      
      const res = await axios.get(endpoint);
      
      let data = [];
      if (res.data?.data?.leaves) {
        data = res.data.data.leaves;
      } else if (res.data?.leaves) {
        data = res.data.leaves;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.success && Array.isArray(res.data.message)) {
        data = res.data.message;
      }
      
      if (!isOwner && currentUserDepartment) {
        data = data.filter(leave => {
          const leaveDept = leave.user?.department?._id || 
                           leave.user?.department || 
                           leave.department;
          return leaveDept === currentUserDepartment;
        });
      }
      
      setLeaves(data);
      updateStats(data);
      
    } catch (err) {
      console.error("Failed to load leaves", err);
      
      if (err.response?.status === 403) {
        showSnackbar("Access denied - Please contact administrator", "error");
      } else if (err.response?.status === 404) {
        showSnackbar("No leaves found", "info");
      } else {
        showSnackbar("Error loading leave data", "error");
      }
      
      setLeaves([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  }, [
    currentUserCompanyId, 
    isOwner, 
    currentUserDepartment, 
    departmentFilter, 
    filterDate, 
    statusFilter, 
    leaveTypeFilter, 
    updateStats, 
    showSnackbar
  ]);

  
  
  
  useEffect(() => {
    fetchCurrentUserAndCompany();
  }, [fetchCurrentUserAndCompany]);

  useEffect(() => {
    if (currentUserCompanyId) {
      fetchCompanyDetails();
      fetchDepartments();
      fetchCompanyUsers();
      fetchLeavePagePermissions();
    }
  }, [currentUserCompanyId, fetchCompanyDetails, fetchDepartments, fetchCompanyUsers, fetchLeavePagePermissions]);

  useEffect(() => {
    if (currentUserCompanyId && currentUserDepartment !== undefined) {
      fetchLeaves();
    }
  }, [
    currentUserCompanyId, 
    currentUserDepartment, 
    filterDate, 
    statusFilter, 
    leaveTypeFilter, 
    departmentFilter,
    isOwner,
    fetchLeaves
  ]);

  
  
  
  useEffect(() => {
    if (!currentUserId || !onNewLeave || !onLeaveStatusChanged || !onLeaveDeleted) return;

    const unsubscribeNewLeave = onNewLeave((data) => {
      const newLeave = data.data;
      
      const shouldShow = isOwner || 
        (newLeave.user?.department?._id === currentUserDepartment) ||
        (newLeave.user?.department === currentUserDepartment) ||
        (newLeave.department === currentUserDepartment);
      
      if (shouldShow) {
        setLeaves(prev => {
          const exists = prev.some(l => l._id === newLeave._id);
          if (!exists) {
            const updated = [newLeave, ...prev];
            updateStats(updated);
            
            if (showToast) {
              showToast(
                `New leave request from ${newLeave.user?.name || 'Unknown'}`,
                'info',
                5000
              );
            }
            
            return updated;
          }
          return prev;
        });
        
        if (joinLeaveRoom) {
          joinLeaveRoom(newLeave._id);
        }
      }
    });

    const unsubscribeStatusChange = onLeaveStatusChanged((data) => {
      const { leaveId, newStatus } = data.data;
      
      setLeaves(prev => {
        const updated = prev.map(leave => {
          if (leave._id === leaveId) {
            return { ...leave, status: newStatus };
          }
          return leave;
        });
        
        updateStats(updated);
        
        const leave = prev.find(l => l._id === leaveId);
        if (leave && showToast) {
          const message = `Leave request from ${leave.user?.name} changed to ${newStatus}`;
          showToast(message, newStatus === 'Approved' ? 'success' : 'warning', 4000);
        }
        
        return updated;
      });
    });

    const unsubscribeDelete = onLeaveDeleted((data) => {
      const { leaveId } = data.data;
      
      setLeaves(prev => {
        const filtered = prev.filter(leave => leave._id !== leaveId);
        updateStats(filtered);
        
        if (showToast) {
          showToast('A leave request has been deleted', 'warning', 3000);
        }
        
        return filtered;
      });
      
      if (leaveLeaveRoom) {
        leaveLeaveRoom(leaveId);
      }
    });

    leaves.forEach(leave => {
      if (joinLeaveRoom) {
        joinLeaveRoom(leave._id);
      }
    });

    return () => {
      unsubscribeNewLeave?.();
      unsubscribeStatusChange?.();
      unsubscribeDelete?.();
      
      leaves.forEach(leave => {
        if (leaveLeaveRoom) {
          leaveLeaveRoom(leave._id);
        }
      });
    };
  }, [currentUserId, isOwner, currentUserDepartment, leaves, onNewLeave, onLeaveStatusChanged, onLeaveDeleted, joinLeaveRoom, leaveLeaveRoom, updateStats, showToast]);

  
  
  
  const filteredLeaves = useMemo(() => {
    let filtered = leaves;

    if (searchTerm) {
      filtered = filtered.filter(
        (leave) =>
          leave.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leave.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leave.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leave.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (getDepartmentName(leave.user?.department) || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [leaves, searchTerm, getDepartmentName]);

  const pendingLeaves = useMemo(() => 
    filteredLeaves.filter(leave => leave?.status === 'Pending'),
    [filteredLeaves]
  );

  const otherLeaves = useMemo(() => 
    filteredLeaves.filter(leave => leave?.status !== 'Pending'),
    [filteredLeaves]
  );

  const leavePendingDelete = useMemo(() => {
    if (!deleteDialog) return null;
    if (typeof deleteDialog === 'object') return deleteDialog;
    return leaves.find(leave => leave._id === deleteDialog) || null;
  }, [deleteDialog, leaves]);

  const handleActionMenuToggle = useCallback((leaveId, event) => {
    if (event.currentTarget.open) {
      setOpenActionMenuId(leaveId);
      return;
    }

    setOpenActionMenuId((currentId) => (currentId === leaveId ? null : currentId));
  }, []);

  
  
  
  const openStatusDialog = (leaveId, newStatus, userEmail, userName, userPhone, userId, currentStatus, leave = null) => {
    if (!canApproveLeave(leave)) {
      showSnackbar("Access Denied: You don't have permission to update leave status", "error");
      return;
    }
    
    setStatusDialog({
      open: true,
      leaveId,
      newStatus,
      remarks: "",
      userEmail,
      userName,
      userPhone,
      userId,
      currentStatus
    });
  };

  const closeStatusDialog = () => {
    setStatusDialog({
      open: false,
      leaveId: null,
      newStatus: null,
      remarks: "",
      userEmail: "",
      userName: "",
      userPhone: "",
      userId: null,
      currentStatus: ""
    });
  };

  const confirmStatusChange = async () => {
    const { leaveId, newStatus, remarks, userName, userPhone } = statusDialog;
    
    if (!leaveId || !newStatus) {
      showSnackbar("Invalid leave data", "error");
      return;
    }

    try {
      const res = await axios.patch(`/leaves/status/${leaveId}`, {
        status: newStatus,
        remarks
      });
      
      if (res.data.success || res.data.message) {
        showSnackbar(res.data.message || `Leave ${newStatus.toLowerCase()} successfully`, "success");
        
        await fetchLeaves();
        closeStatusDialog();
        
        if (userPhone) {
          setTimeout(() => {
            const whatsappLink = getWhatsAppLink(userPhone, userName, newStatus, remarks);
            window.open(whatsappLink, '_blank');
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Failed to update status", err);
      if (err.response?.status === 403) {
        showSnackbar(err.response.data.error || "You don't have permission", "error");
      } else if (err.response?.status === 400) {
        showSnackbar(err.response.data.error || "Invalid status value", "error");
      } else if (err.response?.status === 404) {
        showSnackbar("Leave not found", "error");
      } else {
        showSnackbar("Failed to update leave status", "error");
      }
    }
  };

  const handleDeleteLeave = async (leaveId) => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const leave = leaves.find(l => l._id === leaveId);
    if (!leave) return;

    if (!canDeleteLeave()) {
      showSnackbar("Access Denied: You don't have permission to delete leave requests", "error");
      setDeleteDialog(null);
      return;
    }

    const res = await axios.delete(`/leaves/${leaveId}`, {
      headers: {
        "x-user-company-role": user.companyRole,
        "x-user-job-role": user.jobRole
      }
    });

    if (res.data.success || res.data.message) {
      showSnackbar("Leave deleted successfully", "success");

      setLeaves(prev => {
        const updated = prev.filter(l => l._id !== leaveId);
        updateStats(updated);
        return updated;
      });

      setDeleteDialog(null);
    }

  } catch (err) {
    console.error("Failed to delete leave", err);

    if (err.response?.status === 403) {
      showSnackbar(err.response.data.error || "Permission denied", "error");
    } else {
      showSnackbar("Failed to delete leave", "error");
    }
  }
};

  const openHistoryDialog = (leave) => {
    const history = leave.history || [];
    
    if (history.length === 0) {
      
      setHistoryDialog({
        open: true,
        title: `${leave.user?.name || 'Employee'} — ${leave.type || ''} Leave`,
        items: [{
          action: leave.status || 'Pending',
          from: 'N/A',
          to: leave.status || 'Pending',
          by: getUserName(leave.approvedBy),
          byName: getUserName(leave.approvedBy),
          byRole: leave.approvedBy?.role || 'System',
          at: leave.updatedAt || leave.createdAt,
          remarks: leave.remarks || '',
        }],
      });
      return;
    }
    
    
    const processedHistory = history.map(item => {
      let byName = item.byName;
      
      if (item.by) {
        byName = getUserName(item.by);
      }
      
      return {
        ...item,
        byName: byName || 'System',
        byRole: item.byRole || 'System',
      };
    });
    
    setHistoryDialog({
      open: true,
      title: `${leave.user?.name || 'Employee'} — ${leave.type || ''} Leave`,
      items: processedHistory,
    });
  };

  const closeHistoryDialog = () => {
    setHistoryDialog({
      open: false,
      title: "",
      items: [],
    });
  };

  const openDetailsModal = (leave) => {
    setDetailsModal({
      open: true,
      leave
    });
  };

  const closeDetailsModal = () => {
    setDetailsModal({
      open: false,
      leave: null
    });
  };

  const clearFilters = () => {
    setFilterDate("");
    setStatusFilter("All");
    setLeaveTypeFilter("all");
    setDepartmentFilter("all");
    setSearchTerm("");
    setSelectedStat("All");
  };

  const exportData = async () => {
    if (!permissions.canExportData) {
      showSnackbar("You don't have permission to export data", "error");
      return;
    }
    
    try {
      showSnackbar("Preparing export...", "info");
      
      const params = new URLSearchParams();
      params.append('company', currentUserCompanyId);
      
      if (!isOwner && currentUserDepartment) {
        params.append('department', currentUserDepartment);
      } else if (departmentFilter !== 'all') {
        params.append('department', departmentFilter);
      }
      
      if (filterDate) params.append('date', filterDate);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      
      const response = await axios.get(`/leaves/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leaves_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSnackbar("Export completed successfully", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showSnackbar("Export feature is being implemented", "info");
    }
  };

  const handleStatFilter = (type) => {
    setSelectedStat(prev => (prev === type ? 'All' : type));
    setStatusFilter(type === 'All' ? 'All' : type);
  };

  
  
  
  const RoleBadge = () => {
    if (!currentUserRole) return null;
    
    let badgeClass = 'EmppLeaves-role-badge';
    let icon = <FiUser size={12} />;
    
    if (isOwner) {
      badgeClass += ' EmppLeaves-role-badge-owner';
      icon = <FiShield size={12} />;
    } else if (isAdmin) {
      badgeClass += ' EmppLeaves-role-badge-admin';
      icon = <FiShield size={12} />;
    } else if (isHR) {
      badgeClass += ' EmppLeaves-role-badge-hr';
    } else if (isManager) {
      badgeClass += ' EmppLeaves-role-badge-manager';
    }
    
    return (
      <span className={badgeClass}>
        {icon}
        {normalizeRole(currentUserRole)}
      </span>
    );
  };

  
  
  
  const LeaveDetailsModal = ({ leave, onClose }) => {
    if (!leave) return null;

    const days = calculateDays(leave.startDate, leave.endDate);
    const createdDate = leave.createdAt ? formatDateTime(leave.createdAt) : "N/A";
    const updatedDate = leave.updatedAt ? formatDateTime(leave.updatedAt) : "N/A";
    const departmentName = getDepartmentName(leave.user?.department);
    const approvedByName = getUserName(leave.approvedBy);

    return (
      <div className="EmppLeaves-dialog-overlay" onClick={onClose}>
        <div className="EmppLeaves-dialog-content EmppLeaves-details-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="EmppLeaves-dialog-header">
            <div className="EmppLeaves-dialog-header-left">
              <FiFileText size={24} color="#1976d2" />
              <h3>Leave Request Details</h3>
            </div>
            <button className="EmppLeaves-dialog-close" onClick={onClose}>
              <FiX size={20} />
            </button>
          </div>
          
          <div className="EmppLeaves-dialog-body">
            <div className={`EmppLeaves-details-status-banner EmppLeaves-status-${leave.status?.toLowerCase() || 'pending'}`}>
              <FiInfo size={20} />
              <span>This leave request is <strong>{leave.status || 'Pending'}</strong></span>
            </div>

            <div className="EmppLeaves-details-grid-container">
              <div className="EmppLeaves-details-column">
                <div className="EmppLeaves-details-card EmppLeaves-employee-card">
                  <div className="EmppLeaves-card-header">
                    <FiUserCheck size={18} color="#1976d2" />
                    <h4>Employee Information</h4>
                  </div>
                  <div className="EmppLeaves-card-content">
                    <div className="EmppLeaves-employee-profile">
                      <div className="EmppLeaves-profile-avatar">
                        {getInitials(leave.user?.name)}
                      </div>
                      <div className="EmppLeaves-profile-info">
                        <div className="EmppLeaves-profile-name">{leave.user?.name || "N/A"}</div>
                        <div className="EmppLeaves-profile-email">{leave.user?.email || "N/A"}</div>
                      </div>
                    </div>
                    
                    <div className="EmppLeaves-info-rows">
                      <div className="EmppLeaves-info-row">
                        <FiMail size={14} className="EmppLeaves-info-icon" />
                        <span className="EmppLeaves-info-label">Email:</span>
                        <span className="EmppLeaves-info-value">{leave.user?.email || "N/A"}</span>
                      </div>
                      {leave.user?.phone && (
                        <div className="EmppLeaves-info-row">
                          <FiPhone size={14} className="EmppLeaves-info-icon" />
                          <span className="EmppLeaves-info-label">Phone:</span>
                          <span className="EmppLeaves-info-value">
                            <a 
                              href={getWhatsAppLink(
                                leave.user.phone, 
                                leave.user.name, 
                                leave.status, 
                                leave.remarks
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {leave.user.phone}
                            </a>
                          </span>
                        </div>
                      )}
                      {departmentName && (
                        <div className="EmppLeaves-info-row">
                          <FiHome size={14} className="EmppLeaves-info-icon" />
                          <span className="EmppLeaves-info-label">Department:</span>
                          <span className="EmppLeaves-info-value">
                            <span className="EmppLeaves-department-tag">
                              {departmentName}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="EmppLeaves-details-card EmppLeaves-leave-card">
                  <div className="EmppLeaves-card-header">
                    <FiCalendarIcon size={18} color="#1976d2" />
                    <h4>Leave Information</h4>
                  </div>
                  <div className="EmppLeaves-card-content">
                    <div className="EmppLeaves-info-grid">
                      <div className="EmppLeaves-grid-item">
                        <span className="EmppLeaves-grid-label">Leave Type</span>
                        <span className={`EmppLeaves-leave-type-badge ${getLeaveTypeClass(leave.type)}`}>
                          {leave.type || "N/A"}
                        </span>
                      </div>
                      <div className="EmppLeaves-grid-item">
                        <span className="EmppLeaves-grid-label">Status</span>
                        <span className={`EmppLeaves-status-badge ${getStatusClass(leave.status)}`}>
                          {leave.status || "Pending"}
                        </span>
                      </div>
                      <div className="EmppLeaves-grid-item">
                        <span className="EmppLeaves-grid-label">Start Date</span>
                        <span className="EmppLeaves-grid-value">{formatDate(leave.startDate)}</span>
                      </div>
                      <div className="EmppLeaves-grid-item">
                        <span className="EmppLeaves-grid-label">End Date</span>
                        <span className="EmppLeaves-grid-value">{formatDate(leave.endDate)}</span>
                      </div>
                      <div className="EmppLeaves-grid-item EmppLeaves-full-width">
                        <span className="EmppLeaves-grid-label">Duration</span>
                        <span className="EmppLeaves-duration-badge">
                          <FiClock size={14} />
                          {days} {days > 1 ? 'Calendar Days' : 'Calendar Day'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="EmppLeaves-details-column">
                <div className="EmppLeaves-details-card EmppLeaves-reason-card">
                  <div className="EmppLeaves-card-header">
                    <FiMessageSquare size={18} color="#1976d2" />
                    <h4>Reason for Leave</h4>
                  </div>
                  <div className="EmppLeaves-card-content">
                    <div className="EmppLeaves-reason-box">
                      {leave.reason || "No reason provided"}
                    </div>
                  </div>
                </div>

                {leave.remarks && (
                  <div className="EmppLeaves-details-card EmppLeaves-remarks-card">
                    <div className="EmppLeaves-card-header">
                      <FiAlertCircle size={18} color="#1976d2" />
                      <h4>Admin Remarks</h4>
                    </div>
                    <div className="EmppLeaves-card-content">
                      <div className="EmppLeaves-remarks-box">
                        {leave.remarks}
                      </div>
                    </div>
                  </div>
                )}

                {(leave.status !== 'Pending' || hasApprovalWorkflow(leave)) && (
                  <div className="EmppLeaves-details-card EmppLeaves-approval-card">
                    <div className="EmppLeaves-card-header">
                      <FiCheckSquare size={18} color="#1976d2" />
                      <h4>Approval Information</h4>
                    </div>
                    <div className="EmppLeaves-card-content">
                      {hasApprovalWorkflow(leave) ? (
                        <ApprovalWorkflow leave={leave} />
                      ) : (
                        <div className="EmppLeaves-info-rows">
                        <div className="EmppLeaves-info-row">
                          <FiUser size={14} className="EmppLeaves-info-icon" />
                          <span className="EmppLeaves-info-label">Decision By:</span>
                          <span className="EmppLeaves-info-value">
                            {approvedByName}
                          </span>
                        </div>
                        {leave.approvedBy?.role && (
                          <div className="EmppLeaves-info-row">
                            <FiShield size={14} className="EmppLeaves-info-icon" />
                            <span className="EmppLeaves-info-label">Role:</span>
                            <span className="EmppLeaves-info-value">{normalizeRole(leave.approvedBy.role)}</span>
                          </div>
                        )}
                        <div className="EmppLeaves-info-row">
                          <FiClockIcon size={14} className="EmppLeaves-info-icon" />
                          <span className="EmppLeaves-info-label">Decision At:</span>
                          <span className="EmppLeaves-info-value">{formatDateTime(leave.updatedAt)}</span>
                        </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="EmppLeaves-details-card EmppLeaves-timestamps-card">
                  <div className="EmppLeaves-card-header">
                    <FiClock size={18} color="#1976d2" />
                    <h4>Timestamps</h4>
                  </div>
                  <div className="EmppLeaves-card-content">
                    <div className="EmppLeaves-info-rows">
                      <div className="EmppLeaves-info-row">
                        <FiCalendar size={14} className="EmppLeaves-info-icon" />
                        <span className="EmppLeaves-info-label">Created:</span>
                        <span className="EmppLeaves-info-value">{createdDate}</span>
                      </div>
                      <div className="EmppLeaves-info-row">
                        <FiRefreshCw size={14} className="EmppLeaves-info-icon" />
                        <span className="EmppLeaves-info-label">Last Updated:</span>
                        <span className="EmppLeaves-info-value">{updatedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="EmppLeaves-dialog-footer">
            <button className="EmppLeaves-btn EmppLeaves-btn-outlined" onClick={onClose}>
              Close
            </button>
            {leave.status === 'Pending' && canApproveLeave(leave) && (
              <div className="EmppLeaves-footer-actions">
                <button 
                  className="EmppLeaves-btn EmppLeaves-btn-success"
                  onClick={() => {
                    onClose();
                    openStatusDialog(
                      leave._id,
                      'Approved',
                      leave.user?.email,
                      leave.user?.name,
                      leave.user?.phone,
                      leave.user?._id,
                      leave.status,
                      leave
                    );
                  }}
                >
                  <FiCheckCircle size={16} />
                  Approve
                </button>
                <button 
                  className="EmppLeaves-btn EmppLeaves-btn-error"
                  onClick={() => {
                    onClose();
                    openStatusDialog(
                      leave._id,
                      'Rejected',
                      leave.user?.email,
                      leave.user?.name,
                      leave.user?.phone,
                      leave.user?._id,
                      leave.status,
                      leave
                    );
                  }}
                >
                  <FiXCircle size={16} />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  
  
  
  const renderLeaveTable = (title, leavesData, showStatusColumn = true) => (
    <div className="EmppLeaves-leaves-table-container">
      <div className="EmppLeaves-table-header">
        <h3 className="EmppLeaves-table-title">
          {title} ({leavesData.length})
          {title === 'Pending Leaves' && canApproveLeave() && (
            <span className="EmppLeaves-action-required-badge">Action Required</span>
          )}
        </h3>
        {isConnected && (
          <span className="EmppLeaves-socket-badge">
            <FiBell size={14} />
            Live
          </span>
        )}
      </div>
      
      <div className="EmppLeaves-table-responsive">
        <table className="EmppLeaves-leaves-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Leave Details</th>
              <th>Duration</th>
              {showStatusColumn && <th>Status</th>}
              <th>Approval Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leavesData.length > 0 ? (
              leavesData.map((leave, index) => {
                const days = calculateDays(leave.startDate, leave.endDate);
                const userId = leave.user?._id || leave.user;
                const isOwnLeave = userId === currentUserId;
                const departmentName = getDepartmentName(leave.user?.department);
                const reasonPreview = leave.reason 
                  ? leave.reason.length > 40 
                    ? `${leave.reason.substring(0, 40)}...` 
                    : leave.reason
                  : "No reason provided";
                const canApproveThisLeave = leave.status === 'Pending' && canApproveLeave(leave);
                const canDeleteThisLeave = canDeleteLeave();
                
                return (
                  <tr key={leave._id} className={`${getRowClass(leave.status)} ${isOwnLeave ? 'EmppLeaves-own-leave-row' : ''}`}>
                    <td>
                      <div className="EmppLeaves-employee-info">
                        <div className="EmppLeaves-employee-avatar">
                          {getInitials(leave.user?.name)}
                          {isOwnLeave && <span className="EmppLeaves-self-badge">You</span>}
                        </div>
                        <div className="EmppLeaves-employee-details">
                          <div className="EmppLeaves-employee-name">
                            {leave.user?.name || "N/A"}
                          </div>
                          <div className="EmppLeaves-employee-email">
                            <FiMail size={12} />
                            {leave.user?.email || "N/A"}
                          </div>
                          {leave.user?.phone && (
                            <div className="EmppLeaves-employee-phone">
                              <FiPhone size={12} />
                              <a 
                                href={getWhatsAppLink(
                                  leave.user.phone, 
                                  leave.user.name, 
                                  leave.status, 
                                  leave.remarks
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {leave.user.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {departmentName ? (
                        <div className="EmppLeaves-department-info">
                          <FiHome size={14} />
                          {departmentName}
                        </div>
                      ) : (
                        <span className="EmppLeaves-text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="EmppLeaves-leave-details">
                        <div className="EmppLeaves-leave-type-wrapper">
                          <span className={`EmppLeaves-leave-type-chip ${getLeaveTypeClass(leave.type)}`}>
                            {leave.type || "N/A"}
                          </span>
                        </div>
                        
                        <div className="EmppLeaves-leave-reason-preview">
                          {reasonPreview}
                        </div>
                        
                        <button 
                          className="EmppLeaves-view-details-button"
                          onClick={() => openDetailsModal(leave)}
                        >
                          <FiEye size={16} />
                          View Full Details
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="EmppLeaves-duration-info">
                        <div className="EmppLeaves-date-range">
                          {formatDate(leave.startDate)}
                        </div>
                        <div className="EmppLeaves-date-separator">→</div>
                        <div className="EmppLeaves-date-range">
                          {formatDate(leave.endDate)}
                        </div>
                        <div className="EmppLeaves-days-badge">
                          <FiClock size={12} />
                          {days} {days > 1 ? 'days' : 'day'}
                        </div>
                      </div>
                    </td>
                    {showStatusColumn && (
                      <td>
                        <span className={`EmppLeaves-status-chip ${getStatusClass(leave.status)}`}>
                          {leave.status || "Pending"}
                        </span>
                      </td>
                    )}
                    <td>
                      <ApprovalWorkflow leave={leave} />
                    </td>
                    <td>
                      <details
                        className="EmppLeaves-actions-dropdown"
                        open={openActionMenuId === leave._id}
                        onToggle={(event) => handleActionMenuToggle(leave._id, event)}
                      >
                        <summary className="EmppLeaves-actions-trigger">
                          <FiMoreVertical size={16} />
                          <span>Actions</span>
                        </summary>
                        
                        <div className="EmppLeaves-actions-menu">
                          <button
                            className="EmppLeaves-action-menu-item EmppLeaves-view-history"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              openHistoryDialog(leave);
                            }}
                          >
                            <FiList size={16} />
                            <span>History</span>
                          </button>

                          {canApproveThisLeave && (
                            <>
                              <button
                                className="EmppLeaves-action-menu-item EmppLeaves-approve"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  openStatusDialog(
                                    leave._id,
                                    'Approved',
                                    leave.user?.email,
                                    leave.user?.name,
                                    leave.user?.phone,
                                    userId,
                                    leave.status,
                                    leave
                                  );
                                }}
                              >
                                <FiCheckCircle size={16} />
                                <span>Approve</span>
                              </button>
                              <button
                                className="EmppLeaves-action-menu-item EmppLeaves-reject"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  openStatusDialog(
                                    leave._id,
                                    'Rejected',
                                    leave.user?.email,
                                    leave.user?.name,
                                    leave.user?.phone,
                                    userId,
                                    leave.status,
                                    leave
                                  );
                                }}
                              >
                                <FiXCircle size={16} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {canDeleteThisLeave && (
                            <button
                              className="EmppLeaves-action-menu-item EmppLeaves-delete"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                setDeleteDialog(leave);
                              }}
                            >
                              <FiTrash2 size={16} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={showStatusColumn ? 7 : 6}>
                  <div className="EmppLeaves-empty-state">
                    <div className="EmppLeaves-empty-state-icon">
                      <FiCalendar size={48} />
                    </div>
                    <h4 className="EmppLeaves-empty-state-title">No Leave Requests Found</h4>
                    <p className="EmppLeaves-empty-state-text">
                      {title === 'Pending Leaves' 
                        ? 'No pending leave requests requiring action'
                        : 'Try adjusting your filters or search criteria'
                      }
                    </p>
                    <button 
                      className="EmppLeaves-btn EmppLeaves-btn-contained"
                      onClick={fetchLeaves}
                    >
                      Refresh Data
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  
  
  
  if (loading) {
    return <CIISLoader />;
  }
  
  return (
    <div className="EmppLeaves-employee-leaves">
      <div className="EmppLeaves-leaves-header">
        <div>
          <h1 className="EmppLeaves-leaves-title">
            Leave Management {companyName && `- ${companyName}`}
          </h1>
          <p className="EmppLeaves-leaves-subtitle">
            {isOwner 
              ? "Review and manage employee leave requests with full access"
              : isAdmin || isHR || isManager
              ? "Review and manage employee leave requests"
              : "View all leave requests"
            }
            <RoleBadge />
            
            {!canApproveLeave() && (
              <span className="EmppLeaves-view-only-badge">
                <FiEyeOff size={14} />
                View Only
              </span>
            )}

            {isConnected ? (
              <span className="EmppLeaves-socket-status EmppLeaves-connected">
                <FiBell size={14} />
                Live
              </span>
            ) : (
              <span className="EmppLeaves-socket-status EmppLeaves-disconnected">
                <FiBell size={14} />
                Connecting...
              </span>
            )}
          </p>
        </div>

        <div className="EmppLeaves-header-actions">
          <button 
            className="EmppLeaves-action-button"
            onClick={fetchLeaves}
            disabled={loading}
          >
            <FiRefreshCw size={20} className={loading ? 'EmppLeaves-spinning' : ''} />
          </button>
          
          {permissions.canExportData && (
            <button 
              className="EmppLeaves-action-button"
              onClick={exportData}
            >
              <FiDownload size={20} />
            </button>
          )}
          
          <div className="EmppLeaves-stats-summary">
            <span className="EmppLeaves-stat-item EmppLeaves-pending">
              <FiClock /> {stats.pending}
            </span>
            <span className="EmppLeaves-stat-item EmppLeaves-approved">
              <FiCheckCircle /> {stats.approved}
            </span>
            <span className="EmppLeaves-stat-item EmppLeaves-rejected">
              <FiXCircle /> {stats.rejected}
            </span>
          </div>
        </div>
      </div>

      <div className="EmppLeaves-filter-section">
        <div className="EmppLeaves-filter-header">
          <FiFilter size={20} color="#1976d2" />
          <h3>Filters & Search</h3>
          {isOwner && departmentFilter !== 'all' && (
            <span className="EmppLeaves-owner-filter-badge">
              <FiEye size={14} />
              Filtering: {departments.find(d => (d._id || d.id) === departmentFilter)?.name || departmentFilter}
            </span>
          )}
          {loadingDepartments && <span className="EmppLeaves-loading-badge">Loading departments...</span>}
        </div>
        
        <div className="EmppLeaves-filter-grid">
          <div className="EmppLeaves-filter-group">
            <label className="EmppLeaves-filter-label">Date</label>
            <input
              type="date"
              className="EmppLeaves-filter-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          
          <div className="EmppLeaves-filter-group">
            <label className="EmppLeaves-filter-label">Status</label>
            <StatusFilter
              selected={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          
          <div className="EmppLeaves-filter-group">
            <label className="EmppLeaves-filter-label">Leave Type</label>
            <LeaveTypeFilter
              selected={leaveTypeFilter}
              onChange={setLeaveTypeFilter}
            />
          </div>
          
          {isOwner && (
            <div className="EmppLeaves-filter-group">
              <label className="EmppLeaves-filter-label">Department</label>
              <DepartmentFilter
                selected={departmentFilter}
                onChange={setDepartmentFilter}
                departments={departments}
              />
            </div>
          )}
          
          <div className="EmppLeaves-filter-group EmppLeaves-search-group">
            <label className="EmppLeaves-filter-label">Search</label>
            <div className="EmppLeaves-search-input-wrapper">
              <FiSearch size={18} className="EmppLeaves-search-icon" />
              <input
                type="text"
                className="EmppLeaves-filter-input EmppLeaves-search-input"
                placeholder="Search by name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="EmppLeaves-filter-actions">
            <button 
              className="EmppLeaves-btn EmppLeaves-btn-outlined"
              onClick={clearFilters}
              disabled={loading}
            >
              Clear All
            </button>
            <button 
              className="EmppLeaves-btn EmppLeaves-btn-contained"
              onClick={fetchLeaves}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      <div className="EmppLeaves-stats-container">
        {[
          { 
            label: "Total Leaves", 
            count: stats.total, 
            type: "All", 
            icon: <FiUsersIcon />,
            color: "primary"
          },
          { 
            label: "Pending", 
            count: stats.pending, 
            type: "Pending", 
            icon: <FiClock />,
            color: "warning"
          },
          { 
            label: "Approved", 
            count: stats.approved, 
            type: "Approved", 
            icon: <FiCheckCircle />,
            color: "success"
          },
          { 
            label: "Rejected", 
            count: stats.rejected, 
            type: "Rejected", 
            icon: <FiXCircle />,
            color: "error"
          },
        ]
          .filter(stat => stat.count > 0)
          .map((stat) => (
            <div 
              key={stat.type}
              className={`EmppLeaves-stat-card EmppLeaves-stat-${stat.color} ${selectedStat === stat.type ? 'EmppLeaves-active' : ''}`}
              onClick={() => handleStatFilter(stat.type)}
            >
              <div className="EmppLeaves-stat-content">
                <div className={`EmppLeaves-stat-icon EmppLeaves-stat-icon-${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="EmppLeaves-stat-info">
                  <div className="EmppLeaves-stat-value">{stat.count}</div>
                  <div className="EmppLeaves-stat-label">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="EmppLeaves-leaves-sections-container">
        {pendingLeaves.length > 0 && (
          <div className="EmppLeaves-leaves-section EmppLeaves-pending-section">
            <div className="EmppLeaves-section-header">
              <h2 className="EmppLeaves-section-title">
                <FiAlertCircle size={20} color="#f57c00" />
                Pending Leaves Requiring Action
                {canApproveLeave() && (
                  <span className="EmppLeaves-action-badge">Needs Approval</span>
                )}
              </h2>
              <span className="EmppLeaves-section-badge">{pendingLeaves.length} pending</span>
            </div>
            {renderLeaveTable("Pending Leaves", pendingLeaves, true)}
          </div>
        )}

        <div className="EmppLeaves-leaves-section">
          <div className="EmppLeaves-section-header">
            <h2 className="EmppLeaves-section-title">
              <FiList size={20} color="#1976d2" />
              All Other Leaves
            </h2>
            <span className="EmppLeaves-section-badge">{otherLeaves.length} total</span>
          </div>
          {renderLeaveTable("All Leaves", otherLeaves, false)}
        </div>
      </div>

      {detailsModal.open && (
        <LeaveDetailsModal 
          leave={detailsModal.leave} 
          onClose={closeDetailsModal} 
        />
      )}

      {statusDialog.open && (
        <div className="EmppLeaves-dialog-overlay" onClick={closeStatusDialog}>
          <div className="EmppLeaves-dialog-content EmppLeaves-status-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="EmppLeaves-dialog-header">
              <h3>
                {statusDialog.newStatus === 'Approved' ? (
                  <>✅ Approve Leave</>
                ) : (
                  <>❌ Reject Leave</>
                )}
              </h3>
              <button className="EmppLeaves-dialog-close" onClick={closeStatusDialog}>
                <FiX size={20} />
              </button>
            </div>
            
            <div className="EmppLeaves-dialog-body">
              <div className="EmppLeaves-user-info-compact">
                <div className="EmppLeaves-user-avatar EmppLeaves-medium">
                  {getInitials(statusDialog.userName)}
                </div>
                <div className="EmppLeaves-user-details">
                  <h4>{statusDialog.userName}</h4>
                  <p>{statusDialog.userEmail}</p>
                  {statusDialog.userPhone && (
                    <p className="EmppLeaves-user-phone">{statusDialog.userPhone}</p>
                  )}
                </div>
              </div>
              
              <div className="EmppLeaves-status-change-info">
                <div className="EmppLeaves-status-badge EmppLeaves-current">
                  Current: {statusDialog.currentStatus || 'Pending'}
                </div>
                <FiArrowRight size={16} />
                <div className={`EmppLeaves-status-badge EmppLeaves-new EmppLeaves-status-${statusDialog.newStatus?.toLowerCase()}`}>
                  New: {statusDialog.newStatus}
                </div>
              </div>
              
              <div className="EmppLeaves-remarks-section">
                <label>Remarks <span className="EmppLeaves-optional">(Optional)</span></label>
                <textarea
                  className="EmppLeaves-remarks-input"
                  value={statusDialog.remarks}
                  onChange={(e) => setStatusDialog(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder={`Add remarks for ${statusDialog.newStatus?.toLowerCase()}...`}
                  rows="3"
                  autoFocus
                />
              </div>
              
              <div className="EmppLeaves-notification-info">
                <FiPhone size={16} />
                <span>
                  {statusDialog.userPhone 
                    ? `WhatsApp notification will be sent`
                    : `No phone number available`
                  }
                </span>
              </div>
            </div>
            
            <div className="EmppLeaves-dialog-footer">
              <button className="EmppLeaves-btn EmppLeaves-btn-outlined" onClick={closeStatusDialog}>
                Cancel
              </button>
              <button 
                className={`EmppLeaves-btn EmppLeaves-btn-${statusDialog.newStatus === 'Approved' ? 'success' : 'error'}`}
                onClick={confirmStatusChange}
              >
                <FiSave size={16} />
                Confirm {statusDialog.newStatus}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDialog && (
        <div className="EmppLeaves-dialog-overlay EmppLeaves-delete-overlay" onClick={() => setDeleteDialog(null)}>
          <div className="EmppLeaves-dialog-content EmppLeaves-delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="EmppLeaves-dialog-header">
              <div className="EmppLeaves-dialog-header-left">
                <span className="EmppLeaves-delete-title-icon"><FiTrash2 size={18} /></span>
                <h3>Delete Leave Request</h3>
              </div>
              <button className="EmppLeaves-dialog-close" onClick={() => setDeleteDialog(null)}>
                <FiX size={20} />
              </button>
            </div>
            
            <div className="EmppLeaves-dialog-body">
              <div className="EmppLeaves-warning-icon">
                <FiAlertCircle size={30} />
              </div>
              <h4>Are you sure?</h4>
              <p>
                This leave request will be permanently deleted and cannot be recovered.
              </p>
              {leavePendingDelete && (
                <div className="EmppLeaves-delete-context">
                  <span className="EmppLeaves-delete-context-name">
                    {leavePendingDelete.user?.name || "Employee"}
                  </span>
                  <span className="EmppLeaves-delete-context-dot" aria-hidden="true"></span>
                  <span>{leavePendingDelete.type || "Leave"} Leave</span>
                </div>
              )}
            </div>
            
            <div className="EmppLeaves-dialog-footer">
              <button className="EmppLeaves-btn EmppLeaves-btn-outlined" onClick={() => setDeleteDialog(null)}>
                Cancel
              </button>
              <button 
                className="EmppLeaves-btn EmppLeaves-btn-error" 
                onClick={() => handleDeleteLeave(leavePendingDelete?._id || deleteDialog)}
              >
                <FiTrash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {historyDialog.open && (
        <div className="EmppLeaves-dialog-overlay" onClick={closeHistoryDialog}>
          <div className="EmppLeaves-dialog-content EmppLeaves-history-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="EmppLeaves-dialog-header">
              <h3>
                <span className="EmppLeaves-dialog-title-icon">
                  <FiList size={18} />
                </span>
                Leave History
              </h3>
              <button className="EmppLeaves-dialog-close" onClick={closeHistoryDialog}>
                <FiX size={20} />
              </button>
            </div>
            
            <div className="EmppLeaves-dialog-body">
              <div className="EmppLeaves-history-title">
                <h4>{historyDialog.title}</h4>
                <span>{historyDialog.items.length} update{historyDialog.items.length === 1 ? '' : 's'}</span>
              </div>
              
              <div className="EmppLeaves-history-timeline">
                {historyDialog.items.length > 0 ? (
                  historyDialog.items.map((item, index) => (
                    <div key={index} className="EmppLeaves-history-item">
                      <div className="EmppLeaves-history-item-header">
                        <span className={`EmppLeaves-history-action EmppLeaves-status-${item.action?.toLowerCase() || 'pending'}`}>
                          {item.action || 'Updated'}
                        </span>
                        <span className="EmppLeaves-history-date">
                          {formatDateTime(item.at)}
                        </span>
                      </div>
                      <div className="EmppLeaves-history-item-body">
                        {item.from && item.to && item.from !== item.to && (
                          <div className="EmppLeaves-history-status-change">
                            <span className="EmppLeaves-status-badge EmppLeaves-from">{item.from}</span>
                            <FiArrowRight size={12} />
                            <span className="EmppLeaves-status-badge EmppLeaves-to">{item.to}</span>
                          </div>
                        )}
                        <div className="EmppLeaves-history-by">
                          <strong>By:</strong> 
                          <span>{item.byName || 'System'}</span>
                          {item.byRole && item.byRole !== 'System' && (
                            <span className="EmppLeaves-history-role">({normalizeRole(item.byRole)})</span>
                          )}
                        </div>
                        {item.remarks && (
                          <div className="EmppLeaves-history-remarks">
                            <strong>Remarks:</strong> {item.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="EmppLeaves-no-history">
                    <FiList size={32} />
                    <p>No history available for this leave request.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="EmppLeaves-dialog-footer">
              <button className="EmppLeaves-btn EmppLeaves-btn-contained" onClick={closeHistoryDialog}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && (
        <div className="EmppLeaves-snackbar">
          <div className={`EmppLeaves-snackbar-content EmppLeaves-snackbar-${snackbar.type}`}>
            {snackbar.type === "success" && <FiCheckCircle size={20} />}
            {snackbar.type === "error" && <FiXCircle size={20} />}
            {snackbar.type === "info" && <FiAlertCircle size={20} />}
            {snackbar.type === "warning" && <FiAlertCircle size={20} />}
            <span>{snackbar.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaves;
