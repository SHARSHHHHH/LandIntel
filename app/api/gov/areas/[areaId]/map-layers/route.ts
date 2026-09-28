import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { areaId: string } }) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const area = db.prepare("SELECT id FROM geographic_units WHERE id = ?").get(params.areaId);
    if (!area) throw new ApiError(404, "Area not found");

    const layers = db.prepare("SELECT * FROM map_layers WHERE geographic_unit_id = ?").all(params.areaId) as any[];
    const out = layers.map((layer) => {
      const dataset = layer.dataset_id ? (db.prepare("SELECT * FROM datasets WHERE id = ?").get(layer.dataset_id) as any) : null;
      const source = dataset?.data_source_id
        ? (db.prepare("SELECT name FROM data_sources WHERE id = ?").get(dataset.data_source_id) as any)
        : null;
      return {
        id: layer.id,
        name: layer.name,
        layer_type: layer.layer_type,
        data_status: layer.data_status,
        reference_year: dataset?.reference_year ?? null,
        source_name: source?.name ?? null,
        has_geometry: !!layer.geojson,
      };
    });
    return NextResponse.json(out);
  } catch (err) {
    return errorResponse(err);
  }
}
