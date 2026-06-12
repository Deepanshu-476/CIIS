import React from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiAward,
  FiBell,
  FiCalendar,
  FiChevronDown,
  FiDownload,
  FiDollarSign,
  FiFileText,
  FiHeadphones,
  FiMail,
  FiPhone,
  FiSearch,
  FiUser,
} from "react-icons/fi";
import "./PaymentsInvoicesPage.css";

const rupee = "\u20b9";

const invoices = [
  { id: "INV-2026-067", period: "May 26 - Jun 25, 2026", amount: `${rupee}32,000`, dueDate: "Jun 25, 2026", status: "Due Soon" },
  { id: "INV-2026-066", period: "Apr 26 - May 25, 2026", amount: `${rupee}32,000`, dueDate: "May 25, 2026", status: "Paid" },
  { id: "INV-2026-065", period: "Mar 26 - Apr 25, 2026", amount: `${rupee}32,000`, dueDate: "Apr 25, 2026", status: "Paid" },
  { id: "INV-2026-064", period: "Feb 26 - Mar 25, 2026", amount: `${rupee}32,000`, dueDate: "Mar 25, 2026", status: "Paid" },
  { id: "INV-2026-063", period: "Jan 26 - Feb 25, 2026", amount: `${rupee}32,000`, dueDate: "Feb 25, 2026", status: "Paid" },
];

const metricCards = [
  { label: "Total Paid", value: `${rupee}1,24,500`, note: "+22% vs last month", tone: "green", icon: <FiDollarSign /> },
  { label: "Outstanding Amount", value: `${rupee}18,000`, note: "1 invoice due", tone: "orange", icon: <FiAlertCircle /> },
  { label: "Active Plan", value: "Business Pro", note: "Monthly Plan", tone: "purple", icon: <FiAward /> },
  { label: "Next Due Date", value: "Jun 25, 2026", note: "In 16 days", tone: "blue", icon: <FiCalendar /> },
  { label: "Unpaid Invoices", value: "1", note: "View details", tone: "red", icon: <FiFileText />, link: true },
];

const PaymentsInvoicesPage = () => (
  <section className="PaymentsPage-root"> 
    <header className="PaymentsPage-header">
      <div className="PaymentsPage-title">
        <h1>Payments & Subscription</h1>
        <p>Manage your billing, view invoices, and track payments.</p>
      </div>

      <div className="PaymentsPage-actions">
        <label className="PaymentsPage-search">
          <FiSearch aria-hidden="true" />
          <input type="search" placeholder="Search services, invoices, tickets..." />
        </label>
        <button type="button" className="PaymentsPage-primary PaymentsPage-quick">
          + Quick Action
          <FiChevronDown aria-hidden="true" />
        </button>
        <button type="button" className="PaymentsPage-iconButton" aria-label="Notifications">
          <FiBell />
          <span>12</span>
        </button>
        <button type="button" className="PaymentsPage-userButton">
          <span className="PaymentsPage-userAvatar">T</span>
          <strong>Test123</strong>
          <FiChevronDown aria-hidden="true" />
        </button>
      </div>
    </header>

    <div className="PaymentsPage-metrics">
      {metricCards.map((card) => (
        <article className="PaymentsPage-metricCard" key={card.label}>
          <div className={`PaymentsPage-metricIcon PaymentsPage-${card.tone}`}>{card.icon}</div>
          <div>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
            {card.link ? <a href="/client/payments">{card.note}</a> : <span className={`PaymentsPage-note PaymentsPage-note-${card.tone}`}>{card.note}</span>}
          </div>
        </article>
      ))}
    </div>

    <div className="PaymentsPage-contentGrid">
      <div className="PaymentsPage-leftColumn">
        <section className="PaymentsPage-panel PaymentsPage-subscriptionPanel">
          <div className="PaymentsPage-subscriptionTop">
            <div className="PaymentsPage-planIcon">
              <FiAward />
            </div>
            <div className="PaymentsPage-planDetails">
              <h2>Subscription Summary</h2>
              <div className="PaymentsPage-planGrid">
                <div>
                  <span>Plan</span>
                  <strong>Business Pro</strong>
                </div>
                <div>
                  <span>Billing Cycle</span>
                  <strong>Monthly</strong>
                </div>
                <div>
                  <span>Renews On</span>
                  <strong>Jun 25, 2026</strong>
                </div>
                <div>
                  <span>Monthly Price</span>
                  <strong>{rupee}32,000</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="PaymentsPage-subscriptionActions">
            <button type="button" className="PaymentsPage-primary">Renew Now</button>
            <button type="button" className="PaymentsPage-secondary">
              <FiDownload />
              Download Invoice
            </button>
          </div>
        </section>

        <section className="PaymentsPage-panel PaymentsPage-tablePanel">
          <h2>Invoice & Payment History</h2>
          <div className="PaymentsPage-tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Billing Period</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.id}</strong></td>
                    <td>{invoice.period}</td>
                    <td><strong>{invoice.amount}</strong></td>
                    <td>{invoice.dueDate}</td>
                    <td>
                      <span className={`PaymentsPage-status PaymentsPage-status-${invoice.status === "Paid" ? "paid" : "due"}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="PaymentsPage-download" aria-label={`Download ${invoice.id}`}>
                        <FiDownload />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a href="/client/payments" className="PaymentsPage-viewAll">
            View All Invoices
            <FiArrowRight />
          </a>
        </section>
      </div>

      <aside className="PaymentsPage-rightColumn">
        <section className="PaymentsPage-panel PaymentsPage-paymentSummary">
          <h2>Payment Summary</h2>
          <div className="PaymentsPage-summaryRows">
            <div>
              <span>Due This Month</span>
              <strong className="PaymentsPage-orangeText">{rupee}18,000</strong>
            </div>
            <div>
              <span>Overdue Amount</span>
              <strong className="PaymentsPage-greenText">{rupee}0</strong>
            </div>
            <hr />
            <div className="PaymentsPage-totalRow">
              <span>Total Outstanding</span>
              <strong>{rupee}18,000</strong>
            </div>
          </div>
          <button type="button" className="PaymentsPage-primary PaymentsPage-fullButton">Pay Now</button>
        </section>

        <section className="PaymentsPage-panel PaymentsPage-supportPanel">
          <h2>Billing Support</h2>
          <div className="PaymentsPage-manager">
            <div className="PaymentsPage-managerIcon">
              <FiUser />
            </div>
            <div>
              <span>Account Manager</span>
              <strong>Rahul Sharma</strong>
              <a href="tel:+919567876545"><FiPhone /> +91 95678 76545</a>
              <a href="mailto:rahul.sharma@ciisnetwork.com"><FiMail /> rahul.sharma@ciisnetwork.com</a>
            </div>
          </div>
          <button type="button" className="PaymentsPage-secondary PaymentsPage-fullButton">
            <FiHeadphones />
            Raise Billing Ticket
          </button>
        </section>
      </aside>
    </div>
  </section>
);

export default PaymentsInvoicesPage;
  