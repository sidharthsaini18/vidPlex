import { Link } from "react-router-dom";
import { SiDiscord, SiGithub, SiX } from "react-icons/si";
import { ArrowUpRight, Heart } from "lucide-react";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Downloader", href: "/#downloader" },
      { label: "Features", href: "/#features" },
      { label: "Recent downloads", href: "/#recent" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "FAQ", href: "/#faq" },
      { label: "API status", href: "/#status" },
      { label: "Supported platforms", href: "/#platforms" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Privacy", href: "/#privacy" },
      { label: "Terms", href: "/#terms" },
      { label: "Contact", href: "mailto:hello@vidplex.app" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-white/[0.07]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <div className="container-px pb-10 pt-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              A calmer way to save video. Premium quality, private by design, and beautifully fast on every device.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {[
                { Icon: SiX, label: "X" },
                { Icon: SiGithub, label: "GitHub" },
                { Icon: SiDiscord, label: "Discord" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/[0.07] px-3 py-1.5 text-[11px] font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]" />
              All systems operational
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {column.title}
                </h4>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link
                          to={link.href}
                          className="group inline-flex items-center gap-1 text-[13px] text-slate-400 transition hover:text-white"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="group inline-flex items-center gap-1 text-[13px] text-slate-400 transition hover:text-white"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-6 text-[12px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VidPlex. Download only content you have the right to use.</p>
          <p className="flex items-center gap-1.5">
            Designed with <Heart className="h-3 w-3 text-rose-400" /> for creators everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
