import { useState, useEffect } from "react";
import { X, Loader2, Music2, AlertCircle } from "lucide-react";
import { searchLyrics, LyricsResult } from "@/lib/api";

interface Props {
  title: string;
  artist: string;
  onClose: () => void;
}

export function LyricsModal({ title, artist, onClose }: Props) {
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = artist ? `${title} ${artist}` : title;
    searchLyrics(query)
      .then((result) => {
        setLyrics(result);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError((e as Error).message || "Failed to fetch lyrics");
        setLoading(false);
      });
  }, [title, artist]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-[#111] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#FF450022" }}
          >
            <Music2 className="w-5 h-5" style={{ color: "#FF4500" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm line-clamp-1">{lyrics?.title || title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {lyrics?.artist || artist || "Lyrics"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#FF4500" }} />
              <p className="text-xs text-muted-foreground">Fetching lyrics…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground">Try searching with the exact song name.</p>
            </div>
          )}

          {lyrics && !loading && (
            <div className="space-y-4">
              {lyrics.thumbnail && (
                <img
                  src={lyrics.thumbnail}
                  alt={lyrics.title}
                  className="w-24 h-24 rounded-2xl object-cover mx-auto"
                />
              )}
              {lyrics.album && (
                <p className="text-center text-xs text-muted-foreground">{lyrics.album}</p>
              )}
              <pre className="whitespace-pre-wrap text-sm text-foreground leading-7 font-sans">
                {lyrics.lyrics}
              </pre>
              {lyrics.source && (
                <p className="text-[10px] text-muted-foreground text-center pt-2">
                  Source: {lyrics.source}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
