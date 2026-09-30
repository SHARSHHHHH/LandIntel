import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { logAudit } from "@/lib/admin/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = requirePermission(req, "disable_users");
    const body = await req.json().catch(() => null);
    if (!body || typeof body.is_active !== "boolean") {
      throw new ApiError(400, "is_active must be a boolean");
    }

    const db = getDatabase();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(params.id) as any;
    if (!user) throw new ApiError(404, "User not found");

    const nextActive = body.is_active ? 1 : 0;
    if (user.is_active === nextActive) {
      return NextResponse.json({
        id: user.id,
        email: user.email,
        is_active: user.is_active,
      });
    }

    if (!nextActive && user.id === actor.id) {
      throw new ApiError(400, "You cannot deactivate your own account");
    }

    db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(nextActive, user.id);
    logAudit(db, actor.id, nextActive ? "enable_user" : "disable_user", "user", user.id, {
      email: user.email,
    });

    const row = db
      .prepare("SELECT id, email, full_name, department, is_active, created_at FROM users WHERE id = ?")
      .get(user.id) as any;
    const roles = (
      db
        .prepare(
          "SELECT r.name AS name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? ORDER BY r.name"
        )
        .all(user.id) as { name: string }[]
    ).map((r) => r.name);
    return NextResponse.json({ ...row, roles });
  } catch (err) {
    return errorResponse(err);
  }
}
