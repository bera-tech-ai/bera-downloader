import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { VideoResult } from "@/lib/api";

const KEY = "bera_web_favorites";

interface FavoritesCtx {
  favorites: VideoResult[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (video: VideoResult) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesCtx>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  clearFavorites: () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
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
        const next = prev.some((f) => f.id === video.id)
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

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, clearFavorites }),
    [favorites, isFavorite, toggleFavorite, clearFavorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
