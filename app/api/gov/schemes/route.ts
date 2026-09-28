import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { serializeScheme, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_schemes");
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM schemes ORDER BY name").all() as any[];
    return NextResponse.json(rows.map(serializeScheme));
  } catch (err) {
    return errorResponse(err);
  }
}
