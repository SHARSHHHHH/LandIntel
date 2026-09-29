"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import type { DocumentDetailOut } from "@/lib/gov/types";
import type { ParcelDetailOut } from "@/lib/gov/client";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";
import { FileViewer } from "@/components/gov/evidence/FileViewer";
import { EvidenceTimeline } from "@/components/gov/evidence/EvidenceTimeline";
import { getTerminology } from "@/lib/gov/gis/adapters/terminology";

function Inner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [doc, setDoc] = useState<DocumentDetailOut | null>(null);
  const [parcel, setParcel] = useState<ParcelDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [parcelLoading, setParcelLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getDocument(id)
      .then(setDoc)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!doc?.parcel_id) {
      setParcel(null);
      return;
    }
    setParcelLoading(true);
    api
      .getParcelDetail(doc.parcel_id)
      .then(setParcel)
      .catch(() => setParcel(null))
      .finally(() => setParcelLoading(false));
  }, [doc?.parcel_id]);

  if (loading || !doc) {
    return (
      <DashboardShell>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-8 w-96" />
        <Skeleton className="mt-6 h-64 w-full" />
      </DashboardShell>
    );
  }

  const terminology = getTerminology(doc.state ?? "");

  return (
    <DashboardShell>
      <Link href="/gov/documents" className="text-xs font-medium text-register-navy/70 transition-colors hover:text-register-navy hover:underline">
        Back to Evidence &amp; Research
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-serif-display text-2xl font-semibold text-register-navy">{doc.title}</h2>
        <DataStatusBadge status={doc.data_status} />
      </div>

      {/* --- Source & verification block (required on every evidence item) --- */}
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 rounded-sm border border-register-line bg-register-panel p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Issuing authority / source</dt>
          <dd className="mt-0.5 text-register-ink/80">{doc.source_organization}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Date</dt>
          <dd className="mt-0.5 text-register-ink/80">{doc.publication_date ?? "Not dated"}</dd>
        </div>
        {doc.source_url && !doc.source_url.startsWith("/gov/documents/") && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Official URL / reference</dt>
            <dd className="mt-0.5">
              <a href={doc.source_url} target="_blank" rel="noreferrer" className="text-register-navy underline">
                {doc.source_url}
              </a>
            </dd>
          </div>
        )}
        {doc.page_ref && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Page / document number</dt>
            <dd className="mt-0.5 text-register-ink/80">{doc.page_ref}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Last verified</dt>
          <dd className="mt-0.5 text-register-ink/80">{doc.last_verified ?? "Not recorded"}</dd>
        </div>
        {doc.parcel_id && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">{terminology.parcelIdLabel}</dt>
            <dd className="mt-0.5 font-mono text-register-ink/80">{doc.parcel_id}</dd>
          </div>
        )}
      </dl>

      {doc.data_status === "SAMPLE" && (
        <p className="mt-3 rounded-sm border border-register-sample/40 bg-register-sample/[0.08] px-3 py-2 text-xs text-register-ink/70">
          This is illustrative <strong>sample</strong> data for this demo, not a real government record.
        </p>
      )}

      {/* --- Original file: authoritative, shown before the summary --- */}
      {doc.file && (
        <div className="mt-6">
          <h3 className="mb-2 font-serif-display text-base font-semibold text-register-navy">Original document</h3>
          <FileViewer documentId={doc.id} filename={doc.file.filename} mimeType={doc.file.mime_type} />
        </div>
      )}

      {/* --- AI/auto-extracted summary: secondary convenience, never the record of truth --- */}
      {doc.summary && (
        <div className="mt-6 rounded-sm border border-dashed border-register-line bg-register-bg/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-register-ink/45">
            Summary {doc.file ? "(automatic extraction -- see original document above for the authoritative text)" : ""}
          </p>
          <p className="mt-1.5 text-sm text-register-ink/75">{doc.summary}</p>
        </div>
      )}

      {doc.extracted_text && doc.extracted_text.length > (doc.summary?.length ?? 0) && (
        <details className="mt-3 rounded-sm border border-register-line bg-white p-4">
          <summary className="cursor-pointer text-xs font-medium text-register-navy">Full extracted text</summary>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-register-ink/70">
            {doc.extracted_text}
          </pre>
        </details>
      )}

      {/* --- GIS <-> Evidence linking + Evidence Timeline --- */}
      {doc.parcel_id && (
        <div id="gis" className="mt-8 rounded-sm border border-register-line bg-register-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-serif-display text-lg font-semibold text-register-navy">Linked parcel &amp; evidence timeline</h3>
            {parcel?.districtGeoId && (
              <Link
                href={`/gov/areas/${parcel.districtGeoId}/gis?parcelId=${encodeURIComponent(doc.parcel_id)}`}
                className="text-xs font-medium text-register-navy underline-offset-2 hover:underline"
              >
                View on GIS &rarr;
              </Link>
            )}
          </div>
          {parcelLoading || !parcel ? (
            <Skeleton className="mt-3 h-24 w-full" />
          ) : (
            <>
              <p className="mt-2 text-xs text-register-ink/60">
                {parcel.stateName} &rarr; {parcel.districtName} &rarr; {parcel.subDistrictName} &rarr; {parcel.villageName} &middot;{" "}
                {parcel.parcelIdLabel} {parcel.surveyNumber}
              </p>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-register-ink/70">
                  Chronological timeline: registration &rarr; mutation &rarr; ownership changes &rarr; disputes &rarr; orders &rarr; latest update
                </p>
                <EvidenceTimeline
                  history={parcel.history}
                  note="Reused from the GIS module's sample parcel history -- SAMPLE data for this demo, not a verified government record."
                />
              </div>
            </>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

export default function DocumentDetailPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
