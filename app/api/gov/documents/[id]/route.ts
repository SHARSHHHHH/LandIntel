import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { serializeDocumentDetail, errorResponse } from "@/lib/gov/serialize";

/** Single Evidence & Research item, with the original upload's extracted text and file metadata when applicable. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requirePermission(req, "view_documents");
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM documents WHERE id = ?").get(params.id) as any;
    if (!row) throw new ApiError(404, "Evidence item not found");
    return NextResponse.json(serializeDocumentDetail(row));
  } catch (err) {
    return errorResponse(err);
  }
}
