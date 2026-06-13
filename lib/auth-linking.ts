import * as Linking from 'expo-linking';
import { supabase } from './supabase';

export const PASSWORD_RESET_PATH = 'reset-password';

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'אם קיימת במערכת כתובת אימייל תואמת, נשלח אליה קישור לאיפוס סיסמה.';

/** Deep link Supabase should redirect to after the user taps the email link. */
export function getPasswordResetRedirectUrl(): string {
  return Linking.createURL(PASSWORD_RESET_PATH);
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const paramString =
    hashIndex >= 0
      ? url.slice(hashIndex + 1)
      : queryIndex >= 0
        ? url.slice(queryIndex + 1)
        : '';

  if (!paramString) {
    return params;
  }

  for (const pair of paramString.split('&')) {
    if (!pair) {
      continue;
    }

    const separator = pair.indexOf('=');
    const rawKey = separator >= 0 ? pair.slice(0, separator) : pair;
    const rawValue = separator >= 0 ? pair.slice(separator + 1) : '';

    if (!rawKey) {
      continue;
    }

    params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
  }

  return params;
}

export type AuthLinkResult =
  | { type: 'recovery'; sessionCreated: true }
  | { type: 'none' };

/** Exchange recovery tokens from a deep link into a Supabase session. */
export async function handleAuthDeepLink(url: string): Promise<AuthLinkResult> {
  const params = parseUrlParams(url);
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const linkType = params.type;

  if (!accessToken || !refreshToken) {
    return { type: 'none' };
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  if (linkType === 'recovery') {
    return { type: 'recovery', sessionCreated: true };
  }

  return { type: 'none' };
}

export function isPasswordResetUrl(url: string): boolean {
  return url.includes(PASSWORD_RESET_PATH);
}
