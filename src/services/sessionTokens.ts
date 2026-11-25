import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'ea.refreshToken';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshTokenLoad: Promise<string | null> | null = null;
const sessionExpiredHandlers = new Set<() => void>();
const accessTokenHandlers = new Set<(token: string | null) => void>();

function notifyAccessTokenChanged(): void {
  for (const handler of accessTokenHandlers) handler(accessToken);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  if (refreshTokenLoad) return refreshTokenLoad;

  refreshTokenLoad = SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
    .then((storedToken) => {
      refreshToken = storedToken;
      return storedToken;
    })
    .catch((error: unknown) => {
      refreshTokenLoad = null;
      throw error;
    });

  return refreshTokenLoad;
}

export async function setSessionTokens(tokens: {
  accessToken: string | null;
  refreshToken: string | null;
}): Promise<void> {
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }

  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  refreshTokenLoad = Promise.resolve(refreshToken);
  notifyAccessTokenChanged();
}

export async function clearSessionTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  refreshTokenLoad = Promise.resolve(null);
  notifyAccessTokenChanged();
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export function onAccessTokenChanged(handler: (token: string | null) => void): () => void {
  accessTokenHandlers.add(handler);
  return () => accessTokenHandlers.delete(handler);
}

export function onSessionExpired(handler: () => void): () => void {
  sessionExpiredHandlers.add(handler);
  return () => sessionExpiredHandlers.delete(handler);
}

export function notifySessionExpired(): void {
  for (const handler of sessionExpiredHandlers) handler();
}
