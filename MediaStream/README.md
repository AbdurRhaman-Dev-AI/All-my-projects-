# MediaStream — Search, Stream & Universal Downloader

A self-hosted, ad-free full-stack **Search, Stream & Universal Media Downloader** built with **Next.js (App Router + Tailwind CSS)**, **FastAPI**, **yt-dlp**, **gallery-dl**, **Playwright**, **FFmpeg**, and **SQLite**, featuring an **Aurora Oceanic** frosted glass UI designed in **Google Stitch**.

## Features

- **Built-In Multi-Source Search (`GET /api/search`, `GET /api/search/suggest`)**:
  - Search **Videos** (YouTube via `yt-dlp`), **Anime** (AniList + trailers), **TV Shows** (TVMaze), and **Public-Domain Movies** (Internet Archive) from one unified search bar with live autocomplete.
  - **Safe Mode & Blur 18+** toggles in the Discover bar.
  - **`In Library` Badge**: Automatically detects when a search result is already saved in your local library.
- **In-App Stream Player (`GET /api/stream`)**:
  - Watch search results directly inside MediaStream's streaming modal (YouTube embed or direct stream) with 1-click **Save to Library**.
- **Universal Downloader & Quality Picker (`POST /api/inspect`, `POST /api/download`)**:
  - Supports **2160p (4K)** down to **144p MP4**, **MP3 (320 / 256 / 128 kbps)**, **Original Images / Carousels**, and optional `.srt` / `.vtt` subtitles with unlimited file size.
  - **Force Download & Playwright SPA Scanner**: Detects dynamic JS `<video>`, `.m3u8`, and `.mp4` streams when standard extractors fail.
  - **Direct PC Folder Export & Explorer Reveal**: Saves directly to your chosen folder (default `~/Downloads/MediaStream`) with a native OS folder picker.

## Prerequisites

1. **Node.js 20+** and `npm`
2. **Python 3.12+**
3. **FFmpeg** on your system `PATH` (for merging video+audio into MP4, extracting MP3s, and video thumbnails)

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

Then open **http://localhost:3001** in your browser:

- **Frontend:** `http://localhost:3001`
- **Backend API & Docs:** `http://localhost:8001/docs`
