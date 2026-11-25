"use client";

import type { PlatformType } from "@/lib/types";

const PLATFORM_META: Record<PlatformType, { label: string; dot: string }> = {
  twitter: { label: "X / Twitter", dot: "bg-sky-400" },
  instagram: { label: "Instagram", dot: "bg-pink-400" },
  facebook: { label: "Facebook", dot: "bg-blue-500" },
  missav: { label: "MissAV", dot: "bg-rose-400" },
  other: { label: "Web", dot: "bg-emerald-400" },
};

export function PlatformBadge({ platform }: { platform: PlatformType }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.other;
  return (
    <span className="font-mono-meta inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
