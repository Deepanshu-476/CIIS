import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFolder,
  FiCalendar,
  FiArrowRight,
  FiUsers,
  FiCheckSquare,
  FiFileText,
  FiSearch,
  FiX,
  FiInbox,
  FiGrid,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiTrendingUp,
  FiUploadCloud,
  FiPlus,
  FiPaperclip
} from "react-icons/fi";
import axios from "../../utils/axiosConfig";
import "../Css/EmployeeProject.css";
import ProjectBulkImportModal from "../components/ProjectBulkImportModal";

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
  const userCompany =
    typeof user.company === "object" && user.company ? user.company : {};
  const rawCompany = localStorage.getItem("company") || "";

  const companyCode = String(
    localStorage.getItem("companyCode") ||
      user.companyCode ||
      userCompany.companyCode ||
      userCompany.code ||
      companyDetails.companyCode ||
      companyDetails.code ||
      storedCompany.companyCode ||
      storedCompany.code ||
      (!rawCompany.trim().startsWith("{") ? rawCompany : "") ||
      ""
  ).trim();

  const companyIdentifier = String(
    user.companyId ||
      userCompany._id ||
      userCompany.id ||
      companyDetails._id ||
      companyDetails.id ||
      storedCompany._id ||
      storedCompany.id ||
      localStorage.getItem("companyIdentifier") ||
      ""
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

const getProjectCompanyCode = (project) =>
  String(
    project?.companyCode ||
      project?.company?.companyCode ||
      project?.company?.code ||
      project?.companyId?.companyCode ||
      project?.companyDetails?.companyCode ||
      ""
  ).trim();

const formatProjectDate = (value, fallback = "Not set") => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getProjectTaskTotal = (project) => {
  if (typeof project?.taskCount === "number") return project.taskCount;
  if (typeof project?.totalTasks === "number") return project.totalTasks;
  if (Array.isArray(project?.tasks)) return project.tasks.length;
  return 0;
};

const getProjectProgressPercent = (project) => {
  if (!project) return 0;
  const total = getProjectTaskTotal(project);
  if (!total) return 0;

  const explicitPct = Number(
    project.taskProgress ?? project.progressPercentage ?? project.progress ?? NaN
  );
  if (!Number.isNaN(explicitPct) && explicitPct > 0) {
    return Math.max(0, Math.min(100, Math.round(explicitPct)));
  }

  const completed =
    typeof project.completedTaskCount === "number"
      ? project.completedTaskCount
      : typeof project.completedTasks === "number"
        ? project.completedTasks
        : Array.isArray(project.tasks)
          ? project.tasks.filter(
              (t) => String(t?.status || "").trim().toLowerCase() === "completed"
            ).length
          : 0;

  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
};

const getEffectiveProjectStatus = (project) => {
  if (!project) return "Active";
  const raw = String(project.status || "").trim();
  const lower = raw.toLowerCase();
  if (["completed", "done", "finished"].includes(lower)) return "Completed";
  if (getProjectTaskTotal(project) > 0 && getProjectProgressPercent(project) >= 100) {
    return "Completed";
  }
  return raw || "Active";
};

const Icons = {
  Folder: () => <FiFolder className="EmployeeProject-icon" />,
  CalendarToday: () => <FiCalendar className="EmployeeProject-icon" />,
  ArrowForward: () => <FiArrowRight className="EmployeeProject-icon" />,
  Group: () => <FiUsers className="EmployeeProject-icon" />,
  Task: () => <FiCheckSquare className="EmployeeProject-icon" />,
  PictureAsPdf: () => <FiFileText className="EmployeeProject-icon" />,
  Search: () => <FiSearch className="EmployeeProject-icon" />,
  Close: () => <FiX className="EmployeeProject-icon" />,
  NoProjects: () => <FiInbox className="EmployeeProject-icon" />,
  Dashboard: () => <FiGrid className="EmployeeProject-icon" />,
  CheckCircle: () => <FiCheckCircle className="EmployeeProject-icon" />,
  PriorityHigh: () => <FiAlertTriangle className="EmployeeProject-icon" />,
  Update: () => <FiRefreshCw className="EmployeeProject-icon" />,
  TrendingUp: () => <FiTrendingUp className="EmployeeProject-icon" />,
  UploadCloud: () => <FiUploadCloud className="EmployeeProject-icon" />,
  Add: () => <FiPlus className="EmployeeProject-icon" />,
  AttachFile: () => <FiPaperclip className="EmployeeProject-icon" />,
};

const EmployeeProject = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Bulk import & single task create states
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedProjectForTask, setSelectedProjectForTask] = useState(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedUsers: [],
    dueDate: "",
    priority: "Medium",
  });
  const [taskFile, setTaskFile] = useState(null);
  const [taskErrors, setTaskErrors] = useState({});
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [companyUsers, setCompanyUsers] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const fetchCompanyUsers = async () => {
    try {
      const { companyCode, companyIdentifier } = getCompanyContext();
      if (!companyCode) return;
      const res = await axios.get("/users/company-users", {
        params: { companyCode, companyIdentifier: companyIdentifier || undefined },
        timeout: 10000,
      });
      if (res.data?.success && res.data.message?.users) setCompanyUsers(res.data.message.users);
      else if (Array.isArray(res.data)) setCompanyUsers(res.data);
      else if (res.data?.data) setCompanyUsers(res.data.data);
      else if (res.data?.users) setCompanyUsers(res.data.users);
    } catch (err) {
      console.error("Error fetching company users:", err);
    }
  };

  const handleOpenCreateTask = (project = null) => {
    const defaultProjId = project?._id || project?.id || (projects[0]?._id || projects[0]?.id || "");
    setTargetProjectId(defaultProjId);
    setTaskForm({
      title: "",
      description: "",
      assignedUsers: [],
      dueDate: "",
      priority: "Medium",
    });
    setTaskFile(null);
    setTaskErrors({});
    setIsCreateTaskOpen(true);
    if (companyUsers.length === 0) {
      fetchCompanyUsers();
    }
  };

  const handleOpenBulkImport = (project = null) => {
    setSelectedProjectForTask(project);
    setIsBulkImportOpen(true);
  };

  const assignableUsers = useMemo(() => {
    const selectedProj = projects.find((p) => (p._id || p.id) === targetProjectId);
    if (selectedProj?.users && Array.isArray(selectedProj.users) && selectedProj.users.length > 0) {
      if (typeof selectedProj.users[0] === "object" && selectedProj.users[0]?.name) {
        return selectedProj.users;
      }
      const userIds = new Set(selectedProj.users.map((u) => (typeof u === "object" ? u._id || u.id : u)));
      const matched = companyUsers.filter((u) => userIds.has(u._id || u.id));
      if (matched.length > 0) return matched;
    }
    return companyUsers;
  }, [projects, targetProjectId, companyUsers]);

  const handleCreateTaskSubmit = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};
    if (!targetProjectId) newErrors.project = "Please select a target project";
    if (!taskForm.title.trim()) newErrors.title = "Task title is required";

    if (Object.keys(newErrors).length > 0) {
      setTaskErrors(newErrors);
      return;
    }

    try {
      setIsSubmittingTask(true);
      const formData = new FormData();
      formData.append("title", taskForm.title.trim());
      formData.append("description", taskForm.description.trim());
      formData.append("priority", taskForm.priority);
      if (taskForm.dueDate) {
        formData.append("dueDate", new Date(taskForm.dueDate).toISOString());
      }
      if (taskForm.assignedUsers.length > 0) {
        formData.append("assignedUsers", JSON.stringify(taskForm.assignedUsers));
        formData.append("assignedTo", taskForm.assignedUsers[0]);
      }
      if (taskFile) {
        const safeTaskTitle = (taskForm.title || "Task").replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");
        const ext = taskFile.name ? taskFile.name.substring(taskFile.name.lastIndexOf(".")) : ".pdf";
        formData.append("pdfFile", taskFile, `${safeTaskTitle}_Document${ext.toLowerCase()}`);
      }

      const res = await axios.post(`/projects/${targetProjectId}/tasks`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200 || res.status === 201) {
        setSnackbar({
          open: true,
          message: "Task created successfully!",
          severity: "success",
        });
        setIsCreateTaskOpen(false);
        setTaskForm({ title: "", description: "", assignedUsers: [], dueDate: "", priority: "Medium" });
        setTaskFile(null);
        setTaskErrors({});
        await loadProjects();
      } else {
        setSnackbar({
          open: true,
          message: res.data?.message || "Failed to create task",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error creating task:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to create task",
        severity: "error",
      });
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { companyCode, companyIdentifier } = getCompanyContext();

      const res = await axios.get("/projects", {
        params: {
          companyCode,
          companyIdentifier: companyIdentifier || undefined,
          summary: 1,
          limit: 100,
        },
      });
      const loadedProjects = getProjectsFromResponse(res.data);
      const normalizedCompanyCode = (companyCode || "").trim().toLowerCase();
      const companyProjects = loadedProjects.filter((project) => {
        if (!normalizedCompanyCode) return true;
        const projectCompanyCode = getProjectCompanyCode(project).toLowerCase();
        if (!projectCompanyCode) return true;
        return (
          projectCompanyCode === normalizedCompanyCode ||
          projectCompanyCode.startsWith(normalizedCompanyCode) ||
          normalizedCompanyCode.startsWith(projectCompanyCode)
        );
      });

      setProjects(companyProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      setSnackbar({
        open: true,
        message: "Error loading projects",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
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
    switch (String(status || "").trim().toLowerCase()) {
      case "completed":
        return "#66BB6A";
      case "in progress":
      case "active":
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

  // Overall projects stats
  const projectStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => {
      const s = getEffectiveProjectStatus(p).toLowerCase();
      return ["active", "in progress", "ongoing"].includes(s);
    }).length;
    const completed = projects.filter((p) => {
      const s = getEffectiveProjectStatus(p).toLowerCase();
      return ["completed", "done", "finished"].includes(s);
    }).length;
    const highPriority = projects.filter(
      (p) => String(p.priority || "").toLowerCase() === "high"
    ).length;
    const totalTasks = projects.reduce(
      (acc, p) => acc + getProjectTaskTotal(p),
      0
    );

    return { total, active, completed, highPriority, totalTasks };
  }, [projects]);

  // Filtering projects
  const filteredProjects = useMemo(() => {
    let result = projects;

    if (statusFilter !== "all") {
      result = result.filter((p) => {
        const s = getEffectiveProjectStatus(p).toLowerCase();
        if (statusFilter === "active")
          return ["active", "in progress", "ongoing"].includes(s);
        if (statusFilter === "completed")
          return ["completed", "done", "finished"].includes(s);
        if (statusFilter === "high priority")
          return String(p.priority || "").toLowerCase() === "high";
        return s === statusFilter;
      });
    }

    const q = projectSearchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((project) => {
        const searchableText = [
          project.projectName,
          project.title,
          project.name,
          project.description,
          getEffectiveProjectStatus(project),
          project.priority,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(q);
      });
    }

    return result;
  }, [projects, statusFilter, projectSearchTerm]);

  // Navigate to separate Project Details / Tasks page
  const handleProjectClick = (project) => {
    navigate(`/ciisUser/project/${project._id}`, { state: { project } });
  };

  const Chip = ({ label, color, icon, variant = "default" }) => (
    <span
      className={`EmployeeProject-chip EmployeeProject-chip-${variant}`}
      style={{
        backgroundColor:
          variant === "outlined" ? "transparent" : `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {icon && <span className="EmployeeProject-chip-icon">{icon}</span>}
      {label}
    </span>
  );

  const StatCard = ({
    icon,
    value,
    label,
    color,
    subtext,
    active,
    onClick,
  }) => (
    <button
      type="button"
      className={`EmployeeProject-stat-card EmployeeProject-stat-card-clickable ${
        active ? "EmployeeProject-stat-card-active" : ""
      }`}
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <div className="EmployeeProject-stat-content">
        <div className="EmployeeProject-stat-text">
          <h3 className="EmployeeProject-stat-value" style={{ color }}>
            {value}
          </h3>
          <p className="EmployeeProject-stat-label">{label}</p>
          {subtext && (
            <p className="EmployeeProject-stat-subtext">{subtext}</p>
          )}
        </div>
        <div
          className="EmployeeProject-stat-icon"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
    </button>
  );

  const CircularProgress = ({ size = 46 }) => (
    <div className="EmployeeProject-spinner-container" style={{ width: size, height: size }}>
      <svg className="EmployeeProject-modern-spinner" viewBox="0 0 50 50">
        <circle
          className="EmployeeProject-spinner-track"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
        <circle
          className="EmployeeProject-spinner-arc"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      <div className="EmployeeProject-spinner-pulse" />
    </div>
  );

  const ProjectLoader = () => (
    <div className="EmployeeProject-loading-wrapper" aria-label="Loading projects" role="status">
      <div className="EmployeeProject-loading-card">
        <CircularProgress size={50} />
        <div className="EmployeeProject-loading-text-group">
          <h3 className="EmployeeProject-loading-title">Loading Projects</h3>
          <p className="EmployeeProject-loading-subtitle">
            Fetching your workspace and assigned projects
            <span className="EmployeeProject-loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </p>
        </div>
      </div>

      {/* Modern Skeleton Cards Preview */}
      <div className="EmployeeProject-skeleton-grid" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div className="EmployeeProject-skeleton-card" key={idx}>
            <div className="EmployeeProject-skeleton-header">
              <div className="EmployeeProject-skeleton-pill EmployeeProject-skeleton-pill-title" />
              <div className="EmployeeProject-skeleton-pill EmployeeProject-skeleton-pill-badge" />
            </div>
            <div className="EmployeeProject-skeleton-chips">
              <div className="EmployeeProject-skeleton-pill EmployeeProject-skeleton-pill-chip" />
              <div className="EmployeeProject-skeleton-pill EmployeeProject-skeleton-pill-chip" />
              <div className="EmployeeProject-skeleton-pill EmployeeProject-skeleton-pill-chip" />
            </div>
            <div className="EmployeeProject-skeleton-lines">
              <div className="EmployeeProject-skeleton-line" style={{ width: '92%' }} />
              <div className="EmployeeProject-skeleton-line" style={{ width: '68%' }} />
            </div>
            <div className="EmployeeProject-skeleton-footer">
              <div className="EmployeeProject-skeleton-pill EmployeeProject-skeleton-pill-date" />
              <div className="EmployeeProject-skeleton-pill EmployeeProject-skeleton-pill-btn" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="EmployeeProject-container">
      {snackbar.open && (
        <div className="EmployeeProject-snackbar">
          <div
            className={`EmployeeProject-alert EmployeeProject-alert-${snackbar.severity}`}
          >
            <div className="EmployeeProject-alert-content">
              {snackbar.message}
            </div>
            <button
              className="EmployeeProject-alert-close"
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              title="Close notification"
              aria-label="Close notification"
            >
              <Icons.Close />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="EmployeeProject-header">
        <div className="EmployeeProject-header-content">
          <div className="EmployeeProject-header-text">
            <h1 className="EmployeeProject-title">My Projects</h1>
            <p className="EmployeeProject-subtitle">
              Select a project to view its details, team members, and all tasks
            </p>
          </div>
          <div className="EmployeeProject-header-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="EmployeeProject-button EmployeeProject-button-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#334155",
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              onClick={() => handleOpenBulkImport()}
              title="Bulk import tasks from Excel into a project"
            >
              <Icons.UploadCloud /> Import Tasks (Excel)
            </button>
            <button
              type="button"
              className="EmployeeProject-button EmployeeProject-button-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #1877f2 0%, #166fe5 100%)",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(24, 119, 242, 0.25)",
              }}
              onClick={() => handleOpenCreateTask()}
              title="Create a new task in a project"
            >
              <Icons.Add /> Create Task
            </button>
          </div>
        </div>

        {/* Project Overview Stats */}
        <div className="EmployeeProject-stats-grid">
          <div className="EmployeeProject-stat-item">
            <StatCard
              icon={<Icons.Dashboard />}
              value={loading && projects.length === 0 ? "..." : projectStats.total}
              label="Total Projects"
              color="#667eea"
              subtext="Assigned to you"
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />
          </div>
          <div className="EmployeeProject-stat-item">
            <StatCard
              icon={<Icons.Update />}
              value={loading && projects.length === 0 ? "..." : projectStats.active}
              label="Active / In Progress"
              color="#29B6F6"
              subtext="Ongoing projects"
              active={statusFilter === "active"}
              onClick={() =>
                setStatusFilter(statusFilter === "active" ? "all" : "active")
              }
            />
          </div>
          <div className="EmployeeProject-stat-item">
            <StatCard
              icon={<Icons.CheckCircle />}
              value={loading && projects.length === 0 ? "..." : projectStats.completed}
              label="Completed"
              color="#66BB6A"
              subtext="Finished projects"
              active={statusFilter === "completed"}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "completed" ? "all" : "completed"
                )
              }
            />
          </div>
          <div className="EmployeeProject-stat-item">
            <StatCard
              icon={<Icons.PriorityHigh />}
              value={loading && projects.length === 0 ? "..." : projectStats.highPriority}
              label="High Priority"
              color="#EF5350"
              subtext="Urgent projects"
              active={statusFilter === "high priority"}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "high priority" ? "all" : "high priority"
                )
              }
            />
          </div>
        </div>

        {/* Search Row */}
        <div className="EmployeeProject-search-row" style={{ marginTop: "1.5rem" }}>
          <div className="EmployeeProject-search-box">
            <Icons.Search />
            <input
              type="search"
              className="EmployeeProject-search-input"
              value={projectSearchTerm}
              onChange={(e) => setProjectSearchTerm(e.target.value)}
              placeholder="Search by project name or description..."
              aria-label="Search projects by name or title"
            />
            {projectSearchTerm && (
              <button
                type="button"
                className="EmployeeProject-search-clear"
                onClick={() => setProjectSearchTerm("")}
                title="Clear search"
                aria-label="Clear project search"
              >
                <Icons.Close />
              </button>
            )}
          </div>
          <span className="EmployeeProject-search-count">
            {filteredProjects.length} of {projects.length} projects
            {statusFilter !== "all" ? ` (${statusFilter})` : ""}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && projects.length === 0 ? (
        <ProjectLoader />
      ) : projects.length === 0 ? (
        <div className="EmployeeProject-no-projects">
          <div className="EmployeeProject-no-projects-content">
            <div className="EmployeeProject-no-projects-icon">
              <Icons.NoProjects />
            </div>
            <h2 className="EmployeeProject-no-projects-title">
              No Projects Found
            </h2>
            <p className="EmployeeProject-no-projects-message">
              You haven't been assigned to any projects yet.
            </p>
            <p className="EmployeeProject-no-projects-submessage">
              Once you're assigned to a project, it will appear here.
            </p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="EmployeeProject-no-projects">
          <div className="EmployeeProject-no-projects-content">
            <div className="EmployeeProject-no-projects-icon">
              <Icons.Search />
            </div>
            <h2 className="EmployeeProject-no-projects-title">
              No Matching Projects
            </h2>
            <p className="EmployeeProject-no-projects-message">
              No projects match your current filters.
            </p>
            <p className="EmployeeProject-no-projects-submessage">
              Try adjusting your search term or status filter.
            </p>
          </div>
        </div>
      ) : (
        /* Projects Grid - Clicking any card navigates to separate project details/tasks page */
        <div className="EmployeeProject-grid">
          {filteredProjects.map((p) => {
            const effectiveStatus = getEffectiveProjectStatus(p);
            return (
              <div className="EmployeeProject-grid-item" key={p._id}>
                <div
                  className="EmployeeProject-card"
                  onClick={() => handleProjectClick(p)}
                  style={{ cursor: "pointer" }}
                  title="Click to view project details and all tasks"
                >
                  <div className="EmployeeProject-card-highlight" />

                  <div className="EmployeeProject-card-content">
                    <div className="EmployeeProject-card-header">
                      <div className="EmployeeProject-card-title-section">
                        <div className="EmployeeProject-card-title-row">
                          <Icons.Folder />
                          <h3 className="EmployeeProject-card-title">
                            {p.projectName}
                          </h3>
                        </div>
                        <Chip
                          label={effectiveStatus}
                          color={getStatusColor(effectiveStatus)}
                        />
                      </div>
                    </div>

                    <div className="EmployeeProject-chip-container">
                      <Chip
                        label={`Priority: ${p.priority || "Medium"}`}
                        color={getPriorityColor(p.priority)}
                      />
                      <Chip
                        icon={<Icons.Group />}
                        label={`${p.userCount ?? p.users?.length ?? 0} members`}
                        variant="outlined"
                      />
                      <Chip
                        icon={<Icons.Task />}
                        label={`${getProjectTaskTotal(p)} tasks`}
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
                      <div className="EmployeeProject-card-date" title="Project timeline">
                        <Icons.CalendarToday />
                        <span>
                          {p.startDate
                            ? `Start: ${formatProjectDate(p.startDate)}`
                            : "Start: Not set"}
                          {p.endDate ? ` • Due: ${formatProjectDate(p.endDate)}` : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          className="EmployeeProject-button EmployeeProject-button-sm EmployeeProject-button-outline"
                          style={{
                            background: "#ffffff",
                            borderColor: "#cbd5e1",
                            color: "#475569",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight: 600,
                          }}
                          title="Add a task to this project"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreateTask(p);
                          }}
                        >
                          <Icons.Add /> Task
                        </button>
                        <button
                          type="button"
                          className="EmployeeProject-button EmployeeProject-button-sm EmployeeProject-button-primary"
                          title="Open project details and tasks"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectClick(p);
                          }}
                        >
                          View Tasks
                          <Icons.ArrowForward />
                        </button>
                      </div>
                    </div>

                    {(p.pdfFile?.path ||
                      p.pdfFile?.filename ||
                      p.pdfFile?.url) && (
                      <div className="EmployeeProject-card-pdf" title="Project PDF attached">
                        <div className="EmployeeProject-pdf-info">
                          <Icons.PictureAsPdf />
                          <span className="EmployeeProject-pdf-text">
                            Document attached
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Bulk Import Modal (Locked to existing projects only) */}
      <ProjectBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => {
          setIsBulkImportOpen(false);
          setSelectedProjectForTask(null);
        }}
        onSuccess={(data) => {
          setSnackbar({
            open: true,
            message: data.message || "Tasks imported successfully!",
            severity: "success",
          });
          loadProjects();
        }}
        allowedModes={["existing"]}
        currentProjectId={selectedProjectForTask?._id || selectedProjectForTask?.id || null}
        currentProjectName={selectedProjectForTask?.projectName || ""}
        projectsList={projects}
      />

      {/* Single Task Creation Modal */}
      {isCreateTaskOpen && (
        <div className="EmployeeProject-modal">
          <div
            className="EmployeeProject-modal-backdrop"
            onClick={() => !isSubmittingTask && setIsCreateTaskOpen(false)}
          />
          <div className="EmployeeProject-modal-content EmployeeProject-modal-md EmployeeProject-create-task-modal">
            <div className="EmployeeProject-modal-header EmployeeProject-modal-header-primary">
              <div className="EmployeeProject-create-task-heading">
                <span className="EmployeeProject-create-task-heading-icon">+</span>
                <div>
                  <h3 style={{ margin: 0, color: "#ffffff" }}>Create New Task</h3>
                  <p style={{ margin: "4px 0 0", color: "rgba(255, 255, 255, 0.85)", fontSize: "12px" }}>
                    Add task details and assign to project team members
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="EmployeeProject-modal-close"
                onClick={() => !isSubmittingTask && setIsCreateTaskOpen(false)}
                aria-label="Close task dialog"
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="EmployeeProject-create-task-form">
              <div className="EmployeeProject-modal-body">
                {/* Target Project Dropdown */}
                <div className="EmployeeProject-form-group">
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "13px", color: "#1e293b" }}>
                    Project <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    className="EmployeeProject-select"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    value={targetProjectId}
                    onChange={(e) => {
                      setTargetProjectId(e.target.value);
                      setTaskErrors((prev) => ({ ...prev, project: undefined }));
                    }}
                    disabled={isSubmittingTask}
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.projectName || "Unnamed Project"}
                      </option>
                    ))}
                  </select>
                  {taskErrors.project && (
                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      {taskErrors.project}
                    </span>
                  )}
                </div>

                {/* Task Title */}
                <div className="EmployeeProject-form-group" style={{ marginTop: "14px" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "13px", color: "#1e293b" }}>
                    Task Title <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="EmployeeProject-input"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    value={taskForm.title}
                    placeholder="Enter task title..."
                    onChange={(e) => {
                      setTaskForm({ ...taskForm, title: e.target.value });
                      setTaskErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    disabled={isSubmittingTask}
                  />
                  {taskErrors.title && (
                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      {taskErrors.title}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="EmployeeProject-form-group" style={{ marginTop: "14px" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "13px", color: "#1e293b" }}>
                    Description
                  </label>
                  <textarea
                    className="EmployeeProject-textarea"
                    rows="3"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    value={taskForm.description}
                    placeholder="Enter task description..."
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    disabled={isSubmittingTask}
                  />
                </div>

                {/* Priority & Due Date in 2 columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
                  <div className="EmployeeProject-form-group">
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "13px", color: "#1e293b" }}>
                      Priority
                    </label>
                    <select
                      className="EmployeeProject-select"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      disabled={isSubmittingTask}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="EmployeeProject-form-group">
                    <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "13px", color: "#1e293b" }}>
                      Due Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      className="EmployeeProject-input"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      disabled={isSubmittingTask}
                    />
                  </div>
                </div>

                {/* Assign to Users */}
                <div className="EmployeeProject-form-group" style={{ marginTop: "14px" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "13px", color: "#1e293b" }}>
                    Assign To
                  </label>
                  <div
                    style={{
                      maxHeight: "160px",
                      overflowY: "auto",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "8px",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "8px",
                      background: "#f8fafc",
                    }}
                  >
                    {assignableUsers.map((u) => {
                      const uId = u._id || u.id;
                      const isSelected = taskForm.assignedUsers.includes(uId);
                      return (
                        <label
                          key={uId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: isSelected ? "#eff6ff" : "#ffffff",
                            border: `1px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`,
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setTaskForm((prev) => {
                                const exists = prev.assignedUsers.includes(uId);
                                return {
                                  ...prev,
                                  assignedUsers: exists
                                    ? prev.assignedUsers.filter((id) => id !== uId)
                                    : [...prev.assignedUsers, uId],
                                };
                              });
                            }}
                          />
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "#e0e7ff",
                              color: "#4338ca",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 700,
                              fontSize: "11px",
                              flexShrink: 0,
                            }}
                          >
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <strong>{u.name || "User"}</strong>
                          </span>
                        </label>
                      );
                    })}
                    {assignableUsers.length === 0 && (
                      <p style={{ margin: 0, padding: "10px", color: "#94a3b8", fontSize: "12px" }}>
                        No members available
                      </p>
                    )}
                  </div>
                </div>

                {/* Optional Attachment */}
                <div className="EmployeeProject-form-group" style={{ marginTop: "14px" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "13px", color: "#1e293b" }}>
                    Attachment (PDF / Document)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setTaskFile(e.target.files[0] || null)}
                    style={{ fontSize: "12px" }}
                    disabled={isSubmittingTask}
                  />
                  {taskFile && (
                    <span style={{ fontSize: "11px", color: "#059669", display: "block", marginTop: "4px" }}>
                      Selected: {taskFile.name} ({(taskFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              </div>

              <div className="EmployeeProject-modal-footer">
                <button
                  type="button"
                  className="EmployeeProject-button EmployeeProject-button-outline"
                  onClick={() => setIsCreateTaskOpen(false)}
                  disabled={isSubmittingTask}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="EmployeeProject-button EmployeeProject-button-primary"
                  disabled={isSubmittingTask}
                >
                  {isSubmittingTask ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProject;
