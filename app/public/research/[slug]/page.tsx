import { notFound } from "next/navigation";
import { Landmark, FileText, FolderOpen } from "lucide-react";
import { getDatabase } from "@/lib/public/db";
import { Reader } from "@/components/public/reader";
import { AskBar } from "@/components/public/ask-bar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const db = getDatabase();
  const row = db
    .prepare("SELECT title FROM public_articles WHERE slug = ? AND is_public = 1")
    .get(params.slug) as any;
  return { title: row ? `${row.title} · BhumiKosh` : "Article · BhumiKosh" };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const db = getDatabase();
  const row = db
    .prepare("SELECT * FROM public_articles WHERE slug = ? AND is_public = 1")
    .get(params.slug) as any;

  if (!row) notFound();

  const article = {
    slug: row.slug,
    title: row.title,
    source_type: row.source_type,
    category: row.category,
    organization: row.organization,
    year: row.year,
    tags: JSON.parse(row.tags || "[]"),
    summary_easy: JSON.parse(row.summary_easy || "[]"),
    summary_simple: row.summary_simple,
    summary_deep: row.summary_deep,
    key_stats: JSON.parse(row.key_stats || "[]"),
    takeaways: JSON.parse(row.takeaways || "[]"),
    content_doc: row.content_doc,
  };

  const TypeIcon = row.source_type === "policy" ? Landmark : row.source_type === "case_study" ? FolderOpen : FileText;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold capitalize">
          <TypeIcon className="h-3.5 w-3.5" />
          {row.source_type.replace("_", " ")}
        </span>
        <span>{article.organization}</span>
        <span>·</span>
        <span>{article.year}</span>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{article.title}</h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {article.tags.map((t: string) => (
          <span key={t} className="rounded bg-land-green/10 px-2 py-0.5 text-xs font-medium text-land-green">
            #{t}
          </span>
        ))}
      </div>

      <div className="mt-8">
        <Reader article={article} />
      </div>

      <section className="mt-10 rounded-2xl border bg-secondary/40 p-6">
        <p className="mb-3 text-sm font-semibold">Still curious? Ask BhumiKosh AI.</p>
        <AskBar compact />
      </section>
    </div>
  );
}