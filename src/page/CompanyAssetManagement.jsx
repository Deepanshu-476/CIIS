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

 useEffect(() => {
  fetchAssets();
  fetchRequests(); // 🔥 ADD THIS
  getCompanyInfo();
}, []);

  // Update stats whenever assets change
 
  // Get user from storage
  const getUser = () => {
    try {
      let userStr = localStorage.getItem('user');
      if (!userStr) userStr = localStorage.getItem('superAdmin');
      if (!userStr) userStr = sessionStorage.getItem('user');
      if (!userStr) userStr = sessionStorage.getItem('superAdmin');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 User from storage:', {
          name: user.name,
          email: user.email,
          companyCode: user.companyCode,
          companyName: user.companyName,
          role: user.role
        });
        return user;
      }
      
      console.log('⚠️ No user found in storage');
      return null;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
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
      console.log('🔄 Fetching company assets...');
      setLoading(true);
      
      const response = await axios.get('/company-assets');
      console.log('📦 Assets API Response:', response.data);
      
      if (response.data.success) {
        setAssets(response.data.assets || []);
        console.log(`✅ Loaded ${response.data.assets?.length || 0} assets`);
      } else {
        console.error('❌ API returned success: false');
        toast.error(response.data.message || 'Failed to load assets');
      }
    } catch (err) {
      console.error('❌ Fetch assets error:', err);
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

  // Create new company asset
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Asset name is required');
      return;
    }

    try {
      console.log('🔄 Creating asset with data:', {
        name: name.trim(),
        description: description.trim(),
        quantity: quantity
      });
      
      setLoading(true);
      
      const response = await axios.post('/company-assets', {
        name: name.trim(),
        description: description.trim(),
        quantity: quantity
      });
      
      console.log('✅ Create asset response:', response.data);
      
      if (response.data.success) {
        toast.success('✅ Company asset created successfully!');
        
        setName('');
        setDescription('');
        setQuantity('');
        setShowForm(false);
        
        fetchAssets();
      } else {
        toast.error(response.data.message || 'Failed to create asset');
      }
    } catch (err) {
      console.error('❌ Create asset error:', err);
      toast.error(err.response?.data?.message || 'Failed to create company asset');
    } finally {
      setLoading(false);
    }
  };

  // Update asset status
  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingStatus(id);
      console.log('🔄 Updating status:', { assetId: id, newStatus });
      
      const response = await axios.put(`/company-assets/${id}/status`, { 
        status: newStatus 
      });
      
      console.log('✅ Status update response:', response.data);
      
      if (response.data.success) {
        toast.success(`📊 Status updated to ${newStatus}`);
        
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
      console.error('❌ Status update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Delete company asset
  const handleDelete = async (id) => {
    try {
      console.log('🔄 Deleting asset:', { id });
      setLoading(true);
      
      const response = await axios.delete(`/company-assets/${id}`);
      console.log('✅ Delete response:', response.data);
      
      if (response.data.success) {
        toast.success('🗑️ Company asset deleted successfully!');
        setAssets(prevAssets => prevAssets.filter(asset => asset._id !== id));
        setShowDeleteConfirm(null);
      } else {
        toast.error(response.data.message || 'Failed to delete asset');
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete company asset');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Available': { color: '#10b981', icon: '✅', label: 'Available', bg: '#d1fae5' },
      'Assigned': { color: '#3b82f6', icon: '👤', label: 'Assigned', bg: '#dbeafe' },
      'Maintenance': { color: '#f59e0b', icon: '🔧', label: 'Maintenance', bg: '#fed7aa' },
     
    };
    
    const config = statusConfig[status] || statusConfig['Available'];
    
    return (
      <span className={`status-badge status-${status.toLowerCase()}`}>
        <span className="status-icon">{config.icon}</span>
        <span className="status-label">{config.label}</span>
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
        asset.name.toLowerCase().includes(term) ||
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

  // Get status color for stats card
  const getStatColor = (type) => {
    const colors = {
      total: '#6366f1',
      available: '#10b981',
      assigned: '#3b82f6',
      maintenance: '#f59e0b'
    };
    return colors[type];
  };

  const filteredAssets = getFilteredAssets();
  const user = getUser();

  // If no user, show login message
  if (!user) {
    return (
      <div className="ca-login-prompt">
        <div className="ca-login-card">
          <div className="ca-login-icon">⚠️</div>
          <h3>Not Logged In</h3>
          <p>Please log in to view company assets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ca-container">
      {/* Header Section */}
      <div className="ca-header">
        <div className="ca-header-content">
          <div className="ca-header-left">
            <div className="ca-header-icon">📦</div>
            <div>
              <h1>Company Assets</h1>
              <p>Manage and track your company's inventory</p>
            </div>
          </div>
          <div className="ca-header-right">
            <div className="ca-company-badge">
              <span className="ca-company-icon">🏢</span>
              <div>
                <div className="ca-company-name">{companyInfo?.name || 'Your Company'}</div>
                <div className="ca-company-code">Code: {companyInfo?.code}</div>
              </div>
            </div>
            <div className="ca-user-badge">
              <div className="ca-user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="ca-user-name">{user.name}</div>
                <div className="ca-user-email">{user.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

     

      {/* Action Bar */}
      <div className="ca-action-bar">
        <div className="ca-action-left">
          <button 
            className={`ca-btn ca-btn-primary ${!showForm ? 'ca-btn-glow' : ''}`}
            onClick={() => setShowForm(!showForm)}
          >
            <span>{showForm ? '✕' : '+'}</span>
            <span>{showForm ? 'Cancel' : 'Add New Asset'}</span>
          </button>
          
            <div className="ca-view-toggle">
              <button 
                className={`ca-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                Assets
              </button>
              <button 
                className={`ca-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                All Requests
              </button>
            </div>
        </div>
        
        <div className="ca-action-right">
          <div className="ca-search-box">
            <span className="ca-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ca-search-input"
            />
            {searchTerm && (
              <button className="ca-search-clear" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
          
          <select 
            className="ca-filter-select"
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

      {/* Create Asset Form */}
      {showForm && (
        <div className="ca-form-modal">
          <div className="ca-form-card">
            <div className="ca-form-header">
              <h3>Create New Asset</h3>
              <button className="ca-close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ca-form-group">
                <label>
                  Asset Name <span className="ca-required">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter asset name"
                  disabled={loading}
                  className="ca-form-input"
                  autoFocus
                />
              </div>
              <div className="ca-form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="ca-form-input"
                />
              </div>
              <div className="ca-form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter asset description (optional)"
                  rows="3"
                  disabled={loading}
                  className="ca-form-textarea"
                />
              </div>

              <div className="ca-form-actions">
                <button 
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setName('');
                    setDescription('');
                  }}
                  disabled={loading}
                  className="ca-btn ca-btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="ca-btn ca-btn-primary"
                >
                  {loading ? 'Creating...' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assets Display */}
      <div className="ca-assets-section">
        <div className="ca-section-header">
          <h3>
            {statusFilter === 'all' ? 'All Assets' : `${statusFilter} Assets`}
            {searchTerm && <span className="ca-search-badge">Search: "{searchTerm}"</span>}
          </h3>
          <div className="ca-assets-count">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
        </div>

        {loading && assets.length === 0 ? (
          <div className="ca-loading">
            <div className="ca-spinner"></div>
            <p>Loading assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="ca-empty-state">
            <div className="ca-empty-icon">📦</div>
            <h4>No Assets Found</h4>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? "No assets match your search criteria. Try adjusting your filters."
                : "Your company doesn't have any assets yet. Click the button above to create your first asset."}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                className="ca-btn ca-btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <div className="ca-table-wrapper">
            <table className="ca-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Asset Name</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Created Date</th>
                  <th>Created By</th>
                  <th>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, index) => (
                  <tr key={asset._id} className="ca-table-row">
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Asset Name">
                      <button 
                        className="ca-asset-link"
                        onClick={() => viewAssetDetails(asset)}
                      >
                        <strong>{asset.name}</strong>
                      </button>
                    </td>
                    <td data-label="Description" className="ca-description-cell">
                      {asset.description || '—'}
                    </td>

                    <td data-label="Quantity">{asset.quantity || 0}</td>
                    
                    <td data-label="Created Date">
                      {new Date(asset.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td data-label="Created By">
                      <span className="ca-creator-badge">
                       
                        <span>{asset.createdBy?.name || 'Unknown'}</span>
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="ca-action-buttons">
                        <button
                          className="ca-action-btn ca-view-btn-sm"
                          onClick={() => viewAssetDetails(asset)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="ca-action-btn ca-delete-btn-sm"
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
       ) : (
          <div className="ca-table-wrapper">

            <h3 style={{ marginBottom: '10px' }}>All Requests</h3>

            <table className="ca-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Asset</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {requests.length > 0 ? (
                  requests.map((req, index) => (
                    <tr key={req._id}>
                      <td>{index + 1}</td>
                      <td>{req.user?.name}</td>
                      <td>{req.user?.email}</td>
                      <td>{req.assetName}</td>
                      <td>{req.department}</td>
                      <td>{req.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>
                      No Requests Found
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
        <div className="ca-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ca-modal-header">
              <h3>Asset Details</h3>
              <button className="ca-close-btn" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="ca-modal-body">
              <div className="ca-detail-item">
                <label>Asset Name</label>
                <div className="ca-detail-value">{selectedAsset.name}</div>
              </div>
              <div className="ca-detail-item">
                <label>Description</label>
                <div className="ca-detail-value">{selectedAsset.description || '—'}</div>
              </div>
              
              <div className="ca-detail-item">
                <label>Created By</label>
                <div className="ca-detail-value">{selectedAsset.createdBy?.name || 'Unknown'}</div>
              </div>
              <div className="ca-detail-item">
                <label>Created Date</label>
                <div className="ca-detail-value">
                  {new Date(selectedAsset.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="ca-detail-item">
                <label>Last Updated</label>
                <div className="ca-detail-value">
                  {new Date(selectedAsset.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="ca-detail-item">
                <label>Asset ID</label>
                <div className="ca-detail-value ca-monospace">{selectedAsset._id}</div>
              </div>
            </div>
            <div className="ca-modal-footer">
              <button className="ca-btn ca-btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="ca-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="ca-modal ca-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="ca-modal-header">
              <h3>Confirm Delete</h3>
              <button className="ca-close-btn" onClick={() => setShowDeleteConfirm(null)}>✕</button>
            </div>
            <div className="ca-modal-body ca-delete-body">
              <div className="ca-delete-icon">🗑️</div>
              <p>Are you sure you want to delete <strong>"{showDeleteConfirm.name}"</strong>?</p>
              <p className="ca-delete-warning">This action cannot be undone.</p>
            </div>
            <div className="ca-modal-footer">
              <button className="ca-btn ca-btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="ca-btn ca-btn-danger" onClick={() => handleDelete(showDeleteConfirm._id)}>
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyAssetManagement;