import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Phone,
  MapPin,
  TrendingUp,
  Clock,
  UserCheck,
  ChevronRight,
  Award,
  Crown,
  BarChart2,
  PhoneCall,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUpIcon,
  Search,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  Filter,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import './ReportsOverview.css';

const initialTeamData = [
  { id: 1, name: 'Marketing Exec1', role: 'Marketing Exec', calls: 0, visits: 0, leads: 0, converted: 0, convRate: '0%' },
  { id: 2, name: 'Marketing Exec2', role: 'Marketing Exec', calls: 0, visits: 0, leads: 0, converted: 0, convRate: '0%' },
  { id: 3, name: 'Marketing Exec3', role: 'Marketing Exec', calls: 0, visits: 2, leads: 6, converted: 0, convRate: '0%' },
  { id: 4, name: 'Telecaller 1', role: 'Telecaller', calls: 2, visits: 0, leads: 3, converted: 1, convRate: '33.3%' },
  { id: 5, name: 'Telecaller 2', role: 'Telecaller', calls: 0, visits: 0, leads: 9, converted: 0, convRate: '0%' },
  { id: 6, name: 'Telecaller 3', role: 'Telecaller', calls: 0, visits: 0, leads: 0, converted: 0, convRate: '0%' },
];

const topPerformers = [
  { rank: '#1', name: 'Telecaller 1', role: 'Telecaller', rate: '33.3% conversion rate', crown: true },
  { rank: '#2', name: 'Marketing Exec1', role: 'Marketing Exec', rate: '0% conversion rate', crown: false },
  { rank: '#3', name: 'Marketing Exec2', role: 'Marketing Exec', rate: '0% conversion rate', crown: false },
  { rank: '#4', name: 'Marketing Exec3', role: 'Marketing Exec', rate: '0% conversion rate', crown: false },
  { rank: '#5', name: 'Telecaller 2', role: 'Telecaller', rate: '0% conversion rate', crown: false },
];

