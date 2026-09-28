import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso } from "@/lib/gov/db";
import { getCurrentUser } from "@/lib/gov/auth";
import { serializeSavedSearch, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC")
      .all(user.id) as any[];
    return NextResponse.json(rows.map(serializeSavedSearch));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    const body = await req.json();
    const db = getDatabase();
    const id = uid();
    db.prepare(
      "INSERT INTO saved_searches (id, user_id, query, geographic_unit_id, document_type, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, user.id, body.query ?? null, body.geographic_unit_id ?? null, body.document_type ?? null, nowIso());
    const row = db.prepare("SELECT * FROM saved_searches WHERE id = ?").get(id);
    return NextResponse.json(serializeSavedSearch(row));
  } catch (err) {
    return errorResponse(err);
  }
}
