import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Menu,
  MessageCircle,
  Send,
  TicketCheck,
  UserRound,
  Headphones,
  ShieldCheck,
  Briefcase,
  Users,
  Laptop,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import axiosInstance from "../../utils/axiosConfig";
import "./SupportCenter.css";

const fallbackMessages = [
  { from: "bot", text: "Hi! How can we help?" },
];

const activeStatuses = new Set(["Open", "In Progress", "Waiting", "Escalated"]);
const closedStatuses = new Set(["Resolved", "Closed"]);

const statusClass = (value) =>
  String(value || "Open").toLowerCase().replace(/\s+/g, "-");

const formatRelative = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const formatMessageTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const mapTicket = (ticket) => ({
  id: ticket.id || ticket._id,
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject || "Support query",
  status: ticket.status || "Open",
  department: ticket.department || "General",
  assignedToName: ticket.assignedToName || "Department Head",
  updated: ticket.updated || ticket.updatedAt || ticket.createdAt,
  messages: Array.isArray(ticket.messages) ? ticket.messages : [],
});

const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || value.userId || "");
  }
  return String(value);
};

export const formatDepartmentName = (name) => {
  if (!name) return "General Support";
  const cleaned = String(name).trim();
  return cleaned
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (["HR", "IT", "CEO", "CTO", "QA", "AI", "CRM", "API", "UI", "UX"].includes(upper)) {
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

export const getDepartmentMeta = (name) => {
  const norm = String(name || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (norm.includes("sales") || norm.includes("itsales")) {
    return {
      icon: TrendingUp,
      color: "#0284c7",
      bg: "#e0f2fe",
      border: "#bae6fd",
      badge: "Sales & Growth",
      desc: "Commercial inquiries & sales",
    };
  }
  if (norm.includes("tech") || norm.includes("itteam") || norm.includes("it")) {
    return {
      icon: Laptop,
      color: "#4f46e5",
      bg: "#eef2ff",
      border: "#c7d2fe",
      badge: "Tech Support",
      desc: "Systems & technical support",
    };
  }
  if (norm.includes("hr") || norm.includes("people") || norm.includes("talent")) {
    return {
      icon: Users,
      color: "#9333ea",
      bg: "#faf5ff",
      border: "#e9d5ff",
      badge: "People & HR",
      desc: "Staff, leaves & operations",
    };
  }
  if (norm.includes("admin")) {
    return {
      icon: ShieldCheck,
      color: "#0f766e",
      bg: "#f0fdfa",
      border: "#99f6e4",
      badge: "Admin & Ops",
      desc: "Administration & general",
    };
  }
  if (norm.includes("client")) {
    return {
      icon: Briefcase,
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
      badge: "Client Relations",
      desc: "Accounts & client services",
    };
  }
  if (norm.includes("report") || norm.includes("analytics") || norm.includes("data")) {
    return {
      icon: BarChart3,
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
      badge: "Reports & Data",
      desc: "Analytics & data reporting",
    };
  }
  return {
    icon: Layers,
    color: "#475569",
    bg: "#f8fafc",
    border: "#e2e8f0",
    badge: "Specialized",
    desc: "Assistance & inquiries",
  };
};

const SupportChatWidget = () => {
  const widgetRef = useRef(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetInput, setWidgetInput] = useState("");
  const [messages, setMessages] = useState(fallbackMessages);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [view, setView] = useState("chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasFetchedForOpenRef = useRef(false);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = getEntityId(currentUser);
  const currentUserName = String(currentUser.name || currentUser.fullName || "").trim().toLowerCase();

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || null;
  const activeTicket = tickets.find((ticket) => activeStatuses.has(ticket.status)) || null;
  const selectedTicketClosed = Boolean(selectedTicket && closedStatuses.has(selectedTicket.status));
  const openTicketCount = tickets.filter((ticket) => activeStatuses.has(ticket.status)).length;

  useEffect(() => {
    if (!widgetOpen) {
      hasFetchedForOpenRef.current = false;
      return undefined;
    }

    if (hasFetchedForOpenRef.current) return undefined;
    hasFetchedForOpenRef.current = true;

    const fetchWidgetData = async () => {
      try {
        const [ticketsResponse, departmentsResponse] = await Promise.all([
          axiosInstance.get("/support/tickets/my", { _skipErrorNotify: true }),
          axiosInstance.get("/support/departments", { _skipErrorNotify: true }),
        ]);

        if (ticketsResponse.data?.success) {
          setTickets((ticketsResponse.data.tickets || []).map(mapTicket));
        }

        if (departmentsResponse.data?.success) {
          setDepartments(departmentsResponse.data.departments || []);
        }
      } catch (error) {
        console.warn("Support widget data sync failed:", error.message);
      }
    };

    fetchWidgetData();
    return undefined;
  }, [widgetOpen]);

  useEffect(() => {
    if (!widgetOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (widgetRef.current?.contains(event.target)) return;
      setMenuOpen(false);
      setWidgetOpen(false);
    };

    const handleCloseFromMessenger = () => {
      setMenuOpen(false);
      setWidgetOpen(false);
    };

    window.addEventListener("close-support-widget", handleCloseFromMessenger);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      window.removeEventListener("close-support-widget", handleCloseFromMessenger);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [widgetOpen]);

  const activeThread = useMemo(() => {
    if (!selectedTicket?.messages?.length) return [];
    return selectedTicket.messages.map((message) => {
      const senderRole = String(message.senderRole || "").toLowerCase();
      const senderId = getEntityId(message.sender);
      const senderName = String(message.senderName || "").trim().toLowerCase();
      const isCurrentUser =
        senderRole === "agent" || senderRole === "system"
          ? false
          : senderId && currentUserId
            ? senderId === currentUserId
            : senderName && currentUserName
              ? senderName === currentUserName
              : senderRole === "employee";

      return {
        from: isCurrentUser ? "user" : "bot",
        text: message.message,
        senderName: message.senderName,
        createdAt: message.createdAt,
      };
    });
  }, [selectedTicket, currentUserId, currentUserName]);

  const submitQuestion = async (question, departmentId = null) => {
    if (!question || activeTicket || loading) return;
    setLoading(true);

    const continuingPendingQuestion = Boolean(departmentId && pendingQuestion === question);
    if (!continuingPendingQuestion) {
      setMessages((prev) => [...prev, { from: "user", text: question }]);
      setWidgetInput("");
    }

    try {
      const response = await axiosInstance.post("/support/chatbot/ask", { question, departmentId });
      const answer = response.data?.answer || "Please try again.";

      if (response.data?.needsDepartment) {
        setPendingQuestion(question);
        setDepartments(response.data.departments || []);
      } else {
        setPendingQuestion("");
        setDepartments([]);
      }

      setMessages((prev) => [...prev, { from: "bot", text: answer }]);
      if (response.data?.ticket) {
        const ticket = mapTicket(response.data.ticket);
        setTickets((prev) => [ticket, ...prev.filter((item) => item.id !== ticket.id)]);
        setSelectedTicketId(ticket.id);
        setView("thread");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Support assistant is not reachable right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = async (department) => {
    if (!department?.id) return;
    setSelectedDepartment(department);
    const formatted = formatDepartmentName(department.name);
    setMessages((prev) => [
      ...prev,
      { from: "user", text: `Selected Department: ${formatted}` },
      { from: "bot", text: `You're now connected with ${formatted}. How can we help you today?` },
    ]);
    if (pendingQuestion) {
      await submitQuestion(pendingQuestion, department.id);
    }
  };

  const handleSubmit = async () => {
    if (view === "thread" && selectedTicket) {
      if (selectedTicketClosed) return;
      const message = widgetInput.trim();
      if (!message || loading) return;
      setLoading(true);
      try {
        const response = await axiosInstance.post(`/support/tickets/${selectedTicket.id}/messages`, {
          message,
        });
        if (response.data?.success) {
          const ticket = mapTicket(response.data.ticket);
          setTickets((prev) => prev.map((item) => (item.id === ticket.id ? ticket : item)));
          setWidgetInput("");
        }
      } catch (replyError) {
        console.error("Support ticket reply failed:", replyError);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!selectedDepartment) return;
    await submitQuestion(widgetInput.trim(), selectedDepartment?.id || null);
  };

  const inputPlaceholder =
    view === "thread"
      ? "Reply to Department Head..."
      : activeTicket
        ? `Active ticket ${activeTicket.ticketNumber || ""} is open`
        : selectedDepartment
          ? `Ask a question for ${formatDepartmentName(selectedDepartment.name)}...`
          : "Select a department above to start typing...";

  if (!widgetOpen) {
    return (
      <button
        className="portal-chat-launcher"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("close-messenger-widget"));
          setWidgetOpen(true);
        }}
        aria-label="Open customer support"
        title="Customer Support"
      >
        <span className="portal-chat-launcher-icon">
          <Headphones size={24} />
        </span>
        <span className="portal-chat-launcher-ping" />
      </button>
    );
  }

  return (
    <aside ref={widgetRef} className="portal-chat-widget" aria-label="Customer support chat widget">
      {/* Header */}
      <div className="portal-chat-header">
        <div className="portal-chat-header-left">
          {view !== "chat" ? (
            <button
              className="portal-chat-icon-btn"
              aria-label="Back"
              onClick={() => {
                setMenuOpen(false);
                if (view === "thread") setView("tickets");
                else if (view === "tickets") setView("chat");
                else setWidgetOpen(false);
              }}
              title="Go back"
            >
              <ChevronLeft size={22} />
            </button>
          ) : (
            <div className="portal-chat-header-avatar">
              <Headphones size={18} />
              <span className="portal-chat-status-ring" />
            </div>
          )}
          <div className="portal-chat-header-text">
            <strong>
              {view === "tickets"
                ? "My Tickets"
                : view === "thread"
                  ? selectedTicket?.ticketNumber || "Ticket Details"
                  : "Customer Support"}
            </strong>
            <small className="portal-chat-header-sub">
              <span className="portal-chat-status-pulse" />
              Online · Instant assistance
            </small>
          </div>
        </div>

        <div className="portal-chat-header-actions">
          <button
            className="portal-chat-icon-btn portal-chat-minimize"
            onClick={() => {
              setMenuOpen(false);
              setWidgetOpen(false);
            }}
            aria-label="Minimize chat"
            title="Minimize"
          >
            <ChevronDown size={20} />
          </button>
          <div className="portal-chat-menu-wrap">
            <button
              className="portal-chat-icon-btn"
              aria-label="Open support menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              title="Menu"
            >
              <Menu size={20} />
            </button>
            {menuOpen && (
              <div className="portal-chat-menu">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setView("tickets");
                  }}
                >
                  <TicketCheck size={15} />
                  <span>My Tickets</span>
                  <em>{openTicketCount}</em>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setSelectedDepartment(null);
                    setView("chat");
                  }}
                >
                  <MessageCircle size={15} />
                  <span>New Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="portal-chat-body">
        {view === "tickets" ? (
          <div className="portal-ticket-list">
            <div className="portal-ticket-summary">
              <div>
                <span>Support inbox</span>
                <strong>
                  {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
                </strong>
              </div>
              <em>{openTicketCount} open</em>
            </div>
            <button className="portal-new-support-chat" onClick={() => setView("chat")}>
              <MessageCircle size={17} /> New support chat
            </button>
            {tickets.length ? (
              tickets.map((ticket) => (
                <button
                  className="portal-ticket-item"
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setView("thread");
                  }}
                >
                  <span>
                    <strong>{ticket.subject}</strong>
                    <small>
                      {ticket.ticketNumber} · {formatDepartmentName(ticket.department)}
                    </small>
                  </span>
                  <span className={`support-badge ${statusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </button>
              ))
            ) : (
              <div className="portal-ticket-empty">There are no support tickets yet.</div>
            )}
          </div>
        ) : view === "thread" && selectedTicket ? (
          <>
            <div className="portal-ticket-thread-head">
              <div className="portal-ticket-thread-status">
                <span className={`support-badge ${statusClass(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
                <span className="portal-ticket-info">
                  <Info size={15} />
                </span>
              </div>
              <strong>{selectedTicket.subject}</strong>
              <small>
                <UserRound size={14} /> {formatDepartmentName(selectedTicket.department)} ·{" "}
                {selectedTicket.assignedToName}
              </small>
            </div>
            <div className="portal-chat-mini-thread portal-full-thread">
              {activeThread.length ? (
                activeThread.map((message, index) => (
                  <div
                    className={`portal-ticket-message ${message.from}`}
                    key={`${message.from}-${index}`}
                  >
                    <div className={`portal-chat-mini-bubble ${message.from}`}>
                      {message.text}
                    </div>
                    <div className="portal-ticket-message-meta">
                      {formatMessageTime(message.createdAt)}
                      {message.from === "user" && <CheckCheck size={14} />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="portal-ticket-empty">No conversation yet.</div>
              )}
            </div>
          </>
        ) : (
          <div className="portal-chat-body-content">
            {/* Welcome greeting banner */}
            <div className="portal-chat-welcome-card">
              <div className="portal-chat-welcome-badge">
                <Sparkles size={13} />
                <span>CIIS Helpdesk</span>
              </div>
              <h4>Hi there! 👋 How can we help?</h4>
              <p>
                {!selectedDepartment && !activeTicket
                  ? "Select a department below so we can connect you directly with the right specialized team."
                  : "We're here to assist you. What can we help you solve today?"}
              </p>
            </div>

            {/* Active Ticket Banner */}
            {activeTicket && (
              <button
                className="portal-chat-status-card"
                onClick={() => {
                  setSelectedTicketId(activeTicket.id);
                  setView("thread");
                }}
              >
                <div>
                  <span className={`support-badge ${statusClass(activeTicket.status)}`}>
                    {activeTicket.status}
                  </span>
                  <strong>{activeTicket.subject}</strong>
                  <small>
                    {activeTicket.ticketNumber} · {formatDepartmentName(activeTicket.department)}
                  </small>
                </div>
                <p>
                  <Clock3 size={14} /> Last update {formatRelative(activeTicket.updated)}
                </p>
              </button>
            )}

            {/* Connected Department Pill Bar */}
            {!activeTicket && selectedDepartment && (
              <div className="portal-chat-selected-dept-bar">
                <div className="portal-chat-selected-dept-info">
                  {(() => {
                    const meta = getDepartmentMeta(selectedDepartment.name);
                    const DeptIcon = meta.icon;
                    return (
                      <span
                        className="portal-chat-selected-icon-badge"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        <DeptIcon size={14} />
                      </span>
                    );
                  })()}
                  <div className="portal-chat-selected-dept-labels">
                    <span className="portal-chat-selected-kicker">Connected Department</span>
                    <strong>{formatDepartmentName(selectedDepartment.name)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="portal-chat-dept-change-btn"
                  onClick={() => setSelectedDepartment(null)}
                  title="Switch to another department"
                >
                  <RotateCcw size={12} />
                  <span>Change</span>
                </button>
              </div>
            )}

            {/* Message Thread */}
            <div className="portal-chat-flow-thread">
              {messages.map((message, index) => (
                <div
                  className={`portal-chat-msg-row ${message.from}`}
                  key={`${message.from}-${index}`}
                >
                  {message.from === "bot" && (
                    <div className="portal-chat-msg-avatar">
                      <Headphones size={13} />
                    </div>
                  )}
                  <div className={`portal-chat-bubble ${message.from}`}>
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Departments Grid - Only shown when no active ticket & no department selected yet */}
            {!activeTicket && departments.length > 0 && !selectedDepartment && (
              <div className="portal-chat-dept-container">
                <div className="portal-chat-dept-container-head">
                  <span className="portal-chat-dept-label">Select a Department</span>
                  <span className="portal-chat-dept-counter">{departments.length} teams</span>
                </div>
                <div className="portal-chat-dept-grid">
                  {departments.map((department) => {
                    const meta = getDepartmentMeta(department.name);
                    const DeptIcon = meta.icon;
                    return (
                      <button
                        key={department.id}
                        type="button"
                        className="portal-chat-dept-tile"
                        onClick={() => handleDepartmentSelect(department)}
                      >
                        <div
                          className="portal-chat-dept-tile-icon"
                          style={{
                            backgroundColor: meta.bg,
                            color: meta.color,
                            borderColor: meta.border,
                          }}
                        >
                          <DeptIcon size={16} />
                        </div>
                        <div className="portal-chat-dept-tile-text">
                          <strong className="portal-chat-dept-tile-title">
                            {formatDepartmentName(department.name)}
                          </strong>
                          <span className="portal-chat-dept-tile-badge">{meta.badge}</span>
                        </div>
                        <ChevronRight size={13} className="portal-chat-dept-tile-arrow" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Input & Brand Area */}
      {view !== "tickets" && !(view === "thread" && selectedTicketClosed) && (
        <div className="portal-chat-bottom-dock">
          <div className="portal-chat-inputbar">
            <input
              value={widgetInput}
              onChange={(event) => setWidgetInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
              placeholder={inputPlaceholder}
              disabled={
                loading ||
                (view === "chat" && (Boolean(activeTicket) || !selectedDepartment))
              }
            />
            <button
              aria-label="Send support query"
              onClick={handleSubmit}
              disabled={
                loading ||
                (view === "chat" && (Boolean(activeTicket) || !selectedDepartment))
              }
              className={
                widgetInput.trim() && (selectedDepartment || view === "thread")
                  ? "active"
                  : ""
              }
            >
              <Send size={15} />
            </button>
          </div>
          <div className="portal-chat-footer-brand">
            <span className="portal-chat-brand-dot" />
            <span>Powered by <strong>CIIS Support</strong></span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default SupportChatWidget;
