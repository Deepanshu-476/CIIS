import React, { useState, useMemo } from "react";
import {
  Phone,
  PhoneCall,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  UserPlus,
  FileText,
  Activity,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  MessageSquare,
  Flame,
  ArrowRight,
  TrendingUp,
  Tag,
  Shield,
  Send,
  ExternalLink,
  HelpCircle,
  Search,
  Filter,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { TELECALLER_BASE } from "./telecallerPages";
import { useTelecaller } from "./useTelecaller";
import { DEMO_DATE, formatDate } from "./demoData";
import { dateLabel } from "./LeadComponents";
import "./LeadDetail.css";

export default function LeadDetail() {
  const { leadId } = useParams();
  const { assigned, calls, can, editAllowed, saveCall } = useTelecaller();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLeads = useMemo(() => {
    return assigned.filter((row) => {
      const matchesSearch =
        !searchTerm ||
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.phone.includes(searchTerm) ||
        row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.city && row.city.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "Converted" && row.status === "Converted") ||
        (filterStatus === "Assigned" && row.status !== "Converted") ||
        (filterStatus === "High" && row.priority === "High");

      return matchesSearch && matchesStatus;
    });
  }, [assigned, searchTerm, filterStatus]);

  const leadIndex = assigned.findIndex((row) => row.id === leadId);
  const lead = leadIndex >= 0 ? assigned[leadIndex] : null;
  const prevLead = leadIndex > 0 ? assigned[leadIndex - 1] : null;
  const nextLead = leadIndex >= 0 && leadIndex < assigned.length - 1 ? assigned[leadIndex + 1] : null;

  return lead ? (
    <LeadDetailContent
      key={leadId}
      lead={lead}
      calls={calls.filter((call) => call.leadId === leadId)}
      can={can}
      editAllowed={editAllowed}
      onSaveCall={saveCall}
      prevLead={prevLead}
      nextLead={nextLead}
      totalLeads={assigned.length}
      currentIndex={leadIndex + 1}
    />
  ) : (
    <div className="ld-container">
      <div className="ld-card">
        <div className="ld-card-header">
          <h2 className="ld-card-title">
            <User size={16} />
            {leadId ? `Lead #${leadId} Not Found` : "Select a Lead"}
          </h2>
          <span style={{ fontSize: "12px", color: "var(--ld-text-muted)" }}>
            Total {assigned.length} Assigned Leads
          </span>
        </div>

        <div className="ld-card-body">
          <p style={{ color: "var(--ld-text-muted)", fontSize: "13px", marginTop: 0, marginBottom: 16 }}>
            {leadId
              ? `Lead ID #${leadId} is not in your current assigned leads list. Choose any lead below to view their profile, call logs, and timeline:`
              : "Search or click on any assigned student lead below to open their complete profile, calling workspace, notes, and activity timeline."}
          </p>

          {/* Search & Filter Toolbar */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 400 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ld-text-subtle)" }} />
              <input
                type="text"
                placeholder="Search by name, phone, lead ID, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 36px",
                  borderRadius: 8,
                  border: "1px solid var(--ld-border)",
                  fontSize: "12.5px",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#f8fafc",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Leads" },
                { id: "Assigned", label: "Pending Calls" },
                { id: "Converted", label: "Converted" },
                { id: "High", label: "🔥 High Priority" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterStatus(item.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: filterStatus === item.id ? "var(--ld-primary)" : "var(--ld-border)",
                    background: filterStatus === item.id ? "var(--ld-primary-light)" : "white",
                    color: filterStatus === item.id ? "var(--ld-primary)" : "var(--ld-text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lead Cards Grid */}
          <div className="ld-picker-grid">
            {filteredLeads.map((row) => (
              <Link
                key={row.id}
                to={`${TELECALLER_BASE}/lead-detail/${row.id}`}
                className="ld-picker-card"
              >
                <div className="ld-avatar" style={{ width: 46, height: 46, fontSize: 16 }}>
                  {row.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <strong style={{ fontSize: "13.5px", color: "var(--ld-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.name}
                    </strong>
                    <span className="ld-id-tag">#{row.id}</span>
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--ld-text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{row.phone}</span>
                    <span>•</span>
                    <span>{row.city || "Surat"}</span>
                  </div>

                  <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="ld-badge ld-badge-cyan">{row.type || "NEET"}</span>
                      <span className={`ld-badge ${row.status === "Converted" ? "ld-badge-success" : "ld-badge-primary"}`}>
                        {row.status || "Assigned"}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--ld-primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 2 }}>
                      View <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {!filteredLeads.length && (
              <div className="ld-empty-state" style={{ gridColumn: "1 / -1" }}>
                <div className="ld-empty-icon">
                  <Search size={22} />
                </div>
                <h4 className="ld-empty-title">No matching leads found</h4>
                <p className="ld-empty-desc">Try adjusting your search query or status filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadDetailContent({
  lead,
  calls,
  can,
  editAllowed,
  onSaveCall,
  prevLead,
  nextLead,
  totalLeads,
  currentIndex,
}) {
  const [activeTab, setActiveTab] = useState("Activity");
  const [newNote, setNewNote] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`);
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const noteRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}`,
      leadId: lead.id,
      date: `${DEMO_DATE}T14:45`,
      callType: "Outbound",
      outcome: "Note Added",
      notes: newNote.trim(),
      createdByName: "Telecaller 1",
    };

    onSaveCall(noteRecord);
    setNewNote("");
    showToast("Note added successfully!");
  };

  // Status & Priority Tones
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Converted":
        return "ld-badge-success";
      case "In Progress":
      case "Follow-up":
        return "ld-badge-warning";
      case "Lost":
      case "Cancelled":
        return "ld-badge-danger";
      default:
        return "ld-badge-primary";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "High":
        return "ld-badge-danger";
      case "Medium":
        return "ld-badge-warning";
      default:
        return "ld-badge-gray";
    }
  };

  const lastCall = calls[0];
  const totalNotes = calls.filter((c) => c.notes).length;
  const followUpCalls = calls.filter((c) => c.followUp);
  const nextFollowUp = followUpCalls.length > 0 ? followUpCalls[0].followUp : lead.followUp;

  const cleanPhone = (lead.phone || "").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${lead.name}, this is from CIIS Network regarding your inquiry for ${lead.type || "course"}.`
  )}`;

  return (
    <div className="ld-container">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="ld-toast">
          <Check size={16} style={{ color: "#10b981" }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Breadcrumb */}
      <div className="ld-top-nav">
        <div className="ld-breadcrumb">
          <Link to={`${TELECALLER_BASE}/dashboard`}>Dashboard</Link>
          <span className="ld-breadcrumb-sep">/</span>
          <Link to={`${TELECALLER_BASE}/assigned-calls`}>Assigned Calls</Link>
          <span className="ld-breadcrumb-sep">/</span>
          <span className="ld-breadcrumb-current">#{lead.id} ({lead.name})</span>
        </div>

        <div className="ld-nav-actions">
          {prevLead && (
            <Link
              to={`${TELECALLER_BASE}/lead-detail/${prevLead.id}`}
              className="ld-btn-nav"
              title={`Previous: ${prevLead.name}`}
            >
              <ChevronLeft size={14} /> Previous
            </Link>
          )}
          <span style={{ fontSize: "11.5px", color: "var(--ld-text-muted)", padding: "0 4px" }}>
            {currentIndex} of {totalLeads}
          </span>
          {nextLead && (
            <Link
              to={`${TELECALLER_BASE}/lead-detail/${nextLead.id}`}
              className="ld-btn-nav"
              title={`Next: ${nextLead.name}`}
            >
              Next <ChevronRight size={14} />
            </Link>
          )}
          <Link to={`${TELECALLER_BASE}/lead-detail`} className="ld-btn-nav">
            <User size={13} /> Select Another Lead
          </Link>
        </div>
      </div>

      {/* Hero Header Card */}
      <section className="ld-hero-card">
        <div className="ld-hero-main">
          <div className="ld-profile-info">
            <div className="ld-avatar-wrap">
              <div className="ld-avatar">
                {lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div
                className="ld-avatar-status"
                style={{
                  background:
                    lead.status === "Converted"
                      ? "var(--ld-success)"
                      : "var(--ld-primary)",
                }}
              />
            </div>

            <div className="ld-details-block">
              <div className="ld-title-row">
                <h1 className="ld-name">{lead.name}</h1>
                <button
                  type="button"
                  className="ld-id-tag"
                  onClick={() => copyToClipboard(`#${lead.id}`, "Lead ID")}
                  title="Click to copy ID"
                >
                  <Copy size={11} /> #{lead.id}
                </button>
              </div>

              <div className="ld-tags-row">
                <span className={`ld-badge ${getStatusBadgeClass(lead.status)}`}>
                  <CheckCircle size={12} /> {lead.status || "Assigned"}
                </span>

                <span className={`ld-badge ${getPriorityBadgeClass(lead.priority || "High")}`}>
                  <Flame size={12} /> {lead.priority || "High"} Priority
                </span>

                <span className="ld-badge ld-badge-purple">
                  <Tag size={12} /> {lead.source || "Facebook"}
                </span>

                <span className="ld-badge ld-badge-cyan">
                  <Sparkles size={12} /> {lead.type || "NEET"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="ld-hero-actions">
            {can("call-workspace") && (
              <Link
                to={`${TELECALLER_BASE}/call-workspace/${lead.id}`}
                className="ld-btn ld-btn-primary"
              >
                <PhoneCall size={14} /> Call Workspace
              </Link>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-btn ld-btn-whatsapp"
            >
              <MessageSquare size={14} /> WhatsApp
            </a>

            <a
              href={`mailto:${lead.email}`}
              className="ld-btn ld-btn-outline"
            >
              <Mail size={14} /> Email
            </a>
          </div>
        </div>

        {/* Contact Links Strip */}
        <div className="ld-contact-bar">
          <div className="ld-contact-chip">
            <Phone size={13} className="ld-contact-chip-icon" />
            <a
              href={`tel:${lead.phone}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              +91 {lead.phone}
            </a>
            <button
              type="button"
              className="ld-copy-btn"
              onClick={() => copyToClipboard(lead.phone, "Phone number")}
              title="Copy phone"
            >
              <Copy size={12} />
            </button>
          </div>

          <div className="ld-contact-chip">
            <Mail size={13} className="ld-contact-chip-icon" />
            <a
              href={`mailto:${lead.email}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {lead.email}
            </a>
            <button
              type="button"
              className="ld-copy-btn"
              onClick={() => copyToClipboard(lead.email, "Email address")}
              title="Copy email"
            >
              <Copy size={12} />
            </button>
          </div>

          <div className="ld-contact-chip">
            <MapPin size={13} className="ld-contact-chip-icon" />
            <span>{lead.city || "Surat, Gujarat"}</span>
          </div>

          <div className="ld-contact-chip">
            <User size={13} className="ld-contact-chip-icon" />
            <span>Assigned: <strong>{lead.assignedTo || "Telecaller 1"}</strong></span>
          </div>

          <div className="ld-contact-chip">
            <Calendar size={13} className="ld-contact-chip-icon" />
            <span>Created: {dateLabel(lead.createdAt || lead.assigned)}</span>
          </div>
        </div>
      </section>

      {/* Quick Stats / KPI Ribbon */}
      <section className="ld-stats-grid">
        <div className="ld-stat-card">
          <div className="ld-stat-icon-wrap ld-stat-icon-primary">
            <Activity size={20} />
          </div>
          <div className="ld-stat-content">
            <span className="ld-stat-label">Pipeline Status</span>
            <span className="ld-stat-value">{lead.status || "Assigned"}</span>
          </div>
        </div>

        <div className="ld-stat-card">
          <div className="ld-stat-icon-wrap ld-stat-icon-success">
            <PhoneCall size={20} />
          </div>
          <div className="ld-stat-content">
            <span className="ld-stat-label">Total Call Attempts</span>
            <span className="ld-stat-value">{calls.length} {calls.length === 1 ? "Call" : "Calls"}</span>
          </div>
        </div>

        <div className="ld-stat-card">
          <div className="ld-stat-icon-wrap ld-stat-icon-warning">
            <Clock size={20} />
          </div>
          <div className="ld-stat-content">
            <span className="ld-stat-label">Last Interaction</span>
            <span className="ld-stat-value">
              {lastCall ? `${lastCall.outcome} (${lastCall.timeAgo || dateLabel(lastCall.date)})` : "No calls yet"}
            </span>
          </div>
        </div>

        <div className="ld-stat-card">
          <div className="ld-stat-icon-wrap ld-stat-icon-purple">
            <Calendar size={20} />
          </div>
          <div className="ld-stat-content">
            <span className="ld-stat-label">Next Follow-up</span>
            <span className="ld-stat-value">
              {nextFollowUp ? dateLabel(nextFollowUp) : "Not scheduled"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="ld-main-grid">
        {/* Left Column: Sidebar Details */}
        <aside className="ld-sidebar">
          {/* Lead Information Card */}
          <div className="ld-card">
            <div className="ld-card-header">
              <h3 className="ld-card-title">
                <FileText size={15} /> Lead Information
              </h3>
            </div>
            <div className="ld-card-body">
              <dl className="ld-info-list">
                <div className="ld-info-row">
                  <dt className="ld-info-key">
                    <Tag size={13} /> Lead ID
                  </dt>
                  <dd className="ld-info-val">#{lead.id}</dd>
                </div>

                <div className="ld-info-row">
                  <dt className="ld-info-key">
                    <Activity size={13} /> Status
                  </dt>
                  <dd className="ld-info-val">
                    <span className={`ld-badge ${getStatusBadgeClass(lead.status)}`}>
                      {lead.status || "Assigned"}
                    </span>
                  </dd>
                </div>

                <div className="ld-info-row">
                  <dt className="ld-info-key">
                    <Flame size={13} /> Priority
                  </dt>
                  <dd className="ld-info-val">
                    <span className={`ld-badge ${getPriorityBadgeClass(lead.priority || "High")}`}>
                      {lead.priority || "High"}
                    </span>
                  </dd>
                </div>

                <div className="ld-info-row">
                  <dt className="ld-info-key">
                    <Sparkles size={13} /> Source
                  </dt>
                  <dd className="ld-info-val">
                    <span className="ld-badge ld-badge-purple">{lead.source || "Facebook"}</span>
                  </dd>
                </div>

                <div className="ld-info-row">
                  <dt className="ld-info-key">
                    <TrendingUp size={13} /> Target Program
                  </dt>
                  <dd className="ld-info-val">
                    <span className="ld-badge ld-badge-cyan">{lead.type || "NEET"}</span>
                  </dd>
                </div>

                <div className="ld-info-row">
                  <dt className="ld-info-key">
                    <User size={13} /> Assigned Agent
                  </dt>
                  <dd className="ld-info-val">{lead.assignedTo || "Telecaller 1"}</dd>
                </div>

                <div className="ld-info-row">
                  <dt className="ld-info-key">
                    <Calendar size={13} /> Created Date
                  </dt>
                  <dd className="ld-info-val">{dateLabel(lead.createdAt || lead.assigned)}</dd>
                </div>

                <div className="ld-info-row">
                  <dt className="ld-info-key">
                    <Clock size={13} /> Last Contacted
                  </dt>
                  <dd className="ld-info-val">
                    {lastCall ? dateLabel(lastCall.date) : "Never"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="ld-card">
            <div className="ld-card-header">
              <h3 className="ld-card-title">
                <User size={15} /> Contact Person
              </h3>
            </div>
            <div className="ld-card-body">
              <div className="ld-contact-list">
                <div className="ld-contact-item">
                  <div className="ld-contact-item-left">
                    <Phone size={15} className="ld-contact-item-icon" />
                    <div className="ld-contact-item-text">
                      <span className="ld-contact-item-label">Mobile Phone</span>
                      <span className="ld-contact-item-val">+91 {lead.phone}</span>
                    </div>
                  </div>
                  <div className="ld-contact-item-actions">
                    <a
                      href={`tel:${lead.phone}`}
                      className="ld-icon-btn"
                      title="Direct call"
                    >
                      <PhoneCall size={13} />
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ld-icon-btn"
                      title="WhatsApp chat"
                    >
                      <MessageSquare size={13} />
                    </a>
                  </div>
                </div>

                <div className="ld-contact-item">
                  <div className="ld-contact-item-left">
                    <Mail size={15} className="ld-contact-item-icon" />
                    <div className="ld-contact-item-text">
                      <span className="ld-contact-item-label">Email Address</span>
                      <span className="ld-contact-item-val">{lead.email}</span>
                    </div>
                  </div>
                  <div className="ld-contact-item-actions">
                    <a
                      href={`mailto:${lead.email}`}
                      className="ld-icon-btn"
                      title="Send Email"
                    >
                      <Mail size={13} />
                    </a>
                  </div>
                </div>

                <div className="ld-contact-item">
                  <div className="ld-contact-item-left">
                    <MapPin size={15} className="ld-contact-item-icon" />
                    <div className="ld-contact-item-text">
                      <span className="ld-contact-item-label">Location / City</span>
                      <span className="ld-contact-item-val">{lead.city || "Surat, Gujarat"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tags Cloud */}
          <div className="ld-card">
            <div className="ld-card-header">
              <h3 className="ld-card-title">
                <Tag size={15} /> Lead Tags
              </h3>
            </div>
            <div className="ld-card-body">
              <div className="ld-tags-cloud">
                <span className="ld-tag-pill"># {lead.type || "NEET-2026"}</span>
                <span className="ld-tag-pill"># {lead.source || "Facebook-Campaign"}</span>
                <span className="ld-tag-pill"># {lead.city || "Gujarat-Region"}</span>
                <span className="ld-tag-pill"># High-Intent</span>
                <span className="ld-tag-pill"># Priority-Lead</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Activity Hub */}
        <main className="ld-activity-hub">
          {/* Tabs Navigation */}
          <div className="ld-tabs-header" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "Activity"}
              className={`ld-tab-btn ${activeTab === "Activity" ? "active" : ""}`}
              onClick={() => setActiveTab("Activity")}
            >
              <Activity size={15} /> Activity Timeline
              <span className="ld-tab-count">{calls.length + 2}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "Notes"}
              className={`ld-tab-btn ${activeTab === "Notes" ? "active" : ""}`}
              onClick={() => setActiveTab("Notes")}
            >
              <FileText size={15} /> Notes & Remarks
              <span className="ld-tab-count">{totalNotes}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "Calls"}
              className={`ld-tab-btn ${activeTab === "Calls" ? "active" : ""}`}
              onClick={() => setActiveTab("Calls")}
            >
              <PhoneCall size={15} /> Call Logs
              <span className="ld-tab-count">{calls.length}</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="ld-tab-content">
            {/* 1. Activity Timeline Tab */}
            {activeTab === "Activity" && (
              <div className="ld-timeline-wrap">
                {calls.map((call) => (
                  <div key={call.id} className="ld-timeline-item">
                    <div className="ld-timeline-node success">
                      <PhoneCall size={15} />
                    </div>
                    <div className="ld-timeline-card">
                      <div className="ld-timeline-top">
                        <div className="ld-timeline-badges">
                          <span className="ld-badge ld-badge-success">
                            {call.callType || "Outbound"} Call
                          </span>
                          <span className="ld-badge ld-badge-primary">
                            {call.outcome}
                          </span>
                          <span className="ld-badge ld-badge-gray">
                            <User size={10} /> {call.createdByName || lead.assignedTo || "Telecaller 1"}
                          </span>
                        </div>
                        <span className="ld-timeline-time">
                          <Clock size={12} /> {call.timeAgo || dateLabel(call.date)}
                        </span>
                      </div>
                      <p className="ld-timeline-body">
                        <strong>Outcome:</strong> {call.outcome}
                        {call.notes && (
                          <span>
                            {" "}— <em>"{call.notes}"</em>
                          </span>
                        )}
                        {call.followUp && (
                          <span style={{ display: "block", marginTop: "6px", color: "var(--ld-primary)", fontWeight: 500 }}>
                            📅 Follow-up scheduled: {dateLabel(call.followUp)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Lead Assigned System Event */}
                <div className="ld-timeline-item">
                  <div className="ld-timeline-node purple">
                    <UserPlus size={15} />
                  </div>
                  <div className="ld-timeline-card">
                    <div className="ld-timeline-top">
                      <div className="ld-timeline-badges">
                        <span className="ld-badge ld-badge-purple">Lead Assigned</span>
                        <span className="ld-badge ld-badge-gray">Admin</span>
                      </div>
                      <span className="ld-timeline-time">
                        <Clock size={12} /> {dateLabel(lead.assigned)}
                      </span>
                    </div>
                    <p className="ld-timeline-body">
                      Assigned to <strong>{lead.assignedTo || "Telecaller 1"}</strong> for outreach, counseling, and customer engagement.
                    </p>
                  </div>
                </div>

                {/* Lead Created System Event */}
                <div className="ld-timeline-item">
                  <div className="ld-timeline-node cyan">
                    <Sparkles size={15} />
                  </div>
                  <div className="ld-timeline-card">
                    <div className="ld-timeline-top">
                      <div className="ld-timeline-badges">
                        <span className="ld-badge ld-badge-cyan">Lead Created</span>
                        <span className="ld-badge ld-badge-gray">System</span>
                      </div>
                      <span className="ld-timeline-time">
                        <Clock size={12} /> {dateLabel(lead.createdAt || lead.assigned)}
                      </span>
                    </div>
                    <p className="ld-timeline-body">
                      Lead captured via <strong>{lead.source || "Facebook"}</strong> for <strong>{lead.type || "NEET"}</strong> program.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Notes & Remarks Tab */}
            {activeTab === "Notes" && (
              <div>
                {/* Inline Quick Note Composer */}
                <form onSubmit={handleAddNote} className="ld-note-composer">
                  <label className="ld-note-composer-title">
                    <FileText size={14} /> Add Quick Note / Interaction Log
                  </label>
                  <textarea
                    className="ld-note-textarea"
                    placeholder="Type details about your conversation, student interest level, next steps..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="ld-note-footer">
                    <button
                      type="submit"
                      disabled={!newNote.trim()}
                      className="ld-btn ld-btn-primary"
                      style={{ padding: "7px 16px", fontSize: "12px" }}
                    >
                      <Send size={13} /> Save Note
                    </button>
                  </div>
                </form>

                {/* List of Notes */}
                <div className="ld-notes-list">
                  {calls
                    .filter((c) => c.notes)
                    .map((call) => (
                      <article key={call.id} className="ld-note-card">
                        <div className="ld-note-icon">
                          <FileText size={18} />
                        </div>
                        <div className="ld-note-content">
                          <p className="ld-note-text">{call.notes}</p>
                          <div className="ld-note-meta">
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <User size={12} /> {call.createdByName || lead.assignedTo || "Telecaller 1"}
                            </span>
                            <span>•</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Clock size={12} /> {dateLabel(call.date)}
                            </span>
                            {call.outcome && (
                              <>
                                <span>•</span>
                                <span className="ld-badge ld-badge-primary">{call.outcome}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}

                  {!calls.some((c) => c.notes) && (
                    <div className="ld-empty-state">
                      <div className="ld-empty-icon">
                        <FileText size={24} />
                      </div>
                      <h4 className="ld-empty-title">No notes added yet</h4>
                      <p className="ld-empty-desc">
                        Use the composer above to record remarks, student queries, or counseling feedback.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Call Logs Tab */}
            {activeTab === "Calls" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ld-text-main)" }}>
                    All Call Records ({calls.length})
                  </span>
                  {can("call-workspace") && (
                    <Link
                      to={`${TELECALLER_BASE}/call-workspace/${lead.id}`}
                      className="ld-btn ld-btn-primary"
                      style={{ padding: "7px 14px", fontSize: "12px" }}
                    >
                      <PhoneCall size={13} /> Log New Call
                    </Link>
                  )}
                </div>

                <div className="ld-calls-table-wrap">
                  <table className="ld-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Call Type</th>
                        <th>Outcome</th>
                        <th>Next Follow-up</th>
                        <th>Notes</th>
                        <th>Telecaller</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map((call) => (
                        <tr key={call.id}>
                          <td style={{ fontWeight: 600 }}>{dateLabel(call.date)}</td>
                          <td>
                            <span className="ld-badge ld-badge-primary">
                              {call.callType || "Outbound"}
                            </span>
                          </td>
                          <td>
                            <span className="ld-badge ld-badge-success">
                              {call.outcome}
                            </span>
                          </td>
                          <td>
                            {call.followUp ? (
                              <span style={{ color: "var(--ld-primary)", fontWeight: 500 }}>
                                {dateLabel(call.followUp)}
                              </span>
                            ) : (
                              <span style={{ color: "var(--ld-text-subtle)" }}>—</span>
                            )}
                          </td>
                          <td style={{ maxWidth: 220, color: "var(--ld-text-muted)" }}>
                            {call.notes || "—"}
                          </td>
                          <td>{call.createdByName || lead.assignedTo || "Telecaller 1"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!calls.length && (
                    <div className="ld-empty-state">
                      <div className="ld-empty-icon">
                        <PhoneCall size={24} />
                      </div>
                      <h4 className="ld-empty-title">No call records found</h4>
                      <p className="ld-empty-desc">
                        No previous calls have been logged for this lead yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
