import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import "../Css/ProjectDetailsPage.css";

const SHOW_TASK_DOCUMENTS = false;

const parseStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }  
};

const getObjectIdTime = (id) => {
  const value = String(id || "");
  if (!/^[a-f\d]{24}$/i.test(value)) return 0;
  return parseInt(value.slice(0, 8), 16) * 1000;
};

const getTaskCreatedTime = (task) => {
  const creationLog = Array.isArray(task?.activityLogs)
    ? task.activityLogs.find((log) => log?.type === "creation")
    : null;
  const date = new Date(
    task?.createdAt ||
    task?.createdDate ||
    creationLog?.performedAt ||
    creationLog?.createdAt ||
    0
  );
  const parsedTime = Number.isNaN(date.getTime()) ? 0 : date.getTime();
  if (parsedTime) return parsedTime;
  return getObjectIdTime(task?._id || task?.id) || getObjectIdTime(task?.projectTaskId);
};

const getTaskCreatedTieBreaker = (task) => {
  const date = new Date(task?.updatedAt || task?.dueDate || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getAttachmentPath = (fileObj) => {
  if (!fileObj) return "";
  if (typeof fileObj === "string") return fileObj.trim();
  return String(
    fileObj.path || fileObj.url || fileObj.fileUrl || fileObj.location || ""
  ).trim();
};

const hasAttachmentFile = (fileObj) => Boolean(getAttachmentPath(fileObj));

const normalizeTaskAttachment = (task = {}) => {
  if (hasAttachmentFile(task.pdfFile)) return task;
  const attachment = [
    ...(Array.isArray(task.files) ? task.files : []),
    ...(Array.isArray(task.attachments) ? task.attachments : []),
    task.attachment,
    task.image,
  ].find(hasAttachmentFile);
  if (!attachment) return task;

  if (typeof attachment === "string") {
    return {
      ...task,
      pdfFile: {
        path: attachment,
        filename: attachment.replace(/\\/g, "/").split("/").pop() || "Task attachment",
      },
    };
  }

  const attachmentPath =
    attachment.path ||
    attachment.url ||
    attachment.fileUrl ||
    attachment.location;
  if (!attachmentPath) return task;
  return {
    ...task,
    pdfFile: {
      ...attachment,
      path: attachmentPath,
      filename:
        attachment.originalName ||
        attachment.originalname ||
        attachment.filename ||
        attachmentPath.replace(/\\/g, "/").split("/").pop(),
      mimetype: attachment.mimetype || attachment.mimeType || attachment.type,
    },
  };
};

const sortTasksByCreatedAt = (tasks = []) =>
  Array.isArray(tasks)
    ? tasks.map(normalizeTaskAttachment).sort((a, b) => {
        const createdDiff = getTaskCreatedTime(b) - getTaskCreatedTime(a);
        if (createdDiff !== 0) return createdDiff;
        return getTaskCreatedTieBreaker(b) - getTaskCreatedTieBreaker(a);
      })
    : [];

const createEmptyCheckpoint = () => ({ title: "", completed: false });

const getCleanCheckpoints = (checkpoints = []) =>
  Array.isArray(checkpoints)
    ? checkpoints
        .map((item) => ({
          title: String(item?.title || "").trim(),
          completed: Boolean(item?.completed),
        }))
        .filter((item) => item.title)
    : [];

const normalizeTaskStatus = (status) =>
  String(status || "pending").trim().toLowerCase().replace(/-/g, " ");

const getTaskDueDate = (task) => {
  const rawDueDate = task?.dueDateTime || task?.dueDate;
  if (!rawDueDate) return null;
  const dueDate = new Date(rawDueDate);
  return Number.isNaN(dueDate.getTime()) ? null : dueDate;
};

const isTaskOverdue = (task) => {
  if (!task) return false;
  const status = normalizeTaskStatus(task.status);
  if (status === "overdue") return true;
  if (["completed", "cancelled", "on hold"].includes(status)) return false;

  const dueDate = getTaskDueDate(task);
  return Boolean(dueDate && dueDate < new Date());
};

const LIVE_UPLOAD_BASE = "https://backendciisnetwork.com/api/uploads";

const TASK_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "#FFA726" },
  { value: "in progress", label: "In Progress", color: "#29B6F6" },
  { value: "completed", label: "Completed", color: "#66BB6A" },
  { value: "on hold", label: "On Hold", color: "#AB47BC" },
  { value: "cancelled", label: "Cancelled", color: "#EF5350" },
];

