import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiCalendar,
  FiAlertCircle,
  FiList,
  FiEye,
  FiEdit,
  FiX,
  FiPhone,
  FiUser
} from 'react-icons/fi';
import axiosInstance from '../../utils/axiosConfig';
import './FollowUpCenter.css';

const INITIAL_FOLLOWUPS = [
  {
    id: 1,
    department: 'Marketing',
    type: ['Visit', 'Lead'],
    leadId: '#LD-476',
    institute: 'Aman Test 1',
    phone: '06789067890',
    assignedTo: 'Marketing Exec3',
    assignedRole: 'Marketing Exec',
    dueDate: '26-08-2026 12:00 PM',
    dueRelative: '6 days ago',
    status: 'Overdue',
    priority: 'High'
  },
  {
    id: 2,
    department: 'Telecaller',
    type: ['Call'],
    leadId: '#LD-454',
    institute: 'Geeta Patel',
    phone: '7450541566',
    assignedTo: 'Telecaller 1',
    assignedRole: 'Telecaller',
    dueDate: '25-08-2026 10:30 AM',
    dueRelative: '7 days ago',
    status: 'Overdue',
    priority: 'Medium'
  }
];

export default function FollowUpCenter() {
  const [followups, setFollowups] = useState(INITIAL_FOLLOWUPS);
  const [teamUsers, setTeamUsers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchFollowups = async () => {
      try {
        const [res, teamRes] = await Promise.allSettled([
          axiosInstance.get('/crm/admin/calls/follow-ups', { _skipErrorNotify: true }),
          axiosInstance.get('/crm/leads/team', { _skipErrorNotify: true })
        ]);
        if (isMounted && res.status === 'fulfilled' && Array.isArray(res.value?.data?.items)) {
          const items = res.value.data.items.map((item, idx) => ({
            id: item._id || idx + 1,
            department: 'Telecaller',
            type: [item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Call'],
            leadId: `#LD-${String(item.lead?._id || item._id).slice(-3)}`,
            institute: item.lead?.name || 'Lead',
            phone: item.lead?.phone || '—',
            assignedTo: item.agent?.name || 'Telecaller',
            assignedRole: 'Telecaller',
            dueDate: item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + (item.time ? ` ${item.time}` : '') : '—',
            dueRelative: item.date && new Date(item.date) < new Date() ? 'Overdue' : 'Upcoming',
            status: item.status === 'completed' ? 'Completed' : (item.date && new Date(item.date) < new Date() ? 'Overdue' : 'Pending'),
            priority: item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Medium'
          }));
          if (items.length > 0) {
            setFollowups(items);
          }
        }
        if (isMounted && teamRes.status === 'fulfilled' && Array.isArray(teamRes.value?.data?.users)) {
          setTeamUsers(teamRes.value.data.users);
        }
      } catch (err) {}
    };
    fetchFollowups();
    return () => { isMounted = false; };
  }, []);
  
  // Filter States
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [assignedFilter, setAssignedFilter] = useState('All Users');
  const [scheduleFilter, setScheduleFilter] = useState('All Pending');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('2026-09-01');

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter handlers
  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setDeptFilter('All Departments');
    setTypeFilter('All Types');
    setAssignedFilter('All Users');
    setScheduleFilter('All Pending');
    setDateFrom('');
    setDateTo('2026-09-01');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filtered List
  const filteredData = useMemo(() => {
    return followups.filter((item) => {
      // Department
      if (deptFilter !== 'All Departments' && item.department !== deptFilter) {
        return false;
      }
      // Type
      if (typeFilter !== 'All Types') {
        const hasType = item.type.some(t => t.toLowerCase() === typeFilter.toLowerCase());
        if (!hasType) return false;
      }
      // Assigned To
      if (assignedFilter !== 'All Users' && !item.assignedTo.includes(assignedFilter)) {
        return false;
      }
      // Schedule
      if (scheduleFilter === 'Overdue' && item.status !== 'Overdue') {
        return false;
      }
      if (scheduleFilter === 'Today' && item.dueRelative !== 'Today') {
        return false;
      }
      // Search
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matches =
          item.leadId.toLowerCase().includes(query) ||
          item.institute.toLowerCase().includes(query) ||
          item.phone.toLowerCase().includes(query) ||
          item.assignedTo.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [followups, deptFilter, typeFilter, assignedFilter, scheduleFilter, searchTerm]);

  // Pagination calculation
  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirst, indexOfLast);

  // Stats calculation
  const stats = useMemo(() => {
    const todayCount = followups.filter(f => f.dueRelative === 'Today').length;
    const tomorrowCount = followups.filter(f => f.dueRelative === 'Tomorrow').length;
    const upcomingCount = followups.filter(f => f.status === 'Upcoming').length;
    const overdueCount = followups.filter(f => f.status === 'Overdue').length;
    const totalPendingCount = followups.length;

    return {
      today: todayCount,
      tomorrow: tomorrowCount,
      upcoming: upcomingCount,
      overdue: overdueCount,
      totalPending: totalPendingCount
    };
  }, [followups]);

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="fuc-root">
      {/* Top Header */}
      <div className="fuc-header">
        <div>
          <h1>Follow-Up Center</h1>
          <p className="fuc-subtitle">Telecaller and Marketing follow-ups in one place</p>
        </div>
        <nav className="fuc-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <FiChevronRight className="fuc-crumb-arrow" />
          <span>Follow-Ups</span>
        </nav>
      </div>

      {/* Stats Cards Row */}
      <div className="fuc-stats-grid">
        <div className="fuc-stat-card">
          <div className="fuc-stat-info">
            <span className="fuc-stat-label">Today's Follow-ups</span>
            <span className="fuc-stat-value fuc-color-blue">{stats.today}</span>
          </div>
          <div className="fuc-stat-icon-wrap fuc-bg-purple-light">
            <FiCalendar className="fuc-icon-purple" />
          </div>
        </div>

        <div className="fuc-stat-card">
          <div className="fuc-stat-info">
            <span className="fuc-stat-label">Tomorrow</span>
            <span className="fuc-stat-value fuc-color-blue">{stats.tomorrow}</span>
          </div>
          <div className="fuc-stat-icon-wrap fuc-bg-cyan-light">
            <FiCalendar className="fuc-icon-cyan" />
          </div>
        </div>

        <div className="fuc-stat-card">
          <div className="fuc-stat-info">
            <span className="fuc-stat-label">Upcoming</span>
            <span className="fuc-stat-value fuc-color-green">{stats.upcoming}</span>
          </div>
          <div className="fuc-stat-icon-wrap fuc-bg-green-light">
            <FiCalendar className="fuc-icon-green" />
          </div>
        </div>

        <div className="fuc-stat-card">
          <div className="fuc-stat-info">
            <span className="fuc-stat-label">Overdue</span>
            <span className="fuc-stat-value fuc-color-red">{stats.overdue}</span>
          </div>
          <div className="fuc-stat-icon-wrap fuc-bg-red-light">
            <FiAlertCircle className="fuc-icon-red" />
          </div>
        </div>

        <div className="fuc-stat-card">
          <div className="fuc-stat-info">
            <span className="fuc-stat-label">Total Pending</span>
            <span className="fuc-stat-value fuc-color-blue">{stats.totalPending}</span>
          </div>
          <div className="fuc-stat-icon-wrap fuc-bg-blue-light">
            <FiList className="fuc-icon-blue" />
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="fuc-card fuc-filter-card">
        <div className="fuc-filter-grid">
          <div className="fuc-field">
            <label>Department</label>
            <select
              className="fuc-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="All Departments">All Departments</option>
              <option value="Marketing">Marketing</option>
              <option value="Telecaller">Telecaller</option>
            </select>
          </div>

          <div className="fuc-field">
            <label>Follow-up Type</label>
            <select
              className="fuc-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="Visit">Visit</option>
              <option value="Lead">Lead</option>
              <option value="Call">Call</option>
            </select>
          </div>

          <div className="fuc-field">
            <label>Assigned To</label>
            <select
              className="fuc-select"
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
            >
              <option value="All Users">All Users</option>
              {Array.from(new Set([
                ...(teamUsers.map(u => u.name).filter(Boolean)),
                ...(followups.map(f => f.assignedTo).filter(Boolean))
              ])).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="fuc-field">
            <label>Schedule</label>
            <select
              className="fuc-select"
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
            >
              <option value="All Pending">All Pending</option>
              <option value="Today">Today</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="fuc-field">
            <label>Date From</label>
            <input
              type="date"
              className="fuc-input"
              placeholder="DD-MM-YYYY"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="fuc-field">
            <label>Date To</label>
            <input
              type="date"
              className="fuc-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="fuc-filter-actions">
            <button className="fuc-btn-apply" onClick={handleApplyFilter}>
              <FiFilter /> Apply
            </button>
            <button className="fuc-btn-reset" title="Reset Filters" onClick={handleResetFilter}>
              <FiRotateCcw />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="fuc-card">
        <div className="fuc-table-header">
          <div>
            <h2 className="fuc-table-title">Unified Follow-Up List</h2>
            <span className="fuc-table-subtitle">{filteredData.length} pending records</span>
          </div>
          <div className="fuc-dept-tags">
            <span className="fuc-badge-telecaller">Telecaller</span>
            <span className="fuc-badge-marketing">Marketing</span>
          </div>
        </div>

        {/* Datatable Controls */}
        <div className="fuc-table-controls">
          <div className="fuc-entries-control">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="fuc-select-small"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="fuc-search-control">
            <span>Search:</span>
            <input
              type="text"
              className="fuc-input-search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="fuc-table-wrapper">
          <table className="fuc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>DEPARTMENT</th>
                <th>TYPE</th>
                <th>LEAD ID</th>
                <th>LEAD / INSTITUTE</th>
                <th>PHONE</th>
                <th>ASSIGNED TO</th>
                <th>DUE DATE</th>
                <th>STATUS</th>
                <th>PRIORITY</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.length > 0 ? (
                currentEntries.map((row, index) => (
                  <tr key={row.id}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>
                      <span className={`fuc-dept-pill ${row.department === 'Marketing' ? 'fuc-dept-mkt' : 'fuc-dept-tc'}`}>
                        {row.department}
                      </span>
                    </td>
                    <td>
                      <div className="fuc-type-pills">
                        {row.type.map((t, idx) => (
                          <span
                            key={idx}
                            className={`fuc-type-pill ${t === 'Visit' ? 'fuc-type-visit' : t === 'Lead' ? 'fuc-type-lead' : 'fuc-type-call'}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="fuc-lead-id">{row.leadId}</td>
                    <td className="fuc-bold">{row.institute}</td>
                    <td>{row.phone}</td>
                    <td>
                      <div>
                        <div className="fuc-bold">{row.assignedTo}</div>
                        <div className="fuc-subtext">{row.assignedRole}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fuc-date-due">{row.dueDate}</div>
                        <div className="fuc-subtext">{row.dueRelative}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`fuc-status-pill ${row.status === 'Overdue' ? 'fuc-status-overdue' : 'fuc-status-upcoming'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <span className={`fuc-priority-text ${row.priority === 'High' ? 'fuc-prio-high' : 'fuc-prio-med'}`}>
                        {row.priority}
                      </span>
                    </td>
                    <td>
                      <div className="fuc-action-group">
                        <button
                          className="fuc-action-btn fuc-btn-cyan"
                          title="View Details"
                          onClick={() => handleOpenModal(row)}
                        >
                          <FiEye />
                        </button>
                        <button
                          className="fuc-action-btn fuc-btn-purple"
                          title="Edit Follow-up"
                          onClick={() => handleOpenModal(row)}
                        >
                          <FiEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="fuc-empty">
                    No follow-ups found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="fuc-table-footer">
          <div className="fuc-showing-info">
            Showing {totalEntries === 0 ? 0 : indexOfFirst + 1} to{' '}
            {Math.min(indexOfLast, totalEntries)} of {totalEntries} entries
          </div>

          <div className="fuc-pagination">
            <button
              className="fuc-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              &laquo;
            </button>
            <button
              className="fuc-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`fuc-page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="fuc-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              &gt;
            </button>
            <button
              className="fuc-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedItem && (
        <div className="fuc-modal-overlay">
          <div className="fuc-modal-card">
            <div className="fuc-modal-header">
              <h3>Follow-Up Details ({selectedItem.leadId})</h3>
              <button className="fuc-modal-close" onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>
            <div className="fuc-modal-body">
              <div className="fuc-modal-grid">
                <div>
                  <strong>Lead / Institute:</strong> {selectedItem.institute}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedItem.phone}
                </div>
                <div>
                  <strong>Department:</strong> {selectedItem.department}
                </div>
                <div>
                  <strong>Type:</strong> {selectedItem.type.join(', ')}
                </div>
                <div>
                  <strong>Assigned To:</strong> {selectedItem.assignedTo} ({selectedItem.assignedRole})
                </div>
                <div>
                  <strong>Due Date:</strong> {selectedItem.dueDate} ({selectedItem.dueRelative})
                </div>
                <div>
                  <strong>Status:</strong> {selectedItem.status}
                </div>
                <div>
                  <strong>Priority:</strong> {selectedItem.priority}
                </div>
              </div>
            </div>
            <div className="fuc-modal-footer">
              <button className="fuc-btn-secondary" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
