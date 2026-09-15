import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import './index.css';
import './utils/axiosConfig'; 
import App from './App.jsx';


import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext.jsx';
import './App.css';

const RealtimePortalProviders = ({ children }) => {
  const { pathname } = useLocation();
  const normalizedPath = String(pathname || '').toLowerCase();
  const isAuthenticatedPortalRoute =
    normalizedPath === '/ciis-network' ||
    normalizedPath.startsWith('/ciis-network/') ||
    normalizedPath === '/ciisuser' ||
    normalizedPath.startsWith('/ciisuser/') ||
    normalizedPath === '/client' ||
    normalizedPath.startsWith('/client/');

  // Realtime sockets and employee/client notifications belong only to the
  // authenticated product areas. Keeping these providers unmounted on public
  // marketing/login/register routes prevents stale localStorage sessions from
  // showing private company notifications on the public website.
  if (!isAuthenticatedPortalRoute) {
    return children;
  }

  return (
    <SocketProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SocketProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <RealtimePortalProviders>
        <App />
      </RealtimePortalProviders>
    </AuthProvider>
  </BrowserRouter>
);  
