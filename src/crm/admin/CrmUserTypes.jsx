import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiX
} from 'react-icons/fi';
import './CrmUserTypes.css';

const initialUserTypes = [
  { id: 1, slNo: '001', name: 'Admin', canReceiveLeads: 'No', sort: 1, status: 'Active' },
  { id: 2, slNo: '002', name: 'Telecaller', canReceiveLeads: 'Yes', sort: 2, status: 'Active' },
  { id: 3, slNo: '003', name: 'Marketing Exec', canReceiveLeads: 'Yes', sort: 3, status: 'Active' },
];

export default function CrmUserTypes() {
  const [userTypes, setUserTypes] = useState(initialUserTypes);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalData, setModalData] = useState(null); // null = closed, {} = add, item = edit

  // Search Filtering
  const filteredTypes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return userTypes;
    return userTypes.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.canReceiveLeads.toLowerCase().includes(q) ||
      String(item.sort).includes(q)
    );
  }, [userTypes, searchQuery]);

  // Pagination
  const totalEntries = filteredTypes.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const displayedTypes = filteredTypes.slice(startIndex, startIndex + entriesPerPage);

  const handleDelete = (item) => {
    if (item.name === 'Admin') {
      alert('System Admin role cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user type "${item.name}"?`)) {
      setUserTypes(prev => prev.filter(ut => ut.id !== item.id));
    }
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const canReceiveLeads = String(formData.get('canReceiveLeads') || 'Yes').trim();
    const sort = Number(formData.get('sort')) || 1;
    const status = String(formData.get('status') || 'Active').trim();

    if (!name) return;

    if (modalData?.item) {
      // Edit
      setUserTypes(prev =>
        prev.map(item =>
          item.id === modalData.item.id
            ? { ...item, name, canReceiveLeads, sort, status }
            : item
        )
      );
    } else {
      // Add
      const nextId = Date.now();
      const nextSl = String(userTypes.length + 1).padStart(3, '0');
      setUserTypes(prev => [
        ...prev,
        { id: nextId, slNo: nextSl, name, canReceiveLeads, sort, status }
      ]);
    }
    setModalData(null);
  };

  return (
    <div className="cut-root">
      {/* Page Header & Breadcrumb */}
      <div className="cut-page-header">
        <h1 className="cut-page-title">User Type</h1>
        <div className="cut-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <span className="separator">&gt;</span>
          <Link to="/ciisUser/crm/admin/team">Team</Link>
          <span className="separator">&gt;</span>
          <span className="active">User Type</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="cut-card">
        {/* Header inside card */}
        <div className="cut-card-header">
          <h2 className="cut-card-title">User Type</h2>
          <button
            className="cut-btn-add"
            onClick={() => setModalData({})}
          >
            <FiPlus className="btn-icon" /> Add User Type
          </button>
        </div>

        {/* Table Controls (Entries + Search) */}
        <div className="cut-table-controls">
          <div className="cut-entries-selector">
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

          <div className="cut-search-box">
            <label htmlFor="cut-search-input">Search:</label>
            <input
              id="cut-search-input"
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
        <div className="cut-table-responsive">
          <table className="cut-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>SL NO.</th>
                <th>USER TYPE</th>
                <th>CAN RECEIVE LEADS</th>
                <th>SORT</th>
                <th>STATUS</th>
                <th style={{ width: '110px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {displayedTypes.length > 0 ? (
                displayedTypes.map((item) => (
                  <tr key={item.id}>
                    <td className="cut-sl-no">{item.slNo}</td>
                    <td className="cut-usertype-name">{item.name}</td>
                    <td>
                      <span className={`cut-leads-badge ${item.canReceiveLeads.toLowerCase()}`}>
                        {item.canReceiveLeads}
                      </span>
                    </td>
                    <td className="cut-sort-val">{item.sort}</td>
                    <td>
                      <span className={`cut-status-badge ${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="cut-action-btns">
                        <button
                          className="cut-btn-action cut-btn-edit"
                          title="Edit User Type"
                          onClick={() => setModalData({ item })}
                        >
                          <FiEdit2 />
                        </button>
                        {item.name !== 'Admin' && (
                          <button
                            className="cut-btn-action cut-btn-delete"
                            title="Delete User Type"
                            onClick={() => handleDelete(item)}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="cut-no-data">
                    No user types found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer Pagination */}
        <div className="cut-card-footer">
          <div className="cut-footer-info">
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div className="cut-pagination">
            <button
              className="cut-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              &laquo;
            </button>
            <button
              className="cut-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>
            <button className="cut-page-btn active">{currentPage}</button>
            <button
              className="cut-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              title="Next Page"
            >
              <FiChevronRight />
            </button>
            <button
              className="cut-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit User Type Modal */}
      {modalData !== null && (
        <div className="cut-modal-overlay">
          <div className="cut-modal">
            <div className="cut-modal-header">
              <h3>{modalData.item ? 'Edit User Type' : 'Add User Type'}</h3>
              <button
                className="cut-modal-close"
                onClick={() => setModalData(null)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSaveModal} className="cut-modal-form">
              <div className="cut-form-group">
                <label>User Type Name *</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={modalData.item?.name || ''}
                  placeholder="e.g. Telecaller"
                  required
                />
              </div>
              <div className="cut-form-group">
                <label>Can Receive Leads *</label>
                <select name="canReceiveLeads" defaultValue={modalData.item?.canReceiveLeads || 'Yes'}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="cut-form-group">
                <label>Sort Order</label>
                <input
                  name="sort"
                  type="number"
                  defaultValue={modalData.item?.sort || (userTypes.length + 1)}
                  min="1"
                />
              </div>
              <div className="cut-form-group">
                <label>Status</label>
                <select name="status" defaultValue={modalData.item?.status || 'Active'}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="cut-modal-footer">
                <button
                  type="button"
                  className="cut-btn-cancel"
                  onClick={() => setModalData(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="cut-btn-submit">
                  {modalData.item ? 'Save Changes' : 'Create User Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
