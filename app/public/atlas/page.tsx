"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Trees,
  Building2,
  Sprout,
  ShieldAlert,
} from "lucide-react";
import { mapToDb } from "@/lib/public/atlas/aliases";
import type { StateStatSummary } from "@/components/public/india-map";
import { cn } from "@/lib/public/cn";
import { BASE_PATH } from "@/lib/public/base-path";

const DashboardMap = dynamic(() => import("@/components/public/india-map").then((m) => m.DashboardMap), {
  ssr: false,
  loading: () => <div className="h-[560px] grid place-items-center text-muted-foreground">Loading map…</div>,
});

type Mode = "records" | "urban" | "disputes";

const MODES: { key: Mode; label: string; desc: string }[] = [
  { key: "records", label: "Digital Records", desc: "Villages computerised (%)" },
  { key: "urban", label: "Urbanisation", desc: "Urban share of land (%)" },
  { key: "disputes", label: "Disputes", desc: "Volume + trend" },
];

export default function AtlasPage() {
  const [states, setStates] = useState<StateStatSummary[]>([]);
  const [selected, setSelected] = useState<StateStatSummary | null>(null);
  const [mode, setMode] = useState<Mode>("records");

  useEffect(() => {
    fetch(BASE_PATH + "/api/public/atlas")
      .then((r) => r.json())
      .then((d) => d.success && setStates(d.data.states));
  }, []);

  const trendIcon = (t?: string | null) => {
    if (t === "rising") return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (t === "falling") return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-amber-600" />;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Bhumi Atlas</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Tap any state to read its land story — records, disputes, urbanisation and climate. No GIS skills needed.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-semibold transition",
              mode === m.key
                ? "border-land-green bg-land-green text-white"
                : "border-border bg-card text-muted-foreground hover:bg-secondary"
            )}
          >
            {m.label}
            <span className={cn("ml-1.5 text-[11px] font-normal", mode === m.key ? "text-white/70" : "text-muted-foreground/60")}>
              {m.desc}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm lg:col-span-2">
          <DashboardMap states={states} mode={mode} onSelect={setSelected} heightClass="h-[560px]" />
        </div>

        <div className="flex flex-col gap-4">
          {selected?.hasData ? (
            <div className="rounded-2xl border border-land-green/30 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-land-green" />
                <h2 className="text-xl font-extrabold">{selected.name}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {selected.story}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-land-green/5 p-3">
                  <p className="text-lg font-extrabold text-land-green">
                    {selected.computerizedPct != null ? `${selected.computerizedPct}%` : "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Villages computerised</p>
                </div>
                <div className="rounded-xl bg-land-green/5 p-3">
                  <p className="text-lg font-extrabold text-land-green">
                    {selected.ulpinPct != null ? `${selected.ulpinPct}%` : "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">ULPIN coverage</p>
                </div>
                <div className="rounded-xl bg-land-green/5 p-3">
                  <p className="flex items-center gap-1 text-lg font-extrabold text-land-green">
                    {selected.disputes != null ? selected.disputes.toLocaleString() : "—"} {trendIcon(selected.disputesTrend)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Land disputes</p>
                </div>
                <div className="rounded-xl bg-land-green/5 p-3">
                  <p className="text-lg font-extrabold text-land-green">
                    {selected.linkedPct != null ? `${selected.linkedPct}%` : "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Maps linked to records</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg p-2">
                  <Sprout className="mx-auto h-4 w-4 text-land-green" />
                  <p className="mt-1 text-sm font-bold">{selected.agriPct ?? "—"}%</p>
                  <p className="text-[10px] text-muted-foreground">Agriculture</p>
                </div>
                <div className="rounded-lg p-2">
                  <Trees className="mx-auto h-4 w-4 text-land-green" />
                  <p className="mt-1 text-sm font-bold">{selected.forestPct ?? "—"}%</p>
                  <p className="text-[10px] text-muted-foreground">Forest</p>
                </div>
                <div className="rounded-lg p-2">
                  <Building2 className="mx-auto h-4 w-4 text-land-green" />
                  <p className="mt-1 text-sm font-bold">{selected.urbanSharePct ?? "—"}%</p>
                  <p className="text-[10px] text-muted-foreground">Urban</p>
                </div>
              </div>

              {selected.climateVulnerability != null && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 p-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <ShieldAlert className="h-4 w-4" /> Climate vulnerability
                  </span>
                  <span className="text-lg font-extrabold text-amber-700">{selected.climateVulnerability}/100</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                {selected ? `${selected.name} — detailed data coming soon` : "Tap a state on the map to read its land story."}
              </p>
            </div>
          )}

          <a
            href="/public/dashboards"
            className="group flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm transition hover:border-land-green"
          >
            <span className="text-sm font-semibold">Compare states on dashboards</span>
            <ArrowRight className="h-4 w-4 text-land-green transition group-hover:translate-x-0.5" />
          </a>

          <div className="rounded-2xl border bg-secondary/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legend · {MODES.find((m) => m.key === mode)?.desc}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              {mode === "records" && (
                <>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#166534]" /> 95%+</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#15803d]" /> 85–95</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#4ade80]" /> 70–85</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#facc15]" /> &lt;70</span>
                </>
              )}
              {mode === "urban" && (
                <>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#7c2d12]" /> 40%+</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#c2410c]" /> 25–40</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#fb923c]" /> 15–25</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#fed7aa]" /> &lt;15</span>
                </>
              )}
              {mode === "disputes" && (
                <>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#b91c1c]" /> Rising / high</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#f59e0b]" /> Stable</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#4ade80]" /> Falling</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}