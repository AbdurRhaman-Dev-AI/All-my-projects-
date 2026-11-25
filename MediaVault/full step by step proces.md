# Full Step-by-Step Process — MediaVault (Unified Media Downloader & Library)

This document records the complete, end-to-end process used to design, build, fix, and verify **MediaVault** inside `d:\project files\MCP server\downloder laibary\`.

---

## Step 1: Google Stitch MCP Setup & UI Design Generation
1. Connected Antigravity to **Google Stitch MCP** (`https://stitch.googleapis.com/mcp`) using `X-Goog-Api-Key` in `C:\Users\rafer\.gemini\config\mcp_config.json`.
2. Created a new Stitch project named **MediaVault** (`projects/16578747289573414516`).
3. Generated 3 desktop UI screens in Stitch with an **Apple Liquid Glass** aesthetic (`assets/3ee8248ba3dd415f918297c26c613649`):
   - **Main Library Dashboard** (`screens/38a8721f6a83435c807e58ef321542ec`): Floating top link-paste bar, platform/media-type filter chips, tag search, masonry media grid, and Queue/Theme/Cookies controls.
   - **URL Preview & Format Picker Modal** (`screens/bbcc59e6b85740338a9abb5a9026bf50`): Post thumbnail preview, creator handle, caption preview, quality selector (`Best MP4`, `720p MP4`, `Audio MP3`, `Original Images / Carousel`), and custom tag chips.
   - **Active Download Queue Drawer** (`screens/f69eb578e6994c0aab63b11865215ceb`): Real-time progress bars, speed/percentage/ETA telemetry, and status badges (`Queued`, `Downloading`, `Processing`, `Completed`, `Failed`).
4. Extracted the Stitch design system manifest, palette (`#131317`, `#0a84ff`, `#5e5ce6`, `#30d158`), `Inter` + `JetBrains Mono` typography, and frosted glass surface specifications into [`DESIGN.md`](./DESIGN.md).

---

## Step 2: Project Architecture & Storage Layout
Created a monorepo under `downloder laibary/`:
- `frontend/` — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- `backend/` — Python 3.13 + FastAPI, `yt-dlp[default,curl-cffi]`, `gallery-dl`, `SQLAlchemy` (`aiosqlite`), `httpx`, and `pydantic-settings`.
- `storage/` — Local `storage/media/` and `storage/thumbnails/` directories plus `storage/mediavault.db` (SQLite), safely served through FastAPI endpoints.

---

## Step 3: Backend Implementation (`backend/`)
1. **Configuration & FFmpeg Resolution (`backend/app/config.py`)**:
   - Loaded `.env` settings (`PORT`, `CORS_ORIGINS`, `COOKIES_FILE`, `COOKIES_FROM_BROWSER`, `STORAGE_DIR`).
   - Added `find_ffmpeg_executable()` to locate `ffmpeg.exe` via `PATH` as well as WinGet package locations so FFmpeg works even before a shell restart.
2. **Database & Schemas (`backend/app/database.py`, `backend/app/models.py`, `backend/app/schemas.py`)**:
   - Defined `MediaItem` SQLite table (`id`, `platform`, `original_url`, `creator`, `caption`, `media_type`, `file_paths`, `thumbnail_path`, `file_size`, `resolution`, `duration`, `tags`, `notes`, `created_at`).
3. **Smart URL Inspector (`backend/app/services/inspector.py`)**:
   - Implemented `detect_platform(url)` for `twitter`, `instagram`, `facebook`, and `other`.
   - Inspected URLs using `[sys.executable, "-m", "yt_dlp", "--dump-single-json", ...]` (and `--impersonate chrome` fallback), falling back to `[sys.executable, "-m", "gallery_dl", "--dump-json", ...]` for photo/carousel posts.
   - Mapped platform/auth/rate-limit/404 errors into clear, actionable messages via `classify_error()`.
4. **Async Download Queue (`backend/app/services/downloader.py`)**:
   - Built `DownloadManager` with async background tasks (`asyncio.create_task` + `asyncio.to_thread`) and live `yt-dlp` progress hooks (`queued`, `downloading`, `processing`, `completed`, `failed`).
   - Configured `Best MP4` (`bv*+ba/b` merged via FFmpeg), `720p MP4`, `Audio MP3` (`FFmpegExtractAudio` at 192kbps), and `Original Images / Carousel` (`gallery-dl` grouped under `storage/media/{id}/`).
   - Saved local thumbnails in `storage/thumbnails/` (copied image, downloaded thumbnail URL, or extracted video frame via FFmpeg).
