"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Inner() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const [workspace, setWorkspace] = useState<WorkspaceDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    if (!workspaceId) return Promise.resolve();
    return api.getWorkspace(workspaceId).then(setWorkspace);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !title.trim()) return;
    setSaving(true);
    try {
      await api.addWorkspaceItem(workspaceId, { item_type: "note", title: title.trim(), content: content.trim() || undefined });
      setTitle("");
      setContent("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    if (!workspaceId) return;
    await api.deleteWorkspaceItem(workspaceId, itemId);
    await refresh();
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!workspaceId || !file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadWorkspaceFile(workspaceId, file);
      await refresh();
    } catch {
      setUploadError("Upload failed. The file may be too large (20 MB limit) or the connection dropped.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(itemId: string, fileName: string) {
    if (!workspaceId) return;
    await api.downloadWorkspaceFile(workspaceId, itemId, fileName);
  }

  if (loading) {
    return (
      <DashboardShell>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-40 w-full" />
      </DashboardShell>
    );
  }

  if (!workspace) {
    return (
      <DashboardShell>
        <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Workspace not found, or you don't have access to it.
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Link href="/gov/workspaces" className="text-xs font-medium text-register-navy/70 hover:text-register-navy hover:underline">
        ← All workspaces
      </Link>
      <h2 className="mt-1 mb-1 font-serif-display text-2xl font-semibold text-register-navy">{workspace.name}</h2>
      {workspace.description && <p className="mb-6 max-w-2xl text-sm text-register-ink/60">{workspace.description}</p>}

      <form
        onSubmit={handleAdd}
        className="mb-6 space-y-3 rounded-sm border border-register-line bg-register-panel p-5 shadow-card"
      >
        <h3 className="font-serif-display text-base font-semibold text-register-navy">Add a note</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content (optional)"
          rows={3}
          className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:cursor-not-allowed disabled:bg-register-ink/20"
        >
          {saving ? "Adding…" : "Add item"}
        </button>
      </form>

      <div className="mb-6 rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
        <h3 className="mb-1 font-serif-display text-base font-semibold text-register-navy">Upload a file</h3>
        <p className="mb-3 text-xs text-register-ink/60">
          Attach a survey PDF, spreadsheet, photo, or any other real document to this workspace (up to 20 MB).
        </p>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChosen}
          disabled={uploading}
          className="block w-full text-sm text-register-ink/70 file:mr-3 file:rounded-sm file:border file:border-register-navy/20 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-register-navy hover:file:border-register-navy disabled:opacity-50"
        />
        {uploading && <p className="mt-2 text-xs text-register-ink/50">Uploading…</p>}
        {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
      </div>

      {workspace.items.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No items yet.
        </p>
      ) : (
        <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
          {workspace.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                {item.item_type === "file" ? (
                  <button
                    onClick={() => handleDownload(item.id, item.file_name ?? item.title)}
                    className="text-left font-medium text-register-navy underline-offset-2 hover:underline"
                  >
                    {item.title}
                  </button>
                ) : (
                  <p className="font-medium text-register-ink/90">{item.title}</p>
                )}
                {item.content && <p className="mt-1 text-sm text-register-ink/70">{item.content}</p>}
                <p className="mt-1 text-xs uppercase tracking-wide text-register-ink/40">
                  {item.item_type}
                  {item.item_type === "file" && item.file_size !== null ? ` · ${formatBytes(item.file_size)}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="shrink-0 text-xs text-register-ink/40 hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
