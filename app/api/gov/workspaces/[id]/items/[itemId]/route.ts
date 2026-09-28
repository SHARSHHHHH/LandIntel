import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDatabase, UPLOAD_DIR } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { errorResponse } from "@/lib/gov/serialize";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const db = getDatabase();
    const item = db.prepare("SELECT * FROM workspace_items WHERE id = ?").get(params.itemId) as any;
    if (!item || item.workspace_id !== ws.id) throw new ApiError(404, "Item not found in this workspace");
    if (item.file_path) {
      const absPath = path.join(UPLOAD_DIR, item.file_path);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    }
    db.prepare("DELETE FROM workspace_items WHERE id = ?").run(params.itemId);
    return NextResponse.json({ status: "deleted" });
  } catch (err) {
    return errorResponse(err);
  }
}
