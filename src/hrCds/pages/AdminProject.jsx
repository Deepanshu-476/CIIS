
import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import "../Css/AdminProject.css";
import CIISLoader from "../../Loader/CIISLoader"; 
import PageBranchDropdown, { usePageBranchScope } from "../components/PageBranchDropdown";


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
const isImageFile = (value = "") => /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(String(value));
const LIVE_API_URL = "https://backendciisnetwork.com/api";

const sanitizeDocName = (value, fallback = 'Document') => {
  const clean = String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return clean || fallback;
};

const getProjectDocumentDisplayName = (project) => {
  const safeName = sanitizeDocName(project?.projectName || project?.name || 'Project');
  const rawFileName = project?.pdfFile?.filename || project?.pdfFile?.originalName || project?.pdfFile?.path || '';
  const extMatch = rawFileName.match(/\.[a-zA-Z0-9]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.pdf';
  return `${safeName}_Document${ext}`;
};

const getTaskDocumentDisplayName = (task, project = null) => {
  const safeTask = sanitizeDocName(task?.title || 'Task');
  const rawFileName = task?.pdfFile?.filename || task?.pdfFile?.originalName || task?.pdfFile?.path || '';
  const extMatch = rawFileName.match(/\.[a-zA-Z0-9]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.pdf';
  return `${safeTask}_Document${ext}`;
};

const getProjectFileUrl = (filePath, apiBase = axios.defaults.baseURL) => {
  const rawPath = String(filePath || "").replace(/\\/g, "/").trim();
  if (!rawPath) return "";
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  const uploadsIndex = rawPath.indexOf("uploads/");
  const relativePath = uploadsIndex >= 0
    ? rawPath.slice(uploadsIndex)
    : `uploads/projects/${rawPath.split("/").pop()}`;
  return `${String(apiBase || "").replace(/\/$/, "")}/${relativePath}`;
};

const resolveApiPreviewUrl = (url) => {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith("blob:")) return rawUrl;
  const baseUrl = String(axios.defaults?.baseURL || "").replace(/\/+$/, "");
  if (!baseUrl) return rawUrl;
  return `${baseUrl}/${rawUrl.replace(/^\/+/, "")}`;
};

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
  const localCompanyCode = String(
    localStorage.getItem("companyCode")
    || localStorage.getItem("company_code")
    || localStorage.getItem("company_code_url")
    || localStorage.getItem("companySlug")
    || localStorage.getItem("companyName")
    || ""
  ).trim();

  return {
    companyCode: String(
      localCompanyCode
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

const getProjectBranchId = (project) => {
  const branch = project?.branch || project?.branchId;
  if (!branch) return "";
  if (typeof branch === "object") return String(branch._id || branch.id || "").trim();
  return String(branch).trim();
};

const getProjectsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.message?.projects)) return data.message.projects;
  return [];
};

const dedupeByRecordId = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const id = getProjectId(item) || getUserId(item);
    const key = String(id || "").trim();
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

const toNumber = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
};

const normalizeTaskStatus = (status = "") => String(status).trim().toLowerCase().replace(/[-_\s]+/g, " ");

const getProjectTaskCount = (project = {}) => (
  Array.isArray(project.tasks)
    ? project.tasks.length
    : toNumber(project.taskCount, project.tasksCount, project.totalTasks, project.taskSummary?.total)
);

const getCompletedTaskCount = (project = {}) => {
  if (Array.isArray(project.tasks)) {
    return project.tasks.filter(task => normalizeTaskStatus(task?.status) === "completed").length;
  }

  return toNumber(
    project.completedTaskCount,
    project.completedTasks,
    project.taskCompletedCount,
    project.taskSummary?.completed,
    project.taskStats?.completed
  );
};

