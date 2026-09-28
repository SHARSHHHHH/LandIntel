"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/gov/client";
import type { SchemeOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const [schemes, setSchemes] = useState<SchemeOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listSchemes().then(setSchemes).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Projects &amp; Schemes</h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        National land-governance programmes, each linked to its official source. Status notes are
        dated so it's clear when they were last verified.
      </p>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : schemes.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No schemes are registered yet.
        </p>
      ) : (
        <div className="space-y-4">
          {schemes.map((s) => (
            <article key={s.id} className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
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
              <a
                href={s.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs font-medium text-register-navy underline"
              >
                Official source ↗
              </a>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

export default function SchemesPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
