import asyncio
import html
import re
from typing import Any, Optional
from urllib.parse import quote_plus, urljoin

import httpx
import yt_dlp

from app.schemas import SearchResultItem, StreamResolveResponse

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def _clean_text(raw: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", raw or ""))).strip()


def _extract_yt_id(url: str) -> Optional[str]:
    m = re.search(r"(?:v=|youtu\.be/|shorts/|embed/)([a-zA-Z0-9_-]{11})", url)
    return m.group(1) if m else None


def _search_youtube_sync(query: str, limit: int = 8, music_mode: bool = False) -> list[SearchResultItem]:
    q_effective = f"{query} official audio" if music_mode and "music" not in query.lower() else query
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": True,
    }
    results: list[SearchResultItem] = []
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch{limit}:{q_effective}", download=False)
        for entry in (info or {}).get("entries") or []:
            if not entry:
                continue
            vid = entry.get("id")
            url = entry.get("url") or (f"https://www.youtube.com/watch?v={vid}" if vid else None)
            if not url:
                continue
            if not url.startswith("http"):
                url = f"https://www.youtube.com/watch?v={url}"
            thumbs = entry.get("thumbnails") or []
            thumb = entry.get("thumbnail") or (thumbs[-1].get("url") if thumbs else None)
            if not thumb and vid:
                thumb = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
            dur = int(entry["duration"]) if entry.get("duration") else None
            results.append(
                SearchResultItem(
                    id=f"yt-{vid or len(results)}",
                    title=str(entry.get("title") or "YouTube Video"),
                    subtitle=str(entry.get("channel") or entry.get("uploader") or ("YouTube Music" if music_mode else "YouTube")),
                    category="music" if music_mode else "video",
                    platform="youtube",
                    source_domain="youtube.com",
                    site_name="YouTube Music" if music_mode else "YouTube",
                    thumbnail_url=thumb,
                    url=url,
                    watchable=True,
                    downloadable=True,
                    duration=dur,
                    rating=None,
                    year=None,
                    genres=["Music"] if music_mode else ["Video"],
                    description=str(entry.get("description") or "")[:240],
                    is_adult=False,
                )
            )
    except Exception:
        pass
    return results


