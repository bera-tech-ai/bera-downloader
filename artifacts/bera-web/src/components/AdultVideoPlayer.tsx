import { useRef, useEffect, useState } from "react";
import {
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Download,
} from "lucide-react";

export interface AdultPlayerState {
  title: string;
  url: string;
  thumbnail?: string;
}

export function AdultVideoPlayer({
  player,
  onClose,
}: {
  player: AdultPlayerState;
  onClose: () => void;
}) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const [playing, setPlaying]     = useState(false);
  const [muted, setMuted]         = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);

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

  function fmt(s: number) {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
            <div className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3" onClick={seek}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: "#c2185b" }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-[#c2185b] transition-colors">
                {playing
                  ? <Pause className="w-5 h-5" fill="white" />
                  : <Play className="w-5 h-5" fill="white" />}
              </button>
              <button onClick={toggleMute} className="text-white hover:text-[#c2185b] transition-colors">
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-white/60 text-xs tabular-nums">
                {fmt((progress / 100) * duration)} / {fmt(duration)}
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
          Click outside · Space to play/pause · Esc to close
        </p>
      </div>
    </div>
  );
}
