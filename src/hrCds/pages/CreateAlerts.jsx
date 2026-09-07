import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "../../utils/axiosConfig";
import CIISLoader from "../../Loader/CIISLoader";
import Swal from "sweetalert2";
import "../Css/CreateAlerts.css";

import {
  FiBell,
  FiInfo,
  FiAlertTriangle,
  FiAlertCircle,
  FiSearch,
  FiEye,
  FiUser,
  FiUsers,
  FiFilter,
  FiCalendar,
  FiMoreVertical,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiX,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    "Content-Type": "application/json",
  },
});

const getUserId = () => {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return String(
        parsed._id ||
          parsed.id ||
          parsed.user?._id ||
          parsed.user?.id ||
          localStorage.getItem("userId") ||
          ""
      );
    }
  } catch (err) {
    console.error("Error reading userId:", err);
  }
  return localStorage.getItem("userId") || "";
};

const formatAlertDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";

  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hourStr = String(hours).padStart(2, "0");

  return `${month} ${day}, ${year}, ${hourStr}:${minutes} ${ampm}`;
};

const getAlertTitle = (alert) => {
  if (alert?.title && String(alert.title).trim()) {
    return String(alert.title).trim();
  }
  const msg = String(alert?.message || "").trim();
  if (!msg) return "Alert Notification";
  const firstLine = msg.split(/\r?\n|[.!?]\s+/)[0].trim();
  if (firstLine.length > 0 && firstLine.length <= 45) {
    return firstLine.replace(/[.:]+$/, "");
  }
  return msg.slice(0, 40) + "...";
};

const getUserAssignmentInfo = (alert) => {
  const users = alert.assignedUsers || [];
  if (!users || users.length === 0) {
    return {
      text: "All Users",
      isAll: true,
      count: 0,
    };
  }
  if (users.length === 1) {
    return {
      text: "1 User",
      isAll: false,
      count: 1,
    };
  }
  return {
    text: `${users.length} Users`,
    isAll: false,
    count: users.length,
  };
};

