import asyncio
import html
import json
import re
import sys
from typing import Any, Optional
from urllib.parse import urljoin, urlparse

import httpx

from app.config import settings
from app.schemas import FormatOption, FormatPreset, InspectResponse, MediaType, PlatformType


def detect_platform(url: str) -> PlatformType:
    host = (urlparse(url).hostname or "").lower()
    if any(d in host for d in ("twitter.com", "x.com", "t.co", "fxtwitter.com", "vxtwitter.com")):
        return "twitter"
    if "instagram.com" in host or "instagr.am" in host:
        return "instagram"
    if any(d in host for d in ("facebook.com", "fb.watch", "fb.com", "m.facebook.com")):
        return "facebook"
    if "missav" in host:
        return "missav"
    return "other"


def format_bytes(num_bytes: Optional[int]) -> Optional[str]:
    if not num_bytes or num_bytes <= 0:
        return None
    units = ["B", "KB", "MB", "GB"]
    val = float(num_bytes)
    idx = 0
    while val >= 1024.0 and idx < len(units) - 1:
        val /= 1024.0
        idx += 1
    if idx == 0:
        return f"{int(val)} B"
    return f"~{val:.1f} {units[idx]}"


def classify_error(raw_error: str) -> str:
    msg = raw_error.strip()
    lower = msg.lower()
    if any(
        k in lower
        for k in (
            "cf-mitigated",
            "just a moment",
            "turnstile",
            "captcha",
            "verify you are human",
            "cloudflare",
            "anti-bot",
            "challenge-platform",
        )
    ):
        return (
            "This site or CDN is protected by a Cloudflare anti-bot / CAPTCHA challenge. "
            "MediaVault cannot bypass anti-bot challenges automatically."
        )
    if any(
        k in lower
        for k in (
            "login",
            "logged in",
            "logged-in",
            "cookies",
            "authentication",
            "private",
            "sign in",
            "checkpoint",
            "age-restricted",
            "empty media response",
            "401 unauthorized",
        )
    ):
        return (
            "This platform requires authentication/cookies for this post. "
            "Click 'Folder & Cookies' in the top bar to paste your Netscape cookies.txt, then click Inspect again."
        )
    if any(k in lower for k in ("404", "not found", "does not exist", "deleted", "unavailable", "removed")):
        return "This post could not be found. It may have been deleted or the URL is invalid."
    if any(k in lower for k in ("429", "rate limit", "too many requests")):
        return "Rate-limited by the platform. Wait a moment and try again, or add cookies.txt."
    if "unsupported url" in lower:
        return "Unsupported URL for standard extractors. Try switching to Force Download mode if the page embeds a direct video or .m3u8 stream."
    first_line = next(
        (line for line in msg.splitlines() if "error:" in line.lower()),
        msg.splitlines()[-1] if msg else "Inspection failed.",
    )
    return re.sub(r"^ERROR:\s*", "", first_line, flags=re.IGNORECASE).strip()


async def _run_cli_json(cmd: list[str], timeout: int = 35) -> tuple[int, str, str]:
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        raise RuntimeError("Timed out while inspecting the URL. Please try again.")
    return proc.returncode or 0, stdout_b.decode("utf-8", errors="replace"), stderr_b.decode("utf-8", errors="replace")


def _extract_creator(info: dict[str, Any]) -> str:
    for key in ("uploader_id", "channel", "uploader", "creator", "author", "username"):
        val = info.get(key)
        if isinstance(val, str) and val.strip():
            cleaned = val.strip()
            return cleaned if cleaned.startswith("@") else f"@{cleaned}"
    return "@unknown"


def _extract_caption(info: dict[str, Any]) -> str:
    for key in ("description", "title", "fulltitle", "content"):
        val = info.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()[:500]
    return "Untitled Media"


def _extract_resolution(info: dict[str, Any]) -> Optional[str]:
    w = info.get("width")
    h = info.get("height")
    if w and h:
        return f"{w}x{h}"
    res = info.get("resolution")
    if isinstance(res, str) and res.strip():
        return res.strip()
    return None


