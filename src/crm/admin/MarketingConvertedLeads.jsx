import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiAward,
  FiCalendar,
  FiTrendingUp,
  FiEye,
  FiCheckCircle,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiTag 
} from 'react-icons/fi';/*  */
import './MarketingConvertedLeads.css';

const STATS_DATA = [
  {
    id: 'total-converted',
    value: '1',
    label: 'Total Converted',
    icon: FiAward,
    iconBg: 'bg-green-light',
    iconColor: '#16a34a'
  },
  {
    id: 'converted-today',
    value: '0',
    label: 'Converted Today',
    icon: FiCalendar,
    iconBg: 'bg-purple-light',
    iconColor: '#9333ea'
  },
  {
    id: 'this-month',
    value: '0',
    label: 'This Month',
    icon: FiCalendar,
    iconBg: 'bg-cyan-light',
    iconColor: '#0284c7'
  },
  {
    id: 'conversion-rate',
    value: '0.3%',
    label: 'Conversion Rate',
    icon: FiTrendingUp,
    iconBg: 'bg-amber-light',
    iconColor: '#d97706'
  }
];

const INITIAL_CONVERTED = [
  {
    id: 1,
    leadId: '#LD-007',
    customerName: 'Zara Nair',
    customerEmail: 'zara.nair67@gmail.com',
    contact: '8879968460',
    source: 'Facebook',
    sourceTone: 'purple',
    type: 'NEET',
    typeTone: 'green',
    convertedOn: '24 Aug 2026, 02:28 PM',
    status: 'Converted',
    agent: 'Marketing Exec3'
  }
];

