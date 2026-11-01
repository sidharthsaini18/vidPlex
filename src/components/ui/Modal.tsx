import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/format";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            aria-label="Close dialog"
            className="absolute inset-0 bg-[#01030a]/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title || "Dialog"}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#0a1020]/95 shadow-[0_40px_120px_-20px_rgba(0,0,0,.9)] backdrop-blur-2xl",
              className
            )}
          >
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[80px]" />
            <div className="relative flex items-start justify-between gap-4 px-6 pb-2 pt-6">
              <div>
                {title && <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>}
                {description && <p className="mt-1 text-sm leading-relaxed text-slate-400">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.09] hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative px-6 py-4">{children}</div>
            {footer && <div className="relative border-t border-white/[0.07] px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
