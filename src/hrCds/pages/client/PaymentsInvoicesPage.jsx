import React from 'react';
import { FiCreditCard, FiDollarSign, FiFileText, FiCheckCircle } from 'react-icons/fi';
import './PaymentsInvoicesPage.css';

const invoices = [
  { id: 'INV-1028', due: 'Jun 15, 2026', amount: '₹28,400', status: 'Paid' },
  { id: 'INV-1031', due: 'Jun 28, 2026', amount: '₹24,000', status: 'Due' },
  { id: 'INV-1034', due: 'Jul 10, 2026', amount: '₹39,800', status: 'Scheduled' }
];

const PaymentsInvoicesPage = () => (
  <section className="ClientPageBase-root">
    <div className="ClientPageBase-header">
      <div>
        <p>Payments</p>
        <h1>Review your invoices and payment schedule</h1>
      </div>
      <button>Pay Now</button>
    </div>

    <div className="ClientPageBase-grid ClientPageBase-summary-grid">
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiDollarSign /></div>
        <p>Balance Due</p>
        <h2>₹24,000</h2>
      </article>
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiCreditCard /></div>
        <p>Next Invoice</p>
        <h2>INV-1031</h2>
      </article>
      <article className="ClientPageBase-card">
        <div className="ClientPageBase-card-icon"><FiCheckCircle /></div>
        <p>Payments on time</p>
        <h2>90%</h2>
      </article>
    </div>

    <section className="ClientPageBase-card ClientPageBase-table-card">
      <div className="ClientPageBase-card-header">
        <div>
          <span>Invoices</span>
          <h2>Recent billing activity</h2>
        </div>
      </div>
      <div className="ClientPageBase-table">
        <div className="ClientPageBase-table-row ClientPageBase-table-heading">
          <div>Invoice</div>
          <div>Amount</div>
          <div>Due Date</div>
          <div>Status</div>
        </div>
        {invoices.map((invoice) => (
          <div key={invoice.id} className="ClientPageBase-table-row">
            <div>{invoice.id}</div>
            <div>{invoice.amount}</div>
            <div>{invoice.due}</div>
            <div><span className={`status status-${invoice.status.toLowerCase()}`}>{invoice.status}</span></div>
          </div>
        ))}
      </div>
    </section>
  </section>
);

export default PaymentsInvoicesPage;
