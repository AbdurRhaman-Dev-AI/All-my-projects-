"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Cookie, FolderOpen, Trash2, Upload, X } from "lucide-react";
import { pickDownloadFolder, saveDownloadSettings, type SettingsStatus } from "@/lib/api";

interface CookiesModalProps {
  open: boolean;
  status: SettingsStatus | null;
  onClose: () => void;
  onSaveCookies: (content: string) => Promise<void>;
  onSettingsUpdated: () => Promise<void>;
}

export function CookiesModal({
  open,
  status,
  onClose,
  onSaveCookies,
  onSettingsUpdated,
}: CookiesModalProps) {
  const [content, setContent] = useState("");
  const [folderInput, setFolderInput] = useState(status?.download_dir || "");
  const [autoExport, setAutoExport] = useState(status?.auto_export ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status) {
      setFolderInput(status.download_dir);
      setAutoExport(status.auto_export);
    }
  }, [status]);

  if (!open) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContent(text);
  };

  const handleBrowse = async () => {
    const res = await pickDownloadFolder();
    if (res.download_dir) {
      setFolderInput(res.download_dir);
      await onSettingsUpdated();
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveDownloadSettings({
        download_dir: folderInput,
        auto_export: autoExport,
      });
      if (content.trim()) {
        await onSaveCookies(content);
        setContent("");
      } else {
        await onSettingsUpdated();
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="liquid-glass-elevated max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--mv-border)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Cookie className="h-4 w-4 text-[#0a84ff]" />
            <h2 className="text-sm font-semibold text-[var(--mv-text)]">
              Download Folder, Cookies & Engine Status
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
          {/* Status Badges */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--mv-border)] bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-wider text-[var(--mv-text-subtle)]">
                FFmpeg Engine
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-medium text-[var(--mv-text)]">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    status?.ffmpeg_configured ? "text-[#47e266]" : "text-amber-400"
                  }`}
                />
                {status?.ffmpeg_configured ? "Ready" : "Not found"}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--mv-border)] bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-wider text-[var(--mv-text-subtle)]">
                cookies.txt
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-medium text-[var(--mv-text)]">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    status?.cookies_configured ? "text-[#47e266]" : "text-amber-400"
                  }`}
                />
                {status?.cookies_configured ? "Configured" : "Not configured"}
              </div>
            </div>
          </div>

          {/* Default PC Download Folder */}
          <div className="space-y-2 rounded-2xl border border-[var(--mv-border)] bg-white/5 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--mv-text)]">Default Download Folder</span>
              <button
                type="button"
                onClick={handleBrowse}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white/10 px-3 py-1 text-[11px] font-medium text-[var(--mv-text)] hover:bg-white/15"
              >
                <FolderOpen className="h-3.5 w-3.5 text-[#0a84ff]" />
                Choose Folder...
              </button>
            </div>
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              className="font-mono-meta w-full rounded-xl border border-[var(--mv-border)] bg-black/25 px-3 py-2 text-[11px] text-[var(--mv-text)] outline-none focus:border-[#0a84ff]"
            />
            <label className="flex cursor-pointer items-center gap-2 text-[var(--mv-text-muted)]">
              <input
                type="checkbox"
                checked={autoExport}
                onChange={(e) => setAutoExport(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#0a84ff]"
              />
              Automatically save downloaded files into this folder
            </label>
          </div>

          <div className="rounded-2xl border border-[var(--mv-border)] bg-white/5 p-3.5 leading-relaxed text-[var(--mv-text-muted)]">
            <p className="font-semibold text-[var(--mv-text)]">
              Instagram / Private Links (`cookies.txt`):
            </p>
            <p className="mt-1">
              Export cookies in Netscape format using <strong>Get cookies.txt LOCALLY</strong> while logged in, then upload or paste below.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white/10 px-3.5 py-1.5 text-xs font-medium text-[var(--mv-text)] hover:bg-white/15">
              <Upload className="h-3.5 w-3.5" />
              Upload cookies.txt
              <input type="file" accept=".txt" onChange={handleFile} className="hidden" />
            </label>
            {status?.cookies_configured && (
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onSaveCookies("");
                    onClose();
                  } finally {
                    setSaving(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs text-[#ffb4ab] hover:bg-red-500/25"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove saved cookies
              </button>
            )}
          </div>

          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Optional: paste Netscape HTTP Cookie File to update cookies.txt"
            className="font-mono-meta w-full rounded-2xl border border-[var(--mv-border)] bg-black/25 p-3 text-[11px] text-[var(--mv-text)] outline-none placeholder:text-[var(--mv-text-subtle)] focus:border-[#0a84ff]"
          />
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
            disabled={saving}
            onClick={handleSaveAll}
            className="rounded-full bg-[#0a84ff] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#0a84ff]/25 hover:bg-[#3e90ff] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
