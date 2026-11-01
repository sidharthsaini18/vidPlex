import React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/format";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "from-violet-500 to-blue-500",
  trend,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  accent?: string;
  trend?: { value: string; positive?: boolean };
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition hover:border-white/[0.14] hover:bg-white/[0.045]"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/[0.04] blur-2xl transition group-hover:bg-white/[0.08]" />
      <div className="flex items-center justify-between">
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white", accent)}>
          {icon}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
              trend.positive
                ? "border-emerald-400/15 bg-emerald-500/[0.08] text-emerald-300"
                : "border-white/[0.08] bg-white/[0.03] text-slate-500"
            )}
          >
            {trend.positive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {hint && <p className="mt-1.5 text-[10px] text-slate-600">{hint}</p>}
    </motion.div>
  );
}
