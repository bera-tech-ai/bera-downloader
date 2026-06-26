import { useState } from "react";
import { Trash2, Play, Download, Music, Video, X } from "lucide-react";
import { useDownloads, Download as DL } from "@/hooks/useDownloads";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { VideoResult } from "@/lib/api";

function AudioPlayer({ url, onClose, title }: { url: string; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-50 mx-3">
      <div className="rounded-2xl border border-border bg-[#111] shadow-2xl p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#FF450022" }}
        >
          <Music className="w-5 h-5" style={{ color: "#FF4500" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground line-clamp-1">{title}</p>
          <audio
            src={url}
            controls
            className="w-full mt-1.5 h-8"
            style={{ accentColor: "#FF4500" }}
          />
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function dlToVideo(dl: DL): VideoResult {
  return {
    id: dl.videoId,
    title: dl.title,
    thumbnail: dl.thumbnail,
    author: dl.author,
    duration: dl.duration,
    views: "",
    uploadedAt: "",
    url: `https://www.youtube.com/watch?v=${dl.videoId}`,
  };
}

export function DownloadsPage() {
  const { downloads, removeDownload, clearCompleted } = useDownloads();
  const completed = downloads.filter(d => d.status === "completed");
  const [videoPlayer, setVideoPlayer] = useState<{ dl: DL } | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<{ dl: DL } | null>(null);

  function handlePlay(dl: DL) {
    if (dl.type === "mp4" && dl.videoId) {
      setVideoPlayer({ dl });
    } else if (dl.type === "mp3" && dl.downloadUrl) {
      setAudioPlayer({ dl });
    }
  }

  function handleBrowserDownload(dl: DL) {
    const a = document.createElement("a");
    a.href = dl.downloadUrl;
    a.download = `${dl.title.slice(0, 50)}.${dl.type}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0d0d0d" }}>
      {videoPlayer && (
        <VideoPlayerModal
          video={dlToVideo(videoPlayer.dl)}
          videoUrl=""
          onClose={() => setVideoPlayer(null)}
        />
      )}

      {audioPlayer && (
        <AudioPlayer
          url={audioPlayer.dl.downloadUrl}
          title={audioPlayer.dl.title}
          onClose={() => setAudioPlayer(null)}
        />
      )}

      <div className="px-3 pt-6 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-black text-foreground">Downloads</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {downloads.length} item{downloads.length !== 1 ? "s" : ""}
            </p>
          </div>
          {completed.length > 0 && (
            <button
              onClick={clearCompleted}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear done
            </button>
          )}
        </div>

        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#FF450015" }}
            >
              <Download className="w-9 h-9" style={{ color: "#FF4500", opacity: 0.4 }} />
            </div>
            <p className="text-lg font-black text-foreground">No Downloads Yet</p>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Go to Search, find a video, then tap <span className="font-bold" style={{ color: "#FF4500" }}>MP3</span> or <span className="font-bold text-blue-400">MP4</span> to save it here
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {downloads.map(dl => (
              <div
                key={dl.id}
                className="flex gap-3 items-center bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div className="relative shrink-0 w-[90px] h-[68px]">
                  <img
                    src={dl.thumbnail || `https://img.youtube.com/vi/${dl.videoId}/hqdefault.jpg`}
                    alt={dl.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer hover:bg-black/60 transition-colors active:bg-black/70"
                    onClick={() => handlePlay(dl)}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <span
                    className="absolute top-1 left-1 text-[9px] font-black px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: dl.type === "mp3" ? "#FF4500" : "#1565c0",
                      color: "white",
                    }}
                  >
                    {dl.type.toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0 py-2">
                  <p className="text-[13px] font-semibold text-foreground line-clamp-2 leading-tight">
                    {dl.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{dl.author}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: dl.status === "completed" ? "#22c55e" : "#ef4444" }}
                    >
                      {dl.status === "completed" ? `✓ ${dl.quality}` : dl.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pr-2 shrink-0">
                  <button
                    onClick={() => handlePlay(dl)}
                    title={dl.type === "mp3" ? "Play audio" : "Watch video"}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-primary/20 active:scale-90 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 ml-0.5" style={{ color: "#FF4500" }} />
                  </button>
                  <button
                    onClick={() => handleBrowserDownload(dl)}
                    title="Save to device"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-blue-500/20 active:scale-90 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => removeDownload(dl.id)}
                    title="Remove"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-destructive/20 active:scale-90 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
