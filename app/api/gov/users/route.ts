import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

/** A minimal directory of active platform users, for the Collaborative Workspace's member/assignee pickers. */
export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "manage_workspaces");
    const db = getDatabase();
    const rows = db
      .prepare("SELECT id, full_name, email, department FROM users WHERE is_active = 1 ORDER BY full_name ASC")
      .all() as any[];
    return NextResponse.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}
