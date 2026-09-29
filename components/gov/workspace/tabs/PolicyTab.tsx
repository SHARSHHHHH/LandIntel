"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut } from "@/lib/gov/types";

export function PolicyTab({ ws, workspaceId, refresh }: { ws: WorkspaceDetailOut; workspaceId: string; refresh: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await api.createWorkspacePolicyNote(workspaceId, { title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3 rounded-sm border border-register-navy/20 bg-register-navy/[0.04] p-4 text-xs text-register-navy/80">
        <p>
          Write policy-relevant analysis here, optionally referencing the real, sourced National Land Use
          Trends dataset (NRSC / World Bank / FAO) on{" "}
          <Link href="/gov/policy-analytics" className="underline hover:text-register-navy">
            Policy Analytics
          </Link>{" "}
          or the district scenarios on{" "}
          <Link href="/gov/scenario" className="underline hover:text-register-navy">
            Scenario &amp; Decision Support
          </Link>
          .
        </p>
      </div>

      <form onSubmit={handleAdd} className="mb-5 space-y-3 rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title, e.g. &quot;Recommendation: buffer zone around forest boundary&quot;"
          className="w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Write the analysis or recommendation…"
          className="w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <div className="flex justify-end">
          <button type="submit" disabled={saving || !title.trim() || !content.trim()} className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white hover:bg-register-navy2 disabled:opacity-50">
            {saving ? "Saving…" : "Add policy note"}
          </button>
        </div>
      </form>

      {ws.policy_notes.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-8 text-center text-sm text-register-ink/50">
          No policy notes yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {ws.policy_notes.map((n) => (
            <li key={n.id} className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
              <h4 className="font-serif-display text-sm font-semibold text-register-navy">{n.title}</h4>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-register-ink/80">{n.content}</p>
              <p className="mt-2 text-[11px] text-register-ink/45">
                {n.created_by_name} · {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
