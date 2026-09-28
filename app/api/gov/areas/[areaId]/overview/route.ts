import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { serializeGeographicUnit, serializeIndicatorValue, errorResponse } from "@/lib/gov/serialize";

function sectionSummary(values: any[]) {
  if (values.length === 0) {
    return { available: false, status: null, note: "No dataset is configured for this indicator group in this area yet." };
  }
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v.dataset.data_status, (counts.get(v.dataset.data_status) ?? 0) + 1);
  let dominant = values[0].dataset.data_status;
  let max = 0;
  for (const [status, count] of counts) {
    if (count > max) {
      max = count;
      dominant = status;
    }
  }
  return { available: true, status: dominant, note: null };
}

export async function GET(req: NextRequest, { params }: { params: { areaId: string } }) {
  try {
    const user = requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const area = db.prepare("SELECT * FROM geographic_units WHERE id = ?").get(params.areaId) as any;
    if (!area) throw new ApiError(404, "Area not found");

    db.prepare(
      "INSERT INTO audit_logs (id, user_id, action, resource, resource_id, extra, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(uid(), user.id, "view_area_overview", "geographic_unit", area.id, null, nowIso());

    const rows = db.prepare("SELECT * FROM indicator_values WHERE geographic_unit_id = ?").all(params.areaId) as any[];
    const serialized = rows.map(serializeIndicatorValue);
    const landValues = serialized.filter((v) => v.category === "land");
    const seValues = serialized.filter((v) => v.category === "socioeconomic");

    const documentsCount = (db.prepare("SELECT COUNT(*) as c FROM documents WHERE geographic_unit_id = ?").get(params.areaId) as any).c;
    const mapLayersCount = (db.prepare("SELECT COUNT(*) as c FROM map_layers WHERE geographic_unit_id = ?").get(params.areaId) as any).c;

    const allStatuses = [...landValues, ...seValues].map((v) => v.dataset.data_status);
    const statusSummary = {
      official: allStatuses.filter((s) => s === "OFFICIAL").length,
      sample: allStatuses.filter((s) => s === "SAMPLE").length,
      derived: allStatuses.filter((s) => s === "DERIVED").length,
      historical: allStatuses.filter((s) => s === "HISTORICAL").length,
    };

    const datasetIds = new Set([...landValues, ...seValues].map((v) => v.dataset.id));

    return NextResponse.json({
      area: serializeGeographicUnit(area),
      datasets_count: datasetIds.size,
      documents_count: documentsCount,
      map_layers_count: mapLayersCount,
      last_updated: null,
      land_summary: sectionSummary(landValues),
      socioeconomic_summary: sectionSummary(seValues),
      land_indicators: landValues,
      socioeconomic_indicators: seValues,
      data_status_summary: statusSummary,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
