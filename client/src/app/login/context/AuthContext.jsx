"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { saveToStorage, getFromStorage, removeFromStorage } from '@/utils/storage';
import { apiClient } from '@/services/apiClient';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(() => getFromStorage('auth_user'));
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getFromStorage('auth_token');
    return token !== null;
  });

  const login = async (email, password) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await response.json();
      if (data.success && data.token) {
        saveToStorage('auth_token', data.token);
        saveToStorage('auth_user', data.user);
        setUser(data.user);
        setIsAuthenticated(true);
        router.push('/dashboard');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    removeFromStorage('auth_token');
    removeFromStorage('auth_user');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Re-validate the token and refresh role/name in case they changed
      // (or the token has since expired) since it was last cached.
      apiClient('/auth/me')
        .then((data) => {
          if (data?.user) {
            saveToStorage('auth_user', data.user);
            setUser(data.user);
          }
        })
        .catch(() => {
          // apiClient already clears storage and redirects on 401.
        });
    } else if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, role, isAdmin: role === 'admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
