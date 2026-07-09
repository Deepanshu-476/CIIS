import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Info,
  Menu,
  MessageCircle,
  Send,
  TicketCheck,
  UserRound,
} from "lucide-react";
import axiosInstance from "../../utils/axiosConfig";
import "./SupportCenter.css";

const fallbackMessages = [
  { from: "bot", text: "Hi! How can we help?" },
];

const activeStatuses = new Set(["Open", "In Progress", "Waiting", "Escalated"]);
const closedStatuses = new Set(["Resolved", "Closed"]);

const statusClass = value => String(value || "Open").toLowerCase().replace(/\s+/g, "-");

const formatRelative = value => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const formatMessageTime = value => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const mapTicket = ticket => ({
  id: ticket.id || ticket._id,
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject || "Support query",
  status: ticket.status || "Open",
  department: ticket.department || "General",
  assignedToName: ticket.assignedToName || "Department Head",
  updated: ticket.updated || ticket.updatedAt || ticket.createdAt,
  messages: Array.isArray(ticket.messages) ? ticket.messages : [],
});

const getEntityId = value => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || value.userId || "");
  }
  return String(value);
};

const SupportChatWidget = () => {
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
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = getEntityId(currentUser);
  const currentUserName = String(currentUser.name || currentUser.fullName || "").trim().toLowerCase();

  const selectedTicket = tickets.find(ticket => ticket.id === selectedTicketId) || null;
  const activeTicket = tickets.find(ticket => activeStatuses.has(ticket.status)) || null;
  const selectedTicketClosed = Boolean(selectedTicket && closedStatuses.has(selectedTicket.status));
  const openTicketCount = tickets.filter(ticket => activeStatuses.has(ticket.status)).length;

  const fetchTickets = async () => {
    try {
      const response = await axiosInstance.get("/support/tickets/my", { _skipErrorNotify: true });
      if (response.data?.success) {
        setTickets((response.data.tickets || []).map(mapTicket));
      }
    } catch (error) {
      console.warn("Support widget ticket sync failed:", error.message);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get("/support/departments", { _skipErrorNotify: true });
      if (response.data?.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      console.warn("Support departments fetch failed:", error.message);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
    const interval = window.setInterval(fetchTickets, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const activeThread = useMemo(() => {
    if (!selectedTicket?.messages?.length) return [];
    return selectedTicket.messages.map(message => {
      const senderRole = String(message.senderRole || "").toLowerCase();
      const senderId = getEntityId(message.sender);
      const senderName = String(message.senderName || "").trim().toLowerCase();
      const isCurrentUser = senderRole === "agent" || senderRole === "system"
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
      setMessages(prev => [...prev, { from: "user", text: question }]);
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

      setMessages(prev => [...prev, { from: "bot", text: answer }]);
      if (response.data?.ticket) {
        const ticket = mapTicket(response.data.ticket);
        setTickets(prev => [ticket, ...prev.filter(item => item.id !== ticket.id)]);
        setSelectedTicketId(ticket.id);
        setView("thread");
      }
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Support assistant is not reachable right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = async department => {
    if (!department?.id) return;
    setSelectedDepartment(department);
    setMessages(prev => [...prev, { from: "user", text: `Department: ${department.name}` }]);
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
        const response = await axiosInstance.post(`/support/tickets/${selectedTicket.id}/messages`, { message });
        if (response.data?.success) {
          const ticket = mapTicket(response.data.ticket);
          setTickets(prev => prev.map(item => item.id === ticket.id ? ticket : item));
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

  const inputPlaceholder = view === "thread"
    ? "Reply to Department Head..."
    : activeTicket
      ? `Active ticket ${activeTicket.ticketNumber || ""} is open`
      : "Type here and press enter..";

  if (!widgetOpen) {
    return (
      <button className="portal-chat-launcher" onClick={() => setWidgetOpen(true)} aria-label="Open customer support chat">
        <MessageCircle size={25} />
      </button>
    );
  }

  return (
    <aside className="portal-chat-widget" aria-label="Customer support chat widget">
      <div className="portal-chat-header">
        <button
          className="portal-chat-icon-btn"
          aria-label="Back"
          onClick={() => {
            setMenuOpen(false);
            if (view === "thread") setView("tickets");
            else if (view === "tickets") setView("chat");
            else setWidgetOpen(false);
          }}
        >
          <ChevronLeft size={26} />
        </button>
        <strong>{view === "tickets" ? "My Tickets" : view === "thread" ? selectedTicket?.ticketNumber || "Ticket" : "Customer Support"}</strong>
        <div className="portal-chat-header-actions">
          <button
            className="portal-chat-icon-btn portal-chat-minimize"
            onClick={() => {
              setMenuOpen(false);
              setWidgetOpen(false);
            }}
            aria-label="Minimize chat"
          >
            <ChevronDown size={24} />
          </button>
          <div className="portal-chat-menu-wrap">
            <button
              className="portal-chat-icon-btn"
              aria-label="Open support menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(open => !open)}
            >
              <Menu size={24} />
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

      <div className="portal-chat-body">
        {view === "tickets" ? (
          <div className="portal-ticket-list">
            <div className="portal-ticket-summary">
              <div>
                <span>Support inbox</span>
                <strong>{tickets.length} ticket{tickets.length === 1 ? "" : "s"}</strong>
              </div>
              <em>{openTicketCount} open</em>
            </div>
            <button className="portal-new-support-chat" onClick={() => setView("chat")}>
              <MessageCircle size={17} /> New support chat
            </button>
            {tickets.length ? tickets.map(ticket => (
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
                  <small>{ticket.ticketNumber} · {ticket.department}</small>
                </span>
                <span className={`support-badge ${statusClass(ticket.status)}`}>{ticket.status}</span>
              </button>
            )) : <div className="portal-ticket-empty">There are no support tickets yet.</div>}
          </div>
        ) : view === "thread" && selectedTicket ? (
          <>
            <div className="portal-ticket-thread-head">
              <div className="portal-ticket-thread-status">
                <span className={`support-badge ${statusClass(selectedTicket.status)}`}>{selectedTicket.status}</span>
                <span className="portal-ticket-info"><Info size={15} /></span>
              </div>
              <strong>{selectedTicket.subject}</strong>
              <small><UserRound size={14} /> {selectedTicket.department} · {selectedTicket.assignedToName}</small>
            </div>
            <div className="portal-chat-mini-thread portal-full-thread">
              {activeThread.length ? activeThread.map((message, index) => (
                <div className={`portal-ticket-message ${message.from}`} key={`${message.from}-${index}`}>
                  <div className={`portal-chat-mini-bubble ${message.from}`}>{message.text}</div>
                  <div className="portal-ticket-message-meta">
                    {formatMessageTime(message.createdAt)}
                    {message.from === "user" && <CheckCheck size={14} />}
                  </div>
                </div>
              )) : <div className="portal-ticket-empty">No conversation yet.</div>}
            </div>
          </>
        ) : (
          <>
            <div className="portal-chat-spacer" />
            <div className="portal-chat-agent-label">Customer Support</div>
            <div className="portal-chat-row">
              <div className="portal-chat-avatar"><UserRound size={28} /></div>
              <div className="portal-chat-greeting">Hi! How can we help?</div>
            </div>
            {activeTicket && (
              <button
                className="portal-chat-status-card"
                onClick={() => {
                  setSelectedTicketId(activeTicket.id);
                  setView("thread");
                }}
              >
                <div>
                  <span className={`support-badge ${statusClass(activeTicket.status)}`}>{activeTicket.status}</span>
                  <strong>{activeTicket.subject}</strong>
                  <small>{activeTicket.ticketNumber} - {activeTicket.department}</small>
                </div>
                <p><Clock3 size={15} /> Last update {formatRelative(activeTicket.updated)}</p>
              </button>
            )}
            {!activeTicket && (
              <div className="portal-chat-query-card">
                {selectedDepartment
                  ? `${selectedDepartment.name} selected. Please type your query.`
                  : "Please select a department first"}
              </div>
            )}
            <div className="portal-chat-mini-thread">
              {messages.slice(-3).map((message, index) => (
                <div className={`portal-chat-mini-bubble ${message.from}`} key={`${message.from}-${index}`}>{message.text}</div>
              ))}
              {!activeTicket && departments.length > 0 && !selectedDepartment && (
                <div className="portal-chat-departments">
                  {departments.map(department => (
                    <button key={department.id} onClick={() => handleDepartmentSelect(department)}>{department.name}</button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {view !== "tickets" && !(view === "thread" && selectedTicketClosed) && <div className="portal-chat-inputbar">
        <input
          value={widgetInput}
          onChange={event => setWidgetInput(event.target.value)}
          onKeyDown={event => event.key === "Enter" && handleSubmit()}
          placeholder={inputPlaceholder}
          disabled={loading || (view === "chat" && (Boolean(activeTicket) || !selectedDepartment))}
        />
        <button
          aria-label="Send support query"
          onClick={handleSubmit}
          disabled={loading || (view === "chat" && (Boolean(activeTicket) || !selectedDepartment))}
        >
          <Send size={21} />
        </button>
      </div>}

      {view !== "tickets" && <button className="portal-chat-powered">Powered by CIIS</button>}
    </aside>
  );
};

export default SupportChatWidget;
