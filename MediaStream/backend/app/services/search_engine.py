import asyncio
import html
import json
import re
import sys
from typing import Optional
from urllib.parse import parse_qs, urlparse

import httpx

from app.schemas import SearchResultItem, StreamResolveResponse


ANILIST_QUERY = """
query ($search: String, $isAdult: Boolean) {
  Page(page: 1, perPage: 10) {
    media(search: $search, type: ANIME, isAdult: $isAdult, sort: SEARCH_MATCH) {
      id
      title { english romaji native }
      coverImage { large extraLarge }
      averageScore
      seasonYear
      episodes
      genres
      description(asHtml: false)
      isAdult
      trailer { id site }
      siteUrl
    }
  }
}
"""


async def _search_youtube(query: str, limit: int = 10) -> list[SearchResultItem]:
    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--flat-playlist",
        "--dump-single-json",
        "--no-warnings",
        f"ytsearch{limit}:{query}",
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, _ = await asyncio.wait_for(proc.communicate(), timeout=18)
    except asyncio.TimeoutError:
        proc.kill()
        return []

    if proc.returncode != 0 or not stdout_b:
        return []

    try:
        data = json.loads(stdout_b.decode("utf-8", errors="replace"))
    except json.JSONDecodeError:
        return []

    results: list[SearchResultItem] = []
    for entry in data.get("entries") or []:
        if not isinstance(entry, dict):
            continue
        vid = entry.get("id")
        if not vid:
            continue
        url = entry.get("url") or f"https://www.youtube.com/watch?v={vid}"
        if not str(url).startswith("http"):
            url = f"https://www.youtube.com/watch?v={vid}"
        thumbs = entry.get("thumbnails") or []
        thumb = thumbs[-1].get("url") if thumbs and isinstance(thumbs[-1], dict) else f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
        dur = int(entry["duration"]) if isinstance(entry.get("duration"), (int, float)) else None
        results.append(
            SearchResultItem(
                id=f"yt-{vid}",
                title=str(entry.get("title") or "YouTube Video"),
                subtitle=str(entry.get("channel") or entry.get("uploader") or "YouTube"),
                category="video",
                platform="youtube",
                source_domain="youtube.com",
                site_name="YouTube",
                thumbnail_url=thumb,
                url=str(url),
                watchable=True,
                downloadable=True,
                duration=dur,
                description=str(entry.get("description") or "")[:240],
                is_adult=False,
            )
        )
    return results


async def _search_anilist(query: str, safe_mode: bool = True) -> list[SearchResultItem]:
    variables: dict[str, object] = {"search": query}
    if safe_mode:
        variables["isAdult"] = False

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://graphql.anilist.co",
                json={"query": ANILIST_QUERY, "variables": variables},
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
        if resp.status_code != 200:
            return []
        payload = resp.json()
    except Exception:
        return []

    items = (payload.get("data") or {}).get("Page", {}).get("media") or []
    results: list[SearchResultItem] = []
    for m in items:
        if safe_mode and m.get("isAdult"):
            continue
        title_obj = m.get("title") or {}
        title = title_obj.get("english") or title_obj.get("romaji") or title_obj.get("native") or "Anime"
        cover = (m.get("coverImage") or {}).get("extraLarge") or (m.get("coverImage") or {}).get("large")
        trailer = m.get("trailer") or {}
        has_yt_trailer = trailer.get("site") == "youtube" and trailer.get("id")
        target_url = f"https://www.youtube.com/watch?v={trailer['id']}" if has_yt_trailer else (m.get("siteUrl") or "https://anilist.co")
        score = round(m["averageScore"] / 10.0, 1) if isinstance(m.get("averageScore"), (int, float)) else None
        raw_desc = re.sub(r"<[^>]+>", "", str(m.get("description") or ""))
        eps = m.get("episodes")
        results.append(
            SearchResultItem(
                id=f"ani-{m.get('id')}",
                title=str(title),
                subtitle=f"Anime · {eps} eps" if eps else "Anime",
                category="anime",
                platform="youtube" if has_yt_trailer else "anilist.co",
                source_domain="youtube.com" if has_yt_trailer else "anilist.co",
                site_name="Anime Trailer" if has_yt_trailer else "AniList",
                thumbnail_url=cover,
                url=target_url,
                watchable=bool(has_yt_trailer),
                downloadable=bool(has_yt_trailer),
                rating=score,
                year=str(m["seasonYear"]) if m.get("seasonYear") else None,
                genres=list(m.get("genres") or [])[:4],
                description=html.unescape(raw_desc)[:260],
                is_adult=bool(m.get("isAdult")),
            )
        )
    return results


