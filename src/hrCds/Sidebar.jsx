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
  PhoneInTalk as PhoneInTalkIcon,
  Speed as CallOverviewIcon,
  AssignmentInd as AssignedCallsIcon,
  AccessTime as PendingCallsIcon,
  EventAvailable as ScheduledCallsIcon,
  CheckCircle as CompletedCallsIcon,
  Verified as ConvertedCallsIcon,
  SwapHoriz as TransferredCallsIcon,
  History as CallHistoryIcon,
} from '@mui/icons-material';
import Swal from "sweetalert2";
import axiosInstance from '../utils/axiosConfig';
import { isCrmPage, requiresPageAccess, hasPageAccess, hasConfiguredPageAccess, loadPagePermissionCatalog, loadPagePermission } from '../utils/pageAccess';
import { TELECALLER_PAGES, hasTelecallerCompanyAccess } from '../crm/telecaller/telecallerPages';
import { CRM_PAGES } from '../config/crmPages';
import { preloadRouteByPath, preloadRouteChunks } from '../utils/routePreloader';
import {
  CLIENT_PORTAL_SELECTED_CLIENT_KEY,
  CLIENT_PORTAL_SELECTION_EVENT,
  getClientDisplayName,
  getClientServices,
  getClientPortalCompanyContext,
  getCompanyScopedClientParams,
  isClientForLoggedInUser
} from './utils/clientPortalData';
import { getProfileCompletion } from './utils/profileCompletion';

const drawerWidthOpen = 224;
const drawerWidthClosed = 70;
const BADGE_REFRESH_INTERVAL = 120000;
const BADGE_CACHE_TTL = 120000;
const getBadgeCacheKey = userId => `ciis-sidebar-badges-cache:${userId || 'anonymous'}`;
const PAGE_ACCESS_ROLES = new Set(['owner', 'company_owner', 'companyowner', 'admin', 'super_admin', 'superadmin']);
const normalizePermissionRole = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[\s-]+/g, '_');

const getPermissionUserIds = page => [
  page?.viewUsers,
  page?.editUsers,
  page?.deleteUsers,
  page?.approvers,
].flatMap(items => (Array.isArray(items) ? items : []))
  .map(item => getRecordId(item?.user || item))
  .filter(Boolean);

const readBadgeCache = userId => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(getBadgeCacheKey(userId)) || 'null');
    if (!cached || !cached.counts || Date.now() - cached.savedAt >= BADGE_CACHE_TTL) return null;
    return cached.counts;
  } catch {
    return null;
  }
};

const writeBadgeCache = (userId, counts) => {
  try {
    sessionStorage.setItem(getBadgeCacheKey(userId), JSON.stringify({ counts, savedAt: Date.now() }));
  } catch {
    // Session storage may be unavailable in restricted browser modes.
  }
};

const flattenGroupedRecords = grouped => (
  grouped && typeof grouped === 'object'
    ? Object.values(grouped).flatMap(records => Array.isArray(records) ? records : [])
    : []
);

const isPendingRecord = record => {
  const status = String(
    record?.statusInfo?.find(entry => entry?.status)?.status ||
    record?.status ||
    record?.taskStatus ||
    ''
  ).toLowerCase();

  return !['completed', 'complete', 'closed', 'cancelled', 'canceled', 'rejected'].includes(status);
};

const getResponseRecords = (response, keys = []) => {
  const payload = response?.data;
  const candidates = [
    payload,
    payload?.data,
    ...keys.flatMap(key => [payload?.[key], payload?.data?.[key]])
  ];
  return candidates.find(Array.isArray) || [];
};

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
  height: '100%',
  minHeight: 0,
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
  minHeight: 42,
  width: 'calc(100% - 16px)',
  margin: theme.spacing(0.25, 1),
  padding: theme.spacing(0.8, 1.5),
  justifyContent: 'initial',
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: selected ? `${theme.palette.primary.main}10` : 'transparent',
  borderLeft: selected ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
  borderRadius: '0 8px 8px 0',
  transition: 'background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease',
  '&:hover': {
    backgroundColor: selected ? `${theme.palette.primary.main}16` : theme.palette.action.hover,
  },
  '& .MuiListItemIcon-root': {
    minWidth: 30,
    marginRight: theme.spacing(1.25),
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    transition: 'color 0.18s ease',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.78rem',
    lineHeight: 1.25,
    fontWeight: selected ? 600 : 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: 0,
  marginRight: theme.spacing(2),
  color: 'inherit',
  fontSize: '1.1rem',
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.25, 2, 0.85),
  margin: theme.spacing(0, 1),
  fontSize: '0.69rem',
  lineHeight: 1.2,
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  fontWeight: 700,
  letterSpacing: '0.08em',
  borderBottom: `1px solid ${theme.palette.divider}`,
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
  'CallOverview': CallOverviewIcon,
  'AssignedCalls': AssignedCallsIcon,
  'TodaysCalls': PhoneInTalkIcon,
  'PendingCalls': PendingCallsIcon,
  'ScheduledCalls': ScheduledCallsIcon,
  'CompletedCalls': CompletedCallsIcon,
  'ConvertedCalls': ConvertedCallsIcon,
  'TransferredCalls': TransferredCallsIcon,
  'CallHistory': CallHistoryIcon,
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
  'Call': PhoneInTalkIcon,
  'call': PhoneInTalkIcon,
};

