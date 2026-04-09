import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import './JobRoleManagement.css';
import CIISLoader from '../../Loader/CIISLoader';

const JobRoleManagement = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [jobRoles, setJobRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJobRole, setEditingJobRole] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    department: '',
    company: '',  
    companyCode: '' 
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJobRoleMenu, setSelectedJobRoleMenu] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiError, setApiError] = useState(null); // 🆕 API error state
  const [debugInfo, setDebugInfo] = useState({}); // 🆕 Debug info
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withDepartment: 0
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      setRowsPerPage(window.innerWidth < 768 ? 5 : 10);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format date
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
    
    const isSuper = 
      user.role === 'super-admin' || 
      user.jobRole === 'super_admin' ||
      user.role === 'super_admin';
    
    console.log('🔍 Super admin check:', { isSuper, role: user.role, jobRole: user.jobRole });
    return isSuper;
  };

  // 🆕 Debug function to test API directly
  const testAPIDirectly = async () => {
    try {
      console.log('🔍 Testing Job Roles API directly...');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get('/job-roles');
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
        // 🔍 Test API first
        const testResult = await testAPIDirectly();
        setDebugInfo(prev => ({ ...prev, testResult }));
        
        const user = getUserFromStorage();
        
        if (user) {
          setUserInfo(user);
          const isSuper = checkSuperAdminStatus(user);
          setIsSuperAdmin(isSuper);
          
          if (user.company && user.companyCode) {
            setFormData(prev => ({
              ...prev,
              company: user.company,
              companyCode: user.companyCode
            }));
          }
          
          await fetchJobRoles(user, isSuper);
          await fetchDepartments(user, isSuper);
        } else {
          toast.error('Please login to continue');
          setApiError('User not logged in');
        }
      } catch (error) {
        console.error('❌ Error loading job roles:', error);
        setApiError(error.message || 'Failed to load job roles');
        toast.error('Failed to load job roles');
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, [refreshKey, showAllCompanies]);

  const fetchJobRoles = async (user = null, isSuper = false) => {
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
      
      let params = {};
      
      // 🔥 Temporarily remove filter for debugging
      // if (!isSuper || !showAllCompanies) {
      //   if (user.company) {
      //     params.company = user.company;
      //   }
      // }
      
      console.log('🚀 Fetching job roles with params:', params);
      
      const response = await axios.get('/job-roles', { params });
      console.log('✅ Full Job Roles Response:', response);
      console.log('📊 Response data:', response.data);
      
      // 🔥 FIX: Handle different response structures
      let roles = [];
      if (response.data && response.data.success) {
        roles = response.data.jobRoles || response.data.data || [];
      } else if (response.data && response.data.jobRoles) {
        roles = response.data.jobRoles;
      } else if (Array.isArray(response.data)) {
        roles = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        roles = response.data.data;
      } else {
        roles = [];
      }
      
      console.log('📋 Processed job roles:', roles);
      console.log('📊 Job roles count:', roles.length);
      
      if (roles.length === 0) {
        console.warn('⚠️ No job roles found in response');
        setApiError('No job roles found. Try creating one.');
      }
      
      setJobRoles(roles);
      
      // Calculate stats
      setStats({
        total: roles.length,
        active: roles.filter(r => r.isActive !== false).length,
        inactive: roles.filter(r => r.isActive === false).length,
        withDepartment: roles.filter(r => r.department).length
      });
      
      setDebugInfo(prev => ({ 
        ...prev, 
        jobRolesCount: roles.length,
        jobRolesSample: roles.slice(0, 2)
      }));
      
    } catch (err) {
      console.error('❌ Fetch job roles error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load job roles';
      setApiError(errorMsg);
      toast.error(errorMsg);
      
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        toast.error('You don\'t have permission to view job roles');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (user = null, isSuper = false) => {
    try {
      if (!user) {
        user = getUserFromStorage();
        if (!user) return;
        isSuper = checkSuperAdminStatus(user);
      }
      
      let params = {};
      
      // 🔥 Temporarily remove filter for debugging
      // if (!isSuper) {
      //   if (user.company) {
      //     params.company = user.company;
      //   }
      // }
      
      console.log('🚀 Fetching departments for dropdown with params:', params);
      
      const response = await axios.get('/departments', { params });
      console.log('✅ Departments response:', response.data);
      
      let depts = [];
      if (response.data && response.data.success) {
        depts = response.data.departments || [];
      } else if (response.data && response.data.departments) {
        depts = response.data.departments;
      } else if (Array.isArray(response.data)) {
        depts = response.data;
      } else {
        depts = [];
      }
      
      setDepartments(depts);
      console.log('📋 Departments for dropdown:', depts.length);
      
      setDebugInfo(prev => ({ ...prev, departmentsCount: depts.length }));
      
    } catch (err) {
      console.error('❌ Fetch departments error:', err);
      toast.error(err.response?.data?.message || 'Failed to load departments');
    }
  };

  // 🆕 Manual refresh function
  const handleManualRefresh = async () => {
    toast.info('Refreshing job roles...');
    setPageLoading(true);
    try {
      const user = getUserFromStorage();
      const isSuper = checkSuperAdminStatus(user);
      await fetchJobRoles(user, isSuper);
      await fetchDepartments(user, isSuper);
      toast.success('Job roles refreshed!');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Job role name is required');
      return;
    }

    if (!formData.department) {
      toast.error('Please select a department');
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
        description: formData.description.trim(),
        department: formData.department
      };
      
      if (!isSuper || formData.company) {
        submitData.company = formData.company || user.company;
        submitData.companyCode = formData.companyCode || user.companyCode;
      }
      
      console.log('📤 Submitting job role data:', submitData);
      
      if (editingJobRole) {
        await axios.put(`/job-roles/${editingJobRole._id}`, submitData);
        toast.success(`Job Role "${formData.name}" updated successfully!`);
      } else {
        await axios.post('/job-roles', submitData);
        toast.success(`Job Role "${formData.name}" created successfully!`);
      }
      
      setOpenDialog(false);
      setFormData({ 
        name: '', 
        description: '',
        department: '',
        company: user.company || '',
        companyCode: user.companyCode || ''
      });
      setEditingJobRole(null);
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
    const jobRole = jobRoles.find(j => j._id === id);
    if (!window.confirm(`Are you sure you want to delete "${jobRole?.name}"?`)) return;

    try {
      setLoading(true);
      await axios.delete(`/job-roles/${id}`);
      toast.success(`Job Role "${jobRole?.name}" deleted successfully!`);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      const msg = err.response?.data?.message || 'Deletion failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (jobRole) => {
    setEditingJobRole(jobRole);
    const user = getUserFromStorage();
    
    setFormData({ 
      name: jobRole.name, 
      description: jobRole.description || '',
      department: jobRole.department?._id || jobRole.department || '',
      company: jobRole.company?._id || jobRole.company || user?.company || '',
      companyCode: jobRole.companyCode || user?.companyCode || ''
    });
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event, jobRole) => {
    setAnchorEl(event.currentTarget);
    setSelectedJobRoleMenu(jobRole);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJobRoleMenu(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Filter job roles
  const getFilteredJobRoles = () => {
    let filtered = jobRoles;
    
    if (searchTerm) {
      filtered = filtered.filter(jobRole =>
        jobRole.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (jobRole.description && jobRole.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (jobRole.companyCode && jobRole.companyCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (jobRole.department?.name && jobRole.department.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const filteredJobRoles = getFilteredJobRoles();

  // Mobile card view component
  const MobileJobRoleCard = ({ jobRole }) => (
    <div className="JobRoleManagement-mobile-card">
      <div className="JobRoleManagement-mobile-card-status" 
           style={{ backgroundColor: jobRole.isActive !== false ? '#4caf50' : '#f44336' }}></div>
      
      <div className="JobRoleManagement-mobile-card-content">
        <div className="JobRoleManagement-mobile-card-header">
          <div className="JobRoleManagement-mobile-card-avatar">
            <span className="JobRoleManagement-mobile-card-avatar-icon">💼</span>
          </div>
          <div className="JobRoleManagement-mobile-card-title-section">
            <div className="JobRoleManagement-mobile-card-title">{jobRole.name}</div>
            <div className="JobRoleManagement-mobile-card-badges">
              {jobRole.department?.name && (
                <span className="JobRoleManagement-mobile-card-badge JobRoleManagement-badge-primary">
                  {jobRole.department.name}
                </span>
              )}
              {jobRole.companyCode && (
                <span className="JobRoleManagement-mobile-card-badge JobRoleManagement-badge-primary">
                  {jobRole.companyCode}
                </span>
              )}
              <span className={`JobRoleManagement-mobile-card-badge JobRoleManagement-badge-${jobRole.isActive !== false ? 'success' : 'error'}`}>
                {jobRole.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {jobRole.description && (
          <div className="JobRoleManagement-mobile-card-description">
            <span className="JobRoleManagement-description-icon">📝</span>
            <span className="JobRoleManagement-description-text">{jobRole.description}</span>
          </div>
        )}

        <div className="JobRoleManagement-mobile-card-footer">
          <div className="JobRoleManagement-mobile-card-meta">
            <span className="JobRoleManagement-meta-item">
              <span className="JobRoleManagement-meta-icon">📅</span>
              <span className="JobRoleManagement-meta-text">{formatDate(jobRole.createdAt)}</span>
            </span>
            {jobRole.createdBy?.name && (
              <span className="JobRoleManagement-meta-item">
                <span className="JobRoleManagement-meta-icon">👤</span>
                <span className="JobRoleManagement-meta-text">{jobRole.createdBy.name}</span>
              </span>
            )}
          </div>
          
          <div className="JobRoleManagement-mobile-card-actions">
            <button 
              className="JobRoleManagement-action-btn JobRoleManagement-action-edit"
              onClick={() => handleEdit(jobRole)}
            >
              ✏️
            </button>
            <button 
              className={`JobRoleManagement-action-btn JobRoleManagement-action-delete ${jobRole.isActive === false ? 'JobRoleManagement-disabled' : ''}`}
              onClick={() => handleDelete(jobRole._id)}
              disabled={jobRole.isActive === false}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  // 🆕 Show error state if API failed
  if (apiError && jobRoles.length === 0) {
    return (
      <div className="JobRoleManagement-error-container">
        <div className="JobRoleManagement-error-card">
          <div className="JobRoleManagement-error-icon">⚠️</div>
          <h3 className="JobRoleManagement-error-title">Failed to Load Job Roles</h3>
          <p className="JobRoleManagement-error-message">{apiError}</p>
          <div className="JobRoleManagement-error-actions">
            <button className="JobRoleManagement-btn-primary" onClick={handleManualRefresh}>
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="JobRoleManagement-container">
      {/* Loading Overlay */}
      {loading && (
        <div className="JobRoleManagement-loading-overlay">
          <div className="JobRoleManagement-progress-bar">
            <div className="JobRoleManagement-progress-fill"></div>
          </div>
        </div>
      )}

    
      {/* Stats Cards */}
      {jobRoles.length > 0 && (
        <div className="JobRoleManagement-stats-grid">
          <div className="JobRoleManagement-stat-card JobRoleManagement-stat-blue">
            <div className="JobRoleManagement-stat-content">
              <div className="JobRoleManagement-stat-icon-box">
                <span className="JobRoleManagement-stat-icon">📋</span>
              </div>
              <div className="JobRoleManagement-stat-info">
                <span className="JobRoleManagement-stat-label">Total Roles</span>
                <div className="JobRoleManagement-stat-value-wrapper">
                  <span className="JobRoleManagement-stat-value">{stats.total}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="JobRoleManagement-stat-card JobRoleManagement-stat-green">
            <div className="JobRoleManagement-stat-content">
              <div className="JobRoleManagement-stat-icon-box">
                <span className="JobRoleManagement-stat-icon">✓</span>
              </div>
              <div className="JobRoleManagement-stat-info">
                <span className="JobRoleManagement-stat-label">Active Roles</span>
                <div className="JobRoleManagement-stat-value-wrapper">
                  <span className="JobRoleManagement-stat-value">{stats.active}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="JobRoleManagement-stat-card JobRoleManagement-stat-blue">
            <div className="JobRoleManagement-stat-content">
              <div className="JobRoleManagement-stat-icon-box">
                <span className="JobRoleManagement-stat-icon">📂</span>
              </div>
              <div className="JobRoleManagement-stat-info">
                <span className="JobRoleManagement-stat-label">With Dept</span>
                <div className="JobRoleManagement-stat-value-wrapper">
                  <span className="JobRoleManagement-stat-value">{stats.withDepartment}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="JobRoleManagement-stat-card JobRoleManagement-stat-red">
            <div className="JobRoleManagement-stat-content">
              <div className="JobRoleManagement-stat-icon-box">
                <span className="JobRoleManagement-stat-icon">✗</span>
              </div>
              <div className="JobRoleManagement-stat-info">
                <span className="JobRoleManagement-stat-label">Inactive</span>
                <div className="JobRoleManagement-stat-value-wrapper">
                  <span className="JobRoleManagement-stat-value">{stats.inactive}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="JobRoleManagement-paper">
        {/* Header Section */}
        <div className="JobRoleManagement-header">
          <div className="JobRoleManagement-header-left">
            <div className="JobRoleManagement-header-icon-box">
              <span className="JobRoleManagement-header-icon">📋</span>
            </div>
            <div className="JobRoleManagement-header-text">
              <h2 className="JobRoleManagement-header-title">Job Role Management</h2>
            </div>
          </div>
          
          <div className="JobRoleManagement-header-actions">
            {/* Search Bar */}
            <div className="JobRoleManagement-search-container">
              <span className="JobRoleManagement-search-icon">🔍</span>
              <input
                type="text"
                className="JobRoleManagement-search-input"
                placeholder="Search job roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="JobRoleManagement-clear-search" onClick={handleClearSearch}>
                  ✕
                </button>
              )}
            </div>
            
            {/* Refresh Button */}
            <button
              className="JobRoleManagement-icon-btn"
              onClick={handleManualRefresh}
              title="Refresh"
              style={{ marginRight: '8px' }}
            >
              🔄
            </button>
            
            {/* Add Job Role Button */}
            <button
              className="JobRoleManagement-btn-primary"
              onClick={() => {
                setEditingJobRole(null);
                const user = getUserFromStorage();
                
                if (!user) {
                  toast.error('Please login first');
                  return;
                }
                
                setFormData({ 
                  name: '', 
                  description: '',
                  department: '',
                  company: user.company || '',
                  companyCode: user.companyCode || ''
                });
                setOpenDialog(true);
              }}
            >
              <span className="JobRoleManagement-btn-icon">+</span>
              {isMobile ? 'Add' : 'Add Job Role'}
            </button>
          </div>
        </div>

        {/* Empty State or Table View */}
        {filteredJobRoles.length === 0 ? (
          <div className="JobRoleManagement-empty-state">
            <div className="JobRoleManagement-empty-icon">📋</div>
            <h3 className="JobRoleManagement-empty-title">
              {searchTerm ? 'No Matching Job Roles' : 'No Job Roles Found'}
            </h3>
            <p className="JobRoleManagement-empty-text">
              {searchTerm 
                ? `No job roles match "${searchTerm}"`
                : 'Get started by creating your first job role to define positions.'}
            </p>
            {searchTerm ? (
              <button className="JobRoleManagement-btn-outline" onClick={handleClearSearch}>
                ✕ Clear Search
              </button>
            ) : (
              <button 
                className="JobRoleManagement-btn-primary"
                onClick={() => {
                  const user = getUserFromStorage();
                  setFormData({ 
                    name: '', 
                    description: '',
                    department: '',
                    company: user?.company || '',
                    companyCode: user?.companyCode || ''
                  });
                  setOpenDialog(true);
                }}
              >
                + Add Job Role
              </button>
            )}
          </div>
        ) : isMobile ? (
          // Mobile Card View
          <div className="JobRoleManagement-mobile-view">
            {filteredJobRoles
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(jobRole => (
                <MobileJobRoleCard key={jobRole._id} jobRole={jobRole} />
              ))}
          </div>
        ) : (
          // Desktop Table View
          <div className="JobRoleManagement-table-container">
            <table className="JobRoleManagement-table">
              <thead>
                <tr>
                  <th>Job Role Name</th>
                  <th>Description</th>
                  <th>Department</th>
                  <th>Created By</th>
                  <th>Created On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobRoles
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((jobRole) => (
                    <tr key={jobRole._id} className="JobRoleManagement-table-row">
                      <td>
                        <div className="JobRoleManagement-job-role-cell">
                          <span className="JobRoleManagement-job-role-icon">💼</span>
                          <span className="JobRoleManagement-job-role-name">{jobRole.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="JobRoleManagement-description">
                          {jobRole.description || '—'}
                        </span>
                      </td>
                      <td>
                        {jobRole.department?.name ? (
                          <span className="JobRoleManagement-badge JobRoleManagement-badge-primary">
                            {jobRole.department.name}
                          </span>
                        ) : (
                          <span className="JobRoleManagement-text-disabled">Not assigned</span>
                        )}
                      </td>
                      <td>
                        <div className="JobRoleManagement-created-by">
                          <span className="JobRoleManagement-created-by-icon">👤</span>
                          <span>{jobRole.createdBy?.name || 'System'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="JobRoleManagement-created-date">
                          <span className="JobRoleManagement-date-icon">📅</span>
                          <span>{formatDate(jobRole.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`JobRoleManagement-badge JobRoleManagement-badge-${jobRole.isActive !== false ? 'success' : 'error'}`}>
                          {jobRole.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="JobRoleManagement-action-buttons">
                          <button 
                            className="JobRoleManagement-icon-btn JobRoleManagement-icon-edit"
                            onClick={() => handleEdit(jobRole)}
                            title="Edit Job Role"
                          >
                            ✏️
                          </button>
                          <button 
                            className={`JobRoleManagement-icon-btn JobRoleManagement-icon-delete ${jobRole.isActive === false ? 'JobRoleManagement-disabled' : ''}`}
                            onClick={() => handleDelete(jobRole._id)}
                            title="Delete Job Role"
                            disabled={jobRole.isActive === false}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredJobRoles.length > 0 && (
          <div className="JobRoleManagement-pagination">
            <div className="JobRoleManagement-pagination-info">
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredJobRoles.length)} of {filteredJobRoles.length} entries
            </div>
            <div className="JobRoleManagement-pagination-controls">
              <select 
                className="JobRoleManagement-rows-per-page"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              
              <div className="JobRoleManagement-pagination-buttons">
                <button 
                  className="JobRoleManagement-pagination-btn"
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                  disabled={page === 0}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, Math.ceil(filteredJobRoles.length / rowsPerPage)) }, (_, i) => {
                  let pageNum;
                  const totalPages = Math.ceil(filteredJobRoles.length / rowsPerPage);
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`JobRoleManagement-pagination-btn ${page === pageNum ? 'JobRoleManagement-active' : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button 
                  className="JobRoleManagement-pagination-btn"
                  onClick={() => setPage(prev => Math.min(Math.ceil(filteredJobRoles.length / rowsPerPage) - 1, prev + 1))}
                  disabled={page === Math.ceil(filteredJobRoles.length / rowsPerPage) - 1}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <button
            className="JobRoleManagement-fab"
            onClick={() => {
              const user = getUserFromStorage();
              setFormData({ 
                name: '', 
                description: '',
                department: '',
                company: user?.company || '',
                companyCode: user?.companyCode || ''
              });
              setOpenDialog(true);
            }}
          >
            <span className="JobRoleManagement-fab-icon">+</span>
          </button>
        )}

        {/* Options Menu for Mobile */}
        {anchorEl && (
          <div className="JobRoleManagement-menu-overlay" onClick={handleMenuClose}>
            <div className="JobRoleManagement-menu" style={{top: anchorEl.getBoundingClientRect().bottom, left: anchorEl.getBoundingClientRect().left}}>
              <button className="JobRoleManagement-menu-item" onClick={() => {
                handleEdit(selectedJobRoleMenu);
                handleMenuClose();
              }}>
                <span className="JobRoleManagement-menu-icon">✏️</span>
                <div className="JobRoleManagement-menu-text">
                  <div className="JobRoleManagement-menu-title">Edit Job Role</div>
                </div>
              </button>
              <hr className="JobRoleManagement-menu-divider" />
              <button 
                className={`JobRoleManagement-menu-item ${!selectedJobRoleMenu?.isActive ? 'JobRoleManagement-menu-item-disabled' : ''}`}
                onClick={() => {
                  handleDelete(selectedJobRoleMenu?._id);
                  handleMenuClose();
                }} 
                disabled={!selectedJobRoleMenu?.isActive}
              >
                <span className="JobRoleManagement-menu-icon">🗑️</span>
                <div className="JobRoleManagement-menu-text">
                  <div className="JobRoleManagement-menu-title">Delete Job Role</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {openDialog && (
        <div className="JobRoleManagement-modal-overlay" onClick={() => !loading && setOpenDialog(false)}>
          <div className={`JobRoleManagement-modal ${isMobile ? 'JobRoleManagement-modal-fullscreen' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="JobRoleManagement-modal-header">
              <div className="JobRoleManagement-modal-header-content">
                <div className="JobRoleManagement-modal-avatar">
                  {editingJobRole ? '✏️' : '+'}
                </div>
                <div className="JobRoleManagement-modal-title-section">
                  <h3 className="JobRoleManagement-modal-title">
                    {editingJobRole ? 'Edit Job Role' : 'Create New Job Role'}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="JobRoleManagement-modal-body">
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Job Role Name *</label>
                <div className="JobRoleManagement-input-wrapper">
                  <span className="JobRoleManagement-input-icon">💼</span>
                  <input
                    type="text"
                    className="JobRoleManagement-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter job role name"
                    required
                  />
                </div>
              </div>
              
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Description</label>
                <div className="JobRoleManagement-textarea-wrapper">
                  <span className="JobRoleManagement-textarea-icon">📝</span>
                  <textarea
                    className="JobRoleManagement-form-textarea"
                    rows={isMobile ? 3 : 4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the responsibilities of this role (optional)"
                  />
                </div>
              </div>
              
              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Department *</label>
                <select
                  className="JobRoleManagement-form-select"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} {dept.companyCode ? `(${dept.companyCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="JobRoleManagement-modal-footer">
              <button 
                className="JobRoleManagement-btn-secondary"
                onClick={() => setOpenDialog(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="JobRoleManagement-btn-primary"
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim() || !formData.department}
              >
                {loading ? (
                  <>
                    <span className="JobRoleManagement-spinner"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  editingJobRole ? 'Update Job Role' : 'Create Job Role'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRoleManagement;