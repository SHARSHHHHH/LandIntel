"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/gov/client";
import type { GeographicUnitOut, IndicatorValueOut } from "@/lib/gov/types";
import { useAreaContext } from "@/components/gov/area-context";
import { DashboardShell } from "@/components/gov/DashboardShell";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { Skeleton } from "@/components/gov/Skeleton";
import { RequireAuth } from "@/components/gov/RequireAuth";
import { NATIONAL_LAND_USE } from "@/lib/gov/national-land-use";

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const THREAD_STORAGE_KEY = "gov_scenario_qa_thread";

function Inner() {
  const { selectedArea } = useAreaContext();
  const [districts, setDistricts] = useState<GeographicUnitOut[]>([]);
  const [areaId, setAreaId] = useState<string>("");
  const [indicators, setIndicators] = useState<IndicatorValueOut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [deltaHectares, setDeltaHectares] = useState(0);
  const [showLegend, setShowLegend] = useState(true);
  const [scenarioContext, setScenarioContext] = useState<
    { id: string; name: string; stateName: string; areaKm2: number | null; forestPct: number | null }[]
  >([]);

  // --- Q&A thread state, persisted for the browser session (survives page
  // navigation / reload within this tab, cleared when the tab closes). ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(THREAD_STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  useEffect(() => {
    api.listGeographies("district").then((rows) => {
      setDistricts(rows);
      const initial = selectedArea && rows.some((r) => r.id === selectedArea.id) ? selectedArea.id : rows[0]?.id ?? "";
      setAreaId(initial);
    });
    api.getScenarioContext().then(setScenarioContext).catch(() => {});
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
  const selectedDistrictState = scenarioContext.find((d) => d.id === areaId)?.stateName ?? "";

  const districtsWithForestData = scenarioContext.filter((d) => d.forestPct !== null && d.areaKm2 !== null);
  const otherDistrictsWithForestData = districtsWithForestData.filter((d) => d.id !== areaId);
  const nationalAvgForestOfSourced =
    districtsWithForestData.length > 0
      ? districtsWithForestData.reduce((sum, d) => sum + (d.forestPct as number), 0) / districtsWithForestData.length
      : null;
  const rankAmongSourced = calc
    ? [...districtsWithForestData].sort((a, b) => (b.forestPct as number) - (a.forestPct as number)).findIndex((d) => d.id === areaId) + 1
    : 0;

  const chartData = calc
    ? [
        {
          scenario: "Current",
          "Forest (ha)": Math.round(calc.currentForestHectares),
          "Other land (ha)": Math.round(calc.currentOtherHectares),
        },
        {
          scenario: "Proposed",
          "Forest (ha)": Math.round(calc.newForestHectares),
          "Other land (ha)": Math.round(calc.newOtherHectares),
        },
      ]
    : [];

  const direction = deltaHectares > 0 ? "afforestation" : deltaHectares < 0 ? "conversion out of forest" : "no change";
  const summarySentence =
    calc && deltaHectares !== 0
      ? `Reallocating ${fmt(Math.abs(deltaHectares))} ha models ${direction} in ${selectedDistrictName}: forest cover would move from ${fmt(
          calc.currentForestPct
        )}% to ${fmt(calc.newForestPct)}% (${calc.newForestPct >= calc.currentForestPct ? "+" : ""}${fmt(
          calc.newForestPct - calc.currentForestPct
        )} points).`
      : calc
        ? `${selectedDistrictName} currently has ${fmt(calc.currentForestPct)}% forest cover. Move the slider below to model a reallocation.`
        : "";

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setAsking(true);
    try {
      const scenario = calc
        ? {
            districtName: selectedDistrictName,
            stateName: selectedDistrictState,
            totalKm2: calc.totalKm2,
            totalHectares: calc.totalHectares,
            currentForestPct: calc.currentForestPct,
            currentForestHectares: calc.currentForestHectares,
            currentOtherHectares: calc.currentOtherHectares,
            deltaHectares,
            newForestPct: calc.newForestPct,
            newForestHectares: calc.newForestHectares,
            newOtherHectares: calc.newOtherHectares,
          }
        : null;
      const { answer } = await api.askScenarioQuestion(q, scenario);
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I couldn't answer that just now. Please try again." },
      ]);
    } finally {
      setAsking(false);
    }
  }

  function clearThread() {
    setMessages([]);
    try {
      sessionStorage.removeItem(THREAD_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <DashboardShell>
      <h2 className="mb-1 font-serif-display text-2xl font-semibold text-register-navy">
        Scenario &amp; Decision Support
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-register-ink/60">
        Model shifting hectares between forest and all other land for a district, using that
        district&apos;s own real area and forest-cover figures, then ask questions about the result
        below. This is transparent arithmetic on real inputs, not a predictive model or an official
        projection.
      </p>

      <div className="mb-6 rounded-sm border border-register-line bg-register-panel shadow-card">
        <button
          onClick={() => setShowLegend((s) => !s)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-register-navy/80"
        >
          <span>How to read this page</span>
          <span className="text-register-ink/40">{showLegend ? "Hide ▲" : "Show ▼"}</span>
        </button>
        {showLegend && (
          <div className="grid gap-3 border-t border-register-line px-4 py-4 text-xs text-register-ink/70 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-1 flex items-center gap-1.5 font-medium text-register-ink/85">
                District &amp; slider <DataStatusBadge status="OFFICIAL" />
              </p>
              <p>Real Census 2011 area and a sourced forest-cover figure, where one exists for that district.</p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 font-medium text-register-ink/85">
                Current vs. proposed chart <DataStatusBadge status="DERIVED" />
              </p>
              <p>Arithmetic reallocation of the slider's hectares between forest and other land — not a prediction.</p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 font-medium text-register-ink/85">
                Comparative statistics <DataStatusBadge status="OFFICIAL" />
              </p>
              <p>This district against other real, sourced districts and the National Land Use Trends dataset (NRSC / World Bank / FAO).</p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 font-medium text-register-ink/85">
                Ask a question <DataStatusBadge status="DERIVED" />
              </p>
              <p>A rule-based engine that answers only from this platform's own data — never a general AI chatbot.</p>
            </div>
          </div>
        )}
      </div>

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
        <div className="max-w-2xl rounded-sm border border-dashed border-register-ochre/50 bg-register-ochre/[0.05] p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-medium text-register-ink/85">
              No real forest-cover figure is on record for {selectedDistrictName} yet
            </p>
          </div>
          <p className="text-sm leading-relaxed text-register-ink/70">
            {selectedDistrictName}&apos;s total area ({fmt(areaIndicator.value ?? 0)} km²) is on record ({" "}
            <DataStatusBadge status="OFFICIAL" className="align-middle" />), but this platform has not sourced a
            forest-cover percentage for it, so there isn&apos;t a second real land-use figure to model a
            reallocation between. Nothing is fabricated to fill the gap.
          </p>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-register-ink/50">
            Districts with a real, cited forest-cover figure — click to switch
          </p>
          <div className="flex flex-wrap gap-2">
            {otherDistrictsWithForestData.map((d) => (
              <button
                key={d.id}
                onClick={() => setAreaId(d.id)}
                className="flex items-center gap-1.5 rounded-full border border-register-navy/25 bg-white px-3 py-1.5 text-xs font-medium text-register-navy transition-colors hover:border-register-navy hover:bg-register-navy hover:text-white"
              >
                {d.name}
                <span className="text-[10px] opacity-70">{fmt(d.forestPct as number)}% forest</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: decision-support output */}
          <div className="space-y-6">
            <div className="rounded-sm border border-register-navy/30 bg-register-navy/[0.04] p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-register-navy/70">Decision summary</p>
              <p className="mt-2 text-base font-medium leading-relaxed text-register-navy">{summarySentence}</p>
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
              <div className="mt-2 flex justify-between text-[11px] text-register-ink/40">
                <span>← more other land</span>
                <span>more forest →</span>
              </div>
              <p className="mt-3 text-xs text-register-ink/50">
                Bounded so neither category can go below zero or above the district&apos;s total area.
              </p>
            </div>

            <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-serif-display text-base font-semibold text-register-navy">
                  Current vs. proposed — {selectedDistrictName}
                </h3>
                <DataStatusBadge status={forestIndicator!.dataset.data_status} />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" vertical={false} />
                    <XAxis dataKey="scenario" tick={{ fontSize: 12 }} stroke="#8a8272" />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#8a8272"
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                      label={{ value: "Hectares", angle: -90, position: "insideLeft", fontSize: 11 }}
                    />
                    <Tooltip formatter={(value: number) => fmt(value) + " ha"} />
                    <Legend />
                    <Bar dataKey="Forest (ha)" stackId="a" fill="#0f3d5c" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Other land (ha)" stackId="a" fill="#c9bfa0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-register-ink/50">Forest cover: current → proposed</p>
                  <p className="mt-1 font-serif-display text-xl font-semibold text-register-navy">
                    {fmt(calc.currentForestPct)}% → {fmt(calc.newForestPct)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-register-ink/50">Other land: current → proposed</p>
                  <p className="mt-1 font-serif-display text-xl font-semibold text-register-navy">
                    {fmt(100 - calc.currentForestPct)}% → {fmt(100 - calc.newForestPct)}%
                  </p>
                </div>
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

            {/* Comparative statistics */}
            <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-serif-display text-base font-semibold text-register-navy">
                  How {selectedDistrictName} compares
                </h3>
                <DataStatusBadge status="OFFICIAL" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-sm border border-register-line bg-register-bg/50 p-3 text-center">
                  <p className="font-serif-display text-xl font-semibold text-register-navy">
                    {rankAmongSourced > 0 ? `#${rankAmongSourced}` : "—"}
                  </p>
                  <p className="text-[11px] text-register-ink/55">of {districtsWithForestData.length} districts, by forest cover</p>
                </div>
                <div className="rounded-sm border border-register-line bg-register-bg/50 p-3 text-center">
                  <p className="font-serif-display text-xl font-semibold text-register-navy">
                    {nationalAvgForestOfSourced !== null ? `${fmt(nationalAvgForestOfSourced)}%` : "—"}
                  </p>
                  <p className="text-[11px] text-register-ink/55">avg. forest cover, sourced districts</p>
                </div>
                <div className="rounded-sm border border-register-line bg-register-bg/50 p-3 text-center">
                  <p className="font-serif-display text-xl font-semibold text-register-navy">
                    {calc.currentForestPct >= (nationalAvgForestOfSourced ?? 0) ? "Above" : "Below"} avg.
                  </p>
                  <p className="text-[11px] text-register-ink/55">
                    {selectedDistrictName} at {fmt(calc.currentForestPct)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-register-line pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-register-ink/50">
                  Against National Land Use Trends (NRSC / World Bank / FAO)
                </p>
                <ul className="space-y-1.5 text-xs text-register-ink/70">
                  <li>
                    Nationally, agricultural land is <strong>{NATIONAL_LAND_USE.agriculturalLandPctOfTotal}%</strong> of
                    India&apos;s total area ({NATIONAL_LAND_USE.agriculturalLandYear}) — compare against{" "}
                    {selectedDistrictName}&apos;s {fmt(100 - calc.currentForestPct)}% non-forest land share above.
                  </li>
                  <li>
                    India&apos;s built-up area grew <strong>{NATIONAL_LAND_USE.builtUpArea.increasePct}%</strong> over{" "}
                    {NATIONAL_LAND_USE.builtUpArea.period}, drawing about {NATIONAL_LAND_USE.agriculturalCategoriesCombinedPct}%
                    of that growth from agricultural land nationally.
                  </li>
                </ul>
                <a href="/gov/policy-analytics" className="mt-2 inline-block text-xs font-medium text-register-navy hover:underline">
                  See the full National Land Use Trends charts on Policy Analytics →
                </a>
              </div>

              {otherDistrictsWithForestData.length > 0 && (
                <div className="mt-4 border-t border-register-line pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-register-ink/50">
                    Other districts with real forest-cover data — click to compare
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {otherDistrictsWithForestData.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setAreaId(d.id)}
                        className="flex items-center gap-1.5 rounded-full border border-register-line bg-white px-3 py-1.5 text-xs font-medium text-register-ink/75 transition-colors hover:border-register-navy hover:bg-register-navy hover:text-white"
                      >
                        {d.name}
                        <span className="text-[10px] opacity-70">{fmt(d.forestPct as number)}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Q&A assistant */}
          <div className="flex max-h-[900px] flex-col rounded-sm border border-register-line bg-register-panel shadow-card">
            <div className="border-b border-register-line px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif-display text-base font-semibold text-register-navy">Ask a question</h3>
                {messages.length > 0 && (
                  <button
                    onClick={clearThread}
                    className="text-xs font-medium text-register-ink/40 hover:text-register-ink/70"
                  >
                    Clear thread
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-register-ink/55">
                Answers are generated by a rule-based engine grounded entirely in this app&apos;s own data —
                the district figures above, this scenario&apos;s live state, and the National Land Use Trends
                dataset on Policy Analytics. No external AI call is made.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <div className="space-y-2 text-xs text-register-ink/50">
                  <p>Try asking:</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>&quot;What happens to forest cover if I convert 10% to residential?&quot;</li>
                    <li>&quot;Which district has the most conversion risk?&quot;</li>
                    <li>&quot;How much agricultural land fed India&apos;s built-up growth nationally?&quot;</li>
                  </ul>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    "max-w-[92%] rounded-sm px-3 py-2 text-sm leading-relaxed " +
                    (m.role === "user"
                      ? "ml-auto bg-register-navy text-white"
                      : "bg-register-bg text-register-ink/85")
                  }
                >
                  {m.text}
                </div>
              ))}
              {asking && (
                <div className="max-w-[92%] rounded-sm bg-register-bg px-3 py-2 text-sm text-register-ink/50">
                  Thinking…
                </div>
              )}
              <div ref={threadEndRef} />
            </div>

            <form onSubmit={handleAsk} className="flex gap-2 border-t border-register-line p-3">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about this scenario or a district…"
                className="flex-1 rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
              />
              <button
                type="submit"
                disabled={asking || !question.trim()}
                className="rounded-sm bg-register-navy px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-register-navy2 disabled:opacity-50"
              >
                Ask
              </button>
            </form>
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
