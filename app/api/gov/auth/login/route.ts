import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/gov/db";
import { createAccessToken, getUserRoles } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function POST(req: NextRequest) {
  try {
    let email: string | undefined;
    let password: string | undefined;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      email = body.email ?? body.username;
      password = body.password;
    } else {
      const form = await req.formData();
      email = String(form.get("username") ?? form.get("email") ?? "");
      password = String(form.get("password") ?? "");
    }

    const db = getDatabase();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !bcrypt.compareSync(password ?? "", user.password_hash)) {
      return NextResponse.json({ detail: "Incorrect email or password" }, { status: 401 });
    }
    if (!user.is_active) {
      return NextResponse.json({ detail: "Account is inactive" }, { status: 401 });
    }
    const roles = getUserRoles(user.id);
    const token = createAccessToken(user.id, roles);
    return NextResponse.json({ access_token: token, token_type: "bearer", roles });
  } catch (err) {
    return errorResponse(err);
  }
}
