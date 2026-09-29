"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/gov/client";
import type { DocumentOut } from "@/lib/gov/types";
import { DataStatusBadge } from "./DataStatusBadge";
import { Skeleton } from "./Skeleton";

function DocumentTitleLink({ doc }: { doc: DocumentOut }) {
  if (doc.uploaded_document_id) {
    return (
      <button
        type="button"
        onClick={() => api.downloadUploadedFile(doc.uploaded_document_id!, doc.title).catch(() => {})}
        className="font-medium text-register-navy underline-offset-2 hover:underline"
      >
        {doc.title}
      </button>
    );
  }
  return (
    <a href={doc.source_url} target="_blank" rel="noreferrer" className="font-medium text-register-navy underline-offset-2 hover:underline">
      {doc.title}
    </a>
  );
}

export function DocumentList({ areaId, compact = false }: { areaId: string; compact?: boolean }) {
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getAreaDocuments(areaId, query || undefined)
      .then(setDocuments)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, query]);

  const visible = compact ? documents.slice(0, 3) : documents;

  return (
    <div>
      {!compact && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents by title…"
          className="mb-4 w-full max-w-sm rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm shadow-card transition-colors focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No documents found for this area.
        </p>
      ) : (
        <ul className="divide-y divide-register-line">
          {visible.map((doc) => (
            <li key={doc.id} className="py-3 transition-colors hover:bg-register-bg/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DocumentTitleLink doc={doc} />
                  <p className="mt-0.5 text-xs text-register-ink/60">
                    {doc.source_organization}
                    {doc.publication_date ? ` · ${doc.publication_date}` : ""}
                    {doc.document_type ? ` · ${doc.document_type}` : ""}
                  </p>
                  {doc.summary && !compact && (
                    <p className="mt-1.5 max-w-2xl text-sm text-register-ink/70">{doc.summary}</p>
                  )}
                </div>
                <DataStatusBadge status={doc.data_status} className="shrink-0" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
