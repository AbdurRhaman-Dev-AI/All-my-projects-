"use client";

import { PlatformLogo } from "./PlatformLogo";

const DEFAULT_NAMES: Record<string, string> = {
  twitter: "X / Twitter",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  youtube_shorts: "YouTube Shorts",
  tiktok: "TikTok",
  reddit: "Reddit",
  vimeo: "Vimeo",
  missav: "MissAV",
  other: "Web",
};

interface PlatformBadgeProps {
  platform: string;
  sourceDomain?: string;
  siteName?: string;
}

export function PlatformBadge({ platform, sourceDomain, siteName }: PlatformBadgeProps) {
  const label = siteName || DEFAULT_NAMES[platform] || platform || "Web";
  return (
    <span className="font-mono-meta inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
      <PlatformLogo platform={platform} sourceDomain={sourceDomain} size={13} />
      {label}
    </span>
  );
}
