import React, { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "glass" | "danger";
type Size = "sm" | "md" | "lg" | "xl" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-[linear-gradient(100deg,#7C3AED_0%,#6D28D9_32%,#3B82F6_72%,#06B6D4_100%)] shadow-[0_12px_40px_-12px_rgba(124,58,237,.8),inset_0_1px_0_rgba(255,255,255,.25)] hover:shadow-[0_18px_50px_-12px_rgba(124,58,237,.9),inset_0_1px_0_rgba(255,255,255,.3)]",
  secondary:
    "text-white bg-white/[0.07] border border-white/[0.1] hover:bg-white/[0.11] hover:border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]",
  ghost: "text-slate-300 hover:text-white hover:bg-white/[0.06]",
  glass:
    "text-white bg-white/[0.04] border border-white/[0.1] backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/[0.18]",
  danger:
    "text-rose-200 bg-rose-500/10 border border-rose-400/20 hover:bg-rose-500/20 hover:border-rose-400/30",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-full",
  xl: "h-14 px-8 text-[15px] gap-2.5 rounded-full",
  icon: "h-10 w-10 rounded-full",
};

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  magnetic = false,
  loading = false,
  leftIcon,
  rightIcon,
  href,
  target,
  rel,
  fullWidth,
  className,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 280, damping: 22, mass: 0.35 });
  const y = useSpring(rawY, { stiffness: 280, damping: 22, mass: 0.35 });

  const handleMove = (event: React.MouseEvent) => {
    const node = href ? anchorRef.current : buttonRef.current;
    if (!magnetic || !node) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = node.getBoundingClientRect();
    rawX.set((event.clientX - (rect.left + rect.width / 2)) * 0.16);
    rawY.set((event.clientY - (rect.top + rect.height / 2)) * 0.2);
  };

  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const classes = cn(
    "magnetic group relative inline-flex select-none items-center justify-center overflow-hidden font-semibold tracking-[-0.01em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {variant === "primary" && (
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,.28)_45%,transparent_70%)] bg-[length:220%_100%] opacity-0 transition-all duration-700 group-hover:translate-x-10 group-hover:opacity-100" />
      )}
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon && <span className="relative flex items-center">{leftIcon}</span>
      )}
      <span className="relative whitespace-nowrap">{children}</span>
      {rightIcon && !loading && (
        <span className="relative flex items-center transition-transform duration-300 group-hover:translate-x-0.5">
          {rightIcon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        ref={anchorRef}
        href={href}
        target={target}
        rel={rel}
        className={classes}
        style={{ x, y }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
        whileTap={{ scale: 0.98 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      className={classes}
      style={{ x, y }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {content}
    </motion.button>
  );
}
