import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDatabase, uid, nowIso } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { logAudit } from "@/lib/admin/audit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_users");
    const db = getDatabase();
    const users = db
      .prepare(
        "SELECT id, email, full_name, department, is_active, created_at FROM users ORDER BY created_at DESC"
      )
      .all() as any[];
    const roleRows = db
      .prepare(
        "SELECT ur.user_id AS user_id, r.name AS name FROM user_roles ur JOIN roles r ON r.id = ur.role_id"
      )
      .all() as { user_id: string; name: string }[];
    const byUser = new Map<string, string[]>();
    for (const row of roleRows) {
      const list = byUser.get(row.user_id) ?? [];
      list.push(row.name);
      byUser.set(row.user_id, list);
    }
    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        department: u.department,
        is_active: u.is_active,
        created_at: u.created_at,
        roles: byUser.get(u.id) ?? [],
      }))
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = requirePermission(req, "manage_users");
    const db = getDatabase();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new ApiError(400, "Request body is required");

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const fullName = body.full_name ? String(body.full_name).trim() : null;
    const department = body.department ? String(body.department).trim() : null;
    const roleNames = Array.isArray(body.roles) ? body.roles.map((r: unknown) => String(r)) : [];

    if (!EMAIL_RE.test(email)) throw new ApiError(400, "A valid email address is required");
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(email);
    if (existing) throw new ApiError(409, "A user with this email already exists");

    const roleRows = db.prepare("SELECT id, name FROM roles").all() as {
      id: string;
      name: string;
    }[];
    const roleIdByName = new Map(roleRows.map((r) => [r.name, r.id]));
    const unknownRoles = roleNames.filter((name) => !roleIdByName.has(name));
    if (unknownRoles.length > 0) {
      throw new ApiError(400, `Unknown role(s): ${unknownRoles.join(", ")}`);
    }

    const id = uid();
    const now = nowIso();
    const passwordHash = bcrypt.hashSync(password, 10);

    const create = db.transaction(() => {
      db.prepare(
        "INSERT INTO users (id, email, full_name, department, password_hash, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)"
      ).run(id, email, fullName, department, passwordHash, now);
      for (const name of roleNames) {
        db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(
          id,
          roleIdByName.get(name)
        );
      }
      logAudit(db, actor.id, "create_user", "user", id, { email, roles: roleNames });
    });
    create();

    const row = db
      .prepare("SELECT id, email, full_name, department, is_active, created_at FROM users WHERE id = ?")
      .get(id) as any;
    return NextResponse.json({ ...row, roles: roleNames });
  } catch (err) {
    return errorResponse(err);
  }
}
