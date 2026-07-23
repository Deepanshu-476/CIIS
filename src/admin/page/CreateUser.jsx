import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import './CreateUser.css';
import CIISLoader from '../../Loader/CIISLoader';


const genderOptions = ['male', 'female', 'other'];
const maritalStatusOptions = ['single', 'married', 'divorced', 'widowed'];
const employeeTypeOptions = ['permanent', 'probation', 'contract', 'intern', 'trainee'];

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return value._id || value.id || value.value || '';
  return String(value);
};

const roleBelongsToDepartment = (role, departmentId) => {
  if (!departmentId) return true;

  const roleDepartmentId =
    getId(role.department) ||
    getId(role.departmentId) ||
    getId(role.dept) ||
    getId(role.deptId);

  return !roleDepartmentId || roleDepartmentId === departmentId;
};

const departmentBelongsToBranch = (department, branchId) => {
  if (!branchId) return true;

  const departmentBranchId =
    getId(department.branch) ||
    getId(department.branchId) ||
    getId(department.branch_id);

  return departmentBranchId === branchId;
};

const getRoleShiftOptions = (role = {}) => {
  const shifts = Array.isArray(role.shifts) && role.shifts.length > 0
    ? role.shifts
    : (role.shiftSettings ? [role.shiftSettings] : []);

  return shifts.map((shift, index) => ({
    ...shift,
    shiftId: shift.shiftId || shift.id || shift._id || `${getId(role)}-shift-${index}`,
    shiftName: shift.shiftName || shift.name || `Shift ${index + 1}`,
    shiftType: shift.shiftType || 'custom'
  }));
};

const initialFormState = {
  name: '', email: '', password: '', confirmPassword: '',
  branch: '', department: '', jobRole: '', shiftId: '',
  phone: '', address: '', gender: '', maritalStatus: '', dob: '', salary: '',
  accountNumber: '', ifsc: '', bankName: '', bankHolderName: '',
  employeeType: '', properties: [], propertyOwned: '', additionalDetails: '',
  fatherName: '', motherName: '', emergencyName: '', emergencyPhone: '',
  emergencyRelation: '', emergencyAddress: ''
};

