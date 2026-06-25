// AdminProject.jsx
import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import "../Css/AdminProject.css";
import CIISLoader from "../../Loader/CIISLoader"; // Import CIISLoader

// Icons
const Icons = {
  Add: () => <span>+</span>,
  Upload: () => <span>📤</span>,
  Schedule: () => <span>📅</span>,
  Person: () => <span>👤</span>,
  Description: () => <span>📝</span>,
  Delete: () => <span>🗑️</span>,
  Edit: () => <span>✏️</span>,
  AttachFile: () => <span>📎</span>,
  CheckCircle: () => <span>✅</span>,
  Pause: () => <span>⏸️</span>,
  Download: () => <span>⬇️</span>,
  Visibility: () => <span>👁️</span>,
  Pdf: () => <span>📄</span>,
  File: () => <span>📁</span>,
  Close: () => <span>✕</span>,
  Task: () => <span>✓</span>,
  Dashboard: () => <span>📊</span>,
  TrendingUp: () => <span>📈</span>,
  ArrowUpward: () => <span>↑</span>,
  ArrowDownward: () => <span>↓</span>,
  MoreVert: () => <span>⋮</span>,
  Filter: () => <span>🔍</span>,
  Search: () => <span>🔍</span>,
  Sort: () => <span>⇅</span>,
  Calendar: () => <span>📅</span>,
  Group: () => <span>👥</span>,
  Bolt: () => <span>⚡</span>,
  Timeline: () => <span>📈</span>,
  BarChart: () => <span>📊</span>,
  Folder: () => <span>📁</span>,
  CloudDownload: () => <span>⬇️</span>,
  PlayArrow: () => <span>▶️</span>,
  Stop: () => <span>⏹️</span>,
  Flag: () => <span>🚩</span>,
  DateRange: () => <span>📅</span>,
  DescriptionOutlined: () => <span>📝</span>,
  AdminPanelSettings: () => <span>⚙️</span>,
  RocketLaunch: () => <span>🚀</span>,
  CloudUpload: () => <span>📤</span>,
};

const getUserId = (user) => user?._id || user?.id;
const getProjectId = (p) => p?._id || p?.id;

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

  return {
    companyCode: String(
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
    ).trim(),
    companyIdentifier: String(
      user.companyId
      || userCompany._id
      || userCompany.id
      || companyDetails._id
      || companyDetails.id
      || storedCompany._id
      || storedCompany.id
      || localStorage.getItem("companyIdentifier")
      || ""
    ).trim()
  };
};

const getProjectCompanyCode = (project) => String(
  project?.companyCode
  || project?.company?.companyCode
  || project?.company?.code
  || project?.companyId?.companyCode
  || project?.companyDetails?.companyCode
  || ""
).trim();

const getProjectsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.message?.projects)) return data.message.projects;
  return [];
};

const getProjectFromResponse = (data) => data?.project || data?.data || data?.item || null;

const toProjectPriorityValue = (value = "Medium") => {
  const normalized = value.toString().trim().toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "high") return "High";
  return "Medium";
};


const toProjectStatusValue = (value = "Active") => {
  const normalized = value.toString().trim().toLowerCase().replace(/[_\s]+/g, " ");
  if (normalized === "on hold" || normalized === "onhold") return "On Hold";
  if (normalized === "completed") return "Completed";
  if (normalized === "planning") return "Planning";
  if (normalized === "cancelled") return "Cancelled";
  return "Active";
};