async def _search_hdhub4u(query: str, category: str = "all", limit: int = 10) -> list[SearchResultItem]:
    """Search Movies & TV Shows on new16.hdhub4u.cl (or homepage trending when query is empty)."""
    base = "https://new16.hdhub4u.cl"
    target = f"{base}/?s={quote_plus(query)}" if query.strip() else f"{base}/"
    results: list[SearchResultItem] = []
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, headers=_HEADERS) as client:
            resp = await client.get(target)
        if resp.status_code != 200:
            return results

        # Match <li class="thumb"> or <figure>...<img ...><figcaption><a href="...">Title</a>
        blocks = re.findall(r"<li[^>]*class=\"[^\"]*thumb[^\"]*\"[^>]*>(.*?)</li>", resp.text, re.S)
        if not blocks:
            blocks = re.findall(r"<figure[^>]*>(.*?)</figure>", resp.text, re.S)

        for idx, block in enumerate(blocks):
            link_m = re.search(r'<figcaption[^>]*>.*?<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', block, re.S)
            if not link_m:
                link_m = re.search(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', block, re.S)
            if not link_m:
                continue
            href, raw_title = link_m.group(1), link_m.group(2)
            title = _clean_text(raw_title)
            if not title or len(title) < 3:
                continue

            img_m = re.search(r'<img[^>]+(?:data-src|src)="([^"]+)"', block)
            thumb = img_m.group(1) if img_m else None
            if thumb and thumb.startswith("/"):
                thumb = urljoin(base, thumb)

            full_url = urljoin(base, href)
            is_tv = bool(re.search(r"\b(season|episode|s\d{1,2}|series)\b", title, re.I))
            item_cat = "tv" if is_tv else "movie"
            if category in ("tv", "movie") and item_cat != category:
                # Keep matching items when user specifically filtered TV or Movie
                pass

            year_m = re.search(r"\b(19\d{2}|20\d{2})\b", title)
            results.append(
                SearchResultItem(
                    id=f"hdhub-{idx}-{re.sub(r'[^a-zA-Z0-9]', '', href)[-10:]}",
                    title=title,
                    subtitle=f"HDHub4u • {'TV Series' if is_tv else 'Movie'}",
                    category=item_cat,
                    platform="hdhub4u",
                    source_domain="new16.hdhub4u.cl",
                    site_name="HDHub4u",
                    thumbnail_url=thumb,
                    url=full_url,
                    watchable=False,
                    downloadable=True,
                    duration=None,
                    rating=None,
                    year=year_m.group(1) if year_m else None,
                    genres=["TV Series"] if is_tv else ["Movie"],
                    description=title,
                    is_adult=False,
                )
            )
            if len(results) >= limit:
                break
    except Exception:
        pass
    return results


async def _search_hanime_red(query: str, limit: int = 10) -> list[SearchResultItem]:
    """Search Hentai on hanime.red (only called when safe_mode=False)."""
    base = "https://hanime.red"
    target = f"{base}/search?q={quote_plus(query)}" if query.strip() else f"{base}/"
    results: list[SearchResultItem] = []
    seen: set[str] = set()
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, headers=_HEADERS) as client:
            resp = await client.get(target)
        if resp.status_code != 200:
            return results

        # Extract cards: <a href="/...">...<img src="/media/posters/..." alt="...">...</a>
        for m in re.finditer(
            r'<a[^>]+href="(/(?:serie/)?[a-z0-9][a-z0-9-]+)"[^>]*>(.*?)</a>',
            resp.text,
            re.S,
        ):
            href, inner = m.group(1), m.group(2)
            if href in seen or any(skip in href for skip in ("/genres", "/studios", "/search", "/login", "/register")):
                continue
            img_m = re.search(r'<img[^>]+src="([^"]*posters[^"]+|[^"]*backdrops[^"]+)"[^>]*alt="([^"]*)"', inner)
            if not img_m:
                img_m = re.search(r'<img[^>]+alt="([^"]*)"[^>]*src="([^"]*posters[^"]+)"', inner)
                if img_m:
                    alt_text, poster = img_m.group(1), img_m.group(2)
                else:
                    continue
            else:
                poster, alt_text = img_m.group(1), img_m.group(2)

            title = _clean_text(alt_text) or href.strip("/").replace("-", " ").title()
            if len(title) < 2:
                continue
            seen.add(href)
            thumb = urljoin(base, poster)
            full_url = urljoin(base, href)
            results.append(
                SearchResultItem(
                    id=f"hanime-{len(results)}-{href.strip('/')[:16]}",
                    title=title,
                    subtitle="Hanime.red • 18+ Hentai",
                    category="hentai",
                    platform="hanime",
                    source_domain="hanime.red",
                    site_name="Hanime.red",
                    thumbnail_url=thumb,
                    url=full_url,
                    watchable=True,
                    downloadable=True,
                    duration=None,
                    rating=None,
                    year=None,
                    genres=["Hentai", "18+"],
                    description=title,
                    is_adult=True,
                )
            )
            if len(results) >= limit:
                break
    except Exception:
        pass
    return results


async def _search_anilist(query: str, safe_mode: bool = True, limit: int = 8) -> list[SearchResultItem]:
    gql = """
    query ($search: String, $isAdult: Boolean, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(search: $search, type: ANIME, isAdult: $isAdult, sort: TRENDING_DESC) {
          id
          title { romaji english }
          coverImage { large }
          averageScore
          seasonYear
          episodes
          genres
          description(asHtml: false)
          isAdult
          siteUrl
          trailer { id site }
        }
      }
    }
    """
    variables: dict[str, Any] = {"perPage": limit}
    if query.strip():
        variables["search"] = query.strip()
    if safe_mode:
        variables["isAdult"] = False

    results: list[SearchResultItem] = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("https://graphql.anilist.co", json={"query": gql, "variables": variables})
        if resp.status_code != 200:
            return results
        items = (((resp.json() or {}).get("data") or {}).get("Page") or {}).get("media") or []
        for m in items:
            t_obj = m.get("title") or {}
            title = t_obj.get("english") or t_obj.get("romaji") or "Anime"
            trailer = m.get("trailer") or {}
            trailer_url = (
                f"https://www.youtube.com/watch?v={trailer['id']}"
                if trailer.get("site") == "youtube" and trailer.get("id")
                else None
            )
            eps = m.get("episodes")
            sub = f"Anime • {eps} eps" if eps else "Anime • AniList"
            results.append(
                SearchResultItem(
                    id=f"al-{m.get('id')}",
                    title=title,
                    subtitle=sub,
                    category="anime",
                    platform="anilist",
                    source_domain="anilist.co",
                    site_name="AniList / AnimePahe",
                    thumbnail_url=(m.get("coverImage") or {}).get("large"),
                    url=trailer_url or m.get("siteUrl") or "https://animepahe.pw/",
                    watchable=bool(trailer_url),
                    downloadable=bool(trailer_url),
                    duration=None,
                    rating=round(m["averageScore"] / 10.0, 1) if m.get("averageScore") else None,
                    year=str(m["seasonYear"]) if m.get("seasonYear") else None,
                    genres=(m.get("genres") or [])[:4],
                    description=_clean_text(m.get("description") or "")[:240],
                    is_adult=bool(m.get("isAdult")),
                )
            )
    except Exception:
        pass
    return results


