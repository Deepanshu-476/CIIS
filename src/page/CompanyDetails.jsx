import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config";
import {
  Business,
  Email,
  Phone,
  LocationOn,
  Person,
  CalendarToday,
  CheckCircle,
  Cancel,
  Edit,
  Refresh,
  ArrowBack,
  Security,
  Domain,
  Link,
  Image,
  Storage,
  Settings,
  People,
  ListAlt,
  Close,
  Save,
  Delete,
  Code
} from "@mui/icons-material";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Box,
  LinearProgress,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Switch,
  FormControlLabel,
  Alert
} from "@mui/material";

const CompanyDetails = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    departments: 0,
    todayLogins: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [userRole, setUserRole] = useState("");
  
  // Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    isActive: true
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Fetch the company for the current logged-in user.
  const fetchCurrentUserCompany = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please login to view company details");
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Step 1: Fetch data from the company users API.
      try {
        const response = await axios.get(
          `${API_URL}/users/company-users`,
          { headers }
        );
        
        console.log("Full API Response:", response.data);
        
        if (response.data && response.data.success) {
          const data = response.data.message;
          
          // Debug: Check what data we're getting
          console.log("Company data from API:", data.company);
          console.log("Users data from API:", data.users);
          console.log("Current user data:", data.currentUser);
          
          // Extract company ID properly
          let companyId = "";
          let companyDetails = {};
          
          // Multiple ways to get company ID
          if (data.company?.id?._id) {
            companyId = data.company.id._id;
            companyDetails = data.company.id;
          } else if (data.company?._id) {
            companyId = data.company._id;
            companyDetails = data.company;
          } else if (data.company?.id) {
            companyId = data.company.id;
            companyDetails = data.company;
          } else if (data.users && data.users.length > 0 && data.users[0].company) {
            // Try to get from first user's company data
            companyId = data.users[0].company._id || data.users[0].company.id;
            companyDetails = data.users[0].company;
          }
          
          if (!companyId) {
            console.error("Company ID not found in response");
            toast.error("Company information not found in API response");
            await fetchCompanyFromLocalStorage(headers);
            return;
          }
          
          // Build company data object
          const companyData = {
            _id: companyId,
            companyName: companyDetails.name || data.company?.name || "Company",
            companyCode: companyDetails.companyCode || data.company?.companyCode || "",
            logo: companyDetails.logo || data.company?.logo || "",
            isActive: companyDetails.isActive ?? data.company?.isActive ?? true,
            companyEmail: companyDetails.email || data.company?.email || companyDetails.companyEmail || "ciisnetwork@gmail.com",
            companyPhone: companyDetails.phone || data.company?.phone || companyDetails.companyPhone || "8340185442",
            companyAddress: companyDetails.address || data.company?.address || companyDetails.companyAddress || "123 Example Street",
            companyDomain: companyDetails.domain || data.company?.domain || "gmail.com",
            ownerName: companyDetails.ownerName || data.company?.ownerName || "company",
            loginUrl: companyDetails.loginUrl || data.company?.loginUrl || `/company/${companyDetails.companyCode || "COMPANY"}/login`,
            dbIdentifier: companyDetails.dbIdentifier || data.company?.dbIdentifier || `company_${companyId}`,
            createdAt: companyDetails.createdAt || data.company?.createdAt || new Date().toISOString(),
            updatedAt: companyDetails.updatedAt || data.company?.updatedAt || new Date().toISOString(),
            subscriptionExpiry: companyDetails.subscriptionExpiry || data.company?.subscriptionExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          
          console.log("Final company data:", companyData);
          
          setCompany(companyData);
          
          // Users data
          const users = data.users || [];
          console.log("Total users fetched:", users.length);
          
          setRecentUsers(users.slice(0, 5)); // First 5 users for recent
          
          // Extract unique departments
          const uniqueDepartments = [...new Set(users.map(user => user.department).filter(Boolean))];
          setDepartments(uniqueDepartments);
          
          // Calculate statistics
          const activeUsers = users.filter(user => user.isActive).length;
          const deptCount = new Set(users.map(user => user.department)).size;
          
          setStats({
            totalUsers: data.count || users.length,
            activeUsers,
            departments: deptCount,
            todayLogins: 0
          });
          
          // Set user role from current user
          if (data.currentUser) {
            setUserRole(data.currentUser.name || data.currentUser.role || "user");
          }
          
          // Store in localStorage for future use
          localStorage.setItem("company", JSON.stringify(companyData));
          
          // Also store company code if available
          if (companyData.companyCode) {
            localStorage.setItem("companyCode", companyData.companyCode);
          }
          
          return;
        }
      } catch (apiError) {
        console.error("Company users API failed:", apiError);
        console.log("API Error details:", apiError.response?.data);
        // Fallback: Try to get company from localStorage
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
    }
  };

  // Alternative method: Fetch company details directly
  const fetchCompanyDirectly = async (headers) => {
    try {
      // Try to get company ID from localStorage first
      const storedCompany = localStorage.getItem("company");
      if (storedCompany) {
        const companyInfo = JSON.parse(storedCompany);
        const companyId = companyInfo._id;
        
        if (companyId) {
          // Fetch company details directly
          const companyRes = await axios.get(
            `${API_URL}/super-admin/company/${companyId}`,
            { headers }
          );
          
          if (companyRes.data) {
            const companyData = companyRes.data;
            setCompany({
              _id: companyData._id,
              companyName: companyData.companyName || companyData.name,
              companyCode: companyData.companyCode,
              logo: companyData.logo,
              isActive: companyData.isActive,
              companyEmail: companyData.companyEmail,
              companyPhone: companyData.companyPhone,
              companyAddress: companyData.companyAddress,
              companyDomain: companyData.companyDomain,
              ownerName: companyData.ownerName,
              loginUrl: companyData.loginUrl,
              dbIdentifier: companyData.dbIdentifier,
              createdAt: companyData.createdAt,
              updatedAt: companyData.updatedAt,
              subscriptionExpiry: companyData.subscriptionExpiry
            });
            
            // Then fetch users
            await fetchCompanyUsers(companyData._id, headers);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Error fetching company directly:", error);
      return false;
    }
  };

  // Fetch company users separately
  const fetchCompanyUsers = async (companyId, headers) => {
    try {
      const usersRes = await axios.get(
        `${API_URL}/super-admin/company/${companyId}/users`,
        { headers }
      );
      
      const users = usersRes.data || [];
      setRecentUsers(users.slice(0, 5));
      
      // Extract unique departments
      const uniqueDepartments = [...new Set(users.map(user => user.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
      
      const activeUsers = users.filter(user => user.isActive).length;
      const deptCount = new Set(users.map(user => user.department)).size;
      
      setStats({
        totalUsers: users.length,
        activeUsers,
        departments: deptCount,
        todayLogins: 0
      });
      
    } catch (usersError) {
      console.error("Error fetching users:", usersError);
    }
  };

  // Fallback method
  const fetchCompanyFromLocalStorage = async (headers) => {
    try {
      const companyData = localStorage.getItem("company");
      if (companyData) {
        const companyInfo = JSON.parse(companyData);
        
        console.log("Company from localStorage:", companyInfo);
        
        // Set default values if missing
        const fullCompanyData = {
          ...companyInfo,
          companyName: companyInfo.companyName || companyInfo.name || "Company",
          companyCode: companyInfo.companyCode || "",
          companyEmail: companyInfo.companyEmail || "ciisnetwork@gmail.com",
          companyPhone: companyInfo.companyPhone || "8340185442",
          companyAddress: companyInfo.companyAddress || "123 Example Street",
          companyDomain: companyInfo.companyDomain || "gmail.com",
          ownerName: companyInfo.ownerName || "company",
          loginUrl: companyInfo.loginUrl || "/company/CIISNE/login",
          dbIdentifier: companyInfo.dbIdentifier || "company_1770057695345_h1bxxgl",
          createdAt: companyInfo.createdAt || "2026-02-03T12:11:00.000Z",
          updatedAt: companyInfo.updatedAt || "2026-02-03T12:11:00.000Z",
          subscriptionExpiry: companyInfo.subscriptionExpiry || "2026-03-05T12:11:00.000Z",
          logo: companyInfo.logo || "https://cds.ciisnetwork.in/logoo.png"
        };
        
        setCompany(fullCompanyData);
        
        // Try to fetch users using company ID
        if (fullCompanyData._id) {
          await fetchCompanyUsers(fullCompanyData._id, headers);
        } else {
          toast.error("Company ID not found in localStorage");
        }
      } else {
        toast.error("Company data not found in localStorage");
        
        // Try direct fetch as last resort
        const fetched = await fetchCompanyDirectly(headers);
        if (!fetched) {
          // Create dummy company data for testing
          const dummyCompany = {
            _id: "dummy_company_id",
            companyName: "Test Company",
            companyCode: "TEST001",
            logo: "https://cds.ciisnetwork.in/logoo.png",
            isActive: true,
            companyEmail: "test@company.com",
            companyPhone: "9876543210",
            companyAddress: "Test Address, Test City",
            companyDomain: "company.com",
            ownerName: "Test Owner",
            loginUrl: "/company/TEST001/login",
            dbIdentifier: "company_dummy_001",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          setCompany(dummyCompany);
          localStorage.setItem("company", JSON.stringify(dummyCompany));
        }
      }
    } catch (error) {
      console.error("Error in fallback method:", error);
      toast.error("Failed to load company details");
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Days remaining calculation
  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 27; // Default
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      return 27; // Default
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchCurrentUserCompany();
  };

  // Handle user edit - Open modal with user data
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      department: user.department || "",
      isActive: user.isActive ?? true,
      phone: user.phone || "",
      designation: user.designation || ""
    });
    setEditModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      // Determine which API to use based on your backend
      const userId = selectedUser.id || selectedUser._id;
      
      // Update user API call - adjust endpoint as needed
      const response = await axios.put(
        `${API_URL}/users/${userId}`,
        editFormData,
        { headers }
      );
      
      if (response.data.success) {
        toast.success("User updated successfully!");
        
        // Update local state
        const updatedUsers = recentUsers.map(user => 
          (user.id === userId || user._id === userId) 
            ? { ...user, ...editFormData }
            : user
        );
        setRecentUsers(updatedUsers);
        
        // Update stats
        const activeUsers = updatedUsers.filter(user => user.isActive).length;
        setStats(prev => ({
          ...prev,
          activeUsers
        }));
        
        setEditModalOpen(false);
      } else {
        toast.error(response.data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser || !window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const userId = selectedUser.id || selectedUser._id;
      
      const response = await axios.delete(
        `${API_URL}/users/${userId}`,
        { headers }
      );
      
      if (response.data.success) {
        toast.success("User deleted successfully!");
        
        // Remove user from list
        const filteredUsers = recentUsers.filter(user => 
          user.id !== userId && user._id !== userId
        );
        setRecentUsers(filteredUsers);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalUsers: prev.totalUsers - 1,
          activeUsers: filteredUsers.filter(user => user.isActive).length
        }));
        
        setEditModalOpen(false);
      } else {
        toast.error(response.data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
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

  // Initial load
  useEffect(() => {
    fetchCurrentUserCompany();
  }, []);

  if (loading) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3, color: 'primary.main' }} />
        <Typography variant="h6" color="textSecondary">
          Loading company details...
        </Typography>
      </Box>
    );
  }

  if (!company) {
    return (
      <Box sx={styles.errorContainer}>
        <Typography variant="h6" color="error" gutterBottom>
          Company details not found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/Ciis-network/SuperAdminDashboard")}
          startIcon={<ArrowBack />}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const daysRemaining = getDaysRemaining(company.subscriptionExpiry);

  return (
    <Box sx={styles.container}>
      {/* Header */}
      <Box sx={styles.header}>
        <Box sx={styles.headerContent}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={styles.backButton}
          >
            Back
          </Button>
          
          <Box sx={styles.headerTitle}>
            <Business sx={styles.headerIcon} />
            <Typography variant="h4" sx={styles.title}>
              {company.companyName} - Company Details
            </Typography>
          </Box>
          
          <Button
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={styles.refreshButton}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Company Info */}
        <Grid item xs={12} md={8}>
          {/* Company Profile Card */}
          <Card sx={styles.profileCard}>
            <CardContent>
              <Box sx={styles.profileHeader}>
                <Avatar
                  src={company.logo}
                  sx={styles.companyLogo}
                  alt={company.companyName}
                >
                  {company.companyName?.charAt(0) || 'C'}
                </Avatar>
                
                <Box sx={styles.profileInfo}>
                  <Typography variant="h5" gutterBottom>
                    {company.companyName}
                  </Typography>
                  
                  <Box sx={styles.statusContainer}>
                    <Chip
                      icon={company.isActive ? <CheckCircle /> : <Cancel />}
                      label={company.isActive ? "Active" : "Inactive"}
                      color={company.isActive ? "success" : "error"}
                      sx={styles.statusChip}
                    />
                    
                    {company.companyCode && (
                      <Chip
                        icon={<Code />}
                        label={`Code: ${company.companyCode}`}
                        variant="outlined"
                        color="primary"
                        sx={styles.codeChip}
                      />
                    )}
                    
                    {!company.companyCode && (
                      <Chip
                        icon={<Code />}
                        label="Code: Not Available"
                        variant="outlined"
                        color="warning"
                        sx={styles.codeChip}
                      />
                    )}
                  </Box>
                  
                  {/* Debug Info - Remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                      Company ID: {company._id}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Company Details Grid */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <Code sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Company Code
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {company.companyCode || "Not Available"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <Email sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {company.companyEmail}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <Phone sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {company.companyPhone || "Not provided"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <LocationOn sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {company.companyAddress || "Not provided"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <Person sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Owner
                      </Typography>
                      <Typography variant="body1">
                        {company.ownerName}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <Domain sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Domain
                      </Typography>
                      <Typography variant="body1">
                        {company.companyDomain || "Not specified"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <Link sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Login URL
                      </Typography>
                      <Typography variant="body1" sx={styles.urlText}>
                        {window.location.origin}{company.loginUrl}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <Storage sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Database Identifier
                      </Typography>
                      <Typography variant="body1" sx={styles.dbText}>
                        {company.dbIdentifier}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.detailItem}>
                    <Image sx={styles.detailIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Logo URL
                      </Typography>
                      <Typography variant="body1" sx={styles.urlText}>
                        {company.logo || "Not provided"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Dates Section */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={styles.dateItem}>
                    <CalendarToday sx={styles.dateIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Created On
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(company.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={styles.dateItem}>
                    <CalendarToday sx={styles.dateIcon} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(company.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={styles.subscriptionCard}>
                    <Box sx={styles.subscriptionHeader}>
                      <Security sx={styles.subscriptionIcon} />
                      <Typography variant="h6">
                        Subscription Status
                      </Typography>
                    </Box>
                    
                    <Box sx={styles.subscriptionDetails}>
                      <Typography variant="body1" gutterBottom>
                        Expires on: {formatDate(company.subscriptionExpiry)}
                      </Typography>
                      
                      <Box sx={styles.daysRemaining}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: daysRemaining > 30 ? 'success.main' : 
                                  daysRemaining > 7 ? 'warning.main' : 'error.main'
                          }}
                        >
                          {daysRemaining}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          days remaining
                        </Typography>
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((daysRemaining / 30) * 100, 100)}
                        sx={{ 
                          mt: 2,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: daysRemaining > 30 ? 'success.main' : 
                                           daysRemaining > 7 ? 'warning.main' : 'error.main'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Stats and Actions */}
        <Grid item xs={12} md={4}>
          {/* Stats Card */}
          <Card sx={styles.statsCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={styles.statsTitle}>
                Company Statistics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={styles.statItem}>
                    <Typography variant="h4" sx={styles.statNumber}>
                      {stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Users
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={styles.statItem}>
                    <Typography variant="h4" sx={{...styles.statNumber, color: 'success.main'}}>
                      {stats.activeUsers}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active Users
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={styles.statItem}>
                    <Typography variant="h4" sx={styles.statNumber}>
                      {stats.departments}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Departments
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={styles.statItem}>
                    <Typography variant="h4" sx={{...styles.statNumber, color: 'info.main'}}>
                      {stats.todayLogins}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Today's Logins
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Users Card - Updated with edit functionality */}
          <Card sx={styles.usersCard}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={styles.usersTitle}>
                  Recent Users ({recentUsers.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<ListAlt />}
                  onClick={handleViewAllUsers}
                  variant="outlined"
                  disabled={!company._id}
                >
                  View All
                </Button>
              </Box>
              
              {recentUsers.length > 0 ? (
                <Box sx={styles.usersList}>
                  {recentUsers.map((user, index) => (
                    <Box 
                      key={user.id || user._id || index} 
                      sx={styles.userItem}
                      onClick={() => handleEditUser(user)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Avatar sx={styles.userAvatar}>
                        {user.name?.charAt(0) || 'U'}
                      </Avatar>
                      
                      <Box sx={styles.userInfo}>
                        <Typography variant="body2" sx={styles.userName}>
                          {user.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {user.role || 'User'} • {user.department || 'No Dept'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'error'}
                          sx={styles.userStatus}
                        />
                        <Edit fontSize="small" color="action" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={styles.noUsers}>
                  <People sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                  <Typography variant="body2" color="textSecondary" align="center">
                    No users found
                  </Typography>
                </Box>
              )}
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate(`/Ciis-network/create-user?company=${company._id}&companyCode=${company.companyCode}`)}
                sx={{ mt: 2 }}
                startIcon={<Person />}
                disabled={!company._id}
              >
                Add New User
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit User Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={styles.modalTitle}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person />
            Edit User Details
          </Box>
          <IconButton
            aria-label="close"
            onClick={() => setEditModalOpen(false)}
            sx={styles.closeButton}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedUser && (
            <Box sx={styles.modalContent}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Editing user: <strong>{selectedUser.name}</strong>
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={editFormData.email}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    type="email"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={editFormData.role}
                      onChange={handleInputChange}
                      label="Role"
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="supervisor">Supervisor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={editFormData.department}
                      onChange={handleInputChange}
                      label="Department"
                    >
                      <MenuItem value="">Select Department</MenuItem>
                      {departments.map((dept, index) => (
                        <MenuItem key={index} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                      <MenuItem value="new">+ Add New Department</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Designation"
                    name="designation"
                    value={editFormData.designation}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editFormData.isActive}
                        onChange={handleInputChange}
                        name="isActive"
                        color="primary"
                      />
                    }
                    label="Active User"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={styles.modalActions}>
          <Button
            onClick={() => setEditModalOpen(false)}
            color="inherit"
            disabled={saveLoading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleDeleteUser}
            color="error"
            startIcon={<Delete />}
            disabled={saveLoading}
          >
            Delete
          </Button>
          
          <Button
            onClick={handleSaveUser}
            variant="contained"
            startIcon={<Save />}
            disabled={saveLoading}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Updated Styles
const styles = {
  container: {
    p: 3,
    bgcolor: 'background.default',
    minHeight: '100vh'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: 2
  },
  header: {
    mb: 4,
    bgcolor: 'white',
    borderRadius: 2,
    boxShadow: 1,
    p: 2
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    color: 'text.secondary'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 2
  },
  headerIcon: {
    fontSize: 32,
    color: 'primary.main'
  },
  title: {
    fontWeight: 600,
    color: 'text.primary'
  },
  refreshButton: {
    color: 'primary.main'
  },
  profileCard: {
    borderRadius: 2,
    boxShadow: 3,
    mb: 3
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    mb: 3
  },
  companyLogo: {
    width: 100,
    height: 100,
    fontSize: 40,
    bgcolor: 'primary.main'
  },
  profileInfo: {
    flex: 1
  },
  statusContainer: {
    display: 'flex',
    gap: 2,
    mt: 1,
    flexWrap: 'wrap'
  },
  statusChip: {
    fontWeight: 600
  },
  codeChip: {
    fontWeight: 500,
    '& .MuiChip-icon': {
      fontSize: '16px !important'
    }
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 2,
    bgcolor: 'grey.50',
    borderRadius: 1,
    mb: 2
  },
  detailIcon: {
    color: 'primary.main',
    fontSize: 24
  },
  urlText: {
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    wordBreak: 'break-all'
  },
  dbText: {
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    color: 'text.secondary'
  },
  dateItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 2,
    bgcolor: 'grey.50',
    borderRadius: 1
  },
  dateIcon: {
    color: 'secondary.main',
    fontSize: 24
  },
  subscriptionCard: {
    p: 3,
    bgcolor: 'primary.50',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'primary.100'
  },
  subscriptionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    mb: 3
  },
  subscriptionIcon: {
    color: 'primary.main',
    fontSize: 28
  },
  subscriptionDetails: {
    textAlign: 'center'
  },
  daysRemaining: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    my: 2
  },
  statsCard: {
    borderRadius: 2,
    boxShadow: 2,
    mb: 3
  },
  statsTitle: {
    fontWeight: 600,
    color: 'text.primary',
    borderBottom: '2px solid',
    borderColor: 'primary.main',
    pb: 1
  },
  statItem: {
    textAlign: 'center',
    p: 2,
    bgcolor: 'grey.50',
    borderRadius: 1
  },
  statNumber: {
    fontWeight: 700,
    color: 'primary.main'
  },
  usersCard: {
    borderRadius: 2,
    boxShadow: 2,
    mb: 3
  },
  usersTitle: {
    fontWeight: 600,
    color: 'text.primary',
    borderBottom: '2px solid',
    borderColor: 'secondary.main',
    pb: 1
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 2,
    bgcolor: 'grey.50',
    borderRadius: 1,
    transition: 'all 0.2s',
    '&:hover': {
      bgcolor: 'grey.100',
      transform: 'translateY(-2px)',
      boxShadow: 1
    }
  },
  userAvatar: {
    width: 40,
    height: 40,
    bgcolor: 'secondary.main'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontWeight: 600
  },
  userStatus: {
    fontSize: '0.75rem'
  },
  noUsers: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    py: 4
  },
  // Modal Styles
  modalTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    bgcolor: 'primary.50',
    borderBottom: '1px solid',
    borderColor: 'primary.100'
  },
  closeButton: {
    color: 'text.secondary'
  },
  modalContent: {
    pt: 2
  },
  modalActions: {
    p: 3,
    borderTop: '1px solid',
    borderColor: 'grey.200'
  }
};

export default CompanyDetails;
