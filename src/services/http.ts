import { apiClient } from './apiClient';

export async function httpRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  return apiClient<T>(path, init);
}
