import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiChevronRight,
  FiUserX,
  FiUserCheck,
  FiUsers,
  FiBarChart2,
  FiUploadCloud,
  FiPieChart,
  FiClock,
  FiChevronRight as FiArrowRight,
  FiUserPlus,
  FiX
} from 'react-icons/fi';
import './AssignmentsOverview.css';

const INITIAL_UNASSIGNED = [
  {
    id: 1,
    leadId: '#LD-454',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Geeta Patel',
    subtitle: 'Website inquiry',
    gender: 'Female',
    email: 'geeta.patel96@outlook.com',
    phone: '7450541566',
    address: 'Rajkot',
    created: '18 Aug 2026'
  },
  {
    id: 2,
    leadId: '#LD-455',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Kiran Singh',
    subtitle: 'Wants demo class',
    gender: 'Male',
    email: 'kiran.singh35@rediffmail.com',
    phone: '8849825449',
    address: 'Gwalior',
    created: '19 Aug 2026'
  },
  {
    id: 3,
    leadId: '#LD-456',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Siddharth Yadav',
    subtitle: 'Interested in Medical',
    gender: 'Male',
    email: 'siddharth.yadav28@outlook.com',
    phone: '6080132677',
    address: 'Hyderabad',
    created: '20 Aug 2026'
  },
  {
    id: 4,
    leadId: '#LD-457',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Mahesh Nambiar',
    subtitle: 'Interested in NEET',
    gender: 'Male',
    email: 'mahesh.nambiar18@rediffmail.com',
    phone: '6919657013',
    address: 'Trivandrum',
    created: '20 Aug 2026'
  },
  {
    id: 5,
    leadId: '#LD-458',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Pooja Nambiar',
    subtitle: 'Budget conscious',
    gender: 'Female',
    email: 'pooja.nambiar32@yahoo.com',
    phone: '8317139005',
    address: 'Chandigarh',
    created: '21 Jul 2026'
  },
  {
    id: 6,
    leadId: '#LD-459',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Rekha Uppal',
    subtitle: 'Interested in MBA',
    gender: 'Female',
    email: 'rekha.uppal95@hotmail.com',
    phone: '9431527420',
    address: 'Ghaziabad',
    created: '22 Jul 2026'
  },
  {
    id: 7,
    leadId: '#LD-423',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Rishabh Jha',
    subtitle: 'Wants demo class',
    gender: 'Male',
    email: 'rishabh.jha45@rediffmail.com',
    phone: '9865086376',
    address: 'Shimla',
    created: '25 Jul 2026'
  },
  {
    id: 8,
    leadId: '#LD-424',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Pallavi Lal',
    subtitle: 'Needs study material',
    gender: 'Female',
    email: 'pallavi.lal92@hotmail.com',
    phone: '7398680002',
    address: 'Coimbatore',
    created: '25 Jul 2026'
  },
  {
    id: 9,
    leadId: '#LD-425',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Varun Uppal',
    subtitle: 'Follow up needed',
    gender: 'Male',
    email: 'varun.uppal48@outlook.com',
    phone: '7132370589',
    address: 'Guwahati',
    created: '25 Jul 2026'
  },
  {
    id: 10,
    leadId: '#LD-426',
    source: 'School Visit',
    type: 'Counselling',
    name: 'Eshan Wadhwa',
    subtitle: 'Needs study material',
    gender: 'Male',
    email: 'eshan.wadhwa66@outlook.com',
    phone: '7258713971',
    address: 'Hyderabad',
    created: '27 Jul 2026'
  }
];

const RECENT_ASSIGNMENTS = [
  {
    id: 1,
    leadId: '#LD-476',
    assignedTo: 'Marketing Exec3',
    time: '5 days ago',
    performedBy: 'Marketing Exec3',
    initials: 'MA'
  },
  {
    id: 2,
    leadId: '#N/A',
    assignedTo: 'Marketing Exec3',
    time: '5 days ago',
    performedBy: 'Marketing Exec3',
    initials: 'MA'
  },
  {
    id: 3,
    leadId: '#N/A',
    assignedTo: 'Marketing Exec3',
    time: '5 days ago',
    performedBy: 'Marketing Exec3',
    initials: 'MA'
  }
];

