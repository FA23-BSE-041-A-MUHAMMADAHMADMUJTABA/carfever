import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const d = localStorage.getItem('cf_currentUser');
      return d ? JSON.parse(d) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setUser(res.data);
      localStorage.setItem('cf_currentUser', JSON.stringify(res.data));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid credentials or server error'
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('cf_currentUser');
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password, role });
      // Auto login after registration
      setUser(res.data);
      localStorage.setItem('cf_currentUser', JSON.stringify(res.data));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Registration failed'
      };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
