import { motion } from "framer-motion";
import { cn } from "../../lib/format";

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300",
        checked
          ? "border-violet-400/40 bg-[linear-gradient(100deg,#7C3AED,#3B82F6)] shadow-[0_0_20px_-6px_rgba(124,58,237,.9)]"
          : "border-white/[0.1] bg-white/[0.06]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "block h-4 w-4 rounded-full bg-white shadow-sm",
          checked ? "ml-6" : "ml-1"
        )}
      />
    </button>
  );
}
