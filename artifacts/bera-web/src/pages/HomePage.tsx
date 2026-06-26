import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, Loader2, RefreshCw, TrendingUp, LayoutGrid } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { VideoRow } from "@/components/VideoRow";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { URLDownloader, isYouTubeUrl } from "@/components/URLDownloader";
import { searchYouTube, VideoResult } from "@/lib/api";
import { useSearchHistory } from "@/hooks/useSearchHistory";

const YEAR = new Date().getFullYear();

const SECTIONS = [
  { id: "trending",   emoji: "🔥", label: "Trending Now",    query: `trending music hits ${YEAR}` },
  { id: "afrobeats",  emoji: "🎵", label: "Afrobeats",       query: `Afrobeats new songs ${YEAR}` },
  { id: "hiphop",     emoji: "🎤", label: "Hip-Hop",         query: `Hip Hop rap ${YEAR}` },
  { id: "amapiano",   emoji: "🎹", label: "Amapiano",        query: `Amapiano mix ${YEAR}` },
  { id: "gospel",     emoji: "🙏", label: "Gospel",          query: `Gospel worship songs ${YEAR}` },
  { id: "rnb",        emoji: "❤️", label: "R&B / Soul",      query: `RnB soul music ${YEAR}` },
];

const CATEGORY_CHIPS = [
  { label: "🔥 Trending",    query: `trending music ${YEAR}` },
  { label: "🎵 Afrobeats",   query: `Afrobeats ${YEAR}` },
  { label: "🎤 Hip-Hop",     query: `Hip Hop ${YEAR}` },
  { label: "🎹 Amapiano",    query: `Amapiano mix ${YEAR}` },
  { label: "🙏 Gospel",      query: `Gospel ${YEAR}` },
  { label: "⭐ Pop",         query: `top pop ${YEAR}` },
  { label: "🇹🇿 Bongo",      query: `Bongo flava ${YEAR}` },
  { label: "❤️ R&B",        query: `RnB ${YEAR}` },
  { label: "💪 Workout",     query: "gym workout music mix" },
  { label: "🎸 Rock",        query: `rock hits ${YEAR}` },
  { label: "🌙 Chill",       query: `chill lofi ${YEAR}` },
  { label: "🕺 Dance",       query: `dance music ${YEAR}` },
];

