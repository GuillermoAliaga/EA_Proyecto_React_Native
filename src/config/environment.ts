import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

export const environment = {
  apiUrl:
    configuredApiUrl ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:1337' : 'http://localhost:1337'),
};
