import { Link } from "react-router-dom";
import { cn } from "../../lib/format";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-2.5", className)} aria-label="VidPlex home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[11px] bg-[linear-gradient(140deg,#8b5cf6,#6D28D9_45%,#3B82F6_78%,#06B6D4)] shadow-[0_8px_24px_-8px_rgba(124,58,237,.9),inset_0_1px_0_rgba(255,255,255,.35)]">
        <span className="absolute inset-[1px] rounded-[10px] bg-[linear-gradient(160deg,rgba(10,16,32,.15),rgba(10,16,32,.55))]" />
        <svg viewBox="0 0 24 24" className="relative h-[18px] w-[18px]" fill="none" aria-hidden>
          <path d="M8 5.2 17.2 12 8 18.8V5.2Z" fill="white" fillOpacity=".96" />
          <path d="M4 12h2.4" stroke="white" strokeOpacity=".65" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white/25 blur-md" />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-white">
          VidPlex<span className="gradient-text">/</span>
          <span className="text-white" style={{ fontSize: "14px" }}>By Sidharth</span>

        </span>
      )}
    </Link>
  );
}
