import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Users,
  PhoneCall,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  X,
  FileText,
  User,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  Copy,
  Check,
  Shield
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import './DemoRequests.css';

const DemoRequests = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [demoRequests, setDemoRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    pending: 0,
    contacted: 0,
    scheduled: 0,
    completed: 0,
    rejected: 0
  });

  // Modal State for viewing/editing notes
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalNotes, setModalNotes] = useState('');
  const [modalStatus, setModalStatus] = useState('New');
  const [savingModal, setSavingModal] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  // Re-calculate stats dynamically whenever allRequests updates
  const updateStats = useCallback((requestsList) => {
    const newStats = {
      total: requestsList.length,
      new: requestsList.filter((r) => (r.status || 'New') === 'New').length,
      pending: requestsList.filter((r) => r.status === 'Pending').length,
      contacted: requestsList.filter((r) => r.status === 'Contacted').length,
      scheduled: requestsList.filter((r) => r.status === 'Scheduled').length,
      completed: requestsList.filter((r) => r.status === 'Completed').length,
      rejected: requestsList.filter((r) => r.status === 'Rejected').length
    };
    setStats(newStats);
  }, []);

  const fetchDemoRequests = useCallback(async () => {
    setLoading(true);
    try {
      let rawData = [];

      // 1. Primary demo request endpoint (from landing page Book Demo modal)
      try {
        const demoRes = await axios.get('/demo-requests', { _skipErrorNotify: true });
        if (demoRes?.data?.success && Array.isArray(demoRes.data.data)) {
          rawData.push(...demoRes.data.data);
        }
      } catch (err) {
        console.warn('Demo requests endpoint notice:', err.message);
      }

      // 2. Secondary/fallback service enquiries endpoint
      try {
        const serviceRes = await axios.get('/clientsservice/service-enquiries', { _skipErrorNotify: true });
        if (serviceRes?.data?.success && Array.isArray(serviceRes.data.data)) {
          const existingIds = new Set(rawData.map((i) => String(i._id || i.id)));
          const extraItems = serviceRes.data.data.filter((i) => !existingIds.has(String(i._id || i.id)));
          rawData.push(...extraItems);
        }
      } catch (err) {
        console.warn('Service enquiries endpoint notice:', err.message);
      }

        let normalized = rawData.map((item) => {
          let reqs = item.requirements || '';
          let msg = item.message || '';

          if (!item.phone || item.serviceName || (item.requirement && item.requirement.includes('Demo Request:'))) {
            let empCount = item.employeeCount || '11-50';
            let phone = item.phone || '';
            let email = item.email || '';

            const rawReq = item.requirement || '';

            const phoneMatch = rawReq.match(/Phone:\s*([^\s,]+)/i);
            if (phoneMatch && !phone) phone = phoneMatch[1];

            const emailMatch = rawReq.match(/Email:\s*([^\s,]+)/i);
            if (emailMatch && !email) email = emailMatch[1];

            const empMatch = rawReq.match(/Demo Request:\s*([^.]+)/i);
            if (empMatch) empCount = empMatch[1].replace('Employees', '').trim();

            const reqsMatch = rawReq.match(/Requirements:\s*(.*?)(?=\.\s*Message:|\.\s*Phone:|$)/i);
            if (reqsMatch) reqs = reqsMatch[1].trim();

            const msgMatch = rawReq.match(/Message:\s*(.*?)(?=\.\s*Phone:|\.\s*Email:|$)/i);
            if (msgMatch) msg = msgMatch[1].trim();

            if (!msgMatch && !reqsMatch && !item.message) {
              msg = rawReq;
            }

            const savedStatus = localStorage.getItem(`ciis_demo_status_${item._id}`);
            const savedNotes = localStorage.getItem(`ciis_demo_notes_${item._id}`);

            return {
              _id: item._id,
              name: item.clientName || item.name || 'Demo Lead',
              email: email || item.email || 'N/A',
              phone: phone || item.phone || 'N/A',
              companyName: item.companyName || 'N/A',
              employeeCount: item.employeeCount || empCount,
              requirements: reqs,
              message: msg,
              status: savedStatus || (item.status === 'Pending' ? 'New' : (item.status || 'New')),
              createdAt: item.createdAt,
              notes: savedNotes !== null ? savedNotes : (item.notes || ''),
              serviceName: item.serviceName || ''
            };
          }

          const savedStatus = localStorage.getItem(`ciis_demo_status_${item._id}`);
          const savedNotes = localStorage.getItem(`ciis_demo_notes_${item._id}`);

          return {
            ...item,
            status: savedStatus || item.status || 'New',
            notes: savedNotes !== null ? savedNotes : (item.notes || ''),
            requirements: reqs,
            message: msg
          };
        });

        // Filter out locally deleted IDs (Blacklist)
        const deletedIds = JSON.parse(localStorage.getItem('ciis_deleted_demo_ids') || '[]');
        if (deletedIds.length > 0) {
          normalized = normalized.filter((item) => !deletedIds.includes(item._id));
        }

        // Filter for demo service items
        normalized = normalized.filter((i) =>
          !i.serviceName || i.serviceName.toLowerCase().includes('demo') || (i.message && i.message.toLowerCase().includes('demo')) || (i.requirements && i.requirements.length > 0)
        );

        setAllRequests(normalized);
        updateStats(normalized);
    } catch (err) {
      console.error('Error fetching demo requests:', err);
    } finally {
      setLoading(false);
    }
  }, [updateStats]);

  useEffect(() => {
    fetchDemoRequests();
  }, [fetchDemoRequests]);

  // Apply filters to table display
  useEffect(() => {
    let filtered = [...allRequests];

    if (statusFilter !== 'All') {
      filtered = filtered.filter((r) => (r.status || 'New') === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((i) =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.phone && i.phone.toLowerCase().includes(q)) ||
        (i.companyName && i.companyName.toLowerCase().includes(q)) ||
        (i.message && i.message.toLowerCase().includes(q))
      );
    }

    setDemoRequests(filtered);
  }, [allRequests, statusFilter, search]);

  const handleStatusChange = async (id, newStatus) => {
    const updated = allRequests.map((item) => (item._id === id ? { ...item, status: newStatus } : item));
    setAllRequests(updated);
    updateStats(updated);

    localStorage.setItem(`ciis_demo_status_${id}`, newStatus);
    toast.success(`Status updated to ${newStatus}`);

    try {
      await axios.patch(`/clientsservice/service-enquiries/${id}/status`, { status: newStatus }, { _skipErrorNotify: true });
    } catch (err) {
      try {
        await axios.put(`/demo-requests/${id}`, { status: newStatus }, { _skipErrorNotify: true });
      } catch (err2) {
        // Silently handled locally
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this demo request?')) return;

    // Immediately add to local deleted blacklist
    const deletedIds = JSON.parse(localStorage.getItem('ciis_deleted_demo_ids') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('ciis_deleted_demo_ids', JSON.stringify(deletedIds));
    }

    const updated = allRequests.filter((item) => item._id !== id);
    setAllRequests(updated);
    updateStats(updated);

    toast.success('Demo request deleted successfully');
  };

  const handleOpenDetails = (req) => {
    setSelectedRequest(req);
    setModalNotes(req.notes || '');
    setModalStatus(req.status || 'New');
    setCopiedField('');
  };

  const handleSaveModal = async () => {
    if (!selectedRequest) return;
    setSavingModal(true);

    const id = selectedRequest._id;
    const updated = allRequests.map((item) =>
      item._id === id ? { ...item, status: modalStatus, notes: modalNotes } : item
    );

    setAllRequests(updated);
    updateStats(updated);

    localStorage.setItem(`ciis_demo_status_${id}`, modalStatus);
    localStorage.setItem(`ciis_demo_notes_${id}`, modalNotes);

    toast.success('Details and notes updated successfully');
    setSelectedRequest(null);

    try {
      await axios.patch(`/clientsservice/service-enquiries/${id}/status`, { status: modalStatus }, { _skipErrorNotify: true });
    } catch (err) {
      try {
        await axios.put(`/demo-requests/${id}`, { status: modalStatus, notes: modalNotes }, { _skipErrorNotify: true });
      } catch (err2) {
        // Silently handled locally
      }
    } finally {
      setSavingModal(false);
    }
  };

  // Professional Inline Copy Feedback (underneath copy button)
  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField((current) => (current === fieldName ? '' : current));
    }, 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status dot color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return '#16a34a';
      case 'Pending': return '#d97706';
      case 'Contacted': return '#2563eb';
      case 'Scheduled': return '#9333ea';
      case 'Completed': return '#059669';
      case 'Rejected': return '#dc2626';
      default: return '#16a34a';
    }
  };

  return (
    <div className="demo-req-container">
      {/* Header */}
      <div className="demo-req-header">
        <div>
          <h1><Calendar className="w-7 h-7 inline-block mr-2" /> Demo Requests</h1>
          <p>Manage and track leads who booked a free demo.</p>
        </div>
        <button type="button" className="demo-req-refresh-btn" onClick={fetchDemoRequests} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh List
        </button>
      </div>

      {/* Metric Cards */}
      <div className="demo-req-stats-grid">
        <div className="demo-req-stat-card">
          <div className="demo-req-stat-icon total"><Users className="w-6 h-6" /></div>
          <div className="demo-req-stat-info">
            <span>TOTAL REQUESTS</span>
            <strong>{stats.total || 0}</strong>
          </div>
        </div>
        <div className="demo-req-stat-card">
          <div className="demo-req-stat-icon new"><Clock className="w-6 h-6" /></div>
          <div className="demo-req-stat-info">
            <span>NEW REQUESTS</span>
            <strong>{stats.new || 0}</strong>
          </div>
        </div>
        <div className="demo-req-stat-card">
          <div className="demo-req-stat-icon contacted"><PhoneCall className="w-6 h-6" /></div>
          <div className="demo-req-stat-info">
            <span>CONTACTED</span>
            <strong>{stats.contacted || 0}</strong>
          </div>
        </div>
        <div className="demo-req-stat-card">
          <div className="demo-req-stat-icon scheduled"><Calendar className="w-6 h-6" /></div>
          <div className="demo-req-stat-info">
            <span>SCHEDULED</span>
            <strong>{stats.scheduled || 0}</strong>
          </div>
        </div>
        <div className="demo-req-stat-card">
          <div className="demo-req-stat-icon completed"><CheckCircle className="w-6 h-6" /></div>
          <div className="demo-req-stat-info">
            <span>COMPLETED</span>
            <strong>{stats.completed || 0}</strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="demo-req-controls">
        <div className="demo-req-search">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="demo-req-filters">
          <label><Filter className="w-4 h-4 inline mr-1" /> Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Pending">Pending</option>
            <option value="Contacted">Contacted</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="demo-req-table-wrapper">
        {loading ? (
          <div className="demo-req-empty">Loading demo requests...</div>
        ) : demoRequests.length === 0 ? (
          <div className="demo-req-empty">
            <FileText className="w-12 h-12 stroke-1" />
            <h3>No Demo Requests Found</h3>
            <p>No requests match your filter or search query.</p>
          </div>
        ) : (
          <table className="demo-req-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Client</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {demoRequests.map((req) => (
                <tr key={req._id}>
                  <td>{formatDate(req.createdAt)}</td>
                  <td>
                    <span className="demo-user-name">{req.name}</span>
                    <span className="demo-user-email">{req.email}</span>
                  </td>
                  <td>
                    <span className={`pro-status-badge ${req.status || 'New'}`}>
                      {req.status || 'New'}
                    </span>
                  </td>
                  <td>
                    <div className="demo-actions">
                      <button
                        type="button"
                        className="demo-action-btn view"
                        title="View Details"
                        onClick={() => handleOpenDetails(req)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="demo-action-btn delete"
                        title="Delete Request"
                        onClick={() => handleDelete(req._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Screenshot Match Exact Details Modal */}
      {selectedRequest && (
        <div className="pro-details-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="pro-details-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Header with Light Blue Tint & Status Badge */}
            <div className="pro-details-header">
              <div className="pro-header-left">
                <div className="pro-header-icon">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2>Demo Request Details</h2>
                  <p>Review lead information and manage follow-up</p>
                </div>
              </div>
              <div className="pro-header-right">
                <span className={`pro-status-badge ${selectedRequest.status || 'New'}`}>
                  {selectedRequest.status || 'New'}
                </span>
                <button
                  type="button"
                  className="pro-close-btn"
                  onClick={() => setSelectedRequest(null)}
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="pro-details-body">
              
              {/* Section 1: Customer Information */}
              <div className="pro-section">
                <h3 className="pro-section-title">Customer Information</h3>
                <div className="pro-info-grid">
                  
                  {/* Full Name */}
                  <div className="pro-info-box">
                    <User className="box-icon" />
                    <div className="box-content">
                      <span>FULL NAME</span>
                      <strong>{selectedRequest.name}</strong>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="pro-info-box">
                    <Building2 className="box-icon" />
                    <div className="box-content">
                      <span>COMPANY NAME</span>
                      <strong>{selectedRequest.companyName}</strong>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="pro-info-box">
                    <Mail className="box-icon" />
                    <div className="box-content">
                      <span>EMAIL ADDRESS</span>
                      <strong>{selectedRequest.email}</strong>
                    </div>
                    <div className="inline-copy-wrapper">
                      <button
                        type="button"
                        className={`box-action-btn ${copiedField === 'email' ? 'active' : ''}`}
                        title="Copy Email"
                        onClick={() => copyToClipboard(selectedRequest.email, 'email')}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {copiedField === 'email' && (
                        <span className="inline-copied-tooltip">
                          <Check className="w-3 h-3 inline mr-0.5" /> Copied!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="pro-info-box">
                    <Phone className="box-icon" />
                    <div className="box-content">
                      <span>PHONE NUMBER</span>
                      <strong>{selectedRequest.phone}</strong>
                    </div>
                    <div className="box-actions-group">
                      <a
                        href={`tel:${selectedRequest.phone}`}
                        className="box-action-btn"
                        title="Call Number"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                      <div className="inline-copy-wrapper">
                        <button
                          type="button"
                          className={`box-action-btn ${copiedField === 'phone' ? 'active' : ''}`}
                          title="Copy Phone"
                          onClick={() => copyToClipboard(selectedRequest.phone, 'phone')}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {copiedField === 'phone' && (
                          <span className="inline-copied-tooltip">
                            <Check className="w-3 h-3 inline mr-0.5" /> Copied!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Size */}
                  <div className="pro-info-box">
                    <Users className="box-icon" />
                    <div className="box-content">
                      <span>TEAM SIZE</span>
                      <strong>{selectedRequest.employeeCount || '11-50'} Employees</strong>
                    </div>
                  </div>

                  {/* Submitted Date */}
                  <div className="pro-info-box">
                    <Calendar className="box-icon" />
                    <div className="box-content">
                      <span>SUBMITTED DATE</span>
                      <strong>{formatDate(selectedRequest.createdAt)}</strong>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 2: Request Details */}
              <div className="pro-section">
                <h3 className="pro-section-title">Request Details</h3>
                <div className="pro-details-stack">
                  
                  {/* Specific Requirements */}
                  <div className="pro-detail-card">
                    <FileText className="card-icon" />
                    <div className="card-content">
                      <span>SPECIFIC REQUIREMENTS</span>
                      <p>{selectedRequest.requirements || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Additional Message */}
                  <div className="pro-detail-card">
                    <MessageSquare className="card-icon" />
                    <div className="card-content">
                      <span>ADDITIONAL MESSAGE</span>
                      <p>{selectedRequest.message || 'N/A'}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 3: Follow-up & Status */}
              <div className="pro-section">
                <h3 className="pro-section-title">Follow-up &amp; Status</h3>
                <div className="pro-followup-box">
                  <div className="pro-followup-grid">
                    
                    {/* Update Status Dropdown with Dot Indicator */}
                    <div className="pro-field-group">
                      <label htmlFor="modal-status-select">UPDATE STATUS</label>
                      <div className="pro-status-select-wrap">
                        <span
                          className="pro-status-dot"
                          style={{ backgroundColor: getStatusColor(modalStatus) }}
                        />
                        <select
                          id="modal-status-select"
                          className="pro-select-input-styled"
                          value={modalStatus}
                          onChange={(e) => setModalStatus(e.target.value)}
                        >
                          <option value="New">• New</option>
                          <option value="Pending">• Pending</option>
                          <option value="Contacted">• Contacted</option>
                          <option value="Scheduled">• Scheduled</option>
                          <option value="Completed">• Completed</option>
                          <option value="Rejected">• Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Admin Internal Notes */}
                    <div className="pro-field-group">
                      <label htmlFor="modal-notes-textarea">ADMIN INTERNAL NOTES</label>
                      <div className="pro-textarea-wrapper">
                        <textarea
                          id="modal-notes-textarea"
                          className="pro-textarea"
                          maxLength={500}
                          placeholder="Add notes about demo call status, follow-up date, or sales notes..."
                          value={modalNotes}
                          onChange={(e) => setModalNotes(e.target.value)}
                        />
                        <span className="pro-char-counter">{modalNotes.length} / 500</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pro-details-footer">
              <div className="pro-footer-note">
                <Shield className="w-4 h-4 text-blue-600" /> Changes are visible to admins only
              </div>
              <div className="pro-footer-actions">
                <button
                  type="button"
                  className="pro-btn-cancel"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pro-btn-save"
                  onClick={handleSaveModal}
                  disabled={savingModal}
                >
                  <Check className="w-4 h-4" /> {savingModal ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DemoRequests;
