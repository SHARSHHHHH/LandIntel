"use client";

import Link from "next/link";
import type { ParcelDetail } from "@/lib/gov/gis/types";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { EvidenceTimeline } from "@/components/gov/evidence/EvidenceTimeline";

const DISPUTE_LABEL: Record<ParcelDetail["disputeStatus"], { label: string; className: string }> = {
  none: { label: "No dispute on record", className: "text-register-official" },
  open: { label: "Dispute open", className: "text-register-sample" },
  closed: { label: "Dispute closed", className: "text-register-derived" },
};

const MUTATION_LABEL: Record<ParcelDetail["mutationStatus"], string> = {
  no_mutation: "No mutation recorded",
  mutation_pending: "Mutation pending",
  mutated: "Mutated (ownership transferred)",
};

export function ParcelPanel({ parcel, loading, onClose }: { parcel: ParcelDetail | null; loading: boolean; onClose: () => void }) {
  if (!loading && !parcel) return null;

  return (
    <div className="rounded-sm border border-register-line bg-register-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif-display text-lg font-semibold text-register-navy">Parcel record</h3>
        <div className="flex items-center gap-3">
          {parcel && (
            <Link
              href={`/gov/documents?tab=land-records&parcelId=${encodeURIComponent(parcel.id)}`}
              className="text-xs font-medium text-register-navy underline-offset-2 hover:underline"
            >
              View supporting evidence &rarr;
            </Link>
          )}
          <button onClick={onClose} className="text-xs font-medium text-register-ink/50 hover:text-register-navy hover:underline">
            Close
          </button>
        </div>
      </div>

      {loading || !parcel ? (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-48 animate-shimmer rounded-sm bg-register-line/40" />
          <div className="h-24 animate-shimmer rounded-sm bg-register-line/40" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-register-ink/50">
                {parcel.stateName} &rarr; {parcel.districtName} &rarr; {parcel.subDistrictName} &rarr; {parcel.villageName}
              </p>
              <p className="mt-1 font-serif-display text-xl font-semibold text-register-navy">
                {parcel.parcelIdLabel} {parcel.surveyNumber}
              </p>
              <p className="mt-1 text-xs text-register-ink/60">Record ID: {parcel.recordId}</p>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-register-ink/50">Area</dt>
              <dd className="font-medium text-register-navy">{parcel.areaHectares} ha</dd>
              <dt className="text-register-ink/50">Land use</dt>
              <dd className="font-medium text-register-navy">{parcel.landUse}</dd>
              <dt className="text-register-ink/50">Mutation status</dt>
              <dd className="font-medium text-register-navy">{MUTATION_LABEL[parcel.mutationStatus]}</dd>
              <dt className="text-register-ink/50">Dispute/case status</dt>
              <dd className={`font-medium ${DISPUTE_LABEL[parcel.disputeStatus].className}`}>
                {DISPUTE_LABEL[parcel.disputeStatus].label}
              </dd>
            </dl>

            <div>
              <p className="text-xs font-medium text-register-ink/70">Recorded ownership (sample)</p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {parcel.owners.map((o, i) => (
                  <li key={i} className="text-register-navy">
                    {o.name} <span className="text-register-ink/50">&middot; {o.share}</span>
                  </li>
                ))}
              </ul>
            </div>

            {parcel.extraFields.length > 0 && (
              <div>
                <p className="text-xs font-medium text-register-ink/70">
                  State-specific fields ({parcel.stateName})
                </p>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {parcel.extraFields.map((f, i) => (
                    <li key={i} className="text-register-navy">
                      {f.label}: <span className="font-normal text-register-ink/70">{f.value}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-register-ink/40">
                  Not every state's adapter reports the same fields &mdash; this field set is specific to {parcel.stateName}.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-sm border border-register-line/60 bg-white px-3 py-2 text-xs">
              <DataStatusBadge status={parcel.provenance.data_status} />
              <span className="text-register-ink/60">
                {parcel.provenance.source_name}
                {parcel.provenance.as_of_date ? ` · as of ${parcel.provenance.as_of_date}` : ""}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-register-ink/50">{parcel.provenance.note}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-register-ink/70">Land history &amp; mutation timeline (sample)</p>
            <div className="mt-2">
              <EvidenceTimeline history={parcel.history} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
