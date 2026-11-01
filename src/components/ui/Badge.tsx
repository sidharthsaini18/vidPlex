import React from "react";
import { cn } from "../../lib/format";

type Tone = "violet" | "cyan" | "blue" | "emerald" | "amber" | "rose" | "neutral";

const tones: Record<Tone, string> = {
  violet: "border-violet-400/20 bg-violet-500/10 text-violet-200",
  cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
  blue: "border-blue-400/20 bg-blue-500/10 text-blue-200",
  emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  rose: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  neutral: "border-white/10 bg-white/[0.05] text-slate-300",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className
      )}
    >
      {dot && <span className="status-dot bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === "completed")
    return (
      <Badge tone="emerald" dot>
        Completed
      </Badge>
    );
  if (normalized === "downloading")
    return (
      <Badge tone="cyan" dot className="animate-pulse">
        Downloading
      </Badge>
    );
  if (normalized === "processing")
    return (
      <Badge tone="violet" dot className="animate-pulse">
        Processing
      </Badge>
    );
  if (normalized === "failed")
    return (
      <Badge tone="rose" dot>
        Failed
      </Badge>
    );
  if (normalized === "cancelled")
    return (
      <Badge tone="amber" dot>
        Cancelled
      </Badge>
    );
  return (
    <Badge tone="neutral" dot>
      {status}
    </Badge>
  );
}
