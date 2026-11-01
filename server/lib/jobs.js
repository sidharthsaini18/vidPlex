import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { FFMPEG_PATH, ytdlpBaseArgs, ytdlpCommand } from "./ytdlp.js";
import { sanitizeFilename } from "./security.js";
import { recordCompletedDownload } from "./store.js";

const JOB_ROOT = path.join(os.tmpdir(), "vidplex-jobs");
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_DOWNLOADS || 3);
const MAX_JOB_AGE_MS = 45 * 60 * 1000;
const FILE_TTL_MS = 30 * 60 * 1000;

const jobs = new Map();

export class JobError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function getJobCount() {
  let active = 0;
  for (const job of jobs.values()) {
    if (["queued", "downloading", "processing"].includes(job.status)) active += 1;
  }
  return active;
}

export function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    progress: Math.max(0, Math.min(100, Math.round(job.progress * 10) / 10)),
    speed: job.speed,
    eta: job.eta,
    phase: job.phase,
    title: job.title,
    type: job.type,
    quality: job.quality,
    format: job.format,
    sizeBytes: job.sizeBytes,
    filename: job.filename,
    error: job.error,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    downloadUrl: job.status === "completed" ? `/api/download/${job.id}/file` : null,
  };
}

export function getJob(id) {
  return jobs.get(id) || null;
}

function safeArgs(args) {
  return args;
}

function videoFormatSelector(height) {
  const h = Number(height);
  if (!h || h <= 0) return "bv*+ba/b";
  return [
    `bv*[height<=${h}][ext=mp4]+ba[ext=m4a]`,
    `bv*[height<=${h}]+ba`,
    `b[height<=${h}]`,
    `bv*[height<=${h}]`,
    "bv*+ba/b",
  ].join("/");
}

export async function startJob({ url, title, thumbnail, platform, type, height, quality, format, direct, duration }) {
  if (getJobCount() >= MAX_CONCURRENT) {
    throw new JobError(
      "All download slots are busy right now. Please try again in a few seconds.",
      429
    );
  }

  const id = crypto.randomUUID();
  const dir = path.join(JOB_ROOT, id);
  await fs.mkdir(dir, { recursive: true });

  const normalizedType = type === "audio" ? "audio" : "video";
  const ext = normalizedType === "audio" ? (format === "m4a" ? "m4a" : "mp3") : "mp4";
  const job = {
    id,
    url,
    title: sanitizeFilename(title, "video"),
    thumbnail,
    platform: platform || "Direct",
    type: normalizedType,
    height: Number(height) || 0,
    quality: quality || (normalizedType === "audio" ? "320 kbps" : "1080p"),
    format: ext,
    direct: Boolean(direct),
    duration: Number(duration) || 0,
    status: "queued",
    progress: 0,
    speed: null,
    eta: null,
    phase: "Queued",
    error: null,
    createdAt: Date.now(),
    completedAt: null,
    dir,
    filePath: null,
    filename: null,
    sizeBytes: null,
    process: null,
    stderr: "",
    lastLineAt: Date.now(),
  };
  jobs.set(id, job);

  if (direct && normalizedType === "video") {
    runDirectJob(job).catch((error) => failJob(job, error.message));
  } else {
    runYtdlpJob(job).catch((error) => failJob(job, error.message));
  }

  return publicJob(job);
}

