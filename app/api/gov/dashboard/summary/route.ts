import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { getCurrentUser } from "@/lib/gov/auth";
import {
  serializeGeographicUnit,
  serializeSavedSearch,
  serializeReport,
  serializeWorkspace,
  errorResponse,
} from "@/lib/gov/serialize";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    const db = getDatabase();

    const viewEvents = db
      .prepare(
        "SELECT * FROM audit_logs WHERE user_id = ? AND action = 'view_area_overview' ORDER BY created_at DESC LIMIT 50"
      )
      .all(user.id) as any[];
    const seenAreas = new Map<string, any>();
    for (const ev of viewEvents) {
      if (!seenAreas.has(ev.resource_id)) seenAreas.set(ev.resource_id, ev);
      if (seenAreas.size >= 5) break;
    }
    const recentAreas: any[] = [];
    for (const [areaId, ev] of seenAreas) {
      const area = db.prepare("SELECT * FROM geographic_units WHERE id = ?").get(areaId);
      if (area) recentAreas.push({ area: serializeGeographicUnit(area), last_viewed: ev.created_at });
    }

    const savedSearches = db
      .prepare("SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 5")
      .all(user.id) as any[];

    const recentReports = db
      .prepare("SELECT * FROM reports WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 5")
      .all(user.id) as any[];

    const ownedWs = db.prepare("SELECT * FROM workspaces WHERE owner_id = ?").all(user.id) as any[];
    const memberWsIds = (
      db.prepare("SELECT workspace_id FROM workspace_members WHERE user_id = ?").all(user.id) as any[]
    ).map((m) => m.workspace_id);
    const sharedWs = memberWsIds.length
      ? (db
          .prepare(`SELECT * FROM workspaces WHERE id IN (${memberWsIds.map(() => "?").join(",")})`)
          .all(...memberWsIds) as any[])
      : [];
    const wsSeen = new Map<string, any>();
    for (const ws of [...ownedWs, ...sharedWs]) wsSeen.set(ws.id, ws);
    const workspaces = Array.from(wsSeen.values())
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
      .slice(0, 5);

    const unreadCount = (
      db.prepare("SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0").get(user.id) as any
    ).c;

    return NextResponse.json({
      recent_areas: recentAreas,
      saved_searches: savedSearches.map(serializeSavedSearch),
      recent_reports: recentReports.map(serializeReport),
      workspaces: workspaces.map(serializeWorkspace),
      unread_notification_count: unreadCount,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
