"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import { useAreaContext } from "@/components/gov/area-context";
import type { ReportOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

const STATUS_STYLE: Record<string, string> = {
  draft: "border-register-lineStrong text-register-ink/60 bg-register-bg",
  final: "border-register-official/40 text-register-official bg-register-official/[0.07]",
  pending_review: "border-register-sample/40 text-register-sample bg-register-sample/[0.08]",
  approved: "border-register-official/40 text-register-official bg-register-official/[0.07]",
  rejected: "border-red-300 text-red-700 bg-red-50",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${STATUS_STYLE[status] ?? STATUS_STYLE.draft}`}>
      {status.replace("_", " ")}
    </span>
  );
}

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
        Build a report by adding sections that reference real documents and indicators, or upload a
        document from an Area Intelligence page to get a draft automatically. Reports created from an
        upload arrive here <strong>Pending review</strong> — approve one to publish it to Evidence &amp;
        Research, or reject it with a reason.
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
                <p className="mt-1 flex items-center gap-2 text-xs text-register-ink/50">
                  <StatusPill status={r.status} />
                  <span>{r.section_count} section(s)</span>
                  {r.source_document_id && <span>· from an uploaded document</span>}
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
