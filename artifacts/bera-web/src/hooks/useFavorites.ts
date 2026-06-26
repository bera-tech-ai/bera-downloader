import { useCallback, useEffect, useState } from "react";
import { VideoResult } from "@/lib/api";

const KEY = "bera_web_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<VideoResult[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  const save = useCallback((items: VideoResult[]) => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (video: VideoResult) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === video.id);
        const next = exists
          ? prev.filter((f) => f.id !== video.id)
          : [video, ...prev];
        save(next);
        return next;
      });
    },
    [save],
  );

  const clearFavorites = useCallback(() => {
    localStorage.removeItem(KEY);
    setFavorites([]);
  }, []);

  return { favorites, isFavorite, toggleFavorite, clearFavorites };
}
