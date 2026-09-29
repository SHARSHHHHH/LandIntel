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
    const category = req.nextUrl.searchParams.get("category");
    const state = req.nextUrl.searchParams.get("state");
    const parcelId = req.nextUrl.searchParams.get("parcel_id");

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
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (state) {
      query += " AND state = ?";
      params.push(state);
    }
    if (parcelId) {
      query += " AND parcel_id = ?";
      params.push(parcelId);
    }
    if (q) {
      query += " AND (title LIKE ? OR summary LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }
    query += " ORDER BY publication_date DESC";
    const rows = db.prepare(query).all(...params) as any[];
    return NextResponse.json(rows.map(serializeDocument));
  } catch (err) {
    return errorResponse(err);
  }
}
