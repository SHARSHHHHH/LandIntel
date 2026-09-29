import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { getCurrentUser } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

/**
 * Every district's real area/forest-cover/state figures, for the Scenario
 * page's comparative-statistics panel (which districts have both figures
 * sourced, and how the selected district compares). Same underlying query
 * as /api/gov/scenario-qa, exposed directly so the page can render it
 * without going through the Q&A engine.
 */
export async function GET(req: NextRequest) {
  try {
    getCurrentUser(req);
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT gu.id, gu.name, parent.name AS state_name,
                area_ind.value AS area_km2,
                forest_ind.value AS forest_pct
         FROM geographic_units gu
         LEFT JOIN geographic_units parent ON parent.id = gu.parent_id
         LEFT JOIN indicators area_i ON area_i.name = 'District area'
         LEFT JOIN indicator_values area_ind ON area_ind.geographic_unit_id = gu.id AND area_ind.indicator_id = area_i.id
         LEFT JOIN indicators forest_i ON forest_i.name = 'Forest cover'
         LEFT JOIN indicator_values forest_ind ON forest_ind.geographic_unit_id = gu.id AND forest_ind.indicator_id = forest_i.id
         WHERE gu.level = 'district'
         ORDER BY gu.name ASC`
      )
      .all() as any[];
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        stateName: r.state_name ?? "",
        areaKm2: r.area_km2 ?? null,
        forestPct: r.forest_pct ?? null,
      }))
    );
  } catch (err) {
    return errorResponse(err);
  }
}
