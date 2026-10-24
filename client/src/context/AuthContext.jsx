import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { setAccessToken } from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true: on every fresh page load we attempt to restore a
  // session via the refresh-token cookie before rendering protected
  // routes, so a logged-in user isn't bounced to /login on refresh.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        // /auth/me is deliberately excluded from the response
        // interceptor's auto-refresh-and-retry (to avoid a refresh
        // loop on the refresh endpoint itself). On a hard page reload
        // the in-memory access token is gone by design, so we have to
        // explicitly refresh it from the httpOnly cookie first --
        // otherwise every reload would look like "not logged in" even
        // with a perfectly valid session.
        const { data } = await authApi.refresh();
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        // No valid refresh cookie — this is a normal, expected outcome
        // for a logged-out visitor, not an error to surface.
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = { user, isLoading, login, register, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
