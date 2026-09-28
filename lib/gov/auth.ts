import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { getDatabase } from "./db";

const SECRET = process.env.GOV_SECRET_KEY || "dev-only-insecure-key-change-me";
const EXPIRES_IN_MINUTES = 120;

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  is_active: number;
}

export function createAccessToken(subject: string, roles: string[]): string {
  return jwt.sign({ sub: subject, roles }, SECRET, { expiresIn: `${EXPIRES_IN_MINUTES}m` });
}

export function decodeAccessToken(token: string): { sub: string; roles: string[] } | null {
  try {
    return jwt.verify(token, SECRET) as { sub: string; roles: string[] };
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function getCurrentUser(req: NextRequest): AuthUser {
  const token = bearerToken(req);
  if (!token) throw new ApiError(401, "Not authenticated");
  const payload = decodeAccessToken(token);
  if (!payload) throw new ApiError(401, "Invalid or expired token");
  const db = getDatabase();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub) as AuthUser | undefined;
  if (!user || !user.is_active) throw new ApiError(401, "User not found or inactive");
  return user;
}

export function requirePermission(req: NextRequest, permissionCode: string): AuthUser {
  const user = getCurrentUser(req);
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT p.code FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`
    )
    .all(user.id) as { code: string }[];
  const codes = new Set(rows.map((r) => r.code));
  if (!codes.has(permissionCode)) {
    throw new ApiError(403, `Missing required permission: ${permissionCode}`);
  }
  return user;
}

export function getUserRoles(userId: string): string[] {
  const db = getDatabase();
  const rows = db
    .prepare(`SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`)
    .all(userId) as { name: string }[];
  return rows.map((r) => r.name);
}
