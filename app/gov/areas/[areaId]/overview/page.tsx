"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import { useAreaContext } from "@/components/gov/area-context";
import type { AreaOverviewOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusLegend } from "@/components/gov/DataStatusBadge";
import { IndicatorCard } from "@/components/gov/IndicatorCard";
import { DocumentList } from "@/components/gov/DocumentList";
import { GISEntryPoint } from "@/components/gov/GISEntryPoint";
import { CardSkeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function SectionUnavailable({ note }: { note: string | null }) {
  return (
    <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
      {note ?? "Not available for this area yet."}
    </p>
  );
}

function AreaOverviewInner() {
  const params = useParams<{ areaId: string }>();
  const areaId = params.areaId;
  const [overview, setOverview] = useState<AreaOverviewOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedArea } = useAreaContext();

  useEffect(() => {
    if (!areaId) return;
    api
      .getAreaOverview(areaId)
      .then((o) => {
        setOverview(o);
        setSelectedArea(o.area);
      })
      .catch(() => setError("Could not load this area's overview."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId]);

  if (error) {
    return (
      <DashboardShell>
        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </DashboardShell>
    );
  }

  if (!overview || !areaId) {
    return (
      <DashboardShell>
        <div className="mb-6">
          <div className="h-3 w-24 animate-shimmer rounded-sm bg-register-line/50" />
          <div className="mt-2 h-8 w-56 animate-shimmer rounded-sm bg-register-line/50" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </DashboardShell>
    );
  }

  const { area, data_status_summary } = overview;

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/gov/areas/select"
            className="text-xs font-medium text-register-navy/70 transition-colors hover:text-register-navy hover:underline"
          >
            Change area
          </Link>
          <h2 className="mt-1 font-serif-display text-2xl font-semibold text-register-navy">
            {area.name}
          </h2>
          <p className="text-sm capitalize text-register-ink/60">{area.level} · {area.code ?? "no code on file"}</p>
        </div>
        <div className="rounded-sm border border-register-line bg-register-panel px-4 py-3 text-sm shadow-card">
          <p className="text-xs uppercase tracking-wide text-register-ink/50">Data status summary</p>
          <p className="mt-1 text-register-ink/80">
            {data_status_summary.official} official · {data_status_summary.historical} historical ·{" "}
            {data_status_summary.derived} derived · {data_status_summary.sample} sample
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Datasets", value: overview.datasets_count },
          { label: "Documents", value: overview.documents_count },
          { label: "Map layers", value: overview.map_layers_count },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card transition-shadow hover:shadow-raised"
          >
            <p className="text-xs uppercase tracking-wide text-register-ink/50">{stat.label}</p>
            <p className="mt-1 font-serif-display text-2xl font-semibold text-register-navy">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <h3 className="mb-3 font-serif-display text-lg font-semibold text-register-navy">Land data summary</h3>
        {overview.land_summary.available ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overview.land_indicators.map((ind) => (
              <IndicatorCard key={ind.id} indicator={ind} />
            ))}
          </div>
        ) : (
          <SectionUnavailable note={overview.land_summary.note} />
        )}
      </section>

      <section className="mb-8">
        <h3 className="mb-3 font-serif-display text-lg font-semibold text-register-navy">
          Socioeconomic summary
        </h3>
        {overview.socioeconomic_summary.available ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overview.socioeconomic_indicators.map((ind) => (
              <IndicatorCard key={ind.id} indicator={ind} />
            ))}
          </div>
        ) : (
          <SectionUnavailable note={overview.socioeconomic_summary.note} />
        )}
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif-display text-lg font-semibold text-register-navy">Evidence &amp; research</h3>
            <Link href={`/gov/areas/${areaId}/documents`} className="text-xs font-medium text-register-navy underline">
              View all
            </Link>
          </div>
          <div className="rounded-sm border border-register-line bg-register-panel p-4">
            <DocumentList areaId={areaId} compact />
          </div>
        </section>

        <GISEntryPoint areaId={areaId} />
      </div>

      <section className="rounded-sm border border-register-line bg-register-panel p-5">
        <h3 className="mb-3 font-serif-display text-base font-semibold text-register-navy">
          Reading the data-status labels
        </h3>
        <DataStatusLegend />
      </section>
    </DashboardShell>
  );
}

export default function AreaOverviewPage() {
  return (
    <RequireAuth>
      <AreaOverviewInner />
    </RequireAuth>
  );
}
