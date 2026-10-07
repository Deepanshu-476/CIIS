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
  AccountBalanceWalletOutlined as SalaryComponentIcon,
  LayersOutlined as SalaryStructureIcon,
  ManageAccountsOutlined as EmployeeSalaryIcon,
  AssignmentIndOutlined as AssignSalaryIcon,
  CreditScoreOutlined as PayrollProcessIcon,
  ReceiptLongOutlined as PayslipIcon,
  AnalyticsOutlined as PayrollReportsIcon,
  AccountBalanceOutlined as PayrollHeaderIcon,
  ContactPage as ContactPageIcon,
  ContactPhone as ContactPhoneIcon,
  Leaderboard as LeaderboardIcon,
  PersonAdd as PersonAddIcon,
  AltRoute as AltRouteIcon,
  Category as CategoryIcon,
  ImportExport as ImportExportIcon,
  EventRepeat as EventRepeatIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Assignment as AssignmentIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  WorkHistory as WorkHistoryIcon,
  Balance as BalanceIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  PhoneCallback as PhoneCallbackIcon,
  DateRange as DateRangeIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  FilterList as FilterListIcon,
  Timeline as TimelineIcon,
  DesignServices as DesignServicesIcon,
  Storefront as StorefrontIcon,
  Description as DescriptionIcon,
  ReceiptLong as ReceiptLongIcon,
  Subscriptions as SubscriptionsIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import Swal from "sweetalert2";
import { handleAppLogout } from '../utils/logoutModal';
import axiosInstance from '../utils/axiosConfig';
import { isCrmPage, requiresPageAccess, hasPageAccess, getCachedPagePermissionCatalog, loadPagePermissionCatalog, loadPagePermission } from '../utils/pageAccess';
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

const drawerWidthOpen = 236;
const drawerWidthClosed = 70;
const BADGE_REFRESH_INTERVAL = 120000;
const BADGE_CACHE_TTL = 120000;
const getBadgeCacheKey = userId => `ciis-sidebar-badges-cache:${userId || 'anonymous'}`;
const PAGE_ACCESS_ROLES = new Set(['owner', 'company_owner', 'companyowner', 'admin', 'super_admin', 'superadmin']);
const normalizePermissionRole = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[\s-]+/g, '_');

const readCachedSidebarConfig = user => {
  try {
    const cached = JSON.parse(localStorage.getItem('sidebarConfig') || 'null');
    if (!cached || typeof cached !== 'object') return null;
    const userId = String(user?._id || user?.id || '').trim();
    const storedCompany = JSON.parse(localStorage.getItem('companyDetails') || 'null');
    const company = user?.company || user?.companyId || user?.companyDetails || storedCompany;
    const companyId = String(
      (typeof company === 'object' ? company?._id || company?.id : company) || ''
    ).trim();
    const cachedUserId = String(cached?._cacheContext?.userId || '').trim();
    const cachedCompanyId = String(cached?._cacheContext?.companyId || '').trim();
    return userId && cachedUserId === userId && cachedCompanyId === companyId ? cached : null;
  } catch {
    return null;
  }
};

const permissionPagesFromCatalog = catalog => {
  if (!catalog || typeof catalog !== 'object') return null;
  const pages = Array.isArray(catalog.pages) ? catalog.pages : [];
  const accessPages = Array.isArray(catalog.accessPages) ? catalog.accessPages : [];
  const pagesByPath = new Map(pages.map(page => [
    String(page?.path || '').toLowerCase().replace(/\/+$/, ''),
    page
  ]));
  [...CRM_PAGES.map(page => ({ ...page, path: `/ciisUser/${page.path}` })), ...TELECALLER_PAGES]
    .forEach(page => {
      const key = String(page.path || '').toLowerCase().replace(/\/+$/, '');
      if (!pagesByPath.has(key)) pagesByPath.set(key, { ...page, pageKey: page.id });
    });
  const detailsByPath = new Map(accessPages.map(page => [
    String(page?.path || '').toLowerCase().replace(/\/+$/, ''),
    page
  ]));
  return [...pagesByPath.values()].map(page => (
    detailsByPath.get(String(page?.path || '').toLowerCase().replace(/\/+$/, '')) || page
  ));
};

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
    const key = getBadgeCacheKey(userId);
    const cached = JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || 'null');
    if (!cached || !cached.counts || Date.now() - cached.savedAt >= BADGE_CACHE_TTL) return null;
    return cached.counts;
  } catch {
    return null;
  }
};

const writeBadgeCache = (userId, counts) => {
  try {
    const key = getBadgeCacheKey(userId);
    const payload = JSON.stringify({ counts, savedAt: Date.now() });
    sessionStorage.setItem(key, payload);
    localStorage.setItem(key, payload);
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

const getPendingTaskCountFromStats = response => {
  const payload = response?.data;
  const stats = payload?.stats || payload?.data?.stats || payload?.statusCounts || payload?.data?.statusCounts;
  const pending = stats?.pending;

  if (typeof pending === 'number') return pending;
  if (typeof pending?.count === 'number') return pending.count;

  return null;
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

const AnimatedBadgeCount = ({ value }) => {
  const numericValue = Math.max(0, Number(value) || 0);
  const [displayValue, setDisplayValue] = useState(numericValue);
  const previousValueRef = useRef(numericValue);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const startedAt = performance.now();
    const duration = 450;
    let frameId;

    const animate = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (numericValue - startValue) * eased));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    previousValueRef.current = numericValue;
    return () => cancelAnimationFrame(frameId);
  }, [numericValue]);

  return <>{displayValue > 99 ? '99+' : displayValue}</>;
};

const getRecordId = value => {
  if (!value) return '';
  if (typeof value === 'object') {
    return value._id || value.id || value.value || '';
  }
  return value;
};

const isMongoId = value => /^[0-9a-fA-F]{24}$/.test(String(value || '').trim());

const isPayrollPath = (path = '') => {
  const normalized = String(path || '').toLowerCase();
  return (
    normalized.includes('/salary-component') ||
    normalized.includes('/salary-structure') ||
    normalized.includes('/salary-assignment') ||
    normalized.includes('/assign-salary') ||
    normalized.includes('/payroll-process') ||
    normalized.includes('/payslip') ||
    normalized.includes('/payroll-reports')
  );
};

const isPayrollItem = (item) => {
  const id = String(item?.id || '').toLowerCase();
  const name = String(item?.name || '').toLowerCase();
  const path = String(item?.path || '').toLowerCase();
  const cat = String(item?.category || '').toLowerCase();
  return (
    cat === 'payroll' ||
    isPayrollPath(path) ||
    id === 'salary-component' ||
    id === 'salary-structure' ||
    id === 'salary-assignment' ||
    id === 'assign-salary' ||
    id === 'payroll-process' ||
    id === 'payslip' ||
    id === 'payroll-reports' ||
    id.includes('salary') ||
    id.includes('payroll') ||
    id === 'payslip' ||
    name.includes('salary') ||
    name.includes('payroll') ||
    name.includes('payslip')
  );
};

const isCrmPath = (path = '') => {
  const normalized = String(path || '').toLowerCase();
  return normalized.includes('/crm');
};

