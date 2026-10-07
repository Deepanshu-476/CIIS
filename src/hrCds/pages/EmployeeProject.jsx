import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

const Icons = {
  Folder: () => <span className="EmployeeProject-icon">📁</span>,
  CalendarToday: () => <span className="EmployeeProject-icon">📅</span>,
  ArrowForward: () => <span className="EmployeeProject-icon">→</span>,
  Group: () => <span className="EmployeeProject-icon">👥</span>,
  Task: () => <span className="EmployeeProject-icon">✅</span>,
  PictureAsPdf: () => <span className="EmployeeProject-icon">📄</span>,
  Search: () => <span className="EmployeeProject-icon">🔍</span>,
  Close: () => <span className="EmployeeProject-icon">✕</span>,
  NoProjects: () => <span className="EmployeeProject-icon">📭</span>,
  Dashboard: () => <span className="EmployeeProject-icon">📊</span>,
  CheckCircle: () => <span className="EmployeeProject-icon">✅</span>,
  PriorityHigh: () => <span className="EmployeeProject-icon">⚠️</span>,
  Update: () => <span className="EmployeeProject-icon">🔄</span>,
  TrendingUp: () => <span className="EmployeeProject-icon">📈</span>,
};

const EmployeeProject = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
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
      const s = String(p.status || "").toLowerCase();
      return ["active", "in progress", "ongoing"].includes(s);
    }).length;
    const completed = projects.filter((p) => {
      const s = String(p.status || "").toLowerCase();
      return ["completed", "done", "finished"].includes(s);
    }).length;
    const highPriority = projects.filter(
      (p) => String(p.priority || "").toLowerCase() === "high"
    ).length;
    const totalTasks = projects.reduce(
      (acc, p) => acc + (p.taskCount ?? p.tasks?.length ?? 0),
      0
    );

    return { total, active, completed, highPriority, totalTasks };
  }, [projects]);

  // Filtering projects
  const filteredProjects = useMemo(() => {
    let result = projects;

    if (statusFilter !== "all") {
      result = result.filter((p) => {
        const s = String(p.status || "").toLowerCase();
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
          project.status,
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
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
      </div>
    </button>
  );

  const CircularProgress = () => (
    <div className="EmployeeProject-circular-progress">
      <svg className="EmployeeProject-circular-progress-svg" viewBox="22 22 44 44">
        <circle
          className="EmployeeProject-circular-progress-circle"
          cx="44"
          cy="44"
          r="20.2"
          fill="none"
          strokeWidth={3.6}
        />
      </svg>
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
              value={projectStats.total}
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
              value={projectStats.active}
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
              value={projectStats.completed}
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
              value={projectStats.highPriority}
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
        <div className="EmployeeProject-loading" aria-label="Loading projects">
          <CircularProgress />
          <span>Loading projects...</span>
        </div>
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
          {filteredProjects.map((p) => (
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
                        label={p.status || "Active"}
                        color={getStatusColor(p.status)}
                      />
                    </div>
                  </div>

                  <div className="EmployeeProject-chip-container">
                    <Chip
                      label={p.priority || "Medium"}
                      color={getPriorityColor(p.priority)}
                    />
                    <Chip
                      icon={<Icons.Group />}
                      label={`${p.userCount ?? p.users?.length ?? 0} members`}
                      variant="outlined"
                    />
                    <Chip
                      icon={<Icons.Task />}
                      label={`${p.taskCount ?? p.tasks?.length ?? 0} tasks`}
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
        </div>
      )}
    </div>
  );
};

export default EmployeeProject;
