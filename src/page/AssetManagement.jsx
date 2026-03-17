import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../utils/axiosConfig';
import './AssetManagement.css';

// Asset Categories with Icons (SVG paths)
const ASSET_CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: 'computer', color: '#2196f3' },
  { value: 'furniture', label: 'Furniture', icon: 'business', color: '#ff9800' },
  { value: 'vehicles', label: 'Vehicles', icon: 'local_shipping', color: '#4caf50' },
  { value: 'machinery', label: 'Machinery', icon: 'build', color: '#9c27b0' },
  { value: 'software', label: 'Software', icon: 'devices', color: '#00bcd4' },
  { value: 'office_equipment', label: 'Office Equipment', icon: 'print', color: '#795548' },
  { value: 'it_equipment', label: 'IT Equipment', icon: 'computer', color: '#3f51b5' },
  { value: 'other', label: 'Other', icon: 'category', color: '#757575' }
];

// Asset Status with Icons and Colors
const ASSET_STATUS = [
  { value: 'available', label: 'Available', icon: 'check_circle', color: '#4caf50' },
  { value: 'assigned', label: 'Assigned', icon: 'assignment_turned_in', color: '#2196f3' },
  { value: 'maintenance', label: 'Under Maintenance', icon: 'build', color: '#ff9800' },
  { value: 'damaged', label: 'Damaged', icon: 'error_outline', color: '#f44336' },
  { value: 'retired', label: 'Retired', icon: 'cancel', color: '#9e9e9e' },
  { value: 'reserved', label: 'Reserved', icon: 'schedule', color: '#9c27b0' }
];

// Condition Types
const CONDITION_TYPES = [
  { value: 'new', label: 'New', color: '#4caf50' },
  { value: 'excellent', label: 'Excellent', color: '#8bc34a' },
  { value: 'good', label: 'Good', color: '#2196f3' },
  { value: 'fair', label: 'Fair', color: '#ff9800' },
  { value: 'poor', label: 'Poor', color: '#f44336' }
];

// SVG Icons as components
const Icons = {
  inventory: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/></svg>`,
  check_circle: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  assignment_turned_in: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>`,
  assignment_return: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 12h-4v3l-5-5 5-5v3h4v4z"/></svg>`,
  build: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`,
  history: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`,
  edit: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  delete: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
  add: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
  search: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  clear: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  person: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
  business: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/></svg>`,
  computer: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`,
  local_shipping: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
  devices: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/></svg>`,
  print: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>`,
  category: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/></svg>`,
  error_outline: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`,
  cancel: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>`,
  schedule: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
  attach_money: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 17.1c-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79z"/></svg>`,
  today: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>`,
  more_vert: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
  filter_list: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>`,
  admin_panel: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`,
  check_circle_outline: (size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>`
};

