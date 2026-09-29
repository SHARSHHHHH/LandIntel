import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, encodeSession, sessionCookieOptions, SESSION_COOKIE_NAME, portalForRole } from "@/lib/auth/central";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password } = body ?? {};
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const user = verifyPassword(email, password);
  if (!user) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
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