def _estimate_stream_bytes(fmt: dict[str, Any], duration: Optional[float]) -> Optional[int]:
    fs = fmt.get("filesize") or fmt.get("filesize_approx")
    if isinstance(fs, (int, float)) and fs > 0:
        return int(fs)
    tbr = fmt.get("tbr")
    if isinstance(tbr, (int, float)) and tbr > 0 and duration and duration > 0:
        return int((tbr * 1000.0 / 8.0) * duration)
    return None


def _build_formats_from_info(media_type: MediaType, info: Optional[dict[str, Any]] = None) -> list[FormatOption]:
    if media_type in ("image", "carousel"):
        return [
            FormatOption(
                id="original_images",
                label="Original Images / Carousel",
                description="Full-resolution photos saved as a grouped item",
                resolution_tag="ORIG",
                available=True,
            ),
        ]

    raw_formats = (info or {}).get("formats") or []
    duration_val = (info or {}).get("duration")
    duration = float(duration_val) if isinstance(duration_val, (int, float)) and duration_val > 0 else None

    # Best audio size for accurate muxed estimate
    audio_sizes: list[int] = []
    for f in raw_formats:
        if not isinstance(f, dict):
            continue
        if f.get("acodec") not in (None, "none") and f.get("vcodec") in (None, "none"):
            sz = _estimate_stream_bytes(f, duration)
            if sz:
                audio_sizes.append(sz)
    best_audio_bytes = max(audio_sizes) if audio_sizes else None

    # Inspect video streams per resolution tier
    tiers: list[tuple[FormatPreset, str, str, str, int, int]] = [
        ("mp4_2160p", "4K UHD (2160p)", "Ultra HD video + audio merged to MP4", "4K", 2160, 99999),
        ("mp4_1440p", "2K QHD (1440p)", "2K video + audio merged to MP4", "2K", 1440, 2159),
        ("mp4_1080p", "Full HD (1080p)", "1080p video + audio merged to MP4", "1080p", 1080, 1439),
        ("mp4_720p", "HD (720p)", "Balanced 720p MP4 for faster downloads", "720p", 720, 1079),
        ("mp4_480p", "SD (480p)", "Compact 480p MP4 for smaller file size", "480p", 480, 719),
    ]

    options: list[FormatOption] = []
    max_height_seen = 0
    best_total_bytes: Optional[int] = None

    for f in raw_formats:
        if isinstance(f, dict) and isinstance(f.get("height"), (int, float)):
            max_height_seen = max(max_height_seen, int(f["height"]))

    for preset_id, label, desc, tag, min_h, max_h in tiers:
        matching = [
            f
            for f in raw_formats
            if isinstance(f, dict)
            and isinstance(f.get("height"), (int, float))
            and min_h <= int(f["height"]) <= max_h
            and f.get("vcodec") not in ("none",)
        ]
        if not matching:
            continue

        # Prefer mp4/avc1 or highest estimated size for realistic ceiling
        sizes: list[int] = []
        for m in matching:
            v_sz = _estimate_stream_bytes(m, duration)
            if v_sz:
                has_audio = m.get("acodec") not in (None, "none")
                total = v_sz if has_audio else v_sz + (best_audio_bytes or 0)
                sizes.append(total)

        est_bytes = max(sizes) if sizes else None
        if est_bytes and (best_total_bytes is None or est_bytes > best_total_bytes):
            best_total_bytes = est_bytes

        options.append(
            FormatOption(
                id=preset_id,
                label=label,
                description=desc,
                resolution_tag=tag,
                estimated_size_bytes=est_bytes,
                estimated_size_label=format_bytes(est_bytes),
                available=True,
            )
        )

    # Always include Best MP4 at the top (or if no granular heights were reported)
    if best_total_bytes is None and info:
        top_sz = _estimate_stream_bytes(info, duration)
        if top_sz:
            best_total_bytes = top_sz

    best_opt = FormatOption(
        id="best_mp4",
        label="Best MP4 (Auto)",
        description=f"Highest quality available{f' ({max_height_seen}p)' if max_height_seen else ''} merged to MP4",
        resolution_tag=f"{max_height_seen}p" if max_height_seen else "BEST",
        estimated_size_bytes=best_total_bytes,
        estimated_size_label=format_bytes(best_total_bytes),
        available=True,
    )

    # If no specific tiers matched (e.g. generic/HLS without separate heights), keep standard 1080p/720p options too
    if not options:
        options = [
            FormatOption(id="mp4_1080p", label="Full HD (1080p)", description="Up to 1080p MP4", resolution_tag="1080p", available=True),
            FormatOption(id="mp4_720p", label="HD (720p)", description="Up to 720p MP4", resolution_tag="720p", available=True),
        ]

    audio_opt = FormatOption(
        id="audio_mp3",
        label="Audio MP3 (192kbps)",
        description="Extract audio track as MP3",
        resolution_tag="MP3",
        estimated_size_bytes=best_audio_bytes or (int(192_000 / 8 * duration) if duration else None),
        estimated_size_label=format_bytes(best_audio_bytes or (int(192_000 / 8 * duration) if duration else None)),
        available=True,
    )

    return [best_opt, *options, audio_opt]


