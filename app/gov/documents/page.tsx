"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/gov/client";
import type { DocumentOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [query, setQuery] = useState("");
  const [docType, setDocType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .listAllDocuments({ q: query || undefined, document_type: docType || undefined })
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, [query, docType]);

  async function handleSaveSearch() {
    await api.createSavedSearch({ query: query || undefined, document_type: docType || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Evidence &amp; Research</h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        Search official documents, notifications and publications across every registered area.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-register-ink/80">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title…"
            className="w-72 rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-register-ink/80">Document type</span>
          <input
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            placeholder="e.g. notification"
            className="w-56 rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          />
        </label>
        <button
          onClick={handleSaveSearch}
          disabled={!query && !docType}
          className="rounded-sm border border-register-navy/20 px-3 py-2.5 text-sm font-medium text-register-navy transition-colors hover:border-register-navy hover:bg-register-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved ? "Saved ✓" : "Save this search"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : documents.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No documents match this search.
        </p>
      ) : (
        <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
          {documents.map((doc) => (
            <li key={doc.id} className="px-5 py-4 transition-colors hover:bg-register-bg/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <a
                    href={doc.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-register-navy underline-offset-2 hover:underline"
                  >
                    {doc.title}
                  </a>
                  <p className="mt-0.5 text-xs text-register-ink/60">
                    {doc.source_organization}
                    {doc.publication_date ? ` · ${doc.publication_date}` : ""}
                    {doc.document_type ? ` · ${doc.document_type}` : ""}
                  </p>
                  {doc.summary && <p className="mt-1.5 max-w-2xl text-sm text-register-ink/70">{doc.summary}</p>}
                </div>
                <DataStatusBadge status={doc.data_status} className="shrink-0" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

export default function DocumentsPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
