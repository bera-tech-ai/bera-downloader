import { useRef, useEffect, useState } from "react";
import {
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Download,
  SkipBack, SkipForward,
} from "lucide-react";

export interface AdultPlayerState {
  title: string;
  url: string;
  thumbnail?: string;
}

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

export function AdultVideoPlayer({
  player,
  onClose,
}: {
  player: AdultPlayerState;
  onClose: () => void;
}) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const [playing, setPlaying]         = useState(false);
  const [muted, setMuted]             = useState(false);
  const [fullscreen, setFullscreen]   = useState(false);
  const [progress, setProgress]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [speed, setSpeed]             = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      { onClose(); return; }
      if (e.key === " ")           { e.preventDefault(); togglePlay(); return; }
      if (e.key === "ArrowRight")  { skip(10); return; }
      if (e.key === "ArrowLeft")   { skip(-10); return; }
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

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
        setShowSpeedMenu(false);
      }}
    >
      <div ref={containerRef} className="relative w-full max-w-5xl px-0 sm:px-4">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-white text-sm font-semibold line-clamp-1 flex-1 pr-4">{player.title}</p>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
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
                {playing
                  ? <Pause className="w-5 h-5" fill="white" />
                  : <Play  className="w-5 h-5" fill="white" />}
              </button>

              <button
                onClick={() => skip(-10)}
                className="text-white hover:text-[#c2185b] transition-colors p-1"
                title="Back 10s"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => skip(10)}
                className="text-white hover:text-[#c2185b] transition-colors p-1"
                title="Forward 10s"
              >
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
                        className={`w-full text-xs px-3 py-2 text-left transition-colors ${
                          speed === s
                            ? "bg-[#c2185b] text-white font-semibold"
                            : "text-white/80 hover:bg-white/10"
                        }`}
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
        </div>

        <p className="text-center text-white/30 text-xs py-2">
          ← → skip 10s · Space play/pause · Esc close
        </p>
      </div>
    </div>
  );
}
