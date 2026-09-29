import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { errorResponse } from "@/lib/gov/serialize";

/** Links an existing Evidence & Research document into this workspace (no file duplication -- see workspace_documents in lib/gov/db.ts). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json();
    if (!body?.document_id) throw new ApiError(400, "A document_id is required.");
    const db = getDatabase();
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(body.document_id) as any;
    if (!doc) throw new ApiError(404, "That evidence item was not found.");
    const already = db
      .prepare("SELECT id FROM workspace_documents WHERE workspace_id = ? AND document_id = ?")
      .get(ws.id, body.document_id);
    if (already) return NextResponse.json({ status: "already_linked" });
    db.prepare(
      "INSERT INTO workspace_documents (id, workspace_id, document_id, added_by, added_at) VALUES (?, ?, ?, ?, ?)"
    ).run(uid(), ws.id, body.document_id, user.id, nowIso());
    logWorkspaceActivity(db, ws.id, user.id, "document_linked", `Linked evidence item "${doc.title}".`);
    return NextResponse.json({ status: "linked" });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get("link_id");
    if (!linkId) throw new ApiError(400, "link_id is required.");
    const db = getDatabase();
    const link = db.prepare("SELECT * FROM workspace_documents WHERE id = ?").get(linkId) as any;
    if (!link || link.workspace_id !== ws.id) throw new ApiError(404, "Link not found in this workspace");
    db.prepare("DELETE FROM workspace_documents WHERE id = ?").run(linkId);
    return NextResponse.json({ status: "unlinked" });
  } catch (err) {
    return errorResponse(err);
  }
}
