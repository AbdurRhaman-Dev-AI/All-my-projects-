from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl


MediaType = Literal["video", "image", "carousel", "audio"]
FormatPreset = Literal[
    "best_mp4",
    "mp4_2160p",
    "mp4_1440p",
    "mp4_1080p",
    "mp4_720p",
    "mp4_480p",
    "mp4_360p",
    "mp4_240p",
    "mp4_144p",
    "audio_mp3",
    "audio_mp3_320",
    "audio_mp3_256",
    "audio_mp3_128",
    "original_images",
]
QueueStatus = Literal["queued", "downloading", "processing", "completed", "failed"]


class InspectRequest(BaseModel):
    url: HttpUrl
    force_mode: bool = False
    referer: Optional[str] = None


class FormatOption(BaseModel):
    id: FormatPreset
    kind: Literal["video", "audio", "image"] = "video"
    label: str
    description: str
    resolution_tag: Optional[str] = None
    badge_tag: Optional[str] = None
    estimated_size_bytes: Optional[int] = None
    estimated_size_label: Optional[str] = None
    available: bool = True


class InspectResponse(BaseModel):
    url: str
    resolved_stream_url: Optional[str] = None
    referer: Optional[str] = None
    platform: str
    source_domain: str
    site_name: str
    creator: str
    caption: str
    thumbnail_url: Optional[str] = None
    media_type: MediaType
    duration: Optional[int] = None
    resolution: Optional[str] = None
    item_count: int = 1
    subtitles_available: bool = False
    existing_media_id: Optional[str] = None
    formats: list[FormatOption]


class DownloadRequest(BaseModel):
    url: HttpUrl
    format_id: FormatPreset = "best_mp4"
    tags: list[str] = Field(default_factory=list)
    notes: str = ""
    creator: Optional[str] = None
    caption: Optional[str] = None
    thumbnail_url: Optional[str] = None
    platform: Optional[str] = None
    source_domain: Optional[str] = None
    site_name: Optional[str] = None
    media_type: Optional[MediaType] = None
    export_dir: Optional[str] = None
    save_to_export_dir: bool = True
    download_subtitles: bool = False
    force_mode: bool = False
    referer: Optional[str] = None


class BatchDownloadRequest(BaseModel):
    urls: list[HttpUrl]
    format_id: FormatPreset = "best_mp4"
    tags: list[str] = Field(default_factory=list)
    download_subtitles: bool = False
    export_dir: Optional[str] = None
    save_to_export_dir: bool = True


class QueueJob(BaseModel):
    job_id: str
    url: str
    platform: str
    source_domain: str = ""
    site_name: str = ""
    creator: str
    caption: str
    thumbnail_url: Optional[str] = None
    format_id: FormatPreset
    status: QueueStatus
    percent: float = 0.0
    speed: Optional[str] = None
    eta: Optional[str] = None
    error: Optional[str] = None
    media_id: Optional[str] = None
    exported_paths: list[str] = Field(default_factory=list)
    created_at: datetime


class MediaItemOut(BaseModel):
    id: str
    platform: str
    source_domain: str = ""
    site_name: str = ""
    original_url: str
    creator: str
    caption: str
    media_type: str
    file_paths: list[str]
    thumbnail_path: Optional[str] = None
    file_size: int
    resolution: Optional[str] = None
    duration: Optional[int] = None
    tags: list[str]
    notes: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PlatformFilterInfo(BaseModel):
    platform: str
    source_domain: str
    site_name: str
    count: int


class LibraryStats(BaseModel):
    total_items: int
    total_size_bytes: int
    platforms: list[PlatformFilterInfo]


class MediaUpdateRequest(BaseModel):
    tags: Optional[list[str]] = None
    notes: Optional[str] = None


class SearchResultItem(BaseModel):
    id: str
    title: str
    subtitle: str
    category: Literal["video", "anime", "tv", "archive"]
    platform: str
    source_domain: str
    site_name: str
    thumbnail_url: Optional[str] = None
    url: str
    watchable: bool = True
    downloadable: bool = True
    duration: Optional[int] = None
    rating: Optional[float] = None
    year: Optional[str] = None
    genres: list[str] = Field(default_factory=list)
    description: str = ""
    is_adult: bool = False
    in_library: bool = False
    existing_media_id: Optional[str] = None


class StreamResolveResponse(BaseModel):
    url: str
    stream_url: Optional[str] = None
    embed_url: Optional[str] = None
    title: str = "Stream Player"
