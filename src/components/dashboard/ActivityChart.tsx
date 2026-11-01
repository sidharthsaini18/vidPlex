import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import type { Analytics } from "../../lib/store";
import { formatBytes } from "../../lib/format";

export function ActivityChart({ analytics }: { analytics: Analytics }) {
  const days = analytics.last7Days;
  const max = Math.max(1, ...days.map((day) => day.count));
  const empty = analytics.totalDownloads === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/15 text-violet-200">
              <BarChart3 className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[13px] font-semibold text-white">Download activity</h3>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {empty ? "Your first download will start the chart." : `${analytics.week} downloads this week · ${formatBytes(analytics.totalBytes)} saved`}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
          <span className="rounded-md bg-white/[0.08] px-2 py-1 text-[10px] font-medium text-white">7 days</span>
          <span className="px-2 py-1 text-[10px] text-slate-600">30 days</span>
        </div>
      </div>

      <div className="relative mt-6 flex h-[168px] items-end gap-2 sm:gap-3">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <span key={line} className="h-px w-full bg-white/[0.04]" />
          ))}
        </div>
        {days.map((day, index) => {
          const height = day.count ? Math.max(10, (day.count / max) * 100) : 4;
          return (
            <div key={day.key} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="relative flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.7, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute bottom-0 w-full rounded-t-md ${
                    day.count
                      ? "bg-[linear-gradient(180deg,#a78bfa,#7C3AED_45%,rgba(59,130,246,.35))] shadow-[0_0_24px_-8px_rgba(124,58,237,.8)]"
                      : "bg-white/[0.05]"
                  } transition group-hover:brightness-125`}
                  title={`${day.count} downloads · ${formatBytes(day.bytes)}`}
                />
              </div>
              <span className="mt-2 text-center text-[9px] font-medium uppercase tracking-wide text-slate-600">
                {day.label}
              </span>
              <span className="text-center text-[9px] tabular-nums text-slate-700">
                {day.count || "·"}
              </span>
            </div>
          );
        })}
        {empty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#070d1d]/80 px-3 py-1.5 text-[10px] text-slate-500 backdrop-blur">
              <TrendingUp className="h-3 w-3 text-violet-300" />
              No activity yet — paste a link to begin
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
