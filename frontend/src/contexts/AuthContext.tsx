import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient, setSessionToken } from '@/api/client';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileComplete: boolean;
  refetch: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
  setProfileComplete: (value: boolean) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const refetch = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('access_token');
        if (stored) {
          setSessionToken(stored);
        }
      }
      const res = await apiClient.get('/users/me');
      const apiData = res.data?.data || res.data;
      
      // Backend response structure:
      // - Profile exists: apiData IS the User object directly
      // - Profile doesn't exist: apiData = {profile: null, user_id: X}
      const profile = apiData?.profile !== undefined ? apiData.profile : apiData;
      
      // Profile is complete ONLY if user_name exists (required field)
      const profileComplete = !!(profile && profile !== null && profile.user_name);
      setAuthenticatedState(true);
      setIsProfileComplete(profileComplete);
    } catch {
      setAuthenticatedState(false);
      setIsProfileComplete(false);
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

  const setProfileComplete = useCallback((value: boolean) => {
    setIsProfileComplete(value);
  }, []);

  const logout = useCallback(async () => {
    setSessionToken(null);
    setAuthenticatedState(false);
    setIsProfileComplete(false);
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Cookie may already be gone or network error; auth state is cleared
    }
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    isProfileComplete,
    refetch,
    setAuthenticated,
    setProfileComplete,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
