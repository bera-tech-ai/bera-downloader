import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  currentTime: number;
  duration: number;
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
  currentTime: 0,
  duration: 0,
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

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync audio element to state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      // auto-advance
      setQueueIndex((i) => {
        if (queue.length > 0 && i < queue.length - 1) return i + 1;
        return i;
      });
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [queue]);

  // Load track when queueIndex changes
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
    // Effect above will fire and set src + play
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    setTrack(null);
    setQueue([]);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const next = useCallback(() => {
    setQueueIndex((i) => Math.min(i + 1, queue.length - 1));
  }, [queue.length]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setQueueIndex((i) => Math.max(i - 1, 0));
  }, []);

  const hasNext = queueIndex < queue.length - 1;
  const hasPrev = queueIndex > 0 || (audioRef.current?.currentTime ?? 0) > 3;

  return (
    <AudioPlayerContext.Provider
      value={{ track, playing, currentTime, duration, playTrack, togglePlay, seek, close, next, prev, hasNext, hasPrev }}
    >
      <audio ref={audioRef} style={{ display: "none" }} />
      {children}
      {track && <MiniPlayer />}
    </AudioPlayerContext.Provider>
  );
}

function MiniPlayer() {
  const { track, playing, currentTime, duration, togglePlay, seek, close, next, prev, hasNext, hasPrev } =
    useAudioPlayer();
  if (!track) return null;

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-2 pb-1">
      <div className="rounded-2xl border border-border bg-[#111]/98 backdrop-blur shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-0.5 bg-muted w-full">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: "#FF4500" }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Thumbnail */}
          {track.thumbnail ? (
            <img
              src={track.thumbnail}
              alt={track.title}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#FF450022" }}
            >
              <Music className="w-5 h-5" style={{ color: "#FF4500" }} />
            </div>
          )}

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-foreground truncate">{track.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {track.author || (duration > 0 ? `${fmt(currentTime)} / ${fmt(duration)}` : "Loading…")}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={prev}
              disabled={!hasPrev}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white transition-colors active:scale-90"
              style={{ backgroundColor: "#FF4500" }}
            >
              {playing ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>
            <button
              onClick={next}
              disabled={!hasNext}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={close}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrubber */}
        {duration > 0 && (
          <div className="px-3 pb-2.5">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.5}
              value={currentTime}
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
