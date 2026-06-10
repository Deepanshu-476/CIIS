import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  LifeBuoy,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  TicketCheck,
  UserRound,
  Wifi,
} from "lucide-react";
import "./SupportCenter.css";

const fallbackTickets = [
  { id: "SUP-1028", subject: "Payroll statement mismatch", type: "Payroll", status: "Open", priority: "High", updated: "12 min ago" },
  { id: "SUP-1024", subject: "Laptop VPN access request", type: "IT Helpdesk", status: "In Progress", priority: "Medium", updated: "42 min ago" },
  { id: "SUP-1019", subject: "Leave balance clarification", type: "HR Policy", status: "Resolved", priority: "Low", updated: "Yesterday" },
  { id: "SUP-1014", subject: "ID card replacement", type: "Facilities", status: "Waiting", priority: "Medium", updated: "May 30" },
];

const statusClass = value => String(value || "Open").toLowerCase().replace(/\s+/g, "-");

const formatRelative = value => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const mapTicket = ticket => ({
  id: ticket.ticketNumber || ticket.id,
  dbId: ticket.id || ticket._id,
  subject: ticket.subject,
  type: ticket.category || ticket.type || "General",
  status: ticket.status || "Open",
  priority: ticket.priority || "Medium",
  updated: formatRelative(ticket.updated || ticket.updatedAt || ticket.createdAt),
  assignedToName: ticket.assignedToName || "Department Head",
  messages: Array.isArray(ticket.messages) ? ticket.messages : [],
});

