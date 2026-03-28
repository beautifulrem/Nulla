import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!url) {
      setData(fallback);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
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
        const message = err instanceof Error ? err.message : "Unknown request error";
        setError(message);
        setData(fallback);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fallback, url, tick]);

  useEffect(() => {
    if (!url || refreshMs <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, refreshMs);

    return () => window.clearInterval(timer);
  }, [refreshMs, url]);

  return {
    data,
    error,
    loading,
    refresh: () => setTick((value) => value + 1),
  };
}
