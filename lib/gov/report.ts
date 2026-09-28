import { getDatabase } from "./db";
import { ApiError, AuthUser } from "./auth";

export function getOwnedReport(reportId: string, user: AuthUser) {
  const db = getDatabase();
  const r = db.prepare("SELECT * FROM reports WHERE id = ?").get(reportId) as any;
  if (!r || r.owner_id !== user.id) throw new ApiError(404, "Report not found");
  return r;
}
