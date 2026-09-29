import type { SchemeOut } from "@/lib/gov/types";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";

/** Full scheme card -- eligibility, benefits, required documents, application process, source, last-verified. */
export function SchemeCard({ s }: { s: SchemeOut }) {
  return (
    <article className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif-display text-lg font-semibold text-register-navy">{s.name}</h3>
          <p className="text-xs text-register-ink/50">
            {s.department}
            {s.launch_year ? ` · Launched ${s.launch_year}` : ""}
            {s.scheme_type ? ` · ${s.scheme_type}` : ""}
          </p>
        </div>
        <DataStatusBadge status={s.data_status} />
      </div>

      <p className="mt-3 text-sm text-register-ink/80">{s.description}</p>

      {s.status_note && (
        <p className="mt-2 rounded-sm border border-dashed border-register-line bg-register-bg/60 px-3 py-2 text-xs text-register-ink/70">
          {s.status_note}
          {s.as_of_date ? <span className="ml-1 text-register-ink/40">(as of {s.as_of_date})</span> : null}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-register-line pt-3 text-sm sm:grid-cols-2">
        {s.eligibility && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Eligibility</dt>
            <dd className="mt-0.5 text-register-ink/80">{s.eligibility}</dd>
          </div>
        )}
        {s.benefits && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Benefits</dt>
            <dd className="mt-0.5 text-register-ink/80">{s.benefits}</dd>
          </div>
        )}
        {s.required_documents && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Documents needed (general guidance)</dt>
            <dd className="mt-0.5 text-register-ink/80">{s.required_documents}</dd>
          </div>
        )}
        {s.application_process && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">How to apply</dt>
            <dd className="mt-0.5 text-register-ink/80">{s.application_process}</dd>
          </div>
        )}
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-register-line pt-3">
        <a href={s.source_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-register-navy underline">
          Official source &#8599;
        </a>
        {s.last_verified && <span className="text-[11px] text-register-ink/45">Last verified {s.last_verified}</span>}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-register-ink/40">
        Scheme rules change -- always confirm current eligibility, benefits and process at the official link above.
      </p>
    </article>
  );
}
