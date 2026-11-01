export type MediaType = "video" | "audio";

export interface VideoFormat {
  formatId: string | null;
  height: number;
  quality: string;
  ext: string;
  fps: number | null;
  codec: string | null;
  filesize: number | null;
  hasAudio: boolean;
}

export interface AudioFormat {
  format: "mp3" | "m4a";
  quality: string;
  bitrate: number;
  filesize: number | null;
}

export interface VideoInfo {
  id: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: string;
  channel: string;
  channelUrl: string | null;
  duration: number;
  durationLabel: string;
  viewCount: number | null;
  uploadDate: string | null;
  isLive: boolean;
  formats: VideoFormat[];
  heights: number[];
  audioFormats: AudioFormat[];
  extractor: string;
  direct?: boolean;
  cached?: boolean;
}

export type JobStatus =
  | "queued"
  | "downloading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface DownloadJob {
  id: string;
  status: JobStatus;
  progress: number;
  speed: string | null;
  eta: string | null;
  phase: string;
  title: string;
  type: MediaType;
  quality: string;
  format: string;
  sizeBytes: number | null;
  filename: string | null;
  error: string | null;
  createdAt: number;
  completedAt: number | null;
  downloadUrl: string | null;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: string;
  type: MediaType;
  quality: string;
  format: string;
  sizeBytes: number;
  duration: number;
  createdAt: number;
  status: "completed" | "failed";
  favorite: boolean;
  channel?: string;
}

export interface PlatformStat {
  name: string;
  count: number;
}

export interface Settings {
  defaultQuality: number;
  defaultFormat: MediaType;
  autoDownload: boolean;
  notifications: boolean;
  saveHistory: boolean;
}

export interface StatsPayload {
  totalDownloads: number;
  activeUsers: number;
  platforms: number;
  avgSpeedMbps: number;
  realDownloads: number;
  realBytes: number;
  last24h: number;
  activeJobs: number;
  uptime: number;
}

export interface RecentItem {
  id: string;
  title: string;
  thumbnail: string;
  platform: string;
  quality: string;
  format: string;
  sizeBytes: number;
  status: string;
  createdAt: number;
  sample?: boolean;
}

export interface HealthPayload {
  status: "operational" | "degraded";
  checks: { server: boolean; ffmpeg: boolean; ytdlp: boolean; version: string | null };
  uptime: number;
  activeJobs: number;
  timestamp: number;
}
