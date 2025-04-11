// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Invalid user data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to login with real API
      try {
        const response = await authAPI.login(email, password);
        const { token, user } = response.data;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
      } catch (apiError) {
        console.warn('Using demo login mode:', apiError);
        
        // Demo login logic for demo@example.com, admin@example.com, or manager@example.com
        if (email === 'demo@example.com' && password === 'demo123') {
          const demoUser = { 
            id: '1', 
            name: 'Demo User', 
            email: 'demo@example.com',
            role: 'admin'
          };
          
          // Format token properly for JWT verification
          const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6ImRlbW8iLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MTcwMDMxNjQsImV4cCI6MTYxNzA4OTU2NH0.QYnHJheJ8I6QI-z5PNNybjZTW0g9mZITFBUu5DJfDEQ';
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user', JSON.stringify(demoUser));
          setUser(demoUser);
        } 
        else if (email === 'admin@example.com' && password === 'admin123') {
          const adminUser = { 
            id: '2', 
            name: 'Admin User', 
            email: 'admin@example.com',
            role: 'admin'
          };
          
          // Format token properly for JWT verification
          const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYxNzAwMzE2NCwiZXhwIjoxNjE3MDg5NTY0fQ.2vTUUq4LrF4iqSNnT0CmuKYRU6cJxcZUOXp-BfL5FXA';
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user', JSON.stringify(adminUser));
          setUser(adminUser);
        }
        else if (email === 'manager@example.com' && password === 'manager123') {
          const managerUser = { 
            id: '3', 
            name: 'Manager User', 
            email: 'manager@example.com',
            role: 'manager'
          };
          
          // Format token properly for JWT verification
          const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMiLCJ1c2VybmFtZSI6Im1hbmFnZXIiLCJlbWFpbCI6Im1hbmFnZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoibWFuYWdlciIsImlhdCI6MTYxNzAwMzE2NCwiZXhwIjoxNjE3MDg5NTY0fQ.ICbxv2nh9-gQdxLXqgQYQPGO_yGQXq-9QTvL-BU9kXM';
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user', JSON.stringify(managerUser));
          setUser(managerUser);
        }
        else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (error) {
      setError('Invalid email or password. Try demo@example.com / demo123');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 