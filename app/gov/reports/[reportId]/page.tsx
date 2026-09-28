"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import type { ReportDetailOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function Inner() {
  const params = useParams<{ reportId: string }>();
  const reportId = params.reportId;
  const [report, setReport] = useState<ReportDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  function refresh() {
    if (!reportId) return Promise.resolve();
    return api.getReport(reportId).then(setReport);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!reportId || !title.trim()) return;
    setSaving(true);
    try {
      await api.addReportSection(reportId, { section_type: "note", title: title.trim(), content: content.trim() || undefined });
      setTitle("");
      setContent("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sectionId: string) {
    if (!reportId) return;
    await api.deleteReportSection(reportId, sectionId);
    await refresh();
  }

  async function handleFinalize() {
    if (!reportId) return;
    setFinalizing(true);
    try {
      await api.finalizeReport(reportId);
      await refresh();
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-40 w-full" />
      </DashboardShell>
    );
  }

  if (!report) {
    return (
      <DashboardShell>
        <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Report not found, or you don't have access to it.
        </p>
      </DashboardShell>
    );
  }

  const isDraft = report.status === "draft";

  return (
    <DashboardShell>
      <Link href="/gov/reports" className="text-xs font-medium text-register-navy/70 hover:text-register-navy hover:underline">
        ← All reports
      </Link>
      <div className="mt-1 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif-display text-2xl font-semibold text-register-navy">{report.title}</h2>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-sm border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${
              isDraft ? "border-register-sample/40 text-register-sample" : "border-register-official/40 text-register-official"
            }`}
          >
            {report.status}
          </span>
          {isDraft && (
            <button
              onClick={handleFinalize}
              disabled={finalizing || report.sections.length === 0}
              className="rounded-sm bg-register-navy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-register-navy2 disabled:cursor-not-allowed disabled:bg-register-ink/20"
              title={report.sections.length === 0 ? "Add at least one section first" : undefined}
            >
              {finalizing ? "Finalizing…" : "Finalize report"}
            </button>
          )}
        </div>
      </div>

      {isDraft && (
        <form
          onSubmit={handleAdd}
          className="mb-6 space-y-3 rounded-sm border border-register-line bg-register-panel p-5 shadow-card"
        >
          <h3 className="font-serif-display text-base font-semibold text-register-navy">Add a section</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Section title"
            required
            className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content (optional)"
            rows={3}
            className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          />
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:cursor-not-allowed disabled:bg-register-ink/20"
          >
            {saving ? "Adding…" : "Add section"}
          </button>
        </form>
      )}

      {report.sections.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No sections yet.
        </p>
      ) : (
        <ol className="space-y-4">
          {report.sections.map((s, idx) => (
            <li key={s.id} className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-serif-display text-base font-semibold text-register-navy">
                  {idx + 1}. {s.title}
                </h4>
                {isDraft && (
                  <button onClick={() => handleDelete(s.id)} className="shrink-0 text-xs text-register-ink/40 hover:text-red-600">
                    Remove
                  </button>
                )}
              </div>
              {s.content && <p className="mt-2 text-sm text-register-ink/80">{s.content}</p>}
              <p className="mt-2 text-xs uppercase tracking-wide text-register-ink/40">{s.section_type}</p>
            </li>
          ))}
        </ol>
      )}
    </DashboardShell>
  );
}

export default function ReportDetailPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
