import React, { useEffect, useState } from "react";
import axios from "../../../utils/axiosConfig";
import API_URL from "../../../config";
import { toast } from "react-toastify";
import "./AdminMeetingPage.css"; 
import { useSocket } from '../../../context/SocketContext';
import { useNotification } from '../../../context/NotificationContext';

export default function AdminMeetingPage() {
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [statusModal, setStatusModal] = useState({ open: false, data: [], meetingTitle: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, meetingId: null, meetingTitle: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ show: false, message: "" });
  const [companyCode, setCompanyCode] = useState("");
  
  // Get socket from context
  const { 
    socket, 
    isConnected,
    onNewNotification,
    onMeetingUpdate,
    onMeetingReminder
  } = useSocket();
  
  const { showToast } = useNotification();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    recurring: "No",
    attendees: [],
  });

  const adminId = localStorage.getItem("userId");

  // 🟢 Socket Notification Listeners using the context methods
  useEffect(() => {
    console.log("🔔 Setting up socket notification listeners");

    // Listen for new meeting notifications
    const unsubscribeNewMeeting = onNewNotification?.((data) => {
      console.log("📢 New Meeting Notification:", data);
      
      showToast?.(`📅 New Meeting: ${data.title || 'Meeting Scheduled'}`, 'info', 5000);
      
      // Refresh meetings list
      fetchMeetings();
    });

    // Listen for meeting updates if available
    const unsubscribeMeetingUpdate = onMeetingUpdate?.((data) => {
      console.log("🔄 Meeting Update Notification:", data);
      showToast?.(`✏️ Meeting Updated: ${data.title || 'Meeting Details Changed'}`, 'info', 5000);
      fetchMeetings();
    });

    // Listen for meeting reminders if available
    const unsubscribeMeetingReminder = onMeetingReminder?.((data) => {
      console.log("⏰ Meeting Reminder:", data);
      showToast?.(`⏰ Reminder: ${data.title} starts soon!`, 'warning', 10000);
    });

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket notification listeners");
      unsubscribeNewMeeting?.();
      unsubscribeMeetingUpdate?.();
      unsubscribeMeetingReminder?.();
    };
  }, [onNewNotification, onMeetingUpdate, onMeetingReminder]);

  // 🟢 Get company code from user data
  const getCompanyCodeFromUsers = (usersList) => {
    if (usersList && usersList.length > 0 && usersList[0].companyCode) {
      const code = usersList[0].companyCode;
      localStorage.setItem("companyCode", code);
      setCompanyCode(code);
      return code;
    }
    const storedCode = localStorage.getItem("companyCode") || "CAREER";
    setCompanyCode(storedCode);
    return storedCode;
  };

  // 🟢 Fetch all users for current company
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/company-users`);
      if (res.data?.success && res.data.message?.users) {
        const fetchedUsers = res.data.message.users || [];
        setUsers(fetchedUsers);
        
        if (fetchedUsers.length > 0 && fetchedUsers[0].companyCode) {
          const code = fetchedUsers[0].companyCode;
          localStorage.setItem("companyCode", code);
          setCompanyCode(code);
          console.log("Company code set from users:", code);
        }
      } else {
        console.warn("Unexpected API response structure:", res.data);
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("❌ Failed to load users");
      setUsers([]);
    }
  };

  // 🟢 Fetch all meetings for current company
  const fetchMeetings = async () => {
    try {
      setRefreshing(true);
      
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      
      console.log(`Fetching meetings for company: ${currentCompanyCode}`);
      
      let fetchedMeetings = [];
      
      try {
        const res = await axios.get(`${API_URL}/meetings?companyCode=${currentCompanyCode}`);
        
        if (Array.isArray(res.data)) {
          fetchedMeetings = res.data;
        } else if (res.data?.data) {
          fetchedMeetings = res.data.data;
        } else if (res.data?.meetings) {
          fetchedMeetings = res.data.meetings;
        } else if (res.data?.success && res.data.data) {
          fetchedMeetings = res.data.data;
        }
      } catch (err) {
        console.log("Query parameter approach failed, trying alternative...");
        
        try {
          const res = await axios.post(`${API_URL}/meetings/company-meetings`, {
            companyCode: currentCompanyCode
          });
          
          if (Array.isArray(res.data)) {
            fetchedMeetings = res.data;
          } else if (res.data?.data) {
            fetchedMeetings = res.data.data;
          } else if (res.data?.meetings) {
            fetchedMeetings = res.data.meetings;
          }
        } catch (err2) {
          console.log("POST approach failed, fetching all and filtering client-side...");
          
          const res = await axios.get(`${API_URL}/meetings`);
          
          if (Array.isArray(res.data)) {
            fetchedMeetings = res.data;
          } else if (res.data?.data) {
            fetchedMeetings = res.data.data;
          } else if (res.data?.meetings) {
            fetchedMeetings = res.data.meetings;
          } else if (res.data?.success && res.data.data) {
            fetchedMeetings = res.data.data;
          }
          
          fetchedMeetings = fetchedMeetings.filter(meeting => {
            return meeting.companyCode === currentCompanyCode || 
                   meeting.company === currentCompanyCode ||
                   meeting.companyId === currentCompanyCode ||
                   !meeting.companyCode;
          });
        }
      }
      
      fetchedMeetings = fetchedMeetings.filter(meeting => {
        const meetingCompanyCode = meeting.companyCode || meeting.company || meeting.companyId;
        return !meetingCompanyCode || meetingCompanyCode === currentCompanyCode;
      });
      
      console.log(`Fetched ${fetchedMeetings.length} meetings for company: ${currentCompanyCode}`);
      
      if (fetchedMeetings.length > 0) {
        console.log("Sample meeting structure:", fetchedMeetings[0]);
      }
      
      setMeetings(fetchedMeetings);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      toast.error("❌ Failed to fetch meetings");
      setMeetings([]);
    } finally {
      setRefreshing(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await fetchUsers();
      setTimeout(() => {
        fetchMeetings();
      }, 100);
    };
    
    initializeData();
  }, []);

  // Retry fetching meetings if companyCode changes
  useEffect(() => {
    if (companyCode) {
      fetchMeetings();
    }
  }, [companyCode]);

  // 🟢 Handle form inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🟢 Helper function to get user ID
  const getUserId = (user) => user._id || user.id;

  // 🟢 Handle attendee selection
  const handleAttendeeChange = (id) => {
    setForm((prev) => ({
      ...prev,
      attendees: prev.attendees.includes(id)
        ? prev.attendees.filter((a) => a !== id)
        : [...prev.attendees, id],
    }));
  };

  // 🟢 Select all attendees
  const selectAllAttendees = () => {
    const allUserIds = users.map(user => getUserId(user));
    setForm(prev => ({
      ...prev,
      attendees: prev.attendees.length === allUserIds.length ? [] : allUserIds
    }));
  };

  // 🟢 Create meeting
  const createMeeting = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || form.attendees.length === 0) {
      toast.warning("⚠️ Please fill all fields and select attendees");
      return;
    }

    setLoading(true);
    try {
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      
      const payload = { 
        ...form, 
        createdBy: adminId,
        companyCode: currentCompanyCode,
        company: currentCompanyCode,
        companyName: users.length > 0 ? users[0].companyName : "CAREER INFOWIS IT SOLUTION PRIVATE LIMITED"
      };
      
      console.log("Creating meeting with payload:", payload);
      
      const res = await axios.post(`${API_URL}/meetings/create`, payload);
      if (res.data.success) {
        toast.success("✅ Meeting created successfully!");
        
        // Emit socket event if socket is available and has emit method
        if (socket && typeof socket.emit === 'function') {
          socket.emit("meeting-created", {
            meetingId: res.data.meeting?._id,
            title: form.title,
            date: form.date,
            time: form.time,
            companyCode: currentCompanyCode
          });
        } else if (socket && typeof socket.emit === 'undefined') {
          console.log("Socket available but emit method not found, using alternative notification method");
          // Try alternative emit method if socket has different structure
          const socketInstance = socket.socket || socket;
          if (socketInstance && typeof socketInstance.emit === 'function') {
            socketInstance.emit("meeting-created", {
              meetingId: res.data.meeting?._id,
              title: form.title,
              date: form.date,
              time: form.time,
              companyCode: currentCompanyCode
            });
          }
        }
        
        setForm({
          title: "",
          description: "",
          date: "",
          time: "",
          recurring: "No",
          attendees: [],
        });
        fetchMeetings();
        setActiveTab("manage");
      } else {
        toast.error(res.data.message || "❌ Failed to create meeting");
      }
    } catch (err) {
      console.error("Create meeting error:", err);
      toast.error(err.response?.data?.message || "❌ Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Show view status
  const showStatus = async (meetingId, meetingTitle) => {
    try {
      const res = await axios.get(`${API_URL}/meetings/view-status/${meetingId}`);
      setStatusModal({
        open: true,
        data: res.data || [],
        meetingTitle: meetingTitle || "Meeting"
      });
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load meeting status");
    }
  };

  // 🟢 Debug function to test different endpoints
  const testDeleteEndpoints = async (meetingId) => {
    const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
    
    const endpoints = [
      { method: 'delete', url: `${API_URL}/task/${meetingId}`, name: 'Task endpoint' },
      { method: 'delete', url: `${API_URL}/meetings/${meetingId}`, name: 'Meetings direct' },
      { method: 'post', url: `${API_URL}/meetings/delete`, data: { meetingId, companyCode: currentCompanyCode }, name: 'Meetings delete post' },
      { method: 'delete', url: `${API_URL}/meetings/delete/${meetingId}`, name: 'Meetings delete with ID' },
      { method: 'put', url: `${API_URL}/meetings/${meetingId}`, data: { status: 'deleted', companyCode: currentCompanyCode }, name: 'Meetings update status' },
      { method: 'delete', url: `${API_URL}/api/task/${meetingId}`, name: 'API task endpoint' },
      { method: 'delete', url: `${API_URL}/tasks/${meetingId}`, name: 'Tasks endpoint' },
    ];

    setDebugInfo({ show: true, message: "Testing endpoints...\n" });
    
    for (const endpoint of endpoints) {
      try {
        setDebugInfo(prev => ({ 
          ...prev, 
          message: prev.message + `\nTrying: ${endpoint.method.toUpperCase()} ${endpoint.url}` 
        }));
        
        let response;
        if (endpoint.method === 'delete') {
          response = await axios.delete(endpoint.url);
        } else if (endpoint.method === 'post') {
          response = await axios.post(endpoint.url, endpoint.data);
        } else if (endpoint.method === 'put') {
          response = await axios.put(endpoint.url, endpoint.data);
        }
        
        setDebugInfo(prev => ({ 
          ...prev, 
          message: prev.message + `\n✅ SUCCESS! Status: ${response.status}` 
        }));
        
        setMeetings(prevMeetings => 
          prevMeetings.filter(m => (m._id || m.id) !== meetingId)
        );
        
        toast.success(`✅ Meeting deleted via ${endpoint.name}`);
        return true;
      } catch (err) {
        setDebugInfo(prev => ({ 
          ...prev, 
          message: prev.message + `\n❌ Failed: ${err.response?.status || err.message}` 
        }));
      }
    }
    
    setDebugInfo(prev => ({ 
      ...prev, 
      message: prev.message + `\n\n❌ All endpoints failed. Please check API documentation.` 
    }));
    
    return false;
  };

  // 🟢 Delete meeting with debugging
  const deleteMeeting = async () => {
    if (!deleteConfirm.meetingId) return;
    
    setDeleteLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/meetings/${deleteConfirm.meetingId}`);
      
      if (response.status === 200) {
        if (socket && typeof socket.emit === 'function') {
          socket.emit("meeting-deleted", {
            meetingId: deleteConfirm.meetingId,
            title: deleteConfirm.meetingTitle
          });
        }
        
        setMeetings(prevMeetings => 
          prevMeetings.filter(m => (m._id || m.id) !== deleteConfirm.meetingId)
        );
        toast.success("✅ Meeting deleted successfully!");
        setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" });
      }
    } catch (err) {
      console.error("Delete error:", err);
      
      if (err.response?.status === 404) {
        toast.warning(
          <div>
            <p>Endpoint not found. Would you like to:</p>
            <button 
              onClick={() => {
                testDeleteEndpoints(deleteConfirm.meetingId);
                setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" });
              }}
              className="toast-button"
            >
              Test All Endpoints
            </button>
            <button 
              onClick={() => {
                setMeetings(prevMeetings => 
                  prevMeetings.filter(m => (m._id || m.id) !== deleteConfirm.meetingId)
                );
                toast.info("Meeting removed from UI only");
                setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" });
              }}
              className="toast-button"
            >
              Remove from UI Only
            </button>
          </div>,
          { autoClose: false }
        );
      } else {
        toast.error(err.response?.data?.message || "❌ Failed to delete meeting");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // 🟢 Format date and time
  const formatDateTime = (date, time) => {
    if (!date) return { date: "N/A", time: "N/A", isPast: false, isToday: false };
    
    const meetingDate = new Date(date);
    const now = new Date();
    const isToday = meetingDate.toDateString() === now.toDateString();
    const isPast = meetingDate < now;
    const isTomorrow = meetingDate.getTime() - now.getTime() < 86400000 && meetingDate > now;

    return {
      date: isToday ? "Today" : isTomorrow ? "Tomorrow" : meetingDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) : "N/A",
      isPast,
      isToday,
      isTomorrow
    };
  };

  return (
    <div className="amp-container">
      {/* Socket Connection Status Indicator */}
      <div className="amp-socket-indicator" style={{
        position: 'fixed',
        top: '10px',
        right: '120px',
        background: isConnected ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {isConnected ? '🔌 Live' : '📡 Connecting...'}
      </div>

      {/* Company Code Indicator */}
      {companyCode && (
        <div className="amp-company-indicator" style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          Company: {companyCode}
        </div>
      )}

      {/* Debug Info Modal */}
      {debugInfo.show && (
        <div className="amp-modal-overlay" onClick={() => setDebugInfo({ show: false, message: "" })}>
          <div className="amp-modal amp-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="amp-modal-header">
              <div className="amp-modal-title-wrapper">
                <span className="amp-modal-icon">🔍</span>
                <h3 className="amp-modal-title">API Debug Information</h3>
              </div>
              <button 
                onClick={() => setDebugInfo({ show: false, message: "" })}
                className="amp-modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="amp-modal-content">
              <pre style={{ 
                background: '#1e1e2e', 
                color: '#fff', 
                padding: '20px', 
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '400px',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {debugInfo.message}
              </pre>
            </div>

            <div className="amp-modal-footer">
              <button 
                onClick={() => setDebugInfo({ show: false, message: "" })}
                className="amp-btn amp-btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Gradient */}
      <div className="amp-header">
        <div className="amp-header-content">
          <div className="amp-header-left">
            <div className="amp-header-icon">📅</div>
            <div>
              <h1 className="amp-header-title">Meeting Management</h1>
              <p className="amp-header-subtitle">Create and manage team meetings efficiently</p>
              {companyCode && (
                <p className="amp-company-badge" style={{
                  marginTop: '4px',
                  fontSize: '14px',
                  color: '#667eea',
                  fontWeight: '500'
                }}>
                  Company: {companyCode}
                </p>
              )}
            </div>
          </div>
          <div className="amp-stats">
            <div className="amp-stat-item">
              <span className="amp-stat-value">{meetings.length}</span>
              <span className="amp-stat-label">Total Meetings</span>
            </div>
            <div className="amp-stat-item">
              <span className="amp-stat-value">{users.length}</span>
              <span className="amp-stat-label">Team Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="amp-tabs-container">
        <div className="amp-tabs">
          <button 
            className={`amp-tab ${activeTab === "create" ? "amp-tab-active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <span className="amp-tab-icon">➕</span>
            <span>Create Meeting</span>
          </button>
          <button 
            className={`amp-tab ${activeTab === "manage" ? "amp-tab-active" : ""}`}
            onClick={() => setActiveTab("manage")}
          >
            <span className="amp-tab-icon">📋</span>
            <span>Manage Meetings</span>
            {meetings.length > 0 && (
              <span className="amp-tab-badge">{meetings.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Create Meeting Form */}
      {activeTab === "create" && (
        <div className="amp-create-section">
          <div className="amp-form-card">
            <div className="amp-form-header">
              <div className="amp-form-title-wrapper">
                <div className="amp-form-icon">📅</div>
                <h2 className="amp-form-title">Create New Meeting</h2>
              </div>
              <p className="amp-form-subtitle">Fill in the details to schedule a meeting</p>
            </div>

            <form onSubmit={createMeeting} className="amp-form">
              <div className="amp-form-grid">
                {/* Left Column */}
                <div className="amp-form-left">
                  <div className="amp-form-group">
                    <label className="amp-label amp-required">Meeting Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g., Weekly Team Sync"
                      value={form.title}
                      onChange={handleChange}
                      className="amp-input"
                      required
                    />
                  </div>

                  <div className="amp-form-group">
                    <label className="amp-label">Description</label>
                    <textarea
                      name="description"
                      placeholder="Meeting agenda, goals, etc..."
                      value={form.description}
                      onChange={handleChange}
                      className="amp-textarea"
                      rows="4"
                    />
                  </div>

                  <div className="amp-form-row">
                    <div className="amp-form-group">
                      <label className="amp-label amp-required">Date</label>
                      <div className="amp-input-icon-wrapper">
                        <span className="amp-input-icon">📅</span>
                        <input
                          type="date"
                          name="date"
                          value={form.date}
                          onChange={handleChange}
                          className="amp-input amp-input-with-icon"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>

                    <div className="amp-form-group">
                      <label className="amp-label amp-required">Time</label>
                      <div className="amp-input-icon-wrapper">
                        <span className="amp-input-icon">⏰</span>
                        <input
                          type="time"
                          name="time"
                          value={form.time}
                          onChange={handleChange}
                          className="amp-input amp-input-with-icon"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="amp-form-group">
                    <label className="amp-label">Recurrence</label>
                    <div className="amp-select-wrapper">
                      <select
                        name="recurring"
                        value={form.recurring}
                        onChange={handleChange}
                        className="amp-select"
                      >
                        <option value="No">No Recurrence</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column - Attendees */}
                <div className="amp-form-right">
                  <div className="amp-attendees-header">
                    <div className="amp-attendees-title-wrapper">
                      <label className="amp-label amp-required">Select Attendees</label>
                      <span className="amp-attendees-count">
                        {form.attendees.length} / {users.length} selected
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={selectAllAttendees}
                      className="amp-select-all-btn"
                      disabled={!users.length}
                    >
                      {form.attendees.length === users.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="amp-attendees-grid-container">
                    {users.length > 0 ? (
                      <div className="amp-attendees-grid">
                        {users.map((u) => {
                          const userId = getUserId(u);
                          const isSelected = form.attendees.includes(userId);
                          return (
                            <label 
                              key={userId} 
                              className={`amp-attendee-card ${isSelected ? 'amp-attendee-selected' : ''}`}
                            >
                              <input
                                type="checkbox"
                                onChange={() => handleAttendeeChange(userId)}
                                checked={isSelected}
                                className="amp-attendee-checkbox"
                              />
                              <div className="amp-attendee-avatar">
                                {u.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="amp-attendee-info">
                                <span className="amp-attendee-name">{u.name || "Unknown User"}</span>
                                <span className="amp-attendee-email">{u.email || "No email"}</span>
                              </div>
                              {isSelected && (
                                <span className="amp-attendee-check">✓</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="amp-no-users">
                        <div className="amp-no-users-icon">👥</div>
                        <p>No users available</p>
                        <span>Please check your connection</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="amp-form-actions">
                <button 
                  type="button"
                  className="amp-btn amp-btn-secondary"
                  onClick={() => {
                    setForm({
                      title: "",
                      description: "",
                      date: "",
                      time: "",
                      recurring: "No",
                      attendees: [],
                    });
                  }}
                >
                  Clear Form
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !users.length} 
                  className="amp-btn amp-btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="amp-spinner"></span>
                      Creating Meeting...
                    </>
                  ) : (
                    <>
                      <span>📅</span>
                      Create Meeting
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Meetings */}
      {activeTab === "manage" && (
        <div className="amp-manage-section">
          <div className="amp-manage-header">
            <div className="amp-manage-title-wrapper">
              <h2 className="amp-manage-title">All Meetings</h2>
              <p className="amp-manage-subtitle">
                {meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'} scheduled for {companyCode}
              </p>
            </div>
            <div className="amp-manage-actions">
              <button 
                onClick={fetchMeetings} 
                disabled={refreshing}
                className="amp-refresh-btn"
              >
                <span className={`amp-refresh-icon ${refreshing ? 'amp-spin' : ''}`}>🔄</span>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {!meetings.length ? (
            <div className="amp-empty-state">
              <div className="amp-empty-icon">📅</div>
              <h3 className="amp-empty-title">No Meetings Yet</h3>
              <p className="amp-empty-text">Get started by creating your first meeting for {companyCode}</p>
              <button 
                onClick={() => setActiveTab("create")}
                className="amp-btn amp-btn-primary amp-empty-btn"
              >
                <span>➕</span>
                Create Meeting
              </button>
            </div>
          ) : (
            <div className="amp-meetings-grid">
              {meetings.map((meeting) => {
                const datetime = formatDateTime(meeting.date, meeting.time);
                const attendeeCount = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
                const meetingId = meeting._id || meeting.id;
                
                return (
                  <div key={meetingId} className="amp-meeting-card">
                    <div className="amp-meeting-status-bar" data-status={
                      datetime.isPast ? 'past' : datetime.isToday ? 'today' : 'upcoming'
                    } />
                    
                    <div className="amp-meeting-content">
                      <div className="amp-meeting-header">
                        <div className="amp-meeting-title-wrapper">
                          <span className="amp-meeting-icon">📅</span>
                          <h3 className="amp-meeting-title">{meeting.title || "Untitled Meeting"}</h3>
                        </div>
                        <div className="amp-meeting-badges">
                          {meeting.recurring && meeting.recurring !== "No" && (
                            <span className="amp-badge amp-badge-recurring">
                              🔁 {meeting.recurring}
                            </span>
                          )}
                          <span className={`amp-badge amp-badge-status ${
                            datetime.isPast ? 'amp-badge-past' : 
                            datetime.isToday ? 'amp-badge-today' : 'amp-badge-upcoming'
                          }`}>
                            {datetime.isPast ? 'Past' : datetime.isToday ? 'Today' : 'Upcoming'}
                          </span>
                          <span className="amp-badge amp-badge-company" style={{
                            background: '#f3f4f6',
                            color: '#4b5563',
                            fontSize: '11px'
                          }}>
                            {meeting.companyCode || meeting.company || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="amp-meeting-description">{meeting.description}</p>
                      )}

                      <div className="amp-meeting-details">
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">📆</span>
                          <span className={`amp-detail-text ${
                            datetime.isPast ? 'amp-text-past' : 
                            datetime.isToday ? 'amp-text-today' : ''
                          }`}>
                            {datetime.date}
                          </span>
                        </div>
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">⏰</span>
                          <span className="amp-detail-text">{datetime.time}</span>
                        </div>
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">👥</span>
                          <span className="amp-detail-text">{attendeeCount} attendees</span>
                        </div>
                      </div>

                      <div className="amp-meeting-footer">
                        <div className="amp-creator-info">
                          <span className="amp-creator-avatar">
                            {meeting.createdBy?.name?.charAt(0) || 'A'}
                          </span>
                          <span className="amp-creator-name">
                            {meeting.createdBy?.name || 'Admin'}
                          </span>
                        </div>
                        
                        <div className="amp-meeting-actions">
                          <button 
                            onClick={() => showStatus(meetingId, meeting.title)}
                            className="amp-action-btn amp-action-view"
                            title="View Attendance"
                          >
                            👁️
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm({
                              open: true,
                              meetingId: meetingId,
                              meetingTitle: meeting.title
                            })}
                            className="amp-action-btn amp-action-delete"
                            title="Delete Meeting"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Status Modal */}
      {statusModal.open && (
        <div className="amp-modal-overlay" onClick={() => setStatusModal({ open: false, data: [], meetingTitle: "" })}>
          <div className="amp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="amp-modal-header">
              <div className="amp-modal-title-wrapper">
                <span className="amp-modal-icon">📋</span>
                <h3 className="amp-modal-title">Attendance Status</h3>
              </div>
              <button 
                onClick={() => setStatusModal({ open: false, data: [], meetingTitle: "" })}
                className="amp-modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="amp-modal-subheader">
              <span className="amp-meeting-badge">{statusModal.meetingTitle}</span>
              <span className="amp-attendee-total">
                {statusModal.data.length} {statusModal.data.length === 1 ? 'attendee' : 'attendees'}
              </span>
            </div>

            <div className="amp-modal-content">
              {statusModal.data.length > 0 ? (
                <div className="amp-status-list">
                  <div className="amp-status-header">
                    <span>Attendee</span>
                    <span>Status</span>
                  </div>
                  {statusModal.data.map((item, index) => (
                    <div key={index} className="amp-status-item">
                      <div className="amp-status-user">
                        <div className="amp-status-avatar">
                          {item.userId?.name?.charAt(0) || item.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="amp-status-user-info">
                          <span className="amp-status-user-name">
                            {item.userId?.name || item.user?.name || "Unknown User"}
                          </span>
                          <span className="amp-status-user-email">
                            {item.userId?.email || item.user?.email || "No email"}
                          </span>
                        </div>
                      </div>
                      <div className={`amp-status-badge ${item.viewed ? 'amp-status-seen' : 'amp-status-pending'}`}>
                        {item.viewed ? (
                          <>
                            <span>✅</span>
                            <span>Seen</span>
                          </>
                        ) : (
                          <>
                            <span>⏳</span>
                            <span>Not Seen</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="amp-no-status">
                  <div className="amp-no-status-icon">📭</div>
                  <p>No attendance data available</p>
                  <span>No one has viewed this meeting yet</span>
                </div>
              )}
            </div>

            <div className="amp-modal-footer">
              <button 
                onClick={() => setStatusModal({ open: false, data: [], meetingTitle: "" })}
                className="amp-btn amp-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="amp-modal-overlay" onClick={() => setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" })}>
          <div className="amp-modal amp-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="amp-modal-header amp-modal-header-danger">
              <div className="amp-modal-title-wrapper">
                <span className="amp-modal-icon">⚠️</span>
                <h3 className="amp-modal-title">Delete Meeting</h3>
              </div>
              <button 
                onClick={() => setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" })}
                className="amp-modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="amp-modal-content amp-modal-content-center">
              <div className="amp-delete-icon">🗑️</div>
              <p className="amp-delete-text">
                Are you sure you want to delete <strong>"{deleteConfirm.meetingTitle}"</strong>?
              </p>
              <p className="amp-delete-subtext">
                Meeting ID: <code style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>{deleteConfirm.meetingId}</code>
              </p>
              <p className="amp-delete-subtext">
                This action cannot be undone. All meeting data will be permanently removed.
              </p>
            </div>

            <div className="amp-modal-footer amp-modal-footer-center">
              <button 
                onClick={() => setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" })}
                className="amp-btn amp-btn-secondary"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={deleteMeeting}
                className="amp-btn amp-btn-danger"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <span className="amp-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Meeting'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}