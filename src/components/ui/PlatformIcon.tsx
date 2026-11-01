import React from "react";
import {
  SiYoutube,
  SiInstagram,
  SiFacebook,
  SiTiktok,
  SiX,
  SiVimeo,
  SiDailymotion,
  SiTwitch,
  SiReddit,
  SiPinterest,
} from "react-icons/si";
import { Link2 } from "lucide-react";
import { cn } from "../../lib/format";

const ICONS: Record<
  string,
  { Icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>; color: string }
> = {
  YouTube: { Icon: SiYoutube, color: "#FF4D4D" },
  Instagram: { Icon: SiInstagram, color: "#F472B6" },
  Facebook: { Icon: SiFacebook, color: "#60A5FA" },
  TikTok: { Icon: SiTiktok, color: "#E2E8F0" },
  X: { Icon: SiX, color: "#E2E8F0" },
  Twitter: { Icon: SiX, color: "#E2E8F0" },
  Vimeo: { Icon: SiVimeo, color: "#22D3EE" },
  Dailymotion: { Icon: SiDailymotion, color: "#60A5FA" },
  Twitch: { Icon: SiTwitch, color: "#A78BFA" },
  Reddit: { Icon: SiReddit, color: "#FB923C" },
  Pinterest: { Icon: SiPinterest, color: "#F87171" },
  Direct: { Icon: Link2, color: "#A78BFA" },
};

export function PlatformIcon({
  platform,
  size = 16,
  className,
  colored = true,
}: {
  platform: string;
  size?: number;
  className?: string;
  colored?: boolean;
}) {
  const entry = ICONS[platform] || ICONS.Direct;
  const Icon = entry.Icon;
  return (
    <Icon
      size={size}
      className={cn("shrink-0", className)}
      style={colored ? { color: entry.color } : undefined}
      aria-hidden
    />
  );
}

export function platformColor(platform: string) {
  return ICONS[platform]?.color || "#A78BFA";
}
