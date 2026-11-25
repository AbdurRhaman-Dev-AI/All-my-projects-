import json
import os
import shutil
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent


def find_ffmpeg_executable() -> Optional[str]:
    winget_pkgs = Path.home() / "AppData/Local/Microsoft/WinGet/Packages"
    if winget_pkgs.exists():
        for found in winget_pkgs.glob("Gyan.FFmpeg*/**/bin/ffmpeg.exe"):
            return str(found)
    direct = shutil.which("ffmpeg")
    if direct:
        resolved = Path(direct).resolve()
        if resolved.exists():
            return str(resolved)
    candidates = [
        Path("C:/ffmpeg/bin/ffmpeg.exe"),
        Path.home() / "AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate.resolve())
    return None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    port: int = 8001
    cors_origins: str = "http://localhost:3001,http://127.0.0.1:3001"
    cookies_file: Optional[str] = None
    cookies_from_browser: Optional[str] = None
    storage_dir: str = str(ROOT_DIR / "storage")
    database_url: Optional[str] = None

    @property
    def storage_path(self) -> Path:
        p = Path(self.storage_dir)
        if not p.is_absolute():
            p = (BACKEND_DIR / p).resolve()
        return p

    @property
    def media_path(self) -> Path:
        return self.storage_path / "media"

    @property
    def thumbnails_path(self) -> Path:
        return self.storage_path / "thumbnails"

    @property
    def user_settings_path(self) -> Path:
        return self.storage_path / "user_settings.json"

    @property
    def default_download_dir(self) -> Path:
        return Path.home() / "Downloads" / "MediaStream"

    def get_user_settings(self) -> dict[str, object]:
        default_dir = str(self.default_download_dir)
        data: dict[str, object] = {
            "download_dir": default_dir,
            "auto_export": True,
        }
        if self.user_settings_path.exists():
            try:
                loaded = json.loads(self.user_settings_path.read_text(encoding="utf-8"))
                if isinstance(loaded, dict):
                    if isinstance(loaded.get("download_dir"), str) and loaded["download_dir"].strip():
                        data["download_dir"] = loaded["download_dir"].strip()
                    if isinstance(loaded.get("auto_export"), bool):
                        data["auto_export"] = loaded["auto_export"]
            except Exception:
                pass
        return data

    def save_user_settings(self, download_dir: Optional[str] = None, auto_export: Optional[bool] = None) -> dict[str, object]:
        current = self.get_user_settings()
        if download_dir is not None and download_dir.strip():
            target = Path(download_dir.strip()).expanduser().resolve()
            target.mkdir(parents=True, exist_ok=True)
            current["download_dir"] = str(target)
        if auto_export is not None:
            current["auto_export"] = auto_export
        self.user_settings_path.write_text(json.dumps(current, indent=2), encoding="utf-8")
        return current

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        db_file = self.storage_path / "mediastream.db"
        return f"sqlite+aiosqlite:///{db_file.as_posix()}"

    @property
    def cookies_target_path(self) -> Path:
        if self.cookies_file:
            p = Path(self.cookies_file)
            return p if p.is_absolute() else (BACKEND_DIR / p).resolve()
        return BACKEND_DIR / "cookies.txt"

    @property
    def resolved_cookies_file(self) -> Optional[Path]:
        target = self.cookies_target_path
        return target if target.exists() and target.stat().st_size > 0 else None

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
settings.storage_path.mkdir(parents=True, exist_ok=True)
settings.media_path.mkdir(parents=True, exist_ok=True)
settings.thumbnails_path.mkdir(parents=True, exist_ok=True)

_ffmpeg_bin = find_ffmpeg_executable()
if _ffmpeg_bin:
    _ffmpeg_dir = str(Path(_ffmpeg_bin).parent)
    if _ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = f"{_ffmpeg_dir}{os.pathsep}{os.environ.get('PATH', '')}"
