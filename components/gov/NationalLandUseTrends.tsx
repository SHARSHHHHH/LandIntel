"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataStatusBadge } from "@/components/gov/DataStatusBadge";
import { NATIONAL_LAND_USE } from "@/lib/gov/national-land-use";

/**
 * Real, sourced national land-use dataset (not sample/demo data) -- see the
 * exact figures and citations in lib/gov/national-land-use.ts. Every number
 * here is tagged OFFICIAL via DataStatusBadge, using the same real/sample/
 * derived vocabulary the rest of the Government portal already uses.
 */

const NRSC_ATLAS_URL =
  "https://www.nrsc.gov.in/nrscnew/assets/pdf/atlas/LULC/LULC%20Atlas%20Final%20With%20Cover_March2024.pdf";
const DOWN_TO_EARTH_URL =
  "https://www.downtoearth.org.in/urbanisation/india-s-built-up-area-grew-by-2-5-million-hectares-in-17-years-95484";
const WORLD_BANK_AGRI_URL = "https://data.worldbank.org/indicator/AG.LND.AGRI.ZS?locations=IN";
const WORLD_BANK_IRRIG_URL = "https://data.worldbank.org/indicator/AG.LND.IRIG.AG.ZS";
const FAOSTAT_URL = "https://www.fao.org/faostat/en/#data/RL";

const builtUpTrend = [
  { year: "2005-06", millionHectares: NATIONAL_LAND_USE.builtUpArea.baselineMillionHectares, label: "Baseline" },
  {
    year: "2022-23",
    millionHectares: NATIONAL_LAND_USE.builtUpArea.latestMillionHectares,
    label: `+${NATIONAL_LAND_USE.builtUpArea.increasePct}% / +${NATIONAL_LAND_USE.builtUpArea.increaseMillionHectares}M ha`,
  },
];

const landSourceBreakdown = NATIONAL_LAND_USE.landSources;

const highwayGrowth = NATIONAL_LAND_USE.highwayGrowthByState;

function SourceNote({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <p className="mt-2 text-[11px] text-register-ink/50">
      Source:{" "}
      <a href={href} target="_blank" rel="noreferrer" className="underline hover:text-register-navy">
        {children}
      </a>
    </p>
  );
}

export function NationalLandUseTrends() {
  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif-display text-xl font-semibold text-register-navy">
          National Land Use Trends
        </h3>
        <DataStatusBadge status="OFFICIAL" />
      </div>
      <p className="mb-5 max-w-3xl text-sm text-register-ink/60">
        Real, published national figures on India&apos;s built-up area expansion and the agricultural
        land it is drawing from -- cited to the National Remote Sensing Centre (NRSC), the World Bank
        and FAO. This is fixed national context, not derived from the district indicators below.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Built-up area growth trend */}
        <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
          <h4 className="font-serif-display text-base font-semibold text-register-navy">
            Built-up area, 2005-06 → 2022-23
          </h4>
          <p className="mt-1 text-xs text-register-ink/60">
            +2.5 million hectares · 31% overall increase · 2.4% average annual growth
          </p>
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={builtUpTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#8a8272" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#8a8272"
                  label={{ value: "Million hectares", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value.toFixed(2)}M ha`,
                    item?.payload?.label ?? "",
                  ]}
                />
                <Bar dataKey="millionHectares" radius={[4, 4, 0, 0]}>
                  {builtUpTrend.map((entry, i) => (
                    <Cell key={entry.year} fill={i === 0 ? "#9ca3af" : "#0f3d5c"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SourceNote href={NRSC_ATLAS_URL}>
            NRSC, Annual Land Use and Land Cover Atlas of India, March 2024
          </SourceNote>
        </div>

        {/* Land-source breakdown */}
        <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card">
          <h4 className="font-serif-display text-base font-semibold text-register-navy">
            What fed that built-up expansion
          </h4>
          <p className="mt-1 text-xs text-register-ink/60">
            Share of the 2005-06→2022-23 built-up growth, by prior land category
          </p>
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={landSourceBreakdown}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8a8272" unit="%" />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={160}
                  tick={{ fontSize: 11 }}
                  stroke="#8a8272"
                />
                <Tooltip formatter={(value: number) => [`${value}%`, "Share of built-up growth"]} />
                <Bar dataKey="pct" fill="#b45309" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-register-ink/50">
            Agricultural categories combined: ~23.4% (double/triple-cropped, kharif, rabi and
            plantation land together).
          </p>
          <SourceNote href={NRSC_ATLAS_URL}>
            NRSC, Annual Land Use and Land Cover Atlas of India, March 2024
          </SourceNote>
        </div>

        {/* Highway growth by state */}
        <div className="rounded-sm border border-register-line bg-register-panel p-5 shadow-card lg:col-span-2">
          <h4 className="font-serif-display text-base font-semibold text-register-navy">
            National highway length growth, 2005-2023 (top 5 states)
          </h4>
          <p className="mt-1 text-xs text-register-ink/60">
            A proxy for infrastructure-driven land pressure in fast-growing states
          </p>
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={highwayGrowth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" vertical={false} />
                <XAxis dataKey="state" tick={{ fontSize: 12 }} stroke="#8a8272" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8a8272" unit="%" />
                <Tooltip formatter={(value: number) => [`+${value}%`, "Highway length growth"]} />
                <Bar dataKey="pct" fill="#0f3d5c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SourceNote href={DOWN_TO_EARTH_URL}>
            Down To Earth, analysis of NRSC data — &quot;India&apos;s built-up area grew by 2.5 million
            hectares in 17 years&quot;
          </SourceNote>
        </div>
      </div>

      {/* Headline stat cards */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-register-ink/50">Agricultural land</p>
          <p className="mt-1 font-serif-display text-2xl font-semibold text-register-navy">60.06%</p>
          <p className="text-xs text-register-ink/60">of India&apos;s total land area, 2023</p>
          <SourceNote href={WORLD_BANK_AGRI_URL}>World Bank WDI, indicator AG.LND.AGRI.ZS</SourceNote>
        </div>
        <div className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-register-ink/50">Cropland</p>
          <p className="mt-1 font-serif-display text-2xl font-semibold text-register-navy">~169M ha</p>
          <p className="text-xs text-register-ink/60">FAO figure, 2020 (most recent published)</p>
          <SourceNote href={FAOSTAT_URL}>FAO FAOSTAT, Land Use domain</SourceNote>
        </div>
        <div className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-register-ink/50">Irrigated agricultural land</p>
          <p className="mt-1 font-serif-display text-2xl font-semibold text-register-navy">44.41%</p>
          <p className="text-xs text-register-ink/60">of India&apos;s agricultural land, 2023</p>
          <SourceNote href={WORLD_BANK_IRRIG_URL}>World Bank WDI, indicator AG.LND.IRIG.AG.ZS</SourceNote>
        </div>
      </div>
    </section>
  );
}
