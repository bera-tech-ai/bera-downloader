import { useCallback, useEffect, useState } from "react";

const KEY = "bera_web_downloads";

export type DLStatus = "pending" | "downloading" | "completed" | "failed";
export type DLType = "mp3" | "mp4";

export interface Download {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  duration: string;
  type: DLType;
  quality: string;
  downloadUrl: string;
  status: DLStatus;
  progress: number;
  createdAt: number;
  videoId: string;
  startedAt?: number;
  speed?: string;
  eta?: string;
  fileSizeMB?: number;
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<Download[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDownloads(JSON.parse(raw));
    } catch {}
  }, []);

  const save = useCallback((items: Download[]) => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, []);

  const addDownload = useCallback(
    (dl: Omit<Download, "id" | "createdAt">): string => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
      const item: Download = { ...dl, id, createdAt: Date.now() };
      setDownloads((prev) => {
        const next = [item, ...prev];
        save(next);
        return next;
      });
      return id;
    },
    [save]
  );

  const updateDownload = useCallback(
    (id: string, updates: Partial<Download>) => {
      setDownloads((prev) => {
        const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
        save(next);
        return next;
      });
    },
    [save]
  );

  const removeDownload = useCallback(
    (id: string) => {
      setDownloads((prev) => {
        const next = prev.filter((d) => d.id !== id);
        save(next);
        return next;
      });
    },
    [save]
  );

  const clearCompleted = useCallback(() => {
    setDownloads((prev) => {
      const next = prev.filter((d) => d.status !== "completed");
      save(next);
      return next;
    });
  }, [save]);

  return { downloads, addDownload, updateDownload, removeDownload, clearCompleted };
}
