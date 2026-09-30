import Link from "next/link";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { StateRow, TrendSplit } from "@/lib/admin/overview-types";
import { formatNumber } from "@/components/admin/OverviewBits";

function TrendChip({ trend }: { trend: StateRow["trend"] }) {
  if (trend === "rising") {
    return (
      <span className="inline-flex items-center gap-1 border border-[#9A2B2B]/40 bg-[#9A2B2B]/5 px-1.5 py-0.5 text-[10px] font-semibold text-[#9A2B2B]">
        <TrendingUp className="h-3 w-3" /> Rising
      </span>
    );
  }
  if (trend === "falling") {
    return (
      <span className="inline-flex items-center gap-1 border border-[#1F4D3A]/40 bg-[#1F4D3A]/5 px-1.5 py-0.5 text-[10px] font-semibold text-[#1F4D3A]">
        <TrendingDown className="h-3 w-3" /> Falling
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 border border-register-line bg-register-ink/[0.03] px-1.5 py-0.5 text-[10px] font-semibold text-register-ink/60">
      <Minus className="h-3 w-3" /> Stable
    </span>
  );
}

export function StateSituation({
  states,
  trendSplit,
  trackedStates,
  shown,
}: {
  states: StateRow[];
  trendSplit: TrendSplit;
  trackedStates: number;
  shown: number;
}) {
  const maxDisputes = states.length > 0 ? Math.max(...states.map((s) => s.disputes)) : 1;

  return (
    <div className="border border-register-line bg-register-panel shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-register-line px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-register-ink/50">
            Dispute trend coverage
          </span>
          <div className="flex h-2 w-40 overflow-hidden border border-register-line">
            <div
              className="bg-[#9A2B2B]"
              style={{ width: `${trackedStates ? (trendSplit.rising / trackedStates) * 100 : 0}%` }}
            />
            <div
              className="bg-register-navy/50"
              style={{ width: `${trackedStates ? (trendSplit.stable / trackedStates) * 100 : 0}%` }}
            />
            <div
              className="bg-[#1F4D3A]"
              style={{ width: `${trackedStates ? (trendSplit.falling / trackedStates) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-register-ink/60">
            <span className="font-semibold text-[#9A2B2B]">{trendSplit.rising} rising</span>
            {" · "}
            {trendSplit.stable} stable ·{" "}
            <span className="font-semibold text-[#1F4D3A]">{trendSplit.falling} falling</span>
          </span>
        </div>
        <span className="border border-register-ochre/60 bg-register-ochre/10 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8A6516]">
          Sample · public portal statistics
        </span>
      </div>

      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-register-line bg-register-ink/[0.02] text-left text-[9.5px] font-bold uppercase tracking-[0.1em] text-register-ink/50">
            <th className="w-[26%] px-4 py-2 font-bold">State / region</th>
            <th className="w-[24%] px-3 py-2 font-bold">Land disputes</th>
            <th className="w-[13%] px-3 py-2 font-bold">Status</th>
            <th className="hidden w-[12%] px-3 py-2 text-right font-bold md:table-cell">Programmes</th>
            <th className="hidden w-[13%] px-3 py-2 text-right font-bold lg:table-cell">Platform research</th>
            <th className="hidden w-[12%] px-4 py-2 text-right font-bold lg:table-cell">Villages</th>
          </tr>
        </thead>
        <tbody>
          {states.map((s) => (
            <tr key={s.code} className="border-b border-register-line/60 last:border-b-0 hover:bg-register-ink/[0.02]">
              <td className="min-w-0 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 border border-register-line bg-register-ink/[0.04] px-1 py-px text-[9px] font-bold tabular-nums text-register-ink/60">
                    {s.code}
                  </span>
                  <span className="truncate text-[13px] font-semibold text-register-ink">{s.name}</span>
                  {s.researchLinks > 0 && (
                    <span
                      title={`${s.researchLinks} linked research records`}
                      className="shrink-0 border border-[#17605E]/40 bg-[#17605E]/5 px-1 py-px text-[9px] font-bold text-[#17605E]"
                    >
                      R
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="text-[12.5px] font-semibold tabular-nums text-register-ink">{formatNumber(s.disputes)}</div>
                <div className="mt-1 h-1 w-full bg-register-ink/10">
                  <div
                    className={`h-full ${s.trend === "rising" ? "bg-[#9A2B2B]" : s.trend === "falling" ? "bg-[#1F4D3A]" : "bg-register-navy/60"}`}
                    style={{ width: `${Math.max(3, (s.disputes / maxDisputes) * 100)}%` }}
                  />
                </div>
              </td>
              <td className="px-3 py-2.5">
                <TrendChip trend={s.trend} />
              </td>
              <td className="hidden px-3 py-2.5 text-right text-[12.5px] tabular-nums text-register-ink/75 md:table-cell">
                {formatNumber(s.programmes)}
              </td>
              <td className="hidden px-3 py-2.5 text-right text-[12.5px] tabular-nums text-register-ink/75 lg:table-cell">
                {s.researchLinks > 0 ? (
                  <span className="font-semibold text-[#17605E]">{s.researchLinks} linked</span>
                ) : (
                  <span className="text-register-ink/35">—</span>
                )}
              </td>
              <td className="hidden px-4 py-2.5 text-right text-[12.5px] tabular-nums text-register-ink/75 lg:table-cell">
                {formatNumber(s.villages)}
              </td>
            </tr>
          ))}
          {states.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-register-ink/50">
                No state statistics available from the Public portal database.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-register-line px-4 py-2.5 text-[10.5px] text-register-ink/55">
        <span>
          Showing {shown} of {trackedStates} tracked states · ordered by open disputes · figures are illustrative
          (sample) statistics
        </span>
        <Link href="/public" className="font-semibold text-register-navy underline-offset-2 hover:underline">
          Open full state atlas →
        </Link>
      </div>
    </div>
  );
}
