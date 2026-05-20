    import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiCreditCard,
  FiFolder,
  FiLogOut,
  FiUser,
  FiBell,
  FiMenu,
  FiX
} from 'react-icons/fi';
import './ClientLayout.css';

const ClientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      path: '/client/dashboard',
      name: 'Dashboard',
      icon: <FiGrid size={20} />
    },
    {
      path: '/client/payment',
      name: 'Payment',
      icon: <FiCreditCard size={20} />
    },
    {
      path: '/client/services-tasks',
      name: 'Services & Tasks',
      icon: <FiFolder size={20} />
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('companyCode');
    localStorage.removeItem('companyIdentifier');
    localStorage.removeItem('company');
    navigate('/');
  };

  const getClientName = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.name || user.client || 'Client';
      }
    } catch (e) {
      return 'Client';
    }
    return 'Client';
  };

  const getCompanyCode = () => {
    return localStorage.getItem('companyCode') || localStorage.getItem('company') || 'Company';
  };

  return (
    <div className="ClientLayout-container">
      {/* Sidebar */}
      <div className={`ClientLayout-sidebar ${!sidebarOpen ? 'ClientLayout-sidebar--collapsed' : ''}`}>
        <div className="ClientLayout-logo">
          <div className="ClientLayout-logo-icon">C</div>
          {sidebarOpen && <h2>CIIS NETWORK</h2>}
        </div>

        <div className="ClientLayout-user-info">
          <div className="ClientLayout-user-avatar">
            <FiUser size={24} />
          </div>
          {sidebarOpen && (
            <div className="ClientLayout-user-details">
              <h4>{getClientName()}</h4>
              <p>{getCompanyCode()}</p>
            </div>
          )}
        </div>

        <nav className="ClientLayout-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`ClientLayout-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {sidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="ClientLayout-footer">
          <button className="ClientLayout-logout-btn" onClick={handleLogout}>
            <FiLogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ClientLayout-main">
        <div className="ClientLayout-header">
          <button 
            className="ClientLayout-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          
          <div className="ClientLayout-header-right">
            <button className="ClientLayout-notification-btn">
              <FiBell size={20} />
              <span className="ClientLayout-notification-badge">3</span>
            </button>
            <div className="ClientLayout-header-user">
              <span>{getClientName()}</span>
            </div>
          </div>
        </div>

        <div className="ClientLayout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ClientLayout;