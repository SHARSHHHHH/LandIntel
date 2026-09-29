import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDatabase, uid, nowIso, DOCUMENTS_UPLOAD_DIR, MAX_UPLOAD_SIZE_MB } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { serializeUploadedDocument, serializeReport, errorResponse } from "@/lib/gov/serialize";
import { extractText, buildDraftReport, ACCEPTED_UPLOAD_EXTENSIONS } from "@/lib/gov/extract";

/**
 * Upload -> read -> draft report pipeline for the Area Intelligence page's
 * "Documents" card.
 *
 *  1. Save the file to disk under uploads/gov/documents/.
 *  2. Insert a row in `uploaded_documents` (status: processing).
 *  3. Extract its text with a real parser (pdf-parse / mammoth / plain read).
 *  4. Build a deterministic draft report from that text (no LLM available in
 *     this sandbox -- title + first sentences as summary + any sentence
 *     with a number as a "key figure").
 *  5. Create a `reports` row (status: pending_review) linked back to the
 *     uploaded document and this district, so it shows up on Reports &
 *     Insights for a gov user to approve or reject.
 */
export async function POST(req: NextRequest, { params }: { params: { areaId: string } }) {
  try {
    const user = requirePermission(req, "manage_reports");
    const db = getDatabase();
    const area = db.prepare("SELECT id FROM geographic_units WHERE id = ?").get(params.areaId);
    if (!area) throw new ApiError(404, "Area not found");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new ApiError(400, "No file provided");

    const ext = path.extname(file.name || "").toLowerCase();
    if (!ACCEPTED_UPLOAD_EXTENSIONS.includes(ext)) {
      throw new ApiError(400, `Unsupported file type "${ext || "unknown"}". Accepted: ${ACCEPTED_UPLOAD_EXTENSIONS.join(", ")}`);
    }

    const maxBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > maxBytes) throw new ApiError(413, `File exceeds the ${MAX_UPLOAD_SIZE_MB} MB upload limit`);
    if (buffer.length === 0) throw new ApiError(400, "The uploaded file is empty");

    fs.mkdirSync(DOCUMENTS_UPLOAD_DIR, { recursive: true });
    const originalName = file.name || `upload${ext}`;
    const docId = uid();
    const storedName = `${docId}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const absPath = path.join(DOCUMENTS_UPLOAD_DIR, storedName);
    fs.writeFileSync(absPath, buffer);

    const now = nowIso();
    db.prepare(
      `INSERT INTO uploaded_documents
       (id, geographic_unit_id, filename, file_path, mime_type, file_size, uploaded_by, uploaded_at, status, extracted_text, extraction_error, report_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'processing', NULL, NULL, NULL)`
    ).run(docId, params.areaId, originalName, storedName, file.type || null, buffer.length, user.id, now);

    // --- Read: real text extraction ---
    let extractedText = "";
    let extractionError: string | null = null;
    let pageCount: number | null = null;
    try {
      const result = await extractText(absPath, originalName);
      extractedText = result.text;
      pageCount = result.pageCount;
    } catch (err) {
      extractionError = err instanceof Error ? err.message : "Text extraction failed.";
    }

    // --- Auto-generate a draft report from whatever text we got ---
    const draft = buildDraftReport(extractedText || "", originalName, pageCount);

    const reportId = uid();
    db.prepare(
      `INSERT INTO reports (id, title, geographic_unit_id, workspace_id, owner_id, status, source_document_id, rejection_reason, created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, 'pending_review', ?, NULL, ?, ?)`
    ).run(reportId, draft.title, params.areaId, user.id, docId, now, now);

    const sections: { title: string; content: string }[] = [
      {
        title: "Automatic extraction summary",
        content:
          `${draft.summary}\n\n` +
          `This summary was produced automatically from the uploaded file's extracted text (first few substantial sentences) -- it is not an AI-written summary, and has not yet been reviewed by a person.`,
      },
      {
        title: "Key figures (auto-detected)",
        content: draft.keyFigures.length
          ? draft.keyFigures.map((f, i) => `${i + 1}. ${f}`).join("\n")
          : "No numeric figures were automatically detected in the extracted text.",
      },
      {
        title: "Extraction details",
        content:
          `Source file: ${originalName}\n` +
          `Words extracted: ${draft.wordCount.toLocaleString("en-IN")}` +
          (pageCount ? `\nPages: ${pageCount}` : "") +
          (extractionError ? `\nExtraction warning: ${extractionError}` : ""),
      },
    ];
    const insertSection = db.prepare(
      "INSERT INTO report_sections (id, report_id, section_type, title, content, reference_id, order_index) VALUES (?, ?, 'document', ?, ?, ?, ?)"
    );
    sections.forEach((s, idx) => insertSection.run(uid(), reportId, s.title, s.content, docId, idx));

    db.prepare(
      "UPDATE uploaded_documents SET status = 'pending_review', extracted_text = ?, extraction_error = ?, report_id = ? WHERE id = ?"
    ).run(extractedText || null, extractionError, reportId, docId);

    db.prepare(
      "INSERT INTO audit_logs (id, user_id, action, resource, resource_id, extra, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(uid(), user.id, "upload_document", "uploaded_document", docId, JSON.stringify({ filename: originalName, reportId }), now);

    const uploadedRow = db.prepare("SELECT * FROM uploaded_documents WHERE id = ?").get(docId);
    const reportRow = db.prepare("SELECT * FROM reports WHERE id = ?").get(reportId);

    return NextResponse.json({
      uploaded_document: serializeUploadedDocument(uploadedRow),
      report: serializeReport(reportRow),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
