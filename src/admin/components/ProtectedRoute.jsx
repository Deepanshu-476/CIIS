import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;


  const token = localStorage.getItem('token');
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

  if (isSuperAdminRoute) {
    let isSuperAdmin = false;
    try {
      const superAdminRaw = localStorage.getItem('superAdmin');
      if (superAdminRaw) {
        const parsed = JSON.parse(superAdminRaw);
        const account = parsed?.user || parsed;
        const role = String(account?.role || account?.jobRole || account?.companyRole || '').trim().toLowerCase();
        if (account?.isSuperAdmin === true || role === 'super_admin' || role === 'superadmin') {
          isSuperAdmin = true;
        }
      }
      if (!isSuperAdmin) {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          const account = parsed?.user || parsed;
          const role = String(account?.role || account?.jobRole || account?.companyRole || '').trim().toLowerCase();
          if (account?.isSuperAdmin === true || role === 'super_admin' || role === 'superadmin') {
            isSuperAdmin = true;
          }
        }
      }
    } catch {
      isSuperAdmin = false;
    }

    if (!isSuperAdmin) {
      // Non-superadmin user attempting to access /Ciis-network routes must be rejected and redirected away
      const isClient = Boolean(localStorage.getItem('client') || localStorage.getItem('authToken'));
      if (isClient) {
        return <Navigate to="/client/dashboard" replace />;
      }
      const companyCode = localStorage.getItem('companyCode') || localStorage.getItem('companyIdentifier');
      if (companyCode) {
        return <Navigate to="/ciisUser/user-dashboard" replace />;
      }
      return <Navigate to="/SuperAdminLogin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
