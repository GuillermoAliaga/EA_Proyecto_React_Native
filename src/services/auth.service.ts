import { ApiError, apiClient, refreshSession } from './apiClient';
import { clearSessionTokens, getRefreshToken, setSessionTokens } from './sessionTokens';
import { ROLES } from '../models/user.model';
import type { User, UserRole } from '../models/user.model';

interface AuthPayload {
  user?: User;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  data?: AuthPayload;
}

function unwrapAuthPayload(payload: unknown): AuthPayload {
  if (typeof payload !== 'object' || payload === null) return {};
  const response = payload as AuthPayload;
  return response.data ?? response;
}

function getUser(payload: AuthPayload): User | null {
  const user = payload.user;
  if (
    typeof user === 'object' &&
    user !== null &&
    typeof user._id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.role === 'string' &&
    ROLES.some((role: UserRole) => role === user.role)
  ) {
    return user;
  }
  return null;
}

async function persistPayloadTokens(
  payload: AuthPayload,
  fallbackRefreshToken: string | null = null,
): Promise<void> {
  const accessToken = payload.accessToken ?? payload.token ?? null;
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
  const user = getUser(payload);

  if (!user) {
    throw new ApiError('La respuesta de inicio de sesión no incluye un usuario válido.', 502);
  }

  await persistPayloadTokens(payload);
  return user;
}

export async function restoreSession(): Promise<User | null> {
  const storedRefreshToken = await getRefreshToken();
  try {
    const response = await refreshSession();
    const payload = unwrapAuthPayload(response);
    await persistPayloadTokens(payload, storedRefreshToken);
    return getUser(payload);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      await clearSessionTokens();
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  await clearSessionTokens();
}
