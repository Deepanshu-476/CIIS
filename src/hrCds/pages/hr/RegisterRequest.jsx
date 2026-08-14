import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileText, Inbox, Mail, Paperclip, Power, PowerOff, RefreshCw, Save, Search, Trash2, Upload, UserRoundCheck, Users, X } from 'lucide-react';
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
const verificationKeys = ['Personal Details', 'Company Details', 'Address Details', 'Identity Details', 'Uploaded Documents'];
const fixedOptions = {
  gender: [['', 'Select gender'], ['male', 'Male'], ['female', 'Female'], ['other', 'Other']],
  maritalStatus: [['', 'Select marital status'], ['single', 'Single'], ['married', 'Married'], ['divorced', 'Divorced'], ['widowed', 'Widowed']],
  companyRole: [['', 'Select company role'], ['employee', 'Employee'], ['manager', 'Manager'], ['hr', 'HR'], ['admin', 'Admin'], ['owner', 'Owner']],
  employeeType: [['', 'Select employee type'], ['Full Time', 'Full Time'], ['Part Time', 'Part Time'], ['Contract', 'Contract'], ['Intern', 'Intern'], ['Probation', 'Probation'], ['Work from Home', 'Work from Home']]
};

export default function RegisterRequest() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [processingId, setProcessingId] = useState('');
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [dirtyFields, setDirtyFields] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activationError, setActivationError] = useState('');
  const [verifiedSections, setVerifiedSections] = useState({});
  const [assignmentOptions, setAssignmentOptions] = useState({ branches: [], departments: [], jobRoles: [] });
  const [documentUpload, setDocumentUpload] = useState({ name: '', file: null });
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
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

  const openVerification = async request => {
    setProfile(request);
    setEditForm(Object.fromEntries(profileGroups.flatMap(([, fields]) => fields.map(([key]) => [key, typeof request[key] === 'object' ? request[key]?._id || '' : request[key] || '']))));
    const alreadyVerified = Boolean(request.verificationSections?.find(section => section.key === 'applicationReview')?.verified);
    setVerifiedSections(Object.fromEntries(verificationKeys.map(key => [key, alreadyVerified])));
    setDirtyFields([]);
    setFieldErrors({});
    setActivationError('');
    setDocumentUpload({ name: '', file: null });
    try {
      const response = await axios.get(`/company/self-registration/${request.companyCode}`, { _skipErrorNotify: true, noCache: true });
      setAssignmentOptions({ branches: response.data?.branches || [], departments: response.data?.departments || [], jobRoles: response.data?.jobRoles || [] });
    } catch {
      setAssignmentOptions({ branches: request.branch ? [request.branch] : [], departments: request.department ? [request.department] : [], jobRoles: request.jobRole ? [{ _id: request.jobRole, name: getJobRoleName(request) }] : [] });
    }
  };

  const allSectionsVerified = verificationKeys.every(key => verifiedSections[key]);
  const toggleSectionVerification = title => setVerifiedSections(current => ({ ...current, [title]: !current[title] }));
  const updateVerificationField = (title, key, value) => {
    setEditForm(current => ({ ...current, [key]: value }));
    setDirtyFields(current => current.includes(key) ? current : [...current, key]);
    setFieldErrors(current => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setActivationError('');
    setVerifiedSections(current => ({ ...current, [title]: false }));
  };

  const validateActivationForm = () => {
    const errors = {};
    if (!String(editForm.name || '').trim()) errors.name = 'Full name is required.';
    const email = String(editForm.email || '').trim();
    if (!email) errors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (!editForm.department) errors.department = 'Department is required.';
    if (!editForm.jobRole) errors.jobRole = 'Job role is required.';
    if (editForm.pinCode && !/^\d{6}$/.test(String(editForm.pinCode).trim())) errors.pinCode = 'PIN code must contain exactly 6 digits.';
    if (editForm.aadharCard && !/^\d{12}$/.test(String(editForm.aadharCard).trim())) errors.aadharCard = 'Aadhar number must contain exactly 12 digits.';
    if (editForm.panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(String(editForm.panCard).trim())) errors.panCard = 'Enter a valid PAN number (for example ABCDE1234F).';
    return errors;
  };

  const fieldErrorsFromApi = message => {
    const text = String(message || '').toLowerCase();
    const mappings = [
      ['name', ['name']], ['email', ['email']], ['phone', ['phone']], ['dob', ['date of birth', 'dob']],
      ['branch', ['branch']], ['department', ['department']], ['jobRole', ['job role', 'jobrole']],
      ['dateOfJoining', ['joining']], ['pinCode', ['pin code', 'pincode']], ['aadharCard', ['aadhar']],
      ['panCard', ['pan number', 'pan card', 'pancard']], ['gender', ['gender']], ['maritalStatus', ['marital']]
    ];
    return Object.fromEntries(mappings.filter(([, terms]) => terms.some(term => text.includes(term))).map(([key]) => [key, message]));
  };

  const renderVerificationField = (title, key, label, type) => {
    const readOnlyValues = {
      company: getName(profile.company) || 'Not provided',
      companyCode: profile.companyCode || 'Not provided'
    };
    if (Object.prototype.hasOwnProperty.call(readOnlyValues, key)) {
      return <label className="RegisterRequest-edit-field readonly" key={key}><span>{label}</span><div>{readOnlyValues[key]}</div></label>;
    }
    const linkedOptions = key === 'branch' ? assignmentOptions.branches : key === 'department' ? assignmentOptions.departments : key === 'jobRole' ? assignmentOptions.jobRoles : null;
    const options = fixedOptions[key] || linkedOptions?.map(item => [String(item._id || item.id || ''), item.name || item.companyName || 'Unnamed']);
    if (options) {
      return <label className={`RegisterRequest-edit-field ${fieldErrors[key] ? 'invalid' : ''}`} key={key}><span>{label}</span><select value={editForm[key] || ''} onChange={event => updateVerificationField(title, key, event.target.value)} aria-invalid={Boolean(fieldErrors[key])}>{!fixedOptions[key] && <option value="">Select {label.toLowerCase()}</option>}{options.map(([value, text]) => <option key={`${key}-${value}`} value={value}>{text}</option>)}</select>{fieldErrors[key] && <small>{fieldErrors[key]}</small>}</label>;
    }
    return <label className={`RegisterRequest-edit-field ${fieldErrors[key] ? 'invalid' : ''}`} key={key}><span>{label}</span><input type={type === 'date' ? 'date' : key === 'email' ? 'email' : 'text'} value={type === 'date' && editForm[key] ? String(editForm[key]).slice(0,10) : editForm[key] || ''} onChange={event => updateVerificationField(title, key, event.target.value)} aria-invalid={Boolean(fieldErrors[key])} />{fieldErrors[key] && <small>{fieldErrors[key]}</small>}</label>;
  };

  const uploadVerificationDocument = async () => {
    if (!documentUpload.file) return toast.error('Please select a document file');
    if (!documentUpload.name.trim()) return toast.error('Please enter the document name');
    setUploadingDocument(true);
    try {
      const data = new FormData();
      data.append('name', documentUpload.name.trim());
      data.append('document', documentUpload.file);
      await axios.post(`/users/${profile._id}/documents`, data, { _skipErrorNotify: true });
      const documentResponse = await axios.get(`/users/${profile._id}/documents`, { noCache: true, _skipRequestCache: true });
      const documents = documentResponse.data?.documents || [];
      const updated = { ...profile, documents };
      setProfile(updated);
      replaceRequest(updated);
      setDocumentUpload({ name: '', file: null });
      setVerifiedSections(current => ({ ...current, 'Uploaded Documents': false }));
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to upload document'));
    } finally {
      setUploadingDocument(false);
    }
  };

  const viewVerificationDocument = async document => {
    setPreviewLoading(true);
    try {
      const response = await axios.get(`/users/${profile._id}/documents/${document._id}/view`, { responseType: 'blob', _skipErrorNotify: true });
      const blobUrl = URL.createObjectURL(response.data);
      setDocumentPreview(current => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return { url: blobUrl, name: document.name || 'Document preview', type: response.data.type || document.type || '' };
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to open document'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const closeDocumentPreview = () => {
    setDocumentPreview(current => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const deleteVerificationDocument = async document => {
    if (!window.confirm(`Delete "${document.name}"?`)) return;
    try {
      await axios.delete(`/users/${profile._id}/documents/${document._id}`, { _skipErrorNotify: true });
      const documentResponse = await axios.get(`/users/${profile._id}/documents`, { noCache: true, _skipRequestCache: true });
      const updated = { ...profile, documents: documentResponse.data?.documents || [] };
      setProfile(updated);
      replaceRequest(updated);
      setVerifiedSections(current => ({ ...current, 'Uploaded Documents': false }));
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete document'));
    }
  };

  const saveVerificationDetails = async () => {
    if (!dirtyFields.length) return profile;
    const updatePayload = Object.fromEntries(dirtyFields
      .filter(key => editForm[key] !== '' && editForm[key] !== null && editForm[key] !== undefined)
      .map(key => [key, editForm[key]]));
    if (!Object.keys(updatePayload).length) return profile;
    const response = await axios.put(`/users/register-requests/${profile._id}`, updatePayload);
    const updated = response.data?.data?.request || response.data?.request;
    if (updated) {
      replaceRequest(updated);
      setProfile(updated);
      setDirtyFields([]);
    }
    return updated || profile;
  };

  const activateVerifiedUser = async () => {
    const validationErrors = validateActivationForm();
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setActivationError('Please correct the highlighted fields before activating this user.');
      toast.error('Please correct the highlighted fields');
      return;
    }
    if (!allSectionsVerified) {
      setActivationError('Please verify every section before activating this user.');
      toast.error('Please verify every section before activating this user');
      return;
    }
    const formSnapshot = { ...editForm };
    const verificationSnapshot = { ...verifiedSections };
    const profileSnapshot = profile;
    const dirtyFieldsSnapshot = [...dirtyFields];
    setProcessingId(profile._id);
    let activationStage = 'saving edited details';
    try {
      let updated = await saveVerificationDetails();
      activationStage = 'verifying the application';
      const verifyResponse = await axios.patch(`/users/register-requests/${profile._id}/verify-section`, { sectionKey: 'applicationReview', verified: true });
      updated = verifyResponse.data?.data?.request || verifyResponse.data?.request || updated;
      activationStage = 'activating the account';
      const activateResponse = await axios.patch(`/users/register-requests/${profile._id}/activate`);
      updated = activateResponse.data?.data?.request || activateResponse.data?.request || updated;
      replaceRequest(updated);
      setFieldErrors({});
      setActivationError('');
      setProfile(null);
      toast.success('User details verified and account activated successfully');
    } catch (error) {
      setEditForm(formSnapshot);
      setDirtyFields(dirtyFieldsSnapshot);
      setVerifiedSections(verificationSnapshot);
      setProfile(current => current || profileSnapshot);
      const message = getErrorMessage(error, 'Failed to verify and activate user');
      setFieldErrors(fieldErrorsFromApi(message));
      setActivationError(`${message} (${activationStage})`);
      toast.error(`${message} (${activationStage})`);
    } finally {
      setProcessingId('');
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await axios.get('/users/register-requests', {
        params: { status: 'all' }, cache: false, noCache: true, _skipRequestCache: true, _skipErrorNotify: true
      });
      setRequests(response.data?.data?.requests || response.data?.requests || []);
      setCanVerify(Boolean(response.data?.data?.canVerify ?? response.data?.canVerify));
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load registration requests');
      toast.error(message);
      setLoadError(message);
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
                      {status === 'pending'
                        ? <button className="approve" type="button" onClick={() => openVerification(request)} disabled={!canVerify || busy}><Power size={16} /> Activate</button>
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
          {loading && <div className="RegisterRequest-loading" aria-live="polite"><span /><span /><span /><p>Loading registration requests...</p></div>}
          {!loading && loadError && <div className="RegisterRequest-empty error"><Users size={34} /><strong>Unable to load requests</strong><span>{loadError}</span><button type="button" onClick={loadRequests}><RefreshCw size={16} /> Try Again</button></div>}
          {!loading && !loadError && !filteredRequests.length && <div className="RegisterRequest-empty"><Users size={34} /><strong>No matching requests</strong><span>Registration requests for this company will appear here.</span></div>}
        </div>
      </section>

      {profile && <div className="RegisterRequest-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setProfile(null)}>
        <article className="RegisterRequest-modal" role="dialog" aria-modal="true" aria-label="Applicant profile">
          <header><div className="RegisterRequest-profile-title"><span>{(profile.name || 'U').charAt(0).toUpperCase()}</span><div><h2>{profile.name}</h2><p>{profile.email}</p></div></div><button type="button" onClick={() => setProfile(null)} aria-label="Close profile"><X /></button></header>
          <div className="RegisterRequest-modal-content">
            <div className="RegisterRequest-profile-meta"><span className={`RegisterRequest-status ${getStatus(profile)}`}>{getStatus(profile) === 'active' ? 'Activated' : 'Pending'}</span><span><Building2 size={16} />{getName(profile.company) || profile.companyCode}</span><span><CalendarDays size={16} />Registered {formatDate(profile.createdAt)}</span></div>
            {activationError && <div className="RegisterRequest-activation-error" role="alert"><strong>Unable to activate user</strong><span>{activationError}</span></div>}
            {profileGroups.map(([title, fields]) => <section className={verifiedSections[title] ? 'verified' : ''} key={title}><div className="RegisterRequest-section-heading"><h3>{title}</h3><label><input type="checkbox" checked={Boolean(verifiedSections[title])} onChange={() => toggleSectionVerification(title)} />{verifiedSections[title] ? <span className="verified"><CheckCircle2 size={14} /> Verified</span> : <span>Verify</span>}</label></div><div>{fields.map(([key, label, type]) => renderVerificationField(title, key, label, type))}</div></section>)}
            <section className={`RegisterRequest-documents-section ${verifiedSections['Uploaded Documents'] ? 'verified' : ''}`}><div className="RegisterRequest-section-heading"><h3><FileText size={18} /> Uploaded Documents</h3><label><input type="checkbox" checked={Boolean(verifiedSections['Uploaded Documents'])} onChange={() => toggleSectionVerification('Uploaded Documents')} />{verifiedSections['Uploaded Documents'] ? <span className="verified"><CheckCircle2 size={14} /> Verified</span> : <span>Verify</span>}</label></div><div className="RegisterRequest-profile-docs">{(profile.documents || []).map(doc => <article key={doc._id}><span><FileText size={18} /></span><div><strong>{doc.name}</strong><small>{doc.type || 'Document'}</small></div><div className="RegisterRequest-document-actions"><button type="button" className="view" onClick={() => viewVerificationDocument(doc)}><Eye size={14} /> View</button><button type="button" className="delete" onClick={() => deleteVerificationDocument(doc)}><Trash2 size={14} aria-hidden="true" /><span className="sr-only">Delete {doc.name}</span></button></div></article>)}{!profile.documents?.length && <div className="RegisterRequest-no-documents"><Paperclip size={22} /><span>No documents uploaded yet</span></div>}</div><div className="RegisterRequest-document-upload"><div className="RegisterRequest-upload-title"><Upload size={18} /><span><strong>Add another document</strong><small>PDF, image or office file — maximum 25 MB</small></span></div><label><span>Document name</span><input type="text" value={documentUpload.name} onChange={event => setDocumentUpload(current => ({ ...current, name: event.target.value }))} placeholder="e.g. Address proof" /></label><label className="RegisterRequest-file-picker"><span>Choose file</span><input type="file" id="register-request-document" onChange={event => setDocumentUpload(current => ({ ...current, file: event.target.files?.[0] || null }))} /><div><Paperclip size={15} />{documentUpload.file?.name || 'Select a file'}</div></label><button type="button" onClick={uploadVerificationDocument} disabled={uploadingDocument}><Upload size={15} />{uploadingDocument ? 'Uploading...' : 'Upload Document'}</button></div></section>
          </div>
          <footer className="RegisterRequest-verification-footer">{getStatus(profile) === 'pending' ? <><span>{verificationKeys.filter(key => verifiedSections[key]).length} of {verificationKeys.length} sections verified</span><button className="approve" type="button" onClick={activateVerifiedUser} disabled={!canVerify || processingId || !allSectionsVerified}><Save size={17} /> {processingId ? 'Activating...' : 'Activate User'}</button></> : <button className="reject" type="button" onClick={() => changeUserStatus(profile, false)} disabled={!canVerify || processingId}><PowerOff size={17} /> Make Inactive</button>}</footer>
        </article>
      </div>}
      {documentPreview && <div className="RegisterRequest-preview-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && closeDocumentPreview()}>
        <article className="RegisterRequest-preview-modal" role="dialog" aria-modal="true" aria-label={`Preview ${documentPreview.name}`}>
          <header><div><FileText size={19} /><strong>{documentPreview.name}</strong></div><button type="button" onClick={closeDocumentPreview} aria-label="Close document preview"><X size={20} /></button></header>
          <div className="RegisterRequest-preview-content">
            {documentPreview.type.startsWith('image/')
              ? <img src={documentPreview.url} alt={documentPreview.name} />
              : documentPreview.type === 'application/pdf'
                ? <iframe src={documentPreview.url} title={documentPreview.name} />
                : <div className="RegisterRequest-preview-unsupported"><FileText size={42} /><strong>Preview is not available for this file type.</strong><span>You can delete it and upload an image or PDF instead.</span></div>}
          </div>
        </article>
      </div>}
    </div>
  );
}
