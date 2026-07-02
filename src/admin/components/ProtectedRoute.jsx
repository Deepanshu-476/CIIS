import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const path = location.pathname;

  const isSuperAdminRoute = path.startsWith('/Ciis-network');
  if (!token) {
    const companyCode = localStorage.getItem('companyCode') || localStorage.getItem('companyIdentifier');

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
