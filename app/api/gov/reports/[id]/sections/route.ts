import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { getOwnedReport } from "@/lib/gov/report";
import { serializeReportSection, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_reports");
    const r = getOwnedReport(params.id, user);
    const body = await req.json();
    const db = getDatabase();
    const count = (db.prepare("SELECT COUNT(*) as c FROM report_sections WHERE report_id = ?").get(r.id) as any).c;
    const id = uid();
    db.prepare(
      "INSERT INTO report_sections (id, report_id, section_type, title, content, reference_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, r.id, body.section_type, body.title, body.content ?? null, body.reference_id ?? null, count);
    const row = db.prepare("SELECT * FROM report_sections WHERE id = ?").get(id);
    return NextResponse.json(serializeReportSection(row));
  } catch (err) {
    return errorResponse(err);
  }
}
