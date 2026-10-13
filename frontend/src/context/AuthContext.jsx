import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('vidtube_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('vidtube_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Check auth and sync user info on initial load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('vidtube_token');
      if (savedToken) {
        try {
          const res = await authApi.getCurrentUser();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('vidtube_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Initial session check failed:', err?.message);
          // Don't immediately wipe if network temporary glitch; interceptor will handle invalid tokens
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleExternalLogout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('vidtube_token');
      localStorage.removeItem('vidtube_user');
    };

    window.addEventListener('vidtube_auth_logout', handleExternalLogout);
    return () => window.removeEventListener('vidtube_auth_logout', handleExternalLogout);
  }, []);

  const login = async (identifier, password) => {
    // Send both email and username as identifier so backend finds user whether they entered email or username
    const res = await authApi.login({
      username: identifier,
      email: identifier,
      password,
    });

    const loggedInUser = res.data?.user;
    const accessToken = res.data?.accessToken;

    if (accessToken) {
      localStorage.setItem('vidtube_token', accessToken);
      setToken(accessToken);
    }
    if (loggedInUser) {
      localStorage.setItem('vidtube_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    }

    return res.data;
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout error', e);
    } finally {
      localStorage.removeItem('vidtube_token');
      localStorage.removeItem('vidtube_user');
      setUser(null);
      setToken(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getCurrentUser();
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('vidtube_user', JSON.stringify(res.data));
      }
    } catch (e) {
      console.error('Failed to refresh user', e);
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
        logout,
        refreshUser,
        setUser,
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
