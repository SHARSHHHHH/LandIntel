import type Database from "better-sqlite3";
import { uid, nowIso } from "@/lib/gov/db";

export function logAudit(
  db: Database.Database,
  userId: string | null,
  action: string,
  resource: string | null = null,
  resourceId: string | null = null,
  extra: unknown = null
): void {
  db.prepare(
    "INSERT INTO audit_logs (id, user_id, action, resource, resource_id, extra, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    uid(),
    userId,
    action,
    resource,
    resourceId,
    extra === null || extra === undefined ? null : JSON.stringify(extra),
    nowIso()
  );
}
