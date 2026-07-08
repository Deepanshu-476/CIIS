import React from 'react';
import { FiBriefcase, FiUser } from 'react-icons/fi';
import { MdToday } from 'react-icons/md';

const WelcomeHeader = ({ user, companyDetails, userJobRoleDisplay, currentDate }) => {
  return (
    <div className="dashboard-header-content" style={{ width: '100%' }}>
      <div className="dashboard-user-details">
        <h1 className="dashboard-user-name">Welcome back, {user?.name || 'User'}</h1>
        <p className="dashboard-user-welcome">
          {new Date().getHours() < 12 ? "Good morning! Let's make today count." :
           new Date().getHours() < 18 ? "Good afternoon! Stay focused and productive." :
           "Good evening! Wrapping up strong."}
        </p>
        <div className="dashboard-user-tags">
          <span className="dashboard-tag dashboard-tag-role">
            <FiBriefcase size={14} /> {userJobRoleDisplay}
          </span>
          <span className="dashboard-tag dashboard-tag-type">
            <FiUser size={14} /> {user?.employeeType || 'Full-time'}
          </span>
          <span className="dashboard-tag dashboard-tag-company">
            <FiBriefcase size={14} /> {companyDetails?.companyName || 'Company'}
          </span>
        </div>
        <div className="dashboard-date-info">
          <MdToday size={14} />
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
