import { NextRequest, NextResponse } from "next/server";
import { getDatabase, nowIso } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { getOwnedReport } from "@/lib/gov/report";
import { serializeReport, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_reports");
    const r = getOwnedReport(params.id, user);
    const db = getDatabase();
    db.prepare("UPDATE reports SET status = 'final', updated_at = ? WHERE id = ?").run(nowIso(), r.id);
    const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(r.id);
    return NextResponse.json(serializeReport(row));
  } catch (err) {
    return errorResponse(err);
  }
}
