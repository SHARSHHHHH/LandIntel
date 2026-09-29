import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDatabase, DOCUMENTS_UPLOAD_DIR } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requirePermission(req, "view_documents");
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM uploaded_documents WHERE id = ?").get(params.id) as any;
    if (!row) throw new ApiError(404, "Uploaded document not found");

    const absPath = path.join(DOCUMENTS_UPLOAD_DIR, row.file_path);
    if (!fs.existsSync(absPath)) throw new ApiError(404, "The underlying file is missing from storage");

    const buffer = fs.readFileSync(absPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": row.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${row.filename.replace(/"/g, "")}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
