import { X } from "lucide-react";
import { VideoResult } from "@/lib/api";

interface Props {
  video: VideoResult;
  videoUrl: string;
  onClose: () => void;
}

export function VideoPlayerModal({ video, onClose }: Props) {
  const embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-4xl px-4">
        <div className="flex items-center justify-between pb-3">
          <p className="text-white text-sm font-medium line-clamp-1 flex-1 pr-4">
            {video.title}
          </p>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={video.title}
          />
        </div>

        <div className="pt-3 space-y-1">
          {video.author && (
            <p className="text-white/60 text-xs">{video.author}</p>
          )}
          <p className="text-white/40 text-xs">
            Click outside or press x to close
          </p>
        </div>
      </div>
    </div>
  );
}
