from collections.abc import AsyncGenerator
from urllib.parse import urlparse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


engine = create_async_engine(settings.resolved_database_url, echo=False, future=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


def _infer_domain_and_name(url: str, platform: str) -> tuple[str, str, str]:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower().removeprefix("www.")
    path = (parsed.path or "").lower()
    if platform == "other" or not platform:
        if "youtube.com" in host or "youtu.be" in host:
            platform = "youtube_shorts" if "/shorts/" in path else "youtube"
        elif "tiktok.com" in host:
            platform = "tiktok"
        elif "reddit.com" in host or host == "redd.it":
            platform = "reddit"
        elif "vimeo.com" in host:
            platform = "vimeo"
    known = {
        "twitter": ("x.com", "X / Twitter"),
        "instagram": ("instagram.com", "Instagram"),
        "facebook": ("facebook.com", "Facebook"),
        "youtube": ("youtube.com", "YouTube"),
        "youtube_shorts": ("youtube.com", "YouTube Shorts"),
        "tiktok": ("tiktok.com", "TikTok"),
        "reddit": ("reddit.com", "Reddit"),
        "vimeo": ("vimeo.com", "Vimeo"),
        "missav": ("missav.ws", "MissAV"),
    }
    if platform in known:
        return platform, known[platform][0], known[platform][1]
    if host:
        label = host.split(".")[0].capitalize()
        return platform, host, label
    return platform or "other", "web", "Web"


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        res = await conn.execute(text("PRAGMA table_info(media_items)"))
        cols = {row[1] for row in res.fetchall()}
        if "source_domain" not in cols:
            await conn.execute(text("ALTER TABLE media_items ADD COLUMN source_domain VARCHAR(128) DEFAULT ''"))
        if "site_name" not in cols:
            await conn.execute(text("ALTER TABLE media_items ADD COLUMN site_name VARCHAR(64) DEFAULT ''"))

        rows = (await conn.execute(text("SELECT id, original_url, platform, source_domain, site_name FROM media_items"))).fetchall()
        for row in rows:
            item_id, orig_url, plat, src_dom, s_name = row
            inferred_plat, inferred_dom, inferred_name = _infer_domain_and_name(orig_url or "", plat or "other")
            if not src_dom or not s_name or plat == "other":
                await conn.execute(
                    text("UPDATE media_items SET platform = :p, source_domain = :d, site_name = :n WHERE id = :id"),
                    {"p": inferred_plat, "d": inferred_dom, "n": inferred_name, "id": item_id},
                )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
