import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "../../../utils/axiosConfig";
import API_URL from "../../../config";
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
  FiEdit2,
  FiFilter,
  FiList,
  FiMail,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
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
  return status;
};

const getTaskType = (task) => {
  if (task?.source === "assigned" || task?.source === "client") return "assigned";
  if (task?.taskType === "assigned" || task?.taskType === "client") return "assigned";
  if (task?.clientId || task?.isClientTask || task?.assignedBy) return "assigned";
  if (task?.userStatus && !task?.status) return "assigned";
  return "personal";
};

const getTaskSource = (task) => {
  const source = String(task?.__taskSource || task?.taskSource || task?.source || "").toLowerCase();
  if (["client", "project", "self", "personal", "assigned"].includes(source)) {
    return source === "personal" ? "self" : source;
  }
  return getTaskType(task) === "assigned" ? "assigned" : "self";
};

const getClientTaskMeta = (task) => {
  const clientName = task?.clientName || task?.clientId?.client || task?.clientId?.name || "";
  const assigneeName = task?.assigneeName || task?.assigneeId?.name || task?.assignedToName || task?.assignee || "";
  const serviceName = task?.serviceName || task?.service || task?.planName || "";

  return {
    clientName: clientName || "Unknown Client",
    assigneeName: assigneeName || "Unassigned",
    serviceName: serviceName || "No service",
  };
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const baseUrl = API_URL.replace(/\/api\/?$/, "");
  const cleanPath = String(imagePath).replace(/\\/g, "/").replace(/^\/+/, "");

  if (cleanPath.startsWith("uploads/")) return `${baseUrl}/${cleanPath}`;
  if (cleanPath.startsWith("client-remarks/") || cleanPath.startsWith("remarks/")) {
    return `${baseUrl}/uploads/${cleanPath}`;
  }
  return `${baseUrl}/uploads/remarks/${cleanPath.split("/").pop()}`;
};

const getRemarkImages = (remark) => {
  const images = Array.isArray(remark?.images) ? remark.images : [];
  const paths = images
    .map((image) => typeof image === "string" ? image : image?.url || image?.path)
    .filter(Boolean);

  if (remark?.image) paths.push(remark.image);
  return [...new Set(paths)];
};

const extractRemarks = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.remarks)) return payload.remarks;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.remarks)) return payload.data.remarks;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
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

const getDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const getDateTimeInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
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

