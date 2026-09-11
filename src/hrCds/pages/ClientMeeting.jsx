import { useEffect, useState, useMemo, useCallback } from "react";
import axiosInstance from "../../utils/axiosConfig";
import "./ClientMeeting.css";

const getCompanyCode = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const company = JSON.parse(localStorage.getItem("company") || "{}");
    const companyDetails = JSON.parse(localStorage.getItem("companyDetails") || "{}");
    return (
      localStorage.getItem("companyCode") ||
      user.companyCode ||
      company.companyCode ||
      companyDetails.companyCode ||
      ""
    );
  } catch {
    return localStorage.getItem("companyCode") || "";
  }
};

export default function ClientMeeting() {
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    upcoming: 0,
    highPriority: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Views
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [clientMode, setClientMode] = useState("select"); // "select" | "custom"
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState(null);

  const initialForm = {
    clientId: "",
    clientName: "",
    company: "",
    email: "",
    phone: "",
    title: "",
    meetingType: "Online",
    priority: "Normal",
    meetingDate: new Date().toISOString().split("T")[0],
    meetingTime: "10:00",
    duration: "30",
    location: "Google Meet",
    link: "",
    status: "Scheduled",
    followUpRequired: "No",
    description: "",
  };

  const [form, setForm] = useState(initialForm);

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch Stats from Backend
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const companyCode = getCompanyCode();
      const res = await axiosInstance.get("/cmeeting/stats", {
        params: companyCode ? { companyCode } : {},
      });
      if (res.data && res.data.success && res.data.data) {
        setStats({
          total: res.data.data.total ?? 0,
          today: res.data.data.today ?? 0,
          upcoming: res.data.data.upcoming ?? 0,
          highPriority: res.data.data.highPriority ?? 0,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch meeting stats from endpoint, using local counts:", err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Meetings List
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const companyCode = getCompanyCode();
      const res = await axiosInstance.get("/cmeeting", {
        params: {
          limit: 300,
          page: 1,
          ...(companyCode ? { companyCode } : {}),
        },
      });

      const list = Array.isArray(res.data)
        ? res.data
        : res.data.data || res.data.meetings || [];
      setMeetings(list);

      // Local fallback for stats if stats API didn't return values
      const todayStr = new Date().toISOString().split("T")[0];
      const next7 = new Date();
      next7.setDate(next7.getDate() + 7);
      const next7Str = next7.toISOString().split("T")[0];

      const totalCount = list.length;
      const todayCount = list.filter((m) => {
        const d = (m.meetingDate || "").split("T")[0];
        return d === todayStr;
      }).length;
      const upcomingCount = list.filter((m) => {
        const d = (m.meetingDate || "").split("T")[0];
        return d >= todayStr && d <= next7Str;
      }).length;
      const highPriorityCount = list.filter((m) => m.priority === "High").length;

      setStats((prev) => ({
        total: prev.total || totalCount,
        today: prev.today || todayCount,
        upcoming: prev.upcoming || upcomingCount,
        highPriority: prev.highPriority || highPriorityCount,
      }));
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      showToast("Unable to load meetings. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Available Clients for quick selection
  const fetchClients = useCallback(async () => {
    try {
      const companyCode = getCompanyCode();
      const res = await axiosInstance.get("/clientsservice", {
        params: { limit: 200, ...(companyCode ? { companyCode } : {}) },
      });
      const list = Array.isArray(res.data)
        ? res.data
        : res.data.data || res.data.clients || [];
      setClients(list);
    } catch (err) {
      console.warn("Could not fetch clients list:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
    fetchStats();
    fetchClients();
  }, [fetchMeetings, fetchStats, fetchClients]);

  // Client-side Filtering based on Search, Date Range, Type, and Priority
  const filteredMeetings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split("T")[0];

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return meetings.filter((meeting) => {
      const title = String(meeting.title || "").toLowerCase();
      const clientName = String(
        meeting.clientName || meeting.clientId?.client || ""
      ).toLowerCase();
      const company = String(
        meeting.company || meeting.clientId?.company || ""
      ).toLowerCase();
      const email = String(
        meeting.email || meeting.clientId?.email || ""
      ).toLowerCase();
      const phone = String(meeting.phone || meeting.clientId?.phone || "");

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          title.includes(query) ||
          clientName.includes(query) ||
          company.includes(query) ||
          email.includes(query) ||
          phone.includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== "all" && meeting.meetingType !== typeFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && meeting.priority !== priorityFilter) {
        return false;
      }

      // Date Range filter
      if (dateRangeFilter !== "all") {
        const meetingDateRaw = meeting.meetingDate
          ? new Date(meeting.meetingDate)
          : null;
        if (!meetingDateRaw || isNaN(meetingDateRaw.getTime())) return false;

        const mDateStr = meetingDateRaw.toISOString().split("T")[0];

        if (dateRangeFilter === "today") {
          if (mDateStr !== todayStr) return false;
        } else if (dateRangeFilter === "tomorrow") {
          if (mDateStr !== tomorrowStr) return false;
        } else if (dateRangeFilter === "next7") {
          if (mDateStr < todayStr || mDateStr > next7DaysStr) return false;
        } else if (dateRangeFilter === "thisMonth") {
          if (
            meetingDateRaw.getFullYear() !== currentYear ||
            meetingDateRaw.getMonth() !== currentMonth
          ) {
            return false;
          }
        } else if (dateRangeFilter === "past") {
          if (mDateStr >= todayStr) return false;
        }
      }

      return true;
    });
  }, [meetings, searchTerm, typeFilter, priorityFilter, dateRangeFilter]);

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle Client Dropdown Selection
  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    if (!clientId) {
      setForm((prev) => ({
        ...prev,
        clientId: "",
        clientName: "",
        company: "",
        email: "",
        phone: "",
      }));
      return;
    }

    if (clientId === "__new__") {
      setClientMode("custom");
      setForm((prev) => ({
        ...prev,
        clientId: "",
        clientName: "",
        company: "",
        email: "",
        phone: "",
      }));
      return;
    }

    const selected = clients.find((c) => String(c._id) === String(clientId));
    if (selected) {
      setForm((prev) => ({
        ...prev,
        clientId: selected._id,
        clientName: selected.client || selected.clientName || "",
        company: selected.company || "",
        email: selected.email || "",
        phone: selected.phone || "",
      }));
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setDateRangeFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
  };

  // Open Modal for New Meeting
  const openNewMeetingModal = () => {
    setSelectedMeeting(null);
    setClientMode(clients.length > 0 ? "select" : "custom");
    setForm({
      ...initialForm,
      meetingDate: new Date().toISOString().split("T")[0],
      title: "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open Modal for Editing Meeting
  const openEditMeetingModal = (meeting) => {
    setSelectedMeeting(meeting);
    setClientMode("custom");
    setForm({
      clientId: meeting.clientId?._id || meeting.clientId || "",
      clientName: meeting.clientName || meeting.clientId?.client || "",
      company: meeting.company || meeting.clientId?.company || "",
      email: meeting.email || meeting.clientId?.email || "",
      phone: meeting.phone || meeting.clientId?.phone || "",
      title: meeting.title || "",
      meetingType: meeting.meetingType || "Online",
      priority: meeting.priority || "Normal",
      meetingDate: meeting.meetingDate
        ? new Date(meeting.meetingDate).toISOString().split("T")[0]
        : "",
      meetingTime: meeting.meetingTime || "10:00",
      duration: String(meeting.duration || "30"),
      location: meeting.location || "Google Meet",
      link: meeting.link || (meeting.location?.startsWith("http") ? meeting.location : ""),
      status: meeting.status || "Scheduled",
      followUpRequired: meeting.followUpRequired || "No",
      description: meeting.description || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!form.clientName.trim()) {
      errors.clientName = "Client name is required";
    }
    if (!form.title.trim()) {
      errors.title = "Meeting title is required";
    }
    if (!form.meetingDate) {
      errors.meetingDate = "Meeting date is required";
    }
    if (!form.meetingTime) {
      errors.meetingTime = "Meeting time is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Meeting (Create or Update)
  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const companyCode = getCompanyCode();

      const payload = {
        ...form,
        companyCode: companyCode || "CIIS",
        // Ensure meeting link is synchronized
        link: form.link || (form.location?.startsWith("http") ? form.location : ""),
      };

      if (selectedMeeting) {
        await axiosInstance.put(`/cmeeting/${selectedMeeting._id}`, payload);
        showToast("Meeting updated successfully!");
      } else {
        await axiosInstance.post("/cmeeting/create", payload);
        showToast("Client meeting scheduled successfully!");
      }

      setShowModal(false);
      fetchMeetings();
      fetchStats();
    } catch (err) {
      console.error("Save meeting error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to save meeting. Please try again.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Update
  const handleStatusChange = async (meetingId, newStatus) => {
    try {
      await axiosInstance.patch(`/cmeeting/${meetingId}/status`, {
        status: newStatus,
      });
      setMeetings((prev) =>
        prev.map((m) => (m._id === meetingId ? { ...m, status: newStatus } : m))
      );
      showToast(`Status updated to ${newStatus}`);
      fetchStats();
    } catch (err) {
      console.error("Update status error:", err);
      showToast("Could not update status", "error");
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete meeting "${title || 'this meeting'}"?`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/cmeeting/${id}`);
      showToast("Meeting deleted successfully");
      setMeetings((prev) => prev.filter((m) => m._id !== id));
      fetchStats();
    } catch (err) {
      console.error("Delete meeting error:", err);
      showToast("Failed to delete meeting", "error");
    }
  };

  // Formatting helpers
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = String(timeStr).split(":");
    const hours = parseInt(h, 10);
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${m || "00"} ${ampm}`;
  };

  const getClientInitials = (name) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="cm-page-wrapper">
      {/* Toast Notification */}
      {notification && (
        <div className={`cm-toast cm-toast-${notification.type}`}>
          <span className="cm-toast-icon">
            {notification.type === "success" ? "✓" : "⚠"}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. HERO HEADER CARD */}
      <div className="cm-hero-card">
        <div className="cm-hero-left">
          <div className="cm-hero-badge">
            <svg
              className="cm-hero-badge-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div className="cm-hero-text">
            <h1 className="cm-hero-title">Client Meetings</h1>
            <p className="cm-hero-subtitle">
              Manage and schedule client meetings efficiently
            </p>
            <div className="cm-hero-quote">
              <span className="cm-hero-quote-mark">“</span>
              <span className="cm-hero-quote-text">
                Good meetings create better opportunities.
              </span>
              <span className="cm-hero-quote-mark">”</span>
            </div>
          </div>
        </div>

        {/* 3D Calendar Illustration & Plan/Connect/Grow */}
        <div className="cm-hero-right">
          <div className="cm-hero-illustration">
            <svg
              className="cm-3d-calendar"
              viewBox="0 0 140 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Calendar Base Drop Shadow */}
              <ellipse cx="68" cy="110" rx="52" ry="7" fill="#dbeafe" />
              
              {/* Calendar Body */}
              <rect
                x="20"
                y="22"
                width="88"
                height="80"
                rx="14"
                fill="#ffffff"
                stroke="#93c5fd"
                strokeWidth="2.5"
              />
              {/* Top Blue Header */}
              <path
                d="M20 34C20 26.268 26.268 20 34 20H94C101.732 20 108 26.268 108 34V42H20V34Z"
                fill="#2563eb"
              />
              {/* Spiral Rings */}
              <rect x="36" y="14" width="6" height="12" rx="3" fill="#60a5fa" />
              <rect x="52" y="14" width="6" height="12" rx="3" fill="#60a5fa" />
              <rect x="68" y="14" width="6" height="12" rx="3" fill="#60a5fa" />
              <rect x="84" y="14" width="6" height="12" rx="3" fill="#60a5fa" />

              {/* Calendar Grid Dots */}
              <circle cx="36" cy="54" r="3" fill="#93c5fd" />
              <circle cx="52" cy="54" r="3" fill="#93c5fd" />
              <circle cx="68" cy="54" r="3" fill="#93c5fd" />
              <circle cx="84" cy="54" r="3" fill="#93c5fd" />

              <circle cx="36" cy="68" r="3" fill="#93c5fd" />
              <circle cx="52" cy="68" r="3" fill="#2563eb" />
              <circle cx="68" cy="68" r="3" fill="#93c5fd" />
              <circle cx="84" cy="68" r="3" fill="#93c5fd" />

              <circle cx="36" cy="82" r="3" fill="#93c5fd" />
              <circle cx="52" cy="82" r="3" fill="#93c5fd" />
              <circle cx="68" cy="82" r="3" fill="#93c5fd" />
              <circle cx="84" cy="82" r="3" fill="#93c5fd" />

              {/* 3D Floating Blue Video Camera Badge */}
              <g filter="drop-shadow(0px 6px 10px rgba(37,99,235,0.35))">
                <rect
                  x="78"
                  y="66"
                  width="44"
                  height="36"
                  rx="12"
                  fill="url(#badgeGrad)"
                />
                <polygon points="112 79 104 84 112 89 112 79" fill="#ffffff" />
                <rect x="86" y="78" width="14" height="12" rx="2.5" fill="#ffffff" />
              </g>

              <defs>
                <linearGradient
                  id="badgeGrad"
                  x1="78"
                  y1="66"
                  x2="122"
                  y2="102"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="cm-hero-tags">
            <span className="cm-tag-item">Plan</span>
            <span className="cm-tag-item">Connect</span>
            <div className="cm-tag-grow-wrapper">
              <span className="cm-tag-item cm-tag-grow">Grow</span>
              <svg
                className="cm-grow-underline"
                width="40"
                height="6"
                viewBox="0 0 40 6"
                fill="none"
              >
                <path
                  d="M1 4.5C12 1.5 28 1.5 39 4"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 KPI STAT CARDS */}
      <div className="cm-stats-row">
        {/* Total Meetings */}
        <div className="cm-kpi-card">
          <div className="cm-kpi-icon cm-icon-blue">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="cm-kpi-details">
            <span className="cm-kpi-value">{stats.total}</span>
            <h4 className="cm-kpi-title">Total Meetings</h4>
            <p className="cm-kpi-subtitle">All scheduled meetings</p>
          </div>
        </div>

        {/* Today's Meetings */}
        <div className="cm-kpi-card">
          <div className="cm-kpi-icon cm-icon-green">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="cm-kpi-details">
            <span className="cm-kpi-value">{stats.today}</span>
            <h4 className="cm-kpi-title">Today's Meetings</h4>
            <p className="cm-kpi-subtitle">Meetings scheduled for today</p>
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="cm-kpi-card">
          <div className="cm-kpi-icon cm-icon-amber">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M12 14l1.5 2 3-3" />
            </svg>
          </div>
          <div className="cm-kpi-details">
            <span className="cm-kpi-value">{stats.upcoming}</span>
            <h4 className="cm-kpi-title">Upcoming Meetings</h4>
            <p className="cm-kpi-subtitle">Meetings in next 7 days</p>
          </div>
        </div>

        {/* High Priority */}
        <div className="cm-kpi-card">
          <div className="cm-kpi-icon cm-icon-purple">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="cm-kpi-details">
            <span className="cm-kpi-value">{stats.highPriority}</span>
            <h4 className="cm-kpi-title">High Priority</h4>
            <p className="cm-kpi-subtitle">Marked as high priority</p>
          </div>
        </div>
      </div>

      {/* 3. VIEW SWITCHER & ACTION BAR */}
      <div className="cm-action-bar">
        <div className="cm-view-switcher">
          <button
            type="button"
            className={`cm-switch-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
            </svg>
            <span>Table View</span>
          </button>

          <button
            type="button"
            className={`cm-switch-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Grid View</span>
          </button>
        </div>

        <button
          type="button"
          className="cm-btn-primary"
          onClick={openNewMeetingModal}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ New Meeting</span>
        </button>
      </div>

      {/* 4. FILTER & SEARCH BAR */}
      <div className="cm-filter-bar">
        {/* Search Input */}
        <div className="cm-search-box">
          <svg
            className="cm-search-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, company, email or meeting title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cm-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="cm-search-clear"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date Range Dropdown */}
        <div className="cm-select-field">
          <svg
            className="cm-field-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
          >
            <option value="all">Select Date Range</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="next7">Next 7 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="past">Past Meetings</option>
          </select>
          <svg
            className="cm-chevron"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Types Dropdown */}
        <div className="cm-select-field">
          <svg
            className="cm-field-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Online">Online</option>
            <option value="Demo">Demo</option>
            <option value="Discussion">Discussion</option>
            <option value="Sales">Sales</option>
            <option value="Review">Review</option>
            <option value="Support">Support</option>
            <option value="Onboarding">Onboarding</option>
          </select>
          <svg
            className="cm-chevron"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Priorities Dropdown */}
        <div className="cm-select-field">
          <svg
            className="cm-field-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
          <svg
            className="cm-chevron"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          className="cm-btn-reset"
          onClick={handleResetFilters}
          title="Reset all filters"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Reset</span>
        </button>
      </div>

      {/* 5. CONTENT / VIEWS / EMPTY STATE */}
      {loading ? (
        <div className="cm-loading-card">
          <div className="cm-loading-spinner" />
          <p>Loading client meetings...</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        /* EMPTY STATE - EXACT MATCH TO DESIGN MOCKUP */
        <div className="cm-empty-card">
          <div className="cm-empty-illustration-wrapper">
            <svg
              className="cm-empty-illustration"
              viewBox="0 0 160 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Floating Sparkles (+) */}
              <text x="24" y="44" fill="#60a5fa" fontSize="20" fontWeight="bold">
                +
              </text>
              <text x="132" y="36" fill="#60a5fa" fontSize="18" fontWeight="bold">
                +
              </text>
              <text x="28" y="112" fill="#93c5fd" fontSize="16" fontWeight="bold">
                +
              </text>
              <text x="136" y="100" fill="#93c5fd" fontSize="16" fontWeight="bold">
                +
              </text>

              {/* Base Oval Shadow */}
              <ellipse cx="78" cy="122" rx="46" ry="6" fill="#eff6ff" />

              {/* Calendar Body */}
              <rect
                x="36"
                y="30"
                width="84"
                height="78"
                rx="14"
                fill="#ffffff"
                stroke="#bfdbfe"
                strokeWidth="2.5"
              />
              {/* Calendar Top Bar */}
              <path
                d="M36 42C36 35.3726 41.3726 30 48 30H108C114.627 30 120 35.3726 120 42V48H36V42Z"
                fill="#3b82f6"
              />
              {/* Binder Rings */}
              <rect x="52" y="24" width="5" height="12" rx="2.5" fill="#93c5fd" />
              <rect x="76" y="24" width="5" height="12" rx="2.5" fill="#93c5fd" />
              <rect x="100" y="24" width="5" height="12" rx="2.5" fill="#93c5fd" />

              {/* Date Grid */}
              <circle cx="54" cy="62" r="3" fill="#cbd5e1" />
              <circle cx="78" cy="62" r="3" fill="#cbd5e1" />
              <circle cx="102" cy="62" r="3" fill="#cbd5e1" />

              <circle cx="54" cy="76" r="3" fill="#cbd5e1" />
              <circle cx="78" cy="76" r="3" fill="#3b82f6" />
              <circle cx="102" cy="76" r="3" fill="#cbd5e1" />

              <circle cx="54" cy="90" r="3" fill="#cbd5e1" />
              <circle cx="78" cy="90" r="3" fill="#cbd5e1" />

              {/* Video Camera Round Badge on bottom-right */}
              <g filter="drop-shadow(0px 4px 8px rgba(37,99,235,0.3))">
                <circle cx="104" cy="92" r="18" fill="#2563eb" />
                <polygon points="113 92 107 87 107 97 113 92" fill="#ffffff" />
                <rect x="95" y="86" width="11" height="12" rx="2" fill="#ffffff" />
              </g>
            </svg>
          </div>

          <h3 className="cm-empty-title">No meetings found</h3>
          <p className="cm-empty-subtitle">
            Schedule your first client meeting to get started and stay on top of your discussions.
          </p>

          <button
            type="button"
            className="cm-btn-primary cm-empty-btn"
            onClick={openNewMeetingModal}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ Schedule Meeting</span>
          </button>

          {/* Bottom Tip Bar */}
          <div className="cm-empty-tip-bar">
            <svg
              className="cm-tip-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="9" y1="18" x2="15" y2="18" />
              <line x1="10" y1="22" x2="14" y2="22" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
            </svg>
            <p className="cm-tip-text">
              <strong>Tip:</strong> You can search by client name, company, or filter by date, type or priority to find meetings quickly.
            </p>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="cm-table-card">
          <div className="cm-table-responsive">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Client / Company</th>
                  <th>Meeting Title</th>
                  <th>Type</th>
                  <th>Date & Time</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Meeting Link</th>
                  <th className="cm-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map((meeting) => {
                  const clientName =
                    meeting.clientName || meeting.clientId?.client || "Client";
                  const company =
                    meeting.company || meeting.clientId?.company || "-";
                  const email = meeting.email || meeting.clientId?.email || "";
                  const phone = meeting.phone || meeting.clientId?.phone || "";
                  const meetingLink = meeting.link || (meeting.location?.startsWith("http") ? meeting.location : "");

                  return (
                    <tr key={meeting._id} className="cm-table-row">
                      {/* Client info */}
                      <td>
                        <div className="cm-client-cell">
                          <div className="cm-client-avatar">
                            {getClientInitials(clientName)}
                          </div>
                          <div className="cm-client-meta">
                            <span className="cm-client-name">{clientName}</span>
                            <span className="cm-client-company">{company}</span>
                            {(email || phone) && (
                              <span className="cm-client-contact">
                                {email || phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Title */}
                      <td>
                        <div className="cm-title-cell">
                          <span className="cm-meeting-title-text">
                            {meeting.title || "Client Discussion"}
                          </span>
                          {meeting.description && (
                            <span className="cm-meeting-agenda">
                              {meeting.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Meeting Type */}
                      <td>
                        <span
                          className={`cm-type-badge cm-type-${(
                            meeting.meetingType || "online"
                          ).toLowerCase()}`}
                        >
                          {meeting.meetingType || "Online"}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td>
                        <div className="cm-datetime-cell">
                          <div className="cm-date-line">
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>{formatDateDisplay(meeting.meetingDate)}</span>
                          </div>
                          <div className="cm-time-line">
                            <svg
                              viewBox="0 0 24 24"
                              width="13"
                              height="13"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>
                              {formatTimeDisplay(meeting.meetingTime)} (
                              {meeting.duration || 30}m)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td>
                        <span
                          className={`cm-priority-pill cm-priority-${(
                            meeting.priority || "normal"
                          ).toLowerCase()}`}
                        >
                          {meeting.priority === "High" && "★ "}
                          {meeting.priority || "Normal"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <select
                          className={`cm-status-select cm-status-${(
                            meeting.status || "scheduled"
                          ).toLowerCase()}`}
                          value={meeting.status || "Scheduled"}
                          onChange={(e) =>
                            handleStatusChange(meeting._id, e.target.value)
                          }
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Rescheduled">Rescheduled</option>
                        </select>
                      </td>

                      {/* Meeting Link */}
                      <td>
                        {meetingLink ? (
                          <a
                            href={meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cm-link-btn"
                            title={meetingLink}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span>Join</span>
                          </a>
                        ) : (
                          <span className="cm-no-link">
                            {meeting.location || "Online"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="cm-td-actions">
                        <button
                          type="button"
                          className="cm-action-icon-btn cm-btn-edit"
                          onClick={() => openEditMeetingModal(meeting)}
                          title="Edit Meeting"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="cm-action-icon-btn cm-btn-delete"
                          onClick={() =>
                            handleDeleteMeeting(meeting._id, meeting.title)
                          }
                          title="Delete Meeting"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="cm-grid-cards">
          {filteredMeetings.map((meeting) => {
            const clientName =
              meeting.clientName || meeting.clientId?.client || "Client";
            const company =
              meeting.company || meeting.clientId?.company || "Company";
            const email = meeting.email || meeting.clientId?.email || "";
            const phone = meeting.phone || meeting.clientId?.phone || "";
            const meetingLink = meeting.link || (meeting.location?.startsWith("http") ? meeting.location : "");

            return (
              <div key={meeting._id} className="cm-card-item">
                <div className="cm-card-top">
                  <div className="cm-card-client-avatar">
                    {getClientInitials(clientName)}
                  </div>
                  <div className="cm-card-client-info">
                    <h4 className="cm-card-client-name">{clientName}</h4>
                    <p className="cm-card-company">{company}</p>
                  </div>
                  <span
                    className={`cm-priority-pill cm-priority-${(
                      meeting.priority || "normal"
                    ).toLowerCase()}`}
                  >
                    {meeting.priority || "Normal"}
                  </span>
                </div>

                <div className="cm-card-title-section">
                  <h5 className="cm-card-meeting-title">
                    {meeting.title || "Client Meeting"}
                  </h5>
                  {meeting.description && (
                    <p className="cm-card-desc">{meeting.description}</p>
                  )}
                </div>

                <div className="cm-card-pills-row">
                  <span
                    className={`cm-type-badge cm-type-${(
                      meeting.meetingType || "online"
                    ).toLowerCase()}`}
                  >
                    {meeting.meetingType || "Online"}
                  </span>

                  <span
                    className={`cm-status-tag cm-status-${(
                      meeting.status || "scheduled"
                    ).toLowerCase()}`}
                  >
                    {meeting.status || "Scheduled"}
                  </span>
                </div>

                <div className="cm-card-details-list">
                  <div className="cm-detail-row">
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{formatDateDisplay(meeting.meetingDate)}</span>
                  </div>

                  <div className="cm-detail-row">
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>
                      {formatTimeDisplay(meeting.meetingTime)} (
                      {meeting.duration || 30} mins)
                    </span>
                  </div>

                  {(email || phone) && (
                    <div className="cm-detail-row">
                      <svg
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="2"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span className="cm-detail-truncate">{email || phone}</span>
                    </div>
                  )}
                </div>

                <div className="cm-card-footer">
                  {meetingLink ? (
                    <a
                      href={meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cm-card-join-btn"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <span>Join Meeting</span>
                    </a>
                  ) : (
                    <span className="cm-card-location-label">
                      📍 {meeting.location || "Online"}
                    </span>
                  )}

                  <div className="cm-card-actions">
                    <button
                      type="button"
                      className="cm-action-icon-btn cm-btn-edit"
                      onClick={() => openEditMeetingModal(meeting)}
                      title="Edit Meeting"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="cm-action-icon-btn cm-btn-delete"
                      onClick={() =>
                        handleDeleteMeeting(meeting._id, meeting.title)
                      }
                      title="Delete Meeting"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. MODAL: SCHEDULE / EDIT MEETING */}
      {showModal && (
        <div className="cm-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="cm-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="cm-modal-header">
              <div className="cm-modal-header-left">
                <div className="cm-modal-badge">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3 className="cm-modal-title">
                    {selectedMeeting
                      ? "Edit Client Meeting"
                      : "Schedule New Client Meeting"}
                  </h3>
                  <p className="cm-modal-subtitle">
                    Enter meeting details, date, time and joining link
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cm-modal-close-btn"
                onClick={() => setShowModal(false)}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMeeting} className="cm-modal-form">
              {/* Client Selection vs Manual Entry */}
              {clients.length > 0 && !selectedMeeting && (
                <div className="cm-form-group">
                  <div className="cm-form-row-header">
                    <label className="cm-form-label">Client Selection</label>
                    <button
                      type="button"
                      className="cm-toggle-entry-btn"
                      onClick={() =>
                        setClientMode(clientMode === "select" ? "custom" : "select")
                      }
                    >
                      {clientMode === "select"
                        ? "✍ Enter Manually"
                        : "📋 Choose Existing Client"}
                    </button>
                  </div>

                  {clientMode === "select" ? (
                    <select
                      className="cm-form-select"
                      value={form.clientId}
                      onChange={handleClientSelect}
                    >
                      <option value="">-- Choose a registered client --</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.client || c.clientName} ({c.company || "Direct"})
                        </option>
                      ))}
                      <option value="__new__">+ New / Unlisted Client</option>
                    </select>
                  ) : null}
                </div>
              )}

              {/* Client Details Row */}
              <div className="cm-form-grid-2">
                <div className="cm-form-group">
                  <label className="cm-form-label required">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={form.clientName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className={`cm-form-input ${
                      formErrors.clientName ? "has-error" : ""
                    }`}
                  />
                  {formErrors.clientName && (
                    <span className="cm-error-text">
                      {formErrors.clientName}
                    </span>
                  )}
                </div>

                <div className="cm-form-group">
                  <label className="cm-form-label">Company Name</label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleInputChange}
                    placeholder="e.g. Nexus Corp Pvt Ltd"
                    className="cm-form-input"
                  />
                </div>
              </div>

              {/* Email & Phone Row */}
              <div className="cm-form-grid-2">
                <div className="cm-form-group">
                  <label className="cm-form-label">Client Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="client@company.com"
                    className="cm-form-input"
                  />
                </div>

                <div className="cm-form-group">
                  <label className="cm-form-label">Phone / WhatsApp</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="cm-form-input"
                  />
                </div>
              </div>

              {/* Meeting Title */}
              <div className="cm-form-group">
                <label className="cm-form-label required">Meeting Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Product Demo & Technical Discussion"
                  className={`cm-form-input ${
                    formErrors.title ? "has-error" : ""
                  }`}
                />
                {formErrors.title && (
                  <span className="cm-error-text">{formErrors.title}</span>
                )}
              </div>

              {/* Type & Priority Row */}
              <div className="cm-form-grid-2">
                <div className="cm-form-group">
                  <label className="cm-form-label">Meeting Type</label>
                  <select
                    name="meetingType"
                    value={form.meetingType}
                    onChange={handleInputChange}
                    className="cm-form-select"
                  >
                    <option value="Online">Online</option>
                    <option value="Demo">Demo</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Sales">Sales</option>
                    <option value="Review">Review</option>
                    <option value="Support">Support</option>
                    <option value="Onboarding">Onboarding</option>
                  </select>
                </div>

                <div className="cm-form-group">
                  <label className="cm-form-label">Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleInputChange}
                    className="cm-form-select"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Date, Time & Duration */}
              <div className="cm-form-grid-3">
                <div className="cm-form-group">
                  <label className="cm-form-label required">Date</label>
                  <input
                    type="date"
                    name="meetingDate"
                    value={form.meetingDate}
                    onChange={handleInputChange}
                    className={`cm-form-input ${
                      formErrors.meetingDate ? "has-error" : ""
                    }`}
                  />
                  {formErrors.meetingDate && (
                    <span className="cm-error-text">
                      {formErrors.meetingDate}
                    </span>
                  )}
                </div>

                <div className="cm-form-group">
                  <label className="cm-form-label required">Time</label>
                  <input
                    type="time"
                    name="meetingTime"
                    value={form.meetingTime}
                    onChange={handleInputChange}
                    className={`cm-form-input ${
                      formErrors.meetingTime ? "has-error" : ""
                    }`}
                  />
                  {formErrors.meetingTime && (
                    <span className="cm-error-text">
                      {formErrors.meetingTime}
                    </span>
                  )}
                </div>

                <div className="cm-form-group">
                  <label className="cm-form-label">Duration</label>
                  <select
                    name="duration"
                    value={form.duration}
                    onChange={handleInputChange}
                    className="cm-form-select"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>

              {/* Location & Meeting Link */}
              <div className="cm-form-grid-2">
                <div className="cm-form-group">
                  <label className="cm-form-label">Location / Platform</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Google Meet, Zoom, Office"
                    className="cm-form-input"
                  />
                </div>

                <div className="cm-form-group">
                  <label className="cm-form-label">Join Link (URL)</label>
                  <input
                    type="url"
                    name="link"
                    value={form.link}
                    onChange={handleInputChange}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    className="cm-form-input"
                  />
                </div>
              </div>

              {/* Status & Follow-up (Edit Mode or Scheduling) */}
              <div className="cm-form-grid-2">
                <div className="cm-form-group">
                  <label className="cm-form-label">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="cm-form-select"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </div>

                <div className="cm-form-group">
                  <label className="cm-form-label">Follow-up Required?</label>
                  <select
                    name="followUpRequired"
                    value={form.followUpRequired}
                    onChange={handleInputChange}
                    className="cm-form-select"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Description / Agenda */}
              <div className="cm-form-group">
                <label className="cm-form-label">Agenda / Notes</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Meeting agenda, discussion points, or preparation notes..."
                  rows="3"
                  className="cm-form-textarea"
                />
              </div>

              {/* Modal Footer */}
              <div className="cm-modal-footer">
                <button
                  type="button"
                  className="cm-btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cm-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : selectedMeeting ? (
                    <span>Update Meeting</span>
                  ) : (
                    <span>Schedule Meeting</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
