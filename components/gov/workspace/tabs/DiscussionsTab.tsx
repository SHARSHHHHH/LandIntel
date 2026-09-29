"use client";

import { useState } from "react";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut } from "@/lib/gov/types";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DiscussionsTab({ ws, workspaceId, refresh }: { ws: WorkspaceDetailOut; workspaceId: string; refresh: () => Promise<void> }) {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      await api.postWorkspaceDiscussion(workspaceId, { body: body.trim() });
      setBody("");
      await refresh();
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handlePost} className="mb-5 rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Post a message to the team…"
          className="w-full rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
        />
        <div className="mt-2 flex justify-end">
          <button type="submit" disabled={posting || !body.trim()} className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white hover:bg-register-navy2 disabled:opacity-50">
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {ws.discussions.length === 0 ? (
        <p className="rounded-sm border border-dashed border-register-line px-4 py-8 text-center text-sm text-register-ink/50">
          No discussion yet. Start the conversation above.
        </p>
      ) : (
        <ul className="space-y-3">
          {[...ws.discussions].reverse().map((d) => (
            <li key={d.id} className="rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-register-navy">{d.author_name}</span>
                <span className="text-[11px] text-register-ink/40">{timeAgo(d.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-register-ink/80">{d.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
