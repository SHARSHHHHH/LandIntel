import { NextRequest, NextResponse } from "next/server";
import { getDatabase, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspaceTask, errorResponse } from "@/lib/gov/serialize";

const STATUS_LABEL: Record<string, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };

export async function PATCH(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const db = getDatabase();
    const task = db.prepare("SELECT * FROM workspace_tasks WHERE id = ?").get(params.taskId) as any;
    if (!task || task.workspace_id !== ws.id) throw new ApiError(404, "Task not found in this workspace");
    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];
    for (const key of ["title", "description", "status", "assignee_id", "due_date"]) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(body[key] || null);
      }
    }
    if (fields.length) {
      fields.push("updated_at = ?");
      values.push(nowIso());
      values.push(task.id);
      db.prepare(`UPDATE workspace_tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values);
      if (body.status && body.status !== task.status) {
        logWorkspaceActivity(
          db,
          ws.id,
          user.id,
          "task_status_changed",
          `Moved "${task.title}" to ${STATUS_LABEL[body.status] ?? body.status}.`
        );
      }
    }
    const row = db.prepare("SELECT * FROM workspace_tasks WHERE id = ?").get(task.id);
    return NextResponse.json(serializeWorkspaceTask(row));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const db = getDatabase();
    const task = db.prepare("SELECT * FROM workspace_tasks WHERE id = ?").get(params.taskId) as any;
    if (!task || task.workspace_id !== ws.id) throw new ApiError(404, "Task not found in this workspace");
    db.prepare("DELETE FROM workspace_tasks WHERE id = ?").run(params.taskId);
    logWorkspaceActivity(db, ws.id, user.id, "task_deleted", `Removed the task "${task.title}".`);
    return NextResponse.json({ status: "deleted" });
  } catch (err) {
    return errorResponse(err);
  }
}