export const AdminProject = () => {
  // FORM STATES
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Active");
  const [members, setMembers] = useState([]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  // DATA STATES
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // UI STATES
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Add page loading state
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, onHold: 0, highPriority: 0 });

  // DROPDOWN STATES
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  // Add timeout state
  const [requestTimeout, setRequestTimeout] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      setPageLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchProjects()]);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setPageLoading(false);
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    const active = projects.filter(p => p.status?.toLowerCase() === "active").length;
    const completed = projects.filter(p => p.status?.toLowerCase() === "completed").length;
    const onHold = projects.filter(p => p.status?.toLowerCase() === "on hold" || p.status?.toLowerCase() === "onhold").length;
    const highPriority = projects.filter(p => p.priority?.toLowerCase() === "high").length;
    setStats({ total: projects.length, active, completed, onHold, highPriority });
  }, [projects]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.ap-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (requestTimeout) {
        clearTimeout(requestTimeout);
      }
    };
  }, [requestTimeout]);

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase() || "").includes(memberSearchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(memberSearchTerm.toLowerCase())
  );

  const handleMemberToggle = (userId) => {
    if (members.includes(userId)) {
      setMembers(members.filter(id => id !== userId));
    } else {
      setMembers([...members, userId]);
    }
  };

  const handleMemberRemove = (userId) => {
    setMembers(members.filter(id => id !== userId));
  };

  const getSelectedUsers = () => users.filter(u => members.includes(getUserId(u)));

  const upsertProject = (project) => {
    const updatedProjectId = getProjectId(project);
    if (!updatedProjectId) return;

    setProjects((currentProjects) => {
      const projectExists = currentProjects.some((item) => getProjectId(item) === updatedProjectId);
      if (!projectExists) return [project, ...currentProjects];

      return currentProjects.map((item) => (
        getProjectId(item) === updatedProjectId ? project : item
      ));
    });
  };

  const fetchUsers = async () => {
    try {
      const { companyCode, companyIdentifier } = getCompanyContext();
      if (!companyCode) {
        setUsers([]);
        return;
      }

      // Add timeout to axios request
      const res = await axios.get("/users/company-users", {
        params: { companyCode, companyIdentifier: companyIdentifier || undefined },
        timeout: 10000 // 10 seconds timeout
      });
      
      if (res.data?.success && res.data.message?.users) setUsers(res.data.message.users);
      else if (Array.isArray(res.data)) setUsers(res.data);
      else if (res.data?.data) setUsers(res.data.data);
      else if (res.data?.users) setUsers(res.data.users);
      else setUsers([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      
      if (error.code === 'ECONNABORTED') {
        showSnackbar("❌ Request timeout - please try again", "error");
      } else if (error.response?.status === 504) {
        showSnackbar("❌ Server timeout - please try again later", "error");
      } else {
        showSnackbar("❌ Error loading users", "error");
      }
      
      setUsers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const { companyCode, companyIdentifier } = getCompanyContext();
      if (!companyCode) {
        setProjects([]);
        showSnackbar("Company code not found. Please login again from your company URL.", "error");
        return;
      }

      // Add timeout to axios request
      const res = await axios.get("/projects", {
        params: { companyCode, companyIdentifier: companyIdentifier || undefined },
        timeout: 10000 // 10 seconds timeout
      });

      const normalizedCompanyCode = companyCode.toLowerCase();
      const companyProjects = getProjectsFromResponse(res.data).filter(project => {
        const projectCompanyCode = getProjectCompanyCode(project);
        return !projectCompanyCode || projectCompanyCode.toLowerCase() === normalizedCompanyCode;
      });
      setProjects(companyProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      
      if (error.code === 'ECONNABORTED') {
        showSnackbar("❌ Request timeout - please try again", "error");
      } else if (error.response?.status === 504) {
        showSnackbar("❌ Server timeout - please try again later", "error");
      } else {
        showSnackbar("❌ Error loading projects", "error");
      }
      
      setProjects([]);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (project.projectName || "").toLowerCase().includes(searchLower) ||
      (project.description || "").toLowerCase().includes(searchLower) ||
      (project.status || "").toLowerCase().includes(searchLower) ||
      (project.priority || "").toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest": return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case "oldest": return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[(b.priority || "").toLowerCase()] || 0) - (priorityOrder[(a.priority || "").toLowerCase()] || 0);
      case "name": return (a.projectName || "").localeCompare(b.projectName || "");
      default: return 0;
    }
  });

  const validateForm = () => {
    const newErrors = {};
    if (!projectName.trim()) newErrors.projectName = "Project name required";
    if (!description.trim()) newErrors.description = "Description required";
    if (!startDate) newErrors.startDate = "Start date required";
    else if (!projectId && startDate < new Date().toISOString().split('T')[0]) newErrors.startDate = "Start date cannot be in the past";
    if (!endDate) newErrors.endDate = "End date required";
    else if (startDate && endDate < startDate) newErrors.endDate = "End date must be after start date";
    if (members.length === 0) newErrors.members = "Select at least one member";
    
    // File validation
    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
      newErrors.file = "File size must be less than 10MB";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const { companyCode, companyIdentifier } = getCompanyContext();
    if (!companyCode) {
      showSnackbar("Company code not found. Please login again from your company URL.", "error");
      return;
    }
    
    setLoading(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      showSnackbar("❌ Request timeout - please try again", "error");
    }, 30000); // 30 seconds timeout
    
    setRequestTimeout(timeoutId);

    const formData = new FormData();
    formData.append("projectName", projectName);
    formData.append("description", description);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("priority", priority);
    formData.append("status", status);
    formData.append("users", JSON.stringify(members));
    formData.append("companyCode", companyCode);
    if (companyIdentifier) {
      formData.append("companyIdentifier", companyIdentifier);
      formData.append("companyId", companyIdentifier);
    }
    
    if (file) {
      formData.append("pdfFile", file);
    }

    try {
      let response;
      
      // Configure axios with longer timeout for file uploads
      const config = {
        headers: { 
          "Content-Type": "multipart/form-data"
        },
        params: { companyCode, companyIdentifier: companyIdentifier || undefined },
        timeout: 60000, // 60 seconds timeout for file uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      };

      if (projectId) {
        response = await axios.put(`/projects/${projectId}`, formData, config);
      } else {
        response = await axios.post("/projects", formData, config);
      }

      // Clear the timeout since request completed
      clearTimeout(timeoutId);
      setRequestTimeout(null);

      // Check for successful response
      if (response.status === 200 || response.status === 201) {
        showSnackbar(projectId ? "Project updated successfully!" : "Project created successfully!", "success");
        upsertProject(getProjectFromResponse(response.data));
        resetForm();
        await fetchProjects(); // Refresh the project list
      } else {
        showSnackbar(response.data?.message || "Operation failed", "error");
      }
    } catch (err) {
      // Clear the timeout
      clearTimeout(timeoutId);
      setRequestTimeout(null);
      
      console.error("Error saving project:", err);
      
      // Handle different error types
      if (err.code === 'ECONNABORTED') {
        showSnackbar("❌ Request timeout - server is taking too long to respond", "error");
      } else if (err.response?.status === 504) {
        showSnackbar("❌ Gateway timeout - server is not responding", "error");
      } else if (err.response?.status === 413) {
        showSnackbar("❌ File too large - maximum size is 10MB", "error");
      } else if (err.response?.status === 500) {
        showSnackbar("❌ Server error - please try again later", "error");
      } else {
        showSnackbar(err.response?.data?.message || "Something went wrong", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id, projectName) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"?`)) return;

    const { companyCode, companyIdentifier } = getCompanyContext();
    if (!companyCode) {
      showSnackbar("Company code not found. Please login again from your company URL.", "error");
      return;
    }
    
    try {
      const response = await axios.delete(`/projects/${id}`, {
        params: { companyCode, companyIdentifier: companyIdentifier || undefined },
        timeout: 10000
      });
      
      if (response.status === 200 || response.status === 204) {
        showSnackbar("Project deleted successfully!", "success");
        await fetchProjects();
      } else {
        showSnackbar(response.data?.message || "Failed to delete project", "error");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      
      if (error.code === 'ECONNABORTED') {
        showSnackbar("❌ Request timeout - please try again", "error");
      } else {
        showSnackbar("Error deleting project", "error");
      }
    }
  };

  const editProject = (p) => {
    const projectId = getProjectId(p);
    setProjectId(projectId);
    setProjectName(p.projectName || "");
    setDescription(p.description || "");
    setStartDate(p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : "");
    setEndDate(p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : "");
    setPriority(toProjectPriorityValue(p.priority));
    setStatus(toProjectStatusValue(p.status));
    const userIDs = (p.users || []).map(u => getUserId(u)).filter(Boolean);
    setMembers(userIDs);
    setFile(null);
    setFileName("");
    
    // Scroll to form
    document.getElementById('ap-project-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const viewProjectDetails = (project) => {
    setSelectedProject(project);
    setTabValue(0);
    setOpenDetailsDialog(true);
  };

  const viewPdf = (pdfPath, filename) => {
    if (!pdfPath) {
      showSnackbar("No PDF file available", "warning");
      return;
    }
    
    // Handle different PDF path formats
    let pdfUrl;
    if (pdfPath.startsWith('http')) {
      pdfUrl = pdfPath;
    } else {
      const pathParts = pdfPath.split('/');
      const pdfFilename = pathParts[pathParts.length - 1];
      pdfUrl = `${axios.defaults.baseURL}/uploads/projects/${pdfFilename}`;
    }
    
    setSelectedPdfUrl(pdfUrl);
    setOpenPdfDialog(true);
  };

  const downloadPdf = (pdfPath, filename) => {
    if (!pdfPath) {
      showSnackbar("No PDF file available", "warning");
      return;
    }

    // Handle different PDF path formats
    let pdfUrl;
    if (pdfPath.startsWith('http')) {
      pdfUrl = pdfPath;
    } else {
      const pathParts = pdfPath.split('/');
      const pdfFilename = pathParts[pathParts.length - 1];
      pdfUrl = `${axios.defaults.baseURL}/uploads/projects/${pdfFilename}`;
    }

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setProjectId(null);
    setProjectName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setPriority("Medium");
    setStatus("Active");
    setMembers([]);
    setFile(null);
    setFileName("");
    setErrors({});
    setIsDropdownOpen(false);
    setMemberSearchTerm("");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
      if (selectedFile.type !== "application/pdf") {
        showSnackbar("Only PDF files are allowed", "error");
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        showSnackbar("File size must be less than 10MB", "error");
        e.target.value = ''; // Clear the input
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 4000);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status) => {
    if (!status) return "#9E9E9E";
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "active": return "#10b981";
      case "completed": return "#3b82f6";
      case "on hold": case "onhold": return "#f59e0b";
      case "planning": return "#8b5cf6";
      case "cancelled": return "#ef4444";
      default: return "#9E9E9E";
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return "#9E9E9E";
    const priorityLower = priority.toLowerCase();
    switch (priorityLower) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#9E9E9E";
    }
  };

  const getTaskProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  };

  const StatCard = ({ icon, value, label, color, trend, subtext }) => (
    <div className="ap-stat-card">
      <div className="ap-stat-content">
        <div className="ap-stat-content-inner">
          <div>
            <div className="ap-stat-value" style={{ color }}>{value}</div>
            <div className="ap-stat-label">{label}</div>
            {subtext && <div className="ap-stat-subtext">{subtext}</div>}
          </div>
          <div className="ap-stat-icon-container" style={{ background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`, color }}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="ap-stat-trend">
            {trend > 0 ? <Icons.ArrowUpward /> : <Icons.ArrowDownward />}
            <span>{trend > 0 ? `+${trend}%` : `${trend}%`}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="ap">
      {/* Snackbar */}
      {snackbar.open && (
        <div className={`ap-snackbar ap-snackbar-${snackbar.severity}`}>
          <div className="ap-snackbar-content">
            <div className="ap-snackbar-message">{snackbar.message}</div>
            <button className="ap-snackbar-close" onClick={handleCloseSnackbar}>
              <Icons.Close />
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="ap-loading-overlay">
          <div className="ap-loading-spinner"></div>
          <div className="ap-loading-text">Saving project...</div>
        </div>
      )}

      {/* PDF Dialog */}
      {openPdfDialog && (
        <div className="ap-dialog-backdrop">
          <div className="ap-dialog ap-dialog-lg">
            <div className="ap-dialog-header">
              <div className="ap-dialog-title">
                <Icons.Pdf /> PDF Document
              </div>
              <button className="ap-dialog-close" onClick={() => setOpenPdfDialog(false)}>
                <Icons.Close />
              </button>
            </div>
            <div className="ap-dialog-content ap-dialog-content-no-padding">
              <iframe
                src={selectedPdfUrl}
                title="PDF Viewer"
                className="ap-pdf-viewer"
              />
            </div>
            <div className="ap-dialog-footer">
              <button
                className="ap-btn ap-btn-primary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedPdfUrl;
                  link.download = selectedPdfUrl.split('/').pop();
                  link.click();
                }}
              >
                <Icons.Download /> Download
              </button>
              <button
                className="ap-btn ap-btn-outline"
                onClick={() => setOpenPdfDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      {openDetailsDialog && selectedProject && (
        <div className="ap-dialog-backdrop">
          <div className="ap-dialog ap-dialog-lg">
            <div className="ap-dialog-header">
              <div className="ap-dialog-title">Project Details</div>
              <button className="ap-dialog-close" onClick={() => setOpenDetailsDialog(false)}>
                <Icons.Close />
              </button>
            </div>
            <div className="ap-dialog-content">
              <div className="ap-tabs">
                <button 
                  className={`ap-tab ${tabValue === 0 ? "ap-tab-active" : ""}`}
                  onClick={() => setTabValue(0)}
                >
                  <Icons.Dashboard /> Overview
                </button>
                <button 
                  className={`ap-tab ${tabValue === 1 ? "ap-tab-active" : ""}`}
                  onClick={() => setTabValue(1)}
                >
                  <Icons.Task /> Tasks
                </button>
                <button 
                  className={`ap-tab ${tabValue === 2 ? "ap-tab-active" : ""}`}
                  onClick={() => setTabValue(2)}
                >
                  <Icons.File /> Documents
                </button>
              </div>
              
              {tabValue === 0 && (
                <div className="ap-tab-panel">
                  <h3 className="ap-project-detail-title">{selectedProject.projectName || "Unnamed Project"}</h3>
                  <p className="ap-project-detail-description">{selectedProject.description || "No description available"}</p>
                  
                  <div className="ap-grid-2">
                    <div className="ap-card">
                      <h4 className="ap-card-title"><Icons.Description /> Project Details</h4>
                      <div className="ap-detail-list">
                        <div className="ap-detail-item">
                          <span>Status</span>
                          <span className="ap-detail-value">{selectedProject.status || "Not set"}</span>
                        </div>
                        <div className="ap-detail-item">
                          <span>Priority</span>
                          <span className="ap-detail-value">{selectedProject.priority || "Not set"}</span>
                        </div>
                        <div className="ap-detail-item">
                          <span>Start Date</span>
                          <span className="ap-detail-value">{selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : "Not set"}</span>
                        </div>
                        <div className="ap-detail-item">
                          <span>End Date</span>
                          <span className="ap-detail-value">{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : "Not set"}</span>
                        </div>
                        <div className="ap-detail-item">
                          <span>Created On</span>
                          <span className="ap-detail-value">{selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : "Not set"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ap-card">
                      <h4 className="ap-card-title"><Icons.Timeline /> Progress</h4>
                      <div className="ap-progress-block">
                        <div className="ap-progress-header">
                          <span>Task Completion</span>
                          <span className="ap-progress-percentage">{getTaskProgress(selectedProject.tasks)}%</span>
                        </div>
                        <div className="ap-progress-bar">
                          <div className="ap-progress-fill" style={{ width: `${getTaskProgress(selectedProject.tasks)}%` }} />
                        </div>
                      </div>
                      <div className="ap-task-stats">
                        <div className="ap-task-stat">
                          <span>Total Tasks</span>
                          <span className="ap-task-stat-value">{selectedProject.tasks?.length || 0}</span>
                        </div>
                        <div className="ap-task-stat">
                          <span>Completed</span>
                          <span className="ap-task-stat-value ap-text-success">{selectedProject.tasks?.filter(t => t.status === "completed").length || 0}</span>
                        </div>
                        <div className="ap-task-stat">
                          <span>In Progress</span>
                          <span className="ap-task-stat-value ap-text-info">{selectedProject.tasks?.filter(t => t.status === "in progress").length || 0}</span>
                        </div>
                        <div className="ap-task-stat">
                          <span>Pending</span>
                          <span className="ap-task-stat-value ap-text-warning">{selectedProject.tasks?.filter(t => t.status === "pending").length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ap-card">
                    <h4 className="ap-card-title"><Icons.Group /> Team Members ({selectedProject.users?.length || 0})</h4>
                    <div className="ap-team-grid">
                      {(selectedProject.users || []).map((user) => (
                        <div key={getUserId(user)} className="ap-team-member">
                          <div className="ap-avatar">{user.name?.charAt(0) || "U"}</div>
                          <div className="ap-member-info">
                            <div className="ap-member-name">{user.name || "Unknown User"}</div>
                            <div className="ap-member-email">{user.email || "No email"}</div>
                            {user.role && <span className="ap-member-role">{user.role}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tabValue === 1 && (
                <div className="ap-tab-panel">
                  <h4 className="ap-section-title">Tasks ({selectedProject.tasks?.length || 0})</h4>
                  {selectedProject.tasks?.length > 0 ? (
                    <div className="ap-task-list">
                      {selectedProject.tasks.map((task) => (
                        <div key={task._id || task.id} className="ap-task-item">
                          <div className="ap-task-header">
                            <div className="ap-task-title-wrapper">
                              <Icons.Task />
                              <span className="ap-task-title">{task.title || "Untitled Task"}</span>
                            </div>
                            <div className="ap-task-badges">
                              <span className="ap-badge ap-badge-status" style={{ backgroundColor: getStatusColor(task.status) + '20', color: getStatusColor(task.status) }}>
                                {task.status || "Not set"}
                              </span>
                              <span className="ap-badge ap-badge-priority" style={{ backgroundColor: getPriorityColor(task.priority) + '20', color: getPriorityColor(task.priority) }}>
                                {task.priority || "Not set"}
                              </span>
                            </div>
                          </div>
                          {task.description && <p className="ap-task-description">{task.description}</p>}
                          <div className="ap-task-footer">
                            <div className="ap-task-meta">
                              <span><Icons.Person /> {task.assignedTo?.name || "Unassigned"}</span>
                              {task.dueDate && <span><Icons.Calendar /> Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                            </div>
                            {task.pdfFile?.path && (
                              <button className="ap-icon-btn" onClick={() => viewPdf(task.pdfFile.path, task.pdfFile.filename)}>
                                <Icons.Visibility />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ap-empty-state ap-empty-state-small">
                      <Icons.Task className="ap-empty-icon" />
                      <p>No tasks available</p>
                    </div>
                  )}
                </div>
              )}

              {tabValue === 2 && (
                <div className="ap-tab-panel">
                  <h4 className="ap-section-title">Project Documents</h4>
                  
                  {selectedProject.pdfFile?.path ? (
                    <div className="ap-document-card">
                      <div className="ap-document-icon"><Icons.Pdf /></div>
                      <div className="ap-document-info">
                        <div className="ap-document-name">{selectedProject.pdfFile.filename || "Project Document"}</div>
                        <div className="ap-document-meta">Uploaded on: {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : "Unknown"}</div>
                      </div>
                      <div className="ap-document-actions">
                        <button className="ap-icon-btn" onClick={() => viewPdf(selectedProject.pdfFile.path, selectedProject.pdfFile.filename)}>
                          <Icons.Visibility />
                        </button>
                        <button className="ap-icon-btn ap-icon-btn-success" onClick={() => downloadPdf(selectedProject.pdfFile.path, selectedProject.pdfFile.filename)}>
                          <Icons.Download />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ap-alert ap-alert-info">No project document uploaded</div>
                  )}

                  <h4 className="ap-section-title ap-section-title-small">Task Documents ({selectedProject.tasks?.filter(t => t.pdfFile?.path).length || 0})</h4>
                  {selectedProject.tasks?.filter(t => t.pdfFile?.path).length > 0 ? (
                    <div className="ap-document-list">
                      {selectedProject.tasks
                        .filter(task => task.pdfFile?.path)
                        .map((task) => (
                          <div key={task._id || task.id} className="ap-document-item">
                            <div className="ap-document-icon"><Icons.File /></div>
                            <div className="ap-document-info">
                              <div className="ap-document-name">{task.pdfFile.filename || "Task Document"}</div>
                              <div className="ap-document-meta">From: {task.title || "Untitled"} • Assigned to: {task.assignedTo?.name || "Unassigned"}</div>
                            </div>
                            <div className="ap-document-actions">
                              <button className="ap-icon-btn" onClick={() => viewPdf(task.pdfFile.path, task.pdfFile.filename)}>
                                <Icons.Visibility />
                              </button>
                              <button className="ap-icon-btn ap-icon-btn-success" onClick={() => downloadPdf(task.pdfFile.path, task.pdfFile.filename)}>
                                <Icons.Download />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="ap-alert ap-alert-info">No task documents available</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="ap-container">
        {/* Header */}
        <div className="ap-header">
          <div className="ap-header-content">
            <div>
              <h1 className="ap-header-title">Project Management</h1>
              <p className="ap-header-subtitle">Admin dashboard for managing all projects</p>
            </div>
            {/* <div className="ap-admin-badge">
              <Icons.AdminPanelSettings />
            </div> */}
          </div>

          {/* Stats Cards */}
          <div className="ap-stats-grid">
            <StatCard icon={<Icons.Folder />} value={stats.total} label="Total Projects" color="#667eea" subtext="All projects" />
            <StatCard icon={<Icons.PlayArrow />} value={stats.active} label="Active" color="#10b981" />
            <StatCard icon={<Icons.CheckCircle />} value={stats.completed} label="Completed" color="#3b82f6" />
            <StatCard icon={<Icons.Flag />} value={stats.highPriority} label="High Priority" color="#ef4444" subtext="Urgent" />
          </div>
        </div>

        {/* CREATE / EDIT PROJECT FORM */}
        <div id="ap-project-form" className="ap-form-card">
          <div className="ap-form-header">
            <div className="ap-form-header-content">
              <div>
                <h2 className="ap-form-title">{projectId ? "Edit Project" : "Create New Project"}</h2>
                <p className="ap-form-subtitle">{projectId ? "Update project details below" : "Fill in the details to create a new project"}</p>
              </div>
              {projectId && (
                <button className="ap-btn ap-btn-outline ap-btn-light" onClick={resetForm} disabled={loading}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className="ap-form-content">
            <div className="ap-form-stack">
              {/* PROJECT NAME */}
              <div className="ap-form-group">
                <label className="ap-form-label ap-required">Project Name</label>
                <input
                  type="text"
                  className={`ap-input ${errors.projectName ? "ap-input-error" : ""}`}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  disabled={loading}
                />
                {errors.projectName && <div className="ap-error-text">{errors.projectName}</div>}
              </div>

              {/* DESCRIPTION */}
              <div className="ap-form-group">
                <label className="ap-form-label ap-required">Description</label>
                <textarea
                  className={`ap-textarea ${errors.description ? "ap-input-error" : ""}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={3}
                  disabled={loading}
                />
                {errors.description && <div className="ap-error-text">{errors.description}</div>}
              </div>

              {/* DATES */}
              <div className="ap-form-row">
                <div className="ap-form-group">
                  <label className="ap-form-label ap-required">Start Date</label>
                  <input
                    type="date"
                    className={`ap-input ${errors.startDate ? "ap-input-error" : ""}`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                  />
                  {errors.startDate && <div className="ap-error-text">{errors.startDate}</div>}
                </div>
                <div className="ap-form-group">
                  <label className="ap-form-label ap-required">End Date</label>
                  <input
                    type="date"
                    className={`ap-input ${errors.endDate ? "ap-input-error" : ""}`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                  />
                  {errors.endDate && <div className="ap-error-text">{errors.endDate}</div>}
                </div>
              </div>

              {/* PRIORITY & STATUS */}
              <div className="ap-form-row">
                <div className="ap-form-group">
                  <label className="ap-form-label">Priority</label>
                  <select 
                    className="ap-select" 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={loading}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <div className="ap-form-group">
                  <label className="ap-form-label">Status</label>
                  <select 
                    className="ap-select" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={loading}
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Planning">Planning</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* MEMBERS DROPDOWN */}
              <div className="ap-form-group">
                <label className="ap-form-label ap-required">Team Members</label>
                <div className="ap-dropdown-container">
                  <div 
                    className={`ap-dropdown-trigger ${loading ? 'ap-disabled' : ''}`} 
                    onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="ap-dropdown-placeholder">
                      {members.length > 0 ? `${members.length} member${members.length > 1 ? 's' : ''} selected` : 'Select team members'}
                    </span>
                    <span className={`ap-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                  </div>
                  
                  {isDropdownOpen && !loading && (
                    <div className="ap-dropdown-menu">
                      <div className="ap-dropdown-search">
                        <input
                          type="text"
                          placeholder="Search members..."
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                          className="ap-dropdown-search-input"
                          autoFocus
                        />
                      </div>
                      
                      <div className="ap-dropdown-options">
                        {users.length > 0 ? (
                          filteredUsers.map((u) => {
                            const userId = getUserId(u);
                            return (
                              <div 
                                key={userId}
                                className={`ap-dropdown-option ${members.includes(userId) ? 'selected' : ''}`}
                                onClick={() => handleMemberToggle(userId)}
                              >
                                <div className="ap-dropdown-option-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={members.includes(userId)}
                                    onChange={() => {}}
                                    className="ap-checkbox"
                                  />
                                </div>
                                <div className="ap-dropdown-option-avatar">
                                  {u.name?.charAt(0) || "U"}
                                </div>
                                <div className="ap-dropdown-option-info">
                                  <div className="ap-dropdown-option-name">{u.name || "Unknown User"}</div>
                                  <div className="ap-dropdown-option-email">{u.email || "No email"}</div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="ap-dropdown-empty">No users available</div>
                        )}
                      </div>
                      
                      <div className="ap-dropdown-footer">
                        <button className="ap-dropdown-done-btn" onClick={() => setIsDropdownOpen(false)}>
                          Done ({members.length} selected)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Selected Members Avatars */}
                {members.length > 0 && (
                  <div className="ap-avatar-group">
                    {getSelectedUsers().map((u) => {
                      const userId = getUserId(u);
                      return (
                        <div key={userId} className="ap-avatar-wrapper">
                          <div className="ap-avatar" title={`${u.name || "Unknown"}`}>
                            {u.name?.charAt(0) || "U"}
                          </div>
                          <button 
                            className="ap-avatar-remove"
                            onClick={() => !loading && handleMemberRemove(userId)}
                            title="Remove"
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {errors.members && <div className="ap-error-text">{errors.members}</div>}
              </div>

              {/* FILE UPLOAD */}
              <div className="ap-form-group">
                <label className="ap-form-label">Project Document (PDF) - Max 10MB</label>
                <div className="ap-file-upload-wrapper">
                  <label className={`ap-file-upload-btn ${loading ? 'ap-disabled' : ''}`}>
                    <Icons.CloudUpload /> {file ? 'Change PDF' : 'Upload Project Document (PDF)'}
                    <input
                      type="file"
                      className="ap-file-input"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </label>
                  {fileName && (
                    <div className="ap-file-info">
                      <Icons.Pdf /> {fileName}
                      <button 
                        className="ap-file-remove"
                        onClick={() => {
                          setFile(null);
                          setFileName("");
                        }}
                        disabled={loading}
                      >
                        <Icons.Close />
                      </button>
                    </div>
                  )}
                </div>
                {errors.file && <div className="ap-error-text">{errors.file}</div>}
              </div>

              {/* ACTION BUTTONS */}
              <div className="ap-form-actions">
                <button 
                  className="ap-btn ap-btn-primary" 
                  onClick={handleSubmit} 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="ap-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    projectId ? "Update Project" : "Create Project"
                  )}
                </button>
                {!projectId && (
                  <button 
                    className="ap-btn ap-btn-outline" 
                    onClick={resetForm} 
                    disabled={loading}
                  >
                    Clear Form
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PROJECT LIST SECTION */}
        <div className="ap-list-section">
          <div className="ap-list-header">
            <div>
              <h3 className="ap-list-title">All Projects ({filteredProjects.length})</h3>
              <p className="ap-list-subtitle">Manage and monitor all your projects</p>
            </div>
            
            <div className="ap-list-controls">
              <div className="ap-search-wrapper">
                <input
                  type="text"
                  className="ap-search-input"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="ap-sort-select" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="ap-empty-state">
              <div className="ap-empty-icon"><Icons.Folder /></div>
              <h4 className="ap-empty-title">No projects found</h4>
              <p className="ap-empty-description">
                {searchTerm ? "Try a different search term" : "Create your first project to get started"}
              </p>
              <button
                className="ap-btn ap-btn-primary"
                onClick={() => {
                  resetForm();
                  document.getElementById('ap-project-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Icons.Add /> Create First Project
              </button>
            </div>
          ) : (
            <div className="ap-project-grid">
              {filteredProjects.map((p) => {
                const projectId = getProjectId(p);
                return (
                  <div key={projectId} className="ap-project-card">
                    <div className="ap-project-top-bar" style={{
                      background: `linear-gradient(90deg, ${getStatusColor(p.status)} 0%, ${getPriorityColor(p.priority)} 100%)`
                    }} />
                    
                    <div className="ap-project-content">
                      <div className="ap-project-header">
                        <div className="ap-project-title-wrapper">
                          <Icons.Folder className="ap-project-icon" />
                          <h4 className="ap-project-title">{p.projectName || "Unnamed Project"}</h4>
                        </div>
                      </div>
                      
                      <div className="ap-project-badges">
                        <span className="ap-badge ap-badge-status" style={{ backgroundColor: getStatusColor(p.status) + '20', color: getStatusColor(p.status) }}>
                          {p.status || "Not set"}
                        </span>
                        <span className="ap-badge ap-badge-priority" style={{ backgroundColor: getPriorityColor(p.priority) + '20', color: getPriorityColor(p.priority) }}>
                          {p.priority || "Not set"}
                        </span>
                      </div>
                      
                      <p className="ap-project-description">{p.description || "No description available"}</p>
                      
                      <div className="ap-project-progress">
                        <div className="ap-progress-header">
                          <span className="ap-progress-label">Task Progress</span>
                          <span className="ap-progress-value">{getTaskProgress(p.tasks)}%</span>
                        </div>
                        <div className="ap-progress-bar">
                          <div className="ap-progress-fill" style={{ width: `${getTaskProgress(p.tasks)}%` }} />
                        </div>
                      </div>
                      
                      <div className="ap-project-meta">
                        <div className="ap-meta-item">
                          <Icons.Calendar />
                          <span>{p.startDate ? new Date(p.startDate).toLocaleDateString() : "No start"}</span>
                        </div>
                        <div className="ap-meta-group">
                          <span className="ap-meta-badge"><Icons.Group /> {p.users?.length || 0}</span>
                          <span className="ap-meta-badge"><Icons.Task /> {p.tasks?.length || 0}</span>
                        </div>
                      </div>
                      
                      <div className="ap-divider" />
                      
                      <div className="ap-project-actions">
                        <div className="ap-pdf-actions">
                          {p.pdfFile?.path ? (
                            <>
                              <button className="ap-icon-btn" onClick={() => viewPdf(p.pdfFile.path, p.pdfFile.filename)} title="View PDF">
                                <Icons.Visibility />
                              </button>
                              <button className="ap-icon-btn ap-icon-btn-success" onClick={() => downloadPdf(p.pdfFile.path, p.pdfFile.filename)} title="Download PDF">
                                <Icons.Download />
                              </button>
                            </>
                          ) : (
                            <span className="ap-no-document">No document</span>
                          )}
                        </div>
                        
                        <div className="ap-action-buttons">
                          <button className="ap-icon-btn" onClick={() => viewProjectDetails(p)} title="View Details">
                            <Icons.Visibility />
                          </button>
                          <button className="ap-icon-btn" onClick={() => editProject(p)} title="Edit">
                            <Icons.Edit />
                          </button>
                          <button className="ap-icon-btn ap-icon-btn-danger" onClick={() => deleteProject(projectId, p.projectName || "Unnamed Project")} title="Delete">
                            <Icons.Delete />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProject;
