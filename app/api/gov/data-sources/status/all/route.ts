import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM data_sources").all() as any[];
    return NextResponse.json(
      rows.map((s) => ({ id: s.id, name: s.name, provider: s.provider, status: s.status }))
    );
  } catch (err) {
    return errorResponse(err);
  }
}
