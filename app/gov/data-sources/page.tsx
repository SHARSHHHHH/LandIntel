"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { api } from "@/lib/gov/client";
import type { SourceOut } from "@/lib/gov/types";
import { RequireAuth } from "@/components/gov/RequireAuth";

const STATUS_LABEL: Record<SourceOut["status"], { label: string; color: string; dot: string }> = {
  live: { label: "Live", color: "text-register-official", dot: "bg-register-official" },
  unconfigured: { label: "Not configured", color: "text-register-ink/50", dot: "bg-register-ink/30" },
  sample_only: { label: "Sample only", color: "text-register-sample", dot: "bg-register-sample" },
  deprecated: { label: "Deprecated", color: "text-red-700", dot: "bg-red-600" },
};

function Inner() {
  const [sources, setSources] = useState<SourceOut[]>([]);

  useEffect(() => {
    api.listDataSources().then(setSources);
  }, []);

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Data sources</h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        Every source the platform can draw from, and whether it's currently live, sample-only, or
        waiting on configuration (an API key in <code className="rounded bg-register-line/50 px-1">.env</code>).
      </p>

      <div className="overflow-hidden rounded-sm border border-register-line bg-register-panel shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-register-line bg-register-bg/60 text-xs uppercase tracking-wide text-register-ink/50">
            <tr>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-register-line">
            {sources.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-register-bg/50">
                <td className="px-4 py-3 font-medium">
                  {s.base_url ? (
                    <a href={s.base_url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </td>
                <td className="px-4 py-3 text-register-ink/70">{s.provider}</td>
                <td className="px-4 py-3 text-register-ink/70">{s.access_type}</td>
                <td className="px-4 py-3 text-register-ink/70">{s.license ?? "—"}</td>
                <td className={`px-4 py-3 font-medium ${STATUS_LABEL[s.status].color}`}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_LABEL[s.status].dot}`} />
                    {STATUS_LABEL[s.status].label}
                  </span>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-register-ink/50">
                  No data sources registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

export default function DataSourceDetailPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
