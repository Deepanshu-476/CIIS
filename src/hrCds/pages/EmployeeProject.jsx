// ========================= EmployeeProject.jsx =========================
import React, { useState, useEffect, useMemo } from "react";
import axios from "../../utils/axiosConfig";
import "../Css/EmployeeProject.css";
import CIISLoader from '../../Loader/CIISLoader'; // ✅ Import CIISLoader

const getStoredCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem("user") || localStorage.getItem("superAdmin");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const getUserId = (user) => user?._id || user?.id || user;

const EmployeeProject = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pageLoading, setPageLoading] = useState(true); // ✅ Page loading state
  const [loading, setLoading] = useState({ projects: false, tasks: false });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openActivityDrawer, setOpenActivityDrawer] = useState(false);
  const [openNotificationsModal, setOpenNotificationsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [statusRemark, setStatusRemark] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [selectedPdfName, setSelectedPdfName] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [taskTeamFilter, setTaskTeamFilter] = useState("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0
  });

  const currentUser = useMemo(() => getStoredCurrentUser(), []);
  const currentUserId = getUserId(currentUser);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
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

  // Icons
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
    Filter: () => <span className="EmployeeProject-icon">🔍</span>,
    TrendingUp: () => <span className="EmployeeProject-icon">📈</span>,
    MoreVert: () => <span className="EmployeeProject-icon">⋯</span>,
    ArrowForward: () => <span className="EmployeeProject-icon">→</span>,
    Star: () => <span className="EmployeeProject-icon">⭐</span>,
    FiberNew: () => <span className="EmployeeProject-icon">🆕</span>,
    AccessTime: () => <span className="EmployeeProject-icon">⏱️</span>,
    Group: () => <span className="EmployeeProject-icon">👥</span>,
    Folder: () => <span className="EmployeeProject-icon">📁</span>,
    CloudUpload: () => <span className="EmployeeProject-icon">☁️↑</span>,
    Bolt: () => <span className="EmployeeProject-icon">⚡</span>,
    Notifications: () => <span className="EmployeeProject-icon">🔔</span>,
    NoProjects: () => <span className="EmployeeProject-icon">📭</span>
  };

  // ✅ Load all projects with page loader
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        await loadProjects();
    
      } catch (error) {
        console.error("Error loading data:", error);
        showSnackbar("Error loading data", "error");
      } finally {
        // Minimum 500ms loader show karega
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const inProgress = tasks.filter(t => t.status === "in progress").length;
    setStats({
      totalTasks: tasks.length,
      completedTasks: completed,
      pendingTasks: pending,
      inProgressTasks: inProgress
    });
  }, [tasks]);

  const loadProjects = async () => {
    setLoading(prev => ({ ...prev, projects: true }));
    try {
      const res = await axios.get("/projects");
      setProjects(res.data.items || res.data.projects || res.data.data || (Array.isArray(res.data) ? res.data : []));
    } catch (error) {
      console.error("Error loading projects:", error);
      showSnackbar("Error loading projects", "error");
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  // Load selected project details + tasks
  const handleSelectProject = async (id) => {
    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      setSelectedProject(id);
      const res = await axios.get(`/projects/${id}`);
      setProjectDetails(res.data);
      setProjectUsers(res.data.users || []);
      setTasks(res.data.tasks || []);
      setTaskTeamFilter("all");
      setTaskStatusFilter("all");
      setTaskSearchTerm("");
      setTabValue(0); // Reset to tasks tab
    } catch (error) {
      console.error("Error loading project details:", error);
      showSnackbar("Error loading project details", "error");
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  // Validate task form
  const validateTaskForm = () => {
    const errors = {};
    if (!newTask.title.trim()) errors.title = "Task title is required";
    if (!newTask.assignedTo) errors.assignedTo = "Please assign task to a user";
    setTaskErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      await axios.patch(`/projects/${selectedProject}/tasks/${taskId}/status`, {
        status: newStatus,
        remark: statusRemark,
      });

      // Refresh tasks and notifications
      handleSelectProject(selectedProject);
      loadNotifications();
      
      // Reset and close dialog
      setStatusRemark("");
      setOpenStatusDialog(false);
      setSelectedTask(null);
      showSnackbar("Task status updated successfully!", "success");

    } catch (error) {
      console.error("Error updating task status:", error);
      showSnackbar("Error updating task status", "error");
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  // Open status update dialog
  const handleOpenStatusDialog = (task) => {
    if (!isTaskAssignedToCurrentUser(task)) {
      showSnackbar("Only the assigned user can update this task status", "warning");
      return;
    }
    setSelectedTask(task);
    setStatusRemark("");
    setOpenStatusDialog(true);
  };

  // Load activity logs
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

  // Load notifications (placeholder - implement actual API call)
  const loadNotifications = async () => {
    try {
      const res = await axios.get("/projects/notifications");
      setNotifications(res.data.notifications || res.data.items || res.data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  // Mark notification as read
  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(`/projects/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Clear all notifications
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

  // Add Task
  const handleAddTask = async () => {
    if (!validateTaskForm()) return;

    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      const formData = new FormData();
      Object.keys(newTask).forEach((key) => {
        formData.append(key, newTask[key]);
      });

      if (file) formData.append("pdfFile", file);

      await axios.post(`/projects/${selectedProject}/tasks`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Reset form and close dialog
      setNewTask({
        title: "",
        description: "",
        assignedTo: "",
        dueDate: "",
        priority: "Medium",
        status: "pending",
      });
      setFile(null);
      setFileName("");
      setTaskErrors({});
      setOpenTaskDialog(false);

      // Refresh tasks and notifications
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

  // Add Remark to a Task
  const handleAddRemark = async (taskId, text) => {
    if (!text || text.trim() === "") {
      showSnackbar("Please enter a remark", "warning");
      return;
    }

    try {
      await axios.post(
        `/projects/${selectedProject}/tasks/${taskId}/remarks`,
        { text }
      );
      // Reload tasks and notifications
      handleSelectProject(selectedProject);
      loadNotifications();
      
      // Clear the remark input
      setTasks(prev => prev.map(task => 
        task._id === taskId ? { ...task, _newRemark: "" } : task
      ));
      
      showSnackbar("Remark added successfully!", "success");
    } catch (error) {
      console.error("Error adding remark:", error);
      showSnackbar("Error adding remark", "error");
    }
  };

  // VIEW PDF
  const viewPdf = (pdfPath, filename) => {
    if (!pdfPath) {
      showSnackbar("No PDF file available", "warning");
      return;
    }
    
    const pathParts = pdfPath.split('/');
    const pdfFilename = pathParts[pathParts.length - 1];
    const pdfUrl = `${axios.defaults.baseURL.replace('/api', '')}/${pdfPath}`;
    
    setSelectedPdfUrl(pdfUrl);
    setSelectedPdfName(filename || pdfFilename);
    setOpenPdfDialog(true);
  };

  // DOWNLOAD PDF
  const downloadPdf = (pdfPath, filename) => {
    if (!pdfPath) {
      showSnackbar("No PDF file available", "warning");
      return;
    }
    
    const pathParts = pdfPath.split('/');
    const pdfFilename = pathParts[pathParts.length - 1];
    const pdfUrl = `${axios.defaults.baseURL.replace('/api', '')}/${pdfPath}`;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename || pdfFilename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        showSnackbar("Only PDF files are allowed", "error");
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
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
    switch (status) {
      case "completed": return "#66BB6A";
      case "in progress": return "#29B6F6";
      case "pending": return "#FFA726";
      case "cancelled": return "#EF5350";
      case "on hold": return "#AB47BC";
      default: return "#9E9E9E";
    }
  };

  const getTaskProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const isTaskAssignedToCurrentUser = (task) => {
    if (!currentUserId) return false;
    return getUserId(task?.assignedTo)?.toString() === currentUserId.toString();
  };

  const filteredTasks = tasks.filter((task) => {
    const assignedToId = getUserId(task.assignedTo)?.toString();
    const matchesTeam = taskTeamFilter === "all" || assignedToId === taskTeamFilter;
    const matchesStatus = taskStatusFilter === "all" || task.status === taskStatusFilter;
    const search = taskSearchTerm.trim().toLowerCase();
    const matchesSearch = !search ||
      (task.title || "").toLowerCase().includes(search) ||
      (task.description || "").toLowerCase().includes(search) ||
      (task.assignedTo?.name || "").toLowerCase().includes(search);

    return matchesTeam && matchesStatus && matchesSearch;
  });

  const StatCard = ({ icon, value, label, color, subtext, trend }) => (
    <div className="EmployeeProject-stat-card" style={{ borderLeftColor: color }}>
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
    </div>
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

  // ✅ Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="EmployeeProject-container">
      {/* Snackbar */}
      {snackbar.open && (
        <div className="EmployeeProject-snackbar">
          <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
            {snackbar.message}
          </Alert>
        </div>
      )}

      {/* PDF Viewer Dialog */}
      {openPdfDialog && (
        <div className="EmployeeProject-modal EmployeeProject-pdf-modal">
          <div className="EmployeeProject-modal-backdrop" onClick={() => setOpenPdfDialog(false)} />
          <div className="EmployeeProject-modal-content">
            <div className="EmployeeProject-modal-header EmployeeProject-modal-header-primary">
              <div className="EmployeeProject-modal-header-content">
                <Icons.PictureAsPdf />
                <h3>{selectedPdfName}</h3>
              </div>
              <button className="EmployeeProject-modal-close" onClick={() => setOpenPdfDialog(false)}>
                <Icons.Close />
              </button>
            </div>
            <div className="EmployeeProject-modal-body EmployeeProject-pdf-viewer">
              {selectedPdfUrl ? (
                <iframe
                  src={selectedPdfUrl}
                  title="PDF Viewer"
                  className="EmployeeProject-pdf-frame"
                />
              ) : (
                <div className="EmployeeProject-pdf-error">
                  <p>PDF cannot be loaded</p>
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
                onClick={() => setOpenPdfDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="EmployeeProject-header">
        <div className="EmployeeProject-header-content">
          <div className="EmployeeProject-header-text">
            <h1 className="EmployeeProject-title">Project Dashboard</h1>
            <p className="EmployeeProject-subtitle">Manage your projects and tasks efficiently</p>
          </div>
        </div>

        {/* Stats Cards - Only show if project is selected */}
        {selectedProject && (
          <div className="EmployeeProject-stats-grid">
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.Dashboard />}
                value={stats.totalTasks}
                label="Total Tasks"
                color="#667eea"
                subtext="This project"
              />
            </div>
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.CheckCircle />}
                value={stats.completedTasks}
                label="Completed"
                color="#66BB6A"
                trend={`${getTaskProgress()}% of total`}
              />
            </div>
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.Update />}
                value={stats.inProgressTasks}
                label="In Progress"
                color="#29B6F6"
              />
            </div>
            <div className="EmployeeProject-stat-item">
              <StatCard
                icon={<Icons.Schedule />}
                value={stats.pendingTasks}
                label="Pending"
                color="#FFA726"
              />
            </div>
          </div>
        )}
      </div>

      {loading.projects && (
        <LinearProgress />
      )}

      {/* PROJECT LIST - SHOW NO PROJECTS MESSAGE IF EMPTY */}
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
      ) : (
        <div className="EmployeeProject-grid">
          {projects.map((p) => (
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
                    <button className="EmployeeProject-icon-button EmployeeProject-card-menu">
                      <Icons.MoreVert />
                    </button>
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
                  
                  {/* Project PDF indicator */}
                  {p.pdfFile?.path && (
                    <div className="EmployeeProject-card-pdf">
                      <div className="EmployeeProject-pdf-info">
                        <Icons.PictureAsPdf />
                        <span className="EmployeeProject-pdf-text">Document attached</span>
                      </div>
                      <div className="EmployeeProject-pdf-actions">
                        <Tooltip title="View PDF">
                          <button
                            className="EmployeeProject-icon-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewPdf(p.pdfFile.path, p.pdfFile.filename);
                            }}
                          >
                            <Icons.Visibility />
                          </button>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <button
                            className="EmployeeProject-icon-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPdf(p.pdfFile.path, p.pdfFile.filename);
                            }}
                          >
                            <Icons.Download />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TASK PANEL - Only show if a project is selected */}
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
            {/* TASKS TAB */}
            {tabValue === 0 && (
              <>
                <div className="EmployeeProject-panel-header-content">
                  <div>
                    <h2 className="EmployeeProject-panel-title">{projectDetails.projectName}</h2>
                    <p className="EmployeeProject-panel-subtitle">{projectDetails.description}</p>
                  </div>
                  <button
                    className="EmployeeProject-button EmployeeProject-button-primary"
                    onClick={() => setOpenTaskDialog(true)}
                    disabled={loading.tasks}
                  >
                    <Icons.Add />
                    New Task
                  </button>
                </div>

                {/* Project Progress */}
                <div className="EmployeeProject-progress-card">
                  <div className="EmployeeProject-progress-header">
                    <h4 className="EmployeeProject-progress-title">Project Progress</h4>
                    <div className="EmployeeProject-progress-value">{getTaskProgress()}%</div>
                  </div>
                  <LinearProgress value={getTaskProgress()} />
                  <div className="EmployeeProject-progress-footer">
                    <span>{stats.completedTasks} of {stats.totalTasks} tasks completed</span>
                    <span>{stats.pendingTasks} pending • {stats.inProgressTasks} in progress</span>
                  </div>
                </div>

                <div className="EmployeeProject-task-filters">
                  <div className="EmployeeProject-filter-field EmployeeProject-filter-search">
                    <label>Search Tasks</label>
                    <input
                      type="text"
                      className="EmployeeProject-input"
                      placeholder="Search by title, description, assignee"
                      value={taskSearchTerm}
                      onChange={(e) => setTaskSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="EmployeeProject-filter-field">
                    <label>Team Member</label>
                    <select
                      className="EmployeeProject-select"
                      value={taskTeamFilter}
                      onChange={(e) => setTaskTeamFilter(e.target.value)}
                    >
                      <option value="all">All Team Members</option>
                      {projectUsers.map((user) => (
                        <option key={getUserId(user)} value={getUserId(user)}>
                          {user.name || user.email || "Unknown User"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="EmployeeProject-filter-field">
                    <label>Status</label>
                    <select
                      className="EmployeeProject-select"
                      value={taskStatusFilter}
                      onChange={(e) => setTaskStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      {TASK_STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading.tasks ? (
                  <div className="EmployeeProject-loading">
                    <CircularProgress />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="EmployeeProject-empty-state">
                    <Icons.Task />
                    <h3>No tasks yet</h3>
                    <p>Start by creating your first task</p>
                    <button
                      className="EmployeeProject-button EmployeeProject-button-primary"
                      onClick={() => setOpenTaskDialog(true)}
                    >
                      <Icons.Add />
                      Create First Task
                    </button>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="EmployeeProject-empty-state">
                    <Icons.Filter />
                    <h3>No matching tasks</h3>
                    <p>Try changing the team or status filter</p>
                  </div>
                ) : (
                  <div className="EmployeeProject-tasks-list">
                    {filteredTasks.map((t) => (
                      <div className="EmployeeProject-task-card" key={t._id} style={{ borderLeftColor: getStatusColor(t.status) }}>
                        <div className="EmployeeProject-task-content">
                          <div className="EmployeeProject-task-header">
                            <div className="EmployeeProject-task-title-section">
                              <h4 className="EmployeeProject-task-title">{t.title}</h4>
                              <div className="EmployeeProject-task-chips">
                                <Chip
                                  icon={t.status === "completed" ? <Icons.CheckCircle /> : 
                                        t.status === "in progress" ? <Icons.Update /> :
                                        t.status === "pending" ? <Icons.Schedule /> :
                                        t.status === "cancelled" ? <Icons.Cancel /> :
                                        t.status === "on hold" ? <Icons.Pause /> : <Icons.Schedule />}
                                  label={t.status.replace(/_/g, ' ')}
                                  color={getStatusColor(t.status)}
                                />
                                <Chip
                                  icon={<Icons.PriorityHigh />}
                                  label={`Priority: ${t.priority}`}
                                  color={getPriorityColor(t.priority)}
                                />
                              </div>
                            </div>
                            <div className="EmployeeProject-task-actions">
                              {t.pdfFile?.path && (
                                <div className="EmployeeProject-task-pdf-actions">
                                  <Tooltip title="View PDF">
                                    <button
                                      className="EmployeeProject-icon-button"
                                      onClick={() => viewPdf(t.pdfFile.path, t.pdfFile.filename)}
                                    >
                                      <Icons.Visibility />
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="Download PDF">
                                    <button
                                      className="EmployeeProject-icon-button"
                                      onClick={() => downloadPdf(t.pdfFile.path, t.pdfFile.filename)}
                                    >
                                      <Icons.Download />
                                    </button>
                                  </Tooltip>
                                </div>
                              )}
                              <Tooltip title="Update Status">
                                <button
                                  className={`EmployeeProject-icon-button ${!isTaskAssignedToCurrentUser(t) ? 'EmployeeProject-icon-button-disabled' : ''}`}
                                  onClick={() => handleOpenStatusDialog(t)}
                                  disabled={!isTaskAssignedToCurrentUser(t)}
                                >
                                  <Icons.Update />
                                </button>
                              </Tooltip>
                              <Tooltip title="View Activity">
                                <button
                                  className="EmployeeProject-icon-button"
                                  onClick={() => handleLoadActivityLogs(t._id)}
                                >
                                  <Icons.History />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                          
                          {t.description && (
                            <p className="EmployeeProject-task-description">{t.description}</p>
                          )}
                          
                          <div className="EmployeeProject-task-meta">
                            <div className="EmployeeProject-task-meta-item">
                              <Icons.Person />
                              <span>{t.assignedTo?.name || "Unassigned"}</span>
                            </div>
                            {t.dueDate && (
                              <div className="EmployeeProject-task-meta-item">
                                <Icons.CalendarToday />
                                <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="EmployeeProject-task-meta-item">
                              <Icons.AccessTime />
                              <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Existing remarks */}
                          {t.remarks?.length > 0 && (
                            <div className="EmployeeProject-task-remarks">
                              <h5 className="EmployeeProject-remarks-title">
                                <Icons.Comment />
                                Remarks ({t.remarks.length})
                              </h5>
                              <div className="EmployeeProject-remarks-list">
                                {t.remarks.map((r, idx) => (
                                  <div className="EmployeeProject-remark-item" key={idx}>
                                    <p className="EmployeeProject-remark-text">{r.text}</p>
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
                            </div>
                          )}
                        </div>

                        {/* Add New Remark */}
                        <div className="EmployeeProject-add-remark">
                          <div className="EmployeeProject-remark-input-row">
                            <input
                              type="text"
                              className="EmployeeProject-remark-input"
                              placeholder="Add a remark..."
                              value={t._newRemark || ""}
                              onChange={(e) =>
                                setTasks((prev) =>
                                  prev.map((x) =>
                                    x._id === t._id
                                      ? { ...x, _newRemark: e.target.value }
                                      : x
                                  )
                                )
                              }
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddRemark(t._id, t._newRemark);
                                }
                              }}
                            />
                            <button
                              className="EmployeeProject-button EmployeeProject-button-primary"
                              onClick={() => handleAddRemark(t._id, t._newRemark)}
                              disabled={!t._newRemark?.trim()}
                            >
                              <Icons.Comment />
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* DOCUMENTS TAB */}
            {tabValue === 1 && (
              <div className="EmployeeProject-documents-tab">
                <h2 className="EmployeeProject-documents-title">Project Documents</h2>
                <p className="EmployeeProject-documents-subtitle">All project-related documents and files</p>
                
                {/* Project Document */}
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
                          onClick={() => viewPdf(projectDetails.pdfFile.path, projectDetails.pdfFile.filename)}
                        >
                          <Icons.Visibility />
                          View
                        </button>
                        <button
                          className="EmployeeProject-button EmployeeProject-button-primary"
                          onClick={() => downloadPdf(projectDetails.pdfFile.path, projectDetails.pdfFile.filename)}
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

                {/* Task Documents */}
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
                                <Icons.InsertDriveFile />
                                <div className="EmployeeProject-task-document-text">
                                  <h5>{task.pdfFile.filename || 'Task Document'}</h5>
                                  <p>From: {task.title}</p>
                                  <p>
                                    Assigned to: {task.assignedTo?.name || 'Unassigned'} • Status: 
                                    <Chip
                                      label={task.status}
                                      color={getStatusColor(task.status)}
                                    />
                                  </p>
                                </div>
                              </div>
                              <div className="EmployeeProject-task-document-buttons">
                                <Tooltip title="View PDF">
                                  <button
                                    className="EmployeeProject-icon-button"
                                    onClick={() => viewPdf(task.pdfFile.path, task.pdfFile.filename)}
                                  >
                                    <Icons.Visibility />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <button
                                    className="EmployeeProject-icon-button"
                                    onClick={() => downloadPdf(task.pdfFile.path, task.pdfFile.filename)}
                                  >
                                    <Icons.Download />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <Alert severity="info">No task documents available</Alert>
                )}
              </div>
            )}

            {/* PROJECT INFO TAB */}
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

      {/* UPDATE STATUS DIALOG */}
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

      {/* ACTIVITY LOGS DRAWER */}
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

      {/* NOTIFICATIONS MODAL (Centered Popup) */}
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
          <div className="EmployeeProject-modal-backdrop" onClick={() => setOpenTaskDialog(false)} />
          <div className="EmployeeProject-modal-content EmployeeProject-modal-md">
            <div className="EmployeeProject-modal-header EmployeeProject-modal-header-primary">
              <h3>Create New Task</h3>
            </div>
            <div className="EmployeeProject-modal-body">
              <div className="EmployeeProject-task-form">
                <div className="EmployeeProject-form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    className={`EmployeeProject-input ${taskErrors.title ? 'EmployeeProject-input-error' : ''}`}
                    value={newTask.title}
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
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>

                <div className="EmployeeProject-form-group">
                  <label>Assign To *</label>
                  <select
                    className={`EmployeeProject-select ${taskErrors.assignedTo ? 'EmployeeProject-input-error' : ''}`}
                    value={newTask.assignedTo}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assignedTo: e.target.value })
                    }
                  >
                    <option value="">Select a user</option>
                    {projectUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  {taskErrors.assignedTo && (
                    <span className="EmployeeProject-error-text">{taskErrors.assignedTo}</span>
                  )}
                </div>

                <div className="EmployeeProject-form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="EmployeeProject-input"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                  />
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

                <div className="EmployeeProject-form-group">
                  <button
                    className="EmployeeProject-button EmployeeProject-button-outline EmployeeProject-file-upload"
                    onClick={() => document.getElementById('task-file-input').click()}
                  >
                    <Icons.CloudUpload />
                    Upload Task File (PDF)
                  </button>
                  <input
                    id="task-file-input"
                    type="file"
                    hidden
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  {fileName && (
                    <div className="EmployeeProject-file-info">
                      <Icons.PictureAsPdf />
                      <span>Selected: {fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="EmployeeProject-modal-footer">
              <button 
                className="EmployeeProject-button EmployeeProject-button-outline"
                onClick={() => setOpenTaskDialog(false)} 
                disabled={loading.tasks}
              >
                Cancel
              </button>
              <button
                className="EmployeeProject-button EmployeeProject-button-primary"
                onClick={handleAddTask}
                disabled={loading.tasks}
              >
                {loading.tasks ? "Adding..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProject;
