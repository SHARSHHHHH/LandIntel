"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut, GeographicUnitOut } from "@/lib/gov/types";

export function GisTab({
  ws,
  workspaceId,
  refresh,
}: {
  ws: WorkspaceDetailOut;
  workspaceId: string;
  refresh: () => Promise<void>;
}) {
  const [districts, setDistricts] = useState<GeographicUnitOut[]>([]);
  const [districtId, setDistrictId] = useState("");
  const [note, setNote] = useState("");
  const [parcelQuery, setParcelQuery] = useState("");
  const [parcelResults, setParcelResults] = useState<Awaited<ReturnType<typeof api.searchParcels>> | null>(null);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    api.listGeographies("district").then(setDistricts);
  }, []);

  async function linkDistrict(e: React.FormEvent) {
    e.preventDefault();
    if (!districtId) return;
    const d = districts.find((x) => x.id === districtId);
    setLinking(true);
    try {
      await api.linkWorkspaceGis(workspaceId, { geographic_unit_id: districtId, label: d?.name, note: note.trim() || undefined });
      setDistrictId("");
      setNote("");
      await refresh();
    } finally {
      setLinking(false);
    }
  }

  async function searchParcels(e: React.FormEvent) {
    e.preventDefault();
    if (!parcelQuery.trim()) return;
    setSearching(true);
    try {
      const rows = await api.searchParcels(parcelQuery.trim());
      setParcelResults(rows);
    } finally {
      setSearching(false);
    }
  }

  async function linkParcel(parcelId: string, label: string) {
    await api.linkWorkspaceGis(workspaceId, { parcel_id: parcelId, label });
    setParcelResults((prev) => (prev ? prev.filter((p) => p.parcelId !== parcelId) : prev));
    await refresh();
  }

  async function remove(linkId: string) {
    await api.unlinkWorkspaceGis(workspaceId, linkId);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <form onSubmit={linkDistrict} className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
          <h3 className="mb-1 font-serif-display text-base font-semibold text-register-navy">Link a district</h3>
          <p className="mb-3 text-xs text-register-ink/60">Pulls the real district record from the GIS module — same data as Area Intelligence.</p>
          <select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            className="mb-2 w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none"
          >
            <option value="">Choose a district…</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — why this district matters here"
            className="mb-2 w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none"
          />
          <button type="submit" disabled={!districtId || linking} className="rounded-sm bg-register-navy px-3.5 py-2 text-sm font-medium text-white hover:bg-register-navy2 disabled:opacity-50">
            {linking ? "Linking…" : "Link district"}
          </button>
        </form>

        <form onSubmit={searchParcels} className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
          <h3 className="mb-1 font-serif-display text-base font-semibold text-register-navy">Link a sample parcel</h3>
          <p className="mb-3 text-xs text-register-ink/60">Search by survey number, village or owner name from the GIS module's pilot-district sample data.</p>
          <div className="flex gap-2">
            <input
              value={parcelQuery}
              onChange={(e) => setParcelQuery(e.target.value)}
              placeholder="e.g. survey number or village"
              className="flex-1 rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none"
            />
            <button type="submit" disabled={searching} className="rounded-sm bg-register-navy px-3 py-2 text-sm font-medium text-white hover:bg-register-navy2">
              {searching ? "…" : "Search"}
            </button>
          </div>
          {parcelResults && (
            <ul className="mt-2 max-h-40 divide-y divide-register-line overflow-y-auto rounded-sm border border-register-line">
              {parcelResults.length === 0 ? (
                <li className="px-3 py-2 text-xs text-register-ink/50">No matches.</li>
              ) : (
                parcelResults.map((p) => (
                  <li key={p.parcelId} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                    <span className="truncate text-register-ink/80">{p.surveyNumber} · {p.villageName}</span>
                    <button onClick={() => linkParcel(p.parcelId, `${p.surveyNumber}, ${p.villageName}`)} className="shrink-0 rounded-sm border border-register-navy/30 px-2 py-0.5 font-medium text-register-navy hover:bg-register-navy hover:text-white">
                      Link
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </form>
      </div>

      <div>
        <h3 className="mb-2 font-serif-display text-base font-semibold text-register-navy">Linked data ({ws.gis_links.length})</h3>
        {ws.gis_links.length === 0 ? (
          <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
            No districts or parcels linked yet.
          </p>
        ) : (
          <ul className="divide-y divide-register-line rounded-sm border border-register-line bg-register-panel shadow-card">
            {ws.gis_links.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-register-navy">
                    {l.geographic_unit_name ? (
                      <Link href={`/gov/areas/${l.geographic_unit_id}/gis`} className="hover:underline">{l.geographic_unit_name} (district)</Link>
                    ) : (
                      l.parcel_label ?? "Linked parcel"
                    )}
                  </p>
                  {l.note && <p className="truncate text-xs text-register-ink/55">{l.note}</p>}
                </div>
                <button onClick={() => remove(l.id)} className="shrink-0 text-xs text-register-ink/40 hover:text-red-600">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
