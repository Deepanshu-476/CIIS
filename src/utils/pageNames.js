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
  if (text.includes('crm') || text.includes('lead')) {
    return { name: 'CRM Leads', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' };
  }
  if (text.includes('task')) {
    return { name: 'Tasks', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' };
  }
  if (text.includes('attendance') || text.includes('clock')) {
    return { name: 'Attendance', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
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
  if (text.includes('telecall')) {
    return { name: 'Telecalling', color: '#c026d3', bg: '#fdf4ff', border: '#fae8ff' };
  }
  if (text.includes('profile') || text.includes('users/me')) {
    return { name: 'Profile', color: '#4f46e5', bg: '#eef2ff', border: '#e0e7ff' };
  }
  if (text.includes('user') || text.includes('employee') || text.includes('staff')) {
    return { name: 'User Management', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
  }
  return { name: explicitModule || 'General', color: '#64748b', bg: '#f8fafc', border: '#f1f5f9' };
};
