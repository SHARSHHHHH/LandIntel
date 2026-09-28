"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import { useAreaContext } from "@/components/gov/area-context";
import type { ReportOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const [reports, setReports] = useState<ReportOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const { selectedArea } = useAreaContext();

  function refresh() {
    return api.listReports().then(setReports);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.createReport({ title: title.trim(), geographic_unit_id: selectedArea?.id });
      setTitle("");
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Reports &amp; Insights</h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        Build a report by adding sections that reference real documents and indicators. Reports
        stay in draft until you explicitly finalize them.
      </p>

      <form
        onSubmit={handleCreate}
        className="mb-8 grid grid-cols-1 gap-3 rounded-sm border border-register-line bg-register-panel p-5 shadow-card sm:grid-cols-[1fr_auto]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Report title"
          required
          className="rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="rounded-sm bg-register-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:cursor-not-allowed disabled:bg-register-ink/20"
        >
          {creating ? "Creating…" : "New report"}
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : reports.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No reports yet. Create one above.
        </p>
      ) : (
        <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <Link href={`/gov/reports/${r.id}`} className="font-medium text-register-navy hover:underline">
                  {r.title}
                </Link>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-register-ink/40">
                  {r.status} · {r.section_count} section(s)
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

export default function ReportsPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
