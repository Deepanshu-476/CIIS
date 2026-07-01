import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedSuperAdminRoute = ({ children }) => {
  
  const superAdmin = JSON.parse(localStorage.getItem('superAdmin'));
  const token = localStorage.getItem('token');

  if (!superAdmin || !token) {
    
    return <Navigate to="/super-admin/login" replace />;
  }

  
  

  return children;
};

export default ProtectedSuperAdminRoute;