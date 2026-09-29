import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspaceTask, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json();
    if (!body?.title || !String(body.title).trim()) throw new ApiError(400, "A task title is required.");
    const db = getDatabase();
    const id = uid();
    const now = nowIso();
    db.prepare(
      `INSERT INTO workspace_tasks (id, workspace_id, title, description, status, assignee_id, due_date, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, ws.id, String(body.title).trim(), body.description || null, body.status || "todo", body.assignee_id || null, body.due_date || null, user.id, now, now);
    logWorkspaceActivity(db, ws.id, user.id, "task_created", `Created the task "${String(body.title).trim()}".`);
    const row = db.prepare("SELECT * FROM workspace_tasks WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspaceTask(row));
  } catch (err) {
    return errorResponse(err);
  }
}
