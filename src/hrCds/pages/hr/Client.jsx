import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../../config';
import './client-management.css';


import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiUsers,
  FiTrendingUp,
  FiInfo,
  FiPlus,
  FiRefreshCw,
  FiEdit,
  FiEye,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiX,
  FiSave,
  FiCalendar,
  FiUser,
  FiBriefcase,
  FiFlag,
  FiMapPin,
  FiActivity,
  FiChevronDown,
  FiChevronUp,
  FiCreditCard,
  FiUpload
} from 'react-icons/fi';


import { FaTasks, FaProjectDiagram, FaCity, FaRupeeSign } from 'react-icons/fa';
import { Repeat } from 'lucide-react';






const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

const isClientTaskOverdue = taskOrDueDate => {
  const dueDateValue = typeof taskOrDueDate === 'object' && taskOrDueDate !== null
    ? taskOrDueDate.dueDate
    : taskOrDueDate;
  const completed = typeof taskOrDueDate === 'object' && taskOrDueDate !== null
    ? taskOrDueDate.completed
    : false;
  const status = typeof taskOrDueDate === 'object' && taskOrDueDate !== null
    ? String(taskOrDueDate.status || 'pending').trim().toLowerCase()
    : 'pending';

  if (!dueDateValue || completed) return false;
  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) return false;
  if (status === 'overdue') return dueDate < new Date();
  if (status !== 'pending') return false;
  return dueDate < new Date();
};

const formatDateTimeForInput = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const convertToISODateString = (val) => {
  if (!val) return null;
  const date = new Date(val);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const formatClientTaskDue = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};


