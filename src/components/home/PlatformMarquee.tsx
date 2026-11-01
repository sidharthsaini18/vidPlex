import { motion } from "framer-motion";
import { SiDailymotion, SiFacebook, SiInstagram, SiTiktok, SiTwitch, SiVimeo, SiX, SiYoutube } from "react-icons/si";
import { Link2 } from "lucide-react";

const PLATFORMS = [
  { name: "YouTube", Icon: SiYoutube, color: "#FF4D4D" },
  { name: "Instagram", Icon: SiInstagram, color: "#F472B6" },
  { name: "TikTok", Icon: SiTiktok, color: "#E2E8F0" },
  { name: "Facebook", Icon: SiFacebook, color: "#60A5FA" },
  { name: "X", Icon: SiX, color: "#E2E8F0" },
  { name: "Vimeo", Icon: SiVimeo, color: "#22D3EE" },
  { name: "Twitch", Icon: SiTwitch, color: "#A78BFA" },
  { name: "Dailymotion", Icon: SiDailymotion, color: "#60A5FA" },
  { name: "Direct URL", Icon: Link2, color: "#A78BFA" },
];

export function PlatformMarquee() {
  return (
    <section id="platforms" className="relative scroll-mt-28 py-10">
      <div className="container-px">
        <div className="flex flex-col items-center gap-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            One workflow for every platform
          </p>
          <div className="relative w-full overflow-hidden mask-fade-x">
            <motion.div
              className="flex w-max items-center gap-10 animate-marquee hover:[animation-play-state:paused]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((platform, index) => {
                const Icon = platform.Icon;
                return (
                  <span
                    key={`${platform.name}-${index}`}
                    className="flex shrink-0 items-center gap-2.5 text-[12px] font-medium text-slate-500 transition hover:text-slate-200"
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: platform.color, opacity: 0.75 }} />
                    {platform.name}
                  </span>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
