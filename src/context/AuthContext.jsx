import { createContext, useContext, useState, useEffect, useCallback } from 'react';


export const AuthContext = createContext(null);
const AUTH_SYNC_EVENT = 'ciis-auth-changed';

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

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
