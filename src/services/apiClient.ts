import { environment } from '../config/environment';
import {
  clearSessionTokens,
  getAccessToken,
  getRefreshToken,
  notifySessionExpired,
  setSessionTokens,
} from './sessionTokens';

type QueryValue = string | number | boolean | null | undefined;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: HeadersInit;
  params?: Record<string, QueryValue>;
  auth?: boolean;
  skipAuthRefresh?: boolean;
}

let refreshInProgress: Promise<unknown> | null = null;

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const url = `${environment.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return url;

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  if (!query) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) return body;
  if (typeof body !== 'object' || body === null) return fallback;

  const data = body as Record<string, unknown>;
  const message = data.message ?? data.error;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    return message.map(String).join(', ');
  }
  return fallback;
}

function isAuthEndpoint(path: string): boolean {
  return /^\/?auth\/(login|register|refresh|logout)(?:[/?#]|$)/.test(path);
}

async function refreshAccessToken(): Promise<unknown> {
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      const currentAccessToken = getAccessToken();
      const headers = new Headers({ Accept: 'application/json' });
      let body: string | undefined;

      if (refreshToken) {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify({ refreshToken });
      }

      const response = await fetch(`${environment.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers,
        body,
        credentials: 'include',
      });

      if (!response.ok) {
        const responseBody = await readResponseBody(response);
        throw new ApiError(
          errorMessage(responseBody, `No se pudo renovar la sesión (${response.status}).`),
          response.status,
          responseBody,
        );
      }

      const responseBody = await readResponseBody(response);
      const payload =
        typeof responseBody === 'object' && responseBody !== null
          ? (responseBody as Record<string, unknown>)
          : {};
      const data =
        typeof payload.data === 'object' && payload.data !== null
          ? (payload.data as Record<string, unknown>)
          : payload;
      const nextAccessToken = data.accessToken ?? data.token;
      const nextRefreshToken = data.refreshToken;

      await setSessionTokens({
        accessToken:
          typeof nextAccessToken === 'string' ? nextAccessToken : currentAccessToken,
        refreshToken:
          typeof nextRefreshToken === 'string'
            ? nextRefreshToken
            : refreshToken,
      });
      return responseBody;
    } catch (error) {
      await clearSessionTokens();
      notifySessionExpired();
      if (error instanceof ApiError) throw error;
      if (error instanceof TypeError) {
        throw new ApiError(
          'No se pudo conectar con el servidor para renovar la sesión. Comprueba la URL y la red.',
          0,
          error,
        );
      }
      throw error;
    } finally {
      refreshInProgress = null;
    }
  })();

  return refreshInProgress;
}

async function sendRequest<T>(
  path: string,
  options: ApiRequestOptions,
  hasRetried: boolean,
): Promise<T | null> {
  const { params, body, headers: requestHeaders, auth, skipAuthRefresh, ...requestOptions } =
    options;
  const headers = new Headers(requestHeaders);
  headers.set('Accept', 'application/json');

  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    serializedBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  if (auth !== false && getAccessToken()) {
    headers.set('Authorization', `Bearer ${getAccessToken()}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      ...requestOptions,
      headers,
      body: serializedBody,
      credentials: 'include',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    if (error instanceof TypeError) {
      throw new ApiError(
        'No se pudo conectar con el servidor. Comprueba la URL de la API y que el backend esté disponible.',
        0,
        error,
      );
    }
    throw error;
  }

  if (response.status === 401 && !hasRetried && !skipAuthRefresh && !isAuthEndpoint(path)) {
    await refreshAccessToken();
    return sendRequest<T>(path, options, true);
  }

  if (response.status === 204) return null;

  const responseBody = await readResponseBody(response);
  if (!response.ok) {
    throw new ApiError(
      errorMessage(responseBody, `Error del servidor (${response.status}).`),
      response.status,
      responseBody,
    );
  }

  return responseBody as T;
}

export function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T | null> {
  return sendRequest<T>(path, options, false);
}

export async function refreshSession(): Promise<unknown> {
  return refreshAccessToken();
}
