import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/format";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-5 sm:mb-14",
        align === "center" ? "items-center text-center" : "items-start text-left",
        action && "md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn(align === "center" ? "max-w-2xl" : "max-w-2xl")}>
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className={cn(
              "mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400",
              align === "center" && "mx-auto"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 shadow-[0_0_10px_rgba(124,58,237,.9)]" />
            {eyebrow}
          </motion.div>
        )}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-white sm:text-[40px] lg:text-[46px]"
        >
          {title}
        </motion.h2>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-4 text-pretty text-[15px] leading-relaxed text-slate-400 sm:text-base"
          >
            {description}
          </motion.p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
