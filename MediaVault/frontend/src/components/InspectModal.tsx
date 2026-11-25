"use client";

import { useState } from "react";
import {
  AlertCircle,
  Captions,
  Check,
  Download,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Music,
  Plus,
  Tag,
  X,
} from "lucide-react";
import { pickDownloadFolder } from "@/lib/api";
import type { FormatOption, FormatPreset, InspectResponse } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";

interface InspectModalProps {
  data: InspectResponse;
  defaultFolder: string;
  defaultAutoExport: boolean;
  onClose: () => void;
  onFolderPicked: (folder: string) => void;
  onViewExisting?: (mediaId: string) => void;
  onConfirm: (
    formatId: FormatPreset,
    tags: string[],
    notes: string,
    exportDir: string,
    saveToExportDir: boolean,
    downloadSubtitles: boolean
  ) => Promise<void>;
}

function QualityRow({
  fmt,
  selected,
  submitting,
  onSelect,
  onInstantDownload,
}: {
  fmt: FormatOption;
  selected: boolean;
  submitting: boolean;
  onSelect: () => void;
  onInstantDownload: () => void;
}) {
  const pillLabel = fmt.kind === "audio" ? "MP3" : fmt.kind === "image" ? "IMG" : "MP4";
  return (
    <div
      onClick={onSelect}
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
        selected
          ? "border-[#0a84ff] bg-[#0a84ff]/15 text-[var(--mv-text)]"
          : "border-[var(--mv-border)] bg-white/5 text-[var(--mv-text-muted)] hover:bg-white/10"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="font-mono-meta shrink-0 rounded-md border border-[#0a84ff]/40 bg-[#0a84ff]/15 px-2 py-0.5 text-[10px] font-bold text-[#aac7ff]">
          {pillLabel}
        </span>
        <span className="truncate text-xs font-semibold text-[var(--mv-text)]">{fmt.label}</span>
        {fmt.badge_tag && (
          <span className="font-mono-meta shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
            {fmt.badge_tag}
          </span>
        )}
        <span className="font-mono-meta shrink-0 text-[11px] text-[var(--mv-text-subtle)]">
          {fmt.estimated_size_label || "Auto size"}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {selected && <Check className="h-3.5 w-3.5 text-[#0a84ff]" />}
        <button
          type="button"
          disabled={submitting}
          onClick={onInstantDownload}
          className="inline-flex items-center gap-1 rounded-full border border-[#30d158]/50 bg-[#30d158]/15 px-3 py-1 text-[11px] font-semibold text-[#47e266] transition hover:bg-[#30d158]/25 disabled:opacity-50"
        >
          <Download className="h-3 w-3" />
          Download
        </button>
      </div>
    </div>
  );
}

