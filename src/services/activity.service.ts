import { apiClient } from './apiClient';
import type { Activity, ActivityInput, PaginatedResponse } from '../models';

export interface ActivityListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: string;
  subcategory?: string;
  status?: string;
  showDeleted?: boolean;
}

function unwrapActivity(payload: unknown): Activity {
  if (typeof payload === 'object' && payload !== null && 'activity' in payload) {
    return (payload as { activity: Activity }).activity;
  }
  return payload as Activity;
}

export async function getActivities(
  params: ActivityListParams = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<Activity>> {
  const response = await apiClient<PaginatedResponse<Activity>>('/activities', {
    params: {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      category: params.category,
      subcategory: params.subcategory,
      status: params.status,
      showDeleted: params.showDeleted,
    },
    signal,
  });
  if (!response) {
    return { data: [], totalDocs: 0, totalPages: 0, currentPage: params.page ?? 1 };
  }
  return response;
}

export async function getActivity(id: string, signal?: AbortSignal): Promise<Activity> {
  const response = await apiClient<unknown>(`/activities/${encodeURIComponent(id)}`, { signal });
  return unwrapActivity(response);
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const response = await apiClient<unknown>('/activities', { method: 'POST', body: input });
  return unwrapActivity(response);
}

export async function updateActivity(
  id: string,
  input: Partial<ActivityInput>,
): Promise<Activity> {
  const response = await apiClient<unknown>(`/activities/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: input,
  });
  return unwrapActivity(response);
}

export async function joinActivity(id: string): Promise<Activity | null> {
  const response = await apiClient<unknown>(
    `/activities/${encodeURIComponent(id)}/participants`,
    { method: 'POST' },
  );
  return response ? unwrapActivity(response) : null;
}

export async function leaveActivity(id: string): Promise<Activity | null> {
  const response = await apiClient<unknown>(
    `/activities/${encodeURIComponent(id)}/participants`,
    { method: 'DELETE' },
  );
  return response ? unwrapActivity(response) : null;
}

export async function softDeleteActivity(id: string): Promise<void> {
  await apiClient(`/activities/${encodeURIComponent(id)}/soft-delete`, { method: 'PATCH' });
}

export async function restoreActivity(id: string): Promise<Activity | null> {
  const response = await apiClient<unknown>(
    `/activities/${encodeURIComponent(id)}/restore`,
    { method: 'PATCH' },
  );
  return response ? unwrapActivity(response) : null;
}

export async function deleteActivity(id: string): Promise<void> {
  await apiClient(`/activities/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function bulkSoftDeleteActivities(ids: string[]): Promise<void> {
  await apiClient('/activities/bulk-soft-delete', { method: 'PATCH', body: { ids } });
}

export async function bulkDeleteActivities(ids: string[]): Promise<void> {
  await apiClient('/activities/bulk', { method: 'DELETE', body: { ids } });
}
