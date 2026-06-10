import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  styled,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Divider,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
  Collapse,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  EventNote as EventNoteIcon,
  Computer as ComputerIcon,
  LogoutOutlined,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Task as TaskIcon,
  MeetingRoom as MeetingRoomIcon,
  Groups as GroupsIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  ListAlt as ListAltIcon,
  ExpandMore,
  ExpandLess,
  CreditCard as CreditCardIcon,
  Folder as FolderIcon,
  SupportAgent as SupportAgentIcon,
} from '@mui/icons-material';
import Swal from "sweetalert2";
import axiosInstance from '../utils/axiosConfig';

const drawerWidthOpen = 260;
const drawerWidthClosed = 70;

const getRecordId = value => {
  if (!value) return '';
  if (typeof value === 'object') {
    return value._id || value.id || value.value || '';
  }
  return value;
};

const SidebarContainer = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  height: 'calc(100vh - 64px)',
  position: 'fixed',
  top: 64,
  left: 0,
  zIndex: theme.zIndex.drawer,
  overflowY: 'auto',
  overflowX: 'hidden',
  transition: 'width 0.3s ease, transform 0.3s ease',
  '&::-webkit-scrollbar': { 
    width: 6,
    display: 'none'
  },
  '&:hover::-webkit-scrollbar': {
    display: 'block'
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.action.hover,
    borderRadius: 3,
  },
}));

const MobileSidebarContainer = styled(Box)(({ theme }) => ({
  width: drawerWidthOpen,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  height: 'calc(100vh - 64px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': { 
    width: 6,
    display: 'none'
  },
  '&:hover::-webkit-scrollbar': {
    display: 'block'
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.action.hover,
    borderRadius: 3,
  },
}));

const StyledListItem = styled(ListItem)({
  padding: 0,
});

const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
  minHeight: 48,
  justifyContent: 'initial',
  padding: theme.spacing(1, 2),
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  borderRight: selected ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
  margin: theme.spacing(0.2, 1),
  borderRadius: 8,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(2px)',
    transition: 'all 0.2s ease',
  },
  '& .MuiListItemIcon-root': {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  },
}));

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: 0,
  marginRight: theme.spacing(2),
  color: 'inherit',
  fontSize: '1.1rem',
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.5, 2, 1),
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  fontWeight: 600,
  letterSpacing: '0.5px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  margin: theme.spacing(0, 1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const CollapsedHeading = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  margin: theme.spacing(0, 1),
  display: 'flex',
  justifyContent: 'center',
}));

// ✅ ICON MAPPING
const iconMap = {
  'Dashboard': DashboardIcon,
  'dashboard': DashboardIcon,
  'Calendar': CalendarIcon,
  'CalendarToday': CalendarIcon,
  'calendar': CalendarIcon,
  'calendartoday': CalendarIcon,
  'Event': EventNoteIcon,
  'EventNote': EventNoteIcon,
  'event': EventNoteIcon,
  'eventnote': EventNoteIcon,
  'Computer': ComputerIcon,
  'computer': ComputerIcon,
  'Notifications': NotificationsIcon,
  'notifications': NotificationsIcon,
  'Alert': NotificationsIcon,
  'alert': NotificationsIcon,
  'Person': PersonIcon,
  'person': PersonIcon,
  'Task': TaskIcon,
  'task': TaskIcon,
  'ListAlt': ListAltIcon,
  'listalt': ListAltIcon,
  'MeetingRoom': MeetingRoomIcon,
  'meetingroom': MeetingRoomIcon,
  'VideoCall': VideoCallIcon,
  'videocall': VideoCallIcon,
  'Meeting': VideoCallIcon,
  'meeting': VideoCallIcon,
  'Groups': GroupsIcon,
  'groups': GroupsIcon,
  'Chat': ChatIcon,
  'chat': ChatIcon,
  'ProjectIcon': GroupsIcon,
  'projecticon': GroupsIcon,
  'Project': GroupsIcon,
  'project': GroupsIcon,
  'Settings': SettingsIcon,
  'settings': SettingsIcon,
  'Logout': LogoutOutlined,
  'logout': LogoutOutlined,
  'CreditCard': CreditCardIcon,
  'creditcard': CreditCardIcon,
  'Payment': CreditCardIcon,
  'payment': CreditCardIcon,
  'Folder': FolderIcon,
  'folder': FolderIcon,
  'Services': FolderIcon,
  'services': FolderIcon,
  'Support': SupportAgentIcon,
  'support': SupportAgentIcon,
  'SupportAgent': SupportAgentIcon,
  'supportagent': SupportAgentIcon,
};

