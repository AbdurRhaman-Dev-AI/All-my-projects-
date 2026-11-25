"use client";

import { CheckCircle2, Clock, Download, FolderOpen, Loader2, Trash2, X, XCircle } from "lucide-react";
import { mediaDownloadUrl, revealMediaInFolder } from "@/lib/api";
import type { QueueJob, QueueStatus } from "@/lib/types";

interface QueueDrawerProps {
  open: boolean;
  jobs: QueueJob[];
  onClose: () => void;
  onClearCompleted: () => void;
}

const STATUS_STYLE: Record<QueueStatus, { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "bg-white/10 text-[var(--mv-text-muted)] border-white/15" },
  downloading: { label: "Downloading", cls: "bg-[#0a84ff]/20 text-[#aac7ff] border-[#0a84ff]/40" },
  processing: { label: "Processing", cls: "bg-[#5e5ce6]/20 text-[#c2c1ff] border-[#5e5ce6]/40" },
  completed: { label: "Completed", cls: "bg-[#30d158]/20 text-[#47e266] border-[#30d158]/40" },
  failed: { label: "Failed", cls: "bg-red-500/20 text-[#ffb4ab] border-red-500/40" },
};

export function QueueDrawer({ open, jobs, onClose, onClearCompleted }: QueueDrawerProps) {
  if (!open) return null;

  const activeCount = jobs.filter((j) =>
    ["queued", "downloading", "processing"].includes(j.status)
  ).length;
  const hasDone = jobs.some((j) => j.status === "completed" || j.status === "failed");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="liquid-glass-elevated flex h-full w-full max-w-md flex-col border-l border-[var(--mv-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--mv-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--mv-text)]">
              Active Download Queue
            </h2>
            <p className="font-mono-meta text-[11px] text-[var(--mv-text-subtle)]">
              {activeCount} active · {jobs.length} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasDone && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--mv-border)] bg-white/5 px-3 py-1.5 text-xs text-[var(--mv-text-muted)] transition hover:bg-white/10"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white/5 text-[var(--mv-text-muted)] transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {jobs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[var(--mv-text-subtle)]">
              <Clock className="mb-2 h-8 w-8 opacity-40" />
              No downloads in queue yet.
            </div>
          ) : (
            jobs.map((job) => {
              const badge = STATUS_STYLE[job.status];
              return (
                <div
                  key={job.job_id}
                  className="liquid-glass space-y-2.5 rounded-2xl p-3.5"
                >
                  <div className="flex items-start gap-3">
                    {job.thumbnail_url ? (
                      <img
                        src={job.thumbnail_url}
                        alt={job.caption}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--mv-text-subtle)]">
                        {job.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-[#47e266]" />
                        ) : job.status === "failed" ? (
                          <XCircle className="h-5 w-5 text-[#ffb4ab]" />
                        ) : (
                          <Loader2 className="h-5 w-5 animate-spin text-[#0a84ff]" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-[var(--mv-primary-soft)]">
                          {job.creator}
                        </span>
                        <span
                          className={`font-mono-meta rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--mv-text)]">
                        {job.caption}
                      </p>
                      <div className="font-mono-meta mt-1 flex items-center justify-between text-[10px] text-[var(--mv-text-subtle)]">
                        <span>{job.format_id.replace("_", " ").toUpperCase()}</span>
                        <span>
                          {job.percent.toFixed(0)}%
                          {job.speed ? ` · ${job.speed}` : ""}
                          {job.eta ? ` · ETA ${job.eta}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3px Luminous Progress Strip */}
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        job.status === "failed"
                          ? "bg-red-500"
                          : job.status === "completed"
                            ? "bg-[#30d158]"
                            : "progress-bloom bg-[#0a84ff]"
                      }`}
                      style={{ width: `${Math.max(4, job.percent)}%` }}
                    />
                  </div>

                  {job.status === "completed" && job.media_id && (
                    <div className="space-y-2 pt-1">
                      {job.exported_paths && job.exported_paths.length > 0 && (
                        <p className="font-mono-meta truncate rounded-lg bg-white/5 px-2.5 py-1 text-[10px] text-[var(--mv-text-muted)]" title={job.exported_paths[0]}>
                          Saved: {job.exported_paths[0]}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <a
                          href={mediaDownloadUrl(job.media_id)}
                          download
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0a84ff] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#3e90ff]"
                        >
                          <Download className="h-3 w-3" />
                          Download to Browser
                        </a>
                        <button
                          type="button"
                          onClick={() => revealMediaInFolder(job.media_id!)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[var(--mv-text)] hover:bg-white/15"
                        >
                          <FolderOpen className="h-3 w-3 text-[#0a84ff]" />
                          Open Folder
                        </button>
                      </div>
                    </div>
                  )}

                  {job.error && (
                    <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-[#ffb4ab]">
                      {job.error}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
