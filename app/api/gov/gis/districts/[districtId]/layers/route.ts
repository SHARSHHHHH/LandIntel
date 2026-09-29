import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { getLandRecordAdapter } from "@/lib/gov/gis/adapters";

/** Land parcel / land-use / government land / roads / water / disputed layers for a district. */
export async function GET(req: NextRequest, { params }: { params: { districtId: string } }) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const district = db.prepare("SELECT * FROM geographic_units WHERE id = ?").get(params.districtId) as any;
    if (!district) throw new ApiError(404, "District not found");
    const state = district.parent_id
      ? (db.prepare("SELECT * FROM geographic_units WHERE id = ?").get(district.parent_id) as any)
      : null;
    const stateCode: string = state?.code ?? String(district.code ?? "").split("-")[0];
    const stateName: string = state?.name ?? "State";

    const adapter = getLandRecordAdapter(stateCode);
    const result = adapter.getDistrictLayers(String(district.code ?? ""), district.name, stateName);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
