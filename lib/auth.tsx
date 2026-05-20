import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useRouter } from 'expo-router';
import { AuthApiError, type Session, type User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { BackendCurrentUser, getBackendCurrentUser, backendRequest } from './backend';

type AuthContextValue = {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  backendUser: BackendCurrentUser | null;
  backendUserLoading: boolean;
  backendAuthError: string | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshBackendUser: (onboardData?: { displayName: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [backendUser, setBackendUser] = useState<BackendCurrentUser | null>(
    null,
  );
  const [backendUserLoading, setBackendUserLoading] = useState(false);
  const [backendAuthError, setBackendAuthError] = useState<string | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

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
      console.log('[Auth] onAuthStateChange:', _event, 'hasSession:', !!nextSession);
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
    console.log('[Auth] Supabase signIn started for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error('[Auth] Supabase signIn failed:', error);
      throw normalizeSupabaseAuthError(error);
    }

    console.log('[Auth] Supabase signIn success, session:', !!data.session);

    if (data.session) {
      try {
        console.log('[Auth] Refreshing backend user...');
        await refreshBackendUser();
        console.log('[Auth] Backend user refresh success');
      } catch (error) {
        console.error('[Auth] Backend user refresh failed after login:', error);
      }
    } else {
      console.warn('[Auth] Login success but no session. Email confirmation might be required.');
      throw new Error('יש לאשר את כתובת האימייל לפני ההתחברות.');
    }
  }

  async function signUp(email: string, password: string, displayName: string) {
    setBackendAuthError(null);
    console.log('[Auth] Supabase signUp started for:', email);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });

    if (error) {
      console.error('[Auth] Supabase signUp failed:', error);
      const normalizedError = normalizeSupabaseAuthError(error);
      setBackendAuthError(normalizedError.message);
      throw normalizedError;
    }

    console.log('[Auth] Supabase signUp success, session:', !!data.session);

    if (data.session) {
      try {
        console.log('[Auth] Starting refresh with onboarding...');
        await refreshBackendUser({ displayName });
        console.log('[Auth] Refresh with onboarding success');
      } catch (error) {
        console.error('[Auth] Refresh with onboarding failed:', error);
      }
    } else {
      console.log('[Auth] Signup successful, but no session. Email confirmation is likely required.');
    }
    
    return data;
  }

  async function resendConfirmationEmail(email: string) {
    console.log('[Auth] Resending confirmation email to:', email);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });

    if (error) {
      console.error('[Auth] Resend failed:', error);
      throw normalizeSupabaseAuthError(error);
    }
    console.log('[Auth] Resend success');
  }

  async function signOut() {
    console.log('[Auth] signOut started');
    try {
      // 1. Clear state IMMEDIATELY and synchronously
      setSession(null);
      setBackendUser(null);
      setBackendAuthError(null);
      
      // 2. Clear Supabase session (fire and forget, don't wait for it)
      supabase.auth.signOut().catch(err => console.error('Supabase signOut error:', err));
      
      console.log('[Auth] State cleared, forcing redirect');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('[Auth] Unexpected error during signOut:', error);
    }
  }

  async function refreshBackendUser(onboardData?: { displayName: string }) {
    if (refreshPromiseRef.current) {
      console.log('[Auth] refreshBackendUser already in progress, returning existing promise');
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      console.log('[Auth] refreshBackendUser started');
      setBackendUserLoading(true);
      setBackendAuthError(null);

      try {
        console.log('[Auth] Fetching current user from backend...');
        let user = await getBackendCurrentUser();
        console.log('[Auth] Backend user fetched:', !!user, 'Profile exists:', !!user.profile);
        
        // If profile is missing (backend user has no profile field yet), try to onboard
        if (!user.profile) {
          console.log('[Auth] Profile missing, running auto-onboard...');
          try {
            await backendRequest('/auth/onboard', { 
              method: 'POST', 
              body: onboardData || {} 
            });
            console.log('[Auth] Auto-onboard success, refetching user...');
            user = await getBackendCurrentUser();
          } catch (onboardError) {
            console.error('[Auth] Auto-onboard failed:', onboardError);
          }
        }

        setBackendUser(user);
      } catch (error) {
        console.error('[Auth] refreshBackendUser failed:', error);
        setBackendUser(null);
        
        // Only set error if it's not a 401 (which just means we need to log in)
        if (error instanceof Error && !error.message.includes('401')) {
          setBackendAuthError(
            error instanceof Error
              ? error.message
              : 'Backend authentication failed.',
          );
        }
      } finally {
        setBackendUserLoading(false);
        refreshPromiseRef.current = null;
        console.log('[Auth] refreshBackendUser finished');
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
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
      signUp,
      resendConfirmationEmail,
      signOut,
      refreshBackendUser,
    }),
    [initialized, session, backendUser, backendUserLoading, backendAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function normalizeSupabaseAuthError(error: Error): Error {
  if (error instanceof AuthApiError) {
    switch (error.code) {
      case 'invalid_credentials':
        return new Error('הסיסמה שגויה.');
      case 'user_not_found':
        return new Error('משתמש זה לא קיים במערכת.');
      case 'user_already_exists':
        return new Error('משתמש עם אימייל זה כבר קיים במערכת.');
      case 'weak_password':
        return new Error('הסיסמה חלשה מדי. יש להשתמש ב-6 תווים לפחות.');
      case 'email_not_confirmed':
        return new Error('יש לאשר את כתובת האימייל בתיבת הדואר שלך לפני ההתחברות.');
      case 'over_email_send_rate_limit':
        return new Error('נשלחו יותר מדי בקשות בזמן קצר. אנא נסה שוב בעוד מספר דקות.');
      case 'invalid_email':
        return new Error('כתובת האימייל לא תקינה.');
    }
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
