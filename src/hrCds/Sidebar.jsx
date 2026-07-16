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
  Business as BusinessIcon,
} from '@mui/icons-material';
import Swal from "sweetalert2";
import axiosInstance from '../utils/axiosConfig';
import {
  CLIENT_PORTAL_COMPANIES_EVENT,
  CLIENT_PORTAL_COMPANIES_KEY,
  CLIENT_PORTAL_SELECTED_CLIENT_KEY,
  CLIENT_PORTAL_SELECTION_EVENT,
  getCachedClientCompanies
} from './utils/clientPortalData';

const drawerWidthOpen = 260;
const drawerWidthClosed = 70;

const getRecordId = value => {
  if (!value) return '';
  if (typeof value === 'object') {
    return value._id || value.id || value.value || '';
  }
  return value;
};

const isMongoId = value => /^[0-9a-fA-F]{24}$/.test(String(value || '').trim());

const getRecordDisplayName = value => {
  if (!value) return '';
  if (typeof value === 'object') {
    return (
      value.name ||
      value.roleName ||
      value.departmentName ||
      value.branchName ||
      value.companyName ||
      value.title ||
      value.label ||
      ''
    );
  }

  const text = String(value).trim();
  if (!text || isMongoId(text)) return '';

  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

const getJobRoleNameFromList = (roles, roleId) => {
  if (!Array.isArray(roles) || !roleId) return '';

  const normalizedRoleId = String(roleId);
  const matchedRole = roles.find(role => (
    String(role?._id || role?.id || role?.value || '') === normalizedRoleId
  ));

  return getRecordDisplayName(matchedRole);
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
  'Apartment': GroupsIcon,
  'apartment': GroupsIcon,
  'Work': TaskIcon,
  'work': TaskIcon,
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
    name: 'My Profile',
    icon: 'Person',
    path: '/ciisUser/profile',
    category: 'main',
    order: 5
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
    id: 'active-clients',
    name: 'Active Clients',
    icon: 'Folder',
    path: '/ciisUser/active-clients',
    category: 'clients',
    order: 9
  },
  {
    id: 'support-desk',
    name: 'Support Desk',
    icon: 'Support',
    path: '/ciisUser/support-desk',
    category: 'communication',
    order: 10
  }
];


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
    id: 'client-my-services',
    name: 'My Services',
    icon: 'Folder',
    path: '/client/my-services',
    category: 'main',
    order: 2
  },
  {
    id: 'client-tasks-updates',
    name: 'Tasks & Updates',
    icon: 'Task',
    path: '/client/tasks-updates',
    category: 'main',
    order: 3
  },
  {
    id: 'client-marketplace',
    name: 'Explore Services',
    icon: 'Folder',
    path: '/client/marketplace',
    category: 'main',
    order: 4
  },
  {
    id: 'client-support-tickets',
    name: 'Meetings',
    icon: 'VideoCall',
    path: '/client/support-tickets',
    category: 'main',
    order: 5
  },
  {
    id: 'client-documents',
    name: 'Documents',
    icon: 'Folder',
    path: '/client/documents',
    category: 'main',
    order: 6
  },
  {
    id: 'client-payments',
    name: 'Payments',
    icon: 'CreditCard',
    path: '/client/payments',
    category: 'main',
    order: 7
  },
];

const getClientCompanyName = company => (
  company?.company || company?.companyName || company?.client || company?.name || 'Company'
);

