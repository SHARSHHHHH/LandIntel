import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { logAudit } from "@/lib/admin/audit";

function knownPermissionCodes(db: ReturnType<typeof getDatabase>): Set<string> {
  const rows = db.prepare("SELECT code FROM permissions").all() as { code: string }[];
  return new Set(rows.map((r) => r.code));
}

export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_roles");
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT r.id AS id, r.name AS name, rp.permission_id AS permission_id
         FROM roles r
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         ORDER BY r.name`
      )
      .all() as { id: string; name: string; permission_id: string | null }[];

    const codeById = new Map(
      (db.prepare("SELECT id, code FROM permissions").all() as { id: string; code: string }[]).map(
        (p) => [p.id, p.code]
      )
    );
    const countRows = db
      .prepare(
        "SELECT role_id AS role_id, COUNT(*) AS c FROM user_roles GROUP BY role_id"
      )
      .all() as { role_id: string; c: number }[];
    const countByRole = new Map(countRows.map((r) => [r.role_id, r.c]));

    const roles: { id: string; name: string; permissions: string[]; user_count: number }[] = [];
    const indexById = new Map<string, number>();
    for (const row of rows) {
      if (!indexById.has(row.id)) {
        indexById.set(row.id, roles.length);
        roles.push({
          id: row.id,
          name: row.name,
          permissions: [],
          user_count: countByRole.get(row.id) ?? 0,
        });
      }
      if (row.permission_id) {
        const code = codeById.get(row.permission_id);
        if (code) roles[indexById.get(row.id)!].permissions.push(code);
      }
    }
    for (const role of roles) role.permissions.sort();
    return NextResponse.json(roles);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = requirePermission(req, "manage_roles");
    const body = await req.json().catch(() => null);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      throw new ApiError(400, "name is required");
    }
    const name = body.name.trim();
    const permissionCodes = Array.isArray(body.permission_codes)
      ? body.permission_codes.map((c: unknown) => String(c))
      : [];

    const db = getDatabase();
    const existing = db.prepare("SELECT id FROM roles WHERE name = ?").get(name);
    if (existing) throw new ApiError(409, `Role "${name}" already exists`);

    const known = knownPermissionCodes(db);
    const unknownCodes = permissionCodes.filter((c: string) => !known.has(c));
    if (unknownCodes.length > 0) {
      throw new ApiError(400, `Unknown permission code(s): ${unknownCodes.join(", ")}`);
    }

    const id = uid();
    const create = db.transaction(() => {
      db.prepare("INSERT INTO roles (id, name) VALUES (?, ?)").run(id, name);
      const insertLink = db.prepare(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)"
      );
      const findPerm = db.prepare("SELECT id FROM permissions WHERE code = ?");
      for (const code of permissionCodes) {
        const perm = findPerm.get(code) as { id: string } | undefined;
        if (perm) insertLink.run(id, perm.id);
      }
      logAudit(db, actor.id, "create_role", "role", id, { name, permissions: permissionCodes });
    });
    create();

    return NextResponse.json({
      id,
      name,
      permissions: [...permissionCodes].sort(),
      user_count: 0,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
