import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { logAudit } from "@/lib/admin/audit";

function loadUser(id: string) {
  const db = getDatabase();
  const user = db
    .prepare("SELECT id, email, full_name, department, is_active, created_at FROM users WHERE id = ?")
    .get(id) as any;
  if (!user) return null;
  const roles = (
    db
      .prepare(
        "SELECT r.name AS name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? ORDER BY r.name"
      )
      .all(id) as { name: string }[]
  ).map((r) => r.name);
  return { ...user, roles };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requirePermission(req, "view_users");
    const user = loadUser(params.id);
    if (!user) throw new ApiError(404, "User not found");
    return NextResponse.json(user);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = requirePermission(req, "manage_users");
    const db = getDatabase();
    const before = db.prepare("SELECT * FROM users WHERE id = ?").get(params.id) as any;
    if (!before) throw new ApiError(404, "User not found");

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new ApiError(400, "Request body is required");

    const hasFullName = Object.prototype.hasOwnProperty.call(body, "full_name");
    const hasDepartment = Object.prototype.hasOwnProperty.call(body, "department");
    if (!hasFullName && !hasDepartment) throw new ApiError(400, "No changes supplied");

    const fullName = hasFullName
      ? body.full_name === null || body.full_name === ""
        ? null
        : String(body.full_name).trim()
      : before.full_name;
    const department = hasDepartment
      ? body.department === null || body.department === ""
        ? null
        : String(body.department).trim()
      : before.department;

    if (fullName === before.full_name && department === before.department) {
      return NextResponse.json(loadUser(params.id));
    }

    db.prepare("UPDATE users SET full_name = ?, department = ? WHERE id = ?").run(
      fullName,
      department,
      params.id
    );
    logAudit(db, actor.id, "update_user", "user", params.id, {
      email: before.email,
      before: { full_name: before.full_name, department: before.department },
      after: { full_name: fullName, department },
    });
    return NextResponse.json(loadUser(params.id));
  } catch (err) {
    return errorResponse(err);
  }
}
