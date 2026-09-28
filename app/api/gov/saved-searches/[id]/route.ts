import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { getCurrentUser, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser(req);
    const db = getDatabase();
    const s = db.prepare("SELECT * FROM saved_searches WHERE id = ?").get(params.id) as any;
    if (!s || s.user_id !== user.id) throw new ApiError(404, "Saved search not found");
    db.prepare("DELETE FROM saved_searches WHERE id = ?").run(params.id);
    return NextResponse.json({ status: "deleted" });
  } catch (err) {
    return errorResponse(err);
  }
}
