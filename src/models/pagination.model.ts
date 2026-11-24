export interface PaginatedResponse<T> {
  data: T[];
  totalDocs: number;
  totalPages: number;
  currentPage: number;
}
