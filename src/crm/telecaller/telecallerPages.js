export const TELECALLER_BASE = '/ciisUser/telecaller';
export const TELECALLER_PAGES = [
  ['dashboard', 'Dashboard', 'Dashboard'],
  ['call-dashboard', 'Call Dashboard', 'CallOverview'],
  ['assigned-calls', 'My Assigned Calls', 'AssignedCalls'],
  ['todays-calls', "Today's Calls", 'TodaysCalls'],
  ['pending-calls', 'Pending Calls', 'PendingCalls'],
  ['scheduled-calls', 'Scheduled Calls', 'ScheduledCalls'],
  ['completed-calls', 'Completed Calls', 'CompletedCalls'],
  ['call-history', 'Call History', 'CallHistory'],
  ['follow-ups', 'My Follow-Ups', 'EventRepeat'],
  ['converted-leads', 'Converted Leads', 'ConvertedCalls'],
  ['call-workspace', 'Call Workspace', 'SupportAgent'],
  ['lead-detail', 'Lead Detail', 'ContactPage'],
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
