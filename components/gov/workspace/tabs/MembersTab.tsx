"use client";

import { useState } from "react";
import { api } from "@/lib/gov/client";
import type { WorkspaceDetailOut, DirectoryUserOut, WorkspaceMemberRole } from "@/lib/gov/types";
import { MEMBER_ROLES, ROLE_BADGE_STYLE, roleLabel } from "../constants";

export function MembersTab({
  ws,
  workspaceId,
  users,
  refresh,
}: {
  ws: WorkspaceDetailOut;
  workspaceId: string;
  users: DirectoryUserOut[];
  refresh: () => Promise<void>;
}) {
  const isOwner = ws.my_role === "owner";
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<WorkspaceMemberRole>("researcher");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberIds = new Set(ws.members.map((m) => m.user_id));
  const invitable = users.filter((u) => !memberIds.has(u.id));

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setInviting(true);
    setError(null);
    try {
      await api.addWorkspaceMember(workspaceId, { user_id: userId, role });
      setUserId("");
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Could not add that member.");
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(memberId: string, newRole: WorkspaceMemberRole) {
    await api.updateWorkspaceMemberRole(workspaceId, memberId, newRole);
    await refresh();
  }

  async function remove(memberId: string) {
    await api.removeWorkspaceMember(workspaceId, memberId);
    await refresh();
  }

  return (
    <div>
      {isOwner && (
        <form onSubmit={handleInvite} className="mb-5 flex flex-wrap items-end gap-3 rounded-sm border border-register-line bg-register-panel p-4 shadow-card">
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
          <label className="text-xs text-register-ink/70">
            <span className="mb-1 block">Add member</span>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="min-w-[220px] rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none">
              <option value="">Choose a user…</option>
              {invitable.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-register-ink/70">
            <span className="mb-1 block">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as WorkspaceMemberRole)} className="rounded-sm border border-register-line bg-white px-3 py-2 text-sm focus:border-register-navy focus:outline-none">
              {MEMBER_ROLES.filter((r) => r.value !== "owner").map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={!userId || inviting} className="rounded-sm bg-register-navy px-4 py-2 text-sm font-medium text-white hover:bg-register-navy2 disabled:opacity-50">
            {inviting ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-sm border border-register-line bg-register-panel shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-register-bg/60 text-left text-xs uppercase tracking-wide text-register-ink/50">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              {isOwner && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-register-line">
            {ws.members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium text-register-ink/85">{m.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-register-ink/60">{m.email}</td>
                <td className="px-4 py-3">
                  {isOwner && m.role !== "owner" ? (
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value as WorkspaceMemberRole)}
                      className="rounded-sm border border-register-line bg-white px-2 py-1 text-xs focus:border-register-navy focus:outline-none"
                    >
                      {MEMBER_ROLES.filter((r) => r.value !== "owner").map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex rounded-sm border px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_STYLE[m.role] ?? ""}`}>{roleLabel(m.role)}</span>
                  )}
                </td>
                {isOwner && (
                  <td className="px-4 py-3">
                    {m.role !== "owner" && (
                      <button onClick={() => remove(m.id)} className="text-xs text-register-ink/40 hover:text-red-600">Remove</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isOwner && <p className="mt-3 text-[11px] text-register-ink/45">Only the workspace owner can change roles or remove members.</p>}
    </div>
  );
}
