"use client";

"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { saveToStorage, getFromStorage, removeFromStorage } from '@/utils/storage';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
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
    setIsAuthenticated(false);
    router.push('/login');
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Optionally, you can add a token validation here
    } else {
      // If not authenticated and not on login page, redirect to login
      // Note: We avoid redirecting on login page to prevent infinite loop
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);