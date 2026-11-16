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

export const describeAction = (method, endpoint) => {
  const parts = segments(endpoint).filter(part => part !== 'api' && !part.startsWith(':'));
  const word = [...parts].reverse().find(part => ACTION_WORDS.includes(part));
  const subject = parts.filter(part => part !== word).slice(0, 2).join(' / ').replace(/[-_]+/g, ' ');
  const verb = word ? PAST[word] : (VERBS[String(method || '').toUpperCase()] || 'Changed');
  return subject ? `${verb} · ${subject}` : verb;
};
