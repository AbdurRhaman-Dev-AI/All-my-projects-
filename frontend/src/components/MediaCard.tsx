"use client";

import { Download, Film, FolderOpen, Image as ImageIcon, Layers, Music, Trash2 } from "lucide-react";
import { mediaDownloadUrl, revealMediaInFolder, storageUrl } from "@/lib/api";
import type { MediaItem } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";

interface MediaCardProps {
  item: MediaItem;
  onOpen: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MediaCard({ item, onOpen, onDelete }: MediaCardProps) {
  const thumb = storageUrl(item.thumbnail_path);
  const durationLabel = formatDuration(item.duration);
  const mediaFilesCount = item.file_paths.filter((p) => !/\.(srt|vtt)$/i.test(p)).length;

  return (
    <article
      onClick={() => onOpen(item)}
      className="liquid-glass group relative mb-5 break-inside-avoid cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.015] hover:border-white/25"
    >
      {/* Thumbnail Canvas */}
      <div className="relative overflow-hidden bg-[var(--mv-surface-lowest)]">
        {thumb ? (
          <img
            src={thumb}
            alt={item.caption || "Saved media"}
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center text-[var(--mv-text-subtle)]">
            {item.media_type === "audio" ? (
              <Music className="h-10 w-10 opacity-60" />
            ) : item.media_type === "video" ? (
              <Film className="h-10 w-10 opacity-60" />
            ) : (
              <ImageIcon className="h-10 w-10 opacity-60" />
            )}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <PlatformBadge
            platform={item.platform}
            sourceDomain={item.source_domain}
            siteName={item.site_name}
          />

          {item.media_type === "carousel" && (
            <span className="font-mono-meta inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
              <Layers className="h-3 w-3" />
              {mediaFilesCount}
            </span>
          )}
        </div>

        {/* Bottom Telemetry Pills */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {durationLabel && (
              <span className="font-mono-meta rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                {durationLabel}
              </span>
            )}
            {item.resolution && (
              <span className="font-mono-meta rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-[#aac7ff] backdrop-blur-md">
                {item.resolution}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div
            className="flex items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => revealMediaInFolder(item.id)}
              title="Show in Folder"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/25"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
            <a
              href={mediaDownloadUrl(item.id)}
              download
              title="Download to Browser"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-[#0a84ff]"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              title="Delete from Vault"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-red-500/90"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-[var(--mv-primary-soft)]">
            {item.creator}
          </span>
          <span className="font-mono-meta text-[10px] text-[var(--mv-text-subtle)]">
            {item.file_size > 0 ? `${(item.file_size / (1024 * 1024)).toFixed(1)} MB` : item.media_type.toUpperCase()}
          </span>
        </div>

        <p className="line-clamp-2 text-[13px] leading-snug text-[var(--mv-text)]">
          {item.caption}
        </p>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--mv-border)] bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-[var(--mv-text-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
