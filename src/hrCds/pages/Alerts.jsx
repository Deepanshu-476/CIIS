import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../utils/axiosConfig";
import CIISLoader from "../../Loader/CIISLoader";
import "../Css/Alerts.css";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiEdit2,
  FiEye,
  FiFilter,
  FiInfo,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const asArray = (value) => (Array.isArray(value) ? value : []);

const getApiList = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortTime = (value) => {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeType = (type) => String(type || "info").trim().toLowerCase();

const normalizeStatus = (status, readBy = []) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "read" || normalized === "seen") return "read";
  if (normalized === "unread" || normalized === "new") return "unread";
  return readBy.length ? "read" : "unread";
};

const getTypeIcon = (type) => {
  switch (normalizeType(type)) {
    case "warning":
      return <FiAlertTriangle />;
    case "error":
      return <FiAlertCircle />;
    default:
      return <FiInfo />;
  }
};

const getTypeColor = (type) => {
  switch (normalizeType(type)) {
    case "warning":
      return "#F59E0B";
    case "error":
      return "#EF4444";
    default:
      return "#2563EB";
  }
};

const getTypeLabel = (type) => {
  switch (normalizeType(type)) {
    case "warning":
      return "Warning";
    case "error":
      return "Error";
    default:
      return "Info";
  }
};

