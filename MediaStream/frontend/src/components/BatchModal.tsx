"use client";

import { useState } from "react";
import { Layers, Loader2, Play, X } from "lucide-react";
import type { FormatPreset } from "@/lib/types";

interface BatchModalProps {
  open: boolean;
  defaultFolder: string;
  defaultAutoExport: boolean;
  onClose: () => void;
  onSubmitBatch: (payload: {
    urls: string[];
    format_id: FormatPreset;
    tags: string[];
    download_subtitles: boolean;
    export_dir: string;
    save_to_export_dir: boolean;
  }) => Promise<void>;
}

const BATCH_FORMATS: { id: FormatPreset; label: string }[] = [
  { id: "best_mp4", label: "Best MP4" },
  { id: "mp4_1080p", label: "1080p MP4" },
  { id: "mp4_720p", label: "720p MP4" },
  { id: "audio_mp3_320", label: "MP3 320kbps" },
  { id: "original_images", label: "Original Images / Carousel" },
];

export function BatchModal({
  open,
  defaultFolder,
  defaultAutoExport,
  onClose,
  onSubmitBatch,
}: BatchModalProps) {
  const [rawUrls, setRawUrls] = useState("");
  const [formatId, setFormatId] = useState<FormatPreset>("best_mp4");
  const [tagsText, setTagsText] = useState("");
  const [downloadSubtitles, setDownloadSubtitles] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const parsedUrls = rawUrls
    .split(/\r?\n/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u));

  const handleStart = async () => {
    if (parsedUrls.length === 0) return;
    setSubmitting(true);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);
      await onSubmitBatch({
        urls: parsedUrls,
        format_id: formatId,
        tags,
        download_subtitles: downloadSubtitles,
        export_dir: defaultFolder,
        save_to_export_dir: defaultAutoExport,
      });
      setRawUrls("");
      setTagsText("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="liquid-glass-elevated w-full max-w-xl overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--mv-border)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Layers className="h-4 w-4 text-[#0a84ff]" />
            <h2 className="text-sm font-semibold text-[var(--mv-text)]">
              Batch Multi-Link Downloader
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white/5 text-[var(--mv-text-muted)] hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6 text-xs">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
              Paste URLs (one link per line)
            </label>
            <textarea
              rows={6}
              value={rawUrls}
              onChange={(e) => setRawUrls(e.target.value)}
              placeholder={"https://www.youtube.com/watch?v=...\nhttps://x.com/...\nhttps://www.instagram.com/reel/..."}
              className="font-mono-meta w-full rounded-2xl border border-[var(--mv-border)] bg-black/25 p-3 text-[11px] text-[var(--mv-text)] outline-none placeholder:text-[var(--mv-text-subtle)] focus:border-[#0a84ff]"
            />
            <p className="font-mono-meta text-[11px] text-[var(--mv-text-subtle)]">
              {parsedUrls.length} valid URL{parsedUrls.length === 1 ? "" : "s"} detected
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                Format
              </label>
              <select
                value={formatId}
                onChange={(e) => setFormatId(e.target.value as FormatPreset)}
                className="w-full rounded-xl border border-[var(--mv-border)] bg-[#1b1b1f] px-3 py-2 text-xs text-[var(--mv-text)] outline-none focus:border-[#0a84ff]"
              >
                {BATCH_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="batch, inspo, music"
                className="w-full rounded-xl border border-[var(--mv-border)] bg-white/5 px-3 py-2 text-xs text-[var(--mv-text)] outline-none focus:border-[#0a84ff]"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--mv-text-muted)]">
            <input
              type="checkbox"
              checked={downloadSubtitles}
              onChange={(e) => setDownloadSubtitles(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#0a84ff]"
            />
            Include subtitles (.srt / .vtt) when available
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--mv-border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--mv-border)] bg-white/5 px-4 py-2 text-xs text-[var(--mv-text-muted)] hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || parsedUrls.length === 0}
            onClick={handleStart}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0a84ff] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#0a84ff]/25 hover:bg-[#3e90ff] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Queue {parsedUrls.length} Download{parsedUrls.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
