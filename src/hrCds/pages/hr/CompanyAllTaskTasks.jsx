import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../utils/axiosConfig";
import "./CompanyAllTaskTasks.css";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFilter,
  FiList,
  FiMail,
  FiMessageSquare,
  FiPause,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status", color: "#475569" },
  { value: "pending", label: "Pending", color: "#f59e0b" },
  { value: "in-progress", label: "In Progress", color: "#0ea5e9" },
  { value: "completed", label: "Completed", color: "#16a34a" },
  { value: "overdue", label: "Overdue", color: "#dc2626" },
  { value: "onhold", label: "On Hold", color: "#7c3aed" },
  { value: "reopen", label: "Reopen", color: "#db2777" },
  { value: "rejected", label: "Rejected", color: "#ef4444" },
  { value: "cancelled", label: "Cancelled", color: "#64748b" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const PERIOD_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "overdue", label: "Overdue" },
];

const emptyStats = {
  total: 0,
  pending: { count: 0, percentage: 0 },
  inProgress: { count: 0, percentage: 0 },
  completed: { count: 0, percentage: 0 },
  overdue: { count: 0, percentage: 0 },
  onhold: { count: 0, percentage: 0 },
};

const normalizeStatus = (status) => {
  if (!status) return "pending";
  const lower = String(status).toLowerCase().trim();
  const mapping = {
    "in progress": "in-progress",
    inprogress: "in-progress",
    "in-progress": "in-progress",
    "on hold": "onhold",
    onhold: "onhold",
    "re-open": "reopen",
    "re open": "reopen",
    canceled: "cancelled",
    cancelled: "cancelled",
  };
  return mapping[lower] || lower;
};

const getDueDate = (task) => task?.dueDateTime || task?.dueDate;

const isOverdue = (task) => {
  const dueDate = getDueDate(task);
  if (!dueDate) return false;
  const status = normalizeStatus(task.userStatus || task.status || task.overallStatus);
  if (status === "completed" || status === "cancelled") return false;

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const getDisplayStatus = (task) => {
  const status = normalizeStatus(task?.userStatus || task?.status || task?.overallStatus);
  return isOverdue(task) ? "overdue" : status;
};

const getTaskType = (task) => {
  if (task?.source === "assigned" || task?.source === "client") return "assigned";
  if (task?.taskType === "assigned" || task?.taskType === "client") return "assigned";
  if (task?.clientId || task?.isClientTask || task?.assignedBy) return "assigned";
  if (task?.userStatus && !task?.status) return "assigned";
  return "personal";
};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user") || localStorage.getItem("currentUser");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.user || parsed;
  } catch {
    return null;
  }
};

const extractUsers = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.message?.users)) return data.message.users;
  return [];
};

const getStatusMeta = (status) => {
  const normalized = normalizeStatus(status);
  return STATUS_OPTIONS.find((item) => item.value === normalized) || STATUS_OPTIONS[1];
};

const countStats = (tasks) => {
  const counts = {
    pending: 0,
    "in-progress": 0,
    completed: 0,
    overdue: 0,
    onhold: 0,
  };

  tasks.forEach((task) => {
    const status = getDisplayStatus(task);
    if (counts[status] !== undefined) counts[status] += 1;
  });

  const total = tasks.length;
  const toStat = (count) => ({
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  });

  return {
    total,
    pending: toStat(counts.pending),
    inProgress: toStat(counts["in-progress"]),
    completed: toStat(counts.completed),
    overdue: toStat(counts.overdue),
    onhold: toStat(counts.onhold),
  };
};

const normalizeStats = (payload, fallbackTasks) => {
  const counts = payload?.statusCounts || payload?.stats || payload;
  if (!counts || typeof counts !== "object") return countStats(fallbackTasks);

  const total = counts.total?.count || counts.total || fallbackTasks.length || 0;
  const normalizeItem = (key, fallbackKey = key) => {
    const value = counts[key] || counts[fallbackKey] || 0;
    if (typeof value === "object") {
      return {
        count: value.count || 0,
        percentage: value.percentage || 0,
      };
    }
    return {
      count: value || 0,
      percentage: total > 0 ? Math.round(((value || 0) / total) * 100) : 0,
    };
  };

  return {
    total,
    pending: normalizeItem("pending"),
    inProgress: normalizeItem("inProgress", "in-progress"),
    completed: normalizeItem("completed"),
    overdue: normalizeItem("overdue"),
    onhold: normalizeItem("onhold"),
  };
};

