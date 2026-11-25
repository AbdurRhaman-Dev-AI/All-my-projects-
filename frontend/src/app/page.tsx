"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DownloadCloud,
  FolderCog,
  Link2,
  Loader2,
  Moon,
  Search,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import {
  clearCompletedQueue,
  deleteMediaItem,
  fetchMedia,
  fetchQueue,
  fetchSettingsStatus,
  inspectUrl,
  saveCookiesText,
  startDownload,
  updateMediaTags,
  type SettingsStatus,
} from "@/lib/api";
import type { FormatPreset, InspectResponse, MediaItem, QueueJob } from "@/lib/types";
import { CookiesModal } from "@/components/CookiesModal";
import { InspectModal } from "@/components/InspectModal";
import { MediaCard } from "@/components/MediaCard";
import { MediaLightbox } from "@/components/MediaLightbox";
import { QueueDrawer } from "@/components/QueueDrawer";

const FILTER_CHIPS = [
  { id: "all", label: "All", kind: "reset" },
  { id: "twitter", label: "X / Twitter", kind: "platform" },
  { id: "instagram", label: "Instagram", kind: "platform" },
  { id: "facebook", label: "Facebook", kind: "platform" },
  { id: "missav", label: "MissAV", kind: "platform" },
  { id: "video", label: "Videos", kind: "media_type" },
  { id: "image", label: "Images", kind: "media_type" },
] as const;

