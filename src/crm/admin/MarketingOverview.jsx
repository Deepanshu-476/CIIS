import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiThumbsUp,
  FiChevronRight,
  FiMapPin,
  FiActivity,
  FiUserCheck,
  FiPlus,
  FiX,
  FiCheckCircle
} from 'react-icons/fi';
import './MarketingOverview.css';

const STATS_DATA = [
  {
    id: 'assigned-leads',
    value: 6,
    label: 'Assigned Leads',
    badge: 'Marketing ownership',
    badgeTone: 'purple',
    icon: FiUsers,
    iconBg: 'bg-purple-light'
  },
  {
    id: 'todays-visits',
    value: 0,
    label: "Today's Visits",
    badge: 'Scheduled today',
    badgeTone: 'green',
    icon: FiCalendar,
    iconBg: 'bg-green-light'
  },
  {
    id: 'pending-followups',
    value: 2,
    label: 'Pending Follow Ups',
    badge: 'Needs attention',
    badgeTone: 'amber',
    icon: FiClock,
    iconBg: 'bg-amber-light'
  },
  {
    id: 'interested-qualified',
    value: 1,
    label: 'Interested / Qualified',
    badge: 'Positive response',
    badgeTone: 'cyan',
    icon: FiThumbsUp,
    iconBg: 'bg-cyan-light'
  }
];

const QUICK_ACCESS_ITEMS = [
  {
    title: 'Assigned Leads',
    subtitle: 'Review assigned Marketing leads',
    path: '/ciisUser/crm/admin/all-leads',
    icon: FiUsers,
    color: '#2563eb',
    bg: '#eff6ff'
  },
  {
    title: 'Follow-Ups',
    subtitle: 'Leads requiring attention',
    path: '/ciisUser/crm/marketing/follow-ups',
    icon: FiClock,
    color: '#ea580c',
    bg: '#fff7ed'
  },
  {
    title: 'Visit Management',
    subtitle: 'Monitor field schedules',
    path: '/ciisUser/crm/marketing/visits',
    icon: FiMapPin,
    color: '#16a34a',
    bg: '#f0fdf4'
  },
  {
    title: 'Activity History',
    subtitle: 'Recent Marketing outcomes',
    path: '/ciisUser/crm/marketing/activities',
    icon: FiActivity,
    color: '#9333ea',
    bg: '#faf5ff'
  }
];

const INITIAL_AGENT_WORKLOAD = [
  {
    id: 1,
    name: 'Marketing Exec1',
    email: 'marketing1@gmail.com',
    assigned: 0,
    active: 0,
    dueFollowUps: 0,
    visitsToday: 0,
    converted: 0
  },
  {
    id: 2,
    name: 'Marketing Exec2',
    email: 'marketing2@gmail.com',
    assigned: 0,
    active: 0,
    dueFollowUps: 0,
    visitsToday: 0,
    converted: 0
  },
  {
    id: 3,
    name: 'Marketing Exec3',
    email: 'marketing3@gmail.com',
    assigned: 6,
    active: 6,
    dueFollowUps: 2,
    visitsToday: 0,
    converted: 0
  }
];

const RECENT_ACTIVITIES = [
  {
    id: 1,
    leadId: '#LD-183',
    leadName: 'Parth Gupta',
    source: 'Google Ads',
    sourceTone: 'purple',
    type: 'CUET',
    typeTone: 'green',
    agent: 'Marketing Exec3',
    outcome: 'Visit Scheduled',
    outcomeTone: 'blue',
    date: '26 Aug, 2026 04:01 PM'
  },
  {
    id: 2,
    leadId: '#LD-476',
    leadName: 'Aman Test 1',
    source: 'Self',
    sourceTone: 'purple',
    type: 'Marketing',
    typeTone: 'green',
    agent: 'Marketing Exec3',
    outcome: 'Interested',
    outcomeTone: 'cyan',
    date: '26 Aug, 2026 03:30 PM'
  },
  {
    id: 3,
    leadId: '#LD-476',
    leadName: 'Aman Test 1',
    source: 'Self',
    sourceTone: 'purple',
    type: 'Marketing',
    typeTone: 'green',
    agent: 'Marketing Exec3',
    outcome: 'Visit Scheduled',
    outcomeTone: 'blue',
    date: '26 Aug, 2026 03:29 PM'
  }
];

