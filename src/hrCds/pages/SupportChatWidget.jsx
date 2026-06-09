import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  Clock3,
  Menu,
  MessageCircle,
  Paperclip,
  Send,
  Smile,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import axiosInstance from "../../utils/axiosConfig";
import "./SupportCenter.css";

const fallbackMessages = [
  { from: "bot", text: "Hi! How can we help?" },
];

const activeStatuses = new Set(["Open", "In Progress", "Waiting", "Escalated"]);

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

const SupportChatWidget = () => {
  const [widgetOpen, setWidgetOpen] = useState(true);
  const [widgetInput, setWidgetInput] = useState("");
  const [messages, setMessages] = useState(fallbackMessages);
  const [departments, setDepartments] = useState([]);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [activeTicket, setActiveTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchActiveTicket = async () => {
    try {
      const response = await axiosInstance.get("/support/tickets/my", { _skipErrorNotify: true });
      if (response.data?.success) {
        const tickets = (response.data.tickets || []).map(mapTicket);
        const current = tickets.find(ticket => activeStatuses.has(ticket.status));

        if (current) {
          setActiveTicket(current);
          setDepartments([]);
          setPendingQuestion("");
          return;
        }

        setActiveTicket(previousTicket => {
          if (previousTicket) {
            setMessages(fallbackMessages);
            setDepartments([]);
            setPendingQuestion("");
          }
          return null;
        });
      }
    } catch (error) {
      console.warn("Support widget ticket sync failed:", error.message);
    }
  };

  useEffect(() => {
    fetchActiveTicket();
    const interval = window.setInterval(fetchActiveTicket, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const activeThread = useMemo(() => {
    if (!activeTicket?.messages?.length) return [];
    return activeTicket.messages.slice(-3).map(message => ({
      from: message.senderRole === "employee" ? "user" : "bot",
      text: message.message,
      senderName: message.senderName,
    }));
  }, [activeTicket]);

  const submitQuestion = async (question, departmentId = null) => {
    if (!question || activeTicket || loading) return;
    setLoading(true);

    if (!departmentId) {
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
        setActiveTicket(mapTicket(response.data.ticket));
      }
    } catch (error) {
      setMessages(prev => [...prev, { from: "bot", text: "Support assistant is not reachable right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = async department => {
    if (!pendingQuestion || !department?.id) return;
    setMessages(prev => [...prev, { from: "user", text: `Department: ${department.name}` }]);
    await submitQuestion(pendingQuestion, department.id);
  };

  const handleSubmit = async () => {
    await submitQuestion(widgetInput.trim());
  };

  const inputPlaceholder = activeTicket
    ? `Ticket ${activeTicket.status}. Resolve hone ke baad new chat start hogi.`
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
        <button className="portal-chat-icon-btn" aria-label="Back">
          <ChevronLeft size={26} />
        </button>
        <strong>Customer Support</strong>
        <button className="portal-chat-icon-btn" aria-label="Menu">
          <Menu size={24} />
        </button>
      </div>

      <div className="portal-chat-body">
        <div className="portal-chat-spacer" />
        <div className="portal-chat-agent-label">Customer Support</div>
        <div className="portal-chat-row">
          <div className="portal-chat-avatar">
            <UserRound size={28} />
          </div>
          <div className="portal-chat-greeting">Hi! How can we help?</div>
        </div>

        {activeTicket ? (
          <div className="portal-chat-status-card">
            <div>
              <span className={`support-badge ${statusClass(activeTicket.status)}`}>{activeTicket.status}</span>
              <strong>{activeTicket.subject}</strong>
              <small>{activeTicket.ticketNumber} - {activeTicket.department}</small>
            </div>
            <p><Clock3 size={15} /> Last update {formatRelative(activeTicket.updated)}</p>
          </div>
        ) : (
          <div className="portal-chat-query-card">
            Type your query, then select a department for handoff
          </div>
        )}

        <div className="portal-chat-mini-thread">
          {(activeTicket ? activeThread : messages.slice(-3)).map((message, index) => (
            <div className={`portal-chat-mini-bubble ${message.from}`} key={`${message.from}-${index}`}>
              {message.text}
            </div>
          ))}
          {!activeTicket && departments.length > 0 && (
            <div className="portal-chat-departments">
              {departments.map(department => (
                <button key={department.id} onClick={() => handleDepartmentSelect(department)}>
                  {department.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="portal-chat-inputbar">
        <input
          value={widgetInput}
          onChange={event => setWidgetInput(event.target.value)}
          onKeyDown={event => event.key === "Enter" && handleSubmit()}
          placeholder={inputPlaceholder}
          disabled={Boolean(activeTicket)}
        />
        <button aria-label="Send support query" onClick={handleSubmit} disabled={Boolean(activeTicket)}>
          <Send size={21} />
        </button>
        <button aria-label="Helpful"><ThumbsUp size={21} /></button>
        <button aria-label="Attach file"><Paperclip size={21} /></button>
        <button aria-label="Emoji"><Smile size={21} /></button>
      </div>

      <button className="portal-chat-powered">Powered by CIIS</button>
      <button className="portal-chat-minimize" onClick={() => setWidgetOpen(false)} aria-label="Minimize chat">
        <ChevronDown size={38} />
      </button>
    </aside>
  );
};

export default SupportChatWidget;