const MarketingConvertedLeads = () => {
  const [convertedData] = useState(INITIAL_CONVERTED);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [selectedType, setSelectedType] = useState('All Types');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Applied Filters State
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedSource, setAppliedSource] = useState('All Sources');
  const [appliedType, setAppliedType] = useState('All Types');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  // Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleApplyFilter = () => {
    setAppliedSearch(searchQuery);
    setAppliedSource(selectedSource);
    setAppliedType(selectedType);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setSelectedSource('All Sources');
    setSelectedType('All Types');
    setDateFrom('');
    setDateTo('');

    setAppliedSearch('');
    setAppliedSource('All Sources');
    setAppliedType('All Types');
    setAppliedDateFrom('');
    setAppliedDateTo('');
  };

  const filteredData = useMemo(() => {
    return convertedData.filter(item => {
      if (appliedSource !== 'All Sources' && item.source !== appliedSource) return false;
      if (appliedType !== 'All Types' && item.type !== appliedType) return false;

      if (appliedSearch.trim() !== '') {
        const query = appliedSearch.toLowerCase();
        const matchLeadId = item.leadId.toLowerCase().includes(query);
        const matchName = item.customerName.toLowerCase().includes(query);
        const matchEmail = item.customerEmail.toLowerCase().includes(query);
        const matchPhone = item.contact.toLowerCase().includes(query);
        if (!matchLeadId && !matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [convertedData, appliedSource, appliedType, appliedSearch]);

  return (
    <div className="mcl-root">
      {/* Top Header & Breadcrumb */}
      <div className="mcl-header">
        <div className="mcl-title-area">
          <h1>Converted Leads</h1>
          <p className="mcl-subtitle">Customers successfully converted from your assigned leads.</p>
        </div>
        <nav className="mcl-breadcrumb">
          <span>Marketing</span>
          <FiChevronRight className="crumb-arrow" />
          <span className="crumb-active">Converted Leads</span>
        </nav>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="mcl-stats-grid">
        {STATS_DATA.map(stat => {
          const IconComp = stat.icon;
          return (
            <div className="mcl-stat-card" key={stat.id}>
              <div className="mcl-stat-info">
                <span className="mcl-stat-label">{stat.label}</span>
                <span className="mcl-stat-value">{stat.value}</span>
              </div>
              <div className={`mcl-stat-icon-wrapper ${stat.iconBg}`}>
                <IconComp style={{ color: stat.iconColor }} className="mcl-stat-icon" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Card */}
      <div className="mcl-card mcl-filter-card">
        <div className="mcl-filter-grid">
          <div className="mcl-field">
            <label>Search</label> 
            <input
              type="text"
              placeholder="Name, lead ID, phone or email"
              className="mcl-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mcl-field">
            <label>Source</label>
            <select
              className="mcl-select"
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
            >
              <option value="All Sources">All Sources</option>
              <option value="Facebook">Facebook</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Self">Self</option>
              <option value="School Visit">School Visit</option>
            </select>
          </div>

          <div className="mcl-field">
            <label>Lead Type</label>
            <select
              className="mcl-select"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="CUET">CUET</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className="mcl-field">
            <label>Converted From</label>
            <input
              type="date"
              className="mcl-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>

          <div className="mcl-field">
            <label>Converted To</label>
            <input
              type="date"
              className="mcl-input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>

          <div className="mcl-filter-actions">
            <button className="mcl-btn-filter" onClick={handleApplyFilter} title="Apply Filters">
              <FiFilter />
            </button>
            <button className="mcl-btn-reset" onClick={handleResetFilter} title="Reset Filters">
              <FiRotateCcw />
            </button>
          </div>
        </div>
      </div>

      {/* Converted Customer List Table Card */}
      <div className="mcl-card">
        <div className="mcl-card-header flex-between">
          <h2 className="mcl-section-title">Converted Customer List</h2>
          <span className="mcl-pill-badge pill-green">{filteredData.length} records</span>
        </div>

        {/* Table */}
        <div className="mcl-table-responsive">
          <table className="mcl-table">
            <thead>
              <tr>
                <th>LEAD ID</th>
                <th>CUSTOMER</th>
                <th>CONTACT</th>
                <th>SOURCE</th>
                <th>TYPE</th>
                <th>CONVERTED ON</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map(item => (
                  <tr key={item.id}>
                    <td className="mcl-lead-id">{item.leadId}</td>
                    <td>
                      <div className="mcl-cust-cell">
                        <span className="mcl-cust-name">{item.customerName}</span>
                        <span className="mcl-cust-email">{item.customerEmail}</span>
                      </div>
                    </td>
                    <td className="mcl-font-medium">{item.contact}</td>
                    <td>
                      <span className={`mcl-chip chip-${item.sourceTone}`}>{item.source}</span>
                    </td>
                    <td>
                      <span className={`mcl-chip chip-${item.typeTone}`}>{item.type}</span>
                    </td>
                    <td className="mcl-date-cell">{item.convertedOn}</td>
                    <td>
                      <span className="mcl-status-converted">
                        <FiCheckCircle className="mcl-check-icon" /> {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="mcl-btn-view"
                        onClick={() => setSelectedCustomer(item)}
                      >
                        <FiEye /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="mcl-empty-cell">
                    No converted customer records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Details */}
      {selectedCustomer && (
        <div className="mcl-modal-backdrop">
          <div className="mcl-modal">
            <div className="mcl-modal-header">
              <h3>Converted Lead Details</h3>
              <button className="mcl-close-btn" onClick={() => setSelectedCustomer(null)}>
                <FiX />
              </button>
            </div>
            <div className="mcl-modal-body">
              <div className="mcl-cust-header-row">
                <div className="mcl-cust-avatar">
                  <FiUser />
                </div>
                <div>
                  <h4 className="mcl-modal-cust-name">{selectedCustomer.customerName}</h4>
                  <span className="mcl-lead-id">{selectedCustomer.leadId}</span>
                </div>
              </div>

              <div className="mcl-detail-grid">
                <div className="mcl-detail-item">
                  <span className="mcl-detail-label"><FiMail /> Email</span>
                  <span className="mcl-detail-val">{selectedCustomer.customerEmail}</span>
                </div>
                <div className="mcl-detail-item">
                  <span className="mcl-detail-label"><FiPhone /> Phone</span>
                  <span className="mcl-detail-val">{selectedCustomer.contact}</span>
                </div>
                <div className="mcl-detail-item">
                  <span className="mcl-detail-label"><FiTag /> Source & Type</span>
                  <span className="mcl-detail-val">
                    {selectedCustomer.source} / {selectedCustomer.type}
                  </span>
                </div>
                <div className="mcl-detail-item">
                  <span className="mcl-detail-label"><FiCalendar /> Converted On</span>
                  <span className="mcl-detail-val">{selectedCustomer.convertedOn}</span>
                </div>
                <div className="mcl-detail-item">
                  <span className="mcl-detail-label"><FiUser /> Marketing Agent</span>
                  <span className="mcl-detail-val">{selectedCustomer.agent}</span>
                </div>
                <div className="mcl-detail-item">
                  <span className="mcl-detail-label"><FiCheckCircle /> Status</span>
                  <span className="mcl-status-converted">
                    <FiCheckCircle /> {selectedCustomer.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="mcl-modal-footer">
              <button className="mcl-btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingConvertedLeads;
  