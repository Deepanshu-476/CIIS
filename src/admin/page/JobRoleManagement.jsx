import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import './JobRoleManagement.css';
import CIISLoader from '../../Loader/CIISLoader'; 


const Transition = (props) => {
  return <div className="JobRoleManagement-transition" {...props} />;
};

const SHIFT_TEMPLATES = [
  {
    id: 'general',
    label: 'General Shift',
    settings: {
      shiftName: 'General Shift',
      shiftType: 'general',
      shiftStart: '09:00',
      shiftEnd: '19:00',
      earlyClockInStart: '08:30',
      lateGraceLimit: '09:10',
      halfDayLateLimit: '11:00',
      shortLeaveEarlyLimit: '18:30',
      halfDayEarlyLimit: '15:00',
      secondHalfStart: '14:00',
      secondHalfClockInWindow: {
        start: '13:30',
        end: '14:30'
      }
    }
  },
  {
    id: 'morning',
    label: 'Morning Shift',
    settings: {
      shiftName: 'Morning Shift',
      shiftType: 'morning',
      shiftStart: '06:00',
      shiftEnd: '14:00',
      earlyClockInStart: '05:30',
      lateGraceLimit: '06:10',
      halfDayLateLimit: '08:00',
      shortLeaveEarlyLimit: '13:30',
      halfDayEarlyLimit: '10:00',
      secondHalfStart: '10:00',
      secondHalfClockInWindow: {
        start: '09:30',
        end: '10:30'
      }
    }
  },
  {
    id: 'evening',
    label: 'Evening Shift',
    settings: {
      shiftName: 'Evening Shift',
      shiftType: 'evening',
      shiftStart: '14:00',
      shiftEnd: '22:00',
      earlyClockInStart: '13:30',
      lateGraceLimit: '14:10',
      halfDayLateLimit: '16:00',
      shortLeaveEarlyLimit: '21:30',
      halfDayEarlyLimit: '18:00',
      secondHalfStart: '18:00',
      secondHalfClockInWindow: {
        start: '17:30',
        end: '18:30'
      }
    }
  },
  {
    id: 'night',
    label: 'Night Shift',
    settings: {
      shiftName: 'Night Shift',
      shiftType: 'night',
      shiftStart: '22:00',
      shiftEnd: '06:00',
      earlyClockInStart: '21:30',
      lateGraceLimit: '22:10',
      halfDayLateLimit: '00:00',
      shortLeaveEarlyLimit: '05:30',
      halfDayEarlyLimit: '02:00',
      secondHalfStart: '02:00',
      secondHalfClockInWindow: {
        start: '01:30',
        end: '02:30'
      }
    }
  },
  {
    id: 'custom',
    label: 'Create Custom Shift',
    settings: {
      shiftName: '',
      shiftType: 'custom',
      shiftStart: '09:00',
      shiftEnd: '18:00',
      earlyClockInStart: '08:30',
      lateGraceLimit: '09:10',
      halfDayLateLimit: '11:00',
      shortLeaveEarlyLimit: '17:30',
      halfDayEarlyLimit: '14:00',
      secondHalfStart: '13:30',
      secondHalfClockInWindow: {
        start: '13:00',
        end: '14:00'
      }
    }
  }
];

const getShiftTemplateSettings = (templateId = 'general') => {
  const template = SHIFT_TEMPLATES.find(item => item.id === templateId) || SHIFT_TEMPLATES[0];
  return {
    ...template.settings,
    secondHalfClockInWindow: { ...template.settings.secondHalfClockInWindow }
  };
};

const getDefaultShiftSettings = () => getShiftTemplateSettings('general');

const createShiftSettings = (templateId = 'general') => ({
  ...getShiftTemplateSettings(templateId),
  shiftId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
});

const normalizeRoleShifts = (jobRole = {}) => {
  const shifts = Array.isArray(jobRole.shifts) && jobRole.shifts.length > 0
    ? jobRole.shifts
    : [jobRole.shiftSettings || getDefaultShiftSettings()];

  return shifts.map((shift, index) => ({
    ...getDefaultShiftSettings(),
    ...shift,
    shiftId: shift.shiftId || shift.id || shift._id || `${jobRole._id || 'role'}-shift-${index}`,
    secondHalfClockInWindow: {
      ...getDefaultShiftSettings().secondHalfClockInWindow,
      ...(shift.secondHalfClockInWindow || {})
    }
  }));
};

