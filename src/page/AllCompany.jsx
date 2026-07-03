import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config";
import "./AllCompany.css"; 
import CIISLoader from '../Loader/CIISLoader'; 

const AllCompany = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  
  const [bottomNavValue, setBottomNavValue] = useState(0);

  
  const [pageLoading, setPageLoading] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("active");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New company registered', time: '5 min ago', read: false, type: 'registration' },
    { id: 2, message: 'Subscription expiring soon', time: '1 hour ago', read: false, type: 'subscription' },
    { id: 3, message: 'User limit reached', time: '2 hours ago', read: true, type: 'alert' },
  ]);
  
  const [usersPopupOpen, setUsersPopupOpen] = useState(false);
  const [companyDetailsPopupOpen, setCompanyDetailsPopupOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [companyDetailsLoading, setCompanyDetailsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedCompany, setEditedCompany] = useState(null);
  const [departmentNamesById, setDepartmentNamesById] = useState({});
  const [jobRoleNamesById, setJobRoleNamesById] = useState({});
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscriptionCompany, setSubscriptionCompany] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("Standard");
  const [subscriptionAmount, setSubscriptionAmount] = useState("");
  const [subscriptionPaymentStatus, setSubscriptionPaymentStatus] = useState("paid");
  const [subscriptionPaymentMode, setSubscriptionPaymentMode] = useState("upi");
  const [subscriptionTransactionId, setSubscriptionTransactionId] = useState("");
  const [subscriptionPaymentDate, setSubscriptionPaymentDate] = useState("");
  const [subscriptionNotes, setSubscriptionNotes] = useState("");
  const [subscriptionActivateCompany, setSubscriptionActivateCompany] = useState(true);
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);

  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  
  const itemsPerPage = isMobile ? 5 : isTablet ? 8 : 10;

  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      navigate("/super-admin/login");
      return false;
    }
    return true;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const toDateInputValue = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const getDateAfterDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toDateInputValue(date);
  };

  const getPlanId = (company) => {
    if (!company?.selectedPlan) return "";
    return typeof company.selectedPlan === "object" ? company.selectedPlan._id : company.selectedPlan;
  };

  const getPlanName = (company) => {
    if (company?.selectedPlan && typeof company.selectedPlan === "object") {
      return company.selectedPlan.name || company.subscriptionPlan || "No Plan";
    }
    return company?.subscriptionPlan || "No Plan";
  };

  const getSubscriptionStatus = (company) => {
    if (company?.isActive === false) return { label: "Inactive", className: "AllCompany-status-inactive" };
    if (!company?.subscriptionExpiry) return { label: "No Expiry", className: "AllCompany-status-pending" };
    const daysLeft = Math.ceil((new Date(company.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { label: "Expired", className: "AllCompany-status-inactive" };
    if (daysLeft <= 7) return { label: "Critical", className: "AllCompany-status-pending" };
    if (daysLeft <= 15) return { label: "Expiring Soon", className: "AllCompany-status-pending" };
    return { label: "Active", className: "AllCompany-status-active" };
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/plans?includeInactive=true`, { headers: getAuthHeaders() });
      setPlans(response.data?.plans || []);
    } catch (error) {
      console.error("❌ ERROR fetching plans:", error);
      toast.error(error.response?.data?.message || "Failed to load plans");
    }
  };

  const updateCompanyEverywhere = (updatedCompany) => {
    if (!updatedCompany?._id) return;
    setCompanies(prev => prev.map(company =>
      company._id === updatedCompany._id
        ? { ...company, ...updatedCompany, users: company.users, userCount: company.userCount }
        : company
    ));
    setFilteredCompanies(prev => prev.map(company =>
      company._id === updatedCompany._id
        ? { ...company, ...updatedCompany, users: company.users, userCount: company.userCount }
        : company
    ));
    setSelectedCompany(prev => prev?._id === updatedCompany._id ? { ...prev, ...updatedCompany } : prev);
    setCompanyDetails(prev => prev?._id === updatedCompany._id ? { ...prev, ...updatedCompany } : prev);
    setEditedCompany(prev => prev?._id === updatedCompany._id ? { ...prev, ...updatedCompany } : prev);
  };

  
  const fetchCompanyDetails = async (companyId) => {
    try {
      setCompanyDetailsLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(
        `${API_URL}/company/${companyId}`,
        { headers }
      );
      
      if (response.data) {
        setCompanyDetails(response.data.company);
        setEditedCompany(response.data.company);
        setCompanyDetailsPopupOpen(true);
      } else {
        toast.error("Company details not found");
      }
    } catch (error) {
      console.error("❌ ERROR fetching company details:", error);
      
      if (error.response?.status === 401) {
        toast.error("You are not authorized to load this data.");
        return;
      }
      
      toast.error("Failed to load company details");
    } finally {
      setCompanyDetailsLoading(false);
    }
  };

  
  const handleUpdateCompany = async () => {
    try {
      if (!checkAuth()) return;
      
      const headers = getAuthHeaders();
      const previousCompany = companyDetails || selectedCompany;
      let updatedCompany = null;
      
      const response = await axios.put(
        `${API_URL}/company/${editedCompany?._id}`,
        editedCompany,
        { headers }
      );

      updatedCompany = response.data?.company || response.data;

      if (previousCompany && previousCompany.isActive !== editedCompany.isActive) {
        const statusEndpoint = editedCompany.isActive ? "activate" : "deactivate";
        const statusResponse = await axios.patch(
          `${API_URL}/company/${editedCompany._id}/${statusEndpoint}`,
          {},
          { headers }
        );
        updatedCompany = statusResponse.data?.company || {
          ...updatedCompany,
          isActive: editedCompany.isActive,
          deactivatedAt: editedCompany.isActive ? null : new Date().toISOString()
        };
      }
      
      if (updatedCompany) {
        toast.success("Company updated successfully!");
        updateCompanyEverywhere(updatedCompany);
        setCompanyDetails(updatedCompany);
        setSelectedCompany(prev => prev ? { ...prev, ...updatedCompany } : updatedCompany);
        setEditMode(false);
        
        fetchCompaniesWithUsers();
      }
    } catch (error) {
      console.error("❌ ERROR updating company:", error);
      toast.error(error.response?.data?.message || "Failed to update company");
    }
  };

  
  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_URL}/superAdmin/users`, { headers });
      
      if (response.data && response.data.length > 0) {
        const usersByCompany = {};
        
        response.data.forEach(user => {
          const companyId = user.company?._id || user.company;
          if (companyId) {
            if (!usersByCompany[companyId]) {
              usersByCompany[companyId] = [];
            }
            usersByCompany[companyId].push(user);
          }
        });
        
        return usersByCompany;
      }
      return {};
    } catch (error) {
      console.error("❌ ERROR in fetchAllUsers:", error);
      return {};
    }
  };

  
  const fetchCompaniesWithUsers = async () => {
    if (!checkAuth()) return;

    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const companiesRes = await axios.get(
        `${API_URL}/superAdmin/companies`,
        { headers }
      );

      const companiesData = companiesRes.data || [];
      const usersByCompany = await fetchAllUsers();

      const companiesWithUsers = companiesData.map(company => {
        const companyUsers = usersByCompany[company._id] || [];
        return {
          ...company,
          userCount: companyUsers.length,
          users: companyUsers
        };
      });

      setCompanies(companiesWithUsers);
      setFilteredCompanies(companiesWithUsers);

    } catch (error) {
      console.error("❌ ERROR in fetchCompaniesWithUsers:", error);
      
      if (error.response?.status === 401) {
        toast.error("You are not authorized to load this data.");
        return;
      }

      toast.error("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setPageLoading(false); 
    }
  };

  
  useEffect(() => {
    let results = [...companies];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(company =>
        company.companyName?.toLowerCase().includes(term) ||
        company.companyEmail?.toLowerCase().includes(term) ||
        company.companyCode?.toLowerCase().includes(term) ||
        company.ownerName?.toLowerCase().includes(term)
      );
    }

    if (filter === "active") {
      results = results.filter(company => company.isActive === true);
    } else if (filter === "inactive") {
      results = results.filter(company => company.isActive === false);
    }

    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.companyName || '').localeCompare(b.companyName || '');
          break;
        case 'users':
          comparison = (a.userCount || 0) - (b.userCount || 0);
          break;
        case 'date':
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setPage(1);
    setFilteredCompanies(results);
  }, [searchTerm, filter, sortBy, sortOrder, companies]);

  
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      try {
        await Promise.all([fetchCompaniesWithUsers(), fetchPlans()]);
      } catch (error) {
        console.error("Error loading companies:", error);
        toast.error("Failed to load companies");
      } finally {
        
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []);

  
  const fetchCompanyUsers = async (companyId) => {
    try {
      setUsersLoading(true);
      
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const allUsersRes = await axios.get(
        `${API_URL}/superAdmin/users`,
        { headers }
      );
      const allUsers = extractList(allUsersRes.data, ["users", "companyUsers"]);
      const users = allUsers.filter(user => {
        const userCompanyId = getEntityId(user.company || user.companyId);
        return userCompanyId?.toString() === companyId?.toString();
      });
      
      const { departmentMap, jobRoleMap } = await fetchCompanyLookups(companyId, headers);
      setCompanyUsers(enrichUsersWithLookupNames(users, departmentMap, jobRoleMap));
    } catch (error) {
      console.error("❌ Error fetching company users:", error);
      toast.error("Failed to load users");
      setCompanyUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  
  const handleOpenUsersPopup = async (company) => {
    setSelectedCompany(company);
    await fetchCompanyUsers(company._id);
    setUsersPopupOpen(true);
  };

  
  const handleCloseUsersPopup = () => {
    setUsersPopupOpen(false);
    setSelectedCompany(null);
    setCompanyUsers([]);
  };

  
  const handleOpenCompanyDetails = async (company) => {
    setSelectedCompany(company);
    await fetchCompanyDetails(company._id);
  };

  
  const handleCloseCompanyDetails = () => {
    setCompanyDetailsPopupOpen(false);
    setSelectedCompany(null);
    setCompanyDetails(null);
    setEditMode(false);
    setEditedCompany(null);
  };

  const handleToggleCompanyStatus = async (company, nextActive = !company?.isActive) => {
    if (!company?._id || !checkAuth()) return;

    const action = nextActive ? "activate" : "deactivate";
    const label = nextActive ? "activate" : "deactivate";
    const confirmed = window.confirm(`Are you sure you want to ${label} ${company.companyName || "this company"}?`);
    if (!confirmed) return;

    try {
      setStatusSavingId(company._id);
      const response = await axios.patch(
        `${API_URL}/company/${company._id}/${action}`,
        {},
        { headers: getAuthHeaders() }
      );
      const updatedCompany = response.data?.company || {
        ...company,
        isActive: nextActive,
        deactivatedAt: nextActive ? null : new Date().toISOString()
      };

      updateCompanyEverywhere(updatedCompany);
      toast.success(`Company ${nextActive ? "activated" : "deactivated"} successfully`);
      fetchCompaniesWithUsers();
    } catch (error) {
      console.error("Company status update error:", error);
      toast.error(error.response?.data?.message || `Failed to ${label} company`);
    } finally {
      setStatusSavingId(null);
    }
  };

  const handleOpenSubscriptionModal = (company) => {
    const selectedPlanId = getPlanId(company);
    const selectedPlan = plans.find(plan => plan._id === selectedPlanId);
    setSubscriptionCompany(company);
    setSubscriptionPlanId(selectedPlanId);
    setSubscriptionExpiryDate(toDateInputValue(company?.subscriptionExpiry) || getDateAfterDays(selectedPlan?.durationDays || 30));
    setSubscriptionPlan(selectedPlan?.name || company?.subscriptionPlan || "Standard");
    setSubscriptionAmount(String(selectedPlan?.price ?? company?.subscriptionAmount ?? ""));
    setSubscriptionPaymentStatus(company?.subscriptionPaymentStatus || "paid");
    setSubscriptionPaymentMode(company?.subscriptionPayments?.[0]?.paymentMode || "upi");
    setSubscriptionTransactionId("");
    setSubscriptionPaymentDate(toDateInputValue(new Date()));
    setSubscriptionNotes("");
    setSubscriptionActivateCompany(company?.isActive !== false);
    setSubscriptionModalOpen(true);
  };

  const handleSubscriptionPlanChange = (planId) => {
    const selectedPlan = plans.find(plan => plan._id === planId);
    setSubscriptionPlanId(planId);
    if (!selectedPlan) return;
    setSubscriptionPlan(selectedPlan.name || "Standard");
    setSubscriptionAmount(String(selectedPlan.price ?? 0));
    setSubscriptionExpiryDate(getDateAfterDays(selectedPlan.durationDays || 30));
  };

  const handleCloseSubscriptionModal = () => {
    setSubscriptionModalOpen(false);
    setSubscriptionCompany(null);
    setSubscriptionPlanId("");
    setSubscriptionExpiryDate("");
    setSubscriptionPlan("Standard");
    setSubscriptionAmount("");
    setSubscriptionPaymentStatus("paid");
    setSubscriptionPaymentMode("upi");
    setSubscriptionTransactionId("");
    setSubscriptionPaymentDate("");
    setSubscriptionNotes("");
    setSubscriptionActivateCompany(true);
  };

  const handleSaveSubscriptionDate = async () => {
    if (!subscriptionCompany?._id || !checkAuth()) return;
    if (!subscriptionExpiryDate) {
      toast.error("Please select subscription expiry date");
      return;
    }
    if (!subscriptionPlanId) {
      toast.error("Please select a plan");
      return;
    }

    try {
      setSubscriptionSaving(true);
      const response = await axios.patch(
        `${API_URL}/company/${subscriptionCompany._id}/subscription`,
        {
          subscriptionExpiry: subscriptionExpiryDate,
          planId: subscriptionPlanId || undefined,
          planName: subscriptionPlan,
          amount: Number(subscriptionAmount || 0),
          paymentStatus: subscriptionPaymentStatus,
          paymentMode: subscriptionPaymentMode,
          transactionId: subscriptionTransactionId,
          paymentDate: subscriptionPaymentDate || new Date().toISOString(),
          notes: subscriptionNotes,
          isActive: subscriptionActivateCompany
        },
        { headers: getAuthHeaders() }
      );
      const updatedCompany = response.data?.company || {
        ...subscriptionCompany,
        subscriptionExpiry: subscriptionExpiryDate,
        subscriptionPlan,
        subscriptionAmount: Number(subscriptionAmount || 0),
        subscriptionPaymentStatus
      };

      updateCompanyEverywhere(updatedCompany);
      toast.success("Company subscription payment updated successfully");
      handleCloseSubscriptionModal();
      fetchCompaniesWithUsers();
    } catch (error) {
      console.error("Subscription update error:", error);
      toast.error(error.response?.data?.message || "Failed to update subscription date");
    } finally {
      setSubscriptionSaving(false);
    }
  };

  
  const handleEditChange = (field, value) => {
    setEditedCompany(prev => ({
      ...prev,
      [field]: value
    }));
  };

  
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  
  const handleExportCSV = () => {
    try {
      const csvRows = [];
      csvRows.push(['Company Code', 'Company Name', 'Email', 'Phone', 'Owner', 'Users', 'Status', 'Created'].join(','));
      
      filteredCompanies.forEach(company => {
        csvRows.push([
          company.companyCode || '',
          `"${company.companyName || ''}"`,
          company.companyEmail || '',
          company.companyPhone || '',
          `"${company.ownerName || ''}"`,
          company.userCount || 0,
          company.isActive ? 'Active' : 'Inactive',
          new Date(company.createdAt).toLocaleDateString()
        ].join(','));
      });
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `companies_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  
  const toggleCompanyExpansion = (companyId) => {
    setExpandedCompany(expandedCompany === companyId ? null : companyId);
  };

  
  const handleNavigateToCreateUser = (companyId, companyCode, companyName) => {
    if (companyId && companyCode) {
      navigate(`/create-user?company=${companyId}&companyCode=${companyCode}&companyName=${encodeURIComponent(companyName || '')}`);
    } else {
      toast.error("Company information is missing");
    }
  };

  
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '#2563eb';
      case 'manager': return '#7e22ce';
      case 'supervisor': return '#0891b2';
      case 'employee': return '#0a5e0a';
      default: return '#64748b';
    }
  };

  const getEntityId = (value) => {
    if (!value) return "";
    if (typeof value === "object") return value._id || value.id || "";
    return value;
  };

  const looksLikeObjectId = (value) => {
    return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
  };

  const extractList = (data, keys = []) => {
    if (Array.isArray(data)) return data;
    for (const key of keys) {
      if (Array.isArray(data?.[key])) return data[key];
    }
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.message)) return data.message;
    if (Array.isArray(data?.message?.data)) return data.message.data;
    return [];
  };

  const fetchCompanyLookups = async (companyId, headers) => {
    if (!companyId) return { departmentMap: {}, jobRoleMap: {} };

    const [departmentsRes, jobRolesRes] = await Promise.allSettled([
      axios.get(`${API_URL}/departments`, { headers, params: { company: companyId } }),
      axios.get(`${API_URL}/job-roles`, { headers, params: { company: companyId } })
    ]);

    const departments = departmentsRes.status === "fulfilled"
      ? extractList(departmentsRes.value.data, ["departments"])
      : [];
    const jobRoles = jobRolesRes.status === "fulfilled"
      ? extractList(jobRolesRes.value.data, ["jobRoles", "roles"])
      : [];

    const departmentMap = {};
    departments.forEach(dept => {
      const id = dept?._id || dept?.id;
      const name = dept?.name || dept?.departmentName || dept?.title;
      if (id && name) departmentMap[id] = name;
    });

    const jobRoleMap = {};
    jobRoles.forEach(role => {
      const id = role?._id || role?.id;
      const name = role?.name || role?.jobRoleName || role?.roleName || role?.title;
      if (id && name) jobRoleMap[id] = name;
    });

    setDepartmentNamesById(prev => ({ ...prev, ...departmentMap }));
    setJobRoleNamesById(prev => ({ ...prev, ...jobRoleMap }));

    return { departmentMap, jobRoleMap };
  };

  const enrichUsersWithLookupNames = (users, departmentMap = {}, jobRoleMap = {}) => {
    return (Array.isArray(users) ? users : []).map(user => {
      const departmentId = getEntityId(user.department || user.departmentId || user.deptId);
      const jobRoleId = getEntityId(user.jobRole || user.jobRoleId || user.companyRole || user.designation);

      return {
        ...user,
        departmentName: user.departmentName || user.deptName || departmentMap[departmentId] || departmentNamesById[departmentId],
        jobRoleName: user.jobRoleName || user.companyRoleName || user.designationName || jobRoleMap[jobRoleId] || jobRoleNamesById[jobRoleId]
      };
    });
  };

  const getUserDepartment = (user) => {
    const department = user?.department;
    if (user?.departmentName) return user.departmentName;
    if (user?.deptName) return user.deptName;
    if (department && typeof department === "object") {
      const departmentId = getEntityId(department);
      return department.name || department.departmentName || department.title || departmentNamesById[departmentId] || "Not assigned";
    }
    const departmentId = getEntityId(department || user?.departmentId || user?.deptId);
    if (departmentNamesById[departmentId]) return departmentNamesById[departmentId];
    return looksLikeObjectId(departmentId) ? "Not assigned" : departmentId || "Not assigned";
  };

  const getUserPhone = (user) => {
    return user?.mobile || user?.phone || user?.contact || user?.contactNumber || user?.phoneNumber || "N/A";
  };

  const getUserJobRole = (user) => {
    if (user?.jobRoleName) return user.jobRoleName;
    if (user?.companyRoleName) return user.companyRoleName;
    if (user?.designationName) return user.designationName;

    const jobRole = user?.jobRole || user?.jobRoleId || user?.companyRole || user?.designation || user?.employeeType;
    if (jobRole && typeof jobRole === "object") {
      const jobRoleId = getEntityId(jobRole);
      return jobRole.name || jobRole.title || jobRole.roleName || jobRoleNamesById[jobRoleId] || "N/A";
    }
    const jobRoleId = getEntityId(jobRole);
    if (jobRoleNamesById[jobRoleId]) return jobRoleNamesById[jobRoleId];
    return looksLikeObjectId(jobRoleId) ? "N/A" : jobRoleId || "N/A";
  };

  const getUserRole = (user) => {
    return user?.role || user?.userRole || "User";
  };

  
  const handleMenuOpen = (event, company) => {
    setAnchorEl(event.currentTarget);
    setSelectedAction(company);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAction(null);
  };

  const handleDeleteCompany = async (company) => {
    if (!company?._id) return;

    const confirmed = window.confirm(
      `Permanently delete "${company.companyName || 'this company'}"? This will also delete all of its users and company data. This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_URL}/company/${company._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCompanies(prev => prev.filter(item => item._id !== company._id));
      setSelectedCompanies(prev => prev.filter(id => id !== company._id));
      toast.success(response.data?.message || "Company and all related data deleted");
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error(error.response?.data?.message || "Failed to delete company");
    }
  };

  const handleAction = (action) => {
    if (selectedAction) {
      switch (action) {
        case 'edit':
          handleOpenCompanyDetails(selectedAction);
          break;
        case 'users':
          handleOpenUsersPopup(selectedAction);
          break;
        case 'status':
          handleToggleCompanyStatus(selectedAction, !selectedAction.isActive);
          break;
        case 'subscription':
          handleOpenSubscriptionModal(selectedAction);
          break;
        case 'delete':
          handleDeleteCompany(selectedAction);
          break;
        default:
          break;
      }
    }
    handleMenuClose();
  };

  const handleNotificationsOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
    setNotificationsOpen(true);
  };

  const handleNotificationsClose = () => {
    setNotificationsOpen(false);
    setNotificationAnchor(null);
  };

  
  const handleAddNewUser = (company) => {
    if (company && company._id && company.companyCode) {
      navigate(`/create-user?company=${company._id}&companyCode=${company.companyCode}&companyName=${encodeURIComponent(company.companyName || '')}`);
    } else {
      toast.error("Company information is incomplete");
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    handleNotificationsClose();
    toast.success('All notifications cleared');
  };

  
  const handleSelectCompany = (companyId) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map(c => c._id));
    }
  };

  
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.isActive).length;
  const totalUsers = companies.reduce((total, company) => total + (company.userCount || 0), 0);
  const activePercentage = totalCompanies > 0 ? Math.round((activeCompanies / totalCompanies) * 100) : 0;

  
  const getCompanyColor = (company) => {
    if (!company) return '#2563eb';
    const colors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];
    const index = (company.companyName?.length || 0) % colors.length;
    return colors[index];
  };

  
  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  
  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  
  const handleBottomNavChange = (value) => {
    setBottomNavValue(value);
    switch (value) {
      case 0:
        break;
      case 1:
        fetchCompaniesWithUsers();
        break;
      case 2:
        handleExportCSV();
        break;
      default:
        break;
    }
  };

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="AllCompany-all-company-container">
      
      <div className="AllCompany-animated-bg">
        <div className="AllCompany-bg-circle AllCompany-circle-1"></div>
        <div className="AllCompany-bg-circle AllCompany-circle-2"></div>
      </div>

      
      {isMobile && (
        <div className="AllCompany-mobile-app-bar">
          <div className="AllCompany-toolbar">
            
            <h6 className="AllCompany-app-bar-title">Companies</h6>
          </div>
        </div>
      )}

      
      

      <div className="AllCompany-responsive-container">
        
        {!isMobile && (
          <div className="AllCompany-desktop-header">
            

            <div className="AllCompany-header-content">
              <div className="AllCompany-header-left">
                <div className="AllCompany-header-icon-box">
                  <span className="material-icons AllCompany-header-icon">corporate_fare</span>
                </div>
                <div className="AllCompany-header-text">
                  <h1 className="AllCompany-header-title">Companies</h1>
                  <div className="AllCompany-header-stats">
                    <span className="AllCompany-header-subtitle">{totalCompanies} organizations • {totalUsers} total users</span>
                    <span className="AllCompany-active-chip">{activePercentage}% active</span>
                  </div>
                </div>
              </div>
              
              <div className="AllCompany-header-actions">
                <button className="AllCompany-btn-outline" onClick={fetchCompaniesWithUsers}>
                  <span className="material-icons AllCompany-btn-icon">refresh</span>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        
        <div className="AllCompany-stats-grid">
          <div className="AllCompany-stat-card">
            <div className="AllCompany-stat-card-content">
              <div>
                <span className="AllCompany-stat-label">Total Companies</span>
                <h3 className="AllCompany-stat-value">{totalCompanies}</h3>
                {!isMobile && (
                  <span className="AllCompany-stat-trend">
                    <span className="material-icons AllCompany-trend-icon">trending_up</span>
                    +12% from last month
                  </span>
                )}
              </div>
              <div className="AllCompany-stat-icon AllCompany-stat-icon-blue">
                <span className="material-icons">apartment</span>
              </div>
            </div>
          </div>

          <div className="AllCompany-stat-card">
            <div className="AllCompany-stat-card-content">
              <div>
                <span className="AllCompany-stat-label">Active Companies</span>
                <h3 className="AllCompany-stat-value">{activeCompanies}</h3>
                {!isMobile && (
                  <span className="AllCompany-stat-subtext">{activePercentage}% of total</span>
                )}
              </div>
              <div className="AllCompany-stat-icon AllCompany-stat-icon-green">
                <span className="material-icons">check_circle</span>
              </div>
            </div>
          </div>

          <div className="AllCompany-stat-card">
            <div className="AllCompany-stat-card-content">
              <div>
                <span className="AllCompany-stat-label">Total Users</span>
                <h3 className="AllCompany-stat-value">{totalUsers}</h3>
                {!isMobile && (
                  <span className="AllCompany-stat-trend AllCompany-stat-trend-purple">
                    <span className="material-icons AllCompany-trend-icon">people</span>
                    Avg 24 per company
                  </span>
                )}
              </div>
              <div className="AllCompany-stat-icon AllCompany-stat-icon-purple">
                <span className="material-icons">groups</span>
              </div>
            </div>
          </div>

          <div className="AllCompany-stat-card">
            <div className="AllCompany-stat-card-content">
              <div>
                <span className="AllCompany-stat-label">Current View</span>
                <h3 className="AllCompany-stat-value">{filteredCompanies.length}</h3>
                {!isMobile && (
                  <span className="AllCompany-stat-trend AllCompany-stat-trend-orange">
                    <span className="material-icons AllCompany-trend-icon">filter_list</span>
                    Filtered results
                  </span>
                )}
              </div>
              <div className="AllCompany-stat-icon AllCompany-stat-icon-orange">
                <span className="material-icons">filter_list</span>
              </div>
            </div>
          </div>
        </div>

        
        <div className="AllCompany-search-filter-section">
          <div className="AllCompany-search-filter-grid">
            <div className="AllCompany-search-field">
              <div className="AllCompany-search-input-container">
                <span className="material-icons AllCompany-search-icon">search</span>
                <input
                  type="text"
                  className="AllCompany-search-input"
                  placeholder={isMobile ? "Search companies..." : "Search by name, email, code or owner..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="AllCompany-clear-search" onClick={() => setSearchTerm("")}>
                    <span className="material-icons">close</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="AllCompany-filter-actions">
              <div className="AllCompany-filter-toggle">
                <button
                  className={`AllCompany-filter-btn ${filter === 'active' ? 'AllCompany-active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  Active
                </button>
                <button 
                  className={`AllCompany-filter-btn ${filter === 'inactive' ? 'AllCompany-active' : ''}`}
                  onClick={() => setFilter('inactive')}
                >
                  Inactive
                </button>
              </div>

              <button className="AllCompany-sort-btn" onClick={handleFilterMenuOpen}>
                <span className="material-icons AllCompany-sort-icon">sort</span>
                Sort by {sortBy}
                <span className="material-icons AllCompany-sort-arrow">
                  {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                </span>
              </button>

              {!isMobile && (
                <button className="AllCompany-btn-outline" onClick={handleExportCSV}>
                  <span className="material-icons AllCompany-btn-icon">download</span>
                  Export
                </button>
              )}

              {selectedCompanies.length > 0 && (
                <div className="AllCompany-selected-chip">
                  <span>{selectedCompanies.length} selected</span>
                  <button onClick={() => setSelectedCompanies([])}>
                    <span className="material-icons">close</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        
        {filteredCompanies.length === 0 ? (
          <div className="AllCompany-empty-state">
            <div className="AllCompany-empty-state-icon">
              <span className="material-icons">corporate_fare</span>
            </div>
            <h6 className="AllCompany-empty-state-title">No companies found</h6>
            <p className="AllCompany-empty-state-text">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        ) : (
          <>
            <div className="AllCompany-company-list">
              {paginatedCompanies.map((company, index) => (
                <div key={company._id} className="AllCompany-company-card">
                  <div className="AllCompany-company-card-content">
                    {/* Header Row */}
                    <div className="AllCompany-company-header">
                      <div className="AllCompany-company-badges">
                        {bulkMode && (
                          <input
                            type="checkbox"
                            className="AllCompany-company-checkbox"
                            checked={selectedCompanies.includes(company._id)}
                            onChange={() => handleSelectCompany(company._id)}
                          />
                        )}
                        <span className="AllCompany-company-code" style={{backgroundColor: `${getCompanyColor(company)}20`, color: getCompanyColor(company), borderColor: `${getCompanyColor(company)}40`}}>
                          {company.companyCode || 'N/A'}
                        </span>
                        <span className={`AllCompany-status-badge ${company.isActive ? 'AllCompany-active' : 'AllCompany-inactive'}`}>
                          <span className="material-icons AllCompany-status-icon">
                            {company.isActive ? 'check_circle' : 'cancel'}
                          </span>
                          {!isMobile && (company.isActive ? "Active" : "Inactive")}
                        </span>
                        
                        {/* Rating/Importance Indicator */}
                        {company.userCount > 50 && (
                          <span className="AllCompany-star-icon" title="High Impact Company">★</span>
                        )}
                      </div>
                      
                      <div className="AllCompany-company-actions">
                        {/* <button className="AllCompany-action-icon-btn" onClick={() => toggleCompanyExpansion(company._id)}>
                          <span className="material-icons">
                            {expandedCompany === company._id ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                          </span>
                        </button> */}
                        <button className="AllCompany-action-icon-btn" onClick={(e) => handleMenuOpen(e, company)}>
                          <span className="material-icons">more_vert</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Company Info */}
                    <div className="AllCompany-company-info-grid">
                      <div className="AllCompany-company-main-info">
                        <div className="AllCompany-company-logo-container">
                          {company.logo ? (
                            <img src={company.logo} alt={company.companyName} className="AllCompany-company-logo" />
                          ) : (
                            <div className="AllCompany-company-avatar" style={{background: `linear-gradient(135deg, ${getCompanyColor(company)} 0%, ${getCompanyColor(company)}80 100%)`}}>
                              {company.companyName?.charAt(0) || 'C'}
                            </div>
                          )}
                        </div>

                        <div className="AllCompany-company-details">
                          <h3 className="AllCompany-company-name">{company.companyName || "Unnamed Company"}</h3>
                          
                          <div className="AllCompany-company-tags">
                            <span className="AllCompany-tag AllCompany-tag-email">
                              <span className="material-icons AllCompany-tag-icon">email</span>
                              {isMobile && company.companyEmail?.length > 15 ? 
                                `${company.companyEmail?.substring(0, 12)}...` : 
                                company.companyEmail || "No email"
                              }
                            </span>
                            {company.companyPhone && !isMobile && (
                              <span className="AllCompany-tag AllCompany-tag-phone">
                                <span className="material-icons AllCompany-tag-icon">phone</span>
                                {company.companyPhone}
                              </span>
                            )}
                            {company.ownerName && !isMobile && (
                              <span className="AllCompany-tag AllCompany-tag-person">
                                <span className="material-icons AllCompany-tag-icon">person</span>
                                {company.ownerName}
                              </span>
                            )}
                          </div>

                          <div className="AllCompany-company-metrics">
                            <div className="AllCompany-metric">
                              <span className="AllCompany-metric-label">Users</span>
                              <div className="AllCompany-metric-value">
                                <span className="AllCompany-metric-number">{company.userCount || 0}</span>
                                <span className="AllCompany-metric-percent">{company.userCount > 0 ? `${Math.round((company.userCount / totalUsers) * 100)}%` : '0%'}</span>
                              </div>
                            </div>
                            {!isMobile && (
                              <>
                                <div className="AllCompany-metric-divider"></div>
                                <div className="AllCompany-metric">
                                  <span className="AllCompany-metric-label">Created</span>
                                  <div className="AllCompany-metric-value">
                                    <span className="material-icons AllCompany-calendar-icon">calendar_today</span>
                                    <span className="AllCompany-metric-text">{formatRelativeTime(company.createdAt)}</span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isMobile && (
                        <div className="AllCompany-company-stats">
                          <span className="AllCompany-stats-title">Quick Stats</span>
                          
                          <div className="AllCompany-stats-list">
                            {company.companyAddress && (
                              <div className="AllCompany-stat-item">
                                <span className="material-icons AllCompany-location-icon">location_on</span>
                                <span className="AllCompany-stat-text">
                                  {company.companyAddress?.substring(0, 40)}
                                  {company.companyAddress?.length > 40 ? '...' : ''}
                                </span>
                              </div>
                            )}
                            
                            {company.subscriptionExpiry && (
                              <div className="AllCompany-stat-item">
                                <span className="material-icons AllCompany-schedule-icon">schedule</span>
                                <span className="AllCompany-stat-text">Expires: {formatDate(company.subscriptionExpiry)}</span>
                              </div>
                            )}

                            <div className="AllCompany-stat-item">
                              <span className="material-icons AllCompany-schedule-icon">workspace_premium</span>
                              <span className="AllCompany-stat-text">
                                {getPlanName(company)} · {getSubscriptionStatus(company).label}
                              </span>
                            </div>

                            <div className="AllCompany-stat-item">
                              <span className="material-icons AllCompany-schedule-icon">payments</span>
                              <span className="AllCompany-stat-text">
                                {company.subscriptionPaymentStatus || 'unpaid'} · ₹{Number(company.subscriptionAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div className="AllCompany-company-admin-actions">
                              <button
                                className={`AllCompany-mini-action-btn ${company.isActive ? 'AllCompany-mini-warning' : 'AllCompany-mini-success'}`}
                                onClick={() => handleToggleCompanyStatus(company, !company.isActive)}
                                disabled={statusSavingId === company._id}
                              >
                                <span className="material-icons">{company.isActive ? 'block' : 'check_circle'}</span>
                                {statusSavingId === company._id ? 'Saving...' : company.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                className="AllCompany-mini-action-btn AllCompany-mini-primary"
                                onClick={() => handleOpenSubscriptionModal(company)}
                              >
                                <span className="material-icons">event_available</span>
                                Upgrade / Renew
                              </button>
                            </div>

                            <div className="AllCompany-stat-item AllCompany-activity-item">
                              <span className="material-icons AllCompany-activity-icon">auto_graph</span>
                              <div className="AllCompany-activity-progress">
                                <div className="AllCompany-activity-header">
                                  <span className="AllCompany-activity-label">Activity</span>
                                  <span className="AllCompany-activity-value">High</span>
                                </div>
                                <div className="AllCompany-progress-bar">
                                  <div className="AllCompany-progress-fill AllCompany-activity-fill" style={{width: `${Math.min((company.userCount || 0) * 2, 100)}%`}}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile Metrics Row */}
                    {isMobile && (
                      <div className="AllCompany-mobile-metrics">
                        <div className="AllCompany-mobile-metric">
                          <span className="material-icons AllCompany-mobile-icon AllCompany-location-icon">location_on</span>
                          <span className="AllCompany-mobile-text">{company.companyAddress?.substring(0, 30) || "No address"}</span>
                        </div>
                        {company.subscriptionExpiry && (
                          <div className="AllCompany-mobile-metric">
                            <span className="material-icons AllCompany-mobile-icon AllCompany-schedule-icon">schedule</span>
                            <span className="AllCompany-mobile-text">{formatDate(company.subscriptionExpiry)}</span>
                          </div>
                        )}
                        <div className="AllCompany-mobile-metric">
                          <span className="material-icons AllCompany-mobile-icon AllCompany-schedule-icon">workspace_premium</span>
                          <span className="AllCompany-mobile-text">{getPlanName(company)} · {getSubscriptionStatus(company).label}</span>
                        </div>
                      </div>
                    )}

                    {/* Team Section */}
                    <div className="AllCompany-team-section">
                      <div className="AllCompany-team-header">
                        <div className="AllCompany-team-title">
                          <div className="AllCompany-team-icon-box">
                            <span className="material-icons AllCompany-team-icon">groups</span>
                          </div>
                          <span className="AllCompany-team-label">Team Members</span>
                          <span className="AllCompany-team-count">{company.userCount || 0}</span>
                        </div>
                        
                        <div className="AllCompany-team-actions">
                          {(company.userCount || 0) > 0 && (
                            <button className="AllCompany-view-all-btn" onClick={() => handleOpenUsersPopup(company)}>
                              {isMobile ? 'View' : 'View All'}
                              <span className="material-icons AllCompany-view-all-icon">chevron_right</span>
                            </button>
                          )}
                          <button className="AllCompany-add-member-btn" onClick={() => handleAddNewUser(company)} title="Add Team Member">
                            <span className="material-icons">person_add</span>
                          </button>
                        </div>
                      </div>

                      {company.userCount > 0 ? (
                        <div className="AllCompany-team-grid">
                          {(expandedCompany === company._id
                            ? (company.users || [])
                            : (company.users || []).slice(0, isMobile ? 2 : 4)
                          ).map((user, idx) => (
                            <div key={idx} className="AllCompany-team-member-card">
                              <div className="AllCompany-team-member-content">
                                <div className="AllCompany-member-avatar-container">
                                  <div className="AllCompany-member-avatar" style={{background: `linear-gradient(135deg, ${getRoleColor(getUserRole(user))} 0%, ${getRoleColor(getUserRole(user))}80 100%)`}}>
                                    {user.name?.charAt(0) || 'U'}
                                  </div>
                                  <span className={`AllCompany-member-status ${user.isActive !== false ? 'AllCompany-active' : 'AllCompany-inactive'}`}></span>
                                </div>
                                <div className="AllCompany-member-info">
                                  <span className="AllCompany-member-name">{user.name || "User"}</span>
                                  <span className="AllCompany-member-role" style={{color: getRoleColor(getUserRole(user))}}>{getUserRole(user)}</span>
                                  <span className="AllCompany-member-meta">{getUserDepartment(user)}</span>
                                  <span className="AllCompany-member-meta">{getUserPhone(user)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="AllCompany-empty-team">
                          <span className="material-icons AllCompany-empty-team-icon">person_add</span>
                          <span className="AllCompany-empty-team-text">No team members yet</span>
                        </div>
                      )}
                      {(company.userCount || 0) > (isMobile ? 2 : 4) && (
                        <button className="AllCompany-show-more-users-btn" onClick={() => toggleCompanyExpansion(company._id)}>
                          <span>{expandedCompany === company._id ? "Show less users" : `Show all ${company.userCount} users`}</span>
                          <span className="material-icons">
                            {expandedCompany === company._id ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredCompanies.length > 0 && (
              <div className="AllCompany-pagination-container">
                <div className="AllCompany-pagination-info">
                  Showing {Math.min((page - 1) * itemsPerPage + 1, filteredCompanies.length)} - {Math.min(page * itemsPerPage, filteredCompanies.length)} of {filteredCompanies.length} companies
                </div>
                <div className="AllCompany-pagination-controls">
                  {Array.from({ length: Math.ceil(filteredCompanies.length / itemsPerPage) }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`AllCompany-pagination-btn ${pageNum === page ? 'AllCompany-active' : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="AllCompany-bottom-nav">
          <button 
            className={`AllCompany-bottom-nav-item ${bottomNavValue === 0 ? 'AllCompany-active' : ''}`}
            onClick={() => handleBottomNavChange(0)}
          >
            <span className="material-icons AllCompany-bottom-nav-icon">corporate_fare</span>
            <span className="AllCompany-bottom-nav-label">Companies</span>
          </button>
          <button 
            className={`AllCompany-bottom-nav-item ${bottomNavValue === 1 ? 'AllCompany-active' : ''}`}
            onClick={() => handleBottomNavChange(1)}
          >
            <span className="material-icons AllCompany-bottom-nav-icon">refresh</span>
            <span className="AllCompany-bottom-nav-label">Refresh</span>
          </button>
          <button 
            className={`AllCompany-bottom-nav-item ${bottomNavValue === 2 ? 'AllCompany-active' : ''}`}
            onClick={() => handleBottomNavChange(2)}
          >
            <span className="material-icons AllCompany-bottom-nav-icon">download</span>
            <span className="AllCompany-bottom-nav-label">Export</span>
          </button>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <div className="AllCompany-fab-container">
          <button className="AllCompany-fab-main">
            <span className="material-icons AllCompany-fab-icon">add</span>
          </button>
          <div className="AllCompany-fab-actions">
            <button className="AllCompany-fab-action AllCompany-fab-green" onClick={() => {
              if (companies.length > 0) {
                handleAddNewUser(companies[0]);
              } else {
                toast.info('Please create a company first');
              }
            }} title="Add User">
              <span className="material-icons">person_add</span>
            </button>
            <button className="AllCompany-fab-action AllCompany-fab-purple" onClick={fetchCompaniesWithUsers} title="Refresh">
              <span className="material-icons">refresh</span>
            </button>
            <button className="AllCompany-fab-action AllCompany-fab-orange" onClick={handleExportCSV} title="Export">
              <span className="material-icons">download</span>
            </button>
          </div>
        </div>
      )}

      {/* Company Details Dialog */}
      {companyDetailsPopupOpen && (
        <div className="AllCompany-modal-overlay" onClick={handleCloseCompanyDetails}>
          <div className={`AllCompany-modal-content ${isMobile ? 'AllCompany-modal-fullscreen' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="AllCompany-modal-header">
              <div className="AllCompany-modal-header-left">
                <div className="AllCompany-modal-logo">
                  <div className="AllCompany-modal-avatar" style={{background: `linear-gradient(135deg, ${getCompanyColor(selectedCompany)} 0%, ${getCompanyColor(selectedCompany)}80 100%)`}}>
                    {selectedCompany?.companyName?.charAt(0) || 'C'}
                  </div>
                </div>
                <div className="AllCompany-modal-title">
                  <h3 className="AllCompany-modal-company-name">{selectedCompany?.companyName}</h3>
                  <div className="AllCompany-modal-badges">
                    <span className="AllCompany-company-code-small">{selectedCompany?.companyCode}</span>
                    <span className={`AllCompany-status-badge-small ${selectedCompany?.isActive ? 'AllCompany-active' : 'AllCompany-inactive'}`}>
                      {selectedCompany?.isActive ? <span className="material-icons AllCompany-status-icon-small">check_circle</span> : <span className="material-icons AllCompany-status-icon-small">cancel</span>}
                      {selectedCompany?.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="AllCompany-modal-header-actions">
                {!editMode ? (
                  <button className="AllCompany-btn-primary AllCompany-btn-small" onClick={() => setEditMode(true)}>
                    <span className="material-icons AllCompany-btn-icon">edit</span>
                    Edit
                  </button>
                ) : (
                  <>
                    <button className="AllCompany-btn-outline AllCompany-btn-small" onClick={() => { 
                      setEditMode(false); 
                      setEditedCompany(companyDetails); 
                    }}>
                      Cancel
                    </button>
                    <button className="AllCompany-btn-primary AllCompany-btn-small" onClick={handleUpdateCompany}>
                      Save Changes
                    </button>
                  </>
                )}
                <button className="AllCompany-icon-btn AllCompany-close-btn" onClick={handleCloseCompanyDetails}>
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>

            <div className="AllCompany-modal-body">
              {companyDetailsLoading ? (
                <div className="AllCompany-loading-state">
                  <div className="AllCompany-spinner"></div>
                  <p>Loading company details...</p>
                </div>
              ) : companyDetails ? (
                <div className="AllCompany-company-details-grid">
                  <div className="AllCompany-detail-card">
                    <p className="AllCompany-detail-description">{companyDetails.description || "No description provided."}</p>
                  </div>

                  <div className="AllCompany-details-row">
                    <div className="AllCompany-details-column">
                      <h4 className="AllCompany-details-section-title">Basic Information</h4>
                      <div className="AllCompany-details-card">
                        <div className="AllCompany-detail-item">
                          <span className="AllCompany-detail-label">Company Name</span>
                          {editMode ? (
                            <input 
                              type="text"
                              className="AllCompany-detail-input"
                              value={editedCompany?.companyName || ''} 
                              onChange={(e) => handleEditChange('companyName', e.target.value)}
                            />
                          ) : (
                            <span className="AllCompany-detail-value">{companyDetails.companyName}</span>
                          )}
                        </div>
                        
                        <div className="AllCompany-detail-item">
                          <span className="AllCompany-detail-label">Company Code</span>
                          {editMode ? (
                            <input 
                              type="text"
                              className="AllCompany-detail-input"
                              value={editedCompany?.companyCode || ''} 
                              onChange={(e) => handleEditChange('companyCode', e.target.value)}
                            />
                          ) : (
                            <span className="AllCompany-detail-value">{companyDetails.companyCode}</span>
                          )}
                        </div>
                        
                        <div className="AllCompany-detail-item">
                          <span className="AllCompany-detail-label">Owner Name</span>
                          {editMode ? (
                            <input 
                              type="text"
                              className="AllCompany-detail-input"
                              value={editedCompany?.ownerName || ''} 
                              onChange={(e) => handleEditChange('ownerName', e.target.value)}
                            />
                          ) : (
                            <span className="AllCompany-detail-value">{companyDetails.ownerName || "Not specified"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="AllCompany-details-column">
                      <h4 className="AllCompany-details-section-title">Contact Information</h4>
                      <div className="AllCompany-details-card">
                        <div className="AllCompany-detail-item">
                          <span className="AllCompany-detail-label">Email Address</span>
                          {editMode ? (
                            <input 
                              type="email"
                              className="AllCompany-detail-input"
                              value={editedCompany?.companyEmail || ''} 
                              onChange={(e) => handleEditChange('companyEmail', e.target.value)}
                            />
                          ) : (
                            <span className="AllCompany-detail-value">{companyDetails.companyEmail || "Not provided"}</span>
                          )}
                        </div>
                        
                        <div className="AllCompany-detail-item">
                          <span className="AllCompany-detail-label">Phone Number</span>
                          {editMode ? (
                            <input 
                              type="tel"
                              className="AllCompany-detail-input"
                              value={editedCompany?.companyPhone || ''} 
                              onChange={(e) => handleEditChange('companyPhone', e.target.value)}
                            />
                          ) : (
                            <span className="AllCompany-detail-value">{companyDetails.companyPhone || "Not provided"}</span>
                          )}
                        </div>
                        
                        <div className="AllCompany-detail-item">
                          <span className="AllCompany-detail-label">Domain</span>
                          {editMode ? (
                            <input 
                              type="text"
                              className="AllCompany-detail-input"
                              value={editedCompany?.companyDomain || ''} 
                              onChange={(e) => handleEditChange('companyDomain', e.target.value)}
                            />
                          ) : (
                            <span className="AllCompany-detail-value">{companyDetails.companyDomain || "Not specified"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Section - Full Width */}
                  <div className="AllCompany-details-full-width">
                    <h4 className="AllCompany-details-section-title">Address</h4>
                    <div className="AllCompany-details-card">
                      {editMode ? (
                        <textarea
                          className="AllCompany-detail-textarea"
                          rows="3"
                          value={editedCompany?.companyAddress || ''}
                          onChange={(e) => handleEditChange('companyAddress', e.target.value)}
                          placeholder="Enter full address"
                        />
                      ) : (
                        <span className="AllCompany-detail-value">{companyDetails.companyAddress || "No address provided"}</span>
                      )}
                    </div>
                  </div>

                  {/* System Information Section */}
                  <div className="AllCompany-details-full-width">
                    <h4 className="AllCompany-details-section-title">System Information</h4>
                    <div className="AllCompany-system-info-grid">
                      <div className="AllCompany-system-info-card">
                        <span className="material-icons AllCompany-system-icon">storage</span>
                        <span className="AllCompany-system-label">Database ID</span>
                        <span className="AllCompany-system-value">{companyDetails.dbIdentifier || "N/A"}</span>
                      </div>
                      <div className="AllCompany-system-info-card">
                        <span className="material-icons AllCompany-system-icon">schedule</span>
                        <span className="AllCompany-system-label">Subscription</span>
                        {editMode ? (
                          <input
                            type="date"
                            className="AllCompany-detail-input AllCompany-date-input"
                            value={toDateInputValue(editedCompany?.subscriptionExpiry)}
                            onChange={(e) => handleEditChange('subscriptionExpiry', e.target.value)}
                          />
                        ) : (
                          <span className="AllCompany-system-value">{formatDate(companyDetails.subscriptionExpiry)}</span>
                        )}
                      </div>
                      <div className="AllCompany-system-info-card">
                        <span className="material-icons AllCompany-system-icon">workspace_premium</span>
                        <span className="AllCompany-system-label">Plan</span>
                        <span className="AllCompany-system-value">
                          {getPlanName(companyDetails)} · ₹{Number(companyDetails.subscriptionAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="AllCompany-system-info-card">
                        <span className="material-icons AllCompany-system-icon">verified</span>
                        <span className="AllCompany-system-label">Subscription Status</span>
                        <span className="AllCompany-system-value">{getSubscriptionStatus(companyDetails).label}</span>
                      </div>
                      <div className="AllCompany-system-info-card">
                        <span className="material-icons AllCompany-system-icon">toggle_on</span>
                        <span className="AllCompany-system-label">Status</span>
                        {editMode ? (
                          <select
                            className="AllCompany-detail-input AllCompany-status-select"
                            value={editedCompany?.isActive === false ? 'inactive' : 'active'}
                            onChange={(e) => handleEditChange('isActive', e.target.value === 'active')}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <span className={`AllCompany-status-badge-small ${companyDetails.isActive ? 'AllCompany-active' : 'AllCompany-inactive'}`}>
                            {companyDetails.isActive ? "Active" : "Inactive"}
                          </span>
                        )}
                      </div>
                      <div className="AllCompany-system-info-card">
                        <span className="material-icons AllCompany-system-icon">calendar_today</span>
                        <span className="AllCompany-system-label">Created</span>
                        <span className="AllCompany-system-value">{formatDate(companyDetails.createdAt)}</span>
                      </div>
                      <div className="AllCompany-system-info-card">
                        <span className="material-icons AllCompany-system-icon">auto_graph</span>
                        <span className="AllCompany-system-label">Last Updated</span>
                        <span className="AllCompany-system-value">{formatDate(companyDetails.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="AllCompany-error-alert">
                  <span className="material-icons AllCompany-error-icon">error</span>
                  <div>
                    <h4 className="AllCompany-error-title">Error</h4>
                    <p className="AllCompany-error-message">Company details could not be loaded</p>
                  </div>
                </div>
              )}
            </div>

            <div className="AllCompany-modal-footer">
              <button className="AllCompany-btn-outline" onClick={handleCloseCompanyDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Dialog */}
      {subscriptionModalOpen && (
        <div className="AllCompany-modal-overlay" onClick={handleCloseSubscriptionModal}>
          <div className="AllCompany-subscription-modal" onClick={e => e.stopPropagation()}>
            <div className="AllCompany-modal-header">
              <div className="AllCompany-modal-header-left">
                <div className="AllCompany-modal-avatar-small" style={{background: `linear-gradient(135deg, ${getCompanyColor(subscriptionCompany)} 0%, ${getCompanyColor(subscriptionCompany)}80 100%)`}}>
                  <span className="material-icons">event_available</span>
                </div>
                <div className="AllCompany-modal-title">
                  <h3 className="AllCompany-modal-company-name">Upgrade / Renew Plan</h3>
                  <div className="AllCompany-modal-subtitle">
                    <span>{subscriptionCompany?.companyName}</span>
                  </div>
                </div>
              </div>
              <button className="AllCompany-icon-btn AllCompany-close-btn" onClick={handleCloseSubscriptionModal}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="AllCompany-modal-body">
              <div className="AllCompany-subscription-current">
                <span className="material-icons">schedule</span>
                <div>
                  <span>Current expiry</span>
                  <strong>{formatDate(subscriptionCompany?.subscriptionExpiry)}</strong>
                </div>
              </div>

              <div className="AllCompany-subscription-current">
                <span className="material-icons">workspace_premium</span>
                <div>
                  <span>Current plan</span>
                  <strong>{getPlanName(subscriptionCompany)} · {getSubscriptionStatus(subscriptionCompany).label}</strong>
                </div>
              </div>

              <label className="AllCompany-subscription-label" htmlFor="subscriptionExpiryDate">
                New expiry date
              </label>
              <input
                id="subscriptionExpiryDate"
                type="date"
                className="AllCompany-detail-input"
                value={subscriptionExpiryDate}
                onChange={(e) => setSubscriptionExpiryDate(e.target.value)}
              />

              <div className="AllCompany-subscription-presets">
                <button type="button" onClick={() => setSubscriptionExpiryDate(getDateAfterDays(30))}>+30 days</button>
                <button type="button" onClick={() => setSubscriptionExpiryDate(getDateAfterDays(90))}>+90 days</button>
                <button type="button" onClick={() => setSubscriptionExpiryDate(getDateAfterDays(365))}>+1 year</button>
              </div>

              <div className="AllCompany-subscription-form-grid">
                <div className="AllCompany-subscription-field">
                  <label className="AllCompany-subscription-label" htmlFor="subscriptionPlan">Plan</label>
                  <select
                    id="subscriptionPlan"
                    className="AllCompany-detail-input"
                    value={subscriptionPlanId}
                    onChange={(e) => handleSubscriptionPlanChange(e.target.value)}
                  >
                    <option value="">Select plan</option>
                    {plans.filter(plan => plan.isActive !== false).map(plan => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} - ₹{Number(plan.price || 0).toLocaleString('en-IN')} / {plan.durationDays} days
                      </option>
                    ))}
                  </select>
                </div>
                <div className="AllCompany-subscription-field">
                  <label className="AllCompany-subscription-label" htmlFor="subscriptionAmount">Amount</label>
                  <input
                    id="subscriptionAmount"
                    type="number"
                    min="0"
                    className="AllCompany-detail-input"
                    value={subscriptionAmount}
                    onChange={(e) => setSubscriptionAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="AllCompany-subscription-field">
                  <label className="AllCompany-subscription-label" htmlFor="subscriptionPaymentStatus">Payment Status</label>
                  <select
                    id="subscriptionPaymentStatus"
                    className="AllCompany-detail-input"
                    value={subscriptionPaymentStatus}
                    onChange={(e) => setSubscriptionPaymentStatus(e.target.value)}
                  >
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="waived">Waived</option>
                  </select>
                </div>
                <div className="AllCompany-subscription-field">
                  <label className="AllCompany-subscription-label" htmlFor="subscriptionPaymentMode">Payment Mode</label>
                  <select
                    id="subscriptionPaymentMode"
                    className="AllCompany-detail-input"
                    value={subscriptionPaymentMode}
                    onChange={(e) => setSubscriptionPaymentMode(e.target.value)}
                  >
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="AllCompany-subscription-field">
                  <label className="AllCompany-subscription-label" htmlFor="subscriptionPaymentDate">Payment Date</label>
                  <input
                    id="subscriptionPaymentDate"
                    type="date"
                    className="AllCompany-detail-input"
                    value={subscriptionPaymentDate}
                    onChange={(e) => setSubscriptionPaymentDate(e.target.value)}
                  />
                </div>
                <div className="AllCompany-subscription-field">
                  <label className="AllCompany-subscription-label" htmlFor="subscriptionTransactionId">Transaction ID</label>
                  <input
                    id="subscriptionTransactionId"
                    type="text"
                    className="AllCompany-detail-input"
                    value={subscriptionTransactionId}
                    onChange={(e) => setSubscriptionTransactionId(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <label className="AllCompany-subscription-toggle">
                <input
                  type="checkbox"
                  checked={subscriptionActivateCompany}
                  onChange={(e) => setSubscriptionActivateCompany(e.target.checked)}
                />
                <span>Keep company active after saving</span>
              </label>

              <label className="AllCompany-subscription-label" htmlFor="subscriptionNotes">
                Notes
              </label>
              <textarea
                id="subscriptionNotes"
                className="AllCompany-detail-textarea AllCompany-subscription-notes"
                rows="3"
                value={subscriptionNotes}
                onChange={(e) => setSubscriptionNotes(e.target.value)}
                placeholder="Payment or renewal notes"
              />
            </div>

            <div className="AllCompany-modal-footer">
              <button className="AllCompany-btn-outline" onClick={handleCloseSubscriptionModal}>
                Cancel
              </button>
              <button
                className="AllCompany-btn-primary"
                onClick={handleSaveSubscriptionDate}
                disabled={subscriptionSaving}
              >
                {subscriptionSaving ? "Saving..." : "Save Date"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Dialog */}
      {usersPopupOpen && (
        <div className="AllCompany-modal-overlay" onClick={handleCloseUsersPopup}>
          <div className={`AllCompany-modal-content ${isMobile ? 'AllCompany-modal-fullscreen' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="AllCompany-modal-header">
              <div className="AllCompany-modal-header-left">
                <div className="AllCompany-modal-avatar-small" style={{background: `linear-gradient(135deg, ${getCompanyColor(selectedCompany)} 0%, ${getCompanyColor(selectedCompany)}80 100%)`}}>
                  <span className="material-icons">groups</span>
                </div>
                <div className="AllCompany-modal-title">
                  <h3 className="AllCompany-modal-company-name">{selectedCompany?.companyName}</h3>
                  <div className="AllCompany-modal-subtitle">
                    <span>{companyUsers.length} team members</span>
                    <span className="AllCompany-active-percent">{companyUsers.length > 0 ? `${Math.round((companyUsers.filter(u => u.isActive !== false).length / companyUsers.length) * 100)}% active` : '0% active'}</span>
                  </div>
                </div>
              </div>
              <button className="AllCompany-icon-btn AllCompany-close-btn" onClick={handleCloseUsersPopup}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="AllCompany-modal-body">
              {usersLoading ? (
                <div className="AllCompany-loading-state">
                  <div className="AllCompany-spinner"></div>
                  <p>Loading team members...</p>
                </div>
              ) : companyUsers.length > 0 ? (
                <div className="AllCompany-users-table-container">
                  <table className="AllCompany-users-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Job Role</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyUsers.map((user, index) => (
                        <tr key={user._id || user.id || index}>
                          <td>
                            <div className="AllCompany-user-cell">
                              <div className="AllCompany-user-avatar" style={{background: `linear-gradient(135deg, ${getRoleColor(getUserRole(user))} 0%, ${getRoleColor(getUserRole(user))}80 100%)`}}>
                                {user.name?.charAt(0) || 'U'}
                              </div>
                              <div className="AllCompany-user-primary-info">
                                <span className="AllCompany-user-name">{user.name || "User"}</span>
                                <span className="AllCompany-user-id">{user.employeeId || user.empId || user.userCode || ""}</span>
                              </div>
                            </div>
                          </td>
                          <td>{getUserPhone(user)}</td>
                          <td>{user.email || "N/A"}</td>
                          <td>
                            <span className="AllCompany-info-chip">{getUserDepartment(user)}</span>
                          </td>
                          <td>{getUserJobRole(user)}</td>
                          <td>
                            <span className="AllCompany-role-badge" style={{color: getRoleColor(getUserRole(user))}}>
                              {getUserRole(user)}
                            </span>
                          </td>
                          <td>
                            <span className={`AllCompany-status-badge-small ${user.isActive !== false ? 'AllCompany-active' : 'AllCompany-inactive'}`}>
                              {user.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="AllCompany-empty-users-state">
                  <div className="AllCompany-empty-users-icon">
                    <span className="material-icons">person_add</span>
                  </div>
                  <h6 className="AllCompany-empty-users-title">No team members yet</h6>
                  <p className="AllCompany-empty-users-text">Start building your team by adding members</p>
                  <button className="AllCompany-btn-primary" onClick={() => {
                    handleCloseUsersPopup();
                    handleAddNewUser(selectedCompany);
                  }}>
                    <span className="material-icons AllCompany-btn-icon">person_add</span>
                    Add Team Member
                  </button>
                </div>
              )}
            </div>

            {companyUsers.length > 0 && (
              <div className="AllCompany-modal-footer">
                <button className="AllCompany-btn-outline" onClick={handleCloseUsersPopup}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Popover */}
      {notificationsOpen && (
        <div className="AllCompany-popover-overlay" onClick={handleNotificationsClose}>
          <div className="AllCompany-popover-content" onClick={e => e.stopPropagation()}>
            <div className="AllCompany-popover-header">
              <h6 className="AllCompany-popover-title">Notifications</h6>
              {notifications.length > 0 && (
                <button className="AllCompany-clear-all-btn" onClick={clearAllNotifications}>
                  Clear All
                </button>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="AllCompany-notifications-list">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`AllCompany-notification-item ${notification.read ? '' : 'AllCompany-unread'}`}>
                    <div className="AllCompany-notification-avatar" style={{
                      background: notification.type === 'registration' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                 notification.type === 'subscription' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                 notification.type === 'alert' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                                 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    }}>
                      <span className="material-icons">
                        {notification.type === 'registration' ? 'business' :
                         notification.type === 'subscription' ? 'schedule' :
                         notification.type === 'alert' ? 'info' : 'person'}
                      </span>
                    </div>
                    <div className="AllCompany-notification-content">
                      <p className="AllCompany-notification-message">{notification.message}</p>
                      <div className="AllCompany-notification-time">
                        <span className="material-icons AllCompany-time-icon">schedule</span>
                        <span>{notification.time}</span>
                      </div>
                    </div>
                    {!notification.read && (
                      <button className="AllCompany-mark-read-btn" onClick={() => markNotificationAsRead(notification.id)}>
                        <span className="material-icons">check_circle</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="AllCompany-empty-notifications">
                <span className="material-icons AllCompany-empty-notifications-icon">notifications_none</span>
                <p className="AllCompany-empty-notifications-title">No notifications</p>
                <p className="AllCompany-empty-notifications-text">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}

      
      {anchorEl && (
        <div className="AllCompany-menu-overlay" onClick={handleMenuClose}>
          <div className="AllCompany-menu-content" style={{top: anchorEl.getBoundingClientRect().bottom, left: anchorEl.getBoundingClientRect().left}}>
            <button className="AllCompany-menu-item" onClick={() => handleAction('edit')}>
              <span className="material-icons AllCompany-menu-icon" style={{color: '#2563eb'}}>edit</span>
              <span>Edit Company</span>
            </button>
            <button className="AllCompany-menu-item" onClick={() => handleAction('users')}>
              <span className="material-icons AllCompany-menu-icon" style={{color: '#8b5cf6'}}>groups</span>
              <span>View Users</span>
            </button>
            <button className="AllCompany-menu-item" onClick={() => handleAction('subscription')}>
              <span className="material-icons AllCompany-menu-icon" style={{color: '#2563eb'}}>event_available</span>
              <span>Upgrade / Renew Plan</span>
            </button>
            <hr className="AllCompany-menu-divider" />
            <button className="AllCompany-menu-item" onClick={() => handleAction('status')}>
              <span className="material-icons AllCompany-menu-icon" style={{color: selectedAction?.isActive ? '#f59e0b' : '#10b981'}}>
                {selectedAction?.isActive ? 'block' : 'check_circle'}
              </span>
              <span>{selectedAction?.isActive ? 'Deactivate' : 'Activate'}</span>
            </button>
            <button className="AllCompany-menu-item" onClick={() => handleAction('delete')} style={{color: '#ef4444'}}>
              <span className="material-icons AllCompany-menu-icon" style={{color: '#ef4444'}}>delete</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      
      {filterMenuAnchor && (
        <div className="AllCompany-menu-overlay" onClick={handleFilterMenuClose}>
          <div className="AllCompany-menu-content" style={{top: filterMenuAnchor.getBoundingClientRect().bottom, left: filterMenuAnchor.getBoundingClientRect().left}}>
            <div className="AllCompany-menu-section">
              <span className="AllCompany-menu-section-title">Sort By</span>
            </div>
            <button className="AllCompany-menu-item" onClick={() => { setSortBy('name'); handleFilterMenuClose(); }}>
              <span>Company Name</span>
              {sortBy === 'name' && <span className="material-icons AllCompany-check-icon">check_circle</span>}
            </button>
            <button className="AllCompany-menu-item" onClick={() => { setSortBy('users'); handleFilterMenuClose(); }}>
              <span>User Count</span>
              {sortBy === 'users' && <span className="material-icons AllCompany-check-icon">check_circle</span>}
            </button>
            <button className="AllCompany-menu-item" onClick={() => { setSortBy('date'); handleFilterMenuClose(); }}>
              <span>Created Date</span>
              {sortBy === 'date' && <span className="material-icons AllCompany-check-icon">check_circle</span>}
            </button>
            <hr className="AllCompany-menu-divider" />
            <button className="AllCompany-menu-item" onClick={() => { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); handleFilterMenuClose(); }}>
              <span className="material-icons AllCompany-menu-icon" style={{color: '#2563eb'}}>
                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCompany;
