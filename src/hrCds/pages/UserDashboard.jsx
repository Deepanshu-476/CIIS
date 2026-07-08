
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UserDashboard.css';
import useIsMobile from '../../hooks/useIsMobile';
import CIISLoader from '../../Loader/CIISLoader';

import WelcomeHeader from '../../components/dashboard/WelcomeHeader';
import ClockInSection from '../../components/dashboard/ClockInSection';
import StatsCards from '../../components/dashboard/StatsCards';
import AttendanceCalendar from '../../components/dashboard/AttendanceCalendar';
import RecentActivity from '../../components/dashboard/RecentActivity';


import {
  FiClock, FiCalendar, FiChevronLeft, FiChevronRight,
  FiPlay, FiSquare, FiRefreshCw, FiBriefcase, FiUser,
  FiCheckCircle, FiAlertCircle, FiTrendingUp, FiActivity,
  FiX, FiAlertTriangle
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
  date: task.dueDateTime || task.dueDate || task.updatedAt || task.createdAt,
  title: task.title || task.name || 'Task activity',
  status: task.userStatus || task.overallStatus || task.status || (task.completed ? 'completed' : 'pending'),
  assignedTo: Array.isArray(task.assignedUsers)
    ? task.assignedUsers.map(item => item?.name || item?.email).filter(Boolean).join(', ')
    : getDisplayName(task.assignee || task.assignedTo || ''),
});


