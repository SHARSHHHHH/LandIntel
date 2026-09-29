import { getDatabase } from "./db";
import { ApiError, AuthUser } from "./auth";
import type { WorkspaceMemberRole } from "./types";

export function getAccessibleWorkspace(workspaceId: string, user: AuthUser) {
  const db = getDatabase();
  const ws = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(workspaceId) as any;
  if (!ws) throw new ApiError(404, "Workspace not found");
  if (ws.owner_id === user.id) return ws;
  const member = db
    .prepare("SELECT user_id FROM workspace_members WHERE workspace_id = ? AND user_id = ?")
    .get(workspaceId, user.id) as any;
  if (member) return ws;
  if (ws.visibility === "Public") return ws;
  throw new ApiError(403, "You do not have access to this workspace");
}

/** The caller's role within a workspace they can already access ("owner" if they own it and have no separate member row). */
export function getMyRole(workspaceId: string, user: AuthUser, ws: any): WorkspaceMemberRole {
  if (ws.owner_id === user.id) return "owner";
  const db = getDatabase();
  const row = db
    .prepare("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?")
    .get(workspaceId, user.id) as any;
  return (row?.role as WorkspaceMemberRole) ?? "viewer";
}

/** Throws 403 unless the caller owns the workspace. Used to gate member-role changes/removal. */
export function requireOwner(workspaceId: string, user: AuthUser, ws: any) {
  if (getMyRole(workspaceId, user, ws) !== "owner") {
    throw new ApiError(403, "Only the workspace owner can do this.");
  }
}
