
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UserDashboard.css';
import './UserDashboardMobileV2.css';
import useIsMobile from '../../hooks/useIsMobile';
import CIISLoader from '../../Loader/CIISLoader';
import {
  CirclePlus, Umbrella, BriefcaseBusiness, UserPlus, Folder, CalendarDays,
  NotebookPen, Clock3, Play, ClipboardCheck, Video, Coffee, CheckCircle2,
  LogOut, LayoutDashboard, Smartphone, CalendarClock, Phone, Sparkles
} from 'lucide-react';

import {
  FiClock, FiCalendar, FiChevronLeft, FiChevronRight,
  FiPlay, FiSquare, FiRefreshCw, FiBriefcase, FiUser,
  FiCheckCircle, FiAlertCircle, FiTrendingUp, FiActivity,
  FiX, FiAlertTriangle, FiCamera, FiPlus, FiUmbrella, FiBox,
  FiUserPlus, FiFolder, FiMessageSquare, FiZap, FiSun
} from 'react-icons/fi';
import {
  MdWork, MdOutlineCrop54, MdBeachAccess,
  MdOutlineWatchLater, MdToday, MdAccessTime, MdOutlineAlarm,
  MdCelebration
} from 'react-icons/md';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatTime = seconds => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const getWeatherLabel = code => {
  if (code === 0) return 'Clear';
  if ([1, 2].includes(code)) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Current weather';
};

const getCalendarGrid = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  let week = Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  while (week.length && week.length < 7) week.push(null);
  if (week.length) grid.push(week);

  return grid;
};

const getValueId = value => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || value.userId || '');
  return String(value);
};

const getDisplayName = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(getDisplayName).filter(Boolean).join(', ');
  if (typeof value === 'object') return value.name || value.email || value.title || getValueId(value);
  return String(value);
};

const getCurrentUserId = user => getValueId(user?._id || user?.id || user?.userId || user?.user?._id || user?.user?.id);

const getDashboardCacheKey = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = getCurrentUserId(storedUser);
    return userId ? `ciis-user-dashboard:${userId}` : '';
  } catch {
    return '';
  }
};

const readDashboardCache = () => {
  const key = getDashboardCacheKey();
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
};

const writeDashboardCache = patch => {
  const key = getDashboardCacheKey();
  if (!key) return;
  try {
    const current = readDashboardCache();
    localStorage.setItem(key, JSON.stringify({ ...current, ...patch, updatedAt: Date.now() }));
  } catch {
    // Storage may be disabled or full; live dashboard data still works normally.
  }
};

const normalizeAttendanceStatus = status => {
  const normalized = String(status || '').trim().toUpperCase().replace(/[-_]/g, ' ');
  if (normalized === 'HALFDAY' || normalized === 'HALF DAY') return 'HALF DAY';
  return normalized;
};

const normalizeAttendanceRecord = record => ({
  ...record,
  status: normalizeAttendanceStatus(record?.status || 'ABSENT'),
});

const pickTaskRecords = data => {
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.data?.tasks)) return data.data.tasks;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};


const mapTaskToActivity = task => ({
  ...task,
  type: 'task',
  date: task.updatedAt || task.createdAt || task.dueDateTime || task.dueDate,
  title: task.title || task.name || 'Task activity',
  status: task.userStatus || task.overallStatus || task.status || (task.completed ? 'completed' : 'pending'),
  assignedTo: Array.isArray(task.assignedUsers)
    ? task.assignedUsers.map(item => item?.name || item?.email).filter(Boolean).join(', ')
    : getDisplayName(task.assignee || task.assignedTo || ''),
});

const formatClockTime = value => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getTrackedBreakTime = attendance => {
  const value = attendance?.breakTime || attendance?.totalBreakTime || attendance?.breakDuration;
  if (value === undefined || value === null || value === '') return 'Not tracked';
  return typeof value === 'number' ? `${value}m` : String(value);
};


const StatsLoader = () => (
  <div className="stats-loader-container">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="stat-skeleton-card">
        <div className="stat-skeleton-header">
          <div className="skeleton-icon-large"></div>
          <div className="skeleton-badge"></div>
        </div>
        <div className="skeleton-value"></div>
        <div className="skeleton-label"></div>
        <div className="skeleton-footer"></div>
      </div>
    ))}
  </div>
);

const CalendarLoader = () => (
  <div className="calendar-loader">
    <div className="calendar-spinner"></div>
    <p>Loading calendar data...</p>
  </div>
);

const ActivityLoader = () => (
  <div className="activity-loader-container">
    <div className="activity-loader-wrapper">
      <div className="activity-spinner"></div>
      <div className="activity-loader-text">
        <span className="loader-main-text">Fetching attendance records...</span>
        <span className="loader-sub-text">Please wait while we load your data</span>
      </div>
    </div>
  </div>
);

