import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../models/user.model';
import {
  getCurrentAccessToken,
  login,
  logout as logoutService,
  restoreSession,
} from '../services/auth.service';
import { getAccessToken, onAccessTokenChanged, onSessionExpired } from '../services/sessionTokens';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isInitializing: boolean;
  initializationError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retryInitialization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const retryInitialization = useCallback(async () => {
    setIsInitializing(true);
    setInitializationError(null);
    try {
      setUser(await restoreSession());
      setAccessToken(getCurrentAccessToken());
    } catch (error) {
      setUser(null);
      setAccessToken(getAccessToken());
      setInitializationError(
        error instanceof Error ? error.message : 'No se pudo restaurar la sesión.',
      );
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await login(email, password);
    setUser(authenticatedUser);
    setAccessToken(getCurrentAccessToken());
    setInitializationError(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutService();
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribeAccessToken = onAccessTokenChanged(setAccessToken);
    const unsubscribe = onSessionExpired(() => {
      setUser(null);
      setAccessToken(null);
      setIsInitializing(false);
    });
    void retryInitialization();
    return () => {
      unsubscribeAccessToken();
      unsubscribe();
    };
  }, [retryInitialization]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isInitializing,
      initializationError,
      signIn,
      logout,
      retryInitialization,
    }),
    [user, accessToken, isInitializing, initializationError, signIn, logout, retryInitialization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
