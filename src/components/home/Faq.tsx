import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, MessageCircle } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionHeading } from "../ui/SectionHeading";

const FAQS = [
  {
    question: "Is VidPlex really free to use?",
    answer:
      "Yes. The downloader is free for personal use with no account required. Paste a link, choose your format, and save the real file. There are no ads, watermarks, or hidden paywalls in this workspace.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "YouTube, Instagram, Facebook, TikTok, X, Vimeo, Twitch, Dailymotion, Reddit, Pinterest, and direct MP4/MP3 links — 24 networks in total. If a public link is supported by the extraction engine, it works here.",
  },
  {
    question: "Can I download in 4K or extract MP3 audio?",
    answer:
      "Yes. Every quality available at the source is listed with its real file size. Choose up to 4K video, or switch to audio mode to extract a 320 kbps MP3 or M4A. Separate video and audio streams are merged losslessly on the server.",
  },
  {
    question: "Why do some quality options appear disabled?",
    answer:
      "We never fake a format. If the source only offers 240p, only 240p is selectable. Disabled options mean that resolution genuinely isn't available for that specific video, so you always get exactly what you pick.",
  },
  {
    question: "Where are my downloads and history stored?",
    answer:
      "Your history, favorites, and preferences live in your browser's local storage — not on our servers. Temporary media files are deleted from the server automatically after 30 minutes or as soon as your transfer completes.",
  },
  {
    question: "Is it legal to download videos?",
    answer:
      "Download only content you own or have permission to use. VidPlex is built for creators, researchers, and teams backing up their own work. Always respect the terms of service of the source platform and applicable copyright law.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-28 py-16 sm:py-20">
      <div className="container-px">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Questions, answered"
              title={
                <>
                  Clarity over <span className="gradient-text">fine print.</span>
                </>
              }
              description="Everything you might want to know before your first download. Still curious? We're one message away."
              className="mb-8"
            />
            <GlassCard className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-200">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-white">Talk to a human</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                    Product questions, platform requests, or feedback — we read every message.
                  </p>
                  <a
                    href="mailto:hello@vidplex.app"
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-violet-300 transition hover:text-violet-200"
                  >
                    hello@vidplex.app
                  </a>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, index) => {
              const isOpen = open === index;
              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                >
                  <div
                    className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                      isOpen
                        ? "border-violet-400/20 bg-violet-500/[0.05]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.035]"
                    }`}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[13.5px] font-medium text-slate-200">{faq.question}</span>
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${
                          isOpen
                            ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
                            : "border-white/[0.08] bg-white/[0.03] text-slate-500"
                        }`}
                      >
                        {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 text-[12.5px] leading-relaxed text-slate-400">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
