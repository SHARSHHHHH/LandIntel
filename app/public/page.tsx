import Link from "next/link";
import { ArrowRight, Map as MapIcon, BookOpen, LayoutDashboard } from "lucide-react";
import { getDatabase } from "@/lib/public/db";
import { AskBar } from "@/components/public/ask-bar";
import { StatCard } from "@/components/public/ui/stat-card";
import { ArticleCard } from "@/components/public/ui/article-card";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const db = getDatabase();
  const metrics = db
    .prepare("SELECT label, value, context, emphasis, sort_order FROM national_metrics ORDER BY sort_order")
    .all() as any[];
  const featured = db
    .prepare("SELECT slug, title, source_type, category, organization, year, tags, summary_simple, summary_easy FROM public_articles WHERE is_public = 1 ORDER BY year DESC LIMIT 6")
    .all() as any[];
  return {
    metrics: metrics.map((m) => ({ ...m, keywords: undefined })),
    articles: featured.map((a) => ({ ...a, tags: JSON.parse(a.tags || "[]"), summary_easy: JSON.parse(a.summary_easy || "[]") })),
  };
}

export default async function HomePage() {
  const { metrics, articles } = await getHomeData();

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-land-green/10 to-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-14 pt-16 text-center">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-land-green shadow-sm">
            National Digital Platform · Research, Policy & Evidence for Land Governance
          </span>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Understand India&apos;s land.{" "}
            <span className="text-land-green">One question at a time.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Ask in plain language, explore maps, read easy summaries of research and policies —
            built for every citizen, not just GIS experts.
          </p>
          <div className="mt-8 w-full">
            <AskBar />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((m, i) => (
            <StatCard key={m.label} label={m.label} value={m.value} context={m.context} emphasis={i === 0} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: MapIcon,
              href: "/public/atlas",
              title: "Explore the Atlas",
              desc: "Click any state to read its land story — records, disputes, climate.",
            },
            {
              icon: BookOpen,
              href: "/public/research",
              title: "Research Library",
              desc: "Papers, policies and case studies — at three reading levels.",
            },
            {
              icon: LayoutDashboard,
              href: "/public/dashboards",
              title: "Live Dashboards",
              desc: "Disputes and land use with a plain-language takeaway under each.",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-land-green/10 text-land-green">
                <c.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold group-hover:text-land-green">{c.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.desc}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-land-green">
                Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Latest research & policies</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fresh from the national land knowledge ecosystem.</p>
            </div>
            <Link href="/public/research" className="hidden text-sm font-semibold text-land-green sm:block">
              View all →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}