const getCleanCheckpoints = (checkpoints = []) => (
  Array.isArray(checkpoints)
    ? checkpoints
        .map((checkpoint) => ({
          _id: checkpoint._id,
          title: String(checkpoint.title || "").trim(),
          completed: Boolean(checkpoint.completed),
        }))
        .filter((checkpoint) => checkpoint.title)
    : []
);

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
  const [searchParams] = useSearchParams();
  const currentUser = useMemo(getStoredUser, []);
  const initialDate = useMemo(() => {
    const queryDate = searchParams.get("date");
    return queryDate || getDateInputValue();
  }, [searchParams]);

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [workSummary, setWorkSummary] = useState(null);
  const [taskDetailsById, setTaskDetailsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activityModal, setActivityModal] = useState({ open: false, task: null, logs: [] });
  const [remarksModal, setRemarksModal] = useState({ open: false, task: null, remarks: [] });
  const [editModal, setEditModal] = useState({ open: false, task: null });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDateTime: "",
    priority: "medium",
    status: "pending",
    checkpoints: [],
  });
  const [savingTaskId, setSavingTaskId] = useState(null);

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
    urls.push("/users/company-users");

    for (const url of urls) {
      try {
        const response = await axios.get(url);
        const found = extractUsers(response).find((user) => (user._id || user.id) === userId);
        if (found) {
          setEmployee({ ...found, _id: found._id || found.id });
          return;
        }
      } catch {
        
      }
    }
  }, [currentUser, userId]);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`/task/user/${userId}/all-tasks`, {
        params: {
          page,
          limit,
          period: selectedDate ? "all" : "today",
          fromDate: selectedDate,
          toDate: selectedDate,
          search,
          status,
          priority,
        },
      });

      const nextTasks = response.data?.tasks || response.data?.data || [];
      const displayTotal = response.data?.pagination?.total || response.data?.total || nextTasks.length;
      const displayPages = response.data?.pagination?.pages || 1;
      const displayStats = normalizeStats(response.data, nextTasks);

      setTasks(nextTasks);
      setWorkSummary(response.data?.workSummary || null);
      setTotal(displayTotal);
      setTotalPages(displayPages);
      // Status-card filtering should only change the task list. Keep the
      // cross-status summary counts from the unfiltered response so Total and
      // the other cards do not collapse to the selected status/zero.
      if (status === "all") {
        setStats(displayStats);
      }

      if (nextTasks.length === 0) setTaskDetailsById({});
    } catch (err) {
      setTasks([]);
      setWorkSummary(null);
      setTaskDetailsById({});
      if (status === "all") {
        setStats(emptyStats);
      }
      setError(err?.response?.data?.message || err?.response?.data?.error || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [limit, page, priority, search, selectedDate, status, userId]);

  const fetchTaskDetails = useCallback(async (task) => {
    if (!task?._id) {
      return { remarks: [], activityLogs: [] };
    }

    const source = getTaskSource(task);

    try {
      const remarksUrl = source === "client"
        ? `/tasks/client-tasks/${task._id}/client-remarks`
        : source === "project"
          ? `/tasks/project/${task.projectId}/tasks/${task._id}/remarks`
          : source === "self"
            ? `/tasks/self/${task._id}/remarks`
            : `/tasks/assigned/${task._id}/remarks`;
      const activityUrl = source === "client"
        ? `/tasks/client-tasks/${task._id}/client-activity-logs`
        : source === "project"
          ? `/tasks/project/${task.projectId}/tasks/${task._id}/activity`
          : `/task/${task._id}/activity-logs`;

      const [remarksResponse, activityResponse] = await Promise.allSettled([
        axios.get(remarksUrl, { _skipErrorNotify: true }),
        axios.get(activityUrl, { _skipErrorNotify: true }),
      ]);

      const remarksPayload = remarksResponse.status === "fulfilled" ? remarksResponse.value.data : {};
      const activityPayload = activityResponse.status === "fulfilled" ? activityResponse.value.data : {};
      return {
        remarks: extractRemarks(remarksPayload).length > 0
          ? extractRemarks(remarksPayload)
          : (Array.isArray(task.remarks) ? task.remarks : []),
        activityLogs: activityPayload.logs || activityPayload.data || activityPayload.activityLogs || [],
      };
    } catch {
      return { remarks: [], activityLogs: [] };
    }
  }, []);

  const fetchVisibleTaskDetails = useCallback(async (tasksList) => {
    if (!Array.isArray(tasksList) || tasksList.length === 0) return;

    const batchSize = 4;
    for (let index = 0; index < tasksList.length; index += batchSize) {
      const batch = tasksList.slice(index, index + batchSize);
      const entries = await Promise.all(
        batch.map(async (task) => {
          const details = await fetchTaskDetails(task);
          return [task._id, { ...details, loading: false }];
        })
      );

      setTaskDetailsById((previous) => ({
        ...previous,
        ...Object.fromEntries(entries),
      }));
    }
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
    { label: "Total", value: stats.total || total || 0, status: "all", icon: FiList, color: "#2563eb" },
    { label: "Pending", value: stats.pending?.count || 0, status: "pending", icon: FiClock, color: "#f59e0b" },
    { label: "In Progress", value: stats.inProgress?.count || 0, status: "in-progress", icon: FiActivity, color: "#0ea5e9" },
    { label: "Completed", value: stats.completed?.count || 0, status: "completed", icon: FiCheckCircle, color: "#16a34a" },
    { label: "Overdue", value: stats.overdue?.count || 0, status: "overdue", icon: FiAlertTriangle, color: "#dc2626" },
  ];

  const employeeName = employee?.name || tasks[0]?.assignedUsers?.[0]?.name || "Employee";

  const handleReset = () => {
    setSearch("");
    setSelectedDate(getDateInputValue());
    setStatus("all");
    setPriority("all");
    setPage(1);
  };

  const canEditTask = (task) => ["self", "assigned", "client", "project"].includes(getTaskSource(task));

  const openEditModal = (task) => {
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      dueDateTime: getDateTimeInputValue(getDueDate(task)),
      priority: String(task.priority || "medium").toLowerCase(),
      status: getDisplayStatus(task),
      checkpoints: getCleanCheckpoints(task.checkpoints),
    });
    setEditModal({ open: true, task });
  };

  const closeEditModal = () => {
    if (savingTaskId) return;
    setEditModal({ open: false, task: null });
  };

  const updateEditCheckpoint = (index, title) => {
    setEditForm((previous) => ({
      ...previous,
      checkpoints: previous.checkpoints.map((checkpoint, itemIndex) => (
        itemIndex === index ? { ...checkpoint, title } : checkpoint
      )),
    }));
  };

  const addEditCheckpoint = () => {
    setEditForm((previous) => ({
      ...previous,
      checkpoints: [...previous.checkpoints, { title: "", completed: false }],
    }));
  };

  const removeEditCheckpoint = (index) => {
    setEditForm((previous) => ({
      ...previous,
      checkpoints: previous.checkpoints.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const refreshTaskAfterChange = async (task) => {
    await fetchTasks();
    if (!task?._id) return;

    const details = await fetchTaskDetails(task);
    setTaskDetailsById((previous) => ({
      ...previous,
      [task._id]: { ...details, loading: false },
    }));
  };

  const handleTaskStatusChange = async (task, nextStatus) => {
    if (!canEditTask(task) || !nextStatus) return;
    const source = getTaskSource(task);
    const endpoint = source === "client"
      ? `/tasks/client-tasks/${task._id}`
      : source === "project"
        ? `/tasks/project/${task.projectId}/tasks/${task._id}/status`
        : source === "self"
          ? `/tasks/self/${task._id}/status`
          : `/task/${task._id}/status`;
    const payload = source === "client"
      ? { status: nextStatus, completed: nextStatus === "completed", allowCompanyAllTaskEdit: true }
      : { status: nextStatus, remarks: "Status updated from Company All Task", allowCompanyAllTaskEdit: true };

    setSavingTaskId(task._id);
    setError("");
    try {
      if (source === "client") {
        await axios.put(endpoint, payload);
      } else {
        await axios.patch(endpoint, payload);
      }
      await refreshTaskAfterChange(task);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to update task status.");
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleCheckpointToggle = async (task, checkpoint) => {
    if (!task?._id || !checkpoint?._id) return;

    const source = getTaskSource(task);
    const endpoint = source === "client"
      ? `/tasks/client-tasks/${task._id}/checkpoints/${checkpoint._id}`
      : source === "project"
        ? `/tasks/project/${task.projectId}/tasks/${task._id}/checkpoints/${checkpoint._id}`
        : source === "self"
          ? `/tasks/self/${task._id}/checkpoints/${checkpoint._id}`
          : `/tasks/assigned/${task._id}/checkpoints/${checkpoint._id}`;

    setSavingTaskId(task._id);
    setError("");
    try {
      await axios.patch(endpoint, { completed: !checkpoint.completed });
      await refreshTaskAfterChange(task);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to update checkpoint.");
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const task = editModal.task;
    if (!task?._id || !canEditTask(task)) return;

    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.dueDateTime) {
      setError("Title, description and due date are required.");
      return;
    }

    setSavingTaskId(task._id);
    setError("");
    try {
      const source = getTaskSource(task);
      const dueDateIso = new Date(editForm.dueDateTime).toISOString();
      const cleanCheckpoints = getCleanCheckpoints(editForm.checkpoints);
      const currentStatus = getDisplayStatus(task);

      if (source === "client") {
        await axios.put(`/tasks/client-tasks/${task._id}`, {
          name: editForm.title.trim(),
          description: editForm.description.trim(),
          dueDate: dueDateIso,
          priority: editForm.priority || "medium",
          status: editForm.status,
          completed: editForm.status === "completed",
          checkpoints: cleanCheckpoints,
          allowCompanyAllTaskEdit: true,
        });
      } else if (source === "project") {
        await axios.patch(`/tasks/project/${task.projectId}/tasks/${task._id}`, {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          dueDate: dueDateIso,
          priority: editForm.priority || "medium",
          status: editForm.status,
          checkpoints: cleanCheckpoints,
          allowCompanyAllTaskEdit: true,
        });
      } else {
        const formData = new FormData();
        formData.append("title", editForm.title.trim());
        formData.append("description", editForm.description.trim());
        formData.append("dueDateTime", dueDateIso);
        formData.append("priority", editForm.priority || "medium");
        formData.append("checkpoints", JSON.stringify(cleanCheckpoints));
        formData.append("allowCompanyAllTaskEdit", "true");

        await axios.put(source === "self" ? `/tasks/self/${task._id}` : `/task/${task._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (editForm.status && editForm.status !== currentStatus) {
          await axios.patch(source === "self" ? `/tasks/self/${task._id}/status` : `/task/${task._id}/status`, {
            status: editForm.status,
            remarks: "Status updated from Company All Task",
            allowCompanyAllTaskEdit: true,
          });
        }
      }

      setEditModal({ open: false, task: null });
      await refreshTaskAfterChange(task);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Unable to update task.");
    } finally {
      setSavingTaskId(null);
    }
  };

  const openActivityModal = (task, logs) => {
    setActivityModal({ open: true, task, logs: Array.isArray(logs) ? logs : [] });
  };

  const closeActivityModal = () => {
    setActivityModal({ open: false, task: null, logs: [] });
  };

  const openRemarksModal = (task, remarks) => {
    setRemarksModal({ open: true, task, remarks: Array.isArray(remarks) ? remarks : [] });
  };

  const closeRemarksModal = () => {
    setRemarksModal({ open: false, task: null, remarks: [] });
  };

  const renderRemarksList = (remarks, emptyText = "No remarks yet.") => (
    remarks.length === 0 ? (
      <p className="company-task-muted">{emptyText}</p>
    ) : (
      <div className="company-task-remarks">
        {remarks.map((remark, index) => {
          const remarkImages = getRemarkImages(remark);
          const remarkText = remark.text || remark.remark || remark.message || remark.remarks;

          return (
            <div className="company-task-remark" key={remark._id || index}>
              <strong>{remark.user?.name || remark.createdBy?.name || remark.userName || "User"}</strong>
              <span>{formatDateTime(remark.createdAt)}</span>
              {remarkText && <p>{remarkText}</p>}
              {remarkImages.length > 0 && (
                <div className="company-task-remark-images">
                  {remarkImages.map((imagePath, imageIndex) => (
                    <a
                      href={getImageUrl(imagePath)}
                      target="_blank"
                      rel="noreferrer"
                      key={`${imagePath}-${imageIndex}`}
                      title="Open remark image"
                    >
                      <img
                        src={getImageUrl(imagePath)}
                        alt={`Remark attachment ${imageIndex + 1}`}
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )
  );

  const renderActivityTimeline = (logs, emptyText = "No activity recorded.") => (
    logs.length === 0 ? (
      <p className="company-task-muted">{emptyText}</p>
    ) : (
      <div className="company-task-timeline">
        {logs.map((log, index) => (
          <div className="company-task-log" key={log._id || index}>
            <div className="company-task-dot" />
            <div>
              <strong>{log.action || log.status || log.type || "Activity"}</strong>
              <span>{formatDateTime(log.createdAt || log.timestamp || log.performedAt)}</span>
              <p>{log.description || log.message || log.remarks || log.remark || "No activity details"}</p>
            </div>
          </div>
        ))}
      </div>
    )
  );

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
            <article
              className={`company-task-stat ${status === item.status ? "company-task-stat-active" : ""}`}
              key={item.label}
              role="button"
              tabIndex={0}
              aria-pressed={status === item.status}
              onClick={() => { setStatus(item.status); setPage(1); }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setStatus(item.status);
                  setPage(1);
                }
              }}
              style={{ "--stat-color": item.color }}
            >
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
          <label className="company-task-date-filter">
            <FiCalendar size={15} />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setPage(1);
              }}
            />
          </label>
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

      <section className="company-task-work-summary">
        <article>
          <span>Clock In</span>
          <strong>{workSummary?.clockIn ? formatDateTime(workSummary.clockIn) : "--"}</strong>
        </article>
        <article>
          <span>Clock Out</span>
          <strong>{workSummary?.clockOut ? formatDateTime(workSummary.clockOut) : (workSummary?.isClockedIn ? "Running" : "--")}</strong>
        </article>
        <article>
          <span>Total Clocked</span>
          <strong>{workSummary?.totalClockedLabel || "0m"}</strong>
        </article>
        <article>
          <span>Task Time</span>
          <strong>{workSummary?.trackedTaskLabel || "0m"}</strong>
        </article>
        <article>
          <span>Untracked</span>
          <strong>{workSummary?.untrackedLabel || "0m"}</strong>
        </article>
      </section>

      <section className="company-task-content">
        <div className="company-task-list-panel">
          <div className="company-task-list-head">
            <div>
              <h2>{selectedDate === getDateInputValue() ? "Today Tasks" : "Tasks"}</h2>
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
                const taskSource = getTaskSource(task);
                const taskType = getTaskType(task);
                const isTaskEditable = canEditTask(task);
                const details = taskDetailsById[task._id] || { remarks: [], activityLogs: [], loading: true };
                const checkpoints = Array.isArray(task.checkpoints) ? task.checkpoints : [];
                const clientMeta = taskSource === "client" ? getClientTaskMeta(task) : null;
                const visibleRemarks = details.remarks.slice(0, 4);
                const visibleActivity = details.activityLogs.slice(0, 4);

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
                        {clientMeta && (
                          <div className="company-task-client-meta">
                            <span><strong>Client</strong>{clientMeta.clientName}</span>
                            <span><strong>Task For</strong>{clientMeta.assigneeName}</span>
                            <span><strong>Service</strong>{clientMeta.serviceName}</span>
                          </div>
                        )}
                      </div>
                      <div className="company-task-row-actions">
                        <span className="company-task-priority">{task.priority || "medium"}</span>
                        {isTaskEditable && (
                          <button
                            type="button"
                            className="company-task-icon-action"
                            onClick={() => openEditModal(task)}
                            aria-label="Edit task"
                            title="Edit task"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="company-task-row-foot">
                      <span className="company-task-status" style={{ color: statusMeta.color }}>
                        {statusMeta.label}
                      </span>
                      <span>{taskType === "assigned" ? "Assigned" : "Personal"}</span>
                      <span><FiCalendar size={13} />{formatDate(getDueDate(task))}</span>
                      <span><FiClock size={13} />Task Time: {task.workTime?.label || "0m"}</span>
                      {isTaskEditable && (
                        <label className="company-task-status-select">
                          <span>Change Status</span>
                          <select
                            value={displayStatus}
                            disabled={savingTaskId === task._id}
                            onChange={(event) => handleTaskStatusChange(task, event.target.value)}
                          >
                            {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>

                    {checkpoints.length > 0 && (
                      <div className="company-task-checkpoints">
                        <div className="company-task-checkpoints-head">
                          <strong>Checkpoints</strong>
                          <span>{checkpoints.filter((item) => item.completed).length}/{checkpoints.length} complete</span>
                        </div>
                        <div className="company-task-checkpoint-list">
                          {checkpoints.map((checkpoint, checkpointIndex) => (
                            <label
                              className={`company-task-checkpoint-item ${checkpoint.completed ? "completed" : ""}`}
                              key={checkpoint._id || `${checkpoint.title}-${checkpointIndex}`}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(checkpoint.completed)}
                                disabled={savingTaskId === task._id}
                                onChange={() => handleCheckpointToggle(task, checkpoint)}
                              />
                              <span>{checkpoint.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="company-task-inline-details">
                      <div className="company-task-inline-section">
                        <div className="company-task-section-title-row">
                          <h4><FiMessageSquare size={15} />Remarks</h4>
                          {!details.loading && details.remarks.length > 0 && (
                            <button
                              type="button"
                              className="company-task-view-all"
                              onClick={() => openRemarksModal(task, details.remarks)}
                            >
                              View All
                            </button>
                          )}
                        </div>
                        {details.loading ? (
                          <p className="company-task-muted">Loading remarks...</p>
                        ) : visibleRemarks.length === 0 ? (
                          <p className="company-task-muted">No remarks yet.</p>
                        ) : (
                          renderRemarksList(visibleRemarks)
                        )}
                      </div>

                      <div className="company-task-inline-section">
                        <div className="company-task-section-title-row">
                          <h4><FiActivity size={15} />Activity</h4>
                          {!details.loading && details.activityLogs.length > 0 && (
                            <button
                              type="button"
                              className="company-task-view-all"
                              onClick={() => openActivityModal(task, details.activityLogs)}
                            >
                              View All
                            </button>
                          )}
                        </div>
                        {details.loading ? (
                          <p className="company-task-muted">Loading activity...</p>
                        ) : visibleActivity.length === 0 ? (
                          <p className="company-task-muted">No activity recorded.</p>
                        ) : (
                          renderActivityTimeline(visibleActivity)
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

      {editModal.open && (
        <div className="company-task-modal-overlay" onClick={closeEditModal}>
          <form className="company-task-edit-modal" onSubmit={handleEditSubmit} onClick={(event) => event.stopPropagation()}>
            <div className="company-task-modal-head">
              <div>
                <h3><FiEdit2 size={18} /> Edit Task</h3>
                <p>{editModal.task?.title || "Untitled Task"}</p>
              </div>
              <button type="button" onClick={closeEditModal} aria-label="Close edit modal">
                <FiX size={20} />
              </button>
            </div>

            <div className="company-task-modal-body">
              <div className="company-task-edit-grid">
                <label className="company-task-field company-task-field-full">
                  <span>Title</span>
                  <input
                    value={editForm.title}
                    onChange={(event) => setEditForm((previous) => ({ ...previous, title: event.target.value }))}
                    placeholder="Task title"
                  />
                </label>

                <label className="company-task-field company-task-field-full">
                  <span>Description</span>
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm((previous) => ({ ...previous, description: event.target.value }))}
                    placeholder="Task description"
                    rows={4}
                  />
                </label>

                <label className="company-task-field">
                  <span>Due Date</span>
                  <input
                    type="datetime-local"
                    value={editForm.dueDateTime}
                    onChange={(event) => setEditForm((previous) => ({ ...previous, dueDateTime: event.target.value }))}
                  />
                </label>

                <label className="company-task-field">
                  <span>Priority</span>
                  <select
                    value={editForm.priority}
                    onChange={(event) => setEditForm((previous) => ({ ...previous, priority: event.target.value }))}
                  >
                    {PRIORITY_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="company-task-field">
                  <span>Status</span>
                  <select
                    value={editForm.status}
                    onChange={(event) => setEditForm((previous) => ({ ...previous, status: event.target.value }))}
                  >
                    {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="company-task-checkpoint-editor">
                <div className="company-task-section-title-row">
                  <h4><FiCheckCircle size={15} />Checkpoints</h4>
                  <button type="button" className="company-task-view-all" onClick={addEditCheckpoint}>
                    <FiPlus size={14} />
                    Add
                  </button>
                </div>
                {editForm.checkpoints.length === 0 ? (
                  <p className="company-task-muted">No checkpoints added.</p>
                ) : (
                  <div className="company-task-checkpoint-fields">
                    {editForm.checkpoints.map((checkpoint, index) => (
                      <div className="company-task-checkpoint-field" key={checkpoint._id || index}>
                        <input
                          value={checkpoint.title}
                          onChange={(event) => updateEditCheckpoint(index, event.target.value)}
                          placeholder={`Checkpoint ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeEditCheckpoint(index)}
                          aria-label="Remove checkpoint"
                          title="Remove checkpoint"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="company-task-modal-actions">
              <button type="button" className="company-task-reset" onClick={closeEditModal} disabled={savingTaskId === editModal.task?._id}>
                Cancel
              </button>
              <button type="submit" className="company-task-save" disabled={savingTaskId === editModal.task?._id}>
                <FiCheckCircle size={16} />
                {savingTaskId === editModal.task?._id ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activityModal.open && (
        <div className="company-task-modal-overlay" onClick={closeActivityModal}>
          <div className="company-task-activity-modal" onClick={(event) => event.stopPropagation()}>
            <div className="company-task-modal-head">
              <div>
                <h3><FiActivity size={18} /> All Activities</h3>
                <p>{activityModal.task?.title || "Untitled Task"}</p>
              </div>
              <button type="button" onClick={closeActivityModal} aria-label="Close activities modal">
                <FiX size={20} />
              </button>
            </div>
            <div className="company-task-modal-body">
              {renderActivityTimeline(activityModal.logs)}
            </div>
          </div>
        </div>
      )}

      {remarksModal.open && (
        <div className="company-task-modal-overlay" onClick={closeRemarksModal}>
          <div className="company-task-activity-modal" onClick={(event) => event.stopPropagation()}>
            <div className="company-task-modal-head">
              <div>
                <h3><FiMessageSquare size={18} /> All Remarks</h3>
                <p>{remarksModal.task?.title || "Untitled Task"}</p>
              </div>
              <button type="button" onClick={closeRemarksModal} aria-label="Close remarks modal">
                <FiX size={20} />
              </button>
            </div>
            <div className="company-task-modal-body">
              {renderRemarksList(remarksModal.remarks)}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CompanyAllTaskTasks;
