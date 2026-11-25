import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../models/user.model';
import { login, logout, restoreSession } from '../services/auth.service';
import { onSessionExpired } from '../services/sessionTokens';

interface AuthContextValue {
  user: User | null;
  isInitializing: boolean;
  initializationError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retryInitialization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const retryInitialization = useCallback(async () => {
    setIsInitializing(true);
    setInitializationError(null);
    try {
      setUser(await restoreSession());
    } catch (error) {
      setUser(null);
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
    setInitializationError(null);
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setUser(null);
      setIsInitializing(false);
    });
    void retryInitialization();
    return unsubscribe;
  }, [retryInitialization]);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      initializationError,
      signIn,
      signOut,
      retryInitialization,
    }),
    [user, isInitializing, initializationError, signIn, signOut, retryInitialization],
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
