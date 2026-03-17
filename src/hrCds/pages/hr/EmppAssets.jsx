import React, { useEffect, useState } from 'react';
import axios from '../../../utils/axiosConfig';
import CIISLoader from '../../../Loader/CIISLoader';
import {
  FiEdit, FiTrash2, FiPackage, FiCheckCircle,
  FiXCircle, FiClock, FiMessageCircle, FiSearch, 
  FiUsers, FiBriefcase, FiFilter, FiLock, FiEyeOff,
  FiShield, FiHome
} from 'react-icons/fi';
import './EmpAssets.css';

const EmpAssets = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStat, setSelectedStat] = useState('All');
  const [notification, setNotification] = useState(null);
  const [editingCommentReq, setEditingCommentReq] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // User Role Related States
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserDepartment, setCurrentUserDepartment] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState('');
  const [currentUserCompanyCode, setCurrentUserCompanyCode] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  
  // Permission States
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [permissions, setPermissions] = useState({
    canViewAllRequests: false,
    canApproveRequests: false,
    canDeleteRequests: false,
    canExportData: false,
    canViewHistory: true
  });

  // Get company code from localStorage
  const companyCode = localStorage.getItem('companyCode') || 'Mohit';

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    fetchCurrentUserAndCompany();
  }, []);

  // Fetch data when filters change
  useEffect(() => { 
    if (currentUserCompanyCode) {
      fetchRequests();
    }
  }, [statusFilter, selectedCompany, selectedDepartment, currentUserCompanyCode, isOwner]);

  // Load departments on component mount
  useEffect(() => {
    if (currentUserCompanyId) {
      fetchDepartments();
    }
  }, [currentUserCompanyId]);

  // ============================================
  // USER & PERMISSION FUNCTIONS
  // ============================================
  const fetchCurrentUserAndCompany = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log("⚠️ No user found in localStorage");
        return;
      }

      const user = JSON.parse(userStr);
      
      const userId = user._id || user.id || '';
      const companyId = user.company || user.companyId || '';
      const companyCode = user.companyCode || user.companyDetails?.companyCode || '';
      const department = user.department || '';
      const name = user.name || user.username || 'User';
      let role = '';
      
      if (user.companyRole) {
        role = user.companyRole;
      } else if (user.role) {
        role = user.role;
      }
      
      setCurrentUser(user);
      setCurrentUserId(userId);
      setCurrentUserCompanyId(companyId);
      setCurrentUserCompanyCode(companyCode);
      setCurrentUserDepartment(department);
      setCurrentUserName(name);
      setCurrentUserRole(role);
      
      const isOwnerRole = role === 'Owner' || role === 'owner' || role === 'OWNER';
      const isAdminRole = role === 'Admin' || role === 'admin' || role === 'ADMIN';
      const isHRRole = role === 'HR' || role === 'hr' || role === 'Hr';
      const isManagerRole = role === 'Manager' || role === 'manager' || role === 'MANAGER';
      
      setIsOwner(isOwnerRole);
      setIsAdmin(isAdminRole);
      setIsHR(isHRRole);
      setIsManager(isManagerRole);
      
      setPermissions({
        canViewAllRequests: isOwnerRole || isAdminRole || isHRRole,
        canApproveRequests: isOwnerRole || isAdminRole || isHRRole || isManagerRole,
        canDeleteRequests: isOwnerRole || isAdminRole || isHRRole,
        canExportData: isOwnerRole || isAdminRole || isHRRole,
        canViewHistory: true
      });
      
      // Auto-set company filter for current user's company
      if (companyCode) {
        setSelectedCompany(companyCode);
      }
      
      if (!role && userId) {
        await fetchUserRole(userId);
      }
      
    } catch (error) {
      console.error("Error parsing user data:", error);
      setNotification({ message: 'Error loading user data', severity: 'error' });
    }
  };

  const fetchUserRole = async (userId) => {
    try {
      const res = await axios.get(`/users/${userId}`);
      if (res.data && res.data.success && res.data.user) {
        const user = res.data.user;
        const userRole = user.companyRole || user.role;
        
        setCurrentUserRole(userRole);
        
        const isOwnerRole = userRole === 'Owner' || userRole === 'owner' || userRole === 'OWNER';
        const isAdminRole = userRole === 'Admin' || userRole === 'admin' || userRole === 'ADMIN';
        const isHRRole = userRole === 'HR' || userRole === 'hr' || userRole === 'Hr';
        const isManagerRole = userRole === 'Manager' || userRole === 'manager' || userRole === 'MANAGER';
        
        setIsOwner(isOwnerRole);
        setIsAdmin(isAdminRole);
        setIsHR(isHRRole);
        setIsManager(isManagerRole);
        
        setPermissions({
          canViewAllRequests: isOwnerRole || isAdminRole || isHRRole,
          canApproveRequests: isOwnerRole || isAdminRole || isHRRole || isManagerRole,
          canDeleteRequests: isOwnerRole || isAdminRole || isHRRole,
          canExportData: isOwnerRole || isAdminRole || isHRRole,
          canViewHistory: true
        });
      }
    } catch (err) {
      console.error("Failed to fetch user role:", err);
    }
  };

  // ============================================
  // FETCH DEPARTMENTS
  // ============================================
  const fetchDepartments = async () => {
    try {
      let url = '/departments';
      const params = [];
      
      if (currentUserCompanyId) {
        params.push(`company=${currentUserCompanyId}`);
      } else if (selectedCompany) {
        params.push(`companyCode=${selectedCompany}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      console.log("🏢 Fetching departments from:", url);
      const { data } = await axios.get(url);
      
      console.log("✅ Departments API response:", data);
      
      let departmentsData = [];
      let departmentMapping = {};
      
      // Handle different response structures
      if (data.success && data.departments) {
        departmentsData = data.departments;
      } else if (Array.isArray(data)) {
        departmentsData = data;
      } else if (data.data && Array.isArray(data.data)) {
        departmentsData = data.data;
      }
      
      // Create department map { id: name }
      if (Array.isArray(departmentsData)) {
        departmentsData.forEach(dept => {
          const deptId = dept._id || dept.id;
          const deptName = dept.name || dept.departmentName || dept.title;
          if (deptId && deptName) {
            departmentMapping[deptId] = deptName;
          }
        });
      }
      
      console.log("📊 Department mapping created:", departmentMapping);
      
      // Extract department names for dropdown
      const deptNames = departmentsData.map(dept => dept.name || dept.departmentName || dept).filter(Boolean);
      
      setDepartmentMap(departmentMapping);
      setDepartments(deptNames);
      
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      extractDepartmentsFromRequests(requests);
    }
  };

  // ============================================
  // GET DEPARTMENT NAME
  // ============================================
  const getDepartmentName = (dept) => {
    if (!dept) return 'Not Assigned';
    
    // CASE 1: If it's already a string and not an ID pattern, return as is
    if (typeof dept === 'string') {
      // Check if it looks like a MongoDB ID (24 hex chars)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(dept);
      
      if (!isMongoId) {
        return dept; // Already a name
      }
      
      // Try to get from department map
      if (departmentMap[dept]) {
        return departmentMap[dept];
      }
      
      // Try to find in departments array
      const foundDept = departments.find(d => d._id === dept || d.id === dept);
      if (foundDept) {
        return foundDept.name || foundDept.departmentName || dept;
      }
      
      return 'Department'; // Fallback
    }
    
    // CASE 2: If it's an object with name property
    if (typeof dept === 'object') {
      if (dept.name) {
        return dept.name;
      }
      if (dept.departmentName) {
        return dept.departmentName;
      }
      if (dept._id && departmentMap[dept._id]) {
        return departmentMap[dept._id];
      }
    }
    
    return 'Department';
  };

  const extractDepartmentsFromRequests = (requestsData) => {
    const deptSet = new Set();
    const deptMapping = { ...departmentMap };
    
    requestsData.forEach(req => {
      if (req.department) {
        if (typeof req.department === 'string') {
          // Check if it's an ID
          const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.department);
          if (!isMongoId) {
            deptSet.add(req.department); // It's a name
          }
        } else if (req.department.name) {
          deptSet.add(req.department.name);
          if (req.department._id) {
            deptMapping[req.department._id] = req.department.name;
          }
        }
      }
    });
    
    setDepartmentMap(prev => ({ ...prev, ...deptMapping }));
    setDepartments(Array.from(deptSet).sort());
  };

  // ============================================
  // 🔥 FIXED: FETCH ASSET REQUESTS - CORRECT ENDPOINTS
  // ============================================
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // ✅ FIXED: Use correct endpoint - /asset-requests/all instead of /assets/all
      let url = `/asset-requests/all`;
      const params = [];
      
      // Always add company filter
      if (currentUserCompanyCode) {
        params.push(`companyCode=${currentUserCompanyCode}`);
      } else if (selectedCompany) {
        params.push(`companyCode=${selectedCompany}`);
      }
      
      // For non-owners, force filter by their department
      if (!isOwner && !isAdmin && !isHR) {
        if (currentUserDepartment) {
          console.log("📊 Filtering asset requests by department:", currentUserDepartment);
          const deptValue = typeof currentUserDepartment === 'object' 
            ? currentUserDepartment._id || currentUserDepartment.id 
            : currentUserDepartment;
          params.push(`department=${deptValue}`);
        } else {
          console.warn("⚠️ No department found for non-owner user");
          setNotification({ message: 'Department information missing', severity: 'warning' });
          setLoading(false);
          return;
        }
      } else {
        // For owners/admins/HR, apply department filter only if selected
        if (selectedDepartment) {
          params.push(`department=${selectedDepartment}`);
        }
      }
      
      if (statusFilter) params.push(`status=${statusFilter}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      console.log("🌐 Fetching asset requests from:", url);
      const { data } = await axios.get(url);
      
      let requestsData = [];
      if (data.requests) {
        requestsData = data.requests;
      } else if (Array.isArray(data)) {
        requestsData = data;
      }
      
      console.log(`✅ Fetched ${requestsData.length} asset requests`);
      
      // For non-owners, double-check filtering by department (safety net)
      if (!isOwner && !isAdmin && !isHR && currentUserDepartment) {
        const beforeFilter = requestsData.length;
        const deptValue = typeof currentUserDepartment === 'object' 
          ? currentUserDepartment._id || currentUserDepartment.id 
          : currentUserDepartment;
        
        requestsData = requestsData.filter(req => {
          const reqDept = req.department?._id || req.department || req.departmentId;
          return reqDept === deptValue;
        });
        
        if (requestsData.length !== beforeFilter) {
          console.log(`🔒 Filtered out ${beforeFilter - requestsData.length} requests from other departments`);
        }
      }
      
      setRequests(requestsData);
      calculateStats(requestsData);
      
      // Update departments based on fetched requests
      extractDepartmentsFromRequests(requestsData);
    } catch (err) {
      setNotification({ message: 'Failed to fetch requests', severity: 'error' });
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(r => r.status === 'pending').length;
    const approved = data.filter(r => r.status === 'approved').length;
    const rejected = data.filter(r => r.status === 'rejected').length;
    setStats({ total: data.length, pending, approved, rejected });
  };

  // ============================================
  // PERMISSION CHECK FUNCTIONS
  // ============================================
  const canApproveRequest = () => {
    return isOwner === true || isAdmin === true || isHR === true || isManager === true;
  };

  const canDeleteRequest = () => {
    return isOwner === true || isAdmin === true || isHR === true;
  };

  const canEditComment = () => {
    return isOwner === true || isAdmin === true || isHR === true || isManager === true;
  };

  // ============================================
  // 🔥 FIXED: HANDLE FUNCTIONS WITH CORRECT ENDPOINTS
  // ============================================
  const handleStatFilter = (type) => {
    if (selectedStat === type) {
      // If clicking the same filter, clear it
      setSelectedStat('All');
      setStatusFilter('');
    } else {
      setSelectedStat(type);
      setStatusFilter(type.toLowerCase());
    }
  };

  const handleDelete = async (id) => {
    if (!canDeleteRequest()) {
      setNotification({ 
        message: '⛔ Access Denied: Only Owner, Admin, or HR can delete requests', 
        severity: 'error' 
      });
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    setActionLoading(true);
    try {
      // ✅ FIXED: Use correct endpoint - /asset-requests/delete/:id
      await axios.delete(`/asset-requests/delete/${id}`);
      setNotification({ message: 'Request deleted successfully', severity: 'success' });
      fetchRequests();
    } catch (err) {
      setNotification({ message: 'Failed to delete request', severity: 'error' });
      console.error('Delete error:', err);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleStatusChange = async (reqId, newStatus) => {
    if (!canApproveRequest()) {
      setNotification({ 
        message: '⛔ Access Denied: Only Owner, Admin, HR, or Manager can update status', 
        severity: 'error' 
      });
      return;
    }
    
    setActionLoading(true);
    try {
      // ✅ FIXED: Use correct endpoint - /asset-requests/update/:id
      await axios.patch(`/asset-requests/update/${reqId}`, { status: newStatus });
      setNotification({ message: 'Status updated successfully', severity: 'success' });
      fetchRequests();
    } catch (err) {
      setNotification({ message: 'Failed to update status', severity: 'error' });
      console.error('Status update error:', err);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleCommentEditOpen = (req) => {
    if (!canEditComment()) {
      setNotification({ 
        message: '⛔ Access Denied: Only Owner, Admin, HR, or Manager can edit comments', 
        severity: 'error' 
      });
      return;
    }
    
    setEditingCommentReq(req);
    setCommentText(req.adminComment || '');
  };

  const handleCommentUpdate = async () => {
    if (!canEditComment()) {
      setNotification({ 
        message: '⛔ Access Denied: Only Owner, Admin, HR, or Manager can edit comments', 
        severity: 'error' 
      });
      return;
    }
    
    setActionLoading(true);
    try {
      // ✅ FIXED: Use correct endpoint - /asset-requests/update/:id
      await axios.patch(`/asset-requests/update/${editingCommentReq._id}`, {
        adminComment: commentText,
        status: editingCommentReq.status
      });
      setNotification({ message: 'Comment updated successfully', severity: 'success' });
      setEditingCommentReq(null);
      fetchRequests();
    } catch (err) {
      setNotification({ message: 'Failed to update comment', severity: 'error' });
      console.error('Comment update error:', err);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleCompanyFilter = () => {
    if (selectedCompany === currentUserCompanyCode) {
      // If already filtering by this company, clear the filter
      setSelectedCompany('');
    } else {
      setSelectedCompany(currentUserCompanyCode);
    }
    // Don't clear department when toggling company
    fetchDepartments();
  };

  const handleClearFilters = () => {
    setSelectedCompany(currentUserCompanyCode); // Keep user's company as default
    setSelectedDepartment('');
    setStatusFilter('');
    setSelectedStat('All');
    setSearchTerm('');
    fetchDepartments();
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    // Don't clear other filters, just update department
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedDepartment) count++;
    if (statusFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase() : 'U';

  const filteredRequests = requests.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    
    // Handle department search properly
    let departmentMatch = false;
    if (req.department) {
      const deptName = getDepartmentName(req.department);
      departmentMatch = deptName.toLowerCase().includes(searchLower);
    }
    
    return (
      req.user?.name?.toLowerCase().includes(searchLower) ||
      req.user?.email?.toLowerCase().includes(searchLower) ||
      req.assetName?.toLowerCase().includes(searchLower) ||
      req.adminComment?.toLowerCase().includes(searchLower) ||
      departmentMatch ||
      req.companyCode?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusClass = (status) => {
    switch(status) {
      case 'approved': return 'EmpAssets-chip-status-approved';
      case 'pending': return 'EmpAssets-chip-status-pending';
      case 'rejected': return 'EmpAssets-chip-status-rejected';
      default: return '';
    }
  };

  const getAssetClass = (assetName) => {
    switch(assetName?.toLowerCase()) {
      case 'phone': return 'EmpAssets-chip-asset-phone';
      case 'laptop': return 'EmpAssets-chip-asset-laptop';
      case 'desktop': return 'EmpAssets-chip-asset-desktop';
      case 'headphone': return 'EmpAssets-chip-asset-headphone';
      case 'sim': return 'EmpAssets-chip-asset-sim';
      default: return 'EmpAssets-chip-asset-phone';
    }
  };

  const getRowClass = (status) => {
    switch(status) {
      case 'approved': return 'EmpAssets-table-row-approved';
      case 'pending': return 'EmpAssets-table-row-pending';
      case 'rejected': return 'EmpAssets-table-row-rejected';
      default: return '';
    }
  };

  const getAvatarClass = (type) => {
    switch(type) {
      case 'All': return 'EmpAssets-avatar-primary';
      case 'Pending': return 'EmpAssets-avatar-warning';
      case 'Approved': return 'EmpAssets-avatar-success';
      case 'Rejected': return 'EmpAssets-avatar-error';
      default: return '';
    }
  };

  const getActiveClass = (type, selected) => {
    if (selected !== type) return '';
    switch(type) {
      case 'All': return 'EmpAssets-active EmpAssets-active-primary';
      case 'Pending': return 'EmpAssets-active EmpAssets-active-warning';
      case 'Approved': return 'EmpAssets-active EmpAssets-active-success';
      case 'Rejected': return 'EmpAssets-active EmpAssets-active-error';
      default: return '';
    }
  };

  const normalizeRole = (role) => {
    if (!role) return 'Employee';
    const r = role.toLowerCase();
    if (r === 'hr') return 'HR Manager';
    if (r === 'admin') return 'Administrator';
    if (r === 'superadmin') return 'Super Admin';
    if (r === 'manager') return 'Team Manager';
    if (r === 'owner') return 'Company Owner';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const RoleBadge = () => {
    if (!currentUserRole) return null;
    
    let badgeClass = 'EmpAssets-role-badge';
    let icon = <FiUsers size={12} />;
    
    if (isOwner) {
      badgeClass += ' EmpAssets-role-badge-owner';
      icon = <FiShield size={12} />;
    } else if (isAdmin) {
      badgeClass += ' EmpAssets-role-badge-admin';
      icon = <FiShield size={12} />;
    } else if (isHR) {
      badgeClass += ' EmpAssets-role-badge-hr';
    } else if (isManager) {
      badgeClass += ' EmpAssets-role-badge-manager';
    }
    
    return (
      <span className={badgeClass}>
        {icon}
        {normalizeRole(currentUserRole)}
      </span>
    );
  };

  // Loading state - Use CIISLoader
  if (loading) {
    return <CIISLoader />;
  }

  return (
    <div className="EmpAssets-container">
      {/* Header Section */}
      <div className="EmpAssets-header">
        <h1>Asset Requests Management</h1>
        <p>
          Review and manage employee asset requests 
          <RoleBadge />
          {!isOwner && !isAdmin && !isHR && !isManager && (
            <span className="EmpAssets-view-only-badge">
              <FiEyeOff size={14} />
              View Only
            </span>
          )}
        </p>
      </div>

      {/* Permission Warning Banner */}
      {!canApproveRequest() && (
        <div className="EmpAssets-warning-banner">
          <div className="EmpAssets-warning-content">
            <FiLock size={20} />
            <div className="EmpAssets-warning-text">
              <strong>🔒 View Only Mode</strong>
              <p>You are viewing asset requests from your department only. Only Owners, Admins, HR, and Managers can approve/reject requests.</p>
            </div>
          </div>
        </div>
      )}

      {/* Department Info Banner - Show for non-privileged users */}
      {!isOwner && !isAdmin && !isHR && !isManager && currentUserDepartment && (
        <div className="EmpAssets-department-info-banner">
          <div className="EmpAssets-info-content">
            <FiHome size={20} />
            <div className="EmpAssets-info-text">
              <strong>🏢 Your Department: {getDepartmentName(currentUserDepartment)}</strong>
              <p>Showing asset requests only from your department</p>
            </div>
          </div>
        </div>
      )}

      {/* Company Info Bar */}
      <div className="EmpAssets-company-bar">
        <div className="EmpAssets-company-info">
          <span>Company: <strong>{currentUserCompanyCode || companyCode}</strong></span>
          {(isOwner || isAdmin || isHR) && (
            <button 
              className={`EmpAssets-filter-btn ${selectedCompany === currentUserCompanyCode ? 'active' : ''}`}
              onClick={handleCompanyFilter}
              title={selectedCompany === currentUserCompanyCode ? "Show all companies" : `Show only ${currentUserCompanyCode} requests`}
            >
              <FiUsers /> {selectedCompany === currentUserCompanyCode ? 'All Companies' : 'My Company Only'}
            </button>
          )}
        </div>
        
        <div className="EmpAssets-filter-actions">
          <button 
            className="EmpAssets-toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> 
            Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </button>
          
          {getActiveFilterCount() > 0 && (
            <button 
              className="EmpAssets-clear-btn"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Only show cards with count > 0 */}
      <div className="EmpAssets-stats-grid">
        {[
          { label: 'Total Requests', count: stats.total, color: 'primary', type: 'All', icon: <FiPackage />, alwaysShow: true },
          { label: 'Pending', count: stats.pending, color: 'warning', type: 'Pending', icon: <FiClock /> },
          { label: 'Approved', count: stats.approved, color: 'success', type: 'Approved', icon: <FiCheckCircle /> },
          { label: 'Rejected', count: stats.rejected, color: 'error', type: 'Rejected', icon: <FiXCircle /> },
        ]
          .filter(item => item.alwaysShow || item.count > 0)
          .map((item) => (
            <div 
              key={item.type}
              className={`EmpAssets-stat-card ${getActiveClass(item.type, selectedStat)}`}
              onClick={() => handleStatFilter(item.type)}
            >
              <div className="EmpAssets-stat-content">
                <div className={`EmpAssets-stat-avatar ${getAvatarClass(item.type)}`}>
                  {item.icon}
                </div>
                <div className="EmpAssets-stat-info">
                  <h3>{item.label}</h3>
                  <h2>{item.count}</h2>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Filters Section */}
      <div className={`EmpAssets-filters-container ${showFilters ? 'expanded' : ''}`}>
        <div className="EmpAssets-search-container">
          <div className="EmpAssets-search-input">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, asset, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="EmpAssets-filter-options">
          {/* Only show department filter for users who can view all departments */}
          {(isOwner || isAdmin || isHR) && (
            <div className="EmpAssets-department-filter">
              <FiBriefcase />
              <select 
                value={selectedDepartment} 
                onChange={handleDepartmentChange}
              >
                <option value="">All Departments</option>
                {departments.length > 0 ? (
                  departments.map((dept, index) => (
                    <option key={index} value={dept}>
                      {dept}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No departments found</option>
                )}
              </select>
            </div>
          )}
          
          {/* For non-privileged users, show read-only department info */}
          {!isOwner && !isAdmin && !isHR && currentUserDepartment && (
            <div className="EmpAssets-department-readonly">
              <FiBriefcase />
              <span>Department: {getDepartmentName(currentUserDepartment)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedDepartment || statusFilter) && (
        <div className="EmpAssets-active-filters">
          <span className="EmpAssets-active-filters-label">Active Filters:</span>
          {selectedDepartment && (
            <span className="EmpAssets-filter-tag">
              Department: {selectedDepartment}
              <button onClick={() => setSelectedDepartment('')}>×</button>
            </span>
          )}
          {statusFilter && (
            <span className="EmpAssets-filter-tag">
              Status: {statusFilter}
              <button onClick={() => {
                setStatusFilter('');
                setSelectedStat('All');
              }}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="EmpAssets-table-container">
        <table className="EmpAssets-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Asset</th>
              <th>Status</th>
              <th>Comment</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <tr key={req._id} className={getRowClass(req.status)}>
                  <td>
                    <div className="EmpAssets-employee-cell">
                      <div className="EmpAssets-employee-avatar">
                        {getInitials(req.user?.name)}
                      </div>
                      <div className="EmpAssets-employee-info">
                        <h4>{req.user?.name || 'Unknown User'}</h4>
                        <p>{req.user?.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="EmpAssets-department-badge">
                      {getDepartmentName(req.department)}
                    </span>
                  </td>
                  <td>
                    <span className={`EmpAssets-chip ${getAssetClass(req.assetName)}`}>
                      {req.assetName || 'Unknown Asset'}
                    </span>
                  </td>
                  <td>
                    <span className={`EmpAssets-chip ${getStatusClass(req.status)}`}>
                      {req.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>
                    <div 
                      className={`EmpAssets-comment-badge ${req.adminComment ? 'EmpAssets-has-comment' : 'EmpAssets-no-comment'}`}
                      title={req.adminComment || "Click to add comment"}
                      onClick={() => handleCommentEditOpen(req)}
                    >
                      <FiMessageCircle size={12} />
                      <span>{req.adminComment ? 
                        (req.adminComment.length > 20 ? req.adminComment.substring(0, 20) + '...' : req.adminComment) 
                        : 'Add Comment'}
                      </span>
                    </div>
                  </td>
                  <td className="EmpAssets-actions-cell">
                    <div className="EmpAssets-actions-container">
                      {req.status === 'pending' && canApproveRequest() && (
                        <>
                          <button 
                            className="EmpAssets-status-btn EmpAssets-approve"
                            onClick={() => handleStatusChange(req._id, 'approved')}
                            disabled={actionLoading}
                          >
                            Approve
                          </button>
                          <button 
                            className="EmpAssets-status-btn EmpAssets-reject"
                            onClick={() => handleStatusChange(req._id, 'rejected')}
                            disabled={actionLoading}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === 'pending' && !canApproveRequest() && (
                        <span className="EmpAssets-no-permission" title="Only Owners, Admins, HR, and Managers can approve">
                          <FiLock size={14} />
                        </span>
                      )}
                      
                      {canEditComment() && (
                        <button 
                          className="EmpAssets-icon-button EmpAssets-edit"
                          title="Edit Comment"
                          onClick={() => handleCommentEditOpen(req)}
                          disabled={actionLoading}
                        >
                          <FiEdit />
                        </button>
                      )}
                      
                      {canDeleteRequest() && (
                        <button 
                          className="EmpAssets-icon-button EmpAssets-delete"
                          title="Delete Request"
                          onClick={() => handleDelete(req._id)}
                          disabled={actionLoading}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="EmpAssets-empty-state">
                  <FiPackage size={40} />
                  <h3>No Asset Requests Found</h3>
                  <p>Try adjusting your filters or search criteria</p>
                  {getActiveFilterCount() > 0 && (
                    <button 
                      className="EmpAssets-clear-filters-btn"
                      onClick={handleClearFilters}
                    >
                      Clear All Filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comment Dialog */}
      {editingCommentReq && (
        <div className="EmpAssets-dialog-overlay">
          <div className="EmpAssets-dialog">
            <div className="EmpAssets-dialog-header">
              <h2>Edit Admin Comment</h2>
              <p>Request from: {editingCommentReq.user?.name} | Department: {getDepartmentName(editingCommentReq.department)}</p>
            </div>
            <div className="EmpAssets-dialog-body">
              <textarea
                className="EmpAssets-textarea-field"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment..."
                rows={5}
                autoFocus
              />
            </div>
            <div className="EmpAssets-dialog-footer">
              <button 
                className="EmpAssets-btn EmpAssets-btn-cancel"
                onClick={() => setEditingCommentReq(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="EmpAssets-btn EmpAssets-btn-save"
                onClick={handleCommentUpdate}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar Notification */}
      {notification && (
        <div className="EmpAssets-snackbar" onClick={() => setNotification(null)}>
          <div className={`EmpAssets-snackbar-content ${notification.severity}`}>
            {notification.severity === 'error' ? <FiXCircle /> : <FiCheckCircle />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpAssets;