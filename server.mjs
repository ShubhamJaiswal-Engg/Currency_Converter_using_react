import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 5173;

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

async function proxyFrankfurter(req, res, upstreamPath) {
  try {
    const url = new URL(`${FRANKFURTER_BASE}${upstreamPath}`);

    for (const [key, value] of Object.entries(req.query ?? {})) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, String(v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    const upstreamRes = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    const text = await upstreamRes.text();
    res.status(upstreamRes.status);
    res.setHeader("Content-Type", upstreamRes.headers.get("content-type") ?? "application/json");
    // Cache a bit; frankfurter currencies are stable and latest rates update daily.
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(text);
  } catch (err) {
    console.error("Proxy error", err);
    res.status(502).json({ error: "Upstream API unavailable" });
  }
}

// API proxy routes (avoid browser CORS)
app.get("/frankfurter/currencies", (req, res) => proxyFrankfurter(req, res, "/currencies"));
app.get("/frankfurter/latest", (req, res) => proxyFrankfurter(req, res, "/latest"));

// Serve the Vite build
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));

// SPA fallback (if you later add routes)
app.get("*", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
