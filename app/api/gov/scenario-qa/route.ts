import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { getCurrentUser, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { answerQuestion, type DistrictFact, type ScenarioContext } from "@/lib/gov/qa-engine";

/**
 * Rule-based, fully offline Q&A for the Scenario & Decision Support page.
 * Grounds every answer in this platform's own data: the real district
 * area/forest-cover/population-density indicators already seeded in
 * gov.db, plus the current live state of that page's reallocation
 * calculator (sent up as `scenario`). See lib/gov/qa-engine.ts.
 */
export async function POST(req: NextRequest) {
  try {
    getCurrentUser(req);
    const body = await req.json().catch(() => null);
    const question: string = body?.question ?? "";
    const scenario: ScenarioContext | null = body?.scenario ?? null;
    if (!question || typeof question !== "string") {
      throw new ApiError(400, "A question is required.");
    }

    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT gu.id, gu.name, parent.name AS state_name,
                area_ind.value AS area_km2,
                forest_ind.value AS forest_pct,
                density_ind.value AS density
         FROM geographic_units gu
         LEFT JOIN geographic_units parent ON parent.id = gu.parent_id
         LEFT JOIN indicators area_i ON area_i.name = 'District area'
         LEFT JOIN indicator_values area_ind ON area_ind.geographic_unit_id = gu.id AND area_ind.indicator_id = area_i.id
         LEFT JOIN indicators forest_i ON forest_i.name = 'Forest cover'
         LEFT JOIN indicator_values forest_ind ON forest_ind.geographic_unit_id = gu.id AND forest_ind.indicator_id = forest_i.id
         LEFT JOIN indicators density_i ON density_i.name = 'Population density'
         LEFT JOIN indicator_values density_ind ON density_ind.geographic_unit_id = gu.id AND density_ind.indicator_id = density_i.id
         WHERE gu.level = 'district'`
      )
      .all() as any[];

    const districts: DistrictFact[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      stateName: r.state_name ?? "",
      areaKm2: r.area_km2 ?? null,
      forestCoverPct: r.forest_pct ?? null,
      populationDensity: r.density ?? null,
    }));

    const answer = answerQuestion(question, districts, scenario);
    return NextResponse.json({ answer });
  } catch (err) {
    return errorResponse(err);
  }
}
