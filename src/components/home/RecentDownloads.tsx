import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Clock3,
  Download,
  Heart,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useStore } from "../../lib/store";
import { api } from "../../lib/api";
import { formatBytes, formatDateShort, timeAgo } from "../../lib/format";
import type { RecentItem } from "../../lib/types";
import { GlassCard } from "../ui/GlassCard";
import { StatusBadge } from "../ui/Badge";
import { PlatformIcon } from "../ui/PlatformIcon";
import { SectionHeading } from "../ui/SectionHeading";
import { cn } from "../../lib/format";

type Filter = "all" | "video" | "audio";

interface DisplayItem {
  id: string;
  title: string;
  thumbnail: string;
  platform: string;
  quality: string;
  format: string;
  sizeBytes: number;
  createdAt: number;
  status: string;
  sample: boolean;
  type: "video" | "audio";
  favorite: boolean;
  url?: string;
}

export function RecentDownloads() {
  const { history, toggleFavorite, removeHistory, analytics } = useStore();
  const [remote, setRemote] = useState<RecentItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .recent(8)
      .then((payload) => alive && setRemote(payload.items))
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo<DisplayItem[]>(() => {
    const local: DisplayItem[] = history.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      platform: item.platform,
      quality: item.quality,
      format: item.format,
      sizeBytes: item.sizeBytes,
      createdAt: item.createdAt,
      status: item.status,
      sample: false,
      type: item.type,
      favorite: item.favorite,
      url: item.url,
    }));

    if (local.length >= 5) return local;
    const seen = new Set(local.map((item) => item.title));
    const samples: DisplayItem[] = remote
      .filter((item) => !seen.has(item.title))
      .slice(0, Math.max(0, 6 - local.length))
      .map((item) => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        platform: item.platform,
        quality: item.quality,
        format: item.format,
        sizeBytes: item.sizeBytes,
        createdAt: item.createdAt,
        status: item.status,
        sample: Boolean(item.sample),
        type: item.format === "mp3" || item.format === "m4a" ? "audio" : "video",
        favorite: false,
      }));
    return [...local, ...samples];
  }, [history, remote]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.type !== filter) return false;
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.platform.toLowerCase().includes(term) ||
        item.quality.toLowerCase().includes(term)
      );
    });
  }, [filter, items, search]);

  const handleFavorite = (item: DisplayItem) => {
    if (item.sample) {
      toast("Download something first to add it to favorites.", { icon: "♡" });
      return;
    }
    toggleFavorite(item.id);
  };

  return (
    <section id="recent" className="relative scroll-mt-28 py-16 sm:py-20">
      <div className="container-px">
        <SectionHeading
          align="left"
          eyebrow="Your library"
          title={
            <>
              Recent downloads, <span className="gradient-text">beautifully organized.</span>
            </>
          }
          description="Every file you save lands here with its real format, size and status. Search instantly, favorite the keepers, and jump back to the source."
          action={
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[12px] font-medium text-slate-300 transition hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white"
            >
              Open dashboard
              <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="overflow-visible">
            <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-72">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search downloads…"
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-[12px] text-white placeholder:text-slate-600 transition focus:border-violet-400/30 focus:bg-white/[0.05] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-0.5">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "video", label: "Video" },
                      { id: "audio", label: "Audio" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition",
                        filter === tab.id
                          ? "bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]"
                          : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-violet-300" />
                  {analytics.week} saved this week
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Download className="h-3 w-3 text-cyan-300" />
                  {formatBytes(analytics.totalBytes)} library
                </span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="skeleton h-11 w-[68px] rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-1/3 rounded" />
                      <div className="skeleton h-2.5 w-1/5 rounded" />
                    </div>
                    <div className="skeleton h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                  <Search className="h-5 w-5 text-slate-500" />
                </span>
                <h4 className="mt-4 text-sm font-semibold text-white">No downloads match</h4>
                <p className="mt-1 max-w-xs text-[12px] text-slate-500">
                  Try a different search, or paste a new link in the downloader above.
                </p>
                <a
                  href="#downloader"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-4 py-2 text-[11px] font-medium text-white transition hover:bg-white/[0.1]"
                >
                  <Download className="h-3.5 w-3.5" /> New download
                </a>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        <th className="px-5 py-3 font-semibold">Media</th>
                        <th className="px-3 py-3 font-semibold">Platform</th>
                        <th className="px-3 py-3 font-semibold">Format</th>
                        <th className="px-3 py-3 font-semibold">Size</th>
                        <th className="px-3 py-3 font-semibold">Saved</th>
                        <th className="px-3 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="group border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-[68px] shrink-0 overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03]">
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="grid h-full w-full place-items-center">
                                    <PlatformIcon platform={item.platform} size={16} />
                                  </span>
                                )}
                                <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                {item.type === "audio" && (
                                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[8px] font-semibold uppercase text-cyan-200">
                                    {item.format}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-[260px] truncate text-[12.5px] font-medium text-slate-200 transition group-hover:text-white">
                                  {item.title}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-600">
                                  {item.type === "audio" ? "Audio" : "Video"} · {item.quality}
                                  {item.sample ? " · Sample activity" : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                              <PlatformIcon platform={item.platform} size={12} />
                              {item.platform}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-400">
                              {item.format}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[11px] tabular-nums text-slate-400">
                            {formatBytes(item.sizeBytes)}
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock3 className="h-3 w-3" />
                              {timeAgo(item.createdAt)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {item.sample ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                Sample
                              </span>
                            ) : (
                              <StatusBadge status={item.status} />
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleFavorite(item)}
                                className={cn(
                                  "grid h-7 w-7 place-items-center rounded-lg transition",
                                  item.favorite
                                    ? "text-rose-400 hover:bg-rose-500/10"
                                    : "text-slate-600 hover:bg-white/[0.06] hover:text-white"
                                )}
                                aria-label="Toggle favorite"
                              >
                                <Heart className={cn("h-3.5 w-3.5", item.favorite && "fill-current")} />
                              </button>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
                                  aria-label="Open source"
                                >
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                              ) : null}
                              {!item.sample && (
                                <button
                                  onClick={() => {
                                    removeHistory(item.id);
                                    toast.success("Removed from history.");
                                  }}
                                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                                  aria-label="Remove from history"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="divide-y divide-white/[0.05] md:hidden">
                  {filtered.map((item) => (
                    <div key={item.id} className="flex gap-3 p-4">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center">
                            <PlatformIcon platform={item.platform} size={18} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[12px] font-medium text-slate-200">{item.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <PlatformIcon platform={item.platform} size={10} />
                            {item.platform}
                          </span>
                          <span className="uppercase">{item.format}</span>
                          <span>{formatBytes(item.sizeBytes)}</span>
                          <span>{formatDateShort(item.createdAt)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          {item.sample ? (
                            <span className="text-[9px] uppercase tracking-wide text-slate-600">Sample</span>
                          ) : (
                            <StatusBadge status={item.status} />
                          )}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleFavorite(item)}
                              className={cn(
                                "grid h-7 w-7 place-items-center rounded-lg",
                                item.favorite ? "text-rose-400" : "text-slate-600"
                              )}
                              aria-label="Toggle favorite"
                            >
                              <Heart className={cn("h-3.5 w-3.5", item.favorite && "fill-current")} />
                            </button>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="grid h-7 w-7 place-items-center rounded-lg text-slate-600"
                                aria-label="Open source"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
