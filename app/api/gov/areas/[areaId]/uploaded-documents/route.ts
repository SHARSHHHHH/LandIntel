import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { serializeUploadedDocument, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { areaId: string } }) {
  try {
    requirePermission(req, "view_documents");
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM uploaded_documents WHERE geographic_unit_id = ? ORDER BY uploaded_at DESC")
      .all(params.areaId) as any[];
    return NextResponse.json(rows.map(serializeUploadedDocument));
  } catch (err) {
    return errorResponse(err);
  }
}
