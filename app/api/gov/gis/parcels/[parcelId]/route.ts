import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { getLandRecordAdapter } from "@/lib/gov/gis/adapters";

/**
 * Full parcel record (owners, record ID, mutation/dispute status, extra
 * state-specific fields, history), plus the real geographic_units id for
 * its district (districtGeoId) so the Evidence & Research hub can link back
 * to this exact parcel on the GIS map.
 */
export async function GET(req: NextRequest, { params }: { params: { parcelId: string } }) {
  try {
    requirePermission(req, "view_area_overview");
    const stateCode = params.parcelId.split("-")[0];
    const adapter = getLandRecordAdapter(stateCode);
    const parcel = adapter.getParcelDetail(params.parcelId);
    if (!parcel) throw new ApiError(404, "Parcel not found");

    let districtGeoId: string | null = null;
    if (parcel.districtCode) {
      const db = getDatabase();
      const row = db.prepare("SELECT id FROM geographic_units WHERE code = ? AND level = 'district'").get(parcel.districtCode) as
        | { id: string }
        | undefined;
      districtGeoId = row?.id ?? null;
    }

    return NextResponse.json({ ...parcel, districtGeoId });
  } catch (err) {
    return errorResponse(err);
  }
}
