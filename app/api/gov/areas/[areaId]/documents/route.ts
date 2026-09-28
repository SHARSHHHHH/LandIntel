import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { serializeDocument, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { areaId: string } }) {
  try {
    requirePermission(req, "view_documents");
    const db = getDatabase();
    const area = db.prepare("SELECT id FROM geographic_units WHERE id = ?").get(params.areaId);
    if (!area) throw new ApiError(404, "Area not found");

    const q = req.nextUrl.searchParams.get("q");
    const documentType = req.nextUrl.searchParams.get("document_type");
    let query = "SELECT * FROM documents WHERE geographic_unit_id = ?";
    const sqlParams: any[] = [params.areaId];
    if (documentType) {
      query += " AND document_type = ?";
      sqlParams.push(documentType);
    }
    if (q) {
      query += " AND title LIKE ?";
      sqlParams.push(`%${q}%`);
    }
    query += " ORDER BY publication_date DESC";
    const rows = db.prepare(query).all(...sqlParams) as any[];
    return NextResponse.json(rows.map(serializeDocument));
  } catch (err) {
    return errorResponse(err);
  }
}
