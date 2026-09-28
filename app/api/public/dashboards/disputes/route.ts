import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/public/db";
import { dbToMap, STATE_CODES } from "@/lib/public/atlas/aliases";

export async function GET() {
  const db = getDatabase();

  const states = db
    .prepare(
      "SELECT state_name, state_code, disputes_total, disputes_trend, disputes_per_1000, villages_computerized_pct, maps_digitized_pct, cadastral_linked_pct, ulpin_coverage_pct, urbanshare_pct, agri_pct, forest_pct, climate_vulnerability FROM public_state_stats WHERE data_available = 1"
    )
    .all() as any[];

  const disputes = states.map((s) => ({
    name: s.state_name,
    mapName: dbToMap(s.state_name),
    code: s.state_code || STATE_CODES[s.state_name] || "",
    total: s.disputes_total ?? 0,
    trend: s.disputes_trend || "stable",
    per1000: s.disputes_per_1000 ?? 0,
  }));

  const topRising = [...states]
    .sort((a, b) => (b.disputes_trend === "rising" ? 1 : 0) - (a.disputes_trend === "rising" ? 1 : 0))
    .sort((a, b) => (b.disputes_total ?? 0) - (a.disputes_total ?? 0))
    .slice(0, 8)
    .map((s) => ({
      name: s.state_name,
      mapName: dbToMap(s.state_name),
      total: s.disputes_total ?? 0,
      trend: s.disputes_trend || "stable",
    }));

  const takeaway =
    "Disputes track record quality — states with complete linked maps (Chhattisgarh, AP, Gujarat) report falling or stable cases, while record-digitization laggards show rising volumes. Fixing records-first is the best dispute-reduction lever.";

  const highestPer1000 = [...disputes].sort((a, b) => b.per1000 - a.per1000)[0];

  return NextResponse.json({
    success: true,
    data: {
      disputes,
      topRising,
      highestPer1000,
      takeaway,
    },
  });
}