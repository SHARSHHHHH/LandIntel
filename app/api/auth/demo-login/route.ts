import { NextRequest, NextResponse } from "next/server";
import { DEMO_IDENTITIES, encodeSession, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/central";

/**
 * "Continue as ... demo user" - logs straight into one portal's existing
 * seeded demo account (no password). For the Government portal this also
 * mints that portal's own bearer token (its API routes are JWT-gated,
 * independent of the central session) so the client can drop it into
 * localStorage exactly like the portal's own login form already does.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const portal = body?.portal as "gov" | "research" | "public" | undefined;
  if (!portal || !DEMO_IDENTITIES[portal]) {
    return NextResponse.json({ error: "Unknown portal." }, { status: 400 });
  }

  const identity = DEMO_IDENTITIES[portal];
  const token = encodeSession({
    userId: `demo-${portal}`,
    email: identity.email,
    name: identity.name,
    role: identity.role,
    kind: "demo",
    issuedAt: Date.now(),
  });

  let govToken: string | null = null;
  if (portal === "gov") {
    try {
      const { getDatabase } = await import("@/lib/gov/db");
      const { createAccessToken, getUserRoles } = await import("@/lib/gov/auth");
      const db = getDatabase();
      const user = db.prepare("SELECT id FROM users WHERE email = ?").get(identity.email) as
        | { id: string }
        | undefined;
      if (user) {
        const roles = getUserRoles(user.id);
        govToken = createAccessToken(user.id, roles);
      }
    } catch {
      govToken = null;
    }
  }

  const res = NextResponse.json({
    user: { email: identity.email, name: identity.name, role: identity.role },
    redirect: portal === "gov" ? "/gov/dashboard" : `/${portal}`,
    govToken,
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return res;
}