// Admin CRM sidebar scaffold. Add new page ids to a group's itemIds when its
// route is added to the normal sidebar configuration.
const ADMIN_CRM_MENU_GROUPS = [
  { id: 'lead-management', name: 'Lead Management', icon: 'Person', itemIds: ['admin-crm-lead-overview', 'admin-crm-all-leads', 'admin-crm-add-lead', 'admin-crm-lead-sources', 'admin-crm-lead-types', 'admin-crm-import-export-leads'] },
  { id: 'call-management', name: 'Call Management', icon: 'Call', itemIds: ['admin-crm-call-overview', 'admin-crm-assigned-calls', 'admin-crm-todays-calls', 'admin-crm-pending-calls', 'admin-crm-scheduled-calls', 'admin-crm-completed-calls', 'admin-crm-converted-calls', 'admin-crm-transferred-calls', 'admin-crm-call-history'] },
  { id: 'follow-up-center', name: 'Follow-Up Center', icon: 'EventNote', itemIds: ['admin-crm-follow-ups'], direct: true },
  { id: 'assignments', name: 'Assignments', icon: 'Groups', itemIds: ['admin-crm-assignments', 'admin-crm-assignment-bulk', 'admin-crm-assignment-history', 'admin-crm-workload'] },
  { id: 'reports', name: 'Reports', icon: 'ListAlt', itemIds: ['admin-crm-reports-overview', 'admin-crm-reports-leads', 'admin-crm-reports-calls', 'admin-crm-reports-follow-ups', 'admin-crm-reports-team-performance', 'admin-crm-reports-conversion-funnel', 'admin-crm-reports-user-activity'] },
];


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
  },
  {
    id: 'create-user',
    name: 'Create User',
    icon: 'Person',
    path: '/ciisUser/create-user',
    category: 'admin',
    order: 11
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


const allPagesItems = [
  ...TELECALLER_PAGES,
  {
    id: 'admin-crm-scheduled-calls',
    name: 'Scheduled Calls',
    icon: 'ScheduledCalls',
    path: '/ciisUser/crm/admin/scheduled-calls',
    category: 'crm',
    order: 24.6135
  },
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
    id: 'create-alert',
    name: 'Create Alert',
    icon: 'NotificationsActive',
    path: '/ciisUser/create-alert',
    category: 'communication',
    order: 6
  },
  {
    id: 'projects',
    name: 'My Projects',
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
    id: 'leave-policy',
    name: 'Leave Policy',
    icon: 'Event',
    path: '/ciisUser/leave-policy',
    category: 'administration',
    order: 10.1
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
    name: 'Manage Projects',
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
    id: 'salary-component',
    name: 'Salary Component',
    icon: 'Work',
    path: '/ciisUser/salary-component',
    category: 'payroll',
    order: 24
  },
  {
    id: 'salary-structure',
    name: 'Salary Structure',
    icon: 'Work',
    path: '/ciisUser/salary-structure',
    category: 'payroll',
    order: 24.1
  },
  {
    id: 'salary-assignment',
    name: 'Employee Salary',
    icon: 'Work',
    path: '/ciisUser/salary-assignment',
    category: 'payroll',
    order: 24.2
  },
  {
    id: 'assign-salary',
    name: 'Assign Salary',
    icon: 'Work',
    path: '/ciisUser/assign-salary',
    category: 'payroll',
    order: 24.25
  },
  {
    id: 'payroll-process',
    name: 'Payroll Process',
    icon: 'Work',
    path: '/ciisUser/payroll-process',
    category: 'payroll',
    order: 24.3
  },
  {
    id: 'release-payroll',
    name: 'Release Payroll',
    icon: 'Work',
    path: '/ciisUser/release-payroll',
    category: 'payroll',
    order: 24.35
  },
  {
    id: 'payslip',
    name: 'Payslip',
    icon: 'Work',
    path: '/ciisUser/payslip',
    category: 'payroll',
    order: 24.4
  },
  {
    id: 'payroll-reports',
    name: 'Payroll Reports',
    icon: 'Work',
    path: '/ciisUser/payroll-reports',
    category: 'payroll',
    order: 24.5
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
    id: 'admin-crm-dashboard',
    name: 'Admin CRM',
    icon: 'Dashboard',
    path: '/ciisUser/crm/admin/dashboard',
    category: 'crm',
    order: 24.6
  },
  {
    id: 'admin-crm-lead-overview',
    name: 'Lead Overview',
    icon: 'Dashboard',
    path: '/ciisUser/crm/admin/lead-overview',
    category: 'crm',
    order: 24.6005
  },
  {
    id: 'admin-crm-all-leads',
    name: 'All Leads',
    icon: 'ListAlt',
    path: '/ciisUser/crm/admin/all-leads',
    category: 'crm',
    order: 24.6008
  },
  {
    id: 'admin-crm-add-lead',
    name: 'Add Lead',
    icon: 'Person',
    path: '/ciisUser/crm/admin/add-lead',
    category: 'crm',
    order: 24.601
  },
  {
    id: 'admin-crm-lead-sources',
    name: 'Lead Sources',
    icon: 'ListAlt',
    path: '/ciisUser/crm/admin/lead-sources',
    category: 'crm',
    order: 24.602
  },
  {
    id: 'admin-crm-lead-types',
    name: 'Lead Types',
    icon: 'ListAlt',
    path: '/ciisUser/crm/admin/lead-types',
    category: 'crm',
    order: 24.603
  },
  {
    id: 'admin-crm-import-export-leads',
    name: 'Import & Export',
    icon: 'Folder',
    path: '/ciisUser/crm/admin/import-export-leads',
    category: 'crm',
    order: 24.604
  },
  {
    id: 'admin-crm-assigned-calls',
    name: 'Assigned Calls',
    icon: 'AssignedCalls',
    path: '/ciisUser/crm/admin/assigned-calls',
    category: 'crm',
    order: 24.61
  },
  {
    id: 'admin-crm-call-overview',
    name: 'Call Overview',
    icon: 'CallOverview',
    path: '/ciisUser/crm/admin/call-overview',
    category: 'crm',
    order: 24.605
  },
  {
    id: 'admin-crm-todays-calls',
    name: "Today's Calls",
    icon: 'TodaysCalls',
    path: '/ciisUser/crm/admin/todays-calls',
    category: 'crm',
    order: 24.612
  },
  {
    id: 'admin-crm-pending-calls',
    name: 'Pending Calls',
    icon: 'PendingCalls',
    path: '/ciisUser/crm/admin/pending-calls',
    category: 'crm',
    order: 24.613
  },
  {
    id: 'admin-crm-completed-calls',
    name: 'Completed Calls',
    icon: 'CompletedCalls',
    path: '/ciisUser/crm/admin/completed-calls',
    category: 'crm',
    order: 24.614
  },
  {
    id: 'admin-crm-converted-calls',
    name: 'Converted Calls',
    icon: 'ConvertedCalls',
    path: '/ciisUser/crm/admin/converted-calls',
    category: 'crm',
    order: 24.615
  },
  {
    id: 'admin-crm-transferred-calls',
    name: 'Transferred Calls',
    icon: 'TransferredCalls',
    path: '/ciisUser/crm/admin/transferred-calls',
    category: 'crm',
    order: 24.616
  },
  {
    id: 'admin-crm-call-history',
    name: 'Call History',
    icon: 'CallHistory',
    path: '/ciisUser/crm/admin/call-history',
    category: 'crm',
    order: 24.617
  },
  {
    id: 'admin-crm-follow-ups',
    name: 'Follow-Up Center',
    icon: 'EventNote',
    path: '/ciisUser/crm/admin/follow-ups',
    category: 'crm',
    order: 24.618
  },
  {
    id: 'admin-crm-assignments',
    name: 'Assignments Overview',
    icon: 'Assignment',
    path: '/ciisUser/crm/admin/assignments',
    category: 'crm',
    order: 24.619
  },
  {
    id: 'admin-crm-assignment-bulk',
    name: 'Bulk Assignment',
    icon: 'Folder',
    path: '/ciisUser/crm/admin/assignment-bulk',
    category: 'crm',
    order: 24.620
  },
  {
    id: 'admin-crm-assignment-history',
    name: 'Assignment History',
    icon: 'History',
    path: '/ciisUser/crm/admin/assignment-history',
    category: 'crm',
    order: 24.621
  },
  {
    id: 'admin-crm-workload',
    name: 'Workload Distribution',
    icon: 'BarChart',
    path: '/ciisUser/crm/admin/workload',
    category: 'crm',
    order: 24.622
  },
  {
    id: 'admin-crm-reports-overview',
    name: 'Reports Overview',
    icon: 'BarChart',
    path: '/ciisUser/crm/reports/overview',
    category: 'crm',
    order: 24.627
  },
  {
    id: 'admin-crm-reports-leads',
    name: 'Lead Reports',
    icon: 'ListAlt',
    path: '/ciisUser/crm/reports/leads',
    category: 'crm',
    order: 24.628
  },
  {
    id: 'admin-crm-reports-calls',
    name: 'Call Reports',
    icon: 'Call',
    path: '/ciisUser/crm/reports/calls',
    category: 'crm',
    order: 24.629
  },
  {
    id: 'admin-crm-reports-follow-ups',
    name: 'Follow-Up Reports',
    icon: 'EventNote',
    path: '/ciisUser/crm/reports/follow-ups',
    category: 'crm',
    order: 24.631
  },
  {
    id: 'admin-crm-reports-team-performance',
    name: 'Team Performance',
    icon: 'Groups',
    path: '/ciisUser/crm/reports/team-performance',
    category: 'crm',
    order: 24.632
  },
  {
    id: 'admin-crm-reports-conversion-funnel',
    name: 'Conversion Funnel',
    icon: 'BarChart',
    path: '/ciisUser/crm/reports/conversion-funnel',
    category: 'crm',
    order: 24.633
  },
  {
    id: 'admin-crm-reports-user-activity',
    name: 'User Activity',
    icon: 'History',
    path: '/ciisUser/crm/reports/user-activity',
    category: 'crm',
    order: 24.634
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
  },
  {
    id: 'create-user',
    name: 'Create User',
    icon: 'Person',
    path: '/ciisUser/create-user',
    category: 'admin',
    order: 29
  },
  {
    id: 'register-request',
    name: 'Register Request',
    icon: 'Assignment',
    path: '/ciisUser/register-request',
    category: 'administration',
    order: 29.1
  },
  {
    id: 'change-password',
    name: 'Change Password',
    icon: 'Settings',
    path: '/ciisUser/change-password',
    category: 'settings',
    order: 30
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
    'Create Alert': '/ciisUser/create-alert',
    'Projects': '/ciisUser/project',
    'My Projects': '/ciisUser/project',
    'Employee Details': '/ciisUser/emp-details',
    'Sidebar Management': '/ciisUser/SidebarManagement',
    'Employee Leaves': '/ciisUser/emp-leaves',
    'Leave Policy Master': '/ciisUser/leave-policy-master',
    'Leave Policy': '/ciisUser/leave-policy',
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
    'Manage Projects': '/ciisUser/adminproject',
    'Company All Tasks': '/ciisUser/company-all-task',
    'Department All Tasks': '/ciisUser/department-all-task',
    'Client Management': '/ciisUser/emp-client',
    'Active Clients': '/ciisUser/active-clients',
    'Salary Component': '/ciisUser/salary-component',
    'Salary Structure': '/ciisUser/salary-structure',
    'Salary Assignment': '/ciisUser/salary-assignment',
    'Employee Salary': '/ciisUser/salary-assignment',
    'Assign Salary': '/ciisUser/assign-salary',
    'Payroll Process': '/ciisUser/payroll-process',
    'Release Payroll': '/ciisUser/release-payroll',
    'Payslip': '/ciisUser/payslip',
    'Payroll Reports': '/ciisUser/payroll-reports',
    'Payment': '/client/payments',
    'Payments': '/client/payments',
    'My Services': '/client/my-services',
    'Tasks & Updates': '/client/tasks-updates',
    'Explore Services': '/client/marketplace',
    'Service Marketplace': '/client/marketplace',
    'Meetings': '/client/support-tickets',
    'Support Tickets': '/client/support-tickets',
    'Documents': '/client/documents',
    'Services & Tasks': '/client/services-tasks',
    'Create User': '/ciisUser/create-user',
    'Change Password': '/ciisUser/change-password',
    'Team Overview': '/ciisUser/crm/admin/team',
    'Users': '/ciisUser/crm/admin/users',
    'Add User': '/ciisUser/crm/admin/add-user',
    'User Type': '/ciisUser/crm/admin/user-type',
    'User Types': '/ciisUser/crm/admin/user-type',
    'Lead Overview': '/ciisUser/crm/admin/lead-overview',
    'All Leads': '/ciisUser/crm/admin/all-leads',
    'Add Lead': '/ciisUser/crm/admin/add-lead',
    'Lead Sources': '/ciisUser/crm/admin/lead-sources',
    'Lead Types': '/ciisUser/crm/admin/lead-types',
    'Import & Export': '/ciisUser/crm/admin/import-export-leads',
    'Import & Export Leads': '/ciisUser/crm/admin/import-export-leads',
    'Call Overview': '/ciisUser/crm/admin/call-overview',
    'Assigned Calls': '/ciisUser/crm/admin/assigned-calls',
    "Today's Calls": '/ciisUser/crm/admin/todays-calls',
    'Pending Calls': '/ciisUser/crm/admin/pending-calls',
    'Scheduled Calls': '/ciisUser/crm/admin/scheduled-calls',
    'Completed Calls': '/ciisUser/crm/admin/completed-calls',
    'Converted Calls': '/ciisUser/crm/admin/converted-calls',
    'Transferred Calls': '/ciisUser/crm/admin/transferred-calls',
    'Call History': '/ciisUser/crm/admin/call-history',
    'Follow-Up Center': '/ciisUser/crm/admin/follow-ups',
    'Follow Up Center': '/ciisUser/crm/admin/follow-ups',
    'Assignments': '/ciisUser/crm/admin/assignments',
    'Assignments Overview': '/ciisUser/crm/admin/assignments',
    'Bulk Assignment': '/ciisUser/crm/admin/assignment-bulk',
    'Assignment History': '/ciisUser/crm/admin/assignment-history',
    'Workload Distribution': '/ciisUser/crm/admin/workload',
    'Team Workload': '/ciisUser/crm/admin/workload',
    'Reports Overview': '/ciisUser/crm/reports/overview',
    'Lead Reports': '/ciisUser/crm/reports/leads',
    'Call Reports': '/ciisUser/crm/reports/calls',
    'Follow-Up Reports': '/ciisUser/crm/reports/follow-ups',
    'Team Performance': '/ciisUser/crm/reports/team-performance',
    'Conversion Funnel': '/ciisUser/crm/reports/conversion-funnel',
    'User Activity': '/ciisUser/crm/reports/user-activity'
  };
  
  return pathMap[name] || '/ciisUser/user-dashboard';
};

