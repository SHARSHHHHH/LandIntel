import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getDatabase, uid, nowIso, UPLOAD_DIR, MAX_UPLOAD_SIZE_MB } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspaceItem, errorResponse } from "@/lib/gov/serialize";

/**
 * Real file upload for the Collaborative Workspace -- an officer attaches
 * an actual document (survey PDF, photo, spreadsheet) to a workspace. The
 * file is written to disk under uploads/gov/<workspace_id>/, keyed by a
 * generated id so two uploads with the same filename never collide; only
 * that path plus the real filename/size/type are stored in the DB. Ported
 * 1:1 from the original FastAPI upload handler.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new ApiError(400, "No file provided");

    const maxBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > maxBytes) {
      throw new ApiError(413, `File exceeds the ${MAX_UPLOAD_SIZE_MB} MB upload limit`);
    }

    const workspaceDir = path.join(UPLOAD_DIR, ws.id);
    fs.mkdirSync(workspaceDir, { recursive: true });

    const originalName = file.name || "upload";
    const ext = path.extname(originalName);
    const storedName = `${crypto.randomUUID().replace(/-/g, "")}${ext}`;
    const absPath = path.join(workspaceDir, storedName);
    fs.writeFileSync(absPath, buffer);

    const db = getDatabase();
    const id = uid();
    db.prepare(
      `INSERT INTO workspace_items
       (id, workspace_id, item_type, title, reference_id, file_path, file_name, file_size, mime_type, created_by, created_at)
       VALUES (?, ?, 'file', ?, NULL, ?, ?, ?, ?, ?, ?)`
    ).run(id, ws.id, originalName, `${ws.id}/${storedName}`, originalName, buffer.length, file.type || null, user.id, nowIso());

    const row = db.prepare("SELECT * FROM workspace_items WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspaceItem(row));
  } catch (err) {
    return errorResponse(err);
  }
}
