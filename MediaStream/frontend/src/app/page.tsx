"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClipboardPaste,
  Compass,
  Download,
  DownloadCloud,
  Eye,
  EyeOff,
  FolderCog,
  HardDrive,
  Layers,
  Library,
  Link2,
  Loader2,
  Moon,
  Search,
  Shield,
  ShieldOff,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import {
  clearCompletedQueue,
  deleteMediaItem,
  fetchMedia,
  fetchMediaStats,
  fetchQueue,
  fetchSettingsStatus,
  fetchSuggestions,
  inspectUrl,
  saveCookiesText,
  searchCatalog,
  startBatchDownload,
  startDownload,
  updateMediaTags,
  type SettingsStatus,
} from "@/lib/api";
import type {
  FormatPreset,
  InspectResponse,
  LibraryStats,
  MediaItem,
  QueueJob,
  SearchResultItem,
} from "@/lib/types";
import { BatchModal } from "@/components/BatchModal";
import { CookiesModal } from "@/components/CookiesModal";
import { InspectModal } from "@/components/InspectModal";
import { MediaCard } from "@/components/MediaCard";
import { MediaLightbox } from "@/components/MediaLightbox";
import { PlatformLogo } from "@/components/PlatformLogo";
import { QueueDrawer } from "@/components/QueueDrawer";
import { SearchResultCard } from "@/components/SearchResultCard";
import { StreamPlayerModal } from "@/components/StreamPlayerModal";

const SUPPORTED_SHOWCASE = [
  { platform: "youtube", domain: "youtube.com", label: "YouTube To MP4 / MP3" },
  { platform: "youtube_shorts", domain: "youtube.com", label: "YouTube Shorts" },
  { platform: "tiktok", domain: "tiktok.com", label: "TikTok Downloader" },
  { platform: "instagram", domain: "instagram.com", label: "Instagram Reels" },
  { platform: "facebook", domain: "facebook.com", label: "Facebook Video" },
  { platform: "twitter", domain: "x.com", label: "X / Twitter" },
];

type DiscoverCategory = "all" | "movie" | "tv" | "anime" | "music" | "video" | "archive" | "hentai";

const DISCOVER_CATEGORIES: { id: DiscoverCategory; label: string; adultOnly?: boolean }[] = [
  { id: "all", label: "All Sources" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "TV Shows" },
  { id: "anime", label: "Anime" },
  { id: "music", label: "Music" },
  { id: "video", label: "Videos" },
  { id: "archive", label: "Public Archive" },
  { id: "hentai", label: "Hentai 18+", adultOnly: true },
];

const QUICK_TOPICS = ["Lofi Beats", "Cyberpunk", "Attack on Titan", "Breaking Bad", "Space Documentary"];

function formatVaultBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"discover" | "library">("discover");

  // Discover & Search state
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverCategory, setDiscoverCategory] = useState<DiscoverCategory>("all");
  const [safeMode, setSafeMode] = useState(true);
  const [blurAdult, setBlurAdult] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingCatalog, setSearchingCatalog] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [watchingItem, setWatchingItem] = useState<SearchResultItem | null>(null);

  // Direct URL & Force Download state
  const [urlInput, setUrlInput] = useState("");
  const [forceMode, setForceMode] = useState(false);
  const [forceUrl, setForceUrl] = useState("");
  const [forceReferer, setForceReferer] = useState("");
  const [directDownloading, setDirectDownloading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspected, setInspected] = useState<InspectResponse | null>(null);

  // Library state
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");

  // Queue & Modals
  const [queue, setQueue] = useState<QueueJob[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
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

  const loadStats = useCallback(async () => {
    try {
      const st = await fetchMediaStats();
      setStats(st);
    } catch {
      // ignore transient error
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    try {
      const data = await fetchMedia({
        q: searchQuery || undefined,
        platform: platformFilter,
        media_type: mediaTypeFilter,
      });
      setItems(data);
    } catch {
      // ignore transient error
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
        loadStats();
      }
      prevCompletedRef.current = completedCount;
    } catch {
      // ignore transient error
    }
  }, [loadLibrary, loadStats]);

  useEffect(() => {
    loadLibrary();
    loadStats();
    loadSettingsStatus();
  }, [loadLibrary, loadStats, loadSettingsStatus]);

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 2000);
    return () => clearInterval(timer);
  }, [loadQueue]);

  // Debounced live autocomplete for Discover search
  useEffect(() => {
    const q = discoverQuery.trim();
    if (!q || q.startsWith("http://") || q.startsWith("https://")) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const list = await fetchSuggestions(q);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      }
    }, 240);
    return () => clearTimeout(handle);
  }, [discoverQuery]);

  const handleInspect = useCallback(
    async (rawUrl?: string, useForce = false, referer?: string) => {
      const target = (rawUrl ?? urlInput).trim();
      if (!target) return;
      setInspecting(true);
      setInspectError(null);
      try {
        const res = await inspectUrl(target, {
          forceMode: useForce,
          referer: referer?.trim() || undefined,
        });
        setInspected(res);
      } catch (err) {
        setInspectError(err instanceof Error ? err.message : "Failed to inspect URL.");
      } finally {
        setInspecting(false);
      }
    },
    [urlInput]
  );

  const handleDiscoverSearch = useCallback(
    async (
      overrideQuery?: string,
      overrideCat?: DiscoverCategory,
      overrideSafe?: boolean
    ) => {
      const q = (overrideQuery ?? discoverQuery).trim();

      // If user pasted a direct URL into the Discover bar, inspect it directly
      if (q && (q.startsWith("http://") || q.startsWith("https://"))) {
        setShowSuggestions(false);
        setUrlInput(q);
        await handleInspect(q, false);
        return;
      }

      const cat = overrideCat ?? discoverCategory;
      const effectiveSafe = overrideSafe ?? safeMode;
      if (overrideQuery !== undefined) setDiscoverQuery(q);
      setShowSuggestions(false);
      setDiscoverPage(1);
      setHasMoreResults(true);
      setSearchingCatalog(true);
      setSearchError(null);
      setHasSearched(true);
      try {
        const results = await searchCatalog({ q, category: cat, safeMode: effectiveSafe, page: 1 });
        setSearchResults(results);
        setHasMoreResults(results.length > 0);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        setSearchingCatalog(false);
      }
    },
    [discoverQuery, discoverCategory, safeMode, handleInspect]
  );

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreResults) return;
    const nextPage = discoverPage + 1;
    setLoadingMore(true);
    try {
      const more = await searchCatalog({
        q: discoverQuery.trim(),
        category: discoverCategory,
        safeMode,
        page: nextPage,
      });
      setDiscoverPage(nextPage);
      if (more.length === 0) {
        setHasMoreResults(false);
      } else {
        setSearchResults((prev) => {
          const seen = new Set(prev.map((p) => `${p.platform}-${p.id}`));
          const unique = more.filter((m) => !seen.has(`${m.platform}-${m.id}`));
          return [...prev, ...unique];
        });
      }
    } catch {
      // ignore transient error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreResults, discoverPage, discoverQuery, discoverCategory, safeMode]);

  // Auto-load Trending / Featured items on initial mount so sections are never empty
  useEffect(() => {
    handleDiscoverSearch("", "all", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleForceDirectDownload = async () => {
    const target = forceUrl.trim();
    if (!target) return;
    setDirectDownloading(true);
    setInspectError(null);
    try {
      await startDownload({
        url: target,
        format_id: "best_mp4",
        tags: [],
        notes: "",
        download_subtitles: false,
        save_to_export_dir: settingsStatus?.auto_export ?? true,
        export_dir: settingsStatus?.download_dir || undefined,
        force_mode: true,
        referer: forceReferer.trim() || undefined,
      });
      setForceUrl("");
      setForceReferer("");
      setForceMode(false);
      setQueueOpen(true);
      await loadQueue();
    } catch (err) {
      setInspectError(err instanceof Error ? err.message : "Force download failed.");
    } finally {
      setDirectDownloading(false);
    }
  };

  useEffect(() => {
    const onGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
        setUrlInput(text);
        handleInspect(text);
      }
    };
    window.addEventListener("paste", onGlobalPaste);
    return () => window.removeEventListener("paste", onGlobalPaste);
  }, [handleInspect]);

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const trimmed = text.trim();
        setUrlInput(trimmed);
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          handleInspect(trimmed);
        }
      }
    } catch {
      urlInputRef.current?.focus();
    }
  };

  const handleConfirmDownload = async (
    formatId: FormatPreset,
    tags: string[],
    notes: string,
    exportDir: string,
    saveToExportDir: boolean,
    downloadSubtitles: boolean
  ) => {
    if (!inspected) return;
    await startDownload({
      url: inspected.url,
      format_id: formatId,
      tags,
      notes,
      download_subtitles: downloadSubtitles,
      export_dir: exportDir || undefined,
      save_to_export_dir: saveToExportDir,
      force_mode: forceMode,
      referer: inspected.referer || undefined,
    });
    setInspected(null);
    setUrlInput("");
    setQueueOpen(true);
    await loadQueue();
    await loadSettingsStatus();
  };

  const handleBatchSubmit = async (payload: {
    urls: string[];
    format_id: FormatPreset;
    tags: string[];
    download_subtitles: boolean;
    export_dir: string;
    save_to_export_dir: boolean;
  }) => {
    await startBatchDownload(payload);
    setQueueOpen(true);
    await loadQueue();
  };

  const handleUpdateTags = async (id: string, tags: string[], notes: string) => {
    const updated = await updateMediaTags(id, { tags, notes });
    setItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
    setSelectedItem(updated);
    await loadStats();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteMediaItem(id);
    setItems((prev) => prev.filter((m) => m.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    await loadStats();
  };

  const handleClearQueue = async () => {
    await clearCompletedQueue();
    await loadQueue();
  };

  const handleSaveCookies = async (content: string) => {
    await saveCookiesText(content);
    await loadSettingsStatus();
  };

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
  };

  const activeJobsCount = queue.filter((j) =>
    ["queued", "downloading", "processing", "paused"].includes(j.status)
  ).length;

  const platformFilters = stats?.platforms ?? [];
  const totalCount = stats?.total_items ?? items.length;
  const totalSize = stats?.total_size_bytes ?? 0;

  return (
    <div className="min-h-screen pb-20">
      {/* Top Aurora Glass Header */}
      <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
        <div className="liquid-glass mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
          {/* Brand + Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="aurora-glow flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#00e5c3] to-[#06b6d4] text-[#00201a]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-[var(--mv-text)]">
                MediaStream
              </h1>
              <p className="font-mono-meta text-[10px] uppercase tracking-wider text-[var(--mv-text-subtle)]">
                AURORA EDITION · {totalCount} SAVED · {formatVaultBytes(totalSize)}
              </p>
            </div>

            <div className="ml-2 hidden items-center rounded-xl border border-[var(--mv-border)] bg-[var(--mv-surface-lowest)]/60 p-1 sm:flex">
              <button
                onClick={() => setActiveTab("discover")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === "discover"
                    ? "bg-gradient-to-r from-[#00e5c3] to-[#06b6d4] text-[#00201a] font-semibold"
                    : "text-[var(--mv-text-muted)] hover:text-[var(--mv-text)]"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                Discover
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === "library"
                    ? "bg-gradient-to-r from-[#00e5c3] to-[#06b6d4] text-[#00201a] font-semibold"
                    : "text-[var(--mv-text-muted)] hover:text-[var(--mv-text)]"
                }`}
              >
                <Library className="h-3.5 w-3.5" />
                My Library ({totalCount})
              </button>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBatchOpen(true)}
              title="Batch Download"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--mv-border)] px-3 py-2 text-xs font-medium text-[var(--mv-text-muted)] transition hover:bg-white/10"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Batch</span>
            </button>

            <button
              type="button"
              onClick={() => setForceMode((v) => !v)}
              title="Force Download / Scan Webpage"
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                forceMode
                  ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                  : "border-[var(--mv-border)] text-[var(--mv-text-muted)] hover:bg-white/10"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Force</span>
            </button>

            <button
              type="button"
              onClick={() => setCookiesOpen(true)}
              title="Folder & Cookies Settings"
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-[var(--mv-border)] px-3 py-2 text-xs font-medium text-[var(--mv-text-muted)] transition hover:bg-white/10"
            >
              <FolderCog className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Settings</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  settingsStatus?.cookies_configured ? "bg-[#45f885]" : "bg-amber-400"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Light/Dark Theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--mv-border)] text-[var(--mv-text-muted)] transition hover:bg-white/10"
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setQueueOpen(true)}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-[var(--mv-border)] px-3 py-2 text-xs font-medium text-[var(--mv-text)] transition hover:bg-white/10"
            >
              <DownloadCloud className="h-4 w-4 text-[var(--mv-primary)]" />
              <span className="hidden sm:inline">Queue</span>
              {activeJobsCount > 0 && (
                <span className="progress-bloom inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--mv-primary)] px-1.5 font-mono-meta text-[10px] font-bold text-[#00201a]">
                  {activeJobsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="mx-auto mt-2 flex max-w-7xl items-center justify-center gap-2 sm:hidden">
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
              activeTab === "discover"
                ? "bg-gradient-to-r from-[#00e5c3] to-[#06b6d4] text-[#00201a]"
                : "liquid-glass text-[var(--mv-text-muted)]"
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
              activeTab === "library"
                ? "bg-gradient-to-r from-[#00e5c3] to-[#06b6d4] text-[#00201a]"
                : "liquid-glass text-[var(--mv-text-muted)]"
            }`}
          >
            My Library ({totalCount})
          </button>
        </div>

        {/* Force Download Panel */}
        {forceMode && (
          <div className="liquid-glass mx-auto mt-2.5 max-w-7xl rounded-2xl p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
                <Zap className="h-3.5 w-3.5" />
                Force Download &amp; SPA Video Scanner
              </div>
              <span className="text-[11px] text-[var(--mv-text-subtle)]">
                Scans dynamic JS players, embedded &lt;video&gt; tags, .m3u8, or .mp4 streams
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={forceUrl}
                onChange={(e) => setForceUrl(e.target.value)}
                placeholder="https://example.com/watch/... or direct .m3u8 / .mp4"
                className="flex-1 rounded-xl border border-[var(--mv-border)] bg-[var(--mv-surface-lowest)] px-3 py-2 text-xs text-[var(--mv-text)] outline-none focus:border-cyan-400"
              />
              <input
                type="url"
                value={forceReferer}
                onChange={(e) => setForceReferer(e.target.value)}
                placeholder="Optional Referer URL..."
                className="sm:w-64 rounded-xl border border-[var(--mv-border)] bg-[var(--mv-surface-lowest)] px-3 py-2 text-xs text-[var(--mv-text)] outline-none focus:border-cyan-400"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!forceUrl.trim() || inspecting}
                  onClick={() => handleInspect(forceUrl, true, forceReferer)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-[#00201a] transition hover:brightness-110 disabled:opacity-45"
                >
                  {inspecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  Scan &amp; Pick Quality
                </button>
                <button
                  type="button"
                  disabled={!forceUrl.trim() || directDownloading}
                  onClick={handleForceDirectDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--mv-primary)] px-3.5 py-2 text-xs font-semibold text-[#00201a] transition hover:brightness-110 disabled:opacity-45"
                >
                  {directDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Go Download
                </button>
              </div>
            </div>
          </div>
        )}

        {inspectError && (
          <div className="mx-auto mt-2.5 flex max-w-7xl flex-wrap items-center justify-between gap-2 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2.5 text-xs text-[#ffb4ab]">
            <span>{inspectError}</span>
            <button
              type="button"
              onClick={() => setCookiesOpen(true)}
              className="rounded-lg border border-red-300/30 px-2.5 py-1 text-[11px] font-medium hover:bg-red-500/20"
            >
              Open Settings &amp; Cookies
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        {activeTab === "discover" ? (
          <div className="space-y-8">
            {/* Hero Discover & Search Panel */}
            <section className="liquid-glass relative overflow-visible rounded-3xl px-5 py-8 sm:px-10 sm:py-10">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--mv-primary)]/30 bg-[var(--mv-primary)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--mv-primary-soft)]">
                  <Sparkles className="h-3 w-3" />
                  Built-in Multi-Source Search, Stream &amp; Universal Downloader
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--mv-text)] sm:text-4xl">
                  Search, Watch &amp; Save{" "}
                  <span className="bg-gradient-to-r from-[#70ffe0] to-[#06b6d4] bg-clip-text text-transparent">
                    Anything
                  </span>
                </h2>
                <p className="mt-2 text-xs text-[var(--mv-text-muted)] sm:text-sm">
                  Search videos, anime, TV shows, or public-domain movies — or paste any social/video URL to download in unlimited quality.
                </p>

                {/* Hero Search Input + Live Autocomplete */}
                <div className="relative mt-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleDiscoverSearch();
                    }}
                    className="liquid-glass-elevated flex items-center gap-2 rounded-2xl p-1.5 focus-within:border-[var(--mv-primary)]/60"
                  >
                    <Search className="ml-3 h-4 w-4 shrink-0 text-[var(--mv-primary)]" />
                    <input
                      type="text"
                      value={discoverQuery}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                      onChange={(e) => {
                        setDiscoverQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      placeholder="Search videos, anime, TV shows, or paste any https:// link..."
                      className="w-full bg-transparent py-2.5 text-sm text-[var(--mv-text)] placeholder:text-[var(--mv-text-subtle)] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!discoverQuery.trim() || searchingCatalog || inspecting}
                      className="aurora-glow inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00e5c3] to-[#06b6d4] px-5 py-2.5 text-xs font-bold text-[#00201a] transition hover:brightness-110 disabled:opacity-45"
                    >
                      {searchingCatalog || inspecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Search
                    </button>
                  </form>

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="liquid-glass-elevated absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl py-1.5 text-left">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={() => handleDiscoverSearch(s)}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-[var(--mv-text)] transition hover:bg-[var(--mv-primary)]/15"
                        >
                          <Search className="h-3.5 w-3.5 text-[var(--mv-text-subtle)]" />
                          <span className="truncate">{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Tabs + Safe Mode / Blur 18+ */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {DISCOVER_CATEGORIES.filter((c) => !c.adultOnly || !safeMode).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setDiscoverCategory(cat.id);
                        handleDiscoverSearch(discoverQuery, cat.id, safeMode);
                      }}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                        discoverCategory === cat.id
                          ? "bg-[var(--mv-primary)] text-[#00201a] font-semibold"
                          : "border border-[var(--mv-border)] text-[var(--mv-text-muted)] hover:bg-white/10"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}

                  <div className="mx-1 h-4 w-px bg-[var(--mv-border)]" />

                  <button
                    type="button"
                    onClick={() => {
                      const nextSafe = !safeMode;
                      setSafeMode(nextSafe);
                      const nextCat = nextSafe && discoverCategory === "hentai" ? "all" : discoverCategory;
                      if (nextCat !== discoverCategory) setDiscoverCategory(nextCat);
                      handleDiscoverSearch(discoverQuery, nextCat, nextSafe);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      safeMode
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                        : "border-rose-400/40 bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {safeMode ? <Shield className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                    {safeMode ? "Safe Mode: ON" : "Safe Mode: 18+ Allowed"}
                  </button>

                  {!safeMode && (
                    <button
                      type="button"
                      onClick={() => setBlurAdult((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mv-border)] px-3 py-1.5 text-xs text-[var(--mv-text-muted)] hover:bg-white/10"
                    >
                      {blurAdult ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {blurAdult ? "Blur 18+: ON" : "Blur 18+: OFF"}
                    </button>
                  )}
                </div>

                {/* Quick Starter Topics */}
                {!hasSearched && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-[11px] text-[var(--mv-text-subtle)]">Try:</span>
                    {QUICK_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleDiscoverSearch(topic)}
                        className="rounded-lg border border-[var(--mv-border)] bg-white/5 px-2.5 py-1 text-[11px] text-[var(--mv-text-muted)] transition hover:border-[var(--mv-primary)]/40 hover:text-[var(--mv-text)]"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Direct URL Downloader Strip (Up Top) */}
            <section className="liquid-glass rounded-3xl p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--mv-text)]">
                    Direct Link Universal Downloader
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--mv-text-subtle)]">
                    Paste any link from YouTube, TikTok, Instagram, Facebook, X, or any site — or press{" "}
                    <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono-meta text-[10px]">Ctrl+V</kbd> anywhere.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleInspect();
                  }}
                  className="flex flex-1 max-w-2xl items-center gap-2 rounded-2xl border border-[var(--mv-border)] bg-[var(--mv-surface-lowest)]/70 p-1.5"
                >
                  <Link2 className="ml-2.5 h-4 w-4 shrink-0 text-[var(--mv-text-subtle)]" />
                  <input
                    ref={urlInputRef}
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or any media URL"
                    className="w-full bg-transparent text-xs text-[var(--mv-text)] placeholder:text-[var(--mv-text-subtle)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePasteButton}
                    className="inline-flex items-center gap-1 rounded-xl border border-[var(--mv-border)] px-2.5 py-1.5 text-xs text-[var(--mv-text-muted)] hover:bg-white/10"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Paste
                  </button>
                  <button
                    type="submit"
                    disabled={inspecting || !urlInput.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--mv-primary)] px-4 py-1.5 text-xs font-semibold text-[#00201a] transition hover:brightness-110 disabled:opacity-45"
                  >
                    {inspecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Inspect
                  </button>
                </form>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {SUPPORTED_SHOWCASE.map((item) => (
                  <div
                    key={item.platform}
                    className="flex items-center gap-2 rounded-xl border border-[var(--mv-border)] bg-[var(--mv-surface-lowest)]/45 px-3 py-2 text-[11px] font-medium text-[var(--mv-text-muted)]"
                  >
                    <PlatformLogo platform={item.platform} sourceDomain={item.domain} size={16} />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Search Results Grid */}
            {searchError && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/15 p-4 text-xs text-[#ffb4ab]">
                {searchError}
              </div>
            )}

            {searchingCatalog ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="liquid-glass h-72 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : hasSearched && searchResults.length === 0 ? (
              <div className="liquid-glass flex flex-col items-center justify-center rounded-3xl px-6 py-14 text-center">
                <Search className="mb-3 h-9 w-9 text-[var(--mv-text-subtle)]" />
                <p className="text-sm font-medium text-[var(--mv-text)]">No matches found</p>
                <p className="mt-1 text-xs text-[var(--mv-text-subtle)]">
                  Try another keyword, switch to &ldquo;All Sources&rdquo;, or paste a direct video URL above.
                </p>
              </div>
            ) : (
              searchResults.length > 0 && (
                <section className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--mv-text)]">
                      {discoverQuery.trim()
                        ? `Results for "${discoverQuery}" (${searchResults.length})`
                        : `Trending & Featured (${searchResults.length})`}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {searchResults.map((item) => (
                      <SearchResultCard
                        key={`${item.platform}-${item.id}`}
                        item={item}
                        blurAdult={blurAdult}
                        onWatch={(it) => setWatchingItem(it)}
                        onDownload={(it) => handleInspect(it.url, false)}
                      />
                    ))}
                  </div>

                  {hasMoreResults && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        disabled={loadingMore}
                        onClick={handleLoadMore}
                        className="aurora-glow inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#06e2cc] to-[#06b6d4] px-6 py-2.5 text-xs font-bold text-[#00201a] transition hover:brightness-110 disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading More...
                          </>
                        ) : (
                          "Load More Results"
                        )}
                      </button>
                    </div>
                  )}
                </section>
              )
            )}
          </div>
        ) : (
          /* MY LIBRARY TAB */
          <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "all", label: `All (${totalCount})` },
                  ...platformFilters.map((p) => ({
                    id: p.platform,
                    label: `${p.site_name} (${p.count})`,
                  })),
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setPlatformFilter(chip.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      platformFilter === chip.id
                        ? "bg-[var(--mv-primary)] text-[#00201a] font-semibold"
                        : "liquid-glass text-[var(--mv-text-muted)] hover:text-[var(--mv-text)]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}

                <div className="mx-1 h-4 w-px bg-[var(--mv-border)]" />

                {[
                  { id: "all", label: "All Types" },
                  { id: "video", label: "Videos" },
                  { id: "audio", label: "MP3 Audio" },
                  { id: "image", label: "Images" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMediaTypeFilter(t.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      mediaTypeFilter === t.id
                        ? "bg-[var(--mv-secondary)] text-[#00201a] font-semibold"
                        : "border border-[var(--mv-border)] text-[var(--mv-text-subtle)] hover:text-[var(--mv-text)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="liquid-glass flex items-center gap-2 rounded-xl px-3 py-2 lg:w-72">
                <Search className="h-3.5 w-3.5 text-[var(--mv-text-subtle)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter saved library..."
                  className="w-full bg-transparent text-xs text-[var(--mv-text)] placeholder:text-[var(--mv-text-subtle)] outline-none"
                />
              </div>
            </div>

            {loadingLibrary ? (
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="liquid-glass mb-5 h-64 animate-pulse break-inside-avoid rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="liquid-glass flex flex-col items-center justify-center rounded-3xl px-6 py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mv-primary)]/15 text-[var(--mv-primary)]">
                  <HardDrive className="h-7 w-7" />
                </div>
                <h2 className="text-base font-semibold text-[var(--mv-text)]">Your MediaStream Library is empty</h2>
                <p className="mt-1.5 max-w-md text-xs text-[var(--mv-text-muted)]">
                  Head to the Discover tab to search &amp; watch, or paste any video link to save it directly to your PC.
                </p>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="mt-5 rounded-xl bg-gradient-to-r from-[#00e5c3] to-[#06b6d4] px-4 py-2 text-xs font-semibold text-[#00201a]"
                >
                  Go to Discover
                </button>
              </div>
            ) : (
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
                {items.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onOpen={(it) => setSelectedItem(it)}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <StreamPlayerModal
        item={watchingItem}
        onClose={() => setWatchingItem(null)}
        onDownload={(it) => handleInspect(it.url, false)}
      />

      {inspected && (
        <InspectModal
          data={inspected}
          defaultFolder={settingsStatus?.download_dir || ""}
          defaultAutoExport={settingsStatus?.auto_export ?? true}
          onClose={() => setInspected(null)}
          onFolderPicked={(folder) =>
            setSettingsStatus((prev) => (prev ? { ...prev, download_dir: folder } : prev))
          }
          onViewExisting={(mediaId) => {
            const match = items.find((m) => m.id === mediaId);
            setInspected(null);
            setActiveTab("library");
            if (match) setSelectedItem(match);
          }}
          onConfirm={handleConfirmDownload}
        />
      )}

      {selectedItem && (
        <MediaLightbox
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleUpdateTags}
          onDelete={handleDeleteItem}
        />
      )}

      <QueueDrawer
        open={queueOpen}
        jobs={queue}
        onClose={() => setQueueOpen(false)}
        onClearCompleted={handleClearQueue}
        onRefreshQueue={loadQueue}
      />

      <BatchModal
        open={batchOpen}
        defaultFolder={settingsStatus?.download_dir || ""}
        defaultAutoExport={settingsStatus?.auto_export ?? true}
        onClose={() => setBatchOpen(false)}
        onSubmitBatch={handleBatchSubmit}
      />

      <CookiesModal
        open={cookiesOpen}
        status={settingsStatus}
        onClose={() => setCookiesOpen(false)}
        onSaveCookies={handleSaveCookies}
        onSettingsUpdated={loadSettingsStatus}
      />
    </div>
  );
}
