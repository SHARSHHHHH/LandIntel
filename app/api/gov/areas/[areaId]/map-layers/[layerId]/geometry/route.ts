import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function GET(
  req: NextRequest,
  { params }: { params: { areaId: string; layerId: string } }
) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const layer = db.prepare("SELECT * FROM map_layers WHERE id = ?").get(params.layerId) as any;
    if (!layer || layer.geographic_unit_id !== params.areaId) {
      throw new ApiError(404, "Map layer not found for this area");
    }
    if (!layer.geojson) throw new ApiError(404, "No geometry stored for this layer yet");
    return NextResponse.json({
      id: layer.id,
      name: layer.name,
      data_status: layer.data_status,
      geojson: JSON.parse(layer.geojson),
      style: layer.style ? JSON.parse(layer.style) : null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
