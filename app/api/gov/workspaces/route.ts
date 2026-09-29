import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { serializeWorkspace, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const db = getDatabase();
    const owned = db.prepare("SELECT * FROM workspaces WHERE owner_id = ?").all(user.id) as any[];
    const memberWsIds = (
      db.prepare("SELECT workspace_id FROM workspace_members WHERE user_id = ?").all(user.id) as any[]
    ).map((m) => m.workspace_id);
    const shared = memberWsIds.length
      ? (db
          .prepare(`SELECT * FROM workspaces WHERE id IN (${memberWsIds.map(() => "?").join(",")})`)
          .all(...memberWsIds) as any[])
      : [];
    const publicWs = db.prepare("SELECT * FROM workspaces WHERE visibility = 'Public'").all() as any[];
    const seen = new Map<string, any>();
    for (const ws of [...owned, ...shared, ...publicWs]) seen.set(ws.id, ws);
    const rows = Array.from(seen.values()).sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    return NextResponse.json(rows.map(serializeWorkspace));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ detail: "A workspace name is required." }, { status: 400 });
    }
    const db = getDatabase();
    const id = uid();
    const now = nowIso();
    db.prepare(
      `INSERT INTO workspaces
        (id, name, description, geographic_unit_id, geography_name, research_area, research_type,
         start_date, end_date, visibility, status, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`
    ).run(
      id,
      body.name.trim(),
      body.description?.trim() || null,
      body.geographic_unit_id || null,
      body.geography_name || null,
      body.research_area || null,
      body.research_type || null,
      body.start_date || null,
      body.end_date || null,
      body.visibility || "Team",
      user.id,
      now,
      now
    );
    db.prepare(
      "INSERT INTO workspace_members (id, workspace_id, user_id, role, added_at) VALUES (?, ?, ?, 'owner', ?)"
    ).run(uid(), id, user.id, now);

    // Invite collaborators by user id (existing directory) and/or plain email (tracked as a member row keyed to a matching user if one exists, otherwise skipped -- this demo has no outbound email/invite-acceptance flow).
    const collaboratorIds: string[] = Array.isArray(body.collaborator_user_ids) ? body.collaborator_user_ids : [];
    for (const uidToAdd of collaboratorIds) {
      if (uidToAdd === user.id) continue;
      const exists = db.prepare("SELECT id FROM users WHERE id = ?").get(uidToAdd);
      if (!exists) continue;
      db.prepare(
        "INSERT INTO workspace_members (id, workspace_id, user_id, role, added_at) VALUES (?, ?, ?, 'researcher', ?)"
      ).run(uid(), id, uidToAdd, now);
    }
    const collaboratorEmails: string[] = Array.isArray(body.collaborator_emails) ? body.collaborator_emails : [];
    for (const email of collaboratorEmails) {
      const match = db.prepare("SELECT id FROM users WHERE email = ?").get(String(email).trim().toLowerCase()) as any;
      if (!match || match.id === user.id) continue;
      const already = db.prepare("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?").get(id, match.id);
      if (already) continue;
      db.prepare(
        "INSERT INTO workspace_members (id, workspace_id, user_id, role, added_at) VALUES (?, ?, ?, 'researcher', ?)"
      ).run(uid(), id, match.id, now);
    }

    logWorkspaceActivity(db, id, user.id, "workspace_created", `Created the workspace "${body.name.trim()}".`);
    const row = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspace(row));
  } catch (err) {
    return errorResponse(err);
  }
}
