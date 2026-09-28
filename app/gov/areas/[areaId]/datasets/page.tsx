"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { api } from "@/lib/gov/client";
import type { IndicatorValueOut } from "@/lib/gov/types";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const params = useParams<{ areaId: string }>();
  const areaId = params.areaId;
  const [indicators, setIndicators] = useState<IndicatorValueOut[]>([]);

  useEffect(() => {
    if (!areaId) return;
    api.getAreaIndicators(areaId).then(setIndicators);
  }, [areaId]);

  if (!areaId) return null;

  const byDataset = new Map<string, IndicatorValueOut[]>();
  for (const ind of indicators) {
    const key = ind.dataset.id;
    if (!byDataset.has(key)) byDataset.set(key, []);
    byDataset.get(key)!.push(ind);
  }

  return (
    <DashboardShell>
      <Link href={`/gov/areas/${areaId}/overview`} className="text-xs font-medium text-register-navy hover:underline">
        ← Back to overview
      </Link>
      <h2 className="mt-1 mb-6 font-serif-display text-2xl font-semibold text-register-navy">
        Datasets behind this area
      </h2>

      <div className="space-y-6">
        {Array.from(byDataset.entries()).map(([datasetId, values]) => {
          const ds = values[0].dataset;
          return (
            <div key={datasetId} className="rounded-sm border border-register-line bg-register-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif-display text-lg font-semibold text-register-navy">{ds.name}</h3>
                  <p className="mt-1 text-xs text-register-ink/60">
                    {ds.source?.name} · {ds.source?.provider}
                    {ds.reference_year ? ` · reference year ${ds.reference_year}` : ""}
                  </p>
                </div>
                <DataStatusBadge status={ds.data_status} />
              </div>

              {ds.limitations && (
                <p className="mt-3 rounded-sm bg-register-bg px-3 py-2 text-xs text-register-ink/70">
                  <span className="font-medium">Limitations: </span>
                  {ds.limitations}
                </p>
              )}

              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-register-ink/50">
                  <tr>
                    <th className="py-1.5 pr-4">Field</th>
                    <th className="py-1.5 pr-4">Value</th>
                    <th className="py-1.5">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-register-line">
                  {values.map((v) => (
                    <tr key={v.id}>
                      <td className="py-1.5 pr-4">{v.indicator_name}</td>
                      <td className="py-1.5 pr-4 font-medium">
                        {v.value_text ?? v.value?.toLocaleString("en-IN") ?? "—"}
                      </td>
                      <td className="py-1.5 text-register-ink/60">{v.unit ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {byDataset.size === 0 && (
          <p className="text-sm text-register-ink/50">No datasets available for this area yet.</p>
        )}
      </div>
    </DashboardShell>
  );
}

export default function DatasetDetailPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
