import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileText, Inbox, Mail, Power, PowerOff, RefreshCw, Search, UserRoundCheck, Users, X } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../../../utils/axiosConfig';
import './RegisterRequest.css';

const getName = value => {
  if (!value) return '';
  if (typeof value === 'object') return value.name || value.companyName || value.companyCode || '';
  return String(value);
};

const formatDate = value => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatus = request => request.registrationStatus || (request.isActive ? 'active' : 'pending');
const getJobRoleName = request => request.jobRoleName || getName(request.jobRole) || request.companyRole || 'Unassigned Role';
const getDepartmentName = request => request.departmentName || getName(request.department) || 'Not provided';
const getErrorMessage = (error, fallback) => error.response?.data?.message || error.response?.data?.error || fallback;

const profileGroups = [
  ['Personal Details', [['name', 'Full Name'], ['email', 'Email'], ['phone', 'Phone'], ['dob', 'Date of Birth', 'date'], ['gender', 'Gender'], ['maritalStatus', 'Marital Status']]],
  ['Company Details', [['company', 'Company', 'name'], ['companyCode', 'Company Code'], ['branch', 'Branch', 'name'], ['department', 'Department', 'name'], ['jobRole', 'Job Role', 'name'], ['companyRole', 'Company Role'], ['employeeType', 'Employee Type'], ['dateOfJoining', 'Date of Joining', 'date']]],
  ['Address Details', [['address', 'Address'], ['city', 'City'], ['state', 'State'], ['pinCode', 'Pin Code'], ['country', 'Country']]],
  ['Identity Details', [['aadharCard', 'Aadhar Number'], ['panCard', 'PAN Number']]]
];

