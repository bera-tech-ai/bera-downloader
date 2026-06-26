import { useCallback, useEffect, useState } from "react";

const KEY = "bera_adult_downloads";

export interface AdultDownload {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  highUrl?: string;
  lowUrl?: string;
  savedAt: number;
}

export function useAdultDownloads() {
  const [adultDownloads, setAdultDownloads] = useState<AdultDownload[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setAdultDownloads(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((items: AdultDownload[]) => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, []);

  const addAdultDownload = useCallback(
    (dl: Omit<AdultDownload, "id" | "savedAt">): string => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
      const item: AdultDownload = { ...dl, id, savedAt: Date.now() };
      setAdultDownloads((prev) => {
        const next = [item, ...prev];
        persist(next);
        return next;
      });
      return id;
    },
    [persist]
  );

  const removeAdultDownload = useCallback(
    (id: string) => {
      setAdultDownloads((prev) => {
        const next = prev.filter((d) => d.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearAdultDownloads = useCallback(() => {
    setAdultDownloads([]);
    localStorage.removeItem(KEY);
  }, []);

  return { adultDownloads, addAdultDownload, removeAdultDownload, clearAdultDownloads };
}
