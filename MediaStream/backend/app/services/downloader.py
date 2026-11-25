import asyncio
import re
import shutil
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx
import yt_dlp

from app.config import find_ffmpeg_executable, settings
from app.database import async_session_factory
from app.models import MediaItem
from app.schemas import BatchDownloadRequest, DownloadRequest, FormatPreset, MediaType, QueueJob
from app.services.inspector import _force_scan_page_media, classify_error, detect_site_info


FORMAT_SELECTORS: dict[FormatPreset, str] = {
    "best_mp4": "bv*+ba/b",
    "mp4_2160p": "bv*[height<=2160]+ba/b[height<=2160]/b",
    "mp4_1440p": "bv*[height<=1440]+ba/b[height<=1440]/b",
    "mp4_1080p": "bv*[height<=1080]+ba/b[height<=1080]/b",
    "mp4_720p": "bv*[height<=720]+ba/b[height<=720]/b",
    "mp4_480p": "bv*[height<=480]+ba/b[height<=480]/b",
    "mp4_360p": "bv*[height<=360]+ba/b[height<=360]/b",
    "mp4_240p": "bv*[height<=240]+ba/b[height<=240]/b",
    "mp4_144p": "bv*[height<=144]+ba/b[height<=144]/b",
    "audio_mp3": "ba/b",
    "audio_mp3_320": "ba/b",
    "audio_mp3_256": "ba/b",
    "audio_mp3_128": "ba/b",
    "original_images": "best",
}

AUDIO_BITRATES: dict[str, str] = {
    "audio_mp3": "192",
    "audio_mp3_320": "320",
    "audio_mp3_256": "256",
    "audio_mp3_128": "128",
}