export default function ReportsOverview() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTeam = useMemo(() => {
    return initialTeamData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredTeam.length / entriesPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredTeam.slice(start, start + entriesPerPage);
  }, [filteredTeam, currentPage, entriesPerPage]);

  return (
    <div className="cr-reports-container">
      {/* Header & Breadcrumb */}
      <div className="cr-header-row">
        <div>
          <h1 className="cr-page-title">Reports & Analytics</h1>
          <p className="cr-page-sub">Comprehensive overview of performance metrics and analytics</p>
        </div>
        <div className="cr-breadcrumb-area">
          <div className="cr-live-badge">
            <span className="cr-live-dot"></span> Live data - 01 Sep, 2026
          </div>
          <div className="cr-breadcrumb">
            <Link to="/ciisUser/user-dashboard">Dashboard</Link>
            <span className="cr-bc-sep">&gt;</span>
            <span>Reports</span>
            <span className="cr-bc-sep">&gt;</span>
            <span className="cr-bc-active">Overview</span>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="cr-kpi-grid cr-kpi-grid-6">
        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-info">
              <span className="cr-kpi-label" title="Total Leads">Total Leads</span>
              <div className="cr-kpi-value">295</div>
            </div>
            <div className="cr-kpi-icon cr-icon-purple">
              <Users size={18} />
            </div>
          </div>
          <div className="cr-kpi-trend cr-trend-down" title="↓ 99.7% from last week">
            <span className="cr-trend-badge">↓ 99.7%</span>
            <span>from last week</span>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-info">
              <span className="cr-kpi-label" title="Total Calls">Total Calls</span>
              <div className="cr-kpi-value">2</div>
            </div>
            <div className="cr-kpi-icon cr-icon-green">
              <Phone size={18} />
            </div>
          </div>
          <div className="cr-kpi-trend cr-trend-down" title="↓ 100% from last week">
            <span className="cr-trend-badge">↓ 100%</span>
            <span>from last week</span>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-info">
              <span className="cr-kpi-label" title="Today's Visits">Today's Visits</span>
              <div className="cr-kpi-value">0</div>
            </div>
            <div className="cr-kpi-icon cr-icon-orange">
              <MapPin size={18} />
            </div>
          </div>
          <div className="cr-kpi-trend cr-trend-up" title="↑ 0 from yesterday">
            <span className="cr-trend-badge">↑ 0</span>
            <span>from yesterday</span>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-info">
              <span className="cr-kpi-label" title="Conversion Rate">Conversion Rate</span>
              <div className="cr-kpi-value">0%</div>
            </div>
            <div className="cr-kpi-icon cr-icon-cyan">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="cr-kpi-trend cr-trend-down" title="↓ 0.3% from last week">
            <span className="cr-trend-badge">↓ 0.3%</span>
            <span>from last week</span>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-info">
              <span className="cr-kpi-label" title="Pending Follow-ups">Pending Follow-ups</span>
              <div className="cr-kpi-value">0</div>
            </div>
            <div className="cr-kpi-icon cr-icon-red">
              <Clock size={18} />
            </div>
          </div>
          <div className="cr-kpi-trend cr-trend-up" title="↑ 0 from yesterday">
            <span className="cr-trend-badge">↑ 0</span>
            <span>from yesterday</span>
          </div>
        </div>

        <div className="cr-kpi-card">
          <div className="cr-kpi-top">
            <div className="cr-kpi-info">
              <span className="cr-kpi-label" title="Active Users">Active Users</span>
              <div className="cr-kpi-value">7</div>
            </div>
            <div className="cr-kpi-icon cr-icon-blue">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="cr-kpi-trend cr-trend-up" title="↑ 5 from last week">
            <span className="cr-trend-badge">↑ 5</span>
            <span>from last week</span>
          </div>
        </div>
      </div>

      {/* Report Categories Section */}
      <div className="cr-section-box">
        <div className="cr-section-header">
          <Layers size={18} className="cr-sec-icon" />
          <div>
            <h2 className="cr-section-title">Report Categories</h2>
            <p className="cr-section-desc">Select a category to view its detailed live report.</p>
          </div>
        </div>

        <div className="cr-categories-grid">
          <div className="cr-cat-card" onClick={() => navigate('/ciisUser/crm/reports/leads')}>
            <div className="cr-cat-icon cr-icon-purple">
              <Users size={20} />
            </div>
            <div className="cr-cat-content">
              <h3>Lead Reports</h3>
              <p>Lead source, status, and pipeline analysis.</p>
            </div>
            <ChevronRight size={18} className="cr-cat-arrow" />
          </div>

          <div className="cr-cat-card" onClick={() => navigate('/ciisUser/crm/reports/calls')}>
            <div className="cr-cat-icon cr-icon-green">
              <PhoneCall size={20} />
            </div>
            <div className="cr-cat-content">
              <h3>Call Reports</h3>
              <p>Call volume, outcomes, and activity details.</p>
            </div>
            <ChevronRight size={18} className="cr-cat-arrow" />
          </div>

          <div className="cr-cat-card" onClick={() => navigate('/ciisUser/crm/reports/visits')}>
            <div className="cr-cat-icon cr-icon-orange">
              <MapPin size={20} />
            </div>
            <div className="cr-cat-content">
              <h3>Visit Reports</h3>
              <p>Visit completion, outcomes, and field performance.</p>
            </div>
            <ChevronRight size={18} className="cr-cat-arrow" />
          </div>

          <div className="cr-cat-card" onClick={() => navigate('/ciisUser/crm/reports/team-performance')}>
            <div className="cr-cat-icon cr-icon-blue">
              <Users size={20} />
            </div>
            <div className="cr-cat-content">
              <h3>Team Performance</h3>
              <p>Individual KPIs, conversion rates, and rankings.</p>
            </div>
            <ChevronRight size={18} className="cr-cat-arrow" />
          </div>

          <div className="cr-cat-card" onClick={() => navigate('/ciisUser/crm/reports/leads')}>
            <div className="cr-cat-icon cr-icon-cyan">
              <UserCheck size={20} />
            </div>
            <div className="cr-cat-content">
              <h3>Assignment Reports</h3>
              <p>Workload distribution and assignment history.</p>
            </div>
            <ChevronRight size={18} className="cr-cat-arrow" />
          </div>

          <div className="cr-cat-card" onClick={() => navigate('/ciisUser/crm/reports/follow-ups')}>
            <div className="cr-cat-icon cr-icon-red">
              <Calendar size={20} />
            </div>
            <div className="cr-cat-content">
              <h3>Follow-up Reports</h3>
              <p>Pending, completed, and overdue follow-ups.</p>
            </div>
            <ChevronRight size={18} className="cr-cat-arrow" />
          </div>

          <div className="cr-cat-card" onClick={() => navigate('/ciisUser/crm/reports/conversion-funnel')}>
            <div className="cr-cat-icon cr-icon-cyan">
              <BarChart2 size={20} />
            </div>
            <div className="cr-cat-content">
              <h3>Conversion Funnel</h3>
              <p>Lead-to-conversion analysis and drop-offs.</p>
            </div>
            <ChevronRight size={18} className="cr-cat-arrow" />
          </div>

          <div className="cr-cat-card" onClick={() => navigate('/ciisUser/crm/reports/user-activity')}>
            <div className="cr-cat-icon cr-icon-blue">
              <Activity size={20} />
            </div>
            <div className="cr-cat-content">
              <h3>User Activity</h3>
              <p>Login activity and user engagement metrics.</p>
            </div>
            <ChevronRight size={18} className="cr-cat-arrow" />
          </div>
        </div>
      </div>

      {/* Bottom Row: Team Performance Overview + Top Performers */}
      <div className="cr-bottom-grid">
        {/* Left: Team Performance Overview Table */}
        <div className="cr-card-box">
          <div className="cr-card-header">
            <div className="cr-card-h-left">
              <Users size={18} className="cr-sec-icon" />
              <h3>Team Performance Overview</h3>
            </div>
            <button
              className="cr-btn-view-full"
              onClick={() => navigate('/ciisUser/crm/reports/team-performance')}
            >
              View Full Report
            </button>
          </div>

          <div className="cr-table-controls">
            <div className="cr-entries-select">
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>entries per page</span>
            </div>
            <div className="cr-search-box">
              <span>Search:</span>
              <input
                type="text"
                placeholder=""
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="cr-table-responsive">
            <table className="cr-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Role</th>
                  <th>Calls</th>
                  <th>Visits</th>
                  <th>Leads</th>
                  <th>Converted</th>
                  <th>Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="cr-user-cell">
                        <div className="cr-avatar">{row.name.charAt(0)}</div>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cr-badge-role">{row.role}</span>
                    </td>
                    <td>{row.calls}</td>
                    <td>{row.visits}</td>
                    <td>{row.leads}</td>
                    <td>{row.converted}</td>
                    <td>
                      <span className={`cr-badge-conv ${parseFloat(row.convRate) > 0 ? 'cr-conv-high' : ''}`}>
                        {row.convRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cr-table-footer">
            <div className="cr-info-text">
              Showing 1 to {currentData.length} of {filteredTeam.length} entries
            </div>
            <div className="cr-pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>&laquo;</button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&lt;</button>
              <button className="cr-page-active">{currentPage}</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&gt;</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>&raquo;</button>
            </div>
          </div>
        </div>

        {/* Right: Top Performers List */}
        <div className="cr-card-box">
          <div className="cr-card-header">
            <div className="cr-card-h-left">
              <Crown size={18} className="cr-sec-icon-gold" />
              <h3>Top Performers</h3>
            </div>
          </div>

          <div className="cr-performers-list">
            {topPerformers.map((item, idx) => (
              <div key={idx} className="cr-performer-item">
                <div className="cr-perf-left">
                  <div className={`cr-perf-icon-box ${item.crown ? 'cr-crown-gold' : 'cr-crown-blue'}`}>
                    {item.crown ? <Crown size={18} /> : <Award size={18} />}
                  </div>
                  <div>
                    <h4 className="cr-perf-name">{item.name}</h4>
                    <p className="cr-perf-role">{item.role}</p>
                    <span className="cr-perf-rate">{item.rate}</span>
                  </div>
                </div>
                <div className={`cr-rank-tag ${item.crown ? 'cr-rank-1' : 'cr-rank-other'}`}>
                  {item.rank}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

