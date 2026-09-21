import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiEye,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import './BulkAssignment.css';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

const leadCode = (id) => `#LD-${String(id || '').slice(-4).toUpperCase()}`;

export default function BulkAssignment() {
  const navigate = useNavigate();

  // Data states
  const [leads, setLeads] = useState([]);
  const [team, setTeam] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterType, setFilterType] = useState('unassigned'); // 'unassigned' | 'assigned'
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [agentTypeFilter, setAgentTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Assignment configuration
  const [assignmentMethod, setAssignmentMethod] = useState('round-robin'); // 'specific' | 'round-robin' | 'load-balanced'
  const [specificAgent, setSpecificAgent] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch leads and team
  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/crm/assignments/overview', {
        params: {
          page: currentPage,
          limit: 100,
          search: searchTerm.trim(),
          filter: filterType
        },
        _skipErrorNotify: true
      });
      const data = res.data || {};
      setLeads(data.unassigned || []);
      setTeam(data.team || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setLeads([]);
      setError(err.response?.data?.message || 'Leads load nahi ho saki.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterType]);

  useEffect(() => {
    const timer = setTimeout(loadLeads, 250);
    return () => clearTimeout(timer);
  }, [loadLeads]);

  // Derived filtered leads on client for source / type dropdowns
  const displayedLeads = useMemo(() => {
    return leads.filter((item) => {
      const src = item.leadSource?.name || item.source || 'Direct';
      const typ = item.leadType?.name || item.type || 'General';
      if (sourceFilter !== 'All' && src.toLowerCase() !== sourceFilter.toLowerCase()) return false;
      if (typeFilter !== 'All' && typ.toLowerCase() !== typeFilter.toLowerCase()) return false;
      return true;
    });
  }, [leads, sourceFilter, typeFilter]);

  // Unique sources and types for filter dropdowns
  const availableSources = useMemo(() => {
    const s = new Set();
    leads.forEach((l) => {
      const val = l.leadSource?.name || l.source;
      if (val) s.add(val);
    });
    return Array.from(s);
  }, [leads]);

  const availableTypes = useMemo(() => {
    const t = new Set();
    leads.forEach((l) => {
      const val = l.leadType?.name || l.type;
      if (val) t.add(val);
    });
    return Array.from(t);
  }, [leads]);

  // Filtered team by agent type
  const filteredTeam = useMemo(() => {
    if (agentTypeFilter === 'All') return team;
    return team.filter((agent) => {
      const roleStr = `${agent.jobRole || ''} ${agent.companyRole || ''} ${agent.role || ''}`.toLowerCase();
      if (agentTypeFilter === 'Telecaller') return roleStr.includes('telecaller');
      if (agentTypeFilter === 'Marketing') return roleStr.includes('marketing');
      return true;
    });
  }, [team, agentTypeFilter]);

  // Checkbox handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectVisible = () => {
    const visibleIds = displayedLeads.map((l) => l._id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSourceFilter('All');
    setTypeFilter('All');
    setCurrentPage(1);
  };

  // Submit bulk assignment
  const handleConfirmAndAssign = async () => {
    if (!selectedIds.length) {
      setError('Kam se kam ek lead select karein.');
      return;
    }
    if (assignmentMethod === 'specific' && !specificAgent) {
      setError('Kripya specific agent select karein.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post(
        '/crm/assignments/bulk',
        {
          leadIds: selectedIds,
          method: assignmentMethod,
          agentId: assignmentMethod === 'specific' ? specificAgent : undefined
        },
        { _skipErrorNotify: true }
      );
      setSuccess(`${selectedIds.length} lead(s) successfully assigned!`);
      setSelectedIds([]);
      setIsPreviewOpen(false);
      await loadLeads();
      setTimeout(() => {
        navigate('/ciisUser/crm/admin/assignments');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk assignment failed.');
    } finally {
      setSaving(false);
    }
  };

  const selectedLeadsCount = selectedIds.length;
  const specificAgentObj = team.find((t) => t._id === specificAgent);

  return (
    <div className="bka-root">
      {/* Header */}
      <div className="bka-header">
        <div>
          <h1>Bulk Assignment</h1>
        </div>
        <nav className="bka-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight className="bka-crumb-arrow" />
          <Link to="/ciisUser/crm/admin/assignments">Assignments</Link>
          <FiChevronRight className="bka-crumb-arrow" />
          <span>Bulk Assignment</span>
        </nav>
      </div>

      {error && <div className="bka-alert-error">{error}</div>}
      {success && <div className="bka-alert-success">{success}</div>}

      {/* STEP 1: Select Leads */}
      <div className="bka-card">
        <div className="bka-card-header">
          <span className="bka-step-badge">Step 1</span>
          <h2>Select Leads to Assign</h2>
        </div>

        {/* Lead Scope Tabs (Unassigned vs Assigned) */}
        <div style={{ padding: '16px 20px 0 20px', display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={`bka-tab-btn ${filterType === 'unassigned' ? 'active' : ''}`}
            onClick={() => {
              setFilterType('unassigned');
              setCurrentPage(1);
              setSelectedIds([]);
            }}
          >
            Unassigned Leads ({filterType === 'unassigned' ? pagination.total || 0 : '—'})
          </button>
          <button
            type="button"
            className={`bka-tab-btn ${filterType === 'assigned' ? 'active' : ''}`}
            onClick={() => {
              setFilterType('assigned');
              setCurrentPage(1);
              setSelectedIds([]);
            }}
          >
            Assigned Leads / Reassign ({filterType === 'assigned' ? pagination.total || 0 : '—'})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bka-filter-row">
          <div className="bka-field">
            <label>Lead Source</label>
            <select
              className="bka-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="All">All Sources</option>
              {availableSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="bka-field">
            <label>Lead Type</label>
            <select
              className="bka-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="bka-field">
            <label>Search</label>
            <input
              type="text"
              className="bka-input"
              placeholder="Search by name, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="bka-filter-actions">
            <button className="bka-btn-reset" title="Reset Filters" onClick={handleResetFilters}>
              <FiRotateCcw />
            </button>
          </div>
        </div>

        {/* Selection Bar */}
        <div className="bka-selection-bar">
          <div className="bka-selection-text">
            <strong>{selectedLeadsCount}</strong> of {displayedLeads.length} visible leads selected
          </div>
          <div className="bka-selection-btn-group">
            <button className="bka-btn-sec" onClick={handleSelectVisible}>
              Select Visible
            </button>
            <button className="bka-btn-sec" onClick={handleDeselectAll}>
              Deselect All
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bka-table-wrapper">
          <table className="bka-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={
                      displayedLeads.length > 0 &&
                      displayedLeads.every((l) => selectedIds.includes(l._id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) handleSelectVisible();
                      else handleDeselectAll();
                    }}
                  />
                </th>
                <th>LEAD ID</th>
                <th>LEAD SOURCE</th>
                <th>LEAD TYPE</th>
                <th>NAME</th>
                <th>GENDER</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>CITY / STATE</th>
                {filterType === 'assigned' && <th>CURRENT TELECALLER</th>}
                <th>CREATED</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={filterType === 'assigned' ? 11 : 10} className="bka-table-loading">
                    Loading leads...
                  </td>
                </tr>
              ) : displayedLeads.length === 0 ? (
                <tr>
                  <td colSpan={filterType === 'assigned' ? 11 : 10} className="bka-table-empty">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                displayedLeads.map((row) => {
                  const isChecked = selectedIds.includes(row._id);
                  const source = row.leadSource?.name || row.source || 'Direct';
                  const type = row.leadType?.name || row.type || 'General';
                  const code = leadCode(row._id);
                  const location = row.city || row.state || row.address || '—';

                  return (
                    <tr key={row._id} className={isChecked ? 'bka-row-selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(row._id)}
                        />
                      </td>
                      <td className="bka-bold">{code}</td>
                      <td>
                        <span className="bka-pill-source">{source}</span>
                      </td>
                      <td>
                        <span className="bka-pill-type">{type}</span>
                      </td>
                      <td>
                        <div>
                          <div className="bka-bold">{row.name || 'Unnamed'}</div>
                          {row.remarks && <div className="bka-subtext">{row.remarks}</div>}
                        </div>
                      </td>
                      <td>{row.gender || '—'}</td>
                      <td>{row.email || '—'}</td>
                      <td>{row.phone || '—'}</td>
                      <td>{location}</td>
                      {filterType === 'assigned' && (
                        <td>
                          <span className="bka-pill-source">
                            {row.assignedTo?.name || 'Assigned'}
                          </span>
                        </td>
                      )}
                      <td>{formatDate(row.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STEP 2: Choose Assignment Method */}
      <div className="bka-card">
        <div className="bka-card-header">
          <span className="bka-step-badge">Step 2</span>
          <h2>Choose Assignment Method</h2>
        </div>

        <div className="bka-step2-body">
          <div className="bka-field bka-agent-type-field">
            <label>Filter Agent Role</label>
            <select
              className="bka-select"
              value={agentTypeFilter}
              onChange={(e) => setAgentTypeFilter(e.target.value)}
            >
              <option value="All">All Roles ({team.length})</option>
              <option value="Telecaller">Telecallers Only</option>
              <option value="Marketing">Marketing Only</option>
            </select>
          </div>

          <div className="bka-methods-grid">
            {/* Method 1: Specific Agent */}
            <div
              className={`bka-method-card ${assignmentMethod === 'specific' ? 'selected' : ''}`}
              onClick={() => setAssignmentMethod('specific')}
            >
              <div className="bka-method-header">
                <input
                  type="radio"
                  name="assignmentMethod"
                  checked={assignmentMethod === 'specific'}
                  onChange={() => setAssignmentMethod('specific')}
                />
                <span className="bka-method-title">Assign to Specific Agent</span>
              </div>
              <p className="bka-method-sub">All selected leads go to one telecaller</p>
              {assignmentMethod === 'specific' && (
                <div className="bka-method-select-wrap" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="bka-select"
                    value={specificAgent}
                    onChange={(e) => setSpecificAgent(e.target.value)}
                  >
                    <option value="">Select Telecaller...</option>
                    {filteredTeam.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name} — {agent.jobRole || agent.role || 'Telecaller'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Method 2: Round Robin */}
            <div
              className={`bka-method-card ${assignmentMethod === 'round-robin' ? 'selected' : ''}`}
              onClick={() => setAssignmentMethod('round-robin')}
            >
              <div className="bka-method-header">
                <input
                  type="radio"
                  name="assignmentMethod"
                  checked={assignmentMethod === 'round-robin'}
                  onChange={() => setAssignmentMethod('round-robin')}
                />
                <span className="bka-method-title">Round-Robin Distribution</span>
              </div>
              <p className="bka-method-sub">Leads distributed evenly in round-robin sequence</p>
            </div>

            {/* Method 3: Load Balanced */}
            <div
              className={`bka-method-card ${assignmentMethod === 'load-balanced' ? 'selected' : ''}`}
              onClick={() => setAssignmentMethod('load-balanced')}
            >
              <div className="bka-method-header">
                <input
                  type="radio"
                  name="assignmentMethod"
                  checked={assignmentMethod === 'load-balanced'}
                  onChange={() => setAssignmentMethod('load-balanced')}
                />
                <span className="bka-method-title">Load-Balanced Distribution</span>
              </div>
              <p className="bka-method-sub">Assign to least loaded telecallers first</p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3: Preview & Confirm */}
      <div className="bka-card">
        <div className="bka-card-header">
          <span className="bka-step-badge">Step 3</span>
          <h2>Preview & Confirm</h2>
        </div>

        <div className="bka-step3-body">
          <div>
            <div className="bka-summary-title">
              {selectedLeadsCount} lead{selectedLeadsCount === 1 ? '' : 's'} will be assigned
            </div>
            <div className="bka-summary-sub">
              {assignmentMethod === 'specific'
                ? `Specific Agent: ${specificAgentObj?.name || 'None selected'}`
                : assignmentMethod === 'round-robin'
                ? 'Method: Round-Robin Distribution'
                : 'Method: Load-Balanced Distribution'}
            </div>
          </div>

          <div className="bka-step3-actions">
            <button
              className="bka-btn-preview"
              onClick={() => setIsPreviewOpen(true)}
              disabled={selectedLeadsCount === 0}
            >
              <FiEye /> Preview
            </button>
            <button
              className="bka-btn-confirm-all"
              disabled={saving || selectedLeadsCount === 0}
              onClick={handleConfirmAndAssign}
            >
              <FiCheckCircle /> {saving ? 'Assigning...' : 'Confirm & Assign'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="bka-modal-overlay">
          <div className="bka-modal-card">
            <div className="bka-modal-header">
              <h3>Bulk Assignment Preview</h3>
              <button
                className="bka-modal-close"
                onClick={() => setIsPreviewOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="bka-modal-body">
              <p className="bka-preview-intro">
                You are about to assign <strong>{selectedLeadsCount}</strong> lead(s) using{' '}
                <strong>
                  {assignmentMethod === 'specific'
                    ? `Specific Agent: ${specificAgentObj?.name || 'Unspecified'}`
                    : assignmentMethod === 'round-robin'
                    ? 'Round-Robin Distribution'
                    : 'Load-Balanced Distribution'}
                </strong>.
              </p>
              <div className="bka-preview-list">
                {displayedLeads
                  .filter((l) => selectedIds.includes(l._id))
                  .map((lead) => (
                    <div key={lead._id} className="bka-preview-item">
                      <span>{leadCode(lead._id)}</span> - <strong>{lead.name}</strong> ({lead.leadSource?.name || lead.source || 'Direct'})
                    </div>
                  ))}
              </div>
            </div>
            <div className="bka-modal-footer">
              <button
                className="bka-btn-sec"
                onClick={() => setIsPreviewOpen(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
