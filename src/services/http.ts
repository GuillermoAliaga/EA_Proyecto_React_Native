import { environment } from '../config/environment';

export async function httpRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T | undefined> {
  const response = await fetch(`${environment.apiUrl}${path}`, init);

  if (!response.ok) {
    throw new Error(`Error de API: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return undefined;
  return (await response.json()) as T;
}
