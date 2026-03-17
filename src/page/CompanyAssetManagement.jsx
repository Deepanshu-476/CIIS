import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../utils/axiosConfig';
import './CompanyAssetManagement.css';

const CompanyAssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Fetch assets on component mount
  useEffect(() => {
    console.log('📱 CompanyAssetManagement Component mounted');
    fetchAssets();
    getCompanyInfo();
  }, []);

  // Get user from storage
  const getUser = () => {
    try {
      // Try different storage locations
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
      console.log('🏢 Company info set:', {
        name: user.companyName || user.company,
        code: user.companyCode
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
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast.error(err.response?.data?.message || 'Failed to load company assets');
    } finally {
      setLoading(false);
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
        description: description.trim()
      });
      
      setLoading(true);
      
      const response = await axios.post('/company-assets', {
        name: name.trim(),
        description: description.trim()
      });
      
      console.log('✅ Create asset response:', response.data);
      
      if (response.data.success) {
        toast.success('✅ Company asset created successfully!');
        console.log('📊 New asset status:', response.data.asset.status); // Should be 'Available'
        
        // Reset form
        setName('');
        setDescription('');
        setShowForm(false);
        
        // Refresh assets list
        fetchAssets();
      } else {
        toast.error(response.data.message || 'Failed to create asset');
      }
    } catch (err) {
      console.error('❌ Create asset error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
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
        
        // Update local state immediately for better UX
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
  const handleDelete = async (id, assetName) => {
    if (!window.confirm(`Are you sure you want to delete "${assetName}"?`)) return;

    try {
      console.log('🔄 Deleting asset:', { id, name: assetName });
      setLoading(true);
      
      const response = await axios.delete(`/company-assets/${id}`);
      console.log('✅ Delete response:', response.data);
      
      if (response.data.success) {
        toast.success('🗑️ Company asset deleted successfully!');
        
        // Remove from local state
        setAssets(prevAssets => prevAssets.filter(asset => asset._id !== id));
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

  // Get status badge with color and icon
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Available': { color: '#4caf50', icon: '✅', label: 'Available' },
      'Assigned': { color: '#2196f3', icon: '👤', label: 'Assigned' },
      'Maintenance': { color: '#ff9800', icon: '🔧', label: 'Maintenance' },
      'Damaged': { color: '#f44336', icon: '⚠️', label: 'Damaged' },
      'Retired': { color: '#9e9e9e', icon: '📦', label: 'Retired' }
    };
    
    const config = statusConfig[status] || statusConfig['Available'];
    
    return (
      <span style={{
        backgroundColor: config.color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  const user = getUser();

  // If no user, show login message
  if (!user) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#fff3cd',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>⚠️ Not Logged In</h3>
        <p>Please log in to view company assets.</p>
      </div>
    );
  }

  return (
    <div className="company-asset-management">
      {/* Header with Company Info */}
      <div className="header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '10px',
        color: 'white'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
            📦 Company Assets
          </h1>
          {companyInfo && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px'
              }}>
                🏢 {companyInfo.name}
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px'
              }}>
                📋 {companyInfo.code}
              </span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
            👋 Welcome, {user.name}
          </p>
          <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>
            {user.email}
          </p>
        </div>
      </div>

      {/* Add Asset Button */}
      {!showForm && (
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>➕</span>
          <span>Add New Company Asset</span>
        </button>
      )}

      {/* Create Asset Form */}
      {showForm && (
        <div className="form-container" style={{
          background: 'white',
          borderRadius: '10px',
          padding: '24px',
          marginBottom: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
            Create New Asset
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#555'
              }}>
                Asset Name <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter asset name"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                autoFocus
              />
              <small style={{
                display: 'block',
                marginTop: '8px',
                color: '#666',
                fontSize: '13px'
              }}>
                ℹ️ Status will be automatically set to <strong>Available</strong>
              </small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#555'
              }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter asset description (optional)"
                rows="3"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setName('');
                  setDescription('');
                }}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: '#f5f5f5',
                  color: '#333'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading || !name.trim()}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                  background: '#4CAF50',
                  color: 'white',
                  opacity: loading || !name.trim() ? 0.7 : 1
                }}
              >
                {loading ? 'Creating...' : 'Create Asset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assets List */}
      <div className="assets-list">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            Your Company Assets
          </h3>
          <span style={{
            background: '#e0e0e0',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            color: '#666'
          }}>
            Total: {assets.length}
          </span>
        </div>
        
        {loading && assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div>Loading assets...</div>
          </div>
        ) : assets.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: '#f9f9f9',
            borderRadius: '10px',
            border: '2px dashed #e0e0e0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>No Assets Found</h4>
            <p style={{ margin: 0, color: '#666' }}>
              Your company doesn't have any assets yet. Click the button above to create your first asset.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#555' }}>#</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Asset Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Description</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Created Date</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Created By</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => (
                  <tr key={asset._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '16px' }}>{index + 1}</td>
                    <td style={{ padding: '16px' }}>
                      <strong>{asset.name}</strong>
                    </td>
                    <td style={{ padding: '16px', color: '#666' }}>
                      {asset.description || '—'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={asset.status}
                        onChange={(e) => handleStatusChange(asset._id, e.target.value)}
                        disabled={updatingStatus === asset._id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: 'none',
                          background: getStatusBadge(asset.status).props.style.backgroundColor,
                          color: 'white',
                          fontWeight: '500',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <option value="Available" style={{ background: '#4caf50' }}>✅ Available</option>
                        <option value="Assigned" style={{ background: '#2196f3' }}>👤 Assigned</option>
                        <option value="Maintenance" style={{ background: '#ff9800' }}>🔧 Maintenance</option>
                        <option value="Damaged" style={{ background: '#f44336' }}>⚠️ Damaged</option>
                        <option value="Retired" style={{ background: '#9e9e9e' }}>📦 Retired</option>
                      </select>
                      {updatingStatus === asset._id && (
                        <span style={{ marginLeft: '8px' }}>⏳</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: '#666' }}>
                      {new Date(asset.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        background: '#f0f0f0',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        {asset.createdBy?.name || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => handleDelete(asset._id, asset.name)}
                        disabled={loading}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          background: '#f44336',
                          color: 'white',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                          fontSize: '13px'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyAssetManagement;