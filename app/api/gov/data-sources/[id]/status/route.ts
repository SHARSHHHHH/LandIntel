import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/gov/db";
import { requirePermission } from "@/lib/gov/auth";
import { errorResponse } from "@/lib/gov/serialize";

/**
 * Live health check, ported from the original DataSourceAdapter registry
 * (app/adapters/*.py). Only two upstream adapters existed there: a
 * dependency-free SampleDataAdapter (always "configured/reachable"), and a
 * DataGovInAdapter gated on a DATA_GOV_IN_API_KEY env var that was never
 * filled in with a confirmed resource_id -- it always reported itself
 * unconfigured. Same behaviour here, no network call invented.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requirePermission(req, "view_area_overview");
    const db = getDatabase();
    const source = db.prepare("SELECT * FROM data_sources WHERE id = ?").get(params.id) as any;
    if (!source) return NextResponse.json({ error: "not found" });

    if (source.config_ref === "DATA_GOV_IN_API_KEY") {
      const configured = !!process.env.DATA_GOV_IN_API_KEY;
      return NextResponse.json({
        id: source.id,
        db_status: source.status,
        configured,
        reachable: null,
        message: configured
          ? "No confirmed resource_id set for a live district-level dataset"
          : "DATA_GOV_IN_API_KEY not set in .env",
      });
    }

    return NextResponse.json({
      id: source.id,
      db_status: source.status,
      configured: true,
      reachable: true,
      message: "Local sample data",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
