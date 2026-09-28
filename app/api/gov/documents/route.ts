import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { serializeDocument, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_documents");
    const db = getDatabase();
    const q = req.nextUrl.searchParams.get("q");
    const documentType = req.nextUrl.searchParams.get("document_type");
    const geographicUnitId = req.nextUrl.searchParams.get("geographic_unit_id");

    let query = "SELECT * FROM documents WHERE 1=1";
    const params: any[] = [];
    if (geographicUnitId) {
      query += " AND geographic_unit_id = ?";
      params.push(geographicUnitId);
    }
    if (documentType) {
      query += " AND document_type = ?";
      params.push(documentType);
    }
    if (q) {
      query += " AND title LIKE ?";
      params.push(`%${q}%`);
    }
    query += " ORDER BY publication_date DESC";
    const rows = db.prepare(query).all(...params) as any[];
    return NextResponse.json(rows.map(serializeDocument));
  } catch (err) {
    return errorResponse(err);
  }
}
