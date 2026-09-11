import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "../../utils/axiosConfig";
import {
  Briefcase,
  Laptop,
  Smartphone,
  Headphones,
  Monitor,
  Armchair,
  CheckCircle2,
  Clock,
  XCircle,
  Box,
  RotateCcw,
  FileText,
  Check,
  Plus,
  Search,
  MoreVertical,
  X,
  Calendar,
  LayoutGrid,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink,
  Target,
  Eye,
  ShieldAlert,
} from "lucide-react";
import "../Css/MyAssets.css";
import CIISLoader from "../../Loader/CIISLoader";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext";



/**
 * High-fidelity 3D device artwork SVG rendering:
 * - Isometric laptop with lit display & keyboard deck
 * - Over-ear wireless headphones
 * - Propped upright smartphone
 * - Stylized monstera plant foliage & ambient shadows
 */
const HeroArtDevices = () => (
  <svg
    className="MyAssets-hero-art-svg"
    viewBox="0 0 340 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      {/* Gradients */}
      <linearGradient id="plantLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="60%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>

      <linearGradient id="laptopScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="50%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#312e81" />
      </linearGradient>

      <linearGradient id="laptopBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>

      <linearGradient id="headphoneBandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="50%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>

      <linearGradient id="phoneCaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>

      <linearGradient id="phoneScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#bae6fd" />
      </linearGradient>

      <radialGradient id="deviceShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
    </defs>

    {/* Grounding Floor Shadows */}
    <ellipse cx="140" cy="155" rx="90" ry="12" fill="url(#deviceShadow)" />
    <ellipse cx="230" cy="154" rx="36" ry="9" fill="url(#deviceShadow)" />
    <ellipse cx="265" cy="156" rx="28" ry="8" fill="url(#deviceShadow)" />

    {/* Plant Foliage (Background) */}
    <g opacity="0.95">
      {/* Central leaf */}
      <path
        d="M260 115 C260 70 270 45 285 30 C280 55 285 75 295 85 C295 95 288 110 275 120 Z"
        fill="url(#plantLeafGrad)"
      />
      {/* Left leaf */}
      <path
        d="M265 110 C250 80 240 60 250 40 C260 60 268 75 272 90 Z"
        fill="url(#plantLeafGrad)"
        opacity="0.85"
      />
      {/* Right leaf */}
      <path
        d="M272 112 C285 85 305 65 315 50 C310 75 300 95 282 110 Z"
        fill="url(#plantLeafGrad)"
        opacity="0.9"
      />
    </g>

    {/* 3D Laptop */}
    <g transform="translate(60, 48)">
      {/* Screen Lid (Upright) */}
      <rect
        x="24"
        y="10"
        width="112"
        height="74"
        rx="6"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="1.5"
      />
      {/* Screen Inner Display */}
      <rect
        x="28"
        y="14"
        width="104"
        height="66"
        rx="4"
        fill="url(#laptopScreenGrad)"
      />
      {/* Display UI Glow / Code Lines */}
      <rect x="36" y="24" width="40" height="3" rx="1.5" fill="#60a5fa" opacity="0.8" />
      <rect x="36" y="32" width="68" height="3" rx="1.5" fill="#93c5fd" opacity="0.6" />
      <rect x="36" y="40" width="52" height="3" rx="1.5" fill="#93c5fd" opacity="0.6" />
      <rect x="36" y="48" width="60" height="3" rx="1.5" fill="#c4b5fd" opacity="0.7" />

      {/* Mini Chart Graphic on Screen */}
      <circle cx="112" cy="34" r="8" fill="#3b82f6" opacity="0.4" />
      <path d="M102 62 L110 52 L116 56 L124 44" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

      {/* Laptop Base Keyboard Deck (Isometric Perspective) */}
      <polygon
        points="0,96 160,96 142,84 18,84"
        fill="url(#laptopBaseGrad)"
      />
      {/* Keyboard Bed */}
      <polygon
        points="22,86 138,86 146,92 14,92"
        fill="#1e293b"
        opacity="0.85"
      />
      {/* Trackpad */}
      <polygon
        points="66,93 94,93 96,95 64,95"
        fill="#cbd5e1"
      />
      {/* Base Front Edge Highlight */}
      <rect x="0" y="96" width="160" height="3" rx="1.5" fill="#94a3b8" />
    </g>

    {/* Wireless Headphones */}
    <g transform="translate(198, 56)">
      {/* Headband Loop */}
      <path
        d="M10 55 C10 18 64 18 64 55"
        stroke="url(#headphoneBandGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left Earcup */}
      <g transform="translate(4, 50)">
        <rect x="0" y="0" width="13" height="26" rx="6" fill="#0f172a" />
        <rect x="2" y="3" width="9" height="20" rx="4" fill="#334155" />
        <circle cx="6.5" cy="13" r="2.5" fill="#94a3b8" opacity="0.6" />
      </g>
      {/* Right Earcup */}
      <g transform="translate(56, 50)">
        <rect x="0" y="0" width="13" height="26" rx="6" fill="#0f172a" />
        <rect x="2" y="3" width="9" height="20" rx="4" fill="#334155" />
        <circle cx="6.5" cy="13" r="2.5" fill="#94a3b8" opacity="0.6" />
      </g>
    </g>

    {/* Smartphone (Standing Upright at Angle) */}
    <g transform="translate(254, 76) rotate(-6)">
      {/* Outer Case */}
      <rect
        x="0"
        y="0"
        width="28"
        height="56"
        rx="5"
        fill="url(#phoneCaseGrad)"
        stroke="#ffffff"
        strokeWidth="1"
      />
      {/* Screen Display */}
      <rect
        x="2.5"
        y="3"
        width="23"
        height="50"
        rx="3"
        fill="url(#phoneScreenGrad)"
      />
      {/* Speaker Bar & Camera Notch */}
      <rect x="10" y="4" width="8" height="1.5" rx="0.75" fill="#0369a1" />
      {/* App Widget Placeholder */}
      <rect x="5" y="10" width="18" height="12" rx="2" fill="#ffffff" opacity="0.7" />
      <rect x="5" y="26" width="18" height="4" rx="1.5" fill="#38bdf8" opacity="0.6" />
      <rect x="5" y="33" width="14" height="4" rx="1.5" fill="#38bdf8" opacity="0.4" />
    </g>

    {/* Ambient Particles */}
    <circle cx="50" cy="40" r="2" fill="#ffffff" opacity="0.6" />
    <circle cx="180" cy="30" r="2.5" fill="#ffffff" opacity="0.4" />
    <circle cx="310" cy="130" r="1.5" fill="#ffffff" opacity="0.7" />
  </svg>
);

