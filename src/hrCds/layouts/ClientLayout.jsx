    import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiCheckSquare,
  FiPackage,
  FiShoppingBag,
  FiLifeBuoy,
  FiCpu,
  FiFileText,
  FiCreditCard,
  FiBell,
  FiSettings,
  FiLogOut,
  FiUser,
  FiSearch,
  FiMenu,
  FiX
} from 'react-icons/fi';
import {
  CLIENT_PORTAL_SELECTED_CLIENT_KEY,
  useClientPortalData
} from '../utils/clientPortalData';
import './ClientLayout.css';

const ClientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const hideHeaderTools = location.pathname === '/client/support-tickets';
  const { client, availableClients, switchClient } = useClientPortalData();

  const menuItems = [
    { path: '/client/dashboard', name: 'Dashboard', icon: <FiGrid size={18} /> },
    { path: '/client/my-services', name: 'My Services', icon: <FiPackage size={18} /> },
    { path: '/client/tasks-updates', name: 'Tasks & Updates', icon: <FiCheckSquare size={18} /> },
    { path: '/client/marketplace', name: 'Service Marketplace', icon: <FiShoppingBag size={18} /> },
    { path: '/client/support-tickets', name: 'Support Tickets', icon: <FiLifeBuoy size={18} /> },
    { path: '/client/ai-assistant', name: 'AI Assistant', icon: <FiCpu size={18} /> },
    { path: '/client/documents', name: 'Documents', icon: <FiFileText size={18} /> },
    { path: '/client/payments', name: 'Payments & Invoices', icon: <FiCreditCard size={18} /> },
    { path: '/client/notifications', name: 'Notifications', icon: <FiBell size={18} /> },
    { path: '/client/settings', name: 'Account Settings', icon: <FiSettings size={18} /> }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('companyCode');
    localStorage.removeItem('companyIdentifier');
    localStorage.removeItem('company');
    localStorage.removeItem('client');
    localStorage.removeItem(CLIENT_PORTAL_SELECTED_CLIENT_KEY);
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
    return client?.company || localStorage.getItem('companyCode') || localStorage.getItem('company') || 'Company';
  };

  const handleCompanyChange = event => {
    const selected = availableClients.find(item => String(item._id) === event.target.value);
    if (selected) switchClient(selected);
  };

  return (
    <div className={`ClientLayout-container ${sidebarOpen ? 'ClientLayout-sidebar-open' : 'ClientLayout-sidebar-collapsed'}`}>
      <aside className={`ClientLayout-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="ClientLayout-sidebar-brand">
          <div className="ClientLayout-logo-icon">C</div>
          {sidebarOpen && (
            <div className="ClientLayout-brand-text">
              <h1>CIIS Network</h1>
              <span>Client Portal</span>
            </div>
          )}
        </div>

        <div className="ClientLayout-user-panel">
          <div className="ClientLayout-user-avatar">
            <FiUser size={24} />
          </div>
          {sidebarOpen && (
            <div className="ClientLayout-user-summary">
              <h3>{getClientName()}</h3>
              <p>{getCompanyCode()}</p>
            </div>
          )}
        </div>

        {sidebarOpen && availableClients.length > 1 && (
          <label className="ClientLayout-company-selector">
            <span>Company</span>
            <select value={client?._id || ''} onChange={handleCompanyChange}>
              {availableClients.map(item => (
                <option key={item._id} value={item._id}>
                  {item.company || item.client || 'Company'}
                </option>
              ))}
            </select>
          </label>
        )}

        <nav className="ClientLayout-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`ClientLayout-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="ClientLayout-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="ClientLayout-nav-label">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="ClientLayout-sidebar-footer">
          <button className="ClientLayout-sidebar-logout" onClick={handleLogout}>
            <FiLogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="ClientLayout-main">
        <header className={`ClientLayout-header ${hideHeaderTools ? 'ClientLayout-header--minimal' : ''}`}>
          <div className="ClientLayout-header-left">
            <button
              className="ClientLayout-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>

            {!hideHeaderTools && (
              <div className="ClientLayout-search-bar">
                <FiSearch size={18} className="ClientLayout-search-icon" />
                <input placeholder="Search services, tickets, invoices..." />
              </div>
            )}
          </div>

          {!hideHeaderTools && (
            <div className="ClientLayout-header-right">
              <button className="ClientLayout-quick-action">Request Service</button>
              {availableClients.length > 1 && (
                <label className="ClientLayout-header-company-select">
                  <span>Company</span>
                  <select value={client?._id || ''} onChange={handleCompanyChange}>
                    {availableClients.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.company || item.client || 'Company'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button className="ClientLayout-icon-button">
                <FiBell size={20} />
                <span>4</span>
              </button>
              <div className="ClientLayout-profile-chip">
                <FiUser size={18} />
                <div>
                  <span>{getClientName()}</span>
                  <small>Business Lead</small>
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="ClientLayout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
