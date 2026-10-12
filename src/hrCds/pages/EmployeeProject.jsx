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
  FiTrendingUp
} from "react-icons/fi";
import axios from "../../utils/axiosConfig";
import "../Css/EmployeeProject.css";

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

<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> 21ce2fb5cc3d542f30df012bf0f1ce710a7c4b70
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
};

<<<<<<< HEAD
>>>>>>> 566a03a8892a30f54712bf026add027f52dff73c
=======
>>>>>>> 21ce2fb5cc3d542f30df012bf0f1ce710a7c4b70
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

  useEffect(() => {
    loadProjects();
  }, []);

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

<<<<<<< HEAD
<<<<<<< HEAD
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
                      <span>
                        {p.startDate
                          ? new Date(p.startDate).toLocaleDateString()
                          : "No date"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="EmployeeProject-button EmployeeProject-button-sm EmployeeProject-button-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(p);
                      }}
                    >
                      View Tasks
                      <Icons.ArrowForward />
                    </button>
                  </div>

                  {(p.pdfFile?.path ||
                    p.pdfFile?.filename ||
                    p.pdfFile?.url) && (
                    <div className="EmployeeProject-card-pdf">
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
          ))}
=======
=======
>>>>>>> 21ce2fb5cc3d542f30df012bf0f1ce710a7c4b70
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
<<<<<<< HEAD
>>>>>>> 566a03a8892a30f54712bf026add027f52dff73c
=======
>>>>>>> 21ce2fb5cc3d542f30df012bf0f1ce710a7c4b70
        </div>
      )}
    </div>
  );
};

export default EmployeeProject;
