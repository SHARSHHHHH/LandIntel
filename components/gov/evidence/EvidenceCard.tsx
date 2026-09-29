"use client";

import Link from "next/link";
import type { DocumentOut } from "@/lib/gov/types";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { getTerminology } from "@/lib/gov/gis/adapters/terminology";

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  ror: "Record of Rights (RoR)",
  mutation: "Mutation record",
  survey_map: "Cadastral / survey map",
  property_card: "Property card",
  registration_deed: "Registration / deed record",
  case_record: "Sample court/revenue case record",
  act: "Act",
  act_scheme: "Scheme (statutory programme)",
  identifier_scheme: "Identifier scheme",
  scheme: "Scheme",
  evidence: "Approved report",
};

/** One evidence item row, used across every Evidence & Research submodule tab. */
export function EvidenceCard({ doc }: { doc: DocumentOut }) {
  const isInternalDetail = !doc.source_url || doc.source_url.startsWith("/gov/documents/");
  const parcelLabel = doc.parcel_id ? getTerminology(doc.state ?? "").parcelIdLabel : null;

  return (
    <li className="px-5 py-4 transition-colors hover:bg-register-bg/60">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={`/gov/documents/${doc.id}`} className="font-medium text-register-navy underline-offset-2 hover:underline">
            {doc.title}
          </Link>
          <p className="mt-0.5 text-xs text-register-ink/60">
            {doc.source_organization}
            {doc.publication_date ? ` · ${doc.publication_date}` : ""}
            {doc.document_type ? ` · ${DOCUMENT_TYPE_LABEL[doc.document_type] ?? doc.document_type}` : ""}
          </p>
          {doc.summary && <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-register-ink/70">{doc.summary}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-register-ink/45">
            {!isInternalDetail && (
              <a href={doc.source_url} target="_blank" rel="noreferrer" className="text-register-navy underline">
                Official source &#8599;
              </a>
            )}
            {doc.last_verified && <span>Last verified {doc.last_verified}</span>}
            {doc.page_ref && <span>Ref: {doc.page_ref}</span>}
            {parcelLabel && <span>{parcelLabel} record</span>}
            {doc.parcel_id && (
              <Link href={`/gov/documents/${doc.id}#gis`} className="font-medium text-register-navy underline">
                View on GIS &rarr;
              </Link>
            )}
          </div>
        </div>
        <DataStatusBadge status={doc.data_status} className="shrink-0" />
      </div>
    </li>
  );
}
