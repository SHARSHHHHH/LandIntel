"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import { useAreaContext } from "@/components/gov/area-context";
import type { DashboardSummaryOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function DashboardInner() {
  const [summary, setSummary] = useState<DashboardSummaryOut | null>(null);
  const [loading, setLoading] = useState(true);
  const { setSelectedArea } = useAreaContext();

  useEffect(() => {
    api
      .getDashboardSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h2 className="font-serif-display text-2xl font-semibold text-register-navy">Dashboard</h2>
        <p className="mt-1 text-sm text-register-ink/60">
          Your overview of this workspace -- areas you've opened, saved searches, reports, and
          shared workspaces. Every figure below is a real record tied to your account.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !summary ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          Could not load your dashboard summary.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif-display text-base font-semibold text-register-navy">Recently viewed areas</h3>
              <Link href="/gov/areas/select" className="text-xs font-medium text-register-navy underline">
                Browse all areas
              </Link>
            </div>
            {summary.recent_areas.length === 0 ? (
              <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
                You haven't opened an area yet. Start from &ldquo;Browse all areas&rdquo; above.
              </p>
            ) : (
              <ul className="divide-y divide-register-line">
                {summary.recent_areas.map((ra) => (
                  <li key={ra.area.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <Link
                        href={`/gov/areas/${ra.area.id}/overview`}
                        onClick={() => setSelectedArea(ra.area)}
                        className="font-medium text-register-navy hover:underline"
                      >
                        {ra.area.name}
                      </Link>
                      <p className="text-xs capitalize text-register-ink/50">{ra.area.level}</p>
                    </div>
                    <span className="shrink-0 text-xs text-register-ink/50">Viewed {timeAgo(ra.last_viewed)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <h3 className="font-serif-display text-base font-semibold text-register-navy">Notifications</h3>
            <p className="mt-3 font-serif-display text-3xl font-semibold text-register-navy">
              {summary.unread_notification_count}
            </p>
            <p className="text-xs text-register-ink/50">unread</p>
            <Link
              href="/gov/notifications"
              className="mt-4 inline-block rounded-sm border border-register-navy/20 px-3 py-1.5 text-xs font-medium text-register-navy transition-colors hover:border-register-navy hover:bg-register-navy hover:text-white"
            >
              View all
            </Link>
          </section>

          <section className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif-display text-base font-semibold text-register-navy">Saved searches</h3>
              <Link href="/gov/documents" className="text-xs font-medium text-register-navy underline">
                Search
              </Link>
            </div>
            {summary.saved_searches.length === 0 ? (
              <p className="text-sm text-register-ink/50">No saved searches yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {summary.saved_searches.map((s) => (
                  <li key={s.id} className="rounded-sm border border-register-line px-3 py-2 text-register-ink/80">
                    {s.query || s.document_type || "Filtered search"}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif-display text-base font-semibold text-register-navy">Reports</h3>
              <Link href="/gov/reports" className="text-xs font-medium text-register-navy underline">
                All reports
              </Link>
            </div>
            {summary.recent_reports.length === 0 ? (
              <p className="text-sm text-register-ink/50">No reports yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {summary.recent_reports.map((r) => (
                  <li key={r.id}>
                    <Link href={`/gov/reports/${r.id}`} className="text-register-navy hover:underline">
                      {r.title}
                    </Link>
                    <span className="ml-2 text-xs uppercase tracking-wide text-register-ink/40">{r.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif-display text-base font-semibold text-register-navy">Workspaces</h3>
              <Link href="/gov/workspaces" className="text-xs font-medium text-register-navy underline">
                All workspaces
              </Link>
            </div>
            {summary.workspaces.length === 0 ? (
              <p className="text-sm text-register-ink/50">No shared workspaces yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {summary.workspaces.map((w) => (
                  <li key={w.id}>
                    <Link href={`/gov/workspaces/${w.id}`} className="text-register-navy hover:underline">
                      {w.name}
                    </Link>
                    <span className="ml-2 text-xs text-register-ink/40">{w.item_count} item(s)</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