export const AdminProject = () => {
  
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

  
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const {
    branchOptions,
    selectedBranchId,
    setSelectedBranchId,
    branchQueryParams
  } = usePageBranchScope();
  const [selectedProject, setSelectedProject] = useState(null);

  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); 
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [selectedPdfName, setSelectedPdfName] = useState("");
  const [selectedPdfPath, setSelectedPdfPath] = useState("");
  const [selectedPdfContext, setSelectedPdfContext] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, onHold: 0, highPriority: 0 });

  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  
  const [requestTimeout, setRequestTimeout] = useState(null);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

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
  }, [branchQueryParams.branchId]);

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

  useEffect(() => {
    const visibleUserIds = new Set(users.map(getUserId).filter(Boolean));
    setMembers((currentMembers) => currentMembers.filter(memberId => visibleUserIds.has(memberId)));
  }, [users]);

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

      
      const res = await axios.get("/users/company-users", {
        params: { companyCode, companyIdentifier: companyIdentifier || undefined, ...branchQueryParams },
        timeout: 10000 
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

      // The API resolves the company from the authenticated user. Do not block
      // a valid session merely because a legacy login has no companyCode saved
      // in localStorage.
      const res = await axios.get("/projects", {
        // Loading every embedded task for every project makes this list request
        // slow enough to hit the browser timeout. Full data is loaded only when
        // the user opens a project for viewing or editing.
        params: { companyCode, companyIdentifier: companyIdentifier || undefined, summary: 1, limit: 100, ...branchQueryParams },
        timeout: 10000 
      });

      const allProjects = dedupeByRecordId(getProjectsFromResponse(res.data));
      const normalizedCompanyCode = (companyCode || "").trim().toLowerCase();
      const companyProjects = allProjects.filter(project => {
        if (!normalizedCompanyCode) return true;
        const projectCompanyCode = getProjectCompanyCode(project).toLowerCase();
        if (!projectCompanyCode) return true;
        return projectCompanyCode === normalizedCompanyCode ||
          projectCompanyCode.startsWith(normalizedCompanyCode) ||
          normalizedCompanyCode.startsWith(projectCompanyCode);
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
    if (branchOptions.length > 1 && !selectedBranchId) {
      newErrors.branch = "Select a branch before creating project";
    }
    if (!startDate) newErrors.startDate = "Start date required";
    else if (!projectId && startDate < new Date().toISOString().split('T')[0]) newErrors.startDate = "Start date cannot be in the past";
    if (!endDate) newErrors.endDate = "End date required";
    else if (startDate && endDate < startDate) newErrors.endDate = "End date must be after start date";
    if (members.length === 0) newErrors.members = "Select at least one member";
    
    
    if (file && file.size > 10 * 1024 * 1024) { 
      newErrors.file = "File size must be less than 10MB";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const { companyCode, companyIdentifier } = getCompanyContext();
    if (!companyCode) {
      showSnackbar("Company code not found. Project cannot be created without company code.", "error");
      return;
    }
    
    setLoading(true);
    
    
    const timeoutId = setTimeout(() => {
      setLoading(false);
      showSnackbar("❌ Request timeout - please try again", "error");
    }, 30000); 
    
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
    if (selectedBranchId) {
      formData.append("branchId", selectedBranchId);
      formData.append("branch", selectedBranchId);
    }
    if (companyIdentifier) {
      formData.append("companyIdentifier", companyIdentifier);
      formData.append("companyId", companyIdentifier);
    }
    
    if (file) {
      const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')) : '.pdf';
      const safeProjectName = sanitizeDocName(projectName, 'Project');
      const customFileName = `${safeProjectName}_Document${(ext || '.pdf').toLowerCase()}`;
      formData.append("pdfFile", file, customFileName);
    }

    try {
      let response;
      
      
      const config = {
        headers: { 
          "Content-Type": "multipart/form-data"
        },
        params: { companyCode, companyIdentifier: companyIdentifier || undefined, ...branchQueryParams },
        timeout: 60000, 
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          void 0;
        }
      };

      if (projectId) {
        response = await axios.put(`/projects/${projectId}`, formData, config);
      } else {
        response = await axios.post("/projects", formData, config);
      }

      
      clearTimeout(timeoutId);
      setRequestTimeout(null);

      
      if (response.status === 200 || response.status === 201) {
        showSnackbar(projectId ? "Project updated successfully!" : "Project created successfully!", "success");
        upsertProject(getProjectFromResponse(response.data));
        resetForm();
        setIsProjectFormOpen(false);
        await fetchProjects(); 
      } else {
        showSnackbar(response.data?.message || "Operation failed", "error");
      }
    } catch (err) {
      
      clearTimeout(timeoutId);
      setRequestTimeout(null);
      
      console.error("Error saving project:", err);
      
      
      if (err.code === 'ECONNABORTED') {
        showSnackbar("❌ Request timeout - server is taking too long to respond", "error");
      } else if (err.response?.status === 504) {
        showSnackbar("❌ Gateway timeout - server is not responding", "error");
      } else if (err.response?.status === 413) {
        showSnackbar("❌ File too large - maximum size is 10MB", "error");
      } else if (err.response?.status === 500) {
        showSnackbar("❌ Server error - please try again later", "error");
      } else {
        const validationMessage = Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.map(item => item.msg || item.message).filter(Boolean).join(", ")
          : "";
        showSnackbar(validationMessage || err.response?.data?.message || "Something went wrong", "error");
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
        params: { companyCode, companyIdentifier: companyIdentifier || undefined, ...branchQueryParams },
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

  const fetchProjectDetails = async (project) => {
    const id = getProjectId(project);
    if (!id) throw new Error("Project details are unavailable");
    const response = await axios.get(`/projects/${id}`, { timeout: 10000 });
    return response.data?.project || response.data?.data || response.data;
  };

  const editProject = async (project) => {
    let p = project;
    try {
      p = await fetchProjectDetails(project);
    } catch (error) {
      console.error("Error loading project for editing:", error);
      showSnackbar(error.response?.data?.message || "Unable to load project details", "error");
      return;
    }

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
    const projectBranchId = getProjectBranchId(p);
    if (projectBranchId) {
      setSelectedBranchId(projectBranchId);
    }
    setFile(null);
    setFileName("");
    setIsProjectFormOpen(true);
  };

  const openCreateProjectForm = () => {
    resetForm();
    setIsProjectFormOpen(true);
  };

  const closeProjectForm = () => {
    if (loading) return;
    resetForm();
    setIsProjectFormOpen(false);
  };

  const viewProjectDetails = async (project) => {
    try {
      const fullProject = await fetchProjectDetails(project);
      setSelectedProject(fullProject);
    } catch (error) {
      console.error("Error loading project details:", error);
      showSnackbar(error.response?.data?.message || "Unable to load project details", "error");
      return;
    }
    setTabValue(0);
    setOpenDetailsDialog(true);
  };

  const viewPdf = async (pdfPath, filename, context = {}) => {
    const rawPath = pdfPath || context?.path;
    const projectId = context?.projectId || (context?.project ? getProjectId(context.project) : null);
    const taskId = context?.taskId || (context?.task ? getTaskId(context.task) : null);

    if (!rawPath && !projectId) {
      showSnackbar("No document file available", "warning");
      return;
    }

    const displayName = filename || (rawPath ? rawPath.split('/').pop() : "") || "Document preview";
    const fallbackStaticUrl = rawPath ? getProjectFileUrl(rawPath) : "";

    setSelectedPdfName(displayName);
    setSelectedPdfPath(rawPath || "");
    setSelectedPdfContext(context);
    setSelectedPdfUrl(fallbackStaticUrl);

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    setPdfLoading(true);
    setPdfError(null);
    setOpenPdfDialog(true);

    const candidateUrls = [];
    if (projectId && taskId) {
      candidateUrls.push(`/projects/${projectId}/tasks/${taskId}/document?view=true`);
    } else if (projectId) {
      candidateUrls.push(`/projects/${projectId}/document?view=true`);
    }
    if (fallbackStaticUrl) {
      candidateUrls.push(fallbackStaticUrl);
    }

    try {
      let response = null;
      for (const url of candidateUrls) {
        try {
          response = await axios.get(url, { responseType: 'blob' });
          break;
        } catch (err) {
          if (url === candidateUrls[candidateUrls.length - 1]) throw err;
        }
      }

      if (!response || !response.data) throw new Error("No data received");

      const contentType = response.data.type || response.headers?.['content-type'] || 'application/pdf';
      const fileBlob = new Blob([response.data], { type: contentType });
      const objectUrl = URL.createObjectURL(fileBlob);
      setPdfBlobUrl(objectUrl);
      setSelectedPdfUrl(objectUrl);
    } catch (err) {
      console.error("Error loading document preview:", err);
      const directPreviewUrl = resolveApiPreviewUrl(fallbackStaticUrl || candidateUrls[0]);
      if (directPreviewUrl) {
        setSelectedPdfUrl(directPreviewUrl);
        setPdfError(null);
      } else {
        setPdfError("Document preview cannot be displayed directly. Please use the Download button below.");
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
  };

  const downloadPdf = async (pdfPath, filename, context = null) => {
    const activeContext = context || selectedPdfContext || {};
    const rawPath = pdfPath || activeContext?.path;
    const projectId = activeContext?.projectId || (activeContext?.project ? getProjectId(activeContext.project) : null);
    const taskId = activeContext?.taskId || (activeContext?.task ? getTaskId(activeContext.task) : null);

    if (!rawPath && !projectId) {
      showSnackbar("No document file available", "warning");
      return;
    }

    const downloadName = filename || (rawPath ? rawPath.split('/').pop() : "") || 'document.pdf';
    const candidateUrls = [];
    if (projectId && taskId) {
      candidateUrls.push(`/projects/${projectId}/tasks/${taskId}/document`);
    } else if (projectId) {
      candidateUrls.push(`/projects/${projectId}/document`);
    }
    if (rawPath) {
      candidateUrls.push(getProjectFileUrl(rawPath));
    }

    try {
      let response = null;
      for (const url of candidateUrls) {
        try {
          response = await axios.get(url, { responseType: 'blob' });
          break;
        } catch (err) {
          if (url === candidateUrls[candidateUrls.length - 1]) throw err;
        }
      }

      if (!response || !response.data) throw new Error("No download data available");

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
      const directUrl = resolveApiPreviewUrl((rawPath ? getProjectFileUrl(rawPath) : "") || candidateUrls[0]);
      if (directUrl) {
        const link = document.createElement('a');
        link.href = directUrl;
        link.download = downloadName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        showSnackbar("Unable to download file", "error");
      }
    }
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
      
      if (selectedFile.type !== "application/pdf") {
        showSnackbar("Only PDF files are allowed", "error");
        e.target.value = ''; 
        return;
      }
      
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        showSnackbar("File size must be less than 10MB", "error");
        e.target.value = ''; 
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
    
    
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

  const getTaskProgress = (projectOrTasks) => {
    const project = Array.isArray(projectOrTasks) ? { tasks: projectOrTasks } : (projectOrTasks || {});
    const total = getProjectTaskCount(project);
    if (!total) return 0;

    const percent = toNumber(project.taskProgress, project.progressPercentage, project.progress);
    if (percent > 0) return Math.max(0, Math.min(100, Math.round(percent)));

    const completed = getCompletedTaskCount(project);
    return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
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

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="ap">
      
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

      
      {loading && (
        <div className="ap-loading-overlay">
          <div className="ap-loading-spinner"></div>
          <div className="ap-loading-text">Saving project...</div>
        </div>
      )}

      
      {openPdfDialog && (
        <div className="ap-dialog-backdrop ap-file-preview-backdrop">
          <div className="ap-dialog ap-dialog-lg ap-file-preview-dialog">
            <div className="ap-dialog-header">
              <div className="ap-dialog-title">
                {isImageFile(selectedPdfName || selectedPdfUrl) ? <Icons.File /> : <Icons.Pdf />}
                {selectedPdfName || "Document Preview"}
              </div>
              <button className="ap-dialog-close" onClick={closePdfPreview}>
                <Icons.Close />
              </button>
            </div>
            <div className="ap-dialog-content ap-dialog-content-no-padding">
              {isImageFile(selectedPdfName || selectedPdfUrl) ? (
                <div className="ap-image-viewer-frame">
                  <img
                    src={selectedPdfUrl}
                    alt={selectedPdfName || "Task attachment"}
                    className="ap-image-viewer"
                    onError={(event) => {
                      const fallbackUrl = getProjectFileUrl(selectedPdfPath, LIVE_API_URL);
                      if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                        event.currentTarget.src = fallbackUrl;
                      }
                    }}
                  />
                </div>
              ) : pdfLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "350px",
                    gap: "16px",
                    padding: "40px 20px"
                  }}
                >
                  <p style={{ margin: 0, color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
                    Loading document preview...
                  </p>
                </div>
              ) : (pdfBlobUrl || selectedPdfUrl) ? (
                <iframe
                  src={pdfBlobUrl || selectedPdfUrl}
                  title={selectedPdfName || "PDF Viewer"}
                  className="ap-pdf-viewer"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "300px",
                    padding: "32px 20px",
                    textAlign: "center",
                    gap: "12px"
                  }}
                >
                  <p style={{ color: "#e11d48", fontWeight: 600, fontSize: "15px", margin: 0 }}>
                    {pdfError || "Document preview is unavailable"}
                  </p>
                  <p style={{ color: "#64748b", fontSize: "13px", maxWidth: "420px", margin: 0 }}>
                    You can download or open the document directly to view it on your device.
                  </p>
                  <button
                    type="button"
                    className="ap-btn ap-btn-primary"
                    style={{ marginTop: "8px" }}
                    onClick={() => downloadPdf(selectedPdfPath, selectedPdfName)}
                  >
                    <Icons.Download /> Download Document
                  </button>
                </div>
              )}
            </div>
            <div className="ap-dialog-footer">
              {(pdfBlobUrl || selectedPdfUrl) && (
                <button
                  type="button"
                  className="ap-btn ap-btn-outline"
                  onClick={() => window.open(pdfBlobUrl || selectedPdfUrl, "_blank", "noopener,noreferrer")}
                >
                  Open in New Tab
                </button>
              )}
              <button
                className="ap-btn ap-btn-primary"
                onClick={() => downloadPdf(selectedPdfPath, selectedPdfName)}
                disabled={!selectedPdfPath && !selectedPdfUrl}
              >
                <Icons.Download /> Download
              </button>
              <button
                className="ap-btn ap-btn-outline"
                onClick={closePdfPreview}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
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
                          <span className="ap-progress-percentage">{getTaskProgress(selectedProject)}%</span>
                        </div>
                        <div className="ap-progress-bar">
                          <div className="ap-progress-fill" style={{ width: `${getTaskProgress(selectedProject)}%` }} />
                        </div>
                      </div>
                      <div className="ap-task-stats">
                        <div className="ap-task-stat">
                          <span>Total Tasks</span>
                          <span className="ap-task-stat-value">{getProjectTaskCount(selectedProject)}</span>
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
                      {(selectedProject.users || []).map((user, index) => (
                        <div key={`${getUserId(user) || 'user'}-${index}`} className="ap-team-member">
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
                      {selectedProject.tasks.map((task, index) => (
                        <div key={`${task._id || task.id || 'task'}-${index}`} className="ap-task-item">
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
                  
                  {(selectedProject.pdfFile?.path || selectedProject.pdfFile?.filename || selectedProject.pdfFile?.url) ? (
                    <div className="ap-document-card">
                      <div className="ap-document-icon"><Icons.Pdf /></div>
                      <div className="ap-document-info">
                        <div className="ap-document-name">{getProjectDocumentDisplayName(selectedProject)}</div>
                        <div className="ap-document-meta">Uploaded on: {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : "Unknown"}</div>
                      </div>
                      <div className="ap-document-actions">
                        <button className="ap-icon-btn" onClick={() => viewPdf(selectedProject.pdfFile?.path, getProjectDocumentDisplayName(selectedProject), { projectId: selectedProject._id })}>
                          <Icons.Visibility />
                        </button>
                        <button className="ap-icon-btn ap-icon-btn-success" onClick={() => downloadPdf(selectedProject.pdfFile?.path, getProjectDocumentDisplayName(selectedProject), { projectId: selectedProject._id })}>
                          <Icons.Download />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ap-alert ap-alert-info">No project document uploaded</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
      <div className="ap-container">
        
        <div className="ap-header">
          <div className="ap-header-content">
            <div>
              <h1 className="ap-header-title">Manage Projects</h1>
              <p className="ap-header-subtitle">Create, edit, delete, and assign company projects</p>
            </div>
            <button
              type="button"
              className="ap-btn ap-btn-primary ap-header-create-btn"
              onClick={openCreateProjectForm}
              disabled={loading}
            >
              <Icons.Add /> Create New Project
            </button>
          </div>

          
          <div className="ap-stats-grid">
            <StatCard icon={<Icons.Folder />} value={stats.total} label="Total Projects" color="#667eea" subtext="All projects" />
            <StatCard icon={<Icons.PlayArrow />} value={stats.active} label="Active" color="#10b981" />
            <StatCard icon={<Icons.CheckCircle />} value={stats.completed} label="Completed" color="#3b82f6" />
            <StatCard icon={<Icons.Flag />} value={stats.highPriority} label="High Priority" color="#ef4444" subtext="Urgent" />
          </div>
        </div>

        <PageBranchDropdown
          branchOptions={branchOptions}
          selectedBranchId={selectedBranchId}
          onChange={(branchId) => {
            setSelectedBranchId(branchId);
            setErrors((currentErrors) => ({ ...currentErrors, branch: undefined }));
          }}
        />
        {errors.branch && <div className="ap-error-text" style={{ marginTop: -8, marginBottom: 12 }}>{errors.branch}</div>}

        
        {isProjectFormOpen && (
        <div className="ap-dialog-backdrop ap-project-form-backdrop" onMouseDown={closeProjectForm}>
        <div id="ap-project-form" className="ap-form-card ap-project-form-modal" onMouseDown={(event) => event.stopPropagation()}>
          <div className="ap-form-header">
            <div className="ap-form-header-content">
              <div>
                <h2 className="ap-form-title">{projectId ? "Edit Project" : "Create New Project"}</h2>
                <p className="ap-form-subtitle">{projectId ? "Update project details below" : "Fill in the details to create a new project"}</p>
              </div>
              <button className="ap-dialog-close" onClick={closeProjectForm} disabled={loading} aria-label="Close project form">
                <Icons.Close />
              </button>
            </div>
          </div>

          <div className="ap-form-content">
            <div className="ap-form-stack">
              
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
        </div>
        )}

        
        <div className="ap-list-section">
          <div className="ap-list-header">
            <div>
              <h3 className="ap-list-title">Managed Projects ({filteredProjects.length})</h3>
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
              {filteredProjects.map((p, index) => {
                const projectId = getProjectId(p);
                const taskProgress = getTaskProgress(p);
                return (
                  <div key={`${projectId || 'project'}-${index}`} className="ap-project-card">
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
                          <span className="ap-progress-value">{taskProgress}%</span>
                        </div>
                        <div className="ap-progress-bar">
                          <div className="ap-progress-fill" style={{ width: `${taskProgress}%` }} />
                        </div>
                      </div>
                      
                      <div className="ap-project-meta">
                        <div className="ap-meta-item">
                          <Icons.Calendar />
                          <span>{p.startDate ? new Date(p.startDate).toLocaleDateString() : "No start"}</span>
                        </div>
                        <div className="ap-meta-group">
                          <span className="ap-meta-badge"><Icons.Group /> {p.users?.length || 0}</span>
                          <span className="ap-meta-badge"><Icons.Task /> {getProjectTaskCount(p)}</span>
                        </div>
                      </div>
                      
                      <div className="ap-divider" />
                      
                      <div className="ap-project-actions">
                        <div className="ap-pdf-actions">
                          {(p.pdfFile?.path || p.pdfFile?.filename || p.pdfFile?.url) ? (
                            <>
                              <button className="ap-icon-btn" onClick={() => viewPdf(p.pdfFile?.path, getProjectDocumentDisplayName(p), { projectId: p._id })} title="View PDF">
                                <Icons.Visibility />
                              </button>
                              <button className="ap-icon-btn ap-icon-btn-success" onClick={() => downloadPdf(p.pdfFile?.path, getProjectDocumentDisplayName(p), { projectId: p._id })} title="Download PDF">
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
