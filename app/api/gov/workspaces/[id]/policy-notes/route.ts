import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspacePolicyNote, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json();
    if (!body?.title || !String(body.title).trim()) throw new ApiError(400, "A title is required.");
    if (!body?.content || !String(body.content).trim()) throw new ApiError(400, "Content is required.");
    const db = getDatabase();
    const id = uid();
    db.prepare(
      "INSERT INTO workspace_policy_notes (id, workspace_id, title, content, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, ws.id, String(body.title).trim(), String(body.content).trim(), user.id, nowIso());
    logWorkspaceActivity(db, ws.id, user.id, "policy_note_added", `Added the policy note "${String(body.title).trim()}".`);
    const row = db.prepare("SELECT * FROM workspace_policy_notes WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspacePolicyNote(row));
  } catch (err) {
    return errorResponse(err);
  }
}
