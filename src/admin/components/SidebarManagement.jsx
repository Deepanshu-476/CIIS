import React, { useState, useEffect } from 'react';
import axios from "../../utils/axiosConfig";
import axiosInstance from "../../utils/axiosConfig";
import Swal from 'sweetalert2';
import './SidebarManagement.css';
import CIISLoader from '../../Loader/CIISLoader';

// Your routes configuration
const APP_ROUTES = [
  { path: 'emp-details', name: 'Employee Details', icon: 'Person', category: 'administration' },
  { path: 'emp-leaves', name: 'Employee Leaves', icon: 'EventNote', category: 'administration' },
  { path: 'emp-assets', name: 'Employee Assets', icon: 'Computer', category: 'administration' },
  { path: 'emp-attendance', name: 'Employee Attendance', icon: 'CalendarToday', category: 'administration' },
  { path: 'admin-task-create', name: 'Admin Create Task', icon: 'Task', category: 'administration' },
  { path: 'create-user', name: 'Create User', icon: 'PersonAdd', category: 'administration' },
  { path: 'admin-meeting', name: 'Create Employee Meeting', icon: 'MeetingRoom', category: 'meetings' },
  { path: 'adminproject', name: 'Admin Projects', icon: 'ProjectIcon', category: 'projects' },
  { path: 'company-all-task', name: 'Company All Tasks', icon: 'ListAlt', category: 'tasks' },
  // { path: 'department-all-task', name: 'Department All Tasks', icon: 'ListAlt', category: 'tasks' },
  { path: 'emp-client', name: 'Client Management', icon: 'ClientIcon', category: 'clients' },
  { path: 'ClienDashboard', name: 'Client Dashboard', icon: 'ClientIcon', category: 'clients' },
  { path: 'alert', name: 'Alerts', icon: 'Notifications', category: 'communication' },
  { path: 'attendance', name: 'My Attendance', icon: 'CalendarToday', category: 'main' },
  { path: 'my-assets', name: 'My Assets', icon: 'Computer', category: 'main' },
  { path: 'my-leaves', name: 'My Leaves', icon: 'EventNote', category: 'main' },
  { path: 'user-dashboard', name: 'Dashboard', icon: 'Dashboard', category: 'main' },
  { path: 'project', name: 'Projects', icon: 'Groups', category: 'projects' },
  { path: 'task-management', name: 'Create Task', icon: 'Task', category: 'tasks' },
  { path: 'employee-meeting', name: 'Employee Meeting', icon: 'VideoCall', category: 'meetings' },
  { path: 'client-meeting', name: 'Client Meeting', icon: 'VideoCall', category: 'meetings' },
  { path: 'change-password', name: 'Change Password', icon: 'Key', category: 'main' },
  { path: 'create-alert' , name: 'Create Alert', icon: 'Notifications', category: 'communication' },
  { path: 'chat', name: 'Chat', icon: 'Chat', category: 'communication' },
];

// Helper function to get icon component as HTML string
const getIconHtml = (iconName) => {
  const icons = {
    Dashboard: '📊',
    CalendarToday: '📅',
    EventNote: '📝',
    Computer: '💻',
    Task: '✅',
    Groups: '👥',
    Notifications: '🔔',
    VideoCall: '📹',
    Person: '👤',
    ClientIcon: '🤝',
    ListAlt: '📋',
    MeetingRoom: '🚪',
    ProjectIcon: '📁',
    PersonAdd: '➕👤',
    Key: '🔑',
    Menu: '☰',
    Settings: '⚙️',
    MenuBook: '📚',
    FolderSpecial: '📂',
    Assignment: '📄',
    Work: '💼',
    People: '👥',
    Forum: '💬',
    Chat: '💬',
    Analytics: '📊',
    Receipt: '🧾',
    Assessment: '📈',
    Business: '🏢',
    Apartment: '🏛️',
    Security: '🔒',
    Search: '🔍',
    ExpandMore: '▼',
    ExpandLess: '▲',
    Add: '+',
    Edit: '✏️',
    Delete: '🗑️',
    Save: '💾',
    Refresh: '🔄',
    CheckCircle: '✓',
    Cancel: '✗',
    Info: 'ℹ️',
    ArrowBack: '←',
    ArrowForward: '→',
    Code: '</>'
  };
  return icons[iconName] || '📌';
};

