export const TELECALLER_BASE = '/ciisUser/telecaller';
export const TELECALLER_PAGES = [
  ['dashboard', 'Dashboard', 'Gauge'],
  ['call-dashboard', 'Call Dashboard', 'Activity'],
  ['assigned-calls', 'My Assigned Calls', 'PhoneIncoming'],
  ['todays-calls', "Today's Calls", 'Phone'],
  ['pending-calls', 'Pending Calls', 'PhoneMissed'],
  ['scheduled-calls', 'Scheduled Calls', 'CalendarClock'],
  ['completed-calls', 'Completed Calls', 'PhoneOutgoing'],
  ['call-history', 'Call History', 'History'],
  ['follow-ups', 'My Follow-Ups', 'CalendarSync'],
  ['converted-leads', 'Converted Leads', 'Trophy'],
  ['call-workspace', 'Call Workspace', 'Mic'],
  ['lead-detail', 'Lead Detail', 'UserCheck'],
  ['add-lead', 'Add Lead', 'UserPlus'],
].map(([slug, name, icon], index) => ({
  slug, name, icon, id: `admin-telecaller-${slug}`, path: `${TELECALLER_BASE}/${slug}`,
  category: 'admin-telecaller', order: 40 + index / 10,
}));

export function hasTelecallerCompanyAccess(page, company) {
  const list = company?.allowedPages;
  if (!Array.isArray(list) || list.length === 0) return true;
  const keys = new Set(list.map(value => String(value).replace(/^\/+/, '').toLowerCase()));
  if (keys.has('telecaller') || keys.has('admin-telecaller') || keys.has('crm')) return true;
  const allowed = p => [p.id, p.path, p.path.replace('/ciisUser/', '')]
    .some(key => keys.has(key.replace(/^\/+/, '').toLowerCase()));
  if (allowed(page)) return true;
  // Add Lead comes with the Call Workspace (same rule as the server).
  const workspace = TELECALLER_PAGES.find(p => p.slug === 'call-workspace');
  return page.slug === 'add-lead' && Boolean(workspace) && allowed(workspace);
}
