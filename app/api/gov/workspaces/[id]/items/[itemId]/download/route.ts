import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDatabase, UPLOAD_DIR } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { errorResponse } from "@/lib/gov/serialize";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const db = getDatabase();
    const item = db.prepare("SELECT * FROM workspace_items WHERE id = ?").get(params.itemId) as any;
    if (!item || item.workspace_id !== ws.id || !item.file_path) {
      throw new ApiError(404, "File not found in this workspace");
    }
    const absPath = path.join(UPLOAD_DIR, item.file_path);
    if (!fs.existsSync(absPath)) throw new ApiError(404, "File is missing from storage");

    const buffer = fs.readFileSync(absPath);
    const fileName = item.file_name || "download";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": item.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
