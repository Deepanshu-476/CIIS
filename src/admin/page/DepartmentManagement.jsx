import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import './DepartmentManagement.css';
import CIISLoader from '../../Loader/CIISLoader';

const DepartmentManagement = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [departments, setDepartments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    company: '',  
    companyCode: '' 
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [selectedDeptMenu, setSelectedDeptMenu] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [apiError, setApiError] = useState(null); // 🆕 API error state

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
      setRowsPerPage(mobile ? 5 : tablet ? 8 : 10);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to get user from localStorage
  const getUserFromStorage = () => {
    let userStr = localStorage.getItem('superAdmin');
    if (!userStr) userStr = localStorage.getItem('user');
    if (!userStr) userStr = sessionStorage.getItem('superAdmin') || sessionStorage.getItem('user');
    
    if (!userStr) {
      console.log('❌ No user found in storage');
      return null;
    }
    
    try {
      const user = JSON.parse(userStr);
      console.log('✅ User found in storage:', user);
      return user;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      toast.error('Error loading user data');
      return null;
    }
  };

  // Check if user is super-admin
  const checkSuperAdminStatus = (user) => {
    if (!user) return false;
    return user.role === 'super-admin' || 
           user.jobRole === 'super_admin' ||
           user.role === 'super_admin' ||
           (user.role === 'super-admin' && user.department === 'Management');
  };

  // 🆕 Debug function to test API directly
  const testAPIDirectly = async () => {
    try {
      console.log('🔍 Testing API directly...');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get('/departments');
      console.log('📊 Direct API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Direct API Error:', error.response?.data || error.message);
      return null;
    }
  };

  // ✅ Load initial data with page loader
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      setApiError(null);
      
      try {
        // 🔍 First, test API directly
        const testResult = await testAPIDirectly();
        console.log('Test Result:', testResult);
        
        const user = getUserFromStorage();
        if (user) {
          setUserInfo(user);
          const isSuper = checkSuperAdminStatus(user);
          setIsSuperAdmin(isSuper);
          console.log('Is Super Admin:', isSuper);
          
          if (user.company && user.companyCode) {
            setFormData(prev => ({
              ...prev,
              company: user.company,
              companyCode: user.companyCode
            }));
          }
          
          await fetchDepartments(user, isSuper);
        } else {
          toast.error('Please login to continue');
          setApiError('User not logged in');
        }
      } catch (error) {
        console.error('❌ Error loading departments:', error);
        setApiError(error.message || 'Failed to load departments');
        toast.error('Failed to load departments');
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, [refreshKey, showAllCompanies]);

  const fetchDepartments = async (user = null, isSuper = false) => {
    try {
      setLoading(true);
      setApiError(null);
      
      if (!user) {
        user = getUserFromStorage();
        if (!user) {
          toast.error('User not found');
          setApiError('User not found');
          return;
        }
        isSuper = checkSuperAdminStatus(user);
      }
      
      let url = '/departments';
      let params = {};
      
      // 🔥 FIX: Don't filter by company for now to see all data
      // Remove company filter temporarily for debugging
      if (!isSuper || !showAllCompanies) {
        if (user.company) {
          // params.company = user.company; // Commented for debugging
          console.log('Company filter would be applied:', user.company);
        }
      }
      
      console.log('🚀 Fetching departments with params:', params);
      console.log('📡 API URL:', url);
      
      const response = await axios.get(url, { params });
      console.log('✅ Full API Response:', response);
      console.log('📊 Response data:', response.data);
      
      // 🔥 FIX: Check different possible response structures
      let depts = [];
      if (response.data && response.data.success) {
        depts = response.data.departments || response.data.data || [];
      } else if (response.data && response.data.departments) {
        depts = response.data.departments;
      } else if (Array.isArray(response.data)) {
        depts = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        depts = response.data.data;
      } else {
        depts = [];
      }
      
      console.log('📋 Processed departments:', depts);
      console.log('📊 Department count:', depts.length);
      
      if (depts.length === 0) {
        console.warn('⚠️ No departments found in response');
        setApiError('No departments found. Try creating one.');
      }
      
      setDepartments(depts);
      
      // Calculate stats
      setStats({
        total: depts.length,
        active: depts.filter(d => d.isActive !== false).length,
        inactive: depts.filter(d => d.isActive === false).length
      });
      
    } catch (err) {
      console.error('❌ Fetch departments error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load departments';
      setApiError(errorMsg);
      toast.error(errorMsg);
      
      // Show more detailed error in console
      if (err.response?.status === 401) {
        console.error('🔐 Authentication error - Token might be expired');
        toast.error('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        console.error('🚫 Permission denied');
        toast.error('You don\'t have permission to view departments');
      } else if (err.response?.status === 404) {
        console.error('🔍 API endpoint not found');
        toast.error('API endpoint not found. Check your API URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    toast.info('Refreshing departments...');
    setPageLoading(true);
    try {
      await fetchDepartments(userInfo, isSuperAdmin);
      toast.success('Departments refreshed!');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    setLoading(true);
    try {
      const user = getUserFromStorage();
      if (!user) {
        toast.error('User not found. Please login again.');
        return;
      }
      
      const isSuper = checkSuperAdminStatus(user);
      
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim()
      };
      
      if (!isSuper || formData.company) {
        submitData.company = formData.company || user.company;
        submitData.companyCode = formData.companyCode || user.companyCode;
      }
      
      console.log('📤 Submitting department data:', submitData);
      
      if (editingDept) {
        await axios.put(`/departments/${editingDept._id}`, submitData);
        toast.success(`Department "${formData.name}" updated successfully!`);
      } else {
        await axios.post('/departments', submitData);
        toast.success(`Department "${formData.name}" created successfully!`);
      }
      
      setOpenDialog(false);
      setFormData({ 
        name: '', 
        description: '',
        company: user.company || '',
        companyCode: user.companyCode || ''
      });
      setEditingDept(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('❌ Submit error:', err);
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const dept = departments.find(d => d._id === id);
    if (!window.confirm(`Are you sure you want to delete "${dept?.name}"?`)) return;

    try {
      setLoading(true);
      await axios.delete(`/departments/${id}`);
      toast.success(`Department "${dept?.name}" deleted successfully!`);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      const msg = err.response?.data?.message || 'Deletion failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    const user = getUserFromStorage();
    
    setFormData({ 
      name: dept.name, 
      description: dept.description || '',
      company: dept.company || user?.company || '',
      companyCode: dept.companyCode || user?.companyCode || ''
    });
    setOpenDialog(true);
    setShowMenu(false);
  };

  const handleMenuOpen = (event, dept) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setSelectedDeptMenu(dept);
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
    setSelectedDeptMenu(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const sortDepartments = (depts) => {
    return [...depts].sort((a, b) => {
      let comparison = 0;
      switch(sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case 'status':
          comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const getFilteredDepartments = () => {
    let filtered = departments;
    
    if (searchTerm) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dept.companyCode && dept.companyCode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return sortDepartments(filtered);
  };

  const filteredDepartments = getFilteredDepartments();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Mobile Department Card Component
  const MobileDepartmentCard = ({ dept }) => (
    <div className="DepartmentManagement-mobile-card">
      <div className="DepartmentManagement-status-indicator" style={{
        backgroundColor: dept.isActive !== false ? '#4caf50' : '#f44336'
      }}></div>
      
      <div className="DepartmentManagement-card-content">
        <div className="DepartmentManagement-card-header">
          <div className="DepartmentManagement-card-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/>
            </svg>
          </div>
          <div className="DepartmentManagement-card-info">
            <div className="DepartmentManagement-card-title">{dept.name}</div>
            <div className="DepartmentManagement-card-tags">
              {dept.companyCode && (
                <span className="DepartmentManagement-tag DepartmentManagement-tag-code">{dept.companyCode}</span>
              )}
              <span className={`DepartmentManagement-tag ${dept.isActive !== false ? 'DepartmentManagement-tag-active' : 'DepartmentManagement-tag-inactive'}`}>
                {dept.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {dept.description && (
          <div className="DepartmentManagement-description">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <span>{dept.description}</span>
          </div>
        )}

        <div className="DepartmentManagement-card-footer">
          <div className="DepartmentManagement-meta">
            <div className="DepartmentManagement-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
              </svg>
              <span>{formatDate(dept.createdAt)}</span>
            </div>
            {dept.createdBy?.name && (
              <div className="DepartmentManagement-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>{dept.createdBy.name}</span>
              </div>
            )}
          </div>
          
          <div className="DepartmentManagement-card-actions">
            <button 
              className="DepartmentManagement-icon-btn DepartmentManagement-icon-btn-primary" 
              onClick={() => handleEdit(dept)}
              title="Edit"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button 
              className="DepartmentManagement-icon-btn DepartmentManagement-icon-btn-danger" 
              onClick={() => handleDelete(dept._id)}
              disabled={dept.isActive === false}
              title="Delete"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const getIconSvg = (iconName, size = 24) => {
    switch(iconName) {
      case 'corporate':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/></svg>;
      case 'check':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
      case 'cancel':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>;
      case 'add':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
      case 'search':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
      case 'clear':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
      case 'refresh':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
      case 'filter':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.8-1.61H5.04c-.83 0-1.3.95-.79 1.61z"/></svg>;
      case 'person':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
      case 'today':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>;
      case 'edit':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
      case 'delete':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
      default:
        return null;
    }
  };

  // ✅ Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  // 🆕 Show error state if API failed
  if (apiError && departments.length === 0) {
    return (
      <div className="DepartmentManagement-error-container">
        <div className="DepartmentManagement-error-card">
          <div className="DepartmentManagement-error-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h3 className="DepartmentManagement-error-title">Failed to Load Departments</h3>
          <p className="DepartmentManagement-error-message">{apiError}</p>
          <div className="DepartmentManagement-error-actions">
            <button className="DepartmentManagement-btn DepartmentManagement-btn-primary" onClick={handleManualRefresh}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="DepartmentManagement-loading-container">
        <div className="DepartmentManagement-loading-card">
          <div className="DepartmentManagement-loading-spinner"></div>
          <h2 className="DepartmentManagement-loading-title">Loading...</h2>
          <p className="DepartmentManagement-loading-text">Fetching your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="DepartmentManagement">
      {/* Loading Overlay */}
      {loading && (
        <div className="DepartmentManagement-loading-overlay">
          <div className="DepartmentManagement-progress-bar">
            <div className="DepartmentManagement-progress-fill" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      

      {/* Stats Cards */}
      {departments.length > 0 && (
        <div className="DepartmentManagement-stats-grid">
          <div className="DepartmentManagement-stat-card DepartmentManagement-stat-total">
            <div className="DepartmentManagement-stat-icon">
              {getIconSvg('corporate', isMobile ? 24 : 28)}
            </div>
            <div className="DepartmentManagement-stat-content">
              <div className="DepartmentManagement-stat-label">Total</div>
              <div className="DepartmentManagement-stat-value-wrapper">
                <span className="DepartmentManagement-stat-value">{stats.total}</span>
              </div>
            </div>
          </div>

          <div className="DepartmentManagement-stat-card DepartmentManagement-stat-active">
            <div className="DepartmentManagement-stat-icon">
              {getIconSvg('check', isMobile ? 24 : 28)}
            </div>
            <div className="DepartmentManagement-stat-content">
              <div className="DepartmentManagement-stat-label">Active</div>
              <div className="DepartmentManagement-stat-value-wrapper">
                <span className="DepartmentManagement-stat-value">{stats.active}</span>
              </div>
            </div>
          </div>

          <div className="DepartmentManagement-stat-card DepartmentManagement-stat-inactive">
            <div className="DepartmentManagement-stat-icon">
              {getIconSvg('cancel', isMobile ? 24 : 28)}
            </div>
            <div className="DepartmentManagement-stat-content">
              <div className="DepartmentManagement-stat-label">Inactive</div>
              <div className="DepartmentManagement-stat-value-wrapper">
                <span className="DepartmentManagement-stat-value">{stats.inactive}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="DepartmentManagement-paper">
        {/* Header Section */}
        <div className="DepartmentManagement-header">
          <div className="DepartmentManagement-title-section">
            <div className="DepartmentManagement-title-icon">
              {getIconSvg('corporate', isMobile ? 24 : 28)}
            </div>
            <div>
              <h2 className="DepartmentManagement-title">
                {isMobile ? 'Departments' : 'Department Management'}
              </h2>
            </div>
          </div>
          
          <div className="DepartmentManagement-header-actions">
            <div className="DepartmentManagement-search-wrapper">
              <span className="DepartmentManagement-search-icon">
                {getIconSvg('search', isMobile ? 18 : 20)}
              </span>
              <input
                type="text"
                className="DepartmentManagement-search-input"
                placeholder={isMobile ? "Search..." : "Search departments..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="DepartmentManagement-clear-search" onClick={handleClearSearch}>
                  {getIconSvg('clear', isMobile ? 16 : 18)}
                </button>
              )}
            </div>
            
            {/* Refresh Button */}
            <button
              className="DepartmentManagement-icon-btn"
              onClick={handleManualRefresh}
              title="Refresh"
              style={{ marginRight: '8px' }}
            >
              {getIconSvg('refresh', 20)}
            </button>
            
            {!isMobile && (
              <button
                className="DepartmentManagement-btn DepartmentManagement-btn-primary"
                onClick={() => {
                  setEditingDept(null);
                  const user = getUserFromStorage();
                  if (!user) {
                    toast.error('Please login first');
                    return;
                  }
                  setFormData({ 
                    name: '', 
                    description: '',
                    company: user.company || '',
                    companyCode: user.companyCode || ''
                  });
                  setOpenDialog(true);
                }}
              >
                {getIconSvg('add', 18)}
                {isTablet ? 'Add' : 'Add Department'}
              </button>
            )}
          </div>
        </div>

        {/* Content View */}
        {isMobile ? (
          <div className="DepartmentManagement-mobile-view">
            {filteredDepartments.length === 0 ? (
              <div className="DepartmentManagement-empty-state">
                <div className="DepartmentManagement-empty-icon">
                  {getIconSvg('corporate', 50)}
                </div>
                <h3 className="DepartmentManagement-empty-title">
                  {searchTerm ? 'No Matching Departments' : 'No Departments Found'}
                </h3>
                <p className="DepartmentManagement-empty-message">
                  {searchTerm 
                    ? `No departments match "${searchTerm}"`
                    : 'Create your first department to get started.'}
                </p>
                {searchTerm ? (
                  <button 
                    className="DepartmentManagement-btn DepartmentManagement-btn-outline"
                    onClick={handleClearSearch}
                  >
                    {getIconSvg('clear', 18)}
                    Clear Search
                  </button>
                ) : (
                  <button 
                    className="DepartmentManagement-btn DepartmentManagement-btn-primary"
                    onClick={() => {
                      const user = getUserFromStorage();
                      setFormData({ 
                        name: '', 
                        description: '',
                        company: user?.company || '',
                        companyCode: user?.companyCode || ''
                      });
                      setOpenDialog(true);
                    }}
                  >
                    {getIconSvg('add', 18)}
                    Create Department
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredDepartments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(dept => (
                    <MobileDepartmentCard key={dept._id} dept={dept} />
                  ))
                }
              </>
            )}
          </div>
        ) : (
          // Desktop Table View
          <div className="DepartmentManagement-table-container">
            <table className="DepartmentManagement-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Created By</th>
                  <th>Created On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="DepartmentManagement-empty-cell">
                      <div className="DepartmentManagement-empty-state">
                        <div className="DepartmentManagement-empty-icon">
                          {getIconSvg('corporate', 50)}
                        </div>
                        <h3 className="DepartmentManagement-empty-title">No Departments Found</h3>
                        <p className="DepartmentManagement-empty-message">
                          {searchTerm ? 'No departments match your search' : 'Get started by adding a department'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDepartments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((dept) => (
                      <tr key={dept._id} className="DepartmentManagement-table-row">
                        <td>
                          <div className="DepartmentManagement-department-name">
                            <div className="DepartmentManagement-department-icon">
                              {getIconSvg('business', 20)}
                            </div>
                            <span>{dept.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="DepartmentManagement-description-text">
                            {dept.description || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="DepartmentManagement-meta-item">
                            {getIconSvg('person', 16)}
                            <span>{dept.createdBy?.name || 'System'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="DepartmentManagement-meta-item">
                            {getIconSvg('today', 16)}
                            <span>{formatDate(dept.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`DepartmentManagement-status ${dept.isActive !== false ? 'DepartmentManagement-status-active' : 'DepartmentManagement-status-inactive'}`}>
                            {dept.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="DepartmentManagement-action-buttons">
                            <button 
                              className="DepartmentManagement-action-btn DepartmentManagement-action-edit"
                              onClick={() => handleEdit(dept)}
                              title="Edit Department"
                            >
                              {getIconSvg('edit', 18)}
                            </button>
                            <button 
                              className="DepartmentManagement-action-btn DepartmentManagement-action-delete"
                              onClick={() => handleDelete(dept._id)}
                              disabled={dept.isActive === false}
                              title="Delete Department"
                            >
                              {getIconSvg('delete', 18)}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredDepartments.length > 0 && (
          <div className="DepartmentManagement-pagination">
            <div className="DepartmentManagement-pagination-info">
              {isMobile ? (
                <span>{page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredDepartments.length)} of {filteredDepartments.length}</span>
              ) : (
                <span>Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredDepartments.length)} of {filteredDepartments.length} entries</span>
              )}
            </div>
            <div className="DepartmentManagement-pagination-controls">
              {!isMobile && (
                <select 
                  className="DepartmentManagement-rows-per-page"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              )}
              <div className="DepartmentManagement-pagination-buttons">
                <button 
                  className="DepartmentManagement-pagination-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                >
                  {isMobile ? '‹' : 'Previous'}
                </button>
                <span className="DepartmentManagement-pagination-current">
                  {isMobile ? page + 1 : `Page ${page + 1}`}
                </span>
                <button 
                  className="DepartmentManagement-pagination-btn"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(filteredDepartments.length / rowsPerPage) - 1}
                >
                  {isMobile ? '›' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <button
            className="DepartmentManagement-fab"
            onClick={() => {
              const user = getUserFromStorage();
              setFormData({ 
                name: '', 
                description: '',
                company: user?.company || '',
                companyCode: user?.companyCode || ''
              });
              setOpenDialog(true);
            }}
          >
            {getIconSvg('add', 28)}
          </button>
        )}

        {/* Options Menu for Mobile */}
        {showMenu && (
          <div 
            className="DepartmentManagement-menu-overlay"
            onClick={handleMenuClose}
          >
            <div 
              className="DepartmentManagement-menu"
              style={{
                top: Math.min(menuPosition.top, window.innerHeight - 200),
                left: Math.min(menuPosition.left, window.innerWidth - 220)
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="DepartmentManagement-menu-item" onClick={() => {
                handleEdit(selectedDeptMenu);
                handleMenuClose();
              }}>
                <span className="DepartmentManagement-menu-icon DepartmentManagement-menu-icon-primary">
                  {getIconSvg('edit', 18)}
                </span>
                <div className="DepartmentManagement-menu-content">
                  <span className="DepartmentManagement-menu-title">Edit Department</span>
                </div>
              </div>
              <div className="DepartmentManagement-menu-divider"></div>
              <div 
                className={`DepartmentManagement-menu-item ${!selectedDeptMenu?.isActive ? 'DepartmentManagement-menu-item-disabled' : ''}`}
                onClick={() => {
                  if (selectedDeptMenu?.isActive) {
                    handleDelete(selectedDeptMenu?._id);
                    handleMenuClose();
                  }
                }}
              >
                <span className="DepartmentManagement-menu-icon DepartmentManagement-menu-icon-danger">
                  {getIconSvg('delete', 18)}
                </span>
                <div className="DepartmentManagement-menu-content">
                  <span className="DepartmentManagement-menu-title">Delete Department</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {openDialog && (
        <div className="DepartmentManagement-modal-overlay" onClick={() => !loading && setOpenDialog(false)}>
          <div 
            className={`DepartmentManagement-modal ${isMobile ? 'DepartmentManagement-modal-fullscreen' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="DepartmentManagement-modal-header">
              <div className="DepartmentManagement-modal-header-content">
                <div className="DepartmentManagement-modal-icon">
                  {editingDept ? getIconSvg('edit', isMobile ? 22 : 26) : getIconSvg('add', isMobile ? 22 : 26)}
                </div>
                <div>
                  <h3 className="DepartmentManagement-modal-title">
                    {editingDept ? 'Edit Department' : 'Create Department'}
                  </h3>
                </div>
              </div>
              <button 
                className="DepartmentManagement-modal-close"
                onClick={() => setOpenDialog(false)}
                disabled={loading}
              >
                <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="DepartmentManagement-modal-body">
              <div className="DepartmentManagement-form-group">
                <label className="DepartmentManagement-form-label">Name *</label>
                <div className="DepartmentManagement-input-wrapper">
                  <span className="DepartmentManagement-input-icon">
                    {getIconSvg('business', isMobile ? 18 : 20)}
                  </span>
                  <input
                    type="text"
                    className="DepartmentManagement-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter department name"
                  />
                </div>
              </div>

              <div className="DepartmentManagement-form-group">
                <label className="DepartmentManagement-form-label">Description</label>
                <div className="DepartmentManagement-input-wrapper">
                  <span className="DepartmentManagement-input-icon">
                    {getIconSvg('description', isMobile ? 18 : 20)}
                  </span>
                  <textarea
                    className="DepartmentManagement-form-input DepartmentManagement-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder={isMobile ? "Optional" : "Describe the purpose of this department (optional)"}
                    rows={isMobile ? 3 : 4}
                  />
                </div>
              </div>
            </div>

            <div className="DepartmentManagement-modal-footer">
              <button 
                className="DepartmentManagement-btn DepartmentManagement-btn-secondary"
                onClick={() => setOpenDialog(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="DepartmentManagement-btn DepartmentManagement-btn-primary"
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
              >
                {loading ? (
                  <>
                    <span className="DepartmentManagement-spinner"></span>
                    {isMobile ? 'Saving' : 'Saving...'}
                  </>
                ) : (
                  editingDept ? (isMobile ? 'Update' : 'Update Department') : (isMobile ? 'Create' : 'Create Department')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;