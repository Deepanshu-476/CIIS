import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import API_URL from '../../../config';
import CIISLoader from '../../../Loader/CIISLoader';
import { ServiceProgressCard } from './Client.jsx';
import './client-management.css';
import './ClientPlansPage.css';

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

const clientApi = axios.create({
  baseURL: `${API_URL}/clientsservice`,
  timeout: 10000,
});

const tasksApi = axios.create({
  baseURL: `${API_URL}/tasks/client-tasks`,
  timeout: 10000,
});

const usersApi = axios.create({
  baseURL: `${API_URL}/users`,
  timeout: 10000,
});

[clientApi, tasksApi, usersApi].forEach(instance => {
  instance.interceptors.request.use(config => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
});

const fetchAllClientTasks = async clientId => {
  const allTasks = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await tasksApi.get(`/client/${clientId}`, {
      params: { page, limit: 100 },
    });
    const tasksData = response.data?.data;
    const pageTasks = Array.isArray(tasksData) ? tasksData : (tasksData?.tasks || []);
    allTasks.push(...pageTasks);

    const pagination = response.data?.pagination || {};
    hasNext = Boolean(pagination.hasNext) && page < Number(pagination.totalPages || pagination.pages || page);
    page += 1;
  }

  return allTasks;
};

const ClientDetailsPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [client, setClient] = useState(location.state?.client || null);
  const [clientTasks, setClientTasks] = useState(null);
  const [projectManagers, setProjectManagers] = useState([]);
  const [selectedSubIndex, setSelectedSubIndex] = useState('all');
  const [loading, setLoading] = useState(!location.state?.client);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClientDetails = async () => {
      try {
        setLoading(true);
        const [clientRes, tasksRes] = await Promise.all([
          clientApi.get(`/${clientId}`),
          fetchAllClientTasks(clientId).catch(() => []),
        ]);

        if (clientRes.data?.success) {
          setClient(clientRes.data.data);
        } else {
          setError(clientRes.data?.message || 'Client details not found');
        }

        setClientTasks(Array.isArray(tasksRes) ? tasksRes : []);
      } catch (err) {
        console.error('Error loading client details:', err);
        setError(err.response?.data?.message || 'Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) loadClientDetails();
  }, [clientId]);

  useEffect(() => {
    const fetchProjectManagers = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : {};
        const companyRole = (currentUser.companyRole || currentUser.role || currentUser.userRole || '').toLowerCase();
        const apiEndpoint = companyRole === 'employee' ? '/department-users' : '/company-users';
        const response = await usersApi.get(apiEndpoint);
        const usersArray = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.users)
            ? response.data.users
            : Array.isArray(response.data?.message?.users)
              ? response.data.message.users
              : Array.isArray(response.data?.data)
                ? response.data.data
                : [];

        setProjectManagers(usersArray.map(user => ({
          _id: user.id || user._id,
          name: user.name || 'Unknown User',
          email: user.email || '',
          role: user.companyRole || user.jobRole || '',
        })));
      } catch (err) {
        console.error('Error loading project managers:', err);
        setProjectManagers([]);
      }
    };

    fetchProjectManagers();
  }, []);

  const getProjectManagersDetails = selectedClient => {
    if (!selectedClient) return [];
    if (Array.isArray(selectedClient.projectManagers) && selectedClient.projectManagers.length > 0) {
      return selectedClient.projectManagers;
    }
    const managerNames = selectedClient.projectManager || [];
    return managerNames.map(name => projectManagers.find(pm => pm.name === name) || { name, id: name });
  };

  const renderManagerInfo = manager => (
    <div className="ClientManagement-manager-info">
      <div className="ClientManagement-manager-header">
        <div className="ClientManagement-avatar ClientManagement-avatar--primary">
          {manager.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="ClientManagement-manager-details">
          <p className="ClientManagement-text-bold">{manager.name}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <CIISLoader />;
  }

  if (error || !client) {
    return (
      <div className="ClientPlansPage-container">
        <div className="ClientPlansPage-header-row">
          <button className="ClientPlansPage-back-btn" onClick={() => navigate('/ciisUser/emp-client')}>
            <FiArrowLeft size={16} />
            <span>Back to Clients</span>
          </button>
          <div className="ClientPlansPage-title-group">
            <h1>Client Details</h1>
            <p>Unable to load this client</p>
          </div>
        </div>
        <div className="ClientPlansPage-alert ClientPlansPage-alert--error">
          <FiAlertCircle size={16} />
          <span>{error || 'Client details not found'}</span>
        </div>
      </div>
    );
  }

  const managers = getProjectManagersDetails(client);
  const selectedSub = selectedSubIndex !== 'all' ? client.subscription?.[selectedSubIndex] : null;
  const latestSubscription = Array.isArray(client.subscription) && client.subscription.length > 0
    ? client.subscription[client.subscription.length - 1]
    : null;
  const allServiceNames = [
    ...new Set([
      ...(Array.isArray(client.services) ? client.services : []),
      ...(Array.isArray(clientTasks) ? clientTasks.map(task => task.service).filter(Boolean) : []),
    ]),
  ];
  const totalTasks = Array.isArray(clientTasks) ? clientTasks.length : 0;
  const completedTasks = Array.isArray(clientTasks) ? clientTasks.filter(task => task.completed || task.status === 'completed').length : 0;
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);

  return (
    <div className="ClientPlansPage-container ClientDetailsPage-container">
      <div className="ClientDetailsPage-topbar">
        <button className="ClientPlansPage-back-btn" onClick={() => navigate('/ciisUser/emp-client')}>
          <FiArrowLeft size={16} />
          <span>Back to Clients</span>
        </button>
      </div>

      <section className="ClientDetailsPage-hero">
        <div className="ClientDetailsPage-identity">
          <div className="ClientDetailsPage-avatar">
            {(client.client || client.company || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="ClientDetailsPage-title-block">
            <div className="ClientDetailsPage-kicker">Client Details</div>
            <h1>{client.client || 'Client'}</h1>
            <div className="ClientDetailsPage-meta-row">
              {client.company && <span><FiBriefcase />{client.company}</span>}
              {client.city && <span><FiMapPin />{client.city}</span>}
            </div>
          </div>
        </div>
        <div className="ClientDetailsPage-hero-actions">
          <span className={`ClientManagement-status-chip ClientManagement-status-chip--${client.status === 'Active' ? 'active' : client.status === 'On Hold' ? 'on-hold' : 'default'}`}>
            <span className="ClientManagement-status-dot"></span>
            {client.status || 'Unknown'}
          </span>
          {client.companyCode && <span className="ClientManagement-company-code-badge">Code: {client.companyCode}</span>}
        </div>
      </section>

      <section className="ClientDetailsPage-stats">
        <div className="ClientDetailsPage-stat">
          <FiTrendingUp />
          <div>
            <strong>{allServiceNames.length}</strong>
            <span>Services</span>
          </div>
        </div>
        <div className="ClientDetailsPage-stat">
          <FiClock />
          <div>
            <strong>{pendingTasks}</strong>
            <span>Pending Tasks</span>
          </div>
        </div>
        <div className="ClientDetailsPage-stat">
          <FiCheckCircle />
          <div>
            <strong>{completedTasks}</strong>
            <span>Completed Tasks</span>
          </div>
        </div>
        <div className="ClientDetailsPage-stat">
          <FiUsers />
          <div>
            <strong>{managers.length}</strong>
            <span>Managers</span>
          </div>
        </div>
      </section>

      <div className="ClientManagement-client-details-content">
        <div className="ClientDetailsPage-info-row">
          <div className="ClientManagement-client-details-section ClientDetailsPage-basic-card">
            <h4 className="ClientManagement-section-header">
              <FiBriefcase className="ClientManagement-section-icon" />
              Basic Information
            </h4>
            <div className="ClientManagement-details-grid">
              <div className="ClientManagement-detail-item">
                <p className="ClientManagement-detail-label">Client Name</p>
                <p className="ClientManagement-detail-value ClientManagement-client-name-highlight">{client.client}</p>
              </div>
              <div className="ClientManagement-detail-item">
                <p className="ClientManagement-detail-label">Company</p>
                <p className="ClientManagement-detail-value ClientManagement-company-badge">{client.company}</p>
              </div>
              <div className="ClientManagement-detail-item">
                <p className="ClientManagement-detail-label">City</p>
                <p className="ClientManagement-detail-value ClientManagement-location-text">
                  <span className="ClientManagement-location-dot"></span>
                  <span>{client.city}</span>
                </p>
              </div>
              <div className="ClientManagement-detail-item">
                <p className="ClientManagement-detail-label">Status</p>
                <div className={`ClientManagement-status-chip ClientManagement-status-chip--${client.status === 'Active' ? 'active' : client.status === 'On Hold' ? 'on-hold' : 'default'}`}>
                  <span className="ClientManagement-status-dot"></span>
                  {client.status}
                </div>
              </div>
              {(client.companyCode || client.companyIdentifier) && (
                <div className="ClientManagement-detail-item ClientManagement-company-info-item">
                  <p className="ClientManagement-detail-label">Company Info</p>
                  <p className="ClientManagement-detail-value ClientManagement-company-codes">
                    {client.companyCode && <span className="ClientManagement-company-code-badge">Code: {client.companyCode}</span>}
                    {client.companyIdentifier && <span className="ClientManagement-company-id-badge">ID: {client.companyIdentifier}</span>}
                  </p>
                </div>
              )}
              {latestSubscription && (
                <div className="ClientManagement-detail-item ClientManagement-detail-item-full">
                  <p className="ClientManagement-detail-label">Latest Subscription</p>
                  <p className="ClientManagement-detail-value ClientDetailsPage-subscription-summary">
                    <span>{latestSubscription.planName || `Subscription ${latestSubscription.subscriptionNo || ''}`}</span>
                    {latestSubscription.endDate && <span>Expires {new Date(latestSubscription.endDate).toLocaleDateString()}</span>}
                    {latestSubscription.status && <span>{latestSubscription.status}</span>}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="ClientManagement-client-details-section ClientManagement-team-section ClientDetailsPage-team-card">
            <h4 className="ClientManagement-section-header">
              <FiUsers className="ClientManagement-section-icon" />
              Team
            </h4>
            <div className="ClientManagement-team-members-container">
              {managers.length > 0 ? (
                <div className="ClientManagement-managers-grid">
                  {managers.map((manager, idx) => (
                    <div key={`${manager._id || manager.id || manager.name}-${idx}`} className="ClientManagement-manager-card-wrapper">
                      {renderManagerInfo(manager)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ClientManagement-empty-state ClientManagement-enhanced-empty">
                  <p className="ClientManagement-text-muted">No project managers assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {allServiceNames.length > 0 && (
          <div className="ClientManagement-client-details-section ClientManagement-services-section">
            <h4 className="ClientManagement-section-header">
              <FiTrendingUp className="ClientManagement-section-icon" />
              Services & Tasks
            </h4>
            {Array.isArray(client.subscription) && client.subscription.length > 0 && (
              <div className="ClientManagement-form-group ClientDetailsPage-subscription-filter">
                <label className="ClientManagement-form-label">Filter by Subscription Period</label>
                <select
                  className="ClientManagement-form-input"
                  value={selectedSubIndex}
                  onChange={event => setSelectedSubIndex(event.target.value)}
                >
                  <option value="all">Show All Tasks (No Filter)</option>
                  {client.subscription.map((sub, idx) => (
                    <option key={sub._id || idx} value={idx}>
                      Subscription {sub.subscriptionNo || idx + 1}: {sub.planName ? `${sub.planName} - ` : ''}{new Date(sub.startDate).toLocaleDateString()} to {new Date(sub.endDate).toLocaleDateString()} ({sub.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="ClientManagement-services-container">
              {allServiceNames.map((service, index) => {
                const referenceSub = selectedSub || (client.subscription || []).find(sub => sub.status === 'Active') || (client.subscription || [])[client.subscription.length - 1];
                const planServiceNames = (referenceSub?.servicesSnapshot || []).map(item => item.service);
                const isExtraService = planServiceNames.length > 0 && !planServiceNames.includes(service);
                return (
                  <div key={`${service}-${index}`} className="ClientManagement-service-card-wrapper">
                    <div className="ClientManagement-service-card-header">
                      <span className="ClientManagement-service-icon">Service</span>
                      <h5 className="ClientManagement-service-title">{service}</h5>
                      {isExtraService && <span className="ClientManagement-badge ClientManagement-badge--warning">Extra</span>}
                    </div>
                    <div className="ClientManagement-service-card-body">
                      <ServiceProgressCard
                        service={service}
                        clientId={client._id}
                        clientProjectManagers={managers}
                        api={tasksApi}
                        startDate={selectedSub ? selectedSub.startDate : null}
                        endDate={selectedSub ? selectedSub.endDate : null}
                        subscriptionId={selectedSub ? selectedSub._id : null}
                        subscriptionNo={selectedSub ? selectedSub.subscriptionNo : null}
                        initialTasks={Array.isArray(clientTasks) ? clientTasks.filter(task => {
                          if (task.service !== service) return false;
                          if (!selectedSub) return true;
                          if (selectedSub._id && String(task.subscriptionId?._id || task.subscriptionId || '') === String(selectedSub._id)) return true;
                          return selectedSub.subscriptionNo && Number(task.subscriptionNo) === Number(selectedSub.subscriptionNo);
                        }) : null}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="ClientManagement-client-details-section ClientManagement-additional-info-section">
          <h4 className="ClientManagement-section-header">
            <FiMapPin className="ClientManagement-section-icon" />
            Additional Information
          </h4>
          <div className="ClientManagement-details-grid ClientManagement-additional-grid">
            {client.phone && (
              <div className="ClientManagement-detail-item ClientManagement-contact-item">
                <p className="ClientManagement-detail-label"><FiPhone /> Phone</p>
                <p className="ClientManagement-detail-value ClientManagement-contact-value">{client.phone}</p>
              </div>
            )}
            {client.email && (
              <div className="ClientManagement-detail-item ClientManagement-contact-item">
                <p className="ClientManagement-detail-label"><FiMail /> Email</p>
                <p className="ClientManagement-detail-value ClientManagement-contact-value ClientManagement-email-value">{client.email}</p>
              </div>
            )}
            {client.address && (
              <div className="ClientManagement-detail-item ClientManagement-address-item">
                <p className="ClientManagement-detail-label">Address</p>
                <p className="ClientManagement-detail-value ClientManagement-address-text">{client.address}</p>
              </div>
            )}
            {client.description && (
              <div className="ClientManagement-detail-item ClientManagement-detail-item-full ClientManagement-description-item">
                <p className="ClientManagement-detail-label">Description</p>
                <p className="ClientManagement-detail-value ClientManagement-description-text">{client.description}</p>
              </div>
            )}
            {client.notes && (
              <div className="ClientManagement-detail-item ClientManagement-detail-item-full ClientManagement-notes-item">
                <p className="ClientManagement-detail-label">Notes</p>
                <p className="ClientManagement-detail-value ClientManagement-notes-text">{client.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsPage;
