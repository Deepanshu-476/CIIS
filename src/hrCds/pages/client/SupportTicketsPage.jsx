import React, { useEffect, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { SiGooglemeet, SiZoom } from "react-icons/si";
import CIISLoader from "../../../Loader/CIISLoader";
import axiosInstance from "../../../utils/axiosConfig";
import {
  formatDate,
  formatPublicId,
  getClientDisplayName,
  getInitials,
  useClientPortalData,
} from "../../utils/clientPortalData";
import "./SupportTicketsPage.css";

const quickActions = [
  { key: "meeting", icon: <FiCalendar />, title: "Book Meeting", text: "Schedule a meeting with our team", tone: "blue" },
  { key: "callback", icon: <FiPhone />, title: "Request Callback", text: "Request a call at your convenience", tone: "green" },
  { key: "manager", icon: <FiUser />, title: "Contact Account Manager", text: "Get in touch with your account manager", tone: "purple" },
];

const Sparkline = ({ tone }) => (
  <svg viewBox="0 0 112 32" className={`ClientMeetings-spark ClientMeetings-${tone}`} aria-hidden="true">
    <path d="M3 26 C10 20, 16 24, 23 18 S36 12, 44 18 S58 28, 67 19 S80 10, 89 18 S101 25, 109 12" />
  </svg>
);

const getTime = (dateValue, fallbackTime = '') => {
  if (fallbackTime) {
    return new Date(`2000-01-01T${fallbackTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return '10:00 AM';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getMeetingType = meeting => {
  const text = `${meeting.meetingType || ''} ${meeting.link || ''}`.toLowerCase();
  if (text.includes('zoom')) return 'Zoom';
  if (text.includes('call')) return 'Call';
  return 'Google Meet';
};

const getMeetingIcon = type => (
  type === 'Zoom' ? <SiZoom /> : type === 'Call' ? <FiPhone /> : <SiGooglemeet />
);

const isUpcomingMeeting = meeting => {
  const date = new Date(meeting.meetingDate);
  if (Number.isNaN(date.getTime())) return false;
  const status = String(meeting.status || 'Scheduled').toLowerCase();
  return !['completed', 'cancelled'].includes(status) && date >= new Date(new Date().toDateString());
};

const SupportTicketsPage = () => {
  const { client, services, tasks, projectManagers, user, loading, error, refetch } = useClientPortalData();
  const [meetings, setMeetings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState('');
  const [ticketsError, setTicketsError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const clientName = getClientDisplayName(client);
  const manager = projectManagers[0] || {};
  const managerName = manager.name || 'Account Manager';

  useEffect(() => {
    const fetchClientMeetings = async () => {
      if (!client?._id) return;
      setMeetingsLoading(true);
      setMeetingsError('');
      try {
        const companyCode = client.companyCode || localStorage.getItem('companyCode') || localStorage.getItem('company') || '';
        const response = await axiosInstance.get('/cmeeting/history', {
          params: {
            clientId: client._id,
            companyCode,
          },
        });
        setMeetings(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (err) {
        console.error('Error fetching client meetings:', err);
        setMeetingsError(err.response?.data?.message || err.response?.data?.error || 'Failed to load meetings');
        setMeetings([]);
      } finally {
        setMeetingsLoading(false);
      }
    };

    fetchClientMeetings();
  }, [client?._id, client?.companyCode]);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!client?._id) return;
      setTicketsLoading(true);
      setTicketsError('');
      try {
        const response = await axiosInstance.get('/support/tickets/my');
        setTickets(Array.isArray(response.data?.tickets) ? response.data.tickets : []);
      } catch (err) {
        console.error('Error fetching support tickets:', err);
        setTicketsError(err.response?.data?.message || 'Failed to load support tickets');
        setTickets([]);
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchTickets();
  }, [client?._id]);

  const createSupportTicket = async ({ subject, description, category = 'General', priority = 'Medium', source = 'portal' }) => {
    setActionLoading(subject);
    setActionMessage('');
    try {
      const response = await axiosInstance.post('/support/tickets', {
        subject,
        description,
        category,
        priority,
        source,
      });
      if (response.data?.ticket) {
        setTickets(prev => [response.data.ticket, ...prev]);
      }
      setActionMessage(response.data?.message || 'Request submitted successfully');
    } catch (err) {
      console.error('Support action failed:', err);
      setActionMessage(err.response?.data?.message || 'Request failed. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleQuickAction = action => {
    if (action.key === 'manager' && manager.email) {
      window.location.href = `mailto:${manager.email}?subject=${encodeURIComponent(`Support request from ${clientName}`)}`;
      return;
    }

    const actionMap = {
      meeting: {
        subject: `Meeting request from ${clientName}`,
        description: `${clientName} requested a meeting with the account team from the client portal.`,
        category: 'General',
      },
      callback: {
        subject: `Callback request from ${clientName}`,
        description: `${clientName} requested a callback. Please contact them at ${client?.phone || user?.phone || 'their registered contact number'}.`,
        category: 'General',
      },
      manager: {
        subject: `Account manager contact request from ${clientName}`,
        description: `${clientName} requested contact from their account manager.`,
        category: 'General',
      },
    };

    createSupportTicket(actionMap[action.key]);
  };

  const requestSlot = ([date, time]) => {
    createSupportTicket({
      subject: `Meeting slot request: ${date} at ${time}`,
      description: `${clientName} requested a meeting slot on ${date} at ${time}.`,
      category: 'General',
    });
  };

  const handleMeetingAction = async meeting => {
    if (meeting.rawId) {
      axiosInstance.post('/cmeeting/mark-viewed', {
        meetingId: meeting.rawId,
        clientId: client?._id,
        userId: user?._id || user?.id,
      }).catch(err => console.error('Mark viewed failed:', err));
    }

    if (meeting.link) {
      window.open(meeting.link, '_blank', 'noopener,noreferrer');
      return;
    }

    setActionMessage(`${meeting.title}: ${meeting.date} at ${meeting.time}`);
  };

  const upcomingMeetings = meetings.filter(isUpcomingMeeting).slice(0, 10).map((meeting, index) => {
    const member = meeting.createdBy || projectManagers[index % Math.max(projectManagers.length, 1)] || manager || {};
    const type = getMeetingType(meeting);
    return {
      id: meeting._id,
      rawId: meeting._id,
      title: meeting.title || `${clientName} Meeting`,
      member: member.name || managerName,
      avatar: getInitials(member.name || managerName),
      date: formatDate(meeting.meetingDate),
      time: getTime(meeting.meetingDate, meeting.meetingTime),
      type,
      icon: getMeetingIcon(type),
      status: meeting.status || 'Scheduled',
      action: meeting.link ? 'Join Meeting' : 'View Details',
      link: meeting.link || '',
    };
  });

  const history = meetings.filter(meeting => !isUpcomingMeeting(meeting)).slice(0, 8).map(meeting => ({
    title: meeting.title || `${clientName} Meeting`,
    date: formatDate(meeting.meetingDate),
    notes: meeting.description || meeting.location || 'Client meeting update.',
    status: meeting.status || 'Completed'
  }));
  const filteredTickets = tickets.slice(0, 8);
  const slots = [1, 2, 3].map((days, index) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return [formatDate(date), ['02:00 PM', '11:00 AM', '04:00 PM'][index]];
  });
  const nextMeeting = upcomingMeetings[0];

  if (loading) {
    return <CIISLoader />;
  }

  if (error || !client) {
    return <section className="ClientMeetings-root"><p>{error || 'No client data found.'}</p><button type="button" onClick={refetch}>Try Again</button></section>;
  }

  return (
  <section className="ClientMeetings-root">
    <header className="ClientMeetings-header">
      <div className="ClientMeetings-title">
        <h1>Meetings</h1>
        <p>Schedule, join and track your meetings with our team.</p>
      </div>
    </header>

    <section className="ClientMeetings-stats">
      <article className="ClientMeetings-statCard">
        <span className="ClientMeetings-statIcon ClientMeetings-blue"><FiCalendar /></span>
        <div><p>Upcoming Meetings</p><strong>{upcomingMeetings.length}</strong></div>
        <small className="up">+25% <em>vs last month</em></small>
        <Sparkline tone="blue" />
      </article>
      <article className="ClientMeetings-statCard">
        <span className="ClientMeetings-statIcon ClientMeetings-green"><FiCheckCircle /></span>
        <div><p>Completed Meetings</p><strong>{history.length}</strong></div>
        <small className="up">+12% <em>vs last month</em></small>
        <Sparkline tone="green" />
      </article>
      <article className="ClientMeetings-statCard">
        <span className="ClientMeetings-statIcon ClientMeetings-orange"><FiClock /></span>
        <div><p>Pending Requests</p><strong>{Math.max(0, services.length - upcomingMeetings.length)}</strong></div>
        <small className="down">-20% <em>vs last month</em></small>
        <Sparkline tone="orange" />
      </article>
      <article className="ClientMeetings-nextCard">
        <span className="ClientMeetings-statIcon ClientMeetings-purple"><FiCalendar /></span>
        <div>
          <p>Next Meeting</p>
          <strong>{nextMeeting?.title || `${clientName} Review`}</strong>
          <small>{nextMeeting ? `${nextMeeting.date} at ${nextMeeting.time}` : 'No meetings scheduled'}</small>
        </div>
        <button type="button" onClick={() => nextMeeting && handleMeetingAction(nextMeeting)}>
          {nextMeeting?.link ? 'Join' : 'View'}
        </button>
      </article>
    </section>

    {actionMessage && (
      <div className="ClientMeetings-notice">
        {actionMessage}
        <button type="button" onClick={() => setActionMessage('')}>Dismiss</button>
      </div>
    )}

    <div className="ClientMeetings-layout">
      <main className="ClientMeetings-main">
        <section className="ClientMeetings-panel">
          <h2>Upcoming Meetings</h2>
          {meetingsLoading && <p className="ClientMeetings-inlineState">Loading client meetings...</p>}
          {meetingsError && <p className="ClientMeetings-inlineState error">{meetingsError}</p>}
          <div className="ClientMeetings-table">
            <div className="ClientMeetings-tableHead">
              <span>Meeting Title</span><span>Team Member</span><span>Date</span><span>Time</span><span>Meeting Type</span><span>Status</span><span>Action</span>
            </div>
            {upcomingMeetings.length > 0 ? upcomingMeetings.map((meeting, index) => (
              <div className="ClientMeetings-row" key={meeting.id || meeting.title}>
                <span className="ClientMeetings-meetingTitle"><i><FiCalendar /></i>{meeting.title}</span>
                <span className="ClientMeetings-member"><b>{meeting.avatar}</b>{meeting.member}</span>
                <span>{meeting.date}</span>
                <span>{meeting.time}</span>
                <span className="ClientMeetings-type"><i className={`type-${meeting.type.replace(/\s/g, "").toLowerCase()}`}>{meeting.icon}</i>{meeting.type}</span>
                <span><em className="ClientMeetings-status">{meeting.status}</em></span>
                <span>
                  <button
                    className={!meeting.link ? "outline" : index === 3 ? "outline" : ""}
                    type="button"
                    onClick={() => handleMeetingAction(meeting)}
                  >
                    {meeting.action}
                  </button>
                </span>
              </div>
            )) : (
              <div className="ClientMeetings-row ClientMeetings-emptyRow">
                <span className="ClientMeetings-meetingTitle">No meetings scheduled for this client.</span>
              </div>
            )}
          </div>
          <a href="/client/support-tickets">View All Meetings</a>
        </section>

        <section className="ClientMeetings-panel">
          <h2>Support Tickets</h2>
          {ticketsLoading && <p className="ClientMeetings-inlineState">Loading support tickets...</p>}
          {ticketsError && <p className="ClientMeetings-inlineState error">{ticketsError}</p>}
          <div className="ClientMeetings-history">
            <div className="ClientMeetings-ticketHead">
              <span>Ticket</span><span>Category</span><span>Updated</span><span>Status</span>
            </div>
            {filteredTickets.length > 0 ? filteredTickets.map((ticket, index) => (
              <div className="ClientMeetings-ticketRow" key={ticket.id || ticket.ticketNumber}>
                <span>
                  <strong>{ticket.ticketNumber || formatPublicId('TKT', ticket, index)}</strong>
                  <small>{ticket.subject}</small>
                </span>
                <span>{ticket.category || 'General'}</span>
                <span>{formatDate(ticket.updated || ticket.createdAt)}</span>
                <span><em className={`ClientMeetings-historyStatus ${String(ticket.status || 'open').toLowerCase().replace(/\s/g, '')}`}>{ticket.status}</em></span>
              </div>
            )) : (
              <div className="ClientMeetings-ticketRow ClientMeetings-emptyRow">
                <span>No support tickets found.</span>
              </div>
            )}
          </div>
        </section>

        <section className="ClientMeetings-panel">
          <h2>Recent Meeting History</h2>
          <div className="ClientMeetings-history">
            <div className="ClientMeetings-historyHead">
              <span>Meeting Title</span><span>Date</span><span>Notes</span><span>Status</span>
            </div>
            {history.length > 0 ? history.map(item => (
              <div className="ClientMeetings-historyRow" key={item.title}>
                <span>{item.title}</span>
                <span>{item.date}</span>
                <span>{item.notes}</span>
                <span><em className={`ClientMeetings-historyStatus ${item.status.toLowerCase()}`}>{item.status}</em></span>
              </div>
            )) : (
              <div className="ClientMeetings-historyRow ClientMeetings-emptyRow">
                <span>No meeting history yet.</span>
              </div>
            )}
          </div>
          <a href="/client/support-tickets">View All History</a>
        </section>
      </main>

      <aside className="ClientMeetings-side">
        <section className="ClientMeetings-panel ClientMeetings-quick">
          <h2>Quick Actions</h2>
          {quickActions.map(action => (
            <button
              type="button"
              key={action.title}
              onClick={() => handleQuickAction(action)}
              disabled={Boolean(actionLoading)}
            >
              <span className={action.tone}>{action.icon}</span>
              <div>
                <strong>{actionLoading === action.title ? 'Submitting...' : action.title}</strong>
                <small>{action.text}</small>
              </div>
              <FiChevronRight />
            </button>
          ))}
        </section>

        <section className="ClientMeetings-panel ClientMeetings-manager">
          <h2>Your Account Manager</h2>
          <div className="ClientMeetings-managerInfo">
            <div className="ClientMeetings-managerPhoto">RS</div>
            <div>
              <strong>{managerName}</strong>
              <span>{manager.role || 'Account Manager'}</span>
              {manager.phone && <a href={`tel:${manager.phone}`}><FiPhone /> {manager.phone}</a>}
              {manager.email && <a href={`mailto:${manager.email}`}><FiMail /> {manager.email}</a>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (manager.email) {
                window.location.href = `mailto:${manager.email}?subject=${encodeURIComponent(`Message from ${clientName}`)}`;
              } else {
                handleQuickAction(quickActions[2]);
              }
            }}
          >
            <FiMessageSquare /> Message {manager.name ? managerName.split(' ')[0] : 'Manager'}
          </button>
        </section>

        <section className="ClientMeetings-panel ClientMeetings-slots">
          <h2>Available Time Slots</h2>
          <p>Book a meeting at a time that works for you.</p>
          <div>
            {slots.map(slot => (
              <button type="button" key={slot.join("-")} onClick={() => requestSlot(slot)} disabled={Boolean(actionLoading)}>
                <FiCalendar />
                <strong>{slot[0]}<span>{slot[1]}</span></strong>
              </button>
            ))}
          </div>
          <a href="/client/support-tickets">View More Slots</a>
        </section>
      </aside>
    </div>
  </section>
  );
};

export default SupportTicketsPage;
