import { useMemo, useState } from 'react';

export function usePagination(totalDocs: number, pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = pageSize > 0 ? Math.ceil(totalDocs / pageSize) : 0;
  const page = Math.min(currentPage, Math.max(totalPages, 1));

  const range = useMemo(
    () => ({
      start: totalDocs === 0 ? 0 : (page - 1) * pageSize,
      end: Math.min(page * pageSize, totalDocs),
    }),
    [page, pageSize, totalDocs],
  );

  return { currentPage: page, totalPages, range, setCurrentPage };
}
