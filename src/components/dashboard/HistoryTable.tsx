import { motion } from "framer-motion";
import { ArrowUpRight, Download, Heart, RefreshCw, Trash2 } from "lucide-react";
import type { HistoryItem } from "../../lib/types";
import { formatBytes, formatDate, timeAgo } from "../../lib/format";
import { PlatformIcon } from "../ui/PlatformIcon";
import { StatusBadge } from "../ui/Badge";
import { cn } from "../../lib/format";

export function HistoryTable({
  items,
  onToggleFavorite,
  onRemove,
  onReuse,
  emptyTitle = "No downloads yet",
  emptyDescription = "Paste a link in the downloader and your files will appear here.",
}: {
  items: HistoryItem[];
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
  onReuse: (url: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Download className="h-5 w-5 text-slate-500" />
        </span>
        <h4 className="mt-4 text-sm font-semibold text-white">{emptyTitle}</h4>
        <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-slate-500">{emptyDescription}</p>
        <a
          href="/#downloader"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(100deg,#7C3AED,#3B82F6)] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,.9)] transition hover:brightness-110"
        >
          <Download className="h-3.5 w-3.5" /> Start a download
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
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
            {items.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(index * 0.025, 0.2) }}
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
                    </div>
                    <div className="min-w-0">
                      <p className="max-w-[300px] truncate text-[12.5px] font-medium text-slate-200 group-hover:text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-600">
                        {item.channel || item.platform} · {item.quality}
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
                <td className="px-3 py-3 text-[11px] tabular-nums text-slate-400">{formatBytes(item.sizeBytes)}</td>
                <td className="px-3 py-3">
                  <p className="text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
                  <p className="text-[9px] text-slate-600">{timeAgo(item.createdAt)}</p>
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg transition",
                        item.favorite
                          ? "text-rose-400 hover:bg-rose-500/10"
                          : "text-slate-600 hover:bg-white/[0.06] hover:text-white"
                      )}
                      aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
                      title={item.favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={cn("h-3.5 w-3.5", item.favorite && "fill-current")} />
                    </button>
                    <button
                      onClick={() => onReuse(item.url)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
                      aria-label="Download again"
                      title="Download again"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
                      aria-label="Open source"
                      title="Open source"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Delete from history"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-white/[0.05] lg:hidden">
        {items.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex gap-3">
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
                <p className="line-clamp-2 text-[12.5px] font-medium text-slate-200">{item.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <PlatformIcon platform={item.platform} size={10} />
                    {item.platform}
                  </span>
                  <span className="uppercase">{item.format}</span>
                  <span>{formatBytes(item.sizeBytes)}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <StatusBadge status={item.status} />
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg",
                        item.favorite ? "text-rose-400" : "text-slate-600"
                      )}
                      aria-label="Toggle favorite"
                    >
                      <Heart className={cn("h-3.5 w-3.5", item.favorite && "fill-current")} />
                    </button>
                    <button
                      onClick={() => onReuse(item.url)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-600"
                      aria-label="Download again"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
