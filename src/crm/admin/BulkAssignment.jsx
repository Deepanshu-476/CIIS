import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiEye,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import './BulkAssignment.css';

const BULK_LEADS_DATA = [
  {
    id: 1,
    leadId: '#LD-024',
    source: 'Instagram',
    type: 'JEE',
    name: 'Lalit Pandey',
    subtitle: 'Parent inquiry',
    gender: 'Male',
    email: 'lalit.pandey12@gmail.com',
    phone: '6386120750',
    address: 'Nagpur',
    created: '14 Jan 2026'
  },
  {
    id: 2,
    leadId: '#LD-025',
    source: 'Instagram',
    type: 'JEE',
    name: 'Jyoti Fernandes',
    subtitle: 'Interested in test series',
    gender: 'Female',
    email: 'jyoti.fernandes8@hotmail.com',
    phone: '9872343098',
    address: 'Hyderabad',
    created: '15 Jan 2026'
  },
  {
    id: 3,
    leadId: '#LD-026',
    source: 'Instagram',
    type: 'JEE',
    name: 'Deepak Sharma',
    subtitle: 'Evening batch preferred',
    gender: 'Male',
    email: 'deepak.sharma10@gmail.com',
    phone: '6323651994',
    address: 'Indore',
    created: '17 Jan 2026'
  },
  {
    id: 4,
    leadId: '#LD-027',
    source: 'Instagram',
    type: 'JEE',
    name: 'Rohit Oberoi',
    subtitle: 'Interested in UPSC',
    gender: 'Male',
    email: 'rohit.oberoi83@rediffmail.com',
    phone: '9766506180',
    address: 'Trivandrum',
    created: '17 Jan 2026'
  }
];

