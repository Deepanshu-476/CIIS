import React, { useEffect, useState } from 'react';
import axios from '../../../utils/axiosConfig';
import CIISLoader from '../../../Loader/CIISLoader';
import {
  FiEdit, FiTrash2, FiPackage, FiCheckCircle,
  FiXCircle, FiClock, FiMessageCircle, FiSearch, 
  FiUsers, FiBriefcase, FiFilter, FiLock, FiEyeOff,
  FiShield, FiHome, FiUpload, FiImage, FiX
} from 'react-icons/fi';
import './EmpAssets.css';
import { API_URL_IMG } from '../../../config';

const EmpAssets = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStat, setSelectedStat] = useState('All');
  const [notification, setNotification] = useState(null);
  const [editingCommentReq, setEditingCommentReq] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserDepartment, setCurrentUserDepartment] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState('');
  const [currentUserCompanyCode, setCurrentUserCompanyCode] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  
  
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

  
  const companyCode = localStorage.getItem('companyCode') || 'Mohit';

  const getUploadUrl = (filePath) => {
    if (!filePath) return '';
    if (/^https?:\/\//i.test(filePath)) return filePath;

    const base = (API_URL_IMG || window.location.origin).replace(/\/$/, '');
    const cleanPath = String(filePath).replace(/^\/+/, '');

    if (cleanPath.startsWith('api/uploads/')) {
      return `${base}/${cleanPath}`;
    }

    if (cleanPath.startsWith('uploads/')) {
      return `${base}/${cleanPath}`;
    }

    return `${base}/uploads/${cleanPath}`;
  };

  
  
  
  useEffect(() => {
    fetchCurrentUserAndCompany();
  }, []);

  
  useEffect(() => { 
    if (currentUserCompanyCode) {
      fetchRequests();
    }
  }, [selectedCompany, selectedDepartment, currentUserCompanyCode, isOwner]);

  
  useEffect(() => {
    if (currentUserCompanyId) {
      fetchDepartments();
    }
  }, [currentUserCompanyId]);

  useEffect(() => {
    return () => {
      if (commentImagePreview) {
        URL.revokeObjectURL(commentImagePreview);
      }
    };
  }, [commentImagePreview]);

  
  
  
  const fetchCurrentUserAndCompany = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        void 0;
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
      
      void 0;
      const { data } = await axios.get(url);
      
      void 0;
      
      let departmentsData = [];
      let departmentMapping = {};
      
      
      if (data.success && data.departments) {
        departmentsData = data.departments;
      } else if (Array.isArray(data)) {
        departmentsData = data;
      } else if (data.data && Array.isArray(data.data)) {
        departmentsData = data.data;
      }
      
      
      if (Array.isArray(departmentsData)) {
        departmentsData.forEach(dept => {
          const deptId = dept._id || dept.id;
          const deptName = dept.name || dept.departmentName || dept.title;
          if (deptId && deptName) {
            departmentMapping[deptId] = deptName;
          }
        });
      }
      
      void 0;
      
      
      const deptNames = departmentsData.map(dept => dept.name || dept.departmentName || dept).filter(Boolean);
      
      setDepartmentMap(departmentMapping);
      setDepartments(deptNames);
      
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      extractDepartmentsFromRequests(requests);
    }
  };

  
  
  
  const getDepartmentName = (dept) => {
    if (!dept) return 'Not Assigned';
    
    
    if (typeof dept === 'string') {
      
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(dept);
      
      if (!isMongoId) {
        return dept; 
      }
      
      
      if (departmentMap[dept]) {
        return departmentMap[dept];
      }
      
      
      const foundDept = departments.find(d => d._id === dept || d.id === dept);
      if (foundDept) {
        return foundDept.name || foundDept.departmentName || dept;
      }
      
      return 'Department'; 
    }
    
    
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
          
          const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.department);
          if (!isMongoId) {
            deptSet.add(req.department); 
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

  
  
  
  const fetchRequests = async () => {
    setLoading(true);
    try {
      
      let url = `/asset-requests/all`;
      const params = [];
      
      
      if (currentUserCompanyCode) {
        params.push(`companyCode=${currentUserCompanyCode}`);
      } else if (selectedCompany) {
        params.push(`companyCode=${selectedCompany}`);
      }
      
      
      if (!isOwner && !isAdmin && !isHR) {
        if (currentUserDepartment) {
          void 0;
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
        
        if (selectedDepartment) {
          params.push(`department=${selectedDepartment}`);
        }
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      void 0;
      const { data } = await axios.get(url);
      
      let requestsData = [];
      if (data.requests) {
        requestsData = data.requests;
      } else if (Array.isArray(data)) {
        requestsData = data;
      }
      
      void 0;
      
      
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
          void 0;
        }
      }
      
      setRequests(requestsData);
      calculateStats(requestsData);
      
      
      extractDepartmentsFromRequests(requestsData);
    } catch (err) {
      setNotification({ message: 'Failed to fetch requests', severity: 'error' });
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(r => String(r.status || '').toLowerCase() === 'pending').length;
    const approved = data.filter(r => String(r.status || '').toLowerCase() === 'approved').length;
    const rejected = data.filter(r => String(r.status || '').toLowerCase() === 'rejected').length;
    setStats({ total: data.length, pending, approved, rejected });
  };

  
  
  
  const canApproveRequest = () => {
    return isOwner === true || isAdmin === true || isHR === true || isManager === true;
  };

  const canDeleteRequest = () => {
    return isOwner === true || isAdmin === true || isHR === true;
  };

  const canEditComment = () => {
    return isOwner === true || isAdmin === true || isHR === true || isManager === true;
  };

  
  
  
  const handleStatFilter = (type) => {
    if (selectedStat === type) {
      
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

  const getRequestId = (request) => (
    typeof request === 'object' ? request?._id || request?.id : request
  );

  const getRequestUserId = (request) => (
    request?.user?._id ||
    request?.user?.id ||
    request?.userId?._id ||
    request?.userId?.id ||
    request?.userId ||
    request?.requestedBy?._id ||
    request?.requestedBy?.id ||
    request?.requestedBy ||
    ''
  );

  const getRequestAssetId = (request) => (
    request?.assetId?._id ||
    request?.assetId?.id ||
    request?.asset?._id ||
    request?.asset?.id ||
    request?.companyAsset?._id ||
    request?.companyAsset?.id ||
    request?.assetId ||
    request?.asset ||
    request?.companyAsset ||
    ''
  );

  const buildStatusPayload = (request, newStatus) => {
    const actorField = newStatus === 'approved' ? 'approvedBy' : 'rejectedBy';

    return {
      status: newStatus,
      requestStatus: newStatus,
      [actorField]: currentUserId,
      actionBy: currentUserId,
      actionByName: currentUserName,
      adminId: currentUserId,
      adminName: currentUserName,
      companyCode: request?.companyCode || currentUserCompanyCode || selectedCompany,
      company: request?.company?._id || request?.company || currentUserCompanyId,
      userId: getRequestUserId(request),
      assetId: getRequestAssetId(request),
    };
  };

  const patchStatusWithFallbacks = async (reqId, payload) => {
    const attempts = [
      { method: 'patch', url: `/asset-requests/update/${reqId}`, data: payload },
      { method: 'patch', url: `/asset-requests/${reqId}/status`, data: payload },
      { method: 'patch', url: `/asset-requests/${reqId}`, data: payload },
      { method: 'put', url: `/asset-requests/update/${reqId}`, data: payload },
    ];

    let lastError;
    for (const attempt of attempts) {
      try {
        return await axios[attempt.method](attempt.url, attempt.data, { _skipErrorNotify: true });
      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;
        if (![404, 405, 500].includes(statusCode)) {
          throw error;
        }
      }
    }

    throw lastError;
  };

  const handleStatusChange = async (request, newStatus) => {
    if (!canApproveRequest()) {
      setNotification({ 
        message: '⛔ Access Denied: Only Owner, Admin, HR, or Manager can update status', 
        severity: 'error' 
      });
      return;
    }

    const reqId = getRequestId(request);
    if (!reqId) {
      setNotification({ message: 'Request ID missing. Please refresh and try again.', severity: 'error' });
      return;
    }

    setActionLoading(true);
    try {
      
      const payload = buildStatusPayload(request, newStatus);
      await patchStatusWithFallbacks(reqId, payload);
      setNotification({ message: 'Status updated successfully', severity: 'success' });
      fetchRequests();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to update status';
      setNotification({ message, severity: 'error' });
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
    setCommentText('');
    setCommentImage(null);
    setCommentImagePreview('');
  };

  const handleCommentImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setNotification({ message: 'Only JPG, PNG, WEBP, or GIF images are allowed', severity: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ message: 'Image must be 5 MB or smaller', severity: 'error' });
      return;
    }

    if (commentImagePreview) {
      URL.revokeObjectURL(commentImagePreview);
    }

    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const clearCommentImage = () => {
    if (commentImagePreview) {
      URL.revokeObjectURL(commentImagePreview);
    }
    setCommentImage(null);
    setCommentImagePreview('');
  };

  const handleCommentUpdate = async () => {
    if (!canEditComment()) {
      setNotification({ 
        message: '⛔ Access Denied: Only Owner, Admin, HR, or Manager can edit comments', 
        severity: 'error' 
      });
      return;
    }

    if (!commentText.trim() && !commentImage) {
      setNotification({ message: 'Please write a comment or upload an image', severity: 'error' });
      return;
    }
    
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('adminComment', commentText.trim());
      if (commentImage) {
        formData.append('commentImage', commentImage);
      }

      await axios.patch(`/asset-requests/update/${editingCommentReq._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNotification({ message: 'Comment updated successfully', severity: 'success' });
      
        await fetchRequests();

        
        setCommentText('');
        clearCommentImage();
        setEditingCommentReq(null);
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'Failed to update comment', severity: 'error' });
      console.error('Comment update error:', err);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleCompanyFilter = () => {
    if (selectedCompany === currentUserCompanyCode) {
      
      setSelectedCompany('');
    } else {
      setSelectedCompany(currentUserCompanyCode);
    }
    
    fetchDepartments();
  };

  const handleClearFilters = () => {
    setSelectedCompany(currentUserCompanyCode); 
    setSelectedDepartment('');
    setStatusFilter('');
    setSelectedStat('All');
    setSearchTerm('');
    fetchDepartments();
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    
  };

  
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedDepartment) count++;
    if (statusFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  
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
    const statusMatch = !statusFilter || String(req.status || '').toLowerCase() === statusFilter;
    
    
    let departmentMatch = false;
    if (req.department) {
      const deptName = getDepartmentName(req.department);
      departmentMatch = deptName.toLowerCase().includes(searchLower);
    }
    
    return statusMatch && (
      req.user?.name?.toLowerCase().includes(searchLower) ||
      req.user?.email?.toLowerCase().includes(searchLower) ||
      req.assetName?.toLowerCase().includes(searchLower) ||
      req.adminComments?.some(c => 
      c.text?.toLowerCase().includes(searchLower)
    ) ||
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

  
  if (loading) {
    return <CIISLoader />;
  }

  return (
    <div className="EmpAssets-container">
      
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
          
          
          {!isOwner && !isAdmin && !isHR && currentUserDepartment && (
            <div className="EmpAssets-department-readonly">
              <FiBriefcase />
              <span>Department: {getDepartmentName(currentUserDepartment)}</span>
            </div>
          )}
        </div>
      </div>

      
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
                      className={`EmpAssets-comment-badge ${req.adminComments?.length > 0 ? 'EmpAssets-has-comment' : 'EmpAssets-no-comment'}`}
                        title={req.adminComments?.length > 0 ? "View comments" : "Click to add comment"}
                      onClick={() => handleCommentEditOpen(req)}
                    >
                      <FiMessageCircle size={12} />
                     <span>
                        {req.adminComments?.length > 0 ? 'View' : 'Add Comment'}
                      </span>
                    </div>
                  </td>
                  <td className="EmpAssets-actions-cell">
                    <div className="EmpAssets-actions-container">
                      {req.status === 'pending' && canApproveRequest() && (
                        <>
                          <button 
                            className="EmpAssets-status-btn EmpAssets-approve"
                            onClick={() => handleStatusChange(req, 'approved')}
                            disabled={actionLoading}
                          >
                            Approve
                          </button>
                          <button 
                            className="EmpAssets-status-btn EmpAssets-reject"
                            onClick={() => handleStatusChange(req, 'rejected')}
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
                placeholder="Write your comment here..."
                rows={4}
                autoFocus
              />

              <div className="EmpAssets-comment-upload">
                <label className="EmpAssets-comment-upload-btn">
                  <FiUpload size={16} />
                  Upload Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                    onChange={handleCommentImageChange}
                    disabled={actionLoading}
                  />
                </label>
                <span className="EmpAssets-comment-upload-hint">JPG, PNG, WEBP, GIF up to 5 MB</span>
              </div>

              {commentImagePreview && (
                <div className="EmpAssets-comment-image-preview">
                  <img src={commentImagePreview} alt="Selected comment attachment" />
                  <div className="EmpAssets-comment-image-meta">
                    <span>{commentImage?.name}</span>
                    <button type="button" onClick={clearCommentImage} disabled={actionLoading}>
                      <FiX size={14} /> Remove
                    </button>
                  </div>
                </div>
              )}

              
              {editingCommentReq?.adminComments?.length > 0 && (
                <div className="EmpAssets-comments-list">
                  <strong>Comments:</strong>

                  {editingCommentReq.adminComments.map((c, i) => (
                    <div key={i} className="EmpAssets-comment-item">
                      {c.text && <p>{c.text}</p>}
                      {c.image && (
                        <a
                          className="EmpAssets-comment-image-link"
                          href={getUploadUrl(c.image)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FiImage size={14} />
                          <img src={getUploadUrl(c.image)} alt="Comment attachment" />
                        </a>
                      )}
                      {!c.text && !c.image && <p>No comment text</p>}
                    </div>
                  ))}
                </div>
              )}

            </div>  
            <div className="EmpAssets-dialog-footer">
              <button 
                className="EmpAssets-btn EmpAssets-btn-cancel"
                onClick={() => {
                  clearCommentImage();
                  setEditingCommentReq(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="EmpAssets-btn EmpAssets-btn-save"
                onClick={handleCommentUpdate}
                disabled={actionLoading || (!commentText.trim() && !commentImage)}
              >
                {actionLoading ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      
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