const MarketingOverview = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState(INITIAL_AGENT_WORKLOAD);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('Marketing Exec3');
  const [assignCount, setAssignCount] = useState(1);
  const [assignTarget, setAssignTarget] = useState('Marketing Exec1');
  const [assignSuccess, setAssignSuccess] = useState('');

  const handleReassign = (e) => {
    e.preventDefault();
    setAgents(prev => prev.map(ag => {
      if (ag.name === selectedAgent) {
        const nextAssigned = Math.max(0, ag.assigned - Number(assignCount));
        return { ...ag, assigned: nextAssigned, active: nextAssigned };
      }
      if (ag.name === assignTarget) {
        return { ...ag, assigned: ag.assigned + Number(assignCount), active: ag.active + Number(assignCount) };
      }
      return ag;
    }));
    setAssignSuccess(`Successfully reassigned ${assignCount} lead(s) from ${selectedAgent} to ${assignTarget}`);
    setTimeout(() => {
      setAssignSuccess('');
      setShowAssignModal(false);
    }, 1500);
  };

  return (
    <div className="mkt-overview-root">
      {/* Top Header & Breadcrumb */}
      <div className="mkt-header">
        <div className="mkt-title-area">
          <h1>Marketing Management</h1>
        </div>
        <nav className="mkt-breadcrumb">
          <Link to="/ciisUser/user-dashboard">Dashboard</Link>
          <FiChevronRight className="crumb-arrow" />
          <span>Marketing Management</span>
          <FiChevronRight className="crumb-arrow" />
          <span className="crumb-active">Overview</span>
        </nav>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="mkt-stats-grid">
        {STATS_DATA.map(stat => {
          const IconComp = stat.icon;
          return (
            <div className="mkt-stat-card" key={stat.id}>
              <div className="mkt-stat-body">
                <div className={`mkt-stat-icon-wrapper ${stat.iconBg}`}>
                  <IconComp className="mkt-stat-icon" />
                </div>
                <div className="mkt-stat-info">
                  <span className="mkt-stat-value">{stat.value}</span>
                  <span className="mkt-stat-label">{stat.label}</span>
                </div>
              </div>
              <div className="mkt-stat-badge-row">
                <span className={`mkt-badge badge-${stat.badgeTone}`}>
                  {stat.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Access Section */}
      <div className="mkt-card mkt-quick-access-card">
        <div className="mkt-card-header">
          <div>
            <h2 className="mkt-section-title">Quick Access</h2>
            <p className="mkt-section-subtitle">Navigate to Marketing monitoring sections</p>
          </div>
        </div>
        <div className="mkt-quick-access-grid">
          {QUICK_ACCESS_ITEMS.map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={idx}
                className="mkt-qa-item"
                onClick={() => navigate(item.path)}
              >
                <div className="mkt-qa-left">
                  <div className="mkt-qa-icon" style={{ backgroundColor: item.bg, color: item.color }}>
                    <ItemIcon />
                  </div>
                  <div className="mkt-qa-text">
                    <span className="mkt-qa-title">{item.title}</span>
                    <span className="mkt-qa-sub">{item.subtitle}</span>
                  </div>
                </div>
                <FiChevronRight className="mkt-qa-arrow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Section: Today's Follow-Ups & Upcoming Visits */}
      <div className="mkt-split-grid">
        {/* Today's Follow-Ups */}
        <div className="mkt-card mkt-split-card">
          <div className="mkt-split-card-header">
            <h3>Today's Follow-Ups</h3>
            <span className="mkt-pill-badge pill-amber">0 Due</span>
          </div>
          <div className="mkt-table-responsive">
            <table className="mkt-table mkt-split-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Source / Type</th>
                  <th>Agent</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="mkt-empty-cell">
                    No Marketing follow-ups scheduled today.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Visits */}
        <div className="mkt-card mkt-split-card">
          <div className="mkt-split-card-header">
            <h3>Upcoming Visits</h3>
            <span className="mkt-pill-badge pill-purple">0 Scheduled</span>
          </div>
          <div className="mkt-table-responsive">
            <table className="mkt-table mkt-split-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Agent</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="mkt-empty-cell">
                    No upcoming Marketing visits.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Marketing Agent Workload Section */}
      <div className="mkt-card">
        <div className="mkt-card-header flex-between">
          <div>
            <h2 className="mkt-section-title">Marketing Agent Workload</h2>
            <p className="mkt-section-subtitle">Team assignment and performance overview</p>
          </div>
          <button
            className="mkt-btn-primary"
            onClick={() => setShowAssignModal(true)}
          >
            <FiUserCheck /> Manage Assignments
          </button>
        </div>

        <div className="mkt-table-responsive">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>AGENT</th>
                <th>ASSIGNED</th>
                <th>ACTIVE</th>
                <th>DUE FOLLOW-UPS</th>
                <th>VISITS TODAY</th>
                <th>CONVERTED</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(ag => (
                <tr key={ag.id}>
                  <td>
                    <div className="mkt-agent-cell">
                      <span className="mkt-agent-name">{ag.name}</span>
                      <span className="mkt-agent-email">{ag.email}</span>
                    </div>
                  </td>
                  <td>{ag.assigned}</td>
                  <td>{ag.active}</td>
                  <td>{ag.dueFollowUps}</td>
                  <td>{ag.visitsToday}</td>
                  <td>{ag.converted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Marketing Activity Section */}
      <div className="mkt-card">
        <div className="mkt-card-header">
          <h2 className="mkt-section-title">Recent Marketing Activity</h2>
        </div>
        <div className="mkt-table-responsive">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>LEAD ID</th>
                <th>LEAD</th>
                <th>SOURCE</th>
                <th>TYPE</th>
                <th>AGENT</th>
                <th>OUTCOME</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ACTIVITIES.map(act => (
                <tr key={act.id}>
                  <td className="mkt-lead-id">{act.leadId}</td>
                  <td className="mkt-font-medium">{act.leadName}</td>
                  <td>
                    <span className="mkt-chip chip-purple">{act.source}</span>
                  </td>
                  <td>
                    <span className="mkt-chip chip-green">{act.type}</span>
                  </td>
                  <td>{act.agent}</td>
                  <td>
                    <span className={`mkt-chip chip-${act.outcomeTone}`}>{act.outcome}</span>
                  </td>
                  <td className="mkt-date-cell">{act.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Manage Assignments */}
      {showAssignModal && (
        <div className="mkt-modal-backdrop">
          <div className="mkt-modal">
            <div className="mkt-modal-header">
              <h3>Manage Marketing Assignments</h3>
              <button className="mkt-close-btn" onClick={() => setShowAssignModal(false)}>
                <FiX />
              </button>
            </div>
            {assignSuccess ? (
              <div className="mkt-modal-success">
                <FiCheckCircle className="mkt-success-icon" />
                <p>{assignSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleReassign} className="mkt-modal-form">
                <div className="mkt-form-group">
                  <label>Transfer From Agent</label>
                  <select
                    className="mkt-select"
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                  >
                    {agents.map(ag => (
                      <option key={ag.id} value={ag.name}>
                        {ag.name} ({ag.assigned} leads assigned)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mkt-form-group">
                  <label>Transfer To Agent</label>
                  <select
                    className="mkt-select"
                    value={assignTarget}
                    onChange={(e) => setAssignTarget(e.target.value)}
                  >
                    {agents.map(ag => (
                      <option key={ag.id} value={ag.name}>
                        {ag.name} ({ag.assigned} leads assigned)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mkt-form-group">
                  <label>Number of Leads to Transfer</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="mkt-input"
                    value={assignCount}
                    onChange={(e) => setAssignCount(e.target.value)}
                  />
                </div>
                <div className="mkt-modal-actions">
                  <button
                    type="button"
                    className="mkt-btn-secondary"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="mkt-btn-primary">
                    Reassign Leads
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingOverview;
