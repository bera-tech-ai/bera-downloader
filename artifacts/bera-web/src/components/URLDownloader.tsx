import { useState } from "react";
import { Link2, Music, Video, Loader2, X } from "lucide-react";
import { downloadMp3, downloadMp4 } from "@/lib/api";
import { useDownloads } from "@/hooks/useDownloads";
import { QualityModal } from "@/components/QualityModal";

function isYouTubeUrl(s: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(s);
}

function extractId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : "";
}

interface Props {
  url: string;
  onClear: () => void;
}

export function URLDownloader({ url, onClear }: Props) {
  const { addDownload } = useDownloads();
  const [modal, setModal] = useState<"mp3" | "mp4" | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const videoId = extractId(url);
  const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";

  async function handleDownload(type: "mp3" | "mp4", quality: string) {
    setLoading(true);
    setMsg(null);
    try {
      const res = type === "mp3"
        ? await downloadMp3(url, quality)
        : await downloadMp4(url, quality.replace("p", ""));

      if (!res.success || !res.downloadUrl) {
        setMsg({ text: res.error || "Download failed", ok: false });
        return;
      }

      addDownload({
        title: res.title || url,
        thumbnail: res.thumbnail || thumb,
        author: res.author || "",
        duration: res.duration || "",
        type,
        quality: type === "mp3" ? quality : quality + "p",
        downloadUrl: res.downloadUrl,
        status: "completed",
        progress: 100,
        videoId,
      });

      const a = document.createElement("a");
      a.href = res.downloadUrl;
      a.download = `download.${type}`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setMsg({ text: `✓ ${type.toUpperCase()} saved to Downloads tab!`, ok: true });
      setTimeout(() => setMsg(null), 3000);
    } catch (e: unknown) {
      setMsg({ text: (e as Error).message || "Download failed", ok: false });
    } finally {
      setLoading(false);
      setModal(null);
    }
  }

  if (!isYouTubeUrl(url)) return null;

  return (
    <>
      {modal && (
        <QualityModal
          type={modal}
          title={url}
          loading={loading}
          onSelect={(q) => handleDownload(modal, q)}
          onClose={() => { setModal(null); setLoading(false); }}
        />
      )}

      <div className="mx-3 mb-4 rounded-2xl border border-[#FF4500]/40 bg-[#FF4500]/5 overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          {thumb && (
            <img src={thumb} alt="YouTube" className="w-20 h-14 rounded-xl object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#FF4500" }} />
              <p className="text-xs font-bold" style={{ color: "#FF4500" }}>YouTube URL detected</p>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{url}</p>
          </div>
          <button onClick={onClear} className="shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {msg && (
          <p className="px-4 pb-2 text-xs font-semibold" style={{ color: msg.ok ? "#22c55e" : "#ef4444" }}>
            {msg.text}
          </p>
        )}

        <div className="flex border-t border-border">
          <button
            onClick={() => setModal("mp3")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: "#FF4500" }}
          >
            {loading && modal === "mp3" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
            Download MP3
          </button>
          <button
            onClick={() => setModal("mp4")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-blue-700 hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading && modal === "mp4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            Download MP4
          </button>
        </div>
      </div>
    </>
  );
}

export { isYouTubeUrl };
