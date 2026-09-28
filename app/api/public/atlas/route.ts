import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/public/db";
import { mapToDb, dbToMap, STATE_CODES } from "@/lib/public/atlas/aliases";

export async function GET(req: NextRequest) {
  const db = getDatabase();
  const url = new URL(req.url);
  const state = url.searchParams.get("state");

  if (state) {
    const row = db
      .prepare("SELECT * FROM public_state_stats WHERE state_name = ?")
      .get(mapToDb(state)) as any;

    if (!row) {
      return NextResponse.json({ success: false, error: "State not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { state: { ...row, map_name: dbToMap(row.state_name) } },
    });
  }

  const rows = db
    .prepare("SELECT * FROM public_state_stats ORDER BY state_name")
    .all() as any[];

  const states = rows.map((r) => ({
    name: r.state_name,
    mapName: dbToMap(r.state_name),
    code: r.state_code || STATE_CODES[r.state_name] || r.state_name.slice(0, 2).toUpperCase(),
    villages: r.villages_total,
    computerizedPct: r.villages_computerized_pct,
    mapsDigitizedPct: r.maps_digitized_pct,
    linkedPct: r.cadastral_linked_pct,
    ulpinPct: r.ulpin_coverage_pct,
    disputes: r.disputes_total,
    disputesTrend: r.disputes_trend,
    disputesPer1000: r.disputes_per_1000,
    urbanSharePct: r.urbanshare_pct,
    agriPct: r.agri_pct,
    forestPct: r.forest_pct,
    climateVulnerability: r.climate_vulnerability,
    projects: r.projects_active,
    story: r.story,
    hasData: !!r.data_available,
  }));

  return NextResponse.json({ success: true, data: { states } });
}