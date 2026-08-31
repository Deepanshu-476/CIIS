import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import {
  FiCalendar,
  FiClock,
  FiUsers,
  FiUser,
  FiBell,
  FiCheck,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiChevronRight,
  FiPlus,
  FiArrowUp,
  FiArrowDown,
  FiArrowRight,
  FiPackage,
  FiMessageSquare,
  FiGrid,
  FiRefreshCw,
  FiX,
  FiSearch
} from 'react-icons/fi';
import {
  MdOutlineCampaign,
  MdOutlineAssignment,
  MdOutlineEventNote,
  MdOutlineBarChart,
  MdOutlineInventory2,
  MdOutlineGroups,
  MdOutlineCheckCircle,
  MdCheckCircleOutline
} from 'react-icons/md';
import './DashboardOverview.css';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
  } catch {
    return {};
  }
};

const getInitials = (value) => {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || '').trim());

const getDisplayReference = (value, fallback = '') => {
  if (value && typeof value === 'object') return value.name || value.title || fallback;
  return value && !isObjectId(value) ? value : fallback;
};

const isClientRole = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]/g, '') === 'client';
const isClientRecord = (person) => [
  person?.companyRole,
  person?.jobRole?.name,
  person?.jobRole?.title,
  person?.jobRole?.roleName,
  person?.jobRole,
  person?.role
].some(isClientRole);

const formatShortDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatShortTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Fallback mock team members exactly as in the design image
const DEFAULT_PRESENT_USERS = [
  {
    id: '1',
    name: 'Rohit Sharma',
    role: 'Frontend Developer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    initials: 'RS',
    task: 'Working on Dashboard API',
    taskColor: '#2563eb', // blue
    lastUpdate: 'Fixed login issue and improved validation',
    time: '10:28 AM',
    status: 'On Task',
    statusType: 'success'
  },
  {
    id: '2',
    name: 'Sneha Verma',
    role: 'UI/UX Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    initials: 'SV',
    task: 'Designing Reports UI',
    taskColor: '#9333ea', // purple
    lastUpdate: 'Creating charts and filters layout',
    time: '10:24 AM',
    status: 'On Task',
    statusType: 'success'
  },
  {
    id: '3',
    name: 'Amit Kumar',
    role: 'Backend Developer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    initials: 'AK',
    task: 'Optimizing Database',
    taskColor: '#f59e0b', // amber
    lastUpdate: 'Optimized user query performance',
    time: '10:20 AM',
    status: 'On Task',
    statusType: 'success'
  },
  {
    id: '4',
    name: 'Pooja Singh',
    role: 'HR Executive',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    initials: 'PS',
    task: null,
    taskColor: null,
    lastUpdate: 'No updates yet',
    time: null,
    status: 'Not Updated',
    statusType: 'error'
  },
  {
    id: '5',
    name: 'Vikas Mehta',
    role: 'System Administrator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    initials: 'VM',
    task: 'Server Monitoring',
    taskColor: '#10b981', // emerald
    lastUpdate: 'Monitoring server logs and uptime',
    time: '10:18 AM',
    status: 'On Task',
    statusType: 'success'
  },
  {
    id: '6',
    name: 'Ananya Patel',
    role: 'QA Engineer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    initials: 'AP',
    task: 'Regression Testing',
    taskColor: '#3b82f6',
    lastUpdate: 'Executing payroll module test suites',
    time: '10:15 AM',
    status: 'On Task',
    statusType: 'success'
  },
  {
    id: '7',
    name: 'Karan Malhotra',
    role: 'Product Manager',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    initials: 'KM',
    task: 'Sprint Planning',
    taskColor: '#8b5cf6',
    lastUpdate: 'Finalizing Q3 sprint backlog & user stories',
    time: '10:10 AM',
    status: 'On Task',
    statusType: 'success'
  },
  {
    id: '8',
    name: 'Ritu Sen',
    role: 'Content Specialist',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    initials: 'RS',
    task: null,
    taskColor: null,
    lastUpdate: 'No updates yet',
    time: null,
    status: 'Not Updated',
    statusType: 'error'
  }
];

const DEFAULT_PENDING_LEAVES = [
  {
    id: 'leave-1',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    initials: 'PS',
    leaveType: 'Casual Leave',
    from: '23 May 2025',
    to: '23 May 2025',
    status: 'Pending'
  },
  {
    id: 'leave-2',
    name: 'Rahul Verma',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
    initials: 'RV',
    leaveType: 'Sick Leave',
    from: '22 May 2025',
    to: '22 May 2025',
    status: 'Pending'
  }
];

const DEFAULT_PENDING_ASSETS = [
  {
    id: 'asset-1',
    name: 'Sandeep Yadav',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    initials: 'SY',
    assetType: 'Laptop',
    requestedOn: '20 May 2025',
    status: 'Pending'
  },
  {
    id: 'asset-2',
    name: 'Neha Gupta',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    initials: 'NG',
    assetType: 'Monitor',
    requestedOn: '19 May 2025',
    status: 'Pending'
  }
];

const DEFAULT_ALERTS = [
  {
    id: 'alert-1',
    type: 'danger',
    title: 'Server maintenance on 25th May from 11:00 PM to 2:00 AM.',
    time: '10:00 AM'
  },
  {
    id: 'alert-2',
    type: 'warning',
    title: 'Company holiday on 26th May 2025 on account of Memorial Day.',
    time: '19 May, 04:30 PM'
  },
  {
    id: 'alert-3',
    type: 'info',
    title: 'Please update your timesheet before 6 PM today.',
    time: '19 May, 09:15 AM'
  }
];