async def _search_tvmaze(query: str) -> list[SearchResultItem]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://api.tvmaze.com/search/shows", params={"q": query})
        if resp.status_code != 200:
            return []
        rows = resp.json()
    except Exception:
        return []

    results: list[SearchResultItem] = []
    for row in rows[:8]:
        show = row.get("show") or {}
        name = show.get("name")
        if not name:
            continue
        img = (show.get("image") or {}).get("original") or (show.get("image") or {}).get("medium")
        rating = (show.get("rating") or {}).get("average")
        premiered = show.get("premiered") or ""
        year = premiered[:4] if len(premiered) >= 4 else None
        summary = re.sub(r"<[^>]+>", "", str(show.get("summary") or ""))
        results.append(
            SearchResultItem(
                id=f"tv-{show.get('id')}",
                title=str(name),
                subtitle="TV Series",
                category="tv",
                platform="tvmaze.com",
                source_domain="tvmaze.com",
                site_name="TVMaze",
                thumbnail_url=img,
                url=str(show.get("url") or "https://www.tvmaze.com"),
                watchable=False,
                downloadable=False,
                rating=float(rating) if isinstance(rating, (int, float)) else None,
                year=year,
                genres=list(show.get("genres") or [])[:4],
                description=html.unescape(summary)[:260],
                is_adult=False,
            )
        )
    return results


async def _search_archive(query: str) -> list[SearchResultItem]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://archive.org/advancedsearch.php",
                params={
                    "q": f"({query}) AND mediatype:movies",
                    "fl[]": ["identifier", "title", "creator", "year", "description"],
                    "rows": 8,
                    "output": "json",
                },
            )
        if resp.status_code != 200:
            return []
        docs = (resp.json().get("response") or {}).get("docs") or []
    except Exception:
        return []

    results: list[SearchResultItem] = []
    for d in docs:
        ident = d.get("identifier")
        if not ident:
            continue
        title = d.get("title") or ident
        if isinstance(title, list):
            title = title[0]
        creator = d.get("creator") or "Internet Archive"
        if isinstance(creator, list):
            creator = creator[0]
        desc = d.get("description") or ""
        if isinstance(desc, list):
            desc = desc[0]
        results.append(
            SearchResultItem(
                id=f"arc-{ident}",
                title=str(title),
                subtitle=str(creator),
                category="archive",
                platform="archive.org",
                source_domain="archive.org",
                site_name="Archive.org",
                thumbnail_url=f"https://archive.org/services/img/{ident}",
                url=f"https://archive.org/details/{ident}",
                watchable=True,
                downloadable=True,
                year=str(d["year"]) if d.get("year") else None,
                genres=["Public Archive"],
                description=re.sub(r"<[^>]+>", "", str(desc))[:240],
                is_adult=False,
            )
        )
    return results


async def search_all(query: str, category: str = "all", safe_mode: bool = True) -> list[SearchResultItem]:
    tasks = []
    if category in ("all", "video"):
        tasks.append(_search_youtube(query, limit=12 if category == "video" else 8))
    if category in ("all", "anime"):
        tasks.append(_search_anilist(query, safe_mode=safe_mode))
    if category in ("all", "tv"):
        tasks.append(_search_tvmaze(query))
    if category in ("all", "archive"):
        tasks.append(_search_archive(query))

    if not tasks:
        return []

    batches = await asyncio.gather(*tasks, return_exceptions=True)
    merged: list[SearchResultItem] = []
    for batch in batches:
        if isinstance(batch, list):
            merged.extend(batch)
    return merged


async def autocomplete_suggest(query: str) -> list[str]:
    q = query.strip()
    if len(q) < 2:
        return []
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            resp = await client.get(
                "https://suggestqueries.google.com/complete/search",
                params={"client": "firefox", "ds": "yt", "q": q},
            )
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) >= 2 and isinstance(data[1], list):
                return [str(s) for s in data[1][:8]]
    except Exception:
        pass
    return []


async def resolve_watch_stream(url: str) -> StreamResolveResponse:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower().removeprefix("www.")

    yt_id: Optional[str] = None
    if host in ("youtube.com", "m.youtube.com"):
        if parsed.path.startswith("/shorts/"):
            yt_id = parsed.path.split("/shorts/")[-1].split("/")[0]
        else:
            yt_id = (parse_qs(parsed.query).get("v") or [None])[0]
    elif host == "youtu.be":
        yt_id = parsed.path.lstrip("/").split("/")[0]

    if yt_id:
        return StreamResolveResponse(
            url=url,
            embed_url=f"https://www.youtube.com/embed/{yt_id}?autoplay=1",
            title="YouTube Stream",
        )

    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "-g",
        "-f",
        "b[ext=mp4]/b",
        "--no-warnings",
        url,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
        stream_line = stdout_b.decode("utf-8", errors="replace").strip().splitlines()[0] if stdout_b else None
    except Exception:
        stream_line = None

    return StreamResolveResponse(
        url=url,
        stream_url=stream_line,
        title="Direct Stream",
    )
