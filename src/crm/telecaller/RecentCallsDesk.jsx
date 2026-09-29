import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  PhoneCall,
  Clock,
  Zap,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flame,
  Search,
  ExternalLink,
  RefreshCw,
  Target,
  UserCheck,
  Eye,
  AlertCircle
} from "lucide-react";
import { TELECALLER_BASE as BASE } from "./telecallerPages";
import { DataTable } from "./CallComponents";
import { formatDate } from "./liveData";
import "./RecentCallsDesk.css";

export default function RecentCallsDesk({
  enriched = [],
  assigned = [],
  pending = [],
  today = [],
  followups = [],
  can = () => true,
  refresh = () => {}
}) {
  const [activeTab, setActiveTab] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const targetDailyCalls = 30;
  const callsTodayCount = today.length;
  const progressPercent = Math.min(100, Math.round((callsTodayCount / targetDailyCalls) * 100));

  // High priority leads: pending leads first, then assigned
  const priorityLeads = useMemo(() => {
    const list = pending.length > 0 ? pending : assigned;
    return list.slice(0, 6);
  }, [pending, assigned]);

  // Filtered queue for the "Ready to Call" tab
  const filteredQueue = useMemo(() => {
    const list = pending.length > 0 ? pending : assigned;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q))
    );
  }, [pending, assigned, searchQuery]);

  // Filtered followups
  const filteredFollowups = useMemo(() => {
    if (!searchQuery.trim()) return followups;
    const q = searchQuery.toLowerCase();
    return followups.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
    );
  }, [followups, searchQuery]);

  const avatarGradients = [
    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    "linear-gradient(135deg, #ec4899 0%, #d946ef 100%)",
    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
  ];

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || "LD").toUpperCase();
  };

  return (
    <div className="rc-desk-card">
      {/* Header */}
      <div className="rc-desk-header">
        <div className="rc-desk-title-group">
          <div className="rc-desk-icon-badge">
            <PhoneCall size={20} />
          </div>
          <div>
            <h3 className="rc-desk-title">Recent Call Activity & Live Desk</h3>
            <p className="rc-desk-subtitle">
              Manage latest calls, monitor outreach progress, and launch live outbound sessions
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="rc-desk-tabs">
          <button
            type="button"
            className={`rc-desk-tab ${activeTab === "recent" ? "active" : ""}`}
            onClick={() => setActiveTab("recent")}
          >
            <Phone size={13} />
            <span>Recent Calls</span>
            <span className="rc-tab-badge">{enriched.length}</span>
          </button>

          <button
            type="button"
            className={`rc-desk-tab ${activeTab === "queue" ? "active" : ""}`}
            onClick={() => setActiveTab("queue")}
          >
            <Zap size={13} />
            <span>Ready to Call</span>
            <span className="rc-tab-badge">{pending.length || assigned.length}</span>
          </button>

          <button
            type="button"
            className={`rc-desk-tab ${activeTab === "followups" ? "active" : ""}`}
            onClick={() => setActiveTab("followups")}
          >
            <Clock size={13} />
            <span>Follow-Ups</span>
            <span className="rc-tab-badge">{followups.length}</span>
          </button>
        </div>

        {/* Header Quick Launch Action */}
        <div className="rc-desk-header-actions">
          {can("call-workspace") && (
            <Link
              to={`${BASE}/call-workspace${priorityLeads[0]?.id ? `/${priorityLeads[0].id}` : ""}`}
              className="rc-btn-launch-workspace"
              title="Open full-screen dialing workspace"
            >
              <span className="rc-pulse-dot" />
              <PhoneCall size={14} />
              <span>Launch Workspace</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tab 1: Recent Calls */}
      {activeTab === "recent" && (
        <div className="rc-desk-tab-content">
          {enriched.length > 0 ? (
            <DataTable
              rows={enriched}
              title="Logged Calls"
              can={can}
              showViewAll={true}
            />
          ) : (
            <div className="rc-desk-body">
              {/* Hero Calling Kickstart Banner */}
              <div className="rc-hero-banner">
                <div className="rc-hero-left">
                  <span className="rc-hero-tag">
                    <Sparkles size={12} />
                    <span>Daily Outbound Desk</span>
                  </span>
                  <h4 className="rc-hero-title">
                    No Calls Logged Yet Today — Ready to Start Dialing?
                  </h4>
                  <p className="rc-hero-desc">
                    Your call log is waiting for your first connected conversation today. You have{" "}
                    <strong>{pending.length || assigned.length} assigned leads</strong> waiting in
                    your active queue. Pick a priority lead below or launch the smart workspace to begin.
                  </p>
                  <div className="rc-hero-actions">
                    <Link
                      to={`${BASE}/call-workspace${priorityLeads[0]?.id ? `/${priorityLeads[0].id}` : ""}`}
                      className="rc-btn-primary"
                    >
                      <PhoneCall size={14} />
                      <span>Start Calling Next Lead</span>
                      <ArrowRight size={13} />
                    </Link>
                    <Link to={`${BASE}/assigned-calls`} className="rc-btn-secondary">
                      <span>View All Assigned ({assigned.length})</span>
                    </Link>
                  </div>
                </div>

                {/* Right Column: Goal Tracker Card */}
                <div className="rc-goal-card">
                  <div className="rc-goal-header">
                    <span className="rc-goal-title">
                      <Target size={14} />
                      <span>Daily Calling Target</span>
                    </span>
                    <span className="rc-goal-count">
                      {callsTodayCount} / {targetDailyCalls}
                    </span>
                  </div>

                  <div className="rc-progress-bar-wrap">
                    <div
                      className="rc-progress-bar-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="rc-goal-chips">
                    <div className="rc-goal-chip">
                      <span className="rc-chip-val">{pending.length || assigned.length}</span>
                      <span className="rc-chip-lbl">In Queue</span>
                    </div>
                    <div className="rc-goal-chip">
                      <span className="rc-chip-val">{followups.length}</span>
                      <span className="rc-chip-lbl">Follow-ups</span>
                    </div>
                    <div className="rc-goal-chip">
                      <span className="rc-chip-val">45%+</span>
                      <span className="rc-chip-lbl">Target Connect</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Leads Sub-section */}
              {priorityLeads.length > 0 ? (
                <div className="rc-priority-section">
                  <div className="rc-section-head">
                    <div className="rc-section-title-wrap">
                      <h4>
                        <Flame size={16} color="#ef4444" />
                        <span>High Priority Leads Ready to Call (Next Up)</span>
                      </h4>
                      <p>
                        Click "Call Now" on any contact to immediately launch the dialer and log responses:
                      </p>
                    </div>
                    <Link to={`${BASE}/assigned-calls`} className="rc-view-all-link">
                      <span>See all {assigned.length} leads</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  <div className="rc-leads-grid">
                    {priorityLeads.map((lead, idx) => (
                      <div className="rc-lead-card" key={lead.id || idx}>
                        <div className="rc-lead-top">
                          <div
                            className="rc-lead-avatar"
                            style={{ background: avatarGradients[idx % avatarGradients.length] }}
                          >
                            {getInitials(lead.name)}
                          </div>
                          <div className="rc-lead-info">
                            <div className="rc-lead-name" title={lead.name}>
                              {lead.name}
                            </div>
                            <div className="rc-lead-phone">
                              <Phone size={11} color="#6366f1" />
                              <span>{lead.phone || "No phone number"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rc-lead-meta-row">
                          <span className="rc-meta-badge priority">
                            <Zap size={10} />
                            <span>{lead.date ? "Needs Follow-up" : "Never Called"}</span>
                          </span>
                          {lead.city && (
                            <span className="rc-meta-badge city">{lead.city}</span>
                          )}
                          <span className="rc-meta-badge source">
                            {lead.source || lead.type || "Direct Lead"}
                          </span>
                        </div>

                        <div className="rc-lead-card-actions">
                          <Link
                            to={`${BASE}/call-workspace/${lead.id}`}
                            className="rc-btn-call-lead"
                          >
                            <PhoneCall size={12} />
                            <span>Call Now</span>
                          </Link>
                          {can("lead-detail") && (
                            <Link
                              to={`${BASE}/lead-detail/${lead.id}`}
                              className="rc-btn-view-lead"
                              title="View Lead Details"
                            >
                              <Eye size={13} />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rc-empty-full">
                  <div className="rc-empty-icon-circle">
                    <PhoneCall size={26} />
                  </div>
                  <h4 className="rc-empty-title">All Queues Clear — No Assigned Leads</h4>
                  <p className="rc-empty-desc">
                    You don't have any pending leads in your queue right now. New leads assigned by
                    your admin or captured via inbound forms will immediately show up here.
                  </p>
                  <div style={{ display: "inline-flex", gap: "10px" }}>
                    <button
                      type="button"
                      className="rc-btn-secondary"
                      onClick={() => refresh()}
                    >
                      <RefreshCw size={13} />
                      <span>Refresh Queue</span>
                    </button>
                    <Link to={`${BASE}/call-history`} className="rc-btn-secondary">
                      <span>View Call History</span>
                    </Link>
                  </div>
                  <div>
                    <span className="rc-tip-strip">
                      💡 Pro Tip: Telecallers who reach out within 15 minutes of assignment experience a 3x higher conversion rate.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Priority Queue / Ready to Call */}
      {activeTab === "queue" && (
        <div className="rc-desk-body" style={{ paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h4 style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                Active Queue — {filteredQueue.length} Leads Waiting
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Sequential queue of leads assigned to your desk for outbound calling
              </p>
            </div>
            <div className="rc-search-bar">
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by name, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredQueue.length > 0 ? (
            <div className="rc-leads-grid">
              {filteredQueue.map((lead, idx) => (
                <div className="rc-lead-card" key={lead.id || idx}>
                  <div className="rc-lead-top">
                    <div
                      className="rc-lead-avatar"
                      style={{ background: avatarGradients[idx % avatarGradients.length] }}
                    >
                      {getInitials(lead.name)}
                    </div>
                    <div className="rc-lead-info">
                      <div className="rc-lead-name" title={lead.name}>
                        {lead.name}
                      </div>
                      <div className="rc-lead-phone">
                        <Phone size={11} color="#6366f1" />
                        <span>{lead.phone || "No phone number"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rc-lead-meta-row">
                    <span className="rc-meta-badge priority">
                      <Zap size={10} />
                      <span>{lead.date ? "Follow-up" : "Fresh Lead"}</span>
                    </span>
                    {lead.city && <span className="rc-meta-badge city">{lead.city}</span>}
                    <span className="rc-meta-badge source">
                      {lead.source || lead.type || "Inquiry"}
                    </span>
                  </div>

                  <div className="rc-lead-card-actions">
                    <Link
                      to={`${BASE}/call-workspace/${lead.id}`}
                      className="rc-btn-call-lead"
                    >
                      <PhoneCall size={12} />
                      <span>Call Now</span>
                    </Link>
                    {can("lead-detail") && (
                      <Link
                        to={`${BASE}/lead-detail/${lead.id}`}
                        className="rc-btn-view-lead"
                        title="View Lead Details"
                      >
                        <Eye size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rc-empty-full" style={{ padding: "32px 20px" }}>
              <p className="rc-empty-title" style={{ fontSize: "14px" }}>
                No leads matched your search query.
              </p>
              <button
                type="button"
                className="rc-btn-secondary"
                style={{ marginTop: 8 }}
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Follow-ups Due */}
      {activeTab === "followups" && (
        <div className="rc-desk-body" style={{ paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h4 style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                Scheduled Follow-Ups ({filteredFollowups.length})
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Leads that specifically requested callback or have follow-up schedules
              </p>
            </div>
            {filteredFollowups.length > 0 && (
              <div className="rc-search-bar">
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Filter follow-ups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {filteredFollowups.length > 0 ? (
            <div className="rc-leads-grid">
              {filteredFollowups.map((lead, idx) => (
                <div className="rc-lead-card" key={lead.id || idx}>
                  <div className="rc-lead-top">
                    <div
                      className="rc-lead-avatar"
                      style={{ background: avatarGradients[idx % avatarGradients.length] }}
                    >
                      {getInitials(lead.name)}
                    </div>
                    <div className="rc-lead-info">
                      <div className="rc-lead-name" title={lead.name}>
                        {lead.name}
                      </div>
                      <div className="rc-lead-phone">
                        <Phone size={11} color="#6366f1" />
                        <span>{lead.phone || "No phone number"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rc-lead-meta-row">
                    <span className="rc-meta-badge priority" style={{ background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" }}>
                      <Clock size={10} />
                      <span>{formatDate(lead.followUp)}</span>
                    </span>
                    {lead.outcome && (
                      <span className="rc-meta-badge source">
                        Last: {lead.outcome}
                      </span>
                    )}
                  </div>

                  <div className="rc-lead-card-actions">
                    <Link
                      to={`${BASE}/call-workspace/${lead.id}`}
                      className="rc-btn-call-lead"
                    >
                      <PhoneCall size={12} />
                      <span>Call Follow-up</span>
                    </Link>
                    {can("lead-detail") && (
                      <Link
                        to={`${BASE}/lead-detail/${lead.id}`}
                        className="rc-btn-view-lead"
                        title="View Lead Details"
                      >
                        <Eye size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rc-empty-full" style={{ padding: "36px 20px" }}>
              <div className="rc-empty-icon-circle" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                <CheckCircle2 size={26} />
              </div>
              <h4 className="rc-empty-title">All Follow-ups Completed!</h4>
              <p className="rc-empty-desc">
                You don't have any pending follow-ups right now. When you mark calls as "Need Callback" or "Follow-up", they will be scheduled here automatically.
              </p>
              <Link to={`${BASE}/assigned-calls`} className="rc-btn-primary">
                <span>Call Fresh Leads</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
