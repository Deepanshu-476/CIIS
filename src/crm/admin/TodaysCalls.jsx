import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPhoneCall,
  FiPhoneIncoming,
  FiUserCheck,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiChevronRight,
  FiClock,
  FiEye,
  FiX,
  FiPercent
} from 'react-icons/fi';
import './TodaysCalls.css';

const initialCallsData = [
  {
    id: 1,
    lead: 'Ashok Pillai',
    time: '10:30 AM',
    phone: '8016315999',
    source: 'Facebook',
    leadType: 'NEET',
    callType: 'Outbound',
    outcome: 'Connected',
    notes: 'Interested in NEET regular batch',
    assignedTo: 'Telecaller 1'
  },
  {
    id: 2,
    lead: 'Komal Wadhwa',
    time: '11:15 AM',
    phone: '9598564205',
    source: 'Instagram',
    leadType: 'JEE',
    callType: 'Inbound',
    outcome: 'Interested',
    notes: 'Requested fee structure PDF',
    assignedTo: 'Telecaller 2'
  }
];

export default function TodaysCalls() {
  const [calls] = useState(initialCallsData);
  const [showData, setShowData] = useState(false); // Default empty state matching screenshot (0 calls)
  
  const [filters, setFilters] = useState({
    assignedTo: '',
    source: '',
    leadType: '',
    callType: '',
    timeFrom: '',
    timeTo: ''
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [selectedCall, setSelectedCall] = useState(null);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    const initial = {
      assignedTo: '',
      source: '',
      leadType: '',
      callType: '',
      timeFrom: '',
      timeTo: ''
    };
    setFilters(initial);
    setAppliedFilters(initial);
  };

  const filteredCalls = useMemo(() => {
    if (!showData) return [];
    return calls.filter(call => {
      if (appliedFilters.assignedTo && call.assignedTo !== appliedFilters.assignedTo) return false;
      if (appliedFilters.source && call.source !== appliedFilters.source) return false;
      if (appliedFilters.leadType && call.leadType !== appliedFilters.leadType) return false;
      if (appliedFilters.callType && call.callType !== appliedFilters.callType) return false;
      return true;
    });
  }, [calls, appliedFilters, showData]);

  const totalToday = showData ? calls.length : 0;
  const connectedToday = showData ? calls.filter(c => c.outcome === 'Connected' || c.outcome === 'Interested').length : 0;
  const interestedToday = showData ? calls.filter(c => c.outcome === 'Interested').length : 0;
  const followupsToday = 0;

  return (
    <div className="tc-root">
      {/* Page Header */}
      <header className="tc-page-header">
        <h1>Today's Calls</h1>
        <nav aria-label="Breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight size={12} />
          <Link to="/ciisUser/crm/admin/call-overview">Call Management</Link>
          <FiChevronRight size={12} />
          <span>Today's Calls</span>
        </nav>
      </header>

      {/* Top 4 Stat Cards Row */}
      <div className="tc-stats-row">
        <div className="tc-stat-card">
          <div className="tc-stat-info">
            <span className="tc-stat-title">Total Calls Today</span>
            <strong className="tc-stat-value">{totalToday}</strong>
          </div>
          <div className="tc-stat-icon tc-tone-purple">
            <FiPhoneCall size={20} />
          </div>
        </div>

        <div className="tc-stat-card">
          <div className="tc-stat-info">
            <span className="tc-stat-title">Connected Calls</span>
            <strong className="tc-stat-value">{connectedToday}</strong>
          </div>
          <div className="tc-stat-icon tc-tone-green">
            <FiPhoneIncoming size={20} />
          </div>
        </div>

        <div className="tc-stat-card">
          <div className="tc-stat-info">
            <span className="tc-stat-title">Interested Leads</span>
            <strong className="tc-stat-value">{interestedToday}</strong>
          </div>
          <div className="tc-stat-icon tc-tone-blue">
            <FiUserCheck size={20} />
          </div>
        </div>

        <div className="tc-stat-card">
          <div className="tc-stat-info">
            <span className="tc-stat-title">Follow Ups Today</span>
            <strong className="tc-stat-value">{followupsToday}</strong>
          </div>
          <div className="tc-stat-icon tc-tone-orange">
            <FiCalendar size={20} />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <section className="tc-filter-panel">
        <div className="tc-filter-grid">
          <div className="tc-field">
            <label>Assigned To</label>
            <select
              value={filters.assignedTo}
              onChange={e => handleFilterChange('assignedTo', e.target.value)}
            >
              <option value="">All Users</option>
              <option value="Telecaller 1">Telecaller 1</option>
              <option value="Telecaller 2">Telecaller 2</option>
            </select>
          </div>

          <div className="tc-field">
            <label>Source</label>
            <select
              value={filters.source}
              onChange={e => handleFilterChange('source', e.target.value)}
            >
              <option value="">Select Lead Source</option>
              <option value="Website">Website</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Referral">Referral</option>
            </select>
          </div>

          <div className="tc-field">
            <label>Lead Type</label>
            <select
              value={filters.leadType}
              onChange={e => handleFilterChange('leadType', e.target.value)}
            >
              <option value="">Select Lead Type</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="CAT">CAT</option>
            </select>
          </div>

          <div className="tc-field">
            <label>Call Type</label>
            <select
              value={filters.callType}
              onChange={e => handleFilterChange('callType', e.target.value)}
            >
              <option value="">All Calls</option>
              <option value="Outbound">Outbound</option>
              <option value="Inbound">Inbound</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>

          <div className="tc-field">
            <label>Time From</label>
            <div className="tc-input-with-icon">
              <input
                type="time"
                value={filters.timeFrom}
                onChange={e => handleFilterChange('timeFrom', e.target.value)}
              />
              <FiClock className="tc-field-icon" />
            </div>
          </div>

          <div className="tc-field">
            <label>Time To</label>
            <div className="tc-input-with-icon">
              <input
                type="time"
                value={filters.timeTo}
                onChange={e => handleFilterChange('timeTo', e.target.value)}
              />
              <FiClock className="tc-field-icon" />
            </div>
          </div>
        </div>

        <div className="tc-filter-actions">
          <button type="button" className="tc-btn-apply" onClick={handleApply}>
            <FiFilter size={14} /> Apply
          </button>
          <button type="button" className="tc-btn-reset" onClick={handleReset} title="Reset filters">
            <FiRefreshCw size={14} />
          </button>
          <button 
            type="button" 
            className="tc-btn-toggle" 
            onClick={() => setShowData(!showData)}
            title="Toggle sample data for preview"
          >
            {showData ? 'Show Empty State' : 'Sample Data'}
          </button>
        </div>
      </section>

      {/* Main Card: Today's Call Log */}
      <section className="tc-log-card">
        <header className="tc-log-header">
          <h2>Today's Call Log</h2>
        </header>

        <div className="tc-table-wrapper">
          {filteredCalls.length > 0 ? (
            <table className="tc-table">
              <thead>
                <tr>
                  <th>SL NO.</th>
                  <th>LEAD</th>
                  <th>TIME</th>
                  <th>PHONE</th>
                  <th>SOURCE</th>
                  <th>LEAD TYPE</th>
                  <th>CALL TYPE</th>
                  <th>OUTCOME</th>
                  <th>NOTES</th>
                  <th>ASSIGNED TO</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call, idx) => (
                  <tr key={call.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{call.lead}</strong></td>
                    <td>{call.time}</td>
                    <td>{call.phone}</td>
                    <td><span className="tc-badge tc-badge-source">{call.source}</span></td>
                    <td><span className="tc-badge tc-badge-type">{call.leadType}</span></td>
                    <td><span className="tc-badge tc-badge-call">{call.callType}</span></td>
                    <td><span className="tc-badge tc-badge-outcome">{call.outcome}</span></td>
                    <td className="tc-notes">{call.notes}</td>
                    <td>{call.assignedTo}</td>
                    <td>
                      <button
                        type="button"
                        className="tc-action-btn"
                        onClick={() => setSelectedCall(call)}
                        title="View Call Details"
                      >
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="tc-empty-state">
              <div className="tc-empty-icon">
                <FiPercent size={24} />
              </div>
              <h3>No Calls Made Today</h3>
              <p>Your completed calls for today will appear here.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modal for Call Details */}
      {selectedCall && (
        <div className="tc-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="tc-modal-content" onClick={e => e.stopPropagation()}>
            <div className="tc-modal-header">
              <h3>Call Details</h3>
              <button type="button" className="tc-modal-close" onClick={() => setSelectedCall(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="tc-modal-body">
              <div className="tc-modal-grid">
                <div><strong>Lead Name:</strong> {selectedCall.lead}</div>
                <div><strong>Phone Number:</strong> {selectedCall.phone}</div>
                <div><strong>Call Time:</strong> {selectedCall.time}</div>
                <div><strong>Call Type:</strong> {selectedCall.callType}</div>
                <div><strong>Lead Source:</strong> {selectedCall.source}</div>
                <div><strong>Lead Type:</strong> {selectedCall.leadType}</div>
                <div><strong>Outcome:</strong> {selectedCall.outcome}</div>
                <div><strong>Assigned To:</strong> {selectedCall.assignedTo}</div>
              </div>
              <div className="tc-modal-notes">
                <strong>Notes:</strong>
                <p>{selectedCall.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}