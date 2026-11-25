export type MediaType = "video" | "image" | "carousel" | "audio";
export type FormatPreset =
  | "best_mp4"
  | "mp4_2160p"
  | "mp4_1440p"
  | "mp4_1080p"
  | "mp4_720p"
  | "mp4_480p"
  | "mp4_360p"
  | "mp4_240p"
  | "mp4_144p"
  | "audio_mp3"
  | "audio_mp3_320"
  | "audio_mp3_256"
  | "audio_mp3_128"
  | "original_images";
export type QueueStatus = "queued" | "downloading" | "processing" | "completed" | "failed";

export interface FormatOption {
  id: FormatPreset;
  kind: "video" | "audio" | "image";
  label: string;
  description: string;
  resolution_tag?: string | null;
  badge_tag?: string | null;
  estimated_size_bytes?: number | null;
  estimated_size_label?: string | null;
  available: boolean;
}

export interface InspectResponse {
  url: string;
  resolved_stream_url?: string | null;
  referer?: string | null;
  platform: string;
  source_domain: string;
  site_name: string;
  creator: string;
  caption: string;
  thumbnail_url: string | null;
  media_type: MediaType;
  duration: number | null;
  resolution: string | null;
  item_count: number;
  subtitles_available?: boolean;
  existing_media_id?: string | null;
  formats: FormatOption[];
}

export interface DownloadRequest {
  url: string;
  format_id: FormatPreset;
  tags: string[];
  notes: string;
  creator?: string | null;
  caption?: string | null;
  thumbnail_url?: string | null;
  platform?: string | null;
  source_domain?: string | null;
  site_name?: string | null;
  media_type?: MediaType | null;
  export_dir?: string | null;
  save_to_export_dir?: boolean;
  download_subtitles?: boolean;
  force_mode?: boolean;
  referer?: string | null;
}

export interface BatchDownloadRequest {
  urls: string[];
  format_id: FormatPreset;
  tags: string[];
  download_subtitles: boolean;
  export_dir?: string | null;
  save_to_export_dir?: boolean;
}

export interface QueueJob {
  job_id: string;
  url: string;
  platform: string;
  source_domain?: string;
  site_name?: string;
  creator: string;
  caption: string;
  thumbnail_url: string | null;
  format_id: FormatPreset;
  status: QueueStatus;
  percent: number;
  speed: string | null;
  eta: string | null;
  error: string | null;
  media_id: string | null;
  exported_paths?: string[];
  created_at: string;
}

export interface MediaItem {
  id: string;
  platform: string;
  source_domain: string;
  site_name: string;
  original_url: string;
  creator: string;
  caption: string;
  media_type: MediaType;
  file_paths: string[];
  thumbnail_path: string | null;
  file_size: number;
  resolution: string | null;
  duration: number | null;
  tags: string[];
  notes: string;
  created_at: string;
}

export interface PlatformFilterInfo {
  platform: string;
  source_domain: string;
  site_name: string;
  count: number;
}

export interface LibraryStats {
  total_items: number;
  total_size_bytes: number;
  platforms: PlatformFilterInfo[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "video" | "anime" | "tv" | "archive";
  platform: string;
  source_domain: string;
  site_name: string;
  thumbnail_url: string | null;
  url: string;
  watchable: boolean;
  downloadable: boolean;
  duration: number | null;
  rating: number | null;
  year: string | null;
  genres: string[];
  description: string;
  is_adult: boolean;
  in_library: boolean;
  existing_media_id: string | null;
}

export interface StreamResolveResponse {
  url: string;
  stream_url: string | null;
  embed_url: string | null;
  title: string;
}
