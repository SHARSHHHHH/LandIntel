import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { serializeReport, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    const user = requirePermission(req, "manage_reports");
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM reports WHERE owner_id = ? ORDER BY updated_at DESC")
      .all(user.id) as any[];
    return NextResponse.json(rows.map(serializeReport));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requirePermission(req, "manage_reports");
    const body = await req.json();
    const db = getDatabase();
    const id = uid();
    const now = nowIso();
    db.prepare(
      "INSERT INTO reports (id, title, geographic_unit_id, workspace_id, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)"
    ).run(id, body.title, body.geographic_unit_id ?? null, body.workspace_id ?? null, user.id, now, now);
    const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    return NextResponse.json(serializeReport(row));
  } catch (err) {
    return errorResponse(err);
  }
}