const api = axios.create({
  baseURL: `${API_URL}/clientsservice`,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


const tasksApi = axios.create({
  baseURL: `${API_URL}/tasks/client-tasks`,
  timeout: 10000,
});

tasksApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const clientPlansApi = axios.create({
  baseURL: `${API_URL}/client-plans`,
  timeout: 10000,
});

clientPlansApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


const usersApi = axios.create({
  baseURL: `${API_URL}/users`,
  timeout: 10000,
});

usersApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);




const PaymentReceiptsModal = ({ open, onClose, client, onRenewSubscription, userRole, clientPlans = [] }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState('');
  const [months, setMonths] = useState(1);
  const [clientPlanId, setClientPlanId] = useState('');
  const [extraTasks, setExtraTasks] = useState(0);
  const [benefits, setBenefits] = useState('');
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [renewMessage, setRenewMessage] = useState({ type: '', text: '' });
  const [updating, setUpdating] = useState(false);
  const [dueTitle, setDueTitle] = useState('Subscription Due');
  const [dueAmount, setDueAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueNote, setDueNote] = useState('');
  const [dueStatus, setDueStatus] = useState('Due');
  const [subscriptionTasks, setSubscriptionTasks] = useState([]);
  const [subscriptionTasksLoading, setSubscriptionTasksLoading] = useState(false);

  useEffect(() => {
    if (!open || !client?._id) {
      setSubscriptionTasks([]);
      return;
    }

    let cancelled = false;
    const loadSubscriptionTasks = async () => {
      try {
        setSubscriptionTasksLoading(true);
        const response = await tasksApi.get(`/client/${client._id}`);
        const tasks = Array.isArray(response.data?.data)
          ? response.data.data
          : response.data?.data?.tasks || [];
        if (!cancelled) setSubscriptionTasks(Array.isArray(tasks) ? tasks : []);
      } catch (error) {
        console.error('Error loading subscription tasks:', error);
        if (!cancelled) setSubscriptionTasks([]);
      } finally {
        if (!cancelled) setSubscriptionTasksLoading(false);
      }
    };

    loadSubscriptionTasks();
    return () => {
      cancelled = true;
    };
  }, [open, client?._id]);

  if (!open || !client) return null;

  const paymentReceipts = client.paymentReceipts || [];
  const latestSubscription = client.subscription && client.subscription.length > 0 
    ? client.subscription[client.subscription.length - 1] 
    : null;
  const latestPaymentReceipt = paymentReceipts.length > 0
    ? paymentReceipts[paymentReceipts.length - 1]
    : null;

  const canRenewSubscription = true;
  const subscriptions = client.subscription || [];
  const getTaskStatusLabel = task => {
    if (task.completed) return 'Completed';
    if (isClientTaskOverdue(task)) return 'Overdue';
    return task.status ? String(task.status).replace(/-/g, ' ') : 'Pending';
  };
  const getTaskStatusBadge = task => {
    if (task.completed) return 'ClientManagement-badge--success';
    if (isClientTaskOverdue(task)) return 'ClientManagement-badge--error';
    const status = String(task.status || '').toLowerCase();
    if (status.includes('progress')) return 'ClientManagement-badge--info';
    return 'ClientManagement-badge--warning';
  };
  const getTasksForSubscription = subscription => {
    const subscriptionId = String(subscription?._id || subscription?.id || '');
    return subscriptionTasks.filter(task => {
      const taskSubscriptionId = String(task.subscriptionId?._id || task.subscriptionId || '');
      if (subscriptionId && taskSubscriptionId && taskSubscriptionId === subscriptionId) return true;
      return subscription?.subscriptionNo && Number(task.subscriptionNo) === Number(subscription.subscriptionNo);
    });
  };

  const calculateEndDate = (startDateValue, monthsValue) => {
    if (!startDateValue || !monthsValue) return '';
    const date = new Date(startDateValue);
    date.setMonth(date.getMonth() + parseInt(monthsValue));
    return date.toISOString().split('T')[0];
  };

  const handleMonthsChange = (selectedMonths) => {
    setMonths(selectedMonths);
    if (startDate) {
      const calculatedEndDate = calculateEndDate(startDate, selectedMonths);
      setEndDate(calculatedEndDate);
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (date && months) {
      const calculatedEndDate = calculateEndDate(date, months);
      setEndDate(calculatedEndDate);
    }
  };

  const handleRenewPlanChange = (planId) => {
    const plan = clientPlans.find(item => item._id === planId);
    setClientPlanId(planId);
    if (!plan) return;
    setPrice(String(plan.price || 0));
    setMonths(plan.months || 1);
    if (startDate) {
      setEndDate(calculateEndDate(startDate, plan.months || 1));
    }
  };

  const handleUpdateSubscription = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!startDate || !endDate) {
      setRenewMessage({
        type: 'error',
        text: 'Please select both start and end date'
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setRenewMessage({
        type: 'error',
        text: 'End date must be greater than start date'
      });
      return;
    }

    if (price && (isNaN(price) || parseFloat(price) <= 0)) {
      setRenewMessage({
        type: 'error',
        text: 'Please enter a valid price (positive number)'
      });
      return;
    }

    setUpdating(true);
    setRenewMessage({ type: '', text: '' });

    try {
      const response = await api.patch(
        `/renew-subscription/${client._id}`,
        {
          startDate,
          endDate,
          price: price ? parseFloat(price) : undefined,
          clientPlanId,
          extraTasks: extraTasks ? parseInt(extraTasks) : 0,
          benefits: benefits || ''
        }
      );

      if (response.data.success) {
        setRenewMessage({
          type: 'success',
          text: 'Subscription updated successfully!'
        });

        setStartDate('');
        setEndDate('');
        setPrice('');
        setMonths(1);
        setClientPlanId('');
        setExtraTasks(0);
        setBenefits('');

        if (onRenewSubscription) {
          await onRenewSubscription();
        }

        setTimeout(() => {
          setShowRenewForm(false);
          setRenewMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      setRenewMessage({
        type: 'error',
        text: error.response?.data?.message || 'Update failed'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveSubscription = async () => {
    if (!window.confirm('Are you sure you want to remove the subscription for this client?')) {
      return;
    }

    setUpdating(true);
    setRenewMessage({ type: '', text: '' });

    try {
      const response = await api.delete(`/subscription/${client._id}`);

      if (response.data.success) {
        setRenewMessage({
          type: 'success',
          text: 'Subscription removed successfully!'
        });
        
        if (onRenewSubscription) {
          onRenewSubscription();
        }   

        setTimeout(() => {
          setShowRenewForm(false);
          setRenewMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      setRenewMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to remove subscription'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddDueInvoice = async (e) => {
    e.preventDefault();
    if (!dueAmount || Number(dueAmount) <= 0) {
      setRenewMessage({ type: 'error', text: 'Please enter a valid due amount' });
      return;
    }

    setUpdating(true);
    setRenewMessage({ type: '', text: '' });
    try {
      const response = await api.post(`/due-invoice/${client._id}`, {
        title: dueTitle,
        amount: Number(dueAmount),
        dueDate: dueDate || new Date().toISOString(),
        note: dueNote,
        status: dueStatus
      });

      if (response.data.success) {
        setRenewMessage({ type: 'success', text: 'Due payment added for client portal' });
        setDueTitle('Subscription Due');
        setDueAmount('');
        setDueDate('');
        setDueNote('');
        setDueStatus('Due');
        if (onRenewSubscription) onRenewSubscription();
      }
    } catch (error) {
      setRenewMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add due payment' });
    } finally {
      setUpdating(false);
    }
  };

  const handleReceiptStatus = async (receipt, status) => {
    setUpdating(true);
    setRenewMessage({ type: '', text: '' });
    try {
      const response = status === 'Approved'
        ? await api.patch(`/${client._id}/receipt/${receipt._id}/payment-done`, {
            notes: 'Payment status marked done by team'
          })
        : await api.patch(`/${client._id}/receipt/${receipt._id}/status`, {
            status,
            activateClient: false,
            notes: 'Payment proof rejected'
          });

      if (response.data.success) {
        setRenewMessage({
          type: 'success',
          text: status === 'Approved'
            ? 'Payment approved. Due note removed and client activated.'
            : 'Payment proof rejected. Due note is visible again.'
        });
        if (onRenewSubscription) onRenewSubscription();
      }
    } catch (error) {
      setRenewMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update receipt' });
    } finally {
      setUpdating(false);
    }
  };

  const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="ClientManagement-modal-overlay" onClick={onClose}>
      <div className="ClientManagement-modal ClientManagement-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>
            <FiCreditCard className="ClientManagement-header-icon" />
            Payment Receipts & Subscription - {client.client}
          </h3>
          <button className="ClientManagement-action-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="ClientManagement-modal__content">
          {latestSubscription && new Date(latestSubscription.endDate) < new Date() && (
            <div className="ClientManagement-renewal-message ClientManagement-renewal-message--error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiAlertCircle size={20} />
                <span><strong>⚠️ Subscription Expired:</strong> This client's subscription has expired. Please renew to resume services.</span>
              </div>
              {canRenewSubscription && !showRenewForm && (
                <button 
                  onClick={() => setShowRenewForm(true)}
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  Renew Subscription
                </button>
              )}
            </div>
          )}

          {latestSubscription ? (
            <div className="ClientManagement-current-subscription-info">
              <h4>📅 Current Subscription</h4>
              <div className="ClientManagement-subscription-details">
                <div className="ClientManagement-subscription-date">
                  <strong>Start:</strong> {new Date(latestSubscription.startDate).toLocaleDateString()}
                </div>
                <div className="ClientManagement-subscription-date">
                  <strong>End:</strong> {new Date(latestSubscription.endDate).toLocaleDateString()}
                </div>
                {latestSubscription.price && (
                  <div className="ClientManagement-subscription-price">
                    <strong>Price:</strong> ₹{typeof latestSubscription.price === 'number' ? latestSubscription.price.toLocaleString('en-IN') : latestSubscription.price}
                  </div>
                )}
                {latestSubscription.extraTasks > 0 && (
                  <div className="ClientManagement-subscription-date" style={{ color: '#10b981', fontWeight: 'bold' }}>
                    <strong>Extra Free Tasks:</strong> +{latestSubscription.extraTasks}
                  </div>
                )}
                {latestSubscription.benefits && (
                  <div className="ClientManagement-subscription-date" style={{ fontStyle: 'italic', color: '#6b7280' }}>
                    <strong>Benefits:</strong> {latestSubscription.benefits}
                  </div>
                )}
                <div className={`ClientManagement-subscription-status ${new Date(latestSubscription.endDate) < new Date() ? 'expired' : 'active'}`}>
                  {new Date(latestSubscription.endDate) < new Date() ? 'Expired' : 'Active'}
                </div>
              </div>
            </div>
          ) : (
            <div className="ClientManagement-current-subscription-info ClientManagement-no-subscription">
              <h4>📅 No Active Subscription</h4>
              <div className="ClientManagement-subscription-details">
                <p className="ClientManagement-text-muted">This client doesn't have an active subscription.</p>
              </div>
            </div>
          )}

          <div className="ClientManagement-current-subscription-info">
            <h4>Payment Status</h4>
            <div className="ClientManagement-subscription-details">
              <span className={`ClientManagement-badge ${
                latestPaymentReceipt?.status === 'Approved' ? 'ClientManagement-badge--success' :
                latestPaymentReceipt?.status === 'Rejected' ? 'ClientManagement-badge--error' :
                latestPaymentReceipt?.status === 'Pending' ? 'ClientManagement-badge--warning' :
                'ClientManagement-badge--info'
              }`}>
                {latestPaymentReceipt?.status
                  ? `Payment ${latestPaymentReceipt.status}`
                  : 'No Payment Receipt'}
              </span>
              {latestPaymentReceipt?.amount && (
                <strong>₹{Number(latestPaymentReceipt.amount || 0).toLocaleString('en-IN')}</strong>
              )}
              {canRenewSubscription && (
                <button
                  type="button"
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  onClick={() => setShowRenewForm(!showRenewForm)}
                  disabled={updating}
                >
                  <FiPlus /> {showRenewForm ? 'Cancel Renewal' : 'Renew Subscription'}
                </button>
              )}
              {latestPaymentReceipt?.status === 'Pending' && canRenewSubscription && (
                <button
                  type="button"
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  onClick={() => handleReceiptStatus(latestPaymentReceipt, 'Approved')}
                  disabled={updating}
                >
                  <FiCheckCircle /> Payment Status Done
                </button>
              )}
            </div>
          </div>

          {canRenewSubscription && (
            <>
              {(!latestSubscription || new Date(latestSubscription.endDate) < new Date()) && latestPaymentReceipt?.status !== 'Approved' && (
                <div className="ClientManagement-renewal-form-container">
                  <h4>Payment Due For Client Portal</h4>
                  <form className="ClientManagement-renewal-form" onSubmit={handleAddDueInvoice}>
                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">Due Title</label>
                      <input
                        type="text"
                        className="ClientManagement-form-input"
                        value={dueTitle}
                        onChange={(e) => setDueTitle(e.target.value)}
                        disabled={updating}
                      />
                    </div>
                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">Due Amount</label>
                      <input
                        type="number"
                        className="ClientManagement-form-input"
                        value={dueAmount}
                        onChange={(e) => setDueAmount(e.target.value)}
                        min="0"
                        disabled={updating}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">Due Date</label>
                      <input
                        type="date"
                        className="ClientManagement-form-input"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        disabled={updating}
                      />
                    </div>
                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">Due Note</label>
                      <input
                        type="text"
                        className="ClientManagement-form-input"
                        value={dueNote}
                        onChange={(e) => setDueNote(e.target.value)}
                        disabled={updating}
                        placeholder="Message shown to client"
                      />
                    </div>
                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">Payment Status</label>
                      <select
                        className="ClientManagement-form-input"
                        value={dueStatus}
                        onChange={(e) => setDueStatus(e.target.value)}
                        disabled={updating}
                      >
                        <option value="Due">Due</option>
                        <option value="Pending Verification">Pending Verification</option>
                        <option value="Paid">Paid</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="ClientManagement-renewal-actions">
                      <button type="submit" className="ClientManagement-btn ClientManagement-btn--primary" disabled={updating}>
                        <FaRupeeSign /> Add Due Payment
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {(client.dueInvoices || []).filter(invoice => invoice.status !== 'Paid' && invoice.status !== 'Cancelled').length > 0 && (
                <div className="ClientManagement-current-subscription-info">
                  <h4>Active Due Notes</h4>
                  <div className="ClientManagement-payment-receipts-list">
                    {(client.dueInvoices || []).filter(invoice => invoice.status !== 'Paid' && invoice.status !== 'Cancelled').map(invoice => (
                      <div key={invoice._id} className="ClientManagement-payment-receipt-card">
                        <div className="ClientManagement-payment-receipt-header">
                          <strong>{invoice.title || 'Subscription Due'}</strong>
                          <span className="ClientManagement-badge ClientManagement-badge--warning">{invoice.status}</span>
                        </div>
                        <div className="ClientManagement-payment-detail-row">
                          <div className="ClientManagement-payment-detail-label">Amount:</div>
                          <div className="ClientManagement-payment-detail-value ClientManagement-amount-highlight">
                            ₹{Number(invoice.amount || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="ClientManagement-payment-detail-row">
                          <div className="ClientManagement-payment-detail-label">Due Date:</div>
                          <div className="ClientManagement-payment-detail-value">
                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        {invoice.note && <div className="ClientManagement-text-muted">{invoice.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ClientManagement-renewal-section">
                {latestSubscription && (
                  <button 
                    type="button"
                    className="ClientManagement-renewal-toggle-btn ClientManagement-remove-subscription-btn"
                    onClick={handleRemoveSubscription}
                    disabled={updating}
                  >
                    <FiTrash2 /> Remove Subscription
                  </button>
                )}
              </div>

              {showRenewForm && (
                <div className="ClientManagement-renewal-form-container">
                  <h4>🔄 Upgrade / Renew Client Plan</h4>
                  
                  {renewMessage.text && (
                    <div className={`ClientManagement-renewal-message ClientManagement-renewal-message--${renewMessage.type}`}>
                      {renewMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                      <span>{renewMessage.text}</span>
                    </div>
                  )}

                  <div className="ClientManagement-renewal-form">
                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FiBriefcase /> Select Plan
                      </label>
                      <select
                        className="ClientManagement-form-input"
                        value={clientPlanId}
                        onChange={(e) => handleRenewPlanChange(e.target.value)}
                        disabled={updating}
                      >
                        <option value="">Manual renewal</option>
                        {clientPlans.map(plan => (
                          <option key={plan._id} value={plan._id}>
                            {plan.name} - ₹{Number(plan.price || 0).toLocaleString('en-IN')} / {plan.months || 1} month
                          </option>
                        ))}
                      </select>
                      <small className="ClientManagement-text-muted">Selecting a plan will generate fresh tasks for the next subscription.</small>
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FiCalendar /> Start Date
                      </label>
                      <input
                        type="date"
                        className="ClientManagement-form-input"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        disabled={updating}
                      />
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FiCalendar /> Subscription Period (Months)
                      </label>
                      <select
                        className="ClientManagement-form-input"
                        value={months}
                        onChange={(e) => handleMonthsChange(parseInt(e.target.value))}
                        disabled={updating}
                      >
                        {monthOptions.map(month => (
                          <option key={month} value={month}>{month} {month === 1 ? 'Month' : 'Months'}</option>
                        ))}
                      </select>
                      <small className="ClientManagement-text-muted">Select number of months for subscription</small>
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FiCalendar /> End Date (Auto-calculated)
                      </label>
                      <input
                        type="date"
                        className="ClientManagement-form-input"
                        value={endDate}
                        disabled
                        style={{ backgroundColor: '#f3f4f6' }}
                      />
                      <small className="ClientManagement-text-muted">End date will be calculated based on start date and months selected</small>
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        <FaRupeeSign /> Price
                      </label>
                      <div className="ClientManagement-currency-input">
                        <span className="ClientManagement-currency-prefix">₹</span>
                        <input
                          type="number"
                          className="ClientManagement-form-input"
                          placeholder="Enter subscription price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          disabled={updating}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <small className="ClientManagement-text-muted">Enter the subscription amount</small>
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        🎁 Extra Free Tasks
                      </label>
                      <input
                        type="number"
                        className="ClientManagement-form-input"
                        placeholder="Enter extra free tasks (e.g. 5)"
                        value={extraTasks}
                        onChange={(e) => setExtraTasks(e.target.value)}
                        disabled={updating}
                        min="0"
                      />
                      <small className="ClientManagement-text-muted">Optional extra tasks allowed in this billing cycle</small>
                    </div>

                    <div className="ClientManagement-form-group">
                      <label className="ClientManagement-form-label">
                        📝 Renewal Benefits / Notes
                      </label>
                      <input
                        type="text"
                        className="ClientManagement-form-input"
                        placeholder="Enter subscription benefits (e.g. Free SEO Setup)"
                        value={benefits}
                        onChange={(e) => setBenefits(e.target.value)}
                        disabled={updating}
                      />
                      <small className="ClientManagement-text-muted">Optional special terms or benefits notes</small>
                    </div>

                    <div className="ClientManagement-renewal-actions">
                      <button 
                        className="ClientManagement-btn ClientManagement-btn--outlined"
                        onClick={() => {
                          setShowRenewForm(false);
                          setStartDate('');
                          setEndDate('');
                          setPrice('');
                          setMonths(1);
                          setExtraTasks(0);
                          setBenefits('');
                          setRenewMessage({ type: '', text: '' });
                        }}
                        disabled={updating}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        className="ClientManagement-btn ClientManagement-btn--primary"
                        onClick={(e) => handleUpdateSubscription(e)}
                        disabled={updating || !startDate || !endDate}
                      >
                        {updating ? ( 
                          <>
                            <div className="ClientManagement-spinner-small"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FiCheckCircle /> Save New Subscription
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <h4 className="ClientManagement-receipts-title">📋 Subscription Task History ({subscriptions.length})</h4>
          {subscriptions.length > 0 ? (
            <div className="ClientManagement-payment-receipts-list">
              {subscriptions.map((subscription, index) => {
                const tasks = getTasksForSubscription(subscription);
                const completedTasks = tasks.filter(task => task.completed).length;
                const pendingTasks = tasks.filter(task => !task.completed && !isClientTaskOverdue(task)).length;
                const overdueTasks = tasks.filter(task => isClientTaskOverdue(task)).length;

                return (
                  <div key={subscription._id || index} className="ClientManagement-payment-receipt-card">
                    <div className="ClientManagement-payment-receipt-header">
                      <div className="ClientManagement-payment-receipt-title">
                        <span className="ClientManagement-payment-receipt-number">
                          Subscription {subscription.subscriptionNo || index + 1}
                        </span>
                        <span className={`ClientManagement-badge ${
                          String(subscription.status || '').toLowerCase() === 'expired'
                            ? 'ClientManagement-badge--error'
                            : 'ClientManagement-badge--success'
                        }`}>
                          {subscription.status || (new Date(subscription.endDate) < new Date() ? 'Expired' : 'Active')}
                        </span>
                      </div>
                      <div className="ClientManagement-payment-receipt-date">
                        <FiCalendar size={14} />
                        {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'} - {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>

                    <div className="ClientManagement-payment-receipt-details">
                      <div className="ClientManagement-payment-detail-row">
                        <div className="ClientManagement-payment-detail-label">Plan:</div>
                        <div className="ClientManagement-payment-detail-value">
                          {subscription.planName || 'Manual Subscription'}
                        </div>
                      </div>
                      <div className="ClientManagement-payment-detail-row">
                        <div className="ClientManagement-payment-detail-label">Price:</div>
                        <div className="ClientManagement-payment-detail-value ClientManagement-amount-highlight">
                          ₹{Number(subscription.price || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="ClientManagement-selected-items-preview ClientManagement-mt-2">
                        <span className="ClientManagement-selected-item ClientManagement-selected-item--info">{tasks.length} Tasks</span>
                        <span className="ClientManagement-selected-item">{completedTasks} Completed</span>
                        <span className="ClientManagement-selected-item ClientManagement-selected-item--info">{pendingTasks} Pending</span>
                        {overdueTasks > 0 && (
                          <span className="ClientManagement-badge ClientManagement-badge--error">{overdueTasks} Overdue</span>
                        )}
                      </div>

                      {(subscription.servicesSnapshot || []).length > 0 && (
                        <div className="ClientManagement-service-list ClientManagement-mt-2">
                          {subscription.servicesSnapshot.map((serviceItem, serviceIndex) => (
                            <div key={`${subscription._id || index}-${serviceItem.service || serviceIndex}`} className="ClientManagement-service-item">
                              <div className="ClientManagement-service-item__content">
                                <p className="ClientManagement-font-bold">{serviceItem.service || `Service ${serviceIndex + 1}`}</p>
                                <small className="ClientManagement-text-muted">{serviceItem.tasks?.length || 0} default tasks in plan</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {subscriptionTasksLoading ? (
                        <p className="ClientManagement-text-muted ClientManagement-mt-2">Loading tasks...</p>
                      ) : tasks.length > 0 ? (
                        <div className="ClientManagement-task-list ClientManagement-mt-2">
                          {tasks.map(task => (
                            <div key={task._id || `${task.service}-${task.name}`} className="ClientManagement-task-item">
                              <div className="ClientManagement-task-item__content">
                                <div className="ClientManagement-flex-align-center ClientManagement-gap-1 ClientManagement-flex-wrap">
                                  <span className={task.completed ? 'ClientManagement-text-line-through ClientManagement-text-muted' : ''}>
                                    {task.name || task.title || 'Task'}
                                  </span>
                                  {task.isPlanTask === false && (
                                    <span className="ClientManagement-badge ClientManagement-badge--warning">Extra</span>
                                  )}
                                  <span className={`ClientManagement-badge ${getTaskStatusBadge(task)}`}>
                                    {getTaskStatusLabel(task)}
                                  </span>
                                </div>
                                <small className="ClientManagement-text-muted">
                                  {task.service || 'Service'}
                                  {task.assignee ? ` / ${task.assignee}` : ''}
                                  {task.dueDate ? ` / Due: ${formatClientTaskDue(task.dueDate)}` : ''}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="ClientManagement-text-muted ClientManagement-mt-2">No tasks generated for this subscription yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="ClientManagement-text-muted">No subscriptions found yet.</p>
          )}

          <h4 className="ClientManagement-receipts-title">💰 Payment History ({paymentReceipts.length})</h4>
          
          {paymentReceipts.length > 0 ? (
            <div className="ClientManagement-payment-receipts-list">
              {paymentReceipts.map((receipt, index) => (
                <div key={index} className="ClientManagement-payment-receipt-card">
                  <div className="ClientManagement-payment-receipt-header">
                    <div className="ClientManagement-payment-receipt-title">
                      <span className="ClientManagement-payment-receipt-number">#{index + 1}</span>
                      <span className={`ClientManagement-badge ${
                        receipt.status === 'Approved' ? 'ClientManagement-badge--success' :
                        receipt.status === 'Rejected' ? 'ClientManagement-badge--error' : 'ClientManagement-badge--warning'
                      }`}>
                        {receipt.status === 'Approved' ? '✓ Approved' : 
                         receipt.status === 'Rejected' ? '✗ Rejected' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="ClientManagement-payment-receipt-date">
                      <FiCalendar size={14} />
                      {new Date(receipt.uploadedAt || receipt.uploadDate || receipt.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="ClientManagement-payment-receipt-details">
                    <div className="ClientManagement-payment-detail-row">
                      <div className="ClientManagement-payment-detail-label">
                        <FaRupeeSign size={14} /> Amount:
                      </div>
                      <div className="ClientManagement-payment-detail-value ClientManagement-amount-highlight">
                        ₹{typeof receipt.amount === 'number' ? receipt.amount.toLocaleString('en-IN') : receipt.amount}
                      </div>
                    </div>
                    
                    <div className="ClientManagement-payment-detail-row">
                      <div className="ClientManagement-payment-detail-label">🔑 Transaction ID:</div>
                      <div className="ClientManagement-payment-detail-value ClientManagement-transaction-id">
                        <code>{receipt.transactionId}</code>
                        <button 
                          className="ClientManagement-copy-transaction-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(receipt.transactionId);
                            alert('Transaction ID copied!');
                          }}
                          title="Copy Transaction ID"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    
                    {receipt.receiptImage && (
                      <div className="ClientManagement-payment-receipt-image-container">
                        <div className="ClientManagement-payment-detail-label">🖼️ Receipt:</div>
                        <div className="ClientManagement-receipt-image-wrapper">
                          <img 
                            src={`${API_URL}/clientsservice/receipt-image/${receipt.receiptImage.split('/').pop()}`}
                            alt={`Receipt ${receipt.transactionId}`}
                            className="ClientManagement-receipt-image"
                            onClick={() => window.open(`${API_URL}/clientsservice/receipt-image/${receipt.receiptImage.split('/').pop()}`, '_blank')}
                            style={{ cursor: 'pointer', maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x200?text=Receipt+Not+Found';
                            }}
                          />
                          <button 
                            className="ClientManagement-view-receipt-btn"
                            onClick={() => window.open(`${API_URL}/clientsservice/receipt-image/${receipt.receiptImage.split('/').pop()}`, '_blank')}
                          >
                            <FiEye /> View Full Receipt
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {receipt.receiptFilename && (
                      <div className="ClientManagement-payment-detail-row">
                        <div className="ClientManagement-payment-detail-label">📄 File:</div>
                        <div className="ClientManagement-payment-detail-value">
                          {receipt.receiptOriginalName || receipt.receiptFilename}
                        </div>
                      </div>
                    )}
                    
                    {receipt.status !== 'Pending' && (
                      <div className={`ClientManagement-payment-verification-info ${receipt.status === 'Approved' ? 'approved' : 'rejected'}`}>
                        <div className="ClientManagement-payment-detail-label">
                          {receipt.status === 'Approved' ? '✓ Verified:' : '✗ Rejected:'}
                        </div>
                        <div className="ClientManagement-payment-verification-details">
                          {receipt.verifiedAt && (
                            <>on {new Date(receipt.verifiedAt).toLocaleString()}</>
                          )}
                          {receipt.notes && <div className="ClientManagement-verification-notes">📝 {receipt.notes}</div>}
                        </div>
                      </div>
                    )}

                    {receipt.status === 'Pending' && canRenewSubscription && (
                      <div className="ClientManagement-renewal-actions" style={{ marginTop: '1rem' }}>
                        <button
                          type="button"
                          className="ClientManagement-btn ClientManagement-btn--primary"
                          onClick={() => handleReceiptStatus(receipt, 'Approved')}
                          disabled={updating}
                        >
                          <FiCheckCircle /> Payment Status Done
                        </button>
                        <button
                          type="button"
                          className="ClientManagement-btn ClientManagement-btn--outlined"
                          onClick={() => handleReceiptStatus(receipt, 'Rejected')}
                          disabled={updating}
                        >
                          <FiXCircle /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ClientManagement-empty-state ClientManagement-text-center ClientManagement-py-4">
              <FiAlertCircle size={48} className="ClientManagement-text-muted ClientManagement-mb-2" />
              <p className="ClientManagement-text-muted">No payment receipts found</p>
              <small>Payment receipts will appear here after subscription payments are recorded</small>
            </div>
          )}
        </div>
        <div className="ClientManagement-modal__footer">
          <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};




const TaskDetailsModal = ({ task, open, onClose, projectManagers = [] }) => {
  if (!open) return null;

  const getAssigneeDetails = (assigneeName) => {
    return projectManagers.find(pm => pm.name === assigneeName);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'ClientManagement-badge--error';
      case 'Medium': return 'ClientManagement-badge--warning';
      case 'Low': return 'ClientManagement-badge--info';
      default: return '';
    }
  };

  const isOverdue = (dueDate) => {
    return isClientTaskOverdue(dueDate);
  };

  const assigneeDetails = getAssigneeDetails(task.assignee);

  return createPortal(
    <div className="ClientManagement-modal-overlay ClientManagement-task-details-overlay" onClick={onClose}>
      <div className="ClientManagement-modal ClientManagement-task-details-modal" role="dialog" aria-modal="true" aria-label="Task details" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>Task Details</h3>
          <button className="ClientManagement-action-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="ClientManagement-modal__content">
          <div className="ClientManagement-form-group">
            <label className="ClientManagement-form-label">Task Name</label>
            <div className="ClientManagement-flex-align-center ClientManagement-gap-1 ClientManagement-flex-wrap">
              <p className="ClientManagement-text-large">{task.name}</p>
              {task.isPlanTask === false && (
                <span className="ClientManagement-badge ClientManagement-badge--warning">Extra</span>
              )}
            </div>
          </div>

          <div className="ClientManagement-grid-2">
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Status</label>
              <div className={`ClientManagement-badge ${task.completed ? 'ClientManagement-badge--success' : ''}`}>
                {task.completed ? 'Completed' : 'Pending'}
              </div>
            </div>
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Priority</label>
              <div className={`ClientManagement-badge ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </div>
            </div>
          </div>

          {task.dueDate && (
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Due Date</label>
              <div className="ClientManagement-flex-align-center ClientManagement-gap-1">
                <p>{formatClientTaskDue(task.dueDate)}</p>
                {isOverdue(task.dueDate) && !task.completed && (
                  <div className="ClientManagement-badge ClientManagement-badge--error">Overdue</div>
                )}
              </div>
            </div>
          )}

          {task.assignee && (
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Assigned To</label>
              <div className="ClientManagement-flex-align-center ClientManagement-gap-1 ClientManagement-mt-1">
                {assigneeDetails ? (
                  <>
                    <div className="ClientManagement-avatar ClientManagement-avatar--primary">
                      {assigneeDetails.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="ClientManagement-text-bold">{assigneeDetails.name}</p>
                      {assigneeDetails.email && (
                        <small className="ClientManagement-text-muted">{assigneeDetails.email}</small>
                      )}
                    </div>
                  </>
                ) : (
                  <p>{task.assignee}</p>
                )}
              </div>
            </div>
          )}

          <div className="ClientManagement-form-group">
            <label className="ClientManagement-form-label">Created</label>
            <p>
              {new Date(task.createdAt).toLocaleDateString()} at{' '}
              {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {task.completed && task.completedAt && (
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Completed</label>
              <p>
                {new Date(task.completedAt).toLocaleDateString()} at{' '}
                {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
        <div className="ClientManagement-modal__footer">
          <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};




export const ServiceProgressCard = ({ service, clientId, clientProjectManagers = [], onTaskUpdate, api, startDate = null, endDate = null, subscriptionId = null, subscriptionNo = null, initialTasks = null }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    dueDate: '',
    assignee: '',
    priority: 'Medium'
  });
  const [showAddTask, setShowAddTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState({ open: false, task: null });
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [taskEditorMessage, setTaskEditorMessage] = useState({ type: '', text: '' });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const encodedService = encodeURIComponent(service);
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (subscriptionId) params.subscriptionId = subscriptionId;
      if (subscriptionNo) params.subscriptionNo = subscriptionNo;
      const response = await api.get(`/client/${clientId}/service/${encodedService}`, { params });
      const tasksData = response.data?.data || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      const savedTasks = localStorage.getItem(`client_${clientId}_service_${service}_tasks`);
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          setTasks(parsedTasks.map(task => ({
            ...task,
            dueDate: task.dueDate || null,
            assignee: task.assignee || '',
            priority: task.priority || 'Medium'
          })));
        } catch (e) {
          console.error('Error parsing localStorage tasks:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(initialTasks)) {
      setTasks(initialTasks);
      setLoading(false);
      return;
    }
    fetchTasks();
  }, [clientId, service, startDate, endDate, subscriptionId, subscriptionNo, initialTasks]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const remainingTasks = Math.max(totalTasks - completedTasks, 0);
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const getTaskStatus = (task) => {
    if (task.completed) return 'Completed';
    if (isClientTaskOverdue(task)) return 'Overdue';
    const status = String(task.status || 'pending').trim().toLowerCase();
    if (status === 'overdue') return 'Pending';
    return task.status || 'Pending';
  };
  const getTaskAssigneeName = (task) => {
    if (!task) return '';
    if (task.assignee) return task.assignee;
    const assigneeId = task.assigneeId?._id || task.assigneeId;
    if (!assigneeId) return '';
    const matchedManager = Array.isArray(clientProjectManagers)
      ? clientProjectManagers.find(pm => String(pm._id || pm.id) === String(assigneeId))
      : null;
    return matchedManager?.name || '';
  };
  const getTaskDescription = (task) => task.description || task.taskDescription || task.details || '-';
  const formatTaskDueDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddTask = async () => {
    if (newTask.name.trim()) {
      setSavingTask(true);
      setTaskEditorMessage({ type: '', text: '' });
      try {
        const encodedService = encodeURIComponent(service);
        const managerObj = Array.isArray(clientProjectManagers) ? clientProjectManagers.find(pm => pm.name === newTask.assignee) : null;
        const assigneeId = managerObj ? (managerObj._id || managerObj.id) : null;

        const payload = {
          name: newTask.name.trim(),
          description: newTask.description.trim(),
          dueDate: convertToISODateString(newTask.dueDate),
          dueDateTime: convertToISODateString(newTask.dueDate),
          assignee: newTask.assignee,
          assigneeId: assigneeId,
          priority: newTask.priority,
          subscriptionId,
          subscriptionNo
        };

        const response = await api.post(`/client/${clientId}/service/${encodedService}`, payload);

        if (response.data.success) {
          const createdTask = { ...payload, ...(response.data.data || {}) };
          setTasks([...tasks, createdTask]);
          setNewTask({ name: '', description: '', dueDate: '', assignee: '', priority: 'Medium' });
          setShowAddTask(false);
          setTaskEditorMessage({
            type: 'success',
            text: createdTask.assignee ? `Task assigned to ${createdTask.assignee}.` : 'Task added successfully.'
          });
          if (onTaskUpdate) {
            onTaskUpdate(service, [...tasks, createdTask]);
          }
        } else {
          setTaskEditorMessage({
            type: 'error',
            text: response.data?.message || 'Task add failed. Please try again.'
          });
        }
      } catch (error) {
        console.error('Error adding task:', error);
        const newTaskObj = {
          id: Date.now(),
          name: newTask.name.trim(),
          description: newTask.description.trim(),
          dueDate: convertToISODateString(newTask.dueDate),
          assignee: newTask.assignee,
          priority: newTask.priority,
          isPlanTask: false,
          completed: false,
          createdAt: new Date().toISOString(),
          completedAt: null
        };
        const updatedTasks = [...tasks, newTaskObj];
        setTasks(updatedTasks);
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
        setNewTask({ name: '', description: '', dueDate: '', assignee: '', priority: 'Medium' });
        setShowAddTask(false);
        setTaskEditorMessage({
          type: 'success',
          text: newTaskObj.assignee ? `Task assigned to ${newTaskObj.assignee}.` : 'Task added successfully.'
        });
        if (onTaskUpdate) {
          onTaskUpdate(service, updatedTasks);
        }
      } finally {
        setSavingTask(false);
      }
    }
  };

  const handleEditTask = async () => {
    if (editTask && editTask.name.trim()) {
      setSavingTask(true);
      setTaskEditorMessage({ type: '', text: '' });
      try {
        const managerObj = Array.isArray(clientProjectManagers) ? clientProjectManagers.find(pm => pm.name === editTask.assignee) : null;
        const assigneeId = managerObj ? (managerObj._id || managerObj.id) : null;
        const payload = {
          name: editTask.name.trim(),
          description: (editTask.description || '').trim(),
          dueDate: convertToISODateString(editTask.dueDate),
          dueDateTime: convertToISODateString(editTask.dueDate),
          assignee: editTask.assignee,
          assigneeId: assigneeId,
          priority: editTask.priority
        };

        if (editTask._id) {
          const response = await api.put(`/${editTask._id}`, payload);

          if (response.data.success) {
            const updatedTask = {
              ...editTask,
              ...(response.data.data || {}),
              ...payload,
              _id: editTask._id
            };
            const updatedTasks = tasks.map(task =>
              task._id === editTask._id ? updatedTask : task
            );
            setTasks(updatedTasks);
            setEditTask(null);
            setTaskEditorMessage({
              type: 'success',
              text: updatedTask.assignee ? `Task assigned to ${updatedTask.assignee}.` : 'Task updated successfully.'
            });
            if (onTaskUpdate) {
              onTaskUpdate(service, updatedTasks);
            }
          } else {
            setTaskEditorMessage({
              type: 'error',
              text: response.data?.message || 'Task assign/update failed. Please try again.'
            });
          }
        } else {
          const updatedTasks = tasks.map(task => 
            isSameTask(task, editTask) ? {
              ...editTask,
              ...payload
            } : task
          );
          setTasks(updatedTasks);
          localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
          setEditTask(null);
          setTaskEditorMessage({
            type: 'success',
            text: payload.assignee ? `Task assigned to ${payload.assignee}.` : 'Task updated successfully.'
          });
          if (onTaskUpdate) {
            onTaskUpdate(service, updatedTasks);
          }
        }
      } catch (error) {
        console.error('Error updating task:', error);
        setTaskEditorMessage({
          type: 'error',
          text: error.response?.data?.message || 'Task assign/update failed. Please try again.'
        });
      } finally {
        setSavingTask(false);
      }
    }
  };

  const isSameTask = (candidate, target) => {
    if (!candidate || !target) return false;
    const candidateMongoId = candidate._id ? String(candidate._id) : '';
    const targetMongoId = target._id ? String(target._id) : '';
    if (candidateMongoId && targetMongoId) return candidateMongoId === targetMongoId;

    const candidateLocalId = candidate.id ? String(candidate.id) : '';
    const targetLocalId = target.id ? String(target.id) : '';
    if (candidateLocalId && targetLocalId) return candidateLocalId === targetLocalId;

    return candidate === target;
  };

  const toggleTaskCompletion = async (task) => {
    try {
      const updatedTasks = tasks.map(t => {
        if (isSameTask(t, task)) {
          return {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : null
          };
        }
        return t;
      });
      setTasks(updatedTasks);

      if (task._id) {
        await api.patch(`/${task._id}/toggle`, { clientId });
      } else {
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
      }

      if (onTaskUpdate) {
        onTaskUpdate(service, updatedTasks);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      fetchTasks();
    }
  };

  const deleteTask = async (task) => {
    const taskName = task?.name || task?.title || 'this task';
    if (!window.confirm(`Are you sure you want to delete "${taskName}"?`)) return;

    try {
      const updatedTasks = tasks.filter(t => !isSameTask(t, task));
      setTasks(updatedTasks);

      if (task._id) {
        await api.delete(`/${task._id}`);
      } else {
        localStorage.setItem(`client_${clientId}_service_${service}_tasks`, JSON.stringify(updatedTasks));
      }
      
      if (onTaskUpdate) {
        onTaskUpdate(service, updatedTasks);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      fetchTasks();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !editTask) {
      handleAddTask();
    } else if (e.key === 'Enter' && editTask) {
      handleEditTask();
    }
  };

  const openEditTask = (task) => {
    setShowAddTask(false);
    setTaskEditorMessage({ type: '', text: '' });
    setEditTask({
      ...task,
      name: task.name || task.title || '',
      description: getTaskDescription(task) === '-' ? '' : getTaskDescription(task),
      dueDate: task.dueDate || task.dueDateTime || '',
      assignee: getTaskAssigneeName(task),
      priority: task.priority || 'Medium',
      status: task.status || (task.completed ? 'completed' : 'pending'),
      completed: Boolean(task.completed)
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'ClientManagement-badge--error';
      case 'Medium': return 'ClientManagement-badge--warning';
      case 'Low': return 'ClientManagement-badge--info';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="ClientManagement-card">
        <div className="ClientManagement-card__content">
          <div className="ClientManagement-flex-align-center ClientManagement-justify-center ClientManagement-py-3">
            <div className="ClientManagement-spinner"></div>
            <p className="ClientManagement-ml-2">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ClientManagement-service-workspace">
      <div className="ClientManagement-service-progress-panel">
        <div className="ClientManagement-service-progress-ring" style={{ '--progress': `${Math.round(progressPercentage)}%` }}>
          <div>{Math.round(progressPercentage)}%</div>
        </div>
        <div className="ClientManagement-service-progress-count">
          <span>Task Progress</span>
          <strong>{completedTasks} / {totalTasks}</strong>
          <p>Tasks Completed</p>
        </div>
        <div className="ClientManagement-service-progress-divider"></div>
        <div className="ClientManagement-service-progress-main">
          <div className="ClientManagement-service-progress-track">
            <span style={{ width: `${progressPercentage}%` }}></span>
          </div>
          <div className="ClientManagement-service-progress-stats">
            <span><FiCheckCircle /> {completedTasks} Completed</span>
            <span><FiClock /> {remainingTasks} Remaining</span>
            <span><FiFlag /> {totalTasks} Total Tasks</span>
          </div>
        </div>
        <div className="ClientManagement-service-progress-actions">
          <button
            className="ClientManagement-service-action"
            onClick={() => {
              setTaskEditorMessage({ type: '', text: '' });
              setShowAddTask(!showAddTask);
            }}
            title="Add Task"
          >
            <FiPlus />
            <span>Add Task</span>
          </button>
          <button
            className="ClientManagement-service-action"
            onClick={() => fetchTasks()}
            title="Refresh Tasks"
          >
            <FiRefreshCw />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="ClientManagement-card ClientManagement-mb-2 ClientManagement-service-inner-card">
        <div className="ClientManagement-card__content">
        {taskEditorMessage.text && (
          <div className={`ClientManagement-alert ClientManagement-alert--${taskEditorMessage.type} ClientManagement-mb-2`}>
            {taskEditorMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span>{taskEditorMessage.text}</span>
          </div>
        )}
        {(showAddTask || editTask) && (
          <div className="ClientManagement-task-editor-card">
            <div className="ClientManagement-task-editor-heading">
              <div className="ClientManagement-task-editor-heading-icon">
                <FiEdit />
              </div>
              <div>
                <h5>{editTask ? 'Edit Task' : 'Add Task'}</h5>
                <p>{editTask ? 'Update task details and assign it to the right team member' : 'Create a task and assign it to the right team member'}</p>
              </div>
            </div>

            <div className="ClientManagement-task-editor-form">
              <label className="ClientManagement-task-editor-field ClientManagement-task-editor-field--full">
                <span>Task Title <b>*</b></span>
                <div className="ClientManagement-task-editor-control">
                  <i><FiBriefcase /></i>
                  <input
                    type="text"
                    placeholder="Enter task name..."
                    value={editTask ? editTask.name : newTask.name}
                    onChange={(e) => {
                      if (editTask) {
                        setEditTask({ ...editTask, name: e.target.value });
                      } else {
                        setNewTask({ ...newTask, name: e.target.value });
                      }
                    }}
                    onKeyPress={handleKeyPress}
                    autoFocus
                  />
                </div>
              </label>

              <label className="ClientManagement-task-editor-field ClientManagement-task-editor-field--full">
                <span>Task Description <b>*</b></span>
                <div className="ClientManagement-task-editor-control ClientManagement-task-editor-control--textarea">
                  <i><FiInfo /></i>
                  <textarea
                    rows="2"
                    placeholder="Enter task description..."
                    value={editTask ? (editTask.description || '') : newTask.description}
                    onChange={(e) => {
                      if (editTask) {
                        setEditTask({ ...editTask, description: e.target.value });
                      } else {
                        setNewTask({ ...newTask, description: e.target.value });
                      }
                    }}
                  />
                </div>
              </label>

              <label className="ClientManagement-task-editor-field">
                <span>Due Date & Time <b>*</b></span>
                <div className="ClientManagement-task-editor-control">
                  <i><FiCalendar /></i>
                  <input
                    type="datetime-local"
                    value={editTask ? formatDateTimeForInput(editTask.dueDate) : newTask.dueDate}
                    onChange={(e) => {
                      if (editTask) {
                        setEditTask({ ...editTask, dueDate: e.target.value });
                      } else {
                        setNewTask({ ...newTask, dueDate: e.target.value });
                      }
                    }}
                  />
                </div>
              </label>

              <label className="ClientManagement-task-editor-field">
                <span>Assign To</span>
                <div className="ClientManagement-task-editor-control">
                  <i><FiUsers /></i>
                  <select
                    value={editTask ? editTask.assignee : newTask.assignee}
                    onChange={(e) => {
                      if (editTask) {
                        setEditTask({ ...editTask, assignee: e.target.value });
                      } else {
                        setNewTask({ ...newTask, assignee: e.target.value });
                      }
                    }}
                  >
                    <option value="">Select Assignee</option>
                    {Array.isArray(clientProjectManagers) && clientProjectManagers.map((pm) => (
                      <option key={pm.id || pm._id || pm.name} value={pm.name}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="ClientManagement-task-editor-field">
                <span>Priority</span>
                <div className="ClientManagement-task-editor-control">
                  <i><FiFlag /></i>
                  <select
                    value={editTask ? editTask.priority : newTask.priority}
                    onChange={(e) => {
                      if (editTask) {
                        setEditTask({ ...editTask, priority: e.target.value });
                      } else {
                        setNewTask({ ...newTask, priority: e.target.value });
                      }
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </label>

              <div className="ClientManagement-task-editor-actions">
                <button
                  className="ClientManagement-task-editor-cancel"
                  onClick={() => {
                    if (editTask) {
                      setEditTask(null);
                      setTaskEditorMessage({ type: '', text: '' });
                    } else {
                      setShowAddTask(false);
                      setTaskEditorMessage({ type: '', text: '' });
                      setNewTask({
                        name: '',
                        description: '',
                        dueDate: '',
                        assignee: '',
                        priority: 'Medium'
                      });
                    }
                  }}
                >
                  <FiX /> Cancel
                </button>
                <button
                  className="ClientManagement-task-editor-save"
                  onClick={editTask ? handleEditTask : handleAddTask}
                  disabled={savingTask || (editTask ? !editTask.name.trim() : !newTask.name.trim())}
                >
                  <FiSave /> {savingTask ? 'Saving...' : editTask ? 'Save & Assign' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="ClientManagement-service-task-table-section">
          {tasks.length > 0 ? (
            <div className="ClientManagement-task-table-wrap">
              <table className="ClientManagement-task-table ClientManagement-task-table--no-date">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Due Date</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id || task.id}>
                      <td>
                        <div className="ClientManagement-task-title-cell">
                          <input
                            type="checkbox"
                            checked={!!task.completed}
                            onChange={() => toggleTaskCompletion(task)}
                          />
                          <span className={task.completed ? 'ClientManagement-text-line-through ClientManagement-text-muted' : ''}>
                            {task.name || task.title || 'Untitled Task'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="ClientManagement-task-description-cell">
                          {getTaskDescription(task)}
                        </span>
                      </td>
                      <td>
                        <span className="ClientManagement-task-due-cell">
                          {formatTaskDueDate(task.dueDate)}
                        </span>
                      </td>
                      <td>
                        {getTaskAssigneeName(task) ? (
                          <span className="ClientManagement-task-assignee-cell">
                            <FiUser />
                            {getTaskAssigneeName(task)}
                          </span>
                        ) : (
                          <span className="ClientManagement-task-unassigned">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className={`ClientManagement-task-pill ClientManagement-task-pill--priority ${getPriorityColor(task.priority)}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>
                      <td>
                        <span className={`ClientManagement-task-pill ${task.completed ? 'ClientManagement-task-pill--success' : 'ClientManagement-task-pill--pending'}`}>
                          {getTaskStatus(task)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ClientManagement-action-button"
                          onClick={() => openEditTask(task)}
                          title="Edit Task"
                        >
                          <FiEdit />
                        </button>
                        <button
                          type="button"
                          className="ClientManagement-action-button ClientManagement-action-button--error"
                          onClick={() => deleteTask(task)}
                          title="Delete Task"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ClientManagement-text-center ClientManagement-py-3 ClientManagement-border-dashed ClientManagement-border ClientManagement-rounded ClientManagement-bg-grey-50">
              <p className="ClientManagement-text-muted">
                No tasks added yet. Click the + icon to add tasks.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>

      {showTaskDetails.open && (
        <TaskDetailsModal
          task={showTaskDetails.task}
          open={showTaskDetails.open}
          onClose={() => setShowTaskDetails({ open: false, task: null })}
          projectManagers={clientProjectManagers}
        />
      )}
    </div>
  );
};




const ServicesModal = ({ open, onClose, services, onAddService, onDeleteService, companyCode }) => {
  const [newService, setNewService] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newService.trim()) {
      onAddService(newService.trim());
      setNewService('');
    }
  };

  const filteredServices = companyCode 
    ? services.filter(service => service.companyCode === companyCode)
    : services;

  if (!open) return null;

  return (
    <div className="ClientManagement-modal-overlay" onClick={onClose}>
      <div className="ClientManagement-modal" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>Manage Services</h3>
          <button className="ClientManagement-action-button" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="ClientManagement-modal__content">
          {!companyCode && (
            <div className="ClientManagement-alert ClientManagement-alert--warning ClientManagement-mb-3">
              <FiAlertCircle /> Company code not found. Services may not save properly.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="ClientManagement-mb-3">
            <div className="ClientManagement-grid-2 ClientManagement-gap-2">
              <div>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  placeholder="New Service Name"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  required
                />
                {companyCode && (
                  <small className="ClientManagement-text-muted ClientManagement-mt-1 ClientManagement-block">
                    This service will be added for company: {companyCode}
                  </small>
                )}
              </div>
              <div>
                <button 
                  type="submit" 
                  className="ClientManagement-btn ClientManagement-btn--primary ClientManagement-w-100"
                  disabled={!companyCode}
                >
                  <FiPlus /> {companyCode ? 'Add Service' : 'Company Code Required'}
                </button>
              </div>
            </div>
          </form>

          <hr className="ClientManagement-my-2" />

          <h4 className="ClientManagement-mb-2">All Services ({filteredServices.length})</h4>
          
          {filteredServices.length > 0 ? (
            <div className="ClientManagement-service-list">
              {filteredServices.map((service) => (
                <div key={service._id} className="ClientManagement-service-item">
                  <div className="ClientManagement-service-item__icon">
                    <FiBriefcase />
                  </div>
                  <div className="ClientManagement-service-item__content">
                    <p className="ClientManagement-font-bold">{service.servicename}</p>
                    <small className="ClientManagement-text-muted">
                      Created: {new Date(service.createdAt).toLocaleDateString()}
                      {service.companyCode && (
                        <> • Company: {service.companyCode}</>
                      )}
                    </small>
                  </div>
                  <div className="ClientManagement-service-item__actions">
                    <button
                      className="ClientManagement-action-button ClientManagement-action-button--error"
                      onClick={() => onDeleteService(service._id, service.servicename)}
                      title="Delete Service"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ClientManagement-text-center ClientManagement-py-3">
              <FiBriefcase className="ClientManagement-text-4xl ClientManagement-text-muted ClientManagement-mb-2" />
              <h5 className="ClientManagement-text-muted">No Services Found</h5>
              <p className="ClientManagement-text-muted">
                {companyCode 
                  ? 'Add your first service using the form above'
                  : 'Company code not found. Please refresh the page.'
                }
              </p>
            </div>
          )}
        </div>
        <div className="ClientManagement-modal__footer">
          <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const ClientPlansModal = ({ open, onClose, plans, services, companyCode, onSavePlan }) => {
  const [form, setForm] = useState({
    name: '',
    price: '',
    months: 1,
    description: '',
    services: []
  });
  const [taskDrafts, setTaskDrafts] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ name: '', price: '', months: 1, description: '', services: [] });
      setTaskDrafts({});
    }
  }, [open]);

  if (!open) return null;

  const availableServices = companyCode
    ? services.filter(service => service.companyCode === companyCode)
    : services;

  const toggleServiceInPlan = serviceName => {
    if (!serviceName) return;
    setForm(prev => ({
      ...prev,
      services: prev.services.some(item => item.service === serviceName)
        ? prev.services.filter(item => item.service !== serviceName)
        : [...prev.services, { service: serviceName, tasks: [] }]
    }));
  };

  const updateTaskDraft = (serviceName, key, value) => {
    setTaskDrafts(prev => ({
      ...prev,
      [serviceName]: {
        name: '',
        description: '',
        priority: 'Medium',
        dueInDays: 0,
        ...(prev[serviceName] || {}),
        [key]: value
      }
    }));
  };

  const addTaskToService = serviceName => {
    const draft = taskDrafts[serviceName] || {};
    const name = draft.name || '';
    if (!name?.trim()) return;
    setForm(prev => ({
      ...prev,
      services: prev.services.map(item => item.service === serviceName
        ? {
          ...item,
          tasks: [...item.tasks, {
            name: name.trim(),
            description: (draft.description || name).trim(),
            priority: draft.priority || 'Medium',
            dueInDays: Number(draft.dueInDays || 0)
          }]
        }
        : item)
    }));
    setTaskDrafts(prev => ({
      ...prev,
      [serviceName]: { name: '', description: '', priority: 'Medium', dueInDays: 0 }
    }));
  };

  const removeTask = (serviceName, taskIndex) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.map(item => item.service === serviceName
        ? { ...item, tasks: item.tasks.filter((_, idx) => idx !== taskIndex) }
        : item)
    }));
  };

  const submitPlan = e => {
    e.preventDefault();
    onSavePlan({
      ...form,
      companyCode,
      price: Number(form.price || 0),
      months: Number(form.months || 1)
    });
  };

  return (
    <div className="ClientManagement-modal-overlay" onClick={onClose}>
      <div className="ClientManagement-modal ClientManagement-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>Client Plans</h3>
          <small className="ClientManagement-text-muted">Add services and default tasks to this plan.</small>
          <button className="ClientManagement-action-button" onClick={onClose}><FiX /></button>
        </div>
        <div className="ClientManagement-modal__content">
          <form onSubmit={submitPlan}>
            <div className="ClientManagement-grid-2 ClientManagement-gap-2">
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Plan Name *</label>
                <input className="ClientManagement-form-input" value={form.name} onChange={e => setForm(prev => ({...prev, name: e.target.value}))} required />
              </div>
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Price</label>
                <input className="ClientManagement-form-input" type="number" min="0" value={form.price} onChange={e => setForm(prev => ({...prev, price: e.target.value}))} />
              </div>
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Months</label>
                <input className="ClientManagement-form-input" type="number" min="1" value={form.months} onChange={e => setForm(prev => ({...prev, months: e.target.value}))} />
              </div>
            </div>
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Description</label>
              <textarea className="ClientManagement-form-input" value={form.description} onChange={e => setForm(prev => ({...prev, description: e.target.value}))} />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Select Services</label>
              {availableServices.length === 0 ? (
                <div className="ClientManagement-alert ClientManagement-alert--info">
                  <FiInfo /> No services available. Please add services first.
                </div>
              ) : (
                <div className="ClientManagement-services-list">
                  {availableServices.map(service => {
                    const checked = form.services.some(item => item.service === service.servicename);
                    return (
                      <div key={service._id} className="ClientManagement-service-checkbox-item">
                        <input
                          type="checkbox"
                          id={`plan-service-${service._id}`}
                          checked={checked}
                          onChange={() => toggleServiceInPlan(service.servicename)}
                        />
                        <label htmlFor={`plan-service-${service._id}`}>{service.servicename}</label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="ClientManagement-service-list">
              {form.services.map((service) => {
                const draft = taskDrafts[service.service] || { name: '', description: '', priority: 'Medium', dueInDays: 0 };
                return (
                <div className="ClientManagement-service-item" key={service.service}>
                  <div className="ClientManagement-service-item__content">
                    <p className="ClientManagement-font-bold">{service.service}</p>
                    <small className="ClientManagement-text-muted">{service.tasks.length} tasks</small>
                    <div className="ClientManagement-grid-2 ClientManagement-gap-2 ClientManagement-mt-2">
                      <input
                        className="ClientManagement-form-input"
                        placeholder="Default task name"
                        value={draft.name}
                        onChange={e => updateTaskDraft(service.service, 'name', e.target.value)}
                      />
                      <input
                        className="ClientManagement-form-input"
                        type="number"
                        min="0"
                        placeholder="Due in days"
                        value={draft.dueInDays}
                        onChange={e => updateTaskDraft(service.service, 'dueInDays', e.target.value)}
                      />
                      <select
                        className="ClientManagement-form-input"
                        value={draft.priority}
                        onChange={e => updateTaskDraft(service.service, 'priority', e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                      <button type="button" className="ClientManagement-btn ClientManagement-btn--outlined" onClick={() => addTaskToService(service.service)}>
                        <FiPlus /> Add Default Task
                      </button>
                    </div>
                    <textarea
                      className="ClientManagement-form-input ClientManagement-mt-2"
                      placeholder="Task description (optional)"
                      value={draft.description}
                      onChange={e => updateTaskDraft(service.service, 'description', e.target.value)}
                    />
                    <div className="ClientManagement-task-list">
                      {service.tasks.map((task, taskIndex) => (
                        <div className="ClientManagement-task-item" key={`${task.name}-${taskIndex}`}>
                          <span>{task.name} · {task.priority || 'Medium'} · due in {task.dueInDays || 0} days</span>
                          <button type="button" className="ClientManagement-action-button ClientManagement-action-button--error" onClick={() => removeTask(service.service, taskIndex)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );})}
            </div>
            <div className="ClientManagement-modal__footer">
              <button type="button" className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose}>Close</button>
              <button type="submit" className="ClientManagement-btn ClientManagement-btn--primary">Save Plan</button>
            </div>
          </form>
          <h4 className="ClientManagement-mt-3">Existing Plans</h4>
          <div className="ClientManagement-service-list">
            {plans.map(plan => {
              const planServices = plan.services || [];
              const totalTasks = planServices.reduce((sum, item) => sum + (item.tasks?.length || 0), 0);

              return (
                <div key={plan._id} className="ClientManagement-service-item">
                  <div className="ClientManagement-service-item__content">
                    <p className="ClientManagement-font-bold">{plan.name} - ₹{Number(plan.price || 0).toLocaleString('en-IN')}</p>
                    <small className="ClientManagement-text-muted">
                      {plan.months || 1} month / {planServices.length} services / {totalTasks} tasks
                    </small>

                    {planServices.length > 0 && (
                      <div className="ClientManagement-service-list ClientManagement-mt-2">
                        {planServices.map((serviceItem, serviceIndex) => {
                          const serviceTasks = serviceItem.tasks || [];

                          return (
                            <div
                              key={`${plan._id}-${serviceItem.service || serviceIndex}`}
                              className="ClientManagement-service-item"
                            >
                              <div className="ClientManagement-service-item__content">
                                <p className="ClientManagement-font-bold">
                                  {serviceItem.service || `Service ${serviceIndex + 1}`}
                                </p>
                                <small className="ClientManagement-text-muted">
                                  {serviceTasks.length} {serviceTasks.length === 1 ? 'task' : 'tasks'}
                                </small>
                                {serviceTasks.length > 0 && (
                                  <div className="ClientManagement-selected-items-preview ClientManagement-mt-2">
                                    {serviceTasks.map((task, taskIndex) => (
                                      <span
                                        key={`${plan._id}-${serviceItem.service || serviceIndex}-${task.name || taskIndex}`}
                                        className="ClientManagement-selected-item ClientManagement-selected-item--info"
                                      >
                                        {task.name || `Task ${taskIndex + 1}`}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};




const AddClientModal = ({ 
  open, 
  onClose, 
  onAddClient, 
  services, 
  clientPlans = [],
  projectManagers,
  loading = false,
  companyCode,
  initialClient = null
}) => {
  const getEmptyClientForm = () => ({
    client: '',
    parentClientId: '',
    parentClientName: '',
    company: '',
    city: '',
    projectManagers: [],
    services: [],
    status: 'Active',
    progress: '',
    email: '',
    phone: '',
    companyLogo: '',
    industry: '',
    gst: '',
    pan: '',
    website: '',
    state: '',
    country: '',
    pincode: '',
    address: '',
    description: '',
    notes: '',
    clientPlanId: '',
    subscriptionStartDate: ''
  });

  const [newClient, setNewClient] = useState(getEmptyClientForm);

  const [managerSearch, setManagerSearch] = useState('');
  const [teamOpen, setTeamOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [dateError, setDateError] = useState('');

  const filteredServices = companyCode 
    ? services.filter(service => service.companyCode === companyCode)
    : services;

  const selectedClientPlan = clientPlans.find(item => item._id === newClient.clientPlanId);
  const selectedPlanServices = selectedClientPlan
    ? selectedClientPlan.services.map(item => item.service)
    : [];
  const isExtraSelectedService = serviceName => (
    Boolean(selectedClientPlan) && !selectedPlanServices.includes(serviceName)
  );

  const handlePlanSelect = (planId) => {
    const plan = clientPlans.find(item => item._id === planId);
    setNewClient(prev => ({
      ...prev,
      clientPlanId: planId,
      services: plan ? plan.services.map(item => item.service) : prev.services
    }));
  };

  useEffect(() => {
    if (open) {
      setFormError('');
      setFieldErrors({});
      setDateError('');
      const parentManagerNames = Array.isArray(initialClient?.projectManager) ? initialClient.projectManager : [];
      const parentManagerIds = projectManagers
        .filter(manager => parentManagerNames.includes(manager.name))
        .map(manager => manager._id);

      setNewClient({
        ...getEmptyClientForm(),
        client: initialClient?.client || initialClient?.parentClientName || '',
        parentClientId: initialClient?.parentClientId || initialClient?._id || '',
        parentClientName: initialClient?.parentClientName || initialClient?.client || '',
        city: initialClient?.city || '',
        projectManagers: parentManagerIds,
        status: initialClient?.status || 'Active',
        email: initialClient?.email || '',
        phone: initialClient?.phone || '',
        address: initialClient?.address || '',
        description: initialClient?.description || '',
        notes: initialClient?.notes || ''
      });
    }
  }, [open, initialClient, projectManagers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.ClientManagement-dropdown-container')) {
        setTeamOpen(false);
        setServicesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const calculateEndDate = (startDate, months) => {
    if (!startDate || !months) return '';
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString().split('T')[0];
  };

  const validateSubscriptionDates = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        setDateError('End date must be greater than start date');
        return false;
      } else {
        setDateError('');
        return true;
      }
    }
    setDateError('');
    return true;
  };

  const handleStartDateChange = (date) => {
    setNewClient(prev => ({...prev, subscriptionStartDate: date}));
    const selectedPlan = clientPlans.find(item => item._id === newClient.clientPlanId);
    if (date && selectedPlan) {
      const calculatedEndDate = calculateEndDate(date, selectedPlan.months || 1);
      validateSubscriptionDates(date, calculatedEndDate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});
    setDateError('');

    const nextFieldErrors = {};
    const selectedPlan = clientPlans.find(item => item._id === newClient.clientPlanId);
    if (!newClient.client.trim()) nextFieldErrors.client = 'Client name is required';
    if (!newClient.company.trim()) nextFieldErrors.company = 'Company is required';
    if (!newClient.city.trim()) nextFieldErrors.city = 'City is required';
    if (newClient.projectManagers.length === 0) nextFieldErrors.projectManagers = 'Select at least one team member';
    if (!companyCode) nextFieldErrors.companyCode = 'Company code is missing. Please login again.';
    if (filteredServices.length === 0) nextFieldErrors.services = 'Add at least one service before creating a client.';
    if (selectedPlan && !newClient.subscriptionStartDate) nextFieldErrors.subscriptionStartDate = 'Select subscription start date';
    if (newClient.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email.trim())) {
      nextFieldErrors.email = 'Enter a valid email address';
    }

    let subscriptionArray = [];
    if (selectedPlan && newClient.subscriptionStartDate) {
      const calculatedEndDate = calculateEndDate(newClient.subscriptionStartDate, selectedPlan.months || 1);
      const start = new Date(newClient.subscriptionStartDate);
      const end = new Date(calculatedEndDate);
      if (end <= start) {
        nextFieldErrors.subscriptionDates = 'End date must be greater than start date';
      } else {
        subscriptionArray = [{
          startDate: newClient.subscriptionStartDate,
          endDate: calculatedEndDate,
          price: Number(selectedPlan.price || 0),
          status: 'Active',
          months: selectedPlan.months || 1
        }];
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError(Object.values(nextFieldErrors)[0]);
      return;
    }

    try {
      const selectedManagerIds = newClient.projectManagers;
      const selectedManagers = projectManagers.filter(pm => selectedManagerIds.includes(pm._id));
      const formattedProjectManagers = selectedManagers.map(pm => ({
        _id: pm._id,
        name: pm.name,
        email: pm.email,
        role: pm.role
      }));

      const clientData = {
        client: newClient.client,
        parentClientId: newClient.parentClientId,
        parentClientName: newClient.parentClientName || newClient.client,
        company: newClient.company,
        city: newClient.city,
        projectManagers: formattedProjectManagers,
        services: newClient.services,
        status: newClient.status,
        progress: newClient.progress,
        email: newClient.email,
        phone: newClient.phone,
        companyLogo: newClient.companyLogo,
        industry: newClient.industry,
        gst: newClient.gst,
        pan: newClient.pan,
        website: newClient.website,
        state: newClient.state,
        country: newClient.country,
        pincode: newClient.pincode,
        address: newClient.address,
        description: newClient.description,
        notes: newClient.notes,
        companyCode: companyCode,
        clientPlanId: newClient.clientPlanId,
        subscription: subscriptionArray
      };

      await onAddClient(clientData);
      setNewClient(getEmptyClientForm());
    } catch (error) {
      console.error("Error adding client:", error);
      const responseData = error.response?.data || {};
      const message = responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0
        ? responseData.errors.join(', ')
        : (responseData.message || error.message || 'Client add failed');
      setFormError(message);
    }
  };

  const filteredManagers = Array.isArray(projectManagers) 
    ? projectManagers.filter(manager =>
        manager.name?.toLowerCase().includes(managerSearch.toLowerCase()) ||
        manager.email?.toLowerCase().includes(managerSearch.toLowerCase())
      )
    : [];

  if (!open) return null;

  return (
    <div className="ClientManagement-modal-overlay" onClick={onClose}>
      <div className="ClientManagement-modal ClientManagement-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ClientManagement-modal__header">
          <h3>{initialClient ? 'Add New Company' : 'Add New Client / Company'}</h3>
          {companyCode && (
            <small className="ClientManagement-text-muted">Company: {companyCode}</small>
          )}
          <button className="ClientManagement-action-button" onClick={onClose} disabled={loading}>
            <FiX />
          </button>
        </div>
        <div className="ClientManagement-modal__content">
          {formError && (
            <div className="ClientManagement-alert ClientManagement-alert--error ClientManagement-mb-3">
              <FiAlertCircle /> {formError}
            </div>
          )}

          {dateError && (
            <div className="ClientManagement-alert ClientManagement-alert--error ClientManagement-mb-3">
              <FiAlertCircle /> {dateError}
            </div>
          )}

          {!companyCode && (
            <div className="ClientManagement-alert ClientManagement-alert--warning ClientManagement-mb-3">
              <FiAlertCircle /> Company code not found. Client may not save properly.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="ClientManagement-dropdown-container">
            <div className="ClientManagement-grid-2 ClientManagement-gap-2">
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Client Name *</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.client}
                  onChange={(e) => {
                    setFieldErrors(prev => ({ ...prev, client: '' }));
                    setNewClient(prev => ({...prev, client: e.target.value}));
                  }}
                  required
                  disabled={loading}
                />
                {fieldErrors.client && <small className="ClientManagement-text-danger">{fieldErrors.client}</small>}
              </div>
              
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Company *</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.company}
                  onChange={(e) => {
                    setFieldErrors(prev => ({ ...prev, company: '' }));
                    setNewClient(prev => ({...prev, company: e.target.value}));
                  }}
                  required
                  disabled={loading}
                />
                {fieldErrors.company && <small className="ClientManagement-text-danger">{fieldErrors.company}</small>}
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">City *</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.city}
                  onChange={(e) => {
                    setFieldErrors(prev => ({ ...prev, city: '' }));
                    setNewClient(prev => ({...prev, city: e.target.value}));
                  }}
                  required
                  disabled={loading}
                />
                {fieldErrors.city && <small className="ClientManagement-text-danger">{fieldErrors.city}</small>}
              </div>
              
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Status *</label>
                <select
                  className="ClientManagement-form-input"
                  value={newClient.status}
                  onChange={(e) => setNewClient(prev => ({...prev, status: e.target.value}))}
                  disabled={loading}
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Client Plan</label>
                <select
                  className="ClientManagement-form-input"
                  value={newClient.clientPlanId}
                  onChange={(e) => handlePlanSelect(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select plan manually</option>
                  {clientPlans.map(plan => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name} - ₹{Number(plan.price || 0).toLocaleString('en-IN')} / {plan.months || 1} month
                    </option>
                  ))}
                </select>
                <small className="ClientManagement-text-muted">Selecting a plan will auto-fill services, price, and tasks.</small>
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">
                  <FiCalendar className="ClientManagement-icon-inline" /> Subscription Start Date
                </label>
                <input
                  type="date"
                  className="ClientManagement-form-input"
                  value={newClient.subscriptionStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  disabled={loading}
                />
                <small className="ClientManagement-text-muted">Select start date</small>
                {fieldErrors.subscriptionStartDate && (
                  <small className="ClientManagement-text-danger">{fieldErrors.subscriptionStartDate}</small>
                )}
                {fieldErrors.subscriptionDates && (
                  <small className="ClientManagement-text-danger">{fieldErrors.subscriptionDates}</small>
                )}
              </div>

              
              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Team *</label>
                <div className="ClientManagement-dropdown-wrapper">
                  <div
                    className="ClientManagement-dropdown-box"
                    onClick={() => setTeamOpen(!teamOpen)}
                  >
                    <span>
                      {newClient.projectManagers.length === 0
                        ? "Select team members"
                        : `${newClient.projectManagers.length} selected`}
                    </span>
                    <span className={`ClientManagement-dropdown-arrow ${teamOpen ? 'ClientManagement-dropdown-arrow--open' : ''}`}>
                      <FiChevronDown />
                    </span>
                  </div>

                  {teamOpen && (
                    <div className="ClientManagement-dropdown-content">
                      <div className="ClientManagement-dropdown-search">
                        <input
                          type="text"
                          className="ClientManagement-form-input"
                          placeholder="Search users..."
                          value={managerSearch}
                          onChange={(e) => setManagerSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      <div className="ClientManagement-dropdown-list">
                        {filteredManagers.length > 0 ? (
                          filteredManagers.map((manager) => (
                            <label
                              key={manager._id}
                              className="ClientManagement-dropdown-item"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={newClient.projectManagers.includes(manager._id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setNewClient(prev => ({
                                    ...prev,
                                    projectManagers: checked
                                      ? [...prev.projectManagers, manager._id]
                                      : prev.projectManagers.filter(id => id !== manager._id)
                                  }));
                                  setFieldErrors(prev => ({ ...prev, projectManagers: '' }));
                                }}
                                disabled={loading}
                              />
                              <div className="ClientManagement-dropdown-item-content">
                                <div className="ClientManagement-avatar ClientManagement-avatar--primary">
                                  {manager.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <span className="ClientManagement-font-medium">{manager.name || 'No Name'}</span>
                                  <div className="ClientManagement-dropdown-item-details">
                                    <span>•</span>
                                    <span>{manager.email || 'No email'}</span>
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="ClientManagement-dropdown-empty">
                            <p>No users found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {newClient.projectManagers.length > 0 && (
                  <div className="ClientManagement-selected-items-preview">
                    {newClient.projectManagers.map(managerId => {
                      const manager = projectManagers.find(pm => pm._id === managerId);
                      if (!manager) return null;
                      return (
                        <div key={managerId} className="ClientManagement-selected-item">
                          <span>{manager.name}</span>
                          <button
                            type="button"
                            className="ClientManagement-selected-item-remove"
                            onClick={() => {
                              setNewClient(prev => ({
                                ...prev,
                                projectManagers: prev.projectManagers.filter(id => id !== managerId)
                              }));
                            }}
                          >
                            <FiX />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {fieldErrors.projectManagers && <small className="ClientManagement-text-danger">{fieldErrors.projectManagers}</small>}
              </div>

              
              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Services</label>
                {filteredServices.length === 0 && (
                  <div className="ClientManagement-alert ClientManagement-alert--info ClientManagement-mb-2">
                    <FiInfo /> No services available for this company. Please add services first.
                  </div>
                )}
                <div className="ClientManagement-dropdown-wrapper">
                  <div 
                    className="ClientManagement-dropdown-box"
                    onClick={() => setServicesOpen(!servicesOpen)}
                  >
                    <span>
                      {newClient.services.length === 0
                        ? "Select services"
                        : `${newClient.services.length} selected`}
                    </span>
                    <span className={`ClientManagement-dropdown-arrow ${servicesOpen ? 'ClientManagement-dropdown-arrow--open' : ''}`}>
                      <FiChevronDown />
                    </span>
                  </div>

                  {servicesOpen && (
                    <div className="ClientManagement-dropdown-content">
                      <div className="ClientManagement-dropdown-list">
                        {filteredServices.length > 0 ? (
                          filteredServices.map((service) => (
                            <label
                              key={service._id}
                              className="ClientManagement-dropdown-item"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                id={`service-${service._id}`}
                                checked={newClient.services.includes(service.servicename)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setNewClient(prev => ({
                                    ...prev,
                                    services: isChecked
                                      ? [...prev.services, service.servicename]
                                      : prev.services.filter(s => s !== service.servicename)
                                  }));
                                }}
                                disabled={loading || filteredServices.length === 0}
                              />
                              <label htmlFor={`service-${service._id}`} className="ClientManagement-dropdown-item-content">
                                <div className="ClientManagement-font-medium">{service.servicename}</div>
                              </label>
                            </label>
                          ))
                        ) : (
                          <div className="ClientManagement-dropdown-empty">
                            No services available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {newClient.services.length > 0 && (
                  <div className="ClientManagement-selected-items-preview">
                    {newClient.services.map((serviceName, index) => (
                      <div key={index} className="ClientManagement-selected-item ClientManagement-selected-item--info">
                        <span>{serviceName}</span>
                        {isExtraSelectedService(serviceName) && (
                          <span className="ClientManagement-badge ClientManagement-badge--warning">Extra</span>
                        )}
                        <button
                          type="button"
                          className="ClientManagement-selected-item-remove"
                          onClick={() => {
                            setNewClient(prev => ({
                              ...prev,
                              services: prev.services.filter(s => s !== serviceName)
                            }));
                          }}
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {fieldErrors.services && <small className="ClientManagement-text-danger">{fieldErrors.services}</small>}
              </div>

              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Description</label>
                <textarea
                  className="ClientManagement-form-input"
                  rows="3"
                  value={newClient.description}
                  onChange={(e) => setNewClient(prev => ({...prev, description: e.target.value}))}
                  placeholder="Enter client description..."
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Email</label>
                <input
                  type="email"
                  className="ClientManagement-form-input"
                  value={newClient.email}
                  onChange={(e) => {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                    setNewClient(prev => ({...prev, email: e.target.value}));
                  }}
                  disabled={loading}
                />
                {fieldErrors.email && <small className="ClientManagement-text-danger">{fieldErrors.email}</small>}
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Phone</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({...prev, phone: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Company Logo URL</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.companyLogo}
                  onChange={(e) => setNewClient(prev => ({...prev, companyLogo: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Industry</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.industry}
                  onChange={(e) => setNewClient(prev => ({...prev, industry: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">GST</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.gst}
                  onChange={(e) => setNewClient(prev => ({...prev, gst: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">PAN</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.pan}
                  onChange={(e) => setNewClient(prev => ({...prev, pan: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Website</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.website}
                  onChange={(e) => setNewClient(prev => ({...prev, website: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">State</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.state}
                  onChange={(e) => setNewClient(prev => ({...prev, state: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Country</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.country}
                  onChange={(e) => setNewClient(prev => ({...prev, country: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Pincode</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.pincode}
                  onChange={(e) => setNewClient(prev => ({...prev, pincode: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Address</label>
                <input
                  type="text"
                  className="ClientManagement-form-input"
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({...prev, address: e.target.value}))}
                  disabled={loading}
                />
              </div>

              <div className="ClientManagement-form-group ClientManagement-col-span-2">
                <label className="ClientManagement-form-label">Notes</label>
                <textarea
                  className="ClientManagement-form-input"
                  rows="2"
                  value={newClient.notes}
                  onChange={(e) => setNewClient(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Additional notes..."
                  disabled={loading}
                />
              </div>
            </div>
          </form>
        </div>
        <div className="ClientManagement-modal__footer">
          <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="ClientManagement-btn ClientManagement-btn--primary"
            onClick={handleSubmit}
            disabled={
              loading || 
              !newClient.client || 
              !newClient.company || 
              !newClient.city || 
              newClient.projectManagers.length === 0 ||
              filteredServices.length === 0 ||
              !companyCode ||
              !!dateError
            }
          >
            {loading ? 'Adding Client...' : 
             !companyCode ? 'Company Code Missing' :
             filteredServices.length === 0 ? 'Add Services First' : initialClient ? 'Add Company' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
};




const ClientManagement = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [clientPlans, setClientPlans] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: '', name: '' });
  const [editDialog, setEditDialog] = useState({ open: false, client: null });
  const [editError, setEditError] = useState('');
  const [totalClientsCount, setTotalClientsCount] = useState(0);
  const [activeClientsCount, setActiveClientsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [servicesModal, setServicesModal] = useState(false);
  const [clientPlansModal, setClientPlansModal] = useState(false);
  const [addClientModal, setAddClientModal] = useState(false);
  const [addCompanyParent, setAddCompanyParent] = useState(null);
  const [paymentReceiptsModal, setPaymentReceiptsModal] = useState({ open: false, client: null });
  const [overdueClientsModal, setOverdueClientsModal] = useState(false);
  const [taskCounts, setTaskCounts] = useState({});
  const [overdueClients, setOverdueClients] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestsModal, setServiceRequestsModal] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState('');
  const [companiesDrawer, setCompaniesDrawer] = useState({ open: false, clientGroup: null });
  
  const [companyCode, setCompanyCode] = useState('');
  const [companyIdentifier, setCompanyIdentifier] = useState('');
  const [userRole, setUserRole] = useState('');
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
    status: '',
    projectManager: '',
    service: ''
  });

  const [tasksStats, setTasksStats] = useState({
    pendingTasks: 0,
    overdueTasks: 0
  });

  const pendingServiceRequestsCount = serviceRequests.filter(request => (request.status || 'Pending') === 'Pending').length;

  useEffect(() => {
    if (!editDialog.open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [editDialog.open]);

  const loadServiceRequests = async (nextCompanyCode = companyCode, nextCompanyIdentifier = companyIdentifier) => {
    try {
      const response = await api.get('/service-enquiries', {
        params: {
          companyCode: nextCompanyCode || undefined,
          companyIdentifier: nextCompanyIdentifier || undefined
        }
      });
      if (response.data?.success) {
        setServiceRequests(response.data.data || []);
      } else {
        setServiceRequests([]);
      }
    } catch (err) {
      console.error('Error fetching service requests:', err);
      setServiceRequests([]);
    }
  };

  const handleApproveServiceRequest = async (requestId) => {
    if (!requestId) return;
    try {
      setApprovingRequestId(requestId);
      const response = await api.patch(`/service-enquiries/${requestId}/status`, { status: 'Approved' });
      if (response.data?.success) {
        setServiceRequests(prev => prev.map(request => (
          request._id === requestId ? response.data.data : request
        )));
        const approvalEmail = response.data?.approvalEmail;
        setSuccess(
          approvalEmail?.sent
            ? 'Service request approved successfully! Approval email sent to client.'
            : `Service request approved successfully! Approval email not sent${approvalEmail?.reason ? ` (${approvalEmail.reason})` : ''}.`
        );
        setError('');
      } else {
        setError(response.data?.message || 'Service request approve failed');
      }
    } catch (err) {
      console.error('Approve service request error:', err);
      setError(err.response?.data?.message || 'Service request approve failed');
    } finally {
      setApprovingRequestId('');
    }
  };

  const getLatestSubscriptionInfo = (client) => {
    if (!client.subscription || client.subscription.length === 0) {
      return { endDate: null, status: null, isExpired: false, formattedEndDate: null, price: null };
    }
    
    const latestSubscription = client.subscription[client.subscription.length - 1];
    const endDate = latestSubscription.endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(endDate);
    expiryDate.setHours(0, 0, 0, 0);
    const isExpired = expiryDate < today;
    
    return {
      endDate: endDate,
      status: latestSubscription.status,
      isExpired: isExpired,
      formattedEndDate: endDate ? new Date(endDate).toLocaleDateString() : null,
      price: latestSubscription.price
    };
  };

  const getCompanyStatusMeta = (status) => {
    const normalizedStatus = String(status || 'N/A').trim();
    const statusKey = normalizedStatus.toLowerCase();

    if (statusKey === 'active') {
      return { label: 'Active', className: 'ClientManagement-badge--success' };
    }

    if (statusKey === 'on hold') {
      return { label: 'On Hold', className: 'ClientManagement-badge--warning' };
    }

    if (statusKey === 'inactive') {
      return { label: 'Inactive', className: 'ClientManagement-badge--error' };
    }

    return { label: normalizedStatus || 'N/A', className: 'ClientManagement-badge--info' };
  };

  const getCompanyStatusSummary = (statusCounts) => {
    const preferredLabels = ['Active', 'On Hold', 'Inactive'];
    const preferredEntries = [
      ['Active', statusCounts.Active || 0],
      ['On Hold', statusCounts['On Hold'] || 0],
      ['Inactive', statusCounts.Inactive || 0]
    ].filter(([, count]) => count > 0);
    const extraEntries = Object.entries(statusCounts || {})
      .filter(([label, count]) => !preferredLabels.includes(label) && count > 0);
    const entries = [...preferredEntries, ...extraEntries];

    if (entries.length === 0) return [{ label: 'N/A', className: 'ClientManagement-badge--info' }];

    return entries.map(([label, count]) => ({
      label: `${count} ${label}`,
      className: getCompanyStatusMeta(label).className
    }));
  };

  const formatCurrency = (amount) => {
    return `Rs ${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const getClientRevenue = (client) => {
    const approvedReceiptTotal = Array.isArray(client.paymentReceipts)
      ? client.paymentReceipts
        .filter(receipt => ['Approved', 'Paid'].includes(receipt.status))
        .reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0)
      : 0;

    if (approvedReceiptTotal > 0) return approvedReceiptTotal;

    const paidInvoiceTotal = Array.isArray(client.dueInvoices)
      ? client.dueInvoices
        .filter(invoice => invoice.status === 'Paid')
        .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)
      : 0;

    if (paidInvoiceTotal > 0) return paidInvoiceTotal;

    return Array.isArray(client.subscription)
      ? client.subscription.reduce((sum, subscription) => sum + Number(subscription.price || 0), 0)
      : 0;
  };

  const getLastPayment = (client) => {
    const approvedReceipts = Array.isArray(client.paymentReceipts)
      ? client.paymentReceipts.filter(receipt => receipt.status === 'Approved')
      : [];
    return approvedReceipts
      .sort((a, b) => new Date(b.verifiedAt || b.uploadDate || 0) - new Date(a.verifiedAt || a.uploadDate || 0))[0] || null;
  };

  const getClientPortfolioGroups = (clientRows) => {
    const groups = new Map();

    clientRows.forEach((companyClient) => {
      const key = String(companyClient.parentClientId || companyClient.parentClientName || companyClient.client || companyClient._id);
      const subscriptionInfo = getLatestSubscriptionInfo(companyClient);
      const isExpired = subscriptionInfo.isExpired || companyClient.status !== 'Active';

      if (!groups.has(key)) {
        groups.set(key, {
          _id: companyClient.parentClientId || companyClient._id,
          client: companyClient.parentClientName || companyClient.client || 'Unnamed Client',
          companyCode: companyClient.companyCode,
          totalCompanies: 0,
          activeCompanies: 0,
          expiredCompanies: 0,
          totalRevenue: 0,
          statusCounts: {},
          companies: []
        });
      }

      const group = groups.get(key);
      const companyStatus = getCompanyStatusMeta(companyClient.status).label;
      group.totalCompanies += 1;
      group.activeCompanies += companyClient.status === 'Active' && !isExpired ? 1 : 0;
      group.expiredCompanies += isExpired ? 1 : 0;
      group.totalRevenue += getClientRevenue(companyClient);
      group.statusCounts[companyStatus] = (group.statusCounts[companyStatus] || 0) + 1;
      group.companies.push(companyClient);
    });

    return Array.from(groups.values());
  };

  useEffect(() => {
    const getUserRole = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserRole(user.role || user.userRole || 'client');
        } else {
          setUserRole('client');
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        setUserRole('client');
      }
    };
    getUserRole();
  }, []);

  useEffect(() => {
    const fetchCompanyInfo = () => {
      try {
        const localStorageCompany = localStorage.getItem('company') || '';
        const localStorageCompanyDetails = localStorage.getItem('companyDetails') || '';
        
        const companyCodeFromStorage = localStorage.getItem('companyCode') || localStorageCompany;
        const companyIdentifierFromStorage = localStorage.getItem('companyIdentifier') || localStorageCompanyDetails;
        
        setCompanyCode(companyCodeFromStorage);
        setCompanyIdentifier(companyIdentifierFromStorage);
        if (!companyCodeFromStorage && !companyIdentifierFromStorage) {
          setError('Company information not found. Please login again.');
        } else {
          setError('');
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        setError('Error loading company information');
      }
    };

    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    loadServiceRequests();
    const handleFocus = () => loadServiceRequests();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [companyCode, companyIdentifier]);

  const fetchProjectManagers = async () => {
    try {
      const token = getAuthToken();
      const userStr = localStorage.getItem('user');
      let currentUser = {};

      if (userStr) {
        currentUser = JSON.parse(userStr);
      }

      const companyRole = (
        currentUser.companyRole ||
        currentUser.role ||
        currentUser.userRole ||
        ''
      ).toLowerCase();

      let apiEndpoint = '/company-users';

      if (companyRole === 'employee') {
        apiEndpoint = '/department-users';
      }

      if (companyRole === 'owner' || companyRole === 'hr' || companyRole === 'manager') {
        apiEndpoint = '/company-users';
      }

      const response = await usersApi.get(apiEndpoint, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      let usersArray = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          usersArray = response.data;
        } else if (Array.isArray(response.data.users)) {
          usersArray = response.data.users;
        } else if (response.data.message && Array.isArray(response.data.message.users)) {
          usersArray = response.data.message.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersArray = response.data.data;
        }
      }

      const formattedManagers = usersArray.map((user) => ({
        _id: user.id || user._id,
        name: user.name || 'Unknown User',
        email: user.email || '',
        role: user.companyRole || user.jobRole || '',
        phone: user.phone || '',
        department: user.department || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
      }));

      setProjectManagers(formattedManagers);

      if (formattedManagers.length > 0) {
        setSuccess(`Loaded ${formattedManagers.length} users`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('No users found');
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      setProjectManagers([]);
      setError('Failed to load users');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // User lookup is independent and must not hold up the client list.
      fetchProjectManagers();
      
      const apiParams = {
        ...filters,
        companyCode: companyCode || undefined,
        companyIdentifier: companyIdentifier || undefined
      };
      
      const [clientsRes, servicesRes, plansRes, statsRes, enquiriesRes] = await Promise.all([
        api.get('/', { params: apiParams }),
        api.get('/services', { 
          params: { 
            companyCode: companyCode || undefined,
            companyIdentifier: companyIdentifier || undefined
          } 
        }),
        clientPlansApi.get('/', {
          params: {
            companyCode: companyCode || undefined,
            includeInactive: true
          }
        }).catch(err => {
          console.warn('Client plans fetch failed:', err);
          return { data: { success: false, data: [] } };
        }),
        api.get('/stats', {
          params: {
            companyCode: companyCode || undefined,
            companyIdentifier: companyIdentifier || undefined
          }
        }).catch(err => {
          console.warn('Stats fetch failed:', err);
          return { data: { success: false } };
        }),
        api.get('/service-enquiries', {
          params: {
            companyCode: companyCode || undefined,
            companyIdentifier: companyIdentifier || undefined
          }
        }).catch(err => {
          console.warn('Service enquiries fetch failed:', err);
          return { data: { success: false, data: [] } };
        })
      ]);
      
      if (servicesRes.data?.success) {
        const allServices = servicesRes.data.data || [];
        setServices(allServices);
      } else {
        setServices([]);
      }

      if (plansRes.data?.success) {
        setClientPlans(plansRes.data.data || plansRes.data.plans || []);
      } else {
        setClientPlans([]);
      }
      
      if (clientsRes.data?.success) {
        const allClients = clientsRes.data.data || [];
        
        const enhancedClients = allClients.map(client => ({
          ...client,
          projectManagers: Array.isArray(client.projectManagers) ? client.projectManagers : []
        }));
        
        setClients(enhancedClients);
        
        const pagination = clientsRes.data.pagination || {};
        setTotalItems(pagination.totalItems || enhancedClients.length);
        setTotalPages(pagination.totalPages || 1);
      } else {
        setClients([]);
        setTotalItems(0);
        setTotalPages(1);
      }

      if (statsRes.data?.success) {
        setTotalClientsCount(statsRes.data.data?.total || 0);
        setActiveClientsCount(statsRes.data.data?.active || 0);
      } else {
        setTotalClientsCount(clientsRes.data.pagination?.totalItems || 0);
        setActiveClientsCount(0);
      }

      if (enquiriesRes.data?.success) {
        setServiceRequests(enquiriesRes.data.data || []);
      }
      
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Data fetch failed';
      setError(errorMessage);
      setClients([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyCode || companyIdentifier) {
      fetchData();
    }
  }, [filters, companyCode, companyIdentifier]);

  useEffect(() => {
    if (!paymentReceiptsModal.open || !paymentReceiptsModal.client?._id) return;
    const updatedClient = clients.find(client => client._id === paymentReceiptsModal.client._id);
    if (updatedClient && updatedClient !== paymentReceiptsModal.client) {
      setPaymentReceiptsModal(prev => ({ ...prev, client: updatedClient }));
    }
  }, [clients, paymentReceiptsModal.open, paymentReceiptsModal.client?._id]);

  const fetchClientTasks = async (clientId) => {
    try {
      const response = await tasksApi.get(`/client/${clientId}`);
      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data.data?.tasks) {
          return response.data.data.tasks;
        }
        return [];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching client tasks for ${clientId}:`, error);
      return [];
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadTaskSummaries = async () => {
      if (!clients.length) {
        setTaskCounts({});
        setOverdueClients([]);
        setTasksStats({ pendingTasks: 0, overdueTasks: 0 });
        return;
      }
      try {
        const response = await tasksApi.get('/summary/bulk', {
          params: { clientIds: clients.map(client => client._id).join(',') }
        });
        if (cancelled) return;
        const summaries = response.data?.data || {};
        let pendingTasks = 0;
        let overdueTasks = 0;
        const overdueClientsData = [];
        const counts = {};
        clients.forEach(client => {
          const summary = summaries[client._id] || {};
          counts[client._id] = {
            total: summary.total || 0,
            completed: summary.completed || 0,
            pending: summary.pending || 0
          };
          pendingTasks += summary.pending || 0;
          overdueTasks += summary.overdue || 0;
          if (summary.overdue) {
            overdueClientsData.push({
              _id: client._id,
              client: client.client,
              company: client.company,
              overdueTasksCount: summary.overdue,
              overdueTaskNames: summary.overdueTaskNames || []
            });
          }
        });
        setTaskCounts(counts);
        setOverdueClients(overdueClientsData);
        setTasksStats({ pendingTasks, overdueTasks });
      } catch (error) {
        if (!cancelled) console.error('Error loading task summaries:', error);
      }
    };
    loadTaskSummaries();
    return () => { cancelled = true; };
  }, [clients]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {})
    }));
  };

  const handleAddService = async (serviceName) => {
    if (!serviceName.trim()) return;

    try {
      const serviceData = { 
        servicename: serviceName.trim(),
        companyCode: companyCode
      };
      
      const response = await api.post('/services', serviceData);
      
      if (response.data.success) {
        setSuccess('Service added successfully!');
        setError('');
        fetchData();
      } else {
        setError(response.data.message || 'Service add failed');
      }
    } catch (err) {
      console.error('Add service error:', err);
      const errorMsg = err.response?.data?.message || 'Service add failed';
      setError(errorMsg);
    }
  };

  const handleSaveClientPlan = async (planData) => {
    if (!planData.name?.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!planData.services?.length) {
      setError('Select at least one service for plan');
      return;
    }
    try {
      const response = await clientPlansApi.post('/', planData);
      if (response.data?.success) {
        setSuccess('Client plan created successfully');
        setClientPlans(prev => [response.data.data || response.data.plan, ...prev].filter(Boolean));
        setClientPlansModal(false);
      }
    } catch (err) {
      console.error('Save client plan error:', err);
      setError(err.response?.data?.message || 'Failed to save client plan');
      throw err;
    }
  };

  const handleAddClient = async (clientData) => {
    try {
      setAddLoading(true);
      setError('');
      
      const managerNames = clientData.projectManagers.map(pm => pm.name);
      
      const backendClientData = {
        client: clientData.client,
        company: clientData.company,
        city: clientData.city,
        projectManager: managerNames,
        services: clientData.services,
        status: clientData.status,
        progress: clientData.progress,
        email: clientData.email,
        phone: clientData.phone,
        parentClientId: clientData.parentClientId,
        parentClientName: clientData.parentClientName,
        companyLogo: clientData.companyLogo,
        industry: clientData.industry,
        gst: clientData.gst,
        pan: clientData.pan,
        website: clientData.website,
        state: clientData.state,
        country: clientData.country,
        pincode: clientData.pincode,
        address: clientData.address,
        description: clientData.description,
        notes: clientData.notes,
        companyCode: clientData.companyCode,
        clientPlanId: clientData.clientPlanId,
        subscription: clientData.subscription || []
      };
      
      const response = await api.post('/', backendClientData);
      
      if (response.data.success) {
        setSuccess('Client added successfully!');
        setError('');
        setAddClientModal(false);
        setAddCompanyParent(null);
        fetchData();
      } else {
        const responseData = response.data || {};
        const errorMessage = responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0
          ? responseData.errors.join(', ')
          : (responseData.message || 'Client add failed');
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Add client error:', err);
      const responseData = err.response?.data || {};
      const errorMessage = responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0
        ? responseData.errors.join(', ')
        : (responseData.message || err.message || 'Client add failed');
      setError(errorMessage);
      throw err;
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateClient = async (clientId, updateData) => {
    try {
      setError('');
      setSuccess('');
      const response = await api.put(`/${clientId}`, updateData);
      
      if (response.data.success) {
        setSuccess('Client updated successfully!');
        setEditDialog({ open: false, client: null });
        setEditError('');
        fetchData();
        return response.data;
      } else {
        const responseData = response.data || {};
        const errorMessage = responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0
          ? responseData.errors.join(', ')
          : (responseData.message || 'Client update failed');
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Update client error:', err);
      const responseData = err.response?.data || {};
      const errorMessage = responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0
        ? responseData.errors.join(', ')
        : (responseData.message || err.message || 'Client update failed');
      setError(errorMessage);
      throw err;
    }
  };

  const handleDeleteClick = (type, id, name) => {
    setDeleteDialog({ open: true, type, id, name });
  };

  const handleDeleteConfirm = async () => {
    const { type, id } = deleteDialog;
    
    try {
      if (type === 'client') {
        try {
          const tasksResponse = await tasksApi.get(`/client/${id}`);
          const tasks = tasksResponse.data?.data || [];
          if (Array.isArray(tasks)) {
            for (const task of tasks) {
              await tasksApi.delete(`/${task._id}`);
            }
          }
        } catch (taskError) {
          console.warn('Error deleting client tasks:', taskError);
        }
        
        const response = await api.delete(`/${id}`);
        if (response.data.success) {
          setSuccess('Client deleted successfully!');
          fetchData();
        }
      } else if (type === 'service') {
        const response = await api.delete(`/services/${id}`);
        if (response.data.success) {
          setSuccess('Service deleted successfully!');
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
      console.error('Delete error:', err);
    }
    
    setDeleteDialog({ open: false, type: '', id: '', name: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, type: '', id: '', name: '' });
  };

  const handleEditClick = (client) => {
    setEditError('');
    let subscriptionStartDate = '';
    let subscriptionEndDate = '';
    let subscriptionPrice = '';
    
    if (client.subscription && client.subscription.length > 0) {
      const latestSub = client.subscription[client.subscription.length - 1];
      subscriptionStartDate = new Date(latestSub.startDate).toISOString().split('T')[0];
      subscriptionEndDate = new Date(latestSub.endDate).toISOString().split('T')[0];
      subscriptionPrice = latestSub.price || '';
    }
    
    let formattedProjectManagers = [];
    
    if (client.projectManagers && Array.isArray(client.projectManagers)) {
      if (client.projectManagers.length > 0 && typeof client.projectManagers[0] === 'object') {
        formattedProjectManagers = client.projectManagers.map(pm => ({
          _id: pm._id || pm.id,
          name: pm.name,
          email: pm.email,
          role: pm.role
        }));
      } else if (client.projectManagers.length > 0 && typeof client.projectManagers[0] === 'string') {
        formattedProjectManagers = client.projectManagers.map(name => {
          const manager = projectManagers.find(pm => pm.name === name);
          return manager ? {
            _id: manager._id,
            name: manager.name,
            email: manager.email,
            role: manager.role
          } : { _id: name, name: name, email: '', role: '' };
        });
      }
    }
    
    if (formattedProjectManagers.length === 0 && client.projectManager && Array.isArray(client.projectManager)) {
      formattedProjectManagers = client.projectManager.map(name => {
        const manager = projectManagers.find(pm => pm.name === name);
        return manager ? {
          _id: manager._id,
          name: manager.name,
          email: manager.email,
          role: manager.role
        } : { _id: name, name: name, email: '', role: '' };
      });
    }
    
    setEditDialog({ 
      open: true, 
      client: {
        ...client,
        projectManagers: formattedProjectManagers,
        subscriptionStartDate: subscriptionStartDate,
        subscriptionEndDate: subscriptionEndDate,
        subscriptionPrice: subscriptionPrice
      }
    });
  };

  const handleEditSave = async () => {
    const { client } = editDialog;
    
    const formattedProjectManagers = client.projectManagers.map(pm => ({
      _id: pm._id || pm.id,
      name: pm.name,
      email: pm.email,
      role: pm.role
    }));
    
    const managerNames = client.projectManagers.map(pm => pm.name);
    
    let subscriptionData = [];
    
    if (client.subscriptionStartDate && client.subscriptionEndDate) {
      subscriptionData = [{
        startDate: client.subscriptionStartDate,
        endDate: client.subscriptionEndDate,
        price: client.subscriptionPrice ? parseFloat(client.subscriptionPrice) : 0,
        status: 'Active'
      }];
    } else if (client.subscription && client.subscription.length > 0) {
      subscriptionData = client.subscription;
    }
    
    const updateData = {
      client: client.client,
      company: client.company,
      city: client.city,
      projectManager: managerNames,
      services: client.services,
      status: client.status,
      progress: client.progress,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      description: client.description || '',
      notes: client.notes || '',
      companyCode: companyCode,
      subscription: subscriptionData
    };
    
    try {
      setEditError('');
      await handleUpdateClient(client._id, updateData);
    } catch (err) {
      console.error('Save edit client error:', err);
      const responseData = err.response?.data || {};
      const errorMessage = responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0
        ? responseData.errors.join(', ')
        : (responseData.message || err.message || 'Client update failed');
      setEditError(errorMessage);
    }
  };

  const handleViewClick = (client) => {
    navigate(`/ciisUser/emp-client/${client._id}`, { state: { client } });
  };

  const safeMapProjectManagers = (callback) => {
    return Array.isArray(projectManagers) 
      ? projectManagers.map(callback)
      : [];
  };

  const filteredClients = clients;
  const clientPortfolioGroups = getClientPortfolioGroups(filteredClients);

  const getProjectManagersDetails = (client) => {
    if (!client) return [];
    
    if (client.projectManagers && Array.isArray(client.projectManagers) && client.projectManagers.length > 0) {
      return client.projectManagers;
    }
    
    const managerNames = client.projectManager || [];
    return managerNames.map(name => {
      const manager = projectManagers.find(pm => pm.name === name);
      return manager || { name, id: `temp-${Date.now()}` };
    });
  };

  const renderManagerInfo = (manager) => {
    return (
      <div className="ClientManagement-manager-info">
        <div className="ClientManagement-manager-header">
          <div className="ClientManagement-avatar ClientManagement-avatar--primary">
            {manager.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="ClientManagement-font-bold">{manager.name}</p>
          </div>
        </div>
        <div className="ClientManagement-manager-details">
          {manager.email && (
            <div>
              <small className="ClientManagement-text-muted">Email:</small>
              <small>{manager.email}</small>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleTaskUpdate = (serviceName, tasks) => {
    void 0;
  };

  return (
    <div className="ClientManagement-client-management">
      <div className="ClientManagement-client-management-header">
        <div className="ClientManagement-card__content">
          <div className="ClientManagement-client-header-container">
            <div className="ClientManagement-client-header-left">
              <FiUsers className="ClientManagement-client-header-icon" />
              <div>
                <h1 className="ClientManagement-client-header-title">Client Management</h1>
                <p className="ClientManagement-client-header-subtitle">
                  {companyCode || companyIdentifier 
                    ? `Company: ${companyCode || companyIdentifier}` 
                    : 'Manage clients and services'}
                </p>
              </div>
            </div>
            <div className="ClientManagement-client-header-actions">
              <button
                className="ClientManagement-btn ClientManagement-btn--outlined"
                onClick={() => setServicesModal(true)}
                disabled={!companyCode && !companyIdentifier}
              >
                <FiBriefcase /> Services ({services.length})
              </button>
              <button
                className="ClientManagement-btn ClientManagement-btn--outlined"
                onClick={() => navigate('/ciisUser/client-plans')}
                disabled={services.length === 0 || (!companyCode && !companyIdentifier)}
              >
                <FiBriefcase /> Client Plans ({clientPlans.length})
              </button>
              <button
                className="ClientManagement-btn ClientManagement-btn--primary"
                onClick={() => {
                  navigate('/ciisUser/emp-client/add-new');
                }}
                disabled={services.length === 0 || (!companyCode && !companyIdentifier)}
              >
                <FiPlus /> Add Client
              </button>
              <button
                className="ClientManagement-btn ClientManagement-btn--outlined"
                onClick={() => fetchData()}
              >
                <FiRefreshCw /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ClientManagement-stats-griddd">
        {[
          { label: 'Total Clients', value: totalClientsCount, color: 'primary', icon: <FiUsers /> },
          { label: 'Active Clients', value: activeClientsCount, color: 'success', icon: <FiCheckCircle /> },
          { label: 'Pending Tasks', value: tasksStats.pendingTasks, color: 'warning', icon: <FiClock /> },
          { label: 'Overdue Tasks', value: tasksStats.overdueTasks, color: 'error', icon: <FiAlertCircle /> },
          { label: 'Services', value: services.length, color: 'info', icon: <FiBriefcase /> },
          { label: 'Service Requests', value: pendingServiceRequestsCount, color: 'purple', icon: <FiBell />, notify: pendingServiceRequestsCount > 0 }
        ].map((stat, index) => (
          <div
            key={index}
            className={`ClientManagement-stat-card ClientManagement-stat-card--${stat.color} ${['Overdue Tasks', 'Service Requests'].includes(stat.label) ? 'ClientManagement-stat-card--clickable' : ''} ${stat.notify ? 'ClientManagement-stat-card--notify' : ''}`}
            onClick={stat.label === 'Overdue Tasks' ? () => setOverdueClientsModal(true) : stat.label === 'Service Requests' ? () => setServiceRequestsModal(true) : undefined}
            role={['Overdue Tasks', 'Service Requests'].includes(stat.label) ? 'button' : undefined}
            tabIndex={['Overdue Tasks', 'Service Requests'].includes(stat.label) ? 0 : undefined}
            onKeyDown={['Overdue Tasks', 'Service Requests'].includes(stat.label) ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (stat.label === 'Overdue Tasks') setOverdueClientsModal(true);
                if (stat.label === 'Service Requests') setServiceRequestsModal(true);
              }
            } : undefined}
          >
            {stat.notify && (
              <span className="ClientManagement-stat-notification" aria-label={`${stat.value} new service requests`}>
                {stat.value}
              </span>
            )}
            <div className="ClientManagement-card__content">
              <div className="ClientManagement-stat-card-content">
                <div className={`ClientManagement-avatar ClientManagement-avatar--${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <small className="ClientManagement-text-muted">{stat.label}</small>
                  <p className="ClientManagement-stat-card-value">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!companyCode && !companyIdentifier && (
        <div className="ClientManagement-alert ClientManagement-alert--warning">
          <FiAlertCircle /> Company information not found. Please refresh the page or login again.
        </div>
      )}

      {error && (
        <div className="ClientManagement-alert ClientManagement-alert--error">
          <FiAlertCircle /> {error}
        </div>
      )}

      {success && (
        <div className="ClientManagement-alert ClientManagement-alert--success">
          <FiCheckCircle /> {success}
        </div>
      )}

      <div className="ClientManagement-card">
        <div className="ClientManagement-card__header ClientManagement-card-header-gradient">
          <div className="ClientManagement-card-header-container">
            <div className="ClientManagement-card-header-left">
              <div className="ClientManagement-avatar-circle">
                <FiUsers />
              </div>
              <div>
                <h2 className="ClientManagement-card-header-title">Client Portfolio</h2>
                <p className="ClientManagement-card-header-subtitle">
                  Total {totalClientsCount} clients • {activeClientsCount} active                  
                  {(companyCode || companyIdentifier) && 
                    <span> • Company: {companyCode || companyIdentifier}</span>
                  }
                </p>
              </div>
            </div>
            
            <div className="ClientManagement-card-header-right">
              <div className="ClientManagement-active-indicator">
                <FiActivity />
                <span>{activeClientsCount} Active</span>
              </div>
              
              <button 
                className="ClientManagement-refresh-button"
                onClick={() => fetchData()}
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>
        </div>
        
        <div className="ClientManagement-filter-bar">
          <div className="ClientManagement-filter-grid">
            <div className="ClientManagement-filter-search-container">
              <div className="ClientManagement-search-input">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <select
                className="ClientManagement-form-input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <select
                className="ClientManagement-form-input"
                value={filters.projectManager}
                onChange={(e) => handleFilterChange('projectManager', e.target.value)}
              >
                <option value="">All Managers</option>
                {safeMapProjectManagers((manager) => (
                  <option key={manager._id || manager.id} value={manager.name}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                className="ClientManagement-form-input"
                value={filters.service}
                onChange={(e) => handleFilterChange('service', e.target.value)}
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service._id} value={service.servicename}>
                    {service.servicename}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <button
                className="ClientManagement-btn ClientManagement-btn--primary ClientManagement-w-100"
                onClick={() => {
                  navigate('/ciisUser/emp-client/add-new');
                }}
                disabled={services.length === 0 || (!companyCode && !companyIdentifier)}
              >
                <FiPlus /> New Client
              </button>
            </div>
          </div>
        </div>
        
        <div className="ClientManagement-card__content ClientManagement-card-content-padded">
          {!companyCode && !companyIdentifier ? (
            <div className="ClientManagement-empty-state-container">
              <div className="ClientManagement-empty-state">
                <FiAlertCircle className="ClientManagement-empty-state-icon" />
                <h3 className="ClientManagement-empty-state-title">Company Information Required</h3>
                <p className="ClientManagement-empty-state-description">
                  Company code or identifier not found. Please refresh the page or login again.
                </p>
                <button 
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="ClientManagement-loading-container">
              <div className="ClientManagement-spinner"></div>
              <p>Loading clients...</p>
            </div>
          ) : clientPortfolioGroups.length > 0 ? (
            <>
              <div className="ClientManagement-table-container">
                <table className="ClientManagement-data-table">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Total Companies</th>
                      <th>Company Status</th>
                      <th>Active Companies</th>
                      <th>Expired Companies</th>
                      <th>Total Revenue</th>
                      <th className="ClientManagement-text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPortfolioGroups.map((clientGroup) => {
                      return (
                        <tr key={clientGroup._id}>
                          <td>
                            <div className="ClientManagement-client-cell">
                              <div>
                                <p className="ClientManagement-font-bold">{clientGroup.client || 'N/A'}</p>
                                <small className="ClientManagement-text-muted ClientManagement-client-cell-secondary">
                                  ID: {String(clientGroup._id || '').slice(-6)}
                                  {clientGroup.companyCode && ` - Code: ${clientGroup.companyCode}`}
                                </small>
                                <small className="ClientManagement-text-muted ClientManagement-client-cell-mobile">
                                  {clientGroup.totalCompanies} companies
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ClientManagement-badge ClientManagement-badge--info">
                              {clientGroup.totalCompanies} Companies
                            </div>
                          </td>
                          <td>
                            <div className="ClientManagement-status-summary">
                              {getCompanyStatusSummary(clientGroup.statusCounts).map((statusItem) => (
                                <span
                                  key={statusItem.label}
                                  className={`ClientManagement-badge ${statusItem.className}`}
                                >
                                  {statusItem.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="ClientManagement-badge ClientManagement-badge--success">
                              {clientGroup.activeCompanies} Active
                            </div>
                          </td>
                          <td>
                            <div className={`ClientManagement-badge ${clientGroup.expiredCompanies > 0 ? 'ClientManagement-badge--warning' : 'ClientManagement-badge--success'}`}>
                              {clientGroup.expiredCompanies} Expired
                            </div>
                          </td>
                          <td>
                            <p className="ClientManagement-font-bold">{formatCurrency(clientGroup.totalRevenue)}</p>
                          </td>
                          <td className="ClientManagement-text-center">
                            <div className="ClientManagement-actions-cell">
                              <button
                                className="ClientManagement-action-button ClientManagement-action-button--primary"
                                onClick={() => setCompaniesDrawer({ open: true, clientGroup })}
                                title="View Companies"
                              >
                                <FiEye />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="ClientManagement-pagination-container">
                <div className="ClientManagement-pagination-left">
                  <select
                    className="ClientManagement-form-input ClientManagement-pagination-select"
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  <p className="ClientManagement-pagination-info">
                    Showing <strong>{((filters.page - 1) * filters.limit) + 1}-{Math.min(filters.page * filters.limit, totalItems)}</strong> of <strong>{totalItems}</strong>
                  </p>
                </div>
                
                <div className="ClientManagement-pagination">
                  <button
                    type="button"
                    disabled={filters.page === 1}
                    className="ClientManagement-pagination__item"
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    style={{ opacity: filters.page === 1 ? 0.5 : 1, cursor: filters.page === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`ClientManagement-pagination__item ${page === filters.page ? 'ClientManagement-pagination__item--active' : ''}`}
                      onClick={() => handleFilterChange('page', page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={filters.page >= totalPages}
                    className="ClientManagement-pagination__item"
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    style={{ opacity: filters.page >= totalPages ? 0.5 : 1, cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="ClientManagement-empty-state-container">
              <div className="ClientManagement-empty-state">
                <FiUsers className="ClientManagement-empty-state-icon" />
                <h3 className="ClientManagement-empty-state-title">No Clients Found</h3>
                <p className="ClientManagement-empty-state-description">
                  {services.length === 0 
                    ? 'Add services first to create clients' 
                    : `No clients found for ${companyCode || companyIdentifier}. Add your first client.`
                  }
                </p>
                <button 
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  onClick={() => {
                    if (services.length === 0) {
                      setServicesModal(true);
                      return;
                    }
                    navigate('/ciisUser/emp-client/add-new');
                  }}
                  disabled={!companyCode && !companyIdentifier}
                >
                  {services.length === 0 ? 'Add Services First' : 'Create First Client'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {companiesDrawer.open && companiesDrawer.clientGroup && (
        <div className="ClientManagement-modal-overlay" onClick={() => setCompaniesDrawer({ open: false, clientGroup: null })}>
          <div className="ClientManagement-modal ClientManagement-company-drawer" onClick={e => e.stopPropagation()}>
            <div className="ClientManagement-modal__header">
              <div>
                <h3>{companiesDrawer.clientGroup.client}</h3>
                <p className="ClientManagement-text-muted">
                  {companiesDrawer.clientGroup.totalCompanies} companies - {formatCurrency(companiesDrawer.clientGroup.totalRevenue)} revenue
                </p>
              </div>
              <button
                className="ClientManagement-action-button"
                onClick={() => setCompaniesDrawer({ open: false, clientGroup: null })}
                title="Close"
              >
                <FiX />
              </button>
            </div>
            <div className="ClientManagement-modal__content">
              <div className="ClientManagement-company-drawer-actions">
                <button
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  onClick={() => {
                    const parentCompany = companiesDrawer.clientGroup.companies[0];
                    setCompaniesDrawer({ open: false, clientGroup: null });
                    navigate('/ciisUser/emp-client/add-new', { state: { initialClient: parentCompany } });
                  }}
                  disabled={services.length === 0 || (!companyCode && !companyIdentifier)}
                >
                  <FiPlus /> Add New Company
                </button>
              </div>
              <div className="ClientManagement-company-card-grid">
                {companiesDrawer.clientGroup.companies.map((companyClient) => {
                  const stats = taskCounts[companyClient._id] || { total: 0, completed: 0, pending: 0 };
                  const subscriptionInfo = getLatestSubscriptionInfo(companyClient);
                  const latestSubscription = Array.isArray(companyClient.subscription) && companyClient.subscription.length > 0
                    ? companyClient.subscription[companyClient.subscription.length - 1]
                    : null;
                  const lastPayment = getLastPayment(companyClient);
                  const companyStatus = getCompanyStatusMeta(companyClient.status);

                  return (
                    <div key={companyClient._id} className="ClientManagement-company-card">
                      <div className="ClientManagement-company-card-header">
                        <div className="ClientManagement-company-logo">
                          {companyClient.companyLogo ? (
                            <img src={companyClient.companyLogo} alt={companyClient.company || 'Company'} />
                          ) : (
                            <span>{(companyClient.company || 'C').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="ClientManagement-company-card-title-row">
                            <h4>{companyClient.company || 'Company'}</h4>
                            <span className={`ClientManagement-badge ${companyStatus.className}`}>
                              {companyStatus.label}
                            </span>
                          </div>
                          <p>{companyClient.email || 'No email'}</p>
                        </div>
                      </div>

                      <div className="ClientManagement-company-card-meta">
                        <span>GST: {companyClient.gst || 'N/A'}</span>
                        <span>PAN: {companyClient.pan || 'N/A'}</span>
                        <span>Phone: {companyClient.phone || 'N/A'}</span>
                        <span>
                          Status: <span className={`ClientManagement-badge ${companyStatus.className}`}>{companyStatus.label}</span>
                        </span>
                        <span>Active Plan: {latestSubscription?.planName || 'N/A'}</span>
                        <span>Total Services: {Array.isArray(companyClient.services) ? companyClient.services.length : 0}</span>
                        <span>Total Tasks: {stats.total || 0}</span>
                        <span>
                          Last Payment: {lastPayment ? `${formatCurrency(lastPayment.amount)} on ${new Date(lastPayment.verifiedAt || lastPayment.uploadDate).toLocaleDateString()}` : 'N/A'}
                        </span>
                      </div>

                      {subscriptionInfo.endDate && (
                        <div className={`ClientManagement-subscription-badge ${subscriptionInfo.isExpired ? 'ClientManagement-subscription-expired' : 'ClientManagement-subscription-active'}`}>
                          <small>Expires</small>
                          <strong>{subscriptionInfo.formattedEndDate}</strong>
                        </div>
                      )}

                      <div className="ClientManagement-company-card-actions">
                        <button
                          className="ClientManagement-btn ClientManagement-btn--primary"
                          onClick={() => handleViewClick(companyClient)}
                        >
                          <FiEye /> View Details
                        </button>
                        <button
                          className="ClientManagement-btn ClientManagement-btn--outlined"
                          onClick={() => handleEditClick(companyClient)}
                        >
                          <FiEdit /> Edit
                        </button>
                        <button
                          className="ClientManagement-btn ClientManagement-btn--outlined"
                          onClick={() => setPaymentReceiptsModal({ open: true, client: companyClient })}
                        >
                          <FiCreditCard /> Payments
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client page routing replacement */}

      <ServicesModal
        open={servicesModal}
        onClose={() => setServicesModal(false)}
        services={services}
        onAddService={handleAddService}
        onDeleteService={(id, name) => handleDeleteClick('service', id, name)}
        companyCode={companyCode}
      />



      {deleteDialog.open && (
        <div className="ClientManagement-modal-overlay" onClick={handleDeleteCancel}>
          <div className="ClientManagement-modal" onClick={e => e.stopPropagation()}>
            <div className="ClientManagement-modal__header">
              <h3>Delete {deleteDialog.type === 'client' ? 'Client' : 'Service'}</h3>
            </div>
            <div className="ClientManagement-modal__content">
              <p>
                Are you sure you want to delete {deleteDialog.type} "{deleteDialog.name}"?
                {deleteDialog.type === 'client' && ' This action will also delete all associated tasks.'}
              </p>
            </div>
            <div className="ClientManagement-modal__footer">
              <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={handleDeleteCancel}>Cancel</button>
              <button 
                className="ClientManagement-btn ClientManagement-btn--error"
                onClick={handleDeleteConfirm}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editDialog.open && editDialog.client && (
        <div className="ClientManagement-modal-overlay ClientManagement-edit-modal-overlay" onClick={() => setEditDialog({ open: false, client: null })}>
          <div className="ClientManagement-modal ClientManagement-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="ClientManagement-modal__header">
              <h3>Edit Client</h3>
              <button 
                type="button"
                className="ClientManagement-action-button" 
                onClick={() => setEditDialog({ open: false, client: null })}
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEditSave();
            }}>
              <div className="ClientManagement-modal__content">
                {editError && (
                  <div className="ClientManagement-alert ClientManagement-alert--error ClientManagement-mb-3">
                    <FiAlertCircle /> {editError}
                  </div>
                )}
                <div className="ClientManagement-edit-client-grid">
                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Client Name *</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.client}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, client: e.target.value }
                      })}
                      required
                    />
                  </div>
                  
                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Company *</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.company}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, company: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">City *</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.city}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, city: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Status</label>
                    <select
                      className="ClientManagement-form-input"
                      value={editDialog.client.status}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, status: e.target.value }
                      })}
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">
                      <FiCalendar className="ClientManagement-icon-inline" /> Subscription Start Date
                    </label>
                    <input
                      type="date"
                      className="ClientManagement-form-input"
                      value={editDialog.client.subscriptionStartDate || ''}
                      onChange={(e) => {
                        setEditDialog({
                          ...editDialog,
                          client: { 
                            ...editDialog.client, 
                            subscriptionStartDate: e.target.value
                          }
                        });
                      }}
                    />
                    <small className="ClientManagement-text-muted">Select start date</small>
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">
                      <FiCalendar className="ClientManagement-icon-inline" /> Subscription End Date
                    </label>
                    <input
                      type="date"
                      className="ClientManagement-form-input"
                      value={editDialog.client.subscriptionEndDate || ''}
                      onChange={(e) => {
                        setEditDialog({
                          ...editDialog,
                          client: { 
                            ...editDialog.client, 
                            subscriptionEndDate: e.target.value
                          }
                        });
                      }}
                      min={editDialog.client.subscriptionStartDate || undefined}
                    />
                    <small className="ClientManagement-text-muted">Must be after start date</small>
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">
                      <FaRupeeSign className="ClientManagement-icon-inline" /> Subscription Price
                    </label>
                    <div className="ClientManagement-currency-input">
                      <span className="ClientManagement-currency-prefix">₹</span>
                      <input
                        type="number"
                        className="ClientManagement-form-input"
                        placeholder="Enter subscription amount"
                        value={editDialog.client.subscriptionPrice || ''}
                        onChange={(e) => {
                          setEditDialog({
                            ...editDialog,
                            client: { 
                              ...editDialog.client, 
                              subscriptionPrice: e.target.value
                            }
                          });
                        }}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <small className="ClientManagement-text-muted">Enter the subscription amount</small>
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-managers-group">
                    <label className="ClientManagement-form-label">Team *</label>
                    <div className="ClientManagement-managers-list">
                      {safeMapProjectManagers((manager) => {
                        const isSelected = editDialog.client.projectManagers?.some(pm => 
                          pm._id === manager._id || pm.id === manager._id || pm.name === manager.name
                        ) || false;
                        
                        return (
                          <div key={manager._id} className="ClientManagement-manager-checkbox-item">
                            <input
                              type="checkbox"
                              id={`edit-manager-${manager._id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setEditDialog({
                                  ...editDialog,
                                  client: {
                                    ...editDialog.client,
                                    projectManagers: isChecked
                                      ? [...(editDialog.client.projectManagers || []), {
                                          _id: manager._id,
                                          name: manager.name,
                                          email: manager.email,
                                          role: manager.role
                                        }]
                                      : (editDialog.client.projectManagers || []).filter(pm => 
                                          pm._id !== manager._id && pm.id !== manager._id && pm.name !== manager.name
                                        )
                                  }
                                });
                              }}
                            />
                            <div className="ClientManagement-manager-checkbox-content">
                              <div className="ClientManagement-avatar ClientManagement-avatar--primary">
                                {manager.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="ClientManagement-font-bold">{manager.name}</p>
                                <small className="ClientManagement-text-muted">{manager.email}</small>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {editDialog.client.projectManagers && editDialog.client.projectManagers.length > 0 && (
                      <div className="ClientManagement-selected-items-preview ClientManagement-mt-2">
                        <small className="ClientManagement-text-muted">Selected Team Members:</small>
                        <div className="ClientManagement-flex ClientManagement-flex-wrap ClientManagement-gap-1 ClientManagement-mt-1">
                          {editDialog.client.projectManagers.map((pm, idx) => (
                            <div key={idx} className="ClientManagement-selected-item ClientManagement-selected-item--primary">
                              <span>{pm.name}</span>
                              <button
                                type="button"
                                className="ClientManagement-selected-item-remove"
                                onClick={() => {
                                  setEditDialog({
                                    ...editDialog,
                                    client: {
                                      ...editDialog.client,
                                      projectManagers: editDialog.client.projectManagers.filter(p => p.name !== pm.name)
                                    }
                                  });
                                }}
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-services-group">
                    <label className="ClientManagement-form-label">Services</label>
                    <div className="ClientManagement-services-list">
                      {services.map((service) => (
                        <div key={service._id} className="ClientManagement-service-checkbox-item">
                          <input
                            type="checkbox"
                            id={`edit-service-${service._id}`}
                            checked={(editDialog.client.services || []).includes(service.servicename)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setEditDialog({
                                ...editDialog,
                                client: {
                                  ...editDialog.client,
                                  services: isChecked
                                    ? [...(editDialog.client.services || []), service.servicename]
                                    : (editDialog.client.services || []).filter(s => s !== service.servicename)
                                }
                              });
                            }}
                          />
                          <label htmlFor={`edit-service-${service._id}`}>{service.servicename}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-progress-group">
                    <label className="ClientManagement-form-label">Progress</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.progress || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, progress: e.target.value }
                      })}
                      placeholder="28/40 (70%)"
                    />
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Email</label>
                    <input
                      type="email"
                      className="ClientManagement-form-input"
                      value={editDialog.client.email || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, email: e.target.value }
                      })}
                    />
                  </div>

                  <div className="ClientManagement-form-group">
                    <label className="ClientManagement-form-label">Phone</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.phone || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, phone: e.target.value }
                      })}
                    />
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-address-group">
                    <label className="ClientManagement-form-label">Address</label>
                    <input
                      type="text"
                      className="ClientManagement-form-input"
                      value={editDialog.client.address || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, address: e.target.value }
                      })}
                    />
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-description-group">
                    <label className="ClientManagement-form-label">Description</label>
                    <textarea
                      className="ClientManagement-form-input"
                      rows="3"
                      value={editDialog.client.description || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, description: e.target.value }
                      })}
                      placeholder="Enter client description..."
                    />
                  </div>

                  <div className="ClientManagement-form-group ClientManagement-edit-notes-group">
                    <label className="ClientManagement-form-label">Notes</label>
                    <textarea
                      className="ClientManagement-form-input"
                      rows="2"
                      value={editDialog.client.notes || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        client: { ...editDialog.client, notes: e.target.value }
                      })}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </div>
              <div className="ClientManagement-modal__footer">
                <button 
                  type="button"
                  className="ClientManagement-btn ClientManagement-btn--outlined" 
                  onClick={() => setEditDialog({ open: false, client: null })}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="ClientManagement-btn ClientManagement-btn--primary"
                  disabled={!editDialog.client?.client || !editDialog.client?.company || !editDialog.client?.city || !editDialog.client?.projectManagers?.length}
                >
                  <FiSave /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {overdueClientsModal && (
        <div className="ClientManagement-modal-overlay" onClick={() => setOverdueClientsModal(false)}>
          <div className="ClientManagement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ClientManagement-modal__header">
              <h3>Overdue Task Clients</h3>
              <button className="ClientManagement-close-btn" onClick={() => setOverdueClientsModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="ClientManagement-modal__content">
              {overdueClients.length > 0 ? (
                <div className="ClientManagement-overdue-client-list">
                  {overdueClients.map((client) => (
                    <div key={client._id} className="ClientManagement-overdue-client-item">
                      <div>
                        <p className="ClientManagement-overdue-client-name">{client.client || 'Unnamed Client'}</p>
                        <small className="ClientManagement-text-muted">{client.company || 'No company assigned'}</small>
                        {client.overdueTaskNames?.length > 0 && (
                          <small className="ClientManagement-text-muted" style={{ display: 'block', marginTop: '4px' }}>
                            Overdue task{client.overdueTaskNames.length > 1 ? 's' : ''}: {client.overdueTaskNames.join(', ')}
                          </small>
                        )}
                      </div>
                      <span className="ClientManagement-overdue-client-count">{client.overdueTasksCount} overdue</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ClientManagement-text-muted">No clients currently have overdue tasks.</p>
              )}
            </div>
            <div className="ClientManagement-modal__footer">
              <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={() => setOverdueClientsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {serviceRequestsModal && (
        <div className="ClientManagement-modal-overlay" onClick={() => setServiceRequestsModal(false)}>
          <div className="ClientManagement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ClientManagement-modal__header">
              <h3>New Service Requests</h3>
              <button className="ClientManagement-close-btn" onClick={() => setServiceRequestsModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="ClientManagement-modal__content">
              {serviceRequests.length > 0 ? (
                <div className="ClientManagement-service-request-list">
                  {serviceRequests.map((request) => (
                    <div key={request._id} className="ClientManagement-service-request-item">
                      <div>
                        <p className="ClientManagement-service-request-name">{request.serviceName}</p>
                        <small className="ClientManagement-text-muted">
                          Requested by {request.clientName || 'Client'}{request.companyName ? ` • ${request.companyName}` : ''}
                        </small>
                        <small className="ClientManagement-text-muted ClientManagement-block ClientManagement-mt-1">
                          {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Date not available'}
                        </small>
                        {request.requirement && (
                          <small className="ClientManagement-text-muted ClientManagement-block ClientManagement-mt-1">
                            Requirement: {request.requirement}
                          </small>
                        )}
                        {(request.budget || request.contactMethod) && (
                          <small className="ClientManagement-text-muted ClientManagement-block ClientManagement-mt-1">
                            {request.budget ? `Budget: ${request.budget}` : ''}{request.budget && request.contactMethod ? ' • ' : ''}{request.contactMethod ? `Contact: ${request.contactMethod}` : ''}
                          </small>
                        )}
                      </div>
                      <div className="ClientManagement-service-request-actions">
                        <span className={`ClientManagement-service-request-status ClientManagement-service-request-status--${String(request.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                          {request.status || 'Pending'}
                        </span>
                        {(request.status || 'Pending') !== 'Approved' && (
                          <button
                            type="button"
                            className="ClientManagement-btn ClientManagement-btn--success ClientManagement-service-request-approve"
                            onClick={() => handleApproveServiceRequest(request._id)}
                            disabled={approvingRequestId === request._id}
                          >
                            <FiCheckCircle /> {approvingRequestId === request._id ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ClientManagement-text-muted">No new service requests found.</p>
              )}
            </div>
            <div className="ClientManagement-modal__footer">
              <button className="ClientManagement-btn ClientManagement-btn--outlined" onClick={() => setServiceRequestsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentReceiptsModal 
        open={paymentReceiptsModal.open}
        onClose={() => setPaymentReceiptsModal({ open: false, client: null })}
        client={paymentReceiptsModal.client}
        onRenewSubscription={fetchData}
        userRole={userRole}
        clientPlans={clientPlans}
      />
    </div>
  );
};

export default ClientManagement;
