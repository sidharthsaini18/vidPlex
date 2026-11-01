import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 26 }, (_, index) => {
  const seed = (index * 9301 + 49297) % 233280;
  const random = seed / 233280;
  const seed2 = (index * 4517 + 7919) % 104729;
  const random2 = seed2 / 104729;
  return {
    left: `${(random * 100).toFixed(2)}%`,
    top: `${(random2 * 100).toFixed(2)}%`,
    size: 1 + Math.round(random2 * 2.5),
    delay: `${(random * 8).toFixed(2)}s`,
    duration: `${(9 + random2 * 12).toFixed(2)}s`,
    opacity: 0.15 + random * 0.45,
  };
});

export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#020617]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(109,40,217,.28),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_85%_25%,rgba(6,182,212,.13),transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_10%_60%,rgba(59,130,246,.12),transparent_70%)]" />

      <motion.div
        className="absolute -left-[10%] top-[8%] h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[130px]"
        animate={{ x: [0, 60, -20, 0], y: [0, -40, 30, 0], scale: [1, 1.12, 0.95, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[8%] top-[22%] h-[460px] w-[460px] rounded-full bg-cyan-500/14 blur-[120px]"
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -30, 0], scale: [1, 0.92, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute bottom-[8%] left-[30%] h-[520px] w-[520px] rounded-full bg-blue-600/12 blur-[140px]"
        animate={{ x: [0, 40, -40, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.94, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(124,58,237,.14),transparent_70%)]" />

      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white animate-float-slow"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            boxShadow: index % 4 === 0 ? "0 0 12px rgba(167,139,250,.9)" : undefined,
          }}
        />
      ))}

      <div className="noise absolute inset-0 opacity-[0.035] mix-blend-soft-light" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#020617] to-transparent" />
    </div>
  );
}
