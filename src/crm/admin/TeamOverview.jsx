import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiChevronRight } from 'react-icons/fi';
import './TeamOverview.css';

export default function TeamOverview() {
  const navigate = useNavigate();

  return (
    <div className="to-root">
      {/* Page Header & Breadcrumb */}
      <div className="to-page-header">
        <h1 className="to-page-title">Team</h1>
        <div className="to-breadcrumb">
          <Link to="/ciisUser/crm/admin/dashboard">Dashboard</Link>
          <span className="separator">&gt;</span>
          <span className="active">Team</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="to-card">
        <div className="to-card-header">
          <h2 className="to-card-title">Team</h2>
          <p className="to-card-subtitle">
            The Team section provides an overview of all team members, their roles, and responsibilities within the organization. It helps administrators manage and analyze team performance.
          </p>
        </div>

        <div className="to-grid">
          {/* Users Card */}
          <div
            className="to-nav-card"
            onClick={() => navigate('/ciisUser/crm/admin/users')}
          >
            <div className="to-nav-icon-wrapper blue">
              <FiUsers className="to-nav-icon" />
            </div>
            <div className="to-nav-content">
              <h3 className="to-nav-title">Users</h3>
              <p className="to-nav-desc">
                Manage and view details of all users in the system.
              </p>
            </div>
            <div className="to-nav-arrow">
              <FiChevronRight />
            </div>
          </div>

          {/* User Type Card */}
          <div
            className="to-nav-card"
            onClick={() => navigate('/ciisUser/crm/admin/user-type')}
          >
            <div className="to-nav-icon-wrapper green">
              <FiUserCheck className="to-nav-icon" />
            </div>
            <div className="to-nav-content">
              <h3 className="to-nav-title">User Type</h3>
              <p className="to-nav-desc">
                Manage and view details of different user types and their permissions.
              </p>
            </div>
            <div className="to-nav-arrow">
              <FiChevronRight />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
