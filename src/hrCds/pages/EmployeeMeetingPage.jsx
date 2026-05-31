import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig";
import API_URL from "../../config";
import { toast } from "react-toastify";
import '../Css/EmployeeMeetingPage.css';

export default function EmployeeMeetingPage() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  // Load user data safely from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const id = storedUser?._id || storedUser?.id || localStorage.getItem("userId");
    const name = storedUser?.name || "Employee";
    
    if (!id) {
      toast.error("No user found. Please log in again.");
      return;
    }
    setUserId(id);
    setUserName(name);
  }, []);

  // Fetch employee's meetings
  const fetchMeetings = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/meetings/user/${id}`);
      if (Array.isArray(res.data)) {
        setMeetings(res.data);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      console.error("Error fetching meetings:", err);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refetch when userId available
  useEffect(() => {
    if (userId) fetchMeetings(userId);
  }, [userId]);

  // Mark as Seen
  const markSeen = async (meetingId) => {
    if (!userId) return;
    try {
      await axios.post(`${API_URL}/meetings/mark-viewed`, {
        meetingId,
        userId,
      });
      toast.success("Marked as seen!");
      fetchMeetings(userId);
    } catch (err) {
      console.error("Mark Seen error:", err);
      toast.error("Failed to update status");
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    if (!userId) return;
    setRefreshing(true);
    fetchMeetings(userId);
  };

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    const now = new Date();
    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
    
    switch (filter) {
      case "upcoming":
        return meetingDate >= now;
      case "past":
        return meetingDate < now;
      case "unseen":
        return !meeting.viewed;
      default:
        return true;
    }
  });

  // Get meeting status
  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
    
    if (meetingDate < now) {
      return { type: "past", text: "Completed", color: "#6b7280" };
    } else if (meetingDate.toDateString() === now.toDateString()) {
      return { type: "today", text: "Today", color: "#10b981" };
    } else {
      return { type: "upcoming", text: "Upcoming", color: "#3b82f6" };
    }
  };

  // Format time
  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Stats calculations
  const totalMeetings = meetings.length;
  const unseenCount = meetings.filter(m => !m.viewed).length;
  const upcomingCount = meetings.filter(m => {
    const meetingDate = new Date(`${m.date}T${m.time}`);
    return meetingDate >= new Date();
  }).length;
  const todayCount = meetings.filter(m => {
    const meetingDate = new Date(`${m.date}T${m.time}`);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  }).length;

  // Loading State
  if (loading) {
    return (
      <div className="emp-meeting-loading-container">
        <div className="emp-meeting-spinner"></div>
        <p className="emp-meeting-loading-text">Loading your meetings...</p>
      </div>
    );
  }

  return (
    <div className="emp-meeting-container">
      {/* Header Section with Gradient */}
      <div className="emp-meeting-header">
        <div className="emp-meeting-header-content">
          <div className="emp-meeting-header-left">
            <div className="emp-meeting-header-icon">📅</div>
            <div>
              <h1 className="emp-meeting-header-title">My Meetings</h1>
              <p className="emp-meeting-header-subtitle">
                Hello, {userName}! Here are your scheduled meetings
              </p>
            </div>
          </div>
          <div className="emp-meeting-header-stats">
            <div className="emp-meeting-header-stat-card">
              <span className="emp-meeting-header-stat-number">{totalMeetings}</span>
              <span className="emp-meeting-header-stat-label">Total</span>
            </div>
            <div className="emp-meeting-header-stat-card">
              <span className="emp-meeting-header-stat-number">{unseenCount}</span>
              <span className="emp-meeting-header-stat-label">Unseen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="emp-meeting-stats-grid">
        <div className="emp-meeting-stat-card">
          <div className="emp-meeting-stat-card-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="emp-meeting-stat-card-content">
            <span className="emp-meeting-stat-card-number">{totalMeetings}</span>
            <span className="emp-meeting-stat-card-label">Total Meetings</span>
          </div>
        </div>

        <div className="emp-meeting-stat-card">
          <div className="emp-meeting-stat-card-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="emp-meeting-stat-card-content">
            <span className="emp-meeting-stat-card-number">{todayCount}</span>
            <span className="emp-meeting-stat-card-label">Today's Meetings</span>
          </div>
        </div>

        <div className="emp-meeting-stat-card">
          <div className="emp-meeting-stat-card-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="emp-meeting-stat-card-content">
            <span className="emp-meeting-stat-card-number">{upcomingCount}</span>
            <span className="emp-meeting-stat-card-label">Upcoming</span>
          </div>
        </div>

        <div className="emp-meeting-stat-card">
          <div className="emp-meeting-stat-card-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="emp-meeting-stat-card-content">
            <span className="emp-meeting-stat-card-number">{unseenCount}</span>
            <span className="emp-meeting-stat-card-label">Unseen</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="emp-meeting-controls">
        <div className="emp-meeting-filter-tabs">
          <button
            className={`emp-meeting-filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Meetings
          </button>
          <button
            className={`emp-meeting-filter-tab ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`emp-meeting-filter-tab ${filter === "past" ? "active" : ""}`}
            onClick={() => setFilter("past")}
          >
            Past
          </button>
          <button
            className={`emp-meeting-filter-tab ${filter === "unseen" ? "active" : ""}`}
            onClick={() => setFilter("unseen")}
          >
            Unseen
          </button>
        </div>

        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="emp-meeting-refresh-button"
        >
          {refreshing ? (
            <>
              <div className="emp-meeting-small-spinner"></div>
              Refreshing...
            </>
          ) : (
            "🔄 Refresh"
          )}
        </button>
      </div>

      {/* Meetings List */}
      <div className="emp-meeting-section">
        {filteredMeetings.length === 0 ? (
          <div className="emp-meeting-empty-state">
            <div className="emp-meeting-empty-icon">📅</div>
            <h3 className="emp-meeting-empty-title">
              {filter === "all" ? "No Meetings Scheduled" :
               filter === "upcoming" ? "No Upcoming Meetings" :
               filter === "past" ? "No Past Meetings" : "No Unseen Meetings"}
            </h3>
            <p className="emp-meeting-empty-text">
              {filter === "all" ? "You don't have any meetings scheduled yet." :
               filter === "unseen" ? "You've seen all your meetings! 🎉" :
               `No ${filter} meetings found.`}
            </p>
            {filter !== "all" && (
              <button 
                onClick={() => setFilter("all")}
                className="emp-meeting-view-all-button"
              >
                View All Meetings
              </button>
            )}
          </div>
        ) : (
          <div className="emp-meeting-grid">
            {filteredMeetings.map((meeting) => {
              const status = getMeetingStatus(meeting);
              const isToday = status.type === "today";
              const isUpcoming = status.type === "upcoming";
              const isPast = status.type === "past";
              
              return (
                <div key={meeting._id} className="emp-meeting-card">
                  <div className={`emp-meeting-card-border ${isToday ? "today" : isUpcoming ? "upcoming" : "past"}`}></div>
                  <div className="emp-meeting-card-content">
                    <div className="emp-meeting-card-header">
                      <div className="emp-meeting-title-section">
                        <h3 className="emp-meeting-title">{meeting.title}</h3>
                        <div className="emp-meeting-badges">
                          <span 
                            className="emp-meeting-status-badge"
                            style={{ backgroundColor: status.color }}
                          >
                            {status.text}
                          </span>
                          <span className={`emp-meeting-view-badge ${meeting.viewed ? "viewed" : "unseen"}`}>
                            {meeting.viewed ? "✓ Seen" : "👁 Unseen"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {meeting.description && (
                      <p className="emp-meeting-description">{meeting.description}</p>
                    )}

                    <div className="emp-meeting-details">
                      <div className="emp-meeting-detail-row">
                        <div className="emp-meeting-detail-item">
                          <span className="emp-meeting-detail-icon">📅</span>
                          <div>
                            <div className="emp-meeting-detail-label">Date</div>
                            <div className="emp-meeting-detail-value">
                              {formatDate(meeting.date)}
                            </div>
                          </div>
                        </div>
                        <div className="emp-meeting-detail-item">
                          <span className="emp-meeting-detail-icon">🕒</span>
                          <div>
                            <div className="emp-meeting-detail-label">Time</div>
                            <div className="emp-meeting-detail-value">
                              {formatTime(meeting.time)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {meeting.recurring && meeting.recurring !== "No" && (
                        <div className="emp-meeting-detail-item">
                          <span className="emp-meeting-detail-icon">🔄</span>
                          <div>
                            <div className="emp-meeting-detail-label">Recurrence</div>
                            <div className="emp-meeting-detail-value">{meeting.recurring}</div>
                          </div>
                        </div>
                      )}
                      
                      {meeting.link && (
                        <div className="emp-meeting-detail-item" style={{ marginTop: '10px' }}>
                          <span className="emp-meeting-detail-icon">🔗</span>
                          <div>
                            <div className="emp-meeting-detail-label">Meeting Link</div>
                            <div className="emp-meeting-detail-value">
                              <a href={meeting.link.startsWith('http') ? meeting.link : `https://${meeting.link}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '600' }}>
                                Join Meeting
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {!meeting.viewed && !isPast && (
                      <div className="emp-meeting-action-section">
                        <button 
                          onClick={() => markSeen(meeting._id)}
                          className="emp-meeting-mark-seen-button"
                        >
                          <span className="emp-meeting-button-icon">👁️</span>
                          Mark as Seen
                        </button>
                      </div>
                    )}

                    {/* Past Meeting Note */}
                    {isPast && !meeting.viewed && (
                      <div className="emp-meeting-past-note">
                        <span className="emp-meeting-past-icon">💡</span>
                        This meeting has passed but you haven't marked it as seen
                      </div>
                    )}

                    {/* Already Seen Note */}
                    {meeting.viewed && (
                      <div className="emp-meeting-seen-note">
                        <span className="emp-meeting-seen-icon">✓</span>
                        You've marked this meeting as seen
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="emp-meeting-footer">
        <div className="emp-meeting-footer-stats">
          <span className="emp-meeting-footer-stat">
            📊 Showing {filteredMeetings.length} of {meetings.length} meetings
          </span>
          <span className="emp-meeting-footer-stat">
            👁️ {unseenCount} unseen
          </span>
          <span className="emp-meeting-footer-stat">
            📅 {todayCount} today
          </span>
        </div>
      </div>
    </div>
  );
}