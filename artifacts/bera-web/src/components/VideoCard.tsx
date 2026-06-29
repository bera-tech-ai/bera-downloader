import { useState } from "react";
import { Play, Music, Video, Loader2, Share2, FileText, Heart } from "lucide-react";
import { VideoResult, downloadMp3, downloadMp4, formatViews } from "@/lib/api";
import { useDownloads } from "@/hooks/useDownloads";
import { useFavorites } from "@/hooks/useFavorites";
import { useQualityPreference } from "@/hooks/useQualityPreference";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { QualityModal } from "@/components/QualityModal";
import { LyricsModal } from "@/components/LyricsModal";

interface Props {
  video: VideoResult;
  onPlay: (video: VideoResult, url: string) => void;
  compact?: boolean;
}

export function VideoCard({ video, onPlay, compact }: Props) {
  const { addDownload, updateDownload } = useDownloads();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { pref, setQuality } = useQualityPreference();
  const { playTrack } = useAudioPlayer();

  const [loading, setLoading]     = useState<"play" | "dl" | null>(null);
  const [modal, setModal]         = useState<"mp3" | "mp4" | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [dlProgress, setDlProgress] = useState(0); // 0-100
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null);
  const fav = isFavorite(video.id);

  async function handlePlay() {
    if (loading) return;
    setLoading("play");
    try {
      const res = await downloadMp4(video.url, "720");
      onPlay(video, res.success && res.downloadUrl ? res.downloadUrl : "");
    } catch {
      onPlay(video, "");
    } finally {
      setLoading(null);
    }
  }

  async function handleDownload(type: "mp3" | "mp4", quality: string) {
    setLoading("dl");
    setDlProgress(0);
    setMsg(null);
    setQuality(type, quality);

    // Add to downloads queue immediately as "downloading"
    const dlId = addDownload({
      title: video.title,
      thumbnail: video.thumbnail,
      author: video.author,
      duration: video.duration,
      type,
      quality: type === "mp3" ? quality : quality + "p",
      downloadUrl: "",
      status: "downloading",
      progress: 0,
      videoId: video.id,
    });

    // Animate progress while API call is in flight
    let tick = 0;
    const interval = setInterval(() => {
      tick += Math.random() * 12 + 4;
      setDlProgress(Math.min(tick, 88));
    }, 200);

    try {
      const res =
        type === "mp3"
          ? await downloadMp3(video.url, quality)
          : await downloadMp4(video.url, quality.replace("p", ""));

      clearInterval(interval);

      if (!res.success || !res.downloadUrl) {
        setDlProgress(0);
        updateDownload(dlId, { status: "failed", progress: 0 });
        setMsg({ text: res.error || "Download failed", ok: false });
        setTimeout(() => setMsg(null), 4000);
        return;
      }

      // Update existing queue item to completed
      updateDownload(dlId, {
        title: res.title || video.title,
        thumbnail: res.thumbnail || video.thumbnail,
        author: res.author || video.author,
        duration: res.duration || video.duration,
        downloadUrl: res.downloadUrl,
        status: "completed",
        progress: 100,
      });

      setDlProgress(100);
      setTimeout(() => setDlProgress(0), 600);

      // Trigger browser download
      const a = document.createElement("a");
      a.href = res.downloadUrl;
      a.download = `${video.title.slice(0, 50)}.${type}`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // If MP3, also offer in mini player
      if (type === "mp3") {
        playTrack({
          url: res.downloadUrl,
          title: res.title || video.title,
          thumbnail: res.thumbnail || video.thumbnail,
          author: res.author || video.author,
        });
      }

      setMsg({ text: `✓ Saved · playing in mini bar`, ok: true });
      if (type === "mp4") setMsg({ text: "✓ Saved to Downloads", ok: true });
      setTimeout(() => setMsg(null), 3000);
    } catch (e: unknown) {
      clearInterval(interval);
      setDlProgress(0);
      updateDownload(dlId, { status: "failed", progress: 0 });
      setMsg({ text: (e as Error).message || "Failed", ok: false });
      setTimeout(() => setMsg(null), 4000);
    } finally {
      setLoading(null);
      setModal(null);
    }
  }

  const thumb = video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
  const meta = [video.author, video.views && formatViews(video.views), video.uploadedAt]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {modal && (
        <QualityModal
          type={modal}
          title={video.title}
          loading={loading === "dl"}
          initialQuality={modal === "mp3" ? pref.mp3 : pref.mp4}
          onSelect={(q) => handleDownload(modal, q)}
          onClose={() => { setModal(null); setLoading(null); }}
        />
      )}
      {showLyrics && (
        <LyricsModal
          title={video.title}
          artist={video.author}
          onClose={() => setShowLyrics(false)}
        />
      )}

      <div
        className={`rounded-2xl overflow-hidden bg-card border border-border flex flex-col group transition-all hover:border-white/20 ${compact ? "text-[11px]" : ""}`}
      >
        <div
          className="relative w-full aspect-video bg-black cursor-pointer overflow-hidden"
          onClick={handlePlay}
        >
          <img
            src={thumb}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {video.duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold z-10">
              {video.duration}
            </span>
          )}
          {/* Favorite badge */}
          {fav && (
            <span className="absolute top-2 left-2 z-10">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 drop-shadow" />
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            {loading === "play" ? (
              <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-black/50 border border-white/25 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            )}
          </div>
        </div>

        <div className="p-3 flex flex-col gap-2 flex-1">
          <p className={`font-semibold text-foreground line-clamp-2 leading-snug ${compact ? "text-[12px]" : "text-[13px]"}`}>
            {video.title}
          </p>
          {meta && (
            <p className="text-[11px] text-muted-foreground line-clamp-1">{meta}</p>
          )}

          {/* Download progress bar */}
          {dlProgress > 0 && dlProgress < 100 && (
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${dlProgress}%`, backgroundColor: "#FF4500" }}
              />
            </div>
          )}

          {msg && (
            <p className="text-[11px] font-semibold" style={{ color: msg.ok ? "#22c55e" : "#ef4444" }}>
              {msg.text}
            </p>
          )}

          <div className="flex gap-1.5 mt-auto pt-0.5 flex-wrap">
            <button
              onClick={handlePlay}
              disabled={!!loading}
              title="Watch"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-40"
            >
              <Play className="w-3 h-3 fill-foreground" />
              <span className="hidden sm:inline">Play</span>
            </button>

            <button
              onClick={() => setModal("mp3")}
              disabled={!!loading}
              title="Download MP3"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white active:scale-95 transition-all disabled:opacity-40"
              style={{ backgroundColor: "#FF4500" }}
            >
              {loading === "dl" && modal === "mp3" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Music className="w-3 h-3" />
              )}
              MP3
            </button>

            <button
              onClick={() => setModal("mp4")}
              disabled={!!loading}
              title="Download MP4"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold text-white bg-blue-700 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-40"
            >
              {loading === "dl" && modal === "mp4" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Video className="w-3 h-3" />
              )}
              MP4
            </button>

            <button
              onClick={() => toggleFavorite(video)}
              title={fav ? "Remove from favorites" : "Add to favorites"}
              className={`w-8 flex items-center justify-center rounded-lg border transition-all active:scale-95 ${fav ? "border-red-500/50 bg-red-500/10" : "border-border hover:bg-muted"}`}
            >
              <Heart
                className="w-3 h-3"
                style={{ color: fav ? "#ef4444" : undefined }}
                fill={fav ? "#ef4444" : "none"}
              />
            </button>

            <button
              onClick={() => setShowLyrics(true)}
              title="View lyrics"
              className="w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <FileText className="w-3 h-3" />
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: video.title, url: video.url }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(video.url).then(() => {
                    setMsg({ text: "✓ Link copied!", ok: true });
                    setTimeout(() => setMsg(null), 2000);
                  });
                }
              }}
              disabled={!!loading}
              title="Share"
              className="w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
