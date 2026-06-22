import { createContext, useContext, useState, useEffect } from 'react';

// 1. Create context with null default
export const AuthContext = createContext(null);

// 2. Safe custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('❌ useAuth must be used within an <AuthProvider>');
  }
  return context;
};

// 3. Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('⚠️ Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // useEffect(() => {
  //   if (user) {
  //     localStorage.setItem('user', JSON.stringify(user));
  //   } else {
  //     localStorage.removeItem('user');
  //     localStorage.removeItem('token');
  //     setIsAuthenticated(false);
  //   }
  // }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
