"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ArticleCard, ArticleCardData } from "@/components/public/ui/article-card";
import { Pill } from "@/components/public/ui/stat-card";
import { BASE_PATH } from "@/lib/public/base-path";

const SOURCE_TYPES = ["paper", "policy", "case_study", "report"];

export default function ResearchPage() {
  const [articles, setArticles] = useState<ArticleCardData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cat, setCat] = useState("all");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (cat !== "all") params.set("category", cat);
    if (type !== "all") params.set("type", type);
    if (q.trim()) params.set("q", q.trim());

    fetch(`${BASE_PATH}/api/public/articles?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.success) return;
        setArticles(d.data.articles);
        setCategories(d.data.categories || []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cat, type, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Research Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Papers, policies, case studies and reports — every document in three reading levels.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the library…"
          className="w-full rounded-xl border bg-card px-4 py-2.5 text-sm outline-none focus:border-land-green md:w-72"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Pill active={type === "all"} onClick={() => setType("all")}>All types</Pill>
        {SOURCE_TYPES.map((t) => (
          <Pill key={t} active={type === t} onClick={() => setType(t)}>
            {t.replace("_", " ")}
          </Pill>
        ))}
        <span className="mx-2 hidden w-px bg-border sm:block" />
        <Pill active={cat === "all"} onClick={() => setCat("all")}>All topics</Pill>
        {categories.map((c) => (
          <Pill key={c} active={cat === c} onClick={() => setCat(c)}>
            {c.replace(/-/g, " ")}
          </Pill>
        ))}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> <span className="ml-2">Loading…</span>
          </div>
        ) : articles.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No documents match this filter.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}