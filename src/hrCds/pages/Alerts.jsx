import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "../../utils/axiosConfig";
import CIISLoader from "../../Loader/CIISLoader";
import "../Css/Alerts.css";
import {
  FiBell,
  FiCheckCircle,
  FiMail,
  FiCalendar,
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiFileText,
  FiUsers,
  FiUser,
  FiSettings,
  FiUserCheck,
  FiClock,
  FiAlertTriangle,
  FiPaperclip,
  FiDownload,
  FiCheck,
  FiX,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiInfo,
} from "react-icons/fi";
import { MdCampaign } from "react-icons/md";
import { FaFilePdf } from "react-icons/fa";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const asArray = (val) => (Array.isArray(val) ? val : []);

const getApiList = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// Categorize alert based on type / title / message to display dedicated icon & colors
const getAlertCategoryMeta = (alert) => {
  const type = String(alert?.type || "").toLowerCase();
  const text = `${alert?.title || ""} ${alert?.message || ""}`.toLowerCase();

  if (
    type === "announcement" ||
    type === "holiday" ||
    text.includes("holiday") ||
    text.includes("remain closed") ||
    text.includes("office closed") ||
    text.includes("announcement")
  ) {
    return {
      category: "announcement",
      label: "Announcement",
      icon: <MdCampaign className="Alerts-cat-icon-svg" />,
      bg: "#eff6ff",
      color: "#2563eb",
    };
  }

  if (
    type === "report" ||
    text.includes("report") ||
    text.includes("monthly") ||
    text.includes("submit")
  ) {
    return {
      category: "report",
      label: "Report",
      icon: <FiFileText className="Alerts-cat-icon-svg" />,
      bg: "#fef3c7",
      color: "#d97706",
    };
  }

  if (
    type === "policy" ||
    text.includes("policy") ||
    text.includes("hr policy") ||
    text.includes("guidelines")
  ) {
    return {
      category: "policy",
      label: "Policy",
      icon: <FiUsers className="Alerts-cat-icon-svg" />,
      bg: "#f3e8ff",
      color: "#9333ea",
    };
  }

  if (
    type === "meeting" ||
    text.includes("meeting") ||
    text.includes("rescheduled") ||
    text.includes("call")
  ) {
    return {
      category: "meeting",
      label: "Meeting",
      icon: <FiCalendar className="Alerts-cat-icon-svg" />,
      bg: "#dcfce7",
      color: "#16a34a",
    };
  }

  if (
    type === "maintenance" ||
    type === "error" ||
    text.includes("maintenance") ||
    text.includes("system") ||
    text.includes("server")
  ) {
    return {
      category: "maintenance",
      label: "Maintenance",
      icon: <FiSettings className="Alerts-cat-icon-svg" />,
      bg: "#fee2e2",
      color: "#ef4444",
    };
  }

  if (
    text.includes("onboard") ||
    text.includes("employee") ||
    text.includes("joining") ||
    text.includes("welcome")
  ) {
    return {
      category: "onboarding",
      label: "Onboarding",
      icon: <FiUserCheck className="Alerts-cat-icon-svg" />,
      bg: "#e0f2fe",
      color: "#0284c7",
    };
  }

  if (
    text.includes("attendance") ||
    text.includes("clock") ||
    text.includes("late") ||
    type === "attendance"
  ) {
    return {
      category: "attendance",
      label: "Attendance",
      icon: <FiAlertTriangle className="Alerts-cat-icon-svg" />,
      bg: "#fef3c7",
      color: "#d97706",
    };
  }

  if (type === "warning") {
    return {
      category: "warning",
      label: "Warning",
      icon: <FiAlertTriangle className="Alerts-cat-icon-svg" />,
      bg: "#fef3c7",
      color: "#d97706",
    };
  }

  return {
    category: "general",
    label: "Notice",
    icon: <FiFileText className="Alerts-cat-icon-svg" />,
    bg: "#ede9fe",
    color: "#7c3aed",
  };
};

