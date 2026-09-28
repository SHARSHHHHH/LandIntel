import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/public/db";

export async function GET(req: NextRequest) {
  const db = getDatabase();
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "";
  const type = url.searchParams.get("type") || "";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  let sql = "SELECT id, slug, title, source_type, category, organization, year, tags, summary_simple FROM public_articles WHERE is_public = 1";
  const params: string[] = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (type) {
    sql += " AND source_type = ?";
    params.push(type);
  }
  sql += " ORDER BY year DESC";

  const articles = db.prepare(sql).all(...params) as any[];

  const mapped = articles
    .map((a) => ({ ...a, tags: JSON.parse(a.tags || "[]") }))
    .filter((a) => {
      if (!q) return true;
      const hay = `${a.title} ${a.summary_simple} ${a.tags.join(" ")} ${a.organization} ${a.category}`.toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    });

  const categories = () =>
    (db.prepare("SELECT DISTINCT category FROM public_articles WHERE is_public = 1").all() as any[]).map((c) => c.category);
  const types = () =>
    (db.prepare("SELECT DISTINCT source_type FROM public_articles WHERE is_public = 1").all() as any[]).map((c) => c.source_type);

  return NextResponse.json({
    success: true,
    data: { articles: mapped, categories: categories(), types: types() },
  });
}