import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient, setSessionToken } from '@/api/client';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('access_token');
        if (stored) {
          setSessionToken(stored);
        }
      }
      await apiClient.get('/users/me');
      setAuthenticatedState(true);
    } catch {
      setAuthenticatedState(false);
      setSessionToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setAuthenticated = useCallback((value: boolean) => {
    setAuthenticatedState(value);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setSessionToken(null);
    setAuthenticatedState(false);
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Cookie may already be gone or network error; auth state is cleared
    }
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    refetch,
    setAuthenticated,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
