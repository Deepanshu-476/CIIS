import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clearAllCaches } from '../utils/axiosConfig';


export const AuthContext = createContext(null);
const AUTH_SYNC_EVENT = 'ciis-auth-changed';
const AUTH_STORAGE_KEYS = [
  'token',
  'user',
  'superAdmin',
  'company',
  'companyDetails',
  'companyCode',
  'companyIdentifier',
  'client',
  'clientPortalSelectedClientId',
  'unreadCount',
  'ciis-task-management-cache-v1',
];
const APP_CACHE_PREFIXES = [
  'ciis-task-management-cache:',
  'ciis-api-cache:',
  'ciis-sidebar-badges-cache:',
  'ciis-sidebar-badges-seen:',
  'ciis_user_avatar:',
  'ciis-call-history-',
  'unread-count-cache:',
];

const clearStorageKeys = storage => {
  if (!storage) return;

  AUTH_STORAGE_KEYS.forEach(key => storage.removeItem(key));
  Object.keys(storage).forEach(key => {
    if (APP_CACHE_PREFIXES.some(prefix => key.startsWith(prefix))) {
      storage.removeItem(key);
    }
  });
};

const readStoredAuth = () => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (!storedToken || !storedUser) {
    return { user: null, token: null, isAuthenticated: false };
  }

  try {
    return {
      user: JSON.parse(storedUser),
      token: storedToken,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('⚠️ Failed to parse user from localStorage:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return { user: null, token: null, isAuthenticated: false };
  }
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('❌ useAuth must be used within an <AuthProvider>');
  }
  return context;
};


export const AuthProvider = ({ children }) => {
  const initialAuth = readStoredAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.isAuthenticated);

  const syncAuthState = useCallback(() => {
    const nextAuth = readStoredAuth();

    setUser(prev => (JSON.stringify(prev) === JSON.stringify(nextAuth.user) ? prev : nextAuth.user));
    setToken(prev => (prev === nextAuth.token ? prev : nextAuth.token));
    setIsAuthenticated(prev => (prev === nextAuth.isAuthenticated ? prev : nextAuth.isAuthenticated));
  }, []);

  useEffect(() => {
    syncAuthState();

    const handleAuthChange = () => syncAuthState();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener(AUTH_SYNC_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener(AUTH_SYNC_EVENT, handleAuthChange);
    };
  }, [syncAuthState]);

  const logout = useCallback(() => {
    clearStorageKeys(localStorage);
    clearStorageKeys(sessionStorage);
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    clearAllCaches();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_SYNC_EVENT));
    }
  }, []);

  
  
  
  
  
  
  
  
  

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, isAuthenticated, setIsAuthenticated, logout, syncAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};
