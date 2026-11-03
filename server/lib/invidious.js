/**
 * Server-side Invidious failover.
 *
 * The browser normally talks to an instance directly. If every CORS-enabled
 * instance is unreachable, the client calls this endpoint on Render, which
 * runs the same rotation without browser CORS restrictions.
 *
 * Keep this list in sync with src/lib/invidious.ts. Instances frequently
 * disable their public API, so discovery is used as a second source.
 */
const DEFAULT_INSTANCES = [
  "https://yt.chocolatemoo53.com",
  "https://invidious.nerdvpn.de",
  "https://inv.nadeko.net",
  "https://vid.priv.au",
  "https://invidious.tiekoetter.com",
];

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

const INSTANCE_TIMEOUT_MS = 7_000;
const TOTAL_BUDGET_MS = 24_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const HEALTH_TTL_MS = 10 * 60 * 1000;
const REGISTRY_TTL_MS = 6 * 60 * 60 * 1000;

const cache = new Map();
const health = new Map();

let registry = { at: 0, instances: [] };
let registryPromise = null;

function uniqueInstances(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const instance = value.trim().replace(/\/+$/, "");
    if (!instance) continue;
    let url;
    try {
      url = new URL(instance);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const key = url.hostname.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(instance);
  }
  return result;
}

function hostOf(instance) {
  try {
    return new URL(instance).hostname;
  } catch {
    return instance;
  }
}

function orderInstances(instances) {
  const now = Date.now();
  return [...instances].sort((a, b) => {
    const aFailedAt = health.get(hostOf(a)) || 0;
    const bFailedAt = health.get(hostOf(b)) || 0;
    const aFailed = now - aFailedAt < HEALTH_TTL_MS;
    const bFailed = now - bFailedAt < HEALTH_TTL_MS;
    if (aFailed === bFailed) return 0;
    return aFailed ? 1 : -1;
  });
}

async function discoverInstances() {
  if (registry.instances.length && Date.now() - registry.at < REGISTRY_TTL_MS) {
    return registry.instances;
  }
  if (registryPromise) return registryPromise;

  registryPromise = (async () => {
    try {
      const response = await fetch(
        "https://api.invidious.io/instances.json?sort_by=type,users",
        {
          headers: { Accept: "application/json", "user-agent": "Mozilla/5.0 VidPlex/1.0" },
          signal: AbortSignal.timeout(5_000),
        }
      );
      if (!response.ok) return [];
      const payload = await response.json();
      if (!Array.isArray(payload)) return [];

      const instances = [];
      for (const row of payload) {
        if (!Array.isArray(row) || row.length < 2) continue;
        const [host, meta] = row;
        if (typeof host !== "string" || !meta || typeof meta !== "object") continue;
        if (meta.type !== "https") continue;
        if (meta.api !== true) continue;
        if (meta.monitor?.down === true) continue;
        instances.push(typeof meta.uri === "string" ? meta.uri : `https://${host}`);
      }

      const unique = uniqueInstances(instances);
      registry = { at: Date.now(), instances: unique };
      return unique;
    } catch {
      return [];
    } finally {
      registryPromise = null;
    }
  })();

  return registryPromise;
}

function isValidPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (typeof payload.error === "string") return false;
  if (typeof payload.videoId !== "string" || !payload.videoId) return false;
  if (typeof payload.title !== "string" || !payload.title) return false;
  return Array.isArray(payload.adaptiveFormats) || Array.isArray(payload.formatStreams);
}

async function fetchFromInstance(instance, videoId) {
  const endpoint = `${instance}/api/v1/videos/${encodeURIComponent(videoId)}?fields=${FIELDS}&local=true`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 VidPlex/1.0",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(INSTANCE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!isValidPayload(payload)) {
    throw new Error("The instance returned an invalid video payload.");
  }
  return payload;
}

export async function fetchInvidiousPayload(videoId) {
  const cached = cache.get(videoId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  const startedAt = Date.now();
  const attempts = [];
  const tried = new Set();
  const seeds = uniqueInstances(DEFAULT_INSTANCES);

  const tryInstance = async (instance) => {
    const key = hostOf(instance).toLowerCase();
    if (tried.has(key)) return null;
    tried.add(key);
    if (TOTAL_BUDGET_MS - (Date.now() - startedAt) < 1_000) return null;

    try {
      const payload = await fetchFromInstance(instance, videoId);
      health.delete(key);
      return payload;
    } catch (error) {
      health.set(key, Date.now());
      attempts.push(`${hostOf(instance)}: ${error?.message || "failed"}`);
      return null;
    }
  };

  for (const instance of orderInstances(seeds)) {
    const payload = await tryInstance(instance);
    if (payload) {
      cache.set(videoId, { at: Date.now(), data: payload });
      return payload;
    }
  }

  const discovered = await discoverInstances();
  for (const instance of orderInstances(uniqueInstances([...seeds, ...discovered]))) {
    const payload = await tryInstance(instance);
    if (payload) {
      cache.set(videoId, { at: Date.now(), data: payload });
      return payload;
    }
  }

  throw new Error(
    attempts.length
      ? `All Invidious instances failed (${attempts.slice(0, 3).join("; ")}).`
      : "No Invidious instances are configured."
  );
}
