import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { AuthApiError, type Session, type User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import {
  BackendApiError,
  BackendCurrentUser,
  getBackendCurrentUser,
  backendRequest,
} from './backend';
import { isAuthDisabled } from './auth-config';
import { isValidEmail } from './auth-validation';
import { LAST_SEEN_KEY } from './notifications-badge';
import { PASSED_IDS_KEY } from './notifications-storage-keys';
import {
  getPasswordResetRedirectUrl,
  handleAuthDeepLink,
  isPasswordResetUrl,
} from './auth-linking';
import { router } from 'expo-router';

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
  backendBootstrapComplete: boolean;
  backendAuthError: string | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<any>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  passwordRecoveryPending: boolean;
  signOut: () => Promise<void>;
  refreshBackendUser: (onboardData?: { displayName: string; phone: string }) => Promise<void>;
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
  const [backendBootstrapComplete, setBackendBootstrapComplete] = useState(AUTH_DISABLED);
  const [backendAuthError, setBackendAuthError] = useState<string | null>(null);
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

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

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('[Auth] onAuthStateChange:', event, 'hasSession:', !!nextSession);
      setSession(nextSession);
      setInitialized(true);

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true);
      }

      if (!nextSession) {
        setBackendUser(null);
        setPasswordRecoveryPending(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED) {
      return;
    }

    const processUrl = async (url: string | null) => {
      if (!url || !isPasswordResetUrl(url)) {
        return;
      }

      try {
        const result = await handleAuthDeepLink(url);
        if (result.type === 'recovery') {
          setPasswordRecoveryPending(true);
          router.replace('/(auth)/reset-password');
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[Auth] Password reset deep link failed:', error);
        }
      }
    };

    void Linking.getInitialURL().then(processUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void processUrl(url);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED) {
      return;
    }

    if (!initialized) {
      return;
    }

    if (!session) {
      setBackendUser(null);
      setBackendAuthError(null);
      setBackendBootstrapComplete(true);
      return;
    }

    if (passwordRecoveryPending) {
      setBackendBootstrapComplete(true);
      return;
    }

    setBackendBootstrapComplete(false);
    void refreshBackendUser().catch(() => undefined);
  }, [session?.access_token, initialized, passwordRecoveryPending]);

  async function signInWithPassword(email: string, password: string) {
    if (AUTH_DISABLED) {
      setSession(MOCK_SESSION);
      setBackendUser(MOCK_BACKEND_USER);
      setBackendAuthError(null);
      return;
    }
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

  async function signUp(email: string, password: string, displayName: string, phone: string) {
    setBackendAuthError(null);
    console.log('[Auth] Supabase signUp started for:', email);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: displayName,
          phone,
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
        await refreshBackendUser({ displayName, phone });
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
    if (AUTH_DISABLED) {
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      throw new Error('יש להזין כתובת אימייל תקינה.');
    }

    console.log('[Auth] Resending confirmation email to:', trimmed);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmed,
    });

    if (error) {
      if (error instanceof AuthApiError && error.code === 'over_email_send_rate_limit') {
        console.error('[Auth] Resend rate limited:', error);
        throw normalizeSupabaseAuthError(error);
      }

      if (__DEV__) {
        console.warn('[Auth] Resend failed:', error);
      }
    }

    console.log('[Auth] Resend request completed');
  }

  async function requestPasswordReset(email: string) {
    if (AUTH_DISABLED) {
      return;
    }

    const redirectTo = getPasswordResetRedirectUrl();
    console.log('[Auth] Password reset requested, redirectTo:', redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error && __DEV__) {
      console.warn('[Auth] resetPasswordForEmail:', error);
    }
  }

  async function updatePassword(newPassword: string) {
    if (AUTH_DISABLED) {
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      throw normalizeSupabaseAuthError(error);
    }

    setPasswordRecoveryPending(false);

    try {
      await refreshBackendUser();
    } catch (error) {
      if (__DEV__) {
        console.warn('[Auth] Backend refresh after password update failed:', error);
      }
    }
  }

  async function signOut() {
    if (AUTH_DISABLED) {
      return;
    }
    console.log('[Auth] signOut started');
    try {
      // 1. Clear state IMMEDIATELY and synchronously
      setSession(null);
      setBackendUser(null);
      setBackendAuthError(null);
      setPasswordRecoveryPending(false);
      
      // 2. Clear Supabase session (fire and forget, don't wait for it)
      supabase.auth.signOut().catch(err => console.error('Supabase signOut error:', err));

      // 3. Clear device-local notification state so the next user on this device doesn't inherit it
      try {
        localStorage.removeItem(PASSED_IDS_KEY);
        localStorage.removeItem(LAST_SEEN_KEY);
      } catch (err) {
        console.error('[Auth] Failed to clear notifications storage on signOut:', err);
      }

      console.log('[Auth] State cleared, forcing redirect');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('[Auth] Unexpected error during signOut:', error);
    }
  }

  async function refreshBackendUser(onboardData?: { displayName: string; phone: string }) {
    if (AUTH_DISABLED) {
      setBackendUser(MOCK_BACKEND_USER);
      setBackendAuthError(null);
      return;
    }

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
              body: onboardData || {},
            });
            console.log('[Auth] Auto-onboard success, refetching user...');
            user = await getBackendCurrentUser();
          } catch (onboardError) {
            if (__DEV__) {
              console.warn('[Auth] Auto-onboard failed:', onboardError);
            }
            setBackendUser(null);
            setBackendAuthError(
              resolveBackendErrorMessage(
                onboardError,
                'לא ניתן להשלים את הגדרת החשבון. נסה שוב.',
              ),
            );
            return;
          }

          if (!user.profile) {
            setBackendUser(null);
            setBackendAuthError('לא ניתן להשלים את הגדרת החשבון. נסה שוב.');
            return;
          }
        }

        setBackendUser(user);
      } catch (error) {
        if (__DEV__) {
          console.warn('[Auth] refreshBackendUser failed:', error);
        }
        setBackendUser(null);
        setBackendAuthError(resolveBackendErrorMessage(error));
      } finally {
        setBackendUserLoading(false);
        setBackendBootstrapComplete(true);
        refreshPromiseRef.current = null;
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
      backendBootstrapComplete,
      backendAuthError,
      signInWithPassword,
      signUp,
      resendConfirmationEmail,
      requestPasswordReset,
      updatePassword,
      passwordRecoveryPending,
      signOut,
      refreshBackendUser,
    }),
    [
      initialized,
      session,
      backendUser,
      backendUserLoading,
      backendBootstrapComplete,
      backendAuthError,
      passwordRecoveryPending,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function resolveBackendErrorMessage(
  error: unknown,
  fallback = 'לא ניתן לטעון את פרטי המשתמש מהשרת. בדוק את החיבור ונסה שוב.',
): string {
  if (error instanceof BackendApiError) {
    if (error.status === 401) {
      return 'פג תוקף ההתחברות. אנא התחבר מחדש.';
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    const isNetworkError =
      error.message.includes('Network request failed') ||
      error.message.includes('Failed to fetch');

    if (isNetworkError) {
      return 'לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט ונסה שוב.';
    }

    return error.message || fallback;
  }

  return fallback;
}

function normalizeSupabaseAuthError(error: Error): Error {
  if (error instanceof AuthApiError) {
    switch (error.code) {
      case 'invalid_credentials':
        return new Error('האימייל או הסיסמה שגויים.');
      case 'user_already_exists':
        return new Error('משתמש עם אימייל זה כבר קיים במערכת.');
      case 'weak_password':
        return new Error('הסיסמה חלשה מדי. יש להשתמש ב-6 תווים לפחות.');
      case 'email_not_confirmed':
        return new Error('יש לאשר את כתובת האימייל בתיבת הדואר שלך לפני ההתחברות.');
      case 'over_email_send_rate_limit':
        return new Error('נשלחו יותר מדי בקשות בזמן קצר. אנא נסה שוב בעוד מספר דקות.');
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