export default function BulkAssignment() {
  const navigate = useNavigate();

  // Filters State
  const [sourceFilter, setSourceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('2026-09-01');

  // Leads & Selection State
  const [leads, setLeads] = useState(BULK_LEADS_DATA);
  const [selectedIds, setSelectedIds] = useState([]);

  // Assignment Method State
  const [agentType, setAgentType] = useState('');
  const [assignmentMethod, setAssignmentMethod] = useState(''); // 'specific', 'round-robin', 'load-balanced'
  const [specificAgent, setSpecificAgent] = useState('');

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(leads.map(l => l.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const isAllSelected = selectedIds.length === leads.length && leads.length > 0;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (sourceFilter && l.source !== sourceFilter) return false;
      if (typeFilter && l.type !== typeFilter) return false;
      return true;
    });
  }, [leads, sourceFilter, typeFilter]);

  const handleResetFilters = () => {
    setSourceFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('2026-09-01');
  };

  const selectedLeadsCount = selectedIds.length;

  const handleConfirmAndAssign = () => {
    if (selectedLeadsCount === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Leads Selected',
        text: 'Please select at least one lead from Step 1.'
      });
      return;
    }
    if (!assignmentMethod) {
      Swal.fire({
        icon: 'warning',
        title: 'No Method Selected',
        text: 'Please choose an assignment method in Step 2.'
      });
      return;
    }
    if (assignmentMethod === 'specific' && !specificAgent) {
      Swal.fire({
        icon: 'warning',
        title: 'No Agent Selected',
        text: 'Please select a specific agent.'
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Leads Assigned Successfully!',
      text: `${selectedLeadsCount} leads have been assigned.`,
      timer: 2000,
      showConfirmButton: false
    });

    setTimeout(() => {
      navigate('/ciisUser/crm/admin/assignments');
    }, 1800);
  };

  return (
    <div className="bka-root">
      {/* Top Header */}
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

      {/* STEP 1: Filter & Select Leads */}
      <div className="bka-card">
        <div className="bka-card-header">
          <span className="bka-step-badge">Step 1</span>
          <h2>Filter & Select Leads</h2>
        </div>

        {/* Filter Controls */}
        <div className="bka-filter-row">
          <div className="bka-field">
            <label>Source</label>
            <select
              className="bka-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="">Select Lead Source</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="School Visit">School Visit</option>
              <option value="Website">Website</option>
            </select>
          </div>

          <div className="bka-field">
            <label>Lead Type</label>
            <select
              className="bka-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Select Lead Type</option>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
              <option value="Counselling">Counselling</option>
            </select>
          </div>

          <div className="bka-field">
            <label>Date From</label>
            <input
              type="date"
              className="bka-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="bka-field">
            <label>Date To</label>
            <input
              type="date"
              className="bka-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="bka-filter-actions">
            <button className="bka-btn-apply">
              <FiFilter /> Apply
            </button>
            <button className="bka-btn-reset" title="Reset Filters" onClick={handleResetFilters}>
              <FiRotateCcw />
            </button>
          </div>
        </div>

        {/* Selection Stats & Buttons */}
        <div className="bka-selection-bar">
          <span className="bka-selection-text">
            {selectedLeadsCount} of 277 leads selected
          </span>
          <div className="bka-selection-btn-group">
            <button className="bka-btn-sec" onClick={handleSelectAll}>
              Select All
            </button>
            <button className="bka-btn-sec" onClick={handleDeselectAll}>
              Deselect All
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bka-table-wrapper">
          <table className="bka-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => {
                      if (e.target.checked) handleSelectAll();
                      else handleDeselectAll();
                    }}
                  />
                </th>
                <th>Lead ID</th>
                <th>Lead Source</th>
                <th>Lead Type</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((row) => {
                const isChecked = selectedIds.includes(row.id);
                return (
                  <tr key={row.id} className={isChecked ? 'bka-row-selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(row.id)}
                      />
                    </td>
                    <td className="bka-bold">{row.leadId}</td>
                    <td>
                      <span className="bka-pill-source">{row.source}</span>
                    </td>
                    <td>
                      <span className="bka-pill-type">{row.type}</span>
                    </td>
                    <td>
                      <div>
                        <div className="bka-bold">{row.name}</div>
                        <div className="bka-subtext">{row.subtitle}</div>
                      </div>
                    </td>
                    <td>{row.gender}</td>
                    <td>{row.email}</td>
                    <td>{row.phone}</td>
                    <td>{row.address}</td>
                    <td>{row.created}</td>
                  </tr>
                );
              })}
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
            <label>Select Agent Type</label>
            <select
              className="bka-select"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
            >
              <option value="">Choose...</option>
              <option value="Telecaller">Telecaller</option>
              <option value="Marketing Executive">Marketing Executive</option>
              <option value="All Agents">All Agents</option>
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
              <p className="bka-method-sub">All selected leads go to one Agent</p>
              {assignmentMethod === 'specific' && (
                <div className="bka-method-select-wrap" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="bka-select"
                    value={specificAgent}
                    onChange={(e) => setSpecificAgent(e.target.value)}
                  >
                    <option value="">Select agent...</option>
                    <option value="Marketing Exec3">Marketing Exec3</option>
                    <option value="Telecaller 1">Telecaller 1</option>
                    <option value="Telecaller 2">Telecaller 2</option>
                    <option value="Telecaller 3">Telecaller 3</option>
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
              <p className="bka-method-sub">Leads distributed evenly in sequence</p>
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
              <p className="bka-method-sub">Assign to least loaded Agent first</p>
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
              {selectedLeadsCount} leads will be assigned
            </div>
            <div className="bka-summary-sub">
              {assignmentMethod === 'specific'
                ? `Specific Agent: ${specificAgent || 'None selected'}`
                : assignmentMethod === 'round-robin'
                ? 'Method: Round-Robin Distribution'
                : assignmentMethod === 'load-balanced'
                ? 'Method: Load-Balanced Distribution'
                : 'No method selected'}
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
              onClick={handleConfirmAndAssign}
            >
              <FiCheckCircle /> Confirm & Assign
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
                You are about to assign <strong>{selectedLeadsCount}</strong> leads using{' '}
                <strong>
                  {assignmentMethod === 'specific'
                    ? `Specific Agent (${specificAgent || 'Unspecified'})`
                    : assignmentMethod === 'round-robin'
                    ? 'Round-Robin'
                    : 'Load-Balanced'}
                </strong>.
              </p>
              <div className="bka-preview-list">
                {leads
                  .filter(l => selectedIds.includes(l.id))
                  .map((lead) => (
                    <div key={lead.id} className="bka-preview-item">
                      <span>{lead.leadId}</span> - <strong>{lead.name}</strong> ({lead.source})
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
