import React, { useState, useEffect } from 'react';
import axios from "../../utils/axiosConfig";
import axiosInstance from "../../utils/axiosConfig";
import Swal from 'sweetalert2';
import './SidebarManagement.css';
import CIISLoader from '../../Loader/CIISLoader';


const APP_ROUTES = [
  { path: 'emp-details', name: 'Employee Details', icon: 'Person', category: 'administration' },
  { path: 'emp-leaves', name: 'Employee Leaves', icon: 'EventNote', category: 'administration' },
  { path: 'emp-assets', name: 'Employee Assets', icon: 'Computer', category: 'administration' },
  { path: 'emp-attendance', name: 'Employee Attendance', icon: 'CalendarToday', category: 'administration' },
  { path: 'department', name: 'Department Management', icon: 'Apartment', category: 'administration' },
  { path: 'JobRoleManagement', name: 'Job Role Management', icon: 'Work', category: 'administration' },
  { path: 'admin-task-create', name: 'Admin Create Task', icon: 'Task', category: 'administration' },
  { path: 'manage-groups', name: 'Manage Groups', icon: 'GroupIcon', category: 'administration' },
  { path: 'create-user', name: 'Create User', icon: 'PersonAdd', category: 'administration' },
  { path: 'SidebarManagement', name: 'Sidebar Management', icon: 'Settings', category: 'administration' },
  { path: 'admin-meeting', name: 'Create Employee Meeting', icon: 'MeetingRoom', category: 'meetings' },
  { path: 'adminproject', name: 'Admin Projects', icon: 'ProjectIcon', category: 'projects' },
  { path: 'company-all-task', name: 'Company All Tasks', icon: 'ListAlt', category: 'tasks' },
  
  { path: 'emp-client', name: 'Client Management', icon: 'ClientIcon', category: 'clients' },
  { path: 'active-clients', name: 'Active Clients', icon: 'Folder', category: 'clients' },
  { path: 'client-dashboard', name: 'Client Dashboard', icon: 'Dashboard', category: 'clients' },
  { path: 'client-my-services', name: 'My Services', icon: 'Folder', category: 'clients' },
  { path: 'client-tasks-updates', name: 'Tasks & Updates', icon: 'Task', category: 'clients' },
  { path: 'client-marketplace', name: 'Explore Services', icon: 'Folder', category: 'clients' },
  { path: 'client-support-tickets', name: 'Meetings', icon: 'VideoCall', category: 'clients' },
  { path: 'client-documents', name: 'Documents', icon: 'Folder', category: 'clients' },
  { path: 'client-payments', name: 'Payments', icon: 'CreditCard', category: 'clients' },
  { path: 'alert', name: 'Alerts', icon: 'Notifications', category: 'communication' },
  { path: 'attendance', name: 'My Attendance', icon: 'CalendarToday', category: 'main' },
  { path: 'my-assets', name: 'My Assets', icon: 'Computer', category: 'main' },
  { path: 'my-leaves', name: 'My Leaves', icon: 'EventNote', category: 'main' },
  { path: 'profile', name: 'My Details', icon: 'Person', category: 'main' },
  { path: 'user-dashboard', name: 'Dashboard', icon: 'Dashboard', category: 'main' },
  { path: 'project', name: 'Projects', icon: 'Groups', category: 'projects' },
  { path: 'task-management', name: 'Create Task', icon: 'Task', category: 'tasks' },
  { path: 'employee-meeting', name: 'Employee Meeting', icon: 'VideoCall', category: 'meetings' },
  { path: 'client-meeting', name: 'Client Meeting', icon: 'VideoCall', category: 'meetings' },
  { path: 'change-password', name: 'Change Password', icon: 'Key', category: 'main' },
  { path: 'create-alert' , name: 'Create Alert', icon: 'Notifications', category: 'communication' },
  { path: 'chat', name: 'Chat', icon: 'Chat', category: 'communication' },
  { path: 'support-desk', name: 'Support Desk', icon: 'SupportAgent', category: 'communication' },
  { path: 'support-operations', name: 'Support Operations', icon: 'SupportAgent', category: 'administration' },
];