const CreateUser = () => {
  const [form, setForm] = useState(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingJobRoles, setLoadingJobRoles] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const navigate = useNavigate();

  
  const [companyId, setCompanyId] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  
  useEffect(() => {
    const fetchDataFromLocalStorage = () => {
      try {
        
        let userData = null;
        let token = null;
        
        
        const superAdminStr = localStorage.getItem('superAdmin');
        if (superAdminStr) {
          userData = JSON.parse(superAdminStr);
          void 0;
        }
        
        
        const userStr = localStorage.getItem('user');
        if (userStr && !userData) {
          userData = JSON.parse(userStr);
          void 0;
        }
        
        
        token = localStorage.getItem('token');
        
        if (userData) {
          setCurrentUser(userData);
          
          
          const companyIdValue = userData.companyId || userData.company || userData.company_id || userData.CompanyId;
          const companyCodeValue = userData.companyCode || userData.code || userData.company_code;
          
          void 0;
          void 0;
          
          if (companyIdValue && companyCodeValue) {
            setCompanyId(companyIdValue);
            setCompanyCode(companyCodeValue);
          } else {
            
            const companyStr = localStorage.getItem('company');
            if (companyStr) {
              const companyData = JSON.parse(companyStr);
              void 0;
              setCompanyId(companyData._id || companyData.id);
              setCompanyCode(companyData.companyCode || companyData.code);
            } else {
              toast.error("Company information not found in your profile");
              navigate('/dashboard');
            }
          }
        } else if (token) {
          
          const companyStr = localStorage.getItem('company');
          if (companyStr) {
            const companyData = JSON.parse(companyStr);
            void 0;
            setCompanyId(companyData._id || companyData.id);
            setCompanyCode(companyData.companyCode || companyData.code);
            setCurrentUser({ name: companyData.companyName || 'Admin' });
          } else {
            toast.error("Please login again");
            navigate('/login');
          }
        } else {
          toast.error("Please login again");
          navigate('/login');
        }
      } catch (error) {
        console.error("❌ Error parsing localStorage data:", error);
        toast.error("Error loading user data");
        navigate('/login');
      }
    };

    fetchDataFromLocalStorage();
  }, [navigate]);

  
  useEffect(() => {
    const loadData = async () => {
      if (companyId) {
        void 0;
        await fetchBranches();
      } else if (companyCode) {
        void 0;
        await fetchDepartmentsByCode();
      } else {
        void 0;
        
        const timer = setTimeout(() => {
          const retryCompanyId = localStorage.getItem('companyId') || 
                                 JSON.parse(localStorage.getItem('company')?._id);
          if (retryCompanyId) {
            setCompanyId(retryCompanyId);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    };
    
    loadData();
  }, [companyId, companyCode]);

  useEffect(() => {
    if (form.branch) {
      fetchDepartments(form.branch);
    } else {
      setDepartments([]);
      setJobRoles([]);
      setForm(prev => ({ ...prev, department: '', jobRole: '', shiftId: '' }));
    }
  }, [form.branch]);

  
  useEffect(() => {
    if (form.department) {
      fetchJobRolesByDepartment(form.department);
    } else {
      setJobRoles([]);
      setForm(prev => ({ ...prev, jobRole: '', shiftId: '' }));
    }
  }, [form.department]);

  
  useEffect(() => {
    if (companyId && !loadingBranches) {
      setTimeout(() => {
        setPageLoading(false);
      }, 500);
    }
  }, [companyId, loadingBranches]);

  
  const fetchDepartments = async (branchId = form.branch) => {
    try {
      if (!companyId) {
        console.warn("No company ID available");
        return;
      }

      if (!branchId) {
        setDepartments([]);
        return;
      }
      
      setLoadingDepartments(true);
      void 0;
      
      let response = null;
      let success = false;
      
      
      const endpoints = [
        `/departments?company=${companyId}&branch=${branchId}`,
        `/departments?companyId=${companyId}&branch=${branchId}`,
        `/departments/company/${companyId}?branch=${branchId}`,
        `/api/departments?companyId=${companyId}`,
        `/department/company/${companyId}`,
        `/departments/by-company/${companyId}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          void 0;
          response = await axios.get(endpoint);
          void 0;
          success = true;
          break;
        } catch (err) {
          void 0;
        }
      }
      
      if (!success) {
        throw new Error("All department endpoints failed");
      }

      
      let departmentsData = [];
      const data = response.data;
      void 0;
      
      if (data) {
        if (Array.isArray(data)) {
          departmentsData = data;
        }
        else if (data.departments && Array.isArray(data.departments)) {
          departmentsData = data.departments;
        }
        else if (data.data && Array.isArray(data.data)) {
          departmentsData = data.data;
        }
        else if (data.result && Array.isArray(data.result)) {
          departmentsData = data.result;
        }
        else if (data.success && data.departments && Array.isArray(data.departments)) {
          departmentsData = data.departments;
        }
        else if (data.success && data.data && Array.isArray(data.data)) {
          departmentsData = data.data;
        }
      }
      
      void 0;
      const branchDepartments = departmentsData.filter(dept => departmentBelongsToBranch(dept, branchId));
      setDepartments(branchDepartments);

      if (branchDepartments.length === 0) {
        toast.warning('No departments found for this branch');
      } else {
        toast.success(`${branchDepartments.length} departments loaded`);
      }

    } catch (err) {
      console.error("❌ All department fetch attempts failed:", err);
      toast.error('Failed to load departments for selected branch.');
      setDepartments([]);
      
      void 0;
      void 0;
      
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchBranches = async () => {
    try {
      if (!companyId) return;
      setLoadingBranches(true);
      void 0;
      const response = await axios.get(`/branches/company/${companyId}`);
      if (response.data && response.data.success) {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error("❌ Failed to load branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  
  const fetchDepartmentsByCode = async () => {
    try {
      if (!companyCode) return;
      
      setLoadingDepartments(true);
      void 0;
      
      let response = null;
      let success = false;
      
      const endpoints = [
        `/departments?companyCode=${companyCode}`,
        `/departments/code/${companyCode}`,
        `/api/departments?code=${companyCode}`,
        `/department/company-code/${companyCode}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          void 0;
          response = await axios.get(endpoint);
          void 0;
          success = true;
          break;
        } catch (err) {
          void 0;
        }
      }
      
      if (!success) {
        throw new Error("All department by code endpoints failed");
      }

      let departmentsData = [];
      const data = response.data;
      
      if (data) {
        if (Array.isArray(data)) departmentsData = data;
        else if (data.departments && Array.isArray(data.departments)) departmentsData = data.departments;
        else if (data.data && Array.isArray(data.data)) departmentsData = data.data;
        else if (data.result && Array.isArray(data.result)) departmentsData = data.result;
      }
      
      void 0;
      setDepartments(departmentsData);

    } catch (err) {
      console.error("❌ Failed to fetch departments by code:", err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  
  const fetchJobRolesByDepartment = async (departmentId) => {
    try {
      if (!departmentId) {
        setJobRoles([]);
        return;
      }

      setLoadingJobRoles(true);
      void 0;
      
      let response = null;
      let success = false;
      
      
      const endpoints = [
        companyId ? `/job-roles?company=${companyId}&department=${departmentId}` : null,
        companyId ? `/job-roles?companyId=${companyId}&departmentId=${departmentId}` : null,
        `/job-roles?departmentId=${departmentId}`,
        `/job-roles?department=${departmentId}`,
        `/job-roles/department/${departmentId}`,
        `/api/job-roles?departmentId=${departmentId}`,
        `/job-roles/by-department/${departmentId}`,
        `/job-roles/department-id/${departmentId}`,
        `/job-roles?dept=${departmentId}`
      ].filter(Boolean);
      
      for (const endpoint of endpoints) {
        try {
          void 0;
          response = await axios.get(endpoint);
          void 0;
          success = true;
          break;
        } catch (err) {
          void 0;
        }
      }
      
      if (!success && companyId) {
        
        const companyEndpoints = [
          `/job-roles?companyId=${companyId}&departmentId=${departmentId}`,
          `/job-roles?company=${companyId}&department=${departmentId}`,
          `/job-roles/company/${companyId}/department/${departmentId}`
        ];
        
        for (const endpoint of companyEndpoints) {
          try {
            void 0;
            response = await axios.get(endpoint);
            void 0;
            success = true;
            break;
          } catch (err) {
            void 0;
          }
        }
      }
      
      if (!success) {
        throw new Error("All job role endpoints failed");
      }

      
      let jobRolesData = [];
      const data = response.data;
      void 0;
      
      if (data) {
        if (Array.isArray(data)) {
          jobRolesData = data;
        }
        else if (data.jobRoles && Array.isArray(data.jobRoles)) {
          jobRolesData = data.jobRoles;
        }
        else if (data.data && Array.isArray(data.data)) {
          jobRolesData = data.data;
        }
        else if (data.result && Array.isArray(data.result)) {
          jobRolesData = data.result;
        }
        else if (data.roles && Array.isArray(data.roles)) {
          jobRolesData = data.roles;
        }
        else if (data.success && data.jobRoles && Array.isArray(data.jobRoles)) {
          jobRolesData = data.jobRoles;
        }
      }
      
      void 0;
      const departmentJobRoles = jobRolesData.filter(role => roleBelongsToDepartment(role, departmentId));
      void 0;
      setJobRoles(departmentJobRoles);
      
      if (departmentJobRoles.length === 0) {
        toast.warning('No job roles found for this department');
      }

    } catch (err) {
      console.error("❌ Failed to load job roles:", err);
      toast.error('Failed to load job roles');
      setJobRoles([]);
    } finally {
      setLoadingJobRoles(false);
    }
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;

    if (['name', 'fatherName', 'motherName', 'emergencyName', 'bankHolderName'].includes(name)) {
      if (/^[a-zA-Z\s]*$/.test(value) || value === '') {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    }
    else if (['phone', 'salary', 'accountNumber', 'emergencyPhone'].includes(name)) {
      if (/^\d*$/.test(value) || value === '') {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    }
    else if (name === 'ifsc') {
      if (/^[a-zA-Z0-9]*$/.test(value) || value === '') {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    if (name === 'branch') {
      setForm(prev => ({ ...prev, branch: value, department: '', jobRole: '', shiftId: '' }));
      setDepartments([]);
      setJobRoles([]);
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'department') {
      setForm(prev => ({ ...prev, jobRole: '', shiftId: '' }));
    }

    if (name === 'jobRole') {
      setForm(prev => ({ ...prev, shiftId: '' }));
    }
  };

  const validateForm = () => {
    if (!form.name || form.name.length < 2) {
      toast.error('Name must be at least 2 characters');
      return false;
    }
    if (!form.email.includes('@')) {
      toast.error('Enter a valid email');
      return false;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!form.branch) {
      toast.error('Please select a branch');
      return false;
    }
    if (!form.department) {
      toast.error('Please select a department');
      return false;
    }
    if (!form.jobRole) {
      toast.error('Please select a job role');
      return false;
    }
    if (!form.shiftId) {
      toast.error('Please select a shift');
      return false;
    }
    if (!companyId && !companyCode) {
      toast.error('Company information is missing');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!companyId && !companyCode) {
      toast.error("Company reference is missing");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;

      const userData = {
        ...submitData,
        shiftName: selectedShift?.shiftName || '',
        shiftType: selectedShift?.shiftType || '',
        company: companyId,
        companyCode: companyCode
      };

      void 0;
      
      const response = await axios.post('/auth/register', userData);
      void 0;
      toast.success('✅ User created successfully');
      
      setForm({ ...initialFormState });
      
      
      setDepartments([]);
      setJobRoles([]);

    } catch (err) {
      console.error("❌ Registration error:", err);
      const msg = err?.response?.data?.message || '❌ User creation failed';
      toast.error(msg);

      if (err.response?.status === 409) {
        toast.error('Email already exists in this company');
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (currentUser?.name) {
      return currentUser.name.toUpperCase();
    }
    return 'USER';
  };

  const selectedJobRole = jobRoles.find(role => getId(role) === form.jobRole);
  const shiftOptions = selectedJobRole ? getRoleShiftOptions(selectedJobRole) : [];
  const selectedShift = shiftOptions.find(shift => String(shift.shiftId) === String(form.shiftId));

  
  void 0;
  void 0;
  void 0;
  void 0;
  void 0;

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="CreateUser-container">
      <div className="CreateUser-paper">
        
        <div className="CreateUser-header">
          <div>
            <h2 className="CreateUser-header-title">
              Create New User
            </h2>
            <p className="CreateUser-header-subtitle">
              Add a new team member to your organization
            </p>
          </div>
        </div>

        
        {currentUser && (
          <div className="CreateUser-company-info-box">
            <h3 className="CreateUser-company-name">
              {getUserDisplayName()}
            </h3>
            <p className="CreateUser-company-details">
              Created by: {currentUser.name || currentUser.email || 'Admin'} ({currentUser.jobRole || 'super_admin'})
            </p>
            <p className="CreateUser-company-details">
              Company ID: {companyId || 'Loading...'}
            </p>
            <p className="CreateUser-company-details CreateUser-company-details-highlight">
              Branches Loaded: {branches.length} | Departments Loaded: {departments.length}
            </p>
          </div>
        )}

        <p className="CreateUser-required-text">
          <span className="CreateUser-required-star">*</span> All marked fields are required
        </p>

        <hr className="CreateUser-divider" />

        <form onSubmit={handleSubmit}>
          
          <h3 className="CreateUser-section-title">
            Personal Information
          </h3>

          <div className="CreateUser-form-grid">
            
            <div className="CreateUser-form-row">
              <div className="CreateUser-form-group">
                <label htmlFor="name" className="CreateUser-label">
                  Full Name <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-input-wrapper">
                  <span className="CreateUser-input-icon">👤</span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleTextChange}
                    className="CreateUser-input"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <small className="CreateUser-helper-text">Only letters and spaces</small>
              </div>

              <div className="CreateUser-form-group">
                <label htmlFor="email" className="CreateUser-label">
                  Email Address <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-input-wrapper">
                  <span className="CreateUser-input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleTextChange}
                    className="CreateUser-input"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
            </div>

            
            <div className="CreateUser-form-row">
              <div className="CreateUser-form-group">
                <label htmlFor="password" className="CreateUser-label">
                  Password <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-input-wrapper">
                  <span className="CreateUser-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleTextChange}
                    className="CreateUser-input"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    className="CreateUser-password-toggle"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <small className="CreateUser-helper-text">Minimum 8 characters</small>
              </div>

              <div className="CreateUser-form-group">
                <label htmlFor="confirmPassword" className="CreateUser-label">
                  Confirm Password <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-input-wrapper">
                  <span className="CreateUser-input-icon">🔒</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleTextChange}
                    className="CreateUser-input"
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    className="CreateUser-password-toggle"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            
            <div className="CreateUser-form-row">
              <div className="CreateUser-form-group">
                <label htmlFor="branch" className="CreateUser-label">
                  Branch <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-select-wrapper">
                  <span className="CreateUser-select-icon">🏢</span>
                  <select
                    id="branch"
                    name="branch"
                    value={form.branch}
                    onChange={handleSelectChange}
                    className="CreateUser-select"
                    disabled={loadingBranches || branches.length === 0}
                    required
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
                  <span className="CreateUser-select-arrow">▼</span>
                </div>
                {branches.length === 0 && !loadingBranches && (
                  <small className="CreateUser-helper-text CreateUser-helper-text-error">
                    No branches available. Please create branches first.
                  </small>
                )}
              </div>

              <div className="CreateUser-form-group">
                <label htmlFor="department" className="CreateUser-label">
                  Department <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-select-wrapper">
                  <span className="CreateUser-select-icon">🏢</span>
                  <select
                    id="department"
                    name="department"
                    value={form.department}
                    onChange={handleSelectChange}
                    className="CreateUser-select"
                    disabled={!form.branch || loadingDepartments || departments.length === 0}
                    required
                  >
                    <option value="">
                      {!form.branch
                        ? "Select branch first"
                        : loadingDepartments 
                          ? "Loading departments..." 
                          : departments.length === 0 
                            ? "No departments available in this branch" 
                            : "Select Department"}
                    </option>
                    {departments.map(dept => (
                      <option key={dept._id || dept.id} value={dept._id || dept.id}>
                        {dept.name || dept.departmentName || dept.title}
                      </option>
                    ))}
                  </select>
                  <span className="CreateUser-select-arrow">▼</span>
                </div>
                {form.branch && departments.length === 0 && !loadingDepartments && (
                  <small className="CreateUser-helper-text CreateUser-helper-text-error">
                    No departments available in this branch. Please create branch departments first.
                  </small>
                )}
              </div>
            </div>

            
            <div className="CreateUser-form-row">
              <div className="CreateUser-form-group">
                <label htmlFor="jobRole" className="CreateUser-label">
                  Job Role <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-select-wrapper">
                  <span className="CreateUser-select-icon">💼</span>
                  <select
                    id="jobRole"
                    name="jobRole"
                    value={form.jobRole}
                    onChange={handleSelectChange}
                    className="CreateUser-select"
                    disabled={!form.department || loadingJobRoles || jobRoles.length === 0}
                    required
                  >
                    <option value="">
                      {!form.department 
                        ? "Select branch and department first" 
                        : loadingJobRoles 
                          ? "Loading job roles..." 
                          : jobRoles.length === 0 
                            ? "No job roles available" 
                            : "Select Job Role"}
                    </option>
                    {jobRoles.map(role => (
                      <option key={role._id || role.id} value={role._id || role.id}>
                        {role.name || role.title || role.roleName}
                      </option>
                    ))}
                  </select>
                  <span className="CreateUser-select-arrow">▼</span>
                </div>
                {form.department && jobRoles.length === 0 && !loadingJobRoles && (
                  <small className="CreateUser-helper-text CreateUser-helper-text-error">
                    No job roles defined for this department
                  </small>
                )}
              </div>

              <div className="CreateUser-form-group">
                <label htmlFor="shiftId" className="CreateUser-label">
                  Shift <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-select-wrapper">
                  <span className="CreateUser-select-icon">T</span>
                  <select
                    id="shiftId"
                    name="shiftId"
                    value={form.shiftId}
                    onChange={handleSelectChange}
                    className="CreateUser-select"
                    disabled={!form.jobRole || shiftOptions.length === 0}
                    required
                  >
                    <option value="">
                      {!form.jobRole
                        ? "Select job role first"
                        : shiftOptions.length === 0
                          ? "No shifts available"
                          : "Select Shift"}
                    </option>
                    {shiftOptions.map(shift => (
                      <option key={shift.shiftId} value={shift.shiftId}>
                        {shift.shiftName} ({shift.shiftStart || '09:00'} - {shift.shiftEnd || '19:00'})
                      </option>
                    ))}
                  </select>
                  <span className="CreateUser-select-arrow">â–¼</span>
                </div>
                {form.jobRole && shiftOptions.length === 0 && (
                  <small className="CreateUser-helper-text CreateUser-helper-text-error">
                    No shifts defined for this job role
                  </small>
                )}
              </div>
            </div>

            
            <div className="CreateUser-form-row">
              <div className="CreateUser-form-group">
                <label htmlFor="gender" className="CreateUser-label">
                  Gender <span className="CreateUser-required-star"></span>
                </label>
                <div className="CreateUser-select-wrapper">
                  <span className="CreateUser-select-icon">⚥</span>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleSelectChange}
                    className="CreateUser-select"
                    
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                  <span className="CreateUser-select-arrow">▼</span>
                </div>
              </div>

              <div className="CreateUser-form-group">
                <label htmlFor="maritalStatus" className="CreateUser-label">
                  Marital Status <span className="CreateUser-required-star"></span>
                </label>
                <div className="CreateUser-select-wrapper">
                  <span className="CreateUser-select-icon">💍</span>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={form.maritalStatus}
                    onChange={handleSelectChange}
                    className="CreateUser-select"
                    
                  >
                    <option value="">Select Marital Status</option>
                    {maritalStatusOptions.map(option => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                  <span className="CreateUser-select-arrow">▼</span>
                </div>
              </div>
            </div>

            
            <div className="CreateUser-form-row">
              <div className="CreateUser-form-group">
                <label htmlFor="dob" className="CreateUser-label">
                  Date of Birth <span className="CreateUser-required-star"></span>
                </label>
                <div className="CreateUser-input-wrapper">
                  <span className="CreateUser-input-icon">🎂</span>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={form.dob}
                    onChange={handleTextChange}
                    className="CreateUser-input"
                    
                  />
                </div>
              </div>

              <div className="CreateUser-form-group">
                <label htmlFor="phone" className="CreateUser-label">
                  Phone Number <span className="CreateUser-required-star"></span>
                </label>
                <div className="CreateUser-input-wrapper">
                  <span className="CreateUser-input-icon">📞</span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleTextChange}
                    className="CreateUser-input"
                    placeholder="Enter 10 digit number"
                    maxLength="10"
                    
                  />
                </div>
                <small className="CreateUser-helper-text">10 digits only</small>
              </div>
            </div>
          </div>

          <hr className="CreateUser-divider" />

          
          <h3 className="CreateUser-section-title">
            Address Information
          </h3>

          <div className="CreateUser-form-grid">
            <div className="CreateUser-form-group CreateUser-full-width">
              <label htmlFor="address" className="CreateUser-label">
                Address <span className="CreateUser-required-star"></span>
              </label>
              <div className="CreateUser-input-wrapper">
                <span className="CreateUser-input-icon CreateUser-textarea-icon">🏠</span>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleTextChange}
                  className="CreateUser-textarea"
                  placeholder="Enter full address"
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>

          <hr className="CreateUser-divider" />
          
          
          <button
            type="submit"
            className="CreateUser-submit-button"
            disabled={loading || (!companyId && !companyCode) || !form.branch || !form.department || !form.jobRole || !form.shiftId}
          >
            {loading ? (
              <>
                <span className="CreateUser-spinner"></span>
                Creating User...
              </>
            ) : (
              <>
                <span className="CreateUser-button-icon">+</span>
                Create New User
              </>
            )}
          </button>

          
          {(!companyId && !companyCode) && (
            <div className="CreateUser-info-message CreateUser-error-message">
              ⚠️ Company information is missing. Please login again or contact support.
            </div>
          )}

          {form.branch && departments.length === 0 && (companyId || companyCode) && !loadingDepartments && (
            <div className="CreateUser-info-message CreateUser-warning-message">
              ⚠️ No departments found for selected branch. Please create departments first before adding users.
              <br />
              <small>Company ID: {companyId || 'Not found'} | Code: {companyCode || 'Not found'}</small>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
