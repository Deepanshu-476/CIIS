import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFileText,
  FiFolder,
  FiMoreVertical,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import API_URL from '../../config';
import {
  calculateTaskStats,
  getClientDisplayName,
  getClientServices,
  getTaskStatus,
  getTaskTitle,
} from '../utils/clientPortalData';
import './ActiveClientsOverview.css';

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

const clientsApi = axios.create({
  baseURL: `${API_URL}/clientsservice`,
  timeout: 15000,
});

const clientTasksApi = axios.create({
  baseURL: `${API_URL}/tasks/client-tasks`,
  timeout: 15000,
});

const clientDocumentsApi = axios.create({
  baseURL: `${API_URL}/client-documents`,
  timeout: 20000,
});

[clientsApi, clientTasksApi, clientDocumentsApi].forEach(instance => {
  instance.interceptors.request.use(config => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
});

const formatDate = value => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const parseStoredJson = key => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getCompanyContext = user => {
  const companyDetails = parseStoredJson('companyDetails') || {};
  const rawCompany = localStorage.getItem('company') || '';
  const parsedCompany = parseStoredJson('company') || {};
  const userCompany = typeof user?.company === 'object' ? user.company : {};

  const companyCode = String(
    localStorage.getItem('companyCode') ||
    companyDetails.companyCode ||
    companyDetails.code ||
    parsedCompany.companyCode ||
    parsedCompany.code ||
    user?.companyCode ||
    userCompany.companyCode ||
    userCompany.code ||
    (rawCompany && !rawCompany.trim().startsWith('{') ? rawCompany : '')
  ).trim();

  return {
    companyCode,
    companyIdentifier:
      localStorage.getItem('companyIdentifier') ||
      companyDetails._id ||
      companyDetails.id ||
      parsedCompany._id ||
      parsedCompany.id ||
      user?.companyIdentifier ||
      userCompany._id ||
      userCompany.id ||
      '',
  };
};

const getTasksFromResponse = response => {
  const data = response.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  return [];
};

const getStatsFromResponse = response => response.data?.data?.stats || null;

const formatBytes = bytes => {
  const size = Number(bytes || 0);
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatUploadedDocument = doc => ({
  ...doc,
  name: doc.name || doc.originalName || 'Document',
  type: doc.type || 'Uploaded Document',
  category: doc.category || 'General',
  date: formatDate(doc.updatedAt || doc.createdAt),
  by: doc.uploadedBy || 'User',
  size: formatBytes(doc.size),
  icon: 'uploaded',
  isUploaded: true,
});

const getInitials = value => {
  const name = String(value || '').trim();
  if (!name) return 'CL';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getStatusClass = value => String(value || 'pending').toLowerCase().replace(/\s+/g, '-');

const getTaskDueDate = task => task.dueDate || task.deadline || task.endDate || task.createdAt;

const getNameFromValue = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name || value.fullName || value.email || value.username || '';
};

const getAssignedName = task => {
  const assignedUsers = Array.isArray(task.assignedUsers)
    ? task.assignedUsers.map(getNameFromValue).filter(Boolean)
    : [];

  return (
    task.assignedToName ||
    task.assigneeName ||
    task.assignedUserName ||
    task.employeeName ||
    getNameFromValue(task.assignedTo) ||
    getNameFromValue(task.assignee) ||
    getNameFromValue(task.assigneeId) ||
    assignedUsers.join(', ') ||
    'Not assigned'
  );
};

const getDocumentKind = doc => {
  const source = `${doc.name || ''} ${doc.type || ''}`.toLowerCase();
  if (source.includes('pdf')) return 'PDF';
  if (source.includes('sheet') || source.includes('excel') || source.includes('xls')) return 'XLSX';
  if (source.includes('word') || source.includes('doc')) return 'DOCX';
  if (source.includes('zip')) return 'ZIP';
  return 'FILE';
};

const getTaskFilterLabel = filter => ({
  all: 'All Tasks',
  completed: 'Completed Tasks',
  'in-progress': 'In Progress Tasks',
  overdue: 'Overdue Tasks',
}[filter] || 'All Tasks');

const taskMatchesFilter = (task, filter) => {
  if (filter === 'all') return true;
  const status = getStatusClass(getTaskStatus(task));
  if (filter === 'completed') return status === 'completed';
  if (filter === 'in-progress') return status === 'in-progress';
  if (filter === 'overdue') return status === 'overdue';
  return true;
};

const normalizeTaskStats = (tasks, apiStats = null) => {
  const calculated = calculateTaskStats(tasks);
  if (!apiStats) return calculated;

  const totalTasks = Number(apiStats.totalTasks ?? calculated.totalTasks);
  const completedTasks = Number(apiStats.completedTasks ?? calculated.completedTasks);
  const overdueTasks = Number(apiStats.overdueTasks ?? calculated.overdueTasks);
  const pendingTasks = Number(apiStats.pendingTasks ?? calculated.pendingTasks);

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    pendingTasks,
    inProgressTasks: Number(apiStats.inProgressTasks ?? calculated.inProgressTasks),
    completionRate: Number(apiStats.completionRate ?? (totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0)),
  };
};

const ActiveClientsOverview = () => {
  const [clients, setClients] = useState([]);
  const [clientTaskMap, setClientTaskMap] = useState({});
  const [clientStatsMap, setClientStatsMap] = useState({});
  const [clientDocumentMap, setClientDocumentMap] = useState({});
  const [selectedClientId, setSelectedClientId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [apiInfo, setApiInfo] = useState({ totalItems: 0, companyCode: '' });
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskFilter, setTaskFilter] = useState('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deletingDocument, setDeletingDocument] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isClientUser = String(user?.companyRole || user?.role || '').toLowerCase() === 'client';

  const activeClients = useMemo(() => (
    clients.filter(client => String(client.status || 'Active').toLowerCase() === 'active')
  ), [clients]);

  const enrichedClients = useMemo(() => (
    activeClients.map(client => {
      const tasks = clientTaskMap[client._id] || [];
      const stats = normalizeTaskStats(tasks, clientStatsMap[client._id]);
      const uploadedDocuments = (clientDocumentMap[client._id] || []).map(formatUploadedDocument);
      const documents = uploadedDocuments;
      const services = getClientServices(client);
      return { client, tasks, stats, documents, uploadedDocuments, services };
    })
  ), [activeClients, clientTaskMap, clientStatsMap, clientDocumentMap]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enrichedClients;

    return enrichedClients.filter(({ client, services }) => {
      const haystack = [
        getClientDisplayName(client),
        client.company,
        client.companyCode,
        ...services,
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }, [enrichedClients, search]);

  const selectedClient = useMemo(() => (
    enrichedClients.find(item => item.client._id === selectedClientId) || filteredClients[0] || null
  ), [enrichedClients, filteredClients, selectedClientId]);

  const totals = useMemo(() => (
    enrichedClients.reduce((acc, item) => ({
      totalTasks: acc.totalTasks + item.stats.totalTasks,
      completedTasks: acc.completedTasks + item.stats.completedTasks,
      pendingTasks: acc.pendingTasks + item.stats.pendingTasks,
      overdueTasks: acc.overdueTasks + item.stats.overdueTasks,
      documents: acc.documents + item.documents.length,
    }), {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      documents: 0,
    })
  ), [enrichedClients]);

  const selectedStats = selectedClient?.stats || {};
  const selectedTasks = selectedClient?.tasks || [];
  const selectedDocuments = selectedClient?.documents || [];
  const selectedName = selectedClient ? getClientDisplayName(selectedClient.client) : '';
  const selectedInitials = getInitials(selectedName);
  const selectedServices = selectedClient?.services || [];
  const filteredSelectedTasks = useMemo(() => (
    selectedTasks.filter(task => taskMatchesFilter(task, taskFilter))
  ), [selectedTasks, taskFilter]);

  const applyTaskFilter = filter => {
    setTaskFilter(filter);
    setActiveTab('tasks');
  };

  const openTaskModal = (filter = taskFilter) => {
    applyTaskFilter(filter);
    setShowTasksModal(true);
  };

  const openDocumentsModal = () => {
    setActiveTab('documents');
    setShowDocumentsModal(true);
  };

  const handleSummaryCardKeyDown = (event, filter) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      applyTaskFilter(filter);
    }
  };

  const fetchActiveClients = async companyCode => {
    const firstResponse = await clientsApi.get('/', {
      params: {
        companyCode,
        status: 'Active',
        limit: 500,
        page: 1,
        sortBy: 'client',
        sortOrder: 'asc',
      },
    });

    const firstPageClients = firstResponse.data?.data || [];
    const pagination = firstResponse.data?.pagination || {};
    const totalPages = Number(pagination.totalPages || 1);

    if (totalPages <= 1) {
      return {
        clients: firstPageClients,
        pagination,
      };
    }

    const remainingResponses = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => clientsApi.get('/', {
        params: {
          companyCode,
          status: 'Active',
          limit: 500,
          page: index + 2,
          sortBy: 'client',
          sortOrder: 'asc',
        },
      }))
    );

    return {
      clients: [
        ...firstPageClients,
        ...remainingResponses.flatMap(response => response.data?.data || []),
      ],
      pagination,
    };
  };

  const fetchClientTasks = async client => {
    try {
      const response = await clientTasksApi.get(`/client/${client._id}`);
      return {
        tasks: getTasksFromResponse(response).map(task => ({
          ...task,
          serviceName: task.serviceName || task.service,
        })),
        stats: getStatsFromResponse(response),
      };
    } catch (err) {
      console.error(`Failed to load tasks for ${getClientDisplayName(client)}`, err);
      return { tasks: [], stats: null };
    }
  };

  const fetchClientDocuments = async client => {
    try {
      const response = await clientDocumentsApi.get('/', {
        params: { clientId: client._id },
      });
      return response.data?.data || [];
    } catch (err) {
      console.error(`Failed to load documents for ${getClientDisplayName(client)}`, err);
      return [];
    }
  };

  const handleUploadDocument = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedClient?.client?._id) return;

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('clientId', selectedClient.client._id);
      formData.append('category', 'Company Upload');
      formData.append('document', file);

      const response = await clientDocumentsApi.post('/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded = response.data?.data;
      if (uploaded) {
        setClientDocumentMap(prev => ({
          ...prev,
          [selectedClient.client._id]: [uploaded, ...(prev[selectedClient.client._id] || [])],
        }));
      }
    } catch (err) {
      console.error('Document upload failed', err);
      setError(err.response?.data?.message || 'Document upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async doc => {
    if (!doc?._id) return;

    try {
      const response = await clientDocumentsApi.get(`/${doc._id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name || doc.originalName || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Document download failed', err);
      setError(err.response?.data?.message || 'Document download failed');
    }
  };

  const handleOpenDocument = async doc => {
    if (!doc?._id) return;

    try {
      setError('');
      const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
      const response = await clientDocumentsApi.get(`/${doc._id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: doc.type || response.data?.type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);

      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Document open failed', err);
      setError(err.response?.data?.message || 'Document open failed');
    }
  };

  const requestDeleteDocument = doc => {
    if (!doc?.canDelete) {
      setError('Only the uploader can delete this document');
      return;
    }
    setDeleteCandidate(doc);
  };

  const handleConfirmDeleteDocument = async () => {
    if (!deleteCandidate?._id || !selectedClient?.client?._id) return;

    try {
      setDeletingDocument(true);
      setError('');
      await clientDocumentsApi.delete(`/${deleteCandidate._id}`);
      setClientDocumentMap(prev => ({
        ...prev,
        [selectedClient.client._id]: (prev[selectedClient.client._id] || []).filter(doc => doc._id !== deleteCandidate._id),
      }));
      setDeleteCandidate(null);
    } catch (err) {
      console.error('Document delete failed', err);
      setError(err.response?.data?.message || 'Document delete failed');
    } finally {
      setDeletingDocument(false);
    }
  };

  const loadData = async () => {
    if (isClientUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { companyCode } = getCompanyContext(user);

      if (!companyCode) {
        setClients([]);
        setClientTaskMap({});
        setClientStatsMap({});
        setApiInfo({ totalItems: 0, companyCode: '' });
        setError('Company code not found. Please login again.');
        return;
      }

      const { clients: loadedClients, pagination } = await fetchActiveClients(companyCode);
      const active = loadedClients.filter(client => String(client.status || 'Active').toLowerCase() === 'active');
      const taskResults = await Promise.all(active.map(async client => [client._id, await fetchClientTasks(client)]));
      const documentResults = await Promise.all(active.map(async client => [client._id, await fetchClientDocuments(client)]));

      setClients(loadedClients);
      setClientTaskMap(Object.fromEntries(taskResults.map(([clientId, result]) => [clientId, result.tasks])));
      setClientStatsMap(Object.fromEntries(
        taskResults
          .filter(([, result]) => result.stats)
          .map(([clientId, result]) => [clientId, result.stats])
      ));
      setClientDocumentMap(Object.fromEntries(documentResults));
      setApiInfo({ totalItems: pagination.totalItems || active.length, companyCode });
      setSelectedClientId(current => current || active[0]?._id || '');
    } catch (err) {
      console.error('Failed to load active clients overview', err);
      setError(err.response?.data?.message || 'Failed to load active clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isClientUser) {
    return (
      <section className="ActiveClientsOverview-page">
        <div className="ActiveClientsOverview-empty">
          <FiAlertCircle />
          <h2>Employee access only</h2>
          <p>This client work overview is available for company users, not client portal users.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ActiveClientsOverview-page">
      {error && (
        <div className="ActiveClientsOverview-alert">
          <FiAlertCircle /> {error}
        </div>
      )}

      {loading ? (
        <div className="ActiveClientsOverview-loading">Loading active clients...</div>
      ) : (
        <div className="ActiveClientsOverview-layout">
          <aside className="ActiveClientsOverview-clientList">
            <div className="ActiveClientsOverview-listTitle">
              <span><FiUsers /></span>
              <strong>Active Clients ({apiInfo.totalItems || activeClients.length})</strong>
            </div>

            {filteredClients.length === 0 ? (
              <div className="ActiveClientsOverview-empty ActiveClientsOverview-listEmpty">
                <FiBriefcase />
                <h2>No active clients found</h2>
                <p>Active clients will appear here once they are added in client management.</p>
              </div>
            ) : filteredClients.map(({ client }) => {
              const name = getClientDisplayName(client);
              return (
                <button
                  key={client._id}
                  type="button"
                  className={`ActiveClientsOverview-clientRow ${selectedClient?.client._id === client._id ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedClientId(client._id);
                    setTaskFilter('all');
                    setActiveTab('tasks');
                  }}
                >
                  <span className="ActiveClientsOverview-avatar">{getInitials(name)}</span>
                  <span className="ActiveClientsOverview-clientText">
                    <strong>{name}</strong>
                    <small>{client.clientCode || client.code || client.companyCode || 'CLIENT'}</small>
                  </span>
                  <em>Active</em>
                  <FiChevronRight />
                </button>
              );
            })}

            <button type="button" className="ActiveClientsOverview-viewAll" onClick={() => setSearch('')}>
              View All Clients <FiChevronRight />
            </button>
          </aside>

          <main className="ActiveClientsOverview-main">
            {selectedClient ? (
              <>
                <section className="ActiveClientsOverview-hero">
                  <div className="ActiveClientsOverview-profile">
                    <span className="ActiveClientsOverview-profileAvatar">{selectedInitials}</span>
                    <div>
                      <div className="ActiveClientsOverview-nameLine">
                        <h1>{selectedName}</h1>
                        <span>Active</span>
                      </div>
                      <p>
                        {selectedClient.client.clientCode || selectedClient.client.code || selectedClient.client.companyCode || 'CLIENT'}
                      </p>
                      <div className="ActiveClientsOverview-serviceLine">
                        <small>Services:</small>
                        {selectedServices.slice(0, 4).map(service => <span key={service}>{service}</span>)}
                        {selectedServices.length > 4 && <span>+{selectedServices.length - 4}</span>}
                        {!selectedServices.length && <em>No services assigned</em>}
                      </div>
                    </div>
                  </div>

                  <div className="ActiveClientsOverview-profileActions">
                    <div className="ActiveClientsOverview-profileActionRow">
                      <button type="button" onClick={() => setShowProfileModal(true)}><FiUser /> View Client Profile</button>
                      <button type="button" aria-label="More actions" onClick={() => setShowProfileModal(true)}><FiMoreVertical /></button>
                    </div>
                    <label className="ActiveClientsOverview-uploadPrimary" title={selectedClient ? `Upload document for ${selectedName}` : 'Select a client first'}>
                      <FiUploadCloud /> {uploading ? 'Uploading...' : 'Upload Document'}
                      <input
                        type="file"
                        onChange={handleUploadDocument}
                        disabled={uploading || !selectedClient}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                      />
                    </label>
                  </div>

                  <div className="ActiveClientsOverview-summaryGrid">
                    <article
                      className={taskFilter === 'all' ? 'is-active' : ''}
                      role="button"
                      tabIndex={0}
                      onClick={() => applyTaskFilter('all')}
                      onKeyDown={event => handleSummaryCardKeyDown(event, 'all')}
                    >
                      <span className="tone-blue"><FiBriefcase /></span>
                      <div><p>Total Tasks</p><strong>{selectedStats.totalTasks || 0}</strong></div>
                      <button type="button" onClick={event => { event.stopPropagation(); openTaskModal('all'); }}>View all tasks <FiChevronRight /></button>
                    </article>
                    <article
                      className={taskFilter === 'completed' ? 'is-active' : ''}
                      role="button"
                      tabIndex={0}
                      onClick={() => applyTaskFilter('completed')}
                      onKeyDown={event => handleSummaryCardKeyDown(event, 'completed')}
                    >
                      <span className="tone-green"><FiCheckCircle /></span>
                      <div><p>Completed</p><strong>{selectedStats.completedTasks || 0}</strong></div>
                      <button type="button" onClick={event => { event.stopPropagation(); openTaskModal('completed'); }}>View completed <FiChevronRight /></button>
                    </article>
                    <article
                      className={taskFilter === 'in-progress' ? 'is-active' : ''}
                      role="button"
                      tabIndex={0}
                      onClick={() => applyTaskFilter('in-progress')}
                      onKeyDown={event => handleSummaryCardKeyDown(event, 'in-progress')}
                    >
                      <span className="tone-orange"><FiClock /></span>
                      <div><p>In Progress</p><strong>{selectedStats.inProgressTasks || 0}</strong></div>
                      <button type="button" onClick={event => { event.stopPropagation(); openTaskModal('in-progress'); }}>View in progress <FiChevronRight /></button>
                    </article>
                    <article
                      className={taskFilter === 'overdue' ? 'is-active' : ''}
                      role="button"
                      tabIndex={0}
                      onClick={() => applyTaskFilter('overdue')}
                      onKeyDown={event => handleSummaryCardKeyDown(event, 'overdue')}
                    >
                      <span className="tone-red"><FiAlertTriangle /></span>
                      <div><p>Overdue</p><strong>{selectedStats.overdueTasks || 0}</strong></div>
                      <button type="button" onClick={event => { event.stopPropagation(); openTaskModal('overdue'); }}>View overdue <FiChevronRight /></button>
                    </article>
                    <article
                      className={taskFilter === 'all' ? 'is-active' : ''}
                      role="button"
                      tabIndex={0}
                      onClick={() => applyTaskFilter('all')}
                      onKeyDown={event => handleSummaryCardKeyDown(event, 'all')}
                    >
                      <span className="tone-purple"><FiBarChart2 /></span>
                      <div><p>Completion Rate</p><strong>{selectedStats.completionRate || 0}%</strong></div>
                      <i><b style={{ width: `${selectedStats.completionRate || 0}%` }} /></i>
                    </article>
                  </div>
                </section>

                <section className="ActiveClientsOverview-tabsPanel">
                  <nav className="ActiveClientsOverview-tabs">
                    {[
                      ['tasks', 'Tasks'],
                      ['documents', `Documents (${selectedDocuments.length})`],
                      ['details', 'Client Details'],
                      ['notes', 'Notes'],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={activeTab === id ? 'active' : ''}
                        onClick={() => setActiveTab(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>

                  <div className="ActiveClientsOverview-workGrid">
                    <div className="ActiveClientsOverview-taskTable">
                      {activeTab === 'tasks' ? (
                        <table>
                          <thead>
                            <tr>
                              <th>Task</th>
                              <th>Status</th>
                              <th>Due Date</th>
                              <th>Assigned To</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSelectedTasks.slice(0, 5).map(task => {
                              const status = getTaskStatus(task);
                              const assigned = getAssignedName(task);
                              return (
                                <tr key={task._id || `${getTaskTitle(task)}-${task.createdAt}`}>
                                  <td>{getTaskTitle(task)}</td>
                                  <td><span className={`status-${getStatusClass(status)}`}>{status}</span></td>
                                  <td>{formatDate(getTaskDueDate(task))}</td>
                                  <td>
                                    <div className="ActiveClientsOverview-assignee">
                                      <span>{getInitials(assigned)}</span>
                                      {assigned}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {!filteredSelectedTasks.length && (
                              <tr>
                                <td colSpan="4">No {getTaskFilterLabel(taskFilter).toLowerCase()} found for this client.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      ) : (
                        <div className="ActiveClientsOverview-placeholder">
                          {activeTab === 'documents' && `${selectedDocuments.length} documents are available in the recent documents panel.`}
                          {activeTab === 'details' && `${selectedName} details are shown in the profile header.`}
                          {activeTab === 'notes' && 'No notes added yet.'}
                        </div>
                      )}
                      <button type="button" className="ActiveClientsOverview-tableFooter" onClick={() => openTaskModal(taskFilter)}>
                        View All Tasks <FiChevronRight />
                      </button>
                    </div>

                    <div className="ActiveClientsOverview-docPanel">
                      <div className="ActiveClientsOverview-docHeader">
                        <h2>Recent Documents</h2>
                        <button type="button" onClick={openDocumentsModal}>View All</button>
                      </div>
                      <div className="ActiveClientsOverview-docList">
                        {selectedDocuments.slice(0, 5).map(doc => {
                          const kind = getDocumentKind(doc);
                          return (
                            <div
                              key={`${doc._id || doc.name}-${doc.category}`}
                              className="ActiveClientsOverview-docRow"
                              role="button"
                              tabIndex={0}
                              onClick={() => handleOpenDocument(doc)}
                              onKeyDown={event => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  handleOpenDocument(doc);
                                }
                              }}
                            >
                              <span className={`ActiveClientsOverview-fileIcon file-${kind.toLowerCase()}`}>{kind}</span>
                              <div>
                                <strong>{doc.name}</strong>
                                <small>{kind} <b /> {doc.size}</small>
                              </div>
                              <p>{doc.date}<small>{doc.by}</small></p>
                              {doc.isUploaded && (
                                <div className="ActiveClientsOverview-docActions">
                                  <button
                                    type="button"
                                    className="ActiveClientsOverview-downloadButton"
                                    onClick={event => {
                                      event.stopPropagation();
                                      handleDownloadDocument(doc);
                                    }}
                                    aria-label={`Download ${doc.name}`}
                                  >
                                    <FiDownload />
                                  </button>
                                  {doc.canDelete && (
                                    <button
                                      type="button"
                                      className="ActiveClientsOverview-deleteButton"
                                      onClick={event => {
                                        event.stopPropagation();
                                        requestDeleteDocument(doc);
                                      }}
                                      aria-label={`Delete ${doc.name}`}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {!selectedDocuments.length && <p className="ActiveClientsOverview-docEmpty">No documents uploaded yet.</p>}
                      </div>
                      <button type="button" className="ActiveClientsOverview-tableFooter" onClick={openDocumentsModal}>
                        View All Documents <FiChevronRight />
                      </button>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className="ActiveClientsOverview-empty">
                <FiBriefcase />
                <h2>No active clients found</h2>
                <p>Active clients will appear here once they are added in client management.</p>
              </div>
            )}
          </main>
        </div>
      )}

      {showProfileModal && selectedClient && (
        <div className="ActiveClientsOverview-modalBackdrop" role="presentation" onClick={() => setShowProfileModal(false)}>
          <section className="ActiveClientsOverview-modal ActiveClientsOverview-profileModal" role="dialog" aria-modal="true" aria-label="Client profile" onClick={event => event.stopPropagation()}>
            <header>
              <div>
                <span className="ActiveClientsOverview-profileAvatar">{selectedInitials}</span>
                <div>
                  <h2>{selectedName}</h2>
                  <p>{selectedClient.client.clientCode || selectedClient.client.code || selectedClient.client.companyCode || 'CLIENT'}</p>
                </div>
              </div>
              <button type="button" aria-label="Close profile" onClick={() => setShowProfileModal(false)}><FiX /></button>
            </header>
            <div className="ActiveClientsOverview-profileDetails">
              <article><span>Status</span><strong>Active</strong></article>
              <article><span>Total Tasks</span><strong>{selectedStats.totalTasks || 0}</strong></article>
              <article><span>Documents</span><strong>{selectedDocuments.length}</strong></article>
              <article><span>Completion</span><strong>{selectedStats.completionRate || 0}%</strong></article>
            </div>
            <div className="ActiveClientsOverview-modalServices">
              <h3>Services</h3>
              <div>
                {selectedServices.length ? selectedServices.map(service => <span key={service}>{service}</span>) : <em>No services assigned</em>}
              </div>
            </div>
          </section>
        </div>
      )}

      {showTasksModal && selectedClient && (
        <div className="ActiveClientsOverview-modalBackdrop" role="presentation" onClick={() => setShowTasksModal(false)}>
          <section className="ActiveClientsOverview-modal ActiveClientsOverview-wideModal" role="dialog" aria-modal="true" aria-label="All client tasks" onClick={event => event.stopPropagation()}>
            <header>
              <div>
                <h2>{getTaskFilterLabel(taskFilter)}</h2>
                <p>{selectedName} - {filteredSelectedTasks.length} tasks</p>
              </div>
              <button type="button" aria-label="Close tasks" onClick={() => setShowTasksModal(false)}><FiX /></button>
            </header>
            <div className="ActiveClientsOverview-modalFilters">
              {['all', 'completed', 'in-progress', 'overdue'].map(filter => (
                <button
                  key={filter}
                  type="button"
                  className={taskFilter === filter ? 'active' : ''}
                  onClick={() => applyTaskFilter(filter)}
                >
                  {getTaskFilterLabel(filter)}
                </button>
              ))}
            </div>
            <div className="ActiveClientsOverview-modalTable">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Assigned To</th>
                    <th>Service</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSelectedTasks.map(task => {
                    const status = getTaskStatus(task);
                    const assigned = getAssignedName(task);
                    return (
                      <tr key={task._id || `${getTaskTitle(task)}-${task.createdAt}`}>
                        <td>{getTaskTitle(task)}</td>
                        <td><span className={`status-${getStatusClass(status)}`}>{status}</span></td>
                        <td>{formatDate(getTaskDueDate(task))}</td>
                        <td>{assigned}</td>
                        <td>{task.serviceName || task.service || 'Service task'}</td>
                      </tr>
                    );
                  })}
                  {!filteredSelectedTasks.length && (
                    <tr><td colSpan="5">No {getTaskFilterLabel(taskFilter).toLowerCase()} found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {showDocumentsModal && selectedClient && (
        <div className="ActiveClientsOverview-modalBackdrop" role="presentation" onClick={() => setShowDocumentsModal(false)}>
          <section className="ActiveClientsOverview-modal ActiveClientsOverview-wideModal" role="dialog" aria-modal="true" aria-label="All client documents" onClick={event => event.stopPropagation()}>
            <header>
              <div>
                <h2>All Documents</h2>
                <p>{selectedName} - {selectedDocuments.length} documents</p>
              </div>
              <button type="button" aria-label="Close documents" onClick={() => setShowDocumentsModal(false)}><FiX /></button>
            </header>
            <div className="ActiveClientsOverview-modalDocs">
              {selectedDocuments.map(doc => {
                const kind = getDocumentKind(doc);
                return (
                  <div
                    key={`${doc._id || doc.name}-${doc.category}`}
                    className="ActiveClientsOverview-docRow"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenDocument(doc)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOpenDocument(doc);
                      }
                    }}
                  >
                    <span className={`ActiveClientsOverview-fileIcon file-${kind.toLowerCase()}`}>{kind}</span>
                    <div>
                      <strong>{doc.name}</strong>
                      <small>{doc.category} - {kind} - {doc.size} - {doc.by}</small>
                    </div>
                    <p>{doc.date}</p>
                    {doc.isUploaded && (
                      <div className="ActiveClientsOverview-docActions">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                          aria-label={`Download ${doc.name}`}
                        >
                          <FiDownload />
                        </button>
                        {doc.canDelete && (
                          <button
                            type="button"
                            className="ActiveClientsOverview-deleteButton"
                            onClick={event => {
                              event.stopPropagation();
                              requestDeleteDocument(doc);
                            }}
                            aria-label={`Delete ${doc.name}`}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {!selectedDocuments.length && <p className="ActiveClientsOverview-docEmpty">No documents uploaded yet.</p>}
            </div>
          </section>
        </div>
      )}

      {deleteCandidate && (
        <div className="ActiveClientsOverview-modalBackdrop" role="presentation" onClick={() => !deletingDocument && setDeleteCandidate(null)}>
          <section className="ActiveClientsOverview-modal ActiveClientsOverview-confirmModal" role="dialog" aria-modal="true" aria-label="Confirm document delete" onClick={event => event.stopPropagation()}>
            <header>
              <div>
                <h2>Delete Document?</h2>
                <p>{deleteCandidate.name || deleteCandidate.originalName || 'Document'}</p>
              </div>
              <button type="button" aria-label="Close delete confirmation" onClick={() => setDeleteCandidate(null)} disabled={deletingDocument}><FiX /></button>
            </header>
            <div className="ActiveClientsOverview-confirmBody">
              <FiAlertTriangle />
              <p>This document will move to trash. Only the uploader can delete uploaded documents.</p>
            </div>
            <footer className="ActiveClientsOverview-confirmActions">
              <button type="button" onClick={() => setDeleteCandidate(null)} disabled={deletingDocument}>Cancel</button>
              <button type="button" className="is-danger" onClick={handleConfirmDeleteDocument} disabled={deletingDocument}>
                {deletingDocument ? 'Deleting...' : 'Delete'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );


};

export default ActiveClientsOverview;
