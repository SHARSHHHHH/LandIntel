"use client";

import type { WorkspaceDetailOut } from "@/lib/gov/types";
import { roleLabel, ROLE_BADGE_STYLE } from "../constants";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function OverviewTab({ ws, goTo }: { ws: WorkspaceDetailOut; goTo: (tab: string) => void }) {
  const pct = ws.task_progress.total > 0 ? Math.round((ws.task_progress.done / ws.task_progress.total) * 100) : 0;
  const activeTasks = ws.tasks.filter((t) => t.status !== "done").slice(0, 5);
  const recentDocs = ws.linked_documents.slice(0, 4);
  const recentActivity = ws.activity.slice(0, 6);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card lg:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Project progress</h3>
          <span className="text-sm font-semibold text-register-navy">{pct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-register-line/60">
          <div className="h-full rounded-full bg-register-official transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-register-ink/50">
          {ws.task_progress.done} of {ws.task_progress.total} task{ws.task_progress.total === 1 ? "" : "s"} done — derived live from the Research Board tab, not a manual estimate.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Members", value: ws.member_count },
            { label: "Documents", value: ws.document_count },
            { label: "Datasets/GIS links", value: ws.dataset_count },
            { label: "Findings", value: ws.findings.length },
          ].map((s) => (
            <div key={s.label} className="rounded-sm border border-register-line bg-register-bg/50 p-3 text-center">
              <p className="font-serif-display text-xl font-semibold text-register-navy">{s.value}</p>
              <p className="text-[11px] text-register-ink/55">{s.label}</p>
            </div>
          ))}
        </div>

        {(ws.start_date || ws.end_date) && (
          <div className="mt-5 rounded-sm border border-dashed border-register-line px-3 py-2 text-xs text-register-ink/60">
            Milestones: {ws.start_date ? `started ${ws.start_date}` : "no start date set"}
            {ws.end_date ? `, target completion ${ws.end_date}` : ""}.
          </div>
        )}
      </div>

      <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Members</h3>
          <button onClick={() => goTo("members")} className="text-xs font-medium text-register-navy/70 hover:text-register-navy hover:underline">
            View all
          </button>
        </div>
        <ul className="space-y-2">
          {ws.members.slice(0, 6).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-register-ink/80">{m.full_name ?? m.email}</span>
              <span className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${ROLE_BADGE_STYLE[m.role] ?? ""}`}>{roleLabel(m.role)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Active tasks</h3>
          <button onClick={() => goTo("board")} className="text-xs font-medium text-register-navy/70 hover:text-register-navy hover:underline">
            Open board
          </button>
        </div>
        {activeTasks.length === 0 ? (
          <p className="text-xs text-register-ink/50">No open tasks. Add one on the Research Board tab.</p>
        ) : (
          <ul className="space-y-2">
            {activeTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-register-ink/80">{t.title}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-register-ink/40">{t.status === "in_progress" ? "In progress" : "To do"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Recent documents</h3>
          <button onClick={() => goTo("documents")} className="text-xs font-medium text-register-navy/70 hover:text-register-navy hover:underline">
            Open evidence
          </button>
        </div>
        {recentDocs.length === 0 ? (
          <p className="text-xs text-register-ink/50">No evidence linked yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentDocs.map((d) => (
              <li key={d.link_id} className="truncate text-sm text-register-ink/80">
                {d.document?.title ?? "Untitled"}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card lg:col-span-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Recent activity</h3>
          <button onClick={() => goTo("activity")} className="text-xs font-medium text-register-navy/70 hover:text-register-navy hover:underline">
            View full timeline
          </button>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-register-ink/50">Nothing has happened in this workspace yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 border-b border-dashed border-register-line/70 pb-2 last:border-0 last:pb-0">
                <span className="text-register-ink/75">
                  <span className="font-medium text-register-navy">{a.actor_name}</span> {a.detail ?? a.action}
                </span>
                <span className="shrink-0 text-[11px] text-register-ink/40">{timeAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