export default function RegisterRequest() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [profile, setProfile] = useState(null);
  const [canVerify, setCanVerify] = useState(false);

  const statusCounts = useMemo(() => requests.reduce((counts, request) => {
    const status = getStatus(request);
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, { pending: 0, active: 0, rejected: 0 }), [requests]);

  const jobRoleOptions = useMemo(() => [...new Set(requests.map(request => (
    getJobRoleName(request)
  )))].sort((first, second) => first.localeCompare(second)), [requests]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter(request => {
      const searchable = `${request.name || ''} ${request.email || ''} ${request.companyCode || ''} ${getName(request.company)}`.toLowerCase();
      const role = getJobRoleName(request);
      const matchesStatus = statusFilter === 'all'
        ? ['pending', 'active'].includes(getStatus(request))
        : getStatus(request) === statusFilter;
      return matchesStatus && (roleFilter === 'all' || role === roleFilter) && (!term || searchable.includes(term));
    });
  }, [requests, search, statusFilter, roleFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const visibleRequests = useMemo(() => filteredRequests.slice((page - 1) * pageSize, page * pageSize), [filteredRequests, page]);

  useEffect(() => { setPage(1); }, [search, statusFilter, roleFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const replaceRequest = request => setRequests(current => current.map(item => String(item._id) === String(request._id) ? { ...item, ...request, jobRoleName: request.jobRoleName || item.jobRoleName } : item));

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/users/register-requests', {
        params: { status: 'all' }, cache: false, noCache: true, _skipRequestCache: true, _skipErrorNotify: true
      });
      setRequests(response.data?.data?.requests || response.data?.requests || []);
      setCanVerify(Boolean(response.data?.data?.canVerify ?? response.data?.canVerify));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load registration requests'));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const changeUserStatus = async (request, isActive) => {
    if (!window.confirm(`${isActive ? 'Activate' : 'Deactivate'} ${request.name}'s account?`)) return;
    setProcessingId(request._id);
    try {
      const response = await axios.patch(`/users/register-requests/${request._id}/status`, { isActive });
      const updated = response.data?.data?.request || response.data?.request;
      if (updated) replaceRequest(updated);
      setProfile(current => String(current?._id) === String(request._id) ? updated : current);
      toast.success(isActive ? 'User activated successfully' : 'User made inactive');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update user status'));
    } finally {
      setProcessingId('');
    }
  };

  const documentBaseUrl = String(axios.defaults.baseURL || '').replace(/\/$/, '');

  return (
    <div className="RegisterRequest-page">
      <header className="RegisterRequest-header">
        <div className="RegisterRequest-heading">
          <div className="RegisterRequest-heading-icon"><UserRoundCheck size={38} /></div>
          <div><p>Employee Onboarding</p><h1>Registration Requests</h1><span>Review, verify and manage employee applications for your company.</span></div>
        </div>
        <button type="button" onClick={loadRequests} disabled={loading}><RefreshCw size={18} /> Refresh</button>
      </header>

      <section className="RegisterRequest-status-tabs">
        {[["all", "All Requests", Inbox], ["pending", "Pending", Clock3], ["active", "Activated", CheckCircle2]].map(([status, label, Icon]) => (
          <button type="button" key={status} className={statusFilter === status ? `active ${status}` : status} onClick={() => setStatusFilter(status)}>
            <span><Icon size={21} />{label}</span><strong>{status === 'all' ? statusCounts.pending + statusCounts.active : statusCounts[status]}</strong>
          </button>
        ))}
      </section>

      <section className="RegisterRequest-board">
        <div className="RegisterRequest-toolbar">
          <div><h2>{statusFilter === 'all' ? 'All Registration Requests' : statusFilter === 'active' ? 'Activated Users' : 'Pending Requests'}</h2><p>{filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'} found</p></div>
          <div className="RegisterRequest-filters">
            <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} aria-label="Filter by job role">
              <option value="all">All Job Roles</option>
              {jobRoleOptions.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <label><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or email" /></label>
          </div>
        </div>

        <div className="RegisterRequest-role-sections">
        {!loading && <section className="RegisterRequest-role-section">
        <div className="RegisterRequest-table-wrap">
          <table className="RegisterRequest-table">
            <thead><tr><th>Applicant</th><th>Company</th><th>Applied On</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleRequests.map(request => {
                const status = getStatus(request);
                const busy = String(processingId) === String(request._id);
                return (
                  <tr key={request._id}>
                    <td data-label="Applicant"><div className="RegisterRequest-applicant"><span>{(request.name || 'U').charAt(0).toUpperCase()}</span><div><strong>{request.name || 'Unnamed User'}</strong><small><Mail size={13} />{request.email}</small></div></div></td>
                    <td data-label="Company"><strong>{getName(request.company) || 'Company'}</strong><small>{request.companyCode || 'No company code'}</small></td>
                    <td data-label="Applied On">{formatDate(request.createdAt)}</td>
                    <td data-label="Status"><span className={`RegisterRequest-status ${status}`}>{status === 'active' ? 'Activated' : 'Pending'}</span></td>
                    <td data-label="Actions"><div className="RegisterRequest-row-actions">
                      <button className="view" type="button" onClick={() => setProfile(request)}><Eye size={16} /> View Profile</button>
                      {status === 'pending'
                        ? <button className="approve" type="button" onClick={() => changeUserStatus(request, true)} disabled={!canVerify || busy}><Power size={16} /> Activate</button>
                        : <button className="reject" type="button" onClick={() => changeUserStatus(request, false)} disabled={!canVerify || busy}><PowerOff size={16} /> Deactivate</button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </section>}
          {!loading && filteredRequests.length > 0 && <div className="RegisterRequest-result-count"><span>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredRequests.length)} of {filteredRequests.length} applications</span><div><button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button><span>{page} / {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage(current => current + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div></div>}
          {loading && <div className="RegisterRequest-empty">Loading users...</div>}
          {!loading && !filteredRequests.length && <div className="RegisterRequest-empty"><Users size={34} /><strong>No matching requests</strong><span>Registration requests for this company will appear here.</span></div>}
        </div>
      </section>

      {profile && <div className="RegisterRequest-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setProfile(null)}>
        <article className="RegisterRequest-modal" role="dialog" aria-modal="true" aria-label="Applicant profile">
          <header><div className="RegisterRequest-profile-title"><span>{(profile.name || 'U').charAt(0).toUpperCase()}</span><div><h2>{profile.name}</h2><p>{profile.email}</p></div></div><button type="button" onClick={() => setProfile(null)} aria-label="Close profile"><X /></button></header>
          <div className="RegisterRequest-modal-content">
            <div className="RegisterRequest-profile-meta"><span className={`RegisterRequest-status ${getStatus(profile)}`}>{getStatus(profile) === 'active' ? 'Activated' : 'Pending'}</span><span><Building2 size={16} />{getName(profile.company) || profile.companyCode}</span><span><CalendarDays size={16} />Registered {formatDate(profile.createdAt)}</span></div>
            {profileGroups.map(([title, fields]) => <section key={title}><h3>{title}</h3><div>{fields.map(([key, label, type]) => <dl key={key}><dt>{label}</dt><dd>{key === 'jobRole' ? getJobRoleName(profile) : key === 'department' ? getDepartmentName(profile) : type === 'date' ? formatDate(profile[key]) : type === 'name' ? getName(profile[key]) || 'Not provided' : profile[key] || 'Not provided'}</dd></dl>)}</div></section>)}
            <section><h3><FileText size={18} /> Uploaded Documents</h3><div className="RegisterRequest-profile-docs">{(profile.documents || []).map(doc => <a key={doc._id} href={`${documentBaseUrl}${doc.viewUrl}`} target="_blank" rel="noreferrer">{doc.name}</a>)}{!profile.documents?.length && <span>No documents uploaded</span>}</div></section>
          </div>
          <footer>{getStatus(profile) === 'pending' ? <button className="approve" type="button" onClick={() => changeUserStatus(profile, true)} disabled={!canVerify || processingId}><Power size={17} /> Make Active</button> : <button className="reject" type="button" onClick={() => changeUserStatus(profile, false)} disabled={!canVerify || processingId}><PowerOff size={17} /> Make Inactive</button>}</footer>
        </article>
      </div>}
    </div>
  );
}
