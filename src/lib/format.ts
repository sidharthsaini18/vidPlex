import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes?: number | null, decimals = 1): string {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / Math.pow(1024, index);
  return `${size.toFixed(index === 0 ? 0 : decimals).replace(/\.0$/, "")} ${units[index]}`;
}

export function formatCompact(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "0";
  if (value < 1000) return String(Math.round(value));
  if (value < 1_000_000) return `${(value / 1000).toFixed(decimals).replace(/\.0$/, "")}K`;
  if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(decimals).replace(/\.0$/, "")}M`;
  return `${(value / 1_000_000_000).toFixed(decimals).replace(/\.0$/, "")}B`;
}

export function formatCount(value?: number | null): string {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDuration(seconds?: number | null): string {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function qualityLabel(height: number): string {
  if (height >= 2160) return "4K";
  if (height >= 1440) return "2K";
  return `${height}p`;
}

export function truncate(value: string, length = 60): string {
  if (!value) return "";
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function isLikelyUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