5. **FastAPI Endpoints (`backend/app/main.py`)**:
   - `GET /api/health`
   - `GET /api/settings/status` and `POST /api/settings/cookies`
   - `POST /api/inspect`
   - `POST /api/download`, `GET /api/queue`, `DELETE /api/queue/completed`
   - `GET /api/media` (with full-text search `q`, `platform`, and `media_type` filters)
   - `PATCH /api/media/{id}` and `DELETE /api/media/{id}`
   - `GET /api/media/{id}/download` (single file or on-the-fly ZIP archive for multi-image carousels)
   - `GET /api/storage/{filepath}` (path-traversal-safe media/thumbnail serving)

---

## Step 4: Frontend Implementation (`frontend/`)
1. Configured `Inter` and `JetBrains Mono` fonts (`src/app/layout.tsx`) and Apple Liquid Glass CSS variables + dark/light themes (`src/app/globals.css`).
2. Built typed API helpers (`src/lib/api.ts`, `src/lib/types.ts`).
3. Created UI components matching Stitch:
   - `src/components/PlatformBadge.tsx`
   - `src/components/MediaCard.tsx`
   - `src/components/InspectModal.tsx`
   - `src/components/QueueDrawer.tsx`
   - `src/components/MediaLightbox.tsx` (in-app video/audio/image/carousel viewer + tag/note editor)
   - `src/components/CookiesModal.tsx` (displays FFmpeg & `cookies.txt` status and lets you upload/paste Netscape cookies directly in the UI)
4. Wired `src/app/page.tsx` with global `Ctrl/Cmd + V` paste-to-inspect shortcut, live queue polling (1.5s), optimistic deletions, and masonry layout.

---

## Step 5: Troubleshooting & Fixes Performed
1. **Startup Script Path Quoting (`start.bat`)**:
   - Fixed nested double-quote issues for Windows folder paths containing spaces by switching to `start "Title" /D "%~dp0backend" cmd /k ...`.
2. **Fixing `[WinError 2] The system cannot find the file specified`**:
   - **Root cause:** `shutil.which("yt-dlp")` and `shutil.which("gallery-dl")` failed when `uvicorn` ran directly from `.venv\Scripts\uvicorn.exe` without `.venv\Scripts` on `PATH`, and `ffmpeg` was not yet installed on the machine.
   - **Fix 1:** Updated `inspector.py` and `downloader.py` to invoke `[sys.executable, "-m", "yt_dlp", ...]` and `[sys.executable, "-m", "gallery_dl", ...]` so they always run inside the active Python virtual environment.
   - **Fix 2:** Installed **FFmpeg 9.1** (`Gyan.FFmpeg`) via `winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements` and wired `find_ffmpeg_executable()` into `yt_dlp` (`ffmpeg_location`) and thumbnail generation.
3. **Instagram Authentication / `401 Unauthorized` Handling**:
   - Verified with `yt-dlp` and `gallery-dl` that Instagram Reels return `empty media response` / `401 Unauthorized` without session cookies.
   - Updated `gallery-dl` error detection (checking `entry[0] == -1`) so auth errors surface cleanly instead of returning empty metadata.
   - Added the **Cookies** modal in the header (`POST /api/settings/cookies`) so you can paste or upload a Netscape `cookies.txt` exported from your logged-in browser without manually editing config files.

---

## Step 6: Dependencies, Build & Verification
1. Created Python virtual environment (`backend/.venv`) and installed `backend/requirements.txt` (`fastapi`, `uvicorn`, `sqlalchemy`, `aiosqlite`, `yt-dlp[default,curl-cffi]`, `gallery-dl`, `httpx`, `pydantic-settings`).
2. Installed frontend npm dependencies (`npm install` in `frontend/`).
3. Ran `npm run typecheck` (`tsc --noEmit`) and `npm run build` (`next build`) with zero errors.
4. Verified FastAPI backend endpoints (`/api/health`, `/api/settings/status`, `/api/inspect`, `/api/media`, `/api/queue`) and launched both servers:
   - Backend: `http://localhost:8000` (API docs at `http://localhost:8000/docs`)
   - Frontend: `http://localhost:3000`

---

## Step 7: Custom Download Folder Picker, Auto-Export & Explorer Reveal
1. **Default PC Download Folder (`backend/app/config.py`)**:
   - Added persistent `storage/user_settings.json` defaulting to `~/Downloads/MediaVault` (`C:\Users\<user>\Downloads\MediaVault`) with `auto_export: true`.
2. **Native Windows Folder Picker & Settings Endpoints (`backend/app/main.py`)**:
   - `POST /api/settings/pick-folder` opens a native OS folder selection dialog via `tkinter.filedialog.askdirectory`.
   - `POST /api/settings/download-dir` persists custom download paths and auto-export preferences.
   - `POST /api/media/{id}/reveal` opens Windows Explorer (`explorer /select,<file>`) directly to the downloaded media file.
3. **Auto-Export on Download (`backend/app/services/downloader.py`)**:
   - Automatically exports completed videos, MP3s, and image carousels directly to the user's selected PC folder in addition to storing them in the MediaVault library.
