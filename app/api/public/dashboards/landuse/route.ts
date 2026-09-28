import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/public/db";
import { dbToMap, STATE_CODES } from "@/lib/public/atlas/aliases";

export async function GET() {
  const db = getDatabase();

  const states = db
    .prepare(
      "SELECT state_name, state_code, urbanshare_pct, agri_pct, forest_pct, climate_vulnerability FROM public_state_stats WHERE data_available = 1"
    )
    .all() as any[];

  const landUse = states
    .map((s) => ({
      name: s.state_name,
      mapName: dbToMap(s.state_name),
      code: s.state_code || STATE_CODES[s.state_name] || "",
      urban: s.urbanshare_pct ?? 0,
      agri: s.agri_pct ?? 0,
      forest: s.forest_pct ?? 0,
    }))
    .sort((a, b) => b.urban - a.urban);

  const national = {
    urban: Math.round(landUse.reduce((a, s) => a + s.urban, 0) / Math.max(1, landUse.length)),
    agri: Math.round(landUse.reduce((a, s) => a + s.agri, 0) / Math.max(1, landUse.length)),
    forest: Math.round(landUse.reduce((a, s) => a + s.forest, 0) / Math.max(1, landUse.length)),
  };

  const takeaway = `Urban share is highest in ${landUse[0]?.name}, ${landUse[0]?.urban}% — built-up growth around metros is converting farmland fast. States with over 60% agriculture need protection-focused zoning.`;

  return NextResponse.json({
    success: true,
    data: {
      landUse,
      national,
      takeaway,
      topUrban: landUse.slice(0, 5),
    },
  });
}