import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/format";

export interface DropdownItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Dropdown({
  items,
  value,
  onChange,
  placeholder = "Select",
  label,
  className,
  align = "left",
  compact = false,
}: {
  items: DropdownItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  align?: "left" | "right";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find((item) => item.value === value);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.04] text-left transition hover:border-white/[0.16] hover:bg-white/[0.06]",
          compact ? "h-10 px-3.5 text-[13px]" : "h-12 px-4 text-sm",
          open && "border-violet-400/30 bg-white/[0.06]"
        )}
      >
        <span className={cn("truncate font-medium", selected ? "text-white" : "text-slate-500")}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-50 mt-2 max-h-72 w-full min-w-[200px] overflow-auto rounded-2xl border border-white/[0.1] bg-[#0b1224]/98 p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] backdrop-blur-2xl scrollbar-none",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {items.map((item) => {
              const active = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    item.disabled
                      ? "cursor-not-allowed text-slate-600"
                      : active
                        ? "bg-violet-500/15 text-white"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.label}</span>
                    {item.description && (
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-violet-300" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