type SectionData = Record<string, { videos: VideoResult[]; loading: boolean }>;

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card border border-border animate-pulse">
          <div className="aspect-video bg-muted rounded-t-2xl" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="flex gap-2 mt-1">
              <div className="h-7 bg-muted rounded-lg flex-1" />
              <div className="h-7 bg-muted rounded-lg flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { history, push, clear } = useSearchHistory();
  const [query, setQuery]             = useState("");
  const [searchResults, setResults]   = useState<VideoResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [isSearchMode, setSearchMode] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [player, setPlayer]           = useState<{ video: VideoResult; url: string } | null>(null);
  const [view, setView]               = useState<"sections" | "grid">("sections");
  const [sections, setSections]       = useState<SectionData>(() =>
    Object.fromEntries(SECTIONS.map(s => [s.id, { videos: [], loading: true }]))
  );
  const hasLoaded = useRef(false);
  const inputRef  = useRef<HTMLInputElement>(null);

  const loadSections = useCallback(async () => {
    setSections(Object.fromEntries(SECTIONS.map(s => [s.id, { videos: [], loading: true }])));
    await Promise.allSettled(
      SECTIONS.map(async sec => {
        try {
          const videos = await searchYouTube(sec.query);
          setSections(prev => ({ ...prev, [sec.id]: { videos, loading: false } }));
        } catch {
          setSections(prev => ({ ...prev, [sec.id]: { videos: [], loading: false } }));
        }
      })
    );
  }, []);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadSections();
  }, [loadSections]);

  async function handleSearch(q?: string) {
    const term = (q ?? query).trim();
    if (!term) return;
    if (q) setQuery(q);
    setSearchMode(true);
    setSearching(true);
    setSearchError(null);
    push(term);
    try {
      const data = await searchYouTube(term);
      setResults(data);
    } catch (e: unknown) {
      setSearchError((e as Error).message || "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  function exitSearch() {
    setSearchMode(false);
    setQuery("");
    setResults([]);
    setSearchError(null);
  }

  const ytUrl = isYouTubeUrl(query);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d0d0d" }}>
      {player && (
        <VideoPlayerModal video={player.video} videoUrl={player.url} onClose={() => setPlayer(null)} />
      )}

      <header className="sticky top-0 z-30 border-b border-border bg-[#0d0d0d]/95 backdrop-blur">
        <div className="px-3 pt-3 pb-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <button onClick={exitSearch} className="text-lg font-black tracking-tight">
              <span style={{ color: "#FF4500" }}>BERA</span>
              <span className="text-foreground"> Downloader</span>
            </button>
            <div className="flex items-center gap-2">
              {!isSearchMode && (
                <>
                  <button
                    onClick={() => setView(v => v === "sections" ? "grid" : "sections")}
                    title="Toggle view"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={loadSections}
                    title="Refresh"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              )}
              {isSearchMode && (
                <button
                  onClick={exitSearch}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-input border border-border rounded-xl px-3 h-11 focus-within:border-primary/60 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !ytUrl) handleSearch();
                  if (e.key === "Escape") exitSearch();
                }}
                placeholder="Search or paste a YouTube link..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {query && (
                <button onClick={() => { setQuery(""); exitSearch(); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            {!ytUrl && (
              <button
                onClick={() => handleSearch()}
                disabled={searching || !query.trim()}
                className="h-11 px-4 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40 shrink-0"
                style={{ backgroundColor: "#FF4500" }}
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
              </button>
            )}
          </div>

          {!isSearchMode && (
            <div className="overflow-x-auto -mx-3 px-3 no-scrollbar">
              <div className="flex gap-2 w-max pb-1">
                {CATEGORY_CHIPS.map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => handleSearch(cat.query)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border bg-card/80 text-muted-foreground hover:border-primary hover:text-foreground active:scale-95 transition-all font-medium"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {ytUrl && (
        <div className="pt-3">
          <URLDownloader url={query} onClear={exitSearch} />
        </div>
      )}

      <main className="flex-1 px-3 py-4">
        {isSearchMode && !ytUrl && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-base">
                Results for <span style={{ color: "#FF4500" }}>"{query}"</span>
              </h2>
              {!searching && searchResults.length > 0 && (
                <span className="text-xs text-muted-foreground">{searchResults.length} videos</span>
              )}
            </div>

            {searching ? (
              <SearchSkeleton />
            ) : searchError ? (
              <div className="flex flex-col items-center py-16 gap-3 text-center">
                <p className="text-muted-foreground text-sm">{searchError}</p>
                <button
                  onClick={() => handleSearch()}
                  className="text-sm px-4 py-2 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: "#FF4500" }}
                >Retry</button>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map((v, i) => (
                  <VideoCard key={v.id || i} video={v} onPlay={(v, u) => setPlayer({ video: v, url: u })} />
                ))}
              </div>
            ) : (
              <p className="text-center py-16 text-muted-foreground text-sm">No results found.</p>
            )}
          </>
        )}

        {!isSearchMode && !ytUrl && (
          <>
            {history.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent</span>
                  <button onClick={clear} className="text-xs font-semibold" style={{ color: "#FF4500" }}>Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.slice(0, 6).map(term => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "sections" ? (
              SECTIONS.map(sec => (
                <VideoRow
                  key={sec.id}
                  title={sec.label}
                  emoji={sec.emoji}
                  videos={sections[sec.id]?.videos ?? []}
                  loading={sections[sec.id]?.loading ?? true}
                  onPlay={(v, u) => setPlayer({ video: v, url: u })}
                />
              ))
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" style={{ color: "#FF4500" }} />
                  <h2 className="font-bold text-foreground">All Trending</h2>
                </div>
                {Object.values(sections).some(s => s.loading) ? (
                  <SearchSkeleton />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.values(sections)
                      .flatMap(s => s.videos)
                      .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
                      .map((v, i) => (
                        <VideoCard key={v.id || i} video={v} onPlay={(v, u) => setPlayer({ video: v, url: u })} />
                      ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="h-6" />
      </main>
    </div>
  );
}
