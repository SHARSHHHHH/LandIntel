import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_audit_logs");
    const db = getDatabase();
    const sp = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(sp.get("page_size") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    );

    const conditions: string[] = ["1=1"];
    const args: any[] = [];
    const action = sp.get("action");
    if (action) {
      conditions.push("a.action LIKE ?");
      args.push(`%${action}%`);
    }
    const resource = sp.get("resource");
    if (resource) {
      conditions.push("a.resource LIKE ?");
      args.push(`%${resource}%`);
    }
    const userId = sp.get("user_id");
    if (userId) {
      conditions.push("a.user_id = ?");
      args.push(userId);
    }
    const where = conditions.join(" AND ");

    const total = (db
      .prepare(`SELECT COUNT(*) AS c FROM audit_logs a WHERE ${where}`)
      .get(...args) as { c: number }).c;

    const items = db
      .prepare(
        `SELECT a.id, a.user_id, a.action, a.resource, a.resource_id, a.extra, a.created_at,
                u.email AS user_email
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         WHERE ${where}
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...args, pageSize, (page - 1) * pageSize);

    return NextResponse.json({ items, total, page, page_size: pageSize });
  } catch (err) {
    return errorResponse(err);
  }
}
