"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import type { UploadedDocumentOut, UploadedDocumentStatus } from "@/lib/gov/types";

const STATUS_CONFIG: Record<UploadedDocumentStatus, { label: string; className: string }> = {
  processing: { label: "Processing", className: "border-register-derived/40 text-register-derived bg-register-derived/[0.07]" },
  pending_review: { label: "Pending review", className: "border-register-sample/40 text-register-sample bg-register-sample/[0.08]" },
  approved: { label: "Approved", className: "border-register-official/40 text-register-official bg-register-official/[0.07]" },
  rejected: { label: "Rejected", className: "border-red-300 text-red-700 bg-red-50" },
};

export function UploadStatusBadge({ status }: { status: UploadedDocumentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({
  areaId,
  uploads,
  onUploaded,
}: {
  areaId: string;
  uploads: UploadedDocumentOut[];
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReportId, setLastReportId] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    setLastReportId(null);
    try {
      const result = await api.uploadAreaDocument(areaId, file);
      setLastReportId(result.report.id);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-sm border border-register-navy/25 bg-white px-3 py-2 text-xs font-medium text-register-navy transition-colors hover:border-register-navy hover:bg-register-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading & reading…" : "Attach a document (PDF / DOCX / TXT)"}
        </button>
        {lastReportId && !uploading && (
          <Link href={`/gov/reports/${lastReportId}`} className="text-xs font-medium text-register-official underline">
            Draft report ready — review it →
          </Link>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-register-ink/50">
        Uploads are read automatically and turned into a draft report on Reports &amp; Insights for a gov officer to
        approve or reject. Approved reports become evidence items for this district.
      </p>

      {uploads.length > 0 && (
        <ul className="mt-4 divide-y divide-register-line rounded-sm border border-register-line">
          {uploads.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-register-ink/85">{u.filename}</p>
                <p className="text-xs text-register-ink/50">
                  {formatSize(u.file_size)}
                  {u.report_id ? (
                    <>
                      {" · "}
                      <Link href={`/gov/reports/${u.report_id}`} className="text-register-navy underline">
                        view draft report
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <UploadStatusBadge status={u.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