const getMenuDisplayName = (name) => {
  if (name === 'My Details') return 'My Profile';
  if (name === 'Projects') return 'My Projects';
  if (name === 'Admin Projects' || name === 'Admin Project') return 'Manage Projects';
  if (name === 'Salary Assignment') return 'Employee Salary';
  return name;
};

const getMenuRouteKey = item => String(item?.path || '').split('/').filter(Boolean).pop();
const managementClientPageIds = new Set(['emp-client', 'active-clients']);

const getMenuAccessKeys = item => {
  const id = String(item?.id || '').trim();
  const rawPath = String(item?.path || '').trim();
  const cleanPath = rawPath.replace(/^\/+/, '');
  const keys = new Set([id, rawPath, cleanPath, getMenuRouteKey(item)].filter(Boolean));

  if (id) {
    keys.add(`/ciisUser/${id}`);
    keys.add(`ciisUser/${id}`);
  }

  if (cleanPath) {
    keys.add(cleanPath.replace(/^ciisUser\//i, ''));
    keys.add(`/ciisUser/${cleanPath}`);
    keys.add(`ciisUser/${cleanPath}`);
  }

  // Release Payroll belongs to the Payroll Process company module. This keeps
  // new child pages available to existing payroll-enabled companies.
  if (id === 'release-payroll') {
    keys.add('payroll-process');
    keys.add('/ciisUser/payroll-process');
    keys.add('ciisUser/payroll-process');
  }

  const clientKey = id.startsWith('client-')
    ? id.substring(7)
    : cleanPath.startsWith('client-')
      ? cleanPath.substring(7)
      : cleanPath.startsWith('client/')
        ? cleanPath.substring(7)
        : '';

  if (clientKey) {
    keys.add(clientKey);
    keys.add(`/client/${clientKey}`);
    keys.add(`client/${clientKey}`);
  }

  return keys;
};

const companyAccessFallbackItems = [
  ...TELECALLER_PAGES,
  ...allPagesItems.filter(item => item.category === 'crm'),
  {
    id: 'active-clients',
    name: 'Active Clients',
    icon: 'Folder',
    path: '/ciisUser/active-clients',
    category: 'clients',
    order: 22.5
  },
  {
    id: 'admin-crm-dashboard',
    name: 'Admin CRM',
    icon: 'Dashboard',
    path: '/ciisUser/crm/admin/dashboard',
    category: 'crm',
    order: 24.6
  },
  {
    id: 'admin-crm-lead-overview',
    name: 'Lead Overview',
    icon: 'Dashboard',
    path: '/ciisUser/crm/admin/lead-overview',
    category: 'crm',
    order: 24.6005
  },
  {
    id: 'admin-crm-all-leads',
    name: 'All Leads',
    icon: 'ListAlt',
    path: '/ciisUser/crm/admin/all-leads',
    category: 'crm',
    order: 24.6008
  },
  {
    id: 'admin-crm-add-lead',
    name: 'Add Lead',
    icon: 'Person',
    path: '/ciisUser/crm/admin/add-lead',
    category: 'crm',
    order: 24.601
  },
  {
    id: 'admin-crm-lead-sources',
    name: 'Lead Sources',
    icon: 'ListAlt',
    path: '/ciisUser/crm/admin/lead-sources',
    category: 'crm',
    order: 24.602
  },
  {
    id: 'admin-crm-lead-types',
    name: 'Lead Types',
    icon: 'ListAlt',
    path: '/ciisUser/crm/admin/lead-types',
    category: 'crm',
    order: 24.603
  },
  {
    id: 'admin-crm-import-export-leads',
    name: 'Import & Export',
    icon: 'Folder',
    path: '/ciisUser/crm/admin/import-export-leads',
    category: 'crm',
    order: 24.604
  },
  {
    id: 'admin-crm-assigned-calls',
    name: 'Assigned Calls',
    icon: 'AssignedCalls',
    path: '/ciisUser/crm/admin/assigned-calls',
    category: 'crm',
    order: 24.61
  },
  {
    id: 'admin-crm-call-overview',
    name: 'Call Overview',
    icon: 'CallOverview',
    path: '/ciisUser/crm/admin/call-overview',
    category: 'crm',
    order: 24.605
  },
  {
    id: 'admin-crm-todays-calls',
    name: "Today's Calls",
    icon: 'TodaysCalls',
    path: '/ciisUser/crm/admin/todays-calls',
    category: 'crm',
    order: 24.612
  },
  {
    id: 'admin-crm-pending-calls',
    name: 'Pending Calls',
    icon: 'PendingCalls',
    path: '/ciisUser/crm/admin/pending-calls',
    category: 'crm',
    order: 24.613
  },
  {
    id: 'admin-crm-completed-calls',
    name: 'Completed Calls',
    icon: 'CompletedCalls',
    path: '/ciisUser/crm/admin/completed-calls',
    category: 'crm',
    order: 24.614
  },
  {
    id: 'admin-crm-converted-calls',
    name: 'Converted Calls',
    icon: 'ConvertedCalls',
    path: '/ciisUser/crm/admin/converted-calls',
    category: 'crm',
    order: 24.615
  },
  {
    id: 'admin-crm-transferred-calls',
    name: 'Transferred Calls',
    icon: 'TransferredCalls',
    path: '/ciisUser/crm/admin/transferred-calls',
    category: 'crm',
    order: 24.616
  },
  {
    id: 'admin-crm-call-history',
    name: 'Call History',
    icon: 'CallHistory',
    path: '/ciisUser/crm/admin/call-history',
    category: 'crm',
    order: 24.617
  },
  {
    id: 'admin-crm-reports-overview',
    name: 'Reports Overview',
    icon: 'BarChart',
    path: '/ciisUser/crm/reports/overview',
    category: 'crm',
    order: 24.627
  },
  {
    id: 'admin-crm-reports-leads',
    name: 'Lead Reports',
    icon: 'ListAlt',
    path: '/ciisUser/crm/reports/leads',
    category: 'crm',
    order: 24.628
  },
  {
    id: 'admin-crm-reports-calls',
    name: 'Call Reports',
    icon: 'Call',
    path: '/ciisUser/crm/reports/calls',
    category: 'crm',
    order: 24.629
  },
  {
    id: 'admin-crm-reports-follow-ups',
    name: 'Follow-Up Reports',
    icon: 'EventNote',
    path: '/ciisUser/crm/reports/follow-ups',
    category: 'crm',
    order: 24.631
  },
  {
    id: 'admin-crm-reports-team-performance',
    name: 'Team Performance',
    icon: 'Groups',
    path: '/ciisUser/crm/reports/team-performance',
    category: 'crm',
    order: 24.632
  },
  {
    id: 'admin-crm-reports-conversion-funnel',
    name: 'Conversion Funnel',
    icon: 'BarChart',
    path: '/ciisUser/crm/reports/conversion-funnel',
    category: 'crm',
    order: 24.633
  },
  {
    id: 'admin-crm-reports-user-activity',
    name: 'User Activity',
    icon: 'History',
    path: '/ciisUser/crm/reports/user-activity',
    category: 'crm',
    order: 24.634
  },
  {
    id: 'salary-component',
    name: 'Salary Component',
    icon: 'Work',
    path: '/ciisUser/salary-component',
    category: 'payroll',
    order: 24.0
  },
  {
    id: 'salary-structure',
    name: 'Salary Structure',
    icon: 'Work',
    path: '/ciisUser/salary-structure',
    category: 'payroll',
    order: 24.1
  },
  {
    id: 'salary-assignment',
    name: 'Employee Salary',
    icon: 'Work',
    path: '/ciisUser/salary-assignment',
    category: 'payroll',
    order: 24.2
  },
  {
    id: 'assign-salary',
    name: 'Assign Salary',
    icon: 'Work',
    path: '/ciisUser/assign-salary',
    category: 'payroll',
    order: 24.25
  },
  {
    id: 'payroll-process',
    name: 'Payroll Process',
    icon: 'Work',
    path: '/ciisUser/payroll-process',
    category: 'payroll',
    order: 24.3
  },
  {
    id: 'release-payroll',
    name: 'Release Payroll',
    icon: 'Work',
    path: '/ciisUser/release-payroll',
    category: 'payroll',
    order: 24.35
  },
  {
    id: 'payslip',
    name: 'Payslip',
    icon: 'Work',
    path: '/ciisUser/payslip',
    category: 'payroll',
    order: 24.4
  },
  {
    id: 'payroll-reports',
    name: 'Payroll Reports',
    icon: 'Work',
    path: '/ciisUser/payroll-reports',
    category: 'payroll',
    order: 24.5
  },
  {
    id: 'admin-crm-todays-calls',
    name: "Today's Calls",
    icon: 'TodaysCalls',
    path: '/ciisUser/crm/admin/todays-calls',
    category: 'crm',
    order: 24.612
  },
  {
    id: 'admin-crm-pending-calls',
    name: 'Pending Calls',
    icon: 'PendingCalls',
    path: '/ciisUser/crm/admin/pending-calls',
    category: 'crm',
    order: 24.613
  },
  {
    id: 'admin-crm-completed-calls',
    name: 'Completed Calls',
    icon: 'CompletedCalls',
    path: '/ciisUser/crm/admin/completed-calls',
    category: 'crm',
    order: 24.614
  },
  {
    id: 'admin-crm-converted-calls',
    name: 'Converted Calls',
    icon: 'ConvertedCalls',
    path: '/ciisUser/crm/admin/converted-calls',
    category: 'crm',
    order: 24.615
  },
  {
    id: 'admin-crm-transferred-calls',
    name: 'Transferred Calls',
    icon: 'TransferredCalls',
    path: '/ciisUser/crm/admin/transferred-calls',
    category: 'crm',
    order: 24.616
  },
  {
    id: 'admin-crm-call-history',
    name: 'Call History',
    icon: 'CallHistory',
    path: '/ciisUser/crm/admin/call-history',
    category: 'crm',
    order: 24.617
  },
  {
    id: 'admin-crm-reports-overview',
    name: 'Reports Overview',
    icon: 'BarChart',
    path: '/ciisUser/crm/reports/overview',
    category: 'crm',
    order: 24.627
  },
  {
    id: 'admin-crm-reports-leads',
    name: 'Lead Reports',
    icon: 'ListAlt',
    path: '/ciisUser/crm/reports/leads',
    category: 'crm',
    order: 24.628
  },
  {
    id: 'admin-crm-reports-calls',
    name: 'Call Reports',
    icon: 'Call',
    path: '/ciisUser/crm/reports/calls',
    category: 'crm',
    order: 24.629
  },
  {
    id: 'admin-crm-reports-follow-ups',
    name: 'Follow-Up Reports',
    icon: 'EventNote',
    path: '/ciisUser/crm/reports/follow-ups',
    category: 'crm',
    order: 24.631
  },
  {
    id: 'admin-crm-reports-team-performance',
    name: 'Team Performance',
    icon: 'Groups',
    path: '/ciisUser/crm/reports/team-performance',
    category: 'crm',
    order: 24.632
  },
  {
    id: 'admin-crm-reports-conversion-funnel',
    name: 'Conversion Funnel',
    icon: 'BarChart',
    path: '/ciisUser/crm/reports/conversion-funnel',
    category: 'crm',
    order: 24.633
  },
  {
    id: 'admin-crm-reports-user-activity',
    name: 'User Activity',
    icon: 'History',
    path: '/ciisUser/crm/reports/user-activity',
    category: 'crm',
    order: 24.634
  },
  {
    id: 'salary-component',
    name: 'Salary Component',
    icon: 'Work',
    path: '/ciisUser/salary-component',
    category: 'payroll',
    order: 24.0
  },
  {
    id: 'salary-structure',
    name: 'Salary Structure',
    icon: 'Work',
    path: '/ciisUser/salary-structure',
    category: 'payroll',
    order: 24.1
  },
  {
    id: 'salary-assignment',
    name: 'Employee Salary',
    icon: 'Work',
    path: '/ciisUser/salary-assignment',
    category: 'payroll',
    order: 24.2
  },
  {
    id: 'assign-salary',
    name: 'Assign Salary',
    icon: 'Work',
    path: '/ciisUser/assign-salary',
    category: 'payroll',
    order: 24.25
  },
  {
    id: 'payroll-process',
    name: 'Payroll Process',
    icon: 'Work',
    path: '/ciisUser/payroll-process',
    category: 'payroll',
    order: 24.3
  },
  {
    id: 'release-payroll',
    name: 'Release Payroll',
    icon: 'Work',
    path: '/ciisUser/release-payroll',
    category: 'payroll',
    order: 24.35
  },
  {
    id: 'payslip',
    name: 'Payslip',
    icon: 'Work',
    path: '/ciisUser/payslip',
    category: 'payroll',
    order: 24.4
  },
  {
    id: 'payroll-reports',
    name: 'Payroll Reports',
    icon: 'Work',
    path: '/ciisUser/payroll-reports',
    category: 'payroll',
    order: 24.5
  }
];

const filterItemsByCompanyAccess = (items, companyData) => {
  const allowedPages = Array.isArray(companyData?.allowedPages) ? companyData.allowedPages : [];
  if (allowedPages.length === 0) return items.filter(item => item.category !== 'admin-telecaller');

  const normalizeKey = value => String(value || '').trim().replace(/^\/+/, '').toLowerCase();
  const allowedSet = new Set(allowedPages.map(item => normalizeKey(item)).filter(Boolean));
  const hasCrmAccess = allowedSet.has('crm') || allowedSet.has('admin-crm');

  return items.filter(item => {
    if (String(item.path || '').toLowerCase().startsWith('/ciisuser/crm/')) {
      return hasCrmAccess || [...getMenuAccessKeys(item)].some(key => allowedSet.has(normalizeKey(key)));
    }
    return [...getMenuAccessKeys(item)].some(key => allowedSet.has(normalizeKey(key)));
  });
};

const addCompanyAccessFallbackItems = (items, companyData, isPageAccessAdmin = false) => {
  const allowedPages = Array.isArray(companyData?.allowedPages) ? companyData.allowedPages : [];

  const normalizeKey = value => String(value || '').trim().replace(/^\/+/, '').toLowerCase();
  const allowedSet = new Set(allowedPages.map(item => normalizeKey(item)).filter(Boolean));
  // Duplicate detection must use the item's own identity only. Access aliases
  // (for example Release Payroll inheriting Payroll Process company access)
  // are eligibility keys, not proof that the child menu item already exists.
  const existingKeys = new Set(items.flatMap(item => [
    item?.id,
    item?.path
  ].map(key => normalizeKey(key))).filter(Boolean));

  const fallbackItems = companyAccessFallbackItems.filter(item => {
    const identityKeys = [item?.id, item?.path].map(normalizeKey).filter(Boolean);
    const eligible = item.category === 'crm'
      || allowedPages.length === 0
      || isPageAccessAdmin
      || [...getMenuAccessKeys(item)].some(key => allowedSet.has(normalizeKey(key)));
    if (!eligible || identityKeys.some(key => existingKeys.has(key))) return false;
    identityKeys.forEach(key => existingKeys.add(key));
    return true;
  });

  return fallbackItems.length ? [...items, ...fallbackItems] : items;
};

const placeReleasePayrollAfterProcess = items => {
  const ordered = [...items];
  const releaseIndex = ordered.findIndex(item => (
    String(item?.id || '').toLowerCase() === 'release-payroll' ||
    String(item?.path || '').toLowerCase().replace(/\/+$/, '') === '/ciisuser/release-payroll'
  ));
  if (releaseIndex < 0) return ordered;

  const [releaseItem] = ordered.splice(releaseIndex, 1);
  const processIndex = ordered.findIndex(item => (
    String(item?.id || '').toLowerCase() === 'payroll-process' ||
    String(item?.path || '').toLowerCase().replace(/\/+$/, '') === '/ciisuser/payroll-process'
  ));
  ordered.splice(processIndex >= 0 ? processIndex + 1 : ordered.length, 0, releaseItem);
  return ordered;
};

const Sidebar = ({ isMobile = false, closeSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [userData, setUserData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [companyData, setCompanyData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('companyDetails') || 'null');
    } catch {
      return null;
    }
  });
  const [resolvedJobRoleName, setResolvedJobRoleName] = useState("");
  const [sidebarConfig, setSidebarConfig] = useState(null);
  const [pagePermissions, setPagePermissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientCompanies, setClientCompanies] = useState([]);
  const [selectedClientCompanyId, setSelectedClientCompanyId] = useState("");
  const [clientCompanyDropdownOpen, setClientCompanyDropdownOpen] = useState(true);
  const [telecallerWorkspaceOpen, setTelecallerWorkspaceOpen] = useState(true);
  useEffect(() => {
    if (/\/telecaller\/(call-dashboard|assigned-calls|todays-calls|pending-calls|scheduled-calls|completed-calls|call-history|call-workspace|lead-detail)(\/|$)/i.test(location.pathname)) {
      setTelecallerWorkspaceOpen(true);
    }
  }, [location.pathname]);
  const [openAdminCrmGroups, setOpenAdminCrmGroups] = useState(() => new Set(
    location.pathname.includes('/crm/admin/add-lead') ? ['lead-management'] : ['call-management']
  ));
  const [menuBadgeCounts, setMenuBadgeCounts] = useState({});
  const [seenBadgeCounts, setSeenBadgeCounts] = useState({});
  const sidebarRef = useRef(null);
  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);
  const isAlertsPage = location.pathname === '/ciisUser/alert' || location.pathname.endsWith('/alert');
  const userId = String(userData?._id || userData?.id || '').trim();
  const sidebarCompanyId = String(
    getRecordId(userData?.company || userData?.companyId || companyData?._id || companyData?.id) || ''
  ).trim();
  const sidebarDepartmentId = String(getRecordId(userData?.department || userData?.departmentId) || '').trim();
  const sidebarBranchId = String(getRecordId(userData?.branch || userData?.branchId || userData?.branchDetails) || '').trim();
  const sidebarRoleKey = String(
    getRecordId(userData?.jobRole || userData?.role || userData?.roleId) ||
    resolvedJobRoleName ||
    userData?.jobRoleName ||
    userData?.roleName ||
    getRecordDisplayName(userData?.jobRole) ||
    getRecordDisplayName(userData?.role) ||
    getRecordDisplayName(userData?.roleId) ||
    ''
  ).trim();

  
  const isSidebarOpen = isMobile || isHovered;

  
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
    const normalize = value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    const departmentName = normalize(
      getRecordDisplayName(userData?.department) ||
      userData?.departmentName ||
      userData?.department
    );
    const jobRoleName = normalize(
      getRecordDisplayName(userData?.jobRole) ||
      userData?.jobRoleName ||
      userData?.roleName ||
      userData?.jobRole
    );
    const companyRoleName = normalize(userData?.companyRole);

    return departmentName === "management" &&
      jobRoleName === "super_admin" &&
      companyRoleName === "owner";
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

          const parsedUserId = parsedUser?._id || parsedUser?.id;
          if (parsedUserId && parsedUser?.companyRole !== 'client') {
            try {
              const profileResponse = await axiosInstance.get(`/users/profile/${parsedUserId}`);
              const latestProfile = profileResponse.data?.user || profileResponse.data?.data || profileResponse.data;
              if (latestProfile && typeof latestProfile === 'object') {
                parsedUser = { ...parsedUser, ...latestProfile };
                setUserData(parsedUser);
                localStorage.setItem('user', JSON.stringify(parsedUser));
              }
            } catch (profileError) {
              console.warn('Could not refresh profile completion data:', profileError.message);
            }
          }
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

  const fetchMenuBadgeCounts = useCallback(async () => {
    if (!userId) return;

    const requests = await Promise.allSettled([
      axiosInstance.get('/tasks/self', { _skipErrorNotify: true }),
      axiosInstance.get('/tasks/assigned/to-me', { _skipErrorNotify: true }),
      axiosInstance.get('/asset-requests/my-requests', { _skipErrorNotify: true }),
      axiosInstance.get(`/meetings/user/${userId}`, {
        params: { page: 1, limit: 100 },
        _skipErrorNotify: true
      }),
      axiosInstance.get('/alerts', { _skipErrorNotify: true }),
      axiosInstance.get(`/users/${userId}/groups`, { _skipErrorNotify: true }),
      axiosInstance.get('/leaves/status', { _skipErrorNotify: true })
    ]);

    const [
      selfTasksResult,
      assignedTasksResult,
      assetsResult,
      meetingsResult,
      alertsResult,
      groupsResult,
      leavesResult
    ] = requests;
    const nextCounts = {};

    if (selfTasksResult.status === 'fulfilled' || assignedTasksResult.status === 'fulfilled') {
      const selfTasks = selfTasksResult.status === 'fulfilled'
        ? flattenGroupedRecords(selfTasksResult.value?.data?.groupedTasks || selfTasksResult.value?.data?.data?.groupedTasks)
        : [];
      const assignedTasks = assignedTasksResult.status === 'fulfilled'
        ? flattenGroupedRecords(assignedTasksResult.value?.data?.groupedTasks || assignedTasksResult.value?.data?.data?.groupedTasks)
        : [];
      const uniquePendingTasks = new Map();

      [...selfTasks, ...assignedTasks].filter(isPendingRecord).forEach((task, index) => {
        uniquePendingTasks.set(String(task?._id || task?.id || `task-${index}`), task);
      });
      nextCounts.tasks = uniquePendingTasks.size;
    }

    if (assetsResult.status === 'fulfilled') {
      const requestsData = getResponseRecords(assetsResult.value, ['requests']);
      nextCounts.assets = requestsData.filter(request => (
        String(request?.status || '').toLowerCase() === 'pending'
      )).length;
    }

    if (leavesResult.status === 'fulfilled') {
      const leaves = getResponseRecords(leavesResult.value, ['leaves']);
      nextCounts.leaves = leaves.filter(leave => (
        String(leave?.status || '').toLowerCase() === 'pending'
      )).length;
    }

    if (meetingsResult.status === 'fulfilled') {
      const meetings = getResponseRecords(meetingsResult.value, ['meetings']);
      const now = Date.now();
      nextCounts.meetings = meetings.filter(meeting => {
        const status = String(meeting?.status || '').toLowerCase();
        if (['completed', 'closed', 'cancelled', 'canceled'].includes(status)) return false;
        const dateValue = meeting?.meetingDate || meeting?.date || meeting?.startDate || meeting?.scheduledAt;
        const timestamp = dateValue ? new Date(dateValue).getTime() : NaN;
        return Number.isNaN(timestamp) || timestamp >= now;
      }).length;
    }

    if (alertsResult.status === 'fulfilled') {
      const alerts = getResponseRecords(alertsResult.value, ['alerts']);
      const userGroupIds = groupsResult.status === 'fulfilled'
        ? getResponseRecords(groupsResult.value, ['groups']).map(group => String(group?._id || group?.id || group))
        : [];
      const visibleAlerts = alerts.filter(alert => {
        const assignedUsers = Array.isArray(alert?.assignedUsers) ? alert.assignedUsers : [];
        const assignedGroups = Array.isArray(alert?.assignedGroups) ? alert.assignedGroups : [];
        if (assignedUsers.length === 0 && assignedGroups.length === 0) return true;

        const assignedToUser = assignedUsers.some(user => String(user?._id || user?.id || user) === String(userId));
        const assignedToGroup = assignedGroups.some(group => (
          userGroupIds.includes(String(group?._id || group?.id || group))
        ));
        return assignedToUser || assignedToGroup;
      });

      nextCounts.alerts = visibleAlerts.filter(alert => (
        !Array.isArray(alert?.readBy) ||
        !alert.readBy.some(reader => String(reader?._id || reader?.id || reader) === String(userId))
      )).length;
    }

    setMenuBadgeCounts(current => {
      const mergedCounts = { ...current, ...nextCounts };
      writeBadgeCache(userId, mergedCounts);
      return mergedCounts;
    });
  }, [userId]);

  const badgeSeenStorageKey = useMemo(() => {
    return userId ? `ciis-sidebar-badges-seen:${userId}` : '';
  }, [userId]);

  useEffect(() => {
    if (!badgeSeenStorageKey) {
      setSeenBadgeCounts({});
      return;
    }

    try {
      setSeenBadgeCounts(JSON.parse(localStorage.getItem(badgeSeenStorageKey) || '{}'));
    } catch {
      setSeenBadgeCounts({});
    }
  }, [badgeSeenStorageKey]);

  useEffect(() => {
    if (!badgeSeenStorageKey) return;

    setSeenBadgeCounts(current => {
      let changed = false;
      const next = { ...current };

      Object.entries(menuBadgeCounts).forEach(([key, rawCount]) => {
        const count = Math.max(0, Number(rawCount) || 0);
        const seenCount = Math.max(0, Number(next[key]) || 0);
        if (seenCount > count) {
          next[key] = count;
          changed = true;
        }
      });

      if (changed) localStorage.setItem(badgeSeenStorageKey, JSON.stringify(next));
      return changed ? next : current;
    });
  }, [badgeSeenStorageKey, menuBadgeCounts]);

  useEffect(() => {
    if (!userData || isAlertsPage) return undefined;

    const cachedCounts = readBadgeCache(userId);
    if (cachedCounts) {
      setMenuBadgeCounts(current => ({ ...current, ...cachedCounts }));
    } else {
      fetchMenuBadgeCounts();
    }

    const refreshBadges = () => fetchMenuBadgeCounts();
    window.addEventListener('ciis-sidebar-badges-refresh', refreshBadges);

    return () => {
      window.removeEventListener('ciis-sidebar-badges-refresh', refreshBadges);
    };
  }, [userId, fetchMenuBadgeCounts, isAlertsPage]);

  
  const fetchSidebarConfig = useCallback(async () => {
    if (!userId || !sidebarCompanyId) return;

    try {
      setError(null);
      
      const token = localStorage.getItem("token");

      const response = await axiosInstance.get(`/sidebar/config`, {
        params: {
          companyId: sidebarCompanyId,
          ...(sidebarBranchId ? { branchId: sidebarBranchId } : {}),
          departmentId: sidebarDepartmentId,
          role: sidebarRoleKey
        },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        if (response.data.data) {
          setSidebarConfig(response.data.data);
        } else {
          const fallbackConfig = { 
            useFixedDefault: true,
            message: 'No custom config found, using fixed default items'
          };
          setSidebarConfig(fallbackConfig);
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
  }, [userId, sidebarCompanyId, sidebarDepartmentId, sidebarBranchId, sidebarRoleKey]);

  useEffect(() => {
    if (userId && sidebarCompanyId) {
      fetchSidebarConfig();
    }
  }, [userId, sidebarCompanyId, fetchSidebarConfig]);

  useEffect(() => {
    if (!userId || !sidebarCompanyId || isClientUser) {
      setPagePermissions(null);
      return undefined;
    }

    let cancelled = false;
    loadPagePermissionCatalog()
      .then(async catalog => {
        const pages = Array.isArray(catalog?.pages) ? catalog.pages : [];
        // Older servers can omit CRM entries from their page catalog even
        // though by-path permissions already exist for those pages.
        const pagesByPath = new Map(pages.map(page => [String(page.path || '').toLowerCase().replace(/\/+$/, ''), page]));
        [...CRM_PAGES.map(page => ({ ...page, path: `/ciisUser/${page.path}` })), ...TELECALLER_PAGES].forEach(page => {
          const key = page.path.toLowerCase();
          if (!pagesByPath.has(key)) pagesByPath.set(key, { ...page, pageKey: page.id });
        });
        const completePages = [...pagesByPath.values()];
        const strictPages = completePages.filter(page => requiresPageAccess(page?.path));
        const detailedPages = [...(catalog.accessPages || [])];
        // Older servers do not support the batch. Bound their request concurrency.
        if (!Array.isArray(catalog.accessPages)) {
          for (let offset = 0; offset < strictPages.length && !cancelled; offset += 4) {
            detailedPages.push(...await Promise.all(strictPages.slice(offset, offset + 4).map(async page => {
              try { return await loadPagePermission(page.path); }
              catch { return page; }
            })));
          }
        }
        const detailsByPath = new Map(detailedPages.map(page => [
          String(page?.path || '').toLowerCase().replace(/\/+$/, ''),
          page
        ]));
        const permissionPages = completePages.map(page => (
          detailsByPath.get(String(page?.path || '').toLowerCase().replace(/\/+$/, '')) || page
        ));

        if (!cancelled) setPagePermissions(permissionPages);
      })
      .catch(() => {
        if (!cancelled) setPagePermissions(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, sidebarCompanyId, isClientUser]);

  useEffect(() => {
    const resolveJobRoleName = async () => {
      if (!userId) {
        setResolvedJobRoleName("");
        return;
      }

      const directRoleName =
        userData?.jobRoleName ||
        userData?.roleName ||
        userData?.designation ||
        getRecordDisplayName(userData?.jobRole) ||
        getRecordDisplayName(userData?.role) ||
        getRecordDisplayName(userData?.roleId);

      if (directRoleName) {
        setResolvedJobRoleName(directRoleName);
        return;
      }

      const roleId = getRecordId(userData?.jobRole || userData?.role || userData?.roleId);
      if (!isMongoId(roleId)) {
        setResolvedJobRoleName("");
        return;
      }

      try {
        const companyId = sidebarCompanyId;
        const companyCode = userData?.companyCode || companyData?.companyCode || companyData?.code;
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
  }, [userId, sidebarCompanyId, userData?.jobRoleName, userData?.roleName, userData?.designation, userData?.jobRole, userData?.role, userData?.roleId, companyData?.companyCode, companyData?.code]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 50);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    
    leaveTimer.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, [isMobile]);

  const markSidebarBadgeSeen = useCallback((badgeKey) => {
    if (!badgeKey || !badgeSeenStorageKey) return;
    const currentCount = Math.max(0, Number(menuBadgeCounts[badgeKey]) || 0);

    setSeenBadgeCounts(current => {
      const next = { ...current, [badgeKey]: currentCount };
      localStorage.setItem(badgeSeenStorageKey, JSON.stringify(next));
      return next;
    });
  }, [badgeSeenStorageKey, menuBadgeCounts]);

  const handleLogout = useCallback(async () => {
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
      localStorage.removeItem("sidebarConfig");

      Swal.fire({
        title: "Logged Out!",
        text: "You have successfully logged out.",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
      });

      setTimeout(() => navigate("/"), 1800);
    }
  }, [navigate]);

  const handleNavigate = useCallback((path, badgeKey) => {
    if (path === 'logout') {
      handleLogout();
      return;
    }

    markSidebarBadgeSeen(badgeKey);
    navigate(path);
    if (isMobile) {
      closeSidebar?.();
    } else {
      setIsHovered(false);
    }
  }, [closeSidebar, handleLogout, isMobile, navigate, markSidebarBadgeSeen]);

  const handleClientCompanySwitch = useCallback((clientCompany) => {
    const nextId = clientCompany?._id || clientCompany?.id;
    if (!nextId) return;

    localStorage.setItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY, String(nextId));
    localStorage.setItem("client", JSON.stringify(clientCompany));
    localStorage.removeItem("sidebarConfig");
    setSelectedClientCompanyId(String(nextId));
    window.dispatchEvent(new CustomEvent(CLIENT_PORTAL_SELECTION_EVENT, {
      detail: { clientId: nextId }
    }));

    if (!location.pathname.startsWith("/client")) {
      navigate("/client/dashboard");
    }

    if (isMobile) {
      closeSidebar?.();
    } else {
      setIsHovered(false);
    }
  }, [isMobile, location.pathname, navigate, closeSidebar]);

  const handleRetry = () => {
    setError(null);
    if (userData && companyData) {
      fetchSidebarConfig();
    }
  };

  const menuItems = useMemo(() => {
    if (loading) return [];

    const removeHiddenSidebarItems = items => items.filter(item => {
      const id = String(item?.id || "").toLowerCase();
      const name = String(item?.name || "").toLowerCase();
      const path = String(item?.path || "").toLowerCase();
      const removedCrmIds = new Set([
        'marketing-overview', 'marketing-follow-ups', 'visit-management', 'marketing-activity-history', 'marketing-converted-leads',
        'admin-crm-team-overview', 'admin-crm-users', 'admin-crm-add-user', 'admin-crm-user-types'
      ]);
      const removedCrmNames = new Set([
        'marketing admin', 'marketing overview', 'marketing follow-ups', 'visit management', 'marketing activity history',
        'team & access', 'team overview', 'team users', 'add team user', 'user types'
      ]);
      const removedCrmPath = path.startsWith('/ciisuser/crm/marketing/')
        || ['/ciisuser/crm/admin/team', '/ciisuser/crm/admin/users', '/ciisuser/crm/admin/add-user', '/ciisuser/crm/admin/user-type'].includes(path);
      return id !== "contact-support"
        && !removedCrmIds.has(id)
        && !removedCrmNames.has(name)
        && !removedCrmPath
        && id !== "profile"
        && name !== "support center"
        && name !== "contact support"
        && name !== "my profile"
        && !path.includes("contact-support")
        && path !== "/ciisuser/profile";
    });

    const roleValues = [
      userData?.companyRole,
      userData?.jobRole,
      userData?.role,
      userData?.jobRoleName,
      userData?.roleName,
      resolvedJobRoleName
    ];
    const isPageAccessAdmin = roleValues.some(value => PAGE_ACCESS_ROLES.has(
      normalizePermissionRole(getRecordDisplayName(value) || value)
    ));
    const configuredPages = new Map(
      (Array.isArray(pagePermissions) ? pagePermissions : [])
        .filter(page => getPermissionUserIds(page).length > 0)
        .map(page => [String(page.path || '').toLowerCase().replace(/\/+$/, ''), page])
    );
    const allPermissionPages = new Map(
      (Array.isArray(pagePermissions) ? pagePermissions : [])
        .map(page => [String(page.path || '').toLowerCase().replace(/\/+$/, ''), page])
    );
    const crmDashboardPermission = allPermissionPages.get('/ciisuser/crm/admin/dashboard');
    const permissionForPath = itemPath => {
      const directPermission = allPermissionPages.get(itemPath);
      if (hasConfiguredPageAccess(directPermission) || !isCrmPage(itemPath)) return directPermission;
      return hasConfiguredPageAccess(crmDashboardPermission) ? crmDashboardPermission : directPermission;
    };
    const filterItemsByPageAccess = items => {
      items = items.filter(item => {
        if (item.category !== 'admin-telecaller') return true;
        if (!hasTelecallerCompanyAccess(item, companyData)) return false;
        const permission = allPermissionPages.get(String(item.path).toLowerCase());
        return Boolean(permission && hasPageAccess(permission, userId, 'view'));
      });
      if (!pagePermissions) {
        return items.filter(item => isPageAccessAdmin || (!isCrmPage(item?.path) && !requiresPageAccess(item?.path)));
      }
      return items.filter(item => {
        const itemPath = String(item?.path || '').toLowerCase().replace(/\/+$/, '');
        if (isCrmPage(itemPath)) return hasPageAccess(permissionForPath(itemPath), userId, 'view');
        if (isPageAccessAdmin) return true;
        if (requiresPageAccess(itemPath)) {
          return hasPageAccess(allPermissionPages.get(itemPath), userId, 'view');
        }
        const page = configuredPages.get(itemPath);
        if (!page) return true;
        return getPermissionUserIds(page).includes(userId);
      });
    };

    if (isClientUser) {
      return removeHiddenSidebarItems([...clientMenuItems]);
    }

    if (isSuperAdminWithManagement) {
      return placeReleasePayrollAfterProcess(filterItemsByPageAccess(removeHiddenSidebarItems(filterItemsByCompanyAccess(allPagesItems, companyData))));
    }

    let items = [];

    if (sidebarConfig && sidebarConfig.menuItems && Array.isArray(sidebarConfig.menuItems)) {
      items = sidebarConfig.menuItems
        .map((item, index) => {
          const crmPage = allPagesItems.find(page => ['crm', 'admin-telecaller'].includes(page.category) && (
            page.id === item.id ||
            page.path.toLowerCase() === String(item.path || '').toLowerCase().replace(/\/+$/, '')
          ));
          const processedItem = {
            id: crmPage?.id || item.id || item._id || Math.random().toString(36).substr(2, 9),
            // CRM entries always use the canonical page label. Older saved
            // configs sometimes persisted the page id in `name`, which made
            // raw ids flash in the sidebar after a refresh.
            name: getMenuDisplayName(crmPage?.name || item.name || 'Unnamed Item'),
            icon: crmPage?.icon || item.icon || 'Dashboard',
            category: crmPage?.category || item.category || 'main',
            order: Number.isFinite(Number(item.order)) && Number(item.order) !== 99 ? Number(item.order) : (index + 1),
            path: crmPage?.path || item.path || getPathFromName(item.name),
            disabled: item.disabled || false,
            visible: item.visible !== false
          };

          return processedItem;
        })
        .filter(item => {
          const isClientPortalItem = item.category === 'clients' || item.path.startsWith('/client/');
          return item.visible
            && !item.disabled
            && (!isClientPortalItem || managementClientPageIds.has(item.id));
        });
    } 
    else if (sidebarConfig && (sidebarConfig.useFixedDefault || !sidebarConfig.menuItems)) {
      void 0;
      items = isClientUser ? [...clientMenuItems] : [...fixedDefaultItems];
    }
    else {
      void 0;
      items = isClientUser ? [...clientMenuItems] : [...fixedDefaultItems];
    }

    // Plan-enabled strict pages (Payroll/CRM) must remain discoverable even
    // when the user's role has an older saved sidebar configuration. The
    // page-access filter below still removes every page not assigned to them.
    let accessFilteredItems = filterItemsByCompanyAccess(
      addCompanyAccessFallbackItems(items, companyData, isPageAccessAdmin),
      companyData
    );

    // Strict payroll permissions are the source of truth. Older role sidebar
    // configs may not contain newly introduced pages, so inject an assigned
    // Release Payroll item before the final access filter and ordering pass.
    const releasePermission = allPermissionPages.get('/ciisuser/release-payroll');
    const canViewReleasePayroll = Boolean(
      releasePermission && hasPageAccess(releasePermission, userId, 'view')
    );
    const hasReleasePayrollItem = accessFilteredItems.some(item => (
      String(item?.id || '').toLowerCase() === 'release-payroll' ||
      String(item?.path || '').toLowerCase().replace(/\/+$/, '') === '/ciisuser/release-payroll'
    ));
    if (canViewReleasePayroll && !hasReleasePayrollItem) {
      accessFilteredItems = [...accessFilteredItems, {
        id: 'release-payroll',
        name: 'Release Payroll',
        icon: 'Work',
        path: '/ciisUser/release-payroll',
        category: 'payroll',
        order: 24.35
      }];
    }

    // Keep the register approval page available to the same privileged roles
    // that are allowed by the backend controller, including companies with a
    // saved/custom sidebar configuration.
    {
      const normalizeRole = value => String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
      const registerRequestRoles = new Set([
        'owner', 'admin', 'hr', 'super_admin', 'superadmin',
        'company_owner', 'companyowner'
      ]);
      const canManageRegisterRequests = [
        userData?.companyRole,
        userData?.jobRole,
        userData?.role
      ].some(value => registerRequestRoles.has(normalizeRole(getRecordDisplayName(value) || value)));
      const hasRegisterRequest = accessFilteredItems.some(item => (
        item.id === 'register-request' || item.path === '/ciisUser/register-request'
      ));

      if (canManageRegisterRequests && !hasRegisterRequest) {
        accessFilteredItems = [
          ...accessFilteredItems,
          {
            id: 'register-request',
            name: 'Register Request',
            icon: 'Assignment',
            path: '/ciisUser/register-request',
            category: 'admin',
            order: 29.1
          }
        ];
      }
    }

    // Sidebar configuration is an administrative capability. A saved role
    // configuration must never expose it to ordinary employees.
    const normalizeAdministrativeRole = value => String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    const sidebarManagementRoles = new Set([
      'owner', 'admin', 'hr', 'manager', 'super_admin', 'superadmin',
      'company_owner', 'companyowner'
    ]);
    const canManageSidebar = [
      userData?.companyRole,
      userData?.jobRole,
      userData?.role
    ].some(value => sidebarManagementRoles.has(
      normalizeAdministrativeRole(getRecordDisplayName(value) || value)
    ));

    if (!canManageSidebar) {
      accessFilteredItems = accessFilteredItems.filter(item => (
        item.id !== 'SidebarManagement' &&
        String(item.path || '').toLowerCase() !== '/ciisuser/sidebarmanagement'
      ));
    }

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

    return placeReleasePayrollAfterProcess(filterItemsByPageAccess(removeHiddenSidebarItems(sortedItems)));
  }, [sidebarConfig, loading, isSuperAdminWithManagement, isClientUser, userData, companyData, pagePermissions, userId, resolvedJobRoleName]);

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

  useEffect(() => {
    const handleProfileUpdated = event => {
      const updatedProfile = event.detail;
      if (!updatedProfile || typeof updatedProfile !== 'object') return;
      setUserData(current => ({ ...current, ...updatedProfile }));
    };

    window.addEventListener('ciis-profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('ciis-profile-updated', handleProfileUpdated);
  }, []);

  const profileCompletion = useMemo(() => {
    return getProfileCompletion(userData);
  }, [userData]);

  useEffect(() => {
    if (loading || !menuItems.length) return;
    const prefetchTargets = menuItems
      .map(item => item?.path)
      .filter(Boolean)
      .slice(0, 4);
    preloadRouteChunks(prefetchTargets);
  }, [loading, menuItems]);

  const renderMenuItem = (item, showFull) => {
    const selected = location.pathname === item.path;
    const itemKey = `${item.id || ''} ${item.name || ''} ${item.category || ''}`.toLowerCase();
    const isMyLeavesItem = (
      String(item.id || '').toLowerCase() === 'my-leaves' ||
      String(item.name || '').toLowerCase() === 'my leaves'
    );
    const badgeKey = (
      itemKey.includes('task') ? 'tasks' :
      itemKey.includes('meeting') ? 'meetings' :
      itemKey.includes('asset') ? 'assets' :
      isMyLeavesItem ? 'leaves' :
      itemKey.includes('alert') ? 'alerts' :
      ''
    );
    const rawBadgeValue = badgeKey ? menuBadgeCounts[badgeKey] : item.badge;
    const rawNumericBadge = Number(rawBadgeValue);
    const seenCount = badgeKey ? Math.max(0, Number(seenBadgeCounts[badgeKey]) || 0) : 0;
    const badgeValue = badgeKey && Number.isFinite(rawNumericBadge)
      ? Math.max(0, rawNumericBadge - seenCount)
      : rawBadgeValue;
    const numericBadge = Number(badgeValue);
    const hasBadge = badgeValue === true || (Number.isFinite(numericBadge) && numericBadge > 0);
    const icon = (
      <Box
        component="span"
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          flexShrink: 0,
          '& > svg': {
            width: isSuperAdminWithManagement ? 24 : 22,
            height: isSuperAdminWithManagement ? 24 : 22,
            fontSize: isSuperAdminWithManagement ? 24 : 22,
            flexShrink: 0
          }
        }}
      >
        {getIconComponent(item.icon)}
        {hasBadge && (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: -4,
              right: -5,
              minWidth: badgeValue === true ? 7 : 14,
              height: badgeValue === true ? 7 : 14,
              px: badgeValue === true ? 0 : '3px',
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '999px',
              bgcolor: '#dc2626',
              color: '#fff',
              border: `1.5px solid ${theme.palette.background.paper}`,
              fontSize: '8px',
              lineHeight: 1,
              fontWeight: 700,
              zIndex: 1
            }}
          >
            {badgeValue === true ? null : (numericBadge > 99 ? '99+' : numericBadge)}
          </Box>
        )}
      </Box>
    );
    
    if (showFull) {
      return (
        <Tooltip title={item.name} placement="right" enterDelay={700}>
          <StyledListItemButton
            selected={selected}
            onMouseEnter={() => preloadRouteByPath(item.path)}
            onFocus={() => preloadRouteByPath(item.path)}
            onClick={() => !item.disabled && handleNavigate(item.path, badgeKey)}
            disabled={item.disabled}
            sx={{
              minHeight: 48,
              height: 'auto',
              alignItems: 'center',
              mx: 0.5,
              px: 1,
              opacity: item.disabled ? 0.5 : 1,
              cursor: item.disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <StyledListItemIcon sx={{ mr: 1 }}>
              {icon}
            </StyledListItemIcon>
            <ListItemText
              primary={item.name}
              sx={{ minWidth: 0, my: 0, overflow: 'visible' }}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: selected ? 600 : 500,
                fontSize: '0.72rem',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textOverflow: 'clip'
              }}
            />
          </StyledListItemButton>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title={item.name} placement="right">
          <StyledListItemButton
            selected={selected}
            onMouseEnter={() => preloadRouteByPath(item.path)}
            onFocus={() => preloadRouteByPath(item.path)}
            onClick={() => !item.disabled && handleNavigate(item.path, badgeKey)}
            disabled={item.disabled}
            sx={{ 
              justifyContent: 'center',
              opacity: item.disabled ? 0.5 : 1,
              cursor: item.disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <StyledListItemIcon sx={{ marginRight: 0, fontSize: '1.2rem' }}>
              {icon}
            </StyledListItemIcon>
          </StyledListItemButton>
        </Tooltip>
      );
    }
  };

  const renderTelecallerMenu = (items) => {
    const callSlugs = ['call-dashboard', 'assigned-calls', 'todays-calls', 'pending-calls', 'scheduled-calls', 'completed-calls', 'call-history', 'call-workspace', 'lead-detail'];
    const getSlug = item => String(item.path || '').replace(/\/+$/, '').split('/').pop();
    const children = callSlugs.map(slug => items.find(item => getSlug(item) === slug)).filter(Boolean);
    const dashboard = items.find(item => getSlug(item) === 'dashboard');
    const remaining = items.filter(item => getSlug(item) !== 'dashboard' && !callSlugs.includes(getSlug(item)));
    const selected = children.some(item => location.pathname === item.path)
      || /\/telecaller\/(call-workspace|lead-detail)(\/|$)/i.test(location.pathname);
    const submenuId = `telecaller-call-menu-${isMobile ? 'mobile' : 'desktop'}`;

    return (
      <List sx={{ py: 0 }}>
        {dashboard && <StyledListItem disablePadding>{renderMenuItem(dashboard, isSidebarOpen)}</StyledListItem>}
        {children.length > 0 && (
          <>
            <StyledListItem disablePadding>
              <Tooltip title={isSidebarOpen ? '' : 'Call Workspace'} placement="right">
                <StyledListItemButton
                  component="button"
                  type="button"
                  selected={selected}
                  aria-label="Call Workspace"
                  aria-expanded={isSidebarOpen && telecallerWorkspaceOpen}
                  aria-controls={submenuId}
                  onClick={() => setTelecallerWorkspaceOpen(open => !open)}
                  sx={{ minHeight: 48, width: '100%', mx: isSidebarOpen ? 0.5 : 0, px: isSidebarOpen ? 1 : 0, justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
                >
                  <StyledListItemIcon sx={{ mr: isSidebarOpen ? 1 : 0 }}><SupportAgentIcon /></StyledListItemIcon>
                  {isSidebarOpen && (
                    <>
                      <ListItemText primary="Call Workspace" primaryTypographyProps={{ fontSize: '0.72rem', fontWeight: selected ? 600 : 500 }} />
                      {telecallerWorkspaceOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                    </>
                  )}
                </StyledListItemButton>
              </Tooltip>
            </StyledListItem>
            <Collapse id={submenuId} in={isSidebarOpen && telecallerWorkspaceOpen} timeout="auto">
              <List disablePadding sx={{
  ml: 2.25,
  mr: 1,
  my: 0.35,
  pl: 0.75,
  borderLeft: '1px solid',
  borderColor: 'divider',
  '& .MuiListItemButton-root': { minHeight: 38, width: '100%', mx: 0, borderRadius: '0 7px 7px 0' }
}}> 
                {children.map(item => (
                  <StyledListItem key={item.id} disablePadding>{renderMenuItem(item, true)}</StyledListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}
        {remaining.map(item => (
          <StyledListItem key={item.id} disablePadding>{renderMenuItem(item, isSidebarOpen)}</StyledListItem>
        ))}
      </List>
    );
  };

  const renderAdminCrmMenu = (items) => {
    const dashboardItem = items.find(item => item.id === 'admin-crm-dashboard');
    const groupedIds = new Set(ADMIN_CRM_MENU_GROUPS.flatMap(group => group.itemIds));
    const remainingItems = items.filter(item => item.id !== 'admin-crm-dashboard' && !groupedIds.has(item.id));

    const toggleGroup = (groupId) => {
      setOpenAdminCrmGroups(current => {
        const next = new Set(current);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        return next;
      });
    };

    return (
      <List sx={{ py: 0 }}>
        {dashboardItem && (
          <StyledListItem disablePadding>
            {renderMenuItem({ ...dashboardItem, name: 'Dashboard' }, isSidebarOpen)}
          </StyledListItem>
        )}

        {ADMIN_CRM_MENU_GROUPS.map(group => {
          const children = group.itemIds.map(id => items.find(item => item.id === id)).filter(Boolean);
          if (!children.length) return null;
          if (group.direct) return (
            <StyledListItem key={group.id} disablePadding>
              {renderMenuItem(children[0], isSidebarOpen)}
            </StyledListItem>
          );
          const isOpen = openAdminCrmGroups.has(group.id);
          const hasSelectedChild = children.some(item => location.pathname === item.path);
          const groupButton = (
            <StyledListItemButton
              selected={hasSelectedChild}
              onClick={() => toggleGroup(group.id)}
              sx={{
                minHeight: 48,
                mx: isSidebarOpen ? 0.5 : 0,
                px: isSidebarOpen ? 1 : 0,
                justifyContent: isSidebarOpen ? 'flex-start' : 'center'
              }}
            >
              <StyledListItemIcon sx={{ mr: isSidebarOpen ? 1 : 0 }}>
                {getIconComponent(group.icon)}
              </StyledListItemIcon>
              {isSidebarOpen && (
                <>
                  <ListItemText
                    primary={group.name}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: hasSelectedChild ? 600 : 500,
                      fontSize: '0.72rem',
                      whiteSpace: 'nowrap'
                    }}
                  />
                  {isOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                </>
              )}
            </StyledListItemButton>
          );

          return (
            <React.Fragment key={group.id}>
              <StyledListItem disablePadding>
                {isSidebarOpen ? groupButton : (
                  <Tooltip title={group.name} placement="right">{groupButton}</Tooltip>
                )}
              </StyledListItem>
              <Collapse in={isSidebarOpen && isOpen} timeout="auto" unmountOnExit>
                <List disablePadding sx={{
  ml: 2.25,
  mr: 1,
  my: 0.35,
  pl: 0.75,
  borderLeft: '1px solid',
  borderColor: 'divider',
  '& .MuiListItemButton-root': { minHeight: 38, width: '100%', mx: 0, borderRadius: '0 7px 7px 0' }
}}> 
                  {children.map(item => (
                    <StyledListItem key={item.id} disablePadding>
                      {renderMenuItem(item, true)}
                    </StyledListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          );
        })}

        {remainingItems.map(item => (
          <StyledListItem key={item.id} disablePadding>
            {renderMenuItem(item, isSidebarOpen)}
          </StyledListItem>
        ))}
      </List>
    );
  };

  
  const getWebsiteCategory = (item) => {
    const id = String(item?.id || '').toLowerCase();
    const name = String(item?.name || '').toLowerCase();
    
    // Main
    if (id === 'dashboard' || name === 'dashboard') return 'main';
    if (id === 'alerts' || name === 'alerts' || name === 'notifications' || id === 'notifications') return 'main';
    
    // Work
    if (id === 'attendance' || name === 'attendance') return 'work';
    if (id === 'my-leaves' || name === 'my leaves') return 'work';
    if (id === 'my-assets' || name === 'my assets') return 'work';
    if (id === 'create-task' || id === 'task-management' || name === 'create task' || name === 'task management') return 'work';
    
    // Communication
    if (id === 'chat' || name === 'chat') return 'communication';
    if (id === 'employee-meeting' || name === 'employee meeting' || name === 'meeting') return 'communication';
    if (id === 'client-meeting' || name === 'client meeting') return 'communication';
    
    // Admin
    if (id === 'create-user' || name === 'create user') return 'admin';
    if (id === 'register-request' || name === 'register request') return 'admin';
    if (id === 'employee-details' || id === 'emp-details' || name === 'employee details') return 'admin';
    if (id === 'admin-projects' || id === 'adminproject' || name === 'admin projects') return 'admin';
    if (id === 'manage-groups' || name === 'manage groups') return 'admin';
    
    // Settings
    if (id === 'profile' || name === 'profile' || name === 'my profile') return 'settings';
    if (id === 'change-password' || name === 'change password') return 'settings';
    if (id === 'logout' || name === 'logout') return 'settings';
    
    // Keep original database category if not matching the targeted 15 items!
    return item.category || 'main';
  };

  const groupedItems = useMemo(() => {
    const groups = {};
    const categoryOrder = ['main', 'work', 'communication', 'admin', 'settings', 'administration', 'tasks', 'projects', 'meetings', 'clients'];
    // Keep CRM sections below ordinary and custom sidebar sections.
    const crmSectionOrder = category => category === 'crm' ? 1 : category === 'admin-telecaller' ? 2 : 0;
    const customRanges = sidebarConfig && Array.isArray(sidebarConfig.ranges) ? sidebarConfig.ranges : [];
    const hasCustomRanges = customRanges.length > 0;
    
    menuItems.forEach(item => {
      let category = String(item.path || '').toLowerCase().startsWith('/ciisuser/telecaller/') ? 'admin-telecaller' : String(item.path || '').toLowerCase().startsWith('/ciisuser/crm/') ? 'crm' : '';
      if (!category && hasCustomRanges && Number.isFinite(Number(item.order))) {
        const orderVal = Number(item.order);
        const matchedRange = customRanges.find(r => orderVal >= r.min && orderVal <= r.max);
        if (matchedRange) {
          category = matchedRange.heading;
        }
      }
      
      if (!category) {
        category = getWebsiteCategory(item);
      }

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({
        ...item,
        category
      });
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

      const payrollOrderedItems = placeReleasePayrollAfterProcess(items);
      items.splice(0, items.length, ...payrollOrderedItems);
    });
    
    if (hasCustomRanges) {
      const rangeHeadingMap = new Map(customRanges.map(r => [r.heading, r.min]));
      return Object.fromEntries(
        Object.entries(groups).sort(([categoryA], [categoryB]) => {
          const sectionDifference = crmSectionOrder(categoryA) - crmSectionOrder(categoryB);
          if (sectionDifference) return sectionDifference;
          const minA = rangeHeadingMap.has(categoryA) ? rangeHeadingMap.get(categoryA) : 9999;
          const minB = rangeHeadingMap.has(categoryB) ? rangeHeadingMap.get(categoryB) : 9999;
          return minA - minB;
        })
      );
    }

    return Object.fromEntries(
      Object.entries(groups).sort(([categoryA], [categoryB]) => {
        const sectionDifference = crmSectionOrder(categoryA) - crmSectionOrder(categoryB);
        if (sectionDifference) return sectionDifference;
        const indexA = categoryOrder.indexOf(categoryA);
        const indexB = categoryOrder.indexOf(categoryB);
        const orderA = indexA === -1 ? 99 : indexA;
        const orderB = indexB === -1 ? 99 : indexB;
        return orderA - orderB;
      })
    );
  }, [menuItems, sidebarConfig]);

  
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
              {(companyData?.companyName || userData?.companyName || userData?.companyDetails?.companyName) && (
                <Typography 
                  variant="caption" 
                  display="block" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 500,
                    mt: 0.5,
                    opacity: 0.8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    whiteSpace: 'normal',
                  }}
                >
                  {companyData?.companyName || userData?.companyName || userData?.companyDetails?.companyName}
                </Typography>
              )}
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
              <StyledListItem key={item.id} disablePadding>
                {renderMenuItem(item, isSidebarOpen)}
              </StyledListItem>
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
      'main': 'Main',
      'work': 'Work',
      'communication': 'Communication',
      'admin': 'Admin',
      'settings': 'Settings',
      'administration': 'Administration',
      'tasks': 'Tasks',
      'projects': 'Projects',
      'meetings': 'Meetings',
      'clients': 'Clients'
      ,'crm': 'Admin CRM'
      ,'admin-telecaller': 'Admin Telecaller'
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
            {getIconComponent(
              category === 'main' ? 'Dashboard' : 
              category === 'work' ? 'Task' :
              category === 'communication' ? 'Notifications' :
              category === 'admin' ? 'Person' :
              category === 'settings' ? 'Settings' : 
              category === 'administration' ? 'Person' :
              category === 'tasks' ? 'Task' :
              category === 'projects' ? 'Groups' :
              category === 'meetings' ? 'VideoCall' :
              category === 'clients' ? 'Person' : 'Dashboard'
            )}
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
        <Box sx={{ px: 2, py: 2.25, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1.35 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ fontSize: '0.875rem', lineHeight: 1.4, color: 'text.primary' }}>
                {userData?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.35, textTransform: 'capitalize' }}>
                {userSubtitle}
              </Typography>
              {(companyData?.companyName || userData?.companyName || userData?.companyDetails?.companyName) && (
                <Typography 
                  variant="caption" 
                  display="block" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 500,
                    mt: 0.5,
                    opacity: 0.8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    whiteSpace: 'normal',
                  }}
                >
                  {companyData?.companyName || userData?.companyName || userData?.companyDetails?.companyName}
                </Typography>
              )}
            </Box>
            <Tooltip title="My Profile">
              <Button
                onClick={() => handleNavigate('/ciisUser/profile')}
                sx={{
                  flex: '0 0 auto',
                  width: '100%',
                  minWidth: 0,
                  height: 50,
                  px: 1.5,
                  borderRadius: 2.25,
                  textTransform: 'none',
                  fontWeight: 700,
                  color: 'primary.main',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%)',
                  border: '1px solid #cfe0ff',
                  boxShadow: '0 5px 14px rgba(37, 99, 235, 0.14)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f8fbff 0%, #eaf2ff 100%)',
                    boxShadow: '0 7px 18px rgba(37, 99, 235, 0.2)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.45, fontSize: '0.78rem', lineHeight: 1 }}>
                    <PersonIcon sx={{ fontSize: 20 }} />
                    <span>Profile</span>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.55 }} />
                  <Box sx={{ position: 'relative', width: 34, height: 34, flex: '0 0 34px', display: 'grid', placeItems: 'center' }}>
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={34}
                      thickness={4}
                      sx={{ position: 'absolute', color: '#dbe7f8' }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={profileCompletion}
                      size={34}
                      thickness={4}
                      sx={{ position: 'absolute', color: '#2878db', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
                    />
                    <Typography component="span" sx={{ color: '#172033', fontSize: '0.62rem', fontWeight: 700 }}>
                      {profileCompletion}%
                    </Typography>
                  </Box>
                </Box>
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
            
            
            {category === 'crm' ? renderAdminCrmMenu(groupedItems[category]) : category === 'admin-telecaller' ? renderTelecallerMenu(groupedItems[category]) : (
              <List sx={{ py: 0 }}>
                {groupedItems[category].map((item) => (
                  <StyledListItem key={item.id} disablePadding>
                    {renderMenuItem(item, isSidebarOpen)}
                  </StyledListItem>
                ))}
              </List>
            )}
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