// ✅ Get icon component
const getIconComponent = (iconName) => {
  if (!iconName) {
    return <DashboardIcon />;
  }
  
  let IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    const lowerIconName = iconName.toLowerCase();
    IconComponent = Object.keys(iconMap).find(key => 
      key.toLowerCase() === lowerIconName
    ) ? iconMap[Object.keys(iconMap).find(key => 
      key.toLowerCase() === lowerIconName
    )] : null;
  }
  
  if (!IconComponent) {
    if (iconName.toLowerCase().includes('calendar') || iconName.toLowerCase().includes('attendance')) {
      IconComponent = CalendarIcon;
    } else if (iconName.toLowerCase().includes('event') || iconName.toLowerCase().includes('leave')) {
      IconComponent = EventNoteIcon;
    } else if (iconName.toLowerCase().includes('dashboard')) {
      IconComponent = DashboardIcon;
    } else if (iconName.toLowerCase().includes('computer') || iconName.toLowerCase().includes('asset')) {
      IconComponent = ComputerIcon;
    } else if (iconName.toLowerCase().includes('notification') || iconName.toLowerCase().includes('alert')) {
      IconComponent = NotificationsIcon;
    } else if (iconName.toLowerCase().includes('person') || iconName.toLowerCase().includes('employee')) {
      IconComponent = PersonIcon;
    } else if (iconName.toLowerCase().includes('task')) {
      IconComponent = TaskIcon;
    } else if (iconName.toLowerCase().includes('meeting')) {
      IconComponent = VideoCallIcon;
    } else if (iconName.toLowerCase().includes('project')) {
      IconComponent = GroupsIcon;
    } else if (iconName.toLowerCase().includes('settings') || iconName.toLowerCase().includes('password')) {
      IconComponent = SettingsIcon;
    } else if (iconName.toLowerCase().includes('credit') || iconName.toLowerCase().includes('payment')) {
      IconComponent = CreditCardIcon;
    } else if (iconName.toLowerCase().includes('folder') || iconName.toLowerCase().includes('service')) {
      IconComponent = FolderIcon;
    } else if (iconName.toLowerCase().includes('support')) {
      IconComponent = SupportAgentIcon;
    } else {
      IconComponent = DashboardIcon;
    }
  }
  
  return <IconComponent />;
};

// ✅ FIXED DEFAULT MENU ITEMS
const fixedDefaultItems = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'Dashboard',
    path: '/ciisUser/user-dashboard',
    category: 'main',
    order: 1
  },
  {
    id: 'attendance',
    name: 'Attendance',
    icon: 'Calendar',
    path: '/ciisUser/attendance',
    category: 'main',
    order: 2
  },
  {
    id: 'my-leaves',
    name: 'My Leaves',
    icon: 'Event',
    path: '/ciisUser/my-leaves',
    category: 'main',
    order: 3
  },
  {
    id: 'my-assets',
    name: 'My Assets',
    icon: 'Computer',
    path: '/ciisUser/my-assets',
    category: 'main',
    order: 4
  },
  {
    id: 'profile',
    name: 'My Details',
    icon: 'Person',
    path: '/ciisUser/profile',
    category: 'main',
    order: 5
  },
  {
    id: 'change-password',
    name: 'Change Password',
    icon: 'Settings',
    path: '/ciisUser/change-password',
    category: 'main',
    order: 6
  },
  {
    id: 'chat',
    name: 'Chat',
    icon: 'Chat',
    path: '/ciisUser/chat',
    category: 'communication',
    order: 7
  },
  {
    id: 'contact-support',
    name: 'Support Center',
    icon: 'Support',
    path: '/ciisUser/contact-support',
    category: 'communication',
    order: 8
  },
  {
    id: 'support-desk',
    name: 'Support Desk',
    icon: 'Support',
    path: '/ciisUser/support-desk',
    category: 'communication',
    order: 9
  }
];

