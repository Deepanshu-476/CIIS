import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiX
} from 'react-icons/fi';
import './CrmUsersList.css';

const initialUsers = [
  { id: 1, slNo: '001', name: 'Marketing Exec3', email: 'marketing3@gmail.com', phone: '6666666666', userType: 'Marketing Exec', status: 'Active' },
  { id: 2, slNo: '002', name: 'Marketing Exec2', email: 'marketing2@gmail.com', phone: '6666666666', userType: 'Marketing Exec', status: 'Active' },
  { id: 3, slNo: '003', name: 'Marketing Exec1', email: 'marketing1@gmail.com', phone: '5555555555', userType: 'Marketing Exec', status: 'Active' },
  { id: 4, slNo: '004', name: 'Telecaller 3', email: 'telecall3@gmail.com', phone: '3333333333', userType: 'Telecaller', status: 'Active' },
  { id: 5, slNo: '005', name: 'Telecaller 2', email: 'telecall2@gmail.com', phone: '2222222222', userType: 'Telecaller', status: 'Active' },
  { id: 6, slNo: '006', name: 'Telecaller 1', email: 'telecall1@gmail.com', phone: '9999999999', userType: 'Telecaller', status: 'Active' },
  { id: 7, slNo: '007', name: 'Admin', email: 'admin@haps.com', phone: '9999999999', userType: 'Admin', status: 'Active' },
];

export default function CrmUsersList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalData, setEditModalData] = useState(null);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.phone.includes(q) ||
      user.userType.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Pagination
  const totalEntries = filteredUsers.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const displayedUsers = filteredUsers.slice(startIndex, startIndex + entriesPerPage);

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editModalData) return;
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const userType = String(formData.get('userType') || 'Telecaller').trim();
    const status = String(formData.get('status') || 'Active').trim();

    if (!name || !email) return;

    setUsers(prev =>
      prev.map(u =>
        u.id === editModalData.id
          ? { ...u, name, email, phone, userType, status }
          : u
      )
    );
    setEditModalData(null);
  };

  return (
    <div className="cul-root">
      {/* Header & Breadcrumb */}
      <div className="cul-page-header">
        <h1 className="cul-page-title">Users</h1>
        <div className="cul-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <span className="separator">&gt;</span>
          <Link to="/ciisUser/crm/admin/team">Team</Link>
          <span className="separator">&gt;</span>
          <span className="active">Users</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="cul-card">
        {/* Card Top Title & Action Button */}
        <div className="cul-card-header">
          <h2 className="cul-card-title">List of Team Members (Users)</h2>
          <button
            className="cul-btn-add"
            onClick={() => navigate('/ciisUser/crm/admin/add-user')}
          >
            <FiPlus className="btn-icon" /> Add User
          </button>
        </div>

        {/* Table Controls (Entries + Search) */}
        <div className="cul-table-controls">
          <div className="cul-entries-selector">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries per page</span>
          </div>

          <div className="cul-search-box">
            <label htmlFor="cul-search-input">Search:</label>
            <input
              id="cul-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="cul-table-responsive">
          <table className="cul-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>SL NO.</th>
                <th>EMPLOYEE NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>USER TYPE</th>
                <th>STATUS</th>
                <th style={{ width: '110px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length > 0 ? (
                displayedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="cul-sl-no">{user.slNo}</td>
                    <td className="cul-emp-name">{user.name}</td>
                    <td className="cul-email">{user.email}</td>
                    <td className="cul-phone">{user.phone}</td>
                    <td className="cul-usertype">{user.userType}</td>
                    <td>
                      <span className={`cul-status-badge ${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="cul-action-btns">
                        <button
                          className="cul-btn-action cul-btn-edit"
                          title="Edit User"
                          onClick={() => setEditModalData(user)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="cul-btn-action cul-btn-delete"
                          title="Delete User"
                          onClick={() => handleDelete(user)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="cul-no-data">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer Pagination */}
        <div className="cul-card-footer">
          <div className="cul-footer-info">
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div className="cul-pagination">
            <button
              className="cul-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              &laquo;
            </button>
            <button
              className="cul-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>
            <button className="cul-page-btn active">{currentPage}</button>
            <button
              className="cul-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              title="Next Page"
            >
              <FiChevronRight />
            </button>
            <button
              className="cul-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editModalData && (
        <div className="cul-modal-overlay">
          <div className="cul-modal">
            <div className="cul-modal-header">
              <h3>Edit User</h3>
              <button
                className="cul-modal-close"
                onClick={() => setEditModalData(null)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="cul-modal-form">
              <div className="cul-form-group">
                <label>Employee Name *</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editModalData.name}
                  required
                />
              </div>
              <div className="cul-form-group">
                <label>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editModalData.email}
                  required
                />
              </div>
              <div className="cul-form-group">
                <label>Phone Number</label>
                <input
                  name="phone"
                  type="text"
                  defaultValue={editModalData.phone}
                />
              </div>
              <div className="cul-form-group">
                <label>User Type</label>
                <select name="userType" defaultValue={editModalData.userType}>
                  <option value="Admin">Admin</option>
                  <option value="Marketing Exec">Marketing Exec</option>
                  <option value="Telecaller">Telecaller</option>
                </select>
              </div>
              <div className="cul-form-group">
                <label>Status</label>
                <select name="status" defaultValue={editModalData.status}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="cul-modal-footer">
                <button
                  type="button"
                  className="cul-btn-cancel"
                  onClick={() => setEditModalData(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="cul-btn-submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
