import { NextRequest, NextResponse } from "next/server";
import { getDatabase, uid, nowIso, logWorkspaceActivity } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { getAccessibleWorkspace } from "@/lib/gov/workspace";
import { serializeWorkspaceGisLink, errorResponse } from "@/lib/gov/serialize";

/** Links a district (and optionally a sample GIS parcel) from the real GIS module into this workspace. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const body = await req.json();
    if (!body?.geographic_unit_id && !body?.parcel_id) {
      throw new ApiError(400, "A district or parcel is required.");
    }
    const db = getDatabase();
    const id = uid();
    db.prepare(
      `INSERT INTO workspace_gis_links (id, workspace_id, geographic_unit_id, parcel_id, label, note, added_by, added_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, ws.id, body.geographic_unit_id || null, body.parcel_id || null, body.label || null, body.note || null, user.id, nowIso());
    logWorkspaceActivity(db, ws.id, user.id, "gis_link_added", `Linked ${body.label || "a GIS area/parcel"} to this workspace.`);
    const row = db.prepare("SELECT * FROM workspace_gis_links WHERE id = ?").get(id);
    return NextResponse.json(serializeWorkspaceGisLink(row));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requirePermission(req, "manage_workspaces");
    const ws = getAccessibleWorkspace(params.id, user);
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get("link_id");
    if (!linkId) throw new ApiError(400, "link_id is required.");
    const db = getDatabase();
    const link = db.prepare("SELECT * FROM workspace_gis_links WHERE id = ?").get(linkId) as any;
    if (!link || link.workspace_id !== ws.id) throw new ApiError(404, "Link not found in this workspace");
    db.prepare("DELETE FROM workspace_gis_links WHERE id = ?").run(linkId);
    return NextResponse.json({ status: "removed" });
  } catch (err) {
    return errorResponse(err);
  }
}
