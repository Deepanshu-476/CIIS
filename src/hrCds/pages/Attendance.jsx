import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "../../utils/axiosConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CIISLoader from "../../Loader/CIISLoader";
import "../Css/Attendance.css";

import {
  FiCalendar,
  FiClock,
  FiUserCheck,
  FiAlertTriangle,
  FiCoffee,
  FiXCircle,
  FiBarChart2,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiCheck,
  FiX,
  FiMapPin,
  FiSmartphone,
  FiGlobe
} from "react-icons/fi";
import { MdCelebration } from "react-icons/md";

// Month names helper
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper to reliably check boolean flags from API
const isAttendanceFlagTrue = (value) =>
  value === true || value === 1 || String(value).trim().toLowerCase() === "true";

const Attendance = () => {
  // ----------------------------------------------------
  // 1. Current User & Authentication
  // ----------------------------------------------------
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  }, []);
  const token = localStorage.getItem("token");

  // User Join Date
  const userJoinDate = useMemo(() => {
    if (!user?.createdAt) return null;
    const d = new Date(user.createdAt);
    return isNaN(d.getTime()) ? null : d;
  }, [user]);

  const formattedJoinDate = useMemo(() => {
    if (!userJoinDate) return "N/A";
    return userJoinDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [userJoinDate]);

  // ----------------------------------------------------
  // 2. State Variables
  // ----------------------------------------------------
  const [pageLoading, setPageLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [holidayBannerDismissed, setHolidayBannerDismissed] = useState(false);

  // Today's Clock status from Clock-in API (/attendance/status)
  const [todayClockData, setTodayClockData] = useState(null);

  // Selected Month & Year (for monthly overview and filtering)
  const todayDate = new Date();
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth()); // 0-indexed

  // Filters & Search
  const [timeRange, setTimeRange] = useState("ALL"); // ALL, TODAY, WEEK, MONTH
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Day Details Modal
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Live timer for today's working hours
  const [liveWorkingTime, setLiveWorkingTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Refs for dropdown outside click
  const statusDropdownRef = useRef(null);
  const monthDropdownRef = useRef(null);

  // ----------------------------------------------------
  // 3. Close Dropdowns on Outside Click
  // ----------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) {
        setShowMonthDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ----------------------------------------------------
  // 4. Modal Scroll Lock Hook
  // ----------------------------------------------------
  useEffect(() => {
    if (showDetailModal) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const mainEl = document.querySelector("main");
      const originalMainOverflow = mainEl ? mainEl.style.overflow : "";

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (mainEl) mainEl.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        if (mainEl) mainEl.style.overflow = originalMainOverflow;
      };
    }
  }, [showDetailModal]);

  // ----------------------------------------------------
  // 5. Data Fetching (Attendance, Holidays & Today's Clock Status)
  // ----------------------------------------------------
  const fetchAttendanceData = useCallback(async () => {
    try {
      const res = await axios.get("/attendance/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = [];
      if (res.data && Array.isArray(res.data.data)) data = res.data.data;
      else if (Array.isArray(res.data)) data = res.data;
      else if (res.data && Array.isArray(res.data.attendance)) data = res.data.attendance;
      setAttendance(data);
    } catch (err) {
      console.error("Error fetching attendance records:", err);
      toast.error("Failed to load attendance records");
    }
  }, [token]);

  const fetchHolidaysData = useCallback(async () => {
    try {
      const res = await axios.get("/holidays", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success && Array.isArray(res.data.holidays)) {
        setHolidays(res.data.holidays);
      } else if (Array.isArray(res.data)) {
        setHolidays(res.data);
      }
    } catch (err) {
      console.error("Error fetching holidays:", err);
    }
  }, [token]);

  // Dedicated Clock-in status API call (/attendance/status)
  const fetchTodayClockStatus = useCallback(async () => {
    try {
      const res = await axios.get("/attendance/status", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      if (res.data) {
        setTodayClockData(res.data);
      }
    } catch (err) {
      console.error("Failed to load today clock status:", err);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      await Promise.all([
        fetchAttendanceData(),
        fetchHolidaysData(),
        fetchTodayClockStatus()
      ]);
      setPageLoading(false);
    };
    init();
  }, [fetchAttendanceData, fetchHolidaysData, fetchTodayClockStatus]);

  // Listen to attendance updates across the app (clock-in / clock-out events)
  useEffect(() => {
    const handleAttendanceChange = () => {
      fetchTodayClockStatus();
      fetchAttendanceData();
    };
    window.addEventListener("ciis-attendance-updated", handleAttendanceChange);
    return () => window.removeEventListener("ciis-attendance-updated", handleAttendanceChange);
  }, [fetchTodayClockStatus, fetchAttendanceData]);

  // ----------------------------------------------------
  // 6. Time & Helper Formatter Functions
  // ----------------------------------------------------
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Check if date is before join date
  const isBeforeJoinDate = useCallback(
    (dateToCheck) => {
      if (!userJoinDate) return false;
      const target = new Date(dateToCheck);
      target.setHours(0, 0, 0, 0);
      const join = new Date(userJoinDate);
      join.setHours(0, 0, 0, 0);
      return target < join;
    },
    [userJoinDate]
  );

  // Normalize status string
  const getNormalizedStatus = (statusStr) => {
    if (!statusStr) return "ABSENT";
    const s = statusStr.toUpperCase().trim();
    if (s.includes("PRESENT")) return "PRESENT";
    if (s.includes("LATE")) return "LATE";
    if (s.includes("HALF")) return "HALF DAY";
    if (s.includes("HOLIDAY")) return "HOLIDAY";
    if (s.includes("WEEKLY") || s.includes("OFF")) return "WEEKLY OFF";
    if (s.includes("LEAVE") || s.includes("ABSENT")) return "ABSENT";
    return s;
  };

  // ----------------------------------------------------
  // 7. Real-Time Working Hours from Clock-in API
  // ----------------------------------------------------
  const isClockedIn = isAttendanceFlagTrue(todayClockData?.isClockedIn);
  const clockInTime = todayClockData?.inTime || todayClockData?.checkInTime;
  const clockOutTime = todayClockData?.outTime || todayClockData?.checkOutTime;

  useEffect(() => {
    if (isClockedIn && clockInTime) {
      const startMs = new Date(clockInTime).getTime();
      if (!isNaN(startMs)) {
        const updateClock = () => {
          const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
          const hours = Math.floor(diffSec / 3600);
          const minutes = Math.floor((diffSec % 3600) / 60);
          const seconds = diffSec % 60;
          setLiveWorkingTime({ hours, minutes, seconds });
        };
        updateClock();
        const timerId = setInterval(updateClock, 1000);
        return () => clearInterval(timerId);
      }
    } else if (clockInTime && clockOutTime) {
      const startMs = new Date(clockInTime).getTime();
      const endMs = new Date(clockOutTime).getTime();
      if (!isNaN(startMs) && !isNaN(endMs)) {
        const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
        const hours = Math.floor(diffSec / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        const seconds = diffSec % 60;
        setLiveWorkingTime({ hours, minutes, seconds });
        return;
      }
    }
    setLiveWorkingTime({ hours: 0, minutes: 0, seconds: 0 });
  }, [isClockedIn, clockInTime, clockOutTime]);

  // Handle opening detailed log for today's status
  const handleViewTodayLog = () => {
    if (todayClockData && (todayClockData.inTime || todayClockData._id)) {
      setSelectedDayRecord({
        date: todayClockData.date || new Date().toISOString().split("T")[0],
        checkInTime: todayClockData.inTime,
        checkOutTime: todayClockData.outTime,
        status: todayClockData.status || (isClockedIn ? "PRESENT" : "ABSENT"),
        shiftTime:
          todayClockData.shiftStart && todayClockData.shiftEnd
            ? `${todayClockData.shiftStart} - ${todayClockData.shiftEnd}`
            : "09:30 AM - 06:30 PM",
        totalTime:
          todayClockData.totalTime ||
          (clockInTime && clockOutTime
            ? `${String(liveWorkingTime.hours).padStart(2, "0")}h ${String(
                liveWorkingTime.minutes
              ).padStart(2, "0")}m`
            : "-"),
        lateBy: todayClockData.lateBy || "-",
        device: todayClockData.device || todayClockData.userAgent || "Desktop Web",
        ip: todayClockData.ip,
        location: todayClockData.location,
        notes: todayClockData.notes,
        autoClockout: todayClockData.autoClockout,
      });
      setShowDetailModal(true);
    } else if (attendance.length > 0) {
      setSelectedDayRecord(attendance[0]);
      setShowDetailModal(true);
    } else {
      toast.info("No attendance record found for today yet");
    }
  };

  // ----------------------------------------------------
  // 8. Month Selection List (e.g. past 12 months)
  // ----------------------------------------------------
  const monthOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      });
    }
    return list;
  }, []);

  // ----------------------------------------------------
  // 9. Filtered Attendance Records
  // ----------------------------------------------------
  const filteredRecords = useMemo(() => {
    return attendance
      .filter((rec) => {
        // Ignore records before joining
        if (isBeforeJoinDate(rec.date)) return false;

        const recDate = new Date(rec.date);
        if (isNaN(recDate.getTime())) return false;

        // Calendar selected date filter
        if (selectedCalendarDate) {
          const selDateStr = selectedCalendarDate.toISOString().split("T")[0];
          if (rec.date !== selDateStr) return false;
        }

        // Time range filter
        if (!selectedCalendarDate) {
          if (timeRange === "TODAY") {
            const todayStr = new Date().toISOString().split("T")[0];
            if (rec.date !== todayStr) return false;
          } else if (timeRange === "WEEK") {
            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            if (recDate < sevenDaysAgo || recDate > now) return false;
          } else if (timeRange === "MONTH") {
            if (
              recDate.getFullYear() !== currentYear ||
              recDate.getMonth() !== currentMonth
            ) {
              return false;
            }
          }
        }

        // Status Filter
        if (statusFilter !== "ALL") {
          const norm = getNormalizedStatus(rec.status);
          if (norm !== statusFilter) return false;
        }

        // Search Query Filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchDate = (rec.date || "").toLowerCase().includes(q);
          const matchStatus = (rec.status || "").toLowerCase().includes(q);
          const matchFormatted = formatDate(rec.date).toLowerCase().includes(q);
          if (!matchDate && !matchStatus && !matchFormatted) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [
    attendance,
    isBeforeJoinDate,
    selectedCalendarDate,
    timeRange,
    currentYear,
    currentMonth,
    statusFilter,
    search
  ]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, timeRange, currentMonth, currentYear, selectedCalendarDate]);

  // ----------------------------------------------------
  // 10. KPI Statistics Calculation
  // ----------------------------------------------------
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let halfDay = 0;
    let absent = 0;
    let total = 0;

    attendance.forEach((rec) => {
      if (isBeforeJoinDate(rec.date)) return;
      const recDate = new Date(rec.date);
      if (isNaN(recDate.getTime())) return;

      // Stats follow current selected month
      if (
        recDate.getFullYear() === currentYear &&
        recDate.getMonth() === currentMonth
      ) {
        total++;
        const s = getNormalizedStatus(rec.status);
        if (s === "PRESENT") present++;
        else if (s === "LATE") {
          late++;
          present++; // Late is counted as present working day as well
        } else if (s === "HALF DAY") halfDay++;
        else if (s === "ABSENT") absent++;
      }
    });

    const workingDays = Math.max(1, present + halfDay + absent);
    const presentPct = Math.min(100, Math.round((present / workingDays) * 100));
    const latePct = Math.min(100, Math.round((late / workingDays) * 100));
    const halfDayPct = Math.min(100, Math.round((halfDay / workingDays) * 100));
    const absentPct = Math.min(100, Math.round((absent / workingDays) * 100));

    return {
      present,
      late,
      halfDay,
      absent,
      total,
      presentPct,
      latePct,
      halfDayPct,
      absentPct,
    };
  }, [attendance, isBeforeJoinDate, currentYear, currentMonth]);

  // ----------------------------------------------------
  // 11. Month Holidays (Upcoming / Current Month)
  // ----------------------------------------------------
  const currentMonthHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const d = new Date(h.date);
      return (
        !isNaN(d.getTime()) &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      );
    });
  }, [holidays, currentYear, currentMonth]);

  // ----------------------------------------------------
  // 12. Export to CSV Functionality
  // ----------------------------------------------------
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.info("No attendance records to export");
      return;
    }

    const headers = [
      "Date",
      "Shift",
      "Login Time",
      "Logout Time",
      "Total Time",
      "Status",
      "Late By",
      "Auto Clockout",
      "Notes"
    ];

    const rows = filteredRecords.map((r) => [
      r.date,
      r.shiftTime || "09:30 AM - 06:30 PM",
      r.checkInTime ? formatTime(r.checkInTime) : "-",
      r.checkOutTime ? formatTime(r.checkOutTime) : "-",
      r.totalTime || "-",
      r.status || "-",
      r.lateBy || "-",
      r.autoClockout ? "Yes" : "No",
      r.notes || "-"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map((v) => `"${v}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Attendance_${MONTH_NAMES[currentMonth]}_${currentYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance CSV exported successfully!");
  };

  // ----------------------------------------------------
  // 13. Calendar Generator (Monthly Overview Grid)
  // ----------------------------------------------------
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];
    // Blank padding days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null });
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

      const rec = attendance.find((a) => a.date === dateKey);
      const isHol = holidays.some((h) => h.date === dateKey);

      let status = "NONE";
      if (isHol) status = "HOLIDAY";
      else if (rec) status = getNormalizedStatus(rec.status);

      const isToday =
        todayDate.getFullYear() === currentYear &&
        todayDate.getMonth() === currentMonth &&
        todayDate.getDate() === d;

      days.push({
        day: d,
        dateKey,
        status,
        isToday,
        record: rec
      });
    }
    return days;
  }, [currentYear, currentMonth, attendance, holidays, todayDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedCalendarDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedCalendarDate(null);
  };

  // ----------------------------------------------------
  // 14. Render Loading State
  // ----------------------------------------------------
  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="att-wrapper">
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      {/* 1. Header Section */}
      <div className="att-header">
        <div className="att-header-left">
          <div className="att-header-icon-box">
            <FiCalendar />
          </div>
          <div className="att-header-text">
            <h1>My Attendance</h1>
            <p>Track your attendance history and insights</p>
          </div>
        </div>
      </div>

      {/* 2. Subheader Controls Row */}
      <div className="att-controls-row">
        <div className="att-controls-left">
          {/* Joined On Pill */}
          <div className="att-joined-pill">
            <FiCalendar />
            <span>Joined on: {formattedJoinDate}</span>
          </div>

          {/* Time Range Pills */}
          <div className="att-time-pills">
            <button
              type="button"
              className={`att-time-pill-btn ${timeRange === "ALL" && !selectedCalendarDate ? "active" : ""}`}
              onClick={() => {
                setTimeRange("ALL");
                setSelectedCalendarDate(null);
              }}
            >
              All Time
            </button>
            <button
              type="button"
              className={`att-time-pill-btn ${timeRange === "TODAY" && !selectedCalendarDate ? "active" : ""}`}
              onClick={() => {
                setTimeRange("TODAY");
                setSelectedCalendarDate(null);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className={`att-time-pill-btn ${timeRange === "WEEK" && !selectedCalendarDate ? "active" : ""}`}
              onClick={() => {
                setTimeRange("WEEK");
                setSelectedCalendarDate(null);
              }}
            >
              Week
            </button>
            <button
              type="button"
              className={`att-time-pill-btn ${timeRange === "MONTH" && !selectedCalendarDate ? "active" : ""}`}
              onClick={() => {
                setTimeRange("MONTH");
                setSelectedCalendarDate(null);
              }}
            >
              Month
            </button>
          </div>
        </div>

        <div className="att-controls-right">
          {/* Month Selector Dropdown */}
          <div className="att-month-select-wrapper" ref={monthDropdownRef}>
            <button
              type="button"
              className="att-month-select-btn"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
            >
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              <FiChevronDown />
            </button>

            {showMonthDropdown && (
              <div className="att-month-dropdown-menu">
                {monthOptions.map((opt) => (
                  <button
                    key={`${opt.year}-${opt.month}`}
                    type="button"
                    className={`att-month-dropdown-item ${opt.year === currentYear && opt.month === currentMonth ? "active" : ""}`}
                    onClick={() => {
                      setCurrentYear(opt.year);
                      setCurrentMonth(opt.month);
                      setTimeRange("MONTH");
                      setSelectedCalendarDate(null);
                      setShowMonthDropdown(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {opt.year === currentYear && opt.month === currentMonth && <FiCheck />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            className="att-export-btn"
            onClick={handleExportCSV}
          >
            <FiDownload />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3. 5 Stat Metric KPI Cards */}
      <div className="att-stats-grid">
        {/* Present Days */}
        <div className="att-stat-card">
          <div className="att-stat-header">
            <span className="att-stat-label">PRESENT DAYS</span>
            <div className="att-stat-icon-circle green">
              <FiUserCheck />
            </div>
          </div>
          <div className="att-stat-value">{stats.present}</div>
          <div className="att-stat-footer">
            <span className="att-stat-pill green">{stats.presentPct}%</span>
            <span className="att-stat-desc">of total working days</span>
          </div>
        </div>

        {/* Late Days */}
        <div className="att-stat-card">
          <div className="att-stat-header">
            <span className="att-stat-label">LATE DAYS</span>
            <div className="att-stat-icon-circle yellow">
              <FiAlertTriangle />
            </div>
          </div>
          <div className="att-stat-value">{stats.late}</div>
          <div className="att-stat-footer">
            <span className="att-stat-pill yellow">{stats.latePct}%</span>
            <span className="att-stat-desc">grace period exceeded</span>
          </div>
        </div>

        {/* Half Days */}
        <div className="att-stat-card">
          <div className="att-stat-header">
            <span className="att-stat-label">HALF DAYS</span>
            <div className="att-stat-icon-circle purple">
              <FiCoffee />
            </div>
          </div>
          <div className="att-stat-value">{stats.halfDay}</div>
          <div className="att-stat-footer">
            <span className="att-stat-pill purple">{stats.halfDayPct}%</span>
            <span className="att-stat-desc">less than 8 hours</span>
          </div>
        </div>

        {/* Absent Days */}
        <div className="att-stat-card">
          <div className="att-stat-header">
            <span className="att-stat-label">ABSENT DAYS</span>
            <div className="att-stat-icon-circle red">
              <FiXCircle />
            </div>
          </div>
          <div className="att-stat-value">{stats.absent}</div>
          <div className="att-stat-footer">
            <span className="att-stat-pill red">{stats.absentPct}%</span>
            <span className="att-stat-desc">unexcused absences</span>
          </div>
        </div>

        {/* Total Records */}
        <div className="att-stat-card">
          <div className="att-stat-header">
            <span className="att-stat-label">TOTAL RECORDS</span>
            <div className="att-stat-icon-circle blue">
              <FiBarChart2 />
            </div>
          </div>
          <div className="att-stat-value">{stats.total}</div>
          <div className="att-stat-footer">
            <span className="att-stat-desc">recorded logs</span>
          </div>
        </div>
      </div>

      {/* 4. Holiday Announcement Banner (Dismissible) */}
      {!holidayBannerDismissed && currentMonthHolidays.length > 0 && (
        <div className="att-holiday-banner">
          <div className="att-holiday-banner-left">
            <div className="att-holiday-icon-box">
              <MdCelebration />
            </div>
            <div className="att-holiday-text">
              <h4>
                Company Holidays: {currentMonthHolidays.length} holiday(s) in {MONTH_NAMES[currentMonth]} {currentYear}
              </h4>
              <p>
                {currentMonthHolidays.map((h) => `${formatDate(h.date)} - ${h.name || h.title || "Holiday"}`).join(" • ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="att-holiday-close-btn"
            onClick={() => setHolidayBannerDismissed(true)}
            aria-label="Dismiss banner"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* 5. Main 2-Column Dashboard Layout */}
      <div className="att-main-layout">
        {/* Left Column: Attendance Records Table */}
        <div className="att-table-column">
          <div className="att-card att-table-card">
            {/* Table Header Bar */}
            <div className="att-table-card-header">
              <div className="att-table-header-title">
                <h3>Attendance Records</h3>
                <span className="att-count-pill">{filteredRecords.length} records</span>
              </div>

              <div className="att-table-header-actions">
                {/* Search Bar */}
                <div className="att-search-input-box">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search by date or status..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="att-search-clear-btn"
                      onClick={() => setSearch("")}
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                {/* Status Filter Dropdown */}
                <div className="att-status-filter-wrapper" ref={statusDropdownRef}>
                  <button
                    type="button"
                    className="att-status-filter-btn"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <FiFilter />
                    <span>{statusFilter === "ALL" ? "All Statuses" : statusFilter}</span>
                    <FiChevronDown />
                  </button>

                  {showStatusDropdown && (
                    <div className="att-filter-dropdown-menu">
                      {["ALL", "PRESENT", "LATE", "HALF DAY", "ABSENT", "WEEKLY OFF", "HOLIDAY"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`att-filter-dropdown-item ${statusFilter === st ? "active" : ""}`}
                          onClick={() => {
                            setStatusFilter(st);
                            setShowStatusDropdown(false);
                          }}
                        >
                          <span>{st === "ALL" ? "All Statuses" : st}</span>
                          {statusFilter === st && <FiCheck />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="att-table-container">
              <table className="att-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>#</th>
                    <th>DATE</th>
                    <th>SHIFT</th>
                    <th>LOGIN</th>
                    <th>LOGOUT</th>
                    <th>TOTAL TIME</th>
                    <th>STATUS</th>
                    <th>LATE BY</th>
                    <th style={{ textAlign: "center", width: "70px" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan="9">
                        <div className="att-empty-state">
                          <FiClock className="att-empty-icon" />
                          <p className="att-empty-title">No attendance records found</p>
                          <p className="att-empty-desc">Try clearing your filters or selecting a different month.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((item, idx) => {
                      const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                      const normStatus = getNormalizedStatus(item.status);
                      const isLate = normStatus === "LATE" || Boolean(item.lateBy && item.lateBy !== "-");

                      return (
                        <tr key={item._id || item.date || idx}>
                          <td className="att-col-idx">{rowNumber}</td>
                          <td className="att-col-date">{formatDate(item.date)}</td>
                          <td className="att-col-shift">{item.shiftTime || "09:30 AM - 06:30 PM"}</td>
                          <td>
                            <div className="att-time-cell">
                              <span className={`att-time-dot ${isLate ? "late" : item.checkInTime ? "on-time" : "gray"}`} />
                              <span>{formatTime(item.checkInTime)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="att-logout-cell-group">
                              <span>{formatTime(item.checkOutTime)}</span>
                              {item.autoClockout && (
                                <span className="att-auto-clockout-tag">Auto Clock-Out</span>
                              )}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>
                            {item.totalTime || item.workingHours || "-"}
                          </td>
                          <td>
                            <span
                              className={`att-status-pill ${
                                normStatus === "PRESENT"
                                  ? "present"
                                  : normStatus === "LATE"
                                  ? "late"
                                  : normStatus === "HALF DAY"
                                  ? "halfday"
                                  : normStatus === "WEEKLY OFF"
                                  ? "weeklyoff"
                                  : normStatus === "HOLIDAY"
                                  ? "holiday"
                                  : "absent"
                              }`}
                            >
                              {normStatus}
                            </span>
                          </td>
                          <td>
                            {item.lateBy && item.lateBy !== "-" ? (
                              <span className="att-late-badge">{item.lateBy}</span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>-</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="att-action-view-btn"
                              title="View Log Details"
                              onClick={() => {
                                setSelectedDayRecord(item);
                                setShowDetailModal(true);
                              }}
                            >
                              <FiEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="att-table-pagination">
                <div className="att-pagination-info">
                  Showing <b>{(currentPage - 1) * itemsPerPage + 1}</b> to{" "}
                  <b>{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</b> of{" "}
                  <b>{filteredRecords.length}</b> records
                </div>

                <div className="att-pagination-buttons">
                  <button
                    type="button"
                    className="att-page-btn arrow"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <FiChevronLeft />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`att-page-btn ${currentPage === pageNum ? "active" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="att-page-btn arrow"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Monthly Overview Calendar & Today's Status */}
        <div className="att-widgets-column">
          {/* Monthly Overview Calendar Widget */}
          <div className="att-card att-calendar-card">
            <div className="att-calendar-header">
              <h4>Monthly Overview</h4>
              <div className="att-calendar-nav">
                <button
                  type="button"
                  className="att-cal-nav-btn"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                >
                  <FiChevronLeft />
                </button>
                <span className="att-cal-month-title">
                  {MONTH_NAMES[currentMonth].substring(0, 3)} {currentYear}
                </span>
                <button
                  type="button"
                  className="att-cal-nav-btn"
                  onClick={handleNextMonth}
                  title="Next Month"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>

            {/* Day Names Header */}
            <div className="att-cal-weekdays">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="att-cal-days-grid">
              {calendarDays.map((cd, index) => {
                if (!cd.day) {
                  return <div key={`empty-${index}`} className="att-cal-day empty" />;
                }

                const isSelected =
                  selectedCalendarDate &&
                  selectedCalendarDate.toISOString().split("T")[0] === cd.dateKey;

                return (
                  <button
                    key={cd.dateKey}
                    type="button"
                    className={`att-cal-day ${cd.isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCalendarDate(null);
                      } else {
                        const [y, m, d] = cd.dateKey.split("-").map(Number);
                        setSelectedCalendarDate(new Date(y, m - 1, d));
                      }
                    }}
                  >
                    <span className="att-cal-day-num">{cd.day}</span>
                    {cd.status !== "NONE" && (
                      <span
                        className={`att-cal-day-dot ${
                          cd.status === "PRESENT"
                            ? "dot-present"
                            : cd.status === "LATE"
                            ? "dot-late"
                            : cd.status === "HALF DAY"
                            ? "dot-halfday"
                            : cd.status === "HOLIDAY"
                            ? "dot-holiday"
                            : cd.status === "WEEKLY OFF"
                            ? "dot-weeklyoff"
                            : "dot-absent"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Status Legend */}
            <div className="att-calendar-legend">
              <div className="att-legend-item">
                <span className="att-legend-dot dot-present" />
                <span>Present</span>
              </div>
              <div className="att-legend-item">
                <span className="att-legend-dot dot-late" />
                <span>Late</span>
              </div>
              <div className="att-legend-item">
                <span className="att-legend-dot dot-halfday" />
                <span>Half Day</span>
              </div>
              <div className="att-legend-item">
                <span className="att-legend-dot dot-absent" />
                <span>Absent</span>
              </div>
              <div className="att-legend-item">
                <span className="att-legend-dot dot-weeklyoff" />
                <span>Weekly Off</span>
              </div>
              <div className="att-legend-item">
                <span className="att-legend-dot dot-holiday" />
                <span>Holiday</span>
              </div>
            </div>
          </div>

          {/* Today's Status Widget (Connected directly to Clock-in API: /attendance/status) */}
          <div className="att-card att-today-card">
            <div className="att-today-header">
              <h4>Today's Status</h4>
              <span
                className={`att-punch-badge ${
                  isClockedIn ? "in" : clockOutTime ? "out" : "not-checked"
                }`}
              >
                <span className="att-pulse-dot" />
                {isClockedIn
                  ? "Clocked In"
                  : clockOutTime
                  ? "Clocked Out"
                  : "Not Checked In"}
              </span>
            </div>

            <div className="att-today-times-row">
              <div className="att-today-time-box">
                <span className="att-today-time-label">Check-In</span>
                <span className="att-today-time-val">
                  {todayClockData?.login || (clockInTime ? formatTime(clockInTime) : "-")}
                </span>
              </div>
              <div className="att-today-time-divider" />
              <div className="att-today-time-box">
                <span className="att-today-time-label">Check-Out</span>
                <span className="att-today-time-val">
                  {todayClockData?.logout || (clockOutTime ? formatTime(clockOutTime) : "-")}
                </span>
              </div>
            </div>

            {/* Live Working Hours Counter */}
            <div className="att-today-counter-box">
              <span className="att-counter-label">Working Hours</span>
              <div className="att-counter-value">
                <span>{String(liveWorkingTime.hours).padStart(2, "0")}h</span>
                <span className="colon">:</span>
                <span>{String(liveWorkingTime.minutes).padStart(2, "0")}m</span>
                <span className="colon">:</span>
                <span>{String(liveWorkingTime.seconds).padStart(2, "0")}s</span>
              </div>
            </div>

            <button
              type="button"
              className="att-view-log-btn"
              onClick={handleViewTodayLog}
            >
              <FiEye />
              <span>View Detailed Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Day Log Details Modal (Rendered to document.body via Portal) */}
      {showDetailModal &&
        selectedDayRecord &&
        createPortal(
          <div
            className="att-modal-overlay"
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className="att-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="att-modal-header">
                <div className="att-modal-header-text">
                  <h3>Attendance Details</h3>
                  <p>{formatDate(selectedDayRecord.date)}</p>
                </div>
                <button
                  type="button"
                  className="att-modal-close-btn"
                  onClick={() => setShowDetailModal(false)}
                  aria-label="Close details modal"
                >
                  <FiX />
                </button>
              </div>

              {/* Modal Body */}
              <div className="att-modal-body">
                {/* Primary Stats Grid */}
                <div className="att-modal-stats-grid">
                  <div className="att-modal-stat-box">
                    <span className="att-modal-stat-lbl">Status</span>
                    <span
                      className={`att-status-pill ${
                        getNormalizedStatus(selectedDayRecord.status) === "PRESENT"
                          ? "present"
                          : getNormalizedStatus(selectedDayRecord.status) === "LATE"
                          ? "late"
                          : getNormalizedStatus(selectedDayRecord.status) === "HALF DAY"
                          ? "halfday"
                          : getNormalizedStatus(selectedDayRecord.status) === "HOLIDAY"
                          ? "holiday"
                          : "absent"
                      }`}
                    >
                      {getNormalizedStatus(selectedDayRecord.status)}
                    </span>
                  </div>

                  <div className="att-modal-stat-box">
                    <span className="att-modal-stat-lbl">Shift</span>
                    <span className="att-modal-stat-val">
                      {selectedDayRecord.shiftTime || "09:30 AM - 06:30 PM"}
                    </span>
                  </div>

                  <div className="att-modal-stat-box">
                    <span className="att-modal-stat-lbl">Login Time</span>
                    <span className="att-modal-stat-val">
                      {formatTime(selectedDayRecord.checkInTime)}
                    </span>
                  </div>

                  <div className="att-modal-stat-box">
                    <span className="att-modal-stat-lbl">Logout Time</span>
                    <span className="att-modal-stat-val">
                      {formatTime(selectedDayRecord.checkOutTime)}
                    </span>
                  </div>

                  <div className="att-modal-stat-box">
                    <span className="att-modal-stat-lbl">Total Time</span>
                    <span className="att-modal-stat-val bold">
                      {selectedDayRecord.totalTime || "-"}
                    </span>
                  </div>

                  <div className="att-modal-stat-box">
                    <span className="att-modal-stat-lbl">Late By</span>
                    <span className="att-modal-stat-val">
                      {selectedDayRecord.lateBy || "-"}
                    </span>
                  </div>
                </div>

                {/* Additional Info / Device & Location */}
                <div className="att-modal-section">
                  <h5>Check-In Metadata</h5>
                  <div className="att-modal-meta-list">
                    <div className="att-modal-meta-item">
                      <FiSmartphone />
                      <span>Device / Browser: {selectedDayRecord.device || "Desktop Web"}</span>
                    </div>
                    {selectedDayRecord.ip && (
                      <div className="att-modal-meta-item">
                        <FiGlobe />
                        <span>IP Address: {selectedDayRecord.ip}</span>
                      </div>
                    )}
                    {selectedDayRecord.location && (
                      <div className="att-modal-meta-item">
                        <FiMapPin />
                        <span>Location: {selectedDayRecord.location}</span>
                      </div>
                    )}
                    {selectedDayRecord.autoClockout && (
                      <div className="att-modal-meta-item warning">
                        <FiAlertTriangle />
                        <span>Session was automatically ended at midnight by the system.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes if any */}
                {selectedDayRecord.notes && (
                  <div className="att-modal-section">
                    <h5>Notes / Remarks</h5>
                    <p className="att-modal-notes-text">{selectedDayRecord.notes}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="att-modal-footer">
                <button
                  type="button"
                  className="att-modal-primary-btn"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Attendance;
