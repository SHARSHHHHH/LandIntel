import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { serializeGeographicUnit, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const level = req.nextUrl.searchParams.get("level");
    const parentId = req.nextUrl.searchParams.get("parent_id");
    let query = "SELECT * FROM geographic_units WHERE 1=1";
    const params: any[] = [];
    if (level) {
      query += " AND level = ?";
      params.push(level);
    }
    if (parentId) {
      query += " AND parent_id = ?";
      params.push(parentId);
    }
    query += " ORDER BY name";
    const rows = db.prepare(query).all(...params) as any[];
    return NextResponse.json(rows.map(serializeGeographicUnit));
  } catch (err) {
    return errorResponse(err);
  }
}
