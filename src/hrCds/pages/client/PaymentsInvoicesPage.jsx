import React, { useState } from "react";
import axios from "axios";
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
  formatPublicId,
  useClientPortalData,
} from "../../utils/clientPortalData";
import API_URL from "../../../config";
import "./PaymentsInvoicesPage.css";

const getInitials = value => String(value || "C").trim().slice(0, 1).toUpperCase();

const PaymentsInvoicesPage = () => {
  const { client, projectManagers, loading, error, refetch } = useClientPortalData();
  const payment = calculatePaymentSummary(client);
  const clientName = client?.client || client?.name || "Client";
  const manager = projectManagers[0] || {};
  const [receiptAmount, setReceiptAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [selectedDueId, setSelectedDueId] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const dueInvoiceRows = payment.dueInvoices.map((invoice, index) => ({
    id: formatPublicId("INV", invoice, index),
    rawId: invoice._id,
    period: invoice.title || "Subscription Due",
    amount: formatMoney(invoice.amount),
    dueDate: formatDate(invoice.dueDate),
    status: invoice.status || "Due",
    isDue: true,
  }));

  const invoices = payment.receipts.length
    ? [...dueInvoiceRows, ...payment.receipts.map((receipt, index) => ({
      id: formatPublicId("PAY", receipt, index),
      rawId: receipt._id,
      period: `${formatDate(receipt.startDate || payment.latest?.startDate)} - ${formatDate(receipt.endDate || payment.latest?.endDate)}`,
      amount: formatMoney(receipt.amount || receipt.price || receipt.paidAmount || payment.subscriptionPrice),
      dueDate: formatDate(receipt.paymentDate || receipt.createdAt || payment.nextDueDate),
      status: receipt.status || "Paid",
    }))]
    : payment.latest
      ? [...dueInvoiceRows, {
        id: formatPublicId("SUB", { _id: client?._id, createdAt: payment.latest.startDate || client?.createdAt }, 0),
        period: `${formatDate(payment.latest.startDate)} - ${formatDate(payment.latest.endDate)}`,
        amount: formatMoney(payment.subscriptionPrice),
        dueDate: formatDate(payment.latest.endDate),
        status: payment.outstanding > 0 ? "Due Soon" : "Active",
      }]
      : dueInvoiceRows;

  const handleUploadReceipt = async (event) => {
    event.preventDefault();
    if (!client?._id) return;
    if (!receiptFile) {
      alert("Please select payment proof file");
      return;
    }

    const formData = new FormData();
    formData.append("receipt", receiptFile);
    formData.append("amount", receiptAmount || payment.outstanding || 0);
    formData.append("transactionId", transactionId);
    if (selectedDueId) formData.append("dueInvoiceId", selectedDueId);

    try {
      setUploadingReceipt(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      await axios.post(`${API_URL}/clientsservice/upload-receipt/${client._id}`, formData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data",
        },
      });
      setReceiptAmount("");
      setTransactionId("");
      setReceiptFile(null);
      setSelectedDueId("");
      await refetch();
      alert("Payment proof uploaded. Team will verify it.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload payment proof");
    } finally {
      setUploadingReceipt(false);
    }
  };

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
            <form className="PaymentsPage-proofForm" onSubmit={handleUploadReceipt}>
              <h3>Upload Payment Proof</h3>
              {payment.dueInvoices.length > 0 && (
                <select value={selectedDueId} onChange={(e) => setSelectedDueId(e.target.value)}>
                  <option value="">Select due invoice</option>
                  {payment.dueInvoices.map((invoice, index) => (
                    <option key={invoice._id} value={invoice._id}>
                      {formatPublicId("INV", invoice, index)} - {invoice.title || 'Due'} - {formatMoney(invoice.amount)}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="number"
                min="0"
                placeholder="Amount paid"
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
              />
              <input
                type="text"
                placeholder="Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              <button type="submit" className="PaymentsPage-primary PaymentsPage-fullButton" disabled={uploadingReceipt}>
                {uploadingReceipt ? "Uploading..." : "Upload Proof"}
              </button>
            </form>
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
  