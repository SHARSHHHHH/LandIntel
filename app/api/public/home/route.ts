import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/public/db";

export async function GET() {
  const db = getDatabase();

  const metrics = db
    .prepare("SELECT label, value, context, emphasis, sort_order FROM national_metrics ORDER BY sort_order")
    .all() as any[];

  const featured = db
    .prepare(
      "SELECT slug, title, source_type, category, organization, year, tags, summary_simple FROM public_articles WHERE is_public = 1 ORDER BY year DESC LIMIT 6"
    )
    .all() as any[];

  const mapped = featured.map((a) => ({
    ...a,
    tags: JSON.parse(a.tags || "[]"),
  }));

  return NextResponse.json({ success: true, data: { metrics, articles: mapped } });
}