async def _inspect_with_ytdlp(url: str, referer: Optional[str] = None) -> Optional[dict[str, Any]]:
    base_cmd = [sys.executable, "-m", "yt_dlp", "--dump-single-json", "--no-warnings", "--no-check-formats"]
    cookies = settings.resolved_cookies_file
    if cookies:
        base_cmd.extend(["--cookies", str(cookies)])
    elif settings.cookies_from_browser:
        base_cmd.extend(["--cookies-from-browser", settings.cookies_from_browser])

    if referer:
        base_cmd.extend(["--referer", referer])

    last_error = ""
    for extra in ([], ["--impersonate", "chrome"]):
        cmd = [*base_cmd, *extra, url]
        code, stdout, stderr = await _run_cli_json(cmd)
        if code == 0 and stdout.strip():
            try:
                return json.loads(stdout)
            except json.JSONDecodeError:
                pass
        last_error = stderr or stdout or last_error

    return {"_error": last_error or "Failed to parse metadata from yt-dlp."}


async def _inspect_with_gallery_dl(url: str) -> Optional[list[Any]]:
    cmd = [sys.executable, "-m", "gallery_dl", "--dump-json", "--no-download"]
    cookies = settings.resolved_cookies_file
    if cookies:
        cmd.extend(["--cookies", str(cookies)])
    elif settings.cookies_from_browser:
        cmd.extend(["--cookies-from-browser", settings.cookies_from_browser])
    cmd.append(url)

    code, stdout, stderr = await _run_cli_json(cmd)
    if code != 0 or not stdout.strip():
        raise RuntimeError(classify_error(stderr or stdout or "Could not inspect URL."))
    try:
        parsed = json.loads(stdout)
        entries = parsed if isinstance(parsed, list) else [parsed]
    except json.JSONDecodeError:
        raise RuntimeError("Failed to parse photo metadata from gallery-dl.")

    for entry in entries:
        if isinstance(entry, list) and len(entry) >= 2 and entry[0] == -1:
            err_msg = entry[1].get("message", "") if isinstance(entry[1], dict) else str(entry[1])
            raise RuntimeError(classify_error(err_msg))
    return entries