const StatsLoader = () => (
  <div className="stats-loader-container">
    {[1, 2, 3, 4].map((i) => (
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
  
  const [pageLoading, setPageLoading] = useState(true);
  
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [taskActivity, setTaskActivity] = useState([]);
  
  
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  
  const [loading, setLoading] = useState({
    attendance: false,
    leaves: false,
    status: false,
    jobRoles: false
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [jobRolesLoading, setJobRolesLoading] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState([]);
  
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (!user || !companyDetails) return false;
    const userCompanyCode = user.companyCode || user?.company?.companyCode;
    const companyCode = companyDetails.companyCode;
    return userCompanyCode === companyCode;
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
        _id: role._id || role.id || role.roleId || 'employee',
        roleName: role.roleName || role.name || role.jobRole || role.title || 'Employee',
        roleNumber: role.roleNumber || role.roleNo || role.code || 'N/A',
      }));
      
      setJobRoles(formattedJobRoles.length ? formattedJobRoles : [
        { _id: 'employee', roleName: 'Employee', roleNumber: 'EMP001' }
      ]);
      
    } catch (error) {
      console.error('Job roles fetch error:', error);
      setJobRoles([{ _id: 'employee', roleName: 'Employee', roleNumber: 'EMP001' }]);
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
      return;
    }

    fetchInProgress.current.taskActivity = true;

    try {
      const response = await axios.get(`/task/user/${userId}/all-tasks`, {
        params: { page: 1, limit: 8, period: 'all' },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      setTaskActivity(pickTaskRecords(response.data).map(mapTaskToActivity));
    } catch (error) {
      console.error('Failed to load recent task activity:', error);
      try {
        const response = await axios.get(`/task/user-activity/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        const logs = response.data?.logs || response.data?.data?.logs || [];
        setTaskActivity(logs.slice(0, 8).map(log => ({
          type: 'task',
          title: log.description || log.action || log.task?.title || 'Activity',
          date: log.createdAt || log.updatedAt,
          assignedTo: log.user?.name || '',
          status: log.action || ''
        })));
      } catch (fallbackError) {
        console.error('Failed to load recent activity fallback:', fallbackError);
        setTaskActivity([]);
      }
    } finally {
      fetchInProgress.current.taskActivity = false;
    }
  }, [token, isUserInCurrentCompany, user]);

  
  const updateRecentActivity = useCallback((attendance, holidayList, tasks = taskActivity) => {
    
    const allActivities = [];
    
    
    attendance.forEach(record => {
      allActivities.push({
        ...record,
        type: 'attendance',
        date: record.date,
        status: record.status,
        displayDate: new Date(record.date)
      });
    });
    
    
    holidayList.forEach(holiday => {
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
      allActivities.push({
        ...task,
        type: 'task',
        date: task.date,
        status: task.status || 'pending',
        displayDate: new Date(task.date || Date.now())
      });
    });
    
    
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    
    setRecentActivity(allActivities.slice(0, 5));
  }, [taskActivity]);

  
  const fetchDashboardConfig = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      const response = await axios.get(`/company/${companyId}/dashboard-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.dashboardConfig) {
        setDashboardConfig(response.data.dashboardConfig);
      }
    } catch (err) {
      console.error("Failed to load dashboard config:", err);
      setDashboardConfig([
        { componentId: 'header', componentName: 'Welcome Header', isEnabled: true, sortOrder: 1 },
        { componentId: 'clock-in', componentName: 'Attendance Timer & Clock In', isEnabled: true, sortOrder: 2, settings: { attendanceMode: 'normal' } },
        { componentId: 'stats', componentName: 'Monthly Stats Grid', isEnabled: true, sortOrder: 3 },
        { componentId: 'calendar', componentName: 'Attendance Calendar Grid', isEnabled: true, sortOrder: 4 },
        { componentId: 'activity', componentName: 'Recent Activity Timeline', isEnabled: true, sortOrder: 5 }
      ]);
    }
  }, [getCompanyId, token]);

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
        await fetchDashboardConfig();
        await fetchJobRoles();
        await fetchHolidays(); 
        await fetchAttendanceData(true); 
        await fetchLeaveData();
        await fetchCurrentStatus();
        await fetchRecentTaskActivity();
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
  }, []);

  
  useEffect(() => {
    if (attendanceData.length > 0 || holidays.length > 0 || taskActivity.length > 0) {
      updateRecentActivity(attendanceData, holidays, taskActivity);
    }
  }, [attendanceData, holidays, taskActivity, updateRecentActivity]);

  
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cancelPendingRequests]);

  const getJobRoleDisplayName = useCallback(() => {
    if (jobRolesLoading) return 'Loading...';
    if (!jobRoles.length) return 'Employee';
    
    const userJobRole = user?.jobRole;
    if (!userJobRole) return 'Employee';
    
    const foundRole = jobRoles.find(role => 
      role._id === userJobRole || 
      role.roleNumber === userJobRole ||
      role.roleName === userJobRole
    );
    
    return foundRole?.roleName || 'Employee';
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
      if (leave.status === 'APPROVED' || leave.status === 'Approved') {
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
    if (markedDates.includes(key)) return "present";
    if (lateDates.includes(key)) return "late";
    if (halfDayDates.includes(key)) return "halfday";
    if (leaveDates.includes(key)) return "leave";
    if (absentDates.includes(key)) return "absent";
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
  }, [loading.attendance, fetchAttendanceData, fetchRecentTaskActivity]);

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

  const sortedConfigs = useMemo(() => {
    return [...dashboardConfig]
      .filter(item => item.isEnabled)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [dashboardConfig]);

  
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

  const dashboardProps = {
    user,
    companyDetails,
    userJobRoleDisplay,
    currentDate,
    timer,
    isRunning,
    loading,
    isUserInCurrentCompany,
    isProcessing,
    handleIn,
    handleClockOut,
    monthlyStats,
    currentMonth,
    monthNames,
    holidaysLoading,
    calendarMonth,
    calendarYear,
    handlePrevMonth,
    resetToCurrentMonth,
    handleNextMonth,
    isMonthBeforeJoin,
    formattedJoinDate,
    calendarDays,
    getDayStatus,
    getDayIcon,
    isToday,
    holidayTitles,
    daysOfWeek,
    isBeforeJoinDate,
    recentActivity,
    handleRefresh,
    getStatusColor,
    userJoinDate,
    currentYear
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
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
              <button className="confirmation-btn confirmation-btn-confirm" onClick={() => handleClockOut({})} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Confirm Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {sortedConfigs.map(comp => {
        if (comp.componentId === 'header') {
          return (
            <div key="header" className="dashboard-header" style={{ width: '100%' }}>
              <WelcomeHeader {...dashboardProps} />
            </div>
          );
        }
        if (comp.componentId === 'clock-in') {
          return (
            <div key="clock-in" className="dashboard-header" style={{ width: '100%' }}>
              <ClockInSection config={comp} {...dashboardProps} />
            </div>
          );
        }
        if (comp.componentId === 'stats') {
          return <StatsCards key="stats" {...dashboardProps} />;
        }
        if (comp.componentId === 'calendar') {
          return <AttendanceCalendar key="calendar" {...dashboardProps} />;
        }
        if (comp.componentId === 'activity') {
          return <RecentActivity key="activity" {...dashboardProps} />;
        }
        return null;
      })}

      <div className="dashboard-month-info" style={{ width: '100%' }}>
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
    </div>
  );
};

export default UserDashboard;
