import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, LayoutDashboard, Menu, Sparkles, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "../ui/Button";
import { AuthModal } from "./AuthModal";
import { api } from "../../lib/api";
import { cn } from "../../lib/format";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Recent", href: "/#recent" },
  { label: "Dashboard", href: "/dashboard", route: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [health, setHealth] = useState<"checking" | "up" | "down">("checking");
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    let alive = true;
    api
      .health()
      .then((result) => alive && setHealth(result.status === "operational" ? "up" : "down"))
      .catch(() => alive && setHealth("down"));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "py-2" : "py-3 sm:py-4"
        )}
      >
        <div className="container-px">
          <div
            className={cn(
              "flex h-[60px] items-center justify-between rounded-2xl border px-4 transition-all duration-500 sm:px-5",
              scrolled
                ? "border-white/[0.09] bg-[#050a18]/80 shadow-[0_20px_60px_-30px_rgba(0,0,0,.9)] backdrop-blur-2xl"
                : "border-transparent bg-transparent"
            )}
          >
            <div className="flex items-center gap-8">
              <Logo />
              <nav className="hidden items-center gap-1 lg:flex">
                {LINKS.map((link) =>
                  link.route ? (
                    <Link
                      key={link.label}
                      to={link.href}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-[13px] font-medium transition",
                        location.pathname === link.href
                          ? "bg-white/[0.07] text-white"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      className="rounded-full px-3.5 py-2 text-[13px] font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      {link.label}
                    </a>
                  )
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="mr-1 hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-400 xl:flex">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    health === "up"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]"
                      : health === "down"
                        ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,.9)]"
                        : "bg-slate-500 animate-pulse"
                  )}
                />
                {health === "up" ? "All systems operational" : health === "down" ? "Service degraded" : "Checking status"}
              </div>
              <button
                onClick={() => setAuthOpen(true)}
                className="hidden h-9 items-center rounded-full px-4 text-[13px] font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex"
              >
                Sign in
              </button>
              <Button
                href="/dashboard"
                size="sm"
                magnetic
                className="hidden sm:inline-flex"
                rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
              >
                Open dashboard
              </Button>
              <button
                onClick={() => setMobileOpen((value) => !value)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-200 lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-[#01030a]/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-x-4 top-[84px] z-50 overflow-hidden rounded-3xl border border-white/[0.1] bg-[#070d1d]/95 p-3 shadow-[0_40px_100px_-20px_rgba(0,0,0,.9)] backdrop-blur-2xl lg:hidden"
            >
              <nav className="space-y-1">
                {LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {link.label}
                    <ArrowUpRight className="h-4 w-4 text-slate-500" />
                  </a>
                ))}
              </nav>
              <div className="my-2 h-px bg-white/[0.07]" />
              <div className="grid gap-2 p-1">
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthOpen(true);
                  }}
                >
                  Sign in
                </Button>
                <Button
                  href="/dashboard"
                  fullWidth
                  leftIcon={<LayoutDashboard className="h-4 w-4" />}
                  onClick={() => setMobileOpen(false)}
                >
                  Open dashboard
                </Button>
              </div>
              <div className="flex items-center gap-2 px-3 pb-2 pt-3 text-[11px] text-slate-500">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    health === "up" ? "bg-emerald-400" : "bg-slate-500"
                  )}
                />
                {health === "up" ? "All systems operational" : "Service status unavailable"}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
