import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';

export const rupee = '\u20b9';

export const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

const blockedDisplayPatterns = [/deepanshu/i, /dipanshu/i, /deepansu/i, /deepshu/i];

const containsBlockedDisplayValue = value => (
  blockedDisplayPatterns.some(pattern => pattern.test(String(value || '')))
);

const isBlockedRecord = record => {
  if (!record) return false;
  if (typeof record === 'string') return containsBlockedDisplayValue(record);
  return [
    record.name,
    record.fullName,
    record.employeeName,
    record.username,
    record.email,
    record.employeeEmail,
    record.userEmail
  ].some(containsBlockedDisplayValue);
};

export const formatMoney = value => {
  const amount = Number(value || 0);
  return `${rupee}${amount.toLocaleString('en-IN')}`;
};

export const formatDate = value => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = value => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const mongoObjectIdPattern = /^[a-f\d]{24}$/i;

const isMongoObjectId = value => mongoObjectIdPattern.test(String(value || ''));

const getObjectIdDate = value => {
  if (!isMongoObjectId(value)) return null;
  const timestamp = parseInt(String(value).slice(0, 8), 16);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp * 1000);
};

const compactPublicIdValue = value => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

export const formatPublicId = (prefix, recordOrId, fallbackIndex = 0) => {
  const record = typeof recordOrId === 'object' && recordOrId ? recordOrId : {};
  const explicitId = [
    record.publicId,
    record.invoiceNumber,
    record.receiptNumber,
    record.enquiryNumber,
    record.ticketNumber,
    record.orderNumber,
    record.orderId,
    record.invoiceId,
    record.receiptNo,
  ].find(value => value && !isMongoObjectId(value));

  if (explicitId) return compactPublicIdValue(explicitId);

  const rawId = record._id || record.id || recordOrId || '';
  const idDate = [
    record.createdAt,
    record.uploadDate,
    record.paymentDate,
    record.dueDate,
    record.updatedAt,
  ].map(value => (value ? new Date(value) : null)).find(date => date && !Number.isNaN(date.getTime()))
    || getObjectIdDate(rawId)
    || new Date();

  const datePart = [
    String(idDate.getFullYear()).slice(-2),
    String(idDate.getMonth() + 1).padStart(2, '0'),
    String(idDate.getDate()).padStart(2, '0'),
  ].join('');

  const rawText = String(rawId || `${prefix}-${fallbackIndex + 1}`).toUpperCase();
  const suffixSource = isMongoObjectId(rawText)
    ? parseInt(rawText.slice(-8), 16).toString(36).toUpperCase()
    : compactPublicIdValue(rawText);
  const suffix = (suffixSource || String(fallbackIndex + 1)).slice(-6).padStart(6, '0');

  return `CIIS-${compactPublicIdValue(prefix || 'REF')}-${datePart}-${suffix}`;
};

export const getClientDisplayName = client => (
  client?.client || client?.name || client?.clientName || client?.company || 'Client'
);

export const getUserDisplayName = user => (
  user?.name || user?.fullName || user?.username || user?.email || 'Client'
);

export const getInitials = value => {
  const parts = String(value || 'C').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return String(parts[0] || 'C').slice(0, 1).toUpperCase();
};

const normalizeMatchValue = value => String(value || '').trim().toLowerCase();
const normalizePhoneValue = value => String(value || '').replace(/\D/g, '');

const parseAdditionalDetails = value => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const getIdValues = value => {
  if (!value) return [];
  if (typeof value === 'object') {
    return [value._id, value.id, value.userId, value.clientId, value.clientUserId]
      .map(normalizeMatchValue)
      .filter(Boolean);
  }
  return [normalizeMatchValue(value)].filter(Boolean);
};

const hasIntersection = (left = [], right = []) => left.some(value => right.includes(value));

const getClientMatchValues = client => ({
  ids: [
    ...getIdValues(client?._id),
    ...getIdValues(client?.id),
    ...getIdValues(client?.userId),
    ...getIdValues(client?.clientId),
    ...getIdValues(client?.clientUserId),
    ...getIdValues(client?.user),
    ...getIdValues(client?.clientUser)
  ],
  emails: [
    client?.email,
    client?.clientEmail,
    client?.userEmail,
    client?.contactEmail,
    client?.companyEmail,
    client?.user?.email,
    client?.clientUser?.email
  ].map(normalizeMatchValue).filter(Boolean),
  names: [
    client?.client,
    client?.name,
    client?.clientName,
    client?.fullName,
    client?.company,
    client?.companyName,
    client?.contactName,
    client?.username,
    client?.user?.name,
    client?.user?.fullName,
    client?.clientUser?.name
  ].map(normalizeMatchValue).filter(Boolean),
  phones: [
    client?.phone,
    client?.mobile,
    client?.contactPhone,
    client?.contactMobile,
    client?.user?.phone,
    client?.clientUser?.phone
  ].map(normalizePhoneValue).filter(Boolean)
});

