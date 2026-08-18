import React, { useEffect, useRef, useState } from 'react';
import axios from '../../../utils/axiosConfig';
import CIISLoader from '../../../Loader/CIISLoader';
import {
  FiEdit, FiTrash2, FiPackage, FiCheckCircle,
  FiXCircle, FiClock, FiMessageCircle,
  FiAlertCircle,
  FiUsers, FiLock, FiEyeOff,
  FiShield, FiHome, FiUpload, FiImage, FiX,
  FiEye, FiSend, FiSave, FiPaperclip, FiTrash2 as FiDelete, FiFileText,
  FiSearch, FiFilter, FiDownload, FiRefreshCw, FiMoreVertical, FiCalendar
} from 'react-icons/fi';
import './EmpAssets.css';
import { API_URL_IMG } from '../../../config';
import { usePageBranchScope } from '../../components/PageBranchDropdown';

const EmpAssets = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStat, setSelectedStat] = useState('all');
  const [notification, setNotification] = useState(null);
  const [editingCommentReq, setEditingCommentReq] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentImages, setCommentImages] = useState([]);
  const [isDraggingCommentFiles, setIsDraggingCommentFiles] = useState(false);
  const [commentLightbox, setCommentLightbox] = useState(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [attachmentDeleteError, setAttachmentDeleteError] = useState('');
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    returnRequested: 0,
    pendingVerification: 0,
    deposited: 0
  });
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});

  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserDepartment, setCurrentUserDepartment] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserCompanyId, setCurrentUserCompanyId] = useState('');
  const [currentUserCompanyCode, setCurrentUserCompanyCode] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [approverPermissionUserIds, setApproverPermissionUserIds] = useState([]);
  const [deletePermissionUserIds, setDeletePermissionUserIds] = useState([]);
  
  
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const {
    branchOptions,
    selectedBranchId,
    setSelectedBranchId,
    branchQueryParams
  } = usePageBranchScope();
  const [permissions, setPermissions] = useState({
    canViewAllRequests: false,
    canApproveRequests: false,
    canDeleteRequests: false,
    canExportData: false,
    canViewHistory: true
  });

  
  const companyCode = localStorage.getItem('companyCode') || 'Mohit';

  const getUploadUrls = (fileValue) => {
    if (!fileValue) return [];
    const filePath = typeof fileValue === 'object'
      ? (fileValue.url || fileValue.path || fileValue.filePath || fileValue.imageUrl || fileValue.filename || '')
      : fileValue;
    if (!filePath) return [];
    const base = (API_URL_IMG || window.location.origin).replace(/\/$/, '');
    const originalPath = String(filePath).trim();
    const normalizedPath = originalPath.replace(/\\/g, '/');
    const uploadPath = normalizedPath
      .replace(/^https?:\/\/[^/]+\//i, '')
      .replace(/^\/+/, '')
      .replace(/^public\//i, '')
      .replace(/^api\/uploads\//i, '')
      .replace(/^uploads\//i, '');

    return [...new Set([
      ...(/^https?:\/\//i.test(originalPath) ? [originalPath] : []),
      `${base}/uploads/${uploadPath}`,
      `${base}/api/uploads/${uploadPath}`,
      `${base}/${normalizedPath.replace(/^\/+/, '')}`,
    ])];
  };

  const getUploadUrl = (filePath) => getUploadUrls(filePath)[0] || '';

  const handleStoredImageError = (event, filePath) => {
    const image = event.currentTarget;
    const urls = getUploadUrls(filePath);
    const nextIndex = Number(image.dataset.urlIndex || 0) + 1;
    if (nextIndex < urls.length) {
      image.dataset.urlIndex = String(nextIndex);
      image.src = urls[nextIndex];
    }
  };

  const openStoredImage = (filePath, name) => {
    const urls = getUploadUrls(filePath);
    if (urls.length) setCommentLightbox({ src: urls[0], urls, urlIndex: 0, name });
  };
  
  
  
  useEffect(() => {
    fetchCurrentUserAndCompany();
  }, []);

  
  useEffect(() => { 
    if (currentUserCompanyCode) {
      fetchRequests();
    }
  }, [currentUserCompanyCode, isOwner, approverPermissionUserIds, deletePermissionUserIds, currentUserId, branchQueryParams.branchId]);

  
  useEffect(() => {
    if (currentUserCompanyId) {
      fetchDepartments();
      fetchAssetPagePermissions();
    }
  }, [currentUserCompanyId]);

  
  
  
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

  const fetchAssetPagePermissions = async () => {
    try {
      const res = await axios.get('/page-permissions/by-path', {
        params: { path: '/ciisUser/emp-assets' },
        cache: false
      });
      const approverIds = (res.data?.page?.approvers || [])
        .map(user => String(user?._id || user?.id || user))
        .filter(Boolean);
      const deleteIds = (res.data?.page?.deleteUsers || [])
        .map(user => String(user?._id || user?.id || user))
        .filter(Boolean);

      setApproverPermissionUserIds(approverIds);
      setDeletePermissionUserIds(deleteIds);
    } catch (error) {
      console.error('Failed to load asset page permissions:', error);
      setApproverPermissionUserIds([]);
      setDeletePermissionUserIds([]);
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
      }
      if (branchQueryParams.branchId) {
        params.push(`branchId=${branchQueryParams.branchId}`);
      }
      
      
      if (!isOwner && !isAdmin && !isHR && !hasConfiguredPageAccess()) {
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
      
      
      if (!isOwner && !isAdmin && !isHR && !hasConfiguredPageAccess() && currentUserDepartment) {
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
      setLastUpdated(new Date());
      
      
      extractDepartmentsFromRequests(requestsData);
    } catch (err) {
      setNotification({ message: 'Failed to fetch requests', severity: 'error' });
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const normalize = (value) => String(value || '').toLowerCase();
    const pending = data.filter(r => normalize(r.status) === 'pending').length;
    const approved = data.filter(r => normalize(r.status) === 'approved').length;
    const rejected = data.filter(r => normalize(r.status) === 'rejected').length;
    const returnRequested = data.filter(r => normalize(r.status) === 'return_requested').length;
    const pendingVerification = data.filter(r => normalize(r.status) === 'pending_verification').length;
    const deposited = data.filter(r => normalize(r.status) === 'deposited').length;
    setStats({ total: data.length, pending, approved, rejected, returnRequested, pendingVerification, deposited });
  };

  
  
  
  const canApproveRequest = () => {
    if (approverPermissionUserIds.length > 0 || deletePermissionUserIds.length > 0) {
      return hasConfiguredPageAccess();
    }

    return isOwner === true || isAdmin === true || isHR === true || isManager === true;
  };

  const canDeleteRequest = () => {
    if (deletePermissionUserIds.length > 0) {
      return deletePermissionUserIds.includes(String(currentUserId));
    }

    return isOwner === true || isAdmin === true || isHR === true;
  };

  const canEditComment = () => {
    if (approverPermissionUserIds.length > 0 || deletePermissionUserIds.length > 0) {
      return hasConfiguredPageAccess();
    }

    return isOwner === true || isAdmin === true || isHR === true || isManager === true;
  };

  const hasConfiguredPageAccess = () => (
    approverPermissionUserIds.includes(String(currentUserId)) ||
    deletePermissionUserIds.includes(String(currentUserId))
  );

  
  
  
  const handleStatFilter = (type) => {
    if (type === 'all' || selectedStat === type) {
      setSelectedStat('all');
      setStatusFilter('');
    } else {
      setSelectedStat(type);
      setStatusFilter(type);
    }
  };

  const normalizeStatus = (status) => String(status || '').toLowerCase();

  const getStatusLabel = (status) => {
    switch (normalizeStatus(status)) {
      case 'approved':
        return 'Assigned';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'return_requested':
        return 'Return Requested';
      case 'pending_verification':
        return 'Pending Verification';
      case 'deposited':
        return 'Deposited';
      default:
        return status || 'Unknown';
    }
  };

  const getRequestActionLabel = (status) => {
    switch (normalizeStatus(status)) {
      case 'return_requested':
        return 'Pending Return Request';
      case 'pending_verification':
        return 'Pending Verification';
      case 'deposited':
        return 'Deposited';
      default:
        return getStatusLabel(status);
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

  const getEmployeeCode = (request) => (
    request?.user?.employeeId ||
    request?.user?.employeeCode ||
    request?.user?.empCode ||
    request?.user?.empId ||
    request?.employeeId ||
    request?.employeeCode ||
    request?.empCode ||
    request?.empId ||
    ''
  );

  const formatDateParts = (value) => {
    if (!value) return { date: 'N/A', time: '' };
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return { date: 'N/A', time: '' };
    return {
      date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const exportVisibleRequests = () => {
    const rows = filteredRequests.map((req) => {
      const requestDate = formatDateParts(req.createdAt || req.requestedAt);
      return {
        Employee: req.user?.name || 'Unknown User',
        EmployeeCode: getEmployeeCode(req) || '',
        Department: getDepartmentName(req.department),
        Asset: req.assetName || req.asset?.name || req.asset?.assetName || 'Unknown Asset',
        Status: getStatusLabel(req.status),
        RequestDate: requestDate.date,
        RequestTime: requestDate.time,
        CommentCount: req.adminComments?.length || 0
      };
    });

    const header = Object.keys(rows[0] || {
      Employee: '',
      EmployeeCode: '',
      Department: '',
      Asset: '',
      Status: '',
      RequestDate: '',
      RequestTime: '',
      CommentCount: ''
    });

    const csv = [
      header.join(','),
      ...rows.map(row => header.map(key => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
      companyCode: request?.companyCode || currentUserCompanyCode || companyCode,
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
      await fetchRequests();
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

  const handleRaiseReturnRequest = async (request) => {
    if (!canApproveRequest()) {
      setNotification({
        message: '⛔ Access Denied: Only Owner, Admin, HR, or Manager can raise return requests',
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
      await axios.post(`/asset-requests/${reqId}/return-request`, {}, { _skipErrorNotify: true });
      setNotification({ message: 'Return request raised successfully', severity: 'success' });
      await fetchRequests();
    } catch (err) {
      setNotification({
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to raise return request',
        severity: 'error'
      });
      console.error('Return request error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDepositSubmission = async (request) => {
    const reqId = getRequestId(request);
    if (!reqId) {
      setNotification({ message: 'Request ID missing. Please refresh and try again.', severity: 'error' });
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`/asset-requests/${reqId}/deposit`, {}, { _skipErrorNotify: true });
      setNotification({ message: 'Deposit marked successfully', severity: 'success' });
      await fetchRequests();
    } catch (err) {
      setNotification({
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to submit deposit',
        severity: 'error'
      });
      console.error('Deposit submission error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeposit = async (request) => {
    if (!canApproveRequest()) {
      setNotification({
        message: '⛔ Access Denied: Only Owner, Admin, HR, or Manager can confirm deposits',
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
      await axios.post(`/asset-requests/${reqId}/confirm-deposit`, {}, { _skipErrorNotify: true });
      setNotification({ message: 'Deposit confirmed successfully', severity: 'success' });
      await fetchRequests();
    } catch (err) {
      setNotification({
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to confirm deposit',
        severity: 'error'
      });
      console.error('Confirm deposit error:', err);
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
    setCommentText(localStorage.getItem(`asset-comment-draft-${req._id}`) || '');
    setCommentImages([]);
  };

  const addCommentImages = (files) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const availableSlots = 5 - commentImages.length;
    const selectedFiles = Array.from(files || []).slice(0, availableSlots);
    const validFiles = selectedFiles.filter(file => (
      allowedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024
    ));

    if (!availableSlots) {
      setNotification({ message: 'You can upload up to 5 images', severity: 'error' });
      return;
    }

    if (validFiles.length !== selectedFiles.length) {
      setNotification({ message: 'Some files were skipped. Use images, PDF, DOC, or DOCX up to 5 MB', severity: 'error' });
    }

    setCommentImages(current => [
      ...current,
      ...validFiles.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };

  const handleCommentImageChange = (event) => {
    addCommentImages(event.target.files);
    event.target.value = '';
  };

  const removeCommentImage = (imageId) => {
    setCommentImages(current => {
      const removed = current.find(item => item.id === imageId);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter(item => item.id !== imageId);
    });
  };

  const clearCommentImages = () => {
    commentImages.forEach(item => URL.revokeObjectURL(item.preview));
    setCommentImages([]);
  };

  const closeCommentDialog = () => {
    clearCommentImages();
    setEditingCommentReq(null);
    setIsDraggingCommentFiles(false);
    setCommentLightbox(null);
  };

  const handleSaveCommentDraft = () => {
    localStorage.setItem(`asset-comment-draft-${editingCommentReq._id}`, commentText);
    setNotification({ message: 'Draft saved on this device', severity: 'success' });
  };

  const handleCommentUpdate = async () => {
    if (!canEditComment()) {
      setNotification({ 
        message: '⛔ Access Denied: Only Owner, Admin, HR, or Manager can edit comments', 
        severity: 'error' 
      });
      return;
    }

    if (!commentText.trim() && !commentImages.length) {
      setNotification({ message: 'Please write a comment or upload an image', severity: 'error' });
      return;
    }
    
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('adminComment', commentText.trim());
      commentImages.forEach((item, index) => {
        formData.append(index === 0 ? 'commentImage' : 'commentImages', item.file);
      });
      await axios.patch(`/asset-requests/update/${editingCommentReq._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      localStorage.removeItem(`asset-comment-draft-${editingCommentReq._id}`);
      setNotification({ message: 'Comment saved and employee notified', severity: 'success' });
      
        await fetchRequests();
        setCommentText('');
        closeCommentDialog();
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'Failed to update comment', severity: 'error' });
      console.error('Comment update error:', err);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleDeleteSavedAttachment = async (commentId) => {
    if (!commentId || actionLoading) return;
    setAttachmentDeleteError('');
    setActionLoading(true);
    try {
      const response = await axios.delete(`/asset-requests/update/${editingCommentReq._id}/comments/${commentId}/attachment`);
      const updatedRequest = response.data?.request;
      if (updatedRequest) setEditingCommentReq(current => ({ ...current, ...updatedRequest }));
      await fetchRequests();
      setNotification({ message: 'Attachment deleted successfully', severity: 'success' });
      setAttachmentToDelete(null);
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to delete attachment';
      setAttachmentDeleteError(message);
      setNotification({ message, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
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
    const statusMatch = !statusFilter || String(req.status || '').toLowerCase() === statusFilter;
    const departmentMatch = !departmentFilter || String(req.department?._id || req.department || req.departmentId || '').toLowerCase() === departmentFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const searchMatch = !q || [
      req.user?.name,
      req.user?.email,
      getEmployeeCode(req),
      req.assetName,
      req.asset?.name,
      req.asset?.assetName,
      getDepartmentName(req.department),
      req._id
    ].some(value => String(value || '').toLowerCase().includes(q));
    return statusMatch && departmentMatch && searchMatch;
  });

  const getStatusClass = (status) => {
    switch(normalizeStatus(status)) {
      case 'approved': return 'EmpAssets-chip-status-approved';
      case 'pending': return 'EmpAssets-chip-status-pending';
      case 'rejected': return 'EmpAssets-chip-status-rejected';
      case 'return_requested': return 'EmpAssets-chip-status-return-requested';
      case 'pending_verification': return 'EmpAssets-chip-status-pending-verification';
      case 'deposited': return 'EmpAssets-chip-status-deposited';
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
    switch(normalizeStatus(status)) {
      case 'approved': return 'EmpAssets-table-row-approved';
      case 'pending': return 'EmpAssets-table-row-pending';
      case 'rejected': return 'EmpAssets-table-row-rejected';
      case 'return_requested': return 'EmpAssets-table-row-return-requested';
      case 'pending_verification': return 'EmpAssets-table-row-pending-verification';
      case 'deposited': return 'EmpAssets-table-row-deposited';
      default: return '';
    }
  };

  const getAvatarClass = (type) => {
    switch(normalizeStatus(type)) {
      case 'all': return 'EmpAssets-avatar-primary';
      case 'pending': return 'EmpAssets-avatar-warning';
      case 'approved': return 'EmpAssets-avatar-success';
      case 'return_requested': return 'EmpAssets-avatar-warning';
      case 'pending_verification': return 'EmpAssets-avatar-primary';
      case 'deposited': return 'EmpAssets-avatar-success';
      case 'rejected': return 'EmpAssets-avatar-error';
      default: return '';
    }
  };

  const getActiveClass = (type, selected) => {
    if (selected !== type) return '';
    switch(normalizeStatus(type)) {
      case 'all': return 'EmpAssets-active EmpAssets-active-primary';
      case 'pending': return 'EmpAssets-active EmpAssets-active-warning';
      case 'approved': return 'EmpAssets-active EmpAssets-active-success';
      case 'return_requested': return 'EmpAssets-active EmpAssets-active-warning';
      case 'pending_verification': return 'EmpAssets-active EmpAssets-active-primary';
      case 'deposited': return 'EmpAssets-active EmpAssets-active-success';
      case 'rejected': return 'EmpAssets-active EmpAssets-active-error';
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
        <div className="EmpAssets-header-copy">
          <h1>Asset Requests Management</h1>
          <p>
            Review and manage employee asset requests across all branches
            <RoleBadge />
            {!canApproveRequest() && (
              <span className="EmpAssets-view-only-badge">
                <FiEyeOff size={14} />
                View Only
              </span>
            )}
          </p>
        </div>
        <div className="EmpAssets-header-meta">
          <div className="EmpAssets-last-updated">
            <FiClock size={15} />
            <span>
              Last updated: {lastUpdated
                ? new Date(lastUpdated).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Just now'}
            </span>
          </div>
          <button type="button" className="EmpAssets-refresh-btn" onClick={fetchRequests} disabled={loading || actionLoading}>
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <section className="EmpAssets-filter-shell">
        <div className="EmpAssets-filter-grid">
          <div className="EmpAssets-filter-field">
            <label htmlFor="branch-filter">Branch</label>
            <div className="EmpAssets-select-wrap">
              <FiFilter size={16} />
              <select
                id="branch-filter"
                className="EmpAssets-select"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                {branchOptions.map(option => (
                  <option key={option.id || 'all-branches'} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="EmpAssets-filter-field">
            <label htmlFor="department-filter">Department</label>
            <div className="EmpAssets-select-wrap">
              <FiUsers size={16} />
              <select
                id="department-filter"
                className="EmpAssets-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((dept) => {
                  const deptId = typeof dept === 'object' ? (dept._id || dept.id || dept.name) : dept;
                  const deptLabel = typeof dept === 'object' ? (dept.name || dept.departmentName || dept.title || deptId) : dept;
                  return (
                    <option key={deptId} value={String(deptId || deptLabel)}>
                      {deptLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="EmpAssets-filter-field">
            <label htmlFor="status-filter">Status</label>
            <div className="EmpAssets-select-wrap">
              <FiFilter size={16} />
              <select
                id="status-filter"
                className="EmpAssets-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setSelectedStat(e.target.value || 'all');
                }}
              >
                <option value="">All Status</option>
                <option value="approved">Assigned</option>
                <option value="return_requested">Return Requested</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="deposited">Deposited</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="EmpAssets-filter-field EmpAssets-search-field">
            <label htmlFor="asset-search">Search</label>
            <div className="EmpAssets-search-wrap">
              <FiSearch size={16} />
              <input
                id="asset-search"
                type="search"
                className="EmpAssets-search"
                placeholder="Search by employee name, asset, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="EmpAssets-filter-actions">
          <button type="button" className="EmpAssets-export-btn" onClick={exportVisibleRequests} disabled={!filteredRequests.length}>
            <FiDownload size={16} />
            Export
          </button>
          <button
            type="button"
            className="EmpAssets-reset-btn"
            onClick={() => {
              setSelectedStat('all');
              setStatusFilter('');
              setDepartmentFilter('');
              setSearchQuery('');
            }}
          >
            <FiRefreshCw size={16} />
            Reset Filters
          </button>
        </div>

        <div className="EmpAssets-filter-footer">
          <span>{filteredRequests.length} results found</span>
          <span className="EmpAssets-filter-scope">
            <FiCalendar size={14} />
            {selectedBranchId ? 'Branch filtered' : 'All branches'}
          </span>
        </div>
      </section>

      
      {!canApproveRequest() && (
        <div className="EmpAssets-warning-banner">
          <div className="EmpAssets-warning-content">
            <FiLock size={20} />
            <div className="EmpAssets-warning-text">
              <strong>🔒 View Only Mode</strong>
              <p>You are viewing asset requests from your department only. Users selected in Page Management can approve/reject requests.</p>
            </div>
          </div>
        </div>
      )}

      
      {!isOwner && !isAdmin && !isHR && !isManager && !hasConfiguredPageAccess() && currentUserDepartment && (
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

      <div className="EmpAssets-stats-grid">
        {[
          { label: 'Total Requests', count: stats.total, color: 'primary', type: 'all', icon: <FiPackage />, alwaysShow: true, hint: 'All time requests' },
          { label: 'Assigned', count: stats.approved, color: 'success', type: 'approved', icon: <FiCheckCircle />, hint: 'Currently assigned' },
          { label: 'Return Requested', count: stats.returnRequested, color: 'warning', type: 'return_requested', icon: <FiAlertCircle />, hint: 'Awaiting employee action' },
          { label: 'Pending Verification', count: stats.pendingVerification, color: 'primary', type: 'pending_verification', icon: <FiClock />, hint: 'Waiting for deposit' },
          { label: 'Deposited', count: stats.deposited, color: 'success', type: 'deposited', icon: <FiCheckCircle />, hint: 'Successfully deposited' },
          { label: 'Rejected', count: stats.rejected, color: 'error', type: 'rejected', icon: <FiXCircle />, hint: 'Requests rejected' },
        ]
          .filter(item => item.alwaysShow || item.count > 0)
          .map((item) => (
            <button
              type="button"
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
                  <p>{item.hint}</p>
                </div>
              </div>
            </button>
          ))}
      </div>

      <div className="EmpAssets-table-container">
        <table className="EmpAssets-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>DEPARTMENT</th>
              <th>ASSET</th>
              <th>STATUS</th>
              <th>REQUEST DATE</th>
              <th>COMMENT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                const requestDate = new Date(req.createdAt || req.requestedAt || Date.now());
                const hasValidDate = !Number.isNaN(requestDate.getTime());
                const commentCount = req.adminComments?.length || 0;
                const assetName = req.assetName || req.asset?.name || req.asset?.assetName || 'Unknown Asset';

                return (
                  <tr key={req._id} className={getRowClass(req.status)}>
                    <td>
                      <div className="EmpAssets-employee-cell">
                        <div className="EmpAssets-employee-avatar">
                          {getInitials(req.user?.name)}
                        </div>
                        <div className="EmpAssets-employee-info">
                          <h4>{req.user?.name || 'Unknown User'}</h4>
                          <p>{getEmployeeCode(req) || req.user?.email || 'No employee code'}</p>
                          <small>{req.user?.email || 'No email'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="EmpAssets-department-badge">
                        {getDepartmentName(req.department)}
                      </span>
                    </td>
                    <td>
                      <div className="EmpAssets-asset-cell">
                        <strong>{assetName}</strong>
                        <span>{req.asset?.model || req.asset?.description || req.assetName || 'IT Asset'}</span>
                        <small>{req.assetType || req.assetCategory || 'IT Asset'}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`EmpAssets-chip ${getStatusClass(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td>
                      <div className="EmpAssets-date-cell">
                        <strong>{hasValidDate ? requestDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</strong>
                        <span>{hasValidDate ? requestDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`EmpAssets-comment-badge ${commentCount > 0 ? 'EmpAssets-has-comment' : 'EmpAssets-no-comment'}`}
                        title={commentCount > 0 ? 'View comments' : 'Click to add comment'}
                        onClick={() => handleCommentEditOpen(req)}
                      >
                        <FiMessageCircle size={12} />
                        <span>{commentCount > 0 ? String(commentCount) : 'Add Comment'}</span>
                      </button>
                    </td>
                    <td className="EmpAssets-actions-cell">
                      <div className="EmpAssets-actions-container">
                        {normalizeStatus(req.status) === 'pending' && canApproveRequest() && (
                          <>
                            <button
                              type="button"
                              className="EmpAssets-status-btn EmpAssets-approve"
                              onClick={() => handleStatusChange(req, 'approved')}
                              disabled={actionLoading}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="EmpAssets-status-btn EmpAssets-reject"
                              onClick={() => handleStatusChange(req, 'rejected')}
                              disabled={actionLoading}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {normalizeStatus(req.status) === 'approved' && canApproveRequest() && (
                          <button
                            type="button"
                            className="EmpAssets-status-btn EmpAssets-approve"
                            onClick={() => handleRaiseReturnRequest(req)}
                            disabled={actionLoading}
                          >
                            Raise Return Request
                          </button>
                        )}
                        {normalizeStatus(req.status) === 'return_requested' && (
                          <span className="EmpAssets-no-permission" title="Waiting for employee to deposit the asset">
                            <FiClock size={14} />
                          </span>
                        )}
                        {normalizeStatus(req.status) === 'pending_verification' && canApproveRequest() && (
                          <button
                            type="button"
                            className="EmpAssets-status-btn EmpAssets-approve"
                            onClick={() => handleConfirmDeposit(req)}
                            disabled={actionLoading}
                          >
                            Confirm Deposit
                          </button>
                        )}
                        {normalizeStatus(req.status) === 'deposited' && (
                          <span className="EmpAssets-no-permission" title="Deposit confirmed and asset returned">
                            <FiCheckCircle size={14} />
                          </span>
                        )}
                        {normalizeStatus(req.status) === 'pending' && !canApproveRequest() && (
                          <span className="EmpAssets-no-permission" title="Only Owners, Admins, HR, and Managers can approve">
                            <FiLock size={14} />
                          </span>
                        )}

                        {canEditComment() && (
                          <button
                            type="button"
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
                            type="button"
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
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="EmpAssets-empty-state">
                  <FiPackage size={40} />
                  <h3>No Asset Requests Found</h3>
                  <p>No asset requests found for the selected filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      
      {editingCommentReq && (
        <div className="EmpAssets-dialog-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !actionLoading) closeCommentDialog();
        }}>
          <div className="EmpAssets-dialog" role="dialog" aria-modal="true" aria-labelledby="asset-comment-title">
            <div className="EmpAssets-dialog-header">
              <h2 id="asset-comment-title">Edit Admin Comment</h2>
              <button type="button" className="EmpAssets-dialog-close" onClick={closeCommentDialog} disabled={actionLoading} aria-label="Close"><FiX /></button>
            </div>
            <div className="EmpAssets-dialog-body">
              <section className="EmpAssets-request-summary">
                <span className="EmpAssets-request-avatar">{getInitials(editingCommentReq.user?.name)}</span>
                <div className="EmpAssets-request-person">
                  <strong>{editingCommentReq.user?.name || 'Employee'}</strong>
                  <small>{getDepartmentName(editingCommentReq.department)}</small>
                </div>
                <div><small>Request ID</small><strong>#{String(editingCommentReq._id || '').slice(-7).toUpperCase()}</strong></div>
                <div><small>Request Type</small><strong>{editingCommentReq.assetName || editingCommentReq.asset?.name || 'Asset Request'}</strong></div>
                <div className="EmpAssets-request-status">
                  <em>{getStatusLabel(editingCommentReq.status) || 'Pending Review'}</em>
                  <small>Requested on</small>
                  <strong>{new Date(editingCommentReq.createdAt || Date.now()).toLocaleString()}</strong>
                </div>
              </section>

              <label className="EmpAssets-comment-label" htmlFor="asset-admin-comment">Admin Comment <b>*</b></label>
              <div className="EmpAssets-comment-editor">
                <textarea
                  id="asset-admin-comment"
                  className="EmpAssets-textarea-field"
                  value={commentText}
                  maxLength={500}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your comment here..."
                  rows={3}
                  autoFocus
                />
                <div className="EmpAssets-editor-tools">
                  <span>
                    <button type="button" onClick={() => documentInputRef.current?.click()} title="Attach PDF, DOC, or DOCX" aria-label="Attach document"><FiPaperclip /></button>
                    <button type="button" onClick={() => imageInputRef.current?.click()} title="Attach images" aria-label="Attach images"><FiImage /></button>
                  </span>
                  <small>{commentText.length} / 500</small>
                  <input ref={documentInputRef} type="file" multiple accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleCommentImageChange} hidden />
                  <input ref={imageInputRef} type="file" multiple accept="image/jpeg,image/png,image/jpg,image/webp,image/gif" onChange={handleCommentImageChange} hidden />
                </div>
              </div>

              <label
                className={`EmpAssets-comment-dropzone ${isDraggingCommentFiles ? 'is-dragging' : ''}`}
                onDragEnter={(event) => { event.preventDefault(); setIsDraggingCommentFiles(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsDraggingCommentFiles(false); }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingCommentFiles(false);
                  addCommentImages(event.dataTransfer.files);
                }}
              >
                <span><FiUpload /></span>
                <div><strong>Drag & drop files here or <b>browse files</b></strong><small>JPG, PNG, WEBP, GIF, PDF, DOC, DOCX · Max 5 MB each · Up to 5 files</small></div>
                <input type="file" multiple accept="image/jpeg,image/png,image/jpg,image/webp,image/gif,.pdf,.doc,.docx" onChange={handleCommentImageChange} disabled={actionLoading || commentImages.length >= 5} />
              </label>

              {(commentImages.length > 0 || editingCommentReq.adminComments?.some(comment => comment.image)) && (
                <section className="EmpAssets-attachments">
                  <header>
                    <strong>Attachments ({commentImages.length + (editingCommentReq.adminComments?.filter(comment => comment.image).length || 0)})</strong>
                    <span>{commentImages.length ? `Selected: ${(commentImages.reduce((total, item) => total + item.file.size, 0) / 1024 / 1024).toFixed(2)} MB` : 'Previously uploaded'}</span>
                  </header>
                  {!!commentImages.length && (
                    <div className="EmpAssets-pending-comment">
                      <span><FiClock /></span>
                      <div>
                        <strong>Not uploaded yet</strong>
                        <p>
                          {commentText.trim()
                            ? `These files will be uploaded with your comment: “${commentText.trim()}”`
                            : 'Write an admin comment above, then click “Save Comment & Notify Employee” to upload them together.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="EmpAssets-attachment-grid">
                    {editingCommentReq.adminComments?.filter(comment => comment.image).map((comment, index) => {
                      const imageUrl = getUploadUrl(comment.image);
                      const imageName = comment.originalName || String(comment.image).replace(/\\/g, '/').split('/').pop() || `Attachment ${index + 1}`;
                      return (
                        <article key={`saved-${index}`}>
                          <div>
                            {comment.mimeType && !comment.mimeType.startsWith('image/') ? <span className="EmpAssets-document-tile"><FiFileText /></span> : <img src={imageUrl} alt={imageName} data-url-index="0" onError={(event) => handleStoredImageError(event, comment.image)} onClick={(event) => setCommentLightbox({ src: event.currentTarget.src, urls: getUploadUrls(comment.image), urlIndex: Number(event.currentTarget.dataset.urlIndex || 0), name: imageName })} />}
                            {(!comment.mimeType || comment.mimeType.startsWith('image/')) && <button type="button" className="EmpAssets-attachment-view" onClick={() => openStoredImage(comment.image, imageName)} aria-label={`View ${imageName}`}><FiEye /></button>}
                            <button type="button" className="EmpAssets-attachment-delete" onClick={() => { setAttachmentDeleteError(''); setAttachmentToDelete({ id: comment._id, name: imageName }); }} disabled={actionLoading} aria-label={`Delete ${imageName}`}><FiDelete /></button>
                          </div>
                          <strong title={imageName}>{imageName}</strong>
                          <small>{comment.size ? `${Math.round(comment.size / 1024)} KB` : 'Uploaded'}</small>
                        </article>
                      );
                    })}
                    {commentImages.map(item => (
                      <article key={item.id}>
                        <div>{item.file.type.startsWith('image/') ? <img src={item.preview} alt={item.file.name} onClick={() => setCommentLightbox({ src: item.preview, name: item.file.name })} /> : <span className="EmpAssets-document-tile"><FiFileText /></span>}{item.file.type.startsWith('image/') && <button type="button" className="EmpAssets-attachment-view" onClick={() => setCommentLightbox({ src: item.preview, name: item.file.name })} aria-label={`View ${item.file.name}`}><FiEye /></button>}<button type="button" className="EmpAssets-attachment-delete" onClick={() => removeCommentImage(item.id)} disabled={actionLoading} aria-label={`Remove ${item.file.name}`}><FiDelete /></button></div>
                        <strong title={item.file.name}>{item.file.name}</strong>
                        <small className="EmpAssets-pending-file">{Math.round(item.file.size / 1024)} KB · Pending</small>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className="EmpAssets-activity">
                <strong>Previous Activity</strong>
                <div className="EmpAssets-activity-list">
                  {editingCommentReq?.adminComments?.length > 0 ? (
                  editingCommentReq.adminComments.map((c, i) => (
                    <div key={i} className="EmpAssets-activity-item">
                      <span>{getInitials(c.addedBy?.name || currentUserName)}</span>
                      <div><strong>{c.addedBy?.name || currentUserName || 'Admin'} {c.image ? 'uploaded an image' : 'added a comment'}</strong>{c.text && <p>{c.text}</p>}<small>{c.addedAt ? new Date(c.addedAt).toLocaleString() : 'Previously'}</small></div>
                      {c.image && <button type="button" className="EmpAssets-activity-view" onClick={() => openStoredImage(c.image, 'Comment attachment')}><FiEye /> View</button>}
                    </div>
                  ))
                  ) : <p className="EmpAssets-no-activity">No previous activity yet.</p>}
                </div>
              </section>
            </div>  
            <div className="EmpAssets-dialog-footer">
              <button className="EmpAssets-btn EmpAssets-btn-cancel" onClick={closeCommentDialog} disabled={actionLoading}>Cancel</button>
              <div>
                <button className="EmpAssets-btn EmpAssets-btn-draft" onClick={handleSaveCommentDraft} disabled={actionLoading || !commentText.trim()}><FiSave /> Save Draft</button>
                <button className="EmpAssets-btn EmpAssets-btn-save" onClick={handleCommentUpdate} disabled={actionLoading || (!commentText.trim() && !commentImages.length)}>{actionLoading ? 'Uploading...' : commentText.trim() && commentImages.length ? 'Upload Images With Comment' : 'Save Comment & Notify Employee'} <FiSend /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {attachmentToDelete && (
        <div className="EmpAssets-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-attachment-title">
          <div className="EmpAssets-confirm-dialog">
            <span className="EmpAssets-confirm-icon"><FiDelete /></span>
            <h3 id="delete-attachment-title">Delete attachment?</h3>
            <p><strong>{attachmentToDelete.name}</strong> will be permanently removed from this request.</p>
            {attachmentDeleteError && <p className="EmpAssets-confirm-error">{attachmentDeleteError}</p>}
            <div>
              <button type="button" onClick={() => { setAttachmentToDelete(null); setAttachmentDeleteError(''); }} disabled={actionLoading}>Cancel</button>
              <button type="button" className="danger" onClick={() => handleDeleteSavedAttachment(attachmentToDelete.id)} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete attachment'}</button>
            </div>
          </div>
        </div>
      )}

      {commentLightbox && (
        <div className="EmpAssets-lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCommentLightbox(null);
        }}>
          <div>
            <header><strong>{commentLightbox.name}</strong><button type="button" onClick={() => setCommentLightbox(null)} aria-label="Close image preview"><FiX /></button></header>
            <img
              src={commentLightbox.src}
              alt={commentLightbox.name}
              onError={() => {
                const nextIndex = (commentLightbox.urlIndex || 0) + 1;
                if (commentLightbox.urls && nextIndex < commentLightbox.urls.length) {
                  setCommentLightbox(current => ({ ...current, src: current.urls[nextIndex], urlIndex: nextIndex }));
                }
              }}
            />
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