export default function HomePage() {
  const [urlInput, setUrlInput] = useState("");
  const [forceMode, setForceMode] = useState(false);
  const [forceReferer, setForceReferer] = useState("");
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspected, setInspected] = useState<InspectResponse | null>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");

  const [queue, setQueue] = useState<QueueJob[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isLight, setIsLight] = useState(false);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const prevCompletedRef = useRef<number>(0);

  const loadSettingsStatus = useCallback(async () => {
    try {
      const s = await fetchSettingsStatus();
      setSettingsStatus(s);
    } catch {
      // ignore transient error
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    try {
      const data = await fetchMedia({
        q: searchQuery,
        platform: platformFilter,
        media_type: mediaTypeFilter,
      });
      setItems(data);
    } catch {
      // Backend might be starting up
    } finally {
      setLoadingLibrary(false);
    }
  }, [searchQuery, platformFilter, mediaTypeFilter]);

  const loadQueue = useCallback(async () => {
    try {
      const jobs = await fetchQueue();
      setQueue(jobs);
      const completedCount = jobs.filter((j) => j.status === "completed").length;
      if (completedCount > prevCompletedRef.current) {
        loadLibrary();
      }
      prevCompletedRef.current = completedCount;
    } catch {
      // ignore transient polling error
    }
  }, [loadLibrary]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    loadSettingsStatus();
    loadQueue();
    const timer = setInterval(loadQueue, 1500);
    return () => clearInterval(timer);
  }, [loadQueue, loadSettingsStatus]);

  const handleInspect = useCallback(
    async (targetUrl: string, overrideForce?: boolean) => {
      const trimmed = targetUrl.trim();
      if (!trimmed) return;
      setInspecting(true);
      setInspectError(null);
      try {
        const res = await inspectUrl(trimmed, {
          forceMode: overrideForce ?? forceMode,
          referer: forceReferer.trim() || undefined,
        });
        setInspected(res);
      } catch (err) {
        setInspectError(err instanceof Error ? err.message : "Failed to inspect URL.");
      } finally {
        setInspecting(false);
      }
    },
    [forceMode, forceReferer]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;
      const pasted = e.clipboardData?.getData("text")?.trim();
      if (pasted && /^https?:\/\//i.test(pasted)) {
        setUrlInput(pasted);
        urlInputRef.current?.focus();
        handleInspect(pasted);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleInspect]);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
  };

  const handleConfirmDownload = async (
    formatId: FormatPreset,
    tags: string[],
    notes: string,
    exportDir: string,
    saveToExportDir: boolean
  ) => {
    if (!inspected) return;
    await startDownload({
      url: inspected.resolved_stream_url || inspected.url,
      format_id: formatId,
      tags,
      notes,
      creator: inspected.creator,
      caption: inspected.caption,
      thumbnail_url: inspected.thumbnail_url,
      platform: inspected.platform,
      media_type: inspected.media_type,
      export_dir: exportDir,
      save_to_export_dir: saveToExportDir,
      referer: inspected.referer || undefined,
    });
    setInspected(null);
    setUrlInput("");
    setQueueOpen(true);
    await loadQueue();
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    await deleteMediaItem(id);
  };

  const handleUpdateItem = async (id: string, tags: string[], notes: string) => {
    const updated = await updateMediaTags(id, { tags, notes });
    setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
    setSelectedItem(updated);
  };

  const activeJobsCount = queue.filter((j) =>
    ["queued", "downloading", "processing"].includes(j.status)
  ).length;

  return (
    <div className="min-h-screen pb-16">
      {/* Sticky Floating Top Bar */}
      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-8">
        <div className="liquid-glass mx-auto flex max-w-7xl flex-col gap-3 rounded-3xl p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] text-white shadow-lg shadow-[#0a84ff]/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-[var(--mv-text)]">
                  MediaVault
                </h1>
                <p className="font-mono-meta text-[10px] uppercase tracking-wider text-[var(--mv-text-subtle)]">
                  Liquid Glass Vault
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setForceMode((v) => !v)}
                className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-medium ${
                  forceMode
                    ? "border-[#5e5ce6] bg-[#5e5ce6]/25 text-white"
                    : "border-[var(--mv-border)] bg-white/5 text-[var(--mv-text)]"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Force
              </button>
              <button
                type="button"
                onClick={() => setCookiesOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white/5 text-[var(--mv-text)]"
                title="Download Folder & Cookies"
              >
                <FolderCog className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white/5 text-[var(--mv-text)]"
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setQueueOpen(true)}
                className="relative flex h-9 items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white/5 px-3 text-xs font-medium text-[var(--mv-text)]"
              >
                <DownloadCloud className="h-4 w-4 text-[#0a84ff]" />
                {activeJobsCount > 0 && (
                  <span className="font-mono-meta rounded-full bg-[#0a84ff] px-1.5 py-0.2 text-[10px] text-white">
                    {activeJobsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Floating URL Paste Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInspect(urlInput);
            }}
            className="flex flex-1 items-center gap-2 rounded-full border border-[var(--mv-border)] bg-black/20 px-4 py-1.5 lg:max-w-xl"
          >
            <Link2 className="h-4 w-4 shrink-0 text-[var(--mv-text-subtle)]" />
            <input
              ref={urlInputRef}
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={
                forceMode
                  ? "Force Download: paste webpage, .m3u8, or .mp4 URL..."
                  : "Paste X, Instagram, Facebook, MissAV, or video URL..."
              }
              className="w-full bg-transparent text-sm text-[var(--mv-text)] outline-none placeholder:text-[var(--mv-text-subtle)]"
            />
            <button
              type="submit"
              disabled={inspecting || !urlInput.trim()}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-md transition disabled:opacity-50 ${
                forceMode
                  ? "bg-[#5e5ce6] shadow-[#5e5ce6]/25 hover:bg-[#7371f0]"
                  : "bg-[#0a84ff] shadow-[#0a84ff]/25 hover:bg-[#3e90ff]"
              }`}
            >
              {inspecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {inspecting ? "Scanning" : forceMode ? "Force Inspect" : "Inspect"}
            </button>
          </form>

          {/* Desktop Right Controls */}
          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={() => setForceMode((v) => !v)}
              title="Force Download Mode: scan any page HTML for <video>/.m3u8/.mp4 streams"
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition ${
                forceMode
                  ? "border-[#5e5ce6] bg-[#5e5ce6]/25 text-white"
                  : "border-[var(--mv-border)] bg-white/5 text-[var(--mv-text)] hover:bg-white/10"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-[#c2c1ff]" />
              <span>Force Download</span>
            </button>
            <button
              type="button"
              onClick={() => setCookiesOpen(true)}
              title="Download Folder & Cookies"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white/5 px-3.5 text-xs font-medium text-[var(--mv-text)] transition hover:bg-white/10"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  settingsStatus?.cookies_configured ? "bg-[#47e266]" : "bg-amber-400"
                }`}
              />
              <FolderCog className="h-3.5 w-3.5" />
              <span>Folder & Cookies</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle Light / Dark Glass"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white/5 text-[var(--mv-text)] transition hover:bg-white/10"
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setQueueOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--mv-border)] bg-white/5 px-4 text-xs font-medium text-[var(--mv-text)] transition hover:bg-white/10"
            >
              <DownloadCloud className="h-4 w-4 text-[#0a84ff]" />
              <span>Queue</span>
              {activeJobsCount > 0 && (
                <span className="font-mono-meta rounded-full bg-[#0a84ff] px-2 py-0.5 text-[10px] font-semibold text-white">
                  {activeJobsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Force Download Section Banner */}
        {forceMode && (
          <div className="liquid-glass mx-auto mt-3 flex max-w-7xl flex-col gap-2.5 rounded-2xl border-[#5e5ce6]/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#c2c1ff]">
                <Zap className="h-3.5 w-3.5" />
                Force Download Mode Active
              </div>
              <p className="text-[11px] text-[var(--mv-text-muted)]">
                Scans webpage HTML for embedded <code>&lt;video&gt;</code>, <code>og:video</code>, or <code>.m3u8</code>/<code>.mp4</code> streams—or accepts direct stream URLs. Note: Cloudflare CAPTCHA-gated sites require a direct stream URL or session cookies.
              </p>
            </div>
            <input
              type="url"
              value={forceReferer}
              onChange={(e) => setForceReferer(e.target.value)}
              placeholder="Optional Referer URL (if stream requires page referer)..."
              className="rounded-full border border-[var(--mv-border)] bg-black/25 px-3.5 py-1.5 text-xs text-[var(--mv-text)] outline-none placeholder:text-[var(--mv-text-subtle)] focus:border-[#5e5ce6] sm:w-80"
            />
          </div>
        )}

        {inspectError && (
          <div className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-2.5 text-xs text-[#ffb4ab] backdrop-blur-md">
            <span>{inspectError}</span>
            <div className="flex items-center gap-2">
              {!forceMode && inspectError.toLowerCase().includes("force download") && (
                <button
                  type="button"
                  onClick={() => {
                    setForceMode(true);
                    handleInspect(urlInput, true);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-[#5e5ce6]/50 bg-[#5e5ce6]/30 px-3 py-1 font-semibold text-white hover:bg-[#5e5ce6]/50"
                >
                  <Zap className="h-3 w-3" />
                  Try Force Download
                </button>
              )}
              {inspectError.toLowerCase().includes("cookies") && (
                <button
                  type="button"
                  onClick={() => setCookiesOpen(true)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold text-white hover:bg-white/20"
                >
                  Open Folder & Cookies
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Filter Chips & Tag Search */}
      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_CHIPS.map((chip) => {
              const isActive =
                (chip.kind === "reset" && platformFilter === "all" && mediaTypeFilter === "all") ||
                (chip.kind === "platform" && platformFilter === chip.id) ||
                (chip.kind === "media_type" && mediaTypeFilter === chip.id);

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    if (chip.kind === "reset") {
                      setPlatformFilter("all");
                      setMediaTypeFilter("all");
                    } else if (chip.kind === "platform") {
                      setPlatformFilter((p) => (p === chip.id ? "all" : chip.id));
                    } else {
                      setMediaTypeFilter((m) => (m === chip.id ? "all" : chip.id));
                    }
                  }}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-[#0a84ff] bg-[#0a84ff]/20 text-[var(--mv-text)]"
                      : "border-[var(--mv-border)] bg-white/5 text-[var(--mv-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="liquid-glass flex items-center gap-2 rounded-full px-3.5 py-1.5 sm:w-72">
            <Search className="h-3.5 w-3.5 text-[var(--mv-text-subtle)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search captions, @creator, #tags..."
              className="w-full bg-transparent text-xs text-[var(--mv-text)] outline-none placeholder:text-[var(--mv-text-subtle)]"
            />
          </div>
        </div>

        {/* Masonry Library Grid */}
        {loadingLibrary ? (
          <div className="flex h-64 items-center justify-center text-sm text-[var(--mv-text-subtle)]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#0a84ff]" />
            Loading your MediaVault...
          </div>
        ) : items.length === 0 ? (
          <div className="liquid-glass flex flex-col items-center justify-center rounded-3xl px-6 py-20 text-center">
            <DownloadCloud className="mb-3 h-10 w-10 text-[#0a84ff] opacity-80" />
            <h2 className="text-lg font-semibold text-[var(--mv-text)]">Your MediaVault is empty</h2>
            <p className="mt-1 max-w-md text-sm text-[var(--mv-text-subtle)]">
              Paste any supported URL in the bar above—or press{" "}
              <kbd className="font-mono-meta rounded border border-[var(--mv-border)] bg-white/10 px-1.5 py-0.5 text-[11px]">
                Ctrl/Cmd + V
              </kbd>{" "}
              anywhere to inspect and save.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onOpen={setSelectedItem}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {inspected && (
        <InspectModal
          data={inspected}
          defaultFolder={settingsStatus?.download_dir || ""}
          defaultAutoExport={settingsStatus?.auto_export ?? true}
          onClose={() => setInspected(null)}
          onFolderPicked={() => loadSettingsStatus()}
          onConfirm={handleConfirmDownload}
        />
      )}

      <CookiesModal
        open={cookiesOpen}
        status={settingsStatus}
        onClose={() => setCookiesOpen(false)}
        onSaveCookies={async (txt) => {
          await saveCookiesText(txt);
          await loadSettingsStatus();
        }}
        onSettingsUpdated={loadSettingsStatus}
      />

      <QueueDrawer
        open={queueOpen}
        jobs={queue}
        onClose={() => setQueueOpen(false)}
        onClearCompleted={async () => {
          await clearCompletedQueue();
          await loadQueue();
        }}
      />

      {selectedItem && (
        <MediaLightbox
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleUpdateItem}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
