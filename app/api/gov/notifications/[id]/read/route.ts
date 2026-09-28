import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { getCurrentUser, ApiError } from "@/lib/gov/auth";
import { serializeNotification, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(req);
    const db = getDatabase();
    const n = db.prepare("SELECT * FROM notifications WHERE id = ?").get(params.id) as any;
    if (!n || n.user_id !== user.id) throw new ApiError(404, "Notification not found");
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(params.id);
    const updated = db.prepare("SELECT * FROM notifications WHERE id = ?").get(params.id);
    return NextResponse.json(serializeNotification(updated));
  } catch (err) {
    return errorResponse(err);
  }
}
