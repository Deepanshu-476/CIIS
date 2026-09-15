import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiUpload,
  FiPlusCircle,
  FiEye,
  FiUser,
  FiCalendar,
  FiX,
  FiPhone,
  FiMail,
  FiMapPin,
  FiTag,
  FiFileText,
  FiClock,
  FiUserCheck,
  FiCheckCircle
} from 'react-icons/fi';
import './AllLeads.css';
import api from '../../utils/axiosConfig';

export default function AllLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);

  // Assignment Modal State
  const [assignModalLead, setAssignModalLead] = useState(null);
  const [assignTargetUserId, setAssignTargetUserId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/crm/leads', {cache:false}).then(({data}) => {
      if(active) setLeads(data.items.map(item => ({...item, id:item._id, leadId: item._id ? `#LD-${String(item._id).slice(-6).toUpperCase()}` : '#LD-000', note:item.remarks || '',
        source:item.leadSource?.name || item.source || '-', type:item.leadType?.name || '-',
        status: item.status ? item.status.charAt(0).toUpperCase()+item.status.slice(1) : 'New',
        assignedTo:item.assignedTo?.name || 'Unassigned',
        assignedDate: (item.assignedTo && item.assignedAt) ? new Date(item.assignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        assignedAge:'-'})));
    }).catch(err => {if(active) setError(err.response?.data?.message || 'Could not load leads. Please refresh to retry.');})
      .finally(() => {if(active) setLoading(false);});

    api.get('/crm/leads/team', {cache:false}).then(({data}) => {
      if(active && data.users) setTeamMembers(data.users);
    }).catch(() => {});

    return () => {active=false;};
  }, []);

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignModalLead || assignLoading) return;

    setAssignLoading(true);
    setAssignError('');
    try {
      const payload = {
        userId: assignTargetUserId === 'unassign' ? null : assignTargetUserId
      };
      const res = await api.put(`/crm/leads/${assignModalLead.id}/assign`, payload);
      const updatedItem = res.data.item;

      const newAssignedTo = updatedItem.assignedTo?.name || 'Unassigned';
      const newAssignedDate = updatedItem.assignedAt
        ? new Date(updatedItem.assignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';

      setLeads(prev => prev.map(l => l.id === assignModalLead.id ? {
        ...l,
        assignedTo: newAssignedTo,
        assignedDate: newAssignedDate
      } : l));

      if (selectedLead && selectedLead.id === assignModalLead.id) {
        setSelectedLead(prev => ({
          ...prev,
          assignedTo: newAssignedTo,
          assignedDate: newAssignedDate
        }));
      }

      setAssignModalLead(null);
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to update assignment. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);

  // Filters state
  const [filterAssignedTo, setFilterAssignedTo] = useState('All Users');
  const [filterSource, setFilterSource] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.note.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource = !filterSource || lead.source === filterSource;
      const matchesType = !filterType || lead.type === filterType;

      return matchesSearch && matchesSource && matchesType && (filterAssignedTo === 'All Users' || lead.assignedTo === filterAssignedTo) && (!filterDateFrom || lead.leadDate >= filterDateFrom) && (!filterDateTo || lead.leadDate <= filterDateTo);
    });
  }, [leads, searchTerm, filterSource, filterType, filterAssignedTo, filterDateFrom, filterDateTo]);

  const totalEntries = filteredLeads.length;
  const pages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const page = Math.min(currentPage, pages);
  const start = (page-1)*entriesPerPage;
  const visible = filteredLeads.slice(start, start+entriesPerPage);
  useEffect(() => {setCurrentPage(1);}, [searchTerm, filterSource, filterType, filterAssignedTo, filterDateFrom, filterDateTo, entriesPerPage]);

  const handleResetFilters = () => {
    setFilterAssignedTo('All Users');
    setFilterSource('');
    setFilterType('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  };

  return (
    <div className="al-root">
      {/* Header & Breadcrumbs */}
      <header className="al-header">
        <h1>All Leads</h1>
        <nav aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={12} className="al-crumb-arrow" />
          <Link to="/ciisUser/crm/admin/lead-overview">Leads</Link>
          <FiChevronRight size={12} className="al-crumb-arrow" />
          <span>All Leads</span>
        </nav>
      </header>

      {/* Top Filter Card */}
      <section className="al-card al-filter-card">
        <div className="al-filter-grid">
          <div className="al-field">
            <label>Assigned To</label>
            <select
              value={filterAssignedTo}
              onChange={(e) => setFilterAssignedTo(e.target.value)}
              className="al-select"
            >
              <option value="All Users">All Users</option>
              {[...new Set(leads.map(lead => lead.assignedTo))].filter(value => value !== 'Unassigned').map(value => <option key={value} value={value}>{value}</option>)}
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          <div className="al-field">
            <label>Source</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="al-select"
            >
              <option value="">Select Lead Source</option>
              {[...new Set(leads.map(lead => lead.source))].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          <div className="al-field">
            <label>Lead Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="al-select"
            >
              <option value="">Select Lead Type</option>
              {[...new Set(leads.map(lead => lead.type))].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          <div className="al-field">
            <label>Date From</label>
            <input
              type="date"
              placeholder="DD-MM-YYYY"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="al-input"
            />
          </div>

          <div className="al-field">
            <label>Date To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="al-input"
            />
          </div>

          <div className="al-field-actions">
            <button className="al-btn-apply" onClick={() => setCurrentPage(1)}>
              <FiFilter size={14} /> Apply
            </button>
            <button
              className="al-btn-reset"
              onClick={handleResetFilters}
              title="Reset Filters"
            >
              <FiRotateCcw size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="al-card al-table-card">
        {/* Card Top Title & Buttons */}
        <div className="al-table-header">
          <h2>All Leads</h2>
          <div className="al-header-btns">
            <Link
              to="/ciisUser/crm/admin/import-export-leads"
              className="al-btn-import"
            >
              <FiUpload size={14} /> Import Leads
            </Link>
            <Link to="/ciisUser/crm/admin/add-lead" className="al-btn-add">
              <FiPlusCircle size={14} /> Add Lead
            </Link>
          </div>
        </div>

        {/* Table Controls (Per Page & Search) */}
        <div className="al-table-controls">
          <div className="al-entries-control">
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="al-entries-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="al-search-control">
            <label>Search:</label>
            <div className="al-search-box">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="al-table-wrapper">
          <table className="al-table">
            <thead>
              <tr>
                <th>SL NO. <span className="al-sort">↕</span></th>
                <th>LEAD ID <span className="al-sort">↕</span></th>
                <th>LEAD</th>
                <th>PHONE</th>
                <th>SOURCE</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th>ASSIGNED TO</th>
                <th>ASSIGNED DATE</th>
                <th>ASSIGNED AGE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {!visible.length && <tr><td colSpan={11} role="status">{loading ? 'Loading leads...' : error || 'No leads found.'}</td></tr>}
              {visible.map((item, index) => (
                <tr key={item.id}>
                  <td className="al-td-sl">
                    <span className="al-sl-indicator" />
                    {start+index+1}
                  </td>
                  <td className="al-td-leadid">{item.leadId}</td>
                  <td className="al-td-lead">
                    <strong>{item.name}</strong>
                    <span className="al-lead-note">{item.note}</span>
                  </td>
                  <td className="al-td-phone">{item.phone}</td>
                  <td>
                    <span
                      className={`al-badge al-badge-source-${item.source === 'Self' ? 'purple' : 'blue'}`}
                    >
                      {item.source}
                    </span>
                  </td>
                  <td>
                    <span className="al-badge al-badge-type-green">
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`al-badge al-badge-status-${item.status === 'Interested' ? 'mint' : 'blue'}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="al-td-assigned">
                    {item.assignedTo !== '-' ? (
                      <span className="al-assigned-pill">
                        <FiUser size={12} /> {item.assignedTo}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="al-td-date">
                    {item.assignedDate !== '-' ? (
                      <span className="al-date-pill">
                        <FiCalendar size={12} /> {item.assignedDate}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="al-td-age">
                    {item.assignedAge !== '-' ? (
                      <span className="al-age-txt">{item.assignedAge}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="al-td-action">
                    <div className="al-action-group">
                      <button
                        className="al-btn-eye"
                        onClick={() => setSelectedLead(item)}
                        title="View Lead Details"
                      >
                        <FiEye size={14} />
                      </button>
                      <button
                        className="al-btn-assign"
                        onClick={() => {
                          setAssignModalLead(item);
                          setAssignTargetUserId(item.assignedTo && item.assignedTo !== 'Unassigned' ? (teamMembers.find(u => u.name === item.assignedTo)?._id || '') : '');
                          setAssignError('');
                        }}
                        title={item.assignedTo && item.assignedTo !== 'Unassigned' ? "Reassign / Unassign Lead" : "Assign Lead"}
                      >
                        <FiUserCheck size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Counter & Pagination */}
        <div className="al-table-footer">
          <div className="al-counter-txt">
            Showing {totalEntries ? start+1 : 0} to {Math.min(start+entriesPerPage,totalEntries)} of {totalEntries} entries
          </div>
          <div className="al-pagination">
            <button className="al-pg-btn" disabled={page===1} onClick={()=>setCurrentPage(1)} aria-label="First page">&laquo;</button>
            <button className="al-pg-btn" disabled={page===1} onClick={()=>setCurrentPage(page-1)} aria-label="Previous page">&lsaquo;</button>
            <span>{page} / {pages}</span>
            <button className="al-pg-btn" disabled={page===pages} onClick={()=>setCurrentPage(page+1)} aria-label="Next page">&rsaquo;</button>
            <button className="al-pg-btn" disabled={page===pages} onClick={()=>setCurrentPage(pages)} aria-label="Last page">&raquo;</button>
          </div>
        </div>
      </section>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="al-modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="al-modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="al-modal-header">
              <div className="al-modal-title-box">
                <span className="al-modal-lead-badge">{selectedLead.leadId}</span>
                <h3>Lead Details</h3>
              </div>
              <button
                className="al-modal-close"
                onClick={() => setSelectedLead(null)}
                aria-label="Close modal"
              >
                <FiX size={18} />
              </button>
            </header>

            <div className="al-modal-body">
              {/* Hero Profile Box */}
              <div className="al-modal-hero">
                <div className="al-modal-avatar">
                  <FiUser size={22} />
                </div>
                <div className="al-modal-hero-info">
                  <h4 className="al-modal-name">{selectedLead.name}</h4>
                  <div className="al-modal-badges">
                    <span className="al-badge al-badge-status-mint">{selectedLead.status}</span>
                    <span className="al-badge al-badge-type-green">{selectedLead.type}</span>
                    <span className="al-badge al-badge-source-purple">{selectedLead.source ? (selectedLead.source.charAt(0).toUpperCase() + selectedLead.source.slice(1).toLowerCase()) : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information Bar */}
              <div className="al-modal-contact-bar">
                {selectedLead.phone && (
                  <a href={`tel:${selectedLead.phone}`} className="al-modal-contact-item">
                    <FiPhone size={14} className="text-indigo" />
                    <span>{selectedLead.phone}</span>
                  </a>
                )}
                {selectedLead.email && (
                  <a href={`mailto:${selectedLead.email}`} className="al-modal-contact-item">
                    <FiMail size={14} className="text-indigo" />
                    <span>{selectedLead.email}</span>
                  </a>
                )}
              </div>

              {/* Information Grid */}
              <div className="al-modal-section-title">
                <FiTag size={13} />
                <span>LEAD INFORMATION</span>
              </div>
              <div className="al-modal-grid">
                <div className="al-modal-info-item">
                  <label>Gender:</label>
                  <span>{selectedLead.gender || 'Not Specified'}</span>
                </div>
                <div className="al-modal-info-item">
                  <label>Lead Date:</label>
                  <span><FiCalendar size={12} /> {selectedLead.leadDate ? (new Date(selectedLead.leadDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })) : '-'}</span>
                </div>
                <div className="al-modal-info-item">
                  <label>Assigned To:</label>
                  <div className="al-modal-assign-row">
                    <span className="al-modal-assigned-pill"><FiUser size={12} /> {selectedLead.assignedTo}</span>
                    <button
                      type="button"
                      className="al-btn-quick-assign"
                      onClick={() => {
                        setAssignModalLead(selectedLead);
                        setAssignTargetUserId(selectedLead.assignedTo && selectedLead.assignedTo !== 'Unassigned' ? (teamMembers.find(u => u.name === selectedLead.assignedTo)?._id || '') : '');
                        setAssignError('');
                      }}
                    >
                      {selectedLead.assignedTo && selectedLead.assignedTo !== 'Unassigned' ? 'Change' : 'Assign'}
                    </button>
                  </div>
                </div>
                <div className="al-modal-info-item">
                  <label>Assigned Date:</label>
                  <span><FiCalendar size={12} /> {selectedLead.assignedDate || '-'}</span>
                </div>
                <div className="al-modal-info-item">
                  <label>Created Date:</label>
                  <span><FiClock size={12} /> {selectedLead.createdDate || '-'}</span>
                </div>
                <div className="al-modal-info-item full-width">
                  <label>Address:</label>
                  <span><FiMapPin size={12} /> {selectedLead.address || 'No address provided'}</span>
                </div>
              </div>

              {/* Remarks / Notes */}
              {selectedLead.note && (
                <div className="al-modal-notes-box">
                  <div className="al-modal-notes-header">
                    <FiFileText size={13} />
                    <strong>Remarks / Notes:</strong>
                  </div>
                  <p>{selectedLead.note}</p>
                </div>
              )}

              {/* Custom Fields (Render only non-empty fields) */}
              {[1, 2, 3, 4, 5].some(n => selectedLead[`customField${n}`]) && (
                <>
                  <div className="al-modal-section-title mt-2">
                    <FiTag size={13} />
                    <span>CUSTOM FIELDS</span>
                  </div>
                  <div className="al-modal-grid">
                    {[1, 2, 3, 4, 5].map(n => {
                      const val = selectedLead[`customField${n}`];
                      if (!val) return null;
                      return (
                        <div className="al-modal-info-item" key={n}>
                          <label>Custom Field {n}</label>
                          <span>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <footer className="al-modal-footer">
              <button
                type="button"
                className="al-modal-btn-close"
                onClick={() => setSelectedLead(null)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Single Assign / Unassign Modal */}
      {assignModalLead && (
        <div className="al-modal-overlay" onClick={() => setAssignModalLead(null)}>
          <div className="al-modal-content al-assign-modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="al-modal-header">
              <div className="al-modal-title-box">
                <span className="al-modal-lead-badge">{assignModalLead.leadId}</span>
                <h3>Assign Lead</h3>
              </div>
              <button
                className="al-modal-close"
                onClick={() => setAssignModalLead(null)}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveAssignment} className="al-assign-form">
              <div className="al-assign-lead-card">
                <div className="al-assign-lead-info">
                  <strong>{assignModalLead.name}</strong>
                  <span>{assignModalLead.phone} &bull; {assignModalLead.type}</span>
                </div>
                <div className="al-assign-current-badge">
                  <span className="al-assign-current-lbl">Currently:</span>
                  <span className={`al-modal-assigned-pill ${assignModalLead.assignedTo === 'Unassigned' ? 'is-unassigned' : ''}`}>
                    <FiUser size={12} /> {assignModalLead.assignedTo}
                  </span>
                </div>
              </div>

              {assignError && <div role="alert" className="al-err mb-3">{assignError}</div>}

              <div className="al-field mb-4">
                <label>
                  Select Team Member / Telecaller <span className="req">*</span>
                </label>
                <select
                  value={assignTargetUserId}
                  onChange={(e) => setAssignTargetUserId(e.target.value)}
                  className="al-select al-assign-select"
                  required
                >
                  <option value="">-- Choose User to Assign --</option>
                  {assignModalLead.assignedTo !== 'Unassigned' && (
                    <option value="unassign">❌ Unassign Lead (Remove current assignment)</option>
                  )}
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      👤 {member.name} {member.jobRole || member.role ? `(${member.jobRole || member.role})` : ''}
                    </option>
                  ))}
                </select>
                <span className="al-hint-text">
                  Choosing a member will instantly route this lead to their calling queue.
                </span>
              </div>

              <div className="al-assign-actions">
                <button
                  type="button"
                  className="al-btn-cancel"
                  onClick={() => setAssignModalLead(null)}
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="al-btn-save al-btn-save-assign"
                  disabled={assignLoading || !assignTargetUserId}
                >
                  <FiCheckCircle size={14} /> {assignLoading ? 'Saving...' : assignTargetUserId === 'unassign' ? 'Confirm Unassign' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}