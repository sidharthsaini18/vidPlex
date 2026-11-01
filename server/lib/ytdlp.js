import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { platformFromExtractor } from "./security.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export const PYTHON = process.env.PYTHON_PATH || process.env.PYTHON || "python";
export const YTDLP_BIN = process.env.YTDLP_PATH || "";
export const FFMPEG_PATH =
  process.env.FFMPEG_PATH ||
  path.resolve(here, "..", "..", "node_modules", "ffmpeg-static", "ffmpeg.exe");

export function ytdlpCommand() {
  if (YTDLP_BIN) return { command: YTDLP_BIN, baseArgs: [] };
  return { command: PYTHON, baseArgs: ["-m", "yt_dlp"] };
}

export function ytdlpBaseArgs() {
  const { baseArgs } = ytdlpCommand();
  return [
    ...baseArgs,
    "--no-warnings",
    "--no-playlist",
    "--no-check-certificates",
    "--socket-timeout",
    "20",
    "--retries",
    "3",
    "--ffmpeg-location",
    FFMPEG_PATH,
  ];
}

export function runYtdlp(args, { timeout = 90_000, maxBuffer = 64 * 1024 * 1024 } = {}) {
  const { command } = ytdlpCommand();
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { timeout, maxBuffer, windowsHide: true, encoding: "utf8" },
      (error, stdout, stderr) => {
        if (error) {
          const message = cleanError(stderr || error.message);
          const err = new Error(message);
          err.stderr = stderr;
          reject(err);
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

export function cleanError(raw = "") {
  const text = String(raw)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("WARNING:"))
    .join(" ")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/[A-Za-z]:\\[^\s"']+/g, "file");

  if (/Sign in to confirm|bot/i.test(text)) {
    return "The platform asked us to verify this request. Try again in a moment, or use a different public link.";
  }
  if (/Private video|login|members-only|requires authentication/i.test(text)) {
    return "This video is private or requires a login, so it can't be downloaded.";
  }
  if (/Video unavailable|not available|has been removed|404/i.test(text)) {
    return "This video is unavailable. Double-check the link and try again.";
  }
  if (/Unsupported URL/i.test(text)) {
    return "That website isn't supported yet. Try YouTube, Instagram, TikTok, X, Facebook or Vimeo.";
  }
  if (/timed out|timeout/i.test(text)) {
    return "The platform took too long to respond. Please try again.";
  }
  const tail = text.slice(-320);
  return tail || "We couldn't process that link. Please try another one.";
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function pickVideoFormat(formats, height) {
  const candidates = formats.filter(
    (f) => f.vcodec && f.vcodec !== "none" && Number(f.height) === height
  );
  if (!candidates.length) return null;
  const score = (f) => {
    let s = 0;
    if (f.ext === "mp4") s += 60;
    if (String(f.vcodec).startsWith("avc")) s += 40;
    if (String(f.vcodec).startsWith("av01")) s += 20;
    if (f.acodec && f.acodec !== "none") s += 30;
    s += Math.min(Number(f.tbr) || 0, 100) / 10;
    return s;
  };
  return [...candidates].sort((a, b) => score(b) - score(a))[0];
}

function bestAudioFormat(formats) {
  const candidates = formats.filter(
    (f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none"
  );
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => (Number(b.abr) || 0) - (Number(a.abr) || 0))[0];
}

function qualityLabel(height) {
  if (height >= 2160) return "4K";
  if (height >= 1440) return "2K";
  return `${height}p`;
}

function platformLabel(info, url) {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* ignore */
  }
  return platformFromExtractor(info.extractor_key || info.extractor || "", host);
}

/**
 * Extract metadata and normalize it into the shape the UI consumes.
 */
export async function fetchVideoInfo(url) {
  const args = [...ytdlpBaseArgs(), "--dump-single-json", "--skip-download", url];
  const { stdout } = await runYtdlp(args, { timeout: 90_000 });
  let info;
  try {
    info = JSON.parse(stdout);
  } catch {
    throw new Error("We couldn't read the video details from that link.");
  }
  if (!info || (!info.formats && !info.url)) {
    throw new Error("No playable video was found at that link.");
  }

  const rawFormats = Array.isArray(info.formats) ? info.formats : [];
  const audio = bestAudioFormat(rawFormats);
  const audioBytes = audio ? formatBytes(audio.filesize || audio.filesize_approx) : null;

  const heights = [
    ...new Set(
      rawFormats
        .filter((f) => f.vcodec && f.vcodec !== "none" && Number(f.height) > 0)
        .map((f) => Number(f.height))
    ),
  ].sort((a, b) => b - a);

  const videoFormats = heights.map((height) => {
    const chosen = pickVideoFormat(rawFormats, height);
    const videoBytes = chosen ? formatBytes(chosen.filesize || chosen.filesize_approx) : null;
    const combined = chosen && chosen.acodec && chosen.acodec !== "none";
    const estimated =
      (videoBytes || 0) + (combined ? 0 : audioBytes || 0) || null;
    return {
      formatId: chosen?.format_id || null,
      height,
      quality: qualityLabel(height),
      ext: "mp4",
      fps: chosen?.fps || null,
      codec: chosen?.vcodec || null,
      filesize: estimated,
      filesizeLabel: estimated ? null : null,
      hasAudio: Boolean(combined),
      url: null,
    };
  });

  const duration = Number(info.duration) || 0;
  const audioBitrate = 320;
  const audioEstimated = duration ? Math.round((audioBitrate * 1000 * duration) / 8) : null;

  return {
    id: String(info.id || ""),
    url,
    title: String(info.title || info.fulltitle || "Untitled video").slice(0, 240),
    description: String(info.description || "").slice(0, 400),
    thumbnail: String(info.thumbnail || info.thumbnails?.at(-1)?.url || ""),
    platform: platformLabel(info, url),
    channel: String(info.channel || info.uploader || info.creator || "").slice(0, 160),
    channelUrl: info.channel_url || info.uploader_url || null,
    duration,
    durationLabel:
      typeof info.duration_string === "string" && info.duration_string.includes(":")
        ? info.duration_string
        : formatDuration(duration),
    viewCount: Number(info.view_count) || null,
    uploadDate: info.upload_date || null,
    isLive: Boolean(info.is_live),
    formats: videoFormats,
    heights,
    audioFormats: [
      { format: "mp3", quality: "320 kbps", bitrate: 320, filesize: audioEstimated },
      { format: "mp3", quality: "192 kbps", bitrate: 192, filesize: duration ? Math.round((192 * 1000 * duration) / 8) : null },
      { format: "m4a", quality: "256 kbps", bitrate: 256, filesize: duration ? Math.round((256 * 1000 * duration) / 8) : null },
    ],
    extractor: info.extractor_key || info.extractor || "",
  };
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Fallback metadata for direct media files that yt-dlp can't introspect. */
export async function fetchDirectInfo(url) {
  let response;
  try {
    response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 VidPlex/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error("head failed");
  } catch {
    response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 VidPlex/1.0", range: "bytes=0-0" },
      signal: AbortSignal.timeout(20_000),
    });
  }

  const type = response.headers.get("content-type") || "";
  if (!/^(video|audio)\//i.test(type) && !/\.(mp4|webm|mov|m4v|mp3|m4a|wav)(\?|$)/i.test(url)) {
    throw new Error("That link doesn't point to a downloadable media file.");
  }

  const lengthHeader = response.headers.get("content-range")?.split("/")?.at(-1);
  const size = Number(lengthHeader || response.headers.get("content-length")) || null;
  const base = decodeURIComponent(new URL(url).pathname.split("/").pop() || "media");
  const title = base.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ") || "Direct media";
  const isAudio = /^audio\//i.test(type) || /\.(mp3|m4a|wav)(\?|$)/i.test(url);
  const ext = isAudio ? (/\.m4a(\?|$)/i.test(url) ? "m4a" : "mp3") : "mp4";

  return {
    id: `direct_${Date.now()}`,
    url,
    title,
    description: "",
    thumbnail: "",
    platform: "Direct",
    channel: new URL(url).hostname,
    channelUrl: null,
    duration: 0,
    durationLabel: "—",
    viewCount: null,
    uploadDate: null,
    isLive: false,
    formats: isAudio
      ? []
      : [{ formatId: "direct", height: 0, quality: "Source", ext, fps: null, codec: null, filesize: size, filesizeLabel: null, hasAudio: true, url }],
    heights: isAudio ? [] : [0],
    audioFormats: [
      { format: "mp3", quality: "320 kbps", bitrate: 320, filesize: null },
      { format: "mp3", quality: "192 kbps", bitrate: 192, filesize: null },
      { format: "m4a", quality: "256 kbps", bitrate: 256, filesize: null },
    ],
    extractor: "direct",
    direct: true,
  };
}
