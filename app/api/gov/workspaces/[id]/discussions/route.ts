import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspaceDiscussion, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json();
    if (!body?.body || !String(body.body).trim()) throw new ApiError(400, "A comment cannot be empty.");
    const db = getDatabase();
    const id = uid();
    db.prepare(
      "INSERT INTO workspace_discussions (id, workspace_id, parent_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, ws.id, body.parent_id || null, user.id, String(body.body).trim(), nowIso());
    logWorkspaceActivity(db, ws.id, user.id, "comment_posted", "Posted a comment in Discussions.");
    const row = db.prepare("SELECT * FROM workspace_discussions WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspaceDiscussion(row));
  } catch (err) {
    return errorResponse(err);
  }
}
