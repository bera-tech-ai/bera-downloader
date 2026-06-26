import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Music, Pause, Play, X, ChevronLeft, ChevronRight } from "lucide-react";

export interface Track {
  url: string;
  title: string;
  thumbnail?: string;
  author?: string;
}

interface AudioPlayerCtx {
  track: Track | null;
  playing: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  seek: (t: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const AudioPlayerContext = createContext<AudioPlayerCtx>({
  track: null,
  playing: false,
  audioRef: { current: null },
  playTrack: () => {},
  togglePlay: () => {},
  seek: () => {},
  close: () => {},
  next: () => {},
  prev: () => {},
  hasNext: false,
  hasPrev: false,
});

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}

// ─── MiniPlayer ──────────────────────────────────────────────────────────────
// Subscribes to audio events locally so only it re-renders on timeupdate.
function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function MiniPlayer() {
  const { track, playing, audioRef, togglePlay, seek, close, next, prev, hasNext, hasPrev } =
    useAudioPlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Attach high-frequency audio listeners locally — does NOT propagate up
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur  = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    // Sync immediately on mount
    setCurrentTime(audio.currentTime);
    setDuration(isFinite(audio.duration) ? audio.duration : 0);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
    };
  }, [audioRef, track]); // re-attach when track changes

  if (!track) return null;

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-2 pb-1">
      <div className="rounded-2xl border border-border bg-[#111]/98 backdrop-blur shadow-2xl overflow-hidden">
        {/* Thin progress bar at top */}
        <div className="h-0.5 bg-muted w-full">
          <div
            className="h-full"
            style={{ width: `${pct}%`, backgroundColor: "#FF4500", transition: "width 0.3s linear" }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#FF450022" }}>
              <Music className="w-5 h-5" style={{ color: "#FF4500" }} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-foreground truncate">{track.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {track.author
                ? track.author
                : duration > 0
                ? `${fmt(currentTime)} / ${fmt(duration)}`
                : "Loading…"}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={prev} disabled={!hasPrev} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white active:scale-90 transition-all"
              style={{ backgroundColor: "#FF4500" }}
            >
              {playing
                ? <Pause className="w-4 h-4 fill-white" />
                : <Play  className="w-4 h-4 fill-white ml-0.5" />}
            </button>
            <button onClick={next} disabled={!hasNext} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {duration > 0 && (
          <div className="px-3 pb-2.5">
            <input
              type="range" min={0} max={duration} step={0.5} value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 accent-[#FF4500] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Low-frequency state only — not currentTime/duration
  const [track,      setTrack]      = useState<Track | null>(null);
  const [queue,      setQueue]      = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [playing,    setPlaying]    = useState(false);

  // Attach lifecycle listeners (not timeupdate — that's MiniPlayer's job)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay   = () => setPlaying(true);
    const onPause  = () => setPlaying(false);
    const onEnded  = () => {
      setPlaying(false);
      setQueueIndex((i) => (i < queue.length - 1 ? i + 1 : i));
    };
    audio.addEventListener("play",  onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play",  onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [queue.length]);

  // Load + play when queueIndex / queue changes
  useEffect(() => {
    if (queue.length === 0) return;
    const t = queue[queueIndex];
    setTrack(t);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = t.url;
    audio.load();
    audio.play().catch(() => {});
  }, [queueIndex, queue]);

  const playTrack = useCallback((t: Track, q?: Track[]) => {
    const fullQueue = q && q.length > 0 ? q : [t];
    const idx = fullQueue.findIndex((x) => x.url === t.url);
    setQueue(fullQueue);
    setQueueIndex(idx >= 0 ? idx : 0);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.paused ? audio.play().catch(() => {}) : audio.pause();
  }, []);

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = t;
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    setTrack(null);
    setQueue([]);
    setPlaying(false);
  }, []);

  const next = useCallback(() => setQueueIndex((i) => Math.min(i + 1, queue.length - 1)), [queue.length]);
  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    setQueueIndex((i) => Math.max(i - 1, 0));
  }, []);

  const hasNext = queueIndex < queue.length - 1;
  const hasPrev = queueIndex > 0;

  const value = useMemo(
    () => ({ track, playing, audioRef, playTrack, togglePlay, seek, close, next, prev, hasNext, hasPrev }),
    [track, playing, audioRef, playTrack, togglePlay, seek, close, next, prev, hasNext, hasPrev],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      <audio ref={audioRef} style={{ display: "none" }} />
      {children}
      {track && <MiniPlayer />}
    </AudioPlayerContext.Provider>
  );
}
