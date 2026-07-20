import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "../../utils/axiosConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiUser,
  FiTrendingUp,
  FiDownload,
  FiEye,
  FiChevronRight,
  FiFilter,
  FiCheckCircle,
  FiAlertCircle,
  FiMinusCircle,
  FiX,
  FiBarChart2,
  FiRefreshCw,
  FiAlertTriangle,
  FiWatch,
  FiGift,
  FiCalendar as FiCalendarRange 
} from "react-icons/fi";
import { MdCelebration } from "react-icons/md";
import '../Css/Attendance.css';
import CIISLoader from '../../Loader/CIISLoader';
import VirtualList from '../../components/VirtualList';

const calculateDistance = (lat1, lon1, lat2 = 30.707949, lon2 = 76.6860975) => {
  if (lat1 === undefined || lat1 === null || lon1 === undefined || lon1 === null) return null;
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in meters
  return Math.round(d);
};

const normalizeAttendanceStatus = (status) => {
  const compactStatus = String(status || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '');

  const statusMap = {
    PRESENT: 'PRESENT',
    LATE: 'LATE',
    ABSENT: 'ABSENT',
    HALFDAY: 'HALF DAY',
    HOLIDAY: 'HOLIDAY',
  };

  return statusMap[compactStatus] || compactStatus;
};

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeRange, setTimeRange] = useState("MONTH");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  
  
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateRangeActive, setIsDateRangeActive] = useState(false);
  
  
  const [userJoinDate, setUserJoinDate] = useState(null);
  const [formattedJoinDate, setFormattedJoinDate] = useState('');
  
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    halfDay: 0,
    total: 0,
    percentage: 0,
  });

  
  const filterMenuRef = useRef(null);
  const calendarRef = useRef(null);
  const dateRangePickerRef = useRef(null);
  const mobileFilterRef = useRef(null);

  
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
    const handleClickOutside = (event) => {
      
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
      
      
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      
      
      if (dateRangePickerRef.current && !dateRangePickerRef.current.contains(event.target)) {
        setShowDateRangePicker(false);
      }
      
      
      if (showMobileFilter && 
          mobileFilterRef.current && 
          !mobileFilterRef.current.contains(event.target) &&
          !event.target.closest('.Attendance-icon-button')) {
        setShowMobileFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileFilter]);

  
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setShowFilterMenu(false);
        setShowCalendar(false);
        setShowDateRangePicker(false);
        setShowMobileFilter(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  
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

  
  const isBeforeJoinDate = useCallback((date) => {
    if (!userJoinDate) return false;
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    const joinDate = new Date(userJoinDate);
    joinDate.setHours(0, 0, 0, 0);
    
    return compareDate < joinDate;
  }, [userJoinDate]);

  const isFutureDate = useCallback((date) => {
    const compareDate = new Date(date);
    if (Number.isNaN(compareDate.getTime())) return false;
    compareDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return compareDate > today;
  }, []);

  const isFutureAbsentRecord = useCallback((record) => (
    normalizeAttendanceStatus(record?.status) === 'ABSENT' && isFutureDate(record?.date)
  ), [isFutureDate]);

  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  
  const fetchHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    try {
      const response = await axios.get('/holidays', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (response.data?.success) {
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
    }
  }, [token, userJoinDate, isBeforeJoinDate]);

  
  const fetchAttendance = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await axios.get("/attendance/list", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let attendanceData = [];

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        attendanceData = response.data.data;
      } else if (Array.isArray(response.data)) {
        attendanceData = response.data;
      } else if (response.data && Array.isArray(response.data.attendance)) {
        attendanceData = response.data.attendance;
      } else {
        attendanceData = [];
      }

      
      if (userJoinDate) {
        attendanceData = attendanceData.filter(record => !isBeforeJoinDate(record.date));
      }

      attendanceData = attendanceData.filter(record => !isFutureAbsentRecord(record));

      setAttendance(attendanceData);

      if (showRefresh) {
        toast.success("🔄 Attendance data refreshed!");
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("❌ Failed to load attendance records");
      setAttendance([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, userJoinDate, isBeforeJoinDate, isFutureAbsentRecord]);

  
  const processedAttendance = useMemo(() => {
    const attendanceMap = new Map();
    attendance.filter(record => !isFutureAbsentRecord(record)).forEach(record => {
      const dateStr = new Date(record.date).toDateString();
      attendanceMap.set(dateStr, record);
    });

    const combined = [];
    
    attendance.filter(record => !isFutureAbsentRecord(record)).forEach(record => {
      combined.push({ ...record, isHoliday: false });
    });

    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      const dateStr = holidayDate.toDateString();
      const attendanceRecord = attendanceMap.get(dateStr);
      
      if (!attendanceRecord) {
        combined.push({
          _id: `holiday-${holiday._id || holidayDate.getTime()}`,
          date: holiday.date,
          status: 'HOLIDAY',
          holidayTitle: holiday.title,
          isHoliday: true,
          inTime: null,
          outTime: null,
          totalTime: null,
          lateBy: null,
          earlyLeave: null,
          overTime: null
        });
      } else {
        const index = combined.findIndex(r => 
          new Date(r.date).toDateString() === dateStr
        );
        if (index !== -1) {
          combined[index] = {
            ...attendanceRecord,
            isHoliday: true,
            holidayTitle: holiday.title,
          };
        }
      }
    });

    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, holidays, isFutureAbsentRecord]);

  
  const calculateStats = useCallback((data) => {
    const attendanceRecords = data.filter(record => (
      (!record.isHoliday || normalizeAttendanceStatus(record.status) !== 'HOLIDAY') && !isFutureAbsentRecord(record)
    ));
    
    const present = attendanceRecords.filter((record) => normalizeAttendanceStatus(record.status) === "PRESENT").length;
    const late = attendanceRecords.filter((record) => normalizeAttendanceStatus(record.status) === "LATE").length;
    const absent = attendanceRecords.filter((record) => normalizeAttendanceStatus(record.status) === "ABSENT").length;
    const halfDay = attendanceRecords.filter((record) => normalizeAttendanceStatus(record.status) === "HALF DAY").length;
    const total = attendanceRecords.length;
    
    const workingDays = present + late;
    const percentage = total > 0 ? Math.round((workingDays / total) * 100) : 0;

    setStats({
      present,
      late,
      absent,
      halfDay,
      total,
      percentage,
    });
  }, [isFutureAbsentRecord]);

  
  const initialLoadRef = useRef(false);
  
  useEffect(() => {
    if (initialLoadRef.current) return;
    if (!userJoinDate) return;
    
    initialLoadRef.current = true;
    setPageLoading(true);
    
    const loadData = async () => {
      try {
        await Promise.all([
          fetchHolidays(),
          fetchAttendance()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    loadData();
  }, [userJoinDate, fetchAttendance, fetchHolidays]);

  
  useEffect(() => {
    if (userJoinDate) {
      fetchAttendance();
    }
  }, [userJoinDate, fetchAttendance]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "--";
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid Time";
    }
  };

  const getStatusIcon = (record) => {
    const status = normalizeAttendanceStatus(record.status);
    const isHoliday = record.isHoliday;
    
    if (isHoliday && status === 'PRESENT') {
      return (
        <div className="Attendance-status-icon-wrapper">
          <MdCelebration className="Attendance-status-icon holiday-icon" />
          <FiCheckCircle className="Attendance-status-icon present-icon" />
        </div>
      );
    }
    
    if (isHoliday || status === 'HOLIDAY') {
      return <MdCelebration className="Attendance-status-icon holiday-icon" />;
    }
    
    switch (status) {
      case "PRESENT":
        return <FiCheckCircle className="Attendance-status-icon present-icon" />;
      case "LATE":
        return <FiAlertTriangle className="Attendance-status-icon late-icon" />;
      case "ABSENT":
        return <FiMinusCircle className="Attendance-status-icon absent-icon" />;
      case "HALF DAY":
        return <FiAlertCircle className="Attendance-status-icon halfday-icon" />;
      default:
        return <FiClock className="Attendance-status-icon" />;
    }
  };

  const getStatusColor = (record) => {
    const status = normalizeAttendanceStatus(record.status);
    const isHoliday = record.isHoliday;
    
    if (isHoliday && status === 'PRESENT') return "#9c27b0";
    if (isHoliday || status === 'HOLIDAY') return "#9c27b0";
    
    switch (status) {
      case "PRESENT":
        return "#4caf50";
      case "LATE":
        return "#ff9800";
      case "ABSENT":
        return "#f44336";
      case "HALF DAY":
        return "#ff5722";
      default:
        return "#757575";
    }
  };

  const getStatusDisplayText = (record) => {
    const status = normalizeAttendanceStatus(record.status);
    const isHoliday = record.isHoliday;
    
    if (isHoliday && status === 'PRESENT') return "HOLIDAY + PRESENT";
    if (isHoliday || status === 'HOLIDAY') return "HOLIDAY";
    
    switch (status) {
      case "PRESENT":
        return "PRESENT";
      case "LATE":
        return "LATE";
      case "ABSENT":
        return "ABSENT";
      case "HALF DAY":
        return "HALF DAY";
      default:
        return status;
    }
  };

  const getStatusClass = (record) => {
    const status = normalizeAttendanceStatus(record.status);
    const isHoliday = record.isHoliday;
    
    if (isHoliday && status === 'PRESENT') return "holiday-present";
    if (isHoliday || status === 'HOLIDAY') return "holiday";
    
    return status.toLowerCase().replace(" ", "-");
  };

  
  const statsData = useMemo(() => {
    return processedAttendance.filter((record) => {
      if (isFutureAbsentRecord(record)) return false;

      const matchesSearch =
        formatDate(record.date).toLowerCase().includes(search.toLowerCase()) ||
        normalizeAttendanceStatus(record.status).toLowerCase().includes(search.toLowerCase()) ||
        (record.holidayTitle && record.holidayTitle.toLowerCase().includes(search.toLowerCase()));

      const matchesSelectedDate = !selectedDate ||
        formatDateForInput(record.date) === formatDateForInput(selectedDate);

      const recordDate = new Date(record.date);
      const now = new Date();
      let matchesTimeRange = true;

      
      if (isDateRangeActive && startDate && endDate) {
        const recordDateStr = formatDateForInput(recordDate);
        matchesTimeRange = recordDateStr >= startDate && recordDateStr <= endDate;
      } 
      
      else if (timeRange !== "ALL") {
        switch (timeRange) {
          case "TODAY":
            matchesTimeRange = recordDate.toDateString() === now.toDateString();
            break;
          case "WEEK": {
          const today = new Date();

          const firstDayOfWeek = new Date(today);
          const day = today.getDay(); 

          const diff = today.getDate() - day + (day === 0 ? -6 : 1);

          firstDayOfWeek.setDate(diff);
          firstDayOfWeek.setHours(0,0,0,0);

          matchesTimeRange =
            recordDate >= firstDayOfWeek &&
            recordDate <= today;

          break;
        }
          case "MONTH": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const today = new Date();

            matchesTimeRange =
              recordDate >= startOfMonth &&
              recordDate <= today;

            break;
          }
          default:
            matchesTimeRange = true;
        }
      }

      return matchesSearch && matchesSelectedDate && matchesTimeRange;
    });
  }, [processedAttendance, search, selectedDate, timeRange, isDateRangeActive, startDate, endDate, isFutureAbsentRecord]);

  const filteredData = useMemo(() => {
    if (statusFilter === "ALL") return statsData;

    return statsData.filter((record) => {
      const normalizedStatus = normalizeAttendanceStatus(record.status);
      return normalizedStatus === statusFilter ||
        (statusFilter === "HOLIDAY" && (record.isHoliday || normalizedStatus === "HOLIDAY"));
    });
  }, [statsData, statusFilter]);

  
  useEffect(() => {
    calculateStats(statsData);
  }, [statsData, calculateStats]);

  
  const applyDateRange = () => {
    if (!startDate || !endDate) {
      toast.warning("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    
    if (userJoinDate) {
      const joinDateStr = formatDateForInput(userJoinDate);
      if (startDate < joinDateStr) {
        toast.warning(`Records only available from ${formattedJoinDate}`);
        setStartDate(joinDateStr);
        return;
      }
    }

    setIsDateRangeActive(true);
    setTimeRange("ALL"); 
    setShowDateRangePicker(false);
    toast.success(`Showing records from ${startDate} to ${endDate}`);
  };

  
  const clearDateRange = () => {
    setIsDateRangeActive(false);
    setStartDate('');
    setEndDate('');
    setTimeRange("ALL");
    toast.info("Date range filter cleared");
  };

  const openDetailsModal = (record) => {
    setSelectedRecord(record);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedRecord(null);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.warning("No data to export");
      return;
    }

    try {
      const headers = [
        "Date",
        "Login Time",
        "Logout Time",
        "Status",
        "Total Time",
        "Late By",
        "Early Leave",
        "Overtime",
        "Holiday Title"
      ];
      const csvData = filteredData.map((record) => [
        formatDate(record.date),
        record.inTime ? formatTime(record.inTime) : "--",
        record.outTime ? formatTime(record.outTime) : "--",
        getStatusDisplayText(record),
        record.totalTime || "00:00:00",
        record.lateBy || "00:00:00",
        record.earlyLeave || "00:00:00",
        record.overTime || "00:00:00",
        record.holidayTitle || "--"
      ]);

      const csvContent = [headers, ...csvData]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `attendance-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("📊 CSV exported successfully!");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSearch("");
    setTimeRange("ALL");
    setIsDateRangeActive(false);
    setShowCalendar(false);
  };

  const handleRefresh = () => {
    Promise.all([
      fetchHolidays(),
      fetchAttendance(true)
    ]);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setIsDateRangeActive(false); 
    
  };

  const statusOptions = ["ALL", "PRESENT", "LATE", "HALF DAY", "ABSENT", "HOLIDAY"];

  
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="Attendance-container">
      <ToastContainer
        position={isMobile ? "top-center" : "top-right"}
        autoClose={4000}
        theme="light"
      />

      
      <div className="Attendance-header">
        <div className="Attendance-header-content">
          <div className="Attendance-header-text">
            <h1 className="Attendance-title">Attendance</h1>
            <p className="Attendance-subtitle">
              Track your attendance history and insights
            </p>
            {userJoinDate && (
              <div className="Attendance-join-info">
                <FiClock />
                <span>Joined on: {formattedJoinDate}</span>
              </div>
            )}
          </div>

          <div className="Attendance-header-actions">
            <div className="Attendance-search-container">
              <FiSearch className="Attendance-search-icon" />
              <input
                type="text"
                placeholder="Search attendance or holidays..."
                className="Attendance-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {(search || selectedDate) && (
                <button
                  className="Attendance-clear-search"
                  onClick={() => {
                    setSearch("");
                    setSelectedDate(null);
                  }}
                >
                  <FiX />
                </button>
              )}
            </div>

            
            <button
              className={`Attendance-icon-button ${isDateRangeActive ? 'Attendance-active' : ''}`}
              onClick={() => {
                setShowDateRangePicker(!showDateRangePicker);
                setShowFilterMenu(false);
                setShowCalendar(false);
                setShowMobileFilter(false);
              }}
              title="Date Range Filter"
            >
              <FiCalendarRange />
            </button>

            <button
              className="Attendance-icon-button"
              onClick={
                isMobile
                  ? () => {
                      setShowMobileFilter(true);
                      setShowDateRangePicker(false);
                      setShowFilterMenu(false);
                      setShowCalendar(false);
                    }
                  : () => {
                      setShowFilterMenu(!showFilterMenu);
                      setShowDateRangePicker(false);
                      setShowCalendar(false);
                      setShowMobileFilter(false);
                    }
              }
            >
              <FiFilter />
            </button>

            <button
              className="Attendance-icon-button"
              onClick={handleRefresh}
              disabled={refreshing || holidaysLoading}
            >
              <FiRefreshCw className={refreshing || holidaysLoading ? "Attendance-spin" : ""} />
            </button>

            <button
              className="Attendance-export-button"
              onClick={exportToCSV}
              disabled={filteredData.length === 0}
            >
              <FiDownload />
              Export CSV
            </button>
          </div>
        </div>

        
        {showDateRangePicker && (
          <div className="Attendance-date-range-picker" ref={dateRangePickerRef}>
            <h3>Select Date Range</h3>
            <div className="Attendance-date-range-inputs">
              <div className="Attendance-date-input-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={userJoinDate ? formatDateForInput(userJoinDate) : undefined}
                  max={endDate || undefined}
                />
              </div>
              <div className="Attendance-date-input-group">
                <label>End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || (userJoinDate ? formatDateForInput(userJoinDate) : undefined)}
                  max={formatDateForInput(new Date())}
                />
              </div>
            </div>
            {userJoinDate && (
              <div className="Attendance-date-range-note">
                <FiClock size={12} />
                <span>Available from {formattedJoinDate}</span>
              </div>
            )}
            <div className="Attendance-date-range-actions">
              <button 
                className="Attendance-apply-range-btn"
                onClick={applyDateRange}
              >
                Apply Range
              </button>
              <button
                className="Attendance-clear-range-btn"
                onClick={() => {
                  clearDateRange();           
                  setShowDateRangePicker(false); 
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        
        {showCalendar && (
          <div className="Attendance-calendar-popover" ref={calendarRef}>
            <input
              type="date"
              className="Attendance-date-picker"
              value={selectedDate || ""}
              onChange={(e) => handleDateSelect(e.target.value)}
              min={userJoinDate ? userJoinDate.toISOString().split('T')[0] : undefined}
            />
            {userJoinDate && (
              <div className="Attendance-calendar-note">
                <FiClock size={12} />
                <span>Records available from {formattedJoinDate}</span>
              </div>
            )}
          </div>
        )}

        
        {showFilterMenu && !isMobile && (
          <div className="Attendance-filter-menu" ref={filterMenuRef}>
            {statusOptions.map((status) => (
              <button
                key={status}
                className={`Attendance-filter-menu-item ${
                  statusFilter === status ? "Attendance-active" : ""
                }`}
                onClick={() => {
                  setStatusFilter(status);
                  setShowFilterMenu(false);
                }}
              >
                {status === "ALL" ? "All Status" : status}
              </button>
            ))}
          </div>
        )}

        
        <div className="Attendance-time-range-tabs">
          {["ALL", "TODAY", "WEEK", "MONTH"].map((range) => (
            <button
              key={range}
              className={`Attendance-time-tab ${timeRange === range && !isDateRangeActive ? "Attendance-active" : ""}`}
              onClick={() => handleTimeRangeChange(range)}
            >
              {range === "ALL" ? "All Time" : range}
            </button>
          ))}
        </div>
      </div>

      
      {showMobileFilter && isMobile && (
        <div className="Attendance-mobile-filter-drawer" ref={mobileFilterRef}>
          <div className="Attendance-filter-drawer-content">
            <div className="Attendance-filter-drawer-header">
              <h3>Filters</h3>
              <button
                className="Attendance-close-filter"
                onClick={() => {
                  setShowMobileFilter(false);
                  setShowFilterMenu(false);
                  setShowCalendar(false);
                  setShowDateRangePicker(false);
                }}
              >
                <FiX />
              </button>
            </div>
            <div className="Attendance-filter-options">
              <h4>Status Filter</h4>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`Attendance-filter-option ${
                    statusFilter === status ? "Attendance-active" : ""
                  }`}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowMobileFilter(false);
                  }}
                >
                  {status === "ALL" ? "All Status" : status}
                </button>
              ))}
            </div>
            {userJoinDate && (
              <div className="Attendance-filter-join-info">
                <FiClock size={14} />
                <span>Records from {formattedJoinDate}</span>
              </div>
            )}
          </div>
        </div>
      )}

      
      {userJoinDate && processedAttendance.length === 0 && !loading && (
        <div className="Attendance-join-banner">
          <div className="Attendance-join-banner-content">
            <FiCalendar size={20} />
            <div>
              <h3>No attendance records found</h3>
              <p>You joined on {formattedJoinDate}. Your attendance records will appear here once you clock in.</p>
            </div>
          </div>
        </div>
      )}

      
      <div className="Attendance-stats-grid">
        {[
          {
            key: "present",
            filterValue: "PRESENT",
            label: "Present Days",
            value: stats.present,
            icon: FiCheckCircle,
            color: "success",
            extra: `${stats.percentage}%`,
          },
          {
            key: "late",
            filterValue: "LATE",
            label: "Late Days",
            value: stats.late,
            icon: FiAlertTriangle,
            color: "warning",
          },
          {
            key: "halfDay",
            filterValue: "HALF DAY",
            label: "Half Days",
            value: stats.halfDay,
            icon: FiAlertCircle,
            color: "warning",
          },
          {
            key: "absent",
            filterValue: "ABSENT",
            label: "Absent Days",
            value: stats.absent,
            icon: FiMinusCircle,
            color: "error",
          },
          {
            key: "total",
            label: "Total Records",
            value: stats.total,
            icon: FiBarChart2,
            color: "info",
          },
        ]
          .filter(stat => stat.value > 0 || stat.key === "total")
          .map((stat) => (
            <div
              key={stat.key}
              className={`Attendance-stat-card ${
                statusFilter === stat.filterValue ? "Attendance-active" : ""
              }`}
              data-key={stat.key}
              onClick={() => {
                if (stat.key !== "total") {
                  setStatusFilter(statusFilter === stat.filterValue ? "ALL" : stat.filterValue);
                }
              }}
            >
              <div className="Attendance-stat-card-content">
                <div className="Attendance-stat-icon-container">
                  <stat.icon className={`Attendance-stat-icon Attendance-${stat.color}`} />
                </div>
                <div className="Attendance-stat-details">
                  <p className="Attendance-stat-label">{stat.label}</p>
                  <div className="Attendance-stat-value-container">
                    <h3 className="Attendance-stat-value">{stat.value}</h3>
                    {stat.extra && (
                      <span className="Attendance-stat-extra">{stat.extra}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      
      {holidays.length > 0 && (
        <div className="Attendance-holiday-summary">
          <MdCelebration className="Attendance-holiday-summary-icon" />
          <span>{holidays.length} Holiday{holidays.length > 1 ? 's' : ''} this year</span>
        </div>
      )}

      
      {(statusFilter !== "ALL" || timeRange !== "ALL" || isDateRangeActive) && (
        <div className="Attendance-active-filters">
          <h4>Active filters:</h4>
          <div className="Attendance-filter-chips">
            {statusFilter !== "ALL" && (
              <div className="Attendance-filter-chip">
                <span>Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter("ALL")}>×</button>
              </div>
            )}
            {timeRange !== "ALL" && !isDateRangeActive && (
              <div className="Attendance-filter-chip Attendance-secondary">
                <span>Time: {timeRange}</span>
                <button onClick={() => setTimeRange("ALL")}>×</button>
              </div>
            )}
            
            {isDateRangeActive && startDate && endDate && (
              <div className="Attendance-filter-chip Attendance-primary">
                <span>From: {startDate} To: {endDate}</span>
                <button onClick={clearDateRange}>×</button>
              </div>
            )}
          </div>
        </div>
      )}

      
      <div className="Attendance-results-count">
        <h3>
          Showing {filteredData.length} of {processedAttendance.length} records
        </h3>
        {stats.late > 0 && (
          <div className="Attendance-late-info">
            <FiWatch className="Attendance-late-info-icon" />
            <span>{stats.late} late day(s) recorded</span>
          </div>
        )}
        {userJoinDate && processedAttendance.length > 0 && (
          <div className="Attendance-range-info">
            <FiCalendar />
            <span>Since {formattedJoinDate}</span>
          </div>
        )}
      </div>

      
      {!isMobile && (
        <div className="Attendance-table-container">
          <table className="Attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Login</th>
                <th>Logout</th>
                <th>Status</th>
                <th>Total Time</th>
                <th>Late By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((record) => {
                  const statusClass = getStatusClass(record);
                  const displayStatus = getStatusDisplayText(record);
                  return (
                    <tr
                      key={record._id}
                      className={`Attendance-table-row Attendance-status-${statusClass}`}
                      style={{ cursor: 'default' }}  
                    >
                      <td>
                        <strong>{formatDate(record.date)}</strong>
                        {record.holidayTitle && (
                          <div className="Attendance-holiday-title-tooltip">
                            {record.holidayTitle}
                          </div>
                        )}
                      </td>
                      <td>
                        {record.inTime ? (
                          <div className="Attendance-time-cell" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FiClock />
                              <span>{formatTime(record.inTime)}</span>
                            </div>
                            {record.inLocation && (
                              <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '21px' }}>
                                Dist: {calculateDistance(record.inLocation.latitude, record.inLocation.longitude)}m
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="Attendance-no-time">--</span>
                        )}
                      </td>
                      <td>
                        {record.outTime ? (
                          <div className="Attendance-time-cell" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FiClock />
                              <span>{formatTime(record.outTime)}</span>
                            </div>
                            {record.outLocation && (
                              <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '21px' }}>
                                Dist: {calculateDistance(record.outLocation.latitude, record.outLocation.longitude)}m
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="Attendance-no-time">--</span>
                        )}
                      </td>
                      <td>
                        <div className={`Attendance-status-chip Attendance-status-${statusClass}`}>
                          {getStatusIcon(record)}
                          <span>{displayStatus}</span>
                        </div>
                      </td>
                      <td>
                        <strong className="Attendance-total-time">
                          {record.totalTime || "00:00:00"}
                        </strong>
                      </td>
                      <td>
                        <div className="Attendance-late-cell">
                          {record.lateBy && record.lateBy !== "00:00:00" ? (
                            <span className="Attendance-late-badge">
                              {record.lateBy}
                            </span>
                          ) : (
                            <span className="Attendance-no-late">--</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className="Attendance-view-details-button"
                          onClick={() => openDetailsModal(record)}
                          type="button"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="Attendance-no-data-cell">
                    <FiUser className="Attendance-no-data-icon" />
                    <h3>No attendance records found</h3>
                    <p>
                      {userJoinDate 
                        ? `You joined on ${formattedJoinDate}. No records before this date.`
                        : 'Try adjusting your filters or search terms'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      
      {isMobile && (
        <div className="Attendance-mobile-cards">
          {filteredData.length > 0 ? (
            <VirtualList
              items={filteredData}
              height={Math.min(620, Math.max(320, window.innerHeight - 280))}
              rowHeight={178}
              renderItem={(record) => {
                const statusClass = getStatusClass(record);
                const displayStatus = getStatusDisplayText(record);
                return (
                  <div
                    key={record._id}
                    className={`Attendance-mobile-card Attendance-status-${statusClass}`}
                    onClick={() => openDetailsModal(record)}
                    title={record.holidayTitle ? `Holiday: ${record.holidayTitle}` : ''}
                  >
                    <div className="Attendance-mobile-card-content">
                      <div className="Attendance-mobile-card-header">
                        <h3>{formatDate(record.date)}</h3>
                        {record.holidayTitle && (
                          <span className="Attendance-mobile-holiday-badge">
                            🎉
                          </span>
                        )}
                        <FiChevronRight className="Attendance-card-arrow" />
                      </div>
                      <div className="Attendance-mobile-card-times">
                        {record.inTime && (
                          <div className="Attendance-time-item">
                            <FiClock />
                            <span>
                              In: {formatTime(record.inTime)}
                              {record.inLocation && ` (${calculateDistance(record.inLocation.latitude, record.inLocation.longitude)}m)`}
                            </span>
                          </div>
                        )}
                        {record.outTime && (
                          <div className="Attendance-time-item">
                            <FiClock />
                            <span>
                              Out: {formatTime(record.outTime)}
                              {record.outLocation && ` (${calculateDistance(record.outLocation.latitude, record.outLocation.longitude)}m)`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="Attendance-mobile-card-footer">
                        <div className={`Attendance-mobile-status-chip Attendance-status-${statusClass}`}>
                          {getStatusIcon(record)}
                          <span>{displayStatus}</span>
                        </div>
                        <div className="Attendance-mobile-card-right">
                          {record.lateBy && record.lateBy !== "00:00:00" && (
                            <div className="Attendance-mobile-late">
                              <FiAlertTriangle />
                              <span>{record.lateBy}</span>
                            </div>
                          )}
                          {record.totalTime && (
                            <strong className="Attendance-mobile-total-time">
                              {record.totalTime}
                            </strong>
                          )}
                        </div>
                      </div>
                      {record.holidayTitle && (
                        <div className="Attendance-mobile-holiday-title">
                          🎉 {record.holidayTitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          ) : (
            <div className="Attendance-no-data-card">
              <FiUser className="Attendance-no-data-icon" />
              <h3>No records found</h3>
              <p>
                {userJoinDate 
                  ? `You joined on ${formattedJoinDate}`
                  : 'Adjust your search or filters'}
              </p>
            </div>
          )}
        </div>
      )}

      
      {openModal && selectedRecord && (
        <div className="Attendance-modal-overlay" onClick={closeModal}>
          <div
            className="Attendance-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="Attendance-modal-header" style={{
              background: `linear-gradient(135deg, ${getStatusColor(
                selectedRecord
              )} 0%, #667eea 100%)`,
            }}>
              <h2>Attendance Details</h2>
              <h3>{formatDate(selectedRecord.date)}</h3>
              {selectedRecord.holidayTitle && (
                <div className="Attendance-modal-holiday-badge">
                  🎉 {selectedRecord.holidayTitle}
                </div>
              )}
            </div>
            <div className="Attendance-modal-body">
              <div className="Attendance-modal-section">
                <h4>Status</h4>
                <div className={`Attendance-modal-status-chip Attendance-status-${getStatusClass(selectedRecord)}`}>
                  {getStatusIcon(selectedRecord)}
                  <span>{getStatusDisplayText(selectedRecord)}</span>
                </div>
              </div>
              <div className="Attendance-modal-divider"></div>
              
              {selectedRecord.inTime && (
                <>
                  <div className="Attendance-modal-grid">
                    <div className="Attendance-modal-grid-item">
                      <h4>Login Time</h4>
                      <p className="Attendance-modal-time">{formatTime(selectedRecord.inTime)}</p>
                    </div>
                    <div className="Attendance-modal-grid-item">
                      <h4>Logout Time</h4>
                      <p className="Attendance-modal-time">
                        {selectedRecord.outTime ? formatTime(selectedRecord.outTime) : "--"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="Attendance-modal-grid">
                    <div className="Attendance-modal-grid-item">
                      <h4>Total Duration</h4>
                      <p className="Attendance-modal-duration">
                        {selectedRecord.totalTime || "00:00:00"}
                      </p>
                    </div>
                    <div className="Attendance-modal-grid-item">
                      <h4>Late By</h4>
                      <p className="Attendance-modal-late">
                        {selectedRecord.lateBy || "00:00:00"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="Attendance-modal-grid">
                    <div className="Attendance-modal-grid-item">
                      <h4>Early Leave</h4>
                      <p className="Attendance-modal-early-leave">
                        {selectedRecord.earlyLeave || "00:00:00"}
                      </p>
                    </div>
                    <div className="Attendance-modal-grid-item">
                      <h4>Overtime</h4>
                      <p className="Attendance-modal-overtime">
                        {selectedRecord.overTime || "00:00:00"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="Attendance-modal-grid">
                    <div className="Attendance-modal-grid-item">
                      <h4>Login Distance</h4>
                      <p className="Attendance-modal-duration">
                        {selectedRecord.inLocation ? `${calculateDistance(selectedRecord.inLocation.latitude, selectedRecord.inLocation.longitude)}m` : "--"}
                      </p>
                    </div>
                    <div className="Attendance-modal-grid-item">
                      <h4>Logout Distance</h4>
                      <p className="Attendance-modal-duration">
                        {selectedRecord.outLocation ? `${calculateDistance(selectedRecord.outLocation.latitude, selectedRecord.outLocation.longitude)}m` : "--"}
                      </p>
                    </div>
                  </div>
                </>
              )}
              
              <button className="Attendance-modal-close-button" onClick={closeModal}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
