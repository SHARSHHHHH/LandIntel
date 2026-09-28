"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/gov/client";
import type { GeographicUnitOut, IndicatorValueOut } from "@/lib/gov/types";
import { useAreaContext } from "@/components/gov/area-context";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

function Inner() {
  const { selectedArea } = useAreaContext();
  const [districts, setDistricts] = useState<GeographicUnitOut[]>([]);
  const [areaId, setAreaId] = useState<string>("");
  const [indicators, setIndicators] = useState<IndicatorValueOut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [deltaHectares, setDeltaHectares] = useState(0);

  useEffect(() => {
    api.listGeographies("district").then((rows) => {
      setDistricts(rows);
      const initial = selectedArea && rows.some((r) => r.id === selectedArea.id) ? selectedArea.id : rows[0]?.id ?? "";
      setAreaId(initial);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!areaId) return;
    setLoading(true);
    setDeltaHectares(0);
    api
      .getAreaIndicators(areaId, "land")
      .then(setIndicators)
      .finally(() => setLoading(false));
  }, [areaId]);

  const areaIndicator = indicators?.find((i) => i.indicator_name === "District area");
  const forestIndicator = indicators?.find((i) => i.indicator_name === "Forest cover");

  const calc = useMemo(() => {
    if (!areaIndicator?.value || !forestIndicator?.value) return null;
    const totalKm2 = areaIndicator.value;
    const totalHectares = totalKm2 * 100;
    const currentForestHectares = totalHectares * (forestIndicator.value / 100);
    const currentOtherHectares = totalHectares - currentForestHectares;

    const newForestHectares = Math.min(totalHectares, Math.max(0, currentForestHectares + deltaHectares));
    const newOtherHectares = totalHectares - newForestHectares;
    const newForestPct = (newForestHectares / totalHectares) * 100;

    return {
      totalKm2,
      totalHectares,
      currentForestHectares,
      currentOtherHectares,
      currentForestPct: forestIndicator.value,
      newForestHectares,
      newOtherHectares,
      newForestPct,
      maxIncrease: currentOtherHectares,
      maxDecrease: currentForestHectares,
    };
  }, [areaIndicator, forestIndicator, deltaHectares]);

  const selectedDistrictName = districts.find((d) => d.id === areaId)?.name ?? "";
  const districtsWithForestData = ["Jaipur", "Lucknow", "Khordha", "Chennai"];

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">
        Scenario &amp; Decision Support
      </h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        A land-use reallocation calculator: model shifting hectares between forest and all other
        land for a district, using that district's own real area and forest-cover figures. This is
        transparent arithmetic on real inputs, not a predictive model or an official projection.
      </p>

      <div className="mb-6 max-w-sm">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-register-ink/80">District</span>
          <select
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full max-w-2xl" />
      ) : !areaIndicator ? (
        <p className="max-w-xl rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No district area is on record for {selectedDistrictName} yet, so this calculator has nothing to work from.
        </p>
      ) : !calc ? (
        <div className="max-w-xl rounded-sm border border-dashed border-register-line bg-register-panel p-6">
          <p className="text-sm text-register-ink/80">
            {selectedDistrictName}'s total area ({fmt(areaIndicator.value ?? 0)} km²) is on record, but no
            forest-cover percentage has been sourced for it yet, so there isn't a second real land-use figure
            to model a reallocation between. Try {districtsWithForestData.filter((n) => n !== selectedDistrictName).join(", ")}, which
            have a real, cited forest-cover figure.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif-display text-base font-semibold text-register-navy">
                Current land use — {selectedDistrictName}
              </h3>
              <DataStatusBadge status={forestIndicator!.dataset.data_status} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-register-ink/50">Total area</p>
                <p className="mt-1 font-serif-display text-xl font-semibold text-register-navy">
                  {fmt(calc.totalKm2)} km²
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-register-ink/50">Forest cover</p>
                <p className="mt-1 font-serif-display text-xl font-semibold text-register-navy">
                  {fmt(calc.currentForestPct)}%
                </p>
                <p className="text-xs text-register-ink/50">{fmt(calc.currentForestHectares)} ha</p>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <h3 className="mb-3 font-serif-display text-base font-semibold text-register-navy">
              Model a reallocation
            </h3>
            <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-register-ink/70">
              <span>{deltaHectares >= 0 ? "Convert other land → forest" : "Convert forest → other land"}</span>
              <span>{deltaHectares >= 0 ? "+" : ""}{fmt(deltaHectares)} ha</span>
            </label>
            <input
              type="range"
              min={-calc.maxDecrease}
              max={calc.maxIncrease}
              step={Math.max(1, Math.round(calc.totalHectares / 500))}
              value={deltaHectares}
              onChange={(e) => setDeltaHectares(Number(e.target.value))}
              className="w-full accent-register-navy"
            />
            <p className="mt-2 text-xs text-register-ink/50">
              Drag right to model afforestation (other land converted to forest); drag left to model forest
              land converted to other use. Bounded so neither category can go below zero or above the
              district's total area.
            </p>
          </div>

          <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
            <h3 className="mb-3 font-serif-display text-base font-semibold text-register-navy">Resulting split</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-register-ink/50">New forest cover</p>
                <p className="mt-1 font-serif-display text-xl font-semibold text-register-navy">
                  {fmt(calc.newForestPct)}%
                </p>
                <p className="text-xs text-register-ink/50">{fmt(calc.newForestHectares)} ha</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-register-ink/50">New other land</p>
                <p className="mt-1 font-serif-display text-xl font-semibold text-register-navy">
                  {fmt(100 - calc.newForestPct)}%
                </p>
                <p className="text-xs text-register-ink/50">{fmt(calc.newOtherHectares)} ha</p>
              </div>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-register-line/50">
              <div
                className="h-full bg-register-official transition-all"
                style={{ width: `${calc.newForestPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-sm border border-dashed border-register-line bg-register-bg/60 p-4 text-xs text-register-ink/60">
            <p className="font-medium text-register-ink/80">Method (shown in full, nothing hidden):</p>
            <p className="mt-1">
              new forest ha = current forest ha + reallocation ha, clamped to [0, total ha]. Percentages are
              that value divided by total area. No population, economic, or environmental impact is modelled —
              this shows only the land-area arithmetic. It is not a prediction of what will happen and carries
              no official standing.
            </p>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function ScenarioPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
