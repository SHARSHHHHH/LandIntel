import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspaceFinding, errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json();
    if (!body?.statement || !String(body.statement).trim()) throw new ApiError(400, "A finding statement is required.");
    const db = getDatabase();
    const id = uid();
    db.prepare(
      `INSERT INTO workspace_findings (id, workspace_id, statement, confidence, evidence_document_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, ws.id, String(body.statement).trim(), body.confidence || "medium", body.evidence_document_id || null, user.id, nowIso());
    logWorkspaceActivity(db, ws.id, user.id, "finding_recorded", `Recorded a finding: "${String(body.statement).trim().slice(0, 80)}".`);
    const row = db.prepare("SELECT * FROM workspace_findings WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspaceFinding(row));
  } catch (err) {
    return errorResponse(err);
  }
}
