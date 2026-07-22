
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "../../utils/axiosConfig";
import "../Css/EmployeeProject.css";
import CIISLoader from '../../Loader/CIISLoader'; 

const parseStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getCompanyContext = () => {
  const user = parseStoredJson("user") || {};
  const companyDetails = parseStoredJson("companyDetails") || {};
  const storedCompany = parseStoredJson("company") || {};
  const userCompany = typeof user.company === "object" && user.company ? user.company : {};
  const rawCompany = localStorage.getItem("company") || "";

  const companyCode = String(
    localStorage.getItem("companyCode")
    || user.companyCode
    || userCompany.companyCode
    || userCompany.code
    || companyDetails.companyCode
    || companyDetails.code
    || storedCompany.companyCode
    || storedCompany.code
    || (!rawCompany.trim().startsWith("{") ? rawCompany : "")
    || ""
  ).trim();

  const companyIdentifier = String(
    user.companyId
    || userCompany._id
    || userCompany.id
    || companyDetails._id
    || companyDetails.id
    || storedCompany._id
    || storedCompany.id
    || localStorage.getItem("companyIdentifier")
    || ""
  ).trim();

  return { companyCode, companyIdentifier };
};

const getProjectsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.projects)) return data.data.projects;
  return [];
};

const getProjectCompanyCode = (project) => String(
  project?.companyCode
  || project?.company?.companyCode
  || project?.company?.code
  || project?.companyId?.companyCode
  || project?.companyDetails?.companyCode
  || ""
).trim();

const getObjectIdTime = (id) => {
  const value = String(id || "");
  if (!/^[a-f\d]{24}$/i.test(value)) return 0;
  return parseInt(value.slice(0, 8), 16) * 1000;
};

