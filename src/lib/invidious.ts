import { formatDuration, qualityLabel } from "./format";
import type { AudioFormat, VideoFormat, VideoInfo } from "./types";

/* -------------------------------------------------------------------------- */
/* Invidious payload types                                                     */
/* -------------------------------------------------------------------------- */

export interface InvidiousThumbnail {
  quality?: string;
  url: string;
  width?: number;
  height?: number;
}

/**
 * Shape shared by `formatStreams` and `adaptiveFormats`.
 *
 * Invidious versions differ slightly: some send `qualityLabel`, some only
 * `quality`, and older builds omit `fps`/`resolution` entirely. Everything
 * except `url` is therefore optional.
 */
export interface InvidiousStream {
  url: string;
  itag?: string;
  type?: string;
  quality?: string;
  qualityLabel?: string;
  bitrate?: string;
  fps?: number;
  container?: string;
  encoding?: string;
  audioQuality?: string;
  audioSampleRate?: number;
  audioChannels?: number;
  resolution?: string;
  size?: string;
  clen?: string;
  init?: string;
  index?: string;
  isDash?: boolean;
  isHLS?: boolean;
  local?: boolean;
  projectionType?: string;
}

export interface InvidiousVideo {
  type?: string;
  title: string;
  videoId: string;
  videoThumbnails?: InvidiousThumbnail[];
  description?: string;
  published?: number;
  publishedText?: string;
  viewCount?: number;
  likeCount?: number;
  lengthSeconds?: number;
  author?: string;
  authorId?: string;
  authorUrl?: string;
  authorThumbnails?: InvidiousThumbnail[];
  liveNow?: boolean;
  isUpcoming?: boolean;
  hlsUrl?: string | null;
  dashUrl?: string | null;
  formatStreams?: InvidiousStream[];
  adaptiveFormats?: InvidiousStream[];
}

interface InvidiousApiError {
  error?: string;
  identifier?: string;
}

interface InstanceRegistryEntry {
  type?: string;
  uri?: string;
  api?: boolean | null;
  cors?: boolean | null;
  monitor?: { down?: boolean | null } | null;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

export type InvidiousErrorCode =
  | "invalid_video_id"
  | "no_instances"
  | "all_failed"
  | "instance_failed"
  | "invalid_payload"
  | "no_streams";

export interface InvidiousAttempt {
  instance: string;
  message: string;
  status?: number;
}

export class InvidiousError extends Error {
  code: InvidiousErrorCode;
  attempts: InvidiousAttempt[];

  constructor(message: string, code: InvidiousErrorCode, attempts: InvidiousAttempt[] = []) {
    super(message);
    this.name = "InvidiousError";
    this.code = code;
    this.attempts = attempts;
  }
}

/* -------------------------------------------------------------------------- */
/* Instance configuration                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Public Invidious deployments are volatile: instances disappear, disable
 * their API, or enable Cloudflare. This list is only a seed. The service also
 * discovers API-enabled instances from api.invidious.io and remembers which
 * hosts recently failed, so dead entries stop costing time after one attempt.
 *
 * Override the list at build time with:
 *   VITE_INVIDIOUS_INSTANCES=https://one.example,https://two.example
 */
const DEFAULT_INSTANCES = [
  "https://yt.chocolatemoo53.com",
  "https://invidious.nerdvpn.de",
  "https://inv.nadeko.net",
  "https://vid.priv.au",
  "https://invidious.tiekoetter.com",
];

const ENV = (import.meta.env || {}) as Record<string, string | undefined>;
const API_BASE = (ENV.VITE_API_BASE || "").replace(/\/$/, "");
const PROXY_BASE =
  (ENV.VITE_INVIDIOUS_PROXY || "").replace(/\/$/, "") || `${API_BASE}/api/invidious/videos`;

const FIELDS = [
  "type",
  "title",
  "videoId",
  "videoThumbnails",
  "description",
  "published",
  "publishedText",
  "viewCount",
  "likeCount",
  "lengthSeconds",
  "author",
  "authorId",
  "authorUrl",
  "authorThumbnails",
  "liveNow",
  "isUpcoming",
  "hlsUrl",
  "dashUrl",
  "formatStreams",
  "adaptiveFormats",
].join(",");

const REQUEST_TIMEOUT_MS = 6_500;
const PROXY_TIMEOUT_MS = 15_000;
const TOTAL_BUDGET_MS = 24_000;
const HEALTH_TTL_MS = 10 * 60 * 1000;
const DISCOVERY_TTL_MS = 6 * 60 * 60 * 1000;
const HEALTH_KEY = "vidplex:invidious:health:v1";
const DISCOVERY_KEY = "vidplex:invidious:instances:v1";
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/* -------------------------------------------------------------------------- */
/* Small storage / URL helpers                                                 */
/* -------------------------------------------------------------------------- */

function safeStorageGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    /* privacy mode / quota exceeded */
  }
}

