import asyncio
import io
import platform
import shutil
import subprocess
import sys
import zipfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import find_ffmpeg_executable, settings
from app.database import get_db, init_db
from app.models import MediaItem
from app.schemas import (
    BatchDownloadRequest,
    DownloadRequest,
    InspectRequest,
    InspectResponse,
    LibraryStats,
    MediaItemOut,
    MediaUpdateRequest,
    PlatformFilterInfo,
    QueueJob,
    SearchResultItem,
    StreamResolveResponse,
)
from app.services.downloader import download_manager
from app.services.inspector import inspect_url
from app.services.search_engine import autocomplete_suggest, resolve_watch_stream, search_all


class CookiesUpdateRequest(BaseModel):
    content: str


class DownloadDirRequest(BaseModel):
    download_dir: Optional[str] = None
    auto_export: Optional[bool] = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title="MediaStream API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "MediaStream API",
        "status": "ok",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "mediastream-api"}


@app.get("/api/search", response_model=list[SearchResultItem])
async def search_media(
    q: str = Query(default=""),
    category: str = Query(default="all"),
    safe_mode: bool = Query(default=True),
    page: int = Query(default=1, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> list[SearchResultItem]:
    results = await search_all(q.strip(), category=category, safe_mode=safe_mode, page=page)
    if results:
        urls = [r.url for r in results]
        rows = (await db.execute(select(MediaItem.id, MediaItem.original_url).where(MediaItem.original_url.in_(urls)))).fetchall()
        existing_map = {orig_url: mid for mid, orig_url in rows}
        for item in results:
            if item.url in existing_map:
                item.in_library = True
                item.existing_media_id = existing_map[item.url]
    return results


@app.get("/api/search/suggest", response_model=list[str])
async def search_suggestions(q: str = Query(default="")) -> list[str]:
    return await autocomplete_suggest(q)


@app.get("/api/stream", response_model=StreamResolveResponse)
async def get_stream_url(url: str = Query(..., min_length=5)) -> StreamResolveResponse:
    return await resolve_watch_stream(url)


@app.get("/api/settings/status")
async def get_settings_status() -> dict[str, object]:
    cookies = settings.resolved_cookies_file
    ffmpeg_bin = find_ffmpeg_executable()
    user_cfg = settings.get_user_settings()
    return {
        "cookies_configured": cookies is not None,
        "cookies_path": str(settings.cookies_target_path),
        "ffmpeg_configured": ffmpeg_bin is not None,
        "ffmpeg_path": ffmpeg_bin,
        "download_dir": user_cfg["download_dir"],
        "auto_export": user_cfg["auto_export"],
    }


@app.post("/api/settings/cookies")
async def save_cookies(payload: CookiesUpdateRequest) -> dict[str, object]:
    target = settings.cookies_target_path
    content = payload.content.strip()
    if not content:
        if target.exists():
            target.unlink()
        return {"cookies_configured": False}
    target.write_text(content + "\n", encoding="utf-8")
    return {"cookies_configured": True, "cookies_path": str(target)}


@app.post("/api/settings/download-dir")
async def update_download_dir(payload: DownloadDirRequest) -> dict[str, object]:
    try:
        updated = settings.save_user_settings(
            download_dir=payload.download_dir,
            auto_export=payload.auto_export,
        )
        return updated
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid folder path: {exc}")


@app.post("/api/settings/pick-folder")
async def pick_download_folder() -> dict[str, Optional[str]]:
    current = str(settings.get_user_settings().get("download_dir") or settings.default_download_dir)
    script = (
        "import tkinter as tk; from tkinter import filedialog; "
        "r = tk.Tk(); r.withdraw(); r.attributes('-topmost', True); "
        f"p = filedialog.askdirectory(initialdir={current!r}, title='Select Download Folder for MediaStream'); "
        "print(p or ''); r.destroy()"
    )
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        "-c",
        script,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout_b, _ = await proc.communicate()
    chosen = stdout_b.decode("utf-8", errors="replace").strip()
    if not chosen:
        return {"download_dir": None}
    saved = settings.save_user_settings(download_dir=chosen)
    return {"download_dir": str(saved["download_dir"])}


@app.post("/api/inspect", response_model=InspectResponse)
async def inspect_media_url(
    payload: InspectRequest,
    db: AsyncSession = Depends(get_db),
) -> InspectResponse:
    url_str = str(payload.url)
    try:
        result = await inspect_url(
            url_str,
            force_mode=payload.force_mode,
            referer=payload.referer,
        )
        existing_stmt = select(MediaItem.id).where(MediaItem.original_url == url_str).limit(1)
        existing_id = (await db.execute(existing_stmt)).scalar_one_or_none()
        result.existing_media_id = existing_id
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/download", response_model=QueueJob)
async def enqueue_download(payload: DownloadRequest) -> QueueJob:
    return download_manager.enqueue(payload)


@app.post("/api/download/batch", response_model=list[QueueJob])
async def enqueue_batch_download(payload: BatchDownloadRequest) -> list[QueueJob]:
    return download_manager.enqueue_batch(payload)


@app.get("/api/queue", response_model=list[QueueJob])
async def get_queue() -> list[QueueJob]:
    return download_manager.list_jobs()


@app.delete("/api/queue/completed")
async def clear_completed_queue() -> dict[str, int]:
    removed = download_manager.clear_completed()
    return {"removed": removed}


@app.post("/api/queue/{job_id}/pause", response_model=QueueJob)
async def pause_queue_job(job_id: str) -> QueueJob:
    job = download_manager.pause_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Queue job not found")
    return job


@app.post("/api/queue/{job_id}/resume", response_model=QueueJob)
async def resume_queue_job(job_id: str) -> QueueJob:
    job = download_manager.resume_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Queue job not found")
    return job


@app.post("/api/queue/{job_id}/cancel", response_model=QueueJob)
async def cancel_queue_job(job_id: str) -> QueueJob:
    job = download_manager.cancel_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Queue job not found")
    return job


@app.get("/api/media/stats", response_model=LibraryStats)
async def get_media_stats(db: AsyncSession = Depends(get_db)) -> LibraryStats:
    items = list((await db.execute(select(MediaItem))).scalars().all())
    total_size = sum(i.file_size or 0 for i in items)
    counts: dict[str, PlatformFilterInfo] = {}
    for item in items:
        key = item.platform
        if key not in counts:
            counts[key] = PlatformFilterInfo(
                platform=item.platform,
                source_domain=item.source_domain or "web",
                site_name=item.site_name or item.platform.capitalize(),
                count=0,
            )
        counts[key].count += 1
    ordered = sorted(counts.values(), key=lambda x: x.count, reverse=True)
    return LibraryStats(total_items=len(items), total_size_bytes=total_size, platforms=ordered)


@app.get("/api/media", response_model=list[MediaItemOut])
async def list_media(
    q: Optional[str] = Query(default=None),
    platform: Optional[str] = Query(default=None),
    media_type: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[MediaItemOut]:
    stmt = select(MediaItem).order_by(MediaItem.created_at.desc())
    if platform and platform != "all":
        stmt = stmt.where(MediaItem.platform == platform)
    if media_type and media_type != "all":
        stmt = stmt.where(MediaItem.media_type == media_type)

    result = await db.execute(stmt)
    items = list(result.scalars().all())

    if q and q.strip():
        needle = q.strip().lower()
        items = [
            item
            for item in items
            if needle in (item.caption or "").lower()
            or needle in (item.creator or "").lower()
            or needle in (item.notes or "").lower()
            or needle in (item.site_name or "").lower()
            or needle in (item.source_domain or "").lower()
            or any(needle in t.lower() for t in (item.tags or []))
        ]

    return [MediaItemOut.model_validate(item) for item in items]


@app.patch("/api/media/{media_id}", response_model=MediaItemOut)
async def update_media(
    media_id: str,
    payload: MediaUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> MediaItemOut:
    item = await db.get(MediaItem, media_id)
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found.")

    if payload.tags is not None:
        item.tags = [t.strip() for t in payload.tags if t.strip()]
    if payload.notes is not None:
        item.notes = payload.notes.strip()

    await db.commit()
    await db.refresh(item)
    return MediaItemOut.model_validate(item)


@app.delete("/api/media/{media_id}")
async def delete_media(media_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    item = await db.get(MediaItem, media_id)
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found.")

    for rel in item.file_paths or []:
        target = (settings.storage_path / rel).resolve()
        if str(target).startswith(str(settings.storage_path.resolve())) and target.exists():
            target.unlink(missing_ok=True)

    media_folder = (settings.media_path / media_id).resolve()
    if media_folder.exists() and media_folder.is_dir():
        shutil.rmtree(media_folder, ignore_errors=True)

    if item.thumbnail_path:
        thumb = (settings.storage_path / item.thumbnail_path).resolve()
        if str(thumb).startswith(str(settings.storage_path.resolve())) and thumb.exists():
            thumb.unlink(missing_ok=True)

    await db.delete(item)
    await db.commit()
    return {"status": "deleted", "id": media_id}


@app.post("/api/media/{media_id}/reveal")
async def reveal_media_in_folder(media_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    item = await db.get(MediaItem, media_id)
    if not item or not item.file_paths:
        raise HTTPException(status_code=404, detail="Media item not found.")

    first_file = (settings.storage_path / item.file_paths[0]).resolve()
    if not first_file.exists():
        raise HTTPException(status_code=404, detail="File not found on disk.")

    sys_name = platform.system()
    if sys_name == "Windows":
        subprocess.Popen(["explorer", "/select,", str(first_file)])
    elif sys_name == "Darwin":
        subprocess.Popen(["open", "-R", str(first_file)])
    else:
        subprocess.Popen(["xdg-open", str(first_file.parent)])

    return {"status": "opened", "path": str(first_file)}


@app.get("/api/media/{media_id}/download")
async def download_media_file(
    media_id: str,
    index: Optional[int] = Query(default=None, ge=0),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(MediaItem, media_id)
    if not item or not item.file_paths:
        raise HTTPException(status_code=404, detail="Media item or files not found.")

    resolved_files: list[Path] = []
    for rel in item.file_paths:
        p = (settings.storage_path / rel).resolve()
        if str(p).startswith(str(settings.storage_path.resolve())) and p.exists():
            resolved_files.append(p)

    if not resolved_files:
        raise HTTPException(status_code=404, detail="Stored media files are missing on disk.")

    if index is not None:
        if index >= len(resolved_files):
            raise HTTPException(status_code=404, detail="File index out of range.")
        target = resolved_files[index]
        return FileResponse(path=target, filename=target.name, media_type="application/octet-stream")

    if len(resolved_files) == 1:
        target = resolved_files[0]
        return FileResponse(path=target, filename=target.name, media_type="application/octet-stream")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in resolved_files:
            zf.write(f, arcname=f.name)
    buf.seek(0)
    safe_creator = (item.creator or "mediastream").lstrip("@").replace(" ", "_")
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe_creator}-{media_id[:8]}.zip"'},
    )


@app.get("/api/storage/{filepath:path}")
async def serve_storage_file(filepath: str):
    target = (settings.storage_path / filepath).resolve()
    root = settings.storage_path.resolve()
    if not str(target).startswith(str(root)) or not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(path=target)