const getTaskCreatedTime = (task) => {
  const creationLog = Array.isArray(task?.activityLogs)
    ? task.activityLogs.find(log => log?.type === "creation")
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

const normalizeTaskAttachment = (task = {}) => {
  if (task.pdfFile?.path) return task;
  const attachment = [
    ...(Array.isArray(task.files) ? task.files : []),
    ...(Array.isArray(task.attachments) ? task.attachments : []),
    task.attachment,
    task.image,
  ].find(Boolean);
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

  const attachmentPath = attachment.path || attachment.url || attachment.fileUrl || attachment.location || attachment.filename;
  if (!attachmentPath) return task;
  return {
    ...task,
    pdfFile: {
      ...attachment,
      path: attachmentPath,
      filename: attachment.originalName || attachment.originalname || attachment.filename || attachmentPath.replace(/\\/g, "/").split("/").pop(),
      mimetype: attachment.mimetype || attachment.mimeType || attachment.type,
    },
  };
};

const sortTasksByCreatedAt = (tasks = []) => (
  Array.isArray(tasks)
    ? tasks.map(normalizeTaskAttachment).sort((a, b) => {
        const createdDiff = getTaskCreatedTime(b) - getTaskCreatedTime(a);
        if (createdDiff !== 0) return createdDiff;
        return getTaskCreatedTieBreaker(b) - getTaskCreatedTieBreaker(a);
      })
    : []
);

const normalizeProjectTaskOrder = (project) => ({
  ...project,
  tasks: sortTasksByCreatedAt(project?.tasks)
});

const LIVE_UPLOAD_BASE = "https://backendcds.ciisnetwork.in/api/uploads";

const EmployeeProject = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [pageLoading, setPageLoading] = useState(true); 
  const [loading, setLoading] = useState({ projects: false, tasks: false });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isTaskFileDragging, setIsTaskFileDragging] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openActivityDrawer, setOpenActivityDrawer] = useState(false);
  const [openNotificationsModal, setOpenNotificationsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [statusRemark, setStatusRemark] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [selectedPdfPath, setSelectedPdfPath] = useState("");
  const [selectedPdfName, setSelectedPdfName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [taskFilter, setTaskFilter] = useState("all");
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [taskDetailToRestore, setTaskDetailToRestore] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    onHoldTasks: 0,
    cancelledTasks: 0
  });

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedUsers: [],
    dueDate: "",
    priority: "Medium",
    status: "pending",
  });

  const [taskErrors, setTaskErrors] = useState({});

  const TASK_STATUS_OPTIONS = [
    { value: "pending", label: "Pending", color: "#FFA726" },
    { value: "in progress", label: "In Progress", color: "#29B6F6" },
    { value: "completed", label: "Completed", color: "#66BB6A" },
    { value: "on hold", label: "On Hold", color: "#AB47BC" },
    { value: "cancelled", label: "Cancelled", color: "#EF5350" },
  ];

  
  const Icons = {
    Add: () => <span className="EmployeeProject-icon">➕</span>,
    AttachFile: () => <span className="EmployeeProject-icon">📎</span>,
    Comment: () => <span className="EmployeeProject-icon">💬</span>,
    CalendarToday: () => <span className="EmployeeProject-icon">📅</span>,
    PriorityHigh: () => <span className="EmployeeProject-icon">⚠️</span>,
    Person: () => <span className="EmployeeProject-icon">👤</span>,
    CheckCircle: () => <span className="EmployeeProject-icon">✅</span>,
    Schedule: () => <span className="EmployeeProject-icon">⏰</span>,
    Cancel: () => <span className="EmployeeProject-icon">❌</span>,
    
    History: () => <span className="EmployeeProject-icon">📜</span>,
    Update: () => <span className="EmployeeProject-icon">🔄</span>,
    ClearAll: () => <span className="EmployeeProject-icon">🗑️</span>,
    Pause: () => <span className="EmployeeProject-icon">⏸️</span>,
    Replay: () => <span className="EmployeeProject-icon">↪️</span>,
    Edit: () => <span className="EmployeeProject-icon">✏️</span>,
    Delete: () => <span className="EmployeeProject-icon">🗑️</span>,
    Download: () => <span className="EmployeeProject-icon">⬇️</span>,
    Visibility: () => <span className="EmployeeProject-icon">👁️</span>,
    PictureAsPdf: () => <span className="EmployeeProject-icon">📄</span>,
    InsertDriveFile: () => <span className="EmployeeProject-icon">📎</span>,
    Close: () => <span className="EmployeeProject-icon">✕</span>,
    Task: () => <span className="EmployeeProject-icon">✅</span>,
    Description: () => <span className="EmployeeProject-icon">📝</span>,
    Dashboard: () => <span className="EmployeeProject-icon">📊</span>,
    TrendingUp: () => <span className="EmployeeProject-icon">📈</span>,
    ArrowForward: () => <span className="EmployeeProject-icon">→</span>,
    Star: () => <span className="EmployeeProject-icon">⭐</span>,
    FiberNew: () => <span className="EmployeeProject-icon">🆕</span>,
    AccessTime: () => <span className="EmployeeProject-icon">⏱️</span>,
    Group: () => <span className="EmployeeProject-icon">👥</span>,
    Folder: () => <span className="EmployeeProject-icon">📁</span>,
    CloudUpload: () => <span className="EmployeeProject-icon">☁️↑</span>,
    Image: () => <span className="EmployeeProject-icon">🖼️</span>,
    Bolt: () => <span className="EmployeeProject-icon">⚡</span>,
    Notifications: () => <span className="EmployeeProject-icon">🔔</span>,
    Search: () => <span className="EmployeeProject-icon">🔍</span>,
    NoProjects: () => <span className="EmployeeProject-icon">📭</span>
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

  const handlePreviewImageError = (event) => {
    const liveUrl = getLiveUploadUrl(selectedPdfPath);
    if (!liveUrl || event.currentTarget.src === liveUrl) return;
    event.currentTarget.src = liveUrl;
  };

  const getFileDisplayName = (fileObj, fallback = "Attachment") => {
    if (!fileObj) return fallback;
    if (typeof fileObj === "string") return fileObj.split("/").pop() || fallback;
    return fileObj.filename || fileObj.originalname || fileObj.path?.split("/").pop() || fallback;
  };

  const isImagePath = (fileObj) => {
    const value = typeof fileObj === "string"
      ? fileObj
      : `${fileObj?.filename || ""} ${fileObj?.path || ""} ${fileObj?.mimetype || ""}`;
    return /\.(png|jpe?g|webp|gif)$/i.test(value) || /image\//i.test(value);
  };

  const normalizeTaskStatus = (status) => String(status || "pending").trim().toLowerCase().replace(/-/g, " ");
  const getTaskAssigneeNames = (task) => {
    const users = Array.isArray(task?.assignedUsers) && task.assignedUsers.length
      ? task.assignedUsers
      : task?.assignedTo
        ? [task.assignedTo]
        : [];
    return users.map(user => user?.name || user?.email).filter(Boolean).join(", ") || "Unassigned";
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
    const users = Array.isArray(task?.assignedUsers) && task.assignedUsers.length
      ? task.assignedUsers
      : task?.assignedTo
        ? [task.assignedTo]
        : [];

    return users.map(getUserId).filter(Boolean);
  };

  const toggleTaskAssignedUser = (userId) => {
    setNewTask(prev => {
      const selected = new Set(prev.assignedUsers || []);
      if (selected.has(userId)) {
        selected.delete(userId);
      } else {
        selected.add(userId);
      }
      return { ...prev, assignedUsers: Array.from(selected) };
    });
  };

  const formatDateTimeForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
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
    });
    setFile(null);
    setFileName("");
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
      dueDate: formatDateTimeForInput(task?.dueDate),
      priority: getPriorityInputValue(task?.priority),
      status: normalizeTaskStatus(task?.status),
    });
    setFile(null);
    setFileName("");
    setTaskErrors({});
    setOpenTaskDialog(true);
  };

  
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        await loadProjects();
    
      } catch (error) {
        console.error("Error loading data:", error);
        showSnackbar("Error loading data", "error");
      } finally {
        
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    const completed = tasks.filter(t => normalizeTaskStatus(t.status) === "completed").length;
    const pending = tasks.filter(t => normalizeTaskStatus(t.status) === "pending").length;
    const inProgress = tasks.filter(t => normalizeTaskStatus(t.status) === "in progress").length;
    const onHold = tasks.filter(t => normalizeTaskStatus(t.status) === "on hold").length;
    const cancelled = tasks.filter(t => normalizeTaskStatus(t.status) === "cancelled").length;
    setStats({
      totalTasks: tasks.length,
      completedTasks: completed,
      pendingTasks: pending,
      inProgressTasks: inProgress,
      onHoldTasks: onHold,
      cancelledTasks: cancelled
    });
  }, [tasks]);

  const loadProjects = async () => {
    setLoading(prev => ({ ...prev, projects: true }));
    try {
      const { companyCode, companyIdentifier } = getCompanyContext();

      if (!companyCode) {
        setProjects([]);
        showSnackbar("Company code not found. Please login again from your company URL.", "error");
        return;
      }

      const res = await axios.get("/projects", {
        params: {
          companyCode,
          companyIdentifier: companyIdentifier || undefined
        }
      });
      const loadedProjects = getProjectsFromResponse(res.data);
      const normalizedCompanyCode = companyCode.toLowerCase();
      const companyProjects = loadedProjects.filter(project => {
        const projectCompanyCode = getProjectCompanyCode(project);
        return !projectCompanyCode || projectCompanyCode.toLowerCase() === normalizedCompanyCode;
      }).map(normalizeProjectTaskOrder);

      setProjects(companyProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      showSnackbar("Error loading projects", "error");
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  
  const handleSelectProject = async (id) => {
    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      setSelectedProject(id);
      const res = await axios.get(`/projects/${id}`);
      const sortedTasks = sortTasksByCreatedAt(res.data.tasks);
      setProjectDetails({ ...res.data, tasks: sortedTasks });
      setProjectUsers(res.data.users || []);
      setTasks(sortedTasks);
      setTaskFilter("all");
      setTabValue(0); 
    } catch (error) {
      console.error("Error loading project details:", error);
      showSnackbar("Error loading project details", "error");
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  
  const validateTaskForm = () => {
    const errors = {};

    if (newTask.dueDate && Number.isNaN(new Date(newTask.dueDate).getTime())) {
      errors.dueDate = "Valid date/time select karein.";
    }

    setTaskErrors(errors);
    return Object.keys(errors).length === 0;
  };

  
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      await axios.patch(`/projects/${selectedProject}/tasks/${taskId}/status`, {
        status: newStatus,
        remark: statusRemark,
      });

      
      handleSelectProject(selectedProject);
      loadNotifications();
      
      
      setStatusRemark("");
      setOpenStatusDialog(false);
      setSelectedTask(null);
      showSnackbar("Task status updated successfully!", "success");

    } catch (error) {
      console.error("Error updating task status:", error);
      showSnackbar(error.response?.data?.message || "Error updating task status", "error");
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  
  const handleOpenStatusDialog = (task) => {
    setSelectedTask(task);
    setStatusRemark("");
    setOpenStatusDialog(true);
  };

  
  const handleLoadActivityLogs = async (taskId) => {
    try {
      const res = await axios.get(`/projects/${selectedProject}/tasks/${taskId}/activity`);
      const task = tasks.find(t => t._id === taskId);
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

  
  const loadNotifications = async () => {
    try {
      
      
      setNotifications([]); 
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  
  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(`/projects/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  
  const handleClearAllNotifications = async () => {
    try {
      await axios.delete("/projects/notifications/clear");
      setNotifications([]);
      showSnackbar("All notifications cleared", "success");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      showSnackbar("Error clearing notifications", "error");
    }
  };

  
  const handleAddTask = async () => {
    if (!validateTaskForm()) return;

    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      const formData = new FormData();
      Object.keys(newTask).forEach((key) => {
        if (key === "assignedUsers") {
          newTask.assignedUsers.forEach(userId => formData.append("assignedUsers", userId));
        } else {
          formData.append(key, newTask[key]);
        }
      });

      if (file) formData.append("pdfFile", file);

      await axios.post(`/projects/${selectedProject}/tasks`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      resetTaskForm();
      setOpenTaskDialog(false);

      
      handleSelectProject(selectedProject);
      loadNotifications();
      
      showSnackbar("Task added successfully!", "success");
    } catch (error) {
      console.error("Error adding task:", error);
      showSnackbar("Error adding task", "error");
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask?._id || !validateTaskForm()) return;

    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      const assignedTo = newTask.assignedUsers[0] || "";
      const payload = {
        title: newTask.title,
        description: newTask.description,
        assignedUsers: newTask.assignedUsers,
        assignedTo,
        dueDate: newTask.dueDate || "",
        priority: newTask.priority,
        status: newTask.status,
      };

      await axios.patch(`/projects/${selectedProject}/tasks/${editingTask._id}`, payload);

      resetTaskForm();
      setOpenTaskDialog(false);
      setDetailTaskId(null);

      handleSelectProject(selectedProject);
      loadNotifications();

      showSnackbar("Task updated successfully!", "success");
    } catch (error) {
      console.error("Error updating task:", error);
      showSnackbar(error.response?.data?.message || "Error updating task", "error");
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  
  const handleAddRemark = async (taskId, text) => {
    const task = tasks.find(item => item._id === taskId);
    const remarkImage = task?._newRemarkImage || null;
    const remarkText = text?.trim() || "";

    if (!remarkText && !remarkImage) {
      showSnackbar("Please enter a remark or attach an image", "warning");
      return;
    }

    try {
      if (remarkImage) {
        const formData = new FormData();
        formData.append("text", remarkText);
        formData.append("image", remarkImage);
        await axios.post(
          `/projects/${selectedProject}/tasks/${taskId}/remarks`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await axios.post(
          `/projects/${selectedProject}/tasks/${taskId}/remarks`,
          { text: remarkText }
        );
      }
      
      handleSelectProject(selectedProject);
      loadNotifications();
      
      
      setTasks(prev => prev.map(task => 
        task._id === taskId
          ? { ...task, _newRemark: "", _newRemarkImage: null, _newRemarkImageName: "" }
          : task
      ));
      
      showSnackbar("Remark added successfully!", "success");
    } catch (error) {
      console.error("Error adding remark:", error);
      showSnackbar("Error adding remark", "error");
    }
  };

  
  const viewPdf = (pdfPath, filename) => {
    if (!pdfPath) {
      showSnackbar("No file available", "warning");
      return;
    }
    
    const pathParts = pdfPath.split('/');
    const pdfFilename = pathParts[pathParts.length - 1];
    const pdfUrl = getUploadUrl(pdfPath) || getLiveUploadUrl(pdfPath);

    if (isImagePath(filename || pdfPath)) {
      if (detailTaskId) {
        setTaskDetailToRestore(detailTaskId);
      } else {
        setTaskDetailToRestore(null);
      }
      setImagePreview({
        url: pdfUrl,
        path: pdfPath,
        name: filename || pdfFilename
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
    setSelectedPdfUrl(pdfUrl);
    setSelectedPdfPath(pdfPath);
    setSelectedPdfName(filename || pdfFilename);
    setOpenPdfDialog(true);
  };

  const closePdfPreview = () => {
    setOpenPdfDialog(false);
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

  
  const downloadPdf = async (pdfPath, filename) => {
    if (!pdfPath) {
      showSnackbar("No file available", "warning");
      return;
    }
    
    const pathParts = pdfPath.split('/');
    const pdfFilename = pathParts[pathParts.length - 1];
    const downloadName = filename || pdfFilename || 'document.pdf';
    const downloadUrls = [
      getUploadUrl(pdfPath),
      getLiveUploadUrl(pdfPath)
    ].filter((url, index, urls) => url && urls.indexOf(url) === index);
    
    try {
      let response = null;
      for (const url of downloadUrls) {
        try {
          response = await axios.get(url, { responseType: 'blob' });
          break;
        } catch (error) {
          if (url === downloadUrls[downloadUrls.length - 1]) throw error;
        }
      }
      if (!response) throw new Error("No download URL available");

      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      showSnackbar("Unable to download file", "error");
    }
  };

  const handleTaskFileSelect = (selectedFile) => {
    if (selectedFile) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
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

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(selectedFile.type)) {
      showSnackbar("Only image files are allowed for remarks", "error");
      return;
    }

    setTasks(prev => prev.map(task =>
      task._id === taskId
        ? { ...task, _newRemarkImage: selectedFile, _newRemarkImageName: selectedFile.name }
        : task
    ));
  };

  const clearRemarkImage = (taskId) => {
    setTasks(prev => prev.map(task =>
      task._id === taskId
        ? { ...task, _newRemarkImage: null, _newRemarkImageName: "" }
        : task
    ));
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "#EF5350";
      case "medium": return "#FFA726";
      case "low": return "#66BB6A";
      default: return "#9E9E9E";
    }
  };

  const getStatusColor = (status) => {
    switch (normalizeTaskStatus(status)) {
      case "completed": return "#66BB6A";
      case "in progress": return "#29B6F6";
      case "pending": return "#FFA726";
      case "overdue": return "#D32F2F";
      case "cancelled": return "#EF5350";
      case "on hold": return "#AB47BC";
      default: return "#9E9E9E";
    }
  };

  const getTaskProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => normalizeTaskStatus(t.status) === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  };

  const highPriorityTasks = sortTasksByCreatedAt(
    tasks.filter(task => String(task?.priority || "").trim().toLowerCase() === "high")
  );
  const completedHighPriorityTasks = highPriorityTasks.filter(task => normalizeTaskStatus(task.status) === "completed").length;
  const highPriorityProgress = highPriorityTasks.length
    ? Math.round((completedHighPriorityTasks / highPriorityTasks.length) * 100)
    : 0;
  const filteredTasks = taskFilter === "all"
    ? tasks
    : taskFilter === "high priority"
      ? highPriorityTasks
      : tasks.filter(task => normalizeTaskStatus(task.status) === taskFilter);
  const displayedTasks = sortTasksByCreatedAt(filteredTasks);

  const normalizedProjectSearch = projectSearchTerm.trim().toLowerCase();
  const filteredProjects = normalizedProjectSearch
    ? projects.filter(project => {
        const searchableText = [
          project.projectName,
          project.title,
          project.name,
          project.description,
          project.status,
          project.priority
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedProjectSearch);
      })
    : projects;

  const detailTask = detailTaskId
    ? tasks.find(task => task._id === detailTaskId)
    : null;

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const StatCard = ({ icon, value, label, color, subtext, trend, filter, active, tabTarget = 0, className = "" }) => (
    <button
      type="button"
      className={`EmployeeProject-stat-card EmployeeProject-stat-card-clickable ${active ? 'EmployeeProject-stat-card-active' : ''} ${className}`}
      style={{ borderLeftColor: color }}
      onClick={() => {
        if (filter) {
          setTaskFilter(filter);
        }
        setTabValue(tabTarget);
      }}
    >
      <div className="EmployeeProject-stat-content">
        <div className="EmployeeProject-stat-text">
          <h3 className="EmployeeProject-stat-value" style={{ color }}>{value}</h3>
          <p className="EmployeeProject-stat-label">{label}</p>
          {subtext && (
            <p className="EmployeeProject-stat-subtext">{subtext}</p>
          )}
        </div>
        <div className="EmployeeProject-stat-icon" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="EmployeeProject-stat-trend">
          <Icons.TrendingUp />
          <span style={{ color }}>{trend}</span>
        </div>
      )}
    </button>
  );

  const Chip = ({ label, color, icon, variant = "default" }) => (
    <span 
      className={`EmployeeProject-chip EmployeeProject-chip-${variant}`}
      style={{ 
        backgroundColor: variant === "outlined" ? "transparent" : `${color}15`,
        color: color,
        borderColor: `${color}30`
      }}
    >
      {icon && <span className="EmployeeProject-chip-icon">{icon}</span>}
      {label}
    </span>
  );

  const Avatar = ({ children, size = "medium" }) => (
    <div className={`EmployeeProject-avatar EmployeeProject-avatar-${size}`}>
      {children}
    </div>
  );

  const Badge = ({ children, badgeContent, color = "error" }) => (
    <div className="EmployeeProject-badge">
      {children}
      {badgeContent > 0 && (
        <span className={`EmployeeProject-badge-content EmployeeProject-badge-${color}`}>
          {badgeContent > 99 ? "99+" : badgeContent}
        </span>
      )}
    </div>
  );

  const Tooltip = ({ title, children }) => (
    <div className="EmployeeProject-tooltip">
      {children}
      <span className="EmployeeProject-tooltip-text">{title}</span>
    </div>
  );

  const Alert = ({ severity, children, onClose }) => (
    <div className={`EmployeeProject-alert EmployeeProject-alert-${severity}`}>
      <div className="EmployeeProject-alert-content">
        {children}
      </div>
      {onClose && (
        <button className="EmployeeProject-alert-close" onClick={onClose}>
          <Icons.Close />
        </button>
      )}
    </div>
  );

  const LinearProgress = ({ value, variant = "determinate" }) => (
    <div className="EmployeeProject-linear-progress">
      <div 
        className="EmployeeProject-linear-progress-bar" 
        style={{ width: `${value}%` }}
      />
    </div>
  );

  const CircularProgress = ({ size = 40, thickness = 3.6 }) => (
    <div 
      className="EmployeeProject-circular-progress" 
      style={{ width: size, height: size }}
    >
      <svg className="EmployeeProject-circular-progress-svg" viewBox="22 22 44 44">
        <circle
          className="EmployeeProject-circular-progress-circle"
          cx="44"
          cy="44"
          r="20.2"
          fill="none"
          strokeWidth={thickness}
        />
      </svg>
    </div>
  );

  const renderTaskList = (taskItems, { emptyTitle, emptyMessage, showCreateButton = false } = {}) => {
    if (loading.tasks) {
      return (
        <div className="EmployeeProject-loading">
          <CircularProgress />
        </div>
      );
    }

    if (taskItems.length === 0) {
      return (
        <div className="EmployeeProject-empty-state">
          <Icons.Task />
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
          {showCreateButton && (
            <button
              className="EmployeeProject-button EmployeeProject-button-primary"
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
      <div className="EmployeeProject-tasks-list">
        {taskItems.map((t) => (
          <div
            className="EmployeeProject-task-card"
            key={t._id}
            style={{ borderLeftColor: getStatusColor(t.status) }}
            onClick={() => setDetailTaskId(t._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setDetailTaskId(t._id);
              }
            }}
          >
            <div className="EmployeeProject-task-content">
              <div className="EmployeeProject-task-header">
                <div className="EmployeeProject-task-title-section">
                  <h4 className="EmployeeProject-task-title">{t.title}</h4>
                  <div className="EmployeeProject-task-chips">
                    <Chip
                      icon={normalizeTaskStatus(t.status) === "completed" ? <Icons.CheckCircle /> :
                            normalizeTaskStatus(t.status) === "in progress" ? <Icons.Update /> :
                            normalizeTaskStatus(t.status) === "pending" ? <Icons.Schedule /> :
                            normalizeTaskStatus(t.status) === "cancelled" ? <Icons.Cancel /> :
                            normalizeTaskStatus(t.status) === "on hold" ? <Icons.Pause /> : <Icons.Schedule />}
                      label={String(t.status || "pending").replace(/_/g, ' ')}
                      color={getStatusColor(t.status)}
                    />
                    <Chip
                      icon={<Icons.PriorityHigh />}
                      label={`Priority: ${t.priority || "Medium"}`}
                      color={getPriorityColor(t.priority)}
                    />
                  </div>
                </div>
                <div className="EmployeeProject-task-actions">
                  {["pending", "overdue"].includes(normalizeTaskStatus(t.status)) && (
                    <Tooltip title="Edit Task">
                      <button
                        className="EmployeeProject-icon-button"
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
                      className="EmployeeProject-icon-button"
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
                      className="EmployeeProject-icon-button"
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

              <div className="EmployeeProject-task-meta">
                <div className="EmployeeProject-task-meta-item">
                  <Icons.Person />
                  <span>{getTaskAssigneeNames(t)}</span>
                </div>
                {t.dueDate && (
                  <div className="EmployeeProject-task-meta-item">
                    <Icons.CalendarToday />
                    <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="EmployeeProject-task-meta-item">
                  <Icons.AccessTime />
                  <span>Created: {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Not available"}</span>
                </div>
              </div>

              <div className={`EmployeeProject-task-attachment ${!t.pdfFile?.path ? 'EmployeeProject-task-attachment-empty' : ''}`}>
                {t.pdfFile?.path ? (
                  <>
                  <div className="EmployeeProject-task-attachment-main">
                    {isImagePath(t.pdfFile) ? (
                      <img
                        src={getUploadUrl(t.pdfFile.path)}
                        alt={getFileDisplayName(t.pdfFile)}
                        className="EmployeeProject-task-attachment-thumbnail"
                        onError={(event) => {
                          const fallbackUrl = getLiveUploadUrl(t.pdfFile.path);
                          if (fallbackUrl && event.currentTarget.src !== fallbackUrl) event.currentTarget.src = fallbackUrl;
                        }}
                      />
                    ) : <Icons.InsertDriveFile />}
                    <span>{getFileDisplayName(t.pdfFile, "Task attachment")}</span>
                  </div>
                  <div className="EmployeeProject-task-pdf-actions">
                    <button
                      type="button"
                      className="EmployeeProject-icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewPdf(t.pdfFile.path, getFileDisplayName(t.pdfFile));
                      }}
                      aria-label="Preview task attachment"
                    >
                      <Icons.Visibility />
                    </button>
                    <button
                      type="button"
                      className="EmployeeProject-icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPdf(t.pdfFile.path, getFileDisplayName(t.pdfFile));
                      }}
                      aria-label="Download task attachment"
                    >
                      <Icons.Download />
                    </button>
                  </div>
                  </>
                ) : (
                  <span className="EmployeeProject-task-attachment-placeholder">No attachment</span>
                )}
              </div>

              <div className="EmployeeProject-task-card-footer">
                <p className="EmployeeProject-task-click-hint">View full details</p>
                <span className="EmployeeProject-task-remark-count">
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

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  if (imagePreview) {
    return (
      <div className="EmployeeProject-image-preview-screen">
        <div className="EmployeeProject-image-preview-shell">
          <div className="EmployeeProject-image-preview-header">
            <div className="EmployeeProject-image-preview-title">
              <Icons.Image />
              <h3>{imagePreview.name}</h3>
            </div>
            <button className="EmployeeProject-image-preview-close" onClick={closeImagePreview} aria-label="Close image preview">
              <Icons.Close />
            </button>
          </div>
          <div className="EmployeeProject-image-preview-body">
            <div className="EmployeeProject-image-preview-frame">
              <img
                src={imagePreview.url}
                alt={imagePreview.name || "Attachment preview"}
                className="EmployeeProject-image-preview-full"
                onError={(event) => {
                  const fallbackUrl = getLiveUploadUrl(imagePreview.path);
                  if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                    event.currentTarget.src = fallbackUrl;
                  }
                }}
              />
            </div>
          </div>
          <div className="EmployeeProject-image-preview-footer">
            <button
              className="EmployeeProject-button EmployeeProject-button-primary"
              onClick={() => downloadPdf(imagePreview.path, imagePreview.name)}
            >
              <Icons.Download />
              Download
            </button>
            <button
              className="EmployeeProject-button EmployeeProject-button-outline"
              onClick={closeImagePreview}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (openPdfDialog) {
    return (
      <div className="EmployeeProject-container">
        {snackbar.open && (
          <div className="EmployeeProject-snackbar">
            <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
              {snackbar.message}
            </Alert>
          </div>
        )}

        {createPortal(
          <div className="EmployeeProject-modal EmployeeProject-pdf-modal">
            <div className="EmployeeProject-modal-backdrop" onClick={closePdfPreview} />
            <div className="EmployeeProject-modal-content">
              <div className="EmployeeProject-modal-header EmployeeProject-modal-header-primary">
                <div className="EmployeeProject-modal-header-content">
                  <Icons.PictureAsPdf />
                  <h3>{selectedPdfName}</h3>
                </div>
                <button className="EmployeeProject-modal-close" onClick={closePdfPreview}>
                  <Icons.Close />
                </button>
              </div>
              <div className="EmployeeProject-modal-body EmployeeProject-pdf-viewer">
                {selectedPdfUrl ? (
                  isImagePath(selectedPdfName || selectedPdfUrl) ? (
                    <img
                      src={selectedPdfUrl}
                      alt={selectedPdfName || "Attachment preview"}
                      className="EmployeeProject-file-preview-image"
                      onError={handlePreviewImageError}
                    />
                  ) : (
                    <iframe
                      src={selectedPdfUrl}
                      title="File Viewer"
                      className="EmployeeProject-pdf-frame"
                    />
                  )
                ) : (
                  <div className="EmployeeProject-pdf-error">
                    <p>File cannot be loaded</p>
                  </div>
                )}
              </div>
              <div className="EmployeeProject-modal-footer">
                <button
                  className="EmployeeProject-button EmployeeProject-button-primary"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedPdfUrl;
                    link.download = selectedPdfName || 'document.pdf';
                    link.click();
                  }}
                  disabled={!selectedPdfUrl}
                >
                  <Icons.Download />
                  Download
                </button>
                <button
                  className="EmployeeProject-button EmployeeProject-button-outline"
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

  return (
    <div className="EmployeeProject-container">
      
      {snackbar.open && (
        <div className="EmployeeProject-snackbar">
          <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
            {snackbar.message}
          </Alert>
        </div>
      )}

      <div className="EmployeeProject-header">
        <div className="EmployeeProject-header-content">
          <div className="EmployeeProject-header-text">
            <h1 className="EmployeeProject-title">Project Dashboard</h1>
            <p className="EmployeeProject-subtitle">Manage your projects and tasks efficiently</p>
          </div>
        </div>

        <div className="EmployeeProject-search-row">
          <div className="EmployeeProject-search-box">
            <Icons.Search />
            <input
              type="search"
              className="EmployeeProject-search-input"
              value={projectSearchTerm}
              onChange={(e) => setProjectSearchTerm(e.target.value)}
              placeholder="Search by project name or title"
              aria-label="Search projects by name or title"
            />
            {projectSearchTerm && (
              <button
                type="button"
                className="EmployeeProject-search-clear"
                onClick={() => setProjectSearchTerm("")}
                aria-label="Clear project search"
              >
                <Icons.Close />
              </button>
            )}
          </div>
          <span className="EmployeeProject-search-count">
            {filteredProjects.length} of {projects.length} projects
          </span>
        </div>

        
        {selectedProject && (
          <div className="EmployeeProject-stats-grid">
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.Dashboard />}
                value={stats.totalTasks}
                label="Total Tasks"
                color="#667eea"
                subtext="This project"
                filter="all"
                active={taskFilter === "all"}
              />
            </div>
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.CheckCircle />}
                value={stats.completedTasks}
                label="Completed"
                color="#66BB6A"
                trend={`${getTaskProgress()}% of total`}
                filter="completed"
                active={taskFilter === "completed"}
              />
            </div>
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.PriorityHigh />}
                value={`${completedHighPriorityTasks}/${highPriorityTasks.length}`}
                label="High Priority"
                color="#EF5350"
                subtext="Completed / total"
                trend={`${highPriorityProgress}% of high`}
                filter="high priority"
                active={taskFilter === "high priority"}
                className="EmployeeProject-stat-card-high-priority"
              />
            </div>
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.Update />}
                value={stats.inProgressTasks}
                label="In Progress"
                color="#29B6F6"
                filter="in progress"
                active={taskFilter === "in progress"}
              />
            </div>
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.Schedule />}
                value={stats.pendingTasks}
                label="Pending"
                color="#FFA726"
                filter="pending"
                active={taskFilter === "pending"}
              />
            </div>
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.Pause />}
                value={stats.onHoldTasks}
                label="On Hold"
                color="#AB47BC"
                filter="on hold"
                active={taskFilter === "on hold"}
              />
            </div>
            <div className="EmployeeProject-stat-item">
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
        )}
      </div>

      {loading.projects && (
        <LinearProgress />
      )}

      
      {projects.length === 0 ? (
        <div className="EmployeeProject-no-projects">
          <div className="EmployeeProject-no-projects-content">
            <div className="EmployeeProject-no-projects-icon">
              <Icons.NoProjects />
            </div>
            <h2 className="EmployeeProject-no-projects-title">No Projects Found</h2>
            <p className="EmployeeProject-no-projects-message">
              You haven't been assigned to any projects yet.
            </p>
            <p className="EmployeeProject-no-projects-submessage">
              Once you're assigned to a project, it will appear here.
            </p>
            <div className="EmployeeProject-no-projects-illustration">
              
            </div>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="EmployeeProject-no-projects">
          <div className="EmployeeProject-no-projects-content">
            <div className="EmployeeProject-no-projects-icon">
              <Icons.Search />
            </div>
            <h2 className="EmployeeProject-no-projects-title">No Matching Projects</h2>
            <p className="EmployeeProject-no-projects-message">
              No projects match "{projectSearchTerm}".
            </p>
            <p className="EmployeeProject-no-projects-submessage">
              Try searching with another project name or title.
            </p>
          </div>
        </div>
      ) : (
        <div className="EmployeeProject-grid">
          {filteredProjects.map((p) => (
            <div className="EmployeeProject-grid-item" key={p._id}>
              <div
                className={`EmployeeProject-card ${selectedProject === p._id ? 'EmployeeProject-card-selected' : ''}`}
                onClick={() => handleSelectProject(p._id)}
              >
                <div className="EmployeeProject-card-highlight" />
                
                <div className="EmployeeProject-card-content">
                  <div className="EmployeeProject-card-header">
                    <div className="EmployeeProject-card-title-section">
                      <div className="EmployeeProject-card-title-row">
                        <Icons.Folder />
                        <h3 className="EmployeeProject-card-title">{p.projectName}</h3>
                      </div>
                      <Chip
                        label={p.status}
                        color={getStatusColor(p.status)}
                      />
                    </div>
                  </div>
                  
                  <div className="EmployeeProject-chip-container">
                    <Chip
                      label={p.priority}
                      color={getPriorityColor(p.priority)}
                    />
                    <Chip
                      icon={<Icons.Group />}
                      label={`${p.users?.length || 0}`}
                      variant="outlined"
                    />
                    <Chip
                      icon={<Icons.Task />}
                      label={`${p.tasks?.length || 0}`}
                      variant="outlined"
                    />
                  </div>
                  
                  {p.description && (
                    <p className="EmployeeProject-card-description">
                      {p.description.length > 120 
                        ? `${p.description.substring(0, 120)}...` 
                        : p.description}
                    </p>
                  )}
                  
                  <div className="EmployeeProject-card-footer">
                    <div className="EmployeeProject-card-date">
                      <Icons.CalendarToday />
                      <span>{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'No date'}</span>
                    </div>
                    <button
                      className={`EmployeeProject-button EmployeeProject-button-sm ${selectedProject === p._id ? 'EmployeeProject-button-primary' : 'EmployeeProject-button-outline'}`}
                    >
                      View
                      <Icons.ArrowForward />
                    </button>
                  </div>
                  
                  
                  {p.pdfFile?.path && (
                    <div className="EmployeeProject-card-pdf">
                      <div className="EmployeeProject-pdf-info">
                        <Icons.PictureAsPdf />
                        <span className="EmployeeProject-pdf-text">Document attached</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      
      {selectedProject && projectDetails && (
        <div className="EmployeeProject-panel">
          <div className="EmployeeProject-panel-header">
            <div className="EmployeeProject-tabs">
              <button 
                className={`EmployeeProject-tab ${tabValue === 0 ? 'EmployeeProject-tab-active' : ''}`}
                onClick={() => setTabValue(0)}
              >
                <Icons.Task />
                Tasks
              </button>
              <button 
                className={`EmployeeProject-tab ${tabValue === 1 ? 'EmployeeProject-tab-active' : ''}`}
                onClick={() => setTabValue(1)}
              >
                <Icons.PictureAsPdf />
                Documents
              </button>
              <button 
                className={`EmployeeProject-tab ${tabValue === 2 ? 'EmployeeProject-tab-active' : ''}`}
                onClick={() => setTabValue(2)}
              >
                <Icons.Description />
                Project Info
              </button>
            </div>
          </div>

          <div className="EmployeeProject-panel-content">
            
            {tabValue === 0 && (
              <>
                <div className="EmployeeProject-panel-header-content">
                  <div>
                    <h2 className="EmployeeProject-panel-title">{projectDetails.projectName}</h2>
                    <p className="EmployeeProject-panel-subtitle">{projectDetails.description}</p>
                  </div>
                  <button
                    className="EmployeeProject-button EmployeeProject-button-primary"
                    onClick={handleOpenCreateTaskDialog}
                    disabled={loading.tasks}
                  >
                    <Icons.Add />
                    New Task
                  </button>
                </div>

                
                <div className="EmployeeProject-progress-card">
                  <div className="EmployeeProject-progress-header">
                    <h4 className="EmployeeProject-progress-title">Project Progress</h4>
                    <div className="EmployeeProject-progress-value">{getTaskProgress()}%</div>
                  </div>
                  <LinearProgress value={getTaskProgress()} />
                  <div className="EmployeeProject-progress-footer">
                    <span>{stats.completedTasks} of {stats.totalTasks} tasks completed</span>
                    <span>{stats.onHoldTasks} on hold • {stats.cancelledTasks} cancelled</span>
                    <span>{stats.pendingTasks} pending • {stats.inProgressTasks} in progress</span>
                  </div>
                </div>

                {tasks.length === 0
                  ? renderTaskList([], {
                      emptyTitle: "No tasks yet",
                      emptyMessage: "Start by creating your first task",
                      showCreateButton: true
                    })
                  : renderTaskList(displayedTasks, {
                      emptyTitle: `No ${taskFilter === "all" ? "" : taskFilter} tasks found`,
                      emptyMessage: "Click another status card to view different tasks."
                    })}
              </>
            )}

            {tabValue === 1 && (
              <div className="EmployeeProject-documents-tab">
                <h2 className="EmployeeProject-documents-title">Project Documents</h2>
                <p className="EmployeeProject-documents-subtitle">All project-related documents and files</p>
                
                
                {projectDetails.pdfFile?.path ? (
                  <div className="EmployeeProject-document-card">
                    <div className="EmployeeProject-document-content">
                      <div className="EmployeeProject-document-info">
                        <div className="EmployeeProject-document-icon">
                          <Icons.PictureAsPdf />
                        </div>
                        <div className="EmployeeProject-document-details">
                          <h4>{projectDetails.pdfFile.filename || 'Project Document'}</h4>
                          <p>Main project document • Uploaded on: {new Date(projectDetails.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="EmployeeProject-document-actions">
                        <button
                          className="EmployeeProject-button EmployeeProject-button-outline"
                          onClick={() => viewPdf(projectDetails.pdfFile.path, getFileDisplayName(projectDetails.pdfFile, "Project document"))}
                        >
                          <Icons.Visibility />
                          Preview
                        </button>
                        <button
                          className="EmployeeProject-button EmployeeProject-button-outline"
                          onClick={() => downloadPdf(projectDetails.pdfFile.path, getFileDisplayName(projectDetails.pdfFile, "Project document"))}
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

                
                {false && (
                <>
                <h3 className="EmployeeProject-task-documents-title">
                  Task Documents ({tasks.filter(t => t.pdfFile?.path).length})
                </h3>
                {tasks.filter(t => t.pdfFile?.path).length > 0 ? (
                  <div className="EmployeeProject-task-documents-grid">
                    {tasks
                      .filter(task => task.pdfFile?.path)
                      .map((task) => (
                        <div className="EmployeeProject-task-document-card" key={task._id}>
                          <div className="EmployeeProject-task-document-content">
                            <div className="EmployeeProject-task-document-header">
                              <div className="EmployeeProject-task-document-info">
                                {isImagePath(task.pdfFile) ? <Icons.Image /> : <Icons.InsertDriveFile />}
                                <div className="EmployeeProject-task-document-text">
                                  <h5>{task.pdfFile.filename || 'Task Document'}</h5>
                                  <p>From: {task.title}</p>
                                  <p>
                                    Assigned to: {getTaskAssigneeNames(task)} • Status: 
                                    <Chip
                                      label={task.status}
                                      color={getStatusColor(task.status)}
                                    />
                                  </p>
                                </div>
                              </div>
                              <div className="EmployeeProject-task-document-buttons">
                                <button
                                  className="EmployeeProject-button EmployeeProject-button-outline EmployeeProject-button-sm"
                                  onClick={() => viewPdf(task.pdfFile.path, getFileDisplayName(task.pdfFile))}
                                >
                                  <Icons.Visibility />
                                  Preview
                                </button>
                                <button
                                  className="EmployeeProject-button EmployeeProject-button-outline EmployeeProject-button-sm"
                                  onClick={() => downloadPdf(task.pdfFile.path, getFileDisplayName(task.pdfFile))}
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

            
            {tabValue === 2 && (
              <div className="EmployeeProject-info-tab">
                <h2 className="EmployeeProject-info-title">Project Information</h2>
                
                <div className="EmployeeProject-info-grid">
                  <div className="EmployeeProject-info-main">
                    <div className="EmployeeProject-info-card">
                      <h3 className="EmployeeProject-info-card-title">Project Details</h3>
                      <div className="EmployeeProject-info-details">
                        <div className="EmployeeProject-info-row">
                          <div className="EmployeeProject-info-column">
                            <div className="EmployeeProject-info-item">
                              <label>Project Name</label>
                              <p>{projectDetails.projectName}</p>
                            </div>
                            <div className="EmployeeProject-info-item">
                              <label>Status</label>
                              <Chip
                                label={projectDetails.status}
                                color={getStatusColor(projectDetails.status)}
                              />
                            </div>
                          </div>
                          <div className="EmployeeProject-info-column">
                            <div className="EmployeeProject-info-item">
                              <label>Priority</label>
                              <Chip
                                label={projectDetails.priority}
                                color={getPriorityColor(projectDetails.priority)}
                              />
                            </div>
                            <div className="EmployeeProject-info-item">
                              <label>Project Timeline</label>
                              <p>
                                {projectDetails.startDate ? new Date(projectDetails.startDate).toLocaleDateString() : 'Not set'} - {projectDetails.endDate ? new Date(projectDetails.endDate).toLocaleDateString() : 'Not set'}
                              </p>
                            </div>
                          </div>
                          <div className="EmployeeProject-info-full">
                            <div className="EmployeeProject-info-item">
                              <label>Description</label>
                              <p>{projectDetails.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="EmployeeProject-info-sidebar">
                    <div className="EmployeeProject-stats-card">
                      <h3 className="EmployeeProject-stats-title">Quick Stats</h3>
                      <div className="EmployeeProject-stats-list">
                        <div className="EmployeeProject-stat-row">
                          <span>Total Tasks</span>
                          <strong>{stats.totalTasks}</strong>
                        </div>
                        <div className="EmployeeProject-stat-row">
                          <span>Completed</span>
                          <strong style={{ color: "#66BB6A" }}>{stats.completedTasks}</strong>
                        </div>
                        <div className="EmployeeProject-stat-row">
                          <span>In Progress</span>
                          <strong style={{ color: "#29B6F6" }}>{stats.inProgressTasks}</strong>
                        </div>
                        <div className="EmployeeProject-stat-row">
                          <span>Pending</span>
                          <strong style={{ color: "#FFA726" }}>{stats.pendingTasks}</strong>
                        </div>
                        <div className="EmployeeProject-stat-row">
                          <span>On Hold</span>
                          <strong style={{ color: "#AB47BC" }}>{stats.onHoldTasks}</strong>
                        </div>
                        <div className="EmployeeProject-stat-row">
                          <span>Cancelled</span>
                          <strong style={{ color: "#EF5350" }}>{stats.cancelledTasks}</strong>
                        </div>
                        <div className="EmployeeProject-stat-divider" />
                        <div className="EmployeeProject-stat-row">
                          <span>Team Members</span>
                          <strong>{projectDetails.users?.length || 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="EmployeeProject-info-full-width">
                    <div className="EmployeeProject-team-card">
                      <h3 className="EmployeeProject-team-title">
                        <Icons.Group />
                        Team Members ({projectDetails.users?.length || 0})
                      </h3>
                      <div className="EmployeeProject-team-grid">
                        {projectDetails.users?.map((user) => (
                          <div className="EmployeeProject-team-member" key={user._id}>
                            <div className="EmployeeProject-team-member-content">
                              <div className="EmployeeProject-team-member-info">
                                <Avatar size="large">
                                  {user.name?.charAt(0)}
                                </Avatar>
                                <div className="EmployeeProject-team-member-details">
                                  <h5>{user.name}</h5>
                                  <p>{user.email}</p>
                                  {user.role && (
                                    <Chip
                                      label={user.role}
                                      color="#9E9E9E"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      
      {detailTask && !openPdfDialog && (
        <div className="EmployeeProject-modal">
          <div className="EmployeeProject-modal-backdrop" onClick={() => setDetailTaskId(null)} />
          <div className="EmployeeProject-modal-content EmployeeProject-modal-lg EmployeeProject-task-detail-modal">
            <div className="EmployeeProject-modal-header EmployeeProject-modal-header-primary">
              <h3>{detailTask.title}</h3>
              <button
                className="EmployeeProject-modal-close"
                onClick={() => setDetailTaskId(null)}
                aria-label="Close task details"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="EmployeeProject-modal-body">
              <div className="EmployeeProject-task-detail-header">
                <Chip
                  icon={detailTask.status === "completed" ? <Icons.CheckCircle /> :
                        detailTask.status === "in progress" ? <Icons.Update /> :
                        detailTask.status === "pending" ? <Icons.Schedule /> :
                        detailTask.status === "cancelled" ? <Icons.Cancel /> :
                        detailTask.status === "on hold" ? <Icons.Pause /> : <Icons.Schedule />}
                  label={detailTask.status?.replace(/_/g, ' ')}
                  color={getStatusColor(detailTask.status)}
                />
                <Chip
                  icon={<Icons.PriorityHigh />}
                  label={`Priority: ${detailTask.priority}`}
                  color={getPriorityColor(detailTask.priority)}
                />
              </div>

              {detailTask.description && (
                <div className="EmployeeProject-task-detail-section">
                  <h4>Description</h4>
                  <p className="EmployeeProject-task-description">{detailTask.description}</p>
                </div>
              )}

              <div className="EmployeeProject-task-detail-grid">
                <div className="EmployeeProject-task-meta-item">
                  <Icons.Person />
                  <span>{getTaskAssigneeNames(detailTask)}</span>
                </div>
                {detailTask.dueDate && (
                  <div className="EmployeeProject-task-meta-item">
                    <Icons.CalendarToday />
                    <span>Due: {new Date(detailTask.dueDate).toLocaleString()}</span>
                  </div>
                )}
                <div className="EmployeeProject-task-meta-item">
                  <Icons.AccessTime />
                  <span>Created: {new Date(detailTask.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {detailTask.pdfFile?.path && (
                <div className="EmployeeProject-task-detail-section">
                  <h4>Attachment</h4>
                  <div className="EmployeeProject-detail-attachment">
                    {isImagePath(detailTask.pdfFile) && (
                      <button
                        type="button"
                        className="EmployeeProject-detail-image-button"
                        onClick={() => viewPdf(detailTask.pdfFile.path, getFileDisplayName(detailTask.pdfFile))}
                      >
                        <img
                          src={getUploadUrl(detailTask.pdfFile.path)}
                          alt={getFileDisplayName(detailTask.pdfFile)}
                          className="EmployeeProject-detail-image-preview"
                          onError={(event) => {
                            const fallbackUrl = getLiveUploadUrl(detailTask.pdfFile.path);
                            if (fallbackUrl && event.currentTarget.src !== fallbackUrl) event.currentTarget.src = fallbackUrl;
                          }}
                        />
                      </button>
                    )}
                    <div className="EmployeeProject-detail-attachment-info">
                      <div className="EmployeeProject-detail-attachment-name">
                        {isImagePath(detailTask.pdfFile) ? <Icons.Image /> : <Icons.InsertDriveFile />}
                        <span>{getFileDisplayName(detailTask.pdfFile, "Task attachment")}</span>
                      </div>
                      <div className="EmployeeProject-task-detail-actions">
                        <button
                          className="EmployeeProject-button EmployeeProject-button-outline"
                          onClick={() => viewPdf(detailTask.pdfFile.path, getFileDisplayName(detailTask.pdfFile))}
                        >
                          <Icons.Visibility />
                          Preview
                        </button>
                        <button
                          className="EmployeeProject-button EmployeeProject-button-outline"
                          onClick={() => downloadPdf(detailTask.pdfFile.path, getFileDisplayName(detailTask.pdfFile))}
                        >
                          <Icons.Download />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="EmployeeProject-task-remarks">
                <h5 className="EmployeeProject-remarks-title">
                  <Icons.Comment />
                  Remarks ({detailTask.remarks?.length || 0})
                </h5>
                {detailTask.remarks?.length > 0 ? (
                  <div className="EmployeeProject-remarks-list">
                    {detailTask.remarks.map((r, idx) => (
                      <div className="EmployeeProject-remark-item" key={idx}>
                        {r.text && <p className="EmployeeProject-remark-text">{r.text}</p>}
                        {r.image && (
                          <button
                            type="button"
                            className="EmployeeProject-remark-image-button"
                            onClick={() => viewPdf(r.image, getFileDisplayName(r.image, "Remark image"))}
                          >
                            <img
                              src={getUploadUrl(r.image)}
                              alt="Remark attachment"
                              className="EmployeeProject-remark-image"
                            />
                          </button>
                        )}
                        <div className="EmployeeProject-remark-footer">
                          <div className="EmployeeProject-remark-author">
                            <Avatar size="small">
                              {r.createdBy?.name?.charAt(0)}
                            </Avatar>
                            <span>{r.createdBy?.name}</span>
                          </div>
                          <span className="EmployeeProject-remark-date">
                            {new Date(r.createdAt).toLocaleString()}
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

            <div className="EmployeeProject-modal-footer EmployeeProject-task-detail-footer">
              {["pending", "overdue"].includes(normalizeTaskStatus(detailTask.status)) && (
                <button
                  className="EmployeeProject-button EmployeeProject-button-outline"
                  onClick={() => {
                    setDetailTaskId(null);
                    handleOpenEditTaskDialog(detailTask);
                  }}
                >
                  <Icons.Edit />
                  Edit
                </button>
              )}
              <input
                type="text"
                className="EmployeeProject-remark-input"
                placeholder="Add a remark..."
                value={detailTask._newRemark || ""}
                onChange={(e) =>
                  setTasks((prev) =>
                    sortTasksByCreatedAt(prev.map((x) =>
                      x._id === detailTask._id
                        ? { ...x, _newRemark: e.target.value }
                        : x
                    ))
                  )
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
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
                className="EmployeeProject-icon-button EmployeeProject-remark-attach-button"
                onClick={() => document.getElementById(`remark-image-${detailTask._id}`)?.click()}
                aria-label="Attach remark image"
              >
                <Icons.Image />
              </button>
              {detailTask._newRemarkImageName && (
                <div className="EmployeeProject-remark-selected-image">
                  <Icons.Image />
                  <span>{detailTask._newRemarkImageName}</span>
                  <button
                    type="button"
                    className="EmployeeProject-file-remove"
                    onClick={() => clearRemarkImage(detailTask._id)}
                  >
                    Remove
                  </button>
                </div>
              )}
              <button
                className="EmployeeProject-button EmployeeProject-button-primary"
                onClick={() => handleAddRemark(detailTask._id, detailTask._newRemark)}
                disabled={!detailTask._newRemark?.trim() && !detailTask._newRemarkImage}
              >
                <Icons.Comment />
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      
      {openStatusDialog && (
        <div className="EmployeeProject-modal">
          <div className="EmployeeProject-modal-backdrop" onClick={() => {
            setOpenStatusDialog(false);
            setSelectedTask(null);
            setStatusRemark("");
          }} />
          <div className="EmployeeProject-modal-content EmployeeProject-modal-sm">
            <div className="EmployeeProject-modal-header EmployeeProject-modal-header-primary">
              <h3>Update Task Status</h3>
            </div>
            <div className="EmployeeProject-modal-body">
              <div className="EmployeeProject-status-form">
                <p className="EmployeeProject-status-task-title">
                  <strong>Task:</strong> {selectedTask?.title}
                </p>
                <div className="EmployeeProject-status-current">
                  <span>Current Status:</span>
                  <Chip 
                    label={selectedTask?.status?.replace(/_/g, ' ')} 
                    color={getStatusColor(selectedTask?.status)}
                  />
                </div>
                
                <div className="EmployeeProject-form-group">
                  <label>New Status *</label>
                  <select
                    className="EmployeeProject-select"
                    value={selectedTask?.status || ""}
                    onChange={(e) => setSelectedTask({
                      ...selectedTask,
                      status: e.target.value
                    })}
                  >
                    {TASK_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="EmployeeProject-form-group">
                  <label>Remark (Optional)</label>
                  <textarea
                    className="EmployeeProject-textarea"
                    rows="3"
                    value={statusRemark}
                    onChange={(e) => setStatusRemark(e.target.value)}
                    placeholder="Add any remarks about this status change..."
                  />
                </div>
              </div>
            </div>
            <div className="EmployeeProject-modal-footer">
              <button 
                className="EmployeeProject-button EmployeeProject-button-outline"
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
                className="EmployeeProject-button EmployeeProject-button-primary"
                onClick={() => handleUpdateTaskStatus(selectedTask._id, selectedTask.status)}
                disabled={loading.tasks || !selectedTask?.status}
              >
                {loading.tasks ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {openActivityDrawer && (
        <div className="EmployeeProject-drawer">
          <div className="EmployeeProject-drawer-backdrop" onClick={() => setOpenActivityDrawer(false)} />
          <div className="EmployeeProject-drawer-content EmployeeProject-drawer-right">
            <div className="EmployeeProject-drawer-header">
              <h3>Activity Logs</h3>
              <button className="EmployeeProject-drawer-close" onClick={() => setOpenActivityDrawer(false)}>
                <Icons.Close />
              </button>
            </div>
            <div className="EmployeeProject-drawer-body">
              <p className="EmployeeProject-activity-task-title">{selectedTask?.title}</p>
              <div className="EmployeeProject-divider" />
              
              <div className="EmployeeProject-activity-list">
                {selectedTask?.activityLogs?.map((log, index) => (
                  <div className="EmployeeProject-activity-item" key={index}>
                    <div className="EmployeeProject-activity-icon">
                      <Icons.History />
                    </div>
                    <div className="EmployeeProject-activity-content">
                      <p className="EmployeeProject-activity-description">{log.description}</p>
                      <div className="EmployeeProject-activity-meta">
                        <div className="EmployeeProject-activity-author">
                          <Icons.Person />
                          <span>{log.performedBy?.name}</span>
                        </div>
                        <span className="EmployeeProject-activity-date">
                          <Icons.AccessTime />
                          {new Date(log.performedAt).toLocaleString()}
                        </span>
                      </div>
                      {log.remark && (
                        <div className="EmployeeProject-activity-remark">
                          <em>Remark: {log.remark}</em>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!selectedTask?.activityLogs || selectedTask.activityLogs.length === 0) && (
                  <div className="EmployeeProject-empty-activity">
                    <Icons.History />
                    <p>No activity logs found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      
      {openNotificationsModal && (
        <div className="EmployeeProject-modal">
          <div className="EmployeeProject-modal-backdrop" onClick={() => setOpenNotificationsModal(false)} />
          <div className="EmployeeProject-modal-content EmployeeProject-modal-xs">
            <div className="EmployeeProject-modal-header EmployeeProject-modal-header-primary">
              <div className="EmployeeProject-modal-header-content">
                <Icons.Notifications />
                <h3>Notifications</h3>
                {notifications.length > 0 && unreadNotificationsCount > 0 && (
                  <Chip
                    label={`${unreadNotificationsCount} new`}
                    color="#FFFFFF"
                    style={{ backgroundColor: "#EF5350", color: "white", marginLeft: "8px" }}
                  />
                )}
              </div>
              <div className="EmployeeProject-modal-header-actions">
                {notifications.length > 0 && (
                  <Tooltip title="Clear All">
                    <button 
                      className="EmployeeProject-icon-button" 
                      onClick={handleClearAllNotifications}
                      style={{ color: "white" }}
                    >
                      <Icons.ClearAll />
                    </button>
                  </Tooltip>
                )}
                <button 
                  className="EmployeeProject-icon-button" 
                  onClick={() => setOpenNotificationsModal(false)}
                  style={{ color: "white" }}
                >
                  <Icons.Close />
                </button>
              </div>
            </div>
            <div className="EmployeeProject-modal-body">
              <div className="EmployeeProject-notifications-list-container">
                {notifications.length > 0 ? (
                  <div className="EmployeeProject-notifications-list-modal">
                    {notifications.map((notification) => (
                      <div 
                        className={`EmployeeProject-notification-item-modal ${notification.isRead ? '' : 'EmployeeProject-notification-unread-modal'}`}
                        key={notification._id}
                        onClick={() => handleMarkNotificationAsRead(notification._id)}
                      >
                        <div className="EmployeeProject-notification-icon-modal">
                          <Icons.Notifications />
                        </div>
                        <div className="EmployeeProject-notification-content-modal">
                          <h5 className={notification.isRead ? '' : 'EmployeeProject-notification-title-unread-modal'}>
                            {notification.title}
                          </h5>
                          <p className="EmployeeProject-notification-message-modal">{notification.message}</p>
                          <div className="EmployeeProject-notification-footer-modal">
                            <span className="EmployeeProject-notification-date-modal">
                              <Icons.AccessTime />
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                            {!notification.isRead && (
                              <Chip
                                label="New"
                                color="#667eea"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="EmployeeProject-empty-notifications-modal">
                    <Icons.Notifications />
                    <p>No notifications yet.</p>
                    <small>You'll see project updates here</small>
                  </div>
                )}
              </div>
            </div>
            <div className="EmployeeProject-modal-footer">
              <button 
                className="EmployeeProject-button EmployeeProject-button-primary"
                onClick={() => setOpenNotificationsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TASK DIALOG */}
      {openTaskDialog && (
        <div className="EmployeeProject-modal">
          <div className="EmployeeProject-modal-backdrop" onClick={handleCloseTaskDialog} />
          <div className="EmployeeProject-modal-content EmployeeProject-modal-md EmployeeProject-create-task-modal">
            <div className="EmployeeProject-modal-header EmployeeProject-modal-header-primary">
              <div className="EmployeeProject-create-task-heading">
                <span className="EmployeeProject-create-task-heading-icon">+</span>
                <div>
                  <h3>{editingTask ? "Edit Pending Task" : "Create New Task"}</h3>
                  <p>{editingTask ? "Update task details and assignees" : "Add task details and assign to team members"}</p>
                </div>
              </div>
              <button className="EmployeeProject-modal-close" onClick={handleCloseTaskDialog} aria-label="Close task dialog">
                <Icons.Close />
              </button>
            </div>
            <div className="EmployeeProject-modal-body">
              <div className="EmployeeProject-task-form">
                <div className="EmployeeProject-form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    className={`EmployeeProject-input ${taskErrors.title ? 'EmployeeProject-input-error' : ''}`}
                    value={newTask.title}
                    placeholder="Enter task title..."
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    required
                  />
                  {taskErrors.title && (
                    <span className="EmployeeProject-error-text">{taskErrors.title}</span>
                  )}
                </div>

                <div className="EmployeeProject-form-group">
                  <label>Description</label>
                  <textarea
                    className="EmployeeProject-textarea"
                    rows="3"
                    value={newTask.description}
                    placeholder="Enter task description..."
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>

                <div className="EmployeeProject-form-group">
                  <label>Assign To (multiple users)</label>
                  <div className={`EmployeeProject-user-tabs ${taskErrors.assignedTo ? 'EmployeeProject-user-tabs-error' : ''}`}>
                    {projectUsers.map((u) => {
                      const userId = getUserId(u);
                      const isSelected = newTask.assignedUsers.includes(userId);
                      return (
                        <label
                          className={`EmployeeProject-user-tab ${isSelected ? 'EmployeeProject-user-tab-selected' : ''}`}
                          key={userId}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTaskAssignedUser(userId)}
                          />
                          <span className="EmployeeProject-user-avatar">{String(u.name || 'U').trim().charAt(0).toUpperCase()}</span>
                          <span className="EmployeeProject-user-tab-copy">
                            <strong>{u.name || 'Unnamed User'}</strong>
                            <small>{u.email || 'No email'}</small>
                          </span>
                        </label>
                      );
                    })}
                    {!projectUsers.length && (
                      <div className="EmployeeProject-user-tabs-empty">No project users available.</div>
                    )}
                  </div>
                  {taskErrors.assignedTo && (
                    <span className="EmployeeProject-error-text">{taskErrors.assignedTo}</span>
                  )}
                </div>

                <div className="EmployeeProject-form-group">
                      <label>Due Date & Time</label>
                      <input
                        type="datetime-local"
                        className={`EmployeeProject-input ${taskErrors.dueDate ? 'EmployeeProject-input-error' : ''}`}
                        value={newTask.dueDate}
                        onChange={(e) =>
                          setNewTask({ ...newTask, dueDate: e.target.value })
                        }
                      />
                      {taskErrors.dueDate && (
                        <span className="EmployeeProject-error-text">{taskErrors.dueDate}</span>
                      )}
                </div>

                <div className="EmployeeProject-form-row">
                  <div className="EmployeeProject-form-group">
                    <label>Priority</label>
                    <select
                      className="EmployeeProject-select"
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

                  <div className="EmployeeProject-form-group">
                    <label>Initial Status</label>
                    <select
                      className="EmployeeProject-select"
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

                {!editingTask ? (
                  <div className="EmployeeProject-form-group">
                    <div
                      className={`EmployeeProject-file-dropzone ${isTaskFileDragging ? 'EmployeeProject-file-dropzone-active' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => document.getElementById('task-file-input').click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          document.getElementById('task-file-input').click();
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
                        if (e.currentTarget === e.target) setIsTaskFileDragging(false);
                      }}
                      onDrop={handleTaskFileDrop}
                    >
                      <Icons.CloudUpload />
                      <div className="EmployeeProject-file-dropzone-text">
                        <strong>Upload Task File</strong>
                        <span>Drag & drop PDF or image here, or click to browse</span>
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
                      <div className="EmployeeProject-file-info">
                        <Icons.PictureAsPdf />
                        <span>Selected: {fileName}</span>
                        <button
                          type="button"
                          className="EmployeeProject-file-remove"
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
                  </div>
                ) : editingTask.pdfFile?.filename ? (
                  <div className="EmployeeProject-file-info">
                    <Icons.PictureAsPdf />
                    <span>Current file: {editingTask.pdfFile.filename}</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="EmployeeProject-modal-footer">
              <button 
                className="EmployeeProject-button EmployeeProject-button-outline"
                onClick={handleCloseTaskDialog} 
                disabled={loading.tasks}
              >
                Cancel
              </button>
              <button
                className="EmployeeProject-button EmployeeProject-button-primary"
                onClick={editingTask ? handleUpdateTask : handleAddTask}
                disabled={loading.tasks}
              >
                {loading.tasks ? (editingTask ? "Updating..." : "Adding...") : (editingTask ? "Update Task" : "Create Task")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProject;