// ✅ CLIENT MENU ITEMS - Sirf 3 pages client ke liye
const clientMenuItems = [
  {
    id: 'client-dashboard',
    name: 'Dashboard',
    icon: 'Dashboard',
    path: '/client/dashboard',
    category: 'main',
    order: 1
  },
  {
    id: 'client-payment',
    name: 'Payment',
    icon: 'CreditCard',
    path: '/client/payment',
    category: 'main',
    order: 2
  },
  {
    id: 'client-services-tasks',
    name: 'Services & Tasks',
    icon: 'Folder',
    path: '/client/services-tasks',
    category: 'main',
    order: 3
  },
  {
    id: 'change-password',
    name: 'Change Password',
    icon: 'Key',
    path: '/client/change-password',
    category: 'main',
    order: 4
  }
];

// ✅ ALL PAGES MENU ITEMS (for super_admin with Management department)
const allPagesItems = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'Dashboard',
    path: '/ciisUser/user-dashboard',
    category: 'main',
    order: 1
  },
  {
    id: 'attendance',
    name: 'Attendance',
    icon: 'Calendar',
    path: '/ciisUser/attendance',
    category: 'main',
    order: 2
  },
  {
    id: 'my-leaves',
    name: 'My Leaves',
    icon: 'Event',
    path: '/ciisUser/my-leaves',
    category: 'main',
    order: 3
  },
  {
    id: 'my-assets',
    name: 'My Assets',
    icon: 'Computer',
    path: '/ciisUser/my-assets',
    category: 'main',
    order: 4
  },
  {
    id: 'alerts',
    name: 'Alerts',
    icon: 'Notifications',
    path: '/ciisUser/alert',
    category: 'communication',
    order: 5
  },
  {
    id: 'profile',
    name: 'My Details',
    icon: 'Person',
    path: '/ciisUser/profile',
    category: 'main',
    order: 6
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: 'Groups',
    path: '/ciisUser/project',
    category: 'projects',
    order: 7
  },
  {
    id: 'employee-details',
    name: 'Employee Details',
    icon: 'Person',
    path: '/ciisUser/emp-details',
    category: 'administration',
    order: 8
  },
  {
    id: 'SidebarManagement',
    name: 'Sidebar Management',
    icon: 'Settings',
    path: '/ciisUser/SidebarManagement',
    category: 'administration',
    order: 9
  },
  {
    id: 'employee-leaves',
    name: 'Employee Leaves',
    icon: 'Event',
    path: '/ciisUser/emp-leaves',
    category: 'administration',
    order: 10
  },
  {
    id: 'employee-assets',
    name: 'Employee Assets',
    icon: 'Computer',
    path: '/ciisUser/emp-assets',
    category: 'administration',
    order: 11
  },
  {
    id: 'employee-attendance',
    name: 'Employee Attendance',
    icon: 'Calendar',
    path: '/ciisUser/emp-attendance',
    category: 'administration',
    order: 12
  },
  {
    id: 'create-task',
    name: 'Create Task',
    icon: 'Task',
    path: '/ciisUser/task-management',
    category: 'tasks',
    order: 13
  },
  {
    id: 'admin-create-task',
    name: 'Admin Create Task',
    icon: 'Task',
    path: '/ciisUser/admin-task-create',
    category: 'tasks',
    order: 14
  },
  {
    id: 'manage-groups',
    name: 'Manage Groups',
    icon: 'Groups',
    path: '/ciisUser/manage-groups',
    category: 'administration',
    order: 15
  },
  {
    id: 'employee-meeting',
    name: 'Employee Meeting',
    icon: 'VideoCall',
    path: '/ciisUser/employee-meeting',
    category: 'meetings',
    order: 16
  },
  {
    id: 'client-meeting',
    name: 'Client Meeting',
    icon: 'VideoCall',
    path: '/ciisUser/client-meeting',
    category: 'meetings',
    order: 17
  },
  {
    id: 'create-employee-meeting',
    name: 'Create Employee Meeting',
    icon: 'VideoCall',
    path: '/ciisUser/admin-meeting',
    category: 'meetings',
    order: 18
  },
  {
    id: 'admin-projects',
    name: 'Admin Projects',
    icon: 'Groups',
    path: '/ciisUser/adminproject',
    category: 'projects',
    order: 19
  },
  {
    id: 'company-all-tasks',
    name: 'Company All Tasks',
    icon: 'Task',
    path: '/ciisUser/company-all-task',
    category: 'tasks',
    order: 20
  },
  {
    id: 'department-all-tasks',
    name: 'Department All Tasks',
    icon: 'Task',
    path: '/ciisUser/department-all-task',
    category: 'tasks',
    order: 21
  },
  {
    id: 'client-management',
    name: 'Client Management',
    icon: 'Person',
    path: '/ciisUser/emp-client',
    category: 'clients',
    order: 22
  },
  {
    id: 'change-password',
    name: 'Change Password',
    icon: 'Settings',
    path: '/ciisUser/change-password',
    category: 'main',
    order: 23
  },
  {
    id: 'chat',
    name: 'Chat',
    icon: 'Chat',
    path: '/ciisUser/chat',
    category: 'communication',
    order: 24
  }

  ,
  {
    id: 'contact-support',
    name: 'Support Center',
    icon: 'Support',
    path: '/ciisUser/contact-support',
    category: 'communication',
    order: 25
  },
  {
    id: 'support-operations',
    name: 'Support Operations',
    icon: 'Support',
    path: '/ciisUser/support-operations',
    category: 'administration',
    order: 26
  },
  {
    id: 'support-desk',
    name: 'Support Desk',
    icon: 'Support',
    path: '/ciisUser/support-desk',
    category: 'communication',
    order: 27
  }
];

