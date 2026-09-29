/**
 * Deterministic, rule-based "AI Research Assistant" for one Collaborative
 * Workspace. Same approach as lib/gov/qa-engine.ts on the Scenario page: no
 * LLM API key exists in this sandbox, so this matches the question's words
 * against the workspace's OWN real data (task titles/descriptions, finding
 * statements, linked evidence document titles/summaries, policy notes,
 * discussion posts, linked districts/parcels) and answers strictly from
 * what it finds there -- or says plainly that it has nothing on the topic.
 * It never calls out to the network and never invents a fact.
 */

export interface WorkspaceQaContext {
  workspaceName: string;
  tasks: { title: string; description: string | null; status: string; assignee_name: string | null; due_date: string | null }[];
  findings: { statement: string; confidence: string; evidence_document_title: string | null }[];
  documents: { title: string; summary: string | null; data_status: string; source_organization: string }[];
  policyNotes: { title: string; content: string }[];
  discussions: { author_name: string; body: string }[];
  gisLinks: { geographic_unit_name: string | null; label: string | null; note: string | null }[];
  members: { full_name: string | null; email: string; role: string }[];
}

function fmtList(items: string[], max = 5): string {
  const shown = items.slice(0, max);
  const suffix = items.length > max ? `, and ${items.length - max} more` : "";
  return shown.join("; ") + suffix;
}

function scoreMatch(haystack: string, terms: string[]): number {
  const h = haystack.toLowerCase();
  return terms.reduce((acc, t) => (t.length > 2 && h.includes(t) ? acc + 1 : acc), 0);
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !["the", "and", "for", "are", "what", "who", "which", "has", "have", "this", "workspace", "does", "with"].includes(t));
}