const isTelecallerPath = (path = '') => {
  const normalized = String(path || '').toLowerCase();
  return normalized.includes('/telecaller');
};

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
  borderRight: '1px solid rgba(226, 232, 240, 0.8)',
  height: 'calc(100vh - 64px)',
  position: 'fixed',
  top: 64,
  left: 0,
  zIndex: theme.zIndex.drawer,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const MobileSidebarContainer = styled(Box)(({ theme }) => ({
  width: drawerWidthOpen,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  backgroundColor: theme.palette.background.paper,
  borderRight: '1px solid rgba(226, 232, 240, 0.8)',
  height: '100%',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const StyledListItem = styled(ListItem)({
  padding: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
});

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'isCollapsed'
})(({ theme, selected, isCollapsed }) => ({
  minHeight: 34,
  height: 34,
  width: isCollapsed ? 36 : 'calc(100% - 10px)',
  margin: isCollapsed ? '2px auto' : '1px 5px',
  padding: isCollapsed ? 0 : '3px 8px',
  justifyContent: isCollapsed ? 'center' : 'flex-start',
  alignItems: 'center',
  color: selected ? '#1d4ed8' : '#475569',
  backgroundColor: selected
    ? (isCollapsed ? 'rgba(37, 99, 235, 0.10)' : 'rgba(37, 99, 235, 0.08)')
    : 'transparent',
  border: '1px solid transparent',
  borderLeft: isCollapsed
    ? (selected ? '1px solid rgba(37, 99, 235, 0.22)' : '1px solid transparent')
    : (selected ? '3px solid #2563eb' : '3px solid transparent'),
  borderRadius: isCollapsed ? '8px' : '0 7px 7px 0',
  boxShadow: selected && isCollapsed ? '0 2px 8px rgba(37, 99, 235, 0.12)' : 'none',
  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
  boxSizing: 'border-box',
  overflow: 'visible',
  '&:hover': {
    backgroundColor: selected
      ? (isCollapsed ? 'rgba(37, 99, 235, 0.16)' : 'rgba(37, 99, 235, 0.12)')
      : 'rgba(241, 245, 249, 0.9)',
    color: '#1d4ed8',
    transform: 'none',
    boxShadow: isCollapsed ? '0 2px 6px rgba(15, 23, 42, 0.06)' : 'none',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 28,
    width: 28,
    height: 24,
    marginRight: isCollapsed ? 0 : theme.spacing(0.9),
    margin: isCollapsed ? '0 auto' : undefined,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: selected ? '#2563eb' : '#64748b',
    transition: 'color 0.18s ease',
  },
  '&:hover .MuiListItemIcon-root': {
    color: '#2563eb',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.76rem',
    lineHeight: 1.25,
    fontWeight: selected ? 600 : 500,
    letterSpacing: '-0.01em',
    whiteSpace: 'normal',
    wordBreak: 'normal',
    overflow: 'visible',
    textOverflow: 'clip',
  },
}));

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: 28,
  width: 28,
  height: 24,
  marginRight: 0,
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'inherit',
  flexShrink: 0,
  '& svg': {
    width: 22,
    height: 22,
    fontSize: '22px !important',
    flexShrink: 0,
  },
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
  borderBottom: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const CollapsedHeading = styled(Box)(({ theme }) => ({
  height: 36,
  width: 44,
  margin: '6px auto 2px',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  borderBottom: 'none',
  boxSizing: 'border-box',
  '& > svg': {
    fontSize: '1.2rem',
    width: 22,
    height: 22,
  },
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
  'SalaryComponent': SalaryComponentIcon,
  'salarycomponent': SalaryComponentIcon,
  'SalaryStructure': SalaryStructureIcon,
  'salarystructure': SalaryStructureIcon,
  'EmployeeSalary': EmployeeSalaryIcon,
  'employeesalary': EmployeeSalaryIcon,
  'AssignSalary': AssignSalaryIcon,
  'assignsalary': AssignSalaryIcon,
  'PayrollProcess': PayrollProcessIcon,
  'payrollprocess': PayrollProcessIcon,
  'Payslip': PayslipIcon,
  'payslip': PayslipIcon,
  'PayrollReports': PayrollReportsIcon,
  'payrollreports': PayrollReportsIcon,
  'PayrollHeader': PayrollHeaderIcon,
  'payrollheader': PayrollHeaderIcon,
  'AccountBalanceOutlined': PayrollHeaderIcon,
  'ContactPage': ContactPageIcon,
  'contactpage': ContactPageIcon,
  'ContactPhone': ContactPhoneIcon,
  'contactphone': ContactPhoneIcon,
  'Leaderboard': LeaderboardIcon,
  'leaderboard': LeaderboardIcon,
  'PersonAdd': PersonAddIcon,
  'personadd': PersonAddIcon,
  'AltRoute': AltRouteIcon,
  'altroute': AltRouteIcon,
  'Category': CategoryIcon,
  'category': CategoryIcon,
  'ImportExport': ImportExportIcon,
  'importexport': ImportExportIcon,
  'EventRepeat': EventRepeatIcon,
  'eventrepeat': EventRepeatIcon,
  'AssignmentTurnedIn': AssignmentTurnedInIcon,
  'assignmentturnedin': AssignmentTurnedInIcon,
  'Assignment': AssignmentIcon,
  'assignment': AssignmentIcon,
  'PlaylistAddCheck': PlaylistAddCheckIcon,
  'playlistaddcheck': PlaylistAddCheckIcon,
  'WorkHistory': WorkHistoryIcon,
  'workhistory': WorkHistoryIcon,
  'Balance': BalanceIcon,
  'balance': BalanceIcon,
  'Assessment': AssessmentIcon,
  'assessment': AssessmentIcon,
  'Analytics': AnalyticsIcon,
  'analytics': AnalyticsIcon,
  'TrendingUp': TrendingUpIcon,
  'trendingup': TrendingUpIcon,
  'PhoneCallback': PhoneCallbackIcon,
  'phonecallback': PhoneCallbackIcon,
  'DateRange': DateRangeIcon,
  'daterange': DateRangeIcon,
  'WorkspacePremium': WorkspacePremiumIcon,
  'workspacepremium': WorkspacePremiumIcon,
  'FilterList': FilterListIcon,
  'filterlist': FilterListIcon,
  'Timeline': TimelineIcon,
  'timeline': TimelineIcon,
  'DesignServices': DesignServicesIcon,
  'designservices': DesignServicesIcon,
  'MyServices': DesignServicesIcon,
  'myservices': DesignServicesIcon,
  'Storefront': StorefrontIcon,
  'storefront': StorefrontIcon,
  'Marketplace': StorefrontIcon,
  'marketplace': StorefrontIcon,
  'Description': DescriptionIcon,
  'description': DescriptionIcon,
  'Documents': DescriptionIcon,
  'documents': DescriptionIcon,
  'ReceiptLong': ReceiptLongIcon,
  'receiptlong': ReceiptLongIcon,
  'Subscriptions': SubscriptionsIcon,
  'subscriptions': SubscriptionsIcon,
};

const getMenuItemIcon = (item) => {
  const id = String(item?.id || '').toLowerCase();
  const path = String(item?.path || '').toLowerCase();
  const name = String(item?.name || '').toLowerCase();

  const crmIconMap = {
    'admin-crm-dashboard': 'Dashboard',
    'admin-crm-lead-overview': 'Leaderboard',
    'admin-crm-all-leads': 'Groups',
    'admin-crm-add-lead': 'PersonAdd',
    'admin-crm-lead-sources': 'AltRoute',
    'admin-crm-lead-types': 'Category',
    'admin-crm-import-export-leads': 'ImportExport',
    'admin-crm-call-overview': 'CallOverview',
    'admin-crm-assigned-calls': 'AssignedCalls',
    'admin-crm-todays-calls': 'TodaysCalls',
    'admin-crm-pending-calls': 'PendingCalls',
    'admin-crm-scheduled-calls': 'ScheduledCalls',
    'admin-crm-completed-calls': 'CompletedCalls',
    'admin-crm-converted-calls': 'ConvertedCalls',
    'admin-crm-transferred-calls': 'TransferredCalls',
    'admin-crm-call-history': 'CallHistory',
    'admin-crm-follow-ups': 'EventRepeat',
    'admin-crm-assignments': 'Assignment',
    'admin-crm-assignment-bulk': 'PlaylistAddCheck',
    'admin-crm-assignment-history': 'WorkHistory',
    'admin-crm-workload': 'Balance',
    'admin-crm-reports-overview': 'Analytics',
    'admin-crm-reports-leads': 'TrendingUp',
    'admin-crm-reports-calls': 'PhoneCallback',
    'admin-crm-reports-follow-ups': 'DateRange',
    'admin-crm-reports-team-performance': 'WorkspacePremium',
    'admin-crm-reports-conversion-funnel': 'FilterList',
    'admin-crm-reports-user-activity': 'Timeline',
  };

  if (crmIconMap[id]) {
    return crmIconMap[id];
  }
  if (path.includes('/crm/admin/dashboard')) return 'Dashboard';
  if (path.includes('/crm/admin/lead-overview')) return 'Leaderboard';
  if (path.includes('/crm/admin/all-leads')) return 'Groups';
  if (path.includes('/crm/admin/add-lead')) return 'PersonAdd';
  if (path.includes('/crm/admin/lead-sources')) return 'AltRoute';
  if (path.includes('/crm/admin/lead-types')) return 'Category';
  if (path.includes('/crm/admin/import-export-leads')) return 'ImportExport';
  if (path.includes('/crm/admin/call-overview')) return 'CallOverview';
  if (path.includes('/crm/admin/assigned-calls')) return 'AssignedCalls';
  if (path.includes('/crm/admin/todays-calls')) return 'TodaysCalls';
  if (path.includes('/crm/admin/pending-calls')) return 'PendingCalls';
  if (path.includes('/crm/admin/scheduled-calls')) return 'ScheduledCalls';
  if (path.includes('/crm/admin/completed-calls')) return 'CompletedCalls';
  if (path.includes('/crm/admin/converted-calls')) return 'ConvertedCalls';
  if (path.includes('/crm/admin/transferred-calls')) return 'TransferredCalls';
  if (path.includes('/crm/admin/call-history')) return 'CallHistory';
  if (path.includes('/crm/admin/follow-ups')) return 'EventRepeat';
  if (path.includes('/crm/admin/assignments')) return 'Assignment';
  if (path.includes('/crm/admin/assignment-bulk')) return 'PlaylistAddCheck';
  if (path.includes('/crm/admin/assignment-history')) return 'WorkHistory';
  if (path.includes('/crm/admin/workload')) return 'Balance';
  if (path.includes('/crm/reports/overview')) return 'Analytics';
  if (path.includes('/crm/reports/leads')) return 'TrendingUp';
  if (path.includes('/crm/reports/calls')) return 'PhoneCallback';
  if (path.includes('/crm/reports/follow-ups')) return 'DateRange';
  if (path.includes('/crm/reports/team-performance')) return 'WorkspacePremium';
  if (path.includes('/crm/reports/conversion-funnel')) return 'FilterList';
  if (path.includes('/crm/reports/user-activity')) return 'Timeline';

  if (id === 'salary-component' || path.includes('/salary-component') || name === 'salary component') {
    return 'SalaryComponent';
  }
  if (id === 'salary-structure' || path.includes('/salary-structure') || name === 'salary structure') {
    return 'SalaryStructure';
  }
  if (id === 'salary-assignment' || path.includes('/salary-assignment') || name === 'employee salary') {
    return 'EmployeeSalary';
  }
  if (id === 'assign-salary' || path.includes('/assign-salary') || name === 'assign salary') {
    return 'AssignSalary';
  }
  if (id === 'payroll-process' || path.includes('/payroll-process') || name === 'payroll process') {
    return 'PayrollProcess';
  }
  if (id === 'payslip' || path.includes('/payslip') || name === 'payslip') {
    return 'Payslip';
  }
  if (id === 'payroll-reports' || path.includes('/payroll-reports') || name === 'payroll reports') {
    return 'PayrollReports';
  }

  // Client Portal pages
  if (id === 'client-dashboard' || path === '/client/dashboard' || path === '/client' || name === 'dashboard') {
    return 'Dashboard';
  }
  if (id === 'client-my-services' || path.includes('/client/my-services') || name === 'my services') {
    return 'DesignServices';
  }
  if (id === 'client-tasks-updates' || path.includes('/client/tasks-updates') || name.includes('tasks & updates')) {
    return 'Task';
  }
  if (id === 'client-marketplace' || path.includes('/client/marketplace') || name.includes('explore services') || name.includes('marketplace')) {
    return 'Storefront';
  }
  if (id === 'client-support-tickets' || path.includes('/client/support-tickets')) {
    return (name === 'meetings' || item?.name === 'Meetings') ? 'VideoCall' : 'SupportAgent';
  }
  if (id === 'client-documents' || path.includes('/client/documents') || name === 'documents') {
    return 'Description';
  }
  if (id === 'client-payments' || path.includes('/client/payments') || path.includes('/client/payment') || name === 'payments') {
    return 'CreditCard';
  }
  if (id === 'client-plans' || path.includes('/client-plans')) {
    return 'Subscriptions';
  }
  if (id === 'active-clients' || path.includes('/active-clients')) {
    return 'Groups';
  }

  return item?.icon || 'Dashboard';
};

// Admin CRM sidebar scaffold. Add new page ids to a group's itemIds when its
// route is added to the normal sidebar configuration.
const ADMIN_CRM_MENU_GROUPS = [
  { id: 'lead-management', name: 'Lead Management', icon: 'ContactPage', itemIds: ['admin-crm-lead-overview', 'admin-crm-all-leads', 'admin-crm-add-lead', 'admin-crm-lead-sources', 'admin-crm-lead-types', 'admin-crm-import-export-leads'] },
  { id: 'call-management', name: 'Call Management', icon: 'Call', itemIds: ['admin-crm-call-overview', 'admin-crm-assigned-calls', 'admin-crm-todays-calls', 'admin-crm-pending-calls', 'admin-crm-scheduled-calls', 'admin-crm-completed-calls', 'admin-crm-converted-calls', 'admin-crm-transferred-calls', 'admin-crm-call-history'] },
  { id: 'follow-up-center', name: 'Follow-Up Center', icon: 'EventRepeat', itemIds: ['admin-crm-follow-ups'], direct: true },
  { id: 'assignments', name: 'Assignments', icon: 'AssignmentTurnedIn', itemIds: ['admin-crm-assignments', 'admin-crm-assignment-bulk', 'admin-crm-assignment-history', 'admin-crm-workload'] },
  { id: 'reports', name: 'Reports', icon: 'Assessment', itemIds: ['admin-crm-reports-overview', 'admin-crm-reports-leads', 'admin-crm-reports-calls', 'admin-crm-reports-follow-ups', 'admin-crm-reports-team-performance', 'admin-crm-reports-conversion-funnel', 'admin-crm-reports-user-activity'] },
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
    } else if (iconName.toLowerCase().includes('document') || iconName.toLowerCase().includes('file')) {
      IconComponent = DescriptionIcon;
    } else if (iconName.toLowerCase().includes('store') || iconName.toLowerCase().includes('market')) {
      IconComponent = StorefrontIcon;
    } else if (iconName.toLowerCase().includes('design') || iconName.toLowerCase().includes('myservice')) {
      IconComponent = DesignServicesIcon;
    } else if (iconName.toLowerCase().includes('subscription')) {
      IconComponent = SubscriptionsIcon;
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

const crmSidebarItems = CRM_PAGES.map((page, index) => ({
  id: page.id,
  name: page.name,
  icon: page.icon || 'Dashboard',
  path: `/ciisUser/${page.path}`,
  category: page.category || 'admin-crm',
  order: 31 + index / 100
}));

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
    icon: 'DesignServices',
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
    icon: 'Storefront',
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
    icon: 'Description',
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
    icon: 'SalaryComponent',
    path: '/ciisUser/salary-component',
    category: 'payroll',
    order: 24
  },
  {
    id: 'salary-structure',
    name: 'Salary Structure',
    icon: 'SalaryStructure',
    path: '/ciisUser/salary-structure',
    category: 'payroll',
    order: 24.1
  },
  {
    id: 'salary-assignment',
    name: 'Employee Salary',
    icon: 'EmployeeSalary',
    path: '/ciisUser/salary-assignment',
    category: 'payroll',
    order: 24.2
  },
  {
    id: 'assign-salary',
    name: 'Assign Salary',
    icon: 'AssignSalary',
    path: '/ciisUser/assign-salary',
    category: 'payroll',
    order: 24.25
  },
  {
    id: 'payroll-process',
    name: 'Payroll Process',
    icon: 'PayrollProcess',
    path: '/ciisUser/payroll-process',
    category: 'payroll',
    order: 24.3
  },
  {
    id: 'payslip',
    name: 'Payslip',
    icon: 'Payslip',
    path: '/ciisUser/payslip',
    category: 'payroll',
    order: 24.4
  },
  {
    id: 'payroll-reports',
    name: 'Payroll Reports',
    icon: 'PayrollReports',
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
  },
  ...crmSidebarItems
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

const normalizeSidebarRouteValue = value => String(value || '')
  .trim()
  .toLowerCase()
  .split(/[?#]/)[0]
  .replace(/\/+$/, '');

const canonicalSidebarItems = [
  {
    id: 'client-management',
    name: 'Client Management',
    icon: 'Person',
    path: '/ciisUser/emp-client',
    category: 'clients'
  },
  {
    id: 'active-clients',
    name: 'Active Clients',
    icon: 'Groups',
    path: '/ciisUser/active-clients',
    category: 'clients'
  },
  {
    id: 'client-plans',
    name: 'Client Plans',
    icon: 'Subscriptions',
    path: '/ciisUser/client-plans',
    category: 'clients'
  }
];

const canonicalSidebarItemByKey = canonicalSidebarItems.reduce((map, item) => {
  const keys = [
    item.id,
    item.name,
    item.path,
    item.path.replace(/^\/ciisUser\//i, ''),
    item.path.replace(/^\/+/, ''),
    getPathFromName(item.name)
  ];
  keys.forEach(key => {
    const normalized = normalizeSidebarRouteValue(key).replace(/^\/+/, '');
    if (normalized) map.set(normalized, item);
  });
  return map;
}, new Map());

const getCanonicalSidebarItem = item => {
  const keys = [item?.id, item?.path, item?.name]
    .map(key => normalizeSidebarRouteValue(key).replace(/^\/+/, ''))
    .filter(Boolean);
  return keys.map(key => canonicalSidebarItemByKey.get(key)).find(Boolean) || null;
};

const getMenuRouteKey = item => String(item?.path || '').split('/').filter(Boolean).pop();
const managementClientPageIds = new Set(['emp-client', 'client-management', 'client-plans', 'active-clients']);

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
    icon: 'SalaryComponent',
    path: '/ciisUser/salary-component',
    category: 'payroll',
    order: 24.0
  },
  {
    id: 'salary-structure',
    name: 'Salary Structure',
    icon: 'SalaryStructure',
    path: '/ciisUser/salary-structure',
    category: 'payroll',
    order: 24.1
  },
  {
    id: 'salary-assignment',
    name: 'Employee Salary',
    icon: 'EmployeeSalary',
    path: '/ciisUser/salary-assignment',
    category: 'payroll',
    order: 24.2
  },
  {
    id: 'assign-salary',
    name: 'Assign Salary',
    icon: 'AssignSalary',
    path: '/ciisUser/assign-salary',
    category: 'payroll',
    order: 24.25
  },
  {
    id: 'payroll-process',
    name: 'Payroll Process',
    icon: 'PayrollProcess',
    path: '/ciisUser/payroll-process',
    category: 'payroll',
    order: 24.3
  },
  {
    id: 'payslip',
    name: 'Payslip',
    icon: 'Payslip',
    path: '/ciisUser/payslip',
    category: 'payroll',
    order: 24.4
  },
  {
    id: 'payroll-reports',
    name: 'Payroll Reports',
    icon: 'PayrollReports',
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
    icon: 'SalaryComponent',
    path: '/ciisUser/salary-component',
    category: 'payroll',
    order: 24.0
  },
  {
    id: 'salary-structure',
    name: 'Salary Structure',
    icon: 'SalaryStructure',
    path: '/ciisUser/salary-structure',
    category: 'payroll',
    order: 24.1
  },
  {
    id: 'salary-assignment',
    name: 'Employee Salary',
    icon: 'EmployeeSalary',
    path: '/ciisUser/salary-assignment',
    category: 'payroll',
    order: 24.2
  },
  {
    id: 'assign-salary',
    name: 'Assign Salary',
    icon: 'AssignSalary',
    path: '/ciisUser/assign-salary',
    category: 'payroll',
    order: 24.25
  },
  {
    id: 'payroll-process',
    name: 'Payroll Process',
    icon: 'PayrollProcess',
    path: '/ciisUser/payroll-process',
    category: 'payroll',
    order: 24.3
  },
  {
    id: 'payslip',
    name: 'Payslip',
    icon: 'Payslip',
    path: '/ciisUser/payslip',
    category: 'payroll',
    order: 24.4
  },
  {
    id: 'payroll-reports',
    name: 'Payroll Reports',
    icon: 'PayrollReports',
    path: '/ciisUser/payroll-reports',
    category: 'payroll',
    order: 24.5
  },
  ...crmSidebarItems
];

const filterItemsByCompanyAccess = (items, companyData) => {
  const allowedPages = Array.isArray(companyData?.allowedPages) ? companyData.allowedPages : [];
  if (allowedPages.length === 0) return items.filter(item => item.category !== 'admin-telecaller');

  const normalizeKey = value => String(value || '').trim().replace(/^\/+/, '').toLowerCase();
  const allowedSet = new Set(allowedPages.map(item => normalizeKey(item)).filter(Boolean));
  const hasCrmAccess = allowedSet.has('crm') || allowedSet.has('admin-crm');

  return items.filter(item => {
    // Dashboard is the authenticated landing route, not an optional feature.
    // Keeping it prevents stale allowedPages data from hiding the Main link.
    if (['dashboard', 'user-dashboard'].includes(String(item?.id || '').toLowerCase()) ||
      String(item?.path || '').toLowerCase().replace(/\/+$/, '') === '/ciisuser/user-dashboard') {
      return true;
    }
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


const categoryLabels = {
  'main': 'Main',
  'work': 'Work',
  'payroll': 'Payroll',
  'communication': 'Communication',
  'admin': 'Admin',
  'settings': 'Settings',
  'administration': 'Administration',
  'tasks': 'Tasks',
  'projects': 'Projects',
  'meetings': 'Meetings',
  'clients': 'Clients',
  'crm': 'Admin CRM',
  'admin-telecaller': 'Admin Telecaller'
};

const Sidebar = ({
  isMobile = false,
  closeSidebar,
  isOpen: propIsOpen,
  drawerWidthOpen: propDrawerWidthOpen,
  drawerWidthClosed: propDrawerWidthClosed,
}) => {
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
  const [sidebarConfig, setSidebarConfig] = useState(() => readCachedSidebarConfig(userData));
  const [pagePermissions, setPagePermissions] = useState(() => (
    permissionPagesFromCatalog(getCachedPagePermissionCatalog())
  ));
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
  const [payrollDropdownOpen, setPayrollDropdownOpen] = useState(() => isPayrollPath(location.pathname));
  const [adminCrmDropdownOpen, setAdminCrmDropdownOpen] = useState(() => isCrmPath(location.pathname));
  const [adminTelecallerDropdownOpen, setAdminTelecallerDropdownOpen] = useState(() => isTelecallerPath(location.pathname));
  const [openSections, setOpenSections] = useState(() => new Set());
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


  const drawerWidthOpen = propDrawerWidthOpen || 236;
  const drawerWidthClosed = propDrawerWidthClosed || 70;
  const isSidebarOpen = isMobile || (propIsOpen !== undefined ? propIsOpen : isHovered);


  const isClientUser = useMemo(() => {
    return userData?.companyRole === "client" || location.pathname.startsWith('/client');
  }, [userData, location.pathname]);

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
      axiosInstance.get('/tasks/self/stats', { _skipErrorNotify: true }),
      axiosInstance.get('/tasks/assigned/to-me/stats', { _skipErrorNotify: true }),
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
      const selfPendingCount = selfTasksResult.status === 'fulfilled'
        ? getPendingTaskCountFromStats(selfTasksResult.value)
        : null;
      const assignedPendingCount = assignedTasksResult.status === 'fulfilled'
        ? getPendingTaskCountFromStats(assignedTasksResult.value)
        : null;

      if (selfPendingCount !== null || assignedPendingCount !== null) {
        nextCounts.tasks = Math.max(0, selfPendingCount || 0) + Math.max(0, assignedPendingCount || 0);
      } else {
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
        // Sidebar permissions/configuration are admin-managed data. Serving
        // a persisted GET cache here can hide newly added menu items until its
        // long cache TTL expires.
        noCache: true,
        cache: false,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        if (response.data.data) {
          const nextConfig = {
            ...response.data.data,
            _cacheContext: { userId, companyId: sidebarCompanyId }
          };
          setSidebarConfig(nextConfig);
          localStorage.setItem('sidebarConfig', JSON.stringify(nextConfig));
        } else {
          const fallbackConfig = {
            useFixedDefault: true,
            message: 'No custom config found, using fixed default items',
            _cacheContext: { userId, companyId: sidebarCompanyId }
          };
          setSidebarConfig(fallbackConfig);
          localStorage.setItem('sidebarConfig', JSON.stringify(fallbackConfig));
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch sidebar config');
      }
    } catch (error) {
      console.error('Error fetching sidebar config:', error);
      setError(`Failed to load sidebar configuration: ${error.message}`);
      setSidebarConfig(current => current || ({
        useFixedDefault: true,
        message: 'Using fixed default items due to error'
      }));
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
    // Do not render permissions remembered by an older session while the
    // authoritative catalog is being refreshed.
    setPagePermissions(null);
    loadPagePermissionCatalog({ force: true })
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
      // Keep the last verified permissions visible during a temporary API
      // failure. Route-level access checks still protect page navigation.
      .catch(() => undefined);

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

  const handleLogout = useCallback(() => {
    handleAppLogout({ navigate, redirectPath: "/" });
  }, [navigate]);

  const handleNavigate = useCallback((path, badgeKey) => {
    if (path === 'logout') {
      handleLogout();
      return;
    }

    markSidebarBadgeSeen(badgeKey);
    const currentPath = location.pathname.replace(/\/+$/, '');
    const nextPath = String(path || '').replace(/\/+$/, '');
    if (nextPath && currentPath !== nextPath) {
      navigate(path);
    }
    if (isMobile) {
      closeSidebar?.();
    } else {
      setIsHovered(false);
    }
  }, [closeSidebar, handleLogout, isMobile, location.pathname, navigate, markSidebarBadgeSeen]);

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
      const id = String(item?.id || "").trim().toLowerCase();
      const name = String(item?.name || "").trim().replace(/\s+/g, " ").toLowerCase();
      const path = String(item?.path || "").trim().toLowerCase().split(/[?#]/)[0].replace(/\/+$/, "");
      // Saved configs can use camelCase, spaces, or underscores for retired pages.
      const isReleasePayroll = [id, name, path.split('/').pop()].some(value => (
        value.replace(/[^a-z0-9]/g, '') === 'releasepayroll'
      ));
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
        && !isReleasePayroll
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
    const roleConfiguredPaths = new Set(
      (Array.isArray(sidebarConfig?.menuItems) ? sidebarConfig.menuItems : [])
        .map(item => String(getCanonicalSidebarItem(item)?.path || item?.path || '').toLowerCase().replace(/\/+$/, ''))
        .filter(Boolean)
    );
    const filterItemsByPageAccess = items => {
      items = items.filter(item => {
        if (item.category !== 'admin-telecaller') return true;
        if (!hasTelecallerCompanyAccess(item, companyData)) return false;
        const itemPath = String(item.path || '').toLowerCase().replace(/\/+$/, '');
        if (roleConfiguredPaths.has(itemPath)) return true;
        const permission = allPermissionPages.get(String(item.path).toLowerCase());
        return Boolean(permission && hasPageAccess(permission, userId, 'view'));
      });
      if (!pagePermissions) {
        // CRM stays hidden until its current, user-specific permissions have
        // been loaded. This prevents stale report links flashing or persisting.
        return items.filter(item => {
          const itemPath = String(item?.path || '').toLowerCase().replace(/\/+$/, '');
          return !isCrmPage(itemPath) && (roleConfiguredPaths.has(itemPath)
            || isPageAccessAdmin || !requiresPageAccess(itemPath));
        });
      }
      return items.filter(item => {
        const itemPath = String(item?.path || '').toLowerCase().replace(/\/+$/, '');
        // A saved role menu controls placement, not individual CRM access.
        if (isCrmPage(itemPath)) return hasPageAccess(allPermissionPages.get(itemPath), userId, 'view');
        if (roleConfiguredPaths.has(itemPath)) return true;
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
      return filterItemsByPageAccess(removeHiddenSidebarItems(filterItemsByCompanyAccess(allPagesItems, companyData)));
    }

    let items = [];
    const hasCustomSidebarConfig = sidebarConfig && sidebarConfig.menuItems && Array.isArray(sidebarConfig.menuItems);

    if (hasCustomSidebarConfig) {
      items = sidebarConfig.menuItems
        .map((item, index) => {
          const canonicalItem = getCanonicalSidebarItem(item);
          const crmPage = allPagesItems.find(page => ['crm', 'admin-telecaller'].includes(page.category) && (
            page.id === item.id ||
            page.path.toLowerCase() === String(item.path || '').toLowerCase().replace(/\/+$/, '')
          ));
          const processedItem = {
            id: canonicalItem?.id || crmPage?.id || item.id || item._id || Math.random().toString(36).substr(2, 9),
            // CRM entries always use the canonical page label. Older saved
            // configs sometimes persisted the page id in `name`, which made
            // raw ids flash in the sidebar after a refresh.
            name: getMenuDisplayName(canonicalItem?.name || crmPage?.name || item.name || 'Unnamed Item'),
            icon: canonicalItem?.icon || crmPage?.icon || item.icon || 'Dashboard',
            category: canonicalItem?.category || crmPage?.category || item.category || 'main',
            order: Number.isFinite(Number(item.order)) && Number(item.order) !== 99 ? Number(item.order) : (index + 1),
            path: canonicalItem?.path || crmPage?.path || item.path || getPathFromName(item.name),
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

    // The dashboard is the employee's landing page. The server configuration
    // normally supplies it, but an old browser/sidebar cache can omit it even
    // after the configuration has been updated. Reuse the existing Main item
    // only when it is absent; this never creates a second Main section or a
    // duplicate Dashboard entry.
    if (!isClientUser && !items.some(item => (
      String(item?.id || '').toLowerCase() === 'dashboard' ||
      String(item?.id || '').toLowerCase() === 'user-dashboard' ||
      String(item?.path || '').toLowerCase().replace(/\/+$/, '') === '/ciisuser/user-dashboard'
    ))) {
      items = [{ ...fixedDefaultItems[0], order: 1 }, ...items];
    }

    // A saved/custom sidebar is authoritative for what the role can see.
    // Fallback items are only used when no custom config exists.
    let accessFilteredItems = filterItemsByCompanyAccess(
      hasCustomSidebarConfig
        ? items
        : addCompanyAccessFallbackItems(items, companyData, isPageAccessAdmin),
      companyData
    );

    // Keep the register approval page available to the same privileged roles
    // that are allowed by the backend controller when no custom sidebar config
    // is assigned for the role.
    if (!hasCustomSidebarConfig) {
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

    const visibleItems = removeHiddenSidebarItems(sortedItems);
    return filterItemsByPageAccess(visibleItems);
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
            width: 22,
            height: 22,
            fontSize: 22,
            flexShrink: 0
          }
        }}
      >
        {getIconComponent(getMenuItemIcon(item))}
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
            {badgeValue === true ? null : <AnimatedBadgeCount value={numericBadge} />}
          </Box>
        )}
      </Box>
    );

    if (showFull) {
      return (
        <Tooltip title={item.name} placement="right" enterDelay={700}>
          <StyledListItemButton
            selected={selected}
            isCollapsed={false}
            onMouseEnter={() => preloadRouteByPath(item.path)}
            onFocus={() => preloadRouteByPath(item.path)}
            onClick={() => !item.disabled && handleNavigate(item.path, badgeKey)}
            disabled={item.disabled}
            sx={{
              minHeight: 34,
              height: 34,
              alignItems: 'center',
              mx: '4px',
              px: 1,
              py: '2px',
              opacity: item.disabled ? 0.5 : 1,
              cursor: item.disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <StyledListItemIcon sx={{ mr: 1.25, minWidth: 28, width: 28, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              {icon}
            </StyledListItemIcon>
            <ListItemText
              primary={item.name}
              sx={{ minWidth: 0, my: 0, overflow: 'visible' }}
              primaryTypographyProps={{
                variant: 'body2',
                sx: {
                  fontWeight: selected ? 600 : 500,
                  fontSize: '0.78rem',
                  lineHeight: 1.25,
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflow: 'visible',
                  textOverflow: 'clip'
                }
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
            isCollapsed={true}
            onMouseEnter={() => preloadRouteByPath(item.path)}
            onFocus={() => preloadRouteByPath(item.path)}
            onClick={() => !item.disabled && handleNavigate(item.path, badgeKey)}
            disabled={item.disabled}
            sx={{
              minHeight: 34,
              height: 34,
              width: 36,
              m: '2px auto',
              p: 0,
              opacity: item.disabled ? 0.5 : 1,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <StyledListItemIcon sx={{ m: '0 auto', minWidth: 28, width: 28, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              {icon}
            </StyledListItemIcon>
          </StyledListItemButton>
        </Tooltip>
      );
    }
  };

  const renderTelecallerMenu = (items) => {
    if (!items || !items.length) return null;

    const callSlugs = ['call-dashboard', 'assigned-calls', 'todays-calls', 'pending-calls', 'scheduled-calls', 'completed-calls', 'call-history', 'call-workspace', 'lead-detail'];
    const getSlug = item => String(item.path || '').replace(/\/+$/, '').split('/').pop();
    const children = callSlugs.map(slug => items.find(item => getSlug(item) === slug)).filter(Boolean);
    const dashboard = items.find(item => getSlug(item) === 'dashboard');
    const remaining = items.filter(item => getSlug(item) !== 'dashboard' && !callSlugs.includes(getSlug(item)));
    const isTelecallerActive = items.some(item => location.pathname === item.path)
      || isTelecallerPath(location.pathname);
    const selected = children.some(item => location.pathname === item.path)
      || /\/telecaller\/(call-workspace|lead-detail)(\/|$)/i.test(location.pathname);
    const submenuId = `telecaller-call-menu-${isMobile ? 'mobile' : 'desktop'}`;

    const toggleTelecaller = (e) => {
      const willOpen = !adminTelecallerDropdownOpen;
      setAdminTelecallerDropdownOpen(willOpen);
      if (willOpen) {
        setOpenSections(new Set());
        setAdminCrmDropdownOpen(false);
        setPayrollDropdownOpen(false);
        const target = e?.currentTarget;
        setTimeout(() => {
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    };

    const telecallerButton = (
      <StyledListItemButton
        selected={isTelecallerActive}
        isCollapsed={!isSidebarOpen}
        onClick={toggleTelecaller}
        sx={{
          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
          alignItems: 'center',
          p: isSidebarOpen ? '5px 8px' : 0,
          minHeight: 34,
          height: 34,
          width: isSidebarOpen ? 'calc(100% - 10px)' : 36,
          m: isSidebarOpen ? '1px 5px' : '2px auto',
          borderRadius: isSidebarOpen ? '7px' : '8px',
          border: isSidebarOpen ? (isTelecallerActive ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(226, 232, 240, 0.95)') : undefined,
          backgroundColor: isSidebarOpen
            ? (isTelecallerActive ? 'rgba(37, 99, 235, 0.08)' : (adminTelecallerDropdownOpen ? 'rgba(248, 250, 252, 0.95)' : '#ffffff'))
            : undefined,
          boxShadow: isSidebarOpen ? '0 1px 3px rgba(15, 23, 42, 0.04)' : undefined,
          transition: 'all 0.18s ease',
          '&:hover': {
            backgroundColor: isTelecallerActive ? 'rgba(37, 99, 235, 0.12)' : 'rgba(241, 245, 249, 1)',
            borderColor: isTelecallerActive ? 'rgba(37, 99, 235, 0.4)' : 'rgba(203, 213, 225, 0.9)',
          }
        }}
      >
        <StyledListItemIcon sx={{
          mr: isSidebarOpen ? 1.25 : 0,
          m: isSidebarOpen ? undefined : '0 auto',
          minWidth: 28,
          width: 28,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          color: isTelecallerActive ? 'primary.main' : '#475569'
        }}>
          <PhoneInTalkIcon />
        </StyledListItemIcon>
        {isSidebarOpen && (
          <>
            <ListItemText
              primary="Admin Telecaller"
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: isTelecallerActive ? 700 : 600,
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                color: isTelecallerActive ? 'primary.main' : '#1e293b'
              }}
            />
            <DragIndicatorIcon sx={{
              fontSize: 14,
              color: '#94a3b8',
              opacity: 0,
              mr: 0.5,
              transition: 'opacity 0.15s ease',
              '.MuiListItemButton-root:hover &': { opacity: 0.7 }
            }} />
            <ExpandMore sx={{
              fontSize: 18,
              color: adminTelecallerDropdownOpen ? 'primary.main' : '#64748b',
              transform: adminTelecallerDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s ease'
            }} />
          </>
        )}
      </StyledListItemButton>
    );

    return (
      <List sx={{ py: 0 }}>
        <StyledListItem disablePadding>
          {isSidebarOpen ? telecallerButton : (
            <Tooltip title="Admin Telecaller" placement="right">{telecallerButton}</Tooltip>
          )}
        </StyledListItem>
        <Collapse
          in={isSidebarOpen && adminTelecallerDropdownOpen}
          timeout="auto"
          unmountOnExit
          onEntered={(node) => {
            node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
        >
          <List disablePadding sx={{
            ml: 1.25,
            mr: 0.5,
            my: 0.15,
            pl: 0.5,
            borderLeft: '1.5px solid rgba(226, 232, 240, 0.9)',
            '& .MuiListItemButton-root': { minHeight: 32, width: '100%', mx: 0, py: '2px', borderRadius: '0 6px 6px 0' }
          }}>
            {dashboard && <StyledListItem disablePadding>{renderMenuItem(dashboard, isSidebarOpen)}</StyledListItem>}
            {children.length > 0 && (
              <>
                <StyledListItem disablePadding>
                  <Tooltip title={isSidebarOpen ? '' : 'Call Workspace'} placement="right">
                    <StyledListItemButton
                      component="button"
                      type="button"
                      selected={selected}
                      isCollapsed={!isSidebarOpen}
                      aria-label="Call Workspace"
                      aria-expanded={isSidebarOpen && telecallerWorkspaceOpen}
                      aria-controls={submenuId}
                      onClick={() => setTelecallerWorkspaceOpen(open => !open)}
                      sx={{
                        justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                        alignItems: 'center',
                        p: isSidebarOpen ? '5px 8px' : 0,
                        minHeight: 32,
                      }}
                    >
                      <StyledListItemIcon sx={{
                        mr: isSidebarOpen ? 1.25 : 0,
                        minWidth: isSidebarOpen ? 28 : 0,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <SupportAgentIcon />
                      </StyledListItemIcon>
                      {isSidebarOpen && (
                        <>
                          <ListItemText primary="Call Workspace" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: selected ? 600 : 500 }} />
                          {telecallerWorkspaceOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                        </>
                      )}
                    </StyledListItemButton>
                  </Tooltip>
                </StyledListItem>
                <Collapse id={submenuId} in={isSidebarOpen && telecallerWorkspaceOpen} timeout="auto">
                  <List disablePadding sx={{
                    ml: 1.25,
                    mr: 0.5,
                    my: 0.15,
                    pl: 0.5,
                    borderLeft: '1.5px solid rgba(226, 232, 240, 0.9)',
                    '& .MuiListItemButton-root': { minHeight: 32, width: '100%', mx: 0, py: '2px', borderRadius: '0 6px 6px 0' }
                  }}>
                    {children.map(item => (
                      <StyledListItem key={item.id} disablePadding>{renderMenuItem(item, isSidebarOpen)}</StyledListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}
            {remaining.map(item => (
              <StyledListItem key={item.id} disablePadding>{renderMenuItem(item, isSidebarOpen)}</StyledListItem>
            ))}
          </List>
        </Collapse>
      </List>
    );
  };

  const renderAdminCrmMenu = (items) => {
    if (!items || !items.length) return null;

    const dashboardItem = items.find(item => item.id === 'admin-crm-dashboard');
    const groupedIds = new Set(ADMIN_CRM_MENU_GROUPS.flatMap(group => group.itemIds));
    const remainingItems = items.filter(item => item.id !== 'admin-crm-dashboard' && !groupedIds.has(item.id));
    const isCrmActive = items.some(item => location.pathname === item.path)
      || isCrmPath(location.pathname);

    const toggleCrm = (e) => {
      const willOpen = !adminCrmDropdownOpen;
      setAdminCrmDropdownOpen(willOpen);
      if (willOpen) {
        setOpenSections(new Set());
        setAdminTelecallerDropdownOpen(false);
        setPayrollDropdownOpen(false);
        const target = e?.currentTarget;
        setTimeout(() => {
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    };

    const toggleGroup = (groupId) => {
      setOpenAdminCrmGroups(current => {
        const next = new Set();
        if (!current.has(groupId)) {
          next.add(groupId);
        }
        return next;
      });
    };

    const crmButton = (
      <StyledListItemButton
        selected={isCrmActive}
        isCollapsed={!isSidebarOpen}
        onClick={toggleCrm}
        sx={{
          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
          alignItems: 'center',
          p: isSidebarOpen ? '5px 8px' : 0,
          minHeight: 34,
          height: 34,
          width: isSidebarOpen ? 'calc(100% - 10px)' : 36,
          m: isSidebarOpen ? '1px 5px' : '2px auto',
          borderRadius: isSidebarOpen ? '7px' : '8px',
          border: isSidebarOpen ? (isCrmActive ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(226, 232, 240, 0.95)') : undefined,
          backgroundColor: isSidebarOpen
            ? (isCrmActive ? 'rgba(37, 99, 235, 0.08)' : (adminCrmDropdownOpen ? 'rgba(248, 250, 252, 0.95)' : '#ffffff'))
            : undefined,
          boxShadow: isSidebarOpen ? '0 1px 3px rgba(15, 23, 42, 0.04)' : undefined,
          transition: 'all 0.18s ease',
          '&:hover': {
            backgroundColor: isCrmActive ? 'rgba(37, 99, 235, 0.12)' : 'rgba(241, 245, 249, 1)',
            borderColor: isCrmActive ? 'rgba(37, 99, 235, 0.4)' : 'rgba(203, 213, 225, 0.9)',
          }
        }}
      >
        <StyledListItemIcon sx={{
          mr: isSidebarOpen ? 1.25 : 0,
          m: isSidebarOpen ? undefined : '0 auto',
          minWidth: 28,
          width: 28,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          color: isCrmActive ? 'primary.main' : '#475569'
        }}>
          <ContactPhoneIcon />
        </StyledListItemIcon>
        {isSidebarOpen && (
          <>
            <ListItemText
              primary="Admin CRM"
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: isCrmActive ? 700 : 600,
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                color: isCrmActive ? 'primary.main' : '#1e293b'
              }}
            />
            <DragIndicatorIcon sx={{
              fontSize: 14,
              color: '#94a3b8',
              opacity: 0,
              mr: 0.5,
              transition: 'opacity 0.15s ease',
              '.MuiListItemButton-root:hover &': { opacity: 0.7 }
            }} />
            <ExpandMore sx={{
              fontSize: 18,
              color: adminCrmDropdownOpen ? 'primary.main' : '#64748b',
              transform: adminCrmDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s ease'
            }} />
          </>
        )}
      </StyledListItemButton>
    );

    return (
      <List sx={{ py: 0 }}>
        <StyledListItem disablePadding>
          {isSidebarOpen ? crmButton : (
            <Tooltip title="Admin CRM" placement="right">{crmButton}</Tooltip>
          )}
        </StyledListItem>
        <Collapse
          in={isSidebarOpen && adminCrmDropdownOpen}
          timeout="auto"
          unmountOnExit
          onEntered={(node) => {
            node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
        >
          <List disablePadding sx={{
            ml: 1.25,
            mr: 0.5,
            my: 0.15,
            pl: 0.5,
            borderLeft: '1.5px solid rgba(226, 232, 240, 0.9)',
            '& .MuiListItemButton-root': { minHeight: 32, width: '100%', mx: 0, py: '2px', borderRadius: '0 6px 6px 0' }
          }}>
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
                  isCollapsed={!isSidebarOpen}
                  onClick={() => toggleGroup(group.id)}
                  sx={{
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                    alignItems: 'center',
                    p: isSidebarOpen ? '5px 8px' : 0,
                    minHeight: 32,
                  }}
                >
                  <StyledListItemIcon sx={{
                    mr: isSidebarOpen ? 1.25 : 0,
                    minWidth: isSidebarOpen ? 28 : 0,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {getIconComponent(group.icon)}
                  </StyledListItemIcon>
                  {isSidebarOpen && (
                    <>
                      <ListItemText
                        primary={group.name}
                        sx={{ minWidth: 0, my: 0, overflow: 'visible' }}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: {
                            fontWeight: hasSelectedChild ? 600 : 500,
                            fontSize: '0.78rem',
                            lineHeight: 1.25,
                            whiteSpace: 'normal',
                            wordBreak: 'normal',
                            overflow: 'visible',
                            textOverflow: 'clip'
                          }
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
                      ml: 1.25,
                      mr: 0.5,
                      my: 0.15,
                      pl: 0.5,
                      borderLeft: '1.5px solid rgba(226, 232, 240, 0.9)',
                      '& .MuiListItemButton-root': { minHeight: 32, width: '100%', mx: 0, py: '2px', borderRadius: '0 6px 6px 0' }
                    }}>
                      {children.map(item => (
                        <StyledListItem key={item.id} disablePadding>
                          {renderMenuItem(item, isSidebarOpen)}
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
        </Collapse>
      </List>
    );
  };

  const renderPayrollMenu = (items) => {
    if (!items || !items.length) return null;

    const isPayrollActive = items.some(item => location.pathname === item.path)
      || isPayrollPath(location.pathname);

    const togglePayroll = (e) => {
      const willOpen = !payrollDropdownOpen;
      setPayrollDropdownOpen(willOpen);
      if (willOpen) {
        setOpenSections(new Set());
        setAdminCrmDropdownOpen(false);
        setAdminTelecallerDropdownOpen(false);
        const target = e?.currentTarget;
        setTimeout(() => {
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    };

    const payrollButton = (
      <StyledListItemButton
        selected={isPayrollActive}
        isCollapsed={!isSidebarOpen}
        onClick={togglePayroll}
        sx={{
          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
          alignItems: 'center',
          p: isSidebarOpen ? '5px 8px' : 0,
          minHeight: 34,
          height: 34,
          width: isSidebarOpen ? 'calc(100% - 10px)' : 36,
          m: isSidebarOpen ? '1px 5px' : '2px auto',
          borderRadius: isSidebarOpen ? '7px' : '8px',
          border: isSidebarOpen ? (isPayrollActive ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(226, 232, 240, 0.95)') : undefined,
          backgroundColor: isSidebarOpen
            ? (isPayrollActive ? 'rgba(37, 99, 235, 0.08)' : (payrollDropdownOpen ? 'rgba(248, 250, 252, 0.95)' : '#ffffff'))
            : undefined,
          boxShadow: isSidebarOpen ? '0 1px 3px rgba(15, 23, 42, 0.04)' : undefined,
          transition: 'all 0.18s ease',
          '&:hover': {
            backgroundColor: isPayrollActive ? 'rgba(37, 99, 235, 0.12)' : 'rgba(241, 245, 249, 1)',
            borderColor: isPayrollActive ? 'rgba(37, 99, 235, 0.4)' : 'rgba(203, 213, 225, 0.9)',
          }
        }}
      >
        <StyledListItemIcon sx={{
          mr: isSidebarOpen ? 1.25 : 0,
          m: isSidebarOpen ? undefined : '0 auto',
          minWidth: 28,
          width: 28,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          color: isPayrollActive ? 'primary.main' : '#475569'
        }}>
          <PayrollHeaderIcon />
        </StyledListItemIcon>
        {isSidebarOpen && (
          <>
            <ListItemText
              primary="Payroll"
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: isPayrollActive ? 700 : 600,
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                color: isPayrollActive ? 'primary.main' : '#1e293b'
              }}
            />
            <DragIndicatorIcon sx={{
              fontSize: 14,
              color: '#94a3b8',
              opacity: 0,
              mr: 0.5,
              transition: 'opacity 0.15s ease',
              '.MuiListItemButton-root:hover &': { opacity: 0.7 }
            }} />
            <ExpandMore sx={{
              fontSize: 18,
              color: payrollDropdownOpen ? 'primary.main' : '#64748b',
              transform: payrollDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s ease'
            }} />
          </>
        )}
      </StyledListItemButton>
    );

    return (
      <List sx={{ py: 0 }}>
        <StyledListItem disablePadding>
          {isSidebarOpen ? payrollButton : (
            <Tooltip title="Payroll" placement="right">{payrollButton}</Tooltip>
          )}
        </StyledListItem>
        <Collapse
          in={isSidebarOpen && payrollDropdownOpen}
          timeout="auto"
          unmountOnExit
          onEntered={(node) => {
            node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
        >
          <List disablePadding sx={{
            ml: 1.25,
            mr: 0.5,
            my: 0.15,
            pl: 0.5,
            borderLeft: '1.5px solid rgba(226, 232, 240, 0.9)',
            '& .MuiListItemButton-root': { minHeight: 32, width: '100%', mx: 0, py: '2px', borderRadius: '0 6px 6px 0' }
          }}>
            {items.map(item => (
              <StyledListItem key={item.id} disablePadding>
                {renderMenuItem(item, isSidebarOpen)}
              </StyledListItem>
            ))}
          </List>
        </Collapse>
      </List>
    );
  };

  const getCategoryIcon = (category) => {
    const key = String(category || '').trim().toLowerCase();
    switch (key) {
      case 'main':
      case 'dashboard':
      case 'home':
        return <DashboardIcon />;
      case 'tasks':
      case 'task':
        return <TaskIcon />;
      case 'projects':
      case 'project':
        return <GroupsIcon />;
      case 'meetings':
      case 'meeting':
        return <VideoCallIcon />;
      case 'communication':
      case 'chat':
      case 'messages':
        return <ChatIcon />;
      case 'work':
      case 'workplace':
        return <CalendarIcon />;
      case 'attendance':
        return <CalendarIcon />;
      case 'leaves':
      case 'my-leaves':
        return <EventNoteIcon />;
      case 'assets':
      case 'my-assets':
        return <ComputerIcon />;
      case 'clients':
      case 'client':
        return <StorefrontIcon />;
      case 'administration':
      case 'admin':
        return <PersonIcon />;
      case 'settings':
      case 'setting':
        return <SettingsIcon />;
      case 'payroll':
      case 'salary':
        return <PayrollHeaderIcon />;
      case 'crm':
        return <ContactPhoneIcon />;
      case 'admin-telecaller':
      case 'telecaller':
        return <PhoneInTalkIcon />;
      case 'reports':
      case 'analytics':
        return <AnalyticsIcon />;
      case 'billing':
      case 'payments':
      case 'finance':
        return <CreditCardIcon />;
      case 'support':
      case 'help':
        return <SupportAgentIcon />;
      case 'documents':
      case 'files':
        return <DescriptionIcon />;
      default: {
        if (key.includes('task')) return <TaskIcon />;
        if (key.includes('meet')) return <VideoCallIcon />;
        if (key.includes('comm') || key.includes('chat') || key.includes('message')) return <ChatIcon />;
        if (key.includes('proj') || key.includes('group')) return <GroupsIcon />;
        if (key.includes('work')) return <CalendarIcon />;
        if (key.includes('main') || key.includes('dash') || key.includes('home')) return <DashboardIcon />;
        if (key.includes('admin') || key.includes('user') || key.includes('people') || key.includes('member')) return <PersonIcon />;
        if (key.includes('set') || key.includes('config')) return <SettingsIcon />;
        if (key.includes('client') || key.includes('customer')) return <StorefrontIcon />;
        if (key.includes('pay') || key.includes('sal') || key.includes('wage')) return <PayrollHeaderIcon />;
        if (key.includes('call') || key.includes('tele') || key.includes('phone')) return <PhoneInTalkIcon />;
        if (key.includes('report') || key.includes('analyt')) return <AnalyticsIcon />;
        if (key.includes('leave')) return <EventNoteIcon />;
        if (key.includes('attend')) return <CalendarIcon />;
        if (key.includes('asset') || key.includes('device')) return <ComputerIcon />;
        if (key.includes('alert') || key.includes('notif')) return <NotificationsIcon />;
        return <FolderIcon />;
      }
    }
  };

  const renderSectionDropdown = (category, items) => {
    if (!items || !items.length) return null;

    const lowerCat = String(category || '').trim().toLowerCase();
    if (lowerCat === 'main' && (!sidebarConfig || !Array.isArray(sidebarConfig.ranges) || sidebarConfig.ranges.length === 0)) {
      return (
        <List sx={{ py: 0 }}>
          {items.map(item => (
            <StyledListItem key={item.id} disablePadding>
              {renderMenuItem(item, isSidebarOpen)}
            </StyledListItem>
          ))}
        </List>
      );
    }

    const label = categoryLabels[lowerCat] || categoryLabels[category] || (
      String(category || '').charAt(0).toUpperCase() + String(category || '').slice(1)
    );
    const isOpen = openSections.has(category);
    const isActive = items.some(item => location.pathname === item.path || (item.path && location.pathname.startsWith(item.path)));

    const handleSectionClick = (e) => {
      const willOpen = !openSections.has(category);
      toggleSection(category);
      if (willOpen) {
        const target = e?.currentTarget;
        setTimeout(() => {
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    };

    const sectionButton = (
      <StyledListItemButton
        selected={isActive}
        isCollapsed={!isSidebarOpen}
        onClick={handleSectionClick}
        sx={{
          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
          alignItems: 'center',
          p: isSidebarOpen ? '5px 8px' : 0,
          minHeight: 34,
          height: 34,
          width: isSidebarOpen ? 'calc(100% - 10px)' : 36,
          m: isSidebarOpen ? '1px 5px' : '2px auto',
          borderRadius: isSidebarOpen ? '7px' : '8px',
          border: isSidebarOpen ? (isActive ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(226, 232, 240, 0.95)') : undefined,
          backgroundColor: isSidebarOpen
            ? (isActive ? 'rgba(37, 99, 235, 0.08)' : (isOpen ? 'rgba(248, 250, 252, 0.95)' : '#ffffff'))
            : undefined,
          boxShadow: isSidebarOpen ? '0 1px 3px rgba(15, 23, 42, 0.04)' : undefined,
          transition: 'all 0.18s ease',
          '&:hover': {
            backgroundColor: isActive ? 'rgba(37, 99, 235, 0.12)' : 'rgba(241, 245, 249, 1)',
            borderColor: isActive ? 'rgba(37, 99, 235, 0.4)' : 'rgba(203, 213, 225, 0.9)',
          }
        }}
      >
        <StyledListItemIcon sx={{
          mr: isSidebarOpen ? 1.25 : 0,
          m: isSidebarOpen ? undefined : '0 auto',
          minWidth: 28,
          width: 28,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          color: isActive ? 'primary.main' : '#475569'
        }}>
          {getCategoryIcon(category)}
        </StyledListItemIcon>
        {isSidebarOpen && (
          <>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                color: isActive ? 'primary.main' : '#1e293b'
              }}
            />
            <DragIndicatorIcon sx={{
              fontSize: 14,
              color: '#94a3b8',
              opacity: 0,
              mr: 0.5,
              transition: 'opacity 0.15s ease',
              '.MuiListItemButton-root:hover &': { opacity: 0.7 }
            }} />
            <ExpandMore sx={{
              fontSize: 18,
              color: isOpen ? 'primary.main' : '#64748b',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s ease'
            }} />
          </>
        )}
      </StyledListItemButton>
    );

    return (
      <List sx={{ py: 0 }}>
        <StyledListItem disablePadding>
          {isSidebarOpen ? sectionButton : (
            <Tooltip title={label} placement="right">{sectionButton}</Tooltip>
          )}
        </StyledListItem>
        <Collapse
          in={isSidebarOpen && isOpen}
          timeout="auto"
          unmountOnExit
          onEntered={(node) => {
            node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
        >
          <List disablePadding sx={{
            ml: 1.25,
            mr: 0.5,
            my: 0.15,
            pl: 0.5,
            borderLeft: '1.5px solid rgba(226, 232, 240, 0.9)',
            '& .MuiListItemButton-root': { minHeight: 32, width: '100%', mx: 0, py: '2px', borderRadius: '0 6px 6px 0' }
          }}>
            {items.map(item => (
              <StyledListItem key={item.id} disablePadding>
                {renderMenuItem(item, isSidebarOpen)}
              </StyledListItem>
            ))}
          </List>
        </Collapse>
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

    // Payroll
    if (isPayrollItem(item)) return 'payroll';

    // Keep original database category if not matching the targeted 15 items!
    return item.category || 'main';
  };

  const groupedItems = useMemo(() => {
    const groups = {};
    const categoryOrder = ['main', 'work', 'communication', 'admin', 'settings', 'administration', 'tasks', 'projects', 'meetings', 'clients', 'payroll'];
    // Keep CRM sections below ordinary and custom sidebar sections.
    const crmSectionOrder = category => category === 'crm' ? 1 : category === 'admin-telecaller' ? 2 : 0;
    const customRanges = sidebarConfig && Array.isArray(sidebarConfig.ranges) ? sidebarConfig.ranges : [];
    const hasCustomRanges = customRanges.length > 0;
    // Custom range headings retain the spelling entered in Sidebar Management
    // (for example, "Main"). The built-in Dashboard category is "main".
    // Without this lookup the two case variants become separate groups, which
    // renders two identical Main sections when Dashboard falls outside a range.
    const customHeadingByNormalizedName = new Map(
      customRanges
        .map(range => String(range?.heading || '').trim())
        .filter(Boolean)
        .map(heading => [heading.toLowerCase(), heading])
    );

    menuItems.forEach(item => {
      let category = String(item.path || '').toLowerCase().startsWith('/ciisuser/telecaller/')
        ? 'admin-telecaller'
        : String(item.path || '').toLowerCase().startsWith('/ciisuser/crm/')
          ? 'crm'
          : isPayrollItem(item)
            ? 'payroll'
            : '';
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

      // Keep default categories with the matching custom heading in one
      // section. This puts Dashboard back in the existing Main dropdown.
      category = customHeadingByNormalizedName.get(String(category).trim().toLowerCase()) || category;

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

  const [customSectionOrder, setCustomSectionOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(`ciis_custom_section_order_${userId || 'default'}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [draggedCategory, setDraggedCategory] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);
  const [dropPosition, setDropPosition] = useState('after');
  const scrollContainerRef = useRef(null);
  const scrollSpeedRef = useRef(0);
  const isAutoScrollingRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(`ciis_custom_section_order_${userId}`);
      if (saved) {
        setCustomSectionOrder(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [userId]);

  const orderedCategories = useMemo(() => {
    const available = Object.keys(groupedItems);
    if (!customSectionOrder || !Array.isArray(customSectionOrder) || customSectionOrder.length === 0) {
      return available;
    }
    const orderMap = new Map(customSectionOrder.map((cat, idx) => [cat, idx]));
    return [...available].sort((a, b) => {
      const posA = orderMap.has(a) ? orderMap.get(a) : 999;
      const posB = orderMap.has(b) ? orderMap.get(b) : 999;
      if (posA !== posB) return posA - posB;
      return available.indexOf(a) - available.indexOf(b);
    });
  }, [groupedItems, customSectionOrder]);

  useEffect(() => {
    if (!draggedCategory) {
      isAutoScrollingRef.current = false;
      scrollSpeedRef.current = 0;
      return;
    }

    const startAutoScroll = () => {
      if (isAutoScrollingRef.current) return;
      isAutoScrollingRef.current = true;

      const loop = () => {
        if (!isAutoScrollingRef.current || !scrollContainerRef.current) {
          isAutoScrollingRef.current = false;
          return;
        }
        if (scrollSpeedRef.current !== 0) {
          scrollContainerRef.current.scrollTop += scrollSpeedRef.current;
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    };

    const handleWindowDragOver = (e) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      // Only auto-scroll when cursor is within the sidebar horizontal boundaries
      if (clientX < rect.left - 20 || clientX > rect.right + 20) {
        scrollSpeedRef.current = 0;
        return;
      }

      const threshold = 100;
      const maxSpeed = 16;

      if (clientY < rect.top + threshold && clientY >= rect.top - 50) {
        // Dragging near top edge -> scroll up
        const dist = (rect.top + threshold) - clientY;
        const speedRatio = Math.min(Math.max(dist / threshold, 0.25), 1);
        scrollSpeedRef.current = -Math.round(speedRatio * maxSpeed);
        startAutoScroll();
      } else if (clientY > rect.bottom - threshold && clientY <= rect.bottom + 120) {
        // Dragging near bottom edge -> scroll down
        const dist = clientY - (rect.bottom - threshold);
        const speedRatio = Math.min(Math.max(dist / threshold, 0.25), 1);
        scrollSpeedRef.current = Math.round(speedRatio * maxSpeed);
        startAutoScroll();

        // If dragged down towards the bottom past sections, target last section
        if (orderedCategories.length > 0) {
          const lastCat = orderedCategories[orderedCategories.length - 1];
          if (lastCat && lastCat !== draggedCategory) {
            setDragOverCategory(lastCat);
            setDropPosition('after');
          }
        }
      } else {
        scrollSpeedRef.current = 0;
      }
    };

    const handleWindowDragEnd = () => {
      isAutoScrollingRef.current = false;
      scrollSpeedRef.current = 0;
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragend', handleWindowDragEnd);
    window.addEventListener('drop', handleWindowDragEnd);

    return () => {
      isAutoScrollingRef.current = false;
      scrollSpeedRef.current = 0;
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragend', handleWindowDragEnd);
      window.removeEventListener('drop', handleWindowDragEnd);
    };
  }, [draggedCategory, orderedCategories]);

  const handleDragStart = (e, category) => {
    if (!isSidebarOpen) return;
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', category);
  };

  const handleDragOver = (e, category) => {
    if (!draggedCategory || draggedCategory === category) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isAbove = e.clientY < midY;

    setDragOverCategory(category);
    setDropPosition(isAbove ? 'before' : 'after');
  };

  const handleDragLeave = () => {
    // Drag leave is managed at container level to prevent flickering when hovering over drop slots
  };

  const handleDrop = (e, targetCategory) => {
    e.preventDefault();
    isAutoScrollingRef.current = false;
    scrollSpeedRef.current = 0;
    if (!draggedCategory || draggedCategory === targetCategory) {
      setDraggedCategory(null);
      setDragOverCategory(null);
      return;
    }

    const currentOrder = [...orderedCategories];
    const fromIndex = currentOrder.indexOf(draggedCategory);
    if (fromIndex === -1) return;

    currentOrder.splice(fromIndex, 1);
    const toIndex = currentOrder.indexOf(targetCategory);
    const insertIndex = dropPosition === 'before' ? toIndex : toIndex + 1;
    currentOrder.splice(insertIndex, 0, draggedCategory);

    setCustomSectionOrder(currentOrder);
    try {
      localStorage.setItem(`ciis_custom_section_order_${userId || 'default'}`, JSON.stringify(currentOrder));
    } catch (err) {
      console.warn('Could not save custom sidebar section order:', err);
    }

    setDraggedCategory(null);
    setDragOverCategory(null);
  };

  const handleDragEnd = () => {
    isAutoScrollingRef.current = false;
    scrollSpeedRef.current = 0;
    setDraggedCategory(null);
    setDragOverCategory(null);
  };

  useEffect(() => {
    if (isCrmPath(location.pathname)) {
      setAdminCrmDropdownOpen(true);
      setAdminTelecallerDropdownOpen(false);
      setPayrollDropdownOpen(false);
      setOpenSections(new Set());
      return;
    }
    if (isTelecallerPath(location.pathname)) {
      setAdminTelecallerDropdownOpen(true);
      setAdminCrmDropdownOpen(false);
      setPayrollDropdownOpen(false);
      setOpenSections(new Set());
      return;
    }
    if (isPayrollPath(location.pathname)) {
      setPayrollDropdownOpen(true);
      setAdminCrmDropdownOpen(false);
      setAdminTelecallerDropdownOpen(false);
      setOpenSections(new Set());
      return;
    }

    const matchedEntry = Object.entries(groupedItems).find(([cat, items]) =>
      items.some(item => item.path === location.pathname || (item.path && location.pathname.startsWith(item.path)))
    );

    if (matchedEntry) {
      const [matchedCat] = matchedEntry;
      setOpenSections(prev => {
        if (prev.has(matchedCat) && prev.size === 1) return prev;
        return new Set([matchedCat]);
      });
      setAdminCrmDropdownOpen(false);
      setAdminTelecallerDropdownOpen(false);
      setPayrollDropdownOpen(false);
    }
  }, [location.pathname, groupedItems]);

  const toggleSection = (category) => {
    setOpenSections(prev => {
      if (prev.has(category)) {
        return new Set();
      }
      return new Set([category]);
    });
    setAdminCrmDropdownOpen(false);
    setAdminTelecallerDropdownOpen(false);
    setPayrollDropdownOpen(false);
  };


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
        {/* Scrollable Container */}
        <Box sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
            width: 0,
            height: 0,
          },
        }}>
          <Collapse in={isSidebarOpen} timeout={250}>
            <Box sx={{ p: 1.25, borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.75 }}>
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
                      border: '1px solid rgba(226, 232, 240, 0.8)',
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
          </Collapse>
          <List sx={{ py: 0 }}>
            {menuItems.map((item) => (
              <StyledListItem key={item.id} disablePadding>
                {renderMenuItem(item, isSidebarOpen)}
              </StyledListItem>
            ))}
          </List>
        </Box>

        <Box sx={{
          width: '100%',
          p: isSidebarOpen ? '6px 10px' : '6px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          transition: 'padding 0.2s ease',
          boxSizing: 'border-box'
        }}>
          <Tooltip title={!isSidebarOpen ? "Logout" : ""} placement="right" disableHoverListener={isSidebarOpen}>
            <StyledListItemButton
              onClick={handleLogout}
              isCollapsed={!isSidebarOpen}
              sx={{
                color: 'error.main',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                alignItems: 'center',
                width: isSidebarOpen ? '100%' : 36,
                height: 34,
                minHeight: 34,
                p: isSidebarOpen ? '5px 10px' : 0,
                m: isSidebarOpen ? 0 : '0 auto',
                borderRadius: '8px',
                borderLeft: '1px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: 'error.dark',
                  borderLeft: '1px solid transparent'
                }
              }}
            >
              <StyledListItemIcon sx={{
                color: 'inherit',
                m: isSidebarOpen ? undefined : '0 auto',
                mr: isSidebarOpen ? 1.25 : 0,
                minWidth: 28,
                width: 28,
                height: 24,
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}>
                <LogoutOutlined sx={{ fontSize: 22 }} />
              </StyledListItemIcon>
              {isSidebarOpen && (
                <ListItemText
                  primary="Logout"
                  sx={{
                    minWidth: 0,
                    my: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 600
                  }}
                />
              )}
            </StyledListItemButton>
          </Tooltip>
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
    if (String(category || '').trim().toLowerCase() === 'main') {
      return null;
    }

    return (
      <Divider
        key={`divider-${category}`}
        sx={{
          my: 0.2,
          mx: isSidebarOpen ? 1 : 0.75,
          borderColor: 'rgba(226, 232, 240, 0.65)'
        }}
      />
    );
  };

  const renderDropSlot = (targetCategory) => (
    <Box
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => handleDrop(e, targetCategory)}
      sx={{
        height: 36,
        mx: isSidebarOpen ? '6px' : '4px',
        my: '4px',
        borderRadius: '8px',
        border: '1.5px dashed #2563eb',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.16)' : 'rgba(37, 99, 235, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.8,
        transition: 'all 0.15s ease-out',
        animation: 'dropSlotIn 0.18s ease-out',
        '@keyframes dropSlotIn': {
          from: { height: 0, opacity: 0, transform: 'scale(0.97)' },
          to: { height: 36, opacity: 1, transform: 'scale(1)' },
        },
      }}
    >
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#2563eb', opacity: 0.8 }} />
      <Typography
        sx={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: '#2563eb',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        Drop Section Here
      </Typography>
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#2563eb', opacity: 0.8 }} />
    </Box>
  );

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

      {/* Main Navigation with Scroll */}
      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          pb: 8,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(203, 213, 225, 0.5) transparent',
          '&::-webkit-scrollbar': {
            width: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(203, 213, 225, 0.5)',
            borderRadius: 2,
          },
        }}
      >
        <Collapse in={isSidebarOpen} timeout={250}>
          <Box sx={{ px: 2, py: 2.25, borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
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
        </Collapse>
        {renderClientCompanySwitcher()}
        <Box
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setDragOverCategory(null);
            }
          }}
        >
          {orderedCategories.map(category => {
            const isTarget = draggedCategory && draggedCategory !== category && dragOverCategory === category;
            const showSlotBefore = isTarget && dropPosition === 'before';
            const showSlotAfter = isTarget && dropPosition === 'after';

            return (
              <React.Fragment key={category}>
                {showSlotBefore && renderDropSlot(category)}
                <Box
                  draggable={isSidebarOpen}
                  onDragStart={(e) => handleDragStart(e, category)}
                  onDragOver={(e) => handleDragOver(e, category)}
                  onDrop={(e) => handleDrop(e, category)}
                  onDragEnd={handleDragEnd}
                  sx={{
                    position: 'relative',
                    opacity: draggedCategory === category ? 0.35 : 1,
                    transform: draggedCategory === category ? 'scale(0.98)' : 'none',
                    transition: 'opacity 0.18s ease, transform 0.18s ease',
                    cursor: isSidebarOpen ? 'grab' : 'default',
                    '&:active': {
                      cursor: isSidebarOpen ? 'grabbing' : 'default',
                    },
                  }}
                >
                  {renderCategoryHeading(category)}

                  {category === 'crm' ? (
                    renderAdminCrmMenu(groupedItems[category])
                  ) : category === 'admin-telecaller' ? (
                    renderTelecallerMenu(groupedItems[category])
                  ) : category === 'payroll' ? (
                    renderPayrollMenu(groupedItems[category])
                  ) : (
                    renderSectionDropdown(category, groupedItems[category])
                  )}
                </Box>
                {showSlotAfter && renderDropSlot(category)}
              </React.Fragment>
            );
          })}
        </Box>

        {draggedCategory && (
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (orderedCategories.length > 0) {
                const lastCat = orderedCategories[orderedCategories.length - 1];
                if (lastCat !== draggedCategory) {
                  setDragOverCategory(lastCat);
                  setDropPosition('after');
                }
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedCategory && orderedCategories.length > 0) {
                const lastCat = orderedCategories[orderedCategories.length - 1];
                handleDrop(e, lastCat);
              }
            }}
            sx={{
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        )}
      </Box>

      <Box
        onDragOver={(e) => {
          if (draggedCategory) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (orderedCategories.length > 0) {
              const lastCat = orderedCategories[orderedCategories.length - 1];
              if (lastCat !== draggedCategory) {
                setDragOverCategory(lastCat);
                setDropPosition('after');
              }
            }
          }
        }}
        onDrop={(e) => {
          if (draggedCategory && orderedCategories.length > 0) {
            const lastCat = orderedCategories[orderedCategories.length - 1];
            handleDrop(e, lastCat);
          }
        }}
        sx={{
          width: '100%',
          p: isSidebarOpen ? '6px 10px' : '6px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          transition: 'padding 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        <Tooltip title={!isSidebarOpen ? "Logout" : ""} placement="right" disableHoverListener={isSidebarOpen}>
          <StyledListItemButton
            onClick={handleLogout}
            isCollapsed={!isSidebarOpen}
            sx={{
              color: 'error.main',
              justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              alignItems: 'center',
              width: isSidebarOpen ? '100%' : 36,
              height: 34,
              minHeight: 34,
              p: isSidebarOpen ? '5px 10px' : 0,
              m: isSidebarOpen ? 0 : '0 auto',
              borderRadius: '8px',
              borderLeft: '1px solid transparent',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: 'error.dark',
                borderLeft: '1px solid transparent'
              }
            }}
          >
            <StyledListItemIcon sx={{
              color: 'inherit',
              m: isSidebarOpen ? undefined : '0 auto',
              mr: isSidebarOpen ? 1.25 : 0,
              minWidth: 28,
              width: 28,
              height: 24,
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}>
              <LogoutOutlined sx={{ fontSize: 22 }} />
            </StyledListItemIcon>
            {isSidebarOpen && (
              <ListItemText
                primary="Logout"
                sx={{
                  minWidth: 0,
                  my: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 600
                }}
              />
            )}
          </StyledListItemButton>
        </Tooltip>
      </Box>
    </Container>
  );
};

export default Sidebar;
