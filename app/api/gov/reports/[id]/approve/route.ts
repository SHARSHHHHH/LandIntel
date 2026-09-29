import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getOwnedReport } from "@/lib/gov/report";
import { serializeReport, errorResponse } from "@/lib/gov/serialize";

/**
 * Approve a pending-review report (one auto-generated from an uploaded
 * document). This is the "Approve -> Evidence & Research" step: it flips
 * the report and its source upload to approved, and mirrors it into the
 * `documents` table so it appears as a real evidence item on the Evidence &
 * Research page, linked back to the district and the original file.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_reports");
    const r = getOwnedReport(params.id, user);
    if (r.status !== "pending_review") {
      throw new ApiError(400, `Only a report with status "pending_review" can be approved (this one is "${r.status}").`);
    }

    const db = getDatabase();
    const now = nowIso();

    let summarySection: any = null;
    if (r.source_document_id) {
      summarySection = db
        .prepare("SELECT * FROM report_sections WHERE report_id = ? AND title = 'Automatic extraction summary' LIMIT 1")
        .get(r.id) as any;
    }

    let uploadedDoc: any = null;
    if (r.source_document_id) {
      uploadedDoc = db.prepare("SELECT * FROM uploaded_documents WHERE id = ?").get(r.source_document_id);
    }

    db.prepare("UPDATE reports SET status = 'approved', updated_at = ? WHERE id = ?").run(now, r.id);

    let evidenceDocumentId: string | null = null;
    if (uploadedDoc) {
      db.prepare("UPDATE uploaded_documents SET status = 'approved' WHERE id = ?").run(uploadedDoc.id);

      evidenceDocumentId = uid();
      const summaryText = summarySection?.content
        ? String(summarySection.content).split("\n\n")[0].slice(0, 600)
        : "Approved report derived from an uploaded document; no automatic summary was available.";

      db.prepare(
        `INSERT INTO documents
         (id, title, source_organization, publication_date, document_type, geographic_unit_id, source_url, data_status, summary, created_at, uploaded_document_id)
         VALUES (?, ?, ?, ?, 'evidence', ?, ?, 'DERIVED', ?, ?, ?)`
      ).run(
        evidenceDocumentId,
        r.title,
        `Internal upload, reviewed and approved by ${user.full_name || user.email}`,
        now.slice(0, 10),
        r.geographic_unit_id,
        `/api/gov/uploads/${uploadedDoc.id}/file`,
        summaryText,
        now,
        uploadedDoc.id
      );
    }

    db.prepare(
      "INSERT INTO audit_logs (id, user_id, action, resource, resource_id, extra, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(uid(), user.id, "approve_report", "report", r.id, JSON.stringify({ evidenceDocumentId }), now);

    const updated = db.prepare("SELECT * FROM reports WHERE id = ?").get(r.id);
    return NextResponse.json({ report: serializeReport(updated), evidence_document_id: evidenceDocumentId });
  } catch (err) {
    return errorResponse(err);
  }
}
