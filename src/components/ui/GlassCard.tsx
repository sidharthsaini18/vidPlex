import React, { useRef } from "react";
import { cn } from "../../lib/format";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlight?: boolean;
  hover?: boolean;
  as?: "div" | "section" | "article";
}

export function GlassCard({
  className,
  children,
  spotlight = false,
  hover = false,
  as: Tag = "div",
  ...props
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    ref.current.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      onMouseMove={handleMove}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-2xl",
        "shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_30px_80px_-30px_rgba(0,0,0,.75)]",
        spotlight && "spotlight",
        hover &&
          "transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.09),0_40px_100px_-30px_rgba(0,0,0,.85)]",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