// ✅ Path mapping helper
const getPathFromName = (name) => {
  const pathMap = {
    'Dashboard': '/ciisUser/user-dashboard',
    'My Attendance': '/ciisUser/attendance',
    'Attendance': '/ciisUser/attendance',
    'My Leaves': '/ciisUser/my-leaves',
    'My Assets': '/ciisUser/my-assets',
    'My Details': '/ciisUser/profile',
    'Profile': '/ciisUser/profile',
    'Alerts': '/ciisUser/alert',
    'Projects': '/ciisUser/project',
    'Employee Details': '/ciisUser/emp-details',
    'Sidebar Management': '/ciisUser/SidebarManagement',
    'Employee Leaves': '/ciisUser/emp-leaves',
    'Employee Assets': '/ciisUser/emp-assets',
    'Employee Attendance': '/ciisUser/emp-attendance',
    'Create Task': '/ciisUser/task-management',
    'Admin Create Task': '/ciisUser/admin-task-create',
    'Manage Groups': '/ciisUser/manage-groups',
    'Employee Meeting': '/ciisUser/employee-meeting',
    'Client Meeting': '/ciisUser/client-meeting',
    'Create Employee Meeting': '/ciisUser/admin-meeting',
    'Admin Projects': '/ciisUser/adminproject',
    'Company All Tasks': '/ciisUser/company-all-task',
    'Department All Tasks': '/ciisUser/department-all-task',
    'Client Management': '/ciisUser/emp-client',
    'Change Password': '/ciisUser/change-password',
    'Chat': '/ciisUser/chat',
    'Support Center': '/ciisUser/contact-support',
    'Contact Support': '/ciisUser/contact-support',
    'Support Desk': '/ciisUser/support-desk',
    'Support Operations': '/ciisUser/support-operations',
    'Client Dashboard': '/client/dashboard',
    'Payment': '/client/payment',
    'Services & Tasks': '/client/services-tasks'
  };
  
  return pathMap[name] || '/ciisUser/user-dashboard';
};

