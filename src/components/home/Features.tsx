import { motion } from "framer-motion";
import {
  AudioLines,
  Clapperboard,
  Globe2,
  ShieldCheck,
  Sparkles,
  UserX,
  Zap,
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { PlatformIcon } from "../ui/PlatformIcon";
import { SectionHeading } from "../ui/SectionHeading";

const PLATFORM_NAMES = ["YouTube", "Instagram", "Facebook", "TikTok", "X", "Vimeo", "Twitch", "Dailymotion", "Reddit"];

const FEATURES = [
  {
    title: "Ultra Fast Downloads",
    description:
      "A parallel, adaptive transfer engine pulls every stream at the speed your connection allows — then merges it instantly.",
    icon: Zap,
    span: "lg:col-span-2",
    accent: "from-violet-500/25 to-blue-500/10",
    iconColor: "text-violet-200",
    visual: "speed",
  },
  {
    title: "Secure Processing",
    description: "Encrypted transfers, private sessions, and files that disappear automatically after 30 minutes.",
    icon: ShieldCheck,
    span: "",
    accent: "from-emerald-500/20 to-cyan-500/10",
    iconColor: "text-emerald-200",
    visual: "secure",
  },
  {
    title: "HD & 4K Support",
    description: "From 144p to 4K — pick the exact resolution available at the source, with real file sizes.",
    icon: Clapperboard,
    span: "",
    accent: "from-blue-500/20 to-violet-500/10",
    iconColor: "text-blue-200",
    visual: "",
  },
  {
    title: "Audio Extraction",
    description: "Turn any video into a studio-quality MP3 or M4A with a single click. No quality loss.",
    icon: AudioLines,
    span: "",
    accent: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-200",
    visual: "wave",
  },
  {
    title: "No Registration",
    description: "No accounts, no email walls, no credit card. Paste a link and go — your history stays on your device.",
    icon: UserX,
    span: "",
    accent: "from-fuchsia-500/20 to-violet-500/10",
    iconColor: "text-fuchsia-200",
    visual: "",
  },
  {
    title: "Multi Platform Support",
    description: "One clean workflow for every major network. Paste a link from anywhere and we handle the rest.",
    icon: Globe2,
    span: "lg:col-span-3",
    accent: "from-violet-500/20 to-cyan-500/10",
    iconColor: "text-violet-200",
    visual: "platforms",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-28 py-16 sm:py-20">
      <div className="container-px">
        <SectionHeading
          eyebrow="Built for the way you save"
          title={
            <>
              Everything you need.
              <br className="hidden sm:block" /> <span className="gradient-text">Nothing you don't.</span>
            </>
          }
          description="Thoughtful engineering under a calm interface — so downloading feels less like a utility and more like a premium product."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
                className={feature.span}
              >
                <GlassCard
                  spotlight
                  hover
                  className="h-full p-5 sm:p-6"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-40`}
                  />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-gradient-to-br ${feature.accent} ${feature.iconColor} shadow-[inset_0_1px_0_rgba(255,255,255,.1)]`}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <Sparkles className="h-3.5 w-3.5 text-white/10 transition group-hover:text-white/30" />
                    </div>
                    <h3 className="mt-5 text-[15px] font-semibold tracking-[-0.01em] text-white">{feature.title}</h3>
                    <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-slate-400">{feature.description}</p>

                    {feature.visual === "speed" && (
                      <div className="mt-auto pt-6">
                        <div className="flex items-end justify-between gap-1.5">
                          {[28, 42, 36, 58, 48, 72, 64, 86, 78, 96, 88, 100].map((height, i) => (
                            <motion.span
                              key={i}
                              className="w-full rounded-sm bg-gradient-to-t from-violet-500/20 via-violet-400/50 to-cyan-300"
                              initial={{ height: 4 }}
                              whileInView={{ height: `${height * 0.46}px` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6, delay: 0.2 + i * 0.03 }}
                            />
                          ))}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[9px] text-slate-600">
                          <span>Adaptive throughput</span>
                          <span className="text-cyan-300">48 MB/s</span>
                        </div>
                      </div>
                    )}

                    {feature.visual === "secure" && (
                      <div className="mt-auto flex items-center gap-2 pt-6 text-[10px] text-emerald-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]" />
                        AES-256 · auto-purge enabled
                      </div>
                    )}

                    {feature.visual === "wave" && (
                      <div className="mt-auto flex h-8 items-end gap-1 pt-6">
                        {[30, 60, 40, 80, 50, 90, 35, 70, 45, 85, 55, 95].map((height, i) => (
                          <motion.span
                            key={i}
                            className="w-full rounded-full bg-gradient-to-t from-cyan-500/20 to-cyan-300/80"
                            initial={{ height: 3 }}
                            whileInView={{ height: `${height * 0.24}px` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.15 + i * 0.03 }}
                          />
                        ))}
                      </div>
                    )}

                    {feature.visual === "platforms" && (
                      <div className="mt-auto flex flex-wrap gap-2 pt-6">
                        {PLATFORM_NAMES.map((platform) => (
                          <span
                            key={platform}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-slate-400"
                          >
                            <PlatformIcon platform={platform} size={11} />
                            {platform}
                          </span>
                        ))}
                        <span className="inline-flex items-center rounded-full border border-dashed border-white/[0.1] px-2.5 py-1 text-[10px] text-slate-600">
                          +15 networks
                        </span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
