import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, ApiError } from "../lib/api";
import { useStore } from "../lib/store";
import { isLikelyUrl } from "../lib/format";
import type { DownloadJob, MediaType, VideoInfo } from "../lib/types";

export type DownloaderStage =
  | "idle"
  | "fetching"
  | "ready"
  | "starting"
  | "downloading"
  | "processing"
  | "completed"
  | "error";

export interface DownloadParams {
  type: MediaType;
  height: number;
  quality: string;
  format: string;
}

export function useDownloader() {
  const { addHistory, settings } = useStore();
  const [stage, setStage] = useState<DownloaderStage>("idle");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [job, setJob] = useState<DownloadJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");

  const pollTimer = useRef<number | null>(null);
  const requestId = useRef(0);
  const lastParams = useRef<DownloadParams | null>(null);
  const retryCount = useRef(0);
  const completedJob = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current !== null) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const triggerBrowserDownload = useCallback((target: DownloadJob) => {
    if (!target.downloadUrl) return;
    try {
      const anchor = document.createElement("a");
      anchor.href = api.fileUrl(target.downloadUrl);
      anchor.download = target.filename || "download";
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      toast.error("The file is ready, but your browser blocked the download. Use “Save file”.");
    }
  }, []);

  const completeJob = useCallback(
    (finished: DownloadJob, meta: VideoInfo, params: DownloadParams) => {
      if (completedJob.current === finished.id) return;
      completedJob.current = finished.id;

      if (settings.saveHistory) {
        addHistory({
          url: meta.url,
          title: meta.title,
          thumbnail: meta.thumbnail,
          platform: meta.platform,
          type: params.type,
          quality: params.quality,
          format: params.format,
          sizeBytes: finished.sizeBytes || 0,
          duration: meta.duration,
          channel: meta.channel,
          status: "completed",
        });
      }

      toast.success(
        `${params.type === "audio" ? "Audio" : "Video"} ready — saving ${finished.filename || "your file"}`,
        { duration: 5000 }
      );

      if (settings.autoDownload) {
        window.setTimeout(() => triggerBrowserDownload(finished), 250);
      }
    },
    [addHistory, settings.autoDownload, settings.saveHistory, triggerBrowserDownload]
  );

  const poll = useCallback(
    (id: string, meta: VideoInfo, params: DownloadParams) => {
      stopPolling();
      const tick = async () => {
        try {
          const latest = await api.job(id);
          setJob(latest);
          retryCount.current = 0;

          if (latest.status === "completed") {
            setStage("completed");
            completeJob(latest, meta, params);
            return;
          }
          if (latest.status === "failed") {
            setStage("error");
            setError(latest.error || "The download failed. Please try again.");
            toast.error(latest.error || "The download failed.");
            return;
          }
          setStage(latest.status === "processing" ? "processing" : "downloading");
          pollTimer.current = window.setTimeout(tick, 900);
        } catch (err) {
          retryCount.current += 1;
          if (retryCount.current >= 4) {
            setStage("error");
            setError(err instanceof ApiError ? err.message : "Lost connection to the download service.");
            return;
          }
          pollTimer.current = window.setTimeout(tick, 1500 * retryCount.current);
        }
      };
      pollTimer.current = window.setTimeout(tick, 600);
    },
    [completeJob, stopPolling]
  );

  const fetchInfo = useCallback(
    async (rawUrl: string) => {
      const url = rawUrl.trim();
      if (!isLikelyUrl(url)) {
        setStage("error");
        setError("Paste a valid link that starts with https://");
        toast.error("That doesn't look like a valid link.");
        return;
      }

      stopPolling();
      const current = ++requestId.current;
      setSourceUrl(url);
      setStage("fetching");
      setError(null);
      setInfo(null);
      setJob(null);
      completedJob.current = null;

      try {
        const result = await api.info(url);
        if (current !== requestId.current) return;
        setInfo(result);
        setStage("ready");
        toast.success(`Found ${result.platform} video — ready to download.`, { duration: 3200 });
      } catch (err) {
        if (current !== requestId.current) return;
        const message = err instanceof ApiError ? err.message : "We couldn't read that link.";
        setError(message);
        setStage("error");
        toast.error(message);
      }
    },
    [stopPolling]
  );

  const start = useCallback(
    async (params: DownloadParams) => {
      if (!info) return;
      stopPolling();
      lastParams.current = params;
      setStage("starting");
      setError(null);
      setJob(null);
      completedJob.current = null;

      try {
        const started = await api.startDownload({
          url: info.url,
          title: info.title,
          thumbnail: info.thumbnail,
          platform: info.platform,
          type: params.type,
          height: params.type === "video" ? params.height : 0,
          quality: params.quality,
          format: params.format,
          direct: info.direct,
          duration: info.duration,
        });
        setJob(started);
        setStage("downloading");
        poll(started.id, info, params);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "We couldn't start that download.";
        setError(message);
        setStage("error");
        toast.error(message);
      }
    },
    [info, poll, stopPolling]
  );

  const cancel = useCallback(async () => {
    if (!job) return;
    stopPolling();
    try {
      await api.cancel(job.id);
      toast("Download cancelled.", { icon: "⏹" });
    } catch {
      /* session may already be gone */
    }
    setJob(null);
    setStage(info ? "ready" : "idle");
  }, [info, job, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    requestId.current += 1;
    setStage("idle");
    setInfo(null);
    setJob(null);
    setError(null);
    setSourceUrl("");
    completedJob.current = null;
  }, [stopPolling]);

  const retry = useCallback(() => {
    if (lastParams.current) {
      start(lastParams.current);
    } else if (sourceUrl) {
      fetchInfo(sourceUrl);
    }
  }, [fetchInfo, sourceUrl, start]);

  const redownload = useCallback(() => {
    if (job?.downloadUrl) {
      triggerBrowserDownload(job);
      toast.success("Saving your file again.");
    } else if (lastParams.current) {
      start(lastParams.current);
    }
  }, [job, start, triggerBrowserDownload]);

  return {
    stage,
    info,
    job,
    error,
    sourceUrl,
    fetchInfo,
    start,
    cancel,
    reset,
    retry,
    redownload,
    triggerBrowserDownload,
  };
}
