from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl


PlatformType = Literal["twitter", "instagram", "facebook", "missav", "other"]
MediaType = Literal["video", "image", "carousel", "audio"]
FormatPreset = Literal[
    "best_mp4",
    "mp4_2160p",
    "mp4_1440p",
    "mp4_1080p",
    "mp4_720p",
    "mp4_480p",
    "audio_mp3",
    "original_images",
]
QueueStatus = Literal["queued", "downloading", "processing", "completed", "failed"]


class InspectRequest(BaseModel):
    url: HttpUrl
    force_mode: bool = False
    referer: Optional[str] = None


class FormatOption(BaseModel):
    id: FormatPreset
    label: str
    description: str
    resolution_tag: Optional[str] = None
    estimated_size_bytes: Optional[int] = None
    estimated_size_label: Optional[str] = None
    available: bool = True


class InspectResponse(BaseModel):
    url: str
    resolved_stream_url: Optional[str] = None
    referer: Optional[str] = None
    platform: PlatformType
    creator: str
    caption: str
    thumbnail_url: Optional[str] = None
    media_type: MediaType
    duration: Optional[int] = None
    resolution: Optional[str] = None
    item_count: int = 1
    formats: list[FormatOption]


class DownloadRequest(BaseModel):
    url: HttpUrl
    format_id: FormatPreset = "best_mp4"
    tags: list[str] = Field(default_factory=list)
    notes: str = ""
    creator: Optional[str] = None
    caption: Optional[str] = None
    thumbnail_url: Optional[str] = None
    platform: Optional[PlatformType] = None
    media_type: Optional[MediaType] = None
    export_dir: Optional[str] = None
    save_to_export_dir: bool = True
    referer: Optional[str] = None


class QueueJob(BaseModel):
    job_id: str
    url: str
    platform: PlatformType
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


class MediaUpdateRequest(BaseModel):
    tags: Optional[list[str]] = None
    notes: Optional[str] = None
