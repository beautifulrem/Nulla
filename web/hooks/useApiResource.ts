import { useEffect, useRef, useState } from "react";

type ApiResourceState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
};

export function useApiResource<T>(url: string | null, fallback: T, refreshMs = 0): ApiResourceState<T> {
  const [data, setData] = useState<T | null>(fallback);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [tick, setTick] = useState(0);
  const fallbackRef = useRef(fallback);

  fallbackRef.current = fallback;

  useEffect(() => {
    if (!url) {
      setData(fallbackRef.current);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    let refreshTimer: number | undefined;
    setLoading(true);

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return (await response.json()) as T;
      })
      .then((payload) => {
        if (!active) {
          return;
        }
        setData(payload);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "Unknown request error";
        setError(message);
        setData((current) => current ?? fallbackRef.current);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          if (refreshMs > 0) {
            refreshTimer = window.setTimeout(() => {
              setTick((value) => value + 1);
            }, refreshMs);
          }
        }
      });

    return () => {
      active = false;
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }
      controller.abort();
    };
  }, [refreshMs, url, tick]);

  return {
    data,
    error,
    loading,
    refresh: () => setTick((value) => value + 1),
  };
}
