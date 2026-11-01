import dns from "node:dns/promises";
import net from "node:net";

const PRIVATE_V4 = [
  [/^10\./, "private"],
  [/^127\./, "loopback"],
  [/^169\.254\./, "link-local"],
  [/^172\.(1[6-9]|2\d|3[0-1])\./, "private"],
  [/^192\.168\./, "private"],
  [/^0\./, "reserved"],
  [/^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./, "carrier-grade NAT"],
];

/**
 * Validate a user supplied media URL.
 * Blocks non-HTTP protocols, credentials, local/private hosts and odd ports.
 */
export function validateMediaUrl(raw) {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { ok: false, message: "Please paste a video URL." };
  }
  const value = raw.trim();
  if (value.length > 2048) {
    return { ok: false, message: "That URL is too long." };
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, message: "That doesn't look like a valid URL." };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, message: "Only http and https links are supported." };
  }
  if (url.username || url.password) {
    return { ok: false, message: "URLs containing credentials are not allowed." };
  }
  if (url.port && !["80", "443", ""].includes(url.port)) {
    return { ok: false, message: "That URL uses an unsupported port." };
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return { ok: false, message: "That host is not allowed." };
  }

  if (net.isIP(host)) {
    const blocked = isPrivateAddress(host);
    if (blocked) {
      return { ok: false, message: "Private network addresses are not allowed." };
    }
  }

  return { ok: true, url: url.toString() };
}

/** Resolve a hostname and make sure it points at a public address. */
export async function assertPublicHost(hostname) {
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Private network addresses are not allowed.");
    return;
  }
  let records;
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("We couldn't resolve that website.");
  }
  if (!records.length) throw new Error("We couldn't resolve that website.");
  for (const record of records) {
    if (isPrivateAddress(record.address)) {
      throw new Error("Private network addresses are not allowed.");
    }
  }
}

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    return PRIVATE_V4.some(([pattern]) => pattern.test(address));
  }
  if (net.isIPv6(address)) {
    const value = address.toLowerCase();
    if (value === "::1" || value === "::") return true;
    if (value.startsWith("fc") || value.startsWith("fd")) return true; // unique local
    if (value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb")) {
      return true; // link local
    }
    if (value.startsWith("::ffff:")) {
      return isPrivateAddress(value.slice(7));
    }
  }
  return false;
}

/** Tiny in-memory sliding window rate limiter. */
export function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => t > cutoff);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
  }, windowMs).unref?.();

  return function rateLimit(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const times = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (times.length >= max) {
      const retry = Math.ceil((windowMs - (now - times[0])) / 1000);
      res.setHeader("Retry-After", String(retry));
      return res.status(429).json({
        error: {
          code: "rate_limited",
          message: `You're going a little fast. Try again in ${retry}s.`,
        },
      });
    }
    times.push(now);
    hits.set(key, times);
    next();
  };
}

export function sanitizeFilename(name, fallback = "download") {
  const cleaned = String(name || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\.+|\.+$/g, "")
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
}

export function platformFromExtractor(extractor = "", hostname = "") {
  const key = String(extractor).toLowerCase();
  const host = String(hostname).toLowerCase();
  if (key.includes("youtube") || host.includes("youtu")) return "YouTube";
  if (key.includes("instagram") || host.includes("instagram")) return "Instagram";
  if (key.includes("facebook") || host.includes("facebook") || host.includes("fb.watch")) return "Facebook";
  if (key.includes("tiktok") || host.includes("tiktok")) return "TikTok";
  if (key.includes("twitter") || host.includes("twitter") || host.includes("x.com")) return "X";
  if (key.includes("vimeo") || host.includes("vimeo")) return "Vimeo";
  if (key.includes("dailymotion") || host.includes("dailymotion")) return "Dailymotion";
  if (key.includes("twitch") || host.includes("twitch")) return "Twitch";
  if (key.includes("reddit") || host.includes("reddit")) return "Reddit";
  if (key.includes("pinterest") || host.includes("pinterest")) return "Pinterest";
  return "Direct";
}