function normalizeInstance(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function uniqueInstances(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const instance = normalizeInstance(value);
    if (!instance || !isHttpUrl(instance)) continue;
    const key = instance.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(instance);
  }
  return result;
}

function instanceHost(instance: string): string {
  try {
    return new URL(instance).hostname;
  } catch {
    return instance;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message.slice(0, 160);
  return "Request failed";
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Instance health + discovery                                                 */
/* -------------------------------------------------------------------------- */

type HealthMap = Record<string, number>;

function readHealth(): HealthMap {
  const raw = safeStorageGet(HEALTH_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const now = Date.now();
    const result: HealthMap = {};
    for (const [host, timestamp] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof timestamp === "number" && now - timestamp < HEALTH_TTL_MS) {
        result[host] = timestamp;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function writeHealth(health: HealthMap): void {
  safeStorageSet(HEALTH_KEY, JSON.stringify(health));
}

function markInstanceFailed(instance: string): void {
  const health = readHealth();
  health[instanceHost(instance)] = Date.now();
  writeHealth(health);
}

function markInstanceHealthy(instance: string): void {
  const health = readHealth();
  const host = instanceHost(instance);
  if (host in health) {
    delete health[host];
    writeHealth(health);
  }
}

function orderInstances(instances: string[]): string[] {
  const health = readHealth();
  return [...instances].sort((a, b) => {
    const aFailed = instanceHost(a) in health;
    const bFailed = instanceHost(b) in health;
    if (aFailed === bFailed) return 0;
    return aFailed ? 1 : -1;
  });
}

function readDiscoveryCache(): string[] | null {
  const raw = safeStorageGet(DISCOVERY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { at?: number; instances?: unknown };
    if (!parsed || typeof parsed.at !== "number" || Date.now() - parsed.at > DISCOVERY_TTL_MS) {
      return null;
    }
    if (!Array.isArray(parsed.instances)) return null;
    return uniqueInstances(parsed.instances.filter((item): item is string => typeof item === "string"));
  } catch {
    return null;
  }
}

let discoveryPromise: Promise<string[]> | null = null;

/**
 * Pull the live instance registry. Only instances that explicitly advertise
 * both `api` and `cors` are useful for a browser-side request.
 */
export async function discoverInvidiousInstances(): Promise<string[]> {
  if (discoveryPromise) return discoveryPromise;

  const cached = readDiscoveryCache();
  if (cached) return cached;

  const promise = (async () => {
    try {
      const response = await fetchWithTimeout(
        "https://api.invidious.io/instances.json?sort_by=type,users",
        5_000
      );
      if (!response.ok) return [];
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) return [];

      const instances: string[] = [];
      for (const row of payload) {
        if (!Array.isArray(row) || row.length < 2) continue;
        const [host, meta] = row as [unknown, InstanceRegistryEntry];
        if (typeof host !== "string" || !meta || typeof meta !== "object") continue;
        if (meta.type !== "https") continue;
        if (meta.api !== true || meta.cors !== true) continue;
        if (meta.monitor?.down === true) continue;
        const uri = typeof meta.uri === "string" ? meta.uri : `https://${host}`;
        if (isHttpUrl(uri)) instances.push(uri);
      }

      const unique = uniqueInstances(instances);
      if (unique.length) {
        safeStorageSet(DISCOVERY_KEY, JSON.stringify({ at: Date.now(), instances: unique }));
      }
      return unique;
    } catch {
      return [];
    }
  })();

  discoveryPromise = promise;
  void promise.finally(() => {
    if (discoveryPromise === promise) discoveryPromise = null;
  });
  return promise;
}

/* -------------------------------------------------------------------------- */
/* YouTube URL helpers                                                         */
/* -------------------------------------------------------------------------- */

const YOUTUBE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
];

export function isYouTubeUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase();
    return YOUTUBE_HOSTS.some((allowed) => host === allowed);
  } catch {
    return false;
  }
}

export function extractYouTubeId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.some((allowed) => host === allowed)) return null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] || "";
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }

  const queryId = url.searchParams.get("v");
  if (queryId && YOUTUBE_ID_RE.test(queryId)) return queryId;

  const parts = url.pathname.split("/").filter(Boolean);
  const marker = parts.findIndex((part) => ["shorts", "embed", "live", "v"].includes(part));
  if (marker >= 0) {
    const id = parts[marker + 1] || "";
    if (YOUTUBE_ID_RE.test(id)) return id;
  }

  return null;
}

