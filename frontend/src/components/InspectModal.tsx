"use client";

import { useState } from "react";
import { Check, Download, Film, FolderOpen, Image as ImageIcon, Plus, Tag, X } from "lucide-react";
import { pickDownloadFolder } from "@/lib/api";
import type { FormatPreset, InspectResponse } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";

interface InspectModalProps {
  data: InspectResponse;
  defaultFolder: string;
  defaultAutoExport: boolean;
  onClose: () => void;
  onFolderPicked: (folder: string) => void;
  onConfirm: (
    formatId: FormatPreset,
    tags: string[],
    notes: string,
    exportDir: string,
    saveToExportDir: boolean
  ) => Promise<void>;
}

export function InspectModal({
  data,
  defaultFolder,
  defaultAutoExport,
  onClose,
  onFolderPicked,
  onConfirm,
}: InspectModalProps) {
  const firstAvailable = data.formats.find((f) => f.available)?.id ?? "best_mp4";
  const [selectedFormat, setSelectedFormat] = useState<FormatPreset>(firstAvailable);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [exportDir, setExportDir] = useState(defaultFolder);
  const [saveToExportDir, setSaveToExportDir] = useState(defaultAutoExport);
  const [pickingFolder, setPickingFolder] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(selectedFormat, tags, notes, exportDir, saveToExportDir);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="liquid-glass-elevated max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--mv-border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <PlatformBadge platform={data.platform} />
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

        {/* Body */}
        <div className="grid gap-6 p-6 md:grid-cols-[200px_1fr]">
          {/* Thumbnail */}
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

          {/* Details & Options */}
          <div className="space-y-4">
            <p className="line-clamp-3 text-sm leading-relaxed text-[var(--mv-text)]">
              {data.caption}
            </p>

            {/* Quality & File Size Picker */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                Quality, Format & File Size
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.formats.map((fmt) => {
                  const active = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      disabled={!fmt.available}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`flex items-start justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                        !fmt.available
                          ? "cursor-not-allowed border-[var(--mv-border)] opacity-35"
                          : active
                            ? "border-[#0a84ff] bg-[#0a84ff]/20 text-[var(--mv-text)]"
                            : "border-[var(--mv-border)] bg-white/5 text-[var(--mv-text-muted)] hover:bg-white/10"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-xs font-semibold">{fmt.label}</span>
                          <span className="font-mono-meta shrink-0 rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-[#aac7ff]">
                            {fmt.estimated_size_label || "Auto"}
                          </span>
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-[11px] opacity-75">
                          {fmt.description}
                        </div>
                      </div>
                      {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0a84ff]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Location Picker */}
            <div className="space-y-2 rounded-2xl border border-[var(--mv-border)] bg-white/5 p-3">
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

            {/* Custom Tags */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--mv-text-subtle)]">
                <Tag className="h-3.5 w-3.5" />
                Custom Tags
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
                  placeholder="Add tag (e.g. 4k, anime, fav)..."
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
            </div>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note..."
              className="w-full rounded-xl border border-[var(--mv-border)] bg-white/5 px-3 py-2 text-xs text-[var(--mv-text)] outline-none placeholder:text-[var(--mv-text-subtle)] focus:border-[#0a84ff]"
            />
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
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-full bg-[#0a84ff] px-6 py-2 text-xs font-semibold text-white shadow-lg shadow-[#0a84ff]/25 transition hover:bg-[#3e90ff] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {submitting ? "Queueing..." : "Download & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
