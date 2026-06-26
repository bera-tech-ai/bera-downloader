import { useState } from "react";
import {
  Search, X, Loader2, Lock,
  Download, ChevronDown, Play, BookmarkPlus,
} from "lucide-react";
import { useAdultAuth } from "@/hooks/useAdultAuth";
import { useAdultDownloads } from "@/hooks/useAdultDownloads";
import { PinModal } from "@/components/PinModal";
import { AdultVideoPlayer, AdultPlayerState } from "@/components/AdultVideoPlayer";
import { searchAdult, downloadAdultVideo, AdultResult, AdultDownloadResult } from "@/lib/api";

function QualityPicker({
  files,
  onPlay,
  onSave,
  onClose,
}: {
  files: { high?: string; low?: string };
  onPlay: (url: string, label: string) => void;
  onSave: (url: string, label: string) => void;
  onClose: () => void;
}) {
  const opts: { label: string; url: string }[] = [];
  if (files.high) opts.push({ label: "HD", url: files.high });
  if (files.low)  opts.push({ label: "SD", url: files.low });

  return (
    <div className="mt-1.5 rounded-xl border border-border bg-card/90 p-2 space-y-1.5">
      {opts.map(({ label, url }) => (
        <div key={label} className="flex gap-1.5">
          <button
            onClick={() => onPlay(url, label)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white transition-colors"
            style={{ backgroundColor: "#c2185b" }}
          >
            <Play className="w-3 h-3" fill="white" />
            Play {label}
          </button>
          <button
            onClick={() => onSave(url, label)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#1a237e] hover:bg-[#283593] transition-colors"
          >
            <BookmarkPlus className="w-3 h-3" />
            Save {label}
          </button>
        </div>
      ))}
      <button
        onClick={onClose}
        className="w-full py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function AdultCard({
  item,
  index,
  onPlay,
  onSaved,
}: {
  item: AdultResult;
  index: number;
  onPlay: (state: AdultPlayerState, index: number) => void;
  onSaved: (msg: string) => void;
}) {
  const { addAdultDownload } = useAdultDownloads();
  const thumb = item.thumbnail || "";
  const meta  = [item.author, item.views && `${item.views} views`].filter(Boolean).join(" · ");

  // Separate state for Watch (plays immediately) vs Download (shows quality picker to save)
  const [watchState, setWatchState] = useState<"idle" | "loading" | "error">("idle");
  const [watchMsg, setWatchMsg]     = useState<string | null>(null);
  const [dlState, setDlState]       = useState<"idle" | "loading" | "error">("idle");
  const [dlMsg, setDlMsg]           = useState<string | null>(null);
  const [dlResult, setDlResult]     = useState<AdultDownloadResult | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function handleSave(url: string, label: string) {
    setShowPicker(false);
    addAdultDownload({
      title: item.title || "Untitled",
      thumbnail: item.thumbnail,
      duration: item.duration,
      highUrl: label === "HD" ? url : dlResult?.files?.high,
      lowUrl:  label === "SD" ? url : dlResult?.files?.low,
    });
    onSaved(`✓ Saved to Downloads (${label})`);
  }

  // Watch: fetch URLs then immediately play at best quality — no picker, no auto-save
  async function handleWatch() {
    if (watchState === "loading") return;

    if (dlResult?.files) {
      const url = dlResult.files.high || dlResult.files.low!;
      onPlay({ title: item.title || "Untitled", url, thumbnail: item.thumbnail }, index);
      return;
    }

    setWatchState("loading");
    setWatchMsg(null);
    try {
      const res = await downloadAdultVideo(item.url);
      if (!res.success || !res.files) {
        setWatchMsg(res.error || "No video available");
        setWatchState("error");
        setTimeout(() => { setWatchState("idle"); setWatchMsg(null); }, 3500);
        return;
      }
      setDlResult(res); // cache so Download button can reuse
      const url = res.files.high || res.files.low!;
      setWatchState("idle");
      onPlay({ title: item.title || "Untitled", url, thumbnail: item.thumbnail }, index);
    } catch (e: unknown) {
      setWatchMsg((e as Error).message || "Failed");
      setWatchState("error");
      setTimeout(() => { setWatchState("idle"); setWatchMsg(null); }, 3500);
    }
  }

  // Download: fetch URLs then show quality picker to save to Downloads tab
  async function handleDownload() {
    if (dlState === "loading") return;

    if (dlResult?.files) {
      setShowPicker((s) => !s);
      return;
    }

    setDlState("loading");
    setDlMsg(null);
    try {
      const res = await downloadAdultVideo(item.url);
      if (!res.success || !res.files) {
        setDlMsg(res.error || "No download available");
        setDlState("error");
        setTimeout(() => { setDlState("idle"); setDlMsg(null); }, 3500);
        return;
      }
      setDlResult(res);
      setShowPicker(true);
      setDlState("idle");
    } catch (e: unknown) {
      setDlMsg((e as Error).message || "Failed");
      setDlState("error");
      setTimeout(() => { setDlState("idle"); setDlMsg(null); }, 3500);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border flex flex-col group transition-all hover:border-white/20">
      <div
        className="relative w-full aspect-video bg-black cursor-pointer overflow-hidden"
        onClick={handleWatch}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        {item.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
            {item.duration}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-black/60 border border-white/25 flex items-center justify-center">
            <Play className="w-5 h-5 text-white" fill="white" />
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug">
          {item.title || "Untitled"}
        </p>
        {meta && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{meta}</p>
        )}

        {(watchMsg || dlMsg) && (
          <p className="text-[11px] font-semibold text-red-400">{watchMsg || dlMsg}</p>
        )}

        {showPicker && dlResult?.files && (
          <QualityPicker
            files={dlResult.files}
            onPlay={(url) => { setShowPicker(false); onPlay({ title: item.title || "Untitled", url, thumbnail: item.thumbnail }, index); }}
            onSave={handleSave}
            onClose={() => setShowPicker(false)}
          />
        )}

        <div className="mt-auto flex gap-2">
          <button
            onClick={handleWatch}
            disabled={watchState === "loading"}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-opacity active:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "#c2185b" }}
          >
            {watchState === "loading" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" fill="white" />
            )}
            {watchState === "loading" ? "Loading…" : "Watch"}
          </button>

          <button
            onClick={handleDownload}
            disabled={dlState === "loading"}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-[#1a237e] hover:bg-[#283593] active:opacity-80 transition-all disabled:opacity-50"
          >
            {dlState === "loading" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : dlResult ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {dlState === "loading" ? "Loading…" : dlResult ? "Options" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdultContent() {
  const { lock, resetPin } = useAdultAuth();
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<AdultResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [player, setPlayer]     = useState<AdultPlayerState | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loadingNav, setLoadingNav]     = useState(false);
  const [toast, setToast]       = useState<string | null>(null);

  const QUICK = ["popular", "trending", "amateur", "couple", "massage"];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function doSearch(q?: string) {
    const term = (q ?? query).trim();
    if (!term) return;
    if (q) setQuery(q);
    setLoading(true);
    setError(null);
    setSearched(true);
    setPlayer(null);
    setCurrentIndex(null);
    try {
      const data = await searchAdult(term);
      setResults(data);
    } catch (e: unknown) {
      setError((e as Error).message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function navigateTo(index: number) {
    if (index < 0 || index >= results.length || loadingNav) return;
    const item = results[index];
    setLoadingNav(true);
    try {
      const res = await downloadAdultVideo(item.url);
      if (!res.success || !res.files) {
        showToast("Could not load video");
        return;
      }
      const url = res.files.high || res.files.low!;
      setPlayer({ title: item.title || "Untitled", url, thumbnail: item.thumbnail });
      setCurrentIndex(index);
    } catch {
      showToast("Failed to load video");
    } finally {
      setLoadingNav(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d0d0d" }}>
      {player && (
        <AdultVideoPlayer
          player={player}
          onClose={() => { setPlayer(null); setCurrentIndex(null); }}
          onPrev={currentIndex != null && currentIndex > 0 ? () => navigateTo(currentIndex - 1) : undefined}
          onNext={currentIndex != null && currentIndex < results.length - 1 ? () => navigateTo(currentIndex + 1) : undefined}
          hasPrev={currentIndex != null && currentIndex > 0}
          hasNext={currentIndex != null && currentIndex < results.length - 1}
          loadingNav={loadingNav}
          currentIndex={currentIndex ?? undefined}
          total={results.length > 0 ? results.length : undefined}
        />
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-[#1a237e] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="sticky top-0 z-30 border-b border-border bg-[#0d0d0d]/95 backdrop-blur px-3 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-black" style={{ color: "#c2185b" }}>🔞 Adults Only</span>
          <div className="flex items-center gap-2">
            <button
              onClick={resetPin}
              className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset PIN
            </button>
            <button
              onClick={lock}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lock className="w-3 h-3" />
              Lock
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-input border border-border rounded-xl px-3 h-11 focus-within:border-[#c2185b]/60 transition-colors">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="Search adult content…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); setSearched(false); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => doSearch()}
            disabled={loading || !query.trim()}
            className="h-11 px-4 rounded-xl text-sm font-bold text-white disabled:opacity-40 shrink-0"
            style={{ backgroundColor: "#c2185b" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
          </button>
        </div>

        <div className="overflow-x-auto -mx-3 px-3 no-scrollbar">
          <div className="flex gap-2 w-max">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => doSearch(q)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border bg-card/80 text-muted-foreground hover:border-[#c2185b] hover:text-foreground active:scale-95 transition-all capitalize"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-3 py-4">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border animate-pulse">
                <div className="aspect-video bg-muted rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-8 bg-muted rounded-xl mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <p className="text-muted-foreground text-sm">{error}</p>
            <button
              onClick={() => doSearch()}
              className="text-sm px-4 py-2 rounded-xl text-white font-semibold"
              style={{ backgroundColor: "#c2185b" }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && searched && results.length === 0 && (
          <p className="text-center py-16 text-muted-foreground text-sm">No results found.</p>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((item, i) => (
              <AdultCard
                key={item.id || i}
                item={item}
                index={i}
                onPlay={(state, idx) => { setPlayer(state); setCurrentIndex(idx); }}
                onSaved={showToast}
              />
            ))}
          </div>
        )}

        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ backgroundColor: "#c2185b15" }}>
              🔞
            </div>
            <p className="text-lg font-black text-foreground">Adult Content</p>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Search for adult videos. Tap <span className="font-bold text-foreground">Download</span> to pick quality — then{" "}
              <span className="font-bold text-foreground">Play</span> in-app or{" "}
              <span className="font-bold text-foreground">Save</span> to the Downloads tab for offline viewing.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export function AdultPage() {
  const { hasPin, unlocked, error, createPin, verifyPin, resetPin } = useAdultAuth();

  if (!unlocked) {
    return (
      <PinModal
        mode={hasPin ? "verify" : "create"}
        error={error}
        onSubmit={hasPin ? verifyPin : createPin}
        onForgot={hasPin ? resetPin : undefined}
      />
    );
  }

  return <AdultContent />;
}