const ContactSupport = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [tickets, setTickets] = useState(fallbackTickets);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [ticketReply, setTicketReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activeTickets: 4,
    waitingTickets: 0,
    resolvedTickets: 0,
    latestStatus: "No active ticket",
  });

  const fetchSupportOverview = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/support/employee/overview", { _skipErrorNotify: true });
      const data = response.data || {};
      if (data.success) {
        const mappedTickets = (data.tickets || []).map(mapTicket);
        setTickets(mappedTickets);
        const activeTicket = mappedTickets.find(ticket => !["Resolved", "Closed"].includes(ticket.status));
        setSelectedTicketId(current => current || activeTicket?.dbId || mappedTickets[0]?.dbId || "");
        setStats({
          activeTickets: mappedTickets.filter(ticket => !["Resolved", "Closed"].includes(ticket.status)).length,
          waitingTickets: mappedTickets.filter(ticket => ticket.status === "Waiting").length,
          resolvedTickets: mappedTickets.filter(ticket => ["Resolved", "Closed"].includes(ticket.status)).length,
          latestStatus: activeTicket?.status || "No active ticket",
        });
      }
    } catch (error) {
      console.warn("Support overview fallback active:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportOverview();
  }, []);

  const filteredTickets = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return tickets.filter(ticket => {
      const matchesStatus = status === "All" || ticket.status === status;
      const matchesQuery = !searchTerm || [ticket.id, ticket.subject, ticket.type, ticket.priority]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);
      return matchesStatus && matchesQuery;
    });
  }, [query, status, tickets]);

  const selectedTicket = tickets.find(ticket => ticket.dbId === selectedTicketId);

  const handleTicketReply = async () => {
    if (!selectedTicket?.dbId || !ticketReply.trim()) return;

    try {
      const response = await axiosInstance.post(`/support/tickets/${selectedTicket.dbId}/messages`, {
        message: ticketReply.trim(),
      });
      if (response.data?.success) {
        const updatedTicket = mapTicket(response.data.ticket);
        setTickets(prev => prev.map(ticket => ticket.dbId === updatedTicket.dbId ? updatedTicket : ticket));
        setSelectedTicketId(updatedTicket.dbId);
        setTicketReply("");
        toast.success("Reply sent");
      }
    } catch (error) {
      console.error("Support ticket reply failed:", error);
    }
  };

  const supportChannels = [
    { icon: TicketCheck, title: "Active Tickets", value: String(stats.activeTickets), note: "Need response", tone: "green" },
    { icon: Clock3, title: "Waiting", value: String(stats.waitingTickets), note: "With department head", tone: "amber" },
    { icon: CheckCircle2, title: "Resolved", value: String(stats.resolvedTickets), note: "Completed issues", tone: "blue" },
    { icon: MessageCircle, title: "Latest Status", value: stats.latestStatus, note: "Current ticket state", tone: "violet" },
  ];

  return (
    <main className="support-page employee-support-page">
      <section className="support-hero glass-card">
        <div>
          <div className="support-eyebrow">
            <LifeBuoy size={16} />
            Employee Support Center
          </div>
          <h1>Workplace help, routed fast.</h1>
          <p>
            Yahan aapke support tickets ka status aur Department Head ke saath conversation show hogi. New issue raise karne ke liye floating chat widget use karein.
          </p>
        </div>

        <aside className="support-notification-card">
          <div className="support-live-dot">
            <Wifi size={15} />
            Live support online
          </div>
          <div className="support-notification-row">
            <Bell size={18} />
            <span>{loading ? "Syncing support center..." : "Support tickets are connected to backend"}</span>
          </div>
          <div className="support-notification-row">
            <ShieldCheck size={18} />
            <span>Ticket updates trigger real-time notifications</span>
          </div>
        </aside>
      </section>

      <section className="support-stats-grid">
        {supportChannels.map(({ icon: Icon, title, value, note, tone }) => (
          <article className={`support-stat glass-card support-tone-${tone}`} key={title}>
            <div className="support-stat-icon"><Icon size={22} /></div>
            <div>
              <strong>{value}</strong>
              <span>{title}</span>
              <small>{note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="support-status-workspace">
        <div className="support-panel glass-card support-ticket-panel support-status-panel">
          <div className="support-panel-header">
            <div>
              <span className="support-panel-kicker">Support Tickets</span>
              <h2>My Ticket Status</h2>
            </div>
            <button className="support-icon-btn" aria-label="Filter tickets"><Filter size={18} /></button>
          </div>
          <div className="support-toolbar">
            <label className="support-search">
              <Search size={18} />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tickets" />
            </label>
            <select value={status} onChange={event => setStatus(event.target.value)}>
              <option>All</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Waiting</option>
              <option>Resolved</option>
              <option>Escalated</option>
            </select>
          </div>
          <div className="support-table-wrap">
            <table className="support-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} onClick={() => ticket.dbId && setSelectedTicketId(ticket.dbId)} className={selectedTicket && selectedTicket.dbId === ticket.dbId ? "support-row-active" : ""}>
                    <td>
                      <strong>{ticket.id}</strong>
                      <span>{ticket.subject}</span>
                    </td>
                    <td>{ticket.type}</td>
                    <td><span className={`support-badge ${statusClass(ticket.status)}`}>{ticket.status}</span></td>
                    <td><span className={`support-priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td>
                    <td>{ticket.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTicket && (
            <div className="support-user-ticket-thread">
              <div className="support-panel-header">
                <div>
                  <span className="support-panel-kicker">Conversation</span>
                  <h2>{selectedTicket.subject}</h2>
                </div>
                <span className={`support-badge ${statusClass(selectedTicket.status)}`}>{selectedTicket.status}</span>
              </div>

              <div className="support-desk-thread support-user-thread">
                {selectedTicket.messages.length ? selectedTicket.messages.map(message => (
                  <div
                    className={`support-desk-message ${message.senderRole === "employee" ? "agent" : "user"}`}
                    key={message._id || `${message.senderName}-${message.createdAt}`}
                  >
                    <div className="support-desk-message-meta">
                      <UserRound size={15} />
                      <strong>{message.senderName || (message.senderRole === "employee" ? "You" : selectedTicket.assignedToName)}</strong>
                      <span>{formatRelative(message.createdAt)}</span>
                    </div>
                    <p>{message.message}</p>
                  </div>
                )) : (
                  <div className="support-empty-state">
                    <MessageCircle size={26} />
                    <span>No conversation yet</span>
                  </div>
                )}
              </div>

              <div className="support-desk-reply">
                <textarea
                  value={ticketReply}
                  onChange={event => setTicketReply(event.target.value)}
                  placeholder="Reply to Department Head..."
                  rows={3}
                />
                <div className="support-desk-reply-actions">
                  <span><Clock3 size={16} /> Assigned to {selectedTicket.assignedToName}</span>
                  <button className="support-primary-btn" onClick={handleTicketReply} disabled={!ticketReply.trim()}>
                    <Send size={18} />
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ContactSupport;
