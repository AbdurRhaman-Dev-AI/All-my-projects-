"use client";

import { CheckCircle2, Download, ExternalLink, Film, Play, ShieldAlert, Star } from "lucide-react";
import type { SearchResultItem } from "@/lib/types";

interface SearchResultCardProps {
  item: SearchResultItem;
  blurAdult: boolean;
  onWatch: (item: SearchResultItem) => void;
  onDownload: (item: SearchResultItem) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  video: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
  anime: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  tv: "bg-sky-500/20 text-sky-300 border-sky-400/30",
  archive: "bg-teal-500/20 text-teal-200 border-teal-400/30",
};

export function SearchResultCard({
  item,
  blurAdult,
  onWatch,
  onDownload,
}: SearchResultCardProps) {
  const shouldBlur = item.is_adult && blurAdult;

  return (
    <article className="liquid-glass group flex flex-col overflow-hidden rounded-2xl transition duration-200 hover:-translate-y-0.5 hover:border-[var(--mv-primary)]/40">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--mv-surface-lowest)]">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
              shouldBlur ? "blur-xl scale-110" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--mv-text-subtle)]">
            <Film className="h-9 w-9 opacity-60" />
          </div>
        )}

        {/* Top pills */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
              CATEGORY_COLORS[item.category] ?? "bg-white/15 text-white border-white/20"
            }`}
          >
            {item.site_name}
          </span>

          <div className="flex items-center gap-1.5">
            {item.is_adult && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/85 px-2 py-0.5 text-[10px] font-bold text-white">
                <ShieldAlert className="h-2.5 w-2.5" />
                18+
              </span>
            )}
            {item.in_library && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-[#00210b]">
                <CheckCircle2 className="h-2.5 w-2.5" />
                In Library
              </span>
            )}
          </div>
        </div>

        {/* Bottom-right duration / rating */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {item.rating !== null && item.rating !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 font-mono-meta text-[10px] text-amber-300 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 fill-current" />
              {item.rating}
            </span>
          )}
          {item.duration && (
            <span className="rounded-md bg-black/75 px-1.5 py-0.5 font-mono-meta text-[10px] text-white backdrop-blur-sm">
              {item.duration}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--mv-text)]">
            {item.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--mv-text-subtle)]">
            {item.subtitle || item.source_domain}
            {item.year ? ` • ${item.year}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {item.watchable ? (
            <button
              onClick={() => onWatch(item)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--mv-primary)]/18 px-3 py-2 text-xs font-semibold text-[var(--mv-primary-soft)] transition hover:bg-[var(--mv-primary)]/30"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Watch
            </button>
          ) : (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--mv-border)] px-3 py-2 text-xs font-medium text-[var(--mv-text-muted)] transition hover:bg-white/10"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Info
            </a>
          )}

          {item.downloadable && (
            <button
              onClick={() => onDownload(item)}
              className="aurora-glow inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00e5c3] to-[#06b6d4] px-3 py-2 text-xs font-semibold text-[#00201a] transition hover:brightness-110"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
