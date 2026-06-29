import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const path = location.pathname;

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

    // Clear any remaining auth items if validation failed
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
