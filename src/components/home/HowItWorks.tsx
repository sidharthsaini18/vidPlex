import { motion } from "framer-motion";
import { ArrowRight, Download, Link2, SlidersHorizontal } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { GlassCard } from "../ui/GlassCard";

const STEPS = [
  {
    number: "01",
    title: "Paste any link",
    description: "Drop a public video URL from YouTube, Instagram, TikTok, X, Facebook, Vimeo or any direct media link.",
    icon: Link2,
    detail: "youtube.com/watch?v=…",
  },
  {
    number: "02",
    title: "Choose your format",
    description: "We read the real available qualities. Pick 4K video, 1080p, or extract studio-quality MP3 audio.",
    icon: SlidersHorizontal,
    detail: "4K · 1080p · MP3",
  },
  {
    number: "03",
    title: "Save the real file",
    description: "Your media is fetched, merged and verified on our secure engine, then delivered straight to your device.",
    icon: Download,
    detail: "MP4 · verified",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-28 py-16 sm:py-20">
      <div className="container-px">
        <SectionHeading
          eyebrow="Effortless by design"
          title={
            <>
              Three steps. <span className="gradient-text">Zero friction.</span>
            </>
          }
          description="No tutorials, no settings maze. The entire workflow fits in a single screen — because saving a video should take seconds, not minutes."
        />

        <div className="relative grid gap-4 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-14 hidden h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent md:block" />
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
              >
                <GlassCard spotlight hover className="h-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-violet-500/20 to-cyan-500/10 text-violet-100">
                      <Icon className="h-5 w-5" />
                      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-white/[0.12] bg-[#0a1020] text-[9px] font-bold text-slate-300">
                        {index + 1}
                      </span>
                    </span>
                    <span className="text-[11px] font-semibold tabular-nums tracking-[0.18em] text-white/10">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">{step.description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 font-mono text-[10px] text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400/70" />
                    {step.detail}
                  </div>
                  {index < STEPS.length - 1 && (
                    <ArrowRight className="mt-5 hidden h-4 w-4 text-white/10 md:block" />
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