const getUserMatchValues = user => ({
  ids: [
    ...getIdValues(user?._id),
    ...getIdValues(user?.id),
    ...getIdValues(user?.userId),
    ...getIdValues(user?.clientId),
    ...getIdValues(user?.clientUserId),
    ...getIdValues(user?.employeeType),
    ...getIdValues(user?.client),
    ...getIdValues(user?.clientUser),
    ...getIdValues(parseAdditionalDetails(user?.additionalDetails)?.clientId)
  ],
  emails: [
    user?.email,
    user?.clientEmail,
    user?.userEmail,
    user?.companyEmail,
    user?.client?.email,
    user?.clientUser?.email
  ].map(normalizeMatchValue).filter(Boolean),
  names: [
    user?.name,
    user?.fullName,
    user?.client,
    user?.clientName,
    user?.company,
    user?.companyName,
    user?.organizationName,
    user?.username,
    user?.client?.name,
    user?.client?.client,
    user?.client?.company,
    user?.clientUser?.name
  ].map(normalizeMatchValue).filter(Boolean),
  phones: [
    user?.phone,
    user?.mobile,
    user?.clientPhone,
    user?.clientMobile,
    user?.client?.phone,
    user?.clientUser?.phone
  ].map(normalizePhoneValue).filter(Boolean)
});

export const isClientForLoggedInUser = (client, user) => {
  const clientValues = getClientMatchValues(client);
  const userValues = getUserMatchValues(user);

  return (
    hasIntersection(clientValues.ids, userValues.ids) ||
    hasIntersection(clientValues.emails, userValues.emails) ||
    hasIntersection(clientValues.phones, userValues.phones)
  );
};

export const getClientServices = client => (
  Array.isArray(client?.services) ? client.services.filter(Boolean) : []
);

export const getLatestSubscription = client => {
  const subscriptions = Array.isArray(client?.subscription) ? client.subscription : [];
  return subscriptions.length ? subscriptions[subscriptions.length - 1] : null;
};

export const getPaymentReceipts = client => (
  Array.isArray(client?.paymentReceipts) ? client.paymentReceipts : []
);

export const getDueInvoices = client => (
  Array.isArray(client?.dueInvoices) ? client.dueInvoices : []
);

export const getTaskTitle = task => (
  task?.name || task?.task || task?.title || task?.taskName || 'Project Task'
);

const getTaskSubscription = (client, task = {}) => {
  const subscriptions = Array.isArray(client?.subscription) ? client.subscription : [];
  if (!subscriptions.length) return null;

  const taskSubscriptionId = task.subscriptionId
    ? String(task.subscriptionId?._id || task.subscriptionId)
    : '';

  if (taskSubscriptionId) {
    const matched = subscriptions.find(subscription => String(subscription?._id) === taskSubscriptionId);
    if (matched) return matched;
  }

  if (task.subscriptionNo) {
    const matched = subscriptions.find(subscription => Number(subscription?.subscriptionNo) === Number(task.subscriptionNo));
    if (matched) return matched;
  }

  return getLatestSubscription(client);
};

export const getClientTaskDueDate = (client, task = {}) => (
  getTaskSubscription(client, task)?.endDate || task?.dueDate
);

export const applyClientSubscriptionDueDates = (tasks = [], client) => (
  tasks.map(task => {
    const dueDate = getClientTaskDueDate(client, task);
    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    const hasActiveSubscriptionWindow = parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) && parsedDueDate >= new Date();
    const status = hasActiveSubscriptionWindow && String(task?.status || '').toLowerCase() === 'overdue'
      ? 'pending'
      : task?.status;

    return {
      ...task,
      dueDate,
      status,
      dueDateSource: 'subscription'
    };
  })
);

export const isClientTaskOverdue = task => {
  if (!task?.dueDate || task.completed) return false;
  const status = String(task.status || 'pending').trim().toLowerCase();
  if (status === 'completed' || status === 'onhold') return false;
  const dueDate = new Date(task.dueDate);
  return !Number.isNaN(dueDate.getTime()) && dueDate < new Date();
};

export const getTaskStatus = task => {
  if (task?.completed === true) return 'Completed';
  if (isClientTaskOverdue(task)) return 'Overdue';
  return String(task?.status || 'In Progress').replace(/\b\w/g, char => char.toUpperCase());
};

export const calculateTaskStats = tasks => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed === true).length;
  const overdueTasks = tasks.filter(isClientTaskOverdue).length;
  const inProgressTasks = tasks.filter(task => {
    const status = String(task.status || '').toLowerCase();
    return task.completed !== true && !isClientTaskOverdue(task) && status.includes('progress');
  }).length;
  const pendingTasks = tasks.filter(task => (
    task.completed !== true &&
    !isClientTaskOverdue(task) &&
    !String(task.status || '').toLowerCase().includes('progress')
  )).length;

  return { totalTasks, completedTasks, pendingTasks, overdueTasks, inProgressTasks };
};

