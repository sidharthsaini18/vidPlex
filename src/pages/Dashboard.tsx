import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  Database,
  Download,
  ExternalLink,
  FileAudio,
  FileVideo,
  Gauge,
  Globe2,
  HardDrive,
  Heart,
  History,
  LayoutDashboard,
  Lock,
  Mail,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { formatBytes, formatCompact, formatDate, initials, timeAgo } from "../lib/format";
import type { HealthPayload, HistoryItem } from "../lib/types";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { Dropdown } from "../components/ui/Dropdown";
import { Switch } from "../components/ui/Switch";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { StatCard } from "../components/dashboard/StatCard";
import { ActivityChart } from "../components/dashboard/ActivityChart";
import { HistoryTable } from "../components/dashboard/HistoryTable";
import { UpgradeModal } from "../components/dashboard/UpgradeModal";
import { PlatformIcon } from "../components/ui/PlatformIcon";
import { cn } from "../lib/format";

type Tab = "overview" | "history" | "favorites" | "analytics" | "settings";

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "history", label: "History", icon: History },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const HEADINGS: Record<Tab, { title: string; description: string }> = {
  overview: { title: "Welcome back", description: "Here's what your library looks like today." },
  history: { title: "Download history", description: "Every file you've saved, in one place." },
  favorites: { title: "Favorites", description: "The keepers you don't want to lose." },
  analytics: { title: "Analytics", description: "A clear picture of how you save." },
  settings: { title: "Account settings", description: "Make the workspace feel like yours." },
};

