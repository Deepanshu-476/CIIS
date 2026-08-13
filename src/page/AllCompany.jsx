import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config";
import CIISLoader from "../Loader/CIISLoader";
import "./AllCompany.css";

const getId = value => {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return String(value);
};

const extractList = data => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.companies)) return data.companies;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.message)) return data.message;
  return [];
};

const formatDate = value => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDaysLeft = value => {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getCompanyStatus = company => {
  if (company?.isActive === false) {
    return { label: "Inactive", tone: "danger" };
  }

  const daysLeft = getDaysLeft(company?.subscriptionExpiry);
  if (daysLeft === null) return { label: "Active", tone: "success" };
  if (daysLeft <= 0) return { label: "Expired", tone: "danger" };
  if (daysLeft <= 7) return { label: "Critical", tone: "warning" };
  if (daysLeft <= 30) return { label: "Expiring Soon", tone: "warning" };
  return { label: "Active", tone: "success" };
};

const getCompanyTone = company => {
  const status = getCompanyStatus(company).tone;
  if (status === "danger") return "danger";
  if (status === "warning") return "warning";
  return "success";
};

const getAvatarLabel = value => {
  const text = String(value || "").trim();
  if (!text) return "C";
  const parts = text.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "C";
  const second = parts[1]?.[0] || parts[0]?.[1] || "";
  return `${first}${second}`.toUpperCase();
};

const getSparkPath = tone => {
  switch (tone) {
    case "success":
      return "M2 28 C10 28, 14 15, 20 18 S32 30, 39 22 S52 6, 60 12 S73 28, 81 18 S93 12, 100 8";
    case "warning":
      return "M2 26 C10 25, 16 18, 22 21 S35 30, 43 20 S57 10, 66 14 S78 28, 86 18 S94 14, 100 10";
    default:
      return "M2 28 C10 28, 16 20, 22 22 S35 30, 43 20 S57 10, 66 14 S78 28, 86 18 S94 14, 100 10";
  }
};

const Sparkline = ({ tone }) => (
  <svg className="AllCompany-sparkline" viewBox="0 0 102 32" aria-hidden="true">
    <path d={getSparkPath(tone)} />
  </svg>
);

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  if (currentPage > 3) pages.push("ellipsis-left");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) pages.push("ellipsis-right");
  pages.push(totalPages);

  return [...new Set(pages)];
};

const getTrialPlanDurationDays = plan => {
  const isFreeTrialPlan =
    Number(plan?.price || 0) === 0 ||
    String(plan?.name || "").trim().toLowerCase().includes("free");

  return isFreeTrialPlan ? 90 : Number(plan?.durationDays || 90);
};