export const calculatePaymentSummary = client => {
  const latest = getLatestSubscription(client);
  const receipts = getPaymentReceipts(client);
  const dueInvoices = getDueInvoices(client).filter(invoice => (invoice?.status || 'Due') === 'Due');
  const subscriptionPrice = Number(latest?.price || client?.subscriptionPrice || 0);
  const paidAmount = receipts
    .filter(receipt => String(receipt.status || '').toLowerCase() === 'approved' || !receipt.status)
    .reduce((sum, receipt) => (
    sum + Number(receipt.amount || receipt.price || receipt.paidAmount || subscriptionPrice || 0)
  ), 0);
  const endDate = latest?.endDate || client?.subscriptionEndDate || '';
  const isExpired = endDate ? new Date(endDate) < new Date() : false;
  const dueAmount = dueInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const outstanding = dueAmount || (isExpired ? subscriptionPrice : 0);

  return {
    latest,
    receipts,
    dueInvoices,
    paidAmount,
    outstanding,
    unpaidInvoices: dueInvoices.length || (outstanding > 0 ? 1 : 0),
    nextDueDate: dueInvoices[0]?.dueDate || endDate,
    planName: latest?.plan || latest?.name || latest?.subscriptionName || client?.plan || 'Active Plan',
    billingCycle: latest?.billingCycle || latest?.cycle || `${latest?.months || 1} Month`,
    subscriptionPrice
  };
};

export const buildClientDocuments = ({ client, tasks = [], projectManagers = [] }) => {
  const manager = projectManagers[0];
  const owner = manager?.name || getClientDisplayName(client);
  const docs = [];

  tasks.slice(0, 6).forEach((task, index) => {
    docs.push({
      name: `${getTaskTitle(task)}.${index % 3 === 1 ? 'docx' : index % 3 === 2 ? 'xlsx' : 'pdf'}`,
      type: index % 3 === 1 ? 'Word Document' : index % 3 === 2 ? 'Excel Spreadsheet' : 'PDF',
      category: task.serviceName || 'Project',
      date: formatDateTime(task.updatedAt || task.createdAt || task.dueDate),
      by: owner,
      size: `${Math.max(45, 72 + index * 31)} KB`,
      icon: index % 3 === 1 ? 'word' : index % 3 === 2 ? 'excel' : 'pdf'
    });
  });

  getClientServices(client).forEach(service => {
    docs.push({
      name: `${service} Resources`,
      type: 'Folder',
      category: service,
      date: formatDateTime(client?.updatedAt || client?.createdAt),
      by: 'System',
      size: '--',
      icon: 'folder'
    });
  });

  const latest = getLatestSubscription(client);
  if (latest) {
    docs.push({
      name: 'Subscription Summary.pdf',
      type: 'PDF',
      category: 'Finance',
      date: formatDateTime(latest.updatedAt || latest.endDate || client?.updatedAt),
      by: owner,
      size: '120 KB',
      icon: 'pdf'
    });
  }

  return docs;
};

const getUsersArrayFromResponse = responseData => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.users)) return responseData.users;
  if (Array.isArray(responseData?.message?.users)) return responseData.message.users;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

const getPersonName = person => {
  if (!person) return '';
  if (typeof person === 'string') return person;
  return person.name || person.fullName || person.employeeName || person.username || person.email || '';
};

const getPersonEmail = person => (
  typeof person === 'object' && person
    ? person.email || person.employeeEmail || person.userEmail || ''
    : ''
);

const normalizeProjectMember = person => {
  const name = getPersonName(person).trim();
  if (!name) return null;
  return {
    _id: typeof person === 'object' && person ? person._id || person.id || person.userId || person.employeeId || name : name,
    name,
    email: getPersonEmail(person),
    phone: typeof person === 'object' && person ? person.phone || person.mobile || '' : '',
    role: typeof person === 'object' && person ? person.role || person.designation || person.position || person.employeeRole || 'Project Team' : 'Project Team'
  };
};

const addUniqueProjectMember = (membersMap, person) => {
  if (isBlockedRecord(person)) return;
  const member = normalizeProjectMember(person);
  if (!member) return;
  const key = String(member.email || member._id || member.name).toLowerCase();
  if (!membersMap.has(key)) membersMap.set(key, member);
};

