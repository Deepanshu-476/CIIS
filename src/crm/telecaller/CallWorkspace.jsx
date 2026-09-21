import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  CalendarClock,
  Lock,
  User,
  UserPlus,
  Info,
  FileText,
  Save,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Tag,
  Flame,
  Search,
  ArrowRight,
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  PhoneMissed,
  PhoneOff,
  Smartphone,
  WifiOff,
  AlertTriangle,
  UserX,
  Ban,
  Languages,
  MailWarning,
  CheckCircle,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../utils/axiosConfig";
import { localDateTime, isTerminal, outcomes, normalizeLead } from "./liveData";
import { TELECALLER_BASE as BASE } from "./telecallerPages";
import { useTelecaller } from "./useTelecaller";
import { dateLabel } from "./LeadComponents";
import "./CallWorkspace.css";

export const outcomeIconsMap = {
  "Connected": PhoneCall,
  "Interested": ThumbsUp,
  "Not Interested": ThumbsDown,
  "Need Callback": PhoneIncoming,
  "Follow-up": Calendar,
  "Call Later": Clock,
  "No Answer": PhoneMissed,
  "Busy": PhoneOff,
  "Switched Off": Smartphone,
  "Not Reachable": WifiOff,
  "Wrong Number": AlertTriangle,
  "Wrong Person": UserX,
  "Invalid Number": Ban,
  "Language Barrier": Languages,
  "Do Not Call": PhoneOff,
  "Duplicate": Copy,
  "Spam": MailWarning,
  "Call Closed": Lock,
  "Converted": CheckCircle,
};

export const outcomeToneMap = {
  "Connected": "tone-green",
  "Interested": "tone-green",
  "Not Interested": "tone-red",
  "Need Callback": "tone-cyan",
  "Follow-up": "tone-purple",
  "Call Later": "tone-orange",
  "No Answer": "tone-orange",
  "Busy": "tone-red",
  "Switched Off": "tone-dark",
  "Not Reachable": "tone-blue",
  "Wrong Number": "tone-red",
  "Wrong Person": "tone-blue",
  "Invalid Number": "tone-red",
  "Language Barrier": "tone-cyan",
  "Do Not Call": "tone-red",
  "Duplicate": "tone-blue",
  "Spam": "tone-red",
  "Call Closed": "tone-dark",
  "Converted": "tone-green",
};

export const outcomeCategories = [
  {
    category: "Positive & Interested",
    badge: "Positive",
    badgeClass: "badge-green",
    items: ["Connected", "Interested", "Converted"],
  },
  {
    category: "Follow-up & Callbacks",
    badge: "Callback Required",
    badgeClass: "badge-purple",
    items: ["Need Callback", "Follow-up", "Call Later"],
  },
  {
    category: "Unreachable / No Response",
    badge: "Try Again",
    badgeClass: "badge-amber",
    items: ["No Answer", "Busy", "Switched Off", "Not Reachable"],
  },
  {
    category: "Disqualified & Closed",
    badge: "Drop / Closed",
    badgeClass: "badge-rose",
    items: [
      "Not Interested",
      "Wrong Number",
      "Wrong Person",
      "Invalid Number",
      "Language Barrier",
      "Do Not Call",
      "Duplicate",
      "Spam",
      "Call Closed",
    ],
  },
];

