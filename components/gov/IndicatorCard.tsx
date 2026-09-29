"use client";

import { useState } from "react";
import type { IndicatorValueOut } from "@/lib/gov/types";
import { DataStatusBadge } from "./DataStatusBadge";

function formatValue(v: IndicatorValueOut): string {
  if (v.value_text) return v.value_text;
  if (v.value === null) return "—";
  return v.value.toLocaleString("en-IN");
}

export function IndicatorCard({ indicator, compare }: { indicator: IndicatorValueOut; compare?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const ds = indicator.dataset;

  return (
    <div className="flex h-full flex-col rounded-md border border-register-line bg-register-panel p-5 shadow-card transition-shadow hover:shadow-raised">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-snug text-register-ink/70">{indicator.indicator_name}</p>
        <DataStatusBadge status={ds.data_status} className="shrink-0" />
      </div>
      <p className="mt-2.5 font-serif-display text-[26px] font-semibold leading-tight text-register-navy">
        {formatValue(indicator)}
        {indicator.unit && (
          <span className="ml-1.5 font-sans text-sm font-normal text-register-ink/50">
            {indicator.unit}
          </span>
        )}
      </p>
      {compare && <p className="mt-1.5 text-xs text-register-ink/55">{compare}</p>}

      <div className="mt-auto pt-3">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-medium text-register-navy underline decoration-register-line underline-offset-2 hover:decoration-register-navy"
        >
          {expanded ? "Hide source" : "Source & date"}
        </button>
      </div>

      {expanded && (
        <dl className="mt-3 space-y-1.5 border-t border-register-line pt-3 text-xs text-register-ink/70">
          <div className="flex justify-between gap-2">
            <dt className="text-register-ink/50">Source</dt>
            <dd className="text-right">{ds.source?.name ?? "Unknown"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-register-ink/50">Provider</dt>
            <dd className="text-right">{ds.source?.provider ?? "—"}</dd>
          </div>
          {ds.reference_year && (
            <div className="flex justify-between gap-2">
              <dt className="text-register-ink/50">Reference year</dt>
              <dd>{ds.reference_year}</dd>
            </div>
          )}
          {ds.last_updated && (
            <div className="flex justify-between gap-2">
              <dt className="text-register-ink/50">Last updated</dt>
              <dd>{ds.last_updated}</dd>
            </div>
          )}
          {indicator.derivation_method && (
            <div>
              <dt className="text-register-ink/50">Derivation method</dt>
              <dd className="mt-0.5">{indicator.derivation_method}</dd>
            </div>
          )}
          {ds.limitations && (
            <div>
              <dt className="text-register-ink/50">Limitations</dt>
              <dd className="mt-0.5">{ds.limitations}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
