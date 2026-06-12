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
import CIISLoader from "../../../Loader/CIISLoader";
import {
  calculatePaymentSummary,
  formatDate,
  formatMoney,
  useClientPortalData,
} from "../../utils/clientPortalData";
import "./PaymentsInvoicesPage.css";

const getInitials = value => String(value || "C").trim().slice(0, 1).toUpperCase();

const PaymentsInvoicesPage = () => {
  const { client, projectManagers, loading, error, refetch } = useClientPortalData();
  const payment = calculatePaymentSummary(client);
  const clientName = client?.client || client?.name || "Client";
  const manager = projectManagers[0] || {};

  const invoices = payment.receipts.length
    ? payment.receipts.map((receipt, index) => ({
      id: receipt.invoiceId || receipt.receiptNo || receipt._id || `PAY-${index + 1}`,
      period: `${formatDate(receipt.startDate || payment.latest?.startDate)} - ${formatDate(receipt.endDate || payment.latest?.endDate)}`,
      amount: formatMoney(receipt.amount || receipt.price || receipt.paidAmount || payment.subscriptionPrice),
      dueDate: formatDate(receipt.paymentDate || receipt.createdAt || payment.nextDueDate),
      status: receipt.status || "Paid",
    }))
    : payment.latest
      ? [{
        id: `SUB-${String(client?._id || "").slice(-6).toUpperCase() || "CURRENT"}`,
        period: `${formatDate(payment.latest.startDate)} - ${formatDate(payment.latest.endDate)}`,
        amount: formatMoney(payment.subscriptionPrice),
        dueDate: formatDate(payment.latest.endDate),
        status: payment.outstanding > 0 ? "Due Soon" : "Active",
      }]
      : [];

  const metricCards = [
    { label: "Total Paid", value: formatMoney(payment.paidAmount), note: `${payment.receipts.length} receipt(s)`, tone: "green", icon: <FiDollarSign /> },
    { label: "Outstanding Amount", value: formatMoney(payment.outstanding), note: `${payment.unpaidInvoices} invoice due`, tone: "orange", icon: <FiAlertCircle /> },
    { label: "Active Plan", value: payment.planName, note: payment.billingCycle, tone: "purple", icon: <FiAward /> },
    { label: "Next Due Date", value: formatDate(payment.nextDueDate), note: payment.nextDueDate ? "Subscription renewal" : "Not available", tone: "blue", icon: <FiCalendar /> },
    { label: "Unpaid Invoices", value: String(payment.unpaidInvoices), note: "View details", tone: "red", icon: <FiFileText />, link: true },
  ];

  if (loading) {
    return <CIISLoader />;
  }

  if (error || !client) {
    return (
      <section className="PaymentsPage-root">
        <div className="PaymentsPage-panel">
          <h2>{error || "No client data found for this login."}</h2>
          <button type="button" className="PaymentsPage-primary" onClick={refetch}>Try Again</button>
        </div>
      </section>
    );
  }

  return (
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
            Quick Action
            <FiChevronDown aria-hidden="true" />
          </button>
          <button type="button" className="PaymentsPage-iconButton" aria-label="Notifications">
            <FiBell />
            <span>{payment.unpaidInvoices}</span>
          </button>
          <button type="button" className="PaymentsPage-userButton">
            <span className="PaymentsPage-userAvatar">{getInitials(clientName)}</span>
            <strong>{clientName}</strong>
            <FiChevronDown aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="PaymentsPage-metrics">
        {metricCards.map(card => (
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
              <div className="PaymentsPage-planIcon"><FiAward /></div>
              <div className="PaymentsPage-planDetails">
                <h2>Subscription Summary</h2>
                <div className="PaymentsPage-planGrid">
                  <div><span>Plan</span><strong>{payment.planName}</strong></div>
                  <div><span>Billing Cycle</span><strong>{payment.billingCycle}</strong></div>
                  <div><span>Renews On</span><strong>{formatDate(payment.nextDueDate)}</strong></div>
                  <div><span>Plan Price</span><strong>{formatMoney(payment.subscriptionPrice)}</strong></div>
                </div>
              </div>
            </div>
            <div className="PaymentsPage-subscriptionActions">
              <button type="button" className="PaymentsPage-primary">Renew Now</button>
              <button type="button" className="PaymentsPage-secondary"><FiDownload />Download Invoice</button>
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
                  {invoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td><strong>{invoice.id}</strong></td>
                      <td>{invoice.period}</td>
                      <td><strong>{invoice.amount}</strong></td>
                      <td>{invoice.dueDate}</td>
                      <td>
                        <span className={`PaymentsPage-status PaymentsPage-status-${invoice.status === "Paid" || invoice.status === "Active" ? "paid" : "due"}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td><button type="button" className="PaymentsPage-download" aria-label={`Download ${invoice.id}`}><FiDownload /></button></td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr><td colSpan="6">No payment history found for this client.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <a href="/client/payments" className="PaymentsPage-viewAll">View All Invoices<FiArrowRight /></a>
          </section>
        </div>

        <aside className="PaymentsPage-rightColumn">
          <section className="PaymentsPage-panel PaymentsPage-paymentSummary">
            <h2>Payment Summary</h2>
            <div className="PaymentsPage-summaryRows">
              <div><span>Due This Month</span><strong className="PaymentsPage-orangeText">{formatMoney(payment.outstanding)}</strong></div>
              <div><span>Overdue Amount</span><strong className="PaymentsPage-greenText">{formatMoney(payment.outstanding)}</strong></div>
              <hr />
              <div className="PaymentsPage-totalRow"><span>Total Outstanding</span><strong>{formatMoney(payment.outstanding)}</strong></div>
            </div>
            <button type="button" className="PaymentsPage-primary PaymentsPage-fullButton">Pay Now</button>
          </section>

          <section className="PaymentsPage-panel PaymentsPage-supportPanel">
            <h2>Billing Support</h2>
            <div className="PaymentsPage-manager">
              <div className="PaymentsPage-managerIcon"><FiUser /></div>
              <div>
                <span>Account Manager</span>
                <strong>{manager.name || "Account Manager"}</strong>
                {manager.phone && <a href={`tel:${manager.phone}`}><FiPhone /> {manager.phone}</a>}
                {manager.email && <a href={`mailto:${manager.email}`}><FiMail /> {manager.email}</a>}
              </div>
            </div>
            <button type="button" className="PaymentsPage-secondary PaymentsPage-fullButton"><FiHeadphones />Raise Billing Ticket</button>
          </section>
        </aside>
      </div>
    </section>
  );
};

export default PaymentsInvoicesPage;
