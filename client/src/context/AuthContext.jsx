import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { setAccessToken } from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true: on every fresh page load we attempt to restore a
  // session via the refresh-token cookie before rendering protected
  // routes, so a logged-in user isn't bounced to /login on refresh.
  const [isLoading, setIsLoading] = useState(true);

  // StrictMode (dev) mounts -> cleans up -> mounts every component once, on
  // purpose, to expose effects that are unsafe to run twice. restoreSession
  // calls /auth/refresh-token, which ROTATES the token server-side, so two
  // concurrent calls race (both read the same token; one save wins and the
  // browser is left holding a cookie the DB no longer knows -> next reload
  // looks logged-out). This ref survives that double-invoke (same instance),
  // so the call goes out exactly once.
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    async function restoreSession() {
      try {
        // /auth/me is excluded from the interceptor's refresh-and-retry, and a
        // hard reload wipes the in-memory access token by design, so refresh
        // explicitly from the httpOnly cookie first.
        const { data } = await authApi.refresh();
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  // expectedRole (optional) is the role tab chosen on the login form. The
  // check runs BEFORE the session is committed to state: if the user were set
  // first, AppRoutes would redirect away from /login immediately and the
  // mismatch message could never show. On mismatch the server session that
  // was just created is revoked again and nothing is stored.
  const login = useCallback(async (credentials, expectedRole) => {
    const { data } = await authApi.login(credentials);
    const loggedIn = data.data.user;

    if (expectedRole && loggedIn.role !== expectedRole) {
      setAccessToken(data.data.accessToken); // logout endpoint needs auth
      try {
        await authApi.logout();
      } finally {
        setAccessToken(null);
      }
      const err = new Error('Role mismatch');
      err.code = 'ROLE_MISMATCH';
      err.actualRole = loggedIn.role;
      throw err;
    }

    setAccessToken(data.data.accessToken);
    setUser(loggedIn);
    return loggedIn;
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

  // updateUser lets pages (Profile) push a fresh user into context after an
  // edit so the sidebar/avatar update without a reload.
  const value = { user, isLoading, login, register, logout, updateUser: setUser, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
