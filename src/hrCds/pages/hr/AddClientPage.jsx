import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../../../config';
import './client-management.css';
import {
  FiX,
  FiAlertCircle,
  FiChevronDown,
  FiCalendar,
  FiInfo,
  FiArrowLeft,
  FiPlus
} from 'react-icons/fi';

const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
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

const AddClientPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialClient = location.state?.initialClient || null;

  const [companyCode, setCompanyCode] = useState('');
  const [services, setServices] = useState([]);
  const [clientPlans, setClientPlans] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [newClient, setNewClient] = useState({
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

  const [managerSearch, setManagerSearch] = useState('');
  const [teamOpen, setTeamOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [dateError, setDateError] = useState('');

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

        // Fetch services, plans, and users
        const [servicesRes, plansRes] = await Promise.all([
          api.get('/services', { 
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
          setClientPlans(plansRes.data.data || plansRes.data.plans || []);
        }

        // Fetch team members
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

        const usersResponse = await usersApi.get(apiEndpoint, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        let usersArray = [];
        if (usersResponse.data) {
          if (Array.isArray(usersResponse.data)) {
            usersArray = usersResponse.data;
          } else if (Array.isArray(usersResponse.data.users)) {
            usersArray = usersResponse.data.users;
          } else if (usersResponse.data.message && Array.isArray(usersResponse.data.message.users)) {
            usersArray = usersResponse.data.message.users;
          } else if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
            usersArray = usersResponse.data.data;
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

        // Prepopulate parent client info if initialClient is passed
        if (initialClient) {
          const parentManagerNames = Array.isArray(initialClient.projectManager) ? initialClient.projectManager : [];
          const parentManagerIds = formattedManagers
            .filter(manager => parentManagerNames.includes(manager.name))
            .map(manager => manager._id);

          setNewClient(prev => ({
            ...prev,
            client: initialClient.client || initialClient.parentClientName || '',
            parentClientId: initialClient.parentClientId || initialClient._id || '',
            parentClientName: initialClient.parentClientName || initialClient.client || '',
            city: initialClient.city || '',
            projectManagers: parentManagerIds,
            status: initialClient.status || 'Active',
            email: initialClient.email || '',
            phone: initialClient.phone || '',
            address: initialClient.address || '',
            description: initialClient.description || '',
            notes: initialClient.notes || ''
          }));
        }

      } catch (err) {
        console.error('Failed to load page data:', err);
        setError('Failed to load page data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadCompanyAndData();
  }, [initialClient]);

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
    setSaving(true);

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
      setSaving(false);
      return;
    }

    try {
      const selectedManagerIds = newClient.projectManagers;
      const selectedManagers = projectManagers.filter(pm => selectedManagerIds.includes(pm._id));
      const managerNames = selectedManagers.map(pm => pm.name);

      const backendClientData = {
        client: newClient.client,
        parentClientId: newClient.parentClientId,
        parentClientName: newClient.parentClientName || newClient.client,
        company: newClient.company,
        city: newClient.city,
        projectManager: managerNames,
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

      const response = await api.post('/', backendClientData);
      
      if (response.data.success) {
        toast.success('Client added successfully!');
        navigate('/ciisUser/emp-client');
      } else {
        const responseData = response.data || {};
        const errorMessage = responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0
          ? responseData.errors.join(', ')
          : (responseData.message || 'Client add failed');
        setFormError(errorMessage);
      }
    } catch (error) {
      console.error("Error adding client:", error);
      const responseData = error.response?.data || {};
      const message = responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0
        ? responseData.errors.join(', ')
        : (responseData.message || error.message || 'Client add failed');
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const filteredManagers = Array.isArray(projectManagers) 
    ? projectManagers.filter(manager =>
        manager.name?.toLowerCase().includes(managerSearch.toLowerCase()) ||
        manager.email?.toLowerCase().includes(managerSearch.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="ClientManagement-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="ClientManagement-text-muted">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="ClientManagement-container" style={{ padding: '2rem' }}>
      <div className="ClientPlansPage-header-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="ClientPlansPage-back-btn" onClick={() => navigate('/ciisUser/emp-client')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '1rem', color: '#666' }}>
          <FiArrowLeft size={20} style={{ marginRight: '0.5rem' }} /> Back to Clients
        </button>
        <h2 style={{ margin: 0 }}>{initialClient ? 'Add New Company' : 'Add New Client / Company'}</h2>
      </div>

      <div className="ClientPlansPage-card" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '2rem' }}>
        {formError && (
          <div className="ClientManagement-alert ClientManagement-alert--error ClientManagement-mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
            <FiAlertCircle /> {formError}
          </div>
        )}

        {dateError && (
          <div className="ClientManagement-alert ClientManagement-alert--error ClientManagement-mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
            <FiAlertCircle /> {dateError}
          </div>
        )}

        {!companyCode && (
          <div className="ClientManagement-alert ClientManagement-alert--warning ClientManagement-mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef3c7', color: '#92400e', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
            <FiAlertCircle /> Company code not found. Client may not save properly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="ClientManagement-dropdown-container">
          <div className="ClientManagement-grid-2 ClientManagement-gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
              />
              {fieldErrors.city && <small className="ClientManagement-text-danger">{fieldErrors.city}</small>}
            </div>
            
            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Status *</label>
              <select
                className="ClientManagement-form-input"
                value={newClient.status}
                onChange={(e) => setNewClient(prev => ({...prev, status: e.target.value}))}
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
              />
              <small className="ClientManagement-text-muted">Select start date</small>
              {fieldErrors.subscriptionStartDate && (
                <small className="ClientManagement-text-danger">{fieldErrors.subscriptionStartDate}</small>
              )}
              {fieldErrors.subscriptionDates && (
                <small className="ClientManagement-text-danger">{fieldErrors.subscriptionDates}</small>
              )}
            </div>

            <div className="ClientManagement-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ClientManagement-form-label">Team *</label>
              <div className="ClientManagement-dropdown-wrapper" style={{ position: 'relative' }}>
                <div
                  className="ClientManagement-dropdown-box"
                  onClick={() => setTeamOpen(!teamOpen)}
                  style={{ cursor: 'pointer', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
                  <div className="ClientManagement-dropdown-content" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '250px', overflowY: 'auto' }}>
                    <div className="ClientManagement-dropdown-search" style={{ marginBottom: '0.5rem' }}>
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
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}
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
                              disabled={saving}
                            />
                            <div className="ClientManagement-dropdown-item-content" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="ClientManagement-avatar ClientManagement-avatar--primary" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#448af8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {manager.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <span className="ClientManagement-font-medium" style={{ fontSize: '0.9rem' }}>{manager.name || 'No Name'}</span>
                                <div className="ClientManagement-dropdown-item-details" style={{ fontSize: '0.8rem', color: '#666' }}>
                                  <span>{manager.email || 'No email'}</span>
                                </div>
                              </div>
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="ClientManagement-dropdown-empty" style={{ padding: '0.5rem', textAlign: 'center', color: '#666' }}>
                          <p>No users found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {newClient.projectManagers.length > 0 && (
                <div className="ClientManagement-selected-items-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {newClient.projectManagers.map(managerId => {
                    const manager = projectManagers.find(pm => pm._id === managerId);
                    if (!manager) return null;
                    return (
                      <div key={managerId} className="ClientManagement-selected-item" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {fieldErrors.projectManagers && <small className="ClientManagement-text-danger">{fieldErrors.projectManagers}</small>}
            </div>

            <div className="ClientManagement-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ClientManagement-form-label">Services</label>
              {filteredServices.length === 0 && (
                <div className="ClientManagement-alert ClientManagement-alert--info ClientManagement-mb-2" style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiInfo /> No services available for this company. Please add services first.
                </div>
              )}
              <div className="ClientManagement-dropdown-wrapper" style={{ position: 'relative' }}>
                <div 
                  className="ClientManagement-dropdown-box"
                  onClick={() => setServicesOpen(!servicesOpen)}
                  style={{ cursor: 'pointer', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
                  <div className="ClientManagement-dropdown-content" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '250px', overflowY: 'auto' }}>
                    <div className="ClientManagement-dropdown-list">
                      {filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                          <label
                            key={service._id}
                            className="ClientManagement-dropdown-item"
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}
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
                              disabled={saving || filteredServices.length === 0}
                            />
                            <label htmlFor={`service-${service._id}`} className="ClientManagement-dropdown-item-content">
                              <span style={{ fontSize: '0.9rem' }}>{service.servicename}</span>
                            </label>
                          </label>
                        ))
                      ) : (
                        <div className="ClientManagement-dropdown-empty" style={{ padding: '0.5rem', textAlign: 'center', color: '#666' }}>
                          No services available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {newClient.services.length > 0 && (
                <div className="ClientManagement-selected-items-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {newClient.services.map((serviceName, index) => (
                    <div key={index} className="ClientManagement-selected-item ClientManagement-selected-item--info" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                      <span>{serviceName}</span>
                      {isExtraSelectedService(serviceName) && (
                        <span className="ClientManagement-badge ClientManagement-badge--warning" style={{ background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Extra</span>
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
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#0369a1' }}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {fieldErrors.services && <small className="ClientManagement-text-danger">{fieldErrors.services}</small>}
            </div>

            <div className="ClientManagement-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ClientManagement-form-label">Description</label>
              <textarea
                className="ClientManagement-form-input"
                rows="3"
                value={newClient.description}
                onChange={(e) => setNewClient(prev => ({...prev, description: e.target.value}))}
                placeholder="Enter client description..."
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Company Logo URL</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.companyLogo}
                onChange={(e) => setNewClient(prev => ({...prev, companyLogo: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Industry</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.industry}
                onChange={(e) => setNewClient(prev => ({...prev, industry: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">GST</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.gst}
                onChange={(e) => setNewClient(prev => ({...prev, gst: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">PAN</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.pan}
                onChange={(e) => setNewClient(prev => ({...prev, pan: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Website</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.website}
                onChange={(e) => setNewClient(prev => ({...prev, website: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">State</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.state}
                onChange={(e) => setNewClient(prev => ({...prev, state: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Country</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.country}
                onChange={(e) => setNewClient(prev => ({...prev, country: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group">
              <label className="ClientManagement-form-label">Pincode</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.pincode}
                onChange={(e) => setNewClient(prev => ({...prev, pincode: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ClientManagement-form-label">Address</label>
              <input
                type="text"
                className="ClientManagement-form-input"
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({...prev, address: e.target.value}))}
                disabled={saving}
              />
            </div>

            <div className="ClientManagement-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ClientManagement-form-label">Notes</label>
              <textarea
                className="ClientManagement-form-input"
                rows="2"
                value={newClient.notes}
                onChange={(e) => setNewClient(prev => ({...prev, notes: e.target.value}))}
                placeholder="Additional notes..."
                disabled={saving}
              />
            </div>
          </div>

          <div className="ClientManagement-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', padding: '1rem 0 0 0', borderTop: '1px solid #eee' }}>
            <button type="button" className="ClientManagement-btn ClientManagement-btn--outlined" onClick={() => navigate('/ciisUser/emp-client')} disabled={saving}>
              Cancel
            </button>
            <button 
              type="submit"
              className="ClientManagement-btn ClientManagement-btn--primary"
              disabled={
                saving || 
                !newClient.client || 
                !newClient.company || 
                !newClient.city || 
                newClient.projectManagers.length === 0 ||
                filteredServices.length === 0 ||
                !companyCode ||
                !!dateError
              }
            >
              {saving ? 'Adding Client...' : 
               !companyCode ? 'Company Code Missing' :
               filteredServices.length === 0 ? 'Add Services First' : initialClient ? 'Add Company' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientPage;
