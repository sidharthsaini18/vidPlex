import type {
  DownloadJob,
  HealthPayload,
  MediaType,
  RecentItem,
  StatsPayload,
  VideoInfo,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "request_failed", status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 90_000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
    });

    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const error = (payload as { error?: { message?: string; code?: string } } | null)?.error;
      throw new ApiError(
        error?.message || `Request failed (${response.status}).`,
        error?.code || "request_failed",
        response.status
      );
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request took too long. Please try again.", "timeout", 408);
    }
    throw new ApiError(
      "We couldn't reach the download service. Make sure the API server is running.",
      "network_error",
      0
    );
  } finally {
    window.clearTimeout(timer);
  }
}

export const api = {
  health: () => request<HealthPayload>("/api/health", {}, 20_000),
  stats: () => request<StatsPayload>("/api/stats", {}, 15_000),
  recent: (limit = 10) =>
    request<{ items: RecentItem[] }>(`/api/recent?limit=${limit}`, {}, 15_000),
  info: (url: string) =>
    request<VideoInfo>("/api/info", { method: "POST", body: JSON.stringify({ url }) }, 95_000),
  startDownload: (payload: {
    url: string;
    title: string;
    thumbnail: string;
    platform: string;
    type: MediaType;
    height: number;
    quality: string;
    format: string;
    direct?: boolean;
    duration?: number;
  }) =>
    request<DownloadJob>("/api/download", { method: "POST", body: JSON.stringify(payload) }, 30_000),
  job: (id: string) => request<DownloadJob>(`/api/download/${id}`, {}, 20_000),
  cancel: (id: string) =>
    request<{ id: string; status: string }>(`/api/download/${id}`, { method: "DELETE" }, 20_000),
  fileUrl: (path: string) => (path.startsWith("http") ? path : `${API_BASE}${path}`),
};