/**
 * Only YouTube links can be served by Invidious. A 4xx validation error from
 * our backend should not be retried against a third party.
 */
export function isFallbackEligible(error: unknown, url: string): boolean {
  if (!isYouTubeUrl(url)) return false;
  const code = (error as { code?: unknown })?.code;
  const status = Number((error as { status?: unknown })?.status) || 0;
  if (code === "invalid_url" || code === "not_found") return false;
  if (typeof code === "string") {
    return (
      code === "extract_failed" ||
      code === "network_error" ||
      code === "timeout" ||
      code === "server_error" ||
      code === "request_failed" ||
      code === "download_failed" ||
      code === "busy"
    );
  }
  return status === 0 || status >= 500;
}

/* -------------------------------------------------------------------------- */
/* Fetching + normalization                                                    */
/* -------------------------------------------------------------------------- */

function isInvidiousVideo(value: unknown): value is InvidiousVideo {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<InvidiousVideo> & InvidiousApiError;
  if (typeof candidate.error === "string") return false;
  if (typeof candidate.videoId !== "string" || !candidate.videoId) return false;
  if (typeof candidate.title !== "string" || !candidate.title) return false;
  return Array.isArray(candidate.adaptiveFormats) || Array.isArray(candidate.formatStreams);
}

async function fetchFromInstance(instance: string, videoId: string): Promise<InvidiousVideo> {
  const endpoint = `${instance}/api/v1/videos/${encodeURIComponent(videoId)}?fields=${FIELDS}&local=true`;
  const response = await fetchWithTimeout(endpoint, REQUEST_TIMEOUT_MS);
  if (!response.ok) {
    let detail = "";
    try {
      const payload = (await response.json()) as InvidiousApiError;
      detail = typeof payload?.error === "string" ? payload.error : "";
    } catch {
      /* non-JSON error page */
    }
    throw new InvidiousError(
      `HTTP ${response.status}${detail ? ` — ${detail.slice(0, 120)}` : ""}`,
      "instance_failed",
      [{ instance, message: `HTTP ${response.status}`, status: response.status }]
    );
  }

  const payload: unknown = await response.json();
  if (!isInvidiousVideo(payload)) {
    throw new InvidiousError("The instance returned an invalid video payload.", "invalid_payload", [
      { instance, message: "Invalid payload" },
    ]);
  }
  return payload;
}

