import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import './CreateUser.css';
import CIISLoader from '../../Loader/CIISLoader';

// Constants
const genderOptions = ['male', 'female', 'other'];
const maritalStatusOptions = ['single', 'married', 'divorced', 'widowed'];
const employeeTypeOptions = ['permanent', 'probation', 'contract', 'intern', 'trainee'];

// Initial form state
const initialFormState = {
  name: '', email: '', password: '', confirmPassword: '',
  department: '', jobRole: '',
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
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingJobRoles, setLoadingJobRoles] = useState(false);
  const navigate = useNavigate();

  // LocalStorage se company data
  const [companyId, setCompanyId] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ FIXED: LocalStorage se data fetch karna
  useEffect(() => {
    const fetchDataFromLocalStorage = () => {
      try {
        // Try multiple possible storage keys
        let userData = null;
        let token = null;
        
        // Check for superAdmin
        const superAdminStr = localStorage.getItem('superAdmin');
        if (superAdminStr) {
          userData = JSON.parse(superAdminStr);
          console.log("📋 Found superAdmin:", userData);
        }
        
        // Check for user
        const userStr = localStorage.getItem('user');
        if (userStr && !userData) {
          userData = JSON.parse(userStr);
          console.log("📋 Found user:", userData);
        }
        
        // Check for token
        token = localStorage.getItem('token');
        
        if (userData) {
          setCurrentUser(userData);
          
          // Try multiple possible company field names
          const companyIdValue = userData.companyId || userData.company || userData.company_id || userData.CompanyId;
          const companyCodeValue = userData.companyCode || userData.code || userData.company_code;
          
          console.log("🏢 Company ID from userData:", companyIdValue);
          console.log("🏢 Company Code from userData:", companyCodeValue);
          
          if (companyIdValue && companyCodeValue) {
            setCompanyId(companyIdValue);
            setCompanyCode(companyCodeValue);
          } else {
            // Try to get from separate company object
            const companyStr = localStorage.getItem('company');
            if (companyStr) {
              const companyData = JSON.parse(companyStr);
              console.log("📋 Found separate company:", companyData);
              setCompanyId(companyData._id || companyData.id);
              setCompanyCode(companyData.companyCode || companyData.code);
            } else {
              toast.error("Company information not found in your profile");
              navigate('/dashboard');
            }
          }
        } else if (token) {
          // Try to get company from separate storage
          const companyStr = localStorage.getItem('company');
          if (companyStr) {
            const companyData = JSON.parse(companyStr);
            console.log("📋 Found company from separate storage:", companyData);
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

  // ✅ FIXED: Departments fetch with better company ID handling
  useEffect(() => {
    const loadDepartments = async () => {
      if (companyId) {
        console.log("🔍 Company ID found, fetching departments for:", companyId);
        await fetchDepartments();
      } else if (companyCode) {
        console.log("🔍 Company Code found, fetching departments by code:", companyCode);
        await fetchDepartmentsByCode();
      } else {
        console.log("⚠️ No company ID or code yet, waiting...");
        // Retry after 1 second if still no company ID
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
    
    loadDepartments();
  }, [companyId, companyCode]);

  // Department change pe job roles fetch karna
  useEffect(() => {
    if (form.department) {
      fetchJobRolesByDepartment(form.department);
    } else {
      setJobRoles([]);
      setForm(prev => ({ ...prev, jobRole: '' }));
    }
  }, [form.department]);

  // Page loading complete
  useEffect(() => {
    if (companyId && (departments.length > 0 || !loadingDepartments)) {
      setTimeout(() => {
        setPageLoading(false);
      }, 500);
    }
  }, [companyId, departments, loadingDepartments]);

  // ✅ FIXED: Fetch Departments by ID
  const fetchDepartments = async () => {
    try {
      if (!companyId) {
        console.warn("No company ID available");
        return;
      }
      
      setLoadingDepartments(true);
      console.log("📡 Fetching departments for company ID:", companyId);
      
      let response = null;
      let success = false;
      
      // Try multiple endpoints with company ID
      const endpoints = [
        `/departments?companyId=${companyId}`,
        `/departments?company=${companyId}`,
        `/departments/company/${companyId}`,
        `/api/departments?companyId=${companyId}`,
        `/department/company/${companyId}`,
        `/departments/by-company/${companyId}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          response = await axios.get(endpoint);
          console.log(`✅ Success with: ${endpoint}`, response.data);
          success = true;
          break;
        } catch (err) {
          console.log(`❌ Failed: ${endpoint}`, err.response?.status, err.message);
        }
      }
      
      if (!success) {
        throw new Error("All department endpoints failed");
      }

      // Handle different response formats
      let departmentsData = [];
      const data = response.data;
      console.log("📦 Raw department response:", data);
      
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
      
      console.log("✅ Processed departments:", departmentsData);
      setDepartments(departmentsData);

      if (departmentsData.length === 0) {
        toast.warning('No departments found for this company');
      } else {
        toast.success(`${departmentsData.length} departments loaded`);
      }

    } catch (err) {
      console.error("❌ All department fetch attempts failed:", err);
      toast.error('Failed to load departments. Please check API endpoint.');
      setDepartments([]);
      
      console.log("🔍 Debug - Company ID:", companyId);
      console.log("🔍 Debug - Company Code:", companyCode);
      
    } finally {
      setLoadingDepartments(false);
    }
  };

  // ✅ NEW: Fetch Departments by Code
  const fetchDepartmentsByCode = async () => {
    try {
      if (!companyCode) return;
      
      setLoadingDepartments(true);
      console.log("📡 Fetching departments for company code:", companyCode);
      
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
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          response = await axios.get(endpoint);
          console.log(`✅ Success with: ${endpoint}`, response.data);
          success = true;
          break;
        } catch (err) {
          console.log(`❌ Failed: ${endpoint}`, err.message);
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
      
      console.log("✅ Processed departments by code:", departmentsData);
      setDepartments(departmentsData);

    } catch (err) {
      console.error("❌ Failed to fetch departments by code:", err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // ✅ FIXED: Fetch Job Roles with better handling
  const fetchJobRolesByDepartment = async (departmentId) => {
    try {
      if (!departmentId) {
        setJobRoles([]);
        return;
      }

      setLoadingJobRoles(true);
      console.log("📡 Fetching job roles for department:", departmentId);
      
      let response = null;
      let success = false;
      
      // Try multiple endpoints
      const endpoints = [
        `/job-roles?departmentId=${departmentId}`,
        `/job-roles?department=${departmentId}`,
        `/job-roles/department/${departmentId}`,
        `/api/job-roles?departmentId=${departmentId}`,
        `/job-roles/by-department/${departmentId}`,
        `/job-roles/department-id/${departmentId}`,
        `/job-roles?dept=${departmentId}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying job role endpoint: ${endpoint}`);
          response = await axios.get(endpoint);
          console.log(`✅ Success with: ${endpoint}`, response.data);
          success = true;
          break;
        } catch (err) {
          console.log(`❌ Failed: ${endpoint}`, err.response?.status, err.message);
        }
      }
      
      if (!success) {
        // Try with company context
        const companyEndpoints = [
          `/job-roles?companyId=${companyId}&departmentId=${departmentId}`,
          `/job-roles?company=${companyId}&department=${departmentId}`,
          `/job-roles/company/${companyId}/department/${departmentId}`
        ];
        
        for (const endpoint of companyEndpoints) {
          try {
            console.log(`🔄 Trying with company context: ${endpoint}`);
            response = await axios.get(endpoint);
            console.log(`✅ Success with: ${endpoint}`, response.data);
            success = true;
            break;
          } catch (err) {
            console.log(`❌ Failed: ${endpoint}`, err.message);
          }
        }
      }
      
      if (!success) {
        throw new Error("All job role endpoints failed");
      }

      // Handle different response formats
      let jobRolesData = [];
      const data = response.data;
      console.log("📦 Raw job role response:", data);
      
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
      
      console.log("✅ Processed job roles:", jobRolesData);
      setJobRoles(jobRolesData);
      
      if (jobRolesData.length === 0) {
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
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'department') {
      setForm(prev => ({ ...prev, jobRole: '' }));
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
    if (!form.department) {
      toast.error('Please select a department');
      return false;
    }
    if (!form.jobRole) {
      toast.error('Please select a job role');
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
        company: companyId,
        companyCode: companyCode
      };

      console.log("📦 Submitting user data:", userData);
      
      const response = await axios.post('/auth/register', userData);
      console.log("✅ Server response:", response.data);
      toast.success('✅ User created successfully');
      
      setForm({ ...initialFormState });
      
      // Reset select fields
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

  // Debug logs
  console.log("🏢 Current departments state:", departments);
  console.log("📋 Selected department ID:", form.department);
  console.log("🎯 Job Roles:", jobRoles);
  console.log("🏢 Company ID:", companyId);
  console.log("🏢 Company Code:", companyCode);

  // Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="CreateUser-container">
      <div className="CreateUser-paper">
        {/* Header Section */}
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

        {/* Company Info Box */}
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
              Departments Loaded: {departments.length}
            </p>
          </div>
        )}

        <p className="CreateUser-required-text">
          <span className="CreateUser-required-star">*</span> All marked fields are required
        </p>

        <hr className="CreateUser-divider" />

        <form onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <h3 className="CreateUser-section-title">
            Personal Information
          </h3>

          <div className="CreateUser-form-grid">
            {/* ROW 1: Name & Email */}
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

            {/* ROW 2: Password & Confirm Password */}
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

            {/* ROW 3: Department & Job Role */}
            <div className="CreateUser-form-row">
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
                    disabled={loadingDepartments || departments.length === 0}
                    required
                  >
                    <option value="">
                      {loadingDepartments 
                        ? "Loading departments..." 
                        : departments.length === 0 
                          ? "No departments available" 
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
                {departments.length === 0 && !loadingDepartments && (
                  <small className="CreateUser-helper-text CreateUser-helper-text-error">
                    No departments available. Please create departments first.
                  </small>
                )}
              </div>

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
                        ? "Select a department first" 
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
            </div>

            {/* ROW 4: Gender & Marital Status */}
            <div className="CreateUser-form-row">
              <div className="CreateUser-form-group">
                <label htmlFor="gender" className="CreateUser-label">
                  Gender <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-select-wrapper">
                  <span className="CreateUser-select-icon">⚥</span>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleSelectChange}
                    className="CreateUser-select"
                    required
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
                  Marital Status <span className="CreateUser-required-star">*</span>
                </label>
                <div className="CreateUser-select-wrapper">
                  <span className="CreateUser-select-icon">💍</span>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={form.maritalStatus}
                    onChange={handleSelectChange}
                    className="CreateUser-select"
                    required
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

            {/* ROW 5: Date of Birth & Phone */}
            <div className="CreateUser-form-row">
              <div className="CreateUser-form-group">
                <label htmlFor="dob" className="CreateUser-label">
                  Date of Birth <span className="CreateUser-required-star">*</span>
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
                    required
                  />
                </div>
              </div>

              <div className="CreateUser-form-group">
                <label htmlFor="phone" className="CreateUser-label">
                  Phone Number <span className="CreateUser-required-star">*</span>
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
                    required
                  />
                </div>
                <small className="CreateUser-helper-text">10 digits only</small>
              </div>
            </div>
          </div>

          <hr className="CreateUser-divider" />

          {/* Address Information */}
          <h3 className="CreateUser-section-title">
            Address Information
          </h3>

          <div className="CreateUser-form-grid">
            <div className="CreateUser-form-group CreateUser-full-width">
              <label htmlFor="address" className="CreateUser-label">
                Address <span className="CreateUser-required-star">*</span>
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
                  required
                ></textarea>
              </div>
            </div>
          </div>

          <hr className="CreateUser-divider" />
          
          {/* Submit Button */}
          <button
            type="submit"
            className="CreateUser-submit-button"
            disabled={loading || (!companyId && !companyCode) || departments.length === 0 || !form.jobRole}
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

          {/* Warning Messages */}
          {(!companyId && !companyCode) && (
            <div className="CreateUser-info-message CreateUser-error-message">
              ⚠️ Company information is missing. Please login again or contact support.
            </div>
          )}

          {departments.length === 0 && (companyId || companyCode) && !loadingDepartments && (
            <div className="CreateUser-info-message CreateUser-warning-message">
              ⚠️ No departments found. Please create departments first before adding users.
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