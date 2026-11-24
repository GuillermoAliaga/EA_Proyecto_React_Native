import { useCallback, useEffect, useState } from 'react';

interface FetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useFetch<T>(url: string): FetchState<T> & { refetch: () => void } {
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

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Error de solicitud: ${response.status} ${response.statusText}`);
        }
        return (await response.json()) as T;
      })
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
  }, [url, requestId]);

  return { ...state, refetch };
}