async function fetchFromProxy(videoId: string): Promise<InvidiousVideo> {
  const endpoint = `${PROXY_BASE}/${encodeURIComponent(videoId)}`;
  const response = await fetchWithTimeout(endpoint, PROXY_TIMEOUT_MS);
  if (!response.ok) {
    throw new InvidiousError(`The backup proxy returned HTTP ${response.status}.`, "instance_failed", [
      { instance: "backend-proxy", message: `HTTP ${response.status}`, status: response.status },
    ]);
  }
  const payload: unknown = await response.json();
  if (!isInvidiousVideo(payload)) {
    throw new InvidiousError("The backup proxy returned an invalid payload.", "invalid_payload", [
      { instance: "backend-proxy", message: "Invalid payload" },
    ]);
  }
  return payload;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function streamHeight(stream: InvidiousStream): number {
  const label = stream.qualityLabel || stream.quality || "";
  const match = label.match(/(\d{3,4})\s*p/i);
  if (match) return Number(match[1]);

  if (stream.resolution) {
    const height = Number(stream.resolution.split("x").at(-1));
    if (Number.isFinite(height) && height > 0) return height;
  }

  const size = stream.size || "";
  const sizeMatch = size.match(/\d+\s*x\s*(\d+)/i);
  if (sizeMatch) return Number(sizeMatch[1]);
  return 0;
}

function codecOf(stream: InvidiousStream): string | null {
  if (stream.encoding) return stream.encoding;
  const match = stream.type?.match(/codecs="([^"]+)"/i);
  return match?.[1] || null;
}

function isMp4Video(stream: InvidiousStream): boolean {
  return Boolean(stream.url) && /^video\/mp4/i.test(stream.type || "");
}

function isMuxedVideo(stream: InvidiousStream): boolean {
  return Boolean(stream.url) && /^video\//i.test(stream.type || "");
}

function isAudio(stream: InvidiousStream): boolean {
  return Boolean(stream.url) && /^audio\//i.test(stream.type || "");
}

function bitrateOf(stream: InvidiousStream | null | undefined): number {
  return numberValue(stream?.bitrate);
}

function bestVideoAt(streams: InvidiousStream[], height: number): InvidiousStream | null {
  const candidates = streams.filter((stream) => streamHeight(stream) === height);
  if (!candidates.length) return null;
  const score = (stream: InvidiousStream) => {
    const encoding = String(stream.encoding || stream.type || "").toLowerCase();
    let value = bitrateOf(stream) / 1000;
    if (encoding.includes("avc1") || encoding.includes("h264")) value += 5_000;
    if (encoding.includes("av01")) value += 2_000;
    if (encoding.includes("vp9")) value += 1_000;
    return value;
  };
  return [...candidates].sort((a, b) => score(b) - score(a))[0] || null;
}

function bestAudio(streams: InvidiousStream[], preferAac: boolean): InvidiousStream | null {
  const candidates = streams.filter(isAudio);
  if (!candidates.length) return null;
  const aac = candidates.filter((stream) => /^audio\/mp4/i.test(stream.type || ""));
  const pool = preferAac && aac.length ? aac : candidates;
  return [...pool].sort((a, b) => bitrateOf(b) - bitrateOf(a))[0] || null;
}

