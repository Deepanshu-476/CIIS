import { accountStorage } from '../../utils/authSession';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;


  const token = accountStorage.getItem('token');
  const isSuperAdminRoute = path.startsWith('/Ciis-network');

  if (!token) {
    const companyCode = accountStorage.getItem('companyCode') || accountStorage.getItem('companyIdentifier');

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
      const superAdminRaw = accountStorage.getItem('superAdmin');
      if (superAdminRaw) {
        const parsed = JSON.parse(superAdminRaw);
        const account = parsed?.user || parsed;
        const role = String(account?.role || account?.jobRole || account?.companyRole || '').trim().toLowerCase();
        if (account?.isSuperAdmin === true || role === 'super_admin' || role === 'superadmin') {
          isSuperAdmin = true;
        }
      }
      if (!isSuperAdmin) {
        const userRaw = accountStorage.getItem('user');
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
      const isClient = Boolean(accountStorage.getItem('client') || accountStorage.getItem('authToken'));
      if (isClient) {
        return <Navigate to="/client/dashboard" replace />;
      }
      const companyCode = accountStorage.getItem('companyCode') || accountStorage.getItem('companyIdentifier');
      if (companyCode) {
        return <Navigate to="/ciisUser/user-dashboard" replace />;
      }
      return <Navigate to="/SuperAdminLogin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
