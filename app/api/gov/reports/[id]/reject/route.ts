import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getOwnedReport } from "@/lib/gov/report";
import { serializeReport, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_reports");
    const r = getOwnedReport(params.id, user);
    if (r.status !== "pending_review") {
      throw new ApiError(400, `Only a report with status "pending_review" can be rejected (this one is "${r.status}").`);
    }
    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "No reason given.";

    const db = getDatabase();
    const now = nowIso();
    db.prepare("UPDATE reports SET status = 'rejected', rejection_reason = ?, updated_at = ? WHERE id = ?").run(reason, now, r.id);
    if (r.source_document_id) {
      db.prepare("UPDATE uploaded_documents SET status = 'rejected' WHERE id = ?").run(r.source_document_id);
    }
    db.prepare(
      "INSERT INTO audit_logs (id, user_id, action, resource, resource_id, extra, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(uid(), user.id, "reject_report", "report", r.id, JSON.stringify({ reason }), now);

    const updated = db.prepare("SELECT * FROM reports WHERE id = ?").get(r.id);
    return NextResponse.json(serializeReport(updated));
  } catch (err) {
    return errorResponse(err);
  }
}
