import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspace, serializeWorkspaceItem, errorResponse } from "@/lib/gov/serialize";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const db = getDatabase();
    const items = db.prepare("SELECT * FROM workspace_items WHERE workspace_id = ? ORDER BY created_at DESC").all(ws.id) as any[];
    return NextResponse.json({
      ...serializeWorkspace(ws),
      items: items.map(serializeWorkspaceItem),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
