import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { accountStorage, AUTH_SYNC_EVENT, endTabSession } from '../utils/authSession';
import { getPagePermissionScope, normalizeUserId, preloadPagePermissions } from '../utils/pageAccess';


export const AuthContext = createContext(null);
const SENSITIVE_USER_PII_FIELDS = [
  'aadhaar',
  'aadhar',
  'aadharCard',
  'pan',
  'panCard',
  'accountNumber',
  'bankName',
  'ifsc',
  'bankHolderName',
  'salary',
  'dob',
  'fatherName',
  'motherName',
  'documents',
  'permanentAddress',
  'presentAddress',
];

export const sanitizeUserForStorage = (user) => {
  if (!user || typeof user !== 'object') return user;
  const sanitized = { ...user };
  SENSITIVE_USER_PII_FIELDS.forEach((field) => {
    delete sanitized[field];
  });
  if (sanitized.user && typeof sanitized.user === 'object') {
    sanitized.user = sanitizeUserForStorage(sanitized.user);
  }
  // Inline uploads can exceed the browser's entire storage quota. Keep URLs,
  // but leave embedded file contents in the API response only.
  const compact = (value) => {
    if (typeof value === 'string' && /^data:/i.test(value)) return '';
    if (Array.isArray(value)) return value.map(compact);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, compact(item)]));
    }
    return value;
  };
  return compact(sanitized);
};

const readStoredAuth = () => {
  const storedToken = accountStorage.getItem('token');
  const storedUser = accountStorage.getItem('user');

  if (!storedToken || !storedUser) {
    return { user: null, token: null, isAuthenticated: false };
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    const sanitizedUser = sanitizeUserForStorage(parsedUser);
    const sanitizedSerialized = JSON.stringify(sanitizedUser);
    if (sanitizedSerialized !== storedUser) {
      accountStorage.setItem('user', sanitizedSerialized);
    }
    return {
      user: sanitizedUser,
      token: storedToken,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('⚠️ Failed to parse user from accountStorage:', error);
    accountStorage.removeItem('user');
    accountStorage.removeItem('token');
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
  const userId = normalizeUserId(user?._id || user?.id);
  const companyId = normalizeUserId(user?.company || user?.companyId || user?.companyDetails);
  const isClient = String(user?.companyRole || user?.role || '').toLowerCase() === 'client';

  useEffect(() => {
    getPagePermissionScope();
    if (token && userId && companyId && !isClient) {
      void preloadPagePermissions().catch(() => undefined);
    }
  }, [token, userId, companyId, isClient]);

  const syncAuthState = useCallback(() => {
    const nextAuth = readStoredAuth();

    setUser(prev => (JSON.stringify(prev) === JSON.stringify(nextAuth.user) ? prev : nextAuth.user));
    setToken(prev => (prev === nextAuth.token ? prev : nextAuth.token));
    setIsAuthenticated(prev => (prev === nextAuth.isAuthenticated ? prev : nextAuth.isAuthenticated));
  }, []);

  useEffect(() => {
    syncAuthState();

    const handleAuthChange = () => syncAuthState();
    window.addEventListener(AUTH_SYNC_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_SYNC_EVENT, handleAuthChange);
    };
  }, [syncAuthState]);

  const logout = useCallback(() => {
    axiosInstance.post('/auth/logout', {}, { _skipErrorNotify: true }).catch(() => {});
    endTabSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, isAuthenticated, setIsAuthenticated, logout, syncAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};
