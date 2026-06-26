const BASE = "/api/gifted";

export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  duration: string;
  views: string;
  uploadedAt: string;
  url: string;
}

export interface DownloadResult {
  success: boolean;
  downloadUrl?: string;
  title?: string;
  thumbnail?: string;
  author?: string;
  duration?: string;
  error?: string;
}

export interface LyricsResult {
  title: string;
  artist: string;
  album?: string;
  thumbnail?: string;
  lyrics: string;
  source?: string;
}

export interface AdultResult {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  duration?: string;
  views?: string;
  author?: string;
}

function safeStr(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    return (o.name as string) || (o.timestamp as string) || "";
  }
  return "";
}

function parseVideo(item: Record<string, unknown>): VideoResult {
  const id = safeStr(item.videoId) || safeStr(item.id);
  const thumbnail =
    safeStr(item.image) ||
    safeStr(item.thumbnail) ||
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const url =
    typeof item.url === "string" && item.url.startsWith("http")
      ? item.url
      : `https://www.youtube.com/watch?v=${id}`;
  return {
    id,
    title: safeStr(item.title) || safeStr(item.name),
    thumbnail,
    author: safeStr(item.author) || safeStr(item.channel),
    duration: safeStr(item.duration) || safeStr(item.timestamp),
    views: safeStr(item.views) || safeStr(item.viewCount),
    uploadedAt: safeStr(item.ago) || safeStr(item.uploadedAt),
    url,
  };
}

function isVideo(item: Record<string, unknown>): boolean {
  return item.type === "video" || !!item.videoId;
}

export async function searchYouTube(query: string): Promise<VideoResult[]> {
  const res = await fetch(`${BASE}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  const results: Record<string, unknown>[] = data.results || [];
  return results.filter(isVideo).map(parseVideo);
}

export async function downloadMp3(videoUrl: string, quality = "128kbps"): Promise<DownloadResult> {
  const res = await fetch(
    `${BASE}/download/mp3?url=${encodeURIComponent(videoUrl)}&quality=${quality}`
  );
  if (!res.ok) return { success: false, error: `Server error ${res.status}` };
  const data = await res.json();
  const result = data.result || data;
  const downloadUrl =
    result.download_url || result.downloadUrl || result.url || data.download_url || data.url;
  if (!downloadUrl) return { success: false, error: "No download URL in response" };
  return {
    success: true,
    downloadUrl,
    title: safeStr(result.title) || safeStr(data.title),
    thumbnail: safeStr(result.thumbnail) || safeStr(result.image) || safeStr(data.thumbnail),
    author: safeStr(result.author) || safeStr(data.author),
    duration: safeStr(result.duration) || safeStr(data.duration),
  };
}

export async function downloadMp4(videoUrl: string, quality = "720"): Promise<DownloadResult> {
  const res = await fetch(
    `${BASE}/download/mp4?url=${encodeURIComponent(videoUrl)}&quality=${quality}`
  );
  if (!res.ok) return { success: false, error: `Server error ${res.status}` };
  const data = await res.json();
  const result = data.result || data;
  const downloadUrl =
    result.download_url || result.downloadUrl || result.url || data.download_url || data.url;
  if (!downloadUrl) return { success: false, error: "No download URL in response" };
  return {
    success: true,
    downloadUrl,
    title: safeStr(result.title) || safeStr(data.title),
    thumbnail: safeStr(result.thumbnail) || safeStr(result.image) || safeStr(data.thumbnail),
    author: safeStr(result.author) || safeStr(data.author),
    duration: safeStr(result.duration) || safeStr(data.duration),
  };
}

export async function aiChat(message: string): Promise<string> {
  const res = await fetch(
    `${BASE}/ai/chat?q=${encodeURIComponent(message)}`
  );
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json();
  return data.result || data.response || data.message || "No response";
}

export async function searchLyrics(query: string): Promise<LyricsResult> {
  const res = await fetch(`${BASE}/lyrics?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Lyrics error ${res.status}`);
  const data = await res.json();

  const item = data.result || data;
  const lyrics =
    safeStr(item.lyrics) ||
    safeStr(item.lyric) ||
    safeStr(data.lyrics) ||
    safeStr(data.lyric);

  if (!lyrics) throw new Error("Lyrics not found for this track");

  return {
    title: safeStr(item.title) || safeStr(data.title) || query,
    artist: safeStr(item.artist) || safeStr(item.author) || safeStr(data.artist) || "",
    album: safeStr(item.album) || safeStr(data.album) || "",
    thumbnail:
      safeStr(item.thumbnail) ||
      safeStr(item.image) ||
      safeStr(data.thumbnail) ||
      "",
    lyrics,
    source: safeStr(item.source) || safeStr(data.source) || "",
  };
}

export async function searchAdult(query: string): Promise<AdultResult[]> {
  const res = await fetch(`${BASE}/adult/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Adult search error ${res.status}`);
  const data = await res.json();

  const results: Record<string, unknown>[] = data.results || data.videos || data.data || [];
  return results.map((item) => ({
    id: safeStr(item.id) || safeStr(item.videoId),
    title: safeStr(item.title) || safeStr(item.name),
    thumbnail: safeStr(item.thumbnail) || safeStr(item.image) || safeStr(item.thumb),
    url: safeStr(item.url) || safeStr(item.link),
    duration: safeStr(item.duration) || safeStr(item.timestamp),
    views: safeStr(item.views) || safeStr(item.viewCount),
    author: safeStr(item.author) || safeStr(item.channel),
  }));
}

export function formatViews(v: string): string {
  const n = parseInt(v.replace(/,/g, ""), 10);
  if (isNaN(n)) return v;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K views`;
  return `${n} views`;
}
