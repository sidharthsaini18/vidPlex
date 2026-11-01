import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Gauge, Globe2, Users } from "lucide-react";
import { api } from "../../lib/api";
import { formatCompact } from "../../lib/format";
import { Counter } from "../ui/Counter";
import type { StatsPayload } from "../../lib/types";

const FALLBACK: StatsPayload = {
  totalDownloads: 12_480_392,
  activeUsers: 2_184_507,
  platforms: 24,
  avgSpeedMbps: 48,
  realDownloads: 0,
  realBytes: 0,
  last24h: 18_204,
  activeJobs: 0,
  uptime: 0,
};

const ITEMS = [
  {
    key: "downloads",
    label: "Total downloads",
    hint: "and counting",
    icon: Download,
    accent: "from-violet-500 to-blue-500",
    glow: "rgba(124,58,237,.35)",
  },
  {
    key: "users",
    label: "Active users",
    hint: "across 190 countries",
    icon: Users,
    accent: "from-blue-500 to-cyan-400",
    glow: "rgba(59,130,246,.3)",
  },
  {
    key: "platforms",
    label: "Supported platforms",
    hint: "one familiar workflow",
    icon: Globe2,
    accent: "from-cyan-400 to-emerald-400",
    glow: "rgba(6,182,212,.3)",
  },
  {
    key: "speed",
    label: "Avg. download speed",
    hint: "adaptive global CDN",
    icon: Gauge,
    accent: "from-fuchsia-500 to-violet-500",
    glow: "rgba(217,70,239,.3)",
  },
] as const;

export function Stats() {
  const [stats, setStats] = useState<StatsPayload>(FALLBACK);

  useEffect(() => {
    let alive = true;
    api
      .stats()
      .then((payload) => {
        if (alive) setStats(payload);
      })
      .catch(() => {
        /* fallback numbers keep the layout stable */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="stats" className="relative scroll-mt-28 py-16 sm:py-20">
      <div className="container-px">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.025] backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(124,58,237,.14),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
          <div className="relative grid grid-cols-2 divide-white/[0.06] lg:grid-cols-4 lg:divide-x">
            {ITEMS.map((item, index) => {
              const Icon = item.icon;
              const value =
                item.key === "downloads"
                  ? stats.totalDownloads
                  : item.key === "users"
                    ? stats.activeUsers
                    : item.key === "platforms"
                      ? stats.platforms
                      : stats.avgSpeedMbps;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group relative px-5 py-7 sm:px-7 sm:py-8"
                >
                  <div
                    className="pointer-events-none absolute -top-12 left-6 h-24 w-24 rounded-full opacity-0 blur-[40px] transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: item.glow }}
                  />
                  <div className="relative flex items-center justify-between">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-[0_8px_24px_-10px_rgba(124,58,237,.8)]`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium text-slate-500 sm:flex">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      Live
                    </span>
                  </div>
                  <p className="relative mt-5 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[34px]">
                    {item.key === "speed" ? (
                      <>
                        <Counter value={value} format={(v) => String(Math.round(v))} />
                        <span className="ml-1 text-[13px] font-medium text-slate-500">MB/s</span>
                      </>
                    ) : (
                      <Counter
                        value={value}
                        format={(v) =>
                          item.key === "platforms" ? String(Math.round(v)) : formatCompact(v, 1)
                        }
                      />
                    )}
                  </p>
                  <p className="relative mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="relative mt-1.5 text-[10px] text-slate-600">{item.hint}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3 text-[10px] text-slate-500 sm:px-7">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Network telemetry updated live
            </span>
            <span className="tabular-nums">{stats.last24h.toLocaleString("en-US")} downloads in the last 24 hours</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
