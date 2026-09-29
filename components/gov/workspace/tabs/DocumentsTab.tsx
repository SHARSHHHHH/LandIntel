"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut, DocumentOut } from "@/lib/gov/types";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsTab({
  ws,
  workspaceId,
  refresh,
}: {
  ws: WorkspaceDetailOut;
  workspaceId: string;
  refresh: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocumentOut[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setSearching(true);
    try {
      const rows = await api.listAllDocuments({ q: query || undefined });
      setResults(rows.filter((d) => !ws.linked_documents.some((l) => l.document?.id === d.id)).slice(0, 15));
    } finally {
      setSearching(false);
    }
  }

  async function link(documentId: string) {
    await api.linkWorkspaceDocument(workspaceId, documentId);
    setResults((prev) => (prev ? prev.filter((d) => d.id !== documentId) : prev));
    await refresh();
  }

  async function unlink(linkId: string) {
    await api.unlinkWorkspaceDocument(workspaceId, linkId);
    await refresh();
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const uploadedFiles = ws.items.filter((i) => i.item_type === "file");

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
        <h3 className="mb-1 font-serif-display text-base font-semibold text-register-navy">Link existing evidence</h3>
        <p className="mb-3 text-xs text-register-ink/60">Search the Evidence &amp; Research catalogue and link an item into this workspace — nothing is duplicated.</p>
        <form onSubmit={runSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search official documents, land records, schemes…"
            className="flex-1 rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          />
          <button type="submit" disabled={searching} className="rounded-sm bg-register-navy px-3.5 py-2 text-sm font-medium text-white hover:bg-register-navy2">
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {results && (
          <ul className="mt-3 max-h-64 divide-y divide-register-line overflow-y-auto rounded-sm border border-register-line">
            {results.length === 0 ? (
              <li className="px-3 py-3 text-xs text-register-ink/50">No matching evidence found.</li>
            ) : (
              results.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-register-ink/85">{d.title}</p>
                    <p className="text-[11px] text-register-ink/45">{d.source_organization}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <DataStatusBadge status={d.data_status} />
                    <button onClick={() => link(d.id)} className="rounded-sm border border-register-navy/30 px-2 py-1 text-xs font-medium text-register-navy hover:bg-register-navy hover:text-white">
                      Link
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
        <h3 className="mb-1 font-serif-display text-base font-semibold text-register-navy">Upload a new file</h3>
        <p className="mb-3 text-xs text-register-ink/60">Attach a survey PDF, spreadsheet or photo scoped to this workspace (up to 20 MB).</p>
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

      <div>
        <h3 className="mb-2 font-serif-display text-base font-semibold text-register-navy">Linked evidence ({ws.linked_documents.length})</h3>
        {ws.linked_documents.length === 0 ? (
          <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">No evidence linked yet.</p>
        ) : (
          <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
            {ws.linked_documents.map((l) => (
              <li key={l.link_id} className="flex items-center justify-between gap-3 px-4 py-3">
                {l.document ? (
                  <Link href={`/gov/documents/${l.document.id}`} className="min-w-0 flex-1 text-sm font-medium text-register-navy hover:underline">
                    {l.document.title}
                  </Link>
                ) : (
                  <span className="text-sm text-register-ink/50">Evidence item no longer available</span>
                )}
                <div className="flex shrink-0 items-center gap-2">
                  {l.document && <DataStatusBadge status={l.document.data_status} />}
                  <button onClick={() => unlink(l.link_id)} className="text-xs text-register-ink/40 hover:text-red-600">Unlink</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-serif-display text-base font-semibold text-register-navy">Uploaded files ({uploadedFiles.length})</h3>
        {uploadedFiles.length === 0 ? (
          <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">No files uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
            {uploadedFiles.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  onClick={() => api.downloadWorkspaceFile(workspaceId, f.id, f.file_name ?? f.title)}
                  className="truncate text-left text-sm font-medium text-register-navy hover:underline"
                >
                  {f.title}
                </button>
                <span className="shrink-0 text-xs text-register-ink/45">{formatBytes(f.file_size)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