const MyAssets = () => {
  // Main Data States
  const [requests, setRequests] = useState([]);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [companyAssets, setCompanyAssets] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Section Switcher Tab State: 'assigned' | 'requests'
  const [activeSectionTab, setActiveSectionTab] = useState("assigned");

  // Filtering & Searching States
  const [requestFilter, setRequestFilter] = useState("all");
  const [searchAssetQuery, setSearchAssetQuery] = useState("");

  // Contextual Popover 3-Dots Menu: stores active item _id or null
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modals States
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
  const [confirmReturnModalItem, setConfirmReturnModalItem] = useState(null);

  // Stats calculation
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    approvedPercent: 0,
    pending: 0,
    pendingPercent: 0,
    rejected: 0,
    rejectedPercent: 0,
    assigned: 0,
    returnRequested: 0,
    returned: 0,
  });

  const socketContext = useSocket();
  const { showToast } = useNotification();

  const requestsFetchInFlightRef = useRef(false);
  const assetsFetchInFlightRef = useRef(false);

  // Normalize status string helper
  const normalizeStatus = (status) => String(status || "").toLowerCase().trim();

  // Helper to determine if an asset request is actively assigned
  const isActiveAssetRequest = (req) => {
    const s = normalizeStatus(req?.status);
    return ["approved", "return_requested", "pending_verification"].includes(s);
  };

  // Icon mapping according to asset type/category
  const getAssetCategoryIcon = (category = "") => {
    const c = category.toLowerCase();
    if (c.includes("laptop") || c.includes("computer") || c.includes("macbook")) return Laptop;
    if (c.includes("phone") || c.includes("mobile") || c.includes("iphone")) return Smartphone;
    if (c.includes("headphone") || c.includes("audio") || c.includes("accessories")) return Headphones;
    if (c.includes("furniture") || c.includes("chair") || c.includes("desk")) return Armchair;
    if (c.includes("monitor") || c.includes("peripheral") || c.includes("display")) return Monitor;
    return Box;
  };

  // Category Theme Color
  const getAssetCategoryColor = (category = "") => {
    const c = category.toLowerCase();
    if (c.includes("laptop") || c.includes("macbook")) return "MyAssets-icon-blue";
    if (c.includes("phone") || c.includes("mobile")) return "MyAssets-icon-green";
    if (c.includes("headphone") || c.includes("accessories")) return "MyAssets-icon-red";
    if (c.includes("furniture") || c.includes("chair")) return "MyAssets-icon-purple";
    if (c.includes("monitor") || c.includes("display")) return "MyAssets-icon-blue";
    return "MyAssets-icon-purple";
  };

  // Format short date (e.g. "Jan 15, 2025" or "Sep 10, 2026")
  const formatDateShort = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Helper to resolve comment attachment URLs from server or cloud
  const getAttachmentUrl = (imagePath) => {
    if (!imagePath) return "";
    if (/^(https?:|data:|blob:)/i.test(imagePath)) return imagePath;
    const apiBase = String(axios.defaults.baseURL || "").replace(/\/+api\/?$/i, "").replace(/\/+$/, "");
    return `${apiBase}/${String(imagePath).replace(/^\/+/, "")}`;
  };

  // Safe User Information Retrieval
  const getUser = () => {
    try {
      let userStr = localStorage.getItem("user") || localStorage.getItem("superAdmin");
      if (!userStr) userStr = sessionStorage.getItem("user") || sessionStorage.getItem("superAdmin");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        setUserInfo(parsed);
        return parsed;
      }
    } catch (e) {
      console.error("Error reading user storage:", e);
    }
    return null;
  };

  // Calculate dashboard statistics from dataset
  const calculateStats = (data = []) => {
    const total = data.length;
    const approved = data.filter((r) => normalizeStatus(r.status) === "approved").length;
    const pending = data.filter((r) => normalizeStatus(r.status) === "pending").length;
    const rejected = data.filter((r) => normalizeStatus(r.status) === "rejected").length;
    const returnRequested = data.filter((r) => normalizeStatus(r.status) === "return_requested").length;
    const returned = data.filter((r) =>
      ["deposited", "completed"].includes(normalizeStatus(r.status))
    ).length;

    // Assigned assets are approved / active
    const assigned = data.filter((r) => isActiveAssetRequest(r)).length;

    const approvedPercent = total > 0 ? Math.round((approved / total) * 100) : 0;
    const pendingPercent = total > 0 ? Math.round((pending / total) * 100) : 0;
    const rejectedPercent = total > 0 ? Math.round((rejected / total) * 100) : 0;

    setStats({
      total,
      approved,
      approvedPercent,
      pending,
      pendingPercent,
      rejected,
      rejectedPercent,
      assigned,
      returnRequested,
      returned,
    });
  };

  // Fetch Requests from Backend API
  const fetchRequests = async (showToastNotice = false) => {
    if (requestsFetchInFlightRef.current) return;
    requestsFetchInFlightRef.current = true;
    if (showToastNotice) setRefreshing(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/asset-requests/my-requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const serverData = res.data?.requests || res.data?.data || [];
      const finalRequests = Array.isArray(serverData) ? serverData : [];

      setRequests(finalRequests);

      // Extract assigned assets
      const assigned = finalRequests.filter((req) => isActiveAssetRequest(req));
      setAssignedAssets(assigned);

      calculateStats(finalRequests);

      if (showToastNotice) {
        showToast("Asset dashboard refreshed successfully", "success", 3000);
      }
    } catch (err) {
      console.error("Fetch my requests error:", err);
      setRequests([]);
      setAssignedAssets([]);
      calculateStats([]);
      if (showToastNotice) {
        const errorMsg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load asset data from server";
        showToast(errorMsg, "error", 3000);
      }
    } finally {
      setRefreshing(false);
      requestsFetchInFlightRef.current = false;
    }
  };

  // Fetch Available Company Assets for Requesting
  const fetchCompanyAssets = async () => {
    if (assetsFetchInFlightRef.current) return;
    assetsFetchInFlightRef.current = true;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let assets = [];
      try {
        const res = await axios.get("/company-assets", {
          params: { limit: 100 },
          headers,
        });
        assets = res.data?.assets || (Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (e1) {
        const resAvail = await axios.get("/asset-requests/available", { headers });
        assets = resAvail.data?.assets || [];
      }

      setCompanyAssets(Array.isArray(assets) ? assets : []);
    } catch (err) {
      console.error("Error fetching company assets catalog:", err);
      setCompanyAssets([]);
    } finally {
      assetsFetchInFlightRef.current = false;
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      getUser();
      try {
        await Promise.all([fetchRequests(false), fetchCompanyAssets()]);
      } catch (err) {
        console.error("Init asset error:", err);
      } finally {
        setTimeout(() => setPageLoading(false), 300);
      }
    };

    init();
  }, []);

  // Real-time Socket.io Integration
  useEffect(() => {
    let socket = null;
    if (socketContext?.socket?.on) {
      socket = socketContext.socket;
    } else if (typeof socketContext?.on === "function") {
      socket = socketContext;
    }

    if (socket && typeof socket.on === "function") {
      const handleSocketUpdate = (data) => {
        if (data?.message) {
          showToast(data.message, "info", 4000);
        }
        fetchRequests(false);
        fetchCompanyAssets();
      };

      const events = ["notification", "asset-request-update", "asset-update", "new_notification"];
      events.forEach((ev) => socket.on(ev, handleSocketUpdate));

      return () => {
        events.forEach((ev) => socket.off(ev, handleSocketUpdate));
      };
    }
  }, [socketContext]);

  // Filtered Assigned Assets (Left Column)
  const filteredAssignedAssets = useMemo(() => {
    if (!searchAssetQuery.trim()) return assignedAssets;
    const q = searchAssetQuery.toLowerCase();
    return assignedAssets.filter((item) => {
      const name = (item.assetName || item.name || item.asset?.name || "").toLowerCase();
      const cat = (item.category || item.type || item.asset?.description || "").toLowerCase();
      const sn = (item.serialNumber || item.asset?.serialNumber || "").toLowerCase();
      return name.includes(q) || cat.includes(q) || sn.includes(q);
    });
  }, [assignedAssets, searchAssetQuery]);

  // Filtered Requests (Right Column)
  const filteredRequests = useMemo(() => {
    if (requestFilter === "all") return requests;
    return requests.filter((r) => normalizeStatus(r.status) === requestFilter);
  }, [requests, requestFilter]);

  // Handle Submitting New Asset Request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      showToast("Please select an asset to request.", "error", 4000);
      return;
    }

    const assetObj = companyAssets.find((a) => a._id === selectedAssetId);
    setSubmittingRequest(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/asset-requests/request",
        {
          assetId: selectedAssetId,
          reason: requestReason.trim() || `Request for ${assetObj?.name || "company asset"}`,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      showToast(res.data?.message || "Asset request submitted successfully!", "success", 4000);
      setIsRequestModalOpen(false);
      setSelectedAssetId("");
      setRequestReason("");
      await fetchRequests(false);
      await fetchCompanyAssets();
    } catch (err) {
      console.error("Submit asset request error:", err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to submit asset request. Please try again.";
      showToast(errorMsg, "error", 4000);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Handle Raising Return Request for an Asset
  const handleReturnRequest = async (item) => {
    const id = item?._id;
    if (!id) return;
    setActionLoading(true);

    try {
      const res = await axios.post(`/asset-requests/${id}/return-request`);
      showToast(
        res.data?.message || "Return request submitted successfully. Admin will review.",
        "success",
        4000
      );
      setConfirmReturnModalItem(null);
      await fetchRequests(false);
    } catch (err) {
      console.error("Return request API error:", err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to submit return request";
      showToast(errMsg, "error", 4000);
    } finally {
      setActionLoading(false);
      setOpenMenuId(null);
      setConfirmReturnModalItem(null);
    }
  };

  // Handle Depositing an Asset (Return flow)
  const handleDepositAsset = async (item) => {
    const id = item?._id;
    if (!id) return;
    setActionLoading(true);

    try {
      const res = await axios.post(`/asset-requests/${id}/deposit`);
      showToast(
        res.data?.message || "Asset marked as deposited. Admin verification pending.",
        "success",
        4000
      );
      await fetchRequests(false);
    } catch (err) {
      console.error("Deposit asset API error:", err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to mark asset as deposited";
      showToast(errMsg, "error", 4000);
    } finally {
      setActionLoading(false);
      setOpenMenuId(null);
    }
  };

  // Helper for status badge component
  const renderStatusBadge = (status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "approved":
        return (
          <span className="MyAssets-badge-approved">
            <Check size={13} strokeWidth={2.5} /> Approved
          </span>
        );
      case "pending":
        return (
          <span className="MyAssets-badge-pending">
            <Clock size={13} strokeWidth={2.5} /> Pending
          </span>
        );
      case "rejected":
        return (
          <span className="MyAssets-badge-rejected">
            <X size={13} strokeWidth={2.5} /> Rejected
          </span>
        );
      case "return_requested":
        return (
          <span className="MyAssets-badge-return">
            <RotateCcw size={13} strokeWidth={2.5} /> Return Request
          </span>
        );
      case "pending_verification":
        return (
          <span className="MyAssets-badge-pending-verification">
            <Clock size={13} strokeWidth={2.5} /> Pending Verification
          </span>
        );
      case "deposited":
      case "completed":
        return (
          <span className="MyAssets-badge-deposited">
            <CheckCircle2 size={13} strokeWidth={2.5} /> Deposited
          </span>
        );
      default:
        return (
          <span className="MyAssets-badge-assigned">
            ● Assigned
          </span>
        );
    }
  };

  if (pageLoading) {
    return <CIISLoader />;
  }

  return (
    <div className="MyAssets-shell">
      <div className="MyAssets-container">
        {/* ==================================================================
            1. HERO HEADER BANNER
            ================================================================== */}
        <section className="MyAssets-hero" aria-label="Assets Overview">
          <div className="MyAssets-hero-bg-overlay" />

          {/* Left: Icon Badge & Titles */}
          <div className="MyAssets-hero-left">
            <div className="MyAssets-hero-icon-badge" aria-hidden="true">
              <Briefcase size={28} strokeWidth={2.2} />
            </div>
            <div className="MyAssets-hero-copy">
              <div className="MyAssets-hero-title-row">
                <h1 className="MyAssets-hero-title">My Assets</h1>
                <button
                  type="button"
                  className={`MyAssets-hero-refresh-btn ${refreshing ? "is-spinning" : ""}`}
                  onClick={() => fetchRequests(true)}
                  disabled={refreshing}
                  title="Refresh asset data"
                  aria-label="Refresh asset data"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <p className="MyAssets-hero-subtitle">
                View your assigned assets and track your asset requests
              </p>
              <p className="MyAssets-hero-quote">
                “ Company assets empower your work. Handle them with care.”
              </p>
            </div>
          </div>

          {/* Center: 3D Device Artwork (Laptop, Headphones, Smartphone, Leaves) */}
          <div className="MyAssets-hero-art" aria-hidden="true">
            <HeroArtDevices />
          </div>

          {/* Right: Checklist (Request, Track, Use Responsibly) */}
          <div className="MyAssets-hero-checklist" aria-label="Asset Guidelines">
            <div className="MyAssets-checklist-item">
              <span className="MyAssets-checklist-icon-pill">
                <Briefcase size={14} strokeWidth={2.2} />
              </span>
              <span>Request</span>
            </div>
            <div className="MyAssets-checklist-item">
              <span className="MyAssets-checklist-icon-pill">
                <Target size={14} strokeWidth={2.2} />
              </span>
              <span>Track</span>
            </div>
            <div className="MyAssets-checklist-item">
              <span className="MyAssets-checklist-icon-pill">
                <Check size={14} strokeWidth={2.5} />
              </span>
              <span>Use Responsibly</span>
            </div>
          </div>
        </section>

        {/* ==================================================================
            2. 6 KPI STAT CARDS
            ================================================================== */}
        <section className="MyAssets-kpi-grid" aria-label="Asset Statistics">
          {/* Card 1: Total Requests */}
          <div className="MyAssets-kpi-card">
            <div className="MyAssets-kpi-icon-wrap MyAssets-kpi-blue">
              <FileText size={22} strokeWidth={2} />
            </div>
            <div className="MyAssets-kpi-content">
              <span className="MyAssets-kpi-label">Total Requests</span>
              <span className="MyAssets-kpi-value">{stats.total}</span>
              <span className="MyAssets-kpi-sub">All time requests</span>
            </div>
          </div>

          {/* Card 2: Approved */}
          <div className="MyAssets-kpi-card">
            <div className="MyAssets-kpi-icon-wrap MyAssets-kpi-green">
              <CheckCircle2 size={22} strokeWidth={2} />
            </div>
            <div className="MyAssets-kpi-content">
              <span className="MyAssets-kpi-label">Approved</span>
              <span className="MyAssets-kpi-value">{stats.approved}</span>
              <span className="MyAssets-kpi-badge MyAssets-kpi-badge-green">
                {stats.approvedPercent}% of total
              </span>
            </div>
          </div>

          {/* Card 3: Pending */}
          <div className="MyAssets-kpi-card">
            <div className="MyAssets-kpi-icon-wrap MyAssets-kpi-amber">
              <Clock size={22} strokeWidth={2} />
            </div>
            <div className="MyAssets-kpi-content">
              <span className="MyAssets-kpi-label">Pending</span>
              <span className="MyAssets-kpi-value">{stats.pending}</span>
              <span className="MyAssets-kpi-badge MyAssets-kpi-badge-amber">
                {stats.pendingPercent}% of total
              </span>
            </div>
          </div>

          {/* Card 4: Rejected */}
          <div className="MyAssets-kpi-card">
            <div className="MyAssets-kpi-icon-wrap MyAssets-kpi-red">
              <XCircle size={22} strokeWidth={2} />
            </div>
            <div className="MyAssets-kpi-content">
              <span className="MyAssets-kpi-label">Rejected</span>
              <span className="MyAssets-kpi-value">{stats.rejected}</span>
              <span className="MyAssets-kpi-badge MyAssets-kpi-badge-red">
                {stats.rejectedPercent}% of total
              </span>
            </div>
          </div>

          {/* Card 5: Assigned Assets */}
          <div className="MyAssets-kpi-card">
            <div className="MyAssets-kpi-icon-wrap MyAssets-kpi-purple">
              <Box size={22} strokeWidth={2} />
            </div>
            <div className="MyAssets-kpi-content">
              <span className="MyAssets-kpi-label">Assigned Assets</span>
              <span className="MyAssets-kpi-value">{assignedAssets.length}</span>
              <span className="MyAssets-kpi-sub">Currently assigned</span>
            </div>
          </div>

          {/* Card 6: Returned */}
          <div className="MyAssets-kpi-card">
            <div className="MyAssets-kpi-icon-wrap MyAssets-kpi-gray">
              <RotateCcw size={22} strokeWidth={2} />
            </div>
            <div className="MyAssets-kpi-content">
              <span className="MyAssets-kpi-label">Returned</span>
              <span className="MyAssets-kpi-value">{stats.returned}</span>
              <span className="MyAssets-kpi-sub">Assets returned</span>
            </div>
          </div>
        </section>

        {/* ==================================================================
            3. SECTION SWITCHER TABS
            ================================================================== */}
        <section className="MyAssets-section-tabs-bar" aria-label="Section Tabs">
          <button
            type="button"
            className={`MyAssets-section-tab-pill ${activeSectionTab === "assigned" ? "is-active" : ""}`}
            onClick={() => setActiveSectionTab("assigned")}
          >
            <Box size={16} strokeWidth={2.2} />
            <span>Assigned Assets</span>
            <span className="MyAssets-section-tab-count">{assignedAssets.length}</span>
          </button>

          <button
            type="button"
            className={`MyAssets-section-tab-pill ${activeSectionTab === "requests" ? "is-active" : ""}`}
            onClick={() => setActiveSectionTab("requests")}
          >
            <LayoutGrid size={16} strokeWidth={2.2} />
            <span>Asset Requests</span>
            <span className="MyAssets-section-tab-count">{requests.length}</span>
          </button>
        </section>

        {/* ==================================================================
            4. 2-COLUMN RESPONSIVE DASHBOARD
            ================================================================== */}
        <div className={`MyAssets-dashboard-grid is-tab-${activeSectionTab}`}>
          {/* --------------------------------------------------------------
              LEFT COLUMN: ASSIGNED ASSETS
              -------------------------------------------------------------- */}
          <section className="MyAssets-column-card MyAssets-column-assigned" aria-label="Assigned Assets Panel">
            <header className="MyAssets-column-header">
              <div className="MyAssets-column-header-left">
                <div className="MyAssets-col-icon-circle">
                  <Briefcase size={18} strokeWidth={2.2} />
                </div>
                <div className="MyAssets-col-title-wrap">
                  <h2>Assigned Assets</h2>
                  <p>Assets currently assigned to you</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="MyAssets-search-input-wrap">
                <Search size={14} className="MyAssets-search-icon" />
                <input
                  type="text"
                  className="MyAssets-search-input"
                  placeholder="Search assets..."
                  value={searchAssetQuery}
                  onChange={(e) => setSearchAssetQuery(e.target.value)}
                  aria-label="Search assigned assets"
                />
              </div>
            </header>

            {/* Assigned Assets Cards List */}
            <div className="MyAssets-assigned-cards-list">
              {filteredAssignedAssets.length > 0 ? (
                filteredAssignedAssets.map((item, idx) => {
                  const ItemIcon = getAssetCategoryIcon(item.category || item.type || item.asset?.description || item.assetName);
                  const colorClass = getAssetCategoryColor(item.category || item.type || item.asset?.description || item.assetName);
                  const assetIdDisplay =
                    item.serialNumber ||
                    item.asset?.serialNumber ||
                    (item._id ? `AST-${String(item._id).slice(-6).toUpperCase()}` : "—");
                  const assignedDateDisplay = formatDateShort(
                    item.assignedDate || item.decisionDate || item.updatedAt || item.createdAt
                  );

                  return (
                    <article key={item._id || idx} className="MyAssets-assigned-item-card">
                      {/* Top Row: Device Icon, Title, Badges, 3-Dots */}
                      <div className="MyAssets-assigned-main-row">
                        <div className="MyAssets-assigned-info-block">
                          <div className={`MyAssets-asset-icon-box ${colorClass}`}>
                            <ItemIcon size={22} strokeWidth={2} />
                          </div>
                          <div className="MyAssets-asset-titles">
                            <h3 className="MyAssets-asset-name">{item.assetName || item.name || item.asset?.name || "Asset"}</h3>
                            <p className="MyAssets-asset-category">
                              {item.category || item.type || item.asset?.description || "Company Asset"}
                            </p>
                          </div>
                        </div>

                        <div className="MyAssets-assigned-right-actions">
                          {renderStatusBadge(item.status)}

                          {normalizeStatus(item.status) === "approved" && (
                            <button
                              type="button"
                              className="MyAssets-btn-quick-return"
                              onClick={() => setConfirmReturnModalItem(item)}
                              title="Request Asset Return"
                            >
                              <RotateCcw size={12} /> Return
                            </button>
                          )}

                          {normalizeStatus(item.status) === "return_requested" && (
                            <button
                              type="button"
                              className="MyAssets-btn-quick-deposit"
                              onClick={() => handleDepositAsset(item)}
                              disabled={actionLoading}
                              title="Deposit Asset"
                            >
                              <RotateCcw size={12} /> Deposit
                            </button>
                          )}

                          <button
                            type="button"
                            className="MyAssets-dots-btn"
                            onClick={() => setOpenMenuId(openMenuId === item._id ? null : item._id)}
                            title="More options"
                            aria-label="More options"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Popover Dropdown Menu */}
                          {openMenuId === item._id && (
                            <>
                              <div
                                className="MyAssets-popover-backdrop"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="MyAssets-popover-menu">
                                <button
                                  type="button"
                                  className="MyAssets-popover-item"
                                  onClick={() => {
                                    setSelectedRequestDetails(item);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Eye size={14} /> View Details
                                </button>
                                {item.adminComments?.length > 0 && (
                                  <button
                                    type="button"
                                    className="MyAssets-popover-item"
                                    onClick={() => {
                                      setSelectedRequestDetails(item);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <MessageSquare size={14} /> Comments ({item.adminComments.length})
                                  </button>
                                )}
                                {normalizeStatus(item.status) === "approved" && (
                                  <button
                                    type="button"
                                    className="MyAssets-popover-item text-warning"
                                    onClick={() => {
                                      setConfirmReturnModalItem(item);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <RotateCcw size={14} /> Request Return
                                  </button>
                                )}
                                {normalizeStatus(item.status) === "return_requested" && (
                                  <button
                                    type="button"
                                    className="MyAssets-popover-item text-danger"
                                    onClick={() => handleDepositAsset(item)}
                                    disabled={actionLoading}
                                  >
                                    <RotateCcw size={14} /> Deposit Asset
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 3-Field Meta Row: Asset ID, Assigned On, Condition */}
                      <div className="MyAssets-assigned-meta-grid">
                        <div className="MyAssets-meta-col">
                          <span className="MyAssets-meta-label">Asset ID</span>
                          <span className="MyAssets-meta-val">{assetIdDisplay}</span>
                        </div>
                        <div className="MyAssets-meta-col">
                          <span className="MyAssets-meta-label">Assigned On</span>
                          <span className="MyAssets-meta-val">{assignedDateDisplay}</span>
                        </div>
                        <div className="MyAssets-meta-col">
                          <span className="MyAssets-meta-label">Condition / Status</span>
                          <span className="MyAssets-meta-val">
                            <span className="MyAssets-condition-dot" />
                            {item.condition || item.assetStatus || item.asset?.status || (normalizeStatus(item.status) === "approved" ? "Assigned" : item.status) || "Active"}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="MyAssets-empty-state-box">
                  <Box size={38} strokeWidth={1.5} />
                  <strong>No Assigned Assets Found</strong>
                  <p>
                    {searchAssetQuery
                      ? "No assets match your search criteria. Try a different keyword."
                      : "You currently have no active assigned assets. Request a new asset to get started."}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* --------------------------------------------------------------
              RIGHT COLUMN: ASSET REQUESTS
              -------------------------------------------------------------- */}
          <section className="MyAssets-column-card MyAssets-column-requests" aria-label="Asset Requests Panel">
            <header className="MyAssets-column-header">
              <div className="MyAssets-column-header-left">
                <div className="MyAssets-col-icon-circle">
                  <Briefcase size={18} strokeWidth={2.2} />
                </div>
                <div className="MyAssets-col-title-wrap">
                  <h2>Asset Requests</h2>
                  <p>Track the status of your asset requests</p>
                </div>
              </div>

              {/* + New Request Button */}
              <button
                type="button"
                className="MyAssets-btn-new-request"
                onClick={() => setIsRequestModalOpen(true)}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>New Request</span>
              </button>
            </header>

            {/* Filter Tabs Bar (All, Pending, Approved, Rejected, Return Request) */}
            <div className="MyAssets-req-filters-row" role="tablist">
              <button
                type="button"
                className={`MyAssets-filter-pill-btn MyAssets-filter-all ${
                  requestFilter === "all" ? "is-active" : ""
                }`}
                onClick={() => setRequestFilter("all")}
              >
                <span>All</span>
                <span className="MyAssets-filter-pill-count">{stats.total}</span>
              </button>

              <button
                type="button"
                className={`MyAssets-filter-pill-btn MyAssets-filter-pending ${
                  requestFilter === "pending" ? "is-active" : ""
                }`}
                onClick={() => setRequestFilter("pending")}
              >
                <span>Pending</span>
                <span className="MyAssets-filter-pill-count">{stats.pending}</span>
              </button>

              <button
                type="button"
                className={`MyAssets-filter-pill-btn MyAssets-filter-approved ${
                  requestFilter === "approved" ? "is-active" : ""
                }`}
                onClick={() => setRequestFilter("approved")}
              >
                <span>Approved</span>
                <span className="MyAssets-filter-pill-count">{stats.approved}</span>
              </button>

              <button
                type="button"
                className={`MyAssets-filter-pill-btn MyAssets-filter-rejected ${
                  requestFilter === "rejected" ? "is-active" : ""
                }`}
                onClick={() => setRequestFilter("rejected")}
              >
                <span>Rejected</span>
                <span className="MyAssets-filter-pill-count">{stats.rejected}</span>
              </button>

              <button
                type="button"
                className={`MyAssets-filter-pill-btn MyAssets-filter-return ${
                  requestFilter === "return_requested" ? "is-active" : ""
                }`}
                onClick={() => setRequestFilter("return_requested")}
              >
                <span>Return Request</span>
                <span className="MyAssets-filter-pill-count">{stats.returnRequested}</span>
              </button>
            </div>

            {/* Asset Requests Items List */}
            <div className="MyAssets-requests-items-list">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req, idx) => {
                  const ItemIcon = getAssetCategoryIcon(req.category || req.type || req.asset?.description || req.assetName);
                  const colorClass = getAssetCategoryColor(req.category || req.type || req.asset?.description || req.assetName);
                  const dateDisplay = formatDateShort(req.requestDate || req.createdAt);

                  return (
                    <div key={req._id || idx} className="MyAssets-req-item-row">
                      {/* Left: Icon & Details */}
                      <div className="MyAssets-req-item-left">
                        <div className={`MyAssets-req-icon-box ${colorClass}`}>
                          <ItemIcon size={18} strokeWidth={2} />
                        </div>
                        <div className="MyAssets-req-item-copy">
                          <h4 className="MyAssets-req-item-title">{req.assetName || req.asset?.name || "Asset"}</h4>
                          <p className="MyAssets-req-item-sub">
                            {req.category || req.type || req.asset?.description || "Asset"}
                          </p>
                        </div>
                      </div>

                      {/* Date Badge */}
                      <div className="MyAssets-req-date-cell">
                        <Calendar size={13} />
                        <span>{dateDisplay}</span>
                      </div>

                      {/* Status Badge & Actions */}
                      <div className="MyAssets-req-right-actions">
                        {renderStatusBadge(req.status)}

                        <button
                          type="button"
                          className="MyAssets-btn-view-req"
                          onClick={() => setSelectedRequestDetails(req)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="MyAssets-dots-btn"
                          onClick={() => setOpenMenuId(openMenuId === req._id ? null : req._id)}
                          title="Options"
                          aria-label="Options"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {/* Popover Dropdown */}
                        {openMenuId === req._id && (
                          <>
                            <div
                              className="MyAssets-popover-backdrop"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="MyAssets-popover-menu">
                              <button
                                type="button"
                                className="MyAssets-popover-item"
                                onClick={() => {
                                  setSelectedRequestDetails(req);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Eye size={14} /> Full Details
                              </button>
                              {req.adminComments?.length > 0 && (
                                <button
                                  type="button"
                                  className="MyAssets-popover-item"
                                  onClick={() => {
                                    setSelectedRequestDetails(req);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <MessageSquare size={14} /> Comments ({req.adminComments.length})
                                </button>
                              )}
                              {normalizeStatus(req.status) === "approved" && (
                                <button
                                  type="button"
                                  className="MyAssets-popover-item text-warning"
                                  onClick={() => {
                                    setConfirmReturnModalItem(req);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <RotateCcw size={14} /> Request Return
                                </button>
                              )}
                              {normalizeStatus(req.status) === "return_requested" && (
                                <button
                                  type="button"
                                  className="MyAssets-popover-item text-danger"
                                  onClick={() => handleDepositAsset(req)}
                                  disabled={actionLoading}
                                >
                                  <RotateCcw size={14} /> Deposit Asset
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="MyAssets-empty-state-box">
                  <FileText size={38} strokeWidth={1.5} />
                  <strong>No Asset Requests Found</strong>
                  <p>There are no asset requests matching this filter criteria.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ==================================================================
            5. BOTTOM CTA BANNER
            ================================================================== */}
        <section className="MyAssets-bottom-cta-banner" aria-label="Need a new asset callout">
          <div className="MyAssets-bottom-cta-left">
            <div className="MyAssets-bottom-cta-icon-box">
              <Briefcase size={24} strokeWidth={2.2} />
            </div>
            <div className="MyAssets-bottom-cta-text">
              <h3>Need a new asset?</h3>
              <p>Request an asset for your work needs. Your request will be reviewed by the admin.</p>
            </div>
          </div>

          <button
            type="button"
            className="MyAssets-bottom-cta-btn"
            onClick={() => setIsRequestModalOpen(true)}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Request New Asset</span>
          </button>
        </section>
      </div>

      {/* ==================================================================
          6. REQUEST NEW ASSET MODAL
          ================================================================== */}
      {isRequestModalOpen && (
        <div className="MyAssets-modal-overlay" onClick={() => setIsRequestModalOpen(false)}>
          <div
            className="MyAssets-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="MyAssets-modal-header">
              <div className="MyAssets-modal-header-left">
                <div className="MyAssets-modal-icon-badge">
                  <Briefcase size={20} strokeWidth={2.2} />
                </div>
                <h3>Request New Asset</h3>
              </div>
              <button
                type="button"
                className="MyAssets-modal-close-btn"
                onClick={() => setIsRequestModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest}>
              <div className="MyAssets-modal-body">
                <div className="MyAssets-form-group">
                  <label htmlFor="ma-select-asset">Select Available Asset *</label>
                  <select
                    id="ma-select-asset"
                    className="MyAssets-modal-select"
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose asset from catalog --</option>
                    {companyAssets.length > 0 ? (
                      companyAssets.map((asset) => (
                        <option key={asset._id} value={asset._id}>
                          {asset.name}
                          {asset.description ? ` (${asset.description})` : ""}
                          {asset.quantity !== undefined ? ` • ${asset.quantity} available` : ""}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        -- No company assets currently available in catalog --
                      </option>
                    )}
                  </select>
                </div>

                <div className="MyAssets-form-group">
                  <label htmlFor="ma-request-reason">Business Justification / Reason *</label>
                  <textarea
                    id="ma-request-reason"
                    className="MyAssets-modal-textarea"
                    placeholder="Describe why you need this equipment for your day-to-day work tasks..."
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="MyAssets-modal-footer">
                <button
                  type="button"
                  className="MyAssets-btn-secondary"
                  onClick={() => setIsRequestModalOpen(false)}
                  disabled={submittingRequest}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="MyAssets-btn-primary"
                  disabled={submittingRequest || !selectedAssetId}
                >
                  {submittingRequest ? (
                    <>
                      <RefreshCw size={14} className="is-spinning" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus size={15} strokeWidth={2.5} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================
          7. VIEW DETAILS & ADMIN COMMENTS MODAL
          ================================================================== */}
      {selectedRequestDetails && (
        <div className="MyAssets-modal-overlay" onClick={() => setSelectedRequestDetails(null)}>
          <div
            className="MyAssets-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="MyAssets-modal-header">
              <div className="MyAssets-modal-header-left">
                <div className="MyAssets-modal-icon-badge">
                  <Briefcase size={20} strokeWidth={2.2} />
                </div>
                <h3>Asset Details</h3>
              </div>
              <button
                type="button"
                className="MyAssets-modal-close-btn"
                onClick={() => setSelectedRequestDetails(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="MyAssets-modal-body">
              <div className="MyAssets-details-meta-grid">
                <div className="MyAssets-details-meta-item">
                  <strong>Asset Name</strong>
                  <span>{selectedRequestDetails.assetName || selectedRequestDetails.asset?.name || "Asset"}</span>
                </div>
                <div className="MyAssets-details-meta-item">
                  <strong>Category / Specs</strong>
                  <span>{selectedRequestDetails.category || selectedRequestDetails.type || selectedRequestDetails.asset?.description || "Company Asset"}</span>
                </div>
                <div className="MyAssets-details-meta-item">
                  <strong>Status</strong>
                  <span>{renderStatusBadge(selectedRequestDetails.status)}</span>
                </div>
                <div className="MyAssets-details-meta-item">
                  <strong>Requested Date</strong>
                  <span>{formatDateShort(selectedRequestDetails.requestDate || selectedRequestDetails.createdAt)}</span>
                </div>
                {selectedRequestDetails.approvedBy && (
                  <div className="MyAssets-details-meta-item">
                    <strong>Approved By</strong>
                    <span>{selectedRequestDetails.approvedBy?.name || selectedRequestDetails.approvedBy?.email || "Admin"}</span>
                  </div>
                )}
                <div className="MyAssets-details-meta-item">
                  <strong>Serial Number / ID</strong>
                  <span>{selectedRequestDetails.serialNumber || selectedRequestDetails.asset?.serialNumber || (selectedRequestDetails._id ? `AST-${String(selectedRequestDetails._id).slice(-6).toUpperCase()}` : "—")}</span>
                </div>
              </div>

              {selectedRequestDetails.reason && (
                <div className="MyAssets-form-group">
                  <label>Request Reason</label>
                  <p style={{ margin: 0, fontSize: "0.86rem", color: "#334155", lineHeight: 1.45 }}>
                    {selectedRequestDetails.reason}
                  </p>
                </div>
              )}

              {selectedRequestDetails.approvalDetails?.about && (
                <div className="MyAssets-form-group">
                  <label>Approval Details</label>
                  <p style={{ margin: 0, fontSize: "0.86rem", color: "#334155", lineHeight: 1.45 }}>
                    {selectedRequestDetails.approvalDetails.about}
                  </p>
                </div>
              )}

              {/* Admin Comments */}
              <div className="MyAssets-comments-block">
                <h4>Admin Feedback & Comments</h4>
                {selectedRequestDetails.adminComments?.length > 0 ? (
                  <div className="MyAssets-comments-list">
                    {selectedRequestDetails.adminComments.map((c, i) => (
                      <div key={c._id || i} className="MyAssets-comment-bubble">
                        <div className="MyAssets-comment-top">
                          <strong>{c.addedBy?.name || "Administrator"}</strong>
                          <span>{formatDateShort(c.addedAt || c.createdAt)}</span>
                        </div>
                        {c.text && <p className="MyAssets-comment-text">{c.text}</p>}
                        {c.image && (
                          <button
                            type="button"
                            className="MyAssets-comment-img-thumb"
                            onClick={() => setLightboxImageUrl(getAttachmentUrl(c.image))}
                          >
                            <ImageIcon size={14} /> View Attachment
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
                    No admin comments recorded for this asset request.
                  </p>
                )}
              </div>
            </div>

            <div className="MyAssets-modal-footer">
              {normalizeStatus(selectedRequestDetails.status) === "approved" && (
                <button
                  type="button"
                  className="MyAssets-btn-primary"
                  style={{ background: "#d97706" }}
                  onClick={() => {
                    const item = selectedRequestDetails;
                    setSelectedRequestDetails(null);
                    setConfirmReturnModalItem(item);
                  }}
                  disabled={actionLoading}
                >
                  <RotateCcw size={15} /> Request Return
                </button>
              )}
              {normalizeStatus(selectedRequestDetails.status) === "return_requested" && (
                <button
                  type="button"
                  className="MyAssets-btn-primary"
                  style={{ background: "#ea580c" }}
                  onClick={() => handleDepositAsset(selectedRequestDetails)}
                  disabled={actionLoading}
                >
                  <RotateCcw size={15} /> Deposit Asset Now
                </button>
              )}
              <button
                type="button"
                className="MyAssets-btn-secondary"
                onClick={() => setSelectedRequestDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          8. RETURN ASSET CONFIRMATION MODAL
          ================================================================== */}
      {confirmReturnModalItem && (
        <div
          className="MyAssets-modal-overlay"
          onClick={() => !actionLoading && setConfirmReturnModalItem(null)}
        >
          <div
            className="MyAssets-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div className="MyAssets-modal-header">
              <div className="MyAssets-modal-header-left">
                <div
                  className="MyAssets-modal-icon-badge"
                  style={{ background: "#fffbeb", color: "#d97706" }}
                >
                  <RotateCcw size={20} strokeWidth={2.2} />
                </div>
                <h3>Request Asset Return</h3>
              </div>
              <button
                type="button"
                className="MyAssets-modal-close-btn"
                onClick={() => setConfirmReturnModalItem(null)}
                disabled={actionLoading}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="MyAssets-modal-body">
              <div className="MyAssets-details-meta-grid">
                <div className="MyAssets-details-meta-item">
                  <strong>Asset Name</strong>
                  <span style={{ fontWeight: 700, color: "var(--ma-text-main)" }}>
                    {confirmReturnModalItem.assetName || confirmReturnModalItem.name || "Asset"}
                  </span>
                </div>
                <div className="MyAssets-details-meta-item">
                  <strong>Category / Specs</strong>
                  <span>
                    {confirmReturnModalItem.category || confirmReturnModalItem.type || confirmReturnModalItem.asset?.description || "Company Asset"}
                  </span>
                </div>
                <div className="MyAssets-details-meta-item">
                  <strong>Serial / ID</strong>
                  <span>
                    {confirmReturnModalItem.serialNumber ||
                      confirmReturnModalItem.asset?.serialNumber ||
                      (confirmReturnModalItem._id
                        ? `AST-${String(confirmReturnModalItem._id).slice(-6).toUpperCase()}`
                        : "—")}
                  </span>
                </div>
                <div className="MyAssets-details-meta-item">
                  <strong>Condition / Status</strong>
                  <span>{confirmReturnModalItem.condition || confirmReturnModalItem.assetStatus || confirmReturnModalItem.asset?.status || "Assigned"}</span>
                </div>
              </div>

              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  fontSize: "0.83rem",
                  color: "#92400e",
                  lineHeight: "1.45",
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#d97706" }} />
                <div>
                  <strong>Are you sure you want to request return?</strong>
                  <p style={{ margin: "4px 0 0", color: "#b45309" }}>
                    Once submitted, your manager or company admin will review your return request. After review, you will be able to mark the asset as deposited.
                  </p>
                </div>
              </div>
            </div>

            <div className="MyAssets-modal-footer">
              <button
                type="button"
                className="MyAssets-btn-secondary"
                onClick={() => setConfirmReturnModalItem(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="MyAssets-btn-primary"
                style={{ background: "#d97706" }}
                onClick={() => handleReturnRequest(confirmReturnModalItem)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={14} className="is-spinning" /> Submitting...
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} /> Confirm Return Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          8. IMAGE ATTACHMENT LIGHTBOX
          ================================================================== */}
      {lightboxImageUrl &&
        createPortal(
          <div className="MyAssets-lightbox-overlay" onClick={() => setLightboxImageUrl(null)}>
            <div className="MyAssets-lightbox-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="MyAssets-lightbox-close"
                onClick={() => setLightboxImageUrl(null)}
                aria-label="Close image preview"
              >
                <X size={18} />
              </button>
              <img src={lightboxImageUrl} alt="Attachment Preview" className="MyAssets-lightbox-img" />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MyAssets;