const buildSparkPath = (values) => {
  const width = 140;
  const height = 42;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * (height - 6) - 3;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

const createTrendValues = (count, accent = 1) => {
  const base = Math.max(1, count);
  return [0, base * 0.5 + accent, base * 0.75 + accent * 0.5, base * 0.6 + accent, base + accent * 1.2];
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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [viewMode, setViewMode] = useState("all");
  const [form, setForm] = useState({
    type: "info",
    message: "",
    assignedUsers: [],
    assignedGroups: [],
  });
  const [formError, setFormError] = useState("");
  const initialLoadRef = useRef(false);
  const autoRefreshRef = useRef(null);

  const token = localStorage.getItem("token");
  const canManage = ["admin", "hr", "manager"].includes(String(role || "").toLowerCase());

  const getUserId = () => {
    const storedUser = currentUser || JSON.parse(localStorage.getItem("user") || "null");
    return String(storedUser?._id || storedUser?.id || storedUser?.user?._id || storedUser?.user?.id || localStorage.getItem("userId") || "");
  };

  const getUserGroups = async (userId) => {
    if (!userId) return [];
    try {
      const response = await axios.get(`/users/${userId}/groups`, getHeaders());
      const list = getApiList(response.data, ["groups"]);
      const ids = list.map((group) => String(group?._id || group?.id || group)).filter(Boolean);
      setUserGroupIds(ids);
      localStorage.setItem("userGroups", JSON.stringify(ids));
      return ids;
    } catch {
      try {
        const stored = JSON.parse(localStorage.getItem("userGroups") || "[]");
        const ids = asArray(stored).map((group) => String(group?._id || group?.id || group)).filter(Boolean);
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
      const response = await axios.get("/users/company-users", getHeaders());
      const list = getApiList(response.data, ["users"]);
      setUsers(list);
      return list;
    } catch {
      setUsers([]);
      return [];
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get("/groups", getHeaders());
      const list = getApiList(response.data, ["groups"]);
      setGroups(list);
      return list;
    } catch {
      setGroups([]);
      return [];
    }
  };

  const fetchAlerts = async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await axios.get("/alerts", getHeaders());
      const list = getApiList(response.data, ["alerts"]);
      setAlerts(list);
      setLastUpdatedAt(Date.now());
      return list;
    } catch (error) {
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to load alerts",
      });
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
          const userRole = parsed?.role || parsed?.user?.role || parsed?.userRole || "";
          setRole(String(userRole).toLowerCase());
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

  useEffect(() => {
    if (!autoRefresh) {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
      return undefined;
    }

    autoRefreshRef.current = setInterval(() => {
      void fetchAlerts({ silent: true });
    }, 45000);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefresh]);

  useEffect(() => () => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
  }, []);

  const currentUserId = getUserId();
  const isAlertVisibleToUser = (alert) => {
    const assignedUsers = asArray(alert?.assignedUsers);
    const assignedGroups = asArray(alert?.assignedGroups);
    if (!assignedUsers.length && !assignedGroups.length) return true;

    const userMatch = assignedUsers.some((user) => String(user?._id || user?.id || user) === currentUserId);
    const groupMatch = assignedGroups.some((group) => {
      const groupId = String(group?._id || group?.id || group);
      return userGroupIds.includes(groupId);
    });

    return userMatch || groupMatch;
  };

  const visibleAlerts = useMemo(() => alerts.filter(isAlertVisibleToUser), [alerts, currentUserId, userGroupIds]);

  const creators = useMemo(() => {
    const map = new Map();
    visibleAlerts.forEach((alert) => {
      const creator = alert?.createdBy || alert?.assignedBy || alert?.author || alert?.creator;
      const id = String(creator?._id || creator?.id || creator || "");
      if (id && !map.has(id)) {
        const matchedUser = users.find((user) => String(user?._id || user?.id) === id);
        map.set(id, matchedUser?.name || creator?.name || creator?.email || "System");
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [visibleAlerts, users]);

  const filteredAlerts = useMemo(() => {
    let list = [...visibleAlerts];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((alert) =>
        String(alert?.message || "").toLowerCase().includes(query) ||
        String(alert?.type || "").toLowerCase().includes(query)
      );
    }

    if (filterType !== "all") {
      list = list.filter((alert) => normalizeType(alert?.type) === filterType);
    }

    if (filterStatus !== "all") {
      list = list.filter((alert) => normalizeStatus(alert?.status, asArray(alert?.readBy)) === filterStatus);
    }

    if (createdByFilter !== "all") {
      list = list.filter((alert) => {
        const creator = alert?.createdBy || alert?.assignedBy || alert?.author || alert?.creator;
        const creatorId = String(creator?._id || creator?.id || creator || "");
        return creatorId === createdByFilter;
      });
    }

    if (filterDate !== "all") {
      const now = new Date();
      list = list.filter((alert) => {
        const date = new Date(alert?.createdAt);
        if (Number.isNaN(date.getTime())) return false;
        const diff = now.getTime() - date.getTime();
        if (filterDate === "today") return date.toDateString() === now.toDateString();
        if (filterDate === "week") return diff <= 7 * 24 * 60 * 60 * 1000;
        if (filterDate === "month") return diff <= 30 * 24 * 60 * 60 * 1000;
        return true;
      });
    }

    if (viewMode === "unread") {
      list = list.filter((alert) => normalizeStatus(alert?.status, asArray(alert?.readBy)) === "unread");
    }

    return list.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [visibleAlerts, searchQuery, filterType, filterStatus, filterDate, createdByFilter, viewMode]);

  const stats = useMemo(() => {
    const total = visibleAlerts.length;
    const info = visibleAlerts.filter((alert) => normalizeType(alert?.type) === "info").length;
    const warning = visibleAlerts.filter((alert) => normalizeType(alert?.type) === "warning").length;
    const error = visibleAlerts.filter((alert) => normalizeType(alert?.type) === "error").length;
    const unread = visibleAlerts.filter((alert) => normalizeStatus(alert?.status, asArray(alert?.readBy)) === "unread").length;
    return { total, info, warning, error, unread };
  }, [visibleAlerts]);

  const formUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const name = String(user?.name || user?.username || user?.fullName || "").toLowerCase();
      const email = String(user?.email || "").toLowerCase();
      const userRole = String(user?.role || user?.userRole || "").toLowerCase();
      return name.includes(query) || email.includes(query) || userRole.includes(query);
    });
  }, [users, userSearch]);

  const formGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => {
      const name = String(group?.name || "").toLowerCase();
      const description = String(group?.description || "").toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [groups, groupSearch]);

  const creatorFilterOptions = useMemo(() => {
    const fromAlerts = creators;
    return fromAlerts;
  }, [creators]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterDate("all");
    setCreatedByFilter("all");
    setViewMode("all");
  };

  const openForm = (alert = null) => {
    if (alert) {
      setEditId(alert._id);
      setForm({
        type: normalizeType(alert.type),
        message: alert.message || "",
        assignedUsers: asArray(alert.assignedUsers).map((item) => String(item?._id || item?.id || item)).filter(Boolean),
        assignedGroups: asArray(alert.assignedGroups).map((item) => String(item?._id || item?.id || item)).filter(Boolean),
      });
    } else {
      setEditId(null);
      setForm({
        type: "info",
        message: "",
        assignedUsers: [],
        assignedGroups: [],
      });
    }
    setUserSearch("");
    setGroupSearch("");
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditId(null);
    setFormError("");
  };

  const toggleUser = (userId) => {
    setForm((prev) => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId)
        ? prev.assignedUsers.filter((id) => id !== userId)
        : [...prev.assignedUsers, userId],
    }));
  };

  const toggleGroup = (groupId) => {
    setForm((prev) => ({
      ...prev,
      assignedGroups: prev.assignedGroups.includes(groupId)
        ? prev.assignedGroups.filter((id) => id !== groupId)
        : [...prev.assignedGroups, groupId],
    }));
  };

  const saveAlert = async () => {
    if (!canManage) {
      setFormError("You do not have permission to manage alerts.");
      return;
    }

    if (!form.message.trim()) {
      setFormError("Please enter an alert message.");
      return;
    }

    try {
      const payload = {
        type: form.type,
        message: form.message.trim(),
        assignedUsers: form.assignedUsers,
        assignedGroups: form.assignedGroups,
      };

      if (editId) {
        const response = await axios.put(`/alerts/${editId}`, payload, getHeaders());
        const nextAlert = response.data?.alert || response.data?.data || response.data;
        setAlerts((prev) => prev.map((alert) => (String(alert._id) === String(editId) ? nextAlert : alert)));
        setNotification({ type: "success", message: "Alert updated successfully." });
      } else {
        const response = await axios.post("/alerts", payload, getHeaders());
        const nextAlert = response.data?.alert || response.data?.data || response.data;
        setAlerts((prev) => [nextAlert, ...prev]);
        setNotification({ type: "success", message: "Alert created successfully." });
      }

      closeForm();
      void fetchAlerts({ silent: true });
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to save alert.");
    }
  };

  const deleteAlert = async (id) => {
    if (!canManage) return;
    if (!window.confirm("Delete this alert?")) return;

    try {
      await axios.delete(`/alerts/${id}`, getHeaders());
      setAlerts((prev) => prev.filter((alert) => String(alert._id) !== String(id)));
      setNotification({ type: "success", message: "Alert deleted successfully." });
    } catch (error) {
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to delete alert.",
      });
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/alerts/${id}/read`, {}, getHeaders());
      const userId = currentUserId;
      setAlerts((prev) =>
        prev.map((alert) => {
          if (String(alert._id) !== String(id)) return alert;
          const readBy = asArray(alert.readBy);
          if (readBy.some((entry) => String(entry?._id || entry?.id || entry) === userId)) {
            return alert;
          }
          return {
            ...alert,
            readBy: [...readBy, { _id: userId }],
          };
        })
      );
      setNotification({ type: "success", message: "Marked as read." });
    } catch {
      setNotification({ type: "error", message: "Unable to mark alert as read." });
    }
  };

  const getCreator = (alert) => {
    const creator = alert?.createdBy || alert?.assignedBy || alert?.author || alert?.creator;
    const creatorId = String(creator?._id || creator?.id || creator || "");
    const user = users.find((item) => String(item?._id || item?.id) === creatorId);
    return user?.name || creator?.name || creator?.email || "System";
  };

  const getCreatorAvatar = (alert) => {
    const creator = alert?.createdBy || alert?.assignedBy || alert?.author || alert?.creator;
    const name = getCreator(alert);
    const initials = String(creator?.name || name || "S")
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return initials || "S";
  };

  const getAssignedNames = (list, type) => {
    const source = asArray(list);
    const mapped = source.map((item) => {
      const id = String(item?._id || item?.id || item);
      if (type === "user") {
        const match = users.find((user) => String(user?._id || user?.id) === id);
        return { id, name: match?.name || match?.email || "Unknown User" };
      }
      const match = groups.find((group) => String(group?._id || group?.id) === id);
      return { id, name: match?.name || "Unknown Group" };
    });
    return mapped.filter(Boolean);
  };

  const unreadCount = stats.unread;
  const headerSpark = buildSparkPath(createTrendValues(stats.total || 1, 1));
  const infoSpark = buildSparkPath(createTrendValues(stats.info || 1, 2));
  const warningSpark = buildSparkPath(createTrendValues(stats.warning || 1, 3));
  const errorSpark = buildSparkPath(createTrendValues(stats.error || 1, 4));

  if (pageLoading) {
    return <CIISLoader />;
  }

  const heroTime = lastUpdatedAt ? formatShortTime(lastUpdatedAt) : "--:--";

  return (
    <div className="AlertsPage">
      <section className="AlertsHero">
        <div className="AlertsHero-badgeWrap">
          <div className="AlertsHero-badge">
            <FiBell />
          </div>
          <span className="AlertsHero-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
        </div>

        <div className="AlertsHero-copy">
          <h1>System Alerts</h1>
          <p>Real-time notifications & announcements</p>

          <div className="AlertsHero-meta">
            <div className="AlertsHero-pill">
              <FiCalendar />
              <span>Last Updated: {heroTime}</span>
            </div>
            <button
              type="button"
              className={`AlertsHero-pill AlertsHero-pill-green ${autoRefresh ? "is-active" : ""}`}
              onClick={() => setAutoRefresh((prev) => !prev)}
            >
              <span className="AlertsHero-dot" />
              <span>Auto Refresh: {autoRefresh ? "On" : "Off"}</span>
            </button>
          </div>
        </div>

        <div className="AlertsHero-actions">
          <button
            type="button"
            className="AlertsButton AlertsButton-primary"
            onClick={() => openForm()}
          >
            <FiPlus />
            <span>Create Alert</span>
          </button>
        </div>
      </section>

      <section className="AlertsToolbar">
        <div className="AlertsToolbar-topRow">
          <div className="AlertsSearch">
            <FiSearch />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search alerts by message or type..."
            />
          </div>

          <div className="AlertsToolbar-actions">
            <button type="button" className="AlertsButton AlertsButton-outline">
              <FiFilter />
              <span>Filter</span>
            </button>
            <button type="button" className="AlertsButton AlertsButton-outline" onClick={resetFilters}>
              <FiRotateCcw />
              <span>Reset</span>
            </button>
            <button
              type="button"
              className={`AlertsButton AlertsButton-outline AlertsButton-refresh ${refreshing ? "is-spinning" : ""}`}
              onClick={() => fetchAlerts()}
              disabled={refreshing}
            >
              <FiRefreshCw />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="AlertsToolbar-bottomRow">
          <label className="AlertsSelectField">
            <span><FiTagIcon /></span>
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <FiChevronDown className="AlertsSelectCaret" />
          </label>

          <label className="AlertsSelectField">
            <span><FiStatusIcon /></span>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            <FiChevronDown className="AlertsSelectCaret" />
          </label>

          <label className="AlertsSelectField">
            <span><FiCalendar /></span>
            <select value={filterDate} onChange={(event) => setFilterDate(event.target.value)}>
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <FiChevronDown className="AlertsSelectCaret" />
          </label>

          <label className="AlertsSelectField">
            <span><FiUser /></span>
            <select value={createdByFilter} onChange={(event) => setCreatedByFilter(event.target.value)}>
              <option value="all">Created By</option>
              {creatorFilterOptions.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="AlertsSelectCaret" />
          </label>
        </div>
      </section>

      <section className="AlertsStats">
        <article className="AlertsStatCard AlertsStatCard-blue">
          <div className="AlertsStatCopy">
            <div className="AlertsStatIcon AlertsStatIcon-blue">
              <FiBell />
            </div>
            <div>
              <span>My Alerts</span>
              <strong>{stats.total}</strong>
              <p>from yesterday</p>
            </div>
          </div>
          <svg className="AlertsStatSpark" viewBox="0 0 140 42" aria-hidden="true">
            <path d={headerSpark} />
          </svg>
        </article>

        <article className="AlertsStatCard AlertsStatCard-cyan">
          <div className="AlertsStatCopy">
            <div className="AlertsStatIcon AlertsStatIcon-cyan">
              <FiInfo />
            </div>
            <div>
              <span>Information</span>
              <strong>{stats.info}</strong>
              <p>from yesterday</p>
            </div>
          </div>
          <svg className="AlertsStatSpark" viewBox="0 0 140 42" aria-hidden="true">
            <path d={infoSpark} />
          </svg>
        </article>

        <article className="AlertsStatCard AlertsStatCard-orange">
          <div className="AlertsStatCopy">
            <div className="AlertsStatIcon AlertsStatIcon-orange">
              <FiAlertTriangle />
            </div>
            <div>
              <span>Warnings</span>
              <strong>{stats.warning}</strong>
              <p>No change</p>
            </div>
          </div>
          <svg className="AlertsStatSpark" viewBox="0 0 140 42" aria-hidden="true">
            <path d={warningSpark} />
          </svg>
        </article>

        <article className="AlertsStatCard AlertsStatCard-red">
          <div className="AlertsStatCopy">
            <div className="AlertsStatIcon AlertsStatIcon-red">
              <FiAlertCircle />
            </div>
            <div>
              <span>Errors</span>
              <strong>{stats.error}</strong>
              <p>No change</p>
            </div>
          </div>
          <svg className="AlertsStatSpark" viewBox="0 0 140 42" aria-hidden="true">
            <path d={errorSpark} />
          </svg>
        </article>
      </section>

      <section className="AlertsSection">
        <div className="AlertsSectionHeader">
          <div>
            <h2>My Alerts ({filteredAlerts.length})</h2>
            <p>{viewMode === "unread" ? "Showing unread alerts" : "Showing all my alerts"}</p>
          </div>

          <div className="AlertsSectionActions">
            <button type="button" className="AlertsButton AlertsButton-outline" onClick={() => setViewMode((prev) => (prev === "unread" ? "all" : "unread"))}>
              <FiFilter />
              <span>Filter</span>
            </button>
            <label className="AlertsMiniSelect">
              <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <FiChevronDown />
            </label>
          </div>
        </div>

        <div className="AlertsList">
          {filteredAlerts.length === 0 ? (
            <div className="AlertsEmpty">
              <div className="AlertsEmpty-illustration">
                <FiBell />
              </div>
              <div className="AlertsEmpty-copy">
                <h3>You're all caught up!</h3>
                <p>No alerts to show right now.</p>
              </div>
              <button type="button" className="AlertsButton AlertsButton-primary" onClick={() => fetchAlerts()}>
                <FiRefreshCw />
                <span>Refresh Alerts</span>
              </button>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const unread = normalizeStatus(alert?.status, asArray(alert?.readBy)) === "unread";
              const creator = getCreator(alert);
              const typeColor = getTypeColor(alert?.type);
              const assignedUsers = getAssignedNames(alert?.assignedUsers, "user");
              const assignedGroups = getAssignedNames(alert?.assignedGroups, "group");
              const showActions = canManage || unread;

              return (
                <article
                  key={String(alert?._id || alert?.id)}
                  className={`AlertsCard ${unread ? "is-unread" : ""}`}
                  style={{ "--accent": typeColor }}
                  onClick={() => setSelectedAlert(alert)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedAlert(alert);
                    }
                  }}
                >
                  <div className="AlertsCard-timeline" aria-hidden="true">
                    <span className="AlertsCard-dot" />
                    <span className="AlertsCard-line" />
                  </div>

                  <div className="AlertsCard-body">
                    <div className="AlertsCard-top">
                      <div className="AlertsCard-meta">
                        <span className="AlertsBadge AlertsBadge-type" style={{ backgroundColor: `${typeColor}12`, color: typeColor }}>
                          {getTypeIcon(alert?.type)}
                          <span>{getTypeLabel(alert?.type)}</span>
                        </span>
                        <span className="AlertsCard-date">
                          <FiCalendar />
                          {formatDateTime(alert?.createdAt)}
                        </span>
                        {unread && <span className="AlertsBadge AlertsBadge-new">NEW</span>}
                      </div>

                      <button type="button" className="AlertsCard-eye" onClick={(event) => { event.stopPropagation(); setSelectedAlert(alert); }}>
                        <FiEye />
                      </button>
                    </div>

                    <h3 className="AlertsCard-title">{alert?.message || "Untitled alert"}</h3>

                    <div className="AlertsCard-description">
                      <p>{alert?.message || ""}</p>
                    </div>

                    <div className="AlertsCard-footer">
                      <div className="AlertsCard-createdBy">
                        <span className="AlertsCard-createdLabel">Created by:</span>
                        <span className="AlertsAvatar">{getCreatorAvatar(alert)}</span>
                        <strong>{creator}</strong>
                      </div>

                      <div className="AlertsCard-assigned">
                        <span className="AlertsCard-assignedLabel">Assigned To</span>
                        <div className="AlertsCard-tags">
                          {assignedUsers.slice(0, 2).map((user) => (
                            <span key={`user-${user.id}`} className="AlertsTag AlertsTag-green">
                              <FiUsers />
                              {user.name}
                            </span>
                          ))}
                          {assignedGroups.slice(0, 2).map((group) => (
                            <span key={`group-${group.id}`} className="AlertsTag AlertsTag-blue">
                              <FiUsers />
                              {group.name}
                            </span>
                          ))}
                          {!assignedUsers.length && !assignedGroups.length && (
                            <span className="AlertsTag AlertsTag-blue">
                              <FiUsers />
                              Everyone
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {showActions && (
                      <div className="AlertsCard-actions">
                        <button type="button" className="AlertsActionButton" onClick={(event) => { event.stopPropagation(); markAsRead(alert?._id); }}>
                          <FiEye />
                          <span>Mark as Read</span>
                        </button>
                        {canManage && (
                          <>
                            <button type="button" className="AlertsActionButton" onClick={(event) => { event.stopPropagation(); openForm(alert); }}>
                              <FiEdit2 />
                              <span>Edit</span>
                            </button>
                            <button type="button" className="AlertsActionButton AlertsActionButton-danger" onClick={(event) => { event.stopPropagation(); deleteAlert(alert?._id); }}>
                              <FiTrash2 />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {!filteredAlerts.length && (
        <section className="AlertsCaughtUp">
          <div className="AlertsCaughtUp-blob" aria-hidden="true" />
          <div className="AlertsCaughtUp-copy">
            <h3>You're all caught up!</h3>
            <p>No alerts to show right now.</p>
          </div>
          <button type="button" className="AlertsButton AlertsButton-primary" onClick={() => fetchAlerts()}>
            <FiRefreshCw />
            <span>Refresh Alerts</span>
          </button>
        </section>
      )}

      {isFormOpen && (
        <div className="AlertsModal" role="dialog" aria-modal="true">
          <div className="AlertsModal-backdrop" onClick={closeForm} />
          <div className="AlertsModal-card">
            <div className="AlertsModal-header">
              <div>
                <h3>{editId ? "Edit Alert" : "Create Alert"}</h3>
                <p>{editId ? "Update alert details" : "Compose a new alert"}</p>
              </div>
              <button type="button" className="AlertsModal-close" onClick={closeForm}>
                <FiX />
              </button>
            </div>

            <div className="AlertsModal-body">
              {formError && <div className="AlertsFormError">{formError}</div>}

              <div className="AlertsModal-grid">
                <label className="AlertsField">
                  <span>Alert Type</span>
                  <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error / Critical</option>
                  </select>
                </label>

                <label className="AlertsField AlertsField-full">
                  <span>Alert Message</span>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                    placeholder="Enter your alert message here..."
                  />
                </label>

                <div className="AlertsAssignBlock">
                  <div className="AlertsAssignHeader">
                    <h4>Assign Users</h4>
                    <span>{form.assignedUsers.length}</span>
                  </div>
                  <div className="AlertsSearch Small">
                    <FiSearch />
                    <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users..." />
                  </div>
                  <div className="AlertsPickList">
                    {formUsers.map((user) => {
                      const userId = String(user?._id || user?.id || "");
                      if (!userId) return null;
                      const selected = form.assignedUsers.includes(userId);
                      return (
                        <button key={userId} type="button" className={`AlertsPickItem ${selected ? "is-selected" : ""}`} onClick={() => toggleUser(userId)}>
                          <span className="AlertsCheckbox">{selected ? <FiCheckCircle /> : <FiUsers />}</span>
                          <span className="AlertsPickName">{user.name || user.email || "Unknown User"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="AlertsAssignBlock">
                  <div className="AlertsAssignHeader">
                    <h4>Assign Groups</h4>
                    <span>{form.assignedGroups.length}</span>
                  </div>
                  <div className="AlertsSearch Small">
                    <FiSearch />
                    <input value={groupSearch} onChange={(event) => setGroupSearch(event.target.value)} placeholder="Search groups..." />
                  </div>
                  <div className="AlertsPickList">
                    {formGroups.map((group) => {
                      const groupId = String(group?._id || group?.id || "");
                      if (!groupId) return null;
                      const selected = form.assignedGroups.includes(groupId);
                      return (
                        <button key={groupId} type="button" className={`AlertsPickItem ${selected ? "is-selected" : ""}`} onClick={() => toggleGroup(groupId)}>
                          <span className="AlertsCheckbox">{selected ? <FiCheckCircle /> : <FiUsers />}</span>
                          <span className="AlertsPickName">{group.name || "Unknown Group"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="AlertsModal-footer">
              <button type="button" className="AlertsButton AlertsButton-outline Dark" onClick={closeForm}>
                Cancel
              </button>
              <button type="button" className="AlertsButton AlertsButton-primary" onClick={saveAlert}>
                {editId ? "Update Alert" : "Create Alert"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAlert && (
        <div className="AlertsModal" role="dialog" aria-modal="true">
          <div className="AlertsModal-backdrop" onClick={() => setSelectedAlert(null)} />
          <div className="AlertsModal-card AlertsModal-card-small">
            <div className="AlertsModal-header">
              <div>
                <h3>Alert Details</h3>
                <p>{formatDateTime(selectedAlert.createdAt)}</p>
              </div>
              <button type="button" className="AlertsModal-close" onClick={() => setSelectedAlert(null)}>
                <FiX />
              </button>
            </div>

            <div className="AlertsModal-body">
              <div className="AlertsDetailRow">
                <span>Type</span>
                <strong style={{ color: getTypeColor(selectedAlert.type) }}>{getTypeLabel(selectedAlert.type)}</strong>
              </div>
              <div className="AlertsDetailRow">
                <span>Message</span>
                <p>{selectedAlert.message}</p>
              </div>
              <div className="AlertsDetailRow">
                <span>Created by</span>
                <strong>{getCreator(selectedAlert)}</strong>
              </div>
            </div>

            <div className="AlertsModal-footer">
              <button type="button" className="AlertsButton AlertsButton-outline Dark" onClick={() => setSelectedAlert(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`AlertsToast AlertsToast-${notification.type}`}>
          <div>
            <strong>{notification.type === "error" ? "Error" : notification.type === "warning" ? "Warning" : "Success"}</strong>
            <p>{notification.message}</p>
          </div>
          <button type="button" onClick={() => setNotification(null)}>
            <FiX />
          </button>
        </div>
      )}
    </div>
  );
};

const FiTagIcon = () => <FiFilter />;
const FiStatusIcon = () => <FiCheckCircle />;

export default Alerts;
