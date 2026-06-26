const API_KEY = "_0u5aff45,_0l1876s8qc";
const BASE = "https://api.gifted.co.ke/api";

// Mirror the exact path mappings from the Express router
const PATH_MAP = {
  "search":          "/search/yts",
  "download/mp3":    "/download/ytmp3",
  "download/mp4":    "/download/ytmp4v2",
  "ai/chat":         "/ai/overchat",
  "lyrics":          "/search/lyrics",
  "adult/search":    "/search/xnxxsearch",
  "adult/download":  "/download/xnxxdl",
};

export default async function handler(req, res) {
  try {
    const { path: pathSegments, ...queryParams } = req.query;
    const pathStr = Array.isArray(pathSegments)
      ? pathSegments.join("/")
      : (pathSegments || "");

    const giftedPath = PATH_MAP[pathStr];
    if (!giftedPath) {
      return res.status(404).json({ error: `Unknown endpoint: ${pathStr}` });
    }

    const params = new URLSearchParams({ apikey: API_KEY });
    for (const [k, v] of Object.entries(queryParams)) {
      if (typeof v === "string") params.set(k, v);
    }

    // For adult/download, swap the domain so the gifted API can resolve it
    if (pathStr === "adult/download" && params.get("url")) {
      params.set("url", params.get("url").replace(/xnxx\.com/g, "xnxx.health"));
    }

    const url = `${BASE}${giftedPath}?${params.toString()}`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (err) {
    res.status(500).json({ error: "Proxy error", message: err.message });
  }
}
