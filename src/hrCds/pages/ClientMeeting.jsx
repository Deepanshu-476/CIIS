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
  const [viewMode, setViewMode] = useState("table"); // table, calendar, grid

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

  /* ================= FETCH ================= */
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/cmeeting");
      setMeetings(res.data.data);
    } catch (err) {
      console.error(err);
      // Show error toast here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  /* ================= FILTER ================= */
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

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SAVE ================= */
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

  /* ================= EDIT ================= */
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

  /* ================= DELETE ================= */
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

  /* ================= RESET ================= */
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

  /* ================= STATS ================= */
  const today = new Date().toISOString().split('T')[0];
  const totalMeetings = meetings.length;
  const todayMeetings = meetings.filter(m => m.meetingDate === today).length;
  const upcomingMeetings = meetings.filter(m => m.meetingDate > today).length;
  const highPriorityMeetings = meetings.filter(m => m.priority === "High").length;

  /* ================= FORMAT DATE ================= */
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
    <div className="client-meeting-container">
      {/* ================= HEADER ================= */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-title">
            <h1 className="page-title">Client Meetings</h1>
            <span className="meeting-count">{totalMeetings} total</span>
          </div>
          <p className="page-subtitle">Manage and schedule client meetings efficiently</p>
        </div>
        <button className="btn-primary" onClick={() => {
          resetForm();
          setShowModal(true);
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Meeting
        </button>
      </div>

      {/* ================= QUICK STATS ================= */}
      <div className="stats-gridd">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number">{totalMeetings}</span>
            <span className="stat-label">Total Meetings</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number">{todayMeetings}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number">{upcomingMeetings}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-number">{highPriorityMeetings}</span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>
      </div>

      {/* ================= FILTERS SECTION ================= */}
      <div className="filters-sectionn">
        <div className="search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, company, email..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <select 
            className="filter-select"
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

          <select 
            className="filter-select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>

          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ================= LOADING STATE ================= */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading meetings...</p>
        </div>
      )}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMeeting ? "Edit Meeting" : "Schedule New Meeting"}</h3>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                resetForm();
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                {/* Column 1 */}
                <div className="form-group required">
                  <label>Client Name</label>
                  <input
                    name="clientName"
                    value={form.clientName}
                    onChange={handleChange}
                    placeholder="Enter client name"
                  />
                </div>

                <div className="form-group required">
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="client@company.com"
                  />
                </div>

                <div className="form-group">
                  <label>Company</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </div>

                {/* Column 2 */}
                <div className="form-group">
                  <label>Meeting Type</label>
                  <select
                    name="meetingType"
                    value={form.meetingType}
                    onChange={handleChange}
                  >
                    <option value="Online">Online</option>
                    <option value="Demo">Demo</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Sales">Sales</option>
                    <option value="Review">Review</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group required">
                  <label>Date</label>
                  <input
                    type="date"
                    name="meetingDate"
                    value={form.meetingDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group required">
                  <label>Time</label>
                  <input
                    type="time"
                    name="meetingTime"
                    value={form.meetingTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group required">
                <label>Duration (minutes)</label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div className="form-group required">
                <label>Location / Platform</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Zoom link, Teams link, or physical address"
                />
              </div>

              <div className="form-group">
                <label>Agenda / Notes</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Meeting agenda, discussion points, preparation notes..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Follow-up Required</label>
                <select
                  name="followUpRequired"
                  value={form.followUpRequired}
                  onChange={handleChange}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowModal(false);
                resetForm();
              }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveMeeting} disabled={loading}>
                {loading ? "Saving..." : (selectedMeeting ? "Update Meeting" : "Schedule Meeting")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONTENT ================= */}
      {!loading && (
        <>
          {filteredMeetings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="M8 14h8M8 18h8" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>No meetings found</h3>
              <p>
                {searchTerm || filterType !== "all" || filterPriority !== "all"
                  ? "Try adjusting your filters"
                  : "Schedule your first meeting to get started"}
              </p>
              <button className="btn-primary" onClick={() => {
                resetForm();
                setShowModal(true);
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Schedule Meeting
              </button>
            </div>
          ) : viewMode === "table" ? (
            <div className="table-container">
              <table className="data-table">
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
                  {filteredMeetings.map((meeting) => (
                    <tr key={meeting._id} className={meeting.meetingDate === today ? "today-row" : ""}>
                      <td>
                        <div className="client-info">
                          <div className="client-avatar">
                            {meeting.clientName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="client-details">
                            <div className="client-name">{meeting.clientName}</div>
                            <div className="client-meta">
                              {meeting.company && <span>{meeting.company}</span>}
                              {meeting.email && <span>• {meeting.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`meeting-type type-${meeting.meetingType.toLowerCase()}`}>
                          {meeting.meetingType}
                        </span>
                      </td>
                      <td>
                        <div className="datetime">
                          <div className="date">{formatDate(meeting.meetingDate)}</div>
                          <div className="time">{formatTime(meeting.meetingTime)}</div>
                          <div className="duration">{meeting.duration} min</div>
                        </div>
                      </td>
                      <td>
                        <span className={`priority-badge priority-${meeting.priority.toLowerCase()}`}>
                          {meeting.priority}
                        </span>
                      </td>
                      <td>
                        <div className="location-cell" title={meeting.location}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <span className="location-text">
                            {meeting.location?.length > 30 
                              ? meeting.location.substring(0, 30) + "..." 
                              : meeting.location}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon btn-edit" 
                            onClick={() => editMeeting(meeting)}
                            title="Edit meeting"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                          </button>
                          <button 
                            className="btn-icon btn-delete" 
                            onClick={() => deleteMeeting(meeting._id)}
                            title="Delete meeting"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid-view">
              {filteredMeetings.map((meeting) => (
                <div key={meeting._id} className="meeting-card">
                  <div className="card-header">
                    <div className="card-type">
                      <span className={`meeting-type type-${meeting.meetingType.toLowerCase()}`}>
                        {meeting.meetingType}
                      </span>
                      <span className={`priority-dot priority-${meeting.priority.toLowerCase()}`} />
                    </div>
                    <button 
                      className="card-menu-btn"
                      onClick={() => editMeeting(meeting)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="card-body">
                    <h4 className="card-client">{meeting.clientName}</h4>
                    {meeting.company && (
                      <div className="card-company">{meeting.company}</div>
                    )}
                    
                    <div className="card-details">
                      <div className="card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>{formatDate(meeting.meetingDate)}</span>
                      </div>
                      
                      <div className="card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>{formatTime(meeting.meetingTime)} ({meeting.duration} min)</span>
                      </div>
                      
                      <div className="card-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span className="location-text">{meeting.location}</span>
                      </div>
                      
                      {meeting.email && (
                        <div className="card-detail">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          <span>{meeting.email}</span>
                        </div>
                      )}
                      
                      {meeting.phone && (
                        <div className="card-detail">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                            <line x1="12" y1="18" x2="12" y2="18"/>
                          </svg>
                          <span>{meeting.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {meeting.description && (
                      <div className="card-description">
                        <p>{meeting.description}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-footer">
                    <button 
                      className="btn-secondary btn-small"
                      onClick={() => editMeeting(meeting)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-danger btn-small"
                      onClick={() => deleteMeeting(meeting._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}