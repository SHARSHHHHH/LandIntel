import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { getLandRecordAdapter } from "@/lib/gov/gis/adapters";

/**
 * Search across Survey/Khasra/Patta/Parcel number, village name, owner name
 * and record ID, across every pilot district's SAMPLE parcel data. Each
 * result also carries the real geographic_units district id it belongs to,
 * so the UI can navigate straight to it.
 */
export async function GET(req: NextRequest) {
  try {
    requirePermission(req, "view_area_overview");
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const adapter = getLandRecordAdapter(null);
    const results = adapter.searchParcels(q);

    const db = getDatabase();
    const withRealDistrictId = results.map((r) => {
      const districtRow = db.prepare("SELECT id FROM geographic_units WHERE code = ? AND level = 'district'").get(r.districtId) as
        | { id: string }
        | undefined;
      return { ...r, districtGeoId: districtRow?.id ?? null };
    });

    return NextResponse.json(withRealDistrictId);
  } catch (err) {
    return errorResponse(err);
  }
}
