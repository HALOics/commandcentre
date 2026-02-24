import http from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbApiMiddleware } from "./server/dbApi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function sendNotFound(res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not found" }));
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";
  res.statusCode = 200;
  res.setHeader("Content-Type", mime);
  createReadStream(filePath).pipe(res);
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
  const pathname = decodeURIComponent(requestUrl.pathname);
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(distDir, normalized.replace(/^\/+/, ""));

  if (!filePath.startsWith(distDir)) {
    sendNotFound(res);
    return;
  }

  try {
    const info = await stat(filePath);
    if (info.isFile()) {
      serveFile(filePath, res);
      return;
    }
  } catch {
    // Fall through to SPA fallback
  }

  const indexPath = path.join(distDir, "index.html");
  if (!existsSync(indexPath)) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Build output missing. Run npm run build first." }));
    return;
  }

  serveFile(indexPath, res);
}

const apiMiddleware = dbApiMiddleware();

const server = http.createServer(async (req, res) => {
  apiMiddleware(req, res, () => {
    serveStatic(req, res).catch((error) => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Server error" }));
    });
  });
});

const port = Number.parseInt(process.env.PORT || "8080", 10);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`HALO server listening on port ${port}`);
});
