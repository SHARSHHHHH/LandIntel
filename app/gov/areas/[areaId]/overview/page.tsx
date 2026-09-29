"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import { useAreaContext } from "@/components/gov/area-context";
import type { AreaOverviewOut, GeographicUnitOut, IndicatorValueOut, UploadedDocumentOut } from "@/lib/gov/types";
import { NATIONAL_2011 } from "@/lib/gov/constants";
import { compareToNational } from "@/lib/gov/compare";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusLegend } from "@/components/gov/DataStatusBadge";
import { IndicatorCard } from "@/components/gov/IndicatorCard";
import { DocumentList } from "@/components/gov/DocumentList";
import { DocumentUpload } from "@/components/gov/DocumentUpload";
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

function SectionHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-register-ochre">{eyebrow}</p>
      <h3 className="mt-0.5 font-serif-display text-lg font-semibold text-register-navy">{title}</h3>
      {note && <p className="mt-1 max-w-2xl text-sm text-register-ink/60">{note}</p>}
    </div>
  );
}

function findIndicator(list: IndicatorValueOut[], name: string): IndicatorValueOut | undefined {
  return list.find((i) => i.indicator_name === name);
}

function AreaOverviewInner() {
  const params = useParams<{ areaId: string }>();
  const areaId = params.areaId;
  const [overview, setOverview] = useState<AreaOverviewOut | null>(null);
  const [stateUnit, setStateUnit] = useState<GeographicUnitOut | null>(null);
  const [uploads, setUploads] = useState<UploadedDocumentOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedArea } = useAreaContext();

  const refreshUploads = useCallback(() => {
    if (!areaId) return;
    api.listUploadedDocuments(areaId).then(setUploads).catch(() => {});
  }, [areaId]);

  useEffect(() => {
    if (!areaId) return;
    api
      .getAreaOverview(areaId)
      .then((o) => {
        setOverview(o);
        setSelectedArea(o.area);
        if (o.area.parent_id) {
          api.getGeography(o.area.parent_id).then(setStateUnit).catch(() => setStateUnit(null));
        }
      })
      .catch(() => setError("Could not load this area's overview."));
    refreshUploads();
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

  const { area, data_status_summary, socioeconomic_indicators, land_indicators } = overview;

  const population = findIndicator(socioeconomic_indicators, "Population");
  const density = findIndicator(socioeconomic_indicators, "Population density");
  const literacy = findIndicator(socioeconomic_indicators, "Literacy rate");
  const sexRatio = findIndicator(socioeconomic_indicators, "Sex ratio");
  const growth = findIndicator(socioeconomic_indicators, "Decadal growth rate (2001-2011)");
  const urbanShare = findIndicator(socioeconomic_indicators, "Urban population share");
  const districtArea = findIndicator(land_indicators, "District area");
  const forestCover = findIndicator(land_indicators, "Forest cover");

  const urbanPct = urbanShare?.value ?? null;
  const sizeAdj = urbanPct === null ? "district" : urbanPct >= 55 ? "highly urbanized district" : urbanPct >= 32 ? "moderately urbanized district" : "largely rural district";

  const synopsisParts: string[] = [];
  synopsisParts.push(`${area.name} is a ${sizeAdj} in ${stateUnit?.name ?? "India"}`);
  if (population?.value) {
    synopsisParts.push(
      `with a population of ${population.value.toLocaleString("en-IN")} (2011 census)${
        density?.value ? ` and a density of ${density.value.toLocaleString("en-IN")} persons/km²` : ""
      }`
    );
  }
  if (growth?.value) synopsisParts.push(`growing at an estimated ${growth.value}% per decade`);
  if (literacy?.value) synopsisParts.push(`with literacy at ${literacy.value}%`);
  const synopsis = synopsisParts.join(", ") + ".";

  const approvedEvidenceCount = overview.documents_count;
  const pendingUploads = uploads.filter((u) => u.status === "pending_review" || u.status === "processing").length;
  const rejectedUploads = uploads.filter((u) => u.status === "rejected").length;

  const glanceTiles = [
    {
      label: "Datasets",
      value: overview.datasets_count,
      href: `/gov/areas/${areaId}/datasets`,
      note: "Every dataset backing the figures below, with source & limitations",
    },
    {
      label: "Documents",
      value: approvedEvidenceCount,
      href: `/gov/areas/${areaId}/documents`,
      note:
        pendingUploads > 0
          ? `${pendingUploads} more awaiting review`
          : rejectedUploads > 0
          ? `${rejectedUploads} rejected, not shown here`
          : "Catalogued evidence for this district",
    },
    {
      label: "Map layers",
      value: overview.map_layers_count,
      href: `/gov/areas/${areaId}/gis`,
      note: "Boundary, headquarters & land-use layers",
    },
  ];

  const exploreLinks = [
    {
      title: "Evidence & Research",
      desc: "Search every document, notification and approved evidence item across all areas.",
      href: "/gov/documents",
    },
    {
      title: "GIS & Land Insights",
      desc: `Open the map view for ${area.name} — boundary, headquarters & land-use layers.`,
      href: `/gov/areas/${areaId}/gis`,
    },
    {
      title: "Scenario & Decision Support",
      desc: `Model a land-use change scenario for ${area.name}.`,
      href: "/gov/scenario",
    },
    {
      title: "Research: Dataset catalogue",
      desc: "Cross the aisle to the Researcher portal's dataset library for related sources.",
      href: "/research/datasets",
    },
    {
      title: "Research: Repository",
      desc: "Published research outputs and resources from the Researcher portal.",
      href: "/research/repository",
    },
  ];

  return (
    <DashboardShell>
      {/* --- Header / synopsis --- */}
      <div className="mb-8 overflow-hidden rounded-md border border-register-line bg-register-panelAlt shadow-card">
        <div className="border-b border-register-line/70 bg-register-navy px-6 py-2.5">
          <Link href="/gov/areas/select" className="text-xs font-medium text-white/70 transition-colors hover:text-white hover:underline">
            ← Change area
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-6 px-6 py-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-wide text-register-ink/50">
              {area.level} {stateUnit ? `· ${stateUnit.name}` : ""} {area.code ? `· ${area.code}` : ""}
            </p>
            <h2 className="mt-1 font-serif-display text-3xl font-semibold text-register-navy">{area.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-register-ink/75">{synopsis}</p>
          </div>
          <div className="rounded-md border border-register-lineStrong/60 bg-white px-4 py-3 text-sm shadow-card">
            <p className="text-xs uppercase tracking-wide text-register-ink/50">Data status summary</p>
            <p className="mt-1.5 text-register-ink/80">
              {data_status_summary.official} official · {data_status_summary.historical} historical ·{" "}
              {data_status_summary.derived} derived · {data_status_summary.sample} sample
            </p>
          </div>
        </div>
      </div>

      {/* --- At a glance --- */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {glanceTiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group flex flex-col rounded-md border border-register-line bg-register-panel p-5 shadow-card transition-shadow hover:shadow-raised"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-register-ink/50">{t.label}</p>
              <span className="text-xs text-register-navy/60 opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
            </div>
            <p className="mt-1 font-serif-display text-2xl font-semibold text-register-navy">{t.value}</p>
            <p className="mt-1 text-xs text-register-ink/50">{t.note}</p>
          </Link>
        ))}
      </div>

      {/* --- Demographics --- */}
      <section className="mb-10">
        <SectionHeading
          eyebrow="Socioeconomic"
          title="Demographics"
          note="Base figures are Census 2011. Fields marked Derived are estimates computed from the base figures using a documented method — see “Source & date” on each card."
        />
        {overview.socioeconomic_summary.available ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {socioeconomic_indicators.map((ind) => {
              let compare: string | null = null;
              if (ind.indicator_name === "Population density" && ind.value !== null) {
                compare = compareToNational(ind.value, NATIONAL_2011.populationDensity, " /km²");
              } else if (ind.indicator_name === "Literacy rate" && ind.value !== null) {
                compare = compareToNational(ind.value, NATIONAL_2011.literacyRate, " pts");
              } else if (ind.indicator_name === "Sex ratio" && ind.value !== null) {
                compare = compareToNational(ind.value, NATIONAL_2011.sexRatio, "");
              } else if (ind.indicator_name === "Decadal growth rate (2001-2011)" && ind.value !== null) {
                compare = compareToNational(ind.value, NATIONAL_2011.decadalGrowthRate, " pts");
              } else if (ind.indicator_name === "Urban population share" && ind.value !== null) {
                compare = compareToNational(ind.value, NATIONAL_2011.urbanPopulationPct, " pts");
              }
              return <IndicatorCard key={ind.id} indicator={ind} compare={compare} />;
            })}
          </div>
        ) : (
          <SectionUnavailable note={overview.socioeconomic_summary.note} />
        )}
      </section>

      {/* --- Land & area --- */}
      <section className="mb-10">
        <SectionHeading
          eyebrow="Land"
          title="Land &amp; area"
          note="District extent and, where reported, forest cover — compared against the national 2011 reference where relevant."
        />
        {overview.land_summary.available ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {land_indicators.map((ind) => {
              let compare: string | null = null;
              if (ind.indicator_name === "Forest cover" && ind.value !== null) {
                compare = compareToNational(ind.value, NATIONAL_2011.forestCoverPct, " pts", "India State of Forest Report reference");
              }
              return <IndicatorCard key={ind.id} indicator={ind} compare={compare} />;
            })}
          </div>
        ) : (
          <SectionUnavailable note={overview.land_summary.note} />
        )}
      </section>

      {/* --- Documents & evidence + GIS --- */}
      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <SectionHeading
            eyebrow="Evidence"
            title="Documents &amp; evidence"
            note="Attach a document for this district — it is read automatically and turned into a draft report for review before it becomes evidence."
          />
          <div className="rounded-md border border-register-line bg-register-panel p-5 shadow-card">
            <DocumentUpload areaId={areaId} uploads={uploads} onUploaded={refreshUploads} />
            <div className="mt-5 border-t border-register-line pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-register-ink/50">Catalogued evidence</p>
                <Link href={`/gov/areas/${areaId}/documents`} className="text-xs font-medium text-register-navy underline">
                  View all
                </Link>
              </div>
              <DocumentList areaId={areaId} compact />
            </div>
          </div>
        </section>

        <GISEntryPoint areaId={areaId} />
      </div>

      {/* --- Explore further --- */}
      <section className="mb-10">
        <SectionHeading eyebrow="Connected views" title="Explore further" note="Jump straight from this district into related analysis." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exploreLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex flex-col rounded-md border border-register-line bg-register-panel p-4 shadow-card transition-shadow hover:shadow-raised"
            >
              <p className="font-medium text-register-navy">
                {l.title} <span className="text-register-ochre transition-transform group-hover:translate-x-0.5">→</span>
              </p>
              <p className="mt-1 text-xs text-register-ink/60">{l.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-register-line bg-register-panel p-5">
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