async def _search_tvmaze(query: str, limit: int = 8) -> list[SearchResultItem]:
    results: list[SearchResultItem] = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if query.strip():
                resp = await client.get("https://api.tvmaze.com/search/shows", params={"q": query.strip()})
                raw = [entry.get("show") for entry in (resp.json() or []) if entry.get("show")]
            else:
                resp = await client.get("https://api.tvmaze.com/shows", params={"page": 0})
                raw = sorted(resp.json() or [], key=lambda s: (s.get("rating") or {}).get("average") or 0, reverse=True)
        for show in raw[:limit]:
            img = show.get("image") or {}
            rating = (show.get("rating") or {}).get("average")
            premiered = show.get("premiered") or ""
            results.append(
                SearchResultItem(
                    id=f"tvm-{show.get('id')}",
                    title=str(show.get("name") or "TV Show"),
                    subtitle="TVMaze • TV Series",
                    category="tv",
                    platform="tvmaze",
                    source_domain="tvmaze.com",
                    site_name="TVMaze",
                    thumbnail_url=img.get("medium") or img.get("original"),
                    url=str(show.get("url") or "https://www.tvmaze.com"),
                    watchable=False,
                    downloadable=False,
                    duration=None,
                    rating=float(rating) if rating else None,
                    year=premiered[:4] if premiered else None,
                    genres=(show.get("genres") or [])[:4],
                    description=_clean_text(show.get("summary") or "")[:240],
                    is_adult=False,
                )
            )
    except Exception:
        pass
    return results


async def _search_archive(query: str, limit: int = 8) -> list[SearchResultItem]:
    q_text = f"({query.strip()}) AND mediatype:(movies)" if query.strip() else "mediatype:(movies) AND collection:(feature_films)"
    results: list[SearchResultItem] = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://archive.org/advancedsearch.php",
                params={
                    "q": q_text,
                    "fl[]": ["identifier", "title", "year", "description", "downloads"],
                    "sort[]": "downloads desc",
                    "rows": limit,
                    "page": 1,
                    "output": "json",
                },
            )
        docs = ((resp.json() or {}).get("response") or {}).get("docs") or []
        for doc in docs:
            ident = doc.get("identifier")
            if not ident:
                continue
            title = doc.get("title")
            if isinstance(title, list):
                title = title[0]
            desc = doc.get("description")
            if isinstance(desc, list):
                desc = desc[0]
            results.append(
                SearchResultItem(
                    id=f"ia-{ident}",
                    title=str(title or ident),
                    subtitle="Internet Archive • Public Domain",
                    category="archive",
                    platform="archive",
                    source_domain="archive.org",
                    site_name="Archive.org",
                    thumbnail_url=f"https://archive.org/services/img/{ident}",
                    url=f"https://archive.org/details/{ident}",
                    watchable=True,
                    downloadable=True,
                    duration=None,
                    rating=None,
                    year=str(doc["year"])[:4] if doc.get("year") else None,
                    genres=["Public Domain"],
                    description=_clean_text(str(desc or ""))[:240],
                    is_adult=False,
                )
            )
    except Exception:
        pass
    return results


