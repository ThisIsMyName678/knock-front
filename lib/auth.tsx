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
import { isAuthDisabled } from './auth-config';

const AUTH_DISABLED = isAuthDisabled();

const MOCK_BACKEND_USER: BackendCurrentUser = {
  id: 'dev-preview-user',
  email: 'preview@knock.local',
  role: 'מנהל',
  userMetadata: { full_name: 'משתמש תצוגה' },
};

const MOCK_SESSION = {
  access_token: 'dev-preview-token',
  refresh_token: 'dev-preview-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: MOCK_BACKEND_USER.id,
    email: MOCK_BACKEND_USER.email,
    user_metadata: MOCK_BACKEND_USER.userMetadata,
  },
} as Session;

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
  const [initialized, setInitialized] = useState(AUTH_DISABLED);
  const [session, setSession] = useState<Session | null>(
    AUTH_DISABLED ? MOCK_SESSION : null,
  );
  const [backendUser, setBackendUser] = useState<BackendCurrentUser | null>(
    AUTH_DISABLED ? MOCK_BACKEND_USER : null,
  );
  const [backendUserLoading, setBackendUserLoading] = useState(false);
  const [backendAuthError, setBackendAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (AUTH_DISABLED) {
      return;
    }

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
    if (AUTH_DISABLED || !session) {
      if (AUTH_DISABLED) {
        return;
      }

      setBackendUser(null);
      setBackendAuthError(null);
      return;
    }

    void refreshBackendUser().catch(() => undefined);
  }, [session?.access_token]);

  async function signInWithPassword(email: string, password: string) {
    if (AUTH_DISABLED) {
      setSession(MOCK_SESSION);
      setBackendUser(MOCK_BACKEND_USER);
      setBackendAuthError(null);
      return;
    }
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
    if (AUTH_DISABLED) {
      return;
    }

    setBackendUser(null);
    setBackendAuthError(null);
    await supabase.auth.signOut();
  }

  async function refreshBackendUser() {
    if (AUTH_DISABLED) {
      setBackendUser(MOCK_BACKEND_USER);
      setBackendAuthError(null);
      return;
    }

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
