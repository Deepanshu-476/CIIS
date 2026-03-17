import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig";
import {
  FiPackage,
  FiSmartphone,
  FiHeadphones,
  FiCpu,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiPlus,
  FiSearch,
  FiSettings,
  FiMonitor,
  FiTrendingUp,
  FiAlertCircle,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import "../Css/MyAssets.css";
import CIISLoader from '../../Loader/CIISLoader';

const MyAssets = () => {
  const [newAsset, setNewAsset] = useState("");
  const [notification, setNotification] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [companyAssets, setCompanyAssets] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    approvalRate: 0,
  });
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Allowed assets for dropdown
  const [allowedAssets, setAllowedAssets] = useState([]);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get user from storage
  const getUser = () => {
    try {
      let userStr = localStorage.getItem('user') || localStorage.getItem('superAdmin');
      if (!userStr) userStr = sessionStorage.getItem('user') || sessionStorage.getItem('superAdmin');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserInfo(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  };

  // ✅ Fetch company assets from API
  const fetchCompanyAssets = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/company-assets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("📦 Company Assets API Response:", res.data);
      
      // Get assets from response
      let assets = [];
      if (res.data.assets) {
        assets = res.data.assets;
      } else if (Array.isArray(res.data)) {
        assets = res.data;
      } else if (res.data.data) {
        assets = res.data.data;
      }
      
      console.log("✅ Fetched assets:", assets.length);
      setCompanyAssets(assets);
      
      // Format assets for dropdown
      const formattedAssets = assets.map(asset => ({
        value: asset._id,
        label: asset.name,
        type: asset.category || asset.type || 'other',
        icon: getIconForAssetType(asset.category || asset.type),
        color: getColorForAssetType(asset.category || asset.type),
        available: asset.status === 'Available',
        status: asset.status,
        serialNumber: asset.serialNumber,
        model: asset.model,
        description: asset.description
      }));
      
      console.log("🎨 Formatted assets for dropdown:", formattedAssets);
      setAllowedAssets(formattedAssets);
      
    } catch (err) {
      console.error("❌ Failed to fetch company assets:", err);
      setNotification({
        message: "Failed to load company assets",
        severity: "error",
      });
    }
  };

  // Helper function to get icon based on asset type
  const getIconForAssetType = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('phone') || typeLower.includes('mobile')) return FiSmartphone;
    if (typeLower.includes('laptop') || typeLower.includes('computer')) return FiMonitor;
    if (typeLower.includes('desktop') || typeLower.includes('pc')) return FiSettings;
    if (typeLower.includes('headphone') || typeLower.includes('audio')) return FiHeadphones;
    if (typeLower.includes('sim') || typeLower.includes('chip')) return FiCpu;
    if (typeLower.includes('electronics')) return FiCpu;
    if (typeLower.includes('furniture')) return FiPackage;
    if (typeLower.includes('vehicle')) return FiTrendingUp;
    return FiPackage;
  };

  // Helper function to get color based on asset type
  const getColorForAssetType = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('phone') || typeLower.includes('mobile')) return 'primary';
    if (typeLower.includes('laptop')) return 'info';
    if (typeLower.includes('desktop') || typeLower.includes('pc')) return 'warning';
    if (typeLower.includes('headphone') || typeLower.includes('audio')) return 'success';
    if (typeLower.includes('sim') || typeLower.includes('chip')) return 'secondary';
    return 'primary';
  };

  // ✅ FIXED: Fetch user's asset requests from asset-requests API
  const fetchRequests = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/asset-requests/my-requests", {  // ✅ FIXED: Changed from /assets/my-requests to /asset-requests/my-requests
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("📋 Requests API Response:", res.data);
      
      const data = res.data.requests || res.data.data || [];
      setRequests(data);
      
      // Extract approved assets from requests
      const approved = data.filter(req => req.status === "approved");
      console.log("✅ Approved assets:", approved.length);
      setAssignedAssets(approved);
      
      calculateStats(data);
      
      if (showRefresh) {
        setNotification({
          message: "✅ Asset data refreshed!",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("❌ Failed to fetch requests:", err);
      setNotification({
        message: "Failed to fetch requests",
        severity: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate stats from requests
  const calculateStats = (data) => {
    const approved = data.filter((r) => r.status === "approved").length;
    const pending = data.filter((r) => r.status === "pending").length;
    const rejected = data.filter((r) => r.status === "rejected").length;
    
    setStats({
      total: data.length,
      approved,
      pending,
      rejected,
      approvalRate: data.length > 0 ? Math.round((approved / data.length) * 100) : 0,
    });
  };

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      getUser(); // Get user info
      
      try {
        // Fetch both company assets and user requests in parallel
        await Promise.all([
          fetchCompanyAssets(),
          fetchRequests()
        ]);
      } catch (error) {
        console.error('❌ Error loading asset data:', error);
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, []);

  // ✅ FIXED: Handle asset request using asset-requests API
  const handleRequest = async () => {
    if (!newAsset) {
      setNotification({ message: "Please select an asset.", severity: "error" });
      return;
    }

    // Find the selected asset details
    const selectedAsset = companyAssets.find(asset => asset._id === newAsset);

    if (!selectedAsset) {
      setNotification({ message: "Invalid asset selected.", severity: "error" });
      return;
    }

    // Check if asset is available
    if (selectedAsset.status !== 'Available') {
      setNotification({ 
        message: `❌ This asset is ${selectedAsset.status}. Only Available assets can be requested.`, 
        severity: "error" 
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // ✅ FIXED: Send only required fields to match backend
      const requestData = {
        assetId: newAsset,
        reason: `Request for ${selectedAsset.name}`,
        expectedReturnDate: null
      };
      
      console.log("📤 Sending request:", requestData);
      
      // ✅ FIXED: Changed endpoint to /asset-requests/request
      await axios.post(
        "/asset-requests/request",
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotification({ 
        message: "🎉 Request submitted successfully!", 
        severity: "success" 
      });
      
      setNewAsset("");
      await fetchRequests(); // Refresh to get updated requests
      await fetchCompanyAssets(); // Refresh to update available assets
      
    } catch (error) {
      console.error("❌ Request failed:", error);
      setNotification({ 
        message: error.response?.data?.error || "❌ Request failed. Please try again.", 
        severity: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.status?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || req.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getAssetIcon = (assetName) => {
    const asset = allowedAssets.find(a => a.label === assetName);
    return asset ? asset.icon : FiPackage;
  };

  const getAssetColor = (assetName) => {
    const asset = allowedAssets.find(a => a.label === assetName);
    return asset ? asset.color : 'primary';
  };

  // Show loader while page is loading
  if (pageLoading) {
    return <CIISLoader />;
  }

  // Count available assets
  const availableAssetsCount = allowedAssets.filter(a => a.available).length;
  const totalAssetsCount = allowedAssets.length;

  return (
    <div className="MyAssets-container">
      {/* Header */}
      <div className="MyAssets-header">
        <div className="MyAssets-header-content">
          <div className="MyAssets-header-text">
            <h1 className="MyAssets-title">Asset Management</h1>
            <p className="MyAssets-subtitle">
              Manage and request assets with real-time status tracking
            </p>
            {userInfo && (
              <div className="MyAssets-user-badge">
                <FiUser /> {userInfo.name} ({userInfo.companyName || 'Your Company'})
              </div>
            )}
          </div>

          <div className="MyAssets-header-actions">
            <button
              className="MyAssets-icon-button"
              onClick={() => {
                fetchCompanyAssets();
                fetchRequests(true);
              }}
              disabled={refreshing}
              title="Refresh data"
            >
              <FiRefreshCw className={refreshing ? "MyAssets-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="MyAssets-stats-grid">
        {/* Available Assets Stat */}
        <div className="MyAssets-stat-card" style={{ cursor: 'default' }}>
          <div className="MyAssets-stat-card-content">
            <div className="MyAssets-stat-avatar MyAssets-primary">
              <FiPackage className="MyAssets-stat-icon" />
            </div>
            <div className="MyAssets-stat-details">
              <p className="MyAssets-stat-label">Available Assets</p>
              <div className="MyAssets-stat-value-container">
                <h3 className="MyAssets-stat-value">{availableAssetsCount}</h3>
                <span className="MyAssets-stat-extra">of {totalAssetsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {[
          { 
            key: "total", 
            label: "Total Requests", 
            color: "primary", 
            icon: FiPackage,
            value: stats.total,
          },
          { 
            key: "approved", 
            label: "Approved", 
            color: "success", 
            icon: FiCheckCircle,
            value: stats.approved,
            extra: `${stats.approvalRate}%`
          },
          { 
            key: "pending", 
            label: "Pending", 
            color: "warning", 
            icon: FiClock,
            value: stats.pending,
          },
          { 
            key: "rejected", 
            label: "Rejected", 
            color: "error", 
            icon: FiXCircle,
            value: stats.rejected,
          },
        ]
        .filter(stat => stat.value > 0)
        .map((stat) => (
          <div
            key={stat.key}
            className={`MyAssets-stat-card ${filterStatus === (stat.key === "total" ? "all" : stat.key) ? "MyAssets-active" : ""}`}
            onClick={() => setFilterStatus(stat.key === "total" ? "all" : stat.key)}
          >
            <div className="MyAssets-stat-card-content">
              <div className={`MyAssets-stat-avatar MyAssets-${stat.color}`}>
                <stat.icon className="MyAssets-stat-icon" />
              </div>
              <div className="MyAssets-stat-details">
                <p className="MyAssets-stat-label">{stat.label}</p>
                <div className="MyAssets-stat-value-container">
                  <h3 className="MyAssets-stat-value">{stat.value}</h3>
                  {stat.extra && (
                    <span className="MyAssets-stat-extra">{stat.extra}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Cards Grid */}
      <div className="MyAssets-action-grid">
        {/* Request New Asset Card */}
        <div className="MyAssets-request-card">
          <div className="MyAssets-card-content">
            <div className="MyAssets-card-header">
              <h2 className="MyAssets-card-title">🚀 Request New Asset</h2>
              <p className="MyAssets-card-subtitle">
                Select from available company assets to make a request
              </p>
              {availableAssetsCount === 0 && (
                <div className="MyAssets-warning-badge">
                  <FiAlertCircle /> No assets available at the moment
                </div>
              )}
            </div>

            <div className="MyAssets-form-section">
              <select
                className="MyAssets-asset-select"
                value={newAsset}
                onChange={(e) => setNewAsset(e.target.value)}
              >
                <option value="">Select asset type...</option>
                {allowedAssets.map((asset) => (
                  <option 
                    key={asset.value} 
                    value={asset.value}
                    disabled={!asset.available}
                    style={{ 
                      color: asset.available ? 'inherit' : '#999',
                      backgroundColor: asset.available ? 'white' : '#f5f5f5'
                    }}
                  >
                    {asset.label} 
                    {asset.model ? ` (${asset.model})` : ''} 
                    {asset.serialNumber ? ` - SN: ${asset.serialNumber}` : ''}
                    {!asset.available && ` (${asset.status || 'Not Available'})`}
                    {asset.available && ' ✅ Available'}
                  </option>
                ))}
                {allowedAssets.length === 0 && (
                  <option value="" disabled>Loading assets...</option>
                )}
              </select>

              <button
                className="MyAssets-submit-button"
                onClick={handleRequest}
                disabled={!newAsset || loading || availableAssetsCount === 0}
              >
                {loading ? (
                  <>
                    <span className="MyAssets-loading-spinner"></span>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <FiPlus className="MyAssets-button-icon" />
                    Request Asset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Assets Card */}
        <div className="MyAssets-properties-card">
          <div className="MyAssets-card-content">
            <div className="MyAssets-card-header">
              <h2 className="MyAssets-card-title">💼 My Assigned Assets</h2>
              <p className="MyAssets-card-subtitle">
                Assets currently assigned to you (Approved requests)
              </p>
            </div>

            <div className="MyAssets-properties-list">
              {assignedAssets.length > 0 ? (
                assignedAssets.map((asset, idx) => {
                  const AssetIcon = getAssetIcon(asset.assetName);
                  const assetColor = getAssetColor(asset.assetName);
                  return (
                    <div key={asset._id || idx} className="MyAssets-property-item">
                      <div className="MyAssets-property-content">
                        <div className={`MyAssets-property-icon MyAssets-${assetColor}`}>
                          <AssetIcon />
                        </div>
                        <div className="MyAssets-property-details">
                          <h4>{asset.assetName}</h4>
                          <p>
                            Approved by: {asset.approvedBy?.name || 'System'} • 
                            {formatDate(asset.updatedAt)}
                          </p>
                        </div>
                        <span className="MyAssets-property-status MyAssets-status-approved">
                          Active
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="MyAssets-no-properties">
                  <FiPackage className="MyAssets-no-properties-icon" />
                  <h3>No Assets Assigned</h3>
                  <p>Your approved assets will appear here</p>
                </div>
              )}
            </div>

            {assignedAssets.length > 0 && (
              <div className="MyAssets-properties-footer">
                <p>Total Assigned: {assignedAssets.length} asset(s)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requests Section */}
      <div className="MyAssets-requests-section">
        <div className="MyAssets-requests-header">
          <div className="MyAssets-requests-title-section">
            <h2>📋 Asset Requests</h2>
            <p>Track your asset request history and status</p>
          </div>

          <div className="MyAssets-requests-actions">
            <div className="MyAssets-search-container">
              <FiSearch className="MyAssets-search-icon" />
              <input
                type="text"
                placeholder="Search requests..."
                className="MyAssets-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="MyAssets-filter-tabs">
          <button
            className={`MyAssets-filter-tab ${filterStatus === "all" ? "MyAssets-active-tab" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All Requests ({stats.total})
          </button>
          <button
            className={`MyAssets-filter-tab ${filterStatus === "approved" ? "MyAssets-active-tab" : ""}`}
            onClick={() => setFilterStatus("approved")}
          >
            Approved ({stats.approved})
          </button>
          <button
            className={`MyAssets-filter-tab ${filterStatus === "pending" ? "MyAssets-active-tab" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            Pending ({stats.pending})
          </button>
          <button
            className={`MyAssets-filter-tab ${filterStatus === "rejected" ? "MyAssets-active-tab" : ""}`}
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        {/* Requests Table (Desktop) */}
        {!isMobile && (
          <div className="MyAssets-table-container">
            <table className="MyAssets-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Status</th>
                  <th>Approved By</th>
                  <th>Requested At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => {
                    const AssetIcon = getAssetIcon(req.assetName);
                    const assetColor = getAssetColor(req.assetName);
                    return (
                      <tr
                        key={req._id}
                        className={`MyAssets-table-row MyAssets-status-${req.status}`}
                      >
                        <td>
                          <div className="MyAssets-asset-cell">
                            <div className={`MyAssets-asset-icon MyAssets-${assetColor}`}>
                              <AssetIcon />
                            </div>
                            <div>
                              <span className="MyAssets-asset-name">{req.assetName}</span>
                              {req.serialNumber && (
                                <div className="MyAssets-asset-serial">SN: {req.serialNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`MyAssets-status-chip MyAssets-status-${req.status}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          <strong>
                            {req.approvedBy
                              ? `${req.approvedBy.name}`
                              : req.status === "pending"
                              ? "Pending Approval"
                              : "—"}
                          </strong>
                        </td>
                        <td>
                          <strong>{formatDate(req.createdAt)}</strong>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="MyAssets-no-data-cell">
                      <FiPackage className="MyAssets-no-data-icon" />
                      <h3>No requests found</h3>
                      <p>
                        {searchTerm
                          ? "Try adjusting your search terms"
                          : "Start by requesting a new asset"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Cards View */}
        {isMobile && (
          <div className="MyAssets-mobile-cards">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                const AssetIcon = getAssetIcon(req.assetName);
                const assetColor = getAssetColor(req.assetName);
                return (
                  <div
                    key={req._id}
                    className={`MyAssets-mobile-card MyAssets-status-${req.status}`}
                  >
                    <div className="MyAssets-mobile-card-content">
                      <div className="MyAssets-mobile-card-header">
                        <div className="MyAssets-mobile-asset-info">
                          <div className={`MyAssets-mobile-asset-icon MyAssets-${assetColor}`}>
                            <AssetIcon />
                          </div>
                          <div>
                            <h3 className="MyAssets-mobile-asset-name">{req.assetName}</h3>
                            <p className="MyAssets-mobile-asset-date">
                              {formatDate(req.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className={`MyAssets-mobile-status-chip MyAssets-status-${req.status}`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="MyAssets-mobile-card-details">
                        <p>
                          <strong>Approved By:</strong>{" "}
                          {req.approvedBy
                            ? `${req.approvedBy.name}`
                            : req.status === "pending"
                            ? "Pending Approval"
                            : "—"}
                        </p>
                        {req.serialNumber && (
                          <p><strong>Serial:</strong> {req.serialNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="MyAssets-no-data-card">
                <FiPackage className="MyAssets-no-data-icon" />
                <h3>No requests found</h3>
                <p>
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Start by requesting a new asset"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`MyAssets-notification MyAssets-notification-${notification.severity}`}>
          <div className="MyAssets-notification-content">
            {notification.severity === "error" ? (
              <FiXCircle className="MyAssets-notification-icon" />
            ) : (
              <FiCheckCircle className="MyAssets-notification-icon" />
            )}
            <div className="MyAssets-notification-text">
              <strong>{notification.severity === "error" ? "Error" : "Success"}</strong>
              <p>{notification.message}</p>
            </div>
          </div>
          <button 
            className="MyAssets-notification-close"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MyAssets;