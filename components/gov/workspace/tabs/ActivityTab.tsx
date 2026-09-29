"use client";

import type { WorkspaceDetailOut } from "@/lib/gov/types";

const ACTION_ICON: Record<string, string> = {
  workspace_created: "✨",
  task_created: "📋",
  task_status_changed: "🔁",
  task_deleted: "🗑️",
  note_added: "📝",
  file_uploaded: "📎",
  document_linked: "📚",
  gis_link_added: "🗺️",
  comment_posted: "💬",
  finding_recorded: "🔎",
  policy_note_added: "📑",
  member_added: "➕",
  member_role_changed: "🔧",
  member_removed: "➖",
};

export function ActivityTab({ ws }: { ws: WorkspaceDetailOut }) {
  return (
    <div>
      <p className="mb-4 text-sm text-register-ink/60">
        A real, chronological log of everything that has happened in this workspace — nothing here is simulated.
      </p>
      {ws.activity.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-8 text-center text-sm text-register-ink/50">
          No activity recorded yet.
        </p>
      ) : (
        <ol className="relative space-y-0 border-l border-register-line pl-6">
          {ws.activity.map((a) => (
            <li key={a.id} className="relative pb-5 last:pb-0">
              <span className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border border-register-line bg-register-panel text-xs">
                {ACTION_ICON[a.action] ?? "•"}
              </span>
              <p className="text-sm text-register-ink/85">
                <span className="font-medium text-register-navy">{a.actor_name}</span> — {a.detail ?? a.action.replace(/_/g, " ")}
              </p>
              <p className="text-[11px] text-register-ink/40">
                {new Date(a.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
