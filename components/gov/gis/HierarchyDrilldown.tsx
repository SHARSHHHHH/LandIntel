"use client";

import type { DistrictHierarchyOut } from "@/lib/gov/client";
import type { SubDistrictDetail, VillageSummary } from "@/lib/gov/gis/types";

interface Props {
  hierarchy: DistrictHierarchyOut | null;
  loading: boolean;
  selectedSubDistrictId: string | null;
  selectedVillageId: string | null;
  onSelectSubDistrict: (id: string | null) => void;
  onSelectVillage: (id: string | null) => void;
}

/** State -> District is fixed by the area already selected upstream; this drills District -> Tehsil/Taluk -> Village. */
export function HierarchyDrilldown({
  hierarchy,
  loading,
  selectedSubDistrictId,
  selectedVillageId,
  onSelectSubDistrict,
  onSelectVillage,
}: Props) {
  if (loading) {
    return <div className="h-24 animate-shimmer rounded-sm bg-register-line/40" />;
  }
  if (!hierarchy) return null;

  const { terminology, supported, subDistricts, district, state, message } = hierarchy;

  const crumbs = [state.name, district.name];
  const subDistrict = subDistricts.find((s) => s.id === selectedSubDistrictId) ?? null;
  if (subDistrict) crumbs.push(subDistrict.name);
  const village = subDistrict?.villages.find((v) => v.id === selectedVillageId) ?? null;
  if (village) crumbs.push(village.name);

  return (
    <div className="rounded-sm border border-register-line bg-register-panel p-4">
      <h3 className="font-serif-display text-base font-semibold text-register-navy">
        State &rarr; District &rarr; {terminology.subDistrictTerm} &rarr; {terminology.villageTerm} &rarr; Parcel
      </h3>
      <nav aria-label="Breadcrumb" className="mt-2 flex flex-wrap items-center gap-1 text-xs text-register-ink/70">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-register-ink/30">/</span>}
            <span className={i === crumbs.length - 1 ? "font-semibold text-register-navy" : ""}>{c}</span>
          </span>
        ))}
      </nav>

      {!supported ? (
        <p className="mt-3 rounded-sm border border-register-line/60 bg-register-line/10 p-2.5 text-xs text-register-ink/60">
          {message}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-register-ink/70">{terminology.subDistrictTerm}</label>
            <select
              className="w-full rounded-sm border border-register-line bg-white px-2 py-1.5 text-sm"
              value={selectedSubDistrictId ?? ""}
              onChange={(e) => {
                onSelectSubDistrict(e.target.value || null);
                onSelectVillage(null);
              }}
            >
              <option value="">Select {terminology.subDistrictTerm.toLowerCase()}...</option>
              {subDistricts.map((sd: SubDistrictDetail) => (
                <option key={sd.id} value={sd.id}>
                  {sd.name} ({sd.villageCount} {terminology.villageTerm.toLowerCase()}s)
                </option>
              ))}
            </select>
          </div>

          {subDistrict && (
            <div>
              <label className="mb-1 block text-xs font-medium text-register-ink/70">{terminology.villageTerm}</label>
              <select
                className="w-full rounded-sm border border-register-line bg-white px-2 py-1.5 text-sm"
                value={selectedVillageId ?? ""}
                onChange={(e) => onSelectVillage(e.target.value || null)}
              >
                <option value="">Select {terminology.villageTerm.toLowerCase()}...</option>
                {subDistrict.villages.map((v: VillageSummary) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.parcelCount} parcels)
                  </option>
                ))}
              </select>
            </div>
          )}

          {village && (
            <p className="text-xs text-register-ink/50">
              Click any parcel outlined on the map to open its record. Parcel ID label used here:{" "}
              <strong>{terminology.parcelIdLabel}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
