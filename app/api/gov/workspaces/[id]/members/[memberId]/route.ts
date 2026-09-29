import { NextRequest, NextResponse } from "next/server";
import { getDatabase, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace, requireOwner } from "@/lib/gov/workspace";
import { serializeWorkspaceMember, errorResponse } from "@/lib/gov/serialize";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    requireOwner(ws.id, user, ws);
    const db = getDatabase();
    const member = db.prepare("SELECT * FROM workspace_members WHERE id = ?").get(params.memberId) as any;
    if (!member || member.workspace_id !== ws.id) throw new ApiError(404, "Member not found in this workspace");
    const body = await req.json();
    if (!body?.role) throw new ApiError(400, "A role is required.");
    db.prepare("UPDATE workspace_members SET role = ? WHERE id = ?").run(body.role, member.id);
    const u = db.prepare("SELECT full_name, email FROM users WHERE id = ?").get(member.user_id) as any;
    logWorkspaceActivity(db, ws.id, user.id, "member_role_changed", `Changed ${u?.full_name || u?.email}'s role to ${String(body.role).replace("_", " ")}.`);
    const row = db.prepare("SELECT * FROM workspace_members WHERE id = ?").get(member.id);
    return NextResponse.json(serializeWorkspaceMember(row));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    requireOwner(ws.id, user, ws);
    const db = getDatabase();
    const member = db.prepare("SELECT * FROM workspace_members WHERE id = ?").get(params.memberId) as any;
    if (!member || member.workspace_id !== ws.id) throw new ApiError(404, "Member not found in this workspace");
    const u = db.prepare("SELECT full_name, email FROM users WHERE id = ?").get(member.user_id) as any;
    db.prepare("DELETE FROM workspace_members WHERE id = ?").run(member.id);
    logWorkspaceActivity(db, ws.id, user.id, "member_removed", `Removed ${u?.full_name || u?.email} from the workspace.`);
    return NextResponse.json({ status: "removed" });
  } catch (err) {
    return errorResponse(err);
  }
}
