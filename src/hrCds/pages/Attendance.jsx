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
  FiGlobe,
  FiVolume2
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
    return userJoinDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
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
    if (typeof isoString === "string") {
      const trimmed = isoString.trim();
      if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/.test(trimmed)) {
        return trimmed;
      }
    }
    const d = new Date(isoString);
    if (isNaN(d.getTime()) || d.getTime() === 0 || d.getFullYear() <= 1970) return "-";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const normalizeToDateKey = (val) => {
    if (!val) return "";
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      if (trimmed.includes("T")) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        return trimmed.split("T")[0];
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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

  const formatShiftWindow = (start, end) => {
    if (!start || !end) return "";
    const to12h = (t) => {
      if (!t) return "";
      if (/\b(AM|PM|am|pm)\b/.test(t)) return t;
      const [rawH, rawM] = String(t).split(":");
      const h = parseInt(rawH, 10);
      const m = parseInt(rawM, 10);
      if (isNaN(h) || isNaN(m)) return t;
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
    };
    return `${to12h(start)} - ${to12h(end)}`;
  };

  const getRecordShiftDisplay = (rec) => {
    if (!rec) return "--";
    if (rec.shiftTime && rec.shiftTime !== "-" && rec.shiftTime !== "--") return rec.shiftTime;
    if (rec.shiftStart && rec.shiftEnd) {
      return formatShiftWindow(rec.shiftStart, rec.shiftEnd);
    }
    return "--";
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
    if (s.includes("LEAVE") && !s.includes("UNINFORMED")) return "ON LEAVE";
    if (s.includes("ABSENT") || s.includes("UNINFORMED")) return "ABSENT";
    return s;
  };

  const getRecordLoginDisplay = (item) => {
    if (!item) return "-";
    const normStatus = getNormalizedStatus(item.status);
    const isInactiveDay =
      normStatus === "ABSENT" ||
      normStatus === "WEEKLY OFF" ||
      normStatus === "HOLIDAY" ||
      normStatus === "ON LEAVE";
    if (isInactiveDay) return "-";

    const checkIn = item.inTime || item.checkInTime;
    if (checkIn) {
      const formatted = formatTime(checkIn);
      if (formatted && formatted !== "-") return formatted;
    }
    if (item.login && item.login !== "-" && item.login !== "--") {
      return item.login;
    }
    return "-";
  };

  const getRecordLogoutDisplay = (item) => {
    if (!item) return "-";
    const normStatus = getNormalizedStatus(item.status);
    const isInactiveDay =
      normStatus === "ABSENT" ||
      normStatus === "WEEKLY OFF" ||
      normStatus === "HOLIDAY" ||
      normStatus === "ON LEAVE";
    if (isInactiveDay) return "-";

    const isCurrentlyClockedIn =
      item.isClockedIn === true ||
      (!item.outTime && !item.checkOutTime && Boolean(item.inTime || item.checkInTime));
    if (isCurrentlyClockedIn && !item.outTime && !item.checkOutTime) {
      return "-";
    }

    const checkOut = item.outTime || item.checkOutTime;
    if (checkOut) {
      const formatted = formatTime(checkOut);
      if (formatted && formatted !== "-") return formatted;
    }
    if (item.logout && item.logout !== "-" && item.logout !== "--") {
      return item.logout;
    }
    return "-";
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
      const shiftTime = todayClockData.shiftTime || 
        (todayClockData.shiftStart && todayClockData.shiftEnd
          ? formatShiftWindow(todayClockData.shiftStart, todayClockData.shiftEnd)
          : "--");
      setSelectedDayRecord({
        date: todayClockData.date || new Date().toISOString().split("T")[0],
        checkInTime: todayClockData.inTime,
        checkOutTime: todayClockData.outTime,
        status: todayClockData.status || (isClockedIn ? "PRESENT" : "ABSENT"),
        shiftName: todayClockData.shiftName || "General Shift",
        shiftStart: todayClockData.shiftStart,
        shiftEnd: todayClockData.shiftEnd,
        shiftTime: shiftTime,
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
          const selDateStr = normalizeToDateKey(selectedCalendarDate);
          if (normalizeToDateKey(rec.dateKey || rec.date) !== selDateStr) return false;
        }

        // Time range filter
        if (!selectedCalendarDate) {
          if (timeRange === "TODAY") {
            const todayStr = normalizeToDateKey(new Date());
            if (normalizeToDateKey(rec.dateKey || rec.date) !== todayStr) return false;
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

  // Keep pagination to max 2 buttons (e.g. 1-2, 3-4...) advancing cleanly with arrow / page buttons
  const visiblePages = useMemo(() => {
    if (totalPages <= 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pairIndex = Math.floor((currentPage - 1) / 2);
    let start = pairIndex * 2 + 1;
    let end = Math.min(start + 1, totalPages);
    if (start === totalPages && totalPages > 1) {
      start = totalPages - 1;
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

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
  // 10b. Hero Summary Cards Configuration (Matching Image 1)
  // ----------------------------------------------------
  const attendanceSummaryCards = useMemo(
    () => [
      {
        label: "Total Records",
        value: stats.total,
        tone: "total",
        icon: FiBarChart2,
        subtext: "Current filtered view",
      },
      {
        label: "Late Days",
        value: stats.late,
        tone: "pending",
        icon: FiAlertTriangle,
        subtext: `${stats.latePct}% of filtered records`,
      },
      {
        label: "Half Days",
        value: stats.halfDay,
        tone: "progress",
        icon: FiCoffee,
        subtext: `${stats.halfDayPct}% of filtered records`,
      },
      {
        label: "Present Days",
        value: stats.present,
        tone: "completed",
        icon: FiUserCheck,
        subtext: `${stats.presentPct}% of filtered records`,
      },
      {
        label: "Absent Days",
        value: stats.absent,
        tone: "overdue",
        icon: FiXCircle,
        subtext: `${stats.absentPct}% of filtered records`,
      },
    ],
    [stats]
  );

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
      "Notes",
    ];

    const rows = filteredRecords.map((r) => {
      const normStatus = getNormalizedStatus(r.status);
      const loginDisplay = getRecordLoginDisplay(r);
      const logoutDisplay = getRecordLogoutDisplay(r);

      const formattedShiftTime = getRecordShiftDisplay(r);
      const shiftDisplay =
        normStatus === "WEEKLY OFF"
          ? "Weekly Off"
          : normStatus === "HOLIDAY"
          ? "Holiday"
          : normStatus === "ON LEAVE"
          ? "On Leave"
          : formattedShiftTime !== "--"
          ? `${r.shiftName || "General Shift"} (${formattedShiftTime})`
          : r.shiftName || "General Shift";

      const displayStatus =
        normStatus === "PRESENT"
          ? "Present"
          : normStatus === "ABSENT"
          ? "Absent"
          : normStatus === "LATE"
          ? "Late"
          : normStatus === "HALF DAY"
          ? "Half Day"
          : normStatus === "WEEKLY OFF"
          ? "Weekly Off"
          : normStatus === "HOLIDAY"
          ? "Holiday"
          : normStatus === "ON LEAVE"
          ? "On Leave"
          : r.status || "-";

      return [
        formatDate(r.date),
        shiftDisplay,
        loginDisplay,
        logoutDisplay,
        r.totalTime || r.workingHours || "-",
        displayStatus,
        r.lateBy && r.lateBy !== "00:00:00" ? r.lateBy : "-",
        r.autoClockout ? "Yes" : "No",
        r.notes || "-",
      ];
    });

    const csvString =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\r\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Attendance_${MONTH_NAMES[currentMonth]}_${currentYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Attendance CSV exported successfully!");
  };

  // ----------------------------------------------------
  // 13. Calendar Generator (Monthly Overview Grid)
  // ----------------------------------------------------
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];
    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDaysCount - i,
        isPadding: true,
        status: "NONE"
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

      const rec = attendance.find(
        (a) => (a.dateKey && a.dateKey === dateKey) || normalizeToDateKey(a.date) === dateKey
      );
      const isHol = holidays.some(
        (h) => (h.dateKey && h.dateKey === dateKey) || normalizeToDateKey(h.date) === dateKey
      );

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
        isPadding: false,
        record: rec
      });
    }

    // Next month padding days
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remainingDays; n++) {
      days.push({
        day: n,
        isPadding: true,
        status: "NONE"
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

      {/* 1. Hero Header Section with Title & 5 Summary KPI Cards */}
      <div className="att-hero-header">
        <div className="att-hero-header-row">
          <div className="att-hero-header-left">
            <h1 className="att-hero-title">My Attendance</h1>
            <p className="att-hero-subtitle">Track your attendance history and insights</p>
          </div>
        </div>

        <div className="att-hero-summary">
          {attendanceSummaryCards.map((card) => (
            <article className={`att-hero-summary-card ${card.tone}`} key={card.label}>
              <span>{React.createElement(card.icon)}</span>
              <div>
                <small>{card.label}</small>
                <strong>{card.value}</strong>
              </div>
              <p>{card.subtext}</p>
            </article>
          ))}
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


      {/* 4. Holiday Announcement Banner (Dismissible) */}
      {!holidayBannerDismissed && currentMonthHolidays.length > 0 && (
        <div className="att-holiday-banner">
          <div className="att-holiday-banner-left">
            <div className="att-holiday-icon-box">
              <FiVolume2 />
            </div>
            <div className="att-holiday-text">
              <span>
                <b>{currentMonthHolidays.length} Holiday{currentMonthHolidays.length > 1 ? "s" : ""} this month</b> -{" "}
                {currentMonthHolidays
                  .map((h) => `${formatDate(h.date)} (${h.name || h.title || "Holiday"})`)
                  .join(" • ")}
              </span>
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
              <div className="att-table-header-title-group">
                <div className="att-table-header-icon-box">
                  <FiCalendar />
                </div>
                <div className="att-table-header-title">
                  <h3>Attendance Records</h3>
                  <p className="att-table-header-sub">Showing your attendance history for selected period</p>
                </div>
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
                    className="att-status-filter-icon-btn"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    title="Filter by status"
                  >
                    <FiFilter />
                  </button>

                  {showStatusDropdown && (
                    <div className="att-filter-dropdown-menu">
                      {["ALL", "PRESENT", "LATE", "HALF DAY", "ABSENT", "WEEKLY OFF", "HOLIDAY", "ON LEAVE"].map((st) => (
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
                      const isLate = normStatus === "LATE" || Boolean(item.lateBy && item.lateBy !== "-" && item.lateBy !== "00:00:00");
                      const displayLogin = getRecordLoginDisplay(item);
                      const displayLogout = getRecordLogoutDisplay(item);

                      const formattedShiftTime = getRecordShiftDisplay(item);
                      const isSpecialDay =
                        normStatus === "WEEKLY OFF" ||
                        normStatus === "HOLIDAY" ||
                        normStatus === "ON LEAVE";

                      return (
                        <tr key={item._id || item.dateKey || item.date || idx}>
                          <td className="att-col-idx">{rowNumber}</td>
                          <td className="att-col-date">{formatDate(item.date)}</td>
                          <td className="att-col-shift">
                            {isSpecialDay ? (
                              <span className="att-shift-special">
                                {normStatus === "WEEKLY OFF"
                                  ? "Weekly Off"
                                  : normStatus === "HOLIDAY"
                                  ? "Holiday"
                                  : "On Leave"}
                              </span>
                            ) : (
                              <div className="att-shift-cell">
                                <span className="att-shift-name">{item.shiftName || "General Shift"}</span>
                                {formattedShiftTime && formattedShiftTime !== "--" && (
                                  <span className="att-shift-time">{formattedShiftTime}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {displayLogin && displayLogin !== "-" && displayLogin !== "--" ? (
                              <div className="att-time-cell">
                                <span className={`att-time-dot ${isLate ? "late" : "on-time"}`} />
                                <span>{displayLogin}</span>
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>--</span>
                            )}
                          </td>
                          <td>
                            {displayLogout && displayLogout !== "-" && displayLogout !== "--" ? (
                              <div className="att-logout-cell-group">
                                <div className="att-time-cell">
                                  <span className="att-time-dot on-time" />
                                  <span>{displayLogout}</span>
                                </div>
                                {item.autoClockout && (
                                  <span className="att-auto-clockout-tag">Auto Clock Out</span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>--</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>
                            {item.totalTime || item.workingHours || "00:00:00"}
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
                                  : normStatus === "ON LEAVE"
                                  ? "onleave"
                                  : "absent"
                              }`}
                            >
                              {normStatus === "PRESENT" && <FiCheck className="status-icon" />}
                              {normStatus === "ABSENT" && <FiX className="status-icon" />}
                              {normStatus === "PRESENT"
                                ? "Present"
                                : normStatus === "ABSENT"
                                ? "Absent"
                                : normStatus}
                            </span>
                          </td>
                          <td>
                            {item.lateBy && item.lateBy !== "-" && item.lateBy !== "00:00:00" ? (
                              <span className="att-late-badge">{item.lateBy}</span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>--</span>
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

                  {visiblePages.map((pageNum) => (
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
              <div className="att-cal-header-left">
                <div className="att-cal-icon-box">
                  <FiCalendar />
                </div>
                <div className="att-cal-title-info">
                  <h4>Monthly Overview</h4>
                  <span className="att-cal-subtitle">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                </div>
              </div>
              <div className="att-calendar-nav">
                <button
                  type="button"
                  className="att-cal-nav-btn"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                >
                  <FiChevronLeft />
                </button>
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
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="att-cal-days-grid">
              {calendarDays.map((cd, index) => {
                if (cd.isPadding) {
                  return (
                    <div key={`padding-${index}`} className="att-cal-day padding">
                      <span className="att-cal-day-num">{cd.day}</span>
                    </div>
                  );
                }

                const isSelected =
                  selectedCalendarDate &&
                  normalizeToDateKey(selectedCalendarDate) === cd.dateKey;

                const statusClass = cd.status !== "NONE"
                  ? `status-${cd.status.toLowerCase().replace(/\s+/g, "")}`
                  : "";

                return (
                  <button
                    key={cd.dateKey}
                    type="button"
                    className={`att-cal-day ${statusClass} ${cd.isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCalendarDate(null);
                      } else {
                        const [y, m, d] = cd.dateKey.split("-").map(Number);
                        setSelectedCalendarDate(new Date(y, m - 1, d));
                      }
                    }}
                    title={`${cd.dateKey}: ${cd.status}`}
                  >
                    <span className="att-cal-day-num">{cd.day}</span>
                    {cd.status !== "NONE" && (
                      <span
                        className={`att-cal-day-dot dot-${cd.status.toLowerCase().replace(/\s+/g, "")}`}
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
                <span className="att-legend-dot dot-absent" />
                <span>Absent</span>
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
                <span className="att-legend-dot dot-onleave" />
                <span>On Leave</span>
              </div>
              <div className="att-legend-item">
                <span className="att-legend-dot dot-holiday" />
                <span>Holiday</span>
              </div>
              <div className="att-legend-item">
                <span className="att-legend-dot dot-weeklyoff" />
                <span>Weekly Off</span>
              </div>
            </div>
          </div>

          {/* Today's Status Widget */}
          <div className="att-card att-today-card">
            <div className="att-today-header">
              <div className="att-today-title-group">
                <FiClock className="att-today-title-icon" />
                <h4>Today's Status</h4>
              </div>
              <span className="att-today-date-badge">
                {todayDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            </div>

            <div className={`att-today-status-banner ${isClockedIn ? "present" : clockOutTime ? "clocked-out" : "not-checked"}`}>
              <div className="att-today-status-left">
                <div className="att-today-status-icon-circle">
                  {isClockedIn ? <FiCheck /> : clockOutTime ? <FiClock /> : <FiAlertTriangle />}
                </div>
                <div className="att-today-status-text">
                  <h5 className="att-today-status-title">
                    {isClockedIn ? "Present" : clockOutTime ? "Clocked Out" : "Not Checked In"}
                  </h5>
                  <p className="att-today-status-subtitle">
                    {isClockedIn && (todayClockData?.login || (clockInTime ? formatTime(clockInTime) : null))
                      ? `Checked in at ${todayClockData?.login || formatTime(clockInTime)}`
                      : clockOutTime
                      ? `Clocked out at ${todayClockData?.logout || formatTime(clockOutTime)}`
                      : "No check-in recorded yet"}
                  </p>
                </div>
              </div>

              <div className="att-today-hours-right">
                <span className="att-today-hours-label">Working Hours</span>
                <span className="att-today-hours-val">
                  {String(liveWorkingTime.hours).padStart(2, "0")}:
                  {String(liveWorkingTime.minutes).padStart(2, "0")}:
                  {String(liveWorkingTime.seconds).padStart(2, "0")}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="att-view-log-btn"
              onClick={handleViewTodayLog}
            >
              <FiClock />
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
                      {getRecordShiftDisplay(selectedDayRecord)}
                    </span>
                  </div>

                  <div className="att-modal-stat-box">
                    <span className="att-modal-stat-lbl">Login Time</span>
                    <span className="att-modal-stat-val">
                      {getRecordLoginDisplay(selectedDayRecord)}
                    </span>
                  </div>

                  <div className="att-modal-stat-box">
                    <span className="att-modal-stat-lbl">Logout Time</span>
                    <span className="att-modal-stat-val">
                      {getRecordLogoutDisplay(selectedDayRecord)}
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
