import express from "express";
import cors from "cors";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRateLimiter, assertPublicHost, validateMediaUrl } from "./lib/security.js";
import { fetchVideoInfo, fetchDirectInfo, runYtdlp, ytdlpBaseArgs, FFMPEG_PATH } from "./lib/ytdlp.js";
import {
  cancelJob,
  cleanupStaleJobs,
  getJob,
  getJobCount,
  publicJob,
  scheduleFileCleanup,
  shutdownJobs,
  startJob,
} from "./lib/jobs.js";
import { getRecent, getStats, initStore } from "./lib/store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 5000);
const ORIGIN = process.env.PUBLIC_ORIGIN || "*";

app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(
  cors({
    origin: ORIGIN === "*" ? true : ORIGIN.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});

const infoLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
const downloadLimiter = createRateLimiter({ windowMs: 60_000, max: 12 });

const infoCache = new Map();
const INFO_TTL = 10 * 60 * 1000;

function fail(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function pickErrorMessage(error) {
  return error?.message && error.message.length < 400
    ? error.message
    : "Something went wrong while processing that link.";
}

app.get("/api/health", async (_req, res) => {
  const checks = { server: true, ffmpeg: fs.existsSync(FFMPEG_PATH), ytdlp: false, version: null };
  try {
    const { stdout } = await runYtdlp([...ytdlpBaseArgs(), "--version"], { timeout: 15_000 });
    checks.ytdlp = true;
    checks.version = stdout.trim().split(/\r?\n/).at(-1) || null;
  } catch {
    checks.ytdlp = false;
  }
  const healthy = checks.server && checks.ffmpeg && checks.ytdlp;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "operational" : "degraded",
    checks,
    uptime: Math.round(process.uptime()),
    activeJobs: getJobCount(),
    timestamp: Date.now(),
  });
});

app.get("/api/stats", (_req, res) => {
  res.json({ ...getStats(), activeJobs: getJobCount(), uptime: Math.round(process.uptime()) });
});

app.get("/api/recent", (req, res) => {
  const limit = Number(req.query.limit) || 12;
  res.json({ items: getRecent(limit) });
});

app.post("/api/info", infoLimiter, async (req, res) => {
  const validation = validateMediaUrl(req.body?.url);
  if (!validation.ok) return fail(res, 400, "invalid_url", validation.message);
  const url = validation.url;

  const cached = infoCache.get(url);
  if (cached && Date.now() - cached.at < INFO_TTL) {
    return res.json({ ...cached.data, cached: true });
  }

  try {
    const hostname = new URL(url).hostname;
    await assertPublicHost(hostname);

    let info;
    try {
      info = await fetchVideoInfo(url);
    } catch (error) {
      const looksDirect = /\.(mp4|webm|mov|m4v|mp3|m4a|wav)(\?|$)/i.test(url);
      if (looksDirect) {
        info = await fetchDirectInfo(url);
      } else {
        throw error;
      }
    }

    infoCache.set(url, { at: Date.now(), data: info });
    if (infoCache.size > 200) {
      const oldest = [...infoCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (oldest) infoCache.delete(oldest[0]);
    }
    res.json(info);
  } catch (error) {
    res.status(422).json({
      error: {
        code: "extract_failed",
        message: pickErrorMessage(error),
      },
    });
  }
});

app.post("/api/download", downloadLimiter, async (req, res) => {
  const body = req.body || {};
  const validation = validateMediaUrl(body.url);
  if (!validation.ok) return fail(res, 400, "invalid_url", validation.message);

  const type = body.type === "audio" ? "audio" : "video";
  const format = type === "audio" ? (body.format === "m4a" ? "m4a" : "mp3") : "mp4";
  const height = Number(body.height) || 0;
  if (type === "video" && height > 0 && (height < 120 || height > 4320)) {
    return fail(res, 400, "invalid_quality", "That video quality isn't supported.");
  }

  try {
    await assertPublicHost(new URL(validation.url).hostname);
    const job = await startJob({
      url: validation.url,
      title: String(body.title || "video").slice(0, 200),
      thumbnail: String(body.thumbnail || "").slice(0, 2000),
      platform: String(body.platform || "Direct").slice(0, 40),
      type,
      height,
      quality: String(body.quality || "").slice(0, 40),
      format,
      direct: Boolean(body.direct),
      duration: Number(body.duration) || 0,
    });
    res.status(202).json(job);
  } catch (error) {
    const status = error?.status || 422;
    res.status(status).json({
      error: {
        code: status === 429 ? "busy" : "download_failed",
        message: pickErrorMessage(error),
      },
    });
  }
});

app.get("/api/download/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return fail(res, 404, "not_found", "That download session has expired.");
  res.json(publicJob(job));
});

app.get("/api/download/:id/file", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return fail(res, 404, "not_found", "That download session has expired.");
  if (job.status !== "completed" || !job.filePath) {
    return fail(res, 409, "not_ready", "This file isn't ready yet.");
  }
  if (!fs.existsSync(job.filePath)) {
    return fail(res, 410, "expired", "This file has expired. Please start the download again.");
  }

  const mime =
    job.format === "mp3"
      ? "audio/mpeg"
      : job.format === "m4a"
        ? "audio/mp4"
        : "video/mp4";

  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Length", String(job.sizeBytes || 0));
  res.setHeader("Cache-Control", "no-store");
  res.download(job.filePath, job.filename || `video.${job.format}`, (error) => {
    if (error && !res.headersSent) {
      fail(res, 500, "transfer_failed", "We couldn't send that file.");
    }
    scheduleFileCleanup(job);
  });
});

app.delete("/api/download/:id", async (req, res) => {
  const result = await cancelJob(req.params.id);
  if (!result) return fail(res, 404, "not_found", "That download session has expired.");
  res.json(result);
});

// Serve the production build when it exists.
const dist = path.resolve(here, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: "1h", index: false }));
  app.use(async (req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    try {
      await fsp.access(path.join(dist, "index.html"));
      res.sendFile(path.join(dist, "index.html"));
    } catch {
      next();
    }
  });
}

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return fail(res, 404, "not_found", "That API route doesn't exist.");
  }
  res.status(404).send("Not found");
});

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.too.large") {
    return fail(res, 413, "too_large", "That request is too large.");
  }
  console.error("[api]", error?.message || error);
  return fail(res, 500, "server_error", "Something went wrong on our side.");
});

const server = app.listen(PORT, () => {
  console.log(`VidPlex API listening on http://localhost:${PORT}`);
});

initStore().catch(() => {});
setInterval(cleanupStaleJobs, 10 * 60 * 1000).unref?.();

async function shutdown() {
  console.log("Shutting down…");
  server.close();
  await shutdownJobs();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
