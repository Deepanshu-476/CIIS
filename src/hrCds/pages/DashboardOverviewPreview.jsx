import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import "./DashboardOverviewPreview.css";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

import {
  Users,
  CalendarCheck,
  CalendarOff,
  DollarSign,
  Package,
  CheckSquare,
  Briefcase,
  Video,
  MessageSquare,
  Bell,
  UserCheck,
  ShieldCheck,
  FileText,
  LifeBuoy,
  Activity,
  BarChart3,
  TrendingUp,
  Network,
  FileSpreadsheet,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpRight,
  Check,
  AlertCircle,
  Building2,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Clock,
  Layers,
  LayoutGrid,
  Search,
  Filter
} from "lucide-react";

// =========================================================================
// Reusable Chart Overview Components
// =========================================================================

function DonutChartOverview({
  data = [],
  centerValue = "0",
  centerLabel = "",
  innerRadius = 36,
  outerRadius = 52,
  height = 135,
}) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const chartData =
    total > 0
      ? data.filter((d) => Number(d.value) > 0)
      : [{ name: "No data", value: 1, color: "#e2e8f0" }];

  return (
    <div className="ciis-card-chart-wrap">
      <div className="ciis-donut-container" style={{ height }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Tooltip
              formatter={(value, name) => [total > 0 ? value : 0, name]}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "12px",
                padding: "6px 10px",
              }}
              itemStyle={{ color: "#ffffff" }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={total > 0 ? 3 : 0}
              stroke="none"
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color || "#3b82f6"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="ciis-donut-center">
          <span className="ciis-donut-center-val">{centerValue}</span>
          {centerLabel && <span className="ciis-donut-center-lbl">{centerLabel}</span>}
        </div>
      </div>

      {/* Legend below donut */}
      <div className="ciis-chart-legend">
        {data.map((item, idx) => (
          <div key={idx} className="ciis-legend-item" title={`${item.name}: ${item.value}`}>
            <span className="ciis-legend-dot" style={{ backgroundColor: item.color }} />
            <span>{item.name}:</span>
            <span className="ciis-legend-count">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBarChartOverview({
  data = [],
  dataKey = "count",
  nameKey = "name",
  barColor = "#3b82f6",
  height = 135,
}) {
  const chartData = Array.isArray(data) && data.length > 0
    ? data
    : [{ name: "None", count: 0, color: "#e2e8f0" }];

  return (
    <div className="ciis-card-chart-wrap">
      <div className="ciis-barchart-container" style={{ height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey={nameKey}
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "12px",
                padding: "6px 10px",
              }}
              itemStyle={{ color: "#ffffff" }}
            />
            <Bar dataKey={dataKey} fill={barColor} radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.color || barColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniAreaTrendChart({ data = [], height = 135 }) {
  const chartData = Array.isArray(data) && data.length > 0
    ? data
    : [
        { date: "Mon", present: 0 },
        { date: "Tue", present: 0 },
        { date: "Wed", present: 0 },
        { date: "Thu", present: 0 },
        { date: "Fri", present: 0 },
      ];

  return (
    <div className="ciis-card-chart-wrap">
      <div className="ciis-barchart-container" style={{ height }}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "12px",
                padding: "6px 10px",
              }}
              formatter={(value, name) => [value, name === "present" ? "Present" : name]}
            />
            <Area
              type="monotone"
              dataKey="present"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#attendanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Master inventory of all 19 overview sections across 4 groups
const SECTION_DEFINITIONS = [
  // A. PEOPLE — Workforce Overview
  {
    key: "employeesOverview",
    group: "people",
    groupLabel: "PEOPLE",
    groupSubtitle: "Your workforce",
    title: "Employees Overview",
    description: "Total, active, inactive staff, department and role distributions.",
    icon: Users,
    color: "#2563eb",
    bg: "#eff6ff",
    route: "/ciisUser/create-user",
    routeLabel: "Manage Staff",
  },
  {
    key: "attendanceOverview",
    group: "people",
    groupLabel: "PEOPLE",
    groupSubtitle: "Your workforce",
    title: "Attendance Overview",
    description: "Daily present, absent, late check-ins, half-days, and punch logs.",
    icon: CalendarCheck,
    color: "#059669",
    bg: "#ecfdf5",
    route: "/ciisUser/attendance",
    routeLabel: "Attendance Hub",
  },
  {
    key: "leavesOverview",
    group: "people",
    groupLabel: "PEOPLE",
    groupSubtitle: "Your workforce",
    title: "Leaves Overview",
    description: "Pending approvals, approved, rejected leaves, and staff on leave today.",
    icon: CalendarOff,
    color: "#d97706",
    bg: "#fffbeb",
    route: "/ciisUser/emp-leaves",
    routeLabel: "Leaves Portal",
  },
  {
    key: "payrollOverview",
    group: "people",
    groupLabel: "PEOPLE",
    groupSubtitle: "Your workforce",
    title: "Payroll Overview",
    description: "Total company payroll, processed runs, pending processing, and salary stats.",
    icon: DollarSign,
    color: "#7c3aed",
    bg: "#f5f3ff",
    route: "/ciisUser/payroll-process",
    routeLabel: "Process Payroll",
    isSensitive: true,
  },
  {
    key: "assetsOverview",
    group: "people",
    groupLabel: "PEOPLE",
    groupSubtitle: "Your workforce",
    title: "Assets Overview",
    description: "Assigned assets, available inventory, maintenance, and pending employee requests.",
    icon: Package,
    color: "#0891b2",
    bg: "#ecfeff",
    route: "/ciisUser/company-assets",
    routeLabel: "Asset Inventory",
  },

  // B. WORK — Tasks and Teams Overview
  {
    key: "tasksOverview",
    group: "work",
    groupLabel: "WORK",
    groupSubtitle: "Tasks and teams",
    title: "Tasks Overview",
    description: "Total tasks, pending, in-progress, completed, and overdue task rates.",
    icon: CheckSquare,
    color: "#2563eb",
    bg: "#eff6ff",
    route: "/ciisUser/task-management",
    routeLabel: "Task Workspace",
  },
  {
    key: "projectsOverview",
    group: "work",
    groupLabel: "WORK",
    groupSubtitle: "Tasks and teams",
    title: "Projects Overview",
    description: "Active projects, milestones, deadlines, delayed items, and progress.",
    icon: Briefcase,
    color: "#059669",
    bg: "#ecfdf5",
    route: "/ciisUser/adminproject",
    routeLabel: "Projects Board",
  },
  {
    key: "meetingsOverview",
    group: "work",
    groupLabel: "WORK",
    groupSubtitle: "Tasks and teams",
    title: "Meetings Overview",
    description: "Scheduled meetings today, upcoming calendar events, and client calls.",
    icon: Video,
    color: "#d97706",
    bg: "#fffbeb",
    route: "/ciisUser/admin-meeting",
    routeLabel: "Meetings Schedule",
  },
  {
    key: "chatOverview",
    group: "work",
    groupLabel: "WORK",
    groupSubtitle: "Tasks and teams",
    title: "Chat Overview",
    description: "Accessible communication channels, active conversations, and team activity.",
    icon: MessageSquare,
    color: "#7c3aed",
    bg: "#f5f3ff",
    route: "/ciisUser/chat",
    routeLabel: "Team Chat",
  },
  {
    key: "alertsOverview",
    group: "work",
    groupLabel: "WORK",
    groupSubtitle: "Tasks and teams",
    title: "Alerts Overview",
    description: "Active system alerts, unseen company notifications, and critical events.",
    icon: Bell,
    color: "#e11d48",
    bg: "#fff1f2",
    route: "/ciisUser/alert",
    routeLabel: "Alerts Center",
  },

  // C. CLIENTS — Accounts and Delivery Overview
  {
    key: "clientManagementOverview",
    group: "clients",
    groupLabel: "CLIENTS",
    groupSubtitle: "Accounts and delivery",
    title: "Client Management Overview",
    description: "Total accounts, active client directory, new additions, and status breakdown.",
    icon: UserCheck,
    color: "#2563eb",
    bg: "#eff6ff",
    route: "/ciisUser/emp-client",
    routeLabel: "Client Directory",
  },
  {
    key: "clientServicesOverview",
    group: "clients",
    groupLabel: "CLIENTS",
    groupSubtitle: "Accounts and delivery",
    title: "Client Services Overview",
    description: "Contracted services, active deliverables, pending tasks, and completion rates.",
    icon: ShieldCheck,
    color: "#059669",
    bg: "#ecfdf5",
    route: "/ciisUser/client-plans",
    routeLabel: "Client Services",
  },
  {
    key: "clientPortalOverview",
    group: "clients",
    groupLabel: "CLIENTS",
    groupSubtitle: "Accounts and delivery",
    title: "Client Portal Overview",
    description: "Active client accounts, document exchanges, and pending review submissions.",
    icon: FileText,
    color: "#d97706",
    bg: "#fffbeb",
    route: "/client/dashboard",
    routeLabel: "Client Portal",
  },
  {
    key: "supportOverview",
    group: "clients",
    groupLabel: "CLIENTS",
    groupSubtitle: "Accounts and delivery",
    title: "Support Overview",
    description: "Helpdesk tickets, open issues, resolved cases, and SLA performance.",
    icon: LifeBuoy,
    color: "#e11d48",
    bg: "#fff1f2",
    route: "/ciisUser/support-operations",
    routeLabel: "Support Tickets",
  },

  // D. INSIGHTS — Performance and Reports Overview
  {
    key: "employeeActivityOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    groupSubtitle: "Performance and reports",
    title: "Employee Activity Overview",
    description: "Audit trail, real-time activity logs, daily contributions, and workload metrics.",
    icon: Activity,
    color: "#2563eb",
    bg: "#eff6ff",
    route: "/ciisUser/support-operations",
    routeLabel: "Activity Logs",
  },
  {
    key: "attendanceAnalyticsOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    groupSubtitle: "Performance and reports",
    title: "Attendance Analytics Overview",
    description: "7-day trends, punctuality scores, present vs absent daily comparisons.",
    icon: BarChart3,
    color: "#059669",
    bg: "#ecfdf5",
    route: "/ciisUser/attendance",
    routeLabel: "Analytics Reports",
  },
  {
    key: "taskAnalyticsOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    groupSubtitle: "Performance and reports",
    title: "Task Analytics Overview",
    description: "Priority breakdown, task velocity, completion curves, and overdue ratios.",
    icon: TrendingUp,
    color: "#d97706",
    bg: "#fffbeb",
    route: "/ciisUser/task-management",
    routeLabel: "Task Analytics",
  },
  {
    key: "teamVisibilityOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    groupSubtitle: "Performance and reports",
    title: "Team Visibility Overview",
    description: "Department capacity, branch breakdown, staff allocations, and team workload.",
    icon: Network,
    color: "#7c3aed",
    bg: "#f5f3ff",
    route: "/ciisUser/department",
    routeLabel: "Department Structure",
  },
  {
    key: "payrollReportsOverview",
    group: "insights",
    groupLabel: "INSIGHTS",
    groupSubtitle: "Performance and reports",
    title: "Payroll Reports Overview",
    description: "Historical salary summaries, run audit trends, deductions, and payroll periods.",
    icon: FileSpreadsheet,
    color: "#e11d48",
    bg: "#fff1f2",
    route: "/ciisUser/payroll-reports",
    routeLabel: "Payroll Reports",
    isSensitive: true,
  },
];

const GROUPS = [
  { id: "people", label: "PEOPLE", subtitle: "Your workforce" },
  { id: "work", label: "WORK", subtitle: "Tasks and teams" },
  { id: "clients", label: "CLIENTS", subtitle: "Accounts and delivery" },
  { id: "insights", label: "INSIGHTS", subtitle: "Performance and reports" },
];

export default function DashboardOverviewPreview() {
  const navigate = useNavigate();
  const location = useLocation();

  const isUserDashboard = useMemo(() => {
    return (
      location.pathname.startsWith("/ciisUser/dashboard-overview") ||
      location.pathname.includes("/ciisUser/")
    );
  }, [location.pathname]);

  const loggedInCompanyId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || localStorage.getItem("currentUser") || "{}");
      const comp = JSON.parse(localStorage.getItem("company") || localStorage.getItem("companyDetails") || "{}");
      return comp._id || comp.id || user.companyId || user.company?._id || user.company || "";
    } catch {
      return "";
    }
  }, []);

  // Selected company & companies list for SuperAdmin previewing
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => loggedInCompanyId || "");
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Dashboard live data & metadata
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Local interactive toggle states for all 19 overview sections
  const [enabledSections, setEnabledSections] = useState(() => {
    const initial = {};
    SECTION_DEFINITIONS.forEach((s) => {
      initial[s.key] = true;
    });
    return initial;
  });

  // UI Drawer / Control states
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState("all");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [viewMode, setViewMode] = useState("executive"); // "executive" (full page multi-widget) or "compact" (card grid)

  // 1. Fetch available companies for the selector (Only for standalone admin preview, never for user dashboard)
  const fetchCompanies = useCallback(async () => {
    if (isUserDashboard) return;
    try {
      setLoadingCompanies(true);
      const res = await axios.get("/dashboard-overview/companies", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.data?.success && Array.isArray(res.data.companies)) {
        setCompanies(res.data.companies);
        if (!selectedCompanyId && res.data.companies.length > 0) {
          setSelectedCompanyId(res.data.companies[0]._id);
        }
      }
    } catch (err) {
      console.warn("Company list fetch:", err.message);
    } finally {
      setLoadingCompanies(false);
    }
  }, [isUserDashboard, selectedCompanyId]);

  // 2. Fetch live aggregated overview data for the active company
  const fetchDashboardData = useCallback(async (companyId = "") => {
    try {
      setLoadingData(true);
      setErrorMsg("");
      const endpoint = companyId
        ? `/dashboard-overview/data/${companyId}`
        : "/dashboard-overview/data";

      const res = await axios.get(endpoint, {
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.data?.success) {
        setDashboardData(res.data);
        setLastRefreshed(new Date());

        // Sync initial enabled sections from company's saved configuration if present
        if (res.data.config) {
          const synced = {};
          SECTION_DEFINITIONS.forEach((s) => {
            const savedItem = res.data.config[s.key];
            synced[s.key] = savedItem !== undefined ? Boolean(savedItem.enabled) : true;
          });
          setEnabledSections(synced);
        }
      } else {
        setErrorMsg(res.data?.message || "Failed to load dashboard overview data");
      }
    } catch (err) {
      console.error("fetchDashboardData error:", err);
      setErrorMsg(
        err.response?.data?.message ||
        "Could not connect to CIIS backend. Please ensure the server is running."
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isUserDashboard) {
      fetchCompanies();
    }
  }, [isUserDashboard, fetchCompanies]);

  useEffect(() => {
    const targetId = isUserDashboard ? (loggedInCompanyId || "") : (selectedCompanyId || loggedInCompanyId || "");
    fetchDashboardData(targetId);
  }, [isUserDashboard, loggedInCompanyId, selectedCompanyId, fetchDashboardData]);

  // Handle individual toggle
  const toggleSection = (key) => {
    setEnabledSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setActivePreset("custom");
  };

  // Preset Handlers
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const updated = {};

    if (preset === "all") {
      SECTION_DEFINITIONS.forEach((s) => (updated[s.key] = true));
    } else if (preset === "none") {
      SECTION_DEFINITIONS.forEach((s) => (updated[s.key] = false));
    } else if (preset === "people") {
      SECTION_DEFINITIONS.forEach((s) => (updated[s.key] = s.group === "people"));
    } else if (preset === "work") {
      SECTION_DEFINITIONS.forEach((s) => (updated[s.key] = s.group === "work"));
    } else if (preset === "clients") {
      SECTION_DEFINITIONS.forEach((s) => (updated[s.key] = s.group === "clients"));
    } else if (preset === "insights") {
      SECTION_DEFINITIONS.forEach((s) => (updated[s.key] = s.group === "insights"));
    }

    setEnabledSections(updated);
  };

  // Save current preview configuration to database
  const saveConfigurationToDatabase = async () => {
    const targetCompId = selectedCompanyId || dashboardData?.company?.id;
    if (!targetCompId) {
      toast.warning("No target company selected to persist configuration");
      return;
    }

    try {
      setIsSavingConfig(true);
      const payload = {};
      SECTION_DEFINITIONS.forEach((s) => {
        payload[s.key] = { enabled: Boolean(enabledSections[s.key]) };
      });

      const res = await axios.put(`/dashboard-overview/config/${targetCompId}`, {
        config: payload,
      });

      if (res.data?.success) {
        toast.success("Dashboard configuration saved successfully in MongoDB!");
      } else {
        toast.error(res.data?.message || "Failed to persist configuration");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save configuration");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filter sections by search query in control drawer
  const filteredSectionsForDrawer = useMemo(() => {
    if (!searchQuery.trim()) return SECTION_DEFINITIONS;
    const q = searchQuery.toLowerCase();
    return SECTION_DEFINITIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.groupLabel.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Counts of enabled sections
  const enabledCount = useMemo(() => {
    return Object.values(enabledSections).filter(Boolean).length;
  }, [enabledSections]);

  // High-level KPI values
  const kpis = useMemo(() => {
    const d = dashboardData?.sections || dashboardData?.data || {};
    return {
      employees: d.employeesOverview?.totalEmployees || 0,
      activeTasks: (d.tasksOverview?.pendingCount ?? d.tasksOverview?.pendingTasks ?? 0) + (d.tasksOverview?.inProgressCount ?? d.tasksOverview?.inProgressTasks ?? 0),
      activeProjects: d.projectsOverview?.activeCount ?? d.projectsOverview?.activeProjects ?? 0,
      activeClients: d.clientManagementOverview?.activeClients ?? d.clientManagementOverview?.activeCount ?? 0,
      openTickets: d.supportOverview?.openCount ?? d.supportOverview?.openTickets ?? 0,
    };
  }, [dashboardData]);

  // =========================================================================
  // Section Renderers with Dedicated Graph Overviews (1 through 19)
  // =========================================================================

  const renderSectionCard = (sec) => {
    const data = dashboardData?.sections?.[sec.key] || dashboardData?.data?.[sec.key] || {};
    const IconComp = sec.icon;

    return (
      <div key={sec.key} className="ciis-overview-card" id={`section-${sec.key}`}>
        {/* Card Header */}
        <div className="ciis-card-header">
          <div className="ciis-card-title-group">
            <div
              className="ciis-card-icon-box"
              style={{ backgroundColor: sec.bg, color: sec.color }}
            >
              <IconComp size={20} />
            </div>
            <div>
              <h3 className="ciis-card-title">
                {sec.title}
                {sec.isSensitive && (
                  <span className="ciis-badge ciis-badge-warning" title="Restricted / Financial Data">
                    Protected
                  </span>
                )}
              </h3>
              <p className="ciis-card-desc">{sec.description}</p>
            </div>
          </div>
          <Link to={sec.route} className="ciis-card-link-btn" title={`Open ${sec.title}`}>
            <span>{sec.routeLabel}</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Card Body */}
        <div className="ciis-card-body">
          {/* 1. Employees Overview */}
          {sec.key === "employeesOverview" && (
            <>
              {/* Graph Overview: Staff Distribution Donut */}
              <DonutChartOverview
                data={[
                  { name: "Active", value: data.activeEmployees ?? 0, color: "#10b981" },
                  { name: "Inactive", value: data.inactiveEmployees ?? 0, color: "#ef4444" },
                  { name: "New", value: data.recentEmployees?.length || data.recentEmployeesCount || 0, color: "#3b82f6" },
                ]}
                centerValue={data.totalEmployees ?? 0}
                centerLabel="STAFF"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val">{data.totalEmployees ?? 0}</div>
                  <div className="ciis-metric-chip-lbl">Total</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.activeEmployees ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Active</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#dc2626" }}>
                    {data.inactiveEmployees ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Inactive</div>
                </div>
              </div>
            </>
          )}

          {/* 2. Attendance Overview */}
          {sec.key === "attendanceOverview" && (
            <>
              {/* Graph Overview: Attendance Donut Gauge */}
              <DonutChartOverview
                data={[
                  { name: "Present", value: data.presentToday ?? data.presentEmployees ?? 0, color: "#10b981" },
                  { name: "Absent", value: data.absentToday ?? data.absentEmployees ?? 0, color: "#ef4444" },
                  { name: "Late", value: data.lateArrivals ?? 0, color: "#f59e0b" },
                  { name: "Half Day", value: data.halfDayToday ?? data.halfDayAttendance ?? 0, color: "#8b5cf6" },
                ]}
                centerValue={`${data.attendanceRate ?? data.attendancePercentage ?? 0}%`}
                centerLabel="PRESENT"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.presentToday ?? data.presentEmployees ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Present</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#dc2626" }}>
                    {data.absentToday ?? data.absentEmployees ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Absent</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#d97706" }}>
                    {data.lateArrivals ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Late</div>
                </div>
              </div>
            </>
          )}

          {/* 3. Leaves Overview */}
          {sec.key === "leavesOverview" && (
            <>
              {/* Graph Overview: Leaves Status Donut */}
              <DonutChartOverview
                data={[
                  { name: "Approved", value: data.approvedCount ?? data.approvedLeaves ?? 0, color: "#10b981" },
                  { name: "Pending", value: data.pendingCount ?? data.pendingLeaves ?? 0, color: "#f59e0b" },
                  { name: "Rejected", value: data.rejectedCount ?? data.rejectedLeaves ?? 0, color: "#ef4444" },
                  { name: "On Leave", value: data.onLeaveTodayCount ?? data.employeesOnLeaveToday ?? 0, color: "#3b82f6" },
                ]}
                centerValue={(data.approvedCount ?? data.approvedLeaves ?? 0) + (data.pendingCount ?? data.pendingLeaves ?? 0) + (data.rejectedCount ?? data.rejectedLeaves ?? 0)}
                centerLabel="REQUESTS"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#d97706" }}>
                    {data.pendingCount ?? data.pendingLeaves ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Pending</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.approvedCount ?? data.approvedLeaves ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Approved</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.onLeaveTodayCount ?? data.employeesOnLeaveToday ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">On Leave</div>
                </div>
              </div>
            </>
          )}

          {/* 4. Payroll Overview */}
          {sec.key === "payrollOverview" && (
            <>
              {data.authorized === false || data.restricted ? (
                <div className="ciis-restricted-box">
                  <ShieldAlert size={18} />
                  <span>{data.restrictedMessage || data.message || "Financial salary data restricted by security role."}</span>
                </div>
              ) : (
                <>
                  {/* Graph Overview: Payroll Disbursal Donut */}
                  <DonutChartOverview
                    data={[
                      { name: "Processed", value: data.processedPayrollAmount ?? 0, color: "#10b981" },
                      { name: "Pending", value: data.pendingPayrollAmount ?? 0, color: "#f59e0b" },
                    ]}
                    centerValue={`${
                      data.totalPayrollAmount > 0
                        ? Math.round(((data.processedPayrollAmount ?? 0) / data.totalPayrollAmount) * 100)
                        : 0
                    }%`}
                    centerLabel="DISBURSED"
                  />

                  <div className="ciis-metric-chips-row">
                    <div className="ciis-metric-chip">
                      <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                        ₹{(data.totalPayrollAmount ?? 0).toLocaleString()}
                      </div>
                      <div className="ciis-metric-chip-lbl">Total Period</div>
                    </div>
                    <div className="ciis-metric-chip">
                      <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                        ₹{(data.processedPayrollAmount ?? 0).toLocaleString()}
                      </div>
                      <div className="ciis-metric-chip-lbl">Processed</div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* 5. Assets Overview */}
          {sec.key === "assetsOverview" && (
            <>
              {/* Graph Overview: Assets Utilization Donut */}
              <DonutChartOverview
                data={[
                  { name: "Assigned", value: data.assignedAssets ?? data.assignedCount ?? 0, color: "#3b82f6" },
                  { name: "Available", value: data.availableAssets ?? data.availableCount ?? 0, color: "#10b981" },
                  { name: "Requests", value: data.pendingAssetRequests ?? data.pendingRequestsCount ?? 0, color: "#f59e0b" },
                  { name: "Repair", value: data.maintenanceCount ?? 0, color: "#ef4444" },
                ]}
                centerValue={data.totalAssets ?? data.totalAssetsCount ?? 0}
                centerLabel="ASSETS"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val">{data.totalAssets ?? data.totalAssetsCount ?? 0}</div>
                  <div className="ciis-metric-chip-lbl">Total</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.assignedAssets ?? data.assignedCount ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Assigned</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.availableAssets ?? data.availableCount ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Available</div>
                </div>
              </div>
            </>
          )}

          {/* 6. Tasks Overview */}
          {sec.key === "tasksOverview" && (
            <>
              {/* Graph Overview: Tasks Completion Donut */}
              <DonutChartOverview
                data={[
                  { name: "Done", value: data.completedCount ?? data.completedTasks ?? 0, color: "#10b981" },
                  { name: "In Progress", value: data.inProgressCount ?? data.inProgressTasks ?? 0, color: "#3b82f6" },
                  { name: "Pending", value: data.pendingCount ?? data.pendingTasks ?? 0, color: "#94a3b8" },
                  { name: "Overdue", value: data.overdueCount ?? data.overdueTasks ?? 0, color: "#ef4444" },
                ]}
                centerValue={`${data.completionRate ?? 0}%`}
                centerLabel="DONE"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val">{data.totalTasks ?? 0}</div>
                  <div className="ciis-metric-chip-lbl">Total</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.inProgressCount ?? data.inProgressTasks ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">In Progress</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.completedCount ?? data.completedTasks ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Done</div>
                </div>
              </div>
            </>
          )}

          {/* 7. Projects Overview */}
          {sec.key === "projectsOverview" && (
            <>
              {/* Graph Overview: Projects Distribution Donut */}
              <DonutChartOverview
                data={[
                  { name: "Active", value: data.activeCount ?? data.activeProjects ?? 0, color: "#3b82f6" },
                  { name: "Finished", value: data.completedCount ?? data.completedProjects ?? 0, color: "#10b981" },
                  { name: "Delayed", value: data.delayedCount ?? data.delayedProjects ?? 0, color: "#ef4444" },
                  { name: "Planning", value: data.planningCount ?? 0, color: "#f59e0b" },
                ]}
                centerValue={data.totalProjects ?? 0}
                centerLabel="PROJECTS"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val">{data.totalProjects ?? 0}</div>
                  <div className="ciis-metric-chip-lbl">Total</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.activeCount ?? data.activeProjects ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Active</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#dc2626" }}>
                    {data.delayedCount ?? data.delayedProjects ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Delayed</div>
                </div>
              </div>
            </>
          )}

          {/* 8. Meetings Overview */}
          {sec.key === "meetingsOverview" && (
            <>
              {/* Graph Overview: Meetings Donut */}
              <DonutChartOverview
                data={[
                  { name: "Today", value: data.todayCount ?? data.meetingsToday ?? 0, color: "#3b82f6" },
                  { name: "Upcoming", value: data.upcomingCount ?? data.upcomingMeetings ?? 0, color: "#f59e0b" },
                  { name: "Completed", value: data.completedCount ?? data.completedMeetings ?? 0, color: "#10b981" },
                ]}
                centerValue={data.todayCount ?? data.meetingsToday ?? 0}
                centerLabel="TODAY"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.todayCount ?? data.meetingsToday ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Today</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.upcomingCount ?? data.upcomingMeetings ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Upcoming 7d</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#64748b" }}>
                    {data.completedCount ?? data.completedMeetings ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Completed</div>
                </div>
              </div>
            </>
          )}

          {/* 9. Chat Overview */}
          {sec.key === "chatOverview" && (
            <>
              {/* Graph Overview: Channels Distribution Donut */}
              <DonutChartOverview
                data={[
                  { name: "Active", value: data.activeChannelsCount ?? 0, color: "#3b82f6" },
                  {
                    name: "General",
                    value: Math.max(
                      (data.totalChannels ?? data.totalConversations ?? 0) - (data.activeChannelsCount ?? 0),
                      0
                    ),
                    color: "#8b5cf6",
                  },
                ]}
                centerValue={data.totalChannels ?? data.totalConversations ?? 0}
                centerLabel="CHANNELS"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.accessibleChannelsCount ?? data.totalChannels ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Channels</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.activeConversationsCount ?? data.activeChannelsCount ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Active</div>
                </div>
              </div>
            </>
          )}

          {/* 10. Alerts Overview */}
          {sec.key === "alertsOverview" && (
            <>
              {/* Graph Overview: Alerts Severity Donut */}
              <DonutChartOverview
                data={[
                  { name: "Unseen", value: data.unseenCount ?? data.unseenAlerts ?? 0, color: "#ef4444" },
                  { name: "High Priority", value: data.highPriorityAlerts ?? 0, color: "#f59e0b" },
                  {
                    name: "Standard",
                    value: Math.max(
                      (data.totalAlerts ?? 0) -
                        ((data.unseenCount ?? data.unseenAlerts ?? 0) + (data.highPriorityAlerts ?? 0)),
                      0
                    ),
                    color: "#10b981",
                  },
                ]}
                centerValue={data.unseenCount ?? data.unseenAlerts ?? 0}
                centerLabel="UNSEEN"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val">{data.totalAlerts ?? 0}</div>
                  <div className="ciis-metric-chip-lbl">Total</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#e11d48" }}>
                    {data.unseenCount ?? data.unseenAlerts ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Unseen</div>
                </div>
              </div>
            </>
          )}

          {/* 11. Client Management Overview */}
          {sec.key === "clientManagementOverview" && (
            <>
              {/* Graph Overview: Clients Status Donut */}
              <DonutChartOverview
                data={[
                  { name: "Active", value: data.activeClients ?? 0, color: "#10b981" },
                  { name: "Inactive", value: data.inactiveClients ?? 0, color: "#94a3b8" },
                  { name: "New 30d", value: data.recentlyAddedClients ?? 0, color: "#3b82f6" },
                ]}
                centerValue={data.totalClients ?? 0}
                centerLabel="CLIENTS"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val">{data.totalClients ?? 0}</div>
                  <div className="ciis-metric-chip-lbl">Total</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.activeClients ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Active</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.recentlyAddedClients ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">New 30d</div>
                </div>
              </div>
            </>
          )}

          {/* 12. Client Services Overview */}
          {sec.key === "clientServicesOverview" && (
            <>
              {/* Graph Overview: Services Donut */}
              <DonutChartOverview
                data={[
                  { name: "Active", value: data.activeServicesCount ?? data.totalServices ?? 0, color: "#3b82f6" },
                  { name: "Completed", value: data.completedClientTasks ?? 0, color: "#10b981" },
                  { name: "Pending", value: data.pendingClientTasks ?? 0, color: "#f59e0b" },
                ]}
                centerValue={data.totalServices ?? 0}
                centerLabel="SERVICES"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val">{data.totalServices ?? 0}</div>
                  <div className="ciis-metric-chip-lbl">Total</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.activeServicesCount ?? data.totalServices ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Active</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#d97706" }}>
                    {data.pendingClientTasks ?? data.pendingServiceTasks ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Pending Tasks</div>
                </div>
              </div>
            </>
          )}

          {/* 13. Client Portal Overview */}
          {sec.key === "clientPortalOverview" && (
            <>
              {/* Graph Overview: Portal Documents Donut */}
              <DonutChartOverview
                data={[
                  { name: "Shared", value: data.sharedDocumentsCount ?? data.totalDocuments ?? 0, color: "#3b82f6" },
                  { name: "Pending", value: data.pendingDocumentsCount ?? 0, color: "#f59e0b" },
                  { name: "Portal Users", value: data.portalAccountsCount ?? 0, color: "#10b981" },
                ]}
                centerValue={data.sharedDocumentsCount ?? data.totalDocuments ?? 0}
                centerLabel="DOCS"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                    {data.sharedDocumentsCount ?? data.totalDocuments ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Documents</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#d97706" }}>
                    {data.pendingDocumentsCount ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Pending Review</div>
                </div>
              </div>
            </>
          )}

          {/* 14. Support Overview */}
          {sec.key === "supportOverview" && (
            <>
              {/* Graph Overview: Support Tickets Status Donut */}
              <DonutChartOverview
                data={[
                  { name: "Open", value: data.openCount ?? data.openTickets ?? 0, color: "#ef4444" },
                  { name: "In Progress", value: data.inProgressCount ?? data.inProgressTickets ?? 0, color: "#f59e0b" },
                  { name: "Resolved", value: data.resolvedCount ?? data.resolvedTickets ?? 0, color: "#10b981" },
                ]}
                centerValue={data.totalTickets ?? 0}
                centerLabel="TICKETS"
              />

              <div className="ciis-metric-chips-row">
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val">{data.totalTickets ?? 0}</div>
                  <div className="ciis-metric-chip-lbl">Total</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#dc2626" }}>
                    {data.openCount ?? data.openTickets ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Open</div>
                </div>
                <div className="ciis-metric-chip">
                  <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                    {data.resolvedCount ?? data.resolvedTickets ?? 0}
                  </div>
                  <div className="ciis-metric-chip-lbl">Resolved</div>
                </div>
              </div>
            </>
          )}

          {/* 15. Employee Activity Overview */}
          {sec.key === "employeeActivityOverview" && (() => {
            const chartData =
              Array.isArray(data.actionDistribution) && data.actionDistribution.length > 0
                ? data.actionDistribution.slice(0, 4).map((a) => ({
                    name: String(a.action || "action").replace(/_/g, " ").slice(0, 10),
                    count: a.count,
                    color: "#3b82f6",
                  }))
                : [
                    { name: "Updates", count: data.activityEventsCount || 10, color: "#3b82f6" },
                    { name: "Tasks", count: 5, color: "#10b981" },
                  ];

            return (
              <>
                {/* Graph Overview: Bar Chart of Action Distribution */}
                <div className="ciis-dist-labels" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                  <span>Daily Action Distribution</span>
                  <span>{data.totalActivities ?? 0} Events</span>
                </div>
                <MiniBarChartOverview data={chartData} dataKey="count" nameKey="name" barColor="#3b82f6" />

                <div className="ciis-metric-chips-row">
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                      {data.totalActivities ?? data.activityEventsCount ?? 0}
                    </div>
                    <div className="ciis-metric-chip-lbl">Total Actions</div>
                  </div>
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                      {data.todayActivitiesCount ?? data.activeUsersTodayCount ?? 0}
                    </div>
                    <div className="ciis-metric-chip-lbl">Today</div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 16. Attendance Analytics Overview */}
          {sec.key === "attendanceAnalyticsOverview" && (() => {
            const trends = Array.isArray(data.sevenDayTrends)
              ? data.sevenDayTrends
              : Array.isArray(data.dailyTrends)
              ? data.dailyTrends
              : [];
            const punctuality = data.punctualityRate ?? data.averagePunctualityRate ?? data.averageRate ?? 0;
            return (
              <>
                <div className="ciis-dist-labels" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                  <span>7-Day Attendance Rate Trend</span>
                  <span>Avg: {punctuality}%</span>
                </div>

                {/* Graph Overview: Smooth 7-Day Area Trend Chart */}
                <MiniAreaTrendChart data={trends} />

                <div className="ciis-metric-chips-row">
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                      {punctuality}%
                    </div>
                    <div className="ciis-metric-chip-lbl">Avg Rate</div>
                  </div>
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val" style={{ color: "#2563eb" }}>
                      7 Days
                    </div>
                    <div className="ciis-metric-chip-lbl">Period</div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 17. Task Analytics Overview */}
          {sec.key === "taskAnalyticsOverview" && (() => {
            const highCount = Array.isArray(data.priorityDistribution)
              ? data.priorityDistribution.find((p) => String(p.priority).toLowerCase() === "high")?.count ?? 0
              : data.priorityDistribution?.high ?? 0;
            const medCount = Array.isArray(data.priorityDistribution)
              ? data.priorityDistribution.find((p) => String(p.priority).toLowerCase() === "medium")?.count ?? 0
              : data.priorityDistribution?.medium ?? 0;
            const lowCount = Array.isArray(data.priorityDistribution)
              ? data.priorityDistribution.find((p) => String(p.priority).toLowerCase() === "low")?.count ?? 0
              : data.priorityDistribution?.low ?? 0;

            const priorityChartData = [
              { name: "High", count: highCount, color: "#ef4444" },
              { name: "Medium", count: medCount, color: "#f59e0b" },
              { name: "Low", count: lowCount, color: "#10b981" },
            ];

            return (
              <>
                <div className="ciis-dist-labels" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                  <span>Task Priority Distribution</span>
                  <span>Velocity: {data.completionRate ?? data.taskCompletionRate ?? 0}%</span>
                </div>

                {/* Graph Overview: Task Priorities Bar Chart */}
                <MiniBarChartOverview data={priorityChartData} dataKey="count" nameKey="name" barColor="#f59e0b" />

                <div className="ciis-metric-chips-row">
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val" style={{ color: "#dc2626" }}>
                      {highCount}
                    </div>
                    <div className="ciis-metric-chip-lbl">High</div>
                  </div>
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val" style={{ color: "#d97706" }}>
                      {medCount}
                    </div>
                    <div className="ciis-metric-chip-lbl">Medium</div>
                  </div>
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                      {lowCount}
                    </div>
                    <div className="ciis-metric-chip-lbl">Low</div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 18. Team Visibility Overview */}
          {sec.key === "teamVisibilityOverview" && (() => {
            const depts = Array.isArray(data.departments)
              ? data.departments
              : Array.isArray(data.departmentEmployeesDistribution)
              ? data.departmentEmployeesDistribution
              : [];

            const deptChartData = depts.slice(0, 4).map((d) => ({
              name: String(d.name || "Dept").slice(0, 8),
              count: d.employeeCount ?? d.count ?? 0,
              color: "#7c3aed",
            }));

            return (
              <>
                <div className="ciis-dist-labels" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                  <span>Department Capacity Breakdown</span>
                  <span>{data.totalDepartmentsCount ?? depts.length} Depts</span>
                </div>

                {/* Graph Overview: Department Capacity Bar Chart */}
                <MiniBarChartOverview data={deptChartData} dataKey="count" nameKey="name" barColor="#7c3aed" />

                <div className="ciis-metric-chips-row">
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val">{data.totalDepartmentsCount ?? data.totalDepartments ?? depts.length}</div>
                    <div className="ciis-metric-chip-lbl">Departments</div>
                  </div>
                  <div className="ciis-metric-chip">
                    <div className="ciis-metric-chip-val">{data.totalBranchesCount ?? data.totalBranches ?? 0}</div>
                    <div className="ciis-metric-chip-lbl">Branches</div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 19. Payroll Reports Overview */}
          {sec.key === "payrollReportsOverview" && (
            <>
              {data.authorized === false || data.restricted ? (
                <div className="ciis-restricted-box">
                  <ShieldAlert size={18} />
                  <span>Financial salary reports restricted by authorization role.</span>
                </div>
              ) : (
                <>
                  {/* Graph Overview: Disbursed vs Pending Runs Donut */}
                  <DonutChartOverview
                    data={[
                      { name: "Disbursed", value: data.processedRuns ?? data.totalHistoricalRuns ?? 0, color: "#10b981" },
                      {
                        name: "Available",
                        value: Math.max(
                          (data.payrollReportsCount ?? data.totalHistoricalRuns ?? 0) - (data.processedRuns ?? 0),
                          0
                        ),
                        color: "#3b82f6",
                      },
                    ]}
                    centerValue={data.payrollReportsCount ?? data.totalHistoricalRuns ?? 0}
                    centerLabel="RUNS"
                  />

                  <div className="ciis-metric-chips-row">
                    <div className="ciis-metric-chip">
                      <div className="ciis-metric-chip-val">{data.payrollReportsCount ?? data.totalHistoricalRuns ?? 0}</div>
                      <div className="ciis-metric-chip-lbl">Available Runs</div>
                    </div>
                    <div className="ciis-metric-chip">
                      <div className="ciis-metric-chip-val" style={{ color: "#059669" }}>
                        {data.processedRuns ?? 0}
                      </div>
                      <div className="ciis-metric-chip-lbl">Disbursed</div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };


  // =========================================================================
  // Executive Multi-Widget Module Renderers (Full Page Detailed View)
  // =========================================================================

  const renderExecutiveModule = (sec) => {
    const data = dashboardData?.sections?.[sec.key] || dashboardData?.data?.[sec.key] || {};
    const IconComp = sec.icon;

    // Resolve KPIs for each module
    let kpiList = [];
    let leftChartTitle = "Status Distribution";
    let leftChart = null;
    let rightChartTitle = "Detailed Breakdown";
    let rightChart = null;
    let tableTitle = "Recent Database Records";
    let tableHeaders = [];
    let tableRows = [];
    let insightText = "All metrics synced from MongoDB database.";

    switch (sec.key) {
      case "employeesOverview":
        kpiList = [
          { lbl: "Total Staff", val: data.totalEmployees ?? 0, color: "#2563eb" },
          { lbl: "Active Staff", val: data.activeEmployees ?? 0, color: "#10b981" },
          { lbl: "Inactive Staff", val: data.inactiveEmployees ?? 0, color: "#ef4444" },
          { lbl: "Departments", val: data.departmentDistribution?.length ?? 0, color: "#8b5cf6" },
          { lbl: "Recent Added", val: data.recentEmployees?.length ?? 0, color: "#f59e0b" },
        ];
        leftChartTitle = "Staff Status Distribution";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Active", value: data.activeEmployees ?? 0, color: "#10b981" },
              { name: "Inactive", value: data.inactiveEmployees ?? 0, color: "#ef4444" },
              { name: "New Hires", value: data.recentEmployees?.length ?? 0, color: "#3b82f6" },
            ]}
            centerValue={data.totalEmployees ?? 0}
            centerLabel="TOTAL"
            height={160}
          />
        );
        rightChartTitle = "Department Staff Capacity";
        rightChart = (
          <MiniBarChartOverview
            data={(data.departmentDistribution || []).map((d) => ({
              name: d.name,
              count: d.count,
              color: "#3b82f6",
            }))}
            height={160}
          />
        );
        tableTitle = "Recent Registered Employees";
        tableHeaders = ["Employee Name", "Email", "Department", "Role", "Join Date"];
        tableRows = (data.recentEmployees || []).map((emp) => [
          <span style={{ fontWeight: 600, color: "#1e293b" }}>{emp.name || "Employee"}</span>,
          emp.email || "—",
          <span className="ciis-badge ciis-badge-info">{emp.department || "General"}</span>,
          emp.role || "Staff",
          emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString() : "Active",
        ]);
        insightText = `Workforce health optimal with ${data.activeEmployees ?? 0} active employees across ${data.departmentDistribution?.length ?? 0} departments.`;
        break;

      case "attendanceOverview":
        kpiList = [
          { lbl: "Active Roster", val: data.totalActive ?? 0, color: "#2563eb" },
          { lbl: "Present Today", val: data.presentToday ?? 0, color: "#10b981" },
          { lbl: "Absent Today", val: data.absentToday ?? 0, color: "#ef4444" },
          { lbl: "Late Check-ins", val: data.lateArrivals ?? 0, color: "#f59e0b" },
          { lbl: "Attendance Rate", val: `${data.attendanceRate ?? 0}%`, color: "#059669" },
        ];
        leftChartTitle = "Today's Attendance Status";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Present", value: data.presentToday ?? 0, color: "#10b981" },
              { name: "Absent", value: data.absentToday ?? 0, color: "#ef4444" },
              { name: "Late", value: data.lateArrivals ?? 0, color: "#f59e0b" },
              { name: "Half Day", value: data.halfDayToday ?? 0, color: "#8b5cf6" },
            ]}
            centerValue={`${data.attendanceRate ?? 0}%`}
            centerLabel="RATE"
            height={160}
          />
        );
        rightChartTitle = "7-Day Attendance Trend Curve";
        rightChart = (
          <MiniAreaTrendChart data={dashboardData?.sections?.attendanceAnalyticsOverview?.sevenDayTrends || []} height={160} />
        );
        tableTitle = "Today's Live Punch & Attendance Logs";
        tableHeaders = ["Employee", "Status", "In Time", "Out Time", "Late Mark"];
        tableRows = (data.recentPunches || []).map((p) => [
          <span style={{ fontWeight: 600 }}>{p.userName || "Staff Member"}</span>,
          <span className={`ciis-badge ${["PRESENT", "HALFDAY"].includes(p.status) ? "ciis-badge-success" : "ciis-badge-warning"}`}>
            {p.status || "PRESENT"}
          </span>,
          p.inTime || "—",
          p.outTime || "Active",
          p.lateBy && p.lateBy !== "00:00:00" ? <span style={{ color: "#d97706", fontWeight: 600 }}>{p.lateBy}</span> : "On Time",
        ]);
        insightText = `Daily attendance rate stands at ${data.attendanceRate ?? 0}% with ${data.lateArrivals ?? 0} late marks logged today.`;
        break;

      case "leavesOverview":
        kpiList = [
          { lbl: "On Leave Today", val: data.onLeaveTodayCount ?? 0, color: "#f59e0b" },
          { lbl: "Pending Approvals", val: data.pendingCount ?? 0, color: "#3b82f6" },
          { lbl: "Approved Leaves", val: data.approvedCount ?? 0, color: "#10b981" },
          { lbl: "Rejected Requests", val: data.rejectedCount ?? 0, color: "#ef4444" },
        ];
        leftChartTitle = "Leave Application Pipeline";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Approved", value: data.approvedCount ?? 0, color: "#10b981" },
              { name: "Pending", value: data.pendingCount ?? 0, color: "#3b82f6" },
              { name: "Rejected", value: data.rejectedCount ?? 0, color: "#ef4444" },
            ]}
            centerValue={data.onLeaveTodayCount ?? 0}
            centerLabel="ON LEAVE"
            height={160}
          />
        );
        rightChartTitle = "Leave Approvals vs Pending";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Approved", count: data.approvedCount ?? 0, color: "#10b981" },
              { name: "Pending", count: data.pendingCount ?? 0, color: "#3b82f6" },
              { name: "Rejected", count: data.rejectedCount ?? 0, color: "#ef4444" },
            ]}
            height={160}
          />
        );
        tableTitle = "Recent Leave Applications";
        tableHeaders = ["Employee", "Leave Type", "Duration", "Status", "Reason / Remarks"];
        tableRows = (data.recentLeaves || []).map((l) => [
          <span style={{ fontWeight: 600 }}>{l.userName || "Employee"}</span>,
          l.type || "General",
          `${l.days || 1} Day(s)`,
          <span className={`ciis-badge ${l.status?.toLowerCase().includes("approved") ? "ciis-badge-success" : l.status?.toLowerCase().includes("rejected") ? "ciis-badge-danger" : "ciis-badge-warning"}`}>
            {l.status || "Pending"}
          </span>,
          l.reason || "Personal Leave",
        ]);
        insightText = `${data.pendingCount ?? 0} pending leave applications requiring supervisor review.`;
        break;

      case "payrollOverview":
        if (data.authorized === false) {
          kpiList = [{ lbl: "Access", val: "Restricted", color: "#ef4444" }];
          insightText = "Financial payroll data is protected and restricted to authorized salary administrators.";
        } else {
          kpiList = [
            { lbl: "Pay Period", val: data.latestMonth || "Current Month", color: "#2563eb" },
            { lbl: "Status", val: data.status || "In Preparation", color: "#f59e0b" },
            { lbl: "Processed Staff", val: data.processedEmployees ?? 0, color: "#10b981" },
            { lbl: "Pending Staff", val: data.pendingEmployees ?? 0, color: "#3b82f6" },
            { lbl: "Net Liability", val: `₹${(data.totalPayrollCost ?? 0).toLocaleString()}`, color: "#059669" },
          ];
          leftChartTitle = "Payroll Processing Ratio";
          leftChart = (
            <DonutChartOverview
              data={[
                { name: "Processed", value: data.processedEmployees ?? 0, color: "#10b981" },
                { name: "Pending", value: data.pendingEmployees ?? 0, color: "#f59e0b" },
              ]}
              centerValue={data.processedEmployees ?? 0}
              centerLabel="PROCESSED"
              height={160}
            />
          );
          rightChartTitle = "Estimated Payout vs Deductions";
          rightChart = (
            <MiniBarChartOverview
              data={[
                { name: "Net Payout", count: data.totalPayrollCost ?? 0, color: "#059669" },
                { name: "Deductions", count: data.deductionsTotal ?? 0, color: "#e11d48" },
              ]}
              height={160}
            />
          );
          tableTitle = "Payroll Summary Details";
          tableHeaders = ["Metric", "Description", "Value", "Status"];
          tableRows = [
            ["Current Run Month", "Calculated payroll run period", data.latestMonth || "Current", <span className="ciis-badge ciis-badge-info">Active</span>],
            ["Processed Employees", "Staff members processed in latest run", data.processedEmployees ?? 0, <span className="ciis-badge ciis-badge-success">Ready</span>],
            ["Pending Employees", "Staff pending salary computation", data.pendingEmployees ?? 0, <span className="ciis-badge ciis-badge-warning">Pending</span>],
            ["Net Salary Cost", "Total estimated disbursed compensation", `₹${(data.totalPayrollCost ?? 0).toLocaleString()}`, <span className="ciis-badge ciis-badge-success">Verified</span>],
          ];
          insightText = `Payroll cycle status: ${data.status || "In Preparation"}. Total estimated payroll cost: ₹${(data.totalPayrollCost ?? 0).toLocaleString()}.`;
        }
        break;

      case "assetsOverview":
        kpiList = [
          { lbl: "Total Assets", val: data.totalAssetsCount ?? 0, color: "#2563eb" },
          { lbl: "Total Quantity", val: data.totalQuantity ?? 0, color: "#6366f1" },
          { lbl: "Assigned Units", val: data.assignedCount ?? 0, color: "#10b981" },
          { lbl: "Available in Stock", val: data.availableCount ?? 0, color: "#059669" },
          { lbl: "Pending Requests", val: data.pendingRequestsCount ?? 0, color: "#f59e0b" },
        ];
        leftChartTitle = "Asset Utilization Status";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Assigned", value: data.assignedCount ?? 0, color: "#10b981" },
              { name: "Available", value: data.availableCount ?? 0, color: "#3b82f6" },
              { name: "Repair", value: data.maintenanceCount ?? 0, color: "#ef4444" },
            ]}
            centerValue={data.totalAssetsCount ?? 0}
            centerLabel="TOTAL"
            height={160}
          />
        );
        rightChartTitle = "Inventory Breakdown";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Assigned", count: data.assignedCount ?? 0, color: "#10b981" },
              { name: "Available", count: data.availableCount ?? 0, color: "#3b82f6" },
              { name: "Requests", count: data.pendingRequestsCount ?? 0, color: "#f59e0b" },
            ]}
            height={160}
          />
        );
        tableTitle = "Recent Employee Asset Requests";
        tableHeaders = ["Asset Name", "Request Type", "Department", "Status", "Request Date"];
        tableRows = (data.recentRequests || []).map((req) => [
          <span style={{ fontWeight: 600 }}>{req.assetName || "Equipment"}</span>,
          req.requestType || "Allocation",
          <span className="ciis-badge ciis-badge-info">{req.department || "General"}</span>,
          <span className={`ciis-badge ${req.status?.toLowerCase().includes("approved") ? "ciis-badge-success" : "ciis-badge-warning"}`}>
            {req.status || "Pending"}
          </span>,
          req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "Recent",
        ]);
        insightText = `${data.availableCount ?? 0} units available in inventory. ${data.pendingRequestsCount ?? 0} requests awaiting allocation.`;
        break;

      case "tasksOverview":
        kpiList = [
          { lbl: "Total Tasks", val: data.totalTasks ?? 0, color: "#2563eb" },
          { lbl: "Completed", val: data.completedCount ?? 0, color: "#10b981" },
          { lbl: "In Progress", val: data.inProgressCount ?? 0, color: "#3b82f6" },
          { lbl: "Pending / Hold", val: data.pendingCount ?? 0, color: "#f59e0b" },
          { lbl: "Overdue Risk", val: data.overdueCount ?? 0, color: "#ef4444" },
        ];
        leftChartTitle = "Task Completion Health";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Completed", value: data.completedCount ?? 0, color: "#10b981" },
              { name: "In Progress", value: data.inProgressCount ?? 0, color: "#3b82f6" },
              { name: "Pending", value: data.pendingCount ?? 0, color: "#f59e0b" },
              { name: "Overdue", value: data.overdueCount ?? 0, color: "#ef4444" },
            ]}
            centerValue={`${data.completionRate ?? 0}%`}
            centerLabel="DONE"
            height={160}
          />
        );
        rightChartTitle = "Task Priority Distribution";
        rightChart = (
          <MiniBarChartOverview
            data={(dashboardData?.sections?.taskAnalyticsOverview?.priorityDistribution || [
              { name: "High", count: 0, color: "#ef4444" },
              { name: "Medium", count: 0, color: "#f59e0b" },
              { name: "Low", count: 0, color: "#10b981" },
            ]).map(p => ({ name: p.priority || p.name, count: p.count, color: p.color || "#3b82f6" }))}
            height={160}
          />
        );
        tableTitle = "Priority & Active Tasks";
        tableHeaders = ["Task Title", "Priority", "Status", "Due Date"];
        tableRows = (data.recentTasks || []).map((t) => [
          <span style={{ fontWeight: 600 }}>{t.title || "Task"}</span>,
          <span className={`ciis-badge ${t.priority === "high" || t.priority === "urgent" ? "ciis-badge-danger" : t.priority === "medium" ? "ciis-badge-warning" : "ciis-badge-info"}`}>
            {t.priority || "Medium"}
          </span>,
          <span className={`ciis-badge ${t.status === "completed" ? "ciis-badge-success" : t.status === "in-progress" ? "ciis-badge-info" : "ciis-badge-warning"}`}>
            {t.status || "Pending"}
          </span>,
          t.dueDateTime ? new Date(t.dueDateTime).toLocaleDateString() : "No Deadline",
        ]);
        insightText = `Overall task completion rate is ${data.completionRate ?? 0}%. ${data.overdueCount ?? 0} tasks require urgent review.`;
        break;

      case "projectsOverview":
        kpiList = [
          { lbl: "Total Projects", val: data.totalProjects ?? 0, color: "#2563eb" },
          { lbl: "Active Delivery", val: data.activeCount ?? 0, color: "#10b981" },
          { lbl: "Completed", val: data.completedCount ?? 0, color: "#059669" },
          { lbl: "In Planning", val: data.planningCount ?? 0, color: "#f59e0b" },
          { lbl: "Delayed", val: data.delayedCount ?? 0, color: "#ef4444" },
        ];
        leftChartTitle = "Project Lifecycle Status";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Active", value: data.activeCount ?? 0, color: "#10b981" },
              { name: "Completed", value: data.completedCount ?? 0, color: "#059669" },
              { name: "Planning", value: data.planningCount ?? 0, color: "#f59e0b" },
              { name: "Delayed", value: data.delayedCount ?? 0, color: "#ef4444" },
            ]}
            centerValue={data.totalProjects ?? 0}
            centerLabel="PROJECTS"
            height={160}
          />
        );
        rightChartTitle = "Project Pipeline Health";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Active", count: data.activeCount ?? 0, color: "#10b981" },
              { name: "Completed", count: data.completedCount ?? 0, color: "#059669" },
              { name: "Planning", count: data.planningCount ?? 0, color: "#f59e0b" },
              { name: "Delayed", count: data.delayedCount ?? 0, color: "#ef4444" },
            ]}
            height={160}
          />
        );
        tableTitle = "Active Projects & Milestone Deadlines";
        tableHeaders = ["Project Name", "Progress", "Status", "Target Deadline"];
        tableRows = (data.recentProjects || []).map((p) => [
          <span style={{ fontWeight: 600 }}>{p.title || "Project"}</span>,
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "80px", height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${p.progress || 0}%`, height: "100%", background: "#3b82f6" }}></div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700 }}>{p.progress || 0}%</span>
          </div>,
          <span className={`ciis-badge ${p.status === "active" ? "ciis-badge-success" : p.status === "completed" ? "ciis-badge-info" : "ciis-badge-warning"}`}>
            {p.status || "Active"}
          </span>,
          p.endDate ? new Date(p.endDate).toLocaleDateString() : "Ongoing",
        ]);
        insightText = `${data.activeCount ?? 0} active project workstreams currently being executed.`;
        break;

      case "meetingsOverview":
        kpiList = [
          { lbl: "Total Scheduled", val: data.totalMeetings ?? 0, color: "#2563eb" },
          { lbl: "Today's Meetings", val: data.todayMeetingsCount ?? 0, color: "#f59e0b" },
          { lbl: "Upcoming Sessions", val: data.upcomingMeetingsCount ?? 0, color: "#10b981" },
          { lbl: "Completed Meetings", val: data.completedMeetingsCount ?? 0, color: "#6b7280" },
        ];
        leftChartTitle = "Meeting Schedule Distribution";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Today", value: data.todayMeetingsCount ?? 0, color: "#f59e0b" },
              { name: "Upcoming", value: data.upcomingMeetingsCount ?? 0, color: "#10b981" },
              { name: "Completed", value: data.completedMeetingsCount ?? 0, color: "#6b7280" },
            ]}
            centerValue={data.todayMeetingsCount ?? 0}
            centerLabel="TODAY"
            height={160}
          />
        );
        rightChartTitle = "Meeting Volume";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Today", count: data.todayMeetingsCount ?? 0, color: "#f59e0b" },
              { name: "Upcoming", count: data.upcomingMeetingsCount ?? 0, color: "#10b981" },
              { name: "Completed", count: data.completedMeetingsCount ?? 0, color: "#6b7280" },
            ]}
            height={160}
          />
        );
        tableTitle = "Upcoming & Scheduled Meetings";
        tableHeaders = ["Meeting Title", "Date & Time", "Status"];
        tableRows = (data.recentMeetings || []).map((m) => [
          <span style={{ fontWeight: 600 }}>{m.title || "Meeting"}</span>,
          m.date ? new Date(m.date).toLocaleString() : "Scheduled",
          <span className="ciis-badge ciis-badge-info">{m.status || "Scheduled"}</span>,
        ]);
        insightText = `${data.todayMeetingsCount ?? 0} meetings scheduled for today across internal and client teams.`;
        break;

      case "chatOverview":
        kpiList = [
          { lbl: "Total Channels", val: data.totalChannels ?? 0, color: "#2563eb" },
          { lbl: "Direct Channels", val: data.directChannelsCount ?? 0, color: "#10b981" },
          { lbl: "General Rooms", val: data.generalChannelsCount ?? 0, color: "#8b5cf6" },
        ];
        leftChartTitle = "Channel Type Distribution";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Direct", value: data.directChannelsCount ?? 0, color: "#10b981" },
              { name: "General", value: data.generalChannelsCount ?? 0, color: "#8b5cf6" },
            ]}
            centerValue={data.totalChannels ?? 0}
            centerLabel="CHANNELS"
            height={160}
          />
        );
        rightChartTitle = "Channel Communication Hubs";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Direct", count: data.directChannelsCount ?? 0, color: "#10b981" },
              { name: "General", count: data.generalChannelsCount ?? 0, color: "#8b5cf6" },
            ]}
            height={160}
          />
        );
        tableTitle = "Active Communication Groups";
        tableHeaders = ["Channel Name", "Category", "Last Activity"];
        tableRows = (data.recentChannels || []).map((ch) => [
          <span style={{ fontWeight: 600 }}>{ch.name || "Channel"}</span>,
          <span className="ciis-badge ciis-badge-info">Active Channel</span>,
          ch.updatedAt ? new Date(ch.updatedAt).toLocaleDateString() : "Recent",
        ]);
        insightText = `Live collaboration active across ${data.totalChannels ?? 0} channels.`;
        break;

      case "alertsOverview":
        kpiList = [
          { lbl: "Total Broadcasts", val: data.totalAlerts ?? 0, color: "#2563eb" },
          { lbl: "Unseen Notices", val: data.unseenAlertsCount ?? 0, color: "#ef4444" },
          { lbl: "High Priority", val: data.highPriorityCount ?? 0, color: "#f59e0b" },
        ];
        leftChartTitle = "Alert Urgency Breakdown";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Unseen", value: data.unseenAlertsCount ?? 0, color: "#ef4444" },
              { name: "High Priority", value: data.highPriorityCount ?? 0, color: "#f59e0b" },
              { name: "Standard", value: Math.max((data.totalAlerts ?? 0) - (data.highPriorityCount ?? 0), 0), color: "#3b82f6" },
            ]}
            centerValue={data.unseenAlertsCount ?? 0}
            centerLabel="UNSEEN"
            height={160}
          />
        );
        rightChartTitle = "Broadcast Volumes";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Unseen", count: data.unseenAlertsCount ?? 0, color: "#ef4444" },
              { name: "High Urgency", count: data.highPriorityCount ?? 0, color: "#f59e0b" },
              { name: "Standard", count: Math.max((data.totalAlerts ?? 0) - (data.highPriorityCount ?? 0), 0), color: "#3b82f6" },
            ]}
            height={160}
          />
        );
        tableTitle = "Recent Company Broadcasts";
        tableHeaders = ["Announcement Title", "Urgency Category", "Broadcast Date"];
        tableRows = (data.recentAlerts || []).map((a) => [
          <span style={{ fontWeight: 600 }}>{a.title || "Alert"}</span>,
          <span className={`ciis-badge ${a.type?.toLowerCase().includes("urgent") || a.type?.toLowerCase().includes("high") ? "ciis-badge-danger" : "ciis-badge-info"}`}>
            {a.type || "Notice"}
          </span>,
          a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Recent",
        ]);
        insightText = `${data.unseenAlertsCount ?? 0} unread company notices active in the system.`;
        break;

      case "clientManagementOverview":
        kpiList = [
          { lbl: "Total Accounts", val: data.totalClients ?? 0, color: "#2563eb" },
          { lbl: "Active Clients", val: data.activeClients ?? 0, color: "#10b981" },
          { lbl: "Inactive Accounts", val: data.inactiveClients ?? 0, color: "#ef4444" },
          { lbl: "New Onboarded (30d)", val: data.newClientsCount ?? 0, color: "#f59e0b" },
        ];
        leftChartTitle = "Client Account Status";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Active", value: data.activeClients ?? 0, color: "#10b981" },
              { name: "Inactive", value: data.inactiveClients ?? 0, color: "#ef4444" },
              { name: "New (30d)", value: data.newClientsCount ?? 0, color: "#3b82f6" },
            ]}
            centerValue={data.activeClients ?? 0}
            centerLabel="ACTIVE"
            height={160}
          />
        );
        rightChartTitle = "Portfolio Distribution";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Active", count: data.activeClients ?? 0, color: "#10b981" },
              { name: "Inactive", count: data.inactiveClients ?? 0, color: "#ef4444" },
              { name: "New", count: data.newClientsCount ?? 0, color: "#3b82f6" },
            ]}
            height={160}
          />
        );
        tableTitle = "Recent Corporate Client Accounts";
        tableHeaders = ["Client Name", "Company Name", "Status", "Onboarded Date"];
        tableRows = (data.recentClients || []).map((c) => [
          <span style={{ fontWeight: 600 }}>{c.name || "Client"}</span>,
          c.company || "Enterprise",
          <span className={`ciis-badge ${c.status === "active" ? "ciis-badge-success" : "ciis-badge-warning"}`}>
            {c.status || "Active"}
          </span>,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent",
        ]);
        insightText = `${data.activeClients ?? 0} active client accounts managed across enterprise contracts.`;
        break;

      case "clientServicesOverview":
        kpiList = [
          { lbl: "Total Services", val: data.totalServices ?? 0, color: "#2563eb" },
          { lbl: "Active Subscriptions", val: data.activeServices ?? 0, color: "#10b981" },
          { lbl: "Completed Tasks", val: data.completedTasks ?? 0, color: "#059669" },
          { lbl: "Pending Delivery", val: data.pendingTasks ?? 0, color: "#f59e0b" },
        ];
        leftChartTitle = "Service Delivery Status";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Active Services", value: data.activeServices ?? 0, color: "#10b981" },
              { name: "Completed Tasks", value: data.completedTasks ?? 0, color: "#059669" },
              { name: "Pending Tasks", value: data.pendingTasks ?? 0, color: "#f59e0b" },
            ]}
            centerValue={data.activeServices ?? 0}
            centerLabel="SERVICES"
            height={160}
          />
        );
        rightChartTitle = "Service Execution Pipeline";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Active", count: data.activeServices ?? 0, color: "#10b981" },
              { name: "Completed", count: data.completedTasks ?? 0, color: "#059669" },
              { name: "Pending", count: data.pendingTasks ?? 0, color: "#f59e0b" },
            ]}
            height={160}
          />
        );
        tableTitle = "Client Delivery Tasks";
        tableHeaders = ["Task Reference", "Delivery Status", "Logged Date"];
        tableRows = (data.recentClientTasks || []).map((t, idx) => [
          <span style={{ fontWeight: 600 }}>Task #{idx + 1}</span>,
          <span className={`ciis-badge ${t.status === "completed" ? "ciis-badge-success" : "ciis-badge-warning"}`}>
            {t.status || "In Delivery"}
          </span>,
          t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Recent",
        ]);
        insightText = `${data.activeServices ?? 0} services actively delivered with ${data.completedTasks ?? 0} completed milestones.`;
        break;

      case "clientPortalOverview":
        kpiList = [
          { lbl: "Total Documents", val: data.totalDocuments ?? 0, color: "#2563eb" },
          { lbl: "Shared Files", val: data.sharedDocuments ?? 0, color: "#10b981" },
          { lbl: "Under Review", val: data.pendingReviewDocuments ?? 0, color: "#f59e0b" },
        ];
        leftChartTitle = "Document Exchange Status";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Shared", value: data.sharedDocuments ?? 0, color: "#10b981" },
              { name: "Review", value: data.pendingReviewDocuments ?? 0, color: "#f59e0b" },
            ]}
            centerValue={data.totalDocuments ?? 0}
            centerLabel="DOCS"
            height={160}
          />
        );
        rightChartTitle = "Document Compliance Volume";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Shared", count: data.sharedDocuments ?? 0, color: "#10b981" },
              { name: "Review", count: data.pendingReviewDocuments ?? 0, color: "#f59e0b" },
            ]}
            height={160}
          />
        );
        tableTitle = "Recent Portal Documents";
        tableHeaders = ["Document Name", "Status", "Date"];
        tableRows = (data.recentDocuments || []).map((d, idx) => [
          <span style={{ fontWeight: 600 }}>Document #{idx + 1}</span>,
          <span className="ciis-badge ciis-badge-info">{d.status || "Shared"}</span>,
          d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "Recent",
        ]);
        insightText = `${data.sharedDocuments ?? 0} client documents synchronized and accessible through the client portal.`;
        break;

      case "supportOverview":
        kpiList = [
          { lbl: "Total Tickets", val: data.totalTickets ?? 0, color: "#2563eb" },
          { lbl: "Open Tickets", val: data.openTickets ?? 0, color: "#ef4444" },
          { lbl: "In Progress", val: data.inProgressTickets ?? 0, color: "#f59e0b" },
          { lbl: "Resolved", val: data.resolvedTickets ?? 0, color: "#10b981" },
          { lbl: "Urgent Escalated", val: data.urgentTickets ?? 0, color: "#dc2626" },
        ];
        leftChartTitle = "Ticket Resolution Health";
        leftChart = (
          <DonutChartOverview
            data={[
              { name: "Open", value: data.openTickets ?? 0, color: "#ef4444" },
              { name: "In Progress", value: data.inProgressTickets ?? 0, color: "#f59e0b" },
              { name: "Resolved", value: data.resolvedTickets ?? 0, color: "#10b981" },
            ]}
            centerValue={data.openTickets ?? 0}
            centerLabel="OPEN"
            height={160}
          />
        );
        rightChartTitle = "Ticket Resolution Breakdown";
        rightChart = (
          <MiniBarChartOverview
            data={[
              { name: "Open", count: data.openTickets ?? 0, color: "#ef4444" },
              { name: "In Progress", count: data.inProgressTickets ?? 0, color: "#f59e0b" },
              { name: "Resolved", count: data.resolvedTickets ?? 0, color: "#10b981" },
            ]}
            height={160}
          />
        );
        tableTitle = "Recent Support Tickets";
        tableHeaders = ["Ticket Reference", "Priority", "Status", "Date"];
        tableRows = (data.recentTickets || []).map((t, idx) => [
          <span style={{ fontWeight: 600 }}>Ticket #{idx + 1}</span>,
          <span className={`ciis-badge ${t.priority === "urgent" || t.priority === "high" ? "ciis-badge-danger" : "ciis-badge-info"}`}>
            {t.priority || "Normal"}
          </span>,
          <span className={`ciis-badge ${t.status === "resolved" ? "ciis-badge-success" : t.status === "in-progress" ? "ciis-badge-warning" : "ciis-badge-danger"}`}>
            {t.status || "Open"}
          </span>,
          t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Recent",
        ]);
        insightText = `${data.openTickets ?? 0} open support tickets currently awaiting resolution.`;
        break;

      case "employeeActivityOverview":
        kpiList = [
          { lbl: "Total Audit Events", val: data.totalActivitiesCount ?? 0, color: "#2563eb" },
          { lbl: "Action Types", val: data.actionTypeBreakdown?.length ?? 0, color: "#10b981" },
          { lbl: "Recent Logged", val: data.recentActivities?.length ?? 0, color: "#8b5cf6" },
        ];
        leftChartTitle = "Action Type Distribution";
        leftChart = (
          <MiniBarChartOverview
            data={(data.actionTypeBreakdown || []).map((a) => ({
              name: a.action,
              count: a.count,
              color: "#3b82f6",
            }))}
            height={160}
          />
        );
        rightChartTitle = "Activity Event Density";
        rightChart = (
          <DonutChartOverview
            data={(data.actionTypeBreakdown || []).map((a, i) => ({
              name: a.action,
              value: a.count,
              color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][i % 5],
            }))}
            centerValue={data.totalActivitiesCount ?? 0}
            centerLabel="EVENTS"
            height={160}
          />
        );
        tableTitle = "Live Audit Trail Stream";
        tableHeaders = ["Action Performed", "User", "Timestamp"];
        tableRows = (data.recentActivities || []).map((act) => [
          <span style={{ fontWeight: 600 }}>{act.action || "System Event"}</span>,
          act.userName || "CIIS System",
          act.createdAt ? new Date(act.createdAt).toLocaleString() : "Just now",
        ]);
        insightText = "Realtime audit trail continuously monitoring security and user actions.";
        break;

      case "attendanceAnalyticsOverview":
        kpiList = [
          { lbl: "Tracked Days", val: data.daysTracked ?? 7, color: "#2563eb" },
          { lbl: "Avg Attendance Rate", val: `${data.averageAttendanceRate ?? 0}%`, color: "#10b981" },
          { lbl: "Velocity", val: "Consistent", color: "#059669" },
        ];
        leftChartTitle = "7-Day Attendance Trend Curve";
        leftChart = <MiniAreaTrendChart data={data.sevenDayTrends || []} height={160} />;
        rightChartTitle = "Daily Volume";
        rightChart = (
          <MiniBarChartOverview
            data={(data.sevenDayTrends || []).map((d) => ({
              name: d.date,
              count: d.present,
              color: "#3b82f6",
            }))}
            height={160}
          />
        );
        tableTitle = "7-Day Attendance Breakdown";
        tableHeaders = ["Date / Day", "Present Staff", "Absent Staff", "Rate"];
        tableRows = (data.sevenDayTrends || []).map((d) => [
          <span style={{ fontWeight: 600 }}>{d.date}</span>,
          <span style={{ color: "#059669", fontWeight: 700 }}>{d.present}</span>,
          <span style={{ color: "#dc2626", fontWeight: 700 }}>{d.absent || 0}</span>,
          <span className="ciis-badge ciis-badge-success">{Math.round((d.present / Math.max(d.present + (d.absent || 0), 1)) * 100)}%</span>,
        ]);
        insightText = `Weekly attendance average is tracking at ${data.averageAttendanceRate ?? 0}% consistency.`;
        break;

      case "taskAnalyticsOverview":
        kpiList = [
          { lbl: "Analyzed Tasks", val: data.totalTasksAnalyzed ?? 0, color: "#2563eb" },
          { lbl: "High Priority Load", val: data.highPriorityCount ?? 0, color: "#ef4444" },
          { lbl: "Urgent Queues", val: "Tracked", color: "#f59e0b" },
        ];
        leftChartTitle = "Task Priority Breakdown";
        leftChart = (
          <MiniBarChartOverview
            data={(data.priorityDistribution || []).map((p) => ({
              name: p.priority,
              count: p.count,
              color: p.color || "#3b82f6",
            }))}
            height={160}
          />
        );
        rightChartTitle = "Task Health Donut";
        rightChart = (
          <DonutChartOverview
            data={(data.priorityDistribution || []).map((p) => ({
              name: p.priority,
              value: p.count,
              color: p.color || "#3b82f6",
            }))}
            centerValue={data.totalTasksAnalyzed ?? 0}
            centerLabel="TASKS"
            height={160}
          />
        );
        tableTitle = "Priority Breakdown Directory";
        tableHeaders = ["Priority Tier", "Task Count", "Load Share"];
        tableRows = (data.priorityDistribution || []).map((p) => [
          <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{p.priority}</span>,
          p.count,
          <span className="ciis-badge ciis-badge-info">{Math.round((p.count / Math.max(data.totalTasksAnalyzed || 1, 1)) * 100)}%</span>,
        ]);
        insightText = `${data.highPriorityCount ?? 0} high-priority tasks requiring expedited execution.`;
        break;

      case "teamVisibilityOverview":
        kpiList = [
          { lbl: "Departments", val: data.totalDepartments ?? 0, color: "#2563eb" },
          { lbl: "Branches", val: data.branchBreakdown?.length ?? 0, color: "#8b5cf6" },
          { lbl: "Workforce Structure", val: "Organized", color: "#10b981" },
        ];
        leftChartTitle = "Department Staff Capacity";
        leftChart = (
          <MiniBarChartOverview
            data={(data.departmentBreakdown || []).map((d) => ({
              name: d.name,
              count: d.count,
              color: "#3b82f6",
            }))}
            height={160}
          />
        );
        rightChartTitle = "Department Share Donut";
        rightChart = (
          <DonutChartOverview
            data={(data.departmentBreakdown || []).map((d, i) => ({
              name: d.name,
              value: d.count,
              color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][i % 5],
            }))}
            centerValue={data.totalDepartments ?? 0}
            centerLabel="DEPTS"
            height={160}
          />
        );
        tableTitle = "Department Capacity Directory";
        tableHeaders = ["Department Name", "Staff Headcount", "Capacity Share"];
        tableRows = (data.departmentBreakdown || []).map((d) => [
          <span style={{ fontWeight: 600 }}>{d.name}</span>,
          d.count,
          <span className="ciis-badge ciis-badge-info">{d.percentage || 0}%</span>,
        ]);
        insightText = `Organizational hierarchy distributed across ${data.totalDepartments ?? 0} departments.`;
        break;

      case "payrollReportsOverview":
        if (data.authorized === false) {
          kpiList = [{ lbl: "Access", val: "Protected", color: "#ef4444" }];
          insightText = "Historical payroll runs are restricted to authorized salary administrators.";
        } else {
          kpiList = [
            { lbl: "Total Recorded Runs", val: data.totalRunsRecorded ?? 0, color: "#2563eb" },
            { lbl: "Available Audits", val: data.runsHistory?.length ?? 0, color: "#10b981" },
            { lbl: "Audit Compliance", val: "Verified", color: "#059669" },
          ];
          leftChartTitle = "Disbursed Run Cycles";
          leftChart = (
            <DonutChartOverview
              data={[
                { name: "Available", value: data.runsHistory?.length ?? 0, color: "#3b82f6" },
                { name: "Archived", value: Math.max((data.totalRunsRecorded ?? 0) - (data.runsHistory?.length ?? 0), 0), color: "#94a3b8" },
              ]}
              centerValue={data.totalRunsRecorded ?? 0}
              centerLabel="RUNS"
              height={160}
            />
          );
          rightChartTitle = "Historical Runs Cost";
          rightChart = (
            <MiniBarChartOverview
              data={(data.runsHistory || []).map((r) => ({
                name: r.month,
                count: r.netCost || 0,
                color: "#10b981",
              }))}
              height={160}
            />
          );
          tableTitle = "Historical Payroll Cycles";
          tableHeaders = ["Payroll Period", "Status", "Employees", "Net Amount"];
          tableRows = (data.runsHistory || []).map((r) => [
            <span style={{ fontWeight: 600 }}>{r.month}</span>,
            <span className="ciis-badge ciis-badge-success">{r.status || "Completed"}</span>,
            r.employees || "—",
            r.netCost ? `₹${r.netCost.toLocaleString()}` : "—",
          ]);
          insightText = "Historical payroll runs and statutory audit archives.";
        }
        break;

      default:
        kpiList = [{ lbl: "Status", val: "Active", color: "#3b82f6" }];
        insightText = "Operational metrics live.";
        break;
    }

    return (
      <div key={sec.key} className="ciis-module-block" id={`module-${sec.key}`}>
        {/* Module Header */}
        <div className="ciis-module-header">
          <div className="ciis-module-title-wrap">
            <div className="ciis-module-icon-box" style={{ backgroundColor: sec.bg, color: sec.color }}>
              <IconComp size={22} />
            </div>
            <div>
              <h3 className="ciis-module-title">
                {sec.title}
                {sec.isSensitive && (
                  <span className="ciis-badge ciis-badge-warning" title="Restricted / Financial Data">
                    Protected
                  </span>
                )}
                <span className="ciis-badge ciis-badge-success" style={{ fontSize: "11px", fontWeight: "600" }}>
                  Live Data
                </span>
              </h3>
              <p className="ciis-module-desc">{sec.description}</p>
            </div>
          </div>
          <Link to={sec.route} className="ciis-card-link-btn" title={`Open ${sec.title}`}>
            <span>Open {sec.routeLabel}</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* KPIs Ribbon */}
        {kpiList.length > 0 && (
          <div className="ciis-module-kpis-grid">
            {kpiList.map((k, idx) => (
              <div key={idx} className="ciis-module-kpi-item">
                <div className="ciis-module-kpi-lbl">{k.lbl}</div>
                <div className="ciis-module-kpi-val" style={{ color: k.color || "#1e293b" }}>
                  {k.val}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Multi-Chart Analytics Grid (2 Columns: Primary & Secondary) */}
        {(leftChart || rightChart) && (
          <div className="ciis-module-content-row">
            {leftChart && (
              <div className="ciis-module-chart-panel">
                <div className="ciis-panel-header">
                  <h4 className="ciis-panel-title">
                    <BarChart3 size={15} style={{ color: sec.color }} />
                    {leftChartTitle}
                  </h4>
                </div>
                {leftChart}
              </div>
            )}
            {rightChart && (
              <div className="ciis-module-chart-panel">
                <div className="ciis-panel-header">
                  <h4 className="ciis-panel-title">
                    <Activity size={15} style={{ color: sec.color }} />
                    {rightChartTitle}
                  </h4>
                </div>
                {rightChart}
              </div>
            )}
          </div>
        )}

        {/* Live Records Table */}
        {tableHeaders.length > 0 && (
          <div className="ciis-module-table-panel">
            <div className="ciis-table-wrap">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#1e293b" }}>{tableTitle}</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Showing up to 6 recent records</span>
              </div>
              {tableRows.length > 0 ? (
                <table className="ciis-preview-table">
                  <thead>
                    <tr>
                      {tableHeaders.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r, rowIdx) => (
                      <tr key={rowIdx}>
                        {r.map((cell, cellIdx) => (
                          <td key={cellIdx}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                  No records currently logged in database for this module.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insight Status Footer */}
        <div className="ciis-module-insight-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
            <span>{insightText}</span>
          </div>
          <span style={{ color: "#94a3b8", fontSize: "11px" }}>
            Realtime DB Sync • Updated {lastRefreshed ? lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="ciis-dashboard-container">
      {/* Top Banner Hero */}
      <div className="ciis-top-banner">
        <div className="ciis-banner-header">
          <div className="ciis-banner-title-area">
            <h1>
              <Sparkles size={24} style={{ color: "#60a5fa" }} />
              CIIS Dynamic Company Dashboard Overview
              <span className="ciis-banner-badge">Visual Graph Overviews</span>
            </h1>
            <p className="ciis-banner-subtitle">
              Unified multi-module intelligence system covering Workforce, Work, Clients, and
              Performance Insights. All 19 overview sections feature dedicated live graphs and interactive
              visibility toggles.
            </p>
          </div>

          <div className="ciis-banner-controls">
            {/* Company Selector - Hidden on user dashboard */}
            {!isUserDashboard && companies.length > 0 && (
              <div className="ciis-company-selector-wrap" title="Switch company context">
                <Building2 size={16} style={{ color: "#93c5fd" }} />
                <select
                  className="ciis-company-select"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.companyCode || "No Code"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Refresh Data */}
            <button
              className="ciis-btn ciis-btn-secondary"
              onClick={() => fetchDashboardData(selectedCompanyId)}
              disabled={loadingData}
              title="Refresh all metrics from MongoDB"
            >
              <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {/* View Mode Switcher */}
            <div className="ciis-view-switcher">
              <button
                type="button"
                className={`ciis-view-switch-btn ${viewMode === "executive" ? "active" : ""}`}
                onClick={() => setViewMode("executive")}
                title="Full Page Multi-Widget Executive View"
              >
                <Layers size={13} />
                <span>Executive Modules</span>
              </button>
              <button
                type="button"
                className={`ciis-view-switch-btn ${viewMode === "compact" ? "active" : ""}`}
                onClick={() => setViewMode("compact")}
                title="Compact Cards View"
              >
                <LayoutGrid size={13} />
                <span>Compact Cards</span>
              </button>
            </div>

            {/* Section Controls Drawer Toggle - Hidden on user dashboard */}
            {!isUserDashboard && (
              <button
                className="ciis-btn ciis-btn-primary"
                onClick={() => setShowControlsDrawer((v) => !v)}
                title="Toggle any of the 19 sections ON/OFF"
              >
                <SlidersHorizontal size={14} />
                <span>
                  {showControlsDrawer ? "Hide Controls" : "Overview Controls"} ({enabledCount}/19)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Quick Strip */}
      <div className="ciis-kpi-strip">
        <div className="ciis-kpi-card">
          <div className="ciis-kpi-info">
            <h4>Total Staff</h4>
            <div className="ciis-kpi-value">{kpis.employees}</div>
          </div>
          <div className="ciis-kpi-icon ciis-kpi-blue">
            <Users size={22} />
          </div>
        </div>

        <div className="ciis-kpi-card">
          <div className="ciis-kpi-info">
            <h4>Active Tasks</h4>
            <div className="ciis-kpi-value">{kpis.activeTasks}</div>
          </div>
          <div className="ciis-kpi-icon ciis-kpi-green">
            <CheckSquare size={22} />
          </div>
        </div>

        <div className="ciis-kpi-card">
          <div className="ciis-kpi-info">
            <h4>Active Projects</h4>
            <div className="ciis-kpi-value">{kpis.activeProjects}</div>
          </div>
          <div className="ciis-kpi-icon ciis-kpi-purple">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="ciis-kpi-card">
          <div className="ciis-kpi-info">
            <h4>Active Clients</h4>
            <div className="ciis-kpi-value">{kpis.activeClients}</div>
          </div>
          <div className="ciis-kpi-icon ciis-kpi-amber">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="ciis-kpi-card">
          <div className="ciis-kpi-info">
            <h4>Open Tickets</h4>
            <div className="ciis-kpi-value">{kpis.openTickets}</div>
          </div>
          <div className="ciis-kpi-icon ciis-kpi-rose">
            <LifeBuoy size={22} />
          </div>
        </div>
      </div>

      {/* Interactive Controls Drawer (Toggles for all 19 sections) - Hidden on user dashboard */}
      {!isUserDashboard && showControlsDrawer && (
        <div className="ciis-controls-drawer">
          <div className="ciis-controls-header">
            <div className="ciis-controls-title">
              <SlidersHorizontal size={18} style={{ color: "#3b82f6" }} />
              <span>Dynamic Section Visibility Toggles (Test Any Combination)</span>
            </div>

            <div className="ciis-controls-presets">
              <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>Presets:</span>
              <button
                className={`ciis-preset-pill ${activePreset === "all" ? "active" : ""}`}
                onClick={() => applyPreset("all")}
              >
                All 19
              </button>
              <button
                className={`ciis-preset-pill ${activePreset === "people" ? "active" : ""}`}
                onClick={() => applyPreset("people")}
              >
                People (5)
              </button>
              <button
                className={`ciis-preset-pill ${activePreset === "work" ? "active" : ""}`}
                onClick={() => applyPreset("work")}
              >
                Work (5)
              </button>
              <button
                className={`ciis-preset-pill ${activePreset === "clients" ? "active" : ""}`}
                onClick={() => applyPreset("clients")}
              >
                Clients (4)
              </button>
              <button
                className={`ciis-preset-pill ${activePreset === "insights" ? "active" : ""}`}
                onClick={() => applyPreset("insights")}
              >
                Insights (5)
              </button>
              <button
                className={`ciis-preset-pill ${activePreset === "none" ? "active" : ""}`}
                onClick={() => applyPreset("none")}
              >
                Disable All
              </button>

              <button
                className="ciis-btn ciis-btn-primary"
                style={{ padding: "5px 12px", fontSize: "12px", marginLeft: "10px" }}
                onClick={saveConfigurationToDatabase}
                disabled={isSavingConfig}
              >
                <Check size={13} />
                <span>{isSavingConfig ? "Saving..." : "Save to MongoDB"}</span>
              </button>
            </div>
          </div>

          {/* Toggle Switches for all 19 Sections */}
          <div className="ciis-toggle-grid">
            {filteredSectionsForDrawer.map((sec) => {
              const isEnabled = Boolean(enabledSections[sec.key]);
              return (
                <div
                  key={sec.key}
                  className={`ciis-toggle-item ${isEnabled ? "enabled" : "disabled"}`}
                  onClick={() => toggleSection(sec.key)}
                >
                  <div className="ciis-toggle-label">
                    <span className="ciis-toggle-group-tag">[{sec.groupLabel}]</span>
                    <span>{sec.title}</span>
                  </div>
                  <div className={`ciis-switch ${isEnabled ? "checked" : ""}`}>
                    <div className="ciis-switch-slider" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error message if any */}
      {errorMsg && (
        <div className="ciis-restricted-box" style={{ background: "#fee2e2", borderColor: "#fecaca", color: "#991b1b", marginBottom: "20px" }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Groups & 19 Overview Sections Grid */}
      {GROUPS.map((grp) => {
        const groupSections = SECTION_DEFINITIONS.filter(
          (s) => s.group === grp.id && Boolean(enabledSections[s.key])
        );

        if (groupSections.length === 0) {
          return null; // Gracefully omit group if all its sections are toggled OFF
        }

        return (
          <div key={grp.id} className="ciis-group-section">
            <div className="ciis-group-header">
              <div className="ciis-group-title-wrap">
                <span className="ciis-group-label">{grp.label}</span>
                <span className="ciis-group-subtitle">— {grp.subtitle}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="ciis-group-count-badge">
                  {groupSections.length} of {SECTION_DEFINITIONS.filter((s) => s.group === grp.id).length} Active
                </span>
              </div>
            </div>

            {viewMode === "executive" ? (
              <div className="ciis-executive-modules-stack">
                {groupSections.map((sec) => renderExecutiveModule(sec))}
              </div>
            ) : (
              <div className="ciis-cards-grid">
                {groupSections.map((sec) => renderSectionCard(sec))}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State when literally everything is toggled OFF */}
      {enabledCount === 0 && (
        <div
          style={{
            background: "#ffffff",
            padding: "60px 20px",
            textAlign: "center",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <SlidersHorizontal size={40} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px" }}>
            All Overview Sections Are Toggled OFF
          </h3>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 16px" }}>
            Use the "Overview Controls" button above to enable sections or apply a preset.
          </p>
          <button className="ciis-btn ciis-btn-primary" onClick={() => applyPreset("all")}>
            Enable All 19 Sections
          </button>
        </div>
      )}
    </div>
  );
}
