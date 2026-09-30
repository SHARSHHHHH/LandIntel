import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { logAudit } from "@/lib/admin/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = requirePermission(req, "manage_roles");
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.permission_codes)) {
      throw new ApiError(400, "permission_codes must be an array");
    }
    const nextCodes: string[] = body.permission_codes.map((c: unknown) => String(c));

    const db = getDatabase();
    const role = db.prepare("SELECT id, name FROM roles WHERE id = ?").get(params.id) as any;
    if (!role) throw new ApiError(404, "Role not found");

    const knownRows = db.prepare("SELECT id, code FROM permissions").all() as {
      id: string;
      code: string;
    }[];
    const known = new Set(knownRows.map((r) => r.code));
    const unknownCodes = nextCodes.filter((c: string) => !known.has(c));
    if (unknownCodes.length > 0) {
      throw new ApiError(400, `Unknown permission code(s): ${unknownCodes.join(", ")}`);
    }
    const duplicate = nextCodes.filter((c: string, i: number) => nextCodes.indexOf(c) !== i);
    if (duplicate.length > 0) {
      throw new ApiError(400, `Duplicate permission code(s): ${[...new Set(duplicate)].join(", ")}`);
    }

    const currentRows = db
      .prepare(
        "SELECT p.code AS code FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = ?"
      )
      .all(params.id) as { code: string }[];
    const current = new Set(currentRows.map((r) => r.code));
    const next = new Set(nextCodes);
    const added = [...next].filter((c) => !current.has(c));
    const removed = [...current].filter((c) => !next.has(c));

    if (added.length === 0 && removed.length === 0) {
      return NextResponse.json({ id: role.id, name: role.name, permissions: [...current].sort() });
    }

    const apply = db.transaction(() => {
      db.prepare("DELETE FROM role_permissions WHERE role_id = ?").run(params.id);
      const insertLink = db.prepare(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)"
      );
      const permIdByCode = new Map(knownRows.map((r) => [r.code, r.id]));
      for (const code of nextCodes) insertLink.run(params.id, permIdByCode.get(code));
      logAudit(db, actor.id, "update_role_permissions", "role", params.id, {
        role: role.name,
        added,
        removed,
      });
    });
    apply();

    return NextResponse.json({
      id: role.id,
      name: role.name,
      permissions: [...next].sort(),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
