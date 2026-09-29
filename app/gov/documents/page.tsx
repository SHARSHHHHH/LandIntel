"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/gov/client";
import type { DocumentOut, EvidenceCategory, SchemeOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";
import { EvidenceCard } from "@/components/gov/evidence/EvidenceCard";
import { SchemeCard } from "@/components/gov/schemes/SchemeCard";

type TabKey = "all" | "official" | "land-records" | "uploads" | "schemes" | "legal" | "research";

const TABS: { key: TabKey; label: string; category: EvidenceCategory | null }[] = [
  { key: "all", label: "All evidence", category: null },
  { key: "official", label: "Official Documents", category: "official_document" },
  { key: "land-records", label: "Land Record Evidence", category: "land_record" },
  { key: "uploads", label: "Document & Image Evidence", category: "uploaded_report" },
  { key: "schemes", label: "Government Schemes", category: null },
  { key: "legal", label: "Legal & Court Evidence", category: "legal_case" },
  { key: "research", label: "Research & Reports", category: null },
];

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) || "all";
  const parcelFilter = searchParams.get("parcelId");

  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [schemes, setSchemes] = useState<SchemeOut[]>([]);
  const [query, setQuery] = useState("");
  const [docType, setDocType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.listAllDocuments({
        q: query || undefined,
        document_type: docType || undefined,
        category: activeTab.category ?? undefined,
        parcel_id: parcelFilter || undefined,
      }),
      tab === "schemes" || tab === "all" ? api.listSchemes() : Promise.resolve([] as SchemeOut[]),
    ])
      .then(([docs, sch]) => {
        setDocuments(docs);
        setSchemes(sch);
      })
      .finally(() => setLoading(false));
  }, [query, docType, tab, parcelFilter]);

  async function handleSaveSearch() {
    await api.createSavedSearch({ query: query || undefined, document_type: docType || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function setTab(next: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    if (next !== "land-records" && next !== "legal" && next !== "all") params.delete("parcelId");
    router.push(`/gov/documents?${params.toString()}`);
  }

  function clearParcelFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("parcelId");
    router.push(`/gov/documents?${params.toString()}`);
  }

  const showSchemesList = tab === "schemes";

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Evidence &amp; Research</h2>
      <p className="mb-4 max-w-2xl text-sm text-register-ink/60">
        Official documents, land records, legal references, schemes and research, each carrying its source,
        verification date and status. AI-generated summaries are a convenience &mdash; the original document or
        official link is always the authoritative record.
      </p>

      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-register-line pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-register-navy text-white"
                : "border border-register-line text-register-ink/70 hover:border-register-navy/40 hover:text-register-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {parcelFilter && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-sm border border-register-ochre/40 bg-register-ochre/10 px-4 py-2 text-xs text-register-ink/80">
          <span>
            Filtered to parcel <span className="font-mono">{parcelFilter}</span> (linked from GIS &amp; Land Insights).
          </span>
          <button onClick={clearParcelFilter} className="font-medium text-register-navy underline">
            Clear filter
          </button>
        </div>
      )}

      {tab === "research" && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/gov/policy-analytics"
            className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card transition-colors hover:border-register-navy/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-register-official">Official</p>
            <p className="mt-1 font-serif-display text-base font-semibold text-register-navy">National Land Use Trends</p>
            <p className="mt-1 text-xs text-register-ink/60">
              NRSC / World Bank / FAO-sourced land-use trend data, on the Policy Analytics page. Reference only &mdash;
              not duplicated here.
            </p>
          </Link>
          <Link
            href="/gov/areas/select"
            className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card transition-colors hover:border-register-navy/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-register-derived">Derived</p>
            <p className="mt-1 font-serif-display text-base font-semibold text-register-navy">District census-style profile</p>
            <p className="mt-1 text-xs text-register-ink/60">
              Extended demographic estimates (decadal growth, urban/rural split, workforce, SC/ST share) built from the
              base Census 2011 figures in Area Intelligence. Open a district to view its profile.
            </p>
          </Link>
        </div>
      )}

      {!showSchemesList && (
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-register-ink/80">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or summary…"
              className="w-72 rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-register-ink/80">Document type</span>
            <input
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="e.g. ror, mutation, act"
              className="w-56 rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
            />
          </label>
          <button
            onClick={handleSaveSearch}
            disabled={!query && !docType}
            className="rounded-sm border border-register-navy/20 px-3 py-2.5 text-sm font-medium text-register-navy transition-colors hover:border-register-navy hover:bg-register-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saved ? "Saved ✓" : "Save this search"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : showSchemesList ? (
        schemes.length === 0 ? (
          <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
            No schemes are registered yet.
          </p>
        ) : (
          <div className="space-y-4">
            {schemes.map((s) => (
              <SchemeCard key={s.id} s={s} />
            ))}
          </div>
        )
      ) : documents.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No evidence items match this view.
        </p>
      ) : (
        <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
          {documents.map((doc) => (
            <EvidenceCard key={doc.id} doc={doc} />
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

export default function DocumentsPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
