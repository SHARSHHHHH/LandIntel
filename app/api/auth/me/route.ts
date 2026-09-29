import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/central";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { email: session.email, name: session.name, role: session.role, kind: session.kind },
  });
}
