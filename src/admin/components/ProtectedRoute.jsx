import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // Intercept query parameters for auto-authentication handoff
  const query = new URLSearchParams(location.search);
  const qToken = query.get('token');
  const qUser = query.get('user');
  const qClient = query.get('client');
  const qCompanyCode = query.get('companyCode') || query.get('companyIdentifier');

  if (qToken && qUser) {
    try {
      localStorage.setItem('token', qToken);
      localStorage.setItem('user', qUser);
      if (qClient) localStorage.setItem('client', qClient);
      if (qCompanyCode) {
        localStorage.setItem('companyCode', qCompanyCode);
        localStorage.setItem('companyIdentifier', qCompanyCode);
      }
    } catch (e) {
      console.error('Auto-login storage failed:', e);
    }
  }

  const token = localStorage.getItem('token');
  const isSuperAdminRoute = path.startsWith('/Ciis-network');
  const isUserRoute = path.startsWith('/ciisUser');
  const isClientRoute = path.startsWith('/client');

  let isValid = !!token;

  if (isValid) {
    if (isSuperAdminRoute) {
      isValid = !!localStorage.getItem('superAdmin');
    } else if (isUserRoute || isClientRoute) {
      isValid = !!localStorage.getItem('user');
    }
  }

  if (!isValid) {
    const companyCode = localStorage.getItem('companyCode') || localStorage.getItem('companyIdentifier');

    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('superAdmin');

    if (isSuperAdminRoute) {
      return <Navigate to="/SuperAdminLogin" replace />;
    } else if (companyCode) {
      return <Navigate to={`/company/${companyCode}/login`} replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
