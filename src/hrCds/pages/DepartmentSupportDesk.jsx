import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  Clock3,
  Inbox,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import axiosInstance from "../../utils/axiosConfig";
import "./SupportCenter.css";

const statusClass = value => String(value || "Open").toLowerCase().replace(/\s+/g, "-");

const formatTime = value => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapTicket = ticket => ({
  id: ticket.id || ticket._id,
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject || "Support query",
  description: ticket.description || "",
  status: ticket.status || "Open",
  priority: ticket.priority || "Medium",
  department: ticket.department || "General",
  requesterName: ticket.requesterName || "User",
  requesterEmail: ticket.requesterEmail || "",
  assignedToName: ticket.assignedToName || "Unassigned",
  updated: ticket.updated || ticket.updatedAt,
  createdAt: ticket.createdAt,
  messages: Array.isArray(ticket.messages) ? ticket.messages : [],
});

const DepartmentSupportDesk = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/support/admin/tickets", { _skipErrorNotify: true });
      if (response.data?.success) {
        const mapped = (response.data.tickets || []).map(mapTicket);
        setTickets(mapped);
        setSelectedTicketId(current => current || mapped[0]?.id || "");
      }
    } catch (error) {
      console.warn("Department support desk could not load tickets:", error.message);
      toast.error("Assigned support chats could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const search = query.trim().toLowerCase();
    return tickets.filter(ticket => {
      const matchesStatus = status === "All" || ticket.status === status;
      const matchesSearch = !search || [
        ticket.ticketNumber,
        ticket.subject,
        ticket.requesterName,
        ticket.requesterEmail,
        ticket.department,
      ].join(" ").toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [query, status, tickets]);

  const selectedTicket = tickets.find(ticket => ticket.id === selectedTicketId) || filteredTickets[0];

  const openCount = tickets.filter(ticket => !["Resolved", "Closed"].includes(ticket.status)).length;
  const waitingCount = tickets.filter(ticket => ticket.status === "Waiting").length;
  const resolvedCount = tickets.filter(ticket => ["Resolved", "Closed"].includes(ticket.status)).length;

  const updateSelectedTicket = updatedTicket => {
    const mapped = mapTicket(updatedTicket);
    setTickets(prev => prev.map(ticket => ticket.id === mapped.id ? mapped : ticket));
    setSelectedTicketId(mapped.id);
  };

  const handleSendReply = async () => {
    if (!selectedTicket?.id || !reply.trim()) return;

    setSending(true);
    try {
      const response = await axiosInstance.patch(`/support/admin/tickets/${selectedTicket.id}`, {
        message: reply.trim(),
        status: selectedTicket.status === "Waiting" ? "In Progress" : selectedTicket.status,
      });

      if (response.data?.success) {
        updateSelectedTicket(response.data.ticket);
        setReply("");
        toast.success("Reply sent to user");
      }
    } catch (error) {
      console.error("Department support reply failed:", error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async nextStatus => {
    if (!selectedTicket?.id) return;

    try {
      const response = await axiosInstance.patch(`/support/admin/tickets/${selectedTicket.id}`, {
        status: nextStatus,
      });
      if (response.data?.success) {
        updateSelectedTicket(response.data.ticket);
        toast.success("Ticket status updated");
      }
    } catch (error) {
      console.error("Department support status update failed:", error);
    }
  };

  return (
    <main className="support-page support-desk-page">
      <section className="support-hero glass-card support-desk-hero">
        <div>
          <div className="support-eyebrow">
            <MessageCircle size={16} />
            Department Support Desk
          </div>
          <h1>Assigned user issues.</h1>
          <p>
            Issues assigned to your department by the chatbot will appear here with their complete conversation threads.
          </p>
        </div>
        <aside className="support-notification-card">
          <div className="support-kpi-strip">
            <div className="support-kpi"><strong>{openCount}</strong><span>Active</span></div>
            <div className="support-kpi"><strong>{waitingCount}</strong><span>Waiting</span></div>
            <div className="support-kpi"><strong>{resolvedCount}</strong><span>Closed</span></div>
          </div>
        </aside>
      </section>

      <section className="support-desk-layout">
        <aside className="support-panel glass-card support-desk-list-panel">
          <div className="support-panel-header">
            <div>
              <span className="support-panel-kicker">Inbox</span>
              <h2>User Issues</h2>
            </div>
            <button className="support-icon-btn" onClick={fetchTickets} aria-label="Refresh support desk">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="support-toolbar">
            <label className="support-search">
              <Search size={18} />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search issue" />
            </label>
            <select value={status} onChange={event => setStatus(event.target.value)}>
              <option>All</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Waiting</option>
              <option>Resolved</option>
              <option>Closed</option>
              <option>Escalated</option>
            </select>
          </div>

          <div className="support-desk-ticket-list">
            {filteredTickets.map(ticket => (
              <button
                className={`support-desk-ticket ${selectedTicket?.id === ticket.id ? "active" : ""}`}
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
              >
                <span className={`support-badge ${statusClass(ticket.status)}`}>{ticket.status}</span>
                <strong>{ticket.subject}</strong>
                <small>{ticket.ticketNumber} - {ticket.requesterName}</small>
              </button>
            ))}
            {!filteredTickets.length && (
              <div className="support-empty-state">
                <Inbox size={26} />
                <span>{loading ? "Loading assigned issues..." : "No assigned issues found"}</span>
              </div>
            )}
          </div>
        </aside>

        <section className="support-panel glass-card support-desk-chat-panel">
          {selectedTicket ? (
            <>
              <div className="support-desk-chat-header">
                <div>
                  <span className="support-panel-kicker">{selectedTicket.department}</span>
                  <h2>{selectedTicket.subject}</h2>
                  <p>{selectedTicket.ticketNumber} - {selectedTicket.requesterName} - {selectedTicket.requesterEmail}</p>
                </div>
                <select value={selectedTicket.status} onChange={event => handleStatusChange(event.target.value)}>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Waiting</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                  <option>Escalated</option>
                </select>
              </div>

              <div className="support-desk-thread">
                {selectedTicket.messages.length ? selectedTicket.messages.map(message => (
                  <div
                    className={`support-desk-message ${message.senderRole === "employee" ? "user" : "agent"}`}
                    key={message._id || `${message.senderName}-${message.createdAt}`}
                  >
                    <div className="support-desk-message-meta">
                      <UserRound size={15} />
                      <strong>{message.senderName || (message.senderRole === "employee" ? selectedTicket.requesterName : selectedTicket.assignedToName)}</strong>
                      <span>{formatTime(message.createdAt)}</span>
                    </div>
                    <p>{message.message}</p>
                  </div>
                )) : (
                  <div className="support-empty-state">
                    <MessageCircle size={26} />
                    <span>No messages yet</span>
                  </div>
                )}
              </div>

              <div className="support-desk-reply">
                <textarea
                  value={reply}
                  onChange={event => setReply(event.target.value)}
                  placeholder="Type your response for the user..."
                  rows={3}
                />
                <div className="support-desk-reply-actions">
                  <span><Clock3 size={16} /> Last update {formatTime(selectedTicket.updated)}</span>
                  <button className="support-primary-btn" onClick={handleSendReply} disabled={sending || !reply.trim()}>
                    <Send size={18} />
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="support-empty-state support-desk-empty">
              <CheckCircle2 size={34} />
              <strong>No support chat selected</strong>
              <span>Assigned chatbot issues will appear here.</span>
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default DepartmentSupportDesk;
