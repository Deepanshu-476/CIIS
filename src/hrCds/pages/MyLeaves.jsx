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
  FiFilter,
  FiDownload,
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
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notification, setNotification] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingLeaveId, setCancellingLeaveId] = useState(null);
  const [cancelDialog, setCancelDialog] = useState({ open: false, leave: null, remarks: '' });
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

  const openApplyLeaveModal = () => {
    setTab(0);
    setReasonError("");
    setIsApplyModalOpen(true);
  };
  
  const [jobRoles, setJobRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [userJobRoleName, setUserJobRoleName] = useState("");
  const [userDepartmentName, setUserDepartmentName] = useState("");
  const [jobRolesLoading, setJobRolesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [applicablePolicies, setApplicablePolicies] = useState([]);
  const [hasConfiguredPolicies, setHasConfiguredPolicies] = useState(false);
  const [leavePolicyLoadError, setLeavePolicyLoadError] = useState("");
  
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [form, setForm] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [reasonError, setReasonError] = useState("");
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
    let active = true;

    const fetchLeaveTypes = async () => {
      setLeaveTypesLoading(true);
      setLeavePolicyLoadError("");
      try {
        const policyResponse = await axios.get("/leave-policies/applicable", {
          _skipErrorNotify: true,
          cache: false,
          noCache: true
        });
        const policies = Array.isArray(policyResponse?.data?.policies)
          ? policyResponse.data.policies
          : [];
        const companyHasPolicies = Boolean(policyResponse?.data?.hasConfiguredPolicies);
        const policyUser = policyResponse?.data?.user || {};
        if (!active) return;
        setApplicablePolicies(policies);
        setHasConfiguredPolicies(companyHasPolicies);
        const apiDepartmentName = policyUser.department?.name || policyUser.department?.departmentName;
        const apiJobRoleName = policyUser.jobRole?.name || policyUser.jobRole?.roleName;
        if (apiDepartmentName) setUserDepartmentName(apiDepartmentName);
        if (apiJobRoleName) setUserJobRoleName(apiJobRoleName);

        const policyTypes = [...new Set(policies.map((policy) => String(policy?.leaveType || "").trim()).filter(Boolean))];
        if (policyTypes.length > 0) {
          setLeaveTypes(policyTypes);
          setForm((current) => ({
            ...current,
            type: policyTypes.includes(current.type) ? current.type : policyTypes[0]
          }));
          return;
        }
        if (companyHasPolicies) {
          setLeaveTypes([]);
          setForm((current) => ({ ...current, type: "" }));
          return;
        }

        const response = await axios.get("/leave-types", {
          _skipErrorNotify: true,
          cache: false,
          noCache: true
        });
        const records = response?.data?.leaveTypes || response?.data?.data || [];
        const apiTypes = Array.isArray(records)
          ? records
              .filter((item) => item?.status !== "Inactive")
              .sort((a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0))
              .map((item) => String(item?.name || "").trim())
              .filter(Boolean)
          : [];

        const activeTypes = [...new Set(apiTypes)];
        if (!active || activeTypes.length === 0) return;
        setLeaveTypes(activeTypes);
        setForm((current) => ({
          ...current,
          type: activeTypes.includes(current.type) ? current.type : activeTypes[0]
        }));

      } catch (error) {
        if (active) {
          setLeaveTypes([]);
          setApplicablePolicies([]);
          setForm((current) => ({ ...current, type: "" }));
          setLeavePolicyLoadError(error?.response?.data?.message || "Unable to load leave policies. Please refresh and try again.");
        }
        console.warn("Could not fetch configured leave policies", error);
      } finally {
        if (active) setLeaveTypesLoading(false);
      }
    };

    fetchLeaveTypes();
    return () => {
      active = false;
    };
  }, [isApplyModalOpen]);

  
  
  
  useEffect(() => {
    if (!user?._id) return;

    void 0;

    let unsubscribeStatusChange;

    try {
      unsubscribeStatusChange = onLeaveStatusChanged?.((data) => {
        void 0;
        
        const { leaveId, newStatus, oldStatus, remarks, leave: serverLeave } = data.data || data;
        
        
        setLeaves(prev => {
          const updatedLeaves = prev.map(leave => {
            if (leave._id === leaveId) {
              return {
                ...leave,
                status: newStatus,
                remarks,
                ...(serverLeave ? {
                  type: serverLeave.type || leave.type,
                  payType: serverLeave.payType || leave.payType,
                  leavePolicy: serverLeave.leavePolicy || leave.leavePolicy,
                  policySnapshot: serverLeave.policySnapshot || leave.policySnapshot,
                  approvedBy: serverLeave.approvedBy || leave.approvedBy,
                  approvalSteps: serverLeave.approvalSteps || leave.approvalSteps,
                  history: serverLeave.history || leave.history
                } : {})
              };
            }
            return leave;
          });
          
          
          calculateStats(updatedLeaves);
          
          
          const affectedLeave = prev.find(l => l._id === leaveId);
          
          if (affectedLeave) {
            
            setRecentlyUpdatedId(leaveId);
            setTimeout(() => setRecentlyUpdatedId(null), 3000);
            
            
            const finalType = serverLeave?.type || affectedLeave.type;
            const finalPayType = serverLeave?.payType;
            const message = `Your ${finalType} leave has been ${newStatus.toLowerCase()}${finalPayType && newStatus === 'Approved' ? ` as ${finalPayType}` : ''}`;
            
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
              message: `Leave ${newStatus.toLowerCase()}: ${finalType} leave${finalPayType && newStatus === 'Approved' ? ` (${finalPayType})` : ''} from ${formatDate(affectedLeave.startDate)} to ${formatDate(affectedLeave.endDate)}`,
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
      if (user?.jobRole?.name || user?.jobRole?.roleName) return user.jobRole.name || user.jobRole.roleName;
      if (typeof user?.jobRole === "string" && !/^[a-f\d]{24}$/i.test(user.jobRole)) return user.jobRole;
      if (typeof user?.role === "string") return user.role;
      return "Employee";
    }
    
    if (!user) return "Employee";
    if (!user?.jobRole && !user?.role && !user?.roleId) {
      if (user?.roleName) return user.roleName;
      if (user?.jobRoleName) return user.jobRoleName;
      return "Employee";
    }
    
    const roleId = user.jobRole?._id || user.jobRole?.id || user.jobRole || user.role?._id || user.role || user.roleId;
    
    const role = roles.find(
      r => {
        const match = String(r._id) === String(roleId) || 
                     String(r.id) === String(roleId) ||
                     String(r.roleId) === String(roleId) ||
                     String(r.roleNumber) === String(roleId) ||
                     r.roleName?.toLowerCase() === String(roleId).toLowerCase() ||
                     r.name?.toLowerCase() === String(roleId).toLowerCase();
        return match;
      }
    );

    if (role) return role.roleName || role.name || "Employee";
    if (user?.jobRole?.name || user?.jobRole?.roleName) return user.jobRole.name || user.jobRole.roleName;
    if (user?.roleName) return user.roleName;
    if (typeof user?.jobRole === "string" && !/^[a-f\d]{24}$/i.test(user.jobRole)) return user.jobRole;
    return "Employee";
  };

  
  const resolveUserDepartment = (depts) => {
    if (!depts || depts.length === 0) {
      if (!user) return "General";
      if (user?.departmentName) return user.departmentName;
      if (user?.department?.name || user?.department?.departmentName) return user.department.name || user.department.departmentName;
      if (typeof user?.department === "string" && !/^[a-f\d]{24}$/i.test(user.department)) return user.department;
      if (typeof user?.dept === "string") return user.dept;
      return "General";
    }
    
    if (!user) return "General";
    if (!user?.department && !user?.dept && !user?.departmentId) {
      if (user?.departmentName) return user.departmentName;
      return "General";
    }
    
    const deptId = user.department?._id || user.department?.id || user.department || user.dept?._id || user.dept || user.departmentId;
    
    const dept = depts.find(
      d => {
        const match = String(d._id) === String(deptId) || 
                     String(d.id) === String(deptId) ||
                     String(d.departmentId) === String(deptId) ||
                     String(d.departmentCode) === String(deptId) ||
                     d.departmentName?.toLowerCase() === String(deptId).toLowerCase() ||
                     d.name?.toLowerCase() === String(deptId).toLowerCase();
        return match;
      }
    );

    if (dept) return dept.departmentName || dept.name || "General";
    if (user?.department?.name || user?.department?.departmentName) return user.department.name || user.department.departmentName;
    if (user?.departmentName) return user.departmentName;
    if (typeof user?.department === "string" && !/^[a-f\d]{24}$/i.test(user.department)) return user.department;
    return "General";
  };

  
  const fetchJobRoles = async () => {
    const companyId = getCompanyId();
    
    if (!companyId) {
      setUserJobRoleName(resolveUserJobRole([]));
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
      setUserDepartmentName(resolveUserDepartment([]));
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

  const getPayTreatment = (leave) => {
    const payType = leave?.payType || leave?.policySnapshot?.payType || "";
    if (payType === "Admin Choice") return leave?.status === "Pending" ? "Awaiting Decision" : "Not Decided";
    return payType || "Not Available";
  };

  const ApprovalWorkflow = ({ leave }) => {
    if (!hasApprovalWorkflow(leave)) {
      const history = Array.isArray(leave?.history) ? leave.history : [];
      const decisionEntry = [...history].reverse().find((entry) =>
        ["Approved", "Rejected"].includes(entry?.to || entry?.action)
      );
      const actor = leave?.approvedBy?.name || decisionEntry?.by?.name || "";

      if (["Approved", "Rejected"].includes(leave?.status) && actor) {
        return (
          <span className={`MyLeaves-approval-empty MyLeaves-approval-${leave.status.toLowerCase()}`}>
            {actor}
          </span>
        );
      }

      return <span className="MyLeaves-approval-empty">Company Owner</span>;
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
    if (name === "reason" && value.trim().length >= 20) {
      setReasonError("");
    }
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

  const selectedPolicy = applicablePolicies.find((policy) => policy.leaveType === form.type) || null;
  const requestedDays = calculateDays(form.startDate, form.endDate);
  const selectedStart = form.startDate ? new Date(`${form.startDate}T00:00:00`) : null;
  const selectedEnd = form.endDate ? new Date(`${form.endDate}T00:00:00`) : null;
  const hasDateRange = Boolean(selectedStart && selectedEnd && selectedStart <= selectedEnd);
  const hasOverlap = hasDateRange && leaves.some((leave) => {
    if (!["Pending", "Approved"].includes(leave.status)) return false;
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    return leaveStart <= selectedEnd && leaveEnd >= selectedStart;
  });
  const isCurrentMonthRequest = selectedStart &&
    selectedStart.getFullYear() === new Date().getFullYear() &&
    selectedStart.getMonth() === new Date().getMonth();
  const policyValidationMessage = (() => {
    if (leaveTypesLoading) return "Loading your leave policy...";
    if (leavePolicyLoadError) return leavePolicyLoadError;
    if (hasConfiguredPolicies && !selectedPolicy) return "No leave policy is assigned to your department and job role.";
    if (!hasDateRange) return "Select valid start and end dates to check eligibility.";
    if (hasOverlap) return "You already have a pending or approved leave for these dates.";
    if (selectedPolicy && requestedDays > Number(selectedPolicy.balance?.remaining || 0)) {
      return `Only ${selectedPolicy.balance?.remaining || 0} annual leave day(s) remaining.`;
    }
    if (selectedPolicy && isCurrentMonthRequest && requestedDays > Number(selectedPolicy.balance?.remainingThisMonth || 0)) {
      return `Only ${selectedPolicy.balance?.remainingThisMonth || 0} leave day(s) remaining this month.`;
    }
    return "";
  })();
  const canSubmitLeave = !loading && !leaveTypesLoading && Boolean(form.type) && hasDateRange &&
    form.reason.trim().length >= 20 && !policyValidationMessage;

  const applyLeave = async () => {
    const trimmedReason = form.reason.trim();

    if (!form.startDate || !form.endDate) {
      showToast("Please fill all required leave fields", "error");
      setNotification({
        message: "Please fill all fields",
        severity: "error",
      });
      return;
    }
    if (trimmedReason.length < 20) {
      setReasonError("Please enter at least 20 characters.");
      showToast(
        `Reason for leave needs at least 20 characters (${20 - trimmedReason.length} more required)`,
        "error"
      );
      setNotification({
        message: "Reason for leave must be at least 20 characters",
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
      reason: trimmedReason,
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
      setForm({ type: leaveTypes[0] || "", startDate: "", endDate: "", reason: "" });
      setReasonError("");
      setTab(0);
      setIsApplyModalOpen(false);
    } catch (err) {
      console.error('Error applying leave:', err);
      console.error('Apply leave response:', err?.response?.data);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to apply leave";
      const reasonValidationError = err?.response?.data?.validationErrors?.find(
        validationError => validationError?.field === "reason"
      );
      if (reasonValidationError?.message) {
        setReasonError(reasonValidationError.message);
      } else if (/reason|20 characters|500 characters/i.test(errorMsg)) {
        setReasonError(errorMsg);
      }
      
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

  const canCancelLeave = (leave) => {
    if (!['Pending', 'Approved'].includes(leave?.status)) return false;
    const startDateKey = new Date(leave.startDate).toISOString().slice(0, 10);
    const today = new Date();
    const indiaTodayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(today);
    return indiaTodayKey <= startDateKey;
  };

  const cancelLeave = async (leave) => {
    const leaveId = leave?._id || leave?.id;
    if (!leaveId || cancellingLeaveId) return;

    setCancellingLeaveId(leaveId);
    try {
      const response = await axios.patch(`/leaves/${leaveId}/cancel`, {
        remarks: cancelDialog.remarks.trim() || 'Cancelled by employee'
      });
      setLeaves(current => {
        const updated = current.map(item => String(item._id || item.id) === String(leaveId)
          ? { ...item, status: 'Cancelled', remarks: response.data?.data?.remarks, history: response.data?.data?.history || item.history }
          : item);
        calculateStats(updated);
        return updated;
      });
      setNotification({
        message: response.data?.message || 'Leave cancelled and balance credited back.',
        severity: 'success',
        autoHide: true
      });
      showToast(response.data?.message || 'Leave cancelled successfully', 'success');
      setCancelDialog({ open: false, leave: null, remarks: '' });
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Unable to cancel leave';
      setNotification({ message, severity: 'error' });
      showToast(message, 'error');
    } finally {
      setCancellingLeaveId(null);
    }
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
            <button
              type="button"
              className="MyLeaves-header-apply-button"
              onClick={openApplyLeaveModal}
            >
              <FiPlus size={16} />
              Apply Leave
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
                            <th>Actions</th>
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
                                  <div className="MyLeaves-type-with-pay">
                                    <span className={`MyLeaves-leave-type MyLeaves-type-${leave.type?.toLowerCase()}`}>
                                      {leave.type}
                                    </span>
                                    <span className={`MyLeaves-pay-treatment MyLeaves-pay-${getPayTreatment(leave).toLowerCase().replace(/\s+/g, '-')}`}>
                                      {getPayTreatment(leave)}
                                    </span>
                                  </div>
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
                                    {leave.status === "Cancelled" && <FiXCircle size={12} />}
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
                                <td>
                                  {canCancelLeave(leave) ? (
                                    <button
                                      type="button"
                                      className="MyLeaves-cancel-leave-button"
                                      onClick={() => setCancelDialog({ open: true, leave, remarks: '' })}
                                      disabled={cancellingLeaveId === (leave._id || leave.id)}
                                    >
                                      <FiXCircle size={14} />
                                      {cancellingLeaveId === (leave._id || leave.id) ? 'Cancelling...' : 'Cancel Leave'}
                                    </button>
                                  ) : <span className="MyLeaves-action-unavailable">—</span>}
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
                                <span className={`MyLeaves-pay-treatment MyLeaves-pay-${getPayTreatment(leave).toLowerCase().replace(/\s+/g, '-')}`}>
                                  {getPayTreatment(leave)}
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
                              {canCancelLeave(leave) && (
                                <button
                                  type="button"
                                  className="MyLeaves-cancel-leave-button"
                                  onClick={() => setCancelDialog({ open: true, leave, remarks: '' })}
                                  disabled={cancellingLeaveId === (leave._id || leave.id)}
                                >
                                  <FiXCircle size={14} />
                                  {cancellingLeaveId === (leave._id || leave.id) ? 'Cancelling...' : 'Cancel Leave'}
                                </button>
                              )}
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


{cancelDialog.open && cancelDialog.leave && (
  <div className="MyLeaves-cancel-dialog-overlay" onMouseDown={() => !cancellingLeaveId && setCancelDialog({ open: false, leave: null, remarks: '' })}>
    <div className="MyLeaves-cancel-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cancel-leave-title">
      <div className="MyLeaves-cancel-dialog-icon"><FiAlertTriangle /></div>
      <button
        type="button"
        className="MyLeaves-cancel-dialog-close"
        onClick={() => setCancelDialog({ open: false, leave: null, remarks: '' })}
        disabled={Boolean(cancellingLeaveId)}
        aria-label="Close cancellation dialog"
      ><FiX /></button>
      <span className="MyLeaves-cancel-dialog-eyebrow">Leave cancellation</span>
      <h2 id="cancel-leave-title">Cancel this leave request?</h2>
      <p>The request will be marked as cancelled and its reserved balance will be credited back.</p>

      <div className="MyLeaves-cancel-dialog-summary">
        <div><small>Leave type</small><strong>{cancelDialog.leave.type}</strong></div>
        <div><small>Leave period</small><strong>{formatDate(cancelDialog.leave.startDate)} – {formatDate(cancelDialog.leave.endDate)}</strong></div>
        <div><small>Days credited</small><strong>{cancelDialog.leave.days || calculateDays(cancelDialog.leave.startDate, cancelDialog.leave.endDate)} day(s)</strong></div>
      </div>

      <label className="MyLeaves-cancel-dialog-reason">
        <span>Cancellation reason <small>(optional)</small></span>
        <textarea
          rows="3"
          maxLength="500"
          value={cancelDialog.remarks}
          onChange={(event) => setCancelDialog(current => ({ ...current, remarks: event.target.value }))}
          placeholder="Why are you cancelling this leave?"
          disabled={Boolean(cancellingLeaveId)}
        />
        <small>{cancelDialog.remarks.length}/500</small>
      </label>

      <div className="MyLeaves-cancel-dialog-note"><FiInfo /> Cancellation is allowed only until the leave start date.</div>
      <div className="MyLeaves-cancel-dialog-actions">
        <button type="button" className="secondary" onClick={() => setCancelDialog({ open: false, leave: null, remarks: '' })} disabled={Boolean(cancellingLeaveId)}>Keep Leave</button>
        <button type="button" className="danger" onClick={() => cancelLeave(cancelDialog.leave)} disabled={Boolean(cancellingLeaveId)}>
          <FiXCircle /> {cancellingLeaveId ? 'Cancelling...' : 'Yes, Cancel Leave'}
        </button>
      </div>
    </div>
  </div>
)}

{isDetailModalOpen && selectedLeave && (
  <div className="MyLeaves-detail-overlay" onClick={closeDetailModal}>
    <div className="MyLeaves-detail-modal" onClick={(event) => event.stopPropagation()}>

      
      <div className="MyLeaves-detail-header">
        <h2>Leave Details</h2>
        <button type="button" className="MyLeaves-detail-close" onClick={closeDetailModal} aria-label="Close leave details"><FiX /></button>
      </div>

      
      <div className="MyLeaves-detail-body">

        <div className="MyLeaves-detail-grid">

          <div className="MyLeaves-detail-card">
            <span className="MyLeaves-detail-label">Type</span>
            <span className="MyLeaves-detail-value">{selectedLeave.type}</span>
          </div>

          <div className="MyLeaves-detail-card">
            <span className="MyLeaves-detail-label">Status</span>
            <span className={`MyLeaves-detail-value status status-${selectedLeave.status?.toLowerCase()}`}>
              {selectedLeave.status}
            </span>
          </div>

          <div className="MyLeaves-detail-card">
            <span className="MyLeaves-detail-label">Pay Treatment</span>
            <span className={`MyLeaves-detail-value MyLeaves-pay-detail MyLeaves-pay-${getPayTreatment(selectedLeave).toLowerCase().replace(/\s+/g, '-')}`}>
              {getPayTreatment(selectedLeave)}
            </span>
          </div>

          <div className="MyLeaves-detail-card">
            <span className="MyLeaves-detail-label">Period</span>
            <span className="MyLeaves-detail-value">
              {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
            </span>
          </div>

          <div className="MyLeaves-detail-card">
            <span className="MyLeaves-detail-label">Days</span>
            <span className="MyLeaves-detail-value">
              {selectedLeave.days || calculateDays(selectedLeave.startDate, selectedLeave.endDate)}
            </span>
          </div>

          <div className="MyLeaves-detail-card">
            <span className="MyLeaves-detail-label">Applied On</span>
            <span className="MyLeaves-detail-value">
              {formatDate(selectedLeave.createdAt || selectedLeave.appliedOn)}
            </span>
          </div>

        </div>

        <div className="MyLeaves-detail-section">
          <h4>Approval Flow</h4>
          <ApprovalWorkflow leave={selectedLeave} />
        </div>

        
        <div className="MyLeaves-detail-section MyLeaves-detail-reason">
          <h4>Reason</h4>
          <p>{selectedLeave.reason}</p>
        </div>

      </div>

    </div>
  </div>
)}

        
        {isApplyModalOpen && (
          <div className="MyLeaves-apply-modal-overlay" onClick={() => setIsApplyModalOpen(false)}>
            <div className="MyLeaves-apply-modal" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="MyLeaves-apply-modal-close"
                onClick={() => setIsApplyModalOpen(false)}
                aria-label="Close apply leave form"
              >
                <FiX />
              </button>
              <div className="MyLeaves-apply-tab">
              <div className="MyLeaves-apply-form-container">
              <div className="MyLeaves-apply-modal-heading">
                <span className="MyLeaves-apply-title-icon"><FiCalendar /></span>
                <h2 className="MyLeaves-form-title">Apply for New Leave</h2>
                <p className="MyLeaves-form-subtitle">
                  Fill in the details to submit a leave request
                </p>
              </div>

              <div className="MyLeaves-form">
                <div className="MyLeaves-form-group">
                  <label htmlFor="type">Applicable Leave Type</label>
                  <div className="MyLeaves-leave-type-control">
                    <FiBriefcase />
                    <select
                    id="type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="MyLeaves-form-select"
                    disabled={leaveTypesLoading}
                  >
                    {leaveTypes.length === 0 && (
                      <option value="">
                        {leaveTypesLoading ? "Loading leave policies..." : "No applicable leave type"}
                      </option>
                    )}
                    {leaveTypes.map((leaveType) => (
                      <option key={leaveType} value={leaveType}>{leaveType}</option>
                    ))}
                    </select>
                  </div>
                  {selectedPolicy && (
                    <div className="MyLeaves-eligibility-line">
                      <FiCheckCircle /> {userDepartmentName && userJobRoleName
                        ? `Eligible for ${userDepartmentName} • ${userJobRoleName}`
                        : "Loading eligibility details..."}
                    </div>
                  )}
                </div>

                <div className="MyLeaves-form-row MyLeaves-date-range-group">
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

                <div className="MyLeaves-form-group MyLeaves-total-days-group">
                  <label htmlFor="days">Total Requested</label>
                  <div className="MyLeaves-days-display">
                    <strong>{calculateDays(form.startDate, form.endDate)} Days</strong>
                  </div>
                </div>

                {selectedPolicy && (
                  <section className="MyLeaves-policy-summary" aria-label="Selected leave policy summary">
                    <div className="MyLeaves-policy-summary-head">
                      <div>
                        <strong>{selectedPolicy.policyName}</strong>
                      </div>
                      <span className={`MyLeaves-pay-badge ${selectedPolicy.payType === "Unpaid" ? "unpaid" : selectedPolicy.payType === "Admin Choice" ? "decision" : "paid"}`}>
                        {selectedPolicy.payType === "Admin Choice" ? "Admin will decide" : (selectedPolicy.payType || "Paid")}
                      </span>
                    </div>
                    <div className="MyLeaves-policy-metrics">
                      <div><span>Annual Entitlement</span><strong>{selectedPolicy.balance?.allocated ?? selectedPolicy.entitledDays} days</strong></div>
                      <div><span>Used Days</span><strong>{selectedPolicy.balance?.used ?? 0}</strong></div>
                      <div className="remaining"><span>Remaining Days</span><strong>{selectedPolicy.balance?.remaining ?? selectedPolicy.entitledDays} days</strong></div>
                      <div><span>Monthly Limit</span><strong>{selectedPolicy.balance?.monthlyLimit ?? selectedPolicy.monthlyAllowed} days</strong></div>
                      <div><span>Used This Month</span><strong>{selectedPolicy.balance?.usedThisMonth ?? 0}</strong></div>
                      <div className="remaining"><span>Remaining This Month</span><strong>{selectedPolicy.balance?.remainingThisMonth ?? selectedPolicy.monthlyAllowed} days</strong></div>
                    </div>
                    <div className="MyLeaves-policy-rules">
                      <span>Carry forward: <b>{selectedPolicy.carryForward}</b></span>
                      <span>Max CF: <b>{selectedPolicy.maxCarryForwardDays || 0}</b></span>
                      <span>Encashment: <b>{selectedPolicy.encashmentAllowed}</b></span>
                      <span>Probation: <b>{selectedPolicy.probationApplicable}</b></span>
                      {(selectedPolicy.balance?.pending ?? 0) > 0 && <span>Pending: <b>{selectedPolicy.balance.pending} days</b></span>}
                    </div>
                  </section>
                )}

                {policyValidationMessage && (
                  <div className={`MyLeaves-policy-validation ${hasDateRange ? "error" : "info"}`} role="status">
                    <FiAlertCircle /> <span>{policyValidationMessage}</span>
                  </div>
                )}

                <div className="MyLeaves-form-group MyLeaves-reason-group">
                  <label htmlFor="reason">
                    <FiInfo className="MyLeaves-form-icon" />
                    Reason for Leave
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    className={`MyLeaves-form-textarea ${reasonError ? "MyLeaves-form-textarea-error" : ""}`}
                    placeholder="Please provide a reason for your leave request..."
                    rows={4}
                    maxLength={500}
                    aria-invalid={Boolean(reasonError)}
                    aria-describedby={reasonError ? "reason-error reason-count" : "reason-count"}
                  />
                  <span id="reason-count" className="MyLeaves-reason-count">
                    {form.reason.trim().length}/500 (minimum 20 characters)
                  </span>
                  {reasonError && (
                    <span id="reason-error" className="MyLeaves-reason-error" role="alert">
                      {reasonError}
                    </span>
                  )}
                </div>

              </div>
              <aside className="MyLeaves-guidelines-panel">
                <div className="MyLeaves-guidelines-heading">
                  <h3>Policy Guidelines</h3>
                  <p>{selectedPolicy ? `Based on ${selectedPolicy.policyName} policy` : "Select a leave policy"}</p>
                </div>
                <div className="MyLeaves-guideline-cards">
                  <div><span><FiCalendar /></span><p><b>Leave Type</b><small>{selectedPolicy?.payType === "Admin Choice" ? "Pay type decided on approval" : `${selectedPolicy?.payType || "—"} leave`}</small></p></div>
                  <div><span><FiClock /></span><p><b>Monthly Limit</b><small>{selectedPolicy ? `Maximum ${selectedPolicy.monthlyAllowed} days` : "—"}</small></p></div>
                  <div><span>↻</span><p><b>Carry Forward</b><small>{selectedPolicy?.carryForward === "Yes" ? `Up to ${selectedPolicy.maxCarryForwardDays} days` : "Not allowed"}</small></p></div>
                  <div><span><FiUser /></span><p><b>Probation</b><small>{selectedPolicy?.probationApplicable === "Yes" ? "Eligible" : "Not eligible"}</small></p></div>
                </div>
                <div className="MyLeaves-guidelines-note">
                  <FiCheckCircle />
                  <span>
                    {selectedPolicy
                      ? `${selectedPolicy.balance?.remaining ?? selectedPolicy.entitledDays} days currently available under this policy.`
                      : "Select a leave type to view current availability."}
                  </span>
                </div>
                <div className="MyLeaves-submit-checklist">
                  <div className="MyLeaves-submit-checklist-head">
                    <span><FiInfo /></span>
                    <div><b>Before You Submit</b><small>Quick request checklist</small></div>
                  </div>
                  <ul>
                    <li>Confirm the selected leave dates.</li>
                    <li>Provide a clear reason of at least 20 characters.</li>
                    <li>Balance and policy limits are validated automatically.</li>
                  </ul>
                </div>
              </aside>
              <div className="MyLeaves-form-actions">
                <button
                  type="button"
                  className="MyLeaves-form-cancel"
                  onClick={() => setIsApplyModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="MyLeaves-form-submit"
                  onClick={applyLeave}
                  disabled={!canSubmitLeave}
                >
                  {loading ? 'Applying...' : (
                    <>
                      <FiPlus size={16} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
            </div>
          </div>
          </div>
        )}
      </div>

      
      {historyDialog.open && (
        <div className="MyLeaves-modal-overlay MyLeaves-history-overlay">
          <div className="MyLeaves-modal MyLeaves-history-modal">
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
                        {item.newPayType && item.newPayType !== "Admin Choice" && (
                          <p className="MyLeaves-history-decision">
                            <strong>Pay treatment:</strong> {item.newPayType}
                            {item.previousPayType && item.previousPayType !== item.newPayType
                              ? ` (changed from ${item.previousPayType})`
                              : ""}
                          </p>
                        )}
                        {item.newLeaveType && item.previousLeaveType && item.newLeaveType !== item.previousLeaveType && (
                          <p className="MyLeaves-history-decision">
                            <strong>Leave type:</strong> {item.previousLeaveType} → {item.newLeaveType}
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
