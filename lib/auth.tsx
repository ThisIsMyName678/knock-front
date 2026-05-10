import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthApiError, type Session, type User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { BackendCurrentUser, getBackendCurrentUser } from './backend';

type AuthContextValue = {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  backendUser: BackendCurrentUser | null;
  backendUserLoading: boolean;
  backendAuthError: string | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshBackendUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [backendUser, setBackendUser] = useState<BackendCurrentUser | null>(
    null,
  );
  const [backendUserLoading, setBackendUserLoading] = useState(false);
  const [backendAuthError, setBackendAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setInitialized(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitialized(true);

      if (!nextSession) {
        setBackendUser(null);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setBackendUser(null);
      setBackendAuthError(null);
      return;
    }

    void refreshBackendUser().catch(() => undefined);
  }, [session?.access_token]);

  async function signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw normalizeSupabaseAuthError(error);
    }

    try {
      await refreshBackendUser();
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }
  }

  async function signOut() {
    setBackendUser(null);
    setBackendAuthError(null);
    await supabase.auth.signOut();
  }

  async function refreshBackendUser() {
    setBackendUserLoading(true);
    setBackendAuthError(null);

    try {
      setBackendUser(await getBackendCurrentUser());
    } catch (error) {
      setBackendUser(null);
      setBackendAuthError(
        error instanceof Error
          ? error.message
          : 'Backend authentication failed.',
      );
      throw error;
    } finally {
      setBackendUserLoading(false);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      user: session?.user ?? null,
      backendUser,
      backendUserLoading,
      backendAuthError,
      signInWithPassword,
      signOut,
      refreshBackendUser,
    }),
    [initialized, session, backendUser, backendUserLoading, backendAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function normalizeSupabaseAuthError(error: Error): Error {
  if (error instanceof AuthApiError && error.code === 'invalid_credentials') {
    return new Error('האימייל או הסיסמה שגויים.');
  }

  return error;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
