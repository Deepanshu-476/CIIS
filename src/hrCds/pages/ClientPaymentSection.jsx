import React from 'react';
import './PaymentSection.css';
import { 
  FiSearch, 
  FiBell, 
  FiDollarSign, 
  FiAlertCircle, 
  FiAward, 
  FiCalendar, 
  FiFileText, 
  FiDownload, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiHeadphones,
  FiArrowRight
} from 'react-icons/fi';

const PaymentSection = () => {
  const invoices = [
    { id: 'INV-2026-067', period: 'May 26 - Jun 25, 2026', amount: '₹32,000', date: 'Jun 25, 2026', status: 'Due Soon' },
    { id: 'INV-2026-066', period: 'Apr 26 - May 25, 2026', amount: '₹32,000', date: 'May 25, 2026', status: 'Paid' },
    { id: 'INV-2026-065', period: 'Mar 26 - Apr 25, 2026', amount: '₹32,000', date: 'Apr 25, 2026', status: 'Paid' },
    { id: 'INV-2026-064', period: 'Feb 26 - Mar 25, 2026', amount: '₹32,000', date: 'Mar 25, 2026', status: 'Paid' },
    { id: 'INV-2026-063', period: 'Jan 26 - Feb 25, 2026', amount: '₹32,000', date: 'Feb 25, 2026', status: 'Paid' },
  ];

  return (
    <div className="ps-dashboard">
      
      <div className="ps-header">
        <div className="ps-header-left">
          <h1>Payments & Subscription</h1>
          <p>Manage your billing, view invoices, and track payments.</p>
        </div>
        <div className="ps-header-right">
          <div className="ps-search-bar">
            <FiSearch className="ps-search-icon" />
            <input type="text" placeholder="Search services, invoices, tickets..." />
          </div>
          <button className="ps-btn-primary ps-btn-quick">+ Quick Action</button>
          <div className="ps-notification">
            <FiBell size={20} />
            <span className="ps-badge">12</span>
          </div>
          <div className="ps-user-profile">
            <div className="ps-avatar">T</div>
            <span className="ps-username">Test123</span>
          </div>
        </div>
      </div>

      
      <div className="ps-metrics-row">
        <div className="ps-metric-card">
          <div className="ps-metric-icon ps-bg-green"><FiDollarSign /></div>
          <div className="ps-metric-info">
            <p>Total Paid</p>
            <h3>₹1,24,500</h3>
            <span className="ps-trend-up">+22% vs last month</span>
          </div>
        </div>
        <div className="ps-metric-card">
          <div className="ps-metric-icon ps-bg-orange"><FiAlertCircle /></div>
          <div className="ps-metric-info">
            <p>Outstanding Amount</p>
            <h3>₹18,000</h3>
            <span className="ps-trend-alert">1 invoice due</span>
          </div>
        </div>
        <div className="ps-metric-card">
          <div className="ps-metric-icon ps-bg-purple"><FiAward /></div>
          <div className="ps-metric-info">
            <p>Active Plan</p>
            <h3>Business Pro</h3>
            <span className="ps-trend-neutral">Monthly Plan</span>
          </div>
        </div>
        <div className="ps-metric-card">
          <div className="ps-metric-icon ps-bg-blue"><FiCalendar /></div>
          <div className="ps-metric-info">
            <p>Next Due Date</p>
            <h3>Jun 25, 2026</h3>
            <span className="ps-trend-neutral">In 16 days</span>
          </div>
        </div>
        <div className="ps-metric-card">
          <div className="ps-metric-icon ps-bg-red"><FiFileText /></div>
          <div className="ps-metric-info">
            <p>Unpaid Invoices</p>
            <h3>1</h3>
            <a href="#" className="ps-link-blue">View details</a>
          </div>
        </div>
      </div>

      
      <div className="ps-main-grid">
        
        <div className="ps-left-col">
          
          <div className="ps-box">
            <div className="ps-sub-summary-top">
              <div className="ps-sub-icon"><FiAward size={28} /></div>
              <div className="ps-sub-details">
                <h2 className="ps-box-title">Subscription Summary</h2>
                <div className="ps-sub-grid">
                  <div>
                    <p>Plan</p>
                    <strong>Business Pro</strong>
                  </div>
                  <div>
                    <p>Billing Cycle</p>
                    <strong>Monthly</strong>
                  </div>
                  <div>
                    <p>Renews On</p>
                    <strong>Jun 25, 2026</strong>
                  </div>
                  <div>
                    <p>Monthly Price</p>
                    <strong>₹32,000</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="ps-sub-actions">
              <button className="ps-btn-primary ps-btn-large">Renew Now</button>
              <button className="ps-btn-outline ps-btn-large"><FiDownload /> Download Invoice</button>
            </div>
          </div>

          
          <div className="ps-box ps-invoice-box">
            <h2 className="ps-box-title">Invoice & Payment History</h2>
            <table className="ps-table">
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
                {invoices.map((inv, index) => (
                  <tr key={index}>
                    <td className="ps-font-medium">{inv.id}</td>
                    <td className="ps-text-gray">{inv.period}</td>
                    <td className="ps-font-medium">{inv.amount}</td>
                    <td className="ps-text-gray">{inv.date}</td>
                    <td>
                      <span className={`ps-status-pill ${inv.status === 'Paid' ? 'ps-status-paid' : 'ps-status-due'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <button className="ps-action-btn"><FiDownload /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ps-view-all">
              <a href="#" className="ps-link-blue">View All Invoices <FiArrowRight /></a>
            </div>
          </div>
        </div>

        
        <div className="ps-right-col">
          
          <div className="ps-box">
            <h2 className="ps-box-title">Payment Summary</h2>
            <div className="ps-pay-summary-list">
              <div className="ps-pay-row">
                <span>Due This Month</span>
                <strong className="ps-text-orange">₹18,000</strong>
              </div>
              <div className="ps-pay-row">
                <span>Overdue Amount</span>
                <strong className="ps-text-green">₹0</strong>
              </div>
              <hr className="ps-divider" />
              <div className="ps-pay-row ps-total-row">
                <span>Total Outstanding</span>
                <strong>₹18,000</strong>
              </div>
            </div>
            <button className="ps-btn-primary ps-btn-full">Pay Now</button>
          </div>

          
          <div className="ps-box">
            <h2 className="ps-box-title">Billing Support</h2>
            <div className="ps-manager-info">
              <div className="ps-manager-avatar"><FiUser size={24} /></div>
              <div className="ps-manager-details">
                <p>Account Manager</p>
                <h4>Rahul Sharma</h4>
                <span><FiPhone size={14}/> +91 95678 76545</span>
                <span><FiMail size={14}/> rahul.sharma@ciisnetwork.com</span>
              </div>
            </div>
            <button className="ps-btn-outline ps-btn-full"><FiHeadphones /> Raise Billing Ticket</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
