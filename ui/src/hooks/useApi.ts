import { useCallback, useEffect, useState } from 'react';
import { apiFetch, type ApiError, toApiError } from '../api/client';

interface State<T> {
  key: string;
  data?: T;
  error?: ApiError;
}

/**
 * Minimal GET hook: loading/error/data with abort on unmount or path change, plus retry.
 * Deliberately small; swap for TanStack Query if caching/background refresh is needed.
 */
export function useApi<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State<T>>({ key: '' });
  const key = `${path}#${attempt}`;

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    apiFetch<T>(path, { signal: controller.signal }).then(
      (data) => setState({ key, data }),
      (err) => {
        if (!controller.signal.aborted) setState({ key, error: toApiError(err) });
      },
    );
    return () => controller.abort();
  }, [path, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const current = state.key === key;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: path !== null && !current,
    retry,
  };
}