const CreateAlert = () => {
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'assigned' | 'unread'
  const [filterType, setFilterType] = useState("all"); // 'all' | 'info' | 'warning' | 'error'
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest'
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals & Active card menu
  const [activeMenuAlertId, setActiveMenuAlertId] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    type: "info",
    message: "",
    targetType: "all", // 'all' | 'specific'
    assignedUsers: [],
    assignedGroups: [],
  });
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const dropdownRef = useRef(null);
  const sortRef = useRef(null);

  // Show Toast
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("/users/company-users", getHeaders());
      let list = [];
      if (res.data) {
        if (Array.isArray(res.data.message)) list = res.data.message;
        else if (Array.isArray(res.data.message?.users)) list = res.data.message.users;
        else if (Array.isArray(res.data.message?.data)) list = res.data.message.data;
        else if (Array.isArray(res.data.message?.employees)) list = res.data.message.employees;
        else if (Array.isArray(res.data.users)) list = res.data.users;
        else if (Array.isArray(res.data.data)) list = res.data.data;
        else if (Array.isArray(res.data)) list = res.data;
      }
      setUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  }, []);

  // Fetch Groups
  const fetchGroups = useCallback(async () => {
    try {
      const res = await axios.get("/groups", getHeaders());
      let list = [];
      if (res.data) {
        if (Array.isArray(res.data.groups)) list = res.data.groups;
        else if (Array.isArray(res.data.data)) list = res.data.data;
        else if (Array.isArray(res.data)) list = res.data;
      }
      setGroups(list);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setGroups([]);
    }
  }, []);

  // Fetch Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await axios.get("/alerts", getHeaders());
      let list = [];
      if (res.data) {
        if (Array.isArray(res.data.alerts)) list = res.data.alerts;
        else if (Array.isArray(res.data.data)) list = res.data.data;
        else if (Array.isArray(res.data.message)) list = res.data.message;
        else if (Array.isArray(res.data)) list = res.data;
      }
      setAlerts(list);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setAlerts([]);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      await Promise.all([fetchUsers(), fetchGroups(), fetchAlerts()]);
      setPageLoading(false);
    };
    init();
  }, [fetchUsers, fetchGroups, fetchAlerts]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchGroups(), fetchAlerts()]);
    setRefreshing(false);
    showToast("Alerts refreshed successfully", "success");
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setFilterDropdownOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
      if (!e.target.closest(".cam-card-menu-btn") && !e.target.closest(".cam-card-dropdown")) {
        setActiveMenuAlertId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isFormOpen || Boolean(selectedAlert);
    if (!isAnyModalOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const mainEl = document.querySelector("main");
    const originalMainOverflow = mainEl ? mainEl.style.overflow : "";

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (mainEl) {
      mainEl.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      if (mainEl) {
        mainEl.style.overflow = originalMainOverflow;
      }
    };
  }, [isFormOpen, selectedAlert]);

  // Current User ID
  const currentUserId = useMemo(() => getUserId(), []);

  // Check if alert is read by current user
  const isAlertRead = useCallback(
    (alert) => {
      if (!alert) return true;
      const readList = alert.readBy || [];
      return readList.some((u) => String(u?._id || u?.id || u) === currentUserId);
    },
    [currentUserId]
  );

  // Statistics calculation
  const stats = useMemo(() => {
    const total = alerts.length;
    const info = alerts.filter(
      (a) => (a.type || "info").toLowerCase() === "info" || (a.type || "").toLowerCase() === "information"
    ).length;
    const warning = alerts.filter((a) => (a.type || "").toLowerCase() === "warning").length;
    const error = alerts.filter((a) => (a.type || "").toLowerCase() === "error").length;

    const unread = alerts.filter((a) => !isAlertRead(a)).length;

    return {
      total,
      info,
      warning,
      error,
      unread,
      infoPct: total ? Math.round((info / total) * 100) : 0,
      warningPct: total ? Math.round((warning / total) * 100) : 0,
      errorPct: total ? Math.round((error / total) * 100) : 0,
    };
  }, [alerts, isAlertRead]);

  // Filtering alerts
  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    // Tab filter
    if (activeTab === "assigned") {
      result = result.filter((a) => {
        const assigned = a.assignedUsers || [];
        return assigned.some((u) => String(u?._id || u?.id || u) === currentUserId);
      });
    } else if (activeTab === "unread") {
      result = result.filter((a) => !isAlertRead(a));
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter((a) => {
        const t = (a.type || "info").toLowerCase();
        if (filterType === "info") return t === "info" || t === "information";
        return t === filterType.toLowerCase();
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const title = (a.title || "").toLowerCase();
        const msg = (a.message || "").toLowerCase();
        const type = (a.type || "").toLowerCase();
        return title.includes(q) || msg.includes(q) || type.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [alerts, activeTab, filterType, searchQuery, sortBy, isAlertRead, currentUserId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterType, searchQuery, sortBy]);

  // Pagination calculation
  const totalAlertsCount = filteredAlerts.length;
  const totalPages = Math.ceil(totalAlertsCount / itemsPerPage) || 1;
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAlerts.slice(start, start + itemsPerPage);
  }, [filteredAlerts, currentPage, itemsPerPage]);

  const startIndex = totalAlertsCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalAlertsCount);

  // User resolution map
  const usersMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      const id = String(u._id || u.id || "");
      if (id) map.set(id, u);
    });
    return map;
  }, [users]);

  const getUserDisplayName = useCallback(
    (user) => {
      if (!user) return "User";
      if (typeof user === "string") {
        const found = usersMap.get(user);
        if (found) return found.name || found.username || found.fullName || found.email || "User";
        return "User";
      }
      return user.name || user.username || user.fullName || user.email || "User";
    },
    [usersMap]
  );

  // Modal open helpers
  const openCreateModal = () => {
    setEditingAlertId(null);
    setForm({
      title: "",
      type: "info",
      message: "",
      targetType: "all",
      assignedUsers: [],
      assignedGroups: [],
    });
    setUserSearchQuery("");
    setIsFormOpen(true);
  };

  const openEditModal = (alert) => {
    setActiveMenuAlertId(null);
    setEditingAlertId(alert._id || alert.id);
    const assignedUserIds = (alert.assignedUsers || []).map((u) => String(u?._id || u?.id || u));
    const assignedGroupIds = (alert.assignedGroups || []).map((g) => String(g?._id || g?.id || g));

    setForm({
      title: alert.title || "",
      type: (alert.type || "info").toLowerCase() === "information" ? "info" : alert.type || "info",
      message: alert.message || "",
      targetType: assignedUserIds.length > 0 ? "specific" : "all",
      assignedUsers: assignedUserIds,
      assignedGroups: assignedGroupIds,
    });
    setUserSearchQuery("");
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingAlertId(null);
  };

  // User Selection helpers in Form
  const filteredFormUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return users;
    const q = userSearchQuery.toLowerCase();
    return users.filter((u) => {
      const name = (u.name || u.username || u.fullName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || u.userRole || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, userSearchQuery]);

  const handleToggleUser = (userId) => {
    setForm((prev) => {
      const isSelected = prev.assignedUsers.includes(userId);
      return {
        ...prev,
        assignedUsers: isSelected
          ? prev.assignedUsers.filter((id) => id !== userId)
          : [...prev.assignedUsers, userId],
      };
    });
  };

  const handleSelectAllUsers = () => {
    if (form.assignedUsers.length === filteredFormUsers.length) {
      setForm((prev) => ({ ...prev, assignedUsers: [] }));
    } else {
      setForm((prev) => ({
        ...prev,
        assignedUsers: filteredFormUsers.map((u) => String(u._id || u.id)),
      }));
    }
  };

  // Submit Alert (Create or Update)
  const handleSubmitAlert = async (e) => {
    e?.preventDefault();
    if (!form.message.trim()) {
      showToast("Please enter an alert message", "error");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      type: form.type,
      message: form.message.trim(),
      assignedUsers: form.targetType === "all" ? [] : form.assignedUsers,
      assignedGroups: form.targetType === "all" ? [] : form.assignedGroups,
    };

    try {
      if (editingAlertId) {
        await axios.put(`/alerts/${editingAlertId}`, payload, getHeaders());
        showToast("Alert updated successfully!", "success");
      } else {
        try {
          await axios.post("/alerts", payload, getHeaders());
        } catch (postErr) {
          if (postErr.response?.status === 403) {
            await axios.post("/api/alerts", payload, getHeaders());
          } else {
            throw postErr;
          }
        }
        showToast("Alert created successfully!", "success");
      }

      await fetchAlerts();
      closeFormModal();
    } catch (err) {
      console.error("Error saving alert:", err);
      const msg = err.response?.data?.message || "Failed to save alert. Please try again.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Alert
  const handleDeleteAlert = async (alertId) => {
    setActiveMenuAlertId(null);
    const result = await Swal.fire({
      title: "Delete Alert?",
      text: "Are you sure you want to delete this alert? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/alerts/${alertId}`, getHeaders());
        showToast("Alert deleted successfully", "success");
        await fetchAlerts();
      } catch (err) {
        console.error("Error deleting alert:", err);
        showToast(err.response?.data?.message || "Failed to delete alert", "error");
      }
    }
  };

  // Toggle Read / Unread
  const handleToggleRead = async (alert) => {
    setActiveMenuAlertId(null);
    const alertId = alert._id || alert.id;
    const isCurrentlyRead = isAlertRead(alert);
    const endpoint = isCurrentlyRead ? `/alerts/${alertId}/unread` : `/alerts/${alertId}/read`;

    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => {
        if ((a._id || a.id) === alertId) {
          const currentReadBy = (a.readBy || []).map((u) => String(u?._id || u?.id || u));
          const updated = isCurrentlyRead
            ? currentReadBy.filter((id) => id !== currentUserId)
            : [...currentReadBy, currentUserId];
          return { ...a, readBy: updated };
        }
        return a;
      })
    );

    try {
      await axios.patch(endpoint, {}, getHeaders());
      showToast(isCurrentlyRead ? "Marked as unread" : "Marked as read", "success");
    } catch (err) {
      console.error("Error toggling read status:", err);
      // Revert if error
      await fetchAlerts();
    }
  };

  if (pageLoading) {
    return <CIISLoader />;
  }

  const getFilterLabel = () => {
    switch (filterType) {
      case "info":
        return "Information";
      case "warning":
        return "Warnings";
      case "error":
        return "Errors";
      default:
        return "All";
    }
  };

  return (
    <div className="cam-wrapper">
      {/* 1. Header Row */}
      <div className="cam-header">
        <div className="cam-header-left">
          <div className="cam-header-icon-box">
            <FiBell />
          </div>
          <div className="cam-header-text">
            <h1>Alerts Management</h1>
            <p>View and manage all alerts to keep your team informed.</p>
          </div>
        </div>

        <div className="cam-header-actions">
          <button
            className={`cam-icon-btn ${refreshing ? "spinning" : ""}`}
            onClick={handleRefresh}
            title="Refresh alerts"
            disabled={refreshing}
          >
            <FiRefreshCw />
          </button>
          <button className="cam-create-btn" onClick={openCreateModal}>
            <FiPlus />
            <span>Create Alert</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Controls Bar */}
      <div className="cam-controls-bar">
        {/* Search input */}
        <div className="cam-search-box">
          <FiSearch className="cam-search-icon" />
          <input
            type="text"
            className="cam-search-input"
            placeholder="Search alerts by message or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="cam-search-clear" onClick={() => setSearchQuery("")}>
              <FiX />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="cam-filters-group">
          {/* Tab 1: All Alerts */}
          <button
            className={`cam-filter-pill-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <FiEye />
            <span>All Alerts</span>
          </button>

          {/* Tab 2: Assigned to Me */}
          <button
            className={`cam-filter-pill-btn ${activeTab === "assigned" ? "active" : ""}`}
            onClick={() => setActiveTab("assigned")}
          >
            <FiUser />
            <span>Assigned to Me</span>
          </button>

          {/* Tab 3: Unread */}
          <button
            className={`cam-filter-pill-btn ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            <FiBell />
            <span>Unread</span>
            {stats.unread > 0 && <span className="cam-unread-badge">{stats.unread}</span>}
          </button>

          {/* Filter Dropdown: Type */}
          <div className="cam-dropdown-wrapper" ref={dropdownRef}>
            <button
              className={`cam-dropdown-btn ${filterDropdownOpen ? "open" : ""}`}
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
            >
              <FiFilter />
              <span>Filter: {getFilterLabel()}</span>
              <FiChevronDown className="cam-chevron" />
            </button>

            {filterDropdownOpen && (
              <div className="cam-dropdown-menu">
                <button
                  className={`cam-dropdown-item ${filterType === "all" ? "active" : ""}`}
                  onClick={() => {
                    setFilterType("all");
                    setFilterDropdownOpen(false);
                  }}
                >
                  <span>All</span>
                  {filterType === "all" && <FiCheck />}
                </button>
                <button
                  className={`cam-dropdown-item ${filterType === "info" ? "active" : ""}`}
                  onClick={() => {
                    setFilterType("info");
                    setFilterDropdownOpen(false);
                  }}
                >
                  <span>Information</span>
                  {filterType === "info" && <FiCheck />}
                </button>
                <button
                  className={`cam-dropdown-item ${filterType === "warning" ? "active" : ""}`}
                  onClick={() => {
                    setFilterType("warning");
                    setFilterDropdownOpen(false);
                  }}
                >
                  <span>Warnings</span>
                  {filterType === "warning" && <FiCheck />}
                </button>
                <button
                  className={`cam-dropdown-item ${filterType === "error" ? "active" : ""}`}
                  onClick={() => {
                    setFilterType("error");
                    setFilterDropdownOpen(false);
                  }}
                >
                  <span>Errors</span>
                  {filterType === "error" && <FiCheck />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 4 KPI Stat Cards */}
      <div className="cam-stats-grid">
        {/* Total Alerts */}
        <div
          className={`cam-stat-card ${filterType === "all" && activeTab === "all" ? "active" : ""}`}
          onClick={() => {
            setFilterType("all");
            setActiveTab("all");
          }}
        >
          <div className="cam-stat-main">
            <div className="cam-stat-icon-box total">
              <FiBell />
            </div>
            <div className="cam-stat-info">
              <span className="cam-stat-label">Total Alerts</span>
              <span className="cam-stat-value">{stats.total}</span>
              <span className="cam-stat-subtitle">All alerts created</span>
            </div>
          </div>
          <div className="cam-mini-chart">
            <div className="cam-chart-bar total" style={{ height: "30%" }} />
            <div className="cam-chart-bar total" style={{ height: "55%" }} />
            <div className="cam-chart-bar total" style={{ height: "75%" }} />
            <div className="cam-chart-bar total" style={{ height: "100%" }} />
          </div>
        </div>

        {/* Information */}
        <div
          className={`cam-stat-card ${filterType === "info" ? "active" : ""}`}
          onClick={() => {
            setFilterType("info");
            setActiveTab("all");
          }}
        >
          <div className="cam-stat-main">
            <div className="cam-stat-icon-box info">
              <FiInfo />
            </div>
            <div className="cam-stat-info">
              <span className="cam-stat-label">Information</span>
              <span className="cam-stat-value">{stats.info}</span>
              <span className="cam-stat-subtitle">{stats.infoPct}% of total</span>
            </div>
          </div>
          <div className="cam-mini-chart">
            <div className="cam-chart-bar info" style={{ height: "40%" }} />
            <div className="cam-chart-bar info" style={{ height: "65%" }} />
            <div className="cam-chart-bar info" style={{ height: "50%" }} />
            <div className="cam-chart-bar info" style={{ height: "85%" }} />
          </div>
        </div>

        {/* Warnings */}
        <div
          className={`cam-stat-card ${filterType === "warning" ? "active" : ""}`}
          onClick={() => {
            setFilterType("warning");
            setActiveTab("all");
          }}
        >
          <div className="cam-stat-main">
            <div className="cam-stat-icon-box warning">
              <FiAlertTriangle />
            </div>
            <div className="cam-stat-info">
              <span className="cam-stat-label">Warnings</span>
              <span className="cam-stat-value">{stats.warning}</span>
              <span className="cam-stat-subtitle">{stats.warningPct}% of total</span>
            </div>
          </div>
          <div className="cam-mini-chart">
            <div className="cam-chart-bar warning" style={{ height: "35%" }} />
            <div className="cam-chart-bar warning" style={{ height: "50%" }} />
            <div className="cam-chart-bar warning" style={{ height: "70%" }} />
            <div className="cam-chart-bar warning" style={{ height: "90%" }} />
          </div>
        </div>

        {/* Errors */}
        <div
          className={`cam-stat-card ${filterType === "error" ? "active" : ""}`}
          onClick={() => {
            setFilterType("error");
            setActiveTab("all");
          }}
        >
          <div className="cam-stat-main">
            <div className="cam-stat-icon-box error">
              <FiAlertCircle />
            </div>
            <div className="cam-stat-info">
              <span className="cam-stat-label">Errors</span>
              <span className="cam-stat-value">{stats.error}</span>
              <span className="cam-stat-subtitle">{stats.errorPct}% of total</span>
            </div>
          </div>
          <div className="cam-mini-chart">
            <div className="cam-chart-bar error" style={{ height: "30%" }} />
            <div className="cam-chart-bar error" style={{ height: "45%" }} />
            <div className="cam-chart-bar error" style={{ height: "80%" }} />
            <div className="cam-chart-bar error" style={{ height: "100%" }} />
          </div>
        </div>
      </div>

      {/* 4. Section Header: "Recent Alerts" */}
      <div className="cam-section-bar">
        <div className="cam-section-title-group">
          <h2>Recent Alerts</h2>
          <p>Stay updated with the latest alerts and notifications</p>
        </div>

        <div className="cam-section-controls">
          {/* Sort Dropdown */}
          <div className="cam-dropdown-wrapper" ref={sortRef}>
            <button
              className="cam-sort-btn"
              onClick={() => setSortDropdownOpen((prev) => !prev)}
            >
              <span>⇅ Sort by: {sortBy === "newest" ? "Newest" : "Oldest"}</span>
              <FiChevronDown className="cam-chevron" />
            </button>

            {sortDropdownOpen && (
              <div className="cam-dropdown-menu">
                <button
                  className={`cam-dropdown-item ${sortBy === "newest" ? "active" : ""}`}
                  onClick={() => {
                    setSortBy("newest");
                    setSortDropdownOpen(false);
                  }}
                >
                  <span>Newest</span>
                  {sortBy === "newest" && <FiCheck />}
                </button>
                <button
                  className={`cam-dropdown-item ${sortBy === "oldest" ? "active" : ""}`}
                  onClick={() => {
                    setSortBy("oldest");
                    setSortDropdownOpen(false);
                  }}
                >
                  <span>Oldest</span>
                  {sortBy === "oldest" && <FiCheck />}
                </button>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="cam-view-toggle">
            <button
              className={`cam-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <FiGrid />
            </button>
            <button
              className={`cam-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Alerts Grid or List */}
      {paginatedAlerts.length === 0 ? (
        <div className="cam-empty-state">
          <FiBell className="cam-empty-icon" />
          <h3>No Alerts Found</h3>
          <p>There are no alerts matching your selected criteria.</p>
          <button className="cam-create-btn" onClick={openCreateModal}>
            <FiPlus />
            <span>Create Alert</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="cam-alerts-grid">
          {paginatedAlerts.map((alert) => {
            const alertId = alert._id || alert.id;
            const typeLower = (alert.type || "info").toLowerCase();
            const normalizedType =
              typeLower === "error" ? "error" : typeLower === "warning" ? "warning" : "info";
            const userAssignment = getUserAssignmentInfo(alert);
            const isUnread = !isAlertRead(alert);

            return (
              <div
                key={alertId}
                className={`cam-alert-card type-${normalizedType}`}
                onClick={() => setSelectedAlert(alert)}
              >
                {/* Header */}
                <div className="cam-card-header">
                  <div className={`cam-card-badge ${normalizedType}`}>
                    <span className="cam-badge-icon-circle">
                      {normalizedType === "info" && "i"}
                      {normalizedType === "warning" && "!"}
                      {normalizedType === "error" && "!"}
                    </span>
                    <span>
                      {normalizedType === "info"
                        ? "Information"
                        : normalizedType === "warning"
                        ? "Warning"
                        : "Error"}
                    </span>
                  </div>

                  <div className="cam-card-meta">
                    <span className="cam-card-date">
                      <FiCalendar />
                      {formatAlertDate(alert.createdAt)}
                    </span>
                    <button
                      className="cam-card-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuAlertId((prev) => (prev === alertId ? null : alertId));
                      }}
                      title="Actions"
                    >
                      <FiMoreVertical />
                    </button>
                  </div>
                </div>

                {/* 3-Dots Dropdown Menu */}
                {activeMenuAlertId === alertId && (
                  <div
                    className="cam-card-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="cam-card-dropdown-item"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setActiveMenuAlertId(null);
                      }}
                    >
                      <FiEye />
                      <span>View Details</span>
                    </button>
                    <button
                      className="cam-card-dropdown-item"
                      onClick={() => handleToggleRead(alert)}
                    >
                      <FiCheck />
                      <span>{isUnread ? "Mark as Read" : "Mark as Unread"}</span>
                    </button>
                    <button
                      className="cam-card-dropdown-item"
                      onClick={() => openEditModal(alert)}
                    >
                      <FiEdit2 />
                      <span>Edit Alert</span>
                    </button>
                    <button
                      className="cam-card-dropdown-item delete"
                      onClick={() => handleDeleteAlert(alertId)}
                    >
                      <FiTrash2 />
                      <span>Delete Alert</span>
                    </button>
                  </div>
                )}

                {/* Body */}
                <div className="cam-card-body">
                  <h3 className="cam-card-title">{getAlertTitle(alert)}</h3>
                  <p className="cam-card-message">{alert.message}</p>
                </div>

                {/* Footer */}
                <div className="cam-card-footer">
                  <div className="cam-card-user-info">
                    {userAssignment.isAll ? (
                      <>
                        <FiUsers />
                        <span>All Users</span>
                      </>
                    ) : userAssignment.count === 1 ? (
                      <>
                        <FiUser />
                        <span>1 User</span>
                      </>
                    ) : (
                      <>
                        <FiUsers />
                        <span>{userAssignment.count} Users</span>
                      </>
                    )}
                  </div>

                  {isUnread && <span className="cam-card-new-pill">New</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="cam-alerts-list">
          {paginatedAlerts.map((alert) => {
            const alertId = alert._id || alert.id;
            const typeLower = (alert.type || "info").toLowerCase();
            const normalizedType =
              typeLower === "error" ? "error" : typeLower === "warning" ? "warning" : "info";
            const userAssignment = getUserAssignmentInfo(alert);
            const isUnread = !isAlertRead(alert);

            return (
              <div
                key={alertId}
                className={`cam-alert-list-row type-${normalizedType}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="cam-list-main-info">
                  <div className={`cam-card-badge ${normalizedType}`}>
                    <span className="cam-badge-icon-circle">
                      {normalizedType === "info" && "i"}
                      {normalizedType === "warning" && "!"}
                      {normalizedType === "error" && "!"}
                    </span>
                  </div>
                  <div className="cam-list-text-group">
                    <div className="cam-list-title-row">
                      <h4 className="cam-list-card-title">{getAlertTitle(alert)}</h4>
                      {isUnread && <span className="cam-card-new-pill">New</span>}
                    </div>
                    <p className="cam-list-card-msg">{alert.message}</p>
                  </div>
                </div>

                <div className="cam-list-meta-group">
                  <div className="cam-card-user-info">
                    {userAssignment.isAll ? (
                      <>
                        <FiUsers />
                        <span>All Users</span>
                      </>
                    ) : (
                      <>
                        <FiUser />
                        <span>{userAssignment.text}</span>
                      </>
                    )}
                  </div>
                  <span className="cam-card-date">
                    <FiCalendar />
                    {formatAlertDate(alert.createdAt)}
                  </span>
                  <button
                    className="cam-card-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuAlertId((prev) => (prev === alertId ? null : alertId));
                    }}
                  >
                    <FiMoreVertical />
                  </button>
                </div>

                {activeMenuAlertId === alertId && (
                  <div
                    className="cam-card-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="cam-card-dropdown-item"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setActiveMenuAlertId(null);
                      }}
                    >
                      <FiEye />
                      <span>View Details</span>
                    </button>
                    <button
                      className="cam-card-dropdown-item"
                      onClick={() => handleToggleRead(alert)}
                    >
                      <FiCheck />
                      <span>{isUnread ? "Mark as Read" : "Mark as Unread"}</span>
                    </button>
                    <button
                      className="cam-card-dropdown-item"
                      onClick={() => openEditModal(alert)}
                    >
                      <FiEdit2 />
                      <span>Edit Alert</span>
                    </button>
                    <button
                      className="cam-card-dropdown-item delete"
                      onClick={() => handleDeleteAlert(alertId)}
                    >
                      <FiTrash2 />
                      <span>Delete Alert</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Row */}
      {totalAlertsCount > 0 && (
        <div className="cam-pagination-bar">
          <span className="cam-pagination-info">
            Showing {startIndex} to {endIndex} of {totalAlertsCount} alerts
          </span>

          <div className="cam-pagination-controls">
            <button
              className="cam-page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Previous page"
            >
              <FiChevronLeft />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`cam-page-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="cam-page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Next page"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* 7. Create / Edit Alert Modal */}
      {isFormOpen &&
        createPortal(
          <div className="cam-modal-overlay" onClick={closeFormModal}>
          <div className="cam-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cam-modal-header">
              <h2>{editingAlertId ? "Edit Alert" : "Create New Alert"}</h2>
              <button className="cam-modal-close-btn" onClick={closeFormModal}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitAlert}>
              <div className="cam-modal-body">
                {/* Title */}
                <div className="cam-form-group">
                  <label className="cam-form-label">Alert Title</label>
                  <input
                    type="text"
                    className="cam-form-input"
                    placeholder="e.g. Server Maintenance, Team Meeting..."
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {/* Alert Type */}
                <div className="cam-form-group">
                  <label className="cam-form-label">Alert Type</label>
                  <div className="cam-type-selector-grid">
                    <div
                      className={`cam-type-card-option info ${form.type === "info" ? "selected" : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, type: "info" }))}
                    >
                      <FiInfo className="cam-type-card-icon" />
                      <span className="cam-type-card-label">Information</span>
                    </div>

                    <div
                      className={`cam-type-card-option warning ${form.type === "warning" ? "selected" : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, type: "warning" }))}
                    >
                      <FiAlertTriangle className="cam-type-card-icon" />
                      <span className="cam-type-card-label">Warning</span>
                    </div>

                    <div
                      className={`cam-type-card-option error ${form.type === "error" ? "selected" : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, type: "error" }))}
                    >
                      <FiAlertCircle className="cam-type-card-icon" />
                      <span className="cam-type-card-label">Error</span>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="cam-form-group">
                  <label className="cam-form-label">
                    <span>
                      Alert Message <span className="cam-required">*</span>
                    </span>
                  </label>
                  <textarea
                    className="cam-form-textarea"
                    placeholder="Enter your alert message here..."
                    value={form.message}
                    maxLength={500}
                    rows={4}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  />
                  <div className="cam-char-counter">{form.message.length} / 500</div>
                </div>

                {/* Target Audience */}
                <div className="cam-form-group">
                  <label className="cam-form-label">Target Audience</label>
                  <div className="cam-audience-toggle">
                    <button
                      type="button"
                      className={`cam-audience-btn ${form.targetType === "all" ? "active" : ""}`}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, targetType: "all", assignedUsers: [] }))
                      }
                    >
                      <FiUsers />
                      <span>All Users (Broadcast)</span>
                    </button>
                    <button
                      type="button"
                      className={`cam-audience-btn ${form.targetType === "specific" ? "active" : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, targetType: "specific" }))}
                    >
                      <FiUser />
                      <span>Specific Users</span>
                    </button>
                  </div>

                  {form.targetType === "specific" && (
                    <div className="cam-user-picker-box">
                      {/* Selected user chips */}
                      {form.assignedUsers.length > 0 && (
                        <div className="cam-user-chips-row">
                          {form.assignedUsers.map((userId) => (
                            <span key={userId} className="cam-user-chip">
                              <span>{getUserDisplayName(userId)}</span>
                              <button
                                type="button"
                                className="cam-chip-remove-btn"
                                onClick={() => handleToggleUser(userId)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Search & select all */}
                      <div className="cam-user-search-header">
                        <input
                          type="text"
                          className="cam-form-input"
                          placeholder="Search users..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          style={{ flex: 1, height: "36px" }}
                        />
                        <button
                          type="button"
                          className="cam-select-all-btn"
                          onClick={handleSelectAllUsers}
                        >
                          {form.assignedUsers.length === filteredFormUsers.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>

                      {/* User List */}
                      <div className="cam-user-list-scroll">
                        {filteredFormUsers.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            No users found
                          </div>
                        ) : (
                          filteredFormUsers.map((u) => {
                            const uId = String(u._id || u.id);
                            const isSelected = form.assignedUsers.includes(uId);
                            const name = getUserDisplayName(u);
                            const initial = name.charAt(0).toUpperCase() || "U";

                            return (
                              <div
                                key={uId}
                                className={`cam-user-list-item ${isSelected ? "selected" : ""}`}
                                onClick={() => handleToggleUser(uId)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                />
                                <div className="cam-user-avatar">{initial}</div>
                                <div className="cam-user-text-info">
                                  <span className="cam-user-name">{name}</span>
                                  {u.email && <span className="cam-user-email">{u.email}</span>}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="cam-modal-footer">
                <button
                  type="button"
                  className="cam-btn cam-btn-secondary"
                  onClick={closeFormModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cam-btn cam-btn-primary"
                  disabled={submitting || !form.message.trim()}
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <FiSend />
                      <span>{editingAlertId ? "Update Alert" : "Create Alert"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 8. Alert Details Modal */}
      {selectedAlert &&
        createPortal(
          <div className="cam-modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div
            className="cam-modal detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cam-modal-header">
              <h2>Alert Details</h2>
              <button className="cam-modal-close-btn" onClick={() => setSelectedAlert(null)}>
                <FiX />
              </button>
            </div>

            <div className="cam-modal-body">
              {/* Type & Title */}
              <div className="cam-detail-item">
                <span className="cam-detail-label">Type & Title</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    className={`cam-card-badge ${(selectedAlert.type || "info").toLowerCase()}`}
                  >
                    <span className="cam-badge-icon-circle">
                      {(selectedAlert.type || "info").toLowerCase() === "info"
                        ? "i"
                        : "!"}
                    </span>
                    <span>
                      {(selectedAlert.type || "info").toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                    {getAlertTitle(selectedAlert)}
                  </h3>
                </div>
              </div>

              {/* Message */}
              <div className="cam-detail-item">
                <span className="cam-detail-label">Message</span>
                <div className="cam-detail-message-box">{selectedAlert.message}</div>
              </div>

              {/* Created At & Author */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="cam-detail-item">
                  <span className="cam-detail-label">Date & Time</span>
                  <span className="cam-detail-value">
                    {formatAlertDate(selectedAlert.createdAt)}
                  </span>
                </div>
                <div className="cam-detail-item">
                  <span className="cam-detail-label">Created By</span>
                  <span className="cam-detail-value">
                    {selectedAlert.createdByName ||
                      selectedAlert.createdBy?.name ||
                      "System Admin"}
                  </span>
                </div>
              </div>

              {/* Audience */}
              <div className="cam-detail-item">
                <span className="cam-detail-label">Target Audience</span>
                {(!selectedAlert.assignedUsers || selectedAlert.assignedUsers.length === 0) &&
                (!selectedAlert.assignedGroups || selectedAlert.assignedGroups.length === 0) ? (
                  <span className="cam-detail-value">All Users (Broadcast)</span>
                ) : (
                  <div className="cam-user-chips-row" style={{ marginTop: "4px" }}>
                    {selectedAlert.assignedUsers?.map((u) => {
                      const uId = String(u._id || u.id || u);
                      return (
                        <span key={uId} className="cam-user-chip">
                          <FiUser style={{ fontSize: "11px" }} />
                          <span>{getUserDisplayName(u)}</span>
                        </span>
                      );
                    })}
                    {selectedAlert.assignedGroups?.map((g) => {
                      const gId = String(g._id || g.id || g);
                      const groupObj = groups.find((grp) => String(grp._id || grp.id) === gId);
                      const gName = groupObj?.name || g.name || "Group";
                      return (
                        <span key={gId} className="cam-user-chip">
                          <FiUsers style={{ fontSize: "11px" }} />
                          <span>{gName}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Read Status */}
              <div className="cam-detail-item">
                <span className="cam-detail-label">Status</span>
                <span className="cam-detail-value">
                  {isAlertRead(selectedAlert) ? "✓ Read by you" : "● Unread"} (Read by{" "}
                  {selectedAlert.readBy?.length || 0} users)
                </span>
              </div>
            </div>

            <div className="cam-modal-footer">
              <button
                type="button"
                className="cam-btn cam-btn-secondary"
                onClick={() => handleToggleRead(selectedAlert)}
              >
                <FiCheck />
                <span>
                  {isAlertRead(selectedAlert) ? "Mark as Unread" : "Mark as Read"}
                </span>
              </button>

              <button
                type="button"
                className="cam-btn cam-btn-secondary"
                onClick={() => {
                  const alertToEdit = selectedAlert;
                  setSelectedAlert(null);
                  openEditModal(alertToEdit);
                }}
              >
                <FiEdit2 />
                <span>Edit</span>
              </button>

              <button
                type="button"
                className="cam-btn cam-btn-primary"
                onClick={() => setSelectedAlert(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 9. Floating Toast Notification */}
      {toast &&
        createPortal(
          <div className={`cam-toast ${toast.type}`}>
            {toast.type === "success" ? (
              <FiCheck style={{ color: "#10b981", fontSize: "18px" }} />
            ) : (
              <FiAlertCircle style={{ color: "#ef4444", fontSize: "18px" }} />
            )}
            <span className="cam-toast-text">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                marginLeft: "6px",
                display: "flex",
              }}
            >
              <FiX />
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CreateAlert;