function runYtdlpJob(job) {
  return new Promise((resolve, reject) => {
    const { command, baseArgs } = ytdlpCommand();
    const args = [
      ...ytdlpBaseArgs(),
      "--newline",
      "--progress",
      "--progress-template",
      "download:%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s",
      "-o",
      path.join(job.dir, "media.%(ext)s"),
    ];

    if (job.type === "audio") {
      args.push("-f", "ba/b", "-x", "--audio-format", job.format === "m4a" ? "m4a" : "mp3", "--audio-quality", "0");
    } else {
      args.push("-f", videoFormatSelector(job.height));
      args.push("--merge-output-format", "mp4", "--remux-video", "mp4");
    }
    args.push("--no-mtime", job.url);

    job.status = "downloading";
    job.phase = "Preparing stream";
    job.lastLineAt = Date.now();

    const child = spawn(command, safeArgs(args), {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    job.process = child;

    const handleLine = (raw) => {
      const line = raw.trim();
      if (!line) return;
      job.lastLineAt = Date.now();

      if (line.startsWith("download:")) {
        const payload = line.slice("download:".length);
        const [percentRaw = "", speedRaw = "", etaRaw = ""] = payload.split("|");
        const percent = Number.parseFloat(percentRaw.replace(/[^\d.]/g, ""));
        const speed = speedRaw.replace(/\s+/g, " ").trim() || null;
        const eta = etaRaw.trim() || null;
        if (Number.isFinite(percent)) {
          job.progress = Math.min(78, percent * 0.78);
          job.phase = "Downloading";
          job.speed = speed;
          job.eta = eta;
        }
        return;
      }

      if (/\[download\]\s+Destination:/.test(line)) {
        job.downloadStarted = (job.downloadStarted || 0) + 1;
        job.phase = "Downloading";
        if (job.downloadStarted >= 2) {
          job.progress = Math.max(job.progress, 78);
        }
        return;
      }
      if (/\[download\].*\d+%/.test(line)) {
        const match = line.match(/(\d+(?:\.\d+)?)%/);
        if (match) {
          const percent = Number.parseFloat(match[1]);
          const base = (job.downloadStarted || 1) >= 2 ? 78 : 0;
          const span = (job.downloadStarted || 1) >= 2 ? 18 : 78;
          job.progress = Math.max(job.progress, base + (percent / 100) * span);
          job.phase = "Downloading";
        }
        return;
      }
      if (/\[(Merger|ExtractAudio|VideoConvertor|FixupM3u8|Metadata|ThumbnailsConvertor)\]/.test(line)) {
        job.progress = Math.max(job.progress, 92);
        job.status = "processing";
        job.phase = "Processing media";
        job.speed = null;
        job.eta = null;
      }
    };

    let stdoutBuffer = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) handleLine(line);
    });

    let stderrBuffer = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderrBuffer += chunk;
      if (stderrBuffer.length > 16_000) stderrBuffer = stderrBuffer.slice(-16_000);
      job.stderr = stderrBuffer;
      const lines = stderrBuffer.split(/\r?\n/);
      for (const line of lines.slice(0, -1)) {
        if (/ERROR|Sign in|Private|unavailable/i.test(line)) handleLine(line);
      }
    });

    child.on("error", (error) => {
      failJob(job, `We couldn't start the downloader: ${error.message}`);
      reject(error);
    });

    child.on("close", async (code) => {
      job.process = null;
      if (job.status === "cancelled") {
        resolve();
        return;
      }
      if (code !== 0) {
        failJob(job, deriveError(job.stderr) || "The download failed. Please try again.");
        resolve();
        return;
      }
      try {
        const file = await findOutputFile(job.dir);
        if (!file) {
          failJob(job, "The download finished but no media file was produced.");
          resolve();
          return;
        }
        const stat = await fs.stat(file.path);
        job.filePath = file.path;
        job.filename = `${job.title}.${file.ext}`;
        job.sizeBytes = stat.size;
        job.progress = 100;
        job.status = "completed";
        job.phase = "Completed";
        job.speed = null;
        job.eta = null;
        job.completedAt = Date.now();
        job.bytesPerSecond = job.sizeBytes / Math.max(1, (job.completedAt - job.createdAt) / 1000);
        recordCompletedDownload({
          title: job.title,
          thumbnail: job.thumbnail,
          platform: job.platform,
          quality: job.quality,
          format: job.format,
          sizeBytes: job.sizeBytes,
          bytesPerSecond: job.bytesPerSecond,
        });
        resolve();
      } catch (error) {
        failJob(job, "We couldn't finalize the media file.");
        reject(error);
      }
    });
  });
}

function deriveError(stderr = "") {
  const lines = String(stderr)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /ERROR|Sign in|Private|unavailable|Unsupported/i.test(l));
  return lines.at(-1)?.replace(/^ERROR:\s*/i, "").slice(0, 300) || "";
}

