import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getOwnedReport } from "@/lib/gov/report";
import { errorResponse } from "@/lib/gov/serialize";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const user = requirePermission(req, "manage_reports");
    const r = getOwnedReport(params.id, user);
    const db = getDatabase();
    const section = db.prepare("SELECT * FROM report_sections WHERE id = ?").get(params.sectionId) as any;
    if (!section || section.report_id !== r.id) throw new ApiError(404, "Section not found in this report");
    db.prepare("DELETE FROM report_sections WHERE id = ?").run(params.sectionId);
    return NextResponse.json({ status: "deleted" });
  } catch (err) {
    return errorResponse(err);
  }
}
