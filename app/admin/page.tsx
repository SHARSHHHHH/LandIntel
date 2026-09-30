"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { clearToken, getToken } from "@/lib/gov/client";
import type { OverviewResponse } from "@/lib/admin/overview-types";
import { ProvenanceChip, SectionHeading, formatDateOnly, formatWhen } from "@/components/admin/OverviewBits";
import { OverviewKpis } from "@/components/admin/OverviewKpis";
import { StateSituation } from "@/components/admin/StateSituation";
import { IssueMonitor, ResearchImpactPanel, SchemesPanel } from "@/components/admin/OverviewPanels";
import { AttentionPanel, QuickAdminNav, RecentActivity } from "@/components/admin/OverviewOps";

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.assign("/gov/login");
    throw new Error("Session expired");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.detail || `Request failed (${res.status})`);
  return body as T;
}

function ErrorPanel({ message }: { message: string }) {
  const permissionIssue = message.includes("Missing required permission");
  return (
    <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <p>{permissionIssue ? "Your account does not have permission to use the Admin portal." : message}</p>
      {permissionIssue && <p className="mt-1 text-xs text-red-600">{message}</p>}
    </div>
  );
}

function SourceAsOf({ label, date }: { label: string; date: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-register-panel/25 bg-register-panel/10 px-2 py-0.5 text-[10px] font-medium tracking-wide">
      <span className="uppercase tracking-[0.1em] text-register-panel/60">{label}</span>
      <span className="tabular-nums">{date ? formatDateOnly(date) : "—"}</span>
    </span>
  );
}

function Header({ data }: { data: OverviewResponse | null }) {
  return (
    <header className="relative mb-6 overflow-hidden border border-register-navy bg-register-navy px-5 py-4 text-register-panel shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 15px, rgba(255,255,255,0.5) 15px 16px), repeating-linear-gradient(90deg, transparent 0 15px, rgba(255,255,255,0.5) 15px 16px)",
        }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.28em] text-register-ochre">
            Admin portal · command view
          </p>
          <h2 className="mt-1 font-serif-display text-xl font-semibold leading-tight sm:text-2xl">
            National Land-Governance Command Dashboard
          </h2>
          <p className="mt-1 max-w-2xl text-[11.5px] leading-snug text-register-panel/70">
            Consolidated oversight across official government scheme data (gov seed), student research records
            (demo/sample), and the illustrative public state atlas (sample statistics). Figures are labelled by
            source — nothing here implies nationwide live coverage.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-1.5">
            <SourceAsOf label="Gov" date={data?.meta.sourceAsOf.gov ?? null} />
            <SourceAsOf label="Research" date={data?.meta.sourceAsOf.research ?? null} />
            <SourceAsOf label="Public" date={data?.meta.sourceAsOf.public ?? null} />
          </div>
          <p className="text-[10px] tabular-nums text-register-panel/55">
            {data ? `Generated ${formatWhen(data.meta.generatedAt)}` : "Loading consolidated view…"}
          </p>
        </div>
      </div>
      {data && data.meta.degraded.length > 0 && (
        <div className="relative mt-3 border border-register-ochre/70 bg-register-ochre/15 px-3 py-2 text-[11px] text-register-ochre">
          Partial data — some sources could not be read: {data.meta.degraded.join(", ")}. Empty values below may
          reflect the outage rather than reality.
        </div>
      )}
    </header>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="border border-register-line bg-register-panel p-3.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-3 h-7 w-1/2" />
            <Skeleton className="mt-3 h-3 w-1/3" />
          </div>
        ))}
      </div>
      <div className="border border-register-line bg-register-panel p-4">
        <Skeleton className="h-3 w-1/4" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-register-line bg-register-panel p-4">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
        <div className="border border-register-line bg-register-panel p-4">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const overview = await adminFetch<OverviewResponse>("/overview");
      setData(overview);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell>
      <Header data={data} />

      {error && (
        <div className="mb-6">
          <ErrorPanel message={error} />
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : data ? (
        <div className="space-y-8">
          <section>
            <SectionHeading
              index="01"
              title="Platform at a glance"
              hint="counts computed live from platform databases"
              right={<ProvenanceChip value="MIXED" />}
            />
            <OverviewKpis kpis={data.kpis} />
          </section>

          <section>
            <SectionHeading
              index="02"
              title="State-wise situation"
              hint={`${data.statesShown} of ${data.trackedStates} tracked states shown · public portal sample`}
            />
            <StateSituation
              states={data.states}
              trendSplit={data.trendSplit}
              trackedStates={data.trackedStates}
              shown={data.statesShown}
            />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
            <section>
              <SectionHeading index="03" title="Issue monitor" hint="derived rules, thresholds shown per row" />
              <IssueMonitor issues={data.issues} trackedStates={data.trackedStates} />
            </section>
            <section>
              <SectionHeading index="04" title="Research impact" hint="single seed snapshot — no trend series" />
              <ResearchImpactPanel impact={data.research} />
            </section>
          </div>

          <section>
            <SectionHeading
              index="05"
              title="Schemes & interventions"
              hint="official schemes plus demo research pilots and innovation calls"
            />
            <SchemesPanel data={data.schemes} />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <SectionHeading index="06" title="Requires attention" hint="each item links to its management page" />
              <AttentionPanel items={data.attention} />
            </section>
            <section>
              <SectionHeading index="07" title="Recent activity" hint="mutations only — view events excluded" />
              <RecentActivity events={data.activity} />
            </section>
          </div>

          <section>
            <SectionHeading index="08" title="Quick admin navigation" hint="administration tools" />
            <QuickAdminNav />
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
