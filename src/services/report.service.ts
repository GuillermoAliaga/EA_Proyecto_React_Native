import type {
  PaginatedResponse,
  Report,
  ReportInput,
  ReportReviewInput,
  ReportStatus,
  ReportReason,
  ReportTargetType,
} from '../models';
import { apiClient } from './apiClient';
import { normalizePage } from './pagination';

export interface ReportListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: ReportStatus;
  reason?: ReportReason;
  targetType?: ReportTargetType;
  showDeleted?: boolean;
}

function unwrapReport(payload: unknown): Report {
  if (typeof payload === 'object' && payload !== null && 'report' in payload) {
    return (payload as { report: Report }).report;
  }
  return payload as Report;
}

export async function getReports(
  params: ReportListParams = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<Report>> {
  const response = await apiClient<unknown>('/reports', {
    params: {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      status: params.status,
      reason: params.reason,
      targetType: params.targetType,
      showDeleted: params.showDeleted ? 'true' : undefined,
    },
    signal,
  });
  return normalizePage<Report>(response, ['reports', 'items', 'results'], params.page, params.limit);
}

export async function getReport(id: string, signal?: AbortSignal): Promise<Report> {
  return unwrapReport(
    await apiClient<unknown>(`/reports/${encodeURIComponent(id)}`, { signal }),
  );
}

export async function createReport(input: ReportInput): Promise<Report> {
  return unwrapReport(await apiClient<unknown>('/reports', { method: 'POST', body: input }));
}

export async function updateReport(
  id: string,
  input: ReportReviewInput,
): Promise<Report> {
  return unwrapReport(
    await apiClient<unknown>(`/reports/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: input,
    }),
  );
}

export async function softDeleteReport(id: string): Promise<void> {
  await apiClient(`/reports/${encodeURIComponent(id)}/soft-delete`, { method: 'PATCH' });
}

export async function deleteReport(id: string): Promise<void> {
  await apiClient(`/reports/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function bulkSoftDeleteReports(ids: string[]): Promise<void> {
  await apiClient('/reports/bulk-soft-delete', { method: 'PATCH', body: { ids } });
}

export async function bulkDeleteReports(ids: string[]): Promise<void> {
  await apiClient('/reports/bulk', { method: 'DELETE', body: { ids } });
}
