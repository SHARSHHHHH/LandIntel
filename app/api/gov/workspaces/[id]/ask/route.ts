import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { errorResponse } from "@/lib/gov/serialize";
import { answerWorkspaceQuestion } from "@/lib/gov/workspace-qa";

/**
 * AI Research Assistant for one workspace -- a deterministic, rule-based
 * engine grounded entirely in that workspace's own real data. See
 * lib/gov/workspace-qa.ts. No external AI call is made (no LLM API key
 * exists in this sandbox).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json().catch(() => null);
    const question: string = body?.question ?? "";
    if (!question || typeof question !== "string") throw new ApiError(400, "A question is required.");

    const db = getDatabase();
    const tasks = db.prepare("SELECT * FROM workspace_tasks WHERE workspace_id = ?").all(ws.id) as any[];
    const findings = db.prepare("SELECT * FROM workspace_findings WHERE workspace_id = ?").all(ws.id) as any[];
    const linkedDocs = db
      .prepare(
        `SELECT d.* FROM workspace_documents wd JOIN documents d ON d.id = wd.document_id WHERE wd.workspace_id = ?`
      )
      .all(ws.id) as any[];
    const policyNotes = db.prepare("SELECT * FROM workspace_policy_notes WHERE workspace_id = ?").all(ws.id) as any[];
    const discussions = db.prepare("SELECT * FROM workspace_discussions WHERE workspace_id = ?").all(ws.id) as any[];
    const gisLinks = db.prepare("SELECT * FROM workspace_gis_links WHERE workspace_id = ?").all(ws.id) as any[];
    const members = db
      .prepare(
        `SELECT u.full_name, u.email, wm.role FROM workspace_members wm JOIN users u ON u.id = wm.user_id WHERE wm.workspace_id = ?`
      )
      .all(ws.id) as any[];

    function userName(userId: string) {
      const u = db.prepare("SELECT full_name, email FROM users WHERE id = ?").get(userId) as any;
      return u ? u.full_name || u.email : null;
    }
    function geoName(geoId: string | null) {
      if (!geoId) return null;
      const g = db.prepare("SELECT name FROM geographic_units WHERE id = ?").get(geoId) as any;
      return g?.name ?? null;
    }

    const answer = answerWorkspaceQuestion(question, {
      workspaceName: ws.name,
      tasks: tasks.map((t) => ({ title: t.title, description: t.description, status: t.status, assignee_name: t.assignee_id ? userName(t.assignee_id) : null, due_date: t.due_date })),
      findings: findings.map((f) => ({
        statement: f.statement,
        confidence: f.confidence,
        evidence_document_title: f.evidence_document_id
          ? ((db.prepare("SELECT title FROM documents WHERE id = ?").get(f.evidence_document_id) as any)?.title ?? null)
          : null,
      })),
      documents: linkedDocs.map((d) => ({ title: d.title, summary: d.summary, data_status: d.data_status, source_organization: d.source_organization })),
      policyNotes: policyNotes.map((p) => ({ title: p.title, content: p.content })),
      discussions: discussions.map((d) => ({ author_name: userName(d.author_id) ?? "Unknown", body: d.body })),
      gisLinks: gisLinks.map((g) => ({ geographic_unit_name: geoName(g.geographic_unit_id), label: g.label, note: g.note })),
      members: members.map((m) => ({ full_name: m.full_name, email: m.email, role: m.role })),
    });

    return NextResponse.json({ answer });
  } catch (err) {
    return errorResponse(err);
  }
}
