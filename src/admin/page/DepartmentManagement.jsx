import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import './DepartmentManagement.css';
import CIISLoader from '../../Loader/CIISLoader'; 

const DepartmentManagement = () => {
  const { branchId: routeBranchId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedBranchId = routeBranchId || searchParams.get('branch') || searchParams.get('branchId') || '';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [pageLoading, setPageLoading] = useState(true); 
  
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(requestedBranchId);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    company: '',  
    companyCode: '',
    branch: '',
    shiftSettings: {
      shiftStart: '09:00',
      shiftEnd: '19:00',
      earlyClockInMinutes: 30,
      gracePeriodMinutes: 10,
      halfDayLateMinutes: 120,
      shortLeaveEarlyMinutes: 30,
      halfDayEarlyMinutes: 240
    }
  });
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [selectedDeptMenu, setSelectedDeptMenu] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const getRecordId = (record) => {
    if (!record) return '';
    if (typeof record === 'object') return record._id || record.id || '';
    return record;
  };

  const getCompanyFromStorage = () => {
    try {
      const companyStr = localStorage.getItem('company') || localStorage.getItem('companyDetails');
      return companyStr ? JSON.parse(companyStr) : null;
    } catch (error) {
      console.error('Error parsing company data:', error);
      return null;
    }
  };

  const resolveCompanyId = (user) => (
    getRecordId(user?.company) ||
    getRecordId(user?.companyDetails) ||
    getRecordId(getCompanyFromStorage())
  );

  const resolveCompanyCode = (user) => (
    user?.companyCode ||
    user?.companyDetails?.companyCode ||
    getCompanyFromStorage()?.companyCode ||
    ''
  );

  const getDepartmentBranchId = (dept) => getRecordId(dept?.branch || dept?.branchId);

  const getBranchLabel = (branchValue) => {
    const branchId = getRecordId(branchValue);
    const branch = branches.find(br => getRecordId(br) === branchId) || (typeof branchValue === 'object' ? branchValue : null);
    if (!branch) return 'Unassigned';
    return branch.branchCode ? `${branch.name} (${branch.branchCode})` : branch.name;
  };

  
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

  
  const getUserFromStorage = () => {
    let userStr = localStorage.getItem('superAdmin');
    if (!userStr) userStr = localStorage.getItem('user');
    if (!userStr) userStr = sessionStorage.getItem('superAdmin') || sessionStorage.getItem('user');
    
    if (!userStr) {
      void 0;
      return null;
    }
    
    try {
      const user = JSON.parse(userStr);
      void 0;
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      toast.error('Error loading user data');
      return null;
    }
  };

  
  const checkSuperAdminStatus = (user) => {
    if (!user) return false;
    return user.role === 'super-admin' || 
           user.jobRole === 'super_admin' ||
           (user.role === 'super-admin' && user.department === 'Management');
  };

  
  useEffect(() => {
    setSelectedBranchId(requestedBranchId);
    setPage(0);
  }, [requestedBranchId]);

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        const user = getUserFromStorage();
        if (user) {
          setUserInfo(user);
          const isSuper = checkSuperAdminStatus(user);
          setIsSuperAdmin(isSuper);
          const companyId = resolveCompanyId(user);
          const companyCode = resolveCompanyCode(user);
          
          if (companyId) {
            setFormData(prev => ({
              ...prev,
              company: companyId,
              companyCode
            }));
            
            await fetchBranches(companyId);
          }
          
          await fetchDepartments(user, isSuper);
        } else {
          toast.error('Please login to continue');
        }
      } catch (error) {
        console.error('Error loading departments:', error);
        toast.error('Failed to load departments');
      } finally {
        
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, [refreshKey, showAllCompanies, selectedBranchId]);

  const fetchDepartments = async (user = null, isSuper = false) => {
    try {
      setLoading(true);
      if (!user) {
        user = getUserFromStorage();
        if (!user) {
          toast.error('User not found');
          return;
        }
        isSuper = checkSuperAdminStatus(user);
      }
      
      let params = {};
      const companyId = resolveCompanyId(user);
      
      if (!isSuper && !showAllCompanies) {
        if (companyId) {
          params.company = companyId;
        }
      }

      if (selectedBranchId) {
        params.branch = selectedBranchId;
      }
      
      void 0;
      
      const response = await axios.get('/departments', { params });
      const depts = response.data.departments || [];
      setDepartments(depts);
      
      void 0;
    } catch (err) {
      console.error('Fetch departments error:', err);
      toast.error(err.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };
  const fetchBranches = async (companyId) => {
    try {
      if (!companyId) return;
      setLoadingBranches(true);
      const response = await axios.get(`/branches/company/${companyId}`);
      if (response.data && response.data.success) {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    if (!formData.branch) {
      toast.error('Please select a branch');
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
      const companyId = resolveCompanyId(user);
      const companyCode = resolveCompanyCode(user);
      
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        branch: formData.branch,
        shiftSettings: formData.shiftSettings
      };
      
      if (!isSuper || formData.company) {
        submitData.company = formData.company || companyId;
        submitData.companyCode = formData.companyCode || companyCode;
      }
      
      void 0;
      
      if (editingDept) {
        await axios.put(`/departments/${editingDept._id}`, submitData);
        toast.success(
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg style={{ color: '#4caf50', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>Department Updated!</div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>{formData.name} has been updated successfully</div>
            </div>
          </div>,
          { icon: false, autoClose: 3000 }
        );
      } else {
        await axios.post('/departments', submitData);
        toast.success(
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg style={{ color: '#4caf50', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>Department Created!</div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>{formData.name} has been added to your organization</div>
            </div>
          </div>,
          { icon: false, autoClose: 3000 }
        );
      }
      
      setOpenDialog(false);
      setFormData({ 
        name: '', 
        description: '',
        company: companyId || '',
        companyCode: companyCode || '',
        branch: selectedBranchId || '',
        shiftSettings: {
          shiftStart: '09:00',
          shiftEnd: '19:00',
          earlyClockInMinutes: 30,
          gracePeriodMinutes: 10,
          halfDayLateMinutes: 120,
          shortLeaveEarlyMinutes: 30,
          halfDayEarlyMinutes: 240
        }
      });
      setEditingDept(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Submit error:', err);
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
      toast.success(
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg style={{ color: '#f44336', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          <div>
            <div style={{ fontWeight: 600 }}>Department Deleted!</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>{dept?.name} has been removed</div>
          </div>
        </div>,
        { icon: false, autoClose: 3000 }
      );
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
      company: getRecordId(dept.company) || resolveCompanyId(user) || '',
      companyCode: dept.companyCode || resolveCompanyCode(user) || '',
      branch: getDepartmentBranchId(dept) || '',
      shiftSettings: dept.shiftSettings || {
        shiftStart: '09:00',
        shiftEnd: '19:00',
        earlyClockInMinutes: 30,
        gracePeriodMinutes: 10,
        halfDayLateMinutes: 120,
        shortLeaveEarlyMinutes: 30,
        halfDayEarlyMinutes: 240
      }
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

  
  const handleRefresh = () => {
    toast.info('Refreshing departments...');
    setRefreshKey(prev => prev + 1);
  };

  
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleBranchFilterChange = (branchId) => {
    setSelectedBranchId(branchId);
    setPage(0);
    const nextParams = new URLSearchParams(searchParams);
    if (branchId) {
      nextParams.set('branch', branchId);
    } else {
      nextParams.delete('branch');
      nextParams.delete('branchId');
    }
    setSearchParams(nextParams, { replace: true });
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
    const user = userInfo || getUserFromStorage();
    const isSuper = checkSuperAdminStatus(user);
    
    if (!isSuper && !showAllCompanies) {
      const companyId = resolveCompanyId(user);
      filtered = departments.filter(dept => 
        !dept.company || getRecordId(dept.company) === companyId
      );
    }

    if (selectedBranchId) {
      filtered = filtered.filter(dept => getDepartmentBranchId(dept) === selectedBranchId);
    }
    
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
  const visibleStats = {
    total: filteredDepartments.length,
    active: filteredDepartments.filter(d => d.isActive !== false).length,
    inactive: filteredDepartments.filter(d => d.isActive === false).length
  };

  
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
              <span className="DepartmentManagement-tag DepartmentManagement-tag-code">
                {getBranchLabel(dept.branch || dept.branchId)}
              </span>
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

  
  const TabletDepartmentCard = ({ dept }) => (
    <div className="DepartmentManagement-tablet-card">
      <div className="DepartmentManagement-tablet-card-header">
        <div className="DepartmentManagement-tablet-card-title">
          <div className="DepartmentManagement-tablet-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/>
            </svg>
          </div>
          <div>
            <h3 className="DepartmentManagement-tablet-card-name">{dept.name}</h3>
            <div className="DepartmentManagement-tablet-card-tags">
              {dept.companyCode && (
                <span className="DepartmentManagement-tag DepartmentManagement-tag-code">{dept.companyCode}</span>
              )}
              <span className="DepartmentManagement-tag DepartmentManagement-tag-code">
                {getBranchLabel(dept.branch || dept.branchId)}
              </span>
              <span className={`DepartmentManagement-tag ${dept.isActive !== false ? 'DepartmentManagement-tag-active' : 'DepartmentManagement-tag-inactive'}`}>
                {dept.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="DepartmentManagement-tablet-card-actions">
          <button 
            className="DepartmentManagement-icon-btn DepartmentManagement-icon-btn-primary" 
            onClick={() => handleEdit(dept)}
            title="Edit"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button 
            className="DepartmentManagement-icon-btn DepartmentManagement-icon-btn-danger" 
            onClick={() => handleDelete(dept._id)}
            disabled={dept.isActive === false}
            title="Delete"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {dept.description && (
        <div className="DepartmentManagement-tablet-card-description">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <span>{dept.description}</span>
        </div>
      )}
      
      <div className="DepartmentManagement-tablet-card-footer">
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
      case 'admin':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>;
      case 'business':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/></svg>;
      case 'description':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>;
      case 'code':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>;
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
      case 'sort':
        return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>;
      default:
        return null;
    }
  };

  
  if (pageLoading) {
    return <CIISLoader />;
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
      
      {loading && (
        <div className="DepartmentManagement-loading-overlay">
          <div className="DepartmentManagement-progress-bar">
            <div className="DepartmentManagement-progress-fill" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      
      {departments.length > 0 && (
        <div className="DepartmentManagement-stats-grid">
          
          <div className="DepartmentManagement-stat-card DepartmentManagement-stat-total">
            <div className="DepartmentManagement-stat-icon">
              {getIconSvg('corporate', isMobile ? 24 : 28)}
            </div>
            <div className="DepartmentManagement-stat-content">
              <div className="DepartmentManagement-stat-label">Total</div>
              <div className="DepartmentManagement-stat-value-wrapper">
                <span className="DepartmentManagement-stat-value">{visibleStats.total}</span>
                {!isMobile && <span className="DepartmentManagement-stat-badge">All</span>}
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
                <span className="DepartmentManagement-stat-value">{visibleStats.active}</span>
                {!isMobile && (
                  <span className="DepartmentManagement-stat-badge">
                    {visibleStats.total > 0 ? Math.round((visibleStats.active / visibleStats.total) * 100) : 0}%
                  </span>
                )}
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
                <span className="DepartmentManagement-stat-value">{visibleStats.inactive}</span>
                {!isMobile && (
                  <span className="DepartmentManagement-stat-badge">
                    {visibleStats.total > 0 ? Math.round((visibleStats.inactive / visibleStats.total) * 100) : 0}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="DepartmentManagement-paper">
        
        <div className="DepartmentManagement-header">
          <div className="DepartmentManagement-title-section">
            <div className="DepartmentManagement-title-icon">
              {getIconSvg('corporate', isMobile ? 24 : 28)}
            </div>
            <div>
              <h2 className="DepartmentManagement-title">
                {isMobile ? 'Departments' : 'Department Management'}
              </h2>
              {userInfo && !isMobile && (
                <div className="DepartmentManagement-user-info">
                  <span className="DepartmentManagement-user-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    {userInfo.name}
                  </span>
                  <span className={`DepartmentManagement-role-chip ${isSuperAdmin ? 'DepartmentManagement-role-super' : 'DepartmentManagement-role-regular'}`}>
                    {userInfo.role}
                  </span>
                  {userInfo.companyCode && (
                    <span className="DepartmentManagement-company-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                      </svg>
                      {userInfo.companyCode}
                    </span>
                  )}
                </div>
              )}
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

            <select
              className="DepartmentManagement-filter-select"
              value={selectedBranchId}
              onChange={(e) => handleBranchFilterChange(e.target.value)}
              disabled={loadingBranches || branches.length === 0}
              title="Filter by branch"
            >
              <option value="">
                {loadingBranches
                  ? 'Loading branches...'
                  : branches.length === 0
                    ? 'No branches'
                    : 'All Branches'}
              </option>
              {branches.map(branch => (
                <option key={branch._id || branch.id} value={branch._id || branch.id}>
                  {branch.name} ({branch.branchCode})
                </option>
              ))}
            </select>
            
            
            {isMobile && (
              <button
                className="DepartmentManagement-filter-btn"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                {getIconSvg('filter', 20)}
              </button>
            )}
            
            
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
                    company: resolveCompanyId(user) || '',
                    companyCode: resolveCompanyCode(user) || '',
                    branch: selectedBranchId || ''
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

        
        {isMobile && showMobileFilters && (
          <div className="DepartmentManagement-mobile-filters">
            <div className="DepartmentManagement-mobile-filter-header">
              <h4>Sort & Filter</h4>
              <button onClick={() => setShowMobileFilters(false)}>×</button>
            </div>
            <div className="DepartmentManagement-mobile-filter-content">
              <div className="DepartmentManagement-filter-group">
                <label>Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="DepartmentManagement-filter-select"
                >
                  <option value="name">Name</option>
                  <option value="date">Date Created</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div className="DepartmentManagement-filter-group">
                <label>Order</label>
                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="DepartmentManagement-filter-select"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}

   

        
        {isTablet && !isMobile && (
          <div className="DepartmentManagement-view-tabs">
            <button 
              className={`DepartmentManagement-view-tab ${!isMobile ? 'active' : ''}`}
              onClick={() => {}}
            >
              Grid View
            </button>
            <button 
              className={`DepartmentManagement-view-tab ${isMobile ? 'active' : ''}`}
              onClick={() => {}}
            >
              List View
            </button>
          </div>
        )}

        
        {isMobile ? (
          
          <div className="DepartmentManagement-mobile-view">
            {filteredDepartments.length === 0 ? (
              <div className="DepartmentManagement-empty-state">
                <div className="DepartmentManagement-empty-icon">
                  {getIconSvg('corporate', 50)}
                </div>
                <h3 className="DepartmentManagement-empty-title">No Departments Found</h3>
                <p className="DepartmentManagement-empty-message">
                  {searchTerm 
                    ? 'No matches found. Try different keywords.'
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
                ) : null}
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
        ) : isTablet ? (
          
          <div className="DepartmentManagement-tablet-grid">
            {filteredDepartments.length === 0 ? (
              <div className="DepartmentManagement-empty-state">
                <div className="DepartmentManagement-empty-icon">
                  {getIconSvg('corporate', 50)}
                </div>
                <h3 className="DepartmentManagement-empty-title">No Departments Found</h3>
                <p className="DepartmentManagement-empty-message">
                  {searchTerm ? 'No departments match your search' : 'Get started by adding a department'}
                </p>
              </div>
            ) : (
              filteredDepartments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(dept => (
                  <TabletDepartmentCard key={dept._id} dept={dept} />
                ))
            )}
          </div>
        ) : (
          
          <div className="DepartmentManagement-table-container">
            <table className="DepartmentManagement-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Branch</th>
                  {isSuperAdmin && showAllCompanies && <th>Company Code</th>}
                  <th>Created By</th>
                  <th>Created On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin && showAllCompanies ? 8 : 7} className="DepartmentManagement-empty-cell">
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
                    .map((dept, index) => (
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
                          <span className="DepartmentManagement-chip DepartmentManagement-chip-code">
                            {getBranchLabel(dept.branch || dept.branchId)}
                          </span>
                        </td>
                        {isSuperAdmin && showAllCompanies && (
                          <td>
                            {dept.companyCode ? (
                              <span className="DepartmentManagement-chip DepartmentManagement-chip-code">
                                {dept.companyCode}
                              </span>
                            ) : (
                              <span className="DepartmentManagement-text-muted">Global</span>
                            )}
                          </td>
                        )}
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

        
        {isMobile && (
          <button
            className="DepartmentManagement-fab"
            onClick={() => {
              const user = getUserFromStorage();
              setFormData({ 
                name: '', 
                description: '',
                company: resolveCompanyId(user) || '',
                companyCode: resolveCompanyCode(user) || '',
                branch: selectedBranchId || ''
              });
              setOpenDialog(true);
            }}
          >
            {getIconSvg('add', 28)}
          </button>
        )}

        
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
                  {!isMobile && <span className="DepartmentManagement-menu-subtitle">Modify department details</span>}
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
                  {!isMobile && (
                    <span className="DepartmentManagement-menu-subtitle">
                      {!selectedDeptMenu?.isActive ? 'Already inactive' : 'Remove permanently'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      
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
                  {!isMobile && (
                    <p className="DepartmentManagement-modal-subtitle">
                      {editingDept 
                        ? 'Update department information' 
                        : 'Add a new department to organize your teams'}
                    </p>
                  )}
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
              
              {userInfo?.companyCode && !isSuperAdmin && (
                <div className="DepartmentManagement-info-banner">
                  <svg width={isMobile ? "18" : "22"} height={isMobile ? "18" : "22"} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/>
                  </svg>
                  <div>
                    <div className="DepartmentManagement-info-title">
                      {isMobile ? userInfo.companyCode : `Creating for ${userInfo.companyCode}`}
                    </div>
                    {!isMobile && (
                      <div className="DepartmentManagement-info-subtitle">
                        This department will be associated with your company
                      </div>
                    )}
                  </div>
                </div>
              )}

              
              <div className="DepartmentManagement-form-group">
                <label className="DepartmentManagement-form-label">Branch *</label>
                <div className="DepartmentManagement-input-wrapper">
                  <span className="DepartmentManagement-input-icon">
                    {getIconSvg('business', isMobile ? 18 : 20)}
                  </span>
                  <select
                    className="DepartmentManagement-form-input"
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    disabled={loadingBranches || branches.length === 0}
                    required
                    style={{ appearance: 'none', background: 'transparent', outline: 'none' }}
                  >
                    <option value="">
                      {loadingBranches 
                        ? "Loading branches..." 
                        : branches.length === 0 
                          ? "No branches available" 
                          : "Select Branch"}
                    </option>
                    {branches.map(br => (
                      <option key={br._id || br.id} value={br._id || br.id}>
                        {br.name} ({br.branchCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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

              <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <h4 style={{ marginBottom: '15px', color: '#333' }}>Shift Settings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="DepartmentManagement-form-group">
                    <label className="DepartmentManagement-form-label">Shift Start (HH:MM)</label>
                    <input
                      type="text"
                      className="DepartmentManagement-form-input"
                      value={formData.shiftSettings?.shiftStart || '09:00'}
                      onChange={(e) => setFormData({
                        ...formData,
                        shiftSettings: { ...formData.shiftSettings, shiftStart: e.target.value }
                      })}
                    />
                  </div>
                  <div className="DepartmentManagement-form-group">
                    <label className="DepartmentManagement-form-label">Shift End (HH:MM)</label>
                    <input
                      type="text"
                      className="DepartmentManagement-form-input"
                      value={formData.shiftSettings?.shiftEnd || '19:00'}
                      onChange={(e) => setFormData({
                        ...formData,
                        shiftSettings: { ...formData.shiftSettings, shiftEnd: e.target.value }
                      })}
                    />
                  </div>
                  <div className="DepartmentManagement-form-group">
                    <label className="DepartmentManagement-form-label">Early Buffer (Mins)</label>
                    <input
                      type="number"
                      className="DepartmentManagement-form-input"
                      value={formData.shiftSettings?.earlyClockInMinutes || 30}
                      onChange={(e) => setFormData({
                        ...formData,
                        shiftSettings: { ...formData.shiftSettings, earlyClockInMinutes: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="DepartmentManagement-form-group">
                    <label className="DepartmentManagement-form-label">Grace Period (Mins)</label>
                    <input
                      type="number"
                      className="DepartmentManagement-form-input"
                      value={formData.shiftSettings?.gracePeriodMinutes || 10}
                      onChange={(e) => setFormData({
                        ...formData,
                        shiftSettings: { ...formData.shiftSettings, gracePeriodMinutes: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="DepartmentManagement-form-group">
                    <label className="DepartmentManagement-form-label">Half-Day Late Cutoff (Mins)</label>
                    <input
                      type="number"
                      className="DepartmentManagement-form-input"
                      value={formData.shiftSettings?.halfDayLateMinutes || 120}
                      onChange={(e) => setFormData({
                        ...formData,
                        shiftSettings: { ...formData.shiftSettings, halfDayLateMinutes: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="DepartmentManagement-form-group">
                    <label className="DepartmentManagement-form-label">Short Leave Early Out (Mins)</label>
                    <input
                      type="number"
                      className="DepartmentManagement-form-input"
                      value={formData.shiftSettings?.shortLeaveEarlyMinutes || 30}
                      onChange={(e) => setFormData({
                        ...formData,
                        shiftSettings: { ...formData.shiftSettings, shortLeaveEarlyMinutes: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="DepartmentManagement-form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="DepartmentManagement-form-label">Half-Day Early Out (Mins)</label>
                    <input
                      type="number"
                      className="DepartmentManagement-form-input"
                      value={formData.shiftSettings?.halfDayEarlyMinutes || 240}
                      onChange={(e) => setFormData({
                        ...formData,
                        shiftSettings: { ...formData.shiftSettings, halfDayEarlyMinutes: Number(e.target.value) }
                      })}
                    />
                  </div>
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
