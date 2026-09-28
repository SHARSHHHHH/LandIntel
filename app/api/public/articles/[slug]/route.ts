import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/public/db";

export async function GET(
  _req: NextRequest,
  context: { params: Record<string, string> }
) {
  const slug = context.params.slug;
  const db = getDatabase();

  const article = db
    .prepare("SELECT * FROM public_articles WHERE slug = ? AND is_public = 1")
    .get(slug) as any;

  if (!article) {
    return NextResponse.json({ success: false, error: "Article not found" }, { status: 404 });
  }

  const clean = {
    slug: article.slug,
    title: article.title,
    source_type: article.source_type,
    category: article.category,
    organization: article.organization,
    year: article.year,
    tags: JSON.parse(article.tags || "[]"),
    summary_easy: JSON.parse(article.summary_easy || "[]"),
    summary_simple: article.summary_simple,
    summary_deep: article.summary_deep,
    key_stats: JSON.parse(article.key_stats || "[]"),
    takeaways: JSON.parse(article.takeaways || "[]"),
    content_doc: article.content_doc,
  };

  return NextResponse.json({ success: true, data: { article: clean } });
}