import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";
import "./ClientMeeting.css";

export default function ClientMeeting() {
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  const [form, setForm] = useState({
    clientName: "",
    phone: "",
    email: "",
    company: "",
    meetingType: "Online",
    priority: "Normal",
    location: "",
    meetingDate: "",
    meetingTime: "",
    duration: "30",
    description: "",
    followUpRequired: "No",
  });

   
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/cmeeting");
      setMeetings(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

   
  const filteredMeetings = meetings.filter(meeting => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = 
      meeting.clientName?.toLowerCase().includes(searchString) ||
      meeting.company?.toLowerCase().includes(searchString) ||
      meeting.email?.toLowerCase().includes(searchString) ||
      meeting.phone?.includes(searchString);
    
    const matchesType = filterType === "all" || meeting.meetingType === filterType;
    const matchesPriority = filterPriority === "all" || meeting.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

   
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

   
  const saveMeeting = async () => {
    if (!form.clientName || !form.phone || !form.meetingDate || !form.meetingTime || !form.location) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      if (selectedMeeting) {
        await axiosInstance.put(`/cmeeting/${selectedMeeting._id}`, form);
      } else {
        await axiosInstance.post("/cmeeting/create", form);
      }
      resetForm();
      setShowModal(false);
      setSelectedMeeting(null);
      fetchMeetings();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

   
  const editMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setForm({
      clientName: meeting.clientName || "",
      phone: meeting.phone || "",
      email: meeting.email || "",
      company: meeting.company || "",
      meetingType: meeting.meetingType || "Online",
      priority: meeting.priority || "Normal",
      location: meeting.location || "",
      meetingDate: meeting.meetingDate || "",
      meetingTime: meeting.meetingTime || "",
      duration: meeting.duration || "30",
      description: meeting.description || "",
      followUpRequired: meeting.followUpRequired || "No",
    });
    setShowModal(true);
  };

   
  const deleteMeeting = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    setLoading(true);
    try {
      await axiosInstance.delete(`/cmeeting/${id}`);
      fetchMeetings();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

   
  const resetForm = () => {
    setForm({
      clientName: "",
      phone: "",
      email: "",
      company: "",
      meetingType: "Online",
      priority: "Normal",
      location: "",
      meetingDate: "",
      meetingTime: "",
      duration: "30",
      description: "",
      followUpRequired: "No",
    });
    setSelectedMeeting(null);
  };

   
  const today = new Date().toISOString().split('T')[0];
  const totalMeetings = meetings.length;
  const todayMeetings = meetings.filter(m => m.meetingDate === today).length;
  const upcomingMeetings = meetings.filter(m => m.meetingDate > today).length;
  const highPriorityMeetings = meetings.filter(m => m.priority === "High").length;

   
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="cm-container">
      
      <div className="cm-header">
        <div className="cm-header-content">
          <div className="cm-header-left">
            <div className="cm-header-icon">🤝</div>
            <div>
              <h1 className="cm-header-title">Client Meetings</h1>
              <p className="cm-header-subtitle">Manage and schedule client meetings efficiently</p>
            </div>
          </div>
          <div className="cm-stats">
            <div className="cm-stat-item">
              <span className="cm-stat-value">{totalMeetings}</span>
              <span className="cm-stat-label">Total Meetings</span>
            </div>
            <div className="cm-stat-item">
              <span className="cm-stat-value">{todayMeetings}</span>
              <span className="cm-stat-label">Today</span>
            </div>
            <div className="cm-stat-item">
              <span className="cm-stat-value">{upcomingMeetings}</span>
              <span className="cm-stat-label">Upcoming</span>
            </div>
            <div className="cm-stat-item">
              <span className="cm-stat-value">{highPriorityMeetings}</span>
              <span className="cm-stat-label">High Priority</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="cm-stats-grid">
        <div className="cm-stat-card">
          <div className="cm-stat-card-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="cm-stat-card-content">
            <span className="cm-stat-card-number">{totalMeetings}</span>
            <span className="cm-stat-card-label">Total Meetings</span>
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-card-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="cm-stat-card-content">
            <span className="cm-stat-card-number">{todayMeetings}</span>
            <span className="cm-stat-card-label">Today's Meetings</span>
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-card-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="cm-stat-card-content">
            <span className="cm-stat-card-number">{upcomingMeetings}</span>
            <span className="cm-stat-card-label">Upcoming</span>
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-card-icon red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="cm-stat-card-content">
            <span className="cm-stat-card-number">{highPriorityMeetings}</span>
            <span className="cm-stat-card-label">High Priority</span>
          </div>
        </div>
      </div>

      {/* ================= TABS SECTION ================= */}
      <div className="cm-tabs-container">
        <div className="cm-tabs">
          <button 
            className={`cm-tab ${viewMode === "table" ? "cm-tab-active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            <span className="cm-tab-icon">📋</span>
            <span>Table View</span>
          </button>
          <button 
            className={`cm-tab ${viewMode === "grid" ? "cm-tab-active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <span className="cm-tab-icon">🎴</span>
            <span>Grid View</span>
          </button>
        </div>
      </div>

      {/* ================= FILTERS SECTION ================= */}
      <div className="cm-filters-section">
        <div className="cm-search-wrapper">
          <svg className="cm-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, company, email..."
            className="cm-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="cm-clear-search" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>
        
        <div className="cm-filter-controls">
          <div className="cm-select-wrapper">
            <select 
              className="cm-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Online">Online</option>
              <option value="Demo">Demo</option>
              <option value="Discussion">Discussion</option>
              <option value="Sales">Sales</option>
              <option value="Review">Review</option>
            </select>
          </div>

          <div className="cm-select-wrapper">
            <select 
              className="cm-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <button className="cm-btn cm-btn-primary cm-new-meeting-btn" onClick={() => {
            resetForm();
            setShowModal(true);
          }}>
            <span>➕</span>
            New Meeting
          </button>
        </div>
      </div>

      {/* ================= LOADING STATE ================= */}
      {loading && (
        <div className="cm-loading-state">
          <div className="cm-spinner"></div>
          <p>Loading meetings...</p>
        </div>
      )}

      {/* ================= CONTENT ================= */}
      {!loading && (
        <>
          {filteredMeetings.length === 0 ? (
            <div className="cm-empty-state">
              <div className="cm-empty-icon">📅</div>
              <h3 className="cm-empty-title">No meetings found</h3>
              <p className="cm-empty-text">
                {searchTerm || filterType !== "all" || filterPriority !== "all"
                  ? "Try adjusting your filters"
                  : "Schedule your first meeting to get started"}
              </p>
              <button className="cm-btn cm-btn-primary" onClick={() => {
                resetForm();
                setShowModal(true);
              }}>
                <span>➕</span>
                Schedule Meeting
              </button>
            </div>
          ) : viewMode === "table" ? (
            <div className="cm-table-container">
              <table className="cm-data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Priority</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.map((meeting) => {
                    const isToday = meeting.meetingDate === today;
                    return (
                      <tr key={meeting._id} className={isToday ? "cm-today-row" : ""}>
                        <td>
                          <div className="cm-client-info">
                            <div className="cm-client-avatar">
                              {meeting.clientName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="cm-client-details">
                              <div className="cm-client-name">{meeting.clientName}</div>
                              <div className="cm-client-meta">
                                {meeting.company && <span>{meeting.company}</span>}
                                {meeting.email && <span>• {meeting.email}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`cm-meeting-type cm-type-${meeting.meetingType?.toLowerCase()}`}>
                            {meeting.meetingType}
                          </span>
                        </td>
                        <td>
                          <div className="cm-datetime">
                            <div className="cm-date">{formatDate(meeting.meetingDate)}</div>
                            <div className="cm-time">{formatTime(meeting.meetingTime)}</div>
                            <div className="cm-duration">{meeting.duration} min</div>
                          </div>
                        </td>
                        <td>
                          <span className={`cm-priority-badge cm-priority-${meeting.priority?.toLowerCase()}`}>
                            {meeting.priority}
                          </span>
                        </td>
                        <td>
                          <div className="cm-location-cell" title={meeting.location}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span className="cm-location-text">{meeting.location}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cm-action-buttons">
                            <button 
                              className="cm-action-btn cm-action-edit" 
                              onClick={() => editMeeting(meeting)}
                              title="Edit meeting"
                            >
                              ✏️
                            </button>
                            <button 
                              className="cm-action-btn cm-action-delete" 
                              onClick={() => deleteMeeting(meeting._id)}
                              title="Delete meeting"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="cm-grid-view">
              {filteredMeetings.map((meeting) => (
                <div key={meeting._id} className="cm-meeting-card">
                  <div className="cm-meeting-status-bar" data-priority={meeting.priority?.toLowerCase()} />
                  <div className="cm-meeting-content">
                    <div className="cm-meeting-header">
                      <div className="cm-meeting-title-wrapper">
                        <span className="cm-meeting-icon">🤝</span>
                        <h3 className="cm-meeting-title">{meeting.clientName}</h3>
                      </div>
                      <div className="cm-meeting-badges">
                        <span className={`cm-badge cm-badge-type cm-type-${meeting.meetingType?.toLowerCase()}`}>
                          {meeting.meetingType}
                        </span>
                        <span className={`cm-badge cm-badge-priority cm-priority-${meeting.priority?.toLowerCase()}`}>
                          {meeting.priority}
                        </span>
                      </div>
                    </div>

                    {meeting.company && (
                      <div className="cm-meeting-company">{meeting.company}</div>
                    )}

                    <div className="cm-meeting-details">
                      <div className="cm-detail-item">
                        <span className="cm-detail-icon">📆</span>
                        <span className="cm-detail-text">{formatDate(meeting.meetingDate)}</span>
                      </div>
                      <div className="cm-detail-item">
                        <span className="cm-detail-icon">⏰</span>
                        <span className="cm-detail-text">{formatTime(meeting.meetingTime)} ({meeting.duration} min)</span>
                      </div>
                      <div className="cm-detail-item">
                        <span className="cm-detail-icon">📍</span>
                        <span className="cm-detail-text">{meeting.location}</span>
                      </div>
                      {meeting.email && (
                        <div className="cm-detail-item">
                          <span className="cm-detail-icon">📧</span>
                          <span className="cm-detail-text">{meeting.email}</span>
                        </div>
                      )}
                      {meeting.phone && (
                        <div className="cm-detail-item">
                          <span className="cm-detail-icon">📞</span>
                          <span className="cm-detail-text">{meeting.phone}</span>
                        </div>
                      )}
                    </div>

                    {meeting.description && (
                      <div className="cm-meeting-description">
                        <p>{meeting.description}</p>
                      </div>
                    )}

                    <div className="cm-meeting-footer">
                      <div className="cm-meeting-actions">
                        <button 
                          onClick={() => editMeeting(meeting)}
                          className="cm-action-btn cm-action-view"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => deleteMeeting(meeting._id)}
                          className="cm-action-btn cm-action-delete"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="cm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <div className="cm-modal-title-wrapper">
                <span className="cm-modal-icon">📅</span>
                <h3 className="cm-modal-title">{selectedMeeting ? "Edit Meeting" : "Schedule New Meeting"}</h3>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="cm-modal-close"
              >
                ✕
              </button>
            </div>

            <div className="cm-modal-body">
              <div className="cm-form-grid">
                <div className="cm-form-group required">
                  <label className="cm-label">Client Name</label>
                  <input
                    name="clientName"
                    value={form.clientName}
                    onChange={handleChange}
                    placeholder="Enter client name"
                    className="cm-input"
                  />
                </div>

                <div className="cm-form-group required">
                  <label className="cm-label">Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    className="cm-input"
                  />
                </div>

                <div className="cm-form-group">
                  <label className="cm-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="client@company.com"
                    className="cm-input"
                  />
                </div>

                <div className="cm-form-group">
                  <label className="cm-label">Company</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Company name"
                    className="cm-input"
                  />
                </div>

                <div className="cm-form-group">
                  <label className="cm-label">Meeting Type</label>
                  <div className="cm-select-wrapper">
                    <select
                      name="meetingType"
                      value={form.meetingType}
                      onChange={handleChange}
                      className="cm-select"
                    >
                      <option value="Online">Online</option>
                      <option value="Demo">Demo</option>
                      <option value="Discussion">Discussion</option>
                      <option value="Sales">Sales</option>
                      <option value="Review">Review</option>
                    </select>
                  </div>
                </div>

                <div className="cm-form-group">
                  <label className="cm-label">Priority</label>
                  <div className="cm-select-wrapper">
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="cm-select"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="cm-form-group required">
                  <label className="cm-label">Date</label>
                  <input
                    type="date"
                    name="meetingDate"
                    value={form.meetingDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="cm-input"
                  />
                </div>

                <div className="cm-form-group required">
                  <label className="cm-label">Time</label>
                  <input
                    type="time"
                    name="meetingTime"
                    value={form.meetingTime}
                    onChange={handleChange}
                    className="cm-input"
                  />
                </div>
              </div>

              <div className="cm-form-group required">
                <label className="cm-label">Duration</label>
                <div className="cm-select-wrapper">
                  <select
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    className="cm-select"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>

              <div className="cm-form-group required">
                <label className="cm-label">Location / Platform</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Zoom link, Teams link, or physical address"
                  className="cm-input"
                />
              </div>

              <div className="cm-form-group">
                <label className="cm-label">Agenda / Notes</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Meeting agenda, discussion points, preparation notes..."
                  rows="4"
                  className="cm-textarea"
                />
              </div>

              <div className="cm-form-group">
                <label className="cm-label">Follow-up Required</label>
                <div className="cm-select-wrapper">
                  <select
                    name="followUpRequired"
                    value={form.followUpRequired}
                    onChange={handleChange}
                    className="cm-select"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="cm-modal-footer">
              <button 
                className="cm-btn cm-btn-secondary" 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button 
                className="cm-btn cm-btn-primary" 
                onClick={saveMeeting} 
                disabled={loading}
              >
                {loading ? "Saving..." : (selectedMeeting ? "Update Meeting" : "Schedule Meeting")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}