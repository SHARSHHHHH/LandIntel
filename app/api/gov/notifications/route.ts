import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { getCurrentUser } from "@/lib/gov/auth";
import { serializeNotification, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC")
      .all(user.id) as any[];
    return NextResponse.json(rows.map(serializeNotification));
  } catch (err) {
    return errorResponse(err);
  }
}