async def search_all(query: str, category: str = "all", safe_mode: bool = True) -> list[SearchResultItem]:
    q = query.strip()
    tasks = []

    if category == "video":
        tasks.append(asyncio.to_thread(_search_youtube_sync, q or "trending 4k videos", 12, False))
    elif category == "music":
        tasks.append(asyncio.to_thread(_search_youtube_sync, q or "top music hits 2026", 12, True))
    elif category == "anime":
        tasks.append(_search_anilist(q, safe_mode=safe_mode, limit=12))
    elif category == "movie":
        tasks.append(_search_hdhub4u(q, category="movie", limit=12))
        tasks.append(_search_archive(q, limit=6))
    elif category == "tv":
        tasks.append(_search_hdhub4u(q, category="tv", limit=8))
        tasks.append(_search_tvmaze(q, limit=8))
    elif category == "hentai":
        if not safe_mode:
            tasks.append(_search_hanime_red(q, limit=12))
    elif category == "archive":
        tasks.append(_search_archive(q, limit=12))
    else:
        # "all" -> mix Movies/TV (HDHub4u), Anime (AniList), Videos/Music (YouTube), Public Archive, and Hentai if safe_mode=False
        tasks.append(_search_hdhub4u(q, category="all", limit=6))
        tasks.append(_search_anilist(q, safe_mode=safe_mode, limit=6))
        tasks.append(asyncio.to_thread(_search_youtube_sync, q or "trending videos", 6, False))
        tasks.append(_search_tvmaze(q, limit=4))
        tasks.append(_search_archive(q, limit=4))
        if not safe_mode:
            tasks.append(_search_hanime_red(q, limit=6))

    if not tasks:
        return []

    batches = await asyncio.gather(*tasks, return_exceptions=True)
    merged: list[SearchResultItem] = []
    for batch in batches:
        if isinstance(batch, list):
            for item in batch:
                if safe_mode and item.is_adult:
                    continue
                merged.append(item)
    return merged


async def autocomplete_suggest(query: str) -> list[str]:
    q = query.strip()
    if len(q) < 2:
        return []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://suggestqueries.google.com/complete/search",
                params={"client": "firefox", "ds": "yt", "q": q},
            )
        data = resp.json()
        if isinstance(data, list) and len(data) > 1 and isinstance(data[1], list):
            return [str(s) for s in data[1][:8]]
    except Exception:
        pass
    return []


def _resolve_ytdlp_stream_sync(url: str) -> StreamResolveResponse:
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "format": "b[ext=mp4]/bv*+ba/b",
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        stream_url = info.get("url") if info else None
        title = str((info or {}).get("title") or "Stream")
        return StreamResolveResponse(url=url, stream_url=stream_url, embed_url=None, title=title)
    except Exception:
        return StreamResolveResponse(url=url, stream_url=None, embed_url=None, title="Stream")


async def resolve_watch_stream(url: str) -> StreamResolveResponse:
    yt_id = _extract_yt_id(url)
    if yt_id:
        return StreamResolveResponse(
            url=url,
            stream_url=None,
            embed_url=f"https://www.youtube.com/embed/{yt_id}?autoplay=1",
            title="YouTube Player",
        )

    # Archive.org details page -> built-in archive.org/embed/<id>
    ia_m = re.search(r"archive\.org/details/([^/?#]+)", url, re.I)
    if ia_m:
        ident = ia_m.group(1)
        return StreamResolveResponse(
            url=url,
            stream_url=None,
            embed_url=f"https://archive.org/embed/{ident}",
            title=f"Internet Archive • {ident}",
        )

    res = await asyncio.to_thread(_resolve_ytdlp_stream_sync, url)
    if res.stream_url or res.embed_url:
        return res

    # Fallback: Playwright SPA scanner for hanime.red / embedded <video> / .m3u8
    try:
        from app.services.inspector import _force_scan_page_media
        scanned = await _force_scan_page_media(url)
        if scanned.resolved_stream_url:
            return StreamResolveResponse(
                url=url,
                stream_url=scanned.resolved_stream_url,
                embed_url=None,
                title=scanned.caption or "Direct Stream",
            )
    except Exception:
        pass
    return res
