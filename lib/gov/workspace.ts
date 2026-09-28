import { getDatabase } from "./db";
import { ApiError, AuthUser } from "./auth";

export function getAccessibleWorkspace(workspaceId: string, user: AuthUser) {
  const db = getDatabase();
  const ws = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(workspaceId) as any;
  if (!ws) throw new ApiError(404, "Workspace not found");
  const members = db.prepare("SELECT user_id FROM workspace_members WHERE workspace_id = ?").all(workspaceId) as any[];
  const memberIds = new Set(members.map((m) => m.user_id));
  if (ws.owner_id !== user.id && !memberIds.has(user.id)) {
    throw new ApiError(403, "You do not have access to this workspace");
  }
  return ws;
}
