# MediaVault — Unified Media Downloader & Library

A self-hosted, ad-free full-stack **Unified Media Downloader & Library** built with **Next.js (App Router + Tailwind CSS)**, **FastAPI**, **yt-dlp**, **gallery-dl**, **FFmpeg**, and **SQLite**, featuring an **Apple Liquid Glass** UI designed in **Google Stitch**.

## Features
- **Smart URL Inspector (`POST /api/inspect`)**: Auto-detects X (Twitter), Instagram, Facebook, and other URLs, fetching thumbnail, creator handle, caption, media type (`video`, `image`, `carousel`), and selectable formats without downloading yet.
- **Async Background Queue (`POST /api/download`, `GET /api/queue`)**: Live progress bars, speed, ETA, and status badges (`Queued`, `Downloading`, `Processing`, `Completed`, `Failed`).
- **Format & Post-Processing**:
  - `Best MP4` / `720p MP4` (auto-merges video + audio via FFmpeg)
  - `Audio MP3` (extracts 192kbps MP3 via FFmpeg)
  - `Original Images / Carousel` (downloads full-resolution multi-image posts via `gallery-dl` into grouped items, downloadable individually or as a ZIP)
- **Media Vault & Lightbox**: Full-text search across captions, creators, and tags; platform & media-type filter chips; inline tag/note editing; keyboard paste shortcut (`Ctrl/Cmd + V` anywhere); and light/dark Apple Liquid Glass theme.

## Prerequisites
1. **Node.js 20+** and **npm**
2. **Python 3.12+**
3. **FFmpeg** on your system `PATH` (required for merging video+audio into MP4, extracting MP3s, and video thumbnails):
   - **Windows**: `winget install Gyan.FFmpeg` (or `choco install ffmpeg`)
   - **macOS**: `brew install ffmpeg`
   - **Linux (Ubuntu/Debian)**: `sudo apt install ffmpeg`
4. `yt-dlp` and `gallery-dl` are installed automatically inside `backend/.venv` from `backend/requirements.txt`.

## Optional: Private / Logged-In Content (`cookies.txt`)
To download private, age-restricted, or login-gated posts (especially on Instagram or X):
1. Export your browser cookies in Netscape format using a browser extension (e.g., *Get cookies.txt LOCALLY*).
2. Save the file as `backend/cookies.txt` (or set `COOKIES_FILE=/path/to/cookies.txt` in `backend/.env`).

## Quick Start

### Windows
```bat
start.bat
```

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

Then open **http://localhost:3000** in your browser.
- Frontend: `http://localhost:3000`
- Backend API & Docs: `http://localhost:8000/docs`
