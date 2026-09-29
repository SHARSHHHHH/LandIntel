"use client";

import Link from "next/link";
import type { WorkspaceOut } from "@/lib/gov/types";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLE: Record<string, string> = {
  active: "border-register-official/40 bg-register-official/[0.08] text-register-official",
  completed: "border-register-derived/40 bg-register-derived/[0.08] text-register-derived",
  archived: "border-register-line bg-register-bg text-register-ink/50",
};

const VISIBILITY_ICON: Record<string, string> = { Private: "🔒", Team: "👥", Public: "🌐" };

export function WorkspaceCard({ w }: { w: WorkspaceOut }) {
  const pct = w.task_progress.total > 0 ? Math.round((w.task_progress.done / w.task_progress.total) * 100) : 0;
  return (
    <Link
      href={`/gov/workspaces/${w.id}`}
      className="group flex h-full flex-col rounded-sm border border-register-line bg-register-panel p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-register-navy/30 hover:shadow-raised"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[w.status] ?? STATUS_STYLE.active}`}>
          {w.status}
        </span>
        <span className="text-xs text-register-ink/45" title={`Visibility: ${w.visibility}`}>
          {VISIBILITY_ICON[w.visibility] ?? ""} {w.visibility}
        </span>
      </div>

      <h3 className="font-serif-display text-base font-semibold leading-snug text-register-navy group-hover:underline">{w.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-register-ink/60">{w.description || "No description yet."}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {w.research_area && (
          <span className="rounded-sm border border-register-navy/20 bg-register-navy/[0.04] px-2 py-0.5 text-[11px] text-register-navy">{w.research_area}</span>
        )}
        {w.geography_name && (
          <span className="rounded-sm border border-register-ochre/30 bg-register-ochre/[0.06] px-2 py-0.5 text-[11px] text-register-ochre">{w.geography_name}</span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-register-line pt-3 text-center text-xs text-register-ink/60">
        <div>
          <p className="font-serif-display text-base font-semibold text-register-navy">{w.member_count}</p>
          <p>Members</p>
        </div>
        <div>
          <p className="font-serif-display text-base font-semibold text-register-navy">{w.document_count}</p>
          <p>Documents</p>
        </div>
        <div>
          <p className="font-serif-display text-base font-semibold text-register-navy">{w.dataset_count}</p>
          <p>Datasets</p>
        </div>
      </div>

      {w.task_progress.total > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-register-ink/50">
            <span>Task progress</span>
            <span>{w.task_progress.done}/{w.task_progress.total} done</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-register-line/60">
            <div className="h-full rounded-full bg-register-official" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-register-line pt-3 text-xs text-register-ink/45">
        <span>Updated {timeAgo(w.updated_at)}</span>
        <span className="font-medium text-register-navy group-hover:underline">Open workspace →</span>
      </div>
    </Link>
  );
}
