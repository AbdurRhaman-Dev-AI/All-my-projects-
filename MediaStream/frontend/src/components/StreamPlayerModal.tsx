"use client";

import { useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  Film,
  Loader2,
  Play,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { resolveStream } from "@/lib/api";
import type { SearchResultItem } from "@/lib/types";

interface StreamPlayerModalProps {
  item: SearchResultItem | null;
  onClose: () => void;
  onDownload: (item: SearchResultItem) => void;
}

export function StreamPlayerModal({ item, onClose, onDownload }: StreamPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [resolvedTitle, setResolvedTitle] = useState<string>("");

  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEmbedUrl(null);
    setStreamUrl(null);
    setResolvedTitle(item.title);

    resolveStream(item.url)
      .then((res) => {
        if (cancelled) return;
        setEmbedUrl(res.embed_url ?? null);
        setStreamUrl(res.stream_url ?? null);
        if (res.title) setResolvedTitle(res.title);
        if (!res.embed_url && !res.stream_url) {
          setError("No direct playable stream was found for this item. You can still open the source or try Download.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not resolve stream URL.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="liquid-glass-elevated relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--mv-border)] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--mv-primary)]/20 text-[var(--mv-primary-soft)]">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[var(--mv-text)]">
                {resolvedTitle || item.title}
              </h3>
              <p className="truncate text-[11px] text-[var(--mv-text-subtle)]">
                {item.site_name} • {item.subtitle || item.category.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {item.downloadable && (
              <button
                onClick={() => {
                  onClose();
                  onDownload(item);
                }}
                className="aurora-glow inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00e5c3] to-[#06b6d4] px-3.5 py-1.5 text-xs font-semibold text-[#00201a] transition hover:brightness-110"
              >
                <Download className="h-3.5 w-3.5" />
                Save to Library
              </button>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--mv-border)] px-3 py-1.5 text-xs text-[var(--mv-text-muted)] transition hover:bg-white/10"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Source
            </a>
            <button
              onClick={onClose}
              aria-label="Close player"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--mv-border)] text-[var(--mv-text-muted)] transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video stage */}
        <div className="relative aspect-video w-full bg-black">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--mv-text-muted)]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--mv-primary)]" />
              <p className="text-xs">Resolving stream from {item.site_name}...</p>
            </div>
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={resolvedTitle}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : streamUrl ? (
            <video
              src={streamUrl}
              controls
              autoPlay
              playsInline
              poster={item.thumbnail_url || undefined}
              className="h-full w-full bg-black object-contain"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <Film className="h-10 w-10 text-[var(--mv-text-subtle)]" />
              <p className="max-w-md text-xs text-[var(--mv-text-muted)]">
                {error || "Direct stream unavailable."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {item.downloadable && (
                  <button
                    onClick={() => {
                      onClose();
                      onDownload(item);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--mv-primary)] px-4 py-2 text-xs font-semibold text-[#00201a]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Inspect & Download
                  </button>
                )}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--mv-border)] px-4 py-2 text-xs text-[var(--mv-text)] hover:bg-white/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open on {item.site_name}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Metadata footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {item.year && (
              <span className="rounded-lg bg-white/5 px-2 py-0.5 font-mono-meta text-[11px] text-[var(--mv-text-muted)]">
                {item.year}
              </span>
            )}
            {item.rating !== null && item.rating !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/15 px-2 py-0.5 font-mono-meta text-[11px] text-amber-300">
                <Star className="h-3 w-3 fill-current" />
                {item.rating}
              </span>
            )}
            {item.genres?.slice(0, 4).map((g) => (
              <span
                key={g}
                className="rounded-lg border border-[var(--mv-border)] px-2 py-0.5 text-[11px] text-[var(--mv-text-subtle)]"
              >
                {g}
              </span>
            ))}
          </div>
          {item.in_library && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--mv-tertiary)]/15 px-2.5 py-0.5 text-[11px] font-medium text-[var(--mv-tertiary)]">
              <Sparkles className="h-3 w-3" />
              Already in your library
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
