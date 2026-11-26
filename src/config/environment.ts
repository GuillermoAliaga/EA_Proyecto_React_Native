import { Platform } from 'react-native';
import Constants from 'expo-constants';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
const isLocalhostUrl = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);

function getDevelopmentHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  try {
    return new URL(`http://${hostUri}`).hostname;
  } catch {
    return null;
  }
}

const developmentHost = getDevelopmentHost();
const configuredLocalApiUrl = configuredApiUrl && isLocalhostUrl(configuredApiUrl);
const apiUrl =
  configuredApiUrl && !(Platform.OS !== 'web' && configuredLocalApiUrl && developmentHost)
    ? configuredApiUrl
    : Platform.OS !== 'web' && developmentHost
      ? `http://${developmentHost}:1337`
      : Platform.OS === 'android'
        ? 'http://10.0.2.2:1337'
        : 'http://localhost:1337';

export const environment = {
  apiUrl,
};