const Icons = {
  Add: () => <span className="pdp-icon">➕</span>,
  AttachFile: () => <span className="pdp-icon">📎</span>,
  Comment: () => <span className="pdp-icon">💬</span>,
  CalendarToday: () => <span className="pdp-icon">📅</span>,
  PriorityHigh: () => <span className="pdp-icon">⚠️</span>,
  Person: () => <span className="pdp-icon">👤</span>,
  CheckCircle: () => <span className="pdp-icon">✅</span>,
  Schedule: () => <span className="pdp-icon">⏰</span>,
  Cancel: () => <span className="pdp-icon">❌</span>,
  History: () => <span className="pdp-icon">📜</span>,
  Update: () => <span className="pdp-icon">🔄</span>,
  ClearAll: () => <span className="pdp-icon">🗑️</span>,
  Pause: () => <span className="pdp-icon">⏸️</span>,
  Replay: () => <span className="pdp-icon">↪️</span>,
  Edit: () => <span className="pdp-icon">✏️</span>,
  Delete: () => <span className="pdp-icon">🗑️</span>,
  Download: () => <span className="pdp-icon">⬇️</span>,
  Visibility: () => <span className="pdp-icon">👁️</span>,
  PictureAsPdf: () => <span className="pdp-icon">📄</span>,
  InsertDriveFile: () => <span className="pdp-icon">📎</span>,
  Close: () => <span className="pdp-icon">✕</span>,
  Task: () => <span className="pdp-icon">✅</span>,
  Description: () => <span className="pdp-icon">📝</span>,
  Dashboard: () => <span className="pdp-icon">📊</span>,
  TrendingUp: () => <span className="pdp-icon">📈</span>,
  ArrowForward: () => <span className="pdp-icon">→</span>,
  ArrowBack: () => <span className="pdp-icon">←</span>,
  Star: () => <span className="pdp-icon">⭐</span>,
  FiberNew: () => <span className="pdp-icon">🆕</span>,
  AccessTime: () => <span className="pdp-icon">⏱️</span>,
  Group: () => <span className="pdp-icon">👥</span>,
  Folder: () => <span className="pdp-icon">📁</span>,
  CloudUpload: () => <span className="pdp-icon">☁️↑</span>,
  Image: () => <span className="pdp-icon">🖼️</span>,
  Bolt: () => <span className="pdp-icon">⚡</span>,
  Notifications: () => <span className="pdp-icon">🔔</span>,
  Search: () => <span className="pdp-icon">🔍</span>,
  NoProjects: () => <span className="pdp-icon">📭</span>,
};

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [projectDetails, setProjectDetails] = useState(
    location.state?.project || null
  );
  const [projectUsers, setProjectUsers] = useState(
    location.state?.project?.users || []
  );
  const [tasks, setTasks] = useState(
    sortTasksByCreatedAt(location.state?.project?.tasks || [])
  );
  const [loading, setLoading] = useState({ project: true, tasks: false });
  const [tabValue, setTabValue] = useState(0); // 0: Tasks, 1: Documents, 2: Project Info
  const [taskFilter, setTaskFilter] = useState("all");
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState("all");
  const [taskSearchTerm, setTaskSearchTerm] = useState("");

  // Modals & Drawers state
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [taskImagePreviewUrl, setTaskImagePreviewUrl] = useState("");
  const [isTaskFileDragging, setIsTaskFileDragging] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openActivityDrawer, setOpenActivityDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [statusRemark, setStatusRemark] = useState("");
  const [remarkSubmittingTaskId, setRemarkSubmittingTaskId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [selectedPdfPath, setSelectedPdfPath] = useState("");
  const [selectedPdfName, setSelectedPdfName] = useState("");
  const [selectedPdfContext, setSelectedPdfContext] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [taskDetailToRestore, setTaskDetailToRestore] = useState(null);

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    onHoldTasks: 0,
    cancelledTasks: 0,
  });

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedUsers: [],
    dueDate: "",
    priority: "Medium",
    status: "pending",
    checkpoints: [],
  });

  const [taskErrors, setTaskErrors] = useState({});
  const projectRequestRef = useRef(0);

  // Esc key for activity drawer
  useEffect(() => {
    if (!openActivityDrawer) return undefined;
    const handleActivityKeyDown = (event) => {
      if (event.key === "Escape") setOpenActivityDrawer(false);
    };
    window.addEventListener("keydown", handleActivityKeyDown);
    return () => window.removeEventListener("keydown", handleActivityKeyDown);
  }, [openActivityDrawer]);

  // Object URLs cleanup
  useEffect(() => {
    if (!file || !String(file.type || "").startsWith("image/")) {
      setTaskImagePreviewUrl("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(file);
    setTaskImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Fetch project details on mount or when projectId changes
  useEffect(() => {
    if (!projectId) return;
    loadProjectDetails(projectId);
  }, [projectId]);

  // Update task stats whenever tasks change
  useEffect(() => {
    const completed = tasks.filter(
      (t) => normalizeTaskStatus(t.status) === "completed"
    ).length;
    const pending = tasks.filter(
      (t) => normalizeTaskStatus(t.status) === "pending"
    ).length;
    const inProgress = tasks.filter(
      (t) => normalizeTaskStatus(t.status) === "in progress"
    ).length;
    const overdue = tasks.filter((task) => isTaskOverdue(task)).length;
    const onHold = tasks.filter(
      (t) => normalizeTaskStatus(t.status) === "on hold"
    ).length;
    const cancelled = tasks.filter(
      (t) => normalizeTaskStatus(t.status) === "cancelled"
    ).length;

    setStats({
      totalTasks: tasks.length,
      completedTasks: completed,
      pendingTasks: pending,
      inProgressTasks: inProgress,
      overdueTasks: overdue,
      onHoldTasks: onHold,
      cancelledTasks: cancelled,
    });
  }, [tasks]);

  const loadProjectDetails = async (id) => {
    const requestId = projectRequestRef.current + 1;
    projectRequestRef.current = requestId;
    setLoading((prev) => ({ ...prev, project: true, tasks: true }));

    try {
      const res = await axios.get(`/projects/${id}`);
      if (projectRequestRef.current !== requestId) return;

      const sortedTasks = sortTasksByCreatedAt(res.data.tasks || []);
      setProjectDetails({ ...res.data, tasks: sortedTasks });
      setProjectUsers(res.data.users || []);
      setTasks(sortedTasks);
    } catch (error) {
      if (projectRequestRef.current !== requestId) return;
      console.error("Error loading project details:", error);
      showSnackbar(
        error.response?.data?.message || "Error loading project details",
        "error"
      );
    } finally {
      if (projectRequestRef.current === requestId) {
        setLoading((prev) => ({ ...prev, project: false, tasks: false }));
      }
    }
  };

  const getApiUploadBase = () => {
    const baseUrl = axios.defaults.baseURL || "";
    if (!baseUrl) return "/api/uploads";
    if (baseUrl === "/api" || baseUrl.endsWith("/api")) {
      return `${baseUrl.replace(/\/$/, "")}/uploads`;
    }
    return `${baseUrl.replace(/\/$/, "")}/api/uploads`;
  };

  const getUploadCleanPath = (filePath) => {
    if (!filePath) return "";
    const rawPath = String(filePath).replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(rawPath)) return rawPath;

    let cleanPath = rawPath.replace(/^\/+/, "");
    const uploadsIndex = cleanPath.indexOf("uploads/");
    if (uploadsIndex >= 0) {
      cleanPath = cleanPath.slice(uploadsIndex + "uploads/".length);
    } else {
      cleanPath = cleanPath.replace(/^api\/uploads\//, "");
    }
    return cleanPath;
  };

  const getUploadUrl = (filePath) => {
    if (!filePath) return "";
    const rawPath = String(filePath).replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(rawPath)) return rawPath;

    const cleanPath = getUploadCleanPath(filePath);
    return `${getApiUploadBase()}/${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
  };

  const getLiveUploadUrl = (filePath) => {
    if (!filePath) return "";
    const cleanPath = getUploadCleanPath(filePath);
    if (!cleanPath || /^https?:\/\//i.test(cleanPath)) return "";
    return `${LIVE_UPLOAD_BASE}/${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
  };

  const resolveApiPreviewUrl = (url) => {
    const rawUrl = String(url || "").trim();
    if (!rawUrl) return "";
    if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith("blob:")) return rawUrl;
    const baseUrl = String(axios.defaults?.baseURL || "").replace(/\/+$/, "");
    if (!baseUrl) return rawUrl;
    return `${baseUrl}/${rawUrl.replace(/^\/+/, "")}`;
  };

  const handlePreviewImageError = (event) => {
    const liveUrl = getLiveUploadUrl(selectedPdfPath);
    if (!liveUrl || event.currentTarget.src === liveUrl) return;
    event.currentTarget.src = liveUrl;
  };

  const sanitizeDocName = (value, fallback = "Document") => {
    const clean = String(value || "")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60);
    return clean || fallback;
  };

  const getProjectDocumentDisplayName = (project) => {
    const safeName = sanitizeDocName(
      project?.projectName || project?.name || "Project"
    );
    const rawFileName =
      project?.pdfFile?.filename ||
      project?.pdfFile?.originalName ||
      project?.pdfFile?.path ||
      "";
    const extMatch = rawFileName.match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : ".pdf";
    return `${safeName}_Document${ext}`;
  };

  const getTaskDocumentDisplayName = (task, project = null) => {
    const safeTask = sanitizeDocName(task?.title || "Task");
    const rawFileName =
      task?.pdfFile?.filename ||
      task?.pdfFile?.originalName ||
      task?.pdfFile?.path ||
      "";
    const extMatch = rawFileName.match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : ".pdf";
    return `${safeTask}_Document${ext}`;
  };

  const getFileDisplayName = (fileObj, fallback = "Attachment") => {
    if (!fileObj) return fallback;
    if (typeof fileObj === "string") return fileObj.split("/").pop() || fallback;
    return (
      fileObj.filename ||
      fileObj.originalname ||
      fileObj.path?.split("/").pop() ||
      fallback
    );
  };

  const isImagePath = (fileObj) => {
    if (!hasAttachmentFile(fileObj)) return false;
    const value =
      typeof fileObj === "string"
        ? fileObj
        : `${fileObj?.filename || ""} ${fileObj?.path || ""} ${
            fileObj?.mimetype || ""
          }`;
    return /\.(png|jpe?g|webp|gif)$/i.test(value) || /image\//i.test(value);
  };

  const getTaskAssigneeNames = (task) => {
    const users =
      Array.isArray(task?.assignedUsers) && task.assignedUsers.length
        ? task.assignedUsers
        : task?.assignedTo
        ? [task.assignedTo]
        : [];
    return (
      users
        .map((user) => user?.name || user?.email)
        .filter(Boolean)
        .join(", ") || "Unassigned"
    );
  };

  const getTaskRemarkCount = (task) => {
    if (Array.isArray(task?.remarks)) return task.remarks.length;
    if (typeof task?.remarksCount === "number") return task.remarksCount;
    if (typeof task?.remarkCount === "number") return task.remarkCount;
    if (typeof task?.commentsCount === "number") return task.commentsCount;
    return 0;
  };

  const getUserId = (user) => String(user?._id || user?.id || user || "");

  const getTaskAssignedUserIds = (task) => {
    const users =
      Array.isArray(task?.assignedUsers) && task.assignedUsers.length
        ? task.assignedUsers
        : task?.assignedTo
        ? [task.assignedTo]
        : [];
    return users.map(getUserId).filter(Boolean);
  };

  const toggleTaskAssignedUser = (userId) => {
    setNewTask((prev) => {
      const selected = new Set(prev.assignedUsers || []);
      if (selected.has(userId)) {
        selected.delete(userId);
      } else {
        selected.add(userId);
      }
      return { ...prev, assignedUsers: Array.from(selected) };
    });
  };

  const addTaskCheckpoint = () => {
    setNewTask((prev) => ({
      ...prev,
      checkpoints: [...(prev.checkpoints || []), createEmptyCheckpoint()],
    }));
  };

  const updateTaskCheckpointTitle = (index, title) => {
    setNewTask((prev) => ({
      ...prev,
      checkpoints: (prev.checkpoints || []).map((checkpoint, itemIndex) =>
        itemIndex === index ? { ...checkpoint, title } : checkpoint
      ),
    }));
  };

  const removeTaskCheckpoint = (index) => {
    setNewTask((prev) => ({
      ...prev,
      checkpoints: (prev.checkpoints || []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const formatDateTimeForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  };

  const toDueDateISOString = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  };

  const formatDueDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPriorityInputValue = (priority) => {
    const normalized = String(priority || "Medium").trim().toLowerCase();
    if (normalized === "low") return "Low";
    if (normalized === "high") return "High";
    return "Medium";
  };

  const resetTaskForm = () => {
    setNewTask({
      title: "",
      description: "",
      assignedUsers: [],
      dueDate: "",
      priority: "Medium",
      status: "pending",
      checkpoints: [],
    });
    setFile(null);
    setFileName("");
    setTaskImagePreviewUrl("");
    setTaskErrors({});
    setEditingTask(null);
  };

  const handleOpenCreateTaskDialog = () => {
    resetTaskForm();
    setOpenTaskDialog(true);
  };

  const handleCloseTaskDialog = () => {
    resetTaskForm();
    setOpenTaskDialog(false);
  };

  const handleOpenEditTaskDialog = (task) => {
    if (!["pending", "overdue"].includes(normalizeTaskStatus(task?.status))) {
      showSnackbar("Only pending or overdue tasks can be edited", "warning");
      return;
    }

    setEditingTask(task);
    setNewTask({
      title: task?.title || "",
      description: task?.description || "",
      assignedUsers: getTaskAssignedUserIds(task),
      dueDate: formatDateTimeForInput(task?.dueDate || task?.dueDateTime),
      priority: getPriorityInputValue(task?.priority),
      status: normalizeTaskStatus(task?.status),
      checkpoints: getCleanCheckpoints(task?.checkpoints),
    });
    setFile(null);
    setFileName("");
    setTaskErrors({});
    setOpenTaskDialog(true);
  };

  const validateTaskForm = () => {
    const errors = {};
    if (!newTask.title?.trim()) {
      errors.title = "Task title is required.";
    }
    if (newTask.dueDate && Number.isNaN(new Date(newTask.dueDate).getTime())) {
      errors.dueDate = "Please select a valid date/time.";
    }
    setTaskErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setLoading((prev) => ({ ...prev, tasks: true }));
    try {
      await axios.patch(`/projects/${projectId}/tasks/${taskId}/status`, {
        status: newStatus,
        remark: statusRemark,
      });

      await loadProjectDetails(projectId);
      setStatusRemark("");
      setOpenStatusDialog(false);
      setSelectedTask(null);
      showSnackbar("Task status updated successfully!", "success");
    } catch (error) {
      console.error("Error updating task status:", error);
      showSnackbar(
        error.response?.data?.message || "Error updating task status",
        "error"
      );
    } finally {
      setLoading((prev) => ({ ...prev, tasks: false }));
    }
  };

  const handleOpenStatusDialog = (task) => {
    setSelectedTask(task);
    setStatusRemark("");
    setOpenStatusDialog(true);
  };

  const handleLoadActivityLogs = async (taskId) => {
    try {
      const res = await axios.get(
        `/projects/${projectId}/tasks/${taskId}/activity`
      );
      const task = tasks.find((t) => t._id === taskId);
      setSelectedTask({
        ...task,
        activityLogs: res.data.activityLogs || [],
      });
      setOpenActivityDrawer(true);
    } catch (error) {
      console.error("Error loading activity logs:", error);
      showSnackbar("Error loading activity logs", "error");
    }
  };

  const handleAddTask = async () => {
    if (!validateTaskForm()) return;

    setLoading((prev) => ({ ...prev, tasks: true }));
    try {
      const formData = new FormData();
      Object.keys(newTask).forEach((key) => {
        if (key === "assignedUsers") {
          newTask.assignedUsers.forEach((userId) =>
            formData.append("assignedUsers", userId)
          );
        } else if (key === "checkpoints") {
          formData.append(
            "checkpoints",
            JSON.stringify(getCleanCheckpoints(newTask.checkpoints))
          );
        } else if (key === "dueDate") {
          formData.append("dueDate", toDueDateISOString(newTask.dueDate));
        } else {
          formData.append(key, newTask[key]);
        }
      });

      if (file) {
        const ext = file.name
          ? file.name.substring(file.name.lastIndexOf("."))
          : ".pdf";
        const safeTaskTitle = sanitizeDocName(newTask.title, "Task");
        const customFileName = `${safeTaskTitle}_Document${(
          ext || ".pdf"
        ).toLowerCase()}`;
        formData.append("pdfFile", file, customFileName);
      }

      await axios.post(`/projects/${projectId}/tasks`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetTaskForm();
      setOpenTaskDialog(false);
      await loadProjectDetails(projectId);
      showSnackbar("Task added successfully!", "success");
    } catch (error) {
      console.error("Error adding task:", error);
      showSnackbar(error.response?.data?.message || "Error adding task", "error");
    } finally {
      setLoading((prev) => ({ ...prev, tasks: false }));
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask?._id || !validateTaskForm()) return;

    setLoading((prev) => ({ ...prev, tasks: true }));
    try {
      const assignedTo = newTask.assignedUsers[0] || "";
      const dueDate = toDueDateISOString(newTask.dueDate);
      const payload = {
        title: newTask.title,
        description: newTask.description,
        assignedUsers: newTask.assignedUsers,
        assignedTo,
        dueDate,
        priority: newTask.priority,
        status: newTask.status,
        checkpoints: getCleanCheckpoints(newTask.checkpoints),
      };

      await axios.patch(
        `/projects/${projectId}/tasks/${editingTask._id}`,
        payload
      );

      resetTaskForm();
      setOpenTaskDialog(false);
      setDetailTaskId(null);

      await loadProjectDetails(projectId);
      showSnackbar("Task updated successfully!", "success");
    } catch (error) {
      console.error("Error updating task:", error);
      showSnackbar(
        error.response?.data?.message || "Error updating task",
        "error"
      );
    } finally {
      setLoading((prev) => ({ ...prev, tasks: false }));
    }
  };

  const handleAddRemark = async (taskId, text) => {
    if (remarkSubmittingTaskId === taskId) return;

    const task = tasks.find((item) => item._id === taskId);
    const remarkImage = task?._newRemarkImage || null;
    const remarkText = text?.trim() || "";

    if (!remarkText && !remarkImage) {
      showSnackbar("Please enter a remark or attach an image", "warning");
      return;
    }

    const storedUser = parseStoredJson("user") || {};
    const optimisticRemarkId = `pending-${Date.now()}`;
    const optimisticRemark = {
      _id: optimisticRemarkId,
      text: remarkText || (remarkImage ? "Image attachment" : ""),
      createdAt: new Date().toISOString(),
      createdBy: {
        _id: storedUser._id || storedUser.id,
        name: storedUser.name || "You",
        email: storedUser.email,
      },
      _isPending: true,
    };
    const addOptimisticRemark = (taskItem) =>
      taskItem._id === taskId
        ? {
            ...taskItem,
            remarks: [...(taskItem.remarks || []), optimisticRemark],
            _newRemark: "",
            _newRemarkImage: null,
            _newRemarkImageName: "",
          }
        : taskItem;

    setTasks((prev) => prev.map(addOptimisticRemark));
    setProjectDetails((prev) =>
      prev
        ? { ...prev, tasks: (prev.tasks || []).map(addOptimisticRemark) }
        : prev
    );
    setRemarkSubmittingTaskId(taskId);

    try {
      let response;
      if (remarkImage) {
        const formData = new FormData();
        formData.append("text", remarkText);
        formData.append("image", remarkImage);
        response = await axios.post(
          `/projects/${projectId}/tasks/${taskId}/remarks`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        response = await axios.post(
          `/projects/${projectId}/tasks/${taskId}/remarks`,
          { text: remarkText }
        );
      }

      const savedRemark = response.data?.remark;
      const confirmRemark = (taskItem) =>
        taskItem._id === taskId
          ? {
              ...taskItem,
              remarks: (taskItem.remarks || []).map((item) =>
                item._id === optimisticRemarkId ? savedRemark || item : item
              ),
            }
          : taskItem;

      setTasks((prev) => prev.map(confirmRemark));
      setProjectDetails((prev) =>
        prev
          ? { ...prev, tasks: (prev.tasks || []).map(confirmRemark) }
          : prev
      );
      showSnackbar("Remark added successfully!", "success");
    } catch (error) {
      console.error("Error adding remark:", error);
      const rollbackRemark = (taskItem) =>
        taskItem._id === taskId
          ? {
              ...taskItem,
              remarks: (taskItem.remarks || []).filter(
                (item) => item._id !== optimisticRemarkId
              ),
              _newRemark: remarkText,
              _newRemarkImage: remarkImage,
              _newRemarkImageName: remarkImage?.name || "",
            }
          : taskItem;

      setTasks((prev) => prev.map(rollbackRemark));
      setProjectDetails((prev) =>
        prev
          ? { ...prev, tasks: (prev.tasks || []).map(rollbackRemark) }
          : prev
      );
      showSnackbar("Error adding remark", "error");
    } finally {
      setRemarkSubmittingTaskId(null);
    }
  };

  const viewPdf = async (pdfPath, filename, context = {}) => {
    const rawPath = pdfPath || context?.path;
    const currentProjId =
      context?.projectId ||
      (context?.project ? context.project._id || context.project.id : null) ||
      projectId;
    const taskId =
      context?.taskId ||
      (context?.task ? context.task._id || context.task.id : null);

    if (!rawPath && !currentProjId) {
      showSnackbar("No file available", "warning");
      return;
    }

    const pathParts = rawPath ? String(rawPath).split("/") : [];
    const pdfFilename = pathParts[pathParts.length - 1];
    const displayName = filename || pdfFilename || "document.pdf";
    const fallbackUrl = rawPath
      ? getUploadUrl(rawPath) || getLiveUploadUrl(rawPath)
      : "";

    setSelectedPdfContext(context);

    if (isImagePath(displayName || rawPath)) {
      if (detailTaskId) {
        setTaskDetailToRestore(detailTaskId);
      } else {
        setTaskDetailToRestore(null);
      }
      setImagePreview({
        url: fallbackUrl,
        path: rawPath || "",
        name: displayName,
      });
      setOpenPdfDialog(false);
      setDetailTaskId(null);
      return;
    }

    if (detailTaskId) {
      setTaskDetailToRestore(detailTaskId);
      setDetailTaskId(null);
    } else {
      setTaskDetailToRestore(null);
    }

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    setSelectedPdfUrl(fallbackUrl);
    setSelectedPdfPath(rawPath || "");
    setSelectedPdfName(displayName);
    setPdfLoading(true);
    setPdfError(null);
    setOpenPdfDialog(true);

    const candidateUrls = [];
    if (currentProjId && taskId) {
      candidateUrls.push(
        `/projects/${currentProjId}/tasks/${taskId}/document?view=true`
      );
    } else if (currentProjId) {
      candidateUrls.push(`/projects/${currentProjId}/document?view=true`);
    }
    if (fallbackUrl) {
      candidateUrls.push(fallbackUrl);
    }

    try {
      let response = null;
      for (const url of candidateUrls) {
        try {
          response = await axios.get(url, { responseType: "blob" });
          break;
        } catch (error) {
          if (url === candidateUrls[candidateUrls.length - 1]) throw error;
        }
      }

      if (!response || !response.data) throw new Error("No data received");

      const contentType =
        response.data.type ||
        response.headers?.["content-type"] ||
        "application/pdf";
      const fileBlob = new Blob([response.data], { type: contentType });
      const objectUrl = URL.createObjectURL(fileBlob);
      setPdfBlobUrl(objectUrl);
      setSelectedPdfUrl(objectUrl);
    } catch (err) {
      console.error("Error loading PDF preview:", err);
      const directPreviewUrl = resolveApiPreviewUrl(
        fallbackUrl || candidateUrls[0]
      );
      if (directPreviewUrl) {
        setSelectedPdfUrl(directPreviewUrl);
        setPdfError(null);
      } else {
        setPdfError(
          "Document preview cannot be displayed directly. Please use the Download button below."
        );
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const closePdfPreview = () => {
    setOpenPdfDialog(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setSelectedPdfContext(null);
    setPdfLoading(false);
    setPdfError(null);
    if (taskDetailToRestore) {
      setDetailTaskId(taskDetailToRestore);
      setTaskDetailToRestore(null);
    }
  };

  const closeImagePreview = () => {
    setImagePreview(null);
    if (taskDetailToRestore) {
      setDetailTaskId(taskDetailToRestore);
      setTaskDetailToRestore(null);
    }
  };

  const downloadPdf = async (pdfPath, filename, context = null) => {
    const activeContext = context || selectedPdfContext || {};
    const rawPath = pdfPath || activeContext?.path;
    const currentProjId =
      activeContext?.projectId ||
      (activeContext?.project
        ? activeContext.project._id || activeContext.project.id
        : null) ||
      projectId;
    const taskId =
      activeContext?.taskId ||
      (activeContext?.task
        ? activeContext.task._id || activeContext.task.id
        : null);

    if (!rawPath && !currentProjId) {
      showSnackbar("No file available", "warning");
      return;
    }

    const pathParts = rawPath ? String(rawPath).split("/") : [];
    const pdfFilename = pathParts[pathParts.length - 1];
    const downloadName = filename || pdfFilename || "document.pdf";

    const candidateUrls = [];
    if (currentProjId && taskId) {
      candidateUrls.push(
        `/projects/${currentProjId}/tasks/${taskId}/document`
      );
    } else if (currentProjId) {
      candidateUrls.push(`/projects/${currentProjId}/document`);
    }
    if (rawPath) {
      const uploadUrl = getUploadUrl(rawPath);
      if (uploadUrl) candidateUrls.push(uploadUrl);
    }

    try {
      let response = null;
      for (const url of candidateUrls) {
        try {
          response = await axios.get(url, { responseType: "blob" });
          break;
        } catch (error) {
          if (url === candidateUrls[candidateUrls.length - 1]) throw error;
        }
      }
      if (!response) throw new Error("No download URL available");

      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      const directUrl = resolveApiPreviewUrl(
        (rawPath ? getUploadUrl(rawPath) : "") || candidateUrls[0]
      );
      if (directUrl) {
        const link = document.createElement("a");
        link.href = directUrl;
        link.download = downloadName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        showSnackbar("Unable to download file", "error");
      }
    }
  };

  const handleTaskFileSelect = (selectedFile) => {
    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        showSnackbar("Only PDF or image files are allowed", "error");
        setIsTaskFileDragging(false);
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleFileChange = (e) => {
    handleTaskFileSelect(e.target.files[0]);
    e.target.value = "";
  };

  const handleTaskFileDrop = (e) => {
    e.preventDefault();
    setIsTaskFileDragging(false);
    handleTaskFileSelect(e.dataTransfer.files[0]);
  };

  const handleRemarkImageSelect = (taskId, selectedFile) => {
    if (!selectedFile) return;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      showSnackbar("Only image files are allowed for remarks", "error");
      return;
    }
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId
          ? {
              ...task,
              _newRemarkImage: selectedFile,
              _newRemarkImageName: selectedFile.name,
            }
          : task
      )
    );
  };

  const clearRemarkImage = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId
          ? { ...task, _newRemarkImage: null, _newRemarkImageName: "" }
          : task
      )
    );
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#EF5350";
      case "medium":
        return "#FFA726";
      case "low":
        return "#66BB6A";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusColor = (status) => {
    switch (normalizeTaskStatus(status)) {
      case "completed":
        return "#66BB6A";
      case "in progress":
        return "#29B6F6";
      case "pending":
        return "#FFA726";
      case "overdue":
        return "#D32F2F";
      case "cancelled":
        return "#EF5350";
      case "on hold":
        return "#AB47BC";
      default:
        return "#9E9E9E";
    }
  };

  const getTaskProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(
      (t) => normalizeTaskStatus(t.status) === "completed"
    ).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const highPriorityTasks = useMemo(
    () =>
      sortTasksByCreatedAt(
        tasks.filter(
          (task) =>
            String(task?.priority || "").trim().toLowerCase() === "high"
        )
      ),
    [tasks]
  );

  const completedHighPriorityTasks = useMemo(
    () =>
      highPriorityTasks.filter(
        (task) => normalizeTaskStatus(task.status) === "completed"
      ).length,
    [highPriorityTasks]
  );

  const highPriorityProgress = highPriorityTasks.length
    ? Math.round(
        (completedHighPriorityTasks / highPriorityTasks.length) * 100
      )
    : 0;

  const overdueTasks = useMemo(
    () => tasks.filter((task) => isTaskOverdue(task)),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") return tasks;
    if (taskFilter === "high priority") return highPriorityTasks;
    if (taskFilter === "overdue") return overdueTasks;
    return tasks.filter(
      (task) => normalizeTaskStatus(task.status) === taskFilter
    );
  }, [taskFilter, tasks, highPriorityTasks, overdueTasks]);

  const assigneeFilteredTasks = useMemo(() => {
    if (taskAssigneeFilter === "all") return filteredTasks;
    if (taskAssigneeFilter === "unassigned") {
      return filteredTasks.filter(
        (task) => getTaskAssignedUserIds(task).length === 0
      );
    }
    return filteredTasks.filter((task) =>
      getTaskAssignedUserIds(task).includes(taskAssigneeFilter)
    );
  }, [taskAssigneeFilter, filteredTasks]);

  const displayedTasks = useMemo(() => {
    const q = taskSearchTerm.trim().toLowerCase();
    if (!q) return assigneeFilteredTasks;
    return assigneeFilteredTasks.filter((task) => {
      const matchTitle = (task.title || "").toLowerCase().includes(q);
      const matchDesc = (task.description || "").toLowerCase().includes(q);
      const matchAssignees = getTaskAssigneeNames(task)
        .toLowerCase()
        .includes(q);
      return matchTitle || matchDesc || matchAssignees;
    });
  }, [taskSearchTerm, assigneeFilteredTasks]);

  const documentCount = hasAttachmentFile(projectDetails?.pdfFile) ? 1 : 0;

  const taskAssigneeOptions = [
    { value: "all", label: "All assignees" },
    ...projectUsers
      .map((user) => ({
        value: getUserId(user),
        label: user?.name || user?.email || "Unnamed user",
      }))
      .filter((option) => option.value),
    { value: "unassigned", label: "Unassigned" },
  ];

  const selectedAssigneeLabel =
    taskAssigneeOptions.find((option) => option.value === taskAssigneeFilter)
      ?.label || "";

  const detailTask = detailTaskId
    ? tasks.find((task) => task._id === detailTaskId)
    : null;

  // Mini components
  const StatCard = ({
    icon,
    value,
    label,
    color,
    subtext,
    trend,
    filter,
    active,
    tabTarget = 0,
    className = "",
  }) => (
    <button
      type="button"
      className={`pdp-stat-card pdp-stat-card-clickable ${
        active ? "pdp-stat-card-active" : ""
      } ${className}`}
      style={{ borderLeftColor: color }}
      onClick={() => {
        if (filter) setTaskFilter(filter);
        setTabValue(tabTarget);
      }}
    >
      <div className="pdp-stat-content">
        <div className="pdp-stat-text">
          <h3 className="pdp-stat-value" style={{ color }}>
            {value}
          </h3>
          <p className="pdp-stat-label">{label}</p>
          {subtext && (
            <p className="pdp-stat-subtext">{subtext}</p>
          )}
        </div>
        <div
          className="pdp-stat-icon"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div className="pdp-stat-trend">
          <Icons.TrendingUp />
          <span style={{ color }}>{trend}</span>
        </div>
      )}
    </button>
  );

  const Chip = ({ label, color, icon, variant = "default" }) => (
    <span
      className={`pdp-chip pdp-chip-${variant}`}
      style={{
        backgroundColor:
          variant === "outlined" ? "transparent" : `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {icon && <span className="pdp-chip-icon">{icon}</span>}
      {label}
    </span>
  );

  const Avatar = ({ children, size = "medium" }) => (
    <div className={`pdp-avatar pdp-avatar-${size}`}>
      {children}
    </div>
  );

  const Tooltip = ({ title, children }) => (
    <div className="pdp-tooltip">
      {children}
      <span className="pdp-tooltip-text">{title}</span>
    </div>
  );

  const Alert = ({ severity, children, onClose }) => (
    <div className={`pdp-alert pdp-alert-${severity}`}>
      <div className="pdp-alert-content">{children}</div>
      {onClose && (
        <button className="pdp-alert-close" onClick={onClose}>
          <Icons.Close />
        </button>
      )}
    </div>
  );

  const LinearProgress = ({ value }) => (
    <div className="pdp-linear-progress">
      <div
        className="pdp-linear-progress-bar"
        style={{ width: `${value}%` }}
      />
    </div>
  );

  const CircularProgress = ({ size = 40, thickness = 3.6 }) => (
    <div
      className="pdp-circular-progress"
      style={{ width: size, height: size }}
    >
      <svg
        className="pdp-circular-progress-svg"
        viewBox="22 22 44 44"
      >
        <circle
          className="pdp-circular-progress-circle"
          cx="44"
          cy="44"
          r="20.2"
          fill="none"
          strokeWidth={thickness}
        />
      </svg>
    </div>
  );

  const renderTaskList = (
    taskItems,
    { emptyTitle, emptyMessage, showCreateButton = false } = {}
  ) => {
    if (loading.tasks) {
      return (
        <div className="pdp-loading">
          <CircularProgress />
        </div>
      );
    }

    if (taskItems.length === 0) {
      return (
        <div className="pdp-empty-state">
          <Icons.Task />
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
          {showCreateButton && (
            <button
              className="pdp-button pdp-button-primary"
              onClick={handleOpenCreateTaskDialog}
            >
              <Icons.Add />
              Create First Task
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="pdp-tasks-list">
        {taskItems.map((t) => (
          <div
            className="pdp-task-card"
            key={t._id}
            style={{ borderLeftColor: getStatusColor(t.status) }}
            onClick={() => setDetailTaskId(t._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setDetailTaskId(t._id);
              }
            }}
          >
            <div className="pdp-task-content">
              <div className="pdp-task-header">
                <div className="pdp-task-title-section">
                  <h4 className="pdp-task-title">{t.title}</h4>
                  <div className="pdp-task-chips">
                    <Chip
                      icon={
                        normalizeTaskStatus(t.status) === "completed" ? (
                          <Icons.CheckCircle />
                        ) : normalizeTaskStatus(t.status) === "in progress" ? (
                          <Icons.Update />
                        ) : normalizeTaskStatus(t.status) === "pending" ? (
                          <Icons.Schedule />
                        ) : normalizeTaskStatus(t.status) === "cancelled" ? (
                          <Icons.Cancel />
                        ) : normalizeTaskStatus(t.status) === "on hold" ? (
                          <Icons.Pause />
                        ) : (
                          <Icons.Schedule />
                        )
                      }
                      label={String(t.status || "pending").replace(/_/g, " ")}
                      color={getStatusColor(t.status)}
                    />
                    <Chip
                      icon={<Icons.PriorityHigh />}
                      label={`Priority: ${t.priority || "Medium"}`}
                      color={getPriorityColor(t.priority)}
                    />
                    {isTaskOverdue(t) && (
                      <Chip
                        icon={<Icons.Bolt />}
                        label="Overdue"
                        color="#D32F2F"
                      />
                    )}
                  </div>
                </div>
                <div className="pdp-task-actions">
                  {["pending", "overdue"].includes(
                    normalizeTaskStatus(t.status)
                  ) && (
                    <Tooltip title="Edit Pending Task">
                      <button
                        className="pdp-icon-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditTaskDialog(t);
                        }}
                      >
                        <Icons.Edit />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip title="Update Status">
                    <button
                      className="pdp-icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStatusDialog(t);
                      }}
                    >
                      <Icons.Update />
                    </button>
                  </Tooltip>
                  <Tooltip title="View Activity">
                    <button
                      className="pdp-icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadActivityLogs(t._id);
                      }}
                    >
                      <Icons.History />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {t.description && (
                <p className="pdp-task-description-snippet">
                  {t.description.length > 120
                    ? `${t.description.substring(0, 120)}...`
                    : t.description}
                </p>
              )}

              <div className="pdp-task-meta">
                <div className="pdp-task-meta-item">
                  <Icons.Person />
                  <span>{getTaskAssigneeNames(t)}</span>
                </div>
                {t.dueDate && (
                  <div className="pdp-task-meta-item">
                    <Icons.CalendarToday />
                    <span>Due: {formatDueDateTime(t.dueDate)}</span>
                  </div>
                )}
                <div className="pdp-task-meta-item">
                  <Icons.AccessTime />
                  <span>
                    Created:{" "}
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              {hasAttachmentFile(t.pdfFile) && (
                <div className="pdp-task-attachment">
                    <div className="pdp-task-attachment-main">
                      {isImagePath(t.pdfFile) ? (
                        <img
                          src={getUploadUrl(getAttachmentPath(t.pdfFile))}
                          alt={getTaskDocumentDisplayName(t, projectDetails)}
                          className="pdp-task-attachment-thumbnail"
                          onError={(event) => {
                            const fallbackUrl = getLiveUploadUrl(
                              getAttachmentPath(t.pdfFile)
                            );
                            if (
                              fallbackUrl &&
                              event.currentTarget.src !== fallbackUrl
                            )
                              event.currentTarget.src = fallbackUrl;
                          }}
                        />
                      ) : (
                        <Icons.InsertDriveFile />
                      )}
                      <span>
                        {getTaskDocumentDisplayName(t, projectDetails)}
                      </span>
                    </div>
                    <div className="pdp-task-pdf-actions">
                      <button
                        type="button"
                        className="pdp-icon-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewPdf(
                            getAttachmentPath(t.pdfFile),
                            getTaskDocumentDisplayName(t, projectDetails),
                            { projectId, taskId: t._id }
                          );
                        }}
                        aria-label="Preview task attachment"
                      >
                        <Icons.Visibility />
                      </button>
                      <button
                        type="button"
                        className="pdp-icon-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPdf(
                            getAttachmentPath(t.pdfFile),
                            getTaskDocumentDisplayName(t, projectDetails),
                            { projectId, taskId: t._id }
                          );
                        }}
                        aria-label="Download task attachment"
                      >
                        <Icons.Download />
                      </button>
                    </div>
                </div>
              )}

              <div className="pdp-task-card-footer">
                <p className="pdp-task-click-hint">
                  View full details & remarks
                </p>
                <span className="pdp-task-remark-count">
                  <Icons.Comment />
                  {getTaskRemarkCount(t)} remarks
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Full Screen Image Preview
  if (imagePreview) {
    return (
      <div className="pdp-image-preview-screen">
        <div className="pdp-image-preview-shell">
          <div className="pdp-image-preview-header">
            <div className="pdp-image-preview-title">
              <Icons.Image />
              <h3>{imagePreview.name}</h3>
            </div>
            <button
              className="pdp-image-preview-close"
              onClick={closeImagePreview}
              aria-label="Close image preview"
            >
              <Icons.Close />
            </button>
          </div>
          <div className="pdp-image-preview-body">
            <div className="pdp-image-preview-frame">
              <img
                src={imagePreview.url}
                alt={imagePreview.name || "Attachment preview"}
                className="pdp-image-preview-full"
                onError={(event) => {
                  const fallbackUrl = getLiveUploadUrl(imagePreview.path);
                  if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                    event.currentTarget.src = fallbackUrl;
                  }
                }}
              />
            </div>
          </div>
          <div className="pdp-image-preview-footer">
            <button
              className="pdp-button pdp-button-primary"
              onClick={() =>
                downloadPdf(imagePreview.path, imagePreview.name)
              }
            >
              <Icons.Download />
              Download
            </button>
            <button
              className="pdp-button pdp-button-outline"
              onClick={closeImagePreview}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full Screen PDF Viewer
  if (openPdfDialog) {
    return (
      <div className="pdp-container">
        {snackbar.open && (
          <div className="pdp-snackbar">
            <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
              {snackbar.message}
            </Alert>
          </div>
        )}

        {createPortal(
          <div className="pdp-modal pdp-pdf-modal">
            <div
              className="pdp-modal-backdrop"
              onClick={closePdfPreview}
            />
            <div className="pdp-modal-content">
              <div className="pdp-modal-header pdp-modal-header-primary">
                <div className="pdp-modal-header-content">
                  <Icons.PictureAsPdf />
                  <h3>{selectedPdfName}</h3>
                </div>
                <button
                  className="pdp-modal-close"
                  onClick={closePdfPreview}
                >
                  <Icons.Close />
                </button>
              </div>
              <div className="pdp-modal-body pdp-pdf-viewer">
                {isImagePath(selectedPdfName || selectedPdfUrl) ? (
                  <img
                    src={selectedPdfUrl}
                    alt={selectedPdfName || "Attachment preview"}
                    className="pdp-file-preview-image"
                    onError={handlePreviewImageError}
                  />
                ) : pdfLoading ? (
                  <div
                    className="pdp-pdf-loading"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "350px",
                      gap: "16px",
                      padding: "40px 20px",
                    }}
                  >
                    <CircularProgress size={44} />
                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Loading document preview...
                    </p>
                  </div>
                ) : pdfBlobUrl || selectedPdfUrl ? (
                  <iframe
                    src={pdfBlobUrl || selectedPdfUrl}
                    title={selectedPdfName || "File Viewer"}
                    className="pdp-pdf-frame"
                  />
                ) : (
                  <div
                    className="pdp-pdf-error"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "300px",
                      padding: "32px 20px",
                      textAlign: "center",
                      gap: "12px",
                    }}
                  >
                    <p
                      style={{
                        color: "#e11d48",
                        fontWeight: 600,
                        fontSize: "15px",
                        margin: 0,
                      }}
                    >
                      {pdfError || "Document preview is unavailable"}
                    </p>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                        maxWidth: "420px",
                        margin: 0,
                      }}
                    >
                      You can download or open the document directly to view it
                      on your device.
                    </p>
                    <button
                      type="button"
                      className="pdp-button pdp-button-primary"
                      style={{ marginTop: "8px" }}
                      onClick={() =>
                        downloadPdf(selectedPdfPath, selectedPdfName)
                      }
                    >
                      <Icons.Download />
                      Download Document
                    </button>
                  </div>
                )}
              </div>
              <div className="pdp-modal-footer">
                {(pdfBlobUrl || selectedPdfUrl) && (
                  <button
                    type="button"
                    className="pdp-button pdp-button-outline"
                    onClick={() =>
                      window.open(
                        pdfBlobUrl || selectedPdfUrl,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    <Icons.Visibility />
                    Open in New Tab
                  </button>
                )}
                <button
                  type="button"
                  className="pdp-button pdp-button-primary"
                  onClick={() =>
                    downloadPdf(selectedPdfPath, selectedPdfName)
                  }
                  disabled={!selectedPdfPath && !selectedPdfUrl}
                >
                  <Icons.Download />
                  Download
                </button>
                <button
                  type="button"
                  className="pdp-button pdp-button-outline"
                  onClick={closePdfPreview}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // Loading state when no project details are available yet
  if (loading.project && !projectDetails) {
    return (
      <div className="pdp-container">
        <div className="pdp-loading" style={{ minHeight: "60vh" }}>
          <CircularProgress />
          <span>Loading project details and tasks...</span>
        </div>
      </div>
    );
  }

  // Error state if project not found
  if (!projectDetails && !loading.project) {
    return (
      <div className="pdp-container">
        <div className="pdp-topbar">
          <button
            type="button"
            className="pdp-back-btn"
            onClick={() => navigate("/ciisUser/project")}
          >
            <Icons.ArrowBack />
            <span>Back to Projects</span>
          </button>
        </div>
        <div className="pdp-empty-state" style={{ marginTop: "2rem" }}>
          <Icons.NoProjects />
          <h2>Project Not Found</h2>
          <p>The requested project does not exist or you do not have permission to view it.</p>
          <button
            type="button"
            className="pdp-button pdp-button-primary"
            onClick={() => navigate("/ciisUser/project")}
          >
            Go to My Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdp-container">
      {snackbar.open && (
        <div className="pdp-snackbar">
          <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
            {snackbar.message}
          </Alert>
        </div>
      )}

      {/* Top Navigation & Breadcrumb */}
      <div className="pdp-topbar">
        <button
          type="button"
          className="pdp-back-btn"
          onClick={() => navigate("/ciisUser/project")}
        >
          <Icons.ArrowBack />
          <span>Back to Projects</span>
        </button>
        <div className="pdp-breadcrumb">
          <span
            className="pdp-breadcrumb-link"
            onClick={() => navigate("/ciisUser/project")}
          >
            My Projects
          </span>
          <span className="pdp-breadcrumb-separator">/</span>
          <span className="pdp-breadcrumb-current">
            {projectDetails.projectName}
          </span>
        </div>
      </div>

      {/* Project Hero Header */}
      <div className="pdp-hero">
        <div className="pdp-hero-top">
          <div className="pdp-hero-title-section">
            <h1 className="pdp-hero-title">
              <Icons.Folder />
              {projectDetails.projectName}
            </h1>
            {projectDetails.description && (
              <p className="pdp-hero-desc">
                {projectDetails.description}
              </p>
            )}
            <div className="pdp-hero-meta">
              <Chip
                label={projectDetails.status || "Active"}
                color={getStatusColor(projectDetails.status)}
              />
              <Chip
                label={projectDetails.priority || "Medium"}
                color={getPriorityColor(projectDetails.priority)}
              />
              {(projectDetails.startDate || projectDetails.endDate) && (
                <div className="pdp-hero-meta-item">
                  <Icons.CalendarToday />
                  <span>
                    {projectDetails.startDate
                      ? new Date(projectDetails.startDate).toLocaleDateString()
                      : "Start"}{" "}
                    -{" "}
                    {projectDetails.endDate
                      ? new Date(projectDetails.endDate).toLocaleDateString()
                      : "End"}
                  </span>
                </div>
              )}
              <div className="pdp-hero-meta-item">
                <Icons.Group />
                <span>{projectUsers.length} Team Members</span>
              </div>
              <div className="pdp-hero-meta-item">
                <Icons.Task />
                <span>{tasks.length} Total Tasks</span>
              </div>
            </div>
          </div>

          <div className="pdp-hero-actions">
            <button
              className="pdp-button pdp-button-primary"
              onClick={handleOpenCreateTaskDialog}
              disabled={loading.tasks}
            >
              <Icons.Add />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Project Task Stats Cards */}
      <div className="pdp-stats-grid">
        <div className="pdp-stat-item">
          <StatCard
            icon={<Icons.Dashboard />}
            value={stats.totalTasks}
            label="Total Tasks"
            color="#667eea"
            subtext="All project tasks"
            filter="all"
            active={taskFilter === "all"}
          />
        </div>
        <div className="pdp-stat-item">
          <StatCard
            icon={<Icons.CheckCircle />}
            value={stats.completedTasks}
            label="Completed"
            color="#66BB6A"
            trend={`${getTaskProgress()}% done`}
            filter="completed"
            active={taskFilter === "completed"}
          />
        </div>
        <div className="pdp-stat-item">
          <StatCard
            icon={<Icons.PriorityHigh />}
            value={`${completedHighPriorityTasks}/${highPriorityTasks.length}`}
            label="High Priority"
            color="#EF5350"
            subtext="Completed / total"
            trend={`${highPriorityProgress}% of high`}
            filter="high priority"
            active={taskFilter === "high priority"}
            className="pdp-stat-card-high-priority"
          />
        </div>
        <div className="pdp-stat-item">
          <StatCard
            icon={<Icons.Update />}
            value={stats.inProgressTasks}
            label="In Progress"
            color="#29B6F6"
            filter="in progress"
            active={taskFilter === "in progress"}
          />
        </div>
        <div className="pdp-stat-item">
          <StatCard
            icon={<Icons.Bolt />}
            value={stats.overdueTasks}
            label="Overdue"
            color="#D32F2F"
            subtext="Past due tasks"
            filter="overdue"
            active={taskFilter === "overdue"}
          />
        </div>
        <div className="pdp-stat-item">
          <StatCard
            icon={<Icons.Schedule />}
            value={stats.pendingTasks}
            label="Pending"
            color="#FFA726"
            filter="pending"
            active={taskFilter === "pending"}
          />
        </div>
        <div className="pdp-stat-item">
          <StatCard
            icon={<Icons.Pause />}
            value={stats.onHoldTasks}
            label="On Hold"
            color="#AB47BC"
            filter="on hold"
            active={taskFilter === "on hold"}
          />
        </div>
        <div className="pdp-stat-item">
          <StatCard
            icon={<Icons.Cancel />}
            value={stats.cancelledTasks}
            label="Cancelled"
            color="#EF5350"
            filter="cancelled"
            active={taskFilter === "cancelled"}
          />
        </div>
      </div>

      {/* Main Panel with Tabs */}
      <div className="pdp-panel" style={{ marginTop: "1.5rem" }}>
        <div className="pdp-panel-header">
          <div className="pdp-tabs">
            <button
              className={`pdp-tab ${
                tabValue === 0 ? "pdp-tab-active" : ""
              }`}
              onClick={() => setTabValue(0)}
            >
              <Icons.Task />
              All Tasks
              <span className="pdp-tab-count">{tasks.length}</span>
            </button>
            <button
              className={`pdp-tab ${
                tabValue === 1 ? "pdp-tab-active" : ""
              }`}
              onClick={() => setTabValue(1)}
            >
              <Icons.PictureAsPdf />
              Documents
              <span className="pdp-tab-count">{documentCount}</span>
            </button>
            <button
              className={`pdp-tab ${
                tabValue === 2 ? "pdp-tab-active" : ""
              }`}
              onClick={() => setTabValue(2)}
            >
              <Icons.Description />
              Project Info & Team
            </button>
          </div>
        </div>

        <div className="pdp-panel-content">
          {/* TAB 0: ALL TASKS */}
          {tabValue === 0 && (
            <>
              {/* Progress Card */}
              <div className="pdp-progress-card">
                <div className="pdp-progress-header">
                  <h4 className="pdp-progress-title">
                    Overall Project Progress
                  </h4>
                  <div className="pdp-progress-value">
                    {getTaskProgress()}%
                  </div>
                </div>
                <LinearProgress value={getTaskProgress()} />
                <div className="pdp-progress-footer">
                  <span>
                    {stats.completedTasks} of {stats.totalTasks} tasks completed
                  </span>
                  <span>
                    {stats.inProgressTasks} in progress • {stats.pendingTasks}{" "}
                    pending
                  </span>
                  <span>
                    {stats.overdueTasks} overdue • {stats.onHoldTasks} on hold
                  </span>
                </div>
              </div>

              {/* Task Filter Bar */}
              <div className="pdp-task-filter-bar">
                <div className="pdp-task-filter-copy">
                  <strong>Tasks Filter</strong>
                  <span>
                    {displayedTasks.length} of {tasks.length} tasks
                    {selectedAssigneeLabel &&
                    taskAssigneeFilter !== "all"
                      ? ` • Assigned: ${selectedAssigneeLabel}`
                      : ""}
                    {taskFilter !== "all" ? ` • Status: ${taskFilter}` : ""}
                  </span>
                </div>

                <div className="pdp-task-filter-controls">
                  {/* Task Search Input */}
                  <div className="pdp-task-search-wrapper">
                    <input
                      type="text"
                      className="pdp-task-search-input"
                      placeholder="Search tasks..."
                      value={taskSearchTerm}
                      onChange={(e) => setTaskSearchTerm(e.target.value)}
                    />
                    {taskSearchTerm && (
                      <button
                        type="button"
                        className="pdp-search-clear"
                        onClick={() => setTaskSearchTerm("")}
                      >
                        <Icons.Close />
                      </button>
                    )}
                  </div>

                  {/* Assigned to Dropdown */}
                  <div className="pdp-form-group pdp-task-assignee-filter">
                    <select
                      className="pdp-select"
                      value={taskAssigneeFilter}
                      onChange={(event) =>
                        setTaskAssigneeFilter(event.target.value)
                      }
                    >
                      {taskAssigneeOptions.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Dropdown */}
                  <div className="pdp-form-group pdp-task-status-filter">
                    <select
                      className="pdp-select"
                      value={taskFilter}
                      onChange={(e) => setTaskFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="high priority">High Priority</option>
                      <option value="overdue">Overdue</option>
                      <option value="on hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Reset Filters button if any filter active */}
                  {(taskFilter !== "all" ||
                    taskAssigneeFilter !== "all" ||
                    taskSearchTerm) && (
                    <button
                      type="button"
                      className="pdp-button pdp-button-sm pdp-button-outline"
                      onClick={() => {
                        setTaskFilter("all");
                        setTaskAssigneeFilter("all");
                        setTaskSearchTerm("");
                      }}
                    >
                      Reset
                    </button>
                  )}

                  <button
                    className="pdp-button pdp-button-sm pdp-button-primary"
                    onClick={handleOpenCreateTaskDialog}
                    disabled={loading.tasks}
                  >
                    <Icons.Add />
                    New Task
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              {tasks.length === 0
                ? renderTaskList([], {
                    emptyTitle: "No tasks yet",
                    emptyMessage:
                      "Start by creating your first task for this project.",
                    showCreateButton: true,
                  })
                : renderTaskList(displayedTasks, {
                    emptyTitle: "No tasks match your filters",
                    emptyMessage:
                      "Change the status filter, assignee, or search term to view tasks.",
                  })}
            </>
          )}

          {/* TAB 1: DOCUMENTS */}
          {tabValue === 1 && (
            <div className="pdp-documents-tab">
              <h2 className="pdp-documents-title">
                Project Documents
              </h2>
              <p className="pdp-documents-subtitle">
                Uploaded project documents
              </p>

              {hasAttachmentFile(projectDetails?.pdfFile) ? (
                <div className="pdp-document-card">
                  <div className="pdp-document-content">
                    <div className="pdp-document-info">
                      <div className="pdp-document-icon">
                        <Icons.PictureAsPdf />
                      </div>
                      <div className="pdp-document-details">
                        <h4>
                          {getProjectDocumentDisplayName(projectDetails)}
                        </h4>
                        <p>
                          Main project document • Uploaded on:{" "}
                          {projectDetails.createdAt
                            ? new Date(
                                projectDetails.createdAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="pdp-document-actions">
                      <button
                        className="pdp-button pdp-button-outline"
                        onClick={() =>
                          viewPdf(
                            getAttachmentPath(projectDetails.pdfFile),
                            getProjectDocumentDisplayName(projectDetails),
                            { projectId }
                          )
                        }
                      >
                        <Icons.Visibility />
                        Preview
                      </button>
                      <button
                        className="pdp-button pdp-button-outline"
                        onClick={() =>
                          downloadPdf(
                            getAttachmentPath(projectDetails.pdfFile),
                            getProjectDocumentDisplayName(projectDetails),
                            { projectId }
                          )
                        }
                      >
                        <Icons.Download />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert severity="info">No project document uploaded</Alert>
              )}

              {SHOW_TASK_DOCUMENTS && (
                <>
                  <h3 className="pdp-task-documents-title">
                    Task Attachments (
                    {
                      tasks.filter(
                        (t) =>
                          t.pdfFile?.path ||
                          t.pdfFile?.filename ||
                          t.pdfFile?.url
                      ).length
                    }
                    )
                  </h3>
                  {tasks.filter(
                    (task) =>
                      task.pdfFile?.path ||
                      task.pdfFile?.filename ||
                      task.pdfFile?.url
                  ).length > 0 ? (
                    <div className="pdp-task-documents-grid">
                      {tasks
                        .filter(
                          (task) =>
                            task.pdfFile?.path ||
                            task.pdfFile?.filename ||
                            task.pdfFile?.url
                        )
                        .map((task) => (
                          <div
                            className="pdp-task-document-card"
                            key={task._id}
                          >
                            <div className="pdp-task-document-content">
                              <div className="pdp-task-document-header">
                                <div className="pdp-task-document-info">
                                  {isImagePath(task.pdfFile) ? (
                                    <Icons.Image />
                                  ) : (
                                    <Icons.InsertDriveFile />
                                  )}
                                  <div className="pdp-task-document-text">
                                    <h5>
                                      {getTaskDocumentDisplayName(
                                        task,
                                        projectDetails
                                      )}
                                    </h5>
                                    <p>From task: {task.title}</p>
                                    <p>
                                      Assigned: {getTaskAssigneeNames(task)} •
                                      Status:{" "}
                                      <Chip
                                        label={task.status}
                                        color={getStatusColor(task.status)}
                                      />
                                    </p>
                                  </div>
                                </div>
                                <div className="pdp-task-document-buttons">
                                  <button
                                    className="pdp-button pdp-button-outline pdp-button-sm"
                                    onClick={() =>
                                      viewPdf(
                                        task.pdfFile?.path,
                                        getTaskDocumentDisplayName(
                                          task,
                                          projectDetails
                                        ),
                                        { projectId, taskId: task._id }
                                      )
                                    }
                                  >
                                    <Icons.Visibility />
                                    Preview
                                  </button>
                                  <button
                                    className="pdp-button pdp-button-outline pdp-button-sm"
                                    onClick={() =>
                                      downloadPdf(
                                        task.pdfFile?.path,
                                        getTaskDocumentDisplayName(
                                          task,
                                          projectDetails
                                        ),
                                        { projectId, taskId: task._id }
                                      )
                                    }
                                  >
                                    <Icons.Download />
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <Alert severity="info">No task documents available</Alert>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: PROJECT INFO & TEAM */}
          {tabValue === 2 && (
            <div className="pdp-info-tab">
              <h2 className="pdp-info-title">
                Project Information & Team
              </h2>

              <div className="pdp-info-grid">
                <div className="pdp-info-main">
                  <div className="pdp-info-card">
                    <h3 className="pdp-info-card-title">
                      Project Details
                    </h3>
                    <div className="pdp-info-details">
                      <div className="pdp-info-row">
                        <div className="pdp-info-column">
                          <div className="pdp-info-item">
                            <label>Project Name</label>
                            <p>{projectDetails.projectName}</p>
                          </div>
                          <div className="pdp-info-item">
                            <label>Status</label>
                            <Chip
                              label={projectDetails.status || "Active"}
                              color={getStatusColor(projectDetails.status)}
                            />
                          </div>
                        </div>
                        <div className="pdp-info-column">
                          <div className="pdp-info-item">
                            <label>Priority</label>
                            <Chip
                              label={projectDetails.priority || "Medium"}
                              color={getPriorityColor(projectDetails.priority)}
                            />
                          </div>
                          <div className="pdp-info-item">
                            <label>Project Timeline</label>
                            <p>
                              {projectDetails.startDate
                                ? new Date(
                                    projectDetails.startDate
                                  ).toLocaleDateString()
                                : "Not set"}{" "}
                              -{" "}
                              {projectDetails.endDate
                                ? new Date(
                                    projectDetails.endDate
                                  ).toLocaleDateString()
                                : "Not set"}
                            </p>
                          </div>
                        </div>
                        <div className="pdp-info-full">
                          <div className="pdp-info-item">
                            <label>Description</label>
                            <p>
                              {projectDetails.description ||
                                "No description provided."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pdp-info-sidebar">
                  <div className="pdp-stats-card">
                    <h3 className="pdp-stats-title">Quick Stats</h3>
                    <div className="pdp-stats-list">
                      <div className="pdp-stat-row">
                        <span>Total Tasks</span>
                        <strong>{stats.totalTasks}</strong>
                      </div>
                      <div className="pdp-stat-row">
                        <span>Completed</span>
                        <strong style={{ color: "#66BB6A" }}>
                          {stats.completedTasks}
                        </strong>
                      </div>
                      <div className="pdp-stat-row">
                        <span>In Progress</span>
                        <strong style={{ color: "#29B6F6" }}>
                          {stats.inProgressTasks}
                        </strong>
                      </div>
                      <div className="pdp-stat-row">
                        <span>Pending</span>
                        <strong style={{ color: "#FFA726" }}>
                          {stats.pendingTasks}
                        </strong>
                      </div>
                      <div className="pdp-stat-row">
                        <span>Overdue</span>
                        <strong style={{ color: "#D32F2F" }}>
                          {stats.overdueTasks}
                        </strong>
                      </div>
                      <div className="pdp-stat-row">
                        <span>On Hold</span>
                        <strong style={{ color: "#AB47BC" }}>
                          {stats.onHoldTasks}
                        </strong>
                      </div>
                      <div className="pdp-stat-row">
                        <span>Cancelled</span>
                        <strong style={{ color: "#EF5350" }}>
                          {stats.cancelledTasks}
                        </strong>
                      </div>
                      <div className="pdp-stat-divider" />
                      <div className="pdp-stat-row">
                        <span>Team Members</span>
                        <strong>{projectUsers.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pdp-info-full-width">
                  <div className="pdp-team-card">
                    <h3 className="pdp-team-title">
                      <Icons.Group />
                      Team Members ({projectUsers.length})
                    </h3>
                    <div className="pdp-team-grid">
                      {projectUsers.map((user) => (
                        <div
                          className="pdp-team-member"
                          key={user._id || user.id || user.email}
                        >
                          <div className="pdp-team-member-content">
                            <div className="pdp-team-member-info">
                              <Avatar size="large">
                                {user.name?.charAt(0) || "U"}
                              </Avatar>
                              <div className="pdp-team-member-details">
                                <h5>{user.name || "Unnamed"}</h5>
                                <p>{user.email || "No email"}</p>
                                {user.role && (
                                  <Chip label={user.role} color="#9E9E9E" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {projectUsers.length === 0 && (
                        <div className="pdp-user-tabs-empty">
                          No team members assigned to this project yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TASK DETAIL MODAL */}
      {detailTask && !openPdfDialog && (
        <div className="pdp-modal pdp-task-detail-overlay">
          <div
            className="pdp-modal-backdrop"
            onClick={() => setDetailTaskId(null)}
          />
          <div className="pdp-modal-content pdp-modal-lg pdp-task-detail-modal">
            <div className="pdp-modal-header pdp-modal-header-primary">
              <h3>{detailTask.title}</h3>
              <button
                className="pdp-modal-close"
                onClick={() => setDetailTaskId(null)}
                aria-label="Close task details"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="pdp-modal-body">
              <div className="pdp-task-detail-header">
                <Chip
                  icon={
                    detailTask.status === "completed" ? (
                      <Icons.CheckCircle />
                    ) : detailTask.status === "in progress" ? (
                      <Icons.Update />
                    ) : detailTask.status === "pending" ? (
                      <Icons.Schedule />
                    ) : detailTask.status === "cancelled" ? (
                      <Icons.Cancel />
                    ) : detailTask.status === "on hold" ? (
                      <Icons.Pause />
                    ) : (
                      <Icons.Schedule />
                    )
                  }
                  label={detailTask.status?.replace(/_/g, " ")}
                  color={getStatusColor(detailTask.status)}
                />
                <Chip
                  icon={<Icons.PriorityHigh />}
                  label={`Priority: ${detailTask.priority || "Medium"}`}
                  color={getPriorityColor(detailTask.priority)}
                />
                {isTaskOverdue(detailTask) && (
                  <Chip
                    icon={<Icons.Bolt />}
                    label="Overdue"
                    color="#D32F2F"
                  />
                )}
              </div>

              {detailTask.description && (
                <div className="pdp-task-detail-section">
                  <h4>Description</h4>
                  <p className="pdp-task-description">
                    {detailTask.description}
                  </p>
                </div>
              )}

              <div className="pdp-task-detail-grid">
                <div className="pdp-task-meta-item">
                  <Icons.Person />
                  <span>{getTaskAssigneeNames(detailTask)}</span>
                </div>
                {detailTask.dueDate && (
                  <div className="pdp-task-meta-item">
                    <Icons.CalendarToday />
                    <span>Due: {formatDueDateTime(detailTask.dueDate)}</span>
                  </div>
                )}
                <div className="pdp-task-meta-item">
                  <Icons.AccessTime />
                  <span>
                    Created:{" "}
                    {detailTask.createdAt
                      ? new Date(detailTask.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Checkpoints */}
              {Array.isArray(detailTask.checkpoints) &&
                detailTask.checkpoints.length > 0 && (
                  <div className="pdp-task-detail-section">
                    <h4>
                      Checkpoints (
                      {
                        detailTask.checkpoints.filter((cp) => cp.completed)
                          .length
                      }
                      /{detailTask.checkpoints.length})
                    </h4>
                    <div className="pdp-checkpoint-display-list">
                      {detailTask.checkpoints.map((cp, idx) => (
                        <div
                          key={cp._id || cp.id || idx}
                          className={`pdp-checkpoint-display-item ${
                            cp.completed ? "completed" : ""
                          }`}
                        >
                          <span className="pdp-checkpoint-check">
                            {cp.completed ? "✅" : "⬜"}
                          </span>
                          <span className="pdp-checkpoint-title">
                            {cp.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {["pending", "overdue"].includes(
                normalizeTaskStatus(detailTask.status)
              ) && (
                <div className="pdp-task-detail-actions">
                  <button
                    className="pdp-button pdp-button-outline"
                    onClick={() => handleOpenEditTaskDialog(detailTask)}
                  >
                    <Icons.Edit />
                    Edit Pending Task
                  </button>
                </div>
              )}

              {hasAttachmentFile(detailTask.pdfFile) && (
                <div className="pdp-task-detail-section">
                  <h4>Attachment</h4>
                  <div className="pdp-detail-attachment">
                    {isImagePath(detailTask.pdfFile) && (
                      <button
                        type="button"
                        className="pdp-detail-image-button"
                        onClick={() =>
                          viewPdf(
                            getAttachmentPath(detailTask.pdfFile),
                            getTaskDocumentDisplayName(
                              detailTask,
                              projectDetails
                            ),
                            { projectId, taskId: detailTask._id }
                          )
                        }
                      >
                        <img
                          src={getUploadUrl(getAttachmentPath(detailTask.pdfFile))}
                          alt={getTaskDocumentDisplayName(
                            detailTask,
                            projectDetails
                          )}
                          className="pdp-detail-image-preview"
                          onError={(event) => {
                            const fallbackUrl = getLiveUploadUrl(
                              getAttachmentPath(detailTask.pdfFile)
                            );
                            if (
                              fallbackUrl &&
                              event.currentTarget.src !== fallbackUrl
                            )
                              event.currentTarget.src = fallbackUrl;
                          }}
                        />
                      </button>
                    )}
                    <div className="pdp-detail-attachment-info">
                      <div className="pdp-detail-attachment-name">
                        {isImagePath(detailTask.pdfFile) ? (
                          <Icons.Image />
                        ) : (
                          <Icons.InsertDriveFile />
                        )}
                        <span>
                          {getTaskDocumentDisplayName(
                            detailTask,
                            projectDetails
                          )}
                        </span>
                      </div>
                      <div className="pdp-task-detail-actions">
                        <button
                          className="pdp-button pdp-button-outline"
                          onClick={() =>
                            viewPdf(
                              getAttachmentPath(detailTask.pdfFile),
                              getTaskDocumentDisplayName(
                                detailTask,
                                projectDetails
                              ),
                              { projectId, taskId: detailTask._id }
                            )
                          }
                        >
                          <Icons.Visibility />
                          Preview
                        </button>
                        <button
                          className="pdp-button pdp-button-outline"
                          onClick={() =>
                            downloadPdf(
                              getAttachmentPath(detailTask.pdfFile),
                              getTaskDocumentDisplayName(
                                detailTask,
                                projectDetails
                              ),
                              { projectId, taskId: detailTask._id }
                            )
                          }
                        >
                          <Icons.Download />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks Thread */}
              <div className="pdp-task-remarks">
                <h5 className="pdp-remarks-title">
                  <Icons.Comment />
                  Remarks ({detailTask.remarks?.length || 0})
                </h5>
                {detailTask.remarks?.length > 0 ? (
                  <div className="pdp-remarks-list">
                    {detailTask.remarks.map((r, idx) => (
                      <div className="pdp-remark-item" key={idx}>
                        {r.text && (
                          <p className="pdp-remark-text">{r.text}</p>
                        )}
                        {r.image && (
                          <button
                            type="button"
                            className="pdp-remark-image-button"
                            onClick={() =>
                              viewPdf(
                                r.image,
                                getFileDisplayName(r.image, "Remark image")
                              )
                            }
                          >
                            <img
                              src={getUploadUrl(r.image)}
                              alt="Remark attachment"
                              className="pdp-remark-image"
                            />
                          </button>
                        )}
                        <div className="pdp-remark-footer">
                          <div className="pdp-remark-author">
                            <Avatar size="small">
                              {r.createdBy?.name?.charAt(0) || "U"}
                            </Avatar>
                            <span>{r.createdBy?.name || "User"}</span>
                            {r._isPending && (
                              <span className="pdp-remark-saving">
                                Saving...
                              </span>
                            )}
                          </div>
                          <span className="pdp-remark-date">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleString()
                              : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert severity="info">No remarks yet.</Alert>
                )}
              </div>
            </div>

            <div className="pdp-modal-footer pdp-task-detail-footer">
              <textarea
                rows={2}
                className="pdp-remark-input"
                placeholder="Add a remark..."
                value={detailTask._newRemark || ""}
                onChange={(e) =>
                  setTasks((prev) =>
                    sortTasksByCreatedAt(
                      prev.map((x) =>
                        x._id === detailTask._id
                          ? { ...x, _newRemark: e.target.value }
                          : x
                      )
                    )
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddRemark(detailTask._id, detailTask._newRemark);
                  }
                }}
              />
              <input
                id={`remark-image-${detailTask._id}`}
                type="file"
                hidden
                accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                onChange={(e) => {
                  handleRemarkImageSelect(detailTask._id, e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="pdp-icon-button pdp-remark-attach-button"
                onClick={() =>
                  document
                    .getElementById(`remark-image-${detailTask._id}`)
                    ?.click()
                }
                aria-label="Attach remark image"
              >
                <Icons.Image />
              </button>
              {detailTask._newRemarkImageName && (
                <div className="pdp-remark-selected-image">
                  <Icons.Image />
                  <span>{detailTask._newRemarkImageName}</span>
                  <button
                    type="button"
                    className="pdp-file-remove"
                    onClick={() => clearRemarkImage(detailTask._id)}
                  >
                    Remove
                  </button>
                </div>
              )}
              <button
                className="pdp-button pdp-button-primary"
                onClick={() =>
                  handleAddRemark(detailTask._id, detailTask._newRemark)
                }
                disabled={
                  remarkSubmittingTaskId === detailTask._id ||
                  (!detailTask._newRemark?.trim() &&
                    !detailTask._newRemarkImage)
                }
              >
                <Icons.Comment />
                {remarkSubmittingTaskId === detailTask._id
                  ? "Adding..."
                  : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS DIALOG */}
      {openStatusDialog && (
        <div className="pdp-modal">
          <div
            className="pdp-modal-backdrop"
            onClick={() => {
              setOpenStatusDialog(false);
              setSelectedTask(null);
              setStatusRemark("");
            }}
          />
          <div className="pdp-modal-content pdp-modal-sm">
            <div className="pdp-modal-header pdp-modal-header-primary">
              <h3>Update Task Status</h3>
            </div>
            <div className="pdp-modal-body">
              <div className="pdp-status-form">
                <p className="pdp-status-task-title">
                  <strong>Task:</strong> {selectedTask?.title}
                </p>
                <div className="pdp-status-current">
                  <span>Current Status:</span>
                  <Chip
                    label={selectedTask?.status?.replace(/_/g, " ")}
                    color={getStatusColor(selectedTask?.status)}
                  />
                </div>

                <div className="pdp-form-group">
                  <label>New Status *</label>
                  <select
                    className="pdp-select"
                    value={selectedTask?.status || ""}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        status: e.target.value,
                      })
                    }
                  >
                    {TASK_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pdp-form-group">
                  <label>Remark (Optional)</label>
                  <textarea
                    className="pdp-textarea"
                    rows="3"
                    value={statusRemark}
                    onChange={(e) => setStatusRemark(e.target.value)}
                    placeholder="Add any remarks about this status change..."
                  />
                </div>
              </div>
            </div>
            <div className="pdp-modal-footer">
              <button
                className="pdp-button pdp-button-outline"
                onClick={() => {
                  setOpenStatusDialog(false);
                  setSelectedTask(null);
                  setStatusRemark("");
                }}
                disabled={loading.tasks}
              >
                Cancel
              </button>
              <button
                className="pdp-button pdp-button-primary"
                onClick={() =>
                  handleUpdateTaskStatus(
                    selectedTask._id,
                    selectedTask.status
                  )
                }
                disabled={loading.tasks || !selectedTask?.status}
              >
                {loading.tasks ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY DRAWER */}
      {openActivityDrawer && (
        <div
          className="pdp-activity-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setOpenActivityDrawer(false);
          }}
        >
          <div
            className="pdp-activity-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdp-activity-modal-title"
          >
            <div className="pdp-activity-modal-header">
              <h3 id="pdp-activity-modal-title">Activity Logs</h3>
              <button
                className="pdp-activity-modal-close"
                onClick={() => setOpenActivityDrawer(false)}
                aria-label="Close activity logs"
              >
                <Icons.Close />
              </button>
            </div>
            <div className="pdp-activity-modal-body">
              <p className="pdp-activity-task-title">
                {selectedTask?.title}
              </p>
              <div className="pdp-divider" />

              <div className="pdp-activity-list">
                {selectedTask?.activityLogs?.map((log, index) => (
                  <div className="pdp-activity-item" key={index}>
                    <div className="pdp-activity-icon">
                      <Icons.History />
                    </div>
                    <div className="pdp-activity-content">
                      <p className="pdp-activity-description">
                        {log.description}
                      </p>
                      <div className="pdp-activity-meta">
                        <div className="pdp-activity-author">
                          <Icons.Person />
                          <span>{log.performedBy?.name || "System"}</span>
                        </div>
                        <span className="pdp-activity-date">
                          <Icons.AccessTime />
                          {log.performedAt
                            ? new Date(log.performedAt).toLocaleString()
                            : ""}
                        </span>
                      </div>
                      {log.remark && (
                        <div className="pdp-activity-remark">
                          <em>Remark: {log.remark}</em>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!selectedTask?.activityLogs ||
                  selectedTask.activityLogs.length === 0) && (
                  <div className="pdp-empty-activity">
                    <Icons.History />
                    <p>No activity logs found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK DIALOG */}
      {openTaskDialog && (
        <div className="pdp-modal">
          <div
            className="pdp-modal-backdrop"
            onClick={handleCloseTaskDialog}
          />
          <div className="pdp-modal-content pdp-modal-md pdp-create-task-modal">
            <div className="pdp-modal-header pdp-modal-header-primary">
              <div className="pdp-create-task-heading">
                <span className="pdp-create-task-heading-icon">
                  +
                </span>
                <div>
                  <h3>
                    {editingTask ? "Edit Pending Task" : "Create New Task"}
                  </h3>
                  <p>
                    {editingTask
                      ? "Update task details and assignees"
                      : "Add task details and assign to project members"}
                  </p>
                </div>
              </div>
              <button
                className="pdp-modal-close"
                onClick={handleCloseTaskDialog}
                aria-label="Close task dialog"
              >
                <Icons.Close />
              </button>
            </div>
            <div className="pdp-modal-body">
              <div className="pdp-task-form">
                <div className="pdp-form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    className={`pdp-input ${
                      taskErrors.title ? "pdp-input-error" : ""
                    }`}
                    value={newTask.title}
                    placeholder="Enter task title..."
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    required
                  />
                  {taskErrors.title && (
                    <span className="pdp-error-text">
                      {taskErrors.title}
                    </span>
                  )}
                </div>

                <div className="pdp-form-group">
                  <label>Description</label>
                  <textarea
                    className="pdp-textarea"
                    rows="3"
                    value={newTask.description}
                    placeholder="Enter task description..."
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>

                <div className="pdp-form-group">
                  <label>Assign To (multiple users)</label>
                  <div
                    className={`pdp-user-tabs ${
                      taskErrors.assignedTo
                        ? "pdp-user-tabs-error"
                        : ""
                    }`}
                  >
                    {projectUsers.map((u) => {
                      const userId = getUserId(u);
                      const isSelected = newTask.assignedUsers.includes(userId);
                      return (
                        <label
                          className={`pdp-user-tab ${
                            isSelected ? "pdp-user-tab-selected" : ""
                          }`}
                          key={userId}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTaskAssignedUser(userId)}
                          />
                          <span className="pdp-user-avatar">
                            {String(u.name || "U")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <span className="pdp-user-tab-copy">
                            <strong>{u.name || "Unnamed User"}</strong>
                            <small>{u.email || "No email"}</small>
                          </span>
                        </label>
                      );
                    })}
                    {!projectUsers.length && (
                      <div className="pdp-user-tabs-empty">
                        No project users available.
                      </div>
                    )}
                  </div>
                  {taskErrors.assignedTo && (
                    <span className="pdp-error-text">
                      {taskErrors.assignedTo}
                    </span>
                  )}
                </div>

                <div className="pdp-form-group">
                  <label>Due Date & Time</label>
                  <input
                    type="datetime-local"
                    className={`pdp-input ${
                      taskErrors.dueDate ? "pdp-input-error" : ""
                    }`}
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                  />
                  {taskErrors.dueDate && (
                    <span className="pdp-error-text">
                      {taskErrors.dueDate}
                    </span>
                  )}
                </div>

                <div className="pdp-form-row">
                  <div className="pdp-form-group">
                    <label>Priority</label>
                    <select
                      className="pdp-select"
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({ ...newTask, priority: e.target.value })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="pdp-form-group">
                    <label>Initial Status</label>
                    <select
                      className="pdp-select"
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask({ ...newTask, status: e.target.value })
                      }
                    >
                      {TASK_STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pdp-form-group">
                  <div className="pdp-checkpoint-header">
                    <label>Checkpoints (Optional)</label>
                    <button
                      type="button"
                      className="pdp-checkpoint-add"
                      onClick={addTaskCheckpoint}
                    >
                      + Add
                    </button>
                  </div>
                  {(newTask.checkpoints || []).length > 0 && (
                    <div className="pdp-checkpoint-input-list">
                      {newTask.checkpoints.map((checkpoint, index) => (
                        <div
                          className="pdp-checkpoint-input-row"
                          key={`project-checkpoint-${index}`}
                        >
                          <input
                            type="text"
                            className="pdp-input"
                            value={checkpoint.title}
                            placeholder={`Checkpoint ${index + 1}`}
                            onChange={(event) =>
                              updateTaskCheckpointTitle(
                                index,
                                event.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            className="pdp-checkpoint-remove"
                            onClick={() => removeTaskCheckpoint(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!editingTask ? (
                  <div className="pdp-form-group">
                    <div
                      className={`pdp-file-dropzone ${
                        isTaskFileDragging
                          ? "pdp-file-dropzone-active"
                          : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        document.getElementById("task-file-input").click()
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          document.getElementById("task-file-input").click();
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsTaskFileDragging(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsTaskFileDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        if (e.currentTarget === e.target)
                          setIsTaskFileDragging(false);
                      }}
                      onDrop={handleTaskFileDrop}
                    >
                      <Icons.CloudUpload />
                      <div className="pdp-file-dropzone-text">
                        <strong>Upload Task File</strong>
                        <span>
                          Drag & drop PDF or image here, or click to browse
                        </span>
                      </div>
                    </div>
                    <input
                      id="task-file-input"
                      type="file"
                      hidden
                      accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                    />
                    {fileName && (
                      <>
                        {taskImagePreviewUrl && (
                          <div className="pdp-upload-preview">
                            <img
                              src={taskImagePreviewUrl}
                              alt={`Preview of ${fileName}`}
                            />
                            <div className="pdp-upload-preview-overlay">
                              <span title={fileName}>{fileName}</span>
                              <button
                                type="button"
                                className="pdp-upload-preview-delete"
                                onClick={() => {
                                  setFile(null);
                                  setFileName("");
                                }}
                                aria-label={`Remove ${fileName}`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                        {!taskImagePreviewUrl && (
                          <div className="pdp-file-info">
                            <Icons.PictureAsPdf />
                            <span>Selected: {fileName}</span>
                            <button
                              type="button"
                              className="pdp-file-remove"
                              onClick={() => {
                                setFile(null);
                                setFileName("");
                              }}
                              aria-label="Remove selected file"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : editingTask.pdfFile?.filename ? (
                  <div className="pdp-existing-attachment">
                    {isImagePath(editingTask.pdfFile) && (
                      <img
                        src={getUploadUrl(editingTask.pdfFile.path)}
                        alt={editingTask.pdfFile.filename}
                        onError={(event) => {
                          const fallbackUrl = getLiveUploadUrl(
                            editingTask.pdfFile.path
                          );
                          if (
                            fallbackUrl &&
                            event.currentTarget.src !== fallbackUrl
                          ) {
                            event.currentTarget.src = fallbackUrl;
                          }
                        }}
                      />
                    )}
                    <div className="pdp-file-info">
                      {isImagePath(editingTask.pdfFile) ? (
                        <Icons.Image />
                      ) : (
                        <Icons.PictureAsPdf />
                      )}
                      <span>
                        Current file: {editingTask.pdfFile.filename}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="pdp-modal-footer">
              <button
                className="pdp-button pdp-button-outline"
                onClick={handleCloseTaskDialog}
                disabled={loading.tasks}
              >
                Cancel
              </button>
              <button
                className="pdp-button pdp-button-primary"
                onClick={editingTask ? handleUpdateTask : handleAddTask}
                disabled={loading.tasks}
              >
                {loading.tasks
                  ? editingTask
                    ? "Updating..."
                    : "Adding..."
                  : editingTask
                  ? "Update Task"
                  : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsPage;
