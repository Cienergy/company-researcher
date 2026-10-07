import { useCallback, useEffect, useState } from "react";
import type { Dossiers, Feed, Framework } from "./types";

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(`${path}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json() as Promise<T>;
}

export function useDossiers() {
  const [data, setData] = useState<Dossiers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const d = await loadJson<Dossiers>(`${import.meta.env.BASE_URL}data/dossiers.json`);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dossiers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useFeed() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const refresh = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      setError(null);
      const d = await loadJson<Feed>(`${import.meta.env.BASE_URL}data/feed.json`);
      setFeed(d);
      setLastFetch(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { feed, loading, refreshing, error, refresh, lastFetch };
}

export function useFramework() {
  const [data, setData] = useState<Framework | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await loadJson<Framework>(`${import.meta.env.BASE_URL}data/framework.json`));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load framework");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error };
}
