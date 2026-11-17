import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL, { API_URL_IMG } from "../config";
import CIISLoader from "../Loader/CIISLoader";
import "./CompanyAdminDetails.css";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Building2,
  Crown,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Briefcase,
  Layers,
  Store,
  Clock,
  Search,
  X,
  AlertCircle,
  Activity,
  CheckCircle2,
  BadgeCheck
} from "lucide-react";

// Opened in a new tab / link from All Company: the owner / admins who registered and manage a company.
// Data: GET /company/:id/admins (contact and account fields only).

const formatDate = (value, withTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const imageSrc = value => {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${String(API_URL_IMG).replace(/\/+$/, "")}/${String(value).replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

const initials = name => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const PALETTE = [
  ["#3b82f6", "#1d4ed8"],
  ["#10b981", "#047857"],
  ["#8b5cf6", "#6d28d9"],
  ["#f59e0b", "#b45309"],
  ["#ec4899", "#be185d"],
  ["#06b6d4", "#0e7490"],
];

const getAvatarGradient = name => {
  const code = (name || "Company").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const [c1, c2] = PALETTE[code % PALETTE.length];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};

function CompanyAvatar({ name, logo, size = 64, fontSize = "1.25rem", isRound = false }) {
  if (logo) {
    return (
      <div
        className="CAD-company-logo"
        style={{
          width: size,
          height: size,
          borderRadius: isRound ? "50%" : "14px",
        }}
      >
        <img src={imageSrc(logo)} alt={name || "Company logo"} />
      </div>
    );
  }
  return (
    <div
      className="CAD-company-logo"
      style={{
        width: size,
        height: size,
        background: getAvatarGradient(name),
        color: "#ffffff",
        fontWeight: 600,
        fontSize,
        borderRadius: isRound ? "50%" : "14px",
      }}
    >
      {initials(name)}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard?.writeText(String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      className="CAD-copy-btn"
      onClick={handleCopy}
      title={copied ? "Copied!" : `${label}: ${text}`}
    >
      {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
    </button>
  );
}

function CopyCodePill({ code }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      className={`CAD-code-pill ${copied ? "CAD-code-copied" : ""}`}
      onClick={handleCopy}
      title="Click to copy company code"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      <span>{code}</span>
      {copied ? <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>Copied!</span> : null}
    </button>
  );
}

const roleLabel = admin => {
  if (admin.isCompanyOwner) return "Owner";
  const role = String(admin.companyRole || admin.jobRoleName || admin.jobRole || "").toLowerCase();
  if (role.includes("owner")) return "Owner";
  if (role.includes("super")) return "Super Admin";
  return "Admin";
};

const prettyRole = value =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, ch => ch.toUpperCase());

const sourceLabel = value => {
  if (value === "self_register") return "Self Registration";
  if (value === "admin") return "Added by Admin";
  if (!value) return "—";
  return prettyRole(value);
};

function getSubscriptionMeta(plan, expiry) {
  if (!expiry) return { label: plan || "Free Trial", isExpired: false, daysLeft: null };
  const expDate = new Date(expiry);
  const now = new Date();
  const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;
  return {
    label: plan || "Standard",
    isExpired,
    daysLeft: diffDays,
  };
}

export default function CompanyAdminDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_URL}/company/${companyId}/admins`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load admin details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (data?.company?.companyName) {
      document.title = `${data.company.companyName} · Admin Directory`;
    }
  }, [data]);

  const company = data?.company || {};
  const admins = useMemo(() => data?.admins || [], [data?.admins]);

  const subMeta = useMemo(
    () => getSubscriptionMeta(company.subscriptionPlan, company.subscriptionExpiry),
    [company.subscriptionPlan, company.subscriptionExpiry]
  );

  // Filter admins
  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      const role = roleLabel(admin).toLowerCase();
      if (roleFilter === "owner" && role !== "owner") return false;
      if (roleFilter === "super_admin" && role !== "super admin") return false;
      if (roleFilter === "admin" && role !== "admin") return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        String(admin.name || "").toLowerCase().includes(term) ||
        String(admin.email || "").toLowerCase().includes(term) ||
        String(admin.phone || "").toLowerCase().includes(term) ||
        String(admin.jobRoleName || "").toLowerCase().includes(term) ||
        String(admin.departmentName || "").toLowerCase().includes(term) ||
        String(admin.employeeId || "").toLowerCase().includes(term)
      );
    });
  }, [admins, searchTerm, roleFilter]);

  const roleCounts = useMemo(() => {
    let owner = 0, superAdmin = 0, admin = 0;
    admins.forEach(a => {
      const r = roleLabel(a);
      if (r === "Owner") owner++;
      else if (r === "Super Admin") superAdmin++;
      else admin++;
    });
    return { all: admins.length, owner, superAdmin, admin };
  }, [admins]);

  if (loading) return <CIISLoader />;

  return (
    <div className="CAD-wrapper">
      <div className="CAD-container">
        {/* Navigation Bar */}
        <div className="CAD-nav-bar">
          <div className="CAD-nav-left">
            <button
              type="button"
              className="CAD-btn-back"
              onClick={() => navigate("/Ciis-network/all-company")}
            >
              <ArrowLeft size={14} />
              <span>Back to All Companies</span>
            </button>
          </div>

          <div className="CAD-nav-right">
            <button
              type="button"
              className={`CAD-btn-secondary ${refreshing ? "CAD-btn-spin" : ""}`}
              onClick={() => load(true)}
              disabled={refreshing}
            >
              <RotateCcw size={13} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <a
              href={`/Ciis-network/all-company/${companyId}/view`}
              className="CAD-btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Activity size={14} />
              <span>Operations View</span>
              <ExternalLink size={12} opacity={0.7} />
            </a>
          </div>
        </div>

        {error ? (
          <div className="CAD-card CAD-error">
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Failed to load company administrators</strong>
              <p style={{ margin: "0 0 10px", fontSize: "0.82rem" }}>{error}</p>
              <button
                type="button"
                className="CAD-btn-secondary"
                onClick={() => load()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Company Hero Card */}
            <div className="CAD-card CAD-company-card">
              <div className="CAD-company-header">
                <CompanyAvatar
                  name={company.companyName}
                  logo={company.logo}
                  size={64}
                  fontSize="1.35rem"
                />

                <div className="CAD-company-info">
                  <div className="CAD-eyebrow">
                    <Building2 size={12} />
                    <span>Tenant Overview</span>
                  </div>

                  <h1 className="CAD-company-title">
                    {company.companyName || "Company"}
                  </h1>

                  <div className="CAD-badges-row">
                    <CopyCodePill code={company.companyCode} />

                    <span
                      className={`CAD-pill ${
                        company.isActive === false ? "CAD-pill-red" : "CAD-pill-green"
                      }`}
                    >
                      <span className="CAD-pill-dot" />
                      {company.isActive === false ? "Inactive" : "Active"}
                    </span>

                    <span
                      className={`CAD-pill ${
                        subMeta.isExpired ? "CAD-pill-red" : "CAD-pill-blue"
                      }`}
                    >
                      {subMeta.label} ·{" "}
                      {subMeta.isExpired
                        ? "Expired"
                        : subMeta.daysLeft !== null
                        ? `${subMeta.daysLeft}d left`
                        : "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Key Detail Grid */}
              <div className="CAD-company-grid">
                <div className="CAD-detail-item">
                  <div className="CAD-detail-icon">
                    <Crown size={17} color="#d97706" />
                  </div>
                  <div className="CAD-detail-content">
                    <div className="CAD-detail-label">Owner (Registered)</div>
                    <div className="CAD-detail-value">{company.ownerName || "—"}</div>
                  </div>
                </div>

                <div className="CAD-detail-item">
                  <div className="CAD-detail-icon">
                    <Mail size={17} color="#2563eb" />
                  </div>
                  <div className="CAD-detail-content">
                    <div className="CAD-detail-label">Company Email</div>
                    <div className="CAD-detail-value">
                      {company.companyEmail ? (
                        <>
                          <a href={`mailto:${company.companyEmail}`}>{company.companyEmail}</a>
                          <CopyButton text={company.companyEmail} label="Email" />
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>

                <div className="CAD-detail-item">
                  <div className="CAD-detail-icon">
                    <Phone size={17} color="#16a34a" />
                  </div>
                  <div className="CAD-detail-content">
                    <div className="CAD-detail-label">Company Phone</div>
                    <div className="CAD-detail-value">
                      {company.companyPhone ? (
                        <>
                          <a href={`tel:${company.companyPhone}`}>{company.companyPhone}</a>
                          <CopyButton text={company.companyPhone} label="Phone" />
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>

                <div className="CAD-detail-item">
                  <div className="CAD-detail-icon">
                    <Calendar size={17} color="#7c3aed" />
                  </div>
                  <div className="CAD-detail-content">
                    <div className="CAD-detail-label">Registered On</div>
                    <div className="CAD-detail-value">{formatDate(company.createdAt)}</div>
                  </div>
                </div>

                <div className="CAD-detail-item">
                  <div className="CAD-detail-icon">
                    <Globe size={17} color="#06b6d4" />
                  </div>
                  <div className="CAD-detail-content">
                    <div className="CAD-detail-label">Domain / Portal</div>
                    <div className="CAD-detail-value">
                      {company.companyDomain ? (
                        <a
                          href={`https://${company.companyDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {company.companyDomain}
                          <ExternalLink size={11} style={{ marginLeft: 4 }} />
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>

                <div className="CAD-detail-item">
                  <div className="CAD-detail-icon">
                    <MapPin size={17} color="#ef4444" />
                  </div>
                  <div className="CAD-detail-content">
                    <div className="CAD-detail-label">Registered Address</div>
                    <div className="CAD-detail-value">{company.companyAddress || "—"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Administrators Toolbar & Heading */}
            <div className="CAD-section-toolbar">
              <div className="CAD-section-title-wrap">
                <h2 className="CAD-section-title">Company Administrators</h2>
                <span className="CAD-count-badge">{admins.length} Total</span>
              </div>

              <div className="CAD-filter-controls">
                {/* Role Chips Filter */}
                <div className="CAD-role-chips">
                  <button
                    type="button"
                    className={`CAD-role-chip ${roleFilter === "all" ? "active" : ""}`}
                    onClick={() => setRoleFilter("all")}
                  >
                    All ({roleCounts.all})
                  </button>
                  <button
                    type="button"
                    className={`CAD-role-chip ${roleFilter === "owner" ? "active" : ""}`}
                    onClick={() => setRoleFilter("owner")}
                  >
                    Owners ({roleCounts.owner})
                  </button>
                  <button
                    type="button"
                    className={`CAD-role-chip ${roleFilter === "super_admin" ? "active" : ""}`}
                    onClick={() => setRoleFilter("super_admin")}
                  >
                    Super Admins ({roleCounts.superAdmin})
                  </button>
                  <button
                    type="button"
                    className={`CAD-role-chip ${roleFilter === "admin" ? "active" : ""}`}
                    onClick={() => setRoleFilter("admin")}
                  >
                    Admins ({roleCounts.admin})
                  </button>
                </div>

                {/* Instant Search Box */}
                <div className="CAD-search-box">
                  <Search size={14} color="#94a3b8" />
                  <input
                    type="text"
                    className="CAD-search-input"
                    placeholder="Search admins..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="CAD-search-clear"
                      onClick={() => setSearchTerm("")}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Admins Grid */}
            {filteredAdmins.length === 0 ? (
              <div className="CAD-empty">
                <Shield size={36} opacity={0.3} color="#64748b" />
                <p style={{ fontWeight: 600, color: "#0f172a" }}>No administrators found</p>
                <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  {searchTerm || roleFilter !== "all"
                    ? "Try adjusting your search keywords or role filter."
                    : "No owner or admin accounts have been registered for this company yet."}
                </p>
                {(searchTerm || roleFilter !== "all") && (
                  <button
                    type="button"
                    className="CAD-btn-secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setRoleFilter("all");
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="CAD-admin-grid">
                {filteredAdmins.map(admin => {
                  const role = roleLabel(admin);
                  const isOwner = admin.isCompanyOwner || role === "Owner";
                  const isSuperAdmin = role === "Super Admin";

                  return (
                    <article
                      key={admin._id}
                      className={`CAD-admin-card ${isOwner ? "is-owner" : isSuperAdmin ? "is-super-admin" : ""}`}
                    >
                      {/* Admin Header */}
                      <div className="CAD-admin-head">
                        <div className="CAD-avatar-wrap">
                          <CompanyAvatar
                            name={admin.name}
                            logo={admin.profileImage}
                            size={52}
                            fontSize="1rem"
                            isRound
                          />
                          {admin.isOnline && (
                            <span className="CAD-online-dot" title="Online now" />
                          )}
                        </div>

                        <div className="CAD-admin-identity">
                          <div className="CAD-admin-name-row">
                            <h3 className="CAD-admin-name">{admin.name || "Administrator"}</h3>
                            {admin.employeeId && (
                              <span className="CAD-emp-id-badge" title="Employee ID">
                                #{admin.employeeId}
                              </span>
                            )}
                          </div>

                          <div className="CAD-admin-tags">
                            <span
                              className={`CAD-pill ${
                                isOwner
                                  ? "CAD-pill-amber"
                                  : isSuperAdmin
                                  ? "CAD-pill-purple"
                                  : "CAD-pill-blue"
                              }`}
                            >
                              {isOwner ? <Crown size={11} /> : <Shield size={11} />}
                              {role}
                            </span>

                            <span
                              className={`CAD-pill ${
                                admin.isActive === false ? "CAD-pill-red" : "CAD-pill-green"
                              }`}
                            >
                              <span className="CAD-pill-dot" />
                              {admin.isActive === false ? "Inactive" : "Active"}
                            </span>

                            {admin.isOnline && (
                              <span className="CAD-pill CAD-pill-green">Online</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Fields Grid */}
                      <div className="CAD-admin-fields">
                        <div className="CAD-field">
                          <Mail className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Email Address</div>
                            <div className="CAD-field-val">
                              {admin.email ? (
                                <>
                                  <a href={`mailto:${admin.email}`}>{admin.email}</a>
                                  <CopyButton text={admin.email} label="Email" />
                                </>
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="CAD-field">
                          <Phone className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Phone Number</div>
                            <div className="CAD-field-val">
                              {admin.phone ? (
                                <>
                                  <a href={`tel:${admin.phone}`}>{admin.phone}</a>
                                  <CopyButton text={admin.phone} label="Phone" />
                                </>
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="CAD-field">
                          <Briefcase className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Job Role</div>
                            <div className="CAD-field-val">
                              {prettyRole(admin.jobRoleName) || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="CAD-field">
                          <Layers className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Department</div>
                            <div className="CAD-field-val">
                              {admin.departmentName || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="CAD-field">
                          <Store className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Branch / Store</div>
                            <div className="CAD-field-val">
                              {admin.branch?.name || admin.branchName || admin.branchCode || "All Branches"}
                            </div>
                          </div>
                        </div>

                        <div className="CAD-field">
                          <BadgeCheck className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Registration</div>
                            <div className="CAD-field-val">
                              {sourceLabel(admin.registrationSource)}
                              {admin.registrationStatus && (
                                <span style={{ color: "#64748b", fontSize: "0.72rem" }}>
                                  ({admin.registrationStatus})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="CAD-field">
                          <Calendar className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Date of Joining</div>
                            <div className="CAD-field-val">
                              {formatDate(admin.dateOfJoining)}
                            </div>
                          </div>
                        </div>

                        <div className="CAD-field">
                          <Clock className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Account Created</div>
                            <div className="CAD-field-val">
                              {formatDate(admin.createdAt, true)}
                            </div>
                          </div>
                        </div>

                        <div className="CAD-field CAD-field-full">
                          <User className="CAD-field-icon" />
                          <div className="CAD-field-body">
                            <div className="CAD-field-label">Last Login</div>
                            <div className="CAD-field-val">
                              {admin.lastLogin ? (
                                formatDate(admin.lastLogin, true)
                              ) : (
                                <span style={{ color: "#94a3b8" }}>Never logged in</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {(admin.city || admin.state || admin.country) && (
                          <div className="CAD-field CAD-field-full">
                            <MapPin className="CAD-field-icon" />
                            <div className="CAD-field-body">
                              <div className="CAD-field-label">Location</div>
                              <div className="CAD-field-val">
                                {[admin.city, admin.state, admin.country].filter(Boolean).join(", ")}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
