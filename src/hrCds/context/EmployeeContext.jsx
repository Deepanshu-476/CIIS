import { accountStorage } from '../../utils/authSession';
import { createContext, useContext, useState, useEffect } from 'react';


export const AuthContext = createContext(null);


export const useAuth = () => {   
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('❌ useAuth must be used within an <AuthProvider>');
  }
  return context;
};   


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = accountStorage.getItem('user');
    const token = accountStorage.getItem('token');
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('⚠️ Failed to parse user from accountStorage:', error);
        accountStorage.removeItem('user');
        accountStorage.removeItem('token');
      }
    }
  }, []);
  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
 