const AllCompany = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("companyName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [rowMenuOpenId, setRowMenuOpenId] = useState(null);
  const [rowMenuPosition, setRowMenuPosition] = useState(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscriptionCompany, setSubscriptionCompany] = useState(null);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("Standard");
  const [subscriptionAmount, setSubscriptionAmount] = useState("");
  const [subscriptionPaymentStatus, setSubscriptionPaymentStatus] = useState("paid");
  const [subscriptionPaymentMode, setSubscriptionPaymentMode] = useState("upi");
  const [subscriptionTransactionId, setSubscriptionTransactionId] = useState("");
  const [subscriptionPaymentDate, setSubscriptionPaymentDate] = useState("");
  const [subscriptionNotes, setSubscriptionNotes] = useState("");
  const [subscriptionActivateCompany, setSubscriptionActivateCompany] = useState(true);
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const getSeatLimit = company => {
    return (
      company?.maxEmployees ||
      company?.maxUsers ||
      company?.userLimit ||
      company?.planMaxUsers ||
      company?.selectedPlan?.maxUsers ||
      100
    );
  };

  const getUserCount = company => Number(company?.userCount || 0);

  const getCompanyInitials = company => getAvatarLabel(company?.companyName || company?.companyCode || "Company");

  const getCompanySearchText = company => [
    company?.companyName,
    company?.companyEmail,
    company?.companyCode,
    company?.ownerName,
    company?.subscriptionPlan,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  useEffect(() => {
    if (!rowMenuOpenId) return undefined;

    const closeMenu = event => {
      if (event?.target?.closest?.("[data-company-row-menu]")) return;
      setRowMenuOpenId(null);
      setRowMenuPosition(null);
    };

    window.addEventListener("mousedown", closeMenu);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [rowMenuOpenId]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const [companiesRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/superAdmin/companies`, { headers }),
        axios.get(`${API_URL}/superAdmin/users`, { headers }),
      ]);

      const allCompanies = extractList(companiesRes.data);
      const allUsers = extractList(usersRes.data);
      const usersByCompany = allUsers.reduce((acc, user) => {
        const companyId = getId(user?.company || user?.companyId);
        if (!companyId) return acc;
        if (!acc[companyId]) acc[companyId] = [];
        acc[companyId].push(user);
        return acc;
      }, {});

      const nextCompanies = allCompanies.map(company => {
        const companyId = getId(company);
        const companyUsers = usersByCompany[companyId] || [];
        return {
          ...company,
          _id: companyId,
          userCount: companyUsers.length,
          users: companyUsers,
        };
      });

      setCompanies(nextCompanies);
    } catch (error) {
      console.error("Failed to load companies:", error);
      toast.error(error.response?.data?.message || "Failed to load companies");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/plans?includeInactive=true`, { headers });
      setPlans(response.data?.plans || response.data?.data || []);
    } catch (error) {
      console.error("Failed to load plans:", error);
      setPlans([]);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchPlans();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, pageSize]);

  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter(company => company.isActive !== false).length;
    const inactive = total - active;
    const expiringSoon = companies.filter(company => {
      if (company.isActive === false) return false;
      const daysLeft = getDaysLeft(company.subscriptionExpiry);
      return daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
    }).length;

    return { total, active, inactive, expiringSoon };
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const next = companies.filter(company => {
      const matchesSearch = !term || getCompanySearchText(company).includes(term);
      const status = getCompanyStatus(company);

      let matchesFilter = true;
      if (statusFilter === "active") matchesFilter = company.isActive !== false;
      if (statusFilter === "inactive") matchesFilter = company.isActive === false;
      if (statusFilter === "expiring") matchesFilter = status.label === "Expiring Soon" || status.label === "Critical";

      return matchesSearch && matchesFilter;
    });

    next.sort((first, second) => {
      let compare = 0;
      switch (sortBy) {
        case "companyId":
          compare = String(first.companyCode || "").localeCompare(String(second.companyCode || ""));
          break;
        case "users":
          compare = getUserCount(first) - getUserCount(second);
          break;
        case "status":
          compare = getCompanyStatus(first).label.localeCompare(getCompanyStatus(second).label);
          break;
        case "expiry":
          compare = (new Date(first.subscriptionExpiry || 0)).getTime() - (new Date(second.subscriptionExpiry || 0)).getTime();
          break;
        default:
          compare = String(first.companyName || "").localeCompare(String(second.companyName || ""));
      }
      return sortOrder === "asc" ? compare : -compare;
    });

    return next;
  }, [companies, searchTerm, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startItem = filteredCompanies.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(filteredCompanies.length, currentPage * pageSize);
  const visibleIds = paginatedCompanies.map(company => getId(company));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const selectedCompanies = companies.filter(company => selectedIds.includes(getId(company)));

  const handleToggleVisibleSelection = () => {
    if (!visibleIds.length) return;
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const toggleSelectedId = id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const handleExport = (rows = filteredCompanies) => {
    if (!rows.length) {
      toast.info("No companies to export");
      return;
    }

    const headers = ["Company", "Company ID", "Email", "Owner", "Users", "Plan", "Status", "Expiry"];
    const csvRows = rows.map(company => ([
      company.companyName || "",
      company.companyCode || "",
      company.companyEmail || "",
      company.ownerName || "",
      getUserCount(company),
      company.subscriptionPlan || company.selectedPlan?.name || "",
      getCompanyStatus(company).label,
      formatDate(company.subscriptionExpiry),
    ]));

    const csv = [headers, ...csvRows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `companies-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDeleteCompanies = async ids => {
    if (!ids.length) return;
    const confirmed = window.confirm(`Delete ${ids.length} company(s)? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await Promise.all(ids.map(id => axios.delete(`${API_URL}/company/${id}`, { headers: getAuthHeaders() })));
      toast.success("Company deleted successfully");
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
      await fetchCompanies();
    } catch (error) {
      console.error("Failed to delete company:", error);
      toast.error(error.response?.data?.message || "Failed to delete company");
    }
  };

  const calculateExpiryDate = (startDateStr, planId, plansList = plans) => {
    if (!startDateStr || !planId) return "";
    const selectedPlan = plansList.find(plan => plan._id === planId);
    if (!selectedPlan) return "";
    const duration = getTrialPlanDurationDays(selectedPlan);
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + Number(duration));
    return date.toISOString().split("T")[0];
  };

  const openSubscriptionModal = company => {
    const selectedPlanId = typeof company?.selectedPlan === "object" ? company?.selectedPlan?._id : company?.selectedPlan || "";
    const selectedPlan = plans.find(plan => plan._id === selectedPlanId);
    const todayStr = new Date().toISOString().split("T")[0];

    setSubscriptionCompany(company);
    setSubscriptionPlanId(selectedPlanId);
    setSubscriptionStartDate(todayStr);
    setSubscriptionExpiryDate(calculateExpiryDate(todayStr, selectedPlanId) || (company?.subscriptionExpiry ? company.subscriptionExpiry.split("T")[0] : ""));
    setSubscriptionPlan(selectedPlan?.name || company?.subscriptionPlan || "Standard");
    setSubscriptionAmount(String(selectedPlan?.price ?? company?.subscriptionAmount ?? ""));
    setSubscriptionPaymentStatus(company?.subscriptionPaymentStatus || "paid");
    setSubscriptionPaymentMode(company?.subscriptionPayments?.[0]?.paymentMode || "upi");
    setSubscriptionTransactionId("");
    setSubscriptionPaymentDate(todayStr);
    setSubscriptionNotes("");
    setSubscriptionActivateCompany(company?.isActive !== false);
    setSubscriptionModalOpen(true);
  };

  const closeSubscriptionModal = () => {
    setSubscriptionModalOpen(false);
    setSubscriptionCompany(null);
    setSubscriptionPlanId("");
    setSubscriptionStartDate("");
    setSubscriptionExpiryDate("");
    setSubscriptionPlan("Standard");
    setSubscriptionAmount("");
    setSubscriptionPaymentStatus("paid");
    setSubscriptionPaymentMode("upi");
    setSubscriptionTransactionId("");
    setSubscriptionPaymentDate("");
    setSubscriptionNotes("");
    setSubscriptionActivateCompany(true);
    setSubscriptionSaving(false);
  };

  const handleSubscriptionPlanChange = planId => {
    const selectedPlan = plans.find(plan => plan._id === planId);
    setSubscriptionPlanId(planId);
    if (!selectedPlan) return;
    setSubscriptionPlan(selectedPlan.name || "Standard");
    setSubscriptionAmount(String(selectedPlan.price ?? 0));
    setSubscriptionExpiryDate(calculateExpiryDate(subscriptionStartDate, planId));
  };

  const handleStartDateChange = nextDate => {
    setSubscriptionStartDate(nextDate);
    if (subscriptionPlanId) {
      setSubscriptionExpiryDate(calculateExpiryDate(nextDate, subscriptionPlanId));
    }
  };

  const handleSaveSubscription = async () => {
    if (!subscriptionCompany?._id || !subscriptionExpiryDate) {
      toast.error("Please select plan and expiry date");
      return;
    }

    try {
      setSubscriptionSaving(true);
      const payload = {
        subscriptionExpiry: subscriptionExpiryDate,
        subscriptionStartDate,
        planId: subscriptionPlanId || undefined,
        planName: subscriptionPlan,
        amount: subscriptionAmount === "" ? 0 : Number(subscriptionAmount),
        paymentDate: subscriptionPaymentDate || subscriptionStartDate,
        paymentMode: subscriptionPaymentMode,
        transactionId: subscriptionTransactionId,
        paymentStatus: subscriptionPaymentStatus,
        notes: subscriptionNotes,
        isActive: subscriptionActivateCompany,
      };

      const response = await axios.patch(
        `${API_URL}/company/${subscriptionCompany._id}/subscription`,
        payload,
        { headers: getAuthHeaders() }
      );

      toast.success(response.data?.message || "Subscription updated successfully");
      closeSubscriptionModal();
      await fetchCompanies();
    } catch (error) {
      console.error("Failed to save subscription:", error);
      toast.error(error.response?.data?.message || "Failed to update subscription");
    } finally {
      setSubscriptionSaving(false);
    }
  };

  const handleToggleCompanyStatus = async company => {
    const nextActive = company.isActive === false;
    const endpoint = nextActive ? "activate" : "deactivate";
    const confirmed = window.confirm(`${nextActive ? "Activate" : "Deactivate"} ${company.companyName || "this company"}?`);
    if (!confirmed) return;

    try {
      await axios.patch(`${API_URL}/company/${company._id}/${endpoint}`, {}, { headers: getAuthHeaders() });
      toast.success(`Company ${nextActive ? "activated" : "deactivated"} successfully`);
      await fetchCompanies();
    } catch (error) {
      console.error("Failed to update company status:", error);
      toast.error(error.response?.data?.message || "Failed to update company status");
    }
  };

  const handleRowAction = (action, company) => {
    setRowMenuOpenId(null);

    switch (action) {
      case "users":
        navigate(`/Ciis-network/all-company/${company._id}/users`);
        break;
      case "subscription":
        openSubscriptionModal(company);
        break;
      case "status":
        handleToggleCompanyStatus(company);
        break;
      case "delete":
        handleDeleteCompanies([company._id]);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <CIISLoader />;
  }

  return (
    <div className="AllCompany-page">
      <div className="AllCompany-page-inner">
        <section className="AllCompany-hero">
          <div className="AllCompany-hero-copy">
            <h1>All Companies</h1>
            <p>Manage and monitor all registered companies in the system.</p>
          </div>

          <div className="AllCompany-hero-actions">
            <button type="button" className="AllCompany-btn AllCompany-btn-ghost" onClick={() => handleExport(filteredCompanies)}>
              <span className="material-icons">download</span>
              <span>Export</span>
            </button>
            <button
              type="button"
              className="AllCompany-btn AllCompany-btn-primary"
              onClick={() => navigate("/Ciis-network/RegisterCompany", {
                state: { returnTo: "/Ciis-network/all-company" }
              })}
            >
              <span className="material-icons">add</span>
              <span>Add Company</span>
            </button>
          </div>
        </section>

        <section className="AllCompany-stats-grid">
          <article className="AllCompany-stat-card AllCompany-card">
            <div className="AllCompany-stat-icon AllCompany-stat-icon-purple">
              <span className="material-icons">apartment</span>
            </div>
            <div className="AllCompany-stat-copy">
              <span className="AllCompany-stat-label">Total Companies</span>
              <strong className="AllCompany-stat-value">{stats.total}</strong>
              <span className="AllCompany-stat-meta">All registered companies</span>
            </div>
            <div className="AllCompany-stat-spark">
              <Sparkline tone="warning" />
              <span className="AllCompany-stat-trend AllCompany-trend-purple">+ 12%</span>
              <small>vs last month</small>
            </div>
          </article>

          <article className="AllCompany-stat-card AllCompany-card">
            <div className="AllCompany-stat-icon AllCompany-stat-icon-green">
              <span className="material-icons">domain_verification</span>
            </div>
            <div className="AllCompany-stat-copy">
              <span className="AllCompany-stat-label">Active Companies</span>
              <strong className="AllCompany-stat-value">{stats.active}</strong>
              <span className="AllCompany-stat-meta">{stats.total ? `${Math.round((stats.active / stats.total) * 100)}% of total companies` : "0% of total companies"}</span>
            </div>
            <div className="AllCompany-stat-spark">
              <Sparkline tone="success" />
              <span className="AllCompany-stat-trend">+ 8%</span>
              <small>vs last month</small>
            </div>
          </article>

          <article className="AllCompany-stat-card AllCompany-card">
            <div className="AllCompany-stat-icon AllCompany-stat-icon-orange">
              <span className="material-icons">pause_circle</span>
            </div>
            <div className="AllCompany-stat-copy">
              <span className="AllCompany-stat-label">Inactive Companies</span>
              <strong className="AllCompany-stat-value">{stats.inactive}</strong>
              <span className="AllCompany-stat-meta">{stats.total ? `${Math.round((stats.inactive / stats.total) * 100)}% of total companies` : "0% of total companies"}</span>
            </div>
            <div className="AllCompany-stat-spark">
              <Sparkline tone="danger" />
              <span className="AllCompany-stat-trend AllCompany-trend-orange">+ 4%</span>
              <small>vs last month</small>
            </div>
          </article>

          <article className="AllCompany-stat-card AllCompany-card">
            <div className="AllCompany-stat-icon AllCompany-stat-icon-blue">
              <span className="material-icons">schedule</span>
            </div>
            <div className="AllCompany-stat-copy">
              <span className="AllCompany-stat-label">Expiring Soon</span>
              <strong className="AllCompany-stat-value">{stats.expiringSoon}</strong>
              <span className="AllCompany-stat-meta">Within next 30 days</span>
            </div>
            <div className="AllCompany-stat-spark">
              <Sparkline tone="warning" />
              <span className="AllCompany-stat-trend">+ 15%</span>
              <small>vs last month</small>
            </div>
          </article>
        </section>

        <section className="AllCompany-card AllCompany-toolbar-card">
          <div className="AllCompany-toolbar-grid">
            <div className="AllCompany-search-wrap">
              <span className="material-icons AllCompany-search-icon">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search companies, ID, email..."
                className="AllCompany-input AllCompany-search-input"
              />
            </div>

            <label className="AllCompany-field">
              <span>Status</span>
              <select className="AllCompany-input" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </label>

            <label className="AllCompany-field">
              <span>Sort By</span>
              <select className="AllCompany-input" value={sortBy} onChange={event => setSortBy(event.target.value)}>
                <option value="companyName">Company Name</option>
                <option value="companyId">Company ID</option>
                <option value="users">Users</option>
                <option value="status">Status</option>
                <option value="expiry">Expiry Date</option>
              </select>
            </label>

            <label className="AllCompany-field">
              <span>Order</span>
              <select className="AllCompany-input" value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>

            <div className="AllCompany-toolbar-actions">
              <div className="AllCompany-popover-wrap">
                <button type="button" className="AllCompany-btn AllCompany-btn-outline" onClick={() => setFiltersOpen(prev => !prev)}>
                  <span className="material-icons">filter_alt</span>
                  <span>Filters</span>
                  <span className="AllCompany-chip">{[statusFilter !== "all", sortBy !== "companyName", sortOrder !== "asc"].filter(Boolean).length}</span>
                </button>

                {filtersOpen && (
                  <div className="AllCompany-mini-menu">
                    <button type="button" onClick={() => setStatusFilter("all")}>All Companies</button>
                    <button type="button" onClick={() => setStatusFilter("active")}>Active</button>
                    <button type="button" onClick={() => setStatusFilter("inactive")}>Inactive</button>
                    <button type="button" onClick={() => setStatusFilter("expiring")}>Expiring Soon</button>
                    <button type="button" onClick={() => {
                      setStatusFilter("all");
                      setSortBy("companyName");
                      setSortOrder("asc");
                    }}>
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>

              <div className="AllCompany-popover-wrap">
                <button type="button" className="AllCompany-btn AllCompany-btn-outline" onClick={() => setBulkMenuOpen(prev => !prev)}>
                  <span className="material-icons">inventory_2</span>
                  <span>Bulk Actions</span>
                </button>

                {bulkMenuOpen && (
                  <div className="AllCompany-mini-menu AllCompany-mini-menu-right">
                    <button type="button" onClick={() => handleExport(selectedIds.length ? selectedCompanies : filteredCompanies)}>
                      Export {selectedIds.length ? "Selected" : "Filtered"}
                    </button>
                    <button type="button" disabled={!selectedIds.length} onClick={() => handleDeleteCompanies(selectedIds)}>
                      Delete Selected
                    </button>
                    <button type="button" disabled={!selectedIds.length} onClick={() => setSelectedIds([])}>
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="AllCompany-card AllCompany-table-card">
          <div className="AllCompany-table-wrap">
            <table className="AllCompany-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={handleToggleVisibleSelection}
                      aria-label="Select visible companies"
                    />
                  </th>
                  <th>Company</th>
                  <th>Company ID</th>
                  <th>Users</th>
                  <th>Subscription</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.length > 0 ? (
                  paginatedCompanies.map((company, companyIndex) => {
                    const companyId = getId(company);
                    const status = getCompanyStatus(company);
                    const tone = getCompanyTone(company);
                    const userCount = getUserCount(company);
                    const seatLimit = getSeatLimit(company);
                    const planName = company?.selectedPlan?.name || company?.subscriptionPlan || "No Plan";
                    const expiryText = formatDate(company?.subscriptionExpiry);

                    return (
                      <tr key={companyId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(companyId)}
                            onChange={() => toggleSelectedId(companyId)}
                            aria-label={`Select ${company.companyName}`}
                          />
                        </td>
                        <td>
                          <div className="AllCompany-company-cell">
                            <div className={`AllCompany-avatar AllCompany-avatar-${tone}`}>
                              {company?.logo ? (
                                <img src={company.logo} alt={company.companyName || "Company"} />
                              ) : (
                                <span>{getCompanyInitials(company)}</span>
                              )}
                            </div>
                            <div className="AllCompany-company-meta">
                              <strong>{company.companyName || "Company"}</strong>
                              <span>{company.companyEmail || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="AllCompany-code">{company.companyCode || "N/A"}</td>
                        <td>
                          <div className="AllCompany-users-count">
                            <span className="material-icons">groups</span>
                            <strong>{userCount}</strong>
                            <span>/ {seatLimit}</span>
                          </div>
                        </td>
                        <td>
                          <div className="AllCompany-subscription-cell">
                            <strong>{planName}</strong>
                            <span>Exp: {expiryText}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`AllCompany-status-badge AllCompany-status-${status.tone}`}>
                            <span className="AllCompany-status-dot" />
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <div className="AllCompany-row-actions">
                            <button
                              type="button"
                              className="AllCompany-icon-button"
                              data-company-row-menu
                              onClick={event => {
                                const isClosing = rowMenuOpenId === companyId;
                                if (isClosing) {
                                  setRowMenuOpenId(null);
                                  setRowMenuPosition(null);
                                  return;
                                }

                                const rect = event.currentTarget.getBoundingClientRect();
                                const menuWidth = 190;
                                const menuHeight = 174;
                                const gap = 8;
                                const isBottomRow = companyIndex >= paginatedCompanies.length - 2;
                                const openUp = isBottomRow || window.innerHeight - rect.bottom < menuHeight + gap;
                                setRowMenuPosition({
                                  left: Math.max(12, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)),
                                  top: openUp ? Math.max(12, rect.bottom - menuHeight) : rect.bottom + gap,
                                });
                                setRowMenuOpenId(companyId);
                              }}
                              aria-label="Open actions"
                              aria-haspopup="menu"
                              aria-expanded={rowMenuOpenId === companyId}
                            >
                              <span className="material-icons">more_vert</span>
                            </button>

                            {rowMenuOpenId === companyId && rowMenuPosition && createPortal(
                              <div className="AllCompany-row-menu" style={rowMenuPosition} role="menu" data-company-row-menu>
                                <button type="button" onClick={() => handleRowAction("users", company)}>
                                  <span className="material-icons">groups</span>
                                  View Users
                                </button>
                                <button type="button" onClick={() => handleRowAction("subscription", company)}>
                                  <span className="material-icons">workspace_premium</span>
                                  Subscription
                                </button>
                                <button type="button" onClick={() => handleRowAction("status", company)}>
                                  <span className="material-icons">{company.isActive === false ? "check_circle" : "block"}</span>
                                  {company.isActive === false ? "Activate" : "Deactivate"}
                                </button>
                                <button type="button" onClick={() => handleRowAction("delete", company)}>
                                  <span className="material-icons">delete</span>
                                  Delete
                                </button>
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="AllCompany-empty-state">
                        <span className="material-icons">domain_disabled</span>
                        <strong>No companies found</strong>
                        <p>Try clearing filters or search with a different keyword.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="AllCompany-footer">
            <p>
              Showing {startItem} to {endItem} of {filteredCompanies.length} companies
            </p>

            <div className="AllCompany-pagination">
              <button type="button" className="AllCompany-page-btn" disabled={currentPage === 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>
                <span className="material-icons">chevron_left</span>
              </button>

              {getPaginationItems(currentPage, totalPages).map(item => (
                item === "ellipsis-left" || item === "ellipsis-right" ? (
                  <span key={item} className="AllCompany-page-ellipsis">...</span>
                ) : (
                  <button
                    type="button"
                    key={item}
                    className={`AllCompany-page-btn ${item === currentPage ? "is-active" : ""}`}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                )
              ))}

              <button type="button" className="AllCompany-page-btn" disabled={currentPage === totalPages} onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}>
                <span className="material-icons">chevron_right</span>
              </button>
            </div>

            <label className="AllCompany-page-size">
              <span>Per page</span>
              <select value={pageSize} onChange={event => setPageSize(Number(event.target.value))}>
                {[10, 20, 50].map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {subscriptionModalOpen && (
          <div className="AllCompany-modal-overlay" onClick={closeSubscriptionModal}>
            <div className="AllCompany-modal-content AllCompany-subscription-modal" onClick={event => event.stopPropagation()}>
              <div className="AllCompany-modal-header">
                <div>
                  <p className="AllCompany-modal-eyebrow">Subscription</p>
                  <h3 className="AllCompany-modal-title">{subscriptionCompany?.companyName || "Company"}</h3>
                  <p className="AllCompany-modal-subtitle">
                    {subscriptionCompany?.companyCode || "N/A"} • {subscriptionCompany?.subscriptionPlan || "No Plan"}
                  </p>
                </div>
                <button type="button" className="AllCompany-icon-button" onClick={closeSubscriptionModal} aria-label="Close subscription modal">
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="AllCompany-modal-body">
                <div className="AllCompany-subscription-current">
                  <div className="AllCompany-subscription-current-item">
                    <span>Current expiry</span>
                    <strong>{formatDate(subscriptionCompany?.subscriptionExpiry)}</strong>
                  </div>
                  <div className="AllCompany-subscription-current-item">
                    <span>Current plan</span>
                    <strong>{subscriptionCompany?.subscriptionPlan || subscriptionCompany?.selectedPlan?.name || "No Plan"}</strong>
                  </div>
                </div>

                <label className="AllCompany-subscription-label" htmlFor="subscriptionStartDate">
                  Plan Start Date
                </label>
                <input
                  id="subscriptionStartDate"
                  type="date"
                  className="AllCompany-input"
                  value={subscriptionStartDate}
                  onChange={event => handleStartDateChange(event.target.value)}
                />

                <label className="AllCompany-subscription-label">
                  New Expiry Date
                </label>
                <div className="AllCompany-subscription-preview">
                  {subscriptionExpiryDate ? formatDate(subscriptionExpiryDate) : "Select plan and start date"}
                </div>

                <div className="AllCompany-subscription-grid">
                  <label className="AllCompany-subscription-field">
                    <span>Plan</span>
                    <select
                      className="AllCompany-input"
                      value={subscriptionPlanId}
                      onChange={event => handleSubscriptionPlanChange(event.target.value)}
                    >
                      <option value="">Select plan</option>
                      {plans.filter(plan => plan.isActive !== false).map(plan => (
                        <option key={plan._id} value={plan._id}>
                          {plan.name} - ₹{Number(plan.price || 0).toLocaleString("en-IN")} / {getTrialPlanDurationDays(plan)} days
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="AllCompany-subscription-field">
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0"
                      className="AllCompany-input"
                      value={subscriptionAmount}
                      onChange={event => setSubscriptionAmount(event.target.value)}
                      placeholder="0"
                    />
                  </label>

                  <label className="AllCompany-subscription-field">
                    <span>Payment Status</span>
                    <select
                      className="AllCompany-input"
                      value={subscriptionPaymentStatus}
                      onChange={event => setSubscriptionPaymentStatus(event.target.value)}
                    >
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="waived">Waived</option>
                    </select>
                  </label>

                  <label className="AllCompany-subscription-field">
                    <span>Payment Mode</span>
                    <select
                      className="AllCompany-input"
                      value={subscriptionPaymentMode}
                      onChange={event => setSubscriptionPaymentMode(event.target.value)}
                    >
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="AllCompany-subscription-field">
                    <span>Payment Date</span>
                    <input
                      type="date"
                      className="AllCompany-input"
                      value={subscriptionPaymentDate}
                      onChange={event => setSubscriptionPaymentDate(event.target.value)}
                    />
                  </label>

                  <label className="AllCompany-subscription-field">
                    <span>Transaction ID</span>
                    <input
                      type="text"
                      className="AllCompany-input"
                      value={subscriptionTransactionId}
                      onChange={event => setSubscriptionTransactionId(event.target.value)}
                      placeholder="Optional"
                    />
                  </label>
                </div>

                <label className="AllCompany-subscription-toggle">
                  <input
                    type="checkbox"
                    checked={subscriptionActivateCompany}
                    onChange={event => setSubscriptionActivateCompany(event.target.checked)}
                  />
                  <span>Keep company active after saving</span>
                </label>

                <label className="AllCompany-subscription-label" htmlFor="subscriptionNotes">
                  Notes
                </label>
                <textarea
                  id="subscriptionNotes"
                  className="AllCompany-detail-textarea AllCompany-subscription-notes"
                  rows="3"
                  value={subscriptionNotes}
                  onChange={event => setSubscriptionNotes(event.target.value)}
                  placeholder="Payment or renewal notes"
                />
              </div>

              <div className="AllCompany-modal-footer">
                <button type="button" className="AllCompany-btn AllCompany-btn-ghost" onClick={closeSubscriptionModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="AllCompany-btn AllCompany-btn-primary"
                  onClick={handleSaveSubscription}
                  disabled={subscriptionSaving}
                >
                  {subscriptionSaving ? "Saving..." : "Save Subscription"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCompany;
