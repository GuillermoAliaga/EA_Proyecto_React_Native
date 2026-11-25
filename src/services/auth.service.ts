import { ApiError, apiClient, refreshSession } from './apiClient';
import {
  clearSessionTokens,
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
} from './sessionTokens';
import { ROLES } from '../models/user.model';
import type { User, UserRole } from '../models/user.model';

interface AuthPayload {
  user?: User;
  token?: string;
  refreshToken?: string;
  data?: AuthPayload;
}

function unwrapAuthPayload(payload: unknown): AuthPayload {
  if (typeof payload !== 'object' || payload === null) return {};
  const response = payload as AuthPayload;
  return response.data ?? response;
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<User>;
  if (
    typeof candidate._id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string' &&
    ROLES.some((role: UserRole) => role === candidate.role)
  ) {
    return true;
  }
  return false;
}

function getUser(payload: AuthPayload): User | null {
  const candidate = payload.user ?? payload;
  return isUser(candidate) ? candidate : null;
}

async function persistPayloadTokens(
  payload: AuthPayload,
  fallbackRefreshToken: string | null = null,
): Promise<void> {
  const accessToken = payload.token ?? null;
  const refreshToken = payload.refreshToken ?? fallbackRefreshToken;
  await setSessionTokens({ accessToken, refreshToken });
}

export async function login(email: string, password: string): Promise<User> {
  await clearSessionTokens();

  const response = await apiClient<unknown>('/auth/login', {
    method: 'POST',
    auth: false,
    skipAuthRefresh: true,
    body: { email, password },
  });
  const payload = unwrapAuthPayload(response);
  await persistPayloadTokens(payload);
  const user = getUser(payload) ?? (await getCurrentUser());
  return user;
}

export async function restoreSession(): Promise<User | null> {
  const storedRefreshToken = await getRefreshToken();
  try {
    const response = await refreshSession();
    const payload = unwrapAuthPayload(response);
    await persistPayloadTokens(payload, storedRefreshToken);
    return getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      await clearSessionTokens();
      return null;
    }
    throw error;
  }
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  await apiClient('/auth/register', {
    method: 'POST',
    auth: false,
    skipAuthRefresh: true,
    body: { name: input.name, email: input.email, password: input.password },
  });
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = await getRefreshToken();
    await apiClient('/auth/logout', {
      method: 'POST',
      skipAuthRefresh: true,
      ...(refreshToken ? { body: { refreshToken } } : {}),
    });
  } finally {
    await clearSessionTokens();
  }
}

export function getCurrentAccessToken(): string | null {
  return getAccessToken();
}

async function getCurrentUser(): Promise<User> {
  const response = await apiClient<unknown>('/users/me', { method: 'GET' });
  const user = getUser(unwrapAuthPayload(response));
  if (!user) {
    throw new ApiError('La respuesta de /users/me no incluye un usuario válido.', 502);
  }
  return user;
}
