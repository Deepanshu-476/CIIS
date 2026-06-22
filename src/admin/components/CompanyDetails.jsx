import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config";
import "./CompanyDetails.css";
import CIISLoader from '../../Loader/CIISLoader';

const CompanyDetails = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedBranchId = searchParams.get("branch") || searchParams.get("branchId") || "";
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    departments: 0,
    todayLogins: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [apiDebug, setApiDebug] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [weeklyLogins, setWeeklyLogins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(requestedBranchId);
  
  // Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    maritalStatus: "",
    dob: "",
    department: "",
    jobRole: "",
    role: "",
    employeeType: "",
    designation: "",
    salary: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    bankHolderName: "",
    fatherName: "",
    motherName: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    emergencyAddress: "",
    isActive: true,
    properties: [],
    propertyOwned: "",
    additionalDetails: ""
  });
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Company Edit Modal
  const [companyEditModalOpen, setCompanyEditModalOpen] = useState(false);
  const [companyEditFormData, setCompanyEditFormData] = useState({
    companyName: "",
    companyCode: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyDomain: "",
    ownerName: "",
    logo: ""
  });
  const [companyEditLoading, setCompanyEditLoading] = useState(false);
  const [companyEditSuccess, setCompanyEditSuccess] = useState(false);
  
  // Separate states for departments and job roles
  const [departments, setDepartments] = useState([]);
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [jobRoles, setJobRoles] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingJobRoles, setLoadingJobRoles] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Gender options
  const genderOptions = ["male", "female", "other"];
  const maritalStatusOptions = ["single", "married", "divorced", "widowed"];
  const employeeTypeOptions = ["permanent", "contract", "intern", "trainee", "consultant", "part-time", "freelance"];
  const DEFAULT_COMPANY_LOGO = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";;
  const DEFAULT_USER_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";;

  const getLoggedCompanyFromStorage = () => {
    const storageKeys = ["company", "companyDetails"];
    let companyData = null;

    for (const key of storageKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          companyData = parsed;
          break;
        }
      } catch (error) {
        console.warn(`Unable to parse ${key} from localStorage`, error);
      }
    }

    try {
      const rawAdmin = localStorage.getItem("superAdmin") || localStorage.getItem("user");
      const adminData = rawAdmin ? JSON.parse(rawAdmin) : null;

      if (adminData && typeof adminData === "object") {
        return {
          ...(companyData || {}),
          companyName: adminData.companyName || companyData?.companyName || companyData?.name,
          companyCode: adminData.companyCode || companyData?.companyCode || companyData?.code || localStorage.getItem("companyCode"),
          ownerName: companyData?.ownerName || companyData?.owner,
          companyEmail: adminData.email || companyData?.companyEmail || companyData?.email,
        };
      }
    } catch (error) {
      console.warn("Unable to parse logged user from localStorage", error);
    }

    return companyData;
  };

  const getCompanyDisplayName = data => (
    data?.companyName ||
    data?.name ||
    data?.company?.companyName ||
    data?.company?.name ||
    "Company"
  );

  const getLoggedUserName = () => {
    try {
      const rawUser = localStorage.getItem("superAdmin") || localStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      return user?.name || user?.username || user?.fullName || "";
    } catch (error) {
      console.warn("Unable to parse logged user name", error);
      return "";
    }
  };

  const getCompanyLoginPath = (companyData = company) => {
    const companyCode = companyData?.companyCode || companyData?.code || companyData?.slug || "";
    const fallbackPath = companyCode ? `/company/${encodeURIComponent(companyCode)}/login` : "/company/COMPANY/login";
    const rawLoginUrl = companyData?.loginUrl || fallbackPath;

    if (/^https?:\/\//i.test(rawLoginUrl)) {
      try {
        const parsedUrl = new URL(rawLoginUrl);
        const parsedPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` || fallbackPath;
        const parsedCode = parsedUrl.pathname.match(/^\/company\/([^/]+)\/login\/?$/i)?.[1];
        return companyCode && parsedCode && decodeURIComponent(parsedCode) !== companyCode
          ? fallbackPath
          : parsedPath;
      } catch (error) {
        console.warn("Invalid company login URL:", rawLoginUrl, error);
        return fallbackPath;
      }
    }

    const normalizedPath = rawLoginUrl.startsWith("/") ? rawLoginUrl : `/${rawLoginUrl}`;
    const pathCode = normalizedPath.match(/^\/company\/([^/]+)\/login\/?$/i)?.[1];
    return companyCode && pathCode && decodeURIComponent(pathCode) !== companyCode
      ? fallbackPath
      : normalizedPath;
  };

  const getCompanyLoginUrl = (companyData = company) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${getCompanyLoginPath(companyData)}`;
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle copy URL
  const handleCopy = () => {
    const url = getCompanyLoginUrl(company);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Login URL copied to clipboard!");
  };

  // Get department name from ID
  const getDepartmentName = (deptId) => {
    if (!deptId) return "No Department";
    
    // If it's already a string (name)
    if (typeof deptId === 'string' && !deptId.match(/^[0-9a-fA-F]{24}$/)) {
      return deptId;
    }
    
    // If it's an object with name
    if (typeof deptId === 'object' && deptId !== null) {
      return deptId.name || deptId._id || "Unknown";
    }
    
    // Look up in departments map
    return departmentsMap[deptId] || deptId || "Unknown";
  };

  // Fetch departments API
  const fetchDepartments = async (companyId) => {
    if (!companyId) return;
    
    try {
      setLoadingDepartments(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(
        `${API_URL}/departments`,
        { 
          headers,
          params: { company: companyId }
        }
      );
      
      if (response.data && response.data.success) {
        const departmentsData = response.data.departments || [];
        
        // Create department options for dropdown
        const departmentOptions = departmentsData.map(dept => ({
          id: dept._id,
          name: dept.name,
          label: dept.name,
          value: dept._id
        }));
        
        setDepartments(departmentOptions);
        
        // Create a map for quick department name lookup by ID
        const deptMap = {};
        departmentsData.forEach(dept => {
          deptMap[dept._id] = dept.name;
        });
        setDepartmentsMap(deptMap);
        
        setStats(prev => ({
          ...prev,
          departments: response.data.count || departmentsData.length
        }));
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch job roles API
  const fetchJobRoles = async (companyId) => {
    if (!companyId) return;
    
    try {
      setLoadingJobRoles(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(
        `${API_URL}/job-roles`,
        { 
          headers,
          params: { company: companyId }
        }
      );
      
      if (response.data && response.data.success) {
        const jobRolesData = response.data.jobRoles || [];
        
        const jobRoleOptions = jobRolesData.map(role => ({
          id: role._id,
          name: role.name,
          label: role.name,
          value: role._id,
          departmentId: role.department?._id,
          departmentName: role.department?.name
        }));
        
        setJobRoles(jobRoleOptions);
      }
    } catch (error) {
      console.error("Error fetching job roles:", error);
    } finally {
      setLoadingJobRoles(false);
    }
  };

  const extractUsersFromResponse = responseData => {
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData?.users)) return responseData.users;
    if (Array.isArray(responseData?.employees)) return responseData.employees;
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.companyUsers)) return responseData.companyUsers;
    if (Array.isArray(responseData?.message?.users)) return responseData.message.users;
    if (Array.isArray(responseData?.message?.employees)) return responseData.message.employees;
    if (Array.isArray(responseData?.message?.data)) return responseData.message.data;
    return [];
  };

  const getRecordId = value => {
    if (!value) return "";
    if (typeof value === "object") {
      return String(value._id || value.id || value.value || "");
    }
    return String(value);
  };

  const normalizeBranchValue = value => String(value || "").trim().toLowerCase();

  const getBranchValues = branchValue => {
    const values = new Set();
    const addValue = value => {
      const normalized = normalizeBranchValue(value);
      if (normalized) values.add(normalized);
    };

    if (Array.isArray(branchValue)) {
      branchValue.forEach(item => getBranchValues(item).forEach(value => values.add(value)));
    } else if (branchValue && typeof branchValue === "object") {
      addValue(branchValue._id);
      addValue(branchValue.id);
      addValue(branchValue.value);
      addValue(branchValue.name);
      addValue(branchValue.branchName);
      addValue(branchValue.branchCode);
      addValue(branchValue.code);
    } else {
      addValue(branchValue);
    }

    return values;
  };

  const getUserBranchId = user => (
    getRecordId(user?.branch) ||
    getRecordId(user?.branchId) ||
    getRecordId(user?.branch_id) ||
    getRecordId(user?.branchDetails)
  );

  const getSelectedBranchValues = branchId => {
    const values = getBranchValues(branchId);
    const branch = branches.find(item => getBranchValues(item).has(normalizeBranchValue(branchId)));
    if (branch) {
      getBranchValues(branch).forEach(value => values.add(value));
    }
    return values;
  };

  const getUserBranchValues = user => {
    const values = new Set();
    [
      user?.branch,
      user?.branchId,
      user?.branch_id,
      user?.branchDetails,
      user?.branchName,
      user?.branchCode,
      user?.branches,
      user?.branchIds,
      user?.assignedBranches,
    ].forEach(value => getBranchValues(value).forEach(branchValue => values.add(branchValue)));
    return values;
  };

  const getSelectedBranchRecord = branchId => (
    branches.find(item => getBranchValues(item).has(normalizeBranchValue(branchId)))
  );

  const isDefaultBranch = branch => {
    if (!branch) return false;
    const code = normalizeBranchValue(branch.branchCode || branch.code);
    const name = normalizeBranchValue(branch.name || branch.branchName);
    return Boolean(branch.isDefault || code.includes("hq") || code.includes("head") || name.includes("head office"));
  };

  const filterUsersByBranch = (users, branchId = selectedBranchId) => {
    if (!branchId) return users;
    const selectedValues = getSelectedBranchValues(branchId);
    const selectedBranchRecord = getSelectedBranchRecord(branchId);
    return users.filter(user => {
      if (getUserBranchId(user) === branchId) return true;
      const userValues = getUserBranchValues(user);
      if ([...selectedValues].some(value => userValues.has(value))) return true;
      return userValues.size === 0 && isDefaultBranch(selectedBranchRecord);
    });
  };

  const getBranchLabel = branchValue => {
    const branchId = getRecordId(branchValue);
    const branchValues = getBranchValues(branchValue);
    const branch = branches.find(br => [...getBranchValues(br)].some(value => branchValues.has(value))) || (typeof branchValue === "object" ? branchValue : null);
    if (!branch) return branchId ? "Assigned Branch" : "No Branch";
    return branch.branchCode ? `${branch.name} (${branch.branchCode})` : branch.name;
  };

  const fetchBranches = async (companyId, headers) => {
    if (!companyId) return [];

    try {
      setLoadingBranches(true);
      const response = await axios.get(`${API_URL}/branches/company/${companyId}`, { headers });
      const companyBranches = response.data?.branches || response.data?.data || [];
      setBranches(companyBranches);
      return companyBranches;
    } catch (error) {
      console.error("Error fetching company branches:", error);
      return [];
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchCompanyUsers = async (companyId, headers, branchId = selectedBranchId) => {
    try {
      const params = companyId ? { companyId, populate: "department branch" } : { populate: "department branch" };
      if (branchId) {
        params.branch = branchId;
        params.branchId = branchId;
      }

      const response = await axios.get(
        `${API_URL}/users/company-users`,
        {
          headers,
          params
        }
      );

      let users = processUsers(extractUsersFromResponse(response.data));
      let visibleUsers = branchId ? filterUsersByBranch(users, branchId) : users;

      if (branchId && visibleUsers.length === 0) {
        const fallbackResponse = await axios.get(
          `${API_URL}/users/company-users`,
          {
            headers,
            params: companyId ? { companyId, populate: "department branch" } : { populate: "department branch" }
          }
        );
        users = processUsers(extractUsersFromResponse(fallbackResponse.data));
        visibleUsers = filterUsersByBranch(users, branchId);
      }

      if (branchId && visibleUsers.length === 0) {
        visibleUsers = await fetchBranchUsers(companyId, headers, branchId);
      }

      setRecentUsers(visibleUsers);

      setStats(prev => ({
        ...prev,
        totalUsers: visibleUsers.length,
        activeUsers: visibleUsers.filter(user => user.isActive !== false).length
      }));

      return visibleUsers;
    } catch (error) {
      console.error("Error fetching company users:", error);
      toast.error(error.response?.data?.message || "Failed to load company users");
      return [];
    }
  };

  const fetchBranchUsers = async (companyId, headers, branchId) => {
    const commonParams = {
      ...(companyId ? { companyId } : {}),
      populate: "department branch"
    };
    const requests = [
      { url: `${API_URL}/users/company-users`, params: { ...commonParams, branch: branchId } },
      { url: `${API_URL}/users/company-users`, params: { ...commonParams, branchId } },
      { url: `${API_URL}/users/company-users`, params: { ...commonParams, branch_id: branchId } },
      { url: `${API_URL}/users/company-users`, params: { ...commonParams, branchDetails: branchId } },
      { url: `${API_URL}/users/branch/${branchId}`, params: commonParams },
      { url: `${API_URL}/branches/${branchId}/users`, params: commonParams },
      { url: `${API_URL}/branches/${branchId}/employees`, params: commonParams },
    ];

    for (const request of requests) {
      try {
        const response = await axios.get(request.url, { headers, params: request.params });
        const users = processUsers(extractUsersFromResponse(response.data));
        const verifiedUsers = filterUsersByBranch(users, branchId);
        if (verifiedUsers.length) {
          return verifiedUsers;
        }
      } catch (error) {
        if (error.response?.status && error.response.status !== 404) {
          console.warn("Branch user lookup failed:", request.url, error.message);
        }
      }
    }

    return [];
  };

  const getAttendanceRecordsFromResponse = responseData => {
    if (Array.isArray(responseData?.data)) return responseData.data;
    if (Array.isArray(responseData?.attendance)) return responseData.attendance;
    if (Array.isArray(responseData?.records)) return responseData.records;
    if (Array.isArray(responseData?.message?.data)) return responseData.message.data;
    if (Array.isArray(responseData?.message?.attendance)) return responseData.message.attendance;
    if (Array.isArray(responseData)) return responseData;
    return [];
  };

  const getLoginCountFromAttendance = attendanceRecords => {
    const loginRecords = attendanceRecords.filter(record => (
      record?.inTime ||
      record?.loginTime ||
      record?.checkInTime ||
      record?.isClockedIn
    ));

    const loggedInUserIds = new Set(
      loginRecords
        .map(record => (
          record?.user?._id ||
          record?.user?.id ||
          record?.user ||
          record?.userId ||
          record?.employeeId ||
          record?.employee?._id ||
          record?.employee?.id
        ))
        .filter(Boolean)
        .map(String)
    );

    return loggedInUserIds.size || loginRecords.length;
  };

  const fetchTodayLoginCount = async (headers) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await axios.get(
        `${API_URL}/attendance/all`,
        {
          headers,
          params: { date: today }
        }
      );

      const attendanceRecords = getAttendanceRecordsFromResponse(response.data);
      const todayLoginCount = getLoginCountFromAttendance(attendanceRecords);

      setStats(prev => ({
        ...prev,
        todayLogins: todayLoginCount
      }));
    } catch (error) {
      console.error("Error fetching today's login count:", error);
    }
  };

  const formatDateKey = date => date.toISOString().split("T")[0];

  const fetchWeeklyLoginAnalytics = async (headers) => {
    try {
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        return date;
      });

      const weeklyData = await Promise.all(days.map(async date => {
        const dateKey = formatDateKey(date);
        try {
          const response = await axios.get(
            `${API_URL}/attendance/all`,
            {
              headers,
              params: { date: dateKey }
            }
          );

          const records = getAttendanceRecordsFromResponse(response.data);
          return {
            date: dateKey,
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            count: getLoginCountFromAttendance(records)
          };
        } catch (error) {
          console.error(`Error fetching login analytics for ${dateKey}:`, error);
          return {
            date: dateKey,
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            count: 0
          };
        }
      }));

      setWeeklyLogins(weeklyData);
      const todayCount = weeklyData[weeklyData.length - 1]?.count ?? 0;
      setStats(prev => ({
        ...prev,
        todayLogins: todayCount
      }));
    } catch (error) {
      console.error("Error fetching weekly login analytics:", error);
    }
  };

  // Process users to ensure department names are properly set
  const processUsers = (users) => {
    if (!Array.isArray(users)) return [];

    return users.map(user => {
      const processedUser = { ...user };
      
      // Handle department - could be ID, object, or name
      if (user.department) {
        if (typeof user.department === 'object' && user.department !== null) {
          // If it's an object, extract the name
          processedUser.departmentName = user.department.name || user.department._id;
          processedUser.departmentId = user.department._id;
        } else if (typeof user.department === 'string') {
          // If it's a string, check if it's an ID or a name
          if (user.department.match(/^[0-9a-fA-F]{24}$/)) {
            // It's an ID, look up the name
            processedUser.departmentId = user.department;
            processedUser.departmentName = departmentsMap[user.department] || user.department;
          } else {
            // It's a name
            processedUser.departmentName = user.department;
          }
        }
      } else {
        processedUser.departmentName = "No Department";
      }
      
      return processedUser;
    });
  };

  // 🔥 FIXED: Fetch current user company with proper company name extraction
  const fetchCurrentUserCompany = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      const loggedCompany = getLoggedCompanyFromStorage();
      
      if (!token) {
        toast.error("Please login to view company details");
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const response = await axios.get(
          `${API_URL}/users/company-users`,
          { headers }
        );
        
        console.log("Full API Response:", response.data);
        setApiDebug(response.data);
        
        if (response.data && response.data.success) {
          const data = response.data.message;
          console.log("API Response Data:", data);
          
          let companyId = "";
          let companyDetails = {};
          let companyName = getCompanyDisplayName(loggedCompany); // Default fallback
          
          // 🔥 FIXED: Extract company details properly
          // First try to get from company.id object
          if (data.company?.id) {
            if (data.company.id._id) {
              companyId = data.company.id._id;
              companyDetails = data.company.id;
              companyName = data.company.id.name || data.company.id.companyName || companyName;
            } else {
              companyId = data.company.id;
            }
          } 
          // Then try company object
          else if (data.company?._id) {
            companyId = data.company._id;
            companyDetails = data.company;
            companyName = data.company.name || data.company.companyName || companyName;
          }
          // Then try from first user
          else if (data.users && data.users.length > 0) {
            const firstUser = data.users[0];
            if (firstUser.company) {
              if (firstUser.company._id) {
                companyId = firstUser.company._id;
                companyDetails = firstUser.company;
                companyName = firstUser.company.name || firstUser.company.companyName || companyName;
              } else {
                companyId = firstUser.company;
              }
            }
            // Also check if user has companyName directly
            if (firstUser.companyName) {
              companyName = firstUser.companyName;
            }
          }
          
          // 🔥 FIXED: Also check for company name in data.company
          if (data.company?.companyName) {
            companyName = data.company.companyName;
          } else if (data.company?.name) {
            companyName = data.company.name;
          }

          if (loggedCompany) {
            companyName = getCompanyDisplayName(loggedCompany);
          }

          if (!companyId && (loggedCompany?._id || loggedCompany?.id)) {
            companyId = loggedCompany._id || loggedCompany.id;
            companyDetails = loggedCompany;
          }
          
          console.log("✅ Extracted company details:", {
            companyId,
            companyName,
            companyDetails
          });
          
          if (!companyId) {
            console.error("Company ID not found in response");
            await fetchCompanyFromLocalStorage(headers);
            return;
          }
          
          // Company logo mapping
          let companyLogo = null;
          
          if (companyDetails.logo) {
            companyLogo = companyDetails.logo;
          } else if (companyDetails.logoUrl) {
            companyLogo = companyDetails.logoUrl;
          } else if (companyDetails.avatar) {
            companyLogo = companyDetails.avatar;
          } else if (data.company?.logo) {
            companyLogo = data.company.logo;
          } else if (data.company?.logoUrl) {
            companyLogo = data.company.logoUrl;
          }
          
          // Company data mapping with proper name
          const companyData = {
            _id: companyId,
            companyName: companyName, // 🔥 FIXED: Use extracted company name
            companyCode: loggedCompany?.companyCode ||
                        loggedCompany?.code ||
                        companyDetails.companyCode || 
                        companyDetails.code || 
                        data.company?.companyCode || 
                        "",
            logo: loggedCompany?.logo || loggedCompany?.logoUrl || companyLogo || DEFAULT_COMPANY_LOGO,
            isActive: loggedCompany?.isActive ??
                      loggedCompany?.active ??
                      companyDetails.isActive ?? 
                      companyDetails.active ?? 
                      data.company?.isActive ?? 
                      true,
            
            companyEmail: loggedCompany?.companyEmail ||
                         loggedCompany?.email ||
                         companyDetails.email || 
                         companyDetails.companyEmail || 
                         companyDetails.contactEmail || 
                         data.company?.email || 
                         data.company?.companyEmail ||
                         "Not provided",
            
            companyPhone: loggedCompany?.companyPhone ||
                         loggedCompany?.phone ||
                         loggedCompany?.mobile ||
                         companyDetails.phone || 
                         companyDetails.companyPhone || 
                         companyDetails.contactPhone || 
                         companyDetails.mobile || 
                         data.company?.phone || 
                         data.company?.companyPhone ||
                         "Not provided",
            
            companyAddress: loggedCompany?.companyAddress ||
                           loggedCompany?.address ||
                           loggedCompany?.location ||
                           companyDetails.address || 
                           companyDetails.companyAddress || 
                           companyDetails.location || 
                           data.company?.address || 
                           data.company?.companyAddress ||
                           "Not provided",
            
            companyDomain: loggedCompany?.companyDomain ||
                          loggedCompany?.domain ||
                          companyDetails.domain || 
                          companyDetails.companyDomain || 
                          data.company?.domain || 
                          data.company?.companyDomain ||
                          "gmail.com",
            
            ownerName: loggedCompany?.ownerName ||
                      loggedCompany?.owner ||
                      companyDetails.ownerName || 
                      companyDetails.owner || 
                      companyDetails.ownerId?.name ||
                      data.company?.ownerName || 
                      data.company?.owner ||
                      "Administrator",
            
            loginUrl: loggedCompany?.loginUrl ||
                     companyDetails.loginUrl || 
                     data.company?.loginUrl || 
                     `/company/${loggedCompany?.companyCode || companyDetails.companyCode || "COMPANY"}/login`,
            
            dbIdentifier: loggedCompany?.dbIdentifier ||
                         companyDetails.dbIdentifier || 
                         data.company?.dbIdentifier || 
                         `company_${companyId}`,
            
            createdAt: loggedCompany?.createdAt ||
                      companyDetails.createdAt || 
                      data.company?.createdAt || 
                      new Date().toISOString(),
            
            updatedAt: loggedCompany?.updatedAt ||
                      companyDetails.updatedAt || 
                      data.company?.updatedAt || 
                      new Date().toISOString(),
            
            subscriptionExpiry: loggedCompany?.subscriptionExpiry ||
                               companyDetails.subscriptionExpiry || 
                               data.company?.subscriptionExpiry || 
                               new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          
          console.log("✅ Mapped Company Data:", companyData);
          setCompany(companyData);
          
          // Initialize company edit form
          setCompanyEditFormData({
            companyName: companyData.companyName,
            companyCode: companyData.companyCode,
            companyEmail: companyData.companyEmail !== "Not provided" ? companyData.companyEmail : "",
            companyPhone: companyData.companyPhone !== "Not provided" ? companyData.companyPhone : "",
            companyAddress: companyData.companyAddress !== "Not provided" ? companyData.companyAddress : "",
            companyDomain: companyData.companyDomain,
            ownerName: companyData.ownerName,
            logo: companyData.logo || ""
          });
          
          await fetchBranches(companyId, headers);
          await fetchCompanyUsers(companyId, headers, selectedBranchId);
          
          if (data.currentUser) {
            setUserRole(data.currentUser.role || data.currentUser.name || "user");
          }
          
          // Store in localStorage
          localStorage.setItem("company", JSON.stringify(companyData));
          
          if (companyData.companyCode) {
            localStorage.setItem("companyCode", companyData.companyCode);
          }
          
          // Fetch departments and job roles
          await fetchDepartments(companyId);
          await fetchJobRoles(companyId);
          await fetchTodayLoginCount(headers);
          await fetchWeeklyLoginAnalytics(headers);
          
          return;
        }
      } catch (apiError) {
        console.error("Company users API failed:", apiError);
        await fetchCompanyFromLocalStorage(headers);
      }
      
    } catch (error) {
      console.error("Error fetching company details:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again!");
        localStorage.clear();
        navigate("/login");
        return;
      }
      
      toast.error("Failed to load company details");
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  // Fetch company from localStorage (fallback)
  const fetchCompanyFromLocalStorage = async (headers) => {
    try {
      const companyInfo = getLoggedCompanyFromStorage();
      
      if (companyInfo) {
        console.log("Company from localStorage:", companyInfo);
        
        const fullCompanyData = {
          ...companyInfo,
          companyName: getCompanyDisplayName(companyInfo),
          companyCode: companyInfo.companyCode || companyInfo.code || "",
          logo: companyInfo.logo || DEFAULT_COMPANY_LOGO,
          companyEmail: companyInfo.companyEmail || 
                       companyInfo.email || 
                       "Not provided",
          companyPhone: companyInfo.companyPhone || 
                       companyInfo.phone || 
                       "Not provided",
          companyAddress: companyInfo.companyAddress || 
                         companyInfo.address || 
                         "Not provided",
          companyDomain: companyInfo.companyDomain || 
                        companyInfo.domain || 
                        "gmail.com",
          ownerName: companyInfo.ownerName || 
                    companyInfo.owner || 
                    "Administrator",
          loginUrl: companyInfo.loginUrl || "/company/CIISNE/login",
          dbIdentifier: companyInfo.dbIdentifier || `company_${Date.now()}`,
          createdAt: companyInfo.createdAt || new Date().toISOString(),
          updatedAt: companyInfo.updatedAt || new Date().toISOString(),
          subscriptionExpiry: companyInfo.subscriptionExpiry || 
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: companyInfo.isActive ?? true
        };
        
        setCompany(fullCompanyData);
        setCompanyEditFormData({
          companyName: fullCompanyData.companyName,
          companyCode: fullCompanyData.companyCode,
          companyEmail: fullCompanyData.companyEmail !== "Not provided" ? fullCompanyData.companyEmail : "",
          companyPhone: fullCompanyData.companyPhone !== "Not provided" ? fullCompanyData.companyPhone : "",
          companyAddress: fullCompanyData.companyAddress !== "Not provided" ? fullCompanyData.companyAddress : "",
          companyDomain: fullCompanyData.companyDomain,
          ownerName: fullCompanyData.ownerName,
          logo: fullCompanyData.logo
        });
        
        if (fullCompanyData._id) {
          await fetchBranches(fullCompanyData._id, headers);
          await fetchDepartments(fullCompanyData._id);
          await fetchJobRoles(fullCompanyData._id);
          await fetchCompanyUsers(fullCompanyData._id, headers, selectedBranchId);
          await fetchTodayLoginCount(headers);
          await fetchWeeklyLoginAnalytics(headers);
        }
      } else {
        // Create default company data
        const defaultCompany = {
          _id: "temp_" + Date.now(),
          companyName: "My Company",
          companyCode: "COMPANY",
          companyEmail: "Not provided",
          companyPhone: "Not provided",
          companyAddress: "Not provided",
          companyDomain: "gmail.com",
          ownerName: "Administrator",
          loginUrl: "/company/COMPANY/login",
          dbIdentifier: `company_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          logo: DEFAULT_COMPANY_LOGO,
          isActive: true
        };
        
        setCompany(defaultCompany);
        setCompanyEditFormData({
          companyName: defaultCompany.companyName,
          companyCode: defaultCompany.companyCode,
          companyEmail: "",
          companyPhone: "",
          companyAddress: "",
          companyDomain: defaultCompany.companyDomain,
          ownerName: defaultCompany.ownerName,
          logo: defaultCompany.logo
        });
        
        localStorage.setItem("company", JSON.stringify(defaultCompany));
        await fetchTodayLoginCount(headers);
        await fetchWeeklyLoginAnalytics(headers);
      }
    } catch (error) {
      console.error("Error in fallback method:", error);
    }
  };

  // Update users when departments map changes
  useEffect(() => {
    if (recentUsers.length > 0 && Object.keys(departmentsMap).length > 0) {
      const processedUsers = recentUsers.map(user => {
        if (user.department && departmentsMap[user.department]) {
          return { ...user, departmentName: departmentsMap[user.department] };
        } else if (user.department && typeof user.department === 'object' && user.department.name) {
          return { ...user, departmentName: user.department.name };
        }
        return { ...user, departmentName: user.department || "No Department" };
      });
      setRecentUsers(processedUsers);
    }
  }, [departmentsMap]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return "";
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      return "Unknown";
    }
  };

  // Days remaining calculation
  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 30;
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      return 30;
    }
  };

  // Get subscription status color
  const getSubscriptionStatus = (daysRemaining) => {
    if (daysRemaining > 15) return { color: 'success', text: 'Active', bg: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' };
    if (daysRemaining > 7) return { color: 'warning', text: 'Expiring Soon', bg: 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)' };
    if (daysRemaining > 0) return { color: 'error', text: 'Critical', bg: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' };
    return { color: 'error', text: 'Expired', bg: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' };
  };

  // Handle manual refresh
  const handleRefresh = () => {
    toast.info("Refreshing data...");
    fetchCurrentUserCompany();
  };

  const handleBranchFilterChange = async (branchId) => {
    setSelectedBranchId(branchId);

    const nextParams = new URLSearchParams(searchParams);
    if (branchId) {
      nextParams.set("branch", branchId);
      nextParams.delete("branchId");
    } else {
      nextParams.delete("branch");
      nextParams.delete("branchId");
    }
    setSearchParams(nextParams);

    if (company?._id) {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetchCompanyUsers(company._id, headers, branchId);
    }
  };

  // Handle company edit - Open modal
  const handleEditCompany = () => {
    if (company) {
      setCompanyEditFormData({
        companyName: company.companyName || "",
        companyCode: company.companyCode || "",
        companyEmail: company.companyEmail !== "Not provided" ? company.companyEmail : "",
        companyPhone: company.companyPhone !== "Not provided" ? company.companyPhone : "",
        companyAddress: company.companyAddress !== "Not provided" ? company.companyAddress : "",
        companyDomain: company.companyDomain || "",
        ownerName: company.ownerName || "",
        logo: company.logo || DEFAULT_COMPANY_LOGO
      });
      setCompanyEditSuccess(false);
      setCompanyEditModalOpen(true);
    }
  };

  // Handle company edit form input changes
  const handleCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save company changes
  const handleSaveCompany = async () => {
    try {
      setCompanyEditLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const updateData = {};
      
      if (companyEditFormData.companyName !== company.companyName) {
        updateData.name = companyEditFormData.companyName;
      }
      if (companyEditFormData.companyCode !== company.companyCode) {
        updateData.companyCode = companyEditFormData.companyCode;
      }
      if (companyEditFormData.companyEmail !== company.companyEmail) {
        updateData.email = companyEditFormData.companyEmail;
      }
      if (companyEditFormData.companyPhone !== company.companyPhone) {
        updateData.phone = companyEditFormData.companyPhone;
      }
      if (companyEditFormData.companyAddress !== company.companyAddress) {
        updateData.address = companyEditFormData.companyAddress;
      }
      if (companyEditFormData.companyDomain !== company.companyDomain) {
        updateData.domain = companyEditFormData.companyDomain;
      }
      if (companyEditFormData.ownerName !== company.ownerName) {
        updateData.ownerName = companyEditFormData.ownerName;
      }
      if (companyEditFormData.logo !== company.logo) {
        updateData.logo = companyEditFormData.logo;
      }
      
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        setCompanyEditModalOpen(false);
        return;
      }
      
      console.log("Updating company:", company._id, updateData);
      
      let success = false;
      
      // Try multiple API endpoints
      try {
        const response = await axios.put(
          `${API_URL}/companies/${company._id}`,
          updateData,
          { headers }
        );
        if (response.data && response.data.success) success = true;
      } catch (error) {
        console.log("Company update attempt 1 failed:", error.message);
      }
      
      if (!success) {
        try {
          const response = await axios.put(
            `${API_URL}/admin/companies/${company._id}`,
            updateData,
            { headers }
          );
          if (response.data && response.data.success) success = true;
        } catch (error) {
          console.log("Company update attempt 2 failed:", error.message);
        }
      }
      
      // Update local state
      const updatedCompany = {
        ...company,
        companyName: companyEditFormData.companyName,
        companyCode: companyEditFormData.companyCode,
        companyEmail: companyEditFormData.companyEmail || "Not provided",
        companyPhone: companyEditFormData.companyPhone || "Not provided",
        companyAddress: companyEditFormData.companyAddress || "Not provided",
        companyDomain: companyEditFormData.companyDomain,
        ownerName: companyEditFormData.ownerName,
        logo: companyEditFormData.logo || DEFAULT_COMPANY_LOGO
      };
      
      setCompany(updatedCompany);
      localStorage.setItem("company", JSON.stringify(updatedCompany));
      
      setCompanyEditSuccess(true);
      
      toast.success(
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg style={{ color: '#4caf50', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <div>
            <div style={{ fontWeight: 600 }}>Company Updated Successfully!</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>{companyEditFormData.companyName} has been updated</div>
          </div>
        </div>,
        { icon: false, autoClose: 4000 }
      );
      
      setTimeout(() => {
        setCompanyEditModalOpen(false);
        setCompanyEditSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error(error.response?.data?.message || "Failed to update company");
    } finally {
      setCompanyEditLoading(false);
    }
  };

  // Handle user edit
  const handleEditUser = (user) => {
    console.log("Editing user:", user);
    
    // Get department name
    let departmentName = "";
    if (user.departmentName) {
      departmentName = user.departmentName;
    } else if (user.department && typeof user.department === 'object') {
      departmentName = user.department.name || user.department._id;
    } else if (user.department) {
      departmentName = getDepartmentName(user.department);
    }
    
    // Get job role name
    let jobRoleName = "";
    if (user.jobRole && typeof user.jobRole === 'object') {
      jobRoleName = user.jobRole.name || user.jobRole._id;
    } else if (user.jobRole) {
      const role = jobRoles.find(r => r.id === user.jobRole || r.value === user.jobRole);
      jobRoleName = role?.name || user.jobRole;
    }
    
    setSelectedUser(user);
    setEditFormData({
      // Basic Info
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || user.mobile || "",
      address: user.address || "",
      gender: user.gender || "",
      maritalStatus: user.maritalStatus || "",
      dob: formatDateForInput(user.dob) || "",
      
      // Employment Info
      department: departmentName || "",
      jobRole: jobRoleName || "",
      role: user.role || "user",
      employeeType: user.employeeType || "",
      designation: user.designation || user.jobTitle || user.position || "",
      salary: user.salary || "",
      
      // Bank Details
      accountNumber: user.accountNumber || "",
      ifsc: user.ifsc || "",
      bankName: user.bankName || "",
      bankHolderName: user.bankHolderName || "",
      
      // Family Details
      fatherName: user.fatherName || "",
      motherName: user.motherName || "",
      
      // Emergency Contact
      emergencyName: user.emergencyName || "",
      emergencyPhone: user.emergencyPhone || "",
      emergencyRelation: user.emergencyRelation || "",
      emergencyAddress: user.emergencyAddress || "",
      
      // Additional
      isActive: user.isActive ?? true,
      properties: user.properties || [],
      propertyOwned: user.propertyOwned || "",
      additionalDetails: user.additionalDetails || ""
    });
    setFormErrors({});
    setEditSuccess(false);
    setEditModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle select changes
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!editFormData.name.trim()) {
      errors.name = "Name is required";
    }
    if (editFormData.email && !/\S+@\S+\.\S+/.test(editFormData.email)) {
      errors.email = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const userId = selectedUser.id || selectedUser._id;
      
      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      console.log("Updating user with ID:", userId);
      console.log("Update data:", editFormData);
      
      // Prepare update data
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        address: editFormData.address,
        gender: editFormData.gender,
        maritalStatus: editFormData.maritalStatus,
        dob: editFormData.dob ? new Date(editFormData.dob).toISOString() : null,
        department: editFormData.department,
        jobRole: editFormData.jobRole,
        role: editFormData.role,
        employeeType: editFormData.employeeType,
        designation: editFormData.designation,
        salary: editFormData.salary,
        accountNumber: editFormData.accountNumber,
        ifsc: editFormData.ifsc,
        bankName: editFormData.bankName,
        bankHolderName: editFormData.bankHolderName,
        fatherName: editFormData.fatherName,
        motherName: editFormData.motherName,
        emergencyName: editFormData.emergencyName,
        emergencyPhone: editFormData.emergencyPhone,
        emergencyRelation: editFormData.emergencyRelation,
        emergencyAddress: editFormData.emergencyAddress,
        isActive: editFormData.isActive,
        propertyOwned: editFormData.propertyOwned,
        additionalDetails: editFormData.additionalDetails
      };
      
      let success = false;
      let response;
      
      // Try multiple API endpoints
      try {
        response = await axios.put(
          `${API_URL}/users/${userId}`,
          updateData,
          { headers }
        );
        if (response.data && (response.data.success || response.data._id)) success = true;
      } catch (error) {
        console.log("First API attempt failed:", error.message);
      }
      
      if (!success) {
        try {
          response = await axios.patch(
            `${API_URL}/users/${userId}`,
            updateData,
            { headers }
          );
          if (response.data && (response.data.success || response.data._id)) success = true;
        } catch (error) {
          console.log("Second API attempt failed:", error.message);
        }
      }
      
      if (!success) {
        try {
          response = await axios.put(
            `${API_URL}/admin/users/${userId}`,
            updateData,
            { headers }
          );
          if (response.data && (response.data.success || response.data._id)) success = true;
        } catch (error) {
          console.log("Third API attempt failed:", error.message);
        }
      }
      
      if (success) {
        handleUpdateSuccess(response?.data);
      } else {
        // Optimistic update
        const updatedUsers = recentUsers.map(user => 
          (user.id === userId || user._id === userId) 
            ? { 
                ...user, 
                ...editFormData,
                departmentName: editFormData.department // Store department name
              }
            : user
        );
        setRecentUsers(updatedUsers);
        
        const activeUsers = updatedUsers.filter(user => user.isActive).length;
        setStats(prev => ({
          ...prev,
          activeUsers
        }));
        
        toast.success(
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg style={{ color: '#4caf50', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>User Updated Successfully!</div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>{editFormData.name} has been updated</div>
            </div>
          </div>,
          { icon: false, autoClose: 4000 }
        );
        
        setEditModalOpen(false);
      }
      
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle successful update
  const handleUpdateSuccess = (responseData) => {
    setEditSuccess(true);
    
    toast.success(
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg style={{ color: '#4caf50', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <div>
          <div style={{ fontWeight: 600 }}>User Updated Successfully!</div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>{editFormData.name} has been updated</div>
        </div>
      </div>,
      { icon: false, autoClose: 4000 }
    );
    
    const userId = selectedUser.id || selectedUser._id;
    const updatedUsers = recentUsers.map(user => 
      (user.id === userId || user._id === userId) 
        ? { 
            ...user, 
            ...editFormData,
            departmentName: editFormData.department
          }
        : user
    );
    setRecentUsers(updatedUsers);
    
    const activeUsers = updatedUsers.filter(user => user.isActive).length;
    setStats(prev => ({
      ...prev,
      totalUsers: updatedUsers.length,
      activeUsers
    }));
    
    setTimeout(() => {
      setEditModalOpen(false);
      setEditSuccess(false);
    }, 2000);
  };

  // ✅ UPDATED: Delete user with DELETE API call
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    if (!window.confirm(`⚠️ Are you sure you want to delete "${selectedUser.name}"?\n\nThis action cannot be undone. All user data will be permanently removed.`)) {
      return;
    }
    
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        navigate("/login");
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      const userId = selectedUser.id || selectedUser._id;
      
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      
      console.log("Deleting user with ID:", userId);
      
      // Make DELETE API call
      const response = await axios.delete(
        `${API_URL}/users/${userId}`,
        { headers }
      );
      
      if (response.data && response.data.success) {
        // Success toast with custom design
        toast.success(
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg style={{ color: '#f44336', width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>User Deleted Successfully!</div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>{selectedUser.name} has been permanently removed</div>
            </div>
          </div>,
          { icon: false, autoClose: 4000 }
        );
        
        // Remove user from recentUsers list
        const filteredUsers = recentUsers.filter(user => 
          (user.id !== userId && user._id !== userId)
        );
        setRecentUsers(filteredUsers);
        
        // Update stats
        const activeUsersCount = filteredUsers.filter(user => user.isActive).length;
        setStats(prev => ({
          ...prev,
          totalUsers: filteredUsers.length,
          activeUsers: activeUsersCount
        }));
        
        // Close modal
        setEditModalOpen(false);
        setSelectedUser(null);
        
        // Reset form
        setEditFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          gender: "",
          maritalStatus: "",
          dob: "",
          department: "",
          jobRole: "",
          role: "",
          employeeType: "",
          designation: "",
          salary: "",
          accountNumber: "",
          ifsc: "",
          bankName: "",
          bankHolderName: "",
          fatherName: "",
          motherName: "",
          emergencyName: "",
          emergencyPhone: "",
          emergencyRelation: "",
          emergencyAddress: "",
          isActive: true,
          properties: [],
          propertyOwned: "",
          additionalDetails: ""
        });
        
      } else {
        throw new Error(response.data?.message || "Failed to delete user");
      }
      
    } catch (error) {
      console.error("Error deleting user:", error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again!");
        localStorage.clear();
        navigate("/login");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to delete users");
      } else if (error.response?.status === 404) {
        toast.error("User not found");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete user. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle view all users
  const handleViewAllUsers = () => {
    if (company && company._id) {
      navigate(`/Ciis-network/company/${company._id}/users`);
    } else {
      toast.error("Company ID not available");
    }
  };

  // Handle add new user
  const handleAddNewUser = () => {
    if (company && company._id) {
      navigate(`/Ciis-network/create-user?company=${company._id}&companyCode=${company.companyCode}&companyName=${encodeURIComponent(company.companyName)}`);
    } else {
      toast.error("Company ID not available");
    }
  };

  // Handle add new department
  const handleAddNewDepartment = async () => {
    const newDept = prompt("Enter new department name:");
    if (newDept && newDept.trim()) {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        const response = await axios.post(
          `${API_URL}/departments`,
          {
            name: newDept.trim(),
            company: company._id,
            companyCode: company.companyCode
          },
          { headers }
        );
        
        if (response.data.success) {
          toast.success("Department added successfully!");
          fetchDepartments(company._id);
        }
      } catch (error) {
        console.error("Error adding department:", error);
        toast.error(error.response?.data?.message || "Failed to add department");
      }
    }
  };

  // Handle tab change
  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  // Load data with page loader
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        await fetchCurrentUserCompany();
      } catch (error) {
        console.error("Error loading company details:", error);
        toast.error("Failed to load company details");
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []);

  const daysRemaining = getDaysRemaining(company?.subscriptionExpiry);
  const subscriptionStatus = getSubscriptionStatus(daysRemaining);
  const subscriptionProgress = Math.min((daysRemaining / 30) * 100, 100);

  // Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  if (!company) {
    return (
      <div className="CompanyDetails-error-container">
        <div className="CompanyDetails-error-card">
          <div className="CompanyDetails-error-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h2 className="CompanyDetails-error-title">Oops!</h2>
          <h3 className="CompanyDetails-error-subtitle">Company Not Found</h3>
          <p className="CompanyDetails-error-message">Unable to load company details. Please try again or contact support.</p>
          <div className="CompanyDetails-error-actions">
            <button className="CompanyDetails-btn CompanyDetails-btn-primary" onClick={() => navigate("/Ciis-network/SuperAdminDashboard")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back to Dashboard
            </button>
            <button className="CompanyDetails-btn CompanyDetails-btn-outline" onClick={handleRefresh}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedBranch = branches.find(branch => getBranchValues(branch).has(normalizeBranchValue(selectedBranchId)));
  const selectedBranchLabel = selectedBranchId
    ? (selectedBranch?.name || "Selected Branch")
    : "All Branches";
  const branchFilterControl = (
    <div className="CompanyDetails-branch-filter">
      <label className="CompanyDetails-branch-filter-label" htmlFor="CompanyDetails-branch-filter-select">
        Branch
      </label>
      <select
        id="CompanyDetails-branch-filter-select"
        className="CompanyDetails-branch-filter-select"
        value={selectedBranchId}
        onChange={(event) => handleBranchFilterChange(event.target.value)}
        disabled={loadingBranches || branches.length === 0}
      >
        <option value="">
          {loadingBranches ? "Loading branches..." : "All Branches"}
        </option>
        {branches.map(branch => (
          <option key={getRecordId(branch)} value={getRecordId(branch)}>
            {branch.name} {branch.branchCode ? `(${branch.branchCode})` : ""}
          </option>
        ))}
      </select>
    </div>
  );

  const statsData = [
    {
      icon: 'people',
      value: stats.totalUsers,
      label: 'TOTAL USERS',
      chip: selectedBranchLabel,
      tone: 'blue',
      color: '#2196f3',
      gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
    },
    {
      icon: 'check',
      value: stats.activeUsers,
      label: 'ACTIVE USERS',
      chip: `${stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%`,
      tone: 'green',
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
    },
    {
      icon: 'building',
      value: stats.departments,
      label: 'DEPARTMENTS',
      chip: `${stats.departments} total`,
      tone: 'blue',
      color: '#ff9800',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)'
    },
    {
      icon: 'calendar',
      value: stats.todayLogins,
      label: "TODAY'S LOGINS",
      chip: `${stats.totalUsers ? Math.round((stats.todayLogins / stats.totalUsers) * 100) : 0}%`,
      tone: 'red',
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
    }
  ];

  const infoItems = [
    {
      icon: 'fingerprint',
      label: 'Company Code',
      value: company.companyCode || "N/A",
      gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
    },
    {
      icon: 'event',
      label: 'Created On',
      value: formatDate(company.createdAt),
      gradient: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
    },
    {
      icon: 'person',
      label: 'Owner',
      value: company.ownerName || "Administrator",
      gradient: 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)'
    }
  ];

  const getIconSvg = (iconName) => {
    switch(iconName) {
      case 'people':
        return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-1 .05 1.16.84 2 1.87 2 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
      case 'check':
        return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
      case 'building':
        return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>;
      case 'calendar':
        return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>;
      case 'fingerprint':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.54.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 4.13.51 5.98 1.52.23.13.32.43.2.66-.09.18-.26.29-.45.29zM4.12 5.66c-.13 0-.26-.05-.35-.15-.2-.2-.2-.51 0-.71.5-.5 1.06-.94 1.67-1.28.22-.13.5-.05.62.18.13.22.05.5-.18.62-.54.31-1.03.68-1.48 1.12-.09.1-.22.15-.35.15z"/></svg>;
      case 'event':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>;
      case 'person':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
      case 'business':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>;
      case 'email':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>;
      case 'phone':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>;
      case 'location':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;
      case 'work':
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>;
      default:
        return null;
    }
  };

  const fallbackWeeklyLogins = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
    day,
    count: 0
  }));
  const weeklyLoginData = weeklyLogins.length ? weeklyLogins : fallbackWeeklyLogins;
  const weeklyMaxLogin = Math.max(...weeklyLoginData.map(item => item.count), 1);
  const chartWidth = 558;
  const chartPoints = weeklyLoginData.map((item, index) => {
    const x = 42 + (index * (chartWidth / Math.max(weeklyLoginData.length - 1, 1)));
    const y = 198 - ((item.count / weeklyMaxLogin) * 140);
    return { ...item, x, y };
  });
  const weeklyLoginPath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const weeklyLoginAreaPath = `${weeklyLoginPath} L600 210 L42 210 Z`;
  const weeklyLoginTotal = weeklyLoginData.reduce((total, item) => total + item.count, 0);

  return (
    <div className="CompanyDetails">
      {/* Animated Background */}
      <div className="CompanyDetails-animated-bg">
        <div className="CompanyDetails-bg-blob CompanyDetails-blob-1"></div>
        <div className="CompanyDetails-bg-blob CompanyDetails-blob-2"></div>
      </div>

      <div className="CompanyDetails-container">
        {/* Responsive Header */}
        <div className="CompanyDetails-header">
          <div className="CompanyDetails-header-gradient">
            <div className="CompanyDetails-header-content">
              {/* Logo and Company Info */}
              <div className="CompanyDetails-header-left">
                <div className="CompanyDetails-company-info">
                  <div className="CompanyDetails-company-chips">
                    <span className={`CompanyDetails-chip ${company.isActive ? 'CompanyDetails-chip-active' : 'CompanyDetails-chip-inactive'}`}>
                      {company.isActive ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                        </svg>
                      )}
                      {company.isActive ? "Active" : "Inactive"}
                    </span>

                    {company.companyCode && (
                      <span className="CompanyDetails-chip CompanyDetails-chip-code">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                        </svg>
                        Code: {company.companyCode}
                      </span>
                    )}

                    <span className="CompanyDetails-chip CompanyDetails-chip-date">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                      </svg>
                      Joined {formatRelativeTime(company.createdAt)}
                    </span>
                  </div>
                  <h1 className="CompanyDetails-company-name">{company.companyName}</h1>
                  <p className="CompanyDetails-company-subtitle">
                    Manage employees, departments, attendance, assets and subscription from one premium workspace.
                  </p>
                </div>
              </div>

              {/* Desktop Login URL */}
              <div className="CompanyDetails-desktop-login-url">
                <div className="CompanyDetails-url-wrapper">
                  <span className="CompanyDetails-url-label-desktop">Login URL:</span>
                  <div className="CompanyDetails-url-container-desktop">
                    <div className="CompanyDetails-url-display-desktop">
                      <span className="CompanyDetails-url-text-desktop">
                        {getCompanyLoginUrl(company)}
                      </span>
                    </div>
                    <button className={`CompanyDetails-copy-btn-desktop ${copied ? 'CompanyDetails-copied' : ''}`} onClick={handleCopy}>
                      {copied ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {copied && <span className="CompanyDetails-copy-success-desktop">✓ Copied!</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="CompanyDetails-header-actions">
                <button className="CompanyDetails-icon-btn CompanyDetails-refresh-btn" onClick={handleRefresh} title="Refresh Data">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                </button>

                <button className="CompanyDetails-btn CompanyDetails-btn-primary" onClick={handleAddNewUser} disabled={!company?._id}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add User
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button className="CompanyDetails-mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </button>
            </div>

            {/* Mobile Login URL */}
            <div className="CompanyDetails-mobile-login-url">
              <span className="CompanyDetails-url-label">Login URL:</span>
              <div className="CompanyDetails-url-container">
                <div className="CompanyDetails-url-display">
                  <span className="CompanyDetails-url-text">
                    {getCompanyLoginUrl(company)}
                  </span>
                </div>
                <button className={`CompanyDetails-copy-btn ${copied ? 'CompanyDetails-copied' : ''}`} onClick={handleCopy}>
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  )}
                </button>
              </div>
              {copied && <span className="CompanyDetails-copy-success">✓ Copied to clipboard!</span>}
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="CompanyDetails-mobile-menu-drawer">
            <div className="CompanyDetails-drawer-header">
              <h3 className="CompanyDetails-drawer-title">Menu Options</h3>
              <button className="CompanyDetails-close-btn" onClick={() => setMobileMenuOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="CompanyDetails-drawer-menu">
              <button className="CompanyDetails-menu-item" onClick={() => { handleEditCompany(); setMobileMenuOpen(false); }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <div className="CompanyDetails-menu-item-content">
                  <span className="CompanyDetails-menu-item-title">Edit Company</span>
                  <span className="CompanyDetails-menu-item-subtitle">Update company details</span>
                </div>
              </button>

              <button className="CompanyDetails-menu-item" onClick={() => { handleRefresh(); setMobileMenuOpen(false); }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                <div className="CompanyDetails-menu-item-content">
                  <span className="CompanyDetails-menu-item-title">Refresh Data</span>
                  <span className="CompanyDetails-menu-item-subtitle">Reload company information</span>
                </div>
              </button>

              <button className="CompanyDetails-menu-item" onClick={() => { handleAddNewUser(); setMobileMenuOpen(false); }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <div className="CompanyDetails-menu-item-content">
                  <span className="CompanyDetails-menu-item-title">Add New User</span>
                  <span className="CompanyDetails-menu-item-subtitle">Create a new user account</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="CompanyDetails-stats-grid">
          {statsData.map((stat, index) => (
            <div key={index} className={`CompanyDetails-stat-card CompanyDetails-stat-${stat.tone}`}>
              <div className="CompanyDetails-stat-icon">
                {getIconSvg(stat.icon)}
              </div>
              <div className="CompanyDetails-stat-main">
                <div className="CompanyDetails-stat-label">{stat.label}</div>
                <div className="CompanyDetails-stat-value">
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="CompanyDetails-analytics-grid">
          <div className="CompanyDetails-chart-card CompanyDetails-login-chart">
            <div className="CompanyDetails-chart-header">
              <div>
                <h3>Weekly Login Analytics</h3>
                <p>{weeklyLoginTotal} logins in the last 7 days</p>
              </div>
              <span className="CompanyDetails-trend-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4L19.71 9.7 22 12V6h-6z"/>
                </svg>
              </span>
            </div>
            <div className="CompanyDetails-line-chart">
              <svg viewBox="0 0 620 230" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="CompanyDetailsAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map(line => (
                  <line
                    key={line}
                    x1="42"
                    x2="600"
                    y1={32 + line * 46}
                    y2={32 + line * 46}
                    className="CompanyDetails-chart-grid-line"
                  />
                ))}
                <path
                  d={weeklyLoginAreaPath}
                  fill="url(#CompanyDetailsAreaFill)"
                />
                <path
                  d={weeklyLoginPath}
                  className="CompanyDetails-chart-line CompanyDetails-chart-line-green"
                />
                {chartPoints.map(point => (
                  <g key={`${point.day}-${point.x}`}>
                    <circle cx={point.x} cy={point.y} r="5" className="CompanyDetails-chart-point" />
                    <text x={point.x} y={point.y - 12} textAnchor="middle" className="CompanyDetails-chart-value">
                      {point.count}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="CompanyDetails-chart-days">
                {weeklyLoginData.map(item => (
                  <span key={`${item.day}-${item.date || ""}`}>{item.day}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="CompanyDetails-chart-card CompanyDetails-department-split-card">
            <div className="CompanyDetails-chart-header">
              <div>
                <h3>Department Split</h3>
                <p>Company user activity</p>
              </div>
              <span className="CompanyDetails-more-dot">...</span>
            </div>
            <div className="CompanyDetails-donut-wrap CompanyDetails-activity-donut-wrap">
              <div className="CompanyDetails-donut-chart CompanyDetails-activity-donut-chart"></div>
              <div className="CompanyDetails-donut-center">
                <strong>{stats.totalUsers}</strong>
                <span>Users</span>
              </div>
            </div>
            <div className="CompanyDetails-split-metrics">
              {[
                { label: "Total Users", value: stats.totalUsers, tone: "blue" },
                { label: "Active Users", value: stats.activeUsers, tone: "green" },
                { label: "Today Logins", value: stats.todayLogins, tone: "orange" },
              ].map(item => (
                <div className={`CompanyDetails-split-metric CompanyDetails-split-${item.tone}`} key={item.label}>
                  <span className="CompanyDetails-split-dot"></span>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conditional Rendering based on tab for mobile */}
        {isMobile ? (
          <>
            {activeTab === 0 && (
              <>
                {/* Company Information Card */}
                <div className="CompanyDetails-info-card">
                  <div className="CompanyDetails-card-header">
                    <div className="CompanyDetails-header-icon CompanyDetails-primary-bg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                      </svg>
                    </div>
                    <h3 className="CompanyDetails-card-title">Company Information</h3>
                  </div>

                  <div className="CompanyDetails-info-grid">
                    {infoItems.map((item, index) => (
                      <div key={index} className="CompanyDetails-info-item">
                        <div className="CompanyDetails-info-icon" style={{ background: item.gradient }}>
                          {getIconSvg(item.icon)}
                        </div>
                        <div className="CompanyDetails-info-content">
                          <span className="CompanyDetails-info-label">{item.label}</span>
                          <span className="CompanyDetails-info-value">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Card */}
                <div className={`CompanyDetails-subscription-card CompanyDetails-status-${subscriptionStatus.color}`}>
                  <div className="CompanyDetails-subscription-bg"></div>
                  <div className="CompanyDetails-subscription-content">
                    <div className="CompanyDetails-subscription-header">
                      <div className="CompanyDetails-header-icon" style={{ background: subscriptionStatus.bg }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                        </svg>
                      </div>
                      <h3 className="CompanyDetails-card-title">Subscription Status</h3>
                      <span className="CompanyDetails-status-badge" style={{ background: subscriptionStatus.bg }}>
                        {subscriptionStatus.text}
                      </span>
                    </div>

                    <p className="CompanyDetails-expiry-text">
                      <strong>Expires on:</strong> {formatDate(company.subscriptionExpiry)}
                    </p>

                    <div className="CompanyDetails-progress-container">
                      <div className="CompanyDetails-progress-header">
                        <span className="CompanyDetails-progress-label">Days Remaining</span>
                        <span className="CompanyDetails-progress-value" style={{ background: subscriptionStatus.bg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          {daysRemaining} days
                        </span>
                      </div>
                      <div className="CompanyDetails-progress-bar">
                        <div className="CompanyDetails-progress-fill" style={{ width: `${subscriptionProgress}%`, background: subscriptionStatus.bg }}></div>
                      </div>
                    </div>

                    <div className={`CompanyDetails-alert CompanyDetails-alert-${subscriptionStatus.color}`}>
                      {daysRemaining > 0 
                        ? `Your subscription will expire in ${daysRemaining} days.`
                        : 'Your subscription has expired.'}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 1 && (
              <div className="CompanyDetails-recent-users-card">
                <div className="CompanyDetails-card-header">
                  <div className="CompanyDetails-header-icon CompanyDetails-primary-bg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-1 .05 1.16.84 2 1.87 2 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <h3 className="CompanyDetails-card-title">Recent Users</h3>
                  {branchFilterControl}
                </div>

                <div className="CompanyDetails-users-list">
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user, index) => {
                      // Get department name for display
                      let deptDisplay = "No Department";
                      
                      if (user.departmentName) {
                        deptDisplay = user.departmentName;
                      } else if (user.department && typeof user.department === 'object') {
                        deptDisplay = user.department.name || user.department._id;
                      } else if (user.department) {
                        deptDisplay = getDepartmentName(user.department);
                      }
                      const branchDisplay = getBranchLabel(user.branch || user.branchId || user.branch_id || user.branchDetails);
                      
                      return (
                        <div key={user.id || user._id || index} className="CompanyDetails-user-item">
                          <div className="CompanyDetails-user-avatar-wrapper">
                            <div className={`CompanyDetails-user-avatar ${user.isActive ? 'CompanyDetails-active' : 'CompanyDetails-inactive'}`}>
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className={`CompanyDetails-status-dot ${user.isActive ? 'CompanyDetails-active' : 'CompanyDetails-inactive'}`}></div>
                          </div>

                          <div className="CompanyDetails-user-info">
                            <div className="CompanyDetails-user-name">{user.name || 'Unknown User'}</div>
                            <div className="CompanyDetails-user-tags">
                              {user.employeeType && (
                                <span className="CompanyDetails-tag CompanyDetails-employee-type">{user.employeeType}</span>
                              )}
                              <span className="CompanyDetails-tag CompanyDetails-department">
                                {deptDisplay}
                              </span>
                              <span className="CompanyDetails-tag CompanyDetails-branch">
                                {branchDisplay}
                              </span>
                            </div>
                          </div>

                          <button className="CompanyDetails-edit-user-btn" onClick={() => handleEditUser(user)} title="Edit User">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            {!isMobile && 'Edit'}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="CompanyDetails-empty-state">
                      <div className="CompanyDetails-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-1 .05 1.16.84 2 1.87 2 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                      </div>
                      <p className="CompanyDetails-empty-title">No Users Found</p>
                      <p className="CompanyDetails-empty-subtitle">Get started by adding users</p>
                      <button className="CompanyDetails-btn CompanyDetails-btn-primary CompanyDetails-btn-sm" onClick={handleAddNewUser}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        Add First User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop/Tablet Layout */
          <div className="CompanyDetails-desktop-grid">
            <div className="CompanyDetails-left-column">
              {/* Company Information Card */}
              <div className="CompanyDetails-info-card">
                <div className="CompanyDetails-card-header">
                  <div className="CompanyDetails-header-icon CompanyDetails-primary-bg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                    </svg>
                  </div>
                  <h3 className="CompanyDetails-card-title">Company Information</h3>
                </div>

                <div className="CompanyDetails-info-grid">
                  {infoItems.map((item, index) => (
                    <div key={index} className="CompanyDetails-info-item">
                      <div className="CompanyDetails-info-icon" style={{ background: item.gradient }}>
                        {getIconSvg(item.icon)}
                      </div>
                      <div className="CompanyDetails-info-content">
                        <span className="CompanyDetails-info-label">{item.label}</span>
                        <span className="CompanyDetails-info-value">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Card */}
              <div className={`CompanyDetails-subscription-card CompanyDetails-status-${subscriptionStatus.color}`}>
                <div className="CompanyDetails-subscription-bg"></div>
                <div className="CompanyDetails-subscription-content">
                  <div className="CompanyDetails-subscription-header">
                    <div className="CompanyDetails-header-icon" style={{ background: subscriptionStatus.bg }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                      </svg>
                    </div>
                    <h3 className="CompanyDetails-card-title">Subscription Status</h3>
                    <span className="CompanyDetails-status-badge" style={{ background: subscriptionStatus.bg }}>
                      {subscriptionStatus.text}
                    </span>
                  </div>

                  <p className="CompanyDetails-expiry-text">
                    <strong>Expires on:</strong> {formatDate(company.subscriptionExpiry)}
                  </p>

                  <div className="CompanyDetails-progress-container">
                    <div className="CompanyDetails-progress-header">
                      <span className="CompanyDetails-progress-label">Days Remaining</span>
                      <span className="CompanyDetails-progress-value" style={{ background: subscriptionStatus.bg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {daysRemaining} days
                      </span>
                    </div>
                    <div className="CompanyDetails-progress-bar">
                      <div className="CompanyDetails-progress-fill" style={{ width: `${subscriptionProgress}%`, background: subscriptionStatus.bg }}></div>
                    </div>
                  </div>

                  <div className={`CompanyDetails-alert CompanyDetails-alert-${subscriptionStatus.color}`}>
                    {daysRemaining > 0 
                      ? `Your subscription will expire in ${daysRemaining} days.`
                      : 'Your subscription has expired.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="CompanyDetails-right-column">
              <div className="CompanyDetails-recent-users-card">
                <div className="CompanyDetails-card-header">
                  <div className="CompanyDetails-header-icon CompanyDetails-primary-bg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-1 .05 1.16.84 2 1.87 2 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <h3 className="CompanyDetails-card-title">Recent Users</h3>
                  {branchFilterControl}
                </div>

                <div className="CompanyDetails-users-list">
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user, index) => {
                      // Get department name for display
                      let deptDisplay = "No Department";
                      
                      if (user.departmentName) {
                        deptDisplay = user.departmentName;
                      } else if (user.department && typeof user.department === 'object') {
                        deptDisplay = user.department.name || user.department._id;
                      } else if (user.department) {
                        deptDisplay = getDepartmentName(user.department);
                      }
                      const branchDisplay = getBranchLabel(user.branch || user.branchId || user.branch_id || user.branchDetails);
                      
                      return (
                        <div key={user.id || user._id || index} className="CompanyDetails-user-item">
                          <div className="CompanyDetails-user-avatar-wrapper">
                            <div className={`CompanyDetails-user-avatar ${user.isActive ? 'CompanyDetails-active' : 'CompanyDetails-inactive'}`}>
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className={`CompanyDetails-status-dot ${user.isActive ? 'CompanyDetails-active' : 'CompanyDetails-inactive'}`}></div>
                          </div>

                          <div className="CompanyDetails-user-info">
                            <div className="CompanyDetails-user-name">{user.name || 'Unknown User'}</div>
                            <div className="CompanyDetails-user-tags">
                              {user.employeeType && (
                                <span className="CompanyDetails-tag CompanyDetails-employee-type">{user.employeeType}</span>
                              )}
                              <span className="CompanyDetails-tag CompanyDetails-department">
                                {deptDisplay}
                              </span>
                              <span className="CompanyDetails-tag CompanyDetails-branch">
                                {branchDisplay}
                              </span>
                            </div>
                          </div>

                          <button className="CompanyDetails-edit-user-btn" onClick={() => handleEditUser(user)} title="Edit User">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            {!isMobile && 'Edit'}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="CompanyDetails-empty-state">
                      <div className="CompanyDetails-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-1 .05 1.16.84 2 1.87 2 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                      </div>
                      <p className="CompanyDetails-empty-title">No Users Found</p>
                      <p className="CompanyDetails-empty-subtitle">Get started by adding users</p>
                      <button className="CompanyDetails-btn CompanyDetails-btn-primary CompanyDetails-btn-sm" onClick={handleAddNewUser}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        Add First User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="CompanyDetails-feature-strip">
          {[
            { icon: "M12 20V4m0 16l-4-4m4 4l4-4", title: "Smart Activity Timeline", text: "Track every user action clearly." },
            { icon: "M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z", title: "Role Based Access", text: "Secure access for every department." },
            { icon: "M7 2v3M17 2v3M4 9h16M5 5h14a1 1 0 011 1v15H4V6a1 1 0 011-1z", title: "Attendance & Leave Ready", text: "Connect modules in one dashboard." },
          ].map(item => (
            <div className="CompanyDetails-feature-item" key={item.title}>
              <span className="CompanyDetails-feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </span>
              <div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="CompanyDetails-mobile-bottom-nav">
        <button 
          className={`CompanyDetails-nav-item ${activeTab === 0 ? 'CompanyDetails-active' : ''}`} 
          onClick={() => handleTabChange(0)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
          <span>Overview</span>
        </button>
        <button 
          className={`CompanyDetails-nav-item ${activeTab === 1 ? 'CompanyDetails-active' : ''}`} 
          onClick={() => handleTabChange(1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-1 .05 1.16.84 2 1.87 2 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <span>Users</span>
        </button>
        <button 
          className="CompanyDetails-nav-item CompanyDetails-add" 
          onClick={(e) => {
            e.stopPropagation();
            handleAddNewUser();
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>

      {/* Company Edit Modal */}
      {companyEditModalOpen && (
        <div className="CompanyDetails-modal-overlay" onClick={() => !companyEditLoading && setCompanyEditModalOpen(false)}>
          <div className={`CompanyDetails-modal-content ${isMobile ? 'CompanyDetails-fullscreen' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="CompanyDetails-modal-header CompanyDetails-primary-header">
              <div className="CompanyDetails-modal-header-left">
                <div className="CompanyDetails-modal-header-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="CompanyDetails-modal-title">Edit Company Details</h2>
                  <p className="CompanyDetails-modal-subtitle">Update company information</p>
                </div>
              </div>
              <button className="CompanyDetails-modal-close" onClick={() => setCompanyEditModalOpen(false)} disabled={companyEditLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="CompanyDetails-modal-body">
              {!companyEditSuccess ? (
                <div className="CompanyDetails-form-container">
                  <div className="CompanyDetails-alert-info">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <span>Editing: <strong>{company.companyName}</strong></span>
                  </div>

                  <div className="CompanyDetails-form-grid">
                    <div className="CompanyDetails-form-group CompanyDetails-full-width">
                      <label className="CompanyDetails-form-label">Company Name *</label>
                      <div className="CompanyDetails-input-wrapper">
                        <span className="CompanyDetails-input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="companyName"
                          value={companyEditFormData.companyName}
                          onChange={handleCompanyInputChange}
                          className="CompanyDetails-form-input"
                          placeholder="Enter company name"
                        />
                      </div>
                    </div>

                    <div className="CompanyDetails-form-group">
                      <label className="CompanyDetails-form-label">Email Address</label>
                      <div className="CompanyDetails-input-wrapper">
                        <span className="CompanyDetails-input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                          </svg>
                        </span>
                        <input
                          type="email"
                          name="companyEmail"
                          value={companyEditFormData.companyEmail}
                          onChange={handleCompanyInputChange}
                          className="CompanyDetails-form-input"
                          placeholder="Enter company email"
                        />
                      </div>
                    </div>

                    <div className="CompanyDetails-form-group">
                      <label className="CompanyDetails-form-label">Phone Number</label>
                      <div className="CompanyDetails-input-wrapper">
                        <span className="CompanyDetails-input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="companyPhone"
                          value={companyEditFormData.companyPhone}
                          onChange={handleCompanyInputChange}
                          className="CompanyDetails-form-input"
                          placeholder="Enter company phone"
                        />
                      </div>
                    </div>

                    <div className="CompanyDetails-form-group CompanyDetails-full-width">
                      <label className="CompanyDetails-form-label">Logo URL</label>
                      <div className="CompanyDetails-input-wrapper">
                        <span className="CompanyDetails-input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="logo"
                          value={companyEditFormData.logo}
                          onChange={handleCompanyInputChange}
                          className="CompanyDetails-form-input"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <span className="CompanyDetails-input-hint">Leave empty for default logo</span>
                    </div>

                    <div className="CompanyDetails-form-group CompanyDetails-full-width">
                      <label className="CompanyDetails-form-label">Address</label>
                      <div className="CompanyDetails-input-wrapper">
                        <span className="CompanyDetails-input-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </span>
                        <textarea
                          name="companyAddress"
                          value={companyEditFormData.companyAddress}
                          onChange={handleCompanyInputChange}
                          className="CompanyDetails-form-input"
                          placeholder="Enter company address"
                          rows={isMobile ? 2 : 3}
                        />
                      </div>
                    </div>
                  </div>

                  {companyEditFormData.logo && (
                    <div className="CompanyDetails-logo-preview">
                      <img 
                        src={companyEditFormData.logo} 
                        alt="Logo preview"
                        className="CompanyDetails-preview-img"
                        onError={(e) => { e.target.src = DEFAULT_COMPANY_LOGO; }}
                      />
                      <div className="CompanyDetails-preview-text">
                        <span className="CompanyDetails-preview-label">Logo Preview</span>
                        <span className="CompanyDetails-preview-url">{companyEditFormData.logo.substring(0, 40)}...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="CompanyDetails-success-state">
                  <div className="CompanyDetails-success-icon">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3 className="CompanyDetails-success-title">Company Updated!</h3>
                  <p className="CompanyDetails-success-message">
                    <span className="CompanyDetails-highlight">{companyEditFormData.companyName}</span> has been updated successfully.
                  </p>
                  <div className="CompanyDetails-success-spinner"></div>
                </div>
              )}
            </div>

            {!companyEditSuccess && (
              <div className="CompanyDetails-modal-footer">
                <button className="CompanyDetails-btn CompanyDetails-btn-secondary" onClick={() => setCompanyEditModalOpen(false)} disabled={companyEditLoading}>
                  Cancel
                </button>
                <button 
                  className="CompanyDetails-btn CompanyDetails-btn-primary" 
                  onClick={handleSaveCompany} 
                  disabled={companyEditLoading}
                >
                  {companyEditLoading ? (
                    <>
                      <span className="CompanyDetails-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm4-10H5V5h11v4z"/>
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

     
      {/* Edit User Modal */}
{editModalOpen && selectedUser && (
  <div className="CompanyDetails-modal-overlay" onClick={() => !saveLoading && setEditModalOpen(false)}>
    <div className={`CompanyDetails-modal-content CompanyDetails-large ${isMobile ? 'CompanyDetails-fullscreen' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="CompanyDetails-modal-header CompanyDetails-primary-header">
        <div className="CompanyDetails-modal-header-left">
          <div className="CompanyDetails-modal-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div>
            <h2 className="CompanyDetails-modal-title">Edit User Details</h2>
            <p className="CompanyDetails-modal-subtitle">Complete user profile management</p>
          </div>
        </div>
        <button className="CompanyDetails-modal-close" onClick={() => setEditModalOpen(false)} disabled={saveLoading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div className="CompanyDetails-modal-body">
        {!editSuccess ? (
          <div className="CompanyDetails-form-container">
            <div className="CompanyDetails-alert-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>Editing: <strong>{selectedUser.name}</strong> ({selectedUser.email})</span>
            </div>

            {/* SECTION 1: BASIC INFORMATION */}
            <div className="CompanyDetails-form-section">
              <div className="CompanyDetails-section-header">
                <div className="CompanyDetails-section-icon CompanyDetails-blue-bg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <h3 className="CompanyDetails-section-title">Basic Information</h3>
              </div>

              <div className="CompanyDetails-form-grid">
                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Full Name *</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      className={`CompanyDetails-form-input ${formErrors.name ? 'CompanyDetails-error' : ''}`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {formErrors.name && <span className="CompanyDetails-error-message">{formErrors.name}</span>}
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Email Address</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                      className={`CompanyDetails-form-input ${formErrors.email ? 'CompanyDetails-error' : ''}`}
                      placeholder="Enter email"
                    />
                  </div>
                  {formErrors.email && <span className="CompanyDetails-error-message">{formErrors.email}</span>}
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Phone Number</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleInputChange}
                      className="CompanyDetails-form-input"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Date of Birth</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                      </svg>
                    </span>
                    <input
                      type="date"
                      name="dob"
                      value={editFormData.dob}
                      onChange={handleInputChange}
                      className="CompanyDetails-form-input"
                    />
                  </div>
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Gender</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                      </svg>
                    </span>
                    <select
                      name="gender"
                      value={editFormData.gender}
                      onChange={handleSelectChange}
                      className="CompanyDetails-form-input"
                    >
                      <option value="">None</option>
                      {genderOptions.map(option => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Marital Status</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </span>
                    <select
                      name="maritalStatus"
                      value={editFormData.maritalStatus}
                      onChange={handleSelectChange}
                      className="CompanyDetails-form-input"
                    >
                      <option value="">None</option>
                      {maritalStatusOptions.map(option => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="CompanyDetails-form-group CompanyDetails-full-width">
                  <label className="CompanyDetails-form-label">Address</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </span>
                    <textarea
                      name="address"
                      value={editFormData.address}
                      onChange={handleInputChange}
                      className="CompanyDetails-form-input"
                      placeholder="Enter address"
                      rows={isMobile ? 1 : 2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: EMPLOYMENT INFORMATION */}
            <div className="CompanyDetails-form-section">
              <div className="CompanyDetails-section-header">
                <div className="CompanyDetails-section-icon CompanyDetails-orange-bg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
                  </svg>
                </div>
                <h3 className="CompanyDetails-section-title">Employment Information</h3>
              </div>

              <div className="CompanyDetails-form-grid">
                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Job Role</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="jobRole"
                      value={editFormData.jobRole}
                      onChange={handleInputChange}
                      className="CompanyDetails-form-input"
                      placeholder="Enter job role"
                      list="CompanyDetails-job-roles"
                    />
                    <datalist id="CompanyDetails-job-roles">
                      {jobRoles.map(role => (
                        <option key={role.id} value={role.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Department</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="department"
                      value={editFormData.department}
                      onChange={handleInputChange}
                      className="CompanyDetails-form-input"
                      placeholder="Enter department"
                      list="CompanyDetails-departments"
                    />
                    <datalist id="CompanyDetails-departments">
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Employee Type</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
                      </svg>
                    </span>
                    <select
                      name="employeeType"
                      value={editFormData.employeeType}
                      onChange={handleSelectChange}
                      className="CompanyDetails-form-input"
                    >
                      <option value="">None</option>
                      {employeeTypeOptions.map(option => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Designation</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="designation"
                      value={editFormData.designation}
                      onChange={handleInputChange}
                      className="CompanyDetails-form-input"
                      placeholder="Enter designation"
                    />
                  </div>
                </div>

                <div className="CompanyDetails-form-group">
                  <label className="CompanyDetails-form-label">Salary</label>
                  <div className="CompanyDetails-input-wrapper">
                    <span className="CompanyDetails-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.5 1L8 7h7l-3.5-6zm0 22L8 17h7l-3.5 6zM12 10.5l-3.5 6h7l-3.5-6z"/>
                      </svg>
                    </span>
                    <input
                      type="number"
                      name="salary"
                      value={editFormData.salary}
                      onChange={handleInputChange}
                      className="CompanyDetails-form-input"
                      placeholder="Enter salary"
                    />
                  </div>
                </div>

                <div className="CompanyDetails-form-group CompanyDetails-checkbox-group">
                  <label className="CompanyDetails-checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={editFormData.isActive}
                      onChange={handleInputChange}
                      className="CompanyDetails-checkbox-input"
                    />
                    <span className="CompanyDetails-checkbox-text">Active Status</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="CompanyDetails-success-state">
            <div className="CompanyDetails-success-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="CompanyDetails-success-title">Update Successful!</h3>
            <p className="CompanyDetails-success-message">
              User <span className="CompanyDetails-highlight">{editFormData.name}</span> has been updated successfully.
            </p>
            <div className="CompanyDetails-success-spinner"></div>
          </div>
        )}
      </div>

      {!editSuccess && (
        <div className="CompanyDetails-modal-footer">
          <button className="CompanyDetails-btn CompanyDetails-btn-secondary" onClick={() => setEditModalOpen(false)} disabled={saveLoading}>
            Cancel
          </button>
          
          {/* Delete User Button - Exactly where it was before */}
          <button 
            className="CompanyDetails-btn CompanyDetails-btn-danger" 
            onClick={handleDeleteUser} 
            disabled={saveLoading}
          >
            {saveLoading ? (
              <>
                <span className="CompanyDetails-spinner"></span>
                Deleting...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Delete User
              </>
            )}
          </button>
          
          <button 
            className="CompanyDetails-btn CompanyDetails-btn-primary" 
            onClick={handleSaveUser} 
            disabled={saveLoading || !editFormData.name.trim()}
          >
            {saveLoading ? (
              <>
                <span className="CompanyDetails-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm4-10H5V5h11v4z"/>
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
};

export default CompanyDetails;