export default function DashboardOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const variant = 'dashboard-1';
  const user = useMemo(readUser, []);

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time ticking clock
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/dashboard/overview', { params: { variant } });
      const data = response.data?.data;
      setSnapshot(data);
    } catch (error) {
      if (error.response?.status === 403) {
        navigate('/ciisUser/user-dashboard', { replace: true });
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [variant]);

  // Determine Greeting based on current hour
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime]);

  const userName = user.name || user.fullName || user.username || 'Admin';

  // Format today's date
  const formattedTodayDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [currentTime]);

  const dashboardMetrics = snapshot?.metrics || {};
  const metrics = {
    totalPresent: dashboardMetrics.totalPresent ?? 0,
    totalAbsent: dashboardMetrics.totalAbsent ?? 0,
    pendingLeaveRequests: dashboardMetrics.pendingLeaveRequests ?? 0,
    pendingAssetRequests: dashboardMetrics.pendingAssetRequests ?? 0,
    unseenAlerts: dashboardMetrics.unseenAlerts ?? 0,
    totalUsers: dashboardMetrics.totalUsers ?? 0,
    onDuty: dashboardMetrics.onDuty ?? dashboardMetrics.totalPresent ?? 0,
    absentToday: dashboardMetrics.absentToday ?? dashboardMetrics.totalAbsent ?? 0,
    onLeave: dashboardMetrics.onLeave ?? dashboardMetrics.pendingLeaveRequests ?? 0,
    assetRequests: dashboardMetrics.assetRequests ?? dashboardMetrics.pendingAssetRequests ?? 0,
    unseenAlertCount: dashboardMetrics.unseenAlertCount ?? dashboardMetrics.unseenAlerts ?? 0,
    attendanceRate: dashboardMetrics.attendanceRate ?? 0
  };

  const presentUsersList = useMemo(() => {
    return (snapshot?.presentUsers || []).map((item, idx) => {
      const person = item?.user || {};
      const personName = person.name || `Employee ${idx + 1}`;
      const taskTitle = item?.task?.title || '';
      const updateText = item?.lastUpdate || item?.progress || '';
      return {
        id: person._id || String(idx),
        name: personName,
        role: getDisplayReference(person.jobRole, getDisplayReference(person.role, 'Team Member')),
        avatar: person.profileImage || '',
        initials: getInitials(personName),
        task: taskTitle,
        taskColor: item?.task?.status === 'completed' ? '#10b981' : '#2563eb',
        lastUpdate: updateText,
        time: formatShortTime(item?.updatedAt),
        status: taskTitle || updateText ? 'On Task' : 'Not Updated',
        statusType: taskTitle || updateText ? 'success' : 'error'
      };
    });
  }, [snapshot]);

  const pendingLeavesList = useMemo(() => (snapshot?.pendingLeaves || []).map((leave) => ({
    ...leave,
    role: getDisplayReference(leave.role),
    department: getDisplayReference(leave.department)
  })), [snapshot]);
  const pendingAssetsList = useMemo(() => (snapshot?.pendingAssets || []).map((asset) => ({
    ...asset,
    role: getDisplayReference(asset.role),
    department: getDisplayReference(asset.department)
  })), [snapshot]);
  const alertsList = useMemo(() => snapshot?.alerts || [], [snapshot]);
  const absentUsersList = useMemo(() => (snapshot?.absentUsers || [])
    .filter((person) => !isClientRecord(person))
    .map((person) => ({
      ...person,
      role: getDisplayReference(person.role),
      department: getDisplayReference(person.department)
    })), [snapshot]);

  // Modal State 1: View All Present Users Popup
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Filtered Users inside the Popup
  const filteredModalUsers = useMemo(() => {
    if (!modalSearchQuery.trim()) return presentUsersList;
    const query = modalSearchQuery.toLowerCase();
    return presentUsersList.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query) ||
        u.task?.toLowerCase().includes(query) ||
        u.lastUpdate?.toLowerCase().includes(query)
    );
  }, [presentUsersList, modalSearchQuery]);

  // Modal State 2: View All Leaves Popup
  const [showLeavesModal, setShowLeavesModal] = useState(false);
  const [leavesSearchQuery, setLeavesSearchQuery] = useState('');

  const filteredLeaves = useMemo(() => {
    if (!leavesSearchQuery.trim()) return pendingLeavesList;
    const query = leavesSearchQuery.toLowerCase();
    return pendingLeavesList.filter(
      (l) =>
        l.name?.toLowerCase().includes(query) ||
        l.leaveType?.toLowerCase().includes(query) ||
        l.department?.toLowerCase().includes(query) ||
        l.reason?.toLowerCase().includes(query)
    );
  }, [pendingLeavesList, leavesSearchQuery]);

  // Modal State 3: View All Assets Popup
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [assetsSearchQuery, setAssetsSearchQuery] = useState('');

  const filteredAssets = useMemo(() => {
    if (!assetsSearchQuery.trim()) return pendingAssetsList;
    const query = assetsSearchQuery.toLowerCase();
    return pendingAssetsList.filter(
      (a) =>
        a.name?.toLowerCase().includes(query) ||
        a.assetType?.toLowerCase().includes(query) ||
        a.department?.toLowerCase().includes(query) ||
        a.specs?.toLowerCase().includes(query) ||
        a.reason?.toLowerCase().includes(query)
    );
  }, [pendingAssetsList, assetsSearchQuery]);

  // Modal State 4: View All Alerts Popup
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [alertsSearchQuery, setAlertsSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    if (!alertsSearchQuery.trim()) return alertsList;
    const query = alertsSearchQuery.toLowerCase();
    return alertsList.filter(
      (al) =>
        al.title?.toLowerCase().includes(query) ||
        al.description?.toLowerCase().includes(query) ||
        al.category?.toLowerCase().includes(query) ||
        al.priority?.toLowerCase().includes(query)
    );
  }, [alertsList, alertsSearchQuery]);

  // Modal State 5: View All Absent Employees Popup
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentSearchQuery, setAbsentSearchQuery] = useState('');

  const filteredAbsentUsers = useMemo(() => {
    if (!absentSearchQuery.trim()) return absentUsersList;
    const query = absentSearchQuery.toLowerCase();
    return absentUsersList.filter((person) => [
      person.name,
      person.role,
      person.department,
      person.email,
      person.attendanceStatus,
      person.attendanceNote,
      person.recordDetails
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [absentUsersList, absentSearchQuery]);

  const openPresentUsersModal = () => {
    setModalSearchQuery('');
    setShowAllUsersModal(true);
  };

  const openLeavesModal = () => {
    setLeavesSearchQuery('');
    setShowLeavesModal(true);
  };

  const openAssetsModal = () => {
    setAssetsSearchQuery('');
    setShowAssetsModal(true);
  };

  const openAlertsModal = () => {
    setAlertsSearchQuery('');
    setShowAlertsModal(true);
  };

  const openAbsentModal = () => {
    setAbsentSearchQuery('');
    setShowAbsentModal(true);
  };

  const handleCardKeyDown = (event, openModal) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal();
    }
  };

  const getCardInteractionProps = (openModal, ariaLabel) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': ariaLabel,
    onClick: openModal,
    onKeyDown: (event) => handleCardKeyDown(event, openModal)
  });

  // Modal State 6: Create Alert Modal
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({
    title: '',
    type: 'warning',
    category: 'General Notice',
    priority: 'Important',
    description: ''
  });

  const handleCreateAlertSubmit = async (e) => {
    e.preventDefault();
    if (!alertForm.title.trim()) {
      toast.error('Please enter an alert title');
      return;
    }
    try {
      await axios.post('/alerts', {
        type: alertForm.type,
        message: alertForm.description?.trim() || alertForm.title.trim(),
        assignedUsers: [],
        assignedGroups: []
      });
      toast.success('Alert broadcasted successfully!');
      setShowCreateAlertModal(false);
      setAlertForm({
        title: '',
        type: 'warning',
        category: 'General Notice',
        priority: 'Important',
        description: ''
      });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to broadcast alert');
    }
  };

  // Modal State 7: Assign Task Modal
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    assigneeId: '',
    priority: 'Medium',
    dueDate: '',
    description: ''
  });

  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    const targetUserId = taskForm.assigneeId || presentUsersList[0]?.id;
    if (!targetUserId) {
      toast.error('No present users available for assignment');
      return;
    }
    const selectedUser = presentUsersList.find((u) => u.id === targetUserId) || presentUsersList[0];
    const assigneeName = selectedUser ? selectedUser.name : 'Employee';

    try {
      await axios.post('/tasks/create-for-others', {
        title: taskForm.title.trim(),
        description: taskForm.description?.trim() || '',
        assignedUsers: [targetUserId],
        assignedGroups: [],
        priority: String(taskForm.priority || 'Medium').toLowerCase(),
        dueDateTime: taskForm.dueDate || ''
      });
      toast.success(`Task "${taskForm.title}" assigned to ${assigneeName} successfully!`);
      setShowAssignTaskModal(false);
      setTaskForm({
        title: '',
        assigneeId: presentUsersList[0]?.id || '',
        priority: 'Medium',
        dueDate: '',
        description: ''
      });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign task');
    }
  };

  return (
    <div className="v2-dashboard-container">
      {/* ── ROW 1: GREETING BANNER & TODAY'S DATE / QUICK ACTIONS ── */}
      <div className="v2-top-grid">
        {/* Card 1: Greeting & Feature Bullets with 3D Illustration */}
        <div className="v2-greeting-card">
          <div className="v2-greeting-content">
            <h1 className="v2-greeting-title">
              {greeting}, {userName}! <span className="v2-wave-emoji">👋</span>
            </h1>
            <p className="v2-greeting-subtitle">
              Here&apos;s what&apos;s happening in your company today.
            </p>

            <ul className="v2-bullet-list">
              <li className="v2-bullet-item">
                <span className="v2-check-badge is-blue-badge">
                  <FiCheck className="v2-check-icon" />
                </span>
                <span>Track attendance and team activity in real-time</span>
              </li>
              <li className="v2-bullet-item">
                <span className="v2-check-badge is-purple-badge">
                  <FiCheck className="v2-check-icon" />
                </span>
                <span>Manage leave requests and asset requests</span>
              </li>
              <li className="v2-bullet-item">
                <span className="v2-check-badge is-green-badge">
                  <FiCheck className="v2-check-icon" />
                </span>
                <span>Stay updated on alerts and team task progress</span>
              </li>
            </ul>
          </div>

          {/* 3D Dashboard Mockup Graphic */}
          <div className="v2-greeting-graphic">
            <div className="v2-illustration-wrapper">
              <svg
                viewBox="0 0 380 230"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="v2-hero-svg"
              >
                <defs>
                  <linearGradient id="v2CardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f0f4ff" />
                  </linearGradient>
                  <linearGradient id="v2BarGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="v2DonutGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="v2DonutBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="v2PlantGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <filter id="v2SoftGlow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#3b82f6" floodOpacity="0.12" />
                  </filter>
                  <filter id="v2ShadowSmall" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.08" />
                  </filter>
                </defs>

                {/* Ground shadow */}
                <ellipse cx="210" cy="205" rx="140" ry="12" fill="#dbeafe" opacity="0.6" />

                {/* Floating Screen */}
                <g filter="url(#v2SoftGlow)">
                  <rect x="130" y="24" width="220" height="150" rx="16" fill="url(#v2CardGrad)" stroke="#ffffff" strokeWidth="3" />
                  {/* Window Controls */}
                  <circle cx="316" cy="38" r="3" fill="#cbd5e1" />
                  <circle cx="326" cy="38" r="3" fill="#cbd5e1" />
                  <circle cx="336" cy="38" r="3" fill="#cbd5e1" />
                  <rect x="145" y="34" width="40" height="8" rx="4" fill="#e2e8f0" />

                  {/* Horizontal dividers & sub-lines */}
                  <rect x="145" y="60" width="80" height="8" rx="4" fill="#3b82f6" opacity="0.8" />
                  <rect x="145" y="74" width="50" height="6" rx="3" fill="#e2e8f0" />

                  {/* Bar Chart */}
                  <g transform="translate(144, 96)">
                    <rect x="0" y="32" width="10" height="28" rx="3" fill="url(#v2BarGrad1)" />
                    <rect x="14" y="20" width="10" height="40" rx="3" fill="url(#v2BarGrad1)" />
                    <rect x="28" y="26" width="10" height="34" rx="3" fill="url(#v2BarGrad1)" />
                    <rect x="42" y="10" width="10" height="50" rx="3" fill="url(#v2BarGrad1)" />
                    <rect x="56" y="18" width="10" height="42" rx="3" fill="url(#v2BarGrad1)" />
                  </g>

                  {/* Dual-color Donut Chart (Blue & Green) */}
                  <g transform="translate(268, 80)">
                    <circle cx="28" cy="28" r="26" fill="none" stroke="url(#v2DonutBlue)" strokeWidth="12" strokeDasharray="163" strokeDashoffset="50" />
                    <circle cx="28" cy="28" r="26" fill="none" stroke="url(#v2DonutGreen)" strokeWidth="12" strokeDasharray="163" strokeDashoffset="130" transform="rotate(75 28 28)" />
                  </g>

                  <rect x="250" y="146" width="22" height="6" rx="3" fill="#3b82f6" />
                  <rect x="278" y="146" width="22" height="6" rx="3" fill="#10b981" />
                </g>

                {/* Base Plate */}
                <path d="M110 178 L370 178 Q360 186 345 186 L135 186 Q120 186 110 178 Z" fill="#e2e8f0" />

                {/* Potted Plant */}
                <g filter="url(#v2ShadowSmall)" transform="translate(75, 86)">
                  <path d="M35 70 Q24 30 8 16 Q26 36 35 70" fill="url(#v2PlantGrad)" />
                  <path d="M35 70 Q46 24 62 12 Q50 38 35 70" fill="url(#v2PlantGrad)" />
                  <path d="M35 65 Q18 42 4 48 Q22 56 35 65" fill="url(#v2PlantGrad)" />
                  <path d="M35 65 Q52 42 66 48 Q48 56 35 65" fill="url(#v2PlantGrad)" />
                  <path d="M35 55 Q35 15 35 0 Q40 25 35 55" fill="url(#v2PlantGrad)" />
                  {/* White Pot */}
                  <path d="M20 72 L50 72 L45 102 L25 102 Z" fill="#ffffff" stroke="#e2e8f5" strokeWidth="1.5" />
                  <ellipse cx="35" cy="72" rx="15" ry="3.5" fill="#e2e8f0" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Date & Quick Actions */}
        <div className="v2-date-actions-card">
          <div className="v2-date-section">
            <div className="v2-date-icon-wrap">
              <FiCalendar className="v2-date-icon" />
            </div>
            <div className="v2-date-text-wrap">
              <span className="v2-date-label">Today&apos;s Date</span>
              <h2 className="v2-date-value">{formattedTodayDate}</h2>
            </div>
          </div>

          <div className="v2-quick-actions-section">
            <h3 className="v2-quick-actions-title">Quick Actions</h3>
            <div className="v2-actions-btn-group">
              <button
                type="button"
                className="v2-action-btn is-blue"
                onClick={() => setShowCreateAlertModal(true)}
              >
                <FiPlus className="v2-action-btn-icon" /> Create Alert
              </button>
              <button
                type="button"
                className="v2-action-btn is-green"
                onClick={() => setShowAssignTaskModal(true)}
              >
                <MdCheckCircleOutline className="v2-action-btn-icon" /> Assign Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: 5 KPI STAT CARDS WITH SPARKLINE WAVES ── */}
      <div className="v2-stats-grid">
        {/* Card 1: Total Present */}
        <div className="v2-stat-card is-clickable" {...getCardInteractionProps(openPresentUsersModal, 'Open total present details')}>
          <div className="v2-stat-top">
            <div className="v2-stat-icon-wrapper is-present">
              <FiUsers className="v2-stat-icon" />
            </div>
            <div className="v2-stat-details">
              <span className="v2-stat-label">Total Present</span>
              <div className="v2-stat-value-group">
                <span className="v2-stat-number">{metrics.totalPresent}</span>
                <span className="v2-stat-unit">People</span>
              </div>
            </div>
          </div>
          <div className="v2-stat-bottom">
            <span className="v2-trend-pill is-up">
              <FiArrowUp className="v2-trend-icon" /> Live snapshot
            </span>
          </div>
          {/* Sparkline Wave */}
          <div className="v2-stat-wave-wrap">
            <svg viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" className="v2-stat-wave">
              <path d="M0 30 Q 50 10, 100 25 T 200 15 L 200 40 L 0 40 Z" fill="#f0fdf4" opacity="0.7" />
              <path d="M0 30 Q 50 10, 100 25 T 200 15" stroke="#86efac" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Absent */}
        <div className="v2-stat-card is-clickable" {...getCardInteractionProps(openAbsentModal, 'Open total absent details')}>
          <div className="v2-stat-top">
            <div className="v2-stat-icon-wrapper is-absent">
              <FiUser className="v2-stat-icon" />
            </div>
            <div className="v2-stat-details">
              <span className="v2-stat-label">Total Absent</span>
              <div className="v2-stat-value-group">
                <span className="v2-stat-number">{metrics.totalAbsent}</span>
                <span className="v2-stat-unit">People</span>
              </div>
            </div>
          </div>
          <div className="v2-stat-bottom">
            <span className="v2-trend-pill is-down">
              <FiArrowDown className="v2-trend-icon" /> Live snapshot
            </span>
          </div>
          {/* Sparkline Wave */}
          <div className="v2-stat-wave-wrap">
            <svg viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" className="v2-stat-wave">
              <path d="M0 25 Q 60 38, 120 20 T 200 32 L 200 40 L 0 40 Z" fill="#fef2f2" opacity="0.7" />
              <path d="M0 25 Q 60 38, 120 20 T 200 32" stroke="#fca5a5" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        {/* Card 3: Pending Leave Requests */}
        <div className="v2-stat-card is-clickable" {...getCardInteractionProps(openLeavesModal, 'Open pending leave requests')}>
          <div className="v2-stat-top">
            <div className="v2-stat-icon-wrapper is-leave">
              <MdOutlineEventNote className="v2-stat-icon" />
            </div>
            <div className="v2-stat-details">
              <span className="v2-stat-label">Pending Leave Requests</span>
              <div className="v2-stat-value-group">
                <span className="v2-stat-number">{metrics.pendingLeaveRequests}</span>
                <span className="v2-stat-unit">Requests</span>
              </div>
            </div>
          </div>
          <div className="v2-stat-bottom">
            <span className="v2-trend-pill is-warning">Requires action</span>
          </div>
          {/* Sparkline Wave */}
          <div className="v2-stat-wave-wrap">
            <svg viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" className="v2-stat-wave">
              <path d="M0 32 Q 50 15, 100 28 T 200 18 L 200 40 L 0 40 Z" fill="#fffbeb" opacity="0.7" />
              <path d="M0 32 Q 50 15, 100 28 T 200 18" stroke="#fdba74" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        {/* Card 4: Pending Asset Requests */}
        <div className="v2-stat-card is-clickable" {...getCardInteractionProps(openAssetsModal, 'Open pending asset requests')}>
          <div className="v2-stat-top">
            <div className="v2-stat-icon-wrapper is-asset">
              <FiPackage className="v2-stat-icon" />
            </div>
            <div className="v2-stat-details">
              <span className="v2-stat-label">Pending Asset Requests</span>
              <div className="v2-stat-value-group">
                <span className="v2-stat-number">{metrics.pendingAssetRequests}</span>
                <span className="v2-stat-unit">Requests</span>
              </div>
            </div>
          </div>
          <div className="v2-stat-bottom">
            <span className="v2-trend-pill is-purple">Requires action</span>
          </div>
          {/* Sparkline Wave */}
          <div className="v2-stat-wave-wrap">
            <svg viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" className="v2-stat-wave">
              <path d="M0 28 Q 70 36, 130 18 T 200 25 L 200 40 L 0 40 Z" fill="#faf5ff" opacity="0.7" />
              <path d="M0 28 Q 70 36, 130 18 T 200 25" stroke="#d8b4fe" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        {/* Card 5: Unseen Alerts */}
        <div className="v2-stat-card is-clickable" {...getCardInteractionProps(openAlertsModal, 'Open unseen alerts')}>
          <div className="v2-stat-top">
            <div className="v2-stat-icon-wrapper is-alerts">
              <FiBell className="v2-stat-icon" />
            </div>
            <div className="v2-stat-details">
              <span className="v2-stat-label">Unseen Alerts</span>
              <div className="v2-stat-value-group">
                <span className="v2-stat-number">{metrics.unseenAlerts}</span>
                <span className="v2-stat-unit">Alerts</span>
              </div>
            </div>
          </div>
          <div className="v2-stat-bottom">
            <button
              type="button"
              className="v2-view-link"
              onClick={openAlertsModal}
            >
              View all alerts <FiArrowRight className="v2-link-arrow" />
            </button>
          </div>
          {/* Sparkline Wave */}
          <div className="v2-stat-wave-wrap">
            <svg viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" className="v2-stat-wave">
              <path d="M0 30 Q 50 12, 100 26 T 200 20 L 200 40 L 0 40 Z" fill="#f0f7ff" opacity="0.7" />
              <path d="M0 30 Q 50 12, 100 26 T 200 20" stroke="#93c5fd" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── ROW 3: FULL WIDTH PRESENT USERS TABLE ── */}
      <div className="v2-table-card">
        <div className="v2-table-header">
          <div className="v2-table-header-left">
            <div className="v2-table-icon-badge">
              <FiUsers className="v2-table-badge-icon" />
            </div>
            <div>
              <h3 className="v2-table-title">Present Users – Last Update</h3>
              <p className="v2-table-subtitle">
                See what your present team members are working on right now.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="v2-view-all-btn"
            onClick={openPresentUsersModal}
          >
            View All Present Users <FiArrowRight className="v2-view-all-arrow" />
          </button>
        </div>

        <div className="v2-table-wrapper">
          <table className="v2-table">
            <thead>
              <tr>
                <th className="v2-th is-user">User</th>
                <th className="v2-th is-task">Current Task</th>
                <th className="v2-th is-update">Last Update</th>
                <th className="v2-th is-time">Last Update Time</th>
                <th className="v2-th is-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {presentUsersList.slice(0, 4).map((person) => (
                <tr key={person.id} className="v2-tr">
                  {/* User Column */}
                  <td className="v2-td is-user-cell">
                    <div className="v2-user-info">
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="v2-user-avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="v2-avatar-fallback" style={{ display: 'none' }}>
                        {person.initials}
                      </div>
                      <div>
                        <div className="v2-user-name">{person.name}</div>
                        <div className="v2-user-role">{person.role}</div>
                      </div>
                    </div>
                  </td>

                  {/* Current Task */}
                  <td className="v2-td is-task-cell">
                    {person.task ? (
                      <div className="v2-task-bullet-row">
                        <span
                          className="v2-task-dot"
                          style={{ backgroundColor: person.taskColor || '#2563eb' }}
                        />
                        <span className="v2-task-text">{person.task}</span>
                      </div>
                    ) : (
                      <span className="v2-muted-dash">-</span>
                    )}
                  </td>

                  {/* Last Update */}
                  <td className="v2-td is-update-cell">
                    <div className="v2-update-row">
                      {person.task && <FiMessageSquare className="v2-chat-icon" />}
                      <span className={person.task ? 'v2-update-text' : 'v2-update-muted'}>
                        {person.lastUpdate}
                      </span>
                    </div>
                  </td>

                  {/* Last Update Time */}
                  <td className="v2-td is-time-cell">
                    {person.time ? (
                      <span className="v2-time-text">{person.time}</span>
                    ) : (
                      <span className="v2-muted-dash">-</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="v2-td is-status-cell">
                    <span className={`v2-status-pill is-${person.statusType}`}>
                      <span className="v2-status-dot" /> {person.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ROW 4: 3 BOTTOM CARDS (PENDING LEAVES, PENDING ASSETS, RECENT ALERTS) ── */}
      <div className="v2-bottom-three-grid">
        {/* Card 1: Pending Leave Requests */}
        <div className="v2-mini-card is-clickable" {...getCardInteractionProps(openLeavesModal, 'Open pending leave requests')}>
              <div className="v2-mini-card-header">
                <div className="v2-mini-header-left">
                  <div className="v2-mini-icon-box is-green">
                    <MdOutlineEventNote />
                  </div>
              <h3 className="v2-mini-card-title">Pending Leave Requests</h3>
            </div>
            <button
              type="button"
              className="v2-mini-view-all"
              onClick={openLeavesModal}
            >
              View All <FiArrowRight className="v2-mini-arrow" />
            </button>
          </div>

          <div className="v2-mini-table-wrap">
            <table className="v2-mini-table">
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Employee</th>
                  <th style={{ width: '24%' }}>Leave Type</th>
                  <th style={{ width: '19%' }}>From</th>
                  <th style={{ width: '19%' }}>To</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeavesList.length > 0 ? (
                  pendingLeavesList.slice(0, 2).map((leave) => (
                    <tr key={leave.id}>
                      <td>
                        <div className="v2-mini-user">
                          <img
                            src={leave.avatar}
                            alt={leave.name}
                            className="v2-mini-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="v2-mini-fallback" style={{ display: 'none' }}>
                            {leave.initials}
                          </div>
                          <span className="v2-mini-name">{leave.name}</span>
                        </div>
                      </td>
                      <td className="v2-mini-cell-subtle">{leave.leaveType}</td>
                      <td className="v2-mini-cell-subtle">{leave.from}</td>
                      <td className="v2-mini-cell-subtle">{leave.to}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="v2-pending-badge">Pending</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="v2-modal-empty-state">
                      No pending leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Pending Asset Requests */}
        <div className="v2-mini-card is-clickable" {...getCardInteractionProps(openAssetsModal, 'Open pending asset requests')}>
          <div className="v2-mini-card-header">
            <div className="v2-mini-header-left">
              <div className="v2-mini-icon-box is-purple">
                <FiPackage />
              </div>
              <h3 className="v2-mini-card-title">Pending Asset Requests</h3>
            </div>
            <button
              type="button"
              className="v2-mini-view-all"
              onClick={openAssetsModal}
            >
              View All <FiArrowRight className="v2-mini-arrow" />
            </button>
          </div>

          <div className="v2-mini-table-wrap">
            <table className="v2-mini-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Employee</th>
                  <th style={{ width: '30%' }}>Asset Type</th>
                  <th style={{ width: '30%' }}>Requested On</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingAssetsList.length > 0 ? (
                  pendingAssetsList.slice(0, 2).map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <div className="v2-mini-user">
                          <img
                            src={asset.avatar}
                            alt={asset.name}
                            className="v2-mini-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="v2-mini-fallback" style={{ display: 'none' }}>
                            {asset.initials}
                          </div>
                          <span className="v2-mini-name">{asset.name}</span>
                        </div>
                      </td>
                      <td className="v2-mini-cell-subtle">{asset.assetType}</td>
                      <td className="v2-mini-cell-subtle">{asset.requestedOn}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="v2-pending-badge">Pending</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="v2-modal-empty-state">
                      No pending asset requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Recent Alerts */}
        <div className="v2-mini-card is-clickable" {...getCardInteractionProps(openAlertsModal, 'Open recent alerts')}>
          <div className="v2-mini-card-header">
            <div className="v2-mini-header-left">
              <div className="v2-mini-icon-box is-red">
                <FiBell />
              </div>
              <h3 className="v2-mini-card-title">Recent Alerts</h3>
            </div>
            <button
              type="button"
              className="v2-mini-view-all"
              onClick={openAlertsModal}
            >
              View All <FiArrowRight className="v2-mini-arrow" />
            </button>
          </div>

          <div className="v2-alerts-list">
            {alertsList.length > 0 ? (
              alertsList.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`v2-alert-item is-${alert.type}`}>
                  <div className="v2-alert-icon-wrap">
                    {alert.type === 'danger' && <FiBell className="v2-alert-icon" />}
                    {alert.type === 'warning' && <FiAlertTriangle className="v2-alert-icon" />}
                    {alert.type === 'info' && <FiInfo className="v2-alert-icon" />}
                  </div>
                  <div className="v2-alert-content">
                    <p className="v2-alert-text">{alert.title}</p>
                  </div>
                  <div className="v2-alert-time">{alert.time}</div>
                </div>
              ))
            ) : (
              <div className="v2-modal-empty-state">No recent alerts found.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 5: BOTTOM HORIZONTAL PULSE SUMMARY STRIP ── */}
      <div className="v2-pulse-summary-bar">
        {/* Stat 1: Total Users */}
        <div className="v2-pulse-item">
          <div className="v2-pulse-icon is-purple-bg">
            <MdOutlineGroups className="v2-pulse-icon-fg is-purple-fg" />
          </div>
          <div className="v2-pulse-meta">
            <span className="v2-pulse-val">{metrics.totalUsers}</span>
            <span className="v2-pulse-lbl">Total Users</span>
          </div>
        </div>

        {/* Stat 2: On Duty */}
        <div className="v2-pulse-item">
          <div className="v2-pulse-icon is-green-bg">
            <MdCheckCircleOutline className="v2-pulse-icon-fg is-green-fg" />
          </div>
          <div className="v2-pulse-meta">
            <span className="v2-pulse-val">{metrics.onDuty}</span>
            <span className="v2-pulse-lbl">On Duty</span>
          </div>
        </div>

        {/* Stat 3: Absent Today */}
        <div className="v2-pulse-item">
          <div className="v2-pulse-icon is-red-bg">
            <FiUser className="v2-pulse-icon-fg is-red-fg" />
          </div>
          <div className="v2-pulse-meta">
            <span className="v2-pulse-val">{metrics.absentToday}</span>
            <span className="v2-pulse-lbl">Absent Today</span>
          </div>
        </div>

        {/* Stat 4: On Leave */}
        <div className="v2-pulse-item">
          <div className="v2-pulse-icon is-orange-bg">
            <MdOutlineEventNote className="v2-pulse-icon-fg is-orange-fg" />
          </div>
          <div className="v2-pulse-meta">
            <span className="v2-pulse-val">{metrics.onLeave}</span>
            <span className="v2-pulse-lbl">On Leave</span>
          </div>
        </div>

        {/* Stat 5: Asset Requests */}
        <div className="v2-pulse-item">
          <div className="v2-pulse-icon is-purple-bg">
            <FiPackage className="v2-pulse-icon-fg is-purple-fg" />
          </div>
          <div className="v2-pulse-meta">
            <span className="v2-pulse-val">{metrics.assetRequests}</span>
            <span className="v2-pulse-lbl">Asset Requests</span>
          </div>
        </div>

        {/* Stat 6: Unseen Alerts */}
        <div className="v2-pulse-item">
          <div className="v2-pulse-icon is-blue-bg">
            <FiBell className="v2-pulse-icon-fg is-blue-fg" />
          </div>
          <div className="v2-pulse-meta">
            <span className="v2-pulse-val">{metrics.unseenAlertCount}</span>
            <span className="v2-pulse-lbl">Unseen Alerts</span>
          </div>
        </div>

        {/* Stat 7: Attendance Rate with Gauge & Sparkline */}
        <div className="v2-pulse-item is-attendance-rate">
          <div className="v2-rate-gauge-wrap">
            <span className="v2-rate-label">Attendance Rate</span>
            <div className="v2-rate-content">
              <div className="v2-rate-ring">
                <svg viewBox="0 0 36 36" className="v2-ring-svg">
                  <path
                    className="v2-ring-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="v2-ring-fill"
                    strokeDasharray={`${metrics.attendanceRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
              <span className="v2-rate-percent">{metrics.attendanceRate}%</span>
            </div>
          </div>
          <div className="v2-rate-sparkline">
            <svg viewBox="0 0 70 24" fill="none" className="v2-sparkline-svg">
              <path d="M0 16 Q 15 6, 30 14 T 55 4 T 70 12" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── POPUP MODAL 1: ALL PRESENT USERS ── */}
      {showAllUsersModal && (
        <div className="v2-modal-overlay" onClick={() => setShowAllUsersModal(false)}>
          <div className="v2-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="v2-modal-header">
              <div className="v2-modal-header-left">
                <div className="v2-modal-icon-badge">
                  <FiUsers />
                </div>
                <div>
                  <div className="v2-modal-title-row">
                    <h3 className="v2-modal-title">All Present Users – Live Updates</h3>
                    <span className="v2-modal-count-badge">{presentUsersList.length} Active Users</span>
                  </div>
                  <p className="v2-modal-subtitle">
                    Real-time task tracking and live work status for all present team members.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="v2-modal-close-btn"
                onClick={() => setShowAllUsersModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="v2-modal-search-bar">
              <FiSearch className="v2-modal-search-icon" />
              <input
                type="text"
                placeholder="Search by name, role, task, or remark..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="v2-modal-search-input"
                autoFocus
              />
              {modalSearchQuery && (
                <button
                  type="button"
                  className="v2-modal-clear-search"
                  onClick={() => setModalSearchQuery('')}
                >
                  <FiX />
                </button>
              )}
            </div>

            {/* Modal Table Body */}
            <div className="v2-modal-body">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th className="v2-th is-user">User</th>
                    <th className="v2-th is-task">Current Task</th>
                    <th className="v2-th is-update">Last Update</th>
                    <th className="v2-th is-time">Last Update Time</th>
                    <th className="v2-th is-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModalUsers.length > 0 ? (
                    filteredModalUsers.map((person) => (
                      <tr key={person.id} className="v2-tr">
                        {/* User Column */}
                        <td className="v2-td is-user-cell">
                          <div className="v2-user-info">
                            <img
                              src={person.avatar}
                              alt={person.name}
                              className="v2-user-avatar"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <div className="v2-avatar-fallback" style={{ display: 'none' }}>
                              {person.initials}
                            </div>
                            <div>
                              <div className="v2-user-name">{person.name}</div>
                              <div className="v2-user-role">{person.role}</div>
                            </div>
                          </div>
                        </td>

                        {/* Current Task */}
                        <td className="v2-td is-task-cell">
                          {person.task ? (
                            <div className="v2-task-bullet-row">
                              <span
                                className="v2-task-dot"
                                style={{ backgroundColor: person.taskColor || '#2563eb' }}
                              />
                              <span className="v2-task-text">{person.task}</span>
                            </div>
                          ) : (
                            <span className="v2-muted-dash">-</span>
                          )}
                        </td>

                        {/* Last Update */}
                        <td className="v2-td is-update-cell">
                          <div className="v2-update-row">
                            {person.task && <FiMessageSquare className="v2-chat-icon" />}
                            <span className={person.task ? 'v2-update-text' : 'v2-update-muted'}>
                              {person.lastUpdate}
                            </span>
                          </div>
                        </td>

                        {/* Last Update Time */}
                        <td className="v2-td is-time-cell">
                          {person.time ? (
                            <span className="v2-time-text">{person.time}</span>
                          ) : (
                            <span className="v2-muted-dash">-</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="v2-td is-status-cell">
                          <span className={`v2-status-pill is-${person.statusType}`}>
                            <span className="v2-status-dot" />
                            {person.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="v2-modal-empty-state">
                        No present users found matching &quot;{modalSearchQuery}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="v2-modal-footer">
              <span className="v2-modal-footer-count">
                Showing {filteredModalUsers.length} of {presentUsersList.length} total present users
              </span>
              <button
                type="button"
                className="v2-modal-btn-close"
                onClick={() => setShowAllUsersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP MODAL 2: ALL PENDING LEAVE REQUESTS ── */}
      {showAbsentModal && (
        <div className="v2-modal-overlay" onClick={() => setShowAbsentModal(false)}>
          <div className="v2-modal-container is-absent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="v2-modal-header">
              <div className="v2-modal-header-left">
                <div className="v2-modal-icon-badge is-red-bg-badge">
                  <FiUser />
                </div>
                <div>
                  <div className="v2-modal-title-row">
                    <h3 className="v2-modal-title">All Absent Employees</h3>
                    <span className="v2-modal-count-badge is-red-badge-pill">
                      {absentUsersList.length} Absent
                    </span>
                  </div>
                  <p className="v2-modal-subtitle">
                    Employees not marked present in today&apos;s attendance snapshot.
                    <span style={{ display: 'block', marginTop: 4 }}>
                      Total workforce: {metrics.totalUsers} people | Attendance rate: {metrics.attendanceRate}%
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="v2-modal-close-btn"
                onClick={() => setShowAbsentModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="v2-modal-search-bar">
              <FiSearch className="v2-modal-search-icon" />
              <input
                type="text"
                placeholder="Search by name, role, department, email, or attendance status..."
                value={absentSearchQuery}
                onChange={(e) => setAbsentSearchQuery(e.target.value)}
                className="v2-modal-search-input"
                autoFocus
              />
              {absentSearchQuery && (
                <button
                  type="button"
                  className="v2-modal-clear-search"
                  onClick={() => setAbsentSearchQuery('')}
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="v2-modal-body">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th className="v2-th">Employee</th>
                    <th className="v2-th">Role / Department</th>
                    <th className="v2-th">Attendance Status</th>
                    <th className="v2-th">Record Details</th>
                    <th className="v2-th">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsentUsers.length > 0 ? (
                    filteredAbsentUsers.map((person) => (
                      <tr key={person.id} className="v2-tr">
                        <td className="v2-td">
                          <div className="v2-user-info">
                            <img
                              src={person.avatar}
                              alt={person.name}
                              className="v2-user-avatar"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <div className="v2-avatar-fallback" style={{ display: 'none' }}>
                              {person.initials}
                            </div>
                            <div>
                              <div className="v2-user-name">{person.name}</div>
                              <div className="v2-user-role">{person.email || 'No email available'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="v2-td">
                          <div className="v2-update-text">{person.role || '-'}</div>
                          <div className="v2-update-muted">{person.department || 'No department assigned'}</div>
                        </td>
                        <td className="v2-td">
                          <span className={`v2-status-pill is-${person.statusType === 'warning' ? 'warning' : 'error'}`}>
                            <span className="v2-status-dot" />
                            {person.attendanceStatus || 'Absent'}
                          </span>
                          <div className="v2-update-muted" style={{ marginTop: 6 }}>
                            {person.attendanceNote}
                          </div>
                        </td>
                        <td className="v2-td">
                          <div className="v2-update-text">
                            {person.recordDetails || 'No in/out record available'}
                          </div>
                        </td>
                        <td className="v2-td">
                          <div className="v2-update-text">{person.email || '-'}</div>
                          <div className="v2-update-muted">
                            {person.hasAttendanceRecord ? 'Attendance record exists' : 'No attendance entry found'}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="v2-modal-empty-state">
                        No absent employees found matching &quot;{absentSearchQuery}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="v2-modal-footer">
              <span className="v2-modal-footer-count">
                Showing {filteredAbsentUsers.length} of {absentUsersList.length} absent employees today
              </span>
              <button
                type="button"
                className="v2-modal-btn-close"
                onClick={() => setShowAbsentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeavesModal && (
        <div className="v2-modal-overlay" onClick={() => setShowLeavesModal(false)}>
          <div className="v2-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="v2-modal-header">
              <div className="v2-modal-header-left">
                <div className="v2-modal-icon-badge is-green-bg-badge">
                  <MdOutlineEventNote />
                </div>
                <div>
                  <div className="v2-modal-title-row">
                    <h3 className="v2-modal-title">All Pending Leave Requests</h3>
                    <span className="v2-modal-count-badge is-green-badge-pill">
                      {pendingLeavesList.length} Pending Requests
                    </span>
                  </div>
                  <p className="v2-modal-subtitle">
                    Review and manage pending leave applications submitted by team members.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="v2-modal-close-btn"
                onClick={() => setShowLeavesModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="v2-modal-search-bar">
              <FiSearch className="v2-modal-search-icon" />
              <input
                type="text"
                placeholder="Search by employee, leave type, department, or reason..."
                value={leavesSearchQuery}
                onChange={(e) => setLeavesSearchQuery(e.target.value)}
                className="v2-modal-search-input"
                autoFocus
              />
              {leavesSearchQuery && (
                <button
                  type="button"
                  className="v2-modal-clear-search"
                  onClick={() => setLeavesSearchQuery('')}
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="v2-modal-body">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th className="v2-th">Employee</th>
                    <th className="v2-th">Leave Type</th>
                    <th className="v2-th">Duration</th>
                    <th className="v2-th">From & To Dates</th>
                    <th className="v2-th">Reason</th>
                    <th className="v2-th">Applied On</th>
                    <th className="v2-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((leave) => (
                      <tr key={leave.id} className="v2-tr">
                        <td className="v2-td">
                          <div className="v2-user-info">
                            <img
                              src={leave.avatar}
                              alt={leave.name}
                              className="v2-user-avatar"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <div className="v2-avatar-fallback" style={{ display: 'none' }}>
                              {leave.initials}
                            </div>
                            <div>
                              <div className="v2-user-name">{leave.name}</div>
                              <div className="v2-user-role">{leave.role} • {leave.department}</div>
                            </div>
                          </div>
                        </td>
                        <td className="v2-td">
                          <span className="v2-tag-pill is-leave-tag">{leave.leaveType}</span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-highlight-text">{leave.days}</span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-date-range-text">{leave.from} – {leave.to}</span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-reason-text">{leave.reason}</span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-muted-date">{leave.appliedOn}</span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-pending-badge">Pending</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="v2-modal-empty-state">
                        No leave requests found matching &quot;{leavesSearchQuery}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="v2-modal-footer">
              <span className="v2-modal-footer-count">
                Showing {filteredLeaves.length} of {pendingLeavesList.length} total leave requests
              </span>
              <button
                type="button"
                className="v2-modal-btn-close"
                onClick={() => setShowLeavesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP MODAL 3: ALL PENDING ASSET REQUESTS ── */}
      {showAssetsModal && (
        <div className="v2-modal-overlay" onClick={() => setShowAssetsModal(false)}>
          <div className="v2-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="v2-modal-header">
              <div className="v2-modal-header-left">
                <div className="v2-modal-icon-badge is-purple-bg-badge">
                  <FiPackage />
                </div>
                <div>
                  <div className="v2-modal-title-row">
                    <h3 className="v2-modal-title">All Pending Asset Requests</h3>
                    <span className="v2-modal-count-badge is-purple-badge-pill">
                      {pendingAssetsList.length} Pending Requests
                    </span>
                  </div>
                  <p className="v2-modal-subtitle">
                    Review and allocate hardware equipment and peripheral requests.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="v2-modal-close-btn"
                onClick={() => setShowAssetsModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="v2-modal-search-bar">
              <FiSearch className="v2-modal-search-icon" />
              <input
                type="text"
                placeholder="Search by employee, asset type, priority, or specifications..."
                value={assetsSearchQuery}
                onChange={(e) => setAssetsSearchQuery(e.target.value)}
                className="v2-modal-search-input"
                autoFocus
              />
              {assetsSearchQuery && (
                <button
                  type="button"
                  className="v2-modal-clear-search"
                  onClick={() => setAssetsSearchQuery('')}
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="v2-modal-body">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th className="v2-th">Employee</th>
                    <th className="v2-th">Asset Type</th>
                    <th className="v2-th">Specifications / Item</th>
                    <th className="v2-th">Reason</th>
                    <th className="v2-th">Priority</th>
                    <th className="v2-th">Requested On</th>
                    <th className="v2-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <tr key={asset.id} className="v2-tr">
                        <td className="v2-td">
                          <div className="v2-user-info">
                            <img
                              src={asset.avatar}
                              alt={asset.name}
                              className="v2-user-avatar"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <div className="v2-avatar-fallback" style={{ display: 'none' }}>
                              {asset.initials}
                            </div>
                            <div>
                              <div className="v2-user-name">{asset.name}</div>
                              <div className="v2-user-role">{asset.role} • {asset.department}</div>
                            </div>
                          </div>
                        </td>
                        <td className="v2-td">
                          <span className="v2-tag-pill is-asset-tag">{asset.assetType}</span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-specs-text">{asset.specs}</span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-reason-text">{asset.reason}</span>
                        </td>
                        <td className="v2-td">
                          <span className={`v2-priority-pill is-${asset.priority?.toLowerCase()}`}>
                            {asset.priority}
                          </span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-muted-date">{asset.requestedOn}</span>
                        </td>
                        <td className="v2-td">
                          <span className="v2-pending-badge">Pending</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="v2-modal-empty-state">
                        No asset requests found matching &quot;{assetsSearchQuery}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="v2-modal-footer">
              <span className="v2-modal-footer-count">
                Showing {filteredAssets.length} of {pendingAssetsList.length} total asset requests
              </span>
              <button
                type="button"
                className="v2-modal-btn-close"
                onClick={() => setShowAssetsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP MODAL 4: ALL RECENT ALERTS ── */}
      {showAlertsModal && (
        <div className="v2-modal-overlay" onClick={() => setShowAlertsModal(false)}>
          <div className="v2-modal-container is-alerts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="v2-modal-header">
              <div className="v2-modal-header-left">
                <div className="v2-modal-icon-badge is-red-bg-badge">
                  <FiBell />
                </div>
                <div>
                  <div className="v2-modal-title-row">
                    <h3 className="v2-modal-title">All System & Company Alerts</h3>
                    <span className="v2-modal-count-badge is-red-badge-pill">
                      {alertsList.length} Alerts
                    </span>
                  </div>
                  <p className="v2-modal-subtitle">
                    Important broadcast notices, holidays, timesheets, and system status updates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="v2-modal-close-btn"
                onClick={() => setShowAlertsModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="v2-modal-search-bar">
              <FiSearch className="v2-modal-search-icon" />
              <input
                type="text"
                placeholder="Search alerts by title, description, or category..."
                value={alertsSearchQuery}
                onChange={(e) => setAlertsSearchQuery(e.target.value)}
                className="v2-modal-search-input"
                autoFocus
              />
              {alertsSearchQuery && (
                <button
                  type="button"
                  className="v2-modal-clear-search"
                  onClick={() => setAlertsSearchQuery('')}
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="v2-modal-body">
              <div className="v2-modal-alerts-list">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => (
                    <div key={alert.id} className={`v2-modal-alert-card is-${alert.type}`}>
                      <div className="v2-modal-alert-icon-col">
                        {alert.type === 'danger' && <FiBell className="v2-modal-alert-icon is-danger-icon" />}
                        {alert.type === 'warning' && <FiAlertTriangle className="v2-modal-alert-icon is-warning-icon" />}
                        {alert.type === 'info' && <FiInfo className="v2-modal-alert-icon is-info-icon" />}
                      </div>
                      <div className="v2-modal-alert-content-col">
                        <div className="v2-modal-alert-top-meta">
                          <span className="v2-modal-alert-category">{alert.category}</span>
                          <span className={`v2-priority-pill is-${alert.priority?.toLowerCase()}`}>
                            {alert.priority}
                          </span>
                          <span className="v2-modal-alert-timestamp">{alert.date} • {alert.time}</span>
                        </div>
                        <h4 className="v2-modal-alert-title">{alert.title}</h4>
                        <p className="v2-modal-alert-description">{alert.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="v2-modal-empty-state">
                    No alerts found matching &quot;{alertsSearchQuery}&quot;
                  </div>
                )}
              </div>
            </div>

            <div className="v2-modal-footer">
              <span className="v2-modal-footer-count">
                Showing {filteredAlerts.length} of {alertsList.length} total alerts
              </span>
              <button
                type="button"
                className="v2-modal-btn-close"
                onClick={() => setShowAlertsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP MODAL 5: CREATE ALERT MODAL ── */}
      {showCreateAlertModal && (
        <div className="v2-modal-overlay" onClick={() => setShowCreateAlertModal(false)}>
          <div className="v2-modal-container is-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="v2-modal-header">
              <div className="v2-modal-header-left">
                <div className="v2-modal-icon-badge is-blue-bg-badge">
                  <FiPlus />
                </div>
                <div>
                  <div className="v2-modal-title-row">
                    <h3 className="v2-modal-title">Create New Alert</h3>
                    <span className="v2-modal-count-badge is-blue-badge-pill">Broadcast</span>
                  </div>
                  <p className="v2-modal-subtitle">
                    Post a system-wide or team notice to broadcast immediately.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="v2-modal-close-btn"
                onClick={() => setShowCreateAlertModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} className="v2-modal-form">
              <div className="v2-form-group">
                <label className="v2-form-label">
                  Alert Title <span className="v2-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Server Maintenance, Holiday Notice..."
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  className="v2-form-input"
                  autoFocus
                />
              </div>

              <div className="v2-form-row">
                <div className="v2-form-group">
                  <label className="v2-form-label">Alert Type / Tone</label>
                  <select
                    value={alertForm.type}
                    onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                    className="v2-form-select"
                  >
                    <option value="danger">Urgent / Danger (Red)</option>
                    <option value="warning">Warning / Notice (Amber)</option>
                    <option value="info">Information / Normal (Blue)</option>
                  </select>
                </div>

                <div className="v2-form-group">
                  <label className="v2-form-label">Category</label>
                  <select
                    value={alertForm.category}
                    onChange={(e) => setAlertForm({ ...alertForm, category: e.target.value })}
                    className="v2-form-select"
                  >
                    <option value="General Notice">General Notice</option>
                    <option value="System Maintenance">System Maintenance</option>
                    <option value="Holiday Notice">Holiday Notice</option>
                    <option value="Timesheet Reminder">Timesheet Reminder</option>
                    <option value="Payroll & Finance">Payroll & Finance</option>
                    <option value="Security Update">Security Update</option>
                  </select>
                </div>

                <div className="v2-form-group">
                  <label className="v2-form-label">Priority</label>
                  <select
                    value={alertForm.priority}
                    onChange={(e) => setAlertForm({ ...alertForm, priority: e.target.value })}
                    className="v2-form-select"
                  >
                    <option value="High">High Priority</option>
                    <option value="Important">Important</option>
                    <option value="Medium">Medium</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="v2-form-group">
                <label className="v2-form-label">Description / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Provide all relevant details, impact, and action items for team members..."
                  value={alertForm.description}
                  onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                  className="v2-form-textarea"
                />
              </div>

              <div className="v2-modal-footer is-form-footer">
                <button
                  type="button"
                  className="v2-modal-btn-cancel"
                  onClick={() => setShowCreateAlertModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="v2-modal-btn-submit is-blue"
                >
                  <FiPlus /> Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── POPUP MODAL 6: ASSIGN TASK MODAL ── */}
      {showAssignTaskModal && (
        <div className="v2-modal-overlay" onClick={() => setShowAssignTaskModal(false)}>
          <div className="v2-modal-container is-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="v2-modal-header">
              <div className="v2-modal-header-left">
                <div className="v2-modal-icon-badge is-green-bg-badge">
                  <MdCheckCircleOutline />
                </div>
                <div>
                  <div className="v2-modal-title-row">
                    <h3 className="v2-modal-title">Assign New Task</h3>
                    <span className="v2-modal-count-badge is-green-badge-pill">Direct Assignment</span>
                  </div>
                  <p className="v2-modal-subtitle">
                    Delegate a task to any present team member with priority and instructions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="v2-modal-close-btn"
                onClick={() => setShowAssignTaskModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAssignTaskSubmit} className="v2-modal-form">
              <div className="v2-form-group">
                <label className="v2-form-label">
                  Task Title <span className="v2-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Q3 Payroll, Design Landing Page Hero..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="v2-form-input"
                  autoFocus
                />
              </div>

              <div className="v2-form-row">
                <div className="v2-form-group">
                  <label className="v2-form-label">
                    Assign To Employee <span className="v2-required">*</span>
                  </label>
                  <select
                    value={taskForm.assigneeId || presentUsersList[0]?.id || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="v2-form-select"
                  >
                    {presentUsersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="v2-form-group">
                  <label className="v2-form-label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="v2-form-select"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div className="v2-form-group">
                  <label className="v2-form-label">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="v2-form-input"
                  />
                </div>
              </div>

              <div className="v2-form-group">
                <label className="v2-form-label">Task Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, deliverables, or checklist items..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="v2-form-textarea"
                />
              </div>

              <div className="v2-modal-footer is-form-footer">
                <button
                  type="button"
                  className="v2-modal-btn-cancel"
                  onClick={() => setShowAssignTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="v2-modal-btn-submit is-green"
                >
                  <MdCheckCircleOutline /> Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
