import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
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

export default function TodaysCalls() {
  const [calls, setCalls] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchToday = async () => {
      setLoading(true);
      try {
        const [res, teamRes] = await Promise.allSettled([
          axiosInstance.get('/crm/admin/calls/today', { _skipErrorNotify: true }),
          axiosInstance.get('/crm/leads/team', { _skipErrorNotify: true })
        ]);
        if (isMounted && res.status === 'fulfilled' && Array.isArray(res.value?.data?.items)) {
          const mapped = res.value.data.items.map((c, idx) => ({
            id: c._id || idx + 1,
            lead: c.lead?.name || 'Lead',
            time: new Date(c.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            phone: c.lead?.phone || '—',
            source: c.lead?.leadSource?.name || c.lead?.source || 'Direct',
            leadType: c.lead?.leadType?.name || 'General',
            callType: 'Outbound',
            outcome: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Answered',
            notes: c.notes || '—',
            assignedTo: c.agent?.name || 'Agent',
            duration: c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : '0s'
          }));
          setCalls(mapped);
        }
        if (isMounted && teamRes.status === 'fulfilled' && Array.isArray(teamRes.value?.data?.users)) {
          setTeamUsers(teamRes.value.data.users);
        }
      } catch {
        // Keep the empty state when either live request is unavailable.
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchToday();
    return () => { isMounted = false; };
  }, []);

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
    return calls.filter(call => {
      if (appliedFilters.assignedTo && call.assignedTo !== appliedFilters.assignedTo) return false;
      if (appliedFilters.source && call.source !== appliedFilters.source) return false;
      if (appliedFilters.leadType && call.leadType !== appliedFilters.leadType) return false;
      if (appliedFilters.callType && call.callType !== appliedFilters.callType) return false;
      return true;
    });
  }, [calls, appliedFilters]);

  const totalToday = calls.length;
  const connectedToday = calls.filter(c => ['Connected', 'Interested', 'Answered'].includes(c.outcome)).length;
  const interestedToday = calls.filter(c => c.outcome === 'Interested').length;
  const followupsToday = calls.filter(c => ['Follow-up', 'Need Callback'].includes(c.outcome)).length;

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
              {teamUsers.map(u => (
                <option key={u._id} value={u.name}>{u.name}</option>
              ))}
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
