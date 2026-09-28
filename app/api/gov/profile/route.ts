import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserRoles } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    const roles = getUserRoles(user.id);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      department: user.department,
      roles,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
