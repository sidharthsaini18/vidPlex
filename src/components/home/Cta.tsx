import { motion } from "framer-motion";
import { ArrowRight, Download, HardDrive, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function Cta() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="container-px">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[32px] border border-white/[0.1]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#0b0a24_0%,#140b33_35%,#0a1a3a_70%,#061a24_100%)]" />
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-600/30 blur-[100px]" />
          <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-[110px]" />
          <div className="noise absolute inset-0 opacity-[0.04] mix-blend-soft-light" />
          <div className="absolute inset-x-0 top-0 h-px hairline" />

          <div className="relative px-6 py-14 text-center sm:px-10 sm:py-16 lg:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              Ready when you are
            </span>
            <h2 className="mx-auto mt-6 max-w-[720px] text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[46px] lg:text-[54px]">
              Your next favorite video is
              <span className="gradient-text"> one paste away.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[540px] text-pretty text-[14px] leading-relaxed text-slate-400 sm:text-[15px]">
              Join millions of creators who save what inspires them. Real files, real quality, and a workspace that
              finally feels premium.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                href="#downloader"
                size="xl"
                magnetic
                leftIcon={<Download className="h-4 w-4" />}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Start downloading free
              </Button>
              <Link
                to="/dashboard"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.05] px-7 text-[15px] font-semibold text-white backdrop-blur-xl transition hover:border-white/[0.2] hover:bg-white/[0.09] sm:w-auto"
              >
                Open dashboard
              </Link>
            </div>
            <p className="mt-5 text-[11px] text-slate-500">No account · No credit card · Unlimited downloads</p>
          </div>
        </motion.div>

        <div id="privacy" className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: HardDrive,
              title: "Local-first history",
              description: "Your library stays in your browser, not on our servers.",
            },
            {
              icon: ShieldCheck,
              title: "Auto-purge files",
              description: "Temporary media is deleted within 30 minutes.",
            },
            {
              icon: Lock,
              title: "No tracking",
              description: "No ad pixels, no resale, no behavioral profiles.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-slate-400">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-slate-200">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
