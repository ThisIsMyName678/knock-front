import { supabase } from './supabase';
import { requirePublicEnv } from './env';

const backendUrl = requirePublicEnv(
  'EXPO_PUBLIC_BACKEND_URL',
  process.env.EXPO_PUBLIC_BACKEND_URL,
).replace(/\/+$/g, '');

export class BackendApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'BackendApiError';
  }
}

type BackendRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

export async function backendRequest<T>(
  path: string,
  options: BackendRequestOptions = {},
): Promise<T> {
  const { auth = true, body, headers, ...init } = options;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new BackendApiError('Authentication session is missing.', 401, null);
    }

    requestHeaders.Authorization = `Bearer ${data.session.access_token}`;
  }

  const response = await fetch(`${backendUrl}${normalizePath(path)}`, {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new BackendApiError(
      resolveErrorMessage(responseBody, response.statusText),
      response.status,
      responseBody,
    );
  }

  return responseBody as T;
}

export type BackendCurrentUser = {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
  aal?: string;
  sessionId?: string;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
};

export function getBackendCurrentUser(): Promise<BackendCurrentUser> {
  return backendRequest<BackendCurrentUser>('/auth/me');
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function resolveErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback || 'Backend request failed.';
}
