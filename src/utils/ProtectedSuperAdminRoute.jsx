import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedSuperAdminRoute = ({ children }) => {
  let superAdmin = null;
  try {
    superAdmin = JSON.parse(localStorage.getItem('superAdmin') || 'null');
  } catch {
    superAdmin = null;
  }
  const token = localStorage.getItem('token');

  if (!superAdmin || !token) {
    return <Navigate to="/SuperAdminLogin" replace />;
  }

  const account = superAdmin.user || superAdmin;
  const email = String(account.email || superAdmin.email || '').trim().toLowerCase();
  const isGlobalSuperAdmin = email === 'ashutoshrai130@gmail.com';

  if (!isGlobalSuperAdmin) {
    return <Navigate to="/Ciis-network/company-details" replace />;
  }

  return children;
};

export default ProtectedSuperAdminRoute;
