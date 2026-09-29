import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspaceItem, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json();
    const db = getDatabase();
    const id = uid();
    db.prepare(
      "INSERT INTO workspace_items (id, workspace_id, item_type, title, content, reference_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, ws.id, body.item_type, body.title, body.content ?? null, body.reference_id ?? null, user.id, nowIso());
    logWorkspaceActivity(db, ws.id, user.id, "note_added", `Added the note "${body.title}".`);
    const row = db.prepare("SELECT * FROM workspace_items WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspaceItem(row));
  } catch (err) {
    return errorResponse(err);
  }
}
