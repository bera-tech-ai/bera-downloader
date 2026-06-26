import { useState, useEffect, useRef } from "react";
import { X, Loader2, Music2, AlertCircle, Search } from "lucide-react";
import { searchLyrics, LyricsResult } from "@/lib/api";

interface Props {
  title: string;
  artist: string;
  onClose: () => void;
}

export function LyricsModal({ title, artist, onClose }: Props) {
  const initialQuery = artist ? `${title} ${artist}` : title;

  const [query, setQuery]       = useState(initialQuery);
  const [inputVal, setInputVal] = useState(initialQuery);
  const [lyrics, setLyrics]     = useState<LyricsResult | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  function doSearch(q: string) {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    setInputVal(term);
    setLoading(true);
    setError(null);
    setLyrics(null);
  }

  useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchLyrics(query)
      .then((result) => {
        if (!cancelled) { setLyrics(result); setLoading(false); }
      })
      .catch((e: unknown) => {
        if (!cancelled) { setError((e as Error).message || "Failed to fetch lyrics"); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-[#111] shadow-2xl overflow-hidden">

        <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#FF450022" }}
          >
            <Music2 className="w-4 h-4" style={{ color: "#FF4500" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm line-clamp-1">
              {lyrics?.title || title || "Lyrics"}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {lyrics?.artist || artist || "Search below for any song"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-input border border-border rounded-xl px-3 h-10 focus-within:border-primary/60 transition-colors">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doSearch(inputVal);
                }}
                placeholder="Artist · Song name…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {inputVal && inputVal !== query && (
                <button
                  onClick={() => { setInputVal(initialQuery); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => doSearch(inputVal)}
              disabled={loading || !inputVal.trim()}
              className="h-10 px-4 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40 shrink-0"
              style={{ backgroundColor: "#FF4500" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#FF4500" }} />
              <p className="text-xs text-muted-foreground">Fetching lyrics…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground">
                Try typing the exact <span className="text-foreground font-medium">artist + song name</span> in the search bar above.
              </p>
            </div>
          )}

          {lyrics && !loading && (
            <div className="space-y-4">
              {lyrics.thumbnail && (
                <img
                  src={lyrics.thumbnail}
                  alt={lyrics.title}
                  className="w-24 h-24 rounded-2xl object-cover mx-auto shadow-lg"
                />
              )}
              {lyrics.album && (
                <p className="text-center text-xs text-muted-foreground">{lyrics.album}</p>
              )}
              <pre className="whitespace-pre-wrap text-sm text-foreground leading-7 font-sans">
                {lyrics.lyrics}
              </pre>
              {lyrics.source && (
                <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border">
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
