/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#020617",
          900: "#050a1a",
          850: "#080f22",
          800: "#0F172A",
          700: "#16203a",
        },
        violet: {
          350: "#8b5cf6",
          450: "#7C3AED",
          550: "#6D28D9",
        },
        accent: {
          cyan: "#06B6D4",
          blue: "#3B82F6",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,.06), 0 20px 60px -20px rgba(109,40,217,.55)",
        "glow-cyan": "0 0 0 1px rgba(255,255,255,.06), 0 20px 60px -20px rgba(6,182,212,.45)",
        card: "0 1px 0 0 rgba(255,255,255,.05) inset, 0 30px 80px -30px rgba(0,0,0,.8)",
        "inner-line": "inset 0 1px 0 0 rgba(255,255,255,.08)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(110deg, #7C3AED 0%, #6D28D9 35%, #3B82F6 70%, #06B6D4 100%)",
        "brand-soft": "linear-gradient(135deg, rgba(124,58,237,.18), rgba(59,130,246,.10) 55%, rgba(6,182,212,.12))",
      },
      animation: {
        "float-slow": "float 9s ease-in-out infinite",
        "float-slower": "float 14s ease-in-out infinite",
        blob: "blob 18s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        marquee: "marquee 32s linear infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
        "spin-slow": "spin 18s linear infinite",
        "gradient-pan": "gradientPan 8s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-18px,0)" },
        },
        blob: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(40px,-30px,0) scale(1.08)" },
          "66%": { transform: "translate3d(-30px,25px,0) scale(.95)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: ".45" },
          "50%": { opacity: ".85" },
        },
        gradientPan: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
