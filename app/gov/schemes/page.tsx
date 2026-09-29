"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/gov/client";
import type { SchemeOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";
import { SchemeCard } from "@/components/gov/schemes/SchemeCard";

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
            <SchemeCard key={s.id} s={s} />
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
