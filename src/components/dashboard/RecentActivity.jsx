import React from 'react';
import { FiRefreshCw, FiClock, FiBriefcase, FiUser, FiCheckCircle, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { MdOutlineWatchLater, MdCelebration, MdAccessTime } from 'react-icons/md';

const ActivityLoader = () => (
  <div className="activity-loader-container">
    <div className="activity-loader-wrapper">
      <div className="activity-spinner"></div>
      <div className="activity-loader-text">
        <span className="loader-main-text">Fetching attendance records...</span>
        <span className="loader-sub-text">Please wait while we load your data</span>
      </div>
    </div>
  </div>
);

const RefreshOverlay = () => (
  <div className="activity-refresh-overlay">
    <div className="refresh-spinner-small"></div>
    <span>Updating...</span>
  </div>
);

const RecentActivity = ({
  loading,
  recentActivity,
  handleRefresh,
  getStatusColor,
  userJoinDate,
  formattedJoinDate,
  currentMonth,
  currentYear
}) => {
  return (
    <div className="dashboard-activity-card" style={{ flex: 1, minWidth: '320px' }}>
      <div className="activity-header">
        <div className="activity-title-section">
          <div className="activity-icon-container"><MdOutlineWatchLater className="activity-icon" /></div>
          <div>
            <h2 className="activity-title">Recent Activity</h2>
            <p className="activity-subtitle">Latest attendance & holidays</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={loading.attendance} className="activity-refresh-btn">
          <FiRefreshCw className={`refresh-icon ${loading.attendance ? 'spinning' : ''}`} />
        </button>
      </div>

      <div className="activity-list">
        {loading.attendance && recentActivity.length > 0 && <RefreshOverlay />}
        {loading.attendance && !recentActivity.length && <ActivityLoader />}

        {!loading.attendance && recentActivity.slice(0, 5).map((item, index) => {
          if (item.type === 'holiday') {
            const date = new Date(item.date);
            return (
              <div key={`holiday-${index}`} className="activity-item holiday-item">
                <div className="activity-item-content">
                  <div className="activity-status-icon status-holiday">
                    <MdCelebration className="status-icon" />
                  </div>
                  <div className="activity-details">
                    <div className="activity-date">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      <span className="holiday-badge">🎉 Holiday</span>
                    </div>
                    <div className="activity-title">{item.title}</div>
                  </div>
                </div>
                <div className="activity-status status-holiday">HOLIDAY</div>
              </div>
            );
          }

          if (item.type === 'task') {
            const date = new Date(item.date || Date.now());
            return (
              <div key={`task-${index}`} className="activity-item">
                <div className="activity-item-content">
                  <div className="activity-status-icon status-default">
                    <FiBriefcase className="status-icon" />
                  </div>
                  <div className="activity-details">
                    <div className="activity-date">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      <span className="current-month-badge">Task</span>
                    </div>
                    <div className="activity-title">{item.title}</div>
                    {item.assignedTo && (
                      <div className="activity-time">
                        <FiUser size={12} /> {item.assignedTo}
                      </div>
                    )}
                  </div>
                </div>
                <div className="activity-status status-default">{item.status || 'pending'}</div>
              </div>
            );
          }
          
          const date = new Date(item.date);
          const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          return (
            <div key={index} className="activity-item">
              <div className="activity-item-content">
                <div className={`activity-status-icon ${getStatusColor(item.status)}`}>
                  {item.status === 'PRESENT' && <FiCheckCircle className="status-icon" />}
                  {item.status === 'LATE' && <FiAlertTriangle className="status-icon" />}
                  {item.status === 'HALF DAY' && <FiAlertCircle className="status-icon" />}
                  {item.status === 'ABSENT' && <FiAlertCircle className="status-icon" />}
                  {item.status === 'SHORT LEAVE' && <FiAlertCircle className="status-icon" />}
                  {!['PRESENT', 'LATE', 'HALF DAY', 'ABSENT', 'SHORT LEAVE'].includes(item.status) && <FiClock className="status-icon" />}
                </div>
                <div className="activity-details">
                  <div className="activity-date">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {isCurrentMonth && <span className="current-month-badge">Current Month</span>}
                  </div>
                  <div className="activity-time">
                    <MdAccessTime size={12} /> {item.totalTime || '--:--:--'}
                  </div>
                </div>
              </div>
              <div className={`activity-status ${getStatusColor(item.status)}`}>{item.status}</div>
            </div>
          );
        })}

        {!loading.attendance && !recentActivity.length && (
          <div className="activity-empty-state">
            <div className="empty-icon-container"><FiClock className="empty-icon" /></div>
            <p className="empty-title">No activity found</p>
            <p className="empty-subtitle">
              {userJoinDate ? `You joined on ${formattedJoinDate}. Records will appear after this date.` : 'Your activity will appear here'}
            </p>
          </div>
        )}
      </div>          
    </div>
  );
};

export default RecentActivity;