export function InspectModal({
  data,
  defaultFolder,
  defaultAutoExport,
  onClose,
  onFolderPicked,
  onViewExisting,
  onConfirm,
}: InspectModalProps) {
  const firstAvailable = data.formats.find((f) => f.available)?.id ?? "best_mp4";
  const [selectedFormat, setSelectedFormat] = useState<FormatPreset>(firstAvailable);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [exportDir, setExportDir] = useState(defaultFolder);
  const [saveToExportDir, setSaveToExportDir] = useState(defaultAutoExport);
  const [downloadSubtitles, setDownloadSubtitles] = useState(false);
  const [pickingFolder, setPickingFolder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const videoFormats = data.formats.filter((f) => f.kind === "video");
  const audioFormats = data.formats.filter((f) => f.kind === "audio");
  const imageFormats = data.formats.filter((f) => f.kind === "image");

  const addTag = () => {
    const cleaned = tagInput.trim().replace(/^#/, "");
    if (cleaned && !tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput("");
  };

  const handleBrowseFolder = async () => {
    setPickingFolder(true);
    try {
      const res = await pickDownloadFolder();
      if (res.download_dir) {
        setExportDir(res.download_dir);
        setSaveToExportDir(true);
        onFolderPicked(res.download_dir);
      }
    } finally {
      setPickingFolder(false);
    }
  };

  const triggerDownload = async (formatId: FormatPreset) => {
    setSubmitting(true);
    try {
      await onConfirm(formatId, tags, notes, exportDir, saveToExportDir, downloadSubtitles);
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
        className="liquid-glass-elevated max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--mv-border)] px-6 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <PlatformBadge
              platform={data.platform}
              sourceDomain={data.source_domain}
              siteName={data.site_name}
            />
            <span className="text-sm font-semibold text-[var(--mv-primary-soft)]">
              {data.creator}
            </span>
            {data.duration ? (
              <span className="font-mono-meta rounded-full border border-[var(--mv-border)] bg-white/5 px-2.5 py-0.5 text-[10px] text-[var(--mv-text-muted)]">
                {Math.floor(data.duration / 60)}:{String(data.duration % 60).padStart(2, "0")}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white/5 text-[var(--mv-text-muted)] transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Duplicate Warning */}
        {data.existing_media_id && (
          <div className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/35 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-300" />
              This exact link is already saved in your MediaVault library.
            </span>
            {onViewExisting && (
              <button
                type="button"
                onClick={() => onViewExisting(data.existing_media_id!)}
                className="rounded-full border border-amber-300/40 bg-amber-300/20 px-3 py-1 font-semibold text-white hover:bg-amber-300/30"
              >
                Open Saved Item
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="grid gap-6 p-6 md:grid-cols-[210px_1fr]">
          {/* Thumbnail & Metadata */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-[var(--mv-border)] bg-[var(--mv-surface-lowest)]">
              {data.thumbnail_url ? (
                <img
                  src={data.thumbnail_url}
                  alt={data.caption}
                  className="aspect-[4/5] h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-[var(--mv-text-subtle)]">
                  {data.media_type === "video" ? <Film className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" />}
                </div>
              )}
            </div>
            <p className="line-clamp-4 text-xs leading-relaxed text-[var(--mv-text-muted)]">
              {data.caption}
            </p>
          </div>

          {/* Quality List + Options */}
          <div className="space-y-4">
            {/* Video / Image Qualities */}
            {videoFormats.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                    <Film className="h-3.5 w-3.5" />
                    Video Quality (Unlimited Size)
                  </label>
                </div>
                <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                  {videoFormats.map((fmt) => (
                    <QualityRow
                      key={fmt.id}
                      fmt={fmt}
                      selected={selectedFormat === fmt.id}
                      submitting={submitting}
                      onSelect={() => setSelectedFormat(fmt.id)}
                      onInstantDownload={() => triggerDownload(fmt.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Audio MP3 Qualities */}
            {audioFormats.length > 0 && (
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                  <Music className="h-3.5 w-3.5" />
                  Audio Only (MP3)
                </label>
                <div className="space-y-1.5">
                  {audioFormats.map((fmt) => (
                    <QualityRow
                      key={fmt.id}
                      fmt={fmt}
                      selected={selectedFormat === fmt.id}
                      submitting={submitting}
                      onSelect={() => setSelectedFormat(fmt.id)}
                      onInstantDownload={() => triggerDownload(fmt.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Image / Carousel */}
            {imageFormats.length > 0 && (
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Images / Carousel
                </label>
                <div className="space-y-1.5">
                  {imageFormats.map((fmt) => (
                    <QualityRow
                      key={fmt.id}
                      fmt={fmt}
                      selected={selectedFormat === fmt.id}
                      submitting={submitting}
                      onSelect={() => setSelectedFormat(fmt.id)}
                      onInstantDownload={() => triggerDownload(fmt.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Subtitles + Folder Picker */}
            <div className="space-y-2.5 rounded-2xl border border-[var(--mv-border)] bg-white/5 p-3">
              {data.media_type === "video" && (
                <label className="flex cursor-pointer items-center justify-between gap-2 border-b border-[var(--mv-border)] pb-2 text-xs text-[var(--mv-text)]">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={downloadSubtitles}
                      onChange={(e) => setDownloadSubtitles(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#0a84ff]"
                    />
                    <Captions className="h-3.5 w-3.5 text-[#aac7ff]" />
                    Download subtitles (.srt / .vtt)
                  </span>
                  {data.subtitles_available && (
                    <span className="font-mono-meta rounded-full bg-[#30d158]/20 px-2 py-0.5 text-[10px] text-[#47e266]">
                      Available
                    </span>
                  )}
                </label>
              )}

              <div className="flex items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--mv-text)]">
                  <input
                    type="checkbox"
                    checked={saveToExportDir}
                    onChange={(e) => setSaveToExportDir(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#0a84ff]"
                  />
                  Save file directly to PC folder
                </label>
                <button
                  type="button"
                  disabled={pickingFolder}
                  onClick={handleBrowseFolder}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--mv-border)] bg-white/10 px-3 py-1 text-[11px] font-medium text-[var(--mv-text)] hover:bg-white/15"
                >
                  <FolderOpen className="h-3 w-3 text-[#0a84ff]" />
                  {pickingFolder ? "Choosing..." : "Choose Folder..."}
                </button>
              </div>
              {saveToExportDir && (
                <input
                  type="text"
                  value={exportDir}
                  onChange={(e) => setExportDir(e.target.value)}
                  className="font-mono-meta w-full rounded-xl border border-[var(--mv-border)] bg-black/25 px-2.5 py-1.5 text-[11px] text-[var(--mv-text-muted)] outline-none focus:border-[#0a84ff]"
                />
              )}
            </div>

            {/* Custom Tags & Notes */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                <Tag className="h-3.5 w-3.5" />
                Custom Tags & Notes
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
                  placeholder="Add tag (e.g. 4k, tutorial, fav)..."
                  className="flex-1 rounded-xl border border-[var(--mv-border)] bg-white/5 px-3 py-2 text-xs text-[var(--mv-text)] outline-none placeholder:text-[var(--mv-text-subtle)] focus:border-[#0a84ff]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="flex items-center gap-1 rounded-xl border border-[var(--mv-border)] bg-white/10 px-3 py-2 text-xs font-medium text-[var(--mv-text)] transition hover:bg-white/15"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full border border-[#0a84ff]/40 bg-[#0a84ff]/15 px-2.5 py-0.5 text-xs text-[var(--mv-primary-soft)]"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                        className="hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note..."
                className="w-full rounded-xl border border-[var(--mv-border)] bg-white/5 px-3 py-2 text-xs text-[var(--mv-text)] outline-none placeholder:text-[var(--mv-text-subtle)] focus:border-[#0a84ff]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--mv-border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--mv-border)] bg-white/5 px-5 py-2 text-xs font-medium text-[var(--mv-text-muted)] transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => triggerDownload(selectedFormat)}
            className="inline-flex items-center gap-2 rounded-full bg-[#0a84ff] px-6 py-2 text-xs font-semibold text-white shadow-lg shadow-[#0a84ff]/25 transition hover:bg-[#3e90ff] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {submitting ? "Queueing..." : "Download Selected"}
          </button>
        </div>
      </div>
    </div>
  );
}
