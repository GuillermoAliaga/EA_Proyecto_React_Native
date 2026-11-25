import type { PaginatedResponse, User, UserInput, UserRole } from '../models';
import { apiClient } from './apiClient';

export interface UserListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  showDeleted?: boolean;
}

function unwrapUser(payload: unknown): User {
  if (typeof payload === 'object' && payload !== null && 'user' in payload) {
    return (payload as { user: User }).user;
  }
  return payload as User;
}

export async function getUsers(
  params: UserListParams = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<User>> {
  const response = await apiClient<PaginatedResponse<User>>('/users', {
    params: {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      showDeleted: params.showDeleted,
    },
    signal,
  });
  return response ?? { data: [], totalDocs: 0, totalPages: 0, currentPage: params.page ?? 1 };
}

export async function getUser(id: string, signal?: AbortSignal): Promise<User> {
  return unwrapUser(await apiClient<unknown>(`/users/${encodeURIComponent(id)}`, { signal }));
}

export async function createUser(input: UserInput & { password: string }): Promise<User> {
  return unwrapUser(await apiClient<unknown>('/users', { method: 'POST', body: input }));
}

export async function updateUser(id: string, input: UserInput): Promise<User> {
  return unwrapUser(
    await apiClient<unknown>(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: input }),
  );
}

export async function softDeleteUser(id: string): Promise<void> {
  await apiClient(`/users/${encodeURIComponent(id)}/soft-delete`, { method: 'PATCH' });
}

export async function restoreUser(id: string): Promise<User | null> {
  const response = await apiClient<unknown>(
    `/users/${encodeURIComponent(id)}/restore`,
    { method: 'PATCH' },
  );
  return response ? unwrapUser(response) : null;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function bulkSoftDeleteUsers(ids: string[]): Promise<void> {
  await apiClient('/users/bulk-soft-delete', { method: 'PATCH', body: { ids } });
}

export async function bulkDeleteUsers(ids: string[]): Promise<void> {
  await apiClient('/users/bulk', { method: 'DELETE', body: { ids } });
}

export type { UserRole };
