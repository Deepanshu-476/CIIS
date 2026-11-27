import { websiteAppScreenMap } from '../config/websiteAppScreenMap';
import { CRM_PAGES } from '../config/crmPages';
import { TELECALLER_PAGES } from '../crm/telecaller/telecallerPages';

// Readable page names for User Activity: "/ciisUser/emp-leaves" -> "Employee Leaves".
// Paths from the server have ids replaced by ":id"; patterns here use ":userId" etc.

const KNOWN = [
  ...websiteAppScreenMap.flatMap(section => section.routes.map(route => ({ path: route.webUrl, name: route.webPage }))),
  ...CRM_PAGES.map(page => ({ path: page.path?.startsWith('/') ? page.path : `/ciisUser/${page.path}`, name: page.name })),
  ...TELECALLER_PAGES.map(page => ({ path: page.path, name: page.name })),
  { path: '/ciisUser/user-activity', name: 'Employee Activity' },
  { path: '/ciisUser/promotions', name: 'Promotions' },
  { path: '/ciisUser/page-management', name: 'Page Management' },
  { path: '/ciisUser/company-ai-settings', name: 'Company AI & Tokens' },
  { path: '/ciisUser/dashboard-overview', name: 'Dashboard Overview' },
  { path: '/ciisUser/crm/admin/marketing-ads', name: 'Marketing Ads Integrations' },
  { path: '/ciisUser/client-plans', name: 'Client Plans' },
  { path: '/ciisUser/client-documents', name: 'Client Documents' },
  { path: '/ciisUser/support-desk', name: 'Support Desk' },
  { path: '/ciisUser/company-assets', name: 'Asset Management' },
  { path: '/ciisUser/client-dashboard', name: 'Client Dashboard' },
  { path: '/ciisUser/client-my-services', name: 'Client Services' },
  { path: '/ciisUser/client-tasks-updates', name: 'Client Task Updates' },
  { path: '/ciisUser/client-payments', name: 'Client Payments & Invoices' },
  { path: '/ciisUser/register-request', name: 'Register Requests' },
  { path: '/ciisUser/SidebarManagement', name: 'Sidebar Management' },
].filter(item => item.path && item.name);

const segments = path => String(path || '').toLowerCase().replace(/\/+$/, '').split('/').filter(Boolean);

const matches = (pattern, path) => {
  const a = segments(pattern);
  const b = segments(path);
  if (a.length !== b.length) return false;
  return a.every((part, i) => part.startsWith(':') || b[i].startsWith(':') || part === b[i]);
};

const cache = new Map();

