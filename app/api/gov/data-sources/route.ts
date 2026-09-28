import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

function serializeSourceRow(s: any) {
  return {
    id: s.id,
    name: s.name,
    provider: s.provider,
    base_url: s.base_url,
    access_type: s.access_type,
    license: s.license,
    status: s.status,
  };
}

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM data_sources").all() as any[];
    return NextResponse.json(rows.map(serializeSourceRow));
  } catch (err) {
    return errorResponse(err);
  }
}