const getIconHtml = (iconName) => {
  const icons = {
    Dashboard: '📊',
    CalendarToday: '📅',
    EventNote: '📝',
    Computer: '💻',
    Task: '✅',
    Groups: '👥',
    GroupIcon: '👫',
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
    SupportAgent: '🎧',
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

const getRouteKey = (path = '') => String(path).split('/').filter(Boolean).pop();

const getRouteAccessKeys = (route) => {
  const rawPath = String(route?.path || '').trim();
  const cleanPath = rawPath.replace(/^\/+/, '');
  const keys = new Set([route?.id, rawPath, cleanPath, getRouteKey(rawPath)].filter(Boolean));

  if (cleanPath) {
    keys.add(`/ciisUser/${cleanPath}`);
    keys.add(`ciisUser/${cleanPath}`);
  }

  if (cleanPath.startsWith('client-')) {
    const clientPath = cleanPath.substring(7);
    keys.add(`/client/${clientPath}`);
    keys.add(`client/${clientPath}`);
    keys.add(clientPath);
  }

  return keys;
};

const isRouteAllowedForCompany = (route, company) => {
  const allowedPages = Array.isArray(company?.allowedPages) ? company.allowedPages : [];
  if (allowedPages.length === 0) return true;

  const allowedSet = new Set(allowedPages.map(item => String(item).trim()).filter(Boolean));
  const routeKeys = getRouteAccessKeys(route);
  return [...allowedSet].some(page => routeKeys.has(page) || routeKeys.has(page.replace(/^\/+/, '')));
};


const SidebarManagement = () => {
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 960);
  const [pageLoading, setPageLoading] = useState(true);

  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
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
  const [itemOrders, setItemOrders] = useState({});
  const [existingConfigs, setExistingConfigs] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  
  
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, 
    data: null
  });
  
  const [customRoles, setCustomRoles] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  
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

  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
      setIsTablet(window.innerWidth < 960);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
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

  
  const getCompanyFromLocalStorage = () => {
    try {
      const companyDetailsStr = localStorage.getItem('company') || localStorage.getItem('companyDetails');
      
      if (companyDetailsStr) {
        const companyData = JSON.parse(companyDetailsStr);
        void 0;
        
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
          loginUrl: companyData.loginUrl,
          allowedPages: Array.isArray(companyData.allowedPages) ? companyData.allowedPages : []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting company from localStorage:', error);
      return null;
    }
  };

  
  useEffect(() => {
    initializePages();
    initializeCompanyFromLocalStorage();
  }, []);

  const initializePages = (companyOverride = company) => {
    const pages = APP_ROUTES.map(route => {
      const isClientPath = route.path.startsWith('client-');
      return {
        id: route.path,
        name: route.name,
        path: isClientPath ? `/client/${route.path.substring(7)}` : `/ciisUser/${route.path}`,
        icon: route.icon,
        category: route.category,
        description: `Access: ${route.category === 'administration' ? 'Admin Only' : 'All Users'}`
      };
    });
    setAvailablePages(pages);
  };

  
  const initializeCompanyFromLocalStorage = async () => {
    try {
      setPageLoading(true);
      const companyFromStorage = getCompanyFromLocalStorage();
      
      if (companyFromStorage && companyFromStorage._id) {
        void 0;
        let activeCompany = companyFromStorage;

        try {
          const latestCompanyResponse = await axiosInstance.get(`/company/${companyFromStorage._id}`);
          const latestCompany = latestCompanyResponse.data?.company;

          if (latestCompany?._id) {
            activeCompany = {
              ...companyFromStorage,
              ...latestCompany,
              allowedPages: Array.isArray(latestCompany.allowedPages) ? latestCompany.allowedPages : []
            };
            localStorage.setItem('company', JSON.stringify(activeCompany));
          }
        } catch (latestCompanyError) {
          console.warn('Could not refresh company access, using stored company data:', latestCompanyError.message);
        }

        setCompany(activeCompany);
        initializePages(activeCompany);
        
        await fetchBranches(activeCompany._id);
        await fetchCompanyRoles(activeCompany._id);
        await fetchExistingConfigs(activeCompany._id);
        
        setSnackbar({
          open: true,
          message: `Loaded company: ${activeCompany.companyName}`,
          severity: 'success'
        });
        
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      } else {
        void 0;
        setPageLoading(false);
      }
    } catch (error) {
      console.error('Error initializing company:', error);
      setPageLoading(false);
    }
  };

  const fetchBranches = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`/branches/company/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data && response.data.success) {
        setBranches(response.data.branches || []);
        
        const defaultBr = response.data.branches?.find(b => b.isDefault);
        if (defaultBr) {
          setSelectedBranch(defaultBr._id);
          await fetchDepartments(companyId, defaultBr._id);
        } else if (response.data.branches?.length > 0) {
          setSelectedBranch(response.data.branches[0]._id);
          await fetchDepartments(companyId, response.data.branches[0]._id);
        } else {
          await fetchDepartments(companyId);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleBranchChange = async (branchId) => {
    setSelectedBranch(branchId);
    setSelectedDepartment('');
    setSelectedRole('');
    setSelectedItems([]);
    setItemOrders({});
    setJobRoles([]);
    if (company && company._id) {
      await fetchDepartments(company._id, branchId);
      await fetchExistingConfigs(company._id, branchId);
    }
  };

  
  const fetchDepartments = async (companyId, branchId = null) => {
    try {
      setLoading(prev => ({ ...prev, departments: true }));
      const token = localStorage.getItem('token');
      let url = `/departments?company=${companyId}`;
      if (branchId) {
        url += `&branch=${branchId}`;
      }
      const response = await axiosInstance.get(url, {
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
        void 0;
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

  
  const fetchExistingConfigs = async (companyId, branchId = null) => {
    try {
      setLoading(prev => ({ ...prev, fetching: true }));
      const token = localStorage.getItem('token');
      
      void 0;
      
      const params = { companyId };
      const activeBranchId = branchId || selectedBranch;
      if (activeBranchId) {
        params.branchId = activeBranchId;
      }
      
      const response = await axiosInstance.get(`/sidebar`, {
        params,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      void 0;
      
      if (response.data && response.data.success) {
        let configs = [];
        
        if (response.data.data && Array.isArray(response.data.data)) {
          configs = response.data.data;
        } else if (Array.isArray(response.data)) {
          configs = response.data;
        }
        
        void 0;
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

  
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'No Department';
    
    if (typeof departmentId === 'object' && departmentId !== null) {
      return departmentId.name || departmentId.departmentName || 'Department';
    }
    
    const department = departments.find(d => d._id === departmentId);
    if (department) return department.name;
    
    return 'Department';
  };

  
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

  
  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedRole('');
    setSelectedItems([]);
    setItemOrders({});
    setJobRoles([]);
    setActiveStep(1);
    setShowDepartmentDropdown(false);
    
    const dept = departments.find(d => d._id === departmentId);
    if (dept) {
      setDepartmentSearch(dept.name);
    }
  };

  
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
      setItemOrders({});
    }
  };

  
  const loadExistingConfig = async (companyId, departmentId, roleId) => {
    try {
      const token = localStorage.getItem('token');
      const params = { 
        companyId, 
        departmentId, 
        role: roleId 
      };
      if (selectedBranch) {
        params.branchId = selectedBranch;
      }
      const response = await axiosInstance.get(`/sidebar/config`, {
        params,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success && response.data.data) {
        const menuItems = response.data.data.menuItems || [];
        setSelectedItems(menuItems.map(item => item.id));
        const orders = {};
        menuItems.forEach((item, idx) => {
          orders[item.id] = item.order || (idx + 1);
        });
        setItemOrders(orders);
      } else {
        setSelectedItems([]);
        setItemOrders({});
      }
    } catch (error) {
      console.error('Error loading existing config:', error);
      setSelectedItems([]);
      setItemOrders({});
    }
  };

  
  const handleEdit = async (config) => {
    try {
      const departmentId = typeof config.departmentId === 'object' 
        ? config.departmentId._id 
        : config.departmentId;
      
      const roleId = config.role;
      
      setSelectedDepartment(departmentId);
      setSelectedRole(roleId);
      const menuItems = config.menuItems || [];
      setSelectedItems(menuItems.map(item => item.id));
      const orders = {};
      menuItems.forEach((item, idx) => {
        orders[item.id] = item.order || (idx + 1);
      });
      setItemOrders(orders);
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

  
  const handleMenuItemToggle = (pageId) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(pageId);
      if (isSelected) {
        setItemOrders(orders => {
          const next = { ...orders };
          delete next[pageId];
          return next;
        });
        return prev.filter(id => id !== pageId);
      } else {
        setItemOrders(orders => {
          const maxOrder = Object.values(orders).reduce((max, val) => Math.max(max, val), 0);
          return {
            ...orders,
            [pageId]: maxOrder + 1
          };
        });
        return [...prev, pageId];
      }
    });
  };

  
  const handleSelectAllCategory = (category) => {
    const categoryPages = filteredAvailablePages.filter(page => page.category === category);
    const categoryIds = categoryPages.map(page => page.id);
    
    setSelectedItems(prev => {
      const allSelected = categoryIds.every(id => prev.includes(id));
      if (allSelected) {
        setItemOrders(orders => {
          const next = { ...orders };
          categoryIds.forEach(id => delete next[id]);
          return next;
        });
        return prev.filter(id => !categoryIds.includes(id));
      } else {
        setItemOrders(orders => {
          const next = { ...orders };
          let maxOrder = Object.values(next).reduce((max, val) => Math.max(max, val), 0);
          categoryIds.forEach(id => {
            if (!next[id]) {
              maxOrder += 1;
              next[id] = maxOrder;
            }
          });
          return next;
        });
        return [...new Set([...prev, ...categoryIds])];
      }
    });
  };

  
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const isClientSelection = React.useMemo(() => {
    const selectedDept = departments.find(d => d._id === selectedDepartment);
    const selectedRoleData = [...jobRoles, ...customRoles, ...companyRoles].find(r => r._id === selectedRole);
    const selectedDeptName = String(selectedDept?.name || '').trim().toLowerCase();
    const selectedRoleName = String(selectedRoleData?.name || '').trim().toLowerCase();

    return selectedDeptName === 'client' || selectedRoleName === 'client';
  }, [departments, jobRoles, customRoles, companyRoles, selectedDepartment, selectedRole]);

  const filteredAvailablePages = React.useMemo(() => {
    const hiddenForClient = new Set(['emp-client', 'active-clients']);
    return availablePages.filter(page => !isClientSelection || !hiddenForClient.has(page.id));
  }, [availablePages, isClientSelection]);

  useEffect(() => {
    const visiblePageIds = new Set(filteredAvailablePages.map(page => page.id));
    setSelectedItems(prev => prev.filter(id => visiblePageIds.has(id)));
    setItemOrders(prev => {
      const next = {};
      Object.entries(prev).forEach(([id, order]) => {
        if (visiblePageIds.has(id)) next[id] = order;
      });
      return next;
    });
  }, [filteredAvailablePages]);

  const groupedPages = filteredAvailablePages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {});

  
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
      const availablePageMap = new Map(filteredAvailablePages.map(page => [page.id, page]));
      
      const menuItemsMapped = selectedItems.reduce((items, id) => {
        const page = availablePageMap.get(id);
        if (!page) return items;

        const customOrder = parseInt(itemOrders[id], 10);
        items.push({
          id: page.id,
          name: page.name,
          icon: page.icon,
          path: page.path,
          category: page.category,
          order: !isNaN(customOrder) ? customOrder : items.length + 1
        });
        return items;
      }, []);

      if (menuItemsMapped.length === 0) {
        setSelectedItems([]);
        setItemOrders({});
        setSnackbar({
          open: true,
          message: 'Selected menu items are no longer available for this role. Please select menu items again.',
          severity: 'warning'
        });
        return;
      }

      menuItemsMapped.sort((a, b) => a.order - b.order);

      const configData = {
        companyId: company._id,
        branchId: selectedBranch || null,
        departmentId: selectedDepartment,
        role: selectedRole,
        menuItems: menuItemsMapped
      };

      void 0;

      const checkParams = { 
        companyId: company._id, 
        departmentId: selectedDepartment, 
        role: selectedRole 
      };
      if (selectedBranch) {
        checkParams.branchId = selectedBranch;
      }

      const checkResponse = await axiosInstance.get(`/sidebar/config`, {
        params: checkParams,
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

      void 0;

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

  
  const handleDelete = (configId) => {
    setModalState({
      isOpen: true,
      type: 'delete',
      data: configId
    });
  };

  
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

  
  const handlePreview = (config) => {
    setModalState({
      isOpen: true,
      type: 'preview',
      data: config
    });
  };

  
  const handleAddRole = () => {
    setModalState({
      isOpen: true,
      type: 'addRole',
      data: null
    });
  };

  
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

  
  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      data: null
    });
  };

  
  const getAllAvailableRoles = () => {
    const allRolesList = [...jobRoles, ...customRoles];
    return allRolesList.sort((a, b) => a.name.localeCompare(b.name));
  };

  
  const filteredDepartments = departments.filter(dept => {
    const searchLower = departmentSearch.toLowerCase();
    return dept.name.toLowerCase().includes(searchLower) ||
           (dept.description && dept.description.toLowerCase().includes(searchLower));
  });

  
  const filteredRoles = getAllAvailableRoles().filter(role => {
    const searchLower = roleSearch.toLowerCase();
    return role.name.toLowerCase().includes(searchLower) ||
           (role.description && role.description.toLowerCase().includes(searchLower));
  });

  
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

  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  
  const getProgressPercentage = () => {
    let steps = 0;
    if (company) steps++;
    if (selectedDepartment) steps++;
    if (selectedRole) steps++;
    if (selectedItems.length > 0) steps++;
    return (steps / 4) * 100;
  };

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className={`SidebarManagement-container ${isMobile ? 'SidebarManagement-mobile' : ''}`}>
      
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

          
          {activeTab === 0 && (
            <>
              
              <div className="SidebarManagement-stepper-paper">
                <div className={`SidebarManagement-stepper ${isMobile ? 'SidebarManagement-stepper-vertical' : ''}`}>
                  <div className={`SidebarManagement-step ${activeStep >= 0 ? 'SidebarManagement-step-active' : ''}`}>
                    <div className="SidebarManagement-step-indicator">
                      {activeStep > 0 ? '✓' : '1'}
                    </div>
                    <div className="SidebarManagement-step-label">Branch & Dept</div>
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
                    <div className="SidebarManagement-step-label">Select Menu Items</div>
                  </div>
                </div>
              </div>

              
              <div className="SidebarManagement-cards-grid">
                
                <div className={`SidebarManagement-card ${selectedBranch ? 'SidebarManagement-card-selected' : ''}`}>
                  <div className="SidebarManagement-card-content">
                    <div className="SidebarManagement-card-header">
                      <div className="SidebarManagement-card-icon-bg" style={{ backgroundColor: 'rgba(30, 60, 114, 0.1)', color: '#1e3c72' }}>
                        <span className="SidebarManagement-card-icon">🏢</span>
                      </div>
                      <h3 className="SidebarManagement-card-title">Branch</h3>
                    </div>
                    
                    <div className="SidebarManagement-dropdown-container">
                      <div className="SidebarManagement-input-wrapper">
                        <span className="SidebarManagement-input-icon">🏢</span>
                        <select
                          className="SidebarManagement-input"
                          value={selectedBranch}
                          onChange={(e) => handleBranchChange(e.target.value)}
                          disabled={!company || branches.length === 0}
                          style={{ appearance: 'none', background: 'transparent', outline: 'none' }}
                        >
                          <option value="">Select Branch</option>
                          {branches.map(br => (
                            <option key={br._id || br.id} value={br._id || br.id}>
                              {br.name} ({br.branchCode})
                            </option>
                          ))}
                        </select>
                        <span className="SidebarManagement-dropdown-arrow">▼</span>
                      </div>
                    </div>
                  </div>
                </div>

                
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
                                    {isSelected && (
                                      <div 
                                        className="SidebarManagement-menu-item-order-wrap" 
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          marginLeft: 'auto',
                                          marginRight: 12,
                                          zIndex: 10
                                        }}
                                      >
                                        <span style={{ fontSize: 12, color: '#64748b', marginRight: 4 }}>Sort:</span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={itemOrders[page.id] || ''}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            setItemOrders(prev => ({
                                              ...prev,
                                              [page.id]: isNaN(val) ? '' : val
                                            }));
                                          }}
                                          style={{
                                            width: 44,
                                            height: 28,
                                            border: '1px solid #cbd5e1',
                                            borderRadius: 6,
                                            textAlign: 'center',
                                            fontSize: 13,
                                            fontWeight: '600',
                                            color: '#0f172a',
                                            background: '#ffffff',
                                            padding: 0
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  
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

      
      {modalState.isOpen && (
        <div className="SidebarManagement-modal-overlay" onClick={closeModal}>
          <div className="SidebarManagement-modal" onClick={e => e.stopPropagation()}>
            
            
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
                            <span className="SidebarManagement-preview-item-order" style={{ marginLeft: 8, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 'bold', color: '#64748b' }}>Sort: {item.order}</span>
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

            
            {modalState.type === 'addRole' && (
              <AddRoleModal 
                onClose={closeModal}
                onConfirm={confirmAddRole}
              />
            )}
          </div>
        </div>
      )}

      
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
