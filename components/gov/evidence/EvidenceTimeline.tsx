import type { ParcelHistoryEntry } from "@/lib/gov/gis/types";

/**
 * Chronological evidence timeline (registration -> mutation -> ownership
 * changes -> disputes -> orders -> latest update), reused wherever a
 * parcel's history needs to be shown: inline in the GIS module's Parcel
 * panel, and on the Evidence & Research hub's parcel/document detail views.
 */
export function EvidenceTimeline({ history, note }: { history: ParcelHistoryEntry[]; note?: string }) {
  if (history.length === 0) {
    return <p className="text-xs text-register-ink/50">No timeline events recorded for this parcel.</p>;
  }
  return (
    <div>
      <ol className="space-y-3 border-l border-register-line pl-4">
        {history.map((h, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-register-navy" />
            <p className="text-xs font-semibold text-register-navy">
              {h.year} &mdash; {h.event}
            </p>
            <p className="text-xs text-register-ink/60">{h.note}</p>
            {h.documentRef && (
              <p className="mt-0.5 text-[11px] text-register-ink/40">
                Document/record reference: <span className="font-mono">{h.documentRef}</span> (fictitious reference for this demo)
              </p>
            )}
          </li>
        ))}
      </ol>
      {note && <p className="mt-2 text-[11px] leading-relaxed text-register-ink/50">{note}</p>}
    </div>
  );
}
