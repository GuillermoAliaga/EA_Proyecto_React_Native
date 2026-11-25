import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

interface FetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): FetchState<T> & { refetch: () => void } {
  const paramsKey = JSON.stringify(params);
  const [requestId, setRequestId] = useState(0);
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  const refetch = useCallback(() => setRequestId((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));

    apiClient<T>(path, { params, signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        });
      });

    return () => controller.abort();
  }, [path, paramsKey, requestId]);

  return { ...state, refetch };
}