function isExpiredStream(stream: InvidiousStream): boolean {
  try {
    const expire = Number(new URL(stream.url).searchParams.get("expire"));
    if (!Number.isFinite(expire) || expire <= 0) return false;
    // Reject URLs that expire within the next minute. Invidious instances can
    // serve cached payloads with already-dead googlevideo signatures.
    return expire * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

function thumbnailFor(payload: InvidiousVideo): string {
  const thumbnails = Array.isArray(payload.videoThumbnails) ? payload.videoThumbnails : [];
  const best = [...thumbnails]
    .filter((thumbnail) => typeof thumbnail?.url === "string" && thumbnail.url)
    .sort((a, b) => numberValue(b.width) - numberValue(a.width))[0];
  if (best?.url) return best.url;
  return payload.videoId
    ? `https://i.ytimg.com/vi/${encodeURIComponent(payload.videoId)}/maxresdefault.jpg`
    : "";
}

function uploadDateOf(payload: InvidiousVideo): string | null {
  if (typeof payload.published === "number" && payload.published > 0) {
    return new Date(payload.published * 1000).toISOString().slice(0, 10);
  }
  return null;
}

function absoluteChannelUrl(instance: string | undefined, value: string | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (!instance) return value;
  return `${instance}${value.startsWith("/") ? "" : "/"}${value}`;
}

/**
 * Convert an Invidious payload into the exact `VideoInfo` shape used by the
 * VidPlex UI and the existing `/api/download` contract.
 *
 * We only surface MP4 video streams because the backend merges them with AAC
 * audio into an MP4. WebM/VP9-only renditions are deliberately skipped so the
 * browser never receives a file it cannot play.
 */
export function toVideoInfo(
  payload: InvidiousVideo,
  originalUrl: string,
  instance?: string
): VideoInfo {
  const adaptive = (Array.isArray(payload.adaptiveFormats) ? payload.adaptiveFormats : []).filter(
    (stream) => !isExpiredStream(stream)
  );
  const muxed = (Array.isArray(payload.formatStreams) ? payload.formatStreams : []).filter(
    (stream) => !isExpiredStream(stream)
  );
  const audio = adaptive.filter(isAudio);
  const progressive = muxed.filter(isMuxedVideo);
  const mp4Video = adaptive.filter(isMp4Video);
  const aacAudio = bestAudio(audio, true);

  const heights = [
    ...new Set(
      [...mp4Video, ...progressive]
        .map((stream) => streamHeight(stream))
        .filter((height) => height > 0)
    ),
  ].sort((a, b) => b - a);

  const formats: VideoFormat[] = [];
  for (const height of heights) {
    const adaptiveVideo = bestVideoAt(mp4Video, height);
    const muxedVideo = bestVideoAt(progressive, height);
    const mergeAudio = bestAudio(audio, true) || bestAudio(audio, false);
    const useAdaptive = Boolean(adaptiveVideo && mergeAudio);
    const chosen = useAdaptive ? adaptiveVideo : muxedVideo || adaptiveVideo;
    if (!chosen) continue;

    const selectedAudio = useAdaptive ? mergeAudio : null;
    if (!selectedAudio && !muxedVideo) continue;

    const videoBytes = numberValue(chosen.clen);
    const audioBytes = selectedAudio ? numberValue(selectedAudio.clen) : 0;
    const filesize = videoBytes + audioBytes || numberValue(chosen.size) || null;

    formats.push({
      formatId: chosen.itag || null,
      height,
      quality: qualityLabel(height),
      ext: "mp4",
      fps: numberValue(chosen.fps) || null,
      codec: codecOf(chosen),
      filesize,
      hasAudio: Boolean(muxedVideo || selectedAudio),
      url: chosen.url,
      streamUrl: chosen.url,
      audioStreamUrl: selectedAudio?.url || null,
      container: "mp4",
      requiresMerge: Boolean(selectedAudio),
    });
  }

  if (!formats.length) {
    throw new InvidiousError(
      payload.liveNow
        ? "This is a live stream, which the backup source cannot download."
        : "The backup source returned no downloadable MP4 streams for this video.",
      "no_streams"
    );
  }

  const seconds = numberValue(payload.lengthSeconds);
  const audioBitrate = Math.max(96, Math.round(bitrateOf(aacAudio) / 1000) || 128);
  const estimatedAudioBytes = (kbps: number) =>
    seconds > 0 ? Math.round((kbps * 1000 * seconds) / 8) : null;

  const audioFormats: AudioFormat[] = [
    {
      format: "mp3",
      quality: "320 kbps",
      bitrate: 320,
      filesize: estimatedAudioBytes(320),
      url: bestAudio(audio, false)?.url || null,
      container: "mp3",
    },
    {
      format: "mp3",
      quality: "192 kbps",
      bitrate: 192,
      filesize: estimatedAudioBytes(192),
      url: bestAudio(audio, false)?.url || null,
      container: "mp3",
    },
    {
      format: "mp3",
      quality: "128 kbps",
      bitrate: 128,
      filesize: estimatedAudioBytes(128),
      url: bestAudio(audio, false)?.url || null,
      container: "mp3",
    },
    {
      format: "m4a",
      quality: `${audioBitrate} kbps`,
      bitrate: audioBitrate,
      filesize: numberValue(aacAudio?.clen) || estimatedAudioBytes(audioBitrate),
      url: aacAudio?.url || bestAudio(audio, false)?.url || null,
      container: "m4a",
    },
  ];

  const sourceInstance = instance ? normalizeInstance(instance) : undefined;

  return {
    id: payload.videoId,
    url: originalUrl,
    title: String(payload.title || "Untitled video").slice(0, 240),
    description: String(payload.description || "").slice(0, 400),
    thumbnail: thumbnailFor(payload),
    platform: "YouTube",
    channel: String(payload.author || "").slice(0, 160),
    channelUrl: absoluteChannelUrl(sourceInstance, payload.authorUrl),
    duration: seconds,
    durationLabel: formatDuration(seconds),
    viewCount: numberValue(payload.viewCount) || null,
    uploadDate: uploadDateOf(payload),
    isLive: Boolean(payload.liveNow),
    formats,
    heights: formats.map((format) => format.height),
    audioFormats,
    extractor: "invidious",
    direct: false,
    source: "invidious",
    fallback: true,
    sourceInstance,
    streamsFetchedAt: Date.now(),
  };
}

/**
 * Try every configured/discovered Invidious instance in order. A failure,
 * timeout, non-200 response, malformed payload, or stream-less payload moves
 * on to the next host. If all public instances fail, the Render-hosted proxy
 * is used as a final attempt.
 */
export async function fetchInvidiousVideo(
  videoId: string,
  originalUrl = `https://www.youtube.com/watch?v=${videoId}`
): Promise<VideoInfo> {
  if (!YOUTUBE_ID_RE.test(videoId)) {
    throw new InvidiousError("That video ID is not valid.", "invalid_video_id");
  }

  const seeds = uniqueInstances(
    (ENV.VITE_INVIDIOUS_INSTANCES || DEFAULT_INSTANCES.join(","))
      .split(",")
      .map(normalizeInstance)
  );

  if (!seeds.length) {
    throw new InvidiousError("No Invidious instances are configured.", "no_instances");
  }

  // Start discovery in parallel with the first seed attempt. It is only awaited
  // if the seed list is exhausted, so the common path stays fast.
  const discovery = discoverInvidiousInstances();
  const attempts: InvidiousAttempt[] = [];
  const startedAt = Date.now();
  const tried = new Set<string>();

  const attempt = async (instance: string): Promise<VideoInfo | null> => {
    const key = instanceHost(instance).toLowerCase();
    if (tried.has(key)) return null;
    tried.add(key);

    const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (remaining < 1_000) return null;

    try {
      const payload = await fetchFromInstance(instance, videoId);
      const info = toVideoInfo(payload, originalUrl, instance);
      markInstanceHealthy(instance);
      return info;
    } catch (error) {
      markInstanceFailed(instance);
      attempts.push({
        instance,
        message: errorMessage(error),
        status: (error as InvidiousError)?.attempts?.[0]?.status,
      });
      return null;
    }
  };

  const orderedSeeds = orderInstances(seeds);
  const healthySeeds = orderedSeeds.filter((instance) => !(instanceHost(instance) in readHealth()));
  const seedPool = healthySeeds.length ? healthySeeds : orderedSeeds;

  for (const instance of seedPool) {
    const info = await attempt(instance);
    if (info) return info;
  }

  const discovered = await discovery;
  for (const instance of orderInstances(uniqueInstances([...seeds, ...discovered]))) {
    const info = await attempt(instance);
    if (info) return info;
  }

  // Last resort: the backend proxy. It runs the same rotation from Render's IP
  // and avoids browser CORS restrictions.
  try {
    const payload = await fetchFromProxy(videoId);
    const info = toVideoInfo(payload, originalUrl);
    return info;
  } catch (error) {
    attempts.push({ instance: "backend-proxy", message: errorMessage(error) });
  }

  throw new InvidiousError(
    attempts.length
      ? `All backup sources failed (${attempts.length} attempt${attempts.length === 1 ? "" : "s"}).`
      : "No backup sources were reachable.",
    attempts.length ? "all_failed" : "no_instances",
    attempts
  );
}
