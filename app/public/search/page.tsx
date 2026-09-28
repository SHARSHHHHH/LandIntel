import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { answerQuestion } from "@/lib/public/rag/answer";
import { getDatabase } from "@/lib/public/db";
import { ArticleCard } from "@/components/public/ui/article-card";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();
  if (!q) redirect("/");

  const db = getDatabase();
  const rows = db
    .prepare("SELECT slug, title, source_type, category, organization, year, tags, summary_simple, summary_easy FROM public_articles WHERE is_public = 1")
    .all() as any[];
  const [answer] = await Promise.all([answerQuestion(q)]);
  const articleRows = rows;

  const ql = q.toLowerCase();
  const articleList = articleRows
    .map((a) => ({ ...a, tags: JSON.parse(a.tags || "[]"), summary_easy: JSON.parse(a.summary_easy || "[]") }))
    .filter((a) => a.title.toLowerCase().includes(ql) || a.summary_simple.toLowerCase().includes(ql));

  const featuredSlugs = answer.sources.map((s) => s.slug);
  const others = [...new Set([...articleList, ...articleRows.map((a) => ({ ...a, tags: JSON.parse(a.tags || "[]"), summary_easy: JSON.parse(a.summary_easy || "[]") }))])]
    .filter((a) => !featuredSlugs.includes(a.slug))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-2 text-sm text-muted-foreground">
        Answer for <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
      </div>

      <section className="rounded-2xl border border-land-green/30 bg-gradient-to-br from-land-green/5 to-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-land-green">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-lg font-bold">BhumiKosh AI · Plain-language answer</h2>
        </div>

        {answer.metrics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {answer.metrics.map((m) => (
              <div key={m.label} className="rounded-xl bg-white px-4 py-2 shadow-sm">
                <span className="text-lg font-extrabold text-land-green">{m.value}</span>
                <span className="ml-2 text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {answer.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-land-green text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {answer.sourceCount} source{answer.sourceCount === 1 ? "" : "s"}
          </span>
          <span>·</span>
          <span>retrieved with local AI embeddings</span>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-xl font-extrabold tracking-tight">
          Related research & policy documents
        </h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {answer.sources.map((s) => (
            <div key={s.slug} className="relative">
              <span className="absolute -top-2 right-3 z-10 rounded-full bg-land-green px-2 py-0.5 text-[10px] font-bold text-white">
                TOP MATCH
              </span>
              <MatchedSource slug={s.slug} />
            </div>
          ))}
          {others.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
        </div>
      </section>
    </div>
  );
}

async function MatchedSource({ slug }: { slug: string }) {
  const db = getDatabase();
  const row = db
    .prepare("SELECT slug, title, source_type, category, organization, year, tags, summary_simple, summary_easy FROM public_articles WHERE slug = ? AND is_public = 1")
    .get(slug) as any;
  if (!row) return null;
  return (
    <ArticleCard
      article={{
        ...row,
        tags: JSON.parse(row.tags || "[]"),
        summary_easy: JSON.parse(row.summary_easy || "[]"),
      }}
    />
  );
}