import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { getOwnedReport } from "@/lib/gov/report";
import { serializeReport, serializeReportSection, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_reports");
    const r = getOwnedReport(params.id, user);
    const db = getDatabase();
    const sections = db
      .prepare("SELECT * FROM report_sections WHERE report_id = ? ORDER BY order_index")
      .all(r.id) as any[];
    return NextResponse.json({
      ...serializeReport(r),
      sections: sections.map(serializeReportSection),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
