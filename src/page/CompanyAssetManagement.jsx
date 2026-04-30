import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../utils/axiosConfig';
import './CompanyAssetManagement.css';

const CompanyAssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [editingCommentReq, setEditingCommentReq] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchRequests();
    getCompanyInfo();
    setAnimateIn(true);
  }, []);

  // Get user from storage
  const getUser = () => {
    try {
      let userStr = localStorage.getItem('user');
      if (!userStr) userStr = localStorage.getItem('superAdmin');
      if (!userStr) userStr = sessionStorage.getItem('user');
      if (!userStr) userStr = sessionStorage.getItem('superAdmin');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  // Get company info
  const getCompanyInfo = () => {
    const user = getUser();
    if (user) {
      setCompanyInfo({
        name: user.companyName || user.company || 'Your Company',
        code: user.companyCode || 'N/A',
        id: user._id
      });
    }
  };

  // Fetch all company assets
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/company-assets');
      if (response.data.success) {
        // Ensure each asset has a status field
        const assetsWithStatus = (response.data.assets || []).map(asset => ({
          ...asset,
          status: asset.status || 'Available'
        }));
        setAssets(assetsWithStatus);
      } else {
        toast.error(response.data.message || 'Failed to load assets');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load company assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/asset-requests/all');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentEditOpen = (req) => {
    setEditingCommentReq(req);
    setCommentText('');
  };

  const handleCommentUpdate = async () => {
    try {
      await axios.patch(`/asset-requests/update/${editingCommentReq._id}`, {
        adminComment: commentText,
      });
      toast.success("Comment added successfully");
      setCommentText('');
      setEditingCommentReq(null);
      fetchRequests();
    } catch (err) {
      toast.error("Failed to add comment");
      console.error(err);
    }
  };

  // Create new company asset
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Asset name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/company-assets', {
        name: name.trim(),
        description: description.trim(),
        quantity: quantity
      });
      
      if (response.data.success) {
        toast.success('Company asset created successfully!');
        setName('');
        setDescription('');
        setQuantity('');
        setShowForm(false);
        fetchAssets();
      } else {
        toast.error(response.data.message || 'Failed to create asset');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create company asset');
    } finally {
      setLoading(false);
    }
  };

  // Update asset status
  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingStatus(id);
      const response = await axios.put(`/company-assets/${id}/status`, { 
        status: newStatus 
      });
      
      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        setAssets(prevAssets => 
          prevAssets.map(asset => 
            asset._id === id 
              ? { ...asset, status: newStatus }
              : asset
          )
        );
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Delete company asset
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/company-assets/${id}`);
      
      if (response.data.success) {
        toast.success('Company asset deleted successfully!');
        setAssets(prevAssets => prevAssets.filter(asset => asset._id !== id));
        setShowDeleteConfirm(null);
      } else {
        toast.error(response.data.message || 'Failed to delete asset');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete company asset');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge - FIXED with proper error handling
  const getStatusBadge = (status) => {
    // Handle undefined, null, or invalid status
    const safeStatus = (status && typeof status === 'string') ? status : 'Available';
    
    const statusConfig = {
      'Available': { color: '#10b981', icon: '✅', label: 'Available', bg: '#d1fae5', border: '#a7f3d0' },
      'Assigned': { color: '#3b82f6', icon: '👤', label: 'Assigned', bg: '#dbeafe', border: '#bfdbfe' },
      'Maintenance': { color: '#f59e0b', icon: '🔧', label: 'Maintenance', bg: '#fed7aa', border: '#fdba74' },
    };
    
    // Use Available as default if status not found in config
    const config = statusConfig[safeStatus] || statusConfig['Available'];
    const displayStatus = statusConfig[safeStatus] ? safeStatus : 'Available';
    
    return (
      <span className={`status-badge-new status-${displayStatus.toLowerCase()}`}>
        <span className="status-icon-new">{config.icon}</span>
        <span className="status-label-new">{config.label}</span>
      </span>
    );
  };

  // Filter and search assets
  const getFilteredAssets = () => {
    let filtered = [...assets];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset => 
        (asset.name && asset.name.toLowerCase().includes(term)) ||
        (asset.description && asset.description.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  };

  // View asset details
  const viewAssetDetails = (asset) => {
    setSelectedAsset(asset);
    setShowDetailsModal(true);
  };

  const filteredAssets = getFilteredAssets();
  const user = getUser();

  // If no user, show login message
  if (!user) {
    return (
      <div className="ca-login-prompt-enhanced">
        <div className="ca-login-card-enhanced">
          <div className="ca-login-icon-enhanced">🔐</div>
          <h3>Authentication Required</h3>
          <p>Please log in to access company assets.</p>
          <button className="ca-login-btn" onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`ca-container-enhanced ${animateIn ? 'fade-in' : ''}`}>
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Header Section */}
      <div className="ca-header-enhanced">
        <div className="ca-header-content-enhanced">
          <div className="ca-header-left-enhanced">
            <div className="ca-header-icon-enhanced">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 12L12 16L20 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 17L12 21L20 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1>Asset Management</h1>
              <p>Track, manage, and monitor your company inventory</p>
            </div>
          </div>
          <div className="ca-header-right-enhanced">
            <div className="ca-company-badge-enhanced">
              <span className="ca-company-icon-enhanced">🏢</span>
              <div>
                <div className="ca-company-name-enhanced">{companyInfo?.name || 'Your Company'}</div>
                <div className="ca-company-code-enhanced">ID: {companyInfo?.code}</div>
              </div>
            </div>
            <div className="ca-user-badge-enhanced">
              <div className="ca-user-avatar-enhanced" style={{ background: `linear-gradient(135deg, #667eea, #764ba2)` }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="ca-user-name-enhanced">{user.name}</div>
                <div className="ca-user-email-enhanced">{user.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="ca-stats-grid-enhanced">
        <div className="ca-stat-card-enhanced stat-total">
          <div className="ca-stat-icon-enhanced">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="ca-stat-info-enhanced">
            <div className="ca-stat-value-enhanced">{assets.length}</div>
            <div className="ca-stat-label-enhanced">Total Assets</div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="ca-stat-card-enhanced stat-available">
          <div className="ca-stat-icon-enhanced">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="ca-stat-info-enhanced">
            <div className="ca-stat-value-enhanced">{assets.filter(a => a.status === 'Available').length}</div>
            <div className="ca-stat-label-enhanced">Available</div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{ width: `${assets.length ? (assets.filter(a => a.status === 'Available').length / assets.length) * 100 : 0}%` }}></div>
          </div>
        </div>
        <div className="ca-stat-card-enhanced stat-assigned">
          <div className="ca-stat-icon-enhanced">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="ca-stat-info-enhanced">
            <div className="ca-stat-value-enhanced">{assets.filter(a => a.status === 'Assigned').length}</div>
            <div className="ca-stat-label-enhanced">Assigned</div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{ width: `${assets.length ? (assets.filter(a => a.status === 'Assigned').length / assets.length) * 100 : 0}%` }}></div>
          </div>
        </div>
        <div className="ca-stat-card-enhanced stat-maintenance">
          <div className="ca-stat-icon-enhanced">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12A10 10 0 0 0 12 2v10l-4.5 4.5" />
              <path d="M12 22a10 10 0 0 0 10-10" />
            </svg>
          </div>
          <div className="ca-stat-info-enhanced">
            <div className="ca-stat-value-enhanced">{assets.filter(a => a.status === 'Maintenance').length}</div>
            <div className="ca-stat-label-enhanced">Maintenance</div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{ width: `${assets.length ? (assets.filter(a => a.status === 'Maintenance').length / assets.length) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="ca-action-bar-enhanced">
        <div className="ca-action-left-enhanced">
          <button 
            className={`ca-btn-enhanced ca-btn-primary-enhanced ${!showForm ? 'pulse-animation' : ''}`}
            onClick={() => setShowForm(!showForm)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{showForm ? 'Cancel' : 'Add New Asset'}</span>
          </button>
          
          <div className="ca-view-toggle-enhanced">
            <button 
              className={`ca-view-btn-enhanced ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
              Assets
            </button>
            <button 
              className={`ca-view-btn-enhanced ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Requests
            </button>
          </div>
        </div>
        
        <div className="ca-action-right-enhanced">
          <div className="ca-search-box-enhanced">
            <span className="ca-search-icon-enhanced">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ca-search-input-enhanced"
            />
            {searchTerm && (
              <button className="ca-search-clear-enhanced" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
          
          <select 
            className="ca-filter-select-enhanced"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Available">✅ Available</option>
            <option value="Assigned">👤 Assigned</option>
            <option value="Maintenance">🔧 Maintenance</option>
          </select>
        </div>
      </div>

      {/* Create Asset Form Modal */}
      {showForm && (
        <div className="ca-modal-overlay-enhanced" onClick={() => setShowForm(false)}>
          <div className="ca-form-card-enhanced" onClick={(e) => e.stopPropagation()}>
            <div className="ca-form-header-enhanced">
              <h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create New Asset
              </h3>
              <button className="ca-close-btn-enhanced" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ca-form-group-enhanced">
                <label>
                  Asset Name <span className="ca-required-enhanced">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter asset name"
                  disabled={loading}
                  className="ca-form-input-enhanced"
                  autoFocus
                />
              </div>
              <div className="ca-form-group-enhanced form-row">
                <div className="form-field">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="ca-form-input-enhanced"
                  />
                </div>
              </div>
              <div className="ca-form-group-enhanced">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter asset description (optional)"
                  rows="3"
                  disabled={loading}
                  className="ca-form-textarea-enhanced"
                />
              </div>
              <div className="ca-form-actions-enhanced">
                <button 
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setName('');
                    setDescription('');
                  }}
                  disabled={loading}
                  className="ca-btn-enhanced ca-btn-secondary-enhanced"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="ca-btn-enhanced ca-btn-primary-enhanced"
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Asset'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assets Display Section */}
      <div className="ca-assets-section-enhanced">
        <div className="ca-section-header-enhanced">
          <div className="section-title">
            <span className="title-icon">
              {viewMode === 'table' ? '📋' : '📬'}
            </span>
            <h3>
              {viewMode === 'table' 
                ? (statusFilter === 'all' ? 'All Assets' : `${statusFilter} Assets`)
                : 'Asset Requests'
              }
              {searchTerm && <span className="ca-search-badge-enhanced">Search: "{searchTerm}"</span>}
            </h3>
          </div>
          <div className="ca-assets-count-enhanced">
            {viewMode === 'table' 
              ? `Showing ${filteredAssets.length} of ${assets.length} assets`
              : `${requests.length} total requests`
            }
          </div>
        </div>

        {viewMode === 'table' ? (
          <>
            {loading && assets.length === 0 ? (
              <div className="ca-loading-enhanced">
                <div className="ca-spinner-enhanced"></div>
                <p>Loading assets...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="ca-empty-state-enhanced">
                <div className="ca-empty-icon-enhanced">📦</div>
                <h4>No Assets Found</h4>
                <p>
                  {searchTerm || statusFilter !== 'all' 
                    ? "No assets match your search criteria. Try adjusting your filters."
                    : "Your company doesn't have any assets yet. Click the button above to create your first asset."}
                </p>
                {(searchTerm || statusFilter !== 'all') && (
                  <button 
                    className="ca-btn-enhanced ca-btn-secondary-enhanced"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="ca-table-wrapper-enhanced">
                <table className="ca-table-enhanced">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Asset Name</th>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset, index) => (
                      <tr key={asset._id} className="ca-table-row-enhanced">
                        <td data-label="#">{index + 1}</td>
                        <td data-label="Asset Name">
                          <button 
                            className="ca-asset-link-enhanced"
                            onClick={() => viewAssetDetails(asset)}
                          >
                            {asset.name}
                          </button>
                        </td>
                        <td data-label="Description" className="ca-description-cell-enhanced">
                          {asset.description || '—'}
                        </td>
                        <td data-label="Quantity">
                          <span className="quantity-badge">{asset.quantity || 0}</span>
                        </td>
                        <td data-label="Status">
                          {getStatusBadge(asset.status)}
                        </td>
                        <td data-label="Created Date">
                          {new Date(asset.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td data-label="Actions">
                          <div className="ca-action-buttons-enhanced">
                            <button
                              className="ca-action-btn-enhanced ca-view-btn-sm-enhanced"
                              onClick={() => viewAssetDetails(asset)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button
                              className="ca-action-btn-enhanced ca-delete-btn-sm-enhanced"
                              onClick={() => setShowDeleteConfirm(asset)}
                              title="Delete Asset"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="ca-table-wrapper-enhanced">
            <table className="ca-table-enhanced">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Asset</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Comments</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((req, index) => (
                    <tr key={req._id} className="ca-table-row-enhanced">
                      <td>{index + 1}</td>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar" style={{ background: `linear-gradient(135deg, #667eea, #764ba2)` }}>
                            {req.user?.name?.charAt(0) || 'U'}
                          </div>
                          <span>{req.user?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>{req.user?.email}</td>
                      <td><span className="asset-name-cell">{req.assetName}</span></td>
                      <td><span className="department-badge">{req.department || 'N/A'}</span></td>
                      <td>
                        <span className={`request-status-badge status-${req.status?.toLowerCase() || 'pending'}`}>
                          {req.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="comment-preview">
                          {req.adminComments?.length > 0 ? (
                            <span className="comment-count">{req.adminComments.length} comment(s)</span>
                          ) : (
                            <span className="no-comment">No comments</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className="comment-btn"
                          onClick={() => handleCommentEditOpen(req)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Add
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      <div className="empty-requests">
                        <span>📭</span>
                        <p>No asset requests found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Asset Details Modal */}
      {showDetailsModal && selectedAsset && (
        <div className="ca-modal-overlay-enhanced" onClick={() => setShowDetailsModal(false)}>
          <div className="ca-modal-enhanced" onClick={(e) => e.stopPropagation()}>
            <div className="ca-modal-header-enhanced">
              <h3>Asset Details</h3>
              <button className="ca-close-btn-enhanced" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="ca-modal-body-enhanced">
              <div className="detail-header">
                <div className="asset-icon-large">📦</div>
                <h2>{selectedAsset.name}</h2>
                {getStatusBadge(selectedAsset.status)}
              </div>
              <div className="details-grid">
                <div className="ca-detail-item-enhanced">
                  <label>Description</label>
                  <div className="ca-detail-value-enhanced">{selectedAsset.description || 'No description provided'}</div>
                </div>
                <div className="ca-detail-item-enhanced">
                  <label>Quantity</label>
                  <div className="ca-detail-value-enhanced highlight">{selectedAsset.quantity || 0}</div>
                </div>
                <div className="ca-detail-item-enhanced">
                  <label>Created By</label>
                  <div className="ca-detail-value-enhanced">{selectedAsset.createdBy?.name || 'Unknown'}</div>
                </div>
                <div className="ca-detail-item-enhanced">
                  <label>Created Date</label>
                  <div className="ca-detail-value-enhanced">
                    {new Date(selectedAsset.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="ca-detail-item-enhanced full-width">
                  <label>Last Updated</label>
                  <div className="ca-detail-value-enhanced">
                    {new Date(selectedAsset.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="ca-detail-item-enhanced full-width">
                  <label>Asset ID</label>
                  <div className="ca-detail-value-enhanced ca-monospace-enhanced">{selectedAsset._id}</div>
                </div>
              </div>
            </div>
            <div className="ca-modal-footer-enhanced">
              <button className="ca-btn-enhanced ca-btn-secondary-enhanced" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="ca-modal-overlay-enhanced" onClick={() => setShowDeleteConfirm(null)}>
          <div className="ca-modal-enhanced ca-modal-sm-enhanced" onClick={(e) => e.stopPropagation()}>
            <div className="ca-modal-header-enhanced">
              <h3>Confirm Delete</h3>
              <button className="ca-close-btn-enhanced" onClick={() => setShowDeleteConfirm(null)}>✕</button>
            </div>
            <div className="ca-modal-body-enhanced ca-delete-body-enhanced">
              <div className="ca-delete-icon-enhanced">⚠️</div>
              <p>Are you sure you want to delete <strong>"{showDeleteConfirm.name}"</strong>?</p>
              <p className="ca-delete-warning-enhanced">This action cannot be undone.</p>
            </div>
            <div className="ca-modal-footer-enhanced">
              <button className="ca-btn-enhanced ca-btn-secondary-enhanced" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="ca-btn-enhanced ca-btn-danger-enhanced" onClick={() => handleDelete(showDeleteConfirm._id)}>
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {editingCommentReq && (
        <div className="ca-modal-overlay-enhanced" onClick={() => setEditingCommentReq(null)}>
          <div className="ca-modal-enhanced" onClick={(e) => e.stopPropagation()}>
            <div className="ca-modal-header-enhanced">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Admin Comment
              </h3>
              <button className="ca-close-btn-enhanced" onClick={() => setEditingCommentReq(null)}>✕</button>
            </div>
            <div className="ca-modal-body-enhanced">
              <div className="request-info">
                <div className="info-row">
                  <span className="info-label">Asset:</span>
                  <span className="info-value">{editingCommentReq.assetName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Employee:</span>
                  <span className="info-value">{editingCommentReq.user?.name}</span>
                </div>
              </div>
              
              <div className="comment-section">
                <label>Add Comment</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your comment here..."
                  className="comment-textarea"
                  rows="4"
                />
              </div>

              {editingCommentReq.adminComments?.length > 0 && (
                <div className="previous-comments">
                  <label>Previous Comments</label>
                  <div className="comments-list">
                    {editingCommentReq.adminComments.map((c, i) => (
                      <div key={i} className="comment-item">
                        <div className="comment-text">{c.text}</div>
                        <div className="comment-date">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="ca-modal-footer-enhanced">
              <button className="ca-btn-enhanced ca-btn-secondary-enhanced" onClick={() => setEditingCommentReq(null)}>
                Cancel
              </button>
              <button className="ca-btn-enhanced ca-btn-primary-enhanced" onClick={handleCommentUpdate}>
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyAssetManagement;