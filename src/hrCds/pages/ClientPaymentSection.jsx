import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import './PaymentSection.css';

// Icons
import {
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiCreditCard,
  FiUpload,
  FiFileText,
  FiInfo,
  FiRefreshCw,
  FiArrowLeft
} from 'react-icons/fi';

// ========== HELPER FUNCTIONS ==========
const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

const getLatestSubscription = (client) => {
  if (!client || !client.subscription || client.subscription.length === 0) {
    return null;
  }
  return client.subscription[client.subscription.length - 1];
};

const isSubscriptionExpired = (subscription) => {
  if (!subscription || !subscription.endDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(subscription.endDate);
  endDate.setHours(0, 0, 0, 0);
  return endDate < today;
};

const formatSubscriptionDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getDaysRemaining = (subscription) => {
  if (!subscription || !subscription.endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(subscription.endDate);
  endDate.setHours(0, 0, 0, 0);
  
  if (endDate < today) return null;
  
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// ========== SUBSCRIPTION STATUS BADGE ==========
const SubscriptionStatusBadge = ({ subscription }) => {
  const expired = isSubscriptionExpired(subscription);
  const daysRemaining = getDaysRemaining(subscription);
  
  if (!subscription) {
    return (
      <div className="ClientDashboard-subscription-badge ClientDashboard-subscription-badge--none">
        <FiAlertCircle size={14} />
        <span>No Subscription</span>
      </div>
    );
  }
  
  if (expired) {
    return (
      <div className="ClientDashboard-subscription-badge ClientDashboard-subscription-badge--expired">
        <FiAlertCircle size={14} />
        <span>Expired</span>
      </div>
    );
  }
  
  return (
    <div className="ClientDashboard-subscription-badge ClientDashboard-subscription-badge--active">
      <FiCheckCircle size={14} />
      <span>Active</span>
      {daysRemaining !== null && daysRemaining <= 7 && (
        <span className="ClientDashboard-subscription-warning">
          ({daysRemaining} days left)
        </span>
      )}
    </div>
  );
};

// ========== SUBSCRIPTION RENEWAL COMPONENT ==========
const SubscriptionRenewal = ({ clientId, onRenewalSuccess, api, currentSubscription }) => {
  const [renewAmount, setRenewAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (currentSubscription && currentSubscription.price) {
      setRenewAmount(currentSubscription.price.toString());
    }
  }, [currentSubscription]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please upload a valid file (JPEG, PNG, or PDF)' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size should be less than 5MB' });
        return;
      }
      
      setReceiptFile(file);
      setMessage({ type: '', text: '' });
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleReceiptUpload = async () => {
    if (!renewAmount || !transactionId || !receiptFile) {
      setMessage({ type: 'error', text: 'Please fill all fields and upload receipt' });
      return;
    }

    if (isNaN(renewAmount) || parseFloat(renewAmount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setUploadingReceipt(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('amount', renewAmount);
      formData.append('transactionId', transactionId);
      formData.append('receipt', receiptFile);
      formData.append('uploadDate', new Date().toISOString());

      const response = await api.post(`/upload-receipt/${clientId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Receipt uploaded successfully! It has been submitted for review.' });
        
        setRenewAmount('');
        setTransactionId('');
        setReceiptFile(null);
        setPreviewUrl(null);
        
        if (onRenewalSuccess) {
          onRenewalSuccess();
        }
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 5000);
      } else {
        setMessage({ type: 'error', text: response.data?.message || 'Failed to upload receipt' });
      }
    } catch (error) {
      console.error('Error uploading receipt:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload receipt. Please try again.' 
      });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleReset = () => {
    if (currentSubscription && currentSubscription.price) {
      setRenewAmount(currentSubscription.price.toString());
    } else {
      setRenewAmount('');
    }
    setTransactionId('');
    setReceiptFile(null);
    setPreviewUrl(null);
    setMessage({ type: '', text: '' });
  };

  const subscriptionPrice = currentSubscription?.price;
  const isExpired = isSubscriptionExpired(currentSubscription);

  return (
    <div className="ClientDashboard-renewal-card">
      <div className="ClientDashboard-card-header">
        <h3>Renew Subscription</h3>
        <FiRefreshCw className="ClientDashboard-card-header-icon" />
      </div>
      
      <div className="ClientDashboard-renewal-content">
        <p className="ClientDashboard-renewal-description">
          Submit your payment details to renew your subscription. Once verified, your subscription will be extended.
        </p>
        
        {subscriptionPrice && subscriptionPrice > 0 && (
          <div className="ClientDashboard-current-price-info">
            <div className="ClientDashboard-price-card">
              <div className="ClientDashboard-price-label">
                <FiDollarSign size={20} />
                <span>Current Subscription Amount</span>
              </div>
              <div className="ClientDashboard-price-amount">
                ₹{typeof subscriptionPrice === 'number' ? subscriptionPrice.toLocaleString('en-IN') : subscriptionPrice}
              </div>
              {isExpired && (
                <div className="ClientDashboard-price-note">
                  <FiAlertCircle size={12} />
                  <small>Your subscription has expired. Please renew to continue services.</small>
                </div>
              )}
              {!isExpired && (
                <div className="ClientDashboard-price-note ClientDashboard-price-note--success">
                  <FiCheckCircle size={12} />
                  <small>Renew now to continue uninterrupted service</small>
                </div>
              )}
            </div>
          </div>
        )}
        
        {message.text && (
          <div className={`ClientDashboard-renewal-message ClientDashboard-renewal-message--${message.type}`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{message.text}</span>
          </div>
        )}
        
        <div className="ClientDashboard-renewal-form">
          <div className="ClientDashboard-form-group">
            <label className="ClientDashboard-form-label">
              <FiDollarSign className="ClientDashboard-form-icon" />
              Amount (₹)
            </label>
            <input
              type="number"
              className="ClientDashboard-form-input"
              placeholder="Enter amount"
              value={renewAmount}
              onChange={(e) => setRenewAmount(e.target.value)}
              disabled={uploadingReceipt}
            />
            {subscriptionPrice && subscriptionPrice > 0 && (
              <small className="ClientDashboard-form-hint">
                Suggested amount: ₹{typeof subscriptionPrice === 'number' ? subscriptionPrice.toLocaleString('en-IN') : subscriptionPrice}
              </small>
            )}
          </div>
          
          <div className="ClientDashboard-form-group">
            <label className="ClientDashboard-form-label">
              <FiCreditCard className="ClientDashboard-form-icon" />
              Transaction ID
            </label>
            <input
              type="text"
              className="ClientDashboard-form-input"
              placeholder="Enter transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={uploadingReceipt}
            />
          </div>
          
          <div className="ClientDashboard-form-group">
            <label className="ClientDashboard-form-label">
              <FiUpload className="ClientDashboard-form-icon" />
              Upload Receipt
            </label>
            <div className="ClientDashboard-file-upload-area">
              <input
                type="file"
                id="receipt-upload"
                className="ClientDashboard-file-input"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                disabled={uploadingReceipt}
              />
              <label htmlFor="receipt-upload" className="ClientDashboard-file-upload-label">
                {receiptFile ? (
                  <>
                    <FiFileText />
                    <span>{receiptFile.name}</span>
                    <button 
                      className="ClientDashboard-file-clear"
                      onClick={(e) => {
                        e.preventDefault();
                        setReceiptFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <FiUpload />
                    <span>Click or drag to upload receipt</span>
                    <small>JPEG, PNG, or PDF (Max 5MB)</small>
                  </>
                )}
              </label>
            </div>
            
            {previewUrl && (
              <div className="ClientDashboard-file-preview">
                <img src={previewUrl} alt="Receipt Preview" />
              </div>
            )}
          </div>
          
          <div className="ClientDashboard-renewal-actions">
            <button 
              className="ClientDashboard-btn ClientDashboard-btn--outlined"
              onClick={handleReset}
              disabled={uploadingReceipt}
            >
              Reset
            </button>
            <button 
              className="ClientDashboard-btn ClientDashboard-btn--primary"
              onClick={handleReceiptUpload}
              disabled={uploadingReceipt}
            >
              {uploadingReceipt ? (
                <>
                  <div className="ClientDashboard-spinner-small"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload />
                  Submit Renewal
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="ClientDashboard-renewal-info">
          <FiInfo size={14} />
          <small>
            Your payment will be verified by the owner. You'll receive a confirmation once approved.
          </small>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN PAYMENT SECTION COMPONENT ==========
const PaymentSection = () => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({
    companyCode: '',
    companyIdentifier: ''
  });

  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);

  const api = axios.create({
    baseURL: `${API_URL}/clientsservice`,
    timeout: 10000,
  });

  const addAuthInterceptor = (axiosInstance) => {
    axiosInstance.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  };

  addAuthInterceptor(api);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchCompanyInfo = () => {
      const companyCode = localStorage.getItem('companyCode') || '';
      const companyIdentifier = localStorage.getItem('companyIdentifier') || '';
      const company = localStorage.getItem('company') || '';
      
      setCompanyInfo({
        companyCode: companyCode || company,
        companyIdentifier: companyIdentifier
      });
    };

    fetchCompanyInfo();
  }, []);

  const fetchClientData = async () => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not found. Please login again.');
        return;
      }

      const user = JSON.parse(userStr);
      
      const response = await api.get('/', {
        params: {
          companyCode: companyInfo.companyCode,
          companyIdentifier: companyInfo.companyIdentifier
        }
      });

      if (response.data?.success && isMounted.current) {
        const allClients = response.data.data || [];
        
        let currentClient = allClients.find(c => 
          c.email === user.email || 
          c.client === user.name ||
          c._id === user.id ||
          (c.projectManagers && c.projectManagers.some(pm => pm.email === user.email))
        );
        
        if (!currentClient && allClients.length > 0) {
          currentClient = allClients[0];
        }
        
        setClient(currentClient);
      } else {
        setError('No client data found');
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Failed to load payment section');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleRenewalSuccess = () => {
    fetchClientData();
  };

  useEffect(() => {
    if ((companyInfo.companyCode || companyInfo.companyIdentifier) && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchClientData();
    }
  }, [companyInfo.companyCode, companyInfo.companyIdentifier]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('companyCode');
    localStorage.removeItem('companyIdentifier');
    localStorage.removeItem('company');
    window.location.href = '/login';
  };

  const latestSubscription = getLatestSubscription(client);
  const subscriptionExpired = isSubscriptionExpired(latestSubscription);
  const daysRemaining = getDaysRemaining(latestSubscription);

  if (loading) {
    return (
      <div className="ClientDashboard-dashboard-loading">
        <div className="ClientDashboard-loading-spinner"></div>
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ClientDashboard-dashboard-error">
        <FiAlertCircle className="ClientDashboard-error-icon" />
        <h3>Error Loading Payment Section</h3>
        <p>{error}</p>
        <div className="ClientDashboard-error-actions">
          <button className="ClientDashboard-btn ClientDashboard-btn--primary" onClick={fetchClientData}>
            Try Again
          </button>
          <button className="ClientDashboard-btn ClientDashboard-btn--outlined" onClick={handleLogout}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="ClientDashboard-dashboard-error">
        <FiAlertCircle className="ClientDashboard-error-icon" />
        <h3>No Client Data</h3>
        <p>No client information found for your account.</p>
        <button className="ClientDashboard-btn ClientDashboard-btn--primary" onClick={handleLogout}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="ClientDashboard-payment-section">
      <div className="ClientDashboard-welcome-header">
        <div>
          <h1>Payment & Subscription</h1>
          <p>Manage your subscription and payment details</p>
        </div>
      </div>

      <div className="ClientDashboard-payment-container">
        {/* Subscription Details Card */}
        <div className="ClientDashboard-subscription-card">
          <div className="ClientDashboard-card-header">
            <h3>Subscription Details</h3>
            <FiCalendar className="ClientDashboard-card-header-icon" />
          </div>
          
          {latestSubscription ? (
            <div className="ClientDashboard-subscription-content">
              <div className="ClientDashboard-subscription-status-wrapper">
                <SubscriptionStatusBadge subscription={latestSubscription} />
              </div>
              
              {latestSubscription.price && latestSubscription.price > 0 && (
                <div className="ClientDashboard-subscription-price-info">
                  <div className="ClientDashboard-price-row">
                    <span className="ClientDashboard-price-label">Plan Amount:</span>
                    <span className="ClientDashboard-price-value">
                      ₹{typeof latestSubscription.price === 'number' ? latestSubscription.price.toLocaleString('en-IN') : latestSubscription.price}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="ClientDashboard-subscription-dates">
                <div className="ClientDashboard-subscription-date-item">
                  <div className="ClientDashboard-date-label">
                    <FiCalendar size={14} />
                    <span>Start Date</span>
                  </div>
                  <p className="ClientDashboard-date-value">
                    {formatSubscriptionDate(latestSubscription.startDate)}
                  </p>
                </div>
                
                <div className="ClientDashboard-subscription-date-item">
                  <div className="ClientDashboard-date-label">
                    <FiCalendar size={14} />
                    <span>End Date</span>
                  </div>
                  <p className={`ClientDashboard-date-value ${subscriptionExpired ? 'ClientDashboard-date-value--expired' : ''}`}>
                    {formatSubscriptionDate(latestSubscription.endDate)}
                  </p>
                </div>
              </div>
              
              <div className="ClientDashboard-subscription-validity">
                {subscriptionExpired ? (
                  <div className="ClientDashboard-validity-expired">
                    <FiAlertCircle size={16} />
                    <span>Subscription has expired. Please renew to continue services.</span>
                  </div>
                ) : (
                  <div className="ClientDashboard-validity-active">
                    <FiCheckCircle size={16} />
                    <span>
                      Valid till {formatSubscriptionDate(latestSubscription.endDate)}
                      {daysRemaining !== null && (
                        <strong> ({daysRemaining} days remaining)</strong>
                      )}
                    </span>
                  </div>
                )}
              </div>
              
              {!subscriptionExpired && latestSubscription.startDate && latestSubscription.endDate && (
                <div className="ClientDashboard-subscription-progress">
                  <div className="ClientDashboard-progress-label">
                    <span>Subscription Period Progress</span>
                    <span>{daysRemaining !== null ? daysRemaining : 0} days left</span>
                  </div>
                  <div className="ClientDashboard-progress-bar">
                    <div 
                      className={`ClientDashboard-progress-bar__fill ${
                        daysRemaining !== null && daysRemaining <= 7 
                          ? 'ClientDashboard-progress-bar__fill--warning'
                          : 'ClientDashboard-progress-bar__fill--success'
                      }`}
                      style={{ 
                        width: `${(() => {
                          if (!latestSubscription.startDate || !latestSubscription.endDate) return 0;
                          const start = new Date(latestSubscription.startDate);
                          const end = new Date(latestSubscription.endDate);
                          const today = new Date();
                          const total = end - start;
                          const elapsed = today - start;
                          const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
                          return percentage;
                        })()}%` 
                      }}
                    >
                      <div className="ClientDashboard-progress-glow"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ClientDashboard-subscription-empty">
              <FiAlertCircle size={32} />
              <p>No subscription information available</p>
              <small>Please contact your administrator for subscription details</small>
            </div>
          )}
        </div>

        {/* Subscription Renewal Card */}
        <SubscriptionRenewal 
          clientId={client._id}
          onRenewalSuccess={handleRenewalSuccess}
          api={api}
          currentSubscription={latestSubscription}
        />
      </div>
    </div>
  );
};

export default PaymentSection;