interface Profile {
  name: string;
  email: string;
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem("vidplex.v2.profile");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Profile>;
      if (parsed.email || parsed.name) {
        return {
          name: parsed.name || "Creator",
          email: parsed.email || "you@vidplex.app",
        };
      }
    }
    const email = localStorage.getItem("vidplex.v2.identity") || "";
    return {
      name: email ? email.split("@")[0] : "Creator",
      email: email || "you@vidplex.app",
    };
  } catch {
    return { name: "Creator", email: "you@vidplex.app" };
  }
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const { history, favorites, clearHistory, resetAll } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"clear" | "reset" | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("vidplex.v2.profile", JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  }, [profile]);

  const handleReuse = (url: string) => {
    navigate(`/?analyze=${encodeURIComponent(url)}#downloader`);
  };

  const exportLibrary = () => {
    downloadJson(`vidplex-library-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      profile,
      history,
    });
    toast.success("Library exported as JSON.");
  };

  const heading = HEADINGS[tab];

  return (
    <div className="container-px pb-20 pt-6">
      <div className="grid gap-6 lg:grid-cols-[228px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <GlassCard className="p-3">
              <div className="flex items-center gap-3 rounded-2xl p-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#7C3AED,#3B82F6_60%,#06B6D4)] text-[12px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,.9)]">
                  {initials(profile.name || "Creator")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-white">{profile.name || "Creator"}</p>
                  <p className="truncate text-[10px] text-slate-500">{profile.email}</p>
                </div>
              </div>
              <div className="mx-2 mt-1 flex items-center gap-1.5 rounded-lg border border-violet-400/15 bg-violet-500/[0.06] px-2 py-1.5 text-[10px] font-medium text-violet-200">
                <Sparkles className="h-3 w-3" />
                Free workspace
                <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-slate-400">
                  Unlimited
                </span>
              </div>

              <nav className="mt-3 space-y-0.5">
                {TABS.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition",
                        active
                          ? "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                          : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-violet-300" : "text-slate-600 group-hover:text-slate-400")} />
                      {item.label}
                      {item.id === "favorites" && favorites.length > 0 && (
                        <span className="ml-auto rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-rose-300">
                          {favorites.length}
                        </span>
                      )}
                      {item.id === "history" && history.length > 0 && (
                        <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                          {history.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </GlassCard>

            <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-[linear-gradient(135deg,rgba(124,58,237,.18),rgba(6,182,212,.08))] p-4">
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-500/30 blur-2xl" />
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.08] text-amber-200">
                <Crown className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[12px] font-semibold text-white">Go Pro</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                Priority queue, team libraries and API access.
              </p>
              <Button size="sm" fullWidth className="mt-3" onClick={() => setUpgradeOpen(true)}>
                Explore plans
              </Button>
            </div>

            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] text-slate-600 transition hover:bg-white/[0.04] hover:text-slate-300"
            >
              <ArrowUpRight className="h-3 w-3" /> Back to downloader
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-white sm:text-[26px]">
                  {tab === "overview" ? `${heading.title}, ${profile.name.split(" ")[0] || "Creator"}` : heading.title}
                </h1>
                <Badge tone="emerald" dot className="hidden sm:inline-flex">
                  Private
                </Badge>
              </div>
              <p className="mt-1 text-[12px] text-slate-500">{heading.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/#downloader"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[linear-gradient(100deg,#7C3AED,#3B82F6)] px-4 text-[12px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,.9)] transition hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5" /> New download
              </Link>
              <button
                onClick={() => setUpgradeOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 text-[12px] font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                <Crown className="h-3.5 w-3.5 text-amber-300" /> Upgrade
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="mt-5 flex gap-1 overflow-x-auto pb-1 scrollbar-none lg:hidden">
            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-medium transition",
                    tab === item.id
                      ? "border-violet-400/25 bg-violet-500/10 text-white"
                      : "border-white/[0.07] bg-white/[0.02] text-slate-500"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "overview" && (
                  <OverviewView
                    onTab={setTab}
                    onUpgrade={() => setUpgradeOpen(true)}
                    onReuse={handleReuse}
                    onExport={exportLibrary}
                  />
                )}
                {tab === "history" && (
                  <HistoryView onReuse={handleReuse} onClear={() => setConfirmAction("clear")} />
                )}
                {tab === "favorites" && <FavoritesView onReuse={handleReuse} />}
                {tab === "analytics" && <AnalyticsView />}
                {tab === "settings" && (
                  <SettingsView
                    profile={profile}
                    setProfile={setProfile}
                    onExport={exportLibrary}
                    onClear={() => setConfirmAction("clear")}
                    onReset={() => setConfirmAction("reset")}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ConfirmModal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "clear") {
            clearHistory();
            toast.success("History cleared — favorites were kept.");
          } else if (confirmAction === "reset") {
            resetAll();
            toast.success("Workspace reset to defaults.");
          }
        }}
        title={confirmAction === "reset" ? "Reset your workspace?" : "Clear download history?"}
        description={
          confirmAction === "reset"
            ? "This removes your download history, favorites, and preferences from this device."
            : "This removes all non-favorite downloads from your history. Favorites stay untouched."
        }
        confirmLabel={confirmAction === "reset" ? "Reset workspace" : "Clear history"}
      />
    </div>
  );
}

function OverviewView({
  onTab,
  onUpgrade,
  onReuse,
  onExport,
}: {
  onTab: (tab: Tab) => void;
  onUpgrade: () => void;
  onReuse: (url: string) => void;
  onExport: () => void;
}) {
  const { analytics, history, favorites, settings } = useStore();
  const recent = history.slice(0, 5);
  const storageLimit = 5 * 1024 * 1024 * 1024;
  const storagePct = Math.min(100, (analytics.totalBytes / storageLimit) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total downloads"
          value={analytics.totalDownloads}
          hint="All time"
          icon={<Download className="h-4 w-4" />}
          accent="from-violet-500 to-blue-500"
          trend={{ value: `+${analytics.week} this week`, positive: analytics.week > 0 }}
          delay={0}
        />
        <StatCard
          label="Library size"
          value={formatBytes(analytics.totalBytes)}
          hint={`${analytics.totalDownloads} file${analytics.totalDownloads === 1 ? "" : "s"}`}
          icon={<HardDrive className="h-4 w-4" />}
          accent="from-blue-500 to-cyan-400"
          delay={0.05}
        />
        <StatCard
          label="Favorites"
          value={favorites.length}
          hint="Saved for later"
          icon={<Heart className="h-4 w-4" />}
          accent="from-rose-500 to-fuchsia-500"
          delay={0.1}
        />
        <StatCard
          label="This week"
          value={analytics.week}
          hint={`${analytics.today} today`}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="from-cyan-400 to-emerald-400"
          trend={{ value: analytics.today > 0 ? "Active" : "Quiet", positive: analytics.today > 0 }}
          delay={0.15}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <ActivityChart analytics={analytics} />

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-white">Workspace usage</h3>
              <span className="rounded-full border border-violet-400/15 bg-violet-500/[0.06] px-2 py-0.5 text-[9px] font-semibold text-violet-200">
                FREE
              </span>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Library storage</span>
                  <span className="tabular-nums text-slate-400">
                    {formatBytes(analytics.totalBytes)} / 5 GB
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#3B82F6,#06B6D4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(storagePct, analytics.totalBytes > 0 ? 2 : 0)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Favorites</span>
                  <span className="tabular-nums text-slate-400">{favorites.length} saved</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#f43f5e,#d946ef)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, favorites.length * 4)}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px]">
                <span className="text-slate-500">Default quality</span>
                <span className="font-medium text-slate-300">
                  {settings.defaultQuality >= 9999 ? "Best available" : `${settings.defaultQuality}p`}
                </span>
              </div>
            </div>
            <Button size="sm" fullWidth className="mt-4" onClick={onUpgrade} leftIcon={<Crown className="h-3.5 w-3.5" />}>
              Upgrade workspace
            </Button>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 backdrop-blur-xl">
            <h3 className="px-1 text-[13px] font-semibold text-white">Quick actions</h3>
            <div className="mt-3 space-y-1">
              {[
                { label: "New download", icon: Download, onClick: () => (window.location.href = "/#downloader") },
                { label: "View favorites", icon: Heart, onClick: () => onTab("favorites") },
                { label: "Export library", icon: Database, onClick: onExport },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[11.5px] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                    {action.label}
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-700" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h3 className="text-[13px] font-semibold text-white">Recent activity</h3>
            <p className="mt-0.5 text-[10px] text-slate-600">Your last saved files</p>
          </div>
          <button
            onClick={() => onTab("history")}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition hover:text-white"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <Clock3 className="h-5 w-5 text-slate-500" />
            </span>
            <p className="mt-3 text-[12px] font-medium text-slate-300">Nothing here yet</p>
            <p className="mt-1 max-w-xs text-[11px] text-slate-600">
              Your download history will appear here after your first file.
            </p>
            <Link
              to="/#downloader"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-300 hover:text-violet-200"
            >
              Download something <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recent.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.02]">
                <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03]">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center">
                      <PlatformIcon platform={item.platform} size={14} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-slate-200">{item.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-600">
                    <PlatformIcon platform={item.platform} size={9} />
                    {item.platform} · {item.quality} · {formatBytes(item.sizeBytes)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
                <span className="hidden w-16 text-right text-[10px] text-slate-600 sm:block">{timeAgo(item.createdAt)}</span>
                <button
                  onClick={() => onReuse(item.url)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
                  aria-label="Download again"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryView({ onReuse, onClear }: { onReuse: (url: string) => void; onClear: () => void }) {
  const { history, toggleFavorite, removeHistory, analytics } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = history.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.platform.toLowerCase().includes(term) ||
        item.quality.toLowerCase().includes(term) ||
        item.format.toLowerCase().includes(term)
      );
    });
    return [...items].sort((a, b) => {
      if (sort === "oldest") return a.createdAt - b.createdAt;
      if (sort === "largest") return b.sizeBytes - a.sizeBytes;
      return b.createdAt - a.createdAt;
    });
  }, [history, search, sort, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, platform or quality…"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-[12px] text-white placeholder:text-slate-600 focus:border-violet-400/30 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            compact
            className="w-[130px]"
            value={typeFilter}
            onChange={setTypeFilter}
            items={[
              { value: "all", label: "All media" },
              { value: "video", label: "Video only" },
              { value: "audio", label: "Audio only" },
            ]}
          />
          <Dropdown
            compact
            className="w-[140px]"
            value={sort}
            onChange={setSort}
            items={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "largest", label: "Largest first" },
            ]}
          />
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-500 transition hover:border-rose-400/20 hover:bg-rose-500/[0.08] hover:text-rose-300"
              aria-label="Clear history"
              title="Clear history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-slate-600">
        <span>
          Showing <span className="text-slate-400">{filtered.length}</span> of {history.length} downloads
        </span>
        <span className="inline-flex items-center gap-1.5">
          <HardDrive className="h-3 w-3" /> {formatBytes(analytics.totalBytes)} total
        </span>
      </div>

      <GlassCard>
        <HistoryTable
          items={filtered}
          onToggleFavorite={toggleFavorite}
          onRemove={removeHistory}
          onReuse={onReuse}
          emptyTitle={history.length ? "No downloads match" : "Your library is empty"}
          emptyDescription={
            history.length
              ? "Try a different search or filter to find what you're looking for."
              : "Paste a link in the downloader and your real files will show up here."
          }
        />
      </GlassCard>
    </div>
  );
}

function FavoritesView({ onReuse }: { onReuse: (url: string) => void }) {
  const { favorites, toggleFavorite } = useStore();

  if (!favorites.length) {
    return (
      <GlassCard className="flex flex-col items-center px-6 py-20 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-rose-500/10 to-violet-500/10">
          <Heart className="h-6 w-6 text-rose-300/70" />
        </span>
        <h3 className="mt-5 text-[15px] font-semibold text-white">No favorites yet</h3>
        <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-slate-500">
          Tap the heart on any download to keep it here. Favorites survive history clears and stay private on this
          device.
        </p>
        <Link
          to="/#downloader"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(100deg,#7C3AED,#3B82F6)] px-5 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,.9)] transition hover:brightness-110"
        >
          <Download className="h-3.5 w-3.5" /> Download something
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((item) => (
        <FavoriteCard key={item.id} item={item} onReuse={onReuse} onToggleFavorite={toggleFavorite} />
      ))}
    </div>
  );
}

function FavoriteCard({
  item,
  onReuse,
  onToggleFavorite,
}: {
  item: HistoryItem;
  onReuse: (url: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl transition hover:border-white/[0.14]"
    >
      <div className="relative aspect-video overflow-hidden bg-[#0b1120]">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <PlatformIcon platform={item.platform} size={32} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent" />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur">
          <PlatformIcon platform={item.platform} size={9} /> {item.platform}
        </span>
        <button
          onClick={() => onToggleFavorite(item.id)}
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/40 text-rose-300 backdrop-blur transition hover:bg-rose-500/20"
          aria-label="Remove from favorites"
        >
          <Heart className="h-4 w-4 fill-current" />
        </button>
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-200 backdrop-blur">
            {item.format}
          </span>
          <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-slate-200 backdrop-blur">
            {item.quality}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 min-h-[32px] text-[12.5px] font-medium leading-snug text-slate-200">{item.title}</p>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
          <span>{formatBytes(item.sizeBytes)}</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onReuse(item.url)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Download className="h-3.5 w-3.5" /> Download again
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-500 transition hover:text-white"
            aria-label="Open source"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function AnalyticsView() {
  const { analytics, history } = useStore();
  const total = analytics.totalDownloads;
  const videoCount = history.filter((item) => item.type === "video").length;
  const audioCount = history.filter((item) => item.type === "audio").length;
  const videoPct = total ? Math.min(100, Math.round((videoCount / Math.max(1, total)) * 100)) : 0;
  const topPlatform = analytics.byPlatform[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Downloads"
          value={formatCompact(total)}
          hint="All time"
          icon={<Download className="h-4 w-4" />}
          accent="from-violet-500 to-blue-500"
        />
        <StatCard
          label="Data saved"
          value={formatBytes(analytics.totalBytes)}
          hint="Across your library"
          icon={<HardDrive className="h-4 w-4" />}
          accent="from-blue-500 to-cyan-400"
          delay={0.05}
        />
        <StatCard
          label="Avg. file size"
          value={formatBytes(analytics.averageBytes)}
          hint="Per download"
          icon={<Gauge className="h-4 w-4" />}
          accent="from-cyan-400 to-emerald-400"
          delay={0.1}
        />
        <StatCard
          label="Top platform"
          value={topPlatform?.name || "—"}
          hint={topPlatform ? `${topPlatform.count} downloads` : "No data yet"}
          icon={<Globe2 className="h-4 w-4" />}
          accent="from-fuchsia-500 to-violet-500"
          delay={0.15}
        />
      </div>

      <ActivityChart analytics={analytics} />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-white">Platform distribution</h3>
              <p className="mt-0.5 text-[10px] text-slate-600">Where your downloads come from</p>
            </div>
            <Badge tone="violet">{analytics.byPlatform.length} sources</Badge>
          </div>
          {analytics.byPlatform.length === 0 ? (
            <AnalyticsEmpty />
          ) : (
            <div className="mt-5 space-y-4">
              {analytics.byPlatform.slice(0, 6).map((platform) => {
                const pct = total ? Math.round((platform.count / total) * 100) : 0;
                return (
                  <div key={platform.name}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-2 text-slate-300">
                        <PlatformIcon platform={platform.name} size={13} />
                        {platform.name}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {platform.count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 2)}%` }}
                        transition={{ duration: 0.7 }}
                        className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#3B82F6,#06B6D4)]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-white">Library composition</h3>
              <p className="mt-0.5 text-[10px] text-slate-600">Video vs. audio</p>
            </div>
            <Badge tone="cyan">{total} files</Badge>
          </div>
          <div className="mt-5 flex items-center gap-6">
            <div
              className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
              style={{
                background: total
                  ? `conic-gradient(#7C3AED 0 ${videoPct}%, #06B6D4 ${videoPct}% 100%)`
                  : "conic-gradient(rgba(255,255,255,.06) 0 100%)",
              }}
            >
              <div className="grid h-[96px] w-[96px] place-items-center rounded-full bg-[#080e1e]">
                <div className="text-center">
                  <p className="text-[20px] font-semibold tracking-tight text-white">{total}</p>
                  <p className="text-[9px] uppercase tracking-wide text-slate-600">files</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-slate-400">Video</span>
                <span className="ml-auto tabular-nums text-slate-300">
                  {videoCount} · {videoPct}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                <span className="text-slate-400">Audio</span>
                <span className="ml-auto tabular-nums text-slate-300">
                  {audioCount} · {total ? 100 - videoPct : 0}%
                </span>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[10px] text-slate-500">
                Avg. {formatBytes(analytics.averageBytes)} per file
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Top qualities</p>
            {analytics.byQuality.length === 0 ? (
              <p className="text-[11px] text-slate-600">No quality data yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {analytics.byQuality.slice(0, 6).map((quality) => (
                  <span
                    key={quality.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400"
                  >
                    {quality.name}
                    <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-slate-500">
                      {quality.count}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsEmpty() {
  return (
    <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-white/[0.08] px-4 py-10 text-center">
      <BarChart3 className="h-5 w-5 text-slate-600" />
      <p className="mt-2 text-[11px] text-slate-500">Download a few files to see the breakdown.</p>
    </div>
  );
}

function SettingsView({
  profile,
  setProfile,
  onExport,
  onClear,
  onReset,
}: {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  onExport: () => void;
  onClear: () => void;
  onReset: () => void;
}) {
  const { settings, updateSettings, analytics } = useStore();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const loadHealth = () => {
    setHealthLoading(true);
    api
      .health()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const saveProfile = () => {
    if (!name.trim()) {
      toast.error("Add a display name.");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    setProfile({ name: name.trim(), email: email.trim() });
    toast.success("Profile updated.");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
        <SectionTitle icon={User} title="Profile" description="How you appear inside your private workspace." />
        <div className="mt-5 flex flex-col gap-5 sm:flex-row">
          <div className="flex items-center gap-3 sm:flex-col sm:items-start">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#3B82F6_60%,#06B6D4)] text-[18px] font-bold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,.9)]">
              {initials(name || "Creator")}
            </span>
            <p className="text-[10px] text-slate-600">Stored locally on this device</p>
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Display name
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
                <User className="h-3.5 w-3.5 text-slate-600" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-10 w-full bg-transparent text-[12px] text-white placeholder:text-slate-600 focus:outline-none"
                  placeholder="Your name"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Email
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
                <Mail className="h-3.5 w-3.5 text-slate-600" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-10 w-full bg-transparent text-[12px] text-white placeholder:text-slate-600 focus:outline-none"
                  placeholder="you@studio.com"
                />
              </div>
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={saveProfile} leftIcon={<Check className="h-3.5 w-3.5" />}>
            Save changes
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
        <SectionTitle icon={SettingsIcon} title="Preferences" description="Defaults applied to every new download." />
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Default format</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "video" as const, label: "MP4 Video", icon: FileVideo },
                  { id: "audio" as const, label: "MP3 Audio", icon: FileAudio },
                ] as const
              ).map((option) => {
                const Icon = option.icon;
                const active = settings.defaultFormat === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => updateSettings({ defaultFormat: option.id })}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium transition",
                      active
                        ? "border-violet-400/30 bg-violet-500/10 text-white"
                        : "border-white/[0.07] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-violet-300" : "text-slate-500")} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Default quality
            </p>
            <Dropdown
              value={String(settings.defaultQuality)}
              onChange={(value) => updateSettings({ defaultQuality: Number(value) })}
              items={[
                { value: "9999", label: "Best available", description: "Highest resolution at the source" },
                { value: "2160", label: "4K", description: "3840 × 2160" },
                { value: "1440", label: "2K", description: "2560 × 1440" },
                { value: "1080", label: "1080p", description: "Full HD" },
                { value: "720", label: "720p", description: "HD" },
                { value: "480", label: "480p", description: "SD" },
                { value: "360", label: "360p", description: "Compact" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Behaviour</p>
            {[
              {
                key: "autoDownload" as const,
                title: "Auto-save when ready",
                description: "Start the browser download as soon as the file is processed.",
                icon: Download,
              },
              {
                key: "notifications" as const,
                title: "Completion notifications",
                description: "Show a toast when a download finishes or fails.",
                icon: Bell,
              },
              {
                key: "saveHistory" as const,
                title: "Save to history",
                description: "Keep completed downloads in your local library.",
                icon: History,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl px-1 py-2.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-slate-400">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-medium text-slate-200">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{item.description}</p>
                  </div>
                  <Switch
                    label={item.title}
                    checked={settings[item.key]}
                    onChange={(value) => updateSettings({ [item.key]: value })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
          <SectionTitle icon={Palette} title="Appearance" description="A focused dark theme, tuned for long sessions." />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="relative overflow-hidden rounded-xl border border-violet-400/30 bg-[#070d1d] p-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-[linear-gradient(135deg,#0F172A,#1e1b4b)] ring-1 ring-white/10" />
                <span className="text-[11px] font-medium text-white">Midnight</span>
                <Check className="ml-auto h-3.5 w-3.5 text-violet-300" />
              </div>
              <p className="mt-2 text-[9px] text-slate-600">Active</p>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 opacity-60">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-slate-200 ring-1 ring-white/10" />
                <span className="text-[11px] font-medium text-slate-400">Daylight</span>
                <Lock className="ml-auto h-3 w-3 text-slate-600" />
              </div>
              <p className="mt-2 text-[9px] text-slate-600">Coming soon</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {["#7C3AED", "#3B82F6", "#06B6D4", "#D946EF"].map((color) => (
              <span
                key={color}
                className="h-5 w-5 rounded-full ring-2 ring-white/10"
                style={{ background: color }}
              />
            ))}
            <span className="text-[10px] text-slate-600">Accent palette</span>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
          <SectionTitle icon={Database} title="Data & privacy" description="You own every byte. Export or erase anytime." />
          <div className="mt-5 space-y-2">
            <button
              onClick={onExport}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] text-slate-400">
                <Download className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">
                <span className="block text-[11.5px] font-medium text-slate-200">Export library</span>
                <span className="block text-[10px] text-slate-600">Download history as JSON</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
            </button>
            <button
              onClick={onClear}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] text-slate-400">
                <Trash2 className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">
                <span className="block text-[11.5px] font-medium text-slate-200">Clear history</span>
                <span className="block text-[10px] text-slate-600">Keep favorites, remove the rest</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
            </button>
            <button
              onClick={onReset}
              className="flex w-full items-center gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.04] px-3 py-2.5 text-left transition hover:bg-rose-500/[0.08]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-300">
                <Trash2 className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">
                <span className="block text-[11.5px] font-medium text-rose-200">Reset workspace</span>
                <span className="block text-[10px] text-rose-300/50">Erase history, favorites and settings</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-rose-400/40" />
            </button>
          </div>
          <p className="mt-3 text-[10px] text-slate-600">
            {formatBytes(analytics.totalBytes)} stored in your local library.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <SectionTitle
            icon={ShieldCheck}
            title="System status"
            description="Live checks from the download engine powering this workspace."
          />
          <button
            onClick={loadHealth}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-500 transition hover:text-white"
            aria-label="Refresh status"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", healthLoading && "animate-spin")} />
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { label: "API server", ok: Boolean(health?.checks.server), detail: "Node · Express" },
            { label: "yt-dlp engine", ok: Boolean(health?.checks.ytdlp), detail: health?.checks.version || "Not detected" },
            { label: "FFmpeg", ok: Boolean(health?.checks.ffmpeg), detail: "Merge & audio" },
          ].map((check) => (
            <div
              key={check.label}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  check.ok ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]" : "bg-rose-400"
                )}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-200">{check.label}</p>
                <p className="truncate text-[9px] text-slate-600">{check.detail}</p>
              </div>
              <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                {check.ok ? "Up" : "Down"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-emerald-400" /> Files auto-delete after 30 minutes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-violet-300" /> Active jobs: {health?.activeJobs ?? 0}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3 w-3 text-cyan-300" /> Uptime: {health ? `${Math.floor(health.uptime / 60)}m` : "—"}
          </span>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 text-violet-200">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-[13px] font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-[10.5px] text-slate-500">{description}</p>
      </div>
    </div>
  );
}
