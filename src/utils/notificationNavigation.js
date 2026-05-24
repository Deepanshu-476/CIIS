const normalize = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

const PATH_TO_ROUTE = {
  'user-dashboard': '/ciisUser/user-dashboard',
  dashboard: '/ciisUser/user-dashboard',
  'client-dashboard': '/ciisUser/ClientDashboard',
  'my-leaves': '/ciisUser/my-leaves',
  leaves: '/ciisUser/my-leaves',
  'my-assets': '/ciisUser/my-assets',
  assets: '/ciisUser/my-assets',
  attendance: '/ciisUser/attendance',
  'emp-attendance': '/ciisUser/emp-attendance',
  'employee-attendance': '/ciisUser/emp-attendance',
  'task-management': '/ciisUser/task-management',
  task: '/ciisUser/task-management',
  'admin-task-create': '/ciisUser/admin-task-create',
  'admin-create-task': '/ciisUser/admin-task-create',
  'company-all-task': '/ciisUser/company-all-task',
  'company-all-tasks': '/ciisUser/company-all-task',
  'emp-leaves': '/ciisUser/emp-leaves',
  'employee-leaves': '/ciisUser/emp-leaves',
  'emp-assets': '/ciisUser/emp-assets',
  'employee-assets': '/ciisUser/emp-assets',
  'manage-groups': '/ciisUser/manage-groups',
  groups: '/ciisUser/manage-groups',
  'employee-meeting': '/ciisUser/employee-meeting',
  meeting: '/ciisUser/employee-meeting',
  meetings: '/ciisUser/employee-meeting',
  'client-meeting': '/ciisUser/client-meeting',
  'admin-meeting': '/ciisUser/admin-meeting',
  'create-employee-meeting': '/ciisUser/admin-meeting',
  project: '/ciisUser/project',
  projects: '/ciisUser/project',
  adminproject: '/ciisUser/adminproject',
  'admin-project': '/ciisUser/adminproject',
  'admin-projects': '/ciisUser/adminproject',
  'emp-client': '/ciisUser/emp-client',
  'client-management': '/ciisUser/emp-client',
  chat: '/ciisUser/chat',
  chats: '/ciisUser/chat',
  alert: '/ciisUser/alert',
  alerts: '/ciisUser/alert',
  'create-alert': '/ciisUser/create-alert',
  profile: '/ciisUser/profile',
  'change-password': '/ciisUser/change-password',
};

const TYPE_TO_ROUTE = {
  task_assigned: '/ciisUser/task-management',
  task_pending_reminder: '/ciisUser/task-management',
  task_overdue: '/ciisUser/task-management',
  task_remark_added: '/ciisUser/task-management',
  task_status_updated: '/ciisUser/admin-task-create',
  status_updated: '/ciisUser/company-all-task',
  task_client: '/ciisUser/ClientDashboard',
  leave_applied: '/ciisUser/emp-leaves',
  leave_status_changed: '/ciisUser/my-leaves',
  leave_deleted: '/ciisUser/my-leaves',
  asset_requested: '/ciisUser/emp-assets',
  asset_request_status: '/ciisUser/my-assets',
  attendance_clock_in: '/ciisUser/emp-attendance',
  attendance_clock_out: '/ciisUser/emp-attendance',
  attendance_absent: '/ciisUser/attendance',
  chat_message: '/ciisUser/chat',
  group_chat_message: '/ciisUser/chat',
  group_member_added: '/ciisUser/manage-groups',
  meeting_created: '/ciisUser/employee-meeting',
  meeting: '/ciisUser/employee-meeting',
  project_created: '/ciisUser/project',
  project_task_assigned: '/ciisUser/project',
  project_task_status_changed: '/ciisUser/adminproject',
  holiday_reminder: '/ciisUser/user-dashboard',
};

const CATEGORY_TO_ROUTE = {
  attendance: '/ciisUser/attendance',
  leave: '/ciisUser/my-leaves',
  asset: '/ciisUser/my-assets',
  task: '/ciisUser/task-management',
  overdue: '/ciisUser/task-management',
  group: '/ciisUser/manage-groups',
  alert: '/ciisUser/alert',
  system: '/ciisUser/user-dashboard',
  'system-high': '/ciisUser/user-dashboard',
};

const routeFromPath = targetPath => {
  if (!targetPath) return '';
  if (String(targetPath).startsWith('/')) return targetPath;
  const lastSegment = String(targetPath).split('/').filter(Boolean).pop();
  return PATH_TO_ROUTE[normalize(lastSegment)] || PATH_TO_ROUTE[normalize(targetPath)] || '';
};

export const getNotificationRoute = notification => {
  const data = notification?.data || {};
  const typeRoute = TYPE_TO_ROUTE[normalize(notification?.type || data.type)];
  if (normalize(notification?.type || data.type) === 'task-client') return typeRoute;

  return (
    routeFromPath(notification?.targetPath || data.targetPath) ||
    PATH_TO_ROUTE[normalize(notification?.targetScreen || data.targetScreen)] ||
    typeRoute ||
    CATEGORY_TO_ROUTE[normalize(notification?.category)] ||
    ''
  );
};

export const openNotificationRoute = (navigate, notification) => {
  const route = getNotificationRoute(notification);
  if (!route || typeof navigate !== 'function') return false;
  navigate(route, {state: notification?.data || notification || {}});
  return true;
};
