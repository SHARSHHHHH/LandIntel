import type { KpiCard } from "@/lib/admin/overview-types";
import { ProvenanceChip, toneAccent } from "@/components/admin/OverviewBits";

export function OverviewKpis({ kpis }: { kpis: KpiCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          className={`flex min-w-0 flex-col justify-between border border-register-line border-l-2 bg-register-panel px-3.5 py-3 shadow-card ${toneAccent[kpi.tone]}`}
        >
          <p className="text-[9.5px] font-semibold uppercase leading-tight tracking-[0.1em] text-register-ink/55">
            {kpi.label}
          </p>
          <p className="mt-2 font-serif-display text-[26px] font-semibold leading-none tabular-nums text-register-navy">
            {kpi.value}
          </p>
          <p className="mt-1.5 line-clamp-2 min-h-[26px] text-[10.5px] leading-snug text-register-ink/55">{kpi.sub}</p>
          <div className="mt-2">
            <ProvenanceChip value={kpi.provenance} />
          </div>
        </div>
      ))}
    </div>
  );
}
