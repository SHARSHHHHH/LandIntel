import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace, requireOwner } from "@/lib/gov/workspace";
import { serializeWorkspaceMember, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    requireOwner(ws.id, user, ws);
    const body = await req.json();
    const db = getDatabase();
    let targetUserId: string | null = body.user_id || null;
    if (!targetUserId && body.email) {
      const match = db.prepare("SELECT id FROM users WHERE email = ?").get(String(body.email).trim().toLowerCase()) as any;
      if (!match) throw new ApiError(404, `No user with email ${body.email} was found in this platform's directory.`);
      targetUserId = match.id;
    }
    if (!targetUserId) throw new ApiError(400, "user_id or email is required.");
    if (targetUserId === ws.owner_id) throw new ApiError(400, "That user already owns this workspace.");
    const already = db
      .prepare("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?")
      .get(ws.id, targetUserId);
    if (already) throw new ApiError(400, "That user is already a member.");
    const role = body.role || "researcher";
    db.prepare("INSERT INTO workspace_members (id, workspace_id, user_id, role, added_at) VALUES (?, ?, ?, ?, ?)").run(
      uid(),
      ws.id,
      targetUserId,
      role,
      nowIso()
    );
    const u = db.prepare("SELECT full_name, email FROM users WHERE id = ?").get(targetUserId) as any;
    logWorkspaceActivity(db, ws.id, user.id, "member_added", `Added ${u?.full_name || u?.email} as ${role.replace("_", " ")}.`);
    const row = db.prepare("SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?").get(ws.id, targetUserId);
    return NextResponse.json(serializeWorkspaceMember(row));
  } catch (err) {
    return errorResponse(err);
  }
}
