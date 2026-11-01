import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { HistoryItem, Settings } from "./types";

const HISTORY_KEY = "vidplex.v2.history";
const SETTINGS_KEY = "vidplex.v2.settings";

const defaultSettings: Settings = {
  defaultQuality: 1080,
  defaultFormat: "video",
  autoDownload: true,
  notifications: true,
  saveHistory: true,
};

export interface Analytics {
  totalDownloads: number;
  totalBytes: number;
  favorites: number;
  averageBytes: number;
  topPlatform: string | null;
  byPlatform: Array<{ name: string; count: number; bytes: number }>;
  byQuality: Array<{ name: string; count: number }>;
  last7Days: Array<{ key: string; label: string; count: number; bytes: number }>;
  today: number;
  week: number;
}

interface StoreContextValue {
  history: HistoryItem[];
  favorites: HistoryItem[];
  settings: Settings;
  analytics: Analytics;
  addHistory: (
    item: Omit<HistoryItem, "id" | "createdAt" | "favorite" | "status"> & {
      favorite?: boolean;
      status?: HistoryItem["status"];
    }
  ) => HistoryItem;
  updateHistory: (id: string, patch: Partial<HistoryItem>) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  toggleFavorite: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function buildAnalytics(history: HistoryItem[]): Analytics {
  const totalDownloads = history.length;
  const totalBytes = history.reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0);
  const favorites = history.filter((item) => item.favorite).length;
  const platformMap = new Map<string, { count: number; bytes: number }>();
  const qualityMap = new Map<string, number>();

  for (const item of history) {
    const platform = platformMap.get(item.platform) || { count: 0, bytes: 0 };
    platform.count += 1;
    platform.bytes += Number(item.sizeBytes) || 0;
    platformMap.set(item.platform, platform);
    qualityMap.set(item.quality, (qualityMap.get(item.quality) || 0) + 1);
  }

  const byPlatform = [...platformMap.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.count - a.count);

  const byQuality = [...qualityMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    const items = history.filter((item) => item.createdAt >= date.getTime() && item.createdAt < next.getTime());
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      count: items.length,
      bytes: items.reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0),
    };
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = history.filter((item) => item.createdAt >= startOfToday.getTime()).length;
  const week = last7Days.reduce((sum, day) => sum + day.count, 0);

  return {
    totalDownloads,
    totalBytes,
    favorites,
    averageBytes: totalDownloads ? Math.round(totalBytes / totalDownloads) : 0,
    topPlatform: byPlatform[0]?.name || null,
    byPlatform,
    byQuality,
    last7Days,
    today,
    week,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const stored = readJson<HistoryItem[]>(HISTORY_KEY, []);
    return Array.isArray(stored)
      ? stored
          .filter((item) => item && typeof item.id === "string" && typeof item.title === "string")
          .slice(0, 150)
      : [];
  });
  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    ...readJson<Partial<Settings>>(SETTINGS_KEY, {}),
  }));

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* storage might be full or blocked */
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const addHistory = useCallback<StoreContextValue["addHistory"]>((item) => {
    const entry: HistoryItem = {
      ...item,
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      status: item.status || "completed",
      favorite: item.favorite ?? false,
    };
    setHistory((current) => [entry, ...current].slice(0, 150));
    return entry;
  }, []);

  const updateHistory = useCallback((id: string, patch: Partial<HistoryItem>) => {
    setHistory((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeHistory = useCallback((id: string) => {
    setHistory((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((current) => current.filter((item) => item.favorite));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setHistory((current) =>
      current.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item))
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const resetAll = useCallback(() => {
    setHistory([]);
    setSettings(defaultSettings);
  }, []);

  const favorites = useMemo(() => history.filter((item) => item.favorite), [history]);
  const analytics = useMemo(() => buildAnalytics(history), [history]);

  const value = useMemo<StoreContextValue>(
    () => ({
      history,
      favorites,
      settings,
      analytics,
      addHistory,
      updateHistory,
      removeHistory,
      clearHistory,
      toggleFavorite,
      updateSettings,
      resetAll,
    }),
    [
      history,
      favorites,
      settings,
      analytics,
      addHistory,
      updateHistory,
      removeHistory,
      clearHistory,
      toggleFavorite,
      updateSettings,
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
