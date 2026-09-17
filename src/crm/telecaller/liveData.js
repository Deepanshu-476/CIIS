export const localDateTime = (value = new Date()) => {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const todayKey = () => localDateTime().slice(0, 10);
export const outcomes = ['Connected', 'Interested', 'Not Interested', 'Need Callback', 'Follow-up', 'Call Later', 'No Answer', 'Busy', 'Switched Off', 'Not Reachable', 'Wrong Number', 'Wrong Person', 'Invalid Number', 'Language Barrier', 'Do Not Call', 'Duplicate', 'Spam', 'Call Closed', 'Converted'];
export const isTerminal = lead => ['Converted', 'Closed'].includes(lead.status);
export const formatDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...(String(value).includes('T') ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}) });
};
export function normalizeLead(item) {
  const calls = [...(item.callHistory || [])].reverse().sort((a, b) => new Date(b.date) - new Date(a.date)).map(call => ({ ...call, leadId: String(item._id), date: localDateTime(call.date), followUp: call.followUp ? localDateTime(call.followUp) : '' }));
  const last = calls.find(call => call.outcome !== 'Note Added');
  return {
    id: String(item._id), name: item.name || 'Unnamed lead', phone: item.phone || '', email: item.email || '', city: item.address || '',
    source: item.leadSource?.name || item.source || '', type: item.leadType?.name || '',
    assigned: localDateTime(item.assignedAt || item.createdAt), createdAt: localDateTime(item.createdAt), assignedTo: item.assignedTo?.name || '',
    status: ({ new: 'Assigned', interested: 'Interested', 'not interested': 'Not Interested', 'follow-up': 'Follow-up', converted: 'Converted', closed: 'Closed' })[item.status] || item.status,
    date: last?.date || '', outcome: last?.outcome || '', notes: last?.notes || item.remarks || '',
    followUp: item.nextFollowUp ? localDateTime(item.nextFollowUp) : '', calls,
  };
}
