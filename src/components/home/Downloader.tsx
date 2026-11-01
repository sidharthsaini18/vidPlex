import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Copy,
  Download,
  FileAudio,
  FileVideo,
  Gauge,
  Link2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDownloader } from "../../hooks/useDownloader";
import { useStore } from "../../lib/store";
import { onAnalyze } from "../../lib/events";
import { formatBytes, formatCount, formatDuration, qualityLabel } from "../../lib/format";
import type { MediaType, VideoInfo } from "../../lib/types";
import { Button } from "../ui/Button";
import { PlatformIcon } from "../ui/PlatformIcon";
import { VideoPreviewSkeleton } from "../ui/Skeleton";
import { cn } from "../../lib/format";

const PLATFORMS = ["YouTube", "Instagram", "Facebook", "TikTok", "X", "Vimeo"];
const STANDARD_HEIGHTS = [360, 480, 720, 1080, 1440, 2160];

function defaultHeightFor(info: VideoInfo, preferred: number) {
  const heights = [...info.heights].filter((h) => h > 0).sort((a, b) => a - b);
  if (!heights.length) return 0;
  const below = heights.filter((h) => h <= preferred);
  return below.length ? below[below.length - 1] : heights[heights.length - 1];
}

export function Downloader() {
  const {
    stage,
    info,
    job,
    error,
    fetchInfo,
    start,
    cancel,
    reset,
    retry,
    redownload,
  } = useDownloader();
  const { settings } = useStore();

  const [url, setUrl] = useState("");
  const [type, setType] = useState<MediaType>("video");
  const [height, setHeight] = useState(1080);
  const [bitrate, setBitrate] = useState(320);
  const [audioFormat, setAudioFormat] = useState<"mp3" | "m4a">("mp3");
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = stage === "fetching" || stage === "starting" || stage === "downloading" || stage === "processing";
  const completed = stage === "completed";

  useEffect(() => {
    return onAnalyze((nextUrl) => {
      setUrl(nextUrl);
      fetchInfo(nextUrl);
      window.setTimeout(() => {
        document.getElementById("downloader")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    });
  }, [fetchInfo]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pending = params.get("analyze");
    if (!pending) return;
    setUrl(pending);
    fetchInfo(pending);
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
  }, [fetchInfo]);

  useEffect(() => {
    if (!info) return;
    const preferred = defaultHeightFor(info, settings.defaultQuality);
    const hasVideo = info.heights.some((h) => h > 0) || info.heights.includes(0);
    if (!hasVideo || settings.defaultFormat === "audio") {
      setType(hasVideo ? settings.defaultFormat : "audio");
    } else {
      setType("video");
    }
    setHeight(preferred);
  }, [info, settings.defaultFormat, settings.defaultQuality]);

  const selectedFormat = useMemo(
    () => info?.formats.find((format) => format.height === height) || null,
    [info, height]
  );

  const qualityOptions = useMemo(() => {
    if (!info) return [];
    if (info.heights.includes(0) && info.heights.length === 1) {
      return [{ height: 0, label: "Source", filesize: info.formats[0]?.filesize || null, available: true }];
    }
    const extras = info.heights.filter((h) => h > 0 && !STANDARD_HEIGHTS.includes(h));
    const heights = [...extras, ...STANDARD_HEIGHTS].sort((a, b) => a - b);
    return heights.map((h) => {
      const format = info.formats.find((item) => item.height === h);
      return {
        height: h,
        label: qualityLabel(h),
        filesize: format?.filesize || null,
        available: Boolean(format),
      };
    });
  }, [info]);

  const audioSize = useMemo(() => {
    if (!info?.duration) return null;
    return Math.round((bitrate * 1000 * info.duration) / 8);
  }, [bitrate, info?.duration]);

  const estimatedSize = type === "video" ? selectedFormat?.filesize || null : audioSize;
  const downloadLabel =
    type === "video"
      ? height === 0
        ? "Source MP4"
        : `${qualityLabel(height)} MP4`
      : `${audioFormat.toUpperCase()} · ${bitrate} kbps`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    fetchInfo(url);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast.error("Your clipboard is empty.");
        return;
      }
      setUrl(text.trim());
      inputRef.current?.focus();
      toast.success("Link pasted — analyzing…");
      fetchInfo(text);
    } catch {
      toast.error("Clipboard access was blocked. Paste the link manually.");
      inputRef.current?.focus();
    }
  };

  const handleDownload = () => {
    if (!info) return;
    start({
      type,
      height: type === "video" ? height : 0,
      quality: type === "video" ? (height === 0 ? "Source" : qualityLabel(height)) : `${bitrate} kbps`,
      format: type === "video" ? "mp4" : audioFormat,
    });
  };

  const handleCopy = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.url);
      toast.success("Source link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const handleNew = () => {
    reset();
    setUrl("");
    inputRef.current?.focus();
  };

  const progress = completed ? 100 : Math.max(job?.progress || 0, stage === "processing" ? 92 : 0);
  const showPreview = info && stage !== "idle" && stage !== "fetching";

  return (
    <section id="downloader" className="relative scroll-mt-28">
      <div className="container-px">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-[1080px]"
        >
          <div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[48px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,58,237,.22),transparent_70%)] blur-2xl" />
          <div className="ring-border overflow-hidden rounded-[30px] border border-white/[0.1] bg-[#070d1d]/80 shadow-[0_60px_140px_-40px_rgba(0,0,0,.95)] backdrop-blur-2xl">
            {/* Window chrome */}
            <div className="flex h-12 items-center justify-between border-b border-white/[0.07] bg-white/[0.02] px-4 sm:px-5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:flex">
                <Sparkles className="h-3 w-3 text-violet-300" />
                VidPlex Studio
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]" />
                Engine ready
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-7">
              {/* URL form */}
              <form onSubmit={handleSubmit} className="relative">
                <div
                  className={cn(
                    "group flex flex-col gap-2 rounded-2xl border border-white/[0.1] bg-[#050a18]/70 p-1.5 transition-all duration-300 focus-within:border-violet-400/40 focus-within:shadow-[0_0_0_4px_rgba(124,58,237,.08)] sm:flex-row sm:items-center",
                    stage === "fetching" && "border-violet-400/30"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                    <Link2 className="h-[18px] w-[18px] shrink-0 text-slate-500 transition group-focus-within:text-violet-300" />
                    <input
                      ref={inputRef}
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Paste a video link — YouTube, TikTok, Instagram, X…"
                      className="h-12 w-full min-w-0 bg-transparent text-[14px] text-white placeholder:text-slate-600 focus:outline-none sm:h-13 sm:text-[15px]"
                      aria-label="Video URL"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {url && !busy && (
                      <button
                        type="button"
                        onClick={() => {
                          setUrl("");
                          inputRef.current?.focus();
                        }}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                        aria-label="Clear URL"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[12px] font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white sm:h-12"
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                      Paste
                    </button>
                    <Button
                      type="submit"
                      size="lg"
                      magnetic
                      loading={stage === "fetching"}
                      disabled={busy && stage !== "fetching"}
                      className="h-11 flex-1 px-5 sm:h-12 sm:flex-none"
                      rightIcon={stage === "fetching" ? undefined : <ArrowRight className="h-4 w-4" />}
                    >
                      {stage === "fetching" ? "Analyzing…" : "Fetch video"}
                    </Button>
                  </div>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">Works with</span>
                  {PLATFORMS.map((platform) => (
                    <span
                      key={platform}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-slate-200"
                    >
                      <PlatformIcon platform={platform} size={11} />
                      {platform}
                    </span>
                  ))}
                  <span className="px-1 text-[11px] text-slate-600">+18 more</span>
                </div>
                <div className="hidden items-center gap-4 text-[11px] text-slate-500 sm:flex">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Private
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-violet-300" /> No sign-up
                  </span>
                </div>
              </div>

              {/* Error (no info) */}
              <AnimatePresence>
                {error && !info && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.07] p-4 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500/15">
                          <AlertTriangle className="h-4 w-4 text-rose-300" />
                        </span>
                        <div>
                          <p className="text-[13px] font-medium text-rose-100">We couldn't analyze that link</p>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-rose-200/70">{error}</p>
                        </div>
                      </div>
                      <div className="ml-auto flex shrink-0 gap-2">
                        <Button variant="secondary" size="sm" onClick={retry} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
                          Try again
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleNew}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              <div className="mt-5">
                {stage === "idle" && <EmptyState />}
                {stage === "fetching" && <VideoPreviewSkeleton />}
                {showPreview && info && (
                  <VideoPreview
                    info={info}
                    type={type}
                    onTypeChange={setType}
                    height={height}
                    onHeightChange={setHeight}
                    bitrate={bitrate}
                    onBitrateChange={setBitrate}
                    audioFormat={audioFormat}
                    onAudioFormatChange={setAudioFormat}
                    qualityOptions={qualityOptions}
                    estimatedSize={estimatedSize}
                    downloadLabel={downloadLabel}
                    stage={stage}
                    job={job}
                    error={error}
                    progress={progress}
                    onDownload={handleDownload}
                    onCancel={cancel}
                    onRetry={retry}
                    onRedownload={redownload}
                    onCopy={handleCopy}
                    onNew={handleNew}
                    completed={completed}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Real files, not placeholders
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-cyan-300" /> Adaptive speed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-violet-300" /> Files auto-clean in 30 min
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 dot-bg opacity-[0.18]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-600/15 blur-[70px]" />
      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-5 grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 rounded-2xl border border-white/[0.08] bg-white/[0.03]" />
          <span className="absolute inset-0 animate-spin-slow rounded-2xl border border-dashed border-violet-400/25" />
          <Download className="relative h-6 w-6 text-violet-200" />
        </div>
        <h3 className="text-[17px] font-semibold text-white">Your next download starts here</h3>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
          Paste any public video link above. We'll pull the real title, thumbnail and every available quality — then save the actual file.
        </p>
        <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2">
          {[
            { icon: Link2, label: "Paste link" },
            { icon: Sparkles, label: "Pick quality" },
            { icon: Download, label: "Save file" },
          ].map(({ icon: Icon, label }, index) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-3"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 text-violet-200">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
                0{index + 1} · {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface VideoPreviewProps {
  info: VideoInfo;
  type: MediaType;
  onTypeChange: (type: MediaType) => void;
  height: number;
  onHeightChange: (height: number) => void;
  bitrate: number;
  onBitrateChange: (bitrate: number) => void;
  audioFormat: "mp3" | "m4a";
  onAudioFormatChange: (format: "mp3" | "m4a") => void;
  qualityOptions: Array<{ height: number; label: string; filesize: number | null; available: boolean }>;
  estimatedSize: number | null;
  downloadLabel: string;
  stage: string;
  job: ReturnType<typeof useDownloader>["job"];
  error: string | null;
  progress: number;
  onDownload: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onRedownload: () => void;
  onCopy: () => void;
  onNew: () => void;
  completed: boolean;
}

function VideoPreview({
  info,
  type,
  onTypeChange,
  height,
  onHeightChange,
  bitrate,
  onBitrateChange,
  audioFormat,
  onAudioFormatChange,
  qualityOptions,
  estimatedSize,
  downloadLabel,
  stage,
  job,
  error,
  progress,
  onDownload,
  onCancel,
  onRetry,
  onRedownload,
  onCopy,
  onNew,
  completed,
}: VideoPreviewProps) {
  const busy = ["starting", "downloading", "processing"].includes(stage);
  const failed = stage === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Video header */}
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="group relative aspect-video overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1120] lg:aspect-[4/3]">
          {info.thumbnail ? (
            <img
              src={info.thumbnail}
              alt={info.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(124,58,237,.35),rgba(2,6,23,.9))]">
              <PlatformIcon platform={info.platform} size={44} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/85 via-transparent to-transparent" />
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
            <PlatformIcon platform={info.platform} size={10} />
            {info.platform}
          </div>
          <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur">
            {info.durationLabel}
          </div>
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 opacity-0 backdrop-blur-md transition duration-300 group-hover:opacity-100">
              <Download className="h-4 w-4 text-white" />
            </span>
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <PlatformIcon platform={info.platform} size={12} />
              {info.channel || info.platform}
            </span>
            {info.viewCount ? (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-[11px] text-slate-500">{formatCount(info.viewCount)} views</span>
              </>
            ) : null}
            <span className="ml-auto flex items-center gap-1">
              <button
                onClick={onCopy}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Copy source link"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-white sm:text-[19px]">
            {info.title}
          </h3>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-500/[0.07] px-2 py-0.5 text-[10px] font-medium text-emerald-200">
              <Check className="h-3 w-3" /> Link verified
            </span>
            {info.heights.length > 0 && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                {info.heights.length} video quality{info.heights.length > 1 ? "s" : ""}
              </span>
            )}
            {info.duration > 0 && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                {formatDuration(info.duration)}
              </span>
            )}
            {info.isLive && (
              <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-200">
                Live
              </span>
            )}
          </div>

          {completed && job && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex flex-col gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-3 sm:flex-row sm:items-center"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-emerald-100">{job.filename || "File ready"}</p>
                <p className="text-[11px] text-emerald-200/60">
                  {formatBytes(job.sizeBytes)} · saved to your device
                </p>
              </div>
              <div className="ml-auto flex shrink-0 gap-2">
                <Button size="sm" variant="secondary" onClick={onRedownload}>
                  Save file
                </Button>
                <Button size="sm" variant="ghost" onClick={onNew}>
                  New
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(
              [
                { id: "video" as MediaType, label: "MP4 Video", icon: FileVideo, hint: "Picture + sound" },
                { id: "audio" as MediaType, label: "MP3 Audio", icon: FileAudio, hint: "Sound only" },
              ] as const
            ).map((option) => {
              const Icon = option.icon;
              const active = type === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onTypeChange(option.id)}
                  disabled={busy}
                  className={cn(
                    "group flex min-w-[132px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-300",
                    active
                      ? "border-violet-400/30 bg-gradient-to-br from-violet-500/[0.14] to-cyan-500/[0.05] shadow-[0_0_0_1px_rgba(124,58,237,.15),0_10px_30px_-15px_rgba(124,58,237,.6)]"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]",
                    busy && "cursor-not-allowed opacity-70"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg transition",
                      active ? "bg-violet-500/20 text-violet-200" : "bg-white/[0.05] text-slate-400"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className={cn("block text-[12px] font-semibold", active ? "text-white" : "text-slate-300")}>
                      {option.label}
                    </span>
                    <span className="block text-[10px] text-slate-500">{option.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Direct file · no watermark
          </div>
        </div>

        <div className="mt-4">
          {type === "video" ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Quality</span>
                <span className="text-[10px] text-slate-600">Source availability shown live</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {qualityOptions.map((option) => {
                  const active = height === option.height;
                  return (
                    <button
                      key={option.height}
                      onClick={() => option.available && onHeightChange(option.height)}
                      disabled={!option.available || busy}
                      title={option.available ? `${option.label} · ${formatBytes(option.filesize)}` : "Not available from the source"}
                      className={cn(
                        "relative rounded-xl border px-2 py-2.5 text-center transition-all duration-300",
                        active
                          ? "border-violet-400/40 bg-violet-500/[0.14] text-white shadow-[0_0_20px_-8px_rgba(124,58,237,.8)]"
                          : option.available
                            ? "border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-white/[0.16] hover:bg-white/[0.05]"
                            : "cursor-not-allowed border-white/[0.04] bg-white/[0.01] text-slate-700",
                        busy && "cursor-not-allowed"
                      )}
                    >
                      <span className="block text-[13px] font-semibold tabular-nums">{option.label}</span>
                      <span className={cn("mt-0.5 block text-[9px]", active ? "text-violet-200/80" : "text-slate-600")}>
                        {option.available ? formatBytes(option.filesize) : "—"}
                      </span>
                      {active && (
                        <motion.span
                          layoutId="quality-active"
                          className="absolute inset-0 -z-10 rounded-xl ring-1 ring-inset ring-violet-300/30"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Audio quality</span>
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
                  {(["mp3", "m4a"] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => onAudioFormatChange(format)}
                      disabled={busy}
                      className={cn(
                        "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
                        audioFormat === format ? "bg-white/[0.1] text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 320, label: "320 kbps", hint: "Studio" },
                  { value: 192, label: "192 kbps", hint: "Balanced" },
                  { value: 128, label: "128 kbps", hint: "Compact" },
                ].map((option) => {
                  const active = bitrate === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => onBitrateChange(option.value)}
                      disabled={busy}
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-center transition-all duration-300",
                        active
                          ? "border-cyan-400/40 bg-cyan-500/[0.1] text-white shadow-[0_0_20px_-8px_rgba(6,182,212,.8)]"
                          : "border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-white/[0.16] hover:bg-white/[0.05]"
                      )}
                    >
                      <span className="block text-[12px] font-semibold">{option.label}</span>
                      <span className={cn("mt-0.5 block text-[9px]", active ? "text-cyan-200/80" : "text-slate-600")}>
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-violet-300" />
              {downloadLabel}
            </span>
            <span className="text-slate-700">·</span>
            <span>≈ {formatBytes(estimatedSize)}</span>
          </div>
          <div className="flex items-center gap-2">
            {busy ? (
              <Button variant="danger" size="lg" onClick={onCancel} leftIcon={<X className="h-4 w-4" />}>
                Cancel
              </Button>
            ) : failed ? (
              <Button size="lg" onClick={onRetry} leftIcon={<RotateCcw className="h-4 w-4" />} magnetic>
                Try again
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={onDownload}
                magnetic
                leftIcon={<Download className="h-4 w-4" />}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="min-w-[220px]"
              >
                {completed ? "Download again" : "Start download"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error with info */}
      <AnimatePresence>
        {failed && error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.07] p-4"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-rose-100">Download failed</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-rose-200/70">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onRetry} className="ml-auto shrink-0">
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <AnimatePresence>
        {busy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#050a18]/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500/15">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-white">
                      {stage === "starting" ? "Starting secure download" : job?.phase || "Downloading"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {job?.speed ? `${job.speed} · ` : ""}
                      {job?.eta ? `ETA ${job.eta}` : "Preparing media stream"}
                    </p>
                  </div>
                </div>
                <span className="text-[20px] font-semibold tabular-nums tracking-tight text-white">
                  {Math.round(progress)}
                  <span className="text-[12px] text-slate-500">%</span>
                </span>
              </div>
              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="relative h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#3B82F6,#06B6D4)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(3, progress)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)] bg-[length:200%_100%] animate-shimmer" />
                </motion.div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
                <span>Encrypted transfer · real media file</span>
                <span>Keep this tab open</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
