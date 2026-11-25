"use client";

import { useState } from "react";
import { Captions, ChevronLeft, ChevronRight, Download, ExternalLink, FolderOpen, Plus, Save, Trash2, X } from "lucide-react";
import { mediaDownloadUrl, revealMediaInFolder, storageUrl } from "@/lib/api";
import type { MediaItem } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";

interface MediaLightboxProps {
  item: MediaItem;
  onClose: () => void;
  onUpdate: (id: string, tags: string[], notes: string) => Promise<void>;
  onDelete: (id: string) => void;
}

export function MediaLightbox({ item, onClose, onUpdate, onDelete }: MediaLightboxProps) {
  const mediaFiles = item.file_paths.filter((p) => !/\.(srt|vtt)$/i.test(p));
  const subtitleFiles = item.file_paths.filter((p) => /\.(srt|vtt)$/i.test(p));
  const [slideIndex, setSlideIndex] = useState(0);
  const [tags, setTags] = useState<string[]>(item.tags);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);

  const currentRel = mediaFiles[slideIndex] ?? mediaFiles[0] ?? item.file_paths[0] ?? null;
  const mediaSrc = storageUrl(currentRel);

  const addTag = () => {
    const cleaned = tagInput.trim().replace(/^#/, "");
    if (cleaned && !tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(item.id, tags, notes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-lg"
      onClick={onClose}
    >
      <div
        className="liquid-glass-elevated grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Stage */}
        <div className="relative flex min-h-[320px] min-w-0 items-center justify-center bg-black/60 p-4">
          {mediaSrc && item.media_type === "video" && (
            <video src={mediaSrc} controls autoPlay className="max-h-[78vh] w-full rounded-2xl" />
          )}

          {mediaSrc && item.media_type === "audio" && (
            <div className="flex w-full max-w-md flex-col items-center gap-4 p-6">
              {item.thumbnail_path && (
                <img
                  src={storageUrl(item.thumbnail_path) || ""}
                  alt={item.caption}
                  className="h-56 w-56 rounded-2xl object-cover shadow-2xl"
                />
              )}
              <audio src={mediaSrc} controls autoPlay className="w-full" />
            </div>
          )}

          {mediaSrc && (item.media_type === "image" || item.media_type === "carousel") && (
            <img
              src={mediaSrc}
              alt={item.caption}
              className="max-h-[78vh] w-auto rounded-2xl object-contain"
            />
          )}

          {mediaFiles.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setSlideIndex((i) => (i - 1 + mediaFiles.length) % mediaFiles.length)}
                className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setSlideIndex((i) => (i + 1) % mediaFiles.length)}
                className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="font-mono-meta absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/65 px-3 py-1 text-xs text-white">
                {slideIndex + 1} / {mediaFiles.length}
              </span>
            </>
          )}
        </div>

        {/* Metadata & Tag Editor */}
        <div className="flex min-w-0 flex-col justify-between border-t border-[var(--mv-border)] p-6 lg:border-l lg:border-t-0">
          <div className="min-w-0 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <PlatformBadge
                  platform={item.platform}
                  sourceDomain={item.source_domain}
                  siteName={item.site_name}
                />
                <span className="text-sm font-semibold text-[var(--mv-primary-soft)]">
                  {item.creator}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white/5 text-[var(--mv-text-muted)] hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="break-all text-sm leading-relaxed text-[var(--mv-text)]">{item.caption}</p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={item.original_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#0a84ff] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open original post
              </a>
              {subtitleFiles.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#30d158]/30 bg-[#30d158]/15 px-2.5 py-0.5 text-[11px] text-[#47e266]">
                  <Captions className="h-3 w-3" />
                  {subtitleFiles.length} subtitle file{subtitleFiles.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 rounded-xl border border-[var(--mv-border)] bg-white/5 px-3 py-2 text-xs text-[var(--mv-text)] outline-none focus:border-[#0a84ff]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-xl border border-[var(--mv-border)] bg-white/10 px-3 py-2 text-xs font-medium text-[var(--mv-text)] hover:bg-white/15"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-[#0a84ff]/40 bg-[#0a84ff]/15 px-2.5 py-0.5 text-xs text-[var(--mv-primary-soft)]"
                  >
                    #{t}
                    <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="w-full rounded-xl border border-[var(--mv-border)] bg-white/5 p-3 text-xs text-[var(--mv-text)] outline-none focus:border-[#0a84ff]"
              />
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white/10 px-4 py-2 text-xs font-medium text-[var(--mv-text)] transition hover:bg-white/15"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--mv-border)] pt-4">
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-3.5 py-2 text-xs font-medium text-[#ffb4ab] hover:bg-red-500/25"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => revealMediaInFolder(item.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white/10 px-3.5 py-2 text-xs font-medium text-[var(--mv-text)] hover:bg-white/15"
              >
                <FolderOpen className="h-3.5 w-3.5 text-[#0a84ff]" />
                Open Folder
              </button>
              <a
                href={mediaDownloadUrl(item.id)}
                download
                className="inline-flex items-center gap-2 rounded-full bg-[#0a84ff] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#0a84ff]/25 hover:bg-[#3e90ff]"
              >
                <Download className="h-3.5 w-3.5" />
                {item.file_paths.length > 1 ? "Download ZIP" : "Download File"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
