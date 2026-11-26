import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'ea.refreshToken';
const ACCESS_TOKEN_KEY = 'ea.accessToken';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshTokenLoad: Promise<string | null> | null = null;
const sessionExpiredHandlers = new Set<() => void>();
const accessTokenHandlers = new Set<(token: string | null) => void>();

async function readStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

async function writeStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function notifyAccessTokenChanged(): void {
  for (const handler of accessTokenHandlers) handler(accessToken);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  if (refreshTokenLoad) return refreshTokenLoad;

  refreshTokenLoad = readStorageItem(REFRESH_TOKEN_KEY)
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
  if (tokens.accessToken) {
    await writeStorageItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  } else {
    await removeStorageItem(ACCESS_TOKEN_KEY);
  }

  if (tokens.refreshToken) {
    await writeStorageItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } else {
    await removeStorageItem(REFRESH_TOKEN_KEY);
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
  await Promise.all([
    removeStorageItem(ACCESS_TOKEN_KEY),
    removeStorageItem(REFRESH_TOKEN_KEY),
  ]);
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