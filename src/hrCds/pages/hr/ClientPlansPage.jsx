import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../../../config';
import { useNavigate } from 'react-router-dom';
import { 
  FiX, FiBriefcase, FiPlus, FiTrash2, FiInfo, 
  FiArrowLeft, FiEdit3, 
  FiCheckCircle
} from 'react-icons/fi';
import './client-management.css';
import './ClientPlansPage.css';

// Helper to get token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

// Centralized Axios Instances
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

const clientsServiceApi = axios.create({
  baseURL: `${API_URL}/clientsservice`,
  timeout: 10000,
});

clientsServiceApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const ClientPlansPage = () => {
  const navigate = useNavigate();
  
  // Page Data States
  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyCode, setCompanyCode] = useState('');
  
  // Feedback Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    price: '',
    months: 1,
    description: '',
    services: [],
    isActive: true
  });
  
  // Editing State
  const [editingPlanId, setEditingPlanId] = useState(null);
  
  // Task Drafts for each service
  const [taskDrafts, setTaskDrafts] = useState({});

  // 1. Fetch Auth and Init Data
  useEffect(() => {
    const loadCompanyAndData = async () => {
      try {
        const superAdminRaw = localStorage.getItem('superAdmin');
        const userRaw = localStorage.getItem('user');
        
        let localStorageCompany = '';
        if (superAdminRaw) {
          const parsed = JSON.parse(superAdminRaw);
          localStorageCompany = parsed?.companyCode || parsed?.company || '';
        } else if (userRaw) {
          const parsed = JSON.parse(userRaw);
          localStorageCompany = parsed?.companyCode || parsed?.company || '';
        }

        const companyCodeFromStorage = localStorage.getItem('companyCode') || localStorageCompany;
        setCompanyCode(companyCodeFromStorage);

        if (!companyCodeFromStorage) {
          setError('Company Code is missing. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch Services and Client Plans
        const [servicesRes, plansRes] = await Promise.all([
          clientsServiceApi.get('/services', { 
            params: { companyCode: companyCodeFromStorage } 
          }),
          clientPlansApi.get('/', {
            params: { companyCode: companyCodeFromStorage, includeInactive: true }
          }).catch(err => {
            console.warn('Client plans fetch failed:', err);
            return { data: { success: false, data: [] } };
          })
        ]);

        if (servicesRes.data?.success) {
          setServices(servicesRes.data.data || []);
        }
        if (plansRes.data?.success) {
          setPlans(plansRes.data.data || plansRes.data.plans || []);
        }

      } catch (err) {
        console.error('Failed to load page data:', err);
        setError('Failed to load page data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadCompanyAndData();
  }, []);

  // Filter Services for company
  const availableServices = companyCode
    ? services.filter(service => service.companyCode === companyCode)
    : services;

  // Toggle Service in draft plan
  const toggleServiceInPlan = serviceName => {
    if (!serviceName) return;
    setForm(prev => ({
      ...prev,
      services: prev.services.some(item => item.service === serviceName)
        ? prev.services.filter(item => item.service !== serviceName)
        : [...prev.services, { service: serviceName, tasks: [] }]
    }));
  };

  // Update Task draft for a service
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

  // Add task to service in plan
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

  // Remove task from service in plan
  const removeTask = (serviceName, taskIndex) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.map(item => item.service === serviceName
        ? { ...item, tasks: item.tasks.filter((_, idx) => idx !== taskIndex) }
        : item)
    }));
  };

  // Reset Plan Form
  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      months: 1,
      description: '',
      services: [],
      isActive: true
    });
    setEditingPlanId(null);
    setTaskDrafts({});
    setError('');
  };

  // Load plan for editing
  const handleEditPlan = (plan) => {
    setEditingPlanId(plan._id);
    setForm({
      name: plan.name || '',
      price: plan.price || '',
      months: plan.months || 1,
      description: plan.description || '',
      services: plan.services || [],
      isActive: plan.isActive !== false
    });
    setTaskDrafts({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Plan (Create/Update)
  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!form.services?.length) {
      setError('Select at least one service for the plan');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const planPayload = {
      ...form,
      companyCode,
      price: Number(form.price || 0),
      months: Number(form.months || 1)
    };

    try {
      let response;
      if (editingPlanId) {
        response = await clientPlansApi.put(`/${editingPlanId}`, planPayload);
      } else {
        response = await clientPlansApi.post('/', planPayload);
      }

      if (response.data?.success) {
        const savedPlan = response.data.data || response.data.plan;
        setSuccess(editingPlanId ? 'Plan updated successfully!' : 'Plan created successfully!');
        
        if (editingPlanId) {
          setPlans(prev => prev.map(p => p._id === editingPlanId ? savedPlan : p));
        } else {
          setPlans(prev => [savedPlan, ...prev]);
        }
        
        resetForm();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Save client plan error:', err);
      setError(err.response?.data?.message || 'Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ClientPlansPage-loading-container">
        <div className="ClientPlansPage-spinner"></div>
        <p>Loading Client Plans...</p>
      </div>
    );
  }

  return (
    <div className="ClientPlansPage-container">
      {/* Header bar */}
      <div className="ClientPlansPage-header-row">
        <button 
          className="ClientPlansPage-back-btn" 
          onClick={() => navigate('/ciisUser/emp-client')}
        >
          <FiArrowLeft size={16} />
          <span>Back to Clients</span>
        </button>
        <div className="ClientPlansPage-title-group">
          <h1>Client Service Plans</h1>
          <p>Configure pricing plans, services, and default setup tasks for your clients</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="ClientPlansPage-alert ClientPlansPage-alert--error">
          <FiInfo size={16} />
          <span>{error}</span>
          <button className="ClientPlansPage-alert-close" onClick={() => setError('')}><FiX size={14} /></button>
        </div>
      )}
      {success && (
        <div className="ClientPlansPage-alert ClientPlansPage-alert--success">
          <FiCheckCircle size={16} />
          <span>{success}</span>
          <button className="ClientPlansPage-alert-close" onClick={() => setSuccess('')}><FiX size={14} /></button>
        </div>
      )}

      {/* Grid Content */}
      <div className="ClientPlansPage-grid">
        
        {/* Form Column */}
        <div className="ClientPlansPage-card ClientPlansPage-form-card">
          <div className="ClientPlansPage-card-header">
            <h3>{editingPlanId ? '✏️ Edit Client Plan' : '🔄 Create Client Plan'}</h3>
            {editingPlanId && (
              <button className="ClientPlansPage-cancel-edit-btn" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmitPlan}>
            <div className="ClientPlansPage-form-grid">
              <div className="ClientManagement-form-group">
                <label className="ClientManagement-form-label">Plan Name *</label>
                <input 
                  className="ClientManagement-form-input" 
                  value={form.name} 
                  onChange={e => setForm(prev => ({...prev, name: e.target.value}))} 
                  required 
                  placeholder="e.g. Gold GST Filing Plan"
                />
              </div>
              <div className="ClientPlansPage-form-row">
                <div className="ClientManagement-form-group" style={{ flex: 1 }}>
                  <label className="ClientManagement-form-label">Price (₹)</label>
                  <input 
                    className="ClientManagement-form-input" 
                    type="number" 
                    min="0" 
                    value={form.price} 
                    onChange={e => setForm(prev => ({...prev, price: e.target.value}))}
                    placeholder="e.g. 5000"
                  />
                </div>
                <div className="ClientManagement-form-group" style={{ flex: 1 }}>
                  <label className="ClientManagement-form-label">Duration (Months)</label>
                  <input 
                    className="ClientManagement-form-input" 
                    type="number" 
                    min="1" 
                    value={form.months} 
                    onChange={e => setForm(prev => ({...prev, months: e.target.value}))}
                  />
                </div>
              </div>
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Description</label>
              <textarea 
                className="ClientManagement-form-input" 
                value={form.description} 
                onChange={e => setForm(prev => ({...prev, description: e.target.value}))}
                placeholder="Briefly describe what this plan includes..."
                rows={2}
              />
            </div>

            {/* Service checklist */}
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Select Services Included in Plan *</label>
              {availableServices.length === 0 ? (
                <div className="ClientManagement-alert ClientManagement-alert--info">
                  <FiInfo /> No services available. Please add services first on the Client Management page.
                </div>
              ) : (
                <div className="ClientPlansPage-services-check-grid">
                  {availableServices.map(service => {
                    const checked = form.services.some(item => item.service === service.servicename);
                    return (
                      <div key={service._id} className="ClientPlansPage-check-item">
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

            {/* Task list editor for selected services */}
            {form.services.length > 0 && (
              <div className="ClientPlansPage-tasks-editor-section">
                <h4>📝 Add Setup Tasks to Selected Services</h4>
                <p className="ClientPlansPage-section-subtitle">These tasks will automatically generate for clients subscribed to this plan.</p>
                
                <div className="ClientPlansPage-services-tasks-list">
                  {form.services.map((service) => {
                    const draft = taskDrafts[service.service] || { name: '', description: '', priority: 'Medium', dueInDays: 0 };
                    return (
                      <div className="ClientPlansPage-service-task-card" key={service.service}>
                        <div className="ClientPlansPage-service-task-header">
                          <h5>{service.service}</h5>
                          <span className="ClientPlansPage-badge">{service.tasks.length} Default Tasks</span>
                        </div>
                        
                        {/* Add task builder */}
                        <div className="ClientPlansPage-task-builder">
                          <input
                            className="ClientManagement-form-input"
                            placeholder="Default task title (e.g. Collect Docs)"
                            value={draft.name}
                            onChange={e => updateTaskDraft(service.service, 'name', e.target.value)}
                          />
                          <div className="ClientPlansPage-task-builder-row">
                            <input
                              className="ClientManagement-form-input"
                              type="number"
                              min="0"
                              placeholder="Due in (days)"
                              value={draft.dueInDays || ''}
                              onChange={e => updateTaskDraft(service.service, 'dueInDays', e.target.value)}
                              style={{ width: '120px' }}
                            />
                            <select
                              className="ClientManagement-form-input"
                              value={draft.priority}
                              onChange={e => updateTaskDraft(service.service, 'priority', e.target.value)}
                              style={{ width: '120px' }}
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                            <button 
                              type="button" 
                              className="ClientPlansPage-add-task-btn" 
                              onClick={() => addTaskToService(service.service)}
                            >
                              <FiPlus /> Add
                            </button>
                          </div>
                          <textarea
                            className="ClientManagement-form-input"
                            placeholder="Task description (optional)"
                            value={draft.description}
                            onChange={e => updateTaskDraft(service.service, 'description', e.target.value)}
                            rows={1}
                            style={{ marginTop: '0.4rem' }}
                          />
                        </div>

                        {/* List of added tasks */}
                        {service.tasks.length > 0 && (
                          <div className="ClientPlansPage-added-tasks">
                            {service.tasks.map((task, taskIndex) => (
                              <div className="ClientPlansPage-task-pill" key={`${task.name}-${taskIndex}`}>
                                <div className="ClientPlansPage-task-pill-info">
                                  <strong>{task.name}</strong>
                                  <span>{task.priority} · {task.dueInDays || 0} days</span>
                                </div>
                                <button 
                                  type="button" 
                                  className="ClientPlansPage-task-delete-btn" 
                                  onClick={() => removeTask(service.service, taskIndex)}
                                >
                                  <FiX size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="ClientPlansPage-form-actions">
              <button 
                type="button" 
                className="ClientPlansPage-btn-outlined" 
                onClick={resetForm}
              >
                Reset Form
              </button>
              <button 
                type="submit" 
                className="ClientPlansPage-btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : editingPlanId ? 'Update Plan' : 'Save Plan'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Plans Column */}
        <div className="ClientPlansPage-card ClientPlansPage-list-card">
          <div className="ClientPlansPage-card-header">
            <h3>📋 Existing Client Plans ({plans.length})</h3>
          </div>
          
          {plans.length === 0 ? (
            <div className="ClientPlansPage-empty-state">
              <FiBriefcase size={48} />
              <h4>No Plans Created Yet</h4>
              <p>Create subscription pricing plans to bundle services and setup checklists for your clients.</p>
            </div>
          ) : (
            <div className="ClientPlansPage-plans-stack">
              {plans.map(plan => {
                const planServices = plan.services || [];
                const totalTasks = planServices.reduce((sum, item) => sum + (item.tasks?.length || 0), 0);
                
                return (
                  <div key={plan._id} className={`ClientPlansPage-plan-card-item ${!plan.isActive ? 'inactive' : ''}`}>
                    <div className="ClientPlansPage-plan-card-head">
                      <div>
                        <h4>{plan.name}</h4>
                        <p>{plan.description || 'No description provided'}</p>
                      </div>
                      <div className="ClientPlansPage-plan-badge-group">
                        <span className="ClientPlansPage-price-badge">
                          ₹{Number(plan.price || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="ClientPlansPage-duration-badge">
                          {plan.months} {plan.months === 1 ? 'Month' : 'Months'}
                        </span>
                      </div>
                    </div>

                    {/* Services and Tasks list in plan */}
                    {planServices.length > 0 && (
                      <div className="ClientPlansPage-plan-services-preview">
                        <h5>Services & Default Tasks:</h5>
                        <div className="ClientPlansPage-plan-services-grid">
                          {planServices.map((serviceItem, serviceIndex) => {
                            const serviceTasks = serviceItem.tasks || [];
                            return (
                              <div key={`${plan._id}-${serviceItem.service}-${serviceIndex}`} className="ClientPlansPage-plan-service-preview-item">
                                <div className="ClientPlansPage-plan-service-tag">
                                  <strong>{serviceItem.service}</strong>
                                  <span>{serviceTasks.length} {serviceTasks.length === 1 ? 'task' : 'tasks'}</span>
                                </div>
                                {serviceTasks.length > 0 && (
                                  <div className="ClientPlansPage-plan-tasks-tags">
                                    {serviceTasks.map((t, tIdx) => (
                                      <span key={tIdx} className="ClientPlansPage-plan-task-tag-pill">
                                        {t.name} ({t.priority[0]})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="ClientPlansPage-plan-card-actions">
                      <div className="ClientPlansPage-status-toggle">
                        <span className={`status-dot ${plan.isActive ? 'active' : 'inactive'}`} />
                        <span>{plan.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <button 
                        className="ClientPlansPage-plan-action-btn"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <FiEdit3 size={14} />
                        <span>Edit Plan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ClientPlansPage;