const SidebarManagement = () => {
  // State for responsive design
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 960);
  const [pageLoading, setPageLoading] = useState(true);

  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [companyRoles, setCompanyRoles] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState({
    companies: false,
    departments: false,
    roles: false,
    saving: false,
    fetching: false
  });
  const [availablePages, setAvailablePages] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [existingConfigs, setExistingConfigs] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  
  // 🔥 FIXED: Modal state management - single modal at a time
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'preview', 'delete', 'addRole', etc.
    data: null
  });
  
  const [customRoles, setCustomRoles] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  // 🔥 NEW: Auto-dismiss snackbar after 5 seconds
  useEffect(() => {
    let timer;
    if (snackbar.open) {
      timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [snackbar.open]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
      setIsTablet(window.innerWidth < 960);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 NEW: Handle Escape key press to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && modalState.isOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [modalState.isOpen]);

  // 🔥 NEW: Prevent body scroll when modal is open
  useEffect(() => {
    if (modalState.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalState.isOpen]);

  // Get company from localStorage
  const getCompanyFromLocalStorage = () => {
    try {
      const companyDetailsStr = localStorage.getItem('company');
      
      if (companyDetailsStr) {
        const companyData = JSON.parse(companyDetailsStr);
        console.log('✅ Company details found:', companyData);
        
        return {
          _id: companyData._id,
          companyName: companyData.companyName,
          companyCode: companyData.companyCode,
          companyEmail: companyData.companyEmail,
          companyPhone: companyData.companyPhone,
          companyAddress: companyData.companyAddress,
          isActive: companyData.isActive,
          logo: companyData.logo,
          ownerName: companyData.ownerName,
          subscriptionExpiry: companyData.subscriptionExpiry,
          createdAt: companyData.createdAt,
          updatedAt: companyData.updatedAt,
          dbIdentifier: companyData.dbIdentifier,
          loginUrl: companyData.loginUrl
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting company from localStorage:', error);
      return null;
    }
  };

  // Initialize pages
  useEffect(() => {
    initializePages();
    initializeCompanyFromLocalStorage();
  }, []);

  const initializePages = () => {
    const pages = APP_ROUTES.map(route => ({
      id: route.path,
      name: route.name,
      path: `/ciisUser/${route.path}`,
      icon: route.icon,
      category: route.category,
      description: `Access: ${route.category === 'administration' ? 'Admin Only' : 'All Users'}`
    }));
    setAvailablePages(pages);
  };

  // Initialize company from localStorage
  const initializeCompanyFromLocalStorage = async () => {
    try {
      setPageLoading(true);
      const companyFromStorage = getCompanyFromLocalStorage();
      
      if (companyFromStorage && companyFromStorage._id) {
        console.log('🎯 Company ID found:', companyFromStorage._id);
        setCompany(companyFromStorage);
        
        await fetchDepartments(companyFromStorage._id);
        await fetchCompanyRoles(companyFromStorage._id);
        await fetchExistingConfigs(companyFromStorage._id);
        
        setSnackbar({
          open: true,
          message: `Loaded company: ${companyFromStorage.companyName}`,
          severity: 'success'
        });
        
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      } else {
        console.log('❌ No company found in localStorage');
        setPageLoading(false);
      }
    } catch (error) {
      console.error('Error initializing company:', error);
      setPageLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async (companyId) => {
    try {
      setLoading(prev => ({ ...prev, departments: true }));
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`/departments?company=${companyId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success && response.data.departments) {
        const formattedDepartments = response.data.departments.map(dept => ({
          _id: dept._id || dept.id,
          name: dept.name || dept.departmentName,
          description: dept.description || ''
        }));
        setDepartments(formattedDepartments);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    } finally {
      setLoading(prev => ({ ...prev, departments: false }));
    }
  };

  // Fetch job roles when department is selected
  useEffect(() => {
    if (selectedDepartment) {
      fetchJobRoles(selectedDepartment);
    } else {
      setJobRoles([]);
      setSelectedRole('');
    }
  }, [selectedDepartment]);

  const fetchJobRoles = async (departmentId) => {
    try {
      setLoading(prev => ({ ...prev, roles: true }));
      
      const deptId = typeof departmentId === 'object' ? departmentId._id || departmentId.id : departmentId;
      
      if (!deptId) {
        console.error('Invalid department ID:', departmentId);
        setJobRoles([]);
        return;
      }

      const token = localStorage.getItem('token');
      
      try {
        const response = await axiosInstance.get(`/job-roles/department/${deptId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && response.data.success && response.data.jobRoles) {
          const formattedRoles = response.data.jobRoles.map(role => ({
            _id: role._id,
            name: role.name,
            description: role.description || role.name
          }));
          setJobRoles(formattedRoles);
          return;
        }
      } catch (apiError) {
        console.log('Job roles API failed:', apiError.message);
      }
      
      setJobRoles([]);
      
    } catch (error) {
      console.error('Error fetching job roles:', error);
      setJobRoles([]);
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  };

  const fetchCompanyRoles = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`/job-roles`, {
        params: { company: companyId },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let roles = [];
      if (response.data?.jobRoles && Array.isArray(response.data.jobRoles)) {
        roles = response.data.jobRoles;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        roles = response.data.data;
      } else if (Array.isArray(response.data)) {
        roles = response.data;
      }

      setCompanyRoles(roles.map(role => ({
        _id: role._id || role.id,
        name: role.name || role.roleName || role.role || 'Role',
        description: role.description || role.roleName || role.name || ''
      })));
    } catch (error) {
      console.error('Error fetching company roles:', error);
      setCompanyRoles([]);
    }
  };

  // Fetch existing configurations with null handling
  const fetchExistingConfigs = async (companyId) => {
    try {
      setLoading(prev => ({ ...prev, fetching: true }));
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching existing configs for company:', companyId);
      
      const response = await axiosInstance.get(`/sidebar`, {
        params: { companyId },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📦 Sidebar API Response:', response.data);
      
      if (response.data && response.data.success) {
        let configs = [];
        
        if (response.data.data && Array.isArray(response.data.data)) {
          configs = response.data.data;
        } else if (Array.isArray(response.data)) {
          configs = response.data;
        }
        
        console.log(`✅ Found ${configs.length} configurations`);
        setExistingConfigs(configs);
      } else {
        setExistingConfigs([]);
      }
    } catch (error) {
      console.error('❌ Error fetching configs:', error);
      setExistingConfigs([]);
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  };

  // Get department name with null check
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'No Department';
    
    if (typeof departmentId === 'object' && departmentId !== null) {
      return departmentId.name || departmentId.departmentName || 'Department';
    }
    
    const department = departments.find(d => d._id === departmentId);
    if (department) return department.name;
    
    return 'Department';
  };

  // Get role name by ID with better null handling and direct role access
  const getRoleNameById = (roleId) => {
    if (!roleId) return 'No Role';
    
    if (typeof roleId === 'object' && roleId !== null) {
      if (roleId.name) return roleId.name;
      if (roleId.roleName) return roleId.roleName;
      if (roleId.role) return roleId.role;
    }
    
    const jobRole = [...jobRoles, ...companyRoles].find(r => r._id === roleId);
    if (jobRole) return jobRole.name;
    
    const customRole = customRoles.find(r => r._id === roleId);
    if (customRole) return customRole.name;
    
    const config = existingConfigs.find(c => c.role === roleId);
    if (config) {
      if (config.roleName) return config.roleName;
      
      if (config.role && typeof config.role === 'object' && config.role.name) {
        return config.role.name;
      }
      
      if (typeof roleId === 'string') {
        if (roleId.startsWith('custom_')) {
          return roleId.replace('custom_', 'Custom ');
        }
        return roleId;
      }
    }
    
    if (typeof roleId === 'string') {
      return roleId;
    }
    
    return 'Role';
  };

  // Handle department selection
  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedRole('');
    setSelectedItems([]);
    setJobRoles([]);
    setActiveStep(1);
    setShowDepartmentDropdown(false);
    
    const dept = departments.find(d => d._id === departmentId);
    if (dept) {
      setDepartmentSearch(dept.name);
    }
  };

  // Handle role selection
  const handleRoleChange = (roleId) => {
    if (roleId === 'custom') {
      handleAddRole();
      return;
    }
    setSelectedRole(roleId);
    setActiveStep(2);
    setShowRoleDropdown(false);
    
    const allRoles = getAllAvailableRoles();
    const role = allRoles.find(r => r._id === roleId);
    if (role) {
      setRoleSearch(role.name);
    }
    
    if (company && company._id && selectedDepartment && roleId) {
      loadExistingConfig(company._id, selectedDepartment, roleId);
    } else {
      setSelectedItems([]);
    }
  };

  // Load existing configuration
  const loadExistingConfig = async (companyId, departmentId, roleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`/sidebar/config`, {
        params: { 
          companyId, 
          departmentId, 
          role: roleId 
        },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success && response.data.data) {
        setSelectedItems(response.data.data.menuItems.map(item => item.id));
      } else {
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Error loading existing config:', error);
      setSelectedItems([]);
    }
  };

  // Edit existing configuration
  const handleEdit = async (config) => {
    try {
      const departmentId = typeof config.departmentId === 'object' 
        ? config.departmentId._id 
        : config.departmentId;
      
      const roleId = config.role;
      
      setSelectedDepartment(departmentId);
      setSelectedRole(roleId);
      setSelectedItems(config.menuItems.map(item => item.id));
      setActiveTab(0);
      setActiveStep(2);
      
      setSnackbar({
        open: true,
        message: 'Loaded configuration for role',
        severity: 'success'
      });
      
      setTimeout(() => {
        if (departmentId) {
          fetchJobRoles(departmentId);
        }
      }, 100);
      
    } catch (error) {
      console.error('Error in handleEdit:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load configuration',
        severity: 'error'
      });
    }
  };

  // Handle menu item selection
  const handleMenuItemToggle = (pageId) => {
    setSelectedItems(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  // Select all items in category
  const handleSelectAllCategory = (category) => {
    const categoryPages = availablePages.filter(page => page.category === category);
    const categoryIds = categoryPages.map(page => page.id);
    
    setSelectedItems(prev => {
      const allSelected = categoryIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !categoryIds.includes(id));
      } else {
        return [...new Set([...prev, ...categoryIds])];
      }
    });
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Group pages by category
  const groupedPages = availablePages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {});

  // Save configuration
  const handleSave = async () => {
    if (!company || !company._id || !selectedDepartment || !selectedRole) {
      setSnackbar({
        open: true,
        message: 'Please select department and role',
        severity: 'warning'
      });
      return;
    }

    if (selectedItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one menu item',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, saving: true }));
      const token = localStorage.getItem('token');
      
      const configData = {
        companyId: company._id,
        departmentId: selectedDepartment,
        role: selectedRole,
        menuItems: selectedItems.map(id => {
          const page = availablePages.find(p => p.id === id);
          return {
            id: page.id,
            name: page.name,
            icon: page.icon,
            path: page.path,
            category: page.category
          };
        })
      };

      console.log('Saving config data:', configData);

      const checkResponse = await axiosInstance.get(`/sidebar/config`, {
        params: { 
          companyId: company._id, 
          departmentId: selectedDepartment, 
          role: selectedRole 
        },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let response;
      if (checkResponse.data && checkResponse.data.success && checkResponse.data.data) {
        response = await axiosInstance.put(`/sidebar/${checkResponse.data.data._id}`, configData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.post('/sidebar', configData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      console.log('Save response:', response.data);

      if (response.data.success) {
        await fetchExistingConfigs(company._id);
        
        setSnackbar({
          open: true,
          message: response.data.message || 'Configuration saved successfully!',
          severity: 'success'
        });
        
        await loadExistingConfig(company._id, selectedDepartment, selectedRole);
      } else {
        throw new Error(response.data.message || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      
      let errorMessage = 'Failed to save configuration';
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  // 🔥 FIXED: Delete configuration with modal
  const handleDelete = (configId) => {
    setModalState({
      isOpen: true,
      type: 'delete',
      data: configId
    });
  };

  // 🔥 FIXED: Confirm delete
  const confirmDelete = async () => {
    if (!modalState.data) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.delete(`/sidebar/${modalState.data}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        await fetchExistingConfigs(company._id);
        
        setSnackbar({
          open: true,
          message: 'Configuration deleted successfully',
          severity: 'success'
        });
        
        closeModal();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete configuration',
        severity: 'error'
      });
      closeModal();
    }
  };

  // Refresh job roles manually
  const handleRefreshRoles = async () => {
    if (selectedDepartment) {
      await fetchJobRoles(selectedDepartment);
      setSnackbar({
        open: true,
        message: 'Roles refreshed successfully',
        severity: 'success'
      });
    }
  };

  // 🔥 FIXED: Preview configuration
  const handlePreview = (config) => {
    setModalState({
      isOpen: true,
      type: 'preview',
      data: config
    });
  };

  // 🔥 FIXED: Add custom role with modal
  const handleAddRole = () => {
    setModalState({
      isOpen: true,
      type: 'addRole',
      data: null
    });
  };

  // 🔥 FIXED: Confirm add custom role
  const confirmAddRole = (roleName) => {
    if (!roleName) return;
    
    const allRoles = getAllAvailableRoles();
    const roleExists = allRoles.some(role => 
      role.name.toLowerCase() === roleName.toLowerCase()
    );
    
    if (roleExists) {
      setSnackbar({
        open: true,
        message: 'Role already exists!',
        severity: 'error'
      });
      return;
    }
    
    const newRoleName = roleName.toUpperCase();
    const newRole = {
      _id: `custom_${Date.now()}`,
      name: newRoleName,
      description: `${newRoleName} (Custom)`,
      isCustom: true
    };
    
    setCustomRoles(prev => [...prev, newRole]);
    
    setSelectedRole(newRole._id);
    setActiveStep(2);
    
    setSnackbar({
      open: true,
      message: `Custom role "${newRoleName}" added successfully`,
      severity: 'success'
    });
    
    closeModal();
  };

  // 🔥 FIXED: Close modal function
  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      data: null
    });
  };

  // Get all available roles for dropdown
  const getAllAvailableRoles = () => {
    const allRolesList = [...jobRoles, ...customRoles];
    return allRolesList.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(dept => {
    const searchLower = departmentSearch.toLowerCase();
    return dept.name.toLowerCase().includes(searchLower) ||
           (dept.description && dept.description.toLowerCase().includes(searchLower));
  });

  // Filter roles based on search
  const filteredRoles = getAllAvailableRoles().filter(role => {
    const searchLower = roleSearch.toLowerCase();
    return role.name.toLowerCase().includes(searchLower) ||
           (role.description && role.description.toLowerCase().includes(searchLower));
  });

  // Get category display name
  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      'main': 'Main Menu',
      'tasks': 'Tasks',
      'projects': 'Projects',
      'meetings': 'Meetings',
      'administration': 'Administration',
      'settings': 'Settings',
      'communication': 'Communication',
      'clients': 'Clients',
      'supperAdmin': 'Super Admin',
    };
    return categoryNames[category] || category;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get progress percentage
  const getProgressPercentage = () => {
    let steps = 0;
    if (company) steps++;
    if (selectedDepartment) steps++;
    if (selectedRole) steps++;
    if (selectedItems.length > 0) steps++;
    return (steps / 4) * 100;
  };

  // Show CIISLoader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className={`SidebarManagement-container ${isMobile ? 'SidebarManagement-mobile' : ''}`}>
      {/* Header */}
      <div className="SidebarManagement-header-paper">
        <div className="SidebarManagement-header-bg-effect SidebarManagement-header-bg-effect-1"></div>
        <div className="SidebarManagement-header-bg-effect SidebarManagement-header-bg-effect-2"></div>
        
        <div className="SidebarManagement-header-content">
          <div className="SidebarManagement-header-avatar">
            <span className="SidebarManagement-header-avatar-icon">📚</span>
          </div>
          <div className="SidebarManagement-header-text">
            <h1 className={`SidebarManagement-header-title ${isMobile ? 'SidebarManagement-header-title-mobile' : ''}`}>
              Sidebar Menu Configuration
            </h1>
            <p className="SidebarManagement-header-subtitle">
              Configure custom sidebar menus for different departments and roles
            </p>
          </div>
        </div>
      </div>

      {/* Current Company Display */}
      {company ? (
        <div className="SidebarManagement-company-paper">
          <div className="SidebarManagement-company-grid">
            <div className="SidebarManagement-company-item">
              <div className="SidebarManagement-company-icon-bg SidebarManagement-company-icon-bg-primary">
                <span className="SidebarManagement-company-icon">🏢</span>
              </div>
              <div className="SidebarManagement-company-info">
                <span className="SidebarManagement-company-label">Company</span>
                <span className="SidebarManagement-company-value">{company.companyName}</span>
              </div>
            </div>
            
            <div className="SidebarManagement-company-item">
              <div className="SidebarManagement-company-icon-bg SidebarManagement-company-icon-bg-secondary">
                <span className="SidebarManagement-company-icon">{getIconHtml('Code')}</span>
              </div>
              <div className="SidebarManagement-company-info">
                <span className="SidebarManagement-company-label">Company Code</span>
                <span className="SidebarManagement-company-value">{company.companyCode}</span>
              </div>
            </div>
            
            <div className="SidebarManagement-company-item">
              <div className="SidebarManagement-company-icon-bg SidebarManagement-company-icon-bg-success">
                <span className="SidebarManagement-company-icon">✓</span>
              </div>
              <div className="SidebarManagement-company-info">
                <span className="SidebarManagement-company-label">Status</span>
                <span className={`SidebarManagement-status-chip SidebarManagement-status-chip-${company.isActive ? 'active' : 'inactive'}`}>
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="SidebarManagement-company-item SidebarManagement-company-item-button">
              <button 
                className="SidebarManagement-refresh-button"
                onClick={() => fetchExistingConfigs(company._id)}
                disabled={loading.fetching}
              >
                <span className="SidebarManagement-refresh-icon">🔄</span>
                {loading.fetching ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="SidebarManagement-alert SidebarManagement-alert-warning">
          <span className="SidebarManagement-alert-icon">⚠️</span>
          <span className="SidebarManagement-alert-message">
            Company information not found. Please login again.
          </span>
        </div>
      )}

      {/* Progress Bar */}
      {company && (
        <div className="SidebarManagement-progress-container">
          <div className="SidebarManagement-progress-header">
            <span className="SidebarManagement-progress-label">Configuration Progress</span>
            <span className="SidebarManagement-progress-percentage">{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="SidebarManagement-progress-bar">
            <div 
              className="SidebarManagement-progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {company ? (
        <>
          <div className="SidebarManagement-tabs-container">
            <button 
              className={`SidebarManagement-tab ${activeTab === 0 ? 'SidebarManagement-tab-active' : ''}`}
              onClick={() => setActiveTab(0)}
            >
              <span className="SidebarManagement-tab-icon">⚙️</span>
              <span>Configure Menu</span>
            </button>
            <button 
              className={`SidebarManagement-tab ${activeTab === 1 ? 'SidebarManagement-tab-active' : ''}`}
              onClick={() => setActiveTab(1)}
            >
              <span className="SidebarManagement-tab-icon">📂</span>
              <span>Existing Configurations ({existingConfigs.length})</span>
            </button>
          </div>

          {/* Tab 1: Configuration */}
          {activeTab === 0 && (
            <>
              {/* Selection Stepper */}
              <div className="SidebarManagement-stepper-paper">
                <div className={`SidebarManagement-stepper ${isMobile ? 'SidebarManagement-stepper-vertical' : ''}`}>
                  <div className={`SidebarManagement-step ${activeStep >= 0 ? 'SidebarManagement-step-active' : ''}`}>
                    <div className="SidebarManagement-step-indicator">
                      {activeStep > 0 ? '✓' : '1'}
                    </div>
                    <div className="SidebarManagement-step-label">Select Department</div>
                  </div>
                  <div className={`SidebarManagement-step-connector ${activeStep >= 1 ? 'SidebarManagement-step-connector-active' : ''}`}></div>
                  
                  <div className={`SidebarManagement-step ${activeStep >= 1 ? 'SidebarManagement-step-active' : ''}`}>
                    <div className="SidebarManagement-step-indicator">
                      {activeStep > 1 ? '✓' : '2'}
                    </div>
                    <div className="SidebarManagement-step-label">Select Role</div>
                  </div>
                  <div className={`SidebarManagement-step-connector ${activeStep >= 2 ? 'SidebarManagement-step-connector-active' : ''}`}></div>
                  
                  <div className={`SidebarManagement-step ${activeStep >= 2 ? 'SidebarManagement-step-active' : ''}`}>
                    <div className="SidebarManagement-step-indicator">3</div>
                    <div className="SidebarManagement-step-label">Configure Menu Items</div>
                  </div>
                </div>
              </div>

              {/* Selection Cards */}
              <div className="SidebarManagement-cards-grid">
                {/* Department Selection */}
                <div className={`SidebarManagement-card ${selectedDepartment ? 'SidebarManagement-card-selected' : ''}`}>
                  <div className="SidebarManagement-card-content">
                    <div className="SidebarManagement-card-header">
                      <div className="SidebarManagement-card-icon-bg SidebarManagement-card-icon-bg-primary">
                        <span className="SidebarManagement-card-icon">🏛️</span>
                      </div>
                      <h3 className="SidebarManagement-card-title">Department</h3>
                    </div>
                    
                    <div className="SidebarManagement-dropdown-container">
                      <div className="SidebarManagement-input-wrapper">
                        <span className="SidebarManagement-input-icon">🏛️</span>
                        <input
                          type="text"
                          className="SidebarManagement-input"
                          placeholder={loading.departments ? "Loading departments..." : "Select Department"}
                          value={departmentSearch}
                          onChange={(e) => {
                            setDepartmentSearch(e.target.value);
                            setShowDepartmentDropdown(true);
                          }}
                          onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                          onFocus={() => setShowDepartmentDropdown(true)}
                          disabled={!company || loading.departments}
                        />
                        <span className="SidebarManagement-dropdown-arrow">▼</span>
                      </div>
                      
                      {showDepartmentDropdown && (
                        <div className="SidebarManagement-dropdown-menu">
                          {loading.departments ? (
                            <div className="SidebarManagement-dropdown-item SidebarManagement-dropdown-loading">
                              <div className="SidebarManagement-spinner-small"></div>
                              Loading departments...
                            </div>
                          ) : filteredDepartments.length === 0 ? (
                            <div className="SidebarManagement-dropdown-item SidebarManagement-dropdown-empty">
                              {departments.length === 0 ? 'No departments found' : 'No matching departments'}
                            </div>
                          ) : (
                            filteredDepartments.map((dept) => (
                              <div
                                key={dept._id}
                                className={`SidebarManagement-dropdown-item ${selectedDepartment === dept._id ? 'SidebarManagement-dropdown-item-selected' : ''}`}
                                onClick={() => handleDepartmentChange(dept._id)}
                              >
                                <div className="SidebarManagement-dropdown-item-content">
                                  <span className="SidebarManagement-dropdown-item-icon">🏛️</span>
                                  <div className="SidebarManagement-dropdown-item-text">
                                    <span className="SidebarManagement-dropdown-item-name">{dept.name}</span>
                                    {dept.description && (
                                      <span className="SidebarManagement-dropdown-item-desc">{dept.description}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    
                    {departments.length > 0 && (
                      <div className="SidebarManagement-card-footer">
                        <span className="SidebarManagement-chip SidebarManagement-chip-outlined">
                          {departments.length} departments available
                        </span>
                        {selectedDepartment && (
                          <span className="SidebarManagement-chip SidebarManagement-chip-success">
                            <span className="SidebarManagement-chip-icon">✓</span>
                            Selected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Role Selection */}
                <div className={`SidebarManagement-card ${selectedRole ? 'SidebarManagement-card-selected' : ''}`}>
                  <div className="SidebarManagement-card-content">
                    <div className="SidebarManagement-card-header">
                      <div className="SidebarManagement-card-icon-bg SidebarManagement-card-icon-bg-secondary">
                        <span className="SidebarManagement-card-icon">🔒</span>
                      </div>
                      <h3 className="SidebarManagement-card-title">Role</h3>
                    </div>
                    
                    <div className="SidebarManagement-dropdown-container">
                      <div className="SidebarManagement-input-wrapper">
                        <span className="SidebarManagement-input-icon">🔒</span>
                        <input
                          type="text"
                          className="SidebarManagement-input"
                          placeholder={!selectedDepartment ? "Select a department first" : loading.roles ? "Loading roles..." : "Select Role"}
                          value={roleSearch}
                          onChange={(e) => {
                            setRoleSearch(e.target.value);
                            if (selectedDepartment) setShowRoleDropdown(true);
                          }}
                          onClick={() => selectedDepartment && setShowRoleDropdown(!showRoleDropdown)}
                          onFocus={() => selectedDepartment && setShowRoleDropdown(true)}
                          disabled={!selectedDepartment || loading.roles}
                        />
                        {selectedDepartment && !loading.roles && getAllAvailableRoles().length > 0 && (
                          <span className="SidebarManagement-dropdown-arrow">▼</span>
                        )}
                      </div>
                      
                      {showRoleDropdown && selectedDepartment && (
                        <div className="SidebarManagement-dropdown-menu">
                          {loading.roles ? (
                            <div className="SidebarManagement-dropdown-item SidebarManagement-dropdown-loading">
                              <div className="SidebarManagement-spinner-small"></div>
                              Loading roles...
                            </div>
                          ) : filteredRoles.length === 0 ? (
                            <div className="SidebarManagement-dropdown-item SidebarManagement-dropdown-empty">
                              {getAllAvailableRoles().length === 0 ? 'No roles found' : 'No matching roles'}
                            </div>
                          ) : (
                            <>
                              {filteredRoles.map((role) => (
                                <div
                                  key={role._id}
                                  className={`SidebarManagement-dropdown-item ${selectedRole === role._id ? 'SidebarManagement-dropdown-item-selected' : ''}`}
                                  onClick={() => handleRoleChange(role._id)}
                                >
                                  <div className="SidebarManagement-dropdown-item-content">
                                    <span className="SidebarManagement-dropdown-item-icon">🔒</span>
                                    <div className="SidebarManagement-dropdown-item-text">
                                      <span className="SidebarManagement-dropdown-item-name">{role.name}</span>
                                      {role.description && (
                                        <span className="SidebarManagement-dropdown-item-desc">{role.description}</span>
                                      )}
                                    </div>
                                    {role.isCustom && (
                                      <span className="SidebarManagement-chip SidebarManagement-chip-custom">Custom</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div className="SidebarManagement-dropdown-divider"></div>
                              <div
                                className="SidebarManagement-dropdown-item SidebarManagement-dropdown-item-custom"
                                onClick={() => handleRoleChange('custom')}
                              >
                                <div className="SidebarManagement-dropdown-item-content">
                                  <span className="SidebarManagement-dropdown-item-icon SidebarManagement-dropdown-item-icon-add">+</span>
                                  <span className="SidebarManagement-dropdown-item-name">Add Custom Role</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {selectedDepartment && (
                      <div className="SidebarManagement-card-footer">
                        <span className="SidebarManagement-chip SidebarManagement-chip-outlined">
                          {getAllAvailableRoles().length} roles available
                        </span>
                        <button 
                          className="SidebarManagement-icon-button"
                          onClick={handleRefreshRoles}
                          disabled={loading.roles}
                        >
                          <span className="SidebarManagement-icon-button-icon">🔄</span>
                        </button>
                        {selectedRole && (
                          <span className="SidebarManagement-chip SidebarManagement-chip-success">
                            <span className="SidebarManagement-chip-icon">✓</span>
                            Selected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Items Selection */}
              {company && selectedDepartment && selectedRole && (
                <div className="SidebarManagement-menu-card">
                  <div className="SidebarManagement-menu-header">
                    <div className="SidebarManagement-menu-title">
                      <h3 className="SidebarManagement-menu-heading">Menu Items Configuration</h3>
                      <p className="SidebarManagement-menu-subheading">
                        Select the menu items you want to display for this role
                      </p>
                    </div>
                    
                    <div className="SidebarManagement-menu-badge">
                      <span className="SidebarManagement-badge">{selectedItems.length}</span>
                      <span className="SidebarManagement-badge-label">Selected Items</span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="SidebarManagement-search-wrapper">
                    <span className="SidebarManagement-search-icon">🔍</span>
                    <input
                      type="text"
                      className="SidebarManagement-search-input"
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        className="SidebarManagement-search-clear"
                        onClick={() => setSearchTerm('')}
                      >
                        ✗
                      </button>
                    )}
                  </div>

                  {/* Menu Items by Category */}
                  {Object.entries(groupedPages).map(([category, pages]) => {
                    const filteredCategoryPages = searchTerm 
                      ? pages.filter(page =>
                          page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          page.path.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      : pages;

                    if (filteredCategoryPages.length === 0) return null;

                    const isExpanded = expandedCategories[category] !== false;
                    const categorySelectedCount = filteredCategoryPages.filter(page => 
                      selectedItems.includes(page.id)
                    ).length;
                    const isAllSelected = categorySelectedCount === filteredCategoryPages.length;

                    return (
                      <div key={category} className="SidebarManagement-category-section">
                        {/* Category Header */}
                        <div 
                          className="SidebarManagement-category-header"
                          onClick={() => toggleCategory(category)}
                        >
                          <div className="SidebarManagement-category-header-left">
                            <button className="SidebarManagement-category-expand">
                              {isExpanded ? '▲' : '▼'}
                            </button>
                            <h4 className="SidebarManagement-category-title">
                              {getCategoryDisplayName(category)}
                            </h4>
                            <span className={`SidebarManagement-category-count ${isAllSelected ? 'SidebarManagement-category-count-all' : ''}`}>
                              {categorySelectedCount}/{filteredCategoryPages.length}
                            </span>
                          </div>
                          <button 
                            className="SidebarManagement-category-select-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllCategory(category);
                            }}
                          >
                            {isAllSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {/* Category Items */}
                        {isExpanded && (
                          <div className="SidebarManagement-category-items-grid">
                            {filteredCategoryPages.map((page) => {
                              const isSelected = selectedItems.includes(page.id);
                              return (
                                <div
                                  key={page.id}
                                  className={`SidebarManagement-menu-item ${isSelected ? 'SidebarManagement-menu-item-selected' : ''}`}
                                  onClick={() => handleMenuItemToggle(page.id)}
                                >
                                  {isSelected && (
                                    <div className="SidebarManagement-menu-item-check">✓</div>
                                  )}
                                  <div className="SidebarManagement-menu-item-content">
                                    <div className="SidebarManagement-menu-item-checkbox">
                                      <input 
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="SidebarManagement-menu-item-checkbox-input"
                                      />
                                    </div>
                                    <div className="SidebarManagement-menu-item-icon">
                                      {getIconHtml(page.icon)}
                                    </div>
                                    <div className="SidebarManagement-menu-item-details">
                                      <span className="SidebarManagement-menu-item-name">{page.name}</span>
                                      <span className="SidebarManagement-menu-item-path">{page.path}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Save Button at Bottom */}
                  <div className="SidebarManagement-save-footer">
                    <button
                      className="SidebarManagement-save-button"
                      onClick={handleSave}
                      disabled={loading.saving || selectedItems.length === 0}
                    >
                      {loading.saving ? (
                        <>
                          <div className="SidebarManagement-spinner-small SidebarManagement-spinner-white"></div>
                          Saving Configuration...
                        </>
                      ) : (
                        <>
                          <span className="SidebarManagement-save-icon">💾</span>
                          Save Configuration
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab 2 - Existing Configurations */}
          {activeTab === 1 && (
            <div className="SidebarManagement-configs-card">
              <div className="SidebarManagement-configs-header">
                <div className="SidebarManagement-configs-title">
                  <h3 className="SidebarManagement-configs-heading">Existing Configurations</h3>
                  <p className="SidebarManagement-configs-subheading">
                    Manage and edit existing sidebar configurations
                  </p>
                </div>
                <button 
                  className="SidebarManagement-refresh-btn"
                  onClick={() => company && company._id && fetchExistingConfigs(company._id)}
                  disabled={loading.fetching}
                >
                  <span className="SidebarManagement-refresh-btn-icon">🔄</span>
                  {loading.fetching ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {loading.fetching ? (
                <div className="SidebarManagement-loading-center">
                  <div className="SidebarManagement-spinner"></div>
                </div>
              ) : existingConfigs.length === 0 ? (
                <div className="SidebarManagement-alert SidebarManagement-alert-info">
                  <span className="SidebarManagement-alert-icon">ℹ️</span>
                  No configurations found. Create a new configuration in the "Configure Menu" tab.
                </div>
              ) : (
                <div className="SidebarManagement-configs-grid">
                  {existingConfigs.map((config) => (
                    <div key={config._id} className="SidebarManagement-config-item">
                      <div className="SidebarManagement-config-item-header">
                        <div className="SidebarManagement-config-item-info">
                          <div className="SidebarManagement-config-item-dept">
                            <span className="SidebarManagement-config-item-icon">🏛️</span>
                            <span className="SidebarManagement-config-item-dept-name">
                              {getDepartmentName(config.departmentId)}
                            </span>
                          </div>
                          <div className="SidebarManagement-config-item-role">
                            <span className="SidebarManagement-config-item-icon">🔒</span>
                            <span className="SidebarManagement-config-item-role-chip">
                              {getRoleNameById(config.role)}
                            </span>
                          </div>
                          <span className="SidebarManagement-config-item-meta">
                            {config.menuItems.length} menu items • Updated: {formatDate(config.updatedAt || config.createdAt)}
                          </span>
                        </div>
                        <div className="SidebarManagement-config-item-actions">
                          <button 
                            className="SidebarManagement-config-item-btn" 
                            onClick={() => handlePreview(config)}
                            title="Preview"
                          >
                            👁️
                          </button>
                          <button 
                            className="SidebarManagement-config-item-btn" 
                            onClick={() => handleEdit(config)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="SidebarManagement-config-item-btn SidebarManagement-config-item-btn-delete" 
                            onClick={() => handleDelete(config._id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div className="SidebarManagement-config-item-menu-list">
                        {config.menuItems.slice(0, 5).map((item) => (
                          <span key={item.id} className="SidebarManagement-config-item-chip">
                            <span className="SidebarManagement-config-item-chip-icon">{getIconHtml(item.icon)}</span>
                            {item.name}
                          </span>
                        ))}
                        {config.menuItems.length > 5 && (
                          <span className="SidebarManagement-config-item-chip">
                            +{config.menuItems.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="SidebarManagement-alert SidebarManagement-alert-info">
          <span className="SidebarManagement-alert-icon">ℹ️</span>
          Please login to configure sidebar menus.
        </div>
      )}

      {/* 🔥 FIXED: Unified Modal Component with proper background click handling */}
      {modalState.isOpen && (
        <div className="SidebarManagement-modal-overlay" onClick={closeModal}>
          <div className="SidebarManagement-modal" onClick={e => e.stopPropagation()}>
            
            {/* Preview Modal */}
            {modalState.type === 'preview' && modalState.data && (
              <>
                <div className="SidebarManagement-modal-header">
                  <div className="SidebarManagement-modal-header-content">
                    <span className="SidebarManagement-modal-header-icon">👁️</span>
                    <h3 className="SidebarManagement-modal-header-title">Menu Preview</h3>
                  </div>
                  <span className="SidebarManagement-modal-subtitle">
                    {company?.companyName} ({company?.companyCode}) - 
                    {getDepartmentName(modalState.data.departmentId)} - 
                    {getRoleNameById(modalState.data.role)}
                  </span>
                  <button className="SidebarManagement-modal-close" onClick={closeModal}>✗</button>
                </div>
                <div className="SidebarManagement-modal-content">
                  <div className="SidebarManagement-preview-list">
                    {modalState.data.menuItems.map((item, index) => (
                      <div key={item.id} className="SidebarManagement-preview-item">
                        <div className="SidebarManagement-preview-item-icon">
                          {getIconHtml(item.icon)}
                        </div>
                        <div className="SidebarManagement-preview-item-details">
                          <span className="SidebarManagement-preview-item-name">{item.name}</span>
                          <div className="SidebarManagement-preview-item-meta">
                            <span className="SidebarManagement-preview-item-path">{item.path}</span>
                            <span className="SidebarManagement-preview-item-category">{getCategoryDisplayName(item.category)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="SidebarManagement-modal-footer">
                  <button className="SidebarManagement-modal-close-btn" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            )}

            {/* Delete Confirmation Modal */}
            {modalState.type === 'delete' && (
              <>
                <div className="SidebarManagement-modal-header SidebarManagement-modal-header-warning">
                  <div className="SidebarManagement-modal-header-content">
                    <span className="SidebarManagement-modal-header-icon">⚠️</span>
                    <h3 className="SidebarManagement-modal-header-title">Confirm Delete</h3>
                  </div>
                  <button className="SidebarManagement-modal-close" onClick={closeModal}>✗</button>
                </div>
                <div className="SidebarManagement-modal-content">
                  <p className="SidebarManagement-modal-text">
                    Are you sure you want to delete this configuration? This action cannot be undone.
                  </p>
                </div>
                <div className="SidebarManagement-modal-footer">
                  <button className="SidebarManagement-modal-cancel-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="SidebarManagement-modal-delete-btn" onClick={confirmDelete}>
                    Delete
                  </button>
                </div>
              </>
            )}

            {/* Add Custom Role Modal */}
            {modalState.type === 'addRole' && (
              <AddRoleModal 
                onClose={closeModal}
                onConfirm={confirmAddRole}
              />
            )}
          </div>
        </div>
      )}

      {/* Snackbar/Toast with Auto-dismiss */}
      {snackbar.open && (
        <div className={`SidebarManagement-snackbar SidebarManagement-snackbar-${snackbar.severity}`}>
          <span className="SidebarManagement-snackbar-icon">
            {snackbar.severity === 'success' ? '✓' : 
             snackbar.severity === 'error' ? '✗' : 
             snackbar.severity === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="SidebarManagement-snackbar-message">{snackbar.message}</span>
          <button className="SidebarManagement-snackbar-close" onClick={() => setSnackbar({ ...snackbar, open: false })}>✗</button>
        </div>
      )}
    </div>
  );
};

// 🔥 NEW: Add Role Modal Component
const AddRoleModal = ({ onClose, onConfirm }) => {
  const [roleName, setRoleName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roleName.trim()) {
      onConfirm(roleName.trim());
    }
  };

  return (
    <>
      <div className="SidebarManagement-modal-header">
        <div className="SidebarManagement-modal-header-content">
          <span className="SidebarManagement-modal-header-icon">➕</span>
          <h3 className="SidebarManagement-modal-header-title">Add Custom Role</h3>
        </div>
        <button className="SidebarManagement-modal-close" onClick={onClose}>✗</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="SidebarManagement-modal-content">
          <div className="SidebarManagement-form-group">
            <label className="SidebarManagement-form-label">Role Name</label>
            <input
              type="text"
              className="SidebarManagement-form-input"
              placeholder="e.g., team-lead, supervisor, executive"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="SidebarManagement-modal-footer">
          <button type="button" className="SidebarManagement-modal-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="SidebarManagement-modal-add-btn" disabled={!roleName.trim()}>
            Add Role
          </button>
        </div>
      </form>
    </>
  );
};

export default SidebarManagement;
