import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import API_URL from '../../../config';
import { useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiLayers,
  FiCheckCircle,
  FiPauseCircle,
  FiGrid,
  FiPlus,
  FiX,
  FiSearch,
  FiSettings,
  FiRotateCcw,
  FiSave,
  FiEdit2,
  FiMoreVertical,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiUser,
  FiSliders,
  FiInfo,
  FiMonitor,
  FiBarChart2,
  FiArrowLeft
} from 'react-icons/fi';
import {
  FaCrown,
  FaGem,
  FaBuilding,
  FaPaperPlane,
  FaRocket,
  FaBullhorn,
  FaHeadset,
  FaMobileAlt
} from 'react-icons/fa';
import './ClientPlansPage.css';

const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

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

const PLAN_THEMES = [
  { bg: '#e0f2fe', color: '#0284c7', icon: <FaPaperPlane /> },
  { bg: '#f3e8ff', color: '#9333ea', icon: <FaGem /> },
  { bg: '#fef3c7', color: '#d97706', icon: <FaCrown /> },
  { bg: '#dcfce7', color: '#16a34a', icon: <FaBuilding /> },
  { bg: '#fce7f3', color: '#db2777', icon: <FiSliders /> },
  { bg: '#cffafe', color: '#0891b2', icon: <FaRocket /> },
];

const getPlanTheme = (index, name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('basic')) return PLAN_THEMES[0];
  if (lower.includes('standard')) return PLAN_THEMES[1];
  if (lower.includes('premium')) return PLAN_THEMES[2];
  if (lower.includes('enterprise')) return PLAN_THEMES[3];
  if (lower.includes('custom')) return PLAN_THEMES[4];
  if (lower.includes('start')) return PLAN_THEMES[5];
  return PLAN_THEMES[index % PLAN_THEMES.length];
};

const getServiceIcon = (serviceName = '') => {
  const lower = serviceName.toLowerCase();
  if (lower.includes('web') || lower.includes('site')) {
    return { icon: <FiMonitor />, bg: '#e0f2fe', color: '#0284c7' };
  }
  if (lower.includes('market') || lower.includes('digital')) {
    return { icon: <FaBullhorn />, bg: '#dcfce7', color: '#16a34a' };
  }
  if (lower.includes('seo') || lower.includes('rank') || lower.includes('traffic')) {
    return { icon: <FiBarChart2 />, bg: '#ffedd5', color: '#ea580c' };
  }
  if (lower.includes('app') || lower.includes('mobile') || lower.includes('android') || lower.includes('ios')) {
    return { icon: <FaMobileAlt />, bg: '#f3e8ff', color: '#9333ea' };
  }
  if (lower.includes('support') || lower.includes('it') || lower.includes('tech')) {
    return { icon: <FaHeadset />, bg: '#fee2e2', color: '#dc2626' };
  }
  return { icon: <FiGrid />, bg: '#f1f5f9', color: '#475569' };
};