const getAlertTitle = (alert) => {
  if (alert?.title && String(alert.title).trim()) {
    return String(alert.title).trim();
  }
  const msg = String(alert?.message || "").trim();
  if (!msg) return "Alert Notification";
  const firstLine = msg.split(/\r?\n|\. /)[0].trim();
  if (firstLine.length > 0 && firstLine.length <= 55) {
    return firstLine.replace(/[.:]+$/, "");
  }
  return msg.slice(0, 48) + "...";
};

const formatListDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDetailDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";

  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
};

const getAlertAuthor = (alert) => {
  if (!alert) return "Admin";
  if (typeof alert.createdBy === "object" && alert.createdBy?.name) {
    return alert.createdBy.name;
  }
  if (alert.createdByName && typeof alert.createdByName === "string") {
    return alert.createdByName;
  }
  if (alert.authorName) {
    return alert.authorName;
  }
  if (typeof alert.createdBy === "string" && alert.createdBy.trim()) {
    if (!/^[0-9a-fA-F]{24}$/.test(alert.createdBy)) {
      return alert.createdBy;
    }
  }
  return "HR Admin";
};

const getAlertAuthorRole = (alert) => {
  if (!alert) return "";
  if (typeof alert.createdBy === "object" && alert.createdBy?.role) {
    return alert.createdBy.role;
  }
  return "";
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userGroupIds, setUserGroupIds] = useState([]);
  const [role, setRole] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Selection & UI Filters
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'read'
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest"); // 'latest' | 'oldest'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Management Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    type: "announcement",
    message: "",
    assignedUsers: [],
    assignedGroups: [],
    attachmentName: "",
    attachmentSize: "",
  });
  const [formError, setFormError] = useState("");
  const [savingAlert, setSavingAlert] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const initialLoadRef = useRef(false);

  const canManage = [
    "admin",
    "hr",
    "manager",
    "owner",
    "super_admin",
    "superadmin",
    "company_owner",
    "companyowner",
  ].includes(String(role || "").toLowerCase().replace(/[\s-]+/g, "_"));

  const getUserId = useCallback(() => {
    const storedUser = currentUser || JSON.parse(localStorage.getItem("user") || "null");
    return String(
      storedUser?._id ||
        storedUser?.id ||
        storedUser?.user?._id ||
        storedUser?.user?.id ||
        localStorage.getItem("userId") ||
        ""
    );
  }, [currentUser]);

  const currentUserId = getUserId();

  const getUserGroups = async (userId) => {
    if (!userId) return [];
    try {
      const response = await axios.get(`/users/${userId}/groups`, getHeaders());
      const list = getApiList(response.data, ["groups"]);
      const ids = list.map((g) => String(g?._id || g?.id || g)).filter(Boolean);
      setUserGroupIds(ids);
      localStorage.setItem("userGroups", JSON.stringify(ids));
      return ids;
    } catch {
      try {
        const stored = JSON.parse(localStorage.getItem("userGroups") || "[]");
        const ids = asArray(stored).map((g) => String(g?._id || g?.id || g)).filter(Boolean);
        setUserGroupIds(ids);
        return ids;
      } catch {
        setUserGroupIds([]);
      }
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/users/company-users", getHeaders());
      const list = getApiList(res.data, ["users"]);
      setUsers(list);
    } catch {
      setUsers([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get("/groups", getHeaders());
      const list = getApiList(res.data, ["groups"]);
      setGroups(list);
    } catch {
      setGroups([]);
    }
  };

  const fetchAlerts = async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await axios.get("/alerts", getHeaders());
      const list = getApiList(res.data, ["alerts"]);
      setAlerts(list);
      return list;
    } catch (err) {
      if (!silent) {
        setNotification({
          type: "error",
          message: err.response?.data?.message || "Failed to load alerts",
        });
      }
      return [];
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const loadData = async () => {
    setPageLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
          const userRole =
            parsed?.companyRole || parsed?.role || parsed?.jobRole || parsed?.userRole || "";
          setRole(String(userRole).toLowerCase().replace(/[\s-]+/g, "_"));
          const userId = parsed?._id || parsed?.id || parsed?.user?._id || parsed?.user?.id || "";
          if (userId) localStorage.setItem("userId", userId);
          await getUserGroups(String(userId || ""));
        } catch {
          setCurrentUser(null);
        }
      }
      await Promise.all([fetchUsers(), fetchGroups(), fetchAlerts({ silent: true })]);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    void loadData();
  }, []);

  // Filter alerts visible to the current user
  const isAlertVisibleToUser = useCallback(
    (alert) => {
      const assignedUsers = asArray(alert?.assignedUsers);
      const assignedGroups = asArray(alert?.assignedGroups);
      if (!assignedUsers.length && !assignedGroups.length) return true;

      const userMatch = assignedUsers.some(
        (u) => String(u?._id || u?.id || u) === currentUserId
      );
      const groupMatch = assignedGroups.some((g) => {
        const gid = String(g?._id || g?.id || g);
        return userGroupIds.includes(gid);
      });
      return userMatch || groupMatch;
    },
    [currentUserId, userGroupIds]
  );

  const visibleAlerts = useMemo(
    () => alerts.filter(isAlertVisibleToUser),
    [alerts, isAlertVisibleToUser]
  );

  const isRead = useCallback(
    (alert) => {
      if (!currentUserId) return false;
      const readBy = asArray(alert?.readBy);
      return readBy.some((entry) => String(entry?._id || entry?.id || entry) === currentUserId);
    },
    [currentUserId]
  );

  // Calculate stats for top metric cards
  const stats = useMemo(() => {
    const total = visibleAlerts.length;
    const readCount = visibleAlerts.filter(isRead).length;
    const unreadCount = total - readCount;
    const readPercentage = total > 0 ? Math.round((readCount / total) * 100) : 0;
    const unreadPercentage = total > 0 ? Math.round((unreadCount / total) * 100) : 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = visibleAlerts.filter((a) => {
      const d = new Date(a.createdAt);
      return !Number.isNaN(d.getTime()) && d >= oneWeekAgo;
    }).length;

    return {
      total,
      read: readCount,
      unread: unreadCount,
      readPercentage,
      unreadPercentage,
      thisWeek,
    };
  }, [visibleAlerts, isRead]);

  // Filter & sort visible alerts
  const filteredAlerts = useMemo(() => {
    let list = [...visibleAlerts];

    // Tab filter
    if (activeTab === "unread") {
      list = list.filter((a) => !isRead(a));
    } else if (activeTab === "read") {
      list = list.filter(isRead);
    }

    // Category dropdown filter
    if (filterCategory !== "all") {
      list = list.filter((a) => {
        const meta = getAlertCategoryMeta(a);
        return meta.category === filterCategory || String(a.type).toLowerCase() === filterCategory;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => {
        const title = getAlertTitle(a).toLowerCase();
        const msg = String(a?.message || "").toLowerCase();
        const cat = getAlertCategoryMeta(a).label.toLowerCase();
        return title.includes(q) || msg.includes(q) || cat.includes(q);
      });
    }

    // Sorting
    list.sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0).getTime();
      const dateB = new Date(b?.createdAt || 0).getTime();
      return sortBy === "oldest" ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [visibleAlerts, activeTab, filterCategory, searchQuery, sortBy, isRead]);

  // Selected alert object
  const selectedAlert = useMemo(() => {
    if (!filteredAlerts.length) return null;
    if (selectedAlertId) {
      const match = filteredAlerts.find((a) => String(a._id) === String(selectedAlertId));
      if (match) return match;
    }
    return filteredAlerts[0] || null;
  }, [filteredAlerts, selectedAlertId]);

  // Sync selected alert id when filtered list changes
  useEffect(() => {
    if (filteredAlerts.length > 0) {
      const exists = filteredAlerts.some((a) => String(a._id) === String(selectedAlertId));
      if (!exists) {
        setSelectedAlertId(filteredAlerts[0]._id);
      }
    } else {
      setSelectedAlertId(null);
    }
  }, [filteredAlerts, selectedAlertId]);

  // Reset to page 1 on filter/tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterCategory, searchQuery, sortBy]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / itemsPerPage));
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAlerts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAlerts, currentPage, itemsPerPage]);

  const startRecordNum = filteredAlerts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecordNum = Math.min(currentPage * itemsPerPage, filteredAlerts.length);

  // Toggle Read / Unread Status
  const handleToggleRead = async (alert) => {
    if (!alert || actionLoading) return;
    const alertId = alert._id;
    const currentlyRead = isRead(alert);
    setActionLoading(true);

    try {
      if (currentlyRead) {
        // Mark as unread
        await axios.patch(`/alerts/${alertId}/unread`, {}, getHeaders()).catch(() => {});
        setAlerts((prev) =>
          prev.map((a) => {
            if (String(a._id) !== String(alertId)) return a;
            return {
              ...a,
              readBy: asArray(a.readBy).filter(
                (entry) => String(entry?._id || entry?.id || entry) !== currentUserId
              ),
            };
          })
        );
        setNotification({ type: "info", message: "Alert marked as unread." });
      } else {
        // Mark as read
        await axios.patch(`/alerts/${alertId}/read`, {}, getHeaders()).catch(() => {});
        setAlerts((prev) =>
          prev.map((a) => {
            if (String(a._id) !== String(alertId)) return a;
            const readBy = asArray(a.readBy);
            if (readBy.some((entry) => String(entry?._id || entry?.id || entry) === currentUserId)) {
              return a;
            }
            return {
              ...a,
              readBy: [...readBy, { _id: currentUserId }],
            };
          })
        );
        setNotification({ type: "success", message: "Alert marked as read." });
      }

      // Update unread count in localStorage for app-wide badge sync
      const currentCount = parseInt(localStorage.getItem("unreadCount") || "0", 10);
      const nextCount = currentlyRead ? currentCount + 1 : Math.max(0, currentCount - 1);
      localStorage.setItem("unreadCount", String(nextCount));
    } catch {
      setNotification({ type: "error", message: "Failed to update alert status." });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Actions: Create / Edit / Delete
  const openForm = (alert = null) => {
    if (alert) {
      setEditId(alert._id);
      const att = asArray(alert.attachments)[0];
      setForm({
        title: alert.title || "",
        type: alert.type || "announcement",
        message: alert.message || "",
        assignedUsers: asArray(alert.assignedUsers).map((u) => String(u?._id || u?.id || u)),
        assignedGroups: asArray(alert.assignedGroups).map((g) => String(g?._id || g?.id || g)),
        attachmentName: att?.name || "",
        attachmentSize: att?.size || "",
      });
    } else {
      setEditId(null);
      setForm({
        title: "",
        type: "announcement",
        message: "",
        assignedUsers: [],
        assignedGroups: [],
        attachmentName: "",
        attachmentSize: "",
      });
    }
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditId(null);
    setFormError("");
  };

  const saveAlert = async (e) => {
    if (e) e.preventDefault();
    if (!form.message.trim()) {
      setFormError("Alert message is required.");
      return;
    }

    setSavingAlert(true);
    try {
      const attachments = form.attachmentName.trim()
        ? [
            {
              name: form.attachmentName.trim(),
              size: form.attachmentSize.trim() || "245 KB",
              fileType: "pdf",
              url: "#",
            },
          ]
        : [];

      const payload = {
        title: form.title.trim() || undefined,
        type: form.type,
        message: form.message.trim(),
        assignedUsers: form.assignedUsers,
        assignedGroups: form.assignedGroups,
        attachments,
      };

      if (editId) {
        const res = await axios.put(`/alerts/${editId}`, payload, getHeaders());
        const updated = res.data?.alert || res.data?.data || res.data;
        setAlerts((prev) =>
          prev.map((a) => (String(a._id) === String(editId) ? { ...a, ...updated } : a))
        );
        setNotification({ type: "success", message: "Alert updated successfully." });
      } else {
        const res = await axios.post("/alerts", payload, getHeaders());
        const created = res.data?.alert || res.data?.data || res.data;
        setAlerts((prev) => [created, ...prev]);
        setSelectedAlertId(created._id);
        setNotification({ type: "success", message: "Alert created successfully." });
      }

      closeForm();
      void fetchAlerts({ silent: true });
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save alert.");
    } finally {
      setSavingAlert(false);
    }
  };

  const deleteAlert = async (id) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) return;
    try {
      await axios.delete(`/alerts/${id}`, getHeaders());
      setAlerts((prev) => prev.filter((a) => String(a._id) !== String(id)));
      setNotification({ type: "success", message: "Alert deleted." });
    } catch {
      setNotification({ type: "error", message: "Failed to delete alert." });
    }
  };

  if (pageLoading) {
    return (
      <div className="Alerts-page-loader">
        <CIISLoader />
      </div>
    );
  }

  const selectedMeta = selectedAlert ? getAlertCategoryMeta(selectedAlert) : null;
  const selectedIsRead = selectedAlert ? isRead(selectedAlert) : false;
  const selectedAttachments = asArray(selectedAlert?.attachments);

  return (
    <div className="AlertsContainer">
      {/* Toast Notification */}
      {notification && (
        <div className={`AlertsToast AlertsToast-${notification.type}`}>
          <span>{notification.message}</span>
          <button
            type="button"
            className="AlertsToastClose"
            onClick={() => setNotification(null)}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* 1 & 2. Hero Header with Purple Gradient & Embedded Stat Cards (Matching 2nd Screenshot) */}
      <section className="AlertsHeroHeader">
        <div className="AlertsHeroTop">
          <div className="AlertsHeroLeft">
            <div className="AlertsHeroTitleRow">
              <div className="AlertsHeroIconBox">
                <FiBell />
              </div>
              <div>
                <h1 className="AlertsHeroTitle">My Alerts</h1>
                <p className="AlertsHeroSubtitle">
                  Stay informed with important announcements and updates.
                </p>
              </div>
            </div>
          </div>

          <div className="AlertsHeroRight">
            {/* Search Box */}
            <div className="AlertsSearchBox">
              <FiSearch className="AlertsSearchIcon" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="AlertsSearchClear"
                  onClick={() => setSearchQuery("")}
                >
                  <FiX />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="AlertsFilterSelectWrapper">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="AlertsFilterSelect"
              >
                <option value="all">All Alerts</option>
                <option value="announcement">Announcements</option>
                <option value="policy">Policies</option>
                <option value="meeting">Meetings</option>
                <option value="report">Reports</option>
                <option value="maintenance">Maintenance</option>
                <option value="attendance">Attendance</option>
              </select>
              <FiChevronDown className="AlertsSelectChevron" />
            </div>

            {/* Admin Create Button */}
            {canManage && (
              <button
                type="button"
                className="AlertsHeroCreateBtn"
                onClick={() => openForm()}
              >
                <FiPlus />
                <span>Create Alert</span>
              </button>
            )}

            <button
              type="button"
              className={`AlertsHeroRefreshBtn ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchAlerts()}
              title="Refresh alerts"
              aria-label="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* Embedded Stat Cards (Matching 2nd Screenshot) */}
        <div className="AlertsHeroStatsGrid">
          {/* Total Alerts */}
          <article className="AlertsHeroStatCard card-total">
            <span className="AlertsHeroCardIcon">
              <FiBell />
            </span>
            <div className="AlertsHeroCardData">
              <small>Total Alerts</small>
              <strong>{stats.total}</strong>
            </div>
            <p>All notifications</p>
          </article>

          {/* Read */}
          <article className="AlertsHeroStatCard card-read">
            <span className="AlertsHeroCardIcon">
              <FiCheckCircle />
            </span>
            <div className="AlertsHeroCardData">
              <small>Read</small>
              <strong>{stats.read}</strong>
            </div>
            <p className="text-green">{stats.readPercentage}% of alerts read</p>
          </article>

          {/* Unread */}
          <article className="AlertsHeroStatCard card-unread">
            <span className="AlertsHeroCardIcon">
              <FiMail />
            </span>
            <div className="AlertsHeroCardData">
              <small>Unread</small>
              <strong>{stats.unread}</strong>
            </div>
            <p className="text-red">{stats.unreadPercentage}% unread</p>
          </article>

          {/* This Week */}
          <article className="AlertsHeroStatCard card-week">
            <span className="AlertsHeroCardIcon">
              <FiCalendar />
            </span>
            <div className="AlertsHeroCardData">
              <small>This Week</small>
              <strong>{stats.thisWeek}</strong>
            </div>
            <p>New updates</p>
          </article>
        </div>
      </section>

      {/* 3. Main Master-Detail Split Layout */}
      <main className="AlertsMainLayout">
        {/* Left Column: Alerts List Panel */}
        <section className="AlertsListCard">
          {/* List Top Bar: Tabs & Sort Dropdown */}
          <div className="AlertsListTopBar">
            <div className="AlertsTabs">
              <button
                type="button"
                className={`AlertsTab ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All ({stats.total})
              </button>

              <button
                type="button"
                className={`AlertsTab ${activeTab === "unread" ? "active" : ""}`}
                onClick={() => setActiveTab("unread")}
              >
                <span>Unread ({stats.unread})</span>
                {stats.unread > 0 && <span className="AlertsTabDot" />}
              </button>

              <button
                type="button"
                className={`AlertsTab ${activeTab === "read" ? "active" : ""}`}
                onClick={() => setActiveTab("read")}
              >
                Read ({stats.read})
              </button>
            </div>

            <div className="AlertsSortWrap">
              <span className="AlertsSortLabel">Sort by</span>
              <div className="AlertsSortSelectWrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="AlertsSortSelect"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <FiChevronDown className="AlertsSortChevron" />
              </div>
            </div>
          </div>

          {/* Alerts List Rows */}
          <div className="AlertsListRows">
            {paginatedAlerts.length === 0 ? (
              <div className="AlertsEmptyList">
                <FiInfo className="AlertsEmptyIcon" />
                <h3>No alerts found</h3>
                <p>There are no alerts matching your current filters.</p>
              </div>
            ) : (
              paginatedAlerts.map((alert) => {
                const isSelected = selectedAlert && String(selectedAlert._id) === String(alert._id);
                const read = isRead(alert);
                const meta = getAlertCategoryMeta(alert);
                const title = getAlertTitle(alert);

                return (
                  <div
                    key={alert._id}
                    className={`AlertsListItem ${isSelected ? "selected" : ""} ${
                      !read ? "is-unread" : ""
                    }`}
                    onClick={() => setSelectedAlertId(alert._id)}
                  >
                    {/* Left Active Indicator Bar & Dot */}
                    <div className="AlertsListItemLeftCol">
                      {isSelected ? (
                        <span className="AlertsActiveDot" />
                      ) : !read ? (
                        <span className="AlertsUnreadDot" />
                      ) : (
                        <span className="AlertsSpacerDot" />
                      )}

                      {/* Squircle Icon */}
                      <div
                        className="AlertsItemSquircle"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {meta.icon}
                      </div>
                    </div>

                    {/* Middle Title & Snippet */}
                    <div className="AlertsItemCenter">
                      <h4 className="AlertsItemTitle">{title}</h4>
                      <p className="AlertsItemSnippet">
                        {String(alert.message || "").replace(/\s+/g, " ")}
                      </p>
                      <div className="AlertsItemAuthorTag">
                        <FiUser className="AlertsAuthorIcon" />
                        <span>By: <strong>{getAlertAuthor(alert)}</strong></span>
                      </div>
                    </div>

                    {/* Right Date, Status Pill & Chevron */}
                    <div className="AlertsItemRight">
                      <span className="AlertsItemTime">{formatListDate(alert.createdAt)}</span>
                      <div className="AlertsItemStatusRow">
                        <span
                          className={`AlertsStatusBadge ${
                            read ? "status-read" : "status-unread"
                          }`}
                        >
                          {read ? "Read" : "Unread"}
                        </span>
                        <FiChevronRight className="AlertsItemChevron" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* List Footer: Pagination Bar */}
          <footer className="AlertsPaginationBar">
            <span className="AlertsPaginationText">
              Showing {startRecordNum} to {endRecordNum} of {filteredAlerts.length} alerts
            </span>

            <div className="AlertsPaginationControls">
              <button
                type="button"
                className="AlertsPageNavBtn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`AlertsPageNumBtn ${currentPage === pageNum ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="AlertsPageNavBtn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </footer>
        </section>

        {/* Right Column: Alert Details Panel */}
        <section className="AlertsDetailCard">
          {selectedAlert ? (
            <div className="AlertsDetailContainer">
              {/* Detail Header */}
              <div className="AlertsDetailHeader">
                <div className="AlertsDetailHeaderLeft">
                  <div
                    className="AlertsDetailIconSquircle"
                    style={{
                      backgroundColor: selectedMeta?.bg || "#eff6ff",
                      color: selectedMeta?.color || "#2563eb",
                    }}
                  >
                    {selectedMeta?.icon}
                  </div>
                  <div className="AlertsDetailTitles">
                    <h3 className="AlertsDetailTitle">{getAlertTitle(selectedAlert)}</h3>
                    <div className="AlertsDetailMetaRow">
                      <span className="AlertsDetailTimestamp">
                        {formatDetailDate(selectedAlert.createdAt)}
                      </span>
                      <span className="AlertsDetailMetaDot">•</span>
                      <span className="AlertsDetailAuthorBadge">
                        <FiUser className="AlertsAuthorIcon" />
                        <span>Posted by: <strong>{getAlertAuthor(selectedAlert)}</strong></span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="AlertsDetailHeaderRight">
                  <span
                    className={`AlertsStatusBadge ${
                      selectedIsRead ? "status-read" : "status-unread"
                    }`}
                  >
                    {selectedIsRead ? "Read" : "Unread"}
                  </span>

                  {canManage && (
                    <div className="AlertsAdminDetailActions">
                      <button
                        type="button"
                        className="AlertsDetailIconBtn"
                        title="Edit Alert"
                        onClick={() => openForm(selectedAlert)}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="AlertsDetailIconBtn delete"
                        title="Delete Alert"
                        onClick={() => deleteAlert(selectedAlert._id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Creator / Sender Information Banner */}
              <div className="AlertsSenderBanner">
                <div className="AlertsSenderAvatar">
                  {getAlertAuthor(selectedAlert).charAt(0).toUpperCase()}
                </div>
                <div className="AlertsSenderDetails">
                  <div className="AlertsSenderRow">
                    <span className="AlertsSenderName">{getAlertAuthor(selectedAlert)}</span>
                    {getAlertAuthorRole(selectedAlert) && (
                      <span className="AlertsSenderRole">{getAlertAuthorRole(selectedAlert)}</span>
                    )}
                  </div>
                  <span className="AlertsSenderMeta">
                    {selectedAlert?.createdBy?.department ? `${selectedAlert.createdBy.department} • ` : ""}
                    Posted on {formatDetailDate(selectedAlert.createdAt)}
                  </span>
                </div>
              </div>

              {/* Detail Body Content */}
              <div className="AlertsDetailBody">
                {String(selectedAlert.message || "")
                  .split(/\r?\n\r?\n/)
                  .map((paragraph, index) => (
                    <p key={index} className="AlertsDetailParagraph">
                      {paragraph.split("\n").map((line, lineIdx) => (
                        <React.Fragment key={lineIdx}>
                          {line}
                          {lineIdx < paragraph.split("\n").length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                  ))}
              </div>

              {/* Attached Files Section (if any) */}
              {selectedAttachments.length > 0 ? (
                <div className="AlertsAttachmentsSection">
                  <div className="AlertsAttachmentsTitle">
                    <FiPaperclip />
                    <span>Attached Files ({selectedAttachments.length})</span>
                  </div>

                  <div className="AlertsAttachmentCards">
                    {selectedAttachments.map((file, idx) => (
                      <div key={idx} className="AlertsAttachmentCard">
                        <div className="AlertsAttachmentLeft">
                          <FaFilePdf className="AlertsPdfIcon" />
                          <div className="AlertsAttachmentMeta">
                            <span className="AlertsAttachmentName">
                              {file.name || "Holiday_Notice.pdf"}
                            </span>
                            <span className="AlertsAttachmentSize">
                              {file.size || "245 KB"}
                            </span>
                          </div>
                        </div>

                        <a
                          href={file.url || "#"}
                          download={file.name || "Attachment"}
                          target="_blank"
                          rel="noreferrer"
                          className="AlertsAttachmentDownloadBtn"
                          aria-label="Download attachment"
                          onClick={(e) => {
                            if (!file.url || file.url === "#") {
                              e.preventDefault();
                              alert(`Downloading ${file.name || "attachment"}...`);
                            }
                          }}
                        >
                          <FiDownload />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Bottom Action Button: Mark as Read / Unread */}
              <div className="AlertsDetailActionBottom">
                <button
                  type="button"
                  className={`AlertsMainActionBtn ${selectedIsRead ? "is-read" : "is-unread"}`}
                  onClick={() => handleToggleRead(selectedAlert)}
                  disabled={actionLoading}
                >
                  <FiCheck className="AlertsActionCheckmark" />
                  <span>{selectedIsRead ? "Mark as Unread" : "Mark as Read"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="AlertsDetailEmpty">
              <FiBell className="AlertsDetailEmptyIcon" />
              <h3>Select an alert</h3>
              <p>Choose an alert from the list on the left to view complete details.</p>
            </div>
          )}
        </section>
      </main>

      {/* Admin Create / Edit Modal */}
      {isFormOpen && (
        <div className="AlertsModalOverlay" onClick={closeForm}>
          <div className="AlertsModalBox" onClick={(e) => e.stopPropagation()}>
            <div className="AlertsModalHeader">
              <h2>{editId ? "Edit Alert" : "Create New Alert"}</h2>
              <button type="button" className="AlertsModalClose" onClick={closeForm}>
                <FiX />
              </button>
            </div>

            <form onSubmit={saveAlert} className="AlertsModalForm">
              {formError && <div className="AlertsFormError">{formError}</div>}

              <div className="AlertsFormGroup">
                <label>Alert Title</label>
                <input
                  type="text"
                  placeholder="e.g. Office Will Remain Closed"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="AlertsFormGroup">
                <label>Category / Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="announcement">Announcement / Holiday</option>
                  <option value="report">Report Submission</option>
                  <option value="policy">Policy Update</option>
                  <option value="meeting">Team Meeting</option>
                  <option value="maintenance">System Maintenance</option>
                  <option value="onboarding">Employee Onboarding</option>
                  <option value="attendance">Attendance Notice</option>
                  <option value="info">General Info</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              <div className="AlertsFormGroup">
                <label>Alert Message *</label>
                <textarea
                  rows={4}
                  placeholder="Write the full announcement or alert message here..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              <div className="AlertsFormRow">
                <div className="AlertsFormGroup">
                  <label>Attachment Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Holiday_Notice.pdf"
                    value={form.attachmentName}
                    onChange={(e) => setForm({ ...form, attachmentName: e.target.value })}
                  />
                </div>
                <div className="AlertsFormGroup">
                  <label>Attachment Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 245 KB"
                    value={form.attachmentSize}
                    onChange={(e) => setForm({ ...form, attachmentSize: e.target.value })}
                  />
                </div>
              </div>

              <div className="AlertsModalActions">
                <button type="button" className="AlertsModalCancelBtn" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="AlertsModalSubmitBtn" disabled={savingAlert}>
                  {savingAlert ? "Saving..." : editId ? "Update Alert" : "Publish Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