const getMenuRouteKey = item => String(item?.path || '').split('/').filter(Boolean).pop();

const filterItemsByCompanyAccess = (items, companyData) => {
  const allowedPages = Array.isArray(companyData?.allowedPages) ? companyData.allowedPages : [];
  if (allowedPages.length === 0) return items;

  const normalizeKey = value => String(value || '').trim().toLowerCase();
  const allowedSet = new Set(allowedPages.map(item => normalizeKey(item)).filter(Boolean));
  return items.filter(item => (
    allowedSet.has(normalizeKey(item.id)) ||
    allowedSet.has(normalizeKey(item.path)) ||
    allowedSet.has(normalizeKey(getMenuRouteKey(item)))
  ));
};

const Sidebar = ({ isMobile = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [sidebarConfig, setSidebarConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sidebarRef = useRef(null);
  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);

  // Mobile par always open, Desktop par hover-based
  const isSidebarOpen = isMobile ? true : isHovered;

  // Check if user is client (companyRole: "client")
  const isClientUser = useMemo(() => {
    return userData?.companyRole === "client";
  }, [userData]);

  // Check if user is super_admin with Management department
  const isSuperAdminWithManagement = useMemo(() => {
    return userData?.department === "Management" && userData?.jobRole === "super_admin";
  }, [userData]);

  // LocalStorage se user data aur company details fetch karo
  useEffect(() => {
    const fetchLocalData = async () => {
      try {
        const user = localStorage.getItem("user");
        const companyDetails = localStorage.getItem("companyDetails");
        let parsedUser = null;
        let parsedCompany = null;
        
        if (user) {
          parsedUser = JSON.parse(user);
          setUserData(parsedUser);
        }
        
        if (companyDetails) {
          parsedCompany = JSON.parse(companyDetails);
        }

        const companyId =
          parsedCompany?._id ||
          parsedCompany?.id ||
          parsedUser?.companyDetails?._id ||
          parsedUser?.companyDetails?.id ||
          parsedUser?.companyId ||
          (typeof parsedUser?.company === "object" ? parsedUser.company?._id || parsedUser.company?.id : parsedUser?.company);

        if (companyId) {
          try {
            const response = await axiosInstance.get(`/company/${companyId}`);
            const latestCompany = response.data?.company || response.data?.data || response.data;

            if (latestCompany?._id || latestCompany?.id) {
              parsedCompany = {
                ...parsedCompany,
                ...latestCompany,
                allowedPages: Array.isArray(latestCompany.allowedPages)
                  ? latestCompany.allowedPages
                  : parsedCompany?.allowedPages || []
              };
              localStorage.setItem("companyDetails", JSON.stringify(parsedCompany));
            }
          } catch (companyError) {
            console.warn("Could not refresh company access, using stored company details:", companyError.message);
          }
        }

        if (parsedCompany) {
          setCompanyData(parsedCompany);
        }
      } catch (error) {
        console.error("Error parsing local storage data:", error);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchLocalData();
  }, []);

  // Fetch sidebar configuration (only for non-client users)
  const fetchSidebarConfig = useCallback(async () => {
    if (!userData || !companyData || isClientUser) return;

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      const companyId = getRecordId(userData.company || userData.companyId || companyData?._id || companyData?.id);
      const departmentId = getRecordId(userData.department || userData.departmentId);
      const branchId = getRecordId(userData.branch || userData.branchId || userData.branchDetails);
      const role = getRecordId(userData.jobRole || userData.role || userData.roleId);

      console.log('Fetching sidebar config with:', {
        companyId,
        branchId,
        departmentId,
        role
      });

      const response = await axiosInstance.get(`/sidebar/config`, {
        params: {
          companyId,
          ...(branchId ? { branchId } : {}),
          departmentId,
          role
        },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Sidebar config API response:', response.data);

      if (response.data && response.data.success) {
        if (response.data.data) {
          setSidebarConfig(response.data.data);
        } else {
          setSidebarConfig({ 
            useFixedDefault: true,
            message: 'No custom config found, using fixed default items'
          });
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch sidebar config');
      }
    } catch (error) {
      console.error('Error fetching sidebar config:', error);
      setError(`Failed to load sidebar configuration: ${error.message}`);
      setSidebarConfig({ 
        useFixedDefault: true,
        message: 'Using fixed default items due to error'
      });
    } finally {
      setLoading(false);
    }
  }, [userData, companyData, isClientUser]);

  useEffect(() => {
    if (userData && companyData) {
      if (isClientUser) {
        // Client users don't need to fetch sidebar config
        setLoading(false);
        setSidebarConfig(null);
      } else {
        fetchSidebarConfig();
      }
    }
  }, [userData, companyData, isClientUser, fetchSidebarConfig]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) return;
    
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 50);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    
    leaveTimer.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  };

  const handleNavigate = (path) => {
    if (path === 'logout') {
      handleLogout();
      return;
    }
    
    navigate(path);
    if (!isMobile) {
      setIsHovered(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You'll be logged out of your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      background: "#f9f9f9",
      color: "#333",
      customClass: {
        popup: "rounded-xl shadow-lg",
        title: "text-lg font-semibold",
        confirmButton: "px-4 py-2 rounded-md",
        cancelButton: "px-4 py-2 rounded-md",
      },
    });

    if (result.isConfirmed) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("companyDetails");

      Swal.fire({
        title: "Logged Out!",
        text: "You have successfully logged out.",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
      });

      setTimeout(() => navigate("/"), 1800);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (userData && companyData && !isClientUser) {
      fetchSidebarConfig();
    }
  };

  // ✅ Get menu items based on user role and configuration
  const menuItems = useMemo(() => {
    if (loading) return [];

    console.log('Current user data:', userData);
    console.log('Is client user:', isClientUser);
    console.log('Is super_admin with Management:', isSuperAdminWithManagement);

    // ✅ If user is client, show client menu items (3 pages)
    if (isClientUser) {
      console.log('Client user detected - showing client menu items (3 pages)');
      return clientMenuItems;
    }

    // If user is super_admin with Management department, show all pages
    if (isSuperAdminWithManagement) {
      console.log('Showing all pages for super_admin with Management department');
      return filterItemsByCompanyAccess(allPagesItems, companyData);
    }

    let items = [];

    if (sidebarConfig && sidebarConfig.menuItems && Array.isArray(sidebarConfig.menuItems)) {
      console.log('Using custom config from database with', sidebarConfig.menuItems.length, 'items');
      
      items = sidebarConfig.menuItems
        .map(item => {
          const processedItem = {
            id: item.id || item._id || Math.random().toString(36).substr(2, 9),
            name: item.name || 'Unnamed Item',
            icon: item.icon || 'Dashboard',
            category: item.category || 'main',
            order: item.order || 99,
            path: item.path || getPathFromName(item.name),
            disabled: item.disabled || false,
            visible: item.visible !== false
          };

          return processedItem;
        })
        .filter(item => item.visible && !item.disabled);
    } 
    else if (sidebarConfig && (sidebarConfig.useFixedDefault || !sidebarConfig.menuItems)) {
      console.log('Using fixed default menu items');
      items = [...fixedDefaultItems];
    }
    else {
      console.log('Using fixed default menu items (fallback)');
      items = [...fixedDefaultItems];
    }

    const accessFilteredItems = filterItemsByCompanyAccess(items, companyData);

    const sortedItems = [...accessFilteredItems].sort((a, b) => {
      const categoryOrder = ['main', 'administration', 'tasks', 'projects', 'meetings', 'communication', 'clients'];
      const categoryA = categoryOrder.indexOf(a.category) || 99;
      const categoryB = categoryOrder.indexOf(b.category) || 99;
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      
      const orderA = a.order || 99;
      const orderB = b.order || 99;
      return orderA - orderB;
    });

    console.log('Sorted menu items:', sortedItems.map(item => ({ 
      name: item.name, 
      order: item.order,
      category: item.category,
      icon: item.icon,
      path: item.path
    })));

    return sortedItems;
  }, [sidebarConfig, loading, isSuperAdminWithManagement, isClientUser, userData, companyData]);

  const renderMenuItem = (item, showFull) => {
    const selected = location.pathname === item.path;
    
    if (showFull) {
      return (
        <StyledListItemButton
          selected={selected}
          onClick={() => !item.disabled && handleNavigate(item.path)}
          disabled={item.disabled}
          sx={{
            opacity: item.disabled ? 0.5 : 1,
            cursor: item.disabled ? 'not-allowed' : 'pointer'
          }}
        >
          <StyledListItemIcon>
            {getIconComponent(item.icon)}
          </StyledListItemIcon>
          <ListItemText
            primary={item.name}
            primaryTypographyProps={{ 
              variant: 'body2', 
              fontWeight: selected ? 600 : 500,
              fontSize: '0.9rem'
            }}
          />
          {item.badge && (
            <Box sx={{ 
              ml: 1,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: '12px',
              px: 1,
              py: 0.25,
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>
              {item.badge}
            </Box>
          )}
        </StyledListItemButton>
      );
    } else {
      return (
        <Tooltip title={item.name} placement="right">
          <StyledListItemButton
            selected={selected}
            onClick={() => !item.disabled && handleNavigate(item.path)}
            disabled={item.disabled}
            sx={{ 
              justifyContent: 'center',
              opacity: item.disabled ? 0.5 : 1,
              cursor: item.disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <StyledListItemIcon sx={{ marginRight: 0, fontSize: '1.2rem' }}>
              {getIconComponent(item.icon)}
            </StyledListItemIcon>
          </StyledListItemButton>
        </Tooltip>
      );
    }
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    
    menuItems.forEach(item => {
      const category = item.category || 'main';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    
    return groups;
  }, [menuItems]);

  // Mobile aur Desktop ke liye alag containers
  const Container = isMobile ? MobileSidebarContainer : SidebarContainer;

  // Loading state
  if (loading) {
    return (
      <Container
        sx={!isMobile ? {
          width: isSidebarOpen ? drawerWidthOpen : drawerWidthClosed,
        } : undefined}
      >
        <Box sx={{ 
          p: 2, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <CircularProgress size={24} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading menu...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error && !sidebarConfig && !isSuperAdminWithManagement && !isClientUser) {
    return (
      <Container
        sx={!isMobile ? {
          width: isSidebarOpen ? drawerWidthOpen : drawerWidthClosed,
        } : undefined}
      >
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Using default navigation
          </Typography>
        </Box>
      </Container>
    );
  }

  // ✅ For client users, render the sidebar with client menu items
  if (isClientUser) {
    console.log('Client user detected - rendering sidebar with client menu items');
    // Client sidebar renders but with limited menu items
    return (
      <Container
        ref={sidebarRef}
        onMouseEnter={isMobile ? undefined : handleMouseEnter}
        onMouseLeave={isMobile ? undefined : handleMouseLeave}
        sx={!isMobile ? {
          width: isSidebarOpen ? drawerWidthOpen : drawerWidthClosed,
        } : undefined}
      >
        {/* Client User Info */}
        {isSidebarOpen && (
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {userData?.name || 'Client User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Client Portal
            </Typography>
          </Box>
        )}

        {/* Menu Items */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', mt: 2 }}>
          <List sx={{ py: 0 }}>
            {menuItems.map((item) => (
              <StyledListItem key={item.id} disablePadding>
                {renderMenuItem(item, isSidebarOpen)}
              </StyledListItem>
            ))}
          </List>
        </Box>

        {/* Logout Button */}
        <Box sx={{ px: 2, py: 2 }}>
          {isSidebarOpen ? (
            <StyledListItemButton
              onClick={handleLogout}
              sx={{
                color: 'error.main',
                '&:hover': { 
                  backgroundColor: 'error.light',
                  color: 'error.dark'
                }
              }}
            >
              <StyledListItemIcon>
                <LogoutOutlined />
              </StyledListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ 
                  variant: 'body2', 
                  fontWeight: 600 
                }}
              />
            </StyledListItemButton>
          ) : (
            <Tooltip title="Logout" placement="right">
              <IconButton
                onClick={handleLogout}
                sx={{
                  width: '100%',
                  justifyContent: 'center',
                  color: 'error.main',
                  padding: '8px',
                  borderRadius: 2,
                  '&:hover': { 
                    color: 'error.dark',
                    backgroundColor: 'error.light'
                  }
                }}
              >
                <LogoutOutlined />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Container>
    );
  }

  // If menuItems is empty and not loading, show empty state
  if (menuItems.length === 0 && !loading) {
    return (
      <Container
        sx={!isMobile ? {
          width: isSidebarOpen ? drawerWidthOpen : drawerWidthClosed,
        } : undefined}
      >
        <Box sx={{ 
          p: 2, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <Typography variant="body2" color="text.secondary">
            No menu items available
          </Typography>
        </Box>
      </Container>
    );
  }

  // Render category headings for non-client users
  const renderCategoryHeading = (category) => {
    const categoryLabels = {
      'main': 'Main Menu',
      'administration': 'Administration',
      'tasks': 'Tasks',
      'projects': 'Projects',
      'meetings': 'Meetings',
      'communication': 'Communication',
      'clients': 'Clients'
    };
    
    const label = categoryLabels[category] || category;
    
    if (isSidebarOpen) {
      return (
        <SectionHeading key={`heading-${category}`}>
          <span>{label}</span>
        </SectionHeading>
      );
    } else {
      return (
        <Tooltip key={`heading-${category}`} title={label} placement="right">
          <CollapsedHeading>
            {getIconComponent(category === 'main' ? 'Dashboard' : 
              category === 'administration' ? 'Person' :
              category === 'tasks' ? 'Task' :
              category === 'projects' ? 'Groups' :
              category === 'meetings' ? 'VideoCall' :
              category === 'communication' ? 'Notifications' :
              category === 'clients' ? 'Person' : 'Dashboard')}
          </CollapsedHeading>
        </Tooltip>
      );
    }
  };

  return (
    <Container
      ref={sidebarRef}
      onMouseEnter={isMobile ? undefined : handleMouseEnter}
      onMouseLeave={isMobile ? undefined : handleMouseLeave}
      sx={!isMobile ? {
        width: isSidebarOpen ? drawerWidthOpen : drawerWidthClosed,
      } : undefined}
    >
      {/* User Info (only when sidebar is open) */}
      {isSidebarOpen && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {userData?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {userData?.jobRole || 'Employee'}
          </Typography>
        </Box>
      )}

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {Object.keys(groupedItems).map(category => (
          <Box key={category}>
            {renderCategoryHeading(category)}
            
            {/* Menu Items List */}
            <List sx={{ py: 0 }}>
              {groupedItems[category].map((item) => (
                <StyledListItem key={item.id} disablePadding>
                  {renderMenuItem(item, isSidebarOpen)}
                </StyledListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Logout Button */}
      <Box sx={{ px: 2, py: 2 }}>
        {isSidebarOpen ? (
          <StyledListItemButton
            onClick={handleLogout}
            sx={{
              color: 'error.main',
              '&:hover': { 
                backgroundColor: 'error.light',
                color: 'error.dark'
              }
            }}
          >
            <StyledListItemIcon>
              <LogoutOutlined />
            </StyledListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ 
                variant: 'body2', 
                fontWeight: 600 
              }}
            />
          </StyledListItemButton>
        ) : (
          <Tooltip title="Logout" placement="right">
            <IconButton
              onClick={handleLogout}
              sx={{
                width: '100%',
                justifyContent: 'center',
                color: 'error.main',
                padding: '8px',
                borderRadius: 2,
                '&:hover': { 
                  color: 'error.dark',
                  backgroundColor: 'error.light'
                }
              }}
            >
              <LogoutOutlined />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Container>
  );
};

export default Sidebar;
