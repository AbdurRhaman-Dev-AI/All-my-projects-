import type { DownloadRequest, InspectResponse, MediaItem, QueueJob } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SettingsStatus {
  cookies_configured: boolean;
  cookies_path: string;
  ffmpeg_configured: boolean;
  ffmpeg_path: string | null;
  download_dir: string;
  auto_export: boolean;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) detail = errJson.detail;
    } catch {
      // ignore parse error
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function storageUrl(relPath: string | null): string | null {
  if (!relPath) return null;
  return `${API_BASE}/api/storage/${relPath.replace(/^\/+/, "")}`;
}

export function mediaDownloadUrl(id: string, index?: number): string {
  const q = index !== undefined ? `?index=${index}` : "";
  return `${API_BASE}/api/media/${id}/download${q}`;
}

export async function fetchSettingsStatus(): Promise<SettingsStatus> {
  return apiFetch<SettingsStatus>("/api/settings/status", { cache: "no-store" });
}

export async function saveCookiesText(content: string): Promise<{ cookies_configured: boolean }> {
  return apiFetch<{ cookies_configured: boolean }>("/api/settings/cookies", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function saveDownloadSettings(payload: {
  download_dir?: string;
  auto_export?: boolean;
}): Promise<{ download_dir: string; auto_export: boolean }> {
  return apiFetch<{ download_dir: string; auto_export: boolean }>("/api/settings/download-dir", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function pickDownloadFolder(): Promise<{ download_dir: string | null }> {
  return apiFetch<{ download_dir: string | null }>("/api/settings/pick-folder", {
    method: "POST",
  });
}

export async function revealMediaInFolder(id: string): Promise<{ status: string; path: string }> {
  return apiFetch<{ status: string; path: string }>(`/api/media/${id}/reveal`, {
    method: "POST",
  });
}

export async function inspectUrl(
  url: string,
  opts?: { forceMode?: boolean; referer?: string }
): Promise<InspectResponse> {
  return apiFetch<InspectResponse>("/api/inspect", {
    method: "POST",
    body: JSON.stringify({
      url,
      force_mode: opts?.forceMode ?? false,
      referer: opts?.referer || undefined,
    }),
  });
}

export async function startDownload(payload: DownloadRequest): Promise<QueueJob> {
  return apiFetch<QueueJob>("/api/download", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchQueue(): Promise<QueueJob[]> {
  return apiFetch<QueueJob[]>("/api/queue", { cache: "no-store" });
}

export async function clearCompletedQueue(): Promise<{ removed: number }> {
  return apiFetch<{ removed: number }>("/api/queue/completed", { method: "DELETE" });
}

export async function fetchMedia(params?: {
  q?: string;
  platform?: string;
  media_type?: string;
}): Promise<MediaItem[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.platform && params.platform !== "all") sp.set("platform", params.platform);
  if (params?.media_type && params.media_type !== "all") sp.set("media_type", params.media_type);
  const qs = sp.toString();
  return apiFetch<MediaItem[]>(`/api/media${qs ? `?${qs}` : ""}`, { cache: "no-store" });
}

export async function updateMediaTags(
  id: string,
  payload: { tags?: string[]; notes?: string }
): Promise<MediaItem> {
  return apiFetch<MediaItem>(`/api/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMediaItem(id: string): Promise<void> {
  await apiFetch(`/api/media/${id}`, { method: "DELETE" });
}
