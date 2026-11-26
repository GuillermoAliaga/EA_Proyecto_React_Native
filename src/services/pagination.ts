import type { PaginatedResponse } from '../models/pagination.model';

type PageResult<T> = PaginatedResponse<T> & { data: T[] };

/** Accepts the common pagination envelopes used by the API and older controllers. */
export function normalizePage<T>(
  payload: unknown,
  collectionKeys: string[],
  page = 1,
  limit = 20,
): PageResult<T> {
  const root = record(payload);
  const outerData = root?.data;
  const body = record(outerData) ?? root ?? {};
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(outerData)
      ? outerData
      : findRows<T>(body, collectionKeys) ?? findRows<T>(root, collectionKeys) ?? [];
  const meta = record(body.pagination) ?? record(body.meta) ?? record(root?.pagination) ?? root ?? {};
  const totalDocs = numberValue(meta.totalDocs, meta.total, meta.totalItems, meta.count) ?? rows.length;
  const totalPages = numberValue(meta.totalPages, meta.pages, meta.pageCount) ??
    (limit > 0 ? Math.ceil(totalDocs / limit) : 0);
  const currentPage = numberValue(meta.currentPage, meta.page) ?? page;

  return { data: rows, totalDocs, totalPages, currentPage };
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function findRows<T>(value: Record<string, unknown> | undefined, keys: string[]): T[] | undefined {
  if (!value) return undefined;
  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key] as T[];
  }
  return undefined;
}

function numberValue(...values: unknown[]): number | undefined {
  const value = values.find((item) => typeof item === 'number' && Number.isFinite(item));
  return value as number | undefined;
}
