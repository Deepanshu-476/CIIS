import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import API_URL, { API_URL_IMG } from "../config";
import CIISLoader from "../Loader/CIISLoader";
import "./AllCompany.css";
import "./CompanyAdminDetails.css";

// Opened in a new tab from All Company: the owner / admins who registered and manage a company.
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
  if (!parts.length) return "A";
  return `${parts[0][0]}${parts[1]?.[0] || parts[0][1] || ""}`.toUpperCase();
};

const roleLabel = admin => {
  if (admin.isCompanyOwner) return "Owner";
  const role = String(admin.companyRole || admin.jobRoleName || admin.jobRole || "").toLowerCase();
  if (role.includes("super")) return "Super Admin";
  if (role.includes("owner")) return "Owner";
  return "Admin";
};

// "super_admin" -> "Super Admin"
const prettyRole = value => String(value || "").replace(/[_-]+/g, " ").trim().replace(/\b\w/g, ch => ch.toUpperCase());

const sourceLabel = value => (value === "self_register" ? "Self registration" : value === "admin" ? "Added by admin" : value || "—");

const Field = ({ icon, label, children }) => (
  <div className="CAD-field">
    <span className="material-icons CAD-field-icon">{icon}</span>
    <div>
      <div className="CAD-field-label">{label}</div>
      <div className="CAD-field-value">{children || "—"}</div>
    </div>
  </div>
);

export default function CompanyAdminDetails() {
  const { companyId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
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
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (data?.company?.companyName) document.title = `${data.company.companyName} · Admin details`;
  }, [data]);

  if (loading) return <CIISLoader />;

  const company = data?.company || {};
  const admins = data?.admins || [];
  const expiry = company.subscriptionExpiry ? new Date(company.subscriptionExpiry) : null;
  const expired = expiry && expiry < new Date();

  return (
    <div className="AllCompany-page">
      <div className="AllCompany-page-inner CAD-inner">
        {error ? (
          <div className="CAD-card CAD-error">
            <span className="material-icons">error_outline</span>
            <div>
              <strong>{error}</strong>
              <button type="button" className="AllCompany-btn AllCompany-btn-outline" onClick={load}>Retry</button>
            </div>
          </div>
        ) : (
          <>
            <section className="CAD-card CAD-company">
              <div className="CAD-company-logo">
                {company.logo ? <img src={imageSrc(company.logo)} alt="" /> : <span>{initials(company.companyName)}</span>}
              </div>
              <div className="CAD-company-main">
                <div className="CAD-eyebrow">Company admin details</div>
                <h1>{company.companyName || "Company"}</h1>
                <div className="CAD-company-meta">
                  <span>{company.companyCode}</span>
                  <span className={`CAD-pill ${company.isActive === false ? "CAD-pill-red" : "CAD-pill-green"}`}>
                    {company.isActive === false ? "Inactive" : "Active"}
                  </span>
                  <span className={`CAD-pill ${expired ? "CAD-pill-red" : "CAD-pill-blue"}`}>
                    {company.subscriptionPlan || "No plan"} · {expired ? "Expired" : "Exp"} {formatDate(company.subscriptionExpiry)}
                  </span>
                </div>
              </div>
              <div className="CAD-company-grid">
                <Field icon="person" label="Owner (registered)">{company.ownerName}</Field>
                <Field icon="mail" label="Company email">
                  {company.companyEmail ? <a href={`mailto:${company.companyEmail}`}>{company.companyEmail}</a> : null}
                </Field>
                <Field icon="call" label="Company phone">
                  {company.companyPhone ? <a href={`tel:${company.companyPhone}`}>{company.companyPhone}</a> : null}
                </Field>
                <Field icon="event" label="Registered on">{formatDate(company.createdAt)}</Field>
                <Field icon="place" label="Address">{company.companyAddress}</Field>
                <Field icon="language" label="Domain">{company.companyDomain}</Field>
              </div>
            </section>

            <h2 className="CAD-section-title">
              Admins &amp; Super Admins <span>{admins.length}</span>
            </h2>

            {admins.length === 0 ? (
              <div className="CAD-card CAD-empty">No owner or admin account was found for this company.</div>
            ) : (
              <div className="CAD-admin-grid">
                {admins.map(admin => (
                  <article key={admin._id} className="CAD-card CAD-admin">
                    <header className="CAD-admin-head">
                      <div className="CAD-avatar">
                        {admin.profileImage ? <img src={imageSrc(admin.profileImage)} alt="" /> : initials(admin.name)}
                      </div>
                      <div className="CAD-admin-name">
                        <h3>{admin.name || "—"}</h3>
                        <div className="CAD-admin-tags">
                          <span className="CAD-pill CAD-pill-purple">{roleLabel(admin)}</span>
                          <span className={`CAD-pill ${admin.isActive === false ? "CAD-pill-red" : "CAD-pill-green"}`}>
                            {admin.isActive === false ? "Inactive" : "Active"}
                          </span>
                          {admin.isOnline ? <span className="CAD-pill CAD-pill-green">Online</span> : null}
                        </div>
                      </div>
                    </header>
                    <div className="CAD-admin-fields">
                      <Field icon="mail" label="Email">
                        {admin.email ? <a href={`mailto:${admin.email}`}>{admin.email}</a> : null}
                      </Field>
                      <Field icon="call" label="Phone">
                        {admin.phone ? <a href={`tel:${admin.phone}`}>{admin.phone}</a> : null}
                      </Field>
                      <Field icon="badge" label="Employee ID">{admin.employeeId}</Field>
                      <Field icon="work" label="Job role">{prettyRole(admin.jobRoleName)}</Field>
                      <Field icon="apartment" label="Department">{admin.departmentName}</Field>
                      <Field icon="store" label="Branch">{admin.branch?.name || admin.branchName || admin.branchCode}</Field>
                      <Field icon="how_to_reg" label="Registered via">{sourceLabel(admin.registrationSource)}</Field>
                      <Field icon="verified" label="Registration status">{admin.registrationStatus}</Field>
                      <Field icon="calendar_today" label="Account created">{formatDate(admin.createdAt, true)}</Field>
                      <Field icon="event_available" label="Date of joining">{formatDate(admin.dateOfJoining)}</Field>
                      <Field icon="login" label="Last login">{formatDate(admin.lastLogin, true)}</Field>
                      <Field icon="location_city" label="City / State">
                        {[admin.city, admin.state, admin.country].filter(Boolean).join(", ")}
                      </Field>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
