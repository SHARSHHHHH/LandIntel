import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  createUser,
  encodeSession,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  portalForRole,
  type PortalRole,
} from "@/lib/auth/central";

/**
 * Central sign-up. New accounts default to the Public/Citizen role; the
 * signup form also offers Researcher/Academic. Government/Policy is
 * deliberately NOT offered here - see the "Sign up" panel on /login and the
 * project report for why (a government portal should not let anyone
 * self-register as a policy official; that role stays demo-login-only).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, password, role } = body ?? {};

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  const requestedRole: PortalRole = role === "RESEARCHER" ? "RESEARCHER" : "PUBLIC";

  let user;
  try {
    user = createUser({ name, email, password, role: requestedRole });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not create account." }, { status: 409 });
  }

  // Mirror the new account into the relevant portal database so that
  // portal's own getCurrentUser()-style helper can find a real row for it,
  // exactly the way the pre-existing demo users work.
  if (requestedRole === "RESEARCHER") {
    try {
      const { getDatabase } = await import("@/lib/research/db");
      const db = getDatabase();
      const now = new Date().toISOString();
      const researchUserId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO users (id, email, name, platform_role, created_at, updated_at) VALUES (?, ?, ?, 'RESEARCH_ACADEMIC', ?, ?)`
      ).run(researchUserId, user.email, user.name, now, now);
      db.prepare(
        `INSERT INTO research_profiles (id, user_id, academic_type, institution, department, designation, research_interests, expertise, bio, verification_status)
         VALUES (?, ?, 'RESEARCHER', 'Independent / Unaffiliated', NULL, NULL, '[]', '[]', NULL, 0)`
      ).run(crypto.randomUUID(), researchUserId);
    } catch {
      // Non-fatal: the central account still works, the researcher portal
      // will just fall back to its demo user until this succeeds.
    }
  }

  const token = encodeSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    kind: "account",
    issuedAt: Date.now(),
  });

  const res = NextResponse.json({ user, redirect: `/${portalForRole(user.role)}` });
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return res;
}
