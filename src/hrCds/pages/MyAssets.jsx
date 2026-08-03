import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "../../utils/axiosConfig";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiCpu,
  FiFileText,
  FiHeadphones,
  FiImage,
  FiMessageCircle,
  FiMonitor,
  FiMoreVertical,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiShield,
  FiSmartphone,
  FiTrendingUp,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import "../Css/MyAssets.css";
import CIISLoader from "../../Loader/CIISLoader";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext";

const MyAssets = () => {
  const [newAsset, setNewAsset] = useState("");
  const [notification, setNotification] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [assetActionLoading, setAssetActionLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [companyAssets, setCompanyAssets] = useState([]);
  const [allowedAssets, setAllowedAssets] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    returnRequested: 0,
    pendingVerification: 0,
    deposited: 0,
    approvalRate: 0,
  });
  const [viewCommentReq, setViewCommentReq] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const socketContext = useSocket();
  const { showToast } = useNotification();

  const assetsFetchInFlightRef = useRef(false);
  const requestsFetchInFlightRef = useRef(false);
  const lastAssetsFetchAtRef = useRef(0);
  const lastRequestsFetchAtRef = useRef(0);

  const getCommentAttachmentUrl = (imagePath) => {
    if (!imagePath) return "";
    if (/^(https?:|data:|blob:)/i.test(imagePath)) return imagePath;
    const apiBase = String(axios.defaults.baseURL || "").replace(/\/+$/, "");
    return `${apiBase}/${String(imagePath).replace(/^\/+/, "")}`;
  };

  const isCommentImage = (comment) =>
    String(comment?.mimeType || "").startsWith("image/") ||
    /\.(jpe?g|png|webp|gif)$/i.test(String(comment?.image || ""));

  const formatCommentDate = (comment) => {
    const value = comment?.addedAt || comment?.createdAt;
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
  };

  const normalizeStatus = (status) => String(status || "").toLowerCase();

  const getIconForAssetType = (type) => {
    const typeLower = (type || "").toLowerCase();
    if (typeLower.includes("phone") || typeLower.includes("mobile")) return FiSmartphone;
    if (typeLower.includes("laptop") || typeLower.includes("computer")) return FiMonitor;
    if (typeLower.includes("desktop") || typeLower.includes("pc")) return FiSettings;
    if (typeLower.includes("headphone") || typeLower.includes("audio")) return FiHeadphones;
    if (typeLower.includes("sim") || typeLower.includes("chip")) return FiCpu;
    if (typeLower.includes("electronics")) return FiCpu;
    if (typeLower.includes("furniture")) return FiPackage;
    if (typeLower.includes("vehicle")) return FiTrendingUp;
    return FiPackage;
  };

  const getColorForAssetType = (type) => {
    const typeLower = (type || "").toLowerCase();
    if (typeLower.includes("phone") || typeLower.includes("mobile")) return "primary";
    if (typeLower.includes("laptop")) return "info";
    if (typeLower.includes("desktop") || typeLower.includes("pc")) return "warning";
    if (typeLower.includes("headphone") || typeLower.includes("audio")) return "success";
    if (typeLower.includes("sim") || typeLower.includes("chip")) return "secondary";
    return "primary";
  };

  const getAssetIcon = (assetName) => {
    const asset = allowedAssets.find((a) => a.label === assetName);
    return asset ? asset.icon : FiPackage;
  };

  const getAssetColor = (assetName) => {
    const asset = allowedAssets.find((a) => a.label === assetName);
    return asset ? asset.color : "primary";
  };

  const getUser = () => {
    try {
      let userStr =
        localStorage.getItem("user") || localStorage.getItem("superAdmin");
      if (!userStr) userStr = sessionStorage.getItem("user") || sessionStorage.getItem("superAdmin");

      if (userStr) {
        const user = JSON.parse(userStr);
        setUserInfo(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error parsing user:", error);
      return null;
    }
  };

  const fetchCompanyAssets = async (force = false) => {
    const now = Date.now();
    if (!force && (assetsFetchInFlightRef.current || now - lastAssetsFetchAtRef.current < 30000)) {
      return;
    }
    assetsFetchInFlightRef.current = true;
    lastAssetsFetchAtRef.current = now;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/company-assets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const assets = res.data.assets || (Array.isArray(res.data) ? res.data : res.data.data || []);
      setCompanyAssets(assets);

      const formattedAssets = assets.map((asset) => ({
        value: asset._id,
        label: asset.name || asset.assetName || "Unnamed Asset",
        type: asset.category || asset.type || "other",
        icon: getIconForAssetType(asset.category || asset.type),
        color: getColorForAssetType(asset.category || asset.type),
        available: asset.quantity > 0,
        status: asset.status,
        serialNumber: asset.serialNumber,
        model: asset.model,
        description: asset.description,
      }));

      setAllowedAssets(formattedAssets);
    } catch (err) {
      console.error("Failed to fetch company assets:", err);
      showToast("Failed to load company assets", "error", 4000);
    } finally {
      assetsFetchInFlightRef.current = false;
    }
  };

  const fetchRequests = async (showRefresh = false, force = false) => {
    const now = Date.now();
    if (!force && (requestsFetchInFlightRef.current || now - lastRequestsFetchAtRef.current < 30000)) {
      return;
    }
    requestsFetchInFlightRef.current = true;
    lastRequestsFetchAtRef.current = now;

    if (showRefresh) setRefreshing(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/asset-requests/my-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.requests || res.data.data || [];
      setRequests(data);
      setAssignedAssets(data.filter((req) => isActiveAssetRequest(req)));
      calculateStats(data);

      if (showRefresh) {
        showToast("Asset data refreshed!", "success", 3000);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      showToast("Failed to fetch requests", "error", 4000);
    } finally {
      setRefreshing(false);
      requestsFetchInFlightRef.current = false;
    }
  };

  const calculateStats = (data) => {
    const approved = data.filter((r) => normalizeStatus(r.status) === "approved").length;
    const pending = data.filter((r) => normalizeStatus(r.status) === "pending").length;
    const rejected = data.filter((r) => normalizeStatus(r.status) === "rejected").length;
    const returnRequested = data.filter((r) => normalizeStatus(r.status) === "return_requested").length;
    const pendingVerification = data.filter((r) => normalizeStatus(r.status) === "pending_verification").length;
    const deposited = data.filter((r) => normalizeStatus(r.status) === "deposited").length;

    setStats({
      total: data.length,
      approved,
      pending,
      rejected,
      returnRequested,
      pendingVerification,
      deposited,
      approvalRate: data.length > 0 ? Math.round((approved / data.length) * 100) : 0,
    });
  };

  const isActiveAssetRequest = (request) => {
    const status = normalizeStatus(request?.status);
    return ["approved", "return_requested", "pending_verification"].includes(status);
  };

  const getStatusLabel = (status) => {
    switch (normalizeStatus(status)) {
      case "approved":
        return "Assigned";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      case "return_requested":
        return "Pending Return Request";
      case "pending_verification":
        return "Pending Verification";
      case "deposited":
        return "Deposited";
      default:
        return status || "Unknown";
    }
  };

  const getRequestSummary = (request) => {
    switch (normalizeStatus(request?.status)) {
      case "approved":
        return "Assigned to you";
      case "return_requested":
        return "Admin has requested return";
      case "pending_verification":
        return "You marked the asset as deposited";
      case "deposited":
        return "Deposit confirmed";
      default:
        return "Asset request";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateParts = (dateStr) => {
    if (!dateStr) return { date: "--", time: "--" };
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return { date: "--", time: "--" };
    return {
      date: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.approvedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || normalizeStatus(req.status) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const visibleRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [currentPage, filteredRequests, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const availableAssetsCount = companyAssets.filter((asset) => (asset.quantity || 0) > 0).length;
  const totalAssetsCount = companyAssets.length;
  const lifecycleRequest = useMemo(() => {
    const priority = {
      deposited: 4,
      pending_verification: 3,
      return_requested: 2,
      approved: 1,
    };

    return [...requests]
      .filter((request) => {
        const status = normalizeStatus(request?.status);
        return Boolean(priority[status] || status === "completed");
      })
      .sort((a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        if (bTime !== aTime) return bTime - aTime;
        return (priority[normalizeStatus(b?.status)] || 0) - (priority[normalizeStatus(a?.status)] || 0);
      })[0] || null;
  }, [requests]);

  const lifecycleStatus = useMemo(() => {
    const status = normalizeStatus(lifecycleRequest?.status);
    if (status === "return_requested") return 1;
    if (status === "pending_verification") return 2;
    if (status === "deposited" || status === "completed") return 3;
    if (status === "approved") return 0;
    return 0;
  }, [lifecycleRequest]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleNotification = (notificationData) => {
      if (notificationData?.message) {
        showToast(notificationData.message, "info", 4000);
      }
      fetchRequests(false, true);
      fetchCompanyAssets(true);
    };

    let socket = null;
    const cleanupFunctions = [];

    if (socketContext && socketContext.socket && typeof socketContext.socket.on === "function") {
      socket = socketContext.socket;
    } else if (socketContext && typeof socketContext.on === "function") {
      socket = socketContext;
    } else if (socketContext && typeof socketContext.getSocket === "function") {
      socket = socketContext.getSocket();
    }

    if (socket && typeof socket.on === "function") {
      const events = ["notification", "asset-request-update", "asset-update", "new_notification"];
      events.forEach((eventName) => {
        socket.on(eventName, handleNotification);
        cleanupFunctions.push(() => socket.off(eventName, handleNotification));
      });
    } else {
      const intervalId = setInterval(() => {
        fetchRequests();
        fetchCompanyAssets();
      }, 180000);
      cleanupFunctions.push(() => clearInterval(intervalId));
    }

    return () => {
      cleanupFunctions.forEach((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
    };
  }, [socketContext, showToast]);

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      getUser();

      try {
        await Promise.all([fetchCompanyAssets(true), fetchRequests(false, true)]);
      } catch (error) {
        console.error("Error loading asset data:", error);
      } finally {
        setTimeout(() => setPageLoading(false), 350);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm, pageSize]);

  const handleRequest = async () => {
    if (!newAsset) {
      showToast("Please select an asset.", "error", 4000);
      return;
    }

    const selectedAsset = companyAssets.find((asset) => asset._id === newAsset);
    if (!selectedAsset) {
      showToast("Invalid asset selected.", "error", 4000);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/asset-requests/request",
        {
          assetId: newAsset,
          reason: `Request for ${selectedAsset.name}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Request submitted successfully!", "success", 4000);
      setNewAsset("");
      await fetchRequests(true, true);
      await fetchCompanyAssets(true);
    } catch (error) {
      console.error("FULL ERROR:", error.response?.data);
      showToast(error.response?.data?.error || "Request failed", "error", 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositAsset = async (request) => {
    const requestId = request?._id;
    if (!requestId) {
      showToast("Request ID missing. Please refresh and try again.", "error", 4000);
      return;
    }

    setAssetActionLoading(true);
    try {
      await axios.post(`/asset-requests/${requestId}/deposit`);
      showToast("Asset marked as deposited", "success", 4000);
      await fetchRequests(true, true);
      await fetchCompanyAssets(true);
    } catch (error) {
      console.error("Deposit asset error:", error.response?.data || error);
      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to mark asset as deposited",
        "error",
        4000
      );
    } finally {
      setAssetActionLoading(false);
    }
  };

  if (pageLoading) {
    return <CIISLoader />;
  }

  const userName = userInfo?.name || "Your Name";
  const userCompany = userInfo?.companyName || "Your Company";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const lifecycleItems = [
    {
      label: "Return Requested",
      sub: "Admin requested return",
      icon: FiClipboard,
    },
    {
      label: "Pending Verification",
      sub: "Asset deposited by you",
      icon: FiMessageCircle,
    },
    {
      label: "Deposited",
      sub: "Admin verification pending",
      icon: FiShield,
    },
    {
      label: "Completed",
      sub: "Request completed",
      icon: FiCheckCircle,
    },
  ];

  return (
    <div className="MyAssets-shell">
      <div className="MyAssets-container">
        <section className="MyAssets-hero">
          <div className="MyAssets-hero-copy">
            <h1>Asset Management</h1>
            <p>Manage and request assets with real-time status tracking</p>

            <div className="MyAssets-user-row">
              <div className="MyAssets-user-avatar">{userInitials || "U"}</div>
              <div className="MyAssets-user-meta">
                <strong>{userName}</strong>
                <span>{userCompany}</span>
              </div>
            </div>
          </div>

          <div className="MyAssets-hero-art" aria-hidden="true">
            <div className="MyAssets-hero-grid" />
            <div className="MyAssets-hero-orbit" />
            <div className="MyAssets-cube">
              <div className="MyAssets-cube-top" />
              <div className="MyAssets-cube-left" />
              <div className="MyAssets-cube-right" />
            </div>
          </div>

          <button
            className="MyAssets-refresh-button"
            onClick={() => {
              fetchCompanyAssets(true);
              fetchRequests(true, true);
            }}
            disabled={refreshing}
            type="button"
          >
            <FiRefreshCw className={refreshing ? "MyAssets-spin" : ""} />
            Refresh
          </button>
        </section>

        <section className="MyAssets-summary-grid">
          <article className="MyAssets-summary-card">
            <div className="MyAssets-summary-icon MyAssets-blue">
              <FiPackage />
            </div>
            <div className="MyAssets-summary-copy">
              <span className="MyAssets-summary-label">AVAILABLE ASSETS</span>
              <div className="MyAssets-summary-value-row">
                <strong>{availableAssetsCount}</strong>
                <span>of {totalAssetsCount}</span>
              </div>
              <p>Ready to request</p>
            </div>
          </article>

          <article className="MyAssets-summary-card MyAssets-selected">
            <div className="MyAssets-summary-icon MyAssets-purple">
              <FiClipboard />
            </div>
            <div className="MyAssets-summary-copy">
              <span className="MyAssets-summary-label">TOTAL REQUESTS</span>
              <div className="MyAssets-summary-value-row">
                <strong>{stats.total}</strong>
              </div>
              <p>All time requests</p>
            </div>
          </article>

          <article className="MyAssets-summary-card">
            <div className="MyAssets-summary-icon MyAssets-orange">
              <FiRefreshCw />
            </div>
            <div className="MyAssets-summary-copy">
              <span className="MyAssets-summary-label">RETURN REQUESTED</span>
              <div className="MyAssets-summary-value-row">
                <strong>{stats.returnRequested}</strong>
              </div>
              <p>Awaiting your action</p>
            </div>
          </article>

          <article className="MyAssets-summary-card">
            <div className="MyAssets-summary-icon MyAssets-green">
              <FiCheckCircle />
            </div>
            <div className="MyAssets-summary-copy">
              <span className="MyAssets-summary-label">COMPLETED</span>
              <div className="MyAssets-summary-value-row">
                <strong>{stats.deposited}</strong>
              </div>
              <p>All requests completed</p>
            </div>
          </article>
        </section>

        <section className="MyAssets-panels-grid">
          <article className="MyAssets-panel">
            <div className="MyAssets-panel-head">
              <div className="MyAssets-panel-titleblock">
                <div className="MyAssets-panel-icon MyAssets-panel-icon-blue">
                  <FiTrendingUp />
                </div>
                <div>
                  <h2>Request New Asset</h2>
                  <p>Select from available company assets to make a request</p>
                </div>
              </div>
            </div>

            <div className="MyAssets-request-form">
              <div className="MyAssets-select-wrap">
                <select
                  className="MyAssets-select"
                  value={newAsset}
                  onChange={(e) => setNewAsset(e.target.value)}
                >
                  <option value="">Select asset type...</option>
                  {allowedAssets.map((asset) => (
                    <option key={asset.value} value={asset.value}>
                      {asset.label}
                      {asset.model ? ` (${asset.model})` : ""}
                      {asset.serialNumber ? ` - SN: ${asset.serialNumber}` : ""}
                    </option>
                  ))}
                  {allowedAssets.length === 0 && (
                    <option value="" disabled>
                      Loading assets...
                    </option>
                  )}
                </select>
              </div>

              <button
                className="MyAssets-primary-button"
                onClick={handleRequest}
                disabled={!newAsset || loading || availableAssetsCount === 0}
                type="button"
              >
                {loading ? (
                  <>
                    <span className="MyAssets-loading-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiPlus />
                    Request Asset
                  </>
                )}
              </button>

              <div className="MyAssets-help-box">
                <FiAlertCircle />
                <div>
                  <strong>Can&apos;t find the asset you need?</strong>
                  <p>Contact your administrator to add new assets to the system.</p>
                </div>
              </div>
            </div>
          </article>

          <article className="MyAssets-panel">
            <div className="MyAssets-panel-head">
              <div className="MyAssets-panel-titleblock">
                <div className="MyAssets-panel-icon MyAssets-panel-icon-blue">
                  <FiPackage />
                </div>
                <div>
                  <h2>My Assigned Assets</h2>
                  <p>Assets currently assigned to you and any return-in-progress requests</p>
                </div>
              </div>
            </div>

            <div className="MyAssets-assigned-list">
              {assignedAssets.length > 0 ? (
                assignedAssets.map((asset, idx) => {
                  const AssetIcon = getAssetIcon(asset.assetName);
                  const assetColor = getAssetColor(asset.assetName);
                  const status = normalizeStatus(asset.status);
                  return (
                    <div key={asset._id || idx} className="MyAssets-assigned-card">
                      <div className="MyAssets-assigned-main">
                        <div className={`MyAssets-assigned-icon MyAssets-${assetColor}`}>
                          <AssetIcon />
                        </div>
                        <div className="MyAssets-assigned-copy">
                          <h3>{asset.assetName}</h3>
                          <p>
                            {status === "approved" && `Approved by: ${asset.approvedBy?.name || "System"}`}
                            {status === "return_requested" && "Return request raised by admin"}
                            {status === "pending_verification" && "Awaiting admin verification"}
                            {status === "deposited" && "Deposit confirmed"}
                          </p>
                          <div className="MyAssets-assigned-meta">
                            <FiCalendar />
                            <span>{formatDate(asset.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="MyAssets-assigned-actions">
                          <span className={`MyAssets-status-pill MyAssets-status-${status || "approved"}`}>
                            {normalizeStatus(asset.status) === "return_requested"
                              ? "ADMIN HAS REQUESTED RETURN"
                              : getRequestSummary(asset)}
                          </span>
                          {status === "return_requested" && (
                            <button
                              type="button"
                              className="MyAssets-deposit-button"
                              onClick={() => handleDepositAsset(asset)}
                              disabled={assetActionLoading}
                            >
                              {assetActionLoading ? "Submitting..." : "Deposit Asset"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="MyAssets-empty-state">
                  <FiPackage />
                  <h3>No Assets Assigned</h3>
                  <p>Your assigned assets and return requests will appear here</p>
                </div>
              )}
            </div>

            <div className="MyAssets-active-count">Active Asset Items: {assignedAssets.length}</div>
          </article>
        </section>

        <section className="MyAssets-requests-panel">
          <div className="MyAssets-requests-head">
            <div className="MyAssets-panel-titleblock">
              <div className="MyAssets-panel-icon MyAssets-panel-icon-blue">
                <FiClipboard />
              </div>
              <div>
                <h2>Asset Requests</h2>
                <p>Track your asset request history and status</p>
              </div>
            </div>
          </div>

          <div className="MyAssets-tabs">
            {[
              { key: "all", label: `All Requests (${stats.total})` },
              { key: "approved", label: `Assigned (${stats.approved})` },
              { key: "return_requested", label: `Return Requested (${stats.returnRequested})` },
              { key: "pending_verification", label: `Pending Verification (${stats.pendingVerification})` },
              { key: "deposited", label: `Deposited (${stats.deposited})` },
              { key: "rejected", label: `Rejected (${stats.rejected})` },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`MyAssets-tab ${filterStatus === tab.key ? "is-active" : ""}`}
                onClick={() => setFilterStatus(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!isMobile ? (
            <div className="MyAssets-table-wrap">
              <table className="MyAssets-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Status</th>
                    <th>Approved By</th>
                    <th>Requested At</th>
                    <th>Comments</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.length > 0 ? (
                    visibleRequests.map((req) => {
                      const AssetIcon = getAssetIcon(req.assetName);
                      const assetColor = getAssetColor(req.assetName);
                      const dateParts = formatDateParts(req.createdAt);

                      return (
                        <tr key={req._id} className={`MyAssets-row status-${normalizeStatus(req.status)}`}>
                          <td>
                            <div className="MyAssets-asset-cell">
                              <div className={`MyAssets-asset-icon MyAssets-${assetColor}`}>
                                <AssetIcon />
                              </div>
                              <div>
                                <strong>{req.assetName}</strong>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`MyAssets-status-badge MyAssets-status-${normalizeStatus(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                          </td>
                          <td>
                            <span className="MyAssets-strong-text">
                              {req.approvedBy
                                ? req.approvedBy.name
                                : req.status === "pending"
                                ? "Pending Approval"
                                : "—"}
                            </span>
                          </td>
                          <td>
                            <div className="MyAssets-date-stack">
                              <span>{dateParts.date}</span>
                              <span>{dateParts.time}</span>
                            </div>
                          </td>
                          <td>
                            <button
                              className="MyAssets-outline-button"
                              type="button"
                              onClick={() => setViewCommentReq(req)}
                            >
                              <FiMessageCircle />
                              {req.adminComments?.length > 0 ? "View Comments" : "No Comments"}
                            </button>
                          </td>
                          <td>
                            <div className="MyAssets-action-cell">
                              {normalizeStatus(req.status) === "return_requested" ? (
                                <button
                                  className="MyAssets-deposit-button"
                                  onClick={() => handleDepositAsset(req)}
                                  disabled={assetActionLoading}
                                  type="button"
                                >
                                  {assetActionLoading ? "Submitting..." : "Deposit Asset"}
                                </button>
                              ) : (
                                <span className="MyAssets-request-note">{getRequestSummary(req)}</span>
                              )}
                              <button className="MyAssets-icon-button" type="button" title="More">
                                <FiMoreVertical />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="MyAssets-empty-cell">
                        <FiPackage />
                        <h3>No requests found</h3>
                        <p>{searchTerm ? "Try adjusting your search terms" : "Start by requesting a new asset"}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="MyAssets-mobile-list">
              {visibleRequests.length > 0 ? (
                visibleRequests.map((req) => {
                  const AssetIcon = getAssetIcon(req.assetName);
                  const assetColor = getAssetColor(req.assetName);
                  return (
                    <article key={req._id} className={`MyAssets-mobile-card status-${normalizeStatus(req.status)}`}>
                      <div className="MyAssets-mobile-head">
                        <div className="MyAssets-mobile-asset">
                          <div className={`MyAssets-mobile-icon MyAssets-${assetColor}`}>
                            <AssetIcon />
                          </div>
                          <div>
                            <h3>{req.assetName}</h3>
                            <p>{formatDate(req.createdAt)}</p>
                          </div>
                        </div>
                        <span className={`MyAssets-status-badge MyAssets-status-${normalizeStatus(req.status)}`}>
                          {getStatusLabel(req.status)}
                        </span>
                      </div>

                      <div className="MyAssets-mobile-meta">
                        <p>
                          <strong>Approved By:</strong>{" "}
                          {req.approvedBy
                            ? req.approvedBy.name
                            : req.status === "pending"
                            ? "Pending Approval"
                            : "—"}
                        </p>
                        {req.serialNumber && (
                          <p>
                            <strong>Serial:</strong> {req.serialNumber}
                          </p>
                        )}
                        <button
                          className="MyAssets-outline-button"
                          type="button"
                          onClick={() => setViewCommentReq(req)}
                        >
                          <FiMessageCircle />
                          {req.adminComments?.length > 0 ? "View Comments" : "No Comments"}
                        </button>
                        {normalizeStatus(req.status) === "return_requested" && (
                          <button
                            className="MyAssets-deposit-button"
                            onClick={() => handleDepositAsset(req)}
                            disabled={assetActionLoading}
                            type="button"
                          >
                            {assetActionLoading ? "Submitting..." : "Deposit Asset"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="MyAssets-empty-mobile">
                  <FiPackage />
                  <h3>No requests found</h3>
                  <p>{searchTerm ? "Try adjusting your search terms" : "Start by requesting a new asset"}</p>
                </div>
              )}
            </div>
          )}

          <div className="MyAssets-table-footer">
            <div className="MyAssets-table-footer-left">
              Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} requests
            </div>

            <div className="MyAssets-pagination">
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
              >
                <FiChevronLeft />
              </button>

              <span className="MyAssets-page-number">{currentPage}</span>

              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </section>

        <section className="MyAssets-lifecycle">
          <div className="MyAssets-lifecycle-copy">
            <h2>Asset Request Lifecycle</h2>
            <p>Track your request through each stage of the process</p>
          </div>

          <div className="MyAssets-lifecycle-track">
            {lifecycleItems.map((item, index) => {
              const Icon = item.icon;
              const stageNumber = index + 1;
              const isDone = lifecycleStatus > index;
              const isCurrent = lifecycleStatus === index + 1;
              const isUpcoming = lifecycleStatus < index + 1;
              return (
                <div
                  key={item.label}
                  className={`MyAssets-lifecycle-step ${isCurrent ? "is-active" : ""} ${isDone ? "is-done" : ""} ${isUpcoming ? "is-upcoming" : ""}`}
                >
                  <div className="MyAssets-lifecycle-top">
                    <div className="MyAssets-lifecycle-badge">
                      <Icon />
                    </div>
                    <span className="MyAssets-lifecycle-index">{stageNumber}</span>
                    {index < lifecycleItems.length - 1 && (
                      <span
                        className={`MyAssets-lifecycle-line ${lifecycleStatus > index + 1 ? "is-filled" : ""}`}
                      />
                    )}
                  </div>
                  <div className="MyAssets-lifecycle-body">
                    <strong>{item.label}</strong>
                    <p>{item.sub}</p>
                    {isCurrent && <span className="MyAssets-current-stage">Current Stage</span>}
                    {isDone && !isCurrent && <span className="MyAssets-complete-stage">Done</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="MyAssets-security-bar">
          <div className="MyAssets-security-note">
            <FiShield />
            <span>All asset requests are securely tracked and monitored to ensure transparency and accountability.</span>
          </div>
          <div className="MyAssets-security-tags">Secure • Transparent • Reliable</div>
        </section>
      </div>

      {viewCommentReq && (
        <div className="MyAssets-modal-overlay" onClick={() => setViewCommentReq(null)}>
          <div
            className="MyAssets-modal MyAssets-comments-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="MyAssets-modal-header">
              <h3>
                <FiMessageCircle /> Admin Comments
              </h3>
              <button type="button" aria-label="Close comments" onClick={() => setViewCommentReq(null)}>
                <FiX />
              </button>
            </div>

            <div className="MyAssets-modal-body">
              {viewCommentReq.adminComments?.length > 0 ? (
                <div className="MyAssets-comments-list">
                  {viewCommentReq.adminComments.map((c, i) => (
                    <article className="MyAssets-comment-card" key={c._id || i}>
                      <div className="MyAssets-comment-meta">
                        <strong>{c.addedBy?.name || "Admin"}</strong>
                        {formatCommentDate(c) && <time dateTime={c.addedAt || c.createdAt}>{formatCommentDate(c)}</time>}
                      </div>
                      {c.text && <p className="MyAssets-comment-text">{c.text}</p>}
                      {c.image &&
                        (isCommentImage(c) ? (
                          <button
                            type="button"
                            className="MyAssets-comment-image"
                            onClick={() =>
                              setCommentImagePreview({
                                src: getCommentAttachmentUrl(c.image),
                                name: c.originalName || "Comment attachment",
                              })
                            }
                          >
                            <img
                              src={getCommentAttachmentUrl(c.image)}
                              alt={c.originalName || "Comment attachment"}
                              loading="lazy"
                            />
                            <span>
                              <FiImage /> {c.originalName || "View image"}
                            </span>
                          </button>
                        ) : (
                          <a
                            className="MyAssets-comment-file"
                            href={getCommentAttachmentUrl(c.image)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FiFileText />
                            <span>{c.originalName || "Open attachment"}</span>
                          </a>
                        ))}
                    </article>
                  ))}
                </div>
              ) : (
                <p>No comments available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {commentImagePreview &&
        createPortal(
          <div className="MyAssets-image-preview-overlay" onClick={() => setCommentImagePreview(null)}>
            <div
              className="MyAssets-image-preview"
              role="dialog"
              aria-modal="true"
              aria-label={commentImagePreview.name}
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <strong>{commentImagePreview.name}</strong>
                <button type="button" aria-label="Close image preview" onClick={() => setCommentImagePreview(null)}>
                  <FiX />
                </button>
              </header>
              <div>
                <img src={commentImagePreview.src} alt={commentImagePreview.name} />
              </div>
            </div>
          </div>,
          document.body
        )}

      {notification && (
        <div className={`MyAssets-notification MyAssets-notification-${notification.severity}`}>
          <div className="MyAssets-notification-content">
            {notification.severity === "error" ? (
              <FiXCircle className="MyAssets-notification-icon" />
            ) : (
              <FiCheckCircle className="MyAssets-notification-icon" />
            )}
            <div className="MyAssets-notification-text">
              <strong>{notification.severity === "error" ? "Error" : "Success"}</strong>
              <p>{notification.message}</p>
            </div>
          </div>
          <button className="MyAssets-notification-close" onClick={() => setNotification(null)} type="button">
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MyAssets;