const ClientPlansPage = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyCode, setCompanyCode] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    price: '',
    months: 1,
    description: '',
    services: [],
    isActive: true,
  });

  const [editingPlanId, setEditingPlanId] = useState(null);
  const [servicesSearch, setServicesSearch] = useState('');
  const [expandedServices, setExpandedServices] = useState({});
  const [taskDrafts, setTaskDrafts] = useState({});

  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [openDropdownPlanId, setOpenDropdownPlanId] = useState(null);
  const [viewingPlanModal, setViewingPlanModal] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownPlanId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
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

        const [servicesRes, plansRes, clientsRes] = await Promise.all([
          clientsServiceApi
            .get('/services', {
              params: { companyCode: companyCodeFromStorage },
            })
            .catch((err) => {
              console.warn('Services fetch failed:', err);
              return { data: { success: false, data: [] } };
            }),
          clientPlansApi
            .get('/', {
              params: { companyCode: companyCodeFromStorage, includeInactive: 'true' },
            })
            .catch((err) => {
              console.warn('Client plans fetch failed:', err);
              return { data: { success: false, data: [] } };
            }),
          clientsServiceApi
            .get(`/company/${companyCodeFromStorage}`)
            .catch(() =>
              clientsServiceApi.get('/').catch((err) => {
                console.warn('Clients fetch failed:', err);
                return { data: { success: false, data: [] } };
              })
            ),
        ]);

        if (servicesRes.data?.success) {
          setServices(servicesRes.data.data || []);
        }
        if (plansRes.data?.success) {
          setPlans(plansRes.data.data || plansRes.data.plans || []);
        }
        if (clientsRes.data?.success) {
          setClients(clientsRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load page data:', err);
        setError('Failed to load page data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter available services by company and search query
  const availableServices = useMemo(() => {
    let list = services;
    if (companyCode) {
      const filteredByCompany = services.filter(
        (s) =>
          !s.companyCode ||
          s.companyCode.toLowerCase() === companyCode.toLowerCase()
      );
      if (filteredByCompany.length > 0) {
        list = filteredByCompany;
      }
    }

    if (!servicesSearch.trim()) {
      return list;
    }

    const query = servicesSearch.toLowerCase();
    return list.filter((s) => {
      const sName =
        s.servicename || s.serviceName || s.name || s.service || '';
      return sName.toLowerCase().includes(query);
    });
  }, [services, companyCode, servicesSearch]);

  // Map clients to plan
  const getClientsForPlan = (plan) => {
    if (!clients.length) return [];
    return clients.filter((c) => {
      if (c.clientPlanId === plan._id) return true;
      if (Array.isArray(c.subscription)) {
        return c.subscription.some(
          (s) => s.clientPlanId === plan._id || s.planName === plan.name
        );
      }
      return false;
    });
  };

  // Toggle service selection in plan
  const toggleServiceInPlan = (serviceName) => {
    if (!serviceName) return;
    setForm((prev) => {
      const exists = prev.services.some((item) => item.service === serviceName);
      if (exists) {
        return {
          ...prev,
          services: prev.services.filter((item) => item.service !== serviceName),
        };
      } else {
        return {
          ...prev,
          services: [...prev.services, { service: serviceName, tasks: [] }],
        };
      }
    });
  };

  // Toggle expanded accordion for adding tasks to a service
  const toggleExpandService = (serviceName) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  // Update task draft state for a specific service
  const updateTaskDraft = (serviceName, key, value) => {
    const maxDueDays = Number(form.months || 1) * 30;
    setTaskDrafts((prev) => ({
      ...prev,
      [serviceName]: {
        name: '',
        description: '',
        priority: 'Medium',
        dueInDays: maxDueDays,
        ...(prev[serviceName] || {}),
        [key]: value,
      },
    }));
  };

  // Add task to a selected service
  const addTaskToService = (serviceName) => {
    const maxDueDays = Number(form.months || 1) * 30;
    const rawDraft = taskDrafts[serviceName] || {};
    const draft = {
      name: '',
      description: '',
      priority: 'Medium',
      dueInDays: maxDueDays,
      ...rawDraft,
    };

    const name = draft.name?.trim() || '';
    if (!name) return;

    const dueDays = Number(draft.dueInDays || 0);
    if (dueDays > maxDueDays) {
      setError(`Task due days cannot exceed plan duration (${maxDueDays} days).`);
      return;
    }

    setError('');

    setForm((prev) => {
      const exists = prev.services.some((s) => s.service === serviceName);
      const updatedServices = exists
        ? prev.services.map((item) =>
            item.service === serviceName
              ? {
                  ...item,
                  tasks: [
                    ...item.tasks,
                    {
                      name,
                      description: (draft.description || name).trim(),
                      priority: draft.priority || 'Medium',
                      dueInDays: dueDays,
                    },
                  ],
                }
              : item
          )
        : [
            ...prev.services,
            {
              service: serviceName,
              tasks: [
                {
                  name,
                  description: (draft.description || name).trim(),
                  priority: draft.priority || 'Medium',
                  dueInDays: dueDays,
                },
              ],
            },
          ];

      return { ...prev, services: updatedServices };
    });

    setTaskDrafts((prev) => ({
      ...prev,
      [serviceName]: {
        name: '',
        description: '',
        priority: 'Medium',
        dueInDays: maxDueDays,
      },
    }));
  };

  // Remove a task from a service
  const removeTask = (serviceName, taskIndex) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((item) =>
        item.service === serviceName
          ? { ...item, tasks: item.tasks.filter((_, idx) => idx !== taskIndex) }
          : item
      ),
    }));
  };

  // Reset form
  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      months: 1,
      description: '',
      services: [],
      isActive: true,
    });
    setEditingPlanId(null);
    setTaskDrafts({});
    setExpandedServices({});
    setError('');
  };

  // Trigger edit mode
  const handleEditPlan = (plan) => {
    setEditingPlanId(plan._id);
    setForm({
      name: plan.name || '',
      price: plan.price || '',
      months: plan.months || 1,
      description: plan.description || '',
      services: plan.services || [],
      isActive: plan.isActive !== false,
    });
    setTaskDrafts({});
    setOpenDropdownPlanId(null);

    const expanded = {};
    (plan.services || []).forEach((s) => {
      expanded[s.service] = true;
    });
    setExpandedServices(expanded);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Duplicate a plan
  const handleDuplicatePlan = (plan) => {
    setEditingPlanId(null);
    setForm({
      name: `${plan.name} (Copy)`,
      price: plan.price || '',
      months: plan.months || 1,
      description: plan.description || '',
      services: JSON.parse(JSON.stringify(plan.services || [])),
      isActive: true,
    });
    setOpenDropdownPlanId(null);
    setSuccess('Plan duplicated into form! Update details and save.');
    setTimeout(() => setSuccess(''), 3500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (plan) => {
    const newStatus = !plan.isActive;
    try {
      const response = await clientPlansApi.put(`/${plan._id}`, {
        ...plan,
        companyCode,
        isActive: newStatus,
      });

      if (response.data?.success) {
        const updated = response.data.data || response.data.plan;
        setPlans((prev) => prev.map((p) => (p._id === plan._id ? updated : p)));
        setSuccess(`Plan marked as ${newStatus ? 'Active' : 'Inactive'}!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setError('Failed to update plan status.');
    } finally {
      setOpenDropdownPlanId(null);
    }
  };

  // Save or update plan
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
      months: Number(form.months || 1),
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
          setPlans((prev) => prev.map((p) => (p._id === editingPlanId ? savedPlan : p)));
        } else {
          setPlans((prev) => [savedPlan, ...prev]);
        }

        resetForm();
        setTimeout(() => setSuccess(''), 3500);
      }
    } catch (err) {
      console.error('Save client plan error:', err);
      setError(err.response?.data?.message || 'Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Filter and paginate table plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (statusFilter === 'active' && plan.isActive === false) return false;
      if (statusFilter === 'inactive' && plan.isActive !== false) return false;

      if (!tableSearch.trim()) return true;
      const q = tableSearch.toLowerCase();

      const nameMatch = plan.name?.toLowerCase().includes(q);
      const descMatch = plan.description?.toLowerCase().includes(q);
      const serviceMatch = plan.services?.some((s) =>
        s.service?.toLowerCase().includes(q)
      );

      const planClients = getClientsForPlan(plan);
      const clientMatch = planClients.some(
        (c) =>
          c.company?.toLowerCase().includes(q) ||
          c.client?.toLowerCase().includes(q) ||
          c.clientUniqueId?.toLowerCase().includes(q)
      );

      return nameMatch || descMatch || serviceMatch || clientMatch;
    });
  }, [plans, statusFilter, tableSearch, clients]);

  const totalPages = Math.ceil(filteredPlans.length / pageSize) || 1;
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, currentPage]);

  const totalPlansCount = plans.length;
  const activePlansCount = plans.filter((p) => p.isActive !== false).length;
  const inactivePlansCount = plans.filter((p) => p.isActive === false).length;
  const totalServicesCount = availableServices.length;

  if (loading) {
    return (
      <div className="cp-loading-container">
        <div className="cp-spinner"></div>
        <p>Loading Client Plans & Services...</p>
      </div>
    );
  }

  return (
    <div className="cp-wrapper">
      {/* Back Button */}
      <button className="cp-back-btn" onClick={() => navigate('/ciisUser/emp-client')}>
        <FiArrowLeft />
        <span>Back to Client Management</span>
      </button>

      {/* 1. Hero Header Banner */}
      <div className="cp-hero-banner">
        <div className="cp-hero-content">
          <div className="cp-hero-icon-box">
            <FiBriefcase />
          </div>
          <div className="cp-hero-text">
            <h1>Client Plans</h1>
            <p className="cp-hero-subtitle">
              Create and manage client subscription plans with services and default tasks
            </p>
            <span className="cp-hero-quote">
              "Organize your services. Deliver more value to your clients."
            </span>
          </div>
        </div>

        {/* 3D Graphic in Banner Center */}
        <div className="cp-hero-illustration">
          <div className="cp-3d-doc">
            <div className="cp-3d-sheet cp-3d-sheet-1"></div>
            <div className="cp-3d-sheet cp-3d-sheet-2">
              <div className="cp-3d-line" style={{ width: '80%' }}></div>
              <div className="cp-3d-line" style={{ width: '60%' }}></div>
              <div className="cp-3d-line" style={{ width: '70%' }}></div>
              <div className="cp-3d-line" style={{ width: '45%' }}></div>
            </div>
            <div className="cp-3d-crown-badge">
              <FaCrown />
            </div>
          </div>
        </div>

        {/* Feature Badges Right */}
        <div className="cp-hero-features">
          <div className="cp-feature-item">
            <span className="cp-feature-check">✓</span>
            <span>Flexible Plans</span>
          </div>
          <div className="cp-feature-item">
            <span className="cp-feature-check">✓</span>
            <span>Service-wise Default Tasks</span>
          </div>
          <div className="cp-feature-item">
            <span className="cp-feature-check">✓</span>
            <span>Better Client Management</span>
          </div>
        </div>
      </div>

      {/* 2. Metric Stat Cards Row */}
      <div className="cp-stats-grid">
        <div className="cp-stat-card">
          <div className="cp-stat-icon-wrap cp-stat-icon--blue">
            <FiLayers />
          </div>
          <div className="cp-stat-info">
            <span className="cp-stat-label">Total Plans</span>
            <span className="cp-stat-value">{totalPlansCount}</span>
            <span className="cp-stat-subtext">All plans (active + inactive)</span>
          </div>
        </div>

        <div className="cp-stat-card">
          <div className="cp-stat-icon-wrap cp-stat-icon--green">
            <FiCheckCircle />
          </div>
          <div className="cp-stat-info">
            <span className="cp-stat-label">Active Plans</span>
            <span className="cp-stat-value">{activePlansCount}</span>
            <span className="cp-stat-subtext">Currently active</span>
          </div>
        </div>

        <div className="cp-stat-card">
          <div className="cp-stat-icon-wrap cp-stat-icon--amber">
            <FiPauseCircle />
          </div>
          <div className="cp-stat-info">
            <span className="cp-stat-label">Inactive Plans</span>
            <span className="cp-stat-value">{inactivePlansCount}</span>
            <span className="cp-stat-subtext">Disabled plans</span>
          </div>
        </div>

        <div className="cp-stat-card">
          <div className="cp-stat-icon-wrap cp-stat-icon--purple">
            <FiGrid />
          </div>
          <div className="cp-stat-info">
            <span className="cp-stat-label">Total Services</span>
            <span className="cp-stat-value">{totalServicesCount}</span>
            <span className="cp-stat-subtext">Available services</span>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="cp-alert cp-alert--error">
          <div className="cp-alert-content">
            <FiInfo size={16} />
            <span>{error}</span>
          </div>
          <button className="cp-alert-close" onClick={() => setError('')}>
            <FiX size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="cp-alert cp-alert--success">
          <div className="cp-alert-content">
            <FiCheckCircle size={16} />
            <span>{success}</span>
          </div>
          <button className="cp-alert-close" onClick={() => setSuccess('')}>
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* 3. Main 2-Column Section */}
      <div className="cp-main-layout">
        {/* Left Column: Create / Edit Client Plan */}
        <div className="cp-card cp-form-card">
          <div className="cp-card-top">
            <div className="cp-card-title-group">
              <div className="cp-card-header-icon">
                {editingPlanId ? <FiEdit2 /> : <FiPlus />}
              </div>
              <div>
                <h2>{editingPlanId ? 'Edit Client Plan' : 'Create / Edit Client Plan'}</h2>
                <p>Add plan details, select services and define default tasks</p>
              </div>
            </div>
            <button type="button" className="cp-cancel-btn" onClick={resetForm}>
              <FiX size={13} />
              <span>Cancel</span>
            </button>
          </div>

          <form onSubmit={handleSubmitPlan}>
            <div className="cp-form-row-4">
              <div className="cp-form-group">
                <label className="cp-label">
                  Plan Name <span className="cp-required">*</span>
                </label>
                <input
                  type="text"
                  className="cp-input"
                  placeholder="Enter plan name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="cp-form-group">
                <label className="cp-label">
                  Price (₹) <span className="cp-required">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="cp-input"
                  placeholder="Enter price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>

              <div className="cp-form-group">
                <label className="cp-label">
                  Plan Duration (Months) <span className="cp-required">*</span>
                </label>
                <div className="cp-stepper-wrap">
                  <input
                    type="number"
                    min="1"
                    className="cp-input"
                    value={form.months}
                    onChange={(e) =>
                      setForm({ ...form, months: Math.max(1, Number(e.target.value) || 1) })
                    }
                    required
                  />
                  <div className="cp-stepper-controls">
                    <button
                      type="button"
                      className="cp-stepper-btn"
                      onClick={() => setForm({ ...form, months: Number(form.months || 1) + 1 })}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="cp-stepper-btn"
                      onClick={() =>
                        setForm({
                          ...form,
                          months: Math.max(1, Number(form.months || 1) - 1),
                        })
                      }
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <div className="cp-form-group">
                <label className="cp-label">Status</label>
                <div className="cp-toggle-container">
                  <label className="cp-switch">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <span className="cp-slider"></span>
                  </label>
                  <span className="cp-toggle-label">
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="cp-form-group">
              <label className="cp-label">Description</label>
              <textarea
                className="cp-textarea"
                rows={3}
                placeholder="Enter plan description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Select Services Section */}
            <div className="cp-services-section">
              <div className="cp-services-header">
                <div className="cp-services-title-wrap">
                  <div className="cp-services-gear-icon">
                    <FiSettings />
                  </div>
                  <div>
                    <h3>Select Services</h3>
                    <p>Choose services to include in this plan and add tasks for each service</p>
                  </div>
                </div>
                <div className="cp-services-search-wrap">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={servicesSearch}
                    onChange={(e) => setServicesSearch(e.target.value)}
                  />
                </div>
              </div>

              {availableServices.length === 0 ? (
                <div className="cp-empty-state" style={{ padding: '1.5rem' }}>
                  <p>No services found. Add services from Client Management first.</p>
                </div>
              ) : (
                <div className="cp-services-list">
                  {availableServices.map((service) => {
                    const sName =
                      service.servicename ||
                      service.serviceName ||
                      service.name ||
                      service.service ||
                      'Service';
                    const isSelected = form.services.some(
                      (s) => s.service === sName
                    );
                    const selectedServiceObj = form.services.find(
                      (s) => s.service === sName
                    );
                    const taskCount = selectedServiceObj?.tasks?.length || 0;
                    const isExpanded = !!expandedServices[sName];
                    const iconInfo = getServiceIcon(sName);
                    const maxDueDays = Number(form.months || 1) * 30;
                    const draft = taskDrafts[sName] || {
                      name: '',
                      dueInDays: maxDueDays,
                      priority: 'Medium',
                      description: '',
                    };

                    return (
                      <div
                        key={service._id || sName}
                        className={`cp-service-item ${isSelected ? 'selected' : ''}`}
                        style={{ flexShrink: 0, minHeight: '40px' }}
                      >
                        <div
                          className="cp-service-row"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: '40px',
                            width: '100%',
                          }}
                        >
                          <div
                            className="cp-service-left"
                            onClick={() => toggleServiceInPlan(sName)}
                          >
                            <input
                              type="checkbox"
                              className="cp-checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleServiceInPlan(sName);
                              }}
                            />
                            <div
                              className="cp-service-icon"
                              style={{
                                backgroundColor: iconInfo.bg,
                                color: iconInfo.color,
                              }}
                            >
                              {iconInfo.icon}
                            </div>
                            <span className="cp-service-name" title={sName}>
                              {sName}
                            </span>
                          </div>

                          <div className="cp-service-right">
                            <button
                              type="button"
                              className="cp-add-tasks-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelected) toggleServiceInPlan(sName);
                                toggleExpandService(sName);
                              }}
                            >
                              <FiPlus size={11} />
                              <span>Add Tasks</span>
                              {taskCount > 0 && (
                                <span className="cp-tasks-count-pill">
                                  {taskCount}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              className="cp-accordion-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandService(sName);
                              }}
                            >
                              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Task Builder for Service */}
                        {isExpanded && (
                          <div className="cp-tasks-expanded-box">
                            <div className="cp-task-inputs">
                              <input
                                type="text"
                                className="cp-input"
                                placeholder="Default task title (e.g. Collect Docs)"
                                value={draft.name}
                                onChange={(e) =>
                                  updateTaskDraft(sName, 'name', e.target.value)
                                }
                              />
                              <div className="cp-task-row-inputs">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxDueDays}
                                  className="cp-input"
                                  placeholder="Due in (days)"
                                  value={draft.dueInDays}
                                  onChange={(e) =>
                                    updateTaskDraft(
                                      sName,
                                      'dueInDays',
                                      e.target.value
                                    )
                                  }
                                  style={{ width: '110px' }}
                                />
                                <select
                                  className="cp-input"
                                  value={draft.priority}
                                  onChange={(e) =>
                                    updateTaskDraft(
                                      sName,
                                      'priority',
                                      e.target.value
                                    )
                                  }
                                  style={{ width: '110px' }}
                                >
                                  <option value="Low">Low Priority</option>
                                  <option value="Medium">Medium Priority</option>
                                  <option value="High">High Priority</option>
                                </select>
                                <button
                                  type="button"
                                  className="cp-task-add-confirm-btn"
                                  onClick={() => addTaskToService(sName)}
                                >
                                  <FiPlus size={12} /> Add
                                </button>
                              </div>
                              <input
                                type="text"
                                className="cp-input"
                                placeholder="Task description (optional)"
                                value={draft.description}
                                onChange={(e) =>
                                  updateTaskDraft(
                                    sName,
                                    'description',
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            {/* Added Task Pills */}
                            {selectedServiceObj?.tasks?.length > 0 && (
                              <div className="cp-task-pills-list">
                                {selectedServiceObj.tasks.map((task, idx) => (
                                  <div
                                    key={idx}
                                    className="cp-task-pill"
                                    title={task.description || task.name}
                                  >
                                    <strong>{task.name}</strong>
                                    <span
                                      className={`cp-task-pill-badge cp-priority--${(
                                        task.priority || 'medium'
                                      ).toLowerCase()}`}
                                    >
                                      {task.priority}
                                    </span>
                                    <span>{task.dueInDays || 0}d</span>
                                    <button
                                      type="button"
                                      className="cp-task-del-btn"
                                      onClick={() => removeTask(sName, idx)}
                                    >
                                      <FiX size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="cp-form-actions">
              <button type="button" className="cp-reset-btn" onClick={resetForm}>
                <FiRotateCcw />
                <span>Reset</span>
              </button>
              <button type="submit" className="cp-save-btn" disabled={saving}>
                <FiSave />
                <span>{saving ? 'Saving...' : editingPlanId ? 'Update Plan' : 'Save Plan'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Existing Client Plans Table */}
        <div className="cp-card cp-table-card">
          <div className="cp-card-top">
            <div className="cp-card-title-group">
              <div className="cp-card-header-icon">
                <FiLayers />
              </div>
              <div>
                <h2>Existing Client Plans</h2>
                <p>View and manage all client plans with their services and default tasks</p>
              </div>
            </div>

            <div className="cp-table-top-actions">
              <div className="cp-table-search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search plans or clients..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <select
                className="cp-table-filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="cp-empty-state">
              <FiBriefcase />
              <h4>No Plans Found</h4>
              <p>No client plans match your current search or filter criteria.</p>
            </div>
          ) : (
            <div className="cp-table-responsive">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Plan Details</th>
                    <th>Client Name</th>
                    <th>Price & Duration</th>
                    <th>Services & Default Tasks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlans.map((plan, index) => {
                    const theme = getPlanTheme(index, plan.name);
                    const planClients = getClientsForPlan(plan);
                    const primaryClient = planClients[0];
                    const planServices = plan.services || [];
                    const isDropdownOpen = openDropdownPlanId === plan._id;

                    return (
                      <tr
                        key={plan._id}
                        className={!plan.isActive ? 'inactive-row' : ''}
                      >
                        {/* 1. Plan Details */}
                        <td>
                          <div className="cp-plan-col-details">
                            <div
                              className="cp-plan-badge-icon"
                              style={{ backgroundColor: theme.bg, color: theme.color }}
                            >
                              {theme.icon}
                            </div>
                            <div>
                              <div className="cp-plan-name-text">{plan.name}</div>
                              <p className="cp-plan-desc-text">
                                {plan.description || 'Essential services for small businesses'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Client Name */}
                        <td>
                          <div className="cp-client-col">
                            {primaryClient ? (
                              <>
                                <div className="cp-client-company-name">
                                  {primaryClient.company || primaryClient.client || 'Client'}
                                </div>
                                <div className="cp-client-person">
                                  <FiUser size={12} />
                                  <span>{primaryClient.client || 'Contact Person'}</span>
                                </div>
                                <div className="cp-client-id-badge">
                                  <span>
                                    🪪 {primaryClient.clientUniqueId || primaryClient.clientId || primaryClient._id.slice(-6).toUpperCase()}
                                  </span>
                                  {planClients.length > 1 && (
                                    <span style={{ color: '#2563eb', fontWeight: 600 }}>
                                      +{planClients.length - 1} more
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>-</span>
                            )}
                          </div>
                        </td>

                        {/* 3. Price & Duration */}
                        <td>
                          <div className="cp-price-col">
                            <div className="cp-price-val">
                              ₹{Number(plan.price || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="cp-duration-val">
                              <FiCalendar size={12} />
                              <span>
                                {plan.months} {plan.months === 1 ? 'Month' : 'Months'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Services & Default Tasks */}
                        <td>
                          <div className="cp-services-col">
                            <div
                              className="cp-services-pill-badge"
                              onClick={() => setViewingPlanModal(plan)}
                            >
                              <FiLayers size={12} />
                              <span>
                                {planServices.length}{' '}
                                {planServices.length === 1 ? 'Service' : 'Services'}
                              </span>
                              <FiChevronDown size={11} />
                            </div>

                            <ul className="cp-services-bullet-list">
                              {planServices.slice(0, 3).map((item, sIdx) => {
                                const tasksCount = item.tasks?.length || 0;
                                return (
                                  <li key={sIdx}>
                                    <span className="cp-bullet-dot"></span>
                                    <span>
                                      {item.service}{' '}
                                      <span style={{ color: '#64748b' }}>
                                        ({tasksCount} {tasksCount === 1 ? 'task' : 'tasks'})
                                      </span>
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>

                            {planServices.length > 3 && (
                              <span
                                className="cp-more-services-tag"
                                onClick={() => setViewingPlanModal(plan)}
                              >
                                +{planServices.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Status */}
                        <td>
                          <span
                            className={`cp-status-pill ${
                              plan.isActive !== false ? 'active' : 'inactive'
                            }`}
                          >
                            <span className="cp-status-dot"></span>
                            <span>{plan.isActive !== false ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>

                        {/* 6. Actions */}
                        <td>
                          <div className="cp-actions-col">
                            <button
                              type="button"
                              className="cp-edit-action-btn"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <FiEdit2 size={12} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="cp-more-action-btn"
                              onClick={() =>
                                setOpenDropdownPlanId(isDropdownOpen ? null : plan._id)
                              }
                            >
                              <FiMoreVertical />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                              <div className="cp-dropdown-menu" ref={dropdownRef}>
                                <button
                                  type="button"
                                  className="cp-dropdown-item"
                                  onClick={() => handleToggleStatus(plan)}
                                >
                                  {plan.isActive !== false ? (
                                    <>
                                      <FiPauseCircle size={13} color="#ea580c" />
                                      <span>Mark as Inactive</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiCheckCircle size={13} color="#16a34a" />
                                      <span>Mark as Active</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="cp-dropdown-item"
                                  onClick={() => handleDuplicatePlan(plan)}
                                >
                                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>⎘</span>
                                  <span>Duplicate Plan</span>
                                </button>
                                <button
                                  type="button"
                                  className="cp-dropdown-item"
                                  onClick={() => {
                                    setViewingPlanModal(plan);
                                    setOpenDropdownPlanId(null);
                                  }}
                                >
                                  <span style={{ color: '#64748b' }}>👁</span>
                                  <span>View Details</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with Pagination */}
          {filteredPlans.length > 0 && (
            <div className="cp-table-footer">
              <span className="cp-pagination-info">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredPlans.length)} of{' '}
                {filteredPlans.length} plans
              </span>

              <div className="cp-pagination-btns">
                <button
                  type="button"
                  className="cp-page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <FiChevronLeft />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`cp-page-btn ${currentPage === num ? 'active' : ''}`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  className="cp-page-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Plan Details Modal */}
      {viewingPlanModal && (
        <div className="cp-modal-backdrop" onClick={() => setViewingPlanModal(null)}>
          <div className="cp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <div>
                <h3>{viewingPlanModal.name}</h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  ₹{Number(viewingPlanModal.price || 0).toLocaleString('en-IN')} ·{' '}
                  {viewingPlanModal.months}{' '}
                  {viewingPlanModal.months === 1 ? 'Month' : 'Months'} ·{' '}
                  {viewingPlanModal.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button
                type="button"
                className="cp-modal-close-btn"
                onClick={() => setViewingPlanModal(null)}
              >
                <FiX />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
              {viewingPlanModal.description || 'No description provided.'}
            </p>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
              Services & Setup Tasks Checklist ({viewingPlanModal.services?.length || 0})
            </h4>

            {(!viewingPlanModal.services || viewingPlanModal.services.length === 0) ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No services in this plan.</p>
            ) : (
              viewingPlanModal.services.map((item, idx) => (
                <div key={idx} className="cp-modal-service-card">
                  <div className="cp-modal-service-title">
                    <span>{item.service}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#2563eb',
                        fontWeight: 600,
                      }}
                    >
                      {item.tasks?.length || 0} tasks
                    </span>
                  </div>

                  {item.tasks?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {item.tasks.map((task, tIdx) => (
                        <div
                          key={tIdx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            background: '#ffffff',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>
                              {task.name}
                            </span>
                            {task.description && task.description !== task.name && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {task.description}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span
                              className={`cp-task-pill-badge cp-priority--${(
                                task.priority || 'medium'
                              ).toLowerCase()}`}
                            >
                              {task.priority}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {task.dueInDays || 0} days
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      No tasks defined for this service
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPlansPage;