const ClientCompaniesDropdown = ({ onCompanySelected }) => {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState(() => getCachedClientCompanies());
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => (
    String(localStorage.getItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY) || '')
  ));

  useEffect(() => {
    const refreshCompanies = () => setCompanies(getCachedClientCompanies());
    const refreshSelection = () => setSelectedCompanyId(
      String(localStorage.getItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY) || '')
    );
    window.addEventListener(CLIENT_PORTAL_COMPANIES_EVENT, refreshCompanies);
    window.addEventListener(CLIENT_PORTAL_SELECTION_EVENT, refreshSelection);
    return () => {
      window.removeEventListener(CLIENT_PORTAL_COMPANIES_EVENT, refreshCompanies);
      window.removeEventListener(CLIENT_PORTAL_SELECTION_EVENT, refreshSelection);
    };
  }, []);

  const handleSelectCompany = company => {
    const companyId = String(company?._id || company?.id || '');
    if (companyId && companyId !== selectedCompanyId) {
      localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, companyId);
      localStorage.setItem('client', JSON.stringify(company));
      setSelectedCompanyId(companyId);
      window.dispatchEvent(new CustomEvent(CLIENT_PORTAL_SELECTION_EVENT, {
        detail: { clientId: companyId }
      }));
    }
    onCompanySelected(company);
  };

  return (
    <Box sx={{ mx: 1, mb: 0.5 }}>
      <ListItemButton
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-controls="client-companies-list"
        sx={{
          minHeight: 48,
          px: 2,
          borderRadius: 2,
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'translateX(2px)',
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: 2, color: 'inherit' }}>
          <BusinessIcon />
        </ListItemIcon>
        <ListItemText
          primary="Companies"
          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
        />
        {companies.length > 1 && (
          <Box
            component="span"
            sx={{
              minWidth: 22,
              height: 22,
              px: 0.75,
              mr: 0.5,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
              backgroundColor: 'action.selected',
              color: 'primary.main',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            {companies.length}
          </Box>
        )}
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List id="client-companies-list" disablePadding sx={{ mt: 0.5 }}>
          {companies.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1.25, pl: 4.5 }}>
              No companies available
            </Typography>
          )}

          {companies.map(company => {
            const companyId = String(company?._id || company?.id || '');
            const isSelected = companyId === selectedCompanyId;
            const companyName = getClientCompanyName(company);

            return (
              <ListItemButton
                key={companyId || companyName}
                selected={isSelected}
                onClick={() => handleSelectCompany(company)}
                sx={{
                  minHeight: 42,
                  ml: 2.5,
                  mr: 0.5,
                  pl: 1.5,
                  pr: 1,
                  borderRadius: 2,
                  borderLeft: '2px solid',
                  borderLeftColor: isSelected ? 'primary.main' : 'divider',
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 28,
                    height: 28,
                    mr: 1.25,
                    flex: '0 0 auto',
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 1.5,
                    backgroundColor: isSelected ? 'primary.main' : 'action.hover',
                    color: isSelected ? 'primary.contrastText' : 'primary.main',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  {companyName.trim().charAt(0).toUpperCase() || 'C'}
                </Box>
                <ListItemText
                  primary={companyName}
                  secondary={isSelected ? 'Selected' : null}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: isSelected ? 700 : 500, noWrap: true }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'primary.main' }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
};


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
    name: 'My Profile',
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
    id: 'department',
    name: 'Department Management',
    icon: 'Apartment',
    path: '/ciisUser/department',
    category: 'administration',
    order: 12.1
  },
  {
    id: 'JobRoleManagement',
    name: 'Job Role Management',
    icon: 'Work',
    path: '/ciisUser/JobRoleManagement',
    category: 'administration',
    order: 12.2
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
    id: 'active-clients',
    name: 'Active Clients',
    icon: 'Folder',
    path: '/ciisUser/active-clients',
    category: 'clients',
    order: 23
  },
  {
    id: 'chat',
    name: 'Chat',
    icon: 'Chat',
    path: '/ciisUser/chat',
    category: 'communication',
    order: 25
  },
  {
    id: 'support-operations',
    name: 'Support Operations',
    icon: 'Support',
    path: '/ciisUser/support-operations',
    category: 'administration',
    order: 27
  },
  {
    id: 'support-desk',
    name: 'Support Desk',
    icon: 'Support',
    path: '/ciisUser/support-desk',
    category: 'communication',
    order: 28
  }
];


const getPathFromName = (name) => {
  const pathMap = {
    'Dashboard': '/ciisUser/user-dashboard',
    'My Attendance': '/ciisUser/attendance',
    'Attendance': '/ciisUser/attendance',
    'My Leaves': '/ciisUser/my-leaves',
    'My Assets': '/ciisUser/my-assets',
    'My Details': '/ciisUser/profile',
    'My Profile': '/ciisUser/profile',
    'Profile': '/ciisUser/profile',
    'Alerts': '/ciisUser/alert',
    'Projects': '/ciisUser/project',
    'Employee Details': '/ciisUser/emp-details',
    'Sidebar Management': '/ciisUser/SidebarManagement',
    'Employee Leaves': '/ciisUser/emp-leaves',
    'Employee Assets': '/ciisUser/emp-assets',
    'Employee Attendance': '/ciisUser/emp-attendance',
    'Department Management': '/ciisUser/department',
    'Job Role Management': '/ciisUser/JobRoleManagement',
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
    'Active Clients': '/ciisUser/active-clients',
    'Chat': '/ciisUser/chat',
    'Support Desk': '/ciisUser/support-desk',
    'Support Operations': '/ciisUser/support-operations',
    'Client Dashboard': '/client/dashboard',
    'Payment': '/client/payments',
  'Payments': '/client/payments',
  'My Services': '/client/my-services',
  'Tasks & Updates': '/client/tasks-updates',
  'Explore Services': '/client/marketplace',
  'Service Marketplace': '/client/marketplace',
  'Meetings': '/client/support-tickets',
  'Support Tickets': '/client/support-tickets',
  'Documents': '/client/documents',
    'Services & Tasks': '/client/services-tasks'
  };
  
  return pathMap[name] || '/ciisUser/user-dashboard';
};

const getMenuDisplayName = (name) => {
  return name === 'My Details' ? 'My Profile' : name;
};

const getMenuRouteKey = item => String(item?.path || '').split('/').filter(Boolean).pop();

const companyAccessFallbackItems = [
  {
    id: 'active-clients',
    name: 'Active Clients',
    icon: 'Folder',
    path: '/ciisUser/active-clients',
    category: 'clients',
    order: 22.5
  }
];

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

const addCompanyAccessFallbackItems = (items, companyData) => {
  const allowedPages = Array.isArray(companyData?.allowedPages) ? companyData.allowedPages : [];
  if (allowedPages.length === 0) return items;

  const normalizeKey = value => String(value || '').trim().toLowerCase();
  const allowedSet = new Set(allowedPages.map(item => normalizeKey(item)).filter(Boolean));
  const existingKeys = new Set(items.flatMap(item => [
    normalizeKey(item.id),
    normalizeKey(item.path),
    normalizeKey(getMenuRouteKey(item))
  ]).filter(Boolean));

  const fallbackItems = companyAccessFallbackItems.filter(item => (
    (
      allowedSet.has(normalizeKey(item.id)) ||
      allowedSet.has(normalizeKey(item.path)) ||
      allowedSet.has(normalizeKey(getMenuRouteKey(item)))
    ) &&
    !existingKeys.has(normalizeKey(item.id)) &&
    !existingKeys.has(normalizeKey(item.path)) &&
    !existingKeys.has(normalizeKey(getMenuRouteKey(item)))
  ));

  return fallbackItems.length ? [...items, ...fallbackItems] : items;
};

const Sidebar = ({ isMobile = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [resolvedJobRoleName, setResolvedJobRoleName] = useState("");
  const [sidebarConfig, setSidebarConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientCompanies, setClientCompanies] = useState([]);
  const [selectedClientCompanyId, setSelectedClientCompanyId] = useState("");
  const [clientCompanyDropdownOpen, setClientCompanyDropdownOpen] = useState(true);
  const sidebarRef = useRef(null);
  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);

  
  const isSidebarOpen = isMobile ? true : isHovered;

  
  const isClientUser = useMemo(() => {
    return userData?.companyRole === "client";
  }, [userData]);

  useEffect(() => {
    if (!isClientUser || !userData) {
      setClientCompanies([]);
      setSelectedClientCompanyId("");
      return;
    }

    let cancelled = false;

    const readStoredClient = () => {
      try {
        return JSON.parse(localStorage.getItem("client") || "null");
      } catch {
        return null;
      }
    };

    const loadClientCompanies = async () => {
      const storedClient = readStoredClient();
      try {
        const companyContext = getClientPortalCompanyContext(userData, storedClient);
        if (!companyContext.companyCode) {
          const fallbackCompanies = storedClient ? [storedClient] : [];
          if (!cancelled) {
            setClientCompanies(fallbackCompanies);
            setSelectedClientCompanyId(String(storedClient?._id || storedClient?.id || ""));
          }
          return;
        }

        const response = await axiosInstance.get("/clientsservice", {
          params: { ...getCompanyScopedClientParams(companyContext), limit: 1000 }
        });
        const allClients = response.data?.data || response.data?.clients || [];
        const matchingClients = Array.isArray(allClients)
          ? allClients.filter(item => isClientForLoggedInUser(item, userData))
          : [];
        const companies = matchingClients.length ? matchingClients : (storedClient ? [storedClient] : []);
        const selectedId =
          localStorage.getItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY) ||
          storedClient?._id ||
          storedClient?.id ||
          companies[0]?._id ||
          companies[0]?.id ||
          "";

        if (!cancelled) {
          setClientCompanies(companies);
          setSelectedClientCompanyId(String(selectedId));
          setClientCompanyDropdownOpen(companies.length > 0);
        }
      } catch (clientCompanyError) {
        console.warn("Could not load client companies for sidebar:", clientCompanyError.message);
        if (!cancelled && storedClient) {
          setClientCompanies([storedClient]);
          setSelectedClientCompanyId(String(storedClient._id || storedClient.id || ""));
        }
      }
    };

    loadClientCompanies();
    return () => {
      cancelled = true;
    };
  }, [isClientUser, userData]);

  
  const isSuperAdminWithManagement = useMemo(() => {
    return userData?.department === "Management" && userData?.jobRole === "super_admin";
  }, [userData]);

  
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

      void 0;

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

      void 0;

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
        
        setLoading(false);
        setSidebarConfig(null);
      } else {
        fetchSidebarConfig();
      }
    }
  }, [userData, companyData, isClientUser, fetchSidebarConfig]);

  useEffect(() => {
    const resolveJobRoleName = async () => {
      if (!userData) {
        setResolvedJobRoleName("");
        return;
      }

      const directRoleName =
        userData.jobRoleName ||
        userData.roleName ||
        userData.designation ||
        getRecordDisplayName(userData.jobRole) ||
        getRecordDisplayName(userData.role) ||
        getRecordDisplayName(userData.roleId);

      if (directRoleName) {
        setResolvedJobRoleName(directRoleName);
        return;
      }

      const roleId = getRecordId(userData.jobRole || userData.role || userData.roleId);
      if (!isMongoId(roleId)) {
        setResolvedJobRoleName("");
        return;
      }

      try {
        const companyId = getRecordId(userData.company || userData.companyId || companyData?._id || companyData?.id);
        const companyCode = userData.companyCode || companyData?.companyCode || companyData?.code;
        const response = await axiosInstance.get('/job-roles', {
          params: {
            ...(companyId ? { company: companyId } : {}),
            ...(companyCode ? { companyCode } : {})
          }
        });
        const roles = response.data?.jobRoles || response.data?.data || response.data || [];
        const roleName = getJobRoleNameFromList(roles, roleId);

        setResolvedJobRoleName(roleName || "");
      } catch (error) {
        console.warn("Could not resolve sidebar job role name:", error.message);
        setResolvedJobRoleName("");
      }
    };

    resolveJobRoleName();
  }, [userData, companyData]);

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

  const handleClientCompanySwitch = (clientCompany) => {
    const nextId = clientCompany?._id || clientCompany?.id;
    if (!nextId) return;

    localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, String(nextId));
    localStorage.setItem("client", JSON.stringify(clientCompany));
    setSelectedClientCompanyId(String(nextId));
    window.dispatchEvent(new CustomEvent(CLIENT_PORTAL_SELECTION_EVENT, {
      detail: { clientId: nextId }
    }));

    if (!location.pathname.startsWith("/client")) {
      navigate("/client/dashboard");
    }

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
      localStorage.removeItem(CLIENT_PORTAL_COMPANIES_KEY);

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

  
  const menuItems = useMemo(() => {
    if (loading) return [];

    const removeHiddenSidebarItems = items => items.filter(item => {
      const id = String(item?.id || "").toLowerCase();
      const name = String(item?.name || "").toLowerCase();
      const path = String(item?.path || "").toLowerCase();
      return id !== "contact-support"
        && name !== "support center"
        && name !== "contact support"
        && !path.includes("contact-support")
        && id !== "profile"
        && id !== "change-password"
        && name !== "my profile"
        && name !== "my details"
        && name !== "profile"
        && name !== "change password"
        && !path.endsWith("/profile")
        && !path.endsWith("/change-password");
    });

    void 0;
    void 0;
    void 0;

    
    if (isClientUser) {
      void 0;
      return removeHiddenSidebarItems(clientMenuItems);
    }

    
    if (isSuperAdminWithManagement) {
      void 0;
      return removeHiddenSidebarItems(filterItemsByCompanyAccess(allPagesItems, companyData));
    }

    let items = [];

    if (sidebarConfig && sidebarConfig.menuItems && Array.isArray(sidebarConfig.menuItems)) {
      void 0;
      
      items = sidebarConfig.menuItems
        .map(item => {
          const processedItem = {
            id: item.id || item._id || Math.random().toString(36).substr(2, 9),
            name: getMenuDisplayName(item.name || 'Unnamed Item'),
            icon: item.icon || 'Dashboard',
            category: item.category || 'main',
            order: Number.isFinite(Number(item.order)) ? Number(item.order) : 99,
            path: item.path || getPathFromName(item.name),
            disabled: item.disabled || false,
            visible: item.visible !== false
          };

          return processedItem;
        })
        .filter(item => item.visible && !item.disabled);
    } 
    else if (sidebarConfig && (sidebarConfig.useFixedDefault || !sidebarConfig.menuItems)) {
      void 0;
      items = [...fixedDefaultItems];
    }
    else {
      void 0;
      items = [...fixedDefaultItems];
    }

    const accessFilteredItems = filterItemsByCompanyAccess(
      addCompanyAccessFallbackItems(items, companyData),
      companyData
    );

    // Sidebar Management stores the click/selection sequence as `order`.
    // Keep that exact sequence across categories in the employee menu.
    const sortedItems = accessFilteredItems
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => {
        const orderDifference = Number(a.item.order ?? 99) - Number(b.item.order ?? 99);
        return orderDifference || a.originalIndex - b.originalIndex;
      })
      .map(({ item }) => item);

    void 0;

    return removeHiddenSidebarItems(sortedItems);
  }, [sidebarConfig, loading, isSuperAdminWithManagement, isClientUser, userData, companyData]);

  const userSubtitle = useMemo(() => {
    if (!userData) return 'Employee';
    if (isClientUser) return 'Client Portal';

    return (
      resolvedJobRoleName ||
      getRecordDisplayName(userData.jobRole) ||
      getRecordDisplayName(userData.role) ||
      getRecordDisplayName(userData.roleId) ||
      getRecordDisplayName(userData.companyRole) ||
      'Employee'
    );
  }, [userData, isClientUser, resolvedJobRoleName]);

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

  
  const groupedItems = useMemo(() => {
    const groups = {};
    const categoryOrder = ['main', 'administration', 'tasks', 'projects', 'meetings', 'communication', 'clients'];
    
    menuItems.forEach(item => {
      const category = item.category || 'main';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    Object.values(groups).forEach(items => {
      items.sort((a, b) => {
        const isDashboardA = a.id === 'dashboard' || a.name?.toLowerCase() === 'dashboard';
        const isDashboardB = b.id === 'dashboard' || b.name?.toLowerCase() === 'dashboard';

        if (isDashboardA !== isDashboardB) {
          return isDashboardA ? -1 : 1;
        }

        return (a.order ?? 99) - (b.order ?? 99);
      });
    });
    
    return Object.fromEntries(
      Object.entries(groups).sort(([categoryA], [categoryB]) => {
        const indexA = categoryOrder.indexOf(categoryA);
        const indexB = categoryOrder.indexOf(categoryB);
        const orderA = indexA === -1 ? 99 : indexA;
        const orderB = indexB === -1 ? 99 : indexB;
        return orderA - orderB;
      })
    );
  }, [menuItems]);

  
  const Container = isMobile ? MobileSidebarContainer : SidebarContainer;

  
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

  
  if (isClientUser) {
    void 0;
    
    return (
      <Container
        ref={sidebarRef}
        onMouseEnter={isMobile ? undefined : handleMouseEnter}
        onMouseLeave={isMobile ? undefined : handleMouseLeave}
        sx={!isMobile ? {
          width: isSidebarOpen ? drawerWidthOpen : drawerWidthClosed,
        } : undefined}
      >
        
      {isSidebarOpen && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.25 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {userData?.name || 'Client User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Client Portal
              </Typography>
            </Box>
            <Tooltip title="My Profile">
              <Button
                size="small"
                onClick={() => handleNavigate('/client/account-settings')}
                startIcon={<PersonIcon fontSize="small" />}
                sx={{
                  flex: '0 0 auto',
                  minWidth: 86,
                  height: 32,
                  px: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'primary.main',
                  backgroundColor: 'action.hover',
                  border: `1px solid ${theme.palette.divider}`,
                  '& .MuiButton-startIcon': {
                    mr: 0.5,
                  },
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                  },
                }}
              >
                Profile
              </Button>
            </Tooltip>
          </Box>
        </Box>
      )}

        
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', mt: 2 }}>
          <List sx={{ py: 0 }}>
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                <StyledListItem disablePadding>
                  {renderMenuItem(item, isSidebarOpen)}
                </StyledListItem>
                {item.id === 'client-dashboard' && isSidebarOpen && (
                  <ClientCompaniesDropdown
                    onCompanySelected={company => {
                      const companyId = company?._id || company?.id;
                      if (companyId) handleNavigate(`/client/company/${companyId}`);
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>

        
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

  const renderClientCompanySwitcher = () => {
    if (!isClientUser || clientCompanies.length === 0) return null;

    const selectedCompany = clientCompanies.find(item => (
      String(item?._id || item?.id || "") === String(selectedClientCompanyId || "")
    )) || clientCompanies[0];

    if (!isSidebarOpen) {
      return (
        <Tooltip title="Your Company" placement="right">
          <CollapsedHeading>
            <FolderIcon />
          </CollapsedHeading>
        </Tooltip>
      );
    }

    return (
      <Box>
        <StyledListItem disablePadding>
          <StyledListItemButton
            onClick={() => setClientCompanyDropdownOpen(open => !open)}
            sx={{ minHeight: 44 }}
          >
            <StyledListItemIcon>
              <FolderIcon />
            </StyledListItemIcon>
            <ListItemText
              primary="Your Company"
              secondary={getClientDisplayName(selectedCompany)}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
              secondaryTypographyProps={{
                variant: 'caption',
                noWrap: true
              }}
            />
            {clientCompanies.length > 1 && (
              <Box sx={{
                mr: 0.75,
                px: 0.8,
                py: 0.25,
                borderRadius: 999,
                bgcolor: 'action.hover',
                color: 'primary.main',
                fontSize: '0.68rem',
                fontWeight: 800
              }}>
                {clientCompanies.length}
              </Box>
            )}
            {clientCompanyDropdownOpen ? <ExpandLess /> : <ExpandMore />}
          </StyledListItemButton>
        </StyledListItem>

        <Collapse in={clientCompanyDropdownOpen} timeout="auto" unmountOnExit>
          <List sx={{ py: 0.25 }}>
            {clientCompanies.map(item => {
              const id = String(item?._id || item?.id || getClientDisplayName(item));
              const isSelected = String(item?._id || item?.id || "") === String(selectedClientCompanyId || "");
              return (
                <StyledListItem key={id} disablePadding>
                  <StyledListItemButton
                    selected={isSelected}
                    onClick={() => handleClientCompanySwitch(item)}
                    sx={{
                      minHeight: 38,
                      pl: 4.75,
                      pr: 1.5,
                      py: 0.75
                    }}
                  >
                    <StyledListItemIcon sx={{ marginRight: 1.5, fontSize: '1rem' }}>
                      <FolderIcon fontSize="small" />
                    </StyledListItemIcon>
                    <ListItemText
                      primary={getClientDisplayName(item)}
                      secondary={`${getClientServices(item).length} services`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.86rem',
                        noWrap: true
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        noWrap: true,
                        sx: { fontSize: '0.7rem' }
                      }}
                    />
                  </StyledListItemButton>
                </StyledListItem>
              );
            })}
          </List>
        </Collapse>
      </Box>
    );
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
      
      {isSidebarOpen && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.25 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {userData?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {userSubtitle}
              </Typography>
            </Box>
            <Tooltip title="My Profile">
              <Button
                size="small"
                onClick={() => handleNavigate('/ciisUser/profile')}
                startIcon={<PersonIcon fontSize="small" />}
                sx={{
                  flex: '0 0 auto',
                  minWidth: 86,
                  height: 32,
                  px: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'primary.main',
                  backgroundColor: 'action.hover',
                  border: `1px solid ${theme.palette.divider}`,
                  '& .MuiButton-startIcon': {
                    mr: 0.5,
                  },
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                  },
                }}
              >
                Profile
              </Button>
            </Tooltip>
          </Box>
        </Box>
      )}

      
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {renderClientCompanySwitcher()}
        {Object.keys(groupedItems).map(category => (
          <Box key={category}>
            {renderCategoryHeading(category)}
            
            
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
