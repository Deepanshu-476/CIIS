import React from 'react';
import { FiLifeBuoy, FiClock, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import './SupportTicketsPage.css';

const tickets = [
  { id: 'CT-457', subject: 'Website downtime issue', status: 'Open', updated: '5 mins ago', owner: 'Support Team' },
  { id: 'CT-442', subject: 'Invoice clarification', status: 'Pending', updated: '1 hr ago', owner: 'Accounts' },
  { id: 'CT-398', subject: 'Onboarding call request', status: 'Resolved', updated: 'Yesterday', owner: 'Client Success' },
  { id: 'CT-453', subject: 'Campaign deliverables delayed', status: 'Open', updated: '2 hrs ago', owner: 'Project Lead' }
];

const SupportTicketsPage = () => (
  <section className="ClientPageBase-root">
    <div className="ClientPageBase-header">
      <div>
        <p>Support Desk</p>
        <h1>Manage your active tickets</h1>
      </div>
      <button>Submit Ticket</button>
    </div>

    <div className="ClientPageBase-grid ClientPageBase-summary-grid">
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiLifeBuoy /></div>
        <p>Open Tickets</p>
        <h2>2</h2>
      </article>
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiClock /></div>
        <p>Pending Responses</p>
        <h2>1</h2>
      </article>
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiCheckCircle /></div>
        <p>Resolved This Month</p>
        <h2>7</h2>
      </article>
    </div>

    <section className="ClientPageBase-card ClientPageBase-table-card">
      <div className="ClientPageBase-card-header">
        <div>
          <span>Live tickets</span>
          <h2>Latest service requests</h2>
        </div>
      </div>
      <div className="ClientPageBase-table">
        <div className="ClientPageBase-table-row ClientPageBase-table-heading">
          <div>Ticket</div>
          <div>Subject</div>
          <div>Status</div>
          <div>Updated</div>
          <div>Owner</div>
        </div>
        {tickets.map((ticket) => (
          <div key={ticket.id} className="ClientPageBase-table-row">
            <div>{ticket.id}</div>
            <div>{ticket.subject}</div>
            <div><span className={`status status-${ticket.status.toLowerCase()}`}>{ticket.status}</span></div>
            <div>{ticket.updated}</div>
            <div>{ticket.owner}</div>
          </div>
        ))}
      </div>
    </section>
  </section>
);

export default SupportTicketsPage;
