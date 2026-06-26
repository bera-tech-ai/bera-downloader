// CommonJS — Vercel Node.js runtime default
const API_KEY = "_0u5aff45,_0l1876s8qc";
const BASE = "https://api.gifted.co.ke/api";

// Mirror the Express router path → gifted API endpoint mapping exactly
const PATH_MAP = {
  "search":         "/search/yts",
  "download/mp3":   "/download/ytmp3",
  "download/mp4":   "/download/ytmp4v2",
  "ai/chat":        "/ai/overchat",
  "lyrics":         "/search/lyrics",
  "adult/search":   "/search/xnxxsearch",
  "adult/download": "/download/xnxxdl",
};

module.exports = async function handler(req, res) {
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

    // Adult download needs the domain swapped for the gifted API
    if (pathStr === "adult/download" && params.get("url")) {
      params.set("url", params.get("url").replace(/xnxx\.com/g, "xnxx.health"));
    }

    const url = `${BASE}${giftedPath}?${params.toString()}`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err) {
    return res.status(500).json({ error: "Proxy error", message: String(err.message) });
  }
};