const RefreshOverlay = () => (
  <div className="activity-refresh-overlay">
    <div className="refresh-spinner-small"></div>
    <span>Updating...</span>
  </div>
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const initialDashboardSnapshot = useMemo(readDashboardCache, []);
  
  const [pageLoading, setPageLoading] = useState(true);
  
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [taskActivity, setTaskActivity] = useState([]);
  const [recentTaskEvents, setRecentTaskEvents] = useState([]);
  
  
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  
  const [loading, setLoading] = useState({
    attendance: false,
    leaves: false,
    status: false,
    jobRoles: false
  });
  const [recentActivity, setRecentActivity] = useState(() => Array.isArray(initialDashboardSnapshot.recentActivity) ? initialDashboardSnapshot.recentActivity : []);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [dashboardProjects, setDashboardProjects] = useState(() => Array.isArray(initialDashboardSnapshot.projects) ? initialDashboardSnapshot.projects : []);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState(null);
  const [quickForm, setQuickForm] = useState({});
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickTaskType, setQuickTaskType] = useState('personal');
  const [quickClients, setQuickClients] = useState([]);
  const [quickClientsLoading, setQuickClientsLoading] = useState(false);
  const [quickAssets, setQuickAssets] = useState([]);
  const [quickAssetsLoading, setQuickAssetsLoading] = useState(false);
  const [quickTeamMembers, setQuickTeamMembers] = useState([]);
  const [quickTeamLoading, setQuickTeamLoading] = useState(false);
  const [weather, setWeather] = useState({ loading: true, temperature: null, label: '' });
  const [focusStats, setFocusStats] = useState(() => initialDashboardSnapshot.focusStats
    ? { ...initialDashboardSnapshot.focusStats, loading: true }
    : { loading: true, dueToday: 0, inProgress: 0, completedToday: 0, dailyProgress: 0 });
  const [dashboardTaskStats, setDashboardTaskStats] = useState({ loading: true, total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 });
  const [hoveredProductivityDay, setHoveredProductivityDay] = useState(null);
  const [jobRoles, setJobRoles] = useState([]);
  const [jobRolesLoading, setJobRolesLoading] = useState(false);
  
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState('normal');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const videoRef = useRef(null);

  const [userJoinDate, setUserJoinDate] = useState(null);
  const [formattedJoinDate, setFormattedJoinDate] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  
  const user = useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }, []);

  const token = useMemo(() => localStorage.getItem('token'), []);
  
  const companyDetails = useMemo(() => {
    try {
      const details = localStorage.getItem('companyDetails');
      return details ? JSON.parse(details) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather({ loading: false, temperature: null, label: 'Weather unavailable' });
      return;
    }
    let active = true;
    const controller = new AbortController();
    const stopLoadingTimer = window.setTimeout(() => {
      if (!active) return;
      active = false;
      controller.abort();
      setWeather({ loading: false, temperature: null, label: 'Enable location for weather' });
    }, 10000);

    navigator.geolocation.getCurrentPosition(async position => {
      if (!active) return;
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=auto`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Weather request failed');
        const data = await response.json();
        const temperature = Number(data.current?.temperature_2m);
        if (!Number.isFinite(temperature)) throw new Error('Weather response is incomplete');
        if (active) setWeather({ loading: false, temperature: Math.round(temperature), label: getWeatherLabel(data.current?.weather_code) });
      } catch {
        if (active) setWeather({ loading: false, temperature: null, label: 'Weather unavailable' });
      } finally {
        window.clearTimeout(stopLoadingTimer);
      }
    }, () => {
      window.clearTimeout(stopLoadingTimer);
      if (active) setWeather({ loading: false, temperature: null, label: 'Enable location for weather' });
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 });
    return () => {
      active = false;
      window.clearTimeout(stopLoadingTimer);
      controller.abort();
    };
  }, []);

  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  
  const fetchInProgress = useRef({
    attendance: false,
    leaves: false,
    status: false,
    jobRoles: false,
    holidays: false,
    taskActivity: false
  });

  const abortControllerRef = useRef(null);
  const attendanceTimeoutRef = useRef(null);
  const leavesTimeoutRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const holidaysTimeoutRef = useRef(null);
  const initialLoadRef = useRef(false);

  
  useEffect(() => {
    if (user?.createdAt) {
      const joinDate = new Date(user.createdAt);
      setUserJoinDate(joinDate);
      
      const formatted = joinDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      setFormattedJoinDate(formatted);
    }
  }, [user?.createdAt]);

  const getCompanyId = useCallback(() => {
    return companyDetails?._id || 
           companyDetails?.id ||
           user?.company ||
           user?.companyId ||
           user?.companyDetails?._id;
  }, [companyDetails, user]);

  const isUserInCurrentCompany = useMemo(() => {
    if (!user) return false;
    if (!companyDetails) return Boolean(user.company || user.companyId || user.companyCode);

    const userCompanyCode = String(user.companyCode || user?.company?.companyCode || '').trim().toLowerCase();
    const selectedCompanyCode = String(companyDetails.companyCode || companyDetails.code || '').trim().toLowerCase();
    const userCompanyId = getValueId(user.company || user.companyId || user?.companyDetails);
    const selectedCompanyId = getValueId(companyDetails);

    if (userCompanyCode && selectedCompanyCode) return userCompanyCode === selectedCompanyCode;
    if (userCompanyId && selectedCompanyId) return userCompanyId === selectedCompanyId;
    return true;
  }, [user, companyDetails]);

  const isBeforeJoinDate = useCallback((date) => {
    if (!userJoinDate) return false;
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const joinDate = new Date(userJoinDate);
    joinDate.setHours(0, 0, 0, 0);
    return compareDate < joinDate;
  }, [userJoinDate]);

  const isMonthBeforeJoin = useCallback((year, month) => {
    if (!userJoinDate) return false;
    const joinYear = userJoinDate.getFullYear();
    const joinMonth = userJoinDate.getMonth();
    if (year < joinYear) return true;
    if (year === joinYear && month < joinMonth) return true;
    return false;
  }, [userJoinDate]);

  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    [attendanceTimeoutRef, leavesTimeoutRef, statusTimeoutRef, holidaysTimeoutRef].forEach(ref => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  }, []);

  
  const fetchJobRoles = useCallback(async () => {
    if (!isUserInCurrentCompany) return [];
    if (fetchInProgress.current.jobRoles) return [];
    
    const companyId = getCompanyId();
    if (!companyId) return [];
    
    setJobRolesLoading(true);
    fetchInProgress.current.jobRoles = true;
    
    try {
      const response = await axios.get(`/job-roles?company=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      let jobRolesData = [];
      if (response.data) {
        if (Array.isArray(response.data.jobRoles)) jobRolesData = response.data.jobRoles;
        else if (Array.isArray(response.data.data)) jobRolesData = response.data.data;
        else if (Array.isArray(response.data)) jobRolesData = response.data;
      }
      
      const formattedJobRoles = jobRolesData.map(role => ({
        _id: role._id || role.id || role.roleId,
        roleName: role.roleName || role.name || role.jobRole || role.title || '',
        roleNumber: role.roleNumber || role.roleNo || role.code || '',
      })).filter(role => role.roleName);
      
      setJobRoles(formattedJobRoles);
      
    } catch (error) {
      console.error('Job roles fetch error:', error);
      setJobRoles([]);
    } finally {
      setJobRolesLoading(false);
      fetchInProgress.current.jobRoles = false;
    }
  }, [getCompanyId, token, isUserInCurrentCompany]);

  
  const fetchHolidays = useCallback(async () => {
    if (!isUserInCurrentCompany) return;
    if (fetchInProgress.current.holidays) return;
    
    if (holidaysTimeoutRef.current) {
      clearTimeout(holidaysTimeoutRef.current);
    }

    holidaysTimeoutRef.current = setTimeout(async () => {
      if (fetchInProgress.current.holidays) return;
      
      fetchInProgress.current.holidays = true;
      setHolidaysLoading(true);

      try {
        
        const response = await axios.get('/holidays', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        
        if (response.data.success) {
          let holidaysData = response.data.holidays || [];
          
          
          if (userJoinDate) {
            holidaysData = holidaysData.filter(holiday => 
              !isBeforeJoinDate(new Date(holiday.date))
            );
          }
          
          setHolidays(holidaysData);
        }
      } catch (error) {
        console.error('Failed to load holidays:', error);
      } finally {
        setHolidaysLoading(false);
        fetchInProgress.current.holidays = false;
        holidaysTimeoutRef.current = null;
      }
    }, 300);

  }, [token, isUserInCurrentCompany, userJoinDate, isBeforeJoinDate]);

  
  const fetchAttendanceData = useCallback(async (force = false) => {
    if (!isUserInCurrentCompany) return;
    if (!force && fetchInProgress.current.attendance) return;
    
    if (attendanceTimeoutRef.current) {
      clearTimeout(attendanceTimeoutRef.current);
    }

    attendanceTimeoutRef.current = setTimeout(async () => {
      if (fetchInProgress.current.attendance) return;
      
      fetchInProgress.current.attendance = true;
      setLoading(prev => ({ ...prev, attendance: true }));

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await axios.get('/attendance/list', {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortControllerRef.current.signal,
          timeout: 15000
        });
        
        let data = response.data?.data || [];
        
        if (userJoinDate) {
          data = data.filter(record => !isBeforeJoinDate(record.date));
        }
        
        const normalizedData = data.map(normalizeAttendanceRecord);
        setAttendanceData(normalizedData);
        
        
        updateRecentActivity(normalizedData, holidays);
        
      } catch (error) {
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return;
        console.error('Failed to load attendance data:', error);
      } finally {
        setLoading(prev => ({ ...prev, attendance: false }));
        fetchInProgress.current.attendance = false;
        attendanceTimeoutRef.current = null;
      }
    }, 300);

  }, [token, isUserInCurrentCompany, userJoinDate, isBeforeJoinDate, holidays]);

  
  const fetchLeaveData = useCallback(async () => {
    if (!isUserInCurrentCompany) return;
    if (fetchInProgress.current.leaves) return;
    
    if (leavesTimeoutRef.current) {
      clearTimeout(leavesTimeoutRef.current);
    }

    leavesTimeoutRef.current = setTimeout(async () => {
      if (fetchInProgress.current.leaves) return;
      
      fetchInProgress.current.leaves = true;
      setLoading(prev => ({ ...prev, leaves: true }));

      try {
        const response = await axios.get('/leaves/status', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        let leaves = response.data?.leaves || [];
        
        if (userJoinDate) {
          leaves = leaves.filter(leave => 
            !isBeforeJoinDate(leave.startDate) && !isBeforeJoinDate(leave.endDate)
          );
        }
        
        setLeaveData(leaves);
        
      } catch (error) {
        console.error('Failed to load leave data:', error);
      } finally {
        setLoading(prev => ({ ...prev, leaves: false }));
        fetchInProgress.current.leaves = false;
        leavesTimeoutRef.current = null;
      }
    }, 300);

  }, [token, isUserInCurrentCompany, userJoinDate, isBeforeJoinDate]);

  
  const fetchCurrentStatus = useCallback(async () => {
    if (!isUserInCurrentCompany) {
      setIsRunning(false);
      return;
    }
    
    if (fetchInProgress.current.status) return;
    
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    statusTimeoutRef.current = setTimeout(async () => {
      if (fetchInProgress.current.status) return;
      
      fetchInProgress.current.status = true;
      setLoading(prev => ({ ...prev, status: true }));

      try {
        const response = await axios.get('/attendance/status', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        if (response.data?.isClockedIn) {
          const inTime = new Date(response.data.inTime);
          setTimer(Math.floor((Date.now() - inTime.getTime()) / 1000));
          setIsRunning(true);
        } else {
          setIsRunning(false);
          setTimer(0);
        }
        
      } catch (error) {
        console.error('Failed to load status:', error);
        setIsRunning(false);
        setTimer(0);
      } finally {
        setLoading(prev => ({ ...prev, status: false }));
        fetchInProgress.current.status = false;
        statusTimeoutRef.current = null;
      }
    }, 300);

  }, [token, isUserInCurrentCompany]);

  const fetchRecentTaskActivity = useCallback(async () => {
    if (!isUserInCurrentCompany) return;
    if (fetchInProgress.current.taskActivity) return;

    const userId = getCurrentUserId(user);
    if (!userId) {
      setTaskActivity([]);
      setRecentTaskEvents([]);
      return;
    }

    fetchInProgress.current.taskActivity = true;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 };
      const [tasksResult, logsResult] = await Promise.allSettled([
        axios.get(`/task/user/${userId}/all-tasks`, { ...config, params: { page: 1, limit: 50, period: 'all' } }),
        axios.get(`/task/user-activity/${userId}`, config)
      ]);

      const tasks = tasksResult.status === 'fulfilled'
        ? pickTaskRecords(tasksResult.value.data).map(mapTaskToActivity)
        : [];
      const logsData = logsResult.status === 'fulfilled'
        ? logsResult.value.data?.logs || logsResult.value.data?.data?.logs || []
        : [];
      const logs = logsData.map(log => ({
        type: 'task',
        taskId: log.task?._id || log.task || log.taskId,
        title: log.task?.title || log.description || log.action || 'Task activity',
        date: log.createdAt || log.updatedAt,
        assignedTo: log.user?.name || user?.name || '',
        status: log.action || log.status || ''
      }));

      if (tasksResult.status === 'rejected') console.error('Failed to load user tasks:', tasksResult.reason);
      if (logsResult.status === 'rejected') console.error('Failed to load task activity logs:', logsResult.reason);

      const todayKey = new Date().toDateString();
      const isToday = activity => {
        const date = new Date(activity.date);
        return !Number.isNaN(date.getTime()) && date.toDateString() === todayKey;
      };
      const allTaskEvents = [...logs, ...tasks]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .filter((event, index, events) => index === events.findIndex(candidate =>
          String(candidate.taskId || candidate._id || '') === String(event.taskId || event._id || '')
          && candidate.title === event.title
          && candidate.status === event.status
        ));
      const todayEvents = allTaskEvents.filter(isToday);

      setTaskActivity(tasks);
      setRecentTaskEvents((todayEvents.length ? todayEvents : allTaskEvents).slice(0, 10));
    } catch (error) {
      console.error('Failed to load recent task activity:', error);
      setTaskActivity([]);
      setRecentTaskEvents([]);
    } finally {
      fetchInProgress.current.taskActivity = false;
    }
  }, [token, isUserInCurrentCompany, user]);

  const fetchFocusStats = useCallback(async () => {
    const userId = getCurrentUserId(user);
    if (!userId || !isUserInCurrentCompany) {
      setFocusStats({ loading: false, dueToday: 0, inProgress: 0, completedToday: 0, dailyProgress: 0 });
      setDashboardTaskStats({ loading: false, total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 });
      return;
    }

    setFocusStats(current => ({ ...current, loading: true }));
    try {
      const config = { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 };
      const [todayResponse, allResponse] = await Promise.all([
        axios.get(`/task/user/${userId}/stats`, { ...config, params: { period: 'today' } }),
        axios.get(`/task/user/${userId}/stats`, { ...config, params: { period: 'all' } })
      ]);
      const today = todayResponse.data?.statusCounts || {};
      const all = allResponse.data?.statusCounts || {};
      const dueToday = Number(today.total) || 0;
      const completedToday = Number(today.completed?.count) || 0;
      setDashboardTaskStats({
        loading: false,
        total: Number(all.total) || 0,
        completed: Number(all.completed?.count) || 0,
        inProgress: Number(all.inProgress?.count) || 0,
        pending: Number(all.pending?.count) || 0,
        overdue: Number(all.overdue?.count) || 0
      });
      const nextFocusStats = {
        loading: false,
        dueToday,
        inProgress: Number(all.inProgress?.count) || 0,
        completedToday,
        dailyProgress: dueToday ? Math.round((completedToday / dueToday) * 100) : 0
      };
      setFocusStats(nextFocusStats);
      writeDashboardCache({ focusStats: nextFocusStats });
    } catch (error) {
      console.error('Failed to load dashboard focus stats:', error);
      setFocusStats(current => ({ ...current, loading: false }));
      setDashboardTaskStats(current => ({ ...current, loading: false }));
    }
  }, [isUserInCurrentCompany, token, user]);

  useEffect(() => {
    fetchFocusStats();
  }, [fetchFocusStats]);

  const fetchUpcomingMeetings = useCallback(async () => {
    const userId = getCurrentUserId(user);
    if (!userId || !isUserInCurrentCompany) return;
    try {
      const response = await axios.get(`/meetings/user/${userId}`, {
        params: { page: 1, limit: 100 },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      const records = Array.isArray(response.data)
        ? response.data
        : response.data?.data || response.data?.meetings || [];
      const now = new Date();
      const scheduled = records
        .map(meeting => ({
          ...meeting,
          scheduledAt: new Date(`${meeting.date}T${meeting.time || '00:00'}`)
        }))
        .filter(meeting => !Number.isNaN(meeting.scheduledAt.getTime()) && meeting.scheduledAt >= now && String(meeting.status || '').toLowerCase() !== 'cancelled')
        .sort((a, b) => a.scheduledAt - b.scheduledAt);
      setUpcomingMeetings(scheduled);
    } catch (error) {
      console.error('Failed to load upcoming meetings:', error);
      setUpcomingMeetings([]);
    }
  }, [user, token, isUserInCurrentCompany]);

  useEffect(() => {
    fetchUpcomingMeetings();
  }, [fetchUpcomingMeetings]);

  const fetchDashboardProjects = useCallback(async () => {
    if (!isUserInCurrentCompany) return;
    const companyCode = String(companyDetails?.companyCode || user?.companyCode || localStorage.getItem('companyCode') || '').trim();
    if (!companyCode) {
      setDashboardProjects([]);
      return;
    }

    setProjectsLoading(true);
    try {
      const response = await axios.get('/projects', {
        params: { companyCode, page: 1, limit: 100 },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      const data = response.data;
      const projects = Array.isArray(data) ? data
        : data?.items || data?.projects || data?.data?.items || data?.data?.projects || (Array.isArray(data?.data) ? data.data : []);
      const nextProjects = Array.isArray(projects) ? projects : [];
      setDashboardProjects(nextProjects);
      writeDashboardCache({ projects: nextProjects });
    } catch (error) {
      console.error('Failed to load dashboard projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  }, [companyDetails, isUserInCurrentCompany, token, user]);

  useEffect(() => {
    fetchDashboardProjects();
  }, [fetchDashboardProjects]);

  
  const updateRecentActivity = useCallback((attendance, holidayList, tasks = recentTaskEvents) => {
    
    const allActivities = [];
    const todayKey = new Date().toDateString();
    
    
    attendance.filter(record => {
      const recordDate = new Date(record.date || record.inTime || record.createdAt);
      return !Number.isNaN(recordDate.getTime()) && recordDate.toDateString() === todayKey;
    }).forEach(record => {
      const clockIn = record.inTime || record.checkInTime || record.clockIn || record.punchIn;
      const clockOut = record.outTime || record.checkOutTime || record.clockOut || record.punchOut;
      if (clockIn) allActivities.push({ ...record, type: 'clock-in', date: clockIn, title: 'Clock In', subtitle: 'Checked in from Web', status: 'PRESENT' });
      if (clockOut) allActivities.push({ ...record, type: 'clock-out', date: clockOut, title: 'Clock Out', subtitle: 'Checked out from Web', status: 'ABSENT' });
      if (!clockIn && !clockOut) allActivities.push({ ...record, type: 'attendance', date: record.date, status: record.status, displayDate: new Date(record.date) });
    });

    holidayList.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return !Number.isNaN(holidayDate.getTime()) && holidayDate.toDateString() === todayKey;
    }).forEach(holiday => {
      allActivities.push({
        ...holiday,
        type: 'holiday',
        date: holiday.date,
        status: 'HOLIDAY',
        title: holiday.title,
        displayDate: new Date(holiday.date)
      });
    });

    tasks.forEach(task => {
      const taskDate = new Date(task.date);
      if (Number.isNaN(taskDate.getTime())) return;
      allActivities.push({
        ...task,
        type: 'task',
        date: task.date,
        status: task.status || 'pending',
        displayDate: new Date(task.date || Date.now())
      });
    });
    
    
    allActivities.sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      const aDay = new Date(aDate).setHours(0, 0, 0, 0);
      const bDay = new Date(bDate).setHours(0, 0, 0, 0);
      if (aDay !== bDay) return bDay - aDay;
      return bDate - aDate;
    });
    
    let hasClockIn = false;
    const deduplicatedActivities = allActivities.filter(activity => {
      if (activity.type !== 'clock-in') return true;
      if (hasClockIn) return false;
      hasClockIn = true;
      return true;
    });

    setRecentActivity(deduplicatedActivities);
    writeDashboardCache({ recentActivity: deduplicatedActivities });
  }, []);

  const fetchDashboardConfig = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      const response = await axios.get(`/company/${companyId}/dashboard-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const dashboardConfig = response.data?.dashboardConfig || [];
      const clockConfig = dashboardConfig.find(item => item.componentId === 'clock-in');
      setAttendanceMode(clockConfig?.settings?.attendanceMode || 'normal');
    } catch (err) {
      console.error("Failed to load dashboard config:", err);
      setAttendanceMode('normal');
    }
  }, [getCompanyId, token]);

  const fetchDashboardSummary = useCallback(async () => {
    if (!isUserInCurrentCompany) return false;

    try {
      setJobRolesLoading(true);
      setHolidaysLoading(true);
      setLoading(prev => ({ ...prev, attendance: true, leaves: true, status: true }));

      const response = await axios.get('/dashboard/employee-summary', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });

      const summary = response.data?.data;
      if (!response.data?.success || !summary) return false;

      const dashboardConfig = summary.dashboardConfig || [];
      const clockConfig = dashboardConfig.find(item => item.componentId === 'clock-in');
      setAttendanceMode(clockConfig?.settings?.attendanceMode || 'normal');

      const formattedJobRoles = (summary.jobRoles || []).map(role => ({
        _id: role._id || role.id || role.roleId,
        roleName: role.roleName || role.name || role.jobRole || role.title || '',
        roleNumber: role.roleNumber || role.roleNo || role.code || '',
      })).filter(role => role.roleName);
      setJobRoles(formattedJobRoles);

      let holidaysData = summary.holidays || [];
      if (userJoinDate) {
        holidaysData = holidaysData.filter(holiday => !isBeforeJoinDate(new Date(holiday.date)));
      }
      setHolidays(holidaysData);

      let attendanceRecords = (summary.attendance || []).map(normalizeAttendanceRecord);
      if (userJoinDate) {
        attendanceRecords = attendanceRecords.filter(record => !isBeforeJoinDate(record.date));
      }
      setAttendanceData(attendanceRecords);

      let leaves = summary.leaves || [];
      if (userJoinDate) {
        leaves = leaves.filter(leave =>
          !isBeforeJoinDate(leave.startDate) && !isBeforeJoinDate(leave.endDate)
        );
      }
      setLeaveData(leaves);

      const status = summary.attendanceStatus || {};
      if (status.isClockedIn && status.inTime) {
        const inTime = new Date(status.inTime);
        setTimer(Math.floor((Date.now() - inTime.getTime()) / 1000));
        setIsRunning(true);
      } else {
        setIsRunning(false);
        setTimer(0);
      }

      const tasks = (summary.recentTasks?.length ? summary.recentTasks : pickTaskRecords(summary))
        .slice(0, 8)
        .map(mapTaskToActivity);
      setTaskActivity(tasks);
      updateRecentActivity(attendanceRecords, holidaysData, tasks);

      return true;
    } catch (error) {
      console.error('Dashboard summary fetch error:', error);
      return false;
    } finally {
      setJobRolesLoading(false);
      setHolidaysLoading(false);
      setLoading(prev => ({ ...prev, attendance: false, leaves: false, status: false }));
    }
  }, [isUserInCurrentCompany, token, userJoinDate, isBeforeJoinDate, updateRecentActivity]);

  
  useEffect(() => {
    if (initialLoadRef.current) return;
    if (!isUserInCurrentCompany) {
      setPageLoading(false);
      return;
    }
    
    initialLoadRef.current = true;
    setPageLoading(true);
    
    const loadData = async () => {
      cancelPendingRequests();
      
      try {
        const summaryLoaded = await fetchDashboardSummary();
        if (summaryLoaded) {
          await fetchRecentTaskActivity();
        } else {
          await fetchDashboardConfig();
          await fetchJobRoles();
          await fetchHolidays(); 
          await fetchAttendanceData(true); 
          await fetchLeaveData();
          await fetchCurrentStatus();
          await fetchRecentTaskActivity();
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setTimeout(() => {
          setPageLoading(false);
          setInitialLoadDone(true);
        }, 500);
      }
    };
    
    loadData();
    
    return () => cancelPendingRequests();
  }, [fetchDashboardSummary, fetchDashboardConfig, fetchJobRoles, fetchHolidays, fetchAttendanceData, fetchLeaveData, fetchCurrentStatus, fetchRecentTaskActivity, cancelPendingRequests, isUserInCurrentCompany]);

  
  useEffect(() => {
    if (attendanceData.length > 0 || holidays.length > 0 || recentTaskEvents.length > 0) {
      updateRecentActivity(attendanceData, holidays, recentTaskEvents);
    }
  }, [attendanceData, holidays, recentTaskEvents, updateRecentActivity]);

  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  
  useEffect(() => {
    return () => {
      cancelPendingRequests();
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cancelPendingRequests, cameraStream]);

  const getJobRoleDisplayName = useCallback(() => {
    if (jobRolesLoading) return 'Loading...';
    if (!jobRoles.length) return '';
    
    const userJobRole = user?.jobRole;
    if (!userJobRole) return '';
    
    const foundRole = jobRoles.find(role => 
      role._id === userJobRole || 
      role.roleNumber === userJobRole ||
      role.roleName === userJobRole
    );
    
    return foundRole?.roleName || (typeof userJobRole === 'string' ? userJobRole : '');
  }, [jobRoles, jobRolesLoading, user?.jobRole]);

  const filteredAttendanceData = useMemo(() => {
    if (!userJoinDate) return attendanceData;
    return attendanceData.filter(record => !isBeforeJoinDate(record.date));
  }, [attendanceData, userJoinDate, isBeforeJoinDate]);

  const filteredLeaveData = useMemo(() => {
    if (!userJoinDate) return leaveData;
    return leaveData.filter(leave => 
      !isBeforeJoinDate(leave.startDate) && !isBeforeJoinDate(leave.endDate)
    );
  }, [leaveData, userJoinDate, isBeforeJoinDate]);

  const markedDates = useMemo(() => {
    return filteredAttendanceData
      .filter(record => record.status === 'PRESENT')
      .map(record => `${new Date(record.date).getFullYear()}-${new Date(record.date).getMonth()}-${new Date(record.date).getDate()}`);
  }, [filteredAttendanceData]);

  const lateDates = useMemo(() => {
    return filteredAttendanceData
      .filter(record => record.status === 'LATE')
      .map(record => `${new Date(record.date).getFullYear()}-${new Date(record.date).getMonth()}-${new Date(record.date).getDate()}`);
  }, [filteredAttendanceData]);

  const halfDayDates = useMemo(() => {
    return filteredAttendanceData
      .filter(record => record.status === 'HALF DAY')
      .map(record => `${new Date(record.date).getFullYear()}-${new Date(record.date).getMonth()}-${new Date(record.date).getDate()}`);
  }, [filteredAttendanceData]);

  const absentDates = useMemo(() => {
    return filteredAttendanceData
      .filter(record => record.status === 'ABSENT')
      .map(record => `${new Date(record.date).getFullYear()}-${new Date(record.date).getMonth()}-${new Date(record.date).getDate()}`);
  }, [filteredAttendanceData]);

  const leaveDates = useMemo(() => {
    const dates = [];
    filteredLeaveData.forEach(leave => {
      if (String(leave.status || '').trim().toUpperCase() === 'APPROVED') {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const current = new Date(start);
        
        while (current <= end) {
          if (!isBeforeJoinDate(current)) {
            dates.push(`${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`);
          }
          current.setDate(current.getDate() + 1);
        }
      }
    });
    return [...new Set(dates)];
  }, [filteredLeaveData, isBeforeJoinDate]);

  
  const holidayDates = useMemo(() => {
    return holidays.map(holiday => {
      const date = new Date(holiday.date);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    });
  }, [holidays]);

  
  const holidayTitles = useMemo(() => {
    const map = {};
    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      map[key] = holiday.title;
    });
    return map;
  }, [holidays]);

  const monthlyStats = useMemo(() => {
    const presentDays = filteredAttendanceData.filter(record => {
      const d = new Date(record.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && record.status === 'PRESENT';
    }).length;

    const lateDays = filteredAttendanceData.filter(record => {
      const d = new Date(record.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && record.status === 'LATE';
    }).length;

    const halfDays = filteredAttendanceData.filter(record => {
      const d = new Date(record.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && record.status === 'HALF DAY';
    }).length;

    const absentDays = filteredAttendanceData.filter(record => {
      const d = new Date(record.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && record.status === 'ABSENT';
    }).length;

    const leavesTaken = leaveDates.filter(dateStr => {
      const [year, month] = dateStr.split('-').map(Number);
      return month === currentMonth && year === currentYear;
    }).length;

    return { presentDays, lateDays, halfDays, absentDays, leavesTaken };
  }, [filteredAttendanceData, leaveDates, currentMonth, currentYear]);

  
  const getDayStatus = useCallback((day) => {
    if (!day) return null;
    
    const dateObj = new Date(calendarYear, calendarMonth, day);
    const key = `${calendarYear}-${calendarMonth}-${day}`;
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    
    if (holidayDates.includes(key)) return "holiday";
    
    if (isBeforeJoinDate(dateObj)) return "before-join";
    if (lateDates.includes(key)) return "late";
    if (halfDayDates.includes(key)) return "halfday";
    if (leaveDates.includes(key)) return "leave";
    if (absentDates.includes(key)) return "absent";
    if (markedDates.includes(key)) return "present";
    if (isWeekend) return "weekend";
    
    return null;
  }, [calendarYear, calendarMonth, isBeforeJoinDate, markedDates, lateDates, halfDayDates, leaveDates, absentDates, holidayDates]);

  const isToday = useCallback((day) => {
    return day === currentDate.getDate() && 
           calendarMonth === currentDate.getMonth() && 
           calendarYear === currentDate.getFullYear();
  }, [currentDate, calendarMonth, calendarYear]);

  
  const getDayIcon = useCallback((day) => {
    const status = getDayStatus(day);
    switch(status) {
      case 'holiday': return '🎉';
      case 'present': return '✓';
      case 'late': return 'L';
      case 'halfday': return '½';
      case 'leave': return 'L';
      case 'absent': return '✗';
      case 'weekend': return '⚭';
      default: return '';
    }
  }, [getDayStatus]);

  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ error: "Geolocation is not supported by your browser." });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          resolve({ error: error.message });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg'));
    stopCamera();
  };

  const uploadSelfie = async (dataUrl) => {
    try {
      setSelfieUploading(true);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('selfie', blob, 'selfie.jpg');

      const uploadRes = await axios.post('/attendance/upload-selfie', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (uploadRes.data.success) return uploadRes.data.selfieUrl;
      throw new Error("Selfie upload failed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image. Please try again.");
      return null;
    } finally {
      setSelfieUploading(false);
    }
  };

  const handleCancelCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setCapturedImage(null);
    setModalMode(null);
  };

  const buildAttendancePayload = async (selfieUrl = null) => {
    const payload = {};
    if (selfieUrl) payload.selfieUrl = selfieUrl;

    if (attendanceMode === 'location' || attendanceMode === 'both') {
      toast.info("Fetching location...");
      const coords = await getCoordinates();
      if (coords.error) {
        toast.error(`Location error: ${coords.error}`);
        return null;
      }
      payload.latitude = coords.latitude;
      payload.longitude = coords.longitude;
    }

    return payload;
  };

  const handleIn = async (payload = {}) => {
    if (!isUserInCurrentCompany || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await axios.post('/attendance/in', payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      setIsRunning(true);
      setTimer(5);
      toast.success('Clocked in successfully!');
      
      setTimeout(() => {
        fetchCurrentStatus();
        fetchAttendanceData(true);
      }, 500);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Clock-in failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClockOut = async (payload = {}) => {
    if (!isUserInCurrentCompany || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await axios.post("/attendance/out", payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      setIsRunning(false);
      setShowClockOutConfirm(false);
      toast.success("Clocked out successfully!");

      setTimeout(() => {
        fetchCurrentStatus();
        fetchAttendanceData(true);
      }, 500);

    } catch (error) {
      toast.error(error.response?.data?.message || "Clock-out failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const runAttendanceFlow = async (mode, selfieUrl = null) => {
    const payload = await buildAttendancePayload(selfieUrl);
    if (!payload) return;

    if (mode === 'in') {
      await handleIn(payload);
    } else {
      await handleClockOut(payload);
    }

    setShowCameraModal(false);
    setCapturedImage(null);
    setModalMode(null);
  };

  const handleActionClick = (mode) => {
    setModalMode(mode);
    if (mode === 'out') setShowClockOutConfirm(false);

    if (attendanceMode === 'image' || attendanceMode === 'both') {
      setShowCameraModal(true);
      setTimeout(() => startCamera(), 100);
      return;
    }

    runAttendanceFlow(mode);
  };

  const handleConfirmCaptured = async () => {
    if (!capturedImage) return;
    const selfieUrl = await uploadSelfie(capturedImage);
    if (!selfieUrl) return;
    await runAttendanceFlow(modalMode, selfieUrl);
  };

  const handlePrevMonth = useCallback(() => {
    if (calendarMonth === 0) {
      const prevYear = calendarYear - 1;
      if (isMonthBeforeJoin(prevYear, 11)) {
        toast.info('Cannot view months before your joining date');
        return;
      }
      setCalendarYear(prevYear);
      setCalendarMonth(11);
    } else {
      if (isMonthBeforeJoin(calendarYear, calendarMonth - 1)) {
        toast.info('Cannot view months before your joining date');
        return;
      }
      setCalendarMonth(prev => prev - 1);
    }
  }, [calendarMonth, calendarYear, isMonthBeforeJoin]);

  const handleNextMonth = useCallback(() => {
    if (calendarMonth === 11) {
      setCalendarYear(prev => prev + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  }, [calendarMonth]);

  const resetToCurrentMonth = useCallback(() => {
    setCalendarMonth(currentDate.getMonth());
    setCalendarYear(currentDate.getFullYear());
  }, [currentDate]);

  const handleRefresh = useCallback(() => {
    if (loading.attendance) return;
    fetchAttendanceData(true);
    fetchRecentTaskActivity();
    fetchFocusStats();
  }, [loading.attendance, fetchAttendanceData, fetchRecentTaskActivity, fetchFocusStats]);

  const getStatusColor = useCallback((status) => {
    switch(status) {
      case 'PRESENT': return 'status-present';
      case 'LATE': return 'status-late';
      case 'HALF DAY': return 'status-halfday';
      case 'ABSENT': return 'status-absent';
      case 'HOLIDAY': return 'status-holiday';
      default: return 'status-default';
    }
  }, []);

  const calendarDays = useMemo(() => getCalendarGrid(calendarYear, calendarMonth), [calendarYear, calendarMonth]);
  const isMobile = useIsMobile();
  const shouldBlockMobileDashboard = false;
  const userJobRoleDisplay = getJobRoleDisplayName();

  const taskSummary = useMemo(() => ({
    total: dashboardTaskStats.total,
    completed: dashboardTaskStats.completed,
    inProgress: dashboardTaskStats.inProgress,
    pending: dashboardTaskStats.pending,
    overdue: dashboardTaskStats.overdue
  }), [dashboardTaskStats]);

  const productivityScore = useMemo(() => {
    const attendanceTotal = monthlyStats.presentDays + monthlyStats.lateDays + monthlyStats.halfDays + monthlyStats.absentDays;
    const attendanceScore = attendanceTotal ? Math.round(((monthlyStats.presentDays + monthlyStats.halfDays * 0.5) / attendanceTotal) * 100) : 0;
    const taskScore = taskSummary.total ? Math.round((taskSummary.completed / taskSummary.total) * 100) : attendanceScore;
    return Math.max(0, Math.min(100, Math.round((attendanceScore + taskScore) / (taskSummary.total ? 2 : 1))));
  }, [monthlyStats, taskSummary]);

  const productivityLabel = useMemo(() => {
    if (productivityScore >= 90) return 'Excellent';
    if (productivityScore >= 75) return 'Great going!';
    if (productivityScore >= 60) return 'Good';
    if (productivityScore >= 40) return 'Needs attention';
    return 'Keep improving';
  }, [productivityScore]);

  const todayAttendance = useMemo(() => {
    const todayKey = new Date().toDateString();
    return attendanceData.find(record => {
      const date = new Date(record.date || record.inTime || record.createdAt);
      return !Number.isNaN(date.getTime()) && date.toDateString() === todayKey;
    }) || null;
  }, [attendanceData]);

  const hasTodayAttendance = Boolean(todayAttendance);

  const productivityTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { date, total: 0, completed: 0, attendanceScore: null, attendanceStatus: '', hasData: false };
    });

    attendanceData.forEach(record => {
      const recordDate = new Date(record.date || record.inTime || record.createdAt);
      if (Number.isNaN(recordDate.getTime())) return;
      const day = days.find(item => item.date.toDateString() === recordDate.toDateString());
      if (!day) return;
      const status = normalizeAttendanceStatus(record.status);
      day.attendanceStatus = status;
      day.attendanceScore = status === 'PRESENT' ? 100
        : status === 'LATE' ? 75
          : status === 'HALF DAY' ? 50
            : status === 'ABSENT' ? 0 : null;
      day.hasData = day.attendanceScore !== null;
    });

    taskActivity.forEach(task => {
      const taskDate = new Date(task.updatedAt || task.completedAt || task.date || task.createdAt);
      if (Number.isNaN(taskDate.getTime())) return;
      const day = days.find(item => item.date.toDateString() === taskDate.toDateString());
      if (!day) return;
      day.total += 1;
      day.hasData = true;
      const status = String(task.status || '').toLowerCase();
      if (status.includes('complete') || status === 'done') day.completed += 1;
    });

    return days.map((day, index) => {
      const taskScore = day.total ? Math.round((day.completed / day.total) * 100) : null;
      const score = taskScore !== null && day.attendanceScore !== null
        ? Math.round((taskScore + day.attendanceScore) / 2)
        : taskScore ?? day.attendanceScore ?? 0;
      return {
        ...day,
        score,
        x: 12 + index * (316 / 6),
        y: 105 - (score * 0.75)
      };
    });
  }, [taskActivity, attendanceData]);

  const topProjects = useMemo(() => dashboardProjects.map(project => {
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const completed = tasks.filter(task => {
      const status = String(task.userStatus || task.overallStatus || task.status || '').toLowerCase();
      return status.includes('complete') || status === 'done';
    }).length;
    return {
      ...project,
      taskCount: tasks.length,
      progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0
    };
  }).sort((a, b) => {
    const progressDifference = b.progress - a.progress;
    if (progressDifference) return progressDifference;
    const aName = String(a.projectName || a.name || a.title || '');
    const bName = String(b.projectName || b.name || b.title || '');
    return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
  }).slice(0, 3), [dashboardProjects]);

  const quickActions = [
    { label: 'New Task', icon: <CirclePlus />, tone: 'purple', fields: [['title','Task title','text'],['description','Description','textarea'],['dueDateTime','Due date','datetime-local']] },
    { label: 'Apply Leave', icon: <Umbrella />, tone: 'green', fields: [['type','Leave type','select'],['startDate','Start date','date'],['endDate','End date','date'],['reason','Reason','textarea']] },
    { label: 'Request Asset', icon: <BriefcaseBusiness />, tone: 'orange', fields: [['assetId','Asset ID','text'],['reason','Reason','textarea']] },
    { label: 'Add Client', icon: <UserPlus />, tone: 'blue', fields: [['client','Client name','text'],['company','Company','text'],['email','Email','email'],['phone','Phone','tel']] },
    { label: 'New Project', icon: <Folder />, tone: 'purple', fields: [['projectName','Project name','text'],['description','Description','textarea'],['startDate','Start date','date'],['endDate','End date','date']] },
    { label: 'Meetings', icon: <CalendarDays />, tone: 'red', fields: [] },
    { label: 'My Notes', icon: <NotebookPen />, tone: 'blue', fields: null },
    { label: 'Timesheet', icon: <Clock3 />, tone: 'green', fields: null },
  ];

  const enabledQuickActionLabels = ['New Task', 'Apply Leave', 'Request Asset', 'Meetings', 'My Notes'];
  const visibleQuickActions = quickActions.filter(action => enabledQuickActionLabels.includes(action.label));

  const openQuickAction = action => {
    setActiveQuickAction(action);
    if (action.label === 'New Task') {
      setQuickTaskType('personal');
      setQuickForm({ priority: 'medium' });
      return;
    }
    setQuickForm(action.label === 'Apply Leave' ? { type: 'Casual' } : action.label === 'Timesheet' ? { date: new Date().toISOString().slice(0, 10) } : {});
  };

  useEffect(() => {
    if (activeQuickAction?.label !== 'New Task' || quickTaskType !== 'client' || quickClients.length) return;
    let active = true;
    const loadClients = async () => {
      setQuickClientsLoading(true);
      try {
        const companyCode = companyDetails?.companyCode || user?.companyCode || localStorage.getItem('companyCode');
        const response = await axios.get('/clientsservice', { params: { companyCode, limit: 500 } });
        const rows = Array.isArray(response.data?.data) ? response.data.data
          : Array.isArray(response.data?.clients) ? response.data.clients
            : Array.isArray(response.data) ? response.data : [];
        if (active) setQuickClients(rows.filter(Boolean));
      } catch (error) {
        console.error('Failed to load clients for quick task:', error);
        if (active) {
          setQuickClients([]);
          toast.error('Unable to load clients');
        }
      } finally {
        if (active) setQuickClientsLoading(false);
      }
    };
    loadClients();
    return () => { active = false; };
  }, [activeQuickAction, companyDetails, quickClients.length, quickTaskType, user]);

  useEffect(() => {
    if (activeQuickAction?.label !== 'Request Asset') return;
    let active = true;
    const loadAssets = async () => {
      setQuickAssetsLoading(true);
      try {
        const response = await axios.get('/company-assets', { headers: { Authorization: `Bearer ${token}` } });
        const rows = Array.isArray(response.data?.assets) ? response.data.assets
          : Array.isArray(response.data?.data) ? response.data.data
            : Array.isArray(response.data) ? response.data : [];
        if (active) setQuickAssets(rows.filter(asset => Number(asset.quantity) > 0));
      } catch (error) {
        console.error('Failed to load company assets:', error);
        if (active) {
          setQuickAssets([]);
          toast.error('Unable to load available assets');
        }
      } finally {
        if (active) setQuickAssetsLoading(false);
      }
    };
    loadAssets();
    return () => { active = false; };
  }, [activeQuickAction, token]);

  useEffect(() => {
    if (activeQuickAction?.label !== 'Add Client') return;
    let active = true;
    const loadTeam = async () => {
      setQuickTeamLoading(true);
      try {
        const response = await axios.get('/users/company-users', { headers: { Authorization: `Bearer ${token}` } });
        const data = response.data;
        const rows = Array.isArray(data) ? data
          : Array.isArray(data?.users) ? data.users
            : Array.isArray(data?.data) ? data.data
              : Array.isArray(data?.message?.users) ? data.message.users : [];
        if (active) setQuickTeamMembers(rows.filter(member => member && member.isActive !== false));
      } catch (error) {
        console.error('Failed to load team members for client:', error);
        if (active) {
          setQuickTeamMembers([]);
          toast.error('Unable to load team members');
        }
      } finally {
        if (active) setQuickTeamLoading(false);
      }
    };
    loadTeam();
    return () => { active = false; };
  }, [activeQuickAction, token]);

  const submitQuickAction = async event => {
    event.preventDefault();
    if (!activeQuickAction) return;
    const requiredFields = activeQuickAction.label === 'Add Client'
      ? ['client', 'company', 'city', 'projectManagerId']
      : activeQuickAction.fields.map(([name]) => name);
    if (requiredFields.some(name => !String(quickForm[name] || '').trim())) return toast.error('Please fill all fields');
    setQuickSubmitting(true);
    try {
      const companyCode = companyDetails?.companyCode || user?.companyCode;
      switch (activeQuickAction.label) {
        case 'Apply Leave': {
          const start = new Date(quickForm.startDate); const end = new Date(quickForm.endDate);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('Please select valid leave dates');
          if (end < start) throw new Error('End date cannot be before start date');
          const days = Math.floor((end - start) / 86400000) + 1;
          await axios.post('/leaves/apply', { ...quickForm, days }); break;
        }
        case 'Request Asset': {
          const asset = quickAssets.find(item => String(item._id || item.id) === String(quickForm.assetId));
          if (!asset) throw new Error('Please select an available asset');
          await axios.post('/asset-requests/request', { assetId: asset._id || asset.id, reason: quickForm.reason.trim() });
          break;
        }
        case 'Add Client': {
          if (!companyCode) throw new Error('Company code is missing. Please login again.');
          if (quickForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickForm.email.trim())) throw new Error('Please enter a valid email address');
          const manager = quickTeamMembers.find(member => String(member._id || member.id) === String(quickForm.projectManagerId));
          if (!manager) throw new Error('Please select a project manager');
          await axios.post('/clientsservice', {
            client: quickForm.client.trim(),
            company: quickForm.company.trim(),
            city: quickForm.city.trim(),
            companyCode,
            projectManager: [manager.name],
            services: [],
            status: 'Active',
            progress: 0,
            email: quickForm.email?.trim() || '',
            phone: quickForm.phone?.trim() || '',
            address: quickForm.address?.trim() || '',
            notes: quickForm.notes?.trim() || ''
          });
          break;
        }
        case 'New Project': {
          const body = new FormData(); Object.entries({ ...quickForm, companyCode, status: 'pending', priority: 'medium', users: '[]' }).forEach(([key, value]) => body.append(key, value));
          await axios.post('/projects', body, { headers: { 'Content-Type': 'multipart/form-data' } }); break;
        }
        case 'Schedule Meeting': await axios.post('/meetings/create', { ...quickForm, attendees: [getCurrentUserId(user)], companyCode, createdBy: getCurrentUserId(user), dates: [quickForm.date] }); break;
        case 'New Task': {
          const dueDate = new Date(quickForm.dueDateTime);
          if (Number.isNaN(dueDate.getTime())) throw new Error('Please enter a valid due date');
          if (quickTaskType === 'personal') {
            const body = new FormData();
            body.append('title', quickForm.title.trim());
            body.append('description', quickForm.description.trim());
            body.append('dueDateTime', dueDate.toISOString());
            body.append('priority', quickForm.priority || 'medium');
            body.append('priorityDays', '1');
            await axios.post('/tasks/self/create', body, { headers: { 'Content-Type': 'multipart/form-data' } });
          } else {
            const client = quickClients.find(item => String(item._id || item.id) === String(quickForm.clientId));
            if (!client) throw new Error('Please select a client');
            if (!quickForm.service) throw new Error('Please select a service');
            await axios.post(`/tasks/client-tasks/client/${client._id || client.id}/service/${encodeURIComponent(quickForm.service)}`, {
              name: quickForm.title.trim(),
              description: quickForm.description.trim(),
              dueDate: dueDate.toISOString(),
              dueDateTime: dueDate.toISOString(),
              assignee: user?.name || '',
              assigneeId: getCurrentUserId(user),
              priority: quickForm.priority || 'medium'
            });
          }
          break;
        }
        default: break;
      }
      toast.success(`${activeQuickAction.label} saved successfully`);
      if (activeQuickAction.label === 'Schedule Meeting') fetchUpcomingMeetings();
      if (activeQuickAction.label === 'New Project') fetchDashboardProjects();
      if (activeQuickAction.label === 'Add Client') setQuickClients([]);
      if (activeQuickAction.label === 'New Task') {
        fetchRecentTaskActivity();
        fetchFocusStats();
      }
      if (activeQuickAction.label === 'Apply Leave') fetchLeaveData();
      setActiveQuickAction(null); setQuickForm({});
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || error.message || `Unable to save ${activeQuickAction.label.toLowerCase()}`);
    } finally { setQuickSubmitting(false); }
  };

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  
  if (!user || !token) {
    navigate('/login');
    return null;
  }

  if (!isUserInCurrentCompany) {
    return (
      <div className="dashboard-container">
        <div className="access-denied-message">
          <div className="access-denied-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>You do not have access to this company's dashboard.</p>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (shouldBlockMobileDashboard && isMobile) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px"
      }}>
        <h2>
          😄 Hi {user?.name || "User"}, <br /><br />
          This dashboard does not work on mobile devices. <br /><br />
          Please use a Desktop or Laptop for the best experience
        </h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" pauseOnHover />
      
      {showClockOutConfirm && (
        <div className="confirmation-overlay">
          <div className="confirmation-popup">
            <button className="confirmation-close-btn" onClick={() => setShowClockOutConfirm(false)} disabled={isProcessing}>
              <FiX size={20} />
            </button>
            <h3 className="confirmation-title">Confirm Clock Out</h3>
            <p className="confirmation-message">
              Are you sure you want to clock out? 
              <br />
              <span className="confirmation-warning">This will log you out of the system.</span>
            </p>
            <div className="confirmation-timer">
              <FiClock size={16} />
              <span>Current session: {formatTime(timer)}</span>
            </div>
            <div className="confirmation-buttons">
              <button className="confirmation-btn confirmation-btn-cancel" onClick={() => setShowClockOutConfirm(false)} disabled={isProcessing}>
                Cancel
              </button>
              <button className="confirmation-btn confirmation-btn-confirm" onClick={() => handleActionClick('out')} disabled={isProcessing || selfieUploading}>
                {isProcessing ? 'Processing...' : 'Confirm Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCameraModal && (
        <div className="confirmation-overlay" style={{ zIndex: 1000 }}>
          <div className="confirmation-popup" style={{ maxWidth: '450px' }}>
            <button className="confirmation-close-btn" onClick={handleCancelCameraModal} disabled={selfieUploading}>
              <FiX size={20} />
            </button>
            <h3 className="confirmation-title">{modalMode === 'in' ? 'Clock In Verification' : 'Clock Out Verification'}</h3>
            <p className="confirmation-message" style={{ marginBottom: '15px' }}>
              Your company requires a selfie to verify attendance.
            </p>

            <div style={{ width: '100%', height: '300px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div className="confirmation-buttons" style={{ justifyContent: 'center', gap: '15px' }}>
              {capturedImage ? (
                <>
                  <button className="confirmation-btn confirmation-btn-cancel" onClick={startCamera} disabled={selfieUploading}>
                    Retake
                  </button>
                  <button className="confirmation-btn confirmation-btn-confirm" onClick={handleConfirmCaptured} disabled={selfieUploading}>
                    {selfieUploading ? 'Uploading...' : 'Confirm & Submit'}
                  </button>
                </>
              ) : (
                <>
                  <button className="confirmation-btn confirmation-btn-cancel" onClick={handleCancelCameraModal} disabled={selfieUploading}>
                    Cancel
                  </button>
                  <button className="confirmation-btn confirmation-btn-confirm" onClick={capturePhoto} disabled={selfieUploading}>
                    <FiCamera style={{ marginRight: '8px' }} /> Capture Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAllActivities && (
        <div className="activity-modal-backdrop" onMouseDown={() => setShowAllActivities(false)}>
          <section className="activity-modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="all-activities-title">
            <header className="activity-modal-header">
              <div><span>Activity timeline</span><h2 id="all-activities-title">Recent Activities</h2></div>
              <button onClick={() => setShowAllActivities(false)} aria-label="Close recent activities"><FiX /></button>
            </header>
            <div className="activity-modal-list">
              {recentActivity.map((item, index) => {
                const itemDate = new Date(item.date || Date.now());
                const title = item.title || (item.type === 'attendance' ? `${item.status || 'Attendance'} recorded` : 'Activity');
                const subtitle = item.subtitle || item.assignedTo || item.totalTime || 'Your workspace';
                return <article className={`activity-modal-row activity-type-${item.type}`} key={item._id || item.id || `${item.type}-${index}`}>
                  <time><strong>{item.displayTime || (Number.isNaN(itemDate.getTime()) ? '--:--' : itemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</strong><span>{Number.isNaN(itemDate.getTime()) ? '' : itemDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></time>
                  <i aria-hidden="true" />
                  <div><strong>{title}</strong><span>{subtitle}</span></div>
                  <em>{item.status || item.type}</em>
                </article>;
              })}
              {!recentActivity.some(item => {
                const activityDate = new Date(item.date || 0);
                return !Number.isNaN(activityDate.getTime()) && activityDate.toDateString() === new Date().toDateString();
              }) && <div className="activity-modal-empty">No activity recorded today.</div>}
            </div>
          </section>
        </div>
      )}

      {activeQuickAction && (
        <div className="quick-modal-backdrop" onMouseDown={() => !quickSubmitting && setActiveQuickAction(null)}>
          <section className="quick-modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true">
            <header><div className={`quick-modal-icon ${activeQuickAction.tone}`}>{activeQuickAction.icon}</div><div><span>Quick action</span><h2>{activeQuickAction.label}</h2></div><button type="button" onClick={() => setActiveQuickAction(null)} disabled={quickSubmitting}><FiX /></button></header>
            <form onSubmit={submitQuickAction}>
              {activeQuickAction.label === 'Meetings' ? (
                <div className="quick-meetings-view">
                  <div className="quick-meetings-summary"><div><strong>Upcoming meetings</strong><span>Your scheduled meetings in chronological order.</span></div><em>{upcomingMeetings.length}</em></div>
                  {upcomingMeetings.length ? <div className="quick-meetings-list">
                    {upcomingMeetings.map((meeting, index) => <article key={meeting._id || meeting.id || index}>
                      <time><strong>{meeting.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong><span>{meeting.scheduledAt.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span></time>
                      <i>{meeting.meetingLink || meeting.link || String(meeting.mode || '').toLowerCase().includes('online') ? <Video /> : <CalendarClock />}</i>
                      <div><strong>{meeting.title || meeting.subject || meeting.agenda || 'Scheduled Meeting'}</strong><span>{meeting.description || meeting.mode || 'Meeting scheduled'}</span></div>
                      {(meeting.meetingLink || meeting.link) && <a href={meeting.meetingLink || meeting.link} target="_blank" rel="noreferrer">Join</a>}
                    </article>)}
                  </div> : <div className="quick-meetings-empty"><CheckCircle2 /><strong>No meetings scheduled</strong><span>Your schedule is clear for now.</span></div>}
                  <button type="button" className="quick-meetings-view-all" onClick={() => { setActiveQuickAction(null); navigate('/ciisUser/employee-meeting'); }}>View all meetings</button>
                </div>
              ) : activeQuickAction.label === 'My Notes' ? (
                <div className="quick-notes-coming-soon">
                  <div className="quick-notes-visual"><NotebookPen /></div>
                  <em>Coming Soon</em>
                  <strong>My Notes is coming soon</strong>
                  <p>Save personal notes, ideas and reminders in one secure place.</p>
                  <div><span><CheckCircle2 /> Private</span><span><CheckCircle2 /> Quick access</span><span><CheckCircle2 /> Organized</span></div>
                </div>
              ) : activeQuickAction.label === 'New Task' ? (
                <>
                  <div className="quick-task-type-switch" role="tablist" aria-label="Task type">
                    <button type="button" className={quickTaskType === 'personal' ? 'active' : ''} onClick={() => { setQuickTaskType('personal'); setQuickForm({ priority: 'medium' }); }}><FiUser /> Personal Task</button>
                    <button type="button" className={quickTaskType === 'client' ? 'active' : ''} onClick={() => { setQuickTaskType('client'); setQuickForm({ priority: 'medium' }); }}><FiBriefcase /> Client Task</button>
                  </div>
                  <div className="quick-task-type-note">{quickTaskType === 'personal' ? 'Create a private task assigned to you.' : 'Create and assign a task for one of your clients.'}</div>
                  <div className="quick-modal-fields">
                    {quickTaskType === 'client' && <>
                      <label><span>Client</span><select value={quickForm.clientId || ''} disabled={quickClientsLoading} onChange={e => setQuickForm(current => ({ ...current, clientId: e.target.value, service: '' }))}><option value="">{quickClientsLoading ? 'Loading clients…' : 'Select client'}</option>{quickClients.map(client => <option key={client._id || client.id} value={client._id || client.id}>{client.company || client.client || client.name || client.email}</option>)}</select></label>
                      <label><span>Service</span><select value={quickForm.service || ''} disabled={!quickForm.clientId} onChange={e => setQuickForm(current => ({ ...current, service: e.target.value }))}><option value="">Select service</option>{(quickClients.find(client => String(client._id || client.id) === String(quickForm.clientId))?.services || []).map(service => { const value = typeof service === 'string' ? service : service?.service || service?.name || ''; return value ? <option key={value} value={value}>{value}</option> : null; })}</select></label>
                    </>}
                    <label><span>Task title</span><input type="text" value={quickForm.title || ''} onChange={e => setQuickForm(current => ({ ...current, title: e.target.value }))} /></label>
                    <label><span>Due date</span><input type="datetime-local" value={quickForm.dueDateTime || ''} onChange={e => setQuickForm(current => ({ ...current, dueDateTime: e.target.value }))} /></label>
                    <label><span>Priority</span><select value={quickForm.priority || 'medium'} onChange={e => setQuickForm(current => ({ ...current, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                    <label className="wide"><span>Description</span><textarea value={quickForm.description || ''} onChange={e => setQuickForm(current => ({ ...current, description: e.target.value }))} rows="3" /></label>
                  </div>
                </>
              ) : activeQuickAction.label === 'Apply Leave' ? (
                <div className="quick-leave-form">
                  <div className="quick-leave-types">
                    {[
                      ['Casual', 'Personal work'],
                      ['Sick', 'Health & recovery'],
                      ['Paid', 'Paid time off'],
                      ['Unpaid', 'Unpaid leave']
                    ].map(([type, hint]) => <button type="button" key={type} className={quickForm.type === type ? 'active' : ''} onClick={() => setQuickForm(current => ({ ...current, type }))}><span>{type.charAt(0)}</span><strong>{type}</strong><small>{hint}</small></button>)}
                  </div>
                  <div className="quick-leave-date-card">
                    <label><span>Start date</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={quickForm.startDate || ''} onChange={e => setQuickForm(current => ({ ...current, startDate: e.target.value, endDate: current.endDate && current.endDate < e.target.value ? '' : current.endDate }))} /></label>
                    <div className="quick-leave-date-line"><i /><span>{quickForm.startDate && quickForm.endDate ? `${Math.floor((new Date(quickForm.endDate) - new Date(quickForm.startDate)) / 86400000) + 1} day(s)` : 'Select dates'}</span><i /></div>
                    <label><span>End date</span><input type="date" min={quickForm.startDate || new Date().toISOString().slice(0, 10)} value={quickForm.endDate || ''} onChange={e => setQuickForm(current => ({ ...current, endDate: e.target.value }))} /></label>
                  </div>
                  <label className="quick-leave-reason"><span>Reason for leave</span><textarea value={quickForm.reason || ''} onChange={e => setQuickForm(current => ({ ...current, reason: e.target.value }))} rows="3" placeholder="Briefly explain your leave request…" /></label>
                  <div className="quick-leave-note"><FiCheckCircle /> Your request will be sent through the configured approval workflow.</div>
                </div>
              ) : activeQuickAction.label === 'Request Asset' ? (
                <div className="quick-asset-form">
                  <div className="quick-asset-heading"><div><strong>Available company assets</strong><span>Select the asset you need for your work.</span></div><em>{quickAssets.length} available</em></div>
                  {quickAssetsLoading ? <div className="quick-asset-loading"><span /> Loading available assets…</div> : quickAssets.length ? (
                    <div className="quick-asset-grid">
                      {quickAssets.map(asset => <button type="button" key={asset._id || asset.id} className={String(quickForm.assetId) === String(asset._id || asset.id) ? 'active' : ''} onClick={() => setQuickForm(current => ({ ...current, assetId: asset._id || asset.id }))}>
                        <i><FiBox /></i>
                        <span><strong>{asset.name || asset.assetName || 'Asset'}</strong><small>{[asset.category || asset.type, asset.model].filter(Boolean).join(' · ') || 'Company asset'}</small></span>
                        <em>{asset.quantity} available</em>
                        <CheckCircle2 />
                      </button>)}
                    </div>
                  ) : <div className="quick-asset-empty"><FiBox /><strong>No assets available</strong><span>Please check again later or contact your administrator.</span></div>}
                  <label className="quick-asset-reason"><span>Why do you need this asset?</span><textarea value={quickForm.reason || ''} onChange={e => setQuickForm(current => ({ ...current, reason: e.target.value }))} rows="3" placeholder="Describe how this asset will help with your work…" /></label>
                  <div className="quick-asset-note"><FiCheckCircle /> The asset team will review your request and update its status.</div>
                </div>
              ) : activeQuickAction.label === 'Add Client' ? (
                <div className="quick-client-form">
                  <div className="quick-client-intro"><i><UserPlus /></i><div><strong>Client information</strong><span>Add essential details now. Services and plans can be configured from Client Management.</span></div></div>
                  <div className="quick-modal-fields">
                    <label><span>Contact person *</span><input type="text" value={quickForm.client || ''} onChange={e => setQuickForm(current => ({ ...current, client: e.target.value }))} placeholder="Client name" /></label>
                    <label><span>Company name *</span><input type="text" value={quickForm.company || ''} onChange={e => setQuickForm(current => ({ ...current, company: e.target.value }))} placeholder="Company or business" /></label>
                    <label><span>City *</span><input type="text" value={quickForm.city || ''} onChange={e => setQuickForm(current => ({ ...current, city: e.target.value }))} placeholder="Client city" /></label>
                    <label><span>Project manager *</span><select value={quickForm.projectManagerId || ''} disabled={quickTeamLoading} onChange={e => setQuickForm(current => ({ ...current, projectManagerId: e.target.value }))}><option value="">{quickTeamLoading ? 'Loading team…' : 'Select team member'}</option>{quickTeamMembers.map(member => <option key={member._id || member.id} value={member._id || member.id}>{member.name}{member.email ? ` · ${member.email}` : ''}</option>)}</select></label>
                    <label><span>Email</span><input type="email" value={quickForm.email || ''} onChange={e => setQuickForm(current => ({ ...current, email: e.target.value }))} placeholder="client@company.com" /></label>
                    <label><span>Phone</span><input type="tel" value={quickForm.phone || ''} onChange={e => setQuickForm(current => ({ ...current, phone: e.target.value }))} placeholder="Contact number" /></label>
                    <label className="wide"><span>Address</span><input type="text" value={quickForm.address || ''} onChange={e => setQuickForm(current => ({ ...current, address: e.target.value }))} placeholder="Office address (optional)" /></label>
                    <label className="wide"><span>Notes</span><textarea value={quickForm.notes || ''} onChange={e => setQuickForm(current => ({ ...current, notes: e.target.value }))} rows="2" placeholder="Additional information (optional)" /></label>
                  </div>
                  <div className="quick-client-note"><FiCheckCircle /> Client will be created as Active under your current company.</div>
                </div>
              ) : (
                <div className="quick-modal-fields">
                  {activeQuickAction.fields.map(([name, label, type]) => <label key={name} className={type === 'textarea' ? 'wide' : ''}><span>{label}</span>
                    {type === 'textarea' ? <textarea value={quickForm[name] || ''} onChange={e => setQuickForm(current => ({ ...current, [name]: e.target.value }))} rows="3" /> : type === 'select' ? <select value={quickForm[name] || 'Casual'} onChange={e => setQuickForm(current => ({ ...current, [name]: e.target.value }))}><option>Casual</option><option>Sick</option><option>Paid</option><option>Unpaid</option></select> : <input type={type} min={type === 'number' ? '0.5' : undefined} step={type === 'number' ? '0.5' : undefined} value={quickForm[name] || ''} onChange={e => setQuickForm(current => ({ ...current, [name]: e.target.value }))} />}
                  </label>)}
                </div>
              )}
              {['Meetings', 'My Notes'].includes(activeQuickAction.label) ? <footer><button type="button" onClick={() => setActiveQuickAction(null)}>Close</button></footer> : <footer><button type="button" onClick={() => setActiveQuickAction(null)} disabled={quickSubmitting}>Cancel</button><button type="submit" disabled={quickSubmitting}>{quickSubmitting ? 'Saving…' : activeQuickAction.label === 'New Task' ? `Create ${quickTaskType === 'personal' ? 'Personal' : 'Client'} Task` : activeQuickAction.label === 'Add Client' ? 'Create Client' : `Save ${activeQuickAction.label}`}</button></footer>}
            </form>
          </section>
        </div>
      )}

      {isMobile && (
        <main className="MobileDashV2-shell">
          <section className="MobileDashV2-hero">
            <div className="MobileDashV2-heroTop">
              <span className="MobileDashV2-eyebrow">
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
              </span>
              <span className={`MobileDashV2-live ${isRunning ? 'is-active' : ''}`}>
                <i /> {isRunning ? 'Working' : 'Ready'}
              </span>
            </div>
            <h1>{user?.name || 'Welcome back'}</h1>
            <p>Here’s what’s happening with your work today.</p>
            <div className="MobileDashV2-date">
              <span><FiCalendar /> {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
              <span><FiSun /> {weather.loading ? 'Weather…' : weather.temperature === null ? weather.label : `${weather.temperature}°C ${weather.label}`}</span>
            </div>
            <div className="MobileDashV2-progress">
              <div>
                <span>Today’s progress</span>
                <strong>{focusStats.loading ? '—' : `${focusStats.dailyProgress}%`}</strong>
              </div>
              <i><span style={{ width: `${focusStats.dailyProgress}%` }} /></i>
              <small>{focusStats.completedToday} tasks completed today</small>
            </div>
          </section>

          <section className="MobileDashV2-clock">
            <div>
              <span>Work session</span>
              <strong>{formatTime(timer)}</strong>
              <small>{isRunning ? 'Timer is running' : 'Start when you’re ready'}</small>
            </div>
            <button
              type="button"
              className={isRunning ? 'is-stop' : ''}
              onClick={() => isRunning ? setShowClockOutConfirm(true) : handleActionClick('in')}
              disabled={loading.attendance || !isUserInCurrentCompany || isProcessing || selfieUploading}
            >
              {isRunning ? <FiSquare /> : <FiPlay />}
              {isRunning ? 'Clock out' : 'Clock in'}
            </button>
          </section>

          <section className="MobileDashV2-focus">
            <header><div><FiZap /><span>Today’s focus</span></div><b>{focusStats.dueToday + focusStats.inProgress}</b></header>
            <div>
              <article><i className="violet"><FiCheckCircle /></i><span><strong>{focusStats.dueToday}</strong><small>Due today</small></span></article>
              <article><i className="blue"><FiActivity /></i><span><strong>{focusStats.inProgress}</strong><small>In progress</small></span></article>
              <article><i className="green"><FiClock /></i><span><strong>{hasTodayAttendance ? 'Done' : 'Pending'}</strong><small>Attendance</small></span></article>
            </div>
          </section>

          <section className="MobileDashV2-stats">
            {[
              ['Present', monthlyStats.presentDays, 'green'],
              ['Late', monthlyStats.lateDays, 'amber'],
              ['Half day', monthlyStats.halfDays, 'blue'],
              ['Leave', monthlyStats.leavesTaken, 'violet'],
              ['Absent', monthlyStats.absentDays, 'red']
            ].map(([label, value, tone]) => (
              <article className={tone} key={label}>
                <span>{label}</span>
                <strong>{String(value).padStart(2, '0')}</strong>
                <small>days this month</small>
              </article>
            ))}
          </section>

          <section className="MobileDashV2-card MobileDashV2-calendar">
            <header>
              <div><i><FiCalendar /></i><span><strong>Attendance</strong><small>{monthNames[calendarMonth]} {calendarYear}</small></span></div>
              <button type="button" onClick={() => navigate('/ciisUser/attendance')}>View all</button>
            </header>
            <nav>
              <button type="button" onClick={handlePrevMonth} disabled={isMonthBeforeJoin(calendarYear, calendarMonth)}><FiChevronLeft /></button>
              <strong>{monthNames[calendarMonth]} {calendarYear}</strong>
              <button type="button" onClick={resetToCurrentMonth}>Today</button>
              <button type="button" onClick={handleNextMonth}><FiChevronRight /></button>
            </nav>
            <div className="MobileDashV2-weekdays">{daysOfWeek.map(day => <span key={day}>{day.slice(0, 1)}</span>)}</div>
            <div className="MobileDashV2-days">
              {calendarDays.flat().map((day, index) => (
                <span
                  key={`${day || 'empty'}-${index}`}
                  className={day ? `${getDayStatus(day) || 'empty'} ${isToday(day) ? 'today' : ''}` : 'blank'}
                >
                  {day || ''}
                </span>
              ))}
            </div>
            <footer>
              <span><i className="present" /> Present</span>
              <span><i className="late" /> Late</span>
              <span><i className="leave" /> Leave</span>
              <span><i className="absent" /> Absent</span>
            </footer>
          </section>

          <section className="MobileDashV2-card MobileDashV2-recent">
            <header>
              <div><i><FiActivity /></i><span><strong>Recent activity</strong><small>Your latest updates</small></span></div>
              <button type="button" onClick={() => setShowAllActivities(true)}>View all</button>
            </header>
            <div>
              {recentActivity.slice(0, 4).map((item, index) => {
                const itemDate = new Date(item.date || Date.now());
                return (
                  <article key={item._id || item.id || `${item.type}-${index}`}>
                    <time>{Number.isNaN(itemDate.getTime()) ? '--:--' : itemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    <i className={`type-${item.type || 'default'}`}><FiCheckCircle /></i>
                    <span><strong>{item.title || `${item.status || 'Activity'} recorded`}</strong><small>{item.subtitle || item.assignedTo || item.totalTime || 'Your workspace'}</small></span>
                  </article>
                );
              })}
              {!recentActivity.length && <p className="MobileDashV2-empty">No recent activity yet.</p>}
            </div>
          </section>

          <section className="MobileDashV2-card MobileDashV2-tasks">
            <header>
              <div><i><FiCheckCircle /></i><span><strong>Task overview</strong><small>This month</small></span></div>
              <button type="button" onClick={() => navigate('/ciisUser/task-management')}>Open tasks</button>
            </header>
            <div className="MobileDashV2-taskTotal"><strong>{taskSummary.total}</strong><span>Total tasks</span></div>
            <div className="MobileDashV2-taskBars">
              {[
                ['Completed', taskSummary.completed, 'green'],
                ['In progress', taskSummary.inProgress, 'blue'],
                ['Pending', taskSummary.pending, 'amber'],
                ['Overdue', taskSummary.overdue, 'red']
              ].map(([label, value, tone]) => (
                <div key={label}><span>{label}<b>{value}</b></span><i><em className={tone} style={{ width: `${taskSummary.total ? value / taskSummary.total * 100 : 0}%` }} /></i></div>
              ))}
            </div>
          </section>
        </main>
      )}

      <div className={`dashboard-reference-grid ${isMobile ? 'MobileDashV2-legacyHidden' : ''}`}>
      <main className="dashboard-main-column">
      
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-user-details">
            <p className="dashboard-greeting">
              {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, <span>👋</span>
            </p>
            <h1 className="dashboard-user-name">{user?.name || ''}</h1>
            <p className="dashboard-user-welcome">Stay focused and make today productive!</p>
            <div className="dashboard-user-tags">
              {userJobRoleDisplay && <span className="dashboard-tag dashboard-tag-role">
                <FiBriefcase size={14} /> {userJobRoleDisplay}
              </span>}
              {user?.employeeType && <span className="dashboard-tag dashboard-tag-type">
                <FiUser size={14} /> {user.employeeType}
              </span>}
              {companyDetails?.companyName && <span className="dashboard-tag dashboard-tag-company">
                <FiBriefcase size={14} /> {companyDetails.companyName}
              </span>}
            </div>
            <div className="dashboard-date-info">
              <MdToday size={14} />
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              <span className="dashboard-weather" title={weather.temperature === null ? weather.label : 'Live local weather'}><FiSun /> {weather.loading ? 'Loading weather…' : weather.temperature === null ? weather.label : `${weather.temperature}°C\u00A0 ${weather.label}`}</span>
            </div>
          </div>

          <div className="dashboard-focus-card">
            <strong>Today's Focus</strong>
            <span><FiCheckCircle /> {focusStats.loading ? 'Loading tasks…' : `${focusStats.dueToday} Tasks Due Today`}</span>
            <span><FiCheckCircle /> Attendance {loading.attendance ? 'Loading…' : hasTodayAttendance ? 'Completed' : 'Pending'}</span>
            <span><FiCalendar /> {focusStats.loading ? 'Loading tasks…' : `${focusStats.inProgress} Tasks In Progress`}</span>
          </div>

          <div className="dashboard-progress-dial" style={{ '--score': `${focusStats.dailyProgress * 3.6}deg` }}>
            <svg className="dashboard-progress-ring" viewBox="0 0 120 120" aria-hidden="true">
              <defs><linearGradient id="dashboard-progress-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7357ee" /><stop offset="100%" stopColor="#5b38e5" /></linearGradient></defs>
              <circle className="dashboard-progress-track" cx="60" cy="60" r="51" pathLength="100" />
              <circle className="dashboard-progress-value" cx="60" cy="60" r="51" pathLength="100" strokeDasharray={`${Math.max(0, Math.min(100, focusStats.dailyProgress))} 100`} />
            </svg>
            <div><span className="progress-title">Daily Progress</span><strong>{focusStats.loading ? '—' : `${focusStats.dailyProgress}%`}</strong><small>{focusStats.loading ? 'Loading…' : 'Great going!'}</small></div>
          </div>
          
          <div className="dashboard-clock-section dashboard-clock-inline">
            <div className="dashboard-timer-display">
              <div className="dashboard-timer-value">{formatTime(timer)}</div>
              <div className={`dashboard-timer-status ${isRunning ? 'status-active-text' : 'status-inactive-text'}`}>
                <div className={`dashboard-timer-dot ${isRunning ? 'dot-active' : 'dot-inactive'}`}></div>
                {isRunning ? 'Active Timer • Live' : 'Timer Stopped'}
              </div>
            </div>
            <div className="dashboard-clock-buttons">
              <button
                onClick={() => handleActionClick('in')}
                disabled={isRunning || loading.attendance || !isUserInCurrentCompany || isProcessing || selfieUploading}
                className={`dashboard-btn dashboard-btn-clockin ${isRunning ? 'btn-disabled' : ''}`}
              >
                <FiPlay size={20} /> Clock In
              </button>
              <button
                onClick={() => setShowClockOutConfirm(true)}
                disabled={!isRunning || loading.attendance || !isUserInCurrentCompany || isProcessing || selfieUploading}
                className={`dashboard-btn dashboard-btn-clockout ${!isRunning ? 'btn-disabled' : ''}`}
              >
                <FiSquare size={20} /> Clock Out
              </button>
            </div>
          </div>
        </div>
      </div>

      
      {loading.attendance ? (
        <StatsLoader />
      ) : (
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card stat-card-present">
            <div className="stat-card-header">
              <div className="stat-icon-container icon-present"><span className="stat-image-icon stat-image-present" aria-hidden="true" /></div>
              <div className="stat-current-month">Current Month</div>
            </div>
            <div className="stat-value">{String(monthlyStats.presentDays).padStart(2, '0')} <small>Days</small></div>
            <div className="stat-label">Present</div>
            <div className="stat-footer">
              <FiTrendingUp className="stat-trend-icon" />
              <span className="stat-month-text">20% vs Jun</span>
            </div>
            <svg className="dashboard-mini-spark" viewBox="0 0 120 28"><polyline points="0,22 14,10 28,18 42,7 56,20 70,12 84,23 100,5 120,16" /></svg>
          </div>

          <div className="dashboard-stat-card stat-card-late">
            <div className="stat-card-header">
              <div className="stat-icon-container icon-late"><span className="stat-image-icon stat-image-late" aria-hidden="true" /></div>
              <div className="stat-current-month">Current Month</div>
            </div>
            <div className="stat-value">{String(monthlyStats.lateDays).padStart(2, '0')} <small>Days</small></div>
            <div className="stat-label">Late</div>
            <div className="stat-footer">
              <FiAlertTriangle className="stat-trend-icon" />
              <span className="stat-month-text">0% vs Jun</span>
            </div>
            <svg className="dashboard-mini-spark" viewBox="0 0 120 28"><polyline points="0,8 14,23 28,14 42,19 56,10 70,21 84,13 100,24 120,7" /></svg>
          </div>

          <div className="dashboard-stat-card stat-card-halfday">
            <div className="stat-card-header">
              <div className="stat-icon-container icon-halfday"><span className="stat-image-icon stat-image-halfday" aria-hidden="true" /></div>
              <div className="stat-current-month">Current Month</div>
            </div>
            <div className="stat-value">{String(monthlyStats.halfDays).padStart(2, '0')} <small>Days</small></div>
            <div className="stat-label">Half Day</div>
            <div className="stat-footer">
              <FiActivity className="stat-trend-icon" />
              <span className="stat-month-text">12% vs Jun</span>
            </div>
            <svg className="dashboard-mini-spark" viewBox="0 0 120 28"><polyline points="0,19 14,7 28,13 42,9 56,22 70,15 84,20 100,10 120,12" /></svg>
          </div>

          <div className="dashboard-stat-card stat-card-leave">
            <div className="stat-card-header">
              <div className="stat-icon-container icon-leave"><span className="stat-image-icon stat-image-leave" aria-hidden="true" /></div>
              <div className="stat-current-month">Current Month</div>
            </div>
            <div className="stat-value">{String(monthlyStats.leavesTaken).padStart(2, '0')} <small>Days</small></div>
            <div className="stat-label">Leave</div>
            <div className="stat-footer">
              <FiCheckCircle className="stat-trend-icon" />
              <span className="stat-month-text">0% vs Jun</span>
            </div>
            <svg className="dashboard-mini-spark" viewBox="0 0 120 28"><polyline points="0,6 14,8 28,22 42,13 56,24 70,11 84,20 100,9 120,18" /></svg>
          </div>

          <div className="dashboard-stat-card stat-card-absent">
            <div className="stat-card-header">
              <div className="stat-icon-container icon-absent"><span className="stat-image-icon stat-image-absent" aria-hidden="true" /></div>
              <div className="stat-current-month">Current Month</div>
            </div>
            <div className="stat-value">{String(monthlyStats.absentDays).padStart(2, '0')} <small>Days</small></div>
            <div className="stat-label">Absent</div>
            <div className="stat-footer">
              <FiAlertCircle className="stat-trend-icon" />
              <span className="stat-month-text">5% vs Jun</span>
            </div>
            <svg className="dashboard-mini-spark" viewBox="0 0 120 28"><polyline points="0,7 14,9 28,24 42,19 56,22 70,11 84,25 100,18 120,20" /></svg>
          </div>
        </div>
      )}

      <div className="dashboard-content-grid">
        
        {loading.attendance || holidaysLoading ? (
          <CalendarLoader />
        ) : (
          <div className="dashboard-calendar-card">
            <div className="calendar-header">
              <div className="calendar-title-section">
                <div className="calendar-icon-container"><FiCalendar className="calendar-icon" /></div>
                <div>
                  <h2 className="calendar-title">Attendance Calendar</h2>
                </div>
              </div>
              <div className="calendar-controls">
                <button onClick={handlePrevMonth} className="calendar-nav-btn" disabled={isMonthBeforeJoin(calendarYear, calendarMonth)}>
                  <FiChevronLeft className="nav-icon" />
                </button>
                <strong className="calendar-current-month">{monthNames[calendarMonth]} {calendarYear}</strong>
                <button onClick={resetToCurrentMonth} className="calendar-today-btn">Today</button>
                <button onClick={handleNextMonth} className="calendar-nav-btn">
                  <FiChevronRight className="nav-icon" />
                </button>
              </div>
            </div>

            {isMonthBeforeJoin(calendarYear, calendarMonth) && (
              <div className="calendar-before-join-message">
                <FiClock size={16} />
                <span>You joined on {formattedJoinDate}. No attendance records before this date.</span>
              </div>
            )}

            <div className="calendar-body">
              <div className="calendar-week-header">
                {daysOfWeek.map(day => <div key={day} className="calendar-day-header">{day}</div>)}
              </div>
              <div className="calendar-grid">
                {calendarDays.map((week, weekIndex) => (
                  <div key={weekIndex} className="calendar-week">
                    {week.map((day, dayIndex) => (
                      <div key={dayIndex} className="calendar-day-wrapper">
                        {day ? (
                          <div className="calendar-day-container">
                            <div
                              className={`calendar-day ${getDayStatus(day) || 'empty'} ${isToday(day) ? 'day-today' : ''}`}
                              title={
                                getDayStatus(day) === 'holiday' 
                                  ? `🎉 Holiday: ${holidayTitles[`${calendarYear}-${calendarMonth}-${day}`] || 'Holiday'}`
                                  : isBeforeJoinDate(new Date(calendarYear, calendarMonth, day)) 
                                    ? 'Before joining date' 
                                    : getDayStatus(day)?.charAt(0).toUpperCase() + getDayStatus(day)?.slice(1) || 'No Record'
                              }
                              data-holiday-title={getDayStatus(day) === 'holiday' ? holidayTitles[`${calendarYear}-${calendarMonth}-${day}`] : ''}
                            >
                              <span className="day-number">{day}</span>
                              {getDayStatus(day) && <span className="day-status-icon" aria-hidden="true" />}
                            </div>
                            {isToday(day) && <div className="today-indicator"></div>}
                          </div>
                        ) : <div className="calendar-empty-day"></div>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="attendance-day-summary">
              <div className="attendance-summary-head"><strong>{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</strong><span>{todayAttendance?.status ? normalizeAttendanceStatus(todayAttendance.status).replace('HALF DAY', 'Half Day').replace('PRESENT', 'Present').replace('LATE', 'Late').replace('ABSENT', 'Absent') : 'Pending'}</span></div>
              <dl>
                <div><dt>Check In</dt><dd>{formatClockTime(todayAttendance?.inTime)}</dd></div>
                <div><dt>Check Out</dt><dd>{isRunning ? 'In progress' : formatClockTime(todayAttendance?.outTime)}</dd></div>
                <div><dt>Total Working</dt><dd>{isRunning ? formatTime(timer) : todayAttendance?.totalTime || '00:00:00'}</dd></div>
                <div><dt>Late</dt><dd>{todayAttendance ? (normalizeAttendanceStatus(todayAttendance.status) === 'LATE' || (todayAttendance.lateBy && todayAttendance.lateBy !== '00:00:00') ? `Yes${todayAttendance.lateBy && todayAttendance.lateBy !== '00:00:00' ? ` (${todayAttendance.lateBy})` : ''}` : 'No') : '--'}</dd></div>
                <div><dt>Break Time</dt><dd>{getTrackedBreakTime(todayAttendance)}</dd></div>
                <div><dt>Tasks Completed</dt><dd>{focusStats.loading ? '—' : focusStats.completedToday}</dd></div>
              </dl>
              <button onClick={() => navigate('/ciisUser/attendance')}>View Full Attendance</button>
            </div>

            <div className="calendar-legend">
              <div className="legend-item"><div className="legend-color color-present"></div><span>Present</span></div>
              <div className="legend-item"><div className="legend-color color-late"></div><span>Late</span></div>
              <div className="legend-item"><div className="legend-color color-halfday"></div><span>Half Day</span></div>
              <div className="legend-item"><div className="legend-color color-leave"></div><span>Leave</span></div>
              <div className="legend-item"><div className="legend-color color-absent"></div><span>Absent</span></div>
              <div className="legend-item"><div className="legend-color color-weekend"></div><span>Weekend</span></div>
              <div className="legend-item"><div className="legend-color color-holiday"></div><span>Holiday 🎉</span></div>
              <div className="legend-item"><div className="legend-color color-before-join"></div><span>Before Joining</span></div>
            </div>
          </div>
        )}

        
        <div className="dashboard-activity-card">
          <div className="activity-header">
            <div className="activity-title-section">
              <div className="activity-icon-container"><span className="activity-header-image-icon" aria-hidden="true" /></div>
              <div>
                <h2 className="activity-title">Recent Activity</h2>
              </div>
            </div>
            <button onClick={() => setShowAllActivities(true)} className="activity-view-all">View All</button>
          </div>

          <div className="activity-list">
            
            {loading.attendance && recentActivity.length > 0 && <RefreshOverlay />}
            
            
            {loading.attendance && !recentActivity.length && <ActivityLoader />}
            
            
            {!loading.attendance && recentActivity.slice(0, 5).map((item, index) => {
              if (['clock-in', 'clock-out', 'lunch'].includes(item.type)) {
                const date = new Date(item.date);
                return (
                  <div key={`${item.type}-${index}`} className={`activity-item timeline-activity activity-type-${item.type}`}>
                    <time className="activity-timeline-time">{item.displayTime || (Number.isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</time>
                    <div className="activity-item-content">
                      <div className="activity-status-icon status-default"><span className="timeline-css-icon" /></div>
                      <div className="activity-details"><div className="activity-title">{item.title}</div><div className="activity-time">{item.subtitle}</div></div>
                    </div>
                  </div>
                );
              }
              
              if (item.type === 'holiday') {
                const date = new Date(item.date);
                return (
                  <div key={`holiday-${index}`} className="activity-item holiday-item">
                    <div className="activity-item-content">
                      <div className="activity-status-icon status-holiday">
                        <CalendarDays className="status-icon" />
                      </div>
                      <div className="activity-details">
                        <div className="activity-date">
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          <span className="holiday-badge">🎉 Holiday</span>
                        </div>
                        <div className="activity-title">{item.title}</div>
                      </div>
                    </div>
                    <div className="activity-status status-holiday">HOLIDAY</div>
                  </div>
                );
              }

              if (item.type === 'task') {
                const date = new Date(item.date);
                return (
                  <div key={`task-${index}`} className="activity-item timeline-activity activity-type-task">
                    <time className="activity-timeline-time">{Number.isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    <div className="activity-item-content">
                      <div className="activity-status-icon status-default">
                        <span className="timeline-css-icon" />
                      </div>
                      <div className="activity-details">
                        <div className="activity-title">{item.title}</div>
                        {item.assignedTo && (
                          <div className="activity-time">
                            <FiUser size={12} /> {item.assignedTo}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="activity-status status-default">{item.status || 'pending'}</div>
                  </div>
                );
              }
              
              
              const date = new Date(item.date);
              const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
              return (
                <div key={index} className="activity-item">
                  <div className="activity-item-content">
                    <div className={`activity-status-icon ${getStatusColor(item.status)}`}>
                      {item.status === 'PRESENT' && <CheckCircle2 className="status-icon" />}
                      {item.status === 'LATE' && <CalendarClock className="status-icon" />}
                      {item.status === 'HALF DAY' && <Coffee className="status-icon" />}
                      {item.status === 'ABSENT' && <LogOut className="status-icon" />}
                      {!['PRESENT', 'LATE', 'HALF DAY', 'ABSENT'].includes(item.status) && <Play className="status-icon" />}
                    </div>
                    <div className="activity-details">
                      <div className="activity-date">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {isCurrentMonth && <span className="current-month-badge">Current Month</span>}
                      </div>
                      <div className="activity-time">
                        <MdAccessTime size={12} /> {item.totalTime || '--:--:--'}
                      </div>
                    </div>
                  </div>
                  <div className={`activity-status ${getStatusColor(item.status)}`}>{item.status}</div>
                </div>
              );
            })}
            
            
            {!loading.attendance && !recentActivity.length && (
              <div className="activity-empty-state">
                <div className="empty-icon-container"><FiClock className="empty-icon" /></div>
                <p className="empty-title">No activity found</p>
                <p className="empty-subtitle">
                  {userJoinDate ? `You joined on ${formattedJoinDate}. Records will appear after this date.` : 'Your activity will appear here'}
                </p>
              </div>
            )}
          </div>          
        </div>
      </div>

      <div className="dashboard-month-info">
        <div className="month-info-content">
          <div className="month-info-left">
            <div className="month-info-title">
              <div className="month-info-icon"><FiCalendar /></div>
              <h3>Current Month: {monthNames[currentMonth]} {currentYear}</h3>
            </div>
            <p className="month-info-description">
              Stats show only this month's data. Calendar displays complete attendance history from your join date.
              {userJoinDate && <span className="month-info-note"> Dates before {formattedJoinDate} are shown in white.</span>}
            </p>
          </div>
          <div className="month-info-right">
            <div className="month-current-day">{new Date().getDate()}</div>
            <div className="month-current-info">{monthNames[currentMonth].substring(0, 3)} • Today</div>
            <div className="month-day-count">Day {currentDate.getDate()} of {new Date(currentYear, currentMonth + 1, 0).getDate()}</div>
          </div>
        </div>
      </div>
      <section className="dashboard-insights-row">
        <article className="dashboard-insight-card dashboard-task-overview">
          <div className="dashboard-section-heading"><strong>Task Overview</strong><button onClick={() => navigate('/ciisUser/task-management')}>View all</button></div>
          {dashboardTaskStats.loading ? <div className="dashboard-empty-schedule">Loading task overview...</div> : <div className="task-overview-body">
            <div className="task-donut" style={{ '--done': `${taskSummary.total ? (taskSummary.completed / taskSummary.total) * 360 : 0}deg` }}><span><b>{taskSummary.total}</b>Total Tasks</span></div>
            <div className="task-legend">
              <span><i className="green" />Completed <b>{taskSummary.completed} ({taskSummary.total ? Math.round(taskSummary.completed / taskSummary.total * 100) : 0}%)</b></span>
              <span><i className="blue" />In Progress <b>{taskSummary.inProgress} ({taskSummary.total ? Math.round(taskSummary.inProgress / taskSummary.total * 100) : 0}%)</b></span>
              <span><i className="orange" />Pending <b>{taskSummary.pending} ({taskSummary.total ? Math.round(taskSummary.pending / taskSummary.total * 100) : 0}%)</b></span>
              <span><i className="red" />Overdue <b>{taskSummary.overdue} ({taskSummary.total ? Math.round(taskSummary.overdue / taskSummary.total * 100) : 0}%)</b></span>
            </div>
          </div>}
        </article>
        <article className="dashboard-insight-card dashboard-productivity-card">
          <div className="dashboard-section-heading"><strong>Productivity Score</strong><em className="productivity-score-value">{dashboardTaskStats.loading ? '—' : <><b>{productivityScore}%</b><small>{productivityLabel}</small></>}</em></div>
          {dashboardTaskStats.loading ? <div className="dashboard-empty-schedule">Loading productivity...</div> : productivityTrend.some(day => day.hasData) ? (
            <div className="productivity-chart">
              <div className="productivity-axis"><span>100</span><span>50</span><span>0</span></div>
              <svg viewBox="0 0 340 120" preserveAspectRatio="none">
                <polyline points={productivityTrend.map(day => `${day.x},${day.y}`).join(' ')} />
                <g>{productivityTrend.map(day => <circle
                  key={day.date.toISOString()}
                  cx={day.x}
                  cy={day.y}
                  r="5"
                  tabIndex="0"
                  onMouseEnter={() => setHoveredProductivityDay(day)}
                  onMouseLeave={() => setHoveredProductivityDay(null)}
                  onFocus={() => setHoveredProductivityDay(day)}
                  onBlur={() => setHoveredProductivityDay(null)}
                />)}</g>
              </svg>
              {hoveredProductivityDay && (
                <div
                  className="productivity-tooltip"
                  style={{
                    left: `${(hoveredProductivityDay.x / 340) * 100}%`,
                    top: `${Math.max(0, hoveredProductivityDay.y - 8)}px`
                  }}
                >
                  <strong>{hoveredProductivityDay.date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                  <span>Productivity <b>{hoveredProductivityDay.score}%</b></span>
                  <span>Attendance <b>{hoveredProductivityDay.attendanceStatus ? `${hoveredProductivityDay.attendanceStatus} (${hoveredProductivityDay.attendanceScore}%)` : 'No record'}</b></span>
                  <span>Tasks <b>{hoveredProductivityDay.completed}/{hoveredProductivityDay.total} completed</b></span>
                </div>
              )}
              <div>{productivityTrend.map(day => <span key={day.date.toISOString()}>{day.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>)}</div>
            </div>
          ) : <div className="dashboard-empty-schedule">No productivity data for the last 7 days</div>}
        </article>
        <article className="dashboard-insight-card dashboard-projects-card">
          <div className="dashboard-section-heading"><strong>Top Projects</strong><button onClick={() => navigate('/ciisUser/project')}>View All</button></div>
          <div className="project-progress-list">
            {topProjects.map((project, index) => {
              const ProjectIcon = [BriefcaseBusiness, Smartphone, LayoutDashboard][index];
              return <div key={project._id || project.id || index}><span><ProjectIcon /> {project.projectName || project.name || project.title || 'Untitled project'} <b>{project.progress}%</b></span><i><em style={{ width: `${project.progress}%` }} /></i><small>{project.taskCount} task{project.taskCount === 1 ? '' : 's'}</small></div>;
            })}
            {projectsLoading && <div className="dashboard-empty-schedule">Loading projects...</div>}
            {!projectsLoading && !topProjects.length && <div className="dashboard-empty-schedule">No project data available</div>}
          </div>
        </article>
      </section>
      </main>

      <aside className="dashboard-right-rail">
        <section className="dashboard-clock-section dashboard-clock-rail">
          <div className="dashboard-live-label"><i /> {isRunning ? 'Live' : 'Ready'}</div>
          <div className="dashboard-timer-display">
            <div className="dashboard-timer-value">{formatTime(timer)} <small>{new Date().getHours() >= 12 ? 'PM' : 'AM'}</small></div>
            <div className="dashboard-clock-date">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div className="dashboard-clock-buttons">
            <button onClick={() => handleActionClick('in')} disabled={isRunning || loading.attendance || !isUserInCurrentCompany || isProcessing || selfieUploading} className={`dashboard-btn dashboard-btn-clockin ${isRunning ? 'btn-disabled' : ''}`}><FiPlay size={17} /> Clock In</button>
            <button onClick={() => setShowClockOutConfirm(true)} disabled={!isRunning || loading.attendance || !isUserInCurrentCompany || isProcessing || selfieUploading} className={`dashboard-btn dashboard-btn-clockout ${!isRunning ? 'btn-disabled' : ''}`}><FiSquare size={15} /> Clock Out</button>
          </div>
        </section>
        <section className="dashboard-ai-card">
          <div className="dashboard-section-heading"><strong><FiZap /> AI Assistant</strong><span>Coming Soon</span></div>
          <div className="dashboard-ai-summary dashboard-ai-coming-soon">
            <div className="ai-coming-soon-visual">
              <div className="ai-orb"><Sparkles /></div>
              <i className="ai-orbit-dot ai-orbit-dot-one" />
              <i className="ai-orbit-dot ai-orbit-dot-two" />
            </div>
            <p>Your smart work assistant is on the way</p>
            <small>Get personalized insights, task suggestions and instant answers from your workspace.</small>
            <div className="ai-feature-pills">
              <span>Smart insights</span>
              <span>Task help</span>
              <span>Quick answers</span>
            </div>
          </div>
        </section>

        <section className="dashboard-side-panel dashboard-schedule-panel">
          <div className="dashboard-section-heading"><strong>Upcoming Schedule</strong><button onClick={() => navigate('/ciisUser/employee-meeting')}>View All</button></div>
          {upcomingMeetings.slice(0, 3).map((meeting, index) => (
            <button className="schedule-row" key={meeting._id || meeting.id || index} onClick={() => navigate('/ciisUser/employee-meeting')}>
              <time>{meeting.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              <span>
                <strong>{meeting.title || meeting.subject || meeting.agenda || 'Scheduled Meeting'}</strong>
                <small>{meeting.scheduledAt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{meeting.description ? ` • ${meeting.description}` : ''}</small>
              </span>
              {meeting.meetingLink || meeting.link || String(meeting.mode || '').toLowerCase().includes('online') ? <Video className="schedule-channel-icon" /> : <CalendarClock className="schedule-channel-icon" />}
            </button>
          ))}
          {!upcomingMeetings.length && (
            <div className="schedule-empty-state">
              <div className="schedule-empty-visual" aria-hidden="true">
                <CheckCircle2 />
                <span />
              </div>
              <div className="schedule-empty-copy">
                <strong>No meetings scheduled</strong>
                <p>Your schedule is clear for now.</p>
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-side-panel dashboard-quick-actions-panel">
          <div className="dashboard-section-heading"><strong>Quick Actions</strong></div>
          <div className="dashboard-quick-grid">
            {visibleQuickActions.map(action => <button key={action.label} onClick={() => openQuickAction(action)} className={!action.fields ? 'quick-action-static' : ''} title={!action.fields ? 'Coming soon' : action.label}><i className={action.tone}>{action.icon}</i><span>{action.label}</span></button>)}
          </div>
        </section>
      </aside>
      </div>
    </div>
  );
};

export default UserDashboard;