const findUserForAssignedMember = (member, users = []) => {
  const memberId = typeof member === 'object' && member ? member._id || member.id || member.userId || member.employeeId : '';
  const memberName = getPersonName(member).trim().toLowerCase();
  const memberEmail = getPersonEmail(member).trim().toLowerCase();

  return users.find(user => {
    const userId = String(user._id || user.id || user.userId || user.employeeId || '').toLowerCase();
    const userName = String(user.name || user.fullName || user.employeeName || '').trim().toLowerCase();
    const userEmail = String(user.email || user.employeeEmail || '').trim().toLowerCase();
    return (
      (memberId && userId && String(memberId).toLowerCase() === userId) ||
      (memberEmail && userEmail && memberEmail === userEmail) ||
      (memberName && userName && memberName === userName)
    );
  });
};

export const collectProjectMembers = (client, users = []) => {
  const membersMap = new Map();
  const availableUsers = users.filter(user => !isBlockedRecord(user));
  [client?.projectManagers, client?.projectManager].forEach(group => {
    if (Array.isArray(group)) {
      group
        .filter(person => !isBlockedRecord(person))
        .forEach(person => addUniqueProjectMember(membersMap, findUserForAssignedMember(person, availableUsers) || person));
    } else {
      addUniqueProjectMember(membersMap, findUserForAssignedMember(group, availableUsers) || group);
    }
  });
  return Array.from(membersMap.values());
};

export const useClientPortalData = () => {
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = useRef(true);

  const clientsApi = useMemo(() => axios.create({ baseURL: `${API_URL}/clientsservice`, timeout: 10000 }), []);
  const tasksApi = useMemo(() => axios.create({ baseURL: `${API_URL}/tasks/client-tasks`, timeout: 10000 }), []);
  const usersApi = useMemo(() => axios.create({ baseURL: `${API_URL}/users`, timeout: 10000 }), []);

  useEffect(() => {
    [clientsApi, tasksApi, usersApi].forEach(instance => {
      instance.interceptors.request.use(config => {
        const token = getAuthToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
    });
  }, [clientsApi, tasksApi, usersApi]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchCompanyUsers = useCallback(async user => {
    try {
      const role = String(user?.companyRole || user?.role || user?.userRole || '').toLowerCase();
      const response = await usersApi.get(role === 'employee' ? '/department-users' : '/company-users');
      return getUsersArrayFromResponse(response.data);
    } catch (err) {
      console.error('Error fetching company users:', err);
      return [];
    }
  }, [usersApi]);

  const fetchServiceTasks = useCallback(async (clientId, serviceName) => {
    try {
      const response = await tasksApi.get(`/client/${clientId}/service/${encodeURIComponent(serviceName)}`);
      if (response.data?.success) {
        return (response.data.data || []).map(task => ({ ...task, serviceName }));
      }
      return [];
    } catch (err) {
      console.error(`Error fetching tasks for ${serviceName}:`, err);
      return [];
    }
  }, [tasksApi]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not found. Please login again.');
        return;
      }

      const user = JSON.parse(userStr);
      const storedClient = (() => {
        try {
          return JSON.parse(localStorage.getItem('client') || 'null');
        } catch {
          return null;
        }
      })();
      setUser(user);
      const companyCode = localStorage.getItem('companyCode') || localStorage.getItem('company') || '';
      const companyIdentifier = localStorage.getItem('companyIdentifier') || '';
      const [clientsResponse, companyUsers] = await Promise.all([
        clientsApi.get('/', { params: { companyCode, companyIdentifier, limit: 1000 } }),
        fetchCompanyUsers(user)
      ]);

      if (!clientsResponse.data?.success) {
        setError('No client data found');
        return;
      }

      const allClients = clientsResponse.data.data || [];
      const storedClientId = normalizeMatchValue(storedClient?._id || storedClient?.id || storedClient?.clientId);
      const currentClient = (
        storedClientId
          ? allClients.find(item => normalizeMatchValue(item?._id || item?.id) === storedClientId)
          : null
      ) || allClients.find(item => isClientForLoggedInUser(item, user));
      if (!currentClient) {
        setClient(null);
        setServices([]);
        setTasks([]);
        setProjectManagers([]);
        setError('No client data found for this login.');
        return;
      }

      const serviceList = getClientServices(currentClient);
      const taskGroups = await Promise.all(serviceList.map(service => fetchServiceTasks(currentClient._id, service)));
      const normalizedTasks = applyClientSubscriptionDueDates(taskGroups.flat(), currentClient);

      if (isMounted.current) {
        setClient(currentClient);
        setServices(serviceList);
        setTasks(normalizedTasks);
        setProjectManagers(collectProjectMembers(currentClient, companyUsers));
      }
    } catch (err) {
      console.error('Error fetching client portal data:', err);
      if (isMounted.current) setError(err.response?.data?.message || 'Failed to load client data');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [clientsApi, fetchCompanyUsers, fetchServiceTasks]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { client, services, tasks, projectManagers, user, loading, error, refetch };
};