const JobRoleManagement = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [pageLoading, setPageLoading] = useState(true); 
  
  const [jobRoles, setJobRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJobRole, setEditingJobRole] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    branch: '',
    department: '',
    company: '',  
    companyCode: '',
    shiftSettings: getDefaultShiftSettings(),
    shifts: [createShiftSettings()]
  });
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJobRoleMenu, setSelectedJobRoleMenu] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withDepartment: 0
  });

  useEffect(() => {
    if (!openDialog) return undefined;

    const bodyOverflow = document.body.style.overflow;
    const bodyPaddingRight = document.body.style.paddingRight;
    const htmlOverflow = document.documentElement.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.body.style.paddingRight = bodyPaddingRight;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [openDialog]);

  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      setRowsPerPage(window.innerWidth < 768 ? 5 : 10);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
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

  const getDepartmentBranchId = (department) => getRecordId(department?.branch || department?.branchId);

  const getBranchLabel = (branchValue) => {
    const branchId = getRecordId(branchValue);
    const branch = branches.find(br => getRecordId(br) === branchId) || (typeof branchValue === 'object' ? branchValue : null);
    if (!branch) return 'Unassigned';
    return branch.branchCode ? `${branch.name} (${branch.branchCode})` : branch.name;
  };

  const getEmptyFormData = (user = null, overrides = {}) => ({
    name: '',
    description: '',
    branch: '',
    department: '',
    company: resolveCompanyId(user) || '',
    companyCode: resolveCompanyCode(user) || '',
    shiftSettings: getDefaultShiftSettings(),
    shifts: [createShiftSettings()],
    ...overrides
  });

  
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
    
    const isSuper = 
      (user.role === 'super-admin' && 
       user.department === 'Management' && 
       user.jobRole === 'super_admin') ||
      user.role === 'super-admin' ||
      user.jobRole === 'super_admin';
    
    void 0;
    
    return isSuper;
  };

  
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

          if (companyId && companyCode) {
            setFormData(prev => ({
              ...prev,
              company: companyId,
              companyCode
            }));
          }
          
          await fetchJobRoles(user, isSuper);
          await fetchBranches(user);
          await fetchDepartments(user, isSuper);
        } else {
          toast.error('Please login to continue');
        }
      } catch (error) {
        console.error('Error loading job roles:', error);
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
      if (!user) {
        user = getUserFromStorage();
        if (!user) {
          toast.error('User not found');
          return;
        }
        isSuper = checkSuperAdminStatus(user);
      }
      
      let params = {};
      
      if (!isSuper && !showAllCompanies) {
        const companyId = resolveCompanyId(user);
        if (companyId) {
          params.company = companyId;
        }
      }
      
      void 0;
      
      const response = await axios.get('/job-roles', { params });
      const roles = response.data.jobRoles || [];
      setJobRoles(roles);
      
      
      setStats({
        total: roles.length,
        active: roles.filter(r => r.isActive !== false).length,
        inactive: roles.filter(r => r.isActive === false).length,
        withDepartment: roles.filter(r => r.department).length
      });
      
      void 0;
    } catch (err) {
      console.error('Fetch job roles error:', err);
      toast.error(err.response?.data?.message || 'Failed to load job roles');
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
      
      if (!isSuper) {
        const companyId = resolveCompanyId(user);
        if (companyId) {
          params.company = companyId;
        }
      }
      
      const response = await axios.get('/departments', { params });
      setDepartments(response.data.departments || []);
      
      void 0;
    } catch (err) {
      console.error('Fetch departments error:', err);
      toast.error(err.response?.data?.message || 'Failed to load departments');
    }
  };

  const fetchBranches = async (user = null) => {
    try {
      const currentUser = user || getUserFromStorage();
      const companyId = resolveCompanyId(currentUser);
      if (!companyId) {
        setBranches([]);
        return;
      }

      setLoadingBranches(true);
      const response = await axios.get(`/branches/company/${companyId}`);
      setBranches(response.data?.branches || response.data?.data || []);
    } catch (err) {
      console.error('Fetch branches error:', err);
      toast.error(err.response?.data?.message || 'Failed to load branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Job role name is required');
      return;
    }

    if (!formData.branch) {
      toast.error('Please select a branch');
      return;
    }

    if (!formData.department) {
      toast.error('Please select a department');
      return;
    }

    const cleanedShifts = (formData.shifts?.length ? formData.shifts : [formData.shiftSettings])
      .filter(Boolean)
      .map((shift, index) => ({
        ...getDefaultShiftSettings(),
        ...shift,
        shiftId: shift.shiftId || `${Date.now()}-${index}`,
        shiftName: (shift.shiftName || '').trim(),
        secondHalfClockInWindow: {
          ...getDefaultShiftSettings().secondHalfClockInWindow,
          ...(shift.secondHalfClockInWindow || {})
        }
      }));

    if (cleanedShifts.some(shift => !shift.shiftName)) {
      toast.error('Please enter shift name for every shift');
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
        department: formData.department,
        shiftSettings: cleanedShifts[0],
        shifts: cleanedShifts
      };
      
      if (!isSuper || formData.company) {
        submitData.company = formData.company || companyId;
        submitData.companyCode = formData.companyCode || companyCode;
      }
      
      void 0;
      
      if (editingJobRole) {
        await axios.put(`/job-roles/${editingJobRole._id}`, submitData);
        toast.success(
          <div className="JobRoleManagement-toast-content">
            <span className="JobRoleManagement-toast-icon">✓</span>
            <div>
              <div className="JobRoleManagement-toast-title">Job Role Updated!</div>
              <div className="JobRoleManagement-toast-subtitle">{formData.name} has been updated successfully</div>
            </div>
          </div>,
          { icon: false, autoClose: 3000 }
        );
      } else {
        await axios.post('/job-roles', submitData);
        toast.success(
          <div className="JobRoleManagement-toast-content">
            <span className="JobRoleManagement-toast-icon">✓</span>
            <div>
              <div className="JobRoleManagement-toast-title">Job Role Created!</div>
              <div className="JobRoleManagement-toast-subtitle">{formData.name} has been added to your organization</div>
            </div>
          </div>,
          { icon: false, autoClose: 3000 }
        );
      }
      
      setOpenDialog(false);
      setFormData(getEmptyFormData(user));
      setEditingJobRole(null);
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
    const jobRole = jobRoles.find(j => j._id === id);
    if (!window.confirm(`Are you sure you want to delete "${jobRole?.name}"?`)) return;

    try {
      setLoading(true);
      await axios.delete(`/job-roles/${id}`);
      toast.success(
        <div className="JobRoleManagement-toast-content">
          <span className="JobRoleManagement-toast-icon JobRoleManagement-toast-icon-delete">🗑️</span>
          <div>
            <div className="JobRoleManagement-toast-title">Job Role Deleted!</div>
            <div className="JobRoleManagement-toast-subtitle">{jobRole?.name} has been removed</div>
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

  const handleEdit = (jobRole) => {
    setEditingJobRole(jobRole);
    const user = getUserFromStorage();
    const departmentId = getRecordId(jobRole.department);
    const selectedDepartment = departments.find(dept => getRecordId(dept) === departmentId) || jobRole.department;
    const branchId = getDepartmentBranchId(selectedDepartment);
    
    const roleShifts = normalizeRoleShifts(jobRole);

    setFormData({ 
      name: jobRole.name, 
      description: jobRole.description || '',
      branch: branchId,
      department: departmentId,
      company: getRecordId(jobRole.company) || resolveCompanyId(user) || '',
      companyCode: jobRole.companyCode || resolveCompanyCode(user) || '',
      shiftSettings: roleShifts[0] || getDefaultShiftSettings(),
      shifts: roleShifts
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

  
  const handleRefresh = () => {
    toast.info('Refreshing job roles...');
    setRefreshKey(prev => prev + 1);
  };

  const updateShiftAt = (index, updater) => {
    setFormData(prev => {
      const currentShifts = prev.shifts?.length ? prev.shifts : [prev.shiftSettings || getDefaultShiftSettings()];
      const shifts = currentShifts.map((shift, shiftIndex) => {
        if (shiftIndex !== index) return shift;
        const nextShift = typeof updater === 'function' ? updater(shift) : { ...shift, ...updater };
        return {
          ...nextShift,
          secondHalfClockInWindow: {
            ...(shift.secondHalfClockInWindow || getDefaultShiftSettings().secondHalfClockInWindow),
            ...(nextShift.secondHalfClockInWindow || {})
          }
        };
      });

      return {
        ...prev,
        shifts,
        shiftSettings: shifts[0] || getDefaultShiftSettings()
      };
    });
  };

  const addShift = () => {
    setFormData(prev => {
      const shifts = [...(prev.shifts?.length ? prev.shifts : [prev.shiftSettings || getDefaultShiftSettings()]), createShiftSettings('custom')];
      return {
        ...prev,
        shifts,
        shiftSettings: shifts[0] || getDefaultShiftSettings()
      };
    });
  };

  const removeShift = (index) => {
    setFormData(prev => {
      const shifts = (prev.shifts?.length ? prev.shifts : [prev.shiftSettings || getDefaultShiftSettings()])
        .filter((_, shiftIndex) => shiftIndex !== index);
      const safeShifts = shifts.length ? shifts : [createShiftSettings()];
      return {
        ...prev,
        shifts: safeShifts,
        shiftSettings: safeShifts[0]
      };
    });
  };

  
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  
  const getFilteredJobRoles = () => {
    let filtered = jobRoles;
    const user = userInfo || getUserFromStorage();
    const isSuper = checkSuperAdminStatus(user);
    
    if (!isSuper && !showAllCompanies) {
      const companyId = resolveCompanyId(user);
      filtered = jobRoles.filter(jobRole => 
        !jobRole.company || 
        getRecordId(jobRole.company) === companyId
      );
    }
    
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
  const branchDepartments = formData.branch
    ? departments.filter(dept => getDepartmentBranchId(dept) === formData.branch)
    : [];

  
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
              <span className="JobRoleManagement-action-icon">✏️</span>
            </button>
            <button 
              className={`JobRoleManagement-action-btn JobRoleManagement-action-delete ${jobRole.isActive === false ? 'JobRoleManagement-disabled' : ''}`}
              onClick={() => handleDelete(jobRole._id)}
              disabled={jobRole.isActive === false}
            >
              <span className="JobRoleManagement-action-icon">🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="JobRoleManagement-container">
      
      {loading && (
        <div className="JobRoleManagement-loading-overlay">
          <div className="JobRoleManagement-progress-bar">
            <div className="JobRoleManagement-progress-fill"></div>
          </div>
        </div>
      )}

      
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
                  <span className="JobRoleManagement-stat-chip">All roles</span>
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
                  <span className="JobRoleManagement-stat-chip">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</span>
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
                  <span className="JobRoleManagement-stat-chip">{stats.total > 0 ? Math.round((stats.withDepartment / stats.total) * 100) : 0}%</span>
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
                  <span className="JobRoleManagement-stat-chip">{stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="JobRoleManagement-paper">
        
        <div className="JobRoleManagement-header">
          <div className="JobRoleManagement-header-left">
            <div className="JobRoleManagement-header-icon-box">
              <span className="JobRoleManagement-header-icon">📋</span>
            </div>
            <div className="JobRoleManagement-header-text">
              <h2 className="JobRoleManagement-header-title">Job Role Management</h2>
              {userInfo && (
                <div className="JobRoleManagement-user-info">
                  <span className="JobRoleManagement-user-chip">
                    <span className="JobRoleManagement-chip-icon">👤</span>
                    {userInfo.name}
                  </span>
                  <span className="JobRoleManagement-user-chip JobRoleManagement-chip-primary">
                    {userInfo.role}
                  </span>
                  {userInfo.companyCode && (
                    <span className="JobRoleManagement-user-chip JobRoleManagement-chip-primary">
                      <span className="JobRoleManagement-chip-icon">📊</span>
                      {userInfo.companyCode}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="JobRoleManagement-header-actions">
            
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
                  <span className="JobRoleManagement-clear-icon">✕</span>
                </button>
              )}
            </div>
            
            
            <button
              className="JobRoleManagement-btn-primary"
              onClick={() => {
                setEditingJobRole(null);
                const user = getUserFromStorage();
                
                if (!user) {
                  toast.error('Please login first');
                  return;
                }
                
                setFormData(getEmptyFormData(user));
                setOpenDialog(true);
              }}
            >
              <span className="JobRoleManagement-btn-icon">+</span>
              {isMobile ? 'Add' : 'Add Job Role'}
            </button>
          </div>
        </div>


        {!userInfo && (
          <div className="JobRoleManagement-alert JobRoleManagement-alert-warning">
            <span className="JobRoleManagement-alert-icon">⚠️</span>
            <span>User information not found. Please login again.</span>
          </div>
        )}

        
        {isMobile ? (
          
          <div className="JobRoleManagement-mobile-view">
            {filteredJobRoles.length === 0 ? (
              <div className="JobRoleManagement-empty-state">
                <div className="JobRoleManagement-empty-icon">📋</div>
                <h3 className="JobRoleManagement-empty-title">No Job Roles Found</h3>
                <p className="JobRoleManagement-empty-text">
                  {searchTerm 
                    ? 'No job roles match your search criteria. Try different keywords.'
                    : 'Get started by creating your first job role to define positions.'}
                </p>
                {searchTerm ? (
                  <button 
                    className="JobRoleManagement-btn-outline"
                    onClick={handleClearSearch}
                  >
                    <span className="JobRoleManagement-btn-icon">✕</span>
                    Clear Search
                  </button>
                ) : (
                  <button 
                    className="JobRoleManagement-btn-primary"
                    onClick={() => {
                      const user = getUserFromStorage();
                      setEditingJobRole(null);
                      setFormData(getEmptyFormData(user));
                      setOpenDialog(true);
                    }}
                  >
                    <span className="JobRoleManagement-btn-icon">+</span>
                    Add Job Role
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredJobRoles
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(jobRole => (
                    <MobileJobRoleCard key={jobRole._id} jobRole={jobRole} />
                  ))
                }
              </>
            )}
          </div>
        ) : (
          
          <div className="JobRoleManagement-table-container">
            <table className="JobRoleManagement-table">
              <thead>
                <tr>
                  <th>Job Role Name</th>
                  <th>Description</th>
                  <th>Department</th>
                  {isSuperAdmin && showAllCompanies && (
                    <th>Company Code</th>
                  )}
                  <th>Created By</th>
                  <th>Created On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobRoles.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin && showAllCompanies ? 8 : 7} className="JobRoleManagement-empty-cell">
                      <div className="JobRoleManagement-table-empty">
                        <span className="JobRoleManagement-table-empty-icon">📋</span>
                        <h4>No Job Roles Found</h4>
                        <p>{searchTerm ? 'No job roles match your search' : 'Get started by adding a job role'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobRoles
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((jobRole, index) => (
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
                        {isSuperAdmin && showAllCompanies && (
                          <td>
                            {jobRole.companyCode ? (
                              <span className="JobRoleManagement-badge JobRoleManagement-badge-primary">
                                {jobRole.companyCode}
                              </span>
                            ) : (
                              <span className="JobRoleManagement-text-disabled">Global</span>
                            )}
                          </td>
                        )}
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
                              <span className="JobRoleManagement-icon">✏️</span>
                            </button>
                            <button 
                              className={`JobRoleManagement-icon-btn JobRoleManagement-icon-delete ${jobRole.isActive === false ? 'JobRoleManagement-disabled' : ''}`}
                              onClick={() => handleDelete(jobRole._id)}
                              title="Delete Job Role"
                              disabled={jobRole.isActive === false}
                            >
                              <span className="JobRoleManagement-icon">🗑️</span>
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
                {Array.from({ length: Math.ceil(filteredJobRoles.length / rowsPerPage) }, (_, i) => (
                  <button
                    key={i}
                    className={`JobRoleManagement-pagination-btn ${page === i ? 'JobRoleManagement-active' : ''}`}
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
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

        
        {isMobile && (
          <button
            className="JobRoleManagement-fab"
            onClick={() => {
              const user = getUserFromStorage();
              setEditingJobRole(null);
              setFormData(getEmptyFormData(user));
              setOpenDialog(true);
            }}
          >
            <span className="JobRoleManagement-fab-icon">+</span>
          </button>
        )}

        
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
                  <div className="JobRoleManagement-menu-subtitle">Modify role details</div>
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
                  <div className="JobRoleManagement-menu-subtitle">
                    {!selectedJobRoleMenu?.isActive ? 'Already inactive' : 'Remove permanently'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      
      {openDialog && (
        <div className="JobRoleManagement-modal-overlay" onClick={() => !loading && setOpenDialog(false)}>
          <div className={`JobRoleManagement-modal ${isMobile ? 'JobRoleManagement-modal-fullscreen' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="JobRoleManagement-modal-header">
              <div className="JobRoleManagement-modal-header-content">
                <div className="JobRoleManagement-modal-avatar">
                  {editingJobRole ? (
                    <span aria-hidden="true">✏️</span>
                  ) : (
                    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
                      <path d="M9 7V5.8C9 4.8 9.8 4 10.8 4h2.4c1 0 1.8.8 1.8 1.8V7m-9 0h12c.6 0 1 .4 1 1v10c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1V8c0-.6.4-1 1-1Zm5 5h2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="JobRoleManagement-modal-title-section">
                  <h3 className="JobRoleManagement-modal-title">
                    {editingJobRole ? 'Edit Job Role' : 'Create New Job Role'}
                  </h3>
                  <p className="JobRoleManagement-modal-subtitle">
                    {editingJobRole 
                      ? 'Update job role information' 
                      : 'Define role details and working-hour policies'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="JobRoleManagement-modal-close"
                onClick={() => setOpenDialog(false)}
                disabled={loading}
                aria-label="Close job role form"
              >
                ×
              </button>
            </div>
            
            <div className="JobRoleManagement-modal-body">
              
              {userInfo?.companyCode && !isSuperAdmin && (
                <div className="JobRoleManagement-info-banner">
                  <span className="JobRoleManagement-info-icon">🏢</span>
                  <div>
                    <div className="JobRoleManagement-info-title">
                      Creating job role for {userInfo.companyCode}
                    </div>
                    <div className="JobRoleManagement-info-subtitle">
                      This role will be associated with your company
                    </div>
                  </div>
                </div>
              )}
              
              <section className="JobRoleManagement-form-section">
                <div className="JobRoleManagement-section-heading">
                  <span className="JobRoleManagement-section-marker" aria-hidden="true" />
                  <div>
                    <h4>Basic Information</h4>
                    <p>Define the role name, responsibilities and department.</p>
                  </div>
                </div>

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
                <label className="JobRoleManagement-form-label">Branch *</label>
                <select
                  className="JobRoleManagement-form-select"
                  value={formData.branch}
                  onChange={(e) => setFormData({
                    ...formData,
                    branch: e.target.value,
                    department: ''
                  })}
                  disabled={loadingBranches || branches.length === 0}
                >
                  <option value="">
                    {loadingBranches
                      ? 'Loading branches...'
                      : branches.length === 0
                        ? 'No branches available'
                        : 'Select Branch'}
                  </option>
                  {branches.map(branch => (
                    <option key={branch._id || branch.id} value={branch._id || branch.id}>
                      {getBranchLabel(branch)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="JobRoleManagement-form-group">
                <label className="JobRoleManagement-form-label">Department *</label>
                <select
                  className="JobRoleManagement-form-select"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  disabled={!formData.branch}
                >
                  <option value="">
                    {!formData.branch
                      ? 'Select branch first'
                      : branchDepartments.length === 0
                        ? 'No departments in selected branch'
                        : 'Select Department'}
                  </option>
                  {branchDepartments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} {dept.companyCode ? `(${dept.companyCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              </section>

              <section className="JobRoleManagement-form-section">
                <div className="JobRoleManagement-section-heading">
                  <span className="JobRoleManagement-section-clock" aria-hidden="true">◷</span>
                  <div>
                    <h4>Shift &amp; Clock-in Settings</h4>
                    <p>Create or select a shift, then configure clock-in rules for it.</p>
                  </div>
                </div>
                <div className="JobRoleManagement-shift-list">
                  {(formData.shifts?.length ? formData.shifts : [formData.shiftSettings || getDefaultShiftSettings()]).map((shift, index) => (
                    <div className="JobRoleManagement-shift-card" key={shift.shiftId || index}>
                      <div className="JobRoleManagement-shift-card-header">
                        <strong>Shift {index + 1}</strong>
                        {formData.shifts?.length > 1 && (
                          <button
                            type="button"
                            className="JobRoleManagement-shift-remove"
                            onClick={() => removeShift(index)}
                            disabled={loading}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="JobRoleManagement-shift-builder">
                        <div className="JobRoleManagement-form-group">
                          <label className="JobRoleManagement-form-label">Shift Template *</label>
                          <select
                            className="JobRoleManagement-form-select"
                            value={shift.shiftType || 'general'}
                            onChange={(e) => {
                              const nextShift = {
                                ...getShiftTemplateSettings(e.target.value),
                                shiftId: shift.shiftId
                              };
                              updateShiftAt(index, nextShift);
                            }}
                          >
                            {SHIFT_TEMPLATES.map(template => (
                              <option key={template.id} value={template.id}>
                                {template.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="JobRoleManagement-form-group">
                          <label className="JobRoleManagement-form-label">Shift Name *</label>
                          <input
                            type="text"
                            className="JobRoleManagement-form-input"
                            value={shift.shiftName || ''}
                            onChange={(e) => updateShiftAt(index, { shiftName: e.target.value })}
                            placeholder="e.g. Support Morning Shift"
                          />
                        </div>
                      </div>
                      <div className="JobRoleManagement-time-grid">
                        {[
                          ['shiftStart', 'Shift Start Time', '09:00'],
                          ['shiftEnd', 'Shift End Time', '19:00'],
                          ['earlyClockInStart', 'Early Clock-in Allowed From', '08:30'],
                          ['lateGraceLimit', 'Late Grace Limit Time', '09:10'],
                          ['halfDayLateLimit', 'Half-Day Late Limit Time', '11:00'],
                          ['shortLeaveEarlyLimit', 'Short Leave Limit Time', '18:30'],
                          ['halfDayEarlyLimit', 'Half-Day Early Out Limit Time', '15:00']
                        ].map(([field, label, fallback]) => (
                          <div className="JobRoleManagement-form-group" key={field}>
                            <label className="JobRoleManagement-form-label">{label}</label>
                            <input
                              type="time"
                              className="JobRoleManagement-form-input"
                              value={shift[field] || fallback}
                              onChange={(e) => updateShiftAt(index, { [field]: e.target.value })}
                            />
                          </div>
                        ))}
                        <div className="JobRoleManagement-form-group">
                          <label className="JobRoleManagement-form-label">2nd Half Clock-in Window Start</label>
                          <input
                            type="time"
                            className="JobRoleManagement-form-input"
                            value={shift.secondHalfClockInWindow?.start || '13:30'}
                            onChange={(e) => updateShiftAt(index, {
                              secondHalfClockInWindow: {
                                ...(shift.secondHalfClockInWindow || {}),
                                start: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div className="JobRoleManagement-form-group">
                          <label className="JobRoleManagement-form-label">2nd Half Clock-in Window End</label>
                          <input
                            type="time"
                            className="JobRoleManagement-form-input"
                            value={shift.secondHalfClockInWindow?.end || '14:30'}
                            onChange={(e) => updateShiftAt(index, {
                              secondHalfClockInWindow: {
                                ...(shift.secondHalfClockInWindow || {}),
                                end: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="JobRoleManagement-add-shift-btn"
                  onClick={addShift}
                  disabled={loading}
                >
                  + Add Shift
                </button>
              </section>
            </div>
            
            <div className="JobRoleManagement-modal-footer">
              <p className="JobRoleManagement-modal-note">
                <span aria-hidden="true">i</span> All times are in 24-hour format.
              </p>
              <div className="JobRoleManagement-modal-actions">
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
                disabled={loading || !formData.name.trim() || !formData.branch || !formData.department || !(formData.shifts?.length ? formData.shifts : [formData.shiftSettings]).every(shift => shift?.shiftName?.trim())}
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
        </div>
      )}
    </div>
  );
};

export default JobRoleManagement;
