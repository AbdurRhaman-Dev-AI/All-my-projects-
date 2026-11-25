export type PlatformType = "twitter" | "instagram" | "facebook" | "missav" | "other";
export type MediaType = "video" | "image" | "carousel" | "audio";
export type FormatPreset =
  | "best_mp4"
  | "mp4_2160p"
  | "mp4_1440p"
  | "mp4_1080p"
  | "mp4_720p"
  | "mp4_480p"
  | "audio_mp3"
  | "original_images";
export type QueueStatus = "queued" | "downloading" | "processing" | "completed" | "failed";

export interface FormatOption {
  id: FormatPreset;
  label: string;
  description: string;
  resolution_tag?: string | null;
  estimated_size_bytes?: number | null;
  estimated_size_label?: string | null;
  available: boolean;
}

export interface InspectResponse {
  url: string;
  resolved_stream_url?: string | null;
  referer?: string | null;
  platform: PlatformType;
  creator: string;
  caption: string;
  thumbnail_url: string | null;
  media_type: MediaType;
  duration: number | null;
  resolution: string | null;
  item_count: number;
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
  platform?: PlatformType | null;
  media_type?: MediaType | null;
  export_dir?: string | null;
  save_to_export_dir?: boolean;
  referer?: string | null;
}

export interface QueueJob {
  job_id: string;
  url: string;
  platform: PlatformType;
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
  platform: PlatformType;
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
