import React from 'react';
import { FiTrendingUp, FiAlertTriangle, FiActivity, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import { MdWork, MdOutlineAlarm, MdOutlineCrop54, MdBeachAccess } from 'react-icons/md';

const StatsLoader = () => (
  <div className="stats-loader-container">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="stat-skeleton-card">
        <div className="stat-skeleton-header">
          <div className="skeleton-icon-large"></div>
          <div className="skeleton-badge"></div>
        </div>
        <div className="skeleton-value"></div>
        <div className="skeleton-label"></div>
        <div className="skeleton-footer"></div>
      </div>
    ))}
  </div>
);

const StatsCards = ({ loading, monthlyStats, currentMonth, monthNames }) => {
  if (loading.attendance) {
    return <StatsLoader />;
  }

  return (
    <div className="dashboard-stats-grid" style={{ width: '100%' }}>
      <div className="dashboard-stat-card stat-card-present">
        <div className="stat-card-header">
          <div className="stat-icon-container icon-present"><MdWork className="stat-icon" /></div>
          <div className="stat-current-month">Current Month</div>
        </div>
        <div className="stat-value">{monthlyStats.presentDays}</div>
        <div className="stat-label">Days Present</div>
        <div className="stat-footer">
          <FiTrendingUp className="stat-trend-icon" />
          <span className="stat-month-text">Tracked in {monthNames[currentMonth]}</span>
        </div>
      </div>

      <div className="dashboard-stat-card stat-card-late">
        <div className="stat-card-header">
          <div className="stat-icon-container icon-late"><MdOutlineAlarm className="stat-icon" /></div>
          <div className="stat-current-month">Current Month</div>
        </div>
        <div className="stat-value">{monthlyStats.lateDays}</div>
        <div className="stat-label">Late Days</div>
        <div className="stat-footer">
          <FiAlertTriangle className="stat-trend-icon" />
          <span className="stat-month-text">Tracked in {monthNames[currentMonth]}</span>
        </div>
      </div>

      <div className="dashboard-stat-card stat-card-halfday">
        <div className="stat-card-header">
          <div className="stat-icon-container icon-halfday"><MdOutlineCrop54 className="stat-icon" /></div>
          <div className="stat-current-month">Current Month</div>
        </div>
        <div className="stat-value">{monthlyStats.halfDays}</div>
        <div className="stat-label">Half Days</div>
        <div className="stat-footer">
          <FiActivity className="stat-trend-icon" />
          <span className="stat-month-text">Tracked in {monthNames[currentMonth]}</span>
        </div>
      </div>

      <div className="dashboard-stat-card stat-card-leave">
        <div className="stat-card-header">
          <div className="stat-icon-container icon-leave"><MdBeachAccess className="stat-icon" /></div>
          <div className="stat-current-month">Current Month</div>
        </div>
        <div className="stat-value">{monthlyStats.leavesTaken}</div>
        <div className="stat-label">Leaves Taken</div>
        <div className="stat-footer">
          <FiCheckCircle className="stat-trend-icon" />
          <span className="stat-month-text">Approved in {monthNames[currentMonth]}</span>
        </div>
      </div>

      <div className="dashboard-stat-card stat-card-absent">
        <div className="stat-card-header">
          <div className="stat-icon-container icon-absent"><FiX className="stat-icon" /></div>
          <div className="stat-current-month">Current Month</div>
        </div>
        <div className="stat-value">{monthlyStats.absentDays}</div>
        <div className="stat-label">Absent Days</div>
        <div className="stat-footer">
          <FiAlertCircle className="stat-trend-icon" />
          <span className="stat-month-text">Tracked in {monthNames[currentMonth]}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
