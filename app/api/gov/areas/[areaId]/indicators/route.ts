import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { serializeIndicatorValue, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { areaId: string } }) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const area = db.prepare("SELECT id FROM geographic_units WHERE id = ?").get(params.areaId);
    if (!area) throw new ApiError(404, "Area not found");

    const category = req.nextUrl.searchParams.get("category");
    const rows = db.prepare("SELECT * FROM indicator_values WHERE geographic_unit_id = ?").all(params.areaId) as any[];
    let out = rows.map(serializeIndicatorValue);
    if (category) out = out.filter((o) => o.category === category);
    return NextResponse.json(out);
  } catch (err) {
    return errorResponse(err);
  }
}
