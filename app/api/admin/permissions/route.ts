import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_roles");
    const db = getDatabase();
    const rows = db.prepare("SELECT id, code FROM permissions ORDER BY code").all();
    return NextResponse.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}