export const pageName = path => {
  const key = String(path || '');
  if (!key || key === '(unknown)') return 'Other / not linked to a page';
  if (cache.has(key)) return cache.get(key);
  // Prefer exact (no-parameter) matches over pattern matches.
  const exact = KNOWN.find(item => segments(item.path).join('/') === segments(key).join('/'));
  const found = exact || KNOWN.find(item => matches(item.path, key));
  let name = found?.name;
  if (!name) {
    const last = segments(key).filter(part => !part.startsWith(':')).pop() || key;
    name = last.replace(/[-_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, ch => ch.toUpperCase());
  }
  cache.set(key, name);
  return name;
};

// "POST /api/leaves/:id/approve" -> "Approved · leaves"
const VERBS = { POST: 'Added', PUT: 'Updated', PATCH: 'Updated', DELETE: 'Deleted' };
const ACTION_WORDS = ['approve', 'reject', 'assign', 'transfer', 'complete', 'cancel', 'activate', 'deactivate', 'verify', 'upload', 'import', 'export', 'restore', 'clock-in', 'clock-out', 'clockin', 'clockout', 'login', 'logout', 'send', 'status', 'remark', 'remarks', 'bulk'];
const PAST = { approve: 'Approved', reject: 'Rejected', assign: 'Assigned', transfer: 'Transferred', complete: 'Completed', cancel: 'Cancelled', activate: 'Activated', deactivate: 'Deactivated', verify: 'Verified', upload: 'Uploaded', import: 'Imported', export: 'Exported', restore: 'Restored', 'clock-in': 'Clocked in', 'clock-out': 'Clocked out', clockin: 'Clocked in', clockout: 'Clocked out', send: 'Sent', status: 'Changed status', remark: 'Added remark', remarks: 'Added remark', bulk: 'Bulk update' };

// Dedicated high-priority business action dictionary
const EXACT_ACTIONS = {
  'PUT /api/users/me': 'Updated Personal Profile',
  'POST /api/users': 'Created New User Account',
  'PUT /api/users/:id': 'Updated User Account',
  'DELETE /api/users/:id': 'Deactivated User Account',

  'POST /api/clienttasks': 'Created New Task',
  'PUT /api/clienttasks/:id': 'Updated Task Details',
  'PATCH /api/clienttasks/:id/status': 'Updated Task Status',
  'PATCH /api/clienttasks/:id': 'Updated Task Details',
  'DELETE /api/clienttasks/:id': 'Deleted Task',

  'POST /api/crm/leads': 'Added New CRM Lead',
  'PUT /api/crm/leads/:id': 'Updated CRM Lead Details',
  'PATCH /api/crm/leads/:id': 'Updated Lead Status / Followup',
  'DELETE /api/crm/leads/:id': 'Deleted CRM Lead',
  'POST /api/crm/leads/import': 'Bulk Imported CRM Leads',

  'POST /api/telecaller/calls': 'Logged Telecalling Feedback',
  'POST /api/telecaller/assign': 'Assigned Leads to Telecaller',

  'POST /api/attendance/clock-in': 'Clocked In (Attendance)',
  'POST /api/attendance/clock-out': 'Clocked Out (Attendance)',
  'POST /api/attendance': 'Marked Attendance',
  'PUT /api/attendance/:id': 'Updated Attendance Record',

  'POST /api/leaves': 'Applied for Leave',
  'POST /api/leaves/apply': 'Applied for Leave',
  'PATCH /api/leaves/:id/approve': 'Approved Leave Request',
  'PATCH /api/leaves/:id/reject': 'Rejected Leave Request',

  'POST /api/chat/messages': 'Sent Chat Message',
  'POST /api/chat/conversations': 'Started New Chat Group',

  'POST /api/payroll/generate': 'Generated Salary Slips',
  'PUT /api/payroll/:id': 'Updated Payroll Record',

  'POST /api/ai/task-agent/parse': 'Used AI Assistant',
  'PUT /api/company/:id/ai-settings/key': 'Updated Company AI Key',
  'PUT /api/company/:id/ai-settings/employees/:id': 'Updated Employee AI Quota',
  'PUT /api/company/:id/ai-settings/employees/bulk': 'Bulk Updated AI Quotas',
  'POST /api/mcp/keys': 'Generated MCP API Key',
  'POST /api/projects': 'Created New Project',
  'PUT /api/projects/:id': 'Updated Project',
  'POST /api/clientsservice': 'Added New Client',
  'PUT /api/clientsservice/:id': 'Updated Client Details',
  'POST /api/client-plans': 'Created Client Plan',
  'PUT /api/client-plans/:id': 'Updated Client Plan',
  'POST /api/breaks/start': 'Started Break',
  'POST /api/breaks/stop': 'Ended Break',
  'POST /api/week-off/request': 'Requested Week-Off Change',
  'POST /api/meetings/create': 'Scheduled Meeting',
  'POST /api/cmeeting/create': 'Scheduled Client Meeting',
  'POST /api/support/tickets': 'Created Support Ticket',
};

export const describeAction = (method = '', endpoint = '', summary = '') => {
  const normMethod = String(method || '').toUpperCase().trim();
  const normEndpoint = String(endpoint || '').trim();
  const key = `${normMethod} ${normEndpoint}`;

  if (EXACT_ACTIONS[key]) return EXACT_ACTIONS[key];

  // Try pattern matching
  for (const [patternKey, title] of Object.entries(EXACT_ACTIONS)) {
    const [pMethod, pPath] = patternKey.split(' ');
    if (pMethod === normMethod && matches(pPath, normEndpoint)) {
      return title;
    }
  }

  // Fallback to intelligent phrasing
  const parts = segments(normEndpoint).filter(part => part !== 'api' && !part.startsWith(':'));
  const word = [...parts].reverse().find(part => ACTION_WORDS.includes(part));
  const rawSubject = parts.filter(part => part !== word).slice(0, 2).join(' ').replace(/[-_]+/g, ' ');
  const subject = rawSubject.replace(/\b\w/g, ch => ch.toUpperCase());
  const verb = word ? PAST[word] : (VERBS[normMethod] || 'Changed');

  if (subject) return `${verb} · ${subject}`;
  return verb;
};

// Module badge metadata helper
export const getModuleInfo = (path = '', endpoint = '', explicitModule = '') => {
  const text = `${explicitModule} ${path} ${endpoint}`.toLowerCase();
  if (text.includes('ai-settings') || text.includes('/api/ai') || text.includes('/mcp') || text.includes('ai assistant') || text.includes('company-ai')) {
    return { name: 'AI Assistant', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' };
  }
  if (text.includes('marketing-ads') || text.includes('marketing ads')) {
    return { name: 'Marketing Ads', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' };
  }
  if (text.includes('telecall')) {
    return { name: 'Telecalling', color: '#c026d3', bg: '#fdf4ff', border: '#fae8ff' };
  }
  if (text.includes('crm') || text.includes('lead')) {
    return { name: 'CRM Leads', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' };
  }
  if (text.includes('project')) {
    return { name: 'Projects', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' };
  }
  if (text.includes('client-plan') || text.includes('client-document') || text.includes('clientsservice') || text.includes('emp-client') || text.includes('client portal') || text.includes('clients & plans')) {
    return { name: 'Clients & Plans', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' };
  }
  if (text.includes('task')) {
    return { name: 'Tasks', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' };
  }
  if (text.includes('attendance') || text.includes('clock') || text.includes('break') || text.includes('week-off') || text.includes('overtime')) {
    return { name: 'Attendance & Breaks', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
  }
  if (text.includes('leave')) {
    return { name: 'Leaves & HR', color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' };
  }
  if (text.includes('payroll') || text.includes('salary') || text.includes('payslip')) {
    return { name: 'Payroll', color: '#0891b2', bg: '#ecfeff', border: '#cffafe' };
  }
  if (text.includes('chat') || text.includes('message')) {
    return { name: 'Team Chat', color: '#0284c7', bg: '#f0f9ff', border: '#e0f2fe' };
  }
  if (text.includes('meeting') || text.includes('cmeeting')) {
    return { name: 'Meetings', color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' };
  }
  if (text.includes('support')) {
    return { name: 'Support Desk', color: '#b45309', bg: '#fef3c7', border: '#fde68a' };
  }
  if (text.includes('asset')) {
    return { name: 'Assets', color: '#334155', bg: '#f1f5f9', border: '#cbd5e1' };
  }
  if (text.includes('dashboard-overview') || text.includes('export-reports') || text.includes('user-activity') || text.includes('analytics')) {
    return { name: 'Dashboard & Reports', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
  }
  if (text.includes('profile') || text.includes('users/me')) {
    return { name: 'Profile', color: '#4f46e5', bg: '#eef2ff', border: '#e0e7ff' };
  }
  if (text.includes('user') || text.includes('employee') || text.includes('staff')) {
    return { name: 'User Management', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
  }
  return { name: explicitModule || 'General', color: '#64748b', bg: '#f8fafc', border: '#f1f5f9' };
};
