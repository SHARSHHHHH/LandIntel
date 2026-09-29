import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { getAccessibleWorkspace, getMyRole, requireOwner } from "@/lib/gov/workspace";
import {
  serializeWorkspace,
  serializeWorkspaceItem,
  serializeWorkspaceMember,
  serializeWorkspaceTask,
  serializeWorkspaceDiscussion,
  serializeWorkspaceFinding,
  serializeWorkspacePolicyNote,
  serializeWorkspaceLinkedDocument,
  serializeWorkspaceGisLink,
  serializeWorkspaceActivity,
  errorResponse,
} from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const db = getDatabase();
    const items = db.prepare("SELECT * FROM workspace_items WHERE workspace_id = ? ORDER BY created_at DESC").all(ws.id) as any[];
    const members = db.prepare("SELECT * FROM workspace_members WHERE workspace_id = ? ORDER BY added_at ASC").all(ws.id) as any[];
    const tasks = db.prepare("SELECT * FROM workspace_tasks WHERE workspace_id = ? ORDER BY created_at DESC").all(ws.id) as any[];
    const discussions = db
      .prepare("SELECT * FROM workspace_discussions WHERE workspace_id = ? ORDER BY created_at ASC")
      .all(ws.id) as any[];
    const findings = db
      .prepare("SELECT * FROM workspace_findings WHERE workspace_id = ? ORDER BY created_at DESC")
      .all(ws.id) as any[];
    const policyNotes = db
      .prepare("SELECT * FROM workspace_policy_notes WHERE workspace_id = ? ORDER BY created_at DESC")
      .all(ws.id) as any[];
    const linkedDocuments = db
      .prepare("SELECT * FROM workspace_documents WHERE workspace_id = ? ORDER BY added_at DESC")
      .all(ws.id) as any[];
    const gisLinks = db
      .prepare("SELECT * FROM workspace_gis_links WHERE workspace_id = ? ORDER BY added_at DESC")
      .all(ws.id) as any[];
    const activity = db
      .prepare("SELECT * FROM workspace_activity WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200")
      .all(ws.id) as any[];

    return NextResponse.json({
      ...serializeWorkspace(ws),
      items: items.map(serializeWorkspaceItem),
      members: members.map(serializeWorkspaceMember),
      tasks: tasks.map(serializeWorkspaceTask),
      discussions: discussions.map(serializeWorkspaceDiscussion),
      findings: findings.map(serializeWorkspaceFinding),
      policy_notes: policyNotes.map(serializeWorkspacePolicyNote),
      linked_documents: linkedDocuments.map(serializeWorkspaceLinkedDocument),
      gis_links: gisLinks.map(serializeWorkspaceGisLink),
      activity: activity.map(serializeWorkspaceActivity),
      my_role: getMyRole(ws.id, user, ws),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json();
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    for (const key of ["name", "description", "research_area", "research_type", "geographic_unit_id", "geography_name", "start_date", "end_date", "visibility", "status"]) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(body[key] || null);
      }
    }
    if (fields.length) {
      fields.push("updated_at = ?");
      values.push(nowIso());
      values.push(ws.id);
      db.prepare(`UPDATE workspaces SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }
    const row = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(ws.id);
    return NextResponse.json(serializeWorkspace(row));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    requireOwner(ws.id, user, ws);
    const db = getDatabase();
    for (const table of [
      "workspace_items",
      "workspace_members",
      "workspace_tasks",
      "workspace_discussions",
      "workspace_findings",
      "workspace_policy_notes",
      "workspace_documents",
      "workspace_gis_links",
      "workspace_activity",
    ]) {
      db.prepare(`DELETE FROM ${table} WHERE workspace_id = ?`).run(ws.id);
    }
    db.prepare("DELETE FROM workspaces WHERE id = ?").run(ws.id);
    return NextResponse.json({ status: "deleted" });
  } catch (err) {
    return errorResponse(err);
  }
}
