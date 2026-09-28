import Link from "next/link";
import { FileText, Landmark, Database, FolderOpen, ArrowRight, Volume2, Mic, BookOpen } from "lucide-react";
import { cn } from "@/lib/public/cn";

export interface ArticleCardData {
  slug: string;
  title: string;
  source_type: string;
  category: string;
  organization?: string;
  year?: number;
  tags: string[];
  summary_simple?: string;
  summary_easy?: string[];
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  paper: FileText,
  policy: Landmark,
  dataset: Database,
  case_study: FolderOpen,
  report: FileText,
};

const TYPE_LABEL: Record<string, string> = {
  paper: "Research paper",
  policy: "Policy",
  dataset: "Dataset",
  case_study: "Case study",
  report: "Report",
};

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const Icon = TYPE_ICON[article.source_type] || FileText;
  const easy = Array.isArray(article.summary_easy) ? article.summary_easy : [];

  return (
    <Link
      href={`/public/research/${article.slug}`}
      className="group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {TYPE_LABEL[article.source_type] || article.source_type}
        </span>
        {article.year ? (
          <span className="text-xs font-medium text-muted-foreground">{article.year}</span>
        ) : null}
      </div>

      <h3 className="mt-3 text-base font-bold leading-snug group-hover:text-land-green">
        {article.title}
      </h3>

      {article.organization ? (
        <p className="mt-1 text-xs text-muted-foreground">{article.organization}</p>
      ) : null}

      <div className="mt-3 flex-1">
        {easy.length > 0 ? (
          <p className="text-sm text-foreground/80">
            <Volume2 className="mr-1 inline h-3.5 w-3.5 text-land-green" />
            {easy[0]}
          </p>
        ) : (
          article.summary_simple && (
            <p className="line-clamp-2 text-sm text-foreground/80">{article.summary_simple}</p>
          )
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded bg-land-green/10 px-1.5 py-0.5 text-[11px] text-land-green">
              {t}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1 text-sm font-semibold text-land-green">
          Read
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}