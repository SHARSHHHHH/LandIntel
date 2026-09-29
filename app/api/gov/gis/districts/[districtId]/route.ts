import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission, ApiError } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";
import { getLandRecordAdapter } from "@/lib/gov/gis/adapters";

/**
 * Sub-district (Tehsil/Taluk/Mandal) -> Village hierarchy for a district,
 * plus per-state terminology. District itself is the real seeded
 * geographic_units row; everything below it comes from the GIS adapter and
 * is SAMPLE data unless a real state adapter has been registered.
 */
export async function GET(req: NextRequest, { params }: { params: { districtId: string } }) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const district = db.prepare("SELECT * FROM geographic_units WHERE id = ?").get(params.districtId) as any;
    if (!district) throw new ApiError(404, "District not found");
    const state = district.parent_id
      ? (db.prepare("SELECT * FROM geographic_units WHERE id = ?").get(district.parent_id) as any)
      : null;
    const stateCode: string = state?.code ?? String(district.code ?? "").split("-")[0];
    const stateName: string = state?.name ?? "State";

    const adapter = getLandRecordAdapter(stateCode);
    const terminology = adapter.getTerminology(stateCode);
    const districtCode = String(district.code ?? "");
    const subDistricts = adapter.getHierarchy(districtCode);

    return NextResponse.json({
      district: { id: district.id, name: district.name, code: district.code },
      state: { name: stateName, code: stateCode },
      terminology,
      supported: subDistricts !== null,
      subDistricts: subDistricts ?? [],
      message:
        subDistricts === null
          ? `No ${terminology.subDistrictTerm.toLowerCase()}/${terminology.villageTerm.toLowerCase()}/parcel-level sample data available for ${district.name} yet. Pilot sample coverage currently exists for Jaipur (RJ), Ludhiana (PB), Chennai (TN), Bengaluru Urban (KA) and Hyderabad (TS).`
          : null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
