"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LandPlot,
  Gavel,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { Takeaway } from "@/components/public/ui/stat-card";
import { cn } from "@/lib/public/cn";
import type { StateStatSummary } from "@/components/public/india-map";
import { BASE_PATH } from "@/lib/public/base-path";

const DashboardMap = dynamic(() => import("@/components/public/india-map").then((m) => m.DashboardMap), {
  ssr: false,
  loading: () => <div className="h-[360px] grid place-items-center text-muted-foreground">Loading map…</div>,
});

type Tab = "disputes" | "landuse";

interface DisputeRow { name: string; mapName: string; total: number; trend: string; per1000: number; }
interface LandUseRow { name: string; mapName: string; urban: number; agri: number; forest: number; }

const TREND_COLOR: Record<string, string> = { rising: "#b91c1c", stable: "#f59e0b", falling: "#4ade80" };
const PIE_COLORS = ["#166534", "#22c55e", "#4ade80"];

export default function DashboardsPage() {
  const [tab, setTab] = useState<Tab>("disputes");
  const [disputes, setDisputes] = useState<{ data: { disputes: DisputeRow[]; takeaway: string; topRising: DisputeRow[] } } | null>(null);
  const [landuse, setLanduse] = useState<{ data: { landUse: LandUseRow[]; national: { urban: number; agri: number; forest: number }; takeaway: string; topUrban: LandUseRow[] } } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(BASE_PATH + "/api/public/dashboards/disputes").then((r) => r.json()),
      fetch(BASE_PATH + "/api/public/dashboards/landuse").then((r) => r.json()),
    ]).then(([d, l]) => {
      setDisputes(d);
      setLanduse(l);
    });
  }, []);

  const disputePivot = disputes?.data.disputes
    .map((d) => ({ name: d.mapName || d.name, value: d.total, trend: d.trend }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const landUsePivot = landuse?.data.topUrban.map((l) => ({ name: l.mapName || l.name, urban: l.urban }));

  const nationalPie = landuse
    ? [
        { name: "Agriculture", value: landuse.data.national.agri },
        { name: "Urban", value: landuse.data.national.urban },
        { name: "Forest", value: landuse.data.national.forest },
      ]
    : [];

  const mapStates: StateStatSummary[] = useMapStates(tab, disputes, landuse);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Public Dashboards</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Simple charts with a plain-language takeaway under each — even before the numbers, you get the point.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { key: "disputes" as Tab, label: "Land Disputes", icon: Gavel },
          { key: "landuse" as Tab, label: "Land Use & Urbanisation", icon: LandPlot },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "border-land-green bg-land-green text-white"
                : "border-border bg-card text-muted-foreground hover:bg-secondary"
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "disputes" && disputes && (
        <div className="mt-8 space-y-6">
          <Takeaway>{disputes.data.takeaway}</Takeaway>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                <BarChartIcon className="h-4 w-4 text-land-green" /> Disputes by state (top 10)
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={disputePivot} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 11 }} />
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {disputePivot?.map((e) => (
                      <Cell key={e.name} fill={TREND_COLOR[e.trend] || "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-2 text-sm font-bold">Dispute intensity map (trend)</p>
              <DashboardMap states={mapStates} mode="disputes" heightClass="h-[340px]" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {disputes.data.topRising.slice(0, 3).map((d, i) => (
              <div key={d.name} className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">#{i + 1} highest</p>
                <p className="mt-1 text-sm font-bold">{d.name}</p>
                <p className="text-2xl font-extrabold text-land-green">{d.total.toLocaleString()}</p>
                <p className="text-xs font-medium capitalize text-muted-foreground">trend: {d.trend}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "landuse" && landuse && (
        <div className="mt-8 space-y-6">
          <Takeaway>{landuse.data.takeaway}</Takeaway>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                <PieChartIcon className="h-4 w-4 text-land-green" /> National land mix (average %)
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={nationalPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {nationalPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-2 text-sm font-bold">Urbanisation across India</p>
              <DashboardMap states={mapStates} mode="urban" heightClass="h-[340px]" />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
              <BarChartIcon className="h-4 w-4 text-land-green" /> Most urbanised states
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={landUsePivot}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="urban" name="Urban share %" fill="#166534" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function useMapStates(
  tab: Tab,
  disputes: { data: { disputes: DisputeRow[] } } | null,
  landuse: { data: { landUse: LandUseRow[] } } | null
): StateStatSummary[] {
  const [states, setStates] = useState<StateStatSummary[]>([]);
  useEffect(() => {
    fetch(BASE_PATH + "/api/public/atlas").then((r) => r.json()).then((d) => d.success && setStates(d.data.states));
  }, []);
  return states;
}