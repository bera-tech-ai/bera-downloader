import { VideoResult } from "@/lib/api";
import { VideoCard } from "@/components/VideoCard";
import { Loader2 } from "lucide-react";

interface Props {
  title: string;
  emoji?: string;
  videos: VideoResult[];
  loading: boolean;
  onPlay: (video: VideoResult, url: string) => void;
}

export function VideoRow({ title, emoji, videos, loading, onPlay }: Props) {
  if (!loading && videos.length === 0) return null;

  return (
    <section className="mb-7">
      <h3 className="font-bold text-foreground text-sm mb-3 px-0 flex items-center gap-2">
        {emoji && <span>{emoji}</span>}
        {title}
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-1" />}
      </h3>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-56 shrink-0 rounded-2xl bg-card border border-border animate-pulse">
              <div className="aspect-video bg-muted rounded-t-2xl" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-7 bg-muted rounded-lg mt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
          {videos.map((v, i) => (
            <div key={v.id || i} className="w-56 shrink-0 snap-start">
              <VideoCard video={v} onPlay={onPlay} compact />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