export function answerWorkspaceQuestion(question: string, ctx: WorkspaceQaContext): string {
  const q = question.trim();
  if (!q) return "Ask about this workspace's tasks, findings, linked evidence, policy notes, discussions, or linked districts/parcels.";
  const terms = tokenize(q);
  const ql = q.toLowerCase();

  // Progress / status overview
  if (/progress|status|how.*(going|doing)|overview/.test(ql) && /task|project|workspace/.test(ql)) {
    const total = ctx.tasks.length;
    const done = ctx.tasks.filter((t) => t.status === "done").length;
    const inProgress = ctx.tasks.filter((t) => t.status === "in_progress").length;
    if (total === 0) return `"${ctx.workspaceName}" has no tasks recorded yet, so there's no progress to report from this workspace's own data. Add tasks on the Research Board tab first.`;
    const pct = Math.round((done / total) * 100);
    return (
      `"${ctx.workspaceName}" is ${pct}% complete by task count: ${done} of ${total} tasks done, ${inProgress} in progress, ` +
      `${total - done - inProgress} still to do. ${ctx.findings.length} finding(s) and ${ctx.documents.length} linked evidence item(s) are on record.`
    );
  }

  // Who is assigned / members
  if (/who.*(assign|working|member|owner|team)|team\b/.test(ql)) {
    if (ctx.members.length === 0) return "No members are recorded on this workspace yet.";
    const list = ctx.members.map((m) => `${m.full_name || m.email} (${m.role.replace("_", " ")})`);
    return `This workspace's members: ${fmtList(list, 10)}.`;
  }

  // Findings
  const findingMatches = ctx.findings
    .map((f) => ({ f, score: scoreMatch(f.statement, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (/finding/.test(ql) || findingMatches.length > 0) {
    if (findingMatches.length > 0) {
      const top = findingMatches.slice(0, 3).map((x) => `"${x.f.statement}" (${x.f.confidence} confidence${x.f.evidence_document_title ? `, evidence: ${x.f.evidence_document_title}` : ""})`);
      return `Findings recorded in this workspace matching that: ${fmtList(top, 3)}.`;
    }
    if (/finding/.test(ql)) {
      if (ctx.findings.length === 0) return "No findings have been recorded in this workspace yet. Add one on the Findings tab.";
      const top = ctx.findings.slice(0, 3).map((f) => `"${f.statement}" (${f.confidence} confidence)`);
      return `This workspace's most recent findings: ${fmtList(top, 3)}.`;
    }
  }

  // Tasks
  const taskMatches = ctx.tasks
    .map((t) => ({ t, score: scoreMatch(`${t.title} ${t.description ?? ""}`, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (/task|to.?do|due|deadline/.test(ql) || taskMatches.length > 0) {
    if (taskMatches.length > 0) {
      const top = taskMatches.slice(0, 3).map((x) => `"${x.t.title}" — ${x.t.status.replace("_", " ")}${x.t.assignee_name ? `, assigned to ${x.t.assignee_name}` : ""}${x.t.due_date ? `, due ${x.t.due_date}` : ""}`);
      return `Matching tasks on the Research Board: ${fmtList(top, 3)}.`;
    }
    if (/task/.test(ql) && ctx.tasks.length === 0) return "No tasks have been created in this workspace yet.";
  }

  // Documents / evidence
  const docMatches = ctx.documents
    .map((d) => ({ d, score: scoreMatch(`${d.title} ${d.summary ?? ""} ${d.source_organization}`, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (/document|evidence|report|source/.test(ql) || docMatches.length > 0) {
    if (docMatches.length > 0) {
      const top = docMatches.slice(0, 3).map((x) => `"${x.d.title}" (${x.d.data_status}, ${x.d.source_organization})`);
      return `Linked evidence matching that: ${fmtList(top, 3)}.`;
    }
    if (/document|evidence/.test(ql) && ctx.documents.length === 0) return "No Evidence & Research documents have been linked to this workspace yet. Use the Documents & Evidence tab to link or upload one.";
  }

  // Policy notes
  const policyMatches = ctx.policyNotes
    .map((p) => ({ p, score: scoreMatch(`${p.title} ${p.content}`, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (/policy/.test(ql) || policyMatches.length > 0) {
    if (policyMatches.length > 0) {
      const top = policyMatches.slice(0, 2).map((x) => `"${x.p.title}": ${x.p.content.slice(0, 160)}${x.p.content.length > 160 ? "…" : ""}`);
      return `Policy Analysis notes matching that: ${fmtList(top, 2)}.`;
    }
    if (/policy/.test(ql) && ctx.policyNotes.length === 0) return "No policy analysis notes have been written for this workspace yet.";
  }

  // Discussions
  const discMatches = ctx.discussions
    .map((d) => ({ d, score: scoreMatch(d.body, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (discMatches.length > 0) {
    const top = discMatches.slice(0, 2).map((x) => `${x.d.author_name} wrote: "${x.d.body.slice(0, 140)}${x.d.body.length > 140 ? "…" : ""}"`);
    return `Related discussion posts: ${fmtList(top, 2)}.`;
  }

  // GIS / district links
  const gisMatches = ctx.gisLinks
    .map((g) => ({ g, score: scoreMatch(`${g.geographic_unit_name ?? ""} ${g.label ?? ""} ${g.note ?? ""}`, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (/district|parcel|area|gis|map/.test(ql) || gisMatches.length > 0) {
    if (gisMatches.length > 0) {
      const top = gisMatches.slice(0, 3).map((x) => x.g.geographic_unit_name || x.g.label || "a linked area");
      return `Linked districts/parcels matching that: ${fmtList(top, 3)}. See the Data & GIS tab for the full record.`;
    }
    if (/district|parcel|gis/.test(ql) && ctx.gisLinks.length === 0) return "No districts or parcels have been linked to this workspace yet. Use the Data & GIS tab to link one from the GIS module.";
  }

  return (
    `I don't have information about that in this workspace's own data yet (tasks, findings, linked evidence, policy notes, ` +
    `discussions, and linked districts/parcels). Try asking about workspace progress, a specific task, finding, document, or district by name.`
  );
}
