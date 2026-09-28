import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const s = db.prepare("SELECT * FROM data_sources WHERE id = ?").get(params.id) as any;
    if (!s) throw new ApiError(404, "Data source not found");
    return NextResponse.json({
      id: s.id,
      name: s.name,
      provider: s.provider,
      base_url: s.base_url,
      access_type: s.access_type,
      license: s.license,
      status: s.status,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
