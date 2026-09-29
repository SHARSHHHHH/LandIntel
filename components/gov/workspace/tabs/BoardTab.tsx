"use client";

import { useState } from "react";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut, WorkspaceTaskOut, DirectoryUserOut } from "@/lib/gov/types";
import { TASK_STATUSES } from "../constants";

const COLUMN_STYLE: Record<string, string> = {
  todo: "border-register-line",
  in_progress: "border-register-derived/40",
  done: "border-register-official/40",
};

function TaskCard({
  t,
  onStatusChange,
  onDelete,
}: {
  t: WorkspaceTaskOut;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  const overdue = t.due_date && t.status !== "done" && new Date(t.due_date) < new Date(new Date().toDateString());
  return (
    <div className="rounded-sm border border-register-line bg-register-panel p-3 shadow-card">
      <p className="text-sm font-medium text-register-ink/90">{t.title}</p>
      {t.description && <p className="mt-1 text-xs text-register-ink/60">{t.description}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-register-ink/50">
        {t.assignee_name && <span className="rounded-sm border border-register-line bg-register-bg px-1.5 py-0.5">{t.assignee_name}</span>}
        {t.due_date && (
          <span className={`rounded-sm border px-1.5 py-0.5 ${overdue ? "border-red-300 bg-red-50 text-red-700" : "border-register-line bg-register-bg"}`}>
            Due {t.due_date}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <select
          value={t.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-sm border border-register-line bg-white px-2 py-1 text-xs focus:border-register-navy focus:outline-none"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button onClick={onDelete} className="text-[11px] text-register-ink/35 hover:text-red-600">Remove</button>
      </div>
    </div>
  );
}

export function BoardTab({
  ws,
  workspaceId,
  users,
  refresh,
}: {
  ws: WorkspaceDetailOut;
  workspaceId: string;
  users: DirectoryUserOut[];
  refresh: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.createWorkspaceTask(workspaceId, {
        title: title.trim(),
        description: description.trim() || undefined,
        assignee_id: assigneeId || undefined,
        due_date: dueDate || undefined,
      });
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setDueDate("");
      setShowForm(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(taskId: string, status: string) {
    await api.updateWorkspaceTask(workspaceId, taskId, { status });
    await refresh();
  }

  async function deleteTask(taskId: string) {
    await api.deleteWorkspaceTask(workspaceId, taskId);
    await refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-register-ink/60">
          {ws.tasks.length} task{ws.tasks.length === 1 ? "" : "s"} · move work through To Do → In Progress → Done.
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-sm bg-register-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-register-navy2"
        >
          {showForm ? "Cancel" : "+ New task"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 grid gap-3 rounded-sm border border-register-line bg-register-panel p-4 shadow-card sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            className="rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none sm:col-span-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none sm:col-span-2"
          />
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-sm bg-register-navy px-3 py-2 text-sm font-medium text-white hover:bg-register-navy2 disabled:opacity-50 sm:col-span-2"
          >
            {saving ? "Adding…" : "Add task"}
          </button>
        </form>
      )}

      {ws.tasks.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-8 text-center text-sm text-register-ink/50">
          No tasks yet. Add the first one above.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {TASK_STATUSES.map((col) => (
            <div key={col.value} className={`rounded-sm border-t-2 bg-register-bg/40 p-3 ${COLUMN_STYLE[col.value]}`}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-register-ink/50">
                {col.label} ({ws.tasks.filter((t) => t.status === col.value).length})
              </p>
              <div className="space-y-2">
                {ws.tasks
                  .filter((t) => t.status === col.value)
                  .map((t) => (
                    <TaskCard key={t.id} t={t} onStatusChange={(s) => updateStatus(t.id, s)} onDelete={() => deleteTask(t.id)} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
