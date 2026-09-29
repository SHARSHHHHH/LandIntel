import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDatabase, DOCUMENTS_UPLOAD_DIR } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

/**
 * Serves the ORIGINAL uploaded file behind an Evidence & Research item, for
 * inline viewing (embedded PDF viewer / plain-text viewer) rather than a
 * forced download -- see app/api/gov/uploads/[id]/file for the download
 * variant. The evidence item's auto-extracted summary is a convenience; this
 * route is how the authoritative original document stays reachable.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requirePermission(req, "view_documents");
    const db = getDatabase();
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(params.id) as any;
    if (!doc) throw new ApiError(404, "Evidence item not found");
    if (!doc.uploaded_document_id) throw new ApiError(404, "This evidence item has no original uploaded file to view");

    const row = db.prepare("SELECT * FROM uploaded_documents WHERE id = ?").get(doc.uploaded_document_id) as any;
    if (!row) throw new ApiError(404, "Uploaded document not found");

    const absPath = path.join(DOCUMENTS_UPLOAD_DIR, row.file_path);
    if (!fs.existsSync(absPath)) throw new ApiError(404, "The underlying file is missing from storage");

    const buffer = fs.readFileSync(absPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": row.mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${String(row.filename).replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
