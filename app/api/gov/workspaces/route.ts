import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso } from "@/lib/gov/db";
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
    const seen = new Map<string, any>();
    for (const ws of [...owned, ...shared]) seen.set(ws.id, ws);
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
    const db = getDatabase();
    const id = uid();
    const now = nowIso();
    db.prepare(
      "INSERT INTO workspaces (id, name, description, geographic_unit_id, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, body.name, body.description ?? null, body.geographic_unit_id ?? null, user.id, now, now);
    db.prepare(
      "INSERT INTO workspace_members (id, workspace_id, user_id, role, added_at) VALUES (?, ?, ?, 'owner', ?)"
    ).run(uid(), id, user.id, now);
    const row = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspace(row));
  } catch (err) {
    return errorResponse(err);
  }
}