async function runDirectJob(job) {
  job.status = "downloading";
  job.phase = "Downloading";
  const target = path.join(job.dir, `media.${job.format === "m4a" ? "m4a" : job.format === "mp3" ? "mp3" : "mp4"}`);
  const response = await fetch(job.url, {
    redirect: "follow",
    headers: { "user-agent": "Mozilla/5.0 VidPlex/1.0" },
    signal: AbortSignal.timeout(30 * 60 * 1000),
  });
  if (!response.ok || !response.body) {
    throw new Error(`The source server returned ${response.status}.`);
  }
  const total = Number(response.headers.get("content-length")) || 0;
  let received = 0;
  const started = Date.now();
  const nodeStream = Readable.fromWeb(response.body);
  nodeStream.on("data", (chunk) => {
    received += chunk.length;
    if (total > 0) {
      job.progress = Math.min(97, (received / total) * 97);
      job.phase = "Downloading";
      const seconds = Math.max(0.2, (Date.now() - started) / 1000);
      const rate = received / seconds;
      job.speed = formatSpeed(rate);
      const remaining = total > received ? (total - received) / Math.max(1, rate) : 0;
      job.eta = formatEta(remaining);
    } else {
      job.progress = Math.min(95, job.progress + 0.5);
    }
  });
  await pipeline(nodeStream, fsSync.createWriteStream(target));
  const stat = await fs.stat(target);
  job.filePath = target;
  job.filename = `${job.title}.${path.extname(target).slice(1)}`;
  job.sizeBytes = stat.size;
  job.progress = 100;
  job.status = "completed";
  job.phase = "Completed";
  job.speed = null;
  job.eta = null;
  job.completedAt = Date.now();
  recordCompletedDownload({
    title: job.title,
    thumbnail: job.thumbnail,
    platform: job.platform,
    quality: job.quality,
    format: job.format,
    sizeBytes: job.sizeBytes,
    bytesPerSecond: job.sizeBytes / Math.max(1, (job.completedAt - job.createdAt) / 1000),
  });
}

function formatSpeed(bytesPerSecond) {
  const mb = bytesPerSecond / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MiB/s`;
  return `${Math.max(1, Math.round(bytesPerSecond / 1024))} KiB/s`;
}

function formatEta(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function failJob(job, message) {
  job.status = "failed";
  job.error = message || "The download failed.";
  job.phase = "Failed";
  job.speed = null;
  job.eta = null;
  job.process = null;
}

async function findOutputFile(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (/\.(part|ytdl|temp)$/i.test(entry.name)) continue;
    if (/^media\.(mp4|webm|mkv|mov|mp3|m4a|opus|ogg|wav)$/i.test(entry.name)) {
      const full = path.join(dir, entry.name);
      const stat = await fs.stat(full);
      if (stat.size > 0) files.push({ path: full, ext: path.extname(entry.name).slice(1), size: stat.size });
    }
  }
  if (!files.length) return null;
  return files.sort((a, b) => b.size - a.size)[0];
}

export async function cancelJob(id) {
  const job = jobs.get(id);
  if (!job) return null;
  if (job.status === "completed") return publicJob(job);
  job.status = "cancelled";
  job.phase = "Cancelled";
  job.speed = null;
  job.eta = null;
  if (job.process) {
    killTree(job.process);
    job.process = null;
  }
  await cleanupDir(job.dir);
  jobs.delete(id);
  return { id, status: "cancelled" };
}

function killTree(child) {
  try {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else {
      child.kill("SIGKILL");
    }
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      /* ignore */
    }
  }
}

async function cleanupDir(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

export function scheduleFileCleanup(job) {
  if (!job?.filePath) return;
  setTimeout(async () => {
    try {
      await fs.unlink(job.filePath);
    } catch {
      /* already gone */
    }
    await cleanupDir(job.dir);
    job.filePath = null;
  }, FILE_TTL_MS).unref?.();
}

export async function cleanupStaleJobs() {
  const cutoff = Date.now() - MAX_JOB_AGE_MS;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff && !job.process) {
      await cleanupDir(job.dir);
      jobs.delete(id);
    }
  }
  try {
    const entries = await fs.readdir(JOB_ROOT, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(JOB_ROOT, entry.name);
      const stat = await fs.stat(full);
      if (stat.mtimeMs < cutoff) await cleanupDir(full);
    }
  } catch {
    /* ignore */
  }
}

export async function shutdownJobs() {
  for (const job of jobs.values()) {
    if (job.process) killTree(job.process);
    await cleanupDir(job.dir);
  }
  jobs.clear();
}
