import { useState, useRef, useEffect } from "react";
import {
  Search, X, Loader2, Lock, ExternalLink,
  Download, ChevronDown, Play, Volume2, VolumeX,
  Maximize, Minimize, Pause,
} from "lucide-react";
import { useAdultAuth } from "@/hooks/useAdultAuth";
import { PinModal } from "@/components/PinModal";
import { searchAdult, downloadAdultVideo, AdultResult, AdultDownloadResult } from "@/lib/api";

interface PlayerState {
  title: string;
  url: string;
  thumbnail?: string;
}

function AdultPlayer({ player, onClose }: { player: PlayerState; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted]     = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
    setDuration(v.duration);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  }

  function fmtTime(s: number) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={containerRef} className="relative w-full max-w-5xl px-0 sm:px-4">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-white text-sm font-semibold line-clamp-1 flex-1 pr-4">
            {player.title}
          </p>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group">
          <video
            ref={videoRef}
            src={player.url}
            poster={player.thumbnail}
            className="w-full h-full object-contain"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            playsInline
          />

          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            {!playing && (
              <div className="w-16 h-16 rounded-full bg-black/60 border-2 border-white/30 flex items-center justify-center">
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3"
              onClick={seek}
            >
              <div
                className="h-full bg-[#c2185b] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-[#c2185b] transition-colors">
                {playing
                  ? <Pause className="w-5 h-5" fill="white" />
                  : <Play className="w-5 h-5" fill="white" />
                }
              </button>

              <button onClick={toggleMute} className="text-white hover:text-[#c2185b] transition-colors">
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <span className="text-white/60 text-xs tabular-nums">
                {fmtTime((progress / 100) * duration)} / {fmtTime(duration)}
              </span>

              <div className="flex-1" />

              <a
                href={player.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                title="Save to device"
              >
                <Download className="w-4 h-4" />
              </a>

              <button onClick={toggleFullscreen} className="text-white hover:text-[#c2185b] transition-colors">
                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs py-2">
          Click outside or press Esc to close
        </p>
      </div>
    </div>
  );
}

function QualityPicker({
  files,
  onPlay,
  onSave,
  onClose,
}: {
  files: { high?: string; low?: string };
  onPlay: (url: string, label: string) => void;
  onSave: (url: string) => void;
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
            onClick={() => onSave(url)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#1a237e] hover:bg-[#283593] transition-colors"
          >
            <Download className="w-3 h-3" />
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
  onPlay,
}: {
  item: AdultResult;
  onPlay: (state: PlayerState) => void;
}) {
  const thumb = item.thumbnail || "";
  const meta = [item.author, item.views && `${item.views} views`].filter(Boolean).join(" · ");

  const [dlState, setDlState] = useState<"idle" | "loading" | "error">("idle");
  const [dlMsg, setDlMsg]     = useState<string | null>(null);
  const [dlResult, setDlResult] = useState<AdultDownloadResult | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function openVideo() {
    if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
  }

  function handleSave(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    setShowPicker(false);
  }

  function handlePlay(url: string) {
    setShowPicker(false);
    onPlay({ title: item.title || "Untitled", url, thumbnail: item.thumbnail });
  }

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

      const keys = (["high", "low"] as const).filter((k) => !!res.files![k]);
      if (keys.length === 1) {
        const url = res.files![keys[0]]!;
        setDlState("idle");
        onPlay({ title: item.title || "Untitled", url, thumbnail: item.thumbnail });
        return;
      }

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
        onClick={openVideo}
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
            <ExternalLink className="w-5 h-5 text-white" />
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

        {dlMsg && (
          <p className="text-[11px] font-semibold text-red-400">{dlMsg}</p>
        )}

        {showPicker && dlResult?.files && (
          <QualityPicker
            files={dlResult.files}
            onPlay={handlePlay}
            onSave={handleSave}
            onClose={() => setShowPicker(false)}
          />
        )}

        <div className="mt-auto flex gap-2">
          <button
            onClick={openVideo}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: "#c2185b" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Watch
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
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<AdultResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [player, setPlayer]   = useState<PlayerState | null>(null);

  const QUICK = ["popular", "trending", "amateur", "couple", "massage"];

  async function doSearch(q?: string) {
    const term = (q ?? query).trim();
    if (!term) return;
    if (q) setQuery(q);
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchAdult(term);
      setResults(data);
    } catch (e: unknown) {
      setError((e as Error).message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d0d0d" }}>
      {player && (
        <AdultPlayer player={player} onClose={() => setPlayer(null)} />
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
              <AdultCard key={item.id || i} item={item} onPlay={setPlayer} />
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
              Search for adult videos. Tap <span className="font-bold text-foreground">Download</span> on any result to{" "}
              <span className="font-bold text-foreground">Play</span> or{" "}
              <span className="font-bold text-foreground">Save</span> in HD or SD.
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
