import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { serializeGeographicUnit, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const geo = db.prepare("SELECT * FROM geographic_units WHERE id = ?").get(params.id);
    if (!geo) throw new ApiError(404, "Geographic unit not found");
    return NextResponse.json(serializeGeographicUnit(geo));
  } catch (err) {
    return errorResponse(err);
  }
}
