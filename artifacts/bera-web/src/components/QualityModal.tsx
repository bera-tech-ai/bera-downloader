import { useState } from "react";
import { Music, Video, X, Loader2 } from "lucide-react";

interface Props {
  type: "mp3" | "mp4";
  title: string;
  onSelect: (quality: string) => void;
  onClose: () => void;
  loading?: boolean;
}

const MP3_QUALITIES = [
  { label: "320 kbps", sub: "Best quality", value: "320kbps" },
  { label: "256 kbps", sub: "High quality", value: "256kbps" },
  { label: "128 kbps", sub: "Standard", value: "128kbps" },
];

const MP4_QUALITIES = [
  { label: "1080p", sub: "Full HD", value: "1080" },
  { label: "720p", sub: "HD", value: "720" },
  { label: "480p", sub: "SD", value: "480" },
  { label: "360p", sub: "Low", value: "360" },
];

export function QualityModal({ type, title, onSelect, onClose, loading }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const qualities = type === "mp3" ? MP3_QUALITIES : MP4_QUALITIES;
  const Icon = type === "mp3" ? Music : Video;
  const accent = type === "mp3" ? "#FF4500" : "#1565c0";

  function handleSelect(value: string) {
    setSelected(value);
    onSelect(value);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-[#111] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: accent + "22" }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">{type.toUpperCase()} Quality</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{title}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-3 space-y-2">
          {qualities.map(q => {
            const isSelected = selected === q.value;
            return (
              <button
                key={q.value}
                onClick={() => handleSelect(q.value)}
                disabled={!!loading}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  borderColor: isSelected ? accent : "hsl(var(--border))",
                  backgroundColor: isSelected ? accent + "18" : "transparent",
                }}
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">{q.label}</p>
                  <p className="text-xs text-muted-foreground">{q.sub}</p>
                </div>
                {loading && isSelected ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: accent }} />
                ) : isSelected ? (
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: accent }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-muted-foreground pb-4">Tap a quality to start downloading</p>
      </div>
    </div>
  );
}
