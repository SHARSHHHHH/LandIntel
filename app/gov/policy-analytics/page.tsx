"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/gov/client";
import type { GeographicUnitOut, IndicatorValueOut } from "@/lib/gov/types";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";
import { NationalLandUseTrends } from "@/components/gov/NationalLandUseTrends";

interface Row {
  area: GeographicUnitOut;
  stateName: string;
  indicators: IndicatorValueOut[];
}

function formatValue(v: IndicatorValueOut | undefined): string {
  if (!v) return "—";
  if (v.value_text) return v.value_text;
  if (v.value === null) return "—";
  return v.value.toLocaleString("en-IN");
}

const DEFAULT_SELECTION = ["Jaipur", "Pune", "Chennai", "Lucknow"];

function Inner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [districts, states] = await Promise.all([
        api.listGeographies("district"),
        api.listGeographies("state"),
      ]);
      const stateNameById = new Map(states.map((s) => [s.id, s.name]));
      const withIndicators = await Promise.all(
        districts.map(async (area) => ({
          area,
          stateName: stateNameById.get(area.parent_id ?? "") ?? "Other",
          indicators: await api.getAreaIndicators(area.id),
        }))
      );
      if (!cancelled) {
        withIndicators.sort((a, b) => a.stateName.localeCompare(b.stateName) || a.area.name.localeCompare(b.area.name));
        setRows(withIndicators);
        const defaults = withIndicators.filter((r) => DEFAULT_SELECTION.includes(r.area.name)).map((r) => r.area.id);
        setSelected(new Set(defaults.length ? defaults : withIndicators.slice(0, 3).map((r) => r.area.id)));
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const byState = useMemo(() => {
    const groups = new Map<string, Row[]>();
    for (const row of rows) {
      if (!groups.has(row.stateName)) groups.set(row.stateName, []);
      groups.get(row.stateName)!.push(row);
    }
    return groups;
  }, [rows]);

  const visibleRows = rows.filter((r) => selected.has(r.area.id));
  const indicatorNames = Array.from(new Set(visibleRows.flatMap((r) => r.indicators.map((i) => i.indicator_name))));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">Policy Analytics</h2>
      <p className="mb-6 max-w-2xl text-sm text-register-ink/60">
        National land-use context, followed by a district-by-district comparison of this
        platform's own indicators.
      </p>

      <NationalLandUseTrends />

      <h3 className="mb-1 font-serif-display text-xl font-semibold text-register-navy">
        District comparison
      </h3>
      <p className="mb-4 max-w-2xl text-sm text-register-ink/60">
        Compare the same real indicators across districts you choose. Values come directly from
        each district&apos;s own dataset — nothing here is recalculated or estimated beyond what each
        indicator card already shows.
      </p>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="rounded-sm border border-register-navy/20 px-3 py-2 text-sm font-medium text-register-navy transition-colors hover:border-register-navy hover:bg-register-navy hover:text-white"
            >
              {pickerOpen ? "Hide district picker" : `Choose districts (${selected.size} selected)`}
            </button>
          </div>

          {pickerOpen && (
            <div className="mb-6 max-h-80 overflow-y-auto rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
              {Array.from(byState.entries()).map(([stateName, stateRows]) => (
                <div key={stateName} className="mb-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-register-ink/50">
                    {stateName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {stateRows.map((r) => (
                      <label
                        key={r.area.id}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                          selected.has(r.area.id)
                            ? "border-register-navy bg-register-navy text-white"
                            : "border-register-line text-register-ink/70 hover:border-register-navy/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(r.area.id)}
                          onChange={() => toggle(r.area.id)}
                          className="hidden"
                        />
                        {r.area.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {visibleRows.length === 0 ? (
            <p className="rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
              Choose at least one district above to compare.
            </p>
          ) : (
            <div
              className="overflow-x-auto rounded-sm border border-register-line bg-register-panel shadow-card"
              style={{ scrollbarWidth: "thin" }}
            >
              {/*
                table-fixed + an explicit <colgroup> pins every column to a
                fixed width shared by its header and body cells, so the
                header row and the data rows can never drift out of sync
                column-by-column (the previous table-layout:auto let each
                column's width float independently per row, which is what
                made the columns look "out of order" once more than a
                couple of districts were selected). The indicator column is
                sticky so it stays in view while scrolling to later columns.
              */}
              <table className="w-full table-fixed divide-y divide-register-line text-sm">
                <colgroup>
                  <col style={{ width: 180 }} />
                  {visibleRows.map((r) => (
                    <col key={r.area.id} style={{ width: 210 }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-register-bg/60 text-left text-xs uppercase tracking-wide text-register-ink/50">
                    <th className="sticky left-0 z-10 bg-register-bg/95 px-4 py-3 font-medium">Indicator</th>
                    {visibleRows.map((r) => (
                      <th key={r.area.id} className="px-4 py-3 font-medium">
                        {r.area.name}
                        <span className="block font-normal normal-case text-register-ink/40">{r.stateName}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-register-line">
                  {indicatorNames.map((name) => (
                    <tr key={name} className="transition-colors hover:bg-register-bg/40">
                      <td className="sticky left-0 z-10 bg-register-panel px-4 py-3 font-medium text-register-ink/80">
                        {name}
                      </td>
                      {visibleRows.map((r) => {
                        const ind = r.indicators.find((i) => i.indicator_name === name);
                        return (
                          <td key={r.area.id} className="px-4 py-3 align-top">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-register-navy">
                                {formatValue(ind)}
                                {ind?.unit ? <span className="ml-1 text-xs text-register-ink/50">{ind.unit}</span> : null}
                              </span>
                              {ind && <DataStatusBadge status={ind.dataset.data_status} />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-register-line px-4 py-2 text-[11px] text-register-ink/40">
                Scroll horizontally to see all {visibleRows.length} selected district{visibleRows.length === 1 ? "" : "s"}
                {visibleRows.length > 4 ? " — the Indicator column stays fixed." : "."}
              </p>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}

export default function PolicyAnalyticsPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}
