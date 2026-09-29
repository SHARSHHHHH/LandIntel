"use client";

import { useState } from "react";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut } from "@/lib/gov/types";

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "border-register-official/40 bg-register-official/[0.08] text-register-official",
  medium: "border-register-derived/40 bg-register-derived/[0.08] text-register-derived",
  low: "border-register-sample/40 bg-register-sample/[0.08] text-register-sample",
};

export function FindingsTab({ ws, workspaceId, refresh }: { ws: WorkspaceDetailOut; workspaceId: string; refresh: () => Promise<void> }) {
  const [statement, setStatement] = useState("");
  const [confidence, setConfidence] = useState("medium");
  const [evidenceId, setEvidenceId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!statement.trim()) return;
    setSaving(true);
    try {
      await api.createWorkspaceFinding(workspaceId, { statement: statement.trim(), confidence, evidence_document_id: evidenceId || undefined });
      setStatement("");
      setEvidenceId("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-5 space-y-3 rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={2}
          placeholder="State a finding, e.g. &quot;Forest cover in this district fell measurably against the 2011 baseline.&quot;"
          className="w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-register-ink/70">
            Confidence
            <select value={confidence} onChange={(e) => setConfidence(e.target.value)} className="rounded-sm border border-register-line bg-white px-2 py-1.5 text-xs focus:border-register-navy focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="flex flex-1 items-center gap-2 text-xs text-register-ink/70">
            Link to evidence
            <select value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} className="flex-1 rounded-sm border border-register-line bg-white px-2 py-1.5 text-xs focus:border-register-navy focus:outline-none">
              <option value="">None</option>
              {ws.linked_documents.map((l) => l.document && (
                <option key={l.document.id} value={l.document.id}>{l.document.title}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving || !statement.trim()} className="ml-auto rounded-sm bg-register-navy px-3.5 py-2 text-xs font-medium text-white hover:bg-register-navy2 disabled:opacity-50">
            {saving ? "Recording…" : "Record finding"}
          </button>
        </div>
      </form>

      {ws.findings.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-8 text-center text-sm text-register-ink/50">
          No findings recorded yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {ws.findings.map((f) => (
            <li key={f.id} className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-relaxed text-register-ink/90">{f.statement}</p>
                <span className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase ${CONFIDENCE_STYLE[f.confidence]}`}>{f.confidence}</span>
              </div>
              <p className="text-[11px] text-register-ink/45">
                {f.created_by_name} · {new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {f.evidence_document_title && <> · Evidence: {f.evidence_document_title}</>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