export default function AssignmentsOverview() {
  const navigate = useNavigate();

  const [unassignedLeads, setUnassignedLeads] = useState(INITIAL_UNASSIGNED);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Quick Assign Modal State
  const [assignModalLead, setAssignModalLead] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  // Filter leads by search query
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return unassignedLeads;
    const query = searchTerm.toLowerCase();
    return unassignedLeads.filter(
      item =>
        item.leadId.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.phone.toLowerCase().includes(query) ||
        item.address.toLowerCase().includes(query)
    );
  }, [unassignedLeads, searchTerm]);

  // Pagination calculation
  const totalEntries = 277; // Matching screenshot total count
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = filteredData.slice(0, entriesPerPage);

  const handleAssignClick = (lead) => {
    setAssignModalLead(lead);
    setSelectedAgent('');
  };

  const handleConfirmAssign = () => {
    if (!selectedAgent) return;
    setUnassignedLeads(prev => prev.filter(item => item.id !== assignModalLead.id));
    setAssignModalLead(null);
  };

  return (
    <div className="aso-root">
      {/* Page Header */}
      <div className="aso-header">
        <div>
          <h1>Assignment Center</h1>
        </div>
        <nav className="aso-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight className="aso-crumb-arrow" />
          <span>Assignments</span>
        </nav>
      </div>

      {/* Stat Cards Row */}
      <div className="aso-stats-grid">
        <div className="aso-stat-card">
          <div className="aso-stat-info">
            <span className="aso-stat-label">Unassigned Leads</span>
            <span className="aso-stat-value">277</span>
          </div>
          <div className="aso-stat-icon-wrap aso-bg-red">
            <FiUserX className="aso-icon-red" />
          </div>
        </div>

        <div className="aso-stat-card">
          <div className="aso-stat-info">
            <span className="aso-stat-label">Assigned Leads</span>
            <span className="aso-stat-value">18</span>
          </div>
          <div className="aso-stat-icon-wrap aso-bg-green">
            <FiUserCheck className="aso-icon-green" />
          </div>
        </div>

        <div className="aso-stat-card">
          <div className="aso-stat-info">
            <span className="aso-stat-label">Active Agents</span>
            <span className="aso-stat-value">6</span>
          </div>
          <div className="aso-stat-icon-wrap aso-bg-purple">
            <FiUsers className="aso-icon-purple" />
          </div>
        </div>

        <div className="aso-stat-card">
          <div className="aso-stat-info">
            <span className="aso-stat-label">Avg. Per Agent</span>
            <span className="aso-stat-value">3</span>
          </div>
          <div className="aso-stat-icon-wrap aso-bg-blue">
            <FiBarChart2 className="aso-icon-blue" />
          </div>
        </div>
      </div>

      {/* Top 2 Columns Section */}
      <div className="aso-top-grid">
        {/* Quick Actions Card */}
        <div className="aso-card aso-quick-card">
          <div className="aso-card-title-wrap">
            <h2>Quick Actions</h2>
            <span className="aso-card-sub">Assignment operations</span>
          </div>

          <div className="aso-action-list">
            <div
              className="aso-action-item"
              onClick={() => navigate('/ciisUser/crm/admin/assignment-bulk')}
            >
              <div className="aso-action-icon-box aso-box-blue">
                <FiUploadCloud />
              </div>
              <div className="aso-action-text">
                <h3>Bulk Assign</h3>
                <p>Assign multiple leads at once</p>
              </div>
              <FiArrowRight className="aso-action-arrow" />
            </div>

            <div
              className="aso-action-item"
              onClick={() => navigate('/ciisUser/crm/admin/workload')}
            >
              <div className="aso-action-icon-box aso-box-purple">
                <FiPieChart />
              </div>
              <div className="aso-action-text">
                <h3>Workload View</h3>
                <p>See team workload distribution</p>
              </div>
              <FiArrowRight className="aso-action-arrow" />
            </div>

            <div
              className="aso-action-item"
              onClick={() => navigate('/ciisUser/crm/admin/assignment-history')}
            >
              <div className="aso-action-icon-box aso-box-orange">
                <FiClock />
              </div>
              <div className="aso-action-text">
                <h3>Assignment History</h3>
                <p>View assignment audit log history</p>
              </div>
              <FiArrowRight className="aso-action-arrow" />
            </div>
          </div>
        </div>

        {/* Recent Assignments Card */}
        <div className="aso-card aso-recent-card">
          <div className="aso-card-title-wrap">
            <h2>
              <FiClock className="aso-recent-clock-icon" /> Recent Assignments
            </h2>
          </div>

          <div className="aso-recent-list">
            {RECENT_ASSIGNMENTS.map((item) => (
              <div key={item.id} className="aso-recent-item">
                <div className="aso-recent-avatar">{item.initials}</div>
                <div className="aso-recent-details">
                  <div className="aso-recent-main">
                    <span>Lead </span>
                    <span className="aso-lead-tag">{item.leadId}</span>
                    <span> assigned to </span>
                    <span className="aso-agent-link">{item.assignedTo}</span>
                  </div>
                  <div className="aso-recent-sub">Performed by {item.performedBy}</div>
                </div>
                <div className="aso-recent-time">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unassigned Leads Table Card */}
      <div className="aso-card">
        <div className="aso-table-header">
          <h2>Unassigned Leads</h2>
          <button
            className="aso-btn-bulk"
            onClick={() => navigate('/ciisUser/crm/admin/assignment-bulk')}
          >
            <FiUploadCloud /> Bulk Assign
          </button>
        </div>

        {/* Controls */}
        <div className="aso-table-controls">
          <div className="aso-entries-control">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="aso-select-small"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="aso-search-control">
            <span>Search:</span>
            <input
              type="text"
              className="aso-input-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="aso-table-wrapper">
          <table className="aso-table">
            <thead>
              <tr>
                <th>SL NO.</th>
                <th>LEAD ID</th>
                <th>LEAD SOURCE</th>
                <th>LEAD TYPE</th>
                <th>NAME</th>
                <th>GENDER</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>ADDRESS</th>
                <th>CREATED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((row, index) => (
                <tr key={row.id}>
                  <td>{indexOfFirst + index + 1}</td>
                  <td className="aso-lead-id">{row.leadId}</td>
                  <td>
                    <span className="aso-pill-source">{row.source}</span>
                  </td>
                  <td>
                    <span className="aso-pill-type">{row.type}</span>
                  </td>
                  <td>
                    <div>
                      <div className="aso-name">{row.name}</div>
                      <div className="aso-sub">{row.subtitle}</div>
                    </div>
                  </td>
                  <td>{row.gender}</td>
                  <td>{row.email}</td>
                  <td>{row.phone}</td>
                  <td>{row.address}</td>
                  <td>{row.created}</td>
                  <td>
                    <button
                      className="aso-btn-assign"
                      title="Assign Lead"
                      onClick={() => handleAssignClick(row)}
                    >
                      <FiUserPlus />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="aso-table-footer">
          <div className="aso-showing-info">
            Showing 1 to {currentEntries.length} of 277 entries
          </div>
          <div className="aso-pagination">
            <button className="aso-page-btn">&laquo;</button>
            <button className="aso-page-btn">&lt;</button>
            <button className="aso-page-btn active">1</button>
            <button className="aso-page-btn">2</button>
            <button className="aso-page-btn">3</button>
            <button className="aso-page-btn">4</button>
            <button className="aso-page-btn">5</button>
            <span>...</span>
            <button className="aso-page-btn">28</button>
            <button className="aso-page-btn">&gt;</button>
            <button className="aso-page-btn">&raquo;</button>
          </div>
        </div>
      </div>

      {/* Assign Single Lead Modal */}
      {assignModalLead && (
        <div className="aso-modal-overlay">
          <div className="aso-modal-card">
            <div className="aso-modal-header">
              <h3>Assign Lead ({assignModalLead.leadId})</h3>
              <button
                className="aso-modal-close"
                onClick={() => setAssignModalLead(null)}
              >
                <FiX />
              </button>
            </div>
            <div className="aso-modal-body">
              <p className="aso-modal-lead-name">
                Assign <strong>{assignModalLead.name}</strong> ({assignModalLead.phone}) to an agent:
              </p>
              <div className="aso-field">
                <label>Select Agent</label>
                <select
                  className="aso-select"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                >
                  <option value="">Choose Agent...</option>
                  <option value="Marketing Exec3">Marketing Exec3</option>
                  <option value="Telecaller 1">Telecaller 1</option>
                  <option value="Telecaller 2">Telecaller 2</option>
                  <option value="Telecaller 3">Telecaller 3</option>
                </select>
              </div>
            </div>
            <div className="aso-modal-footer">
              <button
                className="aso-btn-cancel"
                onClick={() => setAssignModalLead(null)}
              >
                Cancel
              </button>
              <button
                className="aso-btn-confirm"
                disabled={!selectedAgent}
                onClick={handleConfirmAssign}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
