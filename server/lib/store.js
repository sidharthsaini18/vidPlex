import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(here, "..", "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const SEED_RECENT = [
  {
    id: "seed_1",
    title: "Big Buck Bunny — Official 4K Short Film",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    platform: "YouTube",
    quality: "4K",
    format: "mp4",
    sizeBytes: 722647490,
    status: "completed",
    createdAt: Date.now() - 1000 * 60 * 4,
    sample: true,
  },
  {
    id: "seed_2",
    title: "Studio Tour — Designing Products at Scale",
    thumbnail: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=640&q=80",
    platform: "Vimeo",
    quality: "2K",
    format: "mp4",
    sizeBytes: 318767104,
    status: "completed",
    createdAt: Date.now() - 1000 * 60 * 12,
    sample: true,
  },
  {
    id: "seed_3",
    title: "Golden Hour — A Cinematic Reel",
    thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=640&q=80",
    platform: "Instagram",
    quality: "1080p",
    format: "mp4",
    sizeBytes: 48234496,
    status: "completed",
    createdAt: Date.now() - 1000 * 60 * 26,
    sample: true,
  },
  {
    id: "seed_4",
    title: "Lo-fi Sessions — Deep Focus Mix",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&q=80",
    platform: "YouTube",
    quality: "320 kbps",
    format: "mp3",
    sizeBytes: 10485760,
    status: "completed",
    createdAt: Date.now() - 1000 * 60 * 41,
    sample: true,
  },
  {
    id: "seed_5",
    title: "Product Teardown — Next-gen Hardware",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&q=80",
    platform: "X",
    quality: "720p",
    format: "mp4",
    sizeBytes: 15728640,
    status: "completed",
    createdAt: Date.now() - 1000 * 60 * 58,
    sample: true,
  },
];

const initialState = {
  stats: {
    baselineDownloads: 12_480_392,
    baselineUsers: 2_184_507,
    realDownloads: 0,
    realBytes: 0,
    speedSamples: [],
  },
  recent: SEED_RECENT,
};

let state = structuredClone(initialState);
let writeTimer = null;

export async function initStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    state = {
      stats: { ...initialState.stats, ...(parsed.stats || {}) },
      recent: Array.isArray(parsed.recent) ? parsed.recent : SEED_RECENT,
    };
    // Drop samples that are older than a day so the feed stays fresh.
    state.recent = state.recent.filter((item) => !item.sample || Date.now() - item.createdAt < 86400000);
  } catch {
    state = structuredClone(initialState);
  }
  return getStats();
}

function scheduleWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(async () => {
    writeTimer = null;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${STORE_FILE}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
      await fs.rename(tmp, STORE_FILE);
    } catch {
      /* persistence is best-effort */
    }
  }, 400);
  writeTimer.unref?.();
}

export function recordCompletedDownload({ title, thumbnail, platform, quality, format, sizeBytes, bytesPerSecond }) {
  state.stats.realDownloads += 1;
  state.stats.realBytes += Number(sizeBytes) || 0;
  if (bytesPerSecond > 0) {
    state.stats.speedSamples.push(Math.round(bytesPerSecond));
    state.stats.speedSamples = state.stats.speedSamples.slice(-40);
  }
  state.recent = [
    {
      id: `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      thumbnail,
      platform,
      quality,
      format,
      sizeBytes: Number(sizeBytes) || 0,
      status: "completed",
      createdAt: Date.now(),
      sample: false,
    },
    ...state.recent,
  ].slice(0, 30);
  scheduleWrite();
}

export function getStats() {
  const { baselineDownloads, baselineUsers, realDownloads, realBytes, speedSamples } = state.stats;
  const speeds = speedSamples.filter((n) => n > 0);
  const avgBytesPerSecond = speeds.length
    ? speeds.reduce((a, b) => a + b, 0) / speeds.length
    : 48 * 1024 * 1024;
  return {
    totalDownloads: baselineDownloads + realDownloads,
    activeUsers: baselineUsers + Math.min(realDownloads * 3, 900),
    platforms: 24,
    avgSpeedMbps: Math.round((avgBytesPerSecond * 8) / 1_000_000),
    realDownloads,
    realBytes,
    last24h: 18_204 + realDownloads,
  };
}

export function getRecent(limit = 12) {
  return state.recent.slice(0, Math.max(1, Math.min(limit, 30)));
}

export function removeRecent(id) {
  const before = state.recent.length;
  state.recent = state.recent.filter((item) => item.id !== id);
  if (state.recent.length !== before) scheduleWrite();
}
