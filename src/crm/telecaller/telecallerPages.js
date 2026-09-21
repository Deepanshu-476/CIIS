export const TELECALLER_BASE = '/ciisUser/telecaller';
export const TELECALLER_PAGES = [
  ['dashboard', 'Dashboard', 'Dashboard'],
  ['call-dashboard', 'Call Dashboard', 'Call'],
  ['assigned-calls', 'My Assigned Calls', 'Person'],
  ['todays-calls', "Today's Calls", 'Call'],
  ['pending-calls', 'Pending Calls', 'AccessTime'],
  ['scheduled-calls', 'Scheduled Calls', 'EventNote'],
  ['completed-calls', 'Completed Calls', 'CheckCircle'],
  ['call-history', 'Call History', 'History'],
  ['follow-ups', 'My Follow-Ups', 'EventNote'],
  ['converted-leads', 'Converted Leads', 'CheckCircle'],
  ['call-workspace', 'Call Workspace', 'Call'],
  ['lead-detail', 'Lead Detail', 'Person'],
].map(([slug, name, icon], index) => ({
  slug, name, icon, id: `admin-telecaller-${slug}`, path: `${TELECALLER_BASE}/${slug}`,
  category: 'admin-telecaller', order: 40 + index / 10,
}));

export function hasTelecallerCompanyAccess(page, company) {
  const list = company?.allowedPages;
  if (!Array.isArray(list) || list.length === 0) return true;
  const keys = new Set(list.map(value => String(value).replace(/^\/+/, '').toLowerCase()));
  if (keys.has('telecaller') || keys.has('admin-telecaller') || keys.has('crm')) return true;
  return [page.id, page.path, page.path.replace('/ciisUser/', '')]
    .some(key => keys.has(key.replace(/^\/+/, '').toLowerCase()));
}