const AssetManagement = () => {
  // State Management
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    model: '',
    serialNumber: '',
    assetTag: '',
    purchaseDate: '',
    purchaseCost: '',
    warrantyExpiry: '',
    condition: 'good',
    status: 'available',
    location: '',
    department: '',
    assignedTo: null,
    description: '',
    supplier: '',
    manufacturer: '',
    notes: '',
    attachments: [],
    maintenanceType: 'scheduled',
    scheduledDate: '',
    maintenanceCost: '',
    vendor: ''
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userInfo, setUserInfo] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedAssetMenu, setSelectedAssetMenu] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    maintenance: 0,
    totalValue: 0
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setRowsPerPage(window.innerWidth < 768 ? 5 : 10);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to get user from localStorage
  const getUserFromStorage = () => {
    let userStr = localStorage.getItem('superAdmin');
    if (!userStr) userStr = localStorage.getItem('user');
    if (!userStr) userStr = sessionStorage.getItem('superAdmin') || sessionStorage.getItem('user');
    
    if (!userStr) {
      console.log('No user found in storage');
      return null;
    }
    
    try {
      const user = JSON.parse(userStr);
      console.log('User found in storage:', user);
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      toast.error('Error loading user data');
      return null;
    }
  };

  // Check if user is super-admin
  const checkSuperAdminStatus = (user) => {
    if (!user) return false;
    return user.role === 'super-admin' || 
           user.jobRole === 'super_admin' ||
           (user.role === 'super-admin' && user.department === 'Management');
  };

  // Initial Data Load
  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      setUserInfo(user);
      const isSuper = checkSuperAdminStatus(user);
      setIsSuperAdmin(isSuper);
      
      fetchAssets(user, isSuper);
      fetchDepartments(user, isSuper);
    } else {
      toast.error('Please login to continue');
    }
  }, [refreshKey, showAllCompanies, categoryFilter, statusFilter]);

  // Fetch employees whenever departments change or when needed
  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      const isSuper = checkSuperAdminStatus(user);
      fetchEmployees(user, isSuper);
    }
  }, [departments, showAllCompanies]);

  // Fetch Assets
  const fetchAssets = async (user = null, isSuper = false) => {
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
      
      if (!isSuper || !showAllCompanies) {
        if (user.company) {
          params.company = user.company;
        }
      }
      
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      console.log('Fetching assets with params:', params);
      
      const response = await axios.get('/assets12', { params });
      const assetsData = response.data.assets || [];
      setAssets(assetsData);
      
      // Calculate stats
      const total = assetsData.length;
      const available = assetsData.filter(a => a.status === 'available').length;
      const assigned = assetsData.filter(a => a.status === 'assigned').length;
      const maintenance = assetsData.filter(a => a.status === 'maintenance').length;
      const totalValue = assetsData.reduce((sum, asset) => sum + (asset.purchaseCost || 0), 0);
      
      setStats({
        total,
        available,
        assigned,
        maintenance,
        totalValue
      });
      
      console.log('Assets fetched:', assetsData.length);
    } catch (err) {
      console.error('Fetch assets error:', err);
      toast.error(err.response?.data?.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Departments
  const fetchDepartments = async (user = null, isSuper = false) => {
    try {
      if (!user) {
        user = getUserFromStorage();
        if (!user) return;
        isSuper = checkSuperAdminStatus(user);
      }
      
      let params = {};
      if (!isSuper || !showAllCompanies) {
        if (user.company) {
          params.company = user.company;
        }
      }
      
      console.log('Fetching departments with params:', params);
      const response = await axios.get('/departments', { params });
      const departmentsData = response.data.departments || [];
      setDepartments(departmentsData);
      console.log('Departments fetched:', departmentsData);
    } catch (err) {
      console.error('Fetch departments error:', err);
    }
  };

  // Fetch Employees with department information
  const fetchEmployees = async (user = null, isSuper = false) => {
    try {
      setLoadingEmployees(true);
      if (!user) {
        user = getUserFromStorage();
        if (!user) return;
        isSuper = checkSuperAdminStatus(user);
      }
      
      let params = {};
      if (!isSuper || !showAllCompanies) {
        if (user.company) {
          params.company = user.company;
        }
      }
      
      // Add populate parameter to get department details
      params.populate = 'department';
      
      console.log('Fetching employees with params:', params);
      const response = await axios.get('/users/company-users', { params });
      console.log('Employees API response:', response.data);
      
      // Handle different response structures
      let employeesData = [];
      if (response.data.users) {
        employeesData = response.data.users;
      } else if (Array.isArray(response.data)) {
        employeesData = response.data;
      } else {
        employeesData = response.data.data || [];
      }
      
      // Enhance employee data with department names
      const enhancedEmployees = employeesData.map(emp => {
        const enhanced = { ...emp };
        
        if (emp.department && typeof emp.department === 'string') {
          const foundDept = departments.find(d => d._id === emp.department);
          if (foundDept) {
            enhanced.departmentDetails = foundDept;
            enhanced.departmentName = foundDept.name;
            enhanced.department = foundDept;
          } else {
            enhanced.departmentName = emp.department;
          }
        } else if (emp.department && typeof emp.department === 'object') {
          enhanced.departmentName = emp.department.name;
          enhanced.departmentDetails = emp.department;
        } else {
          enhanced.departmentName = 'No Department';
        }
        
        return enhanced;
      });
      
      setEmployees(enhancedEmployees);
      console.log('Enhanced employees:', enhancedEmployees);
      
    } catch (err) {
      console.error('Fetch employees error:', err);
      toast.error('Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Handle Form Submit
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Asset name is required');
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
        category: formData.category,
        model: formData.model,
        serialNumber: formData.serialNumber,
        assetTag: formData.assetTag || `AST-${Date.now()}`,
        purchaseDate: formData.purchaseDate,
        purchaseCost: parseFloat(formData.purchaseCost) || 0,
        warrantyExpiry: formData.warrantyExpiry,
        condition: formData.condition,
        status: formData.status,
        location: formData.location,
        department: formData.department,
        assignedTo: formData.assignedTo,
        description: formData.description,
        supplier: formData.supplier,
        manufacturer: formData.manufacturer,
        notes: formData.notes
      };
      
      if (!isSuper || formData.company) {
        submitData.company = formData.company || user.company;
        submitData.companyCode = formData.companyCode || user.companyCode;
      }
      
      console.log('Submitting asset data:', submitData);
      
      if (editingAsset) {
        await axios.put(`/assets12/${editingAsset._id}`, submitData);
        toast.success('Asset Updated!');
      } else {
        await axios.post('/assets12', submitData);
        toast.success('Asset Created!');
      }
      
      setOpenDialog(false);
      resetForm();
      setEditingAsset(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Submit error:', err);
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Asset Assignment
  const handleAssign = async () => {
    if (!selectedAsset) return;
    if (!formData.assignedTo && !formData.department) {
      toast.error('Please select an employee or department to assign to');
      return;
    }

    try {
      setLoading(true);
      
      let assignedDepartment = formData.department;
      let assignedTo = formData.assignedTo;
      
      if (formData.assignedTo) {
        const selectedEmp = employees.find(emp => emp._id === formData.assignedTo);
        if (selectedEmp) {
          if (selectedEmp.department) {
            assignedDepartment = typeof selectedEmp.department === 'object' 
              ? selectedEmp.department._id 
              : selectedEmp.department;
          }
        }
      }
      
      const assignData = {
        assetId: selectedAsset._id,
        assignedTo: assignedTo || null,
        department: assignedDepartment || null,
        notes: formData.notes || `Assigned on ${new Date().toLocaleDateString()}`,
        assignedDate: new Date()
      };
      
      console.log('Assigning asset with data:', assignData);
      
      const response = await axios.post('/assets12/assign', assignData);
      console.log('Assignment response:', response.data);
      
      toast.success('Asset Assigned!');
      
      setOpenAssignDialog(false);
      setFormData(prev => ({
        ...prev,
        assignedTo: null,
        department: '',
        notes: ''
      }));
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Assign error:', err);
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Asset Return
  const handleReturn = async (assetId) => {
    try {
      setLoading(true);
      
      await axios.post(`/assets12/${assetId}/return`);
      
      toast.success('Asset Returned!');
      
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Return error:', err);
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Maintenance Request
  const handleMaintenance = async () => {
    if (!selectedAsset) return;
    if (!formData.notes) {
      toast.error('Please provide maintenance details');
      return;
    }

    try {
      setLoading(true);
      
      const maintenanceData = {
        type: formData.maintenanceType || 'scheduled',
        scheduledDate: formData.scheduledDate || new Date(),
        description: formData.notes,
        cost: parseFloat(formData.maintenanceCost) || 0,
        vendor: formData.vendor || ''
      };
      
      console.log('Scheduling maintenance:', maintenanceData);
      
      await axios.post(`/assets12/${selectedAsset._id}/maintenance`, maintenanceData);
      
      toast.success('Maintenance Scheduled!');
      
      setOpenMaintenanceDialog(false);
      setFormData(prev => ({
        ...prev,
        maintenanceType: 'scheduled',
        scheduledDate: null,
        notes: '',
        maintenanceCost: '',
        vendor: ''
      }));
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Maintenance error:', err);
      toast.error(err.response?.data?.message || 'Maintenance request failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const asset = assets.find(a => a._id === id);
    if (!window.confirm(`Are you sure you want to delete "${asset?.name}"? This action cannot be undone.`)) return;

    try {
      setLoading(true);
      await axios.delete(`/assets12/${id}`);
      toast.success('Asset Deleted!');
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      const msg = err.response?.data?.message || 'Deletion failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedAssets.length} assets?`)) return;

    try {
      setLoading(true);
      await axios.post('/assets12/bulk-delete', { assetIds: selectedAssets });
      toast.success(`${selectedAssets.length} assets deleted successfully`);
      setSelectedAssets([]);
      setBulkMode(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk deletion failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit
  const handleEdit = (asset) => {
    setEditingAsset(asset);
    const user = getUserFromStorage();
    
    setFormData({
      name: asset.name || '',
      category: asset.category || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      assetTag: asset.assetTag || '',
      purchaseDate: asset.purchaseDate || '',
      purchaseCost: asset.purchaseCost || '',
      warrantyExpiry: asset.warrantyExpiry || '',
      condition: asset.condition || 'good',
      status: asset.status || 'available',
      location: asset.location || '',
      department: asset.department?._id || asset.department || '',
      assignedTo: asset.assignedTo?._id || asset.assignedTo || null,
      description: asset.description || '',
      supplier: asset.supplier || '',
      manufacturer: asset.manufacturer || '',
      notes: asset.notes || '',
      company: asset.company || user?.company || '',
      companyCode: asset.companyCode || user?.companyCode || '',
      maintenanceType: 'scheduled',
      scheduledDate: null,
      maintenanceCost: '',
      vendor: ''
    });
    setOpenDialog(true);
    setShowMenu(false);
  };

  // Handle View History
  const handleViewHistory = async (asset) => {
    try {
      setLoading(true);
      const response = await axios.get(`/assets12/${asset._id}/history`);
      setSelectedAsset({
        ...asset,
        history: response.data.history || [],
        maintenanceRecords: response.data.maintenanceRecords || []
      });
      setOpenHistoryDialog(true);
    } catch (err) {
      console.error('Fetch history error:', err);
      toast.error('Failed to load asset history');
    } finally {
      setLoading(false);
    }
  };

  // Handle Menu Open
  const handleMenuOpen = (event, asset) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setSelectedAssetMenu(asset);
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
    setSelectedAssetMenu(null);
  };

  // Handle Refresh
  const handleRefresh = () => {
    toast.info('Refreshing assets...');
    setRefreshKey(prev => prev + 1);
  };

  // Handle Clear Search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle Clear Filters
  const handleClearFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  // Handle Tab Change
  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    switch (tabIndex) {
      case 0:
        setStatusFilter('all');
        break;
      case 1:
        setStatusFilter('available');
        break;
      case 2:
        setStatusFilter('assigned');
        break;
      case 3:
        setStatusFilter('maintenance');
        break;
      default:
        setStatusFilter('all');
    }
  };

  // Reset Form
  const resetForm = () => {
    const user = getUserFromStorage();
    setFormData({
      name: '',
      category: '',
      model: '',
      serialNumber: '',
      assetTag: '',
      purchaseDate: '',
      purchaseCost: '',
      warrantyExpiry: '',
      condition: 'good',
      status: 'available',
      location: '',
      department: '',
      assignedTo: null,
      description: '',
      supplier: '',
      manufacturer: '',
      notes: '',
      company: user?.company || '',
      companyCode: user?.companyCode || '',
      maintenanceType: 'scheduled',
      scheduledDate: '',
      maintenanceCost: '',
      vendor: ''
    });
  };

  // Handle Select All
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedAssets(filteredAssets.map(asset => asset._id));
    } else {
      setSelectedAssets([]);
    }
  };

  // Handle Select One
  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedAssets.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedAssets, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedAssets.slice(1));
    } else if (selectedIndex === selectedAssets.length - 1) {
      newSelected = newSelected.concat(selectedAssets.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedAssets.slice(0, selectedIndex),
        selectedAssets.slice(selectedIndex + 1)
      );
    }

    setSelectedAssets(newSelected);
  };

  // Filter Assets
  const getFilteredAssets = () => {
    let filtered = assets;
    const user = userInfo || getUserFromStorage();
    const isSuper = checkSuperAdminStatus(user);
    
    if (!isSuper || !showAllCompanies) {
      filtered = assets.filter(asset => 
        !asset.company || asset.company === user?.company
      );
    }
    
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.assetTag && asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const filteredAssets = getFilteredAssets();

  // Format Currency
  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format Date
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

  // Get Category Icon
  const getCategoryIcon = (category) => {
    const cat = ASSET_CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : 'category';
  };

  // Get Category Color
  const getCategoryColor = (category) => {
    const cat = ASSET_CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : '#757575';
  };

  // Get Status Icon
  const getStatusIcon = (status) => {
    const stat = ASSET_STATUS.find(s => s.value === status);
    return stat ? stat.icon : 'check_circle';
  };

  // Get Status Color
  const getStatusColor = (status) => {
    const stat = ASSET_STATUS.find(s => s.value === status);
    return stat ? stat.color : '#4caf50';
  };

  // Get Condition Color
  const getConditionColor = (condition) => {
    const cond = CONDITION_TYPES.find(c => c.value === condition);
    return cond ? cond.color : '#2196f3';
  };

  // Pagination Handlers
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  if (!userInfo) {
    return (
      <div className="AssetManagement-loading-container">
        <div className="AssetManagement-loading-card">
          <div className="AssetManagement-loading-spinner"></div>
          <h2 className="AssetManagement-loading-title">Loading...</h2>
          <p className="AssetManagement-loading-text">Fetching your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="AssetManagement">
      {/* Loading Overlay */}
      {loading && (
        <div className="AssetManagement-loading-overlay">
          <div className="AssetManagement-progress-bar">
            <div className="AssetManagement-progress-fill"></div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {assets.length > 0 && (
        <div className="AssetManagement-stats-grid">
          {/* Total Assets */}
          <div className="AssetManagement-stat-card AssetManagement-stat-total">
            <div className="AssetManagement-stat-icon" dangerouslySetInnerHTML={{ __html: Icons.inventory(isMobile ? 24 : 28) }} />
            <div className="AssetManagement-stat-content">
              <div className="AssetManagement-stat-label">Total Assets</div>
              <div className="AssetManagement-stat-value-wrapper">
                <span className="AssetManagement-stat-value">{stats.total}</span>
                {!isMobile && <span className="AssetManagement-stat-badge">All</span>}
              </div>
            </div>
          </div>

          {/* Available */}
          <div className="AssetManagement-stat-card AssetManagement-stat-available">
            <div className="AssetManagement-stat-icon" dangerouslySetInnerHTML={{ __html: Icons.check_circle(isMobile ? 24 : 28) }} />
            <div className="AssetManagement-stat-content">
              <div className="AssetManagement-stat-label">Available</div>
              <div className="AssetManagement-stat-value-wrapper">
                <span className="AssetManagement-stat-value">{stats.available}</span>
                {!isMobile && (
                  <span className="AssetManagement-stat-badge">
                    {stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Assigned */}
          <div className="AssetManagement-stat-card AssetManagement-stat-assigned">
            <div className="AssetManagement-stat-icon" dangerouslySetInnerHTML={{ __html: Icons.assignment_turned_in(isMobile ? 24 : 28) }} />
            <div className="AssetManagement-stat-content">
              <div className="AssetManagement-stat-label">Assigned</div>
              <div className="AssetManagement-stat-value-wrapper">
                <span className="AssetManagement-stat-value">{stats.assigned}</span>
                {!isMobile && (
                  <span className="AssetManagement-stat-badge">
                    {stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="AssetManagement-stat-card AssetManagement-stat-value">
            <div className="AssetManagement-stat-icon" dangerouslySetInnerHTML={{ __html: Icons.attach_money(isMobile ? 24 : 28) }} />
            <div className="AssetManagement-stat-content">
              <div className="AssetManagement-stat-label">Total Value</div>
              <div className="AssetManagement-stat-value-wrapper">
                <span className="AssetManagement-stat-value">{formatCurrency(stats.totalValue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="AssetManagement-paper">
        {/* Header Section */}
        <div className="AssetManagement-header">
          <div className="AssetManagement-title-section">
            <div className="AssetManagement-title-icon" dangerouslySetInnerHTML={{ __html: Icons.inventory(isMobile ? 24 : 28) }} />
            <div>
              <h2 className="AssetManagement-title">
                {isMobile ? 'Assets' : 'Asset Management'}
              </h2>
              {userInfo && !isMobile && (
                <div className="AssetManagement-user-info">
                  <span className="AssetManagement-user-chip">
                    <span dangerouslySetInnerHTML={{ __html: Icons.person(14) }} />
                    {userInfo.name}
                  </span>
                  <span className={`AssetManagement-role-chip ${isSuperAdmin ? 'AssetManagement-role-super' : 'AssetManagement-role-regular'}`}>
                    {userInfo.role}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="AssetManagement-header-actions">
            {/* Search Bar */}
            <div className="AssetManagement-search-wrapper">
              <span className="AssetManagement-search-icon" dangerouslySetInnerHTML={{ __html: Icons.search(isMobile ? 18 : 20) }} />
              <input
                type="text"
                className="AssetManagement-search-input"
                placeholder={isMobile ? "Search..." : "Search assets..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="AssetManagement-clear-search" onClick={handleClearSearch}>
                  <span dangerouslySetInnerHTML={{ __html: Icons.clear(isMobile ? 16 : 18) }} />
                </button>
              )}
            </div>
            
            {/* Category Filter */}
            <select 
              className="AssetManagement-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {ASSET_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select 
              className="AssetManagement-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {ASSET_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            
            {/* Add Asset Button */}
            {!isMobile && (
              <button
                className="AssetManagement-btn AssetManagement-btn-primary"
                onClick={() => {
                  setEditingAsset(null);
                  resetForm();
                  setOpenDialog(true);
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: Icons.add(18) }} />
                Add Asset
              </button>
            )}

            {/* Bulk Actions */}
            {bulkMode && selectedAssets.length > 0 && (
              <button
                className="AssetManagement-btn AssetManagement-btn-danger"
                onClick={handleBulkDelete}
              >
                <span dangerouslySetInnerHTML={{ __html: Icons.delete(18) }} />
                Delete ({selectedAssets.length})
              </button>
            )}
          </div>
        </div>


        {/* Quick Filters Tabs */}
        <div className="AssetManagement-tabs">
          <button 
            className={`AssetManagement-tab ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => handleTabChange(0)}
          >
            All Assets
          </button>
          <button 
            className={`AssetManagement-tab ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => handleTabChange(1)}
          >
            Available
          </button>
          <button 
            className={`AssetManagement-tab ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => handleTabChange(2)}
          >
            Assigned
          </button>
          <button 
            className={`AssetManagement-tab ${activeTab === 3 ? 'active' : ''}`}
            onClick={() => handleTabChange(3)}
          >
            Maintenance
          </button>
        </div>

        {/* Bulk Mode Toggle */}
        <div className="AssetManagement-bulk-toggle">
          <label className="AssetManagement-switch">
            <input
              type="checkbox"
              checked={bulkMode}
              onChange={(e) => {
                setBulkMode(e.target.checked);
                if (!e.target.checked) setSelectedAssets([]);
              }}
            />
            <span className="AssetManagement-switch-slider"></span>
          </label>
          <span className="AssetManagement-bulk-label">Bulk Mode</span>
        </div>

        {/* Table/List View */}
        {isMobile ? (
          // Mobile Card View
          <div className="AssetManagement-mobile-view">
            {filteredAssets.length === 0 ? (
              <div className="AssetManagement-empty-state">
                <div className="AssetManagement-empty-icon" dangerouslySetInnerHTML={{ __html: Icons.inventory(50) }} />
                <h3 className="AssetManagement-empty-title">No Assets Found</h3>
                <p className="AssetManagement-empty-message">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'No assets match your filters. Try adjusting your search criteria.'
                    : 'Get started by adding your first asset to inventory.'}
                </p>
                {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') ? (
                  <button 
                    className="AssetManagement-btn AssetManagement-btn-outline"
                    onClick={handleClearFilters}
                  >
                    <span dangerouslySetInnerHTML={{ __html: Icons.clear(18) }} />
                    Clear Filters
                  </button>
                ) : (
                  <button 
                    className="AssetManagement-btn AssetManagement-btn-primary"
                    onClick={() => {
                      setEditingAsset(null);
                      resetForm();
                      setOpenDialog(true);
                    }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: Icons.add(18) }} />
                    Add Asset
                  </button>
                )}
              </div>
            ) : (
              filteredAssets
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(asset => (
                  <div key={asset._id} className="AssetManagement-mobile-card">
                    <div className="AssetManagement-card-content">
                      <div className="AssetManagement-card-header">
                        {bulkMode && (
                          <input
                            type="checkbox"
                            className="AssetManagement-checkbox"
                            checked={selectedAssets.indexOf(asset._id) !== -1}
                            onChange={(e) => handleSelectOne(e, asset._id)}
                          />
                        )}
                        <div 
                          className="AssetManagement-status-indicator" 
                          style={{ backgroundColor: getStatusColor(asset.status) }}
                        ></div>
                        <div className="AssetManagement-card-icon" 
                          style={{ backgroundColor: `${getCategoryColor(asset.category)}20`, color: getCategoryColor(asset.category) }}
                          dangerouslySetInnerHTML={{ 
                            __html: Icons[getCategoryIcon(asset.category)] ? 
                              Icons[getCategoryIcon(asset.category)](26) : 
                              Icons.category(26) 
                          }} 
                        />
                        <div className="AssetManagement-card-info">
                          <div className="AssetManagement-card-title">{asset.name}</div>
                          <div className="AssetManagement-card-tags">
                            {asset.assetTag && (
                              <span className="AssetManagement-tag AssetManagement-tag-code">{asset.assetTag}</span>
                            )}
                            <span className="AssetManagement-tag" style={{ 
                              backgroundColor: `${getStatusColor(asset.status)}20`,
                              color: getStatusColor(asset.status)
                            }}>
                              {asset.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="AssetManagement-card-details">
                        <div className="AssetManagement-detail-row">
                          <span className="AssetManagement-detail-label">Model:</span>
                          <span className="AssetManagement-detail-value">{asset.model || '—'}</span>
                        </div>
                        <div className="AssetManagement-detail-row">
                          <span className="AssetManagement-detail-label">Serial:</span>
                          <span className="AssetManagement-detail-value">{asset.serialNumber || '—'}</span>
                        </div>
                        <div className="AssetManagement-detail-row">
                          <span className="AssetManagement-detail-label">Location:</span>
                          <span className="AssetManagement-detail-value">{asset.location || '—'}</span>
                        </div>
                      </div>

                      {asset.assignedTo && (
                        <div className="AssetManagement-assignment-info">
                          <span dangerouslySetInnerHTML={{ __html: Icons.person(16) }} />
                          <div>
                            <div className="AssetManagement-assignee-name">{asset.assignedTo.name}</div>
                            {asset.assignedTo.department && (
                              <div className="AssetManagement-assignee-dept">
                                {asset.assignedTo.department.name || asset.assignedTo.department}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="AssetManagement-card-footer">
                        <div className="AssetManagement-meta">
                          {asset.purchaseDate && (
                            <div className="AssetManagement-meta-item">
                              <span dangerouslySetInnerHTML={{ __html: Icons.today(14) }} />
                              <span>{formatDate(asset.purchaseDate)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="AssetManagement-card-actions">
                          <button 
                            className="AssetManagement-icon-btn AssetManagement-icon-btn-info" 
                            onClick={() => handleViewHistory(asset)}
                            title="View History"
                          >
                            <span dangerouslySetInnerHTML={{ __html: Icons.history(18) }} />
                          </button>
                          <button 
                            className="AssetManagement-icon-btn AssetManagement-icon-btn-primary" 
                            onClick={() => handleEdit(asset)}
                            title="Edit"
                          >
                            <span dangerouslySetInnerHTML={{ __html: Icons.edit(18) }} />
                          </button>
                          <button 
                            className="AssetManagement-icon-btn AssetManagement-icon-btn-more" 
                            onClick={(e) => handleMenuOpen(e, asset)}
                            title="More"
                          >
                            <span dangerouslySetInnerHTML={{ __html: Icons.more_vert(18) }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          // Desktop Table View
          <div className="AssetManagement-table-container">
            <table className="AssetManagement-table">
              <thead>
                <tr>
                  {bulkMode && (
                    <th className="AssetManagement-table-checkbox">
                      <input
                        type="checkbox"
                        className="AssetManagement-checkbox"
                        checked={filteredAssets.length > 0 && selectedAssets.length === filteredAssets.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Serial/Model</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Location</th>
                  <th>Purchase Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={bulkMode ? 10 : 9} className="AssetManagement-empty-cell">
                      <div className="AssetManagement-empty-state">
                        <div className="AssetManagement-empty-icon" dangerouslySetInnerHTML={{ __html: Icons.inventory(50) }} />
                        <h3 className="AssetManagement-empty-title">No Assets Found</h3>
                        <p className="AssetManagement-empty-message">
                          {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                            ? 'No assets match your filters'
                            : 'Get started by adding an asset'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssets
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(asset => {
                      const categoryColor = getCategoryColor(asset.category);
                      const statusColor = getStatusColor(asset.status);
                      
                      return (
                        <tr key={asset._id} className="AssetManagement-table-row">
                          {bulkMode && (
                            <td className="AssetManagement-table-checkbox">
                              <input
                                type="checkbox"
                                className="AssetManagement-checkbox"
                                checked={selectedAssets.indexOf(asset._id) !== -1}
                                onChange={(e) => handleSelectOne(e, asset._id)}
                              />
                            </td>
                          )}
                          <td>
                            <div className="AssetManagement-asset-name">
                              <div className="AssetManagement-asset-icon" style={{ 
                                backgroundColor: `${categoryColor}20`,
                                color: categoryColor
                              }} dangerouslySetInnerHTML={{ 
                                __html: Icons[getCategoryIcon(asset.category)] ? 
                                  Icons[getCategoryIcon(asset.category)](20) : 
                                  Icons.category(20) 
                              }} />
                              <div>
                                <div className="AssetManagement-asset-title">{asset.name}</div>
                                <div className="AssetManagement-asset-subtitle">{asset.assetTag || 'No tag'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="AssetManagement-chip" style={{ 
                              backgroundColor: `${categoryColor}20`,
                              color: categoryColor
                            }}>
                              {asset.category}
                            </span>
                          </td>
                          <td>
                            <div className="AssetManagement-asset-detail">
                              <div>{asset.model || '—'}</div>
                              <div className="AssetManagement-asset-subtitle">SN: {asset.serialNumber || '—'}</div>
                            </div>
                          </td>
                          <td>
                            <span className="AssetManagement-chip" style={{ 
                              backgroundColor: `${statusColor}20`,
                              color: statusColor
                            }}>
                              {asset.status}
                            </span>
                            {asset.condition && (
                              <div className="AssetManagement-asset-subtitle" style={{ marginTop: 4 }}>
                                Condition: {asset.condition}
                              </div>
                            )}
                          </td>
                          <td>
                            {asset.assignedTo ? (
                              <div>
                                <div className="AssetManagement-assignee-name">{asset.assignedTo.name}</div>
                                <div className="AssetManagement-asset-subtitle">
                                  {asset.assignedTo.department?.name || asset.assignedTo.department || '—'}
                                </div>
                              </div>
                            ) : (
                              <span className="AssetManagement-text-muted">Not assigned</span>
                            )}
                          </td>
                          <td>
                            <span>{asset.location || '—'}</span>
                          </td>
                          <td>
                            <div className="AssetManagement-asset-value">{formatCurrency(asset.purchaseCost)}</div>
                            {asset.purchaseDate && (
                              <div className="AssetManagement-asset-subtitle">{formatDate(asset.purchaseDate)}</div>
                            )}
                          </td>
                          <td>
                            <div className="AssetManagement-action-buttons">
                              <button 
                                className="AssetManagement-action-btn AssetManagement-action-assign"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setFormData(prev => ({
                                    ...prev,
                                    assignedTo: null,
                                    department: '',
                                    notes: ''
                                  }));
                                  setOpenAssignDialog(true);
                                }}
                                disabled={asset.status !== 'available'}
                                title="Assign"
                              >
                                <span dangerouslySetInnerHTML={{ __html: Icons.assignment_turned_in(18) }} />
                              </button>
                              <button 
                                className="AssetManagement-action-btn AssetManagement-action-maintenance"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setFormData(prev => ({
                                    ...prev,
                                    maintenanceType: 'scheduled',
                                    scheduledDate: '',
                                    notes: '',
                                    maintenanceCost: '',
                                    vendor: ''
                                  }));
                                  setOpenMaintenanceDialog(true);
                                }}
                                title="Maintenance"
                              >
                                <span dangerouslySetInnerHTML={{ __html: Icons.build(18) }} />
                              </button>
                              <button 
                                className="AssetManagement-action-btn AssetManagement-action-history"
                                onClick={() => handleViewHistory(asset)}
                                title="History"
                              >
                                <span dangerouslySetInnerHTML={{ __html: Icons.history(18) }} />
                              </button>
                              <button 
                                className="AssetManagement-action-btn AssetManagement-action-edit"
                                onClick={() => handleEdit(asset)}
                                title="Edit"
                              >
                                <span dangerouslySetInnerHTML={{ __html: Icons.edit(18) }} />
                              </button>
                              {asset.status === 'assigned' && (
                                <button 
                                  className="AssetManagement-action-btn AssetManagement-action-return"
                                  onClick={() => handleReturn(asset._id)}
                                  title="Return"
                                >
                                  <span dangerouslySetInnerHTML={{ __html: Icons.assignment_return(18) }} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredAssets.length > 0 && (
          <div className="AssetManagement-pagination">
            <div className="AssetManagement-pagination-info">
              {isMobile ? (
                <span>{page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredAssets.length)} of {filteredAssets.length}</span>
              ) : (
                <span>Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredAssets.length)} of {filteredAssets.length} entries</span>
              )}
            </div>
            <div className="AssetManagement-pagination-controls">
              {!isMobile && (
                <select 
                  className="AssetManagement-rows-per-page"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              )}
              <div className="AssetManagement-pagination-buttons">
                <button 
                  className="AssetManagement-pagination-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                >
                  {isMobile ? '‹' : 'Previous'}
                </button>
                <span className="AssetManagement-pagination-current">
                  {isMobile ? page + 1 : `Page ${page + 1}`}
                </span>
                <button 
                  className="AssetManagement-pagination-btn"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(filteredAssets.length / rowsPerPage) - 1}
                >
                  {isMobile ? '›' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <button
            className="AssetManagement-fab"
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: Icons.add(28) }} />
          </button>
        )}

        {/* Options Menu */}
        {showMenu && (
          <div 
            className="AssetManagement-menu-overlay"
            onClick={handleMenuClose}
          >
            <div 
              className="AssetManagement-menu"
              style={{
                top: Math.min(menuPosition.top, window.innerHeight - 200),
                left: Math.min(menuPosition.left, window.innerWidth - 220)
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="AssetManagement-menu-item" onClick={() => {
                setSelectedAsset(selectedAssetMenu);
                setFormData(prev => ({
                  ...prev,
                  assignedTo: null,
                  department: '',
                  notes: ''
                }));
                setOpenAssignDialog(true);
                handleMenuClose();
              }}>
                <span className="AssetManagement-menu-icon AssetManagement-menu-icon-primary" 
                  dangerouslySetInnerHTML={{ __html: Icons.assignment_turned_in(18) }} />
                <div className="AssetManagement-menu-content">
                  <span className="AssetManagement-menu-title">Assign Asset</span>
                </div>
              </div>
              <div className="AssetManagement-menu-divider"></div>
              <div className="AssetManagement-menu-item" onClick={() => {
                setSelectedAsset(selectedAssetMenu);
                setFormData(prev => ({
                  ...prev,
                  maintenanceType: 'scheduled',
                  scheduledDate: '',
                  notes: '',
                  maintenanceCost: '',
                  vendor: ''
                }));
                setOpenMaintenanceDialog(true);
                handleMenuClose();
              }}>
                <span className="AssetManagement-menu-icon AssetManagement-menu-icon-warning" 
                  dangerouslySetInnerHTML={{ __html: Icons.build(18) }} />
                <div className="AssetManagement-menu-content">
                  <span className="AssetManagement-menu-title">Schedule Maintenance</span>
                </div>
              </div>
              <div className="AssetManagement-menu-item" onClick={() => {
                handleViewHistory(selectedAssetMenu);
                handleMenuClose();
              }}>
                <span className="AssetManagement-menu-icon AssetManagement-menu-icon-info" 
                  dangerouslySetInnerHTML={{ __html: Icons.history(18) }} />
                <div className="AssetManagement-menu-content">
                  <span className="AssetManagement-menu-title">View History</span>
                </div>
              </div>
              <div className="AssetManagement-menu-divider"></div>
              <div className="AssetManagement-menu-item" onClick={() => {
                handleEdit(selectedAssetMenu);
                handleMenuClose();
              }}>
                <span className="AssetManagement-menu-icon AssetManagement-menu-icon-primary" 
                  dangerouslySetInnerHTML={{ __html: Icons.edit(18) }} />
                <div className="AssetManagement-menu-content">
                  <span className="AssetManagement-menu-title">Edit</span>
                </div>
              </div>
              <div className="AssetManagement-menu-item" onClick={() => {
                handleDelete(selectedAssetMenu?._id);
                handleMenuClose();
              }}>
                <span className="AssetManagement-menu-icon AssetManagement-menu-icon-danger" 
                  dangerouslySetInnerHTML={{ __html: Icons.delete(18) }} />
                <div className="AssetManagement-menu-content">
                  <span className="AssetManagement-menu-title">Delete</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Asset Dialog */}
      {openDialog && (
        <div className="AssetManagement-modal-overlay" onClick={() => !loading && setOpenDialog(false)}>
          <div 
            className={`AssetManagement-modal ${isMobile ? 'AssetManagement-modal-fullscreen' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="AssetManagement-modal-header">
              <div className="AssetManagement-modal-header-content">
                <div className="AssetManagement-modal-icon" 
                  dangerouslySetInnerHTML={{ __html: editingAsset ? Icons.edit(isMobile ? 22 : 26) : Icons.add(isMobile ? 22 : 26) }} />
                <div>
                  <h3 className="AssetManagement-modal-title">
                    {editingAsset ? 'Edit Asset' : 'Add New Asset'}
                  </h3>
                  {!isMobile && (
                    <p className="AssetManagement-modal-subtitle">
                      {editingAsset ? 'Update asset information' : 'Add a new asset to inventory'}
                    </p>
                  )}
                </div>
              </div>
              <button 
                className="AssetManagement-modal-close"
                onClick={() => setOpenDialog(false)}
                disabled={loading}
              >
                <span dangerouslySetInnerHTML={{ __html: Icons.clear(isMobile ? 18 : 20) }} />
              </button>
            </div>

            <div className="AssetManagement-modal-body">
              {/* Basic Information */}
              <h4 className="AssetManagement-section-title">Basic Information</h4>
              
              <div className="AssetManagement-form-grid">
                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Asset Name *</label>
                  <div className="AssetManagement-input-wrapper">
                    <span className="AssetManagement-input-icon" dangerouslySetInnerHTML={{ __html: Icons.inventory(isMobile ? 18 : 20) }} />
                    <input
                      type="text"
                      className="AssetManagement-form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter asset name"
                    />
                  </div>
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Category </label>
                  <select
                    className="AssetManagement-form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    {ASSET_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Model</label>
                  <input
                    type="text"
                    className="AssetManagement-form-input"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="Enter model"
                  />
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Serial Number </label>
                  <input
                    type="text"
                    className="AssetManagement-form-input"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                    placeholder="Enter serial number"
                  />
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Asset Tag</label>
                  <input
                    type="text"
                    className="AssetManagement-form-input"
                    value={formData.assetTag}
                    onChange={(e) => setFormData({...formData, assetTag: e.target.value})}
                    placeholder="Auto-generated if left blank"
                  />
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Condition</label>
                  <select
                    className="AssetManagement-form-select"
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  >
                    {CONDITION_TYPES.map(cond => (
                      <option key={cond.value} value={cond.value}>{cond.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <h4 className="AssetManagement-section-title">Purchase Information</h4>

              <div className="AssetManagement-form-grid">
                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Purchase Date</label>
                  <input
                    type="date"
                    className="AssetManagement-form-input"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  />
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Purchase Cost</label>
                  <div className="AssetManagement-input-wrapper">
                    <span className="AssetManagement-input-icon">$</span>
                    <input
                      type="number"
                      className="AssetManagement-form-input"
                      value={formData.purchaseCost}
                      onChange={(e) => setFormData({...formData, purchaseCost: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Warranty Expiry</label>
                  <input
                    type="date"
                    className="AssetManagement-form-input"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData({...formData, warrantyExpiry: e.target.value})}
                  />
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Supplier</label>
                  <input
                    type="text"
                    className="AssetManagement-form-input"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="Enter supplier"
                  />
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Manufacturer</label>
                  <input
                    type="text"
                    className="AssetManagement-form-input"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    placeholder="Enter manufacturer"
                  />
                </div>
              </div>

              <h4 className="AssetManagement-section-title">Location & Assignment</h4>

              <div className="AssetManagement-form-grid">
                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Location</label>
                  <input
                    type="text"
                    className="AssetManagement-form-input"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Building A, Floor 3"
                  />
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Department</label>
                  <select
                    className="AssetManagement-form-select"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">None</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="AssetManagement-form-group">
                  <label className="AssetManagement-form-label">Initial Status</label>
                  <select
                    className="AssetManagement-form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {ASSET_STATUS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div className="AssetManagement-form-group AssetManagement-form-group-full">
                  <label className="AssetManagement-form-label">Description</label>
                  <textarea
                    className="AssetManagement-form-textarea"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Additional details about the asset"
                  />
                </div>

                <div className="AssetManagement-form-group AssetManagement-form-group-full">
                  <label className="AssetManagement-form-label">Notes</label>
                  <textarea
                    className="AssetManagement-form-textarea"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Internal notes (not visible to employees)"
                  />
                </div>
              </div>
            </div>

            <div className="AssetManagement-modal-footer">
              <button 
                className="AssetManagement-btn AssetManagement-btn-secondary"
                onClick={() => setOpenDialog(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="AssetManagement-btn AssetManagement-btn-primary"
                onClick={handleSubmit}
                disabled={loading || !formData.name }
              >
                {loading ? (
                  <>
                    <span className="AssetManagement-spinner"></span>
                    {isMobile ? 'Saving' : 'Saving...'}
                  </>
                ) : (
                  editingAsset ? (isMobile ? 'Update' : 'Update Asset') : (isMobile ? 'Create' : 'Create Asset')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Asset Dialog */}
      {openAssignDialog && (
        <div className="AssetManagement-modal-overlay" onClick={() => !loading && setOpenAssignDialog(false)}>
          <div 
            className="AssetManagement-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="AssetManagement-modal-header" style={{ background: 'linear-gradient(145deg, #2196f3 0%, #1976d2 100%)' }}>
              <div className="AssetManagement-modal-header-content">
                <div className="AssetManagement-modal-icon" dangerouslySetInnerHTML={{ __html: Icons.assignment_turned_in(24) }} />
                <div>
                  <h3 className="AssetManagement-modal-title">Assign Asset</h3>
                  <p className="AssetManagement-modal-subtitle">{selectedAsset?.name}</p>
                </div>
              </div>
              <button 
                className="AssetManagement-modal-close"
                onClick={() => setOpenAssignDialog(false)}
                disabled={loading}
              >
                <span dangerouslySetInnerHTML={{ __html: Icons.clear(20) }} />
              </button>
            </div>

            <div className="AssetManagement-modal-body">
              {/* Employee Assignment */}
              <div className="AssetManagement-form-group">
                <label className="AssetManagement-form-label">Assign To Employee</label>
                <select
                  className="AssetManagement-form-select"
                  value={formData.assignedTo || ''}
                  onChange={(e) => setFormData({
                    ...formData, 
                    assignedTo: e.target.value,
                    department: ''
                  })}
                >
                  <option value="">None</option>
                  {loadingEmployees ? (
                    <option value="" disabled>Loading employees...</option>
                  ) : employees.length > 0 ? (
                    employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.departmentName ? `- ${emp.departmentName}` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No employees available</option>
                  )}
                </select>
                <p className="AssetManagement-form-helper">Select an employee to assign this asset</p>
              </div>

              <div className="AssetManagement-form-divider">OR</div>

              {/* Department Assignment */}
              <div className="AssetManagement-form-group">
                <label className="AssetManagement-form-label">Assign to Department</label>
                <select
                  className="AssetManagement-form-select"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({
                    ...formData, 
                    department: e.target.value,
                    assignedTo: null
                  })}
                >
                  <option value="">None</option>
                  {departments.length > 0 ? (
                    departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>No departments available</option>
                  )}
                </select>
                <p className="AssetManagement-form-helper">Or assign to a department directly</p>
              </div>

              {/* Assignment Notes */}
              <div className="AssetManagement-form-group">
                <label className="AssetManagement-form-label">Assignment Notes</label>
                <textarea
                  className="AssetManagement-form-textarea"
                  rows="3"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Add any notes about this assignment (e.g., purpose, duration, etc.)"
                />
              </div>

              {/* Assignment Summary */}
              {(formData.assignedTo || formData.department) && (
                <div className="AssetManagement-summary-box">
                  <h4 className="AssetManagement-summary-title">Assignment Summary</h4>
                  <div className="AssetManagement-summary-content">
                    <p><strong>Asset:</strong> {selectedAsset?.name}</p>
                    <p><strong>Assigned to:</strong> {
                      formData.assignedTo 
                        ? employees.find(e => e._id === formData.assignedTo)?.name 
                        : departments.find(d => d._id === formData.department)?.name
                    }</p>
                    <p><strong>Type:</strong> {formData.assignedTo ? 'Individual' : 'Department'}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="AssetManagement-modal-footer">
              <button 
                className="AssetManagement-btn AssetManagement-btn-secondary"
                onClick={() => {
                  setOpenAssignDialog(false);
                  setFormData(prev => ({
                    ...prev,
                    assignedTo: null,
                    department: '',
                    notes: ''
                  }));
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="AssetManagement-btn AssetManagement-btn-primary"
                onClick={handleAssign}
                disabled={loading || (!formData.assignedTo && !formData.department)}
              >
                {loading ? (
                  <>
                    <span className="AssetManagement-spinner"></span>
                    Assigning...
                  </>
                ) : (
                  'Assign Asset'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Dialog */}
      {openMaintenanceDialog && (
        <div className="AssetManagement-modal-overlay" onClick={() => !loading && setOpenMaintenanceDialog(false)}>
          <div 
            className="AssetManagement-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="AssetManagement-modal-header" style={{ background: 'linear-gradient(145deg, #ff9800 0%, #f57c00 100%)' }}>
              <div className="AssetManagement-modal-header-content">
                <div className="AssetManagement-modal-icon" dangerouslySetInnerHTML={{ __html: Icons.build(24) }} />
                <div>
                  <h3 className="AssetManagement-modal-title">Schedule Maintenance</h3>
                  <p className="AssetManagement-modal-subtitle">{selectedAsset?.name}</p>
                </div>
              </div>
              <button 
                className="AssetManagement-modal-close"
                onClick={() => setOpenMaintenanceDialog(false)}
                disabled={loading}
              >
                <span dangerouslySetInnerHTML={{ __html: Icons.clear(20) }} />
              </button>
            </div>

            <div className="AssetManagement-modal-body">
              <div className="AssetManagement-form-group">
                <label className="AssetManagement-form-label">Maintenance Type</label>
                <select
                  className="AssetManagement-form-select"
                  value={formData.maintenanceType || 'scheduled'}
                  onChange={(e) => setFormData({...formData, maintenanceType: e.target.value})}
                >
                  <option value="scheduled">Scheduled Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="calibration">Calibration</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div className="AssetManagement-form-group">
                <label className="AssetManagement-form-label">Scheduled Date</label>
                <input
                  type="date"
                  className="AssetManagement-form-input"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                />
              </div>

              <div className="AssetManagement-form-group">
                <label className="AssetManagement-form-label">Maintenance Description *</label>
                <textarea
                  className="AssetManagement-form-textarea"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Describe the maintenance required"
                />
              </div>

              <div className="AssetManagement-form-group">
                <label className="AssetManagement-form-label">Estimated Cost</label>
                <div className="AssetManagement-input-wrapper">
                  <span className="AssetManagement-input-icon">$</span>
                  <input
                    type="number"
                    className="AssetManagement-form-input"
                    value={formData.maintenanceCost}
                    onChange={(e) => setFormData({...formData, maintenanceCost: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="AssetManagement-form-group">
                <label className="AssetManagement-form-label">Service Vendor</label>
                <input
                  type="text"
                  className="AssetManagement-form-input"
                  value={formData.vendor}
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  placeholder="Company performing the maintenance"
                />
              </div>
            </div>

            <div className="AssetManagement-modal-footer">
              <button 
                className="AssetManagement-btn AssetManagement-btn-secondary"
                onClick={() => {
                  setOpenMaintenanceDialog(false);
                  setFormData(prev => ({
                    ...prev,
                    maintenanceType: 'scheduled',
                    scheduledDate: '',
                    notes: '',
                    maintenanceCost: '',
                    vendor: ''
                  }));
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="AssetManagement-btn" 
                style={{ background: 'linear-gradient(145deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}
                onClick={handleMaintenance}
                disabled={loading || !formData.notes}
              >
                {loading ? (
                  <>
                    <span className="AssetManagement-spinner"></span>
                    Scheduling...
                  </>
                ) : (
                  'Schedule Maintenance'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Dialog */}
      {openHistoryDialog && (
        <div className="AssetManagement-modal-overlay" onClick={() => setOpenHistoryDialog(false)}>
          <div 
            className="AssetManagement-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="AssetManagement-modal-header" style={{ background: 'linear-gradient(145deg, #00bcd4 0%, #0097a7 100%)' }}>
              <div className="AssetManagement-modal-header-content">
                <div className="AssetManagement-modal-icon" dangerouslySetInnerHTML={{ __html: Icons.history(24) }} />
                <div>
                  <h3 className="AssetManagement-modal-title">Asset History</h3>
                  <p className="AssetManagement-modal-subtitle">{selectedAsset?.name}</p>
                </div>
              </div>
              <button 
                className="AssetManagement-modal-close"
                onClick={() => setOpenHistoryDialog(false)}
              >
                <span dangerouslySetInnerHTML={{ __html: Icons.clear(20) }} />
              </button>
            </div>

            <div className="AssetManagement-modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {selectedAsset?.history?.length > 0 || selectedAsset?.maintenanceRecords?.length > 0 ? (
                <div className="AssetManagement-timeline">
                  {[...(selectedAsset.history || []), ...(selectedAsset.maintenanceRecords || [])]
                    .sort((a, b) => new Date(b.date || b.scheduledDate) - new Date(a.date || a.scheduledDate))
                    .map((event, index) => {
                      const isMaintenance = event.type || event.maintenanceType;
                      const date = event.date || event.scheduledDate;
                      const title = event.action || event.type || 'Maintenance';
                      const description = event.description || event.notes || 'No description';
                      
                      return (
                        <div key={index} className="AssetManagement-timeline-item">
                          <div className={`AssetManagement-timeline-dot ${isMaintenance ? 'warning' : 'info'}`}></div>
                          <div className="AssetManagement-timeline-content">
                            <div className="AssetManagement-timeline-header">
                              <h4 className="AssetManagement-timeline-title">{title}</h4>
                              <span className="AssetManagement-timeline-date">{formatDate(date)}</span>
                            </div>
                            <p className="AssetManagement-timeline-description">{description}</p>
                            {event.performedBy && (
                              <p className="AssetManagement-timeline-meta"><strong>By:</strong> {event.performedBy.name}</p>
                            )}
                            {event.cost > 0 && (
                              <p className="AssetManagement-timeline-meta"><strong>Cost:</strong> {formatCurrency(event.cost)}</p>
                            )}
                            {event.vendor && (
                              <p className="AssetManagement-timeline-meta"><strong>Vendor:</strong> {event.vendor}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="AssetManagement-empty-state" style={{ padding: '48px 24px' }}>
                  <div className="AssetManagement-empty-icon" dangerouslySetInnerHTML={{ __html: Icons.history(64) }} />
                  <h3 className="AssetManagement-empty-title">No History Available</h3>
                  <p className="AssetManagement-empty-message">
                    This asset doesn't have any history or maintenance records yet.
                  </p>
                </div>
              )}
            </div>

            <div className="AssetManagement-modal-footer">
              <button 
                className="AssetManagement-btn AssetManagement-btn-primary"
                onClick={() => setOpenHistoryDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;