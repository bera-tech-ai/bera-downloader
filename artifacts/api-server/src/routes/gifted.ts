import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const API_KEY = "_0u5aff45,_0l1876s8qc";
const BASE = "https://api.gifted.co.ke/api";

async function proxyGifted(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ apikey: API_KEY, ...params });
  const url = `${BASE}${path}?${qs.toString()}`;
  const res = await fetch(url);
  const data = await res.json();
  return { status: res.status, data };
}

router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = req.query["query"] as string;
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }
    const { status, data } = await proxyGifted("/search/yts", { query });
    res.status(status).json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/download/mp3", async (req: Request, res: Response) => {
  try {
    const url = req.query["url"] as string;
    const quality = (req.query["quality"] as string) || "128kbps";
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }
    const { status, data } = await proxyGifted("/download/ytmp3", { url, quality });
    res.status(status).json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MP3 download failed" });
  }
});

router.get("/download/mp4", async (req: Request, res: Response) => {
  try {
    const url = req.query["url"] as string;
    const quality = (req.query["quality"] as string) || "720";
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }
    const { status, data } = await proxyGifted("/download/ytmp4v2", { url, quality });
    res.status(status).json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "MP4 download failed" });
  }
});

router.get("/ai/chat", async (req: Request, res: Response) => {
  try {
    const q = req.query["q"] as string;
    const model = (req.query["model"] as string) || "deepseek";
    if (!q) {
      res.status(400).json({ error: "q is required" });
      return;
    }
    const { status, data } = await proxyGifted("/ai/overchat", { q, model });
    res.status(status).json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "AI chat failed" });
  }
});

router.get("/lyrics", async (req: Request, res: Response) => {
  try {
    const query = req.query["query"] as string;
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }
    const { status, data } = await proxyGifted("/search/lyrics", { query });
    res.status(status).json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Lyrics search failed" });
  }
});

router.get("/adult/search", async (req: Request, res: Response) => {
  try {
    const query = req.query["query"] as string;
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }
    const { status, data } = await proxyGifted("/search/xnxxsearch", { query });
    res.status(status).json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Adult search failed" });
  }
});

router.get("/adult/download", async (req: Request, res: Response) => {
  try {
    let url = req.query["url"] as string;
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }
    url = url.replace(/xnxx\.com/g, "xnxx.health");
    const { status, data } = await proxyGifted("/download/xnxxdl", { url });
    res.status(status).json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Adult download failed" });
  }
});

export default router;