4. **Frontend Controls**:
   - Added **Save file directly to PC folder** + **Choose Folder...** inside `InspectModal` and `Folder & Cookies` settings.
   - Added **Download to Browser** and **Open Folder** buttons directly inside `QueueDrawer`, `MediaCard`, and `MediaLightbox`.

---

## Step 8: Multi-Resolution File Sizes (`4K`, `2K`, `1080p`, `720p`, `480p`), MissAV Chip & Force Download Mode
1. **Per-Resolution Options & File Size Estimation (`backend/app/services/inspector.py` & `downloader.py`)**:
   - Dynamically inspects available stream tiers (`4K UHD 2160p`, `2K QHD 1440p`, `Full HD 1080p`, `HD 720p`, `SD 480p`, `Best MP4`, `Audio MP3`) and calculates estimated download file sizes (`filesize` / `filesize_approx` / `tbr * duration`) for each option.
   - Displays exact resolution pills and file size badges (e.g., `~1.3 GB`, `~309.0 MB`, `~128.4 MB`) inside `InspectModal`.
2. **Force Download Mode & MissAV Platform Filter (`frontend/src/app/page.tsx`, `PlatformBadge.tsx`)**:
   - Added a dedicated **Force Download** mode (plus optional custom `Referer` URL) that scans webpage HTML for embedded `<video>`, `<source>`, `og:video`, or `.m3u8`/`.mp4` streams and supports direct stream URLs.
   - Added `MissAV` platform detection & filter chip (`missav`), and clean detection of Cloudflare anti-bot challenges (`cf-mitigated`) with guidance to use a direct `.m3u8`/`.mp4` stream URL or exported browser cookies when a page is challenge-gated.

---

## Step 9: Website Logos, Dynamic Site Filters, Full Quality Table, Paste, Batch, Subtitles & Vault Counter
1. **Unlimited Size Quality Table & File-Size Probing (`backend/app/services/inspector.py`, `InspectModal.tsx`)**:
   - Expanded quality presets to include **Video (`2160p 4K`, `1440p 2K`, `1080p FHD`, `720p HD`, `480p`, `360p`, `240p`, `144p`, `Best MP4`)** and **Audio (`MP3 320 kbps`, `256 kbps`, `128 kbps`)** with zero file-size cap and instant 1-click **Download** buttons per row.
   - Added parallel `HEAD` `Content-Length` probing when platforms omit `filesize`/`tbr` in JSON metadata.
2. **Website Logos & Auto-Updating Platform Filter List (`PlatformLogo.tsx`, `database.py`, `main.py`)**:
   - Added `source_domain` and `site_name` columns to SQLite (`MediaItem`) with automatic schema migration and backfill on startup.
   - Rendered crisp SVG brand logos for YouTube, YouTube Shorts, TikTok, Instagram, Facebook, X/Twitter, Reddit, and Vimeo plus automatic favicon loading for any other website.
   - Added `GET /api/media/stats` so every new website downloaded automatically appears in the filter bar with its logo and count, alongside a total vault size counter (`items · MB/GB`).
3. **One-Click Paste, Batch Queue, Subtitles & Duplicate Detection**:
   - Added a **Paste** button next to **Download** in the top bar (`navigator.clipboard.readText()`).
   - Added `POST /api/download/batch` + `BatchModal.tsx` for multi-URL queueing.
   - Added `.srt` / `.vtt` subtitle downloading (`download_subtitles`) and duplicate URL detection (`existing_media_id`) inside `InspectModal`.
4. **GitHub Auto-Commit Policy (`AGENTS.md`, `.gitignore`)**:
   - Configured repository tracking to `https://github.com/AbdurRhaman-Dev-AI/All-my-projects-.git` (`main`) with automatic commits on every change.

---

## Step 10: Playwright JS SPA Extraction, Windows Path Safety & True Resolution Probing
1. **Playwright Force Download Scanner (`backend/app/services/inspector.py`)**:
   - Added `_playwright_scan_media()` to render non-challenged JS SPA pages (like `hanime.tv`) in headless Chrome/Edge, filter out ad CDNs, load user-provided `cookies.txt`, select the highest unlocked quality when available, and capture dynamic `application/x-mpegurl` / `.mp4` streams.
   - Added `_probe_stream_resolution()` via `ffprobe -allowed_extensions ALL` so single-resolution HLS streams report their exact resolution (`720p`, `1080p`, etc.) instead of assuming `1080p`.
2. **Windows `MAX_PATH` & `FFmpeg` `PATH` Fixes (`backend/app/services/downloader.py`, `config.py`)**:
   - Shortened `outtmpl` stems (`{caption[:44]}_{job_id[:8]}.%(ext)s`) so long HLS tokens never exceed Windows' 260-character path limit.
   - Resolved real `Gyan.FFmpeg*/**/bin` path and injected it into `os.environ["PATH"]` on startup, plus added `"format_sort": ["res", "fps"]` to prioritize highest resolution first.
