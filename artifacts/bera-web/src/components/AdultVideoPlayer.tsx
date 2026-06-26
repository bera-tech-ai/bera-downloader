import { useRef, useEffect, useState } from "react";
import {
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Download,
  SkipBack, SkipForward, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";

export interface AdultPlayerState {
  title: string;
  url: string;
  thumbnail?: string;
}

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

interface Props {
  player: AdultPlayerState;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  loadingNav?: boolean;
  currentIndex?: number;
  total?: number;
}

export function AdultVideoPlayer({
  player,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  loadingNav = false,
  currentIndex,
  total,
}: Props) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const [playing, setPlaying]           = useState(false);
  const [muted, setMuted]               = useState(false);
  const [fullscreen, setFullscreen]     = useState(false);
  const [progress, setProgress]         = useState(0);
  const [duration, setDuration]         = useState(0);
  const [speed, setSpeed]               = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(0);
    setDuration(0);
    setPlaying(false);
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, [player.url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")           { onClose(); return; }
      if (e.key === " ")                { e.preventDefault(); togglePlay(); return; }
      if (e.key === "ArrowRight" && !e.shiftKey) { skip(10); return; }
      if (e.key === "ArrowLeft"  && !e.shiftKey) { skip(-10); return; }
      if ((e.key === "ArrowRight" && e.shiftKey) || e.key === "n") { onNext?.(); return; }
      if ((e.key === "ArrowLeft"  && e.shiftKey) || e.key === "p") { onPrev?.(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
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
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }

  function skip(seconds: number) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  }

  function applySpeed(s: number) {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  }

  function fmt(s: number) {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  const navBtn = "flex items-center justify-center w-9 h-9 rounded-full transition-colors shrink-0";

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
        setShowSpeedMenu(false);
      }}
    >
      <div ref={containerRef} className="relative w-full max-w-5xl px-0 sm:px-4">

        <div className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={onPrev}
            disabled={!hasPrev || loadingNav}
            title="Previous video (P)"
            className={`${navBtn} ${hasPrev && !loadingNav ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white/5 text-white/20 cursor-not-allowed"}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold line-clamp-1">{player.title}</p>
            {total != null && currentIndex != null && (
              <p className="text-white/40 text-[10px] mt-0.5">{currentIndex + 1} / {total}</p>
            )}
          </div>

          {loadingNav && (
            <Loader2 className="w-4 h-4 text-[#c2185b] animate-spin shrink-0" />
          )}

          <button
            onClick={onNext}
            disabled={!hasNext || loadingNav}
            title="Next video (N)"
            className={`${navBtn} ${hasNext && !loadingNav ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white/5 text-white/20 cursor-not-allowed"}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className={`${navBtn} bg-white/10 hover:bg-white/20 text-white ml-1`}
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
          {loadingNav ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-[#c2185b] animate-spin" />
              <p className="text-white/50 text-sm">Loading next video…</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={player.url}
                poster={player.thumbnail}
                className="w-full h-full object-contain"
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => { setPlaying(false); if (hasNext) onNext?.(); }}
                onClick={togglePlay}
                playsInline
              />

              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/60 border-2 border-white/30 flex items-center justify-center">
                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                  </div>
                </div>
              )}

              {hasPrev && (
                <button
                  onClick={onPrev}
                  disabled={loadingNav}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-colors"
                  title="Previous video"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={onNext}
                  disabled={loadingNav}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-colors"
                  title="Next video"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}

          {!loadingNav && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3">
              <div
                className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-3 relative"
                onClick={seek}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: "#c2185b" }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow pointer-events-none"
                  style={{ left: `calc(${progress}% - 7px)` }}
                />
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={togglePlay} className="text-white hover:text-[#c2185b] transition-colors p-1">
                  {playing ? <Pause className="w-5 h-5" fill="white" /> : <Play className="w-5 h-5" fill="white" />}
                </button>

                <button onClick={() => skip(-10)} className="text-white hover:text-[#c2185b] transition-colors p-1" title="Back 10s">
                  <SkipBack className="w-4 h-4" />
                </button>

                <button onClick={() => skip(10)} className="text-white hover:text-[#c2185b] transition-colors p-1" title="Forward 10s">
                  <SkipForward className="w-4 h-4" />
                </button>

                <button onClick={toggleMute} className="text-white hover:text-[#c2185b] transition-colors p-1">
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <span className="text-white/60 text-xs tabular-nums hidden sm:inline">
                  {fmt((progress / 100) * duration)} / {fmt(duration)}
                </span>

                <div className="flex-1" />

                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSpeedMenu((v) => !v); }}
                    className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors min-w-[38px]"
                    title="Playback speed"
                  >
                    {speed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-10 right-0 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-2xl z-20 min-w-[72px]">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={(e) => { e.stopPropagation(); applySpeed(s); }}
                          className={`w-full text-xs px-3 py-2 text-left transition-colors ${speed === s ? "bg-[#c2185b] text-white font-semibold" : "text-white/80 hover:bg-white/10"}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href={player.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors p-1"
                  title="Save to device"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-[#c2185b] transition-colors p-1"
                  title="Fullscreen"
                >
                  {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs py-2">
          ← → skip 10s · Shift+← → prev/next · N next · P prev · Space play/pause · Esc close
        </p>
      </div>
    </div>
  );
}
