import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export interface User {
  id: string;
  full_name: string;
  email: string;
  institution?: string;
  research_role?: string;
  workspace_count?: number;
  source_count?: number;
  claim_count?: number;
  synthesis_count?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { full_name: string; email: string; password: string; institution?: string; research_role?: string }) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('scholarmesh_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load session from server on startup
  useEffect(() => {
    async function loadSession() {
      const storedToken = localStorage.getItem('scholarmesh_token');
      if (storedToken) {
        try {
          const res = await axiosClient.get('/auth/me');
          if (res.data && res.data.user) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          localStorage.removeItem('scholarmesh_token');
          localStorage.removeItem('scholarmesh_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('scholarmesh_token', newToken);
      localStorage.setItem('scholarmesh_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { full_name: string; email: string; password: string; institution?: string; research_role?: string }) => {
    setIsLoading(true);
    try {
      const res = await axiosClient.post('/auth/register', payload);
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('scholarmesh_token', newToken);
      localStorage.setItem('scholarmesh_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.post('/auth/demo-login');
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('scholarmesh_token', newToken);
      localStorage.setItem('scholarmesh_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('scholarmesh_token');
    localStorage.removeItem('scholarmesh_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await axiosClient.get('/auth/me');
      if (res.data && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