class DownloadManager:
    def __init__(self) -> None:
        self.jobs: dict[str, QueueJob] = {}
        self._tasks: dict[str, asyncio.Task[None]] = {}

    def list_jobs(self) -> list[QueueJob]:
        return sorted(self.jobs.values(), key=lambda j: j.created_at, reverse=True)

    def clear_completed(self) -> int:
        to_remove = [jid for jid, job in self.jobs.items() if job.status in ("completed", "failed")]
        for jid in to_remove:
            self.jobs.pop(jid, None)
        return len(to_remove)

    def enqueue(self, req: DownloadRequest) -> QueueJob:
        job_id = str(uuid.uuid4())
        url_str = str(req.url)
        auto_platform, auto_domain, auto_name = detect_site_info(url_str)
        platform = req.platform or auto_platform
        source_domain = req.source_domain or auto_domain
        site_name = req.site_name or auto_name

        job = QueueJob(
            job_id=job_id,
            url=url_str,
            platform=platform,
            source_domain=source_domain,
            site_name=site_name,
            creator=req.creator or "@unknown",
            caption=req.caption or "Downloading media...",
            thumbnail_url=req.thumbnail_url,
            format_id=req.format_id,
            status="queued",
            percent=0.0,
            created_at=datetime.now(timezone.utc),
        )
        self.jobs[job_id] = job
        task = asyncio.create_task(self._process_job(job_id, req))
        self._tasks[job_id] = task
        return job

    def enqueue_batch(self, req: BatchDownloadRequest) -> list[QueueJob]:
        jobs: list[QueueJob] = []
        for url in req.urls:
            single = DownloadRequest(
                url=url,
                format_id=req.format_id,
                tags=req.tags,
                download_subtitles=req.download_subtitles,
                export_dir=req.export_dir,
                save_to_export_dir=req.save_to_export_dir,
            )
            jobs.append(self.enqueue(single))
        return jobs

    async def _save_thumbnail(
        self,
        media_id: str,
        thumbnail_url: Optional[str],
        downloaded_files: list[Path],
        media_type: MediaType,
    ) -> Optional[str]:
        thumb_dest = settings.thumbnails_path / f"{media_id}.jpg"

        if media_type in ("image", "carousel") and downloaded_files:
            first_img = downloaded_files[0]
            if first_img.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                ext_dest = settings.thumbnails_path / f"{media_id}{first_img.suffix.lower()}"
                shutil.copy2(first_img, ext_dest)
                return f"thumbnails/{ext_dest.name}"

        if thumbnail_url:
            try:
                async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
                    resp = await client.get(thumbnail_url)
                    if resp.status_code == 200 and resp.content:
                        thumb_dest.write_bytes(resp.content)
                        return f"thumbnails/{thumb_dest.name}"
            except Exception:
                pass

        ffmpeg_bin = find_ffmpeg_executable()
        if ffmpeg_bin and downloaded_files:
            video_file = next(
                (f for f in downloaded_files if f.suffix.lower() in (".mp4", ".mov", ".webm", ".mkv")),
                None,
            )
            if video_file:
                proc = await asyncio.create_subprocess_exec(
                    ffmpeg_bin, "-y", "-i", str(video_file), "-ss", "00:00:01", "-vframes", "1", str(thumb_dest),
                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.DEVNULL,
                )
                await proc.wait()
                if thumb_dest.exists():
                    return f"thumbnails/{thumb_dest.name}"

        return None

    def _export_to_folder(
        self,
        files: list[Path],
        export_dir_str: str,
        creator: str,
        media_id: str,
    ) -> list[str]:
        dest_root = Path(export_dir_str).expanduser().resolve()
        dest_root.mkdir(parents=True, exist_ok=True)
        exported: list[str] = []

        media_only = [f for f in files if f.suffix.lower() not in (".srt", ".vtt")]
        if len(media_only) > 1:
            safe_creator = re.sub(r"[^a-zA-Z0-9._-]", "_", creator.lstrip("@") or "media")
            target_folder = dest_root / f"{safe_creator}_{media_id[:8]}"
            target_folder.mkdir(parents=True, exist_ok=True)
        else:
            target_folder = dest_root

        for src in files:
            dest_file = target_folder / src.name
            if dest_file.exists():
                dest_file = target_folder / f"{src.stem}_{media_id[:6]}{src.suffix}"
            shutil.copy2(src, dest_file)
            exported.append(str(dest_file))
        return exported

    async def _download_with_gallery_dl(self, url: str, target_dir: Path) -> list[Path]:
        cmd = [sys.executable, "-m", "gallery_dl", "--directory", str(target_dir), "--no-mtime"]
        cookies = settings.resolved_cookies_file
        if cookies:
            cmd.extend(["--cookies", str(cookies)])
        elif settings.cookies_from_browser:
            cmd.extend(["--cookies-from-browser", settings.cookies_from_browser])
        cmd.append(url)

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr_b = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(classify_error(stderr_b.decode("utf-8", errors="replace")))

        files = [p for p in sorted(target_dir.rglob("*")) if p.is_file()]
        if not files:
            raise RuntimeError("No image files were downloaded.")
        return files

    def _run_ytdlp_sync(
        self,
        url: str,
        target_dir: Path,
        format_id: FormatPreset,
        download_subtitles: bool,
        referer: Optional[str],
        job: QueueJob,
        loop: asyncio.AbstractEventLoop,
    ) -> tuple[dict[str, Any], list[Path]]:
        def progress_hook(d: dict[str, Any]) -> None:
            status = d.get("status")
            if status == "downloading":
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded = d.get("downloaded_bytes") or 0
                pct = round((downloaded / total) * 100, 1) if total > 0 else job.percent
                speed = d.get("_speed_str", "").strip() or None
                eta = d.get("_eta_str", "").strip() or None

                def _update() -> None:
                    job.status = "downloading"
                    job.percent = min(pct, 99.0)
                    job.speed = speed
                    job.eta = eta

                loop.call_soon_threadsafe(_update)
            elif status == "finished":
                def _processing() -> None:
                    job.status = "processing"
                    job.percent = 99.0
                    job.speed = None
                    job.eta = None

                loop.call_soon_threadsafe(_processing)

        # Build a Windows-MAX_PATH-safe filename stem (<= 55 chars) from caption or fallback
        raw_stem = re.sub(r"[^a-zA-Z0-9._-]+", "_", (job.caption or "media").strip()).strip("._-")
        if not raw_stem or raw_stem.lower().startswith("downloading"):
            raw_stem = "media"
        safe_stem = f"{raw_stem[:44]}_{job.job_id[:8]}"

        ydl_opts: dict[str, Any] = {
            "outtmpl": str(target_dir / f"{safe_stem}.%(ext)s"),
            "restrictfilenames": True,
            "noplaylist": False,
            "quiet": True,
            "no_warnings": True,
            "progress_hooks": [progress_hook],
            "format": FORMAT_SELECTORS.get(format_id, "bv*+ba/b"),
            "format_sort": ["res", "fps"],
        }

        if referer:
            ydl_opts["http_headers"] = {"Referer": referer}

        ffmpeg_bin = find_ffmpeg_executable()
        if ffmpeg_bin:
            ydl_opts["ffmpeg_location"] = str(Path(ffmpeg_bin).parent)

        cookies = settings.resolved_cookies_file
        if cookies:
            ydl_opts["cookiefile"] = str(cookies)
        elif settings.cookies_from_browser:
            ydl_opts["cookiesfrombrowser"] = (settings.cookies_from_browser,)

        if format_id in AUDIO_BITRATES:
            ydl_opts["postprocessors"] = [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": AUDIO_BITRATES[format_id],
                }
            ]
        elif format_id != "original_images":
            ydl_opts["merge_output_format"] = "mp4"
            if download_subtitles:
                ydl_opts["writesubtitles"] = True
                ydl_opts["writeautomaticsub"] = True
                ydl_opts["subtitleslangs"] = ["en.*", "en"]
                ydl_opts["subtitlesformat"] = "srt/vtt/best"

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

        actual_files = [p for p in sorted(target_dir.iterdir()) if p.is_file()]
        return info or {}, actual_files

    async def _process_job(self, job_id: str, req: DownloadRequest) -> None:
        job = self.jobs[job_id]
        media_id = str(uuid.uuid4())
        target_dir = settings.media_path / media_id
        target_dir.mkdir(parents=True, exist_ok=True)
        loop = asyncio.get_running_loop()

        try:
            job.status = "downloading"
            download_url = job.url
            effective_referer = req.referer
            if req.force_mode:
                try:
                    resolved = await _force_scan_page_media(job.url, referer=req.referer)
                    download_url = resolved.resolved_stream_url or resolved.url
                    effective_referer = resolved.referer or req.referer
                    if resolved.caption:
                        job.caption = resolved.caption[:200]
                    if resolved.thumbnail_url:
                        job.thumbnail_url = resolved.thumbnail_url
                    if resolved.creator:
                        job.creator = resolved.creator
                except Exception:
                    pass

            info: dict[str, Any] = {}
            files: list[Path] = []

            if req.format_id == "original_images" or req.media_type in ("image", "carousel"):
                try:
                    files = await self._download_with_gallery_dl(download_url, target_dir)
                except Exception:
                    info, files = await asyncio.to_thread(
                        self._run_ytdlp_sync,
                        download_url,
                        target_dir,
                        req.format_id,
                        req.download_subtitles,
                        effective_referer,
                        job,
                        loop,
                    )
            else:
                info, files = await asyncio.to_thread(
                    self._run_ytdlp_sync,
                    download_url,
                    target_dir,
                    req.format_id,
                    req.download_subtitles,
                    effective_referer,
                    job,
                    loop,
                )

            if not files:
                raise RuntimeError("Download finished but no output files were produced.")

            job.status = "processing"
            job.percent = 99.5

            media_files = [f for f in files if f.suffix.lower() not in (".srt", ".vtt")]
            if not media_files:
                media_files = files

            final_media_type: MediaType
            if req.format_id in AUDIO_BITRATES:
                final_media_type = "audio"
            elif len(media_files) > 1 and all(f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") for f in media_files):
                final_media_type = "carousel"
            elif all(f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") for f in media_files):
                final_media_type = "image"
            else:
                final_media_type = "video"

            thumb_rel = await self._save_thumbnail(
                media_id,
                req.thumbnail_url or info.get("thumbnail"),
                media_files,
                final_media_type,
            )

            # Put main media files first, subtitle files after
            ordered_files = [*media_files, *[f for f in files if f not in media_files]]
            rel_paths = [f"media/{f.relative_to(settings.media_path).as_posix()}" for f in ordered_files]
            total_size = sum(f.stat().st_size for f in ordered_files if f.exists())

            w = info.get("width")
            h = info.get("height")
            resolution = f"{w}x{h}" if w and h else None
            duration = int(info["duration"]) if info.get("duration") else None

            creator = req.creator or (f"@{info['uploader_id']}" if info.get("uploader_id") else "@unknown")
            caption = req.caption or info.get("description") or info.get("title") or "Saved Media"

            # Update job metadata if queued via batch without prior inspect
            job.creator = creator[:255]
            job.caption = caption[:200]
            if not job.thumbnail_url and info.get("thumbnail"):
                job.thumbnail_url = info.get("thumbnail")

            user_cfg = settings.get_user_settings()
            should_export = req.save_to_export_dir if req.export_dir is not None else bool(user_cfg.get("auto_export", True))
            export_dest = req.export_dir or str(user_cfg.get("download_dir") or settings.default_download_dir)
            exported_paths: list[str] = []
            if should_export and export_dest:
                exported_paths = await asyncio.to_thread(
                    self._export_to_folder, ordered_files, export_dest, creator, media_id
                )

            async with async_session_factory() as db:
                item = MediaItem(
                    id=media_id,
                    platform=job.platform,
                    source_domain=job.source_domain,
                    site_name=job.site_name,
                    original_url=job.url,
                    creator=creator[:255],
                    caption=caption[:2000],
                    media_type=final_media_type,
                    file_paths=rel_paths,
                    thumbnail_path=thumb_rel,
                    file_size=total_size,
                    resolution=resolution,
                    duration=duration,
                    tags=[t.strip() for t in req.tags if t.strip()],
                    notes=req.notes.strip(),
                )
                db.add(item)
                await db.commit()

            job.status = "completed"
            job.percent = 100.0
            job.media_id = media_id
            job.exported_paths = exported_paths
            job.speed = None
            job.eta = None

        except Exception as exc:
            shutil.rmtree(target_dir, ignore_errors=True)
            job.status = "failed"
            job.error = classify_error(str(exc))
            job.speed = None
            job.eta = None


download_manager = DownloadManager()
