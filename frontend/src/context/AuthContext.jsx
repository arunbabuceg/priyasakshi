import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshFromCookie,
} from '@/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount.
  //
  // Strategy:
  //   1. Try /auth/me with the existing access-token cookie.
  //   2. If that returns 401 (expired access token), call /auth/refresh-cookie
  //      to exchange the long-lived refresh-token cookie for a new access token,
  //      then retry /auth/me.
  //   3. If both fail, the user is unauthenticated.
  //
  // This lets sessions survive browser restarts even after the access token
  // expires, as long as the 30-day refresh token is still valid.
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        let res = await getMe();

        if (!res.ok && res.status === 401) {
          // Access token expired — try to refresh silently
          const refreshResult = await refreshFromCookie();
          if (refreshResult.ok) {
            res = await getMe();
          }
        }

        if (mounted) setUser(res.ok ? res.data : null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    if (res.ok) setUser(res.data.user);
    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await apiRegister(name, email, password);
    if (res.ok) setUser(res.data.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, setUser, isAdmin: !!user?.is_admin };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
