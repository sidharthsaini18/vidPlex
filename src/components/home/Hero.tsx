import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Check, Play, Sparkles, Star, Zap } from "lucide-react";
import { Downloader } from "./Downloader";

const AVATARS = [
  { initials: "AK", from: "#7C3AED", to: "#3B82F6" },
  { initials: "MR", from: "#06B6D4", to: "#3B82F6" },
  { initials: "JL", from: "#8B5CF6", to: "#EC4899" },
  { initials: "SN", from: "#22D3EE", to: "#6D28D9" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="container-px relative">
        <div className="relative mx-auto max-w-[1200px]">
          {/* Floating product cards */}
          <motion.div
            initial={{ opacity: 0, x: -20, rotate: -6 }}
            animate={{ opacity: 1, x: 0, rotate: -6 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="pointer-events-none absolute -left-24 top-44 hidden w-[190px] rounded-2xl border border-white/[0.1] bg-[#0a1020]/80 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-2xl xl:block animate-float-slow"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-200">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-white">4K HDR saved</p>
                <p className="text-[9px] text-slate-500">Merged in 12 seconds</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
              <span>2.1 GB</span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <Check className="h-2.5 w-2.5" /> Complete
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotate: 5 }}
            transition={{ duration: 0.9, delay: 0.75 }}
            className="pointer-events-none absolute -right-20 top-56 hidden w-[180px] rounded-2xl border border-white/[0.1] bg-[#0a1020]/80 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-2xl xl:block animate-float-slower"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Audio</span>
              <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-200">MP3</span>
            </div>
            <div className="mt-3 flex h-8 items-end gap-[3px]">
              {[40, 70, 30, 85, 55, 95, 45, 75, 35, 65, 50, 88, 42, 72].map((height, index) => (
                <motion.span
                  key={index}
                  className="w-[5px] rounded-full bg-gradient-to-t from-cyan-500/40 to-cyan-300"
                  animate={{ height: [`${height * 0.5}%`, `${height}%`, `${height * 0.6}%`] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: index * 0.08,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <p className="mt-2 text-[9px] text-slate-500">320 kbps · crystal clear</p>
          </motion.div>

          <div className="relative mx-auto max-w-[860px] text-center">
            <motion.a
              href="#features"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.035] py-1.5 pl-1.5 pr-4 text-[11px] font-medium text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-xl transition hover:border-white/[0.18] hover:bg-white/[0.06]"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(100deg,#7C3AED,#3B82F6)] px-2.5 py-1 text-[10px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(124,58,237,.9)]">
                <Sparkles className="h-3 w-3" />
                New
              </span>
              VidPlex 2.0 — 4K engine is live
              <ArrowRight className="h-3 w-3 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </motion.a>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 text-balance text-[42px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[58px] lg:text-[76px]"
            >
              Download Videos
              <br />
              <span className="gradient-text">From Any Platform</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="mx-auto mt-6 max-w-[620px] text-pretty text-[15px] leading-relaxed text-slate-400 sm:text-[17px]"
            >
              Save videos in stunning 4K, extract crystal-clear audio, and keep everything organized in one
              beautifully simple workspace. No ads. No sign-up. No compromise.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24 }}
              className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {AVATARS.map((avatar) => (
                    <span
                      key={avatar.initials}
                      className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#020617] text-[9px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${avatar.from}, ${avatar.to})`,
                      }}
                    >
                      {avatar.initials}
                    </span>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-3 w-3 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">Loved by 2.1M+ creators</p>
                </div>
              </div>
              <span className="hidden h-8 w-px bg-white/[0.08] sm:block" />
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2 text-[12px] font-medium text-slate-400 transition hover:text-white"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.1] bg-white/[0.04] transition group-hover:border-violet-400/30 group-hover:bg-violet-500/10">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                See how it works
              </a>
            </motion.div>
          </div>

          <div className="mt-10 sm:mt-12">
            <Downloader />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-10 flex justify-center"
          >
            <a
              href="#stats"
              className="group inline-flex flex-col items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600 transition hover:text-slate-400"
            >
              Explore the platform
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