export default function CallWorkspace() {
  const { leadId } = useParams();
  const { assigned, calls, can, editAllowed, saveCall } = useTelecaller();
  const [directLead, setDirectLead] = useState(null);
  const [fetchingDirect, setFetchingDirect] = useState(false);
  const [directError, setDirectError] = useState(null);

  const leadIndex = assigned.findIndex((row) => row.id === leadId);
  const leadFromAssigned = leadIndex >= 0 ? assigned[leadIndex] : null;
  const prevLead = leadIndex > 0 ? assigned[leadIndex - 1] : null;
  const nextLead = leadIndex >= 0 && leadIndex < assigned.length - 1 ? assigned[leadIndex + 1] : null;

  // Direct fetch fallback if URL has a leadId not found in local assigned list
  useEffect(() => {
    if (leadId && !leadFromAssigned) {
      let active = true;
      setDirectLead(null);
      setFetchingDirect(true);
      setDirectError(null);
      api.get(`/crm/telecaller/${leadId}`, { noCache: true })
        .then(({ data }) => {
          if (!data?.item) throw new Error('Lead is unavailable.');
          if (active) {
            setDirectLead(normalizeLead(data.item));
          }
        })
        .catch((err) => {
          if (active) {
            setDirectError(err.response?.data?.message || 'Lead not found in this company.');
          }
        })
        .finally(() => {
          if (active) setFetchingDirect(false);
        });
      return () => { active = false; };
    } else {
      setDirectLead(null);
      setDirectError(null);
    }
  }, [leadId, leadFromAssigned]);

  const activeLead = leadFromAssigned || (directLead?.id === leadId ? directLead : null);
  const activeCalls = activeLead
    ? (leadFromAssigned
        ? calls.filter((call) => call.leadId === leadId && call.outcome !== 'Note Added')
        : (directLead?.calls || []).filter((call) => call.outcome !== 'Note Added'))
    : [];

  const handleSaveDirect = async (callData) => {
    const savedItem = await saveCall(callData);
    if (savedItem && !leadFromAssigned) {
      setDirectLead(normalizeLead(savedItem));
    }
    return savedItem;
  };

  if (leadId && fetchingDirect) {
    return (
      <div className="cw-container" style={{ alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div className="cw-spinner" />
          <p style={{ color: "var(--cw-text-muted)", fontSize: "13.5px", fontWeight: 500 }}>
            Loading calling workspace for lead #{leadId}...
          </p>
        </div>
      </div>
    );
  }

  return activeLead ? ( 
    <CallWorkspaceContent
      key={activeLead.id}
      lead={activeLead}
      calls={activeCalls}
      can={can}
      editAllowed={editAllowed}
      onSave={handleSaveDirect}
      prevLead={prevLead}
      nextLead={nextLead}
      totalLeads={assigned.length || 1}
      currentIndex={leadIndex >= 0 ? leadIndex + 1 : 1}
    />
  ) : (
    <CallQueueDirectory
      assigned={assigned}
      can={can}
      notFoundId={leadId}
      error={directError}
    />
  );
}

function CallQueueDirectory({ assigned, can, notFoundId, error }) {
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
        (filterStatus === "Pending" && !["Converted", "Closed"].includes(row.status)) ||
        (filterStatus === "Converted" && row.status === "Converted") ||
        (filterStatus === "High" && row.priority === "High");

      return matchesSearch && matchesStatus;
    });
  }, [assigned, searchTerm, filterStatus]);

  return (
    <div className="cw-container">
      {/* Alert if direct leadId was not found */}
      {notFoundId && (
        <div style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}>
          <AlertTriangle size={18} style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "13.5px", color: "#92400e" }}>
              Lead #{notFoundId} not found in calling queue
            </div>
            <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "#b45309", lineHeight: 1.4 }}>
              {error || "This lead may not be assigned to your account or has been closed. You can select another student lead from the queue below to open the calling workspace:"}
            </p>
          </div>
        </div>
      )}

      <div className="cw-card">
        <div className="cw-card-header">
          <h2 className="cw-card-title">
            <PhoneCall size={16} />
            Calling Queue &amp; Workspace
          </h2>
          <span style={{ fontSize: "12px", color: "var(--cw-text-muted)" }}>
            {assigned.length} Leads in Calling Queue
          </span>
        </div>

        <div className="cw-card-body">
          <p style={{ color: "var(--cw-text-muted)", fontSize: "13px", marginTop: 0, marginBottom: 16 }}>
            Select a student lead below to open the live calling console, log conversation outcomes, take notes, and schedule callbacks:
          </p>

          {/* Search & Filter Toolbar */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 400 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--cw-text-subtle)" }} />
              <input
                type="text"
                placeholder="Search by student name, phone, lead ID, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 36px",
                  borderRadius: 8,
                  border: "1px solid var(--cw-border)",
                  fontSize: "12.5px",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#f8fafc",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Queue" },
                { id: "Pending", label: "Ready to Call" },
                { id: "High", label: "🔥 High Priority" },
                { id: "Converted", label: "Converted" },
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
                    borderColor: filterStatus === item.id ? "var(--cw-primary)" : "var(--cw-border)",
                    background: filterStatus === item.id ? "var(--cw-primary-light)" : "white",
                    color: filterStatus === item.id ? "var(--cw-primary)" : "var(--cw-text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Leads */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
            {filteredLeads.map((row) => (
              <div
                key={row.id}
                style={{
                  background: "white",
                  border: "1px solid var(--cw-border)",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                }}
              >
                <div className="cw-avatar" style={{ width: 46, height: 46, fontSize: 16 }}>
                  {row.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <strong style={{ fontSize: "13.5px", color: "var(--cw-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.name}
                    </strong>
                    <span className="cw-id-tag">#{row.id}</span>
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--cw-text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{row.phone}</span>
                    <span>•</span>
                    <span>{row.city || "—"}</span>
                  </div>

                  <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center", justifyContent: "space-between" }}>
                    <span className="cw-badge cw-badge-cyan">{row.type || "—"}</span>
                    <Link
                      to={`${BASE}/call-workspace/${row.id}`}
                      className="cw-btn cw-btn-call"
                      style={{ padding: "5px 12px", fontSize: "11.5px" }}
                    >
                      <PhoneCall size={12} /> Start Call
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CallWorkspaceContent({
  lead,
  calls,
  can,
  editAllowed,
  onSave,
  prevLead,
  nextLead,
  totalLeads,
  currentIndex,
}) {
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [callType, setCallType] = useState("Outbound");
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const callId = useRef(crypto.randomUUID());

  const [isCalling, setIsCalling] = useState(false);
  const [activeCallLogId, setActiveCallLogId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStarting, setCallStarting] = useState(false);
  const [callStatus, setCallStatus] = useState("answered");
  const callTimerRef = useRef(null);

  useEffect(() => {
    if (isCalling) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isCalling]);

  const handleStartCall = async () => {
    if (isCalling || callStarting) return;
    setCallStarting(true);
    setMessage("");
    try {
      const res = await api.post("/calls/start", { leadId: lead.id });
      if (res.data?._id) {
        setActiveCallLogId(res.data._id);
      }
      setCallDuration(0);
      setIsCalling(true);
      showToast(`📞 Call initiated with ${lead.name}`);
    } catch (err) {
      setMessage(err.response?.data?.msg || err.message || "Unable to initiate call log. Please retry.");
    } finally {
      setCallStarting(false);
    }
  };

  const handleEndCall = () => {
    if (!isCalling) return;
    setIsCalling(false);
    showToast(`Call ended (${callDuration}s). Please confirm status and save.`);
    if (!outcome) {
      setOutcome("Connected");
    }
  };

  const needsFollowUp = ["Follow-up", "Need Callback", "Call Later"].includes(outcome);
  const lastCall = calls[0];

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

  const setPresetNote = (phrase) => {
    setNotes((prev) => (prev ? `${prev} | ${phrase}` : phrase));
  };

  const setQuickFollowUp = (type) => {
    const d = new Date();
    if (type === "evening") {
      d.setHours(18, 0, 0, 0);
    } else if (type === "tomorrow") {
      d.setDate(d.getDate() + 1);
      d.setHours(11, 0, 0, 0);
    } else if (type === "2days") {
      d.setDate(d.getDate() + 2);
      d.setHours(14, 0, 0, 0);
    } else if (type === "nextweek") {
      d.setDate(d.getDate() + 7);
      d.setHours(11, 0, 0, 0);
    }
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    const isoString = localDateTime(d);
    setFollowUp(isoString);
  };

  const save = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;
    if (!editAllowed) {
      setMessage("You do not have edit permission to save call details.");
      return;
    }
    if (!outcome) {
      setMessage("Please select a call outcome.");
      return;
    }
    if (needsFollowUp && !followUp) {
      setMessage("Please choose a follow-up date and time for this callback.");
      return;
    }
    if (
      followUp &&
      (!Number.isFinite(new Date(followUp).getTime()) ||
        new Date(followUp) <= new Date())
    ) {
      setMessage(
        "Follow-up time must be in the future.",
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await onSave({
        id: callId.current,
        leadId: lead.id,
        callType,
        outcome,
        notes: notes.trim(),
        followUp: ["Converted", "Call Closed"].includes(outcome) ? "" : followUp,
        duration: callDuration,
        callLogId: activeCallLogId,
      });

      setMessage("✅ Call details recorded and saved successfully!");
      showToast("Call details saved successfully!");
      setOutcome("");
      setNotes("");
      setFollowUp("");
      setActiveCallLogId(null);
      setCallDuration(0);
      callId.current = crypto.randomUUID();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to save call. Please retry.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const cleanPhone = (lead.phone || "").replace(/\D/g, "").replace(/^91/, "");
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${lead.name}, this is from CIIS Network regarding your inquiry for ${lead.type || "course"}.`
  )}`;

  const summaryRows = [
    [Info, "Current Status", <span key="status" className={`cw-badge ${lead.status === "Converted" ? "cw-badge-success" : "cw-badge-primary"}`}>{lead.status}</span>],
    [User, "Assigned To", lead.assignedTo || "—"],
    [
      PhoneCall,
      "Last Outcome",
      lastCall ? (
        <span key="outcome" className="cw-badge cw-badge-warning">
          {lastCall.outcome}
        </span>
      ) : (
        "—"
      ),
    ],
    [
      RefreshCw,
      "Attempts Logged",
      `${calls.length} ${calls.length === 1 ? "Call" : "Calls"}`,
    ],
    [Clock, "Last Contact", dateLabel(lastCall?.date)],
    [CalendarClock, "Next Follow-up", dateLabel(lead.followUp)],
    [UserPlus, "Assigned On", dateLabel(lead.assigned)],
    [
      Lock,
      "Closed On",
      ["Converted", "Call Closed"].includes(lastCall?.outcome)
        ? dateLabel(lastCall.date)
        : "—",
    ],
  ];

  return (
    <form className="cw-container" onSubmit={save}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#0f172a",
          color: "white",
          padding: "10px 18px",
          borderRadius: 8,
          fontSize: "13px",
          fontWeight: 500,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <Check size={16} style={{ color: "#10b981" }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Nav / Queue Controller */}
      <div className="cw-top-nav">
        <div className="cw-breadcrumb">
          <Link to={`${BASE}/dashboard`}>Dashboard</Link>
          <span style={{ color: "var(--cw-text-subtle)" }}>/</span>
          <Link to={`${BASE}/assigned-calls`}>Assigned Calls</Link>
          <span style={{ color: "var(--cw-text-subtle)" }}>/</span>
          <span style={{ fontWeight: 600, color: "var(--cw-text-main)" }}>Calling Console (#{lead.id})</span>
        </div>

        <div className="cw-nav-actions">
          {prevLead && (
            <Link
              to={`${BASE}/call-workspace/${prevLead.id}`}
              className="cw-btn-nav"
              title={`Previous: ${prevLead.name}`}
            >
              <ChevronLeft size={14} /> Prev Lead
            </Link>
          )}
          <span style={{ fontSize: "11.5px", color: "var(--cw-text-muted)", padding: "0 4px" }}>
            {currentIndex} of {totalLeads}
          </span>
          {nextLead && (
            <Link
              to={`${BASE}/call-workspace/${nextLead.id}`}
              className="cw-btn-nav"
              title={`Next: ${nextLead.name}`}
            >
              Next Lead <ChevronRight size={14} />
            </Link>
          )}
          <Link to={`${BASE}/lead-detail/${lead.id}`} className="cw-btn-nav" title="View detailed profile">
            <User size={13} /> View Lead Profile
          </Link>
          <Link to={`${BASE}/call-workspace`} className="cw-btn-nav">
            Queue List
          </Link>
        </div>
      </div>

      {/* Hero Lead Calling Banner */}
      <section className="cw-hero-card">
        <div className="cw-hero-main">
          <div className="cw-profile-info">
            <div className="cw-avatar-wrap">
              <div className="cw-avatar">
                {lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            </div>

            <div className="cw-details-block">
              <div className="cw-title-row">
                <h1 className="cw-name">{lead.name}</h1>
                <span className="cw-id-tag" title={`Lead ID: ${lead.id}`}>#{lead.id}</span>
              </div>

              <div className="cw-tags-row">
                <span className={`cw-badge ${lead.status === "Converted" ? "cw-badge-success" : "cw-badge-primary"}`}>
                  <CheckCircle size={11} /> {lead.status || "Assigned"}
                </span>

                <span className="cw-badge cw-badge-purple">
                  <Tag size={11} /> {lead.source || "Direct"}
                </span>

                <span className="cw-badge cw-badge-cyan">
                  <Sparkles size={11} /> {lead.type || "General Inquiry"}
                </span>

                <span className="cw-badge cw-badge-warning">
                  <Flame size={11} /> {lead.priority || "Normal"} Priority
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cw-hero-actions">
            {isCalling ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#991b1b",
                    padding: "7px 14px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 600,
                    fontSize: "12.5px",
                  }}
                >
                  <PhoneCall size={14} style={{ color: "#dc2626" }} />
                  <span>Call Active: {Math.floor(callDuration / 60).toString().padStart(2, "0")}:{(callDuration % 60).toString().padStart(2, "0")}</span>
                </div>
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="cw-btn"
                  style={{ background: "#dc2626", color: "white", borderColor: "#dc2626", fontWeight: 600 }}
                >
                  <PhoneOff size={14} /> End Call
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartCall}
                  disabled={callStarting}
                  className="cw-btn cw-btn-call"
                  title="Start call and timer"
                >
                  <PhoneCall size={14} /> {callStarting ? "Starting..." : `Start Call`}
                </button>

                <a
                  href={`tel:${lead.phone}`}
                  onClick={() => { if (!isCalling) handleStartCall(); }}
                  className="cw-btn cw-btn-call"
                  style={{ background: "#059669", borderColor: "#059669" }}
                  title="Click to dial phone"
                >
                  <Smartphone size={14} /> Dial {lead.phone}
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cw-btn cw-btn-whatsapp"
                  title="Open WhatsApp chat"
                >
                  <MessageSquare size={14} /> WhatsApp
                </a>
              </>
            )}
          </div>
        </div>

        {/* Contact info strip */}
        <div className="cw-contact-bar">
          <div className="cw-contact-chip">
            <Phone size={13} style={{ color: "var(--cw-primary)" }} />
            <span>+91 {lead.phone}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(lead.phone, "Phone number")}
              style={{ background: "none", border: "none", color: "var(--cw-text-subtle)", cursor: "pointer", padding: 0 }}
              title="Copy"
            >
              <Copy size={11} />
            </button>
          </div>

          <div className="cw-contact-chip">
            <User size={13} style={{ color: "var(--cw-primary)" }} />
            <span>{lead.email}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(lead.email, "Email address")}
              style={{ background: "none", border: "none", color: "var(--cw-text-subtle)", cursor: "pointer", padding: 0 }}
              title="Copy"
            >
              <Copy size={11} />
            </button>
          </div>

          <div className="cw-contact-chip">
            <Clock size={13} style={{ color: "var(--cw-primary)" }} />
            <span>City: <strong>{lead.city || "—"}</strong></span>
          </div>

          <div className="cw-contact-chip">
            <UserPlus size={13} style={{ color: "var(--cw-primary)" }} />
            <span>Agent: <strong>{lead.assignedTo || "—"}</strong></span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Calling Workspace */}
      <fieldset className="cw-grid" disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {/* Left Column: Outcomes & Previous Calls */}
        <div>
          {/* Call Outcome Card */}
          <div className="cw-card">
            <div className="cw-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 className="cw-card-title">
                  <PhoneOutgoing size={16} />
                  Select Call Outcome
                </h2>
                {outcome && (
                  <span className="cw-selected-outcome-tag">
                    Selected: <strong>{outcome}</strong>
                  </span>
                )}
              </div>

              {/* Call Direction Switcher */}
              <div className="cw-call-type-toggle" aria-label="Call direction">
                <button
                  type="button"
                  className={`cw-call-type-btn ${callType === "Outbound" ? "active" : ""}`}
                  onClick={() => setCallType("Outbound")}
                >
                  <PhoneOutgoing size={13} /> Outbound Call
                </button>
                <button
                  type="button"
                  className={`cw-call-type-btn ${callType === "Inbound" ? "active" : ""}`}
                  onClick={() => setCallType("Inbound")}
                >
                  <PhoneIncoming size={13} /> Inbound Call
                </button>
              </div>
            </div>

            <div className="cw-card-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Call Result Status */}
              <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--cw-text-muted)", marginBottom: 8 }}>
                  Call Result Status:
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { id: "answered", label: "Answered", color: "#10b981", bg: "#ecfdf5" },
                    { id: "missed", label: "Missed", color: "#f59e0b", bg: "#fffbeb" },
                    { id: "not reachable", label: "Not Reachable", color: "#3b82f6", bg: "#eff6ff" },
                    { id: "rejected", label: "Rejected", color: "#ef4444", bg: "#fef2f2" }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setCallStatus(s.id);
                        if (s.id === "answered" && !outcome) setOutcome("Connected");
                        if (s.id === "missed") setOutcome("No Answer");
                        if (s.id === "not reachable") setOutcome("Not Reachable");
                        if (s.id === "rejected") setOutcome("Wrong Number");
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1.5px solid",
                        borderColor: callStatus === s.id ? s.color : "#cbd5e1",
                        background: callStatus === s.id ? s.bg : "white",
                        color: callStatus === s.id ? s.color : "#64748b",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {outcomeCategories.map((cat) => (
                <div key={cat.category} className="cw-outcome-category-block">
                  <div className="cw-category-header">
                    <span className="cw-category-title">{cat.category}</span>
                    <span className={`cw-category-pill ${cat.badgeClass}`}>{cat.badge}</span>
                  </div>

                  <div className="cw-category-items-grid">
                    {cat.items.map((value) => {
                      const Icon = outcomeIconsMap[value] || Phone;
                      const isSelected = outcome === value;

                      return (
                        <button
                          disabled={!editAllowed}
                          type="button"
                          aria-pressed={isSelected}
                          className={`cw-outcome-chip ${cat.badgeClass} ${isSelected ? "selected" : ""}`}
                          key={value}
                          onClick={() => {
                            setOutcome(value);
                            if (['Converted', 'Call Closed'].includes(value)) setFollowUp('');
                            setMessage("");
                          }}
                        >
                          <span className="cw-chip-icon-wrap">
                            <Icon size={15} />
                          </span>
                          <span className="cw-chip-label">{value}</span>
                          {isSelected && (
                            <span className="cw-chip-check">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Calls Table Card */}
          <div className="cw-card">
            <div className="cw-card-header">
              <h2 className="cw-card-title">
                <PhoneCall size={16} />
                Previous Call Records ({calls.length})
              </h2>
            </div>
            <div className="cw-card-body" style={{ padding: 0 }}>
              <div className="cw-table-wrap">
                <table className="cw-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>Call Direction</th>
                      <th>Outcome</th>
                      <th>Follow-up</th>
                      <th>Notes / Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => (
                      <tr key={call.id}>
                        <td style={{ fontWeight: 600 }}>{dateLabel(call.date)}</td>
                        <td>
                          <span className="cw-badge cw-badge-primary">
                            {call.callType || "Outbound"}
                          </span>
                        </td>
                        <td>
                          <span className="cw-badge cw-badge-success">
                            {call.outcome}
                          </span>
                        </td>
                        <td>
                          {call.followUp ? (
                            <span style={{ color: "var(--cw-primary)", fontWeight: 500 }}>
                              {dateLabel(call.followUp)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--cw-text-subtle)" }}>—</span>
                          )}
                        </td>
                        <td style={{ maxWidth: 220, color: "var(--cw-text-muted)" }}>
                          {call.notes || "—"}
                        </td>
                      </tr>
                    ))}
                    {!calls.length && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--cw-text-muted)" }}>
                          No call attempts recorded for this lead yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Lead Summary, Notes, Follow-up, Save */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Lead Summary */}
          <div className="cw-card" style={{ marginBottom: 0 }}>
            <div className="cw-card-header">
              <h3 className="cw-card-title">
                <FileText size={15} /> Lead Summary
              </h3>
              <span className="cw-id-tag">#{lead.id}</span>
            </div>
            <div className="cw-card-body">
              <dl className="cw-summary-list">
                {summaryRows.map(([Icon, label, value]) => (
                  <div className="cw-summary-row" key={label}>
                    <dt className="cw-summary-key">
                      <Icon size={13} />
                      {label}
                    </dt>
                    <dd className="cw-summary-val">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Call Notes Card */}
          <div className="cw-card" style={{ marginBottom: 0 }}>
            <div className="cw-card-header">
              <h3 className="cw-card-title">
                <FileText size={15} /> Call Remarks / Notes
              </h3>
            </div>
            <div className="cw-card-body">
              <textarea
                disabled={!editAllowed}
                aria-label="Call notes"
                className="cw-textarea"
                placeholder="Type conversation details, student response, queries raised..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />

              {/* Quick Preset Phrases */}
              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: "11px", color: "var(--cw-text-subtle)", fontWeight: 500 }}>
                  Quick presets:
                </span>
                <div className="cw-presets">
                  {[
                    "Interested in Admission",
                    "Asked for Callback",
                    "Fee structure shared",
                    "Discuss with Parents",
                    "Call after 6 PM",
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      className="cw-preset-btn"
                      onClick={() => setPresetNote(phrase)}
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Next Follow-up Card */}
          <div
            className="cw-card"
            style={{
              marginBottom: 0,
              borderColor: needsFollowUp ? "var(--cw-warning)" : "var(--cw-border)",
            }}
          >
            <div className="cw-card-header">
              <h3 className="cw-card-title">
                <CalendarClock size={15} /> Next Follow-up
              </h3>
              <span className={`cw-badge ${needsFollowUp ? "cw-badge-warning" : "cw-badge-primary"}`}>
                {needsFollowUp ? "Required ⚠️" : "Optional"}
              </span>
            </div>
            <div className="cw-card-body">
              <div className="cw-followup-box">
                <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--cw-text-muted)" }}>
                  Follow-up Date &amp; Time
                </label>
                <input
                  disabled={!editAllowed}
                  type="datetime-local"
                  min={localDateTime()}
                  className="cw-followup-input"
                  value={followUp}
                  onChange={(event) => setFollowUp(event.target.value)}
                />

                {/* Quick Date Selectors */}
                <div className="cw-quick-dates">
                  <button type="button" className="cw-date-chip" onClick={() => setQuickFollowUp("evening")}>
                    Today 6 PM
                  </button>
                  <button type="button" className="cw-date-chip" onClick={() => setQuickFollowUp("tomorrow")}>
                    Tomorrow 11 AM
                  </button>
                  <button type="button" className="cw-date-chip" onClick={() => setQuickFollowUp("2days")}>
                    In 2 Days
                  </button>
                  <button type="button" className="cw-date-chip" onClick={() => setQuickFollowUp("nextweek")}>
                    Next Week
                  </button>
                </div>

                <p style={{ fontSize: "11px", color: needsFollowUp ? "var(--cw-warning)" : "var(--cw-text-subtle)", margin: "4px 0 0" }}>
                  {needsFollowUp
                    ? "⚠️ Callback date & time is required for this outcome."
                    : "Select a follow-up callback date if needed."}
                </p>
              </div>
            </div>
          </div>

          {/* Save Action Card */}
          <div className="cw-save-card">
            <button
              className="cw-btn-save"
              type="submit"
              disabled={!editAllowed || saving}
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Call Details'}
            </button>

            {!editAllowed && (
              <p className="cw-alert cw-alert-error">
                <AlertCircle size={14} /> {isTerminal(lead) ? 'This lead is converted or closed.' : 'Edit access is required to save calls.'}
              </p>
            )}

            {message && (
              <p className={`cw-alert ${message.startsWith("✅") ? "cw-alert-success" : "cw-alert-error"}`}>
                {message}
              </p>
            )}
          </div>
        </aside>
      </fieldset>
    </form>
  );
}
