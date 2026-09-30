import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { logAudit } from "@/lib/admin/audit";

function rolesOf(db: ReturnType<typeof getDatabase>, userId: string): string[] {
  return (
    db
      .prepare(
        "SELECT r.name AS name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? ORDER BY r.name"
      )
      .all(userId) as { name: string }[]
  ).map((r) => r.name);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = requirePermission(req, "manage_roles");
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.roles)) {
      throw new ApiError(400, "roles must be an array of role names");
    }
    const nextRoles = body.roles.map((r: unknown) => String(r));

    const db = getDatabase();
    const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(params.id) as any;
    if (!user) throw new ApiError(404, "User not found");

    const roleRows = db.prepare("SELECT id, name FROM roles").all() as {
      id: string;
      name: string;
    }[];
    const roleIdByName = new Map(roleRows.map((r) => [r.name, r.id]));
    const unknownRoles = nextRoles.filter((name) => !roleIdByName.has(name));
    if (unknownRoles.length > 0) {
      throw new ApiError(400, `Unknown role(s): ${unknownRoles.join(", ")}`);
    }
    const duplicate = nextRoles.filter((name, i) => nextRoles.indexOf(name) !== i);
    if (duplicate.length > 0) {
      throw new ApiError(400, `Duplicate role(s): ${[...new Set(duplicate)].join(", ")}`);
    }

    const before = rolesOf(db, user.id);

    const replace = db.transaction(() => {
      db.prepare("DELETE FROM user_roles WHERE user_id = ?").run(user.id);
      for (const name of nextRoles) {
        db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(
          user.id,
          roleIdByName.get(name)
        );
      }
      logAudit(db, actor.id, "assign_user_roles", "user", user.id, {
        email: user.email,
        before,
        after: nextRoles,
      });
    });
    replace();

    return NextResponse.json({ id: user.id, roles: rolesOf(db, user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}
