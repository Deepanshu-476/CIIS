import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "../../utils/axiosConfig";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext";
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
  FiX,
  FiBriefcase,
  FiAlertTriangle,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiCheck,
  FiFileText,
  FiEye,
} from "react-icons/fi";
import { Building2 } from "lucide-react";
import "../Css/MyLeaves.css";
import CIISLoader from "../../Loader/CIISLoader";

const MyLeaves = () => {
  const [tab, setTab] = useState(0);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("ALL");
  const [notification, setNotification] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingLeaveId, setCancellingLeaveId] = useState(null);
  const [cancelDialog, setCancelDialog] = useState({ open: false, leave: null, remarks: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Dropdown states
  const [dateRangeDropdownOpen, setDateRangeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const containerRef = useRef(null);

  const socketContext = useSocket() || {};
  const notificationContext = useNotification() || {};

  const {
    onLeaveStatusChanged = () => () => {},
    isConnected = false,
    joinLeaveRoom = () => {},
    leaveLeaveRoom = () => {},
    unreadCount = 0,
  } = socketContext;

  const { showToast = () => void 0 } = notificationContext;

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

  let user = null;
  let token = null;
  let companyDetails = null;

  try {
    user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    token = localStorage.getItem("token");
    companyDetails = localStorage.getItem("companyDetails")
      ? JSON.parse(localStorage.getItem("companyDetails"))
      : null;
  } catch (error) {
    console.error("Error parsing localStorage data:", error);
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDateRangeDropdownOpen(false);
        setStatusDropdownOpen(false);
        setActiveActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch Leave Types & Applicable Policies
  useEffect(() => {
    let active = true;

    const fetchLeaveTypes = async () => {
      setLeaveTypesLoading(true);
      setLeavePolicyLoadError("");
      try {
        const policyResponse = await axios.get("/leave-policies/applicable", {
          _skipErrorNotify: true,
          cache: false,
          noCache: true,
        });
        const policies = Array.isArray(policyResponse?.data?.policies)
          ? policyResponse.data.policies
          : [];
        const companyHasPolicies = Boolean(policyResponse?.data?.hasConfiguredPolicies);
        const policyUser = policyResponse?.data?.user || {};
        if (!active) return;
        setApplicablePolicies(policies);
        setHasConfiguredPolicies(companyHasPolicies);
        const apiDepartmentName =
          policyUser.department?.name || policyUser.department?.departmentName;
        const apiJobRoleName = policyUser.jobRole?.name || policyUser.jobRole?.roleName;
        if (apiDepartmentName) setUserDepartmentName(apiDepartmentName);
        if (apiJobRoleName) setUserJobRoleName(apiJobRoleName);

        const policyTypes = [
          ...new Set(
            policies.map((policy) => String(policy?.leaveType || "").trim()).filter(Boolean)
          ),
        ];
        if (policyTypes.length > 0) {
          setLeaveTypes(policyTypes);
          setForm((current) => ({
            ...current,
            type: policyTypes.includes(current.type) ? current.type : policyTypes[0],
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
          noCache: true,
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
          type: activeTypes.includes(current.type) ? current.type : activeTypes[0],
        }));
      } catch (error) {
        if (active) {
          setLeaveTypes([]);
          setApplicablePolicies([]);
          setForm((current) => ({ ...current, type: "" }));
          setLeavePolicyLoadError(
            error?.response?.data?.message ||
              "Unable to load leave policies. Please refresh and try again."
          );
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

  // Socket listener for real-time leave status updates
  useEffect(() => {
    if (!user?._id) return;

    let unsubscribeStatusChange;

    try {
      unsubscribeStatusChange = onLeaveStatusChanged?.((data) => {
        const { leaveId, newStatus, remarks, leave: serverLeave } = data.data || data;

        setLeaves((prev) => {
          const updatedLeaves = prev.map((leave) => {
            if (leave._id === leaveId) {
              return {
                ...leave,
                status: newStatus,
                remarks,
                ...(serverLeave
                  ? {
                      type: serverLeave.type || leave.type,
                      payType: serverLeave.payType || leave.payType,
                      leavePolicy: serverLeave.leavePolicy || leave.leavePolicy,
                      policySnapshot: serverLeave.policySnapshot || leave.policySnapshot,
                      approvedBy: serverLeave.approvedBy || leave.approvedBy,
                      approvalSteps: serverLeave.approvalSteps || leave.approvalSteps,
                      history: serverLeave.history || leave.history,
                    }
                  : {}),
              };
            }
            return leave;
          });

          calculateStats(updatedLeaves);

          const affectedLeave = prev.find((l) => l._id === leaveId);

          if (affectedLeave) {
            setRecentlyUpdatedId(leaveId);
            setTimeout(() => setRecentlyUpdatedId(null), 3000);

            const finalType = serverLeave?.type || affectedLeave.type;
            const finalPayType = serverLeave?.payType;
            const message = `Your ${finalType} leave has been ${newStatus.toLowerCase()}${
              finalPayType && newStatus === "Approved" ? ` as ${finalPayType}` : ""
            }`;

            try {
              if (newStatus === "Approved") {
                showToast(message, "success", 5000);
              } else if (newStatus === "Rejected") {
                showToast(message, "error", 5000);
              } else {
                showToast(message, "info", 4000);
              }
            } catch (toastError) {
              console.warn("Toast error:", toastError);
            }

            setNotification({
              message: `Leave ${newStatus.toLowerCase()}: ${finalType} leave${
                finalPayType && newStatus === "Approved" ? ` (${finalPayType})` : ""
              } from ${formatPeriodDate(affectedLeave.startDate)} to ${formatPeriodDate(
                affectedLeave.endDate
              )}`,
              severity:
                newStatus === "Approved"
                  ? "success"
                  : newStatus === "Rejected"
                  ? "error"
                  : "info",
              autoHide: true,
            });
          }

          return updatedLeaves;
        });
      });
    } catch (error) {
      console.warn("Error setting up socket listener:", error);
    }

    try {
      leaves.forEach((leave) => {
        joinLeaveRoom?.(leave._id);
      });
    } catch (error) {
      console.warn("Error joining leave rooms:", error);
    }

    return () => {
      try {
        if (unsubscribeStatusChange && typeof unsubscribeStatusChange === "function") {
          unsubscribeStatusChange();
        }
        leaves.forEach((leave) => {
          leaveLeaveRoom?.(leave._id);
        });
      } catch (error) {
        console.warn("Error cleaning up socket:", error);
      }
    };
  }, [user?._id, onLeaveStatusChanged, showToast, leaves.length]);

  const getCompanyId = () => {
    if (!user && !companyDetails) return null;
    const sources = [
      { source: "companyDetails._id", value: companyDetails?._id },
      { source: "companyDetails.id", value: companyDetails?.id },
      { source: "user.company", value: user?.company },
      { source: "user.companyId", value: user?.companyId },
      { source: "user.companyDetails._id", value: user?.companyDetails?._id },
      { source: "companyDetails.companyId", value: companyDetails?.companyId },
    ];
    const foundSource = sources.find((s) => s.value);
    return foundSource ? foundSource.value : null;
  };

  const resolveUserJobRole = (roles) => {
    if (!roles || roles.length === 0) {
      if (!user) return "Employee";
      if (user?.roleName) return user.roleName;
      if (user?.jobRoleName) return user.jobRoleName;
      if (user?.jobRole?.name || user?.jobRole?.roleName)
        return user.jobRole.name || user.jobRole.roleName;
      if (typeof user?.jobRole === "string" && !/^[a-f\d]{24}$/i.test(user.jobRole))
        return user.jobRole;
      if (typeof user?.role === "string") return user.role;
      return "Employee";
    }

    if (!user) return "Employee";
    if (!user?.jobRole && !user?.role && !user?.roleId) {
      if (user?.roleName) return user.roleName;
      if (user?.jobRoleName) return user.jobRoleName;
      return "Employee";
    }

    const roleId =
      user.jobRole?._id ||
      user.jobRole?.id ||
      user.jobRole ||
      user.role?._id ||
      user.role ||
      user.roleId;

    const role = roles.find(
      (r) =>
        String(r._id) === String(roleId) ||
        String(r.id) === String(roleId) ||
        String(r.roleId) === String(roleId) ||
        String(r.roleNumber) === String(roleId) ||
        r.roleName?.toLowerCase() === String(roleId).toLowerCase() ||
        r.name?.toLowerCase() === String(roleId).toLowerCase()
    );

    if (role) return role.roleName || role.name || "Employee";
    if (user?.jobRole?.name || user?.jobRole?.roleName)
      return user.jobRole.name || user.jobRole.roleName;
    if (user?.roleName) return user.roleName;
    if (typeof user?.jobRole === "string" && !/^[a-f\d]{24}$/i.test(user.jobRole))
      return user.jobRole;
    return "Employee";
  };

  const resolveUserDepartment = (depts) => {
    if (!depts || depts.length === 0) {
      if (!user) return "General";
      if (user?.departmentName) return user.departmentName;
      if (user?.department?.name || user?.department?.departmentName)
        return user.department.name || user.department.departmentName;
      if (typeof user?.department === "string" && !/^[a-f\d]{24}$/i.test(user.department))
        return user.department;
      if (typeof user?.dept === "string") return user.dept;
      return "General";
    }

    if (!user) return "General";
    if (!user?.department && !user?.dept && !user?.departmentId) {
      if (user?.departmentName) return user.departmentName;
      return "General";
    }

    const deptId =
      user.department?._id ||
      user.department?.id ||
      user.department ||
      user.dept?._id ||
      user.dept ||
      user.departmentId;

    const dept = depts.find(
      (d) =>
        String(d._id) === String(deptId) ||
        String(d.id) === String(deptId) ||
        String(d.departmentId) === String(deptId) ||
        String(d.departmentCode) === String(deptId) ||
        d.departmentName?.toLowerCase() === String(deptId).toLowerCase() ||
        d.name?.toLowerCase() === String(deptId).toLowerCase()
    );

    if (dept) return dept.departmentName || dept.name || "General";
    if (user?.department?.name || user?.department?.departmentName)
      return user.department.name || user.department.departmentName;
    if (user?.departmentName) return user.departmentName;
    if (typeof user?.department === "string" && !/^[a-f\d]{24}$/i.test(user.department))
      return user.department;
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
          "Content-Type": "application/json",
        },
      });

      let roles = [];
      if (Array.isArray(res.data)) roles = res.data;
      else if (Array.isArray(res.data?.data)) roles = res.data.data;
      else if (Array.isArray(res.data?.jobRoles)) roles = res.data.jobRoles;
      else if (Array.isArray(res.data?.roles)) roles = res.data.roles;

      setJobRoles(roles);
      const roleName = resolveUserJobRole(roles);
      setUserJobRoleName(roleName);
      return roles;
    } catch (err) {
      console.error("Error fetching job roles:", err);
      const roleName = resolveUserJobRole([]);
      setUserJobRoleName(roleName);
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
          "Content-Type": "application/json",
        },
      });

      let depts = [];
      if (Array.isArray(res.data)) depts = res.data;
      else if (Array.isArray(res.data?.data)) depts = res.data.data;
      else if (Array.isArray(res.data?.departments)) depts = res.data.departments;
      else if (Array.isArray(res.data?.departmentList)) depts = res.data.departmentList;

      setDepartments(depts);
      const deptName = resolveUserDepartment(depts);
      setUserDepartmentName(deptName);
      return depts;
    } catch (err) {
      console.error("Error fetching departments:", err);
      const deptName = resolveUserDepartment([]);
      setUserDepartmentName(deptName);
      return [];
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      await Promise.all([fetchJobRoles(), fetchDepartments()]);
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  // Date formatters
  const formatPeriodDate = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatAppliedDateTime = (dateStr) => {
    if (!dateStr) return { date: "--", time: "" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: "" };
      const date = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return { date, time };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

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

  const fetchLeaves = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await axios.get("/leaves/status");
        const list = res.data.leaves || [];
        setLeaves(list);
        calculateStats(list);

        try {
          list.forEach((leave) => {
            joinLeaveRoom?.(leave._id);
          });
        } catch (roomError) {
          console.warn("Error joining rooms:", roomError);
        }

        if (showRefresh) {
          setNotification({
            message: "Leaves data refreshed!",
            severity: "success",
            autoHide: true,
          });
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
        setNotification({
          message: error?.response?.data?.message || "Failed to fetch leaves",
          severity: "error",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [joinLeaveRoom]
  );

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        await loadUserInfo();
        await fetchLeaves();
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };

    loadData();
  }, []);

  const hasApprovalWorkflow = (leave) =>
    Array.isArray(leave?.approvalSteps) && leave.approvalSteps.length > 0;

  const getPayTreatment = (leave) => {
    const payType = leave?.payType || leave?.policySnapshot?.payType || "";
    if (payType === "Admin Choice")
      return leave?.status === "Pending" ? "Awaiting Decision" : "Not Decided";
    return payType || "Not Available";
  };

  const matchesDateRange = (leave) => {
    if (dateRangeFilter === "ALL") return true;
    const dateVal = leave.startDate || leave.createdAt || leave.appliedOn;
    if (!dateVal) return true;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (dateRangeFilter === "THIS_MONTH") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (dateRangeFilter === "LAST_30_DAYS") {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      return d >= past && d <= now;
    }
    if (dateRangeFilter === "THIS_YEAR") {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredLeaves = leaves.filter((l) => {
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : String(l.status || "").toLowerCase() === statusFilter.toLowerCase();

    const searchLower = searchTerm.trim().toLowerCase();
    const matchesSearch = !searchLower
      ? true
      : (l.type || "").toLowerCase().includes(searchLower) ||
        (l.reason || "").toLowerCase().includes(searchLower) ||
        (l.status || "").toLowerCase().includes(searchLower);

    const inDateRange = matchesDateRange(l);

    return matchesStatus && matchesSearch && inDateRange;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateRangeFilter]);

  // Pagination items calculation
  const totalItems = filteredLeaves.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeaves = filteredLeaves.slice(startIndex, endIndex);

  // Approvers rendering component
  const ApproversCell = ({ leave }) => {
    if (hasApprovalWorkflow(leave)) {
      return (
        <div className="MyLeaves-approvers-stack">
          {leave.approvalSteps.map((step, index) => {
            const approverUser = step?.user || {};
            const approverName = approverUser?.name || "Approver";
            const status = step?.status || "Pending";
            const initials = getInitials(approverName);
            const statusLower = status.toLowerCase();

            return (
              <div
                className="MyLeaves-approver-item"
                key={approverUser?._id || approverUser?.id || index}
              >
                <div className="MyLeaves-approver-avatar">{initials}</div>
                <div className="MyLeaves-approver-details">
                  <span className="MyLeaves-approver-name">{approverName}</span>
                  <span className={`MyLeaves-approver-pill ${statusLower}`}>{status}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const history = Array.isArray(leave?.history) ? leave.history : [];
    const decisionEntry = [...history]
      .reverse()
      .find((entry) => ["Approved", "Rejected"].includes(entry?.to || entry?.action));
    const actor = leave?.approvedBy?.name || decisionEntry?.by?.name || "";
    const isOwner = !actor;
    const approverTitle = actor || "Company Owner";
    const leaveStatus = leave?.status || "Pending";
    const statusLower = leaveStatus.toLowerCase();

    return (
      <div className="MyLeaves-approver-item">
        {isOwner ? (
          <div className="MyLeaves-approver-building">
            <Building2 size={15} />
          </div>
        ) : (
          <div className="MyLeaves-approver-avatar">{getInitials(actor)}</div>
        )}
        <div className="MyLeaves-approver-details">
          <span className="MyLeaves-approver-name">{approverTitle}</span>
          {leaveStatus && (
            <span className={`MyLeaves-approver-pill ${statusLower}`}>{leaveStatus}</span>
          )}
        </div>
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
    } catch {
      return 0;
    }
  };

  const selectedPolicy =
    applicablePolicies.find((policy) => policy.leaveType === form.type) || null;
  const requestedDays = calculateDays(form.startDate, form.endDate);
  const selectedStart = form.startDate ? new Date(`${form.startDate}T00:00:00`) : null;
  const selectedEnd = form.endDate ? new Date(`${form.endDate}T00:00:00`) : null;
  const hasDateRange = Boolean(selectedStart && selectedEnd && selectedStart <= selectedEnd);
  const hasOverlap =
    hasDateRange &&
    leaves.some((leave) => {
      if (!["Pending", "Approved"].includes(leave.status)) return false;
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return leaveStart <= selectedEnd && leaveEnd >= selectedStart;
    });

  const isCurrentMonthRequest =
    selectedStart &&
    selectedStart.getFullYear() === new Date().getFullYear() &&
    selectedStart.getMonth() === new Date().getMonth();

  const policyValidationMessage = (() => {
    if (leaveTypesLoading) return "Loading your leave policy...";
    if (leavePolicyLoadError) return leavePolicyLoadError;
    if (hasConfiguredPolicies && !selectedPolicy)
      return "No leave policy is assigned to your department and job role.";
    if (!hasDateRange) return "Select valid start and end dates to check eligibility.";
    if (hasOverlap) return "You already have a pending or approved leave for these dates.";
    if (selectedPolicy && requestedDays > Number(selectedPolicy.balance?.remaining || 0)) {
      return `Only ${selectedPolicy.balance?.remaining || 0} annual leave day(s) remaining.`;
    }
    if (
      selectedPolicy &&
      isCurrentMonthRequest &&
      requestedDays > Number(selectedPolicy.balance?.remainingThisMonth || 0)
    ) {
      return `Only ${selectedPolicy.balance?.remainingThisMonth || 0} leave day(s) remaining this month.`;
    }
    return "";
  })();

  const canSubmitLeave =
    !loading &&
    !leaveTypesLoading &&
    Boolean(form.type) &&
    hasDateRange &&
    form.reason.trim().length >= 20 &&
    !policyValidationMessage;

  const applyLeave = async () => {
    const trimmedReason = form.reason.trim();

    if (!form.startDate || !form.endDate) {
      showToast("Please fill all required leave fields", "error");
      setNotification({ message: "Please fill all fields", severity: "error" });
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
      await axios.post("/leaves/apply", payload);

      try {
        showToast("Leave applied successfully!", "success");
      } catch (toastError) {
        console.warn("Toast error:", toastError);
      }

      setNotification({
        message: "Leave applied successfully",
        severity: "success",
        autoHide: true,
      });

      await fetchLeaves();
      setForm({ type: leaveTypes[0] || "", startDate: "", endDate: "", reason: "" });
      setReasonError("");
      setTab(0);
      setIsApplyModalOpen(false);
    } catch (err) {
      console.error("Error applying leave:", err);
      const errorMsg =
        err?.response?.data?.message || err?.response?.data?.error || "Failed to apply leave";
      const reasonValidationError = err?.response?.data?.validationErrors?.find(
        (validationError) => validationError?.field === "reason"
      );
      if (reasonValidationError?.message) {
        setReasonError(reasonValidationError.message);
      } else if (/reason|20 characters|500 characters/i.test(errorMsg)) {
        setReasonError(errorMsg);
      }

      try {
        showToast(errorMsg, "error");
      } catch (toastError) {
        console.warn("Toast error:", toastError);
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
      title: `${leave.type} Leave — ${leave.user?.name || user?.name || "Employee"}`,
      items,
    });
  };

  const closeHistoryModal = () => {
    setHistoryDialog({ open: false, title: "", items: [] });
  };

  const canCancelLeave = (leave) => {
    if (!["Pending", "Approved"].includes(leave?.status)) return false;
    const startDateKey = new Date(leave.startDate).toISOString().slice(0, 10);
    const today = new Date();
    const indiaTodayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(today);
    return indiaTodayKey <= startDateKey;
  };

  const cancelLeave = async (leave) => {
    const leaveId = leave?._id || leave?.id;
    if (!leaveId || cancellingLeaveId) return;

    setCancellingLeaveId(leaveId);
    try {
      const response = await axios.patch(`/leaves/${leaveId}/cancel`, {
        remarks: cancelDialog.remarks.trim() || "Cancelled by employee",
      });
      setLeaves((current) => {
        const updated = current.map((item) =>
          String(item._id || item.id) === String(leaveId)
            ? {
                ...item,
                status: "Cancelled",
                cancellationReason:
                  response.data?.data?.cancellationReason ||
                  cancelDialog.remarks.trim() ||
                  "Cancelled by employee",
                cancelledAt: response.data?.data?.cancelledAt,
                cancelledBy: response.data?.data?.cancelledBy,
                history: response.data?.data?.history || item.history,
              }
            : item
        );
        calculateStats(updated);
        return updated;
      });
      setNotification({
        message: response.data?.message || "Leave cancelled and balance credited back.",
        severity: "success",
        autoHide: true,
      });
      showToast(response.data?.message || "Leave cancelled successfully", "success");
      setCancelDialog({ open: false, leave: null, remarks: "" });
    } catch (error) {
      const message =
        error.response?.data?.error || error.response?.data?.message || "Unable to cancel leave";
      setNotification({ message, severity: "error" });
      showToast(message, "error");
    } finally {
      setCancellingLeaveId(null);
    }
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

  // Stat calculations for Hero Banner
  const totalCount = stats.total || 0;
  const approvedPercent = totalCount > 0 ? Math.round((stats.approved / totalCount) * 100) : 0;
  const pendingPercent = totalCount > 0 ? Math.round((stats.pending / totalCount) * 100) : 0;
  const rejectedPercent = totalCount > 0 ? Math.round((stats.rejected / totalCount) * 100) : 0;

  const dateRangeLabel =
    dateRangeFilter === "THIS_MONTH"
      ? "This Month"
      : dateRangeFilter === "LAST_30_DAYS"
      ? "Last 30 Days"
      : dateRangeFilter === "THIS_YEAR"
      ? "This Year"
      : "Select Date Range";

  const statusLabel = statusFilter === "ALL" ? "All Status" : statusFilter;

  return (
    <div className="MyLeaves-container" ref={containerRef}>
      {/* 1. HERO GRADIENT BANNER */}
      <div className="MyLeaves-hero-banner">
        <div className="MyLeaves-hero-header">
          <div className="MyLeaves-hero-title-area">
            <h1 className="MyLeaves-hero-title">Leave Management</h1>
            <p className="MyLeaves-hero-subtitle">Manage and track all your leave requests</p>
          </div>

          <button
            type="button"
            className="MyLeaves-hero-apply-btn"
            onClick={openApplyLeaveModal}
          >
            <FiPlus size={16} />
            <span>Apply Leave</span>
          </button>
        </div>

        {/* Embedded 4 KPI Stat Cards */}
        <div className="MyLeaves-kpi-grid">
          {/* Card 1: Total Leaves */}
          <div className="MyLeaves-kpi-card MyLeaves-kpi-total">
            <div className="MyLeaves-kpi-icon-box">
              <FiFileText size={22} />
            </div>
            <div className="MyLeaves-kpi-info">
              <span className="MyLeaves-kpi-label">Total Leaves</span>
              <span className="MyLeaves-kpi-value">{stats.total}</span>
              <span className="MyLeaves-kpi-subtext">All time leave requests</span>
            </div>
          </div>

          {/* Card 2: Approved */}
          <div className="MyLeaves-kpi-card MyLeaves-kpi-approved">
            <div className="MyLeaves-kpi-icon-box">
              <FiCheck size={20} />
            </div>
            <div className="MyLeaves-kpi-info">
              <span className="MyLeaves-kpi-label">Approved</span>
              <span className="MyLeaves-kpi-value">{stats.approved}</span>
              <span className="MyLeaves-kpi-subtext">{approvedPercent}% of total</span>
            </div>
          </div>

          {/* Card 3: Pending */}
          <div className="MyLeaves-kpi-card MyLeaves-kpi-pending">
            <div className="MyLeaves-kpi-icon-box">
              <FiClock size={20} />
            </div>
            <div className="MyLeaves-kpi-info">
              <span className="MyLeaves-kpi-label">Pending</span>
              <span className="MyLeaves-kpi-value">{stats.pending}</span>
              <span className="MyLeaves-kpi-subtext">{pendingPercent}% of total</span>
            </div>
          </div>

          {/* Card 4: Rejected */}
          <div className="MyLeaves-kpi-card MyLeaves-kpi-rejected">
            <div className="MyLeaves-kpi-icon-box">
              <FiX size={20} />
            </div>
            <div className="MyLeaves-kpi-info">
              <span className="MyLeaves-kpi-label">Rejected</span>
              <span className="MyLeaves-kpi-value">{stats.rejected}</span>
              <span className="MyLeaves-kpi-subtext">{rejectedPercent}% of total</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS & FILTERS ROW */}
      <div className="MyLeaves-controls-row">
        {/* Left: Status Filter Pills */}
        <div className="MyLeaves-status-pills">
          <button
            type="button"
            className={`MyLeaves-pill-btn MyLeaves-pill-all ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            <span>All</span>
            <span className="MyLeaves-pill-count">{stats.total}</span>
          </button>

          <button
            type="button"
            className={`MyLeaves-pill-btn MyLeaves-pill-approved ${statusFilter === "Approved" ? "active" : ""}`}
            onClick={() => setStatusFilter("Approved")}
          >
            <span>Approved</span>
            <span className="MyLeaves-pill-count">{stats.approved}</span>
          </button>

          <button
            type="button"
            className={`MyLeaves-pill-btn MyLeaves-pill-pending ${statusFilter === "Pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("Pending")}
          >
            <span>Pending</span>
            <span className="MyLeaves-pill-count">{stats.pending}</span>
          </button>

          <button
            type="button"
            className={`MyLeaves-pill-btn MyLeaves-pill-rejected ${statusFilter === "Rejected" ? "active" : ""}`}
            onClick={() => setStatusFilter("Rejected")}
          >
            <span>Rejected</span>
            <span className="MyLeaves-pill-count">{stats.rejected}</span>
          </button>
        </div>

        {/* Right: Search + Date Range + Status Dropdown */}
        <div className="MyLeaves-controls-right">
          {/* Search Box */}
          <div className="MyLeaves-search-wrapper">
            <FiSearch size={16} />
            <input
              type="text"
              className="MyLeaves-search-field"
              placeholder="Search by leave type or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Range Dropdown */}
          <div className="MyLeaves-dropdown-container">
            <button
              type="button"
              className="MyLeaves-filter-dropdown-btn"
              onClick={() => {
                setDateRangeDropdownOpen(!dateRangeDropdownOpen);
                setStatusDropdownOpen(false);
                setActiveActionMenuId(null);
              }}
            >
              <FiCalendar size={15} />
              <span>{dateRangeLabel}</span>
              <FiChevronDown size={15} />
            </button>

            {dateRangeDropdownOpen && (
              <div className="MyLeaves-dropdown-menu">
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${dateRangeFilter === "ALL" ? "active" : ""}`}
                  onClick={() => {
                    setDateRangeFilter("ALL");
                    setDateRangeDropdownOpen(false);
                  }}
                >
                  All Dates
                </button>
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${dateRangeFilter === "THIS_MONTH" ? "active" : ""}`}
                  onClick={() => {
                    setDateRangeFilter("THIS_MONTH");
                    setDateRangeDropdownOpen(false);
                  }}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${dateRangeFilter === "LAST_30_DAYS" ? "active" : ""}`}
                  onClick={() => {
                    setDateRangeFilter("LAST_30_DAYS");
                    setDateRangeDropdownOpen(false);
                  }}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${dateRangeFilter === "THIS_YEAR" ? "active" : ""}`}
                  onClick={() => {
                    setDateRangeFilter("THIS_YEAR");
                    setDateRangeDropdownOpen(false);
                  }}
                >
                  This Year
                </button>
              </div>
            )}
          </div>

          {/* All Status Dropdown */}
          <div className="MyLeaves-dropdown-container">
            <button
              type="button"
              className="MyLeaves-filter-dropdown-btn"
              onClick={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setDateRangeDropdownOpen(false);
                setActiveActionMenuId(null);
              }}
            >
              <FiFilter size={15} />
              <span>{statusLabel}</span>
              <FiChevronDown size={15} />
            </button>

            {statusDropdownOpen && (
              <div className="MyLeaves-dropdown-menu">
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${statusFilter === "ALL" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("ALL");
                    setStatusDropdownOpen(false);
                  }}
                >
                  All Status
                </button>
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${statusFilter === "Approved" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("Approved");
                    setStatusDropdownOpen(false);
                  }}
                >
                  Approved
                </button>
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${statusFilter === "Pending" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("Pending");
                    setStatusDropdownOpen(false);
                  }}
                >
                  Pending
                </button>
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${statusFilter === "Rejected" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("Rejected");
                    setStatusDropdownOpen(false);
                  }}
                >
                  Rejected
                </button>
                <button
                  type="button"
                  className={`MyLeaves-dropdown-item ${statusFilter === "Cancelled" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("Cancelled");
                    setStatusDropdownOpen(false);
                  }}
                >
                  Cancelled
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 9-COLUMN TABLE CARD */}
      <div className="MyLeaves-table-card">
        <div className="MyLeaves-table-scroll">
          {filteredLeaves.length === 0 ? (
            <div className="MyLeaves-empty-state-card">
              <FiAlertCircle className="MyLeaves-empty-icon" />
              <h3>No leaves found</h3>
              <p>
                {searchTerm || statusFilter !== "ALL" || dateRangeFilter !== "ALL"
                  ? "Try adjusting your search or filter criteria"
                  : "You haven't applied for any leaves yet"}
              </p>
            </div>
          ) : (
            <table className="MyLeaves-modern-table">
              <thead>
                <tr>
                  <th className="MyLeaves-col-num">#</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Approvers</th>
                  <th>Applied On</th>
                  <th style={{ textAlign: "right", paddingRight: "28px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.map((leave, index) => {
                  const leaveId = leave._id || leave.id;
                  const rowIndex = startIndex + index + 1;
                  const applied = formatAppliedDateTime(leave.createdAt || leave.appliedOn);
                  const statusLower = String(leave.status || "pending").toLowerCase();
                  const isNewlyUpdated = leaveId === recentlyUpdatedId;

                  return (
                    <tr
                      key={leaveId}
                      style={isNewlyUpdated ? { backgroundColor: "#eff6ff" } : undefined}
                    >
                      {/* 1. # */}
                      <td className="MyLeaves-col-num">{rowIndex}</td>

                      {/* 2. Type */}
                      <td>
                        <div className="MyLeaves-type-cell">
                          <span className="MyLeaves-type-badge">{leave.type}</span>
                          <span className="MyLeaves-pay-treatment-badge">
                            {getPayTreatment(leave)}
                          </span>
                        </div>
                      </td>

                      {/* 3. Period */}
                      <td>
                        <div className="MyLeaves-period-cell">
                          <FiCalendar size={16} className="MyLeaves-period-icon" />
                          <div className="MyLeaves-period-lines">
                            <span>{formatPeriodDate(leave.startDate)} -</span>
                            <span>{formatPeriodDate(leave.endDate)}</span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Days */}
                      <td>
                        <span className="MyLeaves-days-pill">
                          {leave.days || calculateDays(leave.startDate, leave.endDate)} day(s)
                        </span>
                      </td>

                      {/* 5. Reason */}
                      <td>
                        <div
                          className="MyLeaves-reason-cell-modern"
                          title={leave.reason}
                          onClick={() => openDetailModal(leave)}
                        >
                          {leave.reason}
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td>
                        <span className={`MyLeaves-status-badge-modern ${statusLower}`}>
                          {leave.status === "Approved" && <FiCheckCircle size={14} />}
                          {leave.status === "Pending" && <FiClock size={14} />}
                          {leave.status === "Rejected" && <FiXCircle size={14} />}
                          {leave.status === "Cancelled" && <FiXCircle size={14} />}
                          <span>{leave.status}</span>
                        </span>
                      </td>

                      {/* 7. Approvers */}
                      <td>
                        <ApproversCell leave={leave} />
                      </td>

                      {/* 8. Applied On */}
                      <td>
                        <div className="MyLeaves-applied-on-cell">
                          <FiCalendar size={15} style={{ color: "#94a3b8" }} />
                          <div className="MyLeaves-applied-on-lines">
                            <span className="MyLeaves-applied-date">{applied.date}</span>
                            <span className="MyLeaves-applied-time">{applied.time}</span>
                          </div>
                        </div>
                      </td>

                      {/* 9. Actions */}
                      <td>
                        <div
                          className="MyLeaves-actions-cell"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            type="button"
                            className="MyLeaves-view-history-btn"
                            onClick={() => openHistoryModal(leave)}
                            disabled={!leave.history || leave.history.length === 0}
                            title={
                              !leave.history || leave.history.length === 0
                                ? "No history records available"
                                : "View leave history"
                            }
                          >
                            <FiList size={14} />
                            <span>View History</span>
                          </button>

                          <div style={{ position: "relative" }}>
                            <button
                              type="button"
                              className="MyLeaves-dots-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(
                                  activeActionMenuId === leaveId ? null : leaveId
                                );
                              }}
                              aria-label="Actions menu"
                            >
                              <FiMoreVertical size={16} />
                            </button>

                            {activeActionMenuId === leaveId && (
                              <div className="MyLeaves-row-action-menu">
                                <button
                                  type="button"
                                  className="MyLeaves-row-action-item"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    openDetailModal(leave);
                                  }}
                                >
                                  <FiEye size={14} />
                                  <span>View Details</span>
                                </button>
                                {canCancelLeave(leave) && (
                                  <button
                                    type="button"
                                    className="MyLeaves-row-action-item danger"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setCancelDialog({ open: true, leave, remarks: "" });
                                    }}
                                  >
                                    <FiXCircle size={14} />
                                    <span>Cancel Request</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. PAGINATION */}
        <div className="MyLeaves-pagination-bar">
          <div className="MyLeaves-pagination-info">
            Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} requests
          </div>

          <div className="MyLeaves-pagination-controls">
            <button
              type="button"
              className="MyLeaves-page-arrow-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`MyLeaves-page-num-btn ${safePage === pageNum ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="MyLeaves-page-arrow-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM CTA BANNER */}
      <div className="MyLeaves-cta-banner">
        <div className="MyLeaves-cta-left">
          <div className="MyLeaves-cta-icon-box">
            <FiCalendar size={24} />
          </div>
          <div className="MyLeaves-cta-text">
            <h2 className="MyLeaves-cta-title">Need to apply for leave?</h2>
            <p className="MyLeaves-cta-desc">
              Click on the "Apply Leave" button to submit a new leave request.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="MyLeaves-cta-btn"
          onClick={openApplyLeaveModal}
        >
          <FiPlus size={16} />
          <span>Apply Leave</span>
        </button>
      </div>

      {/* 6. MODALS & DIALOGS */}

      {/* CANCEL LEAVE DIALOG */}
      {cancelDialog.open && cancelDialog.leave && (
        <div
          className="MyLeaves-cancel-dialog-overlay"
          onMouseDown={() =>
            !cancellingLeaveId && setCancelDialog({ open: false, leave: null, remarks: "" })
          }
        >
          <div
            className="MyLeaves-cancel-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-leave-title"
          >
            <div className="MyLeaves-cancel-dialog-icon">
              <FiAlertTriangle />
            </div>
            <button
              type="button"
              className="MyLeaves-cancel-dialog-close"
              onClick={() => setCancelDialog({ open: false, leave: null, remarks: "" })}
              disabled={Boolean(cancellingLeaveId)}
              aria-label="Close cancellation dialog"
            >
              <FiX />
            </button>
            <span className="MyLeaves-cancel-dialog-eyebrow">Leave cancellation</span>
            <h2 id="cancel-leave-title">Cancel this leave request?</h2>
            <p>The request will be marked as cancelled and its reserved balance will be credited back.</p>

            <div className="MyLeaves-cancel-dialog-summary">
              <div>
                <small>Leave type</small>
                <strong>{cancelDialog.leave.type}</strong>
              </div>
              <div>
                <small>Leave period</small>
                <strong>
                  {formatPeriodDate(cancelDialog.leave.startDate)} –{" "}
                  {formatPeriodDate(cancelDialog.leave.endDate)}
                </strong>
              </div>
              <div>
                <small>Days credited</small>
                <strong>
                  {cancelDialog.leave.days ||
                    calculateDays(cancelDialog.leave.startDate, cancelDialog.leave.endDate)}{" "}
                  day(s)
                </strong>
              </div>
            </div>

            <label className="MyLeaves-cancel-dialog-reason">
              <span>
                Cancellation reason <small>(optional)</small>
              </span>
              <textarea
                rows="3"
                maxLength="500"
                value={cancelDialog.remarks}
                onChange={(event) =>
                  setCancelDialog((current) => ({ ...current, remarks: event.target.value }))
                }
                placeholder="Why are you cancelling this leave?"
                disabled={Boolean(cancellingLeaveId)}
              />
              <small>{cancelDialog.remarks.length}/500</small>
            </label>

            <div className="MyLeaves-cancel-dialog-note">
              <FiInfo /> Cancellation is allowed only until the leave start date.
            </div>
            <div className="MyLeaves-cancel-dialog-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setCancelDialog({ open: false, leave: null, remarks: "" })}
                disabled={Boolean(cancellingLeaveId)}
              >
                Keep Leave
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => cancelLeave(cancelDialog.leave)}
                disabled={Boolean(cancellingLeaveId)}
              >
                <FiXCircle /> {cancellingLeaveId ? "Cancelling..." : "Yes, Cancel Leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedLeave && (
        <div className="MyLeaves-detail-overlay" onClick={closeDetailModal}>
          <div className="MyLeaves-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="MyLeaves-detail-header">
              <h2>Leave Details</h2>
              <button
                type="button"
                className="MyLeaves-detail-close"
                onClick={closeDetailModal}
                aria-label="Close leave details"
              >
                <FiX />
              </button>
            </div>

            <div className="MyLeaves-detail-body">
              <div className="MyLeaves-detail-grid">
                <div className="MyLeaves-detail-card">
                  <span className="MyLeaves-detail-label">Type</span>
                  <span className="MyLeaves-detail-value">{selectedLeave.type}</span>
                </div>

                <div className="MyLeaves-detail-card">
                  <span className="MyLeaves-detail-label">Status</span>
                  <span
                    className={`MyLeaves-detail-value status status-${selectedLeave.status?.toLowerCase()}`}
                  >
                    {selectedLeave.status}
                  </span>
                </div>

                <div className="MyLeaves-detail-card">
                  <span className="MyLeaves-detail-label">Pay Treatment</span>
                  <span
                    className={`MyLeaves-detail-value MyLeaves-pay-detail MyLeaves-pay-${getPayTreatment(
                      selectedLeave
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {getPayTreatment(selectedLeave)}
                  </span>
                </div>

                <div className="MyLeaves-detail-card">
                  <span className="MyLeaves-detail-label">Period</span>
                  <span className="MyLeaves-detail-value">
                    {formatPeriodDate(selectedLeave.startDate)} -{" "}
                    {formatPeriodDate(selectedLeave.endDate)}
                  </span>
                </div>

                <div className="MyLeaves-detail-card">
                  <span className="MyLeaves-detail-label">Days</span>
                  <span className="MyLeaves-detail-value">
                    {selectedLeave.days ||
                      calculateDays(selectedLeave.startDate, selectedLeave.endDate)}
                  </span>
                </div>

                <div className="MyLeaves-detail-card">
                  <span className="MyLeaves-detail-label">Applied On</span>
                  <span className="MyLeaves-detail-value">
                    {formatPeriodDate(selectedLeave.createdAt || selectedLeave.appliedOn)}
                  </span>
                </div>
              </div>

              <div className="MyLeaves-detail-section">
                <h4>Approval Flow</h4>
                <ApproversCell leave={selectedLeave} />
              </div>

              <div className="MyLeaves-detail-section MyLeaves-detail-reason">
                <h4>Reason</h4>
                <p>{selectedLeave.reason}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      {isApplyModalOpen && (
        <div
          className="MyLeaves-apply-modal-overlay"
          onClick={() => setIsApplyModalOpen(false)}
        >
          <div
            className="MyLeaves-apply-modal"
            onClick={(event) => event.stopPropagation()}
          >
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
                  <span className="MyLeaves-apply-title-icon">
                    <FiCalendar />
                  </span>
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
                            {leaveTypesLoading
                              ? "Loading leave policies..."
                              : "No applicable leave type"}
                          </option>
                        )}
                        {leaveTypes.map((leaveType) => (
                          <option key={leaveType} value={leaveType}>
                            {leaveType}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedPolicy && (
                      <div className="MyLeaves-eligibility-line">
                        <FiCheckCircle />{" "}
                        {userDepartmentName && userJobRoleName
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
                        min={new Date().toISOString().split("T")[0]}
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
                        min={form.startDate || new Date().toISOString().split("T")[0]}
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
                    <section
                      className="MyLeaves-policy-summary"
                      aria-label="Selected leave policy summary"
                    >
                      <div className="MyLeaves-policy-summary-head">
                        <div>
                          <strong>{selectedPolicy.policyName}</strong>
                        </div>
                        <span
                          className={`MyLeaves-pay-badge ${
                            selectedPolicy.payType === "Unpaid"
                              ? "unpaid"
                              : selectedPolicy.payType === "Admin Choice"
                              ? "decision"
                              : "paid"
                          }`}
                        >
                          {selectedPolicy.payType === "Admin Choice"
                            ? "Admin will decide"
                            : selectedPolicy.payType || "Paid"}
                        </span>
                      </div>
                      <div className="MyLeaves-policy-metrics">
                        <div>
                          <span>Annual Entitlement</span>
                          <strong>
                            {selectedPolicy.balance?.allocated ?? selectedPolicy.entitledDays} days
                          </strong>
                        </div>
                        <div>
                          <span>Used Days</span>
                          <strong>{selectedPolicy.balance?.used ?? 0}</strong>
                        </div>
                        <div className="remaining">
                          <span>Remaining Days</span>
                          <strong>
                            {selectedPolicy.balance?.remaining ?? selectedPolicy.entitledDays} days
                          </strong>
                        </div>
                        <div>
                          <span>Monthly Limit</span>
                          <strong>
                            {selectedPolicy.balance?.monthlyLimit ?? selectedPolicy.monthlyAllowed}{" "}
                            days
                          </strong>
                        </div>
                        <div>
                          <span>Used This Month</span>
                          <strong>{selectedPolicy.balance?.usedThisMonth ?? 0}</strong>
                        </div>
                        <div className="remaining">
                          <span>Remaining This Month</span>
                          <strong>
                            {selectedPolicy.balance?.remainingThisMonth ??
                              selectedPolicy.monthlyAllowed}{" "}
                            days
                          </strong>
                        </div>
                      </div>
                      <div className="MyLeaves-policy-rules">
                        <span>
                          Carry forward: <b>{selectedPolicy.carryForward}</b>
                        </span>
                        <span>
                          Max CF: <b>{selectedPolicy.maxCarryForwardDays || 0}</b>
                        </span>
                        <span>
                          Encashment: <b>{selectedPolicy.encashmentAllowed}</b>
                        </span>
                        <span>
                          Probation: <b>{selectedPolicy.probationApplicable}</b>
                        </span>
                        {(selectedPolicy.balance?.pending ?? 0) > 0 && (
                          <span>
                            Pending: <b>{selectedPolicy.balance.pending} days</b>
                          </span>
                        )}
                      </div>
                    </section>
                  )}

                  {policyValidationMessage && (
                    <div
                      className={`MyLeaves-policy-validation ${hasDateRange ? "error" : "info"}`}
                      role="status"
                    >
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
                      className={`MyLeaves-form-textarea ${
                        reasonError ? "MyLeaves-form-textarea-error" : ""
                      }`}
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
                    <p>
                      {selectedPolicy
                        ? `Based on ${selectedPolicy.policyName} policy`
                        : "Select a leave policy"}
                    </p>
                  </div>
                  <div className="MyLeaves-guideline-cards">
                    <div>
                      <span>
                        <FiCalendar />
                      </span>
                      <p>
                        <b>Leave Type</b>
                        <small>
                          {selectedPolicy?.payType === "Admin Choice"
                            ? "Pay type decided on approval"
                            : `${selectedPolicy?.payType || "—"} leave`}
                        </small>
                      </p>
                    </div>
                    <div>
                      <span>
                        <FiClock />
                      </span>
                      <p>
                        <b>Monthly Limit</b>
                        <small>
                          {selectedPolicy ? `Maximum ${selectedPolicy.monthlyAllowed} days` : "—"}
                        </small>
                      </p>
                    </div>
                    <div>
                      <span>↻</span>
                      <p>
                        <b>Carry Forward</b>
                        <small>
                          {selectedPolicy?.carryForward === "Yes"
                            ? `Up to ${selectedPolicy.maxCarryForwardDays} days`
                            : "Not allowed"}
                        </small>
                      </p>
                    </div>
                    <div>
                      <span>
                        <FiUser />
                      </span>
                      <p>
                        <b>Probation</b>
                        <small>
                          {selectedPolicy?.probationApplicable === "Yes"
                            ? "Eligible"
                            : "Not eligible"}
                        </small>
                      </p>
                    </div>
                  </div>
                  <div className="MyLeaves-guidelines-note">
                    <FiCheckCircle />
                    <span>
                      {selectedPolicy
                        ? `${
                            selectedPolicy.balance?.remaining ?? selectedPolicy.entitledDays
                          } days currently available under this policy.`
                        : "Select a leave type to view current availability."}
                    </span>
                  </div>
                  <div className="MyLeaves-submit-checklist">
                    <div className="MyLeaves-submit-checklist-head">
                      <span>
                        <FiInfo />
                      </span>
                      <div>
                        <b>Before You Submit</b>
                        <small>Quick request checklist</small>
                      </div>
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
                    {loading ? (
                      "Applying..."
                    ) : (
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

      {/* HISTORY MODAL */}
      {historyDialog.open && (
        <div className="MyLeaves-modal-overlay MyLeaves-history-overlay">
          <div className="MyLeaves-modal MyLeaves-history-modal">
            <div className="MyLeaves-modal-header">
              <div className="MyLeaves-history-modal-title">
                <span className="MyLeaves-history-modal-eyebrow">Leave history</span>
                <h2>{historyDialog.title}</h2>
              </div>
              <span className="MyLeaves-history-count">
                {historyDialog.items.length} update
                {historyDialog.items.length === 1 ? "" : "s"}
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
                      <div
                        key={index}
                        className={`MyLeaves-history-item MyLeaves-history-${action}`}
                      >
                        <div className="MyLeaves-history-icon" aria-hidden="true">
                          {action === "approved" && <FiCheckCircle />}
                          {action === "rejected" && <FiXCircle />}
                          {action !== "approved" && action !== "rejected" && <FiClock />}
                        </div>
                        <div className="MyLeaves-history-content">
                          <div className="MyLeaves-history-row-top">
                            <p className="MyLeaves-history-text">{historyText}</p>
                            <span className="MyLeaves-history-action-pill">{action}</span>
                          </div>
                          <p className="MyLeaves-history-time">
                            {item.at ? new Date(item.at).toLocaleString() : "Unknown date"}
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
                          {item.newLeaveType &&
                            item.previousLeaveType &&
                            item.newLeaveType !== item.previousLeaveType && (
                              <p className="MyLeaves-history-decision">
                                <strong>Leave type:</strong> {item.previousLeaveType} →{" "}
                                {item.newLeaveType}
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

      {/* NOTIFICATION SNACKBAR */}
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
            <span className="MyLeaves-notification-message">{notification.message}</span>
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