const CompanyAllTaskTasks = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const currentUser = useMemo(getStoredUser, []);

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [taskDetailsById, setTaskDetailsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("today");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (userId) return;
    setLoading(false);
    setError("Please select an employee from Company All Task.");
  }, [userId]);

  const fetchEmployee = useCallback(async () => {
    if (!userId) return;

    const companyId = currentUser?.company?._id || currentUser?.company;
    const departmentId = currentUser?.department?._id || currentUser?.department;
    const urls = [];

    if (companyId) urls.push(`/users/company-users?companyId=${companyId}`);
    if (departmentId) urls.push(`/users/department-users?department=${departmentId}`);
    urls.push("/users/company-users", "/auth/users");

    for (const url of urls) {
      try {
        const response = await axios.get(url);
        const found = extractUsers(response).find((user) => (user._id || user.id) === userId);
        if (found) {
          setEmployee({ ...found, _id: found._id || found.id });
          return;
        }
      } catch {
        // Try the next available endpoint.
      }
    }
  }, [currentUser, userId]);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const nextStatus = period === "overdue" && status === "all" ? "overdue" : status;
      const response = await axios.get(`/task/user/${userId}/all-tasks`, {
        params: {
          page,
          limit,
          period: period === "overdue" ? "all" : period,
          search,
          status: nextStatus,
          priority,
        },
      });

      const nextTasks = response.data?.tasks || response.data?.data || [];
      setTasks(nextTasks);
      setTotal(response.data?.pagination?.total || response.data?.total || nextTasks.length);
      setTotalPages(response.data?.pagination?.pages || 1);
      setStats(countStats(  ));

      try {
        const statsResponse = await axios.get(`/task/user/${userId}/stats`, {
          params: {
            period: period === "overdue" ? "all" : period,
            search,
            status: nextStatus,
            priority,
          },
        });
        setStats(normalizeStats(statsResponse.data, nextTasks));
      } catch {
        setStats(countStats(nextTasks));
      }

      if (nextTasks.length === 0) setTaskDetailsById({});
    } catch (err) {
      setTasks([]);
      setTaskDetailsById({});
      setStats(emptyStats);
      setError(err?.response?.data?.message || err?.response?.data?.error || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [limit, page, period, priority, search, status, userId]);

  const fetchTaskDetails = useCallback(async (task) => {
    if (!task?._id) {
      return { remarks: [], activityLogs: [] };
    }

    const type = getTaskType(task);

    try {
      const remarksUrl = type === "assigned"
        ? `/tasks/${task._id}/client-remarks`
        : `/task/${task._id}/remarks`;
      const activityUrl = type === "assigned"
        ? `/tasks/${task._id}/client-activity-logs`
        : `/task/${task._id}/activity-logs`;

      const [remarksResponse, activityResponse] = await Promise.allSettled([
        axios.get(remarksUrl),
        axios.get(activityUrl),
      ]);

      const remarksPayload = remarksResponse.status === "fulfilled" ? remarksResponse.value.data : {};
      const activityPayload = activityResponse.status === "fulfilled" ? activityResponse.value.data : {};
      return {
        remarks: remarksPayload.data || remarksPayload.remarks || [],
        activityLogs: activityPayload.logs || activityPayload.data || activityPayload.activityLogs || [],
      };
    } catch {
      return { remarks: [], activityLogs: [] };
    }
  }, []);

  const fetchVisibleTaskDetails = useCallback(async (tasksList) => {
    if (!Array.isArray(tasksList) || tasksList.length === 0) return;

    const entries = await Promise.all(
      tasksList.map(async (task) => {
        const details = await fetchTaskDetails(task);
        return [task._id, { ...details, loading: false }];
      })
    );

    setTaskDetailsById((previous) => ({
      ...previous,
      ...Object.fromEntries(entries),
    }));
  }, [fetchTaskDetails]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 250);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  useEffect(() => {
    if (tasks.length === 0) return;
    const missingTasks = tasks.filter((task) => !taskDetailsById[task._id]);
    if (missingTasks.length === 0) return;

    setTaskDetailsById((previous) => {
      const next = { ...previous };
      missingTasks.forEach((task) => {
        next[task._id] = { remarks: [], activityLogs: [], loading: true };
      });
      return next;
    });

    fetchVisibleTaskDetails(missingTasks);
  }, [fetchVisibleTaskDetails, taskDetailsById, tasks]);

  const filteredStats = [
    { label: "Total", value: stats.total || total || 0, icon: FiList, color: "#2563eb" },
    { label: "Pending", value: stats.pending?.count || 0, icon: FiClock, color: "#f59e0b" },
    { label: "In Progress", value: stats.inProgress?.count || 0, icon: FiActivity, color: "#0ea5e9" },
    { label: "Completed", value: stats.completed?.count || 0, icon: FiCheckCircle, color: "#16a34a" },
    { label: "Overdue", value: stats.overdue?.count || 0, icon: FiAlertTriangle, color: "#dc2626" },
  ];

  const employeeName = employee?.name || tasks[0]?.assignedUsers?.[0]?.name || "Employee";

  const handleReset = () => {
    setSearch("");
    setPeriod("today");
    setStatus("all");
    setPriority("all");
    setPage(1);
  };

  return (
    <main className="company-task-page">
      <section className="company-task-hero">
        <button className="company-task-back" type="button" onClick={() => navigate("/ciisUser/company-all-task")}>
          <FiArrowLeft size={18} />
          Back
        </button>

        <div className="company-task-identity">
          <div className="company-task-avatar">{getInitials(employeeName)}</div>
          <div>
            <p className="company-task-eyebrow">Company Tasks</p>
            <h1>{employeeName}</h1>
            <div className="company-task-meta">
              {employee?.email && (
                <span><FiMail size={14} />{employee.email}</span>
              )}
              {employee?.role && (
                <span><FiUser size={14} />{employee.role}</span>
              )}
              {employee?.department?.name && (
                <span><FiUsers size={14} />{employee.department.name}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="company-task-error">
          <FiAlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="company-task-stats">
        {filteredStats.map((item) => {
          const Icon = item.icon;
          return (
            <article className="company-task-stat" key={item.label}>
              <div className="company-task-stat-icon" style={{ color: item.color }}>
                <Icon size={20} />
              </div>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="company-task-toolbar">
        <div className="company-task-search">
          <FiSearch size={16} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search title, description, task id..."
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="company-task-filters">
          <FiFilter size={16} />
          <select value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); }}>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={priority} onChange={(event) => { setPriority(event.target.value); setPage(1); }}>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button type="button" className="company-task-reset" onClick={handleReset}>
            <FiRefreshCw size={15} />
            Reset
          </button>
        </div>
      </section>

      <section className="company-task-content">
        <div className="company-task-list-panel">
          <div className="company-task-list-head">
            <div>
              <h2>{period === "today" ? "Today Tasks" : "Tasks"}</h2>
              <p>{loading ? "Loading..." : `${total} tasks found`}</p>
            </div>
            <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          {loading ? (
            <div className="company-task-loading">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="company-task-empty">
              <FiList size={30} />
              <h3>No tasks found</h3>
              <p>Try changing filters or search text.</p>
            </div>
          ) : (
            <div className="company-task-list">
              {tasks.map((task) => {
                const displayStatus = getDisplayStatus(task);
                const statusMeta = getStatusMeta(displayStatus);
                const taskType = getTaskType(task);
                const details = taskDetailsById[task._id] || { remarks: [], activityLogs: [], loading: true };
                const visibleRemarks = details.remarks.slice(0, 4);
                const visibleActivity = details.activityLogs.slice(0, 5);

                return (
                  <article
                    className="company-task-row"
                    key={task._id}
                    style={{ "--status-color": statusMeta.color }}
                  >
                    <div className="company-task-row-main">
                      <div>
                        <h3>{task.title || "Untitled Task"}</h3>
                        <p>{task.description || "No description available"}</p>
                      </div>
                      <span className="company-task-priority">{task.priority || "medium"}</span>
                    </div>
                    <div className="company-task-row-foot">
                      <span className="company-task-status" style={{ color: statusMeta.color }}>
                        {statusMeta.label}
                      </span>
                      <span>{taskType === "assigned" ? "Assigned" : "Personal"}</span>
                      <span><FiCalendar size={13} />{formatDate(getDueDate(task))}</span>
                    </div>

                    <div className="company-task-inline-details">
                      <div className="company-task-inline-section">
                        <h4><FiMessageSquare size={15} />Remarks</h4>
                        {details.loading ? (
                          <p className="company-task-muted">Loading remarks...</p>
                        ) : visibleRemarks.length === 0 ? (
                          <p className="company-task-muted">No remarks yet.</p>
                        ) : (
                          <div className="company-task-remarks">
                            {visibleRemarks.map((remark, index) => (
                              <div className="company-task-remark" key={remark._id || index}>
                                <strong>{remark.user?.name || remark.userName || "User"}</strong>
                                <span>{formatDateTime(remark.createdAt)}</span>
                                <p>{remark.text || remark.remark || remark.message || remark.remarks || "No remark text"}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="company-task-inline-section">
                        <h4><FiActivity size={15} />Activity</h4>
                        {details.loading ? (
                          <p className="company-task-muted">Loading activity...</p>
                        ) : visibleActivity.length === 0 ? (
                          <p className="company-task-muted">No activity recorded.</p>
                        ) : (
                          <div className="company-task-timeline">
                            {visibleActivity.map((log, index) => (
                              <div className="company-task-log" key={log._id || index}>
                                <div className="company-task-dot" />
                                <div>
                                  <strong>{log.action || log.status || "Activity"}</strong>
                                  <span>{formatDateTime(log.createdAt || log.timestamp)}</span>
                                  <p>{log.description || log.message || log.remarks || "No activity details"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="company-task-pagination">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <FiChevronLeft size={16} />
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Next
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CompanyAllTaskTasks;