async def _force_scan_page_media(url: str, referer: Optional[str] = None) -> InspectResponse:
    """
    Scans a regular HTML webpage for embedded direct video/HLS streams (<video>, og:video, .m3u8, .mp4)
    when standard extractors don't match. Respects anti-bot challenges by reporting them cleanly.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    if referer:
        headers["Referer"] = referer

    async with httpx.AsyncClient(timeout=20, follow_redirects=True, headers=headers) as client:
        resp = await client.get(url)

    cf_mitigated = resp.headers.get("cf-mitigated", "").lower()
    body_head = resp.text[:6000].lower()
    if resp.status_code in (403, 429, 503) and (
        "challenge" in cf_mitigated
        or "just a moment" in body_head
        or "attention required" in body_head
        or "cloudflare" in body_head
        or "turnstile" in body_head
        or "challenge-platform" in body_head
        or "cf_chl" in body_head
    ):
        raise RuntimeError(classify_error("cloudflare anti-bot challenge: Attention Required"))

    if resp.status_code >= 400:
        raise RuntimeError(f"Page returned HTTP {resp.status_code} while scanning for media.")

    content_type = resp.headers.get("content-type", "").lower()
    # Direct media file or playlist URL
    if any(ext in content_type for ext in ("video/", "audio/", "mpegurl", "x-mpegurl")) or re.search(
        r"\.(m3u8|mp4|webm|mov|mp3)(\?|$)", url, re.IGNORECASE
    ):
        yt_stream = await _inspect_with_ytdlp(url, referer=referer or url)
        if yt_stream and "_error" not in yt_stream:
            return InspectResponse(
                url=url,
                resolved_stream_url=url,
                referer=referer,
                platform=detect_platform(url),
                creator=_extract_creator(yt_stream),
                caption=_extract_caption(yt_stream),
                thumbnail_url=yt_stream.get("thumbnail"),
                media_type="video",
                duration=int(yt_stream["duration"]) if yt_stream.get("duration") else None,
                resolution=_extract_resolution(yt_stream),
                item_count=1,
                formats=_build_formats_from_info("video", yt_stream),
            )
        return InspectResponse(
            url=url,
            resolved_stream_url=url,
            referer=referer,
            platform=detect_platform(url),
            creator=f"@{urlparse(url).hostname or 'stream'}",
            caption="Direct Media Stream",
            media_type="video",
            item_count=1,
            formats=_build_formats_from_info("video", None),
        )

    body = resp.text
    title_match = re.search(r"<title[^>]*>(.*?)</title>", body, re.IGNORECASE | re.DOTALL)
    og_title_match = re.search(
        r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', body, re.IGNORECASE
    )
    og_thumb_match = re.search(
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', body, re.IGNORECASE
    )

    caption = html.unescape(
        (og_title_match.group(1) if og_title_match else (title_match.group(1) if title_match else "Embedded Media")).strip()
    )[:300]
    thumb = html.unescape(og_thumb_match.group(1).strip()) if og_thumb_match else None
    if thumb:
        thumb = urljoin(url, thumb)

    # Search for standard embedded media URLs (m3u8, mp4, webm, og:video)
    candidates: list[str] = []
    normalized_body = body.replace("\\/", "/")
    for pat in (
        r'<meta[^>]+property=["\']og:video(?::secure_url)?["\'][^>]+content=["\']([^"\']+)["\']',
        r'<(?:video|source)[^>]+src=["\']([^"\']+)["\']',
        r'(https?://[^\s"\'<>\\]+?\.(?:m3u8|mp4|webm)(?:\?[^\s"\'<>\\]*)?)',
    ):
        for match in re.findall(pat, normalized_body, re.IGNORECASE):
            resolved = urljoin(url, html.unescape(match))
            if resolved not in candidates:
                candidates.append(resolved)

    if not candidates:
        raise RuntimeError(
            "No playable video or .m3u8/.mp4 stream URL was found in this page's HTML. "
            "If the player loads streams dynamically or requires login, paste the direct .m3u8/.mp4 stream URL or add cookies.txt."
        )

    stream_url = next((c for c in candidates if ".m3u8" in c.lower()), candidates[0])
    yt_stream = await _inspect_with_ytdlp(stream_url, referer=referer or url)
    if yt_stream and "_error" not in yt_stream:
        return InspectResponse(
            url=stream_url,
            resolved_stream_url=stream_url,
            referer=referer or url,
            platform=detect_platform(url),
            creator=f"@{urlparse(url).hostname or 'web'}",
            caption=caption,
            thumbnail_url=thumb or yt_stream.get("thumbnail"),
            media_type="video",
            duration=int(yt_stream["duration"]) if yt_stream.get("duration") else None,
            resolution=_extract_resolution(yt_stream),
            item_count=1,
            formats=_build_formats_from_info("video", yt_stream),
        )

    return InspectResponse(
        url=stream_url,
        resolved_stream_url=stream_url,
        referer=referer or url,
        platform=detect_platform(url),
        creator=f"@{urlparse(url).hostname or 'web'}",
        caption=caption,
        thumbnail_url=thumb,
        media_type="video",
        item_count=1,
        formats=_build_formats_from_info("video", None),
    )


async def inspect_url(url: str, force_mode: bool = False, referer: Optional[str] = None) -> InspectResponse:
    platform = detect_platform(url)

    # First check direct yt-dlp extraction
    yt_data = await _inspect_with_ytdlp(url, referer=referer)

    if yt_data and "_error" not in yt_data:
        entries = yt_data.get("entries")
        if isinstance(entries, list) and len(entries) > 0:
            first = entries[0] or yt_data
            has_video = any(
                e.get("vcodec") not in (None, "none") or e.get("ext") in ("mp4", "webm", "mov")
                for e in entries
                if isinstance(e, dict)
            )
            media_type: MediaType = "video" if has_video else ("carousel" if len(entries) > 1 else "image")
            return InspectResponse(
                url=url,
                referer=referer,
                platform=platform,
                creator=_extract_creator(first) if _extract_creator(first) != "@unknown" else _extract_creator(yt_data),
                caption=_extract_caption(yt_data),
                thumbnail_url=first.get("thumbnail") or yt_data.get("thumbnail"),
                media_type=media_type,
                duration=int(first["duration"]) if first.get("duration") else None,
                resolution=_extract_resolution(first),
                item_count=len(entries),
                formats=_build_formats_from_info(media_type, first),
            )

        ext = (yt_data.get("ext") or "").lower()
        is_image = ext in ("jpg", "jpeg", "png", "webp") or (
            yt_data.get("vcodec") == "none" and yt_data.get("acodec") == "none"
        )
        media_type = "image" if is_image else "video"
        return InspectResponse(
            url=url,
            referer=referer,
            platform=platform,
            creator=_extract_creator(yt_data),
            caption=_extract_caption(yt_data),
            thumbnail_url=yt_data.get("thumbnail"),
            media_type=media_type,
            duration=int(yt_data["duration"]) if yt_data.get("duration") else None,
            resolution=_extract_resolution(yt_data),
            item_count=1,
            formats=_build_formats_from_info(media_type, yt_data),
        )

    yt_err = (yt_data or {}).get("_error", "")

    # In force_mode, scan the page HTML / direct stream if yt-dlp didn't match natively
    if force_mode:
        return await _force_scan_page_media(url, referer=referer)

    try:
        gdl_items = await _inspect_with_gallery_dl(url)
    except Exception as gdl_exc:
        raise RuntimeError(classify_error(yt_err) if yt_err else str(gdl_exc))

    image_urls: list[str] = []
    meta_dict: dict[str, Any] = {}
    for entry in gdl_items or []:
        if isinstance(entry, list) and len(entry) >= 2:
            tag, payload = entry[0], entry[1]
            if tag == 2 and isinstance(payload, dict):
                meta_dict.update(payload)
            elif tag == 3 and isinstance(payload, str):
                image_urls.append(payload)
                if len(entry) >= 3 and isinstance(entry[2], dict) and not meta_dict:
                    meta_dict.update(entry[2])

    if not image_urls and not meta_dict:
        raise RuntimeError(classify_error(yt_err or "No downloadable media found at this URL."))

    item_count = max(len(image_urls), 1)
    media_type = "carousel" if item_count > 1 else "image"
    creator = _extract_creator(meta_dict)
    if creator == "@unknown":
        user_obj = meta_dict.get("user") or meta_dict.get("author")
        if isinstance(user_obj, dict):
            name = user_obj.get("username") or user_obj.get("name")
            if name:
                creator = f"@{name}"

    return InspectResponse(
        url=url,
        referer=referer,
        platform=platform,
        creator=creator,
        caption=_extract_caption(meta_dict),
        thumbnail_url=image_urls[0] if image_urls else None,
        media_type=media_type,
        duration=None,
        resolution=_extract_resolution(meta_dict),
        item_count=item_count,
        formats=_build_formats_from_info(media_type, meta_dict),
    )
